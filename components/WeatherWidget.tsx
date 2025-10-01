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
  weatherCode?: number;
};

const getWeatherIcon = (code: number | undefined) => {
  if (!code) return "☀️";
  if (code >= 0 && code <= 1) return "☀️";
  if (code >= 2 && code <= 3) return "⛅";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 65) return "🌧️";
  if (code >= 71 && code <= 75) return "🌨️";
  if (code >= 95 && code <= 99) return "⛈️";
  return "☀️";
};

export default function WeatherWidget() {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<SimpleWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [t]);

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', { 
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Card className="border-none shadow-lg bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
      <div className="p-6">
        <CardHeader className="pb-2 p-0 mb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800">Weather</CardTitle>
            <span className="text-sm text-gray-500">{formatTime(currentTime)}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="space-y-6">
              {/* Current Weather */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-6xl font-light text-gray-800">
                    {weather?.temperatureC ?? "--"}°
                  </p>
                  <p className="text-gray-600 mt-1">{weather?.summary ?? "Light rain"}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>Precipitation: {weather?.precipitationChance ?? "--"}%</span>
                    <span>•</span>
                    <span>Humidity: {weather?.humidity ?? "--"}%</span>
                    <span>•</span>
                    <span>Wind: {weather?.windKph ?? "--"} km/h</span>
                  </div>
                </div>
                <div className="text-4xl">
                  {getWeatherIcon(weather?.weatherCode)}
                </div>
              </div>
              
              {/* Forecast */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                {["Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                  <div key={day} className="text-center">
                    <p className="text-sm text-gray-500">{day}</p>
                    <p className="text-2xl mb-1">{getWeatherIcon(weather?.weatherCode)}</p>
                    <p className="text-sm font-medium text-gray-800">
                      {Math.round(weather?.temperatureC ?? 25) + i}°
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}