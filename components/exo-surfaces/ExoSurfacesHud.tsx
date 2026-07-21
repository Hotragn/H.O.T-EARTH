"use client";

import type { ExoSurfaceState } from "@/lib/exo-surfaces";
import { fmtIrradiance, fmtYear } from "./exoSurfacesUi";

/**
 * The facts panel: every REAL / COMPUTED quantity from exoSurfaceState, each
 * tagged real or computed, with the NASA Exoplanet Archive as the source. A
 * missing value is shown as "not measured", never invented. Surface gravity is
 * shown only for a rocky world; for the gas giant it reads "no surface".
 */

const NM = "not measured";

function Row({
  label,
  value,
  tag,
  note,
}: {
  label: string;
  value: string;
  tag?: "real" | "computed" | "inferred";
  note?: string;
}) {
  const tagColor =
    tag === "inferred"
      ? "text-amber-300/80"
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

export default function ExoSurfacesHud({ state }: { state: ExoSurfaceState }) {
  const sky = state.hostStarSky;
  const g = state.surfaceGravity;
  const irr = state.irradiance;
  const discs = state.siblingDiscs?.discs ?? [];

  return (
    <div className="hud-panel rounded-2xl p-4">
      <h2 className="font-display text-lg font-medium tracking-tight text-ice">
        {state.displayName}
      </h2>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        Host {state.hostname} ·{" "}
        {state.distanceLy !== null ? `${state.distanceLy.toFixed(1)} ly` : NM}
      </p>

      <div className="mt-2">
        <Row
          label="Host star"
          value={
            sky
              ? `${sky.spectralType ?? "star"}${sky.teffK !== null ? `, ${Math.round(sky.teffK).toLocaleString()} K` : ""}`
              : NM
          }
          tag="real"
          note="Spectral type and effective temperature from the archive."
        />
        <Row
          label="Star in the sky"
          value={
            sky
              ? `${sky.angularDiameterDeg.toFixed(2)} deg wide, ${sky.timesOurSun.toFixed(1)}x our Sun`
              : NM
          }
          tag="computed"
          note={
            sky
              ? `Apparent size 2*atan(R*/a).${sky.radiusDerived ? " Stellar radius derived (Stefan-Boltzmann); no catalogue radius." : ""} Colour is an illustrative Teff-to-RGB mapping.`
              : "Needs a stellar radius and orbital distance."
          }
        />
        <Row
          label="Surface gravity"
          value={
            state.hasSurface
              ? g
                ? `${g.gEarth.toFixed(2)} g (${g.ms2.toFixed(1)} m/s2)`
                : NM
              : "no surface (gas giant)"
          }
          tag={state.hasSurface ? "computed" : undefined}
          note={
            state.hasSurface
              ? "g = M/R^2 in Earth units, from measured mass and radius (rocky worlds only)."
              : "There is no solid surface to stand on."
          }
        />
        <Row
          label="Irradiance"
          value={irr ? fmtIrradiance(irr.earths, irr.wm2) : NM}
          tag="computed"
          note="Measured insolation (Earth-relative) times the solar constant (1361 W/m2)."
        />
        <Row
          label="Equilibrium temp"
          value={state.equilibriumTempK !== null ? `${Math.round(state.equilibriumTempK)} K` : NM}
          tag={state.eqtComputed ? "computed" : "real"}
          note={
            state.eqtComputed
              ? "Computed from luminosity and distance (radiative balance); a blackbody lower bound."
              : "Measured equilibrium temperature from the archive."
          }
        />
        <Row
          label="Year length"
          value={state.year ? fmtYear(state.year.yearDays) : NM}
          tag="real"
          note="The measured orbital period. The only real time-of-cycle quantity here."
        />
        <Row
          label="Composition"
          value={state.composition ? state.composition.label : NM}
          tag="inferred"
          note="Estimated from radius/mass; not an observed composition."
        />
        <Row
          label="Discovery"
          value={
            state.discovery.method || state.discovery.year
              ? `${state.discovery.method ?? "?"}${state.discovery.year ? `, ${state.discovery.year}` : ""}`
              : NM
          }
          tag="real"
        />
      </div>

      {discs.length > 0 && (
        <div className="mt-3 border-t border-line/60 pt-2">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Sibling discs
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wide text-sky-300/80">
              computed
            </span>
          </div>
          <ul className="mt-1 space-y-1">
            {discs.slice(0, 6).map((d) => (
              <li
                key={d.name ?? d.maxAngularDiameterDeg}
                className="flex items-baseline justify-between gap-2 font-mono text-[11px]"
              >
                <span className="text-ice">{d.name ?? "sibling"}</span>
                <span className="text-dim">
                  {d.maxAngularDiameterDeg.toFixed(2)} deg
                  {d.timesMoon > 1 && (
                    <span className="ml-1 text-amber-300/90">
                      {d.timesMoon.toFixed(1)}x Moon
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[10px] leading-snug text-faint">
            Maximum apparent size at closest approach; not always this large or on
            the same side of the star. Amber = larger than our full Moon.
          </p>
        </div>
      )}

      <p className="mt-3 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
        Source: NASA Exoplanet Archive (measured), computed via lib/exoplanets and
        lib/exo-surfaces. Missing values read &quot;not measured&quot;.
      </p>
    </div>
  );
}
