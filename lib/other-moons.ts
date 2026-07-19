/**
 * Apparent positions of the major moons of MARS, URANUS and NEPTUNE, the tilt /
 * opening of each planet's moon system as seen from Earth, and the observational
 * phenomena — transits, shadow transits, occultations and eclipses — against
 * each planet's oblate disk. This is the physics library for the combined
 * "Other Moons" tab of the digital twin, and it is the Mars/Uranus/Neptune twin
 * of lib/saturn-moons.ts (which is in turn the Saturn twin of lib/jupiter-moons.ts):
 * every public function is a pure, deterministic function of a JavaScript UTC
 * `Date`, so it unit-tests cleanly (lib/other-moons.test.ts) and the
 * react-three-fiber frontend can consume it directly. Nothing is invented; every
 * physical constant is sourced.
 *
 * ── Why this is ONE parameterized module ─────────────────────────────────────
 *
 *   Mars, Uranus and Neptune share the SAME geometry pipeline as Saturn's moons,
 *   just without rings and parameterized by planet:
 *
 *     1. propagate each moon in its own orbital plane (Kepler),
 *     2. rotate it into the moon's REFERENCE plane (see §Reference frames),
 *     3. rotate that into the J2000 Earth-equatorial frame, and
 *     4. project onto the plane of the sky from the planet's geocentric direction.
 *
 *   Each planet's axis is tilted differently, so the geometry is built in full
 *   3-D (never a 2-D edge-on shortcut). Because the close-in moons orbit in ~the
 *   planet's equatorial plane, they string out along a common tilted ellipse —
 *   a built-in validation (see lib/other-moons.test.ts), exactly as Saturn's
 *   moons trace the ring ellipse.
 *
 * ── Sources (physics-env-simulation skill: real physics, documented, or it
 *    doesn't ship — no invented numbers) ─────────────────────────────────────
 *
 *   • Moon orbital elements — a, e, i, sidereal period AND the epoch angles
 *     ω (arg. periapsis), Ω (ascending node), M (mean anomaly) plus the
 *     nodal/apsidal precession PERIODS: JPL Solar System Dynamics, "Planetary
 *     Satellite Mean Orbital Elements" (https://ssd.jpl.nasa.gov/sats/elem/).
 *     Mars uses ephemeris MAR099 (epoch 2000-01-01.5 TDB = J2000.0, Laplace
 *     plane). Uranus's five classical moons are the equatorial-frame elements at
 *     the same J2000 epoch. Neptune's Triton and Proteus are Laplace-plane
 *     elements at J2000; Nereid is the ECLIPTIC-frame element set at epoch
 *     2020-01-01.0 (NOT J2000) — a real, cited element set is propagated from its
 *     own epoch. These are REAL cited elements (see §Accuracy): each moon is
 *     propagated from its true epoch configuration at its real mean motion with a
 *     first-order secular precession of the node (regression) and apse (advance),
 *     so the live configuration is REAL (low-accuracy), not schematic.
 *
 *   • Planets' & Earth's heliocentric positions: reused from
 *     lib/planets.heliocentricPosition (JPL "Keplerian Elements for Approximate
 *     Positions of the Major Planets", Standish). Same source, same accuracy
 *     class, and the SAME light-time treatment as saturn-moons/jupiter-moons.
 *
 *   • IAU planet poles (J2000, WGCCRE 2015):
 *       Mars    α0 = 317.68143°, δ0 = 52.88650°  (rate < 0.11°/century — held
 *               constant for the modern era; the small drift is negligible here)
 *       Uranus  α0 = 257.311°,   δ0 = −15.175°   (near the ecliptic ⇒ the moon
 *               system appears strongly tilted; its opening changes with Uranus's
 *               ~84-yr season — equinox 2007, next ~2049 — surfaced as
 *               {@link PlanetGeocentric}.systemTiltDeg)
 *       Neptune α0 = 299.36° + 0.70°·sin N,  δ0 = 43.46° − 0.51°·cos N,
 *               N = 357.85° + 52.316°·T  (T = Julian centuries TT past J2000) —
 *               the WGCCRE precession term IS carried (cheap, cited).
 *
 *   • Planet physical constants (Req/Rpol): NASA/GSFC Planetary Fact Sheets
 *       Mars    Req 3396.19 km, Rpol 3376.20 km
 *       Uranus  Req 25559 km,   Rpol 24973 km
 *       Neptune Req 24764 km,   Rpol 24341 km
 *
 * ── Reference frames (get this right) ────────────────────────────────────────
 *
 *   • MARS (Phobos, Deimos): Laplace-plane elements. For these very close-in
 *     moons the local Laplace plane ≈ Mars's equatorial plane, so we orient them
 *     by the Mars IAU pole directly (the small Laplace-vs-equator difference is a
 *     documented, acceptable approximation). Node/periapsis are referred to the
 *     ascending node of Mars's equator on the J2000 Earth equator ({@link eqX}),
 *     exactly as saturn-moons references Saturn's equator.
 *
 *   • URANUS (Miranda, Ariel, Umbriel, Titania, Oberon): given in URANUS'S
 *     EQUATORIAL frame, so we orient them by the Uranus pole directly. Because
 *     the pole lies almost in the ecliptic (obliquity ~97.8°), the whole system
 *     appears strongly tilted and its opening swings with the ~84-yr Uranian
 *     season — {@link PlanetGeocentric}.systemTiltDeg exposes that per date (the
 *     analogue of Saturn's ring opening B).
 *
 *   • NEPTUNE (Triton, Proteus): Laplace-plane elements, oriented by the Neptune
 *     pole. Triton's Laplace plane is significantly tilted from Neptune's equator
 *     (Triton is massive and steeply inclined), so carrying its i = 157.3°
 *     straight into the equatorial frame is an approximation exactly like
 *     saturn-moons' Iapetus — Triton is FLAGGED least-accurate
 *     ({@link OTHER_MOONS}.Triton.leastAccurate). Triton is also RETROGRADE
 *     (i > 90°): its inclination alone reverses the apparent orbital sense — no
 *     special sign flip is needed, and no special flip is applied (§Retrograde).
 *
 *   • NEREID (Neptune): a special case. Its elements are ECLIPTIC-frame at a 2020
 *     epoch, and it is wildly eccentric (e = 0.751). We propagate it from its
 *     2020 epoch and place it DIRECTLY in the J2000 ecliptic (NO planet-pole
 *     rotation), then convert ecliptic → equatorial and project to sky. Flagged
 *     separately as the lowest-accuracy outer moon
 *     ({@link OTHER_MOONS}.Nereid.leastAccurate).
 *
 * ── Sign / axis conventions (READ THIS — the frontend must match) ────────────
 *
 *   All moon and shadow coordinates are in units of the PLANET's EQUATORIAL
 *   RADIUS (Req), measured from the planet's centre, in the plane of the sky.
 *   The sky basis is built from the planet's geocentric direction d̂
 *   (Earth→planet, J2000 equatorial) and the J2000 celestial north pole
 *   ẑ = (0,0,1):
 *
 *     • Z  — line of sight, positive toward EARTH (the near side): Ẑ = −d̂.
 *            `frontOfDisk` = (z > 0): the moon is in FRONT of the planet.
 *     • Y  — positive toward celestial NORTH: Ŷ = normalize(ẑ − (ẑ·Ẑ)Ẑ).
 *     • X  — positive toward celestial WEST: X̂ = Ŷ × Ẑ. (Right-handed with Z
 *            toward the observer, so with North up and looking outward, +X is to
 *            the right = WEST — the SAME X=west convention as saturn-moons.)
 *
 *   SHADOW coordinates (shadowX, shadowY) are the same kind of projection taken
 *   from the SUN's direction (planet→Sun basis): a moon whose shadow projects
 *   onto the disk on the sunward side casts a shadow transit; one on the
 *   anti-solar side projecting onto the disk is eclipsed (in the planet's umbra).
 *
 * ── Retrograde (Triton) ──────────────────────────────────────────────────────
 *
 *   Triton is handled by carrying its real inclination i = 157.3° straight into
 *   the standard element rotation. An inclination between 90° and 180° puts the
 *   orbital angular momentum SOUTH of the pole, so the projected motion is
 *   retrograde automatically — the apparent along-orbit sense is reversed versus
 *   the prograde Mars/Uranus/Proteus moons, with NO extra sign flip. The moon's
 *   `retrograde` flag records this for the UI.
 *
 * ── Phenomena geometry ──────────────────────────────────────────────────────
 *
 *   Each planet's disk is an OBLATE spheroid seen at sub-Earth latitude
 *   (systemTiltDeg), so its silhouette is an ellipse tilted at the pole's
 *   position angle P. {@link diskContains} rotates a sky point into the disk
 *   frame and tests it against the apparent semi-axes (equatorial = 1 Req; polar
 *   = √(sin²B + (Rpol/Req)²cos²B) Req):
 *
 *     • transit        — frontOfDisk AND inside the disk ellipse.
 *     • occultation    — behind AND inside the disk ellipse.
 *     • shadow_transit — moon on the SUNWARD side AND its shadow projects inside
 *                        the disk.
 *     • eclipse        — moon on the ANTI-SOLAR side AND its shadow projects
 *                        inside the disk (i.e. the moon is in the planet's umbra).
 *
 *   These planets have only faint/narrow rings; ring interactions are omitted.
 *
 * ── HONESTY: THIS IS A MOON-CONFIGURATION VIEW, NOT AN EVENTS PREDICTOR ───────
 *
 *   These disks are TINY as seen from Earth — Mars ~4–25″, Uranus ~3.4–3.7″,
 *   Neptune ~2.3″ — so moon transits/shadows across them are rare-to-unobservable
 *   from Earth. The phenomenon flags are exposed where the geometry produces them,
 *   but the real value of this layer is the GEOMETRY: Uranus's system tipped ~98°
 *   with its opening changing across the Uranian season, Triton's RETROGRADE
 *   orbit, and Phobos circling Mars in ~7.65 h (faster than Mars rotates). This
 *   API deliberately does NOT imply routine Earth-observable transits.
 *
 * ── HONESTY: ACCURACY BOUND ──────────────────────────────────────────────────
 *
 *   Kepler propagation of REAL JPL SSD mean elements: low-accuracy, carrying no
 *   short-period perturbations, good to a fraction of a planet radius near the
 *   epoch and degrading as you move decades away. NOT observing-grade event
 *   timing — cross-check JPL Horizons (an offline reference; this keyless library
 *   NEVER calls it). Least-accurate bodies, flagged explicitly:
 *     • Triton — its Laplace plane is tilted well off Neptune's equator, so
 *       carrying i straight into the equatorial frame is approximate.
 *     • Nereid — ecliptic frame + 2020 epoch + extreme eccentricity (e = 0.751).
 *
 * ── planetGeocentric ─────────────────────────────────────────────────────────
 *   The planet's apparent geocentric RA/Dec are produced by reusing
 *   lib/planets.heliocentricPosition for the planet and Earth, differencing them
 *   with a light-time correction, and rotating the J2000 ecliptic vector to the
 *   equator by the J2000 obliquity — mirroring saturn-moons. The frontend feeds
 *   that RA/Dec to lib/celestial.equatorialToHorizontal to check the planet's
 *   altitude, uses the angular diameter to size the disk, and uses
 *   `systemTiltDeg` (the sub-Earth latitude on the planet's equator) to draw how
 *   open the moon system is — most dramatic for Uranus.
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

/** Unix ms at the J2000 epoch = 2000-01-01.5 TDB (most moons' element epoch). */
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
/** Unix ms at 2020-01-01.0 — Nereid's element epoch (NOT J2000). */
const NEREID_EPOCH_UNIX_MS = Date.UTC(2020, 0, 1, 0, 0, 0);

