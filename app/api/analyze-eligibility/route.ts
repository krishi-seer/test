import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * POST /api/analyze-eligibility
 * 
 * AI-driven eligibility engine:
 * 1. Takes user profile (landSize, cropType, region, income)
 * 2. Fetches active schemes from Supabase
 * 3. Uses Llama 3 (via Groq) to intelligently match and prioritize
 * 4. Returns ranked recommendations with detailed reasoning
 */
export async function POST(req: NextRequest) {
  try {
    const { profile } = await req.json();

    if (!profile) {
      return Response.json({ error: "Profile required" }, { status: 400 });
    }

    // Step 1: Fetch active schemes
    const { data: schemes, error: fetchErr } = await supabase
      .from("schemes_insert")
      .select("*")
      .eq("archived", false);

    if (fetchErr) {
      return Response.json({ error: "DB fetch failed" }, { status: 500 });
    }

    // Step 2: Prepare context for LLM
    const schemesContext = schemes.map(s => ({
      id: s.id,
      name: s.name || s.scheme_name,
      description: s.description,
      tags: s.tags,
      state: s.state
    }));

    // Step 3: Ask LLM to rank and summarize
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile", // Use 70b for better reasoning
        messages: [
          {
            role: "system",
            content: `You are Krishi Seer's AI Eligibility Expert. 
            You must analyze a farmer's profile and recommend the best government schemes.
            - Only recommend schemes that logically fit their land size, location, and crops.
            - For each recommended scheme, provide a 1-sentence "Why this fits you" reason.
            - Rank them from 1 to 5.
            - Return JSON ONLY in this format: { recommendations: [{ id, reason, matchScore }] }`
          },
          {
            role: "user",
            content: `Farmer Profile: ${JSON.stringify(profile)}
            Available Schemes: ${JSON.stringify(schemesContext.slice(0, 30))}`
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: "LLM failed", details: err }, { status: 500 });
    }

    const aiResponse = await res.json();
    const result = JSON.parse(aiResponse.choices[0].message.content);

    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
