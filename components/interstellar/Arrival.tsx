"use client";

import { useEffect, useState } from "react";
import { ArrowRight, SkipForward } from "@phosphor-icons/react";
import { RobotGuideCanvas } from "./RobotGuide";
import {
  HOMAGE_NOTE,
  INTERSTELLAR_ACCENT,
  OBJECT_COLOR,
  ROBOT_NOTE,
} from "./interstellarUi";

/**
 * Section A: a cinematic, SKIPPABLE onboarding intro. Entirely ORIGINAL: an
 * animated starfield/arc (SVG + CSS), staged text reveals, and the original guide
 * robot delivering short INTRO CAPTIONS (original text, never film dialogue). A
 * Skip control and an Enter control both leave the intro (the parent remembers the
 * choice in localStorage so it does not gate every visit).
 *
 * No copyrighted film assets: no score, no scenes, no logos, no dialogue.
 */

/** Staged intro lines (original copy, no film dialogue, no em-dashes). */
const LINES = [
  "Every so often, something falls in from another star.",
  "Not born here. Not bound here. Passing through, once, forever.",
  "Three have been caught in the act.",
];

const VISITORS: Array<{ id: keyof typeof OBJECT_COLOR; name: string; note: string }> = [
  { id: "1I", name: "1I/'Oumuamua", note: "2017 · the first, and the strangest" },
  { id: "2I", name: "2I/Borisov", note: "2019 · a comet from another star" },
  { id: "3I", name: "3I/ATLAS", note: "2025 · fastest, from Sagittarius" },
];

export default function Arrival({
  onEnter,
  onSkip,
}: {
  onEnter: () => void;
  onSkip: () => void;
}) {
  // Advance the reveal every ~1.7s up to the final stage.
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setStage((s) => (s >= LINES.length + 1 ? s : s + 1));
    }, 1700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden bg-abyss/95 px-5 text-center">
      {/* the streaking object on an original hyperbolic arc */}
      <StreakArc />

      {/* skip, always available */}
      <button
        type="button"
        onClick={onSkip}
        className="hud-panel absolute right-4 top-4 flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 font-mono text-[11px] tracking-wide text-dim transition-colors duration-200 hover:text-ice sm:right-6 sm:top-6"
      >
        <SkipForward size={13} weight="fill" aria-hidden />
        Skip intro
      </button>

      <div className="relative z-10 flex max-w-2xl flex-col items-center gap-6">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.42em] animate-hud-in"
          style={{ color: INTERSTELLAR_ACCENT }}
        >
          H.O.T Earth // Interstellar
        </p>

        {/* the original guide robot delivers the intro */}
        <div className="h-40 w-28">
          <RobotGuideCanvas gesture={0.35} />
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
          {ROBOT_NOTE}
        </p>

        {/* staged lines */}
        <div className="flex min-h-[5.5rem] flex-col gap-2">
          {LINES.map((line, i) => (
            <p
              key={i}
              className={`font-display text-lg leading-snug text-ice transition-all duration-700 sm:text-xl ${
                stage > i ? "opacity-100 blur-0" : "translate-y-2 opacity-0 blur-sm"
              }`}
            >
              {line}
            </p>
          ))}
        </div>

        {/* the three visitors, revealed together after the lines */}
        <div
          className={`flex flex-wrap items-center justify-center gap-2 transition-opacity duration-700 ${
            stage >= LINES.length ? "opacity-100" : "opacity-0"
          }`}
        >
          {VISITORS.map((v) => (
            <div
              key={v.id}
              className="hud-panel flex items-center gap-2 rounded-full px-3.5 py-2"
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: OBJECT_COLOR[v.id] }}
              />
              <span className="text-xs text-ice">{v.name}</span>
              <span className="hidden font-mono text-[10px] text-faint sm:inline">
                {v.note}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onEnter}
          className={`group mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white/5 px-6 py-3 text-sm font-medium text-ice transition-all duration-500 hover:bg-white/10 ${
            stage >= LINES.length ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          Enter
          <ArrowRight
            size={16}
            weight="bold"
            aria-hidden
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </button>

        <p className="max-w-md font-mono text-[10px] leading-relaxed text-faint/80">
          {HOMAGE_NOTE}
        </p>
      </div>
    </div>
  );
}

/**
 * An original, procedural SVG "visitor" streaking along a hyperbolic arc past a
 * central star, with a fading trail. Pure SVG/SMIL animation, no external assets.
 */
function StreakArc() {
  // A hyperbola-like open arc that swings past the centre (the "Sun").
  const path = "M -120 340 C 220 260, 360 160, 640 -40";
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
      viewBox="0 0 640 360"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* the star (illustrative, original) */}
      <circle cx="300" cy="210" r="6" fill="#ffcf6b" />
      <circle cx="300" cy="210" r="18" fill="#f2a63b" opacity="0.18" />
      {/* the arc it rides */}
      <path d={path} fill="none" stroke={INTERSTELLAR_ACCENT} strokeOpacity="0.18" strokeWidth="1" />
      {/* the moving object + trail */}
      <circle r="3.2" fill={INTERSTELLAR_ACCENT}>
        <animateMotion dur="7s" repeatCount="indefinite" path={path} />
      </circle>
      <circle r="8" fill={INTERSTELLAR_ACCENT} opacity="0.22">
        <animateMotion dur="7s" repeatCount="indefinite" path={path} />
      </circle>
    </svg>
  );
}
