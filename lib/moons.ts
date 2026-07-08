/**
 * Orbital physics for the MAJOR MOONS — the "major moons" phase of the digital
 * twin. This is the satellite analogue of lib/planets.ts (heliocentric planets)
 * and lib/lunar.ts (Earth's Moon), and it powers two views:
 *
 *   1. a per-planet MOON MINI-ORRERY (each parent's moons in their real orbits,
 *      all on screen at once), and
 *   2. per-moon GLOBES (a day/night terminator on each tidally-locked body),
 *
 * Like every other lib/ physics module, every public function is a pure function
 * of a JavaScript UTC `Date`, so it unit-tests cleanly (lib/moons.test.ts) and
 * the frontend can reuse the same dot(P̂, sunDir) > 0 terminator pattern via
 * {@link moonSunDirection}.
 *
 * NOTE: Earth's Moon is deliberately NOT here — it has its own high-precision
 * module (lib/lunar.ts, Meeus theory). This module covers the major satellites
 * of the giant planets.
 *
 * ── Sources (physics-env-simulation skill: real physics, documented, or it
 *    doesn't ship — no invented numbers) ─────────────────────────────────────
 *
 *   • Orbital elements (semi-major axis, sidereal period, eccentricity,
 *     inclination to the parent's Laplace/equatorial plane): JPL Solar System
 *     Dynamics, "Planetary Satellite Mean Orbital Parameters".
 *     https://ssd.jpl.nasa.gov/sats/elem/
 *
 *   • Physical parameters (mean radius, geometric albedo): JPL Solar System
 *     Dynamics, "Planetary Satellite Physical Parameters".
 *     https://ssd.jpl.nasa.gov/sats/phys_par/
 *
 *   • Mean surface temperatures: NASA/GSFC planetary bodies pages and the
 *     Voyager/Galileo/Cassini/Voyager-2 mission summaries (cited per-body value
 *     in the table; these are the widely-published mean-surface figures).
 *
 * Parent heliocentric periods used for the synodic (true solar-day) correction
 * come from the NASA/GSFC Planetary Fact Sheet, same source lib/planets.ts cites.
 *
 * ── Honesty notes (documented so the HUD can label everything truthfully) ────
 *
 *   • Mini-orrery: the ANGLE of each moon in its orbit is real (from its
 *     sidereal period, retrograde handled by a signed period). Only the RADIUS
 *     is compressed — real parent-distances vary hugely (Mimas 185,500 km →
 *     Iapetus 3,560,900 km; Io 421,700 km → Callisto 1,882,700 km; Titan
 *     1,221,900 km) so a compression like planets.orreryLayout is needed for all
 *     of a planet's moons to be visible together. See {@link moonOrreryLayout}.
 *
 *   • Terminator: every major regular moon is TIDALLY LOCKED, so its rotation
 *     period equals its orbital period and it keeps one face ("sub-parent point")
 *     toward the parent. We model the sub-solar longitude as sweeping the surface
 *     exactly once per orbital period (direction from the sign of the period —
 *     retrograde Triton sweeps the other way). This is a deliberate
 *     simplification: the sub-parent point is treated as fixed, the sub-solar
 *     point sweeps once per orbit, and the sub-solar latitude is taken as ~0
 *     (major-moon obliquities are near zero → negligible seasons, exactly as the
 *     Moon is handled in lib/lunar.ts). Rate and direction are physical; the
 *     absolute phase is an adopted convention (sub-solar lon 0 at J2000), the
 *     same convention caveat as lib/planets.ts subSolarLongitude.
 *
 * Coordinate convention: any lat/lon → 3D still goes through lib/geo
 * (lon 0→+X, 90E→−Z, N→+Y; globe mesh unrotated). NEVER rotate a globe.
 */

import { latLonToVector3, normalizeLon } from "./geo";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const TWO_PI = Math.PI * 2;

/** Unix ms at the J2000 epoch (2000-01-01 12:00:00 TT ≈ UTC for our purposes). */
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const DAY_MS = 86_400_000;

/** Normalize an angle to [0, 360). */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Normalize an angle to (-180, 180]. */
function norm180(deg: number): number {
  const d = norm360(deg);
  return d > 180 ? d - 360 : d;
}

