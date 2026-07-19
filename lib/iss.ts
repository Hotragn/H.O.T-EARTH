/**
 * ISS orbital propagation — the physics behind the "ISS Tracker" tab.
 *
 * This is the low-Earth-orbit analogue of lib/solar.ts (Earth's day/night) and
 * lib/planets.ts (heliocentric orbits): every public function is a pure function
 * of the two TLE lines + a JavaScript UTC `Date`, so it unit-tests cleanly
 * (lib/iss.test.ts) and the frontend can call it once per animation tick.
 *
 * ── Algorithm ───────────────────────────────────────────────────────────────
 *
 * Propagation is SGP4/SDP4 — the *actual* NORAD/USSPACECOM analytical orbit
 * model the two-line element sets are designed for — via the canonical,
 * MIT-licensed `satellite.js` (a direct port of Vallado's reference C++). We do
 * NOT hand-roll a perturbation model: SGP4 encodes drag (B*), J2/J3/J4 zonal
 * harmonics and (in deep-space mode) lunar/solar resonances, and getting it
 * right is ~1500 lines of subtle code. Using the well-tested library is the
 * honest, correct choice (physics-env-simulation skill: real physics or it
 * doesn't ship — and here "real" means the standard model, not a reinvented one).
 *
 *   Refs:  Hoots & Roehrich, "Models for Propagation of NORAD Element Sets"
 *          (Spacetrack Report #3, 1980); Vallado, Crawford, Hujsak & Kelso,
 *          "Revisiting Spacetrack Report #3" (AIAA 2006-6753). satellite.js v7.
 *
 * ── Frames (READ THIS — the frontend places the ISS with YOUR output) ───────
 *
 * SGP4 works internally in the TEME (True Equator, Mean Equinox) inertial
 * frame. satellite.js gives us:
 *
 *   1. ECI (TEME) position/velocity in km, km/s — inertial, does NOT rotate with
 *      Earth. Exposed on IssState.eci for callers that want the inertial orbit.
 *   2. GEODETIC latitude/longitude/height, obtained by rotating ECI → ECEF with
 *      Greenwich Mean Sidereal Time (`gstime`) and then reducing onto the WGS72
 *      reference ellipsoid (`eciToGeodetic`). This is the SUB-SATELLITE / GROUND
 *      point: the longitude is EARTH-FIXED (Earth's rotation is already baked in),
 *      so the frontend does NOT re-apply Earth's spin — it just drops the marker
 *      at that lat/lon, exactly like a city.
 *
 * The lat/lon we return uses the SAME convention as lib/geo.ts:
 *   latitude  in degrees, +N, geodetic (WGS72 ellipsoid);
 *   longitude in degrees, +E, normalized to [-180, 180).
 * So the frontend renders the ISS marker and the ground track by feeding our
 * lat/lon straight into `latLonToVector3` (lon 0 → +X, +90°E → −Z, N → +Y) on
 * the unrotated globe — no extra rotation, ever.
 *
 * Velocity: `velocityKmS` is the INERTIAL (ECI) speed |v|, i.e. the ~7.66 km/s
 * figure normally quoted for the ISS. (Speed relative to the rotating ground is
 * a little lower; documented here so the HUD can label it honestly.)
 */

import {
  constants,
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
  geodeticToEcf,
  gstime,
  propagate as sgp4Propagate,
  radiansToDegrees,
  twoline2satrec,
  type EciVec3,
  type Kilometer,
  type PositionAndVelocity,
  type SatRec,
} from "satellite.js";

import { normalizeLon } from "./geo";
import { subsolarPoint, sunDirection } from "./solar";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const DAY_MS = 86_400_000;

/**
 * Earth's equatorial radius per the SGP4/WGS72 gravity model (km). Used as the
 * radius of the cylindrical shadow in {@link isSunlit}. Kept identical to the
 * value SGP4 itself uses so the shadow test is self-consistent with the orbit.
 */
const EARTH_RADIUS_KM = constants.earthRadius; // 6378.135

/** Default civil-twilight cutoff: observer counts as "in the dark" for a naked-eye
 *  ISS pass once the Sun is more than 6° below the horizon. */
