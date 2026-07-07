/**
 * Axial precession of Earth's rotation axis — the slow ~25,772-year conical
 * wobble of the celestial pole, first described by Hipparchus and understood
 * dynamically by Newton (torque from the Sun and Moon on Earth's equatorial
 * bulge). This is the "even the sky changes" honest touch for the Virtual
 * Earth tab: over millennia the pole star changes (Polaris now, Thuban ~2700
 * BCE, Vega ~13,700 CE) and the whole star field appears to rotate about the
 * ecliptic pole.
 *
 * Real, computed physics — no arbitrary numbers (physics-env-simulation skill).
 * We model the dominant, uniform lunisolar precession of the equinoxes as a
 * steady rotation of the celestial sphere about the **ecliptic pole**. This is
 * the leading term; we deliberately omit the small periodic nutation and the
 * slow secular change of the precession rate itself, because at the scale of a
 * spinning star field on a globe those are invisible. What we keep is exact and
 * checkable: a full 360° turn in one precession period, correct rate and sign.
 *
 * Convention for the scene: the star field is a sphere far outside the globe.
 * We rotate it about the ecliptic-pole axis by the precession angle for the
 * current simulated year relative to J2000 (2000.0). Positive years → the
 * equinox regresses westward along the ecliptic (general precession is
 * westward, ~50.29 arcsec/yr), so the star field rotates in the corresponding
 * sense. Unit-tested in lib/precession.test.ts.
 *
 * Coordinate note: like everything else, any lat/lon → 3D still goes through
 * lib/geo; this module only produces an angle + axis for the starfield group,
 * and never touches the globe mesh.
 */

const DEG2RAD = Math.PI / 180;

/**
 * Length of the axial-precession cycle (Platonic year) in years. IAU value of
 * general precession in longitude ≈ 50.290966 arcsec/yr at J2000 gives a period
 * of 360·3600 / 50.290966 ≈ 25,772 years. We adopt the commonly cited 25,772.
 */
export const PRECESSION_PERIOD_YEARS = 25_772;

/** Reference epoch: J2000.0 = 2000.0 (decimal year). Precession is measured from here. */
export const PRECESSION_EPOCH_YEAR = 2000;

/**
 * Mean rate of general precession in longitude, arcsec per year:
 *   360° · 3600″ / 25,772 yr ≈ 50.2909″/yr
 * Provided for the HUD readout and cross-checked against the IAU value in the
 * tests (they agree to ~0.001″/yr, i.e. the period we adopt is consistent).
 */
export const PRECESSION_ARCSEC_PER_YEAR =
  (360 * 3600) / PRECESSION_PERIOD_YEARS;

/**
 * Obliquity of the ecliptic at J2000 (deg) — the tilt between the equatorial
 * pole (which precesses) and the ecliptic pole (the fixed axis of the cone).
 * IAU 2006 mean obliquity ε0 = 23°26′21.406″ = 23.4392911°. The precession
 * cone half-angle equals this obliquity.
 */
export const OBLIQUITY_J2000_DEG = 23.4392911;

/**
 * Precession angle (radians) for a decimal year, measured from J2000. One full
 * turn (2π) per precession period. Positive years give a positive angle; the
 * magnitude grows linearly with |Δyear|. This is the angle to rotate the star
 * field by, about the ecliptic-pole axis.
 */
export function precessionAngle(
  year: number,
  epochYear = PRECESSION_EPOCH_YEAR,
  periodYears = PRECESSION_PERIOD_YEARS
): number {
  const dt = year - epochYear;
  return (2 * Math.PI * dt) / periodYears;
}

/** Precession angle in degrees for the same inputs — handy for the HUD. */
export function precessionAngleDeg(
  year: number,
  epochYear = PRECESSION_EPOCH_YEAR,
  periodYears = PRECESSION_PERIOD_YEARS
): number {
  return (precessionAngle(year, epochYear, periodYears) * 180) / Math.PI;
}

