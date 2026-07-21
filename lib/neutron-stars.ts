/**
 * Physics for the NEUTRON STARS phase of the digital twin — a small, fully-cited
 * catalog of real neutron stars (pulsars, millisecond pulsars, a magnetar and the
 * double pulsar) plus the exact compact-object physics the "Neutron Stars" story
 * page and its interactive dials need.
 *
 * This layer REUSES the pinned physical constants (G, C, MSUN_KG, PC_M, …) from
 * `./black-holes` so the two compact-object pages agree to the last digit, and
 * adds neutron-star-specific formulas: density, surface gravity, escape velocity,
 * compactness, gravitational redshift, the (real) "you see more than half the
 * surface" light-bending fraction, spin frequency and equatorial velocity,
 * characteristic age, and spin-down luminosity.
 *
 * What ships:
 *   • NEUTRON_STARS — nine real objects, each with a measured spin period (and
 *     period derivative where published), surface magnetic field, distance, and a
 *     cited discovery story: PSR B1919+21 (the first pulsar), the Crab and Vela
 *     pulsars, PSR J0740+6620 (the most massive precisely-weighed neutron star),
 *     PSR B1257+12 (host of the first confirmed exoplanets), the PSR J0737-3039A/B
 *     double pulsar, PSR J1748-2446ad (the fastest known), the magnetar
 *     SGR 1806-20, and PSR B1937+21 (the first millisecond pulsar);
 *   • bulk physics: density (nuclear, ~2-6×10¹⁷ kg/m³), surface gravity, escape
 *     velocity as a fraction of c, compactness, gravitational redshift;
 *   • the documented light-bending "visible surface fraction" (Beloborodov 2002)
 *     — why neutron-star surface maps look "wrapped" and you see >½ the surface;
 *   • spin: frequency from period, equatorial velocity fraction of c;
 *   • spin-down: characteristic age P/(2Ṗ) and spin-down luminosity 4π²IṖ/P³;
 *   • order-of-magnitude comparison string helpers for density and magnetic field;
 *   • a one-call neutronStarState(id) bundle for the UI.
 *
 * ── Sources (physics-env-simulation: real physics + documented data, or it does
 *    not ship — no invented numbers) ────────────────────────────────────────────
 *
 *   CATALOG — periods, period derivatives, fields and distances are published
 *   measurements, cross-checked against the ATNF Pulsar Catalogue (Manchester et
 *   al. 2005, AJ 129, 1993) and the discovery papers:
 *     • PSR B1919+21 — the FIRST pulsar. P = 1.3373 s, dist ≈ 0.95 kpc. Discovered
 *       1967 by Jocelyn Bell Burnell & Antony Hewish (Cambridge/Mullard). Its
 *       stacked pulse profile is the Joy Division "Unknown Pleasures" (1979) cover
 *       art. (Hewish et al., Nature 217, 1968; ATNF.)
 *     • Crab Pulsar, PSR B0531+21 / J0534+2200. P = 33.6 ms, Ṗ ≈ 4.2×10⁻¹³,
 *       B ≈ 3.8×10¹² G, dist ≈ 2.0 kpc. In the Crab Nebula, remnant of SN 1054
 *       (historical age ≈ 970 yr). Powers the nebula's synchrotron glow.
 *       (Staelin & Reifenstein 1968; ATNF.)
 *     • Vela Pulsar, PSR B0833-45. P = 89.3 ms, Ṗ ≈ 1.25×10⁻¹³, B ≈ 3.4×10¹² G,
 *       dist ≈ 0.29 kpc. The archetypal GLITCHING pulsar (Large, Vaughan &
 *       Mills 1968; ATNF).
 *     • PSR J0740+6620 — the MOST MASSIVE precisely-measured neutron star,
 *       M = 2.08 ± 0.07 M☉ (Cromartie et al. 2020, Nat. Astron.; refined by
 *       Fonseca et al. 2021, ApJL 915, L12), NICER radius ≈ 12.4 km (Miller et al.
 *       2021; Riley et al. 2021). Millisecond pulsar, P = 2.886 ms, dist ≈ 1.14 kpc.
 *     • PSR B1257+12 ("Lich") — millisecond pulsar, P = 6.219 ms, dist ≈ 0.71 kpc.
 *       Host of the FIRST confirmed exoplanets (Draugr, Poltergeist, Phobetor),
 *       found by pulsar timing (Wolszczan & Frail 1992, Nature 355, 145).
 *     • PSR J0737-3039A/B — the only known DOUBLE PULSAR (both components pulse).
 *       A: P = 22.70 ms; B: P = 2.77 s. Dist ≈ 1.1 kpc. A premier strong-field
 *       test of general relativity. (Burgay et al. 2003, Nature 426, 531; Lyne et
 *       al. 2004, Science 303, 1153; Kramer et al. 2021, PRX 11, 041050.)
 *     • PSR J1748-2446ad — the FASTEST known pulsar, spin 716 Hz (P = 1.3959 ms),
 *       in globular cluster Terzan 5 (dist ≈ 5.5 kpc). Its equatorial surface moves
 *       at a large fraction of c. (Hessels et al. 2006, Science 311, 1901.)
 *     • SGR 1806-20 — a MAGNETAR, B ≈ 2×10¹⁵ G (among the strongest known),
 *       P ≈ 7.55 s. Its 2004-12-27 giant flare (≈2×10⁴⁶ erg isotropic) was the
 *       brightest extra-Solar event ever recorded. Dist debated (≈8.7 kpc, Bibby
 *       et al. 2008; historically quoted up to 15 kpc). (Palmer et al. 2005,
 *       Nature 434, 1107; Woods et al. 2007.)
 *     • PSR B1937+21 — the FIRST millisecond pulsar (Backer et al. 1982, Nature
 *       300, 615). P = 1.5578 ms, dist ≈ 3.5 kpc.
 *
 *   NEUTRON-STAR STRUCTURE ASSUMPTIONS (canonical values, flagged per object):
 *     • Canonical mass M = 1.4 M☉ and radius R = 12 km are ASSUMED where the object
 *       has no individual mass/radius measurement (flags `massAssumed` /
 *       `radiusAssumed`). 1.4 M☉ is the standard fiducial neutron-star mass; 12 km
 *       is a representative radius consistent with recent NICER results
 *       (≈11-13 km). Only PSR J0740+6620 has both a measured mass (2.08 M☉) and a
 *       NICER radius (≈12.4 km).
 *     • Moment of inertia I ≈ 1×10³⁸ kg m² — the standard fiducial for a 1.4 M☉,
 *       ~12 km neutron star (I ≈ 0.4 M R² for a stiff EoS gives ≈1.3×10³⁸;
 *       1×10³⁸ is the conventional round figure used for spin-down estimates). This
 *       is an ASSUMPTION, not a measurement; used only in spinDownLuminosityW.
 *
 *   FORMULAS (standard neutron-star physics; e.g. Shapiro & Teukolsky 1983,
 *   "Black Holes, White Dwarfs and Neutron Stars"; Lorimer & Kramer 2005,
 *   "Handbook of Pulsar Astronomy"):
 *     • density ρ = M / (4/3 π R³),
 *     • surface gravity g = GM/R²,
 *     • escape velocity v_esc = √(2GM/R); fraction of c = v_esc/c,
 *     • compactness = GM/(R c²)  (= ½ · r_s/R),
 *     • gravitational redshift z = 1/√(1 − 2GM/(R c²)) − 1,
 *     • visible surface fraction f = 1 / (2(1 − r_s/R))  [Beloborodov 2002, ApJ
 *       566, L85 — linear approximation cos α = (1−u)cos ψ + u, u = r_s/R],
 *     • spin frequency ν = 1/P; equatorial speed v_eq = 2πR/P,
 *     • characteristic age τ = P/(2Ṗ),
 *     • spin-down luminosity Ė = 4π² I Ṗ / P³,
 *     • order-of-magnitude surface field B ≈ 3.2×10¹⁹ √(P·Ṗ) gauss (dipole
 *       braking; used only in the surface-field estimator helper).
 *
 * ── Honesty / accuracy statement (label the UI truthfully) ─────────────────────
 *
 *   Catalog values are real measurements (ATNF Pulsar Catalogue + discovery
 *   papers), cited. Derived quantities use standard neutron-star physics. Where
 *   mass and/or radius are not individually measured, a canonical 1.4 M☉ / 12 km
 *   is ASSUMED and FLAGGED per object (`massAssumed`, `radiusAssumed`), so the
 *   density, gravity, redshift etc. for those stars are representative, not exact
 *   for that specific object. The lighthouse model (a misaligned magnetic dipole
 *   sweeps a beam past Earth → pulses) is real; the exact beam geometry is NOT
 *   modeled here — that is the renderer's illustrative job. Surface-field
 *   estimates from P and Ṗ are order-of-magnitude (dipole-braking assumption).
 *   Characteristic age τ = P/(2Ṗ) assumes braking index n = 3 and a very small
 *   birth period; for the Crab it gives ≈1250 yr versus the true historical age of
 *   ≈970 yr (SN 1054) — a real, well-known discrepancy, reported honestly, not
 *   hidden. Nothing here is invented.
 *
 *   Every public function is a pure, deterministic function of its inputs. Bad
 *   input (non-finite, non-positive mass/radius/period, an unphysical compactness
 *   ≥ ½, or an unknown id) returns null (or a null-filled bundle) — never NaN,
 *   never throws.
 */

