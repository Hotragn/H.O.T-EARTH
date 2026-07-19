"use client";

import { useEffect, useMemo, useState } from "react";
import { Circle, EyeSlash, Moon } from "@phosphor-icons/react";
import {
  OTHER_MOONS,
  otherMoonPositions,
  planetGeocentric,
  type OtherMoon,
  type OtherPlanet,
  type PhenomenonType,
} from "@/lib/other-moons";
import {
  MOON_COLORS,
  MOON_DESIGNATION,
  PHENOMENON_META,
  dayLabel,
  hhmm,
} from "./otherMoonsUi";

/** One detected event window (a flag was true across a run of samples). */
interface EventWindow {
  moon: OtherMoon;
  type: PhenomenonType;
  startMs: number;
  endMs: number;
  startBefore: boolean;
  endAfter: boolean;
}

/** Window-length options (days ahead to scan). */
const WINDOW_OPTIONS = [7, 30, 90] as const;
const DAY_MS = 86_400_000;

/**
 * Coarse sampling step per planet. Phobos laps Mars in ~7.65 h, so Mars needs a
 * fine step (10 min) to catch its short transits/occultations; the Uranian and
 * Neptunian systems produce essentially nothing from Earth, so an hourly step is
 * plenty. Deliberately coarse (honest + cheap): short events can be missed.
 */
function stepMsFor(planet: OtherPlanet): number {
  return planet === "Mars" ? 10 * 60 * 1000 : 60 * 60 * 1000;
}

/**
 * Coarse forward scan for the four phenomena. The physics lib deliberately has NO
 * fine-grained event scanner (these are rare-to-unobservable and sub-minute timing
 * would over-promise), so we sample otherMoonPositions ourselves and record each
 * flag's true-runs as approximate windows. Pure and off the React render path (run
 * in a deferred effect). Guards otherMoonPositions against null every sample.
 */
function scanOtherEvents(
  planet: OtherPlanet,
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
    const positions = otherMoonPositions(planet, new Date(t));
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
              startBefore: first,
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
  for (const w of open.values()) {
    w.endMs = endMs;
    w.endAfter = true;
    out.push(w);
  }
  out.sort((a, b) => a.startMs - b.startMs);
  return out;
}

interface OtherMoonsConfigPanelProps {
  planet: OtherPlanet;
  /** displayed instant (ms), throttled from the parent clock (for the live config) */
  displayedMs: number;
  /** wall-clock now (ms), for the forward scan baseline */
  nowMs: number;
  /** scrub the scene to this instant */
  onPickEvent: (ms: number) => void;
}

/**
 * The configuration view (the twin of the Saturn EventsPanel, reframed). It leads
 * with the honest framing: from Earth these disks are tiny (Mars ~4-25", Uranus
 * ~3.7", Neptune ~2.3"), so moon transits and shadows across them are
 * rare-to-unobservable. The primary content is the LIVE CONFIGURATION: each
 * moon&apos;s current elongation in planet radii AND in arcseconds, and whether it
 * is in front, behind or over the disk. A coarse forward scan is offered as a
 * secondary, honestly-labeled layer (usually empty for Uranus/Neptune; Mars can
 * show real Phobos/Deimos events). Everything is COMPUTED from lib/other-moons;
 * every call is guarded against null. Triton and Nereid are flagged least accurate
 * and the panel points to JPL Horizons for precise work.
 */
