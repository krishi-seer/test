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

    // Step 1: Extract Soil Data using Vision AI (Elite Model Upgrade)
    const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an elite Soil Scientist and Document OCR expert for the Indian Ministry of Agriculture. 
            Analyze the provided image of a Soil Health Card (SHC). 
            
            1. OCR Extraction: Look for values of Nitrogen (N), Phosphorus (P), Potassium (K), pH Level, and Organic Carbon (OC). 
            Note: Labels may be in Hindi (नाइट्रोजन, फास्फोरस, पोटाश) or Odia (ନାଇଟ୍ରୋଜେନ୍, ଫସଫରସ୍).
            
            2. Scientific Insight: Based on these levels, provide a concise fertilizer recommendation (1-2 sentences) in simple farmer-friendly language.
            
            3. Actionable List: List 3-4 specific fertilizer names (e.g., Urea, DAP, MOP, SSP).

            Return ONLY a valid JSON object:
            {
              "metrics": { "N": "Value + Unit", "P": "Value + Unit", "K": "Value + Unit", "pH": "Value", "OC": "Value + %" },
              "recommendation": "Simple advice here...",
              "suggested_fertilizers": ["Urea", "DAP", "etc"]
            }
            
            If the image is not a Soil Health Card, return error: "INVALID_DOCUMENT"`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract metrics and recommendations from this Soil Health Card image." },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    });

    if (!visionRes.ok) {
      const errorData = await visionRes.json().catch(() => ({}));
      return Response.json({ 
        error: "Vision AI Analysis Failed", 
        details: errorData?.error?.message || visionRes.statusText 
      }, { status: 500 });
    }

    const visionData = await visionRes.json();
    const content = JSON.parse(visionData.choices[0].message.content);

    if (content.error === "INVALID_DOCUMENT") {
      return Response.json({ error: "The provided image does not look like a Soil Health Card. Please upload a clearer document." }, { status: 400 });
    }

    const extraction = content;

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
