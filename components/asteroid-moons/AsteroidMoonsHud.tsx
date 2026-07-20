"use client";

import { useMemo } from "react";
import {
  asteroidMoonsState,
  type AsteroidBodyPosition,
  type AsteroidSystem,
} from "@/lib/asteroid-moons";
import {
  MOON_COLORS,
  SCHEMATIC_CAVEAT,
  SYSTEM_HEADLINE,
  dateTimeLabel,
  formatDiameter,
  formatPeriod,
  moonKeys,
  moonTierBadge,
} from "./asteroidMoonsUi";

interface AsteroidMoonsHudProps {
  system: AsteroidSystem;
  /** displayed instant (ms), throttled from the parent clock. */
  displayedMs: number;
  isLive: boolean;
}

/**
 * Left HUD (below the system-geometry headline). Everything here is COMPUTED from
 * lib/asteroid-moons at the displayed instant: the system identity and population,
 * the primary size, each moon&apos;s current elongation (in primary radii) and live
 * mutual period (DART-stepped for Dimorphos), the headline fact, the data-tier
 * badges, and the load-bearing honesty line, that this is a schematic mutual-orbit
 * view of systems unresolvable from Earth, with no plane-of-sky or visibility claim.
 * There is deliberately NO observer/visibility panel (the lib has no sky position).
 * Every physics call is guarded against null.
 */
export default function AsteroidMoonsHud({
  system,
  displayedMs,
  isLive,
}: AsteroidMoonsHudProps) {
  const date = useMemo(() => new Date(displayedMs), [displayedMs]);
  const state = useMemo(() => asteroidMoonsState(system, date), [system, date]);
  const keys = moonKeys(system);

  return (
    <div className="hud-panel rounded-2xl p-4">
      {/* identity */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
            {system} system
          </p>
          <h1 className="mt-1 font-display text-lg font-medium leading-tight text-ice">
            {state ? `${state.systemData.designation} ${system}` : system}
          </h1>
          <p className="mt-0.5 font-mono text-[10px] text-faint">
            Computed · schematic mutual orbit
          </p>
        </div>
        <span className="mt-1 flex items-center gap-1.5">
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${
              isLive ? "bg-solar animate-pulse-dot" : "bg-white/30"
            }`}
          />
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.18em] ${
              isLive ? "text-solar" : "text-faint"
            }`}
          >
            {isLive ? "live" : "scrubbed"}
          </span>
        </span>
      </div>
      <p className="mt-1 font-mono text-[10px] text-dim">{dateTimeLabel(date)}</p>

      {!state ? (
        <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
          Positions unavailable for this instant.
        </p>
      ) : (
        <>
          {/* headline fact */}
          <p className="mt-3 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5 text-[11px] leading-relaxed text-dim">
            {SYSTEM_HEADLINE[system]}
          </p>

          {/* primary */}
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-line pt-3">
            <Stat
              label="Primary size"
              value={formatDiameter(state.systemData.primaryDiameterKm)}
              title={state.systemData.shapeNote}
            />
            <Stat
              label="Bodies"
              value={
                state.isTriple
                  ? "triple (2 moons)"
                  : state.nearEqualDouble
                    ? "near-equal double"
                    : "binary (1 moon)"
              }
              title="The number of bodies in the system, from lib/asteroid-moons."
            />
          </div>

          {/* per-moon current state */}
          <div className="mt-3 border-t border-line pt-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
              Moons now (elongation · period)
            </p>
            <ul className="mt-2 space-y-1.5">
              {state.positions
                .filter((p) => p.role === "moon")
                .map((p, i) => (
                  <MoonRow key={p.body} p={p} colorKey={keys[i]} />
                ))}
            </ul>
            <p className="mt-2 text-[10px] leading-relaxed text-faint">
              Elongation is the moon&apos;s current offset from the barycenter in
              primary radii (R), in the adopted orbit plane. The period is the real
              mutual period{system === "Didymos" ? " (DART-stepped for Dimorphos)" : ""}.
            </p>
          </div>

          {/* honesty: the schematic-view caveat + accuracy split */}
          <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
              What is real, what is schematic
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
              <span className="text-ice">Real, to scale:</span> the body sizes, the
              mutual-orbit separation and the period ({state.systemData.source}).{" "}
              <span className="text-ice">Adopted convention:</span> the orbit&apos;s
              orientation in space and the along-orbit phase, for every system, never a
              real position on a date.
              {system === "Ida" && (
                <>
                  {" "}
                  Dactyl&apos;s orbit is additionally{" "}
                  <span className="text-[#e0a877]">poorly constrained</span> (single
                  1993 Galileo flyby).
                </>
              )}
            </p>
          </div>

          {/* the load-bearing schematic caveat */}
          <p className="mt-3 border-t border-line pt-3 text-[10px] leading-relaxed text-faint">
            {SCHEMATIC_CAVEAT}
          </p>
        </>
      )}
    </div>
  );
}

function MoonRow({
  p,
  colorKey,
}: {
  p: AsteroidBodyPosition;
  colorKey: string | undefined;
}) {
  const elongation = Math.hypot(p.xReq, p.yReq);
  const badge = moonTierBadge(p.orbitUncertain);
  const color = colorKey ? MOON_COLORS[colorKey as keyof typeof MOON_COLORS] : "#a89e90";
  return (
    <li className="flex items-center gap-2 text-[11px]">
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-ice">{p.body}</span>
      {p.orbitUncertain && (
        <span
          className="font-mono text-[8.5px] uppercase tracking-wider text-[#e0a877]"
          title={badge.title}
        >
          uncertain
        </span>
      )}
      <span className="ml-auto font-mono text-[10px] text-dim">
        {elongation.toFixed(1)} R
      </span>
      <span className="w-[86px] shrink-0 text-right font-mono text-[9px] text-faint">
        {p.periodHours !== null ? formatPeriod(p.periodHours) : ""}
      </span>
    </li>
  );
}

function Stat({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div title={title}>
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-[12.5px] tracking-wide text-dim">{value}</p>
    </div>
  );
}
