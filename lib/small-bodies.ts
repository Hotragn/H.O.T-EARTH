/**
 * Orbital physics for the COMETS & NEAR-EARTH ASTEROIDS phase of the digital
 * twin — the "small bodies" analogue of lib/planets.ts (major planets),
 * lib/dwarf-planets.ts (dwarf planets) and lib/exoplanets.ts (other stars).
 *
 * Where planets.ts / dwarf-planets.ts carry a fixed table of Solar-System
 * bodies, this module — like lib/exoplanets.ts — is a set of PURE derivations
 * FROM ELEMENTS THE FRONTEND PASSES IN. It reads no data file itself: the small
 * body catalogue lives in public/data/small-bodies/objects.json (built by a
 * separate agent from the JPL Small-Body Database) and is handed to these
 * functions as plain objects. Every public function is a pure function of its
 * inputs, so it unit-tests cleanly (lib/small-bodies.test.ts).
 *
 * What makes these bodies different — and the interesting physics here — is that
 * eccentricity is NOT bounded below 1:
 *
 *   • bound asteroids & short-period comets:  e < 1  (ellipse, has aphelion & period)
 *   • parabolic long-period comets:           e ≈ 1  (marginally unbound)
 *   • hyperbolic / INTERSTELLAR objects:       e > 1  (open orbit, fly through once)
 *       – 1I/'Oumuamua  e ≈ 1.20
 *       – 2I/Borisov    e ≈ 3.36
 *
 * So heliocentricPosition must solve the RIGHT flavour of Kepler's equation for
 * each regime: elliptic (M = E − e·sinE), hyperbolic (M = e·sinh H − H) or
 * parabolic (Barker's equation). All three are implemented and documented below.
 *
 * ── Sources (physics-env-simulation skill: real physics, documented, or it
 *    doesn't ship — no invented numbers) ─────────────────────────────────────
 *
 *   • Orbital elements (q, e, i, Ω, ω, tp, M, epoch, period): JPL Small-Body
 *     Database (SBDB), https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html. Comets
 *     and interstellar objects are published with perihelion distance q and
 *     time-of-perihelion tp (not a mean anomaly, which is meaningless for an
 *     unbound orbit); bound asteroids carry a, e and mean anomaly M at an epoch.
 *
 *   • Kepler's equation & the conic-section orbit (elliptic/hyperbolic/parabolic
 *     anomalies, Barker's equation): Meeus, *Astronomical Algorithms*, 2nd ed.,
 *     chs. 30 & 33–35; Danby, *Fundamentals of Celestial Mechanics*, 2nd ed.,
 *     §6.3–6.8; Vallado, *Fundamentals of Astrodynamics and Applications*.
 *
 *   • Gaussian gravitational constant k = 0.017202098950000 rad·AU^(3/2)/day
 *     (defining constant of the old IAU system; k = √(GM☉) in these units), so
 *     mean motion n = k / |a|^(3/2). For a = 1 AU this yields the sidereal year
 *     (2π/k ≈ 365.256 d). (JPL / IAU 1976 System of Astronomical Constants.)
 *
 *   • NEO group definitions (Apollo / Aten / Amor / Atira) and the PHA threshold:
 *     NASA/JPL CNEOS, https://cneos.jpl.nasa.gov/about/neo_groups.html.
 *
 *   • Tisserand parameter wrt Jupiter and the comet dynamical classes
 *     (Jupiter-family 2 < Tj < 3, Halley-type, long-period): Levison (1996),
 *     "Comet Taxonomy", ASP Conf. 107; Jupiter a_J = 5.204 AU (JPL).
 *
 *   • Comet activity onset near ~3 AU (water-ice sublimation): standard cometary
 *     science (e.g. Meech & Svoreň 2004, in *Comets II*). Our activity factor is
 *     ILLUSTRATIVE (a qualitative r⁻² insolation cue), NOT a photometric model.
 *
 * ── Coordinate frame ────────────────────────────────────────────────────────
 *
 * heliocentricPosition returns J2000-ecliptic x,y,z (AU): +X to the vernal
 * equinox, +Z to the ecliptic north pole — IDENTICAL to lib/planets.ts and
 * lib/dwarf-planets.ts, so an orrery can place planets, dwarfs and small bodies
 * in ONE frame. The scene projection (orreryLayout / orbitPath) follows the same
 * lib/geo handedness as the sibling orreries: x = r·cos λ, z = −r·sin λ.
 *
 * ── Honesty notes (so the HUD can label everything truthfully) ───────────────
 *
 *   • These are MEAN osculating elements at one epoch propagated with a constant
 *     two-body mean motion — good to a fraction of a degree over the modern era
 *     for a renderer, but NOT a perturbed JPL-Horizons ephemeris. Non-gravitational
 *     forces (comet outgassing) are not modelled.
 *   • Open (e ≥ 1) trajectories have NO aphelion and NO period; orbitPath draws
 *     them as a bounded ARC through the inner system, never a closed loop.
 *   • Orrery radius is compressed (comet aphelia reach tens–thousands of AU;
 *     Halley ~35 AU); the ANGLE is always the real heliocentric longitude and the
 *     true distanceAU is always returned.
 *   • Every function tolerates missing/partial elements and returns null (never
 *     NaN, never throws) rather than inventing a value.
 */

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** Unix ms at the J2000 epoch (2000-01-01 12:00 TT ≈ UTC for our purposes). */
const DAY_MS = 86_400_000;
/** Days in a Julian year (period ↔ semi-major axis via Kepler's 3rd law). */
const DAYS_PER_YEAR = 365.25;

/**
 * Gaussian gravitational constant k [rad·AU^(3/2)/day] — k = √(GM☉) in AU/day
 * units (IAU 1976). Mean motion n = k / |a|^(3/2); for a = 1 AU, 2π/k ≈ 365.256 d
 * (the sidereal year). Used for BOTH elliptic and hyperbolic mean motion so the
 * two regimes share one time scale.
 */
const GAUSS_K = 0.017202098950000;

/** IAU 2012 astronomical unit in kilometres. */
export const AU_KM = 149_597_870.7;

/**
 * One lunar distance (LD) in AU. 1 LD = mean Earth–Moon distance ≈ 384,400 km;
 * 384,400 / 149,597,870.7 ≈ 0.002569 AU. Used for the "how many Moon-distances
 * did it miss us by" close-approach readout. (Value fixed at 0.002569 AU.)
 */
