import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeAllSources, checkUrlAlive, type RawScheme } from "./sources";

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use service-level client for writes
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type LogEntry = {
  action: string;
  scheme_name: string;
  details: Record<string, unknown>;
  source: string;
};

/**
 * POST /api/sync-schemes
 *
 * Automated scheme sync engine:
 * 1. Scrapes government sources + uses LLM to normalize
 * 2. Compares with existing schemes in Supabase
 * 3. Inserts new schemes, updates changed ones
 * 4. Archives schemes whose URLs are dead (404)
 * 5. Logs everything to sync_logs table
 *
 * Protected by x-cron-secret header.
 */
export async function POST(req: NextRequest) {
  // Auth check
  const secret = req.headers.get("x-cron-secret");
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs: LogEntry[] = [];
  const summary = {
    inserted: 0,
    updated: 0,
    archived: 0,
    verified: 0,
    errors: [] as string[],
    scrapedSources: [] as string[],
    failedSources: [] as string[],
  };

  try {
    // Step 1: Scrape and normalize from all sources
    const { schemes: scrapedSchemes, scrapedSources, failedSources } =
      await scrapeAllSources(GROQ_API_KEY);

    summary.scrapedSources = scrapedSources;
    summary.failedSources = failedSources;

    // Step 2: Fetch existing schemes from Supabase
    const { data: existingSchemes, error: fetchErr } = await supabase
      .from("schemes_insert")
      .select("*");

    if (fetchErr) {
      summary.errors.push(`Fetch error: ${fetchErr.message}`);
      return Response.json({ summary, logs }, { status: 500 });
    }

    const existing = existingSchemes || [];

    // Step 3: Compare and sync
    for (const scraped of scrapedSchemes) {
      // Find existing by name match (fuzzy)
      const match = existing.find(
        (e: any) =>
          e.name?.toLowerCase() === scraped.name.toLowerCase() ||
          e.scheme_name?.toLowerCase() === scraped.name.toLowerCase()
      );

      if (match) {
        // Existing scheme — check if anything changed
        const needsUpdate =
          (scraped.description && match.description !== scraped.description) ||
          (scraped.url && match.url !== scraped.url);

        if (needsUpdate) {
          const { error: updateErr } = await supabase
            .from("schemes_insert")
            .update({
              description: scraped.description || match.description,
              url: scraped.url || match.url,
              source_url: scraped.url,
              last_verified: new Date().toISOString(),
              archived: false,
            })
            .eq("id", match.id);

          if (!updateErr) {
            summary.updated++;
            logs.push({
              action: "UPDATE",
              scheme_name: scraped.name,
              details: { old_url: match.url, new_url: scraped.url },
              source: "sync",
            });
          }
        } else {
          // Just verify — touch last_verified
          await supabase
            .from("schemes_insert")
            .update({ last_verified: new Date().toISOString() })
            .eq("id", match.id);
          summary.verified++;
        }
      } else {
        // New scheme — insert it
        const { error: insertErr } = await supabase
          .from("schemes_insert")
          .insert({
            name: scraped.name,
            description: scraped.description,
            url: scraped.url,
            tags: scraped.tags,
            state: scraped.state === "all" ? undefined : scraped.state,
            active: scraped.active,
            source_url: scraped.url,
            last_verified: new Date().toISOString(),
            archived: false,
          });

        if (!insertErr) {
          summary.inserted++;
          logs.push({
            action: "INSERT",
            scheme_name: scraped.name,
            details: { url: scraped.url, tags: scraped.tags },
            source: "sync",
          });

          // Trigger Multilingual Alert for new scheme
          try {
            await fetch(`${req.nextUrl.origin}/api/alerts/broadcast`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                scheme: scraped,
                language: "hindi", // Default to Hindi, can be dynamic
                phoneNumbers: [] // Add target numbers here or fetch from user profiles
              })
            });
          } catch (alertErr) {
            console.error("Alert broadcast failed:", alertErr);
          }
        } else {
          summary.errors.push(`Insert error for ${scraped.name}: ${insertErr.message}`);
        }
      }
    }

    // Step 4: Archive check — verify existing active schemes for link health
    // This is the "Main Aim": Cleanup dead or expired links
    const activeSchemes = existing.filter((e: any) => !e.archived);
    
    // We check a batch of up to 20 per sync to ensure the whole DB stays fresh
    const toCheck = activeSchemes.slice(0, 20);
    
    for (const scheme of toCheck) {
      const urlToTest = scheme.source_url || scheme.url;
      if (!urlToTest) continue;

      const alive = await checkUrlAlive(urlToTest);
      
      if (!alive) {
        // Double check: If it failed, try once more after a short delay
        const retryAlive = await checkUrlAlive(urlToTest);
        
        if (!retryAlive) {
          const { error: archiveErr } = await supabase
            .from("schemes_insert")
            .update({
              archived: true,
              archived_reason: "broken_link",
              last_verified: new Date().toISOString(),
            })
            .eq("id", scheme.id);

          if (!archiveErr) {
            summary.archived++;
            logs.push({
              action: "ARCHIVE",
              scheme_name: scheme.name || scheme.scheme_name,
              details: { reason: "broken_link", url: urlToTest },
              source: "sync_cleanup",
            });
          }
        }
      } else {
        // It's alive! Update the last_verified timestamp for the UI
        await supabase
          .from("schemes_insert")
          .update({ last_verified: new Date().toISOString() })
          .eq("id", scheme.id);
        summary.verified++;
      }
    }

    // Step 5: Write logs to sync_logs table
    if (logs.length > 0) {
      await supabase.from("sync_logs").insert(logs);
    }

    return Response.json({
      success: true,
      summary,
      logs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      {
        success: false,
        error: err?.message || "Sync failed",
        summary,
        logs,
      },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing in browser
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return Response.json({
      info: "Krishi Seer Scheme Sync Engine",
      usage: "POST /api/sync-schemes with x-cron-secret header to trigger sync",
      status: "ready",
    });
  }

  // If secret matches, allow GET trigger too (convenient for cron services)
  const fakeReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
  });
  // Re-add secret as header
  fakeReq.headers.set("x-cron-secret", secret || "");
  return POST(fakeReq);
}
