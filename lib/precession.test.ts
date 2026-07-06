import { describe, expect, it } from "vitest";
import {
  OBLIQUITY_J2000_DEG,
  PRECESSION_ARCSEC_PER_YEAR,
  PRECESSION_EPOCH_YEAR,
  PRECESSION_PERIOD_YEARS,
  celestialPoleDirection,
  eclipticPoleAxis,
  nearestPoleStar,
  precessionAngle,
  precessionAngleDeg,
  rotateAboutAxis,
} from "./precession";

/**
 * Physics acceptance tests for axial precession. The claims we make in the UI
 * ("even the sky changes — a full turn every ~25,772 years") must be exactly
 * what the code computes: a full 360° over one period, correct rate/sign, and
 * a celestial pole that traces a cone of half-angle = obliquity about the
 * fixed ecliptic pole (Polaris → Thuban → Vega geometry).
 */

const TWO_PI = 2 * Math.PI;

describe("precession angle", () => {
  it("is 0 at the reference epoch (J2000)", () => {
    expect(precessionAngle(PRECESSION_EPOCH_YEAR)).toBe(0);
  });

  it("completes exactly one full turn (2π) over one precession period", () => {
    const angle = precessionAngle(PRECESSION_EPOCH_YEAR + PRECESSION_PERIOD_YEARS);
    expect(angle).toBeCloseTo(TWO_PI, 9);
  });

  it("is linear and correctly signed (positive years → positive angle)", () => {
    expect(precessionAngle(PRECESSION_EPOCH_YEAR + 1000)).toBeGreaterThan(0);
    expect(precessionAngle(PRECESSION_EPOCH_YEAR - 1000)).toBeLessThan(0);
    // linearity: 2000 yr is exactly twice the 1000 yr angle
    const a1 = precessionAngle(PRECESSION_EPOCH_YEAR + 1000);
    const a2 = precessionAngle(PRECESSION_EPOCH_YEAR + 2000);
    expect(a2).toBeCloseTo(2 * a1, 9);
  });

  it("rate matches the IAU general precession (~50.29 arcsec/yr)", () => {
    // one year of precession, in arcseconds
    const degPerYear = precessionAngleDeg(PRECESSION_EPOCH_YEAR + 1);
    const arcsecPerYear = degPerYear * 3600;
    expect(arcsecPerYear).toBeCloseTo(PRECESSION_ARCSEC_PER_YEAR, 6);
    // IAU value 50.2909661 arcsec/yr — agree to well under 0.01"
    expect(Math.abs(arcsecPerYear - 50.290966)).toBeLessThan(0.01);
  });
});

describe("ecliptic pole axis", () => {
  it("is a unit vector tilted from +Y by the obliquity", () => {
    const [x, y, z] = eclipticPoleAxis();
    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 12);
    // angle from +Y equals the obliquity
    const angleFromY = (Math.acos(y) * 180) / Math.PI;
    expect(angleFromY).toBeCloseTo(OBLIQUITY_J2000_DEG, 6);
    expect(z).toBeCloseTo(0, 12);
  });
});

describe("celestial pole direction (the precession circle)", () => {
  it("equals the J2000 celestial pole (+Y) at the epoch", () => {
    const [x, y, z] = celestialPoleDirection(PRECESSION_EPOCH_YEAR);
    expect(x).toBeCloseTo(0, 9);
    expect(y).toBeCloseTo(1, 9);
    expect(z).toBeCloseTo(0, 9);
  });

  it("stays a unit vector for any year", () => {
    for (const y of [-10000, -2700, 0, 4000, 13700, 25772]) {
      const [px, py, pz] = celestialPoleDirection(y);
      expect(Math.hypot(px, py, pz)).toBeCloseTo(1, 9);
    }
  });

  it("traces a cone of half-angle = obliquity about the ecliptic pole", () => {
    const axis = eclipticPoleAxis();
    const cosHalf = Math.cos((OBLIQUITY_J2000_DEG * Math.PI) / 180);
    // the pole keeps a constant angle to the ecliptic pole across the cycle
    for (const y of [-2700, 0, 6000, 13700, 20000]) {
      const p = celestialPoleDirection(y);
      const dot = p[0] * axis[0] + p[1] * axis[1] + p[2] * axis[2];
      expect(dot).toBeCloseTo(cosHalf, 6);
    }
  });

  it("returns to the start after a full period", () => {
    const start = celestialPoleDirection(PRECESSION_EPOCH_YEAR);
    const full = celestialPoleDirection(
      PRECESSION_EPOCH_YEAR + PRECESSION_PERIOD_YEARS
    );
    for (let i = 0; i < 3; i++) expect(full[i]).toBeCloseTo(start[i], 6);
  });
});

describe("rotateAboutAxis (Rodrigues)", () => {
  it("rotates +X by 90° about +Z to +Y", () => {
    const [x, y, z] = rotateAboutAxis([1, 0, 0], [0, 0, 1], Math.PI / 2);
    expect(x).toBeCloseTo(0, 9);
    expect(y).toBeCloseTo(1, 9);
    expect(z).toBeCloseTo(0, 9);
  });
  it("leaves a vector on the axis unchanged", () => {
    const [x, y, z] = rotateAboutAxis([0, 0, 3], [0, 0, 1], 1.234);
    expect(x).toBeCloseTo(0, 9);
    expect(y).toBeCloseTo(0, 9);
    expect(z).toBeCloseTo(3, 9);
  });
});

describe("nearest pole star (factual label lookup)", () => {
  it("is Polaris near the present", () => {
    expect(nearestPoleStar(2000).star).toContain("Polaris");
  });
  it("is Thuban in the age of the pyramids (~2700 BCE)", () => {
    expect(nearestPoleStar(-2700).star).toContain("Thuban");
  });
  it("is Vega in the far future (~13,700 CE)", () => {
    expect(nearestPoleStar(13700).star).toContain("Vega");
  });
});