/** Normalize a radian angle to [0, 2π). */
function norm2pi(rad: number): number {
  return ((rad % TWO_PI) + TWO_PI) % TWO_PI;
}

/**
 * Earth days of TT elapsed since J2000.0 for a UTC instant. We fold in
 * ΔT = TT − UTC ≈ 69.2 s for the modern leap-second era (same approximation,
 * and same honesty note, as lib/planets.ts / lib/lunar.ts / lib/mars-time.ts).
 * At moon-orbit rates this is utterly negligible.
 */
function daysSinceJ2000(date: Date): number {
  return (date.getTime() + 69_184 - J2000_UNIX_MS) / DAY_MS;
}

// ─────────────────────────── Identifiers ────────────────────────────────────

export type ParentPlanet = "Jupiter" | "Saturn" | "Neptune";

export type MoonName =
  | "Io"
  | "Europa"
  | "Ganymede"
  | "Callisto"
  | "Titan"
  | "Enceladus"
  | "Mimas"
  | "Iapetus"
  | "Triton";

/** The parents that carry major moons in this module, orrery-outward. */
export const PARENT_ORDER: readonly ParentPlanet[] = [
  "Jupiter",
  "Saturn",
  "Neptune",
] as const;

/** All major moons, grouped by parent (Jupiter → Saturn → Neptune). */
export const MOON_ORDER: readonly MoonName[] = [
  "Io",
  "Europa",
  "Ganymede",
  "Callisto",
  "Titan",
  "Enceladus",
  "Mimas",
  "Iapetus",
  "Triton",
] as const;

// ─────────────────────────── Constants table ────────────────────────────────

export interface MoonOrbit {
  /** semi-major axis from the parent's centre [km] (JPL mean orbital params) */
  semiMajorAxisKm: number;
  /**
   * sidereal orbital period [Earth days]. NEGATIVE for a RETROGRADE orbit
   * (Triton) — the sign flows through {@link moonOrbitAngle} and
   * {@link moonSubSolarLongitude} so retrograde motion reverses automatically.
   */
  siderealPeriodDays: number;
  /** orbital eccentricity [–] (JPL mean orbital params) */
  eccentricity: number;
  /** inclination to the parent's equator / Laplace plane [deg] (JPL) */
  inclinationDeg: number;
}

export interface MoonPhysical {
  /** mean radius [km] (JPL physical params) */
  meanRadiusKm: number;
  /** mean surface temperature [K] (mission-summary value; see per-body note) */
  meanSurfaceTempK: number;
  /** geometric (visual) albedo [–] (JPL physical params) */
  geometricAlbedo: number;
  /** tidally locked to the parent (true for all major regular moons) */
  tidallyLocked: boolean;
}

export interface MoonData {
  name: MoonName;
  parent: ParentPlanet;
  orbit: MoonOrbit;
  physical: MoonPhysical;
}

/**
 * The full per-moon table. Orbital elements are JPL "Planetary Satellite Mean
 * Orbital Parameters"; radii and albedos are JPL "Planetary Satellite Physical
 * Parameters"; mean surface temperatures are the widely-published mission-summary
 * values (noted per body). All major regular moons here are tidally locked, so
 * rotation period = orbital period (that is what makes {@link moonSunDirection}
 * a one-parameter sweep). Sources cited in the module header.
 */
