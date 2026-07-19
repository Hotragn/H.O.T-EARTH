/**
 * Apparent CONFIGURATION of the moon systems of the dwarf planets PLUTO, ERIS,
 * HAUMEA and MAKEMAKE — the physics library for the combined "Dwarf Moons" tab of
 * the digital twin. It is the dwarf-planet sibling of lib/other-moons.ts (Mars /
 * Uranus / Neptune) and lib/saturn-moons.ts: every public function is a pure,
 * deterministic function of a JavaScript UTC `Date`, so it unit-tests cleanly
 * (lib/dwarf-moons.test.ts) and the react-three-fiber frontend consumes it
 * directly. Nothing is invented; every physical constant is sourced (below).
 *
 * ── READ THIS FIRST: this tab is HONEST ABOUT TWO DIFFERENT THINGS ───────────
 *
 *   (A) It is a moon-CONFIGURATION view, NEVER an observable-events tab. These
 *       systems are effectively UNRESOLVABLE from Earth — Pluto's disk is only
 *       ~0.1″ across (see {@link DwarfGeocentric}.angularDiameterArcsec), and the
 *       moons sit tens of that tiny disk-radius away. So the transit/occultation/
 *       shadow flags below are GEOMETRIC only; they are not routinely observable
 *       and this API never implies they are. (Pluto–Charon mutual events were
 *       observable in 1985–1990 when the orbit was edge-on; those are the one
 *       real, historical exception, and they fall straight out of the geometry.)
 *
 *   (B) The DATA QUALITY splits in TWO TIERS, and the API keeps the split
 *       explicit via `phaseReal` (per moon) / `hasRealEphemeris` (per system):
 *
 *         • PLUTO SYSTEM = REAL POSITIONS. Full cited mean elements (a, e, i, ω,
 *           Ω, M-at-epoch, period) give a real ALONG-ORBIT position for every
 *           moon. This is the precise centerpiece — New-Horizons-era. `phaseReal`
 *           = true, `hasRealEphemeris` = true.
 *
 *         • ERIS / HAUMEA / MAKEMAKE = REAL ORBIT, ILLUSTRATIVE PHASE. For each
 *           moon we have the real cited a, e, i and period, but NOT a full
 *           ephemeris (no cited node / argument-of-periapsis / mean-anomaly-at-
 *           epoch). So we compute the orbit's real SHAPE, SIZE and PERIOD and let
 *           the moon move at its REAL rate — but the absolute along-orbit PHASE
 *           and the NODE orientation are an ADOPTED CONVENTION (node = 0, phase =
 *           0 at J2000, inclination taken relative to the ecliptic), NOT a real
 *           ephemeris. These are flagged `phaseReal` = false so the UI labels them
 *           "orbit real, position illustrative". Makemake's moon is additionally
 *           POORLY CONSTRAINED (`orbitUncertain` = true). We do NOT present these
 *           as real positions.
 *
 *   NOTE the two tiers are about the MOONS. The PARENT bodies' heliocentric
 *   positions (hence their geocentric RA/Dec) are REAL and cited for all four,
 *   reused from lib/dwarf-planets.heliocentricPosition — see §Geocentric.
 *
 * ── Sources (physics-env-simulation skill: real physics, documented, or it
 *    doesn't ship — no invented numbers) ─────────────────────────────────────
 *
 *   • PLUTO system mean elements — JPL SSD "Planetary Satellite Mean Orbital
 *     Elements", BROZOVIĆ & JACOBSON (2024), AJ 167:256, epoch 2000-01-01.5 =
 *     J2000, in PLUTO'S EQUATORIAL FRAME. Pluto Rₑq = 1188.3 km; Charon radius
 *     606 km. Pluto IAU north pole (WGCCRE): RA 132.993°, Dec −6.163° (Pluto is a
 *     RETROGRADE rotator). Charon/Pluto mass ratio q = 0.1218 (same reference).
 *   • ERIS – moon Dysnomia: HOLLER et al. (2021). a = 37273 km, P = 15.785899 d,
 *     e = 0.0062, i = 78.29° (relative to Eris's heliocentric orbit). Circular,
 *     mutually tidally locked. Eris radius ~1163 km.
 *   • HAUMEA – moons Hiʻiaka & Namaka: RAGOZZINE & BROWN (2009). Hiʻiaka
 *     a = 49880 km, e = 0.0513, i = 126.356°, P = 49.462 d; Namaka a = 25657 km,
 *     e = 0.249, i = 113.013° (mutual inclination 13.41° from Hiʻiaka),
 *     P = 18.2783 d. Haumea has a RING at radius 2285 km (ORTIZ et al. 2017) and
 *     is triaxial (semi-axes ~1160 × 852 × 513 km), spinning in 3.9 h.
 *   • MAKEMAKE – moon S/2015 (136472) 1 ("MK2"): PARKER et al. (2016).
 *     a = 22250 (±780) km, P = 18.023 d, e ≈ 0. Orbit POORLY CONSTRAINED (seen
 *     edge-on, few detections). Makemake radius ~715 km.
 *   • PARENT heliocentric positions (Pluto, Eris, Haumea, Makemake) and Earth's:
 *     reused from lib/dwarf-planets.heliocentricPosition (JPL SBDB mean elements,
 *     J2000 ecliptic) and lib/planets.heliocentricPosition (Standish, Earth), with
 *     the SAME light-time treatment as saturn-moons / other-moons. Honest accuracy:
 *     SBDB mean elements, good to a few tenths of a degree over the modern era.
 *
 * ── THE PLUTO–CHARON BINARY (the headline fact) ──────────────────────────────
 *
 *   Pluto–Charon is a genuine BINARY, rendered here as one. Charon's a = 19600 km
 *   is the Pluto–Charon SEPARATION (their relative orbit), NOT a distance from a
 *   fixed centre. With mass ratio q = 0.1218 the barycenter sits a fraction
 *   f = q/(1+q) = 0.1086 of that separation from Pluto's centre, i.e.
 *   f·a ≈ 2128 km — which is OUTSIDE Pluto (radius 1188 km). So:
 *
 *     • We Kepler-propagate Charon's vector r_rel RELATIVE TO PLUTO, then express
 *       everything about the BARYCENTER: Pluto sits at −f·r_rel, Charon at
 *       (1−f)·r_rel. Their separation stays |r_rel| = a. The magnitude ratio is
 *       |Pluto offset| : |Charon offset| = f : (1−f) = q : 1.
 *     • The small moons (Styx, Nix, Kerberos, Hydra) orbit the BARYCENTER, so
 *       their Kepler positions are already barycentric.
 *     • Hence the "centre" of the plane-of-sky projection is the BARYCENTER, and
 *       PLUTO ITSELF is a moving body offset from it — exposed as
 *       {@link DwarfMoonPosition}.barycentricOffset so the UI can draw the wobble.
 *
 *   For Eris / Haumea / Makemake the moons are negligibly massive, so the
 *   barycenter ≈ the central body's centre and no wobble is modelled
 *   (`barycentricOffset` = null).
 *
 * ── Reference frames ─────────────────────────────────────────────────────────
 *
 *   • PLUTO moons: PLUTO'S EQUATORIAL frame, oriented by the Pluto IAU pole (the
 *     analogue of Uranus's pole in other-moons). The i = 0 moons (Charon, Styx,
 *     Nix) orbit in Pluto's equatorial plane. We propagate in mean longitude for
 *     robustness at near-zero e/i and apply the small node precession where it is
 *     cited (Kerberos P_node = 9 yr, Hydra P_node = 14 yr). Frame = "pluto-equator".
 *   • ERIS / HAUMEA / MAKEMAKE moons: the reference plane and node are NOT pinned
 *     in the cited data, so we adopt a documented convention — inclination taken
 *     relative to the J2000 ECLIPTIC, node = 0, phase = 0 at J2000 — and place the
 *     orbit directly in the ecliptic (then rotate ecliptic → equatorial and project
 *     to the sky, exactly as other-moons handles Nereid). The orbit's SIZE, SHAPE
 *     and PERIOD are real; the absolute orientation and phase are ILLUSTRATIVE.
 *     Frame = "ecliptic-illustrative".
 *
 * ── Sign / axis conventions (frontend must match — same as other-moons) ──────
 *
 *   All moon coordinates are in units of the CENTRAL BODY's radius
 *   ({@link DwarfSystemData.centralRadiusKm}), measured from the system
 *   BARYCENTER (Pluto) / central-body centre (others), in the plane of the sky.
 *   The sky basis is built from the system's geocentric direction d̂ (Earth →
 *   system, J2000 equatorial) and the J2000 celestial north pole ẑ = (0,0,1):
 *
 *     • Z — line of sight, positive toward EARTH: Ẑ = −d̂. `frontOfDisk` is
 *           computed RELATIVE TO THE CENTRAL BODY (Pluto is offset), so it means
 *           "the moon is in front of the central body along the line of sight".
 *     • Y — positive toward celestial NORTH.
 *     • X — positive toward celestial WEST (right-handed, North up, looking out).
 *
 *   Shadow coordinates (shadowX, shadowY) are the same projection taken from the
 *   system's direction to the Sun (real heliocentric direction), relative to the
 *   central body: a moon whose shadow lands on the sunlit central disk is a shadow
 *   transit; on the anti-solar side it is (geometrically) eclipsed.
 *
 * ── Rotation FACTS for the UI (data only — NOT simulated here) ────────────────
 *
 *   Pluto & Charon are a mutually TIDALLY LOCKED, RETROGRADE-rotating pair; Eris
 *   & Dysnomia are likewise mutually tidally locked; the small Pluto moons (Styx,
 *   Nix, Kerberos, Hydra) are CHAOTIC ROTATORS (Showalter & Hamilton 2015). These
 *   are exposed as flags on {@link DWARF_SYSTEMS}/{@link DWARF_MOONS}; this library
 *   does not model spin, only orbital configuration.
 *
 * ── HONESTY: ACCURACY BOUND ──────────────────────────────────────────────────
 *
 *   Pluto system: REAL and precise (New-Horizons-era mean elements; low-accuracy
 *   Kepler propagation carrying no short-period perturbations, best near J2000).
 *   Eris / Haumea / Makemake: orbit SIZE/SHAPE/PERIOD real & cited, along-orbit
 *   PHASE and node ILLUSTRATIVE; Makemake's orbit additionally poorly constrained.
 *   Cross-check JPL Horizons OFFLINE — this keyless library NEVER calls it.
 */

