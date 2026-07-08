"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CaretDown, Info } from "@phosphor-icons/react";

export type WorldTab =
  | "earth"
  | "living"
  | "mars"
  | "virtual"
  | "moon"
  | "solar";

const TABS: Array<{ id: WorldTab; label: string; href: string }> = [
  { id: "earth", label: "Earth", href: "/" },
  { id: "living", label: "Living Earth", href: "/living-earth" },
  { id: "mars", label: "Mars", href: "/mars" },
  { id: "virtual", label: "Virtual Earth", href: "/virtual-earth" },
  { id: "moon", label: "Moon", href: "/moon" },
  { id: "solar", label: "Solar System", href: "/solar-system" },
];

/**
 * Top HUD bar: brand block, world tabs, about trigger.
 * Earth, Living Earth, Mars, Virtual Earth, Moon and Solar System are all live
 * routes.
 *
 * Nav is responsive:
 *  - desktop (md+): a centered pill row with every tab (unchanged layout).
 *  - mobile (< md): a horizontally scrollable compact tab row that can reach
 *    ALL tabs. (The old mobile control only linked to the *first* other tab,
 *    leaving most tabs unreachable on small screens — fixed here.)
 */
export default function NavShell({
  onAbout,
  active = "earth",
}: {
  onAbout: () => void;
  active?: WorldTab;
}) {
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

      {/* world tabs — desktop: centered pill row */}
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
      </nav>

      {/* right actions */}
      <div className="pointer-events-auto flex items-center gap-2 animate-hud-in">
        {/* mobile world switcher: a compact dropdown that reaches EVERY tab.
            (The old mobile control only linked to the first other tab, leaving
            most tabs unreachable on small screens — fixed here.) */}
        <MobileWorldMenu active={active} />
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

/**
 * Mobile-only dropdown world switcher (hidden on md+). Shows the current tab
 * and expands a menu listing ALL tabs, so every world is reachable at a narrow
 * viewport. The menu overlays (z-index) rather than shifting the side HUD
 * panels, so it never collides with them. Closes on outside click or Escape.
 */
function MobileWorldMenu({ active }: { active: WorldTab }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch world"
        aria-haspopup="menu"
        aria-expanded={open}
        className="hud-panel flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs text-dim transition-colors duration-200 hover:text-ice"
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-solar animate-pulse-dot"
        />
        {current.label}
        <CaretDown
          size={12}
          weight="bold"
          aria-hidden
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <nav
          aria-label="Worlds"
          className="hud-panel absolute right-0 top-full mt-2 flex w-44 flex-col gap-0.5 rounded-2xl p-1.5 animate-hud-in"
        >
          {TABS.map((tab) =>
            tab.id === active ? (
              <span
                key={tab.id}
                aria-current="page"
                className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-ice"
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-solar"
                />
                {tab.label}
              </span>
            ) : (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-xs text-dim transition-colors duration-200 hover:bg-white/5 hover:text-ice"
              >
                {tab.label}
              </Link>
            )
          )}
        </nav>
      )}
    </div>
  );
}
