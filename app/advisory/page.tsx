"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";

export default function AdvisoryPage() {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [weather, setWeather] = useState<string | null>(null);

  const resizeIfNeeded = async (dataUrl: string): Promise<string> => {
    try {
      const img = document.createElement("img");
      await new Promise((res, rej) => { img.onload = res as any; img.onerror = rej as any; img.src = dataUrl; });
      const MAX_DIM = 1600;
      const w = img.width; const h = img.height;
      if (w <= MAX_DIM && h <= MAX_DIM) return dataUrl;
      const scale = Math.min(MAX_DIM / w, MAX_DIM / h);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return dataUrl;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.85);
    } catch { return dataUrl; }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      const resized = await resizeIfNeeded(raw);
      setSelectedImage(resized);
      setAiResponse(null);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const mod = await import("@/lib/weather");
        const [w, aqi] = await Promise.all([
          mod.fetchOpenMeteoWeather(pos.coords.latitude, pos.coords.longitude),
          mod.fetchOpenMeteoAirQuality(pos.coords.latitude, pos.coords.longitude),
        ]);
        const parts: string[] = [];
        if (w?.temperatureC !== undefined && w?.summary) parts.push(`${Math.round(w.temperatureC)}°C, ${w.summary}`);
        if (w?.humidity !== undefined) parts.push(`RH ${w.humidity}%`);
        if (w?.windKph !== undefined) parts.push(`Wind ${w.windKph} km/h`);
        if (w?.precipitationChance !== undefined) parts.push(`Rain ${w.precipitationChance}%`);
        if (aqi?.pm2_5 !== undefined) parts.push(`PM2.5 ${Math.round(aqi.pm2_5)} µg/m³`);
        if (aqi?.pm10 !== undefined) parts.push(`PM10 ${Math.round(aqi.pm10)} µg/m³`);
        if (parts.length) setWeather(parts.join(", "));
      } catch {}
    });
  }, []);

  const analyzeImage = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    try {
      // capture latest location before sending
      const coords = await new Promise<GeolocationCoordinates | null>((resolve) => {
        try {
          if (!navigator?.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } catch {
          resolve(null);
        }
      });

      const callApi = async () => fetch("/api/plantid", {
        method: "POST",
        headers: { "Content-Type": "application/json", "cache-control": "no-store" },
        body: JSON.stringify({
          imageBase64: selectedImage,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        }),
      });

      let res = await callApi();
      if (!res.ok) {
        // small retry for transient upstream errors
        await new Promise(r => setTimeout(r, 600));
        res = await callApi();
      }
      if (!res.ok) {
        let errText = t("analysis_failed");
        try { errText = await res.text(); } catch {}
        setAiResponse(errText || t("analysis_failed"));
        return;
      }
      const data = await res.json();
      if (data.isPlant === false) {
        setAiResponse(t("not_crop_detected"));
        return;
      }
      if (data.cropLabel && (data.confidence || 0) >= 0.3) {
        const label: string = String(data.cropLabel).toLowerCase();
        const tips: string[] = [];
        if (/rice|paddy/.test(label)) {
          tips.push("Maintain consistent soil moisture; avoid standing water for seedlings.");
        } else if (/wheat|barley/.test(label)) {
          tips.push("Ensure adequate irrigation at crown root initiation; monitor rust.");
        } else if (/maize|corn/.test(label)) {
          tips.push("Irrigate around tasseling; check for borers and nutrient deficiency.");
        } else if (/millet|ragi|sorghum/.test(label)) {
          tips.push("Light irrigation if dry; watch for blast and smut.");
        } else if (/sugarcane/.test(label)) {
          tips.push("Keep soil moist; remove weeds early; monitor shoot borer.");
        } else if (/cotton/.test(label)) {
          tips.push("Scout for bollworm/aphids; avoid waterlogging.");
        } else if (/soybean|mustard|groundnut/.test(label)) {
          tips.push("Balanced nutrients; watch for aphids/leaf spot; avoid excess moisture.");
        } else if (/banana|potato|onion/.test(label)) {
          tips.push("Ensure drainage; apply recommended fertilizers; monitor fungal issues.");
        }
        // Get current language for multilingual support
        const currentLang = t('language') !== 'language' ? (
          navigator.language?.startsWith('hi') ? 'hi' :
          navigator.language?.startsWith('or') ? 'or' : 'en'
        ) : 'en';
        
        const header = `${t("ai_advice")}: ${data.cropLabel} (${Math.round((data.confidence || 0) * 100)}%)`;
        const healthLines: string[] = [];
        
        if (data.health) {
          const verdict = String(data.health.verdict || "").toLowerCase();
          const healthProb = data.health.isHealthyProbability || 0;
          
          // Improved health status translation
          let healthStatus = "";
          if (verdict.includes("healthy") && !verdict.includes("unhealthy")) {
            healthStatus = currentLang === 'hi' ? "स्वस्थ" : 
                          currentLang === 'or' ? "ସୁସ୍ଥ" : "Healthy";
          } else if (verdict.includes("needs attention") || verdict.includes("moderately")) {
            healthStatus = currentLang === 'hi' ? "ध्यान की आवश्यकता" : 
                          currentLang === 'or' ? "ଧ୍ୟାନ ଆବଶ୍ୟକ" : "Needs Attention";
          } else if (verdict.includes("immediate")) {
            healthStatus = currentLang === 'hi' ? "तुरंत देखभाल चाहिए" : 
                          currentLang === 'or' ? "ତୁରନ୍ତ ଯତ୍ନ ଆବଶ୍ୟକ" : "Immediate Care Required";
          } else {
            healthStatus = currentLang === 'hi' ? "अस्वस्थ" : 
                          currentLang === 'or' ? "ଅସୁସ୍ଥ" : "Unhealthy";
          }
          
          const healthText = currentLang === 'hi' ? "स्वास्थ्य" : 
                            currentLang === 'or' ? "ସ୍ୱାସ୍ଥ୍ୟ" : "Health";
          
          healthLines.push(`${healthText}: ${healthStatus} (${Math.round(healthProb * 100)}%)`);
          
          if (Array.isArray(data.health.diseases) && data.health.diseases.length > 0) {
            const top = data.health.diseases.slice(0, 3).map((d: any) => {
              const prob = typeof d.probability === "number" ? ` ${Math.round(d.probability * 100)}%` : "";
              const treatmentText = currentLang === 'hi' ? "उपचार" : 
                                  currentLang === 'or' ? "ଚିକିତ୍ସା" : "Treatment";
              return `- ${d.name}${prob}${d.treatment ? ` | ${treatmentText}: ${typeof d.treatment === 'string' ? d.treatment : ''}` : ''}`;
            });
            const issuesText = currentLang === 'hi' ? "संभावित समस्याएं:" : 
                              currentLang === 'or' ? "ସମ୍ଭାବ୍ୟ ସମସ୍ୟା:" : "Possible issues:";
            healthLines.push(issuesText);
            healthLines.push(...top);
          }
        }
        // Optional: summarize with LLM if API key present
        try {
          const lang = navigator.language || "en-US";
          const summaryInput = [header, ...tips.map(x => `- ${x}`), ...healthLines].join("\n");
          const chatRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: `Summarize for a farmer in one short paragraph and keep actionable next steps.\n\n${summaryInput}`, language: lang }),
          });
          if (chatRes.ok) {
            const chatData = await chatRes.json();
            const finalAdvice = String(chatData?.reply || "");
            setAiResponse(finalAdvice);
          } else {
            setAiResponse([header, ...tips, ...healthLines].join("\n- "));
          }
        } catch {
          setAiResponse([header, ...tips, ...healthLines].join("\n- "));
        }
      } else {
        setAiResponse(t("need_clearer_photo"));
      }

      // Persist analysis and image (if logged in)
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id || null;

        let imageUrl: string | null = null;
        if (userId && selectedImage.startsWith("data:")) {
          const file = await (await fetch(selectedImage)).blob();
          const fileName = `advisory-${Date.now()}.jpg`;
          const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "public";
          const { error: upErr } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, { upsert: true, contentType: file.type });
          if (!upErr) {
            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
            imageUrl = urlData?.publicUrl || null;
          }
        }

        await supabase.from("analyses").insert({
          user_id: userId,
          image_url: imageUrl,
          crop_label: data?.cropLabel || null,
          confidence: data?.confidence || null,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
          health_status: data?.health?.verdict ?? null,
          health_probability: typeof data?.health?.isHealthyProbability === "number" ? data.health.isHealthyProbability : null,
          diseases: data?.health?.diseases ? JSON.stringify(data.health.diseases) : null,
        });
      } catch {}
    } catch {
      setAiResponse(t("analysis_failed"));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{t("crop_advisory")}</h1>
        <p className="text-green-100">{t("upload_crop_photo_prompt")}</p>
      </div>

      {/* Upload Card */}
      <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">{t("upload_crop_photo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-green-300 rounded-xl cursor-pointer hover:bg-green-50 transition-colors">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mb-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span className="text-green-700 font-medium">{t("tap_to_select_photo")}</span>
            <span className="text-xs text-gray-500 mt-1">{t("file_type_limit")}</span>
          </label>

          {selectedImage && (
            <div className="mt-4">
              <img src={selectedImage} alt={t("uploaded_crop_alt")} className="w-full h-48 object-cover rounded-lg" />
              <div className="mt-2 flex gap-3">
                <Button variant="outline" onClick={() => setShowFull(true)}>{t("view_photo")}</Button>
                <Button onClick={analyzeImage} disabled={analyzing} className="bg-green-600 hover:bg-green-700">
                  {analyzing ? t("analyzing_image") : t("analyze")}
                </Button>
              </div>
            </div>
          )}

          {aiResponse && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-bold text-yellow-800 mb-2">{t("ai_advice")}</h3>
              <pre className="whitespace-pre-wrap text-sm text-yellow-900">{aiResponse}</pre>
              {weather && (
                <div className="mt-2 text-xs text-gray-700">{weather}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showFull && selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setShowFull(false)}>
          <img src={selectedImage} alt={t("uploaded_crop_alt")} className="max-w-[90vw] max-h-[85vh] rounded" />
          <button className="absolute top-4 right-4 bg-white text-gray-800 px-3 py-1 rounded" onClick={() => setShowFull(false)}>{t("close")}</button>
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <h3 className="font-bold text-gray-800 mb-2">{t("tip_label")}</h3>
        <p className="text-sm text-gray-600">
          {t("photo_tip_instruction")}
        </p>
      </div>
    </div>
  );
}
