"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { LineChart, Line } from "recharts";
import Button from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const DashboardPage = () => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState<string>("...");

  useEffect(() => {
    const loadName = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const email: string | undefined = sessionData?.session?.user?.email || undefined;
        const username = email ? email.split("@")[0] : undefined;
        if (!email) { setDisplayName("Guest"); return; }
        // Try to fetch farmer profile
        const { data } = await supabase.from("farmers").select("name, username").eq("username", username || "").limit(1).maybeSingle();
        if (data?.name) { setDisplayName(String(data.name)); return; }
        setDisplayName(username || "Farmer");
      } catch { setDisplayName("Farmer"); }
    };
    loadName();
  }, []);

  const yieldData = [
    { season: t("season_current"), predicted: 45, min: 38, max: 52 },
  ];

  const marketData = [
    { month: t("month_now"), price: 28 },
    { month: t("month_next"), price: 32 },
    { month: t("month_two_months"), price: 35 },
    { month: t("month_three_months"), price: 38 },
  ];

  const soilHealth = [
    { nutrient: "N", level: 75, max: 100 },
    { nutrient: "P", level: 60, max: 100 },
    { nutrient: "K", level: 80, max: 100 },
    { nutrient: "pH", level: 65, max: 100 },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-1">{t("welcome_back", { name: displayName })}</h1>
        <p className="text-green-100">{t("farm_status_text")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-gray-800">{t("current_weather")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">{t("temperature")}</p>
                <p className="text-3xl font-bold text-green-600">28°C</p>
                <p className="text-gray-600">{t("partly_cloudy")}</p>
              </div>
              <div className="text-6xl">☀️</div>
            </div>
            <div className="mt-4 flex justify-between text-sm text-gray-600">
              <span>{t("humidity", { value: "65%" })}</span>
              <span>{t("wind_speed", { value: "8 km/h" })}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-gray-800">{t("yield_prediction")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yieldData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="season" tick={{ fontSize: 14, fontWeight: "bold" }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 60]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value} ${t("quintals")}`, t("predicted_yield")]}
                  />
                  <Bar dataKey="predicted" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="min" fill="#f0f0f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="max" fill="#f0f0f0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-gray-600">{t("predicted_yield_label")}</span>
              <span className="text-2xl font-bold text-green-600">45 {t("quintals")}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm text-gray-500">{t("confidence_range", { min: 38, max: 52 })}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-gray-800">{t("market_intelligence")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marketData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fontWeight: "bold" }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[20, 45]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value} ₹/${t("quintal")}`, t("price")]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-gray-600">{t("current_price")}</span>
              <span className="text-2xl font-bold text-green-600">₹28/{t("quintal")}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm text-gray-500">{t("forecast_increase", { percent: "36%", months: 3 })}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-gray-800">{t("soil_health")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {soilHealth.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-700 capitalize">{item.nutrient}</span>
                    <span className="text-sm text-gray-500">{item.level}%</span>
                  </div>
                  <Progress value={item.level} className="h-3 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mr-2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span className="text-sm text-green-700 font-medium">{t("good_soil_balance")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <Button asChild variant="outline" className="flex flex-col items-center justify-center h-20 border-2 border-green-200 text-green-700 hover:bg-green-50">
          <a href="/irrigation">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 mb-1">
              <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
            </svg>
            <span className="text-xs font-medium">Smart Irrigation</span>
          </a>
        </Button>

        <Button asChild variant="outline" className="flex flex-col items-center justify-center h-20 border-2 border-green-200 text-green-700 hover:bg-green-50">
          <a href="/fertilizer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 mb-1">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
            <span className="text-xs font-medium">Fertilizer AI</span>
          </a>
        </Button>

        <Button asChild variant="outline" className="flex flex-col items-center justify-center h-20 border-2 border-green-200 text-green-700 hover:bg-green-50">
          <a href="/advisory">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 mb-1">
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span className="text-xs font-medium">{t("advisory")}</span>
          </a>
        </Button>

        <Button asChild variant="outline" className="flex flex-col items-center justify-center h-20 border-2 border-green-200 text-green-700 hover:bg-green-50">
          <a href="/community">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 mb-1">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="text-xs font-medium">{t("community")}</span>
          </a>
        </Button>
      </div>
      
      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
        <div className="flex items-center mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span className="font-semibold text-green-800">New Yield Optimization Features</span>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Access Smart Irrigation & Fertilizer AI for 10%+ yield increase through precision agriculture.
        </p>
        <div className="flex gap-2">
          <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
            <a href="/irrigation">Try Smart Irrigation</a>
          </Button>
          <Button asChild variant="outline" className="border-green-300 text-green-700">
            <a href="/fertilizer">Try Fertilizer AI</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


