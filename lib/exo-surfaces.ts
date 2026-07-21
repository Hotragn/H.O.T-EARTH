/**
 * Physics for the "Exoplanet Surfaces" tab — what the SKY and the physical
 * conditions would really be like standing on a handful of REAL exoplanets,
 * computed only from cited, measured catalogue parameters
 * (public/data/exoplanets/systems.json, NASA Exoplanet Archive pscomppars).
 *
 * ── THE honesty framing (the whole point of the tab) ─────────────────────────
 *
 * NO exoplanet surface has ever been imaged — not one pixel. So the GROUND is
 * ALWAYS illustrative (the frontend labels it as such). What this library
 * computes is the SKY and the physical conditions, all from measured numbers:
 *
 *   • the host star's apparent angular size and illustrative colour,
 *   • sibling planets seen as discs (max apparent size at closest approach),
 *   • surface gravity, irradiance, equilibrium temperature, year length.
 *
 * Two things are explicitly INFERENCES, not measurements, and are labelled:
 *   • tidal locking (guessed for close-in worlds around low-mass stars), and
 *   • rotation / day-length (rotation periods are NOT measured for these worlds).
 *
 * A gas-giant vantage has NO SURFACE at all: the API returns hasSurface=false
 * and a clear "no ground to stand on" state, with null surface gravity.
 *
 * ── Reuse ───────────────────────────────────────────────────────────────────
 * Everything derivable already lives in lib/exoplanets.ts and is reused here:
 * starColor, equilibriumTempK, isInHabitableZone, compositionClass,
 * lsunFromLogLum, and the ExoStar / ExoPlanet / ExoSystem types.
 *
 * ── Rules ────────────────────────────────────────────────────────────────────
 * Pure, deterministic functions. Bad input returns null, never throws. No
 * runtime network calls. Real physics + documented data only — no invented
 * numbers. The catalogue is passed in as plain objects (this module reads no
 * file itself), exactly like lib/exoplanets.ts.
 *
 * ── Sources / constants ──────────────────────────────────────────────────────
 *   • Angular diameter of a sphere of radius R at distance d: δ = 2·atan(R/d).
 *   • Solar / lunar reference angular diameters: the Sun subtends ≈0.5333° and
 *     the full Moon ≈0.52° from Earth (standard almanac values) — the yardsticks
 *     for "×our Sun" and "×our Moon".
 *   • Surface gravity of a rocky world relative to Earth: g = M / R² in Earth
 *     units (Newtonian point-mass surface field), ×9.80665 m/s² for SI.
 *   • Irradiance: insolation is already Earth-relative (S⊕); the solar constant
 *     1361 W/m² converts it to W/m² (Kopp & Lean 2011, TSI).
 *   • Stefan–Boltzmann radius derivation (when a catalogue star lacks a measured
 *     radius): L = 4πR²σT⁴  ⇒  R/R☉ = √(L/L☉)·(T☉/Teff)², with T☉ = 5772 K
 *     (IAU 2015 nominal solar effective temperature).
 *   • 1 AU = 1.495978707×10⁸ km (IAU 2012); R☉ = 696000 km (IAU 2015 nominal);
 *     R⊕ = 6371 km (mean).
 */

import {
  compositionClass,
  equilibriumTempK,
  isInHabitableZone,
  lsunFromLogLum,
  starColor,
  type CompositionEstimate,
  type ExoPlanet,
  type ExoStar,
  type ExoSystem,
} from "./exoplanets";

// ─────────────────────────── Physical constants ────────────────────────────

/** 1 astronomical unit in km (IAU 2012). */
const AU_KM = 1.495978707e8;
/** Nominal solar radius in km (IAU 2015). */
const RSUN_KM = 696000;
/** Mean Earth radius in km. */
const REARTH_KM = 6371;
/** Apparent angular diameter of the Sun from Earth [deg] — the "×Sun" yardstick. */
const SUN_ANGULAR_DIAMETER_DEG = 0.5333;
/** Apparent angular diameter of the full Moon from Earth [deg] — the "×Moon" yardstick. */
const MOON_ANGULAR_DIAMETER_DEG = 0.52;
/** Solar constant / total solar irradiance at 1 AU [W/m²] (Kopp & Lean 2011). */
const SOLAR_CONSTANT_WM2 = 1361;
/** Standard gravity [m/s²] — converts Earth-relative g to SI. */
const G_EARTH_MS2 = 9.80665;
/** IAU 2015 nominal solar effective temperature [K] for the S–B radius derivation. */
const SUN_TEFF_K = 5772;

