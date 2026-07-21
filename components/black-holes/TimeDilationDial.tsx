"use client";

import { useState } from "react";
import { gravitationalTimeDilation } from "@/lib/black-holes";
import { fmtDilation } from "./blackHolesUi";

/**
 * Interactive time-dilation dial. The slider sets r / r_s (from just outside the
 * horizon, 1.02, up to 20); gravitationalTimeDilation returns the exact factor
 * sqrt(1 - r_s/r), which we present as "1 s here = X s far away" plus a
 * clock-pair whose hands turn at the two rates. Real, exact Schwarzschild GR.
 */
export default function TimeDilationDial() {
  const [rOverRs, setROverRs] = useState(2);
  const factor = gravitationalTimeDilation(rOverRs); // 0..1, null if <= 1
  const safe = typeof factor === "number" && Number.isFinite(factor) ? factor : 0;

  return (
    <div className="hud-panel rounded-2xl p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-sky-300/90">
        Time dilation, dialed
      </h2>
      <p className="mt-1 text-[11px] leading-snug text-dim">
        A static clock at radius r ticks slower than one far away by exactly
        sqrt(1 - r_s/r). Drag to move from just outside the horizon outward.
      </p>

      <div className="mt-3 flex items-center gap-4">
        {/* far-away reference clock (full rate) */}
        <ClockPair localRate={safe} />
        <div className="flex-1">
          <div className="font-mono text-[13px] text-ice">{fmtDilation(factor)}</div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-faint">
            local clock runs at {safe > 0 ? `${(safe * 100).toFixed(1)}%` : "0%"} of
            far-away time
          </div>
        </div>
      </div>

      <div className="mt-3">
        <input
          type="range"
          min={1.02}
          max={20}
          step={0.02}
          value={rOverRs}
          onChange={(e) => setROverRs(parseFloat(e.target.value))}
          aria-label="Radius in Schwarzschild radii"
          className="w-full cursor-pointer accent-sky-400"
        />
        <div className="mt-1 flex items-baseline justify-between font-mono text-[10px] text-faint">
          <span>r = {rOverRs.toFixed(2)} r_s</span>
          <span className="text-emerald-300/80">exact</span>
        </div>
      </div>

      <p className="mt-2 text-[10px] leading-snug text-faint">
        At 2 r_s the factor is about 0.707; it goes to zero at the horizon (a
        distant observer sees infalling clocks freeze and redshift away).
      </p>
    </div>
  );
}

/**
 * A pair of clock faces: the outer (far away) hand sweeps a full turn while the
 * inner (local) hand sweeps only `localRate` of it. A pure CSS/SVG readout,
 * animation-free so it renders identically headless.
 */
function ClockPair({ localRate }: { localRate: number }) {
  const farAngle = 90; // fixed illustrative snapshot: far clock at quarter turn
  const localAngle = 90 * Math.max(0, Math.min(1, localRate));
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
      <circle cx="28" cy="28" r="26" fill="none" stroke="#2b3245" strokeWidth="1.5" />
      {/* far-away hand (dim) */}
      <line
        x1="28"
        y1="28"
        x2={28 + 20 * Math.sin((farAngle * Math.PI) / 180)}
        y2={28 - 20 * Math.cos((farAngle * Math.PI) / 180)}
        stroke="#5a6b8c"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* local hand (bright) */}
      <line
        x1="28"
        y1="28"
        x2={28 + 20 * Math.sin((localAngle * Math.PI) / 180)}
        y2={28 - 20 * Math.cos((localAngle * Math.PI) / 180)}
        stroke="#7cc4ff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="28" cy="28" r="2" fill="#7cc4ff" />
    </svg>
  );
}
