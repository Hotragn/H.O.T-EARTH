"use client";

import { useMemo, useState } from "react";
import BootScreen from "@/components/ui/BootScreen";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import {
  blackHoleState,
  getBlackHole,
  type BlackHoleId,
} from "@/lib/black-holes";
import LensCanvas from "./LensCanvas";
import BlackHolesHud from "./BlackHolesHud";
import BlackHolesHonesty from "./BlackHolesHonesty";
import TimeDilationDial from "./TimeDilationDial";
import SpaghettificationPanel from "./SpaghettificationPanel";
import EhtImagePanel from "./EhtImagePanel";
import LensingDemoPanel from "./LensingDemoPanel";
import BlackHolesAttributionFooter from "./BlackHolesAttributionFooter";
import { BH_ACCENT, BH_LABEL, BH_ORDER, RENDER_LABEL } from "./blackHolesUi";

/**
 * Black Holes tab shell (the fifth "Beyond"-group world). Owns the selected
 * object (default M87*, the most visually striking, and the first black hole
 * ever imaged) and the About panel. The centrepiece is the physically-based
 * gravitational-lensing render; every fact panel derives from ONE bundle,
 * blackHoleState(id), plus the catalog object. Selecting an object swaps the
 * facts and rescales the render by the real Schwarzschild radius.
 */
export default function BlackHolesApp() {
  const [id, setId] = useState<BlackHoleId>("m87-star");
  const [aboutOpen, setAboutOpen] = useState(false);

  const bh = useMemo(() => getBlackHole(id), [id]);
  const state = useMemo(() => blackHoleState(id), [id]);
  const accent = BH_ACCENT[id];

  return (
    <main className="fixed inset-0 overflow-hidden bg-abyss">
      {state ? (
        <LensCanvas key={id} state={state} accent={accent} />
      ) : (
        <BootScreen label="Bending starlight around a black hole" />
      )}

      <div className="pointer-events-none absolute inset-0 z-10">
        <NavShell onAbout={() => setAboutOpen(true)} active="black-holes" />

        {/* top-centre: object selector + the render honesty pill */}
        <div className="absolute inset-x-0 top-[60px] flex flex-col items-center gap-2 px-3 sm:top-[68px]">
          <ObjectSelector id={id} onChange={setId} />
          <p className="hud-panel pointer-events-auto max-w-[92vw] rounded-full px-4 py-1.5 text-center font-mono text-[10px] leading-snug tracking-wide text-dim animate-hud-in sm:text-[11px]">
            {RENDER_LABEL}
          </p>
        </div>

        {/* left column: facts (real, cited) + the galaxy-scale lensing demo */}
        <div className="hud-scroll pointer-events-auto absolute left-3 top-32 z-10 flex max-h-[calc(100dvh-13rem)] w-[320px] flex-col gap-3 overflow-y-auto animate-hud-in sm:left-5 sm:top-36">
          {bh && state ? (
            <>
              <BlackHolesHud bh={bh} state={state} />
              <LensingDemoPanel />
            </>
          ) : (
            <div className="hud-panel rounded-2xl p-4 font-mono text-[11px] text-dim">
              This object could not be resolved from the catalog.
            </div>
          )}
        </div>

        {/* right column: honesty + interactive dials + EHT image */}
        <div className="hud-scroll pointer-events-auto absolute right-3 top-32 z-10 flex max-h-[calc(100dvh-13rem)] w-[300px] flex-col gap-3 overflow-y-auto animate-hud-in sm:right-5 sm:top-36">
          <BlackHolesHonesty />
          <TimeDilationDial />
          {state && <SpaghettificationPanel state={state} />}
          {bh && state && <EhtImagePanel bh={bh} state={state} />}
        </div>

        <BlackHolesAttributionFooter />
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}

/** Object selector across the six real black holes (M87* leads visually). */
function ObjectSelector({
  id,
  onChange,
}: {
  id: BlackHoleId;
  onChange: (id: BlackHoleId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Choose a black hole"
      className="hud-panel pointer-events-auto flex max-w-[94vw] flex-wrap items-center justify-center gap-1 rounded-full p-1 animate-hud-in"
    >
      {BH_ORDER.map((oid) => {
        const active = oid === id;
        return (
          <button
            key={oid}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(oid)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              active ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
            }`}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: BH_ACCENT[oid], opacity: active ? 1 : 0.6 }}
            />
            {BH_LABEL[oid]}
          </button>
        );
      })}
    </div>
  );
}
