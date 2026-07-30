import { describe, expect, it } from "vitest";
import {
  R_EARTH_KM,
  accuracyNote,
  altitudeShells,
  altitudesKm,
  classifyRegime,
  countByRegime,
  describeObject,
  elementSetAgeDays,
  objectsInGroup,
  parseCatalog,
  periodMinutes,
  semiMajorAxisKm,
  speedKmS,
  type SatRecord,
} from "./satellites";

/**
 * Checked against the published characteristics of real objects, so a
 * regression disagrees with reality rather than with a previous run of our code.
 */

/** ISS, from the catalogue: mean motion 15.4925939, e 0.00070788, i 51.63. */
const ISS: SatRecord = {
  n: "ISS (ZARYA)", i: 25544, g: "stations", e: "2026-07-30T03:39:08.864Z",
  mm: 15.4925939, ec: 0.00070788, in: 51.6319, ra: 87.4712, ap: 352.8836, ma: 7.2051, bs: 0.0001,
};

/** A GPS satellite: semi-synchronous, two revolutions per day. */
const GPS: SatRecord = {
  n: "GPS BIIR-2", i: 24876, g: "gps", e: "2026-07-30T00:00:00.000Z",
  mm: 2.0056, ec: 0.008, in: 55.4, ra: 100, ap: 50, ma: 10, bs: 0,
};

/** A geostationary satellite: mean motion 1.0027 rev/solar day, near-equatorial. */
const GEO: SatRecord = {
  n: "SES-1", i: 36516, g: "geo", e: "2026-07-30T00:00:00.000Z",
  mm: 1.0027, ec: 0.0002, in: 0.05, ra: 90, ap: 270, ma: 180, bs: 0,
};

/** A Molniya-type highly eccentric orbit. */
const MOLNIYA: SatRecord = {
  n: "MOLNIYA 3-50", i: 25847, g: "geo", e: "2026-07-30T00:00:00.000Z",
  mm: 2.006, ec: 0.72, in: 62.8, ra: 120, ap: 280, ma: 15, bs: 0,
};

describe("semiMajorAxisKm", () => {
  it("puts the ISS at roughly 6,795 km, i.e. about 420 km up", () => {
    const a = semiMajorAxisKm(ISS.mm)!;
    expect(a).toBeGreaterThan(6770);
    expect(a).toBeLessThan(6820);
    expect(a - R_EARTH_KM).toBeGreaterThan(390);
    expect(a - R_EARTH_KM).toBeLessThan(440);
  });

  it("puts a geostationary satellite at the textbook 42,164 km radius", () => {
    expect(semiMajorAxisKm(GEO.mm)).toBeCloseTo(42164, -2);
  });

  it("puts GPS near the published 26,560 km radius", () => {
    const a = semiMajorAxisKm(GPS.mm)!;
    expect(a).toBeGreaterThan(26400);
    expect(a).toBeLessThan(26700);
  });

  it("returns null on bad input", () => {
    expect(semiMajorAxisKm(0)).toBeNull();
    expect(semiMajorAxisKm(-1)).toBeNull();
    expect(semiMajorAxisKm(NaN)).toBeNull();
  });
});

describe("periodMinutes", () => {
  it("gives the ISS its real ~92.9 minute period", () => {
    expect(periodMinutes(ISS.mm)).toBeCloseTo(92.9, 0);
  });

  it("gives a geostationary satellite a period of one sidereal day", () => {
    // 1436.1 minutes, about 4 minutes short of 24 hours. Mean motion is counted
    // per SOLAR day (hence 1.0027 rev/day), so getting 1440 here would mean that
    // distinction had been lost.
    const p = periodMinutes(GEO.mm)!;
    expect(p).toBeGreaterThan(1434);
    expect(p).toBeLessThan(1438);
  });

  it("returns null on bad input", () => {
    expect(periodMinutes(0)).toBeNull();
    expect(periodMinutes(NaN)).toBeNull();
  });
});

describe("altitudesKm", () => {
  it("gives the ISS a near-circular orbit around 420 km", () => {
    const a = altitudesKm(ISS.mm, ISS.ec)!;
    expect(a.perigee).toBeGreaterThan(390);
    expect(a.apogee).toBeLessThan(450);
    // Nearly circular: the two differ by only a few km.
    expect(a.apogee - a.perigee).toBeLessThan(15);
  });

  it("gives GEO the canonical 35,786 km altitude", () => {
    expect(altitudesKm(GEO.mm, GEO.ec)!.mean).toBeCloseTo(35786, -2);
  });

  it("spreads a Molniya orbit from low perigee to distant apogee", () => {
    const a = altitudesKm(MOLNIYA.mm, MOLNIYA.ec)!;
    expect(a.perigee).toBeLessThan(2000);
    expect(a.apogee).toBeGreaterThan(35000);
  });

  it("returns null for an unphysical eccentricity", () => {
    expect(altitudesKm(ISS.mm, 1)).toBeNull();
    expect(altitudesKm(ISS.mm, -0.1)).toBeNull();
    expect(altitudesKm(ISS.mm, NaN)).toBeNull();
  });
});

