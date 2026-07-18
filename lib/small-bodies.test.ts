import { describe, expect, it } from "vitest";
import {
  AU_KM,
  COMET_ACTIVITY_ONSET_AU,
  LUNAR_DISTANCE_AU,
  PHA_MOID_MAX_AU,
  type SmallBodyElements,
  type SmallBodyInput,
  aphelionAU,
  auToKm,
  auToLunarDistances,
  cometActivity,
  cometClass,
  compressRadius,
  heliocentricDistanceAU,
  heliocentricPosition,
  isBound,
  isInterstellar,
  isPotentiallyHazardous,
  lunarDistancesToAU,
  moidNote,
  neaClass,
  orbitPath,
  orbitRegime,
  orbitalPeriodYears,
  orreryLayout,
  perihelionAU,
  semiMajorAxisAU,
  smallBodyState,
  solveKepler,
  solveKeplerHyperbolic,
  tailDirection,
  tisserandParameter,
} from "./small-bodies";

/**
 * Physics acceptance tests for the comets & near-Earth asteroids layer.
 *
 * Reference values and their sources (all JPL Small-Body Database unless noted):
 *   • 1P/Halley — a ≈ 17.834 AU, e ≈ 0.967, i ≈ 162.26° (retrograde),
 *     Ω ≈ 58.42°, ω ≈ 111.33°, T_p (1986) ≈ JD 2446470.95. ⇒ q ≈ 0.586 AU,
 *     Q ≈ 35.08 AU, P ≈ 75.3 yr, T_J ≈ −0.6.
 *   • 2P/Encke — a ≈ 2.215 AU, e ≈ 0.848, i ≈ 11.78° ⇒ P ≈ 3.30 yr, T_J ≈ 3.03.
 *   • 1I/'Oumuamua — e ≈ 1.20, q ≈ 0.2559 AU, i ≈ 122.7° (hyperbolic/interstellar).
 *   • 2I/Borisov — e ≈ 3.357, q ≈ 2.007 AU (strongly hyperbolic).
 *   • NEO groups (Apollo/Aten/Amor/Atira) & PHA threshold: NASA/JPL CNEOS.
 *   • Tisserand & comet classes: Levison (1996); a_J = 5.204 AU.
 *   • 1 LD = 0.002569 AU; 1 AU = 149,597,870.7 km.
 */

const DAY_MS = 86_400_000;
const YEAR_MS = 365.25 * DAY_MS;

// ── Representative element sets (from JPL SBDB) ──────────────────────────────

/** 1P/Halley — bound, retrograde, e ≈ 0.967. */
const HALLEY: SmallBodyElements = {
  a: 17.834,
  e: 0.96714,
  i: 162.26,
  om: 58.42,
  w: 111.33,
  q: 0.586,
  tp: 2446470.95, // 1986 perihelion (JD)
  epoch: 2449400.5,
};

/** 2P/Encke — Jupiter-family, e ≈ 0.848, P ≈ 3.3 yr. */
const ENCKE: SmallBodyElements = {
  a: 2.2155,
  e: 0.8483,
  i: 11.78,
  om: 334.57,
  w: 186.55,
  tp: 2457783.6, // 2017 perihelion (JD)
};

/** 1I/'Oumuamua — interstellar, hyperbolic e ≈ 1.20. */
const OUMUAMUA: SmallBodyElements = {
  a: -1.2723, // negative ⇒ hyperbolic (JPL convention)
  e: 1.2011,
  i: 122.74,
  om: 24.6,
  w: 241.8,
  q: 0.25534,
  tp: 2458006.0, // 2017-09-09 perihelion (JD)
};

/** 2I/Borisov — interstellar, strongly hyperbolic e ≈ 3.36. */
const BORISOV: SmallBodyElements = {
  a: -0.8514,
  e: 3.3566,
  i: 44.05,
  om: 308.15,
  w: 209.12,
  q: 2.0067,
  tp: 2458826.0, // 2019-12-08 perihelion (JD)
};

