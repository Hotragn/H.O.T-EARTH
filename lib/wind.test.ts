import { describe, expect, it } from "vitest";
import {
  advectLatLon,
  formatCycle,
  parseWindField,
  sampleWind,
  type WindField,
} from "./wind";

/**
 * Grid fixtures use the exact GFS layout documented in
 * scripts/wind/README.md: row-major, row 0 = la1 (north), column 0 = lo1
 * (0°E), no duplicate column at 360°.
 */
function makeField(
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  fill: (lat: number, lon: number) => [number, number]
): WindField {
  const u = new Float32Array(nx * ny);
  const v = new Float32Array(nx * ny);
  for (let row = 0; row < ny; row++) {
    for (let col = 0; col < nx; col++) {
      const [uu, vv] = fill(90 - row * dy, col * dx);
      u[row * nx + col] = uu;
      v[row * nx + col] = vv;
    }
  }
  return {
    meta: {
      source: "test",
      cycle: "2026-07-06T06:00:00Z",
      forecast_hour: 0,
      generated: "test",
      resolution: dx,
      units: "m/s",
    },
    nx,
    ny,
    lo1: 0,
    la1: 90,
    dx,
    dy,
    u,
    v,
  };
}

describe("sampleWind", () => {
  const out = new Float32Array(2);

  it("returns exact grid values at grid points (full 1-degree layout)", () => {
    // u = lon, v = lat encodes the grid coordinates in the data itself,
    // so any indexing mistake shows up as the wrong coordinate coming back.
    const field = makeField(360, 181, 1, 1, (lat, lon) => [lon, lat]);
    sampleWind(field, 90, 0, out); // k = 0, North Pole
    expect(out[0]).toBeCloseTo(0, 5);
    expect(out[1]).toBeCloseTo(90, 5);

    sampleWind(field, 47, 123, out); // k = (90-47)*360 + 123
    expect(out[0]).toBeCloseTo(123, 4);
    expect(out[1]).toBeCloseTo(47, 4);

    sampleWind(field, -90, 359, out); // last row, last column
    expect(out[0]).toBeCloseTo(359, 4);
    expect(out[1]).toBeCloseTo(-90, 4);
  });

  it("interpolates linearly between known grid values", () => {
    const field = makeField(360, 181, 1, 1, (lat) => [0, lat]);
    // v = lat everywhere: halfway between the lat 40 and lat 41 rows
    sampleWind(field, 40.5, 10, out);
    expect(out[1]).toBeCloseTo(40.5, 4);
    // quarter-way in longitude between two hand-set u cells
    const k40 = (90 - 40) * 360;
    field.u[k40 + 10] = 8; // (lat 40, lon 10)
    field.u[k40 + 11] = 12; // (lat 40, lon 11)
    sampleWind(field, 40, 10.25, out);
    expect(out[0]).toBeCloseTo(9, 4);
  });

  it("does full bilinear blending of four surrounding cells", () => {
    const field = makeField(360, 181, 1, 1, () => [0, 0]);
    const rowA = (90 - 20) * 360; // lat 20
    const rowB = (90 - 19) * 360; // lat 19
    field.u[rowA + 100] = 10; // (20, 100)
    field.u[rowA + 101] = 20; // (20, 101)
    field.u[rowB + 100] = 30; // (19, 100)
    field.u[rowB + 101] = 40; // (19, 101)
    // center of the cell: plain average of the four corners
    sampleWind(field, 19.5, 100.5, out);
    expect(out[0]).toBeCloseTo(25, 4);
    // 30% south of lat 20, 70% east of lon 100
    sampleWind(field, 19.7, 100.7, out);
    // weights: .7*.3=.21, .7*.7=.49, .3*.3=.09, .3*.7=.21
    // .21*10 + .49*20 + .09*30 + .21*40 = 23.0
    expect(out[0]).toBeCloseTo(23.0, 4);
  });

  it("wraps the antimeridian: interpolates between the last column and column 0", () => {
    const field = makeField(360, 181, 1, 1, () => [0, 0]);
    const row = (90 - 0) * 360; // equator
    field.u[row + 359] = 30; // (0, 359°E)
    field.u[row + 0] = 10; // (0, 0°E == 360°E)
    sampleWind(field, 0, 359.5, out);
    expect(out[0]).toBeCloseTo(20, 4);
    // same physical point expressed in the -180..180 convention
    sampleWind(field, 0, -0.5, out);
    expect(out[0]).toBeCloseTo(20, 4);
  });

  it("clamps latitude beyond the grid poles instead of reading out of range", () => {
    const field = makeField(360, 181, 1, 1, (lat) => [0, lat]);
    sampleWind(field, 95, 10, out);
    expect(out[1]).toBeCloseTo(90, 4);
    sampleWind(field, -95, 10, out);
    expect(out[1]).toBeCloseTo(-90, 4);
  });
});

describe("advectLatLon", () => {
  const out = new Float32Array(2);

  it("moves north by v and east by u at the equator", () => {
    // 111.32 m/s north for 1000 s = 111,320 m = exactly 1 degree
    advectLatLon(0, 0, 111.32, 111.32, 1000, out);
    expect(out[0]).toBeCloseTo(1, 4);
    expect(out[1]).toBeCloseTo(1, 4);
  });

  it("applies the cos(lat) correction to eastward displacement", () => {
    // at 60°N, cos(lat) = 0.5 — the same u covers twice the longitude
    advectLatLon(60, 0, 111.32, 0, 1000, out);
    expect(out[0]).toBeCloseTo(60, 6);
    expect(out[1]).toBeCloseTo(2, 3);
  });

  it("wraps longitude across the antimeridian", () => {
    advectLatLon(0, 179.5, 111.32, 0, 1000, out);
    expect(out[1]).toBeCloseTo(-179.5, 4);
  });
});

describe("parseWindField", () => {
  it("accepts the documented schema and rejects mismatched array lengths", () => {
    const good = {
      meta: { cycle: "2026-07-06T06:00:00Z" },
      nx: 2,
      ny: 2,
      lo1: 0,
      la1: 90,
      dx: 1,
      dy: 1,
      u: [1, 2, 3, 4],
      v: [5, 6, 7, 8],
    };
    const field = parseWindField(good);
    expect(field.u).toBeInstanceOf(Float32Array);
    expect(field.v[3]).toBe(8);
    expect(() => parseWindField({ ...good, u: [1, 2, 3] })).toThrow();
    expect(() => parseWindField(null)).toThrow();
  });
});

describe("formatCycle", () => {
  it("formats an ISO cycle time as a compact HUD label", () => {
    expect(formatCycle("2026-07-06T06:00:00Z")).toBe("2026-07-06 06z");
    expect(formatCycle("garbage")).toBe("garbage");
  });
});
