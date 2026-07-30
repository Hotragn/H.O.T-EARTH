/**
 * Satellites and space debris: the real tracked catalogue.
 *
 * Every element set is a published CelesTrak GP record (see
 * public/data/satellites/catalog.json and docs/SATELLITES_DATA_SOURCES.md).
 * This module derives orbit geometry from those mean elements with textbook
 * two-body relations, all pure and unit tested against known objects:
 *
 *  - semi-major axis from mean motion (Kepler's third law)
 *  - perigee / apogee altitude from a and e
 *  - orbital period, and speeds from vis-viva
 *  - orbital-regime classification (LEO / MEO / GEO / HEO)
 *  - altitude-shell histograms, for showing where the congestion actually is
 *
 * What this module does NOT do is propagate. Positions come from SGP4
 * (satellite.js) in the scene, because SGP4 is the model these element sets are
 * defined for; using Keplerian motion to place them would quietly disagree with
 * the data. Same null-safety contract as the other libs: bad input returns null
 * or [], never throws.
 */

/** Earth's gravitational parameter, km^3/s^2 (WGS-84). */
export const MU_EARTH_KM3_S2 = 398600.4418;
/** Earth's equatorial radius, km (WGS-84). */
export const R_EARTH_KM = 6378.137;

/**
 * Solar day in seconds. Mean motion in these element sets is revolutions per
 * *solar* day, which is easy to get wrong: a geostationary satellite has a mean
 * motion of about 1.0027, not 1.0000, precisely because its physical period is a
 * sidereal day (86,164 s) while the count is per solar day (86,400 s). Using the
 * sidereal day here would put a geostationary orbit 76 km low and shorten the
 * ISS period by a quarter of a minute; both are covered by tests.
 */
const SOLAR_DAY_S = 86400;

/** One catalogue object, as shipped (compact keys keep the file small). */
export interface SatRecord {
  /** OBJECT_NAME */
  n: string;
  /** NORAD_CAT_ID */
  i: number;
  /** our group id */
  g: string;
  /** element-set epoch, ISO */
  e: string;
  /** mean motion, revolutions per day */
  mm: number;
  /** eccentricity */
  ec: number;
  /** inclination, degrees */
  in: number;
  /** right ascension of ascending node, degrees */
  ra: number;
  /** argument of perigee, degrees */
  ap: number;
  /** mean anomaly, degrees */
  ma: number;
  /** BSTAR drag term */
  bs: number;
}

export interface SatGroupMeta {
  id: string;
  label: string;
  /** How many objects CelesTrak tracks in this group. */
  tracked: number;
  /** How many we ship and draw. */
  shipped: number;
  sampled: boolean;
}

export interface SatCatalog {
  meta: {
    source: string;
    url: string;
    usagePolicy: string;
    credit: string;
    license: string;
    retrieved: string;
    groups: SatGroupMeta[];
    totalTracked: number;
    totalShipped: number;
    note: string;
  };
  objects: SatRecord[];
}

export type OrbitRegime = "LEO" | "MEO" | "GEO" | "HEO";

/**
 * Semi-major axis in km from mean motion in revolutions per solar day.
 *
 * Kepler's third law: a = (mu / n^2)^(1/3), with n in radians per second.
 */
export function semiMajorAxisKm(meanMotionRevPerDay: number): number | null {
  if (!isFinite(meanMotionRevPerDay) || meanMotionRevPerDay <= 0) return null;
  const n = (meanMotionRevPerDay * 2 * Math.PI) / SOLAR_DAY_S; // rad/s
  return Math.cbrt(MU_EARTH_KM3_S2 / (n * n));
}

/** Orbital period in minutes from mean motion (revolutions per solar day). */
export function periodMinutes(meanMotionRevPerDay: number): number | null {
  if (!isFinite(meanMotionRevPerDay) || meanMotionRevPerDay <= 0) return null;
  return SOLAR_DAY_S / meanMotionRevPerDay / 60;
}

/**
 * Perigee and apogee altitude above the equatorial radius, in km.
 *
 * These are altitudes above a spherical Earth of radius R_EARTH_KM, which is the
 * usual convention for catalogue summaries. It is not a geoid height, so near-
 * circular low orbits can read a few km off a more careful figure.
 */
export function altitudesKm(
  meanMotionRevPerDay: number,
  eccentricity: number,
): { perigee: number; apogee: number; mean: number } | null {
  const a = semiMajorAxisKm(meanMotionRevPerDay);
  if (
    a == null ||
    !isFinite(eccentricity) ||
    eccentricity < 0 ||
    eccentricity >= 1
  ) {
    return null;
  }
  const perigee = a * (1 - eccentricity) - R_EARTH_KM;
  const apogee = a * (1 + eccentricity) - R_EARTH_KM;
  return { perigee, apogee, mean: (perigee + apogee) / 2 };
}

/**
 * Orbital speed in km/s at a given radius, from vis-viva:
 * v = sqrt(mu (2/r - 1/a)). Returns null if the radius is outside the orbit.
 */
export function speedKmS(
  semiMajorKm: number,
  radiusKm: number,
): number | null {
  if (
    !isFinite(semiMajorKm) ||
    !isFinite(radiusKm) ||
    semiMajorKm <= 0 ||
    radiusKm <= 0
  ) {
    return null;
  }
  const term = 2 / radiusKm - 1 / semiMajorKm;
  if (term <= 0) return null;
  return Math.sqrt(MU_EARTH_KM3_S2 * term);
}

