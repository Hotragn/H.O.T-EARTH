/**
 * lib/sun-facts.ts — static reference data + defensive parsers for the Sun tab.
 *
 * This is the counterpart to lib/sun.ts (the pure physics/heliophysics API). It
 * holds NO physics — only:
 *   • SUN_CHANNELS — the six committed NASA/SDO full-disk images (provenance in
 *     public/textures/sun/manifest.json), each labelled with what it shows.
 *   • SWPC_ENDPOINTS — the live NOAA/SWPC space-weather feeds (CORS `*`, public
 *     domain) the frontend fetches client-side, with the committed
 *     public/data/sun/spaceweather.json as a defensive fallback.
 *   • Defensive parsers that normalise the (varying) SWPC JSON shapes and the
 *     committed snapshot into one SpaceWeatherView. Every parser is null-safe
 *     and pure so it survives shape drift without crashing the panel.
 *
 * Honesty contract (docs/SUN_DATA_SOURCES.md): we VISUALISE SWPC's measurements
 * and forecasts and ATTRIBUTE them; we never invent our own space-weather
 * forecast. Each metric carries a `category` (MEASURED / FORECAST / COMPUTED)
 * and a `source` (live / snapshot) so the UI can label it truthfully.
 */

// ───────────────────────────── SDO wavelengths ──────────────────────────────

export interface SunChannel {
  /** manifest channel id + texture filename stem. */
  id: string;
  /** short switcher label. */
  label: string;
  /** committed full-disk image path (public/). */
  file: string;
  /** what the channel physically shows. */
  shows: string;
  /** characteristic emission temperature (display string). */
  temp: string;
  /** warm/false-colour glow tint for the corona halo (hex). */
  glow: string;
}

/**
 * The six committed SDO channels, in switcher order (hot corona → photosphere →
 * magnetic field). AIA channels are FALSE-COLOUR by wavelength — the palette is
 * per-channel, not the Sun's true colour. HMI continuum is the visible
 * photosphere (sunspots); HMI magnetogram is the line-of-sight magnetic field.
 * Provenance + observation timestamps: public/textures/sun/manifest.json.
 */
export const SUN_CHANNELS: readonly SunChannel[] = [
  {
    id: "aia171",
    label: "AIA 171",
    file: "/textures/sun/aia171.jpg",
    shows: "Quiet corona & coronal loops",
    temp: "~600,000 K",
    glow: "#e0a63a",
  },
  {
    id: "aia193",
    label: "AIA 193",
    file: "/textures/sun/aia193.jpg",
    shows: "Hotter corona & coronal holes",
    temp: "~1.2 million K",
    glow: "#c98a3a",
  },
  {
    id: "aia211",
    label: "AIA 211",
    file: "/textures/sun/aia211.jpg",
    shows: "Active-region corona",
    temp: "~2 million K",
    glow: "#b579c9",
  },
  {
    id: "aia304",
    label: "AIA 304",
    file: "/textures/sun/aia304.jpg",
    shows: "Chromosphere / transition region, prominences",
    temp: "~50,000 K",
    glow: "#e0562f",
  },
  {
    id: "hmi_continuum",
    label: "HMI continuum",
    file: "/textures/sun/hmi_continuum.jpg",
    shows: "Visible photosphere — sunspots",
    temp: "~5,772 K",
    glow: "#e8c86a",
  },
  {
    id: "hmi_magnetogram",
    label: "HMI magnetogram",
    file: "/textures/sun/hmi_magnetogram.jpg",
    shows: "Line-of-sight photospheric magnetic field",
    temp: "magnetic polarity",
    glow: "#9aa2b1",
  },
] as const;

export const DEFAULT_CHANNEL_ID = SUN_CHANNELS[0].id;

export function getChannel(id: string): SunChannel {
  return SUN_CHANNELS.find((c) => c.id === id) ?? SUN_CHANNELS[0];
}

/** Manifest image record (public/textures/sun/manifest.json → images[]). */
export interface ManifestImage {
  channel: string;
  observation_time?: string;
  dimensions?: string;
}
export interface SunManifest {
  provider?: string;
  credit?: string;
  images?: ManifestImage[];
}

/** channel id → observation time, from the parsed manifest. */
export function manifestObservationTimes(
  manifest: SunManifest | null,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!manifest?.images) return out;
  for (const img of manifest.images) {
    if (img?.channel && typeof img.observation_time === "string") {
      out[img.channel] = img.observation_time;
    }
  }
  return out;
}

