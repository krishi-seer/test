export type SimpleWeather = {
  temperatureC?: number;
  precipitationChance?: number;
  humidity?: number;
  windKph?: number;
  aqiPM10?: number;
  aqiPM2_5?: number;
  summary?: string;
};

export async function fetchOpenMeteoWeather(latitude: number, longitude: number): Promise<SimpleWeather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=precipitation_probability&timezone=auto`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const temp = data?.current?.temperature_2m as number | undefined;
    const humidity = data?.current?.relative_humidity_2m as number | undefined;
    const wind = data?.current?.wind_speed_10m as number | undefined;
    const code = data?.current?.weather_code as number | undefined;
    const probability = Array.isArray(data?.hourly?.precipitation_probability) ? data.hourly.precipitation_probability[0] : undefined;

    const codeToText: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Snow",
      75: "Heavy snow",
      95: "Thunderstorm",
    };

    const summary = code !== undefined ? codeToText[code] || "Weather available" : undefined;
    return {
      temperatureC: temp,
      precipitationChance: probability,
      humidity,
      windKph: typeof wind === "number" ? Math.round(wind * 3.6) : undefined,
      summary,
    };
  } catch {
    return null;
  }
}

export async function fetchOpenMeteoAirQuality(latitude: number, longitude: number): Promise<{ pm10?: number; pm2_5?: number } | null> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=pm10,pm2_5&timezone=auto`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const pm10 = Array.isArray(data?.hourly?.pm10) ? data.hourly.pm10[0] : undefined;
    const pm2_5 = Array.isArray(data?.hourly?.pm2_5) ? data.hourly.pm2_5[0] : undefined;
    return { pm10, pm2_5 };
  } catch {
    return null;
  }
}


