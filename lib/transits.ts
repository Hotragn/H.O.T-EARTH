/**
 * Transits: how we actually know most of those exoplanets are there.
 *
 * This module adds no new data. It reads the NASA Exoplanet Archive subset
 * already shipped for the Exoplanets tab (public/data/exoplanets/systems.json:
 * measured planet radii, host-star radii, orbital periods and semi-major axes)
 * and derives the quantities the transit method actually rests on:
 *
 *  - transit depth from the radius ratio, (Rp/Rs)^2
 *  - the inverse: planet radius recovered from a measured depth
 *  - central transit duration from the period and geometry
 *  - the geometric probability that a given planet transits at all
 *
 * The point of the tab is epistemic: the Exoplanets tab asserts radii, and this
 * one shows the measurement those radii come from. Depth is a ratio of areas, so
 * a transit measures Rp/Rs and nothing else; the planet's absolute size is only
 * as good as the star's, which is stated rather than glossed.
 *
 * Same null-safety contract as the other libs: bad input returns null, never throws.
 */

/** Solar radii per Earth radius (IAU nominal: 695,700 km / 6,378.1 km). */
export const R_SUN_IN_R_EARTH = 109.0762;
/** Solar radius in astronomical units. */
export const R_SUN_IN_AU = 0.00465047;

/**
 * Transit depth as a fraction of the star's light.
 *
 * delta = (Rp / Rs)^2, because the planet blocks its own disc area out of the
 * star's disc area. Inputs are the catalogue's units: planet radius in Earth
 * radii, star radius in solar radii.
 *
 * Textbook checks, both tested: Earth across the Sun is 84 ppm, Jupiter across
 * the Sun is about 1.1%. That six-hundred-fold gap is why small planets are hard.
 */
export function transitDepth(
  planetRadiusEarth: number | null,
  starRadiusSolar: number | null,
): number | null {
  if (
    planetRadiusEarth == null ||
    starRadiusSolar == null ||
    !isFinite(planetRadiusEarth) ||
    !isFinite(starRadiusSolar) ||
    planetRadiusEarth <= 0 ||
    starRadiusSolar <= 0
  ) {
    return null;
  }
  const ratio = planetRadiusEarth / (starRadiusSolar * R_SUN_IN_R_EARTH);
  return ratio * ratio;
}

/** Depth in parts per million, the unit transit photometry is usually quoted in. */
export function depthPpm(depth: number | null): number | null {
  if (depth == null || !isFinite(depth) || depth < 0) return null;
  return depth * 1e6;
}

/**
 * The inverse measurement: planet radius in Earth radii from an observed depth
 * and a known stellar radius.
 *
 * This is the actual chain of inference in the transit method, and it makes the
 * dependency explicit: the planet radius inherits the star radius's error
 * directly, so a 10% uncertainty in Rs is a 10% uncertainty in Rp.
 */
export function planetRadiusFromDepth(
  depth: number | null,
  starRadiusSolar: number | null,
): number | null {
  if (
    depth == null ||
    starRadiusSolar == null ||
    !isFinite(depth) ||
    !isFinite(starRadiusSolar) ||
    depth <= 0 ||
    starRadiusSolar <= 0
  ) {
    return null;
  }
  return Math.sqrt(depth) * starRadiusSolar * R_SUN_IN_R_EARTH;
}

/**
 * Central transit duration in hours:
 *
 *   T = (P / pi) * asin(Rs / a)
 *
 * This is the duration for a central crossing (impact parameter zero) of a
 * circular orbit, ignoring the planet's own radius. Real transits are shorter
 * whenever the crossing is off-centre, so treat this as the maximum for the
 * geometry, which is what the UI says. Returns null if the star's radius exceeds
 * the orbit, which is unphysical.
 *
 * Checked against HD 209458 b: 3.5247 d period, 0.04747 AU, 1.155 Rsun gives
 * about 3.1 hours against a published ~3.0.
 */
export function transitDurationHours(
  periodDays: number | null,
  smaAu: number | null,
  starRadiusSolar: number | null,
): number | null {
  if (
    periodDays == null ||
    smaAu == null ||
    starRadiusSolar == null ||
    !isFinite(periodDays) ||
    !isFinite(smaAu) ||
    !isFinite(starRadiusSolar) ||
    periodDays <= 0 ||
    smaAu <= 0 ||
    starRadiusSolar <= 0
  ) {
    return null;
  }
  const rsAu = starRadiusSolar * R_SUN_IN_AU;
  const s = rsAu / smaAu;
  if (s >= 1) return null; // star larger than the orbit
  return ((periodDays / Math.PI) * Math.asin(s)) * 24;
}

/**
 * Geometric probability that a randomly oriented circular orbit transits:
 * p ≈ Rs / a.
 *
 * This is why transit surveys are a numbers game: even a hot Jupiter only
 * transits about one time in ten, and an Earth analogue about one in two hundred.
 * Returns null on bad input, and clamps at 1 for the unphysical case.
 */
