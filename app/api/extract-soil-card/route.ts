import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * POST /api/extract-soil-card
 *
 * Vision AI Document Extractor:
 * 1. Accepts a base64 image or image URL.
 * 2. Uses GPT-4o-mini to extract soil metrics (N, P, K, pH, OC).
 * 3. Recommends fertilizers.
 * 4. Searches the `schemes_insert` table for matching subsidies.
 */
export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json(); // base64 data url or image url

    if (!image) {
      return Response.json({ error: "Image required" }, { status: 400 });
    }

    // Step 1: Extract Soil Data using Vision AI
    const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert Soil Chemist. Analyze the provided Soil Health Card image.
            Extract: Nitrogen (N), Phosphorus (P), Potassium (K), pH Level, Organic Carbon (OC).
            Provide fertilizer recommendations based on the soil health.
            Return JSON only: { "metrics": { "N": "", "P": "", "K": "", "pH": "", "OC": "" }, "recommendation": "", "suggested_fertilizers": [] }`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Parse this Soil Health Card and extract key metrics and recommendations." },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        max_tokens: 500,
        response_format: { type: "json_object" }
      }),
    });

    if (!visionRes.ok) {
      return Response.json({ error: "Vision AI Analysis Failed" }, { status: 500 });
    }

    const visionData = await visionRes.json();
    const extraction = JSON.parse(visionData.choices[0].message.content);

    // Step 2: Cross-reference with Schemes DB for subsidies
    // Look for tags like 'soil', 'fertilizer'
    const { data: schemes } = await supabase
      .from("schemes_insert")
      .select("*")
      .contains("tags", ["soil"])
      .eq("archived", false);

    // Filter more for fertilizer specifically if NPK is low
    const fertilizerSchemes = await supabase
      .from("schemes_insert")
      .select("*")
      .contains("tags", ["fertilizer"])
      .eq("archived", false);

    return Response.json({
      ...extraction,
      matching_subsidies: [...(schemes || []), ...(fertilizerSchemes?.data || [])].slice(0, 3)
    });

  } catch (err: any) {
    return Response.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
