/**
 * Surface-sky physics for the "Surfaces" tab — the first GROUND-LEVEL view of
 * the digital twin: standing on Mars, and standing on Titan.
 *
 * ── What is real vs adopted (module honesty contract) ───────────────────────
 *
 *   • MARS: fully computed from the validated Mars24/GISS machinery in
 *     lib/mars-time.ts (Allison & McEwen 2000). Sun altitude/azimuth, local
 *     mean solar time, sol number, Ls, season and top-of-atmosphere irradiance
 *     are all real, documented physics. Nothing here is an adopted phase.
 *
 *   • TITAN: the GEOMETRY is real (tidal locking ⇒ Saturn fixed in the sky;
 *     Saturn's apparent size from Titan; the solar-day rate; Saturn-tracking
 *     seasonal declination) and the FACTS are real Cassini–Huygens
 *     measurements. The absolute ROTATIONAL PHASE (i.e. "what local time is it
 *     on Titan right now") is an ADOPTED epoch convention, clearly labeled in
 *     {@link titanSunPosition}: the daylight-cycle rate and geometry are
 *     physical, the epoch registration is conventional. No spacecraft clock on
 *     Titan exists to anchor it better at this layer.
 *
 *   • "Live" means LIVE SIMULATION of these quantities from the clock. There
 *     are no streaming cameras on any planetary surface; terrain/appearance in
 *     the renderer is illustrative and the renderer must label it as such.
 *
 * ── Reuse (nothing re-derived) ──────────────────────────────────────────────
 *
 *   • lib/mars-time.ts — Mars24/GISS: marsSubsolarPoint, marsSolarDeclination,
 *     localMeanSolarTime, solarLongitude (Ls), marsSolDate, marsSeason.
 *   • lib/celestial.ts — the Meeus (Astronomical Algorithms, 2nd ed.) eq.
 *     13.5/13.6 hour-angle → alt/az spherical trig. The SAME spherical trig
 *     applies on any rotating sphere, Mars included: given the subsolar point
 *     (declination δ = subsolar latitude; subsolar longitude fixes the hour
 *     angle) and a site latitude φ,
 *
 *       sin(alt) = sin(φ)·sin(δ) + cos(φ)·cos(δ)·cos(H)
 *       az       = atan2(−cos(δ)·sin(H), sin(δ)·cos(φ) − cos(δ)·sin(φ)·cos(H))
 *
 *     with azimuth measured from NORTH, clockwise (N=0, E=90, S=180, W=270),
 *     exactly like lib/celestial. The hour angle H comes from Mars local mean
 *     solar time: H = 15° per Mars-hour past local noon, which is identically
 *     H = siteLonEast − subsolarLonEast (both built from MTC in mars-time.ts,
 *     so the two forms agree exactly).
 *   • lib/planets.ts — heliocentricPosition for the true Mars–Sun and
 *     Saturn–Sun distances (irradiance), and subSolarLatitude("Saturn", date)
 *     for Titan's seasonal solar declination (Titan orbits within ~0.3° of
 *     Saturn's equatorial plane — JPL SAT441, see lib/saturn-moons.ts — so its
 *     seasons track Saturn's 26.73° obliquity).
 *
 * ── Sources (physics-env-simulation skill: real physics, documented, or it
 *    doesn't ship — no invented numbers) ─────────────────────────────────────
 *
 *   • Mars sites: Curiosity landing site, Gale Crater (−4.5895°N, 137.4417°E)
 *     and Perseverance landing site, Jezero Crater (18.4447°N, 77.4508°E) —
 *     NASA/JPL rover mission landing-site coordinates.
 *   • Mars facts: NASA/GSFC Mars Fact Sheet
 *     (https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html):
 *     surface gravity 3.71 m/s², mean surface pressure ~610 Pa, mean surface
 *     temperature ~210 K with diurnal extremes roughly −143 °C … +35 °C,
 *     sol length 24 h 39 m 35.244 s.
 *   • Mars sky colour: NASA/JPL surface imagery — daytime butterscotch/salmon
 *     sky from suspended dust; BLUE glow around the Sun at sunset/sunrise
 *     (fine ~micron dust forward-scatters blue light) — e.g. the Curiosity
 *     sol 956 Gale Crater sunset sequence (NASA/JPL-Caltech/MSSS, April 2015).
 *   • Solar constant 1361 W/m² at 1 AU: Kopp & Lean (2011), GRL 38, L01706
 *     (TIM/SORCE total solar irradiance).
 *   • Titan: NASA/ESA Cassini–Huygens. Huygens landing site reconstruction
 *     ~10.573°S, 192.35°W (= 167.65°E) — ESA/JPL post-flight Descent
 *     Trajectory Working Group reconstruction (published values vary by a few
 *     hundredths of a degree; these are the values we adopt and cite).
 *     Titan orbital distance 1 221 870 km, orbital/rotation period 15.945 d
 *     (tidally locked), gravity 1.352 m/s², surface temperature ~94 K, surface
 *     pressure ~1.5 bar (~1.45 atm) — NASA Titan fact pages / NSSDCA.
 *     Saturn equatorial radius 60 268 km — NASA/GSFC Saturn Fact Sheet.
 *     Surface daylight ~0.1% of Earth's (bright-twilight level; the Sun is a
 *     bright smudge through the haze) — NASA/ESA Huygens surface-illumination
 *     results. Surface: damp sand / rounded pebbles of water ice (Huygens DISR
 *     imagery, 2005-01-14 — the only photos ever taken from Titan's surface).
 *
 * Every public function is a pure, deterministic function of a UTC `Date`
 * (and static site data). Bad input returns null — never throws. Keyless: no
 * runtime network calls.
 */

