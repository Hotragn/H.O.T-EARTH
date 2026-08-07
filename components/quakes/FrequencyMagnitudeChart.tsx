"use client";

import { useMemo } from "react";
import {
  expectedCountAbove,
  type GutenbergRichterFit,
  type MagnitudeBin,
} from "@/lib/quakes";
import { QUAKES_ACCENT } from "./quakesUi";

/**
 * The frequency-magnitude distribution of the live catalogue, on a log axis,
 * with the fitted Gutenberg-Richter line and the completeness cut drawn where
 * the fit actually started.
 *
 * This is the centrepiece of the tab rather than a footnote, because it is the
 * one chart that shows both the law AND its limit at the same time. The
 * straight part on the right is the law: every magnitude step up makes
 * earthquakes about ten times rarer. The rollover on the left is NOT the law
 * failing and NOT a shortage of small earthquakes, it is the detection limit of
 * the seismometer network. The shaded region marks the part of the data the fit
 * deliberately ignores.
 */

const VB_W = 1000;
const VB_H = 320;
const PAD_L = 62;
const PAD_R = 26;
const PAD_T = 22;
const PAD_B = 54;

export default function FrequencyMagnitudeChart({
  bins,
  fit,
  primary,
}: {
  bins: MagnitudeBin[];
  fit: GutenbergRichterFit | null;
  primary: { b: number; sigma: number; n: number } | null;
}) {
  const usable = useMemo(() => bins.filter((b) => b.cumulative > 0), [bins]);

  if (usable.length < 3) {
    return (
      <section className="hud-panel rounded-2xl p-4">
        <p className="font-mono text-[11px] text-dim">
          Not enough events in the feed yet to plot a frequency-magnitude
          distribution. We would rather draw nothing than fit a line through
          three points and call it a law.
        </p>
      </section>
    );
  }

  const minMag = usable[0].mag;
  const maxMag = usable[usable.length - 1].mag;
  const maxLog = Math.max(...usable.map((b) => Math.log10(b.cumulative)));
  const topLog = Math.ceil(maxLog);

  const x = (mag: number) =>
    PAD_L + ((mag - minMag) / Math.max(0.001, maxMag - minMag)) * (VB_W - PAD_L - PAD_R);
  const y = (count: number) => {
    const l = Math.log10(Math.max(1, count));
    return VB_H - PAD_B - (l / Math.max(0.001, topLog)) * (VB_H - PAD_T - PAD_B);
  };

  // Decade grid lines: 1, 10, 100, ...
  const decades = Array.from({ length: topLog + 1 }, (_, i) => Math.pow(10, i));

  // Whole-magnitude ticks inside the plotted range.
  const magTicks: number[] = [];
  for (let m = Math.ceil(minMag * 2) / 2; m <= maxMag; m += 0.5) {
    magTicks.push(Number(m.toFixed(1)));
  }

  const fitLine =
    fit &&
    (() => {
      const from = Math.max(minMag, fit.mc);
      const to = maxMag;
      const yFrom = expectedCountAbove(fit, from);
      const yTo = expectedCountAbove(fit, to);
      if (yFrom === null || yTo === null) return null;
      return { x1: x(from), y1: y(yFrom), x2: x(to), y2: y(yTo) };
    })();

  return (
    <section className="hud-panel rounded-2xl p-4">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-base font-medium tracking-tight text-ice">
          How many, how big
        </h2>
        {primary && fit && (
          <p className="font-mono text-[11px] text-dim">
            b ={" "}
            <span style={{ color: QUAKES_ACCENT }}>
              {primary.b.toFixed(2)} ± {primary.sigma.toFixed(2)}
            </span>{" "}
            above Mc {fit.mc.toFixed(1)} on {primary.n.toLocaleString()} events,
            drawn line r² = {fit.rSquared.toFixed(3)}
          </p>
        )}
      </div>

      <div className="hud-scroll -mx-1 overflow-x-auto px-1">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="block h-auto w-full min-w-[640px] sm:min-w-0"
          role="img"
          aria-label={
            primary && fit
              ? `Frequency-magnitude distribution of the live catalogue. The b-value is ${primary.b.toFixed(2)} plus or minus ${primary.sigma.toFixed(2)} above a completeness magnitude of ${fit.mc.toFixed(1)}, from ${primary.n} events.`
              : "Frequency-magnitude distribution of the live catalogue."
          }
        >
          {/* the region below completeness, which the fit ignores */}
          {fit && fit.mc > minMag && (
            <>
              <rect
                x={PAD_L}
                y={PAD_T}
                width={Math.max(0, x(fit.mc) - PAD_L)}
                height={VB_H - PAD_T - PAD_B}
                fill="rgba(255,255,255,0.035)"
              />
              <line
                x1={x(fit.mc)}
                y1={PAD_T}
                x2={x(fit.mc)}
                y2={VB_H - PAD_B}
                stroke="rgba(255,210,122,0.5)"
                strokeDasharray="4 4"
              />
              <text
                x={x(fit.mc) - 8}
                y={PAD_T + 12}
                textAnchor="end"
                fill="rgba(255,210,122,0.8)"
                fontSize={11}
                fontFamily="ui-monospace, monospace"
              >
                incomplete: not fitted
              </text>
            </>
          )}

          {/* decade grid */}
          {decades.map((d) => (
            <g key={d}>
              <line
                x1={PAD_L}
                y1={y(d)}
                x2={VB_W - PAD_R}
                y2={y(d)}
                stroke="rgba(255,255,255,0.08)"
              />
              <text
                x={PAD_L - 8}
                y={y(d) + 4}
                textAnchor="end"
                fill="rgba(255,255,255,0.38)"
                fontSize={11}
                fontFamily="ui-monospace, monospace"
              >
                {d.toLocaleString()}
              </text>
            </g>
          ))}

          {/* magnitude ticks */}
          {magTicks.map((m) => (
            <g key={m}>
              <line
                x1={x(m)}
                y1={VB_H - PAD_B}
                x2={x(m)}
                y2={VB_H - PAD_B + 5}
                stroke="rgba(255,255,255,0.22)"
              />
              <text
                x={x(m)}
                y={VB_H - PAD_B + 19}
                textAnchor="middle"
                fill="rgba(255,255,255,0.38)"
                fontSize={11}
                fontFamily="ui-monospace, monospace"
              >
                {m.toFixed(1)}
              </text>
            </g>
          ))}

          {/* the fitted law */}
          {fitLine && (
            <line
              x1={fitLine.x1}
              y1={fitLine.y1}
              x2={fitLine.x2}
              y2={fitLine.y2}
              stroke={QUAKES_ACCENT}
              strokeWidth={2}
              strokeOpacity={0.85}
            />
          )}

          {/* the data: cumulative count at or above each magnitude */}
          {usable.map((b) => (
            <circle
              key={b.mag}
              cx={x(b.mag)}
              cy={y(b.cumulative)}
              r={2.6}
              fill="rgba(255,255,255,0.72)"
            />
          ))}

          {/* axis labels */}
          <text
            x={(PAD_L + VB_W - PAD_R) / 2}
            y={VB_H - 8}
            textAnchor="middle"
            fill="rgba(255,255,255,0.42)"
            fontSize={11.5}
            fontFamily="ui-monospace, monospace"
          >
            magnitude
          </text>
          <text
            x={16}
            y={(PAD_T + VB_H - PAD_B) / 2}
            textAnchor="middle"
            fill="rgba(255,255,255,0.42)"
            fontSize={11.5}
            fontFamily="ui-monospace, monospace"
            transform={`rotate(-90 16 ${(PAD_T + VB_H - PAD_B) / 2})`}
          >
            events at or above (log)
          </text>
        </svg>
      </div>

      <p className="mt-1.5 text-[10px] leading-relaxed text-faint">
        Each dot is the number of events in the live feed at or above that
        magnitude. The straight stretch is Gutenberg-Richter: log10 N = a - bM.
        The line is fitted by least squares, starting at the completeness
        magnitude, which is the PUBLISHED completeness of the global network
        rather than a cut estimated from this feed: the panel on the right shows
        what the data-driven estimators return here, and why they are wrong. The
        b quoted above the chart is the Aki maximum-likelihood estimate with its
        Shi and Bolt uncertainty.
      </p>
    </section>
  );
}
