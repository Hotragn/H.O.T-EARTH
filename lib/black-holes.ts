/**
 * Physics for the BLACK HOLES phase of the digital twin — a small, fully-cited
 * catalog of real black holes plus the exact general-relativity geometry that
 * the "Black Holes" story page and its interactive dials need. This is a pure,
 * self-contained layer: no network, no keys, no imports from other physics libs
 * (the numbers here are simple enough to keep local and independently checkable).
 *
 * What ships:
 *   • BLACK_HOLES — six real objects, each with measured mass/distance/spin and
 *     a cited discovery story (Sgr A*, M87*, Cygnus X-1, Gaia BH1, GW150914,
 *     TON 618),
 *   • Schwarzschild geometry: event-horizon radius, photon sphere, ISCO,
 *     shadow diameter (and the black-hole SHADOW angular size, which reproduces
 *     the two EHT images — the headline validation),
 *   • gravitational time dilation vs radius (for the "dial the radius" UI),
 *   • tidal stretch (spaghettification) and the counter-intuitive fact that a
 *     supermassive hole has GENTLE tides at its horizon while a stellar one is
 *     lethal long before,
 *   • Hawking temperature and evaporation time (real theory, unobserved),
 *   • gravitational lensing: Einstein radius and light deflection (the classic
 *     1.75-arcsec solar-limb test), and
 *   • a one-call blackHoleState(id) bundle for the UI.
 *
 * ── Sources (physics-env-simulation: real physics + documented data, or it does
 *    not ship — no invented numbers) ────────────────────────────────────────────
 *
 *   CATALOG — every mass/distance/spin below is a published measurement:
 *     • Sagittarius A*: M = 4.297×10⁶ M☉ (±0.012×10⁶), distance 8277 pc
 *       (26,996 ly) — GRAVITY Collaboration, A&A 2023 (Abuter et al.). EHT
 *       shadow angular size 51.8 ± 2.3 µas — EHT Collaboration, ApJL 930 (2022,
 *       imaged 2022-05-12).
 *     • M87*: M = 6.5×10⁹ M☉ (±0.7×10⁹ systematic), distance 16.4 Mpc
 *       (≈53.5×10⁶ ly), ring diameter ≈42 µas, spin a* ≈ 0.9 — EHT Collaboration,
 *       ApJL 875 (2019, first image released 2019-04-10).
 *     • Cygnus X-1: M ≈ 21.2 M☉, distance ≈ 2.22 kpc (≈7240 ly) — Miller-Jones
 *       et al., Science 371 (2021). First stellar-mass black-hole candidate,
 *       identified as an X-ray binary in 1971.
 *     • Gaia BH1: M ≈ 9.62 M☉, distance ≈ 480 pc (≈1560 ly) — El-Badry et al.,
 *       MNRAS 518 (2023). Nearest known black hole; dormant (no accretion).
 *     • GW150914: 35.6 + 30.6 → 63.1 M☉ final, ≈3.1 M☉ radiated as gravitational
 *       waves, luminosity distance ≈ 440 Mpc (z≈0.09) — LIGO Scientific & Virgo,
 *       PRL 116 (2016; event 2015-09-14). First direct GW detection. (The
 *       discovery paper's rounded "36 + 29 → 62 M☉, 3 M☉ radiated" is the widely
 *       quoted form; the refined GWTC values are used for `mass`.)
 *     • TON 618: M ≈ 4.0×10¹⁰ M☉ (Shemmer et al. 2004 virial estimate; large
 *       uncertainty, method-dependent), redshift z ≈ 2.22 (light-travel ≈10.4
 *       Gly). One of the most massive black holes known.
 *
 *   PHYSICAL CONSTANTS (SI, CODATA / IAU):
 *     • G = 6.674×10⁻¹¹ m³ kg⁻¹ s⁻², c = 2.998×10⁸ m s⁻¹, M☉ = 1.989×10³⁰ kg
 *       (the values pinned for this module),
 *     • ℏ = 1.054571817×10⁻³⁴ J s, k_B = 1.380649×10⁻²³ J K⁻¹,
 *     • 1 ly = 9.4607×10¹⁵ m, 1 pc = 3.0857×10¹⁶ m, 1 AU = 1.495978707×10¹¹ m,
 *       R☉ = 6.957×10⁸ m.
 *
 *   FORMULAS (exact, textbook GR — e.g. Misner-Thorne-Wheeler; Bardeen 1973):
 *     • Schwarzschild radius r_s = 2GM/c²,
 *     • photon sphere r_ph = 1.5 r_s, ISCO r_isco = 3 r_s (Schwarzschild),
 *     • shadow angular radius = √27·GM/c², so shadow DIAMETER = 2√27·GM/c² =
 *       √27·r_s ≈ 5.196 r_s,
 *     • gravitational time-dilation factor = √(1 − r_s/r),
 *     • tidal (radial) acceleration gradient ≈ 2GM/r³ per metre of separation,
 *     • Hawking temperature T = ℏc³/(8π G M k_B),
 *     • evaporation time t = 5120 π G² M³/(ℏ c⁴),
 *     • Einstein radius θ_E = √(4GM/c² · D_LS/(D_L D_S)),
 *     • light deflection α = 4GM/(c² b).
 *
 * ── Honesty / accuracy statement (label the UI truthfully) ─────────────────────
 *
 *   Every catalog number is a real measurement with a source (EHT, GRAVITY,
 *   LIGO/Virgo, Gaia, quasar surveys). Every DERIVED quantity is EXACT
 *   Schwarzschild (NON-SPINNING) general relativity unless noted. Real black
 *   holes spin (the Kerr metric): spin shrinks the prograde ISCO (toward 1 r_s
 *   for an extremal hole vs 3 r_s here) and distorts/offsets the shadow — this
 *   module states that simplification but does NOT model it. M87* (a* ≈ 0.9) is
 *   substantially spinning, so its ISCO and shadow here are Schwarzschild
 *   approximations. Hawking radiation is real, well-founded theory but has NEVER
 *   been observed (astrophysical holes are far colder than the CMB and grow, not
 *   evaporate). Nothing here is invented.
 *
 *   Every public function is a pure, deterministic function of its inputs. Bad
 *   input (non-finite, non-positive mass/distance, at/inside the horizon, or an
 *   unknown id) returns null (or a null-filled bundle) — never NaN, never throws.
 */

