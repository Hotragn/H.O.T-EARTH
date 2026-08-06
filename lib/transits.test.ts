import { describe, expect, it } from "vitest";
import {
  RATIO_CAVEAT,
  R_SUN_IN_R_EARTH,
  countByMethod,
  depthPpm,
  derive,
  lightCurve,
  parseTransitPlanets,
  planetRadiusFromDepth,
  transitDepth,
  transitDurationHours,
  transitProbability,
  transitable,
  type TransitPlanet,
} from "./transits";

/**
 * Checked against textbook values and published measurements, so a regression
 * disagrees with the literature rather than with a previous run of our own code.
 */

/** HD 209458 b, the first transiting exoplanet found. */
const HD209458B: TransitPlanet = {
  host: "HD 209458", name: "HD 209458 b", method: "Transit", discYear: 1999,
  periodDays: 3.5247, smaAu: 0.04747, radiusEarth: 15.0,
  starRadiusSolar: 1.155, starTeff: 6065, distanceLy: 159,
};

/** TRAPPIST-1 b: a small planet made detectable by a very small star. */
const TRAPPIST1B: TransitPlanet = {
  host: "TRAPPIST-1", name: "TRAPPIST-1 b", method: "Transit", discYear: 2016,
  periodDays: 1.51088, smaAu: 0.01154, radiusEarth: 1.116,
  starRadiusSolar: 0.1192, starTeff: 2566, distanceLy: 40.7,
};

/** A radial-velocity planet, which this tab must refuse to draw. */
const RV_PLANET: TransitPlanet = {
  host: "Proxima Cen", name: "Proxima Cen b", method: "Radial Velocity", discYear: 2016,
  periodDays: 11.1868, smaAu: 0.04856, radiusEarth: null,
  starRadiusSolar: 0.141, starTeff: 2900, distanceLy: 4.24,
};

describe("transitDepth", () => {
  it("gives Earth across the Sun the textbook 84 ppm", () => {
    // (1 / 109.0762)^2 = 8.41e-5. This is the number that makes finding Earth
    // analogues hard, so it is worth pinning exactly.
    const d = transitDepth(1, 1)!;
    expect(depthPpm(d)).toBeCloseTo(84, 0);
  });

  it("gives Jupiter across the Sun about 1.1%", () => {
    const d = transitDepth(11.209, 1)!;
    expect(d * 100).toBeGreaterThan(1.0);
    expect(d * 100).toBeLessThan(1.12);
  });

  it("shows the six-hundred-fold gap between Earth and Jupiter", () => {
    const earth = transitDepth(1, 1)!;
    const jupiter = transitDepth(11.209, 1)!;
    expect(jupiter / earth).toBeCloseTo(125.6, 0);
  });

  it("reproduces HD 209458 b's published ~1.5% depth", () => {
    const d = transitDepth(HD209458B.radiusEarth, HD209458B.starRadiusSolar)!;
    expect(d * 100).toBeGreaterThan(1.3);
    expect(d * 100).toBeLessThan(1.6);
  });

  it("reproduces TRAPPIST-1 b's published ~0.7% depth", () => {
    // An Earth-sized planet, but the star is tiny, so the depth is 90x Earth's
    // across the Sun. This is the whole reason M dwarfs are surveyed.
    const d = transitDepth(TRAPPIST1B.radiusEarth, TRAPPIST1B.starRadiusSolar)!;
    expect(d * 100).toBeGreaterThan(0.6);
    expect(d * 100).toBeLessThan(0.85);
  });

  it("scales as the square of the radius ratio", () => {
    const a = transitDepth(2, 1)!;
    const b = transitDepth(1, 1)!;
    expect(a / b).toBeCloseTo(4, 6);
  });

  it("returns null on bad input", () => {
    expect(transitDepth(0, 1)).toBeNull();
    expect(transitDepth(1, 0)).toBeNull();
    expect(transitDepth(null, 1)).toBeNull();
    expect(transitDepth(NaN, 1)).toBeNull();
  });
});