import { C, G, MSUN_KG, PC_M } from "./black-holes";

// ─────────────────────────── Neutron-star constants ─────────────────────────

/** Canonical fiducial neutron-star mass [M☉] (standard textbook value). */
export const NS_CANONICAL_MASS_MSUN = 1.4;
/** Canonical fiducial neutron-star radius [km] (representative, ~11-13 km NICER). */
export const NS_CANONICAL_RADIUS_KM = 12;
/**
 * Fiducial moment of inertia I [kg m²] for a 1.4 M☉, ~12 km neutron star. This is
 * the conventional round value (I ≈ 10³⁸) used for spin-down estimates; the true
 * value is EoS-dependent (≈1-2×10³⁸). ASSUMPTION, not a measurement.
 */
export const NS_MOMENT_OF_INERTIA = 1e38;

/** Light-years in one kiloparsec (1 kpc = 1000 pc). */
const LY_PER_KPC = (1000 * PC_M) / 9.4607e15; // ≈ 3261.56 ly/kpc
/** Seconds in a Julian year. */
const SECONDS_PER_YEAR = 365.25 * 86400;

// ─────────────────────────── Internal helpers ───────────────────────────────

/** Finite, usable number? */
function isNum(x: number | null | undefined): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** Finite, strictly positive number? */
function isPos(x: number | null | undefined): x is number {
  return isNum(x) && x > 0;
}

/** Kiloparsecs → light-years. */
function kpcToLy(kpc: number): number {
  return kpc * LY_PER_KPC;
}

