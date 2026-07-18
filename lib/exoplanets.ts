/**
 * Physics for the EXOPLANETS phase of the digital twin — the analogue of
 * lib/planets.ts (major planets) and lib/dwarf-planets.ts (dwarf planets), but
 * for worlds orbiting OTHER stars. Where those modules propagate real ephemeris
 * elements for known Solar-System bodies, this module is a set of PURE
 * derivations FROM PARAMETERS the frontend passes in (a star's luminosity /
 * temperature, a planet's semi-major axis / radius / mass / equilibrium
 * temperature). It reads no data file itself — the exoplanet catalogue lives in
 * public/data/exoplanets/systems.json (built by a separate agent) and is handed
 * to these functions as plain objects.
 *
 * It powers two views:
 *
 *   1. a SYSTEM ARCHITECTURE view (a host star at the centre with its planets in
 *      their real *relative* orbits, animating at correct relative speeds), and
 *   2. per-planet DERIVED PROPERTIES for the HUD — habitable-zone membership,
 *      equilibrium temperature, a composition guess, and illustrative colours.
 *
 * Like every other lib/ physics module, every public function is a pure function
 * of its inputs, so it unit-tests cleanly (lib/exoplanets.test.ts).
 *
 * ── Sources (physics-env-simulation skill: real physics, documented, or it
 *    doesn't ship — no invented numbers) ─────────────────────────────────────
 *
 *   • Habitable zone: Kopparapu, Ramirez, Kasting et al. (2013), "Habitable Zones
 *     around Main-sequence Stars: New Estimates", ApJ 765, 131 (and the 2013
 *     erratum / 2014 update, ApJL 787, L29). We use their S_eff polynomial in the
 *     stellar-temperature term Ts = Teff − 5780 K, with the published coefficients
 *     for the Recent Venus, Runaway Greenhouse, Maximum Greenhouse and Early Mars
 *     limits. Distances follow d = sqrt( (L/L_sun) / S_eff ) AU. Valid Teff range
 *     2600–7200 K (Teff is clamped to that band for the polynomial).
 *
 *   • Equilibrium temperature: the standard radiative-balance result
 *     Teq = [ L (1−A) / (16 π σ D²) ]^(1/4), normalised to Solar values as
 *     Teq = 278.5 K · (1−A)^(1/4) · (L/L_sun)^(1/4) · (a/AU)^(−1/2). The 278.5 K
 *     constant is the fast-rotator blackbody temperature at 1 AU from the Sun with
 *     zero albedo. (e.g. Méndez & Rivera-Valentín 2017; standard planetary texts.)
 *
 *   • Composition / radius transition: the ~1.5–2.0 R⊕ rocky→gaseous divide (the
 *     "radius valley" / "Fulton gap"): Fulton et al. (2017), AJ 154, 109; the
 *     rocky-vs-volatile interpretation follows Rogers (2015), ApJ 801, 41 (most
 *     planets above ~1.6 R⊕ are not rocky). Sub-Neptune / Neptune / gas-giant
 *     radius bins are the customary demographic cuts (e.g. Borucki/NASA Kepler
 *     "planet type" bins). ALL classifications here are ESTIMATES from radius/mass,
 *     not observed compositions.
 *
 *   • Illustrative colours (planetTint, starColor) are ILLUSTRATIVE ONLY: a
 *     temperature/spectral-type → RGB mapping for the renderer, NOT measured
 *     albedos or spectra. Documented on each function so the HUD can label them.
 *
 * ── Honesty notes (so the HUD can label everything truthfully) ───────────────
 *
 *   • st_lum in the NASA Exoplanet Archive is usually log10(L/L_sun). Every
 *     function here takes luminosity in LINEAR L_sun; convert an archive log value
 *     with {@link lsunFromLogLum} first.
 *   • systemLayout compresses the radial (semi-major-axis) axis so a hot-Jupiter
 *     at 0.02 AU and an outer giant at 10 AU are visible together; the ORDER and
 *     relative angular SPEEDS are physical, but the compressed radius, the orbital
 *     PHASE (unknown for real exoplanets — seeded deterministically) and the
 *     periapsis orientation are illustrative. The true sma_au is always returned.
 *   • Very many catalogue planets lack a measured mass, eqt, or eccentricity.
 *     Every function tolerates undefined/null and returns null (never NaN, never
 *     throws) rather than inventing a value.
 */

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** Parsecs → light-years conversion factor (1 pc = 3.26156 ly). */
const LY_PER_PC = 3.26156;
/** Days in a Julian year — for period ↔ semi-major-axis via Kepler's 3rd law. */
const DAYS_PER_YEAR = 365.25;

/**
 * Radiative-equilibrium constant [K]: the temperature of a fast-rotating,
 * zero-albedo blackbody at 1 AU from the Sun. Teq scales from it as
 * Teq = 278.5 · (1−A)^(1/4) · L^(1/4) · a^(−1/2). See module header.
 */
const TEQ_CONSTANT_K = 278.5;

/** Solar effective temperature [K] — the reference point of the Kopparapu Ts term. */
const SUN_TEFF_K = 5780;