const RAD2DEG = 180 / Math.PI;

// ─────────────────────────── Null-safe helpers ─────────────────────────────

/** True if x is a finite, usable number. */
function isNum(x: number | null | undefined): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** Angular diameter [deg] of a sphere of radius `rKm` at distance `dKm`. */
function angularDiameterDeg(rKm: number, dKm: number): number {
  return 2 * Math.atan(rKm / dKm) * RAD2DEG;
}

/**
 * A star's radius in R☉: measured `rad` if present, else derived from
 * luminosity + Teff via Stefan–Boltzmann (R/R☉ = √(L/L☉)·(T☉/Teff)²).
 * Returns { rSun, derived } or null if neither path is possible.
 * `lumLinear` MUST be LINEAR L☉ (convert an archive log value first).
 */
function starRadiusRsun(
  radRsun: number | null | undefined,
  lumLinear: number | null | undefined,
  teffK: number | null | undefined
): { rSun: number; derived: boolean } | null {
  if (isNum(radRsun) && radRsun > 0) return { rSun: radRsun, derived: false };
  if (isNum(lumLinear) && lumLinear > 0 && isNum(teffK) && teffK > 0) {
    const rSun = Math.sqrt(lumLinear) * Math.pow(SUN_TEFF_K / teffK, 2);
    return { rSun, derived: true };
  }
  return null;
}

// ─────────────────────────── Vantage registry ──────────────────────────────

/** A curated place to "stand" — a real planet present in systems.json. */
export interface ExoVantage {
  /** stable id used by the UI / exoSurfaceState */
  id: string;
  /** display name for the tab */
  displayName: string;
  /** host system's hostname (matches systems.json) */
  hostname: string;
  /** the vantage planet's name (matches systems.json) */
  planetName: string;
  /** one-line honest reason this world is worth standing on */
  blurb: string;
}

/**
 * The curated vantage worlds. All are present in the shipped catalogue.
 *  • TRAPPIST-1 e — the showcase: a huge salmon-red sun and sibling worlds as
 *    discs bigger than our Moon.
 *  • Proxima Centauri b — the nearest exoplanet; likely tidally locked
 *    (INFERENCE) around a flaring red dwarf.
 *  • TOI-700 d — a temperate, roughly Earth-size world in its star's HZ.
 *  • 51 Pegasi b — the first exoplanet found around a Sun-like star, a hot
 *    Jupiter: the honest NO-SURFACE counterpart.
 */
export const EXO_VANTAGES: ExoVantage[] = [
  {
    id: "trappist-1e",
    displayName: "TRAPPIST-1 e",
    hostname: "TRAPPIST-1",
    planetName: "TRAPPIST-1 e",
    blurb:
      "The showcase: a salmon-red sun ~4× the width of ours, and sibling worlds " +
      "that at closest approach loom larger than our full Moon.",
  },
  {
    id: "proxima-cen-b",
    displayName: "Proxima Centauri b",
    hostname: "Proxima Cen",
    planetName: "Proxima Cen b",
    blurb:
      "The nearest exoplanet, in the habitable zone of a flaring red dwarf; " +
      "likely tidally locked (inferred, not measured).",
  },
  {
    id: "toi-700-d",
    displayName: "TOI-700 d",
    hostname: "TOI-700",
    planetName: "TOI-700 d",
    blurb:
      "A temperate, roughly Earth-size world in the habitable zone of a quiet " +
      "M dwarf.",
  },
  {
    id: "51-peg-b",
    displayName: "51 Pegasi b",
    hostname: "51 Peg",
    planetName: "51 Peg b",
    blurb:
      "The first planet found around a Sun-like star — a hot Jupiter with NO " +
      "surface: there is no ground to stand on.",
  },
];

