/**
 * Positions of Saturn's seven major moons (Mimas, Enceladus, Tethys, Dione,
 * Rhea, Titan, Iapetus), the tilt/opening of the ring system, and the
 * observational phenomena — transits, shadow transits, occultations, eclipses
 * and ring interactions — as seen from Earth. This is the physics library for
 * the "Saturn's Moons" tab of the digital twin, and it is the Saturn twin of
 * lib/jupiter-moons.ts: every public function is a pure, deterministic function
 * of a JavaScript UTC `Date`, so it unit-tests cleanly (lib/saturn-moons.test.ts)
 * and the react-three-fiber frontend can consume it directly. Nothing is
 * invented; every physical constant is sourced.
 *
 * ── Why this is NOT a copy of jupiter-moons ──────────────────────────────────
 *
 *   Saturn's moons are NOT the Galilean moons. There is no compact Meeus Ch.44
 *   style perturbation series for them, and — decisively — Saturn's axis is
 *   tilted ~26.7° to its orbit (vs Jupiter's ~3°), so the geometry is dominated
 *   by the ring/equator tilt. Where jupiter-moons.ts can get away with a nearly
 *   edge-on 2-D projection, Saturn's system MUST be built in full 3-D:
 *
 *     1. propagate each moon in its own orbital plane (Kepler),
 *     2. rotate it into Saturn's EQUATORIAL (Laplacian) frame,
 *     3. rotate that into the J2000 Earth-equatorial frame using Saturn's real
 *        pole direction, and
 *     4. project onto the plane of the sky from Saturn's geocentric direction.
 *
 *   Because the moons orbit in ~Saturn's equatorial plane, they string out along
 *   the SAME tilted ellipse as the rings — that is a built-in validation
 *   (see lib/saturn-moons.test.ts).
 *
 * ── Sources (physics-env-simulation skill: real physics, documented, or it
 *    doesn't ship — no invented numbers) ─────────────────────────────────────
 *
 *   • RING geometry (B, B', ΔU, P, ring axes): J. Meeus, *Astronomical
 *     Algorithms*, 2nd ed. (Willmann-Bell, 1998), **Chapter 45, "The Ring of
 *     Saturn"**. The ring-plane inclination i and node Ω, the 375.35″ major-axis
 *     constant, and the N / l' / b' correction terms are transcribed verbatim.
 *     Validated against Meeus's own worked example 45.a (1992-12-16 0h TD) in the
 *     test file: B ≈ +16.44°, B' ≈ +14.68°, P ≈ +6.74°, a ≈ 35.87″, b ≈ 10.15″.
 *     Cross-checked against the independent port github.com/soniakeys/meeus
 *     (v3/saturnring) exactly as the jupiter-moons author cross-checked Ch.44;
 *     our residual on 45.a is < 0.05° in every angle and < 0.03″ in each axis
 *     (reported honestly in the test file), the small cost of using JPL mean
 *     elements (below) instead of a full VSOP87 for Saturn's/Earth's positions.
 *
 *   • Saturn's & Earth's heliocentric positions: reused from
 *     lib/planets.heliocentricPosition (JPL "Keplerian Elements for Approximate
 *     Positions of the Major Planets", Standish). Same source, same accuracy
 *     class, and the SAME light-time treatment as jupiter-moons.ts's
 *     jupiterGeocentric.
 *
 *   • Saturn's pole (IAU 2009/2015, WGCCRE): J2000 right ascension
 *     α0 = 40.589°, declination δ0 = 83.537°. Treated as CONSTANT for the modern
 *     era; the published rate terms (−0.036°/century in α0, −0.004°/century in
 *     δ0) move the pole < 0.02° over 2000–2050, far below this layer's accuracy.
 *     As an internal check, the pole DERIVED from Meeus's ring i/Ω lands on
 *     (40.68°, 83.53°) — the same pole to ~0.1°.
 *
 *   • Moon orbital elements — a, e, i, sidereal period AND the epoch angles
 *     ω, Ω, M plus the nodal/apsidal precession periods: JPL Solar System
 *     Dynamics, "Planetary Satellite Mean Orbital Elements", ephemeris SAT441,
 *     epoch 2000-01-01.5 TDB (= J2000.0), referred to each moon's local Laplace
 *     plane (https://ssd.jpl.nasa.gov/sats/elem/). These are REAL cited elements:
 *     each moon is propagated from its true J2000 configuration at its real mean
 *     motion, with a first-order secular precession of the node (regression) and
 *     apse (advance) — the J2-and-Titan drift — so the live configuration and
 *     event times are REAL (low-accuracy; see §Accuracy), not schematic.
 *
 *   • Saturn physical constants (Req 60 268 km, Rpol 54 364 km, ring-edge radii):
 *     NASA/GSFC Saturn Fact Sheet + Cassini ring nomenclature.
 *
 * ── Sign / axis conventions (READ THIS — the frontend must match) ────────────
 *
 *   All moon and shadow coordinates are in units of Saturn's EQUATORIAL RADIUS
 *   (Req = 60 268 km), measured from Saturn's centre, in the plane of the sky.
 *   The sky basis is built from Saturn's geocentric direction d̂ (Earth→Saturn,
 *   J2000 equatorial) and the J2000 celestial north pole ẑ = (0,0,1):
 *
 *     • Z  — line of sight, positive toward EARTH (the near side): Ẑ = −d̂.
 *            `frontOfDisk` = (z > 0): the moon is in FRONT of Saturn.
 *     • Y  — positive toward celestial NORTH: Ŷ = normalize(ẑ − (ẑ·Ẑ)Ẑ).
 *     • X  — positive toward celestial WEST: X̂ = Ŷ × Ẑ. (Right-handed with Z
 *            toward the observer, so with North up and looking outward, +X is to
 *            the right = WEST — the SAME X=west convention as jupiter-moons.ts.)
 *
 *   Because the moons orbit in ~Saturn's equatorial plane, their (x, y) trace the
 *   projected ring ellipse: apparent major axis at position angle P+90°, minor
 *   axis (= projected pole) at position angle P, with minor/major = sin|B|.
 *
 *   SHADOW coordinates (shadowX, shadowY) are the same kind of projection but
 *   taken from the SUN's direction instead of Earth's (Saturn→Sun basis), so a
 *   moon whose shadow projects onto Saturn's disk casts a shadow transit, and one
 *   on the anti-solar side projecting onto the disk is eclipsed. Near a Saturn
 *   equinox (ring-plane crossing) B' ≈ 0 and shadows land near the ring/
 *   equatorial plane; away from it they are thrown far north or south.
 *
 * ── Phenomena geometry ──────────────────────────────────────────────────────
 *
 *   Saturn's disk is an OBLATE spheroid seen at sub-Earth latitude B, so its
 *   silhouette is an ellipse tilted at position angle P. diskContains() rotates a
 *   sky point into the disk frame and tests it against apparent semi-axes
 *   (equatorial = 1 Req; polar = √(sin²B + (Rpol/Req)²cos²B) Req):
 *
 *     • transit        — frontOfDisk AND inside the disk ellipse.
 *     • occultation    — behind AND inside the disk ellipse.
 *     • shadow_transit — moon on the SUNWARD side AND its shadow projects inside
 *                        the disk (foreshortened by B').
 *     • eclipse        — moon on the ANTI-SOLAR side AND its shadow projects
 *                        inside the disk (i.e. the moon is in Saturn's umbra).
 *
 *   Ring interactions (cheap, honest, clearly named — every major moon here
 *   orbits BEYOND the A ring, so these are line-of-sight / shadow effects):
 *     • frontOfRingPlane — the moon is on the Earth-facing side of Saturn's
 *                          equatorial (ring) plane, so where it crosses the ring
 *                          region it passes IN FRONT of the rings (else behind).
 *     • shadowOnRings    — the moon's anti-solar shadow ray meets the ring plane
 *                          inside the main-ring annulus (1.11–2.27 Req).
 *
 * ── HONESTY: SEASONALITY IS THE HEADLINE ─────────────────────────────────────
 *
 *   Disk transits and shadow transits of Saturn's moons are NOT a daily event
 *   like Jupiter's. They occur only in a SEASON around each Saturn equinox
 *   (ring-plane crossing, ~every 15 years), when the ring/equator opening |B| is
 *   near 0 and the moons (and their shadows) sweep across the disk instead of
 *   passing above or below it. The last equinox was 2025-05-06; the opening is
 *   growing again through the late 2020s. {@link saturnGeocentric} exposes
 *   `ringTiltB` precisely so the UI can state this regime plainly. This API
 *   deliberately does NOT imply Saturn has daily disk shadow transits.
 *
 * ── HONESTY: ACCURACY BOUND ──────────────────────────────────────────────────
 *
 *   Two independent limits:
 *
 *   (1) The ring geometry (B, B', P, axes, saturnGeocentric) is Meeus Ch.45 fed
 *       by JPL mean planetary elements — good to a few hundredths of a degree /
 *       arcsecond (see the 45.a residuals). This part IS quantitatively solid.
 *
 *   (2) The MOON positions are Kepler propagation of the REAL JPL SSD SAT441
 *       mean elements at the J2000 epoch (see {@link SATURN_MOONS}), advanced by
 *       each moon's real mean motion and a first-order SECULAR precession of the
 *       node (regression) and apse (advance) — the J2-and-Titan drift. So the
 *       live configuration and event times ARE real, just LOW-ACCURACY: mean
 *       elements carry no short-period perturbations, so positions are good to a
 *       fraction of a Saturn radius near the epoch and degrade as you move
 *       decades away from J2000. This is NOT observing-grade event timing —
 *       cross-check IMCCE PHESAT or JPL Horizons (offline references; this
 *       keyless library NEVER calls them). Iapetus is the least accurate: its
 *       orbit is large and its local Laplace plane is tilted ~half-way to the
 *       ecliptic, so carrying its Laplace-plane inclination straight into
 *       Saturn's equatorial frame is a documented approximation
 *       ({@link SATURN_MOONS}.Iapetus.laplacePlaneTilted).
 *
 * ── Coordinate convention for saturnGeocentric ───────────────────────────────
 *   Saturn's apparent geocentric RA/Dec are produced by reusing
 *   lib/planets.heliocentricPosition for Saturn and Earth, differencing them with
 *   a light-time correction, and rotating the J2000 ecliptic vector to the
 *   equator by the J2000 obliquity — mirroring jupiter-moons.ts's
 *   jupiterGeocentric. The frontend feeds that RA/Dec to
 *   lib/celestial.equatorialToHorizontal to check Saturn's altitude, and uses the
 *   angular diameter to size the disk and `ringTiltB` to draw the ring opening.
 */

