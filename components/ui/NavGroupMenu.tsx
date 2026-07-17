"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CaretDown } from "@phosphor-icons/react";
import { getWorld, type World, type WorldGroup, type WorldTab } from "@/lib/worlds";

/**
 * Desktop grouped-nav trigger + popover for a single world group.
 *
 * Open state is lifted to NavShell so only one group menu is open at a time.
 * Fully keyboard driven: the trigger opens on Enter/Space/ArrowDown, the menu
 * supports Arrow/Home/End roving focus, Esc closes and returns focus to the
 * trigger, Tab closes. The active world's group is marked on its trigger, and
 * the active world carries aria-current inside the menu.
 */
export default function NavGroupMenu({
  group,
  worlds,
  active,
  open,
  onOpen,
  onClose,
  onNavigate,
}: {
  group: WorldGroup;
  worlds: World[];
  active: WorldTab;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onNavigate: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const activeWorld = getWorld(active);
  const groupHasActive = activeWorld?.group === group.id;
  const menuId = `nav-menu-${group.id}`;

  // On open, move focus to the active world (or first world) in the menu.
  useEffect(() => {
    if (!open) return;
    const idx = groupHasActive
      ? Math.max(0, worlds.findIndex((w) => w.id === active))
      : 0;
    const raf = requestAnimationFrame(() => itemRefs.current[idx]?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open, active, groupHasActive, worlds]);

  // Close on outside pointer-down.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open, onClose]);

  const focusItem = (i: number) => {
    const n = worlds.length;
    if (n === 0) return;
    itemRefs.current[((i % n) + n) % n]?.focus();
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) focusItem(0);
      else onOpen();
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      onClose();
    }
  };

  const onItemKeyDown = (e: React.KeyboardEvent, i: number) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusItem(i + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusItem(i - 1);
        break;
      case "Home":
        e.preventDefault();
        focusItem(0);
        break;
      case "End":
        e.preventDefault();
        focusItem(worlds.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        triggerRef.current?.focus();
        break;
      case "Tab":
        onClose();
        break;
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-xs transition-colors duration-200 ${
          open || groupHasActive
            ? "bg-white/10 text-ice"
            : "text-dim hover:bg-white/5 hover:text-ice"
        }`}
      >
        {groupHasActive && (
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full animate-pulse-dot"
            style={{ backgroundColor: activeWorld?.accent }}
          />
        )}
        <span className="font-medium">{group.label}</span>
        <CaretDown
          size={11}
          weight="bold"
          aria-hidden
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={group.label}
          className="hud-panel absolute left-1/2 top-full mt-2 -ml-36 w-72 rounded-2xl p-1.5 animate-menu-in"
        >
          {worlds.map((world, i) => {
            const isCurrent = world.id === active;
            return (
              <Link
                key={world.id}
                href={world.href}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                role="menuitem"
                aria-current={isCurrent ? "page" : undefined}
                tabIndex={-1}
                onClick={onNavigate}
                onKeyDown={(e) => onItemKeyDown(e, i)}
                className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 ${
                  isCurrent ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <span
                  aria-hidden
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: world.accent }}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ice">
                    {world.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-dim">
                    {world.blurb}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