// ─────────────────────────── Catalog types ──────────────────────────────────

/** Broad class of a catalogued neutron star. */
export type NeutronStarType =
  | "pulsar"
  | "millisecond-pulsar"
  | "magnetar"
  | "binary-pulsar";

/** Stable identifiers for the catalogued objects. */
export type NeutronStarId =
  | "psr-b1919+21"
  | "crab"
  | "vela"
  | "psr-j0740+6620"
  | "psr-b1257+12"
  | "psr-j0737-3039a"
  | "psr-j1748-2446ad"
  | "sgr-1806-20"
  | "psr-b1937+21";

/** Discovery/notability-ordered id list for iterating the page. */
export const NEUTRON_STAR_IDS: readonly NeutronStarId[] = [
  "psr-b1919+21",
  "crab",
  "vela",
  "psr-j0740+6620",
  "psr-b1257+12",
  "psr-j0737-3039a",
  "psr-j1748-2446ad",
  "sgr-1806-20",
  "psr-b1937+21",
] as const;

/**
 * One catalogued neutron star. Spin period, period derivative and surface field
 * are cited measurements; mass and radius are measured where available, otherwise
 * the canonical 1.4 M☉ / 12 km fiducials with `massAssumed` / `radiusAssumed` set.
 */
export interface NeutronStar {
  /** stable id, e.g. "crab" */
  id: NeutronStarId;
  /** display name */
  name: string;
  /** catalogue / alternate designations */
  designations: string;
  /** physical class */
  type: NeutronStarType;
  /** spin period [s] */
  periodS: number;
  /** period derivative Ṗ [dimensionless, s/s] when published (else null) */
  periodDotSS: number | null;
  /** surface magnetic field [gauss] when known (else null) */
  magneticFieldGauss: number | null;
  /** distance from Earth [kpc] */
  distanceKpc: number;
  /** distance from Earth [light-years] (derived from kpc) */
  distanceLy: number;
  /** mass [M☉] — measured, or the canonical fiducial when massAssumed is true */
  massMsun: number;
  /** true ⇒ mass is the assumed 1.4 M☉ fiducial, not measured for this object */
  massAssumed: boolean;
  /** ± mass uncertainty [M☉] when measured (else null) */
  massUncertaintyMsun: number | null;
  /** radius [km] — measured, or the canonical fiducial when radiusAssumed is true */
  radiusKm: number;
  /** true ⇒ radius is the assumed 12 km fiducial, not measured for this object */
  radiusAssumed: boolean;
  /** year of discovery / detection */
  discoveryYear: number;
  /** discoverer / instrument */
  discoverer: string;
  /** short blurb for the UI */
  blurb: string;
  /** the real, cited note / story */
  note: string;
  /** citation string */
  source: string;
}

// ─────────────────────────── The catalog ────────────────────────────────────

/**
 * The catalogued neutron stars. Periods, period derivatives, fields and distances
 * are published measurements (see module header for the paper behind each row).
 * Mass/radius are canonical fiducials unless flagged measured.
 */
