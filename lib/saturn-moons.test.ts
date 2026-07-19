import { describe, expect, it } from "vitest";
import {
  SATURN,
  SATURN_MOONS,
  SATURN_MOON_ORDER,
  currentSaturnPhenomena,
  diskContains,
  julianDate,
  julianEphemerisDate,
  saturnGeocentric,
  saturnMoonPosition,
  saturnMoonPositions,
  saturnMoonsState,
  saturnRingGeometry,
} from "./saturn-moons";

const DAY_MS = 86_400_000;

/**
 * Physics acceptance tests for lib/saturn-moons.ts.
 *
 * ── Load-bearing reference: Meeus, *Astronomical Algorithms* 2nd ed., Ch. 45,
 *    "The Ring of Saturn", worked example 45.a ────────────────────────────────
 *
 * For 1992 December 16 at 0h Dynamical Time (JDE 2448972.5), Meeus prints:
 *
 *      B  (ring opening toward Earth)     ≈ +16.442°
 *      B' (ring opening toward the Sun)   ≈ +14.679°
 *      ΔU (longitude difference)          ≈  +4.198°
 *      P  (position angle of the pole)    ≈  +6.741°
 *      a  (ring major axis)               ≈  35.87″
 *      b  (ring minor axis)               ≈  10.15″   (b/a = sin|B|)
 *
 * This module reaches those with JPL mean planetary elements (Standish, via
 * lib/planets) instead of a full VSOP87. The honest residuals on 45.a are:
 *   B  +16.466 (−0.024°)   B' +14.706 (−0.027°)   ΔU 4.194 (+0.004°)
 *   P   +6.690 (+0.051°)   a  35.84″ (−0.03″)      b  10.16″ (+0.01″)
 * — under 0.05° / 0.03″ everywhere, the small cost of mean elements, documented
 * in the module header. Tolerances below are set to the book values, not the
 * residuals, with margin.
 */

// 1992-12-16 0h TD ≈ 1992-12-16 00:00 UTC (ΔT ≈ 59 s ⇒ < 0.001° of B).
const MEEUS_45A = new Date(Date.UTC(1992, 11, 16, 0, 0, 0));

describe("Meeus Ch. 45 worked example 45.a — 1992 Dec 16, 0h TD (load-bearing)", () => {
  const r = saturnRingGeometry(MEEUS_45A)!;

  it("B (Earth ring opening) ≈ +16.44°", () => {
    expect(r.ringTiltBDeg).toBeGreaterThan(0);
    expect(Math.abs(r.ringTiltBDeg - 16.442)).toBeLessThan(0.1);
  });

  it("B' (Sun ring opening) ≈ +14.68°", () => {
    expect(r.sunTiltBDeg).toBeGreaterThan(0);
    expect(Math.abs(r.sunTiltBDeg - 14.679)).toBeLessThan(0.1);
  });

  it("ΔU ≈ 4.20°", () => {
    expect(Math.abs(r.deltaUDeg - 4.198)).toBeLessThan(0.1);
  });

  it("P (position angle of Saturn's north pole) ≈ +6.74°", () => {
    expect(Math.abs(r.positionAngleDeg - 6.741)).toBeLessThan(0.15);
  });

  it("ring major axis a ≈ 35.87″ and minor axis b ≈ 10.15″", () => {
    expect(Math.abs(r.ringMajorAxisArcsec - 35.87)).toBeLessThan(0.15);
    expect(Math.abs(r.ringMinorAxisArcsec - 10.15)).toBeLessThan(0.1);
  });

  it("internal check: b/a = sin|B| (b = a·sin|B| by construction)", () => {
    const ratio = r.ringMinorAxisArcsec / r.ringMajorAxisArcsec;
    expect(ratio).toBeCloseTo(Math.sin(Math.abs(r.ringTiltBDeg) * (Math.PI / 180)), 6);
    // and it matches the book's 10.15/35.87.
    expect(Math.abs(ratio - 10.15 / 35.87)).toBeLessThan(0.005);
  });
});