import {
  localMeanSolarTime,
  marsSeason,
  marsSolDate,
  marsSubsolarPoint,
  solarLongitude,
  type MarsSeason,
} from "./mars-time";
import { heliocentricPosition, subSolarLatitude } from "./planets";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const DAY_MS = 86_400_000;

/** Unix ms at the J2000 epoch (2000-01-01 12:00:00 UTC) — Titan phase epoch. */
const J2000_UNIX_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

// ───────────────────────────── null-safety guards ──────────────────────────
// Contract (mirrors lib/celestial.ts): bad input yields null, never a throw.

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

/** Normalize an angle to (−180, 180]. */
function norm180(deg: number): number {
  const d = norm360(deg);
  return d > 180 ? d - 360 : d;
}

// ────────────────────────────── shared types ───────────────────────────────

export type SurfaceWorld = "mars" | "titan";

/** A named ground-level viewpoint on a world's surface. */
export interface SurfaceSite {
  /** stable id used by {@link surfaceState} */
  id: string;
  name: string;
  /** planetographic latitude [deg, +N] */
  latDeg: number;
  /** longitude [deg, EAST-positive] — matches lib/geo and mars-time */
  lonEastDeg: number;
  /** true ⇒ a real spacecraft landing/operations site; false ⇒ a chosen viewpoint */
  landingSite: boolean;
  /** one-line provenance for the coordinates */
  source: string;
}

/** Sun (or Saturn) position in a site's sky. Azimuth from N, clockwise. */
export interface SkyPosition {
  /** altitude above the geometric horizon [deg]; 90 = zenith */
  altitudeDeg: number;
  /** azimuth [deg, 0–360), from due North, clockwise (N=0, E=90, S=180, W=270) */
  azimuthDeg: number;
}

/**
 * Shared alt/az from declination + hour angle + site latitude — the Meeus
 * 13.5/13.6 spherical trig reused from lib/celestial.ts (see module header for
 * the exact formulas and the Mars mapping). Pure math on any rotating sphere.
 */
