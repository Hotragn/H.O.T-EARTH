"use client";

import { useCallback, useMemo, useState } from "react";
import BootScreen from "@/components/ui/BootScreen";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import { exoSurfaceState } from "@/lib/exo-surfaces";
import ExoSurfacesCanvas from "./ExoSurfacesCanvas";
import ExoSurfacesHud from "./ExoSurfacesHud";
import ExoSurfacesHonesty from "./ExoSurfacesHonesty";
import ExoSurfacesTimeControl from "./ExoSurfacesTimeControl";
import ExoSurfacesAttributionFooter from "./ExoSurfacesAttributionFooter";
import { useExoSystems } from "./useExoSystems";
import {
  VANTAGE_ACCENT,
  VANTAGE_LABEL,
  VANTAGE_ORDER,
  VANTAGE_TIER,
  type DayMode,
} from "./exoSurfacesUi";

/**
 * Exoplanet Surfaces tab shell (the sibling of SurfacesApp), the "Beyond"-group
 * ground-level view. Owns the selected vantage (default TRAPPIST-1 e, the
 * showcase), the illustrative day-mode toggle for tidally-locked-inference
 * worlds, and the About panel. Everything on screen derives from ONE bundle:
 * exoSurfaceState(vantageId, systems), where `systems` is the committed
 * catalogue loaded by useExoSystems. There is NO local clock (rotation/day
 * length are not measured); the only real time quantity is the year.
 */
export default function ExoSurfacesApp() {
  const { systems, loaded, acknowledgment } = useExoSystems();

  const [vantageId, setVantageId] = useState<string>("trappist-1e");
  const [dayMode, setDayMode] = useState<DayMode>("day");
  const [aboutOpen, setAboutOpen] = useState(false);

  const state = useMemo(
    () => exoSurfaceState(vantageId, systems),
    [vantageId, systems]
  );

  const onVantageChange = useCallback((id: string) => {
    setVantageId(id);
    setDayMode("day");
  }, []);

  // Day-mode toggle only makes sense where tidal locking is inferred likely.
  const lockable = state?.tidalLock?.likelyLocked === true && state.hasSurface;

  return (
    <main className="fixed inset-0 overflow-hidden bg-abyss">
      {loaded && state ? (
        <ExoSurfacesCanvas key={vantageId} state={state} dayMode={dayMode} />
      ) : (
        <BootScreen label="Computing an alien sky from real data" />
      )}

      <div className="pointer-events-none absolute inset-0 z-10">
        <NavShell onAbout={() => setAboutOpen(true)} active="exo-surfaces" />

        {/* top-centre: vantage selector + the tier honesty pill */}
        <div className="absolute inset-x-0 top-[60px] flex flex-col items-center gap-2 px-3 sm:top-[68px]">
          <VantageSelector vantageId={vantageId} onChange={onVantageChange} />
          <p className="hud-panel pointer-events-auto max-w-[92vw] rounded-full px-4 py-1.5 text-center font-mono text-[10px] leading-snug tracking-wide text-dim animate-hud-in sm:text-[11px]">
            {VANTAGE_TIER[vantageId] ?? "sky computed from real data; ground illustrative"}
            . The sky is real; the ground is illustrative.
          </p>
        </div>

        {/* left column: the facts (real, cited) panel */}
        <div className="hud-scroll pointer-events-auto absolute left-3 top-32 z-10 flex max-h-[calc(100dvh-13rem)] w-[320px] flex-col gap-3 overflow-y-auto animate-hud-in sm:left-5 sm:top-36">
          {state ? (
            <ExoSurfacesHud state={state} />
          ) : (
            loaded && (
              <div className="hud-panel rounded-2xl p-4 font-mono text-[11px] text-dim">
                This vantage could not be resolved from the catalogue.
              </div>
            )
          )}
        </div>

        {/* right column: the honesty panel (prominent) */}
        <div className="hud-scroll pointer-events-auto absolute right-3 top-32 z-10 flex max-h-[calc(100dvh-13rem)] w-[300px] flex-col gap-3 overflow-y-auto animate-hud-in sm:right-5 sm:top-36">
          {state && <ExoSurfacesHonesty state={state} />}
        </div>

        {state && (
          <ExoSurfacesTimeControl
            state={state}
            dayMode={dayMode}
            onDayModeChange={setDayMode}
            lockable={lockable}
          />
        )}

        <ExoSurfacesAttributionFooter acknowledgment={acknowledgment} />
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}

/** Vantage selector (TRAPPIST-1 e leads: the showcase). */
function VantageSelector({
  vantageId,
  onChange,
}: {
  vantageId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Choose an exoplanet to stand on"
      className="hud-panel pointer-events-auto flex max-w-[94vw] flex-wrap items-center justify-center gap-1 rounded-full p-1 animate-hud-in"
    >
      {VANTAGE_ORDER.map((id) => {
        const active = id === vantageId;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              active ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
            }`}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: VANTAGE_ACCENT[id], opacity: active ? 1 : 0.6 }}
            />
            {VANTAGE_LABEL[id]}
          </button>
        );
      })}
    </div>
  );
}
