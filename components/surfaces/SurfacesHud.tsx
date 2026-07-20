"use client";

/* eslint-disable @next/next/no-img-element */

import type {
  MarsSurfaceState,
  SurfaceState,
  TitanSurfaceState,
} from "@/lib/surfaces";
import {
  DEM_RESOLUTION_LABEL,
  HUYGENS_CREDIT,
  HUYGENS_PHOTO,
  JEZERO_TERRAIN_LABEL,
  LIVE_SIMULATION_LABEL,
  MARS_SUNSET_PHOTO,
  PANORAMA_CREDIT,
  PANORAMA_LABEL,
  SATURN_HAZE_LABEL,
  SATURN_RINGS_EDGE_LABEL,
  SKY_PALETTE_LABEL,
  SUNSET_PHOTO_CREDIT,
  TITAN_TERRAIN_LABEL,
  formatHours,
} from "./surfacesUi";
import type { MarsViewMode } from "./SurfacesCanvas";

/**
 * The Surfaces HUD: every number on it is the pure lib/surfaces surfaceState
 * bundle for the displayed instant, plus the mandatory honesty labels from
 * docs/SURFACES_DATA_SOURCES.md. Mars shows the real clock (LMST, sol, Ls,
 * season), sun altitude, irradiance and cited facts; Titan shows the real
 * Cassini-Huygens facts, the adopted-phase note, the Saturn visibility truth
 * and the Huygens photo with its verbatim joint credit.
 */

interface SurfacesHudProps {
  state: SurfaceState | null;
  isLive: boolean;
  marsView: MarsViewMode;
  /** true when the DEM decoded at the full 16 bits (8-bit canvas fallback otherwise) */
  demBits: 8 | 16 | null;
  exaggeration: number;
}

export default function SurfacesHud({
  state,
  isLive,
  marsView,
  demBits,
  exaggeration,
}: SurfacesHudProps) {
  if (state === null) {
    return (
      <section className="hud-panel rounded-2xl p-4 font-mono text-[11px] text-dim">
        Surface state unavailable for this instant.
      </section>
    );
  }
  return state.world === "mars" ? (
    <MarsHud
      state={state}
      isLive={isLive}
      marsView={marsView}
      demBits={demBits}
      exaggeration={exaggeration}
    />
  ) : (
    <TitanHud state={state} isLive={isLive} />
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-faint">{label}</span>
      <span className="text-right text-ice">{value}</span>
    </div>
  );
}