// ─────────────────────────── Input shapes ──────────────────────────────────
//
// These mirror public/data/exoplanets/systems.json but keep every physics-
// relevant field OPTIONAL/nullable, because catalogue rows routinely omit mass,
// eqt, eccentricity, luminosity, etc. Functions consume these structurally.

/** A host star, as passed in from the catalogue. `lum` is LINEAR L_sun. */
export interface ExoStar {
  /** effective temperature [K] */
  teff?: number | null;
  /** stellar radius [R_sun] */
  rad?: number | null;
  /** stellar mass [M_sun] */
  mass?: number | null;
  /**
   * bolometric luminosity in LINEAR L_sun. NOTE: the archive's st_lum is usually
   * log10(L/L_sun) — convert with {@link lsunFromLogLum} before passing it here.
   */
  lum?: number | null;
  /** spectral type string, e.g. "G2 V" */
  spectype?: string | null;
}

/** A single planet, as passed in from the catalogue. */
export interface ExoPlanet {
  name?: string;
  /** orbital period [days] */
  period_days?: number | null;
  /** semi-major axis [AU] */
  sma_au?: number | null;
  /** orbital eccentricity [–] */
  ecc?: number | null;
  /** planet radius [Earth radii] */
  radius_re?: number | null;
  /** planet mass [Earth masses] */
  mass_me?: number | null;
  /** equilibrium temperature [K] */
  eqt_k?: number | null;
  /** insolation flux [Earth flux] */
  insol?: number | null;
  /** discovery method, e.g. "Transit" */
  method?: string | null;
  /** discovery year */
  disc_year?: number | null;
  /** true if the planet has been directly imaged */
  directly_imaged?: boolean | null;
}

/** A whole system, as passed in from the catalogue. */
export interface ExoSystem {
  hostname?: string;
  distance_pc?: number | null;
  distance_ly?: number | null;
  star: ExoStar;
  planets: ExoPlanet[];
}

// ─────────────────────────── Null-safe helpers ─────────────────────────────

/** True if x is a finite, usable number (not null/undefined/NaN/Infinity). */
function isNum(x: number | null | undefined): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** Convert the archive's log10(L/L_sun) to linear L_sun. Null-safe. */
export function lsunFromLogLum(logL: number | null | undefined): number | null {
  if (!isNum(logL)) return null;
  return Math.pow(10, logL);
}

/** Parsecs → light-years (1 pc = 3.26156 ly). Null-safe. */
export function pcToLightYears(pc: number | null | undefined): number | null {
  if (!isNum(pc)) return null;
  return pc * LY_PER_PC;
}

// ─────────────────────────── Kepler's equation ─────────────────────────────

/**
 * Solve Kepler's equation M = E − e·sinE for the eccentric anomaly E (radians)
 * by Newton–Raphson — identical in shape to the solver in lib/planets.ts and
 * lib/dwarf-planets.ts. Robust to the wide eccentricity range exoplanets span
 * (many are near-circular; a few are e > 0.9), using the standard E = π start for
 * e ≥ 0.8. Exported so the solver's convergence can be unit-tested directly.
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

// ─────────────────────────── Habitable zone ────────────────────────────────

/**
 * Kopparapu et al. (2013) S_eff polynomial coefficients for the four HZ limits.
 * S_eff(Ts) = S_eff☉ + a·Ts + b·Ts² + c·Ts³ + d·Ts⁴, with Ts = Teff − 5780 K.
 * Transcribed from Kopparapu et al. (2013), ApJ 765, 131 (with the erratum /
 * 2014 update values that the authors' public HZ calculator uses).
 */
