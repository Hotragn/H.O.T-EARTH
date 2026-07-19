/**
 * Honest presentation + defensive data layer for the METEOR SHOWERS phase (a
 * "Solar System" world, sitting beside Comets & Asteroids because showers are the
 * debris of those same comets and asteroids). This is the meteor-shower analogue
 * of lib/star-facts.ts / lib/small-body-facts.ts: a thin PRESENTATION wrapper over
 * the pure physics in lib/meteor-showers.ts (which itself reuses lib/celestial),
 * over the shipped catalogue public/data/meteor-showers/showers.json, and over
 * lib/lunar for "moon phase at peak".
 *
 * Division of responsibility (so every printed pixel is traceable):
 *   • MEASURED / catalogue values — radiant RA/Dec (J2000), peak date, peak solar
 *     longitude, activity window, entry velocity (V∞), population index and parent
 *     body (IAU MDC + IMO Working List). Read verbatim; a null renders honestly
 *     (variable ZHR, "no firmly established parent"), never invented.
 *   • COMPUTED derivations — solar longitude λ☉, is-active / near-peak, the 3D
 *     radiant direction and alt/az, the altitude-corrected OBSERVED-RATE estimate,
 *     moon phase at peak, best-viewing time. All lib/meteor-showers + lib/lunar
 *     pure functions, labelled as computed / approximate.
 *   • ILLUSTRATIVE — the drawn meteor streaks and the debris-stream diagram (real
 *     geometry, drawn particles); labelled illustrative wherever shown.
 *
 * HONESTY BAR: ZHR is an IDEALISED peak rate (radiant at the zenith, perfect dark
 * sky); real observed rates are LOWER and we compute the sin(altitude)-corrected
 * estimate. Peak dates drift ~1 day/yr, so timing is keyed to solar longitude
 * (stable). Attribution to the IAU MDC (Jopek & Kaňuchová 2017) and the IMO is a
 * requirement and lives as constants below.
 */

import type { HorizontalCoord } from "./celestial";
import { raDecToVector3 } from "./celestial";
import { moonPhase, type MoonPhase } from "./lunar";
import {
  activityFraction as _activityFraction,
  currentlyActiveShowers as _currentlyActiveShowers,
  daysToPeak as _daysToPeak,
  isActive as _isActive,
  isNearPeak as _isNearPeak,
  isRadiantUp as _isRadiantUp,
  monthDayToDayOfYear,
  nextShower as _nextShower,
  observedRateEstimate as _observedRateEstimate,
  radiantAltAz as _radiantAltAz,
  radiantVector3 as _radiantVector3,
  showerState as _showerState,
  showerStrength,
  solarLongitudeDeg,
  velocityClass,
  type MeteorShower,
  type ObservedRateOptions,
  type ShowerState,
  type ShowerStrength,
  type VelocityClass,
} from "./meteor-showers";

// ─────────────────────────────── Paths + accent ─────────────────────────────

export const SHOWERS_PATH = "/data/meteor-showers/showers.json";
export const STARS_BACKDROP_PATH = "/data/night-sky/stars.json";

/** Meteor teal-green accent — matches the worlds registry. */
export const METEOR_ACCENT = "#4fe3b0";
export const METEOR_ACCENT_DIM = "#2f9d7c";

/** Data year of the shipped peak/activity dates (peaks drift ~±1 day/yr). */
export const DATA_YEAR = 2026;

/** Shown instead of any missing measured value. Never invent. */
export const NOT_MEASURED = "not measured";

// ─────────────── Attribution (requirements; rendered verbatim) ───────────────
// Displayed in the MeteorAttributionFooter and the AboutModal "Meteor showers"
// section. Radiants/dates/velocities/parents are real catalog data; ZHR/r are the
// IMO estimates. We do NOT redistribute the IMO Calendar itself (restrictive
// terms) — we ship the underlying measured facts and credit the source.

export const IAU_MDC_ATTRIBUTION =
  "Shower catalog (radiants, solar longitude, velocity, parent bodies): IAU " +
  "Meteor Data Center shower database — Jopek & Kaňuchová (2017), Planet. Space " +
  "Sci. 143, 3.";