export const LUNAR_DISTANCE_AU = 0.002569;

/** Jupiter's semi-major axis [AU] (JPL) — the reference for the Tisserand param. */
export const JUPITER_SEMI_MAJOR_AU = 5.204;

/** Earth's perihelion distance [AU] — the Aten/Atira (aphelion) boundary. */
const EARTH_PERIHELION_AU = 0.983;
/** Earth's aphelion distance [AU] — the Apollo/Amor (perihelion) boundary. */
const EARTH_APHELION_AU = 1.017;
/** Near-Earth object perihelion cutoff [AU] (q < 1.3 AU ⇒ near-Earth). */
const NEO_PERIHELION_MAX_AU = 1.3;

/** PHA thresholds: Earth MOID ≤ 0.05 AU AND absolute magnitude H ≤ 22. (CNEOS.) */
export const PHA_MOID_MAX_AU = 0.05;
export const PHA_ABS_MAG_MAX = 22;

/**
 * Heliocentric distance [AU] at which water-ice sublimation (hence dust/gas
 * activity) becomes significant — the classic ~3 AU "activity onset". Beyond it
 * {@link cometActivity} returns 0. Illustrative threshold, not a per-comet value.
 */
export const COMET_ACTIVITY_ONSET_AU = 3;

/**
 * Half-width of the eccentricity band around e = 1 treated as PARABOLIC (solved
 * with Barker's equation). Real catalogue objects are either clearly bound
 * (e ≲ 0.99) or clearly hyperbolic (interstellar e ≳ 1.2); only long-period
 * comets fit with an exactly-parabolic e = 1 solution land here. Within ±1e-3 of
 * e = 1 the elliptic/hyperbolic Newton iterations become ill-conditioned (their
 * (1 − e·cosE)/(e·coshH − 1) denominators vanish), while Barker's closed form is
 * exact at e = 1 and its error is O(|e−1|) — utterly negligible over the inner-
 * system arc we render. Documented so the choice of solver is auditable.
 */
const PARABOLIC_BAND = 1e-3;

/** Normalize an angle to [0, 360). */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** True if x is a finite, usable number (not null/undefined/NaN/Infinity). */
function isNum(x: number | null | undefined): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

// ─────────────────────────── Input shape ────────────────────────────────────
//
// Mirrors public/data/small-bodies/objects.json (JPL SBDB field names), with
// every field OPTIONAL/nullable because different body types omit different
// fields (comets have q + tp but no mean anomaly; asteroids have a + M + epoch).

/**
 * Osculating orbital elements for one small body, as passed in from the
 * catalogue. Angles in DEGREES, distances in AU, times as Julian Dates.
 *
 * NOTE on eccentricity regimes:
 *   • e < 1  — bound: `a` positive, has `Q` (aphelion) and `period_yr`.
 *   • e = 1  — parabolic: `a` → ∞ (usually absent); anchored by `q` + `tp`.
 *   • e > 1  — hyperbolic/interstellar: `a` NEGATIVE (JPL convention); no `Q`,
 *              no `period_yr`; anchored by `q` + `tp`.
 */
export interface SmallBodyElements {
  /** semi-major axis a [AU]; NEGATIVE for hyperbolic orbits (JPL convention) */
  a?: number | null;
  /** eccentricity e [–] (≥ 1 for parabolic/hyperbolic/interstellar) */
  e?: number | null;
  /** perihelion distance q [AU] — the fundamental size for open orbits */
  q?: number | null;
  /** aphelion distance Q [AU] — bound orbits only (null/absent for e ≥ 1) */
  Q?: number | null;
  /** inclination i to the J2000 ecliptic [deg] */
  i?: number | null;
  /** longitude of the ascending node Ω [deg] */
  om?: number | null;
  /** argument of perihelion ω [deg] */
  w?: number | null;
  /** mean anomaly M at the epoch [deg] — bound orbits only */
  ma?: number | null;
  /** time of perihelion passage T_p [JD] — the anchor for comets/open orbits */
  tp?: number | null;
  /** tabulated orbital period [Earth years] — bound orbits only */
  period_yr?: number | null;
  /** epoch of the mean anomaly `ma` [JD] */
  epoch?: number | null;
}

/** A named body for the batch orrery layout. */
export interface SmallBodyInput {
  name?: string;
  elements: SmallBodyElements;
}

// ─────────────────────────── Time / epoch helper ────────────────────────────

/**
 * Julian Date (Terrestrial Time) of a UTC instant. We fold in ΔT = TT − UTC ≈
 * 69.2 s for the modern leap-second era (same approximation, and same honesty
 * note, as lib/planets.ts / lib/dwarf-planets.ts). At small-body mean-motion
 * rates this is negligible.
 */
export function julianDateTT(date: Date): number {
  return 2440587.5 + (date.getTime() + 69_184) / DAY_MS;
}

// ─────────────────────────── Kepler solvers ─────────────────────────────────

/**
 * Solve the ELLIPTIC Kepler equation M = E − e·sinE for the eccentric anomaly E
 * (radians). Same role as the solveKepler in lib/planets.ts / lib/dwarf-planets.ts
 * / lib/exoplanets.ts, but GLOBALLY CONVERGENT for the near-parabolic bound comets
 * this module must handle (Halley e ≈ 0.967, and up to e ≈ 0.999 where the
 * parabolic band takes over): a plain E = π Newton start can diverge above
 * e ≈ 0.95, so we safeguard it with bracketing.
 *
 * The root is PROVABLY bracketed in [Mr − e, Mr + e]: since E = Mr + e·sinE with
 * |sinE| ≤ 1, |E − Mr| ≤ e, and f(E) = E − e·sinE − Mr is monotone increasing
 * (f' = 1 − e·cosE > 0), so f(Mr−e) ≤ 0 ≤ f(Mr+e). We run Newton but fall back to
 * bisection whenever a step would leave that bracket — guaranteeing convergence
 * for every e < 1. `M` is the mean anomaly [rad], reduced internally to (−π, π].
 * Ref: Danby §6.6; the bracketed-Newton safeguard is the standard robust form.
 */
