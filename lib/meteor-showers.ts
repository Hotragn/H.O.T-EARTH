/**
 * Meteor-shower physics for the "Meteor Showers" tab of the digital twin. This
 * is the shower analogue of lib/celestial.ts (star map), lib/solar.ts (Earth
 * solar geometry) and lib/planets.ts (heliocentric orbits): every public
 * function is a pure, deterministic function of its inputs, so it unit-tests
 * cleanly (lib/meteor-showers.test.ts) and the react-three-fiber frontend can
 * consume it directly.
 *
 * It turns a shower record — radiant RA/Dec, peak date & solar longitude, the
 * active window, ZHR, entry velocity and parent body (the columns another agent
 * writes into public/data/meteor-showers/showers.json) — into:
 *   • the Sun's ecliptic longitude λ☉, the STANDARD year-stable timing
 *     coordinate for meteor peaks,
 *   • "is this shower active / near peak right now, and how strong?" (a simple
 *     illustrative activity profile, honestly labelled),
 *   • an observed-rate estimate from ZHR and the radiant's altitude, and
 *   • the radiant's 3D direction and alt/az — by REUSING lib/celestial's
 *     equatorial↔horizontal astronomy, so radiant geometry and the star map
 *     share exactly one coordinate convention.
 *
 * ── What we REUSE from lib/celestial (never re-derived here) ─────────────────
 *   • {@link raDecToVector3}        — radiant direction on the celestial sphere
 *   • {@link equatorialToHorizontal} — radiant altitude/azimuth for an observer
 *   • {@link isAboveHorizon}         — "is the radiant up?" horizon test
 *   • {@link julianCenturiesJ2000}   — time argument for the solar series
 *
 * ── Sources (physics-env-simulation skill: real physics, documented, or it
 *    doesn't ship — no invented numbers) ─────────────────────────────────────
 *   • J. Meeus, *Astronomical Algorithms*, 2nd ed., Ch. 25 ("Solar Coordinates",
 *     low-accuracy series) — geometric mean longitude L0, mean anomaly M,
 *     equation of centre C, and the apparent-longitude nutation+aberration
 *     correction, used by {@link solarLongitudeDeg}.
 *   • International Meteor Organization (IMO), *Handbook for Meteor Observers*
 *     and the ZHR definition — the radiant-altitude correction
 *     observed ≈ ZHR·sin(hR) used by {@link observedRateEstimate}. Meteor peaks
 *     are catalogued by solar longitude precisely because λ☉ is stable
 *     year-to-year while the calendar date drifts (leap years + the ~6 h/yr
 *     precession of the anomalistic year).
 *   • Peak solar longitudes / active windows / ZHRs / velocities are the IMO
 *     working-list values, and are supplied in the shower DATA (owned by another
 *     agent) — this module only COMPUTES from them.
 *
 * ── Honesty notes (read before trusting a number) ───────────────────────────
 *   • {@link activityFraction} is a simple illustrative triangular profile, NOT
 *     a real flux model (real showers are asymmetric with a sharp core).
 *   • {@link observedRateEstimate} is a first-order estimate: it applies only
 *     the radiant-altitude factor (and an optional activity factor). It ignores
 *     limiting magnitude, cloud, the population-index term r^(6.5−lm), field
 *     obstruction and observer perception. It is honest about being approximate.
 */

import {
  equatorialToHorizontal,
  isAboveHorizon,
  julianCenturiesJ2000,
  raDecToVector3,
  type HorizontalCoord,
} from "./celestial";

const DEG2RAD = Math.PI / 180;

/**
 * Days in the year-agnostic reference year used for all month-day / activity
 * math. Showers are compared by month-day (or solar longitude), NOT by absolute
 * date, so we fold every "MM-DD" onto a fixed 365-day non-leap calendar; the ±1
 * day a leap year would add is far below activity-window resolution.
 */
const REFERENCE_YEAR_DAYS = 365;

/**
 * Cumulative days BEFORE the start of each month in a non-leap year, indexed by
 * month−1 (Jan=0). CUM_DAYS[m−1] + day = day-of-year for month m, day d.
 * (Feb 29 in a leap-year date maps to day-of-year 60, harmlessly coinciding
 * with Mar 1 on this non-leap reference calendar.)
 */
