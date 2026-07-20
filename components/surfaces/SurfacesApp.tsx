"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BootScreen from "@/components/ui/BootScreen";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import {
  SURFACE_SITES,
  getSurfaceSite,
  surfaceState,
  type SurfaceWorld,
} from "@/lib/surfaces";
import SurfacesCanvas, { type MarsViewMode } from "./SurfacesCanvas";
import SurfacesHud from "./SurfacesHud";
import SurfacesTimeControl, { PLAY_SPEEDS } from "./SurfacesTimeControl";
import SurfacesAttributionFooter from "./SurfacesAttributionFooter";
import { useSurfacesAssets } from "./useSurfacesAssets";
import {
  SURFACE_WORLD_ORDER,
  WORLD_ACCENT,
  WORLD_LABEL,
  WORLD_TIER,
  findNextMarsSunset,
} from "./surfacesUi";

const DAY_MS = 86_400_000;

/**
 * Surfaces tab shell (the sibling of AsteroidMoonsApp): the app's first
 * ground-level view. Owns the selected world (Mars real tier / Titan
 * honest-cinematic tier), the site within it, the Mars view mode (real DEM
 * terrain vs real photo panorama) and the single displayed instant: a live
 * 1 Hz clock plus scrub / play / speeds spanning a Mars sol (~24.6 h) and
 * Titan's ~16 day solar cycle. Every readout derives from that one Date via
 * the pure lib/surfaces surfaceState; the scenes read the instant from a ref
 * per frame. "Live" is labeled throughout as live simulation, not a camera.
 */
export default function SurfacesApp() {
  const assets = useSurfacesAssets();

  // ── selected world + site ─────────────────────────────────────────────────
  const [world, setWorld] = useState<SurfaceWorld>("mars");
  const [siteIds, setSiteIds] = useState<Record<SurfaceWorld, string>>({
    mars: "gale",
    titan: "huygens",
  });
  const siteId = siteIds[world];
  const site = getSurfaceSite(world, siteId) ?? SURFACE_SITES[world][0];

  const [marsView, setMarsView] = useState<MarsViewMode>("terrain");
  const [exaggeration, setExaggeration] = useState(1);
  const [aboutOpen, setAboutOpen] = useState(false);

  // ── displayed instant (mirrors AsteroidMoonsApp) ──────────────────────────
  const displayedMsRef = useRef<number>(Date.now());
  const [displayedMs, setDisplayedMs] = useState<number>(() => Date.now());
  const [isLive, setIsLive] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0); // 10 min/s: sunset-watching speed

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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

  const onGoToMs = useCallback((ms: number) => {
    displayedMsRef.current = ms;
    setDisplayedMs(ms);
    setIsLive(false);
    setPlaying(false);
  }, []);

  // ── derived pure state for the HUD (one Date in, everything out) ──────────
  const state = useMemo(
    () => surfaceState(world, site.id, new Date(displayedMs)),
    [world, site.id, displayedMs]
  );

  // Next REAL Mars sunset at the selected site (Mars24 geometry), recomputed
  // once a minute against the wall clock, not per render.
  const sunsetAnchorMin = Math.floor(nowMs / 60_000);
  const nextSunsetMs = useMemo(() => {
    if (world !== "mars") return null;
    return findNextMarsSunset(site, sunsetAnchorMin * 60_000);
  }, [world, site, sunsetAnchorMin]);

  const onWorldChange = useCallback((w: SurfaceWorld) => {
    setWorld(w);
    setPlaying(false);
  }, []);

  const onSiteChange = useCallback(
    (id: string) => {
      setSiteIds((prev) => ({ ...prev, [world]: id }));
    },
    [world]
  );

  return (
    <main className="fixed inset-0 overflow-hidden bg-abyss">
      {assets.ready ? (
        <SurfacesCanvas
          world={world}
          site={site}
          marsView={marsView}
          exaggeration={exaggeration}
          assets={assets}
          displayedMsRef={displayedMsRef}
        />
      ) : (
        <BootScreen label="Raising the real Gale Crater terrain" />
      )}

      <div className="pointer-events-none absolute inset-0 z-10">
        <NavShell onAbout={() => setAboutOpen(true)} active="surfaces" />

        {/* top-centre: world + site selectors and the tier honesty pill */}
        <div className="absolute inset-x-0 top-[60px] flex flex-col items-center gap-2 px-3 sm:top-[68px]">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <WorldSelector world={world} onChange={onWorldChange} />
            <SiteSelector world={world} siteId={site.id} onChange={onSiteChange} />
          </div>
          <p className="hud-panel pointer-events-auto max-w-[92vw] rounded-full px-4 py-1.5 text-center font-mono text-[10px] leading-snug tracking-wide text-dim animate-hud-in sm:text-[11px]">
            {WORLD_TIER[world]}. Live means live simulation, not a camera.
          </p>
        </div>

        {/* left column: the surface HUD */}
        <div className="hud-scroll pointer-events-auto absolute left-3 top-32 z-10 flex max-h-[calc(100dvh-13rem)] w-[320px] flex-col gap-3 overflow-y-auto animate-hud-in sm:left-5 sm:top-36">
          <SurfacesHud
            state={state}
            isLive={isLive}
            marsView={marsView}
            demBits={assets.dem?.bitDepthUsed ?? null}
            exaggeration={exaggeration}
          />
        </div>

        <SurfacesTimeControl
          world={world}
          displayedMs={displayedMs}
          nowMs={nowMs}
          isLive={isLive}
          playing={playing}
          onNow={onNow}
          onPlayToggle={onPlayToggle}
          onScrub={onScrub}
          nextSunsetMs={nextSunsetMs}
          onGoToMs={onGoToMs}
          speedIdx={speedIdx}
          onSpeedChange={setSpeedIdx}
          marsView={marsView}
          onMarsViewChange={setMarsView}
          exaggeration={exaggeration}
          onExaggerationToggle={() => setExaggeration((e) => (e === 1 ? 2 : 1))}
        />

        <SurfacesAttributionFooter />
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}

/** Mars / Titan world selector (Mars leads: the real tier). */
function WorldSelector({
  world,
  onChange,
}: {
  world: SurfaceWorld;
  onChange: (w: SurfaceWorld) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Choose a world to stand on"
      className="hud-panel pointer-events-auto flex items-center justify-center gap-1 rounded-full p-1 animate-hud-in"
    >
      {SURFACE_WORLD_ORDER.map((w) => {
        const active = w === world;
        return (
          <button
            key={w}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(w)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              active ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
            }`}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: WORLD_ACCENT[w], opacity: active ? 1 : 0.6 }}
            />
            {WORLD_LABEL[w]}
          </button>
        );
      })}
    </div>
  );
}

/** Site selector within the world (Gale / Jezero; Huygens / Sub-Saturn). */
function SiteSelector({
  world,
  siteId,
  onChange,
}: {
  world: SurfaceWorld;
  siteId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Choose a surface site"
      className="hud-panel pointer-events-auto flex max-w-[94vw] flex-wrap items-center justify-center gap-1 rounded-full p-1 animate-hud-in"
    >
      {SURFACE_SITES[world].map((s) => {
        const active = s.id === siteId;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.id)}
            title={s.landingSite ? s.source : `${s.source} (a chosen viewpoint, not a landing site)`}
            className={`cursor-pointer rounded-full px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              active ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
            }`}
          >
            {s.name}
            {!s.landingSite && (
              <span className="ml-1 text-[9px] text-faint">(viewpoint)</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
