"use client";

/**
 * Mars data credit footer (mirrors components/ui/AttributionFooter for Earth).
 *
 * NOTE(coordinator): placeholder credits — the Mars data agent's doc will have
 * the exact terrain/climatology provenance. Finalize the labels/links then.
 *   Terrain: NASA / USGS (MOLA / Viking color mosaic)
 *   Mars24 time: NASA GISS (Allison & McEwen 2000)
 *   Climatology: NASA PDS / Mars Climate Database
 */
export default function MarsAttributionFooter({
  usingFallbackTexture = false,
}: {
  /** notes that terrain is procedural until the real texture lands */
  usingFallbackTexture?: boolean;
}) {
  return (
    <footer className="pointer-events-auto absolute bottom-5 right-5 hidden animate-hud-in md:block">
      <p className="text-right font-mono text-[10px] tracking-wide text-faint">
        <a
          href="https://astrogeology.usgs.gov/search/results?pmi-target=mars"
          target="_blank"
          rel="noreferrer"
          className="transition-colors duration-200 hover:text-dim"
        >
          Terrain: NASA/USGS
        </a>
        {" · "}
        <a
          href="https://www.giss.nasa.gov/tools/mars24/"
          target="_blank"
          rel="noreferrer"
          className="transition-colors duration-200 hover:text-dim"
        >
          Mars24: NASA GISS
        </a>
        {" · "}
        <a
          href="https://pds.nasa.gov/"
          target="_blank"
          rel="noreferrer"
          className="transition-colors duration-200 hover:text-dim"
        >
          Climatology: NASA PDS
        </a>
        {usingFallbackTexture && (
          <>
            <br />
            <span className="text-faint/80">
              terrain shown procedurally · awaiting real texture
            </span>
          </>
        )}
      </p>
    </footer>
  );
}
