"use client";

import { RobotGuideCanvas } from "./RobotGuide";
import { ROBOT_NOTE, type Section } from "./interstellarUi";

/**
 * A small, persistent guide/mascot in the corner: the ORIGINAL monolith robot in
 * a mini canvas with a short caption (original text, never film dialogue) that
 * changes per section, and the honest "original design, not from any film" label.
 * Decorative; it never blocks pointer events on the sections behind it.
 */

/** Short, ORIGINAL captions (not movie dialogue) keyed by section. */
const CAPTIONS: Record<Section, string> = {
  arrival: "Systems nominal. Welcome aboard.",
  visitors: "Three real visitors. Watch them fall past the Sun, and leave forever.",
  swarm: "This swarm is a live model of real algorithms, a game, not a real defense.",
};

export default function RobotGuideMascot({ section }: { section: Section }) {
  // Hidden during Arrival: Arrival renders its own larger robot in the sequence.
  if (section === "arrival") return null;

  return (
    <div className="pointer-events-none absolute bottom-28 left-3 z-10 hidden w-[230px] flex-col items-start gap-1 animate-hud-in sm:left-5 lg:flex">
      <div className="flex items-end gap-2">
        <div className="h-24 w-16 shrink-0">
          <RobotGuideCanvas gesture={0.3} />
        </div>
        <div className="hud-panel mb-1 rounded-2xl rounded-bl-sm px-3 py-2">
          <p className="text-[11px] leading-snug text-dim">{CAPTIONS[section]}</p>
          <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">
            {ROBOT_NOTE}
          </p>
        </div>
      </div>
    </div>
  );
}
