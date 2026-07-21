"use client";

import type { BlackHole, BlackHoleState } from "@/lib/black-holes";
import { EHT_IMAGE, EHT_LABEL, fmtUas } from "./blackHolesUi";

/**
 * EHT image panel (Sgr A* and M87* only): the real EHT reconstruction beside our
 * computed shadow size, credited "EHT Collaboration / CC BY 4.0" and labeled a
 * radio-interferometric reconstruction from 2017 data, not an optical photo.
 * Renders nothing for objects without a shipped image.
 */
export default function EhtImagePanel({
  bh,
  state,
}: {
  bh: BlackHole;
  state: BlackHoleState;
}) {
  const img = EHT_IMAGE[bh.id];
  if (!img) return null;

  return (
    <div className="hud-panel rounded-2xl p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300/90">
        The real EHT image
      </h2>

      <div className="mt-2 overflow-hidden rounded-xl border border-line/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.src}
          alt={`Event Horizon Telescope reconstruction of ${bh.name}`}
          width={img.width}
          height={img.height}
          loading="lazy"
          className="block h-auto w-full"
        />
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2 font-mono text-[11px]">
        <span className="text-faint">Observed ring</span>
        <span className="text-emerald-300">{fmtUas(state.observedShadowMicroarcsec)}</span>
      </div>
      <div className="flex items-baseline justify-between gap-2 font-mono text-[11px]">
        <span className="text-faint">Our computed shadow</span>
        <span className="text-ice">{fmtUas(state.shadowAngularSizeMicroarcsec)}</span>
      </div>

      <p className="mt-2 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
        {EHT_LABEL} Credit: EHT Collaboration, CC BY 4.0.{" "}
        <a
          href={img.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-emerald-300/80 transition-colors duration-200 hover:text-emerald-200"
        >
          ESO source
        </a>
        .
      </p>
    </div>
  );
}
