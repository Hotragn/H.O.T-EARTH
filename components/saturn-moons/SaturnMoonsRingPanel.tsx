"use client";

import { useMemo } from "react";
import { saturnRingGeometry } from "@/lib/saturn-moons";
import { LAST_EQUINOX, NEXT_EQUINOX_APPROX, ringFace } from "./saturnUi";

/**
 * THE HEADLINE panel: the ring tilt and the seasonality that make Saturn honest
 * and different from Jupiter. Everything is COMPUTED from lib/saturn-moons
 * (Meeus, Astronomical Algorithms, Ch. 45) at the displayed instant:
 *  - the ring opening B (deg) and whether we see the north or south face,
 *  - the Sun's opening B' (the switch for whether shadows land on the disk),
 *  - the apparent ring axes (major/minor arcsec) and the pole position angle P,
 *  - and the plain-language seasonality: moon disk-transits and shadow-transits
 *    cluster only in the season around each ~15-year ring-plane crossing. The
 *    last was 2025-05-06; the rings are opening again toward the next ~2038-2039.
 *    That is WHY the events list is usually short right now.
 *
 * Saturn's obliquity caps |B| near 26-27 deg at solstice, so the opening meter is
 * scaled to 27 deg. No em-dashes (project copy rule).
 */

const MAX_TILT_DEG = 27;

interface SaturnMoonsRingPanelProps {
  /** displayed instant (ms), throttled from the parent clock */
  displayedMs: number;
}

export default function SaturnMoonsRingPanel({
  displayedMs,
}: SaturnMoonsRingPanelProps) {
  const ring = useMemo(
    () => saturnRingGeometry(new Date(displayedMs)),
    [displayedMs]
  );

  const face = ring ? ringFace(ring.ringTiltBDeg) : "edge-on";
  const openFrac = ring
    ? Math.min(1, Math.abs(ring.ringTiltBDeg) / MAX_TILT_DEG)
    : 0;
  // Near a ring-plane crossing both B and B' are small: the event season.
  const nearCrossing = ring ? Math.abs(ring.ringTiltBDeg) < 3 : false;

  return (
    <div className="hud-panel rounded-2xl border border-solar/30 bg-solar/[0.04] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
            Ring tilt &amp; season
          </p>
          <h2 className="mt-1 font-display text-base font-medium leading-tight text-ice">
            The rings gate the events
          </h2>
        </div>
        <p className="mt-0.5 shrink-0 text-right font-mono text-[9px] leading-snug text-faint">
          Computed
          <br />
          Meeus Ch. 45
        </p>
      </div>

      {!ring ? (
        <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
          Ring geometry unavailable for this instant.
        </p>
      ) : (
        <>
          {/* the opening B, big */}
          <div className="mt-3 border-t border-line pt-3">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                Ring opening B (toward Earth)
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-solar/90">
                {face === "edge-on" ? "edge-on" : `${face} face`}
              </span>
            </div>
            <p className="mt-1 font-mono text-2xl leading-none text-ice">
              {ring.ringTiltBDeg >= 0 ? "+" : ""}
              {ring.ringTiltBDeg.toFixed(2)}
              <span className="text-lg text-dim">°</span>
            </p>

            {/* opening meter, scaled to Saturn's ~27 deg solstice maximum */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-solar/70"
                style={{ width: `${Math.round(openFrac * 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-faint">
              <span>0° (edge-on, ring-plane crossing)</span>
              <span>~27° (solstice)</span>
            </div>
          </div>

          {/* B', axes, P */}
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-line pt-3">
            <Stat
              label="Sun opening B′"
              value={`${ring.sunTiltBDeg >= 0 ? "+" : ""}${ring.sunTiltBDeg.toFixed(2)}°`}
              title="Saturnicentric latitude of the Sun. When B′ is near 0 the Sun is in the ring plane, so moons and rings cast shadows across the disk instead of off into space."
            />
            <Stat
              label="Pole angle P"
              value={`${ring.positionAngleDeg.toFixed(1)}°`}
              title="Position angle of Saturn's north pole on the sky (measured North through East). Orients the whole disk-plus-ring silhouette."
            />
            <Stat
              label="Ring major axis"
              value={`${ring.ringMajorAxisArcsec.toFixed(1)}″`}
              title="Apparent outer-edge major axis of the rings (arcsec)."
            />
            <Stat
              label="Ring minor axis"
              value={`${ring.ringMinorAxisArcsec.toFixed(1)}″`}
              title="Apparent outer-edge minor axis = major × sin|B|. Zero at edge-on."
            />
          </div>

          {/* the seasonality, stated plainly */}
          <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
              Why events cluster (seasonality)
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
              Saturn&apos;s moons orbit in the ring plane, so they only cross in
              front of the disk (transit) or cast a shadow on it (shadow transit)
              during the season around each ring-plane crossing, when B and B′ pass
              through zero. That happens only about every 15 years. The last
              crossing was{" "}
              <span className="text-ice">{LAST_EQUINOX}</span>; the rings are
              opening again toward the next, around{" "}
              <span className="text-ice">{NEXT_EQUINOX_APPROX}</span>.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-dim">
              {nearCrossing ? (
                <>
                  Right now B is small, so the system is near its event season:
                  disk transits and shadow events are possible.
                </>
              ) : (
                <>
                  Right now the rings are opened by{" "}
                  <span className="text-ice">
                    {Math.abs(ring.ringTiltBDeg).toFixed(1)}°
                  </span>
                  , so most moons ride clear of the disk. This is why the events
                  list is usually short away from a crossing, not a bug.
                </>
              )}
            </p>
          </div>
        </>
      )}
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
