/**
 * Open-Meteo point-forecast client (browser-side).
 *
 * Open-Meteo is CORS-enabled and keyless, so the browser fetches directly —
 * no proxy (see .claude/skills/planetary-data-ingestion: never proxy just to
 * launder terms). Free tier is non-commercial, ~10k req/day.
 *
 * Data license: forecasts (c) Open-Meteo.com, CC-BY 4.0. The UI labels every
 * forecast "Forecast: Open-Meteo (CC-BY 4.0)" — honest-forecasting rule from
 * .claude/skills/physics-env-simulation.
 */

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  isDay: boolean;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
}

export interface ForecastResult {
  latitude: number;
  longitude: number;
  timezone: string;
  elevation: number;
  current: CurrentWeather;
  daily: DailyForecast[];
}

export async function fetchForecast(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<ForecastResult> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: "7",
    timezone: "auto",
    wind_speed_unit: "kmh",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { signal }
  );
  if (!res.ok) {
    throw new Error(`Open-Meteo responded ${res.status}`);
  }
  const json = await res.json();
  const daily: DailyForecast[] = (json.daily?.time ?? []).map(
    (date: string, i: number) => ({
      date,
      weatherCode: json.daily.weather_code?.[i] ?? 0,
      tempMax: json.daily.temperature_2m_max?.[i] ?? NaN,
      tempMin: json.daily.temperature_2m_min?.[i] ?? NaN,
    })
  );
  return {
    latitude: json.latitude,
    longitude: json.longitude,
    timezone: json.timezone ?? "UTC",
    elevation: json.elevation ?? 0,
    current: {
      time: json.current?.time ?? "",
      temperature: json.current?.temperature_2m ?? NaN,
      apparentTemperature: json.current?.apparent_temperature ?? NaN,
      humidity: json.current?.relative_humidity_2m ?? NaN,
      weatherCode: json.current?.weather_code ?? 0,
      windSpeed: json.current?.wind_speed_10m ?? NaN,
      windDirection: json.current?.wind_direction_10m ?? 0,
      isDay: json.current?.is_day === 1,
    },
    daily,
  };
}

export interface SamplePoint {
  name: string;
  lat: number;
  lon: number;
}

export interface SampleTemp {
  name: string;
  /** current 2 m air temperature, °C */
  temperature: number;
}

/**
 * Current temperature for a small fixed set of cities in ONE request —
 * Open-Meteo accepts comma-separated coordinate lists and returns an array.
 * The Living Earth tab calls this once per session (10 cities), which is
 * a rounding error against the 600/min free-tier limit.
 */
export async function fetchCurrentTemps(
  points: readonly SamplePoint[],
  signal?: AbortSignal
): Promise<SampleTemp[]> {
  if (points.length === 0) return [];
  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat.toFixed(2)).join(","),
    longitude: points.map((p) => p.lon.toFixed(2)).join(","),
    current: "temperature_2m",
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { signal }
  );
  if (!res.ok) {
    throw new Error(`Open-Meteo responded ${res.status}`);
  }
  const json = await res.json();
  // single-location requests return an object, multi-location an array
  const list = Array.isArray(json) ? json : [json];
  return points
    .map((p, i) => ({
      name: p.name,
      temperature: list[i]?.current?.temperature_2m as number,
    }))
    .filter((t) => Number.isFinite(t.temperature));
}

/**
 * WMO 4677 weather interpretation codes -> label + icon group.
 * Icon groups map to Phosphor icons in the UI (no emoji, per design skills).
 */
export type WeatherIconKind =
  | "clear"
  | "partly"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "freezing"
  | "snow"
  | "showers"
  | "thunder";

interface WmoEntry {
  label: string;
  icon: WeatherIconKind;
}

const WMO: Record<number, WmoEntry> = {
  0: { label: "Clear sky", icon: "clear" },
  1: { label: "Mainly clear", icon: "clear" },
  2: { label: "Partly cloudy", icon: "partly" },
  3: { label: "Overcast", icon: "overcast" },
  45: { label: "Fog", icon: "fog" },
  48: { label: "Depositing rime fog", icon: "fog" },
  51: { label: "Light drizzle", icon: "drizzle" },
  53: { label: "Drizzle", icon: "drizzle" },
  55: { label: "Dense drizzle", icon: "drizzle" },
  56: { label: "Freezing drizzle", icon: "freezing" },
  57: { label: "Dense freezing drizzle", icon: "freezing" },
  61: { label: "Light rain", icon: "rain" },
  63: { label: "Rain", icon: "rain" },
  65: { label: "Heavy rain", icon: "rain" },
  66: { label: "Freezing rain", icon: "freezing" },
  67: { label: "Heavy freezing rain", icon: "freezing" },
  71: { label: "Light snowfall", icon: "snow" },
  73: { label: "Snowfall", icon: "snow" },
  75: { label: "Heavy snowfall", icon: "snow" },
  77: { label: "Snow grains", icon: "snow" },
  80: { label: "Light rain showers", icon: "showers" },
  81: { label: "Rain showers", icon: "showers" },
  82: { label: "Violent rain showers", icon: "showers" },
  85: { label: "Snow showers", icon: "snow" },
  86: { label: "Heavy snow showers", icon: "snow" },
  95: { label: "Thunderstorm", icon: "thunder" },
  96: { label: "Thunderstorm, light hail", icon: "thunder" },
  99: { label: "Thunderstorm, heavy hail", icon: "thunder" },
};

export function describeWeatherCode(code: number): WmoEntry {
  return WMO[code] ?? { label: `Weather code ${code}`, icon: "overcast" };
}