export default function OtherMoonsConfigPanel({
  planet,
  displayedMs,
  nowMs,
  onPickEvent,
}: OtherMoonsConfigPanelProps) {
  // Live configuration at the displayed instant.
  const config = useMemo(() => {
    const date = new Date(displayedMs);
    const geo = planetGeocentric(planet, date);
    const positions = otherMoonPositions(planet, date);
    if (!geo || !positions) return null;
    const arcsecPerReq = geo.angularDiameterArcsec / 2;
    return { positions, arcsecPerReq, diskArcsec: geo.angularDiameterArcsec };
  }, [planet, displayedMs]);

  // Forward scan.
  const [windowDays, setWindowDays] = useState<number>(30);
  const [events, setEvents] = useState<EventWindow[] | null>(null);
  const [scanning, setScanning] = useState(false);

  // Recompute at most every 5 minutes of wall-clock, or when planet/window changes.
  const windowKey = Math.floor(nowMs / (5 * 60 * 1000));

  useEffect(() => {
    let cancelled = false;
    setScanning(true);
    const id = setTimeout(() => {
      const start = windowKey * 5 * 60 * 1000;
      const end = start + windowDays * DAY_MS;
      const found = scanOtherEvents(planet, start, end, stepMsFor(planet));
      if (!cancelled) {
        setEvents(found);
        setScanning(false);
      }
    }, 30);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [planet, windowKey, windowDays]);

  const groups = useMemo(() => (events ? groupByDay(events) : []), [events]);

  return (
    <section
      aria-label={`${planet} moon configuration`}
      className="hud-scroll pointer-events-auto absolute right-3 top-32 z-10 max-h-[calc(100dvh-13rem)] w-[330px] overflow-y-auto animate-hud-in sm:right-5 sm:top-36"
    >
      <div className="hud-panel rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-medium text-ice">
            Configuration view
          </h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-faint">
            not an events clock
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-dim">
          From Earth these disks are tiny{" "}
          {config ? `(${planet} ${config.diskArcsec.toFixed(1)}″ now)` : ""}, so a
          moon crossing in front, casting a shadow, or being occulted is rare to
          effectively unobservable. What is real and live is each moon&apos;s
          position. This panel shows that, honestly.
        </p>

        {/* live configuration */}
        <div className="mt-3 border-t border-line pt-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            Live configuration
          </p>
          {!config ? (
            <p className="mt-2 text-[11px] text-faint">
              Configuration unavailable for this instant.
            </p>
          ) : (
            <>
              <ul className="mt-2 space-y-1.5">
                {config.positions.map((p) => {
                  const elong = Math.hypot(p.x, p.y);
                  const side = p.x >= 0 ? "W" : "E";
                  const overDisk = elong < 1;
                  const phen = p.inTransit
                    ? "transit"
                    : p.inShadowTransit
                      ? "shadow transit"
                      : p.inOccultation
                        ? "occulted"
                        : p.inEclipse
                          ? "eclipsed"
                          : p.frontOfDisk
                            ? "in front"
                            : "behind";
                  const phenColor =
                    p.inTransit || p.inShadowTransit || p.inOccultation || p.inEclipse
                      ? "text-ice"
                      : "text-faint";
                  return (
                    <li key={p.moon} className="text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: MOON_COLORS[p.moon] }}
                        />
                        <span className="text-ice">
                          {MOON_DESIGNATION[p.moon]} {p.moon}
                        </span>
                        {OTHER_MOONS[p.moon].leastAccurate && (
                          <span
                            className="font-mono text-[8.5px] uppercase tracking-wider text-faint"
                            title="Flagged least accurate here (cross-check JPL Horizons)"
                          >
                            ~approx
                          </span>
                        )}
                        <span className={`ml-auto font-mono text-[9px] ${phenColor}`}>
                          {phen}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 pl-3.5 font-mono text-[10px] text-dim">
                        <span>
                          {elong.toFixed(1)} R {side}
                        </span>
                        <span className="text-faint">·</span>
                        <span>{(elong * config.arcsecPerReq).toFixed(1)}″ off centre</span>
                        {overDisk && (
                          <span className="text-solar/80">· over disk</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[10px] leading-relaxed text-faint">
                The disk itself is only{" "}
                <span className="text-dim">{config.diskArcsec.toFixed(1)}″</span>{" "}
                across (1 R ={" "}
                <span className="text-dim">{config.arcsecPerReq.toFixed(2)}″</span>),
                so a moon is only over the disk when its elongation is under 1 R.
              </p>
            </>
          )}
        </div>

        {/* optional forward scan (secondary, honestly labeled) */}
        <div className="mt-3 border-t border-line pt-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
              Forward scan (approximate)
            </p>
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

          {scanning || events === null ? (
            <p className="py-4 text-center font-mono text-[11px] text-faint">
              Scanning {windowDays} days…
            </p>
          ) : events.length === 0 ? (
            <p className="mt-2 rounded-xl border border-line bg-white/[0.02] p-3 text-[11px] leading-relaxed text-dim">
              No disk transits, shadow transits, occultations or eclipses found in
              the next {windowDays} days. For {planet} that is expected: the disk is
              tiny, so these are rare to unobservable. This is the physics, not a
              bug.
            </p>
          ) : (
            <>
              <p className="mb-2 mt-2 font-mono text-[10px] text-faint">
                {events.length} approximate window
                {events.length === 1 ? "" : "s"} · tap to jump the view
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

        {/* honesty: approximate, rare, cross-check */}
        <p className="mt-3 border-t border-line pt-3 text-[10px] leading-relaxed text-faint">
          Approximate: from a coarse scan of Kepler mean-element positions, so short
          events can be missed and edges are good to about the step.{" "}
          <span className="text-faint/90">Triton and Nereid are least accurate.</span>{" "}
          For observing-grade work, cross-check{" "}
          <a
            href="https://ssd.jpl.nasa.gov/horizons/"
            target="_blank"
            rel="noreferrer"
            className="text-dim transition-colors duration-200 hover:text-ice"
          >
            JPL Horizons
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
          {OTHER_MOONS[w.moon].leastAccurate && (
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
