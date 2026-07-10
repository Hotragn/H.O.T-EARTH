/**
 * Heliocentric orbital physics for the DWARF PLANETS — the "dwarf planets" phase
 * of the digital twin. It is the trans-Neptunian / main-belt analogue of
 * lib/planets.ts (major planets) and lib/moons.ts (major moons), and it powers
 * the same two views:
 *
 *   1. an ORRERY (each dwarf planet in its real orbit, on screen with — or beyond
 *      — the eight planets), and
 *   2. per-body GLOBES (a day/night terminator on each little world),
 *
 * plus Pluto's companion CHARON as a satellite. Like every other lib/ physics
 * module, every public function is a pure function of a JavaScript UTC `Date`, so
 * it unit-tests cleanly (lib/dwarf-planets.test.ts) and the frontend can reuse
 * the shared dot(P̂, sunDir) > 0 terminator pattern via {@link dwarfSunDirection}.
 *
 * What makes these bodies different from the eight planets: their orbits are
 * HIGHLY ECCENTRIC and STEEPLY INCLINED. Pluto (e≈0.25, i≈17°) actually dips
 * inside Neptune's orbit near perihelion; Eris (e≈0.44, i≈44°) swings from ~38 AU
 * out to ~98 AU. Their heliocentric distances span ~2.77 AU (Ceres, in the
 * asteroid belt) to ~68 AU (Eris' semi-major axis) — a ~25× range — so the orrery
 * needs the same honest radial compression the planet/moon orreries use.
 *
 * ── Sources (physics-env-simulation skill: real physics, documented, or it
 *    doesn't ship — no invented numbers) ─────────────────────────────────────
 *
 *   • Orbital elements (a, e, i, Ω, ω, mean anomaly at epoch) and sidereal
 *     orbital periods: JPL Small-Body Database (SBDB),
 *     https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html — the mean-element
 *     solutions for 134340 Pluto, 1 Ceres, 136199 Eris, 136108 Haumea and
 *     136472 Makemake, referred to the J2000.0 ecliptic. Pluto's row also matches
 *     JPL's extended Keplerian table (Standish, "Approximate Positions", Table 2,
 *     3000 BC–3000 AD, which alone among the JPL tables carries Pluto).
 *
 *   • Physical / rotational data (mean radius, rotation period, geometric albedo,
 *     mean surface temperature, satellite count) and Haumea's triaxial shape:
 *     NASA/JPL body pages, the NASA/GSFC fact pages and the New Horizons (Pluto,
 *     Charon) and Dawn (Ceres) mission results. Per-body values cited inline.
 *
 *   • Charon's orbit about Pluto (a ≈ 19,591 km, P ≈ 6.387 d, mutual tidal lock):
 *     NASA New Horizons / JPL Pluto-system parameters.
 *
 * ── Algorithm (heliocentric position) — the "mean-anomaly-at-epoch" method ───
 *
 * Unlike lib/planets.ts (which uses JPL Table-1 elements WITH per-century rates),
 * the SBDB publishes a single mean-element set at one epoch. So we propagate the
 * mean anomaly forward with a constant mean motion derived from the semi-major
 * axis by Kepler's third law, then Kepler-solve exactly as the planets do:
 *
 *   1. n = 360° / (a^{3/2} · 365.25)             mean motion [deg/day] (a in AU)
 *   2. M(t) = M₀ + n·(t − epoch)                 t, epoch in TT days
 *   3. solve Kepler's equation  M = E − e·sinE   by Newton iteration
 *   4. in-orbital-plane coords  x' = a(cosE − e),  y' = a·√(1−e²)·sinE
 *   5. rotate by ω (arg. of perihelion), i (inclination), Ω (node) into the
 *      J2000 ecliptic frame → heliocentric x,y,z (AU)
 *
 * Deriving n from a means the propagation period equals {@link keplerPeriodYears}
 * exactly, and that agrees with each body's tabulated SBDB period to well under
 * 1%. Accuracy is honest, not exact: these are MEAN elements (osculating elements
 * of these distant, planet-perturbed bodies wander), good to a few tenths of a
 * degree over the modern era — far beyond what an orrery or a terminator needs,
 * but not a DE/JPL-Horizons ephemeris.
 *
 * ── Honesty notes (documented so the HUD can label everything truthfully) ────
 *
 *   • Orrery: the ANGLE of each body is real (its heliocentric ecliptic
 *     longitude); only the RADIUS is log-compressed so Ceres (2.77 AU) and Eris
 *     (up to ~98 AU) are visible together. True distanceAU is always returned.
 *   • Terminator: sub-solar longitude sweeps at the body's ROTATION rate; the
 *     rate is physical, but the absolute phase is an adopted convention (λ_sub = 0
 *     at J2000) and the sub-solar LATITUDE is taken as ~0 — most dwarf-planet pole
 *     orientations are poorly constrained, so (as with lib/moons.ts) we model no
 *     seasonal tilt. Documented so the frontend labels it honestly.
 *   • Charon keeps one face to Pluto (mutual tidal lock): its rotation period is
 *     its ~6.387 d orbital period about Pluto.
 *
 * Coordinate convention: any lat/lon → 3D still goes through lib/geo
 * (lon 0→+X, 90E→−Z, N→+Y; globe mesh unrotated). NEVER rotate a globe.
 */

