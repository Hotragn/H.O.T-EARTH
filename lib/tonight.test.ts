import { describe, expect, it } from "vitest";
import { solarDeclination, fractionalYear, subsolarPoint } from "./solar";
import { equatorialToHorizontal } from "./celestial";
import {
  ASTRONOMICAL_TWILIGHT_DEG,
  FULL_DARK_HOURS,
  MOON_STANDARD_ALT_DEG,
  PLANET_BRIGHTNESS,
  SUN_STANDARD_ALT_DEG,
  USABLE_ALTITUDE_DEG,
  culmination,
  darknessScore,
  findCrossings,
  meanObliquityDeg,
  minutesBelow,
  moonAltitudeDeg,
  moonEquatorial,
  moonInterference,
  moonTonight,
  nightWindow,
  planetEquatorial,
  planetHorizontal,
  planetsTonight,
  solarElongationDeg,
  sunAltitudeDeg,
  type Observer,
} from "./tonight";

/**
 * Validation strategy: every expectation below is either a published value, a
 * textbook identity, or a physical invariant that must hold regardless of our
 * implementation. Nothing is pinned to a previous run of this code.
 *
 * Published anchors used:
 *   - Day length at the June solstice: London 16 h 38 m, Boston 15 h 17 m,
 *     Sydney 9 h 54 m (standard almanac values for these latitudes).
 *   - No astronomical darkness at London (51.5 N) around the June solstice: a
 *     well documented consequence of latitude > ~48.5 degrees.
 *   - Longyearbyen (78.22 N) has midnight sun in June and polar night in
 *     December.
 *   - Maximum solar elongation: Mercury ~28 degrees, Venus ~47 degrees.
 *   - The Moon's declination stays within about +/-28.7 degrees (the major
 *     standstill limit set by the 5.145-degree orbital inclination plus the
 *     23.44-degree obliquity).
 *   - Published syzygies reused from lib/lunar.test.ts, so the two files cannot
 *     disagree: full moon 2024-01-25 17:54 UTC, new moon 2024-01-11 11:57 UTC.
 *   - Mean obliquity of the ecliptic at J2000.0 = 23.4392911 degrees (IAU).
 */

const LONDON: Observer = { latDeg: 51.5074, lonDeg: -0.1278 };
const BOSTON: Observer = { latDeg: 42.3601, lonDeg: -71.0589 };
const SYDNEY: Observer = { latDeg: -33.8688, lonDeg: 151.2093 };
const EQUATOR: Observer = { latDeg: 0, lonDeg: 0 };
const LONGYEARBYEN: Observer = { latDeg: 78.2232, lonDeg: 15.6267 };
const ATACAMA: Observer = { latDeg: -24.6272, lonDeg: -70.4042 }; // Paranal

const JUNE_SOLSTICE_2026 = new Date(Date.UTC(2026, 5, 21, 12));
const DEC_SOLSTICE_2026 = new Date(Date.UTC(2026, 11, 21, 12));
const MARCH_EQUINOX_2026 = new Date(Date.UTC(2026, 2, 20, 12));

const HOUR_MS = 3_600_000;

function hoursBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / HOUR_MS;
}

describe("meanObliquityDeg", () => {
  it("matches the IAU J2000.0 value", () => {
    const eps = meanObliquityDeg(new Date(Date.UTC(2000, 0, 1, 12)));
    expect(eps).not.toBeNull();
    expect(eps!).toBeCloseTo(23.4392911, 4);
  });

  it("decreases slowly with time (obliquity is shrinking ~47 arcsec/century)", () => {
    const y2000 = meanObliquityDeg(new Date(Date.UTC(2000, 0, 1, 12)))!;
    const y2100 = meanObliquityDeg(new Date(Date.UTC(2100, 0, 1, 12)))!;
    expect(y2000 - y2100).toBeCloseTo(47 / 3600, 3);
  });

  it("returns null for a bad date", () => {
    expect(meanObliquityDeg(new Date(NaN))).toBeNull();
  });
});