export const IMO_ATTRIBUTION =
  "Activity windows, peak dates, ZHR and population index: IMO Working List of " +
  "Visual Meteor Showers (2026 IMO Meteor Shower Calendar, ed. J. Rendtel). Facts " +
  "used and credited; the IMO Calendar itself is not redistributed.";

export const AMS_ATTRIBUTION =
  "Cross-checked against the American Meteor Society meteor-shower calendar.";

/** The credits in display order, with source links for the About panel. */
export const METEOR_ATTRIBUTIONS: readonly { text: string; href: string }[] = [
  {
    text: IAU_MDC_ATTRIBUTION,
    href: "http://www.ta3.sk/IAUC22DB/MDC2022/Roje/roje_lista.php",
  },
  { text: IMO_ATTRIBUTION, href: "https://www.imo.net/files/meteor-shower/cal2026.pdf" },
  {
    text: AMS_ATTRIBUTION,
    href: "https://www.amsmeteors.org/meteor-showers/meteor-shower-calendar/",
  },
];

/** The honest one-liner shown in the framing banner. */
export const METEOR_HONESTY_NOTE =
  "Radiants, peak dates, solar longitude, velocities and parent bodies are real " +
  "catalog data (IAU MDC + IMO). ZHR is an idealised peak rate — radiant at the " +
  "zenith, perfect dark sky; real observed rates are lower, so we compute the " +
  "altitude-corrected estimate. Peaks drift ~1 day/yr, so timing is keyed to solar " +
  "longitude. Meteor streaks and the debris-stream diagram are illustrative.";

// ─────────────────────────────── Catalogue types ────────────────────────────

/**
 * One shower row, matching public/data/meteor-showers/showers.json. Structurally
 * a superset of lib/meteor-showers' MeteorShower, but with the nullable columns
 * (variable ZHR; the 17 showers with no established parent) typed honestly. The
 * physics functions are re-exported below as thin wrappers so callers pass this
 * record type directly.
 */
export interface MeteorShowerRecord {
  code: string;
  iau_number: number | null;
  name: string;
  radiant_ra: number;
  radiant_dec: number;
  peak_date: string;
  peak_solar_longitude: number;
  active_start: string;
  active_end: string;
  /** null when the IMO marks the shower "Var" (variable / outburst-driven). */
  zhr: number | null;
  velocity_kms: number;
  r_population_index: number | null;
  parent_body: string | null;
  parent_type: string | null;
  parent_designation: string | null;
  parent_in_catalog: boolean;
  note: string | null;
  [key: string]: unknown;
}

export interface ShowerCatalogMeta {
  title: string;
  year: number;
  attribution: string;
  honesty: string;
}

export interface ShowerCatalog {
  meta: ShowerCatalogMeta;
  showers: MeteorShowerRecord[];
}

// ─────────────────────────────── null guards ────────────────────────────────

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
function bool(v: unknown): boolean {
  return v === true;
}

/**
 * Cast a presentation record to the physics module's MeteorShower shape. The
 * physics functions guard every field defensively (a null ZHR yields a null
 * rate, etc.), so the only real difference is the compile-time nullability of
 * zhr — this keeps the cast in exactly one place.
 */
function asShower(s: MeteorShowerRecord | null | undefined): MeteorShower | null | undefined {
  return s as unknown as MeteorShower | null | undefined;
}

// ───────────────────────── Defensive catalogue parser ───────────────────────

/**
 * Parse showers.json. Tolerates missing keys, nulls and odd shapes; a row with
 * no code or no radiant direction is skipped (it cannot be plotted). Returns null
 * (→ a graceful empty state) when there is nothing usable. NEVER throws.
 */
