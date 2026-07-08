/**
 * Heliocentric orbital physics for all eight major planets — the "Solar System"
 * phase of the digital twin. This powers two views:
 *
 *   1. an ORRERY (every planet in its real orbit, all on screen at once), and
 *   2. per-planet GLOBES (a day/night terminator + season for each body),
 *
 * and it is the planetary analogue of lib/solar.ts (Earth), lib/mars-time.ts
 * (Mars) and lib/lunar.ts (Moon): every public function is a pure function of a
 * JavaScript UTC `Date`, so it unit-tests cleanly (lib/planets.test.ts) and the
 * frontend can reuse the same dot(P̂, sunDir) > 0 terminator pattern via
 * {@link planetSunDirection}.
 *
 * ── Sources (physics-env-simulation skill: real physics, documented, or it
 *    doesn't ship — no invented numbers) ─────────────────────────────────────
 *
 *   • Keplerian elements + per-century rates: E. M. Standish (JPL Solar System
 *     Dynamics), "Keplerian Elements for Approximate Positions of the Major
 *     Planets", Table 1 (valid 1800 AD – 2050 AD).
 *     https://ssd.jpl.nasa.gov/planets/approx_pos.html  (and the printed table
 *     in the Explanatory Supplement to the Astronomical Almanac). Our simulated
 *     era (2000–2050) is well inside Table 1's validity window, so no Table-2
 *     Jupiter–Neptune correction terms are needed.
 *
 *   • Physical/rotational data (sidereal orbit & rotation periods, obliquity,
 *     equatorial radius): NASA/GSFC Planetary Fact Sheets,
 *     https://nssdc.gsfc.nasa.gov/planetary/factsheet/  (Williams, NASA NSSDCA).
 *
 * ── Algorithm (heliocentric position) ──────────────────────────────────────
 *
 * The exact recipe from Standish's approximate-positions document:
 *   1. element(T) = element(J2000) + rate · T,  T = Julian centuries TT past J2000
 *   2. argument of perihelion ω = ϖ − Ω;  mean anomaly M = L − ϖ  (mod ±180°)
 *   3. solve Kepler's equation  M = E − e·sinE  by Newton iteration
 *   4. in-orbital-plane coords  x' = a(cosE − e),  y' = a·√(1−e²)·sinE
 *   5. rotate by ω, I, Ω into the J2000 ecliptic frame → heliocentric x,y,z (AU)
 *
 * This matches Meeus (*Astronomical Algorithms*, Ch. 33) to the accuracy of the
 * mean elements (a few arc-minutes over the modern era) — far beyond what an
 * orrery or a globe's terminator needs. Accuracy is honest, not exact: these are
 * *mean* Keplerian elements, not a JPL DE ephemeris.
 *
 * Coordinate convention: any lat/lon → 3D still goes through lib/geo
 * (lon 0→+X, 90E→−Z, N→+Y; globe mesh unrotated). NEVER rotate a globe.
 */

import { latLonToVector3, normalizeLon } from "./geo";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** Unix ms at the J2000 epoch (2000-01-01 12:00:00 TT ≈ UTC for our purposes). */
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const DAY_MS = 86_400_000;
const JULIAN_CENTURY_DAYS = 36525;
const DAYS_PER_YEAR = 365.25;

/** Normalize an angle to [0, 360). */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Normalize an angle to (-180, 180]. */
function norm180(deg: number): number {
  const d = norm360(deg);
  return d > 180 ? d - 360 : d;
}

// ─────────────────────────── Planet identifiers ────────────────────────────

export type PlanetName =
  | "Mercury"
  | "Venus"
  | "Earth"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune";

/** The eight bodies, in orbital order, for iterating the orrery. */
export const PLANET_ORDER: readonly PlanetName[] = [
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
] as const;

// ───────────────────────── Keplerian element table ─────────────────────────

/**
 * J2000 heliocentric Keplerian elements and their per-Julian-century rates.
 * All angles in DEGREES, `a` in AU. Direct transcription of JPL Table 1
 * (Standish, "Keplerian Elements for Approximate Positions of the Major
 * Planets", 1800–2050). Earth's row is the Earth–Moon barycenter (as published
 * by JPL) — the ~4700 km barycenter offset is far below orrery/globe resolution.
 */