/** (1862) Apollo — the Apollo-class archetype (a>1, q<1.017). */
const APOLLO: SmallBodyElements = { a: 1.4701, e: 0.5599, i: 6.35, om: 35.7, w: 286.0 };
/** (2062) Aten — the Aten-class archetype (a<1, Q>0.983). */
const ATEN: SmallBodyElements = { a: 0.9668, e: 0.1826, i: 18.93, om: 108.6, w: 148.0 };
/** (1221) Amor — the Amor-class archetype (a>1, 1.017<q<1.3). */
const AMOR: SmallBodyElements = { a: 1.9198, e: 0.4358, i: 11.88, om: 171.3, w: 26.6 };
/** (163693) Atira — the Atira/IEO archetype (Q<0.983, entirely interior). */
const ATIRA: SmallBodyElements = { a: 0.7411, e: 0.3222, i: 25.62, om: 103.9, w: 252.8 };

// ─────────────────────────── Halley — bound comet ───────────────────────────

describe("1P/Halley — bound elliptical comet", () => {
  it("period ≈ 75–76 yr (Kepler's 3rd law)", () => {
    const P = orbitalPeriodYears(HALLEY)!;
    expect(P).toBeGreaterThan(75);
    expect(P).toBeLessThan(76);
  });

  it("perihelion ≈ 0.586 AU, aphelion ≈ 35 AU", () => {
    expect(perihelionAU(HALLEY)!).toBeCloseTo(0.586, 2);
    expect(aphelionAU(HALLEY)!).toBeCloseTo(35.08, 0); // a(1+e) ≈ 35.08
  });

  it("is bound (e < 1), not interstellar", () => {
    expect(isBound(HALLEY.e)).toBe(true);
    expect(isInterstellar(HALLEY.e)).toBe(false);
    expect(orbitRegime(HALLEY.e)).toBe("elliptical");
  });

  it("stays inside its perihelion/aphelion band over a full period", () => {
    const peri = perihelionAU(HALLEY)!;
    const aph = aphelionAU(HALLEY)!;
    for (let y = 0; y <= 80; y += 1) {
      const d = new Date(Date.UTC(1986, 1, 9) + y * YEAR_MS);
      const r = heliocentricDistanceAU(HALLEY, d)!;
      expect(r).toBeGreaterThanOrEqual(peri - 1e-6);
      expect(r).toBeLessThanOrEqual(aph + 1e-6);
    }
  });

  it("is near perihelion at its 1986 perihelion date", () => {
    const perihelionDate = new Date((2446470.95 - 2440587.5) * DAY_MS);
    const r = heliocentricDistanceAU(HALLEY, perihelionDate)!;
    expect(r).toBeCloseTo(perihelionAU(HALLEY)!, 2);
  });
});

// ────────────────────── 'Oumuamua — interstellar/hyperbolic ──────────────────

describe("1I/'Oumuamua — interstellar hyperbolic flyby", () => {
  it("is interstellar (e > 1) with no aphelion and no period", () => {
    expect(isInterstellar(OUMUAMUA.e)).toBe(true);
    expect(isBound(OUMUAMUA.e)).toBe(false);
    expect(orbitRegime(OUMUAMUA.e)).toBe("hyperbolic");
    expect(aphelionAU(OUMUAMUA)).toBeNull();
    expect(orbitalPeriodYears(OUMUAMUA)).toBeNull();
    expect(tisserandParameter(OUMUAMUA)).toBeNull(); // undefined for e ≥ 1
  });

  it("perihelion is still defined (q ≈ 0.255 AU) and a is negative", () => {
    expect(perihelionAU(OUMUAMUA)!).toBeCloseTo(0.2553, 2);
    expect(semiMajorAxisAU(OUMUAMUA)!).toBeLessThan(0);
  });

  it("has a finite hyperbolic position, at perihelion near t_p", () => {
    const perihelionDate = new Date((2458006.0 - 2440587.5) * DAY_MS);
    const pos = heliocentricPosition(OUMUAMUA, perihelionDate)!;
    expect(pos).not.toBeNull();
    expect(Number.isFinite(pos.distanceAU)).toBe(true);
    expect(pos.distanceAU).toBeCloseTo(perihelionAU(OUMUAMUA)!, 2);
  });

  it("recedes monotonically and without bound after perihelion (open orbit)", () => {
    const tp = 2458006.0;
    const rAt = (daysAfter: number) =>
      heliocentricDistanceAU(
        OUMUAMUA,
        new Date((tp + daysAfter - 2440587.5) * DAY_MS)
      )!;
    const r100 = rAt(100);
    const r500 = rAt(500);
    const r2000 = rAt(2000);
    expect(r100).toBeLessThan(r500);
    expect(r500).toBeLessThan(r2000);
    expect(r2000).toBeGreaterThan(10); // long gone from the inner system
  });
});

