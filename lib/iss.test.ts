import { describe, expect, it } from "vitest";
import { subsolarPoint } from "./solar";
import {
  groundTrack,
  inclinationDeg,
  isSunlit,
  nextPasses,
  orbitalPeriodMinutes,
  parseTle,
  propagate,
  tleAgeDays,
  tleEpoch,
} from "./iss";

/**
 * Acceptance tests for the SGP4 ISS propagation layer.
 *
 * REAL TLE — International Space Station (ISS / ZARYA), NORAD Cat. ID 25544,
 * retrieved from CelesTrak GP data (celestrak.org/NORAD/elements/gp.php?CATNR=25544)
 * on 2026-07-18. Epoch is 2026 day-of-year 199.86307315 == 2026-07-18T20:42:49Z.
 * We assert against the ISS's known, published orbital characteristics.
 */
const ISS_L1 =
  "1 25544U 98067A   26199.86307315  .00004074  00000+0  81939-4 0  9998";
const ISS_L2 =
  "2 25544  51.6317 143.3357 0006808 311.9482  48.0925 15.49045026576665";

/** A fixed instant right at the TLE epoch — keeps every test deterministic and
 *  minimizes SGP4 propagation error (accuracy degrades with age from epoch). */
const AT_EPOCH = new Date(Date.UTC(2026, 6, 18, 21, 0, 0));

describe("propagate — ISS instantaneous state", () => {
  const state = propagate(ISS_L1, ISS_L2, AT_EPOCH);

  it("returns a state (SGP4 succeeds on a valid ISS TLE)", () => {
    expect(state).not.toBeNull();
  });

  it("altitude is in the ISS band ~370–460 km", () => {
    expect(state!.altitudeKm).toBeGreaterThan(370);
    expect(state!.altitudeKm).toBeLessThan(460);
  });

  it("latitude never exceeds the orbital inclination (±51.6°, +ellipsoid margin)", () => {
    // Geodetic latitude can slightly exceed the 51.63° inclination because
    // geodetic latitude > geocentric latitude on the WGS ellipsoid (peaks ~51.8°).
    expect(Math.abs(state!.latitude)).toBeLessThanOrEqual(52);
  });

  it("inertial speed is ~7.6–7.7 km/s", () => {
    expect(state!.velocityKmS).toBeGreaterThan(7.6);
    expect(state!.velocityKmS).toBeLessThan(7.7);
  });

  it("longitude is normalized to [-180, 180)", () => {
    expect(state!.longitude).toBeGreaterThanOrEqual(-180);
    expect(state!.longitude).toBeLessThan(180);
  });

  it("exposes the ECI (TEME) position/velocity and a GMST", () => {
    expect(Number.isFinite(state!.eci.position.x)).toBe(true);
    expect(Number.isFinite(state!.eci.velocity.z)).toBe(true);
    expect(Number.isFinite(state!.gmst)).toBe(true);
  });
});

describe("orbital element helpers", () => {
  it("orbitalPeriodMinutes ≈ 92–93 min (from mean motion in line 2)", () => {
    const p = orbitalPeriodMinutes(ISS_L2)!;
    expect(p).toBeGreaterThan(92);
    expect(p).toBeLessThan(93);
  });

  it("inclinationDeg ≈ 51.6°", () => {
    expect(inclinationDeg(ISS_L2)!).toBeCloseTo(51.63, 1);
  });

  it("tleEpoch parses to the published epoch date (2026-07-18)", () => {
    const epoch = tleEpoch(ISS_L1)!;
    expect(epoch).toBeInstanceOf(Date);
    expect(epoch.getUTCFullYear()).toBe(2026);
    expect(epoch.getUTCMonth()).toBe(6); // July (0-indexed)
    expect(epoch.getUTCDate()).toBe(18);
  });

  it("tleAgeDays is positive when now is after the epoch", () => {
    const age = tleAgeDays(ISS_L1, new Date(Date.UTC(2026, 6, 25)))!;
    expect(age).toBeGreaterThan(0);
    expect(age).toBeCloseTo(6.14, 0); // ~6 days after 2026-07-18T20:42Z
  });
});

describe("groundTrack", () => {
  const track = groundTrack(ISS_L1, ISS_L2, AT_EPOCH);

  it("samples roughly one orbit", () => {
    // ~93 min / 60 s ≈ 93 samples.
    expect(track.length).toBeGreaterThan(80);
    expect(track.length).toBeLessThan(110);
  });

  it("stays within the inclination-bounded latitude band (±52°)", () => {
    for (const p of track) {
      expect(Math.abs(p.lat)).toBeLessThanOrEqual(52);
    }
  });

  it("reaches both hemispheres and spans a wide longitude range over one orbit", () => {
    const lats = track.map((p) => p.lat);
    expect(Math.max(...lats)).toBeGreaterThan(40);
    expect(Math.min(...lats)).toBeLessThan(-40);
    const lons = track.map((p) => p.lon);
    expect(Math.max(...lons) - Math.min(...lons)).toBeGreaterThan(60);
  });

  it("altitude stays in the ISS band on every sample", () => {
    for (const p of track) {
      expect(p.altitudeKm).toBeGreaterThan(370);
      expect(p.altitudeKm).toBeLessThan(460);
    }
  });
});