export const NEUTRON_STARS: Record<NeutronStarId, NeutronStar> = {
  // ── PSR B1919+21 — the first pulsar ─────────────────────────────────────────
  "psr-b1919+21": {
    id: "psr-b1919+21",
    name: "PSR B1919+21",
    designations: "PSR J1921+2153; CP 1919 (the discovery designation)",
    type: "pulsar",
    periodS: 1.3373,
    periodDotSS: 1.348e-15,
    magneticFieldGauss: 1.4e12,
    distanceKpc: 0.95,
    distanceLy: Math.round(kpcToLy(0.95)),
    massMsun: NS_CANONICAL_MASS_MSUN,
    massAssumed: true,
    massUncertaintyMsun: null,
    radiusKm: NS_CANONICAL_RADIUS_KM,
    radiusAssumed: true,
    discoveryYear: 1967,
    discoverer: "Jocelyn Bell Burnell & Antony Hewish (Cambridge/Mullard Radio Observatory)",
    blurb:
      "The first pulsar ever found — the discovery that revealed neutron stars are real.",
    note:
      "Detected in 1967 as a steady 1.337 s train of radio pulses (nicknamed 'LGM-1' before its natural origin was understood); it announced the existence of rotating neutron stars. Its stacked pulse profile is the artwork on Joy Division's 1979 album 'Unknown Pleasures'. Hewish shared the 1974 Nobel Prize; Bell Burnell, who first spotted it, was controversially omitted.",
    source:
      "Hewish, Bell, et al. (Nature 217, 1968); ATNF Pulsar Catalogue. P = 1.3373 s, dist ≈ 0.95 kpc.",
  },

  // ── Crab Pulsar — powers the Crab Nebula (SN 1054) ──────────────────────────
  crab: {
    id: "crab",
    name: "Crab Pulsar",
    designations: "PSR B0531+21; PSR J0534+2200",
    type: "pulsar",
    periodS: 0.0336,
    periodDotSS: 4.2e-13,
    magneticFieldGauss: 3.8e12,
    distanceKpc: 2.0,
    distanceLy: Math.round(kpcToLy(2.0)),
    massMsun: NS_CANONICAL_MASS_MSUN,
    massAssumed: true,
    massUncertaintyMsun: null,
    radiusKm: NS_CANONICAL_RADIUS_KM,
    radiusAssumed: true,
    discoveryYear: 1968,
    discoverer: "Staelin & Reifenstein (Arecibo/NRAO)",
    blurb:
      "The young pulsar in the Crab Nebula, spinning ~30 times a second and lighting up the remnant of SN 1054.",
    note:
      "Born in the supernova recorded by Chinese and other astronomers in 1054 CE (historical age ≈ 970 yr). Spinning ≈29.6 times per second, it pumps ≈4.5×10³¹ W of rotational energy into the surrounding nebula, making it glow across the whole spectrum. Its characteristic age P/(2Ṗ) ≈ 1250 yr overestimates the true age — a classic illustration that τ is only an order-of-magnitude clock.",
    source:
      "Staelin & Reifenstein (Science 162, 1968); ATNF. P = 33.6 ms, Ṗ ≈ 4.2×10⁻¹³, B ≈ 3.8×10¹² G, dist ≈ 2.0 kpc.",
  },

  // ── Vela Pulsar — the archetypal glitching pulsar ───────────────────────────
  vela: {
    id: "vela",
    name: "Vela Pulsar",
    designations: "PSR B0833-45; PSR J0835-4510",
    type: "pulsar",
    periodS: 0.0893,
    periodDotSS: 1.25e-13,
    magneticFieldGauss: 3.4e12,
    distanceKpc: 0.29,
    distanceLy: Math.round(kpcToLy(0.29)),
    massMsun: NS_CANONICAL_MASS_MSUN,
    massAssumed: true,
    massUncertaintyMsun: null,
    radiusKm: NS_CANONICAL_RADIUS_KM,
    radiusAssumed: true,
    discoveryYear: 1968,
    discoverer: "Large, Vaughan & Mills (Molonglo)",
    blurb:
      "The nearby Vela pulsar — the textbook example of a pulsar 'glitch'.",
    note:
      "Vela is the archetypal GLITCHING pulsar: it suddenly speeds up in discrete jumps (glitches) before resuming its steady spin-down, believed to be angular momentum transferred from a superfluid interior to the crust. It confirmed the supernova/pulsar connection, sitting inside the Vela supernova remnant ≈0.29 kpc away.",
    source:
      "Large, Vaughan & Mills (Nature 220, 1968); ATNF. P = 89.3 ms, Ṗ ≈ 1.25×10⁻¹³, B ≈ 3.4×10¹² G, dist ≈ 0.29 kpc.",
  },

  // ── PSR J0740+6620 — the most massive precisely-weighed neutron star ────────
  "psr-j0740+6620": {
    id: "psr-j0740+6620",
    name: "PSR J0740+6620",
    designations: "PSR J0740+6620",
    type: "millisecond-pulsar",
    periodS: 0.002886,
    periodDotSS: 1.2e-20,
    magneticFieldGauss: 1.9e8,
    distanceKpc: 1.14,
    distanceLy: Math.round(kpcToLy(1.14)),
    massMsun: 2.08,
    massAssumed: false,
    massUncertaintyMsun: 0.07,
    radiusKm: 12.4,
    radiusAssumed: false,
    discoveryYear: 2019,
    discoverer: "Cromartie et al. (Green Bank Telescope; NANOGrav)",
    blurb:
      "The most massive neutron star with a precise mass — 2.08 M☉ — and a NICER radius of ~12.4 km.",
    note:
      "A millisecond pulsar in a binary whose mass, M = 2.08 ± 0.07 M☉, is pinned by the Shapiro delay of its white-dwarf companion — the heaviest precisely-weighed neutron star known, pushing hard on the dense-matter equation of state. NASA's NICER X-ray telescope measured its radius at ≈12.4 km, showing that even this massive star is not much larger than a canonical one.",
    source:
      "Cromartie et al. (Nat. Astron. 4, 2020); Fonseca et al. (ApJL 915, L12, 2021); Miller et al. & Riley et al. (ApJL 918, 2021, NICER). M = 2.08±0.07 M☉, R ≈ 12.4 km, P = 2.886 ms.",
  },

  // ── PSR B1257+12 — host of the first confirmed exoplanets ───────────────────
  "psr-b1257+12": {
    id: "psr-b1257+12",
    name: "PSR B1257+12 (\"Lich\")",
    designations: "PSR B1257+12; PSR J1300+1240",
    type: "millisecond-pulsar",
    periodS: 0.006219,
    periodDotSS: 1.14e-19,
    magneticFieldGauss: 8.8e8,
    distanceKpc: 0.71,
    distanceLy: Math.round(kpcToLy(0.71)),
    massMsun: NS_CANONICAL_MASS_MSUN,
    massAssumed: true,
    massUncertaintyMsun: null,
    radiusKm: NS_CANONICAL_RADIUS_KM,
    radiusAssumed: true,
    discoveryYear: 1992,
    discoverer: "Aleksander Wolszczan & Dale Frail (Arecibo)",
    blurb:
      "The millisecond pulsar around which the first confirmed exoplanets were found — a full year before 51 Pegasi b.",
    note:
      "In 1992 Wolszczan & Frail found tiny periodic timing residuals betraying a planetary system: worlds later named Draugr, Poltergeist and Phobetor (the star itself is nicknamed 'Lich'). These were the FIRST confirmed exoplanets of any kind, discovered by pulsar timing rather than the transit or radial-velocity methods used for main-sequence stars.",
    source:
      "Wolszczan & Frail (Nature 355, 145, 1992); ATNF. P = 6.219 ms, dist ≈ 0.71 kpc.",
  },

  // ── PSR J0737-3039A — the double pulsar (A component) ───────────────────────
  "psr-j0737-3039a": {
    id: "psr-j0737-3039a",
    name: "PSR J0737-3039A/B (Double Pulsar)",
    designations: "PSR J0737-3039A (P = 22.70 ms) + PSR J0737-3039B (P = 2.77 s)",
    type: "binary-pulsar",
    periodS: 0.0227,
    periodDotSS: 1.74e-18,
    magneticFieldGauss: 6.3e9,
    distanceKpc: 1.1,
    distanceLy: Math.round(kpcToLy(1.1)),
    massMsun: 1.338, // A component pulsar mass, precisely measured
    massAssumed: false,
    massUncertaintyMsun: 0.001,
    radiusKm: NS_CANONICAL_RADIUS_KM,
    radiusAssumed: true,
    discoveryYear: 2003,
    discoverer: "Burgay et al. / Lyne et al. (Parkes)",
    blurb:
      "The only known double pulsar — two neutron stars both seen as pulsars, orbiting in 2.4 hours.",
    note:
      "The single system where BOTH neutron stars are detectable pulsars (A spins every 22.7 ms, B every 2.77 s), orbiting each other every 2.4 hours. Its rapid orbital decay, Shapiro delay and relativistic precession make it the finest strong-field laboratory for general relativity to date, confirming GR to ~0.01%. Component A's mass is measured to ≈1.338 M☉ (radius here is the canonical fiducial).",
    source:
      "Burgay et al. (Nature 426, 531, 2003); Lyne et al. (Science 303, 1153, 2004); Kramer et al. (PRX 11, 041050, 2021). A: P = 22.70 ms, M ≈ 1.338 M☉; dist ≈ 1.1 kpc.",
  },

  // ── PSR J1748-2446ad — the fastest known pulsar ─────────────────────────────
  "psr-j1748-2446ad": {
    id: "psr-j1748-2446ad",
    name: "PSR J1748-2446ad",
    designations: "PSR J1748-2446ad (Terzan 5 ad)",
    type: "millisecond-pulsar",
    periodS: 0.0013959,
    periodDotSS: null, // not reliably measured (eclipsing binary, low flux)
    magneticFieldGauss: null, // Ṗ unknown ⇒ no dipole-braking field estimate
    distanceKpc: 5.5,
    distanceLy: Math.round(kpcToLy(5.5)),
    massMsun: NS_CANONICAL_MASS_MSUN,
    massAssumed: true,
    massUncertaintyMsun: null,
    radiusKm: NS_CANONICAL_RADIUS_KM,
    radiusAssumed: true,
    discoveryYear: 2005, // discovered 2004-11, confirmed 2005 (published 2006)
    discoverer: "Jason Hessels et al. (Green Bank Telescope)",
    blurb:
      "The fastest-spinning pulsar known — 716 rotations every second.",
    note:
      "Spinning at 716 Hz (P = 1.3959 ms) in the globular cluster Terzan 5, it beat the 23-year record of PSR B1937+21. If its radius is the canonical ~12 km its equator moves at ≈18% of c; timing constrains the radius to < 16 km for M < 2 M☉, at which the widely-quoted figure of ≈24% of c applies. Its period derivative is not reliably measured (it is an eclipsing binary with low flux), so no surface-field estimate is given.",
    source:
      "Hessels et al. (Science 311, 1901, 2006). P = 1.3959 ms (716 Hz); R < 16 km; Terzan 5, dist ≈ 5.5 kpc.",
  },

  // ── SGR 1806-20 — a magnetar ────────────────────────────────────────────────
  "sgr-1806-20": {
    id: "sgr-1806-20",
    name: "SGR 1806-20",
    designations: "SGR 1806-20 (soft gamma repeater / magnetar)",
    type: "magnetar",
    periodS: 7.55,
    periodDotSS: 8.3e-11,
    magneticFieldGauss: 2e15,
    distanceKpc: 8.7,
    distanceLy: Math.round(kpcToLy(8.7)),
    massMsun: NS_CANONICAL_MASS_MSUN,
    massAssumed: true,
    massUncertaintyMsun: null,
    radiusKm: NS_CANONICAL_RADIUS_KM,
    radiusAssumed: true,
    discoveryYear: 1979,
    discoverer: "identified as a soft gamma repeater (Konus/Venera); magnetar model 1990s",
    blurb:
      "A magnetar with one of the strongest magnetic fields known — source of the brightest extra-Solar flare ever recorded.",
    note:
      "A slowly spinning (P ≈ 7.55 s) neutron star with a magnetic field of ≈2×10¹⁵ G — a quadrillion times Earth's. On 2004-12-27 it released a GIANT FLARE of ≈2×10⁴⁶ erg in a fraction of a second, the brightest event from beyond the Solar System ever detected; it measurably ionised Earth's upper atmosphere from ≈8.7 kpc away. Its distance was long quoted as ≈15 kpc and remains debated. Ṗ is large and variable (a representative value is stored).",
    source:
      "Palmer et al. (Nature 434, 1107, 2005); Woods et al. (2007); Bibby et al. (2008) distance ≈8.7 kpc. P ≈ 7.55 s, B ≈ 2×10¹⁵ G.",
  },

  // ── PSR B1937+21 — the first millisecond pulsar ─────────────────────────────
  "psr-b1937+21": {
    id: "psr-b1937+21",
    name: "PSR B1937+21",
    designations: "PSR B1937+21; PSR J1939+2134",
    type: "millisecond-pulsar",
    periodS: 0.0015578,
    periodDotSS: 1.05e-19,
    magneticFieldGauss: 4.1e8,
    distanceKpc: 3.5,
    distanceLy: Math.round(kpcToLy(3.5)),
    massMsun: NS_CANONICAL_MASS_MSUN,
    massAssumed: true,
    massUncertaintyMsun: null,
    radiusKm: NS_CANONICAL_RADIUS_KM,
    radiusAssumed: true,
    discoveryYear: 1982,
    discoverer: "Backer, Kulkarni, Heiles, Davis & Goss (Arecibo)",
    blurb:
      "The first millisecond pulsar ever found — 642 spins per second.",
    note:
      "Discovered in 1982 spinning at 642 Hz (P = 1.5578 ms), it opened the class of recycled millisecond pulsars — old neutron stars spun back up by accretion from a companion. It held the fastest-spin record for 23 years until PSR J1748-2446ad. Its extraordinary rotational stability makes such pulsars precision clocks used in pulsar-timing-array searches for gravitational waves.",
    source:
      "Backer et al. (Nature 300, 615, 1982); ATNF. P = 1.5578 ms, dist ≈ 3.5 kpc.",
  },
};