describe("2I/Borisov — strongly hyperbolic (e ≈ 3.36)", () => {
  it("classifies as interstellar and solves at high eccentricity", () => {
    expect(isInterstellar(BORISOV.e)).toBe(true);
    expect(cometClass(BORISOV)!.class).toBe("interstellar");
    const perihelionDate = new Date((2458826.0 - 2440587.5) * DAY_MS);
    const pos = heliocentricPosition(BORISOV, perihelionDate)!;
    expect(pos.distanceAU).toBeCloseTo(perihelionAU(BORISOV)!, 2);
  });
});

// ─────────────────────────── NEO group classification ───────────────────────

describe("near-Earth object classes (CNEOS a/q/Q definitions)", () => {
  it("classifies Apollo / Aten / Amor / Atira archetypes", () => {
    expect(neaClass(APOLLO)).toBe("Apollo"); // a>1, q<1.017
    expect(neaClass(ATEN)).toBe("Aten"); // a<1, Q>0.983
    expect(neaClass(AMOR)).toBe("Amor"); // a>1, 1.017<q<1.3
    expect(neaClass(ATIRA)).toBe("Atira"); // Q<0.983 interior
  });

  it("checks the defining a/q/Q inequalities for each class", () => {
    // Apollo: a≥1 and q≤1.017
    expect(semiMajorAxisAU(APOLLO)!).toBeGreaterThan(1);
    expect(perihelionAU(APOLLO)!).toBeLessThanOrEqual(1.017);
    // Aten: a<1 and Q≥0.983
    expect(semiMajorAxisAU(ATEN)!).toBeLessThan(1);
    expect(aphelionAU(ATEN)!).toBeGreaterThanOrEqual(0.983);
    // Amor: a>1 and 1.017<q<1.3
    expect(perihelionAU(AMOR)!).toBeGreaterThan(1.017);
    expect(perihelionAU(AMOR)!).toBeLessThan(1.3);
    // Atira: Q<0.983
    expect(aphelionAU(ATIRA)!).toBeLessThan(0.983);
  });

  it("returns null for a non-near-Earth body (q ≥ 1.3 AU)", () => {
    const beltAsteroid: SmallBodyElements = { a: 2.77, e: 0.08, i: 10.6 };
    expect(perihelionAU(beltAsteroid)!).toBeGreaterThan(1.3);
    expect(neaClass(beltAsteroid)).toBeNull();
  });

  it("returns null for an unbound body (interstellar is not an NEA)", () => {
    expect(neaClass(OUMUAMUA)).toBeNull();
  });
});

// ─────────────────────────── Tisserand + comet classes ──────────────────────

