"use client";

import { Crosshair, Pause, Play } from "@phosphor-icons/react";
import { DART_IMPACT_DATE_ISO, type AsteroidSystem } from "@/lib/asteroid-moons";

const DAY_MS = 86_400_000;
const DAYS_PER_YEAR = 365.25;

/** The DART impact instant (ms), a scrub landmark: crossing it steps Dimorphos's period. */
export const DART_IMPACT_MS = Date.parse(DART_IMPACT_DATE_ISO);

/**
 * These mutual orbits are HOURS to DAYS (Dimorphos 11.9 h, up to Patroclus-Menoetius
 * 102.8 h / 4.28 d), so Play watches the moons circle the barycenter. The scrubber
 * reaches +/-6 years with a SIGNED-CUBIC mapping so there is fine day-scale control
 * near "now" AND the 2022-09-26 DART impact is reachable (a dedicated landmark button
 * jumps to it exactly). Mirrors DwarfMoonsTimeControl.
 */
export const MAX_SCRUB_DAYS = 6 * DAYS_PER_YEAR; // ~2191 days

/** slider position s in [-1, 1] -> offset in days (fine near 0, +/-6 yr at ends). */
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
  { label: "1 hr/s", msPerSec: 3_600_000 },
  { label: "6 hr/s", msPerSec: 21_600_000 }, // watch Dimorphos (11.9 h) circle
  { label: "1 day/s", msPerSec: 86_400_000 },
  { label: "5 day/s", msPerSec: 432_000_000 }, // watch the slow Trojan double
] as const;

export interface ViewPreset {
  label: string;
  /** half-width of the framed field in primary radii. */
  targetReq: number;
}

/**
 * Framed-field zoom presets per system (half-width in primary radii). The dynamic
 * range is large, so each system gets its own: Dimorphos sits at ~3.1 Didymos radii,
 * Dactyl at ~6.9 Ida radii, Kalliope's Linus at ~13 radii, Eugenia's Petit-Prince at
 * ~11 radii. When a moon still falls outside the framed field, the scene shows its
 * direction and distance at the edge rather than dropping it.
 */
export const VIEW_PRESETS: Record<AsteroidSystem, readonly ViewPreset[]> = {
  Didymos: [
    { label: "Binary", targetReq: 4.5 }, // Dimorphos ~3.1 R
    { label: "Wide", targetReq: 6.5 },
  ],
  Ida: [
    { label: "System", targetReq: 8.5 }, // Dactyl ~6.9 R
    { label: "Wide", targetReq: 12 },
  ],
  Sylvia: [
    { label: "Inner", targetReq: 6 }, // Remus ~4.9 R
    { label: "All", targetReq: 11 }, // Romulus ~9.5 R
  ],
  Kleopatra: [
    { label: "Inner", targetReq: 8 }, // Cleoselene ~6.7 R
    { label: "All", targetReq: 12 }, // Alexhelios ~10 R
  ],
  Antiope: [
    { label: "Double", targetReq: 4 }, // both components ~1.95 R
    { label: "Wide", targetReq: 6 },
  ],
  Kalliope: [
    { label: "Close", targetReq: 5 },
    { label: "Linus", targetReq: 15 }, // Linus ~13.2 R
  ],
  Eugenia: [
    { label: "Inner", targetReq: 7 }, // S/2004 (45) 1 ~5.9 R
    { label: "All", targetReq: 13 }, // Petit-Prince ~11.3 R
  ],
  Patroclus: [
    { label: "Double", targetReq: 8 }, // Menoetius ~6.8 R, Patroclus ~5.3 R
    { label: "Wide", targetReq: 10 },
  ],
} as const;

/** Sensible default zoom preset per system (the "everything usually fits" view). */
export const DEFAULT_VIEW_IDX: Record<AsteroidSystem, number> = {
  Didymos: 0,
  Ida: 0,
  Sylvia: 1,
  Kleopatra: 1,
  Antiope: 0,
  Kalliope: 1,
  Eugenia: 1,
  Patroclus: 0,
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

interface AsteroidMoonsTimeControlProps {
  system: AsteroidSystem;
  displayedMs: number;
  nowMs: number;
  isLive: boolean;
  playing: boolean;
  onNow: () => void;
  onPlayToggle: () => void;
  /** scrub to now + offsetDays (pauses + leaves live). */
  onScrub: (offsetDays: number) => void;
  /** jump to an absolute instant in ms (the DART-impact landmark). */
  onGoToMs: (ms: number) => void;
  speedIdx: number;
  onSpeedChange: (idx: number) => void;
  viewIdx: number;
  onViewChange: (idx: number) => void;
  exaggerate: boolean;
  onExaggerateToggle: () => void;
}

/**
 * Time machine + view controls. Play/Pause advances the displayed instant so the
 * moons can be watched circling the barycenter; the cubic scrubber reaches +/-6
 * years; the DART landmark jumps to 2022-09-26 exactly, where Dimorphos's period
 * visibly steps; Now snaps back to the live 1 Hz clock. The zoom presets (per
 * system) reframe the face-on view, and the marker-size toggle carries the honesty
 * label: the tiniest moons are enlarged for visibility. Mirrors DwarfMoonsTimeControl.
 */
export default function AsteroidMoonsTimeControl({
  system,
  displayedMs,
  nowMs,
  isLive,
  playing,
  onNow,
  onPlayToggle,
  onScrub,
  onGoToMs,
  speedIdx,
  onSpeedChange,
  viewIdx,
  onViewChange,
  exaggerate,
  onExaggerateToggle,
}: AsteroidMoonsTimeControlProps) {
  const offsetDays = (displayedMs - nowMs) / DAY_MS;
  const sliderValue = daysToScrub(offsetDays);
  const presets = VIEW_PRESETS[system];
  const nearDart = Math.abs(displayedMs - DART_IMPACT_MS) < 12 * 60 * 60 * 1000;

  return (
    <section
      aria-label="Time and view controls"
      className="pointer-events-auto absolute inset-x-3 bottom-3 animate-hud-in sm:inset-x-auto sm:bottom-5 sm:left-1/2 sm:w-[660px] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2"
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
              Scrub the displayed date (fine near now, up to +/-6 years to reach the
              2022-09-26 DART impact)
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

        {/* row 2: DART landmark + speed */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2.5">
          <button
            type="button"
            onClick={() => onGoToMs(DART_IMPACT_MS)}
            aria-pressed={nearDart}
            title="Jump to the 2022-09-26 DART impact. Crossing this instant steps the Didymos-Dimorphos mutual period from 11.921 h to 11.372 h."
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              nearDart
                ? "border-solar/50 bg-solar/10 text-solar"
                : "border-line text-dim hover:text-ice"
            }`}
          >
            <Crosshair size={12} weight="light" aria-hidden />
            DART impact 2022
          </button>

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
        </div>

        {/* row 3: zoom + honesty toggle */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2.5">
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
            title="These moons are tiny beside their primaries and far out on their orbits. Enlarged markers are a legibility choice, not a true size; the orbits and separations stay to scale."
            className={`ml-auto cursor-pointer rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              exaggerate
                ? "border-solar/50 bg-solar/10 text-solar"
                : "border-line text-dim hover:text-ice"
            }`}
          >
            {exaggerate ? "Moon size: enlarged" : "Moon size: true scale"}
          </button>
        </div>
      </div>
    </section>
  );
}
