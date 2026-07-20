import { describe, expect, it } from "vitest";
import { marsSubsolarPoint } from "./mars-time";
import { heliocentricPosition } from "./planets";
import {
  MARS_SITES,
  MARS_TWILIGHT_SUN_ALT_DEG,
  SATURN_ANGULAR_DIAMETER_FROM_TITAN_DEG,
  TITAN_SITES,
  TITAN_SOLAR_DAY_DAYS,
  getSurfaceSite,
  marsDaylight,
  marsSkyStory,
  marsSolarIrradiance,
  marsSunPosition,
  marsSurfaceFacts,
  saturnInTitanSky,
  surfaceState,
  titanSolarIrradiance,
  titanSunPosition,
  titanSurfaceFacts,
  type SurfaceSite,
} from "./surfaces";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const T0 = new Date(Date.UTC(2026, 6, 20, 12, 0, 0));

const gale = getSurfaceSite("mars", "gale")!;
const jezero = getSurfaceSite("mars", "jezero")!;
const huygens = getSurfaceSite("titan", "huygens")!;
const subSaturn = getSurfaceSite("titan", "sub-saturn")!;

function siteAt(latDeg: number, lonEastDeg: number): SurfaceSite {
  return {
    id: "test",
    name: "test",
    latDeg,
    lonEastDeg,
    landingSite: false,
    source: "test",
  };
}

// ═══════════════════════════════ MARS ══════════════════════════════════════

describe("marsSunPosition — geometry against the Mars24 subsolar point", () => {
  it("puts the sun at ~90° altitude at the subsolar point", () => {
    const sub = marsSubsolarPoint(T0);
    const pos = marsSunPosition(siteAt(sub.lat, sub.lon), T0)!;
    expect(pos.altitudeDeg).toBeGreaterThan(89.9);
  });

  it("puts the sun below the horizon at the antipode", () => {
    const sub = marsSubsolarPoint(T0);
    const antipodeLon = sub.lon > 0 ? sub.lon - 180 : sub.lon + 180;
    const pos = marsSunPosition(siteAt(-sub.lat, antipodeLon), T0)!;
    expect(pos.altitudeDeg).toBeLessThan(-80);
  });

  it("local noon at Gale gives the max altitude for that sol", () => {
    // Scan one sol in 5-minute steps; find max altitude and the LMST there.
    const solMs = 88_775_244;
    let maxAlt = -Infinity;
    let lmstAtMax = 0;
    for (let t = 0; t <= solMs; t += 5 * 60_000) {
      const d = new Date(T0.getTime() + t);
      const alt = marsSunPosition(gale, d)!.altitudeDeg;
      if (alt > maxAlt) {
        maxAlt = alt;
        lmstAtMax = marsDaylight(gale, d)!.localMeanSolarTimeHours;
      }
    }
    // Max altitude occurs at local mean noon (H = 0 by construction).
    expect(Math.abs(lmstAtMax - 12)).toBeLessThan(0.2);
  });

  it("noon altitude equals 90 − |lat − dec| (both Gale and Jezero)", () => {
    for (const site of [gale, jezero]) {
      // Find the instant of local mean noon within the next sol.
      const solMs = 88_775_244;
      let best: Date = T0;
      let bestDiff = Infinity;
      for (let t = 0; t <= solMs; t += 30_000) {
        const d = new Date(T0.getTime() + t);
        const lmst = marsDaylight(site, d)!.localMeanSolarTimeHours;
        const diff = Math.abs(lmst - 12);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = d;
        }
      }
      const dec = marsSubsolarPoint(best).lat;
      const expected = 90 - Math.abs(site.latDeg - dec);
      const alt = marsSunPosition(site, best)!.altitudeDeg;
      expect(Math.abs(alt - expected)).toBeLessThan(0.2);
    }
  });

  it("azimuth is in [0, 360) from north, clockwise", () => {
    for (let h = 0; h < 25; h++) {
      const pos = marsSunPosition(gale, new Date(T0.getTime() + h * HOUR_MS))!;
      expect(pos.azimuthDeg).toBeGreaterThanOrEqual(0);
      expect(pos.azimuthDeg).toBeLessThan(360);
    }
  });
});

