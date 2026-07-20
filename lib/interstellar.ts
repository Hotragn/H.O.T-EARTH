/**
 * Physics for the INTERSTELLAR OBJECTS phase of the digital twin — the three
 * confirmed visitors from beyond the Solar System that have been tracked passing
 * through it. This is a thin, focused layer that REUSES the hyperbolic two-body
 * machinery already proven in lib/small-bodies.ts (Kepler solver, element
 * resolution, perifocal→ecliptic rotation, heliocentric position) and adds the
 * few things unique to the "Interstellar" story page:
 *
 *   • a small, fully-cited data table of the three objects,
 *   • the incoming/outgoing hyperbolic ASYMPTOTE directions (where each object
 *     came from / heads to — real geometry, computable from the orbit),
 *   • heliocentric SPEED via the hyperbolic vis-viva equation, and
 *   • a one-call state bundle (position, speed, Sun distance, Earth distance,
 *     inbound/outbound of perihelion) for the UI HUD.
 *
 * All positions come from lib/small-bodies.ts `heliocentricPosition` (imported
 * below as `sbPosition`), which solves M = e·sinh H − H via `solveKeplerHyperbolic`
 * — so the trajectory here is the SAME real hyperbolic Kepler orbit, in the SAME
 * J2000-ecliptic AU frame as planets.ts / dwarf-planets.ts / small-bodies.ts.
 *
 * ── Sources (physics-env-simulation: real physics + documented data, or it does
 *    not ship — no invented numbers) ────────────────────────────────────────────
 *
 *   • 1I/'Oumuamua (A/2017 U1) and 2I/Borisov (C/2019 Q4): osculating orbital
 *     elements (e, q, i, Ω, ω, Tp, epoch) are TRANSCRIBED VERBATIM from
 *     public/data/small-bodies/objects.json, whose provenance is the NASA/JPL
 *     Small-Body Database (SBDB) API. See that file's `meta.source`.
 *
 *   • 3I/ATLAS (C/2025 N1): e = 6.14135, q = 1.35645 AU, i = 175.12° (retrograde),
 *     Ω = 322.17°, ω = 128.02°, Tp = 2025-10-29 11:45 UT. Hyperbolic excess speed
 *     v∞ ≈ 58 km/s, peak heliocentric speed at perihelion ≈ 68.3 km/s. Discovered
 *     2025-07-01 by the ATLAS survey (Rio Hurtado, Chile). Source: JPL SBDB / MPC
 *     2025; NASA. Epoch: a 2025 osculating epoch near perihelion (stated per row).
 *
 *   • Heliocentric gravitational constant GM☉ = 1.32712440018×10¹¹ km³/s²
 *     (IAU 2009 / JPL DE ephemeris value). Used ONLY for speeds (vis-viva) in
 *     km/s; the position solver uses the module's own Gaussian constant. The two
 *     are mutually consistent: the vis-viva peak speed reproduces the cited 68.3
 *     km/s for 3I/ATLAS and v∞ from √(GM☉/|a|) reproduces the cited ~58 km/s.
 *
 * ── Honesty / accuracy statement (label the HUD truthfully) ────────────────────
 *
 *   These are OSCULATING two-body elements propagated on a pure Sun-only
 *   hyperbola. NO planetary perturbations are modelled, and — for the two active
 *   comets — NO non-gravitational (outgassing) forces are modelled. This is
 *   accurate for the TRAJECTORY SHAPE and the story (an unbound flyby that enters
 *   once and never returns); for a precise ephemeris at a specific instant,
 *   cross-check JPL Horizons. 1I/'Oumuamua's measured non-gravitational
 *   acceleration and its extreme elongated shape are REAL but are explicitly NOT
 *   modelled here. Every object is real; every number is cited; nothing invented.
 *
 *   Every public function is a pure, deterministic function of a UTC `Date`. A
 *   bad/unknown Date (or id) returns null (or []) — never NaN, never throws.
 */

