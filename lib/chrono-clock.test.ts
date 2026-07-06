import { describe, expect, it } from "vitest";
import {
  CHRONO_MAX_YEAR,
  CHRONO_MIN_YEAR,
  CHRONO_SPEEDS,
  advanceYear,
  clampYear,
  formatYear,
  formatYearShort,
  progressToYear,
  yearToApproxDate,
  yearToProgress,
} from "./chrono-clock";

/**
 * Unit tests for the Virtual Earth timeline clock. It's a pure arithmetic
 * engine, so we test the invariants the scene relies on: clamping, linear
 * advance at the configured speed, scrubber round-tripping, and the BCE/CE
 * labeling convention (no year zero — year 0 labels as "1 BCE").
 */

describe("clampYear", () => {
  it("clamps below the min and above the max", () => {
    expect(clampYear(-99999)).toBe(CHRONO_MIN_YEAR);
    expect(clampYear(99999)).toBe(CHRONO_MAX_YEAR);
  });
  it("passes through years inside the span", () => {
    expect(clampYear(1500)).toBe(1500);
  });
});

describe("advanceYear", () => {
  it("advances linearly at yearsPerSecond", () => {
    // 10 yr/s for 2 s → +20 years
    expect(advanceYear(1000, 2, 10)).toBeCloseTo(1020, 9);
  });
  it("can run backward with a negative dt", () => {
    expect(advanceYear(1000, -1, 100)).toBeCloseTo(900, 9);
  });
  it("holds at the max (arrives at present and stays)", () => {
    expect(advanceYear(CHRONO_MAX_YEAR - 1, 100, 100)).toBe(CHRONO_MAX_YEAR);
  });
  it("holds at the min going backward", () => {
    expect(advanceYear(CHRONO_MIN_YEAR + 1, 100, -100)).toBe(CHRONO_MIN_YEAR);
  });
});

describe("scrubber progress round-trips", () => {
  it("progressToYear is the inverse of yearToProgress", () => {
    for (const y of [-10000, -3200, 0, 1, 1440, 1944, 2026]) {
      const p = yearToProgress(y);
      expect(progressToYear(p)).toBeCloseTo(y, 6);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
  it("maps span endpoints to 0 and 1", () => {
    expect(yearToProgress(CHRONO_MIN_YEAR)).toBeCloseTo(0, 9);
    expect(yearToProgress(CHRONO_MAX_YEAR)).toBeCloseTo(1, 9);
  });
});

describe("speed presets", () => {
  it("span the requested range from ~1 day/s up to millennia/s", () => {
    const ids = CHRONO_SPEEDS.map((s) => s.id);
    expect(ids).toContain("day");
    expect(ids).toContain("year");
    expect(ids).toContain("century");
    // day preset is ~1/365 yr per second (one simulated day per second)
    const day = CHRONO_SPEEDS.find((s) => s.id === "day")!;
    expect(day.yearsPerSecond).toBeCloseTo(1 / 365.2425, 6);
    // strictly increasing speed
    for (let i = 1; i < CHRONO_SPEEDS.length; i++) {
      expect(CHRONO_SPEEDS[i].yearsPerSecond).toBeGreaterThan(
        CHRONO_SPEEDS[i - 1].yearsPerSecond
      );
    }
  });

  it("the top preset can traverse 10,000 years in a couple of minutes", () => {
    const top = CHRONO_SPEEDS[CHRONO_SPEEDS.length - 1];
    const secondsFor10k = 10_000 / top.yearsPerSecond;
    expect(secondsFor10k).toBeLessThan(120); // watchable, not hours
  });
});

describe("year labels (historical BCE/CE convention, no year zero)", () => {
  it("labels positive years CE", () => {
    expect(formatYear(1944)).toBe("1944 CE");
    expect(formatYear(1)).toBe("1 CE");
  });
  it("labels year 0 as 1 BCE and negatives shifted", () => {
    expect(formatYear(0)).toBe("1 BCE");
    expect(formatYear(-1)).toBe("2 BCE");
    expect(formatYear(-3200)).toBe("3201 BCE");
  });
  it("short labels compact thousands", () => {
    expect(formatYearShort(2000)).toBe("2000 CE");
    expect(formatYearShort(-9999)).toBe("10k BCE");
  });
});

describe("yearToApproxDate (lighting cue only)", () => {
  it("returns a valid Date for representable and deep-past years", () => {
    for (const y of [-10000, -3200, 1, 1500, 2026]) {
      const d = yearToApproxDate(y);
      expect(d instanceof Date).toBe(true);
      expect(Number.isNaN(d.getTime())).toBe(false);
    }
  });
});
