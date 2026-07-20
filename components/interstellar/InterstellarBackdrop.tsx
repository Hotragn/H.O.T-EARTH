"use client";

import { useMemo } from "react";
import { INTERSTELLAR_ACCENT } from "./interstellarUi";

/**
 * A procedural, ORIGINAL cinematic backdrop that sits behind every section (a
 * deep-space wash + a deterministic starfield). Pure CSS, no textures, no film
 * assets. The starfield is generated once from a seeded PRNG so it is stable and
 * has no server/client hydration mismatch (this page is client-only anyway).
 *
 * It never intercepts pointer events; the 3D canvases render on top of it.
 */

/** mulberry32 PRNG so the starfield layout is deterministic across renders. */
function makeRng(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a CSS box-shadow list of `n` star dots over a `spread`px square. */
function starShadows(n: number, spread: number, seed: number, maxAlpha: number): string {
  const rng = makeRng(seed);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round(rng() * spread);
    const y = Math.round(rng() * spread);
    const a = (0.25 + rng() * (maxAlpha - 0.25)).toFixed(2);
    parts.push(`${x}px ${y}px rgba(255,255,255,${a})`);
  }
  return parts.join(", ");
}

export default function InterstellarBackdrop() {
  // Two parallax layers of stars (small dense + larger sparse), generated once.
  const near = useMemo(() => starShadows(90, 2000, 20260706, 1), []);
  const far = useMemo(() => starShadows(160, 2000, 71077345, 0.7), []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* deep-space vertical wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, #0a1420 0%, #070a12 45%, #05060a 100%)",
        }}
      />
      {/* two faint original nebula glows tinted with the tab accent */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(40% 45% at 78% 18%, ${INTERSTELLAR_ACCENT}22 0%, transparent 60%), radial-gradient(50% 55% at 15% 85%, #6f5bff1c 0%, transparent 62%)`,
        }}
      />
      {/* starfield: two box-shadow layers, tiled */}
      <div
        className="absolute left-0 top-0 h-px w-px"
        style={{ boxShadow: far, opacity: 0.55 }}
      />
      <div
        className="absolute left-0 top-0 h-[2px] w-[2px] rounded-full"
        style={{ boxShadow: near, opacity: 0.8 }}
      />
    </div>
  );
}