function altAzFromHourAngle(
  latDeg: number,
  decDeg: number,
  hourAngleDeg: number
): SkyPosition {
  const lat = latDeg * DEG2RAD;
  const dec = decDeg * DEG2RAD;
  const H = hourAngleDeg * DEG2RAD;

  const sinAlt =
    Math.sin(lat) * Math.sin(dec) +
    Math.cos(lat) * Math.cos(dec) * Math.cos(H);
  const altitudeDeg = Math.asin(clamp(sinAlt, -1, 1)) * RAD2DEG;

  const y = -Math.cos(dec) * Math.sin(H);
  const x =
    Math.sin(dec) * Math.cos(lat) -
    Math.cos(dec) * Math.sin(lat) * Math.cos(H);
  const azimuthDeg = norm360(Math.atan2(y, x) * RAD2DEG);

  return { altitudeDeg, azimuthDeg };
}

// ═══════════════════════════════ PART A: MARS ══════════════════════════════

/**
 * Real rover landing sites (NASA/JPL mission coordinates). Curiosity's Gale
 * Crater touchdown and Perseverance's Jezero Crater touchdown.
 */
export const MARS_SITES: readonly SurfaceSite[] = [
  {
    id: "gale",
    name: "Gale Crater (Curiosity)",
    latDeg: -4.5895,
    lonEastDeg: 137.4417,
    landingSite: true,
    source: "NASA/JPL MSL Curiosity landing site (Bradbury Landing), Aug 2012",
  },
  {
    id: "jezero",
    name: "Jezero Crater (Perseverance)",
    latDeg: 18.4447,
    lonEastDeg: 77.4508,
    landingSite: true,
    source:
      "NASA/JPL Mars 2020 Perseverance landing site (Octavia E. Butler Landing), Feb 2021",
  },
] as const;

function validSite(site: unknown): site is SurfaceSite {
  return (
    typeof site === "object" &&
    site !== null &&
    finite((site as SurfaceSite).latDeg) &&
    finite((site as SurfaceSite).lonEastDeg)
  );
}

/**
 * Sun altitude/azimuth in a Mars site's sky at a UTC instant. Declination and
 * subsolar longitude come from the validated Mars24 machinery
 * (lib/mars-time.ts marsSubsolarPoint); the hour angle is
 * H = siteLonEast − subsolarLonEast, which equals 15° per Mars-hour of local
 * mean solar time past local noon (both are built from MTC — see module
 * header). Alt/az via the lib/celestial Meeus 13.5/13.6 trig, azimuth from
 * North, clockwise. Null on bad input; never throws.
 */
export function marsSunPosition(
  site: SurfaceSite,
  date: Date
): SkyPosition | null {
  if (!validSite(site) || !isValidDate(date)) return null;
  const subsolar = marsSubsolarPoint(date);
  const H = norm180(site.lonEastDeg - subsolar.lon);
  return altAzFromHourAngle(site.latDeg, subsolar.lat, H);
}

export type MarsDaylightPhase = "day" | "twilight" | "night";

/**
 * Twilight convention: we call it "twilight" while the Sun's centre is between
 * 0° and −6° altitude — the CIVIL-twilight band by direct analogy with Earth's
 * definition (US Naval Observatory). On Mars, high-altitude dust actually
 * scatters usable light for a while longer than on Earth, so −6° is a
 * conservative, clearly-labeled convention, not a measured Martian threshold.
 */
export const MARS_TWILIGHT_SUN_ALT_DEG = -6;

export interface MarsDaylight {
  phase: MarsDaylightPhase;
  /** Sun altitude used for the phase decision [deg] */
  sunAltitudeDeg: number;
  /** Local Mean Solar Time at the site, decimal hours 0–24 (Mars24 C-4) */
  localMeanSolarTimeHours: number;
  /** integer sol number = floor(Mars Sol Date) (Mars24 C-2) */
  sol: number;
  /** areocentric solar longitude Ls [deg, 0–360) */
  ls: number;
  /** northern-hemisphere season label (lib/mars-time convention) */
  season: MarsSeason;
}

