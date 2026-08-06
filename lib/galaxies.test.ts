import { describe, it, expect } from "vitest";
import {
  GALAXIES,
  GALAXY_IDS,
  getGalaxy,
  galaxies,
  recessionVelocityKmS,
  hubbleDistanceMpc,
  redshiftToVelocityKmS,
  redshiftToDistanceMpc,
  mpcToMly,
  mlyToMpc,
  equatorialRedshiftToCartesianMpc,
  cosmicWebPointsFromRows,
  SCALE_LADDER,
  logSpanFraction,
  sizeRatio,
  SUPERCLUSTERS,
  LOCAL_GROUP,
  HUBBLE_TENSION,
  H0_KM_S_MPC,
  C_KM_S,
  LY_M,
  PC_M,
} from "./galaxies";

describe("shared constants re-exported from black-holes", () => {
  it("LY_M and PC_M have the expected values", () => {
    expect(LY_M).toBeCloseTo(9.4607e15, 10);
    expect(PC_M).toBeCloseTo(3.0857e16, 10);
  });
});

describe("Hubble's law round-trips", () => {
  it("H0 is the adopted mid value 70", () => {
    expect(H0_KM_S_MPC).toBe(70);
  });

  it("d -> v -> d recovers the distance", () => {
    for (const d of [1, 10, 100, 428.5, 1000]) {
      const v = recessionVelocityKmS(d);
      expect(v).not.toBeNull();
      const back = hubbleDistanceMpc(v as number);
      expect(back).toBeCloseTo(d, 9);
    }
  });

  it("v -> d -> v recovers the velocity", () => {
    for (const v of [70, 700, 7000, 30000]) {
      const d = hubbleDistanceMpc(v);
      const back = recessionVelocityKmS(d as number);
      expect(back).toBeCloseTo(v, 9);
    }
  });

  it("recessionVelocity uses v = H0 d", () => {
    expect(recessionVelocityKmS(100)).toBeCloseTo(7000, 6);
  });
});

describe("catalog: M31 is real and blueshifted", () => {
  it("Andromeda is ~2.54 Mly", () => {
    const m31 = getGalaxy("andromeda");
    expect(m31).not.toBeNull();
    expect(m31!.distanceMly).toBeGreaterThan(2.4);
    expect(m31!.distanceMly).toBeLessThan(2.7);
  });

  it("Andromeda has a negative (blueshift) redshift and negative recession velocity", () => {
    const m31 = getGalaxy("andromeda")!;
    expect(m31.redshift).not.toBeNull();
    expect(m31.redshift!).toBeLessThan(0);
    const v = redshiftToVelocityKmS(m31.redshift!);
    expect(v).not.toBeNull();
    expect(v!).toBeLessThan(0); // approaching, Local Group not receding
    expect(v!).toBeGreaterThan(-400); // ~ -300 km/s
    expect(v!).toBeLessThan(-200);
  });

  it("mentions the Milkomeda collision course", () => {
    expect(getGalaxy("andromeda")!.note.toLowerCase()).toContain("milkomeda");
  });
});

describe("redshift-to-distance sanity (low-z)", () => {
  it("a z=0.1 galaxy is 400+ Mpc and recedes ~30000 km/s", () => {
    const v = redshiftToVelocityKmS(0.1)!;
    expect(v).toBeCloseTo(C_KM_S * 0.1, 6);
    expect(v).toBeGreaterThan(29000);
    expect(v).toBeLessThan(31000);

    const d = redshiftToDistanceMpc(0.1)!;
    expect(d).toBeGreaterThan(400);
    // cz/H0 = 29979.2/70 ~ 428 Mpc
    expect(d).toBeCloseTo((C_KM_S * 0.1) / 70, 6);
  });

  it("z=0 maps to zero distance and zero velocity", () => {
    expect(redshiftToDistanceMpc(0)).toBe(0);
    expect(redshiftToVelocityKmS(0)).toBe(0);
  });
});

describe("unit conversions round-trip", () => {
  it("Mpc <-> Mly are inverses", () => {
    for (const mpc of [0.778, 16.4, 100]) {
      const mly = mpcToMly(mpc)!;
      expect(mlyToMpc(mly)).toBeCloseTo(mpc, 9);
    }
  });

  it("1 Mpc is ~3.26 Mly", () => {
    expect(mpcToMly(1)!).toBeCloseTo(3.2616, 2);
  });
});

