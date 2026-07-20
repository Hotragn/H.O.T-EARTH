"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BootScreen from "@/components/ui/BootScreen";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import type { AsteroidSystem } from "@/lib/asteroid-moons";
import AsteroidMoonsCanvas from "./AsteroidMoonsCanvas";
import AsteroidMoonsSystemPanel from "./AsteroidMoonsSystemPanel";
import AsteroidMoonsHud from "./AsteroidMoonsHud";
import AsteroidMoonsCometPanel from "./AsteroidMoonsCometPanel";
import AsteroidMoonsTimeControl, {
  DEFAULT_VIEW_IDX,
  PLAY_SPEEDS,
  VIEW_PRESETS,
} from "./AsteroidMoonsTimeControl";
import AsteroidMoonsAttributionFooter from "./AsteroidMoonsAttributionFooter";
import { useAsteroidMoonsTextures } from "./useAsteroidMoonsTextures";
import {
  ASTEROID_SYSTEM_ORDER,
  SCHEMATIC_CAVEAT,
  SYSTEM_FALLBACK_COLOR,
} from "./asteroidMoonsUi";

const DAY_MS = 86_400_000;
/** The system shown first: Didymos (the DART showcase). */
const DEFAULT_SYSTEM: AsteroidSystem = "Didymos";

/**
 * Asteroid Moons tab shell (the twin of DwarfMoonsApp, plus a SYSTEM SELECTOR). Owns
 * the selected asteroid system and the single displayed instant: a live 1 Hz clock,
 * plus scrub / play-pause / speed and a DART-impact landmark. Selecting a system
 * swaps the primary, the moon set and every readout. Everything drawn (scene, system
 * panel, HUD, comet panel) derives from that one Date and system via the pure
 * lib/asteroid-moons API. The scene reads the instant from a ref per frame (smooth
 * playback); the panels read a throttled state mirror.
 */
