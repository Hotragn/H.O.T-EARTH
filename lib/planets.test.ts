import { describe, expect, it } from "vitest";
import {
  PLANETS,
  PLANET_ORDER,
  type PlanetName,
  aphelionAU,
  compressRadius,
  effectiveTiltDeg,
  heliocentricDistanceAU,
  heliocentricPosition,
  isRetrograde,
  keplerPeriodYears,
  orreryLayout,
  perihelionAU,
  planetSunDirection,
  solarDayEarthDays,
  solveKepler,
  subSolarLatitude,
  subSolarLongitude,
  subSolarPoint,
} from "./planets";

const DAY_MS = 86_400_000;
const YEAR_MS = 365.25 * DAY_MS;

/**
 * Physics acceptance tests for the planetary orbital layer.
 *
 * Sources for the asserted reference values:
 *   • Keplerian elements + rates: JPL "Keplerian Elements for Approximate
 *     Positions of the Major Planets", Table 1 (Standish; 1800–2050).
 *     https://ssd.jpl.nasa.gov/planets/approx_pos.html
 *   • Sidereal orbital periods, obliquity, rotation, radius: NASA/GSFC
 *     Planetary Fact Sheets. https://nssdc.gsfc.nasa.gov/planetary/factsheet/
 *
 * Known sidereal orbital periods (Earth years), used to check Kepler's 3rd law
 * P = a^1.5 derived from the semi-major axis:
 *   Mercury 0.2408 · Venus 0.6152 · Earth 1.0000 · Mars 1.8808
 *   Jupiter 11.862 · Saturn 29.457 · Uranus 84.017 · Neptune 164.79
 */
const KNOWN_PERIOD_YEARS: Record<PlanetName, number> = {
  Mercury: 0.2408,
  Venus: 0.6152,
  Earth: 1.0,
  Mars: 1.8808,
  Jupiter: 11.862,
  Saturn: 29.457,
  Uranus: 84.017,
  Neptune: 164.79,
};

describe("orbital periods (Kepler's 3rd law from a)", () => {
  it("P = a^1.5 matches the known sidereal periods within ~1%", () => {
    for (const body of PLANET_ORDER) {
      const derived = keplerPeriodYears(body);
      const known = KNOWN_PERIOD_YEARS[body];
      const relErr = Math.abs(derived - known) / known;
      expect(relErr).toBeLessThan(0.01);
    }
  });

  it("reproduces the classic outer-planet periods", () => {
    // (values asserted individually so a regression names the culprit body)
    expect(keplerPeriodYears("Jupiter")).toBeCloseTo(11.86, 1);
    expect(keplerPeriodYears("Saturn")).toBeCloseTo(29.46, 0);
    expect(keplerPeriodYears("Uranus")).toBeCloseTo(84.0, 0);
    expect(keplerPeriodYears("Neptune")).toBeCloseTo(164.8, 0);
    expect(keplerPeriodYears("Mercury")).toBeCloseTo(0.241, 2);
  });

  it("Kepler-derived period agrees with the tabulated Fact-Sheet period", () => {
    for (const body of PLANET_ORDER) {
      const derived = keplerPeriodYears(body);
      const tabulated = PLANETS[body].physical.orbitalPeriodYears;
      expect(Math.abs(derived - tabulated) / tabulated).toBeLessThan(0.01);
    }
  });
});

describe("heliocentric position — distances", () => {
  // Sample the whole simulated era so eccentric bodies exercise peri/aphelion.
  const dates: Date[] = [];
  for (let y = 0; y <= 50; y++) {
    dates.push(new Date(Date.UTC(2000, 0, 1) + y * YEAR_MS));
    dates.push(new Date(Date.UTC(2000, 6, 1) + y * YEAR_MS));
  }

  it("Earth stays ~1 AU from the Sun (0.98–1.02)", () => {
    for (const d of dates) {
      const r = heliocentricDistanceAU("Earth", d);
      expect(r).toBeGreaterThan(0.98);
      expect(r).toBeLessThan(1.02);
    }
  });

  it("Neptune stays ~29.8–30.3 AU (nearly circular)", () => {
    for (const d of dates) {
      const r = heliocentricDistanceAU("Neptune", d);
      expect(r).toBeGreaterThan(29.7);
      expect(r).toBeLessThan(30.4);
    }
  });

  it("Mercury swings 0.30–0.47 AU (highly eccentric)", () => {
    for (const d of dates) {
      const r = heliocentricDistanceAU("Mercury", d);
      expect(r).toBeGreaterThan(0.3);
      expect(r).toBeLessThan(0.47);
    }
  });

  it("every body stays within its own perihelion/aphelion band", () => {
    for (const body of PLANET_ORDER) {
      const peri = perihelionAU(body);
      const aph = aphelionAU(body);
      const margin = 0.005 * aph; // element drift over the era is tiny
      for (const d of dates) {
        const r = heliocentricDistanceAU(body, d);
        expect(r).toBeGreaterThanOrEqual(peri - margin);
        expect(r).toBeLessThanOrEqual(aph + margin);
      }
    }
  });

  it("orders the planets by distance at J2000 (Mercury innermost → Neptune outermost)", () => {
    const j2000 = new Date(Date.UTC(2000, 0, 1, 12));
    const radii = PLANET_ORDER.map((b) => heliocentricDistanceAU(b, j2000));
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeGreaterThan(radii[i - 1]);
    }
  });
});

