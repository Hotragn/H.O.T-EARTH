"use client";

import type { ExoSurfaceState } from "@/lib/exo-surfaces";
import { DAY_MODES, fmtYear, type DayMode } from "./exoSurfacesUi";

/**
 * The bottom control strip. There is deliberately NO local clock and NO
 * day/night scrubber: rotation and day length are not measured for these worlds.
 * The only real time quantity, the year (orbital period), is shown as a readout.
 * For a tidally-locked-INFERENCE world an optional day-side / terminator /
 * night-side toggle is offered, explicitly labeled as an illustrative framing
 * that rests on the inference.
 */
export default function ExoSurfacesTimeControl({
  state,
  dayMode,
  onDayModeChange,
  lockable,
}: {
  state: ExoSurfaceState;
  dayMode: DayMode;
  onDayModeChange: (m: DayMode) => void;
  lockable: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-3">
      {lockable && (
        <div
          role="tablist"
          aria-label="Illustrative day cycle (rotation not measured)"
          className="hud-panel pointer-events-auto flex items-center gap-1 rounded-full p-1 animate-hud-in"
        >
          {DAY_MODES.map((m) => {
            const active = m.id === dayMode;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onDayModeChange(m.id)}
                className={`cursor-pointer rounded-full px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
                  active ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="hud-panel pointer-events-auto flex max-w-[92vw] flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full px-4 py-1.5 text-center font-mono text-[10px] leading-snug tracking-wide animate-hud-in sm:text-[11px]">
        <span className="text-dim">
          Year <span className="text-ice">{state.year ? fmtYear(state.year.yearDays) : "not measured"}</span>{" "}
          <span className="text-emerald-300/80">(real)</span>
        </span>
        <span className="text-faint">
          {lockable
            ? "Day cycle is an illustrative framing; rotation is not measured. No local clock."
            : "Rotation and day length are not measured. No local clock; only the year is real."}
        </span>
      </div>
    </div>
  );
}
