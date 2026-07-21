"use client";

import {
  DISK_ILLUSTRATIVE_LABEL,
  HAWKING_LABEL,
  LEAD_HONESTY,
  LENS_METHOD_LABEL,
  SPIN_LABEL,
} from "./blackHolesUi";

/**
 * The honesty panel (prominent). Leads with the render-is-not-a-photo statement,
 * then the real light-bending method, the illustrative accretion disk, the
 * Schwarzschild-vs-Kerr simplification and the Hawking-unobserved note. This is
 * the load-bearing point of the tab, so it is never blurred.
 */
function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-t border-line/60 pt-2 first:border-t-0 first:pt-0">
      {children}
    </li>
  );
}

export default function BlackHolesHonesty() {
  return (
    <div className="hud-panel rounded-2xl border border-fuchsia-500/25 p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fuchsia-300/90">
        What is real, what is a render
      </h2>

      <p className="mt-2 text-[12px] font-medium leading-snug text-ice">
        {LEAD_HONESTY}
      </p>

      <ul className="mt-3 space-y-2 text-[11px] leading-snug text-dim">
        <Item>
          <span className="text-sky-300/90">Bending, real: </span>
          {LENS_METHOD_LABEL}
        </Item>
        <Item>
          <span className="text-orange-300/90">Disk, illustrative: </span>
          {DISK_ILLUSTRATIVE_LABEL}
        </Item>
        <Item>
          <span className="text-fuchsia-300/90">Schwarzschild, not Kerr: </span>
          {SPIN_LABEL}
        </Item>
        <Item>
          <span className="text-fuchsia-300/90">Hawking, unobserved: </span>
          {HAWKING_LABEL}
        </Item>
        <Item>
          <span className="text-emerald-300/90">Numbers, measured: </span>
          Every mass, distance and shadow size is a cited measurement (GRAVITY,
          EHT, LIGO, Gaia); every derived radius is exact general relativity from
          those numbers. Nothing is invented.
        </Item>
      </ul>
    </div>
  );
}