describe("Kepler solver — convergence & stability", () => {
  it("returns E satisfying M = E − e·sinE to ~1e-9 across a grid", () => {
    for (let e = 0; e <= 0.25; e += 0.02) {
      for (let deg = 0; deg < 360; deg += 7) {
        const M = deg * (Math.PI / 180);
        const E = solveKepler(M, e);
        const residual = E - e * Math.sin(E) - Math.atan2(Math.sin(M), Math.cos(M));
        expect(Math.abs(residual)).toBeLessThan(1e-9);
      }
    }
  });

  it("produces finite, stable positions for every body 2000–2050", () => {
    for (const body of PLANET_ORDER) {
      for (let y = 0; y <= 50; y += 1) {
        const p = heliocentricPosition(body, new Date(Date.UTC(2000, 0, 1) + y * YEAR_MS));
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

describe("obliquity, rotation & retrograde flags", () => {
  it("flags Venus and Uranus as retrograde, the rest prograde", () => {
    expect(isRetrograde("Venus")).toBe(true);
    expect(isRetrograde("Uranus")).toBe(true);
    for (const body of PLANET_ORDER) {
      if (body !== "Venus" && body !== "Uranus") {
        expect(isRetrograde(body)).toBe(false);
      }
    }
  });

  it("stores the Fact-Sheet obliquities (Uranus ~97.77°, Venus ~177.36°)", () => {
    expect(PLANETS.Uranus.physical.obliquityDeg).toBeCloseTo(97.77, 2);
    expect(PLANETS.Venus.physical.obliquityDeg).toBeCloseTo(177.36, 2);
    expect(PLANETS.Earth.physical.obliquityDeg).toBeCloseTo(23.44, 2);
    expect(PLANETS.Mars.physical.obliquityDeg).toBeCloseTo(25.19, 2);
  });

  it("negative sidereal rotation period only for the retrograde bodies", () => {
    for (const body of PLANET_ORDER) {
      const h = PLANETS[body].physical.siderealDayHours;
      expect(h < 0).toBe(isRetrograde(body));
    }
  });

  it("folds tilt into [0,90]: Uranus ~82.2° swing, Venus ~2.6° (near-seasonless)", () => {
    expect(effectiveTiltDeg("Uranus")).toBeCloseTo(82.23, 1);
    expect(effectiveTiltDeg("Venus")).toBeCloseTo(2.64, 1);
    expect(effectiveTiltDeg("Earth")).toBeCloseTo(23.44, 2);
  });
});

describe("sub-solar geometry & terminator", () => {
  const dates: Date[] = [];
  for (let m = 0; m < 24; m++) dates.push(new Date(Date.UTC(2020, 0, 1) + m * 30 * DAY_MS));

  it("sub-solar latitude is bounded by the effective tilt for every body", () => {
    for (const body of PLANET_ORDER) {
      const tilt = effectiveTiltDeg(body);
      for (const d of dates) {
        expect(Math.abs(subSolarLatitude(body, d))).toBeLessThanOrEqual(tilt + 1e-6);
      }
    }
  });

  it("planetSunDirection returns a unit vector", () => {
    for (const body of PLANET_ORDER) {
      const [x, y, z] = planetSunDirection(body, new Date(Date.UTC(2025, 5, 1)));
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 9);
    }
  });

  it("sub-solar point lat/lon match the components", () => {
    const d = new Date(Date.UTC(2030, 2, 21));
    const p = subSolarPoint("Mars", d);
    expect(p.lat).toBeCloseTo(subSolarLatitude("Mars", d), 9);
  });

  it("prograde sub-solar longitude sweeps west; retrograde sweeps east", () => {
    const t0 = new Date(Date.UTC(2025, 0, 1, 0));
    const t1 = new Date(Date.UTC(2025, 0, 1, 6)); // +6 h
    const dLon = (body: PlanetName) => {
      let dl = subSolarLongitude(body, t1) - subSolarLongitude(body, t0);
      if (dl > 180) dl -= 360;
      if (dl < -180) dl += 360;
      return dl;
    };
    expect(dLon("Earth")).toBeLessThan(0); // prograde → moves west
    expect(dLon("Mars")).toBeLessThan(0);
    expect(dLon("Venus")).toBeGreaterThan(0); // retrograde → moves east
    expect(dLon("Uranus")).toBeGreaterThan(0);
  });
});

describe("solar-day (day length) helper", () => {
  it("reproduces the classic solar days", () => {
    expect(solarDayEarthDays("Earth")).toBeCloseTo(1.0, 3);
    expect(solarDayEarthDays("Venus")).toBeCloseTo(116.75, 0); // retrograde slow day
    expect(solarDayEarthDays("Mercury")).toBeCloseTo(175.9, 0); // 3:2 resonance day
    expect(solarDayEarthDays("Mars")).toBeCloseTo(1.0275, 2);
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

  it("log-compresses so Mercury and Neptune are both visible and ordered", () => {
    const layout = orreryLayout(date, {
      mode: "log",
      minRadius: 1,
      maxRadius: 10,
    });
    const byName = Object.fromEntries(layout.bodies.map((b) => [b.name, b]));
    // Mercury ~0.39 AU → ~1.5; Neptune ~30 AU → ~9.9 (defaults inner 0.3 / outer 31)
    expect(byName.Mercury.sceneRadius).toBeGreaterThan(1);
    expect(byName.Mercury.sceneRadius).toBeLessThan(3);
    expect(byName.Neptune.sceneRadius).toBeGreaterThan(9);
    expect(byName.Neptune.sceneRadius).toBeLessThan(10.5);
    // radial order preserved after compression
    const radii = PLANET_ORDER.map((n) => byName[n].sceneRadius);
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeGreaterThan(radii[i - 1]);
    }
  });

  it("compresses much less range than the raw AU ratio (Neptune/Mercury)", () => {
    const layout = orreryLayout(date, { mode: "log", minRadius: 1, maxRadius: 10 });
    const byName = Object.fromEntries(layout.bodies.map((b) => [b.name, b]));
    const auRatio = byName.Neptune.distanceAU / byName.Mercury.distanceAU; // ~77
    const sceneRatio = byName.Neptune.sceneRadius / byName.Mercury.sceneRadius; // ~6.6
    expect(auRatio).toBeGreaterThan(60);
    expect(sceneRatio).toBeLessThan(10);
    expect(sceneRatio).toBeLessThan(auRatio);
  });

  it("linear mode keeps true proportional distances (unitsPerAU)", () => {
    expect(compressRadius(30, { mode: "linear", unitsPerAU: 2 })).toBeCloseTo(60, 9);
    const layout = orreryLayout(date, { mode: "linear", unitsPerAU: 1 });
    for (const b of layout.bodies) {
      expect(b.sceneRadius).toBeCloseTo(b.distanceAU, 6);
    }
    expect(layout.note).toContain("to scale");
  });

  it("emits an honest note describing the compression", () => {
    expect(orreryLayout(date, { mode: "log" }).note).toContain("log-compressed");
    expect(orreryLayout(date, { mode: "sqrt" }).note).toContain("sqrt-compressed");
    expect(orreryLayout(date).note).toContain("Angular positions are real");
  });
});

describe("determinism", () => {
  it("heliocentricPosition is a pure function of the date", () => {
    const d = new Date(Date.UTC(2033, 3, 14, 9, 26, 53));
    for (const body of PLANET_ORDER) {
      expect(heliocentricPosition(body, d)).toEqual(heliocentricPosition(body, d));
    }
  });

  it("orreryLayout is deterministic", () => {
    const d = new Date(Date.UTC(2040, 10, 2));
    expect(orreryLayout(d, { mode: "log" })).toEqual(orreryLayout(d, { mode: "log" }));
  });
});
