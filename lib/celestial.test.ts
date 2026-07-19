import { describe, expect, it } from "vitest";
import {
  CONSTELLATION_SPHERE_RADIUS,
  bvToColor,
  bvToRgb,
  bvToTemperatureK,
  equatorialToHorizontal,
  greenwichMeanSiderealTimeDeg,
  isAboveHorizon,
  julianCenturiesJ2000,
  julianDate,
  localSiderealTimeDeg,
  localSiderianTimeDeg,
  magnitudeToOpacity,
  magnitudeToSize,
  pcToLightYears,
  raDecToVector3,
  raDegToHours,
  raHoursToDeg,
  relativeBrightness,
  temperatureToRgb,
  vector3ToRaDec,
} from "./celestial";

/**
 * Physics acceptance tests for the celestial-coordinate layer. Reference values
 * and their sources:
 *   • Coordinate convention: matches lib/geo (N. celestial pole → +Y, RA 0h → +X).
 *   • B−V → temperature: Ballesteros (2012), EPL 97 34008. Sun B−V≈0.63,
 *     Vega≈0.0, Betelgeuse≈1.85 (SIMBAD / Johnson photometry).
 *   • GMST: Meeus, *Astronomical Algorithms*, example 12.a — 1987-04-10 0h UT →
 *     GMST = 13h10m46.3668s = 197.693195°.
 *   • equatorial→horizontal: Meeus example 13.b — 1987-04-10 19:21:00 UT, from
 *     lon 77.065556° W, lat +38.921389°, a body at RA 347.3193375°,
 *     Dec −6.719892° → altitude 15.1249°, azimuth (from S) 68.0337° ⇒
 *     (from N) 248.0337°.
 */

const DEG2RAD = Math.PI / 180;

// ─────────────────────── 1. celestial-sphere position ──────────────────────

describe("raDecToVector3 convention (matches lib/geo handedness)", () => {
  it("puts the north celestial pole (Dec +90) on +Y (unit)", () => {
    const [x, y, z] = raDecToVector3(0, 90, 1);
    expect(y).toBeCloseTo(1, 9);
    expect(Math.hypot(x, z)).toBeLessThan(1e-9);
  });

  it("puts the south celestial pole (Dec −90) on −Y", () => {
    const [x, y, z] = raDecToVector3(123, -90, 1);
    expect(y).toBeCloseTo(-1, 9);
    expect(Math.hypot(x, z)).toBeLessThan(1e-9);
  });

  it("puts RA 0h on the celestial equator on +X", () => {
    const [x, y, z] = raDecToVector3(0, 0, 1);
    expect(x).toBeCloseTo(1, 9);
    expect(y).toBeCloseTo(0, 9);
    expect(z).toBeCloseTo(0, 9);
  });

  it("puts RA 6h (=90°) on the equator on −Z (east of RA 0)", () => {
    const [x, y, z] = raDecToVector3(90, 0, 1);
    expect(z).toBeCloseTo(-1, 9);
    expect(Math.hypot(x, y)).toBeLessThan(1e-9);
  });

  it("honors the explicit formula x=r·cosδ·cosα, y=r·sinδ, z=−r·cosδ·sinα", () => {
    const ra = 57;
    const dec = 23;
    const r = 4.2;
    const [x, y, z] = raDecToVector3(ra, dec, r);
    expect(x).toBeCloseTo(r * Math.cos(dec * DEG2RAD) * Math.cos(ra * DEG2RAD), 9);
    expect(y).toBeCloseTo(r * Math.sin(dec * DEG2RAD), 9);
    expect(z).toBeCloseTo(-r * Math.cos(dec * DEG2RAD) * Math.sin(ra * DEG2RAD), 9);
  });

  it("defaults to the constellation-sphere radius", () => {
    const a = raDecToVector3(200, -12);
    const b = raDecToVector3(200, -12, CONSTELLATION_SPHERE_RADIUS);
    expect(a).toEqual(b);
  });
});