describe("equatorialRedshiftToCartesianMpc", () => {
  it("z=0 maps to the origin", () => {
    const p = equatorialRedshiftToCartesianMpc(123, -45, 0)!;
    expect(p.x).toBeCloseTo(0, 9);
    expect(p.y).toBeCloseTo(0, 9);
    expect(p.z).toBeCloseTo(0, 9);
  });

  it("larger z gives a larger radius (same direction)", () => {
    const near = equatorialRedshiftToCartesianMpc(30, 20, 0.01)!;
    const far = equatorialRedshiftToCartesianMpc(30, 20, 0.05)!;
    const rNear = Math.hypot(near.x, near.y, near.z);
    const rFar = Math.hypot(far.x, far.y, far.z);
    expect(rFar).toBeGreaterThan(rNear);
  });

  it("radius equals the Hubble distance cz/H0", () => {
    const p = equatorialRedshiftToCartesianMpc(45, 10, 0.02)!;
    const r = Math.hypot(p.x, p.y, p.z);
    expect(r).toBeCloseTo((C_KM_S * 0.02) / 70, 6);
  });

  it("Dec=+90 (north celestial pole) points up the +z axis regardless of RA", () => {
    const p = equatorialRedshiftToCartesianMpc(217, 90, 0.03)!;
    const r = (C_KM_S * 0.03) / 70;
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(0, 6);
    expect(p.z).toBeCloseTo(r, 6);
  });

  it("RA=0, Dec=0 points along +x", () => {
    const p = equatorialRedshiftToCartesianMpc(0, 0, 0.03)!;
    const r = (C_KM_S * 0.03) / 70;
    expect(p.x).toBeCloseTo(r, 6);
    expect(p.y).toBeCloseTo(0, 6);
    expect(p.z).toBeCloseTo(0, 6);
  });

  it("RA=90, Dec=0 points along +y", () => {
    const p = equatorialRedshiftToCartesianMpc(90, 0, 0.03)!;
    const r = (C_KM_S * 0.03) / 70;
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(r, 6);
    expect(p.z).toBeCloseTo(0, 6);
  });

  it("is deterministic", () => {
    const a = equatorialRedshiftToCartesianMpc(150, -30, 0.04);
    const b = equatorialRedshiftToCartesianMpc(150, -30, 0.04);
    expect(a).toEqual(b);
  });
});

describe("cosmicWebPointsFromRows loader", () => {
  it("maps valid rows and skips invalid ones", () => {
    const rows = [
      { raDeg: 10, decDeg: 5, z: 0.02, name: "A" },
      { raDeg: null, decDeg: 5, z: 0.02, name: "bad-ra" },
      { raDeg: 10, decDeg: 5, z: -0.01, name: "blueshift" },
      { raDeg: 10, decDeg: 5, z: NaN, name: "nan" },
      { raDeg: 200, decDeg: -20, z: 0.05, name: "B" },
    ];
    const pts = cosmicWebPointsFromRows(rows);
    expect(pts).toHaveLength(2);
    expect(pts[0].name).toBe("A");
    expect(pts[1].name).toBe("B");
    expect(pts[0].distanceMpc).toBeGreaterThan(0);
  });

  it("returns [] for null / non-array input", () => {
    expect(cosmicWebPointsFromRows(null)).toEqual([]);
    expect(cosmicWebPointsFromRows(undefined)).toEqual([]);
  });
});

describe("SCALE_LADDER", () => {
  it("is strictly increasing in size", () => {
    for (let i = 1; i < SCALE_LADDER.length; i++) {
      expect(SCALE_LADDER[i].sizeM).toBeGreaterThan(SCALE_LADDER[i - 1].sizeM);
    }
  });

  it("spans from Earth to the observable universe", () => {
    expect(SCALE_LADDER[0].label).toBe("Earth");
    expect(SCALE_LADDER[SCALE_LADDER.length - 1].label).toBe(
      "Observable universe"
    );
  });

  it("Laniakea rung is ~520 Mly and observable universe ~93 Gly", () => {
    const lani = SCALE_LADDER.find((r) => r.label.includes("Laniakea"))!;
    expect(lani.sizeM / (1e6 * LY_M)).toBeCloseTo(520, 0);
    const obs = SCALE_LADDER[SCALE_LADDER.length - 1];
    expect(obs.sizeM / (1e9 * LY_M)).toBeCloseTo(93, 0);
  });
});

