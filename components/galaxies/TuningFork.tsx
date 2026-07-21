"use client";

import { GALAXIES_ACCENT } from "./galaxiesUi";

/**
 * A small illustrative Hubble "tuning fork" diagram: ellipticals along the
 * handle, lenticulars (S0) at the fork, then unbarred spirals (Sa, Sb, Sc) on
 * the top branch and barred spirals (SBa, SBb, SBc) on the bottom. The class
 * matching the selected galaxy's hubbleType is highlighted.
 *
 * This is a schematic classification diagram, not a rendering of the galaxy. The
 * class assignment is a coarse parse of the cited Hubble type string.
 */

type Node = { id: string; label: string; x: number; y: number };

const ELLIPTICALS: Node[] = [
  { id: "E0", label: "E0", x: 30, y: 70 },
  { id: "E5", label: "E5", x: 70, y: 70 },
  { id: "S0", label: "S0", x: 110, y: 70 },
];
const SPIRALS: Node[] = [
  { id: "Sa", label: "Sa", x: 160, y: 34 },
  { id: "Sb", label: "Sb", x: 210, y: 30 },
  { id: "Sc", label: "Sc", x: 260, y: 26 },
];
const BARRED: Node[] = [
  { id: "SBa", label: "SBa", x: 160, y: 106 },
  { id: "SBb", label: "SBb", x: 210, y: 110 },
  { id: "SBc", label: "SBc", x: 260, y: 114 },
];

/** Coarse-classify a Hubble-type string onto a node id. */
export function classifyHubbleType(hubbleType: string): string {
  const t = (hubbleType || "").toLowerCase();
  const barred = /\bsb|barred/.test(t);
  const elliptical = /\be\d|elliptical/.test(t);
  const lenticular = /\bs0|lenticular/.test(t);
  if (elliptical && !lenticular) {
    // E0..E7: pick a representative handle node
    return /e[5-9]/.test(t) ? "E5" : "E0";
  }
  if (lenticular) return "S0";
  // spiral late-ness: a/b/c/d
  let stage: "a" | "b" | "c" = "b";
  if (/(s(b)?\(?[a-z]*\)?)?a\b|\(s\)a|s\(s\)a|sa\b/.test(t)) stage = "a";
  if (/c|d/.test(t.replace(/^[^)]*\)/, ""))) stage = "c";
  const prefix = barred ? "SB" : "S";
  return `${prefix}${stage}`;
}

export default function TuningFork({ hubbleType }: { hubbleType: string }) {
  const active = classifyHubbleType(hubbleType);
  const all = [...ELLIPTICALS, ...SPIRALS, ...BARRED];

  return (
    <div className="hud-panel rounded-2xl p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-200/90">
        Hubble tuning fork
      </h2>
      <svg
        viewBox="0 0 290 140"
        className="mt-2 w-full"
        role="img"
        aria-label={`Hubble classification diagram, highlighting ${active}`}
      >
        {/* handle + branches */}
        <path
          d="M30 70 H120 M120 70 L160 34 H260 M120 70 L160 106 H260"
          fill="none"
          stroke="#4a5568"
          strokeWidth={1.5}
        />
        {all.map((n) => {
          const on = n.id === active;
          return (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={on ? 9 : 6}
                fill={on ? GALAXIES_ACCENT : "#1a2436"}
                stroke={on ? GALAXIES_ACCENT : "#4a5568"}
                strokeWidth={1.5}
              />
              <text
                x={n.x}
                y={n.y - 12}
                textAnchor="middle"
                fontSize="9"
                fontFamily="monospace"
                fill={on ? "#ffe9c2" : "#7a8699"}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-[10px] leading-snug text-faint">
        Schematic classification diagram. The highlighted class is a coarse
        reading of the cited Hubble type; the diagram is illustrative, not a
        rendering of the galaxy.
      </p>
    </div>
  );
}
