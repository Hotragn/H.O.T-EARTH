import { describe, expect, it } from "vitest";
import {
  INTERSTELLAR_IDS,
  INTERSTELLAR_OBJECTS,
  SUN_GM_KM3_S2,
  type InterstellarId,
  currentSpeedKmS,
  getInterstellarObject,
  hyperbolicExcessSpeedKmS,
  incomingAsymptoteDirection,
  interstellarObjects,
  interstellarPosition,
  interstellarState,
  interstellarTrajectory,
  localEscapeSpeedKmS,
  outgoingAsymptoteDirection,
} from "./interstellar";
import { AU_KM } from "./small-bodies";

/**
 * Acceptance tests for the three confirmed interstellar objects.
 *
 * Reference facts (cited in lib/interstellar.ts header; JPL SBDB / MPC / NASA):
 *   • 1I/'Oumuamua — e ≈ 1.201, q ≈ 0.2559 AU, i ≈ 122.7° (2017).
 *   • 2I/Borisov   — e ≈ 3.356, q ≈ 2.0065 AU, i ≈ 44.1°  (2019, active comet).
 *   • 3I/ATLAS     — e ≈ 6.141, q ≈ 1.3565 AU, i ≈ 175.1° (retrograde, 2025);
 *                    v∞ ≈ 58 km/s, peak heliocentric speed ≈ 68.3 km/s.
 */

const DAY_MS = 86_400_000;

/** UTC Date at the object's perihelion (round-trips through its stored JD). */
function perihelionDate(id: InterstellarId): Date {
  return INTERSTELLAR_OBJECTS[id].timeOfPerihelion;
}

function mag(v: readonly [number, number, number]): number {
  return Math.hypot(v[0], v[1], v[2]);
}

// ─────────────────────────── Data table ─────────────────────────────────────

describe("INTERSTELLAR_OBJECTS — data table", () => {
  it("has exactly the three confirmed objects, in discovery order", () => {
    expect(INTERSTELLAR_IDS).toEqual(["1I", "2I", "3I"]);
    expect(interstellarObjects().map((o) => o.id)).toEqual(["1I", "2I", "3I"]);
    expect(interstellarObjects()).toHaveLength(3);
  });

  it("every object is unbound (e > 1) with the cited eccentricities", () => {
    for (const id of INTERSTELLAR_IDS) {
      expect(INTERSTELLAR_OBJECTS[id].eccentricity).toBeGreaterThan(1);
    }
    expect(INTERSTELLAR_OBJECTS["1I"].eccentricity).toBeCloseTo(1.201, 2);
    expect(INTERSTELLAR_OBJECTS["2I"].eccentricity).toBeCloseTo(3.356, 2);
    expect(INTERSTELLAR_OBJECTS["3I"].eccentricity).toBeCloseTo(6.141, 2);
  });

  it("perihelion distances match the cited values", () => {
    expect(INTERSTELLAR_OBJECTS["1I"].perihelionAU).toBeCloseTo(0.2559, 3);
    expect(INTERSTELLAR_OBJECTS["2I"].perihelionAU).toBeCloseTo(2.0065, 3);
    expect(INTERSTELLAR_OBJECTS["3I"].perihelionAU).toBeCloseTo(1.35645, 4);
  });

  it("3I/ATLAS is retrograde (inclination > 90°), the others prograde-ish", () => {
    expect(INTERSTELLAR_OBJECTS["3I"].inclinationDeg).toBeGreaterThan(90);
    expect(INTERSTELLAR_OBJECTS["3I"].inclinationDeg).toBeCloseTo(175.12, 2);
    // 'Oumuamua is itself retrograde-inclined; Borisov is prograde.
    expect(INTERSTELLAR_OBJECTS["2I"].inclinationDeg).toBeLessThan(90);
  });

  it("carries the story metadata and a citation for every object", () => {
    for (const o of interstellarObjects()) {
      expect(o.name).toBeTruthy();
      expect(o.designation).toBeTruthy();
      expect(o.discoveryYear).toBeGreaterThan(2016);
      expect(o.originConstellation).toBeTruthy();
      expect(o.ageNote).toBeTruthy();
      expect(o.nucleusSizeNote).toBeTruthy();
      expect(o.facts.length).toBeGreaterThan(0);
      expect(o.source.toLowerCase()).toContain("sbdb");
      expect(o.timeOfPerihelion instanceof Date).toBe(true);
      expect(Number.isFinite(o.timeOfPerihelion.getTime())).toBe(true);
    }
    // Borisov and ATLAS are active comets; 'Oumuamua showed no coma.
    expect(INTERSTELLAR_OBJECTS["1I"].isActiveComet).toBe(false);
    expect(INTERSTELLAR_OBJECTS["2I"].isActiveComet).toBe(true);
    expect(INTERSTELLAR_OBJECTS["3I"].isActiveComet).toBe(true);
    // 3I/ATLAS came from the direction of Sagittarius.
    expect(INTERSTELLAR_OBJECTS["3I"].originConstellation.toLowerCase()).toContain(
      "sagittarius"
    );
  });

  it("getInterstellarObject looks up by id and is null for unknowns", () => {
    expect(getInterstellarObject("1I")!.name).toBe("1I/'Oumuamua");
    expect(getInterstellarObject("3I")!.designation).toBe("C/2025 N1");
    expect(getInterstellarObject("9Z")).toBeNull();
    expect(getInterstellarObject("")).toBeNull();
  });
});

