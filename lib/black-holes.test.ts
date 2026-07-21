import { describe, expect, it } from "vitest";
import {
  BLACK_HOLES,
  BLACK_HOLE_IDS,
  blackHoleState,
  blackHoles,
  deflectionAngleArcsec,
  einsteinRadiusArcsec,
  evaporationTimeYears,
  getBlackHole,
  gravitationalTimeDilation,
  hawkingTemperatureK,
  iscoM,
  photonSphereM,
  RSUN_M,
  schwarzschildRadiusAU,
  schwarzschildRadiusKm,
  schwarzschildRadiusM,
  schwarzschildRadiusRsun,
  shadowAngularSizeMicroarcsec,
  shadowDiameterM,
  spaghettificationCheck,
  tidalAccelerationPerMeter,
} from "./black-holes";

/**
 * Acceptance tests for the Black Holes physics library.
 *
 * Reference facts (cited in lib/black-holes.ts header):
 *   • Sgr A*  — M ≈ 4.297×10⁶ M☉, r_s ≈ 1.27×10¹⁰ m, EHT shadow ≈ 51.8 µas.
 *   • M87*    — M ≈ 6.5×10⁹ M☉, r_s ≈ 1.9×10¹³ m, EHT ring ≈ 42 µas.
 *   • 10 M☉   — r_s ≈ 30 km.
 *   • Solar light deflection at the limb ≈ 1.75 arcsec (Eddington 1919).
 */

// ─────────────────────────── Catalog ────────────────────────────────────────

describe("BLACK_HOLES — cited catalog", () => {
  it("has the six catalogued objects in a stable order", () => {
    expect(BLACK_HOLE_IDS).toEqual([
      "sgr-a-star",
      "m87-star",
      "cygnus-x1",
      "gaia-bh1",
      "gw150914",
      "ton-618",
    ]);
    expect(blackHoles()).toHaveLength(6);
    expect(blackHoles().map((b) => b.id)).toEqual([...BLACK_HOLE_IDS]);
  });

  it("carries the cited masses, distances, and a source for every object", () => {
    for (const b of blackHoles()) {
      expect(b.name).toBeTruthy();
      expect(b.massMsun).toBeGreaterThan(0);
      expect(b.distanceLy).toBeGreaterThan(0);
      expect(b.note).toBeTruthy();
      expect(b.blurb).toBeTruthy();
      expect(b.source).toBeTruthy();
      expect(b.discoveryInstrument).toBeTruthy();
    }
    expect(BLACK_HOLES["sgr-a-star"].massMsun).toBeCloseTo(4.297e6, -3);
    expect(BLACK_HOLES["m87-star"].massMsun).toBe(6.5e9);
    expect(BLACK_HOLES["cygnus-x1"].massMsun).toBeCloseTo(21.2, 1);
    expect(BLACK_HOLES["gaia-bh1"].massMsun).toBeCloseTo(9.62, 2);
    expect(BLACK_HOLES["ton-618"].massMsun).toBe(4.0e10);
  });

  it("records type, spin, and observed shadow where applicable", () => {
    expect(BLACK_HOLES["sgr-a-star"].type).toBe("supermassive");
    expect(BLACK_HOLES["m87-star"].type).toBe("supermassive");
    expect(BLACK_HOLES["cygnus-x1"].type).toBe("stellar");
    expect(BLACK_HOLES["gaia-bh1"].type).toBe("stellar");
    expect(BLACK_HOLES["gw150914"].type).toBe("merger");
    expect(BLACK_HOLES["ton-618"].type).toBe("ultramassive");
    // M87* is known to spin; Sgr A* and Gaia BH1 left null (not invented).
    expect(BLACK_HOLES["m87-star"].spin).toBeCloseTo(0.9, 1);
    expect(BLACK_HOLES["sgr-a-star"].spin).toBeNull();
    expect(BLACK_HOLES["gaia-bh1"].spin).toBeNull();
    // Only the two EHT-imaged holes have observed shadows.
    expect(BLACK_HOLES["sgr-a-star"].observedShadowMicroarcsec).toBeCloseTo(51.8, 1);
    expect(BLACK_HOLES["m87-star"].observedShadowMicroarcsec).toBe(42);
    expect(BLACK_HOLES["cygnus-x1"].observedShadowMicroarcsec).toBeNull();
  });

  it("getBlackHole looks up by id and is null for unknowns", () => {
    expect(getBlackHole("m87-star")!.name).toBe("M87*");
    expect(getBlackHole("nope")).toBeNull();
    expect(getBlackHole("")).toBeNull();
  });
});