export const MOONS: Record<MoonName, MoonData> = {
  // ── Jupiter: the four Galilean moons ──
  Io: {
    name: "Io",
    parent: "Jupiter",
    orbit: {
      semiMajorAxisKm: 421_700,
      siderealPeriodDays: 1.769138,
      eccentricity: 0.0041,
      inclinationDeg: 0.036,
    },
    physical: {
      meanRadiusKm: 1821.6,
      meanSurfaceTempK: 110, // mean; day ~130 K, volcanic hotspots far higher
      geometricAlbedo: 0.63,
      tidallyLocked: true,
    },
  },
  Europa: {
    name: "Europa",
    parent: "Jupiter",
    orbit: {
      semiMajorAxisKm: 671_034,
      siderealPeriodDays: 3.551181,
      eccentricity: 0.0094,
      inclinationDeg: 0.466,
    },
    physical: {
      meanRadiusKm: 1560.8,
      meanSurfaceTempK: 102, // mean; ~50 K night → ~125 K day
      geometricAlbedo: 0.67,
      tidallyLocked: true,
    },
  },
  Ganymede: {
    name: "Ganymede",
    parent: "Jupiter",
    orbit: {
      semiMajorAxisKm: 1_070_412,
      siderealPeriodDays: 7.154553,
      eccentricity: 0.0013,
      inclinationDeg: 0.177,
    },
    physical: {
      meanRadiusKm: 2634.1, // LARGEST moon in the Solar System
      meanSurfaceTempK: 110, // mean; ~70 K night → ~152 K day
      geometricAlbedo: 0.43,
      tidallyLocked: true,
    },
  },
  Callisto: {
    name: "Callisto",
    parent: "Jupiter",
    orbit: {
      semiMajorAxisKm: 1_882_709,
      siderealPeriodDays: 16.689018,
      eccentricity: 0.0074,
      inclinationDeg: 0.192,
    },
    physical: {
      meanRadiusKm: 2410.3,
      meanSurfaceTempK: 134, // mean (Galileo); ~80 K night → ~165 K day
      geometricAlbedo: 0.22,
      tidallyLocked: true,
    },
  },
  // ── Saturn ──
  Titan: {
    name: "Titan",
    parent: "Saturn",
    orbit: {
      semiMajorAxisKm: 1_221_870,
      siderealPeriodDays: 15.945421,
      eccentricity: 0.0288,
      inclinationDeg: 0.349,
    },
    physical: {
      meanRadiusKm: 2574.7, // solid-body radius (thick atmosphere above)
      meanSurfaceTempK: 94, // Huygens in-situ surface temp ≈ 93.7 K
      geometricAlbedo: 0.22,
      tidallyLocked: true,
    },
  },
  Enceladus: {
    name: "Enceladus",
    parent: "Saturn",
    orbit: {
      semiMajorAxisKm: 238_042,
      siderealPeriodDays: 1.370218,
      eccentricity: 0.0047,
      inclinationDeg: 0.009,
    },
    physical: {
      meanRadiusKm: 252.1,
      meanSurfaceTempK: 75, // mean; fresh-ice surface, ~32–75 K
      geometricAlbedo: 1.375, // most reflective body in the Solar System
      tidallyLocked: true,
    },
  },
  Mimas: {
    name: "Mimas",
    parent: "Saturn",
    orbit: {
      semiMajorAxisKm: 185_539,
      siderealPeriodDays: 0.942422,
      eccentricity: 0.0196,
      inclinationDeg: 1.574,
    },
    physical: {
      meanRadiusKm: 198.2,
      meanSurfaceTempK: 64, // Cassini mean
      geometricAlbedo: 0.962,
      tidallyLocked: true,
    },
  },
  Iapetus: {
    name: "Iapetus",
    parent: "Saturn",
    orbit: {
      semiMajorAxisKm: 3_560_854,
      siderealPeriodDays: 79.330183,
      eccentricity: 0.0283,
      inclinationDeg: 15.47, // large tilt to Saturn's equator (unusual)
    },
    physical: {
      meanRadiusKm: 734.5,
      meanSurfaceTempK: 110, // mean; two-tone surface, ~90 K bright → ~130 K dark
      geometricAlbedo: 0.25, // representative; dark leading side ~0.05, bright ~0.6
      tidallyLocked: true,
    },
  },
  // ── Neptune ──
  Triton: {
    name: "Triton",
    parent: "Neptune",
    orbit: {
      semiMajorAxisKm: 354_759,
      // RETROGRADE — stored negative so the sign propagates through the orrery
      // angle and the terminator sweep. |P| = 5.876854 d.
      siderealPeriodDays: -5.876854,
      eccentricity: 0.000016, // essentially circular
      inclinationDeg: 156.865, // >90° ⇒ retrograde (to Neptune's equator)
    },
    physical: {
      meanRadiusKm: 1353.4,
      meanSurfaceTempK: 38, // COLDEST measured body in the Solar System (Voyager 2)
      geometricAlbedo: 0.76,
      tidallyLocked: true,
    },
  },
};