export function solveKepler(M: number, e: number, tolerance = 1e-12): number {
  // Reduce M to (-π, π]; the root E then lies in the tight bracket [Mr-e, Mr+e].
  const Mr = Math.atan2(Math.sin(M), Math.cos(M));
  let lo = Mr - e;
  let hi = Mr + e;
  let E = Mr + e * Math.sin(Mr); // good first guess inside the bracket
  for (let iter = 0; iter < 100; iter++) {
    const f = E - e * Math.sin(E) - Mr;
    if (f > 0) hi = E;
    else lo = E;
    const fp = 1 - e * Math.cos(E);
    let next = E - f / fp; // Newton step
    if (!(next > lo && next < hi)) next = 0.5 * (lo + hi); // bisection safeguard
    if (Math.abs(next - E) < tolerance) return next;
    E = next;
  }
  return E;
}

/**
 * Solve the HYPERBOLIC Kepler equation M = e·sinh(H) − H for the hyperbolic
 * anomaly H (radians) by Newton–Raphson. `M` is the hyperbolic mean anomaly
 * (radians, = n·(t − t_p), UNBOUNDED — do NOT wrap it), `e` the eccentricity
 * (e > 1). This is the open-orbit analogue of {@link solveKepler} and the piece
 * that lets interstellar objects ('Oumuamua e ≈ 1.2, Borisov e ≈ 3.36) fly
 * through the inner system on a genuine hyperbola.
 *
 *   f(H)  = e·sinh H − H − M
 *   f'(H) = e·cosh H − 1  ≥  e − 1 > 0   (strictly positive ⇒ Newton never
 *                                         divides by zero and converges from the
 *                                         smooth start H₀ = asinh(M/e))
 *
 * The start H₀ = asinh(M/e) is exact at M = 0 (H = 0, perihelion) and excellent
 * for large |M| (there e·sinh H dominates, so sinh H ≈ M/e). Exported for tests.
 * Ref: Danby §6.8; Meeus ch. 35.
 */
export function solveKeplerHyperbolic(
  M: number,
  e: number,
  tolerance = 1e-12
): number {
  if (!Number.isFinite(M) || !Number.isFinite(e) || e <= 1) return NaN;
  let H = Math.asinh(M / e); // smooth global starter; H(0) = 0
  for (let iter = 0; iter < 100; iter++) {
    const f = e * Math.sinh(H) - H - M;
    const df = e * Math.cosh(H) - 1;
    const dH = f / df;
    H -= dH;
    if (Math.abs(dH) < tolerance) break;
  }
  return H;
}

// ─────────────────────────── Element resolution ─────────────────────────────

/** Fully-resolved elements sufficient to compute a position. */
interface ResolvedElements {
  /** eccentricity */
  e: number;
  /** perihelion distance q [AU] (> 0) */
  q: number;
  /** signed semi-major axis a [AU] (>0 elliptic, <0 hyperbolic, ∞ parabolic) */
  aSigned: number;
  /** inclination [rad] */
  iRad: number;
  /** longitude of ascending node Ω [rad] */
  nodeRad: number;
  /** argument of perihelion ω [rad] */
  argPeriRad: number;
  /** time of perihelion passage [JD], or null */
  tp: number | null;
  /** mean anomaly at epoch [deg], or null */
  maDeg: number | null;
  /** epoch of the mean anomaly [JD], or null */
  epoch: number | null;
}

/**
 * Derive a complete, self-consistent element set from whatever subset the
 * catalogue supplies. Eccentricity is recovered from any of {e}, {a,q}, {a,Q} or
 * {q,Q}; perihelion q from {q}, {a,e} (works for negative hyperbolic a since
 * q = a(1−e) stays positive) or {Q,e}. Missing angles default to 0. Returns null
 * if e or q cannot be pinned down (caller then returns null — never NaN/throws).
 */
function resolveElements(el: SmallBodyElements): ResolvedElements | null {
  // 1. Eccentricity.
  let e: number | null = null;
  if (isNum(el.e)) e = el.e;
  else if (isNum(el.a) && isNum(el.q) && el.a !== 0) e = 1 - el.q / el.a;
  else if (isNum(el.a) && isNum(el.Q) && el.a !== 0) e = el.Q / el.a - 1;
  else if (isNum(el.q) && isNum(el.Q) && el.q + el.Q !== 0)
    e = (el.Q - el.q) / (el.Q + el.q);
  if (e === null || !Number.isFinite(e) || e < 0) return null;

  // 2. Perihelion distance q.
  let q: number | null = null;
  if (isNum(el.q)) q = el.q;
  else if (isNum(el.a)) q = el.a * (1 - e); // a<0 & (1-e)<0 ⇒ q>0 for hyperbolic
  else if (isNum(el.Q) && e < 1) q = (el.Q * (1 - e)) / (1 + e); // q = Q(1−e)/(1+e)
  if (q === null || !Number.isFinite(q) || q <= 0) return null;

  // 3. Signed semi-major axis (∞ at e = 1).
  const aSigned = isNum(el.a) ? el.a : e !== 1 ? q / (1 - e) : Infinity;

  return {
    e,
    q,
    aSigned,
    iRad: (isNum(el.i) ? el.i : 0) * DEG2RAD,
    nodeRad: (isNum(el.om) ? el.om : 0) * DEG2RAD,
    argPeriRad: (isNum(el.w) ? el.w : 0) * DEG2RAD,
    tp: isNum(el.tp) ? el.tp : null,
    maDeg: isNum(el.ma) ? el.ma : null,
    epoch: isNum(el.epoch) ? el.epoch : null,
  };
}

// ─────────────────────────── Perifocal → ecliptic ───────────────────────────

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
  /** true anomaly ν [deg] — angle from perihelion (useful for the HUD) */
  trueAnomalyDeg: number;
}

/**
 * Rotate a perifocal position (x' toward perihelion, y' 90° ahead in the
 * direction of motion) into the J2000 ecliptic frame by ω (arg. perihelion),
 * i (inclination), Ω (node) — the standard R_z(Ω)·R_x(i)·R_z(ω) product, byte-
 * for-byte the same matrix lib/planets.ts and lib/dwarf-planets.ts apply to
 * (a(cosE−e), a√(1−e²)·sinE). Returns a full HeliocentricPosition.
 */
