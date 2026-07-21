"use client";

import { useMemo } from "react";
import { JOY_DIVISION_LABEL } from "./neutronStarsUi";

/**
 * The iconic stacked pulse-profile ridgeline (the "Unknown Pleasures" look):
 * successive pulses stacked with a slight vertical offset, each line filled to
 * occlude the ones behind it. This is an ILLUSTRATIVE homage generated from a
 * pulse-profile shape (real pulsars do have such stacked profiles, and PSR
 * B1919+21's is the album cover; the exact shape here is illustrative, not this
 * object's measured data). Deterministic (seeded), so it is stable across
 * renders and SSR-safe.
 */

/** Small deterministic PRNG (mulberry32) so the plot is stable, not random. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function JoyDivisionPlot({ seed = 1919 }: { seed?: number }) {
  const { width, height, rows } = useMemo(() => {
    const W = 240;
    const H = 200;
    const ROWS = 44;
    const COLS = 64;
    const rng = makeRng(seed);
    const rowHeight = 3.1; // vertical step between stacked lines
    const topPad = 18;
    const amp = 46; // peak amplitude

    const paths: string[] = [];
    for (let r = 0; r < ROWS; r++) {
      const baseY = topPad + r * rowHeight;
      // per-row peak center wobbles slightly around the middle
      const center = 0.5 + (rng() - 0.5) * 0.14;
      const peakScale = 0.55 + rng() * 0.55;
      const pts: string[] = [];
      for (let c = 0; c <= COLS; c++) {
        const x = (c / COLS) * W;
        const u = c / COLS;
        // a main gaussian pulse plus a weaker secondary bump
        const g1 = Math.exp(-Math.pow((u - center) / 0.07, 2));
        const g2 = 0.4 * Math.exp(-Math.pow((u - center - 0.13) / 0.05, 2));
        const envelope = g1 + g2;
        // noise strongest under the pulse (like real single-pulse jitter)
        const noise = (rng() - 0.5) * (0.35 + 1.6 * envelope);
        const val = (envelope + noise) * amp * peakScale;
        const y = baseY - Math.max(0, val);
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      // close the path down to the baseline so it can fill and occlude
      const d = `M0,${baseY} L${pts.join(" L")} L${W},${baseY} Z`;
      paths.push(d);
    }
    return { width: W, height: H, rows: paths };
  }, [seed]);

  return (
    <div className="hud-panel rounded-2xl p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300/90">
        Stacked pulse profile
      </h2>
      <div className="mt-2 flex justify-center overflow-hidden rounded-lg border border-line/60 bg-black/40 py-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label="Illustrative stacked pulse-profile ridgeline in the Unknown Pleasures style"
          style={{ maxWidth: "100%", height: "auto" }}
        >
          {/* draw back-to-front so nearer rows occlude farther ones */}
          {rows.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="#05060f"
              stroke="#dbe6ff"
              strokeWidth={0.8}
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-faint">{JOY_DIVISION_LABEL}</p>
    </div>
  );
}