// ─────────────────────────── Physical constants ─────────────────────────────

/** Gravitational constant G [m³ kg⁻¹ s⁻²] (value pinned for this module). */
export const G = 6.674e-11;
/** Speed of light c [m s⁻¹] (value pinned for this module). */
export const C = 2.998e8;
/** Solar mass M☉ [kg] (value pinned for this module). */
export const MSUN_KG = 1.989e30;
/** Reduced Planck constant ℏ [J s] (CODATA 2018). */
export const HBAR = 1.054571817e-34;
/** Boltzmann constant k_B [J K⁻¹] (CODATA 2018, exact). */
export const K_B = 1.380649e-23;

/** Metres in one light-year. */
export const LY_M = 9.4607e15;
/** Metres in one parsec. */
export const PC_M = 3.0857e16;
/** Metres in one astronomical unit (IAU 2012, exact). */
export const AU_M = 1.495978707e11;
/** Solar radius R☉ [m] (IAU nominal). */
export const RSUN_M = 6.957e8;

/** Radians → arcseconds. */
const RAD_TO_ARCSEC = 648000 / Math.PI; // = 180/π · 3600 ≈ 206264.806
/** Arcseconds → microarcseconds. */
const ARCSEC_TO_UAS = 1e6;
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

// ─────────────────────────── Catalog types ──────────────────────────────────

/** Broad physical class of a catalogued black hole. */
export type BlackHoleType =
  | "stellar"
  | "supermassive"
  | "ultramassive"
  | "merger";