function perifocalToEcliptic(
  xPlane: number,
  yPlane: number,
  res: ResolvedElements,
  trueAnomalyRad: number
): HeliocentricPosition {
  const cosO = Math.cos(res.argPeriRad);
  const sinO = Math.sin(res.argPeriRad);
  const cosN = Math.cos(res.nodeRad);
  const sinN = Math.sin(res.nodeRad);
  const cosI = Math.cos(res.iRad);
  const sinI = Math.sin(res.iRad);

  const x =
    (cosO * cosN - sinO * sinN * cosI) * xPlane +
    (-sinO * cosN - cosO * sinN * cosI) * yPlane;
  const y =
    (cosO * sinN + sinO * cosN * cosI) * xPlane +
    (-sinO * sinN + cosO * cosN * cosI) * yPlane;
  const z = sinO * sinI * xPlane + cosO * sinI * yPlane;

  const distanceAU = Math.sqrt(x * x + y * y + z * z);
  return {
    x,
    y,
    z,
    distanceAU,
    longitudeDeg: norm360(Math.atan2(y, x) * RAD2DEG),
    trueAnomalyDeg: norm360(trueAnomalyRad * RAD2DEG),
  };
}

/** Distance from the Sun r [AU] at true anomaly ν — the conic r = p/(1+e·cosν). */
function radiusAtTrueAnomaly(res: ResolvedElements, nu: number): number {
  // Semi-latus rectum p = q(1 + e); valid for every conic (e < 1, = 1, > 1).
  return (res.q * (1 + res.e)) / (1 + res.e * Math.cos(nu));
}

/** Build a HeliocentricPosition purely from geometry (true anomaly), no time. */
function positionAtTrueAnomaly(
  res: ResolvedElements,
  nu: number
): HeliocentricPosition {
  const r = radiusAtTrueAnomaly(res, nu);
  return perifocalToEcliptic(r * Math.cos(nu), r * Math.sin(nu), res, nu);
}

// ─────────────────────────── True anomaly from time ─────────────────────────

/**
 * True anomaly ν [rad] at Julian Date `jd`, choosing the correct Kepler regime
 * from the eccentricity. Returns null when no time anchor is available (open
 * orbits require `tp`; bound orbits accept `tp` OR `ma`+`epoch`).
 */
function trueAnomalyAtJD(res: ResolvedElements, jd: number): number | null {
  const { e, q, aSigned } = res;

  // ── Parabolic band: Barker's equation (closed form) ──────────────────────
  if (Math.abs(e - 1) < PARABOLIC_BAND) {
    if (res.tp === null) return null; // no mean anomaly for a parabola
    // D + D³/3 = W,  W = k·(t − t_p) / (√2 · q^(3/2)).  Depressed cubic
    // D³ + 3D − 3W = 0 has the single real root (Cardano):
    const W = (GAUSS_K * (jd - res.tp)) / (Math.SQRT2 * Math.pow(q, 1.5));
    const root = Math.sqrt(2.25 * W * W + 1); // √(9W²/4 + 1)
    const D = Math.cbrt(1.5 * W + root) + Math.cbrt(1.5 * W - root);
    return 2 * Math.atan(D); // ν = 2·atan(tan(ν/2))
  }

  // ── Hyperbolic: M = e·sinh H − H ─────────────────────────────────────────
  if (e > 1) {
    const n = GAUSS_K / Math.pow(-aSigned, 1.5); // |a| = −aSigned (a < 0)
    let M: number;
    if (res.tp !== null) M = n * (jd - res.tp);
    else if (res.maDeg !== null && res.epoch !== null)
      M = res.maDeg * DEG2RAD + n * (jd - res.epoch); // best-effort fallback
    else return null;
    const H = solveKeplerHyperbolic(M, e);
    // ν = 2·atan2( √(e+1)·sinh(H/2), √(e−1)·cosh(H/2) )
    return (
      2 *
      Math.atan2(
        Math.sqrt(e + 1) * Math.sinh(H / 2),
        Math.sqrt(e - 1) * Math.cosh(H / 2)
      )
    );
  }

  // ── Elliptic: M = E − e·sinE ─────────────────────────────────────────────
  const n = GAUSS_K / Math.pow(aSigned, 1.5);
  let M: number;
  if (res.tp !== null) M = n * (jd - res.tp);
  else if (res.maDeg !== null && res.epoch !== null)
    M = res.maDeg * DEG2RAD + n * (jd - res.epoch);
  else return null;
  const E = solveKepler(M, e);
  // ν = 2·atan2( √(1+e)·sin(E/2), √(1−e)·cos(E/2) )
  return (
    2 *
    Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    )
  );
}

// ─────────────────────────── Heliocentric position ──────────────────────────

/**
 * Heliocentric ecliptic position of a small body at a UTC instant, in AU. Solves
 * the elliptic, hyperbolic or parabolic Kepler problem according to the
 * eccentricity (see {@link trueAnomalyAtJD}) and returns the J2000-ecliptic frame
 * shared with lib/planets.ts / lib/dwarf-planets.ts, so a single orrery can mix
 * planets, dwarfs and small bodies.
 *
 * Returns null (never NaN, never throws) if the elements are insufficient — e or
 * q not derivable, or no time anchor (open orbits need `tp`; bound orbits accept
 * `tp` or `ma` + `epoch`).
 */
export function heliocentricPosition(
  elements: SmallBodyElements,
  date: Date
): HeliocentricPosition | null {
  const res = resolveElements(elements);
  if (!res) return null;
  const nu = trueAnomalyAtJD(res, julianDateTT(date));
  if (nu === null || !Number.isFinite(nu)) return null;
  const pos = positionAtTrueAnomaly(res, nu);
  return Number.isFinite(pos.distanceAU) ? pos : null;
}

/** Heliocentric distance from the Sun [AU] at a UTC instant, or null. */
export function heliocentricDistanceAU(
  elements: SmallBodyElements,
  date: Date
): number | null {
  return heliocentricPosition(elements, date)?.distanceAU ?? null;
}

// ─────────────────────────── Regime / bound helpers ─────────────────────────

export type OrbitRegime = "elliptical" | "parabolic" | "hyperbolic";

/** Orbit regime from eccentricity (parabolic within ±1e-3 of e = 1). */
export function orbitRegime(e: number | null | undefined): OrbitRegime | null {
  if (!isNum(e) || e < 0) return null;
  if (Math.abs(e - 1) < PARABOLIC_BAND) return "parabolic";
  return e < 1 ? "elliptical" : "hyperbolic";
}

/** True ⇒ the orbit is bound (e < 1): it has an aphelion and a period. */
export function isBound(e: number | null | undefined): boolean {
  return isNum(e) && e < 1;
}

