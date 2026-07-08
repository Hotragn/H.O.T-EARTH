"use client";

import { Pause, Play } from "@phosphor-icons/react";

const DAY_MS = 86_400_000;
const YEAR_DAYS = 365.25;

/** Playback speeds in simulated Earth days per real second. */
export const ORRERY_SPEEDS = [
  { label: "1 day/s", daysPerSec: 1 },
  { label: "1 wk/s", daysPerSec: 7 },
  { label: "1 mo/s", daysPerSec: 30 },
  { label: "1 yr/s", daysPerSec: YEAR_DAYS },
  { label: "10 yr/s", daysPerSec: YEAR_DAYS * 10 },
] as const;

interface OrreryTimeControlProps {
  /** current simulated epoch ms (display copy, refreshed ~2Hz by the parent) */
  simMs: number;
  /** real "now" ms baseline for the scrub offset */
  nowMs: number;
  playing: boolean;
  onPlayToggle: () => void;
  speedIdx: number;
  onSpeedChange: (idx: number) => void;
  /** jump the simulation to `ms` (used by Now + the scrub slider) */
  onSeek: (ms: number) => void;
  /** honesty string from orreryLayout().note */
  note: string;
}

/**
 * Orrery time machine: Play/Pause advances the date so every planet orbits at
 * its correct RELATIVE speed (Mercury laps in seconds at 1 yr/s while Neptune
 * barely moves). The scrub slider jumps the date across ±150 years; Now snaps
 * back to the live clock. The compression-honesty note from orreryLayout is
 * shown verbatim so nobody mistakes the compressed radii for true distances.
 */
export default function OrreryTimeControl({
  simMs,
  nowMs,
  playing,
  onPlayToggle,
  speedIdx,
  onSpeedChange,
  onSeek,
  note,
}: OrreryTimeControlProps) {
  const offsetYears = (simMs - nowMs) / (YEAR_DAYS * DAY_MS);
  const isNow = Math.abs(simMs - nowMs) < DAY_MS; // within a day of live
  const dateLabel = new Date(simMs).toISOString().slice(0, 10);

  return (
    <section
      aria-label="Orrery time control"
      className="pointer-events-auto absolute inset-x-3 bottom-3 animate-hud-in sm:inset-x-auto sm:bottom-5 sm:left-1/2 sm:w-[600px] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2"
    >
      <div className="hud-panel rounded-2xl px-4 py-3 sm:px-5">
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
            onClick={() => onSeek(nowMs)}
            aria-pressed={isNow}
            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              isNow
                ? "bg-solar/15 text-solar"
                : "bg-white/5 text-dim hover:bg-white/10 hover:text-ice"
            }`}
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${
                isNow ? "bg-solar animate-pulse-dot" : "bg-white/30"
              }`}
            />
            Now
          </button>

          <label className="flex min-w-0 grow items-center gap-3">
            <span className="sr-only">Scrub the simulated date (±150 years)</span>
            <input
              type="range"
              min={-80}
              max={150}
              step={0.1}
              value={Math.max(-80, Math.min(150, offsetYears))}
              onChange={(e) =>
                onSeek(nowMs + Number(e.target.value) * YEAR_DAYS * DAY_MS)
              }
              className="time-scrubber w-full min-w-0"
            />
          </label>

          <span
            className={`w-[104px] shrink-0 text-right font-mono text-[11px] tracking-wide ${
              isNow ? "text-faint" : "text-solar"
            }`}
          >
            {dateLabel}
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-2.5">
          <div className="flex items-center gap-1">
            {ORRERY_SPEEDS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => onSpeedChange(i)}
                aria-pressed={i === speedIdx}
                className={`cursor-pointer rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors duration-200 ${
                  i === speedIdx
                    ? "bg-white/10 text-ice"
                    : "text-faint hover:text-dim"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <span className="ml-auto truncate font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            {isNow
              ? "live · real orbital mechanics"
              : `${offsetYears >= 0 ? "+" : ""}${offsetYears.toFixed(1)} yr`}
          </span>
        </div>

        <p className="mt-2 border-t border-line pt-2 font-mono text-[9px] leading-relaxed text-faint">
          {note}
        </p>
      </div>
    </section>
  );
}