/** Stable identifiers for the catalogued objects. */
export type BlackHoleId =
  | "sgr-a-star"
  | "m87-star"
  | "cygnus-x1"
  | "gaia-bh1"
  | "gw150914"
  | "ton-618";

/** Discovery/notability-ordered id list for iterating the page. */
export const BLACK_HOLE_IDS: readonly BlackHoleId[] = [
  "sgr-a-star",
  "m87-star",
  "cygnus-x1",
  "gaia-bh1",
  "gw150914",
  "ton-618",
] as const;

/**
 * One catalogued black hole: a cited mass and distance plus the story facts the
 * page needs. Distances are given in light-years always, and additionally in the
 * unit the source quotes (pc or Mpc) when that is the natural one.
 */
export interface BlackHole {
  /** stable id, e.g. "sgr-a-star" */
  id: BlackHoleId;
  /** display name, e.g. "Sagittarius A*" */
  name: string;
  /** physical class */
  type: BlackHoleType;
  /** mass in solar masses M☉ */
  massMsun: number;
  /** ± uncertainty on the mass [M☉], if the source gives one (else null) */
  massUncertaintyMsun: number | null;
  /** distance from Earth [light-years] */
  distanceLy: number;
  /** distance in parsecs, when the source quotes pc (else null) */
  distancePc: number | null;
  /** distance in megaparsecs, when the source quotes Mpc (else null) */
  distanceMpc: number | null;
  /** dimensionless spin a* ∈ [0,1] when known (else null) */
  spin: number | null;
  /** measured/observed shadow or ring angular size [µas] when imaged (else null) */
  observedShadowMicroarcsec: number | null;
  /** year of discovery / detection */
  discoveryYear: number;
  /** discovering instrument / collaboration / observer */
  discoveryInstrument: string;
  /** short blurb for the UI */
  blurb: string;
  /** the real, cited note / story */
  note: string;
  /** citation string */
  source: string;
}

// ─────────────────────────── The catalog ────────────────────────────────────

/**
 * The catalogued black holes. Every mass, distance, spin, and observed shadow is
 * a published measurement (see module header for the paper behind each row).
 */
