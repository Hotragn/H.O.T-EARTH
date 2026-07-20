/**
 * SCHEMATIC mutual-orbit configuration of real BINARY and MULTIPLE ASTEROID
 * systems — the physics library for the upcoming "Asteroid Moons" tab of the
 * digital twin. It is a sibling of lib/dwarf-moons.ts (Pluto / Eris / Haumea /
 * Makemake) and lib/other-moons.ts: every public function is a pure,
 * deterministic function of a JavaScript UTC `Date`, so it unit-tests cleanly
 * (lib/asteroid-moons.test.ts) and the react-three-fiber frontend consumes it
 * directly. Nothing is invented; every physical constant is cited (below).
 *
 * ── READ THIS FIRST: WHAT IS REAL vs WHAT IS SCHEMATIC ───────────────────────
 *
 *   Binary and multiple asteroids are REAL and numerous. What this library
 *   renders is a SCHEMATIC MUTUAL-ORBIT VIEW, NOT an Earth plane-of-sky
 *   projection — and the difference from the dwarf-moons / other-moons tabs is
 *   deliberate and honest:
 *
 *     • These systems are km-scale bodies AU away. They are UNRESOLVABLE in
 *       ordinary telescopes; the moons were found and their orbits measured by
 *       RADAR, ADAPTIVE OPTICS or SPACECRAFT (Galileo, Rosetta, DART, Lucy).
 *     • For MOST of them there is NO published Earth plane-of-sky POLE
 *       orientation for the mutual orbit, so — unlike the planet/dwarf moon tabs
 *       — this library does NOT attempt a plane-of-sky projection or any
 *       observer-visibility (transit / occultation / shadow) claim. It would be
 *       inventing a pole we do not have.
 *
 *   Instead we draw each SYSTEM in its own ADOPTED mutual-orbit plane: the
 *   primary at (≈) the barycenter, the moon(s) on their REAL-sized, REAL-period
 *   orbit around it. Concretely:
 *
 *     • REAL & CITED: every body's DIAMETER, the mutual-orbit SEPARATION
 *       (semi-major axis), the mutual PERIOD, the size ratios, the number of
 *       moons, and — the showcase — the DART-measured period change of Dimorphos.
 *     • SCHEMATIC / ADOPTED (flagged `phaseReal` = false for EVERY moon): the
 *       orientation of the orbit in space and the along-orbit PHASE. We adopt a
 *       common epoch (J2000) and a zero epoch phase, then let each body move at
 *       its REAL period. No full mutual-orbit ephemeris is used anywhere.
 *     • The orbit is modelled COPLANAR in the adopted plane (a 2-D mutual orbit);
 *       the third dimension / node is not pinned by data and is not fabricated.
 *
 *   Dactyl's orbit is additionally POORLY CONSTRAINED (a single 1993 Galileo
 *   flyby) — flagged `orbitUncertain` = true.
 *
 * ── THE BARYCENTER SPLIT (near-equal doubles vs small-moon systems) ──────────
 *
 *   We estimate each body's MASS from diameter³ (assuming equal bulk density),
 *   place the primary at the origin, each moon on its relative orbit r_rel, then
 *   express every body about the SYSTEM BARYCENTER R = Σ mᵢ·rᵢ / Σ mᵢ:
 *
 *     • SMALL-MOON systems (Ida/Dactyl, Kalliope/Linus, Sylvia, Kleopatra,
 *       Eugenia, Didymos) — the moon(s) are tiny, so the barycenter sits ~at the
 *       primary's centre and the primary is ~stationary (a real, tiny wobble).
 *     • NEAR-EQUAL DOUBLES (90 Antiope, 617 Patroclus) — the two components have
 *       comparable mass, so the barycenter lies BETWEEN them and BOTH bodies
 *       orbit empty space. The primary and secondary offsets are anti-phase with
 *       |primary offset| : |secondary offset| = m_secondary : m_primary. This is
 *       exactly how lib/dwarf-moons split Pluto–Charon.
 *
 *   Every system therefore returns the PRIMARY as a body too (role "primary"),
 *   at its real barycentric offset — negligible for the small-moon systems, a
 *   visible wobble for the near-equal doubles.
 *
 * ── COMETS HAVE NO MOONS (the big honesty point) ─────────────────────────────
 *
 *   There are ZERO confirmed comet moons. A comet nucleus is a few km across,
 *   low-gravity and actively outgassing — far too small to hold a gravitationally
 *   bound satellite. The closest phenomenon is a CONTACT BINARY: two lobes that
 *   touch and rotate as ONE body (comet 67P/Churyumov–Gerasimenko; the cold
 *   classical KBO 486958 Arrokoth). A contact binary is a SINGLE body, NOT a
 *   primary with a moon. Fragmenting comets (73P/Schwassmann–Wachmann 3,
 *   D/Shoemaker–Levy 9) produce FRAGMENTS, not moons. This is encoded as
 *   {@link COMET_CONTACT_BINARIES} + {@link COMET_MOONS_NOTE}; this library
 *   creates NO comet "moon".
 *
 * ── Sources (physics-env-simulation skill: real physics, documented, or it
 *    doesn't ship — no invented numbers) ─────────────────────────────────────
 *
 *   • 65803 Didymos + Dimorphos (NEO; DART/Hera) — Didymos 765 m (rot. 2.2593 h),
 *     Dimorphos ~160 m, separation ~1.19 km, mutual period 11.921 h BEFORE the
 *     DART impact (2022-09-26) and 11.372 h AFTER (shortened 32±2 min); near-
 *     circular RETROGRADE mutual orbit. Thomas et al. (2023) Nature 616:448;
 *     Daly et al. (2023) Nature 616:443.
 *   • 243 Ida + Dactyl (main belt; FIRST asteroid moon, Galileo 1993) — Ida mean
 *     ~31.4 km (irregular ~60×25×19 km), Dactyl ~1.4 km, separation ~108 km,
 *     period ~37 h. Orbit POORLY CONSTRAINED (single flyby). Belton et al. (1996).
 *   • 87 Sylvia + Romulus + Remus (main belt; first TRIPLE, 2005) — Sylvia ~286 km,
 *     Romulus ~24 km at 1356 km / 87.6 h, Remus ~7 km at 706 km / 33.1 h.
 *     Marchis et al. (2005) Nature 436:822.
 *   • 216 Kleopatra + Alexhelios + Cleoselene (main belt; "dog-bone" 276×94×78 km,
 *     mean ~135 km) — Alexhelios ~8.9 km at 678 km / 55.7 h, Cleoselene ~6.9 km at
 *     454 km / 29.8 h. Marchis et al. (2008); Descamps et al. (2011).
 *   • 90 Antiope (main belt Themis family; NEAR-EQUAL DOUBLE) — both components
 *     ~87.8 km, separation 171 km, period 16.5 h. Merline et al. (2000);
 *     Descamps et al. (2007).
 *   • 22 Kalliope + Linus (main belt) — Kalliope ~166 km, Linus ~28 km, separation
 *     1095 km, period 86.3 h. Merline et al. (2001); Margot & Brown (2003).
 *   • 45 Eugenia + Petit-Prince + S/2004 (45) 1 (main belt; moon found from the
 *     ground, 1998) — Eugenia ~206 km, Petit-Prince ~7 km at 1164 km / 113.2 h,
 *     S/2004 (45) 1 ~5 km at 611 km / 43 h. Merline et al. (1999); Marchis et al.
 *   • 617 Patroclus + Menoetius (Jupiter Trojan; NEAR-EQUAL DOUBLE; NASA Lucy
 *     flyby 2033) — Patroclus ~113 km, Menoetius ~104 km, separation 680 km,
 *     period 102.8 h (4.28 d). Marchis et al. (2006); Merline et al. (2001).
 *   • Contact binaries — 67P nucleus ~4.3×4.1 km bilobed (Rosetta 2014–2016);
 *     486958 Arrokoth two-lobe contact binary ~36 km long (New Horizons 2019).
 *
 * ── HONESTY: ACCURACY BOUND ──────────────────────────────────────────────────
 *
 *   REAL: diameters, separations, periods, size ratios, the DART period change,
 *   the mass-ratio barycenter split. SCHEMATIC (illustrative): the orbit's
 *   orientation and the along-orbit phase (`phaseReal` = false everywhere).
 *   Dactyl's orbit is poorly constrained. This is a system-configuration view,
 *   NOT an Earth plane-of-sky projection and NOT an observable-events predictor —
 *   we do not have the mutual-orbit poles and make no visibility claims.
 */

