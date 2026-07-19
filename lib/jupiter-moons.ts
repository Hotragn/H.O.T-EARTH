/**
 * Positions of Jupiter's four Galilean satellites (Io, Europa, Ganymede,
 * Callisto) and their mutual/observational phenomena — transits, shadow
 * transits, occultations and eclipses — as seen from Earth. This is the physics
 * library for the "Jupiter's Moons" tab of the digital twin, and it is the
 * satellite analogue of lib/planets.ts (heliocentric orbits), lib/lunar.ts
 * (Moon) and lib/celestial.ts (RA/Dec → sky): every public function is a pure,
 * deterministic function of a JavaScript UTC `Date`, so it unit-tests cleanly
 * (lib/jupiter-moons.test.ts) and the react-three-fiber frontend can consume it
 * directly. Nothing is invented; every number is sourced.
 *
 * ── Source & method (physics-env-simulation skill: real physics, documented, or
 *    it doesn't ship — no invented numbers) ──────────────────────────────────
 *
 *   Primary reference: J. Meeus, *Astronomical Algorithms*, 2nd ed.
 *   (Willmann-Bell, 1998), **Chapter 44, "Positions of the Satellites of
 *   Jupiter"**.
 *
 *   Meeus gives TWO methods in Chapter 44:
 *     (a) a LOWER-accuracy method (Ch. 44, pp. 299–300) — the mean orbital
 *         longitudes of the four satellites plus a handful of the largest
 *         perturbation terms; and
 *     (b) a HIGHER-accuracy method (Ch. 44, pp. 301–315) — Lieske's E5 theory
 *         with ~150 periodic terms and a full rotation of the satellite
 *         coordinates through Jupiter's equator/orbit into the plane of the sky,
 *         which reaches ~0.1″. The E5 method additionally requires a full
 *         planetary theory (VSOP87) for Jupiter's and Earth's positions.
 *
 *   ►►► THIS MODULE IMPLEMENTS THE LOWER-ACCURACY METHOD (a). ◄◄◄
 *
 *   Stated accuracy (Meeus, Ch. 44): the lower-accuracy method reproduces the
 *   satellites' apparent rectangular coordinates to a few hundredths of a
 *   Jupiter radius for I, II and IV, and is more than sufficient to draw the
 *   configuration, identify each moon and flag its phenomena. Its one honest
 *   weakness is a satellite that sits *right at conjunction* (apparent X ≈ 0),
 *   where the small along-orbit longitude error can flip the sign of a tiny X:
 *   see the 1992-Dec-16 Ganymede case documented in the test file. The higher-
 *   accuracy E5 theory was deliberately NOT used because it is too large to
 *   transcribe and verify reliably in this context and pulls in a full VSOP87
 *   dependency — exactly the "acceptable fallback" trade Meeus's two-method
 *   structure anticipates.
 *
 *   The verbatim constants below were cross-checked against two independent
 *   renderings of Meeus's lower-accuracy method — the Go port
 *   github.com/soniakeys/meeus (v3/jupitermoons, func `Positions`) and James
 *   Still's C# rendition (squarewidget.com) — which agree with this code to
 *   ~0.01 Rj on their worked examples.
 *
 *   Jupiter's physical/rotational constants (equatorial & polar radii,
 *   flattening) and the satellites' orbital periods and radii: NASA/GSFC
 *   Planetary & Satellite Fact Sheets (Williams, NASA NSSDCA).
 *
 * ── Sign / axis conventions (READ THIS — the frontend must match) ────────────
 *
 *   All satellite and shadow coordinates are in units of Jupiter's EQUATORIAL
 *   RADIUS, measured from Jupiter's centre, in the plane of the sky:
 *
 *     • X  — positive toward the WEST of Jupiter in the sky (Meeus's along-orbit
 *            direction). X = r·sin(u). |X| is bounded by each moon's orbital
 *            radius (Io ~5.9, Europa ~9.4, Ganymede ~15.0, Callisto ~26.4 Rj).
 *     • Y  — positive toward the NORTH. Y = −r·cos(u)·sin(D_E). Small, because
 *            the orbits are seen nearly edge-on (Jupiter's axis tilt ≈ 3°).
 *     • Z  — line-of-sight, positive toward Earth (the NEAR side).
 *            Z = −r·cos(u)·cos(D_E).  `frontOfDisk` = (Z > 0) = (cos u < 0):
 *            the satellite is IN FRONT of Jupiter near inferior conjunction
 *            (u ≈ 180°) and BEHIND it near superior conjunction (u ≈ 0°).
 *
 *   `u` is the satellite's orbital phase measured from superior geocentric
 *   conjunction (Meeus's u₁…u₄), degrees.
 *
 *   SHADOW coordinates (shadowX, shadowY) are the same projection but taken from
 *   the SUN's viewpoint instead of Earth's: replace the phase angle by removing
 *   it (u_sun = u − ψ) and use the Sun's planetocentric declination D_S in place
 *   of Earth's D_E. Near opposition ψ ≈ 0 so the shadow sits almost exactly
 *   behind the moon; near quadrature ψ grows to ≈ 11° and the shadow is thrown
 *   well to one side (up to ~5 Rj for Callisto) — which is exactly what makes a
 *   shadow transit occur at a different time from the moon's own transit.
 *
 * ── Phenomena geometry (Meeus Ch. 44 + standard umbra/limb geometry) ─────────
 *
 *   Let diskDist(X,Y) be the distance of a projected point from Jupiter's centre
 *   measured against Jupiter's OBLATE outline (equatorial radius 1, polar radius
 *   1−f, f ≈ 0.0649): diskDist = √(X² + (Y/(1−f))²); < 1 ⇒ inside the disk.
 *
 *     • transit        — frontOfDisk AND diskDist(X,Y) < 1  (moon crosses the
 *                        near face of the disk).
 *     • occultation    — NOT frontOfDisk AND diskDist(X,Y) < 1  (moon hidden
 *                        behind the far side of the disk).
 *     • shadow_transit — cos(u_sun) < 0 (moon between Sun and Jupiter) AND
 *                        diskDist(shadowX,shadowY) < 1  (its shadow falls on the
 *                        sunlit face we see).
 *     • eclipse        — cos(u_sun) > 0 (moon on the anti-solar side of Jupiter)
 *                        AND diskDist(shadowX,shadowY) < 1  (moon inside
 *                        Jupiter's shadow cylinder / umbra).
 *
 *   Each event carries a phase ∈ {ingress, mid, egress}: ingress/egress are the
 *   limb (or umbra-edge) crossings found by bisection; mid is the moment of
 *   closest approach to the disk/shadow centre.
 *
 * ── Coordinate convention for jupiterGeocentric ──────────────────────────────
 *   Jupiter's apparent geocentric RA/Dec are produced by reusing
 *   lib/planets.heliocentricPosition (JPL approximate positions) for Jupiter and
 *   Earth, differencing them with a light-time correction, and rotating the
 *   J2000 ecliptic vector to the equator. The frontend feeds that RA/Dec to
 *   lib/celestial.equatorialToHorizontal to check whether Jupiter is above the
 *   observer's horizon, and uses the angular diameter to size the disk.
 */

