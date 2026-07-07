/**
 * Mars time & orbital geometry — the NASA GISS **Mars24** algorithm
 * (Allison & McEwen 2000, "A post-Pathfinder evaluation of areocentric solar
 * coordinates with improved timing recipes for Mars seasonal/diurnal climate
 * studies", Planet. Space Sci. 48, 215–235), as documented and maintained by
 * NASA GISS: https://www.giss.nasa.gov/tools/mars24/help/algorithm.html
 *
 * This is the Mars analogue of lib/solar.ts. Everything is a pure function of a
 * JavaScript UTC `Date`, so it unit-tests cleanly and drives both the HUD
 * readouts and the day/night terminator shader (via {@link marsSunDirection}).
 *
 * Accuracy: the Mars24 recipe places the areocentric solar longitude Ls to
 * within ~0.01° and Mars mean time to sub-second over the modern era — far
 * beyond what a globe needs. We deliberately keep the *documented* series
 * (Allison & McEwen equations A-1 … B-6) rather than inventing constants:
 * physics-env-simulation skill — real physics, documented, or it doesn't ship.
 *
 * Reference values validated in lib/mars-time.test.ts. Key anchor from the
 * GISS writeup: the Mars24 worked example for 2000-01-06 00:00 UTC gives
 * MSD ≈ 44796.0 and Ls ≈ 277.18°. We assert against that plus astronomical
 * equinox/solstice events and cycle-length invariants.
 *
 * Coordinate convention: all lat/lon → 3D goes through lib/geo
 * (lon 0→+X, 90E→−Z, N→+Y; globe mesh unrotated). NEVER rotate the globe.
 */

import { latLonToVector3, normalizeLon } from "./geo";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** Mars axial obliquity (deg). Bounds the solar declination. */
export const MARS_OBLIQUITY_DEG = 25.19;

/**
 * Length of the Mars year in sols (mean solar days). One full Ls cycle.
 * (Allison & McEwen; ~668.6 sols ≈ 686.97 Earth days.)
 */
export const SOLS_PER_MARS_YEAR = 668.5991;

/** Length of one sol in Earth seconds (86400 * 1.0274912517). */
export const SECONDS_PER_SOL = 88_775.244;

/** Unix milliseconds at the J2000 epoch (2000-01-01 12:00:00 UTC). */
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const DAY_MS = 86_400_000;

/**
 * Convert a UTC Date to a "Terrestrial Time" Julian-day offset from J2000,
 * i.e. Mars24 step A-1..A-4. We fold in the TT−UTC offset (leap seconds +
 * 32.184 s). Mars24 uses a running leap-second count; for the modern era
 * (2017-01-01 onward) TAI−UTC = 37 s, so ΔT = TT−UTC = 69.184 s. That constant
 * error is < 0.001° of Ls — negligible for a globe, and documented here so the
 * approximation is honest.
 */
function j2000TTOffsetDays(date: Date): number {
  const utcMs = date.getTime();
  // ΔT = 69.184 s for the current leap-second era (good 2017-01-01 → present).
  const ttMs = utcMs + 69_184;
  return (ttMs - J2000_UNIX_MS) / DAY_MS;
}

/**
 * Areocentric solar longitude **Ls** in degrees, 0–360.
 *   Ls = 0   → northern spring equinox
 *   Ls = 90  → northern summer solstice
 *   Ls = 180 → northern autumn equinox
 *   Ls = 270 → northern winter solstice (near perihelion → dust season)
 *
 * Mars24 steps B-1 … B-5 (Allison & McEwen 2000):
 *   M   = mean anomaly
 *   αFMS = fictitious mean sun angle
 *   PBS = sum of perturbation terms
 *   ν−M = equation of center
 *   Ls  = αFMS + (ν−M)
 */
