"use client";

import { useCallback, useMemo, useState } from "react";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import {
  accuracyNote,
  altitudeShells,
  countByRegime,
  elementSetAgeDays,
  type OrbitRegime,
  type SatRecord,
} from "@/lib/satellites";
import SatellitesCanvas from "./SatellitesCanvas";
import { useSatellites } from "./useSatellites";
import {
  DEBRIS_GROUPS,
  DEBRIS_STORY,
  GROUP_COLOR,
  REGIME_LABEL,
  countLabel,
} from "./satellitesUi";

/** Hex to normalised rgb, for the point cloud's vertex colours. */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export default function SatellitesApp() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [exaggerate, setExaggerate] = useState(true);

  const colorFor = useCallback(
    (o: SatRecord) => rgb(GROUP_COLOR[o.g] ?? "#9aa2b1"),
    [],
  );
  const visible = useCallback((o: SatRecord) => !hidden.has(o.g), [hidden]);

  // True scale puts LEO almost on the surface, so the default exaggerates
  // altitude for visibility and says so.
  const { catalog, failed, positions, colors, resolved, at } = useSatellites(
    colorFor,
    visible,
    exaggerate ? 6 : 1,
  );

  const shown = useMemo(
    () => (catalog ? catalog.objects.filter((o) => !hidden.has(o.g)) : []),
    [catalog, hidden],
  );
  const regimes = useMemo(() => countByRegime(shown), [shown]);
  const shells = useMemo(() => altitudeShells(shown, 100, 2000), [shown]);
  const maxShell = Math.max(1, ...shells.map((s) => s.count));

  const iss = useMemo(
    () => catalog?.objects.find((o) => o.i === 25544) ?? null,
    [catalog],
  );
  const issAge = iss ? elementSetAgeDays(iss.e, at) : null;

  const toggle = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-abyss">
      <SatellitesCanvas
        positions={positions}
        colors={colors}
        className="absolute inset-0"
      />

      <NavShell active="satellites" onAbout={() => setAboutOpen(true)} />

      {/* left: groups + congestion */}
      <div className="hud-scroll pointer-events-auto absolute bottom-4 left-4 top-28 w-[19rem] max-w-[calc(100vw-2rem)] overflow-y-auto pr-1 sm:top-32">
        <section className="hud-panel rounded-2xl p-3.5">
          <h1 className="font-display text-base font-semibold text-ice">
            Satellites &amp; debris
          </h1>
          {catalog ? (
            <p className="mt-1 text-[11px] leading-snug text-dim">
              {catalog.meta.totalTracked.toLocaleString()} objects tracked in these
              groups; {catalog.meta.totalShipped.toLocaleString()} drawn, propagated
              live with SGP4 from real element sets.
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-faint">
              {failed ? "Catalogue unavailable." : "Loading the catalogue…"}
            </p>
          )}
        </section>

        {catalog && (
          <>
            <section className="hud-panel mt-3 rounded-2xl p-3.5">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                Groups
              </h2>
              <ul className="mt-2 space-y-1">
                {catalog.meta.groups.map((g) => {
                  const off = hidden.has(g.id);
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => toggle(g.id)}
                        aria-pressed={!off}
                        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 hover:bg-white/5 ${off ? "opacity-40" : ""}`}
                      >
                        <span
                          aria-hidden
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: GROUP_COLOR[g.id] }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] text-ice">
                            {g.label}
                          </span>
                          <span className="block truncate font-mono text-[10px] text-faint">
                            {countLabel(g.shipped, g.tracked)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 border-t border-line pt-2 text-[10px] leading-snug text-faint">
                Starlink is evenly sampled for performance. The tracked count is
                the real one; the drawn count is what you see.
              </p>
            </section>

            <section className="hud-panel mt-3 rounded-2xl p-3.5">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                Where the congestion is
              </h2>
              <ul className="mt-2 space-y-0.5">
                {shells.map((s) => (
                  <li key={s.fromKm} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-right font-mono text-[9px] text-faint">
                      {s.fromKm}–{s.toKm}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <span
                        className="block h-full rounded-full bg-solar/70"
                        style={{ width: `${(s.count / maxShell) * 100}%` }}
                      />
                    </span>
                    <span className="w-9 shrink-0 font-mono text-[9px] text-dim">
                      {s.count}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] leading-snug text-faint">
                Drawn objects per 100 km shell, low Earth orbit only. This is
                where the tracked population clusters, not a collision risk.
              </p>
            </section>
          </>
        )}
      </div>

      {/* right: regimes, scale, honesty */}
      {catalog && (
        <div className="hud-scroll pointer-events-auto absolute bottom-4 right-4 top-28 w-[18rem] max-w-[calc(100vw-2rem)] overflow-y-auto pl-1 sm:top-32">
          <section className="hud-panel rounded-2xl p-3.5">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Orbit regimes
            </h2>
            <dl className="mt-2 space-y-1">
              {(Object.keys(regimes) as OrbitRegime[]).map((r) => (
                <div key={r} className="flex items-baseline justify-between gap-2">
                  <dt className="text-[11px] text-dim">{REGIME_LABEL[r]}</dt>
                  <dd className="font-mono text-[11px] text-ice">
                    {regimes[r].toLocaleString()}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[10px] leading-snug text-faint">
              Boundaries are the conventional ones, not laws of nature. An object
              at geostationary altitude but steeply inclined counts as MEO here,
              because it is geosynchronous rather than geostationary.
            </p>
          </section>

          <section className="hud-panel mt-3 rounded-2xl p-3.5">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Altitude scale
            </h2>
            <div className="mt-2 flex gap-1">
              {[
                { on: !exaggerate, label: "True", v: false },
                { on: exaggerate, label: "×6", v: true },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => setExaggerate(b.v)}
                  className={`flex-1 cursor-pointer rounded-lg px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-150 ${
                    b.on ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-snug text-faint">
              At true scale the whole low-orbit population hugs the surface, which
              is itself the point: it is much closer than it feels. ×6 lifts it for
              visibility and is not a real altitude.
            </p>
          </section>

          {/* the debris comparison the data actually supports */}
          <section className="hud-panel mt-3 rounded-2xl p-3.5">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Three fragmentation events
            </h2>
            <ul className="mt-2 space-y-2">
              {catalog.meta.groups
                .filter((g) => DEBRIS_GROUPS.has(g.id))
                .map((g) => (
                  <li key={g.id}>
                    <p className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] text-ice">{g.label}</span>
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: GROUP_COLOR[g.id] }}
                      >
                        {g.tracked}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[10px] leading-snug text-faint">
                      {DEBRIS_STORY[g.id]}
                    </p>
                  </li>
                ))}
            </ul>
            <p className="mt-2 border-t border-line pt-2 text-[10px] leading-snug text-faint">
              Altitude decides how long debris lasts: the 2021 test was low enough
              that drag has cleared nearly all of it, while the 2007 cloud is still
              the largest tracked.
            </p>
          </section>

          <footer className="hud-panel mt-3 rounded-2xl p-3.5 text-[10px] leading-relaxed text-faint">
            <p>
              {iss && issAge != null
                ? accuracyNote(issAge)
                : "Element-set ages are shown per object."}{" "}
              Positions are SGP4, the model these element sets are defined for, so
              they are only as fresh as the sets themselves.
            </p>
            <p className="mt-2">
              <span className="text-dim">Not shown:</span> conjunction or collision
              predictions (public element sets carry no covariance), untracked
              fragments below roughly 10 cm, and object sizes. Markers are a fixed
              size, not physical scale.
            </p>
            <p className="mt-2 border-t border-line pt-2">
              {catalog.meta.credit}. Retrieved {catalog.meta.retrieved}; a committed
              mirror, per CelesTrak&apos;s usage policy. {resolved.toLocaleString()}{" "}
              objects resolved this tick.
            </p>
          </footer>
        </div>
      )}

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}
