import { describe, expect, it } from "vitest";
import {
  ASTEROID_MOONS,
  ASTEROID_SYSTEMS,
  COMET_CONTACT_BINARIES,
  COMET_MOONS_NOTE,
  DART_IMPACT_UNIX_MS,
  DART_PERIOD_CHANGE_MINUTES,
  DIDYMOS_PERIOD_POST_DART_HOURS,
  DIDYMOS_PERIOD_PRE_DART_HOURS,
  MOONS_BY_SYSTEM,
  SYSTEMS_LIST,
  asteroidMoonPosition,
  asteroidMoonPositions,
  asteroidMoonsState,
  didymosPeriodHours,
  hoursSinceDartImpact,
  type AsteroidMoon,
  type AsteroidSystem,
} from "./asteroid-moons";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/**
 * Physics acceptance tests for lib/asteroid-moons.ts — the SCHEMATIC mutual-orbit
 * library for eight real binary/multiple asteroid systems (sibling of
 * lib/dwarf-moons.test.ts).
 *
 * WHAT IS REAL: diameters, mutual-orbit separations, periods, size ratios, the
 * DART-measured Dimorphos period change, the diameter³ barycenter split.
 * WHAT IS SCHEMATIC (illustrative): orbit orientation + along-orbit PHASE
 * (`phaseReal` = false EVERYWHERE); this is NOT an Earth plane-of-sky projection.
 * Dactyl's orbit is poorly constrained. Comets have ZERO moons — the closest
 * phenomenon is a contact binary (one body), encoded in COMET_CONTACT_BINARIES.
 */

const ALL: AsteroidSystem[] = [...SYSTEMS_LIST];
const DATE = new Date(Date.UTC(2026, 0, 1)); // a nominal post-DART date

// ── Pinned cited values (must match ASTEROID_MOONS / ASTEROID_SYSTEMS) ──
const EXPECTED_MOON: Record<
  AsteroidMoon,
  { parent: AsteroidSystem; d: number; a: number; P: number }
> = {
  Dimorphos: { parent: "Didymos", d: 0.16, a: 1.19, P: 11.921 },
  Dactyl: { parent: "Ida", d: 1.4, a: 108, P: 37 },
  Remus: { parent: "Sylvia", d: 7, a: 706, P: 33.1 },
  Romulus: { parent: "Sylvia", d: 24, a: 1356, P: 87.6 },
  Cleoselene: { parent: "Kleopatra", d: 6.9, a: 454, P: 29.8 },
  Alexhelios: { parent: "Kleopatra", d: 8.9, a: 678, P: 55.7 },
  AntiopeB: { parent: "Antiope", d: 87.8, a: 171, P: 16.5 },
  Linus: { parent: "Kalliope", d: 28, a: 1095, P: 86.3 },
  S2004_45_1: { parent: "Eugenia", d: 5, a: 611, P: 43 },
  PetitPrince: { parent: "Eugenia", d: 7, a: 1164, P: 113.2 },
  Menoetius: { parent: "Patroclus", d: 104, a: 680, P: 102.8 },
};

const EXPECTED_PRIMARY_DIAMETER: Record<AsteroidSystem, number> = {
  Didymos: 0.765,
  Ida: 31.4,
  Sylvia: 286,
  Kleopatra: 135,
  Antiope: 87.8,
  Kalliope: 166,
  Eugenia: 206,
  Patroclus: 113,
};

describe("cited data: diameters, separations, periods match the pinned values", () => {
  it("each moon's diameter / semiMajorAxisKm / periodHours is the cited value", () => {
    for (const key of Object.keys(EXPECTED_MOON) as AsteroidMoon[]) {
      const m = ASTEROID_MOONS[key];
      const want = EXPECTED_MOON[key];
      expect(m.parent).toBe(want.parent);
      expect(m.diameterKm).toBeCloseTo(want.d, 6);
      expect(m.semiMajorAxisKm).toBeCloseTo(want.a, 6);
      expect(m.periodHours).toBeCloseTo(want.P, 6);
    }
  });

  it("each primary diameter is the cited value", () => {
    for (const s of ALL) {
      expect(ASTEROID_SYSTEMS[s].primaryDiameterKm).toBeCloseTo(
        EXPECTED_PRIMARY_DIAMETER[s],
        6
      );
    }
    // Didymos rotation period is exposed as a real fact.
    expect(ASTEROID_SYSTEMS.Didymos.primaryRotationHours).toBeCloseTo(2.2593, 4);
  });

  it("SYSTEMS_LIST covers all eight systems, once each", () => {
    expect(SYSTEMS_LIST.length).toBe(8);
    expect(new Set(SYSTEMS_LIST).size).toBe(8);
    for (const s of Object.keys(ASTEROID_SYSTEMS) as AsteroidSystem[]) {
      expect(SYSTEMS_LIST).toContain(s);
    }
  });
});

