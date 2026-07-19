/**
 * Celestial-coordinate physics for the "Night Sky" star-map tab of the digital
 * twin. This is the star-map analogue of lib/solar.ts (Earth solar geometry),
 * lib/planets.ts (heliocentric orbits) and lib/geo.ts (lat/lon ↔ 3D): every
 * public function is a pure, deterministic function of its inputs, so it
 * unit-tests cleanly (lib/celestial.test.ts) and the react-three-fiber frontend
 * can consume it directly.
 *
 * It turns a catalogue star — right ascension (RA), declination (Dec), apparent
 * magnitude and B−V colour index (the columns another agent writes into
 * public/data/night-sky/stars.json) — into:
 *   • a 3D point on the celestial sphere (for the star field mesh),
 *   • a physically-grounded RGB colour (from the star's B−V → temperature),
 *   • a render size / opacity (from the logarithmic magnitude scale), and
 *   • an honest "is it above the horizon from here, right now?" alt/az, using
 *     real local-sidereal-time astronomy.
 *
 * ── Sources (physics-env-simulation skill: real physics, documented, or it
 *    doesn't ship — no invented numbers) ─────────────────────────────────────
 *   • J. Meeus, *Astronomical Algorithms*, 2nd ed. — GMST (Ch. 12, eq. 12.4),
 *     equatorial ↔ horizontal transform (Ch. 13, eq. 13.5/13.6). Worked
 *     examples 12.a and 13.b are validated in the test file.
 *   • USNO / IAU: sidereal time is a function of UT1 (we use UTC ≈ UT1; |DUT1| <
 *     0.9 s ⇒ < 0.004° of sky, negligible for a star map).
 *   • F. J. Ballesteros (2012), "New insights into black bodies", EPL 97 34008
 *     — the B−V → effective-temperature relation used in {@link bvToTemperatureK}.
 *   • Blackbody-colour (temperature → sRGB) piecewise fit: T. Helland's widely
 *     used approximation of the Planckian locus, itself fitted to the CIE 1964
 *     10° colour-matching data (hot ⇒ blue O/B, ~5800 K ⇒ yellow-white G/Sun,
 *     cool ⇒ red M).
 *   • N. Pogson (1856): a 5-magnitude difference is exactly a flux ratio of 100,
 *     i.e. flux ∝ 10^(−0.4·mag) — see {@link relativeBrightness}.
 *
 * ── Coordinate convention & handedness (READ THIS, frontend must match) ──────
 *
 * RA/Dec map onto the SAME Earth-fixed frame and handedness as lib/geo.ts, with
 * RA playing the role of longitude and Dec the role of latitude:
 *
 *   raDecToVector3(raDeg, decDeg, r)  ≡  latLonToVector3(decDeg, raDeg, r)
 *
 *   so   x =  r·cos(dec)·cos(ra)
 *        y =  r·sin(dec)
 *        z = −r·cos(dec)·sin(ra)
 *
 *   RA   0h  (=0°)   → +X          Dec +90° (N. celestial pole) → +Y
 *   RA   6h  (=90°)  → −Z          Dec −90° (S. celestial pole) → −Y
 *   RA  18h  (=270°) → +Z
 *
 * We deliberately reuse lib/geo's {@link latLonToVector3} so the handedness
 * lives in exactly one place in the codebase. The frontend renders the star
 * field on the INSIDE of this sphere with the observer at the centre (radius is
 * a large scene distance, see {@link CONSTELLATION_SPHERE_RADIUS}); because the
 * camera looks outward from the origin, the sky reads correctly without any
 * extra mirroring. This is the J2000 equatorial frame — the same frame the star
 * catalogue's RA/Dec are given in — so no rotation is applied here; the (very
 * slow) precession of that frame is handled separately in lib/precession.ts.
 */

import { latLonToVector3, vector3ToLatLon } from "./geo";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const DAY_MS = 86_400_000;

/** Julian Date of the J2000.0 epoch (2000-01-01 12:00 TT). */
const J2000_JD = 2_451_545.0;
/** Julian Date of the Unix epoch, 1970-01-01T00:00:00Z. */
const UNIX_EPOCH_JD = 2_440_587.5;
/** Days in a Julian century. */
const JULIAN_CENTURY_DAYS = 36_525;

