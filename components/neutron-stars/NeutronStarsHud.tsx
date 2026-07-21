"use client";

import type { NeutronStar, NeutronStarState } from "@/lib/neutron-stars";
import {
  CANONICAL_LABEL,
  CRAB_AGE_LABEL,
  fmtAge,
  fmtDensity,
  fmtDistanceLy,
  fmtEarthG,
  fmtFractionC,
  fmtFrequency,
  fmtGauss,
  fmtLuminosity,
  fmtPeriod,
  fmtRadius,
} from "./neutronStarsUi";

/**
 * The facts panel: every value is a real cited measurement (from the catalog) or
 * a quantity computed by lib/neutron-stars from those measurements, each tagged.
 * The canonical 1.4 Msun / 12 km assumption is flagged wherever mass or radius is
 * not individually measured. Every field is null-safe; missing values read
 * plainly ("not available"), nothing is invented.
 */

function Row({
  label,
  value,
  tag,
  note,
}: {
  label: string;
  value: string;
  tag?: "measured" | "computed" | "assumed";
  note?: string;
}) {
  const tagColor =
    tag === "assumed"
      ? "text-amber-300/80"
      : tag === "computed"
        ? "text-cyan-300/80"
        : "text-emerald-300/80";
  return (
    <div className="border-t border-line/60 py-1.5 first:border-t-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {label}
        </span>
        {tag && (
          <span className={`font-mono text-[9px] uppercase tracking-wide ${tagColor}`}>
            {tag}
          </span>
        )}
      </div>
      <div className="mt-0.5 font-mono text-[12px] text-ice">{value}</div>
      {note && <div className="mt-0.5 text-[10px] leading-snug text-faint">{note}</div>}
    </div>
  );
}

export default function NeutronStarsHud({
  ns,
  state,
}: {
  ns: NeutronStar;
  state: NeutronStarState;
}) {
  const massNote = ns.massAssumed
    ? "Canonical 1.4 Msun assumed (not measured for this object)."
    : ns.massUncertaintyMsun
      ? `Measured, ${ns.massMsun} +/- ${ns.massUncertaintyMsun} Msun.`
      : `Measured, ${ns.massMsun} Msun.`;

  const bulkAssumed = ns.massAssumed || ns.radiusAssumed;

  return (
    <div className="hud-panel rounded-2xl p-4">
      <h2 className="font-display text-lg font-medium tracking-tight text-ice">
        {ns.name}
      </h2>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {ns.type} · discovered {ns.discoveryYear}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-dim">{ns.blurb}</p>

      <div className="mt-2">
        {/* the headline: real spin period + frequency */}
        <div className="mb-1 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-2.5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Spin period
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wide text-emerald-300/80">
              measured
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline justify-between gap-2">
            <div className="font-mono text-[15px] text-ice">{fmtPeriod(ns.periodS)}</div>
            <div className="font-mono text-[13px] text-cyan-300">
              {fmtFrequency(state.spinFrequencyHz)}
            </div>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-faint">
            The pulse timing is real: the flash, plot and audio all use this true
            period. The 3D spin is slowed for clarity.
          </p>
        </div>

        <Row
          label="Density"
          value={fmtDensity(state.densityKgM3)}
          tag={bulkAssumed ? "assumed" : "computed"}
          note={state.densityComparison ?? undefined}
        />
        <Row
          label="Surface gravity"
          value={fmtEarthG(state.surfaceGravityEarthG)}
          tag={bulkAssumed ? "assumed" : "computed"}
          note="g = GM/R^2."
        />
        <Row
          label="Escape velocity"
          value={fmtFractionC(state.escapeVelocityFractionC)}
          tag={bulkAssumed ? "assumed" : "computed"}
          note="v_esc = sqrt(2GM/R). Over half the speed of light."
        />
        <Row
          label="Equatorial spin speed"
          value={fmtFractionC(state.equatorialVelocityFractionC)}
          tag={ns.radiusAssumed ? "assumed" : "computed"}
          note="2 pi R / P at the equator."
        />
        <Row
          label="Magnetic field"
          value={fmtGauss(state.magneticFieldGauss)}
          tag="measured"
          note={state.magneticFieldComparison ?? "Not reliably measured for this object."}
        />
        <Row
          label="Size"
          value={fmtRadius(ns.radiusKm)}
          tag={ns.radiusAssumed ? "assumed" : "computed"}
          note={
            ns.radiusAssumed
              ? "Canonical 12 km assumed (not measured for this object)."
              : "NICER-measured radius."
          }
        />
        <Row label="Mass" value={`${ns.massMsun} Msun`} tag={ns.massAssumed ? "assumed" : "measured"} note={massNote} />
        <Row
          label="Characteristic age"
          value={fmtAge(state.characteristicAgeYears)}
          tag="computed"
          note={
            ns.id === "crab"
              ? CRAB_AGE_LABEL
              : state.characteristicAgeYears === null
                ? "P-dot not reliably measured, so no age estimate is shown."
                : "P/(2 P-dot), an order-of-magnitude spin-down clock."
          }
        />
        <Row
          label="Spin-down luminosity"
          value={fmtLuminosity(state.spinDownLuminosityW)}
          tag="computed"
          note={
            state.spinDownLuminosityW === null
              ? "P-dot not reliably measured."
              : "4 pi^2 I P-dot / P^3, with a canonical moment of inertia."
          }
        />
        <Row label="Distance" value={fmtDistanceLy(ns.distanceLy)} tag="measured" />
      </div>

      {bulkAssumed && (
        <p className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.04] px-2.5 py-1.5 text-[10px] leading-snug text-amber-200/80">
          {CANONICAL_LABEL}
        </p>
      )}

      <p className="mt-3 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
        {ns.note}
      </p>
      <p className="mt-2 text-[10px] leading-snug text-faint">Source: {ns.source}</p>
    </div>
  );
}