describe("planetRadiusFromDepth", () => {
  it("round-trips the depth back to the radius", () => {
    const d = transitDepth(HD209458B.radiusEarth, HD209458B.starRadiusSolar);
    expect(planetRadiusFromDepth(d, HD209458B.starRadiusSolar)).toBeCloseTo(15.0, 6);
  });

  it("inherits the star's radius error directly, which is the point", () => {
    const d = transitDepth(1, 1)!;
    // A star 10% larger than assumed makes the planet come out 10% larger.
    expect(planetRadiusFromDepth(d, 1.1)!).toBeCloseTo(1.1, 6);
  });

  it("recovers one Earth radius from 84 ppm around a solar-radius star", () => {
    expect(planetRadiusFromDepth(84e-6, 1)!).toBeCloseTo(1.0, 1);
  });

  it("returns null on bad input", () => {
    expect(planetRadiusFromDepth(0, 1)).toBeNull();
    expect(planetRadiusFromDepth(1e-4, 0)).toBeNull();
    expect(planetRadiusFromDepth(null, 1)).toBeNull();
  });
});

describe("transitDurationHours", () => {
  it("matches HD 209458 b's published ~3 hour transit", () => {
    const t = transitDurationHours(
      HD209458B.periodDays, HD209458B.smaAu, HD209458B.starRadiusSolar,
    )!;
    expect(t).toBeGreaterThan(2.7);
    expect(t).toBeLessThan(3.4);
  });

  it("matches TRAPPIST-1 b's published ~36 minute transit", () => {
    const t = transitDurationHours(
      TRAPPIST1B.periodDays, TRAPPIST1B.smaAu, TRAPPIST1B.starRadiusSolar,
    )!;
    expect(t * 60).toBeGreaterThan(30);
    expect(t * 60).toBeLessThan(45);
  });

  it("scales with the period at fixed geometry", () => {
    const a = transitDurationHours(10, 0.1, 1)!;
    const b = transitDurationHours(20, 0.1, 1)!;
    expect(b / a).toBeCloseTo(2, 6);
  });

  it("returns null when the star is larger than the orbit", () => {
    // 1 solar radius is 0.00465 AU, so an orbit inside that is unphysical.
    expect(transitDurationHours(1, 0.001, 1)).toBeNull();
  });

  it("returns null on bad input", () => {
    expect(transitDurationHours(0, 0.1, 1)).toBeNull();
    expect(transitDurationHours(10, 0, 1)).toBeNull();
    expect(transitDurationHours(10, 0.1, null)).toBeNull();
  });
});

describe("transitProbability", () => {
  it("gives a hot Jupiter roughly a one-in-ten chance", () => {
    const p = transitProbability(HD209458B.smaAu, HD209458B.starRadiusSolar)!;
    expect(p).toBeGreaterThan(0.08);
    expect(p).toBeLessThan(0.14);
  });

  it("gives an Earth analogue well under one in a hundred", () => {
    // 1 AU around a solar-radius star: 0.00465, about 1 in 215.
    const p = transitProbability(1, 1)!;
    expect(p).toBeLessThan(0.005);
    expect(1 / p).toBeGreaterThan(200);
  });

  it("falls as the orbit widens", () => {
    expect(transitProbability(0.1, 1)!).toBeGreaterThan(transitProbability(1, 1)!);
  });

  it("clamps at 1 rather than returning a probability above unity", () => {
    expect(transitProbability(0.0001, 1)).toBe(1);
  });

  it("returns null on bad input", () => {
    expect(transitProbability(0, 1)).toBeNull();
    expect(transitProbability(1, null)).toBeNull();
  });
});

