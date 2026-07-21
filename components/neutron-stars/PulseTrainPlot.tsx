"use client";

import { useEffect, useRef } from "react";
import { fmtFrequency, fmtPeriod } from "./neutronStarsUi";

/**
 * A live scrolling pulse-train plot. Pulses are drawn spaced by the pulsar's REAL
 * measured spin period and scroll right-to-left at a fixed pixel rate, so the
 * cadence you see is the true rate (this is the honest counterpart to the
 * visually-slowed 3D mesh spin). Sub-Hz pulsars show discrete spikes; the Crab
 * (~30 Hz) and the millisecond pulsars pack into a dense band, which is real. The
 * animation is one lightweight 2D-canvas loop, cleaned up on unmount / change.
 */
export default function PulseTrainPlot({
  periodS,
  spinFrequencyHz,
  accent,
}: {
  periodS: number;
  spinFrequencyHz: number | null;
  accent: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!Number.isFinite(periodS) || periodS <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = 280;
    const cssH = 60;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);

    const pxPerSec = 40; // scroll speed; 1 s of pulses spans 40 px
    const windowS = cssW / pxPerSec;
    let raf = 0;
    let start = performance.now();
    let cancelled = false;

    const draw = () => {
      if (cancelled) return;
      const t = (performance.now() - start) / 1000;
      ctx.clearRect(0, 0, cssW, cssH);

      // baseline
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cssH - 10);
      ctx.lineTo(cssW, cssH - 10);
      ctx.stroke();

      const spacingPx = periodS * pxPerSec;
      const baseY = cssH - 10;
      const topY = 8;

      if (spacingPx < 2) {
        // pulses too dense to resolve: draw an honest bright band (a "buzz")
        const grad = ctx.createLinearGradient(0, topY, 0, baseY);
        grad.addColorStop(0, accent);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = grad;
        ctx.fillRect(0, topY, cssW, baseY - topY);
        ctx.globalAlpha = 1;
      } else {
        const kEnd = Math.floor(t / periodS);
        const kStart = Math.ceil((t - windowS) / periodS);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        for (let k = kStart; k <= kEnd; k++) {
          if (k < 0) continue;
          const pulseTime = k * periodS;
          const x = cssW - (t - pulseTime) * pxPerSec;
          if (x < 0 || x > cssW) continue;
          ctx.beginPath();
          ctx.moveTo(x, baseY);
          ctx.lineTo(x, topY);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [periodS, accent]);

  return (
    <div className="hud-panel rounded-2xl p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300/90">
          Live pulse train
        </h2>
        <span className="font-mono text-[10px] text-faint">
          {fmtFrequency(spinFrequencyHz)}
        </span>
      </div>
      <div className="mt-2 overflow-hidden rounded-lg border border-line/60 bg-black/30">
        <canvas
          ref={canvasRef}
          style={{ width: "280px", height: "60px", display: "block", maxWidth: "100%" }}
          aria-hidden
        />
      </div>
      <p className="mt-2 text-[10px] leading-snug text-faint">
        Ticks spaced by the real measured period ({fmtPeriod(periodS)}), scrolling
        at the true rate. This cadence is real; the 3D mesh spin is slowed only for
        clarity. Fast pulsars pack into a dense band.
      </p>
    </div>
  );
}
