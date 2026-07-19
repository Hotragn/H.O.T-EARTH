"use client";

import { useMemo } from "react";
import {
  DWARF_MOONS,
  DWARF_SYSTEMS,
  PLUTO_BARYCENTER_FRACTION,
  dwarfGeocentric,
  type DwarfSystem,
} from "@/lib/dwarf-moons";
import {
  PLUTO_LAST_EDGE_ON,
  PLUTO_NEXT_EDGE_ON_APPROX,
  SYSTEM_MAX_TILT_DEG,
  systemTierBadge,
} from "./dwarfMoonsUi";

/**
 * THE HEADLINE panel: the striking, real geometry of each system, plus the
 * data-tier badge that must never be blurred. Everything is COMPUTED from
 * lib/dwarf-moons at the displayed instant:
 *  - the system opening (sub-Earth latitude on the moon-system plane), REAL for
 *    Pluto (its IAU pole) and honestly flagged ILLUSTRATIVE for the others,
 *  - the per-system headline: Pluto is a true BINARY (its barycenter sits OUTSIDE
 *    Pluto), Eris's Dysnomia rides a steeply inclined tidally-locked orbit, Haumea
 *    is the fastest-spinning large body with the first TNO ring, Makemake's MK2 is
 *    a dark, poorly-constrained moon.
 *
 * The tier badge (Real positions / Orbit real, position illustrative / Orbit
 * poorly constrained) sits at the very top so it is unmissable. No em-dashes.
 */

interface DwarfMoonsSystemPanelProps {
  system: DwarfSystem;
  /** displayed instant (ms), throttled from the parent clock */
  displayedMs: number;
}