import { heliocentricPosition } from "./planets";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const DAY_MS = 86_400_000;

/** Julian Date of the J2000.0 epoch (2000-01-01 12:00 TT). */
const J2000_JD = 2_451_545.0;
/** Julian Date of the Unix epoch, 1970-01-01T00:00:00Z. */
const UNIX_EPOCH_JD = 2_440_587.5;
/** Days in a Julian century. */
const JULIAN_CENTURY_DAYS = 36_525;
/** Unix ms at the J2000 epoch (for the moon-phase mean-motion clock). */
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

/**
 * ΔT = TD − UTC, seconds. Meeus Ch.45 and the moon propagation are functions of
 * Dynamical Time (TD); we fold in a constant ΔT ≈ 69 s for the modern era, the
 * same honest approximation used by lib/planets.ts, lib/lunar.ts and
 * lib/jupiter-moons.ts. Negligible at Saturn-system rates.
 */
const DELTA_T_SECONDS = 69.184;

/** Speed of light, AU per day (for the geocentric light-time iteration). */
const LIGHT_AU_PER_DAY = 173.1446;

/** Mean obliquity of the ecliptic at J2000.0 [deg] (ecliptic → equatorial). */
const OBLIQUITY_J2000_DEG = 23.4392911;

/** 1 AU in kilometres (IAU 2012 definition). */
const AU_KM = 149_597_870.7;
const ARCSEC_PER_RAD = 206_264.806_247_1;

// ─────────────────────────────── Saturn constants ──────────────────────────

/**
 * Saturn physical & orientation constants. Moon coordinates X, Y, Z and the
 * shadow coordinates are all in units of {@link SATURN.equatorialRadiusKm}. The
 * disk we test phenomena against is strongly OBLATE (flattening ≈ 0.098).
 */