describe("Didymos DART step change: the real, measured, human-caused shift", () => {
  it("didymosPeriodHours returns 11.921 h before the impact, 11.372 h after", () => {
    const before = new Date(Date.UTC(2020, 5, 1));
    const after = new Date(Date.UTC(2026, 0, 1));
    expect(didymosPeriodHours(before)).toBeCloseTo(DIDYMOS_PERIOD_PRE_DART_HOURS, 6);
    expect(didymosPeriodHours(before)).toBeCloseTo(11.921, 6);
    expect(didymosPeriodHours(after)).toBeCloseTo(DIDYMOS_PERIOD_POST_DART_HOURS, 6);
    expect(didymosPeriodHours(after)).toBeCloseTo(11.372, 6);
  });

  it("the step is real and discrete (~32.9 min), not zero", () => {
    const before = didymosPeriodHours(new Date(Date.UTC(2021, 0, 1)))!;
    const after = didymosPeriodHours(new Date(Date.UTC(2023, 0, 1)))!;
    expect(before).not.toBe(after);
    expect((before - after) * 60).toBeCloseTo(DART_PERIOD_CHANGE_MINUTES, 6);
    expect(DART_PERIOD_CHANGE_MINUTES).toBeGreaterThan(30);
    expect(DART_PERIOD_CHANGE_MINUTES).toBeLessThan(34);
  });

  it("the boundary is the 2022-09-26 impact instant (>= impact ⇒ post)", () => {
    const justBefore = new Date(DART_IMPACT_UNIX_MS - 1);
    const atImpact = new Date(DART_IMPACT_UNIX_MS);
    expect(didymosPeriodHours(justBefore)).toBeCloseTo(11.921, 6);
    expect(didymosPeriodHours(atImpact)).toBeCloseTo(11.372, 6);
    expect(hoursSinceDartImpact(atImpact)).toBeCloseTo(0, 6);
    expect(hoursSinceDartImpact(new Date(DART_IMPACT_UNIX_MS + HOUR_MS))).toBeCloseTo(1, 6);
  });

  it("Dimorphos exposes BOTH periods; its live position uses the post-DART period", () => {
    const m = ASTEROID_MOONS.Dimorphos;
    expect(m.periodHours).toBeCloseTo(11.921, 6);
    expect(m.periodHoursPostDart).toBeCloseTo(11.372, 6);
    expect(m.dartImpact).toBe(true);
    expect(m.retrograde).toBe(true); // real retrograde mutual orbit
    const moon = asteroidMoonPosition("Didymos", "Dimorphos", DATE)!;
    expect(moon.periodHours).toBeCloseTo(11.372, 6); // 2026 ⇒ post-DART
    const state = asteroidMoonsState("Didymos", DATE)!;
    expect(state.didymosPeriodHours).toBeCloseTo(11.372, 6);
    // Every non-Didymos system reports null for the DART period.
    expect(asteroidMoonsState("Ida", DATE)!.didymosPeriodHours).toBeNull();
  });
});