import { heliocentricPosition as earthHeliocentric } from "./planets";
import { heliocentricPosition as dwarfHeliocentric } from "./dwarf-planets";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const DAY_MS = 86_400_000;

/** Julian Date of the J2000.0 epoch (2000-01-01 12:00 TT). */
const J2000_JD = 2_451_545.0;
/** Julian Date of the Unix epoch, 1970-01-01T00:00:00Z. */
const UNIX_EPOCH_JD = 2_440_587.5;

/** Unix ms at the J2000 epoch = 2000-01-01.5 TDB — every moon's element epoch. */
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

/**
 * ΔT = TD − UTC, seconds. The Kepler propagation runs in Dynamical Time (TD); we
 * fold in a constant ΔT ≈ 69 s for the modern era — the same honest approximation
 * used across lib/planets.ts, lib/dwarf-planets.ts and lib/other-moons.ts.
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
/** Days in a Julian year (for a precession-period → rate). */
const DAYS_PER_JULIAN_YEAR = 365.25;

// ─────────────────────────────── Identifiers ────────────────────────────────

/** The four dwarf-planet systems whose moons this module serves. */
export type DwarfSystem = "Pluto" | "Eris" | "Haumea" | "Makemake";

/** Every moon served here, across the four systems. */
export type DwarfMoon =
  // Pluto (real ephemeris)
  | "Charon"
  | "Styx"
  | "Nix"
  | "Kerberos"
  | "Hydra"
  // Eris (illustrative phase)
  | "Dysnomia"
  // Haumea (illustrative phase)
  | "Namaka"
  | "Hiiaka"
  // Makemake (illustrative phase, poorly constrained)
  | "MK2";

/**
 * Which reference frame a moon's elements are propagated in:
 *   • "pluto-equator"          — Pluto's equatorial frame, real IAU-pole oriented.
 *   • "ecliptic-illustrative"  — adopted ecliptic-referred plane, node = 0, phase
 *                                illustrative (Eris / Haumea / Makemake).
 */
export type DwarfMoonFrame = "pluto-equator" | "ecliptic-illustrative";

/** Geometric phenomenon types (mirrors other-moons; GEOMETRIC only — see §(A)). */
export type PhenomenonType =
  | "transit"
  | "shadow_transit"
  | "occultation"
  | "eclipse";

// ─────────────────────────────── System table ───────────────────────────────

/**
 * Per-system central-body & orientation constants. Moon coordinates are in units
 * of {@link centralRadiusKm}. `hasRealEphemeris` is the TIER-A flag: true only for
 * Pluto (real along-orbit positions); false for Eris/Haumea/Makemake (real orbit,
 * illustrative phase).
 */
