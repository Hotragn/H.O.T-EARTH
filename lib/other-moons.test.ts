import { describe, expect, it } from "vitest";
import {
  MOONS_BY_PLANET,
  OTHER_MOONS,
  OTHER_PLANETS,
  currentOtherPhenomena,
  diskContains,
  julianDate,
  julianEphemerisDate,
  otherMoonPosition,
  otherMoonPositions,
  otherMoonsState,
  planetGeocentric,
  type OtherMoon,
  type OtherPlanet,
} from "./other-moons";

const DAY_MS = 86_400_000;
const DEG2RAD = Math.PI / 180;

/**
 * Physics acceptance tests for lib/other-moons.ts — the Mars/Uranus/Neptune moon
 * library (the Saturn twin of lib/saturn-moons.test.ts).
 *
 * Everything is Kepler propagation of REAL JPL SSD "Planetary Satellite Mean
 * Orbital Elements" (ssd.jpl.nasa.gov/sats/elem/): Mars ephemeris MAR099 (J2000,
 * Laplace plane), Uranus's five classical moons (J2000, Uranus equatorial frame),
 * Neptune's Triton & Proteus (J2000, Laplace plane) and Nereid (2020 epoch,
 * ECLIPTIC frame, e = 0.751). Low-accuracy by construction — these tests check
 * the GEOMETRY (orbit size, plane, sense, phase, planet ephemeris), which is what
 * this configuration view is honestly for. Triton and Nereid are flagged
 * least-accurate; cross-check JPL Horizons offline (never called here).
 */

// Expected max apparent elongation ≈ a/Req (semi-major axis in planet radii).
const EXPECTED_A_REQ: Record<OtherMoon, number> = {
  Phobos: 2.76,
  Deimos: 6.91,
  Miranda: 5.08,
  Ariel: 7.47,
  Umbriel: 10.41,
  Titania: 17.07,
  Oberon: 22.83,
  Triton: 14.33,
  Proteus: 4.75,
  Nereid: 222.66,
};

const ALL_PLANETS: OtherPlanet[] = ["Mars", "Uranus", "Neptune"];

describe("planet geocentric — distance, diameter, system tilt", () => {
  it("plausible distances and equatorial diameters per planet", () => {
    // Sample two years at monthly cadence to sweep opposition ↔ conjunction.
    const ranges: Record<
      OtherPlanet,
      { dMin: number; dMax: number; diamMin: number; diamMax: number }
    > = {
      // Mars: 0.37 (perihelic opposition) … 2.68 AU (conjunction); ~4–25″.
      Mars: { dMin: 0.35, dMax: 2.72, diamMin: 3.4, diamMax: 26 },
      // Uranus ~18.2 … 20.1 AU; ~3.4–3.8″ (peaks ~3.81″ at closest opposition).
      Uranus: { dMin: 17.9, dMax: 20.6, diamMin: 3.3, diamMax: 3.9 },
      // Neptune ~28.8 … 31.4 AU; ~2.2–2.4″.
      Neptune: { dMin: 28.6, dMax: 31.5, diamMin: 2.1, diamMax: 2.5 },
    };
    for (const planet of ALL_PLANETS) {
      const r = ranges[planet];
      for (let mo = 0; mo < 24; mo++) {
        const date = new Date(Date.UTC(2024, 0, 1) + mo * 30 * DAY_MS);
        const g = planetGeocentric(planet, date)!;
        expect(g.raDeg).toBeGreaterThanOrEqual(0);
        expect(g.raDeg).toBeLessThan(360);
        expect(Math.abs(g.decDeg)).toBeLessThanOrEqual(90);
        expect(g.distanceAU).toBeGreaterThan(r.dMin);
        expect(g.distanceAU).toBeLessThan(r.dMax);
        expect(g.angularDiameterArcsec).toBeGreaterThan(r.diamMin);
        expect(g.angularDiameterArcsec).toBeLessThan(r.diamMax);
        // system tilt is a real sub-Earth latitude, always in range.
        expect(Math.abs(g.systemTiltDeg)).toBeLessThanOrEqual(90);
        expect(Number.isFinite(g.systemTiltDeg)).toBe(true);
      }
    }
  });

  it("angular diameter is largest near minimum distance (Mars)", () => {
    let minDist = Infinity;
    let diamAtMin = 0;
    let maxDiam = 0;
    let distAtMax = 0;
    for (let d = 0; d < 800; d += 2) {
      const g = planetGeocentric("Mars", new Date(Date.UTC(2024, 0, 1) + d * DAY_MS))!;
      if (g.distanceAU < minDist) {
        minDist = g.distanceAU;
        diamAtMin = g.angularDiameterArcsec;
      }
      if (g.angularDiameterArcsec > maxDiam) {
        maxDiam = g.angularDiameterArcsec;
        distAtMax = g.distanceAU;
      }
    }
    expect(diamAtMin).toBeCloseTo(maxDiam, 4);
    expect(distAtMax).toBeCloseTo(minDist, 4);
  });

  it("Uranus system tilt varies with the Uranian season (not frozen)", () => {
    // The pole is ~in the ecliptic, so the sub-Earth latitude swings over years.
    const tilts = [2010, 2018, 2026, 2034, 2042].map(
      (y) => planetGeocentric("Uranus", new Date(Date.UTC(y, 6, 1)))!.systemTiltDeg
    );
    const spread = Math.max(...tilts) - Math.min(...tilts);
    expect(spread).toBeGreaterThan(15); // tens of degrees across the season
  });
});

