/**
 * Defensive loader/parser for the lunar diurnal surface-temperature artifact
 * public/data/moon/diurnal_temperature.json (built offline by
 * scripts/moon/build_diurnal_temperature.py; see docs/MOON_DATA_SOURCES.md §2).
 *
 * The Moon has NO atmosphere → NO weather. This is the honest, dramatic
 * "dynamic" signal: the ~300 K day-night SURFACE-temperature swing measured by
 * LRO Diviner (Williams et al. 2017). DAYTIME is the Diviner team's radiative-
 * equilibrium formula; NIGHTSIDE is anchored to Diviner's measured curve. It is
 * an ILLUSTRATIVE-BUT-GROUNDED model, not a live feed and not the raw archive —
 * always labeled as such in the UI.
 *
 * Parsing mirrors lib/mars-climatology.ts: parse an unknown payload into a
 * typed shape, return null on mismatch, never throw. The parse function is
 * pure (unit-tested in lib/lunar-temperature.test.ts against the committed
 * artifact); the fetch wrapper is for the browser and tolerates absence.
 */

/** Path the HUD fetches. Kept in one place so the data pipeline can match it. */
export const MOON_DIURNAL_TEMP_PATH = "/data/moon/diurnal_temperature.json";

export interface DiurnalPoint {
  /** local solar time, hours 0–24 (12 = local noon); a fraction of the
   * ~29.53-day lunar day, NOT Earth hours */
  lstHours: number;
  /** surface temperature, kelvin */
  tempK: number;
}

export interface LatitudeStats {
  latitude: number;
  tMaxK: number;
  tMinK: number;
  diurnalSwingK: number;
}

export interface DiurnalTemperature {
  /** measured Diviner extremes (equatorial), for the honest headline readout */
  measured: {
    equatorNoonMaxK: number;
    equatorPreDawnMinK: number;
    equatorMeanK: number;
    equatorDiurnalChangeK: number;
    polarPsrColdTrap: string;
  };
  /** per-latitude summary stats (latitude → {max, min, swing}) */
  statsByLatitude: LatitudeStats[];
  /** per-latitude diurnal curve (temp vs local solar time) */
  curvesByLatitude: Array<{ latitude: number; points: DiurnalPoint[] }>;
  /** short provenance string for the attribution line */
  sourceKind: string;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Parse an unknown JSON payload (the shape of diurnal_temperature.json) into a
 * DiurnalTemperature. Returns null if the essential fields are missing so
 * callers can degrade gracefully. Never throws.
 */
export function parseDiurnalTemperature(raw: unknown): DiurnalTemperature | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const curvesRaw = obj.curves_by_latitude;
  if (!curvesRaw || typeof curvesRaw !== "object") return null;

  const curvesByLatitude: DiurnalTemperature["curvesByLatitude"] = [];
  for (const [latKey, arr] of Object.entries(
    curvesRaw as Record<string, unknown>
  )) {
    const latitude = Number(latKey);
    if (!Number.isFinite(latitude) || !Array.isArray(arr)) continue;
    const points: DiurnalPoint[] = [];
    for (const row of arr) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const lst = num(r.lst_h);
      const t = num(r.T_K);
      if (lst === null || t === null) continue;
      points.push({ lstHours: lst, tempK: t });
    }
    if (points.length >= 2) {
      points.sort((a, b) => a.lstHours - b.lstHours);
      curvesByLatitude.push({ latitude, points });
    }
  }
  if (curvesByLatitude.length === 0) return null;
  curvesByLatitude.sort((a, b) => a.latitude - b.latitude);

  // Per-latitude stats (prefer the artifact's stats block; else derive).
  const statsRaw = (obj.stats_by_latitude ?? {}) as Record<string, unknown>;
  const statsByLatitude: LatitudeStats[] = [];
  for (const { latitude, points } of curvesByLatitude) {
    const s = statsRaw[String(latitude)] as Record<string, unknown> | undefined;
    let tMaxK = s ? num(s.T_max_K) : null;
    let tMinK = s ? num(s.T_min_K) : null;
    let diurnalSwingK = s ? num(s.diurnal_swing_K) : null;
    if (tMaxK === null || tMinK === null) {
      const temps = points.map((p) => p.tempK);
      tMaxK = Math.max(...temps);
      tMinK = Math.min(...temps);
    }
    if (diurnalSwingK === null) diurnalSwingK = tMaxK - tMinK;
    statsByLatitude.push({ latitude, tMaxK, tMinK, diurnalSwingK });
  }

  const m = (obj.measured_anchors_diviner ?? {}) as Record<string, unknown>;
  const measured = {
    equatorNoonMaxK: num(m.equator_noon_max_K) ?? 392.3,
    equatorPreDawnMinK: num(m.equator_pre_dawn_min_K) ?? 95,
    equatorMeanK: num(m.equator_mean_K) ?? 215.5,
    equatorDiurnalChangeK: num(m.equator_diurnal_change_K) ?? 300,
    polarPsrColdTrap:
      typeof m.polar_psr_cold_trap_K === "string"
        ? m.polar_psr_cold_trap_K
        : "25-40",
  };

  const src = (obj.source ?? {}) as Record<string, unknown>;
  const sourceKind =
    typeof src.kind === "string"
      ? src.kind
      : "physical model anchored to LRO Diviner measurements";

  return { measured, statsByLatitude, curvesByLatitude, sourceKind };
}

/**
 * Fetch + parse the artifact for the browser. Tolerates absence (returns null)
 * so the HUD can show a graceful "unavailable" state rather than crashing.
 */
export async function loadDiurnalTemperature(
  signal?: AbortSignal
): Promise<DiurnalTemperature | null> {
  try {
    const res = await fetch(MOON_DIURNAL_TEMP_PATH, { signal });
    if (!res.ok) return null;
    return parseDiurnalTemperature(await res.json());
  } catch {
    return null;
  }
}

/** Nearest available latitude curve to a requested latitude (deg, |lat|). */
export function curveForLatitude(
  data: DiurnalTemperature,
  latitudeDeg: number
): { latitude: number; points: DiurnalPoint[] } | null {
  const target = Math.abs(latitudeDeg);
  let best: (typeof data.curvesByLatitude)[number] | null = null;
  let bestDiff = Infinity;
  for (const c of data.curvesByLatitude) {
    const diff = Math.abs(c.latitude - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }
  return best;
}

/**
 * Surface temperature at a given local solar time (hours 0–24) and latitude,
 * by linear interpolation of the nearest latitude curve. Returns null if the
 * data has no usable curve. Wraps LST at 24 h.
 */
export function tempAtLocalTime(
  data: DiurnalTemperature,
  latitudeDeg: number,
  lstHours: number
): number | null {
  const curve = curveForLatitude(data, latitudeDeg);
  if (!curve || curve.points.length < 2) return null;
  const lst = ((lstHours % 24) + 24) % 24;
  const pts = curve.points;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (lst >= a.lstHours && lst <= b.lstHours) {
      const span = b.lstHours - a.lstHours || 1;
      const t = (lst - a.lstHours) / span;
      return a.tempK + t * (b.tempK - a.tempK);
    }
  }
  // outside the sampled range → clamp to the nearest endpoint
  return lst < pts[0].lstHours ? pts[0].tempK : pts[pts.length - 1].tempK;
}