export const BLACK_HOLES: Record<BlackHoleId, BlackHole> = {
  // ── Sagittarius A* — the Milky Way's central supermassive black hole ────────
  "sgr-a-star": {
    id: "sgr-a-star",
    name: "Sagittarius A*",
    type: "supermassive",
    massMsun: 4.297e6,
    massUncertaintyMsun: 0.012e6,
    distanceLy: 26996,
    distancePc: 8277,
    distanceMpc: null,
    spin: null, // not tightly constrained; left null rather than invented
    observedShadowMicroarcsec: 51.8,
    discoveryYear: 2022, // first EHT image (mass measured over decades of orbits)
    discoveryInstrument: "Event Horizon Telescope (GRAVITY/Keck stellar orbits)",
    blurb:
      "The 4.3-million-solar-mass black hole at the centre of our own galaxy, imaged by the EHT in 2022.",
    note:
      "Its mass and distance come from tracking individual stars (notably S2) orbiting the galactic centre for decades — work honoured with the 2020 Nobel Prize in Physics. The EHT imaged its shadow at 51.8 ± 2.3 µas on 2022-05-12.",
    source:
      "GRAVITY Collaboration (A&A 2023): M = 4.297±0.012×10⁶ M☉, R₀ = 8277 pc; EHT Collaboration (ApJL 930, 2022): shadow 51.8±2.3 µas.",
  },

  // ── M87* — the first black hole ever imaged ─────────────────────────────────
  "m87-star": {
    id: "m87-star",
    name: "M87*",
    type: "supermassive",
    massMsun: 6.5e9,
    massUncertaintyMsun: 0.7e9,
    distanceLy: 53.5e6,
    distancePc: null,
    distanceMpc: 16.4,
    spin: 0.9,
    observedShadowMicroarcsec: 42,
    discoveryYear: 2019, // first EHT image released 2019-04-10
    discoveryInstrument: "Event Horizon Telescope",
    blurb:
      "The 6.5-billion-solar-mass giant in galaxy Messier 87 — the first black hole humanity ever saw.",
    note:
      "Released 2019-04-10, the glowing ring around M87* (≈42 µas across) was the first direct image of a black hole's shadow. Its jet and asymmetric ring imply a high spin (a* ≈ 0.9).",
    source:
      "EHT Collaboration (ApJL 875, 2019): M ≈ 6.5±0.7×10⁹ M☉, D ≈ 16.4 Mpc, ring ≈ 42 µas; spin a* ≈ 0.9 inferred.",
  },

  // ── Cygnus X-1 — the first stellar-mass black hole discovered ───────────────
  "cygnus-x1": {
    id: "cygnus-x1",
    name: "Cygnus X-1",
    type: "stellar",
    massMsun: 21.2,
    massUncertaintyMsun: 2.2,
    distanceLy: 7240,
    distancePc: 2220,
    distanceMpc: null,
    spin: 0.95, // near-extremal, from continuum-fitting (Miller-Jones et al. 2021)
    observedShadowMicroarcsec: null,
    discoveryYear: 1971, // identified as a black-hole candidate
    discoveryInstrument: "Uhuru X-ray satellite (X-ray binary)",
    blurb:
      "The first object widely accepted as a black hole — a ~21 M☉ hole devouring a blue-supergiant companion.",
    note:
      "Discovered as a bright X-ray source and identified in 1971 as the first stellar-mass black-hole candidate; it was the subject of the famous 1974 Hawking-Thorne bet. A 2021 VLBA parallax revised it to ≈21 M☉ at ≈2.22 kpc, spinning near-maximally.",
    source:
      "Miller-Jones et al. (Science 371, 2021): M ≈ 21.2 M☉, D ≈ 2.22 kpc, a* > 0.95. Discovery: X-ray binary, 1971.",
  },

  // ── Gaia BH1 — the nearest known black hole ─────────────────────────────────
  "gaia-bh1": {
    id: "gaia-bh1",
    name: "Gaia BH1",
    type: "stellar",
    massMsun: 9.62,
    massUncertaintyMsun: 0.18,
    distanceLy: 1560,
    distancePc: 480,
    distanceMpc: null,
    spin: null,
    observedShadowMicroarcsec: null,
    discoveryYear: 2022,
    discoveryInstrument: "ESA Gaia astrometry (Sun-like companion wobble)",
    blurb:
      "The closest known black hole to Earth — a dormant ~9.6 M☉ hole orbited by a Sun-like star.",
    note:
      "Found in 2022 from the astrometric wobble it induces on a Sun-like companion in Gaia data. It is DORMANT: not accreting, emitting no X-rays — a black hole betrayed only by its gravity, ≈480 pc away.",
    source:
      "El-Badry et al. (MNRAS 518, 2023): M ≈ 9.62 M☉, D ≈ 480 pc. Nearest known black hole; dormant.",
  },

  // ── GW150914 — the first gravitational-wave detection ───────────────────────
  gw150914: {
    id: "gw150914",
    name: "GW150914",
    type: "merger",
    massMsun: 63.1, // final remnant mass (GWTC refined values)
    massUncertaintyMsun: 3.4,
    distanceLy: 1.4e9, // ≈440 Mpc luminosity distance
    distancePc: null,
    distanceMpc: 440,
    spin: 0.67, // final remnant spin a*
    observedShadowMicroarcsec: null,
    discoveryYear: 2015, // event 2015-09-14 (announced 2016)
    discoveryInstrument: "LIGO (Hanford + Livingston)",
    blurb:
      "The first gravitational waves ever detected: two black holes (≈36 + 29 M☉) merging ≈1.3 billion years ago.",
    note:
      "On 2015-09-14 LIGO caught the chirp of a ≈36 + 29 M☉ binary merging into a ≈62 M☉ black hole, radiating ≈3 M☉ of mass as gravitational-wave energy in a fraction of a second — the peak power briefly exceeded that of all the stars in the observable universe. `massMsun` stores the refined ≈63 M☉ remnant.",
    source:
      "LIGO Scientific & Virgo (PRL 116, 2016): 36+29→62 M☉, ~3 M☉ radiated, D_L ≈ 440 Mpc; remnant M ≈ 63.1 M☉, a* ≈ 0.67 (GWTC).",
  },

  // ── TON 618 — an ultramassive quasar black hole ─────────────────────────────
  "ton-618": {
    id: "ton-618",
    name: "TON 618",
    type: "ultramassive",
    massMsun: 4.0e10,
    massUncertaintyMsun: null, // virial estimate; uncertainty large and method-dependent
    distanceLy: 1.04e10, // ≈10.4 Gly light-travel distance at z≈2.22
    distancePc: null,
    distanceMpc: null,
    spin: null,
    observedShadowMicroarcsec: null,
    discoveryYear: 2004, // mass estimated (quasar catalogued far earlier)
    discoveryInstrument: "Optical quasar spectroscopy (H-beta virial mass)",
    blurb:
      "One of the most massive black holes known — a ~40-billion-solar-mass monster powering a distant quasar.",
    note:
      "TON 618 is a hyperluminous quasar at z ≈ 2.22 (light-travel ≈10.4 Gly). Its black-hole mass, ≈4×10¹⁰ M☉, is a VIRIAL estimate from the broad H-beta emission line and carries a large, method-dependent uncertainty — it is a headline number, not a precise weighing.",
    source:
      "Shemmer et al. (ApJ 614, 2004) virial mass ≈4×10¹⁰ M☉; z ≈ 2.22. Uncertainty large (virial method).",
  },
};