export default function DwarfMoonsSystemPanel({
  system,
  displayedMs,
}: DwarfMoonsSystemPanelProps) {
  const date = useMemo(() => new Date(displayedMs), [displayedMs]);
  const geo = useMemo(() => dwarfGeocentric(system, date), [system, date]);
  const badge = systemTierBadge(system);

  const tilt = geo ? geo.systemTiltDeg : 0;
  const tiltReal = geo ? geo.tiltReal : false;
  const maxTilt = SYSTEM_MAX_TILT_DEG[system];
  const openFrac = geo ? Math.min(1, Math.abs(tilt) / maxTilt) : 0;
  const face =
    Math.abs(tilt) < 1 ? "edge-on" : tilt > 0 ? "north" : "south";

  const title =
    system === "Pluto"
      ? "A true binary in empty space"
      : system === "Eris"
        ? "A locked moon on a steep orbit"
        : system === "Haumea"
          ? "A spinning egg with a ring"
          : "A dark, barely-charted moon";

  return (
    <div className="hud-panel rounded-2xl border border-solar/30 bg-solar/[0.04] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
            System geometry
          </p>
          <h2 className="mt-1 font-display text-base font-medium leading-tight text-ice">
            {title}
          </h2>
        </div>
        <p className="mt-0.5 shrink-0 text-right font-mono text-[9px] leading-snug text-faint">
          Computed
          <br />
          published elements
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

      {!geo ? (
        <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
          System geometry unavailable for this instant.
        </p>
      ) : (
        <>
          {/* the system opening, big */}
          <div className="mt-3 border-t border-line pt-3">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                System opening (toward Earth)
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-solar/90">
                {face === "edge-on" ? "edge-on" : `${face} side`}
              </span>
            </div>
            <p className="mt-1 font-mono text-2xl leading-none text-ice">
              {tilt >= 0 ? "+" : ""}
              {tilt.toFixed(2)}
              <span className="text-lg text-dim">&deg;</span>
            </p>

            {/* opening meter */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-solar/70"
                style={{ width: `${Math.round(openFrac * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-faint">
              {tiltReal ? (
                <>
                  Real: sub-Earth latitude on the Pluto-Charon plane, from Pluto&apos;s
                  IAU pole.
                </>
              ) : (
                <>
                  <span className="text-solar/80">Illustrative:</span> the reference
                  plane is an adopted convention (no cited node for this system), so
                  this opening is not a real measurement.
                </>
              )}
            </p>
          </div>

          {/* apparent size (the unresolvable headline number) */}
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-line pt-3">
            <Stat
              label="Distance"
              value={`${geo.distanceAU.toFixed(2)} AU`}
              title={`Earth-${system} distance for the displayed instant (computed; real, from lib/dwarf-planets).`}
            />
            <Stat
              label="Apparent size"
              value={`${geo.angularDiameterArcsec.toFixed(3)}″`}
              title="Apparent diameter of the central body. About 0.1 arcsec for Pluto and smaller for the others: unresolvable from Earth. This is a configuration view, not an events tab."
            />
          </div>

          {/* the per-system headline fact */}
          <SystemFact system={system} tilt={tilt} />
        </>
      )}
    </div>
  );
}

function SystemFact({ system, tilt }: { system: DwarfSystem; tilt: number }) {
  if (system === "Pluto") {
    const baryKm = Math.round(
      PLUTO_BARYCENTER_FRACTION * DWARF_MOONS.Charon.semiMajorAxisKm
    );
    const plutoR = Math.round(DWARF_SYSTEMS.Pluto.centralRadiusKm);
    const nearEdge = Math.abs(tilt) < 2;
    return (
      <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          The barycenter is outside Pluto
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
          Charon is ~12.2% of Pluto&apos;s mass, so the Pluto-Charon barycenter sits
          about <span className="text-ice">{baryKm.toLocaleString()} km</span> from
          Pluto&apos;s centre, <span className="text-ice">outside</span> Pluto&apos;s{" "}
          <span className="text-ice">{plutoR.toLocaleString()} km</span> radius. Both
          bodies orbit a point in empty space: a genuine{" "}
          <span className="text-ice">binary</span>, drawn here with its real wobble
          (marked barycenter at centre). Four small moons (Styx, Nix, Kerberos,
          Hydra) circle that same point in near-resonance; Nix and Hydra are chaotic
          rotators. Pluto and Charon are mutually tidally locked. Real positions from
          New Horizons-era elements (2015).
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-dim">
          {nearEdge ? (
            <>
              Right now the plane is near <span className="text-ice">edge-on</span> (
              {Math.abs(tilt).toFixed(1)}&deg;). Edge-on is the one season the
              Pluto-Charon mutual events were observable from Earth (
              <span className="text-ice">{PLUTO_LAST_EDGE_ON}</span>); the next is
              around <span className="text-ice">{PLUTO_NEXT_EDGE_ON_APPROX}</span>.
            </>
          ) : (
            <>
              The plane was edge-on in{" "}
              <span className="text-ice">{PLUTO_LAST_EDGE_ON}</span> (when the mutual
              events were briefly observable) and is edge-on again around{" "}
              <span className="text-ice">{PLUTO_NEXT_EDGE_ON_APPROX}</span>. Scrub
              decades to watch the opening swing.
            </>
          )}
        </p>
      </div>
    );
  }

  if (system === "Eris") {
    return (
      <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          Dysnomia: locked, steeply inclined
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
          <span className="text-ice">Eris</span>, the most massive dwarf planet, is
          orbited by <span className="text-ice">Dysnomia</span> on a steeply inclined
          (~78&deg;), near-circular, ~15.8-day orbit, and the two are mutually tidally
          locked (Holler et al. 2021). The orbit&apos;s size, shape and period are
          real and cited; the along-orbit position drawn here is{" "}
          <span className="text-solar/80">illustrative</span>. Eris is currently far
          out near <span className="text-ice">~96 AU</span>, the reason its disk is
          effectively unresolvable.
        </p>
      </div>
    );
  }

  if (system === "Haumea") {
    return (
      <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          Fastest spin, first TNO ring
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
          <span className="text-ice">Haumea</span> spins once every{" "}
          <span className="text-ice">3.9 hours</span>, the fastest of any large body
          in the Solar System, which has stretched it into a triaxial egg
          (~1160&times;852&times;513 km). It carries the{" "}
          <span className="text-ice">first ring found around a trans-Neptunian
          object</span> (radius 2285 km; Ortiz et al. 2017) and two moons, Hiʻiaka
          and Namaka. The egg shape and ring drawn here are{" "}
          <span className="text-solar/80">illustrative geometry</span> from the
          measured dimensions; the moon orbits are real, their phase illustrative.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
        MK2: dark and poorly charted
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
        <span className="text-ice">Makemake</span>&apos;s only known moon,{" "}
        <span className="text-ice">MK2</span> (S/2015 (136472) 1), is small, dark and
        was seen nearly edge-on in just a few detections, so its{" "}
        <span className="text-[#e0a877]">orbit itself is poorly constrained</span>{" "}
        (Parker et al. 2016). Its ~22,250 km, ~18-day orbit carries a large
        uncertainty; the position drawn here is illustrative and flagged uncertain
        throughout.
      </p>
    </div>
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
      <p className="mt-0.5 font-mono text-[12.5px] tracking-wide text-dim">
        {value}
      </p>
    </div>
  );
}