export interface KeplerianElements {
  /** semi-major axis a [AU] and its rate [AU/century] */
  a: number;
  aDot: number;
  /** eccentricity e [–] and its rate [1/century] */
  e: number;
  eDot: number;
  /** inclination i to the J2000 ecliptic [deg] and rate [deg/century] */
  i: number;
  iDot: number;
  /** mean longitude L [deg] and rate [deg/century] */
  L: number;
  LDot: number;
  /** longitude of perihelion ϖ [deg] and rate [deg/century] */
  peri: number;
  periDot: number;
  /** longitude of ascending node Ω [deg] and rate [deg/century] */
  node: number;
  nodeDot: number;
}

/**
 * Physical & rotational constants (NASA/GSFC Planetary Fact Sheet). Kept in the
 * same record so a single lookup serves both the orrery and the per-planet
 * globe. `siderealDayHours` is NEGATIVE for retrograde rotators (Venus, Uranus),
 * exactly as the Fact Sheet tabulates it.
 */
export interface PlanetPhysical {
  /** sidereal orbital period [Earth years] (Fact Sheet) */
  orbitalPeriodYears: number;
  /** sidereal rotation period [hours]; negative ⇒ retrograde spin */
  siderealDayHours: number;
  /** axial obliquity (tilt of equator to orbit) [deg] (Fact Sheet) */
  obliquityDeg: number;
  /** equatorial radius [km] (Fact Sheet) */
  equatorialRadiusKm: number;
}

export interface PlanetData {
  name: PlanetName;
  elements: KeplerianElements;
  physical: PlanetPhysical;
}

/**
 * The full per-body table. Element values are the exact JPL Table-1 figures;
 * physical values are the NASA Planetary Fact Sheet figures (both cited in the
 * module header). Reference sidereal orbital periods in `physical` are the
 * measured Fact-Sheet values; the Kepler-3rd-law period derived from `a`
 * (see {@link keplerPeriodYears}) agrees with them to well under 1%.
 */