/**
 * Day/twilight/night state plus the local Mars clock for a site. All time
 * quantities are the validated Mars24 values (lib/mars-time.ts). Null on bad
 * input.
 */
export function marsDaylight(
  site: SurfaceSite,
  date: Date
): MarsDaylight | null {
  const sun = marsSunPosition(site, date);
  if (sun === null) return null;
  const alt = sun.altitudeDeg;
  const phase: MarsDaylightPhase =
    alt > 0 ? "day" : alt > MARS_TWILIGHT_SUN_ALT_DEG ? "twilight" : "night";
  return {
    phase,
    sunAltitudeDeg: alt,
    localMeanSolarTimeHours: localMeanSolarTime(date, site.lonEastDeg),
    sol: Math.floor(marsSolDate(date)),
    ls: solarLongitude(date),
    season: marsSeason(date),
  };
}

export type MarsSkyRegime =
  | "butterscotch-day"
  | "blue-sunset"
  | "twilight"
  | "night";

export interface MarsSkyStory {
  regime: MarsSkyRegime;
  /** honest one-line physical explanation of the regime */
  explanation: string;
  /**
   * RENDERING SUGGESTION ONLY — a plausible palette for the renderer, NOT a
   * measured spectrum. The regime + explanation are the cited science; the hex
   * values are an artistic hint the renderer may restyle.
   */
  suggestedPalette: readonly string[];
  /** observational basis for the regime (NASA/JPL imagery) */
  citation: string;
}

/**
 * The REAL Martian sky-colour regimes, keyed off Sun altitude, as descriptive
 * data for the renderer:
 *
 *   • Daytime: butterscotch/salmon sky — suspended iron-oxide dust scatters
 *     red-orange light across the whole sky (the reverse of Earth's Rayleigh
 *     blue). Seen in every colour-calibrated lander/rover image since Viking.
 *   • Sunset/sunrise (Sun low or just below the horizon): the sky NEAR THE SUN
 *     glows BLUE — fine ~micron dust grains forward-scatter blue light toward
 *     the observer while redder light is scattered out of the beam. This is
 *     the famous "blue sunset", the exact reverse of Earth. Observational
 *     basis: Curiosity's Gale Crater sunset sequence, sol 956 (2015-04-15,
 *     NASA/JPL-Caltech/MSSS), among many others.
 *
 * Thresholds: "blue-sunset" while the Sun is within ±[0, 10]° of the horizon
 * above, "twilight" 0…−6° (see {@link MARS_TWILIGHT_SUN_ALT_DEG}), "night"
 * below −6°. The 10° low-Sun band is a labeled rendering convention for when
 * the forward-scatter blue patch is prominent, not a measured cutoff.
 * Null on non-finite input.
 */
export function marsSkyStory(sunAltitudeDeg: number): MarsSkyStory | null {
  if (!finite(sunAltitudeDeg)) return null;
  if (sunAltitudeDeg > 10) {
    return {
      regime: "butterscotch-day",
      explanation:
        "Suspended iron-oxide dust scatters red-orange light: a butterscotch/salmon daytime sky (reverse of Earth's Rayleigh blue).",
      suggestedPalette: ["#c9a06a", "#d8a978", "#b5834f"],
      citation:
        "NASA/JPL colour-calibrated surface imagery (Viking through Perseverance)",
    };
  }
  if (sunAltitudeDeg > 0) {
    return {
      regime: "blue-sunset",
      explanation:
        "Near the low Sun the sky glows blue: fine ~micron dust forward-scatters blue light toward the observer — Mars's sunsets are blue, the reverse of Earth.",
      suggestedPalette: ["#6b8fb5", "#8aa6c2", "#b5834f"],
      citation:
        "Curiosity Gale Crater sunset sequence, sol 956 (2015-04-15, NASA/JPL-Caltech/MSSS)",
    };
  }
  if (sunAltitudeDeg > MARS_TWILIGHT_SUN_ALT_DEG) {
    return {
      regime: "twilight",
      explanation:
        "Sun below the horizon; high dust keeps scattering a fading blue-grey glow near the sunset point.",
      suggestedPalette: ["#4a5d78", "#6b7a8f", "#2e3644"],
      citation:
        "Curiosity Gale Crater sunset sequence, sol 956 (2015-04-15, NASA/JPL-Caltech/MSSS)",
    };
  }
  return {
    regime: "night",
    explanation:
      "Sun more than 6 degrees below the horizon: dark sky; with ~1% of Earth's atmospheric column, stars are crisp when dust is low.",
    suggestedPalette: ["#0a0d14", "#141824", "#1c2230"],
    citation: "NASA Mars Fact Sheet (atmospheric column); rover night imaging",
  };
}