const DEG2RAD = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** Unix ms at the J2000 epoch = 2000-01-01 12:00 UTC — the adopted phase epoch. */
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

// ─────────────────────────────── DART showcase ──────────────────────────────

/**
 * The DART impact on Dimorphos: 2022-09-26 23:14 UTC. The mutual orbital period
 * dropped from 11.921 h to 11.372 h — a REAL, MEASURED, human-caused orbit
 * change (a step of ~32.9 min ≈ the reported 32±2 min). Thomas et al. (2023).
 */
export const DART_IMPACT_UNIX_MS = Date.UTC(2022, 8, 26, 23, 14, 0);
/** ISO-8601 UTC string of the DART impact (for the UI). */
export const DART_IMPACT_DATE_ISO = "2022-09-26T23:14:00Z";
/** Didymos–Dimorphos mutual period BEFORE the DART impact [hours] (Thomas 2023). */
export const DIDYMOS_PERIOD_PRE_DART_HOURS = 11.921;
/** Didymos–Dimorphos mutual period AFTER the DART impact [hours] (Thomas 2023). */
export const DIDYMOS_PERIOD_POST_DART_HOURS = 11.372;
/** The measured period change [minutes]: (11.921 − 11.372) h = ~32.9 min. */
export const DART_PERIOD_CHANGE_MINUTES =
  (DIDYMOS_PERIOD_PRE_DART_HOURS - DIDYMOS_PERIOD_POST_DART_HOURS) * 60;

// ─────────────────────────────── Identifiers ────────────────────────────────