function LivePill({ isLive }: { isLive: boolean }) {
  return (
    <p
      className="mb-2 flex items-start gap-1.5 rounded-lg border border-line bg-white/[0.02] px-2 py-1.5 text-[10px] leading-snug text-dim"
      title={LIVE_SIMULATION_LABEL}
    >
      <span
        aria-hidden
        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
          isLive ? "bg-solar animate-pulse-dot" : "bg-white/30"
        }`}
      />
      <span>
        {isLive ? "LIVE" : "SCRUBBED"}: live simulation (real computed sun and
        clock), not a camera.
      </span>
    </p>
  );
}

// ── Mars ─────────────────────────────────────────────────────────────────────

function MarsHud({
  state,
  isLive,
  marsView,
  demBits,
  exaggeration,
}: {
  state: MarsSurfaceState;
  isLive: boolean;
  marsView: MarsViewMode;
  demBits: 8 | 16 | null;
  exaggeration: number;
}) {
  const { daylight, sun, sky, facts, site } = state;
  return (
    <>
      <section className="hud-panel rounded-2xl p-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
          {site.name}
        </h2>
        <p className="mt-1 font-mono text-[9px] leading-snug text-faint/80">
          {site.source}
        </p>
        <div className="mt-3">
          <LivePill isLive={isLive} />
        </div>
        <div className="space-y-1.5 font-mono text-[11px]">
          <Row label="LMST (real Mars clock)" value={formatHours(daylight.localMeanSolarTimeHours)} />
          <Row label="Sol" value={String(daylight.sol)} />
          <Row label="Ls" value={`${daylight.ls.toFixed(1)} deg`} />
          <Row label="Season (N hemisphere)" value={daylight.season} />
          <Row label="Phase" value={daylight.phase} />
          <Row label="Sun altitude" value={`${sun.altitudeDeg.toFixed(1)} deg`} />
          <Row label="Sun azimuth" value={`${sun.azimuthDeg.toFixed(1)} deg`} />
          <Row
            label="Irradiance (top of atm.)"
            value={`${state.irradianceTopWm2.toFixed(0)} W/m2`}
          />
          <Row label="Gravity" value={`${facts.surfaceGravityMs2} m/s2`} />
          <Row label="Pressure (mean)" value={`~${facts.meanSurfacePressurePa} Pa`} />
          <Row label="Sol length" value={facts.solLength} />
        </div>
        <p className="mt-2 font-mono text-[9px] leading-snug text-faint/80">
          Clock and sun: NASA GISS Mars24 (Allison &amp; McEwen 2000), computed
          in-repo. Facts: {facts.source}.
        </p>
      </section>

      {marsView === "terrain" ? (
        <section className="hud-panel rounded-2xl p-4">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Sky story (computed regime)
          </h3>
          <p className="mt-2 text-[12px] leading-relaxed text-dim">
            <span className="text-ice">{sky.regime}</span>. {sky.explanation}
          </p>
          <img
            src={MARS_SUNSET_PHOTO}
            alt="Real Curiosity Mastcam photograph of a blue sunset in Gale Crater, sol 956 (PIA19400)"
            className="mt-2 w-full rounded-lg border border-line"
            loading="lazy"
          />
          <p className="mt-1.5 font-mono text-[9px] leading-snug text-faint/80">
            Observational basis: {sky.citation}. Photo PIA19400, credit{" "}
            {SUNSET_PHOTO_CREDIT}.
          </p>
          <p className="mt-1.5 font-mono text-[9px] leading-snug text-faint">
            {SKY_PALETTE_LABEL}
          </p>
          <p className="mt-1.5 font-mono text-[9px] leading-snug text-faint">
            {DEM_RESOLUTION_LABEL}
            {demBits === 8 &&
              " (heightmap decoded at 8-bit precision in this browser, ~24 m elevation steps)"}
            {exaggeration !== 1 &&
              ` Vertical scale exaggerated ${exaggeration}x (labeled display choice).`}
          </p>
          {site.id === "jezero" && (
            <p className="mt-1.5 rounded-lg border border-solar/30 bg-solar/5 px-2 py-1.5 font-mono text-[9px] leading-snug text-dim">
              {JEZERO_TERRAIN_LABEL}
            </p>
          )}
          <p className="mt-1.5 font-mono text-[9px] leading-snug text-faint/80">
            Terrain: NASA/JPL/GSFC (MOLA Science Team); PDS Geosciences Node
            (public domain), real meter scaling.
          </p>
        </section>
      ) : (
        <section className="hud-panel rounded-2xl p-4">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Panorama mode (real photograph)
          </h3>
          <p className="mt-2 text-[12px] leading-relaxed text-dim">{PANORAMA_LABEL}</p>
          <p className="mt-1.5 font-mono text-[9px] leading-snug text-faint/80">
            Credit {PANORAMA_CREDIT}. This photo is the ground truth companion to
            the rendered terrain; the sun and sky in it are as photographed on
            sol 3509, not the live computed instant.
          </p>
        </section>
      )}
    </>
  );
}

// ── Titan ────────────────────────────────────────────────────────────────────

function TitanHud({
  state,
  isLive,
}: {
  state: TitanSurfaceState;
  isLive: boolean;
}) {
  const { sun, saturn, facts, site } = state;
  return (
    <>
      <section className="hud-panel rounded-2xl p-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
          {site.name}
        </h2>
        <p className="mt-1 font-mono text-[9px] leading-snug text-faint/80">
          {site.source}
        </p>
        <div className="mt-3">
          <LivePill isLive={isLive} />
        </div>
        <div className="space-y-1.5 font-mono text-[11px]">
          <Row label="Surface temperature" value={`~${facts.surfaceTemperatureK} K`} />
          <Row label="Surface pressure" value={`~${facts.surfacePressureBar} bar`} />
          <Row label="Gravity" value={`${facts.surfaceGravityMs2} m/s2`} />
          <Row
            label="Daylight vs Earth"
            value={`~${(facts.surfaceDaylightVsEarth * 100).toFixed(1)}%`}
          />
          <Row
            label="Sun altitude (adopted phase)"
            value={`${sun.altitudeDeg.toFixed(1)} deg`}
          />
          <Row
            label="Irradiance (top of atm.)"
            value={`${state.irradianceTopWm2.toFixed(1)} W/m2`}
          />
          <Row
            label="Saturn apparent size"
            value={`${saturn.angularDiameterDeg.toFixed(2)} deg (~10.9x Moon)`}
          />
          <Row
            label="Saturn in this sky"
            value={
              saturn.visible
                ? `up, alt ${saturn.altitudeDeg.toFixed(0)} deg (fixed)`
                : `below horizon, alt ${saturn.altitudeDeg.toFixed(0)} deg`
            }
          />
        </div>
        {!saturn.visible && (
          <p className="mt-2 rounded-lg border border-line bg-white/[0.02] px-2 py-1.5 font-mono text-[9px] leading-snug text-dim">
            Saturn is below the horizon here, altitude{" "}
            {saturn.altitudeDeg.toFixed(0)} deg: the real Huygens site is on the
            anti-Saturn hemisphere, and Titan&apos;s tidal lock keeps Saturn
            fixed in the sky, so it never rises here. Switch to the labeled
            Sub-Saturn viewpoint to see it.
          </p>
        )}
        {saturn.visible && (
          <p className="mt-2 rounded-lg border border-line bg-white/[0.02] px-2 py-1.5 font-mono text-[9px] leading-snug text-dim">
            {SATURN_HAZE_LABEL} {SATURN_RINGS_EDGE_LABEL}
            {!site.landingSite &&
              " This is a chosen viewpoint, not a landing site."}
          </p>
        )}
        <p className="mt-2 font-mono text-[9px] leading-snug text-faint">
          {sun.phaseNote}
        </p>
        <p className="mt-1.5 font-mono text-[9px] leading-snug text-faint">
          {TITAN_TERRAIN_LABEL}
        </p>
        <p className="mt-1.5 font-mono text-[9px] leading-snug text-faint/80">
          {facts.daylightDescription} {facts.methaneCycle} Source: {facts.source}.
        </p>
      </section>

      <section className="hud-panel rounded-2xl p-4">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
          The one real photo from Titan
        </h3>
        <img
          src={HUYGENS_PHOTO}
          alt="First color view of Titan's surface, Huygens DISR, 2005-01-14 (PIA07232)"
          className="mt-2 w-full rounded-lg border border-line"
          loading="lazy"
        />
        <p className="mt-1.5 font-mono text-[10px] leading-snug text-dim">
          Credit: {HUYGENS_CREDIT}
        </p>
        <p className="mt-1 font-mono text-[9px] leading-snug text-faint/80">
          {facts.huygensLanding} {facts.surfaceMaterial}
        </p>
      </section>
    </>
  );
}