import { latLonToVector3, normalizeLon } from "./geo";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** Unix ms at the J2000 epoch (2000-01-01 12:00:00 TT ≈ UTC for our purposes). */
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
/** Julian Date of J2000.0 — the epoch all elements below are referred to. */
const J2000_JD = 2451545.0;
const DAY_MS = 86_400_000;
const DAYS_PER_YEAR = 365.25;

/** Normalize an angle to [0, 360). */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Normalize an angle to (-180, 180]. */
function norm180(deg: number): number {
  const d = norm360(deg);
  return d > 180 ? d - 360 : d;
}

// ─────────────────────────── Identifiers ────────────────────────────────────

/** The five IAU-recognised dwarf planets covered here. */
export type DwarfName = "Ceres" | "Pluto" | "Haumea" | "Makemake" | "Eris";

/**
 * Bodies that have a modelled rotation → terminator. The five dwarf planets plus
 * Charon, whose spin is locked to its orbit about Pluto (it has no independent
 * heliocentric orbit, so it is excluded from {@link DwarfName}).
 */
export type SpinningBody = DwarfName | "Charon";

/**
 * The five dwarf planets in order of semi-major axis (Ceres in the asteroid
 * belt, then the four trans-Neptunians) — the natural order for iterating the
 * orrery outward.
 */
export const DWARF_ORDER: readonly DwarfName[] = [
  "Ceres",
  "Pluto",
  "Haumea",
  "Makemake",
  "Eris",
] as const;

// ─────────────────────────── Constants table ────────────────────────────────

/**
 * J2000.0 mean heliocentric orbital elements (JPL Small-Body Database). All
 * angles in DEGREES, `a` in AU. `meanAnomalyDeg` (M₀) is the mean anomaly AT the
 * epoch; `epochJD` is that epoch as a Julian Date (J2000.0 for every body here,
 * kept as a field so a future SBDB refresh at a different epoch drops straight
 * in). Mean motion is derived from `a` (Kepler's third law), so no rate terms are
 * stored. See the module header for the propagation recipe and the honesty note.
 */
export interface DwarfOrbit {
  /** semi-major axis a [AU] */
  a: number;
  /** eccentricity e [–] */
  e: number;
  /** inclination i to the J2000 ecliptic [deg] */
  iDeg: number;
  /** longitude of ascending node Ω [deg] */
  nodeDeg: number;
  /** argument of perihelion ω [deg] */
  argPeriDeg: number;
  /** mean anomaly M₀ at the epoch [deg] */
  meanAnomalyDeg: number;
  /** epoch of M₀ as a Julian Date (J2000.0 = 2451545.0 for all bodies here) */
  epochJD: number;
  /** tabulated sidereal orbital period [Earth years] (SBDB) */
  siderealPeriodYears: number;
}

/**
 * Physical & rotational constants. `rotationPeriodHours` is the sidereal spin
 * period; because these bodies' heliocentric periods are centuries long, the
 * sidereal and solar rotation periods differ by < 0.1%, so this doubles as the
 * body's "day length". `triaxialAxesKm` is present only for Haumea, whose rapid
 * 3.9 h spin has forced it into a Jacobi ellipsoid rather than a sphere.
 * `rotationUncertain` flags the periods that remain observationally debated.
 */
export interface DwarfPhysical {
  /** volumetric mean radius [km] */
  meanRadiusKm: number;
  /** sidereal rotation period [hours] */
  rotationPeriodHours: number;
  /** rotation period is observationally uncertain / debated (Eris, Makemake) */
  rotationUncertain: boolean;
  /** geometric (visual) albedo [–] */
  geometricAlbedo: number;
  /** mean surface temperature [K] (see per-body note) */
  meanSurfaceTempK: number;
  /** number of known natural satellites */
  moonCount: number;
  /**
   * Full triaxial axis lengths a > b > c [km] for a non-spherical body (Haumea
   * only). These are the OVERALL dimensions (long/intermediate/short axes), not
   * the semi-axes — halve them to scale a unit-sphere mesh. `undefined` ⇒ treat
   * the body as a sphere of {@link meanRadiusKm}.
   */
  triaxialAxesKm?: { a: number; b: number; c: number };
}

