import { describe, expect, it } from "vitest";
import { activityIndex, localDayOfWeek, localSolarHours } from "./activity";

/** UTC ms for a date/time; 2026-07-06 is a Monday, 2026-07-04 a Saturday. */
function utc(y: number, mo: number, d: number, h = 0, mi = 0): number {
  return Date.UTC(y, mo - 1, d, h, mi);
}

describe("localSolarHours", () => {
  it("equals UTC hours at Greenwich", () => {
    expect(localSolarHours(0, utc(2026, 7, 6, 12))).toBeCloseTo(12, 6);
  });

  it("runs lon/15 hours ahead of UTC (90E = +6h, 90W = -6h)", () => {
    expect(localSolarHours(90, utc(2026, 7, 6, 12))).toBeCloseTo(18, 6);
    expect(localSolarHours(-90, utc(2026, 7, 6, 12))).toBeCloseTo(6, 6);
  });

  it("wraps across midnight", () => {
    expect(localSolarHours(180, utc(2026, 7, 6, 12))).toBeCloseTo(0, 6);
    expect(localSolarHours(-15, utc(2026, 7, 6, 0, 30))).toBeCloseTo(23.5, 6);
  });
});

describe("localDayOfWeek", () => {
  it("knows 2026-07-06 noon UTC at Greenwich is a Monday", () => {
    expect(localDayOfWeek(0, utc(2026, 7, 6, 12))).toBe(1);
  });

  it("rolls to the next local day east of the date line boundary", () => {
    // 23:00 UTC Monday + 12 h solar offset = 11:00 local Tuesday
    expect(localDayOfWeek(180, utc(2026, 7, 6, 23))).toBe(2);
    // 02:00 UTC Monday - 6 h = 20:00 local Sunday
    expect(localDayOfWeek(-90, utc(2026, 7, 6, 2))).toBe(0);
  });
});

describe("activityIndex", () => {
  // Monday at Greenwich: local solar time == UTC time.
  const monday = (h: number) => activityIndex(0, utc(2026, 7, 6, h));
  const saturday = (h: number) => activityIndex(0, utc(2026, 7, 4, h));

  it("is much lower at 3am local than at 8am local (weekday)", () => {
    expect(monday(3)).toBeLessThan(monday(8));
    expect(monday(3)).toBeLessThan(0.15);
    expect(monday(8)).toBeGreaterThan(0.5);
  });

  it("peaks around the evening commute on weekdays", () => {
    expect(monday(18)).toBeGreaterThan(monday(13));
    expect(monday(18)).toBeGreaterThan(monday(22));
  });

  it("has its minimum in the small hours", () => {
    const smallHours = monday(3);
    for (const h of [0, 6, 9, 12, 15, 18, 21]) {
      expect(smallHours).toBeLessThan(monday(h));
    }
  });

  it("damps the morning commute on weekends", () => {
    expect(saturday(8)).toBeLessThan(monday(8));
  });

  it("depends on longitude: 8am local is 8am local everywhere", () => {
    // 00:00 UTC is 08:00 local solar at 120E
    const at120E = activityIndex(120, utc(2026, 7, 6, 0));
    expect(at120E).toBeGreaterThan(0.5);
  });

  it("stays within [0, 1] across the whole day", () => {
    for (let h = 0; h < 24; h += 0.5) {
      const a = activityIndex(0, utc(2026, 7, 6, 0) + h * 3_600_000);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(1);
    }
  });
});