interface HZCoeffs {
  seffSun: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

const HZ_COEFFS: Record<
  "recentVenus" | "runawayGreenhouse" | "maxGreenhouse" | "earlyMars",
  HZCoeffs
> = {
  // Optimistic inner edge — Venus received no liquid water for ~1 Gyr.
  recentVenus: {
    seffSun: 1.7763,
    a: 1.4335e-4,
    b: 3.3954e-9,
    c: -7.6364e-12,
    d: -1.195e-15,
  },
  // Conservative inner edge — runaway greenhouse (1 Earth-mass).
  runawayGreenhouse: {
    seffSun: 1.0385,
    a: 1.2456e-4,
    b: 1.4612e-8,
    c: -7.6345e-12,
    d: -1.7511e-15,
  },
  // Conservative outer edge — maximum CO₂ greenhouse warming.
  maxGreenhouse: {
    seffSun: 0.3507,
    a: 5.9578e-5,
    b: 1.6707e-9,
    c: -3.0058e-12,
    d: -5.1925e-16,
  },
  // Optimistic outer edge — early Mars had liquid water.
  earlyMars: {
    seffSun: 0.3207,
    a: 5.4471e-5,
    b: 1.5275e-9,
    c: -2.1709e-12,
    d: -3.8282e-16,
  },
};

/** Kopparapu is calibrated for main-sequence stars over this Teff band [K]. */
const HZ_TEFF_MIN = 2600;
const HZ_TEFF_MAX = 7200;

/** Effective stellar flux at a HZ limit for a given Teff (Kopparapu S_eff poly). */
function seffAt(coeffs: HZCoeffs, teffK: number): number {
  const ts = teffK - SUN_TEFF_K;
  return (
    coeffs.seffSun +
    coeffs.a * ts +
    coeffs.b * ts * ts +
    coeffs.c * ts * ts * ts +
    coeffs.d * ts * ts * ts * ts
  );
}

/** Habitable-zone boundary distances [AU] plus conservative/optimistic bands. */
export interface HabitableZone {
  /** optimistic inner edge (Recent Venus) [AU] */
  recentVenus: number;
  /** conservative inner edge (Runaway Greenhouse) [AU] */
  runawayGreenhouse: number;
  /** conservative outer edge (Maximum Greenhouse) [AU] */
  maxGreenhouse: number;
  /** optimistic outer edge (Early Mars) [AU] */
  earlyMars: number;
  /** conservative band: runaway greenhouse → maximum greenhouse [AU] */
  conservative: { inner: number; outer: number };
  /** optimistic band: recent Venus → early Mars [AU] */
  optimistic: { inner: number; outer: number };
  /** the Teff [K] actually used (clamped to Kopparapu's 2600–7200 K validity) */
  teffK: number;
  /** true if the input Teff was outside 2600–7200 K and had to be clamped */
  teffClamped: boolean;
  /** honest one-line note for the UI */
  note: string;
}

/**
 * Circumstellar habitable zone by the Kopparapu et al. (2013) parametrization.
 * Each boundary distance is d = sqrt( L[L_sun] / S_eff(Teff) ) AU, where S_eff is
 * the four-term stellar-temperature polynomial above. Returns the four named
 * limits plus the conservative (runaway→max-greenhouse) and optimistic
 * (recentVenus→earlyMars) bands.
 *
 * `lumLsun` MUST be LINEAR L_sun (convert an archive log value with
 * {@link lsunFromLogLum}). `teffK` defaults to the Sun's 5780 K if omitted and is
 * clamped to Kopparapu's 2600–7200 K validity window (flagged in the result).
 *
 * For the Sun (L = 1, Teff = 5780) this yields ~0.75 / 0.99 / 1.69 / 1.77 AU for
 * recentVenus / runawayGreenhouse / maxGreenhouse / earlyMars.
 *
 * Returns null if luminosity is missing or non-positive (never NaN/throws).
 */
export function habitableZone(
  lumLsun: number | null | undefined,
  teffK?: number | null
): HabitableZone | null {
  if (!isNum(lumLsun) || lumLsun <= 0) return null;

  const rawTeff = isNum(teffK) ? teffK : SUN_TEFF_K;
  const teff = Math.min(HZ_TEFF_MAX, Math.max(HZ_TEFF_MIN, rawTeff));
  const teffClamped = teff !== rawTeff;

  const dist = (coeffs: HZCoeffs) => Math.sqrt(lumLsun / seffAt(coeffs, teff));

  const recentVenus = dist(HZ_COEFFS.recentVenus);
  const runawayGreenhouse = dist(HZ_COEFFS.runawayGreenhouse);
  const maxGreenhouse = dist(HZ_COEFFS.maxGreenhouse);
  const earlyMars = dist(HZ_COEFFS.earlyMars);

  return {
    recentVenus,
    runawayGreenhouse,
    maxGreenhouse,
    earlyMars,
    conservative: { inner: runawayGreenhouse, outer: maxGreenhouse },
    optimistic: { inner: recentVenus, outer: earlyMars },
    teffK: teff,
    teffClamped,
    note:
      "Habitable zone from Kopparapu et al. (2013). Conservative band = runaway " +
      "greenhouse → maximum greenhouse; optimistic band = recent Venus → early " +
      "Mars." +
      (teffClamped
        ? " Teff clamped to the model's 2600–7200 K validity range."
        : ""),
  };
}

/** Conservative HZ band [AU] (runaway greenhouse → maximum greenhouse), or null. */
export function conservativeHZ(
  lumLsun: number | null | undefined,
  teffK?: number | null
): { inner: number; outer: number } | null {
  return habitableZone(lumLsun, teffK)?.conservative ?? null;
}

/** Optimistic HZ band [AU] (recent Venus → early Mars), or null. */
export function optimisticHZ(
  lumLsun: number | null | undefined,
  teffK?: number | null
): { inner: number; outer: number } | null {
  return habitableZone(lumLsun, teffK)?.optimistic ?? null;
}

/**
 * Is a planet at `smaAU` inside its star's habitable zone? Uses the conservative
 * band by default (the runaway→max-greenhouse limits), or the optimistic band
 * (recentVenus→earlyMars) when `conservative: false`.
 *
 * Returns null (not a boolean) if sma or luminosity is missing — the frontend
 * must distinguish "not habitable" from "unknown".
 */
export function isInHabitableZone(
  smaAU: number | null | undefined,
  lumLsun: number | null | undefined,
  teffK?: number | null,
  opts: { conservative?: boolean } = {}
): boolean | null {
  if (!isNum(smaAU) || smaAU <= 0) return null;
  const hz = habitableZone(lumLsun, teffK);
  if (!hz) return null;
  const band = opts.conservative === false ? hz.optimistic : hz.conservative;
  return smaAU >= band.inner && smaAU <= band.outer;
}

// ─────────────────────── Equilibrium temperature ───────────────────────────

/**
 * Planetary equilibrium temperature [K] from radiative balance:
 *
 *   Teq = 278.5 K · (1 − A)^(1/4) · (L/L_sun)^(1/4) · (a/AU)^(−1/2)
 *
 * (the fast-rotator blackbody form; see module header). `albedo` is the Bond
 * albedo, default 0.3 (Earth-like). This is the theoretical BLACKBODY temperature
 * — it ignores greenhouse warming, so it is a lower bound on the surface
 * temperature of an atmosphered world (Earth's real 288 K vs 255 K here).
 *
 * Earth (L = 1, a = 1, A = 0.3) → ~255 K; A = 0 → ~279 K.
 *
 * Returns null if luminosity or sma is missing/invalid (never NaN/throws).
 */
export function equilibriumTempK(
  lumLsun: number | null | undefined,
  smaAU: number | null | undefined,
  albedo = 0.3
): number | null {
  if (!isNum(lumLsun) || lumLsun < 0) return null;
  if (!isNum(smaAU) || smaAU <= 0) return null;
  const a = isNum(albedo) ? Math.min(1, Math.max(0, albedo)) : 0.3;
  return (
    TEQ_CONSTANT_K *
    Math.pow(1 - a, 0.25) *
    Math.pow(lumLsun, 0.25) *
    Math.pow(smaAU, -0.5)
  );
}

// ─────────────────────────── Composition class ─────────────────────────────

export type CompositionClass =
  | "rocky"
  | "super-earth"
  | "sub-neptune"
  | "neptune-like"
  | "gas-giant";

export interface CompositionEstimate {
  /** machine label */
  class: CompositionClass;
  /** human-readable label for the HUD */
  label: string;
  /** whether radius or mass drove the classification */
  basis: "radius" | "mass";
  /** honest note that this is an estimate, not an observed composition */
  note: string;
}

/**
 * Radius-based composition BINS [Earth radii]. The rocky→gaseous boundary near
 * ~1.5–2.0 R⊕ is the observed "radius valley" / Fulton gap (Fulton et al. 2017;
 * Rogers 2015): planets much above it are almost never rocky. The larger bins are
 * the customary demographic cuts. Upper bound is exclusive.
 */
const RADIUS_BINS: { max: number; class: CompositionClass; label: string }[] = [
  { max: 1.5, class: "rocky", label: "Terrestrial (rocky)" },
  { max: 2.0, class: "super-earth", label: "Super-Earth (possibly rocky)" },
  { max: 4.0, class: "sub-neptune", label: "Sub-Neptune / mini-Neptune" },
  { max: 10.0, class: "neptune-like", label: "Neptune-like" },
  { max: Infinity, class: "gas-giant", label: "Gas giant" },
];

/**
 * Coarser MASS-based bins [Earth masses], used only when radius is missing.
 * Jupiter ≈ 318 M⊕, Neptune ≈ 17 M⊕, so the cuts are ~2 / ~10 / ~50 M⊕.
 */
const MASS_BINS: { max: number; class: CompositionClass; label: string }[] = [
  { max: 2.0, class: "rocky", label: "Terrestrial (rocky)" },
  { max: 10.0, class: "super-earth", label: "Super-Earth (possibly rocky)" },
  { max: 50.0, class: "neptune-like", label: "Neptune-like" },
  { max: Infinity, class: "gas-giant", label: "Gas giant" },
];

/**
 * Estimate a planet's composition class from its RADIUS (preferred, since the
 * radius valley is the sharpest rocky/gaseous discriminator) or, if radius is
 * missing, from its MASS. Thresholds and citations: see {@link RADIUS_BINS} and
 * the module header (Fulton et al. 2017; Rogers 2015).
 *
 *   R < 1.5 R⊕            → rocky / terrestrial
 *   1.5 ≤ R < 2.0 R⊕      → super-Earth (possibly rocky)
 *   2.0 ≤ R < 4.0 R⊕      → sub-Neptune / mini-Neptune
 *   4.0 ≤ R < 10 R⊕       → Neptune-like
 *   R ≥ 10 R⊕ (~Jupiter 11.2) → gas giant
 *
 * This is an ESTIMATE from radius/mass, NOT an observed composition (a 1.8 R⊕
 * planet may be a rocky super-Earth OR a gas-enveloped sub-Neptune). Returns null
 * if BOTH radius and mass are missing (never NaN/throws).
 */
export function compositionClass(
  radiusRe?: number | null,
  massMe?: number | null
): CompositionEstimate | null {
  if (isNum(radiusRe) && radiusRe > 0) {
    const bin = RADIUS_BINS.find((b) => radiusRe < b.max) ?? RADIUS_BINS[RADIUS_BINS.length - 1];
    return {
      class: bin.class,
      label: bin.label,
      basis: "radius",
      note:
        "Estimated from radius (Fulton gap ~1.5–2.0 R⊕, Rogers 2015); not an " +
        "observed composition.",
    };
  }
  if (isNum(massMe) && massMe > 0) {
    const bin = MASS_BINS.find((b) => massMe < b.max) ?? MASS_BINS[MASS_BINS.length - 1];
    return {
      class: bin.class,
      label: bin.label,
      basis: "mass",
      note:
        "Estimated from mass only (radius unavailable); coarse, and not an " +
        "observed composition.",
    };
  }
  return null;
}

// ─────────────────── Illustrative colours (renderer only) ────────────────────

/** Clamp to [0, 255] and format one channel as 2-hex-digit. */
function hexByte(v: number): string {
  const n = Math.round(Math.min(255, Math.max(0, v)));
  return n.toString(16).padStart(2, "0");
}

/** [r,g,b] (0–255) → "#rrggbb". */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}`;
}

/** Linear interpolate between two [r,g,b] colours by t∈[0,1]. */
function lerpRgb(
  c0: [number, number, number],
  c1: [number, number, number],
  t: number
): [number, number, number] {
  const u = Math.min(1, Math.max(0, t));
  return [
    c0[0] + (c1[0] - c0[0]) * u,
    c0[1] + (c1[1] - c0[1]) * u,
    c0[2] + (c1[2] - c0[2]) * u,
  ];
}

/**
 * Anchor points for {@link starColor}: approximate perceived sRGB of a blackbody
 * / main-sequence star at each Teff, from the hot blue O/B stars down to cool red
 * M dwarfs (through white A/F and the Sun's near-white G). Illustrative — a
 * smooth spectral-type colour ramp, not a calibrated blackbody locus.
 */
const STAR_COLOR_ANCHORS: { teff: number; rgb: [number, number, number] }[] = [
  { teff: 3000, rgb: [255, 190, 120] }, // M — orange-red
  { teff: 3700, rgb: [255, 208, 160] }, // late K / M
  { teff: 4500, rgb: [255, 228, 195] }, // K — pale orange
  { teff: 5200, rgb: [255, 244, 232] }, // early K / late G
  { teff: 5780, rgb: [255, 246, 237] }, // G — the Sun (near white, faint warm)
  { teff: 6500, rgb: [255, 255, 255] }, // F — white
  { teff: 7500, rgb: [244, 245, 255] }, // A/F — white with a blue hint
  { teff: 10000, rgb: [202, 216, 255] }, // A/B — bluish white
  { teff: 20000, rgb: [163, 184, 255] }, // B — blue-white
  { teff: 40000, rgb: [155, 176, 255] }, // O — blue
];

/**
 * ILLUSTRATIVE spectral colour of a star from its effective temperature, as a
 * "#rrggbb" hex string: hot O/B stars blue-white, the Sun (G, 5780 K) near-white
 * with a faint warm cast, cool M dwarfs orange-red. Linear-interpolated across
 * the {@link STAR_COLOR_ANCHORS} ramp and clamped at the ends.
 *
 * This is a RENDERING colour, not a measured spectrum. Falls back to a neutral
 * Sun-like white ("#fff4ea") if Teff is missing.
 */
export function starColor(teffK: number | null | undefined): string {
  if (!isNum(teffK)) return "#fff4ea";
  const anchors = STAR_COLOR_ANCHORS;
  if (teffK <= anchors[0].teff) {
    const c = anchors[0].rgb;
    return rgbToHex(c[0], c[1], c[2]);
  }
  const last = anchors[anchors.length - 1];
  if (teffK >= last.teff) return rgbToHex(last.rgb[0], last.rgb[1], last.rgb[2]);
  for (let i = 1; i < anchors.length; i++) {
    if (teffK <= anchors[i].teff) {
      const lo = anchors[i - 1];
      const hi = anchors[i];
      const t = (teffK - lo.teff) / (hi.teff - lo.teff);
      const [r, g, b] = lerpRgb(lo.rgb, hi.rgb, t);
      return rgbToHex(r, g, b);
    }
  }
  return rgbToHex(last.rgb[0], last.rgb[1], last.rgb[2]);
}

/**
 * ILLUSTRATIVE surface/atmosphere tint for a planet from its equilibrium
 * temperature and composition class, as a "#rrggbb" hex string. The intent is
 * purely visual cueing:
 *
 *   very hot (≳1000 K)  → incandescent orange-red (lava/glow worlds)
 *   hot (700–1000 K)    → hot orange
 *   warm (400–700 K)    → tan / desert
 *   temperate (250–400) → a blue-green hint for rocky worlds, tan for gaseous
 *   cold (150–250 K)    → pale blue-grey
 *   frigid (<150 K)     → icy near-white
 *
 * Gas giants and Neptune-like worlds are nudged toward banded tan/blue; rocky and
 * super-Earth worlds toward earth/ocean hues. This is NOT an observed colour — no
 * exoplanet's true colour is known at this fidelity — it is a renderer cue only.
 * Falls back to composition-only (or neutral grey) when eqt is missing.
 */
export function planetTint(
  eqtK: number | null | undefined,
  compositionClass?: CompositionClass | null
): string {
  const isGaseous =
    compositionClass === "gas-giant" ||
    compositionClass === "neptune-like" ||
    compositionClass === "sub-neptune";
  const isRocky =
    compositionClass === "rocky" || compositionClass === "super-earth";

  // No temperature: colour by class alone.
  if (!isNum(eqtK)) {
    if (isGaseous) return "#c9a97e"; // generic banded tan
    if (isRocky) return "#8a8f98"; // generic rocky grey
    return "#999999"; // unknown
  }

  // Temperature-driven base colour.
  let base: [number, number, number];
  if (eqtK >= 1000) base = [255, 90, 60]; // incandescent
  else if (eqtK >= 700) base = [255, 140, 66]; // hot orange
  else if (eqtK >= 400) base = [217, 160, 102]; // warm tan
  else if (eqtK >= 250) base = isRocky ? [110, 155, 145] : [200, 175, 140];
  else if (eqtK >= 150) base = [184, 198, 209]; // cold pale blue-grey
  else base = [220, 230, 240]; // icy near-white

  // Nudge temperate/cold gaseous worlds toward a bluer, banded look.
  if (isGaseous && eqtK < 400) base = lerpRgb(base, [150, 175, 205], 0.4);
  // Nudge temperate rocky worlds toward an ocean/land hint.
  if (isRocky && eqtK >= 200 && eqtK < 330)
    base = lerpRgb(base, [90, 140, 165], 0.35);

  return rgbToHex(base[0], base[1], base[2]);
}

// ─────────────────── Compare an orbit to the Solar System ────────────────────

/** Reference semi-major axes [AU] for the Solar-System comparison overlay. */
const MERCURY_AU = 0.387;
const EARTH_AU = 1.0;
const JUPITER_AU = 5.204;

export interface SolarSystemComparison {
  /** the planet's semi-major axis [AU] */
  smaAU: number;
  /** nearest Solar-System reference body by log-distance */
  nearest: "Mercury" | "Earth" | "Jupiter";
  /** honest one-line description */
  label: string;
}

/**
 * Classify an exoplanet's semi-major axis relative to the Solar System — a quick
 * "where would this orbit sit among our planets" cue for the HUD, benchmarked
 * against Mercury (0.39 AU), Earth (1 AU) and Jupiter (5.2 AU). Nearest reference
 * is chosen by log-distance (orbits span decades). Returns null if sma is
 * missing.
 */
export function compareToSolarSystem(
  smaAU: number | null | undefined
): SolarSystemComparison | null {
  if (!isNum(smaAU) || smaAU <= 0) return null;

  const refs: { name: "Mercury" | "Earth" | "Jupiter"; au: number }[] = [
    { name: "Mercury", au: MERCURY_AU },
    { name: "Earth", au: EARTH_AU },
    { name: "Jupiter", au: JUPITER_AU },
  ];
  let nearest = refs[0];
  let best = Infinity;
  for (const r of refs) {
    const d = Math.abs(Math.log(smaAU) - Math.log(r.au));
    if (d < best) {
      best = d;
      nearest = r;
    }
  }

  let label: string;
  if (smaAU < MERCURY_AU)
    label = `Interior to Mercury's orbit (${smaAU.toFixed(3)} AU < 0.39 AU)`;
  else if (smaAU < EARTH_AU)
    label = "Between Mercury's and Earth's orbits";
  else if (smaAU < JUPITER_AU)
    label = "Between Earth's and Jupiter's orbits";
  else label = `Beyond Jupiter's orbit (${smaAU.toFixed(2)} AU > 5.2 AU)`;

  return { smaAU, nearest: nearest.name, label };
}