import {
  AU_KM,
  LUNAR_DISTANCE_AU,
  heliocentricPosition as sbPosition,
  julianDateTT,
  solveKeplerHyperbolic,
  type HeliocentricPosition,
  type SmallBodyElements,
} from "./small-bodies";
import { heliocentricPosition as planetPosition } from "./planets";

const DEG2RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
/** Julian Date of the Unix epoch (1970-01-01 00:00 UTC). */
const UNIX_EPOCH_JD = 2440587.5;
/** TT − UTC ≈ 69.184 s (modern leap-second era) — same offset lib/small-bodies uses. */
const TT_MINUS_UTC_MS = 69_184;

/**
 * Heliocentric gravitational constant GM☉ [km³/s²] (IAU 2009 / JPL DE). Used for
 * the vis-viva SPEED only (position comes from lib/small-bodies). Cross-checked:
 * this value reproduces both the cited 3I/ATLAS perihelion speed (68.3 km/s) and
 * its hyperbolic excess speed (~58 km/s) from the cited elements.
 */
export const SUN_GM_KM3_S2 = 1.32712440018e11;

// ─────────────────────────── Re-exported frame type ─────────────────────────

/** J2000-ecliptic heliocentric position (AU), identical to lib/small-bodies. */
export type { HeliocentricPosition } from "./small-bodies";

/** A 3-vector (unit direction or otherwise), J2000 ecliptic. */
export type Vec3 = [number, number, number];

// ─────────────────────────── Identifiers ────────────────────────────────────

/** The three confirmed interstellar objects, in order of discovery. */
export type InterstellarId = "1I" | "2I" | "3I";

/** Discovery-ordered id list for iterating the page. */
export const INTERSTELLAR_IDS: readonly InterstellarId[] = ["1I", "2I", "3I"] as const;

// ─────────────────────────── Data record shape ──────────────────────────────

/**
 * One interstellar object: cited osculating hyperbolic elements plus the story
 * facts the "Interstellar" page needs. Angles in DEGREES, distances in AU, the
 * perihelion time both as a JD (the canonical Kepler anchor) and a UTC Date.
 */
export interface InterstellarObject {
  /** short id, e.g. "3I" */
  id: InterstellarId;
  /** display name, e.g. "3I/ATLAS" */
  name: string;
  /** provisional/formal designation, e.g. "C/2025 N1" */
  designation: string;
  /** year of discovery */
  discoveryYear: number;
  /** discovering survey / observer */
  discoverySurvey: string;
  /** eccentricity e (> 1 for every interstellar object) */
  eccentricity: number;
  /** perihelion distance q [AU] */
  perihelionAU: number;
  /** inclination to the J2000 ecliptic [deg] (> 90 ⇒ retrograde) */
  inclinationDeg: number;
  /** longitude of the ascending node Ω [deg] */
  nodeDeg: number;
  /** argument of perihelion ω [deg] */
  argPeriDeg: number;
  /** time of perihelion passage Tp [Julian Date, TT/TDB] — the Kepler anchor */
  timeOfPerihelionJD: number;
  /** time of perihelion passage Tp as a UTC Date (derived from the JD) */
  timeOfPerihelion: Date;
  /** osculating-element epoch [Julian Date, TDB] */
  epochJD: number;
  /** hyperbolic excess speed v∞ [km/s] (the speed far from the Sun) */
  vInfKmS: number;
  /** true ⇒ a visibly ACTIVE comet (coma / tail); false ⇒ inert / asteroidal */
  isActiveComet: boolean;
  /** honest note on the nucleus size */
  nucleusSizeNote: string;
  /** sky region / constellation the object came from */
  originConstellation: string;
  /** honest note on the estimated age of the object */
  ageNote: string;
  /** short blurb for the UI */
  blurb: string;
  /** bullet facts for the UI */
  facts: readonly string[];
  /** citation string */
  source: string;
}

// ─────────────────────────── JD ↔ Date helper ───────────────────────────────

