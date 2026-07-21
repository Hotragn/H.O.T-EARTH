/**
 * Physics + data for the GALAXIES & COSMIC WEB phase of the digital twin — a
 * small, fully-cited catalog of real galaxies, the cosmic distance ladder, the
 * large-scale-structure facts, and the exact low-redshift Hubble-law cosmology
 * that the "Galaxies & Cosmic Web" story page and its scale-zoom / 3D-map UI
 * need. This is a pure, self-contained layer: no network, no keys. It reuses the
 * distance-unit constants (LY_M, PC_M) from ./black-holes and adds the Hubble
 * constant and the cosmological helpers.
 *
 * What ships:
 *   • GALAXIES — nine real, cited objects (Milky Way, Andromeda/M31,
 *     Triangulum/M33, the Large and Small Magellanic Clouds, M87, Sombrero/M104,
 *     Whirlpool/M51, NGC 1300, Centaurus A/NGC 5128), each with Hubble type,
 *     distance (Mly + Mpc), diameter, an approximate stellar count, redshift,
 *     a real note, and a source.
 *   • Hubble's-law cosmology: recession velocity ↔ distance ↔ redshift, all in
 *     the LOW-z linear approximation, with the Hubble-tension caveat documented.
 *   • LOCAL_GROUP summary (dominant Milky Way + M31, ~80 members, ~10 Mly across).
 *   • SCALE_LADDER — the ordered cosmic distance hierarchy (Earth → 1 AU →
 *     light-year → Solar System → nearest star → Milky Way → Local Group →
 *     Virgo Supercluster → Laniakea → observable universe) for the scale-zoom UI.
 *   • SUPERCLUSTERS — cited large-scale-structure facts (Virgo Supercluster,
 *     Laniakea, the Great Attractor, the Sloan Great Wall, the Boötes Void).
 *   • equatorialRedshiftToCartesianMpc(ra, dec, z) — the RA/Dec + redshift →
 *     3D Mpc conversion the frontend uses to plot a REAL redshift catalog
 *     (public/data/galaxies/cosmic-web.json, fetched by a separate agent) as
 *     actual 3D structure, plus a typed loader signature. Like lib/exoplanets,
 *     this module does NOT read the file itself; the frontend passes the array.
 *
 * ── Sources (physics-env-simulation: real physics + documented data, or it does
 *    not ship — no invented numbers) ────────────────────────────────────────────
 *
 *   CATALOG — types and distances are published measurements (NED / SIMBAD and
 *   the cited discovery/method literature):
 *     • Milky Way — barred spiral SBbc; stellar disk ≈100–120 kly across;
 *       ≈100–400 billion stars; we are inside it, so it has no meaningful
 *       heliocentric distance/redshift (Sun ≈8.2 kpc from the centre).
 *       (Bland-Hawthorn & Gerhard, ARA&A 2016.)
 *     • Andromeda / M31 — spiral (SA(s)b); 2.54 Mly (778 kpc, Cepheid/TRGB);
 *       disk ≈152 kly; ≈1 trillion stars (Sloan/Spitzer). BLUESHIFTED
 *       (v ≈ −300 km/s heliocentric): it is approaching, on a collision course
 *       with the Milky Way in ≈4.5 Gyr to form "Milkomeda". (van der Marel et al.,
 *       ApJ 2012; Riess et al. 2012 distance.)
 *     • Triangulum / M33 — spiral (SA(s)cd); ≈2.73 Mly (840 kpc); disk ≈60 kly;
 *       third-largest Local Group member, likely an M31 satellite.
 *       (Freedman et al. 2001; NED.)
 *     • Large Magellanic Cloud — dwarf/Magellanic barred irregular (SB(s)m);
 *       ≈163 kly (49.97 kpc, eclipsing-binary distance — a cornerstone of the
 *       distance ladder); ≈14 kly across; Milky Way satellite.
 *       (Pietrzyński et al., Nature 2019.)
 *     • Small Magellanic Cloud — dwarf irregular (SB(s)m pec); ≈200 kly (≈62 kpc);
 *       ≈18 kly across; Milky Way satellite, gravitationally bound to the LMC.
 *       (Graczyk et al. 2014; NED.)
 *     • M87 (Virgo A) — giant elliptical (E0-1 pec); ≈53.5 Mly (16.4 Mpc); a
 *       Virgo-Cluster dominant galaxy hosting the ≈6.5×10⁹ M☉ black hole imaged
 *       by the EHT in 2019. (EHT Collaboration ApJL 875, 2019; NED.)
 *     • Sombrero / M104 — spiral (SA(s)a, "Sa"); ≈29.3 Mly (9.0 Mpc); prominent
 *       dust lane and large bulge. (McQuinn et al. 2016 TRGB; NED.)
 *     • Whirlpool / M51a (NGC 5194) — grand-design spiral (SA(s)bc, "Sc");
 *       ≈23 Mly (≈7.2 Mpc); interacting with the companion NGC 5195.
 *       (McQuinn et al. 2016; NED.)
 *     • NGC 1300 — barred spiral (SB(rs)bc), the textbook barred-spiral archetype;
 *       ≈61 Mly (≈18.7 Mpc). (NED / HST.)
 *     • Centaurus A / NGC 5128 — peculiar lenticular / elliptical with a dust
 *       lane (S0 pec); ≈12 Mly (≈3.8 Mpc, PNLF/TRGB); the NEAREST radio galaxy
 *       and one of the brightest radio sources in the sky. (Harris et al. 2010; NED.)
 *
 *   COSMOLOGY (exact, textbook):
 *     • Hubble–Lemaître law v = H₀·d, with H₀ = 70 km s⁻¹ Mpc⁻¹ adopted here as a
 *       round mid value (see the Hubble-tension note below).
 *     • Low-redshift approximations cz ≈ v and d ≈ cz/H₀ (valid for z ≲ 0.1;
 *       for larger z the full relativistic + ΛCDM treatment is needed).
 *     • c = 299,792.458 km s⁻¹ (exact, SI).
 *
 *   SCALE LADDER / STRUCTURE sizes:
 *     • Earth mean diameter 12,742 km; 1 AU = 1.496×10⁸ km; 1 ly; Solar System to
 *       the Oort Cloud ≈1.9 ly across (outer Oort ≈100,000 AU); nearest star
 *       Proxima Centauri 4.2465 ly (Gaia); Milky Way disk ≈100 kly; Local Group
 *       ≈10 Mly; Virgo Supercluster ≈110 Mly; Laniakea ≈520 Mly (Tully et al.,
 *       Nature 513, 2014); observable universe ≈93 Gly in diameter (comoving,
 *       Planck 2018 parameters).
 *     • Sloan Great Wall ≈1.37 Gly long (Gott et al., ApJ 2005) — one of the
 *       largest known structures; Boötes Void ≈330 Mly across (Kirshner et al. 1981).
 *
 * ── Honesty / accuracy statement (label the UI truthfully) ─────────────────────
 *
 *   Every catalog type and distance is a real measurement from NED/SIMBAD and the
 *   cited literature. Distances BEYOND the Local Group carry real uncertainty and
 *   depend on method (Cepheids, TRGB, eclipsing binaries, surface-brightness
 *   fluctuations, redshift) — the values here are representative published figures,
 *   not exact. H₀ = 70 is a MID value amid the real "Hubble tension": the early-
 *   universe CMB fit (Planck 2018) gives ≈67.4 km/s/Mpc, while local distance-ladder
 *   measurements (SH0ES, Riess et al.) give ≈73 km/s/Mpc, and the ~5σ disagreement
 *   is unresolved. redshiftToDistanceMpc / redshiftToVelocityKmS are the LOW-z
 *   Hubble-law approximation — fine for the map's scale, NOT for high-z cosmology.
 *   The Local Group is gravitationally BOUND and NOT expanding: M31 is blueshifted
 *   and approaching, so its "recession velocity" is negative. The cosmic web built
 *   from the real redshift catalog shows ACTUAL galaxy positions, but in
 *   REDSHIFT SPACE: peculiar velocities inside clusters stretch them radially into
 *   the classic "Fingers of God" artefact, so radial structure near clusters is
 *   distorted (label it). Nothing here is invented.
 *
 *   Every public function is a pure, deterministic function of its inputs. Bad
 *   input (non-finite, or out-of-domain) returns null — never NaN, never throws.
 */