import { heliocentricPosition } from "./planets";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const DAY_MS = 86_400_000;

/** Julian Date of the J2000.0 epoch (2000-01-01 12:00 TT). */
const J2000_JD = 2_451_545.0;
/** Julian Date of the Unix epoch, 1970-01-01T00:00:00Z. */
const UNIX_EPOCH_JD = 2_440_587.5;

/**
 * ΔT = TD − UTC, seconds. The satellite theory is a function of Dynamical Time
 * (TD); we fold in a constant ΔT ≈ 69 s for the modern era, the same honest
 * approximation used by lib/planets.ts and lib/lunar.ts. At the fastest
 * satellite rate (Io, ~203°/day ≈ 0.0024°/s) a 10 s error in ΔT is < 0.03° of
 * orbital phase — utterly negligible for the configuration and its phenomena.
 */
const DELTA_T_SECONDS = 69.184;

/**
 * Speed of light expressed as AU travelled per day. Meeus's low-accuracy method
 * uses the round value 173 for the Jupiter→Earth light-time inside the satellite
 * longitudes (kept verbatim below); the more precise 173.1446 is used only for
 * the independent {@link jupiterGeocentric} light-time correction.
 */
const LIGHT_AU_PER_DAY_MEEUS = 173;
const LIGHT_AU_PER_DAY = 173.1446;

/** Mean obliquity of the ecliptic at J2000.0 [deg] (for ecliptic → equatorial). */
const OBLIQUITY_J2000_DEG = 23.4392911;

/** 1 AU in kilometres (IAU 2012 definition). */
const AU_KM = 149_597_870.7;
const ARCSEC_PER_RAD = 206_264.806_247_1;

// ─────────────────────────────── Jupiter constants ─────────────────────────

