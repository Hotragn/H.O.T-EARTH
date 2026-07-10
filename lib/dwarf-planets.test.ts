import { describe, expect, it } from "vitest";
import {
  CHARON,
  DWARFS,
  DWARF_ORDER,
  type DwarfName,
  aphelionAU,
  charonOrbitalPeriodDays,
  compressRadius,
  dwarfState,
  dwarfSunDirection,
  haumeaTriaxialAxes,
  heliocentricDistanceAU,
  heliocentricPosition,
  isImaged,
  isTidallyLocked,
  keplerPeriodYears,
  moonCount,
  neptuneResonance,
  orbitalPeriodYears,
  orreryLayout,
  perihelionAU,
  rotationPeriodHours,
  solveKepler,
  subSolarLongitude,
  subSolarPoint,
  triaxialAxesKm,
} from "./dwarf-planets";

/**
 * Physics acceptance tests for the dwarf-planet orbital layer.
 *
 * Sources for the asserted reference values:
 *   • Orbital elements (a, e, i, Ω, ω, M₀) and sidereal periods: JPL Small-Body
 *     Database (SBDB). https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html
 *   • Physical parameters (radius, rotation, albedo, temperature, moons) and
 *     Haumea's triaxial shape: NASA/JPL body pages + New Horizons / Dawn results.
 *   • Charon orbit (a≈19,591 km, P≈6.387 d, mutual lock): NASA New Horizons/JPL.
 *
 * Known sidereal orbital periods (Earth years), asserted below (±~2%):
 *   Ceres 4.60 · Pluto 247.9 · Haumea 284 · Makemake 306 · Eris 558
 * Perihelion / aphelion bands (AU):
 *   Pluto 29.7–49.3 · Ceres 2.55–2.98 · Eris ~38–98
 */
const KNOWN_PERIOD_YEARS: Record<DwarfName, number> = {
  Ceres: 4.6,
  Pluto: 248,
  Haumea: 285,
  Makemake: 306,
  Eris: 559,
};

const DAY_MS = 86_400_000;
const YEAR_MS = 365.25 * DAY_MS;

describe("orbital periods (Kepler's 3rd law from a)", () => {
  it("P = a^1.5 matches the known sidereal periods within ~2%", () => {
    for (const body of DWARF_ORDER) {
      const derived = keplerPeriodYears(body);
      const known = KNOWN_PERIOD_YEARS[body];
      const relErr = Math.abs(derived - known) / known;
      expect(relErr).toBeLessThan(0.02);
    }
  });

  it("names each classic period individually so a regression is obvious", () => {
    expect(keplerPeriodYears("Ceres")).toBeCloseTo(4.6, 1); // ~4.60 yr
    expect(keplerPeriodYears("Pluto")).toBeCloseTo(248, -1); // ~248 yr
    expect(keplerPeriodYears("Haumea")).toBeCloseTo(284, -1); // ~284 yr
    expect(keplerPeriodYears("Makemake")).toBeCloseTo(306, -1); // ~306 yr
    expect(keplerPeriodYears("Eris")).toBeCloseTo(558, -1); // ~558 yr
  });

  it("Kepler-derived period agrees with the tabulated SBDB period (<1%)", () => {
    for (const body of DWARF_ORDER) {
      const derived = keplerPeriodYears(body);
      const tabulated = orbitalPeriodYears(body);
      expect(Math.abs(derived - tabulated) / tabulated).toBeLessThan(0.01);
    }
  });
});

describe("heliocentric position — distances stay in the peri/aphelion band", () => {
  // Sample a long span; the outer dwarfs move slowly (Eris ~558 yr) so a wide
  // window still keeps r inside [perihelion, aphelion] at every instant.
  const dates: Date[] = [];
  for (let y = 0; y <= 300; y += 5) {
    dates.push(new Date(Date.UTC(2000, 0, 1) + y * YEAR_MS));
    dates.push(new Date(Date.UTC(2000, 6, 1) + y * YEAR_MS));
  }

  it("Pluto stays within ~29.7–49.3 AU", () => {
    for (const d of dates) {
      const r = heliocentricDistanceAU("Pluto", d);
      expect(r).toBeGreaterThan(29.5);
      expect(r).toBeLessThan(49.5);
    }
  });

  it("Ceres stays within ~2.55–2.98 AU", () => {
    for (const d of dates) {
      const r = heliocentricDistanceAU("Ceres", d);
      expect(r).toBeGreaterThan(2.54);
      expect(r).toBeLessThan(2.99);
    }
  });

  it("Eris stays within ~38–98 AU (extreme eccentricity)", () => {
    for (const d of dates) {
      const r = heliocentricDistanceAU("Eris", d);
      expect(r).toBeGreaterThan(37.8);
      expect(r).toBeLessThan(97.8);
    }
  });

  it("every body stays within its own perihelion/aphelion band", () => {
    for (const body of DWARF_ORDER) {
      const peri = perihelionAU(body);
      const aph = aphelionAU(body);
      const margin = 1e-6 * aph;
      for (const d of dates) {
        const r = heliocentricDistanceAU(body, d);
        expect(r).toBeGreaterThanOrEqual(peri - margin);
        expect(r).toBeLessThanOrEqual(aph + margin);
      }
    }
  });

  it("produces finite, stable positions for every body 2000–2300", () => {
    for (const body of DWARF_ORDER) {
      for (const d of dates) {
        const p = heliocentricPosition(body, d);
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
        expect(Number.isFinite(p.z)).toBe(true);
        expect(Number.isFinite(p.distanceAU)).toBe(true);
        expect(p.longitudeDeg).toBeGreaterThanOrEqual(0);
        expect(p.longitudeDeg).toBeLessThan(360);
      }
    }
  });
});