/** Look up a neutron star by id, or null. */
export function getNeutronStar(id: NeutronStarId | string): NeutronStar | null {
  return (NEUTRON_STARS as Record<string, NeutronStar>)[id] ?? null;
}

/** The catalog as an ordered array (notability/discovery order). */
export function neutronStars(): NeutronStar[] {
  return NEUTRON_STAR_IDS.map((id) => NEUTRON_STARS[id]);
}

// ─────────────────────────── Bulk properties ────────────────────────────────

/**
 * Mean density ρ = M / (4/3 π R³) [kg m⁻³] for a mass in solar masses and radius
 * in km. For the canonical 1.4 M☉ / 12 km this is ≈3.9×10¹⁷ kg/m³ — nuclear
 * density, so dense that a sugar-cube volume (1 cm³) weighs hundreds of millions
 * of tonnes. Null for non-positive/invalid mass or radius.
 */
export function densityKgM3(massMsun: number, radiusKm: number): number | null {
  if (!isPos(massMsun) || !isPos(radiusKm)) return null;
  const M = massMsun * MSUN_KG;
  const R = radiusKm * 1000; // m
  return M / ((4 / 3) * Math.PI * R * R * R);
}

/**
 * A plain-language comparison for a neutron-star density [kg m⁻³]: how much one
 * cubic centimetre of that material would weigh, in tonnes, alongside the classic
 * "a teaspoon outweighs a mountain" framing. Null for a non-positive/invalid
 * density.
 */