/** Look up a vantage definition by id. Null if unknown (never throws). */
export function getExoVantage(id: string | null | undefined): ExoVantage | null {
  if (!id) return null;
  return EXO_VANTAGES.find((v) => v.id === id) ?? null;
}

/** A vantage resolved against a loaded catalogue: its system, star and planet. */
export interface ResolvedVantage {
  vantage: ExoVantage;
  system: ExoSystem;
  star: ExoStar;
  /** the planet you are standing on */
  planet: ExoPlanet;
  /** every OTHER planet in the same system */
  siblings: ExoPlanet[];
}

/**
 * Resolve a vantage id against a loaded `systems` array (systems.json). Returns
 * the matched system/star/planet/siblings, or null if the id is unknown or the
 * system/planet is absent (never throws).
 */
export function resolveVantage(
  id: string | null | undefined,
  systems: ExoSystem[] | null | undefined
): ResolvedVantage | null {
  const vantage = getExoVantage(id);
  if (!vantage || !Array.isArray(systems)) return null;
  const system = systems.find((s) => s.hostname === vantage.hostname);
  if (!system || !Array.isArray(system.planets)) return null;
  const planet = system.planets.find((p) => p.name === vantage.planetName);
  if (!planet) return null;
  const siblings = system.planets.filter((p) => p.name !== vantage.planetName);
  return { vantage, system, star: system.star, planet, siblings };
}

// ─────────────────────────── Host star in the sky ──────────────────────────

export interface HostStarSky {
  /** apparent angular diameter of the host star [deg] */
  angularDiameterDeg: number;
  /** illustrative colour from Teff, "#rrggbb" */
  color: string;
  /** effective temperature [K] used */
  teffK: number | null;
  /** angularDiameterDeg / 0.5333 — how many "our Suns" wide it looks */
  timesOurSun: number;
  /** spectral type string from the catalogue, if any */
  spectralType: string | null;
  /** stellar radius [R☉] used */
  starRadiusRsun: number;
  /** true if the radius was DERIVED via Stefan–Boltzmann (no catalogue radius) */
  radiusDerived: boolean;
  /** honest note */
  note: string;
}

/**
 * The host star as seen from the vantage: apparent angular diameter
 * (δ = 2·atan(R★/d) with d = the planet's semi-major axis), illustrative colour
 * (starColor by Teff), and how many times wider it looks than our Sun.
 *
 * If the star lacks a measured radius, R★ is DERIVED from luminosity + Teff via
 * Stefan–Boltzmann and the note says so. Returns null if the distance (sma) or
 * the radius (measured or derivable) is missing.
 */
export function hostStarSky(v: ResolvedVantage | null): HostStarSky | null {
  if (!v) return null;
  const { star, planet } = v;
  const smaAU = planet.sma_au;
  if (!isNum(smaAU) || smaAU <= 0) return null;

  const lumLinear = lsunFromLogLum(star.lum);
  const r = starRadiusRsun(star.rad, lumLinear, star.teff);
  if (!r) return null;

  const dKm = smaAU * AU_KM;
  const rKm = r.rSun * RSUN_KM;
  const deg = angularDiameterDeg(rKm, dKm);

  return {
    angularDiameterDeg: deg,
    color: starColor(star.teff),
    teffK: isNum(star.teff) ? star.teff : null,
    timesOurSun: deg / SUN_ANGULAR_DIAMETER_DEG,
    spectralType: star.spectype ?? null,
    starRadiusRsun: r.rSun,
    radiusDerived: r.derived,
    note:
      "Apparent size δ = 2·atan(R★ / a) from the measured stellar radius and " +
      "the planet's semi-major axis; colour is an illustrative Teff→RGB mapping, " +
      "not a measured spectrum." +
      (r.derived
        ? " Stellar radius was derived from luminosity and Teff (Stefan–Boltzmann), no catalogue radius."
        : ""),
  };
}

// ─────────────────────────── Sibling planets as discs ──────────────────────

