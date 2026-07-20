"use client";

import { useEffect, useRef } from "react";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { AUDIO_CREDIT, AUDIO_SRC } from "./interstellarUi";

/**
 * Optional ambient audio: a loop of REAL NASA Voyager plasma-wave sounds (public
 * domain). Honesty rules: it is OFF by default, it NEVER autoplays (it only ever
 * starts from this explicit user toggle), and the credit is always visible next
 * to the control. Playback is driven by an <audio> element created once; toggling
 * play/pause is a direct user gesture, satisfying browser autoplay policy.
 */
export default function AudioToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (on) {
      el.volume = 0.5;
      // play() returns a promise that can reject (e.g. policy); ignore quietly.
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [on]);

  return (
    <div className="pointer-events-auto absolute right-3 top-[120px] z-10 flex max-w-[220px] flex-col items-end gap-1 sm:right-5 sm:top-[128px]">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        aria-label={on ? "Mute ambient audio" : "Play ambient audio (NASA Voyager plasma, public domain)"}
        className={`hud-panel flex h-10 items-center gap-2 rounded-full px-3.5 text-xs transition-colors duration-200 ${
          on ? "text-ice" : "text-dim hover:text-ice"
        }`}
      >
        {on ? (
          <SpeakerHigh size={16} weight="light" aria-hidden />
        ) : (
          <SpeakerSlash size={16} weight="light" aria-hidden />
        )}
        <span className="font-mono text-[11px] tracking-wide">
          {on ? "Audio on" : "Audio off"}
        </span>
      </button>
      <p className="hud-panel rounded-lg px-2.5 py-1 text-right font-mono text-[9px] leading-snug text-faint">
        Ambient audio: NASA Voyager plasma (public domain), off by default.
        <br />
        <span className="text-faint/80">{AUDIO_CREDIT}</span>
      </p>
      {/* created once; loops; muted by default via `on` state (never autoplay) */}
      <audio ref={ref} src={AUDIO_SRC} loop preload="none" />
    </div>
  );
}