const CUM_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334] as const;

// ───────────────────────────── null-safety guards ──────────────────────────
// Contract (mirrors lib/celestial.ts / lib/sun.ts): bad numeric/date/record
// input yields null (or a documented neutral), never a throw — the renderer
// must survive a malformed shower row.

function finite(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function isValidDate(date: unknown): date is Date {
  return date instanceof Date && Number.isFinite(date.getTime());
}

/** Clamp to [lo, hi]. */
function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

/** Normalize an angle to [0, 360). */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// ─────────────────────────────── shower record ─────────────────────────────

/**
 * A meteor-shower record, matching the columns another agent writes into
 * public/data/meteor-showers/showers.json. This module only READS these fields;
 * it never mutates a shower and never owns the data. The extra index signature
 * lets the DATA carry more columns (moon phase notes, discovery year, …)
 * without breaking this type.
 */
export interface MeteorShower {
  /** IAU three-letter shower code, e.g. "PER" (Perseids), "GEM" (Geminids). */
  code: string;
  /** Human name, e.g. "Perseids". */
  name: string;
  /** Radiant right ascension [deg, 0–360). */
  radiant_ra: number;
  /** Radiant declination [deg, −90…+90]. */
  radiant_dec: number;
  /** Peak date as "MM-DD" (calendar; drifts year-to-year — prefer λ☉). */
  peak_date: string;
  /** Peak solar longitude λ☉ [deg] — the year-stable timing coordinate. */
  peak_solar_longitude: number;
  /** Start of the active window as "MM-DD". */
  active_start: string;
  /** End of the active window as "MM-DD" (may be < active_start ⇒ year-wrap). */
  active_end: string;
  /** Zenithal Hourly Rate at peak (meteors/hr, ideal sky, radiant at zenith). */
  zhr: number;
  /** Atmospheric entry velocity [km/s] (~11–72 for Earth). */
  velocity_kms: number;
  /** Parent body, e.g. "109P/Swift–Tuttle" (may be null/unknown). */
  parent_body?: string | null;
  /** Parent type, e.g. "comet" | "asteroid" (may be null/unknown). */
  parent_type?: string | null;
  [key: string]: unknown;
}

// ───────────────────────── 1. solar longitude (λ☉) ─────────────────────────

/**
 * The Sun's apparent geocentric ecliptic longitude λ☉ in DEGREES [0, 360) for a
 * UTC instant — the STANDARD coordinate for meteor timing. Peaks are specified
 * by λ☉ (not calendar date) because λ☉ is stable year-to-year, whereas the
 * calendar date of a given λ☉ drifts by leap years and the ~6 h/yr slippage of
 * the anomalistic year.
 *
 * Low-accuracy solar series, Meeus *Astronomical Algorithms* 2nd ed., Ch. 25:
 *   T   = Julian centuries since J2000 (reused from lib/celestial)
 *   L0  = 280.46646 + 36000.76983·T + 0.0003032·T²        (geometric mean long.)
 *   M   = 357.52911 + 35999.05029·T − 0.0001537·T²        (mean anomaly)
 *   C   = (1.914602 − 0.004817·T − 0.000014·T²)·sin M
 *       + (0.019993 − 0.000101·T)·sin 2M + 0.000289·sin 3M (equation of centre)
 *   ☉   = L0 + C                                           (true longitude)
 *   λ   = ☉ − 0.00569 − 0.00478·sin Ω,  Ω = 125.04 − 1934.136·T  (apparent:
 *                                       nutation in longitude + aberration)
 *
 * We reuse lib/celestial's {@link julianCenturiesJ2000} for T (UTC ≈ TT: the
 * ΔT ≈ 69 s of dynamical-time offset moves the Sun < 0.001°, negligible here).
 * Accuracy of this truncated series is ~0.01° over the modern era — far finer
 * than any shower peak is defined.
 *
 * Reference checkpoints (seasons): λ☉ ≈ 0° at the March equinox, 90° at the June
 * solstice, 180° at the September equinox, 270° at the December solstice; the
 * Perseid peak λ☉ ≈ 140° falls ~Aug 12–13 and the Geminid peak λ☉ ≈ 262° ~Dec
 * 14. Returns null on an invalid Date (never throws).
 */
export function solarLongitudeDeg(date: Date): number | null {
  if (!isValidDate(date)) return null;
  const T = julianCenturiesJ2000(date);

  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG2RAD;

  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M);

  const trueLongitude = L0 + C;

  // Apparent longitude: nutation in longitude + aberration (Meeus Ch. 25).
  const omega = (125.04 - 1934.136 * T) * DEG2RAD;
  const apparent = trueLongitude - 0.00569 - 0.00478 * Math.sin(omega);

  return norm360(apparent);
}

