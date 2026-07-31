import { describe, expect, it } from "vitest";
import {
  SAROS_DAYS,
  VISIBILITY_CAVEAT,
  centrality,
  countByType,
  daysUntil,
  durationLabel,
  greatCircleKm,
  meanSarosIntervalDays,
  next,
  parseCanon,
  sarosSeries,
  upcoming,
  type SolarEclipse,
} from "./eclipses";

/**
 * Checked against the published canon: famous eclipses whose type, saros series
 * and duration are widely documented, so a regression disagrees with the
 * literature rather than with a previous run of our own code.
 */

/** The 2017 "Great American" total eclipse. */
const E2017: SolarEclipse = {
  id: "S09533", td: "2017-08-21T18:26:40Z", dT: 69, saros: 145, type: "T", qual: "-n",
  gamma: 0.4367, mag: 1.0306, lat: 37, lon: -87, sunAlt: 64, pathKm: 115, durS: 160,
};
/** The 2024 total eclipse across Mexico, the US and Canada. */
const E2024: SolarEclipse = {
  id: "S09549", td: "2024-04-08T18:17:16Z", dT: 69, saros: 139, type: "T", qual: "-n",
  gamma: 0.3431, mag: 1.0566, lat: 25, lon: -105, sunAlt: 70, pathKm: 198, durS: 268,
};
/** The 2026 total eclipse whose greatest point is off Iceland. */
const E2026: SolarEclipse = {
  id: "S09566", td: "2026-08-12T17:47:06Z", dT: 75, saros: 126, type: "T", qual: "-p",
  gamma: 0.8977, mag: 1.0386, lat: 65, lon: -25, sunAlt: 26, pathKm: 294, durS: 138,
};
/** The long 2027 eclipse over North Africa: 6m23s. */
const E2027: SolarEclipse = {
  id: "S09569", td: "2027-08-02T10:07:50Z", dT: 76, saros: 136, type: "T", qual: "-n",
  gamma: 0.1421, mag: 1.079, lat: 25, lon: 33, sunAlt: 83, pathKm: 258, durS: 383,
};
/** A partial eclipse whose axis misses Earth (|gamma| > 1). */
const PARTIAL: SolarEclipse = {
  id: "S09999", td: "2029-06-12T04:06:13Z", dT: 77, saros: 118, type: "P", qual: "",
  gamma: 1.2943, mag: 0.4576, lat: 66, lon: -22, sunAlt: 0, pathKm: null, durS: null,
};

const ALL = [E2017, E2024, E2026, E2027, PARTIAL];

describe("upcoming and next", () => {
  it("returns only future eclipses, soonest first", () => {
    const from = new Date("2024-01-01T00:00:00Z");
    const u = upcoming(ALL, from, 10);
    expect(u.map((e) => e.id)).toEqual(["S09549", "S09566", "S09569", "S09999"]);
    expect(u.some((e) => e.id === "S09533")).toBe(false);
  });

  it("respects the limit", () => {
    expect(upcoming(ALL, new Date("2000-01-01Z"), 2)).toHaveLength(2);
    expect(upcoming(ALL, new Date("2000-01-01Z"), 0)).toHaveLength(0);
  });

  it("includes an eclipse happening exactly now", () => {
    expect(next(ALL, new Date("2024-04-08T18:17:16Z"))?.id).toBe("S09549");
  });

  it("next returns null once the catalogue is exhausted", () => {
    expect(next(ALL, new Date("2200-01-01Z"))).toBeNull();
  });

  it("returns [] on bad input rather than throwing", () => {
    expect(upcoming(ALL, new Date("nonsense"))).toEqual([]);
    expect(upcoming([] as SolarEclipse[])).toEqual([]);
  });
});

describe("daysUntil", () => {
  it("counts forward and backward", () => {
    expect(daysUntil("2024-04-09T00:00:00Z", new Date("2024-04-08T00:00:00Z"))).toBeCloseTo(1, 6);
    expect(daysUntil("2024-04-07T00:00:00Z", new Date("2024-04-08T00:00:00Z"))).toBeCloseTo(-1, 6);
  });
  it("returns null on an unparseable date", () => {
    expect(daysUntil("not-a-date")).toBeNull();
  });
});