/**
 * Parent heliocentric sidereal orbital periods [Earth days] (NASA/GSFC Planetary
 * Fact Sheet — same source as lib/planets.ts). Used only for the small synodic
 * correction in {@link synodicPeriodDays}; the moon orbit and terminator do not
 * depend on it.
 */
export const PARENT_ORBITAL_PERIOD_DAYS: Record<ParentPlanet, number> = {
  Jupiter: 4332.589,
  Saturn: 10_759.22,
  Neptune: 60_189,
};

// ─────────────────────── Period / retrograde helpers ────────────────────────

/** Signed sidereal orbital period [Earth days]; negative ⇒ retrograde (Triton). */
export function orbitalPeriodDays(moon: MoonName): number {
  return MOONS[moon].orbit.siderealPeriodDays;
}

/** True ⇒ the moon orbits retrograde (negative period). Only Triton, here. */
export function isRetrograde(moon: MoonName): boolean {
  return MOONS[moon].orbit.siderealPeriodDays < 0;
}

/**
 * Length of one solar day on the moon in Earth days — the "day length" the HUD
 * shows. For a tidally-locked moon this is (to a documented approximation) its
 * sidereal orbital period: it keeps one face to the parent, so the sub-solar
 * point returns to the same body-fixed longitude once per orbit.
 *
 * HONESTY NOTE: the TRUE solar day is the synodic period ({@link synodicPeriodDays}),
 * fractionally longer because the parent also crawls around the Sun. The
 * difference is < ~1% for every moon here (largest for Iapetus, ~0.7%; the giant
 * planets' heliocentric periods are thousands of days), so the UI uses
 * |orbital period| and says so.
 */
export function dayLengthDays(moon: MoonName): number {
  return Math.abs(MOONS[moon].orbit.siderealPeriodDays);
}

/**
 * Synodic orbital period [Earth days] — the moon's TRUE solar day, i.e. how long
 * between successive local noons, accounting for the parent's slow heliocentric
 * motion:  1/T_syn = 1/T_moon − 1/T_parent  (signed T_moon handles retrograde).
 * Returned as a positive magnitude. Differs from {@link dayLengthDays} by < ~1%.
 */
export function synodicPeriodDays(moon: MoonName): number {
  const sidSigned = MOONS[moon].orbit.siderealPeriodDays;
  const parentDays = PARENT_ORBITAL_PERIOD_DAYS[MOONS[moon].parent];
  const nSyn = 1 / sidSigned - 1 / parentDays;
  return Math.abs(1 / nSyn);
}

/** Human "day length" note for the HUD, honest about the locking simplification. */
export function dayLengthNote(moon: MoonName): string {
  const p = dayLengthDays(moon).toFixed(3);
  return `Tidally locked: one solar day ≈ one orbit (${p} Earth days).`;
}

// ─────────────────────────── Laplace resonance ──────────────────────────────

export interface LaplaceResonance {
  /** Europa/Io sidereal-period ratio (ideal 2) */
  europaOverIo: number;
  /** Ganymede/Io sidereal-period ratio (ideal 4) */
  ganymedeOverIo: number;
  /** period ratios normalized to Io = 1: [1, ~2, ~4] */
  ratios: [number, number, number];
  /** true if the ratios are within the given fractional tolerance of 1:2:4 */
  isLaplace: boolean;
  /** honest one-line description for the UI */
  note: string;
}

/**
 * The Io:Europa:Ganymede **1:2:4 Laplace resonance**, computed straight from the
 * period table (not asserted). Io completes ~4 orbits, Europa ~2 and Ganymede ~1
 * in the same span, and the three are mean-motion locked so a triple conjunction
 * can never occur. `tol` is the fractional tolerance on each ratio (default 5%),
 * so the real periods (ratios ≈ 2.007 and 4.044) comfortably register as resonant.
 */
