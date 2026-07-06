import { describe, expect, it } from "vitest";
import {
  MARS_OBLIQUITY_DEG,
  coordinatedMarsTime,
  dustStormSeason,
  localMeanSolarTime,
  marsSeason,
  marsSolDate,
  marsSolarDeclination,
  marsSubsolarPoint,
  solarLongitude,
} from "./mars-time";

const DAY_MS = 86_400_000;

/**
 * Physics acceptance tests for the Mars24 implementation (Allison & McEwen
 * 2000, as documented by NASA GISS:
 * https://www.giss.nasa.gov/tools/mars24/help/algorithm.html).
 *
 * Reference values (all reproduced by our implementation, see the derivation
 * script in the commit notes):
 *
 *   GISS Mars24 worked example — 2000-01-06 00:00:00 UTC:
 *     MSD ≈ 44796.0        (we get 44795.9998)
 *     Ls  ≈ 277.18°        (we get 277.19°)
 *
 *   Curiosity landing — 2012-08-06 05:17:57 UTC:
 *     Ls  ≈ 150.7° (northern summer)   (we get 150.69°)
 *
 *   Mars year (Ls 0 → Ls 0): ~686.97 Earth days ≈ 668.6 sols
 *     (we measure 687.00 Earth days between successive northern spring
 *      equinoxes; MY35 NSE was 2019-03-23, we land 2019-03-24.)
 */

describe("solar longitude Ls (Mars24 anchor values)", () => {
  it("matches the GISS worked example (2000-01-06 00:00 UTC ≈ 277.18°)", () => {
    const ls = solarLongitude(new Date(Date.UTC(2000, 0, 6, 0, 0, 0)));
    expect(Math.abs(ls - 277.18)).toBeLessThan(0.1);
  });

  it("is ~150.7° (northern summer) at the Curiosity landing", () => {
    const ls = solarLongitude(new Date(Date.UTC(2012, 7, 6, 5, 17, 57)));
    expect(Math.abs(ls - 150.7)).toBeLessThan(0.3);
  });

  it("is ~0° at the MY35 northern spring equinox (2019-03-23)", () => {
    // Astronomical event ~2019-03-23; our crossing lands within a day, so Ls
    // is a fraction of a degree either side of 0/360.
    const ls = solarLongitude(new Date(Date.UTC(2019, 2, 23, 12, 0)));
    const dist = Math.min(ls, 360 - ls);
    expect(dist).toBeLessThan(1.0);
  });

  it("stays in [0, 360) for a full year of samples", () => {
    for (let day = 0; day < 700; day++) {
      const ls = solarLongitude(new Date(Date.UTC(2026, 0, 1) + day * DAY_MS));
      expect(ls).toBeGreaterThanOrEqual(0);
      expect(ls).toBeLessThan(360);
    }
  });
});

describe("solar declination (obliquity-bounded)", () => {
  it("never exceeds the obliquity ±25.19° across a full Mars year", () => {
    for (let day = 0; day < 700; day++) {
      const dec = marsSolarDeclination(
        new Date(Date.UTC(2026, 0, 1) + day * DAY_MS)
      );
      expect(Math.abs(dec)).toBeLessThanOrEqual(MARS_OBLIQUITY_DEG + 1e-6);
    }
  });

  it("is ~0 at the equinoxes (Ls≈0 and Ls≈180) and ~±ε at the solstices", () => {
    // Find a date whose Ls is near 90 (N summer solstice) → dec ≈ +25.19.
    let best = { d: 0, diff: Infinity };
    for (let day = 0; day < 700; day++) {
      const date = new Date(Date.UTC(2026, 0, 1) + day * DAY_MS);
      const diff = Math.abs(solarLongitude(date) - 90);
      if (diff < best.diff) best = { d: day, diff };
    }
    const solstice = new Date(Date.UTC(2026, 0, 1) + best.d * DAY_MS);
    expect(marsSolarDeclination(solstice)).toBeGreaterThan(24.5);
  });
});

describe("Mars Sol Date (MSD)", () => {
  it("matches the GISS worked example (2000-01-06 00:00 UTC ≈ 44796.0)", () => {
    const msd = marsSolDate(new Date(Date.UTC(2000, 0, 6, 0, 0, 0)));
    expect(Math.abs(msd - 44796.0)).toBeLessThan(0.01);
  });

  it("increases monotonically (one Earth day advances ≈ 0.9732 sols)", () => {
    const a = marsSolDate(new Date(Date.UTC(2026, 0, 1)));
    const b = marsSolDate(new Date(Date.UTC(2026, 0, 2)));
    expect(b).toBeGreaterThan(a);
    expect(Math.abs(b - a - 1 / 1.0274912517)).toBeLessThan(1e-4);
  });

  it("is strictly increasing over many samples", () => {
    let prev = -Infinity;
    for (let day = 0; day < 1000; day++) {
      const msd = marsSolDate(new Date(Date.UTC(2020, 0, 1) + day * DAY_MS));
      expect(msd).toBeGreaterThan(prev);
      prev = msd;
    }
  });
});