export const SATURN = {
  /** equatorial radius Req [km] (NASA Saturn Fact Sheet). */
  equatorialRadiusKm: 60_268,
  /** polar radius Rpol [km] (NASA Saturn Fact Sheet). */
  polarRadiusKm: 54_364,
  /** geometric flattening f = 1 − Rpol/Req ≈ 0.0980. */
  flattening: 1 - 54_364 / 60_268,
  /** polar radius as a fraction of the equatorial radius (≈ 0.902). */
  polarRadiusRatio: 54_364 / 60_268,
  /**
   * Saturn's J2000 north-pole direction (IAU 2009/2015 WGCCRE), treated as
   * constant for the modern era (see module header).
   */
  poleRaJ2000Deg: 40.589,
  poleDecJ2000Deg: 83.537,
  /**
   * Main-ring annulus in Saturn equatorial radii: inner edge of the (faint) D
   * ring ~1.11 Req out to the outer edge of the bright A ring ~2.27 Req
   * (NASA/Cassini). Used for the honest ring-interaction flags. Every major moon
   * here orbits well BEYOND this (Mimas is the innermost at ~3.08 Req).
   */
  mainRingInnerReq: 1.11,
  mainRingOuterReq: 2.27,
} as const;

/**
 * Ring-plane (= Saturn equatorial plane) orientation referred to the J2000
 * ecliptic, from Meeus Ch.45. The published series is written for the mean
 * equinox OF DATE; but the T-rates are almost pure precession of the equinox, so
 * in the FIXED J2000 ecliptic frame — which is what lib/planets returns — the
 * physical plane barely moves and we hold i and Ω at their J2000 (T=0) values.
 * (Both λ and Ω then precess together, leaving λ−Ω, and therefore B, invariant.)
 */
const RING_INCLINATION_DEG = 28.075216; // Meeus 45: i = 28.075216 − 0.012998 T …
const RING_NODE_DEG = 169.508470; //        Ω = 169.508470 + 1.394681 T …
/** Meeus Ch.45 major-axis constant: apparent ring major axis a = 375.35″ / Δ. */
const RING_MAJOR_AXIS_ARCSEC_AU = 375.35;

// ─────────────────────────────── Moon identifiers ──────────────────────────

export type SaturnMoon =
  | "Mimas"
  | "Enceladus"
  | "Tethys"
  | "Dione"
  | "Rhea"
  | "Titan"
  | "Iapetus";

/** The seven major moons in orbital order (innermost → outermost). */
export const SATURN_MOON_ORDER: readonly SaturnMoon[] = [
  "Mimas",
  "Enceladus",
  "Tethys",
  "Dione",
  "Rhea",
  "Titan",
  "Iapetus",
] as const;

export interface SaturnMoonData {
  name: SaturnMoon;
  /** semi-major axis from Saturn's centre [km] (JPL SSD SAT441). */
  semiMajorAxisKm: number;
  /** semi-major axis in Saturn equatorial radii — ≈ the max apparent elongation. */
  semiMajorAxisReq: number;
  /** orbital eccentricity [–] (JPL SSD SAT441). */
  eccentricity: number;
  /**
   * inclination to the moon's local Laplace plane [deg] (JPL SSD SAT441). For the
   * inner six the Laplace plane ≈ Saturn's equatorial (ring) plane, so we carry
   * it straight into the equatorial frame; for Iapetus the Laplace plane is
   * itself tilted, which is what makes Iapetus the least-accurate moon here
   * (laplacePlaneTilted).
   */
  inclinationDeg: number;
  /** sidereal orbital period [days] (JPL SSD SAT441). */
  siderealPeriodDays: number;
  /** argument of periapsis ω at epoch J2000.0 [deg] (JPL SSD SAT441). */
  argPeriapsisDeg: number;
  /** longitude of ascending node Ω at epoch J2000.0 [deg] (JPL SSD SAT441). */
  nodeDeg: number;
  /** mean anomaly M at epoch J2000.0 [deg] (JPL SSD SAT441). */
  meanAnomalyEpochDeg: number;
  /**
   * nodal-precession PERIOD [years] (JPL SSD SAT441); the node REGRESSES at
   * −360/Pnode °/yr. 0 ⇒ undefined because i ≈ 0 (Enceladus, Dione): no nodal
   * term is applied (physically negligible there).
   */
  nodePeriodYears: number;
  /**
   * apsidal-precession PERIOD [years] (JPL SSD SAT441); the apse ADVANCES at
   * +360/Papsis °/yr. A value < 0.1 yr is degenerate because e ≈ 0 (Tethys): no
   * apsidal term is applied (physically negligible there).
   */
  apsisPeriodYears: number;
  /** true ⇒ this moon's local Laplace plane is tilted (Iapetus): lowest accuracy. */
  laplacePlaneTilted: boolean;
}

/**
 * Per-moon REAL orbital elements from JPL Solar System Dynamics, "Planetary
 * Satellite Mean Orbital Elements", ephemeris **SAT441**, epoch **2000-01-01.5
 * TDB (= J2000.0)**, referred to each moon's local Laplace plane
 * (https://ssd.jpl.nasa.gov/sats/elem/). `semiMajorAxisReq` is the same length in
 * Saturn radii (Req = 60 268 km).
 *
 * The propagation ({@link moonEquatorial}) advances each moon from its true J2000
 * mean longitude λ0 = M + ω + Ω at its real mean motion, and applies a
 * first-order SECULAR precession of the node (regression) and apse (advance) so
 * dates decades from J2000 stay right. This is a real low-accuracy ephemeris, not
 * a schematic phase (module header §Accuracy): rate, plane, size, shape AND the
 * along-orbit registration are all cited; only the short-period perturbations are
 * omitted. For the near-zero i moons (Enceladus, Dione) the node is undefined and
 * for the near-zero e moon (Tethys) the apse is degenerate, so those precession
 * terms are skipped — physically negligible. Iapetus is flagged least-accurate.
 */