describe("each moon's maximum apparent elongation ≈ its orbital radius (Req)", () => {
  it("stored semiMajorAxisReq matches the known orbital radii", () => {
    for (const m of Object.keys(EXPECTED_A_REQ) as OtherMoon[]) {
      expect(OTHER_MOONS[m].semiMajorAxisReq).toBeCloseTo(EXPECTED_A_REQ[m], 1);
    }
  });

  it("max apparent separation over one orbit ≈ the orbital radius (low-e moons)", () => {
    // Every low-e moon: the sky separation reaches near its orbital radius at the
    // ansae, and never exceeds apoapsis a(1+e). Nereid (e=0.751) is checked apart.
    for (const planet of ALL_PLANETS) {
      for (const m of MOONS_BY_PLANET[planet]) {
        if (m === "Nereid") continue;
        const d = OTHER_MOONS[m];
        const period = d.siderealPeriodDays;
        let maxSep = 0;
        for (let k = 0; k < 400; k++) {
          const date = new Date(Date.UTC(2026, 0, 1) + (k * period * DAY_MS) / 400);
          const p = otherMoonPosition(planet, m, date)!;
          maxSep = Math.max(maxSep, Math.hypot(p.x, p.y));
        }
        const a = EXPECTED_A_REQ[m];
        expect(maxSep).toBeGreaterThan(a * 0.9);
        expect(maxSep).toBeLessThan(a * (1 + d.eccentricity) + 0.15);
      }
    }
  });

  it("Nereid is huge and highly variable (e=0.751, ecliptic 2020 epoch)", () => {
    expect(OTHER_MOONS.Nereid.semiMajorAxisReq).toBeCloseTo(222.66, 0);
    const a = OTHER_MOONS.Nereid.semiMajorAxisReq;
    const period = OTHER_MOONS.Nereid.siderealPeriodDays;
    let maxSep = 0;
    let minSep = Infinity;
    for (let k = 0; k < 500; k++) {
      const date = new Date(Date.UTC(2026, 0, 1) + (k * period * DAY_MS) / 500);
      const p = otherMoonPosition("Neptune", "Nereid", date)!;
      const sep = Math.hypot(p.x, p.y);
      maxSep = Math.max(maxSep, sep);
      minSep = Math.min(minSep, sep);
    }
    // Reaches far out (well beyond the inner Neptune moons)…
    expect(maxSep).toBeGreaterThan(100);
    expect(maxSep).toBeLessThan(a * (1 + 0.751) + 10);
    // …and its distance swings enormously over one orbit (the eccentricity).
    expect(maxSep - minSep).toBeGreaterThan(50);
  });
});

