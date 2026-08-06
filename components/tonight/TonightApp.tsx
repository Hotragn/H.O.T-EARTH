"use client";

import { useEffect, useMemo, useState } from "react";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import { ISS_TLE_PATH, parseIssTleData } from "@/lib/iss-facts";
import { nextPasses, tleAgeDays as computeTleAge } from "@/lib/iss";
import {
  SHOWERS_PATH,
  parseShowerCatalog,
  showerState,
  type ShowerState,
} from "@/lib/meteor-facts";
import {
  LIGHT_POLLUTION_CAVEAT,
  NO_WEATHER_CAVEAT,
  PRECISION_CAVEAT,
  TIME_ZONE_CAVEAT,
  darknessScore,
  moonTonight,
  nightWindow,
  planetsTonight,
  type Observer,
} from "@/lib/tonight";
import NightTimeline from "./NightTimeline";
import ObserverPicker from "./ObserverPicker";
import {
  IssPanel,
  MoonCard,
  PlanetsPanel,
  ShowersPanel,
  VerdictCard,
} from "./TonightPanels";
import { OBSERVER_STORAGE_KEY, PRESET_PLACES, fmtTime } from "./tonightUi";

/**
 * Tonight: the one page that answers "what can I see from here, tonight".
 *
 * Every other tab in this app is organised around an OBJECT. This one is
 * organised around a MOMENT and a PLACE, which is the question a person
 * actually has when they walk outside. It is also the only tab that composes
 * four existing worlds at once: the Sun and Moon geometry behind Earth, the
 * planets behind the Solar System orrery, the shower catalogue behind Meteor
 * Showers, and the SGP4 propagator behind the ISS tracker.
 *
 * It fetches no new data and needs no key. Two same-origin static files (the
 * shower catalogue and the committed ISS element set) are the only network
 * traffic, and the page still renders honestly if both fail.
 */