export const SATURN_MOONS: Record<SaturnMoon, SaturnMoonData> = {
  Mimas: {
    name: "Mimas",
    semiMajorAxisKm: 186_000,
    semiMajorAxisReq: 186_000 / 60_268,
    eccentricity: 0.02,
    inclinationDeg: 1.6,
    siderealPeriodDays: 0.942422,
    argPeriapsisDeg: 160.4,
    nodeDeg: 66.2,
    meanAnomalyEpochDeg: 275.3,
    nodePeriodYears: 0.986,
    apsisPeriodYears: 0.493,
    laplacePlaneTilted: false,
  },
  Enceladus: {
    name: "Enceladus",
    semiMajorAxisKm: 238_400,
    semiMajorAxisReq: 238_400 / 60_268,
    eccentricity: 0.005,
    inclinationDeg: 0.0,
    siderealPeriodDays: 1.370218,
    argPeriapsisDeg: 119.5,
    nodeDeg: 0.0,
    meanAnomalyEpochDeg: 57.0,
    nodePeriodYears: 0, // i ≈ 0 ⇒ node undefined, no nodal precession
    apsisPeriodYears: 2.916,
    laplacePlaneTilted: false,
  },
  Tethys: {
    name: "Tethys",
    semiMajorAxisKm: 295_000,
    semiMajorAxisReq: 295_000 / 60_268,
    eccentricity: 0.001,
    inclinationDeg: 1.1,
    siderealPeriodDays: 1.887802,
    argPeriapsisDeg: 335.3,
    nodeDeg: 273.0,
    meanAnomalyEpochDeg: 0.0,
    nodePeriodYears: 4.982,
    apsisPeriodYears: 0.005, // e ≈ 0 ⇒ apse degenerate (< 0.1 yr), skipped
    laplacePlaneTilted: false,
  },
  Dione: {
    name: "Dione",
    semiMajorAxisKm: 377_700,
    semiMajorAxisReq: 377_700 / 60_268,
    eccentricity: 0.002,
    inclinationDeg: 0.0,
    siderealPeriodDays: 2.736916,
    argPeriapsisDeg: 116.0,
    nodeDeg: 0.0,
    meanAnomalyEpochDeg: 212.0,
    nodePeriodYears: 0, // i ≈ 0 ⇒ node undefined, no nodal precession
    apsisPeriodYears: 11.698,
    laplacePlaneTilted: false,
  },
  Rhea: {
    name: "Rhea",
    semiMajorAxisKm: 527_200,
    semiMajorAxisReq: 527_200 / 60_268,
    eccentricity: 0.001,
    inclinationDeg: 0.3,
    siderealPeriodDays: 4.517503,
    argPeriapsisDeg: 44.3,
    nodeDeg: 133.7,
    meanAnomalyEpochDeg: 31.5,
    nodePeriodYears: 35.775,
    apsisPeriodYears: 33.939,
    laplacePlaneTilted: false,
  },
  Titan: {
    name: "Titan",
    semiMajorAxisKm: 1_221_900,
    semiMajorAxisReq: 1_221_900 / 60_268,
    eccentricity: 0.029,
    inclinationDeg: 0.3,
    siderealPeriodDays: 15.945448,
    argPeriapsisDeg: 78.3,
    nodeDeg: 78.6,
    meanAnomalyEpochDeg: 11.7,
    nodePeriodYears: 687.37,
    apsisPeriodYears: 346.68,
    laplacePlaneTilted: false,
  },
  Iapetus: {
    name: "Iapetus",
    semiMajorAxisKm: 3_561_700,
    semiMajorAxisReq: 3_561_700 / 60_268,
    eccentricity: 0.028,
    // Inclination to Iapetus's LOCAL Laplace plane (~7.6°); that plane is itself
    // tilted ~half-way to the ecliptic, so carrying this straight into Saturn's
    // equatorial frame is an approximation → least-accurate moon (laplacePlaneTilted).
    inclinationDeg: 7.6,
    siderealPeriodDays: 79.331002,
    argPeriapsisDeg: 254.5,
    nodeDeg: 86.5,
    meanAnomalyEpochDeg: 74.8,
    nodePeriodYears: 3130.302,
    apsisPeriodYears: 1662.9,
    laplacePlaneTilted: true,
  },
};

// ───────────────────────────── null-safety guards ──────────────────────────
// Contract (mirrors lib/celestial.ts & lib/jupiter-moons.ts): a bad Date yields
// null (or [] for lists), never a throw — the renderer must survive bad input.

function isValidDate(date: unknown): date is Date {
  return date instanceof Date && Number.isFinite(date.getTime());
}

/** Normalize an angle to [0, 360). */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Clamp to [lo, hi]. */
function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

// ───────────────────────────── small vec3 helpers ──────────────────────────
// Local, allocation-cheap 3-vector maths in the J2000 EQUATORIAL frame.

type Vec3 = readonly [number, number, number];

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function norml(a: Vec3): Vec3 {
  const n = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / n, a[1] / n, a[2] / n];
}
/** Component of `v` perpendicular to unit vector `u`, normalized (for "north"). */
function perpUnit(v: Vec3, u: Vec3): Vec3 {
  const s = dot(v, u);
  return norml([v[0] - s * u[0], v[1] - s * u[1], v[2] - s * u[2]]);
}
/** Rotate a J2000 ecliptic vector to the J2000 equatorial frame (obliquity ε). */
function eclipticToEquatorial(v: Vec3): Vec3 {
  const eps = OBLIQUITY_J2000_DEG * DEG2RAD;
  const c = Math.cos(eps);
  const s = Math.sin(eps);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

// ─────────────────────────────── Time helpers ──────────────────────────────

/** Julian Date (UT) of a UTC instant (Unix epoch = JD 2440587.5). */
export function julianDate(date: Date): number {
  return date.getTime() / DAY_MS + UNIX_EPOCH_JD;
}

/** Julian Ephemeris Date (Dynamical Time) of a UTC instant — JD(UT) + ΔT. */
export function julianEphemerisDate(date: Date): number {
  return julianDate(date) + DELTA_T_SECONDS / 86_400;
}

/** Julian centuries of TT since J2000.0. */
function julianCenturiesTT(date: Date): number {
  return (julianEphemerisDate(date) - J2000_JD) / JULIAN_CENTURY_DAYS;
}

/** Earth days of TT elapsed since J2000.0 (the moon-phase mean-motion clock). */
function daysSinceJ2000TT(date: Date): number {
  return (date.getTime() + DELTA_T_SECONDS * 1000 - J2000_UNIX_MS) / DAY_MS;
}

// ───────────────────────────── Kepler's equation ───────────────────────────

/**
 * Solve Kepler's equation M = E − e·sinE for the eccentric anomaly E (radians)
 * by Newton–Raphson. Saturn's major moons are low-e (e ≤ 0.029), so this
 * converges in a couple of iterations; the high-e fallback start is kept for
 * robustness. Mirrors lib/planets.solveKepler.
 */
function solveKepler(M: number, e: number, tolerance = 1e-12): number {
  const Mr = Math.atan2(Math.sin(M), Math.cos(M));
  let E = e < 0.8 ? Mr : Math.PI;
  for (let i = 0; i < 100; i++) {
    const dE = (E - e * Math.sin(E) - Mr) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tolerance) break;
  }
  return E;
}

// ─────────────── Shared Saturn / ring / sky geometry for one instant ─────────