describe("Tisserand parameter & comet dynamical classes", () => {
  it("Encke ⇒ Jupiter-family (P ≈ 3.3 yr, T_J ≈ 3.0)", () => {
    expect(orbitalPeriodYears(ENCKE)!).toBeCloseTo(3.3, 1);
    expect(tisserandParameter(ENCKE)!).toBeGreaterThan(2.9);
    expect(tisserandParameter(ENCKE)!).toBeLessThan(3.15);
    expect(cometClass(ENCKE)!.class).toBe("jupiter-family");
  });

  it("Halley ⇒ Halley-type (P ≈ 75 yr, T_J ≈ −0.6)", () => {
    expect(tisserandParameter(HALLEY)!).toBeCloseTo(-0.6, 1); // retrograde ⇒ negative
    expect(cometClass(HALLEY)!.class).toBe("halley-type");
  });

  it("a P>200 yr comet ⇒ long-period", () => {
    const lp: SmallBodyElements = { a: 100, e: 0.99, i: 60 }; // P = 1000 yr
    expect(orbitalPeriodYears(lp)!).toBeGreaterThan(200);
    expect(cometClass(lp)!.class).toBe("long-period");
  });

  it("Tisserand matches the closed form a_J/a + 2cos(i)√((a/a_J)(1−e²))", () => {
    const aJ = 5.204;
    const a = 2.2155;
    const e = 0.8483;
    const i = 11.78 * (Math.PI / 180);
    const expected = aJ / a + 2 * Math.cos(i) * Math.sqrt((a / aJ) * (1 - e * e));
    expect(tisserandParameter(ENCKE)!).toBeCloseTo(expected, 9);
  });

  it("cometClass carries the Tisserand, period and an honest note", () => {
    const c = cometClass(ENCKE)!;
    expect(c.tisserandJupiter).not.toBeNull();
    expect(c.periodYears).not.toBeNull();
    expect(c.note.toLowerCase()).toContain("jupiter");
  });
});

// ─────────────────────────── Tail direction ─────────────────────────────────

describe("tailDirection — exactly anti-sunward", () => {
  it("is the negated, unit-length position vector", () => {
    const pos = { x: 0.3, y: -0.4, z: 0.5 };
    const t = tailDirection(pos)!;
    const r = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    expect(t[0]).toBeCloseTo(-pos.x / r, 12);
    expect(t[1]).toBeCloseTo(-pos.y / r, 12);
    expect(t[2]).toBeCloseTo(-pos.z / r, 12);
    expect(Math.hypot(t[0], t[1], t[2])).toBeCloseTo(1, 12);
  });

  it("points exactly opposite the Sun→comet direction (dot = −1)", () => {
    const pos = { x: 1.2, y: 0.7, z: -0.2 };
    const t = tailDirection(pos)!;
    const r = Math.hypot(pos.x, pos.y, pos.z);
    const rhat = [pos.x / r, pos.y / r, pos.z / r];
    const dot = t[0] * rhat[0] + t[1] * rhat[1] + t[2] * rhat[2];
    expect(dot).toBeCloseTo(-1, 12);
  });

  it("returns null at the Sun (undefined direction) and for missing input", () => {
    expect(tailDirection({ x: 0, y: 0, z: 0 })).toBeNull();
    expect(tailDirection(null)).toBeNull();
    expect(tailDirection(undefined)).toBeNull();
  });
});

// ─────────────────────────── Comet activity ─────────────────────────────────

describe("cometActivity — illustrative, rises toward the Sun", () => {
  it("rises monotonically as heliocentric distance falls", () => {
    // Saturates at 1 by ~1 AU, then strictly rises through the 1–3 AU band.
    expect(cometActivity(0.5)).toBeGreaterThanOrEqual(cometActivity(1.0));
    expect(cometActivity(1.0)).toBeGreaterThan(cometActivity(1.5));
    expect(cometActivity(1.5)).toBeGreaterThan(cometActivity(2.0));
    expect(cometActivity(2.0)).toBeGreaterThan(cometActivity(2.9));
  });

  it("is ~0 beyond the ~3 AU water-ice onset and saturates ≤ 1 near the Sun", () => {
    expect(cometActivity(COMET_ACTIVITY_ONSET_AU)).toBe(0);
    expect(cometActivity(3.5)).toBe(0);
    expect(cometActivity(0.1)).toBe(1); // saturated
    for (const r of [0.2, 0.5, 1, 1.5, 2, 2.9]) {
      const a = cometActivity(r);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(1);
    }
  });

  it("returns 0 for unknown / non-positive distance (never NaN)", () => {
    expect(cometActivity(null)).toBe(0);
    expect(cometActivity(undefined)).toBe(0);
    expect(cometActivity(0)).toBe(0);
    expect(cometActivity(-1)).toBe(0);
  });
});

