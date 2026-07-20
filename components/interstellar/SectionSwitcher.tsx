"use client";

import { INTERSTELLAR_ACCENT, SECTIONS, type Section } from "./interstellarUi";

/**
 * The page's INTERNAL sub-section switcher (Arrival / The Visitors / Swarm
 * Defense). This is distinct from the global world nav in NavShell: it moves
 * between the three parts of this one page. A prominent segmented control,
 * mirroring the asteroid-moons system selector styling.
 */
export default function SectionSwitcher({
  section,
  onSelect,
}: {
  section: Section;
  onSelect: (s: Section) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Interstellar sections"
      className="hud-panel pointer-events-auto flex max-w-[94vw] flex-wrap items-center justify-center gap-1 rounded-full p-1 animate-hud-in"
    >
      {SECTIONS.map((s) => {
        const active = s.id === section;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            title={s.hint}
            onClick={() => onSelect(s.id)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
              active ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
            }`}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: INTERSTELLAR_ACCENT,
                opacity: active ? 1 : 0.5,
              }}
            />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