export function laplaceResonance(tol = 0.05): LaplaceResonance {
  const io = Math.abs(MOONS.Io.orbit.siderealPeriodDays);
  const europa = Math.abs(MOONS.Europa.orbit.siderealPeriodDays);
  const ganymede = Math.abs(MOONS.Ganymede.orbit.siderealPeriodDays);
  const europaOverIo = europa / io;
  const ganymedeOverIo = ganymede / io;
  const isLaplace =
    Math.abs(europaOverIo - 2) <= 2 * tol &&
    Math.abs(ganymedeOverIo - 4) <= 4 * tol;
  return {
    europaOverIo,
    ganymedeOverIo,
    ratios: [1, europaOverIo, ganymedeOverIo],
    isLaplace,
    note:
      "Io : Europa : Ganymede orbital periods ≈ 1 : 2 : 4 " +
      "(the Laplace mean-motion resonance).",
  };
}

// ─────────────────────────── Grouping helper ────────────────────────────────

/**
 * Moons grouped by parent, each list sorted by semi-major axis ASCENDING
 * (innermost first) — the natural order for a per-planet mini-orrery and moon
 * pickers. Only parents that carry moons in this module appear.
 */
export function moonsByParent(): Record<ParentPlanet, MoonName[]> {
  const out = { Jupiter: [], Saturn: [], Neptune: [] } as Record<
    ParentPlanet,
    MoonName[]
  >;
  for (const name of MOON_ORDER) out[MOONS[name].parent].push(name);
  for (const parent of PARENT_ORDER) {
    out[parent].sort(
      (a, b) => MOONS[a].orbit.semiMajorAxisKm - MOONS[b].orbit.semiMajorAxisKm
    );
  }
  return out;
}

// ─────────────────────── Radial compression (mini-orrery) ───────────────────

export type RadialScaleMode = "log" | "sqrt" | "linear";

export interface MoonOrreryOptions {
  /**
   * How the parent-distance is compressed. "log" (default) and "sqrt" squeeze a
   * planet's whole moon system into one view; "linear" keeps true proportional
   * distances (honest, but Iapetus then sits ~19× further than Mimas).
   */
  mode?: RadialScaleMode;
  /** scene radius assigned to `innerKm` (log/sqrt modes). Default 1. */
  minRadius?: number;
  /** scene radius assigned to `outerKm` (log/sqrt modes). Default 10. */
  maxRadius?: number;
  /** parent-distance [km] mapped to `minRadius`. */
  innerKm?: number;
  /** parent-distance [km] mapped to `maxRadius`. */
  outerKm?: number;
  /** scene units per km for "linear" mode. Default 1e-6 (Mm). */
  unitsPerKm?: number;
}

/** Global fallback inner/outer bounds [km] spanning all moons here. */
const DEFAULT_INNER_KM = 150_000; // just inside Mimas (185,500 km)
const DEFAULT_OUTER_KM = 3_700_000; // just outside Iapetus (3,560,900 km)

/**
 * Compress a true parent-distance (km) to a scene radius per the chosen mode.
 * log/sqrt map [innerKm, outerKm] onto [minRadius, maxRadius] so a planet's
 * moons are all visible at once; linear is a straight km × unitsPerKm scaling.
 * If the range is degenerate (a one-moon parent) the moon is placed at the
 * midpoint of [minRadius, maxRadius].
 */
export function compressMoonRadius(
  km: number,
  opts: MoonOrreryOptions = {}
): number {
  const mode = opts.mode ?? "log";
  if (mode === "linear") {
    return km * (opts.unitsPerKm ?? 1e-6);
  }
  const minRadius = opts.minRadius ?? 1;
  const maxRadius = opts.maxRadius ?? 10;
  const innerKm = opts.innerKm ?? DEFAULT_INNER_KM;
  const outerKm = opts.outerKm ?? DEFAULT_OUTER_KM;
  const f = mode === "sqrt" ? Math.sqrt : Math.log;
  const span = f(outerKm) - f(innerKm);
  if (span === 0) return (minRadius + maxRadius) / 2;
  const t = (f(km) - f(innerKm)) / span;
  return minRadius + t * (maxRadius - minRadius);
}

// ─────────────────────── Moon position around the parent ────────────────────