describe("Uranus moons string along the tilted equatorial plane", () => {
  const URANUS_MOONS = MOONS_BY_PLANET.Uranus;

  it("all five moons are ~coplanar, with the plane normal matching systemTiltDeg", () => {
    for (const dstr of [
      Date.UTC(2026, 0, 1),
      Date.UTC(2030, 5, 1),
      Date.UTC(2020, 9, 10),
    ]) {
      const date = new Date(dstr);
      const g = planetGeocentric("Uranus", date)!;
      const vecs = URANUS_MOONS.map((m) => {
        const p = otherMoonPosition("Uranus", m, date)!;
        return [p.x, p.y, p.z] as [number, number, number];
      });
      // Best-fit plane normal: the largest-magnitude pair cross product (most
      // reliable when the two moons are well separated on the sky).
      let bestN: [number, number, number] = [0, 0, 1];
      let bestMag = -1;
      for (let i = 0; i < vecs.length; i++) {
        for (let j = i + 1; j < vecs.length; j++) {
          const a = vecs[i];
          const b = vecs[j];
          const n: [number, number, number] = [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
          ];
          const mag = Math.hypot(n[0], n[1], n[2]);
          if (mag > bestMag) {
            bestMag = mag;
            bestN = [n[0] / mag, n[1] / mag, n[2] / mag];
          }
        }
      }
      // Every moon lies close to that common plane (within its small inclination).
      for (const v of vecs) {
        const rad = Math.hypot(v[0], v[1], v[2]);
        const outOfPlane = Math.abs(v[0] * bestN[0] + v[1] * bestN[1] + v[2] * bestN[2]);
        expect(outOfPlane / rad).toBeLessThan(0.13); // ~7.5° — bounds Miranda's 4.4°
      }
      // The plane normal's line-of-sight component = sin(sub-Earth latitude).
      const sinTilt = Math.abs(Math.sin(g.systemTiltDeg * DEG2RAD));
      expect(Math.abs(Math.abs(bestN[2]) - sinTilt)).toBeLessThan(0.13);
    }
  });

  it("each Uranus moon passes both in front of and behind the planet over an orbit", () => {
    for (const m of URANUS_MOONS) {
      let sawFront = false;
      let sawBack = false;
      const period = OTHER_MOONS[m].siderealPeriodDays;
      for (let k = 0; k < 200; k++) {
        const date = new Date(Date.UTC(2026, 0, 1) + (k * period * DAY_MS) / 200);
        const p = otherMoonPosition("Uranus", m, date)!;
        if (p.frontOfDisk) sawFront = true;
        else sawBack = true;
      }
      expect(sawFront).toBe(true);
      expect(sawBack).toBe(true);
    }
  });

  it("frontOfDisk always agrees with the sign of Z (toward Earth)", () => {
    for (const planet of ALL_PLANETS) {
      for (let h = 0; h < 120; h++) {
        const arr = otherMoonPositions(planet, new Date(Date.UTC(2026, 0, 1) + h * 6 * 3_600_000))!;
        for (const p of arr) expect(p.frontOfDisk).toBe(p.z > 0);
      }
    }
  });
});

describe("Triton's apparent orbital sense is RETROGRADE", () => {
  // Sky-plane areal-velocity z-component (toward Earth): sign encodes the sense.
  // h_z = x·vy − y·vx (conserved over a Kepler orbit ⇒ a stable sign).
  const senseZ = (planet: OtherPlanet, m: OtherMoon, date: Date): number => {
    const p0 = otherMoonPosition(planet, m, date)!;
    const p1 = otherMoonPosition(planet, m, new Date(date.getTime() + 3_600_000))!;
    const vx = p1.x - p0.x;
    const vy = p1.y - p0.y;
    return p0.x * vy - p0.y * vx;
  };

  it("Triton and prograde Proteus circle Neptune in OPPOSITE senses (same geometry)", () => {
    // Same planet, same date ⇒ identical viewing geometry, so a clean comparison.
    for (const dstr of [Date.UTC(2026, 0, 1), Date.UTC(2028, 6, 1), Date.UTC(2031, 3, 1)]) {
      const date = new Date(dstr);
      const triton = senseZ("Neptune", "Triton", date);
      const proteus = senseZ("Neptune", "Proteus", date);
      expect(Math.sign(triton)).toBe(-Math.sign(proteus));
    }
  });

  it("Triton's flag is set and prograde moons' is not", () => {
    expect(OTHER_MOONS.Triton.retrograde).toBe(true);
    for (const m of ["Phobos", "Deimos", "Ariel", "Oberon", "Proteus", "Nereid"] as OtherMoon[]) {
      expect(OTHER_MOONS[m].retrograde).toBe(false);
    }
    const p = otherMoonPosition("Neptune", "Triton", new Date(Date.UTC(2026, 0, 1)))!;
    expect(p.retrograde).toBe(true);
  });

  it("prograde moons share the tilt-consistent sense; Triton is reversed", () => {
    // For a low-inclination prograde moon the sky sense sign matches the sign of
    // the sub-Earth latitude (system opening); a retrograde moon flips it.
    const date = new Date(Date.UTC(2026, 3, 15));
    const check = (planet: OtherPlanet, m: OtherMoon) => {
      const tilt = planetGeocentric(planet, date)!.systemTiltDeg;
      if (Math.abs(tilt) < 8) return; // skip near-edge-on (sign ill-defined)
      const expectedSign = Math.sign(Math.sin(tilt * DEG2RAD));
      const flip = OTHER_MOONS[m].retrograde ? -1 : 1;
      expect(Math.sign(senseZ(planet, m, date))).toBe(flip * expectedSign);
    };
    check("Mars", "Phobos");
    check("Mars", "Deimos");
    check("Uranus", "Ariel");
    check("Uranus", "Oberon");
    check("Neptune", "Proteus");
    check("Neptune", "Triton"); // retrograde ⇒ opposite
  });
});