/** The eight real binary/multiple asteroid systems this module serves. */
export type AsteroidSystem =
  | "Didymos"
  | "Ida"
  | "Sylvia"
  | "Kleopatra"
  | "Antiope"
  | "Kalliope"
  | "Eugenia"
  | "Patroclus";

/** Every moon (satellite) served here, across the eight systems. */
export type AsteroidMoon =
  | "Dimorphos"
  | "Dactyl"
  | "Romulus"
  | "Remus"
  | "Alexhelios"
  | "Cleoselene"
  | "AntiopeB"
  | "Linus"
  | "PetitPrince"
  | "S2004_45_1"
  | "Menoetius";

/** Dynamical population of the primary. */
export type AsteroidPopulation = "main-belt" | "NEO" | "Trojan";

// ─────────────────────────────── System table ───────────────────────────────

/**
 * Per-system primary + classification constants. Diameters and separations are
 * REAL/cited (km). `nearEqualDouble` toggles the barycenter split that makes both
 * components orbit empty space; `isTriple` means two moons (a triple system).
 */
export interface AsteroidSystemData {
  /** primary / system display name. */
  name: AsteroidSystem;
  /** minor-planet number (e.g. "65803" for Didymos). */
  designation: string;
  /** primary mean diameter [km] (see per-system citation). */
  primaryDiameterKm: number;
  /** honest note on the primary's (often very irregular) shape. */
  shapeNote: string;
  /** primary rotation period [hours] where cited (Didymos 2.2593 h); else null. */
  primaryRotationHours: number | null;
  /** dynamical population. */
  population: AsteroidPopulation;
  /** year the satellite / system was discovered. */
  discoveryYear: number;
  /** spacecraft mission associated with the system, or null. */
  mission: string | null;
  /** source citation for the system's physical data. */
  source: string;
  /** true ⇒ a TRIPLE system (primary + two moons). */
  isTriple: boolean;
  /** true ⇒ a NEAR-EQUAL DOUBLE — barycenter lies between the two components. */
  nearEqualDouble: boolean;
  /** true ⇒ the NASA DART target (Didymos). */
  dartTarget: boolean;
  /** true ⇒ hosts the FIRST confirmed asteroid moon (243 Ida / Dactyl). */
  firstAsteroidMoon: boolean;
  /** true ⇒ the FIRST confirmed triple asteroid (87 Sylvia). */
  firstTriple: boolean;
}

export const ASTEROID_SYSTEMS: Record<AsteroidSystem, AsteroidSystemData> = {
  Didymos: {
    name: "Didymos",
    designation: "65803",
    primaryDiameterKm: 0.765, // 765 m (Daly et al. 2023)
    shapeNote: "top-shaped oblate rubble pile; rotation 2.2593 h",
    primaryRotationHours: 2.2593,
    population: "NEO",
    discoveryYear: 2003, // Dimorphos detected 2003 (Didymos itself found 1996)
    mission: "NASA DART (impact 2022-09-26) + ESA Hera (rendezvous 2026)",
    source: "Thomas et al. (2023); Daly et al. (2023)",
    isTriple: false,
    nearEqualDouble: false,
    dartTarget: true,
    firstAsteroidMoon: false,
    firstTriple: false,
  },
  Ida: {
    name: "Ida",
    designation: "243",
    primaryDiameterKm: 31.4, // mean; irregular ~60×25×19 km
    shapeNote: "irregular ~60×25×19 km (S-type; Koronis family)",
    primaryRotationHours: null,
    population: "main-belt",
    discoveryYear: 1993, // Dactyl imaged by Galileo — the first asteroid moon
    mission: "Galileo flyby (1993)",
    source: "Belton et al. (1996)",
    isTriple: false,
    nearEqualDouble: false,
    dartTarget: false,
    firstAsteroidMoon: true,
    firstTriple: false,
  },
  Sylvia: {
    name: "Sylvia",
    designation: "87",
    primaryDiameterKm: 286,
    shapeNote: "large irregular P-type (Cybele region)",
    primaryRotationHours: null,
    population: "main-belt",
    discoveryYear: 2005, // Remus found 2005, confirming the first triple (Romulus 2001)
    mission: null,
    source: "Marchis et al. (2005)",
    isTriple: true,
    nearEqualDouble: false,
    dartTarget: false,
    firstAsteroidMoon: false,
    firstTriple: true,
  },
  Kleopatra: {
    name: "Kleopatra",
    designation: "216",
    primaryDiameterKm: 135, // mean; dog-bone 276×94×78 km
    shapeNote: 'elongated "dog-bone" ~276×94×78 km (M-type)',
    primaryRotationHours: null,
    population: "main-belt",
    discoveryYear: 2008,
    mission: null,
    source: "Marchis et al. (2008); Descamps et al. (2011)",
    isTriple: true,
    nearEqualDouble: false,
    dartTarget: false,
    firstAsteroidMoon: false,
    firstTriple: false,
  },
  Antiope: {
    name: "Antiope",
    designation: "90",
    primaryDiameterKm: 87.8, // both components ~87.8 km
    shapeNote: "near-equal double (Themis family); components ~87.8 km each",
    primaryRotationHours: null,
    population: "main-belt",
    discoveryYear: 2000,
    mission: null,
    source: "Merline et al. (2000); Descamps et al. (2007)",
    isTriple: false,
    nearEqualDouble: true,
    dartTarget: false,
    firstAsteroidMoon: false,
    firstTriple: false,
  },
  Kalliope: {
    name: "Kalliope",
    designation: "22",
    primaryDiameterKm: 166,
    shapeNote: "M-type; slightly elongated",
    primaryRotationHours: null,
    population: "main-belt",
    discoveryYear: 2001,
    mission: null,
    source: "Merline et al. (2001); Margot & Brown (2003)",
    isTriple: false,
    nearEqualDouble: false,
    dartTarget: false,
    firstAsteroidMoon: false,
    firstTriple: false,
  },
  Eugenia: {
    name: "Eugenia",
    designation: "45",
    primaryDiameterKm: 206,
    shapeNote: "F-type; low density (rubble pile)",
    primaryRotationHours: null,
    population: "main-belt",
    discoveryYear: 1998, // Petit-Prince — first asteroid moon found from the ground
    mission: null,
    source: "Merline et al. (1999); Marchis et al. (2007)",
    isTriple: true,
    nearEqualDouble: false,
    dartTarget: false,
    firstAsteroidMoon: false,
    firstTriple: false,
  },
  Patroclus: {
    name: "Patroclus",
    designation: "617",
    primaryDiameterKm: 113,
    shapeNote: "near-equal double Jupiter Trojan; primary ~113 km",
    primaryRotationHours: null,
    population: "Trojan",
    discoveryYear: 2001, // Menoetius resolved
    mission: "NASA Lucy flyby (2033)",
    source: "Marchis et al. (2006); Merline et al. (2001)",
    isTriple: false,
    nearEqualDouble: true,
    dartTarget: false,
    firstAsteroidMoon: false,
    firstTriple: false,
  },
};

