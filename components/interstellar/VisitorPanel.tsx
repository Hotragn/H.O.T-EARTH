"use client";

import { useMemo } from "react";
import {
  getInterstellarObject,
  interstellarState,
  type InterstellarId,
} from "@/lib/interstellar";
import { OBJECT_COLOR, VISITORS_ACCURACY_NOTE } from "./interstellarUi";

/**
 * The Visitors fact + live-state HUD for the selected object. Real, cited facts
 * from lib/interstellar's data record, plus the one-call interstellarState bundle
 * (speed km/s, Sun/Earth distance, inbound/outbound of perihelion) recomputed at
 * the scrubbed instant. The JPL SBDB citation and the osculating-two-body accuracy
 * note are shown so no claim is overstated. Every value is guarded for null.
 */

function fmt(n: number | null | undefined, digits: number, unit = ""): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "not available";
  return `${n.toFixed(digits)}${unit}`;
}

export default function VisitorPanel({
  selectedId,
  displayedMs,
}: {
  selectedId: InterstellarId;
  displayedMs: number;
}) {
  const obj = getInterstellarObject(selectedId);
  const color = OBJECT_COLOR[selectedId];

  const state = useMemo(
    () => interstellarState(selectedId, new Date(displayedMs)),
    [selectedId, displayedMs],
  );

  if (!obj) return null;

  const phaseLabel =
    state?.phase === "at perihelion"
      ? "at perihelion"
      : state?.phase === "inbound"
        ? "inbound (approaching)"
        : state?.phase === "outbound"
          ? "outbound (receding)"
          : "not available";

  const days = state?.daysFromPerihelion;
  const perihelionRel =
    typeof days === "number" && Number.isFinite(days)
      ? days < 0
        ? `${Math.abs(days).toFixed(0)} days before perihelion`
        : days > 0
          ? `${days.toFixed(0)} days after perihelion`
          : "at perihelion"
      : "";

  return (
    <div className="hud-panel flex w-[320px] max-w-[92vw] flex-col gap-3 rounded-2xl p-4">
      {/* header */}
      <div>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h2 className="font-display text-lg font-medium text-ice">{obj.name}</h2>
          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-faint">
            unbound
          </span>
        </div>
        <p className="mt-0.5 font-mono text-[10px] tracking-wide text-faint">
          {obj.designation} · discovered {obj.discoveryYear} · {obj.discoverySurvey}
        </p>
      </div>

      {/* live state at the scrubbed instant */}
      <div className="rounded-xl border border-line bg-white/[0.02] p-3">
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
          At the shown time
        </p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <Stat label="Speed (heliocentric)" value={fmt(state?.speedKmS, 1, " km/s")} />
          <Stat label="Distance from Sun" value={fmt(state?.distanceFromSunAU, 2, " AU")} />
          <Stat label="Distance from Earth" value={fmt(state?.distanceFromEarthAU, 2, " AU")} />
          <Stat label="Phase" value={phaseLabel} />
        </dl>
        {perihelionRel && (
          <p className="mt-2 font-mono text-[10px] text-dim">{perihelionRel}</p>
        )}
      </div>

      {/* blurb */}
      <p className="text-xs leading-relaxed text-dim">{obj.blurb}</p>

      {/* real, cited orbital + physical facts */}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <Stat label="Eccentricity" value={obj.eccentricity.toFixed(3)} />
        <Stat label="Perihelion q" value={`${obj.perihelionAU.toFixed(3)} AU`} />
        <Stat label="v∞ (excess speed)" value={`${obj.vInfKmS.toFixed(1)} km/s`} />
        <Stat label="Inclination" value={`${obj.inclinationDeg.toFixed(1)}°`} />
        <Stat label="Type" value={obj.isActiveComet ? "active comet" : "inert / asteroidal"} />
        <Stat label="Came from" value={obj.originConstellation.split(",")[0]} />
      </dl>

      {/* honest notes */}
      <ul className="flex flex-col gap-1.5 text-[11px] leading-snug text-dim">
        {obj.facts.map((f) => (
          <li key={f} className="flex gap-1.5">
            <span aria-hidden style={{ color }}>
              ·
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] leading-snug text-faint">
        <span className="text-dim">Origin / age:</span> {obj.ageNote}
      </p>
      <p className="text-[11px] leading-snug text-faint">
        <span className="text-dim">Nucleus:</span> {obj.nucleusSizeNote}
      </p>

      {/* accuracy + citation */}
      <p className="border-t border-line pt-2.5 font-mono text-[9px] leading-relaxed text-faint">
        {VISITORS_ACCURACY_NOTE}
      </p>
      <p className="font-mono text-[9px] leading-relaxed text-faint/80">
        Source: {obj.source}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-0.5 text-ice">{value}</dd>
    </div>
  );
}