describe("marsDaylight", () => {
  it("flips between day and night across a sol at Gale", () => {
    const phases = new Set<string>();
    for (let t = 0; t <= 88_775_244; t += 15 * 60_000) {
      phases.add(marsDaylight(gale, new Date(T0.getTime() + t))!.phase);
    }
    expect(phases.has("day")).toBe(true);
    expect(phases.has("night")).toBe(true);
  });

  it("uses the stated civil-twilight convention (0 to −6°)", () => {
    expect(MARS_TWILIGHT_SUN_ALT_DEG).toBe(-6);
    // Scan for a twilight moment and check the altitude band.
    for (let t = 0; t <= 88_775_244; t += 60_000) {
      const dl = marsDaylight(gale, new Date(T0.getTime() + t))!;
      if (dl.phase === "twilight") {
        expect(dl.sunAltitudeDeg).toBeLessThanOrEqual(0);
        expect(dl.sunAltitudeDeg).toBeGreaterThan(-6);
        return;
      }
    }
    throw new Error("no twilight found across a sol");
  });

  it("carries sol number, Ls and season", () => {
    const dl = marsDaylight(gale, T0)!;
    expect(Number.isInteger(dl.sol)).toBe(true);
    expect(dl.sol).toBeGreaterThan(44_796); // past the Mars24 J2000 anchor
    expect(dl.ls).toBeGreaterThanOrEqual(0);
    expect(dl.ls).toBeLessThan(360);
    expect(dl.season).toMatch(/^Northern /);
  });
});

describe("marsSkyStory — cited sky regimes", () => {
  it("is butterscotch by day and blue near the low sun", () => {
    expect(marsSkyStory(45)!.regime).toBe("butterscotch-day");
    expect(marsSkyStory(3)!.regime).toBe("blue-sunset");
    expect(marsSkyStory(-3)!.regime).toBe("twilight");
    expect(marsSkyStory(-20)!.regime).toBe("night");
  });

  it("cites the Curiosity sol 956 blue sunset and labels palettes as suggestions", () => {
    const sunset = marsSkyStory(2)!;
    expect(sunset.citation).toMatch(/sol 956/);
    expect(sunset.explanation.toLowerCase()).toContain("blue");
    expect(sunset.suggestedPalette.length).toBeGreaterThan(0);
  });
});

describe("marsSolarIrradiance — inverse-square at the true distance", () => {
  it("spans ~493–713 W/m² over a Mars year (perihelion/aphelion)", () => {
    let min = Infinity;
    let max = -Infinity;
    for (let day = 0; day < 690; day += 2) {
      const s = marsSolarIrradiance(new Date(T0.getTime() + day * DAY_MS))!;
      min = Math.min(min, s);
      max = Math.max(max, s);
    }
    expect(min).toBeGreaterThan(480);
    expect(min).toBeLessThan(520);
    expect(max).toBeGreaterThan(680);
    expect(max).toBeLessThan(715);
  });

  it("matches 1361/r² against lib/planets directly", () => {
    const r = heliocentricPosition("Mars", T0).distanceAU;
    expect(marsSolarIrradiance(T0)!).toBeCloseTo(1361 / (r * r), 8);
  });
});

describe("marsSurfaceFacts", () => {
  it("carries the NASA fact-sheet values", () => {
    expect(marsSurfaceFacts.surfaceGravityMs2).toBeCloseTo(3.71, 2);
    expect(marsSurfaceFacts.meanSurfacePressurePa).toBe(610);
    expect(marsSurfaceFacts.solLength).toContain("24h 39m");
    expect(marsSurfaceFacts.source).toMatch(/NASA/);
  });
});

// ═══════════════════════════════ TITAN ═════════════════════════════════════

