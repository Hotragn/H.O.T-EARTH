/**
 * World population over time — defensive loader + interpolation for the Virtual
 * Earth HUD's global population counter that climbs with the timeline.
 *
 * EXPECTED asset (dropped separately by the coordinator / research agent):
 *   public/data/history/population.json
 *   [ [year, population], [year, population], ... ]   (year CE, negative = BCE)
 *
 * If the fetch fails we fall back to a compact set of real demographic
 * milestones (HYDE / US Census Bureau / UN historical estimates). Population is
 * interpolated log-linearly between samples — growth is exponential-ish, so a
 * log interpolation reads far more truthfully than a straight line across, say,
 * 1800→1927. Clearly an estimate; the HUD labels it "approx".
 */

export interface PopulationSeries {
  source: string;
  usingFallback: boolean;
  /** sorted [year, population] samples */
  points: Array<[number, number]>;
}

export const POPULATION_URL = "/data/history/population.json";

/**
 * Built-in fallback: real world-population milestones. Deep-past values are
 * order-of-magnitude estimates (HYDE 3.2 / McEvedy & Jones); modern values are
 * well established (UN / US Census "8 billion" 2022).
 */
export const FALLBACK_POPULATION: Array<[number, number]> = [
  [-10000, 4_000_000],
  [-5000, 19_000_000],
  [-3000, 45_000_000],
  [-1000, 115_000_000],
  [1, 300_000_000],
  [1000, 310_000_000],
  [1500, 500_000_000],
  [1700, 610_000_000],
  [1800, 1_000_000_000],
  [1850, 1_260_000_000],
  [1900, 1_650_000_000],
  [1927, 2_000_000_000],
  [1950, 2_500_000_000],
  [1974, 4_000_000_000],
  [1987, 5_000_000_000],
  [1999, 6_000_000_000],
  [2011, 7_000_000_000],
  [2022, 8_000_000_000],
  [2026, 8_200_000_000],
];

function toPairs(raw: unknown): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (Array.isArray(entry) && entry.length >= 2) {
        const y = Number(entry[0]);
        const p = Number(entry[1]);
        if (Number.isFinite(y) && Number.isFinite(p)) pairs.push([y, p]);
      }
    }
  }
  pairs.sort((a, b) => a[0] - b[0]);
  return pairs;
}

/**
 * Log-linear interpolation of world population at a decimal `year`. Held flat
 * outside the sample range. Pure; safe to call per HUD tick.
 */
export function populationAtYear(
  points: Array<[number, number]>,
  year: number
): number {
  if (points.length === 0) return 0;
  if (year <= points[0][0]) return points[0][1];
  if (year >= points[points.length - 1][0]) return points[points.length - 1][1];
  for (let i = 1; i < points.length; i++) {
    if (year <= points[i][0]) {
      const [y0, p0] = points[i - 1];
      const [y1, p1] = points[i];
      const t = y1 === y0 ? 0 : (year - y0) / (y1 - y0);
      // log-linear: exponential growth reads truthfully between milestones
      const l0 = Math.log(Math.max(p0, 1));
      const l1 = Math.log(Math.max(p1, 1));
      return Math.exp(l0 + t * (l1 - l0));
    }
  }
  return points[points.length - 1][1];
}

/** "8.0B" / "300M" / "45M" / "19K" compact population label. */
export function formatPopulation(pop: number): string {
  if (pop >= 1_000_000_000) return `${(pop / 1_000_000_000).toFixed(1)}B`;
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(pop >= 10_000_000 ? 0 : 1)}M`;
  if (pop >= 1_000) return `${Math.round(pop / 1_000)}K`;
  return String(Math.round(pop));
}

export async function fetchPopulationSeries(
  signal?: AbortSignal
): Promise<PopulationSeries> {
  try {
    const res = await fetch(POPULATION_URL, { signal });
    if (!res.ok) throw new Error(`population.json responded ${res.status}`);
    const json = (await res.json()) as unknown;
    const points = toPairs(json);
    if (points.length === 0) throw new Error("population.json empty or malformed");
    return { source: "public/data/history/population.json", usingFallback: false, points };
  } catch {
    return { source: "built-in milestones", usingFallback: true, points: FALLBACK_POPULATION };
  }
}
