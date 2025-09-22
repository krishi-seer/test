"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useTranslation } from "react-i18next";

type SimpleWeather = {
  temperatureC?: number;
  precipitationChance?: number;
  humidity?: number;
  windKph?: number;
  summary?: string;
};

export default function WeatherPage() {
  const { t } = useTranslation();
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [weather, setWeather] = useState<SimpleWeather | null>(null);
  const [air, setAir] = useState<{ pm10?: number; pm2_5?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cityQuery, setCityQuery] = useState("");

  const fetchData = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const mod = await import("@/lib/weather");
      const [w, a] = await Promise.all([
        mod.fetchOpenMeteoWeather(lat, lon),
        mod.fetchOpenMeteoAirQuality(lat, lon),
      ]);
      setWeather(w);
      setAir(a);
    } catch (e) {
      setError(t("analysis_failed"));
    } finally {
      setLoading(false);
    }
  };

  const requestGeolocation = () => {
    if (!navigator?.geolocation) {
      setError("Geolocation not supported in this browser");
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ lat, lon });
        fetchData(lat, lon);
      },
      () => setError("Location permission denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    requestGeolocation();
  }, []);

  const useIpLocation = async () => {
    try {
      setError(null);
      const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      if (!res.ok) throw new Error("ip lookup failed");
      const j = await res.json();
      const lat = Number(j?.latitude);
      const lon = Number(j?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        setCoords({ lat, lon });
        fetchData(lat, lon);
      } else {
        setError("Could not determine location from IP");
      }
    } catch {
      setError("Could not determine location from IP");
    }
  };

  const searchCity = async () => {
    if (!cityQuery.trim()) return;
    try {
      setError(null);
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery.trim())}&count=1`;
      const res = await fetch(url, { cache: "no-store" });
      const j = await res.json();
      const r = Array.isArray(j?.results) && j.results[0];
      if (r && typeof r.latitude === "number" && typeof r.longitude === "number") {
        const lat = r.latitude; const lon = r.longitude;
        setCoords({ lat, lon });
        fetchData(lat, lon);
      } else {
        setError("City not found");
      }
    } catch {
      setError("City search failed");
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">{t("current_weather")}</h1>
        <p className="text-green-100">{coords ? `${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}` : t("tap_to_select_photo")}</p>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">{t("current_weather")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <div className="text-gray-600">{t("analyzing_image")}</div>}
          {error && <div className="text-red-600">{error}</div>}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={requestGeolocation}>Request location</Button>
            <Button variant="outline" onClick={useIpLocation}>Use IP location</Button>
          </div>
          <div className="flex gap-2">
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              placeholder="Search city"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
            />
            <Button variant="outline" onClick={searchCity}>Search</Button>
          </div>
          {weather && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600">{t("temperature")}</div>
                <div className="text-3xl font-bold text-green-600">{Math.round(weather.temperatureC ?? 0)}°C</div>
                <div className="text-gray-600">{weather.summary || ""}</div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div>RH: {weather.humidity ?? "-"}%</div>
                <div>Wind: {weather.windKph ?? "-"} km/h</div>
                <div>Rain chance: {weather.precipitationChance ?? "-"}%</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">Air Quality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <div>PM2.5: {air?.pm2_5 !== undefined ? Math.round(air.pm2_5) : "-"} µg/m³</div>
          <div>PM10: {air?.pm10 !== undefined ? Math.round(air.pm10) : "-"} µg/m³</div>
          <Button variant="outline" onClick={() => coords ? fetchData(coords.lat, coords.lon) : requestGeolocation()} className="mt-3">
            Refresh
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


