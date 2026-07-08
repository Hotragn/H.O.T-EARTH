import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  curveForLatitude,
  parseDiurnalTemperature,
  tempAtLocalTime,
} from "./lunar-temperature";

/**
 * Tests for the defensive lunar diurnal-temperature loader. We parse the REAL
 * committed artifact (public/data/moon/diurnal_temperature.json) in the node
 * test environment via fs, and assert it matches the Diviner-anchored extremes
 * documented in docs/MOON_DATA_SOURCES.md (~392 K equatorial noon, ~95 K
 * pre-dawn, ~300 K swing). The parse function is pure and must never throw.
 */

const here = dirname(fileURLToPath(import.meta.url));
const artifactPath = resolve(
  here,
  "../public/data/moon/diurnal_temperature.json"
);

function loadArtifact() {
  const raw = JSON.parse(readFileSync(artifactPath, "utf-8"));
  const parsed = parseDiurnalTemperature(raw);
  if (!parsed) throw new Error("artifact failed to parse");
  return parsed;
}

describe("parseDiurnalTemperature — defensive", () => {
  it("returns null for garbage rather than throwing", () => {
    expect(parseDiurnalTemperature(null)).toBeNull();
    expect(parseDiurnalTemperature(42)).toBeNull();
    expect(parseDiurnalTemperature({})).toBeNull();
    expect(parseDiurnalTemperature({ curves_by_latitude: {} })).toBeNull();
    expect(
      parseDiurnalTemperature({ curves_by_latitude: { "0": [] } })
    ).toBeNull();
  });

  it("parses a minimal valid payload", () => {
    const parsed = parseDiurnalTemperature({
      curves_by_latitude: {
        "0": [
          { lst_h: 0, T_K: 100 },
          { lst_h: 12, T_K: 390 },
          { lst_h: 24, T_K: 100 },
        ],
      },
    });
    expect(parsed).not.toBeNull();
    expect(parsed!.curvesByLatitude[0].points).toHaveLength(3);
    // stats derived when no stats block present
    expect(parsed!.statsByLatitude[0].tMaxK).toBe(390);
    expect(parsed!.statsByLatitude[0].tMinK).toBe(100);
  });
});

describe("real Diviner artifact", () => {
  it("parses the committed diurnal_temperature.json", () => {
    const data = loadArtifact();
    expect(data.curvesByLatitude.length).toBeGreaterThanOrEqual(4);
    // latitudes 0/30/60/85 documented
    const lats = data.curvesByLatitude.map((c) => c.latitude);
    expect(lats).toContain(0);
    expect(lats).toContain(85);
  });

  it("matches the Diviner-measured equatorial extremes", () => {
    const data = loadArtifact();
    expect(data.measured.equatorNoonMaxK).toBeCloseTo(392.3, 1);
    expect(data.measured.equatorPreDawnMinK).toBeCloseTo(95, 0);
    expect(data.measured.equatorDiurnalChangeK).toBe(300);
  });

  it("equatorial curve peaks near noon (~391 K) and bottoms pre-dawn (~95 K)", () => {
    const data = loadArtifact();
    const eq = curveForLatitude(data, 0)!;
    const noon = eq.points.find((p) => p.lstHours === 12)!;
    expect(noon.tempK).toBeGreaterThan(385);
    expect(noon.tempK).toBeLessThan(398);
    const stats = data.statsByLatitude.find((s) => s.latitude === 0)!;
    expect(stats.tMinK).toBeGreaterThan(90);
    expect(stats.tMinK).toBeLessThan(100);
    expect(stats.diurnalSwingK).toBeGreaterThan(290);
  });

  it("diurnal swing shrinks toward the poles", () => {
    const data = loadArtifact();
    const swing = (lat: number) =>
      data.statsByLatitude.find((s) => s.latitude === lat)!.diurnalSwingK;
    expect(swing(0)).toBeGreaterThan(swing(30));
    expect(swing(30)).toBeGreaterThan(swing(60));
    expect(swing(60)).toBeGreaterThan(swing(85));
  });

  it("interpolates temperature at a local solar time & latitude", () => {
    const data = loadArtifact();
    // near noon at the equator → close to the peak
    const noonish = tempAtLocalTime(data, 0, 12);
    expect(noonish).not.toBeNull();
    expect(noonish!).toBeGreaterThan(385);
    // pre-dawn at the equator → cold
    const preDawn = tempAtLocalTime(data, 0, 5.5);
    expect(preDawn!).toBeLessThan(100);
    // a latitude not in the table snaps to the nearest curve, still valid
    const at40 = tempAtLocalTime(data, 40, 12);
    expect(at40).not.toBeNull();
  });
});