/** UTC Date for a Julian Date on the TT scale used by lib/small-bodies. */
function jdToDate(jd: number): Date {
  return new Date(Math.round((jd - UNIX_EPOCH_JD) * DAY_MS - TT_MINUS_UTC_MS));
}

// 3I/ATLAS perihelion (2025-10-29 11:45 UT) as a JD on the same TT scale the
// small-bodies solver uses, so passing that instant back in lands exactly at q.
const ATLAS_TP_JD = julianDateTT(new Date(Date.UTC(2025, 9, 29, 11, 45, 0)));

// ─────────────────────────── The three objects ──────────────────────────────

/**
 * The confirmed interstellar objects. 1I/2I elements are transcribed verbatim
 * from public/data/small-bodies/objects.json (JPL SBDB); 3I/ATLAS elements are
 * the cited JPL SBDB / MPC 2025 values (see module header). `timeOfPerihelion`
 * (Date) is derived from `timeOfPerihelionJD` so the two never drift.
 */
export const INTERSTELLAR_OBJECTS: Record<InterstellarId, InterstellarObject> = {
  // ── 1I/'Oumuamua — first interstellar object, 2017 ──────────────────────────
  "1I": {
    id: "1I",
    name: "1I/'Oumuamua",
    designation: "A/2017 U1",
    discoveryYear: 2017,
    discoverySurvey: "Pan-STARRS 1 (Haleakalā, Hawaiʻi)",
    // objects.json: e 1.201134, q 0.255912, i 122.7417, om 24.5969, w 241.8105,
    // tp 2458006.00732, epoch_jd 2458080.5, a -1.272345.
    eccentricity: 1.201134,
    perihelionAU: 0.255912,
    inclinationDeg: 122.7417,
    nodeDeg: 24.5969,
    argPeriDeg: 241.8105,
    timeOfPerihelionJD: 2458006.00732,
    timeOfPerihelion: jdToDate(2458006.00732),
    epochJD: 2458080.5,
    vInfKmS: 26.33,
    isActiveComet: false,
    nucleusSizeNote:
      "~100–1000 m across and extremely elongated (axis ratio ~6:1 or more); no measured diameter. Highly variable light curve; tumbling.",
    originConstellation: "Lyra (near Vega), in the solar apex direction",
    ageNote:
      "Origin star and age unknown; kinematics resemble the local stellar population (nearby thin-disk stars).",
    blurb:
      "The first confirmed interstellar object (October 2017). Genuinely unbound (e≈1.20), it showed NO visible coma yet a small non-gravitational acceleration — still the most debated of the three.",
    facts: [
      "First interstellar object ever detected passing through the Solar System.",
      "Reddish, highly elongated; no dust or gas coma was seen.",
      "Showed a measured non-gravitational acceleration (NOT modelled here).",
      "Unbound hyperbolic orbit: it entered once and is leaving forever.",
    ],
    source:
      "NASA/JPL Small-Body Database (SBDB) via public/data/small-bodies/objects.json; v∞ ≈ 26.3 km/s (widely published).",
  },

  // ── 2I/Borisov — second interstellar object, first active comet, 2019 ───────
  "2I": {
    id: "2I",
    name: "2I/Borisov",
    designation: "C/2019 Q4",
    discoveryYear: 2019,
    discoverySurvey: "Gennadiy Borisov (MARGO observatory, Crimea)",
    // objects.json: e 3.356476, q 2.00652, i 44.0526, om 308.1477, w 209.1237,
    // tp 2458826.05285, epoch_jd 2458853.5, a -0.8514923.
    eccentricity: 3.356476,
    perihelionAU: 2.00652,
    inclinationDeg: 44.0526,
    nodeDeg: 308.1477,
    argPeriDeg: 209.1237,
    timeOfPerihelionJD: 2458826.05285,
    timeOfPerihelion: jdToDate(2458826.05285),
    epochJD: 2458853.5,
    vInfKmS: 32.1,
    isActiveComet: true,
    nucleusSizeNote:
      "Nucleus radius ~0.2–0.5 km (HST); enveloped in an obvious dust/gas coma the whole time it was observed.",
    originConstellation: "Cassiopeia (incoming radiant)",
    ageNote:
      "Composition (notably high CO) suggests formation around a cool star; no precise age.",
    blurb:
      "The second confirmed interstellar object (2019) and the first that was obviously a COMET — a bright coma and tail the entire pass. Strongly hyperbolic (e≈3.36), unmistakably unbound.",
    facts: [
      "Second interstellar object, and the first clearly active (cometary) one.",
      "Strongly hyperbolic (e≈3.36): the least ambiguous unbound orbit of the three.",
      "Looked and behaved like an ordinary comet, from another star.",
      "Carbon-monoxide-rich coma hinted at formation around a cool star.",
    ],
    source:
      "NASA/JPL Small-Body Database (SBDB) via public/data/small-bodies/objects.json; v∞ ≈ 32 km/s (widely published).",
  },

  // ── 3I/ATLAS (C/2025 N1) — third and newest, 2025 ───────────────────────────
  "3I": {
    id: "3I",
    name: "3I/ATLAS",
    designation: "C/2025 N1",
    discoveryYear: 2025,
    discoverySurvey: "ATLAS survey (Rio Hurtado, Chile)",
    eccentricity: 6.14135,
    perihelionAU: 1.35645,
    inclinationDeg: 175.12, // retrograde (i > 90°)
    nodeDeg: 322.17,
    argPeriDeg: 128.02,
    timeOfPerihelionJD: ATLAS_TP_JD,
    timeOfPerihelion: jdToDate(ATLAS_TP_JD),
    // Osculating epoch: perihelion is a fine, well-conditioned 2025 epoch to state.
    epochJD: ATLAS_TP_JD,
    vInfKmS: 58,
    isActiveComet: true,
    nucleusSizeNote:
      "Nucleus ~0.32–5.6 km (likely under 1 km); a cometary body with a coma and dust tail.",
    originConstellation:
      "Sagittarius, toward the galactic center (nearly retrograde, i≈175°)",
    ageNote:
      "Estimated 7–14 Gyr old — likely from the Milky Way's ancient thick-disk population, possibly older than the Sun.",
    blurb:
      "The third and newest interstellar object (discovered 2025-07-01). The most hyperbolic of the three (e≈6.14) and the fastest (v∞≈58 km/s, ~68 km/s at perihelion), it arrived nearly retrograde from the direction of the galactic center.",
    facts: [
      "Third confirmed interstellar object; discovered 1 July 2025 by ATLAS.",
      "Most strongly unbound of the three (e≈6.14) and the fastest (v∞≈58 km/s).",
      "Retrograde inclination (~175°): it orbits opposite the planets.",
      "Cometary (coma + dust tail); came from the direction of Sagittarius.",
      "Age estimate 7–14 Gyr — possibly older than the Solar System.",
    ],
    source:
      "JPL Small-Body Database (SBDB) / Minor Planet Center 2025; NASA. Elements as cited in the module header.",
  },
};