/**
 * ΔT = TD − UTC, seconds. The Kepler propagation is a function of Dynamical Time
 * (TD); we fold in a constant ΔT ≈ 69 s for the modern era, the same honest
 * approximation used across lib/planets.ts, lib/lunar.ts and lib/saturn-moons.ts.
 * Negligible at these moon-system rates.
 */
const DELTA_T_SECONDS = 69.184;

/** Speed of light, AU per day (for the geocentric light-time iteration). */
const LIGHT_AU_PER_DAY = 173.1446;

/** Mean obliquity of the ecliptic at J2000.0 [deg] (ecliptic → equatorial). */
const OBLIQUITY_J2000_DEG = 23.4392911;

/** 1 AU in kilometres (IAU 2012 definition). */
const AU_KM = 149_597_870.7;
const ARCSEC_PER_RAD = 206_264.806_247_1;
/** Days in a Julian year (for precession-period → rate). */
const DAYS_PER_JULIAN_YEAR = 365.25;

// ─────────────────────────────── Planet identifiers ─────────────────────────

/** The three planets whose moon systems this module serves. */
export type OtherPlanet = "Mars" | "Uranus" | "Neptune";

/** Every moon served here, across the three planets. */
export type OtherMoon =
  | "Phobos"
  | "Deimos"
  | "Miranda"
  | "Ariel"
  | "Umbriel"
  | "Titania"
  | "Oberon"
  | "Triton"
  | "Proteus"
  | "Nereid";