export interface DwarfData {
  name: DwarfName;
  designation: string;
  orbit: DwarfOrbit;
  physical: DwarfPhysical;
  /** true if a spacecraft has resolved its surface (Pluto: New Horizons 2015;
   *  Ceres: Dawn 2015) */
  imaged: boolean;
}

/**
 * The full per-body table. Orbital elements and sidereal periods are JPL SBDB
 * mean-element solutions (J2000.0); physical parameters are the NASA/JPL body
 * pages and mission results. Every value is cited in the module header, with
 * per-body specifics noted inline. Mean anomalies (M₀) are the published J2000.0
 * mean anomalies (honest to a few tenths of a degree — an orrery, not an
 * ephemeris).
 */
export const DWARFS: Record<DwarfName, DwarfData> = {
  // ── Ceres (1 Ceres) — the only dwarf planet in the asteroid belt ──
  Ceres: {
    name: "Ceres",
    designation: "1 Ceres",
    orbit: {
      a: 2.7658,
      e: 0.0785,
      iDeg: 10.594,
      nodeDeg: 80.328,
      argPeriDeg: 73.597,
      meanAnomalyDeg: 77.372,
      epochJD: J2000_JD,
      siderealPeriodYears: 4.601,
    },
    physical: {
      meanRadiusKm: 469.7, // Dawn shape model
      rotationPeriodHours: 9.074,
      rotationUncertain: false,
      geometricAlbedo: 0.09, // dark, carbonaceous surface
      meanSurfaceTempK: 167, // mean ≈ −106 °C; peaks ~235 K in sunlight (Dawn)
      moonCount: 0,
    },
    imaged: true, // Dawn orbited 2015–2018
  },
  // ── Pluto (134340 Pluto) — the archetype, 3:2 resonance with Neptune ──
  Pluto: {
    name: "Pluto",
    designation: "134340 Pluto",
    orbit: {
      a: 39.482,
      e: 0.2488,
      iDeg: 17.16,
      nodeDeg: 110.30393684,
      argPeriDeg: 113.76497945,
      meanAnomalyDeg: 14.86012204,
      epochJD: J2000_JD,
      siderealPeriodYears: 247.94,
    },
    physical: {
      meanRadiusKm: 1188.3, // New Horizons 2015 (the definitive value)
      rotationPeriodHours: 153.2928, // = Charon's 6.3872 d orbit (mutual lock)
      rotationUncertain: false,
      geometricAlbedo: 0.52, // varies 0.49–0.66 across the surface
      meanSurfaceTempK: 44, // ~40–44 K
      moonCount: 5, // Charon, Nix, Hydra, Kerberos, Styx
    },
    imaged: true, // New Horizons flyby 2015
  },
  // ── Haumea (136108 Haumea) — fast rotator, triaxial, ringed, two moons ──
  Haumea: {
    name: "Haumea",
    designation: "136108 Haumea",
    orbit: {
      a: 43.22,
      e: 0.1911,
      iDeg: 28.21,
      nodeDeg: 121.9,
      argPeriDeg: 240.2,
      meanAnomalyDeg: 217.77,
      epochJD: J2000_JD,
      siderealPeriodYears: 284.12,
    },
    physical: {
      // Volume-equivalent radius of the triaxial ellipsoid below (~780 km).
      meanRadiusKm: 780,
      rotationPeriodHours: 3.9155, // one of the fastest spins of any large body
      rotationUncertain: false,
      geometricAlbedo: 0.51, // bright, crystalline-ice surface
      meanSurfaceTempK: 50, // < 50 K
      moonCount: 2, // Hiʻiaka, Namaka
      // Overall dimensions (long × intermediate × short), a Jacobi ellipsoid.
      triaxialAxesKm: { a: 2100, b: 1680, c: 1074 },
    },
    imaged: false,
  },
  // ── Makemake (136472 Makemake) — bright methane-ice TNO, one faint moon ──
  Makemake: {
    name: "Makemake",
    designation: "136472 Makemake",
    orbit: {
      a: 45.43,
      e: 0.161,
      iDeg: 28.98,
      nodeDeg: 79.62,
      argPeriDeg: 294.83,
      meanAnomalyDeg: 153.0,
      epochJD: J2000_JD,
      siderealPeriodYears: 306.21,
    },
    physical: {
      meanRadiusKm: 715, // stellar-occultation shape (2011)
      rotationPeriodHours: 22.8266,
      rotationUncertain: true, // ~22.8 h favoured; a ~7.77 h alias is disputed
      geometricAlbedo: 0.77, // very bright methane frost
      meanSurfaceTempK: 40, // ~30–40 K
      moonCount: 1, // S/2015 (136472) 1 ("MK2")
    },
    imaged: false,
  },
  // ── Eris (136199 Eris) — most massive dwarf planet, extreme orbit ──
  Eris: {
    name: "Eris",
    designation: "136199 Eris",
    orbit: {
      a: 67.78,
      e: 0.4407,
      iDeg: 44.04,
      nodeDeg: 35.951,
      argPeriDeg: 151.639,
      meanAnomalyDeg: 204.16,
      epochJD: J2000_JD,
      siderealPeriodYears: 558.04,
    },
    physical: {
      meanRadiusKm: 1163, // stellar occultation (2010); nearly Pluto's size
      rotationPeriodHours: 15.8, // long-debated
      rotationUncertain: true, // values from ~14 h to ~25.9 h have been reported
      geometricAlbedo: 0.96, // one of the most reflective bodies known
      meanSurfaceTempK: 30, // ~30 K at its current great distance
      moonCount: 1, // Dysnomia
    },
    imaged: false,
  },
};