describe("Kepler solver — convergence at HIGH eccentricity", () => {
  it("returns E satisfying M = E − e·sinE to ~1e-9 up to e = 0.45 (Eris)", () => {
    for (let e = 0; e <= 0.45; e += 0.03) {
      for (let deg = 0; deg < 360; deg += 5) {
        const M = deg * (Math.PI / 180);
        const E = solveKepler(M, e);
        const residual =
          E - e * Math.sin(E) - Math.atan2(Math.sin(M), Math.cos(M));
        expect(Math.abs(residual)).toBeLessThan(1e-9);
      }
    }
  });

  it("converges specifically at Eris' e ≈ 0.44 for the whole orbit", () => {
    const e = DWARFS.Eris.orbit.e;
    expect(e).toBeGreaterThan(0.4);
    for (let deg = 0; deg < 360; deg += 1) {
      const M = deg * (Math.PI / 180);
      const E = solveKepler(M, e);
      expect(Number.isFinite(E)).toBe(true);
      const residual =
        E - e * Math.sin(E) - Math.atan2(Math.sin(M), Math.cos(M));
      expect(Math.abs(residual)).toBeLessThan(1e-9);
    }
  });
});

describe("Haumea triaxial shape & fast rotation", () => {
  it("returns three axes a > b > c ≈ 2100 / 1680 / 1074 km", () => {
    const ax = haumeaTriaxialAxes();
    expect(ax.a).toBeGreaterThan(ax.b);
    expect(ax.b).toBeGreaterThan(ax.c);
    expect(ax.a).toBeCloseTo(2100, -2);
    expect(ax.b).toBeCloseTo(1680, -2);
    expect(ax.c).toBeCloseTo(1074, -2);
  });

  it("triaxialAxesKm returns the shape for Haumea and undefined otherwise", () => {
    expect(triaxialAxesKm("Haumea")).toEqual({ a: 2100, b: 1680, c: 1074 });
    for (const body of DWARF_ORDER) {
      if (body !== "Haumea") expect(triaxialAxesKm(body)).toBeUndefined();
    }
  });

  it("rotation period is ~3.9 h (one of the fastest large-body spins)", () => {
    expect(rotationPeriodHours("Haumea")).toBeCloseTo(3.9, 1);
    expect(DWARFS.Haumea.physical.rotationPeriodHours).toBeCloseTo(3.9155, 3);
  });
});

describe("Charon — Pluto's mutually-locked companion", () => {
  it("orbits Pluto in ~6.39 d at ~19,591 km", () => {
    expect(charonOrbitalPeriodDays()).toBeCloseTo(6.39, 1);
    expect(CHARON.orbit.siderealPeriodDays).toBeCloseTo(6.3872, 3);
    expect(CHARON.orbit.semiMajorAxisKm).toBe(19_591);
  });

  it("is tidally locked, and so is Pluto (mutual lock); others are not", () => {
    expect(CHARON.orbit.tidallyLocked).toBe(true);
    expect(isTidallyLocked("Charon")).toBe(true);
    expect(isTidallyLocked("Pluto")).toBe(true);
    for (const body of DWARF_ORDER) {
      if (body !== "Pluto") expect(isTidallyLocked(body)).toBe(false);
    }
  });

  it("rotates once per orbit (rotation period = orbital period)", () => {
    // Mutual lock: Charon's spin period equals its ~6.387 d orbit about Pluto,
    // which is also Pluto's rotation period.
    expect(rotationPeriodHours("Charon")).toBeCloseTo(
      CHARON.orbit.siderealPeriodDays * 24,
      6
    );
    expect(rotationPeriodHours("Charon")).toBeCloseTo(
      rotationPeriodHours("Pluto"),
      1
    );
  });
});

