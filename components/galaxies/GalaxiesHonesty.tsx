"use client";

import {
  HUBBLE_TENSION_LABEL,
  LEAD_HONESTY,
  REDSHIFT_SPACE_LABEL,
  RENDER_LABEL,
  WEDGE_LABEL,
} from "./galaxiesUi";

/**
 * The honesty panel (prominent). Leads with the cosmic-web-is-real-SDSS-galaxies
 * statement, then the redshift-space / fingers-of-god distortion, the thin-wedge
 * slice geometry, the Hubble-tension depth-scale caveat, and the rendered-styling
 * note. This is the load-bearing point of the tab.
 */
function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-t border-line/60 pt-2 first:border-t-0 first:pt-0">
      {children}
    </li>
  );
}

export default function GalaxiesHonesty() {
  return (
    <div className="hud-panel rounded-2xl border border-amber-400/25 p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-200/90">
        What is real, what is computed
      </h2>

      <p className="mt-2 text-[12px] font-medium leading-snug text-ice">
        {LEAD_HONESTY}
      </p>

      <ul className="mt-3 space-y-2 text-[11px] leading-snug text-dim">
        <Item>
          <span className="text-amber-200/90">Redshift-space: </span>
          {REDSHIFT_SPACE_LABEL}
        </Item>
        <Item>
          <span className="text-sky-300/90">A thin wedge: </span>
          {WEDGE_LABEL}
        </Item>
        <Item>
          <span className="text-fuchsia-300/90">Depth scale, H0: </span>
          {HUBBLE_TENSION_LABEL}
        </Item>
        <Item>
          <span className="text-emerald-300/90">Positions measured: </span>
          {RENDER_LABEL}
        </Item>
      </ul>
    </div>
  );
}