export function transitProbability(
  smaAu: number | null,
  starRadiusSolar: number | null,
): number | null {
  if (
    smaAu == null ||
    starRadiusSolar == null ||
    !isFinite(smaAu) ||
    !isFinite(starRadiusSolar) ||
    smaAu <= 0 ||
    starRadiusSolar <= 0
  ) {
    return null;
  }
  return Math.min(1, (starRadiusSolar * R_SUN_IN_AU) / smaAu);
}

/** A planet row flattened with its host star, as the tab consumes it. */
export interface TransitPlanet {
  host: string;
  name: string;
  method: string;
  discYear: number | null;
  periodDays: number | null;
  smaAu: number | null;
  radiusEarth: number | null;
  starRadiusSolar: number | null;
  starTeff: number | null;
  distanceLy: number | null;
}

export interface TransitDerived {
  depth: number | null;
  ppm: number | null;
  durationHours: number | null
  probability: number | null;
  /** Radius recovered from our own depth, as a round-trip consistency check. */
  radiusRoundTrip: number | null;
}

export function derive(p: TransitPlanet): TransitDerived {
  const depth = transitDepth(p.radiusEarth, p.starRadiusSolar);
  return {
    depth,
    ppm: depthPpm(depth),
    durationHours: transitDurationHours(p.periodDays, p.smaAu, p.starRadiusSolar),
    probability: transitProbability(p.smaAu, p.starRadiusSolar),
    radiusRoundTrip: planetRadiusFromDepth(depth, p.starRadiusSolar),
  };
}

/** Flatten the shipped systems file into transit-discovered planets. */
export function parseTransitPlanets(json: unknown): TransitPlanet[] {
  const doc = json as { systems?: unknown[] } | null;
  if (!doc || !Array.isArray(doc.systems)) return [];
  const num = (v: unknown): number | null =>
    typeof v === "number" && isFinite(v) ? v : null;
  const out: TransitPlanet[] = [];
  for (const sysRaw of doc.systems) {
    const sys = sysRaw as {
      hostname?: unknown;
      distance_ly?: unknown;
      star?: { rad?: unknown; teff?: unknown };
      planets?: unknown[];
    };
    if (!sys || typeof sys.hostname !== "string" || !Array.isArray(sys.planets)) {
      continue;
    }
    for (const plRaw of sys.planets) {
      const pl = plRaw as Record<string, unknown>;
      if (!pl || typeof pl.name !== "string") continue;
      out.push({
        host: sys.hostname,
        name: pl.name,
        method: typeof pl.method === "string" ? pl.method : "",
        discYear: num(pl.disc_year),
        periodDays: num(pl.period_days),
        smaAu: num(pl.sma_au),
        radiusEarth: num(pl.radius_re),
        starRadiusSolar: num(sys.star?.rad),
        starTeff: num(sys.star?.teff),
        distanceLy: num(sys.distance_ly),
      });
    }
  }
  return out;
}

/**
 * Only the planets this tab can honestly draw a transit for: discovered by
 * transit, with both radii known.
 *
 * Planets found by radial velocity or imaging are excluded rather than given a
 * hypothetical transit, because most of them do not transit at all from here.
 */
export function transitable(planets: TransitPlanet[]): TransitPlanet[] {
  if (!Array.isArray(planets)) return [];
  return planets.filter(
    (p) =>
      p.method === "Transit" &&
      p.radiusEarth != null &&
      p.starRadiusSolar != null &&
      transitDepth(p.radiusEarth, p.starRadiusSolar) != null,
  );
}

/**
 * Samples of the light curve as relative brightness against time in hours from
 * mid-transit.
 *
 * Deliberately a flat-bottomed trapezoid: ingress, a flat floor, egress. Real
 * curves are round-bottomed because the star is limb-darkened and brighter at
 * the centre, which this does NOT model, so the shape is schematic while the
 * depth and width are computed from measured values. The UI says so. Returns []
 * on unusable input.
 */
export function lightCurve(
  p: TransitPlanet,
  samples = 240,
): Array<{ hours: number; flux: number }> {
  const d = derive(p);
  if (d.depth == null || d.durationHours == null || samples < 8) return [];
  const half = d.durationHours / 2;
  // Ingress/egress take roughly Rp/Rs of the total, the planet's own crossing.
  const ratio = Math.sqrt(d.depth);
  const ingress = Math.max(half * ratio, half * 0.02);
  const span = half * 1.8;
  const out: Array<{ hours: number; flux: number }> = [];
  for (let i = 0; i < samples; i++) {
    const t = -span + (2 * span * i) / (samples - 1);
    const a = Math.abs(t);
    let frac: number;
    if (a >= half) frac = 0;
    else if (a <= half - ingress) frac = 1;
    else frac = (half - a) / ingress;
    out.push({ hours: t, flux: 1 - d.depth * frac });
  }
  return out;
}

/** Tally how many planets each discovery method contributed. */
export function countByMethod(planets: TransitPlanet[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of planets) {
    if (!p.method) continue;
    out[p.method] = (out[p.method] ?? 0) + 1;
  }
  return out;
}

/**
 * The honest sentence about what a transit depth does and does not tell you.
 */
export const RATIO_CAVEAT =
  "A transit measures the ratio Rp/Rs, not the planet. Its absolute size is only as well known as the star's radius, so a 10% error in the star is a 10% error in the planet. Depth also says nothing about mass: that needs radial velocities.";
