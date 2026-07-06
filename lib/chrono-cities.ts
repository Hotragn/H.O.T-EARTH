/**
 * Cities-over-time — defensive loader + population interpolation for the
 * Virtual Earth timeline. Cities appear at their founding year and grow; the
 * scene sizes/glows each city marker by its interpolated population at the
 * current simulated year.
 *
 * EXPECTED asset (dropped separately by the coordinator / research agent):
 *   public/data/history/cities_over_time.json
 *   {
 *     "meta": { "generated": "...", "source": "..." },
 *     "cities": [
 *       {
 *         "name": "Rome",
 *         "lat": 41.9, "lon": 12.5,
 *         "foundedYear": -753,
 *         "popByYear": [[-500, 100000], [1, 1000000], [1300, 30000], ...]
 *       },
 *       ...
 *     ]
 *   }
 *
 * Tolerated shape variations (the loader normalizes all of these):
 *   - popByYear as an array of [year, pop] pairs (preferred), OR
 *   - popByYear as an object { "-500": 100000, "1": 1000000, ... }.
 *   - foundedYear may be omitted → inferred from the earliest pop sample.
 *
 * If the fetch fails or the file is malformed we fall back to a compact,
 * real-history built-in catalog (below) so the scene is impressive before the
 * full dataset lands. Never throws, never blocks the scene.
 */

export interface HistoricalCity {
  name: string;
  /** degrees, +N */
  lat: number;
  /** degrees, +E, [-180, 180] */
  lon: number;
  /** first year the city exists on the timeline (CE; negative = BCE) */
  foundedYear: number;
  /** sorted [year, population] samples; population held/interpolated between */
  popByYear: Array<[number, number]>;
}

export interface HistoricalCityCatalog {
  source: string;
  usingFallback: boolean;
  cities: HistoricalCity[];
}

export const CITIES_OVER_TIME_URL = "/data/history/cities_over_time.json";

interface RawCity {
  name?: unknown;
  lat?: unknown;
  lon?: unknown;
  foundedYear?: unknown;
  founded?: unknown;
  popByYear?: unknown;
  /** Reba et al. dataset (and others) name this field `pop`. */
  pop?: unknown;
}

function toPairs(popByYear: unknown): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  if (Array.isArray(popByYear)) {
    for (const entry of popByYear) {
      if (Array.isArray(entry) && entry.length >= 2) {
        const y = Number(entry[0]);
        const p = Number(entry[1]);
        if (Number.isFinite(y) && Number.isFinite(p)) pairs.push([y, p]);
      }
    }
  } else if (popByYear && typeof popByYear === "object") {
    for (const [k, v] of Object.entries(popByYear as Record<string, unknown>)) {
      const y = Number(k);
      const p = Number(v);
      if (Number.isFinite(y) && Number.isFinite(p)) pairs.push([y, p]);
    }
  }
  pairs.sort((a, b) => a[0] - b[0]);
  return pairs;
}

/** Normalize one raw city record; returns null if it can't be salvaged. */
function normalizeCity(raw: RawCity): HistoricalCity | null {
  const name = typeof raw.name === "string" ? raw.name : null;
  const lat = Number(raw.lat);
  const lon = Number(raw.lon);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const popByYear = toPairs(raw.popByYear ?? raw.pop);
  let foundedYear = Number(raw.foundedYear ?? raw.founded);
  if (!Number.isFinite(foundedYear)) {
    foundedYear = popByYear.length > 0 ? popByYear[0][0] : Number.NaN;
  }
  if (!Number.isFinite(foundedYear)) return null;

  return { name, lat, lon, foundedYear, popByYear };
}

/**
 * Population of a city at a decimal `year`:
 *   - 0 before it exists (year < foundedYear)
 *   - linear interpolation between bracketing samples
 *   - held flat before the first / after the last sample
 * Pure and allocation-free; safe to call per city per HUD tick.
 */