import { LY_M, PC_M } from "./black-holes";

// Re-export the shared distance-unit constants for convenience.
export { LY_M, PC_M };

// ─────────────────────────── Constants ──────────────────────────────────────

/**
 * Adopted Hubble constant H₀ [km s⁻¹ Mpc⁻¹]. We use 70 as a round MID value:
 * the CMB/early-universe fit (Planck 2018) gives ≈67.4 and the local distance
 * ladder (SH0ES) gives ≈73 — the unresolved "Hubble tension" (≈5σ). See
 * {@link HUBBLE_TENSION}.
 */
export const H0_KM_S_MPC = 70;

/** Planck 2018 (CMB / early-universe) value of H₀ [km s⁻¹ Mpc⁻¹]. */
export const H0_PLANCK_KM_S_MPC = 67.4;

/** SH0ES (local distance-ladder / Cepheid+SNe Ia) value of H₀ [km s⁻¹ Mpc⁻¹]. */
export const H0_SH0ES_KM_S_MPC = 73.0;

/** Speed of light [km s⁻¹] (exact, SI). */
export const C_KM_S = 299792.458;

/** Documented statement of the Hubble tension, for the UI. */
export const HUBBLE_TENSION = {
  adopted: H0_KM_S_MPC,
  planck: H0_PLANCK_KM_S_MPC,
  sh0es: H0_SH0ES_KM_S_MPC,
  note:
    "H₀ is not settled. The early-universe CMB fit (Planck 2018) gives ≈67.4 km/s/Mpc; " +
    "the local distance ladder (SH0ES) gives ≈73 km/s/Mpc. The ≈5σ disagreement — the " +
    "'Hubble tension' — is unresolved. We adopt 70 as a round mid value; it is documented, not a claim.",
  source:
    "Planck Collaboration (A&A 641, A6, 2020): H₀ = 67.4±0.5. Riess et al. (ApJL 934, L7, 2022, SH0ES): H₀ = 73.04±1.04.",
} as const;