describe("near-equal doubles vs small-moon barycenter split", () => {
  const massRatio = (dMoon: number, dPrimary: number) =>
    Math.pow(dMoon / dPrimary, 3);

  it("Antiope & Patroclus split about the barycenter: |primary|:|moon| = m_moon:m_primary", () => {
    for (const s of ["Antiope", "Patroclus"] as AsteroidSystem[]) {
      expect(ASTEROID_SYSTEMS[s].nearEqualDouble).toBe(true);
      const moonKey = MOONS_BY_SYSTEM[s][0];
      const q = massRatio(
        ASTEROID_MOONS[moonKey].diameterKm,
        ASTEROID_SYSTEMS[s].primaryDiameterKm
      );
      for (const dstr of [Date.UTC(2026, 0, 1), Date.UTC(2027, 4, 9, 7), Date.UTC(2031, 8, 20)]) {
        const bodies = asteroidMoonPositions(s, new Date(dstr))!;
        const primary = bodies.find((b) => b.role === "primary")!;
        const moon = bodies.find((b) => b.role === "moon")!;
        const pMag = Math.hypot(primary.xKm, primary.yKm);
        const mMag = Math.hypot(moon.xKm, moon.yKm);
        // Both components orbit empty space — both offsets are non-zero.
        expect(pMag).toBeGreaterThan(1); // km
        expect(mMag).toBeGreaterThan(1);
        // |primary offset| : |moon offset| = m_moon : m_primary (from diameter³).
        expect(pMag / mMag).toBeCloseTo(q, 6);
        // Anti-phase: the two components are on opposite sides of the barycenter.
        const dotp = primary.xKm * moon.xKm + primary.yKm * moon.yKm;
        expect(dotp).toBeLessThan(0);
      }
    }
    // Antiope's components are equal-mass ⇒ ratio exactly 1.
    const eq = asteroidMoonPositions("Antiope", DATE)!;
    const pA = eq.find((b) => b.role === "primary")!;
    const mA = eq.find((b) => b.role === "moon")!;
    expect(Math.hypot(pA.xKm, pA.yKm) / Math.hypot(mA.xKm, mA.yKm)).toBeCloseTo(1, 6);
  });

  it("small-moon systems keep the primary ~at the barycenter (tiny wobble)", () => {
    for (const s of ALL) {
      if (ASTEROID_SYSTEMS[s].nearEqualDouble) continue;
      const primary = asteroidMoonPositions(s, DATE)!.find((b) => b.role === "primary")!;
      // Primary offset is a negligible fraction of a primary radius.
      expect(Math.hypot(primary.xReq, primary.yReq)).toBeLessThan(0.1);
    }
  });

  it("primary↔moon distance always equals the cited separation (a real invariant)", () => {
    // moon − primary = r_rel regardless of the barycenter split, so the physical
    // separation is preserved exactly for every system.
    for (const s of ALL) {
      const bodies = asteroidMoonPositions(s, new Date(Date.UTC(2029, 2, 2, 3)))!;
      const primary = bodies.find((b) => b.role === "primary")!;
      for (const moon of bodies.filter((b) => b.role === "moon")) {
        const sep = Math.hypot(moon.xKm - primary.xKm, moon.yKm - primary.yKm);
        expect(sep).toBeCloseTo(moon.separationKm!, 3);
      }
    }
  });
});

describe("triples and moon counts", () => {
  it("Sylvia, Kleopatra and Eugenia are triples (primary + two moons)", () => {
    for (const s of ["Sylvia", "Kleopatra", "Eugenia"] as AsteroidSystem[]) {
      expect(ASTEROID_SYSTEMS[s].isTriple).toBe(true);
      expect(MOONS_BY_SYSTEM[s].length).toBe(2);
      const bodies = asteroidMoonPositions(s, DATE)!;
      expect(bodies.filter((b) => b.role === "moon").length).toBe(2);
      expect(bodies.filter((b) => b.role === "primary").length).toBe(1);
      expect(bodies.length).toBe(3);
    }
    for (const s of ["Didymos", "Ida", "Antiope", "Kalliope", "Patroclus"] as AsteroidSystem[]) {
      expect(ASTEROID_SYSTEMS[s].isTriple).toBe(false);
      expect(MOONS_BY_SYSTEM[s].length).toBe(1);
    }
  });

  it("classification flags: first asteroid moon (Ida) and first triple (Sylvia)", () => {
    expect(ASTEROID_SYSTEMS.Ida.firstAsteroidMoon).toBe(true);
    expect(ASTEROID_SYSTEMS.Sylvia.firstTriple).toBe(true);
    expect(ASTEROID_SYSTEMS.Didymos.dartTarget).toBe(true);
    expect(ASTEROID_SYSTEMS.Patroclus.mission).toContain("Lucy");
    // Populations: Didymos NEO, Patroclus Trojan, the rest main-belt.
    expect(ASTEROID_SYSTEMS.Didymos.population).toBe("NEO");
    expect(ASTEROID_SYSTEMS.Patroclus.population).toBe("Trojan");
    for (const s of ["Ida", "Sylvia", "Kleopatra", "Antiope", "Kalliope", "Eugenia"] as AsteroidSystem[]) {
      expect(ASTEROID_SYSTEMS[s].population).toBe("main-belt");
    }
  });
});