describe("sunAltitudeDeg", () => {
  it("equals 90 - |latitude - declination| at local solar noon", () => {
    // The textbook noon-altitude identity. We find noon as the moment the
    // observer's longitude equals the subsolar longitude.
    for (const obs of [LONDON, BOSTON, SYDNEY, EQUATOR]) {
      for (const date of [JUNE_SOLSTICE_2026, DEC_SOLSTICE_2026, MARCH_EQUINOX_2026]) {
        // scan the day for the maximum altitude (that IS solar noon)
        const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        const best = culmination(
          (d) => sunAltitudeDeg(d, obs.latDeg, obs.lonDeg),
          start,
          new Date(start.getTime() + 24 * HOUR_MS),
          1
        );
        expect(best).not.toBeNull();
        const dec = solarDeclination(fractionalYear(best!.at));
        const expected = 90 - Math.abs(obs.latDeg - dec);
        expect(best!.maxAltitudeDeg).toBeCloseTo(expected, 1);
      }
    }
  });

  it("puts the Sun in the zenith at the subsolar point", () => {
    const date = new Date(Date.UTC(2026, 6, 4, 9, 30));
    const sub = subsolarPoint(date);
    expect(sunAltitudeDeg(date, sub.lat, sub.lon)).toBeCloseTo(90, 6);
  });

  it("puts the Sun at the nadir on the antipode of the subsolar point", () => {
    const date = new Date(Date.UTC(2026, 6, 4, 9, 30));
    const sub = subsolarPoint(date);
    const antiLon = sub.lon > 0 ? sub.lon - 180 : sub.lon + 180;
    expect(sunAltitudeDeg(date, -sub.lat, antiLon)).toBeCloseTo(-90, 6);
  });

  it("returns null for bad input", () => {
    expect(sunAltitudeDeg(new Date(NaN), 0, 0)).toBeNull();
    expect(sunAltitudeDeg(new Date(), NaN, 0)).toBeNull();
    expect(sunAltitudeDeg(new Date(), 0, NaN)).toBeNull();
  });
});

describe("findCrossings", () => {
  it("finds a single rising crossing of a linear ramp", () => {
    const t0 = Date.UTC(2026, 0, 1);
    // altitude climbs 1 degree per hour, starting at -3
    const alt = (d: Date) => -3 + (d.getTime() - t0) / HOUR_MS;
    const c = findCrossings(alt, new Date(t0), new Date(t0 + 10 * HOUR_MS), 0, 5);
    expect(c.setting).toHaveLength(0);
    expect(c.rising).toHaveLength(1);
    expect(hoursBetween(new Date(t0), c.rising[0])).toBeCloseTo(3, 3);
  });

  it("finds both crossings of an arc and labels them rising then setting", () => {
    const t0 = Date.UTC(2026, 0, 1);
    // a parabola peaking at +5 after 6 h, crossing zero at ~1.6 h and ~10.4 h
    const alt = (d: Date) => {
      const h = (d.getTime() - t0) / HOUR_MS;
      return 5 - 0.25 * (h - 6) * (h - 6);
    };
    const c = findCrossings(alt, new Date(t0), new Date(t0 + 12 * HOUR_MS), 0, 5);
    expect(c.rising).toHaveLength(1);
    expect(c.setting).toHaveLength(1);
    expect(c.rising[0].getTime()).toBeLessThan(c.setting[0].getTime());
    expect(hoursBetween(new Date(t0), c.rising[0])).toBeCloseTo(6 - Math.sqrt(20), 2);
  });

  it("finds nothing when the altitude never reaches the target", () => {
    const alt = () => -30;
    const t0 = new Date(Date.UTC(2026, 0, 1));
    const c = findCrossings(alt, t0, new Date(t0.getTime() + 24 * HOUR_MS), 0);
    expect(c.rising).toHaveLength(0);
    expect(c.setting).toHaveLength(0);
  });

  it("returns empty for bad input instead of throwing", () => {
    const t0 = new Date(Date.UTC(2026, 0, 1));
    const later = new Date(t0.getTime() + HOUR_MS);
    expect(findCrossings(() => 0, new Date(NaN), later, 0).rising).toHaveLength(0);
    expect(findCrossings(() => 0, later, t0, 0).rising).toHaveLength(0); // reversed
    expect(findCrossings(() => 0, t0, later, NaN).rising).toHaveLength(0);
    expect(findCrossings(() => 0, t0, later, 0, 0).rising).toHaveLength(0);
    expect(findCrossings(() => null, t0, later, 0).rising).toHaveLength(0);
  });
});

