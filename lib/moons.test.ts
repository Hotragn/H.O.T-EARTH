import { describe, expect, it } from "vitest";
import {
  MOONS,
  MOON_ORDER,
  PARENT_ORDER,
  type MoonName,
  compressMoonRadius,
  dayLengthDays,
  isRetrograde,
  laplaceResonance,
  moonOrbitAngle,
  moonOrreryLayout,
  moonSnapshot,
  moonSubSolarLongitude,
  moonSubSolarPoint,
  moonSunDirection,
  moonsByParent,
  orbitalPeriodDays,
  synodicPeriodDays,
} from "./moons";

/**
 * Physics acceptance tests for the major-moons orbital layer.
 *
 * Sources for the asserted reference values:
 *   • Orbital elements (semi-major axis, sidereal period, eccentricity,
 *     inclination): JPL SSD "Planetary Satellite Mean Orbital Parameters".
 *     https://ssd.jpl.nasa.gov/sats/elem/
 *   • Physical parameters (mean radius, geometric albedo): JPL SSD "Planetary
 *     Satellite Physical Parameters". https://ssd.jpl.nasa.gov/sats/phys_par/
 *   • Mean surface temperatures: NASA/GSFC + mission summaries (per body).
 *
 * Known sidereal orbital periods (Earth days), asserted below (±~1%):
 *   Io 1.769 · Europa 3.551 · Ganymede 7.155 · Callisto 16.689
 *   Titan 15.945 · Enceladus 1.370 · Mimas 0.942 · Iapetus 79.33
 *   Triton −5.877 (RETROGRADE)
 */
const KNOWN_PERIOD_DAYS: Record<MoonName, number> = {
  Io: 1.769,
  Europa: 3.551,
  Ganymede: 7.155,
  Callisto: 16.689,
  Titan: 15.945,
  Enceladus: 1.37,
  Mimas: 0.942,
  Iapetus: 79.33,
  Triton: -5.877,
};

const DAY_MS = 86_400_000;

describe("orbital periods (JPL mean orbital parameters)", () => {
  it("match the known sidereal periods within ~1% (sign included)", () => {
    for (const moon of MOON_ORDER) {
      const p = orbitalPeriodDays(moon);
      const known = KNOWN_PERIOD_DAYS[moon];
      const relErr = Math.abs(p - known) / Math.abs(known);
      expect(relErr).toBeLessThan(0.01);
    }
  });

  it("names each classic period individually so a regression is obvious", () => {
    expect(orbitalPeriodDays("Io")).toBeCloseTo(1.769, 2);
    expect(orbitalPeriodDays("Europa")).toBeCloseTo(3.551, 2);
    expect(orbitalPeriodDays("Ganymede")).toBeCloseTo(7.155, 2);
    expect(orbitalPeriodDays("Callisto")).toBeCloseTo(16.689, 2);
    expect(orbitalPeriodDays("Titan")).toBeCloseTo(15.945, 2);
    expect(orbitalPeriodDays("Enceladus")).toBeCloseTo(1.37, 2);
    expect(orbitalPeriodDays("Mimas")).toBeCloseTo(0.942, 2);
    expect(orbitalPeriodDays("Triton")).toBeCloseTo(-5.877, 2); // retrograde
  });

  it("day length equals |orbital period| for these locked moons", () => {
    for (const moon of MOON_ORDER) {
      expect(dayLengthDays(moon)).toBeCloseTo(
        Math.abs(orbitalPeriodDays(moon)),
        9
      );
      expect(MOONS[moon].physical.tidallyLocked).toBe(true);
    }
  });

  it("synodic (true solar-day) period differs from the sidereal by < 1%", () => {
    // The giant planets crawl around the Sun, so the correction is tiny —
    // this justifies the HUD using |orbital period| as the day length. The
    // largest correction is Iapetus (long period vs. Saturn's year, ~0.7%).
    for (const moon of MOON_ORDER) {
      const syn = synodicPeriodDays(moon);
      const sid = dayLengthDays(moon);
      expect(Math.abs(syn - sid) / sid).toBeLessThan(0.01);
    }
  });
});

