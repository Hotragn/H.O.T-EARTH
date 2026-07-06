/**
 * Industrial-era climate — defensive loader for the Virtual Earth HUD's
 * optional global temperature-anomaly / CO2 readout, which comes alive in the
 * industrial era (roughly 1850 → present).
 *
 * EXPECTED asset (dropped separately by the coordinator / research agent):
 *   public/data/history/climate.json
 *   [ [year, tempAnomalyC, co2ppm], ... ]   (year CE)
 *   - tempAnomalyC: global mean surface temperature anomaly, °C vs a baseline
 *   - co2ppm: atmospheric CO2, parts per million
 *
 * If the fetch fails we fall back to a few real anchor points (HadCRUT5 /
 * NASA GISTEMP for the anomaly; ice-core + Mauna Loa / NOAA GML for CO2).
 * Clearly labeled in the UI; anomaly baseline stated as 1850–1900 pre-industrial.
 */

export interface ClimateSample {
  year: number;
  /** temperature anomaly °C vs 1850–1900 baseline (null if unknown) */
  tempAnomalyC: number | null;
  /** atmospheric CO2 ppm (null if unknown) */
  co2ppm: number | null;
}

export interface ClimateSeries {
  source: string;
  usingFallback: boolean;
  /** sorted by year */
  samples: ClimateSample[];
}

export const CLIMATE_URL = "/data/history/climate.json";

/** Below this year the industrial-era readout is inactive (labeled so). */
export const CLIMATE_INDUSTRIAL_START = 1850;

/**
 * Built-in fallback: real anchor points. Temperature anomaly vs 1850–1900
 * pre-industrial baseline (HadCRUT5 / GISTEMP); CO2 from ice cores (pre-1958)
 * and Mauna Loa / NOAA thereafter.
 */
export const FALLBACK_CLIMATE: ClimateSample[] = [
  { year: 1850, tempAnomalyC: 0.0, co2ppm: 285 },
  { year: 1900, tempAnomalyC: -0.08, co2ppm: 296 },
  { year: 1950, tempAnomalyC: 0.0, co2ppm: 311 },
  { year: 1980, tempAnomalyC: 0.35, co2ppm: 339 },
  { year: 2000, tempAnomalyC: 0.6, co2ppm: 369 },
  { year: 2020, tempAnomalyC: 1.1, co2ppm: 414 },
  { year: 2024, tempAnomalyC: 1.3, co2ppm: 424 },
];

function normalizeSamples(raw: unknown): ClimateSample[] {
  const out: ClimateSample[] = [];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (Array.isArray(entry) && entry.length >= 1) {
        const year = Number(entry[0]);
        if (!Number.isFinite(year)) continue;
        const t = Number(entry[1]);
        const c = Number(entry[2]);
        out.push({
          year,
          tempAnomalyC: Number.isFinite(t) ? t : null,
          co2ppm: Number.isFinite(c) ? c : null,
        });
      } else if (entry && typeof entry === "object") {
        const o = entry as { year?: unknown; tempAnomalyC?: unknown; co2ppm?: unknown };
        const year = Number(o.year);
        if (!Number.isFinite(year)) continue;
        const t = Number(o.tempAnomalyC);
        const c = Number(o.co2ppm);
        out.push({
          year,
          tempAnomalyC: Number.isFinite(t) ? t : null,
          co2ppm: Number.isFinite(c) ? c : null,
        });
      }
    }
  }
  out.sort((a, b) => a.year - b.year);
  return out;
}

/** Linear interpolation of one channel; skips null samples; held at ends. */
function interpChannel(
  samples: ClimateSample[],
  year: number,
  pick: (s: ClimateSample) => number | null
): number | null {
  const pts: Array<[number, number]> = [];
  for (const s of samples) {
    const v = pick(s);
    if (v !== null) pts.push([s.year, v]);
  }
  if (pts.length === 0) return null;
  if (year <= pts[0][0]) return pts[0][1];
  if (year >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 1; i < pts.length; i++) {
    if (year <= pts[i][0]) {
      const [y0, v0] = pts[i - 1];
      const [y1, v1] = pts[i];
      const t = y1 === y0 ? 0 : (year - y0) / (y1 - y0);
      return v0 + t * (v1 - v0);
    }
  }
  return pts[pts.length - 1][1];
}

export interface ClimateReadout {
  /** true once the timeline is in the industrial era and data exists */
  active: boolean;
  tempAnomalyC: number | null;
  co2ppm: number | null;
}

/** Interpolated climate readout at `year`. Inactive before the industrial era. */
export function climateAtYear(
  samples: ClimateSample[],
  year: number
): ClimateReadout {
  if (year < CLIMATE_INDUSTRIAL_START || samples.length === 0) {
    return { active: false, tempAnomalyC: null, co2ppm: null };
  }
  return {
    active: true,
    tempAnomalyC: interpChannel(samples, year, (s) => s.tempAnomalyC),
    co2ppm: interpChannel(samples, year, (s) => s.co2ppm),
  };
}

export async function fetchClimateSeries(
  signal?: AbortSignal
): Promise<ClimateSeries> {
  try {
    const res = await fetch(CLIMATE_URL, { signal });
    if (!res.ok) throw new Error(`climate.json responded ${res.status}`);
    const json = (await res.json()) as unknown;
    const samples = normalizeSamples(json);
    if (samples.length === 0) throw new Error("climate.json empty or malformed");
    return { source: "public/data/history/climate.json", usingFallback: false, samples };
  } catch {
    return { source: "built-in anchors", usingFallback: true, samples: FALLBACK_CLIMATE };
  }
}