/** Look up a black hole by id, or null. */
export function getBlackHole(id: BlackHoleId | string): BlackHole | null {
  return (BLACK_HOLES as Record<string, BlackHole>)[id] ?? null;
}

/** The catalog as an ordered array (notability/discovery order). */
export function blackHoles(): BlackHole[] {
  return BLACK_HOLE_IDS.map((id) => BLACK_HOLES[id]);
}

// ─────────────────────────── Schwarzschild geometry ─────────────────────────

/**
 * Schwarzschild radius (event-horizon radius) r_s = 2GM/c² [metres] for a mass
 * in solar masses. This is where escape velocity reaches c. Sgr A* ≈ 1.27×10¹⁰ m
 * (≈0.085 AU); M87* ≈ 1.9×10¹³ m (≈128 AU); a 10 M☉ hole ≈ 30 km. Null for a
 * non-positive/invalid mass.
 */
export function schwarzschildRadiusM(massMsun: number): number | null {
  if (!isPos(massMsun)) return null;
  return (2 * G * (massMsun * MSUN_KG)) / (C * C);
}

/** Schwarzschild radius in kilometres, or null. */
export function schwarzschildRadiusKm(massMsun: number): number | null {
  const r = schwarzschildRadiusM(massMsun);
  return r === null ? null : r / 1000;
}

/** Schwarzschild radius in astronomical units, or null. */
export function schwarzschildRadiusAU(massMsun: number): number | null {
  const r = schwarzschildRadiusM(massMsun);
  return r === null ? null : r / AU_M;
}

/** Schwarzschild radius in solar radii, or null. */
export function schwarzschildRadiusRsun(massMsun: number): number | null {
  const r = schwarzschildRadiusM(massMsun);
  return r === null ? null : r / RSUN_M;
}

/**
 * Photon-sphere radius r_ph = 1.5 r_s [metres] — the (unstable) circular-orbit
 * radius for light. Null on bad mass.
 */
export function photonSphereM(massMsun: number): number | null {
  const r = schwarzschildRadiusM(massMsun);
  return r === null ? null : 1.5 * r;
}