export const PLANETS: Record<PlanetName, PlanetData> = {
  Mercury: {
    name: "Mercury",
    elements: {
      a: 0.38709927, aDot: 0.00000037,
      e: 0.20563593, eDot: 0.00001906,
      i: 7.00497902, iDot: -0.00594749,
      L: 252.2503235, LDot: 149472.67411175,
      peri: 77.45779628, periDot: 0.16047689,
      node: 48.33076593, nodeDot: -0.12534081,
    },
    physical: {
      orbitalPeriodYears: 0.2408467, // 87.969 d
      siderealDayHours: 1407.6,
      obliquityDeg: 0.034,
      equatorialRadiusKm: 2439.7,
    },
  },
  Venus: {
    name: "Venus",
    elements: {
      a: 0.72333566, aDot: 0.0000039,
      e: 0.00677672, eDot: -0.00004107,
      i: 3.39467605, iDot: -0.0007889,
      L: 181.9790995, LDot: 58517.81538729,
      peri: 131.60246718, periDot: 0.00268329,
      node: 76.67984255, nodeDot: -0.27769418,
    },
    physical: {
      orbitalPeriodYears: 0.61519726, // 224.701 d
      siderealDayHours: -5832.5, // retrograde
      obliquityDeg: 177.36, // >90° ⇒ retrograde
      equatorialRadiusKm: 6051.8,
    },
  },
  Earth: {
    name: "Earth",
    elements: {
      a: 1.00000261, aDot: 0.00000562,
      e: 0.01671123, eDot: -0.00004392,
      i: -0.00001531, iDot: -0.01294668,
      L: 100.46457166, LDot: 35999.37244981,
      peri: 102.93768193, periDot: 0.32327364,
      node: 0.0, nodeDot: 0.0,
    },
    physical: {
      orbitalPeriodYears: 1.0000174, // 365.256 d (sidereal)
      siderealDayHours: 23.9344696, // sidereal day
      obliquityDeg: 23.44,
      equatorialRadiusKm: 6378.137,
    },
  },
  Mars: {
    name: "Mars",
    elements: {
      a: 1.52371034, aDot: 0.00001847,
      e: 0.0933941, eDot: 0.00007882,
      i: 1.84969142, iDot: -0.00813131,
      L: -4.55343205, LDot: 19140.30268499,
      peri: -23.94362959, periDot: 0.44441088,
      node: 49.55953891, nodeDot: -0.29257343,
    },
    physical: {
      orbitalPeriodYears: 1.8808476, // 686.980 d
      siderealDayHours: 24.622962,
      obliquityDeg: 25.19,
      equatorialRadiusKm: 3396.2,
    },
  },
  Jupiter: {
    name: "Jupiter",
    elements: {
      a: 5.202887, aDot: -0.00011607,
      e: 0.04838624, eDot: -0.00013253,
      i: 1.30439695, iDot: -0.00183714,
      L: 34.39644051, LDot: 3034.74612775,
      peri: 14.72847983, periDot: 0.21252668,
      node: 100.47390909, nodeDot: 0.20469106,
    },
    physical: {
      orbitalPeriodYears: 11.862615, // 4332.589 d
      siderealDayHours: 9.925, // System III
      obliquityDeg: 3.13,
      equatorialRadiusKm: 71492,
    },
  },
  Saturn: {
    name: "Saturn",
    elements: {
      a: 9.53667594, aDot: -0.0012506,
      e: 0.05386179, eDot: -0.00050991,
      i: 2.48599187, iDot: 0.00193609,
      L: 49.95424423, LDot: 1222.49362201,
      peri: 92.59887831, periDot: -0.41897216,
      node: 113.66242448, nodeDot: -0.28867794,
    },
    physical: {
      orbitalPeriodYears: 29.447498, // 10759.22 d
      siderealDayHours: 10.656,
      obliquityDeg: 26.73,
      equatorialRadiusKm: 60268,
    },
  },
  Uranus: {
    name: "Uranus",
    elements: {
      a: 19.18916464, aDot: -0.00196176,
      e: 0.04725744, eDot: -0.00004397,
      i: 0.77263783, iDot: -0.00242939,
      L: 313.23810451, LDot: 428.48202785,
      peri: 170.9542763, periDot: 0.40805281,
      node: 74.01692503, nodeDot: 0.04240589,
    },
    physical: {
      orbitalPeriodYears: 84.016846, // 30685.4 d
      siderealDayHours: -17.24, // retrograde
      obliquityDeg: 97.77, // >90° ⇒ retrograde
      equatorialRadiusKm: 25559,
    },
  },
  Neptune: {
    name: "Neptune",
    elements: {
      a: 30.06992276, aDot: 0.00026291,
      e: 0.00859048, eDot: 0.00005105,
      i: 1.77004347, iDot: 0.00035372,
      L: -55.12002969, LDot: 218.45945325,
      peri: 44.96476227, periDot: -0.32241464,
      node: 131.78422574, nodeDot: -0.00508664,
    },
    physical: {
      orbitalPeriodYears: 164.79132, // 60189 d
      siderealDayHours: 16.11,
      obliquityDeg: 28.32,
      equatorialRadiusKm: 24764,
    },
  },
};

// ─────────────────────────── Time / epoch helper ───────────────────────────

/**
 * Julian centuries of Terrestrial Time since J2000.0 for a UTC instant. We fold
 * in ΔT = TT − UTC ≈ 69.2 s for the modern leap-second era (the same
 * approximation, and same honesty note, as lib/mars-time.ts and lib/lunar.ts).
 * At planetary mean-motion rates this is utterly negligible.
 */
export function julianCenturiesTT(date: Date): number {
  const ttMs = date.getTime() + 69_184;
  return (ttMs - J2000_UNIX_MS) / DAY_MS / JULIAN_CENTURY_DAYS;
}

/** Earth days of TT elapsed since J2000.0 for a UTC instant. */
function daysSinceJ2000(date: Date): number {
  return (date.getTime() + 69_184 - J2000_UNIX_MS) / DAY_MS;
}

// ─────────────────────────── Kepler's equation ─────────────────────────────

/**
 * Solve Kepler's equation M = E − e·sinE for the eccentric anomaly E (radians)
 * by Newton–Raphson. `M` is the mean anomaly in radians, `e` the eccentricity.
 * Converges quadratically; for the major planets (e ≤ 0.206, Mercury) it needs
 * only a handful of iterations to reach machine precision. Exported so the
 * solver's convergence/stability can be unit-tested directly.
 */