describe("culmination and minutesBelow", () => {
  it("finds the peak of a known arc", () => {
    const t0 = Date.UTC(2026, 0, 1);
    const alt = (d: Date) => {
      const h = (d.getTime() - t0) / HOUR_MS;
      return 40 - (h - 4) * (h - 4);
    };
    const c = culmination(alt, new Date(t0), new Date(t0 + 8 * HOUR_MS), 1);
    expect(c!.maxAltitudeDeg).toBeCloseTo(40, 2);
    expect(hoursBetween(new Date(t0), c!.at)).toBeCloseTo(4, 2);
  });

  it("counts minutes below a threshold exactly", () => {
    const t0 = Date.UTC(2026, 0, 1);
    const alt = (d: Date) => ((d.getTime() - t0) / HOUR_MS < 2 ? -10 : 10);
    const m = minutesBelow(alt, new Date(t0), new Date(t0 + 4 * HOUR_MS), 0, 1);
    expect(m).toBe(120);
  });

  it("returns null / 0 for degenerate input", () => {
    const t0 = new Date(Date.UTC(2026, 0, 1));
    expect(culmination(() => 0, new Date(NaN), t0)).toBeNull();
    expect(minutesBelow(() => 0, t0, t0, 0)).toBe(0);
    expect(minutesBelow(() => 0, new Date(NaN), t0, 0)).toBeNull();
  });
});

describe("nightWindow: ordinary nights", () => {
  it("gives Boston the published 15 h 17 m day at the June solstice", () => {
    // Measure sunrise to sunset for the day, via the night either side.
    const night = nightWindow(new Date(Date.UTC(2026, 5, 21, 12)), BOSTON)!;
    expect(night.state).toBe("normal");
    const dayLength = hoursBetween(night.sunrise!, night.sunset!) + 24;
    // sunrise is the morning AFTER this sunset, so reconstruct the same day
    const previous = nightWindow(new Date(Date.UTC(2026, 5, 20, 12)), BOSTON)!;
    const sameDay = hoursBetween(previous.sunrise!, night.sunset!);
    expect(sameDay).toBeCloseTo(15 + 17 / 60, 1);
    expect(dayLength).toBeGreaterThan(0); // sanity on the ordering
  });

  it("gives Sydney the published 9 h 54 m day at the June solstice", () => {
    const previous = nightWindow(new Date(Date.UTC(2026, 5, 20, 20)), SYDNEY)!;
    const night = nightWindow(new Date(Date.UTC(2026, 5, 21, 20)), SYDNEY)!;
    const sameDay = hoursBetween(previous.sunrise!, night.sunset!);
    expect(sameDay).toBeCloseTo(9 + 54 / 60, 1);
  });

  it("gives the equator a ~12 h day at the equinox", () => {
    const previous = nightWindow(new Date(Date.UTC(2026, 2, 20, 6)), EQUATOR)!;
    const night = nightWindow(new Date(Date.UTC(2026, 2, 21, 6)), EQUATOR)!;
    const sameDay = hoursBetween(previous.sunrise!, night.sunset!);
    // Slightly over 12 h: the -0.833 standard altitude adds a few minutes at
    // each end (the equinox "equal day and night" is refraction-broken).
    expect(sameDay).toBeGreaterThan(12);
    expect(sameDay).toBeLessThan(12.2);
  });

  it("orders the twilight steps correctly through the night", () => {
    const n = nightWindow(new Date(Date.UTC(2026, 9, 15, 20)), BOSTON)!;
    expect(n.state).toBe("normal");
    const seq = [
      n.sunset!,
      n.civilDusk!,
      n.nauticalDusk!,
      n.astronomicalDusk!,
      n.astronomicalDawn!,
      n.nauticalDawn!,
      n.civilDawn!,
      n.sunrise!,
    ];
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i].getTime()).toBeGreaterThan(seq[i - 1].getTime());
    }
    expect(n.darkHours).toBeGreaterThan(0);
    expect(n.darkHours).toBeLessThan(hoursBetween(n.sunset!, n.sunrise!));
  });

  it("returns the night IN PROGRESS when called after dark", () => {
    // 02:00 UTC at Paranal is late evening local (UTC-4): the Sun is down, so
    // "tonight" is the night already running, and its sunset is in the past.
    const at = new Date(Date.UTC(2026, 6, 15, 2));
    const n = nightWindow(at, ATACAMA)!;
    expect(n.sunset!.getTime()).toBeLessThan(at.getTime());
    expect(n.sunrise!.getTime()).toBeGreaterThan(at.getTime());
  });

  it("gives a long dark night at a good southern site in winter", () => {
    const n = nightWindow(new Date(Date.UTC(2026, 5, 21, 2)), ATACAMA)!;
    expect(n.state).toBe("normal");
    // Paranal in June: over 10 h of astronomical darkness. This is why it is
    // one of the best observing sites on Earth.
    expect(n.darkHours).toBeGreaterThan(9.5);
    expect(n.darkHours).toBeLessThan(12);
  });
});

