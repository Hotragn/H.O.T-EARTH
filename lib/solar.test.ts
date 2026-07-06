import { describe, expect, it } from "vitest";
import {
  equationOfTime,
  fractionalYear,
  solarNoonUTC,
  subsolarPoint,
} from "./solar";

/**
 * Physics acceptance tests for the NOAA solar position implementation.
 * Reference values cross-checked against the NOAA solar calculator and
 * astronomical almanac events:
 *   June solstice 2026:    2026-06-21 08:25 UTC (decl ~ +23.44)
 *   March equinox 2026:    2026-03-20 14:46 UTC (decl ~ 0)
 *   September equinox 2026: 2026-09-23 00:06 UTC (decl ~ 0)
 */
describe("subsolar latitude (solar declination)", () => {
  it("is ~ +23.4 deg at the June solstice", () => {
    const { lat } = subsolarPoint(new Date(Date.UTC(2026, 5, 21, 8, 25)));
    expect(Math.abs(lat - 23.44)).toBeLessThan(0.3);
  });

  it("is ~ 0 deg at the March equinox", () => {
    const { lat } = subsolarPoint(new Date(Date.UTC(2026, 2, 20, 14, 46)));
    expect(Math.abs(lat)).toBeLessThan(0.5);
  });

  it("is ~ 0 deg at the September equinox", () => {
    const { lat } = subsolarPoint(new Date(Date.UTC(2026, 8, 23, 0, 6)));
    expect(Math.abs(lat)).toBeLessThan(0.5);
  });

  it("is ~ -23.4 deg at the December solstice", () => {
    const { lat } = subsolarPoint(new Date(Date.UTC(2025, 11, 21, 15, 3)));
    expect(Math.abs(lat + 23.44)).toBeLessThan(0.3);
  });
});

describe("subsolar longitude", () => {
  it("is ~ 0 deg at solar noon UTC (Greenwich apparent noon)", () => {
    // Sample a few dates across the year so the equation-of-time correction
    // is exercised at different phases (E ranges roughly -14..+16 min).
    const days = [
      new Date(Date.UTC(2026, 0, 15)),
      new Date(Date.UTC(2026, 3, 10)),
      new Date(Date.UTC(2026, 6, 6)),
      new Date(Date.UTC(2026, 10, 3)),
    ];
    for (const day of days) {
      const noon = solarNoonUTC(day);
      const { lon } = subsolarPoint(noon);
      expect(Math.abs(lon)).toBeLessThan(0.1);
    }
  });

  it("is ~ 180 deg (date line) near 00:00 UTC", () => {
    const { lon } = subsolarPoint(new Date(Date.UTC(2026, 6, 6, 0, 0)));
    expect(Math.abs(Math.abs(lon) - 180)).toBeLessThan(2);
  });

  it("moves west at ~15 deg per hour", () => {
    const t0 = new Date(Date.UTC(2026, 6, 6, 10, 0));
    const t1 = new Date(Date.UTC(2026, 6, 6, 11, 0));
    const dLon = subsolarPoint(t0).lon - subsolarPoint(t1).lon;
    expect(Math.abs(dLon - 15)).toBeLessThan(0.05);
  });
});

describe("equation of time", () => {
  it("stays within the physical -15..+17 minute envelope all year", () => {
    for (let doy = 0; doy < 365; doy++) {
      const d = new Date(Date.UTC(2026, 0, 1, 12) + doy * 86_400_000);
      const e = equationOfTime(fractionalYear(d));
      expect(e).toBeGreaterThan(-15);
      expect(e).toBeLessThan(17);
    }
  });

  it("is strongly negative in mid-February (sundial behind clock)", () => {
    const e = equationOfTime(
      fractionalYear(new Date(Date.UTC(2026, 1, 11, 12)))
    );
    expect(e).toBeLessThan(-13);
  });
});