/** Kilometres in one megaparsec (1 Mpc = 10⁶ pc). */
export const MPC_KM = (PC_M * 1e6) / 1000;
/** Light-years in one megaparsec (1 Mpc ≈ 3.2616×10⁶ ly). */
export const LY_PER_MPC = (PC_M * 1e6) / LY_M;
/** Megaparsecs in one million light-years (1 Mly ≈ 0.3066 Mpc). */
export const MPC_PER_MLY = LY_M / PC_M;

const DEG2RAD = Math.PI / 180;

// ─────────────────────────── Internal helpers ───────────────────────────────

/** Finite, usable number? */
function isNum(x: number | null | undefined): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

// ─────────────────────────── Catalog types ──────────────────────────────────

/** Stable identifiers for the catalogued galaxies. */
export type GalaxyId =
  | "milky-way"
  | "andromeda"
  | "triangulum"
  | "lmc"
  | "smc"
  | "m87"
  | "sombrero"
  | "whirlpool"
  | "ngc-1300"
  | "centaurus-a";

/** Notability/proximity-ordered id list for iterating the page. */
export const GALAXY_IDS: readonly GalaxyId[] = [
  "milky-way",
  "andromeda",
  "triangulum",
  "lmc",
  "smc",
  "m87",
  "sombrero",
  "whirlpool",
  "ngc-1300",
  "centaurus-a",
] as const;

/**
 * One catalogued galaxy. Distances are given in millions of light-years (Mly) and
 * megaparsecs (Mpc). `redshift` is heliocentric z (negative for the blueshifted,
 * approaching Local Group members; null for the Milky Way, which has none).
 */
export interface Galaxy {
  /** stable id, e.g. "andromeda" */
  id: GalaxyId;
  /** display name, e.g. "Andromeda (M31)" */
  name: string;
  /** Hubble/morphological type, e.g. "SA(s)b (spiral)" */
  hubbleType: string;
  /** distance from the Milky Way [million light-years, Mly]; null for the Milky Way */
  distanceMly: number | null;
  /** distance from the Milky Way [megaparsecs, Mpc]; null for the Milky Way */
  distanceMpc: number | null;
  /** approximate stellar-disk / galaxy diameter [thousand light-years, kly] */
  diameterKly: number;
  /** approximate number of stars */
  starCount: string;
  /** heliocentric redshift z (negative ⇒ blueshifted/approaching); null if N/A */
  redshift: number | null;
  /** the real, cited note / story */
  note: string;
  /** citation string */
  source: string;
}

// ─────────────────────────── The catalog ────────────────────────────────────

