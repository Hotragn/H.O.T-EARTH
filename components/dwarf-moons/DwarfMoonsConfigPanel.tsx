"use client";

import { useMemo } from "react";
import { dwarfMoonsState, type DwarfSystem } from "@/lib/dwarf-moons";
import {
  MOON_COLORS,
  moonName,
  moonTierBadge,
} from "./dwarfMoonsUi";

interface DwarfMoonsConfigPanelProps {
  system: DwarfSystem;
  /** displayed instant (ms), throttled from the parent clock */
  displayedMs: number;
}

/**
 * The configuration view (the twin of the Other Moons config panel, but stripped
 * of any events clock). It leads with the honest framing the brief demands: these
 * systems are UNRESOLVABLE from Earth, so there are NO observable transit / shadow
 * / occultation events, and this tab never sells one. The primary content is the
 * LIVE CONFIGURATION: each moon&apos;s current elongation in central-body radii and
 * in arcseconds, whether it is over / in front of / behind the central disk, and
 * its data-tier badge (real / illustrative / uncertain). Any geometric alignment
 * from the physics lib is shown but explicitly labeled geometric-only (and
 * illustrative for the non-Pluto systems). Everything is COMPUTED from
 * lib/dwarf-moons and guarded against null. No em-dashes.
 */
export default function DwarfMoonsConfigPanel({
  system,
  displayedMs,
}: DwarfMoonsConfigPanelProps) {
  const state = useMemo(
    () => dwarfMoonsState(system, new Date(displayedMs)),
    [system, displayedMs]
  );
  const arcsecPerReq = state ? state.geocentric.angularDiameterArcsec / 2 : 0;

  return (
    <section
      aria-label={`${system} moon configuration`}
      className="hud-scroll pointer-events-auto absolute right-3 top-32 z-10 max-h-[calc(100dvh-13rem)] w-[330px] overflow-y-auto animate-hud-in sm:right-5 sm:top-36"
    >
      <div className="hud-panel rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-medium text-ice">
            Configuration view
          </h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-faint">
            not an events tab
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-dim">
          These systems are{" "}
          <span className="text-ice">unresolvable from Earth</span>
          {state
            ? ` (${system}'s disk ${state.geocentric.angularDiameterArcsec.toFixed(3)}″ now)`
            : ""}
          , so there are no observable transits, shadows or occultations. What is
          real is the orbital <span className="text-ice">configuration</span>. This
          panel shows that, honestly.
        </p>

        {/* live configuration */}
        <div className="mt-3 border-t border-line pt-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            Live configuration
          </p>
          {!state ? (
            <p className="mt-2 text-[11px] text-faint">
              Configuration unavailable for this instant.
            </p>
          ) : (
            <>
              <ul className="mt-2 space-y-2">
                {state.positions.map((p) => {
                  const elong = Math.hypot(p.x, p.y);
                  const side = p.x >= 0 ? "W" : "E";
                  const overDisk = elong < 1;
                  const badge = moonTierBadge(p);
                  const place = p.inTransit
                    ? "transit"
                    : p.inOccultation
                      ? "occulted"
                      : p.frontOfDisk
                        ? "in front"
                        : "behind";
                  return (
                    <li key={p.moon} className="text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: MOON_COLORS[p.moon] }}
                        />
                        <span className="text-ice">{moonName(p.moon)}</span>
                        <span
                          className={`ml-auto rounded-full border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${badge.className}`}
                          title={badge.title}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 pl-3.5 font-mono text-[10px] text-dim">
                        <span>
                          {elong.toFixed(1)} R {side}
                        </span>
                        <span className="text-faint">·</span>
                        <span>{(elong * arcsecPerReq).toFixed(3)}″ off centre</span>
                        <span className="text-faint">·</span>
                        <span className="text-faint">{place}</span>
                        {overDisk && (
                          <span className="text-solar/80">· over disk</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[10px] leading-relaxed text-faint">
                The disk itself is only{" "}
                <span className="text-dim">
                  {state.geocentric.angularDiameterArcsec.toFixed(3)}″
                </span>{" "}
                across (1 R ={" "}
                <span className="text-dim">{arcsecPerReq.toFixed(3)}″</span>). A moon
                is only over the disk when its elongation is under 1 R.
              </p>
            </>
          )}
        </div>

        {/* geometric alignments (usually empty by design) */}
        <div className="mt-3 border-t border-line pt-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            Geometric alignments (not observable)
          </p>
          {!state || state.current.length === 0 ? (
            <p className="mt-2 rounded-xl border border-line bg-white/[0.02] p-3 text-[11px] leading-relaxed text-dim">
              None right now. For these unresolvable systems that is expected: the
              geometric transit / shadow / occultation flags are almost always off,
              and even when a line-of-sight alignment occurs it is not an observable
              event. This is the physics, not a bug.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {state.current.map((e) => (
                <li
                  key={`${e.moon}-${e.type}`}
                  className="flex items-center gap-2 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5 text-[11px]"
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: MOON_COLORS[e.moon] }}
                  />
                  <span className="text-ice">{moonName(e.moon)}</span>
                  <span className="ml-auto font-mono text-[9px] text-faint">
                    {e.type.replace("_", " ")}
                    {e.phaseReal
                      ? " · geometric only"
                      : " · illustrative"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* honesty: two tiers + the historical exception + cross-check */}
        <p className="mt-3 border-t border-line pt-3 text-[10px] leading-relaxed text-faint">
          Two tiers, never blurred:{" "}
          <span className="text-faint/90">Pluto = real positions</span>;
          Eris/Haumea/Makemake = orbit real, position illustrative; MK2 additionally
          poorly constrained. The one historical exception was Pluto-Charon: their
          mutual events were observable in 1985-1990 when the plane was edge-on, next
          around 2103. For anything critical, cross-check{" "}
          <a
            href="https://ssd.jpl.nasa.gov/horizons/"
            target="_blank"
            rel="noreferrer"
            className="text-dim transition-colors duration-200 hover:text-ice"
          >
            JPL Horizons
          </a>
          .
        </p>
      </div>
    </section>
  );
}