export function parseShowerCatalog(raw: unknown): ShowerCatalog | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const rows = root.showers;
  if (!Array.isArray(rows)) return null;

  const showers: MeteorShowerRecord[] = [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const code = str(r.code);
    const ra = num(r.radiant_ra);
    const dec = num(r.radiant_dec);
    // a shower with no code or no radiant direction cannot be rendered
    if (code === null || ra === null || dec === null) continue;
    showers.push({
      code,
      iau_number: num(r.iau_number),
      name: str(r.name) ?? code,
      radiant_ra: ra,
      radiant_dec: dec,
      peak_date: str(r.peak_date) ?? "",
      peak_solar_longitude: num(r.peak_solar_longitude) ?? NaN,
      active_start: str(r.active_start) ?? "",
      active_end: str(r.active_end) ?? "",
      zhr: num(r.zhr),
      velocity_kms: num(r.velocity_kms) ?? NaN,
      r_population_index: num(r.r_population_index),
      parent_body: str(r.parent_body),
      parent_type: str(r.parent_type),
      parent_designation: str(r.parent_designation),
      parent_in_catalog: bool(r.parent_in_catalog),
      note: str(r.note),
    });
  }
  if (showers.length === 0) return null;

  const metaRaw = (root.meta ?? {}) as Record<string, unknown>;
  return {
    meta: {
      title: str(metaRaw.title) ?? "Meteor showers",
      year: num(metaRaw.year) ?? DATA_YEAR,
      attribution: str(metaRaw.attribution) ?? IAU_MDC_ATTRIBUTION,
      honesty: str(metaRaw.honesty) ?? METEOR_HONESTY_NOTE,
    },
    showers,
  };
}

/**
 * Parse a DIM STAR BACKDROP from the night-sky columnar stars.json (read-only —
 * it is the same J2000 celestial frame the radiants use, so real constellations
 * sit behind the radiants for context). Returns preallocated positions for every
 * star brighter than `magLimit`, on a sphere of `radius`. Never throws.
 */
export function parseStarBackdrop(
  raw: unknown,
  radius: number,
  magLimit = 4.8
): { positions: Float32Array; count: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const rows = root.stars;
  if (!Array.isArray(rows)) return null;

  const metaRaw = (root.meta ?? {}) as Record<string, unknown>;
  const columns: string[] = Array.isArray(metaRaw.columns)
    ? (metaRaw.columns as unknown[]).map((c) => String(c))
    : ["id", "ra", "dec", "mag", "ci", "dist_ly", "spect", "name", "bayer", "con"];
  const iRa = columns.indexOf("ra");
  const iDec = columns.indexOf("dec");
  const iMag = columns.indexOf("mag");
  if (iRa < 0 || iDec < 0 || iMag < 0) return null;

  const xs: number[] = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const ra = num(row[iRa]);
    const dec = num(row[iDec]);
    const mag = num(row[iMag]);
    if (ra === null || dec === null || mag === null) continue;
    if (mag > magLimit) continue;
    const [x, y, z] = raDecToVector3(ra, dec, radius);
    xs.push(x, y, z);
  }
  if (xs.length === 0) return null;
  return { positions: Float32Array.from(xs), count: xs.length / 3 };
}

// ──────────── Physics wrappers (record-typed; cast lives in asShower) ─────────

export function isActive(s: MeteorShowerRecord | null | undefined, date: Date) {
  return _isActive(asShower(s), date);
}
export function daysToPeak(s: MeteorShowerRecord | null | undefined, date: Date) {
  return _daysToPeak(asShower(s), date);
}
export function isNearPeak(
  s: MeteorShowerRecord | null | undefined,
  date: Date,
  windowDays = 1
) {
  return _isNearPeak(asShower(s), date, windowDays);
}
export function activityFraction(
  s: MeteorShowerRecord | null | undefined,
  date: Date
) {
  return _activityFraction(asShower(s), date);
}
export function currentlyActiveShowers(
  showers: readonly MeteorShowerRecord[] | null | undefined,
  date: Date
): MeteorShowerRecord[] {
  return _currentlyActiveShowers(
    showers as unknown as readonly MeteorShower[],
    date
  ) as unknown as MeteorShowerRecord[];
}
export function nextShower(
  showers: readonly MeteorShowerRecord[] | null | undefined,
  date: Date
): MeteorShowerRecord | null {
  return _nextShower(
    showers as unknown as readonly MeteorShower[],
    date
  ) as unknown as MeteorShowerRecord | null;
}
export function observedRateEstimate(
  s: MeteorShowerRecord | null | undefined,
  radiantAltitudeDeg: number,
  opts?: ObservedRateOptions
) {
  return _observedRateEstimate(asShower(s), radiantAltitudeDeg, opts);
}
export function radiantAltAz(
  s: MeteorShowerRecord | null | undefined,
  lat: number,
  lon: number,
  date: Date
): HorizontalCoord | null {
  return _radiantAltAz(asShower(s), lat, lon, date);
}
export function radiantVector3(
  s: MeteorShowerRecord | null | undefined,
  radius?: number
): [number, number, number] | null {
  return _radiantVector3(asShower(s), radius);
}
export function isRadiantUp(
  s: MeteorShowerRecord | null | undefined,
  lat: number,
  lon: number,
  date: Date
) {
  return _isRadiantUp(asShower(s), lat, lon, date);
}
export function showerState(
  s: MeteorShowerRecord | null | undefined,
  lat: number,
  lon: number,
  date: Date
): ShowerState | null {
  return _showerState(asShower(s), lat, lon, date);
}