export function densityComparison(densityKgM3Value: number): string | null {
  if (!isPos(densityKgM3Value)) return null;
  const kgPerCm3 = densityKgM3Value * 1e-6; // 1 m³ = 1e6 cm³
  const tonnesPerCm3 = kgPerCm3 / 1000;
  return (
    `At ~${densityKgM3Value.toExponential(1)} kg/m³ (nuclear density), one cubic ` +
    `centimetre weighs ~${tonnesPerCm3.toExponential(1)} tonnes (~${kgPerCm3.toExponential(1)} kg) — ` +
    `a single teaspoon of neutron-star matter outweighs a mountain.`
  );
}

/**
 * Surface gravity g = GM/R² [m s⁻²] for a mass in solar masses and radius in km.
 * For the canonical 1.4 M☉ / 12 km this is ≈1.3×10¹² m/s² — about 130 billion
 * times Earth's gravity. Null for non-positive/invalid mass or radius.
 */
export function surfaceGravityMs2(
  massMsun: number,
  radiusKm: number
): number | null {
  if (!isPos(massMsun) || !isPos(radiusKm)) return null;
  const M = massMsun * MSUN_KG;
  const R = radiusKm * 1000;
  return (G * M) / (R * R);
}

/** Surface gravity expressed in Earth-g (g_Earth = 9.80665 m/s²), or null. */
export function surfaceGravityEarthG(
  massMsun: number,
  radiusKm: number
): number | null {
  const g = surfaceGravityMs2(massMsun, radiusKm);
  return g === null ? null : g / 9.80665;
}

/**
 * Escape velocity as a fraction of c: v_esc/c = √(2GM/R)/c, for mass in solar
 * masses and radius in km. For the canonical 1.4 M☉ / 12 km this is ≈0.59 — over
 * half the speed of light. Physically must be < 1 (compactness < ½); returns null
 * for bad input OR if the object is so compact that v_esc ≥ c (at/inside the
 * would-be horizon), which is unphysical for a real neutron star.
 */
export function escapeVelocityFractionC(
  massMsun: number,
  radiusKm: number
): number | null {
  if (!isPos(massMsun) || !isPos(radiusKm)) return null;
  const M = massMsun * MSUN_KG;
  const R = radiusKm * 1000;
  const frac = Math.sqrt((2 * G * M) / R) / C;
  return frac < 1 ? frac : null;
}

/**
 * Compactness GM/(R c²) (dimensionless) = ½ · r_s/R, for mass in solar masses and
 * radius in km. For the canonical 1.4 M☉ / 12 km this is ≈0.17; real neutron stars
 * sit around 0.15-0.3. Must be < ½ (else it would be a black hole); returns null
 * for bad input or a compactness ≥ ½. This is the master parameter behind redshift
 * and the visible-surface fraction.
 */
export function compactness(massMsun: number, radiusKm: number): number | null {
  if (!isPos(massMsun) || !isPos(radiusKm)) return null;
  const M = massMsun * MSUN_KG;
  const R = radiusKm * 1000;
  const x = (G * M) / (R * C * C);
  return x < 0.5 ? x : null;
}