describe("vector3ToRaDec round trip", () => {
  const stars: Array<[string, number, number]> = [
    ["Sirius", 101.287, -16.716],
    ["Vega", 279.234, 38.784],
    ["Polaris", 37.954, 89.264],
    ["Betelgeuse", 88.793, 7.407],
    ["Rigel", 78.634, -8.202],
    ["Acrux", 186.65, -63.099],
  ];

  it.each(stars)("%s survives RA/Dec → vector → RA/Dec", (_n, ra, dec) => {
    const [x, y, z] = raDecToVector3(ra, dec, 7.5);
    const out = vector3ToRaDec(x, y, z);
    expect(out.raDeg).toBeCloseTo(ra, 4);
    expect(out.decDeg).toBeCloseTo(dec, 4);
  });

  it("normalizes recovered RA into [0, 360)", () => {
    const { raDeg } = vector3ToRaDec(...raDecToVector3(350, 5, 2));
    expect(raDeg).toBeGreaterThanOrEqual(0);
    expect(raDeg).toBeLessThan(360);
    expect(raDeg).toBeCloseTo(350, 4);
  });
});

// ─────────────────────────── RA hour ↔ degree helper ───────────────────────

describe("raHoursToDeg / raDegToHours", () => {
  it("1h = 15°, 24h = 360°", () => {
    expect(raHoursToDeg(1)).toBe(15);
    expect(raHoursToDeg(24)).toBe(360);
    expect(raHoursToDeg(6)).toBe(90);
  });

  it("is invertible", () => {
    expect(raDegToHours(raHoursToDeg(13.179546))).toBeCloseTo(13.179546, 9);
  });
});

// ─────────────────────── 2. star colour from B−V index ─────────────────────

describe("bvToTemperatureK (Ballesteros 2012)", () => {
  it("Sun (B−V≈0.63) → ~5700–5900 K", () => {
    const t = bvToTemperatureK(0.63)!;
    expect(t).toBeGreaterThan(5700);
    expect(t).toBeLessThan(5900);
  });

  it("Vega (B−V≈0.0) → hot, blue-white ~9000–10500 K", () => {
    const t = bvToTemperatureK(0.0)!;
    expect(t).toBeGreaterThan(9000);
    expect(t).toBeLessThan(10500);
  });

  it("Betelgeuse (B−V≈1.85) → cool red ~3100–3700 K", () => {
    const t = bvToTemperatureK(1.85)!;
    expect(t).toBeGreaterThan(3100);
    expect(t).toBeLessThan(3700);
  });

  it("is monotonically decreasing in B−V (redder ⇒ cooler)", () => {
    for (let bv = -0.3; bv < 1.9; bv += 0.1) {
      expect(bvToTemperatureK(bv)!).toBeGreaterThan(bvToTemperatureK(bv + 0.1)!);
    }
  });

  it("null / missing / NaN B−V → null", () => {
    expect(bvToTemperatureK(null)).toBeNull();
    expect(bvToTemperatureK(undefined)).toBeNull();
    expect(bvToTemperatureK(NaN)).toBeNull();
  });
});