/**
 * Jupiter physical constants (NASA/GSFC Planetary Fact Sheet). The satellite
 * coordinates X, Y, Z are all in units of {@link JUPITER.equatorialRadiusKm}.
 * The disk we test phenomena against is OBLATE: its polar radius is
 * (1 − flattening) equatorial radii.
 */
export const JUPITER = {
  equatorialRadiusKm: 71_492,
  polarRadiusKm: 66_854,
  /** geometric flattening f = 1 − Rpol/Req ≈ 0.0649 (~1/15.4). */
  flattening: 1 - 66_854 / 71_492,
  /** polar radius as a fraction of the equatorial radius (≈ 0.9351). */
  polarRadiusRatio: 66_854 / 71_492,
} as const;

// ─────────────────────────────── Moon identifiers ──────────────────────────

export type GalileanMoon = "Io" | "Europa" | "Ganymede" | "Callisto";

/** The four moons in orbital order (I → IV), for iterating the UI. */
export const GALILEAN_MOON_ORDER: readonly GalileanMoon[] = [
  "Io",
  "Europa",
  "Ganymede",
  "Callisto",
] as const;

export interface GalileanMoonData {
  name: GalileanMoon;
  /** Roman-numeral designation I…IV. */
  index: 1 | 2 | 3 | 4;
  /** sidereal orbital period [days] (NASA Satellite Fact Sheet). */
  orbitalPeriodDays: number;
  /** mean physical radius [km] (NASA Satellite Fact Sheet). */
  radiusKm: number;
  /**
   * mean orbital radius in Jupiter equatorial radii — the constant term of
   * Meeus's r₁…r₄, and very nearly the moon's maximum apparent elongation |X|.
   */
  meanRadiusRj: number;
}

/**
 * Per-moon constants. `meanRadiusRj` values are the constant terms of Meeus's
 * r₁…r₄ (Ch. 44); periods and radii are the NASA Satellite Fact Sheet figures.
 */
export const GALILEAN_MOONS: Record<GalileanMoon, GalileanMoonData> = {
  Io: {
    name: "Io",
    index: 1,
    orbitalPeriodDays: 1.769138,
    radiusKm: 1821.6,
    meanRadiusRj: 5.9057,
  },
  Europa: {
    name: "Europa",
    index: 2,
    orbitalPeriodDays: 3.551181,
    radiusKm: 1560.8,
    meanRadiusRj: 9.3966,
  },
  Ganymede: {
    name: "Ganymede",
    index: 3,
    orbitalPeriodDays: 7.154553,
    radiusKm: 2634.1,
    meanRadiusRj: 14.9883,
  },
  Callisto: {
    name: "Callisto",
    index: 4,
    orbitalPeriodDays: 16.689018,
    radiusKm: 2410.3,
    meanRadiusRj: 26.3627,
  },
};

// ───────────────────────────── null-safety guards ──────────────────────────
// Contract (mirrors lib/celestial.ts): a bad Date yields null (or [] for the
// event list), never a throw — the renderer must survive malformed input.

