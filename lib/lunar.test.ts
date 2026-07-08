import { describe, expect, it } from "vitest";
import {
  SYNODIC_MONTH_DAYS,
  libration,
  moonEclipticPosition,
  moonPhase,
  moonState,
  moonSubsolarPoint,
  moonSunDirection,
  phaseNameFromDelta,
  sunEclipticLongitude,
} from "./lunar";

const DAY_MS = 86_400_000;

/**
 * Physics acceptance tests for the Meeus low-precision lunar/solar theory in
 * lib/lunar.ts (Meeus, *Astronomical Algorithms* 2nd ed., Ch. 25 Sun, Ch. 47
 * Moon position, Ch. 48 illuminated fraction, Ch. 53 optical libration).
 *
 * Reference new/full/quarter-moon instants (standard almanac values — NASA
 * "Phases of the Moon" tables / Espenak, and Meeus's own worked epoch). Because
 * these are the *exact* syzygy/quadrature times, our low-precision series lands
 * on k ≈ 0 (new), k ≈ 1 (full) and k ≈ 0.5 (quarters) to within a few tenths:
 *
 *   New  Moon: 2000-01-06 18:14 UTC   (Meeus epoch-adjacent lunation; k≈0)
 *   Full Moon: 2000-01-21 04:40 UTC   (k≈1)
 *   New  Moon: 2024-01-11 11:57 UTC   (k≈0)
 *   First Qtr: 2024-01-18 03:53 UTC   (k≈0.5, waxing)
 *   Full Moon: 2024-01-25 17:54 UTC   (k≈1)
 *   Last Qtr : 2024-01-04 03:30 UTC   (k≈0.5, waning)
 *   Full Moon: 2024-09-18 02:34 UTC   (harvest moon / eclipse; k≈1)
 *   New  Moon: 2025-03-29 10:58 UTC   (partial-eclipse new moon; k≈0)
 *
 * Libration extremes cross-checked in shape against JPL Horizons (target 301,
 * observer sub-longitude/latitude): optical libration reaches ~±7.9° in
 * longitude and ~±6.9° in latitude (Meeus Ch. 53 / docs/MOON_PHYSICS.md).
 */

const NEW_MOONS: Array<[string, Date]> = [
  ["2000-01-06 18:14", new Date(Date.UTC(2000, 0, 6, 18, 14))],
  ["2024-01-11 11:57", new Date(Date.UTC(2024, 0, 11, 11, 57))],
  ["2025-03-29 10:58", new Date(Date.UTC(2025, 2, 29, 10, 58))],
];

const FULL_MOONS: Array<[string, Date]> = [
  ["2000-01-21 04:40", new Date(Date.UTC(2000, 0, 21, 4, 40))],
  ["2024-01-25 17:54", new Date(Date.UTC(2024, 0, 25, 17, 54))],
  ["2024-09-18 02:34", new Date(Date.UTC(2024, 8, 18, 2, 34))],
];

describe("illuminated fraction at documented syzygies (Meeus Ch. 48)", () => {
  it.each(NEW_MOONS)("k ≈ 0 at the %s new moon", (_label, date) => {
    const { illuminatedFraction } = moonPhase(date);
    expect(illuminatedFraction).toBeLessThan(0.02);
  });

  it.each(FULL_MOONS)("k ≈ 1 at the %s full moon", (_label, date) => {
    const { illuminatedFraction } = moonPhase(date);
    expect(illuminatedFraction).toBeGreaterThan(0.98);
  });

  it("k ≈ 0.5 at the 2024-01-18 first quarter (waxing)", () => {
    const p = moonPhase(new Date(Date.UTC(2024, 0, 18, 3, 53)));
    expect(Math.abs(p.illuminatedFraction - 0.5)).toBeLessThan(0.03);
    expect(p.waxing).toBe(true);
    expect(p.name).toBe("First Quarter");
  });

  it("k ≈ 0.5 at the 2024-01-04 last quarter (waning)", () => {
    const p = moonPhase(new Date(Date.UTC(2024, 0, 4, 3, 30)));
    expect(Math.abs(p.illuminatedFraction - 0.5)).toBeLessThan(0.03);
    expect(p.waxing).toBe(false);
    expect(p.name).toBe("Last Quarter");
  });
});

