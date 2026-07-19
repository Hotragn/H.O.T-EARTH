"use client";

import { useEffect, useMemo, useState } from "react";
import { Circle, EyeSlash, Moon } from "@phosphor-icons/react";
import {
  currentSaturnPhenomena,
  saturnMoonPositions,
  type PhenomenonType,
  type SaturnMoon,
} from "@/lib/saturn-moons";
import {
  MOON_COLORS,
  MOON_DESIGNATION,
  PHENOMENON_META,
  LAST_EQUINOX,
  NEXT_EQUINOX_APPROX,
  dayLabel,
  hhmm,
} from "./saturnUi";

/** One detected event window (a flag was true across a run of samples). */
interface EventWindow {
  moon: SaturnMoon;
  type: PhenomenonType;
  /** window start (ms). If startBefore, it was already active at the scan start. */
  startMs: number;
  /** window end (ms). If endAfter, it was still active at the scan end. */
  endMs: number;
  startBefore: boolean;
  endAfter: boolean;
}

/** Window-length options (days ahead to scan) and the coarse sampling step. */
const WINDOW_OPTIONS = [30, 90, 180] as const;
const STEP_MS = 10 * 60 * 1000; // 10 minutes: coarse by design (honest + cheap)
const DAY_MS = 86_400_000;

/**
 * Coarse forward scan for the four phenomena. The physics lib deliberately has NO
 * fine-grained event scanner (Saturn events are seasonal and sub-minute timing
 * would over-promise), so we sample saturnMoonPositions ourselves at a coarse
 * 10-minute step and record each flag's true-runs as approximate windows. A run
 * already active at the scan start is flagged startBefore; one still active at the
 * end is flagged endAfter. Pure and off the React render path (run in a deferred
 * effect). Guards saturnMoonPositions against null every sample.
 */
function scanSaturnEvents(
  startMs: number,
  endMs: number,
  stepMs: number
): EventWindow[] {
  const out: EventWindow[] = [];
  const open = new Map<string, EventWindow>();
  const prevActive = new Map<string, boolean>();
  const FLAG_ORDER: PhenomenonType[] = [
    "transit",
    "shadow_transit",
    "occultation",
    "eclipse",
  ];

  let first = true;
  for (let t = startMs; t <= endMs; t += stepMs) {
    const positions = saturnMoonPositions(new Date(t));
    if (positions) {
      for (const p of positions) {
        const active: Record<PhenomenonType, boolean> = {
          transit: p.inTransit,
          shadow_transit: p.inShadowTransit,
          occultation: p.inOccultation,
          eclipse: p.inEclipse,
        };
        for (const type of FLAG_ORDER) {
          const key = `${p.moon}|${type}`;
          const now = active[type];
          const was = prevActive.get(key) ?? false;
          if (now && !was) {
            open.set(key, {
              moon: p.moon,
              type,
              startMs: t,
              endMs: t,
              startBefore: first, // active at the very first sample = began earlier
              endAfter: false,
            });
          } else if (!now && was) {
            const w = open.get(key);
            if (w) {
              w.endMs = t;
              out.push(w);
              open.delete(key);
            }
          }
          prevActive.set(key, now);
        }
      }
    }
    first = false;
  }
  // anything still open at the scan end was still active there
  for (const w of open.values()) {
    w.endMs = endMs;
    w.endAfter = true;
    out.push(w);
  }
  out.sort((a, b) => a.startMs - b.startMs);
  return out;
}

interface SaturnMoonsEventsPanelProps {
  nowMs: number;
  /** scrub the scene to this instant (and the parent zooms to the disk) */
  onPickEvent: (ms: number) => void;
}

/**
 * Upcoming Saturn moon events, grouped by local day. Every row is our own COARSE
 * client-side scan of lib/saturn-moons.saturnMoonPositions over the chosen window,
 * paired into approximate transit / shadow-transit / occultation / eclipse
 * windows. Because Saturn's events are seasonal, this list is usually EMPTY away
 * from a ring-plane crossing, and we say so plainly (with the last/next crossing)
 * instead of faking events. The accuracy is loudly labeled approximate and points
 * to JPL Horizons / IMCCE PHESAT; Iapetus is flagged least accurate. Anything in
 * progress now is shown up top. Clicking a row scrubs the scene to that window.
 */
