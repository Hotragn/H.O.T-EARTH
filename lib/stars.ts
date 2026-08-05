/**
 * Stars: turning the shipped naked-eye catalogue into real stellar astrophysics.
 *
 * This module adds no new data. It reads the HYG subset already shipped for the
 * Night Sky tab (public/data/night-sky/stars.json: measured V magnitude, B-V
 * colour index, parallax distance and spectral type) and derives the quantities
 * that put a star on a Hertzsprung-Russell diagram:
 *
 *  - absolute magnitude from apparent magnitude and distance
 *  - effective temperature from B-V (Ballesteros 2012)
 *  - luminosity from absolute magnitude
 *  - radius from luminosity and temperature (Stefan-Boltzmann)
 *  - a luminosity class read off the star's HR position
 *  - main-sequence mass and lifetime, valid on the main sequence only
 *
 * Two honest limits run through all of it, stated here and in the docs:
 * interstellar extinction is NOT corrected (it reddens B-V and dims V, so distant
 * stars read cooler and fainter than they are), and no bolometric correction is
 * applied, so very hot and very cool stars come out under-luminous. Radii for red
 * supergiants are therefore order-of-magnitude, not measurements.
 *
 * Same null-safety contract as the other libs: bad input returns null or [],
 * never throws.
 */

/** Parsecs per light year. */
export const PC_PER_LY = 1 / 3.26156;
/** The Sun's absolute visual magnitude. */
export const SUN_ABS_MAG_V = 4.83;
/** The Sun's effective temperature in kelvin (IAU nominal). */
export const SUN_TEFF_K = 5772;

/** One catalogue row, named. Mirrors the shipped `columns` array. */
export interface StarRow {
  id: number;
  ra: number;
  dec: number;
  /** Apparent visual magnitude. */
  mag: number;
  /** B-V colour index, or null when absent. */
  ci: number | null;
  /** Parallax distance in light years, or null when absent. */
  distLy: number | null;
  spect: string | null;
  name: string | null;
  bayer: string | null;
  con: string | null;
}

/** Where a star sits in the HR diagram, qualitatively. */
export type LuminosityClass =
  | "main-sequence"
  | "subgiant"
  | "giant"
  | "supergiant"
  | "white-dwarf";

/**
 * Absolute visual magnitude: M = m - 5 log10(d_pc) + 5.
 *
 * Returns null without a positive distance. Reproduces the published values for
 * Sirius (1.45), Vega (0.58) and Proxima Centauri (about 15.5).
 */
export function absoluteMagnitude(
  apparentMag: number,
  distanceLy: number | null,
): number | null {
  if (
    distanceLy == null ||
    !isFinite(apparentMag) ||
    !isFinite(distanceLy) ||
    distanceLy <= 0
  ) {
    return null;
  }
  const pc = distanceLy * PC_PER_LY;
  return apparentMag - 5 * Math.log10(pc) + 5;
}

/**
 * Effective temperature in kelvin from B-V, using the Ballesteros (2012) fit:
 *
 *   T = 4600 K * ( 1/(0.92 BV + 1.70) + 1/(0.92 BV + 0.62) )
 *
 * Good to a few per cent across the main sequence: it recovers about 10,000 K for
 * Sirius and about 5,800 K for a solar-colour star. It assumes unreddened light,
 * so a heavily extincted star reads too cool.
 */
export function temperatureFromColorIndex(bv: number | null): number | null {
  if (bv == null || !isFinite(bv)) return null;
  const a = 0.92 * bv;
  const t = 4600 * (1 / (a + 1.7) + 1 / (a + 0.62));
  return isFinite(t) && t > 0 ? t : null;
}

/**
 * Luminosity in solar units from absolute visual magnitude:
 * L/Lsun = 10^((Msun - M) / 2.5).
 *
 * Strictly a V-band ratio, not bolometric: no bolometric correction is applied,
 * so stars radiating mostly outside the visual band come out low.
 */