/** Earth's semi-major axis [AU] = 1, so the frontend can overlay our system. */
export function earthOrbitReferenceAU(): number {
  return EARTH_AU;
}

// ─────────────────── Semi-major axis ↔ period (Kepler III) ───────────────────

/**
 * Kepler's third law for a planet about a star of mass `mStarMsun` [M_sun]:
 * P[yr]² = a[AU]³ / M_star. Used to fill in whichever of {period, sma} a
 * catalogue row omits so the architecture view can still place a planet.
 */
function periodDaysFromSma(smaAU: number, mStarMsun: number): number {
  const pYr = Math.sqrt((smaAU * smaAU * smaAU) / mStarMsun);
  return pYr * DAYS_PER_YEAR;
}

function smaFromPeriodDays(periodDays: number, mStarMsun: number): number {
  const pYr = periodDays / DAYS_PER_YEAR;
  return Math.cbrt(pYr * pYr * mStarMsun);
}

/**
 * Deterministic per-planet initial mean anomaly in [0, 2π) from a name hash
 * (FNV-1a). The absolute orbital phase of a real exoplanet is generally unknown,
 * so we SEED it deterministically (never random) purely to spread the planets
 * around the architecture view rather than stacking them on one radial line. The
 * relative angular SPEEDS remain physical. Documented in {@link systemLayout}.
 */
