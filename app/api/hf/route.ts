import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;

const ZERO_SHOT_MODEL = "openai/clip-vit-base-patch32"; // zero-shot image classification
const FALLBACK_MODEL = "google/vit-base-patch16-224"; // generic image classification

const CROP_LABELS = [
  // Cereals
  "rice",
  "wheat",
  "maize",
  "corn",
  "barley",
  "millet",
  "ragi",
  "sorghum",
  // Cash crops
  "sugarcane",
  "cotton",
  // Oilseeds and pulses
  "soybean",
  "mustard",
  "groundnut",
  "chickpea",
  "pigeon pea",
  // Horticulture popular
  "banana",
  "potato",
  "onion",
];

function parseBase64Data(dataUrl: string): { mime: string; buffer: Buffer } {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) throw new Error("Invalid data URL");
  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  return { mime, buffer };
}

export async function POST(req: NextRequest) {
  try {
    if (!HF_TOKEN) {
      return new Response(JSON.stringify({ error: "Missing HUGGING_FACE_TOKEN" }), { status: 500 });
    }

    const body = await req.json();
    const imageBase64: string | undefined = body?.imageBase64;
    const userId: string | undefined = body?.userId || undefined;
    const latitude: number | undefined = typeof body?.latitude === "number" ? body.latitude : undefined;
    const longitude: number | undefined = typeof body?.longitude === "number" ? body.longitude : undefined;
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), { status: 400 });
    }

    // First attempt: zero-shot image classification (plant vs not, then crop types)
    let isPlant = false;
    let cropLabel: string | null = null;
    let confidence = 0;
    const CONF_THRESHOLD = 0.7;

    try {
      const zeroShotResp = await fetch(`https://api-inference.huggingface.co/models/${ZERO_SHOT_MODEL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
          "X-Use-Cache": "false",
          "x-wait-for-model": "true",
        },
        body: JSON.stringify({
          inputs: imageBase64,
          parameters: { candidate_labels: ["plant", "person", "animal", "object", "landscape"] },
        }),
      });

      if (zeroShotResp.ok) {
        const res = await zeroShotResp.json();
        // res: [{label, score}, ...]
        const top = Array.isArray(res) && res.length > 0 ? res[0] : null;
        if (top && typeof top.label === "string") {
          isPlant = top.label.toLowerCase().includes("plant") && top.score >= CONF_THRESHOLD;
        }

        if (isPlant) {
          const cropResp = await fetch(`https://api-inference.huggingface.co/models/${ZERO_SHOT_MODEL}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${HF_TOKEN}`,
              "Content-Type": "application/json",
              "X-Use-Cache": "false",
              "x-wait-for-model": "true",
            },
            body: JSON.stringify({ inputs: imageBase64, parameters: { candidate_labels: CROP_LABELS } }),
          });
          if (cropResp.ok) {
            const cropRes = await cropResp.json();
            const best = Array.isArray(cropRes) && cropRes[0] ? cropRes[0] : null;
            if (best) {
              // Standardize crop labels to a friendly form
              const raw = String(best.label || "").toLowerCase();
              const normalized = raw.replace(/\s+/g, " ").trim();
              // Map common synonyms
              const synonymMap: Record<string, string> = {
                maize: "corn",
                paddy: "rice",
              };
              const primary = synonymMap[normalized as keyof typeof synonymMap] || normalized;
              cropLabel = primary.charAt(0).toUpperCase() + primary.slice(1);
              confidence = typeof best.score === "number" ? best.score : 0;
            }
          }
        }
      }
    } catch {
      // fallthrough to fallback model below
    }

    // Fallback path: generic image classification; infer plant-ish via label keywords
    if (!isPlant || !cropLabel) {
      try {
        const { buffer } = parseBase64Data(imageBase64);
        const resp = await fetch(`https://api-inference.huggingface.co/models/${FALLBACK_MODEL}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/octet-stream",
            "X-Use-Cache": "false",
            "x-wait-for-model": "true",
          },
          body: new Uint8Array(buffer),
        });
        if (resp.ok) {
          const arr = await resp.json();
          // arr: [{label, score}, ...]
          const top = Array.isArray(arr) && arr[0] ? arr[0] : null;
          const labels = (Array.isArray(arr) ? arr : []).map((x: any) => String(x.label || "").toLowerCase());
          const plantHints = ["plant", "leaf", "tree", "flower", "field", "vegetation", "corn", "wheat", "rice", "maize"];
          isPlant = labels.some((l: string) => plantHints.some((h) => l.includes(h)));
          if (!cropLabel) {
            const found = CROP_LABELS.find((c) => labels.some((l: string) => l.includes(c)));
            if (found) {
              const normalized = found.toLowerCase().trim();
              cropLabel = normalized.charAt(0).toUpperCase() + normalized.slice(1);
            }
          }
          confidence = top?.score ?? confidence;
        }
      } catch {
        // ignore
      }
    }

    // Optional: save analysis to Supabase if credentials are available
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "public";
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        // store as anonymous; if userId provided, include it
        await supabase.from("analyses").insert({
          user_id: userId || null,
          crop_label: cropLabel,
          confidence: confidence,
        });
      }
    } catch {}

    return new Response(
      JSON.stringify({
        isPlant,
        cropLabel,
        confidence,
        latitude,
        longitude,
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Unexpected error" }), { status: 500 });
  }
}


