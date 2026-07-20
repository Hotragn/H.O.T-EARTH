"use client";

import { useMemo } from "react";
import {
  DART_PERIOD_CHANGE_MINUTES,
  DIDYMOS_PERIOD_POST_DART_HOURS,
  DIDYMOS_PERIOD_PRE_DART_HOURS,
  asteroidMoonsState,
  type AsteroidSystem,
} from "@/lib/asteroid-moons";
import { DART_IMPACT_MS } from "./AsteroidMoonsTimeControl";
import {
  POPULATION_LABEL,
  SYSTEM_HEADLINE,
  SYSTEM_TITLE,
  formatDiameter,
  formatPeriod,
  formatSeparation,
  systemTierBadge,
} from "./asteroidMoonsUi";

/**
 * THE HEADLINE panel: the striking, real geometry of each system, with the data-tier
 * badge that must never be blurred, and, for Didymos, the DART showcase. Everything
 * is COMPUTED from lib/asteroid-moons at the displayed instant:
 *  - the per-system headline (Didymos is the DART target; Ida hosts the first
 *    asteroid moon; Sylvia the first triple; Antiope/Patroclus near-equal doubles);
 *  - for Didymos, the LIVE mutual period that steps from 11.921 h to 11.372 h as you
 *    scrub across the 2022-09-26 DART impact, the first time humanity deliberately
 *    changed a celestial body's orbit;
 *  - the real, cited sizes, separations and periods.
 *
 * The tier badge ("orbit real, orientation & phase schematic") sits at the very top
 * so it is unmissable. No em-dashes.
 */

interface AsteroidMoonsSystemPanelProps {
  system: AsteroidSystem;
  /** displayed instant (ms), throttled from the parent clock. */
  displayedMs: number;
}

export default function AsteroidMoonsSystemPanel({
  system,
  displayedMs,
}: AsteroidMoonsSystemPanelProps) {
  const date = useMemo(() => new Date(displayedMs), [displayedMs]);
  const state = useMemo(() => asteroidMoonsState(system, date), [system, date]);
  const badge = systemTierBadge();

  return (
    <div className="hud-panel rounded-2xl border border-solar/30 bg-solar/[0.04] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
            System geometry
          </p>
          <h2 className="mt-1 font-display text-base font-medium leading-tight text-ice">
            {SYSTEM_TITLE[system]}
          </h2>
        </div>
        <p className="mt-0.5 shrink-0 text-right font-mono text-[9px] leading-snug text-faint">
          Schematic
          <br />
          mutual orbit
        </p>
      </div>

      {/* the data-tier badge, unmissable at the top */}
      <div
        className={`mt-3 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${badge.className}`}
        title={badge.title}
      >
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em]">
          {badge.label}
        </span>
      </div>

      {!state ? (
        <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
          System geometry unavailable for this instant.
        </p>
      ) : system === "Didymos" ? (
        <DartShowcase displayedMs={displayedMs} livePeriodHours={state.didymosPeriodHours} />
      ) : (
        <HeadlineFact system={system} />
      )}

      {/* the real, cited facts */}
      {state && <SystemFacts system={system} state={state} />}
    </div>
  );
}

/**
 * The DART showcase (Didymos): the real, measured, human-caused orbit change. The
 * LIVE period reflects the displayed instant, so scrubbing across 2022-09-26 flips
 * 11.921 h to 11.372 h in front of you. Mentions DART (2022) and ESA Hera (2026).
 */