function seedPhase(name: string | undefined, index: number): number {
  const key = name && name.length ? name : `planet-${index}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 4294967296) * 2 * Math.PI;
}

// ─────────────────────────── System layout ─────────────────────────────────

export type RadialScaleMode = "log" | "sqrt" | "linear";

export interface SystemLayoutOptions {
  /**
   * How the radial (semi-major-axis) axis is compressed. "log" (default) and
   * "sqrt" map the system's [innerAU, outerAU] onto [minRadius, maxRadius] so a
   * 0.02 AU hot-Jupiter and a 10 AU outer giant are visible at once; "linear"
   * keeps true proportional distances (honest, but tightly-packed systems then
   * overlap near the star).
   */
  mode?: RadialScaleMode;
  /**
   * Animation time in DAYS since t=0. Advance it to animate the architecture
   * view; each planet's mean anomaly is seedPhase + 2π·(timeDays / period_days),
   * so shorter-period planets sweep faster — the relative speeds are physical.
   */
  timeDays?: number;
  /** host-star mass [M_sun], used to fill a missing period or sma. Default 1. */
  starMassMsun?: number;
  /** scene radius assigned to `innerAU` (log/sqrt). Default 1. */
  minRadius?: number;
  /** scene radius assigned to `outerAU` (log/sqrt). Default 10. */
  maxRadius?: number;
  /** AU mapped to `minRadius`. Default: auto-fit to the innermost planet. */
  innerAU?: number;
  /** AU mapped to `maxRadius`. Default: auto-fit to the outermost planet. */
  outerAU?: number;
  /** scene units per AU for "linear" mode. Default 1. */
  unitsPerAU?: number;
}

export interface SystemLayoutPlanet {
  name?: string;
  /** TRUE semi-major axis [AU] — use this for honest labels */
  sma_au: number;
  /** eccentricity used (0 if the catalogue omitted it) */
  ecc: number;
  /** scene X (top-down architecture plane) */
  x: number;
  /** scene Z (top-down architecture plane) */
  z: number;
  /** compressed scene radius from the star at this instant */
  sceneRadius: number;
  /** position angle [rad] in the scene (true anomaly from a +X periapsis) */
  angleRad: number;
}

export interface SystemLayout {
  /** placed planets (any lacking BOTH sma and period are omitted) */
  planets: SystemLayoutPlanet[];
  mode: RadialScaleMode;
  /** AU mapped to minRadius (after auto-fit) */
  innerAU: number;
  /** AU mapped to maxRadius (after auto-fit) */
  outerAU: number;
  /** number of input planets that could not be placed (no sma and no period) */
  omitted: number;
  /** human-readable honesty string for the UI */
  note: string;
}

/** Compress a semi-major axis [AU] to a scene radius per the chosen mode. */
function compressSma(
  au: number,
  mode: RadialScaleMode,
  innerAU: number,
  outerAU: number,
  minRadius: number,
  maxRadius: number,
  unitsPerAU: number
): number {
  if (mode === "linear") return au * unitsPerAU;
  if (outerAU <= innerAU) return (minRadius + maxRadius) / 2; // single-planet
  const f = mode === "sqrt" ? Math.sqrt : Math.log;
  const t = (f(au) - f(innerAU)) / (f(outerAU) - f(innerAU));
  return minRadius + t * (maxRadius - minRadius);
}

/**
 * Host-star-centric layout for the SYSTEM ARCHITECTURE view. For each planet we:
 *
 *   1. resolve its semi-major axis (from sma_au, or from period_days + star mass
 *      via Kepler's third law) — planets with neither are omitted;
 *   2. compress that sma to a scene radius (per {@link compressSma}) so the whole
 *      system fits on screen (auto-fitting [innerAU, outerAU] to the planets'
 *      real min/max sma unless the caller overrides them);
 *   3. advance a deterministic seed phase by 2π·(timeDays / period_days) and
 *      Kepler-solve M→E→ν, so the planet moves at the correct RELATIVE angular
 *      speed and, for an eccentric orbit, faster near periapsis; and
 *   4. modulate the compressed radius by (1 − e·cosE) = r/a so the eccentric
 *      orbit's shape shows around the compressed baseline (periapsis on +X).
 *
 * Scene mapping matches lib/geo / the planet & dwarf orreries (longitude 0 → +X,
 * +90° → −Z):  x = sceneRadius·cos(θ),  z = −sceneRadius·sin(θ).
 *
 * HONESTY: the planet ORDER and relative angular SPEEDS are physical, and the
 * TRUE sma_au is returned for every planet. But the compressed radius, the
 * absolute orbital PHASE (unknown for real exoplanets — seeded deterministically
 * from the name) and the shared +X periapsis orientation are ILLUSTRATIVE. The
 * returned `note` states this for the UI. Deterministic: same inputs → same
 * output, always.
 */
export function systemLayout(
  planets: ExoPlanet[],
  opts: SystemLayoutOptions = {}
): SystemLayout {
  const mode = opts.mode ?? "log";
  const timeDays = isNum(opts.timeDays) ? opts.timeDays : 0;
  const mStar = isNum(opts.starMassMsun) && opts.starMassMsun > 0 ? opts.starMassMsun : 1;
  const minRadius = opts.minRadius ?? 1;
  const maxRadius = opts.maxRadius ?? 10;
  const unitsPerAU = opts.unitsPerAU ?? 1;

  // 1. Resolve sma + period for every placeable planet (keep original index for
  //    a stable seed phase).
  const resolved: {
    p: ExoPlanet;
    index: number;
    sma: number;
    ecc: number;
    periodDays: number;
  }[] = [];
  let omitted = 0;
  planets.forEach((p, index) => {
    let sma = isNum(p.sma_au) && p.sma_au > 0 ? p.sma_au : NaN;
    let periodDays = isNum(p.period_days) && p.period_days > 0 ? p.period_days : NaN;
    if (!Number.isFinite(sma) && Number.isFinite(periodDays))
      sma = smaFromPeriodDays(periodDays, mStar);
    if (!Number.isFinite(periodDays) && Number.isFinite(sma))
      periodDays = periodDaysFromSma(sma, mStar);
    if (!Number.isFinite(sma) || !Number.isFinite(periodDays)) {
      omitted++;
      return;
    }
    const ecc = isNum(p.ecc) && p.ecc >= 0 && p.ecc < 1 ? p.ecc : 0;
    resolved.push({ p, index, sma, ecc, periodDays });
  });

  // 2. Auto-fit the compression window to the system unless overridden.
  const smas = resolved.map((r) => r.sma);
  const minSma = smas.length ? Math.min(...smas) : 1;
  const maxSma = smas.length ? Math.max(...smas) : 1;
  const innerAU = isNum(opts.innerAU) ? opts.innerAU : minSma * 0.9;
  const outerAU = isNum(opts.outerAU) ? opts.outerAU : maxSma * 1.1;

  // 3–4. Place each planet.
  const out: SystemLayoutPlanet[] = resolved.map(({ p, index, sma, ecc, periodDays }) => {
    const M = seedPhase(p.name ?? undefined, index) + 2 * Math.PI * (timeDays / periodDays);
    const E = solveKepler(M, ecc);
    const nu = Math.atan2(Math.sqrt(1 - ecc * ecc) * Math.sin(E), Math.cos(E) - ecc);
    const rOverA = 1 - ecc * Math.cos(E); // = r / a
    const baseR = compressSma(sma, mode, innerAU, outerAU, minRadius, maxRadius, unitsPerAU);
    const sceneRadius = baseR * rOverA;
    return {
      name: p.name,
      sma_au: sma,
      ecc,
      sceneRadius,
      x: sceneRadius * Math.cos(nu),
      z: -sceneRadius * Math.sin(nu),
      angleRad: nu,
    };
  });

  const note =
    mode === "linear"
      ? "Relative orbit sizes are to scale; orbital phase and periapsis orientation are illustrative (unknown for real exoplanets)."
      : `Orbit order and relative speeds are real; radial distances are ${mode}-compressed and orbital phase/orientation are illustrative.`;

  return { planets: out, mode, innerAU, outerAU, omitted, note };
}

// ─────────────────────────── HUD snapshot ──────────────────────────────────

export interface ExoPlanetDerived {
  name?: string;
  /** equilibrium temperature [K] (input eqt if present, else computed, else null) */
  eqtK: number | null;
  /** true if eqtK was computed here rather than taken from the catalogue */
  eqtComputed: boolean;
  /** composition estimate, or null if neither radius nor mass is known */
  composition: CompositionEstimate | null;
  /** conservative-band HZ membership: true / false / null (unknown) */
  inHabitableZone: boolean | null;
  /** illustrative planet tint "#rrggbb" */
  tint: string;
  /** Solar-System comparison, or null if sma unknown */
  solarSystem: SolarSystemComparison | null;
}

/**
 * Everything a per-planet exoplanet HUD needs in one pure call (mirrors
 * planetState / dwarfState), tolerant of the many missing fields real catalogue
 * rows carry. `star` supplies luminosity (LINEAR L_sun — convert with
 * {@link lsunFromLogLum} first) and Teff for the HZ / eqt derivations.
 */
export function exoPlanetDerived(
  planet: ExoPlanet,
  star: ExoStar
): ExoPlanetDerived {
  const lum = star.lum;
  const teff = star.teff;

  // Prefer the catalogue eqt; fall back to a computed value if we can.
  let eqtK: number | null = isNum(planet.eqt_k) ? planet.eqt_k : null;
  let eqtComputed = false;
  if (eqtK === null) {
    const computed = equilibriumTempK(lum, planet.sma_au);
    if (computed !== null) {
      eqtK = computed;
      eqtComputed = true;
    }
  }

  const composition = compositionClass(planet.radius_re, planet.mass_me);
  const inHabitableZone = isInHabitableZone(planet.sma_au, lum, teff, {
    conservative: true,
  });

  return {
    name: planet.name,
    eqtK,
    eqtComputed,
    composition,
    inHabitableZone,
    tint: planetTint(eqtK, composition?.class ?? null),
    solarSystem: compareToSolarSystem(planet.sma_au),
  };
}
