import { describe, expect, it } from "vitest";
import {
  NEUTRON_STARS,
  NEUTRON_STAR_IDS,
  NS_CANONICAL_MASS_MSUN,
  NS_CANONICAL_RADIUS_KM,
  characteristicAgeYears,
  compactness,
  densityComparison,
  densityKgM3,
  equatorialVelocityFractionC,
  escapeVelocityFractionC,
  getNeutronStar,
  gravitationalRedshift,
  magneticFieldComparison,
  neutronStarState,
  neutronStars,
  spinDownLuminosityW,
  spinFrequencyHz,
  surfaceGravityEarthG,
  surfaceGravityMs2,
  surfaceMagneticFieldGauss,
  visibleSurfaceFraction,
} from "./neutron-stars";

/**
 * Acceptance tests for the Neutron Stars physics library.
 *
 * Reference facts (cited in lib/neutron-stars.ts header, ATNF + discovery papers):
 *   • Crab  P = 33.6 ms → ν ≈ 29.8 Hz; Vela 89.3 ms → ≈11.2 Hz.
 *   • Fastest (716 Hz) → P ≈ 1.3959 ms; B1919+21 (1.3373 s) → ≈0.748 Hz.
 *   • Canonical 1.4 M☉ / 12 km → nuclear density ~4×10¹⁷ kg/m³.
 *   • Crab characteristic age P/(2Ṗ) ≈ 1250 yr vs true ≈970 yr (SN 1054).
 */

// ─────────────────────────── Catalog ────────────────────────────────────────

describe("NEUTRON_STARS — cited catalog", () => {
  it("has the nine catalogued objects in a stable order", () => {
    expect(NEUTRON_STAR_IDS).toEqual([
      "psr-b1919+21",
      "crab",
      "vela",
      "psr-j0740+6620",
      "psr-b1257+12",
      "psr-j0737-3039a",
      "psr-j1748-2446ad",
      "sgr-1806-20",
      "psr-b1937+21",
    ]);
    expect(neutronStars()).toHaveLength(9);
    expect(neutronStars().map((n) => n.id)).toEqual([...NEUTRON_STAR_IDS]);
  });

  it("carries a cited period, distance, story and source for every object", () => {
    for (const n of neutronStars()) {
      expect(n.name).toBeTruthy();
      expect(n.periodS).toBeGreaterThan(0);
      expect(n.distanceKpc).toBeGreaterThan(0);
      expect(n.distanceLy).toBeGreaterThan(0);
      expect(n.massMsun).toBeGreaterThan(0);
      expect(n.radiusKm).toBeGreaterThan(0);
      expect(n.blurb).toBeTruthy();
      expect(n.note).toBeTruthy();
      expect(n.source).toBeTruthy();
      expect(n.discoverer).toBeTruthy();
    }
  });

  it("flags assumed vs measured mass/radius honestly", () => {
    // J0740 is the one object with both a measured mass and a NICER radius.
    const j0740 = getNeutronStar("psr-j0740+6620")!;
    expect(j0740.massAssumed).toBe(false);
    expect(j0740.radiusAssumed).toBe(false);
    expect(j0740.massMsun).toBeCloseTo(2.08, 2);
    expect(j0740.radiusKm).toBeCloseTo(12.4, 1);

    // Objects using the fiducial carry the canonical values + assumed flags.
    const crab = getNeutronStar("crab")!;
    expect(crab.massAssumed).toBe(true);
    expect(crab.radiusAssumed).toBe(true);
    expect(crab.massMsun).toBe(NS_CANONICAL_MASS_MSUN);
    expect(crab.radiusKm).toBe(NS_CANONICAL_RADIUS_KM);
  });

  it("classifies types correctly (magnetar, MSPs, binary, pulsars)", () => {
    expect(getNeutronStar("sgr-1806-20")!.type).toBe("magnetar");
    expect(getNeutronStar("psr-j0737-3039a")!.type).toBe("binary-pulsar");
    expect(getNeutronStar("crab")!.type).toBe("pulsar");
    expect(getNeutronStar("psr-j1748-2446ad")!.type).toBe("millisecond-pulsar");
  });

  it("magnetar B > 1e14 G; all millisecond pulsars have P < 10 ms", () => {
    expect(getNeutronStar("sgr-1806-20")!.magneticFieldGauss).toBeGreaterThan(
      1e14
    );
    for (const n of neutronStars()) {
      if (n.type === "millisecond-pulsar") {
        expect(n.periodS).toBeLessThan(0.01);
      }
    }
  });

  it("Joy Division / Unknown Pleasures fact lives on the first pulsar", () => {
    const first = getNeutronStar("psr-b1919+21")!;
    expect(first.discoveryYear).toBe(1967);
    expect(first.note.toLowerCase()).toContain("unknown pleasures");
  });

  it("getNeutronStar returns null for unknown ids", () => {
    expect(getNeutronStar("nope")).toBeNull();
    expect(getNeutronStar("")).toBeNull();
  });
});