// ─────────────────────────────── Moon table ─────────────────────────────────

export interface AsteroidMoonData {
  /** internal key. */
  name: AsteroidMoon;
  /** human display name (may include spaces / punctuation). */
  displayName: string;
  /** the primary this moon orbits. */
  parent: AsteroidSystem;
  /** moon diameter [km] (REAL/cited). */
  diameterKm: number;
  /**
   * mutual-orbit semi-major axis / separation [km] (REAL/cited). For a near-equal
   * double this is the separation between the two components.
   */
  semiMajorAxisKm: number;
  /**
   * mutual orbital period [hours] (REAL/cited). For Dimorphos this is the PRE-DART
   * value; see {@link periodHoursPostDart} and {@link didymosPeriodHours}.
   */
  periodHours: number;
  /**
   * post-DART mutual period [hours] — Dimorphos ONLY (11.372 h); null otherwise.
   */
  periodHoursPostDart: number | null;
  /** true ⇒ the DART-impacted mutual orbit (Dimorphos) — carries the step change. */
  dartImpact: boolean;
  /**
   * eccentricity [–]. Most of these mutual orbits are near-circular; where a value
   * is not well constrained we ADOPT 0 (documented, not invented). Flagged
   * illustrative by `phaseReal` = false along with the phase.
   */
  eccentricity: number;
  /** true ⇒ RETROGRADE mutual orbit (Dimorphos) — a real, cited fact. */
  retrograde: boolean;
  /**
   * ADOPTED epoch mean anomaly [deg]. 0 for EVERY moon — a documented illustrative
   * convention (this is exactly what `phaseReal` = false records). Not a real
   * ephemeris angle.
   */
  meanAnomalyEpochDeg: number;
  /**
   * ALWAYS false: the orbit's along-orbit phase and orientation are schematic /
   * adopted. Sizes, separations and periods are the real, cited quantities.
   */
  phaseReal: false;
  /** true ⇒ the mutual orbit itself is poorly constrained (Dactyl only). */
  orbitUncertain: boolean;
}