/**
 * The catalogued galaxies. Every type and distance is a published measurement
 * (NED / SIMBAD and the cited literature — see the module header for methods).
 */
export const GALAXIES: Record<GalaxyId, Galaxy> = {
  "milky-way": {
    id: "milky-way",
    name: "Milky Way",
    hubbleType: "SBbc (barred spiral)",
    distanceMly: null, // we are inside it — no heliocentric distance
    distanceMpc: null,
    diameterKly: 100, // stellar disk ≈100–120 kly across
    starCount: "~100–400 billion stars",
    redshift: null, // N/A: our own galaxy
    note: "Our home galaxy: a barred spiral about 100,000 light-years across, with the Sun ≈27,000 ly (8.2 kpc) from the central supermassive black hole Sagittarius A*. Star counts range ~100–400 billion depending on the assumed low-mass population.",
    source: "Bland-Hawthorn & Gerhard (ARA&A 54, 2016); GRAVITY Collaboration (2019) for R₀ ≈ 8.2 kpc.",
  },

  andromeda: {
    id: "andromeda",
    name: "Andromeda (M31)",
    hubbleType: "SA(s)b (spiral)",
    distanceMly: 2.54,
    distanceMpc: 0.778,
    diameterKly: 152,
    starCount: "~1 trillion stars",
    redshift: -0.001001, // heliocentric v ≈ −300 km/s: BLUESHIFTED, approaching
    note: "The nearest large spiral and the most massive Local Group galaxy. It is BLUESHIFTED (approaching at ≈300 km/s) and on a collision course with the Milky Way in ≈4.5 Gyr; the merged remnant is nicknamed 'Milkomeda'.",
    source: "Riess et al. (ApJ 745, 2012) distance 778 kpc; van der Marel et al. (ApJ 753, 2012) collision. NED z = −0.001001.",
  },

  triangulum: {
    id: "triangulum",
    name: "Triangulum (M33)",
    hubbleType: "SA(s)cd (spiral)",
    distanceMly: 2.73,
    distanceMpc: 0.84,
    diameterKly: 60,
    starCount: "~40 billion stars",
    redshift: -0.000607, // blueshifted, approaching
    note: "The third-largest Local Group member and the smallest of its three spirals, likely a satellite of Andromeda. Also slightly blueshifted (Local Group members are gravitationally bound, not receding).",
    source: "Freedman et al. (ApJ 553, 2001); NED distance ≈840 kpc, z = −0.000607.",
  },

  lmc: {
    id: "lmc",
    name: "Large Magellanic Cloud",
    hubbleType: "SB(s)m (barred dwarf irregular)",
    distanceMly: 0.163,
    distanceMpc: 0.05,
    diameterKly: 14,
    starCount: "~20 billion stars",
    redshift: null, // v ≈ +262 km/s is orbital, not cosmological — left null
    note: "The largest Milky Way satellite, a Magellanic dwarf irregular ≈163,000 ly away. Its distance, set to ≈1% via eclipsing binaries, is a cornerstone anchor of the cosmic distance ladder. Hosted SN 1987A.",
    source: "Pietrzyński et al. (Nature 567, 2019): 49.59±0.09 (stat) kpc; NED.",
  },

  smc: {
    id: "smc",
    name: "Small Magellanic Cloud",
    hubbleType: "SB(s)m pec (dwarf irregular)",
    distanceMly: 0.2,
    distanceMpc: 0.062,
    diameterKly: 18,
    starCount: "~3 billion stars",
    redshift: null, // v ≈ +146 km/s orbital, not cosmological — left null
    note: "A dwarf irregular Milky Way satellite ≈200,000 ly away, gravitationally linked to the LMC (together the Magellanic Clouds) and connected by the Magellanic Stream of stripped gas.",
    source: "Graczyk et al. (ApJ 780, 2014) ≈62 kpc; NED.",
  },

  m87: {
    id: "m87",
    name: "M87 (Virgo A)",
    hubbleType: "E0-1 pec (giant elliptical)",
    distanceMly: 53.5,
    distanceMpc: 16.4,
    diameterKly: 240,
    starCount: "~1 trillion+ stars",
    redshift: 0.004283,
    note: "A giant elliptical dominating the Virgo Cluster, ≈53 Mly away. It hosts the ≈6.5-billion-solar-mass black hole that the Event Horizon Telescope imaged in 2019 — the first picture of a black hole's shadow — and drives a spectacular relativistic jet.",
    source: "EHT Collaboration (ApJL 875, 2019) D ≈ 16.4 Mpc; NED z = 0.004283.",
  },

  sombrero: {
    id: "sombrero",
    name: "Sombrero (M104)",
    hubbleType: "SA(s)a (spiral)",
    distanceMly: 29.3,
    distanceMpc: 9.0,
    diameterKly: 49,
    starCount: "~100 billion stars",
    redshift: 0.003416,
    note: "An early-type 'Sa' spiral seen nearly edge-on, famous for its bright bulge and sharp encircling dust lane that give it a sombrero-hat silhouette.",
    source: "McQuinn et al. (ApJ 826, 2016) TRGB D ≈ 9.0 Mpc; NED z = 0.003416.",
  },

  whirlpool: {
    id: "whirlpool",
    name: "Whirlpool (M51)",
    hubbleType: "SA(s)bc (spiral, 'Sc')",
    distanceMly: 23,
    distanceMpc: 7.2,
    diameterKly: 76,
    starCount: "~100 billion stars",
    redshift: 0.001544,
    note: "The archetypal 'grand-design' spiral, its sharp two-armed pattern being tidally driven by an ongoing interaction with the smaller companion NGC 5195.",
    source: "McQuinn et al. (ApJ 826, 2016) D ≈ 7.2 Mpc; NED z = 0.001544.",
  },

  "ngc-1300": {
    id: "ngc-1300",
    name: "NGC 1300",
    hubbleType: "SB(rs)bc (barred spiral)",
    distanceMly: 61,
    distanceMpc: 18.7,
    diameterKly: 110,
    starCount: "~100 billion stars",
    redshift: 0.005259,
    note: "The textbook archetype of a barred spiral (SBbc): a straight central bar of stars from which the two spiral arms spring, imaged in classic detail by Hubble in 2005.",
    source: "NED D ≈ 18.7 Mpc, z = 0.005259; HST (STScI 2005).",
  },

  "centaurus-a": {
    id: "centaurus-a",
    name: "Centaurus A (NGC 5128)",
    hubbleType: "S0 pec (peculiar lenticular/elliptical)",
    distanceMly: 12,
    distanceMpc: 3.8,
    diameterKly: 60,
    starCount: "~100 billion stars",
    redshift: 0.001825,
    note: "The nearest radio galaxy and one of the brightest radio sources in the sky, likely a past merger: a peculiar elliptical/lenticular crossed by a warped dust lane, with jets from its central black hole. ≈12 Mly away.",
    source: "Harris, Rejkuba & Harris (PASA 27, 2010) D ≈ 3.8 Mpc; NED z = 0.001825.",
  },
};