export function populationAtYear(city: HistoricalCity, year: number): number {
  if (year < city.foundedYear) return 0;
  const s = city.popByYear;
  if (s.length === 0) return 0;
  if (year <= s[0][0]) return s[0][1];
  if (year >= s[s.length - 1][0]) return s[s.length - 1][1];
  // find bracketing pair (linear scan — catalogs are small, samples few)
  for (let i = 1; i < s.length; i++) {
    if (year <= s[i][0]) {
      const [y0, p0] = s[i - 1];
      const [y1, p1] = s[i];
      const t = y1 === y0 ? 0 : (year - y0) / (y1 - y0);
      return p0 + t * (p1 - p0);
    }
  }
  return s[s.length - 1][1];
}

/**
 * Built-in fallback: ~25 famous cities with real founding years and rough
 * population milestones (order-of-magnitude, from standard historical
 * demography — Chandler, Modelski, Morris). Clearly a coarse sample, but real
 * cities at real places evolving in the right eras. Sizes are metro/urban
 * estimates; exactness isn't claimed and the HUD says "approx".
 */
export const FALLBACK_CITIES: HistoricalCity[] = [
  { name: "Jericho", lat: 31.87, lon: 35.44, foundedYear: -9000, popByYear: [[-9000, 2000], [-7000, 3000], [-1000, 2000], [2020, 20000]] },
  { name: "Uruk", lat: 31.32, lon: 45.64, foundedYear: -4500, popByYear: [[-4500, 5000], [-2900, 60000], [-2000, 40000], [100, 5000], [700, 0]] },
  { name: "Memphis", lat: 29.85, lon: 31.25, foundedYear: -3100, popByYear: [[-3100, 30000], [-2250, 100000], [-1000, 60000], [1, 20000], [1000, 0]] },
  { name: "Babylon", lat: 32.54, lon: 44.42, foundedYear: -2300, popByYear: [[-2300, 20000], [-1770, 60000], [-600, 200000], [1, 10000], [1000, 0]] },
  { name: "Mohenjo-daro", lat: 27.33, lon: 68.14, foundedYear: -2500, popByYear: [[-2500, 35000], [-1900, 40000], [-1500, 0]] },
  { name: "Thebes", lat: 25.72, lon: 32.61, foundedYear: -2000, popByYear: [[-2000, 40000], [-1350, 80000], [-100, 20000], [400, 0]] },
  { name: "Athens", lat: 37.98, lon: 23.73, foundedYear: -1400, popByYear: [[-1400, 5000], [-430, 150000], [1, 30000], [1800, 20000], [2020, 3150000]] },
  { name: "Xi'an", lat: 34.27, lon: 108.95, foundedYear: -1000, popByYear: [[-1000, 30000], [-200, 400000], [750, 1000000], [1500, 200000], [2020, 12900000]] },
  { name: "Rome", lat: 41.9, lon: 12.5, foundedYear: -753, popByYear: [[-753, 30000], [-100, 400000], [1, 1000000], [400, 800000], [1000, 35000], [1870, 200000], [2020, 4300000]] },
  { name: "Alexandria", lat: 31.2, lon: 29.92, foundedYear: -331, popByYear: [[-331, 20000], [-100, 500000], [1, 500000], [700, 100000], [1800, 60000], [2020, 5200000]] },
  { name: "Carthage", lat: 36.85, lon: 10.32, foundedYear: -814, popByYear: [[-814, 20000], [-300, 300000], [-146, 0], [200, 100000], [700, 0]] },
  { name: "Chang'an", lat: 34.34, lon: 108.94, foundedYear: -200, popByYear: [[-200, 250000], [2, 250000], [750, 1000000], [900, 0]] },
  { name: "Constantinople", lat: 41.01, lon: 28.98, foundedYear: -650, popByYear: [[-650, 10000], [500, 500000], [1000, 300000], [1453, 50000], [2020, 15500000]] },
  { name: "Teotihuacan", lat: 19.69, lon: -98.84, foundedYear: -100, popByYear: [[-100, 20000], [450, 125000], [700, 40000], [800, 0]] },
  { name: "Baghdad", lat: 33.32, lon: 44.36, foundedYear: 762, popByYear: [[762, 100000], [900, 900000], [1258, 150000], [1800, 90000], [2020, 7100000]] },
  { name: "Cairo", lat: 30.04, lon: 31.24, foundedYear: 969, popByYear: [[969, 50000], [1300, 500000], [1800, 260000], [1950, 2400000], [2020, 20900000]] },
  { name: "Tenochtitlan", lat: 19.43, lon: -99.13, foundedYear: 1325, popByYear: [[1325, 20000], [1500, 200000], [1521, 100000], [1600, 30000], [1900, 500000], [2020, 21800000]] },
  { name: "Beijing", lat: 39.9, lon: 116.4, foundedYear: 1045, popByYear: [[1045, 40000], [1420, 700000], [1800, 1100000], [1950, 4400000], [2020, 20500000]] },
  { name: "London", lat: 51.51, lon: -0.13, foundedYear: 47, popByYear: [[47, 10000], [200, 45000], [1000, 15000], [1500, 50000], [1800, 1000000], [1900, 6500000], [2020, 9300000]] },
  { name: "Paris", lat: 48.86, lon: 2.35, foundedYear: -52, popByYear: [[-52, 8000], [1200, 110000], [1500, 200000], [1800, 550000], [1900, 3300000], [2020, 11000000]] },
  { name: "Istanbul", lat: 41.01, lon: 28.98, foundedYear: 1453, popByYear: [[1453, 50000], [1600, 700000], [1900, 900000], [2020, 15500000]] },
  { name: "New York", lat: 40.71, lon: -74.01, foundedYear: 1624, popByYear: [[1624, 300], [1800, 60000], [1900, 3400000], [1950, 12300000], [2020, 18800000]] },
  { name: "Tokyo", lat: 35.69, lon: 139.69, foundedYear: 1457, popByYear: [[1457, 5000], [1720, 1000000], [1900, 1500000], [1950, 11300000], [2020, 37400000]] },
  { name: "Los Angeles", lat: 34.05, lon: -118.24, foundedYear: 1781, popByYear: [[1781, 300], [1900, 100000], [1950, 4000000], [2020, 12400000]] },
  { name: "Mumbai", lat: 19.08, lon: 72.88, foundedYear: 1507, popByYear: [[1507, 10000], [1800, 200000], [1900, 780000], [1950, 3000000], [2020, 20400000]] },
  { name: "São Paulo", lat: -23.55, lon: -46.63, foundedYear: 1554, popByYear: [[1554, 500], [1900, 240000], [1950, 2400000], [2020, 22000000]] },
];

/**
 * Fetch + normalize the cities-over-time catalog. On any failure returns the
 * built-in fallback with usingFallback = true. Accepts an AbortSignal.
 */
export async function fetchHistoricalCities(
  signal?: AbortSignal
): Promise<HistoricalCityCatalog> {
  try {
    const res = await fetch(CITIES_OVER_TIME_URL, { signal });
    if (!res.ok) throw new Error(`cities_over_time.json responded ${res.status}`);
    const json = (await res.json()) as { meta?: { source?: string }; cities?: unknown };
    if (!Array.isArray(json.cities) || json.cities.length === 0) {
      throw new Error("cities_over_time.json empty or malformed");
    }
    const cities = json.cities
      .map((c) => normalizeCity(c as RawCity))
      .filter((c): c is HistoricalCity => c !== null);
    if (cities.length === 0) throw new Error("no valid city records");
    return {
      source: json.meta?.source ?? "public/data/history/cities_over_time.json",
      usingFallback: false,
      cities,
    };
  } catch {
    return {
      source: "built-in sample (25 cities)",
      usingFallback: true,
      cities: FALLBACK_CITIES,
    };
  }
}
