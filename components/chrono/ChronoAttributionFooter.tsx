"use client";

/**
 * Virtual Earth data credit footer (mirrors the Earth/Mars attribution
 * footers). Honest provenance for the time-machine layer:
 *   Cities over time: Reba, Reitsma & Seto (2016), CC-BY 4.0 — real, shipped
 *   World population / climate: built-in historical estimates (coarse anchors)
 *   Dated events: curated from the historical record
 *   Precession: computed from first principles (IAU 2006), lib/precession.ts
 *   Base texture: NASA Blue Marble (shared Earth pipeline)
 */
export default function ChronoAttributionFooter({
  usingFallbackData = false,
}: {
  usingFallbackData?: boolean;
}) {
  return (
    <footer className="pointer-events-auto absolute bottom-24 right-5 hidden animate-hud-in md:block lg:bottom-5">
      <p className="text-right font-mono text-[10px] tracking-wide text-faint">
        <a
          href="https://doi.org/10.1038/sdata.2016.34"
          target="_blank"
          rel="noreferrer"
          className="transition-colors duration-200 hover:text-dim"
        >
          Cities: Reba et al. 2016 (CC-BY)
        </a>
        {" · "}
        <a
          href="https://en.wikipedia.org/wiki/Axial_precession"
          target="_blank"
          rel="noreferrer"
          className="transition-colors duration-200 hover:text-dim"
        >
          Sky: precession (IAU 2006)
        </a>
        {usingFallbackData && (
          <>
            <br />
            <span className="text-faint/80">
              population, events &amp; climate are built-in historical estimates
            </span>
          </>
        )}
      </p>
    </footer>
  );
}