describe("Laplace resonance (Io : Europa : Ganymede = 1 : 2 : 4)", () => {
  it("Europa/Io ≈ 2 and Ganymede/Io ≈ 4 (computed from the table)", () => {
    const res = laplaceResonance();
    expect(res.europaOverIo).toBeCloseTo(2, 1); // real value ≈ 2.007
    expect(res.ganymedeOverIo).toBeCloseTo(4, 1); // real value ≈ 4.044
    expect(res.ratios[0]).toBe(1);
    expect(res.isLaplace).toBe(true);
  });

  it("the ratios sit within a few % of the ideal 1:2:4", () => {
    const res = laplaceResonance();
    expect(Math.abs(res.europaOverIo - 2) / 2).toBeLessThan(0.02); // ~0.4%
    expect(Math.abs(res.ganymedeOverIo - 4) / 4).toBeLessThan(0.02); // ~1.1%
  });

  it("a tight tolerance still confirms the resonance", () => {
    expect(laplaceResonance(0.02).isLaplace).toBe(true);
  });
});

describe("retrograde flag", () => {
  it("flags Triton retrograde (negative period) and all others prograde", () => {
    expect(isRetrograde("Triton")).toBe(true);
    expect(MOONS.Triton.orbit.siderealPeriodDays).toBeLessThan(0);
    for (const moon of MOON_ORDER) {
      if (moon !== "Triton") {
        expect(isRetrograde(moon)).toBe(false);
        expect(MOONS[moon].orbit.siderealPeriodDays).toBeGreaterThan(0);
      }
    }
  });

  it("Triton's >90° inclination is consistent with a retrograde orbit", () => {
    expect(MOONS.Triton.orbit.inclinationDeg).toBeGreaterThan(90);
  });
});

describe("moonOrbitAngle — determinism & sweep direction", () => {
  it("is a pure function of the date and options", () => {
    const d = new Date(Date.UTC(2030, 3, 14, 9, 26, 53));
    for (const moon of MOON_ORDER) {
      expect(moonOrbitAngle(moon, d)).toEqual(moonOrbitAngle(moon, d));
    }
  });

  it("prograde moons advance +θ; retrograde Triton advances −θ", () => {
    // A short step (0.05 d) is a tiny fraction of every period, so no wrap.
    const t0 = new Date(Date.UTC(2025, 0, 10, 0));
    const t1 = new Date(t0.getTime() + 0.05 * DAY_MS);
    const dTheta = (moon: MoonName) => {
      let d = moonOrbitAngle(moon, t1).angleRad - moonOrbitAngle(moon, t0).angleRad;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      return d;
    };
    expect(dTheta("Io")).toBeGreaterThan(0);
    expect(dTheta("Titan")).toBeGreaterThan(0);
    expect(dTheta("Triton")).toBeLessThan(0); // retrograde → opposite
  });

  it("angle is bounded to [0, 2π) and radius/x/z are consistent", () => {
    const d = new Date(Date.UTC(2027, 7, 3, 6));
    for (const moon of MOON_ORDER) {
      const p = moonOrbitAngle(moon, d);
      expect(p.angleRad).toBeGreaterThanOrEqual(0);
      expect(p.angleRad).toBeLessThan(2 * Math.PI);
      // scene mapping: x = r cosθ, z = −r sinθ  ⇒  |x,z| = r
      expect(Math.hypot(p.x, p.z)).toBeCloseTo(p.distanceScene, 9);
      let rec = Math.atan2(-p.z, p.x);
      if (rec < 0) rec += 2 * Math.PI;
      let diff = Math.abs(rec - p.angleRad);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      expect(diff).toBeLessThan(1e-9);
    }
  });

  it("completes exactly one revolution over one orbital period", () => {
    const t0 = new Date(Date.UTC(2025, 0, 1, 12));
    for (const moon of MOON_ORDER) {
      const period = orbitalPeriodDays(moon); // signed
      const t1 = new Date(t0.getTime() + Math.abs(period) * DAY_MS);
      // After one full period the angle returns to its starting value.
      expect(moonOrbitAngle(moon, t1).angleRad).toBeCloseTo(
        moonOrbitAngle(moon, t0).angleRad,
        6
      );
    }
  });
});

