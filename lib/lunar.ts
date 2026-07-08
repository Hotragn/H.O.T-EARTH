/**
 * Lunar geometry — Meeus low-precision lunar & solar theory, implemented from
 * first principles (no runtime API). This is the Moon analogue of lib/solar.ts
 * (Earth, NOAA/Spencer) and lib/mars-time.ts (Mars24 / Allison & McEwen): every
 * public function is a pure function of a JavaScript UTC `Date`, so it
 * unit-tests cleanly (lib/lunar.test.ts) and drives both the HUD readouts and
 * the day/night terminator shader (via {@link moonSunDirection}).
 *
 * The Moon has NO atmosphere → NO weather. The honest, dynamic signals are:
 *   - illumination / phase (illuminated fraction, phase name, lunar age),
 *   - the day/night terminator (sub-solar point on the Moon),
 *   - libration (the monthly "nod" that reveals ~59% of the surface).
 * All of it is computed here; nothing is invented. See docs/MOON_PHYSICS.md.
 *
 * Method & references (physics-env-simulation skill: real physics, documented,
 * or it doesn't ship):
 *   - Sun's apparent ecliptic longitude: Meeus, *Astronomical Algorithms*
 *     (2nd ed.) Ch. 25 low-precision series (accurate to ~0.01°).
 *   - Moon's ecliptic longitude/latitude/distance: Meeus Ch. 47, the main
 *     periodic terms (accuracy ~10″ in longitude, enough for phase & a globe).
 *   - Phase angle i, elongation ψ, illuminated fraction k = (1 + cos i)/2:
 *     Meeus Ch. 48 ("Illuminated fraction of the Moon's disk").
 *   - Optical libration in longitude l′ and latitude b′: Meeus Ch. 53
 *     ("Ephemeris for physical observations of the Moon"), from the Moon's mean
 *     orbital elements and the 1.543° inclination of the lunar equator.
 *
 * Coordinate convention: all lat/lon → 3D goes through lib/geo
 * (lon 0→+X, 90E→−Z, N→+Y; globe mesh unrotated). NEVER rotate the globe.
 *
 * Anchor values validated in lib/lunar.test.ts against standard almanac
 * new/full-moon instants (cited in that file and below).
 */

import { latLonToVector3, normalizeLon } from "./geo";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// ── Locked constants (docs/MOON_PHYSICS.md §"Orbital / physical constants") ──

/** Synodic month (new-Moon → new-Moon), days. Phase cycle & lunar solar day. */
export const SYNODIC_MONTH_DAYS = 29.530589;

/** Sidereal month (orbit vs. the fixed stars), days. */
export const SIDEREAL_MONTH_DAYS = 27.321662;

/** Anomalistic month (perigee → perigee), days. */
export const ANOMALISTIC_MONTH_DAYS = 27.55455;

/**
 * Inclination of the lunar equator to the ecliptic, degrees. This tiny
 * obliquity (~1.54°) means the Moon has essentially NO seasons and the
 * sub-solar point stays near the lunar equator — which is why the diurnal
 * temperature model treats the sub-solar point as equatorial.
 */
export const LUNAR_EQUATOR_INCLINATION_DEG = 1.543;

/** Unix ms at the J2000 epoch (2000-01-01 12:00:00 TT ≈ UTC for our purposes). */
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const DAY_MS = 86_400_000;
const JULIAN_CENTURY_DAYS = 36525;

/** Normalize an angle to [0, 360). */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Normalize an angle to (-180, 180]. */
function norm180(deg: number): number {
  const d = norm360(deg);
  return d > 180 ? d - 360 : d;
}

/**
 * Julian centuries of Terrestrial Time since J2000.0 for a UTC instant.
 * We fold in ΔT = TT − UTC ≈ 69.2 s for the modern leap-second era (same
 * approximation, and same honesty note, as lib/mars-time.ts). At ~0.5°/day of
 * lunar motion, 69 s is < 0.0004° — negligible for phase and a globe.
 */
function julianCenturiesTT(date: Date): number {
  const ttMs = date.getTime() + 69_184;
  return (ttMs - J2000_UNIX_MS) / DAY_MS / JULIAN_CENTURY_DAYS;
}

