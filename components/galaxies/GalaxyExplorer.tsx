"use client";

import { useMemo } from "react";
import {
  getGalaxy,
  recessionVelocityKmS,
  redshiftToVelocityKmS,
  type GalaxyId,
} from "@/lib/galaxies";
import {
  fmtDistanceMly,
  fmtLookback,
  fmtRedshift,
  fmtVelocity,
  GALAXY_IMAGE,
  GALAXY_LABEL,
  LADDER_DISTANCE_LABEL,
} from "./galaxiesUi";
import TuningFork from "./TuningFork";

/**
 * Galaxy Explorer: the ten real catalog galaxies behind a selector. For each,
 * the real ESA/Hubble image (with verbatim CC BY 4.0 credit) when one is
 * shipped, else a clearly-labelled placeholder that is explicitly NOT that
 * galaxy; the Hubble tuning-fork class; distance (Mly + light-travel framing);
 * redshift and recession velocity via lib/galaxies (M31/M33 flagged blueshifted
 * and approaching; the Milky Way has no heliocentric distance because we are
 * inside it); diameter; star count; and the cited note. Null-safe throughout.
 */

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="border-t border-line/60 py-1.5 first:border-t-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[12px] text-ice">{value}</div>
      {note && <div className="mt-0.5 text-[10px] leading-snug text-faint">{note}</div>}
    </div>
  );
}

export default function GalaxyExplorer({
  id,
  ids,
  onChange,
}: {
  id: GalaxyId;
  ids: readonly GalaxyId[];
  onChange: (id: GalaxyId) => void;
}) {
  const g = useMemo(() => getGalaxy(id), [id]);

  // Recession velocity: prefer the redshift-derived value; else from distance.
  const velocity = useMemo(() => {
    if (!g) return null;
    if (typeof g.redshift === "number") return redshiftToVelocityKmS(g.redshift);
    if (typeof g.distanceMpc === "number") return recessionVelocityKmS(g.distanceMpc);
    return null;
  }, [g]);

  const img = GALAXY_IMAGE[id];

  return (
    <div className="flex flex-col gap-3">
      {/* selector */}
      <div
        role="tablist"
        aria-label="Choose a galaxy"
        className="hud-panel flex flex-wrap items-center gap-1 rounded-2xl p-1"
      >
        {ids.map((oid) => {
          const active = oid === id;
          return (
            <button
              key={oid}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(oid)}
              className={`cursor-pointer rounded-xl px-2.5 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
                active ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
              }`}
            >
              {GALAXY_LABEL[oid]}
            </button>
          );
        })}
      </div>

      {!g ? (
        <div className="hud-panel rounded-2xl p-4 font-mono text-[11px] text-dim">
          This galaxy could not be resolved from the catalog.
        </div>
      ) : (
        <>
          {/* image or honest placeholder */}
          <div className="hud-panel overflow-hidden rounded-2xl">
            {img ? (
              <>
                <div className="overflow-hidden border-b border-line/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={`ESA/Hubble image of ${g.name}`}
                    width={img.width}
                    height={img.height}
                    loading="lazy"
                    className="block h-auto w-full"
                  />
                </div>
                <div className="p-3">
                  <p className="text-[10px] leading-snug text-faint">{img.label}</p>
                  <p className="mt-1.5 text-[10px] leading-snug text-faint">
                    Credit: {img.credit} {img.license}.{" "}
                    <a
                      href={img.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-200/80 transition-colors duration-200 hover:text-amber-100"
                    >
                      source
                    </a>
                    .
                  </p>
                </div>
              </>
            ) : (
              <div className="p-4">
                <div
                  className="flex h-28 items-center justify-center rounded-xl border border-line/60 bg-white/[0.02] font-mono text-[10px] uppercase tracking-[0.2em] text-faint"
                  aria-hidden
                >
                  no shipped image
                </div>
                <p className="mt-2 text-[10px] leading-snug text-faint">
                  No verified, freely-licensed close-up image of {g.name} is
                  shipped in this phase. Nothing here is a picture of it. See the
                  Deep Field view for a real JWST image of thousands of distant
                  galaxies.
                </p>
              </div>
            )}
          </div>

          {/* facts */}
          <div className="hud-panel rounded-2xl p-4">
            <h2 className="font-display text-lg font-medium tracking-tight text-ice">
              {g.name}
            </h2>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              {g.hubbleType}
            </p>

            <div className="mt-2">
              <Row
                label="Distance"
                value={fmtDistanceMly(g.distanceMly)}
                note={
                  g.distanceMly === null
                    ? "We are inside the Milky Way, so it has no heliocentric distance."
                    : fmtLookback(g.distanceMly)
                }
              />
              <Row
                label="Redshift"
                value={fmtRedshift(g.redshift)}
                note={
                  typeof g.redshift === "number" && g.redshift < 0
                    ? "Blueshifted: a bound Local Group member, approaching, not receding."
                    : undefined
                }
              />
              <Row
                label="Recession velocity"
                value={fmtVelocity(velocity)}
                note="Computed by lib/galaxies (low-z Hubble law / cz)."
              />
              <Row label="Diameter" value={`~${g.diameterKly.toLocaleString()} thousand ly across`} />
              <Row label="Stars" value={g.starCount} />
            </div>

            <p className="mt-3 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
              {g.note}
            </p>
            <p className="mt-2 text-[10px] leading-snug text-faint">Source: {g.source}</p>
            <p className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.04] px-2.5 py-1.5 text-[10px] leading-snug text-amber-200/80">
              {LADDER_DISTANCE_LABEL}
            </p>
          </div>

          <TuningFork hubbleType={g.hubbleType} />
        </>
      )}
    </div>
  );
}
