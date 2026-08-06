"use client";

import { useMemo } from "react";
import { SCALE_LADDER, logSpanFraction, sizeRatio } from "@/lib/galaxies";
import { fmtSizeM } from "./galaxiesUi";

/**
 * The Scale Ladder's main-screen visual: every rung of the real ladder plotted
 * on ONE log10 axis, so the span from Earth to the observable universe is
 * visible at once instead of collapsing onto the left edge.
 *
 * Everything here is computed from the real sizes in lib/galaxies:
 *  - each rung's x position is logSpanFraction(sizeM, first, last)
 *  - the decade ticks are the actual powers of ten the span covers
 *  - the "times larger" readout is sizeRatio() between neighbouring rungs
 *
 * Nothing is drawn to proportional physical size, and that is stated on screen:
 * the jumps are far too large for that (the Milky Way is about 5e4 times the
 * Solar System's Oort Cloud, which no single screen can show side by side).
 */

const VB_W = 1000;
const VB_H = 268;
const PAD_X = 44;
const AXIS_Y = 200;
/** two label rows, so each label gets twice the horizontal room */
const ROW_Y = [44, 104];

/** 10^n exponent, formatted for a tick label. */
function decadeLabel(exp: number): string {
  return `10${exp
    .toString()
    .replace(/[0-9]/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)])}`;
}

