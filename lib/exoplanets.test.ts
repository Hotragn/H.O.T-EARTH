import { describe, expect, it } from "vitest";
import {
  type ExoPlanet,
  type ExoStar,
  compareToSolarSystem,
  compositionClass,
  conservativeHZ,
  earthOrbitReferenceAU,
  equilibriumTempK,
  exoPlanetDerived,
  habitableZone,
  isInHabitableZone,
  lsunFromLogLum,
  optimisticHZ,
  pcToLightYears,
  planetTint,
  solveKepler,
  starColor,
  systemLayout,
} from "./exoplanets";

/**
 * Physics acceptance tests for the exoplanets layer.
 *
 * Reference values and their sources:
 *   • Habitable zone — Kopparapu et al. (2013), ApJ 765, 131. For the Sun
 *     (L=1, Teff=5780): recentVenus ~0.75, runawayGreenhouse ~0.99, maxGreenhouse
 *     ~1.69, earlyMars ~1.77 AU. Conservative band ≈ 0.95–1.68, optimistic ≈
 *     0.75–1.77 AU (asserted within ~10%).
 *   • Equilibrium temperature — Teq = 278.5·(1−A)^¼·L^¼·a^-½. Earth: ~255 K at
 *     A=0.3, ~279 K at A=0.
 *   • Composition transition — Fulton et al. (2017) / Rogers (2015) radius valley
 *     at ~1.5–2.0 R⊕.
 *   • 1 pc = 3.26156 ly.
 */

describe("habitable zone — Kopparapu et al. (2013), the Sun", () => {
  const sun = habitableZone(1, 5780);

  it("returns a full set of boundaries for the Sun", () => {
    expect(sun).not.toBeNull();
  });

  it("conservative band ≈ 0.95–1.68 AU (runaway → max greenhouse), within ~10%", () => {
    const hz = sun!;
    // Runaway greenhouse (conservative inner) ~0.99 AU; ~0.95 target within 10%.
    expect(Math.abs(hz.conservative.inner - 0.95) / 0.95).toBeLessThan(0.1);
    // Maximum greenhouse (conservative outer) ~1.69 AU; ~1.68 target within 10%.
    expect(Math.abs(hz.conservative.outer - 1.68) / 1.68).toBeLessThan(0.1);
    expect(hz.conservative.inner).toBeCloseTo(hz.runawayGreenhouse, 12);
    expect(hz.conservative.outer).toBeCloseTo(hz.maxGreenhouse, 12);
  });

  it("optimistic band ≈ 0.75–1.77 AU (recent Venus → early Mars), within ~10%", () => {
    const hz = sun!;
    expect(Math.abs(hz.optimistic.inner - 0.75) / 0.75).toBeLessThan(0.1);
    expect(Math.abs(hz.optimistic.outer - 1.77) / 1.77).toBeLessThan(0.1);
    expect(hz.optimistic.inner).toBeCloseTo(hz.recentVenus, 12);
    expect(hz.optimistic.outer).toBeCloseTo(hz.earlyMars, 12);
  });

  it("named boundaries land near the published Solar values", () => {
    const hz = sun!;
    expect(hz.recentVenus).toBeCloseTo(0.75, 1); // ~0.750 AU
    expect(hz.runawayGreenhouse).toBeCloseTo(0.98, 1); // ~0.981 AU
    expect(hz.maxGreenhouse).toBeCloseTo(1.69, 1); // ~1.689 AU
    expect(hz.earlyMars).toBeCloseTo(1.77, 1); // ~1.766 AU
  });

  it("boundaries are strictly ordered rV < runaway < maxGreenhouse < earlyMars", () => {
    const hz = sun!;
    expect(hz.recentVenus).toBeLessThan(hz.runawayGreenhouse);
    expect(hz.runawayGreenhouse).toBeLessThan(hz.maxGreenhouse);
    expect(hz.maxGreenhouse).toBeLessThan(hz.earlyMars);
  });

  it("conservativeHZ / optimisticHZ convenience wrappers agree with habitableZone", () => {
    expect(conservativeHZ(1, 5780)).toEqual(sun!.conservative);
    expect(optimisticHZ(1, 5780)).toEqual(sun!.optimistic);
  });

  it("defaults Teff to the Sun's 5780 K when omitted", () => {
    expect(habitableZone(1)).toEqual(habitableZone(1, 5780));
  });
});

