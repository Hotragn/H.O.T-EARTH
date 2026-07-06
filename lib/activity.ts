/**
 * Simulated city activity index — clearly labeled a SIMULATION in the UI.
 *
 * The index is 0..1 and is derived only from REAL inputs: local solar time
 * (longitude + current UTC) and the local day of week. The shape is a plain
 * diurnal curve — commute peaks around 08:00 and 18:00 local, a midday
 * plateau, an evening shoulder, and a deep minimum around 03:00 — with the
 * commute peaks damped on weekends. No measured activity data is involved,
 * and the Living Earth legend says so verbatim.
 *
 * Unit-tested in lib/activity.test.ts (e.g. 03:00 local << 08:00 local).
 */

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/**
 * Local SOLAR time in hours (0..24) for a longitude at a UTC instant:
 * lon / 15 hours ahead of UTC. This is mean solar time, not the political
 * timezone — honest about what it is (we ship no tz database).
 */
export function localSolarHours(lonDeg: number, utcMs: number): number {
  const utcHours = (utcMs % DAY_MS) / HOUR_MS;
  return (((utcHours + lonDeg / 15) % 24) + 24) % 24;
}

/**
 * Local day of week (0 = Sunday .. 6 = Saturday) using the same
 * longitude-derived solar offset. The Unix epoch was a Thursday (+4).
 */
export function localDayOfWeek(lonDeg: number, utcMs: number): number {
  const localDays = utcMs / DAY_MS + lonDeg / 360;
  return ((Math.floor(localDays) + 4) % 7 + 7) % 7;
}

/** Circular (24 h wrap-around) gaussian bump centred on `center` hours. */
function bump(h: number, center: number, sigma: number): number {
  let d = Math.abs(h - center);
  if (d > 12) d = 24 - d;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

/**
 * Simulated activity index 0..1 for a city at `lonDeg` at UTC time `utcMs`.
 *
 * Weekday: sharp commute peaks at ~08:15 and ~18:15 local, midday plateau,
 * evening shoulder ~21:30, floor of 0.05 in the small hours (min near 03:00).
 * Weekend: commute peaks damped to ~40%, leisure midday slightly boosted.
 */
export function activityIndex(lonDeg: number, utcMs: number): number {
  const h = localSolarHours(lonDeg, utcMs);
  const dow = localDayOfWeek(lonDeg, utcMs);
  const weekend = dow === 0 || dow === 6;
  const commute = weekend ? 0.4 : 1;

  const a =
    0.05 +
    0.62 * commute * bump(h, 8.25, 1.7) + // morning commute
    0.72 * commute * bump(h, 18.25, 2.4) + // evening commute
    (weekend ? 0.55 : 0.38) * bump(h, 13, 3.4) + // midday
    0.35 * bump(h, 21.5, 1.9); // evening shoulder

  return Math.min(Math.max(a, 0), 1);
}
