"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";

type Scheme = {
  id: string;
  name: string;
  tags: string[];
  url?: string;
  description?: string;
  state?: string;
  district?: string;
  active?: boolean;
  archived?: boolean;
  archived_reason?: string;
  last_verified?: string;
  source_url?: string;
};

type AIRating = {
  id: string;
  reason: string;
  matchScore: number;
};

export default function SchemesPage() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [crop, setCrop] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Smart Eligibility and AI Matching state
  const [landSize, setLandSize] = useState("");
  const [income, setIncome] = useState("");
  const [eligibilityMode, setEligibilityMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRatings, setAiRatings] = useState<AIRating[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // 🔹 Load schemes from Supabase
  useEffect(() => {
    const loadSchemes = async () => {
      const { data, error } = await supabase
        .from("schemes_insert")
        .select("*");

      if (error) {
        console.error("Error fetching schemes_insert:", error);
        setLoadError(error.message || "Failed to load schemes_insert");
        return;
      }

      const parseTags = (val: any): string[] => {
        if (Array.isArray(val)) return val as string[];
        const raw = String(val || "").trim();
        if (!raw) return [];
        if (raw.startsWith("{") && raw.endsWith("}")) {
          const inner = raw.substring(1, raw.length - 1);
          return inner
            .split(",")
            .map((s) => s.replace(/^\"|\"$/g, "").trim())
            .filter(Boolean);
        }
        return raw.split(",").map((s) => s.trim()).filter(Boolean);
      };

      const normalized: Scheme[] = (data || []).map((r: any) => ({
        id: String(r.id),
        name: String(r.name || r.scheme_name || ""),
        description: r.description || r.desc || undefined,
        url: r.url || r.link || undefined,
        tags: parseTags(r.tags || r.tags_raw),
        state: r.state || undefined,
        district: r.district || undefined,
        active: typeof r.active === "boolean" ? r.active : true,
        archived: r.archived || false,
        archived_reason: r.archived_reason || undefined,
        last_verified: r.last_verified || undefined,
        source_url: r.source_url || undefined,
      }));

      setSchemes(normalized);

      // Find most recent last_verified for "last synced" display
      const verified = normalized
        .map((s) => s.last_verified)
        .filter(Boolean)
        .sort((a,b) => new Date(b!).getTime() - new Date(a!).getTime());
      if (verified.length > 0) setLastSynced(verified[0]!);
    };

    loadSchemes();
  }, []);

  // 🔹 AI Matching Function
  const solveWithAI = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const resp = await fetch("/api/analyze-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { landSize, crop, region, income }
        })
      });
      if (!resp.ok) throw new Error("AI Match failed");
      const data = await resp.json();
      setAiRatings(data.recommendations || []);
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // 🔹 Apply filters + eligibility logic
  const filtered = useMemo(() => {
    let list = schemes.filter((s) => {
      // Archive filter
      if (!showArchived && s.archived) return false;
      if (showArchived && !s.archived) return false;

      // Text search
      if (query && !s.name.toLowerCase().includes(query.toLowerCase()) &&
          !s.description?.toLowerCase().includes(query.toLowerCase())) return false;

      // Crop filter
      if (crop && !s.tags?.includes(crop) && !s.tags?.includes("all_crops")) return false;

      // Region filter
      if (region && region !== "all") {
        const stateMatch = s.state?.toLowerCase() === region.toLowerCase();
        const tagMatch = s.tags?.includes(region);
        const isCentral = s.state === "all" || s.tags?.includes("central");
        if (!stateMatch && !tagMatch && !isCentral) return false;
      }

      // Hardcoded basic eligibility fallback
      if (eligibilityMode && landSize && aiRatings.length === 0) {
        const acres = parseFloat(landSize);
        if (!isNaN(acres)) {
          const isSmallFarmerScheme = s.tags?.some((t) =>
            ["income", "insurance", "soil", "organic"].includes(t)
          );
          if (acres <= 5 && isSmallFarmerScheme) return true;
          if (acres > 2 && s.tags?.includes("equipment")) return true;
          if (acres > 1 && s.tags?.includes("irrigation")) return true;
        }
      }

      return true;
    });

    // If we have AI ratings, sort by them and filter only high matches
    if (aiRatings.length > 0) {
      return list.map(s => {
        const rating = aiRatings.find(r => r.id === s.id);
        return { ...s, ai_reason: rating?.reason, matchScore: rating?.matchScore || 0 };
      }).sort((a: any, b: any) => b.matchScore - a.matchScore);
    }

    return list;
  }, [schemes, query, crop, region, showArchived, eligibilityMode, landSize, aiRatings]);

  // Format relative time
  const formatSyncTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const [isSyncing, setIsSyncing] = useState(false);

  // 🔹 Force Sync Function
  const forceSync = async () => {
    setIsSyncing(true);
    try {
      const resp = await fetch("/api/sync-schemes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cron-secret": "ks_sync_a7f3e9b2d1c4" // Uses the secret we established
        }
      });
      if (resp.ok) {
        alert("Sync Complete! Schemes updated.");
        window.location.reload();
      } else {
        alert("Sync Failed. Check server logs.");
      }
    } catch (err) {
      alert("Sync Error: " + String(err));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">{t("govt_schemes")}</h1>
        <div className="flex items-center gap-3 text-sm">
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={forceSync}
              disabled={isSyncing}
              className="px-3 py-1 bg-gray-800 text-white rounded-full text-xs hover:bg-black transition-colors disabled:opacity-50"
            >
              {isSyncing ? "Syncing..." : "⚡ Force Sync"}
            </button>
          )}
          {lastSynced && (
            <span className="text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse"></span>
              Synced {formatSyncTime(lastSynced)}
            </span>
          )}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              showArchived
                ? "bg-amber-100 text-amber-700 border border-amber-300"
                : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
            }`}
          >
            {showArchived ? "📦 Archived" : "Show Archived"}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="text-red-600 text-sm">{loadError} — Ensure table `schemes_insert` exists and RLS allows select.</div>
      )}

      {/* Smart Eligibility & AI Solver */}
      <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <span className="font-bold text-green-800 text-base leading-none">Smart Eligibility Match</span>
              <p className="text-xs text-green-600 mt-1">Tell us About you and get AI-matched schemes</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEligibilityMode(!eligibilityMode);
              if (!eligibilityMode) { setAiRatings([]); }
            }}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              eligibilityMode ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                eligibilityMode ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
        {eligibilityMode && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Land Size (Acres)</label>
              <input
                type="number"
                placeholder="2.5"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
                className="border rounded px-3 py-2 w-full text-sm focus:ring-2 focus:ring-green-400 outline-none"
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Annual Income (₹)</label>
              <input
                type="number"
                placeholder="100000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="border rounded px-3 py-2 w-full text-sm focus:ring-2 focus:ring-green-400 outline-none"
                min="0"
              />
            </div>
            <div className="md:col-span-2">
              <Button 
                onClick={solveWithAI} 
                disabled={aiLoading || !landSize}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10 shadow-md transform active:scale-95 transition-all"
              >
                {aiLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin text-lg">⚙️</span> Analyzing Schemes...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="text-lg">🤖</span> Ask AI Match Agent
                  </span>
                )}
              </Button>
            </div>
            {aiError && <div className="text-red-500 text-xs col-span-full">{aiError}</div>}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder={t("search") as string}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
          <div className="text-xs text-gray-500 mt-1">{t("search")}: name/description/keyword</div>
        </div>
        <div>
          <select className="border rounded px-3 py-2 w-full" value={crop} onChange={(e) => setCrop(e.target.value)}>
            <option value="">{t("filter_crop")}</option>
            <option value="wheat">Wheat</option>
            <option value="rice">Rice</option>
            <option value="maize">Maize</option>
            <option value="mustard">Mustard</option>
            <option value="soil">Soil</option>
            <option value="income">Income</option>
            <option value="insurance">Insurance</option>
            <option value="irrigation">Irrigation</option>
            <option value="organic">Organic</option>
            <option value="equipment">Equipment</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">Type or pick. Example: "wheat".</div>
        </div>
        <div>
          <select className="border rounded px-3 py-2 w-full" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">{t("filter_region")}</option>
            <option value="odisha">Odisha</option>
            <option value="bihar">Bihar</option>
            <option value="up">Uttar Pradesh</option>
            <option value="jharkhand">Jharkhand</option>
            <option value="all">All India (Central)</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">Pick a state or "All".</div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filtered.length} scheme{filtered.length !== 1 ? "s" : ""}
        {showArchived ? " (archived)" : ""}
        {aiRatings.length > 0 ? " — Ranked by AI" : eligibilityMode && landSize ? ` matching ${landSize} acres` : ""}
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <div className="text-gray-500 text-sm">No schemes match your profile. Check back later or adjust your details.</div>
        )}
        {filtered.map((s: any) => (
          <Card key={s.id} className={`relative overflow-hidden transition-all duration-300 ${s.archived ? "opacity-60 border-amber-300" : s.matchScore > 80 ? "border-green-400 shadow-md ring-2 ring-green-100" : ""}`}>
            {s.archived && (
              <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                📦 Archived {s.archived_reason === "source_404" ? "(Link Dead)" : s.archived_reason === "expired" ? "(Expired)" : ""}
              </div>
            )}
            {s.matchScore > 0 && !s.archived && (
              <div className={`absolute top-2 right-2 ${s.matchScore > 80 ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'} text-xs px-2 py-0.5 rounded-full font-bold animate-pulse`}>
                {s.matchScore}% Match
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{s.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {s.ai_reason && (
                <div className="bg-green-50 text-green-800 text-xs p-2 rounded-lg border border-green-100 italic">
                  <strong>AI Match Agent:</strong> {s.ai_reason}
                </div>
              )}
              {s.description && (
                <p className="text-sm text-gray-700 line-clamp-3">{s.description}</p>
              )}
              {s.tags && (
                <div className="flex gap-2 flex-wrap">
                  {s.tags.map((tTag: string) => (
                    <span
                      key={tTag}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md font-medium"
                    >
                      {tTag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                {s.url && (
                  <Button asChild className="bg-green-600 hover:bg-green-700 text-white shadow-sm px-4">
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {t("learn_more")}
                    </a>
                  </Button>
                )}
                {s.last_verified && (
                  <span className="text-[10px] text-gray-400 italic">
                    Verified {formatSyncTime(s.last_verified)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