export function solveKepler(M: number, e: number, tolerance = 1e-12): number {
  // Reduce M to (-π, π] for a good, symmetric starting guess.
  const Mr = Math.atan2(Math.sin(M), Math.cos(M));
  let E = e < 0.8 ? Mr : Math.PI; // standard high-e fallback start
  for (let iter = 0; iter < 100; iter++) {
    const dE = (E - e * Math.sin(E) - Mr) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tolerance) break;
  }
  return E;
}

// ──────────────────────── Heliocentric position ────────────────────────────

/** Heliocentric ecliptic coordinates (J2000 frame), astronomical units. */
export interface HeliocentricPosition {
  /** ecliptic X toward the J2000 vernal equinox [AU] */
  x: number;
  /** ecliptic Y, 90° ahead in the ecliptic plane [AU] */
  y: number;
  /** ecliptic Z toward the ecliptic north pole [AU] */
  z: number;
  /** distance from the Sun r = |(x,y,z)| [AU] */
  distanceAU: number;
  /** heliocentric ecliptic longitude λ = atan2(y, x) [deg, 0–360) */
  longitudeDeg: number;
}

/**
 * Heliocentric ecliptic position of a planet at a UTC instant, in AU, by the
 * JPL approximate-positions recipe (see module header). The returned frame is
 * the J2000 ecliptic: +X to the vernal equinox, +Z to the ecliptic north pole.
 */
export function heliocentricPosition(
  body: PlanetName,
  date: Date
): HeliocentricPosition {
  const T = julianCenturiesTT(date);
  const el = PLANETS[body].elements;

  // 1. Propagate the mean elements to the epoch.
  const a = el.a + el.aDot * T;
  const e = el.e + el.eDot * T;
  const i = (el.i + el.iDot * T) * DEG2RAD;
  const L = el.L + el.LDot * T;
  const peri = el.peri + el.periDot * T;
  const node = el.node + el.nodeDot * T;

  // 2. Argument of perihelion and mean anomaly (reduced to ±180°).
  const omega = (peri - node) * DEG2RAD;
  const Omega = node * DEG2RAD;
  const M = norm180(L - peri) * DEG2RAD;

  // 3. Eccentric anomaly.
  const E = solveKepler(M, e);

  // 4. Position in the orbital plane (AU).
  const xPlane = a * (Math.cos(E) - e);
  const yPlane = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // 5. Rotate ω (in-plane), I (tilt), Ω (node) into the J2000 ecliptic frame.
  const cosO = Math.cos(omega);
  const sinO = Math.sin(omega);
  const cosN = Math.cos(Omega);
  const sinN = Math.sin(Omega);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);

  const x =
    (cosO * cosN - sinO * sinN * cosI) * xPlane +
    (-sinO * cosN - cosO * sinN * cosI) * yPlane;
  const y =
    (cosO * sinN + sinO * cosN * cosI) * xPlane +
    (-sinO * sinN + cosO * cosN * cosI) * yPlane;
  const z = sinO * sinI * xPlane + cosO * sinI * yPlane;

  const distanceAU = Math.sqrt(x * x + y * y + z * z);
  const longitudeDeg = norm360(Math.atan2(y, x) * RAD2DEG);
  return { x, y, z, distanceAU, longitudeDeg };
}

/** Heliocentric distance from the Sun [AU] (convenience wrapper). */
export function heliocentricDistanceAU(body: PlanetName, date: Date): number {
  return heliocentricPosition(body, date).distanceAU;
}

// ─────────────────────────── Orbital-period helpers ────────────────────────

/**
 * Sidereal orbital period from Kepler's third law: for a body orbiting the Sun,
 * P[yr] = a[AU]^(3/2). Uses the propagated `a` at the given date (rates barely
 * move `a`, but this keeps it exact). If no date is given, uses the J2000 value.
 */
export function keplerPeriodYears(body: PlanetName, date?: Date): number {
  const el = PLANETS[body].elements;
  const T = date ? julianCenturiesTT(date) : 0;
  const a = el.a + el.aDot * T;
  return Math.pow(a, 1.5);
}

/** Tabulated (Fact-Sheet) sidereal orbital period [Earth years]. */
export function orbitalPeriodYears(body: PlanetName): number {
  return PLANETS[body].physical.orbitalPeriodYears;
}

