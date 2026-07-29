"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import {
  audibleRange,
  chirpMass,
  classifyMerger,
  countByClass,
  energyRadiated,
  frequencyAtTimeHz,
  lightTravelYears,
  massRatio,
  mergerFrequencyHz,
  parseCatalog,
  eventRingdown,
  sortEvents,
  strainAmplitude,
  timeToMergerS,
  type GwCatalog,
  type GwEvent,
} from "@/lib/gravitational-waves";
import ChirpPlot from "./ChirpPlot";
import {
  CLASS_COLOR,
  CLASS_LABEL,
  CLASS_SHORT,
  GW_ACCENT,
  distanceLabel,
  energyLabel,
  eventSummary,
  freqLabel,
  gpsDateLabel,
  massWithBounds,
  runLabel,
  strainLabel,
} from "./gwUi";

type SortKey = "gps" | "mtotal" | "dl" | "snr";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "gps", label: "Newest" },
  { key: "mtotal", label: "Heaviest" },
  { key: "snr", label: "Loudest" },
  { key: "dl", label: "Farthest" },
];

export default function GravitationalWavesApp() {
  const [catalog, setCatalog] = useState<GwCatalog | null>(null);
  const [failed, setFailed] = useState(false);
  const [sort, setSort] = useState<SortKey>("gps");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/data/gravitational-waves/gwtc.json")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const c = parseCatalog(j);
        if (c) setCatalog(c);
        else setFailed(true);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const events = useMemo(
    () => (catalog ? sortEvents(catalog.events, sort) : []),
    [catalog, sort],
  );

  const selected = useMemo(
    () => events.find((e) => e.name === selectedName) ?? events[0] ?? null,
    [events, selectedName],
  );

  const counts = useMemo(
    () => (catalog ? countByClass(catalog.events) : null),
    [catalog],
  );

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-abyss">
      {/* backdrop: a quiet ripple field, purely decorative */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.35]">
        <div className="gw-ripple" />
        <div className="gw-ripple gw-ripple--b" />
      </div>

      <NavShell active="gravitational-waves" onAbout={() => setAboutOpen(true)} />

      <div className="relative h-full overflow-y-auto hud-scroll px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6">
            <h1 className="font-display text-2xl font-semibold text-ice sm:text-3xl">
              Gravitational waves
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-dim">
              Spacetime itself ringing. Every event here is a real detection by
              LIGO, Virgo and KAGRA, with the published masses and distances. The
              waveform and the sound are <strong className="text-ice">computed</strong>{" "}
              from those masses, not recordings of the detector data.
            </p>
            {catalog && counts && (
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-dim">
                <div>
                  <dt className="inline text-faint">detections </dt>
                  <dd className="inline text-ice">{catalog.events.length}</dd>
                </div>
                {(["BBH", "BNS", "NSBH"] as const).map((k) => (
                  <div key={k}>
                    <dt className="inline text-faint">{CLASS_SHORT[k]} </dt>
                    <dd className="inline" style={{ color: CLASS_COLOR[k] }}>
                      {counts[k]}
                    </dd>
                  </div>
                ))}
                <div>
                  <dt className="inline text-faint">catalogues </dt>
                  <dd className="inline text-ice">{catalog.meta.catalogs.length}</dd>
                </div>
              </dl>
            )}
          </header>

          {failed && (
            <p className="hud-panel rounded-xl p-4 text-sm text-dim">
              The catalogue file could not be loaded, so nothing is shown rather
              than showing invented events.
            </p>
          )}

          {!catalog && !failed && (
            <p className="text-sm text-faint">Loading the catalogue…</p>
          )}

          {catalog && selected && (
            <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
              {/* catalogue list */}
              <section aria-label="Detections" className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-1">
                  {SORTS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSort(s.key)}
                      className={`cursor-pointer rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-200 ${
                        sort === s.key
                          ? "bg-white/10 text-ice"
                          : "text-faint hover:text-ice"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <ul className="hud-scroll hud-panel max-h-[52dvh] overflow-y-auto rounded-xl p-1.5">
                  {events.map((e) => {
                    const cls = classifyMerger(e.m1, e.m2);
                    const active = e.name === selected.name;
                    return (
                      <li key={e.name}>
                        <button
                          type="button"
                          onClick={() => setSelectedName(e.name)}
                          aria-current={active ? "true" : undefined}
                          className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 ${
                            active ? "bg-white/10" : "hover:bg-white/5"
                          }`}
                        >
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: cls
                                ? CLASS_COLOR[cls.type]
                                : "#626a7a",
                            }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-mono text-[11px] text-ice">
                              {e.name}
                            </span>
                            <span className="block truncate text-[10px] text-faint">
                              {eventSummary(e)} · {runLabel(e.catalog)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* detail */}
              <section aria-label="Detection detail" className="min-w-0 space-y-4">
                <EventDetail event={selected} />
                <ChirpPlot event={selected} />
                <ChirpAudio event={selected} />
                <Honesty catalog={catalog} />
              </section>
            </div>
          )}
        </div>
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

      <style jsx>{`
        .gw-ripple {
          position: absolute;
          left: 50%;
          top: 42%;
          width: 46vmax;
          height: 46vmax;
          margin: -23vmax 0 0 -23vmax;
          border-radius: 50%;
          border: 1px solid ${GW_ACCENT};
          opacity: 0;
          animation: gw-pulse 7s ease-out infinite;
        }
        .gw-ripple--b {
          animation-delay: 3.5s;
        }
        @keyframes gw-pulse {
          0% {
            transform: scale(0.2);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .gw-ripple {
            animation: none;
            opacity: 0.12;
          }
        }
      `}</style>
    </main>
  );
}

