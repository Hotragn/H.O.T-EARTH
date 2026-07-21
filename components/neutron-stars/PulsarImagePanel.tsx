"use client";

import type { NeutronStarId } from "@/lib/neutron-stars";
import { PULSAR_IMAGE } from "./neutronStarsUi";

/**
 * Real telescope image panel (Crab and Vela only): the real image beside its
 * verbatim credit and an honest label of what it actually shows (the Crab
 * NEBULA, not a resolved neutron-star surface; the Vela pulsar and jet in
 * X-rays). Renders nothing for objects without a shipped image; those rely on
 * the illustrative render alone.
 */
export default function PulsarImagePanel({ id }: { id: NeutronStarId }) {
  const img = PULSAR_IMAGE[id];
  if (!img) return null;

  return (
    <div className="hud-panel rounded-2xl p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300/90">
        A real telescope image
      </h2>

      <div className="mt-2 overflow-hidden rounded-xl border border-line/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.src}
          alt={`Real telescope image related to ${id}`}
          width={img.width}
          height={img.height}
          loading="lazy"
          className="block h-auto w-full"
        />
      </div>

      <p className="mt-2 text-[10px] leading-snug text-faint">{img.label}</p>
      <p className="mt-2 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
        Credit: {img.credit}. {img.license}.{" "}
        <a
          href={img.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-emerald-300/80 transition-colors duration-200 hover:text-emerald-200"
        >
          source
        </a>
        .
      </p>
    </div>
  );
}
