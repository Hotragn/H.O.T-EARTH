"use client";

import { Pause, Play } from "@phosphor-icons/react";
import type { OtherPlanet } from "@/lib/other-moons";

const DAY_MS = 86_400_000;
const DAYS_PER_YEAR = 365.25;

/**
 * These systems span wildly different timescales: Phobos laps Mars in ~7.65 h, the
 * inner Uranian and Neptunian moons in days, Nereid in ~360 d, and Uranus's system
 * opening swings across an ~84-year season. So the scrubber reaches +/-45 years
 * with a SIGNED-CUBIC mapping (offsetDays = sign(s)*|s|^3*MAX) - fine, day-scale
 * control near "now" for watching an inner moon move, stretching to decades at the
 * ends to watch the Uranus tilt swing across (and to reach the 2007 and ~2049
 * edge-on seasons). Play mode covers the fast end (Phobos and the inner moons); a
 * 1 yr/s preset lets you also watch the Uranus opening change.
 */
export const MAX_SCRUB_DAYS = 45 * DAYS_PER_YEAR; // ~16,436 days

/** slider position s in [-1, 1] -> offset in days (fine near 0, +/-45 yr at ends). */
export function scrubToDays(s: number): number {
  return Math.sign(s) * Math.abs(s) ** 3 * MAX_SCRUB_DAYS;
}
/** inverse: offset in days -> slider position s in [-1, 1]. */
export function daysToScrub(days: number): number {
  const c = Math.min(1, Math.abs(days) / MAX_SCRUB_DAYS);
  return Math.sign(days) * Math.cbrt(c);
}

/** Playback speeds, in simulated milliseconds advanced per real second. */
export const PLAY_SPEEDS = [
  { label: "10 min/s", msPerSec: 600_000 }, // watch Phobos (7.65 h) sweep
  { label: "1 hr/s", msPerSec: 3_600_000 },
  { label: "6 hr/s", msPerSec: 21_600_000 },
  { label: "2 day/s", msPerSec: 172_800_000 },
  { label: "30 day/s", msPerSec: 2_592_000_000 },
  { label: "1 yr/s", msPerSec: 31_557_600_000 }, // watch the Uranus opening swing
] as const;

export interface ViewPreset {
  label: string;
  /** half-width of the framed field in planet equatorial radii */
  targetReq: number;
}

/**
 * Framed-field zoom presets per planet (half-width in planet equatorial radii).
 * The dynamic range is huge, so each planet gets its own: Mars's two close moons,
 * the five Uranian moons out to Oberon (~23 Req), and Neptune's Triton (~14 Req)
 * plus a wide preset that reaches Nereid's far, eccentric orbit (a ~223 Req
 * semi-major axis) so it is not forced to a dot. When a moon still falls outside
 * the framed field (Nereid near aphelion at a tight zoom), the scene shows its
 * direction and distance at the edge rather than dropping it silently.
 */
export const VIEW_PRESETS: Record<OtherPlanet, readonly ViewPreset[]> = {
  Mars: [
    { label: "Phobos", targetReq: 3.6 }, // Phobos ~2.76 Req
    { label: "Both", targetReq: 8.5 }, // Deimos ~6.9 Req
  ],
  Uranus: [
    { label: "Inner", targetReq: 8 }, // through Ariel/Umbriel
    { label: "Titania", targetReq: 19 }, // Titania ~17.1 Req
    { label: "All", targetReq: 26 }, // Oberon ~22.8 Req
  ],
  Neptune: [
    { label: "Proteus", targetReq: 6 }, // Proteus ~4.75 Req
    { label: "Triton", targetReq: 17 }, // Triton ~14.3 Req
    { label: "Nereid", targetReq: 250 }, // Nereid's wide, eccentric orbit
  ],
} as const;

/** Sensible default zoom preset per planet (the "everything usually fits" view). */
export const DEFAULT_VIEW_IDX: Record<OtherPlanet, number> = {
  Mars: 1, // Both
  Uranus: 2, // All
  Neptune: 1, // Triton
};

/** Human-readable signed offset from now. */
function formatOffset(offsetDays: number): string {
  const a = Math.abs(offsetDays);
  const sign = offsetDays >= 0 ? "+" : "-";
  if (a < 2) return `${sign}${a.toFixed(2)} d`;
  if (a < 90) return `${sign}${a.toFixed(1)} d`;
  if (a < 2 * DAYS_PER_YEAR) return `${sign}${(a / 30.44).toFixed(1)} mo`;
  return `${sign}${(a / DAYS_PER_YEAR).toFixed(2)} yr`;
}