// ───────────────────────────── null-safety guards ──────────────────────────
// Contract: bad numeric/date input yields null (or a documented neutral), never
// a throw — the renderer must survive a malformed catalogue row. Mirrors the
// finite()/isValidDate() guards in lib/sun.ts.

function finite(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function isValidDate(date: unknown): date is Date {
  return date instanceof Date && Number.isFinite(date.getTime());
}

/** Clamp to [lo, hi]. */
function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

/** Normalize an angle to [0, 360). */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// ─────────────────────────────── 0. unit helpers ───────────────────────────

/**
 * Right ascension in HOURS → DEGREES. RA is conventionally tabulated in hours
 * (0h…24h) because the sky turns 360° in 24 sidereal hours, so 1h = 15°.
 * The star catalogue may carry RA in either unit; multiply hours by 15 to get
 * degrees (`ra * 15 = degrees`). The inverse is {@link raDegToHours}.
 */
export function raHoursToDeg(hours: number): number {
  return hours * 15;
}

/** Right ascension in DEGREES → HOURS (inverse of {@link raHoursToDeg}). */
export function raDegToHours(deg: number): number {
  return deg / 15;
}

/**
 * Parsecs → light-years. 1 pc = 3.26156 ly (a parsec is the distance at which
 * 1 AU subtends 1 arcsecond: 648000/π AU ≈ 3.0857e13 km ≈ 3.26156 ly). Used for
 * honest distance labels in the star HUD.
 */
export function pcToLightYears(pc: number): number {
  return pc * 3.26156;
}

/** Light-years → parsecs (inverse of {@link pcToLightYears}). */
export function lightYearsToPc(ly: number): number {
  return ly / 3.26156;
}

/**
 * Default scene radius for the celestial sphere. The star field is a single
 * large sphere far outside every planet/globe in the scene, with the observer
 * (camera) at the origin looking OUT; stars are painted on its inner surface.
 * Distances between stars are astronomically incommensurable with a globe
 * scene, so we do NOT place stars at true distance — RA/Dec fix only the
 * DIRECTION, and every star sits on this common sphere (the "celestial sphere"
 * abstraction). True distance is carried separately for labels only
 * (see {@link pcToLightYears}). Any positive radius works; 1 keeps the math in
 * unit vectors, and the frontend scales the whole group.
 */
export const CONSTELLATION_SPHERE_RADIUS = 1;

// ───────────────────────── 1. celestial-sphere position ────────────────────

/** A right-ascension / declination pair, both in degrees. */
export interface RaDec {
  /** right ascension [deg, 0–360) — hours × 15 */
  raDeg: number;
  /** declination [deg, −90…+90] */
  decDeg: number;
}

/**
 * A star's direction on the celestial sphere as a 3D point [x, y, z] at the
 * given radius, in the J2000 equatorial frame (see the module header for the
 * full convention). Implemented by delegating to lib/geo's
 * {@link latLonToVector3} with Dec as latitude and RA as longitude, so the
 * handedness is identical to the globe and lives in exactly one place:
 *
 *   x =  r·cos(dec)·cos(ra),  y = r·sin(dec),  z = −r·cos(dec)·sin(ra)
 *
 * The N. celestial pole (dec = +90°) maps to +Y and RA = 0h, Dec = 0° to +X.
 */
export function raDecToVector3(
  raDeg: number,
  decDeg: number,
  radius = CONSTELLATION_SPHERE_RADIUS
): [number, number, number] {
  return latLonToVector3(decDeg, raDeg, radius);
}

/**
 * Inverse of {@link raDecToVector3}: a point in the equatorial frame → RA/Dec
 * in degrees, with RA normalized to [0, 360). Delegates to lib/geo's
 * {@link vector3ToLatLon} so the two conventions can never drift apart.
 */
export function vector3ToRaDec(x: number, y: number, z: number): RaDec {
  const { lat, lon } = vector3ToLatLon(x, y, z);
  return { raDeg: norm360(lon), decDeg: lat };
}

// ─────────────────────── 2. star colour from B−V index ─────────────────────

/**
 * Stellar effective temperature [K] from the Johnson B−V colour index, via
 * Ballesteros (2012), EPL 97 34008:
 *
 *   T = 4600 · ( 1/(0.92·(B−V) + 1.7) + 1/(0.92·(B−V) + 0.62) )   [kelvin]
 *
 * This treats the star as a black body radiating in the B and V bands; it
 * reproduces the main sequence well (Sun B−V≈0.63 → ~5850 K, Vega ≈0.0 →
 * ~10100 K, an M-giant ≈1.85 → ~3300 K). A null / non-finite B−V (missing
 * catalogue value) returns null — callers treat that as "unknown colour".
 */
export function bvToTemperatureK(bv: number | null | undefined): number | null {
  if (!finite(bv)) return null;
  return (
    4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62))
  );
}