/**
 * Innermost stable circular orbit r_isco = 3 r_s [metres] for a NON-spinning
 * (Schwarzschild) hole — the inner edge of a stable accretion disk. NOTE: for a
 * spinning (Kerr) hole the prograde ISCO shrinks (down to ≈1 r_s for an extremal
 * spin), so this is a lower bound on disk radius only in the non-spinning limit.
 * Null on bad mass.
 */
export function iscoM(massMsun: number): number | null {
  const r = schwarzschildRadiusM(massMsun);
  return r === null ? null : 3 * r;
}

/**
 * Diameter of the black-hole SHADOW [metres]. The shadow angular RADIUS is
 * √27·GM/c², so the shadow DIAMETER is 2√27·GM/c² = √27·r_s ≈ 5.196 r_s. Null on
 * bad mass.
 */
export function shadowDiameterM(massMsun: number): number | null {
  const r = schwarzschildRadiusM(massMsun);
  return r === null ? null : Math.sqrt(27) * r;
}

/**
 * Angular size (DIAMETER) of the black-hole shadow as seen from a distance,
 * in microarcseconds: (shadow diameter / distance) converted to µas. The distance
 * may be given in any one unit — pass whichever the caller has. THE headline
 * validation: this reproduces the EHT images — Sgr A* ≈ 52 µas and M87* ≈ 42 µas.
 * Null for a non-positive/invalid mass or distance.
 */
export function shadowAngularSizeMicroarcsec(
  massMsun: number,
  distance: number,
  unit: "m" | "ly" | "pc" | "Mpc" = "ly"
): number | null {
  if (!isPos(massMsun) || !isPos(distance)) return null;
  const diameterM = shadowDiameterM(massMsun);
  if (diameterM === null) return null;
  const factor =
    unit === "m" ? 1 : unit === "ly" ? LY_M : unit === "pc" ? PC_M : PC_M * 1e6;
  const distanceM = distance * factor;
  const angleRad = diameterM / distanceM; // small-angle: θ ≈ size/distance
  return angleRad * RAD_TO_ARCSEC * ARCSEC_TO_UAS;
}

// ─────────────────────────── Time dilation ──────────────────────────────────

/**
 * Gravitational time-dilation factor at a radius r, given as a MULTIPLE of the
 * Schwarzschild radius: √(1 − r_s/r) = √(1 − 1/(r/r_s)). This is the rate at
 * which a static clock at r ticks relative to one infinitely far away (→ 1). At
 * r = 2 r_s it is ≈0.707; it → 0 as r → r_s and is undefined at or inside the
 * horizon. Returns null for rOverRs ≤ 1 or invalid input (the "dial the radius"
 * UI should clamp to r > r_s). For the interactive dial.
 */
export function gravitationalTimeDilation(rOverRs: number): number | null {
  if (!isNum(rOverRs) || rOverRs <= 1) return null;
  return Math.sqrt(1 - 1 / rOverRs);
}

// ─────────────────────────── Tides / spaghettification ──────────────────────

/**
 * Radial tidal acceleration per metre of separation ≈ 2GM/r³ [s⁻²] at a
 * distance r [metres] from a hole of the given mass — the differential pull that
 * stretches an infalling body ("spaghettification"). Null for non-positive mass
 * or radius.
 */
export function tidalAccelerationPerMeter(
  massMsun: number,
  rM: number
): number | null {
  if (!isPos(massMsun) || !isPos(rM)) return null;
  return (2 * G * (massMsun * MSUN_KG)) / (rM * rM * rM);
}

/**
 * Result of the spaghettification check: how strong the tide is AT the event
 * horizon, and whether a human would be torn apart BEFORE crossing it. This
 * captures the real, counter-intuitive fact that tides at the horizon WEAKEN
 * with mass — a supermassive hole is gentle at its horizon, a stellar one lethal.
 */
