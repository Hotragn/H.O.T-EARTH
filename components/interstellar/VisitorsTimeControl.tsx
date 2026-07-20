"use client";

import { Pause, Play, Target } from "@phosphor-icons/react";

/**
 * Time scrubber for the Visitors section: it "flies" the selected object through
 * perihelion. A normalized slider maps to the sample window [fromMs, toMs] (the
 * same window the trajectory arc is drawn over), with a tick marking the moment
 * of perihelion and a one-click jump to it. Play fast-forwards along the window.
 */

export const VISITOR_SPEEDS = [
  { label: "1×", daysPerSec: 10 },
  { label: "2×", daysPerSec: 30 },
  { label: "3×", daysPerSec: 80 },
] as const;

function fmtDate(ms: number): string {
  const d = new Date(ms);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function VisitorsTimeControl({
  fromMs,
  toMs,
  tpMs,
  displayedMs,
  playing,
  speedIdx,
  onScrubFraction,
  onPlayToggle,
  onGoToPerihelion,
  onSpeedChange,
}: {
  fromMs: number;
  toMs: number;
  tpMs: number;
  displayedMs: number;
  playing: boolean;
  speedIdx: number;
  onScrubFraction: (f: number) => void;
  onPlayToggle: () => void;
  onGoToPerihelion: () => void;
  onSpeedChange: (idx: number) => void;
}) {
  const span = toMs - fromMs;
  const frac = span > 0 ? (displayedMs - fromMs) / span : 0;
  const clampedFrac = Math.min(1, Math.max(0, frac));
  const tpFrac = span > 0 ? Math.min(1, Math.max(0, (tpMs - fromMs) / span)) : 0.5;

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-4 mx-auto flex w-[560px] max-w-[94vw] flex-col gap-2 animate-hud-in">
      <div className="hud-panel flex items-center gap-3 rounded-2xl px-4 py-3">
        <button
          type="button"
          onClick={onPlayToggle}
          aria-label={playing ? "Pause" : "Play through perihelion"}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/5 text-ice transition-colors duration-200 hover:bg-white/10"
        >
          {playing ? (
            <Pause size={15} weight="fill" aria-hidden />
          ) : (
            <Play size={15} weight="fill" aria-hidden />
          )}
        </button>

        <div className="relative flex-1">
          {/* perihelion tick */}
          <div
            aria-hidden
            className="absolute -top-1.5 h-2 w-px bg-solar/80"
            style={{ left: `${tpFrac * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(clampedFrac * 1000)}
            onChange={(e) => onScrubFraction(Number(e.target.value) / 1000)}
            className="time-scrubber w-full"
            aria-label="Scrub through the flyby"
          />
          <div className="mt-1 flex justify-between font-mono text-[9px] text-faint">
            <span>{fmtDate(fromMs)}</span>
            <span className="text-dim">{fmtDate(displayedMs)}</span>
            <span>{fmtDate(toMs)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoToPerihelion}
          aria-label="Jump to perihelion"
          title="Jump to perihelion"
          className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-white/5 px-3 font-mono text-[10px] tracking-wide text-dim transition-colors duration-200 hover:bg-white/10 hover:text-ice"
        >
          <Target size={13} weight="light" aria-hidden />
          Perihelion
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {VISITOR_SPEEDS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onSpeedChange(i)}
              aria-pressed={i === speedIdx}
              className={`cursor-pointer rounded-full px-2 py-1 font-mono text-[10px] transition-colors duration-200 ${
                i === speedIdx ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