/** Perihelion distance a(1−e) [AU] at J2000. */
export function perihelionAU(body: PlanetName): number {
  const { a, e } = PLANETS[body].elements;
  return a * (1 - e);
}

/** Aphelion distance a(1+e) [AU] at J2000. */
export function aphelionAU(body: PlanetName): number {
  const { a, e } = PLANETS[body].elements;
  return a * (1 + e);
}

/** True ⇒ the planet spins retrograde (Venus, Uranus). */
export function isRetrograde(body: PlanetName): boolean {
  return PLANETS[body].physical.siderealDayHours < 0;
}

// ───────────────────── Rotation, solar day & sub-solar point ────────────────

/**
 * Length of the mean SOLAR day (noon-to-noon) in Earth days. Derived honestly
 * from the sidereal rotation and orbital periods:
 *
 *   n_sid   = 1 / P_sid    (rotations per Earth day; signed — negative retro)
 *   n_orb   = 1 / P_orb    (orbits per Earth day; always prograde)
 *   n_solar = n_sid − n_orb
 *   solar day = 1 / |n_solar|
 *
 * Sanity checks this reproduces: Earth ≈ 1.0 d, Venus ≈ 116.75 d (retrograde),
 * Mercury ≈ 175.9 d (the famous 3:2 spin–orbit resonance day), Mars ≈ 1.0275 d.
 */
export function solarDayEarthDays(body: PlanetName): number {
  const ph = PLANETS[body].physical;
  const pSidDays = ph.siderealDayHours / 24; // signed
  const pOrbDays = ph.orbitalPeriodYears * DAYS_PER_YEAR;
  const nSolar = 1 / pSidDays - 1 / pOrbDays;
  return Math.abs(1 / nSolar);
}

/**
 * Signed sub-solar longitude sweep rate, DEGREES of body-fixed longitude per
 * Earth day. Prograde rotators sweep the sub-solar point westward (negative,
 * like Earth's −15°/hr); retrograde rotators sweep it eastward (positive).
 */
function subSolarLonRateDegPerDay(body: PlanetName): number {
  const ph = PLANETS[body].physical;
  const pSidDays = ph.siderealDayHours / 24; // signed
  const pOrbDays = ph.orbitalPeriodYears * DAYS_PER_YEAR;
  const nSolar = 1 / pSidDays - 1 / pOrbDays; // rotations per day rel. to Sun
  return -360 * nSolar;
}

/**
 * Sub-solar longitude in the planet's body-fixed frame [deg, normalized to
 * (−180, 180]] at a UTC instant.
 *
 * HONESTY NOTE: the sweep RATE and DIRECTION are physically real (from the
 * sidereal rotation + orbital motion; retrograde handled via the sign of the
 * rotation period). The absolute PHASE is anchored to sub-solar longitude 0° at
 * J2000 as an *adopted convention* — pinning it to each body's true surface
 * meridian would require the IAU (WGCCRE) prime-meridian constant W₀, which this
 * Keplerian layer deliberately does not carry. For a day/night terminator that
 * is exactly what's needed: the terminator sweeps at the correct solar-day rate
 * in the correct direction; only its registration to named surface features is
 * conventional. Documented so the frontend can label it honestly.
 */
export function subSolarLongitude(body: PlanetName, date: Date): number {
  const d = daysSinceJ2000(date);
  return norm180(subSolarLonRateDegPerDay(body) * d);
}

/**
 * Effective seasonal tilt [deg] — the obliquity folded into [0, 90], i.e. the
 * dihedral angle between the equatorial and orbital planes. This is what bounds
 * the sub-solar latitude. For prograde bodies (ε ≤ 90°) it is just ε; for the
 * "tipped-over" bodies it is 180° − ε, so Uranus (ε = 97.77°) gets a real
 * ±82.2° seasonal swing (its poles bake in summer) while Venus (ε = 177.36°)
 * collapses to ±2.6° — the almost-seasonless world it actually is. Reporting
 * the raw Fact-Sheet obliquity (via PLANETS[body].physical) is unchanged.
 */
export function effectiveTiltDeg(body: PlanetName): number {
  const eps = PLANETS[body].physical.obliquityDeg;
  return eps > 90 ? 180 - eps : eps;
}

