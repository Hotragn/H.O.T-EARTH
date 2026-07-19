"use client";

import { Pause, Play } from "@phosphor-icons/react";

const DAY_MS = 86_400_000;

/** How far the scrubber reaches each side of now, in days. */
export const SCRUB_DAYS = 14;

/** Playback speeds, in simulated milliseconds advanced per real second. */
export const PLAY_SPEEDS = [
  { label: "1 min/s", msPerSec: 60_000 },
  { label: "10 min/s", msPerSec: 600_000 },
  { label: "30 min/s", msPerSec: 1_800_000 },
  { label: "2 hr/s", msPerSec: 7_200_000 },
  { label: "12 hr/s", msPerSec: 43_200_000 },
  { label: "1 day/s", msPerSec: 86_400_000 },
] as const;

/** Framed-field zoom presets (half-width in Jupiter radii). */
export const VIEW_PRESETS = [
  { label: "Disk", targetRj: 3.4 },
  { label: "Moons", targetRj: 16 },
  { label: "Wide", targetRj: 28 },
] as const;

interface JupiterMoonsTimeControlProps {
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
 * Time machine + view controls. Play/Pause advances the displayed instant so a
 * shadow transit can be watched crossing the disk; the scrubber jumps ±14 days;
 * Now snaps back to the live 1 Hz clock. The zoom presets reframe the plane-of-
 * sky view (Disk to watch transits, Wide to see all four moons), and the moon-
 * size toggle carries the honesty label: markers are enlarged for visibility.
 */
export default function JupiterMoonsTimeControl({
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
}: JupiterMoonsTimeControlProps) {
  const offsetDays = (displayedMs - nowMs) / DAY_MS;
  const clampedOffset = Math.max(-SCRUB_DAYS, Math.min(SCRUB_DAYS, offsetDays));

  return (
    <section
      aria-label="Time and view controls"
      className="pointer-events-auto absolute inset-x-3 bottom-3 animate-hud-in sm:inset-x-auto sm:bottom-5 sm:left-1/2 sm:w-[620px] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2"
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
            <span className="sr-only">Scrub the displayed date (±14 days)</span>
            <input
              type="range"
              min={-SCRUB_DAYS}
              max={SCRUB_DAYS}
              step={0.02}
              value={clampedOffset}
              onChange={(e) => onScrub(Number(e.target.value))}
              className="time-scrubber w-full min-w-0"
            />
          </label>

          <span
            className={`w-[92px] shrink-0 text-right font-mono text-[11px] tracking-wide ${
              isLive ? "text-faint" : "text-solar"
            }`}
          >
            {isLive
              ? "NOW"
              : `${offsetDays >= 0 ? "+" : ""}${offsetDays.toFixed(2)} d`}
          </span>
        </div>

        {/* row 2: speed + zoom + honesty toggle */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2.5">
          <div className="flex items-center gap-1">
            <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
              speed
            </span>
            {PLAY_SPEEDS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => onSpeedChange(i)}
                aria-pressed={i === speedIdx}
                className={`cursor-pointer rounded-full px-2 py-1 font-mono text-[10px] tracking-wide transition-colors duration-200 ${
                  i === speedIdx ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
              zoom
            </span>
            {VIEW_PRESETS.map((v, i) => (
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
            title="Real Galilean moons are ~1 arcsec across against Jupiter's ~40 arcsec. Enlarged markers are a legibility choice, not the true angular size."
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