const DEFAULT_DARKNESS_DEG = -6;

// ────────────────────────────── Public types ───────────────────────────────

/** Parsed geodetic + inertial state of the satellite at one instant. */
export interface IssState {
  /** geodetic latitude, degrees, +N (WGS72 ellipsoid). |lat| ≤ inclination. */
  latitude: number;
  /** geodetic longitude, degrees, +E, normalized to [-180, 180) (Earth-fixed). */
  longitude: number;
  /** geodetic height above the WGS72 ellipsoid, km. */
  altitudeKm: number;
  /** inertial (ECI) speed |v|, km/s — the ~7.66 km/s figure quoted for the ISS. */
  velocityKmS: number;
  /** raw ECI (TEME) position & velocity, km and km/s (for the inertial orbit view). */
  eci: {
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
  };
  /** Greenwich Mean Sidereal Time used for this instant, radians (ECI↔ECEF helper). */
  gmst: number;
}

/** One sample of the sub-satellite ground track. */
export interface GroundTrackPoint {
  /** latitude, degrees, +N. */
  lat: number;
  /** longitude, degrees, +E, [-180, 180). */
  lon: number;
  /** geodetic altitude, km. */
  altitudeKm: number;
  /** the sample time (UTC). */
  time: Date;
}

export interface GroundTrackOptions {
  /** window length in minutes. Default: one orbital period from the TLE (≈93 min). */
  durationMinutes?: number;
  /** spacing between samples in seconds. Default 60. */
  stepSeconds?: number;
  /** true (default): window is centered on `date`. false: window starts at `date`. */
  centered?: boolean;
}

/** A predicted visible/above-horizon pass over a ground observer. */
export interface IssPass {
  /** time the ISS rises above the elevation threshold. */
  start: Date;
  /** time of maximum elevation (culmination). */
  maxElevationTime: Date;
  /** time the ISS sets back below the elevation threshold. */
  end: Date;
  /** peak elevation angle above the horizon, degrees (0–90]. */
  maxElevationDeg: number;
  /** compass azimuth at rise, degrees [0, 360) (0 = N, 90 = E). */
  startAzimuth: number;
  /** compass azimuth at culmination, degrees [0, 360). */
  maxAzimuth: number;
  /** compass azimuth at set, degrees [0, 360). */
  endAzimuth: number;
  /** pass duration above the threshold, seconds. */
  durationSeconds: number;
  /**
   * true ⇒ a naked-eye pass: the ISS is SUNLIT while the observer's sky is dark
   * (see {@link nextPasses} for the exact criteria), evaluated at culmination.
   */
  visible: boolean;
  /** was the ISS itself in sunlight (not Earth's shadow) at culmination? */
  satSunlit: boolean;
  /** the Sun's elevation at the observer at culmination, degrees (negative = below horizon). */
  observerSunElevationDeg: number;
}

export interface PassOptions {
  /** how many days ahead to search. Default 5. */
  days?: number;
  /** coarse scan step, seconds. Default 30. */
  stepSeconds?: number;
  /** elevation that defines a pass (rise/set), degrees. Default 10. */
  minElevationDeg?: number;
  /**
   * Sun-below-horizon angle at the observer required to call a pass "visible",
   * degrees. Default −6 (civil twilight). Use −0 for "any time it's below the
   * horizon", or −12 (nautical) / −18 (astronomical) for stricter darkness.
   */
  darknessDeg?: number;
  /** if true, only return passes with `visible === true`. Default false. */
  visibleOnly?: boolean;
}

/** ECI position (km, TEME) OR a geodetic position, accepted by {@link isSunlit}. */
export type SunlitPosition =
  | { x: number; y: number; z: number }
  | { latitude: number; longitude: number; altitudeKm: number };

// ────────────────────────────── TLE helpers ────────────────────────────────

/**
 * Build an SGP4 `satrec` from the two TLE lines, or `null` if the lines are not
 * a usable element set. Never throws. (satellite.js parses the fixed-column TLE
 * format; a garbage string yields NaN elements, which we reject here.)
 */