describe("moons carry REAL epoch phases (JPL SSD), not a zeroed convention", () => {
  const norm = (d: number) => ((d % 360) + 360) % 360;

  it("each planet's moons have distinct, non-degenerate epoch mean longitudes", () => {
    for (const planet of ALL_PLANETS) {
      const moons = MOONS_BY_PLANET[planet];
      const lam0 = moons.map((m) => {
        const d = OTHER_MOONS[m];
        return norm(d.meanAnomalyEpochDeg + d.argPeriapsisDeg + d.nodeDeg);
      });
      // Not all zero (guards against a schematic 0-at-epoch regression)…
      expect(moons.every((m) => OTHER_MOONS[m].meanAnomalyEpochDeg === 0)).toBe(false);
      // …and pairwise distinct by a wide margin.
      for (let i = 0; i < lam0.length; i++) {
        for (let j = i + 1; j < lam0.length; j++) {
          let gap = Math.abs(lam0[i] - lam0[j]);
          gap = Math.min(gap, 360 - gap);
          expect(gap).toBeGreaterThan(3);
        }
      }
    }
  });

  it("phase actually advances with time (the moons move)", () => {
    // Phobos (~7.65 h): a few hours visibly moves it.
    const a = otherMoonPosition("Mars", "Phobos", new Date(Date.UTC(2026, 0, 1, 0)))!;
    const b = otherMoonPosition("Mars", "Phobos", new Date(Date.UTC(2026, 0, 1, 3)))!;
    expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBeGreaterThan(0.5);
    // Titania (~8.7 d): a couple of days moves it.
    const c = otherMoonPosition("Uranus", "Titania", new Date(Date.UTC(2026, 0, 1)))!;
    const e = otherMoonPosition("Uranus", "Titania", new Date(Date.UTC(2026, 0, 4)))!;
    expect(Math.abs(c.x - e.x) + Math.abs(c.y - e.y)).toBeGreaterThan(2);
  });

  it("secular precession drifts the configuration over a decade (Titania)", () => {
    const period = OTHER_MOONS.Titania.siderealPeriodDays;
    const t0 = Date.UTC(2000, 0, 1, 12, 0, 0);
    const wholeOrbits = Math.round((10 * 365.25) / period);
    const p0 = otherMoonPosition("Uranus", "Titania", new Date(t0))!;
    const p1 = otherMoonPosition(
      "Uranus",
      "Titania",
      new Date(t0 + wholeOrbits * period * DAY_MS)
    )!;
    // After an integer number of orbits M is ~back, but node/apse precession
    // leaves a residual displacement.
    expect(Math.abs(p0.x - p1.x) + Math.abs(p0.y - p1.y)).toBeGreaterThan(0.05);
  });

  it("Nereid propagates from its 2020 epoch (near periapsis-region phase there)", () => {
    // Just assert Nereid moves a lot between its 2020 epoch and a year later
    // (its 360-day, e=0.751 orbit changes the apparent separation dramatically).
    const p0 = otherMoonPosition("Neptune", "Nereid", new Date(Date.UTC(2020, 0, 1)))!;
    const p1 = otherMoonPosition("Neptune", "Nereid", new Date(Date.UTC(2020, 4, 1)))!;
    const sep0 = Math.hypot(p0.x, p0.y);
    const sep1 = Math.hypot(p1.x, p1.y);
    expect(Math.abs(sep0 - sep1)).toBeGreaterThan(10);
  });
});