interface OtherMoonsTimeControlProps {
  planet: OtherPlanet;
  displayedMs: number;
  nowMs: number;
  isLive: boolean;
  playing: boolean;
  onNow: () => void;
  onPlayToggle: () => void;
  /** scrub to now + offsetDays (pauses + leaves live) */
  onScrub: (offsetDays: number) => void;
  speedIdx: number;
  onSpeedChange: (idx: number) => void;
  viewIdx: number;
  onViewChange: (idx: number) => void;
  exaggerate: boolean;
  onExaggerateToggle: () => void;
}

/**
 * Time machine + view controls. Play/Pause advances the displayed instant so an
 * inner moon (or Phobos) can be watched sweeping across; the cubic scrubber
 * reaches +/-45 years so the Uranus opening can be watched swinging across a
 * season; Now snaps back to the live 1 Hz clock. The zoom presets (per planet)
 * reframe the plane-of-sky view, and the moon-size toggle carries the honesty
 * label: markers are enlarged for visibility.
 */
export default function OtherMoonsTimeControl({
  planet,
  displayedMs,
  nowMs,
  isLive,
  playing,
  onNow,
  onPlayToggle,
  onScrub,
  speedIdx,
  onSpeedChange,
  viewIdx,
  onViewChange,
  exaggerate,
  onExaggerateToggle,
}: OtherMoonsTimeControlProps) {
  const offsetDays = (displayedMs - nowMs) / DAY_MS;
  const sliderValue = daysToScrub(offsetDays);
  const presets = VIEW_PRESETS[planet];

  return (
    <section
      aria-label="Time and view controls"
      className="pointer-events-auto absolute inset-x-3 bottom-3 animate-hud-in sm:inset-x-auto sm:bottom-5 sm:left-1/2 sm:w-[640px] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2"
    >
      <div className="hud-panel rounded-2xl px-4 py-3 sm:px-5">
        {/* row 1: transport + scrub */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onPlayToggle}
            aria-pressed={playing}
            aria-label={playing ? "Pause" : "Play"}
            className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              playing
                ? "bg-solar/20 text-solar"
                : "bg-white/5 text-dim hover:bg-white/10 hover:text-ice"
            }`}
          >
            {playing ? (
              <Pause size={16} weight="fill" aria-hidden />
            ) : (
              <Play size={16} weight="fill" aria-hidden />
            )}
          </button>

          <button
            type="button"
            onClick={onNow}
            aria-pressed={isLive}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              isLive
                ? "bg-solar/15 text-solar"
                : "bg-white/5 text-dim hover:bg-white/10 hover:text-ice"
            }`}
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${
                isLive ? "bg-solar animate-pulse-dot" : "bg-white/30"
              }`}
            />
            Now
          </button>

          <label className="flex min-w-0 grow items-center gap-3">
            <span className="sr-only">
              Scrub the displayed date (fine near now, up to +/-45 years to watch
              the Uranus opening swing)
            </span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.001}
              value={sliderValue}
              onChange={(e) => onScrub(scrubToDays(Number(e.target.value)))}
              className="time-scrubber w-full min-w-0"
            />
          </label>

          <span
            className={`w-[92px] shrink-0 text-right font-mono text-[11px] tracking-wide ${
              isLive ? "text-faint" : "text-solar"
            }`}
          >
            {isLive ? "NOW" : formatOffset(offsetDays)}
          </span>
        </div>

        {/* row 2: speed + zoom + honesty toggle */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2.5">
          <div className="flex items-center gap-1">
            <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
              speed
            </span>
            {PLAY_SPEEDS.map((sp, i) => (
              <button
                key={sp.label}
                type="button"
                onClick={() => onSpeedChange(i)}
                aria-pressed={i === speedIdx}
                className={`cursor-pointer rounded-full px-2 py-1 font-mono text-[10px] tracking-wide transition-colors duration-200 ${
                  i === speedIdx ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
              zoom
            </span>
            {presets.map((v, i) => (
              <button
                key={v.label}
                type="button"
                onClick={() => onViewChange(i)}
                aria-pressed={i === viewIdx}
                className={`cursor-pointer rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors duration-200 ${
                  i === viewIdx ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onExaggerateToggle}
            aria-pressed={exaggerate}
            title="Real moons are tiny against these already-tiny disks. Enlarged markers are a legibility choice, not the true angular size."
            className={`ml-auto cursor-pointer rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              exaggerate
                ? "border-solar/50 bg-solar/10 text-solar"
                : "border-line text-dim hover:text-ice"
            }`}
          >
            {exaggerate ? "Moon size: exaggerated" : "Moon size: true"}
          </button>
        </div>
      </div>
    </section>
  );
}