export function luminositySolar(absMag: number | null): number | null {
  if (absMag == null || !isFinite(absMag)) return null;
  const l = Math.pow(10, (SUN_ABS_MAG_V - absMag) / 2.5);
  return isFinite(l) && l > 0 ? l : null;
}

/**
 * Radius in solar units from Stefan-Boltzmann:
 * R/Rsun = (Tsun/T)^2 * sqrt(L/Lsun).
 *
 * Inherits every caveat above. For cool supergiants this is order-of-magnitude:
 * Betelgeuse comes out a few hundred solar radii against a measured ~700, because
 * V-band luminosity and an unreddened colour temperature are both wrong in the
 * same direction for such a star.
 */
export function radiusSolar(
  luminosity: number | null,
  temperatureK: number | null,
): number | null {
  if (
    luminosity == null ||
    temperatureK == null ||
    !isFinite(luminosity) ||
    !isFinite(temperatureK) ||
    luminosity <= 0 ||
    temperatureK <= 0
  ) {
    return null;
  }
  return Math.pow(SUN_TEFF_K / temperatureK, 2) * Math.sqrt(luminosity);
}

/**
 * Classify a star's HR position.
 *
 * These are broad bands drawn on the diagram, not spectroscopic luminosity
 * classes: we have photometry, not spectra, so this says "it sits where giants
 * sit", which is an honestly weaker claim than "it is a class III giant".
 */
export function classify(
  absMag: number | null,
  temperatureK: number | null,
): LuminosityClass | null {
  if (absMag == null || temperatureK == null) return null;
  if (!isFinite(absMag) || !isFinite(temperatureK) || temperatureK <= 0) return null;

  // Hot but very faint: below the main sequence entirely.
  if (absMag > 10 && temperatureK > 6000) return "white-dwarf";
  if (absMag < -4) return "supergiant";

  // Rough main-sequence ridge: cooler stars sit fainter, so a cool star that is
  // bright must have evolved off the sequence.
  //
  // The slope is a single-parameter fit through the Sun, calibrated against
  // standard main-sequence anchors (B0V at M_V -4.0 and 30,000 K, A0V at +0.6 and
  // 9,790 K, K5V at +7.35 and 4,410 K). The real sequence is not log-linear
  // across that whole range: the local slope runs from about 12 at the hot end to
  // about 29 at the cool end, so 20 is a compromise that classifies correctly
  // while sitting a magnitude or two off the true ridge at the extremes. Since we
  // only ever use it to answer "is this star far brighter than the sequence at
  // its colour", that is good enough, and the bands below are deliberately wide.
  const MS_RIDGE_SLOPE = 20;
  const msRidge =
    SUN_ABS_MAG_V + MS_RIDGE_SLOPE * Math.log10(SUN_TEFF_K / temperatureK);
  const excess = msRidge - absMag; // magnitudes brighter than the ridge
  if (excess > 2.5) return "giant";
  if (excess > 1.0) return "subgiant";
  return "main-sequence";
}

/**
 * Mass in solar units from the main-sequence mass-luminosity relation
 * L proportional to M^3.5, inverted.
 *
 * ONLY meaningful on the main sequence: applying it to a giant or a white dwarf
 * is meaningless, so `derive` gates it on `classify`.
 */
export function mainSequenceMassSolar(luminosity: number | null): number | null {
  if (luminosity == null || !isFinite(luminosity) || luminosity <= 0) return null;
  return Math.pow(luminosity, 1 / 3.5);
}

/**
 * Main-sequence lifetime in years from the standard scaling
 * t = 10 Gyr * (M/Msun)^-2.5.
 *
 * The Sun comes out at 10 Gyr by construction. This is a scaling law, not a
 * stellar model: right to a factor of order unity, which is enough to make the
 * real point that massive stars live briefly and small ones essentially forever.
 */
export function mainSequenceLifetimeYears(massSolar: number | null): number | null {
  if (massSolar == null || !isFinite(massSolar) || massSolar <= 0) return null;
  return 1e10 * Math.pow(massSolar, -2.5);
}

