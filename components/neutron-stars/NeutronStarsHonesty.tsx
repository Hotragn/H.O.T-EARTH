"use client";

import {
  AUDIO_LABEL,
  BEAM_LABEL,
  CANONICAL_LABEL,
  LEAD_HONESTY,
  TIMING_LABEL,
} from "./neutronStarsUi";

/**
 * The honesty panel (prominent). Leads with the render-is-an-illustrative-
 * lighthouse statement, then the timing-real / spin-scaled split, the
 * illustrative beam and surface, the synthesized audio, and the canonical
 * mass/radius assumption. This is the load-bearing point of the tab.
 */
function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-t border-line/60 pt-2 first:border-t-0 first:pt-0">
      {children}
    </li>
  );
}

export default function NeutronStarsHonesty() {
  return (
    <div className="hud-panel rounded-2xl border border-cyan-500/25 p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300/90">
        What is real, what is a render
      </h2>

      <p className="mt-2 text-[12px] font-medium leading-snug text-ice">
        {LEAD_HONESTY}
      </p>

      <ul className="mt-3 space-y-2 text-[11px] leading-snug text-dim">
        <Item>
          <span className="text-cyan-300/90">Timing, real: </span>
          {TIMING_LABEL}
        </Item>
        <Item>
          <span className="text-sky-300/90">Beam and surface, illustrative: </span>
          {BEAM_LABEL}
        </Item>
        <Item>
          <span className="text-fuchsia-300/90">Audio, synthesized: </span>
          {AUDIO_LABEL}
        </Item>
        <Item>
          <span className="text-amber-300/90">Model, canonical where flagged: </span>
          {CANONICAL_LABEL}
        </Item>
        <Item>
          <span className="text-emerald-300/90">Numbers, measured: </span>
          Every period, mass, distance and magnetic field is a cited measurement
          (ATNF Pulsar Catalogue and discovery papers); every derived quantity is
          standard neutron-star physics from those numbers. Nothing is invented.
        </Item>
      </ul>
    </div>
  );
}
