"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BootScreen from "@/components/ui/BootScreen";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import JupiterMoonsCanvas from "./JupiterMoonsCanvas";
import JupiterMoonsHud from "./JupiterMoonsHud";
import JupiterMoonsEventsPanel from "./JupiterMoonsEventsPanel";
import JupiterMoonsTimeControl, {
  PLAY_SPEEDS,
  VIEW_PRESETS,
} from "./JupiterMoonsTimeControl";
import JupiterMoonsAttributionFooter from "./JupiterMoonsAttributionFooter";
import { useJupiterTextures } from "./useJupiterTextures";
import { DEFAULT_OBSERVER, type Observer } from "./galileanUi";

const DAY_MS = 86_400_000;

/**
 * Jupiter's Moons tab shell (mirrors IssApp / MoonApp). Owns the single displayed
 * instant: a live 1 Hz clock, plus scrub / play-pause / speed, and the observer
 * location. Everything drawn (scene, HUD, events, visibility) derives from that
 * one Date via the pure lib/jupiter-moons API. The scene reads the instant from a
 * ref per frame (smooth playback); the panels read a throttled state mirror.
 */
export default function JupiterMoonsApp() {
  const { textures, ready, jupiterFallback } = useJupiterTextures();

  // ── displayed instant ─────────────────────────────────────────────────────
  const displayedMsRef = useRef<number>(Date.now());
  const [displayedMs, setDisplayedMs] = useState<number>(() => Date.now());
  const [isLive, setIsLive] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(2); // default 30 min/s

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

  // ── view + observer ───────────────────────────────────────────────────────
  const [viewIdx, setViewIdx] = useState(1); // default "Moons" (16 Rj)
  const [exaggerate, setExaggerate] = useState(true);
  const [observer, setObserver] = useState<Observer>(DEFAULT_OBSERVER);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Clicking an event jumps the scene there and zooms to the disk to watch it.
  const onPickEvent = useCallback((ms: number) => {
    displayedMsRef.current = ms;
    setDisplayedMs(ms);
    setIsLive(false);
    setPlaying(false);
    setViewIdx(0); // "Disk"
  }, []);

  const targetRj = VIEW_PRESETS[viewIdx].targetRj;

  return (
    <main className="fixed inset-0 overflow-hidden bg-abyss">
      {ready ? (
        <JupiterMoonsCanvas
          textures={textures}
          jupiterFallback={jupiterFallback}
          displayedMsRef={displayedMsRef}
          targetRj={targetRj}
          exaggerate={exaggerate}
        />
      ) : (
        <BootScreen label="Pointing the telescope at Jupiter" />
      )}

      <div className="pointer-events-none absolute inset-0 z-10">
        <NavShell onAbout={() => setAboutOpen(true)} active="jupiter-moons" />

        <ViewLegend exaggerate={exaggerate} />

        <JupiterMoonsHud
          displayedMs={displayedMs}
          isLive={isLive}
          observer={observer}
          onObserverChange={setObserver}
        />

        <JupiterMoonsEventsPanel nowMs={nowMs} onPickEvent={onPickEvent} />

        <JupiterMoonsTimeControl
          displayedMs={displayedMs}
          nowMs={nowMs}
          isLive={isLive}
          playing={playing}
          onNow={onNow}
          onPlayToggle={onPlayToggle}
          onScrub={onScrub}
          speedIdx={speedIdx}
          onSpeedChange={setSpeedIdx}
          viewIdx={viewIdx}
          onViewChange={setViewIdx}
          exaggerate={exaggerate}
          onExaggerateToggle={() => setExaggerate((e) => !e)}
        />

        <JupiterMoonsAttributionFooter />
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}

/**
 * Centered honesty pill under the nav: the fixed plane-of-sky compass convention
 * and the marker-size disclaimer, matching the toggle. No em-dashes (project copy
 * rule). Mirrors MoonApp's NoWeatherNote placement.
 */
function ViewLegend({ exaggerate }: { exaggerate: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[68px] flex justify-center px-3 sm:top-[76px]">
      <p className="hud-panel max-w-[92vw] rounded-full px-4 py-1.5 text-center font-mono text-[10px] leading-snug tracking-wide text-dim animate-hud-in sm:text-[11px]">
        Plane of sky (telescope view): N up, S down, W right, E left.{" "}
        {exaggerate
          ? "Moon markers enlarged for visibility (real moons ~1 arcsec)."
          : "Moon markers at true angular size."}
      </p>
    </div>
  );
}