describe("phase angle & elongation (Meeus Ch. 48)", () => {
  it("phase angle stays in [0, 180] across a full year", () => {
    for (let d = 0; d < 366; d++) {
      const { phaseAngle } = moonPhase(new Date(Date.UTC(2026, 0, 1) + d * DAY_MS));
      expect(phaseAngle).toBeGreaterThanOrEqual(0);
      expect(phaseAngle).toBeLessThanOrEqual(180);
    }
  });

  it("elongation stays in [0, 180] and k = (1 + cos i)/2 is consistent", () => {
    for (let d = 0; d < 60; d++) {
      const date = new Date(Date.UTC(2026, 5, 1) + d * DAY_MS);
      const p = moonPhase(date);
      expect(p.elongation).toBeGreaterThanOrEqual(0);
      expect(p.elongation).toBeLessThanOrEqual(180);
      const k = (1 + Math.cos((p.phaseAngle * Math.PI) / 180)) / 2;
      expect(Math.abs(k - p.illuminatedFraction)).toBeLessThan(1e-9);
    }
  });

  it("phase angle is ≈180° at new moon and ≈0° at full moon", () => {
    expect(moonPhase(NEW_MOONS[1][1]).phaseAngle).toBeGreaterThan(178);
    expect(moonPhase(FULL_MOONS[1][1]).phaseAngle).toBeLessThan(2);
  });
});

describe("phase name & lunar age", () => {
  it("names the eight phases from the synodic angle", () => {
    expect(phaseNameFromDelta(0)).toBe("New Moon");
    expect(phaseNameFromDelta(45)).toBe("Waxing Crescent");
    expect(phaseNameFromDelta(90)).toBe("First Quarter");
    expect(phaseNameFromDelta(135)).toBe("Waxing Gibbous");
    expect(phaseNameFromDelta(180)).toBe("Full Moon");
    expect(phaseNameFromDelta(225)).toBe("Waning Gibbous");
    expect(phaseNameFromDelta(270)).toBe("Last Quarter");
    expect(phaseNameFromDelta(315)).toBe("Waning Crescent");
  });

  it("lunar age is ~0 (or ~synodic) at new moon and ~half at full moon", () => {
    const ageNew = moonPhase(NEW_MOONS[1][1]).ageDays;
    // At exact new moon age is right at the 0/29.53 wrap; accept either end.
    expect(Math.min(ageNew, SYNODIC_MONTH_DAYS - ageNew)).toBeLessThan(0.3);

    const ageFull = moonPhase(FULL_MOONS[1][1]).ageDays;
    expect(Math.abs(ageFull - SYNODIC_MONTH_DAYS / 2)).toBeLessThan(0.3);
  });

  it("age stays within [0, synodic month] over many samples", () => {
    for (let d = 0; d < 200; d++) {
      const { ageDays } = moonPhase(new Date(Date.UTC(2026, 0, 1) + d * DAY_MS));
      expect(ageDays).toBeGreaterThanOrEqual(0);
      expect(ageDays).toBeLessThanOrEqual(SYNODIC_MONTH_DAYS + 1e-6);
    }
  });
});

describe("illuminated fraction recurs over the synodic month (~29.53 d)", () => {
  it("k at t and t + one synodic month are close", () => {
    // The synodic month is a MEAN period; the true phase wanders a little, so
    // sampling a few epochs and requiring closeness (not exact equality) is the
    // honest test of periodicity.
    let worst = 0;
    for (let s = 0; s < 6; s++) {
      const base = new Date(Date.UTC(2024, 0, 15) + s * 40 * DAY_MS);
      const k0 = moonPhase(base).illuminatedFraction;
      const k1 = moonPhase(
        new Date(base.getTime() + SYNODIC_MONTH_DAYS * DAY_MS)
      ).illuminatedFraction;
      worst = Math.max(worst, Math.abs(k0 - k1));
    }
    expect(worst).toBeLessThan(0.1);
  });

  it("a full new→new lunation spans ≈ 29.53 days", () => {
    // Find two consecutive new-moon crossings (k minimum) by fine sampling.
    const start = Date.UTC(2024, 0, 1);
    const newMoons: number[] = [];
    let prevDelta = 999;
    for (let h = 0; h < 24 * 70; h++) {
      const t = start + h * 3_600_000;
      // synodic angle via longitudes
      const dLon =
        ((moonEclipticPosition(new Date(t)).longitude -
          sunEclipticLongitude(new Date(t))) %
          360 +
          360) %
        360;
      // detect wrap through 0 (new moon)
      if (prevDelta > 350 && dLon < 10) newMoons.push(t);
      prevDelta = dLon;
    }
    expect(newMoons.length).toBeGreaterThanOrEqual(2);
    const spanDays = (newMoons[1] - newMoons[0]) / DAY_MS;
    expect(Math.abs(spanDays - SYNODIC_MONTH_DAYS)).toBeLessThan(1.0);
  });
});