export function parseTle(tleLine1: string, tleLine2: string): SatRec | null {
  if (typeof tleLine1 !== "string" || typeof tleLine2 !== "string") return null;
  try {
    const satrec = twoline2satrec(tleLine1, tleLine2);
    // A valid element set has a finite, positive mean motion and finite geometry.
    if (
      !satrec ||
      !Number.isFinite(satrec.no) ||
      satrec.no <= 0 ||
      !Number.isFinite(satrec.inclo) ||
      !Number.isFinite(satrec.ecco) ||
      satrec.ecco < 0 ||
      satrec.ecco >= 1
    ) {
      return null;
    }
    return satrec;
  } catch {
    return null;
  }
}

/**
 * The epoch (reference time) of a TLE, parsed from line 1 columns 19–32:
 * a two-digit year (57–99 ⇒ 19xx, 00–56 ⇒ 20xx) and the fractional day-of-year.
 * Returns `null` for a malformed line. Never throws.
 *
 *   Ref: CelesTrak / NORAD two-line element set format,
 *        https://celestrak.org/columns/v04n03/  (Kelso).
 */
export function tleEpoch(tleLine1: string): Date | null {
  if (typeof tleLine1 !== "string" || tleLine1.length < 32) return null;
  const yy = parseInt(tleLine1.substring(18, 20), 10);
  const dayOfYear = parseFloat(tleLine1.substring(20, 32));
  if (!Number.isFinite(yy) || !Number.isFinite(dayOfYear)) return null;
  const year = yy < 57 ? 2000 + yy : 1900 + yy;
  // day-of-year 1.0 == Jan 1 00:00 UTC, so subtract one day and add the fraction.
  const ms = Date.UTC(year, 0, 1) + (dayOfYear - 1) * DAY_MS;
  const d = new Date(ms);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Age of a TLE in days at `now` (defaults to the current time). Positive when
 * `now` is after the epoch. SGP4 accuracy degrades with TLE age (roughly a few
 * km/day for LEO), so the UI should surface this. Returns `null` for a bad line.
 */
export function tleAgeDays(tleLine1: string, now: Date = new Date()): number | null {
  const epoch = tleEpoch(tleLine1);
  if (!epoch) return null;
  return (now.getTime() - epoch.getTime()) / DAY_MS;
}

/**
 * Orbital period in minutes from the mean motion in TLE line 2 (columns 53–63,
 * revolutions per day): period = 1440 / meanMotion. For the ISS this is ≈ 93 min.
 * Returns `null` for a malformed line.
 */
export function orbitalPeriodMinutes(tleLine2: string): number | null {
  if (typeof tleLine2 !== "string" || tleLine2.length < 63) return null;
  const meanMotion = parseFloat(tleLine2.substring(52, 63));
  if (!Number.isFinite(meanMotion) || meanMotion <= 0) return null;
  return 1440 / meanMotion;
}

/**
 * Orbital inclination in degrees from TLE line 2 (columns 9–16). For the ISS
 * this is ≈ 51.6°, which also bounds the ground track latitude to ±inclination.
 * Returns `null` for a malformed line.
 */
export function inclinationDeg(tleLine2: string): number | null {
  if (typeof tleLine2 !== "string" || tleLine2.length < 16) return null;
  const inc = parseFloat(tleLine2.substring(8, 16));
  if (!Number.isFinite(inc)) return null;
  return inc;
}

// ─────────────────────────── Core propagation ──────────────────────────────

/** Guarded SGP4 propagation → ECI position/velocity, or null on any failure. */
function propagateEci(satrec: SatRec, date: Date): PositionAndVelocity | null {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  let pv: PositionAndVelocity | null;
  try {
    pv = sgp4Propagate(satrec, date);
  } catch {
    return null;
  }
  if (!pv || !pv.position || !pv.velocity) return null;
  const p = pv.position;
  const v = pv.velocity;
  if (
    !Number.isFinite(p.x) ||
    !Number.isFinite(p.y) ||
    !Number.isFinite(p.z) ||
    !Number.isFinite(v.x) ||
    !Number.isFinite(v.y) ||
    !Number.isFinite(v.z)
  ) {
    return null;
  }
  return pv;
}

/** ECI position/velocity + gmst → the geodetic IssState. */
function stateFromEci(pv: PositionAndVelocity, gmst: number): IssState {
  const geo = eciToGeodetic(pv.position, gmst);
  const v = pv.velocity;
  return {
    latitude: radiansToDegrees(geo.latitude),
    longitude: normalizeLon(radiansToDegrees(geo.longitude)),
    altitudeKm: geo.height,
    velocityKmS: Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),
    eci: {
      position: { x: pv.position.x, y: pv.position.y, z: pv.position.z },
      velocity: { x: v.x, y: v.y, z: v.z },
    },
    gmst,
  };
}