/** Saturn's geocentric direction, the ring geometry, and the sky/sun bases. */
interface SaturnGeometry {
  /** Earth–Saturn distance Δ [AU]. */
  distanceAU: number;
  /** Sun–Saturn distance r [AU]. */
  sunSaturnAU: number;
  /** apparent geocentric right ascension [deg, 0–360). */
  raDeg: number;
  /** apparent geocentric declination [deg]. */
  decDeg: number;
  /** Saturnicentric latitude of the EARTH B (ring opening toward us) [deg]. */
  ringTiltBDeg: number;
  /** Saturnicentric latitude of the SUN B' [deg]. */
  sunTiltBDeg: number;
  /** difference of Saturnicentric longitudes of Sun and Earth ΔU [deg]. */
  deltaUDeg: number;
  /** geocentric position angle of Saturn's north pole P [deg, 0–360). */
  positionAngleDeg: number;
  /** apparent ring outer-edge major axis a [arcsec]. */
  ringMajorAxisArcsec: number;
  /** apparent ring outer-edge minor axis b = a·sin|B| [arcsec]. */
  ringMinorAxisArcsec: number;

  // Internal frame vectors (J2000 equatorial), used to project the moons.
  /** Saturn north pole unit vector. */
  pole: Vec3;
  /** Saturn-equatorial reference X (ascending node on the Earth equator). */
  eqX: Vec3;
  /** Saturn-equatorial Y (= pole × eqX). */
  eqY: Vec3;
  /** sky WEST unit vector. */
  skyX: Vec3;
  /** sky NORTH unit vector. */
  skyY: Vec3;
  /** sky toward-EARTH unit vector. */
  skyZ: Vec3;
  /** sun-frame WEST unit vector. */
  sunX: Vec3;
  /** sun-frame NORTH unit vector. */
  sunY: Vec3;
  /** Saturn→Sun unit vector (sun-frame toward-source axis). */
  sunZ: Vec3;
  /** sin B (Earth) and sin B' (Sun), for the disk foreshortening. */
  sinB: number;
  sinBSun: number;
  /** projected-pole position angle in the sun frame [rad] (for disk tests). */
  poleSunPA: number;
}

/**
 * Compute Saturn's geocentric direction (with a light-time iteration, exactly as
 * jupiter-moons.ts's jupiterGeocentric), the Meeus Ch.45 ring geometry, and the
 * orthonormal Saturn-equatorial / sky / sun bases used to project the moons.
 * Everything is in the J2000 frame; see the module header for why holding the
 * ring i/Ω at their J2000 values is correct.
 */
function computeGeometry(date: Date): SaturnGeometry {
  const earthHel = heliocentricPosition("Earth", date);
  const earth: Vec3 = [earthHel.x, earthHel.y, earthHel.z];

  // Geocentric Saturn (J2000 ecliptic), light-time corrected.
  let satHel = heliocentricPosition("Saturn", date);
  let geo: Vec3 = [
    satHel.x - earth[0],
    satHel.y - earth[1],
    satHel.z - earth[2],
  ];
  let delta = Math.hypot(geo[0], geo[1], geo[2]);
  for (let i = 0; i < 2; i++) {
    const tau = delta / LIGHT_AU_PER_DAY;
    const retarded = new Date(date.getTime() - tau * DAY_MS);
    satHel = heliocentricPosition("Saturn", retarded);
    geo = [satHel.x - earth[0], satHel.y - earth[1], satHel.z - earth[2]];
    delta = Math.hypot(geo[0], geo[1], geo[2]);
  }

  // Geocentric ecliptic longitude λ and latitude β of Saturn.
  const lambda = Math.atan2(geo[1], geo[0]);
  const beta = Math.asin(clamp(geo[2] / delta, -1, 1));

  // Heliocentric Saturn (geometric — Meeus uses the un-retarded position here)
  // for B' and the Sun's saturnicentric longitude.
  const satHelNow = heliocentricPosition("Saturn", date);
  const rSun = satHelNow.distanceAU;
  const lHel = Math.atan2(satHelNow.y, satHelNow.x); // heliocentric longitude
  const bHel = Math.asin(clamp(satHelNow.z / rSun, -1, 1)); // heliocentric lat

  const iR = RING_INCLINATION_DEG * DEG2RAD;
  const nR = RING_NODE_DEG * DEG2RAD;
  const sinI = Math.sin(iR);
  const cosI = Math.cos(iR);

  // ── Meeus Ch.45: B (Earth), ring axes ──
  const B = Math.asin(
    clamp(sinI * Math.cos(beta) * Math.sin(lambda - nR) - cosI * Math.sin(beta), -1, 1)
  );
  const majorArcsec = RING_MAJOR_AXIS_ARCSEC_AU / delta;
  const minorArcsec = majorArcsec * Math.abs(Math.sin(B));

  // ── Meeus Ch.45: B' (Sun) with the N / l' / b' corrections ──
  const T = julianCenturiesTT(date);
  const N = (113.6655 + 0.8771 * T) * DEG2RAD;
  const lp = lHel - (0.01759 / rSun) * DEG2RAD;
  const bp = bHel - ((0.000764 * Math.cos(lHel - N)) / rSun) * DEG2RAD;
  const BSun = Math.asin(
    clamp(sinI * Math.cos(bp) * Math.sin(lp - nR) - cosI * Math.sin(bp), -1, 1)
  );

  // ── Meeus Ch.45: ΔU = |U(Sun) − U(Earth)| ──
  const U1 = Math.atan2(
    sinI * Math.sin(bp) + cosI * Math.cos(bp) * Math.sin(lp - nR),
    Math.cos(bp) * Math.cos(lp - nR)
  );
  const U2 = Math.atan2(
    sinI * Math.sin(beta) + cosI * Math.cos(beta) * Math.sin(lambda - nR),
    Math.cos(beta) * Math.cos(lambda - nR)
  );
  let dU = Math.abs((U1 - U2) * RAD2DEG);
  dU = norm360(dU);
  if (dU > 180) dU = 360 - dU;

  // ── Equatorial geometry: Saturn's RA/Dec and the projection bases ──
  const geoEq = eclipticToEquatorial(geo);
  const raDeg = norm360(Math.atan2(geoEq[1], geoEq[0]) * RAD2DEG);
  const decDeg = Math.asin(clamp(geoEq[2] / delta, -1, 1)) * RAD2DEG;

  // Saturn's pole (IAU) in J2000 equatorial coordinates.
  const a0 = SATURN.poleRaJ2000Deg * DEG2RAD;
  const d0 = SATURN.poleDecJ2000Deg * DEG2RAD;
  const pole: Vec3 = [
    Math.cos(d0) * Math.cos(a0),
    Math.cos(d0) * Math.sin(a0),
    Math.sin(d0),
  ];
  // Saturn-equatorial reference axis = ascending node of Saturn's equator on the
  // Earth equator (RA = α0 + 90°); eqY completes the right-handed triad with the
  // pole as +Z. (This frame carries the moons' node/periapsis references.)
  const eqX: Vec3 = [-Math.sin(a0), Math.cos(a0), 0];
  const eqY = cross(pole, eqX);

  // Sky basis from Saturn's geocentric direction.
  const dHat = norml(geoEq); // Earth → Saturn
  const skyZ: Vec3 = [-dHat[0], -dHat[1], -dHat[2]]; // toward Earth
  const celestialNorth: Vec3 = [0, 0, 1];
  const skyY = perpUnit(celestialNorth, skyZ); // north
  const skyX = cross(skyY, skyZ); // west

  // Sun basis from Saturn's direction to the Sun.
  const satHelHat = norml([satHelNow.x, satHelNow.y, satHelNow.z]);
  const sunZ = eclipticToEquatorial([
    -satHelHat[0],
    -satHelHat[1],
    -satHelHat[2],
  ]); // Saturn → Sun
  const sunY = perpUnit(celestialNorth, sunZ);
  const sunX = cross(sunY, sunZ);

  // Projected-pole position angle in each frame (from N through E).
  const poleEarthPA = Math.atan2(-dot(pole, skyX), dot(pole, skyY));
  const poleSunPA = Math.atan2(-dot(pole, sunX), dot(pole, sunY));

  return {
    distanceAU: delta,
    sunSaturnAU: rSun,
    raDeg,
    decDeg,
    ringTiltBDeg: B * RAD2DEG,
    sunTiltBDeg: BSun * RAD2DEG,
    deltaUDeg: dU,
    positionAngleDeg: norm360(poleEarthPA * RAD2DEG),
    ringMajorAxisArcsec: majorArcsec,
    ringMinorAxisArcsec: minorArcsec,
    pole,
    eqX,
    eqY,
    skyX,
    skyY,
    skyZ,
    sunX,
    sunY,
    sunZ,
    sinB: Math.sin(B),
    sinBSun: Math.sin(BSun),
    poleSunPA,
  };
}