/**
 * True ⇒ the orbit is unbound with e > 1: an interstellar/hyperbolic flyby that
 * enters the Solar System once and never returns (1I/'Oumuamua, 2I/Borisov).
 * Parabolic e = 1 is marginally unbound but returns false here (use
 * {@link orbitRegime} to distinguish the parabolic band).
 */
export function isInterstellar(e: number | null | undefined): boolean {
  return isNum(e) && e > 1;
}

// ─────────────────────────── Size / period helpers ──────────────────────────

/** Perihelion distance q [AU], or null if not derivable. */
export function perihelionAU(elements: SmallBodyElements): number | null {
  return resolveElements(elements)?.q ?? null;
}

/**
 * Aphelion distance Q [AU] — a(1+e) — or NULL for e ≥ 1 (an open orbit has no
 * aphelion). Null-safe on missing elements too.
 */
export function aphelionAU(elements: SmallBodyElements): number | null {
  const res = resolveElements(elements);
  if (!res || res.e >= 1) return null;
  if (isNum(elements.Q)) return elements.Q;
  return res.aSigned * (1 + res.e);
}

/**
 * Sidereal orbital period [Earth years] — Kepler's 3rd law P = a^(3/2) — or NULL
 * for e ≥ 1 (an open orbit never completes a revolution). Prefers a tabulated
 * `period_yr` when present.
 */
export function orbitalPeriodYears(elements: SmallBodyElements): number | null {
  const res = resolveElements(elements);
  if (!res || res.e >= 1) return null;
  if (isNum(elements.period_yr)) return elements.period_yr;
  return Math.pow(res.aSigned, 1.5);
}

/** Signed semi-major axis a [AU] (negative for hyperbolic), or null. */
export function semiMajorAxisAU(elements: SmallBodyElements): number | null {
  const res = resolveElements(elements);
  if (!res || !Number.isFinite(res.aSigned)) return null;
  return res.aSigned;
}

// ─────────────────────────── Tisserand parameter ────────────────────────────

/**
 * Tisserand parameter with respect to Jupiter — a nearly-conserved quantity that
 * separates the comet dynamical classes:
 *
 *   T_J = a_J/a + 2·cos(i)·√( (a/a_J)·(1 − e²) )        (a_J = 5.204 AU)
 *
 * Jupiter-family comets have 2 < T_J < 3, Halley-type & long-period comets
 * T_J < 2, and most asteroids T_J > 3. The inclination is taken relative to the
 * ecliptic (a standard approximation for Jupiter's orbital plane). UNDEFINED for
 * unbound orbits (1 − e² < 0), so this returns NULL for e ≥ 1. Ref: Levison 1996.
 */
export function tisserandParameter(
  elements: SmallBodyElements,
  aJupiterAU = JUPITER_SEMI_MAJOR_AU
): number | null {
  const res = resolveElements(elements);
  if (!res || res.e >= 1 || res.aSigned <= 0) return null;
  const a = res.aSigned;
  return (
    aJupiterAU / a +
    2 *
      Math.cos(res.iRad) *
      Math.sqrt((a / aJupiterAU) * (1 - res.e * res.e))
  );
}

// ─────────────────────────── Near-Earth classes ─────────────────────────────

export type NeaClass = "Apollo" | "Aten" | "Amor" | "Atira";

/**
 * Classify a near-Earth object into its standard NEO group, or NULL if it is not
 * near-Earth (q ≥ 1.3 AU) or is unbound (e ≥ 1 — an interstellar/hyperbolic body
 * is not an NEA in this taxonomy). Definitions (NASA/JPL CNEOS), with Earth's
 * perihelion 0.983 AU and aphelion 1.017 AU:
 *
 *   Atira/IEO : a < 1,  Q < 0.983            (orbit entirely interior to Earth's)
 *   Aten      : a < 1,  Q ≥ 0.983            (Earth-crossing, smaller orbit)
 *   Apollo    : a ≥ 1,  q ≤ 1.017            (Earth-crossing, larger orbit)
 *   Amor      : a > 1,  1.017 < q < 1.3      (approach but do not cross Earth's orbit)
 */
export function neaClass(elements: SmallBodyElements): NeaClass | null {
  const res = resolveElements(elements);
  if (!res || res.e >= 1) return null; // unbound / unresolved
  const a = res.aSigned;
  const q = res.q;
  const Q = a * (1 + res.e);
  if (q >= NEO_PERIHELION_MAX_AU) return null; // not near-Earth
  if (Q < EARTH_PERIHELION_AU) return "Atira"; // interior to Earth's orbit
  if (a < 1) return "Aten"; // a<1 and Q ≥ 0.983
  if (q <= EARTH_APHELION_AU) return "Apollo"; // a≥1, Earth-crossing
  return "Amor"; // a>1, 1.017 < q < 1.3
}

// ─────────────────────────── Comet classes ──────────────────────────────────

export type CometClass =
  | "jupiter-family"
  | "halley-type"
  | "long-period"
  | "interstellar";

export interface CometClassification {
  /** machine label */
  class: CometClass;
  /** Tisserand parameter wrt Jupiter (null for unbound orbits) */
  tisserandJupiter: number | null;
  /** orbital period [yr] (null for unbound orbits) */
  periodYears: number | null;
  /** honest one-line description for the HUD */
  note: string;
}

/**
 * Classify a comet by orbital period and Tisserand parameter (Levison 1996):
 *
 *   interstellar   : e > 1 (unbound — flies through once, never returns)
 *   Jupiter-family : P < 20 yr, or 2 < T_J < 3 (Jupiter-controlled ecliptic comets)
 *   Halley-type    : 20 ≤ P < 200 yr (T_J < 2 — intermediate, inclined/retrograde)
 *   long-period    : P ≥ 200 yr (near-isotropic; aphelia in the Oort cloud)
 *
 * Returns null only if the elements are too sparse to resolve. The period is
 * Kepler's-law a^(3/2) and the Tisserand is {@link tisserandParameter}.
 */