describe("each moon's maximum apparent elongation ≈ its orbital radius (Req)", () => {
  // JPL SAT441 a in Saturn radii (Req = 60 268 km): Mimas ~3.09 … Iapetus ~59.1.
  const expected: Record<string, number> = {
    Mimas: 3.086,
    Enceladus: 3.956,
    Tethys: 4.895,
    Dione: 6.267,
    Rhea: 8.748,
    Titan: 20.274,
    Iapetus: 59.097,
  };

  it("stored semiMajorAxisReq matches the known orbital radii", () => {
    for (const m of SATURN_MOON_ORDER) {
      expect(SATURN_MOONS[m].semiMajorAxisReq).toBeCloseTo(expected[m], 1);
    }
  });

  it("max |X| over one orbit ≈ the orbital radius (within e + projection)", () => {
    for (const m of SATURN_MOON_ORDER) {
      const period = SATURN_MOONS[m].siderealPeriodDays;
      const e = SATURN_MOONS[m].eccentricity;
      let maxX = 0;
      // Sample one full orbit finely so we catch greatest elongation.
      for (let k = 0; k < 400; k++) {
        const date = new Date(Date.UTC(2026, 0, 1) + (k * period * DAY_MS) / 400);
        const p = saturnMoonPosition(m, date)!;
        maxX = Math.max(maxX, Math.abs(p.x));
      }
      const a = expected[m];
      // It genuinely REACHES near greatest elongation…
      expect(maxX).toBeGreaterThan(a * 0.9);
      // …but never exceeds apoapsis a(1+e) (the true bound on |X|).
      expect(maxX).toBeLessThan(a * (1 + e) + 0.05);
    }
  });
});

describe("moons string along the ring plane (internal consistency with B, P)", () => {
  // A moon in Saturn's equatorial plane projects so that its sky coordinate along
  // the projected pole (position angle P) is bounded by ρ·|sin B|. The inner six
  // hug the plane, so this must hold tightly; Iapetus is deliberately excluded
  // (its tilted-Laplace-plane orbit rides well off the ring — documented).
  const inner = ["Mimas", "Enceladus", "Tethys", "Dione", "Rhea", "Titan"] as const;

  it("inner six sit near the projected ring ellipse on several dates", () => {
    for (const dstr of [
      Date.UTC(2027, 2, 15),
      Date.UTC(2030, 6, 1),
      Date.UTC(2025, 4, 6), // near the 2025 equinox: ring almost edge-on
    ]) {
      const date = new Date(dstr);
      const r = saturnRingGeometry(date)!;
      const P = r.positionAngleDeg * (Math.PI / 180);
      const sinB = Math.abs(Math.sin(r.ringTiltBDeg * (Math.PI / 180)));
      for (const m of inner) {
        const p = saturnMoonPosition(m, date)!;
        // component along the projected pole (the ring's apparent minor axis).
        const minorCoord = p.x * -Math.sin(P) + p.y * Math.cos(P);
        // A point at IN-PLANE Saturn-centric radius ρ (≤ apoapsis a(1+e)) has
        // minor-axis sky coordinate ≤ ρ·sin|B|; add the tiny off-plane term a·sin i.
        const d = SATURN_MOONS[m];
        const rhoPlane = d.semiMajorAxisReq * (1 + d.eccentricity);
        const offPlane = d.semiMajorAxisReq * Math.sin(d.inclinationDeg * (Math.PI / 180));
        const bound = rhoPlane * sinB + offPlane + 0.05;
        expect(Math.abs(minorCoord)).toBeLessThanOrEqual(bound);
      }
    }
  });

  it("Iapetus rides well off the ring plane (honest low-accuracy flag)", () => {
    expect(SATURN_MOONS.Iapetus.laplacePlaneTilted).toBe(true);
    // Over an orbit it must reach a large off-plane excursion the inner moons
    // never do (its inclination × radius is ~15 Req).
    let maxOff = 0;
    for (let k = 0; k < 200; k++) {
      const date = new Date(
        Date.UTC(2026, 0, 1) + (k * SATURN_MOONS.Iapetus.siderealPeriodDays * DAY_MS) / 200
      );
      const r = saturnRingGeometry(date)!;
      const P = r.positionAngleDeg * (Math.PI / 180);
      const p = saturnMoonPosition("Iapetus", date)!;
      const minorCoord = p.x * -Math.sin(P) + p.y * Math.cos(P);
      maxOff = Math.max(maxOff, Math.abs(minorCoord));
    }
    expect(maxOff).toBeGreaterThan(5); // Req — far off any thin ring line
  });
});

