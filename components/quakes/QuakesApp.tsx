"use client";

import { useEffect, useMemo, useState } from "react";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import BootScreen from "@/components/ui/BootScreen";
import {
  akiBValue,
  completenessMagnitude,
  GLOBAL_COMPLETENESS_MAG,
  countByDepthClass,
  gutenbergRichterFit,
  largestEnergyShare,
  magnitudeBins,
  parseUsgsFeed,
  stableCompleteness,
  type Quake,
  type QuakeCatalogue,
} from "@/lib/quakes";
import { OBSERVER_STORAGE_KEY } from "@/components/tonight/tonightUi";
import SeismicGlobe from "./SeismicGlobe";
import FrequencyMagnitudeChart from "./FrequencyMagnitudeChart";
import {
  QuakeDetail,
  QuakeList,
  QuakesHonesty,
  SummaryCard,
} from "./QuakePanels";
import { FEED_DAY, FEED_WEEK, USGS_FEED_PAGE } from "./quakesUi";

/**
 * Seismic Earth: the solid planet, live.
 *
 * Until now every Earth-group world in this app has been about the sky over the
 * planet: light, weather, satellites, eclipses. This one is about the planet
 * itself breaking, which is the other half of a digital twin of Earth.
 *
 * Two USGS feeds, read live, no key: the last 24 hours for the globe and the
 * list, and the 2.5+ week catalogue for the statistics, because a single day
 * does not hold enough events above the completeness magnitude to fit a slope
 * through honestly. Everything numeric on the page (energy, moment, depth
 * classes, the b-value, distances, wave arrivals) is computed here by
 * lib/quakes from those two files. The feeds carry none of it.
 */