function Row({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="border-b border-line py-2 last:border-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-ice">{value}</dd>
      {note && <p className="mt-0.5 text-[10px] leading-snug text-faint">{note}</p>}
    </div>
  );
}

function EventDetail({ event }: { event: GwEvent }) {
  const cls = classifyMerger(event.m1, event.m2);
  const mc = event.mchirp ?? chirpMass(event.m1, event.m2);
  const mt = event.mtotal ?? event.m1 + event.m2;
  const q = massRatio(event.m1, event.m2);
  const isco = mergerFrequencyHz(mt);
  const ring = eventRingdown(event);
  const energy = energyRadiated(mt, event.mfinal);
  const ly = lightTravelYears(event.dl);
  const inBand = mc != null ? timeToMergerS(mc, 20) : null;
  const h = mc != null && isco != null ? strainAmplitude(mc, event.dl, isco) : null;

  return (
    <div className="hud-panel rounded-xl p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-ice">
          {event.name}
        </h2>
        <span className="font-mono text-[11px] text-faint">
          {gpsDateLabel(event.gps)} · {runLabel(event.catalog)} · {event.catalog}
        </span>
      </div>

      {cls && (
        <p className="mb-3 text-sm text-dim">
          <span style={{ color: CLASS_COLOR[cls.type] }}>
            {CLASS_LABEL[cls.type]}
          </span>
          {cls.ambiguous && (
            <span className="text-faint">
              {" "}
              · a component sits in the contested 2–5 M☉ range, so this
              classification is genuinely uncertain
            </span>
          )}
        </p>
      )}

      <dl className="grid gap-x-6 sm:grid-cols-2">
        <Row
          label="Component masses"
          value={`${massWithBounds(event.m1, event.m1lo, event.m1hi)}  +  ${massWithBounds(event.m2, event.m2lo, event.m2hi)}`}
          note="Published source-frame medians with 90% credible intervals."
        />
        <Row
          label="Chirp mass"
          value={mc != null ? `${mc.toFixed(mc < 10 ? 3 : 1)} M☉` : "unknown"}
          note="The combination the waveform actually encodes."
        />
        <Row label="Total mass" value={`${mt.toFixed(1)} M☉`} />
        <Row
          label="Mass ratio"
          value={q != null ? q.toFixed(2) : "unknown"}
        />
        <Row
          label="Remnant"
          value={
            event.mfinal != null
              ? `${event.mfinal.toFixed(1)} M☉${event.afinal != null ? `, spin ${event.afinal.toFixed(2)}` : ""}`
              : "not published"
          }
          note={
            event.mfinal == null
              ? "Typical for neutron-star mergers, where the remnant is not a simple black hole."
              : undefined
          }
        />
        <Row
          label="Energy radiated"
          value={energy ? energyLabel(energy.msun, energy.joules) : "unknown"}
          note={
            energy
              ? "Mass converted straight into gravitational waves."
              : undefined
          }
        />
        <Row
          label="Distance"
          value={distanceLabel(event.dl, ly)}
          note="Light-travel reading is the naive D/c; it drifts from the truth at high redshift."
        />
        <Row
          label="Redshift"
          value={event.z != null ? event.z.toFixed(2) : "unknown"}
        />
        <Row
          label="Effective spin (χ_eff)"
          value={event.chiEff != null ? event.chiEff.toFixed(2) : "unknown"}
          note="Measured. Near zero means the non-spinning ringdown estimate is a fair approximation."
        />
        <Row
          label="Merger frequency"
          value={
            isco != null
              ? `${freqLabel(isco)} (ISCO)${ring ? ` · ${freqLabel(ring.hz)} ringdown${ring.estimated ? " (est.)" : ""}` : ""}`
              : "unknown"
          }
          note={
            ring?.estimated
              ? "ISCO underestimates the true peak. The ringdown note is the honest high end; its spin is estimated from the mass ratio assuming non-spinning components, so compare it with the effective spin below."
              : "ISCO underestimates the true peak; the ringdown note is the honest high end."
          }
        />
        <Row
          label="Peak strain at Earth"
          value={h != null ? strainLabel(h) : "unknown"}
          note="Order of magnitude: no inclination or antenna pattern."
        />
        <Row
          label="Time in band from 20 Hz"
          value={
            inBand != null
              ? inBand >= 1
                ? `${inBand.toFixed(1)} s`
                : `${(inBand * 1000).toFixed(0)} ms`
              : "unknown"
          }
        />
        <Row
          label="Network SNR"
          value={event.snr != null ? event.snr.toFixed(1) : "unknown"}
        />
      </dl>
    </div>
  );
}

