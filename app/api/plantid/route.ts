import { NextRequest } from "next/server";

const PLANT_ID_API_KEY = process.env.PLANT_ID_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!PLANT_ID_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing PLANT_ID_API_KEY" }), { status: 500 });
    }

    const body = await req.json();
    const imageBase64: string | undefined = body?.imageBase64;
    const latitude: number | undefined = typeof body?.latitude === "number" ? body.latitude : undefined;
    const longitude: number | undefined = typeof body?.longitude === "number" ? body.longitude : undefined;
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), { status: 400 });
    }

    // Plant.id expects an array of images (base64 without data URL prefix)
    const match = imageBase64.match(/^data:(.*?);base64,(.*)$/);
    const imagePayload = match ? match[2] : imageBase64;

    const payload: any = {
      images: [imagePayload],
      // Use supported options per Plant.id v3 docs
      health: "all",
      similar_images: true,
      symptoms: true,
      classification_level: "species",
    };
    if (latitude !== undefined && longitude !== undefined) {
      payload.longitude = longitude;
      payload.latitude = latitude;
    }

    const resp = await fetch("https://api.plant.id/v3/identification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PLANT_ID_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ error: `Plant.id error: ${txt}` }), { status: 502 });
    }

    const data = await resp.json();
    // Normalize to a concise shape
    let cropLabel: string | null = null;
    let confidence = 0;
    let isPlant: boolean | null = null;
    const suggestions = Array.isArray(data?.result?.classification?.suggestions)
      ? data.result.classification.suggestions
      : Array.isArray(data?.suggestions)
        ? data.suggestions
        : [];

    if (suggestions.length > 0) {
      const top = suggestions[0];
      const name: string = top?.name || top?.plant_name || "";
      cropLabel = name ? name.charAt(0).toUpperCase() + name.slice(1) : null;
      confidence = typeof top?.probability === "number" ? top.probability : (typeof top?.score === "number" ? top.score : 0);
    }

    const plantProb: number | undefined = (data?.result?.is_plant_probability ?? data?.is_plant_probability) as number | undefined;
    if (typeof plantProb === "number") {
      isPlant = plantProb >= 0.3;
    }

    // Health Assessment (Plant Health / Crop Health)
    // Health data is already included when using health="all"
    let health: any = null;
    try {
      const assessment = data?.result?.health_assessment || data?.health_assessment;
      const isHealthyProbability: number = Number(
        assessment?.is_healthy?.probability ?? assessment?.is_healthy_probability ?? 0
      );
      const diseasesArr = Array.isArray(assessment?.diseases) ? assessment.diseases : [];
      const diseases = diseasesArr
        .map((d: any) => ({
          name: d?.name || d?.disease_details?.name || d?.common_name || "",
          probability: typeof d?.probability === "number" ? d.probability : (typeof d?.score === "number" ? d.score : undefined),
          treatment: d?.treatment || d?.disease_details?.treatment || undefined,
        }))
        .filter((x: any) => x.name);

      // Improved health assessment logic
      let verdict = "healthy";
      
      // Consider multiple factors for health assessment
      if (isHealthyProbability < 0.4) {
        verdict = "unhealthy";
      } else if (isHealthyProbability < 0.7) {
        // Check for specific disease indicators
        const hasSignificantDiseases = diseases.some((d: any) => 
          d.probability && d.probability > 0.3
        );
        verdict = hasSignificantDiseases ? "needs attention" : "moderately healthy";
      }
      
      // Check for serious diseases
      const seriousDiseases = diseases.filter((d: any) => 
        /rot|rotten|mold|blight|decay|wilt|severe|critical/i.test(String(d.name)) && 
        d.probability && d.probability > 0.2
      );
      
      if (seriousDiseases.length > 0) {
        verdict = "requires immediate attention";
      }
      
      // If no diseases detected and high health probability, mark as healthy
      if (diseases.length === 0 && isHealthyProbability > 0.7) {
        verdict = "healthy";
      }
      
      health = { isHealthyProbability, diseases, verdict };
    } catch {}

    return new Response(
      JSON.stringify({
        cropLabel,
        confidence,
        isPlant,
        health,
        raw: data,
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Unexpected error" }), { status: 500 });
  }
}