describe("constants, frames & accuracy flags", () => {
  it("planet Req/Rpol and oblateness match the Fact-Sheet values", () => {
    expect(OTHER_PLANETS.Mars.equatorialRadiusKm).toBe(3396.19);
    expect(OTHER_PLANETS.Mars.polarRadiusKm).toBe(3376.2);
    expect(OTHER_PLANETS.Uranus.equatorialRadiusKm).toBe(25559);
    expect(OTHER_PLANETS.Neptune.equatorialRadiusKm).toBe(24764);
    for (const planet of ALL_PLANETS) {
      const p = OTHER_PLANETS[planet];
      expect(p.polarRadiusRatio).toBeLessThan(1);
      expect(p.polarRadiusRatio).toBeCloseTo(p.polarRadiusKm / p.equatorialRadiusKm, 9);
    }
  });

  it("IAU poles are the cited WGCCRE values", () => {
    expect(OTHER_PLANETS.Mars.poleRaJ2000Deg).toBeCloseTo(317.68143, 5);
    expect(OTHER_PLANETS.Mars.poleDecJ2000Deg).toBeCloseTo(52.8865, 4);
    expect(OTHER_PLANETS.Uranus.poleRaJ2000Deg).toBeCloseTo(257.311, 3);
    expect(OTHER_PLANETS.Uranus.poleDecJ2000Deg).toBeCloseTo(-15.175, 3);
    expect(OTHER_PLANETS.Neptune.poleRaJ2000Deg).toBeCloseTo(299.36, 2);
    expect(OTHER_PLANETS.Neptune.poleDecJ2000Deg).toBeCloseTo(43.46, 2);
  });

  it("sidereal periods match the known JPL SSD values", () => {
    expect(OTHER_MOONS.Phobos.siderealPeriodDays).toBeCloseTo(0.3187, 4);
    expect(OTHER_MOONS.Deimos.siderealPeriodDays).toBeCloseTo(1.2625, 4);
    expect(OTHER_MOONS.Titania.siderealPeriodDays).toBeCloseTo(8.705869, 5);
    expect(OTHER_MOONS.Triton.siderealPeriodDays).toBeCloseTo(5.876994, 5);
    expect(OTHER_MOONS.Nereid.siderealPeriodDays).toBeCloseTo(360.133039, 4);
    // Phobos orbits Mars faster than Mars rotates (~7.65 h < 24.6 h).
    expect(OTHER_MOONS.Phobos.siderealPeriodDays * 24).toBeLessThan(8);
  });

  it("frames and least-accurate flags are set correctly", () => {
    expect(OTHER_MOONS.Nereid.frame).toBe("ecliptic");
    expect(OTHER_MOONS.Nereid.epochUnixMs).toBe(Date.UTC(2020, 0, 1, 0, 0, 0));
    expect(OTHER_MOONS.Triton.frame).toBe("planet-equator");
    expect(OTHER_MOONS.Triton.leastAccurate).toBe(true);
    expect(OTHER_MOONS.Nereid.leastAccurate).toBe(true);
    // The pole-referred moons all share the J2000 element epoch.
    for (const m of Object.keys(OTHER_MOONS) as OtherMoon[]) {
      if (m === "Nereid") continue;
      expect(OTHER_MOONS[m].epochUnixMs).toBe(Date.UTC(2000, 0, 1, 12, 0, 0));
      expect(OTHER_MOONS[m].frame).toBe("planet-equator");
    }
  });

  it("diskContains: edge-on disk is 1 Req wide equatorially, polarRatio thin", () => {
    const ratio = OTHER_PLANETS.Uranus.polarRadiusRatio;
    expect(diskContains(0.99, 0, 0, ratio)).toBe(true);
    expect(diskContains(1.01, 0, 0, ratio)).toBe(false);
    expect(diskContains(0, ratio * 0.99, 0, ratio)).toBe(true);
    expect(diskContains(0, ratio * 1.01, 0, ratio)).toBe(false);
  });

  it("julianDate / julianEphemerisDate: J2000 and ΔT offset", () => {
    expect(julianDate(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)))).toBeCloseTo(2451545.0, 6);
    const d = new Date(Date.UTC(2020, 0, 1));
    expect((julianEphemerisDate(d) - julianDate(d)) * 86_400).toBeCloseTo(69.184, 3);
  });
});