describe("speedKmS", () => {
  it("gives the ISS its real ~7.66 km/s", () => {
    const a = semiMajorAxisKm(ISS.mm)!;
    const v = speedKmS(a, a)!;
    expect(v).toBeGreaterThan(7.5);
    expect(v).toBeLessThan(7.8);
  });

  it("gives a geostationary satellite its ~3.07 km/s", () => {
    const a = semiMajorAxisKm(GEO.mm)!;
    expect(speedKmS(a, a)).toBeCloseTo(3.07, 1);
  });

  it("is faster at perigee than apogee for an eccentric orbit", () => {
    const a = semiMajorAxisKm(MOLNIYA.mm)!;
    const vp = speedKmS(a, a * (1 - MOLNIYA.ec))!;
    const va = speedKmS(a, a * (1 + MOLNIYA.ec))!;
    expect(vp).toBeGreaterThan(va * 3);
  });

  it("returns null when the radius is outside the orbit", () => {
    const a = semiMajorAxisKm(ISS.mm)!;
    expect(speedKmS(a, a * 3)).toBeNull();
    expect(speedKmS(0, 7000)).toBeNull();
  });
});

describe("classifyRegime", () => {
  it("classifies the archetypes", () => {
    expect(classifyRegime(ISS.mm, ISS.ec, ISS.in)).toBe("LEO");
    expect(classifyRegime(GPS.mm, GPS.ec, GPS.in)).toBe("MEO");
    expect(classifyRegime(GEO.mm, GEO.ec, GEO.in)).toBe("GEO");
    expect(classifyRegime(MOLNIYA.mm, MOLNIYA.ec, MOLNIYA.in)).toBe("HEO");
  });

  it("does not call an inclined near-GEO-altitude orbit geostationary", () => {
    // Right altitude, wrong plane: geosynchronous but not geostationary.
    expect(classifyRegime(GEO.mm, GEO.ec, 55)).toBe("MEO");
  });

  it("returns null on bad input", () => {
    expect(classifyRegime(0, 0, 0)).toBeNull();
    expect(classifyRegime(ISS.mm, ISS.ec, NaN)).toBeNull();
  });
});

describe("elementSetAgeDays and accuracyNote", () => {
  it("measures age from the epoch", () => {
    const now = new Date("2026-07-31T00:00:00Z");
    expect(elementSetAgeDays("2026-07-30T00:00:00Z", now)).toBeCloseTo(1, 6);
  });

  it("returns null on an unparseable epoch", () => {
    expect(elementSetAgeDays("not-a-date")).toBeNull();
  });

  it("states the error growth honestly rather than implying precision", () => {
    expect(accuracyNote(null)).toMatch(/unknown/i);
    expect(accuracyNote(0.5)).toMatch(/kilometre/i);
    expect(accuracyNote(7)).toMatch(/14 km/);
    expect(accuracyNote(-1)).toMatch(/future/i);
  });
});

describe("altitudeShells", () => {
  it("bins objects by mean altitude", () => {
    const shells = altitudeShells([ISS, ISS, GPS], 100, 2000);
    // Both ISS copies land in the 400-500 km shell; GPS is above maxKm.
    const leo = shells.find((s) => s.fromKm === 400);
    expect(leo?.count).toBe(2);
    expect(shells.reduce((s, x) => s + x.count, 0)).toBe(2);
  });

  it("returns sorted, non-overlapping shells", () => {
    const shells = altitudeShells([ISS, GPS, GEO], 100, 40000);
    for (let i = 1; i < shells.length; i++) {
      expect(shells[i].fromKm).toBeGreaterThanOrEqual(shells[i - 1].toKm);
    }
  });

  it("returns [] on bad input rather than throwing", () => {
    expect(altitudeShells([], 100, 2000)).toEqual([]);
    expect(altitudeShells([ISS], 0, 2000)).toEqual([]);
  });
});

describe("catalogue helpers", () => {
  const objects = [ISS, GPS, GEO, MOLNIYA];

  it("countByRegime tallies each regime", () => {
    const c = countByRegime(objects);
    expect(c.LEO).toBe(1);
    expect(c.MEO).toBe(1);
    expect(c.GEO).toBe(1);
    expect(c.HEO).toBe(1);
  });

  it("objectsInGroup filters by group", () => {
    expect(objectsInGroup(objects, "stations")).toHaveLength(1);
    expect(objectsInGroup(objects, "nope")).toHaveLength(0);
  });

  it("parseCatalog rejects unusable payloads", () => {
    expect(parseCatalog(null)).toBeNull();
    expect(parseCatalog({})).toBeNull();
    expect(parseCatalog({ meta: {}, objects: [] })).toBeNull();
    // An object with an impossible eccentricity is dropped, leaving nothing.
    expect(parseCatalog({ meta: {}, objects: [{ ...ISS, ec: 1.5 }] })).toBeNull();
  });

  it("parseCatalog keeps well-formed objects", () => {
    const c = parseCatalog({ meta: { totalShipped: 4 }, objects });
    expect(c?.objects).toHaveLength(4);
  });

  it("describeObject reports the ISS the way the literature does", () => {
    const d = describeObject(ISS)!;
    expect(d.regime).toBe("LEO");
    expect(d.periodMin).toBeCloseTo(92.9, 0);
    expect(d.perigeeKm).toBeGreaterThan(390);
    expect(d.apogeeKm).toBeLessThan(450);
    expect(d.speedPerigeeKmS).toBeGreaterThan(7.5);
    expect(d.revsPerDay).toBeCloseTo(15.49, 1);
  });

  it("describeObject returns null on unusable input", () => {
    expect(describeObject({ ...ISS, mm: 0 })).toBeNull();
    expect(describeObject({ ...ISS, ec: 1 })).toBeNull();
  });
});