// ─────────────────────────── Charon (Pluto's moon) ──────────────────────────

/**
 * Charon — Pluto's largest moon, so large (radius ~606 km vs Pluto's ~1188 km)
 * that the pair orbit a barycenter OUTSIDE Pluto. It is mutually tidally locked:
 * Charon's rotation period equals its ~6.387 d orbital period about Pluto, and
 * Pluto rotates with the same period. Modelled here as a satellite (it has no
 * heliocentric orbit of its own) so it appears in the rotation/terminator
 * helpers but not in {@link DWARF_ORDER}. Orbit/params: NASA New Horizons / JPL.
 */
export const CHARON = {
  name: "Charon" as const,
  parent: "Pluto" as const,
  orbit: {
    /** semi-major axis about Pluto [km] */
    semiMajorAxisKm: 19_591,
    /** sidereal orbital period about Pluto [Earth days] */
    siderealPeriodDays: 6.3872,
    /** eccentricity [–] (essentially circular) */
    eccentricity: 0.0002,
    /** inclination to Pluto's equator [deg] (Charon defines that plane) */
    inclinationDeg: 0.0,
    /** mutual tidal lock with Pluto */
    tidallyLocked: true,
  },
  physical: {
    meanRadiusKm: 606, // New Horizons 2015
    /** rotation period [hours] = orbital period about Pluto (locked) */
    rotationPeriodHours: 6.3872 * 24, // 153.2928 h
    geometricAlbedo: 0.35,
    meanSurfaceTempK: 53,
  },
  imaged: true, // resolved by New Horizons 2015
};

/** Sidereal orbital period of Charon about Pluto [Earth days] (~6.387 d). */
export function charonOrbitalPeriodDays(): number {
  return CHARON.orbit.siderealPeriodDays;
}

// ─────────────────────────── Time / epoch helpers ───────────────────────────

/**
 * Julian Date (Terrestrial Time) of a UTC instant. We fold in ΔT = TT − UTC ≈
 * 69.2 s for the modern leap-second era (same approximation, and same honesty
 * note, as lib/planets.ts / lib/moons.ts / lib/lunar.ts). At dwarf-planet
 * mean-motion rates this is utterly negligible.
 */
export function julianDateTT(date: Date): number {
  return 2440587.5 + (date.getTime() + 69_184) / DAY_MS;
}

/** Earth days of TT elapsed since J2000.0 for a UTC instant. */
function daysSinceJ2000(date: Date): number {
  return (date.getTime() + 69_184 - J2000_UNIX_MS) / DAY_MS;
}

// ─────────────────────────── Kepler's equation ─────────────────────────────

/**
 * Solve Kepler's equation M = E − e·sinE for the eccentric anomaly E (radians)
 * by Newton–Raphson. `M` is the mean anomaly in radians, `e` the eccentricity.
 * Identical in shape to lib/planets.ts solveKepler, but here it must stay robust
 * at HIGH eccentricity — Eris' e ≈ 0.44 is more than twice any major planet's —
 * so it uses the standard E = π starting guess for e ≥ 0.8 and still converges
 * quadratically. Exported so the solver's convergence can be unit-tested.
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

// ──────────────────────── Heliocentric position ────────────────────────────

/** Heliocentric ecliptic coordinates (J2000 frame), astronomical units. */
export interface HeliocentricPosition {
  /** ecliptic X toward the J2000 vernal equinox [AU] */
  x: number;
  /** ecliptic Y, 90° ahead in the ecliptic plane [AU] */
  y: number;
  /** ecliptic Z toward the ecliptic north pole [AU] */
  z: number;
  /** distance from the Sun r = |(x,y,z)| [AU] */
  distanceAU: number;
  /** heliocentric ecliptic longitude λ = atan2(y, x) [deg, 0–360) */
  longitudeDeg: number;
}