export interface SpaghettificationResult {
  /** tidal gradient at the horizon [s⁻² per metre] */
  tidalAtHorizonPerMeter: number;
  /** approx. stretching acceleration across a ~1.8 m human at the horizon [m/s²] */
  humanStretchAtHorizonMs2: number;
  /** true ⇒ a human is torn apart BEFORE reaching the horizon (stellar-mass regime) */
  spaghettifiedBeforeHorizon: boolean;
  /** plain-language explanation */
  note: string;
}

/**
 * A helper for the UI: would a human be spaghettified before or after crossing
 * the horizon? Tides at the horizon scale as 1/M² (since r_s ∝ M and tide ∝
 * M/r³), so small holes have brutal horizon tides and supermassive ones have mild
 * ones. We flag "torn apart before the horizon" when the stretch across a ~1.8 m
 * body at the horizon exceeds a lethal threshold (~10⁶ m/s², far past the body's
 * tensile limit). Null for a non-positive/invalid mass.
 */
export function spaghettificationCheck(
  massMsun: number,
  humanHeightM = 1.8,
  lethalStretchMs2 = 1e6
): SpaghettificationResult | null {
  const rs = schwarzschildRadiusM(massMsun);
  if (rs === null || !isPos(humanHeightM)) return null;
  const tidalAtHorizon = tidalAccelerationPerMeter(massMsun, rs);
  if (tidalAtHorizon === null) return null;
  const humanStretch = tidalAtHorizon * humanHeightM;
  const before = humanStretch > lethalStretchMs2;
  return {
    tidalAtHorizonPerMeter: tidalAtHorizon,
    humanStretchAtHorizonMs2: humanStretch,
    spaghettifiedBeforeHorizon: before,
    note: before
      ? "Stellar-mass regime: the tide at the horizon is lethal — a human is torn apart (spaghettified) well BEFORE crossing it."
      : "Supermassive regime: the tide at the horizon is gentle — a human could cross the event horizon intact and only be stretched fatally much deeper inside.",
  };
}

// ─────────────────────────── Hawking radiation ──────────────────────────────

/**
 * Hawking temperature T = ℏc³/(8π G M k_B) [kelvin] for a mass in solar masses.
 * Higher for SMALLER masses; for a solar-mass hole it is ≈6×10⁻⁸ K — far below
 * the 2.7 K CMB, so real astrophysical holes ABSORB more than they emit and grow.
 * Real theory, never observed. Null for non-positive/invalid mass.
 */
export function hawkingTemperatureK(massMsun: number): number | null {
  if (!isPos(massMsun)) return null;
  const M = massMsun * MSUN_KG;
  return (HBAR * C * C * C) / (8 * Math.PI * G * M * K_B);
}

/**
 * Black-hole evaporation time via Hawking radiation, t = 5120 π G² M³/(ℏ c⁴),
 * in YEARS. For a solar-mass hole this is ≈2×10⁶⁷ years — vastly longer than the
 * age of the universe (~1.4×10¹⁰ yr). Real theory, never observed. Null for
 * non-positive/invalid mass.
 */
export function evaporationTimeYears(massMsun: number): number | null {
  if (!isPos(massMsun)) return null;
  const M = massMsun * MSUN_KG;
  const seconds = (5120 * Math.PI * G * G * M * M * M) / (HBAR * C * C * C * C);
  return seconds / SECONDS_PER_YEAR;
}

// ─────────────────────────── Gravitational lensing ──────────────────────────

/**
 * Einstein radius θ_E = √(4GM/c² · D_LS/(D_L·D_S)) in ARCSECONDS, for a point
 * lens of mass `lensMassMsun` with observer-lens, observer-source, and
 * lens-source distances given in PARSECS. Larger lens mass ⇒ larger Einstein
 * ring. Null unless the mass and all distances are positive and D_L·D_S > 0.
 */