/** Everything derivable for one star. Null means "not knowable from this row". */
export interface StarDerived {
  absMag: number | null;
  temperatureK: number | null;
  luminosity: number | null;
  radius: number | null;
  lclass: LuminosityClass | null;
  massSolar: number | null;
  lifetimeYears: number | null;
}

export function derive(star: StarRow): StarDerived {
  const absMag = absoluteMagnitude(star.mag, star.distLy);
  const temperatureK = temperatureFromColorIndex(star.ci);
  const luminosity = luminositySolar(absMag);
  const radius = radiusSolar(luminosity, temperatureK);
  const lclass = classify(absMag, temperatureK);
  // Mass and lifetime only mean anything on the main sequence.
  const onMs = lclass === "main-sequence";
  const massSolar = onMs ? mainSequenceMassSolar(luminosity) : null;
  return {
    absMag,
    temperatureK,
    luminosity,
    radius,
    lclass,
    massSolar,
    lifetimeYears: onMs ? mainSequenceLifetimeYears(massSolar) : null,
  };
}

/** Parse the shipped column-array catalogue into named rows. */
export function parseStars(json: unknown): StarRow[] {
  const doc = json as { stars?: unknown[] } | null;
  if (!doc || !Array.isArray(doc.stars)) return [];
  const num = (v: unknown): number | null =>
    typeof v === "number" && isFinite(v) ? v : null;
  const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
  const out: StarRow[] = [];
  for (const r of doc.stars) {
    if (!Array.isArray(r) || r.length < 7) continue;
    const mag = num(r[3]);
    if (mag == null) continue;
    out.push({
      id: num(r[0]) ?? -1,
      ra: num(r[1]) ?? 0,
      dec: num(r[2]) ?? 0,
      mag,
      ci: num(r[4]),
      distLy: num(r[5]),
      spect: str(r[6]),
      name: str(r[7]),
      bayer: str(r[8]),
      con: str(r[9]),
    });
  }
  return out;
}

/**
 * Points for the HR diagram: only stars where both axes are knowable.
 *
 * Dropping the rest is the honest choice. Plotting a star at a guessed
 * temperature or distance would put a fabricated point on a scientific diagram.
 */
export function hrPoints(
  stars: StarRow[],
): Array<{ star: StarRow; derived: StarDerived }> {
  if (!Array.isArray(stars)) return [];
  const out: Array<{ star: StarRow; derived: StarDerived }> = [];
  for (const s of stars) {
    const d = derive(s);
    if (d.absMag == null || d.temperatureK == null) continue;
    out.push({ star: s, derived: d });
  }
  return out;
}

/** Tally luminosity classes across a set of points. */
export function countByClass(
  points: Array<{ derived: StarDerived }>,
): Record<LuminosityClass, number> {
  const out: Record<LuminosityClass, number> = {
    "main-sequence": 0,
    subgiant: 0,
    giant: 0,
    supergiant: 0,
    "white-dwarf": 0,
  };
  for (const p of points) {
    if (p.derived.lclass) out[p.derived.lclass] += 1;
  }
  return out;
}

/** Harvard spectral class letter from a spectral type string ("A0" gives "A"). */
export function spectralClass(spect: string | null): string | null {
  if (!spect) return null;
  const m = /^([OBAFGKM])/i.exec(spect.trim());
  return m ? m[1].toUpperCase() : null;
}

/**
 * The naked-eye catalogue is magnitude limited, and that biases the HR diagram
 * in a way worth stating rather than hiding: we only see stars bright enough to
 * reach us, so luminous giants and supergiants are hugely over-represented
 * compared with the real stellar population, which is overwhelmingly faint red
 * dwarfs. Proxima Centauri is the fourth-nearest star and still needs a telescope.
 */
export const SELECTION_BIAS_NOTE =
  "This is a magnitude-limited sample: every star here is visible to the naked eye, so bright giants and supergiants are wildly over-represented. The real population is dominated by faint red dwarfs, almost none of which appear. Proxima Centauri, the nearest star after the Sun, is not visible without a telescope.";