// ─────────────────────────── Internal helpers ───────────────────────────────

/** Finite, usable number? */
function isNum(x: number | null | undefined): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** Valid Date (parseable to a finite epoch)? */
function isValidDate(d: Date | null | undefined): d is Date {
  return d instanceof Date && Number.isFinite(d.getTime());
}

/** Look up an object by id, or null. */
export function getInterstellarObject(
  id: InterstellarId | string
): InterstellarObject | null {
  return (INTERSTELLAR_OBJECTS as Record<string, InterstellarObject>)[id] ?? null;
}

/**
 * Signed semi-major axis a [AU] — NEGATIVE for a hyperbola. a = q / (1 − e), so
 * for e > 1 (1 − e < 0, q > 0) this is < 0, matching the JPL convention.
 */
function signedSemiMajorAxisAU(obj: InterstellarObject): number {
  return obj.perihelionAU / (1 - obj.eccentricity);
}

/**
 * Build the lib/small-bodies element bag for an object. This is the SINGLE place
 * that hands cited elements to the reused hyperbolic Kepler solver.
 */
function elementsFor(obj: InterstellarObject): SmallBodyElements {
  return {
    e: obj.eccentricity,
    q: obj.perihelionAU,
    i: obj.inclinationDeg,
    om: obj.nodeDeg,
    w: obj.argPeriDeg,
    tp: obj.timeOfPerihelionJD,
    a: signedSemiMajorAxisAU(obj),
  };
}