/** Total solar irradiance at 1 AU [W/m²] — Kopp & Lean (2011), TIM/SORCE. */
export const SOLAR_CONSTANT_1AU_WM2 = 1361;

/**
 * TOP-OF-ATMOSPHERE solar irradiance at Mars [W/m²] at the date's TRUE
 * Mars–Sun distance r (lib/planets heliocentricPosition, JPL mean elements):
 * inverse-square law, S = 1361 · (1 AU / r)². Ranges ~493 W/m² (aphelion
 * 1.666 AU) to ~713 W/m² (perihelion 1.381 AU). SURFACE irradiance is lower
 * and strongly dust-dependent; we deliberately do not invent a surface number.
 * Null on bad input.
 */
export function marsSolarIrradiance(date: Date): number | null {
  if (!isValidDate(date)) return null;
  const r = heliocentricPosition("Mars", date).distanceAU;
  return SOLAR_CONSTANT_1AU_WM2 / (r * r);
}

/**
 * Real Mars surface facts — NASA/GSFC Mars Fact Sheet
 * (https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html).
 */
export const marsSurfaceFacts = {
  surfaceGravityMs2: 3.71,
  meanSurfacePressurePa: 610,
  /** diurnal/seasonal surface temperature range [°C] (Fact Sheet extremes) */
  temperatureRangeC: { min: -143, max: 35 },
  meanTemperatureC: -63,
  solLength: "24h 39m 35.244s",
  source: "NASA/GSFC Mars Fact Sheet (nssdc.gsfc.nasa.gov)",
} as const;

// ═══════════════════════════════ PART B: TITAN ═════════════════════════════

/** Saturn equatorial radius [km] — NASA/GSFC Saturn Fact Sheet. */
export const SATURN_EQ_RADIUS_KM = 60_268;

/** Titan's orbital distance from Saturn's centre [km] — NASA Titan facts. */
export const TITAN_ORBIT_RADIUS_KM = 1_221_870;

/**
 * Titan's sidereal orbital = rotational period [Earth days] (tidally locked)
 * — JPL SSD SAT441 (same value carried in lib/saturn-moons.ts).
 */
export const TITAN_SIDEREAL_PERIOD_DAYS = 15.945448;

/** Saturn's sidereal orbital period [Earth years] — NASA/GSFC Fact Sheet. */
const SATURN_ORBIT_YEARS = 29.447498;

/**
 * Titan's mean SOLAR day [Earth days]: Titan rotates once per orbit (tidally
 * locked), but Saturn (and Titan with it) moves ~1/29.46 yr around the Sun, so
 * the solar day is slightly longer than the sidereal period:
 * 1/P_solar = 1/P_sid − 1/P_orb(Saturn) ⇒ ≈ 15.97 d (vs 15.945 d sidereal).
 * Same synodic derivation as lib/planets solarDayEarthDays.
 */
export const TITAN_SOLAR_DAY_DAYS =
  1 /
  (1 / TITAN_SIDEREAL_PERIOD_DAYS - 1 / (SATURN_ORBIT_YEARS * 365.25));