export interface SiblingDisc {
  name?: string;
  /** max apparent angular diameter at closest approach (conjunction) [deg] */
  maxAngularDiameterDeg: number;
  /** maxAngularDiameterDeg / 0.52 — how many "our Moons" wide it can get */
  timesMoon: number;
  /** the sibling's radius [Earth radii] */
  radiusRe: number;
  /** minimum sma separation used [AU] */
  minSeparationAU: number;
}

/**
 * The other planets of the system seen as discs from the vantage, each at its
 * LARGEST possible apparent size — closest approach, where the sma separation is
 * |a_vantage − a_sibling|. δ = 2·atan(R_planet / min-separation). Sorted largest
 * first; siblings lacking a radius or sma are skipped.
 *
 * HONESTY: this is the maximum at conjunction. The planets are not always this
 * big, are usually farther, and are frequently on the far side of the star. The
 * note states this.
 */
export function siblingDiscs(v: ResolvedVantage | null): {
  discs: SiblingDisc[];
  note: string;
} | null {
  if (!v) return null;
  const aV = v.planet.sma_au;
  if (!isNum(aV) || aV <= 0) return null;

  const discs: SiblingDisc[] = [];
  for (const s of v.siblings) {
    if (!isNum(s.radius_re) || s.radius_re <= 0) continue;
    if (!isNum(s.sma_au) || s.sma_au <= 0) continue;
    const sepAU = Math.abs(aV - s.sma_au);
    if (sepAU <= 0) continue; // co-orbital / same sma: undefined closest approach
    const sepKm = sepAU * AU_KM;
    const rKm = s.radius_re * REARTH_KM;
    discs.push({
      name: s.name,
      maxAngularDiameterDeg: angularDiameterDeg(rKm, sepKm),
      timesMoon: angularDiameterDeg(rKm, sepKm) / MOON_ANGULAR_DIAMETER_DEG,
      radiusRe: s.radius_re,
      minSeparationAU: sepAU,
    });
  }
  discs.sort((a, b) => b.maxAngularDiameterDeg - a.maxAngularDiameterDeg);

  return {
    discs,
    note:
      "Maximum apparent size at closest approach (conjunction), from each " +
      "sibling's measured radius and the |Δ semi-major-axis| separation. They are " +
      "not always this large, are usually farther, and are often on the far side " +
      "of the star.",
  };
}

// ─────────────────────────── Surface gravity ───────────────────────────────

export interface SurfaceGravity {
  /** surface gravity relative to Earth (g = M / R² in Earth units) */
  gEarth: number;
  /** surface gravity [m/s²] */
  ms2: number;
  note: string;
}

/**
 * Surface gravity of a ROCKY world: g = M⊕ / R⊕² relative to Earth (Newtonian
 * point-mass surface field), and ×9.80665 for m/s². Returns null unless BOTH
 * mass and radius are known AND the composition class is rocky / super-Earth —
 * a gas giant or sub-Neptune has no solid surface, so "surface gravity" is
 * meaningless and we return null.
 */
export function surfaceGravityG(
  planet: ExoPlanet | null | undefined
): SurfaceGravity | null {
  if (!planet) return null;
  if (!isNum(planet.mass_me) || planet.mass_me <= 0) return null;
  if (!isNum(planet.radius_re) || planet.radius_re <= 0) return null;
  const comp = compositionClass(planet.radius_re, planet.mass_me);
  if (!comp || (comp.class !== "rocky" && comp.class !== "super-earth")) {
    return null;
  }
  const gEarth = planet.mass_me / (planet.radius_re * planet.radius_re);
  return {
    gEarth,
    ms2: gEarth * G_EARTH_MS2,
    note:
      "g = M/R² in Earth units (Newtonian surface field), from the measured mass " +
      "and radius; only meaningful for a rocky world.",
  };
}

/** True only for a world with a solid surface to stand on (rocky / super-Earth). */
export function hasSurface(planet: ExoPlanet | null | undefined): boolean {
  if (!planet) return false;
  const comp = compositionClass(planet.radius_re, planet.mass_me);
  if (!comp) return false;
  return comp.class === "rocky" || comp.class === "super-earth";
}

// ─────────────────────────── Irradiance ────────────────────────────────────

export interface Irradiance {
  /** insolation relative to Earth (S⊕) — verbatim catalogue value */
  earths: number;
  /** irradiance [W/m²] = S⊕ × 1361 */
  wm2: number;
  note: string;
}