// ─────────────────────────── Schwarzschild radius ───────────────────────────

describe("schwarzschildRadiusM — event horizon", () => {
  it("matches the known radii (orders of magnitude)", () => {
    // Sgr A* ≈ 1.27×10¹⁰ m.
    expect(schwarzschildRadiusM(4.297e6)!).toBeGreaterThan(1.2e10);
    expect(schwarzschildRadiusM(4.297e6)!).toBeLessThan(1.35e10);
    // M87* ≈ 1.9×10¹³ m.
    expect(schwarzschildRadiusM(6.5e9)!).toBeGreaterThan(1.8e13);
    expect(schwarzschildRadiusM(6.5e9)!).toBeLessThan(2.0e13);
    // 10 M☉ ≈ 30 km.
    expect(schwarzschildRadiusM(10)! / 1000).toBeCloseTo(29.5, 0);
  });

  it("scales linearly with mass", () => {
    const r1 = schwarzschildRadiusM(1)!;
    expect(schwarzschildRadiusM(2)!).toBeCloseTo(2 * r1, 6);
    expect(schwarzschildRadiusM(1000)!).toBeCloseTo(1000 * r1, 0);
  });

  it("exposes km / AU / R☉ consistently", () => {
    const m = 4.297e6;
    const rm = schwarzschildRadiusM(m)!;
    expect(schwarzschildRadiusKm(m)!).toBeCloseTo(rm / 1000, 6);
    expect(schwarzschildRadiusAU(m)!).toBeCloseTo(rm / 1.495978707e11, 9);
    expect(schwarzschildRadiusRsun(m)!).toBeCloseTo(rm / RSUN_M, 6);
    // Sgr A* horizon ≈ 0.085 AU.
    expect(schwarzschildRadiusAU(m)!).toBeCloseTo(0.085, 2);
  });

  it("is null-safe on bad mass", () => {
    expect(schwarzschildRadiusM(0)).toBeNull();
    expect(schwarzschildRadiusM(-5)).toBeNull();
    expect(schwarzschildRadiusM(Number.NaN)).toBeNull();
    expect(schwarzschildRadiusKm(-1)).toBeNull();
    expect(schwarzschildRadiusAU(Number.NaN)).toBeNull();
    expect(schwarzschildRadiusRsun(0)).toBeNull();
  });
});

// ─────────────────────────── Photon sphere / ISCO ───────────────────────────

describe("photon sphere and ISCO (Schwarzschild)", () => {
  it("photon sphere = 1.5 r_s and ISCO = 3 r_s", () => {
    for (const m of [10, 4.297e6, 6.5e9]) {
      const rs = schwarzschildRadiusM(m)!;
      expect(photonSphereM(m)!).toBeCloseTo(1.5 * rs, 3);
      expect(iscoM(m)!).toBeCloseTo(3 * rs, 3);
    }
  });

  it("is null-safe", () => {
    expect(photonSphereM(0)).toBeNull();
    expect(iscoM(-1)).toBeNull();
    expect(iscoM(Number.NaN)).toBeNull();
  });
});

// ─────────────────────────── Shadow (headline validation) ───────────────────

describe("shadow angular size — reproduces the EHT images", () => {
  it("shadow diameter = √27 · r_s", () => {
    const m = 6.5e9;
    expect(shadowDiameterM(m)!).toBeCloseTo(Math.sqrt(27) * schwarzschildRadiusM(m)!, 3);
    expect(shadowDiameterM(0)).toBeNull();
  });

  it("reproduces Sgr A* ≈ 52 µas (EHT 51.8 ± 2.3 µas)", () => {
    const bh = BLACK_HOLES["sgr-a-star"];
    const uas = shadowAngularSizeMicroarcsec(bh.massMsun, bh.distanceLy, "ly")!;
    expect(uas).toBeGreaterThan(48);
    expect(uas).toBeLessThan(56);
    // Also from the parsec distance — same answer.
    const uasPc = shadowAngularSizeMicroarcsec(bh.massMsun, bh.distancePc!, "pc")!;
    expect(uasPc).toBeCloseTo(uas, 1);
  });

  it("reproduces M87* ≈ 42 µas (EHT ring)", () => {
    const bh = BLACK_HOLES["m87-star"];
    const uas = shadowAngularSizeMicroarcsec(bh.massMsun, bh.distanceLy, "ly")!;
    expect(uas).toBeGreaterThan(38);
    expect(uas).toBeLessThan(46);
    const uasMpc = shadowAngularSizeMicroarcsec(bh.massMsun, bh.distanceMpc!, "Mpc")!;
    expect(uasMpc).toBeCloseTo(uas, 1);
  });

  it("is null-safe on bad mass or distance", () => {
    expect(shadowAngularSizeMicroarcsec(0, 100)).toBeNull();
    expect(shadowAngularSizeMicroarcsec(10, 0)).toBeNull();
    expect(shadowAngularSizeMicroarcsec(10, -5)).toBeNull();
    expect(shadowAngularSizeMicroarcsec(Number.NaN, 100)).toBeNull();
  });
});