export interface DwarfSystemData {
  name: DwarfSystem;
  /** central body used to normalise the moon coordinates. */
  centralBody: string;
  /** central-body reference radius [km] — the unit of the moon coordinates. */
  centralRadiusKm: number;
  /** what {@link centralRadiusKm} is (mean radius, volume-equivalent, …). */
  centralRadiusNote: string;
  /** J2000 IAU north-pole RA α0 [deg] (WGCCRE) — Pluto only, else undefined. */
  poleRaJ2000Deg?: number;
  /** J2000 IAU north-pole Dec δ0 [deg] (WGCCRE) — Pluto only, else undefined. */
  poleDecJ2000Deg?: number;
  /** moon reference frame for this system (see {@link DwarfMoonFrame}). */
  frame: DwarfMoonFrame;
  /** TIER-A flag: true ⇒ real along-orbit moon positions (Pluto only). */
  hasRealEphemeris: boolean;
  /** Charon/Pluto mass ratio q (Pluto only) — sets the barycenter. */
  massRatio?: number;
  /** barycenter fraction f = q/(1+q) (Pluto only): barycenter = f·a from Pluto. */
  barycenterFraction?: number;
  /** ring radius [km] (Haumea only; Ortiz et al. 2017). */
  ringRadiusKm?: number;
  /** ring radius in central-body radii (Haumea only). */
  ringRadiusReq?: number;
  /** triaxial semi-axes [km] a>b>c (Haumea only). */
  triaxialSemiAxesKm?: { a: number; b: number; c: number };
  /** true ⇒ the central body is a RETROGRADE rotator (a fact for the UI). */
  retrogradeRotator: boolean;
  /** source citation for this system's moon elements. */
  source: string;
  /** honest one-line label for the UI. */
  note: string;
}

/** Central-body reference radii [km] (see per-system citations). */
const PLUTO_REQ_KM = 1188.3; // New Horizons 2015 (also lib/dwarf-planets)
const ERIS_RADIUS_KM = 1163; // stellar occultation (2010)
const HAUMEA_RADIUS_KM = 797.4; // volume-equivalent of 1160×852×513 km semi-axes
const MAKEMAKE_RADIUS_KM = 715; // stellar-occultation shape (2011)

/** Charon/Pluto mass ratio q (Brozović & Jacobson 2024). */
export const PLUTO_CHARON_MASS_RATIO = 0.1218;
/** Barycenter fraction f = q/(1+q): barycenter is f·a_Charon from Pluto's centre. */
export const PLUTO_BARYCENTER_FRACTION =
  PLUTO_CHARON_MASS_RATIO / (1 + PLUTO_CHARON_MASS_RATIO);
/** Haumea's ring radius [km] (Ortiz et al. 2017). */
export const HAUMEA_RING_RADIUS_KM = 2285;

export const DWARF_SYSTEMS: Record<DwarfSystem, DwarfSystemData> = {
  Pluto: {
    name: "Pluto",
    centralBody: "Pluto",
    centralRadiusKm: PLUTO_REQ_KM,
    centralRadiusNote: "Pluto mean radius (New Horizons 2015)",
    poleRaJ2000Deg: 132.993,
    poleDecJ2000Deg: -6.163,
    frame: "pluto-equator",
    hasRealEphemeris: true,
    massRatio: PLUTO_CHARON_MASS_RATIO,
    barycenterFraction: PLUTO_BARYCENTER_FRACTION,
    retrogradeRotator: true, // Pluto & Charon spin retrograde
    source: "Brozović & Jacobson (2024), AJ 167:256 (JPL SSD), epoch J2000",
    note: "Real positions: full cited mean elements. Pluto–Charon is a binary; the barycenter lies OUTSIDE Pluto.",
  },
  Eris: {
    name: "Eris",
    centralBody: "Eris",
    centralRadiusKm: ERIS_RADIUS_KM,
    centralRadiusNote: "Eris mean radius (stellar occultation 2010)",
    frame: "ecliptic-illustrative",
    hasRealEphemeris: false,
    retrogradeRotator: false,
    source: "Holler et al. (2021)",
    note: "Orbit real (a, e, i, period cited); along-orbit position ILLUSTRATIVE. Dysnomia is mutually tidally locked.",
  },
  Haumea: {
    name: "Haumea",
    centralBody: "Haumea",
    centralRadiusKm: HAUMEA_RADIUS_KM,
    centralRadiusNote:
      "Haumea volume-equivalent radius of the 1160×852×513 km triaxial shape",
    frame: "ecliptic-illustrative",
    hasRealEphemeris: false,
    ringRadiusKm: HAUMEA_RING_RADIUS_KM,
    ringRadiusReq: HAUMEA_RING_RADIUS_KM / HAUMEA_RADIUS_KM,
    triaxialSemiAxesKm: { a: 1160, b: 852, c: 513 },
    retrogradeRotator: false,
    source: "Ragozzine & Brown (2009); ring: Ortiz et al. (2017)",
    note: "Orbits of Hiʻiaka & Namaka real; positions ILLUSTRATIVE. Triaxial body with a ring at 2285 km; spins in 3.9 h.",
  },
  Makemake: {
    name: "Makemake",
    centralBody: "Makemake",
    centralRadiusKm: MAKEMAKE_RADIUS_KM,
    centralRadiusNote: "Makemake mean radius (stellar occultation 2011)",
    frame: "ecliptic-illustrative",
    hasRealEphemeris: false,
    retrogradeRotator: false,
    source: "Parker et al. (2016)",
    note: "Orbit of MK2 POORLY CONSTRAINED (edge-on, few detections); position ILLUSTRATIVE.",
  },
};

// ─────────────────────────────── Moon table ─────────────────────────────────

export interface DwarfMoonData {
  name: DwarfMoon;
  system: DwarfSystem;
  /** semi-major axis [km]. For Charon this is the Pluto–Charon SEPARATION. */
  semiMajorAxisKm: number;
  /** semi-major axis in central-body radii — ≈ the max apparent elongation. */
  semiMajorAxisReq: number;
  /** orbital eccentricity [–]. */
  eccentricity: number;
  /** inclination [deg] (see the system's frame for the reference plane). */
  inclinationDeg: number;
  /** sidereal orbital period [days] — REAL for every moon. */
  siderealPeriodDays: number;
  /**
   * argument of periapsis ω at epoch [deg]. REAL for Pluto moons; an ADOPTED
   * convention (0) for the illustrative systems.
   */
  argPeriapsisDeg: number;
  /**
   * longitude of ascending node Ω at epoch [deg]. REAL for Pluto moons; ADOPTED
   * (0) for the illustrative systems.
   */
  nodeDeg: number;
  /**
   * mean anomaly M at epoch [deg]. REAL for Pluto moons; ADOPTED (0) for the
   * illustrative systems (this is exactly what `phaseReal` = false records).
   */
  meanAnomalyEpochDeg: number;
  /**
   * nodal-precession PERIOD [years] (Kerberos 9, Hydra 14; else 0 = none). The
   * node regresses at −360/P_node °/yr.
   */
  nodePeriodYears: number;
  /** Unix ms of the element epoch (J2000 for all moons here). */
  epochUnixMs: number;
  /** reference frame the elements are propagated in. */
  frame: DwarfMoonFrame;
  /**
   * TIER FLAG. true  ⇒ the along-orbit POSITION is real (Pluto moons).
   *            false ⇒ orbit real, POSITION illustrative (Eris/Haumea/Makemake).
   */
  phaseReal: boolean;
  /** true ⇒ the orbit itself is poorly constrained (Makemake's MK2 only). */
  orbitUncertain: boolean;
  /** true ⇒ mutually tidally locked (Charon, Dysnomia). */
  tidallyLocked: boolean;
  /** true ⇒ chaotic rotator (Styx, Nix, Kerberos, Hydra — Showalter & Hamilton 2015). */
  chaoticRotator: boolean;
  /**
   * true ⇒ this is the BINARY PRIMARY component (Charon): its semiMajorAxis is the
   * Pluto–Charon separation, and it drives the barycenter split (see module header).
   */
  primaryComponent: boolean;
}