/**
 * Irradiance at the vantage: the catalogue's insolation (already Earth-relative)
 * plus W/m² via the solar constant (1361 W/m²). Null if insolation is missing.
 */
export function irradianceEarths(
  planet: ExoPlanet | null | undefined
): Irradiance | null {
  if (!planet || !isNum(planet.insol) || planet.insol < 0) return null;
  return {
    earths: planet.insol,
    wm2: planet.insol * SOLAR_CONSTANT_WM2,
    note:
      "Insolation is the measured Earth-relative flux (S⊕); ×1361 W/m² (solar " +
      "constant) gives the top-of-atmosphere flux.",
  };
}

// ─────────────────────────── Tidal-lock inference ──────────────────────────

export interface TidalLockInference {
  /** best GUESS: is the world likely tidally locked? */
  likelyLocked: boolean;
  /** ALWAYS true here — this is an inference, never a measurement */
  inferred: boolean;
  note: string;
}

/** Below this stellar mass [M☉], close-in worlds are widely expected to be locked. */
const LOW_STELLAR_MASS_MSUN = 0.6;
/** Inside this semi-major axis [AU], tidal locking timescales are short. */
const CLOSE_IN_SMA_AU = 0.4;

/**
 * INFERENCE (not a measurement): is a close-in world around a low-mass star
 * likely tidally locked? Heuristic — a planet inside ~0.4 AU of a star below
 * ~0.6 M☉ has a short tidal-locking timescale and is generally expected to be
 * synchronously rotating. `inferred` is ALWAYS true so the UI must label it.
 * Returns null if the stellar mass or the planet's sma is missing.
 */
export function tidalLockInference(
  planet: ExoPlanet | null | undefined,
  star: ExoStar | null | undefined
): TidalLockInference | null {
  if (!planet || !star) return null;
  if (!isNum(planet.sma_au) || planet.sma_au <= 0) return null;
  if (!isNum(star.mass) || star.mass <= 0) return null;
  const likelyLocked =
    star.mass < LOW_STELLAR_MASS_MSUN && planet.sma_au < CLOSE_IN_SMA_AU;
  return {
    likelyLocked,
    inferred: true,
    note:
      "INFERRED, not measured: no rotation period has been observed for this " +
      "world. Close-in planets (< ~0.4 AU) around low-mass stars (< ~0.6 M☉) are " +
      "widely expected to be tidally locked, giving permanent day and night sides.",
  };
}

// ─────────────────────────── Year + day length ─────────────────────────────

export interface YearInfo {
  /** orbital period [days] = one local year */
  yearDays: number;
  /** the same in Earth years */
  yearEarthYears: number;
  /** honest note about rotation / day length */
  dayLengthNote: string;
}

/** Days in a Julian year. */
const DAYS_PER_YEAR = 365.25;

/**
 * Year length (= the measured orbital period) and an honest day-length note.
 * Rotation periods are NOT measured for these worlds; if tidal locking is
 * inferred, the day equals the year (permanent day/night sides) — labelled as an
 * inference. Returns null if the period is missing.
 */
export function yearInfo(
  planet: ExoPlanet | null | undefined,
  star: ExoStar | null | undefined
): YearInfo | null {
  if (!planet || !isNum(planet.period_days) || planet.period_days <= 0) {
    return null;
  }
  const lock = tidalLockInference(planet, star);
  const dayLengthNote = lock?.likelyLocked
    ? "Rotation period is not measured. If tidally locked (inferred), the day " +
      "equals the year and one hemisphere faces the star permanently."
    : "Rotation period is not measured, so the length of a day is unknown.";
  return {
    yearDays: planet.period_days,
    yearEarthYears: planet.period_days / DAYS_PER_YEAR,
    dayLengthNote,
  };
}

// ─────────────────────────── Full surface state ────────────────────────────

export interface RealVsIllustrative {
  /** what is computed from real measured parameters */
  real: string[];
  /** what is inferred (labelled) */
  inferred: string[];
  /** what is purely illustrative (the frontend's job to label) */
  illustrative: string[];
}

