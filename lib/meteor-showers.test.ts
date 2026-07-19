import { describe, expect, it } from "vitest";
import { localSiderealTimeDeg, raDecToVector3 } from "./celestial";
import {
  activityFraction,
  currentlyActiveShowers,
  daysToPeak,
  isActive,
  isNearPeak,
  isRadiantUp,
  monthDayToDayOfYear,
  nextShower,
  observedRateEstimate,
  radiantAltAz,
  radiantVector3,
  showerState,
  showerStrength,
  solarLongitudeDeg,
  velocityClass,
  type MeteorShower,
} from "./meteor-showers";

/**
 * Physics acceptance tests for the meteor-shower layer. Reference values and
 * their sources:
 *   • Solar longitude λ☉: Meeus, *Astronomical Algorithms* 2nd ed., Ch. 25.
 *     Season checkpoints λ☉ = 0/90/180/270 at the 2026 equinoxes/solstices; the
 *     Perseid peak λ☉ ≈ 140° (~Aug 12–13) and Geminid peak λ☉ ≈ 262° (~Dec 14),
 *     IMO working list. Expected values were computed directly from the series
 *     (e.g. 2026-08-12 12:00 UT → 139.81°, 2026-12-14 12:00 UT → 262.50°).
 *   • ZHR→observed: IMO ZHR definition, observed ≈ ZHR·sin(hR).
 *   • Radiant geometry delegates to lib/celestial (Meeus Ch. 12/13), spot-checked
 *     against a radiant placed at the observer's zenith → altitude ≈ 90°.
 */

// ── year-agnostic minimal angular distance on the 360° circle (for the λ☉ wrap
//    near 0°/360°, where 359.4° and 0° are only 0.6° apart). ──
function angDist(a: number, b: number): number {
  return Math.abs((((a - b) % 360) + 540) % 360 - 180);
}

/** A Perseid-like shower (IMO working-list figures). */
const PERSEIDS: MeteorShower = {
  code: "PER",
  name: "Perseids",
  radiant_ra: 48.0,
  radiant_dec: 58.0,
  peak_date: "08-12",
  peak_solar_longitude: 140.0,
  active_start: "07-17",
  active_end: "08-24",
  zhr: 100,
  velocity_kms: 59,
  parent_body: "109P/Swift–Tuttle",
  parent_type: "comet",
};

/** A Quadrantid-like shower — active window crosses New Year (year-wrap). */
const QUADRANTIDS: MeteorShower = {
  code: "QUA",
  name: "Quadrantids",
  radiant_ra: 230.0,
  radiant_dec: 49.0,
  peak_date: "01-03",
  peak_solar_longitude: 283.0,
  active_start: "12-28",
  active_end: "01-12",
  zhr: 120,
  velocity_kms: 41,
  parent_body: "2003 EH1",
  parent_type: "asteroid",
};

// ─────────────────────────── 1. solar longitude ────────────────────────────