function DartShowcase({
  displayedMs,
  livePeriodHours,
}: {
  displayedMs: number;
  livePeriodHours: number | null;
}) {
  const afterImpact = displayedMs >= DART_IMPACT_MS;
  const period = livePeriodHours ?? DIDYMOS_PERIOD_PRE_DART_HOURS;
  return (
    <div className="mt-3 rounded-xl border border-solar/30 bg-solar/[0.05] p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-solar/90">
        DART: the orbit humanity moved
      </p>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
          Mutual period now
        </span>
        <span
          className={`font-mono text-[9px] uppercase tracking-[0.14em] ${
            afterImpact ? "text-solar/90" : "text-faint"
          }`}
        >
          {afterImpact ? "after impact" : "before impact"}
        </span>
      </div>
      <p className="mt-1 font-mono text-2xl leading-none text-ice">
        {period.toFixed(3)}
        <span className="ml-1 text-base text-dim">h</span>
      </p>

      <div className="mt-2 flex items-center gap-2 font-mono text-[10px] text-dim">
        <span className={afterImpact ? "text-faint line-through" : "text-ice"}>
          {DIDYMOS_PERIOD_PRE_DART_HOURS.toFixed(3)} h
        </span>
        <span aria-hidden className="text-faint">
          {"->"}
        </span>
        <span className={afterImpact ? "text-ice" : "text-faint"}>
          {DIDYMOS_PERIOD_POST_DART_HOURS.toFixed(3)} h
        </span>
        <span className="ml-auto text-solar/90">
          -{DART_PERIOD_CHANGE_MINUTES.toFixed(1)} min
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-dim">
        On <span className="text-ice">2022-09-26</span> NASA&apos;s DART spacecraft
        struck Dimorphos and shortened its orbit around Didymos by about{" "}
        <span className="text-ice">32 minutes</span>: the{" "}
        <span className="text-ice">
          first time humanity deliberately changed a celestial body&apos;s orbit
        </span>
        . This step is real and measured (Thomas et al. 2023). Scrub across the DART
        landmark to watch the period flip. ESA&apos;s{" "}
        <span className="text-ice">Hera</span> mission surveys the aftermath from 2026.
      </p>
    </div>
  );
}

/** The per-system headline fact card (non-Didymos systems). */
function HeadlineFact({ system }: { system: AsteroidSystem }) {
  return (
    <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
        Why this system matters
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
        {SYSTEM_HEADLINE[system]}
      </p>
    </div>
  );
}

/** The real, cited facts block: primary, moon(s), population, discovery, mission. */
function SystemFacts({
  system,
  state,
}: {
  system: AsteroidSystem;
  state: NonNullable<ReturnType<typeof asteroidMoonsState>>;
}) {
  const data = state.systemData;
  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-line pt-3">
        <Stat
          label="Population"
          value={POPULATION_LABEL[data.population] ?? data.population}
          title="The dynamical population of the primary."
        />
        <Stat
          label="Discovered"
          value={`${data.discoveryYear}`}
          title="The year the satellite / system was discovered."
        />
        <Stat
          label="Primary"
          value={formatDiameter(data.primaryDiameterKm)}
          title={data.shapeNote}
        />
        <Stat
          label={state.isTriple ? "Moons" : state.nearEqualDouble ? "Secondary" : "Moon"}
          value={
            state.nearEqualDouble
              ? "near-equal"
              : `${state.moons.length} (${state.moons.map((m) => formatDiameter(m.diameterKm)).join(", ")})`
          }
          title={
            state.nearEqualDouble
              ? "A near-equal double: the two components have comparable size and orbit a common barycenter."
              : "Moon diameters (cited)."
          }
        />
      </div>

      {/* per-moon separations + periods */}
      <div className="mt-3 border-t border-line pt-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          Mutual orbit{state.moons.length > 1 ? "s" : ""} (real, to scale)
        </p>
        <ul className="mt-2 space-y-1.5">
          {state.moons.map((m) => {
            const livePeriod =
              m.name === "Dimorphos" && state.didymosPeriodHours !== null
                ? state.didymosPeriodHours
                : m.periodHours;
            return (
              <li
                key={m.name}
                className="flex items-center gap-2 font-mono text-[10.5px]"
              >
                <span className="text-ice">{m.displayName}</span>
                <span className="ml-auto text-dim">
                  {formatSeparation(m.semiMajorAxisKm)}
                </span>
                <span className="text-faint">·</span>
                <span className="w-[92px] shrink-0 text-right text-dim">
                  {formatPeriod(livePeriod)}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[10px] leading-relaxed text-faint">
          Separation is the mutual-orbit semi-major axis; period is the mutual orbital
          period. Both are real and cited ({data.source}).
        </p>
      </div>

      {/* mission + shape honesty */}
      <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
        <p className="text-[11px] leading-relaxed text-dim">
          <span className="text-ice">Shape:</span> {data.shapeNote}.{" "}
          {data.mission && (
            <>
              <span className="text-ice">Mission:</span> {data.mission}.{" "}
            </>
          )}
          {system === "Ida"
            ? "Ida carries a reused real Galileo photo; Dactyl and its poorly constrained orbit are illustrative."
            : system === "Didymos"
              ? "Didymos carries a reused real DART photo; Dimorphos is illustrative."
              : "No surface map exists, so the bodies are labeled illustrative shapes."}
        </p>
      </div>
    </>
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