/** Look up a galaxy by id, or null. */
export function getGalaxy(id: GalaxyId | string): Galaxy | null {
  return (GALAXIES as Record<string, Galaxy>)[id] ?? null;
}

/** The catalog as an ordered array (proximity/notability order). */
export function galaxies(): Galaxy[] {
  return GALAXY_IDS.map((id) => GALAXIES[id]);
}

// ─────────────────────────── Hubble's-law cosmology ─────────────────────────

/**
 * Recession velocity v = H₀·d [km s⁻¹] for a distance in megaparsecs, using the
 * adopted H₀ = 70 (see {@link HUBBLE_TENSION}). This is the LOW-z linear Hubble
 * law; for large distances the full relativistic/ΛCDM treatment is needed. A
 * negative distance is out of domain → null. Null for non-finite input.
 */
export function recessionVelocityKmS(
  distanceMpc: number,
  h0: number = H0_KM_S_MPC
): number | null {
  if (!isNum(distanceMpc) || !isNum(h0)) return null;
  return h0 * distanceMpc;
}

/**
 * Hubble distance d = v/H₀ [Mpc] from a recession velocity [km s⁻¹]. The inverse
 * of {@link recessionVelocityKmS}. Low-z approximation. Null for non-finite input
 * or a non-positive H₀.
 */
export function hubbleDistanceMpc(
  velocityKmS: number,
  h0: number = H0_KM_S_MPC
): number | null {
  if (!isNum(velocityKmS) || !isNum(h0) || h0 <= 0) return null;
  return velocityKmS / h0;
}

