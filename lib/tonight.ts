/**
 * lib/tonight.ts — "what can I actually see from here tonight?"
 *
 * This module adds almost no new physics. Every position it uses is already in
 * the repo and already tested: the Sun from lib/solar (subsolar point), the Moon
 * from lib/lunar (Meeus Ch. 47), the planets from lib/planets (JPL approximate
 * elements), and the RA/Dec to altitude/azimuth transform from lib/celestial
 * (Meeus 13.5/13.6). What is new is the ANSWER those pieces add up to for one
 * observer on one night:
 *
 *   1. when the sky actually gets dark here, and for how long
 *   2. whether the Moon is up wrecking it, and how bright it is
 *   3. which planets clear a usable altitude while it is dark
 *
 * METHOD, so the limits are visible:
 *
 *   Rise, set and twilight times are found NUMERICALLY. We sample the body's
 *   altitude on a coarse grid, detect sign changes against a target altitude,
 *   then bisect to the second. There is no closed-form hour-angle shortcut and
 *   no special-casing, which is why the polar cases (midnight sun, polar night,
 *   and the mid-summer latitudes where astronomical twilight never ends) fall
 *   out of the same code instead of needing their own branch. They are reported
 *   as named states, not as missing data.
 *
 *   Standard altitudes follow Meeus Ch. 15: -0.833 deg for the Sun's upper limb
 *   (refraction plus semi-diameter), +0.125 deg for the Moon (which also
 *   absorbs its mean parallax), and the conventional -6 / -12 / -18 deg for
 *   civil, nautical and astronomical twilight.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO:
 *
 *   - No weather. No cloud cover, no seeing, no transparency. Every one of those
 *     needs a live keyed forecast API and this app ships none, so a "great night"
 *     here can still be a solid overcast in reality. Said on screen, not buried.
 *   - No light pollution. We ship no sky-brightness survey, so we never claim a
 *     limiting magnitude.
 *   - No computed apparent magnitude for the planets. Doing that properly needs
 *     a phase-angle photometric model per planet; instead we carry the published
 *     magnitude RANGE for each and label it as such.
 *   - No topocentric parallax for the Moon beyond the standard-altitude
 *     allowance, so lunar rise and set are good to a few minutes, not seconds.
 *
 * Null-safety contract, same as its siblings: bad input returns null or an empty
 * array. Nothing here throws, and nothing here invents a number.
 */

import { subsolarPoint } from "./solar";
import { moonEclipticPosition, moonPhase, type PhaseName } from "./lunar";
import { equatorialToHorizontal, type HorizontalCoord } from "./celestial";
import { heliocentricPosition, type PlanetName } from "./planets";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** Light travel time over one AU, in days (for the light-time correction). */
const LIGHT_AU_PER_DAY = 173.144632674;