describe("imaging & moon-count lookups", () => {
  it("only Pluto, Ceres and Charon are imaged; the rest are not", () => {
    expect(isImaged("Pluto")).toBe(true);
    expect(isImaged("Ceres")).toBe(true);
    expect(isImaged("Charon")).toBe(true);
    expect(isImaged("Eris")).toBe(false);
    expect(isImaged("Haumea")).toBe(false);
    expect(isImaged("Makemake")).toBe(false);
  });

  it("reports known satellite counts", () => {
    expect(moonCount("Pluto")).toBe(5); // Charon, Nix, Hydra, Kerberos, Styx
    expect(moonCount("Ceres")).toBe(0);
    expect(moonCount("Haumea")).toBe(2); // Hiʻiaka, Namaka
    expect(moonCount("Makemake")).toBe(1);
    expect(moonCount("Eris")).toBe(1); // Dysnomia
  });
});

describe("Pluto ↔ Neptune 3:2 resonance", () => {
  it("Pluto's perihelion dips inside Neptune's orbit", () => {
    const res = neptuneResonance();
    expect(res.plutoPerihelionAU).toBeCloseTo(29.66, 0);
    expect(res.plutoPerihelionAU).toBeLessThan(res.neptuneSemiMajorAU);
    expect(res.crossesNeptuneOrbit).toBe(true);
  });

  it("period ratio is ≈ 3/2 (Pluto twice per three Neptune orbits)", () => {
    const res = neptuneResonance();
    expect(res.periodRatioPlutoOverNeptune).toBeCloseTo(1.5, 1); // ~1.50
    expect(res.isThreeToTwo).toBe(true);
    expect(res.note).toContain("3:2");
  });
});

describe("rotation → sub-solar / terminator", () => {
  it("dwarfSunDirection returns a unit vector for every spinning body", () => {
    const d = new Date(Date.UTC(2025, 5, 1));
    for (const body of [...DWARF_ORDER, "Charon" as const]) {
      const [x, y, z] = dwarfSunDirection(body, d);
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 9);
    }
  });

  it("sub-solar point sits on the equator (no-obliquity simplification)", () => {
    for (const body of [...DWARF_ORDER, "Charon" as const]) {
      expect(subSolarPoint(body, new Date(Date.UTC(2031, 2, 2))).lat).toBe(0);
    }
  });

  it("sub-solar longitude completes one sweep per rotation period", () => {
    const t0 = new Date(Date.UTC(2025, 0, 1, 12));
    for (const body of [...DWARF_ORDER, "Charon" as const]) {
      const periodDays = rotationPeriodHours(body) / 24;
      const t1 = new Date(t0.getTime() + periodDays * DAY_MS);
      let diff = Math.abs(
        subSolarLongitude(body, t1) - subSolarLongitude(body, t0)
      );
      if (diff > 180) diff = 360 - diff;
      expect(diff).toBeLessThan(1e-3);
    }
  });

  it("fast rotators sweep the terminator faster than slow ones", () => {
    // Over a fixed short interval, Haumea (3.9 h) sweeps far more longitude than
    // Pluto (153 h). Compare unsigned sweep magnitude over 1 hour.
    const t0 = new Date(Date.UTC(2025, 0, 1, 0));
    const t1 = new Date(t0.getTime() + 3_600_000); // +1 h
    const sweep = (body: "Haumea" | "Pluto") => {
      let dl = subSolarLongitude(body, t1) - subSolarLongitude(body, t0);
      if (dl > 180) dl -= 360;
      if (dl < -180) dl += 360;
      return Math.abs(dl);
    };
    expect(sweep("Haumea")).toBeGreaterThan(sweep("Pluto"));
  });
});