/**
 * Recession velocity from redshift, LOW-z approximation v ≈ c·z [km s⁻¹]. This is
 * accurate only for z ≲ 0.1; at higher z the relativistic Doppler / cosmological
 * relation between z and velocity must be used (v then approaches but never
 * exceeds c). Null for non-finite z. (Negative z ⇒ blueshift ⇒ negative velocity,
 * which is physical for approaching Local Group members and is returned as-is.)
 */
export function redshiftToVelocityKmS(z: number): number | null {
  if (!isNum(z)) return null;
  return C_KM_S * z;
}

/**
 * Distance from redshift via the low-z Hubble law d ≈ cz/H₀ [Mpc]. LABELLED
 * APPROXIMATION: valid for z ≲ 0.1 and used only for the map's scale, not for
 * precise high-z cosmology (which needs the ΛCDM comoving-distance integral).
 * Null for non-finite z or a non-positive H₀. A blueshift (z<0) returns a
 * negative "distance", so callers should treat z≤0 (bound Local Group) specially.
 */
export function redshiftToDistanceMpc(
  z: number,
  h0: number = H0_KM_S_MPC
): number | null {
  if (!isNum(z) || !isNum(h0) || h0 <= 0) return null;
  return (C_KM_S * z) / h0;
}

/** Distance in Mpc → million light-years (Mly). Null-safe. */
export function mpcToMly(mpc: number): number | null {
  if (!isNum(mpc)) return null;
  return (mpc * LY_PER_MPC) / 1e6;
}

/** Distance in million light-years (Mly) → Mpc. Null-safe. */
export function mlyToMpc(mly: number): number | null {
  if (!isNum(mly)) return null;
  return mly * MPC_PER_MLY;
}

// ─────────────────────────── Local Group summary ────────────────────────────

/** Summary facts for the Local Group, our gravitationally-bound galaxy group. */
export const LOCAL_GROUP = {
  name: "Local Group",
  dominantMembers: ["Milky Way", "Andromeda (M31)"] as const,
  approxMemberCount: 80, // and rising as faint dwarfs are found
  diameterMly: 10, // ≈3 Mpc across
  note: "A gravitationally BOUND group of ~80 known galaxies spanning ~10 million light-years, dominated by two large spirals — the Milky Way and Andromeda — plus Triangulum and dozens of dwarfs. Being bound, it is NOT expanding with the universe: its members orbit and, in M31's case, approach us.",
  source: "McConnachie (AJ 144, 2012) Local Group census; van den Bergh (2000).",
} as const;

// ─────────────────────────── Scale ladder ───────────────────────────────────

/** One rung of the cosmic distance hierarchy, with a real characteristic size. */
export interface ScaleRung {
  /** short label, e.g. "Milky Way" */
  label: string;
  /** characteristic size in metres (diameter / extent) */
  sizeM: number;
  /** human-readable size, e.g. "~100,000 light-years" */
  human: string;
  /** what this rung is */
  note: string;
}

const KM = 1000;
const AU_M_LOCAL = 1.495978707e11; // IAU 2012 exact
const KLY_M = 1e3 * LY_M;
const MLY_M = 1e6 * LY_M;
const GLY_M = 1e9 * LY_M;

/**
 * The cosmic distance ladder, STRICTLY INCREASING in size — for the scale-zoom
 * UI. Sizes are real characteristic extents (diameters / spans); see the module
 * header for the source of each.
 */