export const ASTEROID_MOONS: Record<AsteroidMoon, AsteroidMoonData> = {
  // ── 65803 Didymos + Dimorphos (NEO; the DART showcase) ──
  Dimorphos: {
    name: "Dimorphos",
    displayName: "Dimorphos",
    parent: "Didymos",
    diameterKm: 0.16, // ~160 m
    semiMajorAxisKm: 1.19, // ~1.19 km separation
    periodHours: DIDYMOS_PERIOD_PRE_DART_HOURS, // 11.921 h (pre-impact)
    periodHoursPostDart: DIDYMOS_PERIOD_POST_DART_HOURS, // 11.372 h (post-impact)
    dartImpact: true,
    eccentricity: 0.0, // near-circular
    retrograde: true, // retrograde mutual orbit
    meanAnomalyEpochDeg: 0.0, // adopted (illustrative)
    phaseReal: false,
    orbitUncertain: false,
  },

  // ── 243 Ida + Dactyl (first asteroid moon; orbit poorly constrained) ──
  Dactyl: {
    name: "Dactyl",
    displayName: "Dactyl",
    parent: "Ida",
    diameterKm: 1.4,
    semiMajorAxisKm: 108,
    periodHours: 37,
    periodHoursPostDart: null,
    dartImpact: false,
    eccentricity: 0.0, // unknown from a single flyby → adopted 0
    retrograde: false,
    meanAnomalyEpochDeg: 0.0,
    phaseReal: false,
    orbitUncertain: true, // single 1993 Galileo flyby — poorly constrained
  },

  // ── 87 Sylvia + Romulus + Remus (first triple) ──
  Remus: {
    name: "Remus",
    displayName: "Remus",
    parent: "Sylvia",
    diameterKm: 7,
    semiMajorAxisKm: 706,
    periodHours: 33.1,
    periodHoursPostDart: null,
    dartImpact: false,
    eccentricity: 0.0,
    retrograde: false,
    meanAnomalyEpochDeg: 0.0,
    phaseReal: false,
    orbitUncertain: false,
  },
  Romulus: {
    name: "Romulus",
    displayName: "Romulus",
    parent: "Sylvia",
    diameterKm: 24,
    semiMajorAxisKm: 1356,
    periodHours: 87.6,
    periodHoursPostDart: null,
    dartImpact: false,
    eccentricity: 0.0,
    retrograde: false,
    meanAnomalyEpochDeg: 0.0,
    phaseReal: false,
    orbitUncertain: false,
  },

  // ── 216 Kleopatra + Alexhelios + Cleoselene (dog-bone triple) ──
  Cleoselene: {
    name: "Cleoselene",
    displayName: "Cleoselene",
    parent: "Kleopatra",
    diameterKm: 6.9,
    semiMajorAxisKm: 454,
    periodHours: 29.8,
    periodHoursPostDart: null,
    dartImpact: false,
    eccentricity: 0.0,
    retrograde: false,
    meanAnomalyEpochDeg: 0.0,
    phaseReal: false,
    orbitUncertain: false,
  },
  Alexhelios: {
    name: "Alexhelios",
    displayName: "Alexhelios",
    parent: "Kleopatra",
    diameterKm: 8.9,
    semiMajorAxisKm: 678,
    periodHours: 55.7,
    periodHoursPostDart: null,
    dartImpact: false,
    eccentricity: 0.0,
    retrograde: false,
    meanAnomalyEpochDeg: 0.0,
    phaseReal: false,
    orbitUncertain: false,
  },

  // ── 90 Antiope (near-equal double) — the moon is the second component ──
  AntiopeB: {
    name: "AntiopeB",
    displayName: "Antiope B",
    parent: "Antiope",
    diameterKm: 87.8, // ≈ the primary → mass ratio ~1
    semiMajorAxisKm: 171,
    periodHours: 16.5,
    periodHoursPostDart: null,
    dartImpact: false,
    eccentricity: 0.0,
    retrograde: false,
    meanAnomalyEpochDeg: 0.0,
    phaseReal: false,
    orbitUncertain: false,
  },

  // ── 22 Kalliope + Linus ──
  Linus: {
    name: "Linus",
    displayName: "Linus",
    parent: "Kalliope",
    diameterKm: 28,
    semiMajorAxisKm: 1095,
    periodHours: 86.3,
    periodHoursPostDart: null,
    dartImpact: false,
    eccentricity: 0.0,
    retrograde: false,
    meanAnomalyEpochDeg: 0.0,
    phaseReal: false,
    orbitUncertain: false,
  },

  // ── 45 Eugenia + Petit-Prince + S/2004 (45) 1 ──
  S2004_45_1: {
    name: "S2004_45_1",
    displayName: "S/2004 (45) 1",
    parent: "Eugenia",
    diameterKm: 5,
    semiMajorAxisKm: 611,
    periodHours: 43,
    periodHoursPostDart: null,
    dartImpact: false,
    eccentricity: 0.0,
    retrograde: false,
    meanAnomalyEpochDeg: 0.0,
    phaseReal: false,
    orbitUncertain: false,
  },
  PetitPrince: {
    name: "PetitPrince",
    displayName: "Petit-Prince",
    parent: "Eugenia",
    diameterKm: 7,
    semiMajorAxisKm: 1164,
    periodHours: 113.2,
    periodHoursPostDart: null,
    dartImpact: false,
    eccentricity: 0.0,
    retrograde: false,
    meanAnomalyEpochDeg: 0.0,
    phaseReal: false,
    orbitUncertain: false,
  },

  // ── 617 Patroclus + Menoetius (near-equal double Trojan; Lucy target) ──
  Menoetius: {
    name: "Menoetius",
    displayName: "Menoetius",
    parent: "Patroclus",
    diameterKm: 104, // vs Patroclus 113 → mass ratio ~(104/113)³
    semiMajorAxisKm: 680,
    periodHours: 102.8, // 4.28 d
    periodHoursPostDart: null,
    dartImpact: false,
    eccentricity: 0.0,
    retrograde: false,
    meanAnomalyEpochDeg: 0.0,
    phaseReal: false,
    orbitUncertain: false,
  },
};