/**
 * Titan viewpoints. Huygens is the REAL landing site (ESA/JPL post-flight
 * descent-trajectory reconstruction ~10.573°S, 192.35°W = 167.65°E; published
 * reconstructions vary by a few hundredths of a degree — these are the values
 * we adopt and cite). "Sub-Saturn viewpoint" is a CHOSEN viewpoint (0°, 0°E,
 * the point where Saturn is at zenith), NOT a landing site — labeled as such.
 */
export const TITAN_SITES: readonly SurfaceSite[] = [
  {
    id: "huygens",
    name: "Huygens landing site",
    latDeg: -10.573,
    lonEastDeg: 167.65,
    landingSite: true,
    source:
      "ESA/JPL Huygens post-flight descent reconstruction (~10.573 S, 192.35 W), landed 2005-01-14",
  },
  {
    id: "sub-saturn",
    name: "Sub-Saturn viewpoint",
    latDeg: 0,
    lonEastDeg: 0,
    landingSite: false,
    source:
      "Chosen viewpoint at the sub-Saturn point (0, 0) — not a landing site",
  },
] as const;

/**
 * Saturn's apparent angular DIAMETER from Titan's surface [deg]:
 * 2·atan(R_Saturn / d) = 2·atan(60268 / 1221870) ≈ 5.65°. For comparison the
 * Moon from Earth is ~0.52°, so Saturn fills ~11× the Moon's apparent width
 * (and ~120× its area) in Titan's sky. Real geometry from cited radii.
 */
export const SATURN_ANGULAR_DIAMETER_FROM_TITAN_DEG =
  2 * Math.atan(SATURN_EQ_RADIUS_KM / TITAN_ORBIT_RADIUS_KM) * RAD2DEG;

export interface SaturnInTitanSky extends SkyPosition {
  /** true iff Saturn's centre is above the geometric horizon at this site */
  visible: boolean;
  /** Saturn's apparent angular diameter from Titan [deg] (~5.65) */
  angularDiameterDeg: number;
  /** honest caveat: haze would blur the view even where Saturn is up */
  hazeCaveat: string;
}

/**
 * Saturn's FIXED position in a Titan site's sky. Titan is tidally locked to
 * Saturn (rotation = orbit, JPL SAT441), so Saturn hangs at an essentially
 * constant point in the sky determined purely by the site: with the sub-Saturn
 * point at (0°, 0°E),
 *
 *   altitude = 90° − angularDistance(site, sub-Saturn point)
 *   cos(angularDistance) = cos(lat)·cos(lonEast)
 *
 * and the azimuth is the initial great-circle bearing from the site toward
 * (0, 0), from North clockwise. (Titan's small eccentricity e≈0.029 makes
 * Saturn librate a couple of degrees about this point; we return the mean
 * position.) HONESTY: at the real Huygens site (167.65°E — nearly the
 * anti-Saturn meridian) Saturn is far BELOW the horizon: visible=false. And
 * even where Saturn is up, Titan's thick photochemical haze (the reason
 * Cassini needed radar/IR to see the surface) means you would not see it
 * crisply from the ground — carried as `hazeCaveat`. Null on bad input.
 */
export function saturnInTitanSky(site: SurfaceSite): SaturnInTitanSky | null {
  if (!validSite(site)) return null;
  const lat = site.latDeg * DEG2RAD;
  const lon = site.lonEastDeg * DEG2RAD;

  // Angular distance from the sub-Saturn point (0, 0).
  const cosC = clamp(Math.cos(lat) * Math.cos(lon), -1, 1);
  const altitudeDeg = 90 - Math.acos(cosC) * RAD2DEG;

  // Initial bearing from site → (0, 0): standard great-circle bearing with
  // lat2 = 0, Δlon = 0 − lonEast. From North, clockwise.
  const dLon = -lon;
  const y = Math.sin(dLon) * 1; // cos(lat2) = 1
  const x = Math.cos(lat) * 0 - Math.sin(lat) * 1 * Math.cos(dLon);
  const azimuthDeg = norm360(Math.atan2(y, x) * RAD2DEG);

  return {
    altitudeDeg,
    azimuthDeg,
    visible: altitudeDeg > 0,
    angularDiameterDeg: SATURN_ANGULAR_DIAMETER_FROM_TITAN_DEG,
    hazeCaveat:
      "Titan's thick photochemical haze scatters most light; even where Saturn is above the horizon it would appear as a diffuse glow, not a crisp disc (Cassini-Huygens).",
  };
}