/**
 * Gravitational redshift z = 1/√(1 − 2GM/(R c²)) − 1 of light leaving the surface,
 * for mass in solar masses and radius in km. For the canonical 1.4 M☉ / 12 km this
 * is ≈0.23 (a spectral line at the surface is stretched ~23% by the time it
 * reaches us). Null for bad input or a compactness ≥ ½ (would-be horizon).
 */
export function gravitationalRedshift(
  massMsun: number,
  radiusKm: number
): number | null {
  const u = compactness(massMsun, radiusKm); // = GM/(Rc²)
  if (u === null) return null;
  const inside = 1 - 2 * u; // = 1 - r_s/R
  if (inside <= 0) return null;
  return 1 / Math.sqrt(inside) - 1;
}

/**
 * Visible fraction of the neutron-star surface as seen by a distant observer.
 * Because the intense gravity bends light, you see MORE than half the surface;
 * points on the far side become visible. Using Beloborodov's (2002) widely-used
 * linear approximation, the maximum visible colatitude satisfies cos ψ = −u/(1−u)
 * with u = r_s/R = 2·compactness, giving a visible fraction f = 1/(2(1 − u)). For
 * the canonical 1.4 M☉ / 12 km, u ≈ 0.34 and f ≈ 0.76 — about three-quarters of
 * the surface. This is why neutron-star surface/hot-spot maps look "wrapped". The
 * result is capped at 1.0. Null for bad input or a compactness ≥ ½.
 *
 * Ref: Beloborodov (ApJ 566, L85, 2002).
 */
export function visibleSurfaceFraction(
  massMsun: number,
  radiusKm: number
): number | null {
  const comp = compactness(massMsun, radiusKm);
  if (comp === null) return null;
  const u = 2 * comp; // r_s / R
  if (u >= 1) return null;
  const f = 1 / (2 * (1 - u));
  return Math.min(f, 1);
}

// ─────────────────────────── Spin / rotation ────────────────────────────────

/**
 * Spin frequency ν = 1/P [Hz] for a spin period in seconds. Crab (33.6 ms) →
 * ≈29.8 Hz; Vela (89.3 ms) → ≈11.2 Hz; the fastest known (1.3959 ms) → ≈716 Hz.
 * Null for a non-positive/invalid period.
 */
export function spinFrequencyHz(periodS: number): number | null {
  if (!isPos(periodS)) return null;
  return 1 / periodS;
}

/**
 * Equatorial surface velocity as a fraction of c: v_eq/c = 2πR/(P·c), for a spin
 * period in seconds and radius in km. For the fastest pulsar (716 Hz) at a ~12 km
 * radius this is ≈0.18; at its ~16 km upper-limit radius it is the widely-quoted
 * ≈0.24. Returns null for bad input, or if the implied speed reaches/exceeds c
 * (unphysical). Assert result < 1.
 */
export function equatorialVelocityFractionC(
  periodS: number,
  radiusKm: number
): number | null {
  if (!isPos(periodS) || !isPos(radiusKm)) return null;
  const R = radiusKm * 1000;
  const v = (2 * Math.PI * R) / periodS; // m/s
  const frac = v / C;
  return frac < 1 ? frac : null;
}

// ─────────────────────────── Spin-down ──────────────────────────────────────

/**
 * Characteristic (spin-down) age τ = P/(2Ṗ) in YEARS, for a spin period in seconds
 * and a positive period derivative. This assumes braking index n = 3 and a birth
 * period far below the present one, so it is an ORDER-OF-MAGNITUDE clock: for the
 * Crab it gives ≈1250 yr against the true historical age of ≈970 yr (SN 1054).
 * Null for a non-positive/invalid period or period derivative.
 */
export function characteristicAgeYears(
  periodS: number,
  periodDotSS: number
): number | null {
  if (!isPos(periodS) || !isPos(periodDotSS)) return null;
  const seconds = periodS / (2 * periodDotSS);
  return seconds / SECONDS_PER_YEAR;
}

/**
 * Spin-down luminosity (rate of rotational-energy loss) Ė = 4π² I Ṗ / P³ [watts],
 * for a spin period in seconds, a positive period derivative, and moment of
 * inertia I [kg m²] (default NS_MOMENT_OF_INERTIA = 10³⁸, an ASSUMPTION). For the
 * Crab this is ≈4.5×10³¹ W — the power that lights up the Crab Nebula. Null for a
 * non-positive/invalid period, period derivative, or I.
 */
export function spinDownLuminosityW(
  periodS: number,
  periodDotSS: number,
  momentOfInertia: number = NS_MOMENT_OF_INERTIA
): number | null {
  if (!isPos(periodS) || !isPos(periodDotSS) || !isPos(momentOfInertia)) {
    return null;
  }
  return (4 * Math.PI * Math.PI * momentOfInertia * periodDotSS) /
    (periodS * periodS * periodS);
}

/**
 * Order-of-magnitude surface dipole magnetic field B ≈ 3.2×10¹⁹ √(P·Ṗ) gauss,
 * for a spin period in seconds and a positive period derivative. This is the
 * standard magnetic-dipole-braking estimate (assumes n = 3, a 45° inclination and
 * canonical R, I); it is an ORDER-OF-MAGNITUDE figure, not a direct measurement.
 * Null for a non-positive/invalid period or period derivative.
 */
export function surfaceMagneticFieldGauss(
  periodS: number,
  periodDotSS: number
): number | null {
  if (!isPos(periodS) || !isPos(periodDotSS)) return null;
  return 3.2e19 * Math.sqrt(periodS * periodDotSS);
}