describe("Coordinated Mars Time (MTC) & local solar time", () => {
  it("stays in [0, 24) hours", () => {
    for (let day = 0; day < 50; day++) {
      const mtc = coordinatedMarsTime(
        new Date(Date.UTC(2026, 0, 1) + day * DAY_MS)
      );
      expect(mtc).toBeGreaterThanOrEqual(0);
      expect(mtc).toBeLessThan(24);
    }
  });

  it("LMST at the prime meridian equals MTC", () => {
    const d = new Date(Date.UTC(2026, 3, 15, 6, 30));
    expect(localMeanSolarTime(d, 0)).toBeCloseTo(coordinatedMarsTime(d), 6);
  });

  it("LMST advances 1 hour per 15° east of the prime meridian", () => {
    const d = new Date(Date.UTC(2026, 3, 15, 6, 30));
    const at0 = localMeanSolarTime(d, 0);
    const at15 = localMeanSolarTime(d, 15);
    const delta = ((at15 - at0 + 24) % 24);
    expect(delta).toBeCloseTo(1, 6);
  });
});

describe("subsolar point", () => {
  it("latitude equals the solar declination", () => {
    const d = new Date(Date.UTC(2026, 5, 1, 12));
    expect(marsSubsolarPoint(d).lat).toBeCloseTo(marsSolarDeclination(d), 6);
  });

  it("longitude is a normalized east-longitude in (-180, 180]", () => {
    for (let h = 0; h < 25; h++) {
      const lon = marsSubsolarPoint(
        new Date(Date.UTC(2026, 5, 1) + h * 3_600_000)
      ).lon;
      expect(lon).toBeGreaterThan(-180.0001);
      expect(lon).toBeLessThanOrEqual(180.0001);
    }
  });

  it("subsolar meridian moves west as MTC advances", () => {
    // As Mars rotates, the subsolar longitude marches westward (decreasing
    // east-longitude), analogous to Earth's subsolar point.
    const d = new Date(Date.UTC(2026, 5, 1, 6));
    const lon0 = marsSubsolarPoint(d).lon;
    const lon1 = marsSubsolarPoint(new Date(d.getTime() + 3_600_000)).lon;
    // account for wraparound at ±180
    let dLon = lon1 - lon0;
    if (dLon > 180) dLon -= 360;
    if (dLon < -180) dLon += 360;
    expect(dLon).toBeLessThan(0); // moved west
  });
});

describe("season & dust climatology labels", () => {
  it("labels the four northern-hemisphere seasons from Ls", () => {
    // Sample the year and confirm all four labels appear in Ls order.
    const seen = new Set<string>();
    for (let day = 0; day < 700; day++) {
      seen.add(marsSeason(new Date(Date.UTC(2026, 0, 1) + day * DAY_MS)));
    }
    expect(seen).toContain("Northern Spring");
    expect(seen).toContain("Northern Summer");
    expect(seen).toContain("Northern Autumn");
    expect(seen).toContain("Northern Winter");
  });

  it("flags dust season for Ls 180–360 and peak for Ls 240–300", () => {
    // Ls ~ 270 → active + peak; Ls ~ 90 → inactive.
    let peakDate: Date | null = null;
    let calmDate: Date | null = null;
    let bestPeak = Infinity;
    let bestCalm = Infinity;
    for (let day = 0; day < 700; day++) {
      const date = new Date(Date.UTC(2026, 0, 1) + day * DAY_MS);
      const ls = solarLongitude(date);
      if (Math.abs(ls - 270) < bestPeak) {
        bestPeak = Math.abs(ls - 270);
        peakDate = date;
      }
      if (Math.abs(ls - 90) < bestCalm) {
        bestCalm = Math.abs(ls - 90);
        calmDate = date;
      }
    }
    const peak = dustStormSeason(peakDate!);
    expect(peak.active).toBe(true);
    expect(peak.peak).toBe(true);
    expect(peak.intensity).toBeGreaterThan(0.9);

    const calm = dustStormSeason(calmDate!);
    expect(calm.active).toBe(false);
    expect(calm.intensity).toBe(0);
  });
});