/** Which reference plane a moon's elements are given in (see module header). */
export type MoonFrame = "planet-equator" | "ecliptic";

// ─────────────────────────────── Planet constants ──────────────────────────

/**
 * Per-planet physical & orientation constants. Moon coordinates X, Y, Z and the
 * shadow coordinates are in units of {@link OtherPlanetData.equatorialRadiusKm}.
 * The disk we test phenomena against is oblate (`polarRadiusRatio` < 1).
 */
export interface OtherPlanetData {
  name: OtherPlanet;
  /** equatorial radius Req [km] (NASA Fact Sheet). */
  equatorialRadiusKm: number;
  /** polar radius Rpol [km] (NASA Fact Sheet). */
  polarRadiusKm: number;
  /** geometric flattening f = 1 − Rpol/Req. */
  flattening: number;
  /** polar radius as a fraction of the equatorial radius (Rpol/Req). */
  polarRadiusRatio: number;
  /** J2000 IAU north-pole right ascension α0 [deg] (WGCCRE). */
  poleRaJ2000Deg: number;
  /** J2000 IAU north-pole declination δ0 [deg] (WGCCRE). */
  poleDecJ2000Deg: number;
  /**
   * true ⇒ apply the WGCCRE per-date precession term to the pole (Neptune only);
   * Mars & Uranus hold the J2000 pole constant (their rates are negligible over
   * the modern era, mirroring saturn-moons' treatment of Saturn's pole).
   */
  poleHasPrecessionTerm: boolean;
}

export const OTHER_PLANETS: Record<OtherPlanet, OtherPlanetData> = {
  Mars: {
    name: "Mars",
    equatorialRadiusKm: 3396.19,
    polarRadiusKm: 3376.2,
    flattening: 1 - 3376.2 / 3396.19,
    polarRadiusRatio: 3376.2 / 3396.19,
    poleRaJ2000Deg: 317.68143,
    poleDecJ2000Deg: 52.8865,
    poleHasPrecessionTerm: false,
  },
  Uranus: {
    name: "Uranus",
    equatorialRadiusKm: 25559,
    polarRadiusKm: 24973,
    flattening: 1 - 24973 / 25559,
    polarRadiusRatio: 24973 / 25559,
    poleRaJ2000Deg: 257.311,
    poleDecJ2000Deg: -15.175,
    poleHasPrecessionTerm: false,
  },
  Neptune: {
    name: "Neptune",
    equatorialRadiusKm: 24764,
    polarRadiusKm: 24341,
    flattening: 1 - 24341 / 24764,
    polarRadiusRatio: 24341 / 24764,
    poleRaJ2000Deg: 299.36,
    poleDecJ2000Deg: 43.46,
    poleHasPrecessionTerm: true,
  },
};

// ─────────────────────────────── Moon element table ────────────────────────

export interface OtherMoonData {
  name: OtherMoon;
  /** the planet this moon orbits. */
  planet: OtherPlanet;
  /** semi-major axis from the planet's centre [km] (JPL SSD mean elements). */
  semiMajorAxisKm: number;
  /** semi-major axis in planet equatorial radii — ≈ the max apparent elongation. */
  semiMajorAxisReq: number;
  /** orbital eccentricity [–] (JPL SSD). */
  eccentricity: number;
  /**
   * inclination to the moon's reference plane [deg] (JPL SSD). For Triton this is
   * 157.3° (> 90° ⇒ RETROGRADE). See §Reference frames / §Retrograde.
   */
  inclinationDeg: number;
  /** sidereal orbital period [days] (JPL SSD). */
  siderealPeriodDays: number;
  /** argument of periapsis ω at the element epoch [deg] (JPL SSD). */
  argPeriapsisDeg: number;
  /** longitude of ascending node Ω at the element epoch [deg] (JPL SSD). */
  nodeDeg: number;
  /** mean anomaly M at the element epoch [deg] (JPL SSD). */
  meanAnomalyEpochDeg: number;
  /**
   * nodal-precession PERIOD [years] (JPL SSD); the node REGRESSES at
   * −360/Pnode °/yr. 0 ⇒ undefined (i ≈ 0): no nodal term is applied.
   */
  nodePeriodYears: number;
  /**
   * apsidal-precession PERIOD [years] (JPL SSD); the apse ADVANCES at
   * +360/Papsis °/yr. 0 ⇒ degenerate (e ≈ 0): no apsidal term is applied.
   */
  apsisPeriodYears: number;
  /** Unix ms of the element epoch (J2000 for all but Nereid, which is 2020.0). */
  epochUnixMs: number;
  /** reference plane the elements are in (planet equator, or the ecliptic). */
  frame: MoonFrame;
  /** true ⇒ retrograde orbit (i > 90°); currently only Triton. */
  retrograde: boolean;
  /** true ⇒ flagged least-accurate here (Triton, Nereid) — see §Accuracy. */
  leastAccurate: boolean;
}