describe("catalog + superclusters present with sources", () => {
  it("has all nine+ galaxies, each with a source", () => {
    expect(GALAXY_IDS.length).toBeGreaterThanOrEqual(9);
    expect(galaxies()).toHaveLength(GALAXY_IDS.length);
    for (const g of galaxies()) {
      expect(g.source.length).toBeGreaterThan(5);
      expect(g.note.length).toBeGreaterThan(5);
      expect(g.hubbleType.length).toBeGreaterThan(0);
    }
  });

  it("includes the required marquee objects", () => {
    for (const id of [
      "milky-way",
      "andromeda",
      "triangulum",
      "lmc",
      "smc",
      "m87",
      "sombrero",
      "whirlpool",
      "ngc-1300",
      "centaurus-a",
    ] as const) {
      expect(GALAXIES[id]).toBeDefined();
    }
  });

  it("Milky Way has null distance/redshift (we are inside it)", () => {
    const mw = GALAXIES["milky-way"];
    expect(mw.distanceMly).toBeNull();
    expect(mw.redshift).toBeNull();
  });

  it("superclusters/structures present with sizes, notes and sources", () => {
    expect(SUPERCLUSTERS.length).toBeGreaterThanOrEqual(5);
    for (const s of SUPERCLUSTERS) {
      expect(s.sizeMly).toBeGreaterThan(0);
      expect(s.source.length).toBeGreaterThan(5);
      expect(s.note.length).toBeGreaterThan(5);
    }
  });

  it("Laniakea (~520 Mly), Sloan Great Wall and Boötes Void are catalogued", () => {
    const names = SUPERCLUSTERS.map((s) => s.name);
    const lani = SUPERCLUSTERS.find((s) => s.name.includes("Laniakea"))!;
    expect(lani.sizeMly).toBeCloseTo(520, 0);
    expect(names.some((n) => n.includes("Sloan"))).toBe(true);
    expect(names.some((n) => n.includes("Boötes"))).toBe(true);
  });

  it("Local Group summary is dominated by MW + M31, ~80 members, ~10 Mly", () => {
    expect(LOCAL_GROUP.dominantMembers).toContain("Milky Way");
    expect(LOCAL_GROUP.approxMemberCount).toBeGreaterThanOrEqual(50);
    expect(LOCAL_GROUP.diameterMly).toBeCloseTo(10, 0);
  });
});

describe("Hubble tension is documented", () => {
  it("records Planck ~67.4 and SH0ES ~73 around adopted 70", () => {
    expect(HUBBLE_TENSION.adopted).toBe(70);
    expect(HUBBLE_TENSION.planck).toBeCloseTo(67.4, 1);
    expect(HUBBLE_TENSION.sh0es).toBeCloseTo(73, 1);
    expect(HUBBLE_TENSION.note.toLowerCase()).toContain("tension");
  });
});

describe("null-safety / bad input never throws, returns null", () => {
  it("bad numeric inputs return null", () => {
    expect(recessionVelocityKmS(NaN)).toBeNull();
    expect(hubbleDistanceMpc(100, 0)).toBeNull();
    expect(redshiftToVelocityKmS(Infinity)).toBeNull();
    expect(redshiftToDistanceMpc(NaN)).toBeNull();
    expect(mpcToMly(NaN)).toBeNull();
    expect(mlyToMpc(Infinity)).toBeNull();
    expect(equatorialRedshiftToCartesianMpc(NaN, 0, 0.1)).toBeNull();
    expect(equatorialRedshiftToCartesianMpc(0, NaN, 0.1)).toBeNull();
    expect(equatorialRedshiftToCartesianMpc(0, 0, NaN)).toBeNull();
    expect(equatorialRedshiftToCartesianMpc(0, 0, -0.1)).toBeNull();
  });

  it("unknown galaxy id returns null", () => {
    expect(getGalaxy("no-such-galaxy")).toBeNull();
  });

  it("functions are deterministic", () => {
    expect(recessionVelocityKmS(42)).toBe(recessionVelocityKmS(42));
    expect(redshiftToDistanceMpc(0.07)).toBe(redshiftToDistanceMpc(0.07));
  });
});

