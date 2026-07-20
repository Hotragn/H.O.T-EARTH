"use client";

import { Pause, Play, SunHorizon } from "@phosphor-icons/react";
import type { SurfaceWorld } from "@/lib/surfaces";
import type { MarsViewMode } from "./SurfacesCanvas";

const DAY_MS = 86_400_000;
const DAYS_PER_YEAR = 365.25;

/**
 * Time machine + view controls for the Surfaces tab (mirrors
 * AsteroidMoonsTimeControl). One displayed Date drives both worlds. The play
 * speeds span a Mars sol (~24.6 h: watch a full day pass at 1 hr/s or 6 hr/s)
 * and Titan's ~16 Earth-day solar cycle (1 day/s or 4 day/s). The scrubber is
 * signed-cubic to +/-60 days: fine minute-scale control near now (a Mars
 * sunset lasts minutes) with the full Titan cycle in reach. A sunset landmark
 * jumps to the next REAL computed Mars sunset at the selected site (the sun
 * altitude crossing 0, where the blue-sunset regime shows).
 */
export const MAX_SCRUB_DAYS = 60;

/** slider position s in [-1, 1] -> offset in days (fine near 0). */
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
  { label: "10 min/s", msPerSec: 600_000 }, // watch a Mars sunset unfold
  { label: "1 hr/s", msPerSec: 3_600_000 },
  { label: "6 hr/s", msPerSec: 21_600_000 }, // a Mars sol in ~4 s
  { label: "1 day/s", msPerSec: 86_400_000 }, // Titan's ~16 day cycle
  { label: "4 day/s", msPerSec: 345_600_000 },
] as const;

/** Human-readable signed offset from now. */
function formatOffset(offsetDays: number): string {
  const a = Math.abs(offsetDays);
  const sign = offsetDays >= 0 ? "+" : "-";
  if (a < 0.1) return `${sign}${(a * 1440).toFixed(0)} min`;
  if (a < 2) return `${sign}${(a * 24).toFixed(1)} h`;
  if (a < 90) return `${sign}${a.toFixed(1)} d`;
  return `${sign}${(a / DAYS_PER_YEAR).toFixed(2)} yr`;
}

interface SurfacesTimeControlProps {
  world: SurfaceWorld;
  displayedMs: number;
  nowMs: number;
  isLive: boolean;
  playing: boolean;
  onNow: () => void;
  onPlayToggle: () => void;
  onScrub: (offsetDays: number) => void;
  /** jump to the next computed Mars sunset (null while unavailable). */
  nextSunsetMs: number | null;
  onGoToMs: (ms: number) => void;
  speedIdx: number;
  onSpeedChange: (idx: number) => void;
  marsView: MarsViewMode;
  onMarsViewChange: (v: MarsViewMode) => void;
  exaggeration: number;
  onExaggerationToggle: () => void;
}

export default function SurfacesTimeControl({
  world,
  displayedMs,
  nowMs,
  isLive,
  playing,
  onNow,
  onPlayToggle,
  onScrub,
  nextSunsetMs,
  onGoToMs,
  speedIdx,
  onSpeedChange,
  marsView,
  onMarsViewChange,
  exaggeration,
  onExaggerationToggle,
}: SurfacesTimeControlProps) {
  const offsetDays = (displayedMs - nowMs) / DAY_MS;
  const sliderValue = daysToScrub(offsetDays);

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
              Scrub the displayed date (fine near now, up to +/-60 days for
              Titan&apos;s ~16 day cycle)
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

        {/* row 2: sunset landmark + speed */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2.5">
          {world === "mars" && (
            <button
              type="button"
              onClick={() => {
                if (nextSunsetMs !== null) onGoToMs(nextSunsetMs);
              }}
              disabled={nextSunsetMs === null}
              title="Jump to the next computed sunset at this site (real Mars24 geometry: the sun altitude crossing 0, where the blue-sunset regime shows). Then press play at 10 min/s and watch it."
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
                nextSunsetMs === null
                  ? "cursor-default border-line text-faint/60"
                  : "border-line text-dim hover:text-ice"
              }`}
            >
              <SunHorizon size={12} weight="light" aria-hidden />
              Next sunset (blue)
            </button>
          )}

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

        {/* row 3 (Mars only): terrain/panorama mode + labeled exaggeration */}
        {world === "mars" && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2.5">
            <div className="flex items-center gap-1">
              <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                view
              </span>
              {(
                [
                  ["terrain", "Terrain (real DEM)"],
                  ["panorama", "Panorama (real photo)"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onMarsViewChange(mode)}
                  aria-pressed={marsView === mode}
                  className={`cursor-pointer rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors duration-200 ${
                    marsView === mode
                      ? "bg-white/10 text-ice"
                      : "text-faint hover:text-dim"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {marsView === "terrain" && (
              <button
                type="button"
                onClick={onExaggerationToggle}
                aria-pressed={exaggeration !== 1}
                title="Vertical exaggeration is a labeled display choice. 1x is the true measured proportion of the MOLA topography."
                className={`ml-auto cursor-pointer rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
                  exaggeration !== 1
                    ? "border-solar/50 bg-solar/10 text-solar"
                    : "border-line text-dim hover:text-ice"
                }`}
              >
                {exaggeration !== 1
                  ? `Vertical scale: ${exaggeration}x (exaggerated)`
                  : "Vertical scale: 1x (true)"}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