const MARS_REQ = OTHER_PLANETS.Mars.equatorialRadiusKm;
const URANUS_REQ = OTHER_PLANETS.Uranus.equatorialRadiusKm;
const NEPTUNE_REQ = OTHER_PLANETS.Neptune.equatorialRadiusKm;

/**
 * Per-moon REAL orbital elements from JPL Solar System Dynamics, "Planetary
 * Satellite Mean Orbital Elements" (https://ssd.jpl.nasa.gov/sats/elem/); see the
 * module header for the exact ephemeris/epoch/frame per planet. `semiMajorAxisReq`
 * is the same length in that planet's Req. The propagation ({@link moonVectorEq})
 * advances each moon from its true epoch mean longitude λ0 = M + ω + Ω at its real
 * mean motion, with a first-order secular node regression / apse advance, so dates
 * away from the epoch stay right. This is a real low-accuracy ephemeris, not a
 * schematic phase: rate, plane, size, shape AND the along-orbit registration are
 * cited; only short-period perturbations are omitted.
 */
export const OTHER_MOONS: Record<OtherMoon, OtherMoonData> = {
  // ── Mars (MAR099, epoch J2000, Laplace plane ≈ Mars equator) ──
  Phobos: {
    name: "Phobos",
    planet: "Mars",
    semiMajorAxisKm: 9375,
    semiMajorAxisReq: 9375 / MARS_REQ,
    eccentricity: 0.015,
    inclinationDeg: 1.1,
    siderealPeriodDays: 0.3187, // ~7.65 h — faster than Mars rotates (24.6 h)
    argPeriapsisDeg: 216.3,
    nodeDeg: 169.2,
    meanAnomalyEpochDeg: 189.7,
    nodePeriodYears: 2.3,
    apsisPeriodYears: 1.1,
    epochUnixMs: J2000_UNIX_MS,
    frame: "planet-equator",
    retrograde: false,
    leastAccurate: false,
  },
  Deimos: {
    name: "Deimos",
    planet: "Mars",
    semiMajorAxisKm: 23457,
    semiMajorAxisReq: 23457 / MARS_REQ,
    eccentricity: 0.0,
    inclinationDeg: 1.8,
    siderealPeriodDays: 1.2625,
    argPeriapsisDeg: 0.0,
    nodeDeg: 54.3,
    meanAnomalyEpochDeg: 205.0,
    nodePeriodYears: 56.2,
    apsisPeriodYears: 0, // e ≈ 0 ⇒ apse degenerate, skipped
    epochUnixMs: J2000_UNIX_MS,
    frame: "planet-equator",
    retrograde: false,
    leastAccurate: false,
  },

  // ── Uranus (epoch J2000, Uranus's equatorial frame) ──
  Miranda: {
    name: "Miranda",
    planet: "Uranus",
    semiMajorAxisKm: 129846,
    semiMajorAxisReq: 129846 / URANUS_REQ,
    eccentricity: 0.001,
    inclinationDeg: 4.4,
    siderealPeriodDays: 1.413479,
    argPeriapsisDeg: 154.8,
    nodeDeg: 100.9,
    meanAnomalyEpochDeg: 73.0,
    nodePeriodYears: 17.787,
    apsisPeriodYears: 8.939,
    epochUnixMs: J2000_UNIX_MS,
    frame: "planet-equator",
    retrograde: false,
    leastAccurate: false,
  },
  Ariel: {
    name: "Ariel",
    planet: "Uranus",
    semiMajorAxisKm: 190929,
    semiMajorAxisReq: 190929 / URANUS_REQ,
    eccentricity: 0.001,
    inclinationDeg: 0.0,
    siderealPeriodDays: 2.520379,
    argPeriapsisDeg: 9.6,
    nodeDeg: 0.0,
    meanAnomalyEpochDeg: 193.5,
    nodePeriodYears: 0, // i ≈ 0 ⇒ node undefined, no nodal precession
    apsisPeriodYears: 28.901,
    epochUnixMs: J2000_UNIX_MS,
    frame: "planet-equator",
    retrograde: false,
    leastAccurate: false,
  },
  Umbriel: {
    name: "Umbriel",
    planet: "Uranus",
    semiMajorAxisKm: 265986,
    semiMajorAxisReq: 265986 / URANUS_REQ,
    eccentricity: 0.004,
    inclinationDeg: 0.1,
    siderealPeriodDays: 4.144177,
    argPeriapsisDeg: 183.4,
    nodeDeg: 174.8,
    meanAnomalyEpochDeg: 253.0,
    nodePeriodYears: 129.745,
    apsisPeriodYears: 64.126,
    epochUnixMs: J2000_UNIX_MS,
    frame: "planet-equator",
    retrograde: false,
    leastAccurate: false,
  },
  Titania: {
    name: "Titania",
    planet: "Uranus",
    semiMajorAxisKm: 436298,
    semiMajorAxisReq: 436298 / URANUS_REQ,
    eccentricity: 0.002,
    inclinationDeg: 0.1,
    siderealPeriodDays: 8.705869,
    argPeriapsisDeg: 184.0,
    nodeDeg: 29.5,
    meanAnomalyEpochDeg: 68.1,
    nodePeriodYears: 1644.649,
    apsisPeriodYears: 579.928,
    epochUnixMs: J2000_UNIX_MS,
    frame: "planet-equator",
    retrograde: false,
    leastAccurate: false,
  },
  Oberon: {
    name: "Oberon",
    planet: "Uranus",
    semiMajorAxisKm: 583511,
    semiMajorAxisReq: 583511 / URANUS_REQ,
    eccentricity: 0.002,
    inclinationDeg: 0.1,
    siderealPeriodDays: 13.463237,
    argPeriapsisDeg: 132.2,
    nodeDeg: 76.8,
    meanAnomalyEpochDeg: 143.6,
    nodePeriodYears: 192.798,
    apsisPeriodYears: 158.604,
    epochUnixMs: J2000_UNIX_MS,
    frame: "planet-equator",
    retrograde: false,
    leastAccurate: false,
  },

  // ── Neptune ──
  Triton: {
    name: "Triton",
    planet: "Neptune",
    semiMajorAxisKm: 354800,
    semiMajorAxisReq: 354800 / NEPTUNE_REQ,
    eccentricity: 0.0,
    // i = 157.3° ⇒ RETROGRADE. Triton's Laplace plane is tilted well off
    // Neptune's equator, so carrying this straight into the equatorial frame is
    // approximate → least-accurate (like saturn-moons' Iapetus).
    inclinationDeg: 157.3,
    siderealPeriodDays: 5.876994,
    argPeriapsisDeg: 0.0,
    nodeDeg: 178.1,
    meanAnomalyEpochDeg: 63.0,
    nodePeriodYears: 340.379,
    apsisPeriodYears: 0, // e ≈ 0 ⇒ apse degenerate, skipped
    epochUnixMs: J2000_UNIX_MS,
    frame: "planet-equator",
    retrograde: true,
    leastAccurate: true,
  },
  Proteus: {
    name: "Proteus",
    planet: "Neptune",
    semiMajorAxisKm: 117600,
    semiMajorAxisReq: 117600 / NEPTUNE_REQ,
    eccentricity: 0.0,
    inclinationDeg: 0.0,
    siderealPeriodDays: 1.122315,
    argPeriapsisDeg: 0.0,
    nodeDeg: 0.0,
    meanAnomalyEpochDeg: 276.8,
    nodePeriodYears: 0, // i ≈ 0 ⇒ no nodal precession
    apsisPeriodYears: 0, // e ≈ 0 ⇒ no apsidal precession
    epochUnixMs: J2000_UNIX_MS,
    frame: "planet-equator",
    retrograde: false,
    leastAccurate: false,
  },
  Nereid: {
    name: "Nereid",
    planet: "Neptune",
    semiMajorAxisKm: 5513900,
    semiMajorAxisReq: 5513900 / NEPTUNE_REQ,
    // Wildly eccentric — and ECLIPTIC-frame at a 2020 epoch (see §Reference
    // frames): the lowest-accuracy outer moon here.
    eccentricity: 0.751,
    inclinationDeg: 5.1,
    siderealPeriodDays: 360.133039,
    argPeriapsisDeg: 296.8,
    nodeDeg: 319.5,
    meanAnomalyEpochDeg: 318.5,
    nodePeriodYears: 9426.334,
    apsisPeriodYears: 7990.433,
    epochUnixMs: NEREID_EPOCH_UNIX_MS,
    frame: "ecliptic",
    retrograde: false,
    leastAccurate: true,
  },
};