describe("front/back geometry flips across an orbit", () => {
  it("frontOfDisk agrees with the sign of Z (positive = toward Earth)", () => {
    for (let h = 0; h < 200; h++) {
      const arr = saturnMoonPositions(new Date(Date.UTC(2026, 0, 1) + h * 3_600_000))!;
      for (const p of arr) {
        expect(p.frontOfDisk).toBe(p.z > 0);
      }
    }
  });

  it("each inner moon goes both in front of and behind Saturn during an orbit", () => {
    for (const m of ["Mimas", "Enceladus", "Tethys", "Dione", "Rhea", "Titan"] as const) {
      let sawFront = false;
      let sawBack = false;
      const period = SATURN_MOONS[m].siderealPeriodDays;
      for (let k = 0; k < 200; k++) {
        const date = new Date(Date.UTC(2026, 0, 1) + (k * period * DAY_MS) / 200);
        const p = saturnMoonPosition(m, date)!;
        if (p.frontOfDisk) sawFront = true;
        else sawBack = true;
      }
      expect(sawFront).toBe(true);
      expect(sawBack).toBe(true);
    }
  });
});

describe("saturnGeocentric — RA/Dec, distance, size, ring opening", () => {
  it("plausible Dec, distance (~8–11 AU), diameter (~15–20″)", () => {
    for (let mo = 0; mo < 24; mo++) {
      const date = new Date(Date.UTC(2024, 0, 1) + mo * 30 * DAY_MS);
      const g = saturnGeocentric(date)!;
      expect(g.raDeg).toBeGreaterThanOrEqual(0);
      expect(g.raDeg).toBeLessThan(360);
      // Saturn hugs the ecliptic (|β| < 2.5°) ⇒ |Dec| < 26°.
      expect(Math.abs(g.decDeg)).toBeLessThan(26);
      // Earth–Saturn distance ranges ~8.0 (opposition) … 11.1 AU (conjunction).
      expect(g.distanceAU).toBeGreaterThan(7.9);
      expect(g.distanceAU).toBeLessThan(11.2);
      // Apparent equatorial diameter ≈ 166″/Δ ⇒ ~15–20″.
      expect(g.angularDiameterArcsec).toBeGreaterThan(14.5);
      expect(g.angularDiameterArcsec).toBeLessThan(20.5);
    }
  });

  it("angular diameter is largest near minimum distance", () => {
    let minDist = Infinity;
    let diamAtMin = 0;
    let maxDiam = 0;
    let distAtMax = 0;
    for (let d = 0; d < 400; d += 2) {
      const g = saturnGeocentric(new Date(Date.UTC(2024, 0, 1) + d * DAY_MS))!;
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

  it("ring opening |B| matches the known trend: near 0 in 2025, opening after", () => {
    const bAt = (y: number, mo: number) =>
      saturnGeocentric(new Date(Date.UTC(y, mo, 6)))!.ringTiltB;
    // The last equinox was 2025-05-06 → |B| is small there…
    expect(Math.abs(bAt(2025, 4))).toBeLessThan(3);
    // …and the rings open progressively wider afterwards (south face, B < 0).
    const b2026 = Math.abs(bAt(2026, 4));
    const b2027 = Math.abs(bAt(2027, 4));
    const b2032 = Math.abs(bAt(2032, 4));
    expect(b2026).toBeGreaterThan(Math.abs(bAt(2025, 4)));
    expect(b2027).toBeGreaterThan(b2026);
    expect(b2032).toBeGreaterThan(b2027);
    // near the max opening (~26–27°) by the early 2030s.
    expect(b2032).toBeGreaterThan(24);
    expect(b2032).toBeLessThan(28);
    // ringTiltB from saturnGeocentric equals B from the ring geometry.
    const d = new Date(Date.UTC(2027, 4, 6));
    expect(saturnGeocentric(d)!.ringTiltB).toBeCloseTo(
      saturnRingGeometry(d)!.ringTiltBDeg,
      9
    );
  });
});

describe("shadows & phenomena are SEASONAL (the headline honesty check)", () => {
  it("shadow_transits occur in a season AROUND the 2025 equinox, not far from it", () => {
    const countShadowTransits = (year: number) => {
      let n = 0;
      // sample the whole year every 3 h
      for (let h = 0; h < 365 * 8; h++) {
        const arr = saturnMoonPositions(new Date(Date.UTC(year, 0, 1) + h * 3 * 3_600_000))!;
        for (const p of arr) if (p.inShadowTransit) n++;
      }
      return n;
    };
    const near = countShadowTransits(2025); // equinox year
    const far = countShadowTransits(2031); // rings wide open (|B|~24°)
    // Around equinox the moons' shadows sweep the disk; far from it they miss.
    expect(near).toBeGreaterThan(0);
    expect(near).toBeGreaterThan(far);
  });

  it("a moon's shadow lands on the rings near equinox (not when rings are open)", () => {
    // Moon shadows on the rings are an EQUINOX phenomenon (long shadows in the
    // near-edge-on ring plane — the effect Cassini imaged in 2009). When the
    // rings are wide open the Sun is high, shadows are short and land near the
    // moon, far outside the ring annulus. So this must fire near 2024–2025 and
    // vanish by 2030.
    const countRingShadows = (year: number) => {
      let n = 0;
      for (let h = 0; h < 365 * 8; h++) {
        const arr = saturnMoonPositions(new Date(Date.UTC(year, 0, 1) + h * 3 * 3_600_000))!;
        for (const p of arr) if (p.shadowOnRings) n++;
      }
      return n;
    };
    expect(countRingShadows(2024)).toBeGreaterThan(0); // approaching equinox
    expect(countRingShadows(2030)).toBe(0); // rings wide open (|B| ~ 25°)
  });

  it("currentSaturnPhenomena flags are consistent with the position flags", () => {
    // Pick a date near equinox where something is likely happening; verify that
    // whatever is listed is actually flagged on the matching position.
    for (let d = 0; d < 120; d++) {
      const date = new Date(Date.UTC(2025, 3, 1) + d * DAY_MS);
      const now = currentSaturnPhenomena(date)!;
      const positions = saturnMoonPositions(date)!;
      for (const ev of now) {
        const p = positions.find((q) => q.moon === ev.moon)!;
        if (ev.type === "transit") expect(p.inTransit).toBe(true);
        if (ev.type === "shadow_transit") expect(p.inShadowTransit).toBe(true);
        if (ev.type === "occultation") expect(p.inOccultation).toBe(true);
        if (ev.type === "eclipse") expect(p.inEclipse).toBe(true);
      }
    }
  });
});

describe("constants & helpers", () => {
  it("Saturn flattening ≈ 0.098 and polar ratio ≈ 0.902", () => {
    expect(SATURN.flattening).toBeCloseTo(0.098, 3);
    expect(SATURN.polarRadiusRatio).toBeCloseTo(0.902, 3);
  });

  it("pole is the IAU value (α0 ≈ 40.589°, δ0 ≈ 83.537°)", () => {
    expect(SATURN.poleRaJ2000Deg).toBeCloseTo(40.589, 3);
    expect(SATURN.poleDecJ2000Deg).toBeCloseTo(83.537, 3);
  });

  it("moon periods match the known sidereal values (JPL SSD SAT441)", () => {
    expect(SATURN_MOONS.Mimas.siderealPeriodDays).toBeCloseTo(0.9424, 3);
    expect(SATURN_MOONS.Titan.siderealPeriodDays).toBeCloseTo(15.9454, 3);
    expect(SATURN_MOONS.Iapetus.siderealPeriodDays).toBeCloseTo(79.331, 2);
  });

  it("diskContains: edge-on (B=0) disk is 1 Req wide, polarRatio thin", () => {
    // Pole at PA 0 (north up): equatorial semi-axis 1, polar semi-axis = ratio.
    expect(diskContains(0.99, 0, 0, SATURN.polarRadiusRatio)).toBe(true); // just inside equatorially
    expect(diskContains(1.01, 0, 0, SATURN.polarRadiusRatio)).toBe(false); // just outside
    const rEdge = SATURN.polarRadiusRatio; // edge-on apparent polar semi-axis
    expect(diskContains(0, rEdge * 0.99, 0, rEdge)).toBe(true);
    expect(diskContains(0, rEdge * 1.01, 0, rEdge)).toBe(false);
  });

  it("julianDate/julianEphemerisDate: J2000 and ΔT offset", () => {
    expect(julianDate(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)))).toBeCloseTo(2451545.0, 6);
    const d = new Date(Date.UTC(2020, 0, 1));
    expect((julianEphemerisDate(d) - julianDate(d)) * 86_400).toBeCloseTo(69.184, 3);
  });
});

describe("moons carry REAL J2000 phases (JPL SAT441), not a zeroed convention", () => {
  const norm360 = (d: number) => ((d % 360) + 360) % 360;

  it("the seven epoch mean longitudes λ0 = M+ω+Ω are distinct and non-degenerate", () => {
    const lam0 = SATURN_MOON_ORDER.map((m) => {
      const d = SATURN_MOONS[m];
      return norm360(d.meanAnomalyEpochDeg + d.argPeriapsisDeg + d.nodeDeg);
    });
    // NOT all zero (guards against a regression to the old schematic 0-at-J2000)…
    expect(lam0.some((v) => v > 1)).toBe(true);
    expect(
      SATURN_MOON_ORDER.every((m) => SATURN_MOONS[m].meanAnomalyEpochDeg === 0)
    ).toBe(false);
    // …pairwise distinct by a wide margin…
    for (let i = 0; i < lam0.length; i++) {
      for (let j = i + 1; j < lam0.length; j++) {
        let gap = Math.abs(lam0[i] - lam0[j]);
        gap = Math.min(gap, 360 - gap);
        expect(gap).toBeGreaterThan(3);
      }
    }
    // …and spread across the circle, not clustered (these are real phases).
    const sorted = [...lam0].sort((a, b) => a - b);
    expect(sorted[sorted.length - 1] - sorted[0]).toBeGreaterThan(90);
  });

  it("moons occupy varied phases at J2000 (both in front of and behind Saturn)", () => {
    const arr = saturnMoonPositions(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)))!;
    expect(arr.some((p) => p.frontOfDisk)).toBe(true);
    expect(arr.some((p) => !p.frontOfDisk)).toBe(true);
  });

  it("phase actually advances with time (the moons move), incl. Iapetus over years", () => {
    // Titan (~16 d period): a few days visibly moves it.
    const a = saturnMoonPosition("Titan", new Date(Date.UTC(2026, 0, 1)))!;
    const b = saturnMoonPosition("Titan", new Date(Date.UTC(2026, 0, 5)))!;
    expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBeGreaterThan(1);
    // Iapetus (~79 d period): a couple of months moves it.
    const c = saturnMoonPosition("Iapetus", new Date(Date.UTC(2026, 0, 1)))!;
    const e = saturnMoonPosition("Iapetus", new Date(Date.UTC(2026, 2, 1)))!;
    expect(Math.abs(c.x - e.x) + Math.abs(c.y - e.y)).toBeGreaterThan(5);
  });

  it("secular precession is applied: node/apse drift the configuration over a decade", () => {
    // Same orbital phase modulo period, one decade apart, must differ because the
    // node has regressed and the apse advanced (guards the precession terms).
    const period = SATURN_MOONS.Rhea.siderealPeriodDays;
    const t0 = Date.UTC(2000, 0, 1, 12, 0, 0);
    const wholeOrbits = Math.round((10 * 365.25) / period);
    const p0 = saturnMoonPosition("Rhea", new Date(t0))!;
    const p1 = saturnMoonPosition(
      "Rhea",
      new Date(t0 + wholeOrbits * period * DAY_MS)
    )!;
    // After an integer number of orbits the mean anomaly is ~back, but node/apse
    // precession leaves a residual displacement.
    expect(Math.abs(p0.x - p1.x) + Math.abs(p0.y - p1.y)).toBeGreaterThan(0.05);
  });
});