export interface TitanSunPosition extends SkyPosition {
  /** honest label: the rotational phase epoch is adopted, not measured */
  phaseNote: string;
}

/**
 * APPROXIMATE Sun altitude/azimuth in a Titan site's sky.
 *
 * What is REAL: the solar-day RATE ({@link TITAN_SOLAR_DAY_DAYS} ≈ 15.97 Earth
 * days, from Titan's tidally locked 15.945448-day orbit + Saturn's 29.46-yr
 * year), the seasonal solar declination (Titan orbits within ~0.3° of Saturn's
 * equatorial plane, so its seasons track Saturn's 26.73° obliquity — computed
 * with lib/planets subSolarLatitude("Saturn"), which itself carries a
 * documented adopted season zero-point), and the alt/az spherical trig.
 *
 * What is ADOPTED: the absolute rotational phase. We adopt subsolar
 * longitude = 0°E at the J2000 epoch as a documented convention — pinning the
 * true phase would require Titan's IAU prime-meridian constant against
 * Saturn's orbital position, beyond this layer. So do NOT read this as a
 * precise "local time on Titan": the daylight-cycle rate and geometry are
 * physical; the epoch registration is conventional (carried in `phaseNote`).
 * Null on bad input.
 */
export function titanSunPosition(
  site: SurfaceSite,
  date: Date
): TitanSunPosition | null {
  if (!validSite(site) || !isValidDate(date)) return null;

  const daysSinceJ2000 = (date.getTime() - J2000_UNIX_MS) / DAY_MS;
  // Subsolar longitude sweeps a full 360° WESTWARD per solar day (prograde
  // rotator, like Mars/Earth), from the adopted 0°E at J2000.
  const subsolarLonEast = norm180(
    -360 * (daysSinceJ2000 / TITAN_SOLAR_DAY_DAYS)
  );
  const decDeg = subSolarLatitude("Saturn", date);
  const H = norm180(site.lonEastDeg - subsolarLonEast);
  const pos = altAzFromHourAngle(site.latDeg, decDeg, H);
  return {
    ...pos,
    phaseNote:
      "Solar-day rate and geometry are real; the absolute rotational phase uses an adopted J2000 epoch convention (approximate, not a measured Titan local time).",
  };
}

/**
 * TOP-OF-ATMOSPHERE solar irradiance at Titan [W/m²] at Saturn's TRUE current
 * heliocentric distance (lib/planets): S = 1361 · (1 AU / r)² ≈ 15 W/m² at
 * Saturn's ~9.5 AU (~1.1% of Earth's). At the SURFACE Titan's haze cuts
 * daylight to roughly 0.1% of Earth's — a bright-twilight level (Huygens DISR
 * measurements) — which we report as a fact, not a computed spectrum.
 * Null on bad input.
 */
export function titanSolarIrradiance(date: Date): number | null {
  if (!isValidDate(date)) return null;
  const r = heliocentricPosition("Saturn", date).distanceAU;
  return SOLAR_CONSTANT_1AU_WM2 / (r * r);
}

/**
 * Real Titan surface facts — NASA/ESA Cassini–Huygens mission results and
 * NASA/NSSDCA Titan fact pages.
 */
