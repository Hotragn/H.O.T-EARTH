"use client";

import type { GalaxyImage } from "./galaxiesUi";

/**
 * One real telescope image with its verbatim credit, in two sizes:
 *
 *  - "stage": the large centre-screen presentation (Galaxy Explorer, Deep Field)
 *  - "compact": the small in-panel version used below the lg breakpoint, where
 *    the HUD column covers the centre of the screen and there is no stage
 *
 * Both variants carry the same required attribution, because the CC BY 4.0 terms
 * travel with the image, not with the layout. `label` says what the picture
 * actually shows, so a wide mosaic of part of a galaxy is never passed off as
 * the whole thing.
 */
export default function ImagePlate({
  img,
  alt,
  variant,
  className = "",
}: {
  img: GalaxyImage;
  /** honest alt text, written by the caller (it knows the subject) */
  alt: string;
  variant: "stage" | "compact";
  className?: string;
}) {
  const stage = variant === "stage";

  return (
    <figure
      className={`hud-panel flex min-h-0 flex-col overflow-hidden rounded-2xl ${className}`}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.src}
          alt={alt}
          width={img.width}
          height={img.height}
          loading={stage ? "eager" : "lazy"}
          className={
            stage
              ? "max-h-full w-auto max-w-full object-contain"
              : "block h-auto w-full"
          }
        />
      </div>

      <figcaption
        className={`shrink-0 border-t border-line/60 ${stage ? "px-4 py-2.5" : "p-3"}`}
      >
        <p
          className={`leading-snug text-dim ${stage ? "text-[11px]" : "text-[10px] text-faint"}`}
        >
          {stage && (
            <span className="mr-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-200/90">
              Real image
            </span>
          )}
          {img.label}
        </p>
        <p className="mt-1 text-[10px] leading-snug text-faint">
          Credit: {img.credit} {img.license}.{" "}
          <a
            href={img.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="pointer-events-auto text-amber-200/80 transition-colors duration-200 hover:text-amber-100"
          >
            source
          </a>
          .
        </p>
      </figcaption>
    </figure>
  );
}
