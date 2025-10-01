"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

type SimpleWeather = {
  temperatureC?: number;
  precipitationChance?: number;
  humidity?: number;
  windKph?: number;
  summary?: string;
};

export default function WeatherWidget() {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<SimpleWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // First try to get location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude: lat, longitude: lon } = position.coords;
        
        // Then fetch weather data
        const mod = await import("@/lib/weather");
        const weatherData = await mod.fetchOpenMeteoWeather(lat, lon);
        setWeather(weatherData);
      } catch (e) {
        // If geolocation fails, try IP-based location
        try {
          const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
          if (!res.ok) throw new Error("IP lookup failed");
          const data = await res.json();
          const lat = Number(data?.latitude);
          const lon = Number(data?.longitude);
          
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            const mod = await import("@/lib/weather");
            const weatherData = await mod.fetchOpenMeteoWeather(lat, lon);
            setWeather(weatherData);
          } else {
            setError("Could not determine location");
          }
        } catch {
          setError(t("analysis_failed"));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [t]);

  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-gray-800">{t("current_weather")}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">{t("temperature")}</p>
                <p className="text-3xl font-bold text-green-600">
                  {weather?.temperatureC ?? "--"}°C
                </p>
                <p className="text-gray-600">{weather?.summary ?? t("partly_cloudy")}</p>
              </div>
              <div className="text-6xl">
                {weather?.summary?.toLowerCase().includes("cloud") ? "⛅" : "☀️"}
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm text-gray-600">
              <span>
                {t("humidity", { value: `${weather?.humidity ?? "--"}%` })}
              </span>
              <span>
                {t("wind_speed", { value: `${weather?.windKph ?? "--"} km/h` })}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}