describe("habitable zone — monotonicity", () => {
  it("a more-luminous, hotter star pushes every HZ boundary outward", () => {
    const sun = habitableZone(1, 5780)!;
    const bright = habitableZone(10, 7000)!; // ~F star, 10× luminosity
    expect(bright.recentVenus).toBeGreaterThan(sun.recentVenus);
    expect(bright.runawayGreenhouse).toBeGreaterThan(sun.runawayGreenhouse);
    expect(bright.maxGreenhouse).toBeGreaterThan(sun.maxGreenhouse);
    expect(bright.earlyMars).toBeGreaterThan(sun.earlyMars);
  });

  it("HZ distance scales as sqrt(L): 4× luminosity ⇒ ~2× distance", () => {
    const l1 = habitableZone(1, 5780)!;
    const l4 = habitableZone(4, 5780)!;
    expect(l4.runawayGreenhouse / l1.runawayGreenhouse).toBeCloseTo(2, 5);
    expect(l4.maxGreenhouse / l1.maxGreenhouse).toBeCloseTo(2, 5);
  });

  it("a cool M-dwarf HZ hugs the star (small distances)", () => {
    const mdwarf = habitableZone(0.01, 3200)!; // ~0.01 L_sun red dwarf
    expect(mdwarf.conservative.inner).toBeLessThan(0.15);
    expect(mdwarf.conservative.outer).toBeLessThan(0.25);
  });

  it("clamps Teff outside the model's 2600–7200 K validity window", () => {
    const hot = habitableZone(1, 9000)!;
    expect(hot.teffK).toBe(7200);
    expect(hot.teffClamped).toBe(true);
    const cold = habitableZone(1, 2000)!;
    expect(cold.teffK).toBe(2600);
    expect(cold.teffClamped).toBe(true);
  });
});

describe("equilibrium temperature", () => {
  it("Earth ≈ 255 K at A = 0.3", () => {
    expect(equilibriumTempK(1, 1, 0.3)!).toBeCloseTo(255, 0);
  });

  it("Earth ≈ 279 K at A = 0 (exactly the 278.5 K constant)", () => {
    // With A=0, a=1, L=1 the formula reduces to the 278.5 K constant, which
    // rounds to the ~279 K reference value (|278.5 − 279| = 0.5 K).
    expect(equilibriumTempK(1, 1, 0)!).toBeCloseTo(278.5, 6);
    expect(Math.abs(equilibriumTempK(1, 1, 0)! - 279)).toBeLessThanOrEqual(0.5);
  });

  it("defaults to Earth-like A = 0.3", () => {
    expect(equilibriumTempK(1, 1)).toBeCloseTo(equilibriumTempK(1, 1, 0.3)!, 12);
  });

  it("scales as L^¼ and a^-½", () => {
    // 16× luminosity ⇒ 2× temperature; 4× distance ⇒ ½ temperature.
    expect(equilibriumTempK(16, 1, 0)!).toBeCloseTo(
      2 * equilibriumTempK(1, 1, 0)!,
      6
    );
    expect(equilibriumTempK(1, 4, 0)!).toBeCloseTo(
      0.5 * equilibriumTempK(1, 1, 0)!,
      6
    );
  });

  it("a hot close-in world runs very hot (e.g. 0.05 AU around the Sun)", () => {
    const t = equilibriumTempK(1, 0.05, 0.3)!;
    expect(t).toBeGreaterThan(1000); // incandescent regime
  });
});