describe("nextPasses — visible passes over a mid-latitude observer", () => {
  // Boston, MA (~42.36°N). ISS inclination 51.6° > 42°, so it does pass overhead.
  const passes = nextPasses(ISS_L1, ISS_L2, 42.36, -71.06, 20, AT_EPOCH, {
    days: 5,
  });

  it("finds at least one pass in the next 5 days", () => {
    expect(passes.length).toBeGreaterThan(0);
  });

  it("each pass is well-ordered: start < culmination < end", () => {
    for (const p of passes) {
      expect(p.start.getTime()).toBeLessThan(p.maxElevationTime.getTime());
      expect(p.maxElevationTime.getTime()).toBeLessThan(p.end.getTime());
    }
  });

  it("peak elevation is in (0, 90] and above the 10° threshold", () => {
    for (const p of passes) {
      expect(p.maxElevationDeg).toBeGreaterThan(0);
      expect(p.maxElevationDeg).toBeLessThanOrEqual(90);
      expect(p.maxElevationDeg).toBeGreaterThanOrEqual(10 - 1e-6);
    }
  });

  it("azimuths are compass bearings in [0, 360)", () => {
    for (const p of passes) {
      for (const az of [p.startAzimuth, p.maxAzimuth, p.endAzimuth]) {
        expect(az).toBeGreaterThanOrEqual(0);
        expect(az).toBeLessThan(360);
      }
    }
  });

  it("reports honest visibility fields (sunlit + observer darkness)", () => {
    for (const p of passes) {
      expect(typeof p.visible).toBe("boolean");
      expect(typeof p.satSunlit).toBe("boolean");
      expect(Number.isFinite(p.observerSunElevationDeg)).toBe(true);
      // visible ⇒ the ISS is sunlit AND the observer's Sun is below −6°.
      if (p.visible) {
        expect(p.satSunlit).toBe(true);
        expect(p.observerSunElevationDeg).toBeLessThan(-6);
      }
    }
  });

  it("passes are chronologically ordered", () => {
    for (let i = 1; i < passes.length; i++) {
      expect(passes[i].start.getTime()).toBeGreaterThan(
        passes[i - 1].end.getTime()
      );
    }
  });
});

describe("isSunlit", () => {
  it("returns a boolean for a propagated ISS position", () => {
    const state = propagate(ISS_L1, ISS_L2, AT_EPOCH)!;
    expect(typeof isSunlit(state.eci.position, AT_EPOCH)).toBe("boolean");
    expect(typeof isSunlit(
      { latitude: state.latitude, longitude: state.longitude, altitudeKm: state.altitudeKm },
      AT_EPOCH
    )).toBe("boolean");
  });

  it("a point directly under the Sun (subsolar point) is sunlit", () => {
    const sub = subsolarPoint(AT_EPOCH);
    expect(
      isSunlit({ latitude: sub.lat, longitude: sub.lon, altitudeKm: 420 }, AT_EPOCH)
    ).toBe(true);
  });

  it("the antipode of the subsolar point at low altitude is in shadow", () => {
    const sub = subsolarPoint(AT_EPOCH);
    const antiLon = sub.lon > 0 ? sub.lon - 180 : sub.lon + 180;
    expect(
      isSunlit({ latitude: -sub.lat, longitude: antiLon, altitudeKm: 420 }, AT_EPOCH)
    ).toBe(false);
  });
});

describe("determinism and null-safety", () => {
  it("is deterministic: same TLE + date ⇒ identical state", () => {
    const a = propagate(ISS_L1, ISS_L2, AT_EPOCH);
    const b = propagate(ISS_L1, ISS_L2, AT_EPOCH);
    expect(a).toEqual(b);
  });

  it("garbage TLE returns null / empty, never throws", () => {
    expect(() => propagate("garbage", "not a tle", AT_EPOCH)).not.toThrow();
    expect(propagate("garbage", "not a tle", AT_EPOCH)).toBeNull();
    expect(parseTle("garbage", "not a tle")).toBeNull();
    expect(groundTrack("garbage", "not a tle", AT_EPOCH)).toEqual([]);
    expect(
      nextPasses("garbage", "not a tle", 42, -71, 0, AT_EPOCH)
    ).toEqual([]);
    expect(tleEpoch("nope")).toBeNull();
    expect(tleAgeDays("nope")).toBeNull();
    expect(orbitalPeriodMinutes("nope")).toBeNull();
    expect(inclinationDeg("nope")).toBeNull();
  });

  it("empty-string TLE lines return null without throwing", () => {
    expect(() => parseTle("", "")).not.toThrow();
    expect(parseTle("", "")).toBeNull();
    expect(propagate("", "", AT_EPOCH)).toBeNull();
  });
});
