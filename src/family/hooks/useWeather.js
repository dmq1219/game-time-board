import { useEffect, useState } from "react";

// Live weather for Irvine, CA via Open-Meteo (no API key, CORS-friendly).
// Falls back to the passed-in mock if the network call fails.

const IRVINE = { lat: 33.6846, lon: -117.8265, city: "Irvine" };
const ENDPOINT =
  `https://api.open-meteo.com/v1/forecast?latitude=${IRVINE.lat}` +
  `&longitude=${IRVINE.lon}&current=temperature_2m,weather_code` +
  `&temperature_unit=fahrenheit`;

// Map a WMO weather code to one of our four glyphs + a short label.
function mapCode(code) {
  if (code === 0) return { icon: "sun", condition: "Sunny" };
  if (code <= 2) return { icon: "partly", condition: "Partly cloudy" };
  if (code === 3) return { icon: "cloud", condition: "Cloudy" };
  if (code >= 45 && code <= 48) return { icon: "cloud", condition: "Foggy" };
  if (code >= 51 && code <= 67) return { icon: "rain", condition: "Drizzle" };
  if (code >= 71 && code <= 77) return { icon: "cloud", condition: "Snow" };
  if (code >= 80 && code <= 82) return { icon: "rain", condition: "Showers" };
  if (code >= 95) return { icon: "rain", condition: "Storm" };
  return { icon: "cloud", condition: "Cloudy" };
}

export function useWeather(fallback) {
  const [weather, setWeather] = useState(fallback);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(ENDPOINT);
        if (!res.ok) throw new Error(`weather ${res.status}`);
        const data = await res.json();
        const cur = data.current;
        const { icon, condition } = mapCode(cur.weather_code);
        if (alive) {
          setWeather({
            tempF: Math.round(cur.temperature_2m),
            condition,
            icon,
            city: IRVINE.city
          });
        }
      } catch {
        /* keep fallback / previous value */
      }
    };
    load();
    const id = setInterval(load, 30 * 60 * 1000); // refresh every 30 min
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return weather;
}