// ───────────────────────────── Public ring geometry ────────────────────────

export interface SaturnRingGeometry {
  /** Saturnicentric latitude of the EARTH B [deg] — the ring opening toward us
   *  (positive ⇒ we see the NORTH face). Near 0 at a ring-plane crossing. */
  ringTiltBDeg: number;
  /** Saturnicentric latitude of the SUN B' [deg] — positive ⇒ north face lit. */
  sunTiltBDeg: number;
  /** difference of the Saturnicentric longitudes of Sun and Earth ΔU [deg]. */
  deltaUDeg: number;
  /** geocentric position angle of Saturn's north pole P [deg, 0–360). */
  positionAngleDeg: number;
  /** apparent ring outer-edge major axis a [arcsec]. */
  ringMajorAxisArcsec: number;
  /** apparent ring outer-edge minor axis b = a·sin|B| [arcsec]. */
  ringMinorAxisArcsec: number;
  /** ring-plane inclination i to the J2000 ecliptic [deg] (Meeus Ch.45). */
  inclinationDeg: number;
  /** ring-plane ascending node Ω on the J2000 ecliptic [deg] (Meeus Ch.45). */
  nodeDeg: number;
}

/**
 * The Meeus Chapter 45 "Ring of Saturn" quantities at `date`: B, B', ΔU, P and
 * the apparent ring axes. Validated against Meeus's worked example 45.a
 * (1992-12-16 0h TD) in the test file. Returns null on an invalid date.
 */
export function saturnRingGeometry(date: Date): SaturnRingGeometry | null {
  if (!isValidDate(date)) return null;
  const g = computeGeometry(date);
  return {
    ringTiltBDeg: g.ringTiltBDeg,
    sunTiltBDeg: g.sunTiltBDeg,
    deltaUDeg: g.deltaUDeg,
    positionAngleDeg: g.positionAngleDeg,
    ringMajorAxisArcsec: g.ringMajorAxisArcsec,
    ringMinorAxisArcsec: g.ringMinorAxisArcsec,
    inclinationDeg: RING_INCLINATION_DEG,
    nodeDeg: RING_NODE_DEG,
  };
}

// ─────────────────────────── Disk / ring test geometry ─────────────────────

/**
 * Apparent polar semi-diameter of Saturn's oblate disk in Req units, seen at
 * sub-source latitude with sine `sinLat`: √(sin²lat + (Rpol/Req)²·cos²lat). It
 * is 1 pole-on (|lat|=90°, we see the equatorial circle) and Rpol/Req edge-on.
 */
function apparentPolarRatio(sinLat: number): number {
  const s2 = sinLat * sinLat;
  const c2 = 1 - s2;
  const r = SATURN.polarRadiusRatio;
  return Math.sqrt(s2 + r * r * c2);
}

/**
 * Is a projected sky point (x,y in Req, +X west, +Y north) inside Saturn's
 * apparent disk? The disk is an ellipse tilted at position angle `polePA` (rad):
 * equatorial apparent semi-axis 1, polar apparent semi-axis `polarRatio`. We
 * rotate the point into the disk frame and test the ellipse.
 */
export function diskContains(
  x: number,
  y: number,
  polePA: number,
  polarRatio: number
): boolean {
  // Unit vectors (in the x=west, y=north plane) along the minor axis (= pole, at
  // PA) and the major axis (apparent equator, at PA+90°).
  const sp = Math.sin(polePA);
  const cp = Math.cos(polePA);
  const minor = x * -sp + y * cp; // along the projected pole (foreshortened)
  const major = x * -cp + y * -sp; // along the apparent equator
  const d = Math.sqrt(major * major + (minor / polarRatio) * (minor / polarRatio));
  return d < 1;
}

// ─────────────────────────── Satellite apparent positions ──────────────────