describe("compression / mini-orrery (angles real, radius compressed)", () => {
  const date = new Date(Date.UTC(2026, 6, 8, 12));

  it("linear mode keeps proportional distances (unitsPerKm)", () => {
    expect(compressMoonRadius(1_000_000, { mode: "linear", unitsPerKm: 1e-6 })).toBeCloseTo(
      1,
      9
    );
    expect(compressMoonRadius(2_000_000, { mode: "linear", unitsPerKm: 1e-6 })).toBeCloseTo(
      2,
      9
    );
  });

  it("log-compresses a much larger km range into a small scene range", () => {
    const inner = compressMoonRadius(185_539, {
      mode: "log",
      minRadius: 1,
      maxRadius: 10,
      innerKm: 150_000,
      outerKm: 3_700_000,
    });
    const outer = compressMoonRadius(3_560_854, {
      mode: "log",
      minRadius: 1,
      maxRadius: 10,
      innerKm: 150_000,
      outerKm: 3_700_000,
    });
    const kmRatio = 3_560_854 / 185_539; // ~19×
    const sceneRatio = outer / inner;
    expect(kmRatio).toBeGreaterThan(15);
    expect(sceneRatio).toBeLessThan(kmRatio); // compression happened
    expect(inner).toBeGreaterThanOrEqual(1);
    expect(outer).toBeLessThanOrEqual(10);
  });

  it("per-parent layout keeps real angles and honest true-km labels", () => {
    for (const parent of PARENT_ORDER) {
      const layout = moonOrreryLayout(parent, date);
      for (const b of layout.bodies) {
        // true distance is the semi-major axis, untouched by compression
        expect(b.distanceKm).toBe(MOONS[b.name].orbit.semiMajorAxisKm);
        // recovered angle matches the raw orbital angle
        expect(b.angleRad).toBeCloseTo(moonOrbitAngle(b.name, date).angleRad, 9);
        expect(Math.hypot(b.x, b.z)).toBeCloseTo(b.sceneRadius, 9);
      }
    }
  });

  it("Jupiter layout preserves innermost→outermost radial order after compression", () => {
    const layout = moonOrreryLayout("Jupiter", date, { mode: "log" });
    // moonsByParent sorts ascending: Io, Europa, Ganymede, Callisto
    expect(layout.bodies.map((b) => b.name)).toEqual([
      "Io",
      "Europa",
      "Ganymede",
      "Callisto",
    ]);
    for (let i = 1; i < layout.bodies.length; i++) {
      expect(layout.bodies[i].sceneRadius).toBeGreaterThan(
        layout.bodies[i - 1].sceneRadius
      );
    }
  });

  it("single-moon parent (Neptune/Triton) is placed at a finite midpoint radius", () => {
    const layout = moonOrreryLayout("Neptune", date);
    expect(layout.bodies).toHaveLength(1);
    const r = layout.bodies[0].sceneRadius;
    expect(Number.isFinite(r)).toBe(true);
    expect(r).toBeGreaterThan(0);
  });

  it("emits an honest note about the compression", () => {
    expect(moonOrreryLayout("Jupiter", date, { mode: "log" }).note).toContain(
      "log-compressed"
    );
    expect(moonOrreryLayout("Saturn", date, { mode: "sqrt" }).note).toContain(
      "sqrt-compressed"
    );
    expect(moonOrreryLayout("Jupiter", date).note).toContain(
      "Orbital angles are real"
    );
    expect(moonOrreryLayout("Jupiter", date, { mode: "linear" }).note).toContain(
      "to scale"
    );
  });
});

describe("synchronous rotation → sub-solar / terminator", () => {
  it("moonSunDirection returns a unit vector", () => {
    for (const moon of MOON_ORDER) {
      const [x, y, z] = moonSunDirection(moon, new Date(Date.UTC(2025, 5, 1)));
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 9);
    }
  });

  it("sub-solar point sits on the equator (near-zero obliquity simplification)", () => {
    for (const moon of MOON_ORDER) {
      expect(moonSubSolarPoint(moon, new Date(Date.UTC(2031, 2, 2))).lat).toBe(0);
    }
  });

  it("sub-solar longitude sweeps west for prograde, east for retrograde Triton", () => {
    const t0 = new Date(Date.UTC(2025, 0, 1, 0));
    const t1 = new Date(t0.getTime() + 0.05 * DAY_MS);
    const dLon = (moon: MoonName) => {
      let dl = moonSubSolarLongitude(moon, t1) - moonSubSolarLongitude(moon, t0);
      if (dl > 180) dl -= 360;
      if (dl < -180) dl += 360;
      return dl;
    };
    expect(dLon("Io")).toBeLessThan(0); // prograde → west (like Earth)
    expect(dLon("Titan")).toBeLessThan(0);
    expect(dLon("Triton")).toBeGreaterThan(0); // retrograde → east
  });

  it("sub-solar longitude completes one sweep per orbital period", () => {
    const t0 = new Date(Date.UTC(2025, 0, 1, 12));
    for (const moon of MOON_ORDER) {
      const period = Math.abs(orbitalPeriodDays(moon));
      const t1 = new Date(t0.getTime() + period * DAY_MS);
      // after one period the sub-solar longitude returns to its start
      let diff = Math.abs(
        moonSubSolarLongitude(moon, t1) - moonSubSolarLongitude(moon, t0)
      );
      if (diff > 180) diff = 360 - diff;
      expect(diff).toBeLessThan(1e-4);
    }
  });
});

