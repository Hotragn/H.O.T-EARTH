"use client";

import { useMemo } from "react";
import { chirpTrack, eventRingdown, type GwEvent } from "@/lib/gravitational-waves";
import { GW_ACCENT, freqLabel } from "./gwUi";

/**
 * The chirp: gravitational-wave frequency sweeping up as the binary tightens,
 * plus the waveform that sweep implies.
 *
 * Both are COMPUTED from the event's published masses by lib/gravitational-waves
 * (leading-order inspiral), not read from LIGO's strain data. The caption on the
 * plot says so. The inspiral curve stops at the ISCO estimate, which is where the
 * leading-order formula stops being valid; the remnant's ringdown note is drawn
 * as a separate marker when the catalogue publishes the remnant parameters.
 */
export default function ChirpPlot({ event }: { event: GwEvent }) {
  const W = 720;
  const H = 220;
  const padL = 46;
  const padR = 16;
  const padT = 14;
  const padB = 30;

  const track = useMemo(() => chirpTrack(event, 20, 260), [event]);
  const ring = useMemo(() => eventRingdown(event), [event]);
  const ringdown = ring?.hz ?? null;

  if (track.length < 2) {
    return (
      <p className="text-xs text-faint">
        Not enough published parameters to compute a sweep for this event.
      </p>
    );
  }

  const tStart = track[0].tS;
  const fMax = Math.max(
    track[track.length - 1].freqHz,
    ringdown ?? 0,
  );
  // Log frequency axis: the sweep spans a decade or more.
  const fMin = Math.min(track[0].freqHz, 20);
  const yOf = (f: number) => {
    const t = (Math.log10(f) - Math.log10(fMin)) / (Math.log10(fMax) - Math.log10(fMin));
    return padT + (1 - t) * (H - padT - padB);
  };
  // Time axis runs left (early, tStart) to right (merger, t=0).
  const xOf = (tS: number) =>
    padL + (1 - tS / tStart) * (W - padL - padR);

  const sweep = track
    .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.tS).toFixed(1)},${yOf(p.freqHz).toFixed(1)}`)
    .join(" ");

  // Waveform: amplitude grows and cycles compress toward the merger. Rendered
  // from the same computed track, sampled densely in phase.
  const wave = useMemo(() => {
    const pts: string[] = [];
    const midY = padT + (H - padT - padB) / 2;
    const amp = (H - padT - padB) / 2 - 6;
    let phase = 0;
    const N = 900;
    for (let i = 0; i < N; i++) {
      const frac = i / (N - 1);
      // Walk the track in time, integrating phase at the local frequency.
      const idx = Math.min(track.length - 1, Math.floor(frac * (track.length - 1)));
      const p = track[idx];
      const dt = tStart / N;
      phase += 2 * Math.PI * p.freqHz * dt;
      const grow = Math.pow(frac, 2.2); // strain rises steeply at the end
      const y = midY + Math.sin(phase) * amp * Math.max(0.06, grow);
      const x = padL + frac * (W - padL - padR);
      pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  }, [track, tStart]);

  const ticks = [20, 50, 100, 200, 500, 1000, 2000].filter(
    (f) => f >= fMin && f <= fMax,
  );

  return (
    <div className="space-y-3">
      {/* frequency sweep */}
      <figure className="hud-panel rounded-xl p-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Computed gravitational-wave frequency sweep for ${event.name}, rising from ${freqLabel(track[0].freqHz)} to ${freqLabel(track[track.length - 1].freqHz)} as the binary merges.`}
        >
          {ticks.map((f) => (
            <g key={f}>
              <line
                x1={padL}
                x2={W - padR}
                y1={yOf(f)}
                y2={yOf(f)}
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <text
                x={padL - 6}
                y={yOf(f) + 3}
                textAnchor="end"
                className="fill-current text-[9px] opacity-50"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {f}
              </text>
            </g>
          ))}
          <path d={sweep} fill="none" stroke={GW_ACCENT} strokeWidth="2" />
          {ringdown != null && (
            <g>
              <line
                x1={W - padR - 60}
                x2={W - padR}
                y1={yOf(ringdown)}
                y2={yOf(ringdown)}
                stroke="#ffd27a"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={W - padR}
                y={yOf(ringdown) - 5}
                textAnchor="end"
                className="fill-current text-[9px]"
                style={{ fontFamily: "var(--font-mono)", fill: "#ffd27a" }}
              >
                ringdown {freqLabel(ringdown)}{ring?.estimated ? " (est.)" : ""}
              </text>
            </g>
          )}
          <text
            x={padL}
            y={H - 8}
            className="fill-current text-[9px] opacity-50"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {tStart >= 1 ? `${tStart.toFixed(1)} s before merger` : `${(tStart * 1000).toFixed(0)} ms before merger`}
          </text>
          <text
            x={W - padR}
            y={H - 8}
            textAnchor="end"
            className="fill-current text-[9px] opacity-50"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            merger
          </text>
          <text
            x={12}
            y={padT + 6}
            className="fill-current text-[9px] opacity-50"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Hz
          </text>
        </svg>
        <figcaption className="mt-1.5 text-[10px] leading-snug text-faint">
          Frequency sweep computed from the published masses (leading-order
          inspiral). Not LIGO strain data. The solid curve ends at the ISCO
          estimate, where the formula stops being valid.
        </figcaption>
      </figure>

      {/* implied waveform */}
      <figure className="hud-panel rounded-xl p-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-[130px] w-full"
          role="img"
          aria-label={`Illustrative waveform for ${event.name}: oscillations growing in amplitude and frequency toward the merger.`}
        >
          <path
            d={wave}
            fill="none"
            stroke={GW_ACCENT}
            strokeWidth="1.1"
            strokeOpacity="0.85"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <figcaption className="mt-1.5 text-[10px] leading-snug text-faint">
          The waveform that sweep implies, drawn to show the shape (amplitude and
          cycle spacing). Illustrative: the vertical scale is not calibrated
          strain, and this is not a recording.
        </figcaption>
      </figure>
    </div>
  );
}
