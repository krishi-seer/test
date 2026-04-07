"use client";

import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Link from "next/link";

export default function DocumentExtractorPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔹 Handle Photo Upload & Base64 conversion
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        setResult(null); // Clear previous results
      };
      reader.readAsDataURL(file);
    }
  };

  // 🔹 Send to Vision AI API
  const analyzeSoilCard = async () => {
    if (!photo) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/extract-soil-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo })
      });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Vision AI analysis failed. Please try a clearer photo.");
      }
      const data = await resp.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-green-900">Document Extractor</h1>
        <Link href="/schemes" className="text-green-600 font-semibold text-sm hover:underline">
          &larr; Back to Schemes
        </Link>
      </div>

      <Card className="border-2 border-dashed border-green-200 bg-green-50/30">
        <CardContent className="pt-8 flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-3xl">
            📷
          </div>
          <div className="text-center">
            <h2 className="font-bold text-lg text-green-800">Scan Soil Health Card</h2>
            <p className="text-xs text-green-600 max-w-xs mx-auto">Upload a clear photo of your card to get AI-powered fertilizer & subsidy recommendations</p>
          </div>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handlePhotoUpload} 
            ref={fileInputRef}
            className="hidden" 
          />
          
          <div className="flex gap-3">
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
            >
              Take Photo / Upload
            </Button>
            {photo && !result && (
              <Button 
                onClick={analyzeSoilCard} 
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg animate-bounce"
              >
                {loading ? "🔍 Analyzing..." : "✨ Analyze with AI"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {photo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Photo Preview */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-widest">Photo Preview</CardTitle></CardHeader>
            <CardContent>
              <img src={photo} alt="Soil Card Preview" className="rounded-lg w-full h-auto object-cover border" />
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <div className="space-y-4">
            {loading && (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 font-medium">Extracting Soil Data...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            {result && (
              <>
                <Card className="border-l-4 border-l-green-500 shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-lg font-bold text-green-800">Analysis Results</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                       {Object.entries(result.metrics).map(([key, value]: [string, any]) => (
                         <div key={key} className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                           <div className="text-[10px] uppercase font-bold text-gray-400">{key}</div>
                           <div className="text-sm font-bold text-green-700">{value || "N/A"}</div>
                         </div>
                       ))}
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-xs leading-relaxed text-green-800 italic">
                       <strong>AI Recommendation:</strong> {result.recommendation}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-gray-500 uppercase mb-2">Suggested Fertilizers</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.suggested_fertilizers.map((f: string) => (
                          <span key={f} className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {result.matching_subsidies?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-gray-900 uppercase flex items-center gap-2">
                      💸 Matching Subsidies
                    </h3>
                    {result.matching_subsidies.map((s: any) => (
                       <Card key={s.id} className="border-l-4 border-l-amber-400 overflow-hidden">
                         <CardContent className="p-3 flex items-center justify-between gap-4">
                           <div>
                             <h4 className="text-sm font-bold text-gray-800">{s.name}</h4>
                             <p className="text-[10px] text-gray-500 line-clamp-1">{s.description}</p>
                           </div>
                           <Button asChild className="bg-amber-400 hover:bg-amber-500 text-white text-[10px] h-8 px-3">
                             <a href={s.url} target="_blank">Apply Now</a>
                           </Button>
                         </CardContent>
                       </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