/** Mean motion [deg/day] from the semi-major axis (Kepler's third law). */
function meanMotionDegPerDay(a: number): number {
  const periodDays = Math.pow(a, 1.5) * DAYS_PER_YEAR;
  return 360 / periodDays;
}

/**
 * Heliocentric ecliptic position of a dwarf planet at a UTC instant, in AU, by
 * the mean-anomaly-at-epoch recipe (see module header). The returned frame is the
 * J2000 ecliptic: +X to the vernal equinox, +Z to the ecliptic north pole —
 * identical to lib/planets.ts heliocentricPosition, so an orrery can mix planets
 * and dwarfs in one coordinate frame.
 */
export function heliocentricPosition(
  body: DwarfName,
  date: Date
): HeliocentricPosition {
  const el = DWARFS[body].orbit;

  // 1–2. Propagate the mean anomaly from the epoch with constant mean motion.
  const dt = julianDateTT(date) - el.epochJD; // TT days since the element epoch
  const n = meanMotionDegPerDay(el.a);
  const M = norm180(el.meanAnomalyDeg + n * dt) * DEG2RAD;

  // 3. Eccentric anomaly.
  const E = solveKepler(M, el.e);

  // 4. Position in the orbital plane (AU).
  const xPlane = el.a * (Math.cos(E) - el.e);
  const yPlane = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);

  // 5. Rotate ω (in-plane), i (tilt), Ω (node) into the J2000 ecliptic frame.
  const omega = el.argPeriDeg * DEG2RAD;
  const Omega = el.nodeDeg * DEG2RAD;
  const i = el.iDeg * DEG2RAD;
  const cosO = Math.cos(omega);
  const sinO = Math.sin(omega);
  const cosN = Math.cos(Omega);
  const sinN = Math.sin(Omega);
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);

  const x =
    (cosO * cosN - sinO * sinN * cosI) * xPlane +
    (-sinO * cosN - cosO * sinN * cosI) * yPlane;
  const y =
    (cosO * sinN + sinO * cosN * cosI) * xPlane +
    (-sinO * sinN + cosO * cosN * cosI) * yPlane;
  const z = sinO * sinI * xPlane + cosO * sinI * yPlane;

  const distanceAU = Math.sqrt(x * x + y * y + z * z);
  const longitudeDeg = norm360(Math.atan2(y, x) * RAD2DEG);
  return { x, y, z, distanceAU, longitudeDeg };
}

/** Heliocentric distance from the Sun [AU] (convenience wrapper). */
export function heliocentricDistanceAU(body: DwarfName, date: Date): number {
  return heliocentricPosition(body, date).distanceAU;
}

// ─────────────────────────── Orbital-period helpers ────────────────────────

/**
 * Sidereal orbital period from Kepler's third law: P[yr] = a[AU]^{3/2}. This is
 * the period the propagation in {@link heliocentricPosition} actually uses, and
 * it agrees with each body's tabulated SBDB period ({@link orbitalPeriodYears})
 * to under 1%.
 */
export function keplerPeriodYears(body: DwarfName): number {
  return Math.pow(DWARFS[body].orbit.a, 1.5);
}

/** Tabulated (SBDB) sidereal orbital period [Earth years]. */
export function orbitalPeriodYears(body: DwarfName): number {
  return DWARFS[body].orbit.siderealPeriodYears;
}

/** Perihelion distance a(1−e) [AU]. */
export function perihelionAU(body: DwarfName): number {
  const { a, e } = DWARFS[body].orbit;
  return a * (1 - e);
}

/** Aphelion distance a(1+e) [AU]. */
export function aphelionAU(body: DwarfName): number {
  const { a, e } = DWARFS[body].orbit;
  return a * (1 + e);
}

// ─────────────────────── Pluto ↔ Neptune resonance ──────────────────────────

/**
 * Neptune's semi-major axis [AU] (JPL Table 1, same value as lib/planets.ts).
 * Hard-coded rather than imported so this module stays self-contained.
 */
const NEPTUNE_SEMI_MAJOR_AU = 30.06992276;