describe("logSpanFraction (the Scale Ladder log ruler)", () => {
  const first = SCALE_LADDER[0].sizeM;
  const last = SCALE_LADDER[SCALE_LADDER.length - 1].sizeM;

  it("pins the ends of the span to 0 and 1", () => {
    expect(logSpanFraction(first, first, last)).toBeCloseTo(0, 12);
    expect(logSpanFraction(last, first, last)).toBeCloseTo(1, 12);
  });

  it("places the geometric mean at the halfway mark", () => {
    // On a log axis the midpoint is the geometric mean, not the arithmetic one.
    const geometric = Math.sqrt(first * last);
    expect(logSpanFraction(geometric, first, last)).toBeCloseTo(0.5, 12);
    // The arithmetic mean is half the largest rung, which on a ~20-decade log
    // axis is only log10(2) ≈ 0.3 of a decade in from the far end.
    const arithmetic = (first + last) / 2;
    expect(logSpanFraction(arithmetic, first, last)!).toBeGreaterThan(0.98);
  });

  it("puts one decade at exactly one tenth of a ten-decade span", () => {
    expect(logSpanFraction(1e1, 1e0, 1e10)).toBeCloseTo(0.1, 12);
    expect(logSpanFraction(1e5, 1e0, 1e10)).toBeCloseTo(0.5, 12);
  });

  it("increases monotonically across every rung of the real ladder", () => {
    const fractions = SCALE_LADDER.map((r) => logSpanFraction(r.sizeM, first, last));
    for (const f of fractions) {
      expect(f).not.toBeNull();
      expect(f!).toBeGreaterThanOrEqual(0);
      expect(f!).toBeLessThanOrEqual(1);
    }
    for (let i = 1; i < fractions.length; i++) {
      expect(fractions[i]!).toBeGreaterThan(fractions[i - 1]!);
    }
  });

  it("clamps a size outside the span onto the ruler", () => {
    expect(logSpanFraction(1e-3, 1e0, 1e10)).toBe(0);
    expect(logSpanFraction(1e30, 1e0, 1e10)).toBe(1);
  });

  it("returns null for bad input instead of NaN or Infinity", () => {
    expect(logSpanFraction(NaN, 1, 10)).toBeNull();
    expect(logSpanFraction(1, NaN, 10)).toBeNull();
    expect(logSpanFraction(1, 1, NaN)).toBeNull();
    expect(logSpanFraction(0, 1, 10)).toBeNull();
    expect(logSpanFraction(-5, 1, 10)).toBeNull();
    expect(logSpanFraction(1, 0, 10)).toBeNull();
    expect(logSpanFraction(5, 10, 10)).toBeNull(); // degenerate span
  });
});

describe("sizeRatio (how big the jump between rungs really is)", () => {
  it("reports a plain ratio", () => {
    expect(sizeRatio(1e6, 1e3)).toBe(1000);
    expect(sizeRatio(5, 2)).toBe(2.5);
  });

  it("matches the published jump from the Milky Way to the Local Group", () => {
    // Milky Way disk ~100,000 ly across; Local Group ~10 million ly across.
    const mw = SCALE_LADDER.find((r) => r.label === "Milky Way")!;
    const lg = SCALE_LADDER.find((r) => r.label === "Local Group")!;
    const ratio = sizeRatio(lg.sizeM, mw.sizeM)!;
    expect(ratio).toBeCloseTo(100, 6);
  });

  it("returns null for bad input or a non-positive denominator", () => {
    expect(sizeRatio(NaN, 2)).toBeNull();
    expect(sizeRatio(2, NaN)).toBeNull();
    expect(sizeRatio(2, 0)).toBeNull();
    expect(sizeRatio(2, -1)).toBeNull();
  });
});