describe("determinism & null-safety", () => {
  it("saturnMoonPositions is deterministic", () => {
    const d = new Date(Date.UTC(2026, 6, 4, 12, 0, 0));
    const a = saturnMoonPositions(d)!;
    const b = saturnMoonPositions(d)!;
    for (let i = 0; i < a.length; i++) {
      expect(a[i].x).toBe(b[i].x);
      expect(a[i].y).toBe(b[i].y);
      expect(a[i].z).toBe(b[i].z);
      expect(a[i].shadowX).toBe(b[i].shadowX);
    }
  });

  it("returns the seven moons in orbital order", () => {
    const arr = saturnMoonPositions(new Date(Date.UTC(2026, 0, 1)))!;
    expect(arr.map((p) => p.moon)).toEqual([...SATURN_MOON_ORDER]);
    expect(arr.length).toBe(7);
  });

  it("invalid dates yield null (never throw)", () => {
    const bad = new Date(NaN);
    expect(saturnMoonPositions(bad)).toBeNull();
    expect(saturnMoonPosition("Titan", bad)).toBeNull();
    expect(saturnRingGeometry(bad)).toBeNull();
    expect(saturnGeocentric(bad)).toBeNull();
    expect(currentSaturnPhenomena(bad)).toBeNull();
    expect(saturnMoonsState(bad)).toBeNull();
  });

  it("saturnMoonsState bundles saturn, ring, positions and current phenomena", () => {
    const s = saturnMoonsState(new Date(Date.UTC(2026, 0, 1)))!;
    expect(s.positions.length).toBe(7);
    expect(s.saturn.distanceAU).toBeGreaterThan(7.9);
    expect(typeof s.ring.ringTiltBDeg).toBe("number");
    expect(Array.isArray(s.current)).toBe(true);
  });
});