/**
 * Propagate a TLE to `date` and return the ISS state (geodetic lat/lon/alt in the
 * lib/geo frame + inertial ECI + speed), or `null` if the element set is invalid
 * or SGP4 fails (decayed orbit, absurd date, etc.). Deterministic in (TLE, date).
 *
 * See the module header for the full frame contract; the short version: feed
 * `latitude`/`longitude` straight into `latLonToVector3` on the unrotated globe.
 */
export function propagate(
  tleLine1: string,
  tleLine2: string,
  date: Date
): IssState | null {
  const satrec = parseTle(tleLine1, tleLine2);
  if (!satrec) return null;
  const pv = propagateEci(satrec, date);
  if (!pv) return null;
  const gmst = gstime(date);
  return stateFromEci(pv, gmst);
}

// ─────────────────────────────── Ground track ──────────────────────────────

/**
 * Sub-satellite ground track: an array of {lat, lon, altitudeKm, time} sampled
 * over a time window (default one full orbit ≈ 93 min, 60 s steps) centered on
 * `date`. Each lat/lon is the Earth-fixed sub-satellite point, ready for
 * `latLonToVector3`.
 *
 * RENDERING NOTE: because longitude is Earth-fixed, a full orbit sweeps the
 * ground point roughly one Earth-radius-per-minute WEST relative to the surface;
 * consecutive samples occasionally jump ~±360° across the ±180° antimeridian.
 * The frontend must SPLIT the polyline wherever |Δlon| between neighbours > 180°
 * rather than drawing a segment straight across the map/globe seam.
 *
 * Returns `[]` for an invalid TLE (never throws). Any individual sample that
 * fails to propagate is skipped.
 */
export function groundTrack(
  tleLine1: string,
  tleLine2: string,
  date: Date,
  opts: GroundTrackOptions = {}
): GroundTrackPoint[] {
  const satrec = parseTle(tleLine1, tleLine2);
  if (!satrec) return [];

  const period = orbitalPeriodMinutes(tleLine2);
  const durationMinutes =
    opts.durationMinutes ?? (period && Number.isFinite(period) ? period : 93);
  const stepSeconds = opts.stepSeconds ?? 60;
  const centered = opts.centered ?? true;
  if (stepSeconds <= 0 || durationMinutes <= 0) return [];

  const durationMs = durationMinutes * 60_000;
  const stepMs = stepSeconds * 1000;
  const startMs = centered ? date.getTime() - durationMs / 2 : date.getTime();
  const endMs = startMs + durationMs;

  const points: GroundTrackPoint[] = [];
  for (let tMs = startMs; tMs <= endMs + 1; tMs += stepMs) {
    const t = new Date(tMs);
    const pv = propagateEci(satrec, t);
    if (!pv) continue;
    const geo = eciToGeodetic(pv.position, gstime(t));
    points.push({
      lat: radiansToDegrees(geo.latitude),
      lon: normalizeLon(radiansToDegrees(geo.longitude)),
      altitudeKm: geo.height,
      time: t,
    });
  }
  return points;
}

// ──────────────────────────────── Sunlit test ──────────────────────────────

/**
 * satellite.js ECF (X→lon 0°, Y→lon 90°E, Z→north) → the lib/geo Earth-fixed
 * frame (X→lon 0°, Y→north, Z→lon −90°). A proper rotation (det +1), so it
 * preserves lengths and angles — all the shadow test needs.
 */