export const SCALE_LADDER: readonly ScaleRung[] = [
  {
    label: "Earth",
    sizeM: 12742 * KM, // mean diameter ≈12,742 km
    human: "~12,742 km",
    note: "Our planet's mean diameter — the human-scale starting point.",
  },
  {
    label: "1 Astronomical Unit",
    sizeM: AU_M_LOCAL,
    human: "~1.496×10⁸ km (Earth–Sun distance)",
    note: "The mean Earth–Sun distance, the natural yardstick of the Solar System.",
  },
  {
    label: "1 Light-year",
    sizeM: LY_M,
    human: "~9.46×10¹² km",
    note: "How far light travels in one year — ≈63,241 AU. The step from planetary to interstellar scales.",
  },
  {
    label: "Solar System (to the Oort Cloud)",
    sizeM: 1.9 * LY_M, // outer Oort ≈100,000 AU radius ⇒ ≈1.9 ly diameter
    human: "~1.9 light-years across (outer Oort Cloud)",
    note: "The Sun's gravitational domain out to the ≈100,000-AU outer Oort Cloud — far beyond the planets.",
  },
  {
    label: "Nearest star (Proxima Centauri)",
    sizeM: 4.2465 * LY_M,
    human: "4.2465 light-years",
    note: "The closest star to the Sun (Gaia parallax) — the typical spacing between stars in our neighbourhood.",
  },
  {
    label: "Milky Way",
    sizeM: 100 * KLY_M,
    human: "~100,000 light-years across",
    note: "Our home galaxy's stellar disk — hundreds of billions of stars.",
  },
  {
    label: "Local Group",
    sizeM: 10 * MLY_M,
    human: "~10 million light-years across",
    note: "The bound group of ~80 galaxies around the Milky Way and Andromeda.",
  },
  {
    label: "Virgo Supercluster",
    sizeM: 110 * MLY_M,
    human: "~110 million light-years across",
    note: "The supercluster containing the Local Group and the Virgo Cluster — itself just a lobe of Laniakea.",
  },
  {
    label: "Laniakea Supercluster",
    sizeM: 520 * MLY_M,
    human: "~520 million light-years across",
    note: "Our home supercluster, defined by galaxy flow lines (Tully et al. 2014) toward the Great Attractor.",
  },
  {
    label: "Observable universe",
    sizeM: 93 * GLY_M,
    human: "~93 billion light-years in diameter",
    note: "The comoving diameter of everything we can in principle see — the ~46.5-Gly-radius sphere set by the horizon.",
  },
] as const;

// ─────────────────────────── Superclusters / structure ──────────────────────

/** A large-scale-structure fact (supercluster, wall, void, or attractor). */
export interface Supercluster {
  /** display name */
  name: string;
  /** what kind of structure it is */
  kind: "supercluster" | "wall" | "void" | "attractor";
  /** characteristic size [million light-years, Mly] */
  sizeMly: number;
  /** the real, cited note */
  note: string;
  /** citation string */
  source: string;
}

/** Cited large-scale-structure facts for the cosmic-web view. */
export const SUPERCLUSTERS: readonly Supercluster[] = [
  {
    name: "Virgo Supercluster",
    kind: "supercluster",
    sizeMly: 110,
    note: "The supercluster that contains the Local Group and the Virgo Cluster — the local concentration of galaxy groups, now understood to be an outlying lobe of the far larger Laniakea.",
    source: "Tully (1982); de Vaucouleurs (1953) 'Local Supercluster'.",
  },
  {
    name: "Laniakea Supercluster",
    kind: "supercluster",
    sizeMly: 520,
    note: "Our home supercluster — ~100,000 galaxies spanning ≈520 Mly — defined by the boundary where galaxy peculiar-velocity flow lines converge. Its centre of gravity is the Great Attractor. ('Laniakea' = 'immense heaven' in Hawaiian.)",
    source: "Tully, Courtois, Hoffman & Pomarède (Nature 513, 2014).",
  },
  {
    name: "Great Attractor",
    kind: "attractor",
    sizeMly: 200,
    note: "A gravitational focal point in the Norma/Centaurus region ≈150–250 Mly away toward which the Local Group and thousands of other galaxies stream at ~600 km/s. Partly hidden behind the Milky Way's 'Zone of Avoidance'.",
    source: "Lynden-Bell et al. (ApJ 326, 1988); Tully et al. (2014) as Laniakea's core.",
  },
  {
    name: "Sloan Great Wall",
    kind: "wall",
    sizeMly: 1370,
    note: "A vast filamentary sheet of galaxies ≈1.37 billion light-years long, discovered in the Sloan Digital Sky Survey — one of the largest known structures in the universe.",
    source: "Gott, Jurić et al. (ApJ 624, 2005), from SDSS.",
  },
  {
    name: "Boötes Void",
    kind: "void",
    sizeMly: 330,
    note: "One of the largest known voids: a roughly spherical region ≈330 million light-years across containing very few galaxies — a stark demonstration that the cosmic web is mostly empty space.",
    source: "Kirshner, Oemler, Schechter & Shectman (ApJ 248, 1981).",
  },
] as const;

// ─────────────────────────── Cosmic-web dataset support ─────────────────────
//
// The frontend fetches a REAL galaxy-redshift catalog into
// public/data/galaxies/cosmic-web.json (built by a separate assets agent) and
// passes the rows to the conversion below to plot ACTUAL 3D large-scale
// structure. Like lib/exoplanets, this module does NOT read the file itself;
// these are the input shapes and the pure geometry.

