import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXO_VANTAGES,
  exoSurfaceState,
  getExoVantage,
  hasSurface,
  hostStarSky,
  irradianceEarths,
  resolveVantage,
  siblingDiscs,
  surfaceGravityG,
  tidalLockInference,
  yearInfo,
} from "./exo-surfaces";
import { lsunFromLogLum, type ExoSystem } from "./exoplanets";

/**
 * These assert the honest, measured-parameter payoff of the "Exoplanet
 * Surfaces" tab against the REAL shipped catalogue, so a regression in the
 * physics or a wrong data field fails loudly.
 */
function loadSystems(): ExoSystem[] {
  const p = path.join(
    process.cwd(),
    "public",
    "data",
    "exoplanets",
    "systems.json"
  );
  const raw = JSON.parse(readFileSync(p, "utf8"));
  return raw.systems as ExoSystem[];
}

describe("exo-surfaces: vantage registry", () => {
  const systems = loadSystems();

  it("every curated vantage resolves to a real planet in the catalogue", () => {
    for (const v of EXO_VANTAGES) {
      const r = resolveVantage(v.id, systems);
      expect(r, `${v.id} resolves`).not.toBeNull();
      expect(r!.planet.name).toBe(v.planetName);
      expect(r!.siblings.every((p) => p.name !== v.planetName)).toBe(true);
    }
  });

  it("getExoVantage / resolveVantage are null-safe on bad input", () => {
    expect(getExoVantage("nope")).toBeNull();
    expect(getExoVantage(null)).toBeNull();
    expect(resolveVantage("trappist-1e", null)).toBeNull();
    expect(resolveVantage("nope", systems)).toBeNull();
    expect(resolveVantage(undefined, systems)).toBeNull();
  });
});

describe("exo-surfaces: TRAPPIST-1e showcase", () => {
  const systems = loadSystems();
  const v = resolveVantage("trappist-1e", systems)!;

  it("host star subtends ~1.5-2.5 deg and ~3-5x our Sun, reddish", () => {
    const sky = hostStarSky(v)!;
    expect(sky).not.toBeNull();
    expect(sky.angularDiameterDeg).toBeGreaterThan(1.5);
    expect(sky.angularDiameterDeg).toBeLessThan(2.5);
    expect(sky.timesOurSun).toBeGreaterThan(3);
    expect(sky.timesOurSun).toBeLessThan(5);
    expect(sky.radiusDerived).toBe(false); // TRAPPIST-1 has a catalogue radius
    // reddish: strong red channel, weak blue channel (low Teff, ~2566 K)
    const r = parseInt(sky.color.slice(1, 3), 16);
    const b = parseInt(sky.color.slice(5, 7), 16);
    expect(r).toBeGreaterThan(b);
  });

  it("at least one sibling disc is larger than our Moon (>0.52 deg)", () => {
    const sib = siblingDiscs(v)!;
    expect(sib.discs.length).toBeGreaterThan(0);
    // sorted largest first
    expect(sib.discs[0].maxAngularDiameterDeg).toBeGreaterThan(0.52);
    expect(sib.discs[0].timesMoon).toBeGreaterThan(1);
    // d and f are the closest neighbours and beat the Moon
    const beatsMoon = sib.discs.filter((d) => d.maxAngularDiameterDeg > 0.52);
    expect(beatsMoon.length).toBeGreaterThanOrEqual(1);
  });

  it("Stefan-Boltzmann radius derivation reproduces the catalogue rad within a few percent", () => {
    const star = v.star;
    const lum = lsunFromLogLum(star.lum)!;
    const derived = Math.sqrt(lum) * Math.pow(5772 / star.teff!, 2);
    const catalog = star.rad!; // 0.1192
    expect(Math.abs(derived - catalog) / catalog).toBeLessThan(0.03);
  });
});

describe("exo-surfaces: surface gravity", () => {
  const systems = loadSystems();

  it("TRAPPIST-1e (Earth-like) is roughly 1 g", () => {
    const v = resolveVantage("trappist-1e", systems)!;
    const g = surfaceGravityG(v.planet)!;
    expect(g).not.toBeNull();
    expect(g.gEarth).toBeGreaterThan(0.6);
    expect(g.gEarth).toBeLessThan(1.1);
    expect(g.ms2).toBeCloseTo(g.gEarth * 9.80665, 5);
  });

  it("a super-Earth reads greater than 1 g", () => {
    // TOI-700 c: 7.27 M_earth, 2.6 R_earth -> ~1.07 g (super-Earth)
    const sup = { mass_me: 7.27, radius_re: 1.8 }; // 1.8 R -> super-earth, >1 g
    const g = surfaceGravityG(sup)!;
    expect(g).not.toBeNull();
    expect(g.gEarth).toBeGreaterThan(1);
  });

  it("a gas giant has no surface and null surface gravity", () => {
    const v = resolveVantage("51-peg-b", systems)!;
    expect(hasSurface(v.planet)).toBe(false);
    expect(surfaceGravityG(v.planet)).toBeNull();
    const state = exoSurfaceState("51-peg-b", systems)!;
    expect(state.hasSurface).toBe(false);
    expect(state.surfaceGravity).toBeNull();
    expect(state.hostStarSky).not.toBeNull(); // sky still described
    expect(state.note).toContain("NO solid surface");
  });
});