export function cometClass(
  elements: SmallBodyElements
): CometClassification | null {
  const res = resolveElements(elements);
  if (!res) return null;

  if (res.e > 1) {
    return {
      class: "interstellar",
      tisserandJupiter: null,
      periodYears: null,
      note: "Unbound (e > 1): an interstellar/hyperbolic visitor that passes through the Solar System once and never returns.",
    };
  }

  const P = orbitalPeriodYears(elements);
  const Tj = tisserandParameter(elements);

  let cls: CometClass;
  if (P !== null && P < 20) cls = "jupiter-family";
  else if (Tj !== null && Tj > 2 && Tj < 3) cls = "jupiter-family";
  else if (P !== null && P < 200) cls = "halley-type";
  else cls = "long-period";

  const note =
    cls === "jupiter-family"
      ? "Jupiter-family comet (P < 20 yr or 2 < T_J < 3): short-period, low-inclination, dynamically controlled by Jupiter."
      : cls === "halley-type"
        ? "Halley-type comet (20–200 yr period, T_J < 2): intermediate period, often highly inclined or retrograde."
        : "Long-period comet (P > 200 yr): near-isotropic orbit with an aphelion far out toward the Oort cloud.";

  return { class: cls, tisserandJupiter: Tj, periodYears: P, note };
}

// ─────────────────────────── Comet activity + tail ──────────────────────────

/**
 * Anti-sunward unit vector for a comet at heliocentric position `bodyPosAU` (Sun
 * at the origin) — the direction the tail points.
 *
 * HONESTY: a comet's ION (plasma) tail points almost exactly ANTI-SUNWARD, blown
 * straight back by the solar wind; the DUST tail curves and LAGS along the orbit.
 * "Anti-sunward" is the honest FIRST-ORDER truth for the tail direction (exact
 * for the ion tail), which is why we return −r̂ and document that the dust tail's
 * curvature is not modelled. Returns null if the position is missing or at the
 * Sun (direction undefined).
 */
export function tailDirection(
  bodyPosAU: { x: number; y: number; z: number } | null | undefined
): [number, number, number] | null {
  if (
    !bodyPosAU ||
    !isNum(bodyPosAU.x) ||
    !isNum(bodyPosAU.y) ||
    !isNum(bodyPosAU.z)
  )
    return null;
  const { x, y, z } = bodyPosAU;
  const r = Math.sqrt(x * x + y * y + z * z);
  if (r === 0) return null; // at the Sun — direction undefined
  return [-x / r, -y / r, -z / r];
}

/**
 * ILLUSTRATIVE cometary activity factor in [0, 1] that RISES as the heliocentric
 * distance falls — a qualitative cue for the renderer (brighter coma / longer
 * tail near the Sun), NOT a photometric or production-rate prediction.
 *
 * Physics motivation: water-ice sublimation (the dominant driver of activity)
 * only becomes significant inside ~3 AU, and insolation scales as r⁻². So:
 *
 *   r ≥ 3 AU                    → 0  (essentially inactive; ices frozen)
 *   3 AU > r > ~1 AU            → smoothly rising with the r⁻² flux
 *   r ≤ ~1 AU                   → saturates at 1
 *
 * Concretely factor = clamp01( (1/r² − 1/9) / (1/1² − 1/9) ), i.e. the r⁻² flux
 * normalized so 3 AU → 0 and 1 AU → 1. Returns 0 for unknown/non-positive r.
 */
export function cometActivity(helioAU: number | null | undefined): number {
  if (!isNum(helioAU) || helioAU <= 0) return 0;
  if (helioAU >= COMET_ACTIVITY_ONSET_AU) return 0;
  const onset = COMET_ACTIVITY_ONSET_AU;
  const raw =
    (1 / (helioAU * helioAU) - 1 / (onset * onset)) /
    (1 / 1 - 1 / (onset * onset));
  return Math.min(1, Math.max(0, raw));
}

// ─────────────────────────── Lunar-distance helpers ─────────────────────────

/** Convert an AU distance to lunar distances (LD); 1 LD = 0.002569 AU. Null-safe. */
export function auToLunarDistances(au: number | null | undefined): number | null {
  if (!isNum(au)) return null;
  return au / LUNAR_DISTANCE_AU;
}

/** Convert lunar distances (LD) to AU; 1 LD = 0.002569 AU. Null-safe. */
export function lunarDistancesToAU(ld: number | null | undefined): number | null {
  if (!isNum(ld)) return null;
  return ld * LUNAR_DISTANCE_AU;
}

/** Convert an AU distance to kilometres. Null-safe. */
export function auToKm(au: number | null | undefined): number | null {
  if (!isNum(au)) return null;
  return au * AU_KM;
}

// ─────────────────────────── PHA (hazard) helpers ───────────────────────────

/**
 * Is an object POTENTIALLY HAZARDOUS (a PHA)? The NASA/JPL threshold is an Earth
 * MOID (Minimum Orbit Intersection Distance) ≤ 0.05 AU AND an absolute magnitude
 * H ≤ 22 (a proxy for a diameter ≳ 140 m). MOID is NOT computed here — it is a
 * true minimum-distance search over both orbits, supplied by the catalogue (SBDB);
 * this helper just applies the two thresholds. Returns null if either input is
 * missing. Ref: CNEOS.
 */
export function isPotentiallyHazardous(
  moidAU: number | null | undefined,
  absMagH: number | null | undefined
): boolean | null {
  if (!isNum(moidAU) || !isNum(absMagH)) return null;
  return moidAU <= PHA_MOID_MAX_AU && absMagH <= PHA_ABS_MAG_MAX;
}

/**
 * One-line explanation of the PHA threshold for the HUD, optionally annotated
 * with a specific MOID. 0.05 AU ≈ 19.5 lunar distances, so the note ties the
 * abstract cutoff to something intuitive.
 */
export function moidNote(moidAU?: number | null): string {
  const base =
    "Potentially Hazardous (PHA): Earth MOID ≤ 0.05 AU (≈ 19.5 lunar distances) " +
    "AND absolute magnitude H ≤ 22 (diameter ≳ 140 m). MOID is the minimum " +
    "distance between the two orbits — a close-approach proxy, not the current gap.";
  if (!isNum(moidAU)) return base;
  const ld = moidAU / LUNAR_DISTANCE_AU;
  const hazard = moidAU <= PHA_MOID_MAX_AU ? "within" : "outside";
  return `${base} This object's MOID is ${moidAU.toFixed(4)} AU (≈ ${ld.toFixed(
    1
  )} LD) — ${hazard} the 0.05 AU PHA distance.`;
}

// ─────────────────────── AU ↔ scene-unit compression ────────────────────────