/**
 * Per-moon elements. Pluto's are the REAL Brozović & Jacobson (2024) mean elements
 * (epoch J2000, Pluto equatorial frame). Eris/Haumea/Makemake carry each moon's
 * REAL cited a, e, i and period, with node / argPeriapsis / mean-anomaly ADOPTED
 * to 0 (an illustrative convention — `phaseReal` = false).
 */
export const DWARF_MOONS: Record<DwarfMoon, DwarfMoonData> = {
  // ── Pluto system (Brozović & Jacobson 2024, J2000, Pluto equator) ──
  Charon: {
    name: "Charon",
    system: "Pluto",
    semiMajorAxisKm: 19600, // Pluto–Charon SEPARATION (relative orbit)
    semiMajorAxisReq: 19600 / PLUTO_REQ_KM,
    eccentricity: 0.0,
    inclinationDeg: 0.0,
    siderealPeriodDays: 6.387222,
    argPeriapsisDeg: 0.0,
    nodeDeg: 0.0,
    meanAnomalyEpochDeg: 304.1,
    nodePeriodYears: 0,
    epochUnixMs: J2000_UNIX_MS,
    frame: "pluto-equator",
    phaseReal: true,
    orbitUncertain: false,
    tidallyLocked: true,
    chaoticRotator: false,
    primaryComponent: true,
  },
  Styx: {
    name: "Styx",
    system: "Pluto",
    semiMajorAxisKm: 43200,
    semiMajorAxisReq: 43200 / PLUTO_REQ_KM,
    eccentricity: 0.025,
    inclinationDeg: 0.0,
    siderealPeriodDays: 20.16,
    argPeriapsisDeg: 322.5,
    nodeDeg: 0.0,
    meanAnomalyEpochDeg: 358.1,
    nodePeriodYears: 0,
    epochUnixMs: J2000_UNIX_MS,
    frame: "pluto-equator",
    phaseReal: true,
    orbitUncertain: false,
    tidallyLocked: false,
    chaoticRotator: true,
    primaryComponent: false,
  },
  Nix: {
    name: "Nix",
    system: "Pluto",
    semiMajorAxisKm: 49300,
    semiMajorAxisReq: 49300 / PLUTO_REQ_KM,
    eccentricity: 0.015,
    inclinationDeg: 0.0,
    siderealPeriodDays: 24.85,
    argPeriapsisDeg: 31.4,
    nodeDeg: 0.0,
    meanAnomalyEpochDeg: 338.2,
    nodePeriodYears: 0,
    epochUnixMs: J2000_UNIX_MS,
    frame: "pluto-equator",
    phaseReal: true,
    orbitUncertain: false,
    tidallyLocked: false,
    chaoticRotator: true,
    primaryComponent: false,
  },
  Kerberos: {
    name: "Kerberos",
    system: "Pluto",
    semiMajorAxisKm: 58300,
    semiMajorAxisReq: 58300 / PLUTO_REQ_KM,
    eccentricity: 0.01,
    inclinationDeg: 0.4,
    siderealPeriodDays: 32.17,
    argPeriapsisDeg: 32.1,
    nodeDeg: 314.3,
    meanAnomalyEpochDeg: 276.1,
    nodePeriodYears: 9, // small node precession (Brozović & Jacobson 2024)
    epochUnixMs: J2000_UNIX_MS,
    frame: "pluto-equator",
    phaseReal: true,
    orbitUncertain: false,
    tidallyLocked: false,
    chaoticRotator: true,
    primaryComponent: false,
  },
  Hydra: {
    name: "Hydra",
    system: "Pluto",
    semiMajorAxisKm: 65200,
    semiMajorAxisReq: 65200 / PLUTO_REQ_KM,
    eccentricity: 0.009,
    inclinationDeg: 0.3,
    siderealPeriodDays: 38.2,
    argPeriapsisDeg: 139.3,
    nodeDeg: 114.3,
    meanAnomalyEpochDeg: 335.0,
    nodePeriodYears: 14, // small node precession (Brozović & Jacobson 2024)
    epochUnixMs: J2000_UNIX_MS,
    frame: "pluto-equator",
    phaseReal: true,
    orbitUncertain: false,
    tidallyLocked: false,
    chaoticRotator: true,
    primaryComponent: false,
  },

  // ── Eris (Holler et al. 2021) — REAL orbit, ILLUSTRATIVE phase ──
  Dysnomia: {
    name: "Dysnomia",
    system: "Eris",
    semiMajorAxisKm: 37273,
    semiMajorAxisReq: 37273 / ERIS_RADIUS_KM,
    eccentricity: 0.0062,
    // i cited relative to Eris's heliocentric orbit; ADOPTED here vs the ecliptic.
    inclinationDeg: 78.29,
    siderealPeriodDays: 15.785899,
    argPeriapsisDeg: 0.0, // adopted convention (illustrative)
    nodeDeg: 0.0, // adopted convention (illustrative)
    meanAnomalyEpochDeg: 0.0, // adopted convention (illustrative)
    nodePeriodYears: 0,
    epochUnixMs: J2000_UNIX_MS,
    frame: "ecliptic-illustrative",
    phaseReal: false,
    orbitUncertain: false,
    tidallyLocked: true, // mutually tidally locked (Holler et al. 2021)
    chaoticRotator: false,
    primaryComponent: false,
  },

  // ── Haumea (Ragozzine & Brown 2009) — REAL orbits, ILLUSTRATIVE phase ──
  Namaka: {
    name: "Namaka",
    system: "Haumea",
    semiMajorAxisKm: 25657,
    semiMajorAxisReq: 25657 / HAUMEA_RADIUS_KM,
    eccentricity: 0.249,
    inclinationDeg: 113.013, // 13.41° mutual inclination from Hiʻiaka (real)
    siderealPeriodDays: 18.2783,
    argPeriapsisDeg: 0.0, // adopted convention (illustrative)
    nodeDeg: 0.0, // adopted convention (illustrative)
    meanAnomalyEpochDeg: 0.0, // adopted convention (illustrative)
    nodePeriodYears: 0,
    epochUnixMs: J2000_UNIX_MS,
    frame: "ecliptic-illustrative",
    phaseReal: false,
    orbitUncertain: false,
    tidallyLocked: false,
    chaoticRotator: false,
    primaryComponent: false,
  },
  Hiiaka: {
    name: "Hiiaka",
    system: "Haumea",
    semiMajorAxisKm: 49880,
    semiMajorAxisReq: 49880 / HAUMEA_RADIUS_KM,
    eccentricity: 0.0513,
    inclinationDeg: 126.356,
    siderealPeriodDays: 49.462,
    argPeriapsisDeg: 0.0, // adopted convention (illustrative)
    nodeDeg: 0.0, // adopted convention (illustrative)
    meanAnomalyEpochDeg: 0.0, // adopted convention (illustrative)
    nodePeriodYears: 0,
    epochUnixMs: J2000_UNIX_MS,
    frame: "ecliptic-illustrative",
    phaseReal: false,
    orbitUncertain: false,
    tidallyLocked: false,
    chaoticRotator: false,
    primaryComponent: false,
  },

  // ── Makemake (Parker et al. 2016) — REAL a/e/P, ILLUSTRATIVE & UNCERTAIN ──
  MK2: {
    name: "MK2",
    system: "Makemake",
    semiMajorAxisKm: 22250, // ±780 km — poorly constrained
    semiMajorAxisReq: 22250 / MAKEMAKE_RADIUS_KM,
    eccentricity: 0.0,
    inclinationDeg: 90.0, // seen ~edge-on from Earth; ADOPTED here (illustrative)
    siderealPeriodDays: 18.023,
    argPeriapsisDeg: 0.0, // adopted convention (illustrative)
    nodeDeg: 0.0, // adopted convention (illustrative)
    meanAnomalyEpochDeg: 0.0, // adopted convention (illustrative)
    nodePeriodYears: 0,
    epochUnixMs: J2000_UNIX_MS,
    frame: "ecliptic-illustrative",
    phaseReal: false,
    orbitUncertain: true, // POORLY CONSTRAINED (Parker et al. 2016)
    tidallyLocked: false,
    chaoticRotator: false,
    primaryComponent: false,
  },
};

