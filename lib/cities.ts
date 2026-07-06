/**
 * Living Earth city catalog — loader for public/data/cities.json.
 *
 * The file is built offline by tools/build_cities.py from Natural Earth
 * 1:10m Populated Places (public domain, see docs/DATA_SOURCES.md): the
 * 1,200 most populous places, stored as compact arrays
 * [name, country, lat, lon, pop_max] to stay small on the wire (~52 KB).
 */

export interface City {
  name: string;
  country: string;
  /** degrees, +N */
  lat: number;
  /** degrees, +E, [-180, 180] */
  lon: number;
  /** Natural Earth POP_MAX (metro-area population estimate) */
  pop: number;
}

export interface CityCatalog {
  generated: string;
  cities: City[];
}

type CityRow = [string, string, number, number, number];

interface CitiesJson {
  meta: { generated: string; count: number };
  cities: CityRow[];
}

export async function fetchCities(signal?: AbortSignal): Promise<CityCatalog> {
  const res = await fetch("/data/cities.json", { signal });
  if (!res.ok) throw new Error(`cities.json responded ${res.status}`);
  const json = (await res.json()) as CitiesJson;
  if (!Array.isArray(json.cities) || json.cities.length === 0) {
    throw new Error("cities.json is empty or malformed");
  }
  return {
    generated: json.meta?.generated ?? "unknown",
    cities: json.cities.map(([name, country, lat, lon, pop]) => ({
      name,
      country,
      lat,
      lon,
      pop,
    })),
  };
}

/** "35.7M" / "980K" style population label. */
export function formatPop(pop: number): string {
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
  if (pop >= 1_000) return `${Math.round(pop / 1_000)}K`;
  return String(pop);
}