// ──────────────────────────── SWPC live endpoints ───────────────────────────
//
// All verified `Access-Control-Allow-Origin: *` + public domain on 2026-07-18
// (docs/SUN_DATA_SOURCES.md). Fetched live client-side; the committed snapshot
// is the offline / first-paint / rate-limit fallback.

const SWPC = "https://services.swpc.noaa.gov/";

export const SWPC_ENDPOINTS = {
  windSpeed: SWPC + "products/summary/solar-wind-speed.json",
  windMag: SWPC + "products/summary/solar-wind-mag-field.json",
  kp: SWPC + "products/noaa-planetary-k-index.json",
  xray: SWPC + "json/goes/primary/xrays-6-hour.json",
  flares: SWPC + "json/goes/primary/xray-flares-latest.json",
  aurora: SWPC + "json/ovation_aurora_latest.json",
  f107: SWPC + "json/f107_cm_flux.json",
} as const;

/** Committed defensive fallbacks. */
export const SNAPSHOT_PATH = "/data/sun/spaceweather.json";
export const SOLAR_CYCLE_PATH = "/data/sun/solar_cycle.json";
export const MANIFEST_PATH = "/textures/sun/manifest.json";

// ──────────────────────────── Normalised view ───────────────────────────────

export type MetricCategory = "MEASURED" | "FORECAST" | "COMPUTED";
export type MetricSource = "live" | "snapshot";

export interface SWMetric {
  value: number | null;
  /** ISO-ish time tag string, as reported by the source. */
  time: string | null;
  source: MetricSource;
}

function metric(
  value: number | null,
  time: string | null,
  source: MetricSource,
): SWMetric {
  return { value: typeof value === "number" && Number.isFinite(value) ? value : null, time, source };
}

export interface SpaceWeatherView {
  windSpeed: SWMetric; // km/s   MEASURED (DSCOVR/ACE @ L1)
  bt: SWMetric; //        nT     MEASURED
  bz: SWMetric; //        nT     MEASURED (southward drives aurora)
  kp: SWMetric; //        Kp     MEASURED (estimated planetary)
  xrayFlux: SWMetric; //  W/m²   MEASURED (GOES XRS long channel)
  currentFlareClass: string | null;
  largestFlareClass: string | null;
  largestFlareTime: string | null;
  flareSource: MetricSource;
  sunspotNumber: SWMetric; // monthly MEASURED (NOAA public-domain count)
  sunspotMonth: string | null;
  f107: SWMetric; //       sfu   MEASURED (10.7 cm radio flux)
  f107Month: string | null;
  auroraMaxProbPct: SWMetric; // % FORECAST (SWPC OVATION model)
  auroraObsTime: string | null;
  auroraForecastTime: string | null;
  generatedUtc: string | null; // snapshot generation time
}

// ─────────────────────────── snapshot → view ────────────────────────────────

function num(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const v = Number(x);
    return Number.isFinite(v) ? v : null;
  }
  return null;
}

function str(x: unknown): string | null {
  return typeof x === "string" && x.length > 0 ? x : null;
}

/**
 * Build the baseline view from the committed snapshot JSON (its nested shape,
 * see public/data/sun/spaceweather.json). Everything is tagged source
 * "snapshot"; live fetches overlay individual fields afterwards. Null-safe: any
 * missing branch yields a null metric rather than throwing.
 */
export function buildSnapshotView(raw: unknown): SpaceWeatherView {
  const r = (raw ?? {}) as Record<string, unknown>;
  const sw = (r.solar_wind ?? {}) as Record<string, unknown>;
  const pk = (r.planetary_k_index ?? {}) as Record<string, unknown>;
  const pkLatest = (pk.latest ?? {}) as Record<string, unknown>;
  const xr = (r.xray ?? {}) as Record<string, unknown>;
  const ss = (r.sunspot_number ?? {}) as Record<string, unknown>;
  const f = (r.f10_7 ?? {}) as Record<string, unknown>;
  const au = (r.aurora ?? {}) as Record<string, unknown>;
  const meta = (r.meta ?? {}) as Record<string, unknown>;

  return {
    windSpeed: metric(num(sw.speed_km_s) ?? num(sw.summary_proton_speed_km_s), str(sw.time_tag), "snapshot"),
    bt: metric(num(sw.bt_nt), str(sw.time_tag), "snapshot"),
    bz: metric(num(sw.bz_gsm_nt) ?? num(sw.summary_bz_gsm_nt), str(sw.time_tag), "snapshot"),
    kp: metric(num(pkLatest.kp), str(pkLatest.time_tag), "snapshot"),
    xrayFlux: metric(num(xr.long_flux_wm2), str(xr.time_tag), "snapshot"),
    currentFlareClass: str(xr.current_class) ?? str(xr.reported_current_class),
    largestFlareClass: str(xr.todays_max_flare_class),
    largestFlareTime: str(xr.todays_max_flare_time),
    flareSource: "snapshot",
    sunspotNumber: metric(num(ss.value_swpc), str(ss.month), "snapshot"),
    sunspotMonth: str(ss.month),
    f107: metric(num(f.value_sfu), str(f.month), "snapshot"),
    f107Month: str(f.month),
    auroraMaxProbPct: metric(num(au.max_probability_pct), str(au.forecast_time), "snapshot"),
    auroraObsTime: str(au.observation_time),
    auroraForecastTime: str(au.forecast_time),
    generatedUtc: str(meta.generated_utc),
  };
}

