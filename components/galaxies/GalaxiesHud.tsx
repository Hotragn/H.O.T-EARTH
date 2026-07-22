"use client";

import { HUBBLE_TENSION } from "@/lib/galaxies";
import type { CosmicWebState } from "./useCosmicWeb";

/**
 * The cosmic-web readout panel. Shows the real headline (18,000 SDSS galaxies),
 * the plotted count, the measured z-range, the corresponding Hubble-distance
 * depth (cz/H0 at the far edge), the adopted H0, and the SDSS citation. Every
 * number is either the measured catalog value or computed by lib/galaxies; none
 * is invented. Null-safe throughout.
 */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-line/60 py-1.5 first:border-t-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[12px] text-ice">{value}</div>
    </div>
  );
}

/** Light-years per megaparsec (matches lib/galaxies LY_PER_MPC). */
const LY_PER_MPC = 3.2615637771674e6;

export default function GalaxiesHud({ web }: { web: CosmicWebState }) {
  const farMpc = web.maxDistanceMpc;
  const farMly = (farMpc * LY_PER_MPC) / 1e6;

  return (
    <div className="hud-panel rounded-2xl p-4">
      <h2 className="font-display text-lg font-medium tracking-tight text-ice">
        The real cosmic web
      </h2>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        SDSS DR17 spectroscopic redshifts
      </p>

      <div className="mb-1 mt-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-2.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Galaxies plotted
        </div>
        <div className="mt-0.5 font-mono text-[15px] text-ice">
          {web.loaded
            ? `${web.count.toLocaleString()} real galaxies`
            : "loading catalog..."}
        </div>
        <p className="mt-1 text-[10px] leading-snug text-faint">
          Each is a measured SDSS position (RA, Dec, redshift), mapped to 3D by
          lib/galaxies. Not procedural.
        </p>
      </div>

      <div className="mt-2">
        <Row
          label="Redshift range (measured)"
          value={
            web.zRange
              ? `z = ${web.zRange[0].toFixed(3)} to ${web.zRange[1].toFixed(3)}`
              : "not available"
          }
        />
        <Row
          label="Depth at far edge (computed cz/H0)"
          value={
            farMpc > 0
              ? `~${Math.round(farMpc).toLocaleString()} Mpc (~${(farMly / 1000).toFixed(2)} billion ly), redshift-space`
              : "not available"
          }
        />
        <Row
          label="Adopted Hubble constant"
          value={`H0 = ${HUBBLE_TENSION.adopted} km/s/Mpc (Planck ${HUBBLE_TENSION.planck} vs SH0ES ${HUBBLE_TENSION.sh0es})`}
        />
      </div>

      <p className="mt-3 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
        Colour maps to redshift: warm gold is nearer, cool blue is farther. Drag
        to orbit, scroll to zoom. The observer (Milky Way) is the gold dot at the
        centre.
      </p>
      <p className="mt-2 text-[10px] leading-snug text-faint">
        Source: {web.citation}
      </p>
    </div>
  );
}