function ecfToGeoFrame(ecf: {
  x: number;
  y: number;
  z: number;
}): [number, number, number] {
  return [ecf.x, ecf.z, -ecf.y];
}

/**
 * Cylindrical-shadow sunlit test, given the satellite position `P` and the unit
 * Sun direction `sun`, both in the SAME Earth-fixed frame.
 *
 *   • If P projects onto the sunward side of Earth (P·sun ≥ 0) it is always lit.
 *   • Otherwise (anti-Sun side) it is lit iff its perpendicular distance from the
 *     Earth–Sun axis exceeds Earth's radius, i.e. it clears the shadow cylinder.
 *
 * This is the standard cylindrical umbra approximation: it ignores the penumbra
 * (the ~0.5°-wide partial-shadow band) and Earth's oblateness, which shift the
 * terminator crossing by at most a second or two of a pass — negligible for
 * deciding whether a pass is naked-eye visible. Documented as an approximation.
 */
function isSunlitGeo(
  P: [number, number, number],
  sun: [number, number, number]
): boolean {
  const proj = P[0] * sun[0] + P[1] * sun[1] + P[2] * sun[2];
  if (proj >= 0) return true;
  const r2 = P[0] * P[0] + P[1] * P[1] + P[2] * P[2];
  const perp = Math.sqrt(Math.max(0, r2 - proj * proj));
  return perp > EARTH_RADIUS_KM;
}

/** Internal: is an ECI (TEME, km) satellite position sunlit at `date`? */
function isEciSunlit(posEci: EciVec3<Kilometer>, date: Date): boolean {
  const ecf = eciToEcf(posEci, gstime(date));
  return isSunlitGeo(ecfToGeoFrame(ecf), sunDirection(date));
}

/**
 * Is the satellite in sunlight (vs. Earth's shadow) at `date`?
 *
 * Accepts either an ECI (TEME, km) position `{x, y, z}` — exactly IssState.eci
 * .position — or a geodetic `{latitude, longitude, altitudeKm}`. The Sun
 * direction comes from lib/solar (`sunDirection`), the same geometry that drives
 * the day/night terminator, so the ISS Tracker and the globe agree.
 *
 * Uses the cylindrical umbra approximation (see the internal note). Returns a
 * boolean; a malformed input returns `false` rather than throwing.
 */
export function isSunlit(pos: SunlitPosition, date: Date): boolean {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return false;
  const sun = sunDirection(date);
  if ("x" in pos) {
    if (
      !Number.isFinite(pos.x) ||
      !Number.isFinite(pos.y) ||
      !Number.isFinite(pos.z)
    ) {
      return false;
    }
    const ecf = eciToEcf({ x: pos.x, y: pos.y, z: pos.z }, gstime(date));
    return isSunlitGeo(ecfToGeoFrame(ecf), sun);
  }
  if (
    !Number.isFinite(pos.latitude) ||
    !Number.isFinite(pos.longitude) ||
    !Number.isFinite(pos.altitudeKm)
  ) {
    return false;
  }
  // Geodetic → ECF on the WGS72 ellipsoid (satellite.js) → geo frame.
  const ecf = geodeticToEcf({
    latitude: pos.latitude * DEG2RAD,
    longitude: pos.longitude * DEG2RAD,
    height: pos.altitudeKm,
  });
  return isSunlitGeo(ecfToGeoFrame(ecf), sun);
}

// ─────────────────────────── Observer / pass math ──────────────────────────

/** Normalize an angle to [0, 360). */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * The Sun's elevation angle at a ground observer, degrees (negative = below the
 * horizon). Computed from lib/solar's subsolar point as 90° minus the great-circle
 * angular distance between the observer and the subsolar point — the same solar
 * geometry as the day/night shader. Used to decide whether the observer's sky is
 * dark enough to see the ISS.
 */