describe("phenomena snapshot consistency", () => {
  it("currentOtherPhenomena flags always match the position flags", () => {
    // Whatever is listed must be flagged on the matching position (any planet).
    for (const planet of ALL_PLANETS) {
      for (let d = 0; d < 60; d++) {
        const date = new Date(Date.UTC(2026, 0, 1) + d * DAY_MS);
        const now = currentOtherPhenomena(planet, date)!;
        const positions = otherMoonPositions(planet, date)!;
        for (const ev of now) {
          const p = positions.find((q) => q.moon === ev.moon)!;
          if (ev.type === "transit") expect(p.inTransit).toBe(true);
          if (ev.type === "shadow_transit") expect(p.inShadowTransit).toBe(true);
          if (ev.type === "occultation") expect(p.inOccultation).toBe(true);
          if (ev.type === "eclipse") expect(p.inEclipse).toBe(true);
        }
      }
    }
  });
});

describe("determinism & null-safety", () => {
  it("otherMoonPositions is deterministic", () => {
    const d = new Date(Date.UTC(2026, 6, 4, 12, 0, 0));
    for (const planet of ALL_PLANETS) {
      const a = otherMoonPositions(planet, d)!;
      const b = otherMoonPositions(planet, d)!;
      for (let i = 0; i < a.length; i++) {
        expect(a[i].x).toBe(b[i].x);
        expect(a[i].y).toBe(b[i].y);
        expect(a[i].z).toBe(b[i].z);
        expect(a[i].shadowX).toBe(b[i].shadowX);
      }
    }
  });

  it("returns each planet's moons in orbital order", () => {
    expect(otherMoonPositions("Mars", new Date(Date.UTC(2026, 0, 1)))!.map((p) => p.moon)).toEqual([
      "Phobos",
      "Deimos",
    ]);
    expect(otherMoonPositions("Uranus", new Date(Date.UTC(2026, 0, 1)))!.map((p) => p.moon)).toEqual(
      [...MOONS_BY_PLANET.Uranus]
    );
    expect(otherMoonPositions("Neptune", new Date(Date.UTC(2026, 0, 1)))!.map((p) => p.moon)).toEqual(
      ["Triton", "Proteus", "Nereid"]
    );
  });

  it("otherMoonPosition rejects a moon that does not belong to the planet", () => {
    const date = new Date(Date.UTC(2026, 0, 1));
    expect(otherMoonPosition("Mars", "Triton", date)).toBeNull();
    expect(otherMoonPosition("Uranus", "Phobos", date)).toBeNull();
    expect(otherMoonPosition("Neptune", "Oberon", date)).toBeNull();
    // …but accepts one that does.
    expect(otherMoonPosition("Mars", "Phobos", date)).not.toBeNull();
  });

  it("invalid dates yield null (never throw)", () => {
    const bad = new Date(NaN);
    for (const planet of ALL_PLANETS) {
      expect(otherMoonPositions(planet, bad)).toBeNull();
      expect(planetGeocentric(planet, bad)).toBeNull();
      expect(currentOtherPhenomena(planet, bad)).toBeNull();
      expect(otherMoonsState(planet, bad)).toBeNull();
    }
    expect(otherMoonPosition("Mars", "Phobos", bad)).toBeNull();
  });

  it("otherMoonsState bundles planet, positions and current phenomena", () => {
    const s = otherMoonsState("Uranus", new Date(Date.UTC(2026, 0, 1)))!;
    expect(s.positions.length).toBe(5);
    expect(s.planet.distanceAU).toBeGreaterThan(17.9);
    expect(typeof s.planet.systemTiltDeg).toBe("number");
    expect(Array.isArray(s.current)).toBe(true);
  });
});
