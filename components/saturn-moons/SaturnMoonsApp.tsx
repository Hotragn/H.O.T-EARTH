"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BootScreen from "@/components/ui/BootScreen";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import SaturnMoonsCanvas from "./SaturnMoonsCanvas";
import SaturnMoonsRingPanel from "./SaturnMoonsRingPanel";
import SaturnMoonsHud from "./SaturnMoonsHud";
import SaturnMoonsEventsPanel from "./SaturnMoonsEventsPanel";
import SaturnMoonsTimeControl, {
  PLAY_SPEEDS,
  VIEW_PRESETS,
} from "./SaturnMoonsTimeControl";
import SaturnMoonsAttributionFooter from "./SaturnMoonsAttributionFooter";
import { useSaturnTextures } from "./useSaturnTextures";
import { DEFAULT_OBSERVER, type Observer } from "./saturnUi";

const DAY_MS = 86_400_000;

/**
 * Saturn's Moons tab shell (the twin of JupiterMoonsApp). Owns the single
 * displayed instant: a live 1 Hz clock, plus scrub / play-pause / speed, and the
 * observer location. Everything drawn (scene, ring panel, HUD, events,
 * visibility) derives from that one Date via the pure lib/saturn-moons API. The
 * scene reads the instant from a ref per frame (smooth playback); the panels read
 * a throttled state mirror.
 */
export default function SaturnMoonsApp() {
  const { textures, ready, saturnFallback } = useSaturnTextures();

  // ── displayed instant ─────────────────────────────────────────────────────
  const displayedMsRef = useRef<number>(Date.now());
  const [displayedMs, setDisplayedMs] = useState<number>(() => Date.now());
  const [isLive, setIsLive] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(2); // default 6 hr/s (inner-moon motion)

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
  const [viewIdx, setViewIdx] = useState(2); // default "Titan" (24 Req): rings + inner moons
  const [exaggerate, setExaggerate] = useState(true);
  const [observer, setObserver] = useState<Observer>(DEFAULT_OBSERVER);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Clicking an event jumps the scene there and zooms to the rings to watch it.
  const onPickEvent = useCallback((ms: number) => {
    displayedMsRef.current = ms;
    setDisplayedMs(ms);
    setIsLive(false);
    setPlaying(false);
    setViewIdx(0); // "Rings"
  }, []);

  const targetReq = VIEW_PRESETS[viewIdx].targetReq;

  return (
    <main className="fixed inset-0 overflow-hidden bg-abyss">
      {ready ? (
        <SaturnMoonsCanvas
          textures={textures}
          saturnFallback={saturnFallback}
          displayedMsRef={displayedMsRef}
          targetReq={targetReq}
          exaggerate={exaggerate}
        />
      ) : (
        <BootScreen label="Pointing the telescope at Saturn" />
      )}

      <div className="pointer-events-none absolute inset-0 z-10">
        <NavShell onAbout={() => setAboutOpen(true)} active="saturn-moons" />

        <ViewLegend exaggerate={exaggerate} />

        {/* left column: the ring/seasonality headline, then the Saturn/moon HUD */}
        <div className="hud-scroll pointer-events-auto absolute left-3 top-20 z-10 flex max-h-[calc(100dvh-11rem)] w-[310px] flex-col gap-3 overflow-y-auto animate-hud-in sm:left-5 sm:top-24">
          <SaturnMoonsRingPanel displayedMs={displayedMs} />
          <SaturnMoonsHud
            displayedMs={displayedMs}
            isLive={isLive}
            observer={observer}
            onObserverChange={setObserver}
          />
        </div>

        <SaturnMoonsEventsPanel nowMs={nowMs} onPickEvent={onPickEvent} />

        <SaturnMoonsTimeControl
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

        <SaturnMoonsAttributionFooter />
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}

/**
 * Centered honesty pill under the nav: the fixed plane-of-sky compass convention
 * and the marker-size disclaimer, matching the toggle. No em-dashes (project copy
 * rule). Mirrors JupiterMoonsApp's ViewLegend.
 */
function ViewLegend({ exaggerate }: { exaggerate: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[68px] flex justify-center px-3 sm:top-[76px]">
      <p className="hud-panel max-w-[92vw] rounded-full px-4 py-1.5 text-center font-mono text-[10px] leading-snug tracking-wide text-dim animate-hud-in sm:text-[11px]">
        Plane of sky (telescope view): N up, S down, W right, E left. Moons string
        along the tilted ring ellipse (real geometry).{" "}
        {exaggerate
          ? "Moon markers enlarged for visibility (real moons are tiny vs Saturn)."
          : "Moon markers at true angular size."}
      </p>
    </div>
  );
}