export function einsteinRadiusArcsec(
  lensMassMsun: number,
  dLpc: number,
  dSpc: number,
  dLSpc: number
): number | null {
  if (
    !isPos(lensMassMsun) ||
    !isPos(dLpc) ||
    !isPos(dSpc) ||
    !isPos(dLSpc)
  ) {
    return null;
  }
  const M = lensMassMsun * MSUN_KG;
  const dL = dLpc * PC_M;
  const dS = dSpc * PC_M;
  const dLS = dLSpc * PC_M;
  const thetaRad = Math.sqrt(((4 * G * M) / (C * C)) * (dLS / (dL * dS)));
  return thetaRad * RAD_TO_ARCSEC;
}

/**
 * Light-deflection angle α = 4GM/(c²·b) in ARCSECONDS, for a mass passing at
 * impact parameter `impactParamM` [metres]. The classic GR test: for the Sun
 * (1 M☉) at its limb (b = R☉) this is ≈1.75 arcsec — Eddington's 1919 eclipse
 * result. Null for non-positive/invalid mass or impact parameter.
 */
export function deflectionAngleArcsec(
  massMsun: number,
  impactParamM: number
): number | null {
  if (!isPos(massMsun) || !isPos(impactParamM)) return null;
  const M = massMsun * MSUN_KG;
  const alphaRad = (4 * G * M) / (C * C * impactParamM);
  return alphaRad * RAD_TO_ARCSEC;
}

// ─────────────────────────── State bundle (UI) ──────────────────────────────

/** One-call snapshot of derived geometry for a catalogued black hole. */
export interface BlackHoleState {
  id: BlackHoleId;
  name: string;
  type: BlackHoleType;
  massMsun: number;
  /** event-horizon radius [m] */
  schwarzschildRadiusM: number | null;
  /** event-horizon radius [km] */
  schwarzschildRadiusKm: number | null;
  /** event-horizon radius [AU] */
  schwarzschildRadiusAU: number | null;
  /** event-horizon radius [R☉] */
  schwarzschildRadiusRsun: number | null;
  /** photon-sphere radius [m] */
  photonSphereM: number | null;
  /** ISCO radius (Schwarzschild) [m] */
  iscoM: number | null;
  /** shadow diameter [m] */
  shadowDiameterM: number | null;
  /** computed shadow angular size [µas] from the catalogued distance */
  shadowAngularSizeMicroarcsec: number | null;
  /** observed shadow/ring [µas] when imaged, for comparison (else null) */
  observedShadowMicroarcsec: number | null;
  /** Hawking temperature [K] */
  hawkingTemperatureK: number | null;
  /** Hawking evaporation time [yr] */
  evaporationTimeYears: number | null;
  /** spaghettification verdict for a human */
  spaghettification: SpaghettificationResult | null;
}

/**
 * Everything the UI needs for one catalogued black hole, in a single pure call:
 * event-horizon radius in four units, photon sphere, ISCO, shadow size (computed
 * vs observed), Hawking temperature and lifetime, and the spaghettification
 * verdict. All derived quantities are exact Schwarzschild (non-spinning) GR —
 * see the module honesty note. Null for an unknown id.
 */
export function blackHoleState(id: BlackHoleId | string): BlackHoleState | null {
  const bh = getBlackHole(id);
  if (!bh) return null;
  const m = bh.massMsun;
  return {
    id: bh.id,
    name: bh.name,
    type: bh.type,
    massMsun: m,
    schwarzschildRadiusM: schwarzschildRadiusM(m),
    schwarzschildRadiusKm: schwarzschildRadiusKm(m),
    schwarzschildRadiusAU: schwarzschildRadiusAU(m),
    schwarzschildRadiusRsun: schwarzschildRadiusRsun(m),
    photonSphereM: photonSphereM(m),
    iscoM: iscoM(m),
    shadowDiameterM: shadowDiameterM(m),
    shadowAngularSizeMicroarcsec: shadowAngularSizeMicroarcsec(
      m,
      bh.distanceLy,
      "ly"
    ),
    observedShadowMicroarcsec: bh.observedShadowMicroarcsec,
    hawkingTemperatureK: hawkingTemperatureK(m),
    evaporationTimeYears: evaporationTimeYears(m),
    spaghettification: spaghettificationCheck(m),
  };
}