/** The moon(s) of each system, in orbital order (innermost → outermost). */
export const MOONS_BY_SYSTEM: Record<AsteroidSystem, readonly AsteroidMoon[]> = {
  Didymos: ["Dimorphos"],
  Ida: ["Dactyl"],
  Sylvia: ["Remus", "Romulus"],
  Kleopatra: ["Cleoselene", "Alexhelios"],
  Antiope: ["AntiopeB"],
  Kalliope: ["Linus"],
  Eugenia: ["S2004_45_1", "PetitPrince"],
  Patroclus: ["Menoetius"],
} as const;

/** The eight systems, in the pinned order (Didymos → Patroclus). */
export const SYSTEMS_LIST: readonly AsteroidSystem[] = [
  "Didymos",
  "Ida",
  "Sylvia",
  "Kleopatra",
  "Antiope",
  "Kalliope",
  "Eugenia",
  "Patroclus",
] as const;

// ────────────────────────── Comets: NO MOONS (honesty) ──────────────────────

/**
 * A CONTACT BINARY — two lobes that touch and rotate as ONE body. This is NOT a
 * primary-with-a-moon; it is a single object. Encoded here precisely so the UI
 * can show the closest comet/KBO phenomenon to a "binary" WITHOUT ever implying a
 * comet moon exists.
 */
export interface CometContactBinary {
  /** display name. */
  name: string;
  /** designation. */
  designation: string;
  /** what it is — a comet nucleus or a Kuiper-belt object. */
  bodyType: "comet" | "KBO";
  /** overall dimensions note [km]. */
  dimensionsNote: string;
  /** number of lobes (2 = bilobed). */
  lobeCount: number;
  /** the spacecraft that resolved it. */
  mission: string;
  /** ALWAYS true — a contact binary is a single body. */
  isContactBinary: true;
  /** ALWAYS true — it is one gravitationally coherent object, not two orbiting. */
  isSingleBody: true;
  /** ALWAYS false — it has NO moon (that is the whole point). */
  hasMoon: false;
  /** source citation. */
  source: string;
  /** honest one-line label for the UI. */
  note: string;
}

/**
 * The two canonical contact binaries. NEITHER has a moon: a contact binary is a
 * SINGLE body whose two lobes touch. Included to make the "comets have no moons"
 * fact concrete, not to model any satellite.
 */
export const COMET_CONTACT_BINARIES: Record<string, CometContactBinary> = {
  "67P": {
    name: "67P/Churyumov–Gerasimenko",
    designation: "67P",
    bodyType: "comet",
    dimensionsNote: "bilobed nucleus, ~4.3×4.1 km overall (two touching lobes)",
    lobeCount: 2,
    mission: "ESA Rosetta (2014–2016)",
    isContactBinary: true,
    isSingleBody: true,
    hasMoon: false,
    source: "Rosetta / Sierks et al. (2015)",
    note: "Contact binary: ONE body, two touching lobes — not a comet with a moon.",
  },
  Arrokoth: {
    name: "486958 Arrokoth",
    designation: "(486958) 2014 MU69",
    bodyType: "KBO",
    dimensionsNote: "two-lobe contact binary, ~36 km long (lobes ~21 and ~15 km)",
    lobeCount: 2,
    mission: "NASA New Horizons (flyby 2019)",
    isContactBinary: true,
    isSingleBody: true,
    hasMoon: false,
    source: "Stern et al. (2019); Spencer et al. (2020)",
    note: "Cold-classical KBO contact binary: ONE body — the closest small-body analogue, still not a moon.",
  },
};

/**
 * The headline honesty string for the tab. There are ZERO confirmed comet moons.
 */
export const COMET_MOONS_NOTE =
  "No comet is known to have a moon. A comet nucleus is only a few km across, " +
  "low-gravity and actively outgassing — far too small to hold a gravitationally " +
  "bound satellite. The closest phenomenon is a CONTACT BINARY (67P, Arrokoth): " +
  "two lobes that touch and rotate as one body — a SINGLE object, not a primary " +
  "with a moon. Fragmenting comets (73P, Shoemaker–Levy 9) shed FRAGMENTS, not " +
  "moons. This tab therefore models no comet moon.";

// ───────────────────────────── null-safety guards ──────────────────────────
// Contract (mirrors lib/dwarf-moons.ts & lib/other-moons.ts): a bad Date yields
// null (or [] for lists), never a throw — the renderer must survive bad input.

function isValidDate(date: unknown): date is Date {
  return date instanceof Date && Number.isFinite(date.getTime());
}

// ───────────────────────────── Kepler's equation ───────────────────────────

/**
 * Solve Kepler's equation M = E − e·sinE for the eccentric anomaly E (radians) by
 * Newton–Raphson. Every mutual orbit here is adopted near-circular (e = 0), so
 * this returns E ≈ M immediately; it is kept general and robust for any future
 * cited eccentricity. Mirrors lib/dwarf-moons.solveKepler.
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

// ─────────────────────────────── Didymos helper ─────────────────────────────

/**
 * The LIVE Didymos–Dimorphos mutual period at `date`, in hours — the real,
 * measured DART step change: {@link DIDYMOS_PERIOD_PRE_DART_HOURS} (11.921 h)
 * before the 2022-09-26 impact and {@link DIDYMOS_PERIOD_POST_DART_HOURS}
 * (11.372 h) at/after it. Returns null for an invalid date. This is the one place
 * a period is date-dependent — because the orbit genuinely changed.
 */
