"use client";

import type { ExoSurfaceState } from "@/lib/exo-surfaces";
import {
  GROUND_ILLUSTRATIVE_LABEL,
  LEAD_HONESTY,
  NO_LOCAL_CLOCK_LABEL,
  NO_SURFACE_LABEL,
  SIBLING_DISC_LABEL,
  SKY_REAL_LABEL,
  TIDAL_LOCK_LABEL,
} from "./exoSurfacesUi";

/**
 * The honesty panel (prominent, right column). Leads with the no-surface-imaged
 * statement, then the sky-real / ground-illustrative split, the tidal-lock
 * inference, the no-local-clock rule, and the gas-giant no-surface note where it
 * applies. This is the point of the tab, so it is never blurred.
 */
function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-t border-line/60 pt-2 first:border-t-0 first:pt-0">
      {children}
    </li>
  );
}

export default function ExoSurfacesHonesty({ state }: { state: ExoSurfaceState }) {
  const locked = state.tidalLock?.likelyLocked === true;

  return (
    <div className="hud-panel rounded-2xl border border-amber-500/20 p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-300/90">
        What is real, what is imagined
      </h2>

      <p className="mt-2 text-[12px] font-medium leading-snug text-ice">
        {LEAD_HONESTY}
      </p>

      <ul className="mt-3 space-y-2 text-[11px] leading-snug text-dim">
        <Item>
          <span className="text-emerald-300/90">Sky, real: </span>
          {SKY_REAL_LABEL}
        </Item>
        <Item>
          <span className="text-amber-300/90">Ground, illustrative: </span>
          {GROUND_ILLUSTRATIVE_LABEL}
        </Item>
        <Item>
          <span className="text-sky-300/90">Sibling discs: </span>
          {SIBLING_DISC_LABEL}
        </Item>
        {state.hasSurface ? (
          <Item>
            <span className="text-amber-300/90">Tidal lock, inferred: </span>
            {locked
              ? TIDAL_LOCK_LABEL
              : "Tidal locking is an inference; it is not expected to be likely for this world, so a single lit view is shown."}
          </Item>
        ) : (
          <Item>
            <span className="text-amber-300/90">No surface: </span>
            {NO_SURFACE_LABEL}
          </Item>
        )}
        <Item>
          <span className="text-amber-300/90">No local clock: </span>
          {NO_LOCAL_CLOCK_LABEL}
        </Item>
      </ul>

      <p className="mt-3 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
        This tab is the mirror of the Mars and Titan Surfaces tab: there the ground
        was real and the sky illustrative; here the sky is real and the ground is
        illustrative.
      </p>
    </div>
  );
}
