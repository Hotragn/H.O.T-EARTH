"use client";

import type { BlackHoleState } from "@/lib/black-holes";

/**
 * Spaghettification panel: surfaces the real, counterintuitive result from
 * spaghettificationCheck. Tides at the horizon scale as 1/M^2, so a stellar-mass
 * hole is lethal well outside its horizon while a supermassive one is gentle
 * enough to cross intact. Computed, not folklore.
 */
export default function SpaghettificationPanel({ state }: { state: BlackHoleState }) {
  const s = state.spaghettification;

  return (
    <div className="hud-panel rounded-2xl p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-orange-300/90">
        Spaghettification at the horizon
      </h2>

      {s ? (
        <>
          <div
            className={`mt-2 rounded-xl border p-2.5 ${
              s.spaghettifiedBeforeHorizon
                ? "border-red-400/30 bg-red-400/[0.05]"
                : "border-emerald-400/25 bg-emerald-400/[0.04]"
            }`}
          >
            <div className="font-mono text-[12px] font-medium text-ice">
              {s.spaghettifiedBeforeHorizon
                ? "Lethal before the horizon"
                : "Gentle at the horizon"}
            </div>
            <p className="mt-1 text-[11px] leading-snug text-dim">{s.note}</p>
          </div>

          <div className="mt-2 space-y-1 font-mono text-[10px] text-faint">
            <div className="flex justify-between gap-2">
              <span>Tidal gradient at horizon</span>
              <span className="text-ice">
                {s.tidalAtHorizonPerMeter.toExponential(2)} /s^2 per m
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Stretch across a 1.8 m body</span>
              <span className="text-ice">
                {s.humanStretchAtHorizonMs2.toExponential(2)} m/s^2
              </span>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-2 text-[11px] text-faint">
          Tidal verdict unavailable for this object.
        </p>
      )}

      <p className="mt-2 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
        Computed from the Newtonian tidal scaling 2GM/r^3. Bigger black hole,
        gentler horizon tides.
      </p>
    </div>
  );
}