/** The moons of each system, in orbital order (innermost → outermost). */
export const MOONS_BY_SYSTEM: Record<DwarfSystem, readonly DwarfMoon[]> = {
  Pluto: ["Charon", "Styx", "Nix", "Kerberos", "Hydra"],
  Eris: ["Dysnomia"],
  Haumea: ["Namaka", "Hiiaka"],
  Makemake: ["MK2"],
} as const;

// ───────────────────────────── null-safety guards ──────────────────────────
// Contract (mirrors lib/other-moons.ts): a bad Date yields null (or [] for
// lists), never a throw — the renderer must survive bad input.

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
function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
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

/** Earth days of TT elapsed since a moon's element epoch (its mean-motion clock). */
function daysSinceEpochTT(date: Date, epochUnixMs: number): number {
  return (date.getTime() + DELTA_T_SECONDS * 1000 - epochUnixMs) / DAY_MS;
}

// ───────────────────────────── Kepler's equation ───────────────────────────

/**
 * Solve Kepler's equation M = E − e·sinE for the eccentric anomaly E (radians)
 * by Newton–Raphson. Every moon here is low-e (max Namaka e = 0.249), so the
 * standard start converges in a few iterations. Mirrors lib/other-moons.solveKepler.
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
 * Secular node-precession rate [deg/day] from a precession PERIOD in years, with
 * the node REGRESSING (−). A degenerate period (0, or an implausibly short one)
 * contributes nothing. Only Kerberos (9 yr) and Hydra (14 yr) carry it, and even
 * there it is a small effect on a near-circular near-equatorial orbit.
 */
function nodeRegressionDegPerDay(periodYears: number): number {
  if (!Number.isFinite(periodYears) || periodYears < 0.1) return 0;
  return -360 / (periodYears * DAYS_PER_JULIAN_YEAR);
}

// ─────────────────── Shared system / sky / sun geometry per instant ─────────

/** The system's geocentric direction, optional pole triad, and sky/sun bases. */
interface SystemGeometry {
  system: DwarfSystem;
  data: DwarfSystemData;
  /** Earth–system distance Δ [AU]. */
  distanceAU: number;
  /** apparent geocentric right ascension [deg, 0–360). */
  raDeg: number;
  /** apparent geocentric declination [deg]. */
  decDeg: number;
  /** sub-Earth latitude on the moon-system plane [deg] — "how open" it looks. */
  systemTiltDeg: number;
  /** true ⇒ systemTiltDeg is REAL (Pluto's pole); false ⇒ illustrative plane. */
  tiltReal: boolean;

  // Internal frame vectors (J2000 equatorial), used to project the moons.
  /** central-body pole unit vector (Pluto only; [0,0,1] placeholder otherwise). */
  pole: Vec3;
  /** pole-frame reference X (ascending node of Pluto's equator on Earth equator). */
  eqX: Vec3;
  /** pole-frame Y (= pole × eqX). */
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
  /** system→Sun unit vector (sun-frame toward-source axis). */
  sunZ: Vec3;
}

/**
 * Orbital-plane normal (J2000 equatorial) of the system's REFERENCE plane, used
 * for systemTiltDeg. Pluto: the IAU pole (real). Illustrative systems: the adopted
 * ecliptic-referred plane of the system's reference (first-listed) moon.
 */
function systemPlaneNormalEq(system: DwarfSystem, pole: Vec3): Vec3 {
  if (system === "Pluto") return pole;
  const ref = DWARF_MOONS[MOONS_BY_SYSTEM[system][0]];
  const inc = ref.inclinationDeg * DEG2RAD;
  const node = ref.nodeDeg * DEG2RAD; // 0 by adopted convention
  // Orbit normal in the ecliptic for (Ω, i): (sinΩ·sini, −cosΩ·sini, cosi).
  const nEcl: Vec3 = [
    Math.sin(node) * Math.sin(inc),
    -Math.cos(node) * Math.sin(inc),
    Math.cos(inc),
  ];
  return norml(eclipticToEquatorial(nEcl));
}

/**
 * Geocentric direction of a dwarf-planet system (light-time corrected) and the
 * orthonormal pole / sky / sun bases used to project the moons — all J2000
 * equatorial. Reuses the REAL, cited heliocentric theories: Earth from
 * lib/planets, the dwarf body from lib/dwarf-planets (SBDB mean elements).
 */