describe("honesty flags: schematic phase, uncertain orbit, comet-no-moons", () => {
  it("phaseReal is FALSE for every moon and every position", () => {
    for (const key of Object.keys(ASTEROID_MOONS) as AsteroidMoon[]) {
      expect(ASTEROID_MOONS[key].phaseReal).toBe(false);
    }
    for (const s of ALL) {
      for (const b of asteroidMoonPositions(s, DATE)!) {
        expect(b.phaseReal).toBe(false);
      }
      // The state is explicit that this is NOT a plane-of-sky view.
      expect(asteroidMoonsState(s, DATE)!.isPlaneOfSky).toBe(false);
    }
  });

  it("orbitUncertain is TRUE only for Dactyl (single-flyby orbit)", () => {
    for (const key of Object.keys(ASTEROID_MOONS) as AsteroidMoon[]) {
      expect(ASTEROID_MOONS[key].orbitUncertain).toBe(key === "Dactyl");
    }
    expect(asteroidMoonPosition("Ida", "Dactyl", DATE)!.orbitUncertain).toBe(true);
    expect(asteroidMoonPosition("Sylvia", "Romulus", DATE)!.orbitUncertain).toBe(false);
  });

  it("COMET_CONTACT_BINARIES present; NO comet has a moon", () => {
    const keys = Object.keys(COMET_CONTACT_BINARIES);
    expect(keys).toContain("67P");
    expect(keys).toContain("Arrokoth");
    for (const k of keys) {
      const cb = COMET_CONTACT_BINARIES[k];
      // A contact binary is ONE body — never a primary with a satellite.
      expect(cb.isContactBinary).toBe(true);
      expect(cb.isSingleBody).toBe(true);
      expect(cb.hasMoon).toBe(false);
      expect(cb.lobeCount).toBe(2);
    }
    // No asteroid moon's parent is a comet/KBO contact binary.
    for (const key of Object.keys(ASTEROID_MOONS) as AsteroidMoon[]) {
      expect(keys).not.toContain(ASTEROID_MOONS[key].parent);
    }
    expect(COMET_MOONS_NOTE.toLowerCase()).toContain("no comet");
    expect(COMET_MOONS_NOTE.length).toBeGreaterThan(50);
  });
});

describe("schematic Kepler motion at the REAL period", () => {
  it("bodies return to their start after one full mutual period", () => {
    // The physically periodic quantity is the moon's vector RELATIVE TO THE
    // PRIMARY (moon − primary = r_rel), which is independent of the other moons in
    // a triple; the barycentric coordinate alone is not periodic in one moon's
    // period because the barycenter also shifts as siblings move.
    const relTo = (s: AsteroidSystem, key: AsteroidMoon, t: number) => {
      const bodies = asteroidMoonPositions(s, new Date(t))!;
      const primary = bodies.find((b) => b.role === "primary")!;
      const moon = bodies.find((b) => b.body === ASTEROID_MOONS[key].displayName)!;
      return { x: moon.xKm - primary.xKm, y: moon.yKm - primary.yKm };
    };
    for (const s of ALL) {
      for (const key of MOONS_BY_SYSTEM[s]) {
        const m = ASTEROID_MOONS[key];
        // Use a post-DART date so Dimorphos's live period is constant across the span.
        const t0 = Date.UTC(2026, 0, 1);
        const P = (key === "Dimorphos" ? DIDYMOS_PERIOD_POST_DART_HOURS : m.periodHours) * HOUR_MS;
        const a = relTo(s, key, t0);
        const full = relTo(s, key, t0 + P);
        const half = relTo(s, key, t0 + P / 2);
        // One full period ⇒ back to (essentially) the same point.
        expect(Math.hypot(full.x - a.x, full.y - a.y)).toBeLessThan(1e-3);
        // Half a period ⇒ meaningfully displaced (near the opposite side).
        expect(Math.hypot(half.x - a.x, half.y - a.y)).toBeGreaterThan(
          m.semiMajorAxisKm * 0.5
        );
      }
    }
  });

  it("max apparent separation over one orbit ≈ the cited semi-major axis", () => {
    // For near-circular orbits the moon reaches ~a from the primary each orbit.
    for (const s of ALL) {
      for (const key of MOONS_BY_SYSTEM[s]) {
        const m = ASTEROID_MOONS[key];
        const P = (key === "Dimorphos" ? DIDYMOS_PERIOD_POST_DART_HOURS : m.periodHours) * HOUR_MS;
        let maxSep = 0;
        for (let i = 0; i < 200; i++) {
          const bodies = asteroidMoonPositions(s, new Date(Date.UTC(2026, 0, 1) + (i * P) / 200))!;
          const primary = bodies.find((b) => b.role === "primary")!;
          const moon = bodies.find((b) => b.body === m.displayName)!;
          maxSep = Math.max(maxSep, Math.hypot(moon.xKm - primary.xKm, moon.yKm - primary.yKm));
        }
        expect(maxSep).toBeCloseTo(m.semiMajorAxisKm, 2);
      }
    }
  });
});