export type RadialScaleMode = "log" | "sqrt" | "linear";

export interface CompressionOptions {
  /**
   * How the radius is compressed. "log" (default) and "sqrt" squeeze the wildly
   * different scales (a sungrazer at 0.1 AU and a long-period aphelion at
   * thousands of AU) into one view; "linear" keeps true proportional distances.
   */
  mode?: RadialScaleMode;
  /** scene radius assigned to `innerAU` (log/sqrt modes). Default 1. */
  minRadius?: number;
  /** scene radius assigned to `outerAU` (log/sqrt modes). Default 10. */
  maxRadius?: number;
  /** AU distance mapped to `minRadius`. Default 0.3 (inside most perihelia). */
  innerAU?: number;
  /** AU distance mapped to `maxRadius`. Default 100 (past Halley's ~35 AU aphelion). */
  outerAU?: number;
  /** scene units per AU for "linear" mode. Default 1. */
  unitsPerAU?: number;
}

/**
 * Compress a true heliocentric distance (AU) to a scene radius per the chosen
 * mode — the SAME shape as lib/planets.ts / lib/dwarf-planets.ts compressRadius,
 * so a small-body orrery can share a scale with the planet/dwarf orreries by
 * passing identical {mode, minRadius, maxRadius, innerAU, outerAU}. log/sqrt are
 * monotonic and extrapolate past `outerAU` (comet aphelia far exceed it), so a
 * remote long-period aphelion still maps to a finite, larger radius.
 */
export function compressRadius(au: number, opts: CompressionOptions = {}): number {
  const mode = opts.mode ?? "log";
  if (mode === "linear") return au * (opts.unitsPerAU ?? 1);
  const minRadius = opts.minRadius ?? 1;
  const maxRadius = opts.maxRadius ?? 10;
  const innerAU = opts.innerAU ?? 0.3;
  const outerAU = opts.outerAU ?? 100;
  const f = mode === "sqrt" ? Math.sqrt : Math.log;
  const t = (f(au) - f(innerAU)) / (f(outerAU) - f(innerAU));
  return minRadius + t * (maxRadius - minRadius);
}

// ─────────────────────────── Orbit sampling ─────────────────────────────────

export interface OrbitPathOptions extends CompressionOptions {
  /** number of sample points along the path. Default 256. */
  samples?: number;
  /**
   * Radius cap [AU] that bounds an OPEN (e ≥ 1) trajectory's arc. The hyperbola/
   * parabola is drawn only where r ≤ this (and always short of the asymptote), so
   * it becomes a finite arc through the inner system rather than running to
   * infinity. Ignored for closed ellipses. Default 50 AU.
   */
  maxRadiusAU?: number;
  /**
   * Optional hard cap on |ν| [deg] for an OPEN trajectory, applied in addition to
   * `maxRadiusAU` (whichever is tighter). Ignored for closed ellipses.
   */
  maxTrueAnomalyDeg?: number;
}

export interface OrbitPathPoint {
  /** compressed scene X (top-down ecliptic projection) */
  x: number;
  /** compressed scene Z (top-down ecliptic projection) */
  z: number;
  /** TRUE ecliptic X projection [AU] (for a to-scale orbit line) */
  xAU: number;
  /** TRUE ecliptic Z projection [AU] */
  zAU: number;
  /** true heliocentric distance at this point [AU] */
  distanceAU: number;
  /** true anomaly at this point [deg] */
  trueAnomalyDeg: number;
}

export interface OrbitPath {
  points: OrbitPathPoint[];
  /** true ⇒ closed ellipse (one full revolution); false ⇒ open arc */
  closed: boolean;
  regime: OrbitRegime;
  mode: RadialScaleMode;
  /** human-readable honesty string for the UI */
  note: string;
}

/**
 * Sample a body's orbit into scene points for a drawn orbit line. This is pure
 * GEOMETRY (from e, q, i, Ω, ω) — it needs no time anchor (`tp`/`ma`), so it
 * draws the path even for a body whose current position is unknown.
 *
 *   • ELLIPSE (e < 1): sampled over one full revolution (ν = 0…360°) and returned
 *     `closed: true` — a closed loop.
 *   • HYPERBOLA / PARABOLA (e ≥ 1): sampled over a BOUNDED arc symmetric about
 *     perihelion, out to whichever of `maxRadiusAU` / `maxTrueAnomalyDeg` /
 *     the asymptote (ν_∞ = acos(−1/e)) is tightest, and returned `closed: false`.
 *     These orbits are OPEN — the body enters the inner system once and leaves
 *     forever — so the path is an ARC, never a loop. Documented in `note`.
 *
 * Each point carries both the compressed scene (x, z) — via {@link compressRadius}
 * with the same options the orrery uses, so the body's dot lies ON the line — and
 * the true AU projection (xAU, zAU) for a to-scale rendering. Scene mapping
 * matches the sibling orreries: x = r·cos λ, z = −r·sin λ.
 *
 * Returns null if e or q cannot be derived from the elements.
 */