/**
 * Sub-solar latitude [deg] — the planet's seasonal solar declination, using the
 * exact spherical form (same as lib/mars-time.ts marsSolarDeclination):
 *
 *   sin δ = sin(effTilt) · sin(λ − λ_ref)
 *
 * so |δ| ≤ effectiveTilt automatically. The season is phase-locked to the
 * planet's real heliocentric longitude λ, with λ_ref = 0 (measured from the
 * J2000 vernal-equinox direction) adopted as the season zero-point: the
 * amplitude and rate are physical, but the absolute solstice DATE is an adopted
 * reference because it depends on the body's IAU pole orientation (out of scope
 * for this Keplerian layer). Documented so the HUD labels it honestly.
 */
export function subSolarLatitude(body: PlanetName, date: Date): number {
  const tilt = effectiveTiltDeg(body) * DEG2RAD;
  const lambda = heliocentricPosition(body, date).longitudeDeg * DEG2RAD;
  const sinDec = Math.sin(tilt) * Math.sin(lambda);
  return Math.asin(Math.max(-1, Math.min(1, sinDec))) * RAD2DEG;
}

/** Sub-solar point (lat/lon, deg) in the body-fixed frame at a UTC instant. */
export function subSolarPoint(
  body: PlanetName,
  date: Date
): { lat: number; lon: number } {
  return {
    lat: subSolarLatitude(body, date),
    lon: normalizeLon(subSolarLongitude(body, date)),
  };
}

/**
 * Unit vector from the planet's centre toward the Sun, in the globe's
 * body-fixed frame (lib/geo axis convention). Feed directly to the terminator
 * shader as the `sunDir` uniform: a surface point P is in daylight iff
 * dot(P̂, sunDir) > 0. The exact analogue of solar.ts sunDirection,
 * mars-time.ts marsSunDirection and lunar.ts moonSunDirection.
 */
export function planetSunDirection(
  body: PlanetName,
  date: Date
): [number, number, number] {
  const { lat, lon } = subSolarPoint(body, date);
  return latLonToVector3(lat, lon, 1);
}

// ─────────────────────────────── Seasons ───────────────────────────────────

export type Season =
  | "Northern Spring"
  | "Northern Summer"
  | "Northern Autumn"
  | "Northern Winter";

/**
 * Northern-hemisphere season label from the sub-solar latitude and whether it is
 * rising or falling (the same 0/90/180/270 quartering used for Earth/Mars).
 * Because the season phase is an adopted reference (see {@link subSolarLatitude}),
 * this labels the season *cycle position*, not a calendar-anchored season — the
 * HUD should say "modelled season" honestly.
 */
export function season(body: PlanetName, date: Date): Season {
  const lat = subSolarLatitude(body, date);
  // Compare with a slightly later time to get the sign of dδ/dt (rising/falling).
  const soon = new Date(date.getTime() + DAY_MS);
  const rising = subSolarLatitude(body, soon) >= lat;
  if (rising) return lat >= 0 ? "Northern Spring" : "Northern Winter";
  return lat >= 0 ? "Northern Summer" : "Northern Autumn";
}

// ─────────────────────── AU ↔ scene-unit conversion ─────────────────────────

/** Linear AU → scene units (honest 1:1-scaled distances; Neptune ends up far). */
export function auToSceneLinear(au: number, unitsPerAU = 1): number {
  return au * unitsPerAU;
}

/** Scene units → AU (inverse of {@link auToSceneLinear}). */
export function sceneToAULinear(units: number, unitsPerAU = 1): number {
  return units / unitsPerAU;
}

// ─────────────────────────────── Orrery ────────────────────────────────────

export type RadialScaleMode = "log" | "sqrt" | "linear";

export interface OrreryOptions {
  /**
   * How the radius is compressed. "log" (default) and "sqrt" squeeze Neptune's
   * 30 AU and Mercury's 0.39 AU into the same view; "linear" keeps true
   * proportional distances (honest but Neptune sits ~77× further than Mercury).
   */
  mode?: RadialScaleMode;
  /** scene radius assigned to `innerAU` (log/sqrt modes). Default 1. */
  minRadius?: number;
  /** scene radius assigned to `outerAU` (log/sqrt modes). Default 10. */
  maxRadius?: number;
  /** AU distance mapped to `minRadius`. Default 0.3 (just inside Mercury). */
  innerAU?: number;
  /** AU distance mapped to `maxRadius`. Default 31 (just outside Neptune). */
  outerAU?: number;
  /** scene units per AU for "linear" mode. Default 1. */
  unitsPerAU?: number;
}