describe("physical parameters within sane ranges", () => {
  it("Ganymede is the largest moon here (~2634 km)", () => {
    expect(MOONS.Ganymede.physical.meanRadiusKm).toBeCloseTo(2634, 0);
    const maxRadius = Math.max(
      ...MOON_ORDER.map((m) => MOONS[m].physical.meanRadiusKm)
    );
    expect(MOONS.Ganymede.physical.meanRadiusKm).toBe(maxRadius);
  });

  it("Triton is the coldest (~38 K) and every mean temp is physically sane", () => {
    expect(MOONS.Triton.physical.meanSurfaceTempK).toBeCloseTo(38, 0);
    const minTemp = Math.min(
      ...MOON_ORDER.map((m) => MOONS[m].physical.meanSurfaceTempK)
    );
    expect(MOONS.Triton.physical.meanSurfaceTempK).toBe(minTemp);
    for (const moon of MOON_ORDER) {
      const t = MOONS[moon].physical.meanSurfaceTempK;
      expect(t).toBeGreaterThan(20); // colder than deep space warm-up
      expect(t).toBeLessThan(200); // no major moon here is remotely warm
    }
  });

  it("radii, eccentricities and albedos are in-range for every moon", () => {
    for (const moon of MOON_ORDER) {
      const { physical, orbit } = MOONS[moon];
      expect(physical.meanRadiusKm).toBeGreaterThan(100); // Mimas ~198 km smallest
      expect(physical.meanRadiusKm).toBeLessThan(2700); // Ganymede ~2634 km largest
      expect(orbit.eccentricity).toBeGreaterThanOrEqual(0);
      expect(orbit.eccentricity).toBeLessThan(0.1); // all near-circular
      expect(physical.geometricAlbedo).toBeGreaterThan(0);
      expect(physical.geometricAlbedo).toBeLessThanOrEqual(1.5); // Enceladus ~1.375
    }
  });

  it("semi-major axes match the cited JPL values (Io & Titan anchors)", () => {
    expect(MOONS.Io.orbit.semiMajorAxisKm).toBe(421_700);
    expect(MOONS.Callisto.orbit.semiMajorAxisKm).toBe(1_882_709);
    expect(MOONS.Titan.orbit.semiMajorAxisKm).toBe(1_221_870);
  });
});

describe("grouping helper", () => {
  it("groups all nine moons under the right parent, sorted innermost-first", () => {
    const byParent = moonsByParent();
    expect(byParent.Jupiter).toEqual([
      "Io",
      "Europa",
      "Ganymede",
      "Callisto",
    ]);
    expect(byParent.Saturn).toEqual([
      "Mimas",
      "Enceladus",
      "Titan",
      "Iapetus",
    ]);
    expect(byParent.Neptune).toEqual(["Triton"]);
    const total =
      byParent.Jupiter.length +
      byParent.Saturn.length +
      byParent.Neptune.length;
    expect(total).toBe(MOON_ORDER.length);
  });
});

describe("moonSnapshot", () => {
  it("bundles orbit, sub-solar, sun direction and facts, deterministically", () => {
    const d = new Date(Date.UTC(2040, 10, 2, 3, 30));
    const snap = moonSnapshot("Europa", d);
    expect(snap).toEqual(moonSnapshot("Europa", d));
    expect(snap.parent).toBe("Jupiter");
    expect(snap.orbitalPeriodDays).toBeCloseTo(3.551, 2);
    expect(snap.dayLengthDays).toBeCloseTo(3.551, 2);
    expect(snap.retrograde).toBe(false);
    expect(snap.tidallyLocked).toBe(true);
    expect(Math.hypot(...snap.sunDirection)).toBeCloseTo(1, 9);
  });

  it("reports Triton as retrograde in its snapshot", () => {
    const snap = moonSnapshot("Triton", new Date(Date.UTC(2035, 1, 1)));
    expect(snap.retrograde).toBe(true);
    expect(snap.orbitalPeriodDays).toBeLessThan(0);
  });
});