export function orbitPath(
  elements: SmallBodyElements,
  opts: OrbitPathOptions = {}
): OrbitPath | null {
  const res = resolveElements(elements);
  if (!res) return null;

  const mode = opts.mode ?? "log";
  const samples = Math.max(2, Math.floor(opts.samples ?? 256));
  const regime = Math.abs(res.e - 1) < PARABOLIC_BAND
    ? "parabolic"
    : res.e < 1
      ? "elliptical"
      : "hyperbolic";
  const closed = regime === "elliptical";

  // Determine the true-anomaly sweep.
  let nuStart: number;
  let nuEnd: number;
  if (closed) {
    nuStart = 0;
    nuEnd = 2 * Math.PI;
  } else {
    // Asymptote true anomaly: cos ν_∞ = −1/e (parabola ⇒ ±180°). Stay short of it.
    const nuInf = res.e > 1 ? Math.acos(-1 / res.e) : Math.PI;
    let nuLim = nuInf * 0.999;
    // Tighten to the radius cap: solve r = R for cos ν.
    const maxR = isNum(opts.maxRadiusAU) ? opts.maxRadiusAU : 50;
    if (maxR > res.q) {
      const cosNu = ((res.q * (1 + res.e)) / maxR - 1) / res.e;
      if (cosNu > -1 && cosNu < 1) nuLim = Math.min(nuLim, Math.acos(cosNu));
    }
    // Tighten to an optional hard ν cap.
    if (isNum(opts.maxTrueAnomalyDeg))
      nuLim = Math.min(nuLim, Math.abs(opts.maxTrueAnomalyDeg) * DEG2RAD);
    nuStart = -nuLim;
    nuEnd = nuLim;
  }

  // A closed loop uses `samples` points spanning [0, 2π) WITHOUT repeating the
  // seam (divisor = samples); an open arc uses `samples` points spanning the full
  // [nuStart, nuEnd] inclusive (divisor = samples − 1).
  const points: OrbitPathPoint[] = [];
  const divisor = closed ? samples : samples - 1;
  for (let k = 0; k < samples; k++) {
    const t = k / divisor;
    const nu = nuStart + (nuEnd - nuStart) * t;
    const pos = positionAtTrueAnomaly(res, nu);
    const lam = pos.longitudeDeg * DEG2RAD;
    const sceneR = compressRadius(pos.distanceAU, opts);
    points.push({
      x: sceneR * Math.cos(lam),
      z: -sceneR * Math.sin(lam),
      xAU: pos.distanceAU * Math.cos(lam),
      zAU: -pos.distanceAU * Math.sin(lam),
      distanceAU: pos.distanceAU,
      trueAnomalyDeg: pos.trueAnomalyDeg,
    });
  }

  const compNote =
    mode === "linear"
      ? "radial distances to scale"
      : `radial distances ${mode}-compressed for visibility`;
  const note = closed
    ? `Closed elliptical orbit sampled over one full revolution (${compNote}).`
    : `Open ${regime} trajectory — drawn as a bounded arc through the inner system, not a closed loop (the body enters once and never returns; ${compNote}).`;

  return { points, closed, regime, mode, note };
}

// ─────────────────────────────── Orrery ─────────────────────────────────────

export interface OrreryBody {
  name?: string;
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
  /** number of input bodies that could not be placed (insufficient elements) */
  omitted: number;
  /** human-readable honesty string for the UI */
  note: string;
}

/**
 * Positions for a small-body orrery at `date`. For each body the ANGLE is its
 * real heliocentric ecliptic longitude; only the RADIUS is compressed (per
 * {@link compressRadius}) so a near-Earth asteroid at 1 AU and a comet aphelion
 * tens–thousands of AU out are visible together. The true AU distance is returned
 * for honest labels, and the scene mapping matches lib/planets.ts /
 * lib/dwarf-planets.ts orreryLayout (longitude 0 → +X, +90° → −Z), so all four
 * orreries share one frame:
 *
 *   x =  sceneRadius · cos(λ)
 *   z = −sceneRadius · sin(λ)
 *
 * Bodies whose elements are too sparse to place (or lack a time anchor) are
 * skipped and counted in `omitted` — never NaN, never thrown.
 */
export function orreryLayout(
  bodies: SmallBodyInput[],
  date: Date,
  opts: CompressionOptions = {}
): OrreryLayout {
  const mode = opts.mode ?? "log";
  const out: OrreryBody[] = [];
  let omitted = 0;
  for (const body of bodies) {
    const pos = heliocentricPosition(body.elements, date);
    if (!pos) {
      omitted++;
      continue;
    }
    const sceneRadius = compressRadius(pos.distanceAU, opts);
    const lam = pos.longitudeDeg * DEG2RAD;
    out.push({
      name: body.name,
      x: sceneRadius * Math.cos(lam),
      z: -sceneRadius * Math.sin(lam),
      sceneRadius,
      distanceAU: pos.distanceAU,
      longitudeDeg: pos.longitudeDeg,
    });
  }
  const note =
    mode === "linear"
      ? "Angular positions and radial distances are both to scale."
      : `Angular positions are real; radial distances ${mode}-compressed for visibility.`;
  return { bodies: out, mode, omitted, note };
}

// ─────────────────────────── HUD snapshot ───────────────────────────────────

export interface SmallBodyState {
  name?: string;
  /** heliocentric position at `date` (null if no time anchor / bad elements) */
  position: HeliocentricPosition | null;
  /** heliocentric distance [AU] (null if position unavailable) */
  distanceAU: number | null;
  /** distance in lunar distances (null if position unavailable) */
  distanceLD: number | null;
  /** orbit regime: elliptical / parabolic / hyperbolic */
  regime: OrbitRegime | null;
  /** bound (e < 1) */
  bound: boolean;
  /** interstellar/hyperbolic (e > 1) */
  interstellar: boolean;
  perihelionAU: number | null;
  /** aphelion [AU] — null for open orbits */
  aphelionAU: number | null;
  /** period [yr] — null for open orbits */
  periodYears: number | null;
  /** Tisserand parameter wrt Jupiter — null for open orbits */
  tisserandJupiter: number | null;
  /** near-Earth group, or null if not near-Earth / unbound */
  nea: NeaClass | null;
  /** comet dynamical class, or null if elements too sparse */
  comet: CometClassification | null;
  /** anti-sunward tail direction unit vector, or null if position unavailable */
  tailDirection: [number, number, number] | null;
  /** illustrative activity factor 0..1 (0 if far/unknown) */
  cometActivity: number;
}

/**
 * Everything a small-body HUD needs in one pure call (mirrors planetState /
 * dwarfState / exoPlanetDerived), tolerant of the partial elements real
 * catalogue rows carry. Deterministic: same inputs → same output.
 */
export function smallBodyState(
  elements: SmallBodyElements,
  date: Date,
  name?: string
): SmallBodyState {
  const position = heliocentricPosition(elements, date);
  const distanceAU = position?.distanceAU ?? null;
  return {
    name,
    position,
    distanceAU,
    distanceLD: distanceAU === null ? null : distanceAU / LUNAR_DISTANCE_AU,
    regime: orbitRegime(elements.e ?? resolveElements(elements)?.e),
    bound: isBound(elements.e ?? resolveElements(elements)?.e),
    interstellar: isInterstellar(elements.e ?? resolveElements(elements)?.e),
    perihelionAU: perihelionAU(elements),
    aphelionAU: aphelionAU(elements),
    periodYears: orbitalPeriodYears(elements),
    tisserandJupiter: tisserandParameter(elements),
    nea: neaClass(elements),
    comet: cometClass(elements),
    tailDirection: position ? tailDirection(position) : null,
    cometActivity: cometActivity(distanceAU),
  };
}