export default function AsteroidMoonsApp() {
  const { textures, ready } = useAsteroidMoonsTextures();

  // ── selected system ───────────────────────────────────────────────────────
  const [system, setSystem] = useState<AsteroidSystem>(DEFAULT_SYSTEM);

  // ── displayed instant ─────────────────────────────────────────────────────
  const displayedMsRef = useRef<number>(Date.now());
  const [displayedMs, setDisplayedMs] = useState<number>(() => Date.now());
  const [isLive, setIsLive] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1); // default 6 hr/s (watch the moons move)

  // 1 Hz wall clock for the "now" baseline + live readouts.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Single animation loop: advance the displayed instant (live follows now, play
  // fast-forwards) and mirror it into state ~5 Hz for the panels. The scene reads
  // displayedMsRef directly each frame, so playback stays smooth off the React path.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastMirror = 0;
    const loop = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      if (isLive) {
        displayedMsRef.current = Date.now();
      } else if (playing) {
        displayedMsRef.current += dt * PLAY_SPEEDS[speedIdx].msPerSec;
      }
      if (t - lastMirror > 180) {
        lastMirror = t;
        setDisplayedMs(displayedMsRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isLive, playing, speedIdx]);

  // ── view ──────────────────────────────────────────────────────────────────
  const [viewIdx, setViewIdx] = useState<number>(DEFAULT_VIEW_IDX[DEFAULT_SYSTEM]);
  const [exaggerate, setExaggerate] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Switching system resets the zoom to that system's sensible default (set both in
  // one batch so viewIdx is never out of range for the new system's presets).
  const onSystemChange = useCallback((next: AsteroidSystem) => {
    setSystem(next);
    setViewIdx(DEFAULT_VIEW_IDX[next]);
  }, []);

  const onNow = useCallback(() => {
    const n = Date.now();
    displayedMsRef.current = n;
    setDisplayedMs(n);
    setIsLive(true);
    setPlaying(false);
  }, []);

  const onPlayToggle = useCallback(() => {
    setPlaying((p) => {
      const next = !p;
      if (next) setIsLive(false);
      return next;
    });
  }, []);

  const onScrub = useCallback((offsetDays: number) => {
    const ms = Date.now() + offsetDays * DAY_MS;
    displayedMsRef.current = ms;
    setDisplayedMs(ms);
    setIsLive(false);
    setPlaying(false);
  }, []);

  const onGoToMs = useCallback((ms: number) => {
    displayedMsRef.current = ms;
    setDisplayedMs(ms);
    setIsLive(false);
    setPlaying(false);
  }, []);

  const presets = VIEW_PRESETS[system];
  const safeViewIdx = Math.min(viewIdx, presets.length - 1);
  const targetReq = presets[safeViewIdx].targetReq;

  return (
    <main className="fixed inset-0 overflow-hidden bg-abyss">
      {ready ? (
        <AsteroidMoonsCanvas
          system={system}
          textures={textures}
          displayedMsRef={displayedMsRef}
          targetReq={targetReq}
          exaggerate={exaggerate}
        />
      ) : (
        <BootScreen label="Framing the binary asteroid orbits" />
      )}

      <div className="pointer-events-none absolute inset-0 z-10">
        <NavShell onAbout={() => setAboutOpen(true)} active="asteroid-moons" />

        {/* top-centre: the system selector (drives everything) + the honesty legend */}
        <div className="absolute inset-x-0 top-[60px] flex flex-col items-center gap-2 px-3 sm:top-[68px]">
          <SystemSelector system={system} onChange={onSystemChange} />
          <ViewLegend exaggerate={exaggerate} />
        </div>

        {/* left column: the system-geometry headline, then the system/moon HUD */}
        <div className="hud-scroll pointer-events-auto absolute left-3 top-32 z-10 flex max-h-[calc(100dvh-13rem)] w-[310px] flex-col gap-3 overflow-y-auto animate-hud-in sm:left-5 sm:top-36">
          <AsteroidMoonsSystemPanel system={system} displayedMs={displayedMs} />
          <AsteroidMoonsHud system={system} displayedMs={displayedMs} isLive={isLive} />
        </div>

        {/* right column: the comet honesty centerpiece (no observer panel here) */}
        <AsteroidMoonsCometPanel />

        <AsteroidMoonsTimeControl
          system={system}
          displayedMs={displayedMs}
          nowMs={nowMs}
          isLive={isLive}
          playing={playing}
          onNow={onNow}
          onPlayToggle={onPlayToggle}
          onScrub={onScrub}
          onGoToMs={onGoToMs}
          speedIdx={speedIdx}
          onSpeedChange={setSpeedIdx}
          viewIdx={safeViewIdx}
          onViewChange={setViewIdx}
          exaggerate={exaggerate}
          onExaggerateToggle={() => setExaggerate((e) => !e)}
        />

        <AsteroidMoonsAttributionFooter />
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}

/**
 * The system selector: a prominent segmented control (Didymos / Ida / Sylvia /
 * Kleopatra / Antiope / Kalliope / Eugenia / Patroclus) that drives which system is
 * shown. Each option carries the system's fallback tint as a small dot. Didymos
 * leads (the DART showcase).
 */
function SystemSelector({
  system,
  onChange,
}: {
  system: AsteroidSystem;
  onChange: (s: AsteroidSystem) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Choose an asteroid system"
      className="hud-panel pointer-events-auto flex max-w-[94vw] flex-wrap items-center justify-center gap-1 rounded-full p-1 animate-hud-in"
    >
      {ASTEROID_SYSTEM_ORDER.map((s) => {
        const active = s === system;
        return (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              active ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
            }`}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: SYSTEM_FALLBACK_COLOR[s],
                opacity: active ? 1 : 0.6,
              }}
            />
            {s}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Centered honesty pill: the schematic-view caveat (this is a face-on schematic
 * mutual orbit, not the sky, so no compass and no visibility claim) plus the
 * marker-size disclaimer. No em-dashes. Mirrors DwarfMoonsApp's ViewLegend.
 */
function ViewLegend({ exaggerate }: { exaggerate: boolean }) {
  return (
    <p className="hud-panel pointer-events-auto max-w-[92vw] rounded-full px-4 py-1.5 text-center font-mono text-[10px] leading-snug tracking-wide text-dim animate-hud-in sm:text-[11px]">
      {SCHEMATIC_CAVEAT}{" "}
      {exaggerate
        ? "Tiny moons enlarged for visibility."
        : "Moons at true scale."}
    </p>
  );
}