/**
 * One row of the redshift catalog, as passed in from
 * public/data/galaxies/cosmic-web.json. Fields are optional/nullable because
 * survey rows routinely omit values; the conversion tolerates that.
 */
export interface CosmicWebRow {
  /** right ascension [degrees, 0–360] */
  raDeg?: number | null;
  /** declination [degrees, −90..+90] */
  decDeg?: number | null;
  /** redshift z */
  z?: number | null;
  /** optional object name / id */
  name?: string | null;
}

/** A point in the 3D map, in megaparsecs, plus its source row. */
export interface CosmicWebPoint {
  x: number;
  y: number;
  z: number;
  /** the comoving-ish radial distance used [Mpc] (Hubble law, low-z) */
  distanceMpc: number;
  name?: string | null;
}

/**
 * A 3D Cartesian point in megaparsecs, right-handed, with the equatorial frame:
 * +x toward RA=0°/Dec=0° (vernal equinox), +y toward RA=90°/Dec=0°, +z toward
 * the North Celestial Pole (Dec=+90°).
 */
export interface CartesianMpc {
  x: number;
  y: number;
  z: number;
}

/**
 * Convert an equatorial sky position (RA, Dec in DEGREES) plus a redshift into a
 * 3D Cartesian point in MEGAPARSECS, for plotting the real redshift catalog as
 * actual large-scale structure. The radial distance is the low-z Hubble distance
 * r = c·z/H₀; the direction is the standard equatorial→Cartesian mapping:
 *
 *   x = r · cos(Dec) · cos(RA)
 *   y = r · cos(Dec) · sin(RA)
 *   z = r · sin(Dec)
 *
 * So z = 0 maps to the origin, larger z ⇒ larger radius, RA=Dec=0 ⇒ +x axis, and
 * Dec = +90° ⇒ the +z axis (North Celestial Pole) regardless of RA. This is
 * REDSHIFT SPACE: peculiar velocities elongate clusters radially into the classic
 * "Fingers of God" artefact (a real distortion, not a bug — label it in the UI).
 *
 * Null for non-finite RA/Dec/z or a non-positive H₀. (A blueshift z<0 would give
 * a negative radius / mirrored point, so it is rejected as out of domain here —
 * bound Local Group members are not part of the Hubble-flow map.)
 */
export function equatorialRedshiftToCartesianMpc(
  raDeg: number,
  decDeg: number,
  z: number,
  h0: number = H0_KM_S_MPC
): CartesianMpc | null {
  if (!isNum(raDeg) || !isNum(decDeg) || !isNum(z) || !isNum(h0) || h0 <= 0) {
    return null;
  }
  if (z < 0) return null; // redshift-space Hubble flow only
  const r = (C_KM_S * z) / h0; // Hubble distance [Mpc]
  const ra = raDeg * DEG2RAD;
  const dec = decDeg * DEG2RAD;
  const cosDec = Math.cos(dec);
  return {
    x: r * cosDec * Math.cos(ra),
    y: r * cosDec * Math.sin(ra),
    z: r * Math.sin(dec),
  };
}

/**
 * Loader signature (NOT an implementation): the frontend fetches
 * public/data/galaxies/cosmic-web.json and maps each row through
 * {@link equatorialRedshiftToCartesianMpc}, dropping rows that fail validation.
 * Provided here as the typed contract the frontend fills in — this module never
 * touches the network or filesystem. Rows with missing/invalid RA/Dec/z or z<0
 * are silently skipped (never throws).
 */
export function cosmicWebPointsFromRows(
  rows: readonly CosmicWebRow[] | null | undefined,
  h0: number = H0_KM_S_MPC
): CosmicWebPoint[] {
  if (!Array.isArray(rows)) return [];
  const out: CosmicWebPoint[] = [];
  for (const row of rows) {
    if (!row) continue;
    const p = equatorialRedshiftToCartesianMpc(
      row.raDeg as number,
      row.decDeg as number,
      row.z as number,
      h0
    );
    if (p === null) continue;
    out.push({
      x: p.x,
      y: p.y,
      z: p.z,
      distanceMpc: Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z),
      name: row.name ?? null,
    });
  }
  return out;
}