describe("determinism & null-safety", () => {
  it("asteroidMoonPositions is deterministic and primary-first, moons in order", () => {
    const d = new Date(Date.UTC(2026, 6, 4, 12, 0, 0));
    for (const s of ALL) {
      const a = asteroidMoonPositions(s, d)!;
      const b = asteroidMoonPositions(s, d)!;
      expect(a[0].role).toBe("primary");
      expect(a.map((p) => p.body)).toEqual([
        ASTEROID_SYSTEMS[s].name,
        ...MOONS_BY_SYSTEM[s].map((k) => ASTEROID_MOONS[k].displayName),
      ]);
      for (let i = 0; i < a.length; i++) {
        expect(a[i].xKm).toBe(b[i].xKm);
        expect(a[i].yKm).toBe(b[i].yKm);
      }
    }
  });

  it("every body carries its diameter (drawn to scale) and Req offsets", () => {
    const bodies = asteroidMoonPositions("Sylvia", DATE)!;
    expect(bodies.find((b) => b.role === "primary")!.diameterKm).toBeCloseTo(286, 6);
    expect(bodies.find((b) => b.body === "Romulus")!.diameterKm).toBeCloseTo(24, 6);
    for (const b of bodies) {
      expect(Number.isFinite(b.xReq)).toBe(true);
      expect(Number.isFinite(b.yReq)).toBe(true);
    }
  });

  it("asteroidMoonPosition rejects a moon that is not in the system", () => {
    expect(asteroidMoonPosition("Didymos", "Dactyl", DATE)).toBeNull();
    expect(asteroidMoonPosition("Sylvia", "Linus", DATE)).toBeNull();
    expect(asteroidMoonPosition("Ida", "Dactyl", DATE)).not.toBeNull();
  });

  it("invalid dates yield null everywhere (never throw)", () => {
    const bad = new Date(NaN);
    for (const s of ALL) {
      expect(asteroidMoonPositions(s, bad)).toBeNull();
      expect(asteroidMoonsState(s, bad)).toBeNull();
    }
    expect(asteroidMoonPosition("Ida", "Dactyl", bad)).toBeNull();
    expect(didymosPeriodHours(bad)).toBeNull();
    expect(hoursSinceDartImpact(bad)).toBeNull();
  });

  it("asteroidMoonsState bundles data, positions, moon records and flags", () => {
    const s = asteroidMoonsState("Patroclus", DATE)!;
    expect(s.systemData.designation).toBe("617");
    expect(s.nearEqualDouble).toBe(true);
    expect(s.isTriple).toBe(false);
    expect(s.positions.length).toBe(2);
    expect(s.moons.length).toBe(1);
    expect(s.moons[0].name).toBe("Menoetius");

    const t = asteroidMoonsState("Sylvia", DATE)!;
    expect(t.isTriple).toBe(true);
    expect(t.positions.length).toBe(3);
    expect(t.moons.length).toBe(2);
  });
});