// ─────────────────────────── Kepler solver convergence ──────────────────────

describe("elliptic Kepler solver — convergence (M = E − e·sinE)", () => {
  it("satisfies the equation to ~1e-9 across e = 0…0.97 (Halley range)", () => {
    for (let e = 0; e <= 0.97; e += 0.03) {
      for (let deg = 0; deg < 360; deg += 5) {
        const M = deg * (Math.PI / 180);
        const E = solveKepler(M, e);
        const residual =
          E - e * Math.sin(E) - Math.atan2(Math.sin(M), Math.cos(M));
        expect(Math.abs(residual)).toBeLessThan(1e-9);
      }
    }
  });

  it("converges specifically at Halley's e = 0.967 for the whole orbit", () => {
    const e = 0.96714;
    for (let deg = 0; deg < 360; deg += 1) {
      const E = solveKepler(deg * (Math.PI / 180), e);
      expect(Number.isFinite(E)).toBe(true);
      const residual =
        E - e * Math.sin(E) - Math.atan2(Math.sin(deg * (Math.PI / 180)), Math.cos(deg * (Math.PI / 180)));
      expect(Math.abs(residual)).toBeLessThan(1e-9);
    }
  });
});

describe("hyperbolic Kepler solver — convergence (M = e·sinh H − H)", () => {
  it("satisfies the equation to ~1e-9 at 'Oumuamua e = 1.20", () => {
    const e = 1.2011;
    for (let M = -50; M <= 50; M += 0.5) {
      const H = solveKeplerHyperbolic(M, e);
      expect(Number.isFinite(H)).toBe(true);
      const residual = e * Math.sinh(H) - H - M;
      expect(Math.abs(residual)).toBeLessThan(1e-9);
    }
  });

  it("satisfies the equation to ~1e-9 at Borisov e = 3.357", () => {
    const e = 3.3566;
    for (let M = -100; M <= 100; M += 1) {
      const H = solveKeplerHyperbolic(M, e);
      expect(Number.isFinite(H)).toBe(true);
      const residual = e * Math.sinh(H) - H - M;
      expect(Math.abs(residual)).toBeLessThan(1e-9);
    }
  });

  it("H(0) = 0 (perihelion) and returns NaN for a non-hyperbolic e", () => {
    expect(solveKeplerHyperbolic(0, 1.2)).toBeCloseTo(0, 12);
    expect(Number.isNaN(solveKeplerHyperbolic(1, 0.5))).toBe(true); // e ≤ 1
  });
});

// ─────────────────────────── Orbit sampling ─────────────────────────────────