describe("optical libration (Meeus Ch. 53)", () => {
  it("longitude |l′| < 8° and latitude |b′| < 7° across 12 years", () => {
    let maxL = 0;
    let maxB = 0;
    for (let d = 0; d < 365 * 12; d++) {
      const { longitude, latitude } = libration(
        new Date(Date.UTC(2018, 0, 1) + d * DAY_MS)
      );
      maxL = Math.max(maxL, Math.abs(longitude));
      maxB = Math.max(maxB, Math.abs(latitude));
    }
    // Documented extremes: ±~7.9° longitude, ±~6.9° latitude.
    expect(maxL).toBeLessThan(8.0001);
    expect(maxB).toBeLessThan(7.0);
    // ...and they genuinely reach near those extremes (not a stuck ~0 value).
    expect(maxL).toBeGreaterThan(7.0);
    expect(maxB).toBeGreaterThan(6.0);
  });

  it("libration is nonzero and varies month to month", () => {
    const a = libration(new Date(Date.UTC(2024, 0, 1)));
    const b = libration(new Date(Date.UTC(2024, 0, 15)));
    expect(Math.abs(a.longitude - b.longitude)).toBeGreaterThan(1);
  });
});

describe("sub-solar point & sun direction", () => {
  it("sub-solar latitude stays within the lunar-equator obliquity (~±1.54°)", () => {
    for (let d = 0; d < 200; d++) {
      const { lat } = moonSubsolarPoint(new Date(Date.UTC(2026, 0, 1) + d * DAY_MS));
      expect(Math.abs(lat)).toBeLessThanOrEqual(1.544);
    }
  });

  it("sub-solar longitude is a normalized east-longitude in (-180, 180]", () => {
    for (let d = 0; d < 60; d++) {
      const { lon } = moonSubsolarPoint(new Date(Date.UTC(2026, 0, 1) + d * DAY_MS));
      expect(lon).toBeGreaterThan(-180.0001);
      expect(lon).toBeLessThanOrEqual(180.0001);
    }
  });

  it("near-side is lit at full moon (sub-solar lon ≈ 0) and dark at new moon (≈180)", () => {
    // Full moon: sub-solar longitude near the near-side centre (|lon| small).
    const full = moonSubsolarPoint(FULL_MOONS[1][1]);
    expect(Math.abs(full.lon)).toBeLessThan(5);
    // New moon: sub-solar longitude near the far side (|lon| ≈ 180).
    const nw = moonSubsolarPoint(NEW_MOONS[1][1]);
    expect(Math.abs(nw.lon)).toBeGreaterThan(175);
  });

  it("moonSunDirection returns a unit vector", () => {
    const [x, y, z] = moonSunDirection(new Date(Date.UTC(2026, 3, 10, 6)));
    expect(Math.sqrt(x * x + y * y + z * z)).toBeCloseTo(1, 6);
  });
});

describe("moon distance (Meeus Ch. 47)", () => {
  it("stays within the real perigee/apogee band (356k–407k km)", () => {
    for (let d = 0; d < 120; d++) {
      const { distanceKm } = moonEclipticPosition(
        new Date(Date.UTC(2026, 0, 1) + d * DAY_MS)
      );
      expect(distanceKm).toBeGreaterThan(356000);
      expect(distanceKm).toBeLessThan(407000);
    }
  });
});

describe("moonState snapshot", () => {
  it("bundles phase, subsolar, libration and distance consistently", () => {
    const date = new Date(Date.UTC(2024, 0, 25, 17, 54)); // a full moon
    const s = moonState(date);
    expect(s.phase.illuminatedFraction).toBeGreaterThan(0.98);
    expect(Math.abs(s.subsolar.lat)).toBeLessThanOrEqual(1.544);
    expect(Math.abs(s.libration.longitude)).toBeLessThan(8.0001);
    expect(s.distanceKm).toBeGreaterThan(356000);
  });
});