// ─────────────────────────── Position ───────────────────────────────────────

describe("interstellarPosition — hyperbolic Kepler orbit", () => {
  it("is ≈ q at perihelion and never inside q anywhere on the orbit", () => {
    for (const id of INTERSTELLAR_IDS) {
      const q = INTERSTELLAR_OBJECTS[id].perihelionAU;
      const posP = interstellarPosition(id, perihelionDate(id))!;
      expect(posP).not.toBeNull();
      expect(posP.distanceAU).toBeCloseTo(q, 4); // ~q near perihelion

      // Sweep a wide window either side of perihelion: r >= q always.
      const tp = INTERSTELLAR_OBJECTS[id].timeOfPerihelionJD;
      for (let d = -3000; d <= 3000; d += 100) {
        const date = new Date((tp + d - 2440587.5) * DAY_MS);
        const r = interstellarPosition(id, date)!.distanceAU;
        expect(Number.isFinite(r)).toBe(true);
        expect(r).toBeGreaterThanOrEqual(q - 1e-6);
      }
    }
  });

  it("recedes without bound after perihelion (open orbit, never returns)", () => {
    for (const id of INTERSTELLAR_IDS) {
      const tp = INTERSTELLAR_OBJECTS[id].timeOfPerihelionJD;
      const rAt = (days: number) =>
        interstellarPosition(id, new Date((tp + days - 2440587.5) * DAY_MS))!
          .distanceAU;
      expect(rAt(200)).toBeLessThan(rAt(1000));
      expect(rAt(1000)).toBeLessThan(rAt(4000));
      expect(rAt(4000)).toBeGreaterThan(10); // long gone from the inner system
    }
  });

  it("returns null for an unknown id or an invalid Date", () => {
    expect(interstellarPosition("ZZ", new Date())).toBeNull();
    expect(interstellarPosition("3I", new Date(NaN))).toBeNull();
  });

  it("is deterministic (pure function of id + date)", () => {
    const d = new Date(Date.UTC(2025, 10, 15, 3, 14));
    expect(interstellarPosition("3I", d)).toEqual(interstellarPosition("3I", d));
    expect(interstellarPosition("2I", d)).toEqual(interstellarPosition("2I", d));
  });
});

// ─────────────────────────── Speed (vis-viva) ───────────────────────────────