describe("orbitPath — closed for ellipses, open arc for hyperbolas", () => {
  it("returns a closed loop for a bound comet (Halley)", () => {
    const path = orbitPath(HALLEY, { mode: "log", samples: 128 })!;
    expect(path.closed).toBe(true);
    expect(path.regime).toBe("elliptical");
    expect(path.points.length).toBe(128);
    expect(path.note.toLowerCase()).toContain("closed");
    // Every sampled distance is inside the peri/aphelion band.
    const peri = perihelionAU(HALLEY)!;
    const aph = aphelionAU(HALLEY)!;
    for (const p of path.points) {
      expect(p.distanceAU).toBeGreaterThanOrEqual(peri - 1e-6);
      expect(p.distanceAU).toBeLessThanOrEqual(aph + 1e-6);
    }
  });

  it("returns a bounded OPEN arc for an interstellar hyperbola ('Oumuamua)", () => {
    const path = orbitPath(OUMUAMUA, { maxRadiusAU: 30, samples: 200 })!;
    expect(path.closed).toBe(false);
    expect(path.regime).toBe("hyperbolic");
    expect(path.note.toLowerCase()).toContain("open");
    expect(path.note.toLowerCase()).toContain("arc");
    // Bounded by the radius cap; never runs to infinity.
    for (const p of path.points) {
      expect(Number.isFinite(p.distanceAU)).toBe(true);
      expect(p.distanceAU).toBeLessThanOrEqual(30 * 1.0001);
    }
    // Arc is symmetric about perihelion: endpoints are far, middle is near q.
    const mid = path.points[Math.floor(path.points.length / 2)];
    expect(mid.distanceAU).toBeCloseTo(perihelionAU(OUMUAMUA)!, 1);
  });

  it("compresses a huge radial span (log) yet keeps the body's dot on the line", () => {
    const opts = { mode: "log" as const, minRadius: 1, maxRadius: 10, samples: 256 };
    const path = orbitPath(HALLEY, opts)!;
    const radii = path.points.map((p) => Math.hypot(p.x, p.z));
    // Compressed scene radius equals compressRadius(distance) at each point.
    for (const p of path.points) {
      expect(Math.hypot(p.x, p.z)).toBeCloseTo(compressRadius(p.distanceAU, opts), 9);
    }
    // The scene span is far tighter than the raw AU span.
    const auRatio = aphelionAU(HALLEY)! / perihelionAU(HALLEY)!;
    const sceneRatio = Math.max(...radii) / Math.min(...radii);
    expect(auRatio).toBeGreaterThan(50);
    expect(sceneRatio).toBeLessThan(auRatio);
  });

  it("returns null when elements cannot yield e or q", () => {
    expect(orbitPath({ i: 10 })).toBeNull();
  });
});

// ─────────────────────────── Orrery layout ──────────────────────────────────

describe("orrery layout (angles real, radius compressed)", () => {
  const date = new Date(Date.UTC(2026, 6, 8, 12));
  const bodies: SmallBodyInput[] = [
    { name: "Halley", elements: HALLEY },
    { name: "Encke", elements: ENCKE },
    { name: "Apollo", elements: { ...APOLLO, tp: 2460000.5 } },
  ];

  it("preserves the TRUE AU distance and REAL angle for honest labels", () => {
    const layout = orreryLayout(bodies, date);
    for (const b of layout.bodies) {
      // Match against a direct position computation for the same body.
      const el = bodies.find((x) => x.name === b.name)!.elements;
      const pos = heliocentricPosition(el, date)!;
      expect(b.distanceAU).toBeCloseTo(pos.distanceAU, 9);
      // scene mapping x = r cosλ, z = −r sinλ ⇒ λ = atan2(−z, x)
      let lam = (Math.atan2(-b.z, b.x) * 180) / Math.PI;
      lam = ((lam % 360) + 360) % 360;
      let diff = Math.abs(lam - pos.longitudeDeg);
      if (diff > 180) diff = 360 - diff;
      expect(diff).toBeLessThan(1e-6);
    }
  });

  it("scene radius equals |(x,z)| and matches sceneRadius", () => {
    const layout = orreryLayout(bodies, date);
    for (const b of layout.bodies) {
      expect(Math.hypot(b.x, b.z)).toBeCloseTo(b.sceneRadius, 9);
    }
  });

  it("omits (and counts) bodies with insufficient elements", () => {
    const layout = orreryLayout(
      [
        { name: "ok", elements: HALLEY },
        { name: "ghost", elements: { i: 10 } }, // no e/q/anchor
      ],
      date
    );
    expect(layout.bodies.map((b) => b.name)).toEqual(["ok"]);
    expect(layout.omitted).toBe(1);
  });

  it("emits an honest note describing the compression", () => {
    expect(orreryLayout(bodies, date, { mode: "log" }).note).toContain("log-compressed");
    expect(orreryLayout(bodies, date, { mode: "sqrt" }).note).toContain("sqrt-compressed");
    expect(orreryLayout(bodies, date).note).toContain("Angular positions are real");
    expect(orreryLayout(bodies, date, { mode: "linear" }).note).toContain("to scale");
  });
});