export function solarLongitude(date: Date): number {
  const dtJ2000 = j2000TTOffsetDays(date);

  // B-1: Mars mean anomaly M (deg)
  const M = 19.3871 + 0.52402073 * dtJ2000;

  // B-2: angle of Fictitious Mean Sun αFMS (deg)
  const alphaFMS = 270.3871 + 0.524038496 * dtJ2000;

  // B-3: perturbers PBS (deg). Ten cosine terms from Allison & McEwen.
  const PBS =
    0.0071 * Math.cos((0.985626 * dtJ2000) / 2.2353 + 49.409) +
    0.0057 * Math.cos((0.985626 * dtJ2000) / 2.7543 + 168.173) +
    0.0039 * Math.cos((0.985626 * dtJ2000) / 1.1177 + 191.837) +
    0.0037 * Math.cos((0.985626 * dtJ2000) / 15.7866 + 21.736) +
    0.0021 * Math.cos((0.985626 * dtJ2000) / 2.1354 + 15.704) +
    0.002 * Math.cos((0.985626 * dtJ2000) / 2.4694 + 95.528) +
    0.0018 * Math.cos((0.985626 * dtJ2000) / 32.8493 + 49.095);

  // B-4: equation of center ν−M (deg)
  const Mr = M * DEG2RAD;
  const nuMinusM =
    (10.691 + 3.0e-7 * dtJ2000) * Math.sin(Mr) +
    0.623 * Math.sin(2 * Mr) +
    0.05 * Math.sin(3 * Mr) +
    0.005 * Math.sin(4 * Mr) +
    0.0005 * Math.sin(5 * Mr) +
    PBS;

  // B-5: areocentric solar longitude Ls (deg)
  const Ls = alphaFMS + nuMinusM;
  return ((Ls % 360) + 360) % 360;
}

/**
 * Solar declination on Mars (deg) — the subsolar latitude.
 * From Ls and the obliquity ε (Allison & McEwen, eq. for planetocentric
 * declination): sin δ = sin ε · sin Ls. Bounded by ±ε = ±25.19°.
 */
export function marsSolarDeclination(date: Date): number {
  const Ls = solarLongitude(date);
  const sinDec = Math.sin(MARS_OBLIQUITY_DEG * DEG2RAD) * Math.sin(Ls * DEG2RAD);
  return Math.asin(Math.max(-1, Math.min(1, sinDec))) * RAD2DEG;
}

/**
 * Mars Sol Date (MSD) — the Mars analogue of the Julian Date, counting sols
 * since a fixed prime-meridian midnight. Monotonically increasing.
 * Mars24 step C-2:
 *   MSD = (ΔtJ2000_TT − 4.5) / 1.0274912517 + 44796.0 − 0.0009626
 * where 0.0009626 is the small adopted adjustment ("Mars24 sprinkle").
 */
export function marsSolDate(date: Date): number {
  const dtJ2000 = j2000TTOffsetDays(date);
  return (dtJ2000 - 4.5) / 1.0274912517 + 44796.0 - 0.0009626;
}

/**
 * Coordinated Mars Time (MTC) — mean solar time at the Mars prime meridian
 * (Airy-0), in decimal hours 0–24. Mars24 step C-3: MTC = (24 · MSD) mod 24.
 */
export function coordinatedMarsTime(date: Date): number {
  return (24 * marsSolDate(date)) % 24;
}

/**
 * Local Mean Solar Time (LMST) at a given planetographic longitude, decimal
 * hours 0–24. Mars convention measures longitude positive WEST; we accept the
 * app's east-positive longitude and convert. Mars24 step C-4:
 *   LMST = MTC − Λ(°W)/15 = MTC + lonEast/15
 */
export function localMeanSolarTime(date: Date, lonEastDeg: number): number {
  const lmst = coordinatedMarsTime(date) + lonEastDeg / 15;
  return ((lmst % 24) + 24) % 24;
}