describe("bvToColor / bvToRgb (blackbody colour)", () => {
  it("Sun (0.63) is a warm yellow-white: R ≥ B, all channels bright", () => {
    const [r, g, b] = bvToRgb(0.63);
    expect(r).toBeGreaterThanOrEqual(b); // warmer than blue
    expect(b).toBeGreaterThan(180); // still whitish, not saturated
    expect(g).toBeGreaterThan(180);
    expect(r).toBe(255);
  });

  it("Vega (0.0) is blue-white: blue dominant", () => {
    const [r, , b] = bvToRgb(0.0);
    expect(b).toBeGreaterThanOrEqual(r);
    expect(b).toBe(255);
  });

  it("Betelgeuse (1.85) is red: R strongly dominates B", () => {
    const [r, , b] = bvToRgb(1.85);
    expect(r).toBe(255);
    expect(r - b).toBeGreaterThan(80); // clearly red, not white
  });

  it("returns a #rrggbb hex string", () => {
    expect(bvToColor(0.63)).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("null / missing B−V → neutral white", () => {
    expect(bvToColor(null)).toBe("#ffffff");
    expect(bvToColor(undefined)).toBe("#ffffff");
    expect(bvToRgb(null)).toEqual([255, 255, 255]);
  });
});

describe("temperatureToRgb", () => {
  it("very hot (30000 K) → blue-dominant", () => {
    const [r, , b] = temperatureToRgb(30000)!;
    expect(b).toBeGreaterThanOrEqual(r);
    expect(b).toBe(255);
  });

  it("very cool (3000 K) → red-dominant", () => {
    const [r, , b] = temperatureToRgb(3000)!;
    expect(r).toBeGreaterThan(b);
    expect(r).toBe(255);
  });

  it("non-finite → null", () => {
    expect(temperatureToRgb(NaN)).toBeNull();
    expect(temperatureToRgb(null)).toBeNull();
  });
});

// ─────────────────── 3. magnitude → render size / brightness ────────────────

describe("magnitudeToSize / magnitudeToOpacity", () => {
  it("brighter (smaller mag) ⇒ larger size", () => {
    const sirius = magnitudeToSize(-1.46)!;
    const vega = magnitudeToSize(0.03)!;
    const faint = magnitudeToSize(6.0)!;
    expect(sirius).toBeGreaterThan(vega);
    expect(vega).toBeGreaterThan(faint);
  });

  it("clamps to [minSize, maxSize] outside the magnitude window", () => {
    const opts = { minSize: 0.6, maxSize: 3, brightestMag: -1.5, limitMag: 6.5 };
    expect(magnitudeToSize(-5, opts)!).toBeCloseTo(3, 9); // Sun-bright, clamped up
    expect(magnitudeToSize(12, opts)!).toBeCloseTo(0.6, 9); // telescopic, clamped down
    expect(magnitudeToSize(-1.5, opts)!).toBeCloseTo(3, 9);
    expect(magnitudeToSize(6.5, opts)!).toBeCloseTo(0.6, 9);
  });

  it("brighter ⇒ more opaque, within [minOpacity, maxOpacity]", () => {
    expect(magnitudeToOpacity(-1.46)!).toBeGreaterThan(magnitudeToOpacity(6)!);
    for (const m of [-1.46, 0, 2, 4, 6.5]) {
      const o = magnitudeToOpacity(m)!;
      expect(o).toBeGreaterThanOrEqual(0.35);
      expect(o).toBeLessThanOrEqual(1);
    }
  });

  it("non-finite magnitude → null (never throws)", () => {
    expect(magnitudeToSize(NaN)).toBeNull();
    expect(magnitudeToSize(null)).toBeNull();
    expect(magnitudeToOpacity(undefined)).toBeNull();
  });
});

describe("relativeBrightness (Pogson's law)", () => {
  it("Δ5 mag = flux ratio of exactly 100", () => {
    expect(relativeBrightness(5, 0)!).toBeCloseTo(0.01, 12);
    expect(relativeBrightness(0, 5)!).toBeCloseTo(100, 9);
  });

  it("Δ1 mag ≈ 2.512×", () => {
    expect(relativeBrightness(0, 1)!).toBeCloseTo(2.511886, 5);
  });

  it("non-finite → null", () => {
    expect(relativeBrightness(NaN)).toBeNull();
  });
});

// ─────────────────────────── 4. sidereal time ──────────────────────────────

describe("julianDate / julianCenturiesJ2000", () => {
  it("J2000.0 (2000-01-01 12:00 UT) → JD 2451545.0, T = 0", () => {
    const j2000 = new Date(Date.UTC(2000, 0, 1, 12));
    expect(julianDate(j2000)).toBeCloseTo(2451545.0, 6);
    expect(julianCenturiesJ2000(j2000)).toBeCloseTo(0, 9);
  });

  it("1987-04-10 0h UT → JD 2446895.5 (Meeus example 12.a epoch)", () => {
    const d = new Date(Date.UTC(1987, 3, 10, 0));
    expect(julianDate(d)).toBeCloseTo(2446895.5, 6);
  });
});

describe("greenwichMeanSiderealTimeDeg (Meeus 12.4)", () => {
  it("matches Meeus example 12.a: 1987-04-10 0h UT → 197.693195°", () => {
    const gmst = greenwichMeanSiderealTimeDeg(
      new Date(Date.UTC(1987, 3, 10, 0))
    )!;
    expect(gmst).toBeCloseTo(197.693195, 4);
  });

  it("matches Meeus example 13.b instant: 1987-04-10 19:21:00 UT → ~128.7379°", () => {
    const gmst = greenwichMeanSiderealTimeDeg(
      new Date(Date.UTC(1987, 3, 10, 19, 21, 0))
    )!;
    expect(gmst).toBeCloseTo(128.7379, 2);
  });

  it("stays in [0, 360) and advances ~360.9856°/day (sidereal gain)", () => {
    const t0 = new Date(Date.UTC(2026, 6, 18, 3, 0, 0));
    const t1 = new Date(t0.getTime() + 86_400_000);
    const g0 = greenwichMeanSiderealTimeDeg(t0)!;
    const g1 = greenwichMeanSiderealTimeDeg(t1)!;
    expect(g0).toBeGreaterThanOrEqual(0);
    expect(g0).toBeLessThan(360);
    let d = g1 - g0;
    if (d < 0) d += 360;
    expect(d).toBeCloseTo(360.98564736629 - 360, 3); // ≈ 0.9856° extra per solar day
  });

  it("returns null on an invalid Date", () => {
    expect(greenwichMeanSiderealTimeDeg(new Date(NaN))).toBeNull();
  });
});

describe("localSiderealTimeDeg (LST = GMST + lon)", () => {
  it("equals GMST at longitude 0", () => {
    const d = new Date(Date.UTC(2026, 6, 18, 3));
    expect(localSiderealTimeDeg(d, 0)!).toBeCloseTo(
      greenwichMeanSiderealTimeDeg(d)!,
      9
    );
  });

  it("adds observer longitude (east-positive), wrapped to [0,360)", () => {
    const d = new Date(Date.UTC(2026, 6, 18, 3));
    const gmst = greenwichMeanSiderealTimeDeg(d)!;
    expect(localSiderealTimeDeg(d, 90)!).toBeCloseTo(((gmst + 90) % 360 + 360) % 360, 9);
    expect(localSiderealTimeDeg(d, -75)!).toBeCloseTo(((gmst - 75) % 360 + 360) % 360, 9);
  });

  it("localSiderianTimeDeg alias is the same function", () => {
    expect(localSiderianTimeDeg).toBe(localSiderealTimeDeg);
  });

  it("returns null on bad input", () => {
    expect(localSiderealTimeDeg(new Date(NaN), 0)).toBeNull();
    expect(localSiderealTimeDeg(new Date(), NaN)).toBeNull();
  });
});

// ────────────────────── 5. equatorial → horizontal ─────────────────────────

describe("equatorialToHorizontal — zenith & pole classics", () => {
  it("a star at Dec = latitude on the meridian (H=0) is at the zenith (alt ≈ 90°)", () => {
    // Choose lon = 0, then pick RA = LST so hour angle H = 0.
    const date = new Date(Date.UTC(2026, 6, 18, 3, 0, 0));
    const lat = 42.36; // Boston-ish
    const lst = localSiderealTimeDeg(date, 0)!;
    const hz = equatorialToHorizontal(lst, lat, lat, 0, date)!;
    expect(hz.altitude).toBeCloseTo(90, 4);
  });

  it("the north celestial pole (Dec +90) sits at altitude ≈ latitude, due North", () => {
    const date = new Date(Date.UTC(2026, 0, 15, 22, 30, 0));
    for (const lat of [0, 23.5, 42.36, 66.5]) {
      const hz = equatorialToHorizontal(0, 90, lat, 12.5, date)!;
      expect(hz.altitude).toBeCloseTo(lat, 6);
      if (lat > 0) expect(hz.azimuth).toBeCloseTo(0, 4); // due North
    }
  });

  it("a star on the celestial equator crossing the meridian is due South from the north", () => {
    const date = new Date(Date.UTC(2026, 3, 1, 8, 12, 0));
    const lon = -71.06;
    const lst = localSiderealTimeDeg(date, lon)!; // RA on the meridian
    const hz = equatorialToHorizontal(lst, 0, 45, lon, date)!;
    expect(hz.altitude).toBeCloseTo(45, 4); // 90 − lat
    expect(hz.azimuth).toBeCloseTo(180, 4); // due South
  });

  it("reproduces Meeus example 13.b (alt ≈ 15.12°, az_from_N ≈ 248.03°)", () => {
    // 1987-04-10 19:21:00 UT, lon 77.065556° W, lat +38.921389°,
    // body at RA 347.3193375°, Dec −6.719892°.
    const date = new Date(Date.UTC(1987, 3, 10, 19, 21, 0));
    const hz = equatorialToHorizontal(
      347.3193375,
      -6.719892,
      38.921389,
      -77.065556,
      date
    )!;
    expect(hz.altitude).toBeCloseTo(15.12, 1);
    expect(hz.azimuth).toBeCloseTo(248.03, 1);
  });

  it("altitude is bounded to [−90, 90] and azimuth to [0, 360)", () => {
    const date = new Date(Date.UTC(2026, 6, 18, 3));
    for (let ra = 0; ra < 360; ra += 37) {
      for (let dec = -80; dec <= 80; dec += 40) {
        const hz = equatorialToHorizontal(ra, dec, 40, -71, date)!;
        expect(hz.altitude).toBeGreaterThanOrEqual(-90);
        expect(hz.altitude).toBeLessThanOrEqual(90);
        expect(hz.azimuth).toBeGreaterThanOrEqual(0);
        expect(hz.azimuth).toBeLessThan(360);
      }
    }
  });

  it("returns null on any bad input (never throws)", () => {
    const date = new Date(Date.UTC(2026, 6, 18, 3));
    expect(equatorialToHorizontal(NaN, 0, 40, -71, date)).toBeNull();
    expect(equatorialToHorizontal(10, NaN, 40, -71, date)).toBeNull();
    expect(equatorialToHorizontal(10, 0, NaN, -71, date)).toBeNull();
    expect(equatorialToHorizontal(10, 0, 40, NaN, date)).toBeNull();
    expect(equatorialToHorizontal(10, 0, 40, -71, new Date(NaN))).toBeNull();
  });
});

describe("isAboveHorizon", () => {
  it("the north celestial pole is up from the north, down from the south", () => {
    const date = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));
    expect(isAboveHorizon(0, 90, 45, 0, date)).toBe(true); // +45° lat → alt +45°
    expect(isAboveHorizon(0, 90, -45, 0, date)).toBe(false); // southern hemi → below
  });

  it("agrees with the sign of altitude across a scan", () => {
    const date = new Date(Date.UTC(2026, 8, 21, 6, 30, 0));
    for (let ra = 0; ra < 360; ra += 23) {
      const hz = equatorialToHorizontal(ra, 10, 34, -118, date)!;
      expect(isAboveHorizon(ra, 10, 34, -118, date)).toBe(hz.altitude > 0);
    }
  });

  it("returns null (not false) on bad data, so callers can tell them apart", () => {
    expect(isAboveHorizon(NaN, 0, 40, -71, new Date())).toBeNull();
    expect(isAboveHorizon(10, 0, 40, -71, new Date(NaN))).toBeNull();
  });
});

// ─────────────────────────── helpers & determinism ─────────────────────────

describe("distance helpers", () => {
  it("pcToLightYears: 1 pc = 3.26156 ly", () => {
    expect(pcToLightYears(1)).toBeCloseTo(3.26156, 6);
    expect(pcToLightYears(1.3)).toBeCloseTo(4.24, 2); // Proxima Centauri
  });
});

describe("determinism", () => {
  it("equatorialToHorizontal is a pure function of its inputs", () => {
    const date = new Date(Date.UTC(2031, 1, 2, 3, 4, 5));
    const a = equatorialToHorizontal(101.287, -16.716, 42.36, -71.06, date);
    const b = equatorialToHorizontal(101.287, -16.716, 42.36, -71.06, date);
    expect(a).toEqual(b);
  });

  it("raDecToVector3 and bvToColor are deterministic", () => {
    expect(raDecToVector3(88.793, 7.407, 3)).toEqual(
      raDecToVector3(88.793, 7.407, 3)
    );
    expect(bvToColor(1.85)).toBe(bvToColor(1.85));
  });
});