// ─────────────────────────── Unit conversions ───────────────────────────────

describe("lunar-distance & AU conversions", () => {
  it("1 LD ≈ 0.00257 AU", () => {
    expect(LUNAR_DISTANCE_AU).toBeCloseTo(0.00257, 5);
    expect(lunarDistancesToAU(1)!).toBeCloseTo(0.002569, 9);
  });

  it("0.05 AU ≈ 19.5 lunar distances (the PHA distance)", () => {
    expect(auToLunarDistances(0.05)!).toBeCloseTo(19.46, 1);
    expect(auToLunarDistances(0.05)!).toBeGreaterThan(19);
    expect(auToLunarDistances(0.05)!).toBeLessThan(20);
  });

  it("AU↔LD are inverse and AU→km uses the IAU value", () => {
    expect(auToLunarDistances(lunarDistancesToAU(7.3)!)!).toBeCloseTo(7.3, 9);
    expect(AU_KM).toBe(149_597_870.7);
    expect(auToKm(1)!).toBe(149_597_870.7);
    expect(auToKm(0.00257)!).toBeGreaterThan(384_000); // ~lunar distance in km
    expect(auToKm(0.00257)!).toBeLessThan(385_000);
  });

  it("conversion helpers are null-safe", () => {
    expect(auToLunarDistances(null)).toBeNull();
    expect(lunarDistancesToAU(undefined)).toBeNull();
    expect(auToKm(null)).toBeNull();
  });
});

// ─────────────────────────── PHA helpers ────────────────────────────────────

describe("potentially-hazardous-asteroid threshold", () => {
  it("applies MOID ≤ 0.05 AU AND H ≤ 22", () => {
    expect(PHA_MOID_MAX_AU).toBe(0.05);
    expect(isPotentiallyHazardous(0.02, 20)).toBe(true); // close + bright
    expect(isPotentiallyHazardous(0.08, 20)).toBe(false); // too far
    expect(isPotentiallyHazardous(0.02, 24)).toBe(false); // too faint (small)
  });

  it("returns null when MOID or H is missing", () => {
    expect(isPotentiallyHazardous(null, 20)).toBeNull();
    expect(isPotentiallyHazardous(0.02, undefined)).toBeNull();
  });

  it("moidNote explains the threshold and cites 19.5 LD", () => {
    expect(moidNote().toLowerCase()).toContain("0.05");
    expect(moidNote()).toContain("19.5 lunar distances");
    expect(moidNote(0.01)).toContain("within");
    expect(moidNote(0.2)).toContain("outside");
  });
});

// ─────────────────────────── HUD snapshot ───────────────────────────────────

describe("smallBodyState — one-call HUD snapshot", () => {
  const date = new Date(Date.UTC(2025, 0, 1));

  it("summarizes a bound comet (Halley)", () => {
    const s = smallBodyState(HALLEY, date, "1P/Halley");
    expect(s.name).toBe("1P/Halley");
    expect(s.bound).toBe(true);
    expect(s.interstellar).toBe(false);
    expect(s.regime).toBe("elliptical");
    expect(s.periodYears!).toBeGreaterThan(75);
    expect(s.aphelionAU!).toBeCloseTo(35.08, 0);
    expect(s.comet!.class).toBe("halley-type");
    expect(s.position).not.toBeNull();
    expect(s.distanceLD!).toBeCloseTo(s.distanceAU! / LUNAR_DISTANCE_AU, 6);
    // tail is anti-sunward of the current position
    const r = Math.hypot(s.position!.x, s.position!.y, s.position!.z);
    expect(s.tailDirection![0]).toBeCloseTo(-s.position!.x / r, 9);
  });

  it("summarizes an interstellar body ('Oumuamua): open orbit, null aphelion/period", () => {
    const s = smallBodyState(OUMUAMUA, date, "1I/'Oumuamua");
    expect(s.interstellar).toBe(true);
    expect(s.regime).toBe("hyperbolic");
    expect(s.aphelionAU).toBeNull();
    expect(s.periodYears).toBeNull();
    expect(s.tisserandJupiter).toBeNull();
    expect(s.nea).toBeNull();
    expect(s.comet!.class).toBe("interstellar");
  });

  it("summarizes a near-Earth asteroid (Apollo) with its NEO class", () => {
    const s = smallBodyState({ ...APOLLO, tp: 2460000.5 }, date, "(1862) Apollo");
    expect(s.nea).toBe("Apollo");
    expect(s.bound).toBe(true);
  });
});