describe("exo-surfaces: Proxima Centauri b", () => {
  const systems = loadSystems();
  const state = exoSurfaceState("proxima-cen-b", systems)!;

  it("tidal locking is flagged as an INFERENCE, not a measurement", () => {
    expect(state.tidalLock).not.toBeNull();
    expect(state.tidalLock!.inferred).toBe(true);
    expect(state.tidalLock!.likelyLocked).toBe(true);
    expect(state.tidalLock!.note.toLowerCase()).toContain("inferred");
  });

  it("irradiance and equilibrium temperature are finite, year = period", () => {
    expect(state.irradiance).not.toBeNull();
    expect(Number.isFinite(state.irradiance!.wm2)).toBe(true);
    expect(state.equilibriumTempK).not.toBeNull();
    expect(Number.isFinite(state.equilibriumTempK!)).toBe(true);
    const v = resolveVantage("proxima-cen-b", systems)!;
    expect(state.year!.yearDays).toBe(v.planet.period_days);
  });

  it("day-length note is honest about unknown rotation", () => {
    const v = resolveVantage("proxima-cen-b", systems)!;
    const y = yearInfo(v.planet, v.star)!;
    expect(y.dayLengthNote.toLowerCase()).toContain("not measured");
  });
});

describe("exo-surfaces: TOI-700 d temperate world", () => {
  const systems = loadSystems();
  const state = exoSurfaceState("toi-700-d", systems)!;

  it("has a surface, finite conditions, and an HZ verdict", () => {
    expect(state.hasSurface).toBe(true);
    expect(state.surfaceGravity).not.toBeNull();
    expect(state.equilibriumTempK).not.toBeNull();
    expect(state.inHabitableZone === true || state.inHabitableZone === false).toBe(
      true
    );
    expect(state.hostStarSky!.color[0]).toBe("#");
  });
});

describe("exo-surfaces: null-safety and determinism", () => {
  const systems = loadSystems();

  it("all accessors return null on missing input, never throw", () => {
    expect(hostStarSky(null)).toBeNull();
    expect(siblingDiscs(null)).toBeNull();
    expect(surfaceGravityG(null)).toBeNull();
    expect(surfaceGravityG({})).toBeNull();
    expect(irradianceEarths(null)).toBeNull();
    expect(irradianceEarths({})).toBeNull();
    expect(tidalLockInference(null, null)).toBeNull();
    expect(tidalLockInference({ sma_au: 0.1 }, {})).toBeNull(); // no stellar mass
    expect(yearInfo(null, null)).toBeNull();
    expect(hasSurface(null)).toBe(false);
    expect(exoSurfaceState("nope", systems)).toBeNull();
    expect(exoSurfaceState("trappist-1e", null)).toBeNull();
  });

  it("Stefan-Boltzmann radius path fires when a star lacks a catalogue radius", () => {
    // A synthetic system whose star has no rad but has lum + teff.
    const fake: ExoSystem[] = [
      {
        hostname: "TRAPPIST-1",
        distance_ly: 40.5,
        star: { teff: 2566, lum: -3.2573, mass: 0.0898, rad: null },
        planets: [{ name: "TRAPPIST-1 e", sma_au: 0.02925, radius_re: 0.92, mass_me: 0.692, period_days: 6.1, insol: 0.646, eqt_k: 250 }],
      },
    ];
    const sky = hostStarSky(resolveVantage("trappist-1e", fake))!;
    expect(sky.radiusDerived).toBe(true);
    // derived radius reproduces the real 0.1192 R_sun within a few percent
    expect(Math.abs(sky.starRadiusRsun - 0.1192) / 0.1192).toBeLessThan(0.03);
    expect(sky.note).toContain("Stefan");
  });

  it("is deterministic: identical inputs give identical output", () => {
    const a = JSON.stringify(exoSurfaceState("trappist-1e", systems));
    const b = JSON.stringify(exoSurfaceState("trappist-1e", systems));
    expect(a).toBe(b);
  });
});