describe("solarLongitudeDeg (Meeus Ch. 25)", () => {
  it("≈ 0° at the March equinox (2026-03-20)", () => {
    const l = solarLongitudeDeg(new Date(Date.UTC(2026, 2, 20, 0)))!;
    expect(angDist(l, 0)).toBeLessThan(1.5); // 359.39°, i.e. 0.61° short of 360
  });

  it("≈ 90° at the June solstice (2026-06-21)", () => {
    const l = solarLongitudeDeg(new Date(Date.UTC(2026, 5, 21, 12)))!;
    expect(angDist(l, 90)).toBeLessThan(1.5);
  });

  it("≈ 180° at the September equinox (2026-09-22)", () => {
    const l = solarLongitudeDeg(new Date(Date.UTC(2026, 8, 22, 12)))!;
    expect(angDist(l, 180)).toBeLessThan(1.5);
  });

  it("≈ 270° at the December solstice (2026-12-21)", () => {
    const l = solarLongitudeDeg(new Date(Date.UTC(2026, 11, 21, 12)))!;
    expect(angDist(l, 270)).toBeLessThan(1.5);
  });

  it("Perseid peak (Aug 12) → λ☉ ≈ 139–141°", () => {
    const l = solarLongitudeDeg(new Date(Date.UTC(2026, 7, 12, 12)))!;
    expect(l).toBeGreaterThan(139);
    expect(l).toBeLessThan(141);
    expect(l).toBeCloseTo(139.81, 1);
  });

  it("Geminid peak (Dec 14) → λ☉ ≈ 262°", () => {
    const l = solarLongitudeDeg(new Date(Date.UTC(2026, 11, 14, 12)))!;
    expect(l).toBeCloseTo(262.5, 1);
  });

  it("always returns a value in [0, 360)", () => {
    for (let m = 0; m < 12; m++) {
      const l = solarLongitudeDeg(new Date(Date.UTC(2026, m, 15, 6)))!;
      expect(l).toBeGreaterThanOrEqual(0);
      expect(l).toBeLessThan(360);
    }
  });

  it("advances ~0.9856°/day (360° over a year)", () => {
    const a = solarLongitudeDeg(new Date(Date.UTC(2026, 4, 1)))!;
    const b = solarLongitudeDeg(new Date(Date.UTC(2026, 4, 2)))!;
    let d = b - a;
    if (d < 0) d += 360;
    expect(d).toBeGreaterThan(0.95);
    expect(d).toBeLessThan(1.02);
  });

  it("returns null on an invalid Date (never throws)", () => {
    expect(solarLongitudeDeg(new Date(NaN))).toBeNull();
    // @ts-expect-error — deliberately bad input
    expect(solarLongitudeDeg("2026-08-12")).toBeNull();
  });
});

// ─────────────────────── 2. calendar / month-day helper ────────────────────

describe("monthDayToDayOfYear (non-leap reference calendar)", () => {
  it("Jan 1 = 1, Dec 31 = 365, Mar 1 = 60", () => {
    expect(monthDayToDayOfYear("01-01")).toBe(1);
    expect(monthDayToDayOfYear("12-31")).toBe(365);
    expect(monthDayToDayOfYear("03-01")).toBe(60);
  });

  it("null on malformed input", () => {
    expect(monthDayToDayOfYear("not-a-date")).toBeNull();
    expect(monthDayToDayOfYear("13-01")).toBeNull();
    expect(monthDayToDayOfYear("00-10")).toBeNull();
    // @ts-expect-error — deliberately bad input
    expect(monthDayToDayOfYear(null)).toBeNull();
  });
});

// ─────────────────────── 3. activity + peak helpers ────────────────────────

describe("isActive (year-agnostic window, year-wrap aware)", () => {
  it("Perseids active on Aug 1 and Aug 12, not on Sep 1", () => {
    expect(isActive(PERSEIDS, new Date(Date.UTC(2026, 7, 1)))).toBe(true);
    expect(isActive(PERSEIDS, new Date(Date.UTC(2026, 7, 12)))).toBe(true);
    expect(isActive(PERSEIDS, new Date(Date.UTC(2026, 8, 1)))).toBe(false);
  });

  it("Quadrantids (Dec 28 → Jan 12 wrap) active on Jan 1 and Dec 30, not Feb 1", () => {
    expect(isActive(QUADRANTIDS, new Date(Date.UTC(2026, 0, 1)))).toBe(true);
    expect(isActive(QUADRANTIDS, new Date(Date.UTC(2026, 11, 30)))).toBe(true);
    expect(isActive(QUADRANTIDS, new Date(Date.UTC(2026, 1, 1)))).toBe(false);
  });

  it("null on a malformed shower / bad date", () => {
    expect(isActive({ ...PERSEIDS, active_start: "bad" }, new Date())).toBeNull();
    expect(isActive(PERSEIDS, new Date(NaN))).toBeNull();
    expect(isActive(null, new Date())).toBeNull();
  });
});