export interface NeptuneResonance {
  /** Pluto's perihelion distance [AU] (~29.66) */
  plutoPerihelionAU: number;
  /** Pluto's aphelion distance [AU] (~49.30) */
  plutoAphelionAU: number;
  /** Neptune's semi-major axis [AU] (~30.07) */
  neptuneSemiMajorAU: number;
  /** true ⇒ Pluto's perihelion lies inside Neptune's orbit (it does) */
  crossesNeptuneOrbit: boolean;
  /** Pluto:Neptune orbital-period ratio ≈ 3/2 (the mean-motion resonance) */
  periodRatioPlutoOverNeptune: number;
  /** true ⇒ that ratio is within tolerance of 2:3 (Pluto orbits 2×, Neptune 3×) */
  isThreeToTwo: boolean;
  /** honest one-line description for the UI */
  note: string;
}

/**
 * Pluto's 3:2 mean-motion resonance with Neptune, computed (not asserted) from
 * the period table. Pluto's perihelion (~29.66 AU) is INSIDE Neptune's orbit
 * (~30.07 AU), so their paths cross when projected onto the ecliptic — yet the
 * resonance guarantees they never come near: whenever Pluto is at perihelion,
 * Neptune is ~90° away along its orbit. Pluto completes 2 orbits for every 3 of
 * Neptune's (P_Pluto / P_Neptune ≈ 247.9 / 164.8 ≈ 1.504 ≈ 3/2). `tol` is the
 * fractional tolerance on the ratio (default 5%).
 */
export function neptuneResonance(tol = 0.05): NeptuneResonance {
  const plutoPerihelionAU = perihelionAU("Pluto");
  const plutoAphelionAU = aphelionAU("Pluto");
  const pPluto = keplerPeriodYears("Pluto");
  const pNeptune = Math.pow(NEPTUNE_SEMI_MAJOR_AU, 1.5);
  const periodRatioPlutoOverNeptune = pPluto / pNeptune;
  return {
    plutoPerihelionAU,
    plutoAphelionAU,
    neptuneSemiMajorAU: NEPTUNE_SEMI_MAJOR_AU,
    crossesNeptuneOrbit: plutoPerihelionAU < NEPTUNE_SEMI_MAJOR_AU,
    periodRatioPlutoOverNeptune,
    isThreeToTwo: Math.abs(periodRatioPlutoOverNeptune - 1.5) <= 1.5 * tol,
    note:
      "Pluto's perihelion (~29.7 AU) dips inside Neptune's orbit (~30.1 AU), " +
      "but the 3:2 mean-motion resonance (Pluto orbits twice for every three " +
      "Neptune orbits) keeps the two forever apart.",
  };
}

// ─────────────────────── Shape / imaging / moon helpers ──────────────────────

/**
 * True triaxial axis lengths for a non-spherical dwarf planet, so the frontend
 * can render an ELLIPSOID instead of a sphere. Only Haumea qualifies (its 3.9 h
 * spin has stretched it into a Jacobi ellipsoid, ~2100 × 1680 × 1074 km overall);
 * every other body returns `undefined` and should be drawn as a sphere of its
 * mean radius. Values are the overall dimensions (halve for semi-axes).
 */
export function triaxialAxesKm(
  body: DwarfName
): { a: number; b: number; c: number } | undefined {
  return DWARFS[body].physical.triaxialAxesKm;
}

/** Convenience: Haumea's three axis lengths a > b > c [km]. */
export function haumeaTriaxialAxes(): { a: number; b: number; c: number } {
  // Non-null: Haumea always carries a triaxial shape in the table above.
  return DWARFS.Haumea.physical.triaxialAxesKm!;
}

/**
 * True if a spacecraft has resolved the body's surface. Only Pluto (New Horizons
 * 2015) and Ceres (Dawn 2015) among the dwarf planets — and Charon, imaged in the
 * same New Horizons flyby. Every other body is still a point/blur, so the
 * frontend should fall back to a featureless or artist's-impression texture.
 */
export function isImaged(body: SpinningBody): boolean {
  if (body === "Charon") return CHARON.imaged;
  return DWARFS[body].imaged;
}

/** Number of known natural satellites of a dwarf planet. */
export function moonCount(body: DwarfName): number {
  return DWARFS[body].physical.moonCount;
}

/**
 * True ⇒ the body is tidally locked. Pluto and Charon are MUTUALLY locked (each
 * keeps one face to the other, both spinning with the 6.387 d orbital period);
 * the other dwarf planets spin freely and are not locked.
 */
export function isTidallyLocked(body: SpinningBody): boolean {
  return body === "Charon" || body === "Pluto";
}