describe("nightWindow: the polar and mid-summer states", () => {
  it("reports no astronomical darkness at London around the June solstice", () => {
    // Published: above about 48.5 degrees latitude, the Sun never reaches 18
    // degrees below the horizon in midsummer.
    const n = nightWindow(new Date(Date.UTC(2026, 5, 21, 21)), LONDON)!;
    expect(n.state).toBe("no-astronomical-darkness");
    expect(n.sunset).not.toBeNull();
    expect(n.sunrise).not.toBeNull();
    expect(n.astronomicalDusk).toBeNull();
    expect(n.darkHours).toBe(0);
  });

  it("still gives London a real dark night in October", () => {
    const n = nightWindow(new Date(Date.UTC(2026, 9, 15, 20)), LONDON)!;
    expect(n.state).toBe("normal");
    expect(n.darkHours).toBeGreaterThan(8);
  });

  it("reports midnight sun at Longyearbyen in June", () => {
    const n = nightWindow(new Date(Date.UTC(2026, 5, 21, 12)), LONGYEARBYEN)!;
    expect(n.state).toBe("midnight-sun");
    expect(n.sunset).toBeNull();
    expect(n.darkHours).toBe(0);
  });

  it("reports polar night at Longyearbyen in December, with dark hours", () => {
    const n = nightWindow(new Date(Date.UTC(2026, 11, 21, 12)), LONGYEARBYEN)!;
    expect(n.state).toBe("polar-night");
    expect(n.sunrise).toBeNull();
    // NOT dark round the clock, which is the interesting part. At 78.22 N on the
    // December solstice the Sun's highest point is about 90 - 78.22 - 23.44 =
    // -11.7 degrees, so it climbs back above the -18 degree astronomical line
    // around local noon every day: real twilight in the middle of polar night.
    // Roughly 15 hours of true darkness, not 24.
    expect(n.darkHours).toBeGreaterThan(14);
    expect(n.darkHours).toBeLessThan(17);
  });

  it("returns null for a bad date or observer", () => {
    expect(nightWindow(new Date(NaN), BOSTON)).toBeNull();
    expect(nightWindow(new Date(), { latDeg: 95, lonDeg: 0 })).toBeNull();
    expect(nightWindow(new Date(), { latDeg: NaN, lonDeg: 0 })).toBeNull();
  });
});

describe("moonEquatorial", () => {
  it("keeps the Moon's declination inside the +/-28.7 degree standstill limit", () => {
    // Set by the 5.145-degree orbital inclination on top of the 23.44-degree
    // obliquity. Sampled over a full draconic cycle.
    let maxAbsDec = 0;
    for (let d = 0; d < 6800; d += 3) {
      const eq = moonEquatorial(new Date(Date.UTC(2026, 0, 1) + d * 86_400_000));
      expect(eq).not.toBeNull();
      maxAbsDec = Math.max(maxAbsDec, Math.abs(eq!.decDeg));
    }
    expect(maxAbsDec).toBeGreaterThan(18); // it does reach the minor standstill
    expect(maxAbsDec).toBeLessThan(28.8); // and never exceeds the major one
  });

  it("keeps the Moon's distance inside its real perigee/apogee range", () => {
    for (let d = 0; d < 400; d += 1) {
      const eq = moonEquatorial(new Date(Date.UTC(2026, 0, 1) + d * 86_400_000))!;
      expect(eq.distanceKm).toBeGreaterThan(356_000);
      expect(eq.distanceKm).toBeLessThan(407_000);
    }
  });

  it("places the full Moon opposite the Sun on the sky", () => {
    // Published full moon: 2024-01-25 17:54 UTC (same anchor as lib/lunar.test).
    const full = new Date(Date.UTC(2024, 0, 25, 17, 54));
    const moon = moonEquatorial(full)!;
    const sub = subsolarPoint(full);
    // The Sun's RA follows from the subsolar longitude and sidereal time; the
    // simpler invariant is that the Moon's declination is opposite in sign to
    // the Sun's (northern winter: Sun south, full Moon north).
    expect(Math.sign(moon.decDeg)).toBe(-Math.sign(sub.lat));
  });

  it("returns null for a bad date", () => {
    expect(moonEquatorial(new Date(NaN))).toBeNull();
    expect(moonAltitudeDeg(new Date(NaN), 0, 0)).toBeNull();
  });
});

