/**
 * Mars seasonal climatology — the *expected* shape of the data artifact the
 * Mars data agent will drop at public/data/mars/climatology.json.
 *
 * This is climatological seasonal averages by areocentric solar longitude (Ls),
 * NOT a live forecast. Consumed defensively by MarsClimatologyPanel: if the
 * file is absent the panel shows "data unavailable" rather than crashing.
 *
 * TODO(coordinator/mars-data-agent): produce public/data/mars/climatology.json
 * matching MarsClimatology below. Suggested source: NASA PDS / Mars Climate
 * Database seasonal means, or REMS (Curiosity) surface pressure/temperature
 * climatology. Rows should sample Ls across 0–360 (e.g. every 5–15°).
 *
 * Expected JSON:
 * {
 *   "meta": {
 *     "source": "NASA PDS / Mars Climate Database",  // string
 *     "note": "Seasonal climatology, not a live forecast",
 *     "site": "Global mean"                          // or a named lander site
 *   },
 *   "byLs": [
 *     {
 *       "ls": 0,                 // areocentric solar longitude, deg 0-360
 *       "pressurePa": 730,       // mean surface pressure, pascals (CO2 cycle)
 *       "tempK": 210,            // mean surface temperature, kelvin (optional)
 *       "dustTau": 0.4           // column dust optical depth (optional)
 *     },
 *     ... one row per sampled Ls, ascending ...
 *   ]
 * }
 */

export interface MarsClimatologyPoint {
  /** areocentric solar longitude, deg 0-360 */
  ls: number;
  /** mean surface pressure in pascals (the CO2 condensation cycle) */
  pressurePa?: number;
  /** mean surface temperature in kelvin */
  tempK?: number;
  /** column dust optical depth (tau) */
  dustTau?: number;
}

export interface MarsClimatology {
  meta: {
    source: string;
    note?: string;
    site?: string;
  };
  byLs: MarsClimatologyPoint[];
}

/** Path the panel fetches. Kept in one place so the data agent can match it. */
export const MARS_CLIMATOLOGY_PATH = "/data/mars/climatology.json";

/**
 * Validate/parse an unknown JSON payload into MarsClimatology. Returns null if
 * the shape doesn't match, so callers can degrade gracefully. Never throws.
 */
export function parseMarsClimatology(raw: unknown): MarsClimatology | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const byLs = obj.byLs;
  if (!Array.isArray(byLs) || byLs.length === 0) return null;

  const points: MarsClimatologyPoint[] = [];
  for (const row of byLs) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (typeof r.ls !== "number") continue;
    points.push({
      ls: r.ls,
      pressurePa: typeof r.pressurePa === "number" ? r.pressurePa : undefined,
      tempK: typeof r.tempK === "number" ? r.tempK : undefined,
      dustTau: typeof r.dustTau === "number" ? r.dustTau : undefined,
    });
  }
  if (points.length === 0) return null;
  points.sort((a, b) => a.ls - b.ls);

  const meta = (obj.meta ?? {}) as Record<string, unknown>;
  return {
    meta: {
      source: typeof meta.source === "string" ? meta.source : "NASA PDS",
      note: typeof meta.note === "string" ? meta.note : undefined,
      site: typeof meta.site === "string" ? meta.site : undefined,
    },
    byLs: points,
  };
}

/**
 * Linear-interpolate a numeric field of the climatology at a given Ls, wrapping
 * around 360°. Returns null if no points carry that field.
 */
export function interpAtLs(
  clim: MarsClimatology,
  ls: number,
  field: "pressurePa" | "tempK" | "dustTau"
): number | null {
  const pts = clim.byLs.filter((p) => typeof p[field] === "number");
  if (pts.length === 0) return null;
  if (pts.length === 1) return pts[0][field] as number;

  const L = ((ls % 360) + 360) % 360;
  // find the bracketing pair (with wraparound)
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    let lo = a.ls;
    let hi = b.ls;
    if (hi < lo) hi += 360; // wrapped segment
    let x = L;
    if (x < lo) x += 360;
    if (x >= lo && x <= hi) {
      const t = hi === lo ? 0 : (x - lo) / (hi - lo);
      return (a[field] as number) + t * ((b[field] as number) - (a[field] as number));
    }
  }
  return pts[0][field] as number;
}