export default function SaturnMoonsEventsPanel({
  nowMs,
  onPickEvent,
}: SaturnMoonsEventsPanelProps) {
  const [windowDays, setWindowDays] = useState<number>(30);
  const [events, setEvents] = useState<EventWindow[] | null>(null);
  const [scanning, setScanning] = useState(false);

  // Recompute at most every 5 minutes of wall-clock (the scan is the heavy call).
  const windowKey = Math.floor(nowMs / (5 * 60 * 1000));

  useEffect(() => {
    let cancelled = false;
    setScanning(true);
    // Defer so the "Scanning…" state paints before the multi-day scan runs.
    const id = setTimeout(() => {
      const start = windowKey * 5 * 60 * 1000;
      const end = start + windowDays * DAY_MS;
      const found = scanSaturnEvents(start, end, STEP_MS);
      if (!cancelled) {
        setEvents(found);
        setScanning(false);
      }
    }, 30);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [windowKey, windowDays]);

  // Current phenomena (happening now), refreshed ~every 20 s.
  const nowKey = Math.floor(nowMs / 20000);
  const current = useMemo(() => {
    return currentSaturnPhenomena(new Date(nowMs)) ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowKey]);

  const groups = useMemo(() => (events ? groupByDay(events) : []), [events]);
  const shadowCount =
    events?.filter((e) => e.type === "shadow_transit").length ?? 0;

  return (
    <section
      aria-label="Upcoming Saturn moon events"
      className="hud-scroll pointer-events-auto absolute right-3 top-20 z-10 max-h-[calc(100dvh-11rem)] w-[330px] overflow-y-auto animate-hud-in sm:right-5 sm:top-24"
    >
      <div className="hud-panel rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-medium text-ice">
            Upcoming events
          </h2>
          <select
            aria-label="Days ahead to scan"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            className="cursor-pointer rounded-lg border border-line bg-black/30 px-2 py-1 font-mono text-[10px] text-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70"
          >
            {WINDOW_OPTIONS.map((d) => (
              <option key={d} value={d}>
                next {d} days
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-dim">
          Approximate transit, shadow transit, occultation and eclipse windows for
          the seven major moons, from a coarse 10-minute scan. Times are local. Tap
          a row to jump the view there.
        </p>

        {/* happening now */}
        {current.length > 0 && (
          <div className="mt-3 rounded-xl border border-solar/40 bg-solar/[0.06] p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-solar/90">
              Happening now
            </p>
            <ul className="mt-1.5 space-y-1">
              {current.map((e) => (
                <li
                  key={`${e.moon}-${e.type}`}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: MOON_COLORS[e.moon] }}
                  />
                  <span className="text-ice">
                    {MOON_DESIGNATION[e.moon]} {e.moon}
                  </span>
                  <span
                    className="ml-auto font-mono text-[10px]"
                    style={{ color: PHENOMENON_META[e.type].accent }}
                  >
                    {PHENOMENON_META[e.type].label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 border-t border-line pt-3">
          {scanning || events === null ? (
            <p className="py-6 text-center font-mono text-[11px] text-faint">
              Scanning {windowDays} days…
            </p>
          ) : events.length === 0 ? (
            <div className="rounded-xl border border-line bg-white/[0.02] p-3">
              <p className="text-[11px] leading-relaxed text-dim">
                No disk transits, shadow transits, occultations or eclipses in the
                next {windowDays} days. That is expected: Saturn&apos;s moon events
                cluster in the season around each ring-plane crossing (about every
                15 years). The last was{" "}
                <span className="text-ice">{LAST_EQUINOX}</span>; the rings are
                opening again toward the next, around{" "}
                <span className="text-ice">{NEXT_EQUINOX_APPROX}</span>. See the
                ring panel for the current opening B.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-2 font-mono text-[10px] text-faint">
                {events.length} window{events.length === 1 ? "" : "s"} ·{" "}
                {shadowCount} shadow transit{shadowCount === 1 ? "" : "s"}
              </p>
              <div className="space-y-3">
                {groups.map((g) => (
                  <div key={g.day}>
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                      {g.day}
                    </p>
                    <ul className="space-y-1.5">
                      {g.items.map((w, i) => (
                        <EventRow
                          key={`${w.moon}-${w.type}-${w.startMs}-${i}`}
                          w={w}
                          onClick={() =>
                            onPickEvent(
                              w.endAfter
                                ? w.startMs
                                : Math.round((w.startMs + w.endMs) / 2)
                            )
                          }
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* honesty: approximate, seasonal, cross-check */}
        <p className="mt-3 border-t border-line pt-3 text-[10px] leading-relaxed text-faint">
          Approximate: from a coarse 10-minute scan of Kepler mean-element
          positions, so short events can be missed and edges are good to about that
          step, degrading far from 2000.{" "}
          <span className="text-faint/90">Iapetus is the least accurate.</span> For
          observing-grade timing, cross-check{" "}
          <a
            href="https://ssd.jpl.nasa.gov/horizons/"
            target="_blank"
            rel="noreferrer"
            className="text-dim transition-colors duration-200 hover:text-ice"
          >
            JPL Horizons
          </a>{" "}
          or{" "}
          <a
            href="https://www.imcce.fr/"
            target="_blank"
            rel="noreferrer"
            className="text-dim transition-colors duration-200 hover:text-ice"
          >
            IMCCE PHESAT
          </a>
          .
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────── event row ─────────────────────────────────

function EventRow({ w, onClick }: { w: EventWindow; onClick: () => void }) {
  const meta = PHENOMENON_META[w.type];
  const startLabel = w.startBefore ? "…" : hhmm(new Date(w.startMs));
  const endLabel = w.endAfter ? "…" : hhmm(new Date(w.endMs));
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full cursor-pointer rounded-xl border px-3 py-2 text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
          meta.emphasize
            ? "border-solar/40 bg-solar/[0.06] hover:bg-solar/[0.1]"
            : "border-line bg-white/[0.02] hover:bg-white/[0.05]"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: MOON_COLORS[w.moon] }}
          />
          <span className="text-[12px] text-ice">
            {MOON_DESIGNATION[w.moon]} {w.moon}
          </span>
          <span className="flex items-center gap-1.5">
            <PhenomenonIcon type={w.type} />
            <span className="font-mono text-[10px]" style={{ color: meta.accent }}>
              {meta.label}
            </span>
          </span>
          {w.moon === "Iapetus" && (
            <span className="ml-auto rounded-full bg-white/5 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-faint">
              least accurate
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 pl-3.5 font-mono text-[11px] text-dim">
          <span className="text-ice">{startLabel}</span>
          <span className="text-faint">→</span>
          <span className="text-ice">{endLabel}</span>
          <span className="ml-1 text-[9px] text-faint">approx</span>
        </div>
      </button>
    </li>
  );
}

function PhenomenonIcon({ type }: { type: PhenomenonType }) {
  const meta = PHENOMENON_META[type];
  const color = meta.accent;
  if (type === "shadow_transit") {
    return <Circle size={11} weight="fill" color="#0b0e16" aria-hidden />;
  }
  if (type === "occultation") {
    return <EyeSlash size={11} weight="regular" color={color} aria-hidden />;
  }
  if (type === "eclipse") {
    return <Moon size={11} weight="fill" color={color} aria-hidden />;
  }
  return <Circle size={11} weight="bold" color={color} aria-hidden />;
}

// ─────────────────────────── grouping helpers ──────────────────────────────

/** Group event windows by the local calendar day of their start, in time order. */
function groupByDay(
  events: EventWindow[]
): Array<{ day: string; items: EventWindow[] }> {
  const groups: Array<{ day: string; items: EventWindow[] }> = [];
  for (const w of events) {
    const day = dayLabel(new Date(w.startMs));
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(w);
    else groups.push({ day, items: [w] });
  }
  return groups;
}
