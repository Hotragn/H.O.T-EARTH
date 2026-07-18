import { describe, expect, it } from "vitest";
import {
  bayerGlyph,
  constellationNameMap,
  formatLST,
  galacticToEquatorialColumns,
  horizontalToVector3,
  messierCategory,
  parseConstellationCatalog,
  parseMessierCatalog,
  parseStarCatalog,
  starDesignation,
  starLabel,
  GALACTIC_NORTH_POLE_DEC,
  GALACTIC_NORTH_POLE_RA,
} from "./star-facts";
import { raDecToVector3 } from "./celestial";

function len(v: [number, number, number]): number {
  return Math.hypot(v[0], v[1], v[2]);
}
function dot(a: number[], b: number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross(a: number[], b: number[]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

describe("galacticToEquatorialColumns (Milky Way alignment)", () => {
  const { c1, c2, c3 } = galacticToEquatorialColumns();

  it("is an orthonormal, right-handed basis", () => {
    expect(len(c1)).toBeCloseTo(1, 6);
    expect(len(c2)).toBeCloseTo(1, 6);
    expect(len(c3)).toBeCloseTo(1, 6);
    expect(dot(c1, c2)).toBeCloseTo(0, 6);
    expect(dot(c1, c3)).toBeCloseTo(0, 6);
    expect(dot(c2, c3)).toBeCloseTo(0, 6);
    // right-handed: c1 × c2 = c3 (proper rotation, det = +1)
    const x = cross(c1, c2);
    expect(x[0]).toBeCloseTo(c3[0], 6);
    expect(x[1]).toBeCloseTo(c3[1], 6);
    expect(x[2]).toBeCloseTo(c3[2], 6);
  });

  it("maps the sphere's local +Y (galactic pole) onto the real equatorial NGP", () => {
    // makeBasis puts c2 as the image of local +Y; it must be the galactic north
    // pole direction in the equatorial frame.
    const ngp = raDecToVector3(GALACTIC_NORTH_POLE_RA, GALACTIC_NORTH_POLE_DEC, 1);
    expect(c2[0]).toBeCloseTo(ngp[0], 6);
    expect(c2[1]).toBeCloseTo(ngp[1], 6);
    expect(c2[2]).toBeCloseTo(ngp[2], 6);
  });
});

describe("horizontalToVector3 (local sky frame)", () => {
  it("puts the zenith straight up (+Y)", () => {
    const [x, y, z] = horizontalToVector3(90, 0, 1);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(1, 6);
    expect(z).toBeCloseTo(0, 6);
  });

  it("maps the cardinal points on the horizon: N→−Z, E→+X, S→+Z, W→−X", () => {
    expect(horizontalToVector3(0, 0, 1)).toEqual([
      expect.closeTo(0, 6),
      expect.closeTo(0, 6),
      expect.closeTo(-1, 6),
    ]);
    expect(horizontalToVector3(0, 90, 1)).toEqual([
      expect.closeTo(1, 6),
      expect.closeTo(0, 6),
      expect.closeTo(0, 6),
    ]);
    expect(horizontalToVector3(0, 180, 1)).toEqual([
      expect.closeTo(0, 6),
      expect.closeTo(0, 6),
      expect.closeTo(1, 6),
    ]);
    expect(horizontalToVector3(0, 270, 1)).toEqual([
      expect.closeTo(-1, 6),
      expect.closeTo(0, 6),
      expect.closeTo(0, 6),
    ]);
  });
});

describe("catalogue parsers", () => {
  it("parses the columnar star shape and indexes by id", () => {
    const raw = {
      meta: {
        columns: ["id", "ra", "dec", "mag", "ci", "dist_ly", "spect", "name", "bayer", "con"],
        counts: { stars: 2, named: 1 },
      },
      stars: [
        [32349, 101.2872, -16.7161, -1.44, 0.009, 8.6, "A0", "Sirius", "Alp", "CMa"],
        [-118485, 100.0, 20.0, 5.0, 1.2, null, null, null, null, "Gem"],
      ],
    };
    const cat = parseStarCatalog(raw);
    expect(cat).not.toBeNull();
    expect(cat!.stars).toHaveLength(2);
    const sirius = cat!.byId.get(32349)!;
    expect(sirius.name).toBe("Sirius");
    expect(sirius.mag).toBeCloseTo(-1.44, 4);
    expect(sirius.con).toBe("CMa");
    // null distance/spectral are preserved as null, never invented
    expect(cat!.byId.get(-118485)!.distLy).toBeNull();
    expect(cat!.byId.get(-118485)!.spect).toBeNull();
  });

  it("drops star rows without a renderable direction/brightness", () => {
    const cat = parseStarCatalog({
      stars: [
        [1, null, 0, 3], // no RA
        [2, 10, 20, 4, 0.5, 30, "G0", "X", "Alp", "And"],
      ],
    });
    expect(cat!.stars).toHaveLength(1);
    expect(cat!.stars[0].id).toBe(2);
  });

  it("parses constellations and messier objects", () => {
    const con = parseConstellationCatalog({
      constellations: [{ abbr: "Ori", name: "Orion", lines: [[1, 2], [2, 3]] }],
    });
    expect(con!.constellations[0].lines).toHaveLength(2);

    const m = parseMessierCatalog({
      objects: [
        { m: 31, ngc: 224, name: "Andromeda Galaxy", ra: 10.68, dec: 41.27, mag: 3.44, type: "Galaxy", con: "And" },
      ],
    });
    expect(m!.objects[0].m).toBe(31);
    expect(m!.objects[0].type).toBe("Galaxy");
  });

  it("returns null for unusable input (graceful empty state)", () => {
    expect(parseStarCatalog(null)).toBeNull();
    expect(parseStarCatalog({ stars: [] })).toBeNull();
    expect(parseMessierCatalog({})).toBeNull();
  });
});

describe("display helpers", () => {
  it("renders Bayer glyphs incl. numbered variants", () => {
    expect(bayerGlyph("Alp")).toBe("α");
    expect(bayerGlyph("Alp-1")).toBe("α¹");
    expect(bayerGlyph(null)).toBeNull();
  });

  it("builds a designation and a best label", () => {
    const star = {
      id: 32349, ra: 101.29, dec: -16.72, mag: -1.44, ci: 0.0,
      distLy: 8.6, spect: "A0", name: "Sirius", bayer: "Alp", con: "CMa",
    };
    expect(starDesignation(star)).toBe("α CMa");
    expect(starLabel(star)).toBe("Sirius");
    expect(starLabel({ ...star, name: null })).toBe("α CMa");
    expect(starLabel({ ...star, name: null, bayer: null })).toBe("HIP 32349");
  });

  it("categorises deep-sky types", () => {
    expect(messierCategory("Galaxy")).toBe("galaxy");
    expect(messierCategory("Globular cluster")).toBe("cluster");
    expect(messierCategory("Planetary nebula")).toBe("nebula");
    expect(messierCategory("Supernova remnant")).toBe("nebula");
    expect(messierCategory("Double star")).toBe("other");
  });

  it("maps Serpens split codes and falls back to the abbreviation", () => {
    const map = constellationNameMap(null);
    expect(map.get("Se1")).toBe("Serpens Caput");
    expect(map.get("Se2")).toBe("Serpens Cauda");
  });

  it("formats a local sidereal time string", () => {
    const lst = formatLST(new Date("2026-07-18T04:00:00Z"), -71.06);
    expect(lst).toMatch(/^\d{2}h \d{2}m$/);
  });
});