/**
 * Approximate sRGB colour of a black body at temperature `tempK`, as 0–255
 * integer channels. Piecewise fit to the Planckian locus (T. Helland's
 * approximation of the CIE blackbody colours), clamped to the fit's valid range
 * [1000 K, 40000 K]. Hot stars come out blue-white, ~5800 K yellow-white, cool
 * stars orange-red — the real physical trend. Returns null for non-finite input.
 */
export function temperatureToRgb(
  tempK: number | null | undefined
): [number, number, number] | null {
  if (!finite(tempK)) return null;
  const t = clamp(tempK, 1000, 40000) / 100;

  let r: number;
  let g: number;
  let b: number;

  // Red channel.
  if (t <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
  }

  // Green channel.
  if (t <= 66) {
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
  } else {
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  }

  // Blue channel.
  if (t >= 66) {
    b = 255;
  } else if (t <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  }

  return [
    Math.round(clamp(r, 0, 255)),
    Math.round(clamp(g, 0, 255)),
    Math.round(clamp(b, 0, 255)),
  ];
}

/**
 * A star's colour as 0–255 RGB channels, from its B−V index:
 * B−V → temperature (Ballesteros) → blackbody sRGB (Helland). A null / missing
 * B−V returns a neutral white [255, 255, 255] so the star still renders.
 */
export function bvToRgb(
  bv: number | null | undefined
): [number, number, number] {
  const t = bvToTemperatureK(bv);
  if (t === null) return [255, 255, 255];
  return temperatureToRgb(t) ?? [255, 255, 255];
}

/** Format an 0–255 RGB triple as a `#rrggbb` hex string. */
function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * A star's colour as a `#rrggbb` hex string, from its B−V index (the physical
 * mapping documented on {@link bvToTemperatureK} / {@link temperatureToRgb}).
 * Null / missing B−V → neutral white "#ffffff". This is a real physical colour,
 * not an arbitrary palette: hot blue O/B stars, sun-like yellow-white G stars,
 * cool red M stars.
 */
export function bvToColor(bv: number | null | undefined): string {
  const [r, g, b] = bvToRgb(bv);
  return rgbToHex(r, g, b);
}

// ───────────────────── 3. magnitude → render size / brightness ─────────────

export interface MagnitudeSizeOptions {
  /** magnitude of the BRIGHTEST star to render (maps to maxSize). Default −1.5 (Sirius). */
  brightestMag?: number;
  /** faint naked-eye limit (maps to minSize). Default 6.5. */
  limitMag?: number;
  /** point size at the faint limit. Default 0.6. */
  minSize?: number;
  /** point size for the brightest star. Default 3. */
  maxSize?: number;
}

/**
 * Map an apparent magnitude to a renderer point size. Apparent magnitude is
 * INVERTED and LOGARITHMIC: smaller = brighter (Sirius ≈ −1.46, the naked-eye
 * limit ≈ +6.5). We use the simple, well-behaved linear-in-magnitude ramp
 *
 *   size = minSize + (limitMag − mag)/(limitMag − brightestMag) · (maxSize − minSize)
 *
 * clamped to [minSize, maxSize]. Because each magnitude step is already a fixed
 * FLUX ratio (Pogson, 2.512×), a linear-in-magnitude size ramp is a perceptually
 * even, physically-motivated scaling — and it never lets a faint star collapse
 * to zero or a bright one blow up. For the true flux ratio use
 * {@link relativeBrightness}. Non-finite magnitude → null (never throws).
 */
export function magnitudeToSize(
  mag: number | null | undefined,
  opts: MagnitudeSizeOptions = {}
): number | null {
  if (!finite(mag)) return null;
  const brightestMag = opts.brightestMag ?? -1.5;
  const limitMag = opts.limitMag ?? 6.5;
  const minSize = opts.minSize ?? 0.6;
  const maxSize = opts.maxSize ?? 3;
  const span = limitMag - brightestMag || 1;
  const t = clamp((limitMag - mag) / span, 0, 1);
  return minSize + t * (maxSize - minSize);
}