// ─────────────────── Rotation → sub-solar / terminator ───────────────────────

/**
 * Sidereal rotation period [hours] of a spinning body. For Charon this is its
 * ~6.387 d orbital period about Pluto (mutual lock); for the dwarf planets it is
 * the tabulated spin period.
 */
export function rotationPeriodHours(body: SpinningBody): number {
  if (body === "Charon") return CHARON.physical.rotationPeriodHours;
  return DWARFS[body].physical.rotationPeriodHours;
}

/**
 * Sub-solar longitude in the body's body-fixed frame [deg, (−180, 180]] at a UTC
 * instant. The sub-solar point sweeps the surface once per ROTATION period:
 *
 *   λ_sub(t) = −360° · (daysSinceJ2000 / P_rot)
 *
 * HONESTY NOTE (same as lib/planets.ts / lib/moons.ts): the sweep RATE is
 * physical (from the sidereal rotation period), but the absolute PHASE is
 * anchored to λ_sub = 0 at J2000 as an adopted convention, and the rotation SENSE
 * is taken as prograde — pinning either to a named surface meridian or resolving
 * retrograde spin would need each body's IAU pole/prime-meridian constants, which
 * are poorly constrained for most of these worlds and out of scope here. For a
 * day/night terminator this is exactly enough: it sweeps at the correct rate.
 */
export function subSolarLongitude(body: SpinningBody, date: Date): number {
  const pRotDays = rotationPeriodHours(body) / 24;
  const d = daysSinceJ2000(date);
  return norm180(-360 * (d / pRotDays));
}

/**
 * Sub-solar point (lat/lon, deg) in the body-fixed frame. The LATITUDE is taken
 * as 0: dwarf-planet obliquities are largely unmeasured, so (exactly as
 * lib/moons.ts treats the major moons) we model no seasonal tilt and keep the
 * sub-solar point on the equator. Documented so the HUD labels it honestly.
 */
export function subSolarPoint(
  body: SpinningBody,
  date: Date
): { lat: number; lon: number } {
  return { lat: 0, lon: normalizeLon(subSolarLongitude(body, date)) };
}

/**
 * Unit vector from the body's centre toward the Sun, in the globe's body-fixed
 * frame (lib/geo axis convention). Feed directly to the terminator shader as the
 * `sunDir` uniform: a surface point P is in daylight iff dot(P̂, sunDir) > 0. The
 * exact analogue of solar.ts sunDirection, planets.ts planetSunDirection and
 * moons.ts moonSunDirection.
 */
export function dwarfSunDirection(
  body: SpinningBody,
  date: Date
): [number, number, number] {
  const { lat, lon } = subSolarPoint(body, date);
  return latLonToVector3(lat, lon, 1);
}

// ─────────────────────── AU ↔ scene-unit conversion ─────────────────────────

/** Linear AU → scene units (honest 1:1-scaled distances; Eris ends up very far). */
export function auToSceneLinear(au: number, unitsPerAU = 1): number {
  return au * unitsPerAU;
}

// ─────────────────────────────── Orrery ────────────────────────────────────

export type RadialScaleMode = "log" | "sqrt" | "linear";

export interface OrreryOptions {
  /**
   * How the radius is compressed. "log" (default) and "sqrt" squeeze Ceres'
   * 2.77 AU and Eris' ~98 AU aphelion into the same view; "linear" keeps true
   * proportional distances (honest, but Eris then sits ~35× further than Ceres).
   */
  mode?: RadialScaleMode;
  /** scene radius assigned to `innerAU` (log/sqrt modes). Default 1. */
  minRadius?: number;
  /** scene radius assigned to `outerAU` (log/sqrt modes). Default 10. */
  maxRadius?: number;
  /** AU distance mapped to `minRadius`. Default 2.5 (just inside Ceres). */
  innerAU?: number;
  /** AU distance mapped to `maxRadius`. Default 100 (just beyond Eris' aphelion). */
  outerAU?: number;
  /** scene units per AU for "linear" mode. Default 1. */
  unitsPerAU?: number;
}

export interface OrreryBody {
  name: DwarfName;
  /** scene X (ecliptic plane projection) */
  x: number;
  /** scene Z (ecliptic plane projection) */
  z: number;
  /** compressed scene radius from the Sun */
  sceneRadius: number;
  /** TRUE heliocentric distance [AU] — use this for honest labels */
  distanceAU: number;
  /** heliocentric ecliptic longitude [deg, 0–360) — the REAL angle */
  longitudeDeg: number;
}

export interface OrreryLayout {
  bodies: OrreryBody[];
  mode: RadialScaleMode;
  /** human-readable honesty string for the UI */
  note: string;
}