/** Apparent position + phenomenon flags for one Saturn moon at one instant. */
export interface SaturnMoonPosition {
  moon: SaturnMoon;
  /** apparent X [Saturn equatorial radii], positive toward the WEST. */
  x: number;
  /** apparent Y [Saturn equatorial radii], positive toward the NORTH. */
  y: number;
  /** line-of-sight Z [Saturn equatorial radii], positive toward Earth (near). */
  z: number;
  /** true ⇒ moon is on the near side (in front of Saturn). */
  frontOfDisk: boolean;
  /** shadow X [Saturn equatorial radii], projected from the Sun, +WEST. */
  shadowX: number;
  /** shadow Y [Saturn equatorial radii], projected from the Sun, +NORTH. */
  shadowY: number;
  /** true ⇒ moon crosses the near face of Saturn's disk. */
  inTransit: boolean;
  /** true ⇒ moon is hidden behind Saturn's disk. */
  inOccultation: boolean;
  /** true ⇒ moon's shadow falls on the sunlit disk we see. */
  inShadowTransit: boolean;
  /** true ⇒ moon is inside Saturn's umbra (geometrically eclipsed). */
  inEclipse: boolean;
  /** true ⇒ moon is on the Earth-facing side of the ring plane (in front of it). */
  frontOfRingPlane: boolean;
  /** true ⇒ the moon's anti-solar shadow ray meets the ring plane within the
   *  main-ring annulus (1.11–2.27 Req). */
  shadowOnRings: boolean;
}

/**
 * Secular precession rate [deg/day] from a precession PERIOD in years, with the
 * given sign (−1 = nodal REGRESSION, +1 = apsidal ADVANCE — the standard
 * J2-driven directions for these prograde moons). Degenerate periods contribute
 * NO precession: 0 (an undefined node where i ≈ 0 — Enceladus, Dione) or an
 * implausibly short one, < 0.1 yr (a degenerate apse where e ≈ 0 — Tethys). Both
 * are physically negligible, so skipping them is honest.
 */
function precessionRateDegPerDay(periodYears: number, sign: number): number {
  if (!Number.isFinite(periodYears) || periodYears < 0.1) return 0;
  return (sign * 360) / (periodYears * 365.25);
}

/** Saturn-equatorial position (Req) of one moon at `date`, before projection. */
function moonEquatorial(moon: SaturnMoon, date: Date): { m: Vec3 } {
  const d = SATURN_MOONS[moon];
  const aReq = d.semiMajorAxisReq;
  const e = d.eccentricity;
  const inc = d.inclinationDeg * DEG2RAD;
  const days = daysSinceJ2000TT(date);

  // Epoch (J2000) mean longitude and longitude of periapsis (Laplace-plane refs),
  // propagated in mean longitude so the near-zero e/i moons stay robust.
  const lambda0 = d.meanAnomalyEpochDeg + d.argPeriapsisDeg + d.nodeDeg; // λ0 = M+ω+Ω
  const varpi0 = d.argPeriapsisDeg + d.nodeDeg; // ϖ0 = ω+Ω
  const meanMotion = 360 / d.siderealPeriodDays; // deg/day
  const nodeRate = precessionRateDegPerDay(d.nodePeriodYears, -1); // regression
  const apsisRate = precessionRateDegPerDay(d.apsisPeriodYears, +1); // advance

  const lambda = lambda0 + meanMotion * days; // mean longitude at date
  const varpi = varpi0 + apsisRate * days; // longitude of periapsis at date
  const node = (d.nodeDeg + nodeRate * days) * DEG2RAD; // Ω at date
  const arg = varpi * DEG2RAD - node; // argument of periapsis ω(t) = ϖ(t) − Ω(t)
  const M = (lambda - varpi) * DEG2RAD; // mean anomaly M = λ − ϖ
  const E = solveKepler(M, e);

  // Position in the orbital plane (Req).
  const xo = aReq * (Math.cos(E) - e);
  const yo = aReq * Math.sqrt(1 - e * e) * Math.sin(E);

  // Rotate by ω (in-plane), inc (tilt), node into Saturn's equatorial frame.
  const cO = Math.cos(arg);
  const sO = Math.sin(arg);
  const cN = Math.cos(node);
  const sN = Math.sin(node);
  const cI = Math.cos(inc);
  const sI = Math.sin(inc);
  const mx = (cO * cN - sO * sN * cI) * xo + (-sO * cN - cO * sN * cI) * yo;
  const my = (cO * sN + sO * cN * cI) * xo + (-sO * sN + cO * cN * cI) * yo;
  const mz = sO * sI * xo + cO * sI * yo; // signed height above the ring plane
  return { m: [mx, my, mz] };
}

/** Project one moon's Saturn-equatorial vector into the public position record. */
function toPosition(
  moon: SaturnMoon,
  mEq: Vec3,
  g: SaturnGeometry
): SaturnMoonPosition {
  // Saturn-equatorial (Req) → J2000 equatorial vector.
  const V: Vec3 = [
    mEq[0] * g.eqX[0] + mEq[1] * g.eqY[0] + mEq[2] * g.pole[0],
    mEq[0] * g.eqX[1] + mEq[1] * g.eqY[1] + mEq[2] * g.pole[1],
    mEq[0] * g.eqX[2] + mEq[1] * g.eqY[2] + mEq[2] * g.pole[2],
  ];

  // Earth plane-of-sky projection.
  const x = dot(V, g.skyX); // west
  const y = dot(V, g.skyY); // north
  const z = dot(V, g.skyZ); // toward Earth
  const frontOfDisk = z > 0;

  // Sun plane-of-sky projection (for shadow transit / eclipse on the disk).
  const shadowX = dot(V, g.sunX);
  const shadowY = dot(V, g.sunY);
  const sunward = dot(V, g.sunZ) > 0; // moon on the sunward side of Saturn

  // Disk tests: Earth disk foreshortened by B, Sun "disk" by B'.
  const earthPolar = apparentPolarRatio(g.sinB);
  const sunPolar = apparentPolarRatio(g.sinBSun);
  const earthPA = g.positionAngleDeg * DEG2RAD;
  const onEarthDisk = diskContains(x, y, earthPA, earthPolar);
  const onSunDisk = diskContains(shadowX, shadowY, g.poleSunPA, sunPolar);

  // Ring interactions (Saturn-equatorial frame: rings are z=0, 1.11–2.27 Req).
  const frontOfRingPlane =
    Math.sign(mEq[2]) === Math.sign(g.sinB) && mEq[2] !== 0;

  // Anti-solar shadow ray from the moon meets the ring plane (z=0) where
  //   height  mEq.z − s·(sunZ·pole) = 0  ⇒  s = mEq.z / (sunZ·pole),  s > 0.
  let shadowOnRings = false;
  const sunZpole = dot(g.sunZ, g.pole); // = sin B'
  if (Math.abs(sunZpole) > 1e-6) {
    const s = mEq[2] / sunZpole;
    if (s > 0) {
      // shadow point in the ring plane, in Saturn-equatorial (eqX, eqY) coords:
      const sunEqX = dot(g.sunZ, g.eqX);
      const sunEqY = dot(g.sunZ, g.eqY);
      const px = mEq[0] - s * sunEqX;
      const py = mEq[1] - s * sunEqY;
      const rr = Math.hypot(px, py);
      shadowOnRings = rr >= SATURN.mainRingInnerReq && rr <= SATURN.mainRingOuterReq;
    }
  }

  return {
    moon,
    x,
    y,
    z,
    frontOfDisk,
    shadowX,
    shadowY,
    inTransit: frontOfDisk && onEarthDisk,
    inOccultation: !frontOfDisk && onEarthDisk,
    inShadowTransit: sunward && onSunDisk,
    inEclipse: !sunward && onSunDisk,
    frontOfRingPlane,
    shadowOnRings,
  };
}