// ───────────────────── 2. calendar helpers (year-agnostic) ─────────────────

/** Parse a "MM-DD" string → {month, day}, or null if malformed. */
function parseMonthDay(md: unknown): { month: number; day: number } | null {
  if (typeof md !== "string") return null;
  const m = md.trim().match(/^(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

/**
 * Day-of-year [1–365] for a "MM-DD" string on the year-agnostic non-leap
 * reference calendar (Jan 1 = 1, Dec 31 = 365). This is how showers are placed
 * for the year-wrap-aware window test — a shower record's dates are month-day
 * only, with no year. Returns null on a malformed string (never throws).
 */
export function monthDayToDayOfYear(monthDay: string): number | null {
  const p = parseMonthDay(monthDay);
  if (!p) return null;
  return CUM_DAYS[p.month - 1] + p.day;
}

/** Day-of-year [1–366] for a UTC Date on the same reference calendar, or null. */
function dateToDayOfYear(date: Date): number | null {
  if (!isValidDate(date)) return null;
  return CUM_DAYS[date.getUTCMonth()] + date.getUTCDate();
}

/**
 * Signed day difference wrapped to (−182.5, +182.5], i.e. the SHORTEST way round
 * the 365-day reference year. Positive means "target is ahead"; used so a peak
 * on Jan 3 read from Dec 30 comes out as +4 days, not −361.
 */
function wrapDays(days: number): number {
  let d = ((days % REFERENCE_YEAR_DAYS) + REFERENCE_YEAR_DAYS) % REFERENCE_YEAR_DAYS;
  if (d > REFERENCE_YEAR_DAYS / 2) d -= REFERENCE_YEAR_DAYS;
  return d;
}

/**
 * Year-wrap-aware membership test: is `doy` inside the day-of-year window
 * [startDoy, endDoy] on the circular reference calendar?
 *   • start ≤ end (normal window): startDoy ≤ doy ≤ endDoy.
 *   • start > end (window crosses New Year, e.g. Quadrantids Dec 28 → Jan 12,
 *     or the Ursids): doy ≥ startDoy OR doy ≤ endDoy.
 * This is the single source of truth for "does this month-day fall in the
 * active window", used by {@link isActive}.
 */
function inDayOfYearWindow(doy: number, startDoy: number, endDoy: number): boolean {
  if (startDoy <= endDoy) return doy >= startDoy && doy <= endDoy;
  return doy >= startDoy || doy <= endDoy;
}

// ──────────────────────── 3. activity + peak helpers ────────────────────────

/**
 * Is the shower active on `date`? True iff the date's month-day falls within
 * [active_start, active_end], compared in a YEAR-AGNOSTIC way (both folded onto
 * the non-leap reference calendar via {@link monthDayToDayOfYear}) and handling
 * the year-wrap case where active_end < active_start (Quadrantids/Ursids spilling
 * Dec→Jan, and the Taurids' long autumn windows). Returns null if the shower's
 * dates are malformed or the Date is invalid — so callers can tell "not active"
 * apart from "bad data".
 */
export function isActive(
  shower: MeteorShower | null | undefined,
  date: Date
): boolean | null {
  const startDoy = monthDayToDayOfYear(shower?.active_start ?? "");
  const endDoy = monthDayToDayOfYear(shower?.active_end ?? "");
  const doy = dateToDayOfYear(date);
  if (startDoy === null || endDoy === null || doy === null) return null;
  return inDayOfYearWindow(doy, startDoy, endDoy);
}

/**
 * Signed days from `date` to the shower's peak, on the reference calendar and
 * wrapped to the nearest occurrence (−182.5…+182.5]. POSITIVE ⇒ the peak is
 * still AHEAD; negative ⇒ it has just passed. Uses the calendar peak_date
 * (month-day). Returns null on malformed peak_date / invalid Date.
 */
export function daysToPeak(
  shower: MeteorShower | null | undefined,
  date: Date
): number | null {
  const peakDoy = monthDayToDayOfYear(shower?.peak_date ?? "");
  const doy = dateToDayOfYear(date);
  if (peakDoy === null || doy === null) return null;
  return wrapDays(peakDoy - doy);
}

/**
 * Is `date` within ±`windowDays` of the shower's peak? (|daysToPeak| ≤ window.)
 * Default window ±1 day. Returns null on bad input.
 */
export function isNearPeak(
  shower: MeteorShower | null | undefined,
  date: Date,
  windowDays = 1
): boolean | null {
  const d = daysToPeak(shower, date);
  if (d === null || !finite(windowDays)) return null;
  return Math.abs(d) <= windowDays;
}

/**
 * A 0..1 activity weight for the shower on `date`: 1 at the peak, tapering
 * LINEARLY to 0 at each edge of the active window (a triangular profile, so the
 * rising and falling sides can have different widths — most showers ramp up
 * slower than they fall off). 0 when the shower is not active.
 *
 * ── HONESTY: this is a SIMPLE ILLUSTRATIVE PROFILE, not a real flux model. Real
 * shower activity is roughly Gaussian/Lorentzian with a sharp core and long
 * asymmetric wings, and the true shape needs the population index and a fitted
 * B-value. Use this only to fade the on-screen intensity, never as a rate. ──
 *
 * Returns null on bad input.
 */
export function activityFraction(
  shower: MeteorShower | null | undefined,
  date: Date
): number | null {
  const active = isActive(shower, date);
  if (active === null) return null;
  if (!active) return 0;

  const peakDoy = monthDayToDayOfYear(shower?.peak_date ?? "");
  const startDoy = monthDayToDayOfYear(shower?.active_start ?? "");
  const endDoy = monthDayToDayOfYear(shower?.active_end ?? "");
  const doy = dateToDayOfYear(date);
  if (peakDoy === null || startDoy === null || endDoy === null || doy === null) {
    return null;
  }

  const toPeak = wrapDays(peakDoy - doy); // + before peak, − after peak
  if (toPeak >= 0) {
    // Rising side: full width is peak − start.
    const width = wrapDays(peakDoy - startDoy);
    if (width <= 0) return 1;
    return clamp(1 - toPeak / width, 0, 1);
  }
  // Falling side: full width is end − peak.
  const width = wrapDays(endDoy - peakDoy);
  if (width <= 0) return 1;
  return clamp(1 - -toPeak / width, 0, 1);
}

/**
 * Every shower in `showers` that is active on `date` (see {@link isActive}).
 * Malformed rows are skipped, not thrown. Returns [] for a bad/empty list.
 */
export function currentlyActiveShowers(
  showers: readonly MeteorShower[] | null | undefined,
  date: Date
): MeteorShower[] {
  if (!Array.isArray(showers)) return [];
  return showers.filter((s) => isActive(s, date) === true);
}

/**
 * The shower whose peak comes SOONEST after `date` (the smallest number of days
 * until its next peak, on the reference calendar). A shower that peaked
 * yesterday is ~364 days away, so it is NOT "next". Ties resolve to the earlier
 * entry in the list. Returns null for a bad/empty list.
 */
export function nextShower(
  showers: readonly MeteorShower[] | null | undefined,
  date: Date
): MeteorShower | null {
  if (!Array.isArray(showers)) return null;
  let best: MeteorShower | null = null;
  let bestDays = Infinity;
  for (const s of showers) {
    const d = daysToPeak(s, date);
    if (d === null) continue;
    // Days UNTIL the next peak in [0, 365): a past peak wraps forward a year.
    const until = d >= 0 ? d : d + REFERENCE_YEAR_DAYS;
    if (until < bestDays) {
      bestDays = until;
      best = s;
    }
  }
  return best;
}

// ─────────────────────── 4. observed-rate estimate ─────────────────────────

export interface ObservedRateOptions {
  /**
   * Explicit 0..1 activity weight to multiply in (e.g. from
   * {@link activityFraction}). Takes precedence over `date`.
   */
  activityFactor?: number;
  /**
   * If given (and `activityFactor` is not), the rate is scaled by
   * {@link activityFraction}(shower, date) so an off-peak night reads lower.
   */
  date?: Date;
}

/**
 * First-order OBSERVED meteor rate [meteors/hr] from the shower's ZHR and the
 * current radiant altitude hR:
 *
 *   observed ≈ ZHR · sin(hR) · activityFactor            (IMO ZHR definition)
 *
 * The sin(hR) term is the standard radiant-altitude correction: ZHR is defined
 * for a radiant at the zenith (hR = 90° ⇒ sin = 1), and the visible rate falls
 * off as the radiant sinks. If the radiant is at or below the horizon
 * (hR ≤ 0) the shower is unobservable and this returns null.
 *
 * ── HONESTY: this is an APPROXIMATE, first-order estimate. It applies ONLY the
 * radiant-altitude factor (and an optional activity factor). It deliberately
 * IGNORES limiting magnitude, cloud cover, field obstruction, the population-
 * index term r^(6.5−lm), and observer perception — all of which the full IMO
 * ZHR reduction includes. Treat the output as an order-of-magnitude "how many
 * might I see", not a measurement. ──
 *
 * Returns null on non-finite ZHR / altitude, a below-horizon radiant, or bad
 * input (never throws).
 */
export function observedRateEstimate(
  shower: MeteorShower | null | undefined,
  radiantAltitudeDeg: number,
  opts: ObservedRateOptions = {}
): number | null {
  const zhr = shower?.zhr;
  if (!finite(zhr) || !finite(radiantAltitudeDeg)) return null;
  if (radiantAltitudeDeg <= 0) return null; // radiant not up ⇒ no meteors

  let factor = 1;
  if (finite(opts.activityFactor)) {
    factor = clamp(opts.activityFactor, 0, 1);
  } else if (opts.date !== undefined) {
    const af = activityFraction(shower, opts.date);
    if (af !== null) factor = af;
  }

  return zhr * Math.sin(radiantAltitudeDeg * DEG2RAD) * factor;
}

// ──────────────────── 5. radiant geometry (reuse lib/celestial) ─────────────

/**
 * The radiant's altitude/azimuth for an observer at (lat, lon) at `date`, by
 * delegating to lib/celestial's {@link equatorialToHorizontal} with the shower's
 * radiant RA/Dec — so radiant geometry shares the star map's exact convention
 * (azimuth from North, clockwise; Meeus 13.5/13.6). Returns null on bad input.
 */
export function radiantAltAz(
  shower: MeteorShower | null | undefined,
  observerLatDeg: number,
  observerLonDeg: number,
  date: Date
): HorizontalCoord | null {
  if (!finite(shower?.radiant_ra) || !finite(shower?.radiant_dec)) return null;
  return equatorialToHorizontal(
    shower!.radiant_ra,
    shower!.radiant_dec,
    observerLatDeg,
    observerLonDeg,
    date
  );
}

/**
 * The radiant's 3D direction on the celestial sphere as [x, y, z], by delegating
 * to lib/celestial's {@link raDecToVector3} (same J2000 equatorial frame and
 * handedness as the star map). `radius` defaults to celestial's sphere radius.
 * Returns null on malformed radiant coordinates.
 */
export function radiantVector3(
  shower: MeteorShower | null | undefined,
  radius?: number
): [number, number, number] | null {
  if (!finite(shower?.radiant_ra) || !finite(shower?.radiant_dec)) return null;
  return radius === undefined
    ? raDecToVector3(shower!.radiant_ra, shower!.radiant_dec)
    : raDecToVector3(shower!.radiant_ra, shower!.radiant_dec, radius);
}

/**
 * Is the shower's radiant above the observer's horizon at `date`? Delegates to
 * lib/celestial's {@link isAboveHorizon} (altitude > 0). When the radiant is
 * down, no meteors from this shower can appear. Returns null on bad input, so
 * "below horizon" (false) is distinguishable from "bad data" (null).
 */
export function isRadiantUp(
  shower: MeteorShower | null | undefined,
  observerLatDeg: number,
  observerLonDeg: number,
  date: Date
): boolean | null {
  if (!finite(shower?.radiant_ra) || !finite(shower?.radiant_dec)) return null;
  return isAboveHorizon(
    shower!.radiant_ra,
    shower!.radiant_dec,
    observerLatDeg,
    observerLonDeg,
    date
  );
}

// ────────────────────────────── 6. classification ──────────────────────────

/**
 * Qualitative strength of a shower from its ZHR:
 *   • "weak"  : ZHR < 10   (barely above the sporadic background)
 *   • "minor" : 10 ≤ ZHR < 50
 *   • "strong": 50 ≤ ZHR < 100
 *   • "major" : ZHR ≥ 100  (storm-capable — the Perseids and Geminids sit at
 *               ~100–150; the Leonids produced true storms of thousands/hr in
 *               1833, 1866 and 1966 when Earth crossed a fresh dust trail).
 */
export type ShowerStrength = "weak" | "minor" | "strong" | "major";

/** Classify a shower by ZHR (see {@link ShowerStrength}). Null on bad input. */
export function showerStrength(
  zhr: number | null | undefined
): ShowerStrength | null {
  if (!finite(zhr)) return null;
  if (zhr < 10) return "weak";
  if (zhr < 50) return "minor";
  if (zhr < 100) return "strong";
  return "major";
}

/**
 * Qualitative entry-speed class from the atmospheric velocity [km/s]. Meteoroids
 * hit Earth's atmosphere between ~11 km/s (Earth's escape speed, the slowest
 * possible) and ~72 km/s (a head-on encounter with a retrograde particle):
 *   • "slow"  : v < 30 km/s   (e.g. Taurids ~27, Draconids ~20)
 *   • "medium": 30 ≤ v < 50   (e.g. Geminids ~35)
 *   • "fast"  : v ≥ 50 km/s   (e.g. Perseids ~59, Leonids ~71)
 * Illustrative bins for labelling; faster meteors are typically brighter and
 * bluer. Null on bad input.
 */
export type VelocityClass = "slow" | "medium" | "fast";

/** Classify a shower by entry velocity [km/s] (see {@link VelocityClass}). */
export function velocityClass(
  kms: number | null | undefined
): VelocityClass | null {
  if (!finite(kms)) return null;
  if (kms < 30) return "slow";
  if (kms < 50) return "medium";
  return "fast";
}

// ─────────────────────────── 7. HUD snapshot ───────────────────────────────

export interface ShowerState {
  code: string;
  name: string;
  active: boolean;
  /** signed days to peak (+ ahead, − passed) */
  daysToPeak: number | null;
  nearPeak: boolean;
  /** 0..1 illustrative activity weight */
  activity: number | null;
  strength: ShowerStrength | null;
  velocity: VelocityClass | null;
  /** radiant alt/az for the observer, or null if unavailable */
  radiant: HorizontalCoord | null;
  radiantUp: boolean | null;
  /** first-order observed rate [meteors/hr], scaled by activity, or null */
  estimatedRate: number | null;
}

/**
 * Everything a shower HUD row needs in one pure call (mirrors planetState /
 * marsClock): activity, peak proximity, classification and — for an observer —
 * the radiant geometry and an activity-scaled observed-rate estimate. Returns
 * null only if the shower record itself is missing; individual fields fall back
 * to null when their inputs are bad, so the row always renders honestly.
 */
export function showerState(
  shower: MeteorShower | null | undefined,
  observerLatDeg: number,
  observerLonDeg: number,
  date: Date
): ShowerState | null {
  if (!shower || typeof shower !== "object") return null;

  const radiant = radiantAltAz(shower, observerLatDeg, observerLonDeg, date);
  const estimatedRate =
    radiant !== null
      ? observedRateEstimate(shower, radiant.altitude, { date })
      : null;

  return {
    code: shower.code,
    name: shower.name,
    active: isActive(shower, date) === true,
    daysToPeak: daysToPeak(shower, date),
    nearPeak: isNearPeak(shower, date) === true,
    activity: activityFraction(shower, date),
    strength: showerStrength(shower.zhr),
    velocity: velocityClass(shower.velocity_kms),
    radiant,
    radiantUp: isRadiantUp(shower, observerLatDeg, observerLonDeg, date),
    estimatedRate,
  };
}