// ─────────────────────────── Spin frequency ─────────────────────────────────

describe("spinFrequencyHz", () => {
  it("Crab 33.6 ms → ~29.8 Hz", () => {
    expect(spinFrequencyHz(0.0336)).toBeCloseTo(29.76, 1);
  });

  it("Vela 89.3 ms → ~11.2 Hz", () => {
    expect(spinFrequencyHz(0.0893)).toBeCloseTo(11.2, 1);
  });

  it("fastest 716 Hz ↔ P = 1.3959 ms round-trips", () => {
    const f = spinFrequencyHz(0.0013959)!;
    expect(f).toBeCloseTo(716.4, 0);
    expect(1 / f).toBeCloseTo(0.0013959, 6);
  });

  it("B1919+21 1.3373 s → ~0.748 Hz", () => {
    expect(spinFrequencyHz(1.3373)!).toBeCloseTo(0.748, 3);
  });

  it("returns null on bad input", () => {
    expect(spinFrequencyHz(0)).toBeNull();
    expect(spinFrequencyHz(-1)).toBeNull();
    expect(spinFrequencyHz(NaN)).toBeNull();
  });
});

// ─────────────────────────── Bulk properties ────────────────────────────────

describe("densityKgM3", () => {
  it("canonical 1.4 M☉ / 12 km is nuclear, ~2-6×10¹⁷ kg/m³", () => {
    const rho = densityKgM3(1.4, 12)!;
    expect(rho).toBeGreaterThan(2e17);
    expect(rho).toBeLessThan(6e17);
    expect(rho).toBeCloseTo(3.85e17, -16); // ~3.85×10¹⁷
  });

  it("returns null on bad input", () => {
    expect(densityKgM3(0, 12)).toBeNull();
    expect(densityKgM3(1.4, 0)).toBeNull();
    expect(densityKgM3(1.4, -12)).toBeNull();
  });
});

describe("densityComparison", () => {
  it("produces a teaspoon/mountain string for a real density", () => {
    const s = densityComparison(densityKgM3(1.4, 12)!)!;
    expect(s.toLowerCase()).toContain("teaspoon");
    expect(s).toContain("cubic");
  });

  it("returns null on bad input", () => {
    expect(densityComparison(0)).toBeNull();
    expect(densityComparison(-1)).toBeNull();
  });
});

describe("surfaceGravityMs2", () => {
  it("canonical 1.4 M☉ / 12 km ~1-2×10¹² m/s²", () => {
    const g = surfaceGravityMs2(1.4, 12)!;
    expect(g).toBeGreaterThan(1e12);
    expect(g).toBeLessThan(2e12);
  });

  it("Earth-g is ~1-2×10¹¹ g", () => {
    const gg = surfaceGravityEarthG(1.4, 12)!;
    expect(gg).toBeGreaterThan(1e11);
    expect(gg).toBeLessThan(2e11);
  });

  it("returns null on bad input", () => {
    expect(surfaceGravityMs2(-1, 12)).toBeNull();
    expect(surfaceGravityEarthG(1.4, 0)).toBeNull();
  });
});

