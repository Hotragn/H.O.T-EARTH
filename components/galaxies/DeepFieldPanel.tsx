"use client";

import { DEEP_FIELD_IMAGE } from "./galaxiesUi";

/**
 * Deep Field panel: the real JWST SMACS 0723 first deep field image (ESA/Webb,
 * CC BY 4.0), with the honest note that nearly every dot is an entire galaxy,
 * the light is billions of years old (lookback), and the arcs are real
 * gravitational lensing (tying back to the Black Holes tab). The verbatim credit
 * is shown; the source link is kept live per the CC BY 4.0 terms.
 */
export default function DeepFieldPanel() {
  const img = DEEP_FIELD_IMAGE;
  return (
    <div className="flex flex-col gap-3">
      <div className="hud-panel overflow-hidden rounded-2xl">
        <div className="overflow-hidden border-b border-line/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.src}
            alt="JWST first deep field, galaxy cluster SMACS 0723"
            width={img.width}
            height={img.height}
            loading="lazy"
            className="block h-auto w-full"
          />
        </div>
        <div className="p-4">
          <h2 className="font-display text-lg font-medium tracking-tight text-ice">
            The first JWST deep field
          </h2>
          <p className="mt-1 text-[11px] leading-snug text-dim">
            {img.label} Nearly every point and smudge here is an entire galaxy of
            billions of stars, not a star. The light has travelled for billions of
            years, so we see these galaxies as they were in the distant past
            (lookback time). The curved arcs are real gravitational lensing: the
            cluster&apos;s mass bends the light of galaxies behind it, the same
            physics as the Black Holes tab, at cluster scale.
          </p>
          <p className="mt-2 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
            Credit: {img.credit}. {img.license}.{" "}
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
      </div>
    </div>
  );
}