// ────────────────────────────── Sun (Meeus Ch. 25) ──────────────────────────

/**
 * Apparent geocentric ecliptic longitude of the Sun, degrees (Meeus Ch. 25,
 * low-precision). Latitude of the Sun is ~0 (< 1″), so we only need longitude
 * for the phase geometry.
 */
export function sunEclipticLongitude(date: Date): number {
  const T = julianCenturiesTT(date);
  // Geometric mean longitude and mean anomaly of the Sun (deg).
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mr = M * DEG2RAD;
  // Equation of the centre (deg).
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);
  // True (≈ apparent) geometric longitude.
  return norm360(L0 + C);
}

// ────────────────────────────── Moon (Meeus Ch. 47) ─────────────────────────

/** The Moon's fundamental (mean) arguments at date, all in degrees. */
interface MoonArgs {
  /** Lp — Moon's mean longitude */
  Lp: number;
  /** D  — mean elongation of the Moon from the Sun */
  D: number;
  /** M  — Sun's mean anomaly */
  M: number;
  /** Mp — Moon's mean anomaly */
  Mp: number;
  /** F  — Moon's argument of latitude */
  F: number;
  /** Julian centuries TT */
  T: number;
}

function moonArgs(date: Date): MoonArgs {
  const T = julianCenturiesTT(date);
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  // Meeus (47.1)-(47.5), degrees.
  const Lp = norm360(
    218.3164477 +
      481267.88123421 * T -
      0.0015786 * T2 +
      T3 / 538841 -
      T4 / 65194000
  );
  const D = norm360(
    297.8501921 +
      445267.1114034 * T -
      0.0018819 * T2 +
      T3 / 545868 -
      T4 / 113065000
  );
  const M = norm360(
    357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000
  );
  const Mp = norm360(
    134.9633964 +
      477198.8675055 * T +
      0.0087414 * T2 +
      T3 / 69699 -
      T4 / 14712000
  );
  const F = norm360(
    93.272095 +
      483202.0175233 * T -
      0.0036539 * T2 -
      T3 / 3526000 +
      T4 / 863310000
  );
  return { Lp, D, M, Mp, F, T };
}

/**
 * Geocentric ecliptic longitude, latitude (deg) and distance (km) of the Moon
 * (Meeus Ch. 47, principal periodic terms). We keep the dominant terms — more
 * than enough for phase, elongation and a globe (longitude good to ~a few
 * arc-minutes). The eccentricity correction E multiplies terms containing the
 * Sun's mean anomaly M.
 */
