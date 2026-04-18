import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const groq = new Groq({ apiKey: GROQ_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizeImageUrl(image: string) {
  if (typeof image !== "string") return "";
  if (image.startsWith("data:image/")) return image;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return image;
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    const imageUrl = normalizeImageUrl(image);
    if (!imageUrl) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const prompt = `You are an expert soil scientist. The uploaded image may be any Soil Health Card or report card format from India, in English, Hindi, Odia, or mixed languages. Extract the numeric values for Nitrogen (N), Phosphorus (P), Potassium (K), pH, and Organic Carbon (OC) wherever they appear in the document. Values may be in tables, charts, or free-form report text. Provide clear farmer-friendly fertilizer guidance based on the extracted values, and list 3-4 practical fertilizer names.

Return the result as a JSON object with this exact structure:
{
  "metrics": {
    "N": "value or N/A",
    "P": "value or N/A", 
    "K": "value or N/A",
    "pH": "value or N/A",
    "OC": "value or N/A"
  },
  "recommendation": "farmer-friendly advice based on the metrics",
  "suggested_fertilizers": ["fertilizer1", "fertilizer2", "fertilizer3"]
}`;

    const chatCompletion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.2,
    });

    const assistantMessage = chatCompletion.choices?.[0]?.message;
    const textResult = typeof assistantMessage?.content === "string" ? assistantMessage.content : null;

    if (!textResult) {
      return NextResponse.json({ error: "Unable to extract soil health metrics from this image." }, { status: 500 });
    }

    const jsonStart = textResult.indexOf("{");
    const jsonEnd = textResult.lastIndexOf("}");
    let extraction: any = null;

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      try {
        extraction = JSON.parse(textResult.slice(jsonStart, jsonEnd + 1));
      } catch (parseError) {
        console.warn("Soil card extraction JSON parse failed, falling back to raw text", parseError);
      }
    }

    if (!extraction) {
      return NextResponse.json({ error: "Unable to extract soil health metrics from this image." }, { status: 500 });
    }

    if (extraction?.error === "INVALID_DOCUMENT") {
      return NextResponse.json({ error: "The provided image does not look like a Soil Health Card. Please upload a clearer document." }, { status: 400 });
    }

    const { data: schemes } = await supabase
      .from("schemes_insert")
      .select("*")
      .contains("tags", ["soil"])
      .eq("archived", false);

    const { data: fertilizerSchemes } = await supabase
      .from("schemes_insert")
      .select("*")
      .contains("tags", ["fertilizer"])
      .eq("archived", false);

    return NextResponse.json({
      ...extraction,
      matching_subsidies: [...(schemes || []), ...(fertilizerSchemes || [])].slice(0, 3)
    });
  } catch (err: any) {
    console.error("Soil card extraction failed:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