function finite(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isValidDate(d: unknown): d is Date {
  return d instanceof Date && Number.isFinite(d.getTime());
}

function norm360(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

// ───────────────────────── standard altitudes (Meeus 15) ────────────────────

/** Sun's upper limb at rise/set: refraction (34') plus semi-diameter (16'). */
export const SUN_STANDARD_ALT_DEG = -0.833;
/** Moon at rise/set: refraction and semi-diameter, less mean parallax. */
export const MOON_STANDARD_ALT_DEG = 0.125;
/** Civil twilight: the Sun 6 degrees down. Bright stars start to appear. */
export const CIVIL_TWILIGHT_DEG = -6;
/** Nautical twilight: 12 degrees down. Horizon no longer distinguishable. */
export const NAUTICAL_TWILIGHT_DEG = -12;
/** Astronomical twilight: 18 degrees down. The sky is as dark as it will get. */
export const ASTRONOMICAL_TWILIGHT_DEG = -18;

/** An altitude above which a target is worth pointing anything at. */
export const USABLE_ALTITUDE_DEG = 10;

// ───────────────────────────── observer ─────────────────────────────────────

export interface Observer {
  latDeg: number;
  lonDeg: number;
}

function validObserver(o: Observer | null | undefined): o is Observer {
  return (
    !!o &&
    finite(o.latDeg) &&
    finite(o.lonDeg) &&
    Math.abs(o.latDeg) <= 90 &&
    Math.abs(o.lonDeg) <= 180
  );
}

// ─────────────────────────── altitude samplers ──────────────────────────────

/**
 * The Sun's altitude for an observer, straight from lib/solar's subsolar point:
 * the Sun sits in the zenith at the subsolar point, so its altitude anywhere
 * else is 90 degrees minus the great-circle angle to that point.
 *
 *   cos(z) = sin(phi)sin(phi_s) + cos(phi)cos(phi_s)cos(lambda - lambda_s)
 *
 * This is geometric (no refraction); refraction enters through the standard
 * altitudes above, which is where the convention puts it.
 */
export function sunAltitudeDeg(
  date: Date,
  latDeg: number,
  lonDeg: number
): number | null {
  if (!isValidDate(date) || !finite(latDeg) || !finite(lonDeg)) return null;
  const sub = subsolarPoint(date);
  if (!sub || !finite(sub.lat) || !finite(sub.lon)) return null;

  const phi = latDeg * DEG2RAD;
  const phiS = sub.lat * DEG2RAD;
  const dLon = (lonDeg - sub.lon) * DEG2RAD;
  const cosZ =
    Math.sin(phi) * Math.sin(phiS) +
    Math.cos(phi) * Math.cos(phiS) * Math.cos(dLon);
  return 90 - Math.acos(clamp(cosZ, -1, 1)) * RAD2DEG;
}

/**
 * Mean obliquity of the ecliptic for the date (Meeus 22.2, truncated). Used to
 * rotate ecliptic coordinates onto the equator. Over the decades this app
 * covers, the difference from the J2000 value is arc-seconds.
 */
export function meanObliquityDeg(date: Date): number | null {
  if (!isValidDate(date)) return null;
  const T = (date.getTime() / DAY_MS + 2440587.5 - 2451545.0) / 36525;
  return (
    23.439291111 -
    (46.8150 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600
  );
}

export interface Equatorial {
  /** right ascension [deg, 0-360) */
  raDeg: number;
  /** declination [deg, -90..90] */
  decDeg: number;
}

/** Rotate ecliptic longitude/latitude (deg) onto the equator (Meeus 13.3). */
function eclipticToEquatorial(
  lonDeg: number,
  latDeg: number,
  obliquityDeg: number
): Equatorial {
  const l = lonDeg * DEG2RAD;
  const b = latDeg * DEG2RAD;
  const e = obliquityDeg * DEG2RAD;
  const sinDec =
    Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l);
  const y = Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e);
  const x = Math.cos(l);
  return {
    raDeg: norm360(Math.atan2(y, x) * RAD2DEG),
    decDeg: Math.asin(clamp(sinDec, -1, 1)) * RAD2DEG,
  };
}

/**
 * Geocentric apparent RA/Dec of the Moon, by rotating lib/lunar's ecliptic
 * position onto the equator. Geocentric, not topocentric: see the module header.
 */
export function moonEquatorial(
  date: Date
): (Equatorial & { distanceKm: number }) | null {
  if (!isValidDate(date)) return null;
  const eps = meanObliquityDeg(date);
  if (eps === null) return null;
  const { longitude, latitude, distanceKm } = moonEclipticPosition(date);
  if (!finite(longitude) || !finite(latitude)) return null;
  const eq = eclipticToEquatorial(longitude, latitude, eps);
  return { ...eq, distanceKm };
}

/** The Moon's altitude and azimuth for an observer. */
export function moonHorizontal(
  date: Date,
  latDeg: number,
  lonDeg: number
): HorizontalCoord | null {
  const eq = moonEquatorial(date);
  if (!eq) return null;
  return equatorialToHorizontal(eq.raDeg, eq.decDeg, latDeg, lonDeg, date);
}

export function moonAltitudeDeg(
  date: Date,
  latDeg: number,
  lonDeg: number
): number | null {
  return moonHorizontal(date, latDeg, lonDeg)?.altitude ?? null;
}

/**
 * Geocentric RA/Dec of a planet, light-time corrected: subtract Earth's
 * heliocentric position from the planet's, then iterate so the planet is taken
 * where it WAS when the light we see now left it (the same two-pass correction
 * lib/dwarf-moons uses). Returns null for Earth, which has no geocentric
 * position, and for bad input.
 */
export function planetEquatorial(
  body: PlanetName,
  date: Date
): (Equatorial & { distanceAu: number }) | null {
  if (!isValidDate(date) || body === "Earth") return null;
  const eps = meanObliquityDeg(date);
  if (eps === null) return null;

  const earth = heliocentricPosition("Earth", date);
  let hel = heliocentricPosition(body, date);
  let gx = hel.x - earth.x;
  let gy = hel.y - earth.y;
  let gz = hel.z - earth.z;
  let delta = Math.hypot(gx, gy, gz);
  if (!finite(delta) || delta <= 0) return null;

  for (let i = 0; i < 2; i++) {
    const retarded = new Date(date.getTime() - (delta / LIGHT_AU_PER_DAY) * DAY_MS);
    hel = heliocentricPosition(body, retarded);
    gx = hel.x - earth.x;
    gy = hel.y - earth.y;
    gz = hel.z - earth.z;
    delta = Math.hypot(gx, gy, gz);
  }

  const lonDeg = norm360(Math.atan2(gy, gx) * RAD2DEG);
  const latDeg = Math.asin(clamp(gz / delta, -1, 1)) * RAD2DEG;
  const eq = eclipticToEquatorial(lonDeg, latDeg, eps);
  return { ...eq, distanceAu: delta };
}

/** A planet's altitude and azimuth for an observer. */
export function planetHorizontal(
  body: PlanetName,
  date: Date,
  latDeg: number,
  lonDeg: number
): HorizontalCoord | null {
  const eq = planetEquatorial(body, date);
  if (!eq) return null;
  return equatorialToHorizontal(eq.raDeg, eq.decDeg, latDeg, lonDeg, date);
}

/**
 * Angular distance of a planet from the Sun as seen from Earth (elongation).
 * This is the quantity that decides whether an inner planet is observable at
 * all: Mercury and Venus can never stray further than about 28 and 47 degrees
 * from the Sun, so they are always a twilight object.
 */
export function solarElongationDeg(body: PlanetName, date: Date): number | null {
  const planet = planetEquatorial(body, date);
  if (!planet) return null;
  const sub = subsolarPoint(date);
  const eps = meanObliquityDeg(date);
  if (!sub || eps === null) return null;

  // The Sun's geocentric direction is the anti-direction of Earth's
  // heliocentric position.
  const earth = heliocentricPosition("Earth", date);
  const sunLon = norm360(Math.atan2(-earth.y, -earth.x) * RAD2DEG);
  const sunLat = Math.asin(clamp(-earth.z / earth.distanceAU, -1, 1)) * RAD2DEG;
  const sun = eclipticToEquatorial(sunLon, sunLat, eps);

  const a1 = planet.decDeg * DEG2RAD;
  const a2 = sun.decDeg * DEG2RAD;
  const dRa = (planet.raDeg - sun.raDeg) * DEG2RAD;
  const cosSep =
    Math.sin(a1) * Math.sin(a2) + Math.cos(a1) * Math.cos(a2) * Math.cos(dRa);
  return Math.acos(clamp(cosSep, -1, 1)) * RAD2DEG;
}

// ──────────────────────── generic numerical event finder ────────────────────

/** Any function giving a body's altitude in degrees at an instant. */
export type AltitudeFn = (date: Date) => number | null;

export interface Crossings {
  /** times the altitude crossed the target going UP */
  rising: Date[];
  /** times it crossed going DOWN */
  setting: Date[];
}

/**
 * Every crossing of `targetAltDeg` in [from, to], found by scanning at
 * `stepMinutes` and bisecting each sign change to the second.
 *
 * A coarse step can step over a crossing pair entirely (a body that pops above
 * the target and back down inside one step). 5 minutes is comfortably finer
 * than the Sun's or Moon's motion through the horizon, and callers that care
 * about a fast target pass a smaller step.
 */
export function findCrossings(
  alt: AltitudeFn,
  from: Date,
  to: Date,
  targetAltDeg: number,
  stepMinutes = 5
): Crossings {
  const out: Crossings = { rising: [], setting: [] };
  if (
    typeof alt !== "function" ||
    !isValidDate(from) ||
    !isValidDate(to) ||
    !finite(targetAltDeg) ||
    !finite(stepMinutes) ||
    stepMinutes <= 0 ||
    to.getTime() <= from.getTime()
  ) {
    return out;
  }

  const stepMs = stepMinutes * MINUTE_MS;
  const endMs = to.getTime();
  let prevMs = from.getTime();
  let prevDiff = (alt(new Date(prevMs)) ?? NaN) - targetAltDeg;
  let first = true;

  const emit = (when: Date, rising: boolean) => {
    if (rising) out.rising.push(when);
    else out.setting.push(when);
  };

  for (let ms = prevMs + stepMs; ms <= endMs + stepMs; ms += stepMs) {
    const nowMs = Math.min(ms, endMs);
    const diff = (alt(new Date(nowMs)) ?? NaN) - targetAltDeg;

    if (Number.isFinite(prevDiff) && Number.isFinite(diff)) {
      // An EXACT zero on a sample point is a crossing too. Testing the sign
      // product alone silently drops it (0 is not < 0), and then the next step
      // drops it again (prevDiff is now 0), so a body that happens to sit at
      // the target altitude at a sample instant would never rise or set at all.
      if (prevDiff !== 0 && diff === 0) {
        emit(new Date(nowMs), prevDiff < 0);
      } else if (first && prevDiff === 0 && diff !== 0) {
        // The window opens exactly on the target: the crossing is at `from`.
        emit(new Date(from.getTime()), diff > 0);
      } else if (prevDiff * diff < 0) {
        // bisect to the second
        let loMs = prevMs;
        let hiMs = nowMs;
        let loDiff = prevDiff;
        for (let i = 0; i < 40 && hiMs - loMs > 500; i++) {
          const midMs = (loMs + hiMs) / 2;
          const midDiff = (alt(new Date(midMs)) ?? NaN) - targetAltDeg;
          if (!Number.isFinite(midDiff)) break;
          if (loDiff * midDiff <= 0) {
            hiMs = midMs;
          } else {
            loMs = midMs;
            loDiff = midDiff;
          }
        }
        emit(new Date(Math.round((loMs + hiMs) / 2)), prevDiff < 0);
      }
    }

    first = false;
    prevMs = nowMs;
    prevDiff = diff;
    if (nowMs >= endMs) break;
  }

  return out;
}

export interface Culmination {
  /** highest altitude reached in the window [deg] */
  maxAltitudeDeg: number;
  /** when it was reached */
  at: Date;
}

/**
 * The highest altitude a body reaches in a window, on a `stepMinutes` grid. Used
 * for "how high does Saturn actually get while it is dark here", which is the
 * question that decides whether it is worth looking at.
 */
export function culmination(
  alt: AltitudeFn,
  from: Date,
  to: Date,
  stepMinutes = 10
): Culmination | null {
  if (
    typeof alt !== "function" ||
    !isValidDate(from) ||
    !isValidDate(to) ||
    !finite(stepMinutes) ||
    stepMinutes <= 0 ||
    to.getTime() < from.getTime()
  ) {
    return null;
  }
  const stepMs = stepMinutes * MINUTE_MS;
  let best: Culmination | null = null;
  for (let ms = from.getTime(); ms <= to.getTime(); ms += stepMs) {
    const when = new Date(ms);
    const a = alt(when);
    if (a === null || !Number.isFinite(a)) continue;
    if (!best || a > best.maxAltitudeDeg) best = { maxAltitudeDeg: a, at: when };
  }
  return best;
}

/** Total minutes in [from, to] where `alt` is below `targetAltDeg`. */
export function minutesBelow(
  alt: AltitudeFn,
  from: Date,
  to: Date,
  targetAltDeg: number,
  stepMinutes = 1
): number | null {
  if (
    typeof alt !== "function" ||
    !isValidDate(from) ||
    !isValidDate(to) ||
    !finite(targetAltDeg) ||
    !finite(stepMinutes) ||
    stepMinutes <= 0
  ) {
    return null;
  }
  if (to.getTime() <= from.getTime()) return 0;
  let count = 0;
  for (let ms = from.getTime(); ms < to.getTime(); ms += stepMinutes * MINUTE_MS) {
    const a = alt(new Date(ms));
    if (a !== null && Number.isFinite(a) && a < targetAltDeg) count += stepMinutes;
  }
  return count;
}

// ───────────────────────────── the night itself ─────────────────────────────

/**
 * Why there is no ordinary night here, when there isn't one. These are real
 * states of the sky at high latitude, not gaps in the data.
 */
export type NightState =
  /** an ordinary night: the Sun sets and rises again */
  | "normal"
  /** the Sun never sets in this window */
  | "midnight-sun"
  /** the Sun never rises in this window */
  | "polar-night"
  /** the Sun sets, but never gets 18 degrees down: no astronomical darkness */
  | "no-astronomical-darkness";

export interface NightWindow {
  state: NightState;
  /** when the Sun's upper limb sets (null under midnight sun) */
  sunset: Date | null;
  /** the following sunrise (null under midnight sun) */
  sunrise: Date | null;
  /** the Sun passes -6, -12 and -18 degrees on the way down */
  civilDusk: Date | null;
  nauticalDusk: Date | null;
  astronomicalDusk: Date | null;
  /** and back up again before dawn */
  astronomicalDawn: Date | null;
  nauticalDawn: Date | null;
  civilDawn: Date | null;
  /** length of true astronomical darkness [hours], 0 when there is none */
  darkHours: number;
  /** of those dark hours, how many have the Moon below the horizon */
  moonlessDarkHours: number;
  /** the dark interval, for callers that want to search inside it */
  darkStart: Date | null;
  darkEnd: Date | null;
}

/**
 * The night that `from` belongs to, for this observer.
 *
 * If the Sun is already down at `from` the night in progress is the answer, so
 * we look back up to 24 hours for its sunset; otherwise we look forward for the
 * next one. Everything after that (twilight steps, dawn, darkness length, how
 * much of it is moonless) is measured on the same numerical grid.
 *
 * Returns null only for a bad date or observer.
 */
export function nightWindow(from: Date, observer: Observer): NightWindow | null {
  if (!isValidDate(from) || !validObserver(observer)) return null;
  const { latDeg, lonDeg } = observer;
  const sunAlt: AltitudeFn = (d) => sunAltitudeDeg(d, latDeg, lonDeg);
  const moonAlt: AltitudeFn = (d) => moonAltitudeDeg(d, latDeg, lonDeg);

  const nowAlt = sunAlt(from);
  if (nowAlt === null) return null;
  const sunIsDown = nowAlt < SUN_STANDARD_ALT_DEG;

  // Search a generous window either side so a whole night always fits.
  const searchStart = new Date(from.getTime() - DAY_MS);
  const searchEnd = new Date(from.getTime() + 2 * DAY_MS);
  const horizon = findCrossings(sunAlt, searchStart, searchEnd, SUN_STANDARD_ALT_DEG);

  const empty = (state: NightState): NightWindow => ({
    state,
    sunset: null,
    sunrise: null,
    civilDusk: null,
    nauticalDusk: null,
    astronomicalDusk: null,
    astronomicalDawn: null,
    nauticalDawn: null,
    civilDawn: null,
    darkHours: 0,
    moonlessDarkHours: 0,
    darkStart: null,
    darkEnd: null,
  });

  if (horizon.setting.length === 0 || horizon.rising.length === 0) {
    // No horizon crossing in three days: the Sun is either always up or always
    // down here right now.
    const state: NightState = sunIsDown ? "polar-night" : "midnight-sun";
    const out = empty(state);
    if (state === "polar-night") {
      // It is dark, so measure the darkness over the 24 hours from `from`.
      const end = new Date(from.getTime() + DAY_MS);
      const dark = minutesBelow(sunAlt, from, end, ASTRONOMICAL_TWILIGHT_DEG);
      out.darkStart = from;
      out.darkEnd = end;
      out.darkHours = (dark ?? 0) / 60;
      const moonless = countMoonlessMinutes(sunAlt, moonAlt, from, end);
      out.moonlessDarkHours = Math.min(moonless / 60, out.darkHours);
    }
    return out;
  }

  const sunset = sunIsDown
    ? lastBefore(horizon.setting, from)
    : firstAfter(horizon.setting, from);
  if (!sunset) return empty(sunIsDown ? "polar-night" : "midnight-sun");
  const sunrise = firstAfter(horizon.rising, sunset);
  if (!sunrise) return empty("midnight-sun");

  const dusk = (deg: number) =>
    firstAfter(findCrossings(sunAlt, sunset, sunrise, deg).setting, sunset);
  const dawn = (deg: number) =>
    lastBefore(findCrossings(sunAlt, sunset, sunrise, deg).rising, sunrise);

  const astronomicalDusk = dusk(ASTRONOMICAL_TWILIGHT_DEG);
  const astronomicalDawn = dawn(ASTRONOMICAL_TWILIGHT_DEG);

  const out: NightWindow = {
    state:
      astronomicalDusk && astronomicalDawn ? "normal" : "no-astronomical-darkness",
    sunset,
    sunrise,
    civilDusk: dusk(CIVIL_TWILIGHT_DEG),
    nauticalDusk: dusk(NAUTICAL_TWILIGHT_DEG),
    astronomicalDusk,
    astronomicalDawn,
    nauticalDawn: dawn(NAUTICAL_TWILIGHT_DEG),
    civilDawn: dawn(CIVIL_TWILIGHT_DEG),
    darkHours: 0,
    moonlessDarkHours: 0,
    darkStart: astronomicalDusk,
    darkEnd: astronomicalDawn,
  };

  if (astronomicalDusk && astronomicalDawn) {
    out.darkHours = (astronomicalDawn.getTime() - astronomicalDusk.getTime()) / HOUR_MS;
    // The moonless count runs on a one-minute grid, so it can round up past the
    // exact dark interval it is a subset of. Clamp it: a part can never be
    // larger than its whole, and downstream ratios depend on that holding.
    out.moonlessDarkHours = Math.min(
      countMoonlessMinutes(sunAlt, moonAlt, astronomicalDusk, astronomicalDawn) / 60,
      out.darkHours
    );
  }

  return out;
}

/** Minutes in [from, to] that are BOTH astronomically dark and Moon-free. */
function countMoonlessMinutes(
  sunAlt: AltitudeFn,
  moonAlt: AltitudeFn,
  from: Date,
  to: Date
): number {
  let count = 0;
  for (let ms = from.getTime(); ms < to.getTime(); ms += MINUTE_MS) {
    const when = new Date(ms);
    const s = sunAlt(when);
    const m = moonAlt(when);
    if (s === null || m === null) continue;
    if (s < ASTRONOMICAL_TWILIGHT_DEG && m < 0) count += 1;
  }
  return count;
}

function firstAfter(dates: Date[], t: Date): Date | null {
  for (const d of dates) if (d.getTime() > t.getTime()) return d;
  return null;
}

function lastBefore(dates: Date[], t: Date): Date | null {
  let best: Date | null = null;
  for (const d of dates) if (d.getTime() <= t.getTime()) best = d;
  return best;
}

// ─────────────────────────────── the Moon tonight ───────────────────────────

/** How much the Moon will hurt tonight's faint-object observing. */
export type MoonInterference = "none" | "minor" | "moderate" | "severe";

export interface MoonTonight {
  phase: PhaseName;
  /** 0 (new) to 1 (full) */
  illuminatedFraction: number;
  ageDays: number;
  waxing: boolean;
  rise: Date | null;
  set: Date | null;
  /** highest altitude the Moon reaches during the night window */
  culmination: Culmination | null;
  /** is the Moon above the horizon at any point during astronomical darkness? */
  upDuringDark: boolean;
  interference: MoonInterference;
}

/**
 * The Moon's night: phase from lib/lunar, rise and set found numerically, and an
 * honest verdict on how much it will spoil faint targets.
 *
 * The verdict combines illumination with whether the Moon is actually up while
 * it is dark, because those are different problems. A 90 percent Moon that sets
 * before astronomical darkness begins costs you nothing; a 40 percent Moon that
 * hangs there all night costs you the faint end of the sky.
 */
export function moonTonight(
  night: NightWindow | null,
  observer: Observer,
  reference: Date
): MoonTonight | null {
  if (!night || !validObserver(observer) || !isValidDate(reference)) return null;
  const { latDeg, lonDeg } = observer;
  const moonAlt: AltitudeFn = (d) => moonAltitudeDeg(d, latDeg, lonDeg);

  const phase = moonPhase(night.sunset ?? reference);
  if (!phase) return null;

  const windowStart = night.sunset ?? reference;
  const windowEnd = night.sunrise ?? new Date(windowStart.getTime() + DAY_MS);

  // Look a little either side of the night so a Moon that rose before sunset or
  // sets after sunrise still reports a real time.
  const searchFrom = new Date(windowStart.getTime() - 12 * HOUR_MS);
  const searchTo = new Date(windowEnd.getTime() + 12 * HOUR_MS);
  const cross = findCrossings(moonAlt, searchFrom, searchTo, MOON_STANDARD_ALT_DEG);

  const rise = firstAfter(cross.rising, new Date(windowStart.getTime() - 6 * HOUR_MS));
  const set = rise ? firstAfter(cross.setting, rise) : firstAfter(cross.setting, windowStart);

  const culm = culmination(moonAlt, windowStart, windowEnd, 10);

  let upDuringDark = false;
  if (night.darkStart && night.darkEnd) {
    const darkMinutes =
      (night.darkEnd.getTime() - night.darkStart.getTime()) / MINUTE_MS;
    upDuringDark = darkMinutes - night.moonlessDarkHours * 60 > 1;
  }

  return {
    phase: phase.name,
    illuminatedFraction: phase.illuminatedFraction,
    ageDays: phase.ageDays,
    waxing: phase.waxing,
    rise,
    set,
    culmination: culm,
    upDuringDark,
    interference: moonInterference(phase.illuminatedFraction, upDuringDark),
  };
}

/**
 * Moon interference from illuminated fraction and whether it is up in the dark.
 * Thresholds are the conventional observing-guide bands (a quarter Moon is a
 * nuisance, a gibbous Moon is the end of deep-sky work), stated as a judgement
 * call rather than a measurement.
 */
export function moonInterference(
  illuminatedFraction: number,
  upDuringDark: boolean
): MoonInterference {
  if (!finite(illuminatedFraction)) return "none";
  if (!upDuringDark) return "none";
  if (illuminatedFraction < 0.15) return "minor";
  if (illuminatedFraction < 0.55) return "moderate";
  return "severe";
}

// ────────────────────────────── planets tonight ─────────────────────────────

/** What it takes to see a planet, from its published magnitude range. */
export type PlanetVisibility = "naked-eye" | "dark-sky-naked-eye" | "optics";

export interface PlanetBrightness {
  /** published apparent magnitude range, brightest to faintest */
  magRange: [number, number];
  visibility: PlanetVisibility;
  /** the honest caveat for this body */
  note: string;
}

/**
 * Published apparent-magnitude RANGES, not values computed for tonight. Doing
 * this properly needs a per-planet phase-angle photometric model (Mallama &
 * Hilton 2018); we would rather quote the range and say so than render a
 * precise-looking number we did not compute.
 *
 * Ranges are the standard published extremes (Mallama & Hilton 2018, "Computing
 * apparent planetary magnitudes for the Astronomical Almanac").
 */
export const PLANET_BRIGHTNESS: Record<
  Exclude<PlanetName, "Earth">,
  PlanetBrightness
> = {
  Mercury: {
    magRange: [-2.5, 5.7],
    visibility: "naked-eye",
    note: "Never far from the Sun (28 degrees at most), so it is always a twilight object low in the sky.",
  },
  Venus: {
    magRange: [-4.9, -2.9],
    visibility: "naked-eye",
    note: "The brightest planet by a wide margin, but capped at about 47 degrees from the Sun: an evening or morning object, never overhead at midnight.",
  },
  Mars: {
    magRange: [-2.9, 1.8],
    visibility: "naked-eye",
    note: "Brightness swings by a factor of about 50 between opposition and conjunction, because its distance from us does.",
  },
  Jupiter: {
    magRange: [-2.9, -1.6],
    visibility: "naked-eye",
    note: "Bright all year and unmistakable. Binoculars show the four Galilean moons.",
  },
  Saturn: {
    magRange: [-0.5, 1.2],
    visibility: "naked-eye",
    note: "Easily naked-eye, but the rings need a telescope. Its brightness also depends on the ring tilt.",
  },
  Uranus: {
    magRange: [5.4, 6.0],
    visibility: "dark-sky-naked-eye",
    note: "Right at the naked-eye limit: findable without optics only from a genuinely dark site, and only if you know exactly where to look.",
  },
  Neptune: {
    magRange: [7.7, 8.0],
    visibility: "optics",
    note: "Never naked-eye. Binoculars show it as a star; a telescope shows a tiny disc.",
  },
};

export interface PlanetTonight {
  body: Exclude<PlanetName, "Earth">;
  /** best altitude during the observing window, and when */
  best: Culmination | null;
  /** compass azimuth at that best moment [deg from North] */
  azimuthDeg: number | null;
  /** does it clear USABLE_ALTITUDE_DEG while the sky is dark? */
  worthLooking: boolean;
  /** angular distance from the Sun right now [deg] */
  elongationDeg: number | null;
  brightness: PlanetBrightness;
}

/**
 * Which planets are actually up tonight, and how high they get.
 *
 * The window searched is astronomical darkness when there is any, and otherwise
 * sunset to sunrise, because at a latitude with no real darkness "while it is
 * dark" would return nothing and the planets are still perfectly visible.
 * Sorted by best altitude, highest first: that is the order you would look.
 */
export function planetsTonight(
  night: NightWindow | null,
  observer: Observer
): PlanetTonight[] {
  if (!night || !validObserver(observer)) return [];
  const start = night.darkStart ?? night.sunset;
  const end = night.darkEnd ?? night.sunrise;
  if (!start || !end || end.getTime() <= start.getTime()) return [];

  const { latDeg, lonDeg } = observer;
  const bodies = Object.keys(PLANET_BRIGHTNESS) as Array<
    Exclude<PlanetName, "Earth">
  >;

  const rows = bodies.map((body) => {
    const alt: AltitudeFn = (d) =>
      planetHorizontal(body, d, latDeg, lonDeg)?.altitude ?? null;
    const best = culmination(alt, start, end, 10);
    const azimuthDeg = best
      ? planetHorizontal(body, best.at, latDeg, lonDeg)?.azimuth ?? null
      : null;
    return {
      body,
      best,
      azimuthDeg,
      worthLooking: !!best && best.maxAltitudeDeg >= USABLE_ALTITUDE_DEG,
      elongationDeg: solarElongationDeg(body, start),
      brightness: PLANET_BRIGHTNESS[body],
    };
  });

  return rows.sort(
    (a, b) => (b.best?.maxAltitudeDeg ?? -999) - (a.best?.maxAltitudeDeg ?? -999)
  );
}

// ────────────────────────────── darkness score ──────────────────────────────

export interface DarknessScore {
  /** 0 to 100 */
  score: number;
  /** the two factors that produced it, so the number is auditable on screen */
  darkHoursFactor: number;
  moonlessFactor: number;
  label: string;
}

/** Six hours of astronomical darkness counts as a full night for the score. */
export const FULL_DARK_HOURS = 6;

/**
 * A sky-darkness score for tonight, from the two things this app can actually
 * compute: how long it is astronomically dark, and how much of that darkness is
 * Moon-free.
 *
 *   darkHoursFactor  = min(1, darkHours / 6)
 *   moonlessFactor   = moonlessDarkHours / darkHours   (1 when there is no dark)
 *   score            = 100 * darkHoursFactor * (0.35 + 0.65 * moonlessFactor)
 *
 * The 0.35 floor is deliberate: a bright Moon ruins faint targets but the Moon
 * itself, the planets and the bright stars are all still there, so a moonlit
 * night is not a zero.
 *
 * THIS IS NOT A FORECAST. It contains no cloud cover, no seeing, no
 * transparency and no light pollution, because this app ships no weather or
 * sky-brightness data. See NO_WEATHER_CAVEAT.
 */
export function darknessScore(night: NightWindow | null): DarknessScore | null {
  if (!night || !finite(night.darkHours) || !finite(night.moonlessDarkHours)) {
    return null;
  }
  const darkHoursFactor = clamp(night.darkHours / FULL_DARK_HOURS, 0, 1);
  const moonlessFactor =
    night.darkHours > 0 ? clamp(night.moonlessDarkHours / night.darkHours, 0, 1) : 1;
  const score = Math.round(100 * darkHoursFactor * (0.35 + 0.65 * moonlessFactor));
  return {
    score,
    darkHoursFactor,
    moonlessFactor,
    label: scoreLabel(score),
  };
}

function scoreLabel(score: number): string {
  if (score >= 80) return "long dark night";
  if (score >= 55) return "decent dark window";
  if (score >= 30) return "short or moonlit";
  if (score > 0) return "barely dark";
  return "no astronomical darkness";
}

// ───────────────────────────── honesty copy ─────────────────────────────────

/** The load-bearing caveat. Shown on screen, not buried in a tooltip. */
export const NO_WEATHER_CAVEAT =
  "This is a sky-geometry forecast, not a weather forecast. It knows exactly where every object will be and how dark the sky can get, and it knows nothing at all about clouds, because this app ships no weather data and uses no API keys. A perfect score here can still be a solid overcast where you are standing.";

export const LIGHT_POLLUTION_CAVEAT =
  "No light pollution either. We ship no sky-brightness survey, so we never tell you a limiting magnitude. From a city centre the faint half of anything listed here will be invisible no matter what the geometry says.";

export const TIME_ZONE_CAVEAT =
  "Times are shown in your device's time zone. If you pick a place in another time zone, the geometry is still right for that place, but the clock beside it is yours, not theirs.";

export const PRECISION_CAVEAT =
  "Rise and set times are found by sampling the real computed altitude and bisecting the crossing, so they are good to about a minute for the Sun and a few minutes for the Moon (we apply the standard mean-parallax allowance rather than full topocentric parallax). Planet positions come from JPL approximate elements: fine for pointing, not for occultation timing.";

export const STATE_NOTE: Record<NightState, string> = {
  normal: "The Sun sets and rises again, with a real astronomical night in between.",
  "midnight-sun":
    "The Sun does not set here right now. This is the midnight sun, a real state of the sky at this latitude, not missing data.",
  "polar-night":
    "The Sun does not rise here right now. This is polar night: the darkness lasts all day, and the whole 24 hours is observing time.",
  "no-astronomical-darkness":
    "The Sun sets, but never gets 18 degrees below the horizon, so astronomical darkness never arrives. This is normal for this latitude in mid-summer, and the faintest objects stay out of reach until the season turns.",
};