// ─────────────────────────── Null-safety & determinism ──────────────────────

describe("null-safety — missing elements return null, never NaN/throw", () => {
  it("position helpers tolerate empty / sparse elements", () => {
    expect(heliocentricPosition({}, new Date())).toBeNull();
    expect(heliocentricDistanceAU({}, new Date())).toBeNull();
    expect(heliocentricPosition({ e: 0.5 }, new Date())).toBeNull(); // no q
    expect(heliocentricPosition({ e: 0.5, q: 1 }, new Date())).toBeNull(); // no anchor
  });

  it("size/period/class helpers return null rather than NaN on bad input", () => {
    expect(perihelionAU({})).toBeNull();
    expect(aphelionAU({})).toBeNull();
    expect(orbitalPeriodYears({})).toBeNull();
    expect(semiMajorAxisAU({})).toBeNull();
    expect(tisserandParameter({})).toBeNull();
    expect(neaClass({})).toBeNull();
    expect(cometClass({})).toBeNull();
    expect(orbitRegime(undefined)).toBeNull();
    expect(orbitPath({})).toBeNull();
  });

  it("derives elements from partial sets (q from a,e; e from a,q; a from q,Q)", () => {
    expect(perihelionAU({ a: 2, e: 0.5 })!).toBeCloseTo(1.0, 9); // q = a(1−e)
    expect(aphelionAU({ a: 2, e: 0.5 })!).toBeCloseTo(3.0, 9); // Q = a(1+e)
    // e recovered from a & q (e = 1 − q/a = 0.5) ⇒ aphelion a(1+e) = 3.
    expect(aphelionAU({ a: 2, q: 1 })!).toBeCloseTo(3.0, 9);
    // a recovered from q & Q ((q+Q)/2).
    expect(semiMajorAxisAU({ q: 1, Q: 3 })!).toBeCloseTo(2, 9);
  });

  it("a smallBodyState of a nearly-empty row never throws and yields nulls", () => {
    const s = smallBodyState({}, new Date(), "Blank");
    expect(s.position).toBeNull();
    expect(s.distanceAU).toBeNull();
    expect(s.aphelionAU).toBeNull();
    expect(s.cometActivity).toBe(0);
    expect(Number.isNaN(Number(s.distanceAU))).toBe(false); // null, not NaN
  });
});

describe("determinism", () => {
  it("heliocentricPosition is a pure function of the elements + date", () => {
    const d = new Date(Date.UTC(2033, 3, 14, 9, 26, 53));
    expect(heliocentricPosition(HALLEY, d)).toEqual(heliocentricPosition(HALLEY, d));
    expect(heliocentricPosition(OUMUAMUA, d)).toEqual(heliocentricPosition(OUMUAMUA, d));
  });

  it("orbitPath and smallBodyState are deterministic", () => {
    const d = new Date(Date.UTC(2040, 10, 2));
    expect(orbitPath(HALLEY, { mode: "log" })).toEqual(orbitPath(HALLEY, { mode: "log" }));
    expect(smallBodyState(ENCKE, d)).toEqual(smallBodyState(ENCKE, d));
  });
});