describe("orrery layout (angles real, radius compressed)", () => {
  const date = new Date(Date.UTC(2026, 6, 8, 12));

  it("preserves the TRUE AU distance for honest labels", () => {
    const layout = orreryLayout(date);
    for (const b of layout.bodies) {
      expect(b.distanceAU).toBeCloseTo(heliocentricDistanceAU(b.name, date), 9);
    }
  });

  it("keeps the REAL angle: recovered longitude equals the heliocentric longitude", () => {
    const layout = orreryLayout(date);
    for (const b of layout.bodies) {
      // scene mapping is x = r cosλ, z = −r sinλ  ⇒  λ = atan2(−z, x)
      let lam = (Math.atan2(-b.z, b.x) * 180) / Math.PI;
      lam = ((lam % 360) + 360) % 360;
      const real = heliocentricPosition(b.name, date).longitudeDeg;
      let diff = Math.abs(lam - real);
      if (diff > 180) diff = 360 - diff;
      expect(diff).toBeLessThan(1e-6);
    }
  });

  it("scene radius equals |(x,z)| and matches sceneRadius", () => {
    const layout = orreryLayout(date);
    for (const b of layout.bodies) {
      expect(Math.hypot(b.x, b.z)).toBeCloseTo(b.sceneRadius, 9);
    }
  });

  it("log-compresses a huge AU span into a small scene range, order-preserving", () => {
    const layout = orreryLayout(date, {
      mode: "log",
      minRadius: 1,
      maxRadius: 10,
    });
    // compression is monotonic, so a farther body always gets a larger radius
    const sorted = [...layout.bodies].sort((a, b) => a.distanceAU - b.distanceAU);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].sceneRadius).toBeGreaterThan(sorted[i - 1].sceneRadius);
    }
    // and the whole compressed span is much tighter than the raw AU ratio
    const auRatio =
      Math.max(...layout.bodies.map((b) => b.distanceAU)) /
      Math.min(...layout.bodies.map((b) => b.distanceAU));
    const sceneRatio =
      Math.max(...layout.bodies.map((b) => b.sceneRadius)) /
      Math.min(...layout.bodies.map((b) => b.sceneRadius));
    expect(auRatio).toBeGreaterThan(10); // Ceres ~2.8 → Eris ~40+
    expect(sceneRatio).toBeLessThan(auRatio);
  });

  it("linear mode keeps true proportional distances (unitsPerAU)", () => {
    expect(compressRadius(50, { mode: "linear", unitsPerAU: 2 })).toBeCloseTo(
      100,
      9
    );
    const layout = orreryLayout(date, { mode: "linear", unitsPerAU: 1 });
    for (const b of layout.bodies) {
      expect(b.sceneRadius).toBeCloseTo(b.distanceAU, 6);
    }
    expect(layout.note).toContain("to scale");
  });

  it("emits an honest note describing the compression", () => {
    expect(orreryLayout(date, { mode: "log" }).note).toContain("log-compressed");
    expect(orreryLayout(date, { mode: "sqrt" }).note).toContain(
      "sqrt-compressed"
    );
    expect(orreryLayout(date).note).toContain("Angular positions are real");
  });
});

describe("physical parameters within sane ranges", () => {
  it("Ceres is the innermost/smallest orbit; Eris the widest", () => {
    expect(DWARFS.Ceres.orbit.a).toBeLessThan(DWARFS.Pluto.orbit.a);
    expect(DWARFS.Eris.orbit.a).toBeGreaterThan(DWARFS.Makemake.orbit.a);
  });

  it("eccentric, inclined orbits unlike the planets (Pluto & Eris)", () => {
    expect(DWARFS.Pluto.orbit.e).toBeCloseTo(0.25, 1);
    expect(DWARFS.Pluto.orbit.iDeg).toBeCloseTo(17, 0);
    expect(DWARFS.Eris.orbit.e).toBeCloseTo(0.44, 1);
    expect(DWARFS.Eris.orbit.iDeg).toBeCloseTo(44, 0);
  });

  it("flags the observationally uncertain rotation periods (Eris, Makemake)", () => {
    expect(DWARFS.Eris.physical.rotationUncertain).toBe(true);
    expect(DWARFS.Makemake.physical.rotationUncertain).toBe(true);
    expect(DWARFS.Pluto.physical.rotationUncertain).toBe(false);
    expect(DWARFS.Ceres.physical.rotationUncertain).toBe(false);
  });

  it("radii, albedos and temperatures are in-range for every body", () => {
    for (const body of DWARF_ORDER) {
      const p = DWARFS[body].physical;
      expect(p.meanRadiusKm).toBeGreaterThan(400); // Ceres ~470 km smallest
      expect(p.meanRadiusKm).toBeLessThan(1300); // Pluto/Eris ~1160–1190 km
      expect(p.geometricAlbedo).toBeGreaterThan(0);
      expect(p.geometricAlbedo).toBeLessThanOrEqual(1);
      expect(p.meanSurfaceTempK).toBeGreaterThan(20); // Eris ~30 K coldest
      expect(p.meanSurfaceTempK).toBeLessThan(200); // Ceres ~167 K warmest
    }
  });
});

describe("determinism", () => {
  it("heliocentricPosition is a pure function of the date", () => {
    const d = new Date(Date.UTC(2033, 3, 14, 9, 26, 53));
    for (const body of DWARF_ORDER) {
      expect(heliocentricPosition(body, d)).toEqual(heliocentricPosition(body, d));
    }
  });

  it("orreryLayout and dwarfState are deterministic", () => {
    const d = new Date(Date.UTC(2040, 10, 2));
    expect(orreryLayout(d, { mode: "log" })).toEqual(
      orreryLayout(d, { mode: "log" })
    );
    expect(dwarfState("Pluto", d)).toEqual(dwarfState("Pluto", d));
  });
});