/** The moons of each planet, in orbital order (innermost → outermost). */
export const MOONS_BY_PLANET: Record<OtherPlanet, readonly OtherMoon[]> = {
  Mars: ["Phobos", "Deimos"],
  Uranus: ["Miranda", "Ariel", "Umbriel", "Titania", "Oberon"],
  Neptune: ["Triton", "Proteus", "Nereid"],
} as const;

// ───────────────────────────── null-safety guards ──────────────────────────
// Contract (mirrors lib/celestial.ts & lib/saturn-moons.ts): a bad Date yields
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

/** Julian centuries of TT since J2000.0 (for the Neptune pole precession term). */
function julianCenturiesTT(date: Date): number {
  return (julianEphemerisDate(date) - J2000_JD) / JULIAN_CENTURY_DAYS;
}

/** Earth days of TT elapsed since a moon's element epoch (its mean-motion clock). */
function daysSinceEpochTT(date: Date, epochUnixMs: number): number {
  return (date.getTime() + DELTA_T_SECONDS * 1000 - epochUnixMs) / DAY_MS;
}

// ───────────────────────────── Kepler's equation ───────────────────────────

/**
 * Solve Kepler's equation M = E − e·sinE for the eccentric anomaly E (radians)
 * by Newton–Raphson. Most moons here are low-e; the high-e fallback start makes
 * it robust for Nereid (e = 0.751). Mirrors lib/planets.solveKepler.
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

/**
 * Secular precession rate [deg/day] from a precession PERIOD in years, with the
 * given sign (−1 = nodal REGRESSION, +1 = apsidal ADVANCE — the standard
 * J2-driven directions for prograde moons). Degenerate periods contribute NO
 * precession: 0 (undefined node where i ≈ 0, or degenerate apse where e ≈ 0) or
 * an implausibly short one (< 0.1 yr). All are physically negligible, so
 * skipping them is honest. (For retrograde Triton the sign of the SLOW node
 * drift is uncertain here; it is second-order and Triton is already flagged
 * least-accurate — see §Accuracy.)
 */
function precessionRateDegPerDay(periodYears: number, sign: number): number {
  if (!Number.isFinite(periodYears) || periodYears < 0.1) return 0;
  return (sign * 360) / (periodYears * DAYS_PER_JULIAN_YEAR);
}

// ─────────────────── Shared planet / sky / sun geometry per instant ─────────

/** The planet's geocentric direction, pole triad, and the sky/sun bases. */
interface PlanetGeometry {
  planet: OtherPlanet;
  data: OtherPlanetData;
  /** Earth–planet distance Δ [AU]. */
  distanceAU: number;
  /** apparent geocentric right ascension [deg, 0–360). */
  raDeg: number;
  /** apparent geocentric declination [deg]. */
  decDeg: number;
  /** sub-Earth latitude on the planet's equator [deg] — "how open" the system is. */
  systemTiltDeg: number;
  /** geocentric position angle of the planet's north pole P [deg, 0–360). */
  positionAngleDeg: number;

  // Internal frame vectors (J2000 equatorial), used to project the moons.
  /** planet north-pole unit vector. */
  pole: Vec3;
  /** planet-equatorial reference X (ascending node on the Earth equator). */
  eqX: Vec3;
  /** planet-equatorial Y (= pole × eqX). */
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
  /** planet→Sun unit vector (sun-frame toward-source axis). */
  sunZ: Vec3;
  /** sin(sub-Earth lat) and sin(sub-Sun lat), for the disk foreshortening. */
  sinB: number;
  sinBSun: number;
  /** projected-pole position angle in the sun frame [rad] (for disk tests). */
  poleSunPA: number;
}