function computeGeometry(system: DwarfSystem, date: Date): SystemGeometry {
  const data = DWARF_SYSTEMS[system];
  const earthHel = earthHeliocentric("Earth", date);
  const earth: Vec3 = [earthHel.x, earthHel.y, earthHel.z];

  // Geocentric system (J2000 ecliptic), light-time corrected.
  let hel = dwarfHeliocentric(system, date);
  let geo: Vec3 = [hel.x - earth[0], hel.y - earth[1], hel.z - earth[2]];
  let delta = Math.hypot(geo[0], geo[1], geo[2]);
  for (let i = 0; i < 2; i++) {
    const tau = delta / LIGHT_AU_PER_DAY;
    const retarded = new Date(date.getTime() - tau * DAY_MS);
    hel = dwarfHeliocentric(system, retarded);
    geo = [hel.x - earth[0], hel.y - earth[1], hel.z - earth[2]];
    delta = Math.hypot(geo[0], geo[1], geo[2]);
  }

  // Heliocentric system (geometric) for the system→Sun direction.
  const helNow = dwarfHeliocentric(system, date);
  const helHat = norml([helNow.x, helNow.y, helNow.z]);

  // Equatorial geometry: RA/Dec and the projection bases.
  const geoEq = eclipticToEquatorial(geo);
  const raDeg = norm360(Math.atan2(geoEq[1], geoEq[0]) * RAD2DEG);
  const decDeg = Math.asin(clamp(geoEq[2] / delta, -1, 1)) * RAD2DEG;

  // Central-body pole (IAU) in J2000 equatorial — Pluto only.
  let pole: Vec3 = [0, 0, 1];
  let eqX: Vec3 = [1, 0, 0];
  let eqY: Vec3 = [0, 1, 0];
  if (data.poleRaJ2000Deg !== undefined && data.poleDecJ2000Deg !== undefined) {
    const a0 = data.poleRaJ2000Deg * DEG2RAD;
    const d0 = data.poleDecJ2000Deg * DEG2RAD;
    pole = [Math.cos(d0) * Math.cos(a0), Math.cos(d0) * Math.sin(a0), Math.sin(d0)];
    // Ascending node of the equator on the Earth equator (RA = α0 + 90°); eqY
    // completes the right-handed triad with the pole as +Z. Carries the moons'
    // node/periapsis references.
    eqX = [-Math.sin(a0), Math.cos(a0), 0];
    eqY = cross(pole, eqX);
  }

  // Sky basis from the geocentric direction.
  const dHat = norml(geoEq); // Earth → system
  const skyZ: Vec3 = [-dHat[0], -dHat[1], -dHat[2]]; // toward Earth
  const celestialNorth: Vec3 = [0, 0, 1];
  const skyY = perpUnit(celestialNorth, skyZ); // north
  const skyX = cross(skyY, skyZ); // west

  // Sun basis from the system→Sun direction.
  const sunZ = eclipticToEquatorial([-helHat[0], -helHat[1], -helHat[2]]);
  const sunY = perpUnit(celestialNorth, sunZ);
  const sunX = cross(sunY, sunZ);

  // System tilt (sub-Earth latitude on the moon-system plane).
  const normal = systemPlaneNormalEq(system, pole);
  const systemTiltDeg = Math.asin(clamp(dot(skyZ, normal), -1, 1)) * RAD2DEG;

  return {
    system,
    data,
    distanceAU: delta,
    raDeg,
    decDeg,
    systemTiltDeg,
    tiltReal: system === "Pluto",
    pole,
    eqX,
    eqY,
    skyX,
    skyY,
    skyZ,
    sunX,
    sunY,
    sunZ,
  };
}

// ─────────────────────────── Disk test geometry ────────────────────────────

/**
 * Is a projected point (x, y in central-body radii, relative to the central body)
 * inside the central body's apparent disk? The dwarf central bodies are treated as
 * spheres of radius 1 (Pluto/Eris/Makemake are near-spherical; Haumea is triaxial
 * and its time-varying silhouette is NOT modelled — its dimensions are exposed as
 * data on {@link DWARF_SYSTEMS} instead). A simple unit-circle test.
 */
export function diskContains(x: number, y: number, radius = 1): boolean {
  return Math.hypot(x, y) < radius;
}

// ─────────────────────────── Satellite apparent positions ──────────────────

/** Apparent position + geometric phenomenon flags for one moon at one instant. */
export interface DwarfMoonPosition {
  moon: DwarfMoon;
  system: DwarfSystem;
  /** apparent X [central-body radii] from the barycenter/centre, +WEST. */
  x: number;
  /** apparent Y [central-body radii] from the barycenter/centre, +NORTH. */
  y: number;
  /** line-of-sight Z [central-body radii] from the barycenter/centre, +toward Earth. */
  z: number;
  /** true ⇒ moon is in front of the CENTRAL BODY along the line of sight. */
  frontOfDisk: boolean;
  /** shadow X [central-body radii], projected from the Sun, relative to the body. */
  shadowX: number;
  /** shadow Y [central-body radii], projected from the Sun, relative to the body. */
  shadowY: number;
  /** GEOMETRIC: moon crosses the near face of the central body's disk. */
  inTransit: boolean;
  /** GEOMETRIC: moon is hidden behind the central body's disk. */
  inOccultation: boolean;
  /** GEOMETRIC: moon's shadow falls on the sunlit central disk. */
  inShadowTransit: boolean;
  /** GEOMETRIC: moon is inside the central body's umbra. */
  inEclipse: boolean;
  /**
   * TIER FLAG. true ⇒ this is a REAL along-orbit position (Pluto). false ⇒ the
   * orbit is real but the along-orbit POSITION is ILLUSTRATIVE (Eris/Haumea/Makemake).
   */
  phaseReal: boolean;
  /** true ⇒ the orbit is poorly constrained (Makemake's MK2 only). */
  orbitUncertain: boolean;
  /** true ⇒ mutually tidally locked (Charon, Dysnomia). */
  tidallyLocked: boolean;
  /**
   * Pluto only: the PRIMARY (Pluto) offset from the barycenter, in central-body
   * radii, in the plane of the sky — the SAME value for every Pluto moon (it is a
   * system property). The wobble the UI draws. null for the other systems.
   */
  barycentricOffset: { x: number; y: number; z: number } | null;
  /** true ⇒ the binary primary component (Charon); see module header. */
  primaryComponent: boolean;
}

/**
 * The moon's RAW Kepler position vector in the J2000 EQUATORIAL frame (in
 * central-body radii) at `date` — before the barycenter split and the plane-of-sky
 * projection. For Pluto moons this is Pluto-centric (Charon) or barycentric (small
 * moons); for the illustrative systems it is central-body-centric.
 */
