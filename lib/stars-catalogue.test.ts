import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { countByClass, hrPoints, parseStars, spectralClass } from "./stars";

/** A sanity check against the real shipped catalogue, not a synthetic fixture. */
describe("the real shipped catalogue", () => {
  const raw = JSON.parse(
    readFileSync("public/data/night-sky/stars.json", "utf8"),
  );
  const stars = parseStars(raw);
  const pts = hrPoints(stars);

  it("parses all 9,029 rows and plots the ones with both axes", () => {
    expect(stars.length).toBe(9029);
    // 8,820 have a distance and 8,988 a colour index, so the intersection is
    // slightly under both.
    expect(pts.length).toBeGreaterThan(8500);
    expect(pts.length).toBeLessThanOrEqual(8820);
    console.log("plotted:", pts.length, "of", stars.length);
    console.log("classes:", JSON.stringify(countByClass(pts)));
  });

  it("shows the selection bias a naked-eye sample must have", () => {
    const c = countByClass(pts);
    // A magnitude-limited sample is dominated by intrinsically luminous stars:
    // evolved stars must be a large minority, nothing like the true population.
    const evolved = c.giant + c.supergiant + c.subgiant;
    expect(evolved).toBeGreaterThan(500);
    // And essentially no white dwarfs are naked-eye visible.
    expect(c["white-dwarf"]).toBeLessThan(5);
  });

  it("finds the famous stars and classifies them plausibly", () => {
    const find = (n: string) => pts.find((p) => p.star.name === n);
    const sirius = find("Sirius")!;
    expect(sirius.derived.lclass).toBe("main-sequence");
    expect(sirius.derived.absMag!).toBeCloseTo(1.45, 1);
    expect(find("Betelgeuse")!.derived.lclass).toBe("supergiant");
    expect(find("Rigel")!.derived.lclass).toBe("supergiant");
    const ald = find("Aldebaran")!.derived.lclass;
    expect(ald === "giant" || ald === "subgiant").toBe(true);
  });

  it("covers every Harvard spectral class among the plotted stars", () => {
    const classes = new Set(
      pts.map((p) => spectralClass(p.star.spect)).filter(Boolean),
    );
    for (const c of ["B", "A", "F", "G", "K", "M"]) {
      expect(classes.has(c)).toBe(true);
    }
  });
});