describe("speed — hyperbolic vis-viva, always unbound", () => {
  it("is highest near perihelion and falls off either side", () => {
    for (const id of INTERSTELLAR_IDS) {
      const tp = INTERSTELLAR_OBJECTS[id].timeOfPerihelionJD;
      const vAt = (days: number) =>
        currentSpeedKmS(id, new Date((tp + days - 2440587.5) * DAY_MS))!;
      const vPeri = vAt(0);
      expect(vPeri).toBeGreaterThan(vAt(-150));
      expect(vPeri).toBeGreaterThan(vAt(150));
      expect(vAt(150)).toBeGreaterThan(vAt(1500)); // still slowing far out
    }
  });

  it("always exceeds the local Sun-escape speed (v > v_esc ⇒ unbound)", () => {
    for (const id of INTERSTELLAR_IDS) {
      const tp = INTERSTELLAR_OBJECTS[id].timeOfPerihelionJD;
      for (let d = -2000; d <= 2000; d += 250) {
        const date = new Date((tp + d - 2440587.5) * DAY_MS);
        const v = currentSpeedKmS(id, date)!;
        const r = interstellarPosition(id, date)!.distanceAU;
        const vEsc = localEscapeSpeedKmS(r)!;
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThan(vEsc);
      }
    }
  });

  it("reproduces 3I/ATLAS's cited peak speed ≈ 68.3 km/s at perihelion", () => {
    const v = currentSpeedKmS("3I", perihelionDate("3I"))!;
    expect(v).toBeGreaterThan(67.5);
    expect(v).toBeLessThan(69.0);
  });

  it("hyperbolic excess speed v∞ matches each object's cited value", () => {
    for (const id of INTERSTELLAR_IDS) {
      const vInf = hyperbolicExcessSpeedKmS(id)!;
      expect(vInf).toBeGreaterThan(0);
      // Computed √(GM☉/|a|) agrees with the tabulated v∞ to < 1 km/s.
      expect(Math.abs(vInf - INTERSTELLAR_OBJECTS[id].vInfKmS)).toBeLessThan(1);
    }
    // Speed far from the Sun tends toward v∞ from above.
    const tp = INTERSTELLAR_OBJECTS["3I"].timeOfPerihelionJD;
    const vFar = currentSpeedKmS(
      "3I",
      new Date((tp + 60000 - 2440587.5) * DAY_MS)
    )!;
    expect(vFar).toBeGreaterThan(hyperbolicExcessSpeedKmS("3I")!);
    expect(vFar).toBeCloseTo(hyperbolicExcessSpeedKmS("3I")!, 0);
  });

  it("GM☉ constant and escape-speed helper are sane and null-safe", () => {
    expect(SUN_GM_KM3_S2).toBeCloseTo(1.32712e11, -6);
    // Earth-orbit Sun-escape speed ≈ 42.1 km/s at 1 AU.
    expect(localEscapeSpeedKmS(1)!).toBeCloseTo(42.1, 0);
    expect(localEscapeSpeedKmS(0)).toBeNull();
    expect(localEscapeSpeedKmS(-1)).toBeNull();
    expect(localEscapeSpeedKmS(Number.NaN)).toBeNull();
    // Sanity: v_esc(1 AU) = sqrt(2 GM / AU_km).
    expect(localEscapeSpeedKmS(1)!).toBeCloseTo(
      Math.sqrt((2 * SUN_GM_KM3_S2) / AU_KM),
      9
    );
  });

  it("returns null for an unknown id or invalid Date", () => {
    expect(currentSpeedKmS("ZZ", new Date())).toBeNull();
    expect(currentSpeedKmS("3I", new Date(NaN))).toBeNull();
    expect(hyperbolicExcessSpeedKmS("ZZ")).toBeNull();
  });
});

// ─────────────────────────── Asymptote directions ───────────────────────────

describe("asymptote directions — where it came from / heads to", () => {
  it("both are finite unit vectors for every object", () => {
    for (const id of INTERSTELLAR_IDS) {
      const inc = incomingAsymptoteDirection(id)!;
      const out = outgoingAsymptoteDirection(id)!;
      expect(inc.every(Number.isFinite)).toBe(true);
      expect(out.every(Number.isFinite)).toBe(true);
      expect(mag(inc)).toBeCloseTo(1, 12);
      expect(mag(out)).toBeCloseTo(1, 12);
    }
  });

  it("incoming and outgoing are distinct directions (a real deflection)", () => {
    for (const id of INTERSTELLAR_IDS) {
      const inc = incomingAsymptoteDirection(id)!;
      const out = outgoingAsymptoteDirection(id)!;
      const dot = inc[0] * out[0] + inc[1] * out[1] + inc[2] * out[2];
      expect(dot).toBeLessThan(0.9999); // not the same direction
    }
  });

  it("is deterministic and null for an unknown id", () => {
    expect(incomingAsymptoteDirection("3I")).toEqual(
      incomingAsymptoteDirection("3I")
    );
    expect(incomingAsymptoteDirection("ZZ")).toBeNull();
    expect(outgoingAsymptoteDirection("ZZ")).toBeNull();
  });
});

// ─────────────────────────── Trajectory sampling ────────────────────────────