export interface OrreryBody {
  name: PlanetName;
  /** scene X (ecliptic plane projection) */
  x: number;
  /** scene Z (ecliptic plane projection) */
  z: number;
  /** compressed scene radius from the Sun */
  sceneRadius: number;
  /** TRUE heliocentric distance [AU] — use this for honest labels */
  distanceAU: number;
  /** heliocentric ecliptic longitude [deg, 0–360) — the REAL angle */
  longitudeDeg: number;
}

export interface OrreryLayout {
  bodies: OrreryBody[];
  mode: RadialScaleMode;
  /**
   * Human-readable honesty string for the UI, e.g.
   * "Angular positions are real; radial distances log-compressed for visibility."
   */
  note: string;
}

/**
 * Compress a true heliocentric distance (AU) to a scene radius per the chosen
 * mode. log/sqrt map [innerAU, outerAU] onto [minRadius, maxRadius] so the whole
 * system is visible at once; linear is a straight AU × unitsPerAU scaling.
 */
export function compressRadius(au: number, opts: OrreryOptions = {}): number {
  const mode = opts.mode ?? "log";
  if (mode === "linear") {
    return auToSceneLinear(au, opts.unitsPerAU ?? 1);
  }
  const minRadius = opts.minRadius ?? 1;
  const maxRadius = opts.maxRadius ?? 10;
  const innerAU = opts.innerAU ?? 0.3;
  const outerAU = opts.outerAU ?? 31;
  const f = mode === "sqrt" ? Math.sqrt : Math.log;
  const t = (f(au) - f(innerAU)) / (f(outerAU) - f(innerAU));
  return minRadius + t * (maxRadius - minRadius);
}

/**
 * Positions for an orrery view. The ANGLE of every planet is its real
 * heliocentric ecliptic longitude at `date`; only the RADIUS is compressed (per
 * {@link compressRadius}) so all eight orbits are visible together. The true AU
 * distance is returned alongside so the frontend can label the scene honestly.
 *
 * Scene mapping follows the lib/geo convention (longitude 0 → +X, +90° → −Z), so
 * the orrery shares the globe's handedness:
 *   x =  sceneRadius · cos(λ)
 *   z = −sceneRadius · sin(λ)
 */
export function orreryLayout(
  date: Date,
  opts: OrreryOptions = {}
): OrreryLayout {
  const mode = opts.mode ?? "log";
  const bodies: OrreryBody[] = PLANET_ORDER.map((name) => {
    const pos = heliocentricPosition(name, date);
    const sceneRadius = compressRadius(pos.distanceAU, opts);
    const lam = pos.longitudeDeg * DEG2RAD;
    return {
      name,
      x: sceneRadius * Math.cos(lam),
      z: -sceneRadius * Math.sin(lam),
      sceneRadius,
      distanceAU: pos.distanceAU,
      longitudeDeg: pos.longitudeDeg,
    };
  });
  const note =
    mode === "linear"
      ? "Angular positions and radial distances are both to scale."
      : `Angular positions are real; radial distances ${mode}-compressed for visibility.`;
  return { bodies, mode, note };
}

// ─────────────────────────── HUD snapshot ──────────────────────────────────

export interface PlanetState {
  name: PlanetName;
  position: HeliocentricPosition;
  subsolar: { lat: number; lon: number };
  season: Season;
  /** length of the solar day in Earth days */
  solarDayEarthDays: number;
  /** sidereal orbital period in Earth years (Fact-Sheet value) */
  orbitalPeriodYears: number;
  retrograde: boolean;
}

/**
 * Everything a per-planet globe HUD needs in one pure call (mirrors marsClock /
 * moonState), so a component reads one snapshot per tick.
 */
export function planetState(body: PlanetName, date: Date): PlanetState {
  return {
    name: body,
    position: heliocentricPosition(body, date),
    subsolar: subSolarPoint(body, date),
    season: season(body, date),
    solarDayEarthDays: solarDayEarthDays(body),
    orbitalPeriodYears: PLANETS[body].physical.orbitalPeriodYears,
    retrograde: isRetrograde(body),
  };
}
