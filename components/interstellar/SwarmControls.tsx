"use client";

import { Pause, Play, ArrowsClockwise, Plus } from "@phosphor-icons/react";
import type { SwarmMode } from "@/lib/swarm";

/**
 * The game controls for Swarm Defense: mode buttons (patrol / defend / intercept),
 * live boids-weight sliders (cohesion / separation / alignment), pause, a preset
 * picker, reset, and a spawn-wave button. Every control feeds lib/swarm's public
 * SwarmInput contract (mode, *Scale multipliers, paused) or triggers a rebuild.
 */

const MODES: SwarmMode[] = ["patrol", "defend", "intercept"];

export interface PresetOption {
  id: string;
  label: string;
}

export default function SwarmControls({
  mode,
  onModeChange,
  cohesion,
  separation,
  alignment,
  onScaleChange,
  paused,
  onPauseToggle,
  presets,
  presetId,
  onPresetChange,
  onReset,
  onSpawnWave,
}: {
  mode: SwarmMode;
  onModeChange: (m: SwarmMode) => void;
  cohesion: number;
  separation: number;
  alignment: number;
  onScaleChange: (which: "cohesion" | "separation" | "alignment", value: number) => void;
  paused: boolean;
  onPauseToggle: () => void;
  presets: PresetOption[];
  presetId: string;
  onPresetChange: (id: string) => void;
  onReset: () => void;
  onSpawnWave: () => void;
}) {
  return (
    <div className="hud-panel pointer-events-auto flex w-[300px] max-w-[92vw] flex-col gap-4 rounded-2xl p-4">
      {/* mode */}
      <div>
        <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
          Mode
        </p>
        <div role="tablist" aria-label="Swarm mode" className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={m === mode}
              onClick={() => onModeChange(m)}
              className={`flex-1 cursor-pointer rounded-lg px-2 py-1.5 font-mono text-[11px] capitalize transition-colors duration-200 ${
                m === mode ? "bg-white/10 text-ice" : "bg-white/[0.02] text-faint hover:text-dim"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* boids sliders */}
      <div className="flex flex-col gap-2.5">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
          Boids weights (Reynolds 1987)
        </p>
        <Slider label="Cohesion" value={cohesion} onChange={(v) => onScaleChange("cohesion", v)} />
        <Slider
          label="Separation"
          value={separation}
          onChange={(v) => onScaleChange("separation", v)}
        />
        <Slider
          label="Alignment"
          value={alignment}
          onChange={(v) => onScaleChange("alignment", v)}
        />
      </div>

      {/* preset */}
      <div>
        <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
          Preset
        </p>
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === presetId}
              onClick={() => onPresetChange(p.id)}
              className={`cursor-pointer rounded-full px-2.5 py-1 font-mono text-[10px] transition-colors duration-200 ${
                p.id === presetId ? "bg-white/10 text-ice" : "bg-white/[0.02] text-faint hover:text-dim"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPauseToggle}
          className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white/5 font-mono text-[11px] text-ice transition-colors duration-200 hover:bg-white/10"
        >
          {paused ? <Play size={13} weight="fill" /> : <Pause size={13} weight="fill" />}
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          onClick={onSpawnWave}
          aria-label="Spawn a wave of threats"
          className="flex h-9 cursor-pointer items-center justify-center gap-1 rounded-lg bg-white/5 px-3 font-mono text-[11px] text-dim transition-colors duration-200 hover:bg-white/10 hover:text-ice"
        >
          <Plus size={13} weight="bold" />
          Threats
        </button>
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset the simulation"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white/5 text-dim transition-colors duration-200 hover:bg-white/10 hover:text-ice"
        >
          <ArrowsClockwise size={14} weight="light" />
        </button>
      </div>

      <p className="font-mono text-[9px] leading-snug text-faint">
        Click the arena to drop a threat. Sliders multiply the live boids weights.
      </p>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-[74px] shrink-0 text-[11px] text-dim">{label}</span>
      <input
        type="range"
        min={0}
        max={250}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="time-scrubber flex-1"
        aria-label={`${label} weight`}
      />
      <span className="w-8 shrink-0 text-right font-mono text-[10px] text-faint">
        {value.toFixed(1)}
      </span>
    </label>
  );
}