function moonVectorRawEq(moon: DwarfMoonData, g: SystemGeometry, date: Date): Vec3 {
  const aReq = moon.semiMajorAxisReq;
  const e = moon.eccentricity;
  const inc = moon.inclinationDeg * DEG2RAD;
  const days = daysSinceEpochTT(date, moon.epochUnixMs);

  // Epoch mean longitude λ0 = M+ω+Ω, longitude of periapsis ϖ0 = ω+Ω. Propagate
  // in mean longitude so the near-zero e/i Pluto moons stay robust.
  const lambda0 = moon.meanAnomalyEpochDeg + moon.argPeriapsisDeg + moon.nodeDeg;
  const varpi0 = moon.argPeriapsisDeg + moon.nodeDeg;
  const meanMotion = 360 / moon.siderealPeriodDays; // deg/day — REAL for every moon
  const nodeRate = nodeRegressionDegPerDay(moon.nodePeriodYears);

  const lambda = lambda0 + meanMotion * days;
  const node = (moon.nodeDeg + nodeRate * days) * DEG2RAD;
  const arg = varpi0 * DEG2RAD - node; // ω(t) = ϖ0 − Ω(t)
  const M = (lambda - varpi0) * DEG2RAD; // M = λ − ϖ
  const E = solveKepler(M, e);

  // Position in the orbital plane (central-body radii).
  const xo = aReq * (Math.cos(E) - e);
  const yo = aReq * Math.sqrt(1 - e * e) * Math.sin(E);

  // Rotate by ω (in-plane), i (tilt), Ω into the reference plane.
  const cO = Math.cos(arg);
  const sO = Math.sin(arg);
  const cN = Math.cos(node);
  const sN = Math.sin(node);
  const cI = Math.cos(inc);
  const sI = Math.sin(inc);
  const mx = (cO * cN - sO * sN * cI) * xo + (-sO * cN - cO * sN * cI) * yo;
  const my = (cO * sN + sO * cN * cI) * xo + (-sO * sN + cO * cN * cI) * yo;
  const mz = sO * sI * xo + cO * sI * yo;

  if (moon.frame === "ecliptic-illustrative") {
    // Eris/Haumea/Makemake: (mx,my,mz) is a J2000 ECLIPTIC vector (adopted plane)
    // → rotate to equatorial. No pole rotation.
    return eclipticToEquatorial([mx, my, mz]);
  }
  // Pluto equator → J2000 equatorial via the pole triad.
  return [
    mx * g.eqX[0] + my * g.eqY[0] + mz * g.pole[0],
    mx * g.eqX[1] + my * g.eqY[1] + mz * g.pole[1],
    mx * g.eqX[2] + my * g.eqY[2] + mz * g.pole[2],
  ];
}

/** {x,y,z} of a J2000-equatorial vector projected onto the plane of the sky. */
function projectSky(
  V: Vec3,
  g: SystemGeometry
): { x: number; y: number; z: number } {
  return { x: dot(V, g.skyX), y: dot(V, g.skyY), z: dot(V, g.skyZ) };
}

/**
 * Project one moon's J2000-equatorial position (from the barycenter) into the
 * public record. `centralVec` is the central body's own vector from the barycenter
 * (Pluto's offset; [0,0,0] for the illustrative systems), used so that all
 * disk / shadow phenomena are measured RELATIVE TO THE CENTRAL BODY.
 */
function toPosition(
  moon: DwarfMoonData,
  vBary: Vec3,
  centralVec: Vec3,
  barycentricOffset: { x: number; y: number; z: number } | null,
  g: SystemGeometry
): DwarfMoonPosition {
  const p = projectSky(vBary, g); // barycentric plane-of-sky position (returned)

  // Everything relative to the central body (Pluto is offset from the barycenter).
  const rel = sub(vBary, centralVec);
  const relX = dot(rel, g.skyX);
  const relY = dot(rel, g.skyY);
  const relZ = dot(rel, g.skyZ);
  const frontOfDisk = relZ > 0;
  const onEarthDisk = diskContains(relX, relY);

  // Sun projection relative to the central body.
  const shadowX = dot(rel, g.sunX);
  const shadowY = dot(rel, g.sunY);
  const sunward = dot(rel, g.sunZ) > 0;
  const onSunDisk = diskContains(shadowX, shadowY);

  return {
    moon: moon.name,
    system: moon.system,
    x: p.x,
    y: p.y,
    z: p.z,
    frontOfDisk,
    shadowX,
    shadowY,
    inTransit: frontOfDisk && onEarthDisk,
    inOccultation: !frontOfDisk && onEarthDisk,
    inShadowTransit: sunward && onSunDisk,
    inEclipse: !sunward && onSunDisk,
    phaseReal: moon.phaseReal,
    orbitUncertain: moon.orbitUncertain,
    tidallyLocked: moon.tidallyLocked,
    barycentricOffset,
    primaryComponent: moon.primaryComponent,
  };
}

/**
 * Central-body offset from the system barycenter (Pluto's wobble), as a J2000
 * equatorial vector in central-body radii. For Pluto: −f·r_rel(Charon). For the
 * illustrative systems the moons are negligibly massive, so this is [0,0,0].
 */
function centralBodyVec(g: SystemGeometry, date: Date): Vec3 {
  const f = g.data.barycenterFraction;
  if (g.system !== "Pluto" || f === undefined) return [0, 0, 0];
  const rRel = moonVectorRawEq(DWARF_MOONS.Charon, g, date); // Charon relative to Pluto
  return scale(rRel, -f);
}

/**
 * Apparent rectangular coordinates of a system's moons relative to the BARYCENTER
 * (Pluto) / central-body centre (others) at `date`, in central-body radii, in the
 * plane of the sky. Returns the moons in orbital order, or null for an invalid
 * date. Each record carries the TIER flag `phaseReal` and — for Pluto — the
 * `barycentricOffset` (Pluto's own offset from the barycenter). See the module
 * header for the sign convention and the honesty tiers.
 */
export function dwarfMoonPositions(
  system: DwarfSystem,
  date: Date
): DwarfMoonPosition[] | null {
  if (!isValidDate(date)) return null;
  const g = computeGeometry(system, date);
  const centralVec = centralBodyVec(g, date);
  const barycentricOffset =
    system === "Pluto" ? projectSky(centralVec, g) : null;
  const f = g.data.barycenterFraction;

  return MOONS_BY_SYSTEM[system].map((name) => {
    const data = DWARF_MOONS[name];
    const raw = moonVectorRawEq(data, g, date);
    // Charon's raw vector is the Pluto–Charon separation r_rel; its barycentric
    // position is (1−f)·r_rel. The small moons' raw vectors are already barycentric.
    const vBary: Vec3 =
      data.primaryComponent && f !== undefined ? scale(raw, 1 - f) : raw;
    return toPosition(data, vBary, centralVec, barycentricOffset, g);
  });
}

/**
 * Apparent position of a single named moon at `date` (null on bad input, or if
 * `moon` does not belong to `system`).
 */
export function dwarfMoonPosition(
  system: DwarfSystem,
  moon: DwarfMoon,
  date: Date
): DwarfMoonPosition | null {
  if (!isValidDate(date)) return null;
  const data = DWARF_MOONS[moon];
  if (!data || data.system !== system) return null;
  const g = computeGeometry(system, date);
  const centralVec = centralBodyVec(g, date);
  const barycentricOffset =
    system === "Pluto" ? projectSky(centralVec, g) : null;
  const f = g.data.barycenterFraction;
  const raw = moonVectorRawEq(data, g, date);
  const vBary: Vec3 =
    data.primaryComponent && f !== undefined ? scale(raw, 1 - f) : raw;
  return toPosition(data, vBary, centralVec, barycentricOffset, g);
}