/**
 * The planet's IAU north-pole (RA, Dec) at `date`, in degrees. Mars & Uranus are
 * held at their J2000 values (rates negligible over the era); Neptune carries the
 * WGCCRE precession term α0 += 0.70·sin N, δ0 −= 0.51·cos N,
 * N = 357.85° + 52.316°·T (T = Julian centuries TT past J2000).
 */
function poleRaDecDeg(planet: OtherPlanet, date: Date): [number, number] {
  const p = OTHER_PLANETS[planet];
  if (!p.poleHasPrecessionTerm) return [p.poleRaJ2000Deg, p.poleDecJ2000Deg];
  const T = julianCenturiesTT(date);
  const N = (357.85 + 52.316 * T) * DEG2RAD;
  return [
    p.poleRaJ2000Deg + 0.7 * Math.sin(N),
    p.poleDecJ2000Deg - 0.51 * Math.cos(N),
  ];
}

/**
 * Compute the planet's geocentric direction (with a light-time iteration, exactly
 * as saturn-moons' computeGeometry), and the orthonormal planet-equatorial / sky
 * / sun bases used to project the moons. Everything is in the J2000 frame.
 */
function computeGeometry(planet: OtherPlanet, date: Date): PlanetGeometry {
  const data = OTHER_PLANETS[planet];
  const earthHel = heliocentricPosition("Earth", date);
  const earth: Vec3 = [earthHel.x, earthHel.y, earthHel.z];

  // Geocentric planet (J2000 ecliptic), light-time corrected.
  let hel = heliocentricPosition(planet, date);
  let geo: Vec3 = [hel.x - earth[0], hel.y - earth[1], hel.z - earth[2]];
  let delta = Math.hypot(geo[0], geo[1], geo[2]);
  for (let i = 0; i < 2; i++) {
    const tau = delta / LIGHT_AU_PER_DAY;
    const retarded = new Date(date.getTime() - tau * DAY_MS);
    hel = heliocentricPosition(planet, retarded);
    geo = [hel.x - earth[0], hel.y - earth[1], hel.z - earth[2]];
    delta = Math.hypot(geo[0], geo[1], geo[2]);
  }

  // Heliocentric planet (geometric, un-retarded) for the planet→Sun direction.
  const helNow = heliocentricPosition(planet, date);
  const helHat = norml([helNow.x, helNow.y, helNow.z]);

  // Equatorial geometry: planet RA/Dec and the projection bases.
  const geoEq = eclipticToEquatorial(geo);
  const raDeg = norm360(Math.atan2(geoEq[1], geoEq[0]) * RAD2DEG);
  const decDeg = Math.asin(clamp(geoEq[2] / delta, -1, 1)) * RAD2DEG;

  // Planet pole (IAU) in J2000 equatorial coordinates.
  const [poleRa, poleDec] = poleRaDecDeg(planet, date);
  const a0 = poleRa * DEG2RAD;
  const d0 = poleDec * DEG2RAD;
  const pole: Vec3 = [
    Math.cos(d0) * Math.cos(a0),
    Math.cos(d0) * Math.sin(a0),
    Math.sin(d0),
  ];
  // Planet-equatorial reference axis = ascending node of the planet's equator on
  // the Earth equator (RA = α0 + 90°); eqY completes the right-handed triad with
  // the pole as +Z. This frame carries the moons' node/periapsis references.
  const eqX: Vec3 = [-Math.sin(a0), Math.cos(a0), 0];
  const eqY = cross(pole, eqX);

  // Sky basis from the planet's geocentric direction.
  const dHat = norml(geoEq); // Earth → planet
  const skyZ: Vec3 = [-dHat[0], -dHat[1], -dHat[2]]; // toward Earth (planet → Earth)
  const celestialNorth: Vec3 = [0, 0, 1];
  const skyY = perpUnit(celestialNorth, skyZ); // north
  const skyX = cross(skyY, skyZ); // west

  // Sun basis from the planet's direction to the Sun.
  const sunZ = eclipticToEquatorial([-helHat[0], -helHat[1], -helHat[2]]); // planet → Sun
  const sunY = perpUnit(celestialNorth, sunZ);
  const sunX = cross(sunY, sunZ);

  // Sub-Earth / sub-Sun latitude sines (pole projected onto each source axis).
  const sinB = dot(skyZ, pole); // sin(sub-Earth latitude) = system opening toward us
  const sinBSun = dot(sunZ, pole); // sin(sub-Sun latitude)

  // Projected-pole position angle in each frame (from N through E/W).
  const poleEarthPA = Math.atan2(-dot(pole, skyX), dot(pole, skyY));
  const poleSunPA = Math.atan2(-dot(pole, sunX), dot(pole, sunY));

  return {
    planet,
    data,
    distanceAU: delta,
    raDeg,
    decDeg,
    systemTiltDeg: Math.asin(clamp(sinB, -1, 1)) * RAD2DEG,
    positionAngleDeg: norm360(poleEarthPA * RAD2DEG),
    pole,
    eqX,
    eqY,
    skyX,
    skyY,
    skyZ,
    sunX,
    sunY,
    sunZ,
    sinB,
    sinBSun,
    poleSunPA,
  };
}

// ─────────────────────────── Disk test geometry ────────────────────────────

/**
 * Apparent polar semi-diameter of the planet's oblate disk in Req units, seen at
 * sub-source latitude with sine `sinLat`: √(sin²lat + (Rpol/Req)²·cos²lat). It is
 * 1 pole-on (we see the equatorial circle) and Rpol/Req edge-on.
 */
function apparentPolarRatio(sinLat: number, ratio: number): number {
  const s2 = sinLat * sinLat;
  const c2 = 1 - s2;
  return Math.sqrt(s2 + ratio * ratio * c2);
}

/**
 * Is a projected sky point (x,y in Req, +X west, +Y north) inside the planet's
 * apparent disk? The disk is an ellipse tilted at position angle `polePA` (rad):
 * equatorial apparent semi-axis 1, polar apparent semi-axis `polarRatio`. We
 * rotate the point into the disk frame and test the ellipse. (Identical in form
 * to saturn-moons.diskContains.)
 */