export default function TonightApp() {
  const [aboutOpen, setAboutOpen] = useState(false);

  // ── where and when ────────────────────────────────────────────────────────
  const [observer, setObserver] = useState<Observer>({
    latDeg: PRESET_PLACES[0].latDeg,
    lonDeg: PRESET_PLACES[0].lonDeg,
  });
  const [placeLabel, setPlaceLabel] = useState<string>(PRESET_PLACES[0].label);

  // Restore the remembered place, and only then start computing, so the first
  // paint is not for the wrong hemisphere.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(OBSERVER_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        latDeg?: number;
        lonDeg?: number;
        label?: string;
      };
      if (
        typeof saved?.latDeg === "number" &&
        typeof saved?.lonDeg === "number" &&
        Number.isFinite(saved.latDeg) &&
        Number.isFinite(saved.lonDeg)
      ) {
        setObserver({ latDeg: saved.latDeg, lonDeg: saved.lonDeg });
        setPlaceLabel(saved.label ?? "Custom");
      }
    } catch {
      /* private mode, or corrupt value: the preset stands */
    }
  }, []);

  const changePlace = (next: Observer, label: string) => {
    setObserver(next);
    setPlaceLabel(label);
    try {
      window.localStorage.setItem(
        OBSERVER_STORAGE_KEY,
        JSON.stringify({ ...next, label })
      );
    } catch {
      /* ignore */
    }
  };

  /**
   * The reference instant. Fixed on mount and refreshed every 5 minutes rather
   * than every second: nothing on this page changes meaningfully faster than
   * that, and re-running the whole night's geometry at 1 Hz would burn a phone
   * battery for no gain.
   */
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 5 * 60_000);
    return () => clearInterval(id);
  }, []);
  const now = useMemo(() => new Date(nowMs), [nowMs]);

  // ── the computed night ────────────────────────────────────────────────────
  const night = useMemo(() => nightWindow(now, observer), [now, observer]);
  const moon = useMemo(
    () => moonTonight(night, observer, now),
    [night, observer, now]
  );
  const planets = useMemo(() => planetsTonight(night, observer), [night, observer]);
  const score = useMemo(() => darknessScore(night), [night]);

  // ── the two shipped files ─────────────────────────────────────────────────
  const [tle, setTle] = useState<{ line1: string; line2: string } | null>(null);
  const [issLoaded, setIssLoaded] = useState(false);
  const [showersRaw, setShowersRaw] = useState<ReturnType<
    typeof parseShowerCatalog
  > | null>(null);
  const [showersLoaded, setShowersLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const get = (path: string) =>
      fetch(path)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

    get(ISS_TLE_PATH).then((raw) => {
      if (cancelled) return;
      const parsed = parseIssTleData(raw);
      setTle(parsed ? { line1: parsed.tle.line1, line2: parsed.tle.line2 } : null);
      setIssLoaded(true);
    });
    get(SHOWERS_PATH).then((raw) => {
      if (cancelled) return;
      setShowersRaw(parseShowerCatalog(raw));
      setShowersLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /** ISS passes over the coming night only, so the list matches the timeline. */
  const passes = useMemo(() => {
    if (!tle || !night) return [];
    const from = night.sunset ?? now;
    const until = night.sunrise ?? new Date(from.getTime() + 86_400_000);
    const days = Math.max(
      0.1,
      (until.getTime() - from.getTime()) / 86_400_000
    );
    return nextPasses(tle.line1, tle.line2, observer.latDeg, observer.lonDeg, 0, from, {
      days,
      visibleOnly: false,
    });
  }, [tle, night, observer, now]);

  const tleAge = useMemo(
    () => (tle ? computeTleAge(tle.line1, now) : null),
    [tle, now]
  );

  /** Shower states for the middle of the dark window (or of the night). */
  const showers: ShowerState[] = useMemo(() => {
    if (!showersRaw || !night) return [];
    const start = night.darkStart ?? night.sunset ?? now;
    const end = night.darkEnd ?? night.sunrise ?? new Date(start.getTime() + 6 * 3_600_000);
    const middle = new Date((start.getTime() + end.getTime()) / 2);
    return showersRaw.showers
      .map((s) => showerState(s, observer.latDeg, observer.lonDeg, middle))
      .filter((s): s is ShowerState => s !== null);
  }, [showersRaw, night, observer, now]);

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-abyss">
      {/* a quiet twilight wash, so the page reads as a night page */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(124,156,255,0.10) 0%, rgba(5,6,15,0) 60%), linear-gradient(180deg, #05060f 0%, #03040c 100%)",
        }}
      />

      {/*
        Chrome at z-40, matching the site convention: tab content below 40, nav
        at 40, modals at 55+. This page scrolls, so the header stays fixed rather
        than absolute, and the content is padded past it.
      */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
        <NavShell onAbout={() => setAboutOpen(true)} active="tonight" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-[104px] sm:px-6 sm:pt-[116px]">
        <header className="animate-hud-in">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-faint">
            Tonight
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-medium tracking-tight text-ice sm:text-3xl">
            What you can see from {placeLabel}
          </h1>
          <p className="mt-1.5 max-w-3xl text-[12px] leading-relaxed text-dim">
            One page, computed for your place and this evening: when it actually
            gets dark, whether the Moon is in the way, which planets clear the
            horizon, what the space station is doing, and which showers are
            running. No new data is fetched and no key is used. Every number here
            comes from the same tested physics as the rest of the app.
          </p>
        </header>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <ObserverPicker
            observer={observer}
            label={placeLabel}
            onChange={changePlace}
          />
          <p className="hud-panel rounded-2xl p-3.5 font-mono text-[10px] leading-relaxed text-faint lg:max-w-[19rem]">
            Computed for {fmtTime(now)} your time
            {night?.sunset ? `, night of ${night.sunset.toLocaleDateString()}` : ""}.
            Refreshes every 5 minutes.
          </p>
        </div>

        {!night ? (
          <section className="hud-panel mt-3 rounded-2xl p-4">
            <p className="text-[12px] leading-snug text-dim">
              Tonight could not be computed for those coordinates. Latitude must be
              within 90 degrees and longitude within 180.
            </p>
          </section>
        ) : (
          <>
            <div className="mt-3">
              <VerdictCard night={night} score={score} moon={moon} />
            </div>

            <div className="mt-3">
              <NightTimeline
                night={night}
                moon={moon}
                planets={planets}
                passes={passes}
                observer={observer}
              />
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <MoonCard moon={moon} />
              <PlanetsPanel planets={planets} />
              <ShowersPanel showers={showers} loaded={showersLoaded} />
              <IssPanel passes={passes} tleAgeDays={tleAge} loaded={issLoaded} />
            </div>

            {/* the load-bearing panel */}
            <section className="hud-panel mt-3 rounded-2xl border border-amber-400/25 p-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-200/90">
                What this is not
              </h2>
              <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-dim">
                <li className="border-t border-line/60 pt-2 first:border-t-0 first:pt-0">
                  <span className="text-amber-200/90">Not a weather forecast: </span>
                  {NO_WEATHER_CAVEAT}
                </li>
                <li className="border-t border-line/60 pt-2">
                  <span className="text-sky-300/90">No light pollution: </span>
                  {LIGHT_POLLUTION_CAVEAT}
                </li>
                <li className="border-t border-line/60 pt-2">
                  <span className="text-emerald-300/90">Your clock, not theirs: </span>
                  {TIME_ZONE_CAVEAT}
                </li>
                <li className="border-t border-line/60 pt-2">
                  <span className="text-fuchsia-300/90">Precision: </span>
                  {PRECISION_CAVEAT}
                </li>
              </ul>
            </section>

            <footer className="mt-4 text-center font-mono text-[10px] leading-relaxed text-faint">
              <p>
                Sun geometry lib/solar · Moon Meeus Ch. 47/48 lib/lunar · planets
                JPL approximate elements lib/planets · alt/az Meeus 13.5/13.6
                lib/celestial · showers IAU MDC and IMO via the shipped catalogue
                · ISS element set CelesTrak (US Space Force 18th SDS), propagated
                with SGP4.
              </p>
              <p className="mt-1">
                Coordinates you enter or grant stay in this browser. This app has
                no account, no analytics on this page and no server to send them
                to.
              </p>
            </footer>
          </>
        )}
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}
