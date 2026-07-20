"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { SWARM_ALGORITHMS, SWARM_MODEL_NOTE, type SwarmStats } from "@/lib/swarm";

/**
 * The Swarm Defense HUD: live score/wave/threat readouts plus the SwarmStats
 * (cohesion index, average speed, assigned agents). Crucially it carries the
 * honesty payload the project requires: SWARM_MODEL_NOTE (this is a live model of
 * real algorithms dressed as a game, NOT a real defense system) and the
 * SWARM_ALGORITHMS citation list. Nothing here is faked; the numbers are read
 * straight off the live SwarmState each frame.
 */
export default function SwarmHud({
  score,
  wave,
  neutralized,
  breaches,
  stats,
  mode,
}: {
  score: number;
  wave: number;
  neutralized: number;
  breaches: number;
  stats: SwarmStats;
  mode: string;
}) {
  const [showAlgos, setShowAlgos] = useState(false);

  return (
    <div className="hud-panel flex w-[300px] max-w-[92vw] flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-medium text-ice">Swarm Defense</h2>
        <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
          {mode}
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <Big label="Score" value={score.toLocaleString()} />
        <Big label="Wave" value={String(wave)} />
        <Big label="Threats" value={String(stats.aliveThreats)} />
      </dl>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <Stat label="Neutralized" value={String(neutralized)} />
        <Stat label="Breaches" value={String(breaches)} />
        <Stat label="Cohesion index" value={stats.cohesion.toFixed(3)} />
        <Stat label="Avg speed" value={stats.avgSpeed.toFixed(1)} />
        <Stat label="Assigned agents" value={String(stats.assignedAgents)} />
        <Stat label="Avg energy" value={stats.avgEnergy.toFixed(2)} />
      </dl>

      {/* honesty note (always visible) */}
      <p className="rounded-xl border border-line bg-white/[0.02] px-3 py-2 text-[10px] leading-relaxed text-faint">
        {SWARM_MODEL_NOTE}
      </p>

      {/* algorithm citations (collapsible) */}
      <button
        type="button"
        onClick={() => setShowAlgos((v) => !v)}
        aria-expanded={showAlgos}
        className="flex cursor-pointer items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-dim transition-colors duration-200 hover:text-ice"
      >
        Real algorithms &amp; citations
        <CaretDown
          size={12}
          weight="bold"
          aria-hidden
          className={`transition-transform duration-200 ${showAlgos ? "rotate-180" : ""}`}
        />
      </button>
      {showAlgos && (
        <ul className="flex flex-col gap-2">
          {SWARM_ALGORITHMS.map((a) => (
            <li key={a.name} className="text-[10px] leading-snug">
              <span className="text-ice">{a.name}</span>
              <br />
              <span className="text-faint">{a.citation}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.02] py-2">
      <div className="font-display text-xl font-medium text-ice">{value}</div>
      <div className="font-mono text-[8.5px] uppercase tracking-wide text-faint">{label}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-0.5 text-ice">{value}</dd>
    </div>
  );
}