export function didymosPeriodHours(date: Date): number | null {
  if (!isValidDate(date)) return null;
  return date.getTime() >= DART_IMPACT_UNIX_MS
    ? DIDYMOS_PERIOD_POST_DART_HOURS
    : DIDYMOS_PERIOD_PRE_DART_HOURS;
}

/** The live mutual period [hours] to propagate a moon with — DART step for Dimorphos. */
function livePeriodHours(moon: AsteroidMoonData, date: Date): number {
  if (moon.name === "Dimorphos") {
    return date.getTime() >= DART_IMPACT_UNIX_MS
      ? DIDYMOS_PERIOD_POST_DART_HOURS
      : DIDYMOS_PERIOD_PRE_DART_HOURS;
  }
  return moon.periodHours;
}

// ─────────────────────────── Schematic orbit geometry ──────────────────────

/** A 2-D point in the adopted mutual-orbit plane. */
interface Vec2 {
  x: number;
  y: number;
}

/**
 * A moon's position RELATIVE TO THE PRIMARY at `date`, in km, in the adopted
 * mutual-orbit plane. Kepler-propagated at the REAL period (the live DART period
 * for Dimorphos) from the adopted J2000 epoch and zero epoch phase — an
 * ILLUSTRATIVE orientation/phase (`phaseReal` = false), NOT an ephemeris.
 * Retrograde orbits (Dimorphos) advance in the opposite sense.
 */
function moonRelativeKm(moon: AsteroidMoonData, date: Date): Vec2 {
  const periodDays = livePeriodHours(moon, date) / 24;
  const days = (date.getTime() - J2000_UNIX_MS) / DAY_MS;
  const dir = moon.retrograde ? -1 : 1;
  const M = moon.meanAnomalyEpochDeg * DEG2RAD + dir * TWO_PI * (days / periodDays);
  const e = moon.eccentricity;
  const E = solveKepler(M, e);
  const a = moon.semiMajorAxisKm;
  return {
    x: a * (Math.cos(E) - e),
    y: a * Math.sqrt(1 - e * e) * Math.sin(E),
  };
}

// ─────────────────────────── Body apparent positions ───────────────────────

/** A body (primary or moon) placed in the adopted mutual-orbit plane. */
export interface AsteroidBodyPosition {
  /** the system this body belongs to. */
  system: AsteroidSystem;
  /** display name (primary system name, or the moon's display name). */
  body: string;
  /** whether this is the PRIMARY or a MOON. */
  role: "primary" | "moon";
  /** X offset from the system BARYCENTER [km], in the adopted plane. */
  xKm: number;
  /** Y offset from the system BARYCENTER [km], in the adopted plane. */
  yKm: number;
  /** X offset in PRIMARY RADII (primaryDiameter/2) — for a size-aware UI. */
  xReq: number;
  /** Y offset in PRIMARY RADII. */
  yReq: number;
  /** this body's diameter [km] — so the UI can draw bodies to scale. */
  diameterKm: number;
  /** mutual-orbit separation [km] for a moon; null for the primary. */
  separationKm: number | null;
  /** live mutual period [hours] for a moon (DART step for Dimorphos); null for primary. */
  periodHours: number | null;
  /** ALWAYS false — the phase/orientation is schematic (see the module header). */
  phaseReal: false;
  /** true ⇒ the orbit is poorly constrained (Dactyl); false for the primary. */
  orbitUncertain: boolean;
}

/** Diameter³ mass proxy (equal-density assumption) — for the barycenter split. */
function massProxy(diameterKm: number): number {
  return diameterKm * diameterKm * diameterKm;
}

/**
 * Every body of a system placed about the barycenter at `date`: the PRIMARY first
 * (role "primary"), then the moon(s) in orbital order. The barycenter is the
 * diameter³-mass-weighted mean of the primary (at the origin) and each moon on its
 * relative orbit; every body is then expressed relative to that barycenter. For
 * small-moon systems the primary offset is a negligible real wobble; for the
 * near-equal doubles (Antiope, Patroclus) both components orbit empty space with
 * |primary offset| : |moon offset| = m_moon : m_primary.
 */