export function diskContains(
  x: number,
  y: number,
  polePA: number,
  polarRatio: number
): boolean {
  const sp = Math.sin(polePA);
  const cp = Math.cos(polePA);
  const minor = x * -sp + y * cp; // along the projected pole (foreshortened)
  const major = x * -cp + y * -sp; // along the apparent equator
  const d = Math.sqrt(major * major + (minor / polarRatio) * (minor / polarRatio));
  return d < 1;
}

// ─────────────────────────── Satellite apparent positions ──────────────────

/** Apparent position + phenomenon flags for one moon at one instant. */
export interface OtherMoonPosition {
  moon: OtherMoon;
  planet: OtherPlanet;
  /** apparent X [planet equatorial radii], positive toward the WEST. */
  x: number;
  /** apparent Y [planet equatorial radii], positive toward the NORTH. */
  y: number;
  /** line-of-sight Z [planet equatorial radii], positive toward Earth (near). */
  z: number;
  /** true ⇒ moon is on the near side (in front of the planet). */
  frontOfDisk: boolean;
  /** shadow X [planet equatorial radii], projected from the Sun, +WEST. */
  shadowX: number;
  /** shadow Y [planet equatorial radii], projected from the Sun, +NORTH. */
  shadowY: number;
  /** true ⇒ moon crosses the near face of the planet's disk. */
  inTransit: boolean;
  /** true ⇒ moon is hidden behind the planet's disk. */
  inOccultation: boolean;
  /** true ⇒ moon's shadow falls on the sunlit disk we see. */
  inShadowTransit: boolean;
  /** true ⇒ moon is inside the planet's umbra (geometrically eclipsed). */
  inEclipse: boolean;
  /** true ⇒ this moon orbits retrograde (Triton) — apparent sense reversed. */
  retrograde: boolean;
}

/**
 * The moon's position vector in the J2000 EQUATORIAL frame (in planet Req) at
 * `date`, before plane-of-sky projection. Kepler-propagate in the orbital plane,
 * rotate by ω, i, Ω into the moon's REFERENCE plane, then into J2000 equatorial:
 *   • frame "planet-equator": rotate by the planet's pole triad (eqX, eqY, pole).
 *   • frame "ecliptic" (Nereid): rotate the ecliptic vector by the obliquity.
 * Retrograde Triton needs no special handling — its i > 90° reverses the sense.
 */
function moonVectorEq(moon: OtherMoonData, g: PlanetGeometry, date: Date): Vec3 {
  const aReq = moon.semiMajorAxisReq;
  const e = moon.eccentricity;
  const inc = moon.inclinationDeg * DEG2RAD;
  const days = daysSinceEpochTT(date, moon.epochUnixMs);

  // Epoch mean longitude λ0 = M+ω+Ω and longitude of periapsis ϖ0 = ω+Ω,
  // propagated in mean longitude so the near-zero e/i moons stay robust.
  const lambda0 = moon.meanAnomalyEpochDeg + moon.argPeriapsisDeg + moon.nodeDeg;
  const varpi0 = moon.argPeriapsisDeg + moon.nodeDeg;
  const meanMotion = 360 / moon.siderealPeriodDays; // deg/day
  const nodeRate = precessionRateDegPerDay(moon.nodePeriodYears, -1); // regression
  const apsisRate = precessionRateDegPerDay(moon.apsisPeriodYears, +1); // advance

  const lambda = lambda0 + meanMotion * days; // mean longitude at date
  const varpi = varpi0 + apsisRate * days; // longitude of periapsis at date
  const node = (moon.nodeDeg + nodeRate * days) * DEG2RAD; // Ω at date
  const arg = varpi * DEG2RAD - node; // argument of periapsis ω(t) = ϖ(t) − Ω(t)
  const M = (lambda - varpi) * DEG2RAD; // mean anomaly M = λ − ϖ
  const E = solveKepler(M, e);

  // Position in the orbital plane (Req).
  const xo = aReq * (Math.cos(E) - e);
  const yo = aReq * Math.sqrt(1 - e * e) * Math.sin(E);

  // Rotate by ω (in-plane), i (tilt), Ω into the moon's reference plane.
  const cO = Math.cos(arg);
  const sO = Math.sin(arg);
  const cN = Math.cos(node);
  const sN = Math.sin(node);
  const cI = Math.cos(inc);
  const sI = Math.sin(inc);
  const mx = (cO * cN - sO * sN * cI) * xo + (-sO * cN - cO * sN * cI) * yo;
  const my = (cO * sN + sO * cN * cI) * xo + (-sO * sN + cO * cN * cI) * yo;
  const mz = sO * sI * xo + cO * sI * yo; // signed height above the reference plane

  if (moon.frame === "ecliptic") {
    // Nereid: (mx,my,mz) is a J2000 ECLIPTIC vector → rotate to equatorial. No
    // planet-pole rotation (its elements are ecliptic-referred).
    return eclipticToEquatorial([mx, my, mz]);
  }
  // planet-equator frame → J2000 equatorial via the planet's pole triad.
  return [
    mx * g.eqX[0] + my * g.eqY[0] + mz * g.pole[0],
    mx * g.eqX[1] + my * g.eqY[1] + mz * g.pole[1],
    mx * g.eqX[2] + my * g.eqY[2] + mz * g.pole[2],
  ];
}

/** Project one moon's J2000-equatorial vector into the public position record. */
function toPosition(moon: OtherMoonData, V: Vec3, g: PlanetGeometry): OtherMoonPosition {
  // Earth plane-of-sky projection.
  const x = dot(V, g.skyX); // west
  const y = dot(V, g.skyY); // north
  const z = dot(V, g.skyZ); // toward Earth
  const frontOfDisk = z > 0;

  // Sun plane-of-sky projection (for shadow transit / eclipse on the disk).
  const shadowX = dot(V, g.sunX);
  const shadowY = dot(V, g.sunY);
  const sunward = dot(V, g.sunZ) > 0; // moon on the sunward side of the planet

  // Disk tests: Earth disk foreshortened by sub-Earth lat, Sun "disk" by sub-Sun.
  const earthPolar = apparentPolarRatio(g.sinB, g.data.polarRadiusRatio);
  const sunPolar = apparentPolarRatio(g.sinBSun, g.data.polarRadiusRatio);
  const earthPA = g.positionAngleDeg * DEG2RAD;
  const onEarthDisk = diskContains(x, y, earthPA, earthPolar);
  const onSunDisk = diskContains(shadowX, shadowY, g.poleSunPA, sunPolar);

  return {
    moon: moon.name,
    planet: moon.planet,
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
    retrograde: moon.retrograde,
  };
}