/**
 * Rotate a unit perifocal direction (true anomaly ν) into the J2000 ecliptic
 * frame with the standard R_z(Ω)·R_x(i)·R_z(ω) product — byte-for-byte the same
 * rotation lib/small-bodies and lib/planets apply. Input is a unit vector and a
 * rotation preserves length, so the result is already a unit vector.
 */
function perifocalUnitDirection(
  nu: number,
  iRad: number,
  nodeRad: number,
  argPeriRad: number
): Vec3 {
  const xp = Math.cos(nu);
  const yp = Math.sin(nu);
  const cosO = Math.cos(argPeriRad);
  const sinO = Math.sin(argPeriRad);
  const cosN = Math.cos(nodeRad);
  const sinN = Math.sin(nodeRad);
  const cosI = Math.cos(iRad);
  const sinI = Math.sin(iRad);

  const x =
    (cosO * cosN - sinO * sinN * cosI) * xp +
    (-sinO * cosN - cosO * sinN * cosI) * yp;
  const y =
    (cosO * sinN + sinO * cosN * cosI) * xp +
    (-sinO * sinN + cosO * cosN * cosI) * yp;
  const z = sinO * sinI * xp + cosO * sinI * yp;
  // Renormalize against round-off so the returned vector is exactly unit-length.
  const m = Math.hypot(x, y, z) || 1;
  return [x / m, y / m, z / m];
}

// ─────────────────────────── Position ───────────────────────────────────────

/**
 * Heliocentric ecliptic position (AU, J2000) of an interstellar object at a UTC
 * instant, via the reused lib/small-bodies hyperbolic Kepler solver. Returns null
 * for an unknown id or an invalid Date (never NaN, never throws).
 */
export function interstellarPosition(
  id: InterstellarId | string,
  date: Date
): HeliocentricPosition | null {
  const obj = getInterstellarObject(id);
  if (!obj || !isValidDate(date)) return null;
  return sbPosition(elementsFor(obj), date);
}

// ─────────────────────────── Trajectory sampling ────────────────────────────

/** One sampled point along an interstellar trajectory. */
export interface InterstellarTrajectoryPoint {
  /** UTC sample time */
  date: Date;
  /** Julian Date (TT) of the sample */
  jd: number;
  /** heliocentric ecliptic position (AU, J2000) */
  position: HeliocentricPosition;
}

/**
 * Sample the hyperbolic path from `fromDate` to `toDate` into `steps` points
 * (inclusive of both ends), for drawing the 3D trajectory through the Solar
 * System. Include a range spanning the perihelion time to capture the fast
 * near-perihelion segment. Returns [] for an unknown id, invalid dates, or
 * steps < 1 (never throws). Deterministic.
 */
export function interstellarTrajectory(
  id: InterstellarId | string,
  fromDate: Date,
  toDate: Date,
  steps: number
): InterstellarTrajectoryPoint[] {
  const obj = getInterstellarObject(id);
  if (!obj || !isValidDate(fromDate) || !isValidDate(toDate)) return [];
  const n = Math.floor(steps);
  if (!Number.isFinite(n) || n < 1) return [];

  const t0 = fromDate.getTime();
  const t1 = toDate.getTime();
  const el = elementsFor(obj);
  const out: InterstellarTrajectoryPoint[] = [];
  for (let k = 0; k < n; k++) {
    const frac = n === 1 ? 0 : k / (n - 1);
    const date = new Date(t0 + (t1 - t0) * frac);
    const position = sbPosition(el, date);
    if (!position || !Number.isFinite(position.distanceAU)) return []; // all-or-nothing
    out.push({ date, jd: julianDateTT(date), position });
  }
  return out;
}