/**
 * Apparent rectangular coordinates of the seven major moons relative to Saturn's
 * centre at `date`, in Saturn equatorial radii, in the plane of the sky. Returns
 * the moons in orbital order (Mimas → Iapetus), or null for an invalid date. See
 * the module header for the full sign convention and the accuracy/seasonality
 * honesty blocks.
 */
export function saturnMoonPositions(date: Date): SaturnMoonPosition[] | null {
  if (!isValidDate(date)) return null;
  const g = computeGeometry(date);
  return SATURN_MOON_ORDER.map((name) =>
    toPosition(name, moonEquatorial(name, date).m, g)
  );
}

/** Apparent position of a single named moon at `date` (null on bad input). */
export function saturnMoonPosition(
  moon: SaturnMoon,
  date: Date
): SaturnMoonPosition | null {
  if (!isValidDate(date)) return null;
  const g = computeGeometry(date);
  return toPosition(moon, moonEquatorial(moon, date).m, g);
}

// ─────────────────────────── Phenomenon snapshot ───────────────────────────

export type PhenomenonType =
  | "transit"
  | "shadow_transit"
  | "occultation"
  | "eclipse";

export interface SaturnPhenomenon {
  moon: SaturnMoon;
  type: PhenomenonType;
  /** instant of the snapshot (UTC). */
  time: Date;
}

/**
 * The (moon, phenomenon) pairs active at `date` — a pure snapshot (no interval
 * scan). Returns null on an invalid date, [] when nothing is going on.
 *
 * HONESTY: unlike Jupiter, these are SEASONAL. Away from a Saturn equinox
 * (|ringTiltB| large) the moons pass above/below the disk and their shadows miss
 * it, so this list is usually empty by design — that is the physics, not a bug.
 * A full ingress/mid/egress event scanner is deliberately NOT provided here: the
 * events are rare, and their sub-minute timing would over-promise on this
 * mean-element layer (see the module header §Accuracy).
 */
export function currentSaturnPhenomena(date: Date): SaturnPhenomenon[] | null {
  const positions = saturnMoonPositions(date);
  if (positions === null) return null;
  const out: SaturnPhenomenon[] = [];
  for (const p of positions) {
    if (p.inTransit) out.push({ moon: p.moon, type: "transit", time: new Date(date.getTime()) });
    if (p.inShadowTransit)
      out.push({ moon: p.moon, type: "shadow_transit", time: new Date(date.getTime()) });
    if (p.inOccultation)
      out.push({ moon: p.moon, type: "occultation", time: new Date(date.getTime()) });
    if (p.inEclipse) out.push({ moon: p.moon, type: "eclipse", time: new Date(date.getTime()) });
  }
  return out;
}

// ───────────────────── Saturn geocentric RA/Dec + physical ──────────────────

export interface SaturnGeocentric {
  /** apparent geocentric right ascension [deg, 0–360). */
  raDeg: number;
  /** apparent geocentric declination [deg, −90…+90]. */
  decDeg: number;
  /** Earth–Saturn distance [AU]. */
  distanceAU: number;
  /** apparent EQUATORIAL angular diameter [arcsec] = 2·atan(Req/Δ). */
  angularDiameterArcsec: number;
  /** current ring opening B [deg] — the SEASON indicator (see module header). */
  ringTiltB: number;
}

/**
 * Saturn's apparent geocentric equatorial coordinates, distance, apparent
 * equatorial diameter and current ring opening B at `date`. Built by reusing
 * lib/planets.heliocentricPosition (Saturn − Earth, light-time corrected, rotated
 * to the equator), mirroring jupiter-moons.ts's jupiterGeocentric. Returns null
 * on bad input.
 *
 * The frontend feeds {raDeg, decDeg} to lib/celestial.equatorialToHorizontal to
 * check Saturn's altitude, uses angularDiameterArcsec to size the disk, and uses
 * `ringTiltB` to draw the ring opening AND to state the seasonal transit regime.
 */
export function saturnGeocentric(date: Date): SaturnGeocentric | null {
  if (!isValidDate(date)) return null;
  const g = computeGeometry(date);
  const reqAU = SATURN.equatorialRadiusKm / AU_KM;
  const angularDiameterArcsec =
    2 * Math.atan(reqAU / g.distanceAU) * ARCSEC_PER_RAD;
  return {
    raDeg: g.raDeg,
    decDeg: g.decDeg,
    distanceAU: g.distanceAU,
    angularDiameterArcsec,
    ringTiltB: g.ringTiltBDeg,
  };
}

// ─────────────────────────────── HUD snapshot ──────────────────────────────

export interface SaturnMoonsState {
  saturn: SaturnGeocentric;
  ring: SaturnRingGeometry;
  positions: SaturnMoonPosition[];
  current: SaturnPhenomenon[];
}

/**
 * Everything the Saturn's-Moons HUD needs in one pure call (mirrors
 * jupiterMoonsState): Saturn's geocentric coordinates + ring opening, the Meeus
 * ring geometry, the seven moons' apparent positions, and the phenomena in
 * progress right now. Null on a bad date.
 */
export function saturnMoonsState(date: Date): SaturnMoonsState | null {
  const saturn = saturnGeocentric(date);
  const ring = saturnRingGeometry(date);
  const positions = saturnMoonPositions(date);
  const current = currentSaturnPhenomena(date);
  if (!saturn || !ring || !positions || !current) return null;
  return { saturn, ring, positions, current };
}