function finite(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

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

// ─────────────────────────────── Time helpers ──────────────────────────────

/**
 * Julian Date (UT) of a UTC instant. Unix epoch 1970-01-01T00:00Z = JD
 * 2440587.5. This is the plain UT-based JD (matching lib/celestial.julianDate);
 * the satellite theory internally converts it to a Dynamical-Time JDE by adding
 * ΔT (see {@link julianEphemerisDate}).
 */
export function julianDate(date: Date): number {
  return date.getTime() / DAY_MS + UNIX_EPOCH_JD;
}

/**
 * Julian Ephemeris Date (Dynamical Time) of a UTC instant — JD(UT) + ΔT. This is
 * the time argument Meeus's Chapter 44 formulae expect.
 */
export function julianEphemerisDate(date: Date): number {
  return julianDate(date) + DELTA_T_SECONDS / 86_400;
}

// ──────────────── Core: Meeus Ch. 44 lower-accuracy geometry ────────────────

/** Shared Sun/Jupiter/Earth geometry for one instant (all angles in radians). */
interface JovianGeometry {
  /** phase angle ψ (Sun–Jupiter–Earth), radians. */
  psi: number;
  /** planetocentric declination of the Earth D_E, radians. */
  DE: number;
  /** planetocentric declination of the Sun D_S, radians. */
  DS: number;
  /** Earth–Jupiter distance Δ [AU]. */
  deltaAU: number;
  /** Jupiter–Sun distance r [AU]. */
  jupiterSunAU: number;
}

/** Raw jovicentric state of one satellite at one instant. */
interface MoonRaw {
  /** orbital phase u (with perturbation), radians, from superior conjunction. */
  u: number;
  /** Sun-referenced orbital phase u_sun = u − ψ, radians. */
  uSun: number;
  /** orbital radius [Jupiter equatorial radii]. */
  r: number;
}

/**
 * Meeus, *Astronomical Algorithms* 2nd ed., Chapter 44, lower-accuracy method
 * (pp. 299–300). Given a Julian Ephemeris Day, returns the shared geometry plus
 * each satellite's orbital phase and radius. Kept verbatim to Meeus (constants
 * cross-checked against two independent ports; see module header).
 */
function computeRaw(jde: number): { geom: JovianGeometry; moons: MoonRaw[] } {
  const p = DEG2RAD;
  const d = jde - J2000_JD;

  const V = 172.74 * p + 0.00111588 * p * d;
  const M = 357.529 * p + 0.9856003 * p * d;
  const sV = Math.sin(V);
  const N = 20.02 * p + 0.0830853 * p * d + 0.329 * p * sV;
  const J = 66.115 * p + 0.9025179 * p * d - 0.329 * p * sV;

  const sM = Math.sin(M);
  const cM = Math.cos(M);
  const sN = Math.sin(N);
  const cN = Math.cos(N);
  const s2M = Math.sin(2 * M);
  const c2M = Math.cos(2 * M);
  const s2N = Math.sin(2 * N);
  const c2N = Math.cos(2 * N);

  const A = 1.915 * p * sM + 0.02 * p * s2M;
  const B = 5.555 * p * sN + 0.168 * p * s2N;
  const K = J + A - B;

  // R = Earth–Sun distance, r = Jupiter–Sun distance (AU).
  const R = 1.00014 - 0.01671 * cM - 0.00014 * c2M;
  const r = 5.20872 - 0.25208 * cN - 0.00611 * c2N;

  const sK = Math.sin(K);
  const cK = Math.cos(K);
  const Delta = Math.sqrt(r * r + R * R - 2 * r * R * cK); // Earth–Jupiter [AU]
  const psi = Math.asin(clamp((R / Delta) * sK, -1, 1)); // phase angle

  const lambda = 34.35 * p + 0.083091 * p * d + 0.329 * p * sV + B;
  const DS = 3.12 * p * Math.sin(lambda + 42.8 * p);
  const DE =
    DS -
    2.22 * p * Math.sin(psi) * Math.cos(lambda + 22 * p) -
    (1.3 * p * (r - Delta)) / Delta * Math.sin(lambda - 100.5 * p);

  // Light-time-corrected epoch for the satellite longitudes.
  const dd = d - Delta / LIGHT_AU_PER_DAY_MEEUS;

  const u1 = 163.8069 * p + 203.4058646 * p * dd + psi - B;
  const u2 = 358.414 * p + 101.2916335 * p * dd + psi - B;
  const u3 = 5.7176 * p + 50.234518 * p * dd + psi - B;
  const u4 = 224.8092 * p + 21.48798 * p * dd + psi - B;

  const G = 331.18 * p + 50.310482 * p * dd;
  const H = 87.45 * p + 21.569231 * p * dd;
  const sG = Math.sin(G);
  const cG = Math.cos(G);
  const sH = Math.sin(H);
  const cH = Math.cos(H);

  // Largest perturbation corrections to the longitudes.
  const c1 = 0.473 * p * Math.sin(2 * (u1 - u2));
  const c2 = 1.065 * p * Math.sin(2 * (u2 - u3));
  const c3 = 0.165 * p * sG;
  const c4 = 0.843 * p * sH;

  // Orbital radii [Jupiter equatorial radii].
  const r1 = 5.9057 - 0.0244 * Math.cos(2 * (u1 - u2));
  const r2 = 9.3966 - 0.0882 * Math.cos(2 * (u2 - u3));
  const r3 = 14.9883 - 0.0216 * cG;
  const r4 = 26.3627 - 0.1939 * cH;

  const uu = [u1 + c1, u2 + c2, u3 + c3, u4 + c4];
  const rr = [r1, r2, r3, r4];

  const moons: MoonRaw[] = uu.map((u, i) => ({
    u,
    uSun: u - psi, // Sun-referenced orbital phase (for the shadow / eclipse)
    r: rr[i],
  }));

  return {
    geom: { psi, DE, DS, deltaAU: Delta, jupiterSunAU: r },
    moons,
  };
}

// ──────────────────────────── Disk / umbra geometry ────────────────────────

/**
 * Distance of a projected point (X,Y, in equatorial radii) from Jupiter's centre
 * measured against Jupiter's oblate outline: √(X² + (Y/polarRatio)²). A value
 * < 1 means the point falls inside the disk (or, for a Sun-referenced point,
 * inside the shadow cylinder). Set `oblate = false` to test against a circle.
 */
export function diskDistance(X: number, Y: number, oblate = true): number {
  const yy = oblate ? Y / JUPITER.polarRadiusRatio : Y;
  return Math.sqrt(X * X + yy * yy);
}

// ─────────────────────────── Satellite apparent positions ──────────────────

/** Apparent position + phenomenon flags for one Galilean moon at one instant. */
export interface GalileanPosition {
  moon: GalileanMoon;
  /** Roman-numeral designation I…IV. */
  index: 1 | 2 | 3 | 4;
  /** apparent X [Jupiter equatorial radii], positive toward the WEST. */
  x: number;
  /** apparent Y [Jupiter equatorial radii], positive toward the NORTH. */
  y: number;
  /** line-of-sight Z [Jupiter equatorial radii], positive toward Earth (near). */
  z: number;
  /** true ⇒ satellite is on the near side (in front of Jupiter). */
  frontOfDisk: boolean;
  /** orbital phase u from superior conjunction [deg, 0–360). */
  orbitalPhaseDeg: number;
  /** shadow X [Jupiter equatorial radii], projected from the Sun, +WEST. */
  shadowX: number;
  /** shadow Y [Jupiter equatorial radii], projected from the Sun, +NORTH. */
  shadowY: number;
  /** true ⇒ moon crosses the near face of Jupiter's disk. */
  inTransit: boolean;
  /** true ⇒ moon is hidden behind Jupiter's disk. */
  inOccultation: boolean;
  /** true ⇒ moon's shadow falls on the sunlit disk we see. */
  inShadowTransit: boolean;
  /** true ⇒ moon is inside Jupiter's umbra (geometrically eclipsed). */
  inEclipse: boolean;
}

/** Turn one raw satellite state into the public apparent-position record. */
function toPosition(
  moon: GalileanMoon,
  raw: MoonRaw,
  geom: JovianGeometry,
  oblate: boolean
): GalileanPosition {
  const { u, uSun, r } = raw;
  const sinDE = Math.sin(geom.DE);
  const cosDE = Math.cos(geom.DE);
  const sinDS = Math.sin(geom.DS);

  const x = r * Math.sin(u);
  const y = -r * Math.cos(u) * sinDE;
  const z = -r * Math.cos(u) * cosDE; // + toward Earth
  const frontOfDisk = z > 0;

  const shadowX = r * Math.sin(uSun);
  const shadowY = -r * Math.cos(uSun) * sinDS;
  const shadowBehind = Math.cos(uSun) > 0; // anti-solar side ⇒ umbra region

  const onDisk = diskDistance(x, y, oblate) < 1;
  const shadowInCylinder = diskDistance(shadowX, shadowY, oblate) < 1;

  return {
    moon,
    index: GALILEAN_MOONS[moon].index,
    x,
    y,
    z,
    frontOfDisk,
    orbitalPhaseDeg: norm360(u * RAD2DEG),
    shadowX,
    shadowY,
    inTransit: frontOfDisk && onDisk,
    inOccultation: !frontOfDisk && onDisk,
    inShadowTransit: !shadowBehind && shadowInCylinder,
    inEclipse: shadowBehind && shadowInCylinder,
  };
}

/**
 * Apparent rectangular coordinates of the four Galilean satellites relative to
 * Jupiter's centre at `date`, in Jupiter equatorial radii, per Meeus Ch. 44
 * (lower-accuracy method). See the module header for the full sign convention.
 * Returns the four moons in orbital order (Io → Callisto), or `null` for an
 * invalid date. `oblate` (default true) tests phenomena against Jupiter's
 * flattened disk; pass false for a spherical disk.
 */
export function galileanPositions(
  date: Date,
  oblate = true
): GalileanPosition[] | null {
  if (!isValidDate(date)) return null;
  const { geom, moons } = computeRaw(julianEphemerisDate(date));
  return GALILEAN_MOON_ORDER.map((name, i) =>
    toPosition(name, moons[i], geom, oblate)
  );
}

/** Apparent position of a single named moon at `date` (null on bad input). */
export function galileanPosition(
  moon: GalileanMoon,
  date: Date,
  oblate = true
): GalileanPosition | null {
  const all = galileanPositions(date, oblate);
  return all ? all[GALILEAN_MOONS[moon].index - 1] : null;
}

// ─────────────────────────── Phenomenon detection ──────────────────────────

export type PhenomenonType =
  | "transit"
  | "shadow_transit"
  | "occultation"
  | "eclipse";

export type PhenomenonPhase = "ingress" | "mid" | "egress";

export interface GalileanEvent {
  moon: GalileanMoon;
  type: PhenomenonType;
  phase: PhenomenonPhase;
  /** instant of the event (UTC). */
  time: Date;
}

const PHENOMENON_TYPES: readonly PhenomenonType[] = [
  "transit",
  "shadow_transit",
  "occultation",
  "eclipse",
];

/** Is a given (moon, phenomenon) active at this instant? */
function isActive(pos: GalileanPosition, type: PhenomenonType): boolean {
  switch (type) {
    case "transit":
      return pos.inTransit;
    case "shadow_transit":
      return pos.inShadowTransit;
    case "occultation":
      return pos.inOccultation;
    case "eclipse":
      return pos.inEclipse;
  }
}

/**
 * Centre-distance whose minimum marks the "mid" of a phenomenon: the disk
 * distance for transit/occultation, the shadow-cylinder distance for
 * shadow_transit/eclipse. Used only to locate the closest-approach instant.
 */
function centreDistance(
  pos: GalileanPosition,
  type: PhenomenonType,
  oblate: boolean
): number {
  if (type === "transit" || type === "occultation") {
    return diskDistance(pos.x, pos.y, oblate);
  }
  return diskDistance(pos.shadowX, pos.shadowY, oblate);
}

export interface GalileanEventOptions {
  /** coarse scan step [minutes]. Default 2. Smaller = more precise but slower. */
  stepMinutes?: number;
  /** restrict to these moons (default: all four). */
  moons?: readonly GalileanMoon[];
  /** restrict to these phenomenon types (default: all four). */
  types?: readonly PhenomenonType[];
  /** test against Jupiter's oblate disk (default true). */
  oblate?: boolean;
}

/** State tracked per (moon, type) while scanning. */
interface Tracker {
  active: boolean;
  minDist: number;
  minTime: number;
  prevTime: number;
}

/**
 * Refine a boolean state change to the crossing instant by bisection, given two
 * bracketing epochs `tFalse`/`tTrue` (ms) where the predicate differs.
 */
function bisectCrossing(
  tA: number,
  tB: number,
  predicate: (t: number) => boolean,
  targetAtB: boolean
): number {
  let lo = tA;
  let hi = tB;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (predicate(mid) === targetAtB) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Ternary-search the minimum of a unimodal `f` on [a, b] (ms). */
function ternaryMin(a: number, b: number, f: (t: number) => number): number {
  let lo = a;
  let hi = b;
  for (let i = 0; i < 60; i++) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (f(m1) < f(m2)) hi = m2;
    else lo = m1;
  }
  return (lo + hi) / 2;
}

/**
 * Scan [startDate, endDate] and return every satellite phenomenon (transit,
 * shadow_transit, occultation, eclipse) with its ingress / mid / egress phase.
 *
 * The interval is sampled at `stepMinutes` (default 2 min); each ingress/egress
 * is then refined to sub-second precision by bisection, and each "mid" is the
 * closest-approach instant found by a ternary search. A phenomenon already in
 * progress at `startDate` (or still going at `endDate`) contributes only the
 * phases that fall inside the window.
 *
 * Returns events sorted by time. An invalid or empty interval yields []. Event
 * TIMES inherit the lower-accuracy method's precision: transits and occultations
 * are good to ~a minute, while eclipse/shadow timings can differ by a few
 * minutes near quadrature (documented honestly for the HUD).
 */
export function galileanEvents(
  startDate: Date,
  endDate: Date,
  opts: GalileanEventOptions = {}
): GalileanEvent[] {
  if (!isValidDate(startDate) || !isValidDate(endDate)) return [];
  const t0 = startDate.getTime();
  const t1 = endDate.getTime();
  if (!(t1 > t0)) return [];

  const stepMs = Math.max(1, (opts.stepMinutes ?? 2)) * 60_000;
  const oblate = opts.oblate ?? true;
  const moons = opts.moons ?? GALILEAN_MOON_ORDER;
  const types = opts.types ?? PHENOMENON_TYPES;

  const posAt = (t: number): GalileanPosition[] => {
    const { geom, moons: raw } = computeRaw(julianEphemerisDate(new Date(t)));
    return GALILEAN_MOON_ORDER.map((name, i) =>
      toPosition(name, raw[i], geom, oblate)
    );
  };

  const activeAt = (moon: GalileanMoon, type: PhenomenonType, t: number) =>
    isActive(posAt(t)[GALILEAN_MOONS[moon].index - 1], type);
  const distAt = (moon: GalileanMoon, type: PhenomenonType, t: number) =>
    centreDistance(posAt(t)[GALILEAN_MOONS[moon].index - 1], type, oblate);

  // One tracker per (moon, type).
  const trackers = new Map<string, Tracker>();
  const key = (m: GalileanMoon, ty: PhenomenonType) => `${m}|${ty}`;
  const events: GalileanEvent[] = [];

  const emitCompleted = (
    moon: GalileanMoon,
    type: PhenomenonType,
    tr: Tracker,
    ingressBracketLo: number,
    ingressBracketHi: number | null,
    egressBracketLo: number,
    egressBracketHi: number
  ) => {
    // ingress (only if we saw the false→true transition inside the window)
    if (ingressBracketHi !== null) {
      const tIn = bisectCrossing(
        ingressBracketLo,
        ingressBracketHi,
        (t) => activeAt(moon, type, t),
        true
      );
      events.push({ moon, type, phase: "ingress", time: new Date(tIn) });
    }
    // mid — closest approach to the disk/shadow centre
    const midLo = Math.max(ingressBracketLo, tr.minTime - stepMs);
    const midHi = Math.min(egressBracketHi, tr.minTime + stepMs);
    const tMid = ternaryMin(midLo, midHi, (t) => distAt(moon, type, t));
    events.push({ moon, type, phase: "mid", time: new Date(tMid) });
    // egress
    const tOut = bisectCrossing(
      egressBracketLo,
      egressBracketHi,
      (t) => activeAt(moon, type, t),
      false
    );
    events.push({ moon, type, phase: "egress", time: new Date(tOut) });
  };

  let prevT = t0;
  let prevPos = posAt(t0);
  // seed trackers with the initial state
  for (const moon of moons) {
    for (const type of types) {
      const pos = prevPos[GALILEAN_MOONS[moon].index - 1];
      const act = isActive(pos, type);
      trackers.set(key(moon, type), {
        active: act,
        minDist: act ? centreDistance(pos, type, oblate) : Infinity,
        minTime: t0,
        prevTime: t0,
      });
    }
  }
  // remember the bracket where each ingress happened
  const ingressBracket = new Map<string, [number, number] | null>();
  for (const moon of moons)
    for (const type of types) ingressBracket.set(key(moon, type), null);

  for (let t = t0 + stepMs; t <= t1 + 1; t += stepMs) {
    const tc = Math.min(t, t1);
    const pos = posAt(tc);
    for (const moon of moons) {
      const idx = GALILEAN_MOONS[moon].index - 1;
      for (const type of types) {
        const k = key(moon, type);
        const tr = trackers.get(k)!;
        const p = pos[idx];
        const act = isActive(p, type);
        if (act) {
          const dist = centreDistance(p, type, oblate);
          if (dist < tr.minDist) {
            tr.minDist = dist;
            tr.minTime = tc;
          }
        }
        if (act && !tr.active) {
          // false → true: ingress somewhere in (prevT, tc]
          ingressBracket.set(k, [prevT, tc]);
          tr.active = true;
          tr.minDist = centreDistance(p, type, oblate);
          tr.minTime = tc;
        } else if (!act && tr.active) {
          // true → false: egress in (prevT, tc]
          const ib = ingressBracket.get(k) ?? null;
          emitCompleted(
            moon,
            type,
            tr,
            ib ? ib[0] : t0,
            ib ? ib[1] : null,
            prevT,
            tc
          );
          tr.active = false;
          tr.minDist = Infinity;
          ingressBracket.set(k, null);
        }
        tr.prevTime = tc;
      }
    }
    prevT = tc;
  }

  // Handle phenomena still active at the end of the window: emit ingress + mid.
  for (const moon of moons) {
    for (const type of types) {
      const k = key(moon, type);
      const tr = trackers.get(k)!;
      if (tr.active) {
        const ib = ingressBracket.get(k) ?? null;
        if (ib) {
          const tIn = bisectCrossing(
            ib[0],
            ib[1],
            (t) => activeAt(moon, type, t),
            true
          );
          events.push({ moon, type, phase: "ingress", time: new Date(tIn) });
        }
        const midLo = Math.max(t0, tr.minTime - stepMs);
        const midHi = Math.min(t1, tr.minTime + stepMs);
        const tMid = ternaryMin(midLo, midHi, (t) =>
          distAt(moon, type, t)
        );
        events.push({ moon, type, phase: "mid", time: new Date(tMid) });
      }
    }
  }

  events.sort((a, b) => a.time.getTime() - b.time.getTime());
  return events;
}

/**
 * What is happening right now: the list of (moon, phenomenon) pairs active at
 * `date`. Each is reported with phase "mid" as a snapshot label. Returns null on
 * an invalid date, [] when nothing is going on.
 */
export function currentPhenomena(
  date: Date,
  opts: { moons?: readonly GalileanMoon[]; oblate?: boolean } = {}
): GalileanEvent[] | null {
  const positions = galileanPositions(date, opts.oblate ?? true);
  if (positions === null) return null;
  const moons = opts.moons ?? GALILEAN_MOON_ORDER;
  const out: GalileanEvent[] = [];
  for (const moon of moons) {
    const pos = positions[GALILEAN_MOONS[moon].index - 1];
    for (const type of PHENOMENON_TYPES) {
      if (isActive(pos, type)) {
        out.push({ moon, type, phase: "mid", time: new Date(date.getTime()) });
      }
    }
  }
  return out;
}

// ───────────────────── Jupiter geocentric RA/Dec + physical ─────────────────

export interface JupiterGeocentric {
  /** apparent geocentric right ascension [deg, 0–360). */
  raDeg: number;
  /** apparent geocentric declination [deg, −90…+90]. */
  decDeg: number;
  /** Earth–Jupiter distance [AU]. */
  distanceAU: number;
  /** apparent EQUATORIAL angular diameter [arcsec]. */
  angularDiameterArcsec: number;
}

/**
 * Jupiter's apparent geocentric equatorial coordinates, distance and apparent
 * size at `date`. Built by REUSING lib/planets.heliocentricPosition (JPL
 * approximate positions) for Jupiter and Earth: geocentric vector = Jupiter −
 * Earth in the J2000 ecliptic frame, corrected for light-time (one iteration),
 * then rotated to the equator by the J2000 obliquity. The apparent equatorial
 * diameter is 2·atan(Req / Δ), i.e. ≈ 197″/Δ(AU). Returns null on bad input.
 *
 * The frontend feeds {raDeg, decDeg} to lib/celestial.equatorialToHorizontal to
 * check Jupiter's altitude, and uses angularDiameterArcsec to size the disk.
 */
export function jupiterGeocentric(date: Date): JupiterGeocentric | null {
  if (!isValidDate(date)) return null;

  const earth = heliocentricPosition("Earth", date);

  // Light-time iteration: Jupiter is seen where it was τ = Δ/c days ago.
  let jup = heliocentricPosition("Jupiter", date);
  let dx = jup.x - earth.x;
  let dy = jup.y - earth.y;
  let dz = jup.z - earth.z;
  let delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
  for (let i = 0; i < 2; i++) {
    const tau = delta / LIGHT_AU_PER_DAY; // days
    const retarded = new Date(date.getTime() - tau * DAY_MS);
    jup = heliocentricPosition("Jupiter", retarded);
    dx = jup.x - earth.x;
    dy = jup.y - earth.y;
    dz = jup.z - earth.z;
    delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Ecliptic (J2000) → equatorial (J2000).
  const eps = OBLIQUITY_J2000_DEG * DEG2RAD;
  const cosE = Math.cos(eps);
  const sinE = Math.sin(eps);
  const xEq = dx;
  const yEq = dy * cosE - dz * sinE;
  const zEq = dy * sinE + dz * cosE;

  const raDeg = norm360(Math.atan2(yEq, xEq) * RAD2DEG);
  const decDeg = Math.asin(clamp(zEq / delta, -1, 1)) * RAD2DEG;

  const reqAU = JUPITER.equatorialRadiusKm / AU_KM;
  const angularDiameterArcsec =
    2 * Math.atan(reqAU / delta) * ARCSEC_PER_RAD;

  return { raDeg, decDeg, distanceAU: delta, angularDiameterArcsec };
}

// ─────────────────────────────── HUD snapshot ──────────────────────────────

export interface JupiterMoonsState {
  jupiter: JupiterGeocentric;
  positions: GalileanPosition[];
  current: GalileanEvent[];
}

/**
 * Everything the Jupiter's-Moons HUD needs in one pure call (mirrors
 * planetState / moonState): Jupiter's geocentric coordinates, the four moons'
 * apparent positions, and the phenomena in progress right now. Null on bad date.
 */
export function jupiterMoonsState(date: Date): JupiterMoonsState | null {
  const jupiter = jupiterGeocentric(date);
  const positions = galileanPositions(date);
  const current = currentPhenomena(date);
  if (!jupiter || !positions || !current) return null;
  return { jupiter, positions, current };
}
