import { describe, expect, it } from "vitest";
import { latLonToVector3, normalizeLon, vector3ToLatLon } from "./geo";

/**
 * The lon convention must match the equirectangular texture orientation on
 * three.js SphereGeometry (lon 0 -> +X, lon 90E -> -Z, north -> +Y).
 * Spot-checked with known cities so picking clicks resolve to the city the
 * user actually clicked.
 */
describe("latLonToVector3 convention", () => {
  it("puts Greenwich (0N-ish, 0E) on +X", () => {
    const [x, y, z] = latLonToVector3(0, 0);
    expect(x).toBeCloseTo(1, 6);
    expect(y).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(0, 6);
  });

  it("puts the North Pole on +Y", () => {
    const [x, y, z] = latLonToVector3(90, 0);
    expect(y).toBeCloseTo(1, 6);
    expect(Math.hypot(x, z)).toBeLessThan(1e-6);
  });

  it("puts Tokyo (35.68N, 139.69E) in the -Z hemisphere", () => {
    const [, , z] = latLonToVector3(35.68, 139.69);
    expect(z).toBeLessThan(0);
  });

  it("puts New York (40.71N, 74.01W) in the +Z / +X quadrant", () => {
    const [x, , z] = latLonToVector3(40.71, -74.01);
    expect(z).toBeGreaterThan(0);
    expect(x).toBeGreaterThan(0);
  });
});

describe("vector3ToLatLon round trip", () => {
  const cities: Array<[string, number, number]> = [
    ["London", 51.51, -0.13],
    ["Tokyo", 35.68, 139.69],
    ["Sydney", -33.87, 151.21],
    ["Quito", -0.18, -78.47],
    ["Boston", 42.36, -71.06],
    ["McMurdo", -77.85, 166.67],
  ];

  it.each(cities)("%s survives lat/lon -> 3D -> lat/lon", (_name, lat, lon) => {
    const [x, y, z] = latLonToVector3(lat, lon, 2.5);
    const out = vector3ToLatLon(x, y, z);
    expect(out.lat).toBeCloseTo(lat, 4);
    expect(out.lon).toBeCloseTo(lon, 4);
  });
});

describe("normalizeLon", () => {
  it("wraps into [-180, 180)", () => {
    expect(normalizeLon(190)).toBeCloseTo(-170, 8);
    expect(normalizeLon(-190)).toBeCloseTo(170, 8);
    expect(normalizeLon(360)).toBeCloseTo(0, 8);
    expect(normalizeLon(0)).toBe(0);
  });
});
