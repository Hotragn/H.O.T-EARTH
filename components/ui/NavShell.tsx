"use client";

import Link from "next/link";
import { Info } from "@phosphor-icons/react";

export type WorldTab = "earth" | "living";

const TABS: Array<{ id: WorldTab; label: string; href: string }> = [
  { id: "earth", label: "Earth", href: "/" },
  { id: "living", label: "Living Earth", href: "/living-earth" },
];

/**
 * Top HUD bar: brand block, world tabs, about trigger.
 * Earth and Living Earth are live routes; Mars and Moon are honest "coming"
 * markers, not dead links.
 */
export default function NavShell({
  onAbout,
  active = "earth",
}: {
  onAbout: () => void;
  active?: WorldTab;
}) {
  const other = TABS.find((t) => t.id !== active) ?? TABS[0];

  return (
    <header className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
      {/* brand */}
      <div className="pointer-events-auto animate-hud-in">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-2 w-2 rounded-full bg-solar" />
          <span className="font-display text-sm font-semibold tracking-[0.24em] text-ice">
            H.O.T EARTH
          </span>
        </div>
        <p className="mt-1.5 hidden max-w-[300px] pl-[18px] text-[11px] leading-snug text-faint sm:block">
          A living digital twin of Earth — real physics, real data
        </p>
      </div>

      {/* world tabs */}
      <nav
        aria-label="Worlds"
        className="hud-panel pointer-events-auto absolute left-1/2 top-4 hidden -translate-x-1/2 items-center gap-1 rounded-full p-1 animate-hud-in md:flex"
      >
        {TABS.map((tab) =>
          tab.id === active ? (
            <span
              key={tab.id}
              aria-current="page"
              className="flex cursor-default items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-ice"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-solar animate-pulse-dot"
              />
              {tab.label}
            </span>
          ) : (
            <Link
              key={tab.id}
              href={tab.href}
              className="rounded-full px-4 py-1.5 text-xs text-dim transition-colors duration-200 hover:bg-white/5 hover:text-ice"
            >
              {tab.label}
            </Link>
          )
        )}
        <span className="flex cursor-default items-center gap-1.5 rounded-full px-4 py-1.5 text-xs text-faint">
          Mars
          <span className="font-mono text-[9px] uppercase tracking-wider text-faint/80">
            soon
          </span>
        </span>
        <span className="flex cursor-default items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-faint">
          Moon
          <span className="font-mono text-[9px] uppercase tracking-wider text-faint/80">
            soon
          </span>
        </span>
      </nav>

      {/* right actions */}
      <div className="pointer-events-auto flex items-center gap-2 animate-hud-in">
        {/* compact tab switch on small screens */}
        <Link
          href={other.href}
          className="hud-panel rounded-full px-3.5 py-2 text-xs text-dim transition-colors duration-200 hover:text-ice md:hidden"
        >
          {other.label}
        </Link>
        <button
          type="button"
          onClick={onAbout}
          aria-label="About the data in this app"
          className="hud-panel flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-dim transition-colors duration-200 hover:text-ice focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70"
        >
          <Info size={18} weight="light" aria-hidden />
        </button>
      </div>
    </header>
  );
}