// ─────────────────── live SWPC parsers (defensive) ──────────────────────────
//
// SWPC JSON shapes drift (see docs/SUN_DATA_SOURCES.md "endpoint-name drift").
// Every parser probes several plausible key spellings and both header-array and
// list-of-dicts layouts, returning nulls on anything it does not recognise.

/** pick the first finite number among candidate keys of an object. */
function pick(obj: Record<string, unknown> | undefined, keys: string[]): number | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = num(obj[k]);
    if (v !== null) return v;
  }
  return null;
}
function pickStr(obj: Record<string, unknown> | undefined, keys: string[]): string | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = str(obj[k]);
    if (v !== null) return v;
  }
  return null;
}

/** products/summary/solar-wind-speed.json → { speed, time }. */
export function parseWindSpeed(json: unknown): { speed: number | null; time: string | null } {
  const o = (json ?? {}) as Record<string, unknown>;
  return {
    speed: pick(o, ["WindSpeed", "proton_speed", "Speed", "speed"]),
    time: pickStr(o, ["TimeStamp", "time_tag", "timestamp"]),
  };
}

/** products/summary/solar-wind-mag-field.json → { bt, bz, time }. */
export function parseWindMag(json: unknown): {
  bt: number | null;
  bz: number | null;
  time: string | null;
} {
  const o = (json ?? {}) as Record<string, unknown>;
  return {
    bt: pick(o, ["Bt", "bt", "bt_nt"]),
    bz: pick(o, ["Bz", "bz", "bz_gsm", "bz_gsm_nt", "Bz_gsm"]),
    time: pickStr(o, ["TimeStamp", "time_tag", "timestamp"]),
  };
}

/**
 * products/noaa-planetary-k-index.json → latest Kp. Handles BOTH the classic
 * header-array ([["time_tag","Kp",...],[...],...]) and a list-of-dicts.
 */
export function parseKp(json: unknown): { kp: number | null; time: string | null } {
  if (!Array.isArray(json) || json.length === 0) return { kp: null, time: null };
  const first = json[0];
  // header-array layout: first row is an array of column-name strings
  if (Array.isArray(first) && first.every((c) => typeof c === "string")) {
    const cols = first as string[];
    const kpIdx = cols.findIndex((c) => /^kp/i.test(c) || /kp_index/i.test(c));
    const timeIdx = cols.findIndex((c) => /time/i.test(c));
    const last = json[json.length - 1];
    if (Array.isArray(last)) {
      return {
        kp: kpIdx >= 0 ? num(last[kpIdx]) : null,
        time: timeIdx >= 0 ? str(last[timeIdx]) : null,
      };
    }
    return { kp: null, time: null };
  }
  // list-of-dicts layout
  const last = json[json.length - 1] as Record<string, unknown>;
  return {
    kp: pick(last, ["kp", "Kp", "kp_index", "estimated_kp"]),
    time: pickStr(last, ["time_tag", "TimeStamp"]),
  };
}

/**
 * json/goes/primary/xrays-6-hour.json → latest LONG-channel (0.1–0.8 nm) flux.
 * Records carry `energy` ("0.05-0.4nm" | "0.1-0.8nm"); flare class uses long.
 */
export function parseXray(json: unknown): { flux: number | null; time: string | null } {
  if (!Array.isArray(json)) return { flux: null, time: null };
  let best: { flux: number | null; time: string | null } = { flux: null, time: null };
  for (const rec of json) {
    if (!rec || typeof rec !== "object") continue;
    const o = rec as Record<string, unknown>;
    const energy = str(o.energy) ?? "";
    if (!energy.includes("0.1-0.8")) continue; // long channel only
    const flux = pick(o, ["flux", "observed_flux"]);
    const time = pickStr(o, ["time_tag"]);
    if (flux !== null) best = { flux, time }; // records are chronological → last wins
  }
  return best;
}