export default function QuakesApp() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [selected, setSelected] = useState<Quake | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  const [day, setDay] = useState<QuakeCatalogue | null>(null);
  const [week, setWeek] = useState<QuakeCatalogue | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  /**
   * The observer, shared with the Tonight tab through the same localStorage
   * key: someone who has told this app where they are once should not have to
   * do it again to find out how far away an earthquake was. Absent, the
   * distance row simply does not appear.
   */
  const [observer, setObserver] = useState<{ latDeg: number; lonDeg: number } | null>(
    null
  );
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
      }
    } catch {
      /* private mode or corrupt value: the distance row stays hidden */
    }
  }, []);

  // ── the two live feeds ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const get = (url: string) =>
      fetch(url, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

    Promise.all([get(FEED_DAY), get(FEED_WEEK)]).then(([d, w]) => {
      if (cancelled) return;
      const dayCat = parseUsgsFeed(d);
      const weekCat = parseUsgsFeed(w);
      setDay(dayCat);
      setWeek(weekCat);
      // Both empty means we could not read USGS at all. Say so; do not dress up
      // an empty page as "a quiet day on Earth", because it is never true.
      setFailed(dayCat.quakes.length === 0 && weekCat.quakes.length === 0);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── the computed statistics ───────────────────────────────────────────────
  const bins = useMemo(() => magnitudeBins(week?.quakes ?? [], 0.1), [week]);

  /**
   * The headline b-value is fitted above the PUBLISHED global completeness
   * magnitude (4.5), not above a cut estimated from this feed.
   *
   * That is not laziness, it is the result of trying the alternatives. Both
   * data-driven estimators in lib/quakes are run below, and on this catalogue
   * both land far too low: maximum curvature finds the peak of the mixture
   * around magnitude 1, and b-value stability settles on a locally flat stretch
   * around 2, giving b-values near 0.3 to 0.5 against a published global range
   * of 0.8 to 1.2. Neither is a bug in the estimator. A global feed is dozens of
   * regional networks with different thresholds glued together, and no single
   * completeness magnitude makes that mixture complete. Both wrong answers are
   * shown on screen, because the fact that a confident estimator can be this
   * wrong IS the lesson of the panel.
   */
  const primary = useMemo(
    () => akiBValue(week?.quakes ?? [], GLOBAL_COMPLETENESS_MAG, 0.1),
    [week]
  );
  const stable = useMemo(
    () => stableCompleteness(week?.quakes ?? [], { binWidth: 0.1, step: 0.1, window: 5 }),
    [week]
  );
  const naiveMc = useMemo(() => completenessMagnitude(week?.quakes ?? [], 0.1), [week]);
  const naiveB = useMemo(
    () => (naiveMc === null ? null : akiBValue(week?.quakes ?? [], naiveMc, 0.1)),
    [week, naiveMc]
  );
  const fit = useMemo(
    () => gutenbergRichterFit(week?.quakes ?? [], GLOBAL_COMPLETENESS_MAG, 0.1),
    [week]
  );
  const depthCounts = useMemo(() => countByDepthClass(week?.quakes ?? []), [week]);
  const energyShare = useMemo(() => largestEnergyShare(week?.quakes ?? []), [week]);

  const globeQuakes = useMemo(() => {
    // The globe shows the week, so the plate boundaries have a chance to appear.
    // The list stays on the last 24 hours, which is what "live" means.
    return week?.quakes ?? [];
  }, [week]);

  if (loading) {
    return <BootScreen label="Reading the live USGS earthquake feeds" />;
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-abyss">
      {/* the globe is the main screen */}
      {!failed && (
        <SeismicGlobe
          quakes={globeQuakes}
          selectedId={selected?.id ?? null}
          onSelect={(q) => {
            setSelected(q);
            setAutoRotate(false);
          }}
          autoRotate={autoRotate}
        />
      )}

      {/*
        Chrome at z-40, matching the site convention: tab content below 40, nav
        at 40, modals at 55+.
      */}
      <div className="pointer-events-none absolute inset-0 z-40">
        <NavShell onAbout={() => setAboutOpen(true)} active="quakes" />

        {failed ? (
          <div className="pointer-events-auto absolute inset-x-0 top-1/2 mx-auto max-w-lg -translate-y-1/2 px-5">
            <div className="hud-panel rounded-2xl border border-amber-400/25 p-5 text-center">
              <h2 className="font-display text-lg font-medium tracking-tight text-ice">
                The USGS feed could not be reached
              </h2>
              <p className="mt-2 text-[12px] leading-relaxed text-dim">
                This tab reads live and commits no mirror on purpose. An orbital
                element set is a stale state you can still propagate; a stale
                list of earthquakes is just yesterday&apos;s events shown as
                today&apos;s. So it shows nothing rather than something wrong.
              </p>
              <a
                href={USGS_FEED_PAGE}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block font-mono text-[11px] text-amber-200/80 transition-colors duration-200 hover:text-amber-100"
              >
                the USGS feeds, direct
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* left column: the live list and the selected event */}
            <div className="hud-scroll pointer-events-auto absolute left-3 top-24 flex max-h-[calc(100dvh-9rem)] w-[340px] flex-col gap-3 overflow-y-auto animate-hud-in sm:left-5 sm:top-28">
              <QuakeDetail quake={selected} observer={observer} />
              <QuakeList
                quakes={day?.quakes ?? []}
                selectedId={selected?.id ?? null}
                onSelect={(q) => {
                  setSelected(q);
                  setAutoRotate(false);
                }}
                now={now}
              />
            </div>

            {/* right column: the summary and the load-bearing honesty panel */}
            <div className="hud-scroll pointer-events-auto absolute right-3 top-24 flex max-h-[calc(100dvh-9rem)] w-[330px] flex-col gap-3 overflow-y-auto animate-hud-in sm:right-5 sm:top-28">
              {day && week && (
                <SummaryCard
                  day={day}
                  week={week}
                  fit={fit}
                  primary={primary}
                  stable={stable}
                  naiveMc={naiveMc}
                  naiveB={naiveB?.b ?? null}
                  depthCounts={depthCounts}
                  energyShare={energyShare}
                />
              )}
              <QuakesHonesty />
            </div>

            {/*
              Centre stage, lower half: the chart. The galaxies lesson applies
              here too, so the middle of the screen carries the globe above and
              the frequency-magnitude distribution below, rather than leaving a
              wide empty gap between two HUD columns.
            */}
            <div className="pointer-events-auto absolute bottom-3 left-1/2 hidden w-[min(52rem,calc(100vw-46rem))] -translate-x-1/2 animate-hud-in xl:block">
              <FrequencyMagnitudeChart bins={bins} fit={fit} primary={primary} />
            </div>

          </>
        )}
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}