describe("daysToPeak / isNearPeak", () => {
  it("is positive before the peak, negative after (Perseids, peak Aug 12)", () => {
    expect(daysToPeak(PERSEIDS, new Date(Date.UTC(2026, 7, 10)))).toBe(2);
    expect(daysToPeak(PERSEIDS, new Date(Date.UTC(2026, 7, 12)))).toBe(0);
    expect(daysToPeak(PERSEIDS, new Date(Date.UTC(2026, 7, 15)))).toBe(-3);
  });

  it("wraps the year for Quadrantids (peak Jan 3, from Dec 30 → +4 days)", () => {
    expect(daysToPeak(QUADRANTIDS, new Date(Date.UTC(2026, 11, 30)))).toBe(4);
  });

  it("isNearPeak: within ±1 day by default", () => {
    expect(isNearPeak(PERSEIDS, new Date(Date.UTC(2026, 7, 12)))).toBe(true);
    expect(isNearPeak(PERSEIDS, new Date(Date.UTC(2026, 7, 13)))).toBe(true);
    expect(isNearPeak(PERSEIDS, new Date(Date.UTC(2026, 7, 15)))).toBe(false);
    expect(isNearPeak(PERSEIDS, new Date(Date.UTC(2026, 7, 15)), 3)).toBe(true);
  });

  it("null on bad input", () => {
    expect(daysToPeak({ ...PERSEIDS, peak_date: "" }, new Date())).toBeNull();
    expect(isNearPeak(PERSEIDS, new Date(NaN))).toBeNull();
  });
});