function systemBodies(system: AsteroidSystem, date: Date): AsteroidBodyPosition[] {
  const data = ASTEROID_SYSTEMS[system];
  const keys = MOONS_BY_SYSTEM[system];
  const primaryRadiusKm = data.primaryDiameterKm / 2;

  const primaryMass = massProxy(data.primaryDiameterKm);
  let totalMass = primaryMass;
  const rels = keys.map((k) => {
    const moon = ASTEROID_MOONS[k];
    const rel = moonRelativeKm(moon, date);
    const mass = massProxy(moon.diameterKm);
    totalMass += mass;
    return { moon, rel, mass };
  });

  // Barycenter (primary-centered frame, primary at origin) = Σ mᵢ·rᵢ / Σ mᵢ.
  let bx = 0;
  let by = 0;
  for (const r of rels) {
    bx += r.mass * r.rel.x;
    by += r.mass * r.rel.y;
  }
  bx /= totalMass;
  by /= totalMass;

  const out: AsteroidBodyPosition[] = [];

  // Primary at −barycenter (its offset from the barycenter).
  const px = -bx;
  const py = -by;
  out.push({
    system,
    body: data.name,
    role: "primary",
    xKm: px,
    yKm: py,
    xReq: px / primaryRadiusKm,
    yReq: py / primaryRadiusKm,
    diameterKm: data.primaryDiameterKm,
    separationKm: null,
    periodHours: null,
    phaseReal: false,
    orbitUncertain: false,
  });

  // Moons at (relative − barycenter).
  for (const r of rels) {
    const mx = r.rel.x - bx;
    const my = r.rel.y - by;
    out.push({
      system,
      body: r.moon.displayName,
      role: "moon",
      xKm: mx,
      yKm: my,
      xReq: mx / primaryRadiusKm,
      yReq: my / primaryRadiusKm,
      diameterKm: r.moon.diameterKm,
      separationKm: r.moon.semiMajorAxisKm,
      periodHours: livePeriodHours(r.moon, date),
      phaseReal: false,
      orbitUncertain: r.moon.orbitUncertain,
    });
  }

  return out;
}

/**
 * All bodies of a system (primary + moon(s)) in the adopted mutual-orbit plane at
 * `date`, about the barycenter, in km and primary-radii, drawn to scale. The
 * primary is the first element (role "primary"); moons follow in orbital order.
 * Returns null for an invalid date. Phase/orientation are schematic
 * (`phaseReal` = false); sizes / separations / periods are real (see the header).
 */
export function asteroidMoonPositions(
  system: AsteroidSystem,
  date: Date
): AsteroidBodyPosition[] | null {
  if (!isValidDate(date)) return null;
  return systemBodies(system, date);
}

/**
 * The apparent position of a single named MOON at `date` (null on bad input, or if
 * `moon` does not belong to `system`). Use {@link asteroidMoonPositions} to get the
 * primary and all moons together.
 */
export function asteroidMoonPosition(
  system: AsteroidSystem,
  moon: AsteroidMoon,
  date: Date
): AsteroidBodyPosition | null {
  if (!isValidDate(date)) return null;
  const data = ASTEROID_MOONS[moon];
  if (!data || data.parent !== system) return null;
  const bodies = systemBodies(system, date);
  return bodies.find((b) => b.role === "moon" && b.body === data.displayName) ?? null;
}

// ─────────────────────────────── HUD snapshot ──────────────────────────────

export interface AsteroidMoonsState {
  system: AsteroidSystem;
  /** the system's cited physical data. */
  systemData: AsteroidSystemData;
  /** primary + moon(s), about the barycenter (see {@link asteroidMoonPositions}). */
  positions: AsteroidBodyPosition[];
  /** the moon element records for this system. */
  moons: AsteroidMoonData[];
  /** true ⇒ a triple (primary + two moons). */
  isTriple: boolean;
  /** true ⇒ a near-equal double (both components orbit the barycenter). */
  nearEqualDouble: boolean;
  /**
   * live Didymos–Dimorphos mutual period [hours] reflecting the DART step change,
   * for the Didymos system only; null for every other system.
   */
  didymosPeriodHours: number | null;
  /**
   * ALWAYS false — a whole-system honesty flag: this is a schematic mutual-orbit
   * view, not an Earth plane-of-sky projection, and makes no visibility claims.
   */
  isPlaneOfSky: false;
}

/**
 * Everything the "Asteroid Moons" HUD needs for one system in one pure call
 * (mirrors dwarfMoonsState / otherMoonsState): the system's cited data, its bodies
 * placed about the barycenter, the moon records, the triple / near-equal-double
 * flags, and — for Didymos — the live DART-stepped mutual period. Null on a bad
 * date.
 */
export function asteroidMoonsState(
  system: AsteroidSystem,
  date: Date
): AsteroidMoonsState | null {
  const positions = asteroidMoonPositions(system, date);
  if (!positions) return null;
  const data = ASTEROID_SYSTEMS[system];
  return {
    system,
    systemData: data,
    positions,
    moons: MOONS_BY_SYSTEM[system].map((k) => ASTEROID_MOONS[k]),
    isTriple: data.isTriple,
    nearEqualDouble: data.nearEqualDouble,
    didymosPeriodHours: system === "Didymos" ? didymosPeriodHours(date) : null,
    isPlaneOfSky: false,
  };
}

// ─────────────────────────────── Time helpers ──────────────────────────────

/** Hours elapsed since the DART impact (negative before it) — for the UI timeline. */
export function hoursSinceDartImpact(date: Date): number | null {
  if (!isValidDate(date)) return null;
  return (date.getTime() - DART_IMPACT_UNIX_MS) / HOUR_MS;
}
