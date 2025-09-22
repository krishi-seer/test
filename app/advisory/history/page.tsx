"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdvisoryHistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("analyses")
        .select("id, image_url, crop_label, confidence, created_at")
        .order("created_at", { ascending: false });
      setRows(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!rows.length) return <p>No analyses saved yet.</p>;

  return (
    <div className="p-4 space-y-4">
      {rows.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle className="text-base">{r.crop_label || "Unknown crop"} • {r.confidence ? Math.round(r.confidence * 100) + "%" : "--"}</CardTitle>
          </CardHeader>
          <CardContent>
            {r.image_url ? (
              <img src={r.image_url} alt="analysis" className="w-full max-h-60 object-cover rounded" />
            ) : null}
            <p className="text-xs text-gray-500 mt-2">{new Date(r.created_at).toLocaleString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