describe("escapeVelocityFractionC", () => {
  it("canonical 1.4 M☉ / 12 km is in (0.3, 0.85) and STRICTLY < 1", () => {
    const v = escapeVelocityFractionC(1.4, 12)!;
    expect(v).toBeGreaterThan(0.3);
    expect(v).toBeLessThan(0.85);
    expect(v).toBeLessThan(1);
    expect(v).toBeCloseTo(0.587, 2);
  });

  it("stays < 1 for the whole catalog", () => {
    for (const n of neutronStars()) {
      const v = escapeVelocityFractionC(n.massMsun, n.radiusKm);
      expect(v).not.toBeNull();
      expect(v!).toBeLessThan(1);
    }
  });

  it("returns null for unphysically compact (would-be horizon) input", () => {
    // 1.4 M☉ inside its Schwarzschild radius (~4 km) ⇒ v_esc ≥ c ⇒ null.
    expect(escapeVelocityFractionC(1.4, 2)).toBeNull();
    expect(escapeVelocityFractionC(0, 12)).toBeNull();
  });
});

describe("compactness", () => {
  it("canonical 1.4 M☉ / 12 km is in (0.1, 0.35)", () => {
    const x = compactness(1.4, 12)!;
    expect(x).toBeGreaterThan(0.1);
    expect(x).toBeLessThan(0.35);
    expect(x).toBeCloseTo(0.172, 2);
  });

  it("returns null at/inside a would-be horizon (compactness ≥ ½)", () => {
    expect(compactness(1.4, 1)).toBeNull();
  });
});

describe("gravitationalRedshift", () => {
  it("canonical 1.4 M☉ / 12 km ~0.23", () => {
    expect(gravitationalRedshift(1.4, 12)!).toBeCloseTo(0.235, 2);
  });

  it("returns null for a would-be horizon", () => {
    expect(gravitationalRedshift(1.4, 2)).toBeNull();
  });
});

describe("visibleSurfaceFraction", () => {
  it("you see MORE than half — ~0.7-0.8 for a canonical star", () => {
    const f = visibleSurfaceFraction(1.4, 12)!;
    expect(f).toBeGreaterThan(0.5);
    expect(f).toBeGreaterThan(0.7);
    expect(f).toBeLessThan(0.85);
    expect(f).toBeCloseTo(0.762, 2);
  });

  it("is capped at 1.0 and returns null past a would-be horizon", () => {
    expect(visibleSurfaceFraction(1.4, 2)).toBeNull();
  });
});

// ─────────────────────────── Rotation ───────────────────────────────────────

describe("equatorialVelocityFractionC", () => {
  it("fastest MSP at its documented ~16 km radius is ~0.2-0.25 c, < 1", () => {
    // Hessels et al. constrain R < 16 km; the widely-quoted ~24% c uses that bound.
    const v = equatorialVelocityFractionC(0.0013959, 16)!;
    expect(v).toBeGreaterThan(0.2);
    expect(v).toBeLessThan(0.25);
    expect(v).toBeLessThan(1);
  });

  it("at the canonical 12 km radius the same pulsar is ~0.18 c", () => {
    expect(equatorialVelocityFractionC(0.0013959, 12)!).toBeCloseTo(0.18, 2);
  });

  it("returns null on bad input", () => {
    expect(equatorialVelocityFractionC(0, 12)).toBeNull();
    expect(equatorialVelocityFractionC(0.001, -1)).toBeNull();
  });
});

// ─────────────────────────── Spin-down ──────────────────────────────────────

describe("characteristicAgeYears", () => {
  it("Crab P/(2Ṗ) is ~1200-1300 yr (order-of-magnitude near true ~970 yr)", () => {
    const tau = characteristicAgeYears(0.0336, 4.2e-13)!;
    expect(tau).toBeGreaterThan(1200);
    expect(tau).toBeLessThan(1300);
    // Honest discrepancy: overestimates the true SN 1054 age of ~970 yr.
    expect(tau).toBeGreaterThan(970);
  });

  it("returns null on bad input", () => {
    expect(characteristicAgeYears(0, 4.2e-13)).toBeNull();
    expect(characteristicAgeYears(0.0336, 0)).toBeNull();
    expect(characteristicAgeYears(0.0336, -1)).toBeNull();
  });
});