describe("in-habitable-zone test", () => {
  const sun: ExoStar = { lum: 1, teff: 5780 };

  it("Earth (1 AU) is in the Sun's conservative HZ", () => {
    expect(isInHabitableZone(1, sun.lum, sun.teff)).toBe(true);
  });

  it("a 0.85 AU world is outside the conservative HZ but inside the optimistic HZ", () => {
    // 0.85 AU sits between the optimistic inner edge (recent Venus ~0.75 AU) and
    // the conservative inner edge (runaway greenhouse ~0.98 AU).
    expect(isInHabitableZone(0.85, sun.lum, sun.teff, { conservative: true })).toBe(
      false
    );
    expect(
      isInHabitableZone(0.85, sun.lum, sun.teff, { conservative: false })
    ).toBe(true);
  });

  it("Venus (0.72 AU) is interior to even the optimistic inner edge (a runaway world)", () => {
    expect(isInHabitableZone(0.72, sun.lum, sun.teff, { conservative: false })).toBe(
      false
    );
  });

  it("Mars (1.52 AU) is inside both bands, a hot Jupiter (0.05 AU) is inside neither", () => {
    expect(isInHabitableZone(1.52, sun.lum, sun.teff)).toBe(true);
    expect(isInHabitableZone(0.05, sun.lum, sun.teff)).toBe(false);
  });
});

describe("composition class — radius/mass thresholds", () => {
  it("classifies by radius across the demographic bins", () => {
    expect(compositionClass(1.0)!.class).toBe("rocky"); // Earth-size
    expect(compositionClass(1.7)!.class).toBe("super-earth");
    expect(compositionClass(2.5)!.class).toBe("sub-neptune");
    expect(compositionClass(6.0)!.class).toBe("neptune-like");
    expect(compositionClass(11.0)!.class).toBe("gas-giant"); // near Jupiter 11.2 R⊕
  });

  it("boundary values fall into the upper bin (exclusive upper bound)", () => {
    expect(compositionClass(1.5)!.class).toBe("super-earth");
    expect(compositionClass(2.0)!.class).toBe("sub-neptune");
    expect(compositionClass(4.0)!.class).toBe("neptune-like");
    expect(compositionClass(10.0)!.class).toBe("gas-giant");
  });

  it("prefers radius but falls back to mass when radius is missing", () => {
    const byRadius = compositionClass(1.0, 300);
    expect(byRadius!.basis).toBe("radius");
    const byMass = compositionClass(null, 1.0);
    expect(byMass!.basis).toBe("mass");
    expect(byMass!.class).toBe("rocky");
    expect(compositionClass(undefined, 100)!.class).toBe("gas-giant");
  });

  it("flags the estimate honestly and cites the radius valley", () => {
    expect(compositionClass(1.8)!.note.toLowerCase()).toContain("fulton");
    expect(compositionClass(1.0)!.note.toLowerCase()).toContain("not an");
  });

  it("returns null when both radius and mass are missing", () => {
    expect(compositionClass(null, null)).toBeNull();
    expect(compositionClass(undefined, undefined)).toBeNull();
  });
});

describe("illustrative colours", () => {
  const hex = /^#[0-9a-f]{6}$/;

  it("starColor spans blue (hot) to red (cool) and is a valid hex", () => {
    expect(starColor(30000)).toMatch(hex); // O/B — blue
    expect(starColor(5780)).toMatch(hex); // Sun — near white
    expect(starColor(3000)).toMatch(hex); // M — orange-red
    // Hot star should be bluer (more blue than red); cool star redder.
    const hot = starColor(30000);
    const cool = starColor(3000);
    const blueOf = (h: string) => parseInt(h.slice(5, 7), 16);
    const redOf = (h: string) => parseInt(h.slice(1, 3), 16);
    expect(blueOf(hot)).toBeGreaterThan(blueOf(cool));
    expect(redOf(cool)).toBeGreaterThanOrEqual(redOf(hot) - 1);
  });

  it("starColor falls back to a Sun-like white when Teff is missing", () => {
    expect(starColor(null)).toMatch(hex);
    expect(starColor(undefined)).toBe("#fff4ea");
  });

  it("planetTint maps hot worlds toward red and cold worlds toward pale, valid hex", () => {
    const hot = planetTint(1500, "rocky");
    const cold = planetTint(60, "rocky");
    expect(hot).toMatch(hex);
    expect(cold).toMatch(hex);
    const redOf = (h: string) => parseInt(h.slice(1, 3), 16);
    const blueOf = (h: string) => parseInt(h.slice(5, 7), 16);
    // hot: red dominates blue; cold: pale/icy so blue is high.
    expect(redOf(hot)).toBeGreaterThan(blueOf(hot));
    expect(blueOf(cold)).toBeGreaterThan(150);
  });

  it("planetTint tolerates a missing temperature (colours by class)", () => {
    expect(planetTint(null, "gas-giant")).toMatch(hex);
    expect(planetTint(undefined, null)).toMatch(hex);
  });
});