export function moonEclipticPosition(date: Date): {
  longitude: number;
  latitude: number;
  distanceKm: number;
} {
  const { Lp, D, M, Mp, F, T } = moonArgs(date);
  const Dr = D * DEG2RAD;
  const Mr = M * DEG2RAD;
  const Mpr = Mp * DEG2RAD;
  const Fr = F * DEG2RAD;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T; // Meeus (47.6)

  // Longitude Σl (units 1e-6 deg) — the largest terms from Meeus Table 47.A.
  const sumL =
    6288774 * Math.sin(Mpr) +
    1274027 * Math.sin(2 * Dr - Mpr) +
    658314 * Math.sin(2 * Dr) +
    213618 * Math.sin(2 * Mpr) +
    -185116 * Math.sin(Mr) * E +
    -114332 * Math.sin(2 * Fr) +
    58793 * Math.sin(2 * Dr - 2 * Mpr) +
    57066 * Math.sin(2 * Dr - Mr - Mpr) * E +
    53322 * Math.sin(2 * Dr + Mpr) +
    45758 * Math.sin(2 * Dr - Mr) * E +
    -40923 * Math.sin(Mr - Mpr) * E +
    -34720 * Math.sin(Dr) +
    -30383 * Math.sin(Mr + Mpr) * E +
    15327 * Math.sin(2 * Dr - 2 * Fr) +
    -12528 * Math.sin(Mpr + 2 * Fr) +
    10980 * Math.sin(Mpr - 2 * Fr) +
    10675 * Math.sin(4 * Dr - Mpr) +
    10034 * Math.sin(3 * Mpr) +
    8548 * Math.sin(4 * Dr - 2 * Mpr) +
    -7888 * Math.sin(2 * Dr + Mr - Mpr) * E +
    -6766 * Math.sin(2 * Dr + Mr) * E +
    -5163 * Math.sin(Dr - Mpr) +
    4987 * Math.sin(Dr + Mr) * E +
    4036 * Math.sin(2 * Dr - Mr + Mpr) * E +
    3994 * Math.sin(2 * Dr + 2 * Mpr) +
    3861 * Math.sin(4 * Dr) +
    3665 * Math.sin(2 * Dr - 3 * Mpr) +
    -2689 * Math.sin(Mr - 2 * Mpr) * E +
    -2602 * Math.sin(2 * Dr - Mpr + 2 * Fr) +
    2390 * Math.sin(2 * Dr - Mr - 2 * Mpr) * E +
    -2348 * Math.sin(Dr + Mpr) +
    2236 * Math.sin(2 * Dr - 2 * Mr) * E * E +
    -2120 * Math.sin(Mr + 2 * Mpr) * E +
    -2069 * Math.sin(2 * Mr) * E * E +
    2048 * Math.sin(2 * Dr - 2 * Mr - Mpr) * E * E +
    -1773 * Math.sin(2 * Dr + Mpr - 2 * Fr) +
    -1595 * Math.sin(2 * Dr + 2 * Fr) +
    1215 * Math.sin(4 * Dr - Mr - Mpr) * E +
    -1110 * Math.sin(2 * Mpr + 2 * Fr) +
    -892 * Math.sin(3 * Dr - Mpr) +
    -810 * Math.sin(2 * Dr + Mr + Mpr) * E +
    759 * Math.sin(4 * Dr - Mr - 2 * Mpr) * E;

  // Latitude Σb (units 1e-6 deg) — largest terms from Meeus Table 47.B.
  const sumB =
    5128122 * Math.sin(Fr) +
    280602 * Math.sin(Mpr + Fr) +
    277693 * Math.sin(Mpr - Fr) +
    173237 * Math.sin(2 * Dr - Fr) +
    55413 * Math.sin(2 * Dr - Mpr + Fr) +
    46271 * Math.sin(2 * Dr - Mpr - Fr) +
    32573 * Math.sin(2 * Dr + Fr) +
    17198 * Math.sin(2 * Mpr + Fr) +
    9266 * Math.sin(2 * Dr + Mpr - Fr) +
    8822 * Math.sin(2 * Mpr - Fr) +
    8216 * Math.sin(2 * Dr - Mr - Fr) * E +
    4324 * Math.sin(2 * Dr - 2 * Mpr - Fr) +
    4200 * Math.sin(2 * Dr + Mpr + Fr) +
    -3359 * Math.sin(2 * Dr + Mr - Mpr + Fr) * E +
    2463 * Math.sin(2 * Dr - Mr - Mpr + Fr) * E +
    2211 * Math.sin(2 * Dr - Mr + Fr) * E +
    2065 * Math.sin(2 * Dr - Mr - Mpr - Fr) * E +
    -1870 * Math.sin(Mr - Mpr - Fr) * E +
    1828 * Math.sin(4 * Dr - Mpr - Fr) +
    -1794 * Math.sin(Mr + Fr) * E +
    -1749 * Math.sin(3 * Fr) +
    -1565 * Math.sin(Mr - Mpr + Fr) * E +
    -1491 * Math.sin(Dr + Fr) +
    -1475 * Math.sin(Mr + Mpr + Fr) * E +
    -1410 * Math.sin(Mr + Mpr - Fr) * E +
    -1344 * Math.sin(Mr - Fr) * E +
    -1335 * Math.sin(Dr - Fr) +
    1107 * Math.sin(3 * Mpr + Fr) +
    1021 * Math.sin(4 * Dr - Fr) +
    833 * Math.sin(4 * Dr - Mpr + Fr);

  // Distance Σr (units 1e-3 km) — largest terms from Meeus Table 47.A cosines.
  const sumR =
    -20905355 * Math.cos(Mpr) +
    -3699111 * Math.cos(2 * Dr - Mpr) +
    -2955968 * Math.cos(2 * Dr) +
    -569925 * Math.cos(2 * Mpr) +
    48888 * Math.cos(Mr) * E +
    -3149 * Math.cos(2 * Fr) +
    246158 * Math.cos(2 * Dr - 2 * Mpr) +
    -152138 * Math.cos(2 * Dr - Mr - Mpr) * E +
    -170733 * Math.cos(2 * Dr + Mpr) +
    -204586 * Math.cos(2 * Dr - Mr) * E +
    -129620 * Math.cos(Mr - Mpr) * E +
    108743 * Math.cos(Dr) +
    104755 * Math.cos(Mr + Mpr) * E +
    10321 * Math.cos(2 * Dr - 2 * Fr) +
    79661 * Math.cos(Mpr - 2 * Fr) +
    -34782 * Math.cos(4 * Dr - Mpr) +
    -23210 * Math.cos(3 * Mpr) +
    -21636 * Math.cos(4 * Dr - 2 * Mpr) +
    24208 * Math.cos(2 * Dr + Mr - Mpr) * E +
    30824 * Math.cos(2 * Dr + Mr) * E +
    -8379 * Math.cos(Dr - Mpr) +
    -16675 * Math.cos(Dr + Mr) * E +
    -12831 * Math.cos(2 * Dr - Mr + Mpr) * E +
    -10445 * Math.cos(2 * Dr + 2 * Mpr) +
    -11650 * Math.cos(4 * Dr) +
    14403 * Math.cos(2 * Dr - 3 * Mpr) +
    -7003 * Math.cos(Mr - 2 * Mpr) * E +
    10056 * Math.cos(2 * Dr - Mr - 2 * Mpr) * E +
    6322 * Math.cos(Dr + Mpr) +
    -9884 * Math.cos(2 * Dr - 2 * Mr) * E * E;

  const longitude = norm360(Lp + sumL / 1e6);
  const latitude = sumB / 1e6;
  const distanceKm = 385000.56 + sumR / 1e3;
  return { longitude, latitude, distanceKm };
}

