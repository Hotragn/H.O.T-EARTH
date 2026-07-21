"use client";

import { useMemo, useState } from "react";
import BootScreen from "@/components/ui/BootScreen";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import {
  getNeutronStar,
  neutronStarState,
  type NeutronStarId,
} from "@/lib/neutron-stars";
import PulsarCanvas from "./PulsarCanvas";
import NeutronStarsHud from "./NeutronStarsHud";
import NeutronStarsHonesty from "./NeutronStarsHonesty";
import PulseTrainPlot from "./PulseTrainPlot";
import JoyDivisionPlot from "./JoyDivisionPlot";
import PulsarImagePanel from "./PulsarImagePanel";
import PulseAudio from "./PulseAudio";
import NeutronStarsAttributionFooter from "./NeutronStarsAttributionFooter";
import { NS_ACCENT, NS_LABEL, NS_ORDER, RENDER_LABEL } from "./neutronStarsUi";

/**
 * Neutron Stars tab shell (the sixth "Beyond"-group world). Owns the selected
 * pulsar (default the Crab, the best combined visual + audible object at ~30 Hz)
 * and the About panel. The centrepiece is the illustrative lighthouse render;
 * every fact panel derives from ONE bundle, neutronStarState(id), plus the
 * catalog object. Selecting an object swaps the facts, the visual spin, the pulse
 * cadence and the synthesized-audio frequency.
 */
export default function NeutronStarsApp() {
  const [id, setId] = useState<NeutronStarId>("crab");
  const [aboutOpen, setAboutOpen] = useState(false);

  const ns = useMemo(() => getNeutronStar(id), [id]);
  const state = useMemo(() => neutronStarState(id), [id]);
  const accent = NS_ACCENT[id];

  return (
    <main className="fixed inset-0 overflow-hidden bg-abyss">
      {state ? (
        <PulsarCanvas key={id} state={state} accent={accent} />
      ) : (
        <BootScreen label="Spinning up a neutron star" />
      )}

      <div className="pointer-events-none absolute inset-0 z-10">
        <NavShell onAbout={() => setAboutOpen(true)} active="neutron-stars" />

        {/* top-centre: object selector + the render honesty pill */}
        <div className="absolute inset-x-0 top-[60px] flex flex-col items-center gap-2 px-3 sm:top-[68px]">
          <ObjectSelector id={id} onChange={setId} />
          <p className="hud-panel pointer-events-auto max-w-[92vw] rounded-full px-4 py-1.5 text-center font-mono text-[10px] leading-snug tracking-wide text-dim animate-hud-in sm:text-[11px]">
            {RENDER_LABEL}
          </p>
        </div>

        {/* left column: facts (real, cited) + the live pulse train */}
        <div className="hud-scroll pointer-events-auto absolute left-3 top-32 z-10 flex max-h-[calc(100dvh-13rem)] w-[320px] flex-col gap-3 overflow-y-auto animate-hud-in sm:left-5 sm:top-36">
          {ns && state ? (
            <>
              <NeutronStarsHud ns={ns} state={state} />
              <PulseTrainPlot
                periodS={ns.periodS}
                spinFrequencyHz={state.spinFrequencyHz}
                accent={accent}
              />
            </>
          ) : (
            <div className="hud-panel rounded-2xl p-4 font-mono text-[11px] text-dim">
              This object could not be resolved from the catalog.
            </div>
          )}
        </div>

        {/* right column: honesty + audio + Joy Division + real image */}
        <div className="hud-scroll pointer-events-auto absolute right-3 top-32 z-10 flex max-h-[calc(100dvh-13rem)] w-[300px] flex-col gap-3 overflow-y-auto animate-hud-in sm:right-5 sm:top-36">
          <NeutronStarsHonesty />
          {state && <PulseAudio spinFrequencyHz={state.spinFrequencyHz} />}
          <JoyDivisionPlot seed={id === "psr-b1919+21" ? 1919 : hashSeed(id)} />
          <PulsarImagePanel id={id} />
        </div>

        <NeutronStarsAttributionFooter />
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}

/** Stable per-object seed for the illustrative ridgeline (B1919+21 keeps 1919). */
function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

/** Object selector across the nine real neutron stars (the Crab leads). */
function ObjectSelector({
  id,
  onChange,
}: {
  id: NeutronStarId;
  onChange: (id: NeutronStarId) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Choose a neutron star"
      className="hud-panel pointer-events-auto flex max-w-[94vw] flex-wrap items-center justify-center gap-1 rounded-full p-1 animate-hud-in"
    >
      {NS_ORDER.map((oid) => {
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
              style={{ backgroundColor: NS_ACCENT[oid], opacity: active ? 1 : 0.6 }}
            />
            {NS_LABEL[oid]}
          </button>
        );
      })}
    </div>
  );
}
