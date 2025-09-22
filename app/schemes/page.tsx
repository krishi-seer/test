"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase"; // <-- add this helper

type Scheme = {
  id: string;
  name: string;
  tags: string[];
  url?: string;
  description?: string;
  state?: string;
  district?: string;
  active?: boolean;
};

export default function SchemesPage() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [crop, setCrop] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

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
      }));

      setSchemes(normalized);
    };

    loadSchemes();
  }, []);

  // 🔹 Apply filters on the client side
  const filtered = useMemo(() => {
    return schemes.filter((s) =>
      (query ? s.name.toLowerCase().includes(query.toLowerCase()) : true) &&
      (crop ? s.tags?.includes(crop) : true) &&
      (region ? (s.state?.toLowerCase() === region.toLowerCase() || s.tags?.includes(region)) : true)
    );
  }, [schemes, query, crop, region]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t("govt_schemes")}</h1>
      {loadError && (
        <div className="text-red-600 text-sm">{loadError} — Ensure table `schemes_insert` exists and RLS allows select.</div>
      )}

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
          </select>
          <div className="text-xs text-gray-500 mt-1">Type or pick. Example: “wheat”.</div>
        </div>
        <div>
          <select className="border rounded px-3 py-2 w-full" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">{t("filter_region")}</option>
            <option value="odisha">Odisha</option>
            <option value="bihar">Bihar</option>
            <option value="up">Uttar Pradesh</option>
            <option value="all">All</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">Pick a state or “All”.</div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <div className="text-gray-500 text-sm">No schemes match your filters. Try clearing filters or add rows to `schemes` table.</div>
        )}
        {filtered.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle>{s.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {s.description && (
                <p className="text-sm text-gray-700">{s.description}</p>
              )}
              {s.tags && (
                <div className="flex gap-2 flex-wrap">
                  {s.tags.map((tTag) => (
                    <span
                      key={tTag}
                      className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded"
                    >
                      {tTag}
                    </span>
                  ))}
                </div>
              )}
              {s.url && (
                <Button asChild className="bg-transparent border-2 border-green-200 text-green-700 hover:bg-green-50">
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {t("learn_more")}
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