export { solarLongitudeDeg, showerStrength, velocityClass, monthDayToDayOfYear };
export type { ShowerState, ShowerStrength, VelocityClass, HorizontalCoord, MoonPhase };

// ────────────────────────── Classification styling ──────────────────────────

export interface StrengthStyle {
  label: string;
  color: string;
  note: string;
}

const STRENGTH_STYLES: Record<ShowerStrength, StrengthStyle> = {
  weak: {
    label: "Weak",
    color: "#7a8598",
    note: "barely above the sporadic background",
  },
  minor: { label: "Minor", color: "#5fbf9a", note: "a modest but real shower" },
  strong: { label: "Strong", color: "#4fe3b0", note: "a rich shower at peak" },
  major: {
    label: "Major",
    color: "#ffd36e",
    note: "one of the year's best (storm-capable in some years)",
  },
};

/** Strength style for a ZHR, or null (variable ZHR → no fixed strength). */
export function strengthStyle(zhr: number | null | undefined): StrengthStyle | null {
  const s = showerStrength(zhr);
  return s ? STRENGTH_STYLES[s] : null;
}

export interface VelocityStyle {
  label: string;
  color: string;
  note: string;
}

const VELOCITY_STYLES: Record<VelocityClass, VelocityStyle> = {
  slow: { label: "Slow", color: "#f0a878", note: "slow, often bright & long-trailed" },
  medium: { label: "Medium", color: "#dfe5ee", note: "medium speed" },
  fast: { label: "Fast", color: "#8fb0ff", note: "fast — typically brighter and bluer" },
};

/** Velocity style for an entry speed [km/s], or null on bad input. */
export function velocityStyle(kms: number | null | undefined): VelocityStyle | null {
  const v = velocityClass(kms);
  return v ? VELOCITY_STYLES[v] : null;
}

// ─────────────────────────────── Parent body ────────────────────────────────

/** True if the shower's parent is an asteroid (unusual — most are comets). */
export function isAsteroidParent(s: MeteorShowerRecord): boolean {
  return s.parent_type === "asteroid";
}

/** Honest parent label ("109P/Swift–Tuttle" or "No firmly established parent"). */
export function parentLabel(s: MeteorShowerRecord): string {
  return s.parent_body ?? "No firmly established parent";
}

/**
 * Cross-link to the Comets & Asteroids tab — ONLY when the parent designation is
 * actually in that catalogue (parent_in_catalog). Returns null otherwise, so the
 * UI never links to a body the other tab does not carry (e.g. Ursids / 8P/Tuttle).
 */
export function parentCrossLink(
  s: MeteorShowerRecord
): { label: string; href: string } | null {
  if (!s.parent_in_catalog || !s.parent_body) return null;
  return {
    label: `Parent: ${s.parent_body} — view in Comets & Asteroids`,
    href: "/small-bodies",
  };
}

// ───────────────────────── Dates, moon & best viewing ───────────────────────