/**
 * json/goes/primary/xray-flares-latest.json → current + largest recent flare.
 * May be an array of events or a single object.
 */
export function parseFlares(json: unknown): {
  current: string | null;
  largest: string | null;
  largestTime: string | null;
} {
  const rec = Array.isArray(json) ? json[json.length - 1] : json;
  if (!rec || typeof rec !== "object") {
    return { current: null, largest: null, largestTime: null };
  }
  const o = rec as Record<string, unknown>;
  return {
    current: pickStr(o, ["current_class", "current_class_long"]),
    largest: pickStr(o, ["max_class", "class"]),
    largestTime: pickStr(o, ["max_time", "begin_time", "time_tag"]),
  };
}

/**
 * json/ovation_aurora_latest.json → max aurora probability across the grid.
 * `coordinates` is [[lon, lat, prob%], …] (~65k points). We only surface the
 * max probability + the forecast/observation times — SWPC's own model output.
 */
export function parseAurora(json: unknown): {
  maxProb: number | null;
  obsTime: string | null;
  forecastTime: string | null;
} {
  const o = (json ?? {}) as Record<string, unknown>;
  const coords = o.coordinates;
  let maxProb: number | null = null;
  if (Array.isArray(coords)) {
    for (const c of coords) {
      if (Array.isArray(c) && c.length >= 3) {
        const p = num(c[2]);
        if (p !== null && (maxProb === null || p > maxProb)) maxProb = p;
      }
    }
  }
  return {
    maxProb,
    obsTime: pickStr(o, ["Observation Time", "observation_time"]),
    forecastTime: pickStr(o, ["Forecast Time", "forecast_time"]),
  };
}

/** json/f107_cm_flux.json → latest daily F10.7 (best-effort; can lag). */
export function parseF107(json: unknown): { flux: number | null; time: string | null } {
  if (!Array.isArray(json) || json.length === 0) return { flux: null, time: null };
  const last = json[json.length - 1];
  if (!last || typeof last !== "object") return { flux: null, time: null };
  const o = last as Record<string, unknown>;
  return {
    flux: pick(o, ["flux", "f10.7", "f107", "value"]),
    time: pickStr(o, ["time_tag", "date"]),
  };
}

// ──────────────────────────── solar-cycle chart ─────────────────────────────

export interface CycleObserved {
  month: string;
  ssn_swpc: number | null;
  ssn_isn?: number | null;
  smoothed_ssn?: number | null;
  f107?: number | null;
}
export interface CyclePredicted {
  month: string;
  predicted_ssn: number | null;
  high_ssn?: number | null;
  low_ssn?: number | null;
}
export interface SolarCycleData {
  observed: CycleObserved[];
  predicted: CyclePredicted[];
}

/** Defensive parse of public/data/sun/solar_cycle.json. Null → unrecognised. */
export function parseSolarCycle(raw: unknown): SolarCycleData | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const obsRaw = r.cycle25_observed;
  const predRaw = r.cycle25_predicted;
  if (!Array.isArray(obsRaw)) return null;

  const observed: CycleObserved[] = [];
  for (const row of obsRaw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const month = str(o.month);
    if (!month) continue;
    const smoothed = num(o.smoothed_ssn);
    observed.push({
      month,
      ssn_swpc: num(o.ssn_swpc),
      ssn_isn: num(o.ssn_isn),
      // SWPC uses -1 as a "not yet smoothable" sentinel — drop it.
      smoothed_ssn: smoothed !== null && smoothed >= 0 ? smoothed : null,
      f107: num(o.f107),
    });
  }
  if (observed.length === 0) return null;

  const predicted: CyclePredicted[] = [];
  if (Array.isArray(predRaw)) {
    for (const row of predRaw) {
      if (!row || typeof row !== "object") continue;
      const o = row as Record<string, unknown>;
      const month = str(o.month);
      if (!month) continue;
      predicted.push({
        month,
        predicted_ssn: num(o.predicted_ssn),
        high_ssn: num(o.high_ssn),
        low_ssn: num(o.low_ssn),
      });
    }
  }
  return { observed, predicted };
}

/** "YYYY-MM" → fractional year (e.g. 2024-10 → 2024.75) for x-positioning. */
export function monthToYear(month: string): number | null {
  const m = /^(\d{4})-(\d{2})/.exec(month);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (!Number.isFinite(y) || !Number.isFinite(mo)) return null;
  return y + (mo - 0.5) / 12;
}