// ─────────────────────── Phase / illumination (Meeus Ch. 48) ────────────────

export type PhaseName =
  | "New Moon"
  | "Waxing Crescent"
  | "First Quarter"
  | "Waxing Gibbous"
  | "Full Moon"
  | "Waning Gibbous"
  | "Last Quarter"
  | "Waning Crescent";

export interface MoonPhase {
  /** phase angle i, degrees, 0 (full) → 180 (new) */
  phaseAngle: number;
  /** illuminated fraction k = (1 + cos i)/2, 0 (new) → 1 (full) */
  illuminatedFraction: number;
  /** Sun→Moon geocentric elongation ψ, degrees 0–180 */
  elongation: number;
  /**
   * Age of the Moon in days since the last new moon (0 … ~29.53), derived from
   * the Sun–Moon ecliptic longitude difference (the phase angle of the
   * synodic cycle). This is the cycle position, not an integration.
   */
  ageDays: number;
  /** whether the Moon is waxing (growing) — illuminated fraction increasing */
  waxing: boolean;
  name: PhaseName;
}

/**
 * Illuminated fraction & phase of the Moon (Meeus Ch. 48). We use the
 * geocentric ecliptic longitudes of the Sun and Moon (Moon's latitude is small
 * enough that ignoring it changes the phase angle by well under a degree — the
 * standard low-precision approach in Meeus 48).
 *
 * The synodic phase angle Δλ = λ_moon − λ_sun runs 0→360 over a synodic month:
 *   Δλ = 0   → new moon      (k ≈ 0)
 *   Δλ = 90  → first quarter  (k ≈ 0.5, waxing)
 *   Δλ = 180 → full moon      (k ≈ 1)
 *   Δλ = 270 → last quarter   (k ≈ 0.5, waning)
 * Elongation ψ = |Δλ| folded to 0–180; the phase angle i = 180° − ψ; and
 * k = (1 + cos i)/2 (Meeus 48.1/48.2, low-precision form).
 */