/**
 * Classify the orbit.
 *
 * Boundaries are the conventional ones and are stated in the docs rather than
 * pretended to be exact: LEO below 2,000 km, GEO near 35,786 km when the orbit
 * is also near-circular and near-equatorial, MEO in between, and HEO for
 * anything with a markedly eccentric orbit (which is what Molniya and GTO
 * transfer orbits look like).
 */
export function classifyRegime(
  meanMotionRevPerDay: number,
  eccentricity: number,
  inclinationDeg: number,
): OrbitRegime | null {
  const alt = altitudesKm(meanMotionRevPerDay, eccentricity);
  if (alt == null || !isFinite(inclinationDeg)) return null;

  // Markedly eccentric: perigee low but apogee far out.
  if (eccentricity >= 0.25) return "HEO";

  const geoAlt = 35786;
  const nearGeoAltitude = Math.abs(alt.mean - geoAlt) < 1500;
  if (nearGeoAltitude && eccentricity < 0.01 && Math.abs(inclinationDeg) < 15) {
    return "GEO";
  }
  if (alt.apogee < 2000) return "LEO";
  return "MEO";
}

/** Age of an element set in days. Returns null on an unparseable epoch. */
export function elementSetAgeDays(
  epochIso: string,
  now: Date = new Date(),
): number | null {
  const t = Date.parse(epochIso);
  if (!isFinite(t)) return null;
  return (now.getTime() - t) / 86400000;
}

/**
 * A one-line honesty statement about how much to trust a position derived from
 * an element set of this age. SGP4 error grows by roughly 1-3 km per day away
 * from epoch, so a week-old set can be tens of km off.
 */
export function accuracyNote(ageDays: number | null): string {
  if (ageDays == null) return "Element-set epoch unknown.";
  if (ageDays < 0) return "Element set is dated in the future; treat with suspicion.";
  const km = Math.round(ageDays * 2);
  if (ageDays < 1) return "Element set under a day old: position good to roughly a kilometre.";
  return `Element set ${ageDays.toFixed(1)} days old: expect roughly ${km} km of along-track error.`;
}

/**
 * Histogram of objects by altitude shell, using mean altitude.
 *
 * This is the honest way to show congestion: not "space is full", but where in
 * altitude the tracked objects actually cluster. Returns [] on bad input.
 */
export function altitudeShells(
  objects: SatRecord[],
  shellKm = 100,
  maxKm = 2000,
): Array<{ fromKm: number; toKm: number; count: number }> {
  if (!Array.isArray(objects) || shellKm <= 0 || maxKm <= 0) return [];
  const bins = new Map<number, number>();
  for (const o of objects) {
    const alt = altitudesKm(o.mm, o.ec);
    if (alt == null) continue;
    if (alt.mean < 0 || alt.mean > maxKm) continue;
    const key = Math.floor(alt.mean / shellKm) * shellKm;
    bins.set(key, (bins.get(key) ?? 0) + 1);
  }
  return [...bins.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([fromKm, count]) => ({ fromKm, toKm: fromKm + shellKm, count }));
}

/** Count objects per regime. */
export function countByRegime(
  objects: SatRecord[],
): Record<OrbitRegime, number> {
  const out: Record<OrbitRegime, number> = { LEO: 0, MEO: 0, GEO: 0, HEO: 0 };
  for (const o of objects) {
    const r = classifyRegime(o.mm, o.ec, o.in);
    if (r) out[r] += 1;
  }
  return out;
}

/** Load and lightly validate a catalogue payload. Returns null if unusable. */
export function parseCatalog(json: unknown): SatCatalog | null {
  const doc = json as SatCatalog | null;
  if (!doc || !doc.meta || !Array.isArray(doc.objects)) return null;
  const objects = doc.objects.filter(
    (o) =>
      o &&
      typeof o.n === "string" &&
      isFinite(o.mm) &&
      o.mm > 0 &&
      isFinite(o.ec) &&
      o.ec >= 0 &&
      o.ec < 1,
  );
  if (objects.length === 0) return null;
  return { meta: doc.meta, objects };
}

/** Objects in a group, in catalogue order. */
export function objectsInGroup(
  objects: SatRecord[],
  groupId: string,
): SatRecord[] {
  return objects.filter((o) => o.g === groupId);
}

/**
 * Summary of one object, for the detail panel: everything derivable from its
 * element set without propagating. Returns null on unusable input.
 */
export function describeObject(o: SatRecord): {
  regime: OrbitRegime;
  periodMin: number;
  perigeeKm: number;
  apogeeKm: number;
  speedPerigeeKmS: number;
  speedApogeeKmS: number;
  revsPerDay: number;
} | null {
  const a = semiMajorAxisKm(o.mm);
  const alt = altitudesKm(o.mm, o.ec);
  const p = periodMinutes(o.mm);
  const regime = classifyRegime(o.mm, o.ec, o.in);
  if (a == null || alt == null || p == null || regime == null) return null;
  const vp = speedKmS(a, a * (1 - o.ec));
  const va = speedKmS(a, a * (1 + o.ec));
  if (vp == null || va == null) return null;
  return {
    regime,
    periodMin: p,
    perigeeKm: alt.perigee,
    apogeeKm: alt.apogee,
    speedPerigeeKmS: vp,
    speedApogeeKmS: va,
    revsPerDay: o.mm,
  };
}
