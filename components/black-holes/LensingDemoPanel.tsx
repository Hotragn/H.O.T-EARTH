"use client";

import { RSUN_M, deflectionAngleArcsec, einsteinRadiusArcsec } from "@/lib/black-holes";

/**
 * A small galaxy-scale lensing panel: the classic 1.75 arcsec solar-limb
 * deflection test (the render's own physics, validated), plus an example
 * Einstein radius for a stellar-mass lens. This is the same light-bending that
 * warps the background in the render, at astronomical scale. All values are
 * computed by lib/black-holes; guarded against null.
 */
export default function LensingDemoPanel() {
  // The 1919 Eddington test: the Sun (1 Msun) at its limb bends starlight 1.75".
  const solarLimb = deflectionAngleArcsec(1, RSUN_M);
  // Illustrative Einstein radius: a 1 Msun lens halfway to a source 8 kpc away.
  const einstein = einsteinRadiusArcsec(1, 4000, 8000, 4000);

  return (
    <div className="hud-panel rounded-2xl p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-violet-300/90">
        Lensing at astronomical scale
      </h2>
      <p className="mt-1 text-[11px] leading-snug text-dim">
        The same bending that warps the render, in the sky. Light grazing a mass
        is deflected by 4GM/(c^2 b); a perfectly aligned source is smeared into an
        Einstein ring.
      </p>

      <div className="mt-2 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[11px] text-faint">Sun at its limb</span>
          <span className="font-mono text-[13px] text-ice">
            {solarLimb !== null ? `${solarLimb.toFixed(2)} arcsec` : "unknown"}
          </span>
        </div>
        <p className="text-[10px] leading-snug text-faint">
          Eddington measured this 1.75 arcsec deflection at the 1919 eclipse, the
          first confirmation of general relativity. Our lib reproduces it.
        </p>
        <div className="flex items-baseline justify-between gap-2 border-t border-line/60 pt-1.5">
          <span className="font-mono text-[11px] text-faint">
            Einstein radius (example)
          </span>
          <span className="font-mono text-[13px] text-ice">
            {einstein !== null ? `${einstein.toExponential(2)} arcsec` : "unknown"}
          </span>
        </div>
        <p className="text-[10px] leading-snug text-faint">
          A 1 Msun lens midway to a source 8 kpc away: microarcseconds, which is
          why stellar microlensing shows as brightening, not a visible ring.
        </p>
      </div>
    </div>
  );
}