describe("spinDownLuminosityW", () => {
  it("Crab is ~4-5×10³¹ W (the power lighting the Crab Nebula)", () => {
    const e = spinDownLuminosityW(0.0336, 4.2e-13)!;
    expect(e).toBeGreaterThan(4e31);
    expect(e).toBeLessThan(5e31);
  });

  it("accepts a custom moment of inertia and is proportional to it", () => {
    const a = spinDownLuminosityW(0.0336, 4.2e-13, 1e38)!;
    const b = spinDownLuminosityW(0.0336, 4.2e-13, 2e38)!;
    expect(b / a).toBeCloseTo(2, 5);
  });

  it("returns null on bad input", () => {
    expect(spinDownLuminosityW(0, 4.2e-13)).toBeNull();
    expect(spinDownLuminosityW(0.0336, -1)).toBeNull();
    expect(spinDownLuminosityW(0.0336, 4.2e-13, 0)).toBeNull();
  });
});

describe("surfaceMagneticFieldGauss (order-of-magnitude estimate)", () => {
  it("Crab P/Ṗ estimate is order ~10¹² G", () => {
    const b = surfaceMagneticFieldGauss(0.0336, 4.2e-13)!;
    expect(b).toBeGreaterThan(1e12);
    expect(b).toBeLessThan(1e13);
  });

  it("returns null on bad input", () => {
    expect(surfaceMagneticFieldGauss(0, 1e-13)).toBeNull();
    expect(surfaceMagneticFieldGauss(0.03, 0)).toBeNull();
  });
});

// ─────────────────────────── Comparison strings ─────────────────────────────

describe("magneticFieldComparison", () => {
  it("names the magnetar regime for ~10¹⁵ G", () => {
    expect(magneticFieldComparison(2e15)!.toLowerCase()).toContain("magnetar");
  });

  it("names the pulsar regime for ~10¹² G", () => {
    expect(magneticFieldComparison(3.8e12)!.toLowerCase()).toContain("pulsar");
  });

  it("returns null on bad input", () => {
    expect(magneticFieldComparison(0)).toBeNull();
    expect(magneticFieldComparison(-1)).toBeNull();
  });
});

// ─────────────────────────── State bundle ───────────────────────────────────

describe("neutronStarState", () => {
  it("bundles derived physics for the Crab", () => {
    const s = neutronStarState("crab")!;
    expect(s.id).toBe("crab");
    expect(s.spinFrequencyHz!).toBeCloseTo(29.76, 1);
    expect(s.densityKgM3!).toBeGreaterThan(2e17);
    expect(s.escapeVelocityFractionC!).toBeLessThan(1);
    expect(s.compactness!).toBeGreaterThan(0.1);
    expect(s.characteristicAgeYears!).toBeGreaterThan(1200);
    expect(s.spinDownLuminosityW!).toBeGreaterThan(4e31);
    expect(s.magneticFieldComparison).toBeTruthy();
  });

  it("J0740 uses the measured 2.08 M☉ and is not flagged assumed", () => {
    const s = neutronStarState("psr-j0740+6620")!;
    expect(s.massMsun).toBeCloseTo(2.08, 2);
    expect(s.massAssumed).toBe(false);
    expect(s.radiusAssumed).toBe(false);
  });

  it("nulls the Ṗ-derived fields when the period derivative is unknown", () => {
    // The fastest pulsar has no reliable Ṗ ⇒ age/spin-down/field are null.
    const s = neutronStarState("psr-j1748-2446ad")!;
    expect(s.characteristicAgeYears).toBeNull();
    expect(s.spinDownLuminosityW).toBeNull();
    expect(s.magneticFieldGauss).toBeNull();
    expect(s.magneticFieldComparison).toBeNull();
    // But rotational quantities still resolve.
    expect(s.spinFrequencyHz!).toBeCloseTo(716.4, 0);
  });

  it("returns null for an unknown id", () => {
    expect(neutronStarState("nope")).toBeNull();
  });

  it("is deterministic (same id ⇒ identical bundle)", () => {
    expect(neutronStarState("vela")).toEqual(neutronStarState("vela"));
  });

  it("every catalogued object produces a finite core bundle", () => {
    for (const id of NEUTRON_STAR_IDS) {
      const s = neutronStarState(id)!;
      expect(Number.isFinite(s.densityKgM3!)).toBe(true);
      expect(Number.isFinite(s.surfaceGravityMs2!)).toBe(true);
      expect(s.escapeVelocityFractionC!).toBeLessThan(1);
      expect(Number.isFinite(s.spinFrequencyHz!)).toBe(true);
    }
  });
});