/**
 * Opt-in sonification. The sweep is synthesised at the event's TRUE frequency,
 * which for stellar-mass mergers lands inside human hearing with no pitch
 * shifting. Nothing plays until the user clicks.
 */
function ChirpAudio({ event }: { event: GwEvent }) {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const range = audibleRange(event);
  const mc = event.mchirp ?? chirpMass(event.m1, event.m2);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(false);
  }, []);

  useEffect(() => stop, [event.name, stop]);

  const play = useCallback(() => {
    if (mc == null || range == null) return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = ctxRef.current ?? new Ctor();
    ctxRef.current = ctx;
    void ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Stretch the final second of inspiral over `dur` seconds of listening so
    // the sweep is followable. The FREQUENCIES are real; only the pace is slowed,
    // and the UI says so.
    const dur = 6;
    const t0 = ctx.currentTime + 0.05;
    const tStart = timeToMergerS(mc, range.fromHz) ?? 1;
    const steps = 160;
    osc.frequency.setValueAtTime(range.fromHz, t0);
    for (let i = 1; i <= steps; i++) {
      const frac = i / steps;
      const tS = tStart * Math.pow(1 - frac, 2.4);
      const f = tS > 1e-4 ? frequencyAtTimeHz(mc, tS) : range.toHz;
      if (f == null) continue;
      osc.frequency.linearRampToValueAtTime(
        Math.min(Math.max(f, 20), range.toHz),
        t0 + frac * dur,
      );
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.16, t0 + dur * 0.75);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.35);

    osc.start(t0);
    osc.stop(t0 + dur + 0.4);
    setPlaying(true);
    const timer = window.setTimeout(() => setPlaying(false), (dur + 0.5) * 1000);
    stopRef.current = () => {
      window.clearTimeout(timer);
      try {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        osc.stop(ctx.currentTime + 0.02);
      } catch {
        /* already stopped */
      }
    };
  }, [event.name, mc, range]);

  if (!range || mc == null) return null;

  return (
    <div className="hud-panel flex flex-wrap items-center gap-3 rounded-xl p-3">
      <button
        type="button"
        onClick={playing ? stop : play}
        className="flex cursor-pointer items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 text-xs text-ice transition-colors duration-200 hover:bg-white/10"
      >
        {playing ? <SpeakerSlash size={15} /> : <SpeakerHigh size={15} />}
        {playing ? "Stop" : "Hear the chirp"}
      </button>
      <p className="min-w-0 flex-1 text-[11px] leading-snug text-faint">
        Synthesised at the real frequency, {freqLabel(range.fromHz)} to{" "}
        {freqLabel(range.toHz)}
        {range.fromRingdown ? " (ringdown)" : " (ISCO estimate)"}, stretched over
        6 seconds so it is followable. The pitch is real; the pace is slowed. Not
        a LIGO recording.
        {!range.audible &&
          " This system merges below the comfortable hearing range, so expect a low rumble."}
      </p>
    </div>
  );
}

function Honesty({ catalog }: { catalog: GwCatalog }) {
  return (
    <footer className="hud-panel rounded-xl p-4 text-[11px] leading-relaxed text-faint">
      <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
        What is real here
      </h2>
      <ul className="list-disc space-y-1 pl-4">
        <li>
          <span className="text-dim">Real:</span> every mass, distance, redshift,
          remnant spin and SNR, from the published GWOSC catalogues ({catalog.meta.catalogs.join(", ")}),
          retrieved {catalog.meta.retrieved}. {catalog.events.length} events with
          both masses and a distance are shown; entries without published
          parameter estimates are omitted rather than filled in.
        </li>
        <li>
          <span className="text-dim">Computed:</span> the chirp mass, frequency
          sweep, ringdown note, strain scale and radiated energy, from those
          masses via leading-order relativity (see{" "}
          <code>docs/GRAVITATIONAL_WAVES_PHYSICS.md</code>).
        </li>
        <li>
          <span className="text-dim">Not included:</span> the detector strain
          time series, the localisation sky maps, and LIGO&apos;s audio releases.
          The plots and sound are computed, so no event is drawn at a sky position
          and no recording is played.
        </li>
        <li>
          <span className="text-dim">Uncertain:</span> the neutron-star / black-hole
          dividing line. Components between 2 and 5 M☉ are labelled ambiguous.
        </li>
      </ul>
      <p className="mt-3 border-t border-line pt-2">
        {catalog.meta.credit} {catalog.meta.license}
      </p>
    </footer>
  );
}