export interface MoonOrbitPosition {
  /** angular position in the orbit [rad, 0–2π), advancing with the period sign */
  angleRad: number;
  /** scene X in the parent-centred plane (lib/geo handedness) */
  x: number;
  /** scene Z in the parent-centred plane (lib/geo handedness) */
  z: number;
  /** compressed scene radius from the parent (see {@link compressMoonRadius}) */
  distanceScene: number;
}

/**
 * Angular position of a moon in its orbit around the parent at a UTC instant,
 * plus a parent-centred scene position. The angle is
 *
 *   θ(t) = 2π · (daysSinceJ2000 / P)            (P signed — retrograde reverses)
 *
 * so it is a real, deterministic function of the sidereal period: prograde moons
 * advance in +θ, retrograde Triton advances in −θ. The scene mapping matches the
 * lib/geo / planets.orreryLayout convention (θ = 0 → +X, +90° → −Z):
 *
 *   x =  distanceScene · cos θ
 *   z = −distanceScene · sin θ
 *
 * HONESTY NOTE: the angle is real; only the RADIUS is compressed (moons' true
 * parent-distances span ~20× within a single system). The true distance is the
 * semi-major axis in {@link MOONS}; {@link moonOrreryLayout} returns it alongside
 * so the frontend can label the scene honestly.
 */
export function moonOrbitAngle(
  moon: MoonName,
  date: Date,
  opts: MoonOrreryOptions = {}
): MoonOrbitPosition {
  const period = MOONS[moon].orbit.siderealPeriodDays; // signed
  const t = daysSinceJ2000(date);
  const angleRad = norm2pi(TWO_PI * (t / period));
  const distanceScene = compressMoonRadius(
    MOONS[moon].orbit.semiMajorAxisKm,
    opts
  );
  return {
    angleRad,
    x: distanceScene * Math.cos(angleRad),
    z: -distanceScene * Math.sin(angleRad),
    distanceScene,
  };
}

export interface MoonOrreryBody {
  name: MoonName;
  /** angular position in the orbit [rad, 0–2π) — the REAL angle */
  angleRad: number;
  /** scene X (parent-centred plane) */
  x: number;
  /** scene Z (parent-centred plane) */
  z: number;
  /** compressed scene radius from the parent */
  sceneRadius: number;
  /** TRUE semi-major axis [km] — use this for honest labels */
  distanceKm: number;
  retrograde: boolean;
}

export interface MoonOrreryLayout {
  parent: ParentPlanet;
  bodies: MoonOrreryBody[];
  mode: RadialScaleMode;
  /** human-readable honesty string for the UI */
  note: string;
}

/**
 * Positions for one parent's moon mini-orrery. The ANGLE of each moon is its
 * real orbital angle at `date`; only the RADIUS is compressed (per
 * {@link compressMoonRadius}) so the whole system — inner to outer — is visible
 * together. Unless overridden, the inner/outer km bounds auto-fit this parent's
 * own moon span (a 10% pad each side), which is why each planet's mini-orrery
 * uses its full radial range. True km distances are returned for honest labels.
 */
export function moonOrreryLayout(
  parent: ParentPlanet,
  date: Date,
  opts: MoonOrreryOptions = {}
): MoonOrreryLayout {
  const mode = opts.mode ?? "log";
  const names = moonsByParent()[parent];
  const axes = names.map((n) => MOONS[n].orbit.semiMajorAxisKm);
  // Auto-fit the radial window to this parent's own moons unless the caller
  // pinned innerKm/outerKm (a 10% pad keeps moons off the rails).
  const resolved: MoonOrreryOptions = {
    ...opts,
    mode,
    innerKm: opts.innerKm ?? Math.min(...axes) * 0.9,
    outerKm: opts.outerKm ?? Math.max(...axes) * 1.1,
  };

  const bodies: MoonOrreryBody[] = names.map((name) => {
    const pos = moonOrbitAngle(name, date, resolved);
    return {
      name,
      angleRad: pos.angleRad,
      x: pos.x,
      z: pos.z,
      sceneRadius: pos.distanceScene,
      distanceKm: MOONS[name].orbit.semiMajorAxisKm,
      retrograde: isRetrograde(name),
    };
  });

  const note =
    mode === "linear"
      ? "Orbital angles and radial distances are both to scale."
      : `Orbital angles are real; radial distances ${mode}-compressed for visibility.`;
  return { parent, bodies, mode, note };
}