export const titanSurfaceFacts = {
  surfaceTemperatureK: 94,
  surfacePressureBar: 1.5,
  surfacePressureAtm: 1.45,
  surfaceGravityMs2: 1.352,
  /** fraction of Earth's surface daylight that reaches Titan's ground */
  surfaceDaylightVsEarth: 0.001,
  daylightDescription:
    "About 0.1% of Earth's daylight — a bright-twilight level; the Sun is a bright smudge through the haze (Huygens DISR).",
  methaneCycle:
    "Methane plays water's role: drizzle from the haze, river channels, and hydrocarbon lakes and seas concentrated at the poles (Cassini radar).",
  huygensLanding:
    "ESA's Huygens probe landed 2005-01-14 and returned the only photographs ever taken from Titan's surface.",
  surfaceMaterial:
    "Damp sand-like ground strewn with rounded pebbles of water ice (Huygens DISR imagery and penetrometer).",
  source: "NASA/ESA Cassini-Huygens; NASA NSSDCA Titan fact pages",
} as const;

// ═══════════════════════ Bundled per-world surface state ═══════════════════

export interface MarsSurfaceState {
  world: "mars";
  site: SurfaceSite;
  sun: SkyPosition;
  daylight: MarsDaylight;
  sky: MarsSkyStory;
  /** top-of-atmosphere solar irradiance [W/m²] at the true Mars–Sun distance */
  irradianceTopWm2: number;
  facts: typeof marsSurfaceFacts;
  /** module honesty contract, for the HUD */
  honesty: string;
}

export interface TitanSurfaceState {
  world: "titan";
  site: SurfaceSite;
  sun: TitanSunPosition;
  saturn: SaturnInTitanSky;
  /** top-of-atmosphere solar irradiance [W/m²] at the true Saturn–Sun distance */
  irradianceTopWm2: number;
  facts: typeof titanSurfaceFacts;
  honesty: string;
}

export type SurfaceState = MarsSurfaceState | TitanSurfaceState;

/** All site lists, keyed by world, for the tab's site picker. */
export const SURFACE_SITES: Record<SurfaceWorld, readonly SurfaceSite[]> = {
  mars: MARS_SITES,
  titan: TITAN_SITES,
};

/** Look up a site by world + id. Null if unknown. */
export function getSurfaceSite(
  world: SurfaceWorld,
  siteId: string
): SurfaceSite | null {
  const list = SURFACE_SITES[world];
  if (!list) return null;
  return list.find((s) => s.id === siteId) ?? null;
}

/**
 * Everything the Surfaces-tab renderer needs in one pure call (mirrors
 * marsClock / planetState): sun alt/az, daylight phase and local time where
 * real (Mars), Saturn-in-sky (Titan), irradiance and cited facts. "Live" means
 * live SIMULATION of these quantities — no streaming cameras exist on any
 * planetary surface. Null on unknown world/site or bad date; never throws.
 */
export function surfaceState(
  world: SurfaceWorld,
  siteId: string,
  date: Date
): SurfaceState | null {
  if (!isValidDate(date)) return null;
  const site = getSurfaceSite(world, siteId);
  if (site === null) return null;

  if (world === "mars") {
    const sun = marsSunPosition(site, date);
    const daylight = marsDaylight(site, date);
    const irradiance = marsSolarIrradiance(date);
    if (sun === null || daylight === null || irradiance === null) return null;
    const sky = marsSkyStory(sun.altitudeDeg);
    if (sky === null) return null;
    return {
      world: "mars",
      site,
      sun,
      daylight,
      sky,
      irradianceTopWm2: irradiance,
      facts: marsSurfaceFacts,
      honesty:
        "Mars sky fully computed from the validated Mars24/GISS machinery (lib/mars-time). Terrain/appearance in the renderer is illustrative.",
    };
  }

  const sun = titanSunPosition(site, date);
  const saturn = saturnInTitanSky(site);
  const irradiance = titanSolarIrradiance(date);
  if (sun === null || saturn === null || irradiance === null) return null;
  return {
    world: "titan",
    site,
    sun,
    saturn,
    irradianceTopWm2: irradiance,
    facts: titanSurfaceFacts,
    honesty:
      "Titan: real geometry (tidal locking, Saturn's size, solar-day rate) and real Cassini-Huygens facts; the rotational phase epoch is adopted (labeled) and terrain/appearance is illustrative.",
  };
}