/**
 * Apparent rectangular coordinates of a planet's moons relative to the planet's
 * centre at `date`, in planet equatorial radii, in the plane of the sky. Returns
 * the moons in orbital order, or null for an invalid date. See the module header
 * for the sign convention and the accuracy honesty blocks.
 */
export function otherMoonPositions(
  planet: OtherPlanet,
  date: Date
): OtherMoonPosition[] | null {
  if (!isValidDate(date)) return null;
  const g = computeGeometry(planet, date);
  return MOONS_BY_PLANET[planet].map((name) => {
    const data = OTHER_MOONS[name];
    return toPosition(data, moonVectorEq(data, g, date), g);
  });
}

/**
 * Apparent position of a single named moon at `date` (null on bad input, or if
 * `moon` does not belong to `planet`).
 */
export function otherMoonPosition(
  planet: OtherPlanet,
  moon: OtherMoon,
  date: Date
): OtherMoonPosition | null {
  if (!isValidDate(date)) return null;
  const data = OTHER_MOONS[moon];
  if (!data || data.planet !== planet) return null;
  const g = computeGeometry(planet, date);
  return toPosition(data, moonVectorEq(data, g, date), g);
}

// ─────────────────────────── Phenomenon snapshot ───────────────────────────

export type PhenomenonType =
  | "transit"
  | "shadow_transit"
  | "occultation"
  | "eclipse";

export interface OtherPhenomenon {
  planet: OtherPlanet;
  moon: OtherMoon;
  type: PhenomenonType;
  /** instant of the snapshot (UTC). */
  time: Date;
}

/**
 * The (moon, phenomenon) pairs active at `date` — a pure snapshot (no interval
 * scan). Returns null on an invalid date, [] when nothing is going on.
 *
 * HONESTY: these disks are tiny from Earth (Mars ~4–25″, Uranus ~3.7″, Neptune
 * ~2.3″), so this list is USUALLY EMPTY by design — that is the physics, not a
 * bug. A sub-minute event scanner is deliberately NOT provided: on this
 * mean-element layer it would over-promise (see the module header §Accuracy).
 */
export function currentOtherPhenomena(
  planet: OtherPlanet,
  date: Date
): OtherPhenomenon[] | null {
  const positions = otherMoonPositions(planet, date);
  if (positions === null) return null;
  const time = new Date(date.getTime());
  const out: OtherPhenomenon[] = [];
  for (const p of positions) {
    if (p.inTransit) out.push({ planet, moon: p.moon, type: "transit", time });
    if (p.inShadowTransit)
      out.push({ planet, moon: p.moon, type: "shadow_transit", time });
    if (p.inOccultation)
      out.push({ planet, moon: p.moon, type: "occultation", time });
    if (p.inEclipse) out.push({ planet, moon: p.moon, type: "eclipse", time });
  }
  return out;
}

// ───────────────────── planet geocentric RA/Dec + physical ──────────────────

export interface PlanetGeocentric {
  /** apparent geocentric right ascension [deg, 0–360). */
  raDeg: number;
  /** apparent geocentric declination [deg, −90…+90]. */
  decDeg: number;
  /** Earth–planet distance [AU]. */
  distanceAU: number;
  /** apparent EQUATORIAL angular diameter [arcsec] = 2·atan(Req/Δ). */
  angularDiameterArcsec: number;
  /**
   * sub-Earth latitude on the planet's equator [deg] — "how open" the moon
   * system is (the analogue of Saturn's ring opening B). Especially meaningful
   * for Uranus, whose ~98° tilt makes this swing across the 84-yr season.
   */
  systemTiltDeg: number;
}

/**
 * A planet's apparent geocentric equatorial coordinates, distance, apparent
 * equatorial diameter and current system tilt at `date`. Built by reusing
 * lib/planets.heliocentricPosition (planet − Earth, light-time corrected, rotated
 * to the equator), mirroring saturn-moons' saturnGeocentric. Returns null on bad
 * input. The frontend feeds {raDeg, decDeg} to lib/celestial.equatorialToHorizontal
 * to check the planet's altitude, uses angularDiameterArcsec to size the disk, and
 * uses systemTiltDeg to draw the moon-system opening.
 */
export function planetGeocentric(
  planet: OtherPlanet,
  date: Date
): PlanetGeocentric | null {
  if (!isValidDate(date)) return null;
  const g = computeGeometry(planet, date);
  const reqAU = OTHER_PLANETS[planet].equatorialRadiusKm / AU_KM;
  const angularDiameterArcsec =
    2 * Math.atan(reqAU / g.distanceAU) * ARCSEC_PER_RAD;
  return {
    raDeg: g.raDeg,
    decDeg: g.decDeg,
    distanceAU: g.distanceAU,
    angularDiameterArcsec,
    systemTiltDeg: g.systemTiltDeg,
  };
}

// ─────────────────────────────── HUD snapshot ──────────────────────────────

export interface OtherMoonsState {
  planet: PlanetGeocentric;
  positions: OtherMoonPosition[];
  current: OtherPhenomenon[];
}

/**
 * Everything the "Other Moons" HUD needs for one planet in one pure call (mirrors
 * saturnMoonsState): the planet's geocentric coordinates + system tilt, its
 * moons' apparent positions, and the phenomena in progress right now. Null on a
 * bad date.
 */
export function otherMoonsState(
  planet: OtherPlanet,
  date: Date
): OtherMoonsState | null {
  const planetGeo = planetGeocentric(planet, date);
  const positions = otherMoonPositions(planet, date);
  const current = currentOtherPhenomena(planet, date);
  if (!planetGeo || !positions || !current) return null;
  return { planet: planetGeo, positions, current };
}