describe("saturnInTitanSky — tidal locking geometry", () => {
  it("is NOT visible from the real Huygens site (far side)", () => {
    const s = saturnInTitanSky(huygens)!;
    expect(s.visible).toBe(false);
    expect(s.altitudeDeg).toBeLessThan(0);
  });

  it("is near zenith from the sub-Saturn viewpoint", () => {
    const s = saturnInTitanSky(subSaturn)!;
    expect(s.visible).toBe(true);
    expect(s.altitudeDeg).toBeGreaterThan(89.9);
  });

  it("computes Saturn's angular diameter ≈ 5.65°, ~11× the Moon's 0.52°", () => {
    const expected =
      2 * Math.atan(60_268 / 1_221_870) * (180 / Math.PI);
    expect(SATURN_ANGULAR_DIAMETER_FROM_TITAN_DEG).toBeCloseTo(expected, 10);
    expect(SATURN_ANGULAR_DIAMETER_FROM_TITAN_DEG).toBeGreaterThan(5.5);
    expect(SATURN_ANGULAR_DIAMETER_FROM_TITAN_DEG).toBeLessThan(5.8);
    const vsMoon = SATURN_ANGULAR_DIAMETER_FROM_TITAN_DEG / 0.52;
    expect(vsMoon).toBeGreaterThan(10);
    expect(vsMoon).toBeLessThan(12);
    const s = saturnInTitanSky(subSaturn)!;
    expect(s.angularDiameterDeg).toBeCloseTo(
      SATURN_ANGULAR_DIAMETER_FROM_TITAN_DEG,
      10
    );
  });

  it("is time-independent (fixed in the sky) and carries the haze caveat", () => {
    const s = saturnInTitanSky(huygens)!;
    expect(s.hazeCaveat.toLowerCase()).toContain("haze");
    // Pure function of the site only — identical on repeat calls.
    expect(saturnInTitanSky(huygens)).toEqual(s);
  });
});

describe("titanSunPosition — real rate, adopted epoch", () => {
  it("has a solar-day period of ~15.945 Earth days (synodic ≈ 15.97)", () => {
    expect(Math.abs(TITAN_SOLAR_DAY_DAYS - 15.945)).toBeLessThan(0.05);
    // The sun returns to (nearly) the same altitude one solar day later.
    const a = titanSunPosition(subSaturn, T0)!;
    const b = titanSunPosition(
      subSaturn,
      new Date(T0.getTime() + TITAN_SOLAR_DAY_DAYS * DAY_MS)
    )!;
    expect(Math.abs(a.altitudeDeg - b.altitudeDeg)).toBeLessThan(0.5);
  });

  it("cycles day and night over one Titan solar day", () => {
    let up = false;
    let down = false;
    for (let f = 0; f < 1; f += 1 / 64) {
      const alt = titanSunPosition(
        subSaturn,
        new Date(T0.getTime() + f * TITAN_SOLAR_DAY_DAYS * DAY_MS)
      )!.altitudeDeg;
      if (alt > 5) up = true;
      if (alt < -5) down = true;
    }
    expect(up).toBe(true);
    expect(down).toBe(true);
  });

  it("labels the rotational phase as adopted, not measured", () => {
    expect(titanSunPosition(huygens, T0)!.phaseNote.toLowerCase()).toContain(
      "adopted"
    );
  });
});

describe("titanSolarIrradiance", () => {
  it("is ~15 W/m² (about 1.1% of Earth's) at Saturn's true distance", () => {
    const s = titanSolarIrradiance(T0)!;
    const r = heliocentricPosition("Saturn", T0).distanceAU;
    expect(s).toBeCloseTo(1361 / (r * r), 8);
    expect(s).toBeGreaterThan(11);
    expect(s).toBeLessThan(18);
  });
});

