"use client";

import { useMemo, useState } from "react";
import { Crosshair } from "@phosphor-icons/react";
import {
  dwarfMoonsState,
  type DwarfMoonPosition,
  type DwarfSystem,
} from "@/lib/dwarf-moons";
import { equatorialToHorizontal } from "@/lib/celestial";
import {
  MOON_COLORS,
  compass16,
  moonName,
  moonTierBadge,
  type Observer,
} from "./dwarfMoonsUi";

interface DwarfMoonsHudProps {
  system: DwarfSystem;
  /** displayed instant (ms), throttled from the parent clock */
  displayedMs: number;
  isLive: boolean;
  observer: Observer;
  onObserverChange: (o: Observer) => void;
}

/**
 * Left HUD (below the system-geometry headline). Everything here is COMPUTED from
 * lib/dwarf-moons at the displayed instant: the system&apos;s distance and apparent
 * diameter (tiny, and it says so), the system opening (with its real/illustrative
 * flag), each moon&apos;s apparent elongation and its data tier, the accuracy bound
 * (the two tiers), and whether the system is above the viewer&apos;s horizon. Every
 * physics/celestial call is guarded against null (the lib returns null on bad
 * input, never throws).
 */
export default function DwarfMoonsHud({
  system,
  displayedMs,
  isLive,
  observer,
  onObserverChange,
}: DwarfMoonsHudProps) {
  const date = useMemo(() => new Date(displayedMs), [displayedMs]);
  const state = useMemo(() => dwarfMoonsState(system, date), [system, date]);

  const horizontal = useMemo(() => {
    if (!state) return null;
    return equatorialToHorizontal(
      state.geocentric.raDeg,
      state.geocentric.decDeg,
      observer.lat,
      observer.lon,
      date
    );
  }, [state, observer.lat, observer.lon, date]);

  const timeLabel = date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const arcsecPerReq = state ? state.geocentric.angularDiameterArcsec / 2 : 0;

  return (
    <div className="hud-panel rounded-2xl p-4">
      {/* identity */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
            {system} system
          </p>
          <h1 className="mt-1 font-display text-lg font-medium leading-tight text-ice">
            {system}&apos;s Moons
          </h1>
          <p className="mt-0.5 font-mono text-[10px] text-faint">
            Computed · Kepler (published elements)
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
      <p className="mt-1 font-mono text-[10px] text-dim">{timeLabel}</p>

      {!state ? (
        <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
          Positions unavailable for this instant.
        </p>
      ) : (
        <>
          {/* system geocentric */}
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-line pt-3">
            <Stat
              label="Distance"
              value={`${state.geocentric.distanceAU.toFixed(2)} AU`}
              title={`Earth-${system} distance for the displayed instant (computed; real, from lib/dwarf-planets).`}
            />
            <Stat
              label="Apparent size"
              value={`${state.geocentric.angularDiameterArcsec.toFixed(3)}″`}
              title="Apparent diameter of the central body in arcseconds. Unresolvable from Earth, which is why this is a configuration view, not an events tab."
            />
            <Stat
              label="System opening"
              value={`${state.geocentric.systemTiltDeg >= 0 ? "+" : ""}${state.geocentric.systemTiltDeg.toFixed(1)}°${state.geocentric.tiltReal ? "" : " ~"}`}
              title={
                state.geocentric.tiltReal
                  ? "Sub-Earth latitude on the Pluto-Charon plane (real, from Pluto's IAU pole)."
                  : "Illustrative: the reference plane is an adopted convention for this system, not a real measurement."
              }
            />
            <Stat
              label="1 R equals"
              value={`${arcsecPerReq.toFixed(3)}″`}
              title="One central-body radius (the elongation unit below) in arcseconds on the sky, at this distance."
            />
          </div>

          <p className="mt-2 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5 text-[10px] leading-relaxed text-faint">
            The central disk is only{" "}
            {state.geocentric.angularDiameterArcsec.toFixed(3)}″ across:{" "}
            <span className="text-dim">unresolvable from Earth</span>. This is a
            configuration view of the real orbits, not an observable-events clock.
          </p>

          {/* per-moon apparent state */}
          <div className="mt-3 border-t border-line pt-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
              Moons now (apparent elongation)
            </p>
            <ul className="mt-2 space-y-1.5">
              {state.positions.map((p) => (
                <MoonRow key={p.moon} p={p} />
              ))}
            </ul>
            <p className="mt-2 text-[10px] leading-relaxed text-faint">
              Elongation is the moon&apos;s apparent offset from the{" "}
              {system === "Pluto" ? "barycenter" : "body centre"} in central-body
              radii (R), W = west, E = east.
            </p>
          </div>

          {/* current geometric phenomena (usually empty by design) */}
          <div className="mt-3 border-t border-line pt-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
              Geometric alignments now
            </p>
            {state.current.length === 0 ? (
              <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
                No geometric transit, shadow, occultation or eclipse in progress.
                These systems are unresolvable from Earth, so this is usually empty
                by design (see the configuration panel).
              </p>
            ) : (
              <ul className="mt-1.5 space-y-1">
                {state.current.map((e) => (
                  <li
                    key={`${e.moon}-${e.type}`}
                    className="flex items-center gap-2 text-[11px]"
                  >
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: MOON_COLORS[e.moon] }}
                    />
                    <span className="text-ice">{moonName(e.moon)}</span>
                    <span className="ml-auto font-mono text-[10px] text-faint">
                      {e.type.replace("_", " ")}
                      {e.phaseReal ? " (geometric)" : " (illustrative)"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* accuracy honesty: the two tiers */}
          <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
              Accuracy: two tiers
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
              {state.hasRealEphemeris ? (
                <>
                  <span className="text-ice">{system} is the real-position tier</span>
                  : full cited mean elements, so Charon and the small moons are placed
                  where they actually are (best near J2000, low-accuracy Kepler
                  propagation). Cross-check JPL Horizons for critical work.
                </>
              ) : (
                <>
                  <span className="text-ice">
                    {system} is the orbit-real, position-illustrative tier
                  </span>
                  : the orbit size, shape, period and inclination are real and cited,
                  but the along-orbit phase and node are an adopted convention, not a
                  real ephemeris.
                  {system === "Makemake" && (
                    <>
                      {" "}
                      MK2&apos;s orbit is additionally{" "}
                      <span className="text-[#e0a877]">poorly constrained</span>.
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          {/* observer visibility (the parent sky position is real for all four) */}
          <ObserverVisibility
            system={system}
            observer={observer}
            onObserverChange={onObserverChange}
            horizontal={horizontal}
          />
        </>
      )}
    </div>
  );
}

function MoonRow({ p }: { p: DwarfMoonPosition }) {
  const side = p.x >= 0 ? "W" : "E";
  const elongation = Math.hypot(p.x, p.y);
  const badge = moonTierBadge(p);
  const tag = p.inTransit
    ? "in transit"
    : p.inOccultation
      ? "occulted"
      : p.frontOfDisk
        ? "in front"
        : "behind";
  return (
    <li className="flex items-center gap-2 text-[11px]">
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: MOON_COLORS[p.moon] }}
      />
      <span className="text-ice">{moonName(p.moon)}</span>
      {p.primaryComponent && (
        <span
          className="font-mono text-[8.5px] uppercase tracking-wider text-solar/80"
          title="The binary primary component: its separation drives Pluto's wobble."
        >
          binary
        </span>
      )}
      {p.orbitUncertain ? (
        <span
          className="font-mono text-[8.5px] uppercase tracking-wider text-[#e0a877]"
          title={badge.title}
        >
          uncertain
        </span>
      ) : !p.phaseReal ? (
        <span
          className="font-mono text-[8.5px] uppercase tracking-wider text-faint"
          title={badge.title}
        >
          illus
        </span>
      ) : null}
      <span className="ml-auto font-mono text-[10px] text-dim">
        {elongation.toFixed(1)} R {side}
      </span>
      <span className="w-[54px] shrink-0 text-right font-mono text-[9px] text-faint">
        {tag}
      </span>
    </li>
  );
}

// ───────────────────────────── observer section ────────────────────────────

function ObserverVisibility({
  system,
  observer,
  onObserverChange,
  horizontal,
}: {
  system: DwarfSystem;
  observer: Observer;
  onObserverChange: (o: Observer) => void;
  horizontal: { altitude: number; azimuth: number } | null;
}) {
  const [geoError, setGeoError] = useState<string | null>(null);

  const useMyLocation = () => {
    setGeoError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Geolocation not available");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        onObserverChange({
          label: "My location",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      () => setGeoError("Location permission denied"),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const above = horizontal !== null && horizontal.altitude > 0;

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          From your location
        </p>
        <button
          type="button"
          onClick={useMyLocation}
          title="Use my device location (optional; never required)"
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-black/20 px-2 py-1 font-mono text-[10px] text-dim transition-colors duration-200 hover:text-ice focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70"
        >
          <Crosshair size={12} weight="light" aria-hidden />
          My location
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <NumField
          label="lat"
          value={observer.lat}
          min={-90}
          max={90}
          onCommit={(v) =>
            onObserverChange({ label: "Custom", lat: v, lon: observer.lon })
          }
        />
        <NumField
          label="lon"
          value={observer.lon}
          min={-180}
          max={180}
          onCommit={(v) =>
            onObserverChange({ label: "Custom", lat: observer.lat, lon: v })
          }
        />
        <span className="ml-auto truncate font-mono text-[9px] text-faint">
          {observer.label}
        </span>
      </div>

      {geoError && (
        <p className="mt-1.5 font-mono text-[10px] text-solar">
          {geoError}. Using {observer.label}.
        </p>
      )}

      <div className="mt-2 rounded-xl border border-line bg-white/[0.02] px-3 py-2">
        {horizontal === null ? (
          <p className="text-[11px] text-faint">Visibility unavailable.</p>
        ) : above ? (
          <p className="text-[11px] leading-relaxed text-dim">
            {system} is{" "}
            <span className="text-ice">{horizontal.altitude.toFixed(0)}°</span> above
            the horizon in the{" "}
            <span className="text-ice">{compass16(horizontal.azimuth)}</span> (az{" "}
            {horizontal.azimuth.toFixed(0)}°). Above the horizon now, but the moons
            are far too faint and close to resolve.
          </p>
        ) : (
          <p className="text-[11px] leading-relaxed text-dim">
            {system} is below your horizon right now (
            {horizontal.altitude.toFixed(0)}°), not observable from {observer.label}{" "}
            until it rises. The parent&apos;s sky position is real for all four
            systems.
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────── small parts ───────────────────────────────

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
      <p className="mt-0.5 font-mono text-[12.5px] tracking-wide text-dim">
        {value}
      </p>
    </div>
  );
}

function NumField({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? value.toFixed(2);
  return (
    <label className="flex items-center gap-1 font-mono text-[10px] text-faint">
      {label}
      <input
        type="number"
        value={shown}
        min={min}
        max={max}
        step={0.01}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text === null) return;
          const v = parseFloat(text);
          setText(null);
          if (Number.isFinite(v)) onCommit(Math.min(max, Math.max(min, v)));
        }}
        className="w-16 rounded-md border border-line bg-black/30 px-1.5 py-1 text-[11px] text-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70"
      />
    </label>
  );
}
