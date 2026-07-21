"use client";

import type { BlackHole, BlackHoleState } from "@/lib/black-holes";
import {
  fmtDistanceLy,
  fmtKelvin,
  fmtMass,
  fmtMeters,
  fmtSchwarzschild,
  fmtUas,
  fmtYears,
  schwarzschildComparison,
} from "./blackHolesUi";

/**
 * The facts panel: every value is a real measurement (from the catalog) or a
 * quantity computed by lib/black-holes from that measurement, each tagged. The
 * headline validation is the shadow angular size shown COMPUTED vs the OBSERVED
 * EHT value side by side (for Sgr A* and M87*). Missing values read plainly;
 * nothing is invented.
 */

function Row({
  label,
  value,
  tag,
  note,
}: {
  label: string;
  value: string;
  tag?: "measured" | "computed" | "theory";
  note?: string;
}) {
  const tagColor =
    tag === "theory"
      ? "text-fuchsia-300/80"
      : tag === "computed"
        ? "text-sky-300/80"
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

export default function BlackHolesHud({
  bh,
  state,
}: {
  bh: BlackHole;
  state: BlackHoleState;
}) {
  const comparison = schwarzschildComparison(
    state.schwarzschildRadiusAU,
    state.schwarzschildRadiusKm
  );
  const computedUas = state.shadowAngularSizeMicroarcsec;
  const observedUas = state.observedShadowMicroarcsec;

  return (
    <div className="hud-panel rounded-2xl p-4">
      <h2 className="font-display text-lg font-medium tracking-tight text-ice">
        {bh.name}
      </h2>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {bh.type} · {bh.discoveryInstrument}
      </p>

      <div className="mt-2">
        <Row
          label="Mass"
          value={fmtMass(bh.massMsun)}
          tag="measured"
          note={
            bh.massUncertaintyMsun
              ? `Cited measurement, uncertainty about ${fmtMass(bh.massUncertaintyMsun)}.`
              : "Cited measurement (uncertainty method-dependent)."
          }
        />
        <Row label="Distance" value={fmtDistanceLy(bh.distanceLy)} tag="measured" />
        <Row
          label="Schwarzschild radius"
          value={fmtSchwarzschild(state)}
          tag="computed"
          note={`r_s = 2GM/c^2.${comparison ? ` ${comparison}.` : ""}`}
        />
        <Row
          label="Photon sphere"
          value={fmtMeters(state.photonSphereM)}
          tag="computed"
          note="1.5 r_s: the radius where light can orbit."
        />
        <Row
          label="ISCO"
          value={fmtMeters(state.iscoM)}
          tag="computed"
          note="3 r_s (Schwarzschild): the inner edge of a thin accretion disk."
        />

        {/* the headline validation: computed vs observed shadow */}
        <div className="mt-1 rounded-xl border border-sky-400/20 bg-sky-400/[0.04] p-2.5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Shadow angular size
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wide text-sky-300/80">
              computed vs observed
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <div>
              <div className="font-mono text-[15px] text-ice">{fmtUas(computedUas)}</div>
              <div className="font-mono text-[9px] uppercase tracking-wide text-faint">
                computed
              </div>
            </div>
            <span className="text-faint">vs</span>
            <div className="text-right">
              <div className="font-mono text-[15px] text-emerald-300">
                {fmtUas(observedUas)}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-wide text-faint">
                {observedUas !== null ? "EHT observed" : "not imaged"}
              </div>
            </div>
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-faint">
            Computed 2*sqrt(27)*GM/(c^2 D), Schwarzschild.{" "}
            {observedUas !== null
              ? "The small gap from the EHT value is the spin and emission geometry the non-spinning formula omits, noted not hidden."
              : "This object has not been imaged by the EHT; only the computed value is shown."}
          </p>
        </div>

        <Row
          label="Spin (a*)"
          value={bh.spin !== null ? bh.spin.toFixed(2) : "not well constrained"}
          tag="measured"
          note={
            bh.spin !== null
              ? "Cited. The render is non-spinning Schwarzschild and does not model it."
              : "Left blank rather than invented."
          }
        />
        <Row
          label="Hawking temperature"
          value={fmtKelvin(state.hawkingTemperatureK)}
          tag="theory"
          note="Real theory, UNOBSERVED. Far below the 2.7 K CMB, so this hole grows, not evaporates."
        />
        <Row
          label="Evaporation time"
          value={fmtYears(state.evaporationTimeYears)}
          tag="theory"
          note="t proportional to M^3. Real theory, unobserved."
        />
      </div>

      <p className="mt-3 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
        {bh.note}
      </p>
      <p className="mt-2 text-[10px] leading-snug text-faint">Source: {bh.source}</p>
    </div>
  );
}