describe("centrality", () => {
  it("calls the long 2027 eclipse nearly central", () => {
    // gamma 0.142: the axis passes close to Earth's centre, the path crosses low
    // latitudes, and the duration is correspondingly long.
    const c = centrality(E2027.gamma)!;
    expect(c.absGamma).toBeCloseTo(0.1421, 4);
    expect(c.axisMissesEarth).toBe(false);
    expect(c.label).toMatch(/central/i);
  });

  it("calls the 2026 eclipse grazing, which is why it is short and high-latitude", () => {
    const c = centrality(E2026.gamma)!;
    expect(c.label).toMatch(/grazing/i);
    expect(E2026.lat!).toBeGreaterThan(60);
  });

  it("flags an axis that misses Earth", () => {
    const c = centrality(PARTIAL.gamma)!;
    expect(c.axisMissesEarth).toBe(true);
    expect(c.label).toMatch(/misses Earth/i);
  });

  it("returns null on bad input", () => {
    expect(centrality(null)).toBeNull();
    expect(centrality(NaN)).toBeNull();
  });
});

describe("durationLabel", () => {
  it("formats the published durations of famous eclipses", () => {
    expect(durationLabel(E2017.durS)).toBe("2m40s"); // Great American 2017
    expect(durationLabel(E2024.durS)).toBe("4m28s"); // 2024
    expect(durationLabel(E2027.durS)).toBe("6m23s"); // long 2027 eclipse
  });
  it("returns null when there is no central duration", () => {
    expect(durationLabel(null)).toBeNull();
    expect(durationLabel(-5)).toBeNull();
  });
});

describe("saros", () => {
  it("groups a series chronologically", () => {
    const s = sarosSeries([E2026, E2017, { ...E2026, id: "X", td: "2044-08-23T00:00:00Z" }], 126);
    expect(s.map((e) => e.id)).toEqual(["S09566", "X"]);
  });

  it("recovers the saros period from real catalogue dates", () => {
    // 2008 Aug 01 and 2026 Aug 12 are consecutive members of saros 126. Their
    // spacing is the saros itself: 6585.32 days, 18 years 11 days 8 hours. This
    // is a genuine check on both the constant and our date parsing.
    const series = [
      { saros: 126, td: "2008-08-01T10:22:12Z" },
      { saros: 126, td: "2026-08-12T17:47:06Z" },
    ];
    const mean = meanSarosIntervalDays(series, 126)!;
    expect(mean).toBeCloseTo(SAROS_DAYS, 0);
    expect(Math.abs(mean - SAROS_DAYS)).toBeLessThan(0.5);
  });

  it("returns null with fewer than two members", () => {
    expect(meanSarosIntervalDays([E2026], 126)).toBeNull();
    expect(meanSarosIntervalDays(ALL, 999)).toBeNull();
  });

  it("returns [] for a nonsense series number", () => {
    expect(sarosSeries(ALL, NaN)).toEqual([]);
  });
});

describe("countByType", () => {
  it("tallies the type codes", () => {
    const c = countByType(ALL);
    expect(c.T).toBe(4);
    expect(c.P).toBe(1);
    expect(c.A).toBeUndefined();
  });
});

describe("greatCircleKm", () => {
  it("is zero for the same point", () => {
    expect(greatCircleKm(50, 10, 50, 10)).toBeCloseTo(0, 6);
  });

  it("gives a quarter circumference from equator to pole", () => {
    expect(greatCircleKm(0, 0, 90, 0)!).toBeCloseTo(10007.5, 0);
  });

  it("is symmetric", () => {
    const a = greatCircleKm(51.5, -0.1, 40.7, -74)!;
    const b = greatCircleKm(40.7, -74, 51.5, -0.1)!;
    expect(a).toBeCloseTo(b, 6);
  });

  it("matches the known London to New York great-circle distance", () => {
    // About 5,570 km.
    const d = greatCircleKm(51.5074, -0.1278, 40.7128, -74.006)!;
    expect(d).toBeGreaterThan(5500);
    expect(d).toBeLessThan(5620);
  });

  it("returns null on bad input", () => {
    expect(greatCircleKm(NaN, 0, 0, 0)).toBeNull();
  });
});

describe("parseCanon", () => {
  it("rejects unusable payloads", () => {
    expect(parseCanon(null)).toBeNull();
    expect(parseCanon({})).toBeNull();
    expect(parseCanon({ meta: {}, solar: [], lunar: [] })).toBeNull();
  });

  it("drops rows with an unparseable date", () => {
    const c = parseCanon({
      meta: {},
      solar: [E2026, { id: "bad", td: "nope" }],
      lunar: [],
    });
    expect(c?.solar).toHaveLength(1);
  });

  it("keeps a well-formed canon", () => {
    const c = parseCanon({ meta: {}, solar: ALL, lunar: [] });
    expect(c?.solar).toHaveLength(5);
  });
});

describe("the visibility caveat", () => {
  it("says plainly that distance is not visibility", () => {
    expect(VISIBILITY_CAVEAT).toMatch(/not a visibility calculation/i);
    expect(VISIBILITY_CAVEAT).toMatch(/does not compute/i);
  });
});