export interface MagnitudeOpacityOptions {
  /** magnitude at/above which opacity is `maxOpacity`. Default −1.5. */
  brightestMag?: number;
  /** faint limit, at which opacity is `minOpacity`. Default 6.5. */
  limitMag?: number;
  /** opacity of the faintest rendered star. Default 0.35. */
  minOpacity?: number;
  /** opacity of the brightest star. Default 1. */
  maxOpacity?: number;
}

/**
 * Map an apparent magnitude to a render opacity in [minOpacity, maxOpacity],
 * brighter = more opaque, using the same linear-in-magnitude ramp and rationale
 * as {@link magnitudeToSize}. Keeping faint stars at a floor opacity (rather
 * than the true flux ratio, which spans ~2500× over −1.5…6.5) keeps the whole
 * naked-eye sky visible. Non-finite magnitude → null.
 */
export function magnitudeToOpacity(
  mag: number | null | undefined,
  opts: MagnitudeOpacityOptions = {}
): number | null {
  if (!finite(mag)) return null;
  const brightestMag = opts.brightestMag ?? -1.5;
  const limitMag = opts.limitMag ?? 6.5;
  const minOpacity = opts.minOpacity ?? 0.35;
  const maxOpacity = opts.maxOpacity ?? 1;
  const span = limitMag - brightestMag || 1;
  const t = clamp((limitMag - mag) / span, 0, 1);
  return minOpacity + t * (maxOpacity - minOpacity);
}

/**
 * TRUE relative brightness (linear flux ratio) of a star of magnitude `mag`
 * versus a reference magnitude, from Pogson's law:  flux ∝ 10^(−0.4·Δmag), so a
 * 5-magnitude difference is exactly a factor of 100. Provided for honest
 * physical use (e.g. HDR bloom); the size/opacity ramps above intentionally do
 * NOT use this because its dynamic range is too large for point rendering.
 * Non-finite magnitude → null.
 */
export function relativeBrightness(
  mag: number | null | undefined,
  refMag = 0
): number | null {
  if (!finite(mag) || !finite(refMag)) return null;
  return Math.pow(10, -0.4 * (mag - refMag));
}

// ─────────────────────────── 4. time / sidereal time ───────────────────────

/**
 * Julian Date of a UTC instant. Unix epoch 1970-01-01T00:00Z = JD 2440587.5.
 * For sidereal time we intentionally use UTC as a stand-in for UT1 (no ΔT / TT
 * correction): sidereal time is defined against UT1, and |UT1 − UTC| < 0.9 s
 * ⇒ < 0.004° of sky rotation, far below star-map resolution. (Contrast the
 * dynamical-time modules lib/planets.ts / lib/lunar.ts, which DO add ΔT because
 * they track orbital motion in TT.)
 */
export function julianDate(date: Date): number {
  return date.getTime() / DAY_MS + UNIX_EPOCH_JD;
}

/** Julian centuries of UT since J2000.0 (T = (JD − 2451545)/36525). */
export function julianCenturiesJ2000(date: Date): number {
  return (julianDate(date) - J2000_JD) / JULIAN_CENTURY_DAYS;
}

/**
 * Greenwich Mean Sidereal Time in DEGREES [0, 360) for a UTC instant, from
 * Meeus *Astronomical Algorithms* eq. 12.4:
 *
 *   θ₀ = 280.46061837 + 360.98564736629·(JD − 2451545.0)
 *        + 0.000387933·T² − T³/38710000        (degrees, then mod 360)
 *
 * where JD is the Julian Date (UT) and T its Julian centuries since J2000. This
 * is valid at ANY instant (not just 0h UT). Validated against Meeus example
 * 12.a (1987-04-10 0h UT → 197.693195°) in the test file. This is MEAN sidereal
 * time; the nutation-driven equation of the equinoxes (< 1.2 s of time) is
 * omitted — negligible for pointing a star field. Returns null on bad input.
 */
export function greenwichMeanSiderealTimeDeg(date: Date): number | null {
  if (!isValidDate(date)) return null;
  const jd = julianDate(date);
  const T = (jd - J2000_JD) / JULIAN_CENTURY_DAYS;
  const theta =
    280.46061837 +
    360.98564736629 * (jd - J2000_JD) +
    0.000387933 * T * T -
    (T * T * T) / 38_710_000;
  return norm360(theta);
}