describe("interstellarTrajectory — sampled hyperbolic path", () => {
  it("returns the requested number of finite points, spanning perihelion", () => {
    const tp = INTERSTELLAR_OBJECTS["3I"].timeOfPerihelionJD;
    const from = new Date((tp - 400 - 2440587.5) * DAY_MS);
    const to = new Date((tp + 400 - 2440587.5) * DAY_MS);
    const traj = interstellarTrajectory("3I", from, to, 60);
    expect(traj).toHaveLength(60);
    for (const p of traj) {
      expect(Number.isFinite(p.position.distanceAU)).toBe(true);
      expect(Number.isFinite(p.position.x)).toBe(true);
      expect(p.date instanceof Date).toBe(true);
      expect(Number.isFinite(p.jd)).toBe(true);
      expect(p.position.distanceAU).toBeGreaterThanOrEqual(
        INTERSTELLAR_OBJECTS["3I"].perihelionAU - 1e-6
      );
    }
    // Endpoints ordered; a near-perihelion point is close to q.
    expect(traj[0].jd).toBeLessThan(traj[traj.length - 1].jd);
    const minR = Math.min(...traj.map((p) => p.position.distanceAU));
    expect(minR).toBeCloseTo(INTERSTELLAR_OBJECTS["3I"].perihelionAU, 1);
  });

  it("handles a single step and clamps bad step counts to []", () => {
    const d0 = perihelionDate("2I");
    const d1 = new Date(d0.getTime() + 100 * DAY_MS);
    expect(interstellarTrajectory("2I", d0, d1, 1)).toHaveLength(1);
    expect(interstellarTrajectory("2I", d0, d1, 0)).toEqual([]);
    expect(interstellarTrajectory("2I", d0, d1, -5)).toEqual([]);
  });

  it("returns [] for an unknown id or invalid dates", () => {
    const d = new Date();
    expect(interstellarTrajectory("ZZ", d, d, 10)).toEqual([]);
    expect(interstellarTrajectory("3I", new Date(NaN), d, 10)).toEqual([]);
    expect(interstellarTrajectory("3I", d, new Date(NaN), 10)).toEqual([]);
  });

  it("is deterministic", () => {
    const from = perihelionDate("1I");
    const to = new Date(from.getTime() + 500 * DAY_MS);
    expect(interstellarTrajectory("1I", from, to, 25)).toEqual(
      interstellarTrajectory("1I", from, to, 25)
    );
  });
});

// ─────────────────────────── State bundle (HUD) ─────────────────────────────

describe("interstellarState — one-call HUD bundle", () => {
  it("bundles position, speed, Sun/Earth distance and perihelion phase", () => {
    const id: InterstellarId = "3I";
    const before = new Date(
      (INTERSTELLAR_OBJECTS[id].timeOfPerihelionJD - 120 - 2440587.5) * DAY_MS
    );
    const s = interstellarState(id, before)!;
    expect(s.id).toBe("3I");
    expect(s.name).toBe("3I/ATLAS");
    expect(s.position).not.toBeNull();
    expect(s.speedKmS!).toBeGreaterThan(0);
    expect(s.distanceFromSunAU!).toBeCloseTo(s.position!.distanceAU, 9);
    expect(s.distanceFromEarthAU!).toBeGreaterThan(0);
    expect(s.unbound).toBe(true);
    expect(s.phase).toBe("inbound"); // 120 days before perihelion
    expect(s.daysFromPerihelion!).toBeLessThan(0);
  });

  it("reports 'at perihelion' at Tp and 'outbound' afterwards", () => {
    const at = interstellarState("3I", perihelionDate("3I"))!;
    expect(at.phase).toBe("at perihelion");
    const tp = INTERSTELLAR_OBJECTS["3I"].timeOfPerihelionJD;
    const after = interstellarState(
      "3I",
      new Date((tp + 200 - 2440587.5) * DAY_MS)
    )!;
    expect(after.phase).toBe("outbound");
    expect(after.daysFromPerihelion!).toBeGreaterThan(0);
  });

  it("geocentric distance is a real Sun-frame vector difference (bounded)", () => {
    // Distance from Earth is at least |r_obj - 1 AU| and at most r_obj + ~1.02 AU.
    const s = interstellarState("2I", perihelionDate("2I"))!;
    const rSun = s.distanceFromSunAU!;
    expect(s.distanceFromEarthAU!).toBeGreaterThan(Math.abs(rSun - 1.02) - 1e-6);
    expect(s.distanceFromEarthAU!).toBeLessThan(rSun + 1.02 + 1e-6);
  });

  it("is null for an unknown id and null-fielded (not NaN) on a bad date", () => {
    expect(interstellarState("ZZ", new Date())).toBeNull();
    const bad = interstellarState("3I", new Date(NaN))!;
    expect(bad).not.toBeNull();
    expect(bad.position).toBeNull();
    expect(bad.speedKmS).toBeNull();
    expect(bad.distanceFromSunAU).toBeNull();
    expect(bad.distanceFromEarthAU).toBeNull();
    expect(bad.phase).toBeNull();
    expect(bad.unbound).toBe(true);
  });

  it("is deterministic", () => {
    const d = new Date(Date.UTC(2025, 11, 1, 6));
    expect(interstellarState("3I", d)).toEqual(interstellarState("3I", d));
  });
});