/**
 * Pluto's own offset from the Pluto–Charon barycenter at `date`, in Pluto radii,
 * in the plane of the sky (the wobble). Anti-phase to Charon, with magnitude
 * f·a_Charon ≈ 1.79 Pluto radii; |Pluto offset| : |Charon offset| = q : 1. Returns
 * null for a bad date or a non-Pluto system (only Pluto has a modelled barycenter
 * wobble).
 */
export function plutoBarycentricOffset(
  system: DwarfSystem,
  date: Date
): { x: number; y: number; z: number } | null {
  if (system !== "Pluto" || !isValidDate(date)) return null;
  const g = computeGeometry(system, date);
  return projectSky(centralBodyVec(g, date), g);
}

// ─────────────────────────── Phenomenon snapshot ───────────────────────────

export interface DwarfPhenomenon {
  system: DwarfSystem;
  moon: DwarfMoon;
  type: PhenomenonType;
  /** instant of the snapshot (UTC). */
  time: Date;
  /** true ⇒ derived from a REAL position (Pluto); false ⇒ from an illustrative one. */
  phaseReal: boolean;
}

/**
 * The (moon, phenomenon) pairs geometrically active at `date` — a pure snapshot.
 * Returns null on an invalid date, [] when nothing is going on.
 *
 * HONESTY: these systems are UNRESOLVABLE from Earth (see §(A) in the header), so
 * this list is GEOMETRIC only and USUALLY EMPTY by design — that is the physics,
 * not a bug. For Eris/Haumea/Makemake the geometry is derived from an ILLUSTRATIVE
 * phase (`phaseReal` = false), so any flag there is illustrative too. No sub-minute
 * event scanner is provided: on this layer it would over-promise.
 */
export function currentDwarfPhenomena(
  system: DwarfSystem,
  date: Date
): DwarfPhenomenon[] | null {
  const positions = dwarfMoonPositions(system, date);
  if (positions === null) return null;
  const time = new Date(date.getTime());
  const out: DwarfPhenomenon[] = [];
  for (const p of positions) {
    const base = { system, moon: p.moon, time, phaseReal: p.phaseReal };
    if (p.inTransit) out.push({ ...base, type: "transit" });
    if (p.inShadowTransit) out.push({ ...base, type: "shadow_transit" });
    if (p.inOccultation) out.push({ ...base, type: "occultation" });
    if (p.inEclipse) out.push({ ...base, type: "eclipse" });
  }
  return out;
}

// ───────────────────── system geocentric RA/Dec + physical ──────────────────

export interface DwarfGeocentric {
  system: DwarfSystem;
  /** apparent geocentric right ascension [deg, 0–360) — REAL (SBDB mean elements). */
  raDeg: number;
  /** apparent geocentric declination [deg, −90…+90] — REAL. */
  decDeg: number;
  /** Earth–system distance [AU] — REAL. */
  distanceAU: number;
  /** apparent angular diameter of the CENTRAL BODY [arcsec] = 2·atan(R/Δ). */
  angularDiameterArcsec: number;
  /**
   * sub-Earth latitude on the moon-system plane [deg] — "how open" the system
   * looks. REAL for Pluto (its IAU pole); ILLUSTRATIVE for the others (adopted
   * plane) — see `tiltReal`.
   */
  systemTiltDeg: number;
  /** true ⇒ systemTiltDeg is real (Pluto); false ⇒ illustrative (others). */
  tiltReal: boolean;
  /**
   * true ⇒ the CENTRAL BODY's geocentric position/direction is real & cited (true
   * for ALL four — reused from lib/dwarf-planets SBDB mean elements). This is
   * distinct from `phaseReal`, which is about the MOONS' along-orbit positions.
   */
  positionReal: boolean;
  /** true ⇒ the MOONS carry real along-orbit positions (Pluto only). */
  phaseReal: boolean;
  /**
   * true always: the system is effectively UNRESOLVABLE from Earth (see the
   * angular diameter — Pluto's is ~0.1″). This is never an observable-events tab.
   */
  unresolvableFromEarth: boolean;
  /** honest one-line label for the UI. */
  note: string;
}

/**
 * A dwarf-planet system's apparent geocentric equatorial coordinates, distance,
 * central-body angular diameter and current system tilt at `date`. RA/Dec/distance
 * are REAL for all four systems (reused from lib/dwarf-planets.heliocentricPosition
 * − Earth, light-time corrected). Returns null on bad input.
 *
 * The frontend feeds {raDeg, decDeg} to lib/celestial.equatorialToHorizontal to
 * check the system's altitude, uses angularDiameterArcsec to see just how tiny the
 * disk is (unresolvable), and uses systemTiltDeg (honestly flagged by `tiltReal`)
 * to draw how open the moon system looks.
 */
export function dwarfGeocentric(
  system: DwarfSystem,
  date: Date
): DwarfGeocentric | null {
  if (!isValidDate(date)) return null;
  const g = computeGeometry(system, date);
  const data = DWARF_SYSTEMS[system];
  const reqAU = data.centralRadiusKm / AU_KM;
  const angularDiameterArcsec =
    2 * Math.atan(reqAU / g.distanceAU) * ARCSEC_PER_RAD;
  return {
    system,
    raDeg: g.raDeg,
    decDeg: g.decDeg,
    distanceAU: g.distanceAU,
    angularDiameterArcsec,
    systemTiltDeg: g.systemTiltDeg,
    tiltReal: g.tiltReal,
    positionReal: true,
    phaseReal: data.hasRealEphemeris,
    unresolvableFromEarth: true,
    note: data.note,
  };
}

// ─────────────────────────────── HUD snapshot ──────────────────────────────

export interface DwarfMoonsState {
  system: DwarfSystem;
  geocentric: DwarfGeocentric;
  positions: DwarfMoonPosition[];
  current: DwarfPhenomenon[];
  /** Pluto's offset from the barycenter (the wobble), plane of sky; null otherwise. */
  barycentricOffset: { x: number; y: number; z: number } | null;
  /** TIER-A flag: true ⇒ real moon positions (Pluto); false ⇒ illustrative phase. */
  hasRealEphemeris: boolean;
}

/**
 * Everything the "Dwarf Moons" HUD needs for one system in one pure call (mirrors
 * otherMoonsState): the system's geocentric coordinates + tilt, its moons' apparent
 * positions, the geometric phenomena in progress, Pluto's barycenter wobble, and
 * the data-tier flag. Null on a bad date.
 */
export function dwarfMoonsState(
  system: DwarfSystem,
  date: Date
): DwarfMoonsState | null {
  const geocentric = dwarfGeocentric(system, date);
  const positions = dwarfMoonPositions(system, date);
  const current = currentDwarfPhenomena(system, date);
  if (!geocentric || !positions || !current) return null;
  return {
    system,
    geocentric,
    positions,
    current,
    barycentricOffset: plutoBarycentricOffset(system, date),
    hasRealEphemeris: DWARF_SYSTEMS[system].hasRealEphemeris,
  };
}
