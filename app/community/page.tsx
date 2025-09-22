"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function CommunityPage() {
  const { t } = useTranslation();
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        setSession(sessionData?.session || null);
        const { data, error } = await supabase
          .from("farmers")
          .select("*");

        if (error) {
          console.error("Supabase Error:", error);

          if (error.message) {
            setError(t("load_farmers_failed_with_message", { message: error.message }));
          } else {
            setError(t("load_farmers_failed"));
          }
          return;
        }

        setFarmers(data || []);
      } catch (err: any) {
        console.error("Network Error:", err);
        setError(t("network_error_message"));
      } finally {
        setLoading(false);
      }
    };

    fetchFarmers();
  }, [t]);

  if (loading) {
    return (
      <div className="p-4 flex justify-between items-center">
        <p>{t("loading_farmers")}</p>
        {!session ? (
          <a href="/login" className="text-green-600 hover:underline">{t("log_in")}</a>
        ) : (
          <a href="/dashboard" className="text-green-600 hover:underline">{t("dashboard")}</a>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (farmers.length === 0) {
    return <p>{t("no_farmers_registered")}</p>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("community_title")}</h1>
        <div className="flex items-center gap-3">
          {!session ? (
            <Button asChild variant="outline"><a href="/login">{t("log_in")}</a></Button>
          ) : (
            <>
              <Button asChild variant="outline"><a href="/dashboard">{t("dashboard")}</a></Button>
              <Button variant="outline" onClick={() => supabase.auth.signOut()}>{t("log_out")}</Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {farmers.map((farmer) => (
          <Card key={farmer.id} className="border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="font-bold">{farmer.name}</CardTitle>
              <p className="text-sm text-gray-600">
                {t("farmer_age_location", { age: farmer.age, location: farmer.location })}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                {t("username_label", { username: farmer.username })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