// ─────────────────── Synchronous rotation → sub-solar / terminator ───────────

/**
 * Sub-solar longitude in the moon's body-fixed frame [deg, (−180, 180]] at a UTC
 * instant. Because the moon is tidally locked, the sub-solar point sweeps the
 * surface exactly once per ORBITAL period. Prograde moons sweep it westward
 * (negative rate, like Earth's −15°/hr); retrograde Triton sweeps it eastward
 * (the sign of the period flips it):
 *
 *   λ_sub(t) = −360° · (daysSinceJ2000 / P)          (P signed)
 *
 * HONESTY NOTE (same as lib/planets.ts subSolarLongitude): the sweep RATE and
 * DIRECTION are physical; the absolute PHASE is anchored to λ_sub = 0 at J2000 as
 * an adopted convention (pinning it to a named surface meridian would need the
 * IAU prime-meridian constant, out of scope for this layer). For a day/night
 * terminator that is exactly enough — the terminator sweeps at the correct rate
 * in the correct direction.
 */
export function moonSubSolarLongitude(moon: MoonName, date: Date): number {
  const period = MOONS[moon].orbit.siderealPeriodDays; // signed
  const t = daysSinceJ2000(date);
  return norm180(-360 * (t / period));
}

/**
 * Sub-solar point (lat/lon, deg) in the moon's body-fixed frame. The LATITUDE is
 * taken as 0 — the major moons have near-zero obliquity to their orbits, so (as
 * with the Moon in lib/lunar.ts) the sub-solar point stays essentially on the
 * equator and seasons are negligible. This is the documented simplification: the
 * sub-parent point is fixed, the sub-solar point sweeps once per orbit at the
 * equator. Longitude is {@link moonSubSolarLongitude}.
 */
export function moonSubSolarPoint(
  moon: MoonName,
  date: Date
): { lat: number; lon: number } {
  return { lat: 0, lon: normalizeLon(moonSubSolarLongitude(moon, date)) };
}

/**
 * Unit vector from the moon's centre toward the Sun, in the globe's body-fixed
 * frame (lib/geo axis convention). Feed directly to the terminator shader as the
 * `sunDir` uniform: a surface point P is in daylight iff dot(P̂, sunDir) > 0. The
 * exact analogue of solar.ts sunDirection, planets.ts planetSunDirection and
 * lunar.ts moonSunDirection.
 */
export function moonSunDirection(
  moon: MoonName,
  date: Date
): [number, number, number] {
  const { lat, lon } = moonSubSolarPoint(moon, date);
  return latLonToVector3(lat, lon, 1);
}

// ─────────────────────────── HUD snapshot ───────────────────────────────────

export interface MoonSnapshot {
  name: MoonName;
  parent: ParentPlanet;
  orbit: MoonOrbitPosition;
  subsolar: { lat: number; lon: number };
  sunDirection: [number, number, number];
  /** signed sidereal orbital period [Earth days] */
  orbitalPeriodDays: number;
  /** solar-day length [Earth days] (= |orbital period| for locked moons) */
  dayLengthDays: number;
  retrograde: boolean;
  tidallyLocked: boolean;
}

/**
 * Everything a per-moon globe HUD needs in one pure call (mirrors planetState /
 * moonState / marsClock), so a component reads one snapshot per tick. `opts`
 * flows through to the orbit-position compression.
 */
export function moonSnapshot(
  moon: MoonName,
  date: Date,
  opts: MoonOrreryOptions = {}
): MoonSnapshot {
  const data = MOONS[moon];
  return {
    name: moon,
    parent: data.parent,
    orbit: moonOrbitAngle(moon, date, opts),
    subsolar: moonSubSolarPoint(moon, date),
    sunDirection: moonSunDirection(moon, date),
    orbitalPeriodDays: data.orbit.siderealPeriodDays,
    dayLengthDays: dayLengthDays(moon),
    retrograde: isRetrograde(moon),
    tidallyLocked: data.physical.tidallyLocked,
  };
}
