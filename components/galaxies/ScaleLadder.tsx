"use client";

import { useState } from "react";
import { SCALE_LADDER, SUPERCLUSTERS } from "@/lib/galaxies";
import { fmtSizeM } from "./galaxiesUi";

/**
 * Scale Ladder: an interactive zoom through the SCALE_LADDER rungs (Earth to the
 * observable universe), each with its real characteristic size, plus the cited
 * SUPERCLUSTERS large-scale-structure facts (Virgo, Laniakea, Great Attractor,
 * Sloan Great Wall, Bootes Void). Selecting a rung shows its detail; a log bar
 * gives a feel for the enormous span. Every size is a real value from
 * lib/galaxies; nothing is invented.
 */

const KIND_LABEL: Record<string, string> = {
  supercluster: "Supercluster",
  wall: "Wall",
  void: "Void",
  attractor: "Attractor",
};

export default function ScaleLadder() {
  const [rung, setRung] = useState(SCALE_LADDER.length - 1);
  const active = SCALE_LADDER[rung];

  // Log fraction of the current rung against the whole ladder, for the bar.
  const minLog = Math.log10(SCALE_LADDER[0].sizeM);
  const maxLog = Math.log10(SCALE_LADDER[SCALE_LADDER.length - 1].sizeM);

  return (
    <div className="flex flex-col gap-3">
      <div className="hud-panel rounded-2xl p-4">
        <h2 className="font-display text-lg font-medium tracking-tight text-ice">
          A ladder of scale
        </h2>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Earth to the observable universe
        </p>

        <input
          type="range"
          min={0}
          max={SCALE_LADDER.length - 1}
          step={1}
          value={rung}
          onChange={(e) => setRung(Number(e.target.value))}
          aria-label="Scale ladder rung"
          className="mt-3 w-full accent-amber-300"
        />

        <div className="mt-1 flex flex-wrap gap-1">
          {SCALE_LADDER.map((r, i) => {
            const on = i === rung;
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => setRung(i)}
                aria-pressed={on}
                className={`cursor-pointer rounded-lg px-2 py-1 font-mono text-[9px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
                  on ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-display text-base text-ice">{active.label}</span>
            <span className="font-mono text-[12px] text-amber-200">
              {fmtSizeM(active.sizeM)}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-faint">{active.human}</p>
          <p className="mt-2 text-[11px] leading-snug text-dim">{active.note}</p>
          {/* log-scale position bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-amber-300/70"
              style={{
                width: `${((Math.log10(active.sizeM) - minLog) / (maxLog - minLog)) * 100}%`,
              }}
            />
          </div>
          <p className="mt-1 font-mono text-[9px] text-faint">
            Log scale: each rung is many times larger than the last.
          </p>
        </div>
      </div>

      {/* the cited large-scale-structure facts */}
      <div className="hud-panel rounded-2xl p-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-200/90">
          Large-scale structure
        </h2>
        <ul className="mt-2 space-y-2 text-[11px] leading-snug text-dim">
          {SUPERCLUSTERS.map((s) => (
            <li key={s.name} className="border-t border-line/60 pt-2 first:border-t-0 first:pt-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-ice">{s.name}</span>
                <span className="font-mono text-[9px] uppercase tracking-wide text-faint">
                  {KIND_LABEL[s.kind] ?? s.kind} · ~{s.sizeMly.toLocaleString()} Mly
                </span>
              </div>
              <p className="mt-0.5 text-faint">{s.note}</p>
              <p className="mt-0.5 text-[10px] text-faint/80">Source: {s.source}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