export function moonPhase(date: Date): MoonPhase {
  const sunLon = sunEclipticLongitude(date);
  const { longitude: moonLon } = moonEclipticPosition(date);

  // Synodic angle 0–360 (waxing 0→180, waning 180→360).
  const delta = norm360(moonLon - sunLon);

  // Geocentric elongation ψ, 0–180.
  const elongation = delta > 180 ? 360 - delta : delta;
  // Phase angle i (Sun–Moon–Earth), 0 at full, 180 at new.
  const phaseAngle = 180 - elongation;
  const illuminatedFraction = (1 + Math.cos(phaseAngle * DEG2RAD)) / 2;

  const waxing = delta < 180;
  const ageDays = (delta / 360) * SYNODIC_MONTH_DAYS;

  return {
    phaseAngle,
    illuminatedFraction,
    elongation,
    ageDays,
    waxing,
    name: phaseNameFromDelta(delta),
  };
}

/**
 * Phase name from the synodic angle Δλ (deg 0–360). The four "quarter" names
 * get a ±~11° window around the exact 0/90/180/270 crossings so the label reads
 * "First Quarter" near quadrature rather than only at the instant.
 */
export function phaseNameFromDelta(deltaDeg: number): PhaseName {
  const d = norm360(deltaDeg);
  const W = 11.25; // half-window around the cardinal phases (deg)
  if (d < W || d > 360 - W) return "New Moon";
  if (Math.abs(d - 90) < W) return "First Quarter";
  if (Math.abs(d - 180) < W) return "Full Moon";
  if (Math.abs(d - 270) < W) return "Last Quarter";
  if (d < 90) return "Waxing Crescent";
  if (d < 180) return "Waxing Gibbous";
  if (d < 270) return "Waning Gibbous";
  return "Waning Crescent";
}

// ───────────────────── Sub-solar point & terminator ────────────────────────

/**
 * Selenographic sub-solar point — the lat/lon on the Moon where the Sun is at
 * the zenith. Because the lunar equator is inclined only ~1.54° to the ecliptic
 * (docs/MOON_PHYSICS.md), the sub-solar LATITUDE stays within ±1.54° of the
 * lunar equator (we return the Sun's selenographic latitude bounded by that
 * obliquity). The LONGITUDE is the selenographic colongitude complement — it
 * sweeps the surface once per synodic month, from the phase angle.
 *
 * We anchor the sub-solar longitude to the synodic angle so that new moon (Sun
 * behind us as seen from the Moon's near side → the FAR side is lit → sub-solar
 * lon ≈ 180°) and full moon (near side fully lit → sub-solar lon ≈ 0°) come out
 * consistent with the terminator we draw. This gives a physically correct
 * day/night terminator whose sweep matches the illuminated fraction exactly.
 */
export function moonSubsolarPoint(date: Date): { lat: number; lon: number } {
  const sunLon = sunEclipticLongitude(date);
  const { longitude: moonLon } = moonEclipticPosition(date);
  const delta = norm360(moonLon - sunLon); // synodic angle, 0 at new moon

  // Selenographic sub-solar longitude in the Moon's near-side-fixed frame:
  // full moon (delta=180) → near side lit → sub-solar lon 0; new moon
  // (delta=0) → far side lit → sub-solar lon ±180. So lon = 180 − delta.
  const lon = normalizeLon(180 - delta);

  // Sub-solar latitude ≈ the Sun's selenographic latitude, bounded by the
  // lunar-equator inclination. Approximated from the Sun's argument relative to
  // the ascending node of the lunar equator using the small obliquity.
  const lat =
    -LUNAR_EQUATOR_INCLINATION_DEG * Math.sin(sunLon * DEG2RAD);

  return { lat, lon };
}

/**
 * Unit vector from the Moon's centre toward the Sun, in the globe's Moon-fixed
 * frame (lib/geo axis convention). Feed directly to the terminator shader as
 * the `sunDir` uniform: a surface point P is in daylight iff
 * dot(P̂, sunDir) > 0. The exact analogue of solar.ts sunDirection and
 * mars-time.ts marsSunDirection.
 */
export function moonSunDirection(date: Date): [number, number, number] {
  const { lat, lon } = moonSubsolarPoint(date);
  return latLonToVector3(lat, lon, 1);
}

// ─────────────────────── Optical libration (Meeus Ch. 53) ───────────────────

