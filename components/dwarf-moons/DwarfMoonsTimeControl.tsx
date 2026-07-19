"use client";

import { Pause, Play } from "@phosphor-icons/react";
import type { DwarfSystem } from "@/lib/dwarf-moons";

const DAY_MS = 86_400_000;
const DAYS_PER_YEAR = 365.25;

/**
 * These systems span two very different timescales. The MOONS orbit fast: Charon
 * laps the Pluto-Charon barycenter in ~6.4 days, the small Pluto moons in 20-38
 * days, Dysnomia in ~15.8 days, Haumea's moons in ~18-49 days, MK2 in ~18 days.
 * The system ASPECT (the tilt of the plane toward Earth) changes over CENTURIES:
 * Pluto-Charon was edge-on in 1985-1990 and is edge-on again around 2103. So the
 * scrubber reaches +/-130 years with a SIGNED-CUBIC mapping (offsetDays =
 * sign(s)*|s|^3*MAX): fine day-scale control near "now" to watch the wobble, and
 * decades at the ends to reach both edge-on seasons. Play mode covers the fast
 * end (watch Charon and the small moons circle the barycenter); a 20 yr/s preset
 * lets you also watch the aspect swing.
 */
export const MAX_SCRUB_DAYS = 130 * DAYS_PER_YEAR; // ~47,483 days

/** slider position s in [-1, 1] -> offset in days (fine near 0, +/-130 yr at ends). */
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
  { label: "6 hr/s", msPerSec: 21_600_000 }, // watch Charon (6.4 d) wobble
  { label: "1 day/s", msPerSec: 86_400_000 },
  { label: "3 day/s", msPerSec: 259_200_000 },
  { label: "30 day/s", msPerSec: 2_592_000_000 },
  { label: "1 yr/s", msPerSec: 31_557_600_000 },
  { label: "20 yr/s", msPerSec: 631_152_000_000 }, // watch the aspect swing
] as const;

export interface ViewPreset {
  label: string;
  /** half-width of the framed field in central-body radii */
  targetReq: number;
}

/**
 * Framed-field zoom presets per system (half-width in central-body radii). The
 * dynamic range is large, so each system gets its own. Pluto's small moons span
 * ~16 (Charon) to ~55 (Hydra) Pluto radii; Haumea's ring sits at ~2.9 radii while
 * Hiʻiaka is out at ~63; Eris's Dysnomia is ~32 Eris radii out; MK2 is ~31
 * Makemake radii out. When a moon still falls outside the framed field, the scene
 * shows its direction and distance at the edge rather than dropping it silently.
 */
export const VIEW_PRESETS: Record<DwarfSystem, readonly ViewPreset[]> = {
  Pluto: [
    { label: "Binary", targetReq: 20 }, // Pluto + Charon (~16.5 R) wobble
    { label: "Moons", targetReq: 45 }, // through Kerberos (~49 R)
    { label: "All", targetReq: 62 }, // through Hydra (~55 R)
  ],
  Eris: [
    { label: "Eris", targetReq: 6 }, // the disk close up
    { label: "Dysnomia", targetReq: 38 }, // Dysnomia ~32 R
  ],
  Haumea: [
    { label: "Ring", targetReq: 5 }, // ring at ~2.9 R + the triaxial body
    { label: "Namaka", targetReq: 38 }, // Namaka ~32 R
    { label: "All", targetReq: 70 }, // Hiʻiaka ~63 R
  ],
  Makemake: [
    { label: "Makemake", targetReq: 6 }, // the disk close up
    { label: "MK2", targetReq: 38 }, // MK2 ~31 R
  ],
} as const;

/** Sensible default zoom preset per system (the "everything usually fits" view). */
export const DEFAULT_VIEW_IDX: Record<DwarfSystem, number> = {
  Pluto: 2, // All (the whole rich system)
  Eris: 1, // Dysnomia
  Haumea: 2, // All
  Makemake: 1, // MK2
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

interface DwarfMoonsTimeControlProps {
  system: DwarfSystem;
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
 * Time machine + view controls. Play/Pause advances the displayed instant so the
 * moons can be watched circling the barycenter (the Pluto-Charon wobble); the
 * cubic scrubber reaches +/-130 years so the system aspect can be watched swinging
 * across (and both edge-on seasons reached); Now snaps back to the live 1 Hz
 * clock. The zoom presets (per system) reframe the plane-of-sky view, and the
 * marker-size toggle carries the honesty label: illustrative markers are enlarged
 * for visibility. Mirrors OtherMoonsTimeControl.
 */
export default function DwarfMoonsTimeControl({
  system,
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
}: DwarfMoonsTimeControlProps) {
  const offsetDays = (displayedMs - nowMs) / DAY_MS;
  const sliderValue = daysToScrub(offsetDays);
  const presets = VIEW_PRESETS[system];

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
              Scrub the displayed date (fine near now, up to +/-130 years to watch
              the system aspect swing and reach the edge-on seasons)
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
            title="Real moons are tiny against these already-tiny, unresolvable disks. Enlarged markers are a legibility choice, not the true angular size."
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