// ─────────────────────────── Time dilation ──────────────────────────────────

describe("gravitationalTimeDilation — the radius dial", () => {
  it("is ≈0.71 at r = 2 r_s", () => {
    expect(gravitationalTimeDilation(2)!).toBeCloseTo(0.7071, 3);
  });

  it("→ 0 approaching the horizon and → 1 far away", () => {
    expect(gravitationalTimeDilation(1.0001)!).toBeLessThan(0.02);
    expect(gravitationalTimeDilation(1e6)!).toBeGreaterThan(0.999);
    expect(gravitationalTimeDilation(1e12)!).toBeCloseTo(1, 6);
  });

  it("increases monotonically with radius", () => {
    let prev = 0;
    for (const r of [1.5, 2, 4, 10, 100]) {
      const f = gravitationalTimeDilation(r)!;
      expect(f).toBeGreaterThan(prev);
      prev = f;
    }
  });

  it("is null at or inside the horizon and on bad input", () => {
    expect(gravitationalTimeDilation(1)).toBeNull();
    expect(gravitationalTimeDilation(0.5)).toBeNull();
    expect(gravitationalTimeDilation(0)).toBeNull();
    expect(gravitationalTimeDilation(-3)).toBeNull();
    expect(gravitationalTimeDilation(Number.NaN)).toBeNull();
  });
});

// ─────────────────────────── Tides / spaghettification ──────────────────────

describe("tides and spaghettification", () => {
  it("tidal gradient falls as 1/r³", () => {
    const t1 = tidalAccelerationPerMeter(10, 1e5)!;
    const t2 = tidalAccelerationPerMeter(10, 2e5)!;
    expect(t1 / t2).toBeCloseTo(8, 3); // (2)³
    expect(tidalAccelerationPerMeter(0, 1e5)).toBeNull();
    expect(tidalAccelerationPerMeter(10, 0)).toBeNull();
  });

  it("stellar-mass hole: lethal tide BEFORE the horizon", () => {
    const s = spaghettificationCheck(10)!;
    expect(s.spaghettifiedBeforeHorizon).toBe(true);
    expect(s.humanStretchAtHorizonMs2).toBeGreaterThan(1e6);
  });

  it("supermassive hole: GENTLE tide at the horizon (crosses intact)", () => {
    const s = spaghettificationCheck(4.297e6)!;
    expect(s.spaghettifiedBeforeHorizon).toBe(false);
    // Sgr A*'s horizon tide is small; M87* even smaller (1/M²).
    const m87 = spaghettificationCheck(6.5e9)!;
    expect(m87.tidalAtHorizonPerMeter).toBeLessThan(s.tidalAtHorizonPerMeter);
  });

  it("is null-safe", () => {
    expect(spaghettificationCheck(0)).toBeNull();
    expect(spaghettificationCheck(-1)).toBeNull();
    expect(spaghettificationCheck(Number.NaN)).toBeNull();
  });
});

// ─────────────────────────── Hawking radiation ──────────────────────────────

describe("Hawking temperature and evaporation", () => {
  it("temperature is higher for smaller masses (∝ 1/M)", () => {
    const tSolar = hawkingTemperatureK(1)!;
    expect(hawkingTemperatureK(2)!).toBeCloseTo(tSolar / 2, 12);
    expect(hawkingTemperatureK(1e6)!).toBeLessThan(tSolar);
    // Solar-mass hole is ridiculously cold (~6×10⁻⁸ K).
    expect(tSolar).toBeGreaterThan(1e-8);
    expect(tSolar).toBeLessThan(1e-6);
  });

  it("evaporation time is astronomically long (~1e67 yr for 1 M☉)", () => {
    const t = evaporationTimeYears(1)!;
    expect(t).toBeGreaterThan(1e66);
    expect(t).toBeLessThan(1e68);
    // Scales as M³.
    expect(evaporationTimeYears(2)!).toBeCloseTo(8 * t, -60);
  });

  it("is null-safe", () => {
    expect(hawkingTemperatureK(0)).toBeNull();
    expect(hawkingTemperatureK(-1)).toBeNull();
    expect(evaporationTimeYears(Number.NaN)).toBeNull();
  });
});