function observerSunElevationDeg(
  observerLatDeg: number,
  observerLonDeg: number,
  date: Date
): number {
  const sub = subsolarPoint(date);
  const lat1 = observerLatDeg * DEG2RAD;
  const lat2 = sub.lat * DEG2RAD;
  const dLon = (sub.lon - observerLonDeg) * DEG2RAD;
  const cosZenith =
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const zenith = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  return 90 - zenith * RAD2DEG;
}

interface LookAngle {
  elevationDeg: number;
  azimuthDeg: number;
  rangeKm: number;
}

/** Topocentric look angles from an observer to the satellite at `date`, or null. */
function lookAngleAt(
  satrec: SatRec,
  observerGd: { latitude: number; longitude: number; height: number },
  date: Date
): LookAngle | null {
  const pv = propagateEci(satrec, date);
  if (!pv) return null;
  const ecf = eciToEcf(pv.position, gstime(date));
  const look = ecfToLookAngles(observerGd, ecf);
  return {
    elevationDeg: radiansToDegrees(look.elevation),
    azimuthDeg: norm360(radiansToDegrees(look.azimuth)),
    rangeKm: look.rangeSat,
  };
}

/** Bisection: find the instant elevation crosses `threshold` between two samples. */
function refineCrossing(
  satrec: SatRec,
  observerGd: { latitude: number; longitude: number; height: number },
  loMs: number,
  hiMs: number,
  threshold: number
): number {
  let lo = loMs;
  let hi = hiMs;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const look = lookAngleAt(satrec, observerGd, new Date(mid));
    const elev = look ? look.elevationDeg : -90;
    // Keep the sub-interval that still straddles the threshold. `lo` is always the
    // below-threshold side, `hi` the above-threshold side (see caller).
    if (elev < threshold) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Upcoming ISS passes over a ground observer, over the next few days.
 *
 * A "pass" is any interval where the topocentric elevation rises above
 * `minElevationDeg` (default 10°) and sets back below it; look angles come from
 * satellite.js `ecfToLookAngles`. We scan coarsely (default 30 s), then refine
 * the rise/set crossings by bisection and the culmination by a fine local scan.
 *
 * VISIBILITY (`visible`): honest naked-eye criterion, evaluated at culmination —
 *   (1) the ISS is SUNLIT (not in Earth's shadow), via {@link isSunlit}, AND
 *   (2) the observer is in the dark: the Sun is more than `darknessDeg` below the
 *       horizon (default −6°, civil twilight).
 * Both use lib/solar's Sun geometry. This is the classic reason the ISS is only
 * visible for an hour or two after dusk / before dawn: the observer must be in
 * twilight while the high-flying station is still in sunlight.
 *
 * Returns `[]` for an invalid TLE or bad observer coordinates (never throws).
 * Deterministic in (TLE, observer, fromDate, opts).
 */
export function nextPasses(
  tleLine1: string,
  tleLine2: string,
  observerLatDeg: number,
  observerLonDeg: number,
  observerAltM: number,
  fromDate: Date,
  opts: PassOptions = {}
): IssPass[] {
  const satrec = parseTle(tleLine1, tleLine2);
  if (!satrec) return [];
  if (
    !Number.isFinite(observerLatDeg) ||
    !Number.isFinite(observerLonDeg) ||
    !Number.isFinite(observerAltM) ||
    !(fromDate instanceof Date) ||
    !Number.isFinite(fromDate.getTime())
  ) {
    return [];
  }

  const days = opts.days ?? 5;
  const stepSeconds = opts.stepSeconds ?? 30;
  const minElevationDeg = opts.minElevationDeg ?? 10;
  const darknessDeg = opts.darknessDeg ?? DEFAULT_DARKNESS_DEG;
  const visibleOnly = opts.visibleOnly ?? false;
  if (days <= 0 || stepSeconds <= 0) return [];

  const observerGd = {
    latitude: observerLatDeg * DEG2RAD,
    longitude: observerLonDeg * DEG2RAD,
    height: observerAltM / 1000, // satellite.js wants km
  };

  const stepMs = stepSeconds * 1000;
  const startMs = fromDate.getTime();
  const endMs = startMs + days * DAY_MS;

  const passes: IssPass[] = [];

  let prevMs = startMs;
  let prevElev = lookAngleAt(satrec, observerGd, new Date(startMs))?.elevationDeg ?? -90;

  // If we begin mid-pass (already above the horizon), anchor the start at fromDate.
  let inPass = prevElev >= minElevationDeg;
  let riseMs = inPass ? startMs : NaN;

  for (let tMs = startMs + stepMs; tMs <= endMs; tMs += stepMs) {
    const look = lookAngleAt(satrec, observerGd, new Date(tMs));
    const elev = look ? look.elevationDeg : -90;

    if (!inPass && elev >= minElevationDeg) {
      // Rising edge: refine the crossing between prevMs (below) and tMs (above).
      inPass = true;
      riseMs = refineCrossing(satrec, observerGd, prevMs, tMs, minElevationDeg);
    } else if (inPass && elev < minElevationDeg) {
      // Falling edge: refine the set crossing, then finalize the pass.
      const setMs = Number.isFinite(riseMs)
        ? refineCrossing(satrec, observerGd, tMs, prevMs, minElevationDeg)
        : tMs;
      const pass = buildPass(
        satrec,
        observerGd,
        observerLatDeg,
        observerLonDeg,
        riseMs,
        setMs,
        stepMs,
        minElevationDeg,
        darknessDeg
      );
      if (pass && (!visibleOnly || pass.visible)) passes.push(pass);
      inPass = false;
      riseMs = NaN;
    }

    prevMs = tMs;
    prevElev = elev;
  }

  return passes;
}

/** Assemble a finished pass: find culmination, azimuths, and visibility. */
function buildPass(
  satrec: SatRec,
  observerGd: { latitude: number; longitude: number; height: number },
  observerLatDeg: number,
  observerLonDeg: number,
  riseMs: number,
  setMs: number,
  coarseStepMs: number,
  minElevationDeg: number,
  darknessDeg: number
): IssPass | null {
  if (!(setMs > riseMs)) return null;

  // Coarse-then-fine search for the culmination between rise and set.
  let bestMs = (riseMs + setMs) / 2;
  let bestElev = -90;
  const coarse = Math.max(coarseStepMs / 3, 5000);
  for (let tMs = riseMs; tMs <= setMs; tMs += coarse) {
    const e = lookAngleAt(satrec, observerGd, new Date(tMs))?.elevationDeg ?? -90;
    if (e > bestElev) {
      bestElev = e;
      bestMs = tMs;
    }
  }
  // Refine around the coarse peak at 1 s resolution.
  const fineLo = Math.max(riseMs, bestMs - coarse);
  const fineHi = Math.min(setMs, bestMs + coarse);
  for (let tMs = fineLo; tMs <= fineHi; tMs += 1000) {
    const e = lookAngleAt(satrec, observerGd, new Date(tMs))?.elevationDeg ?? -90;
    if (e > bestElev) {
      bestElev = e;
      bestMs = tMs;
    }
  }

  const startLook = lookAngleAt(satrec, observerGd, new Date(riseMs));
  const maxLook = lookAngleAt(satrec, observerGd, new Date(bestMs));
  const endLook = lookAngleAt(satrec, observerGd, new Date(setMs));
  if (!startLook || !maxLook || !endLook) return null;

  const maxDate = new Date(bestMs);
  const pv = propagateEci(satrec, maxDate);
  const satSunlit = pv ? isEciSunlit(pv.position, maxDate) : false;
  const sunElev = observerSunElevationDeg(observerLatDeg, observerLonDeg, maxDate);
  const visible = satSunlit && sunElev < darknessDeg;

  return {
    start: new Date(riseMs),
    maxElevationTime: maxDate,
    end: new Date(setMs),
    maxElevationDeg: Math.min(90, Math.max(0, maxLook.elevationDeg)),
    startAzimuth: startLook.azimuthDeg,
    maxAzimuth: maxLook.azimuthDeg,
    endAzimuth: endLook.azimuthDeg,
    durationSeconds: (setMs - riseMs) / 1000,
    visible,
    satSunlit,
    observerSunElevationDeg: sunElev,
  };
}