describe("unit + comparison helpers", () => {
  it("pcToLightYears(1) ≈ 3.262", () => {
    expect(pcToLightYears(1)!).toBeCloseTo(3.262, 3);
    expect(pcToLightYears(10)!).toBeCloseTo(32.6156, 3);
  });

  it("lsunFromLogLum inverts log10 (0 → 1, 1 → 10, -1 → 0.1)", () => {
    expect(lsunFromLogLum(0)!).toBeCloseTo(1, 12);
    expect(lsunFromLogLum(1)!).toBeCloseTo(10, 12);
    expect(lsunFromLogLum(-1)!).toBeCloseTo(0.1, 12);
  });

  it("earthOrbitReferenceAU is exactly 1 for the Solar-System overlay", () => {
    expect(earthOrbitReferenceAU()).toBe(1);
  });

  it("compareToSolarSystem classifies orbits against Mercury/Earth/Jupiter", () => {
    expect(compareToSolarSystem(0.05)!.label).toContain("Interior to Mercury");
    expect(compareToSolarSystem(0.05)!.nearest).toBe("Mercury");
    expect(compareToSolarSystem(1.0)!.nearest).toBe("Earth");
    expect(compareToSolarSystem(0.7)!.label).toContain("Mercury");
    expect(compareToSolarSystem(20)!.label).toContain("Beyond Jupiter");
    expect(compareToSolarSystem(20)!.nearest).toBe("Jupiter");
  });
});

