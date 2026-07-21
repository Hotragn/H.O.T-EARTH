"use client";

import { useEffect, useRef, useState } from "react";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { AUDIO_LABEL, fmtFrequency } from "./neutronStarsUi";

/**
 * Optional pulse audio, SYNTHESIZED in-browser with the Web Audio API at the
 * pulsar's REAL measured spin frequency (not a telescope recording). Honesty
 * rules: OFF by default, it NEVER autoplays (it starts only from this explicit
 * user toggle), and the AudioContext is created / resumed inside that click so it
 * satisfies browser autoplay policy. Sub-Hz to ~40 Hz pulsars are rendered as
 * discrete soft clicks scheduled at the true period (a tick, then a low buzz for
 * the Crab); faster millisecond pulsars are rendered as a gentle continuous tone
 * at their true spin frequency (an audible pitch). Low gain, short clicks; every
 * node is torn down on unmount, toggle-off or frequency change.
 */
const CLICK_TONE_THRESHOLD_HZ = 40;

export default function PulseAudio({
  spinFrequencyHz,
}: {
  spinFrequencyHz: number | null;
}) {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const toneRef = useRef<OscillatorNode | null>(null);
  const toneGainRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextNoteRef = useRef(0);

  // Tear down all audio nodes / timers.
  const teardown = () => {
    if (schedulerRef.current !== null) {
      clearInterval(schedulerRef.current);
      schedulerRef.current = null;
    }
    try {
      toneRef.current?.stop();
    } catch {
      /* already stopped */
    }
    toneRef.current?.disconnect();
    toneGainRef.current?.disconnect();
    toneRef.current = null;
    toneGainRef.current = null;
    masterRef.current?.disconnect();
    masterRef.current = null;
    const ctx = ctxRef.current;
    ctxRef.current = null;
    if (ctx) void ctx.close().catch(() => {});
  };

  useEffect(() => {
    if (!on) {
      teardown();
      return;
    }
    const freq = spinFrequencyHz;
    if (typeof freq !== "number" || !Number.isFinite(freq) || freq <= 0) {
      return;
    }

    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    ctxRef.current = ctx;
    void ctx.resume().catch(() => {});

    const master = ctx.createGain();
    master.gain.value = 0.18; // gentle
    master.connect(ctx.destination);
    masterRef.current = master;

    if (freq > CLICK_TONE_THRESHOLD_HZ) {
      // continuous tone at the true spin frequency (audible pitch for MSPs)
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      osc.connect(g);
      g.connect(master);
      osc.start();
      toneRef.current = osc;
      toneGainRef.current = g;
    } else {
      // discrete clicks scheduled at the true period (lookahead scheduler)
      const period = 1 / freq;
      nextNoteRef.current = ctx.currentTime + 0.08;
      const lookahead = 0.15; // seconds scheduled ahead
      const scheduleClick = (time: number) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = 900;
        const g = ctx.createGain();
        // short percussive envelope (a click)
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(0.9, time + 0.001);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
        osc.connect(g);
        g.connect(master);
        osc.start(time);
        osc.stop(time + 0.05);
      };
      const tick = () => {
        const c = ctxRef.current;
        if (!c) return;
        while (nextNoteRef.current < c.currentTime + lookahead) {
          scheduleClick(nextNoteRef.current);
          nextNoteRef.current += period;
        }
      };
      schedulerRef.current = window.setInterval(tick, 25);
    }

    return () => {
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, spinFrequencyHz]);

  // Safety net: stop audio when the component unmounts.
  useEffect(() => teardown, []);

  const isTone =
    typeof spinFrequencyHz === "number" && spinFrequencyHz > CLICK_TONE_THRESHOLD_HZ;

  return (
    <div className="hud-panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-fuchsia-300/90">
          Pulse audio
        </h2>
        <button
          type="button"
          onClick={() => setOn((v) => !v)}
          aria-pressed={on}
          aria-label={
            on
              ? "Stop synthesized pulse audio"
              : "Play synthesized pulse audio at the real spin frequency"
          }
          className={`flex h-9 items-center gap-2 rounded-full px-3 text-xs transition-colors duration-200 ${
            on ? "bg-white/10 text-ice" : "text-dim hover:text-ice"
          }`}
        >
          {on ? (
            <SpeakerHigh size={15} weight="light" aria-hidden />
          ) : (
            <SpeakerSlash size={15} weight="light" aria-hidden />
          )}
          <span className="font-mono text-[11px] tracking-wide">
            {on ? "On" : "Off"}
          </span>
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-faint">
        {isTone
          ? `A gentle continuous tone at the true spin frequency (${fmtFrequency(spinFrequencyHz)}).`
          : `Discrete clicks scheduled at the true period (${fmtFrequency(spinFrequencyHz)}).`}{" "}
        {AUDIO_LABEL}
      </p>
    </div>
  );
}
