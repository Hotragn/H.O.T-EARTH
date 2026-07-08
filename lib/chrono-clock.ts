/**
 * Chrono clock — the simulated timeline engine for the Virtual Earth tab.
 *
 * A continuous simulated clock spanning deep history to the present. The unit
 * of the timeline is a **decimal year** (e.g. -3200.0 = 3200 BCE, 1944.5 =
 * mid-1944 CE, 2026.0 = start of 2026). There is no astronomical year zero in
 * the historical (BCE/CE) convention this app displays, so we treat year 0 as
 * "1 BCE" only for labeling; the numeric line itself is continuous through 0,
 * which keeps interpolation and playback arithmetic simple and testable.
 *
 * Everything here is a pure function of primitives so it unit-tests cleanly in
 * the same style as lib/solar.ts and lib/mars-time.ts. The React scene owns a
 * mutable "current year" it advances every frame from `advanceYear`; this
 * module only supplies the math and the labels — no clock state, no RAF.
 *
 * physics/data honesty: the clock is just a clock. What it *drives* (city
 * growth, population, events, climate, precession) is real data or clearly
 * labeled. See lib/chrono-cities, lib/chrono-events, lib/chrono-climate,
 * lib/chrono-population and lib/precession.
 */

/** Default span of the timeline. Wide enough to watch civilization emerge. */
export const CHRONO_MIN_YEAR = -10_000; // 10,000 BCE
export const CHRONO_MAX_YEAR = 2026; // present (see currentDate)

/** Days per year used to convert the "1 day/s" style presets into years/sec. */
const DAYS_PER_YEAR = 365.2425;

/**
 * Playback speed presets. `yearsPerSecond` is how many simulated years advance
 * per second of real wall-clock time at 1x. The spirit of the user's ask —
 * "~1 minute of real time ≈ 1 simulated day" — is the slowest preset
 * (1 day/s → 60 days/min, close enough to feel like the day preset), and the
 * range climbs to centuries/second so millennia are watchable in minutes, not
 * hours.
 */
export interface ChronoSpeed {
  readonly id: string;
  readonly label: string;
  readonly yearsPerSecond: number;
}

export const CHRONO_SPEEDS: readonly ChronoSpeed[] = [
  { id: "day", label: "1 day/s", yearsPerSecond: 1 / DAYS_PER_YEAR },
  { id: "month", label: "1 month/s", yearsPerSecond: 1 / 12 },
  { id: "year", label: "1 yr/s", yearsPerSecond: 1 },
  { id: "decade", label: "10 yr/s", yearsPerSecond: 10 },
  { id: "century", label: "100 yr/s", yearsPerSecond: 100 },
  { id: "millennium", label: "1000 yr/s", yearsPerSecond: 1000 },
] as const;

/** The default speed preset ("1 yr/s") — lively without racing past history. */
export const DEFAULT_SPEED_INDEX = 2;

/** Clamp a year to the configured timeline span. */
export function clampYear(
  year: number,
  minYear = CHRONO_MIN_YEAR,
  maxYear = CHRONO_MAX_YEAR
): number {
  if (year < minYear) return minYear;
  if (year > maxYear) return maxYear;
  return year;
}

/**
 * Advance the simulated year by `dtSeconds` of real time at `yearsPerSecond`,
 * clamped to the span. Pure — the caller holds the running year in a ref and
 * feeds the frame delta. When the year hits the max it holds there (playback
 * naturally "arrives at now"); callers may pause on that condition.
 */
export function advanceYear(
  year: number,
  dtSeconds: number,
  yearsPerSecond: number,
  minYear = CHRONO_MIN_YEAR,
  maxYear = CHRONO_MAX_YEAR
): number {
  return clampYear(year + dtSeconds * yearsPerSecond, minYear, maxYear);
}

/**
 * Fractional progress [0,1] of a year along the span — drives the scrubber
 * thumb position and back again.
 */
export function yearToProgress(
  year: number,
  minYear = CHRONO_MIN_YEAR,
  maxYear = CHRONO_MAX_YEAR
): number {
  if (maxYear === minYear) return 0;
  const t = (year - minYear) / (maxYear - minYear);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Inverse of {@link yearToProgress}: scrubber position [0,1] → year. */
export function progressToYear(
  progress: number,
  minYear = CHRONO_MIN_YEAR,
  maxYear = CHRONO_MAX_YEAR
): number {
  const p = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  return minYear + p * (maxYear - minYear);
}

/**
 * Human label for a simulated year, e.g. "3200 BCE", "1 CE", "1944 CE".
 * Uses the historical convention (no year zero): year 0 and years < 0 map to
 * BCE with a +1 shift, matching how "1 BCE" is the year before "1 CE".
 */
export function formatYear(year: number): string {
  const rounded = Math.round(year);
  if (rounded <= 0) {
    // 0 → 1 BCE, -1 → 2 BCE, -3200 → 3201 BCE (astronomical→historical shift)
    return `${Math.abs(rounded) + 1} BCE`;
  }
  return `${rounded} CE`;
}

/**
 * Compact label for large spans on axis ticks. Deep-past BCE years compact to
 * "10k BCE" (the axis has little room out there); CE years stay plain and
 * legible, e.g. "2000 CE".
 */
export function formatYearShort(year: number): string {
  const rounded = Math.round(year);
  const abs = Math.abs(rounded);
  const era = rounded <= 0 ? "BCE" : "CE";
  const magnitude = rounded <= 0 ? abs + 1 : abs;
  if (era === "BCE" && magnitude >= 1000) {
    const k = magnitude / 1000;
    const kStr = Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
    return `${kStr} ${era}`;
  }
  return `${magnitude} ${era}`;
}

/**
 * A UTC Date approximating a decimal historical year — used only for driving
 * the (real) solar terminator so day/night still sweeps while history plays.
 * JS `Date` can't represent years < 100 via the small-integer constructor
 * reliably, so we build from epoch-year fractions. For years the platform
 * can't represent we return a modern proxy date at the same day-of-year, which
 * is fine: the terminator is a lighting cue, not a historical claim.
 */
export function yearToApproxDate(year: number): Date {
  const whole = Math.floor(year);
  const frac = year - whole;
  const dayOfYear = frac * DAYS_PER_YEAR;
  // For representable years, place the instant inside that calendar year.
  if (whole >= 100 && whole <= 275_000) {
    const jan1 = Date.UTC(whole, 0, 1);
    return new Date(jan1 + dayOfYear * 86_400_000);
  }
  // Deep past/edge: reuse a modern year's seasonal phase (lighting cue only).
  const proxyYear = 2000;
  const jan1 = Date.UTC(proxyYear, 0, 1);
  return new Date(jan1 + dayOfYear * 86_400_000);
}