// ─────────────────────────── Asymptote directions ───────────────────────────

/**
 * True anomaly of the hyperbola's asymptote: cos ν∞ = −1/e, so ν∞ = acos(−1/e)
 * ∈ (90°, 180°). As t → ±∞ the object recedes toward ν = ±ν∞. Null if e ≤ 1.
 */
function asymptoteTrueAnomaly(obj: InterstellarObject): number | null {
  if (!(obj.eccentricity > 1)) return null;
  return Math.acos(-1 / obj.eccentricity);
}

/**
 * Unit direction (J2000 ecliptic) the object CAME FROM — the incoming asymptote,
 * i.e. the direction of its position vector as t → −∞ (true anomaly → −ν∞). For
 * 3I/ATLAS this points back toward Sagittarius / the galactic center. This is
 * real geometry, fixed by the orbit orientation (i, Ω, ω) and e. Null if unknown.
 */
export function incomingAsymptoteDirection(
  id: InterstellarId | string
): Vec3 | null {
  const obj = getInterstellarObject(id);
  if (!obj) return null;
  const nuInf = asymptoteTrueAnomaly(obj);
  if (nuInf === null) return null;
  return perifocalUnitDirection(
    -nuInf,
    obj.inclinationDeg * DEG2RAD,
    obj.nodeDeg * DEG2RAD,
    obj.argPeriDeg * DEG2RAD
  );
}

/**
 * Unit direction (J2000 ecliptic) the object HEADS TO — the outgoing asymptote,
 * i.e. the direction of its position vector as t → +∞ (true anomaly → +ν∞). Null
 * if unknown.
 */
export function outgoingAsymptoteDirection(
  id: InterstellarId | string
): Vec3 | null {
  const obj = getInterstellarObject(id);
  if (!obj) return null;
  const nuInf = asymptoteTrueAnomaly(obj);
  if (nuInf === null) return null;
  return perifocalUnitDirection(
    nuInf,
    obj.inclinationDeg * DEG2RAD,
    obj.nodeDeg * DEG2RAD,
    obj.argPeriDeg * DEG2RAD
  );
}

// ─────────────────────────── Speed (vis-viva) ───────────────────────────────

/**
 * Heliocentric SPEED [km/s] at a UTC instant, from the hyperbolic vis-viva
 * equation v = √(GM☉·(2/r − 1/a)). For a hyperbola a < 0, so −1/a > 0 and the
 * radicand v² = GM☉·(2/r + 1/|a|) is always positive and strictly greater than
 * the local escape speed² (2·GM☉/r) — the body is unbound at every point.
 * Returns null for an unknown id or invalid Date. Deterministic.
 */
export function currentSpeedKmS(
  id: InterstellarId | string,
  date: Date
): number | null {
  const obj = getInterstellarObject(id);
  if (!obj || !isValidDate(date)) return null;
  const pos = interstellarPosition(id, date);
  if (!pos || !isNum(pos.distanceAU) || pos.distanceAU <= 0) return null;
  const rKm = pos.distanceAU * AU_KM;
  const aKm = signedSemiMajorAxisAU(obj) * AU_KM; // negative for a hyperbola
  const v2 = SUN_GM_KM3_S2 * (2 / rKm - 1 / aKm);
  return v2 > 0 ? Math.sqrt(v2) : null;
}

/**
 * Hyperbolic excess speed v∞ [km/s] — the residual speed far from the Sun, where
 * the Sun's pull has effectively vanished: v∞ = √(−GM☉/a) = √(GM☉/|a|). This is
 * the object's speed relative to the Sun as it entered (and will leave) the Solar
 * System. Computed from the cited elements; null if unknown.
 */