export interface Libration {
  /** optical libration in longitude l′, degrees (bounded ~±7.9°) */
  longitude: number;
  /** optical libration in latitude b′, degrees (bounded ~±6.9°) */
  latitude: number;
}

/**
 * Geocentric optical libration in longitude (l′) and latitude (b′), degrees
 * (Meeus, *Astronomical Algorithms* 2nd ed., Ch. 53, eqs 53.1–53.4). This is
 * the apparent "nod" and "rock" of the Moon's face: because its orbit is
 * eccentric and inclined while its spin is uniform, an Earth observer sees the
 * sub-Earth point wander by up to ~±7.9° in longitude and ~±6.9° in latitude —
 * revealing ~59% of the surface over time.
 *
 * I (= 1.54242°) is the inclination of the lunar equator to the ecliptic; Ω is
 * the longitude of the ascending node of the mean lunar orbit; F, D, M, M′ are
 * the standard fundamental arguments (Ch. 47). We include the principal
 * periodic (nutation-free) optical terms — the "physical" (forced) libration is
 * < 0.04° and omitted, as is standard for the optical libration Meeus reports.
 */
export function libration(date: Date): Libration {
  const { F, T } = moonArgs(date);

  // Longitude of the ascending node of the mean lunar orbit (Meeus 47.7), deg.
  const Omega = norm360(
    125.0445479 -
      1934.1362891 * T +
      0.0020754 * T * T +
      (T * T * T) / 467441 -
      (T * T * T * T) / 60616000
  );

  // Inclination of the mean lunar equator to the ecliptic (Meeus): I = 1°32′32.7″.
  const I = 1.54242 * DEG2RAD;

  // Meeus 53.1: W = λ − Ω, where λ is the Moon's TRUE (periodic) ecliptic
  // longitude — NOT the mean longitude. This is the crux: the ±~7.9° longitude
  // libration comes from the difference between the Moon's true position and
  // where its uniform synchronous rotation points (dominated by the ~±6.3°
  // equation of centre). β is the Moon's true ecliptic latitude.
  const { longitude: lambdaDeg, latitude: betaDeg } =
    moonEclipticPosition(date);
  const W = norm180(lambdaDeg - Omega) * DEG2RAD;
  const B = betaDeg * DEG2RAD;

  const sinW = Math.sin(W);
  const cosW = Math.cos(W);
  const cosI = Math.cos(I);
  const sinI = Math.sin(I);
  const cosB = Math.cos(B);
  const sinB = Math.sin(B);

  // Meeus 53.2: A = atan2( sinW·cosB·cosI − sinB·sinI , cosW·cosB )
  const A = Math.atan2(sinW * cosB * cosI - sinB * sinI, cosW * cosB);

  // Optical libration in longitude l′ = A − F (Meeus 53.3), reduced to (-180,180].
  const lPrime = norm180(A * RAD2DEG - F);

  // Optical libration in latitude b′ = asin( −sinW·cosB·sinI − sinB·cosI )
  // (Meeus 53.4).
  const bPrime =
    Math.asin(
      Math.max(-1, Math.min(1, -sinW * cosB * sinI - sinB * cosI))
    ) * RAD2DEG;

  return { longitude: lPrime, latitude: bPrime };
}

// ─────────────────────────── HUD snapshot ───────────────────────────────────

export interface MoonState {
  phase: MoonPhase;
  subsolar: { lat: number; lon: number };
  libration: Libration;
  distanceKm: number;
}

/**
 * Everything the HUD needs in one pure call, so components read a single
 * snapshot per tick rather than recomputing the series several times (mirrors
 * marsClock).
 */
export function moonState(date: Date): MoonState {
  const { distanceKm } = moonEclipticPosition(date);
  return {
    phase: moonPhase(date),
    subsolar: moonSubsolarPoint(date),
    libration: libration(date),
    distanceKm,
  };
}

/** "18.4° W · 5.1° S" style libration label. */
export function formatLibration(lib: Libration): string {
  const ew = lib.longitude >= 0 ? "E" : "W";
  const ns = lib.latitude >= 0 ? "N" : "S";
  return `${Math.abs(lib.longitude).toFixed(1)}° ${ew} · ${Math.abs(
    lib.latitude
  ).toFixed(1)}° ${ns}`;
}