describe("null-safety — undefined/missing inputs return null, never throw", () => {
  it("habitableZone tolerates missing / non-positive luminosity", () => {
    expect(habitableZone(undefined)).toBeNull();
    expect(habitableZone(null)).toBeNull();
    expect(habitableZone(0)).toBeNull();
    expect(habitableZone(-1)).toBeNull();
    expect(conservativeHZ(undefined)).toBeNull();
    expect(optimisticHZ(null)).toBeNull();
  });

  it("equilibriumTempK returns null for missing luminosity or sma", () => {
    expect(equilibriumTempK(undefined, 1)).toBeNull();
    expect(equilibriumTempK(1, undefined)).toBeNull();
    expect(equilibriumTempK(null, null)).toBeNull();
    expect(equilibriumTempK(1, 0)).toBeNull(); // sma must be > 0
  });

  it("isInHabitableZone returns null (not false) when inputs are unknown", () => {
    expect(isInHabitableZone(undefined, 1, 5780)).toBeNull();
    expect(isInHabitableZone(1, undefined, 5780)).toBeNull();
    expect(isInHabitableZone(null, null)).toBeNull();
  });

  it("helpers tolerate null (never NaN)", () => {
    expect(pcToLightYears(null)).toBeNull();
    expect(pcToLightYears(undefined)).toBeNull();
    expect(lsunFromLogLum(null)).toBeNull();
    expect(compareToSolarSystem(undefined)).toBeNull();
    expect(compareToSolarSystem(0)).toBeNull();
  });

  it("exoPlanetDerived is robust to a nearly-empty catalogue row", () => {
    const planet: ExoPlanet = { name: "Blank b" }; // no sma/mass/eqt/radius
    const star: ExoStar = {}; // no lum/teff
    const d = exoPlanetDerived(planet, star);
    expect(d.eqtK).toBeNull();
    expect(d.composition).toBeNull();
    expect(d.inHabitableZone).toBeNull();
    expect(d.solarSystem).toBeNull();
    expect(d.tint).toMatch(/^#[0-9a-f]{6}$/); // still a usable colour
    expect(Number.isNaN(Number(d.eqtK))).toBe(false); // null, not NaN
  });

  it("exoPlanetDerived computes eqt from L+sma when the catalogue omits it", () => {
    const planet: ExoPlanet = { name: "Comp b", sma_au: 1, radius_re: 1.0 };
    const star: ExoStar = { lum: 1, teff: 5780 };
    const d = exoPlanetDerived(planet, star);
    expect(d.eqtComputed).toBe(true);
    expect(d.eqtK!).toBeCloseTo(255, 0); // Earth-like
    expect(d.composition!.class).toBe("rocky");
    expect(d.inHabitableZone).toBe(true);
    expect(d.solarSystem!.nearest).toBe("Earth");
  });

  it("exoPlanetDerived prefers the catalogue eqt when present", () => {
    const planet: ExoPlanet = { name: "Given b", sma_au: 1, eqt_k: 400 };
    const d = exoPlanetDerived(planet, { lum: 1, teff: 5780 });
    expect(d.eqtComputed).toBe(false);
    expect(d.eqtK).toBe(400);
  });
});

describe("Kepler solver (M → E) — convergence", () => {
  it("satisfies M = E − e·sinE to ~1e-9 across e = 0…0.95", () => {
    for (let e = 0; e <= 0.95; e += 0.05) {
      for (let deg = 0; deg < 360; deg += 5) {
        const M = deg * (Math.PI / 180);
        const E = solveKepler(M, e);
        const residual =
          E - e * Math.sin(E) - Math.atan2(Math.sin(M), Math.cos(M));
        expect(Math.abs(residual)).toBeLessThan(1e-9);
      }
    }
  });

  it("stays finite for a highly eccentric orbit (e = 0.9)", () => {
    for (let deg = 0; deg < 360; deg += 1) {
      const E = solveKepler(deg * (Math.PI / 180), 0.9);
      expect(Number.isFinite(E)).toBe(true);
    }
  });
});

describe("system layout — architecture view", () => {
  // A mixed system: an eccentric hot super-Earth, a temperate world, an outer
  // giant. Star mass ~1 M_sun. (Values illustrative, not a real system.)
  const planets: ExoPlanet[] = [
    { name: "b", sma_au: 0.05, ecc: 0.3, period_days: 4, radius_re: 1.6 },
    { name: "c", sma_au: 1.0, ecc: 0.0, period_days: 365, radius_re: 1.0 },
    { name: "d", sma_au: 5.0, ecc: 0.1, period_days: 4080, radius_re: 11 },
  ];

  it("keeps the TRUE semi-major axis for honest labels", () => {
    const layout = systemLayout(planets);
    expect(layout.planets.map((p) => p.sma_au)).toEqual([0.05, 1.0, 5.0]);
  });

  it("preserves orbit ORDER under compression (inner→outer scene radius grows)", () => {
    const layout = systemLayout(planets, { mode: "log", timeDays: 0 });
    // Outermost planet has the largest compressed scene radius.
    expect(layout.planets[2].sceneRadius).toBeGreaterThan(
      layout.planets[1].sceneRadius
    );
    expect(layout.planets[1].sceneRadius).toBeGreaterThan(
      layout.planets[0].sceneRadius
    );
    // Compression is much tighter than the raw 100× AU span.
    const auRatio = 5.0 / 0.05;
    const sceneRatio =
      Math.max(...layout.planets.map((p) => p.sceneRadius)) /
      Math.min(...layout.planets.map((p) => p.sceneRadius));
    expect(auRatio).toBe(100);
    expect(sceneRatio).toBeLessThan(auRatio);
  });

  it("x,z match sceneRadius and angleRad (scene mapping x=r cosθ, z=−r sinθ)", () => {
    const layout = systemLayout(planets, { timeDays: 123 });
    for (const p of layout.planets) {
      expect(Math.hypot(p.x, p.z)).toBeCloseTo(p.sceneRadius, 9);
      expect(p.x).toBeCloseTo(p.sceneRadius * Math.cos(p.angleRad), 9);
      expect(p.z).toBeCloseTo(-p.sceneRadius * Math.sin(p.angleRad), 9);
    }
  });

  it("shorter-period planets sweep more angle over a fixed time step", () => {
    const t0 = systemLayout(planets, { timeDays: 0 });
    const t1 = systemLayout(planets, { timeDays: 1 }); // +1 day
    const sweep = (name: string) => {
      const a = t0.planets.find((p) => p.name === name)!.angleRad;
      const b = t1.planets.find((p) => p.name === name)!.angleRad;
      let d = Math.abs(b - a);
      if (d > Math.PI) d = 2 * Math.PI - d;
      return d;
    };
    // b (4 d period) sweeps far more per day than d (4080 d period).
    expect(sweep("b")).toBeGreaterThan(sweep("d"));
  });

  it("linear mode keeps true proportional distances (unitsPerAU)", () => {
    const layout = systemLayout(planets, { mode: "linear", unitsPerAU: 2, timeDays: 0 });
    for (const p of layout.planets) {
      // scene radius = r × unitsPerAU, and r = a(1 − e cosE); at least ordering holds
      expect(p.sceneRadius).toBeGreaterThan(0);
    }
    // Circular planet c: r = a exactly, so sceneRadius = 1.0 × 2 (up to phase).
    const c = layout.planets.find((p) => p.name === "c")!;
    expect(c.sceneRadius).toBeCloseTo(1.0 * 2, 9); // e=0 ⇒ r=a always
    expect(layout.note).toContain("to scale");
  });

  it("derives a missing sma from period (and vice versa) via Kepler's 3rd law", () => {
    // Only a period given ⇒ sma recovered ≈ 1 AU for a 365.25 d orbit, 1 M_sun.
    const layout = systemLayout([{ name: "p", period_days: 365.25 }], {
      starMassMsun: 1,
    });
    expect(layout.planets[0].sma_au).toBeCloseTo(1.0, 3);
  });

  it("omits planets that have neither sma nor period, counting them", () => {
    const layout = systemLayout([
      { name: "ok", sma_au: 1 },
      { name: "ghost" }, // no sma, no period
    ]);
    expect(layout.planets.map((p) => p.name)).toEqual(["ok"]);
    expect(layout.omitted).toBe(1);
  });

  it("treats a missing eccentricity as 0 (circular)", () => {
    const layout = systemLayout([{ name: "x", sma_au: 1, period_days: 365 }]);
    expect(layout.planets[0].ecc).toBe(0);
  });

  it("is deterministic — same inputs give identical output", () => {
    const opts = { mode: "log" as const, timeDays: 500 };
    expect(systemLayout(planets, opts)).toEqual(systemLayout(planets, opts));
  });

  it("emits an honest note describing the compression and illustrative phase", () => {
    expect(systemLayout(planets, { mode: "log" }).note).toContain("log-compressed");
    expect(systemLayout(planets, { mode: "sqrt" }).note).toContain(
      "sqrt-compressed"
    );
    expect(systemLayout(planets).note.toLowerCase()).toContain("illustrative");
  });

  it("produces finite coordinates for every placed planet", () => {
    for (const t of [0, 10, 1000, 100000]) {
      const layout = systemLayout(planets, { timeDays: t });
      for (const p of layout.planets) {
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.z)).toBe(true);
        expect(Number.isFinite(p.sceneRadius)).toBe(true);
        expect(Number.isFinite(p.angleRad)).toBe(true);
      }
    }
  });
});