export interface ExoSurfaceState {
  vantageId: string;
  displayName: string;
  hostname: string;
  distanceLy: number | null;
  discovery: { method: string | null; year: number | null };
  /** false for a gas giant / no solid surface */
  hasSurface: boolean;
  composition: CompositionEstimate | null;
  /** null when hasSurface is false */
  hostStarSky: HostStarSky | null;
  siblingDiscs: { discs: SiblingDisc[]; note: string } | null;
  surfaceGravity: SurfaceGravity | null;
  irradiance: Irradiance | null;
  /** equilibrium temperature [K]: catalogue value if present, else computed */
  equilibriumTempK: number | null;
  eqtComputed: boolean;
  year: YearInfo | null;
  tidalLock: TidalLockInference | null;
  inHabitableZone: boolean | null;
  realVsIllustrative: RealVsIllustrative;
  note: string;
}

/**
 * One bundle for the "Exoplanet Surfaces" tab: the host star's sky, sibling
 * discs, surface gravity, irradiance, equilibrium temperature, year, tidal-lock
 * inference, composition and HZ membership — plus a realVsIllustrative note the
 * UI can render, and an explicit hasSurface flag (false for a gas giant).
 *
 * `systems` is the loaded systems.json array. Returns null for an unknown
 * vantage id or an absent system/planet (never throws).
 */
export function exoSurfaceState(
  vantageId: string | null | undefined,
  systems: ExoSystem[] | null | undefined
): ExoSurfaceState | null {
  const v = resolveVantage(vantageId, systems);
  if (!v) return null;
  const { vantage, system, star, planet } = v;

  const surface = hasSurface(planet);
  const composition = compositionClass(planet.radius_re, planet.mass_me);

  // Equilibrium temperature: prefer the measured catalogue value.
  let eqtK: number | null = isNum(planet.eqt_k) ? planet.eqt_k : null;
  let eqtComputed = false;
  if (eqtK === null) {
    const computed = equilibriumTempK(
      lsunFromLogLum(star.lum),
      planet.sma_au
    );
    if (computed !== null) {
      eqtK = computed;
      eqtComputed = true;
    }
  }

  const sky = hostStarSky(v);
  const tidalLock = tidalLockInference(planet, star);

  const realVsIllustrative: RealVsIllustrative = {
    real: [
      "Host star apparent size and every angular measurement",
      "Sibling planet disc sizes at closest approach",
      surface ? "Surface gravity" : "Bulk density / composition class",
      "Irradiance and equilibrium temperature",
      "Year length (orbital period)",
    ],
    inferred: [
      "Tidal locking (rotation state)",
      "Day length",
      "Composition class from radius/mass",
    ],
    illustrative: [
      "The GROUND and any terrain — no exoplanet surface has ever been imaged",
      "Star and planet colours (illustrative Teff→RGB, not measured spectra)",
      "Sky brightness, weather, and any life",
    ],
  };

  return {
    vantageId: vantage.id,
    displayName: vantage.displayName,
    hostname: system.hostname ?? vantage.hostname,
    distanceLy: isNum(system.distance_ly) ? system.distance_ly : null,
    discovery: {
      method: planet.method ?? null,
      year: isNum(planet.disc_year) ? planet.disc_year : null,
    },
    hasSurface: surface,
    composition,
    hostStarSky: sky,
    siblingDiscs: siblingDiscs(v),
    surfaceGravity: surfaceGravityG(planet),
    irradiance: irradianceEarths(planet),
    equilibriumTempK: eqtK,
    eqtComputed,
    year: yearInfo(planet, star),
    tidalLock,
    inHabitableZone: isInHabitableZone(
      planet.sma_au,
      lsunFromLogLum(star.lum),
      star.teff,
      { conservative: true }
    ),
    realVsIllustrative,
    note: surface
      ? "The sky and physical conditions are computed from measured NASA " +
        "Exoplanet Archive parameters; the ground is illustrative — no exoplanet " +
        "surface has ever been imaged."
      : "This is a gas giant: there is NO solid surface to stand on. The sky " +
        "values describe conditions at the cloud-top level; surface gravity is " +
        "undefined.",
  };
}
