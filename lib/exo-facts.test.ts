import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  catalogTotals,
  filterSystems,
  fmtRadius,
  fmtMass,
  isMinimumMass,
  parseExoCatalog,
  sortSystems,
  systemDerived,
  systemLumLinear,
  type ExoCatalog,
  type ExoSystemData,
} from "./exo-facts";

/**
 * These guard the phase's single most important correctness property: the
 * archive's star.lum is log10(L/Lsun), so every habitable-zone / in-HZ figure
 * must go through lsunFromLogLum FIRST. We assert against the real shipped
 * catalogue so a regression that drops the conversion (or reads the wrong field)
 * fails loudly:
 *   • TRAPPIST-1 (cool M dwarf) → planets e, f, g land in the conservative HZ.
 *   • WASP-12 (hot Jupiter) → nothing in the HZ.
 *   • TOI-700 (famous HZ system) → at least one planet in the HZ.
 */

function loadCatalog(): ExoCatalog {
  const p = path.join(
    process.cwd(),
    "public",
    "data",
    "exoplanets",
    "systems.json"
  );
  const raw = JSON.parse(readFileSync(p, "utf8"));
  const cat = parseExoCatalog(raw);
  expect(cat).not.toBeNull();
  return cat as ExoCatalog;
}

function find(cat: ExoCatalog, hostname: string): ExoSystemData {
  const s = cat.systems.find((x) => x.hostname === hostname);
  expect(s, `system ${hostname} present`).toBeTruthy();
  return s as ExoSystemData;
}

describe("exoplanet catalogue parse + derivations", () => {
  const cat = loadCatalog();

  it("parses the shipped catalogue with its acknowledgment", () => {
    expect(cat.systems.length).toBeGreaterThan(50);
    expect(cat.meta.acknowledgment).toContain("NASA Exoplanet Archive");
    expect(cat.meta.counts.systems).toBeGreaterThan(0);
  });

  it("converts log10 luminosity to linear before HZ math (TRAPPIST-1)", () => {
    const t1 = find(cat, "TRAPPIST-1");
    // star.lum is a NEGATIVE log10 for this ultra-cool dwarf...
    expect(t1.star.lum).toBeLessThan(0);
    // ...and the linear conversion is a tiny positive fraction of Lsun.
    const lin = systemLumLinear(t1);
    expect(lin).not.toBeNull();
    expect(lin as number).toBeGreaterThan(0);
    expect(lin as number).toBeLessThan(0.01);

    const d = systemDerived(t1);
    const inHz = t1.planets
      .filter((p) => p.sma_au != null)
      .map((p) => p.name)
      .filter((name) => {
        const p = t1.planets.find((x) => x.name === name)!;
        return (
          d.hz !== null &&
          p.sma_au! >= d.hz.conservative.inner &&
          p.sma_au! <= d.hz.conservative.outer
        );
      });
    // e, f, g are the canonical TRAPPIST-1 conservative-HZ trio.
    expect(inHz).toEqual(
      expect.arrayContaining(["TRAPPIST-1 e", "TRAPPIST-1 f", "TRAPPIST-1 g"])
    );
    expect(d.hzCount).toBe(3);
  });

  it("finds no HZ planet for a hot Jupiter (WASP-12)", () => {
    const w = find(cat, "WASP-12");
    expect(systemDerived(w).hzCount).toBe(0);
  });

  it("finds the HZ planet for TOI-700", () => {
    const t = find(cat, "TOI-700");
    expect(systemDerived(t).hzCount).toBeGreaterThanOrEqual(1);
  });

  it("counts catalogue totals consistently", () => {
    const totals = catalogTotals(cat.systems);
    expect(totals.systems).toBe(cat.systems.length);
    expect(totals.planets).toBeGreaterThan(totals.systems);
    expect(totals.inHZ).toBeGreaterThan(0);
  });

  it("flags directly-imaged planets", () => {
    const imaged = cat.systems.flatMap((s) =>
      s.planets.filter((p) => p.directly_imaged)
    );
    expect(imaged.length).toBe(7);
  });
});

describe("exoplanet formatting + sorting", () => {
  const cat = loadCatalog();

  it("labels a minimum mass for radial-velocity planets", () => {
    const proxb = cat.systems
      .flatMap((s) => s.planets)
      .find((p) => p.name === "Proxima Cen b");
    expect(proxb).toBeTruthy();
    expect(isMinimumMass(proxb!)).toBe(true);
  });

  it("adds Jupiter units for large radii/masses and 'not measured' for nulls", () => {
    expect(fmtRadius(null)).toBe("not measured");
    expect(fmtRadius(1)).toContain("R⊕");
    expect(fmtRadius(12)).toContain("R♃");
    expect(fmtMass(null)).toBe("not measured");
    expect(fmtMass(400)).toContain("M♃");
  });

  it("sorts notable systems (with a note) ahead of the rest", () => {
    const sorted = sortSystems(cat.systems, "notable");
    const firstUnnotedIdx = sorted.findIndex((s) => !s.note);
    const lastNotedIdx = sorted.map((s) => !!s.note).lastIndexOf(true);
    // every noted system precedes every un-noted one
    expect(lastNotedIdx).toBeLessThan(firstUnnotedIdx === -1 ? Infinity : firstUnnotedIdx);
  });

  it("sorts nearest by ascending distance", () => {
    const sorted = sortSystems(cat.systems, "nearest");
    const first = sorted[0];
    expect(first.hostname).toBe("Proxima Cen");
  });

  it("filters by host, common and planet name", () => {
    expect(filterSystems(cat.systems, "trappist").length).toBe(1);
    expect(filterSystems(cat.systems, "proxima").length).toBeGreaterThanOrEqual(1);
    expect(filterSystems(cat.systems, "zzzznope").length).toBe(0);
  });
});
