"use client";

import { useMemo } from "react";
import { planetGeocentric, type OtherPlanet } from "@/lib/other-moons";
import {
  PLANET_MAX_TILT_DEG,
  URANUS_LAST_EQUINOX,
  URANUS_NEXT_EQUINOX_APPROX,
  systemSkyGeometry,
} from "./otherMoonsUi";

/**
 * THE HEADLINE panel: the system geometry that makes each of these three worlds
 * honest and different. Everything is COMPUTED from lib/other-moons at the
 * displayed instant:
 *  - the system opening (sub-Earth latitude on the planet's equator, the analogue
 *    of Saturn's ring opening B) and whether we see the north or south pole side,
 *  - the pole position angle P (reconstructed from the exposed IAU pole + the
 *    planet's apparent RA/Dec, matching the lib's internal basis), and
 *  - the striking per-planet fact: Uranus tipped ~98 degrees with its opening
 *    swinging across the ~84-year season (edge-on 2007, next ~2049); Neptune's
 *    retrograde Triton and wildly eccentric Nereid; Mars's Phobos racing around
 *    below synchronous height in ~7.65 hours.
 *
 * The opening meter is scaled per planet (Uranus reaches 90 degrees; Mars and
 * Neptune stay modest). No em-dashes (project copy rule).
 */

interface OtherMoonsSystemPanelProps {
  planet: OtherPlanet;
  /** displayed instant (ms), throttled from the parent clock */
  displayedMs: number;
}

export default function OtherMoonsSystemPanel({
  planet,
  displayedMs,
}: OtherMoonsSystemPanelProps) {
  const date = useMemo(() => new Date(displayedMs), [displayedMs]);
  const geo = useMemo(() => planetGeocentric(planet, date), [planet, date]);
  const sky = useMemo(
    () => (geo ? systemSkyGeometry(planet, geo.raDeg, geo.decDeg, date) : null),
    [planet, geo, date]
  );

  const tilt = geo ? geo.systemTiltDeg : 0;
  const maxTilt = PLANET_MAX_TILT_DEG[planet];
  const openFrac = geo ? Math.min(1, Math.abs(tilt) / maxTilt) : 0;
  const face =
    Math.abs(tilt) < 0.5 ? "edge-on" : tilt > 0 ? "north pole" : "south pole";

  const title =
    planet === "Uranus"
      ? "A planet tipped on its side"
      : planet === "Neptune"
        ? "A backwards moon, a wild orbit"
        : "A moon faster than the planet spins";

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
          pole + planet dir
        </p>
      </div>

      {!geo || !sky ? (
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

            {/* opening meter, scaled per planet */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-solar/70"
                style={{ width: `${Math.round(openFrac * 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-faint">
              <span>0&deg; (edge-on, moon plane crosses our line of sight)</span>
              <span>~{maxTilt}&deg;</span>
            </div>
          </div>

          {/* pole angle P */}
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-line pt-3">
            <Stat
              label="Pole angle P"
              value={`${sky.positionAngleDeg.toFixed(1)}°`}
              title="Position angle of the planet's north pole on the sky (measured North through East). Orients the whole disk and moon ellipse."
            />
            <Stat
              label="Apparent size"
              value={`${geo.angularDiameterArcsec.toFixed(1)}″`}
              title="Apparent equatorial diameter of the planet's disk. Tiny from Earth, which is why disk events are rare."
            />
          </div>

          {/* the per-planet headline fact */}
          <PlanetFact planet={planet} tilt={tilt} face={face} />
        </>
      )}
    </div>
  );
}

function PlanetFact({
  planet,
  tilt,
  face,
}: {
  planet: OtherPlanet;
  tilt: number;
  face: string;
}) {
  if (planet === "Uranus") {
    const nearEdge = Math.abs(tilt) < 6;
    return (
      <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          Uranus is tipped ~98&deg;
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
          Uranus's pole lies almost in its orbit plane, so its five major moons
          circle a planet lying on its side. How open those near-circular orbits
          appear to us swings across Uranus's ~84-year season: they were edge-on at
          the <span className="text-ice">{URANUS_LAST_EQUINOX}</span> equinox and
          are edge-on again around{" "}
          <span className="text-ice">{URANUS_NEXT_EQUINOX_APPROX}</span>, opening
          toward one pole in between.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-dim">
          {nearEdge ? (
            <>
              Right now the system is close to edge-on (opening{" "}
              <span className="text-ice">{Math.abs(tilt).toFixed(1)}&deg;</span>),
              so the moons ride a nearly flat line across the disk.
            </>
          ) : (
            <>
              Right now the {face} is tipped{" "}
              <span className="text-ice">{Math.abs(tilt).toFixed(1)}&deg;</span>{" "}
              toward Earth, so the moons trace an open ellipse. Scrub decades to
              watch it swing.
            </>
          )}
        </p>
      </div>
    );
  }

  if (planet === "Neptune") {
    return (
      <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          Triton runs backwards; Nereid runs wild
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
          <span className="text-ice">Triton</span> orbits Neptune retrograde
          (backwards), the only large moon in the Solar System to do so, the mark of
          a captured Kuiper-belt object. Its apparent motion reverses versus the
          prograde moons, with no special handling, purely from its inclination.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-dim">
          <span className="text-ice">Nereid</span> is on a wildly eccentric orbit
          (e = 0.75): it swings from about 55 to 390 Neptune radii, so a single
          zoom cannot show it and the inner moons together. When it falls outside
          the framed view its direction and distance are marked at the edge.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
        Phobos races below synchronous height
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
        <span className="text-ice">Phobos</span> laps Mars in about{" "}
        <span className="text-ice">7.65 hours</span>, faster than Mars rotates
        (~24.6 h). Because it orbits below synchronous height, it rises in the{" "}
        <span className="text-ice">west</span> and sets in the east, and tides are
        slowly dragging it inward. Play at 10 min/s to watch it sweep.
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-dim">
        <span className="text-ice">Deimos</span>, farther out, ambles around in
        about 1.26 days, the other way round in appearance.
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
