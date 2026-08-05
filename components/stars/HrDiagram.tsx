"use client";

import { useMemo } from "react";
import type { StarDerived, StarRow } from "@/lib/stars";
import { CLASS_COLOR, colorForTemperature } from "./starsUi";

export interface HrPoint {
  star: StarRow;
  derived: StarDerived;
}

/**
 * The Hertzsprung-Russell diagram, drawn from the real catalogue.
 *
 * Axes follow the astronomical convention: temperature increases to the LEFT and
 * brightness increases UPWARD (absolute magnitude decreasing). Every dot is a
 * measured star, coloured by its derived temperature; nothing is drawn that
 * lacks both axes.
 */
export default function HrDiagram({
  points,
  selectedId,
  onSelect,
  className = "",
}: {
  points: HrPoint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  className?: string;
}) {
  const W = 760;
  const H = 560;
  const padL = 54;
  const padR = 18;
  const padT = 18;
  const padB = 44;

  // Fixed axis ranges so the diagram does not reflow as filters change.
  const T_HOT = 30000;
  const T_COOL = 2600;
  const M_BRIGHT = -9;
  const M_FAINT = 16;

  const xOf = (t: number) => {
    const f =
      (Math.log10(T_HOT) - Math.log10(t)) /
      (Math.log10(T_HOT) - Math.log10(T_COOL));
    return padL + f * (W - padL - padR);
  };
  const yOf = (m: number) =>
    padT + ((m - M_BRIGHT) / (M_FAINT - M_BRIGHT)) * (H - padT - padB);

  const dots = useMemo(
    () =>
      points.map((p) => ({
        id: p.star.id,
        x: xOf(Math.min(T_HOT, Math.max(T_COOL, p.derived.temperatureK!))),
        y: yOf(Math.min(M_FAINT, Math.max(M_BRIGHT, p.derived.absMag!))),
        c: colorForTemperature(p.derived.temperatureK!),
        named: !!p.star.name,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points],
  );

  const selected = points.find((p) => p.star.id === selectedId) ?? null;

  const tempTicks = [30000, 20000, 10000, 7000, 5000, 4000, 3000];
  const magTicks = [-9, -5, 0, 5, 10, 15];

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Hertzsprung-Russell diagram of ${points.length} real stars, temperature decreasing to the right and brightness increasing upward. The main sequence runs diagonally from hot and bright to cool and faint, with a giant branch above it.`}
      >
        {/* grid */}
        {tempTicks.map((t) => (
          <g key={t}>
            <line
              x1={xOf(t)}
              x2={xOf(t)}
              y1={padT}
              y2={H - padB}
              stroke="currentColor"
              strokeOpacity="0.06"
            />
            <text
              x={xOf(t)}
              y={H - padB + 14}
              textAnchor="middle"
              className="fill-current text-[9px] opacity-50"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t >= 10000 ? `${t / 1000}k` : t}
            </text>
          </g>
        ))}
        {magTicks.map((m) => (
          <g key={m}>
            <line
              x1={padL}
              x2={W - padR}
              y1={yOf(m)}
              y2={yOf(m)}
              stroke="currentColor"
              strokeOpacity="0.06"
            />
            <text
              x={padL - 8}
              y={yOf(m) + 3}
              textAnchor="end"
              className="fill-current text-[9px] opacity-50"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {m > 0 ? `+${m}` : m}
            </text>
          </g>
        ))}

        {/* axis labels */}
        <text
          x={(padL + W - padR) / 2}
          y={H - 6}
          textAnchor="middle"
          className="fill-current text-[9px] uppercase opacity-60"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.16em" }}
        >
          surface temperature (K) &rarr; cooler
        </text>
        <text
          x={12}
          y={(padT + H - padB) / 2}
          textAnchor="middle"
          transform={`rotate(-90 12 ${(padT + H - padB) / 2})`}
          className="fill-current text-[9px] uppercase opacity-60"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.16em" }}
        >
          absolute magnitude &uarr; brighter
        </text>

        {/* the stars */}
        <g>
          {dots.map((d) => (
            <circle
              key={d.id}
              cx={d.x}
              cy={d.y}
              r={d.named ? 1.9 : 1.15}
              fill={d.c}
              opacity={d.named ? 0.95 : 0.55}
            />
          ))}
        </g>

        {/* selection ring */}
        {selected && selected.derived.temperatureK != null && selected.derived.absMag != null && (
          <g>
            <circle
              cx={xOf(Math.min(T_HOT, Math.max(T_COOL, selected.derived.temperatureK)))}
              cy={yOf(Math.min(M_FAINT, Math.max(M_BRIGHT, selected.derived.absMag)))}
              r="7"
              fill="none"
              stroke="#f2a63b"
              strokeWidth="1.5"
            />
            <text
              x={xOf(Math.min(T_HOT, Math.max(T_COOL, selected.derived.temperatureK))) + 11}
              y={yOf(Math.min(M_FAINT, Math.max(M_BRIGHT, selected.derived.absMag))) + 3}
              className="fill-current text-[10px]"
              style={{ fontFamily: "var(--font-mono)", fill: "#f2a63b" }}
            >
              {selected.star.name ?? `HIP ${selected.star.id}`}
            </text>
          </g>
        )}

        {/* clickable overlay for the named stars, so keyboard and pointer both work */}
        <g>
          {points
            .filter((p) => p.star.name)
            .map((p) => (
              <circle
                key={`hit-${p.star.id}`}
                cx={xOf(Math.min(T_HOT, Math.max(T_COOL, p.derived.temperatureK!)))}
                cy={yOf(Math.min(M_FAINT, Math.max(M_BRIGHT, p.derived.absMag!)))}
                r="5"
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelect(p.star.id)}
                role="button"
                tabIndex={-1}
                aria-label={p.star.name ?? undefined}
              />
            ))}
        </g>
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-faint">
        <span>
          {points.length.toLocaleString()} measured stars. Larger dots are the
          named ones.
        </span>
        {Object.entries(CLASS_COLOR).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: v }}
            />
            {k}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