describe("activityFraction (illustrative triangular profile)", () => {
  it("is 1 at the peak", () => {
    expect(activityFraction(PERSEIDS, new Date(Date.UTC(2026, 7, 12)))).toBeCloseTo(
      1,
      9
    );
  });

  it("tapers to ~0 at the active-window edges", () => {
    expect(activityFraction(PERSEIDS, new Date(Date.UTC(2026, 6, 17)))).toBeCloseTo(
      0,
      9
    ); // active_start
    expect(activityFraction(PERSEIDS, new Date(Date.UTC(2026, 7, 24)))).toBeCloseTo(
      0,
      9
    ); // active_end
  });

  it("is ~0.5 halfway up the rising side (Jul 30, peak Aug 12, start Jul 17)", () => {
    expect(activityFraction(PERSEIDS, new Date(Date.UTC(2026, 6, 30)))).toBeCloseTo(
      0.5,
      9
    );
  });

  it("is 0 outside the active window and always within [0, 1]", () => {
    expect(activityFraction(PERSEIDS, new Date(Date.UTC(2026, 8, 15)))).toBe(0);
    for (let d = 17; d <= 31; d++) {
      const f = activityFraction(PERSEIDS, new Date(Date.UTC(2026, 6, d)))!;
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });

  it("null on bad input", () => {
    expect(activityFraction(PERSEIDS, new Date(NaN))).toBeNull();
    expect(activityFraction(null, new Date())).toBeNull();
  });
});

describe("currentlyActiveShowers / nextShower", () => {
  const list = [PERSEIDS, QUADRANTIDS];

  it("returns only the showers active on the date", () => {
    const aug1 = currentlyActiveShowers(list, new Date(Date.UTC(2026, 7, 1)));
    expect(aug1.map((s) => s.code)).toEqual(["PER"]);
    const jan1 = currentlyActiveShowers(list, new Date(Date.UTC(2026, 0, 1)));
    expect(jan1.map((s) => s.code)).toEqual(["QUA"]);
  });

  it("nextShower picks the soonest upcoming peak", () => {
    // Jul 1 → Perseids (Aug 12) are next, not Quadrantids (next Jan).
    expect(nextShower(list, new Date(Date.UTC(2026, 6, 1)))?.code).toBe("PER");
    // Dec 20 → Quadrantids (Jan 3) are next.
    expect(nextShower(list, new Date(Date.UTC(2026, 11, 20)))?.code).toBe("QUA");
  });

  it("null/empty-safe", () => {
    expect(currentlyActiveShowers(null, new Date())).toEqual([]);
    expect(nextShower([], new Date())).toBeNull();
    expect(nextShower(null, new Date())).toBeNull();
  });
});

// ─────────────────────── 4. observed-rate estimate ─────────────────────────

describe("observedRateEstimate (ZHR·sin(hR))", () => {
  it("ZHR 100 at radiant altitude 90° → ~100", () => {
    expect(observedRateEstimate(PERSEIDS, 90)).toBeCloseTo(100, 6);
  });

  it("ZHR 100 at 30° → ~50 (sin 30° = 0.5)", () => {
    expect(observedRateEstimate(PERSEIDS, 30)).toBeCloseTo(50, 6);
  });

  it("radiant at or below the horizon → null", () => {
    expect(observedRateEstimate(PERSEIDS, 0)).toBeNull();
    expect(observedRateEstimate(PERSEIDS, -10)).toBeNull();
  });

  it("scales by an explicit activity factor", () => {
    expect(observedRateEstimate(PERSEIDS, 90, { activityFactor: 0.5 })).toBeCloseTo(
      50,
      6
    );
  });

  it("scales by activityFraction when given a date (peak → full, off-peak → less)", () => {
    const peak = observedRateEstimate(PERSEIDS, 90, {
      date: new Date(Date.UTC(2026, 7, 12)),
    })!;
    const rising = observedRateEstimate(PERSEIDS, 90, {
      date: new Date(Date.UTC(2026, 6, 30)),
    })!;
    expect(peak).toBeCloseTo(100, 6);
    expect(rising).toBeCloseTo(50, 6); // halfway up the profile
  });

  it("null on non-finite ZHR / altitude", () => {
    expect(observedRateEstimate({ ...PERSEIDS, zhr: NaN }, 45)).toBeNull();
    expect(observedRateEstimate(PERSEIDS, NaN)).toBeNull();
    expect(observedRateEstimate(null, 45)).toBeNull();
  });
});

// ──────────────────── 5. radiant geometry (reuse lib/celestial) ─────────────

describe("radiantAltAz / radiantVector3 / isRadiantUp", () => {
  it("a radiant at the observer's zenith reads altitude ≈ 90°", () => {
    // lon 0, choose radiant RA = LST (hour angle 0) and Dec = latitude.
    const date = new Date(Date.UTC(2026, 6, 18, 3, 0, 0));
    const lat = 42.36;
    const lst = localSiderealTimeDeg(date, 0)!;
    const zenithShower: MeteorShower = {
      ...PERSEIDS,
      radiant_ra: lst,
      radiant_dec: lat,
    };
    const hz = radiantAltAz(zenithShower, lat, 0, date)!;
    expect(hz.altitude).toBeCloseTo(90, 4);
  });

  it("radiantVector3 delegates to lib/celestial raDecToVector3", () => {
    expect(radiantVector3(PERSEIDS)).toEqual(
      raDecToVector3(PERSEIDS.radiant_ra, PERSEIDS.radiant_dec)
    );
    expect(radiantVector3(PERSEIDS, 7.5)).toEqual(
      raDecToVector3(PERSEIDS.radiant_ra, PERSEIDS.radiant_dec, 7.5)
    );
  });

  it("isRadiantUp: a Dec +58 radiant is up from mid-north, agrees with alt sign", () => {
    const date = new Date(Date.UTC(2026, 7, 12, 4, 0, 0));
    const up = isRadiantUp(PERSEIDS, 45, -71, date);
    const hz = radiantAltAz(PERSEIDS, 45, -71, date)!;
    expect(up).toBe(hz.altitude > 0);
  });

  it("null on malformed radiant coordinates / bad input", () => {
    expect(radiantAltAz({ ...PERSEIDS, radiant_ra: NaN }, 45, -71, new Date())).toBeNull();
    expect(radiantVector3({ ...PERSEIDS, radiant_dec: NaN })).toBeNull();
    expect(isRadiantUp(null, 45, -71, new Date())).toBeNull();
  });
});

// ────────────────────────────── 6. classification ──────────────────────────

describe("showerStrength", () => {
  it("thresholds: weak <10, minor 10–50, strong 50–100, major ≥100", () => {
    expect(showerStrength(5)).toBe("weak");
    expect(showerStrength(9.9)).toBe("weak");
    expect(showerStrength(10)).toBe("minor");
    expect(showerStrength(49)).toBe("minor");
    expect(showerStrength(50)).toBe("strong");
    expect(showerStrength(99)).toBe("strong");
    expect(showerStrength(100)).toBe("major"); // Perseids/Geminids
    expect(showerStrength(150)).toBe("major");
  });

  it("null on bad input", () => {
    expect(showerStrength(null)).toBeNull();
    expect(showerStrength(NaN)).toBeNull();
    expect(showerStrength(undefined)).toBeNull();
  });
});

describe("velocityClass", () => {
  it("thresholds: slow <30, medium 30–50, fast ≥50 km/s", () => {
    expect(velocityClass(20)).toBe("slow"); // Draconids ~20
    expect(velocityClass(29.9)).toBe("slow");
    expect(velocityClass(30)).toBe("medium");
    expect(velocityClass(35)).toBe("medium"); // Geminids ~35
    expect(velocityClass(50)).toBe("fast");
    expect(velocityClass(59)).toBe("fast"); // Perseids ~59
    expect(velocityClass(71)).toBe("fast"); // Leonids ~71
  });

  it("null on bad input", () => {
    expect(velocityClass(null)).toBeNull();
    expect(velocityClass(NaN)).toBeNull();
  });
});

// ─────────────────────────── 7. HUD snapshot ───────────────────────────────

describe("showerState", () => {
  it("bundles activity, classification and radiant geometry in one call", () => {
    const date = new Date(Date.UTC(2026, 7, 12, 4, 0, 0)); // Perseid peak night
    const st = showerState(PERSEIDS, 45, -71, date)!;
    expect(st.code).toBe("PER");
    expect(st.active).toBe(true);
    expect(st.nearPeak).toBe(true);
    expect(st.strength).toBe("major");
    expect(st.velocity).toBe("fast");
    expect(st.activity).toBeCloseTo(1, 6);
    expect(st.radiant).not.toBeNull();
  });

  it("null only when the shower record itself is missing", () => {
    expect(showerState(null, 45, -71, new Date())).toBeNull();
  });
});

// ─────────────────────────── null-safety + determinism ─────────────────────

describe("null-safety + determinism", () => {
  it("no meteor-shower function throws on garbage input", () => {
    const bad = { code: "X", name: "X" } as unknown as MeteorShower;
    const d = new Date(NaN);
    expect(() => {
      solarLongitudeDeg(d);
      isActive(bad, d);
      daysToPeak(bad, d);
      isNearPeak(bad, d);
      activityFraction(bad, d);
      observedRateEstimate(bad, NaN);
      radiantAltAz(bad, NaN, NaN, d);
      radiantVector3(bad);
      isRadiantUp(bad, NaN, NaN, d);
      showerStrength(bad.zhr);
      velocityClass(bad.velocity_kms);
      showerState(bad, NaN, NaN, d);
    }).not.toThrow();
  });

  it("is a pure function of its inputs", () => {
    const date = new Date(Date.UTC(2031, 1, 2, 3, 4, 5));
    expect(solarLongitudeDeg(date)).toBe(solarLongitudeDeg(date));
    expect(observedRateEstimate(PERSEIDS, 42)).toBe(
      observedRateEstimate(PERSEIDS, 42)
    );
    expect(radiantAltAz(PERSEIDS, 42.36, -71.06, date)).toEqual(
      radiantAltAz(PERSEIDS, 42.36, -71.06, date)
    );
  });
});