export default function ScaleRuler({
  rung,
  onSelect,
}: {
  /** index of the active rung in SCALE_LADDER */
  rung: number;
  onSelect: (i: number) => void;
}) {
  const first = SCALE_LADDER[0].sizeM;
  const last = SCALE_LADDER[SCALE_LADDER.length - 1].sizeM;

  /**
   * Each rung gets its true log position on the axis (`x`) plus an evenly spaced
   * label slot (`slotX`) joined to it by a leader line. Three of the rungs
   * (1 light-year, the Oort Cloud, Proxima Centauri) sit within half a decade of
   * each other, so labels placed AT their true positions overlap into mush. The
   * dot stays honest; only the text is spread out.
   */
  const plotted = useMemo(() => {
    const inner = VB_W - PAD_X * 2;
    const n = SCALE_LADDER.length;
    return SCALE_LADDER.map((r, i) => {
      const t = logSpanFraction(r.sizeM, first, last) ?? 0;
      return {
        ...r,
        i,
        t,
        x: PAD_X + t * inner,
        slotX: PAD_X + ((i + 0.5) * inner) / n,
        labelY: ROW_Y[i % ROW_Y.length],
      };
    });
  }, [first, last]);

  const decades = useMemo(() => {
    const lo = Math.ceil(Math.log10(first));
    const hi = Math.floor(Math.log10(last));
    const out: { exp: number; x: number }[] = [];
    for (let e = lo; e <= hi; e++) {
      const t = logSpanFraction(Math.pow(10, e), first, last);
      if (t === null) continue;
      out.push({ exp: e, x: PAD_X + t * (VB_W - PAD_X * 2) });
    }
    return out;
  }, [first, last]);

  const active = plotted[rung] ?? plotted[plotted.length - 1];
  const previous = rung > 0 ? plotted[rung - 1] : null;
  const jump = previous ? sizeRatio(active.sizeM, previous.sizeM) : null;

  return (
    <div className="flex min-h-0 w-full flex-col gap-3">
      {/* the active rung, large */}
      <div className="hud-panel rounded-2xl px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-display text-2xl font-medium tracking-tight text-ice">
            {active.label}
          </h2>
          <span className="font-mono text-base text-amber-200">
            {fmtSizeM(active.sizeM)}
          </span>
        </div>
        <p className="mt-1 font-mono text-[11px] text-faint">{active.human}</p>
        <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-dim">
          {active.note}
        </p>
        {jump !== null && previous && (
          <p className="mt-2.5 border-t border-line/60 pt-2 font-mono text-[11px] leading-snug text-amber-200/85">
            {jump.toLocaleString(undefined, {
              maximumSignificantDigits: 3,
              useGrouping: true,
            })}{" "}
            times the size of {previous.label}.
          </p>
        )}
      </div>

      {/* the log axis */}
      <div className="hud-panel rounded-2xl px-3 py-3">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="pointer-events-auto block h-auto w-full"
          role="img"
          aria-label={`Log scale axis of the cosmic distance ladder, from ${SCALE_LADDER[0].label} to ${SCALE_LADDER[SCALE_LADDER.length - 1].label}. Selected: ${active.label}, ${fmtSizeM(active.sizeM)}.`}
        >
          {/* decade grid */}
          {decades.map((d) => (
            <g key={d.exp}>
              <line
                x1={d.x}
                y1={AXIS_Y - 34}
                x2={d.x}
                y2={AXIS_Y}
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={1}
              />
              <text
                x={d.x}
                y={AXIS_Y + 20}
                textAnchor="middle"
                fill="rgba(255,255,255,0.34)"
                fontSize={11}
                fontFamily="ui-monospace, monospace"
              >
                {decadeLabel(d.exp)}
              </text>
            </g>
          ))}
          <text
            x={PAD_X}
            y={AXIS_Y + 42}
            fill="rgba(255,255,255,0.34)"
            fontSize={11}
            fontFamily="ui-monospace, monospace"
          >
            metres, log scale: each tick is ten times the last
          </text>

          {/* the axis itself */}
          <line
            x1={PAD_X}
            y1={AXIS_Y}
            x2={VB_W - PAD_X}
            y2={AXIS_Y}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={1.5}
          />
          {/* filled portion up to the active rung */}
          <line
            x1={PAD_X}
            y1={AXIS_Y}
            x2={active.x}
            y2={AXIS_Y}
            stroke="rgba(255,210,122,0.7)"
            strokeWidth={2.5}
          />

          {/* the rungs: label in its slot, leader line to the true position */}
          {plotted.map((r) => {
            const on = r.i === rung;
            const stroke = on ? "rgba(255,210,122,0.6)" : "rgba(255,255,255,0.16)";
            const bendY = ROW_Y[ROW_Y.length - 1] + 46;
            return (
              <g
                key={r.label}
                onClick={() => onSelect(r.i)}
                style={{ cursor: "pointer" }}
              >
                {/* generous invisible hit area over the label */}
                <rect
                  x={r.slotX - 38}
                  y={r.labelY - 16}
                  width={76}
                  height={34}
                  fill="transparent"
                />
                {/* leader: down from the label, then across to the real x */}
                <polyline
                  points={`${r.slotX},${r.labelY + 8} ${r.slotX},${bendY} ${r.x},${AXIS_Y - 7}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={on ? 1.4 : 1}
                />
                <circle
                  cx={r.x}
                  cy={AXIS_Y}
                  r={on ? 6 : 3.5}
                  fill={on ? "#ffd27a" : "rgba(255,255,255,0.45)"}
                />
                <text
                  x={r.slotX}
                  y={r.labelY}
                  textAnchor="middle"
                  fill={on ? "#ffe6b8" : "rgba(255,255,255,0.52)"}
                  fontSize={on ? 12.5 : 11}
                  fontFamily="ui-monospace, monospace"
                >
                  {r.label.length > 18 ? r.label.slice(0, 17) + "…" : r.label}
                </text>
                <text
                  x={r.slotX}
                  y={r.labelY + 13}
                  textAnchor="middle"
                  fill={on ? "rgba(255,210,122,0.9)" : "rgba(255,255,255,0.3)"}
                  fontSize={10}
                  fontFamily="ui-monospace, monospace"
                >
                  {fmtSizeM(r.sizeM)}
                </text>
              </g>
            );
          })}
        </svg>

        <p className="mt-1 px-1 text-[10px] leading-snug text-faint">
          Positions are computed from the real sizes in lib/galaxies. The rungs
          are NOT drawn to proportional size: the jumps run to many powers of
          ten, so no single screen can hold two neighbouring rungs side by side
          at true scale. The axis position is the honest way to show it.
        </p>
      </div>
    </div>
  );
}