describe("titanSurfaceFacts", () => {
  it("carries the Cassini-Huygens measured values", () => {
    expect(titanSurfaceFacts.surfaceTemperatureK).toBe(94);
    expect(titanSurfaceFacts.surfacePressureBar).toBeCloseTo(1.5, 2);
    expect(titanSurfaceFacts.surfaceGravityMs2).toBeCloseTo(1.352, 3);
    expect(titanSurfaceFacts.surfaceDaylightVsEarth).toBeCloseTo(0.001, 4);
    expect(titanSurfaceFacts.huygensLanding).toContain("2005-01-14");
    expect(titanSurfaceFacts.methaneCycle.toLowerCase()).toContain("lakes");
    expect(titanSurfaceFacts.source).toMatch(/Cassini-Huygens/);
  });
});

// ═══════════════════════ bundle, null-safety, determinism ══════════════════

describe("surfaceState bundle", () => {
  it("returns a complete Mars state", () => {
    const s = surfaceState("mars", "gale", T0)!;
    expect(s.world).toBe("mars");
    if (s.world !== "mars") return;
    expect(s.site.id).toBe("gale");
    expect(s.sun.altitudeDeg).toBeGreaterThanOrEqual(-90);
    expect(s.daylight.phase).toMatch(/^(day|twilight|night)$/);
    expect(s.sky.regime).toBeTruthy();
    expect(s.irradianceTopWm2).toBeGreaterThan(480);
    expect(s.facts.surfaceGravityMs2).toBeCloseTo(3.71, 2);
    expect(s.honesty).toMatch(/Mars24/);
  });

  it("returns a complete Titan state with truthful Saturn visibility", () => {
    const h = surfaceState("titan", "huygens", T0)!;
    expect(h.world).toBe("titan");
    if (h.world !== "titan") return;
    expect(h.saturn.visible).toBe(false);
    expect(h.sun.phaseNote).toBeTruthy();
    expect(h.facts.surfaceTemperatureK).toBe(94);
    const ss = surfaceState("titan", "sub-saturn", T0)!;
    if (ss.world !== "titan") return;
    expect(ss.saturn.visible).toBe(true);
    expect(ss.site.landingSite).toBe(false); // chosen viewpoint, not a landing
  });

  it("site lists carry the real cited sites", () => {
    expect(MARS_SITES.map((s) => s.id)).toEqual(["gale", "jezero"]);
    expect(gale.latDeg).toBeCloseTo(-4.5895, 4);
    expect(gale.lonEastDeg).toBeCloseTo(137.4417, 4);
    expect(jezero.latDeg).toBeCloseTo(18.4447, 4);
    expect(jezero.lonEastDeg).toBeCloseTo(77.4508, 4);
    expect(TITAN_SITES.map((s) => s.id)).toEqual(["huygens", "sub-saturn"]);
    expect(huygens.latDeg).toBeCloseTo(-10.573, 3);
    expect(huygens.lonEastDeg).toBeCloseTo(167.65, 2);
  });

  it("is null-safe: bad dates, unknown sites/worlds return null, never throw", () => {
    const bad = new Date(NaN);
    expect(marsSunPosition(gale, bad)).toBeNull();
    expect(marsDaylight(gale, bad)).toBeNull();
    expect(marsSkyStory(NaN)).toBeNull();
    expect(marsSolarIrradiance(bad)).toBeNull();
    expect(titanSunPosition(huygens, bad)).toBeNull();
    expect(titanSolarIrradiance(bad)).toBeNull();
    expect(saturnInTitanSky(siteAt(NaN, 0))).toBeNull();
    expect(surfaceState("mars", "nope", T0)).toBeNull();
    expect(surfaceState("titan", "gale", T0)).toBeNull();
    expect(
      surfaceState("pluto" as unknown as "mars", "gale", T0)
    ).toBeNull();
    expect(surfaceState("mars", "gale", bad)).toBeNull();
  });

  it("is deterministic: identical inputs give identical outputs", () => {
    const a = surfaceState("mars", "jezero", T0);
    const b = surfaceState("mars", "jezero", new Date(T0.getTime()));
    expect(a).toEqual(b);
    const c = surfaceState("titan", "huygens", T0);
    const d = surfaceState("titan", "huygens", new Date(T0.getTime()));
    expect(c).toEqual(d);
  });
});