/**
 * The ecliptic-pole axis, as a unit vector in the globe's Earth-fixed frame
 * (lib/geo convention: N pole = +Y). The ecliptic pole is tilted from the
 * celestial (rotation) pole by the obliquity. We place the tilt in the X–Y
 * plane so the celestial +Y pole leans toward +X by ε. The star field is
 * rotated about THIS axis, so the celestial pole traces a cone of half-angle ε
 * around it as the year advances — exactly the real geometry.
 */
export function eclipticPoleAxis(
  obliquityDeg = OBLIQUITY_J2000_DEG
): [number, number, number] {
  const e = obliquityDeg * DEG2RAD;
  // Rotation pole is +Y; tilt it by ε toward +X to get the ecliptic pole.
  return [Math.sin(e), Math.cos(e), 0];
}

/**
 * The current celestial (rotation) pole direction for a given year, obtained by
 * rotating the J2000 celestial pole (+Y) about the ecliptic-pole axis by the
 * precession angle. Returned as a unit vector in the Earth-fixed frame. This is
 * what "which way does the axis point among the stars" looks like — the tip of
 * this vector traces the precession circle (Polaris → Thuban → Vega → back).
 */
export function celestialPoleDirection(
  year: number,
  obliquityDeg = OBLIQUITY_J2000_DEG,
  epochYear = PRECESSION_EPOCH_YEAR,
  periodYears = PRECESSION_PERIOD_YEARS
): [number, number, number] {
  const angle = precessionAngle(year, epochYear, periodYears);
  const axis = eclipticPoleAxis(obliquityDeg);
  const pole: [number, number, number] = [0, 1, 0]; // J2000 celestial pole
  return rotateAboutAxis(pole, axis, angle);
}

/**
 * Rodrigues' rotation of vector `v` about unit axis `k` by `angle` radians.
 * Pure, allocation-light (returns a fresh triple). Kept here so the physics is
 * self-contained and testable without three.js.
 */
export function rotateAboutAxis(
  v: readonly [number, number, number],
  k: readonly [number, number, number],
  angle: number
): [number, number, number] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const [vx, vy, vz] = v;
  const [kx, ky, kz] = k;
  const dot = kx * vx + ky * vy + kz * vz;
  // cross = k × v
  const cx = ky * vz - kz * vy;
  const cy = kz * vx - kx * vz;
  const cz = kx * vy - ky * vx;
  return [
    vx * c + cx * s + kx * dot * (1 - c),
    vy * c + cy * s + ky * dot * (1 - c),
    vz * c + cz * s + kz * dot * (1 - c),
  ];
}

/**
 * The historical "pole star" nearest the celestial pole at a given year, for a
 * factual HUD caption. Real stars, real approximate epochs of closest approach.
 * This is a *label lookup*, not a computed astrometric match — we say so in the
 * UI. Chosen for the well-known precession-circle mileposts.
 */
export interface PoleStarEpoch {
  readonly star: string;
  /** approximate year (CE, negative = BCE) of closest alignment */
  readonly year: number;
}

const POLE_STAR_EPOCHS: readonly PoleStarEpoch[] = [
  { star: "Thuban (α Draconis)", year: -2700 },
  { star: "Kochab (β Ursae Minoris)", year: -1100 },
  { star: "Polaris (α Ursae Minoris)", year: 2000 },
  { star: "Gamma Cephei (Errai)", year: 4000 },
  { star: "Deneb (α Cygni)", year: 10000 },
  { star: "Vega (α Lyrae)", year: 13700 },
] as const;

/** Nearest tabulated pole star to a given year (by year of closest approach). */
export function nearestPoleStar(year: number): PoleStarEpoch {
  let best = POLE_STAR_EPOCHS[0];
  let bestDiff = Math.abs(year - best.year);
  for (const e of POLE_STAR_EPOCHS) {
    const d = Math.abs(year - e.year);
    if (d < bestDiff) {
      bestDiff = d;
      best = e;
    }
  }
  return best;
}
