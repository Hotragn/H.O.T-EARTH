"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BootScreen from "@/components/ui/BootScreen";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import type { OtherPlanet } from "@/lib/other-moons";
import OtherMoonsCanvas from "./OtherMoonsCanvas";
import OtherMoonsSystemPanel from "./OtherMoonsSystemPanel";
import OtherMoonsHud from "./OtherMoonsHud";
import OtherMoonsConfigPanel from "./OtherMoonsConfigPanel";
import OtherMoonsTimeControl, {
  DEFAULT_VIEW_IDX,
  PLAY_SPEEDS,
  VIEW_PRESETS,
} from "./OtherMoonsTimeControl";
import OtherMoonsAttributionFooter from "./OtherMoonsAttributionFooter";
import { useOtherMoonsTextures } from "./useOtherMoonsTextures";
import {
  DEFAULT_OBSERVER,
  OTHER_PLANET_ORDER,
  PLANET_FALLBACK_COLOR,
  type Observer,
} from "./otherMoonsUi";

const DAY_MS = 86_400_000;
/** The planet shown first: Uranus (its ~98-degree tip is the strongest opener). */
const DEFAULT_PLANET: OtherPlanet = "Uranus";

/**
 * Other Moons tab shell (the twin of SaturnMoonsApp, plus a PLANET SELECTOR). Owns
 * the selected planet and the single displayed instant: a live 1 Hz clock, plus
 * scrub / play-pause / speed, and the observer location. Selecting a planet swaps
 * the disk texture, the moon set and every readout. Everything drawn (scene,
 * system panel, HUD, config, visibility) derives from that one Date and planet via
 * the pure lib/other-moons API. The scene reads the instant from a ref per frame
 * (smooth playback); the panels read a throttled state mirror.
 */
export default function OtherMoonsApp() {
  const { textures, ready } = useOtherMoonsTextures();

  // ── selected planet ───────────────────────────────────────────────────────
  const [planet, setPlanet] = useState<OtherPlanet>(DEFAULT_PLANET);

  // ── displayed instant ─────────────────────────────────────────────────────
  const displayedMsRef = useRef<number>(Date.now());
  const [displayedMs, setDisplayedMs] = useState<number>(() => Date.now());
  const [isLive, setIsLive] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(2); // default 6 hr/s

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

  // ── view + observer ───────────────────────────────────────────────────────
  const [viewIdx, setViewIdx] = useState<number>(DEFAULT_VIEW_IDX[DEFAULT_PLANET]);
  const [exaggerate, setExaggerate] = useState(true);
  const [observer, setObserver] = useState<Observer>(DEFAULT_OBSERVER);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Switching planet resets the zoom to that planet's sensible default (set both in
  // one batch so viewIdx is never out of range for the new planet's presets).
  const onPlanetChange = useCallback((next: OtherPlanet) => {
    setPlanet(next);
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

  // Clicking a scanned event jumps the scene there and zooms to the disk to watch it.
  const onPickEvent = useCallback((ms: number) => {
    displayedMsRef.current = ms;
    setDisplayedMs(ms);
    setIsLive(false);
    setPlaying(false);
    setViewIdx(0); // closest preset for this planet
  }, []);

  const presets = VIEW_PRESETS[planet];
  const safeViewIdx = Math.min(viewIdx, presets.length - 1);
  const targetReq = presets[safeViewIdx].targetReq;

  return (
    <main className="fixed inset-0 overflow-hidden bg-abyss">
      {ready ? (
        <OtherMoonsCanvas
          planet={planet}
          textures={textures}
          displayedMsRef={displayedMsRef}
          targetReq={targetReq}
          exaggerate={exaggerate}
        />
      ) : (
        <BootScreen label="Pointing the telescope outward" />
      )}

      <div className="pointer-events-none absolute inset-0 z-10">
        <NavShell onAbout={() => setAboutOpen(true)} active="other-moons" />

        {/* top-centre: the planet selector (drives everything) + the honesty legend */}
        <div className="absolute inset-x-0 top-[60px] flex flex-col items-center gap-2 px-3 sm:top-[68px]">
          <PlanetSelector planet={planet} onChange={onPlanetChange} />
          <ViewLegend exaggerate={exaggerate} />
        </div>

        {/* left column: the system-geometry headline, then the planet/moon HUD */}
        <div className="hud-scroll pointer-events-auto absolute left-3 top-32 z-10 flex max-h-[calc(100dvh-13rem)] w-[310px] flex-col gap-3 overflow-y-auto animate-hud-in sm:left-5 sm:top-36">
          <OtherMoonsSystemPanel planet={planet} displayedMs={displayedMs} />
          <OtherMoonsHud
            planet={planet}
            displayedMs={displayedMs}
            isLive={isLive}
            observer={observer}
            onObserverChange={setObserver}
          />
        </div>

        <OtherMoonsConfigPanel
          planet={planet}
          displayedMs={displayedMs}
          nowMs={nowMs}
          onPickEvent={onPickEvent}
        />

        <OtherMoonsTimeControl
          planet={planet}
          displayedMs={displayedMs}
          nowMs={nowMs}
          isLive={isLive}
          playing={playing}
          onNow={onNow}
          onPlayToggle={onPlayToggle}
          onScrub={onScrub}
          speedIdx={speedIdx}
          onSpeedChange={setSpeedIdx}
          viewIdx={safeViewIdx}
          onViewChange={setViewIdx}
          exaggerate={exaggerate}
          onExaggerateToggle={() => setExaggerate((e) => !e)}
        />

        <OtherMoonsAttributionFooter />
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}

/**
 * The planet selector: a prominent segmented control (Mars / Uranus / Neptune)
 * that drives which planet's disk, moons and readouts are shown. Each option
 * carries the planet's fallback tint as a small dot.
 */
function PlanetSelector({
  planet,
  onChange,
}: {
  planet: OtherPlanet;
  onChange: (p: OtherPlanet) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Choose a planet"
      className="hud-panel pointer-events-auto flex items-center gap-1 rounded-full p-1 animate-hud-in"
    >
      {OTHER_PLANET_ORDER.map((p) => {
        const active = p === planet;
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(p)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              active
                ? "bg-white/10 text-ice"
                : "text-faint hover:text-dim"
            }`}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: PLANET_FALLBACK_COLOR[p],
                opacity: active ? 1 : 0.6,
              }}
            />
            {p}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Centered honesty pill: the fixed plane-of-sky compass convention and the
 * marker-size disclaimer, matching the toggle. No em-dashes (project copy rule).
 * Mirrors SaturnMoonsApp's ViewLegend.
 */
function ViewLegend({ exaggerate }: { exaggerate: boolean }) {
  return (
    <p className="hud-panel pointer-events-auto max-w-[92vw] rounded-full px-4 py-1.5 text-center font-mono text-[10px] leading-snug tracking-wide text-dim animate-hud-in sm:text-[11px]">
      Plane of sky (telescope view): N up, S down, W right, E left. Moons string
      along the tilted equatorial ellipse (real geometry).{" "}
      {exaggerate
        ? "Moon markers enlarged for visibility (real moons and disks are tiny)."
        : "Moon markers at true angular size."}
    </p>
  );
}
