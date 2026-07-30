"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, X } from "@phosphor-icons/react";
import { WORLDS } from "@/lib/worlds";
import { WELCOME_SEEN_KEY } from "@/components/welcome/WelcomeApp";

/**
 * A one-time, dismissible invitation to the guided tour.
 *
 * Deliberately quiet: it renders nothing until we know the visitor has not seen
 * the tour (so it cannot flash on a returning visit), it never blocks the view,
 * and dismissing or taking it are both remembered. If localStorage is
 * unavailable the hint simply does not show, which is the safe direction.
 */
export default function TourHint() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(WELCOME_SEEN_KEY)) {
        // A short delay so it arrives after the scene has settled, not during boot.
        const t = window.setTimeout(() => setShow(true), 2600);
        return () => window.clearTimeout(t);
      }
    } catch {
      /* private mode: stay quiet */
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  // Never invite you to the tour while you are on the tour.
  if (!show || pathname === "/welcome") return null;

  return (
    <div className="pointer-events-auto fixed bottom-5 left-4 z-[55] max-w-[19rem] animate-hud-in sm:left-5">
      <div className="hud-panel flex items-start gap-3 rounded-2xl p-3.5">
        <span className="mt-0.5 shrink-0 text-solar">
          <Rocket size={18} weight="fill" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ice">First time here?</p>
          <p className="mt-0.5 text-[11px] leading-snug text-dim">
            Take a two-minute flight out through all {WORLDS.length} worlds.
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Link
              href="/welcome"
              onClick={dismiss}
              className="rounded-full bg-solar px-3 py-1 text-[11px] font-medium text-abyss transition-colors hover:bg-solar/90"
            >
              Take the tour
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="cursor-pointer text-[11px] text-faint transition-colors hover:text-ice"
            >
              No thanks
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 cursor-pointer text-faint transition-colors hover:text-ice"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