// ─────────────────────────── Gravitational lensing ──────────────────────────

describe("gravitational lensing", () => {
  it("deflects the Sun's limb by ≈1.75 arcsec (classic GR test)", () => {
    const alpha = deflectionAngleArcsec(1, RSUN_M)!;
    expect(alpha).toBeGreaterThan(1.7);
    expect(alpha).toBeLessThan(1.8);
    expect(alpha).toBeCloseTo(1.75, 1);
  });

  it("deflection falls as 1/b and scales with mass", () => {
    expect(deflectionAngleArcsec(1, 2 * RSUN_M)!).toBeCloseTo(
      deflectionAngleArcsec(1, RSUN_M)! / 2,
      6
    );
    expect(deflectionAngleArcsec(2, RSUN_M)!).toBeCloseTo(
      2 * deflectionAngleArcsec(1, RSUN_M)!,
      6
    );
    expect(deflectionAngleArcsec(0, RSUN_M)).toBeNull();
    expect(deflectionAngleArcsec(1, 0)).toBeNull();
  });

  it("Einstein radius is positive and larger for larger lens mass", () => {
    const small = einsteinRadiusArcsec(1, 4000, 8000, 4000)!;
    const big = einsteinRadiusArcsec(1e6, 4000, 8000, 4000)!;
    expect(small).toBeGreaterThan(0);
    expect(big).toBeGreaterThan(small);
    // θ_E ∝ √M.
    expect(big / small).toBeCloseTo(Math.sqrt(1e6), 3);
  });

  it("is null-safe on bad mass or distances", () => {
    expect(einsteinRadiusArcsec(0, 1, 2, 1)).toBeNull();
    expect(einsteinRadiusArcsec(1, 0, 2, 1)).toBeNull();
    expect(einsteinRadiusArcsec(1, 1, 0, 1)).toBeNull();
    expect(einsteinRadiusArcsec(1, 1, 2, -1)).toBeNull();
    expect(einsteinRadiusArcsec(1, 1, 2, Number.NaN)).toBeNull();
  });
});

// ─────────────────────────── State bundle ───────────────────────────────────

describe("blackHoleState — one-call UI bundle", () => {
  it("bundles all derived geometry for a catalogued hole", () => {
    const s = blackHoleState("sgr-a-star")!;
    expect(s.name).toBe("Sagittarius A*");
    expect(s.type).toBe("supermassive");
    expect(s.schwarzschildRadiusM!).toBeGreaterThan(1.2e10);
    expect(s.schwarzschildRadiusKm!).toBeCloseTo(s.schwarzschildRadiusM! / 1000, 3);
    expect(s.photonSphereM!).toBeCloseTo(1.5 * s.schwarzschildRadiusM!, 3);
    expect(s.iscoM!).toBeCloseTo(3 * s.schwarzschildRadiusM!, 3);
    // Computed shadow matches the observed EHT value within a few µas.
    expect(s.shadowAngularSizeMicroarcsec!).toBeGreaterThan(48);
    expect(s.shadowAngularSizeMicroarcsec!).toBeLessThan(56);
    expect(s.observedShadowMicroarcsec).toBeCloseTo(51.8, 1);
    expect(Math.abs(s.shadowAngularSizeMicroarcsec! - 51.8)).toBeLessThan(4);
    expect(s.hawkingTemperatureK!).toBeGreaterThan(0);
    expect(s.evaporationTimeYears!).toBeGreaterThan(1e66);
    expect(s.spaghettification!.spaghettifiedBeforeHorizon).toBe(false);
  });

  it("computed vs observed shadow agree for M87* too", () => {
    const s = blackHoleState("m87-star")!;
    expect(Math.abs(s.shadowAngularSizeMicroarcsec! - 42)).toBeLessThan(4);
    expect(s.spaghettification!.spaghettifiedBeforeHorizon).toBe(false);
  });

  it("stellar-mass hole reports lethal horizon tide", () => {
    const s = blackHoleState("cygnus-x1")!;
    expect(s.spaghettification!.spaghettifiedBeforeHorizon).toBe(true);
    // No EHT image for a stellar hole.
    expect(s.observedShadowMicroarcsec).toBeNull();
  });

  it("is deterministic and null for an unknown id", () => {
    expect(blackHoleState("m87-star")).toEqual(blackHoleState("m87-star"));
    expect(blackHoleState("nope")).toBeNull();
  });
});