/**
 * Compress a true heliocentric distance (AU) to a scene radius per the chosen
 * mode. log/sqrt map [innerAU, outerAU] onto [minRadius, maxRadius]; linear is a
 * straight AU × unitsPerAU scaling. Same shape as lib/planets.ts compressRadius —
 * so to draw the dwarfs on the SAME scale as the planet orrery, pass BOTH orreries
 * identical {mode, minRadius, maxRadius, innerAU, outerAU} options (the planet
 * defaults span 0.3–31 AU; widen `outerAU` to ~100 to fit Eris).
 */
export function compressRadius(au: number, opts: OrreryOptions = {}): number {
  const mode = opts.mode ?? "log";
  if (mode === "linear") {
    return auToSceneLinear(au, opts.unitsPerAU ?? 1);
  }
  const minRadius = opts.minRadius ?? 1;
  const maxRadius = opts.maxRadius ?? 10;
  const innerAU = opts.innerAU ?? 2.5;
  const outerAU = opts.outerAU ?? 100;
  const f = mode === "sqrt" ? Math.sqrt : Math.log;
  const t = (f(au) - f(innerAU)) / (f(outerAU) - f(innerAU));
  return minRadius + t * (maxRadius - minRadius);
}

/**
 * Positions for a dwarf-planet orrery. The ANGLE of every body is its real
 * heliocentric ecliptic longitude at `date`; only the RADIUS is compressed (per
 * {@link compressRadius}) so all five orbits — Ceres at 2.77 AU out to Eris near
 * 98 AU — are visible together. The true AU distance is returned alongside so the
 * frontend can label the scene honestly, and the scene mapping follows the
 * lib/geo convention (longitude 0 → +X, +90° → −Z), matching planets.orreryLayout
 * so the two can share a frame:
 *
 *   x =  sceneRadius · cos(λ)
 *   z = −sceneRadius · sin(λ)
 */
export function orreryLayout(
  date: Date,
  opts: OrreryOptions = {}
): OrreryLayout {
  const mode = opts.mode ?? "log";
  const bodies: OrreryBody[] = DWARF_ORDER.map((name) => {
    const pos = heliocentricPosition(name, date);
    const sceneRadius = compressRadius(pos.distanceAU, opts);
    const lam = pos.longitudeDeg * DEG2RAD;
    return {
      name,
      x: sceneRadius * Math.cos(lam),
      z: -sceneRadius * Math.sin(lam),
      sceneRadius,
      distanceAU: pos.distanceAU,
      longitudeDeg: pos.longitudeDeg,
    };
  });
  const note =
    mode === "linear"
      ? "Angular positions and radial distances are both to scale."
      : `Angular positions are real; radial distances ${mode}-compressed for visibility.`;
  return { bodies, mode, note };
}

// ─────────────────────────── HUD snapshot ──────────────────────────────────

export interface DwarfState {
  name: DwarfName;
  position: HeliocentricPosition;
  subsolar: { lat: number; lon: number };
  sunDirection: [number, number, number];
  /** sidereal orbital period [Earth years] (SBDB value) */
  orbitalPeriodYears: number;
  /** sidereal rotation period [hours] */
  rotationPeriodHours: number;
  /** rotation period is observationally uncertain */
  rotationUncertain: boolean;
  meanRadiusKm: number;
  geometricAlbedo: number;
  meanSurfaceTempK: number;
  moonCount: number;
  imaged: boolean;
  /** triaxial axes [km] if non-spherical (Haumea), else undefined */
  triaxialAxesKm?: { a: number; b: number; c: number };
}

/**
 * Everything a per-body globe HUD needs in one pure call (mirrors planetState /
 * moonSnapshot / marsClock), so a component reads one snapshot per tick.
 */
export function dwarfState(body: DwarfName, date: Date): DwarfState {
  const p = DWARFS[body].physical;
  return {
    name: body,
    position: heliocentricPosition(body, date),
    subsolar: subSolarPoint(body, date),
    sunDirection: dwarfSunDirection(body, date),
    orbitalPeriodYears: DWARFS[body].orbit.siderealPeriodYears,
    rotationPeriodHours: p.rotationPeriodHours,
    rotationUncertain: p.rotationUncertain,
    meanRadiusKm: p.meanRadiusKm,
    geometricAlbedo: p.geometricAlbedo,
    meanSurfaceTempK: p.meanSurfaceTempK,
    moonCount: p.moonCount,
    imaged: DWARFS[body].imaged,
    triaxialAxesKm: p.triaxialAxesKm,
  };
}
