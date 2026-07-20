"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PRESETS,
  createSwarm,
  type SpawnThreatCommand,
  type SwarmConfig,
  type SwarmInput,
  type SwarmMode,
  type SwarmState,
  type SwarmStats,
} from "@/lib/swarm";
import SwarmCanvas from "./SwarmCanvas";
import SwarmControls, { type PresetOption } from "./SwarmControls";
import SwarmHud from "./SwarmHud";

/**
 * Section C owner: the LIVE swarm-defense game. It creates a real SwarmState from
 * lib/swarm and holds it (plus the per-frame input and any click-spawned threats)
 * in refs so the rAF loop in SwarmCanvas never tears down. React state mirrors the
 * controls (mode, boids-weight sliders, paused, preset) and a throttled stats
 * snapshot for the HUD. Changing preset or resetting rebuilds the SwarmState.
 *
 * This is an educational MODEL of real swarm-robotics algorithms run every frame,
 * dressed as a planetary-defense game; it is NOT a real defense system. The HUD
 * shows SWARM_MODEL_NOTE and the algorithm citations to keep that honest.
 */

/** Arena scaffolding kept constant across presets (obstacles, base, agent count).
 * Weight / mode fields are intentionally omitted so the chosen preset drives them. */
const BASE_CONFIG: Partial<SwarmConfig> = {
  agentCount: 44,
  base: { x: 0, y: 0 },
  autoSpawn: true,
  obstacles: [
    { pos: { x: -70, y: 55 }, radius: 24 },
    { pos: { x: 88, y: -52 }, radius: 20 },
    { pos: { x: 24, y: 118 }, radius: 16 },
  ],
};

const PRESET_OPTIONS: PresetOption[] = [
  { id: "default", label: "default" },
  { id: "tight-flock", label: "tight flock" },
  { id: "dispersed-patrol", label: "dispersed" },
  { id: "aggressive-intercept", label: "intercept" },
];

/** Build a fresh SwarmState for a preset id ("default" => no preset). */
function build(presetId: string): SwarmState {
  const preset = presetId === "default" ? undefined : presetId;
  return createSwarm(BASE_CONFIG, preset);
}

/** The mode a preset starts in (so the UI matches the freshly built state). */
function presetMode(presetId: string): SwarmMode {
  if (presetId === "default") return "patrol";
  return (PRESETS[presetId]?.mode as SwarmMode) ?? "patrol";
}

export default function SwarmSection() {
  const [presetId, setPresetId] = useState("tight-flock");
  const [mode, setMode] = useState<SwarmMode>(presetMode("tight-flock"));
  const [cohesion, setCohesion] = useState(1);
  const [separation, setSeparation] = useState(1);
  const [alignment, setAlignment] = useState(1);
  const [paused, setPaused] = useState(false);

  const [snapshot, setSnapshot] = useState<{
    score: number;
    wave: number;
    neutralized: number;
    breaches: number;
    stats: SwarmStats;
    mode: string;
  }>(() => {
    const s = build("tight-flock");
    return {
      score: s.score,
      wave: s.wave,
      neutralized: s.neutralized,
      breaches: s.breaches,
      stats: s.stats,
      mode: s.mode,
    };
  });

  const stateRef = useRef<SwarmState>(build("tight-flock"));
  const inputRef = useRef<SwarmInput>({
    mode: "patrol",
    cohesionScale: 1,
    separationScale: 1,
    alignmentScale: 1,
    paused: false,
  });
  const pendingSpawnsRef = useRef<SpawnThreatCommand[]>([]);

  // Keep the per-frame input in sync with the controls (the loop reads this ref).
  useEffect(() => {
    inputRef.current = {
      mode,
      cohesionScale: cohesion,
      separationScale: separation,
      alignmentScale: alignment,
      paused,
    };
  }, [mode, cohesion, separation, alignment, paused]);

  const rebuild = useCallback((nextPreset: string) => {
    stateRef.current = build(nextPreset);
    setPresetId(nextPreset);
    setMode(presetMode(nextPreset));
    setCohesion(1);
    setSeparation(1);
    setAlignment(1);
    setPaused(false);
  }, []);

  const onScaleChange = useCallback(
    (which: "cohesion" | "separation" | "alignment", value: number) => {
      if (which === "cohesion") setCohesion(value);
      else if (which === "separation") setSeparation(value);
      else setAlignment(value);
    },
    [],
  );

  // Spawn a small wave from random perimeter points, each homing toward the base.
  const onSpawnWave = useCallback(() => {
    const b = stateRef.current.config.bounds;
    const half = Math.min((b.maxX - b.minX) / 2, (b.maxY - b.minY) / 2);
    const r = half * 0.92;
    const kinds: SpawnThreatCommand["kind"][] = ["debris", "rogue", "asteroid", "comet"];
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      pendingSpawnsRef.current.push({
        pos: { x: Math.cos(angle) * r, y: Math.sin(angle) * r },
        kind: kinds[i % kinds.length],
      });
    }
  }, []);

  return (
    <>
      <SwarmCanvas
        stateRef={stateRef}
        inputRef={inputRef}
        pendingSpawnsRef={pendingSpawnsRef}
        onStats={setSnapshot}
      />

      <div className="pointer-events-none absolute inset-0 z-20">
        {/* controls, left column */}
        <div className="hud-scroll pointer-events-auto absolute left-3 top-40 z-10 flex max-h-[calc(100dvh-15rem)] flex-col gap-3 overflow-y-auto animate-hud-in sm:left-5">
          <SwarmControls
            mode={mode}
            onModeChange={setMode}
            cohesion={cohesion}
            separation={separation}
            alignment={alignment}
            onScaleChange={onScaleChange}
            paused={paused}
            onPauseToggle={() => setPaused((p) => !p)}
            presets={PRESET_OPTIONS}
            presetId={presetId}
            onPresetChange={rebuild}
            onReset={() => rebuild(presetId)}
            onSpawnWave={onSpawnWave}
          />
        </div>

        {/* HUD, right column */}
        <div className="hud-scroll pointer-events-auto absolute right-3 top-40 z-10 flex max-h-[calc(100dvh-15rem)] flex-col gap-3 overflow-y-auto animate-hud-in sm:right-5">
          <SwarmHud
            score={snapshot.score}
            wave={snapshot.wave}
            neutralized={snapshot.neutralized}
            breaches={snapshot.breaches}
            stats={snapshot.stats}
            mode={snapshot.mode}
          />
        </div>
      </div>
    </>
  );
}