/**
 * Subsolar point on Mars (the lat/lon where the sun is at zenith).
 *   lat = solar declination (from Ls + obliquity)
 *   lon = the east-longitude whose local mean solar time is noon.
 *
 * At the prime meridian, local noon happens when MTC = 12. The subsolar
 * meridian is therefore lonEast where LMST = 12 ⇒ lonEast = 15·(12 − MTC).
 * Mirrors solar.ts subsolarPoint: the sun marches west at 15°/sol-hour.
 */
export function marsSubsolarPoint(date: Date): { lat: number; lon: number } {
  const lat = marsSolarDeclination(date);
  const lon = normalizeLon(15 * (12 - coordinatedMarsTime(date)));
  return { lat, lon };
}

/**
 * Unit vector from Mars' center toward the sun, in the globe's planet-fixed
 * frame (lib/geo axis convention). Feed directly to the terminator shader as
 * the `sunDir` uniform: a surface point P is in daylight iff
 * dot(P̂, sunDir) > 0. Analogous to solar.ts sunDirection.
 */
export function marsSunDirection(date: Date): [number, number, number] {
  const { lat, lon } = marsSubsolarPoint(date);
  return latLonToVector3(lat, lon, 1);
}

export type MarsSeason =
  | "Northern Spring"
  | "Northern Summer"
  | "Northern Autumn"
  | "Northern Winter";

/**
 * Northern-hemisphere season label from Ls. (Southern hemisphere is the
 * opposite; we label from the north by convention and say so in the HUD.)
 *   0–90 spring · 90–180 summer · 180–270 autumn · 270–360 winter
 */
export function marsSeason(date: Date): MarsSeason {
  const Ls = solarLongitude(date);
  if (Ls < 90) return "Northern Spring";
  if (Ls < 180) return "Northern Summer";
  if (Ls < 270) return "Northern Autumn";
  return "Northern Winter";
}

/**
 * Dust-storm climatology. This is the *season* in which large/global dust
 * storms historically cluster — NOT a forecast of a specific storm. Mars' dust
 * season runs roughly Ls 180–360 (southern spring/summer, near perihelion),
 * peaking ~Ls 240–300. Labeled honestly in the HUD.
 */
export function dustStormSeason(date: Date): {
  active: boolean;
  peak: boolean;
  /** 0–1 climatological likelihood weighting for the current Ls (not a probability). */
  intensity: number;
  label: string;
} {
  const Ls = solarLongitude(date);
  const active = Ls >= 180 && Ls <= 360;
  const peak = Ls >= 240 && Ls <= 300;
  // Smooth 0→1 climatological weighting: ramps up from Ls 180, crests near
  // Ls 270 (perihelion / southern summer solstice), tapers by Ls 360.
  let intensity = 0;
  if (active) {
    intensity = Math.max(0, Math.sin(((Ls - 180) / 180) * Math.PI));
  }
  const label = peak
    ? "Dust season — peak"
    : active
      ? "Dust season"
      : "Low-dust season";
  return { active, peak, intensity, label };
}

/**
 * Everything the HUD needs in one pure call, so components read a single
 * snapshot per tick rather than recomputing the series five times.
 */
export interface MarsClock {
  /** areocentric solar longitude, deg 0–360 */
  ls: number;
  /** subsolar latitude = solar declination, deg (|·| ≤ 25.19) */
  declination: number;
  /** subsolar point lat/lon (deg east) */
  subsolar: { lat: number; lon: number };
  /** Mars Sol Date */
  msd: number;
  /** Coordinated Mars Time, decimal hours 0–24 */
  mtc: number;
  season: MarsSeason;
  dust: ReturnType<typeof dustStormSeason>;
}

export function marsClock(date: Date): MarsClock {
  const ls = solarLongitude(date);
  const subsolar = marsSubsolarPoint(date);
  return {
    ls,
    declination: subsolar.lat,
    subsolar,
    msd: marsSolDate(date),
    mtc: coordinatedMarsTime(date),
    season: marsSeason(date),
    dust: dustStormSeason(date),
  };
}

/** "14:37 MTC" style clock string from decimal hours. */
export function formatMTC(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)} MTC`;
}