// ─────────────────────────── Comparison strings ─────────────────────────────

/**
 * A plain-language ladder placing a magnetic field [gauss] among familiar
 * references: Earth's field ~0.5 G, a fridge magnet ~100 G, the strongest steady
 * laboratory field ~10⁶ G (~45 T), a typical pulsar ~10¹² G, a magnetar ~10¹⁵ G.
 * Null for a non-positive/invalid field.
 */
export function magneticFieldComparison(gauss: number): string | null {
  if (!isPos(gauss)) return null;
  let tier: string;
  if (gauss < 5) {
    tier = "comparable to Earth's magnetic field (~0.5 G)";
  } else if (gauss < 1e3) {
    tier = "around a fridge magnet (~100 G)";
  } else if (gauss < 1e9) {
    tier = "far beyond the strongest steady laboratory field (~10⁶ G, ~45 T)";
  } else if (gauss < 1e14) {
    tier = "a typical pulsar field (~10¹² G), a trillion times Earth's";
  } else {
    tier = "the magnetar regime (~10¹⁵ G) — among the strongest fields in the universe";
  }
  const versusEarth = gauss / 0.5;
  return (
    `~${gauss.toExponential(1)} G: ${tier}. That is ~${versusEarth.toExponential(1)}× ` +
    `Earth's surface field. For scale: Earth ~0.5 G, fridge magnet ~100 G, ` +
    `strongest steady lab magnet ~10⁶ G (~45 T), pulsar ~10¹² G, magnetar ~10¹⁵ G.`
  );
}

// ─────────────────────────── State bundle (UI) ──────────────────────────────

/** One-call snapshot of derived physics for a catalogued neutron star. */
export interface NeutronStarState {
  id: NeutronStarId;
  name: string;
  type: NeutronStarType;
  /** mass used [M☉] (measured or canonical fiducial) */
  massMsun: number;
  /** true ⇒ mass is the assumed 1.4 M☉ fiducial */
  massAssumed: boolean;
  /** radius used [km] (measured or canonical fiducial) */
  radiusKm: number;
  /** true ⇒ radius is the assumed 12 km fiducial */
  radiusAssumed: boolean;
  /** mean density [kg m⁻³] */
  densityKgM3: number | null;
  /** plain-language density comparison */
  densityComparison: string | null;
  /** surface gravity [m s⁻²] */
  surfaceGravityMs2: number | null;
  /** surface gravity in Earth-g */
  surfaceGravityEarthG: number | null;
  /** escape velocity as a fraction of c */
  escapeVelocityFractionC: number | null;
  /** compactness GM/(Rc²) */
  compactness: number | null;
  /** surface gravitational redshift z */
  gravitationalRedshift: number | null;
  /** fraction of surface visible (light bending) */
  visibleSurfaceFraction: number | null;
  /** spin frequency [Hz] */
  spinFrequencyHz: number | null;
  /** equatorial surface velocity as a fraction of c */
  equatorialVelocityFractionC: number | null;
  /** characteristic age P/(2Ṗ) [yr] (null when Ṗ unknown) */
  characteristicAgeYears: number | null;
  /** spin-down luminosity [W] (null when Ṗ unknown) */
  spinDownLuminosityW: number | null;
  /** magnetic field [gauss] (catalog value, else null) */
  magneticFieldGauss: number | null;
  /** plain-language magnetic-field comparison (null when field unknown) */
  magneticFieldComparison: string | null;
}

/**
 * Everything the UI needs for one catalogued neutron star, in a single pure call:
 * density (and its comparison), surface gravity, escape velocity, compactness,
 * gravitational redshift, visible surface fraction, spin frequency, equatorial
 * velocity, characteristic age, spin-down luminosity, and the magnetic-field
 * comparison. Bulk quantities use the object's measured mass/radius where
 * available and the canonical 1.4 M☉ / 12 km fiducials otherwise (see the per-
 * object `massAssumed` / `radiusAssumed` flags and the module honesty note). Null
 * for an unknown id.
 */
export function neutronStarState(
  id: NeutronStarId | string
): NeutronStarState | null {
  const ns = getNeutronStar(id);
  if (!ns) return null;
  const { massMsun: m, radiusKm: r, periodS: p, periodDotSS: pdot } = ns;
  const density = densityKgM3(m, r);
  return {
    id: ns.id,
    name: ns.name,
    type: ns.type,
    massMsun: m,
    massAssumed: ns.massAssumed,
    radiusKm: r,
    radiusAssumed: ns.radiusAssumed,
    densityKgM3: density,
    densityComparison: density === null ? null : densityComparison(density),
    surfaceGravityMs2: surfaceGravityMs2(m, r),
    surfaceGravityEarthG: surfaceGravityEarthG(m, r),
    escapeVelocityFractionC: escapeVelocityFractionC(m, r),
    compactness: compactness(m, r),
    gravitationalRedshift: gravitationalRedshift(m, r),
    visibleSurfaceFraction: visibleSurfaceFraction(m, r),
    spinFrequencyHz: spinFrequencyHz(p),
    equatorialVelocityFractionC: equatorialVelocityFractionC(p, r),
    characteristicAgeYears:
      pdot === null ? null : characteristicAgeYears(p, pdot),
    spinDownLuminosityW: pdot === null ? null : spinDownLuminosityW(p, pdot),
    magneticFieldGauss: ns.magneticFieldGauss,
    magneticFieldComparison:
      ns.magneticFieldGauss === null
        ? null
        : magneticFieldComparison(ns.magneticFieldGauss),
  };
}
