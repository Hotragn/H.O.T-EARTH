"use client";

import { useEffect, useMemo, useState } from "react";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import {
  LUNAR_TYPE_LABEL,
  LUNAR_TYPE_NOTE,
  SAROS_DAYS,
  SOLAR_TYPE_LABEL,
  SOLAR_TYPE_NOTE,
  VISIBILITY_CAVEAT,
  centrality,
  countByType,
  daysUntil,
  durationLabel,
  meanSarosIntervalDays,
  parseCanon,
  sarosSeries,
  upcoming,
  type EclipseCanon,
  type LunarEclipse,
  type SolarEclipse,
} from "@/lib/eclipses";
import EclipseGlobe from "./EclipseGlobe";
import {
  LUNAR_COLOR,
  SOLAR_COLOR,
  coordLabel,
  countdownLabel,
  isSolar,
  minutesLabel,
  tdLabel,
} from "./eclipsesUi";

type Kind = "solar" | "lunar";

export default function EclipsesApp() {
  const [canon, setCanon] = useState<EclipseCanon | null>(null);
  const [failed, setFailed] = useState(false);
  const [kind, setKind] = useState<Kind>("solar");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    let alive = true;
    fetch("/data/eclipses/canon.json")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const c = parseCanon(j);
        if (c) setCanon(c);
        else setFailed(true);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const all = useMemo<Array<SolarEclipse | LunarEclipse>>(
    () => (canon ? (kind === "solar" ? canon.solar : canon.lunar) : []),
    [canon, kind],
  );
  const next20 = useMemo(() => upcoming(all, now, 20), [all, now]);
  const selected = useMemo(
    () => all.find((e) => e.id === selectedId) ?? next20[0] ?? all[0] ?? null,
    [all, selectedId, next20],
  );
  const counts = useMemo(() => countByType(all), [all]);

  const series = useMemo(
    () => (selected?.saros != null ? sarosSeries(all, selected.saros) : []),
    [all, selected],
  );
  const seriesInterval = useMemo(
    () => (selected?.saros != null ? meanSarosIntervalDays(all, selected.saros) : null),
    [all, selected],
  );

  const typeLabel = kind === "solar" ? SOLAR_TYPE_LABEL : LUNAR_TYPE_LABEL;
  const typeNote = kind === "solar" ? SOLAR_TYPE_NOTE : LUNAR_TYPE_NOTE;
  const color = kind === "solar" ? SOLAR_COLOR : LUNAR_COLOR;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-abyss">
      <EclipseGlobe
        eclipses={next20}
        selectedId={selected?.id ?? null}
        solar={kind === "solar"}
        className="absolute inset-0"
      />

      <NavShell active="eclipses" onAbout={() => setAboutOpen(true)} />

      {/* left: kind switch + upcoming list */}
      <div className="hud-scroll pointer-events-auto absolute bottom-4 left-4 top-28 w-[19rem] max-w-[calc(100vw-2rem)] overflow-y-auto pr-1 sm:top-32">
        <section className="hud-panel rounded-2xl p-3.5">
          <h1 className="font-display text-base font-semibold text-ice">Eclipses</h1>
          {canon ? (
            <p className="mt-1 text-[11px] leading-snug text-dim">
              {canon.meta.counts.solar} solar and {canon.meta.counts.lunar} lunar
              eclipses, {canon.meta.span}, from NASA&apos;s published canon. We
              ship the catalogue rather than predicting eclipses ourselves.
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-faint">
              {failed ? "Catalogue unavailable." : "Loading the canon…"}
            </p>
          )}
          <div className="mt-2.5 flex gap-1">
            {(["solar", "lunar"] as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  setSelectedId(null);
                }}
                className={`flex-1 cursor-pointer rounded-lg px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-150 ${
                  kind === k ? "bg-white/10 text-ice" : "text-faint hover:text-dim"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </section>

        {canon && (
          <>
            <section className="hud-panel mt-3 rounded-2xl p-3.5">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                This century, by type
              </h2>
              <dl className="mt-2 space-y-1">
                {Object.keys(typeLabel).map((t) =>
                  counts[t] ? (
                    <div key={t} className="flex items-baseline justify-between gap-2">
                      <dt className="flex items-center gap-2 text-[11px] text-dim">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: color[t] }}
                        />
                        {typeLabel[t]}
                      </dt>
                      <dd className="font-mono text-[11px] text-ice">{counts[t]}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </section>

            <section className="hud-panel mt-3 rounded-2xl p-3.5">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                Next twenty
              </h2>
              <ul className="mt-2 space-y-0.5">
                {next20.map((e) => {
                  const active = e.id === selected?.id;
                  const d = daysUntil(e.td, now);
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(e.id)}
                        aria-current={active ? "true" : undefined}
                        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 ${
                          active ? "bg-white/10" : "hover:bg-white/5"
                        }`}
                      >
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color[e.type] }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-mono text-[11px] text-ice">
                            {tdLabel(e.td).split(",")[0]}
                          </span>
                          <span className="block truncate text-[10px] text-faint">
                            {typeLabel[e.type] ?? e.type} · {countdownLabel(d)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </div>

      {/* right: detail */}
      {canon && selected && (
        <div className="hud-scroll pointer-events-auto absolute bottom-4 right-4 top-28 w-[19rem] max-w-[calc(100vw-2rem)] overflow-y-auto pl-1 sm:top-32">
          <section className="hud-panel rounded-2xl p-3.5">
            <h2 className="font-display text-base font-semibold text-ice">
              {typeLabel[selected.type] ?? selected.type}{" "}
              {kind === "solar" ? "solar" : "lunar"} eclipse
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-faint">
              {tdLabel(selected.td)}
            </p>
            <p className="mt-2 text-[11px] leading-snug text-dim">
              {typeNote[selected.type]}
            </p>

            <dl className="mt-3 space-y-1.5">
              <Row label="Greatest eclipse at" value={coordLabel(selected.lat, selected.lon)} />
              <Row
                label="Saros series"
                value={selected.saros != null ? String(selected.saros) : "unknown"}
              />
              {isSolar(selected) ? (
                <>
                  <Row
                    label="Magnitude"
                    value={selected.mag != null ? selected.mag.toFixed(4) : "unknown"}
                  />
                  <Row
                    label="Central duration"
                    value={durationLabel(selected.durS) ?? "none (partial)"}
                  />
                  <Row
                    label="Path width"
                    value={selected.pathKm != null ? `${selected.pathKm} km` : "none (partial)"}
                  />
                  <Row
                    label="Sun altitude there"
                    value={selected.sunAlt != null ? `${selected.sunAlt}°` : "unknown"}
                  />
                </>
              ) : (
                <>
                  <Row
                    label="Umbral magnitude"
                    value={selected.umbMag != null ? selected.umbMag.toFixed(4) : "unknown"}
                  />
                  <Row label="Totality" value={minutesLabel(selected.totMin)} />
                  <Row label="Partial phase" value={minutesLabel(selected.parMin)} />
                  <Row label="Penumbral" value={minutesLabel(selected.penMin)} />
                </>
              )}
              <Row
                label="Gamma"
                value={selected.gamma != null ? selected.gamma.toFixed(4) : "unknown"}
                note={centrality(selected.gamma)?.label}
              />
            </dl>
          </section>

          <section className="hud-panel mt-3 rounded-2xl p-3.5">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Saros {selected.saros ?? "?"}
            </h2>
            <p className="mt-1.5 text-[11px] leading-snug text-dim">
              {series.length} member{series.length === 1 ? "" : "s"} of this series
              fall inside {canon.meta.span}.
              {seriesInterval != null && (
                <>
                  {" "}
                  They are spaced{" "}
                  <span className="text-ice">{seriesInterval.toFixed(1)} days</span>{" "}
                  apart on average, which is the saros ({SAROS_DAYS.toFixed(1)} days,
                  or 18 years 11 days 8 hours).
                </>
              )}
            </p>
            <p className="mt-2 text-[10px] leading-snug text-faint">
              One saros returns the Moon to the same phase, distance and node, so
              the eclipse nearly repeats. The extra 8 hours is why each repeat
              lands about a third of the way around the world further west.
            </p>
          </section>

          <footer className="hud-panel mt-3 rounded-2xl p-3.5 text-[10px] leading-relaxed text-faint">
            <p>
              <span className="text-dim">Times are TD.</span> {canon.meta.timeScale}
            </p>
            <p className="mt-2">
              <span className="text-dim">No paths, no visibility.</span>{" "}
              {VISIBILITY_CAVEAT}
            </p>
            <p className="mt-2 border-t border-line pt-2">
              {canon.meta.credit}. Retrieved {canon.meta.retrieved}.{" "}
              <a
                href={canon.meta.urls[kind]}
                target="_blank"
                rel="noreferrer"
                className="text-amber-200/80 transition-colors duration-200 hover:text-amber-100"
              >
                source catalogue
              </a>
              .
            </p>
          </footer>
        </div>
      )}

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
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
    <div className="border-b border-line pb-1.5 last:border-0 last:pb-0">
      <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
        {label}
      </dt>
      <dd className="mt-0.5 text-[12px] text-ice">{value}</dd>
      {note && <p className="mt-0.5 text-[10px] leading-snug text-faint">{note}</p>}
    </div>
  );
}
