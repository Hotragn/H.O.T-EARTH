"use client";

import { COMET_CONTACT_BINARIES, COMET_MOONS_NOTE } from "@/lib/asteroid-moons";

/**
 * The comet honesty centerpiece (this tab&apos;s analogue of the Dwarf Moons config
 * panel, replaced entirely). It makes the phase&apos;s headline honesty point
 * unmissable: COMETS HAVE NO MOONS. It renders COMET_MOONS_NOTE prominently, then
 * shows the two canonical CONTACT BINARIES from lib/asteroid-moons, 67P (with its
 * reused real ESA Rosetta photo and mandatory credit) and Arrokoth (an illustrative
 * two-lobe shape), each labeled explicitly as ONE body with two touching lobes, NOT
 * a moon. It never invents a comet moon, and it says so. No em-dashes.
 */
export default function AsteroidMoonsCometPanel() {
  const p67 = COMET_CONTACT_BINARIES["67P"];
  const arrokoth = COMET_CONTACT_BINARIES.Arrokoth;

  return (
    <section
      aria-label="Comets have no moons"
      className="hud-scroll pointer-events-auto absolute right-3 top-32 z-10 max-h-[calc(100dvh-13rem)] w-[330px] overflow-y-auto animate-hud-in sm:right-5 sm:top-36"
    >
      <div className="hud-panel rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-medium text-ice">
            Comets have no moons
          </h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-faint">
            honesty
          </span>
        </div>

        {/* the headline honesty note, verbatim from the physics lib */}
        <p className="mt-2 rounded-xl border border-solar/25 bg-solar/[0.05] p-3 text-[11px] leading-relaxed text-dim">
          {COMET_MOONS_NOTE}
        </p>

        {/* the two contact binaries: one body each, NOT a moon */}
        <div className="mt-3 border-t border-line pt-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            The closest phenomenon: contact binaries
          </p>

          {/* 67P: reused real ESA Rosetta photo (CC BY-SA 3.0 IGO) */}
          <div className="mt-2 rounded-xl border border-line bg-white/[0.02] p-3">
            <div className="flex items-start gap-3">
              <img
                src="/textures/small-bodies/churyumov-gerasimenko.jpg"
                alt="Comet 67P/Churyumov-Gerasimenko, a bilobed contact binary imaged by ESA Rosetta"
                width={72}
                height={72}
                loading="lazy"
                className="h-[72px] w-[72px] shrink-0 rounded-lg border border-line object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-[11px] text-ice">{p67.name}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-dim">
                  {p67.dimensionsNote}.
                </p>
                <p className="mt-1 font-mono text-[8.5px] leading-snug text-faint">
                  {p67.mission}
                </p>
              </div>
            </div>
            <p className="mt-2 rounded-lg border border-[#e0a877]/40 bg-[#e0a877]/[0.06] px-2 py-1 text-[10px] leading-relaxed text-[#e0a877]">
              Contact binary: ONE body, two touching lobes, not a comet with a moon.
            </p>
            <p className="mt-1.5 font-mono text-[8.5px] leading-snug text-faint">
              Photo: ESA/Rosetta/NAVCAM, CC BY-SA 3.0 IGO (single-view, shown flat).
            </p>
          </div>

          {/* Arrokoth: illustrative two-lobe shape (no shipped map) */}
          <div className="mt-2 rounded-xl border border-line bg-white/[0.02] p-3">
            <div className="flex items-start gap-3">
              <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-lg border border-line bg-black/30">
                <ArrokothGlyph />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] text-ice">{arrokoth.name}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-dim">
                  {arrokoth.dimensionsNote}.
                </p>
                <p className="mt-1 font-mono text-[8.5px] leading-snug text-faint">
                  {arrokoth.mission}
                </p>
              </div>
            </div>
            <p className="mt-2 rounded-lg border border-[#e0a877]/40 bg-[#e0a877]/[0.06] px-2 py-1 text-[10px] leading-relaxed text-[#e0a877]">
              Contact binary: ONE body, two touching lobes, not a moon. Shape
              illustrative (no map shipped).
            </p>
          </div>
        </div>

        {/* the closing honesty line */}
        <p className="mt-3 border-t border-line pt-3 text-[10px] leading-relaxed text-faint">
          A contact binary is a single object; a fragmenting comet (73P,
          Shoemaker-Levy 9) sheds fragments, not moons. This tab therefore models NO
          comet moon, and invents none. The real moons it shows all belong to
          asteroids.
        </p>
      </div>
    </section>
  );
}

/** A small illustrative two-lobe glyph for Arrokoth (no surface map is shipped). */
function ArrokothGlyph() {
  return (
    <svg width={56} height={40} viewBox="0 0 56 40" aria-hidden role="img">
      <circle cx={20} cy={20} r={16} fill="#8f8579" opacity={0.9} />
      <circle cx={40} cy={20} r={12} fill="#9a8f7d" opacity={0.9} />
    </svg>
  );
}
