"use client";

import { useEffect, useState } from "react";
import {
  MARS_CLIMATOLOGY_PATH,
  type MarsClimatology,
  interpAtLs,
  parseMarsClimatology,
} from "@/lib/mars-climatology";

type LoadState =
  | { status: "loading" }
  | { status: "unavailable"; reason: string }
  | { status: "ready"; data: MarsClimatology };

/**
 * Plots the CURRENT Ls against a real seasonal climatology curve (CO2 surface
 * pressure by Ls), IF the Mars data agent has landed the artifact at
 * public/data/mars/climatology.json (shape defined in lib/mars-climatology.ts).
 *
 * Loaded defensively: fetch tolerates absence and shows "data unavailable"
 * rather than crashing. Honest label: seasonal climatology, not a live forecast.
 */
export default function MarsClimatologyPanel({ currentLs }: { currentLs: number }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(MARS_CLIMATOLOGY_PATH, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`responded ${res.status}`);
        const parsed = parseMarsClimatology(await res.json());
        if (cancelled) return;
        if (!parsed) {
          setState({ status: "unavailable", reason: "unrecognized shape" });
          return;
        }
        setState({ status: "ready", data: parsed });
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        setState({
          status: "unavailable",
          reason: err instanceof Error ? err.message : "not found",
        });
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <section
      aria-label="Mars seasonal climatology"
      className="pointer-events-auto absolute right-3 top-20 w-[248px] animate-hud-in sm:right-5 sm:top-24"
    >
      <div className="hud-panel rounded-2xl p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
          Seasonal climatology
        </p>

        {state.status === "loading" && (
          <p className="mt-2 font-mono text-[11px] text-dim">Loading…</p>
        )}

        {state.status === "unavailable" && (
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-faint">
            Data unavailable ({state.reason}). Awaiting{" "}
            <span className="text-dim">{MARS_CLIMATOLOGY_PATH}</span> from the
            Mars data pipeline.
          </p>
        )}

        {state.status === "ready" && (
          <Chart data={state.data} currentLs={currentLs} />
        )}

        <p className="mt-3 border-t border-line pt-2 font-mono text-[9px] leading-relaxed text-faint">
          Seasonal averages, not a live forecast.
        </p>
      </div>
    </section>
  );
}

const W = 216;
const H = 84;
const PAD = 6;

function Chart({ data, currentLs }: { data: MarsClimatology; currentLs: number }) {
  // Prefer pressure (the headline CO2 cycle); fall back to temp then dust.
  const field: "pressurePa" | "tempK" | "dustTau" = data.byLs.some(
    (p) => typeof p.pressurePa === "number"
  )
    ? "pressurePa"
    : data.byLs.some((p) => typeof p.tempK === "number")
      ? "tempK"
      : "dustTau";

  const labels: Record<typeof field, string> = {
    pressurePa: "Surface pressure (Pa)",
    tempK: "Surface temp (K)",
    dustTau: "Dust optical depth",
  };

  const pts = data.byLs
    .filter((p) => typeof p[field] === "number")
    .map((p) => ({ ls: p.ls, v: p[field] as number }));

  if (pts.length < 2) {
    return (
      <p className="mt-2 font-mono text-[10px] text-faint">
        Not enough points to plot.
      </p>
    );
  }

  const vs = pts.map((p) => p.v);
  const vMin = Math.min(...vs);
  const vMax = Math.max(...vs);
  const span = vMax - vMin || 1;

  const x = (ls: number) => PAD + (ls / 360) * (W - 2 * PAD);
  const y = (v: number) => PAD + (1 - (v - vMin) / span) * (H - 2 * PAD);

  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.ls).toFixed(1)},${y(p.v).toFixed(1)}`)
    .join(" ");

  const nowLs = ((currentLs % 360) + 360) % 360;
  const nowVal = interpAtLs(data, nowLs, field);

  return (
    <>
      <p className="mt-1.5 text-xs text-dim">{labels[field]}</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-1.5 w-full"
        role="img"
        aria-label={`${labels[field]} across the Mars year, current Ls marked`}
      >
        {/* season gridlines at Ls 90/180/270 */}
        {[90, 180, 270].map((g) => (
          <line
            key={g}
            x1={x(g)}
            y1={PAD}
            x2={x(g)}
            y2={H - PAD}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}
        {/* climatology curve */}
        <path
          d={path}
          fill="none"
          stroke="#9aa2b1"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
        {/* current-Ls marker */}
        <line
          x1={x(nowLs)}
          y1={PAD}
          x2={x(nowLs)}
          y2={H - PAD}
          stroke="#e2703a"
          strokeWidth={1.4}
        />
        {nowVal !== null && (
          <circle cx={x(nowLs)} cy={y(nowVal)} r={2.8} fill="#e2703a" />
        )}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[8px] uppercase tracking-wider text-faint">
        <span>Ls 0</span>
        <span>90</span>
        <span>180</span>
        <span>270</span>
      </div>
      <p className="mt-1.5 font-mono text-[10px] text-dim">
        Now: Ls {nowLs.toFixed(0)}°
        {nowVal !== null && (
          <span className="text-[#e2703a]">
            {" "}
            · {nowVal.toFixed(field === "dustTau" ? 2 : 0)}
          </span>
        )}
      </p>
      {data.meta.site && (
        <p className="mt-1 font-mono text-[9px] leading-snug text-faint">
          Measured: {data.meta.site}
        </p>
      )}
    </>
  );
}