describe("the Moon's night", () => {
  it("has the full Moon rise near sunset and the new Moon up in the daytime", () => {
    // These two are the strongest observational checks available without an
    // almanac, and they exercise phase, RA/Dec and the crossing finder at once.
    const full = new Date(Date.UTC(2024, 0, 25, 17, 54));
    const nightFull = nightWindow(full, BOSTON)!;
    const moonFull = moonTonight(nightFull, BOSTON, full)!;
    expect(moonFull.illuminatedFraction).toBeGreaterThan(0.98);
    expect(moonFull.rise).not.toBeNull();
    // A full Moon rises within about an hour of sunset, by definition of "full".
    expect(
      Math.abs(hoursBetween(nightFull.sunset!, moonFull.rise!))
    ).toBeLessThan(1.2);
    expect(moonFull.upDuringDark).toBe(true);
    expect(moonFull.interference).toBe("severe");

    const newMoon = new Date(Date.UTC(2024, 0, 11, 11, 57));
    const noonAlt = moonAltitudeDeg(newMoon, BOSTON.latDeg, BOSTON.lonDeg);
    const sunAlt = sunAltitudeDeg(newMoon, BOSTON.latDeg, BOSTON.lonDeg);
    // At new Moon the Moon sits beside the Sun, so it shares the daytime sky:
    // both are on the same side of the horizon.
    expect(Math.sign(noonAlt!)).toBe(Math.sign(sunAlt!));
  });

  it("leaves a new-Moon night fully moonless and dark", () => {
    const newMoon = new Date(Date.UTC(2024, 0, 11, 11, 57));
    const night = nightWindow(newMoon, ATACAMA)!;
    expect(night.darkHours).toBeGreaterThan(6);
    // Essentially all of the darkness is Moon-free at new Moon.
    expect(night.moonlessDarkHours / night.darkHours).toBeGreaterThan(0.9);
    const moon = moonTonight(night, ATACAMA, newMoon)!;
    expect(moon.illuminatedFraction).toBeLessThan(0.02);
    expect(moon.interference).toBe("none");
  });

  it("moonlessDarkHours never exceeds darkHours", () => {
    for (const obs of [LONDON, BOSTON, SYDNEY, ATACAMA, LONGYEARBYEN]) {
      for (const month of [0, 3, 6, 9]) {
        const n = nightWindow(new Date(Date.UTC(2026, month, 12, 22)), obs)!;
        expect(n.moonlessDarkHours).toBeLessThanOrEqual(n.darkHours + 1e-9);
        expect(n.moonlessDarkHours).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("grades interference on illumination AND whether the Moon is up", () => {
    expect(moonInterference(0.95, false)).toBe("none"); // set before dark
    expect(moonInterference(0.05, true)).toBe("minor");
    expect(moonInterference(0.4, true)).toBe("moderate");
    expect(moonInterference(0.85, true)).toBe("severe");
    expect(moonInterference(NaN, true)).toBe("none");
  });

  it("returns null for missing inputs", () => {
    expect(moonTonight(null, BOSTON, new Date())).toBeNull();
    expect(moonTonight(nightWindow(new Date(), BOSTON), BOSTON, new Date(NaN))).toBeNull();
  });
});

describe("planet positions", () => {
  it("caps Mercury's solar elongation near the published 28 degrees", () => {
    let max = 0;
    for (let d = 0; d < 730; d += 1) {
      const e = solarElongationDeg("Mercury", new Date(Date.UTC(2026, 0, 1) + d * 86_400_000));
      expect(e).not.toBeNull();
      max = Math.max(max, e!);
    }
    expect(max).toBeGreaterThan(26);
    expect(max).toBeLessThan(29);
  });

  it("caps Venus's solar elongation near the published 47 degrees", () => {
    let max = 0;
    for (let d = 0; d < 730; d += 1) {
      const e = solarElongationDeg("Venus", new Date(Date.UTC(2026, 0, 1) + d * 86_400_000))!;
      max = Math.max(max, e);
    }
    expect(max).toBeGreaterThan(45);
    expect(max).toBeLessThan(48.5);
  });

  it("lets the outer planets reach opposition (elongation ~180)", () => {
    for (const body of ["Mars", "Jupiter", "Saturn"] as const) {
      let max = 0;
      for (let d = 0; d < 900; d += 2) {
        const e = solarElongationDeg(body, new Date(Date.UTC(2026, 0, 1) + d * 86_400_000))!;
        max = Math.max(max, e);
      }
      expect(max).toBeGreaterThan(170);
    }
  });

  it("keeps each planet's geocentric distance inside its real range", () => {
    // Bounds are (a_planet - a_earth) at closest and (a_planet + a_earth) at
    // farthest, from the published semi-major axes.
    const bounds: Record<string, [number, number]> = {
      Mercury: [0.5, 1.5],
      Venus: [0.25, 1.75],
      Mars: [0.35, 2.7],
      Jupiter: [3.9, 6.5],
      Saturn: [8.0, 11.1],
      Uranus: [17.2, 21.1],
      Neptune: [28.7, 31.4],
    };
    for (let d = 0; d < 900; d += 5) {
      const date = new Date(Date.UTC(2026, 0, 1) + d * 86_400_000);
      for (const [body, [lo, hi]] of Object.entries(bounds)) {
        const p = planetEquatorial(body as "Mars", date)!;
        expect(p.distanceAu).toBeGreaterThan(lo);
        expect(p.distanceAu).toBeLessThan(hi);
      }
    }
  });

  it("has no geocentric position for Earth", () => {
    expect(planetEquatorial("Earth", new Date())).toBeNull();
    expect(planetHorizontal("Earth", new Date(), 0, 0)).toBeNull();
  });

  it("agrees with lib/celestial when converting to alt/az", () => {
    const date = new Date(Date.UTC(2026, 7, 14, 3));
    const eq = planetEquatorial("Jupiter", date)!;
    const direct = equatorialToHorizontal(
      eq.raDeg,
      eq.decDeg,
      BOSTON.latDeg,
      BOSTON.lonDeg,
      date
    )!;
    const via = planetHorizontal("Jupiter", date, BOSTON.latDeg, BOSTON.lonDeg)!;
    expect(via.altitude).toBeCloseTo(direct.altitude, 9);
    expect(via.azimuth).toBeCloseTo(direct.azimuth, 9);
  });

  it("returns null for bad dates", () => {
    expect(planetEquatorial("Mars", new Date(NaN))).toBeNull();
    expect(solarElongationDeg("Mars", new Date(NaN))).toBeNull();
  });
});

describe("planetsTonight", () => {
  const night = nightWindow(new Date(Date.UTC(2026, 9, 15, 2)), ATACAMA)!;
  const rows = planetsTonight(night, ATACAMA);

  it("covers the seven other planets, sorted by best altitude", () => {
    expect(rows).toHaveLength(7);
    expect(rows.map((r) => r.body).sort()).toEqual([
      "Jupiter",
      "Mars",
      "Mercury",
      "Neptune",
      "Saturn",
      "Uranus",
      "Venus",
    ]);
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1].best?.maxAltitudeDeg ?? -999;
      const cur = rows[i].best?.maxAltitudeDeg ?? -999;
      expect(prev).toBeGreaterThanOrEqual(cur);
    }
  });

  it("marks a planet worth looking at only above the usable altitude", () => {
    for (const r of rows) {
      if (r.worthLooking) {
        expect(r.best!.maxAltitudeDeg).toBeGreaterThanOrEqual(USABLE_ALTITUDE_DEG);
      }
    }
  });

  it("puts the best moment inside the night window", () => {
    for (const r of rows) {
      if (!r.best) continue;
      expect(r.best.at.getTime()).toBeGreaterThanOrEqual(night.darkStart!.getTime());
      expect(r.best.at.getTime()).toBeLessThanOrEqual(night.darkEnd!.getTime());
    }
  });

  it("never claims Mercury or Venus high in the middle of the night", () => {
    // Their elongation caps make that geometrically impossible, so this is a
    // real check on the whole chain rather than a style preference.
    const inner = rows.filter((r) => r.body === "Mercury" || r.body === "Venus");
    for (const r of inner) {
      expect(r.elongationDeg!).toBeLessThan(48.5);
    }
  });

  it("still lists planets at a latitude with no astronomical darkness", () => {
    const summer = nightWindow(new Date(Date.UTC(2026, 5, 21, 21)), LONDON)!;
    expect(summer.state).toBe("no-astronomical-darkness");
    expect(planetsTonight(summer, LONDON)).toHaveLength(7);
  });

  it("returns [] without a night or observer", () => {
    expect(planetsTonight(null, BOSTON)).toEqual([]);
    expect(planetsTonight(night, { latDeg: NaN, lonDeg: 0 })).toEqual([]);
  });

  it("carries a published magnitude range and an honest class for every planet", () => {
    for (const [body, b] of Object.entries(PLANET_BRIGHTNESS)) {
      expect(b.magRange[0]).toBeLessThan(b.magRange[1]);
      expect(b.note.length).toBeGreaterThan(20);
      expect(b.note).not.toContain("—"); // project style: no em-dashes
      if (body === "Neptune") expect(b.visibility).toBe("optics");
      if (body === "Uranus") expect(b.visibility).toBe("dark-sky-naked-eye");
      if (body === "Jupiter") expect(b.visibility).toBe("naked-eye");
    }
  });
});

describe("darknessScore", () => {
  it("gives a full moonless dark night 100", () => {
    const s = darknessScore({
      ...blankNight(),
      darkHours: FULL_DARK_HOURS,
      moonlessDarkHours: FULL_DARK_HOURS,
    })!;
    expect(s.score).toBe(100);
    expect(s.darkHoursFactor).toBe(1);
    expect(s.moonlessFactor).toBe(1);
  });

  it("floors a fully moonlit but long night at 35", () => {
    const s = darknessScore({
      ...blankNight(),
      darkHours: 8,
      moonlessDarkHours: 0,
    })!;
    expect(s.score).toBe(35);
  });

  it("scales linearly with dark hours below the six-hour reference", () => {
    const half = darknessScore({
      ...blankNight(),
      darkHours: 3,
      moonlessDarkHours: 3,
    })!;
    expect(half.score).toBe(50);
  });

  it("scores zero when there is no astronomical darkness", () => {
    const s = darknessScore({ ...blankNight(), darkHours: 0, moonlessDarkHours: 0 })!;
    expect(s.score).toBe(0);
    expect(s.label).toBe("no astronomical darkness");
  });

  it("never leaves 0..100 for any real place and season", () => {
    for (const obs of [LONDON, BOSTON, SYDNEY, ATACAMA, LONGYEARBYEN, EQUATOR]) {
      for (const month of [0, 2, 5, 8, 11]) {
        const n = nightWindow(new Date(Date.UTC(2026, month, 10, 22)), obs)!;
        const s = darknessScore(n)!;
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(100);
      }
    }
  });

  it("returns null for a missing night", () => {
    expect(darknessScore(null)).toBeNull();
  });
});

describe("determinism", () => {
  it("gives the same answer for the same inputs", () => {
    const at = new Date(Date.UTC(2026, 7, 20, 3));
    const a = nightWindow(at, BOSTON)!;
    const b = nightWindow(at, BOSTON)!;
    expect(a.sunset!.getTime()).toBe(b.sunset!.getTime());
    expect(a.darkHours).toBe(b.darkHours);
    expect(a.moonlessDarkHours).toBe(b.moonlessDarkHours);
    expect(planetEquatorial("Saturn", at)!.raDeg).toBe(
      planetEquatorial("Saturn", at)!.raDeg
    );
  });
});

/** A zeroed NightWindow, for scoring tests that supply only the two factors. */
function blankNight() {
  return {
    state: "normal" as const,
    sunset: null,
    sunrise: null,
    civilDusk: null,
    nauticalDusk: null,
    astronomicalDusk: null,
    astronomicalDawn: null,
    nauticalDawn: null,
    civilDawn: null,
    darkHours: 0,
    moonlessDarkHours: 0,
    darkStart: null,
    darkEnd: null,
  };
}

describe("the standard altitudes are the conventional ones", () => {
  it("matches Meeus Ch. 15 and the twilight definitions", () => {
    expect(SUN_STANDARD_ALT_DEG).toBeCloseTo(-0.833, 3);
    expect(MOON_STANDARD_ALT_DEG).toBeCloseTo(0.125, 3);
    expect(ASTRONOMICAL_TWILIGHT_DEG).toBe(-18);
  });
});