const DAY_MS = 86_400_000;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Parse "MM-DD" → {month, day} (1-based), or null. */
function parseMonthDay(md: string | null | undefined): { month: number; day: number } | null {
  if (typeof md !== "string") return null;
  const m = md.trim().match(/^(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

/** "08-13" → "Aug 13". Returns the raw string if it cannot be parsed. */
export function monthDayLabel(md: string | null | undefined): string {
  const p = parseMonthDay(md);
  if (!p) return md && md.length > 0 ? md : "—";
  return `${MONTHS[p.month - 1]} ${p.day}`;
}

/**
 * The shower's peak as a real Date in the data year (peak_date is "MM-DD"). Used
 * for "moon phase at peak". A fixed 06:00 UTC is used — the illuminated fraction
 * changes little across a day, so the exact hour does not matter. Null on a
 * malformed peak_date.
 */
export function peakDate(s: MeteorShowerRecord, year = DATA_YEAR): Date | null {
  const p = parseMonthDay(s.peak_date);
  if (!p) return null;
  const d = new Date(Date.UTC(year, p.month - 1, p.day, 6, 0, 0));
  return Number.isFinite(d.getTime()) ? d : null;
}

export type MoonlightSeverity = "dark" | "some" | "bright";

export interface MoonAtPeak {
  phase: MoonPhase;
  /** 0..1 illuminated fraction at the peak date */
  fraction: number;
  severity: MoonlightSeverity;
  note: string;
}

/**
 * Moon phase at the shower's peak (computed via lib/lunar), turned into a plain
 * "will moonlight wash this out?" note. A bright, near-full Moon drowns faint
 * meteors; a dark (new-ish) Moon is ideal. Null when the peak date is malformed.
 */
export function moonAtPeak(s: MeteorShowerRecord, year = DATA_YEAR): MoonAtPeak | null {
  const d = peakDate(s, year);
  if (!d) return null;
  const phase = moonPhase(d);
  const f = phase.illuminatedFraction;
  let severity: MoonlightSeverity;
  let note: string;
  if (f < 0.25) {
    severity = "dark";
    note = "Dark-sky peak — little moonlight, ideal for faint meteors.";
  } else if (f < 0.6) {
    severity = "some";
    note = "Some moonlight at peak — brighter meteors still show well.";
  } else {
    severity = "bright";
    note = "A bright Moon near peak will wash out all but the brightest meteors.";
  }
  return { phase, fraction: f, severity, note };
}

export interface BestViewing {
  /** local Date of the radiant's highest altitude over the sampled window */
  date: Date;
  /** that peak altitude, degrees */
  altitude: number;
}

/**
 * Best viewing time for the observer: the moment in the next `hours` when the
 * radiant is HIGHEST (rates scale with sin of the radiant altitude, so higher =
 * more meteors), found by sampling every 30 min. Returns null if the radiant
 * never rises above the horizon in the window (circumpolar-below case) or on bad
 * input. Honest: this is geometry only — it does not account for twilight, though
 * in practice the pre-dawn hours are usually both dark and highest.
 */
export function bestViewingTime(
  s: MeteorShowerRecord,
  lat: number,
  lon: number,
  from: Date,
  hours = 24
): BestViewing | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !(from instanceof Date)) {
    return null;
  }
  const steps = Math.max(1, Math.round((hours * 60) / 30));
  let bestAlt = -Infinity;
  let bestMs = from.getTime();
  for (let i = 0; i <= steps; i++) {
    const ms = from.getTime() + i * 30 * 60_000;
    const hz = radiantAltAz(s, lat, lon, new Date(ms));
    if (!hz) continue;
    if (hz.altitude > bestAlt) {
      bestAlt = hz.altitude;
      bestMs = ms;
    }
  }
  if (bestAlt <= 0) return null;
  return { date: new Date(bestMs), altitude: bestAlt };
}

// ───────────────────────── Countdown to next major peak ─────────────────────

export interface NextMajorPeak {
  shower: MeteorShowerRecord;
  /** target instant of the next peak (reference-calendar, observer-agnostic) */
  target: Date;
  /** whole days until the peak */
  untilDays: number;
}

const REFERENCE_YEAR_DAYS = 365;

/**
 * The next MAJOR/STRONG peak (ZHR ≥ 50) after `now`, with a target instant for a
 * countdown. Timing uses the physics module's reference-calendar days-to-peak
 * (peaks are keyed to solar longitude and drift ~1 day/yr, so this is a ~±1-day
 * estimate — the UI says so). Falls back to the overall next shower if no strong
 * shower resolves. Null for an empty/bad list.
 */
export function nextMajorPeak(
  showers: readonly MeteorShowerRecord[] | null | undefined,
  now: Date
): NextMajorPeak | null {
  if (!Array.isArray(showers) || showers.length === 0) return null;
  let best: MeteorShowerRecord | null = null;
  let bestUntil = Infinity;
  for (const s of showers) {
    if (showerStrength(s.zhr) !== "strong" && showerStrength(s.zhr) !== "major") {
      continue;
    }
    const d = daysToPeak(s, now);
    if (d === null) continue;
    const until = d >= 0 ? d : d + REFERENCE_YEAR_DAYS;
    if (until < bestUntil) {
      bestUntil = until;
      best = s;
    }
  }
  if (!best) {
    const ns = nextShower(showers, now);
    if (!ns) return null;
    const d = daysToPeak(ns, now);
    if (d === null) return null;
    bestUntil = d >= 0 ? d : d + REFERENCE_YEAR_DAYS;
    best = ns;
  }
  return {
    shower: best,
    target: new Date(now.getTime() + bestUntil * DAY_MS),
    untilDays: Math.round(bestUntil),
  };
}

// ───────────────────────────── Display formatters ───────────────────────────

/** "RA 48.0° · Dec +58.0°" */
export function fmtRaDec(s: MeteorShowerRecord): string {
  const dec = s.radiant_dec;
  const sign = dec >= 0 ? "+" : "−";
  return `RA ${s.radiant_ra.toFixed(1)}° · Dec ${sign}${Math.abs(dec).toFixed(1)}°`;
}

/** ZHR label — honest about the null (variable) case and the "ideal" caveat. */
export function fmtZhr(zhr: number | null | undefined): string {
  if (typeof zhr !== "number" || !Number.isFinite(zhr)) {
    return "Variable (outburst-driven)";
  }
  return `~${zhr}/hr`;
}

/** Observed-rate estimate label ("≈ 34/hr"), or an honest reason it is absent. */
export function fmtObservedRate(rate: number | null | undefined): string {
  if (typeof rate !== "number" || !Number.isFinite(rate)) return "—";
  if (rate < 1) return "< 1/hr";
  return `≈ ${Math.round(rate)}/hr`;
}

export function fmtVelocity(kms: number | null | undefined): string {
  if (typeof kms !== "number" || !Number.isFinite(kms)) return NOT_MEASURED;
  return `${Math.round(kms)} km/s`;
}

export function fmtSolarLongitude(deg: number | null | undefined): string {
  if (typeof deg !== "number" || !Number.isFinite(deg)) return "—";
  return `${deg.toFixed(1)}°`;
}

export function fmtAltitude(deg: number | null | undefined): string {
  if (typeof deg !== "number" || !Number.isFinite(deg)) return "—";
  return `${deg.toFixed(0)}°`;
}

/** "Jul 17 – Aug 24" activity-window label. */
export function fmtActivityWindow(s: MeteorShowerRecord): string {
  return `${monthDayLabel(s.active_start)} – ${monthDayLabel(s.active_end)}`;
}

/** A signed-days-to-peak phrase: "peaks in 4 days" / "peaked 2 days ago" / "peaks today". */
export function fmtDaysToPeak(days: number | null | undefined): string {
  if (typeof days !== "number" || !Number.isFinite(days)) return "—";
  const r = Math.round(days);
  if (r === 0) return "peaks today";
  if (r > 0) return `peaks in ${r} day${r === 1 ? "" : "s"}`;
  return `peaked ${-r} day${-r === 1 ? "" : "s"} ago`;
}

/** "3 d 04 h 12 m" countdown from `now` to `target` (clamped at zero). */
export function fmtCountdown(target: Date, now: Date): string {
  let ms = target.getTime() - now.getTime();
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60_000);
  const d = Math.floor(totalMin / (60 * 24));
  const h = Math.floor((totalMin % (60 * 24)) / 60);
  const m = totalMin % 60;
  return `${d} d ${String(h).padStart(2, "0")} h ${String(m).padStart(2, "0")} m`;
}

/** Moon-phase illumination as a percentage label, e.g. "78% (Waxing Gibbous)". */
export function fmtMoon(moon: MoonAtPeak | null): string {
  if (!moon) return "—";
  return `${Math.round(moon.fraction * 100)}% · ${moon.phase.name}`;
}
