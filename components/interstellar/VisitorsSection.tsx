"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  INTERSTELLAR_IDS,
  getInterstellarObject,
  type InterstellarId,
} from "@/lib/interstellar";
import VisitorsCanvas from "./VisitorsCanvas";
import VisitorPanel from "./VisitorPanel";
import VisitorsTimeControl, { VISITOR_SPEEDS } from "./VisitorsTimeControl";
import { OBJECT_COLOR } from "./interstellarUi";

const DAY_MS = 86_400_000;

/** Sample / scrub window (days each side of perihelion) tuned per object so the
 * drawn arc reaches several AU out and the flyby reads well. */
const WINDOW_DAYS: Record<InterstellarId, number> = {
  "1I": 480,
  "2I": 540,
  "3I": 340,
};

/**
 * Section B owner. Holds the selected object, the displayed instant (a scrubbable
 * clock that flies through perihelion) and playback, and lays out the 3D canvas,
 * the fact/state panel and the time scrubber. The scene reads the instant from a
 * ref per frame (smooth playback); the panel reads a throttled state mirror. The
 * default object is 3I/ATLAS, the newest and fastest visitor.
 */
export default function VisitorsSection() {
  const [selectedId, setSelectedId] = useState<InterstellarId>("3I");

  const obj = getInterstellarObject(selectedId);
  const tpMs = obj ? obj.timeOfPerihelion.getTime() : Date.now();
  const windowMs = WINDOW_DAYS[selectedId] * DAY_MS;
  const fromMs = tpMs - windowMs;
  const toMs = tpMs + windowMs;

  const displayedMsRef = useRef<number>(tpMs);
  const [displayedMs, setDisplayedMs] = useState<number>(tpMs);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);

  // Reset the clock to perihelion whenever the object changes.
  useEffect(() => {
    displayedMsRef.current = tpMs;
    setDisplayedMs(tpMs);
    setPlaying(false);
  }, [selectedId, tpMs]);

  // Single animation loop: advance the displayed instant when playing (clamped to
  // the window, auto-stopping at the far end) and mirror it to state ~5 Hz for the
  // panel. The scene reads displayedMsRef directly each frame for smooth motion.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastMirror = 0;
    const loop = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      if (playing) {
        const next = displayedMsRef.current + dt * VISITOR_SPEEDS[speedIdx].daysPerSec * DAY_MS;
        if (next >= toMs) {
          displayedMsRef.current = toMs;
          setDisplayedMs(toMs);
          setPlaying(false);
        } else {
          displayedMsRef.current = next;
        }
      }
      if (t - lastMirror > 180) {
        lastMirror = t;
        setDisplayedMs(displayedMsRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speedIdx, toMs]);

  const onScrubFraction = useCallback(
    (f: number) => {
      const ms = fromMs + f * (toMs - fromMs);
      displayedMsRef.current = ms;
      setDisplayedMs(ms);
      setPlaying(false);
    },
    [fromMs, toMs],
  );

  const onPlayToggle = useCallback(() => {
    setPlaying((p) => {
      const next = !p;
      // restart from the window start if we are parked at the end
      if (next && displayedMsRef.current >= toMs - 1) {
        displayedMsRef.current = fromMs;
        setDisplayedMs(fromMs);
      }
      return next;
    });
  }, [fromMs, toMs]);

  const onGoToPerihelion = useCallback(() => {
    displayedMsRef.current = tpMs;
    setDisplayedMs(tpMs);
    setPlaying(false);
  }, [tpMs]);

  const arcKey = useMemo(() => `${selectedId}-${fromMs}-${toMs}`, [selectedId, fromMs, toMs]);

  return (
    <>
      <VisitorsCanvas
        key={arcKey}
        selectedId={selectedId}
        displayedMsRef={displayedMsRef}
        fromMs={fromMs}
        toMs={toMs}
      />

      <div className="pointer-events-none absolute inset-0 z-20">
        {/* object selector, below the section switcher */}
        <div className="absolute inset-x-0 top-[104px] flex justify-center px-3 sm:top-[112px]">
          <div
            role="tablist"
            aria-label="Choose an interstellar object"
            className="hud-panel pointer-events-auto flex items-center gap-1 rounded-full p-1 animate-hud-in"
          >
            {INTERSTELLAR_IDS.map((id) => {
              const o = getInterstellarObject(id);
              const active = id === selectedId;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedId(id)}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors duration-200 ${
                    active ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: OBJECT_COLOR[id], opacity: active ? 1 : 0.6 }}
                  />
                  {o?.name ?? id}
                </button>
              );
            })}
          </div>
        </div>

        {/* fact + live-state panel, left column */}
        <div className="hud-scroll pointer-events-auto absolute left-3 top-40 z-10 flex max-h-[calc(100dvh-15rem)] flex-col gap-3 overflow-y-auto animate-hud-in sm:left-5">
          <VisitorPanel selectedId={selectedId} displayedMs={displayedMs} />
        </div>

        {/* scrubber */}
        <VisitorsTimeControl
          fromMs={fromMs}
          toMs={toMs}
          tpMs={tpMs}
          displayedMs={displayedMs}
          playing={playing}
          speedIdx={speedIdx}
          onScrubFraction={onScrubFraction}
          onPlayToggle={onPlayToggle}
          onGoToPerihelion={onGoToPerihelion}
          onSpeedChange={setSpeedIdx}
        />
      </div>
    </>
  );
}
