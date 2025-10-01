"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import Image from "next/image";

type SimpleWeather = {
  temperatureC?: number;
  precipitationChance?: number;
  humidity?: number;
  windKph?: number;
  summary?: string;
  weatherCode?: number;
};

const getWeatherImage = (code: number | undefined) => {
  if (code === undefined) return "/thumbnail.jpeg"; 
  if (code >= 0 && code <= 1) return "https://images.unsplash.com/photo-1590074899043-693c46995a86?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"; // Clear sky
  if (code >= 2 && code <= 3) return "https://images.unsplash.com/photo-1509904882733-9f24c1a73c43?q=80&w=1924&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"; // Cloudy
  if (code >= 45 && code <= 48) return "https://images.unsplash.com/photo-1487738468417-74f35351a637?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"; // Fog
  if (code >= 51 && code <= 65) return "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"; // Rain
  if (code >= 71 && code <= 75) return "https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=2108&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"; // Snow
  if (code >= 95 && code <= 99) return "https://images.unsplash.com/photo-1605727226424-e2ce1e411857?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"; // Thunderstorm
  return "/thumbnail.jpeg";
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
    <Card
      className="border-none shadow-md hover:shadow-lg transition-shadow bg-cover bg-center rounded-lg"
      style={{ backgroundImage: `url(${getWeatherImage(weather?.weatherCode)})` }}
    >
      <div className="bg-black bg-opacity-40 rounded-lg p-6">
        <CardHeader className="pb-2 p-0">
          <CardTitle className="text-xl font-bold text-white">{t("current_weather")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-2">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-400 rounded w-24 mb-4"></div>
              <div className="h-6 bg-gray-400 rounded w-32"></div>
            </div>
          ) : error ? (
            <div className="text-red-300">{error}</div>
          ) : (
            <>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-gray-200">{t("temperature")}</p>
                  <p className="text-3xl font-bold">
                    {weather?.temperatureC ?? "--"}°C
                  </p>
                  <p className="text-gray-200">{weather?.summary ?? t("partly_cloudy")}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-sm text-gray-200">
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
      </div>
    </Card>
  );
}