describe("derive", () => {
  it("produces a self-consistent set for a real planet", () => {
    const d = derive(HD209458B);
    expect(d.depth).not.toBeNull();
    expect(d.ppm!).toBeGreaterThan(13000);
    expect(d.durationHours!).toBeCloseTo(3.1, 0);
    expect(d.radiusRoundTrip!).toBeCloseTo(15.0, 4);
  });

  it("yields nulls rather than guesses when the radius is unknown", () => {
    const d = derive(RV_PLANET);
    expect(d.depth).toBeNull();
    expect(d.ppm).toBeNull();
    expect(d.radiusRoundTrip).toBeNull();
    // Duration and probability need no planet radius, so they still resolve.
    expect(d.durationHours).not.toBeNull();
  });
});

describe("transitable", () => {
  it("keeps transit discoveries and drops the others", () => {
    const kept = transitable([HD209458B, TRAPPIST1B, RV_PLANET]);
    expect(kept.map((p) => p.name)).toEqual(["HD 209458 b", "TRAPPIST-1 b"]);
  });

  it("drops a transit planet with no measured radius", () => {
    expect(transitable([{ ...HD209458B, radiusEarth: null }])).toHaveLength(0);
  });

  it("returns [] on bad input", () => {
    expect(transitable([])).toEqual([]);
  });
});

describe("lightCurve", () => {
  it("starts and ends at full brightness and bottoms out at the depth", () => {
    const c = lightCurve(HD209458B, 100);
    expect(c.length).toBe(100);
    expect(c[0].flux).toBeCloseTo(1, 6);
    expect(c[c.length - 1].flux).toBeCloseTo(1, 6);
    const min = Math.min(...c.map((s) => s.flux));
    expect(1 - min).toBeCloseTo(derive(HD209458B).depth!, 6);
  });

  it("is symmetric about mid-transit", () => {
    const c = lightCurve(HD209458B, 101);
    const mid = Math.floor(101 / 2);
    expect(c[mid].hours).toBeCloseTo(0, 6);
    expect(c[mid - 10].flux).toBeCloseTo(c[mid + 10].flux, 6);
  });

  it("never dips below the floor set by the depth", () => {
    for (const s of lightCurve(TRAPPIST1B, 60)) {
      expect(s.flux).toBeLessThanOrEqual(1 + 1e-9);
      expect(s.flux).toBeGreaterThanOrEqual(1 - derive(TRAPPIST1B).depth! - 1e-9);
    }
  });

  it("returns [] when a transit cannot be computed", () => {
    expect(lightCurve(RV_PLANET)).toEqual([]);
    expect(lightCurve(HD209458B, 2)).toEqual([]);
  });
});

describe("parseTransitPlanets and countByMethod", () => {
  const payload = {
    systems: [
      {
        hostname: "HD 209458",
        distance_ly: 159,
        star: { rad: 1.155, teff: 6065 },
        planets: [
          { name: "HD 209458 b", method: "Transit", disc_year: 1999, period_days: 3.5247, sma_au: 0.04747, radius_re: 15.0 },
        ],
      },
      { hostname: "broken", star: { rad: 1 } },
    ],
  };

  it("flattens planets onto their host star", () => {
    const rows = parseTransitPlanets(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].starRadiusSolar).toBe(1.155);
    expect(rows[0].host).toBe("HD 209458");
  });

  it("returns [] on unusable payloads", () => {
    expect(parseTransitPlanets(null)).toEqual([]);
    expect(parseTransitPlanets({})).toEqual([]);
  });

  it("counts methods", () => {
    const c = countByMethod([HD209458B, TRAPPIST1B, RV_PLANET]);
    expect(c.Transit).toBe(2);
    expect(c["Radial Velocity"]).toBe(1);
  });
});

describe("constants and caveats", () => {
  it("uses the IAU nominal solar-to-Earth radius ratio", () => {
    expect(R_SUN_IN_R_EARTH).toBeCloseTo(695700 / 6378.1, 2);
  });

  it("states that a transit measures a ratio, not a planet", () => {
    expect(RATIO_CAVEAT).toMatch(/ratio/i);
    expect(RATIO_CAVEAT).toMatch(/nothing about mass/i);
  });
});