/**
 * Local (apparent-site) Mean Sidereal Time in DEGREES [0, 360):
 *
 *   LST = GMST + observer longitude (east-positive)
 *
 * LST is the right ascension currently on the observer's meridian, so a star's
 * hour angle is H = LST − RA. Longitude is east-positive to match lib/geo's
 * LatLon (+E). Returns null on bad input.
 *
 * NOTE: exported under the exact name the frontend contract asked for
 * (`localSiderianTimeDeg`) as an alias below; this correctly-spelled function
 * is the canonical one.
 */
export function localSiderealTimeDeg(
  date: Date,
  observerLonDeg: number
): number | null {
  if (!isValidDate(date) || !finite(observerLonDeg)) return null;
  const gmst = greenwichMeanSiderealTimeDeg(date);
  if (gmst === null) return null;
  return norm360(gmst + observerLonDeg);
}

/** Alias for {@link localSiderealTimeDeg} (the LST name the frontend imports). */
export const localSiderianTimeDeg = localSiderealTimeDeg;

// ────────────────────── 5. equatorial → horizontal (alt/az) ─────────────────

/** Altitude/azimuth of a star as seen from a place at an instant, in degrees. */
export interface HorizontalCoord {
  /** altitude above the horizon [deg]; > 0 ⇒ above the horizon, 90 = zenith */
  altitude: number;
  /** azimuth [deg, 0–360), measured from due North, clockwise (N=0, E=90, S=180, W=270) */
  azimuth: number;
}

/**
 * Convert a star's equatorial coordinates (RA/Dec, degrees) to horizontal
 * coordinates {altitude, azimuth} as seen from (lat, lon) at `date`. This is the
 * real astronomy behind "what's up above this place right now".
 *
 * Hour angle          H  = LST − RA
 * Altitude (Meeus 13.6): sin(alt) = sin(φ)·sin(δ) + cos(φ)·cos(δ)·cos(H)
 * Azimuth (from North, clockwise; Meeus 13.5 rotated South→North by 180°):
 *   az = atan2( −cos(δ)·sin(H),  sin(δ)·cos(φ) − cos(δ)·sin(φ)·cos(H) )
 *
 * φ = observer latitude, δ = declination. Longitude is east-positive. Validated
 * against Meeus example 13.b (alt ≈ 15.12°, az ≈ 248.03°) in the test file.
 * Any invalid input (non-finite number or bad Date) returns null — never throws.
 */
export function equatorialToHorizontal(
  raDeg: number,
  decDeg: number,
  observerLatDeg: number,
  observerLonDeg: number,
  date: Date
): HorizontalCoord | null {
  if (
    !finite(raDeg) ||
    !finite(decDeg) ||
    !finite(observerLatDeg) ||
    !finite(observerLonDeg) ||
    !isValidDate(date)
  ) {
    return null;
  }

  const lst = localSiderealTimeDeg(date, observerLonDeg);
  if (lst === null) return null;

  const H = (lst - raDeg) * DEG2RAD; // hour angle, radians
  const dec = decDeg * DEG2RAD;
  const lat = observerLatDeg * DEG2RAD;

  const sinAlt =
    Math.sin(lat) * Math.sin(dec) +
    Math.cos(lat) * Math.cos(dec) * Math.cos(H);
  const altitude = Math.asin(clamp(sinAlt, -1, 1)) * RAD2DEG;

  const y = -Math.cos(dec) * Math.sin(H);
  const x =
    Math.sin(dec) * Math.cos(lat) -
    Math.cos(dec) * Math.sin(lat) * Math.cos(H);
  const azimuth = norm360(Math.atan2(y, x) * RAD2DEG);

  return { altitude, azimuth };
}

/**
 * Is a star above the observer's horizon at `date`? True iff its altitude > 0
 * (the geometric horizon; atmospheric refraction near the horizon is ignored,
 * which is honest to sub-degree for anything meaningfully "up"). Returns null on
 * invalid input, so callers can distinguish "below horizon" from "bad data".
 */
export function isAboveHorizon(
  raDeg: number,
  decDeg: number,
  observerLatDeg: number,
  observerLonDeg: number,
  date: Date
): boolean | null {
  const hz = equatorialToHorizontal(
    raDeg,
    decDeg,
    observerLatDeg,
    observerLonDeg,
    date
  );
  if (hz === null) return null;
  return hz.altitude > 0;
}