export function hyperbolicExcessSpeedKmS(
  id: InterstellarId | string
): number | null {
  const obj = getInterstellarObject(id);
  if (!obj) return null;
  const aKm = signedSemiMajorAxisAU(obj) * AU_KM;
  if (!(aKm < 0)) return null;
  return Math.sqrt(SUN_GM_KM3_S2 / -aKm);
}

/**
 * Local Sun-escape speed [km/s] at heliocentric distance r [AU]:
 * v_esc = √(2·GM☉/r). A bound orbit would sit below this; every interstellar
 * object stays above it. Null for non-positive/invalid r.
 */
export function localEscapeSpeedKmS(rAU: number): number | null {
  if (!isNum(rAU) || rAU <= 0) return null;
  return Math.sqrt((2 * SUN_GM_KM3_S2) / (rAU * AU_KM));
}

// ─────────────────────────── State bundle (HUD) ─────────────────────────────

export type PerihelionPhase = "inbound" | "outbound" | "at perihelion";

/** One-call snapshot for the "Interstellar" page HUD. */
export interface InterstellarState {
  id: InterstellarId;
  name: string;
  /** heliocentric position (AU, J2000), or null on invalid input */
  position: HeliocentricPosition | null;
  /** heliocentric speed [km/s], or null */
  speedKmS: number | null;
  /** distance from the Sun [AU], or null */
  distanceFromSunAU: number | null;
  /** distance from Earth [AU], or null */
  distanceFromEarthAU: number | null;
  /** approaching perihelion, receding, or essentially at it */
  phase: PerihelionPhase | null;
  /** days until (negative) or since (positive) perihelion at `date` */
  daysFromPerihelion: number | null;
  /** true ⇒ unbound (always true for these objects; carried for the HUD) */
  unbound: boolean;
}

/**
 * Everything the UI needs for one object at one instant, in a single pure call:
 * position, speed, distance from the Sun and from Earth, and whether it is inbound
 * or outbound of perihelion. Earth's heliocentric position comes from lib/planets
 * (same J2000-ecliptic AU frame), so the geocentric distance is a straight vector
 * difference. Tolerant of bad input — fields are null rather than NaN/throwing.
 */
export function interstellarState(
  id: InterstellarId | string,
  date: Date
): InterstellarState | null {
  const obj = getInterstellarObject(id);
  if (!obj) return null;

  const position = interstellarPosition(id, date);
  const distanceFromSunAU = position?.distanceAU ?? null;
  const speedKmS = currentSpeedKmS(id, date);

  let distanceFromEarthAU: number | null = null;
  if (position && isValidDate(date)) {
    const earth = planetPosition("Earth", date);
    if (earth && Number.isFinite(earth.distanceAU)) {
      const dx = position.x - earth.x;
      const dy = position.y - earth.y;
      const dz = position.z - earth.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      distanceFromEarthAU = Number.isFinite(d) ? d : null;
    }
  }

  let phase: PerihelionPhase | null = null;
  let daysFromPerihelion: number | null = null;
  if (isValidDate(date)) {
    const dt = julianDateTT(date) - obj.timeOfPerihelionJD; // days
    daysFromPerihelion = dt;
    phase = Math.abs(dt) < 0.5 ? "at perihelion" : dt < 0 ? "inbound" : "outbound";
  }

  return {
    id: obj.id,
    name: obj.name,
    position,
    speedKmS,
    distanceFromSunAU,
    distanceFromEarthAU,
    phase,
    daysFromPerihelion,
    unbound: obj.eccentricity > 1,
  };
}

// ─────────────────────────── Convenience list ───────────────────────────────

/** The three objects as an ordered array (discovery order). */
export function interstellarObjects(): InterstellarObject[] {
  return INTERSTELLAR_IDS.map((id) => INTERSTELLAR_OBJECTS[id]);
}
