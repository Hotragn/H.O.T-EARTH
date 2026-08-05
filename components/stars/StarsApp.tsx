"use client";

import { useEffect, useMemo, useState } from "react";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import {
  SELECTION_BIAS_NOTE,
  countByClass,
  hrPoints,
  parseStars,
  spectralClass,
  type LuminosityClass,
  type StarRow,
} from "@/lib/stars";
import HrDiagram, { type HrPoint } from "./HrDiagram";
import {
  CLASS_COLOR,
  LCLASS_LABEL,
  LCLASS_NOTE,
  distLabel,
  lifetimeLabel,
  lumLabel,
  massLabel,
  radiusLabel,
  tempLabel,
} from "./starsUi";

/** Stars worth offering as entry points, if present in the catalogue. */
const FEATURED = [
  "Sirius",
  "Vega",
  "Betelgeuse",
  "Rigel",
  "Aldebaran",
  "Antares",
  "Spica",
  "Arcturus",
  "Capella",
  "Procyon",
  "Altair",
  "Deneb",
  "Polaris",
  "Proxima Centauri",
];

export default function StarsApp() {
  const [rows, setRows] = useState<StarRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/data/night-sky/stars.json")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const parsed = parseStars(j);
        if (parsed.length > 0) setRows(parsed);
        else setFailed(true);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const points: HrPoint[] = useMemo(() => (rows ? hrPoints(rows) : []), [rows]);
  const counts = useMemo(() => countByClass(points), [points]);

  const featured = useMemo(
    () =>
      FEATURED.map((n) => points.find((p) => p.star.name === n)).filter(
        (p): p is HrPoint => !!p,
      ),
    [points],
  );

  const selected = useMemo(
    () =>
      points.find((p) => p.star.id === selectedId) ??
      featured.find((p) => p.star.name === "Sirius") ??
      featured[0] ??
      null,
    [points, selectedId, featured],
  );

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-abyss">
      <NavShell active="stars" onAbout={() => setAboutOpen(true)} />

      <div className="hud-scroll relative h-full overflow-y-auto px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5">
            <h1 className="font-display text-2xl font-semibold text-ice sm:text-3xl">
              Stars
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-dim">
              How stars live and die, from the naked-eye catalogue this app already
              ships. The magnitudes, colours and parallax distances are measured;
              the temperatures, luminosities, radii and lifetimes are{" "}
              <strong className="text-ice">derived from that photometry</strong>,
              which is enough for a real Hertzsprung-Russell diagram and not a
              substitute for spectroscopy.
            </p>
            {rows && (
              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-dim">
                <div>
                  <dt className="inline text-faint">plotted </dt>
                  <dd className="inline text-ice">
                    {points.length.toLocaleString()} of {rows.length.toLocaleString()}
                  </dd>
                </div>
                {(Object.keys(LCLASS_LABEL) as LuminosityClass[]).map((k) =>
                  counts[k] ? (
                    <div key={k}>
                      <dt className="inline text-faint">{LCLASS_LABEL[k]} </dt>
                      <dd className="inline text-ice">{counts[k].toLocaleString()}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            )}
          </header>

          {failed && (
            <p className="hud-panel rounded-xl p-4 text-sm text-dim">
              The star catalogue could not be loaded, so nothing is plotted rather
              than plotting invented stars.
            </p>
          )}
          {!rows && !failed && (
            <p className="text-sm text-faint">Loading the catalogue…</p>
          )}

          {rows && (
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <section aria-label="Hertzsprung-Russell diagram" className="min-w-0">
                <div className="hud-panel rounded-2xl p-3.5">
                  <HrDiagram
                    points={points}
                    selectedId={selected?.star.id ?? null}
                    onSelect={setSelectedId}
                  />
                </div>

                <div className="hud-panel mt-3 rounded-2xl p-3.5">
                  <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                    What this diagram is not
                  </h2>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
                    {SELECTION_BIAS_NOTE}
                  </p>
                  <p className="mt-2 text-[10px] leading-relaxed text-faint">
                    Interstellar dust is not corrected for, so distant stars read
                    cooler and fainter than they are, and luminosities are
                    visual-band rather than bolometric. Classes are read off HR
                    position, which is a weaker claim than a spectroscopic class.
                  </p>
                </div>
              </section>

              <section aria-label="Star detail" className="min-w-0 space-y-3">
                <div className="hud-panel rounded-2xl p-3.5">
                  <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                    Pick a star
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {featured.map((p) => {
                      const active = p.star.id === selected?.star.id;
                      const cl = spectralClass(p.star.spect);
                      return (
                        <button
                          key={p.star.id}
                          type="button"
                          onClick={() => setSelectedId(p.star.id)}
                          className={`flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-colors duration-150 ${
                            active
                              ? "bg-white/10 text-ice"
                              : "text-faint hover:text-dim"
                          }`}
                        >
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: cl ? CLASS_COLOR[cl] : "#9aa2b1",
                            }}
                          />
                          {p.star.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selected && (
                  <div className="hud-panel rounded-2xl p-3.5">
                    <h2 className="font-display text-base font-semibold text-ice">
                      {selected.star.name ?? `HIP ${selected.star.id}`}
                    </h2>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                      {selected.star.spect ?? "type unknown"}
                      {selected.star.con ? ` · ${selected.star.con}` : ""}
                    </p>
                    {selected.derived.lclass && (
                      <p className="mt-2 text-[11px] leading-snug text-dim">
                        <span className="text-ice">
                          {LCLASS_LABEL[selected.derived.lclass]}.
                        </span>{" "}
                        {LCLASS_NOTE[selected.derived.lclass]}
                      </p>
                    )}

                    <dl className="mt-3">
                      <Row label="Distance" value={distLabel(selected.star.distLy)} measured />
                      <Row label="Apparent magnitude" value={selected.star.mag.toFixed(2)} measured />
                      <Row
                        label="Colour index (B−V)"
                        value={selected.star.ci != null ? selected.star.ci.toFixed(3) : "unknown"}
                        measured
                      />
                      <Row
                        label="Absolute magnitude"
                        value={
                          selected.derived.absMag != null
                            ? selected.derived.absMag.toFixed(2)
                            : "unknown"
                        }
                      />
                      <Row label="Temperature" value={tempLabel(selected.derived.temperatureK)} />
                      <Row label="Luminosity" value={lumLabel(selected.derived.luminosity)} />
                      <Row
                        label="Radius"
                        value={radiusLabel(selected.derived.radius)}
                        note={
                          selected.derived.lclass === "supergiant"
                            ? "Order of magnitude only: V-band photometry under-reads a cool supergiant."
                            : undefined
                        }
                      />
                      <Row
                        label="Mass"
                        value={massLabel(selected.derived.massSolar)}
                        note={
                          selected.derived.massSolar == null
                            ? "The mass-luminosity relation only holds on the main sequence, so we do not report one here."
                            : "From the main-sequence mass-luminosity relation."
                        }
                      />
                      <Row
                        label="Main-sequence lifetime"
                        value={lifetimeLabel(selected.derived.lifetimeYears)}
                        note={
                          selected.derived.lifetimeYears != null
                            ? "A scaling law, right to a factor of order unity."
                            : undefined
                        }
                      />
                    </dl>
                    <p className="mt-2 border-t border-line pt-2 text-[10px] leading-snug text-faint">
                      Rows marked <span className="text-dim">measured</span> come
                      straight from the catalogue; the rest are derived from them.
                    </p>
                  </div>
                )}

                <footer className="hud-panel rounded-2xl p-3.5 text-[10px] leading-relaxed text-faint">
                  Star data: HYG database v4.4 (c) astronexus / David Nash, CC BY-SA
                  4.0, compiled from Hipparcos, the Yale Bright Star Catalog and
                  Gliese. Derived subset shared under the same licence. This world
                  ships no new data: it reuses the catalogue behind the Night Sky
                  tab. See docs/STARS_PHYSICS.md for every relation and its bounds.
                </footer>
              </section>
            </div>
          )}
        </div>
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </main>
  );
}

function Row({
  label,
  value,
  note,
  measured,
}: {
  label: string;
  value: string;
  note?: string;
  measured?: boolean;
}) {
  return (
    <div className="border-b border-line py-1.5 last:border-0">
      <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
        {label}
        {measured && (
          <span className="rounded-sm bg-white/[0.06] px-1 py-px text-[8px] tracking-normal text-dim">
            measured
          </span>
        )}
      </dt>
      <dd className="mt-0.5 text-[12px] text-ice">{value}</dd>
      {note && <p className="mt-0.5 text-[10px] leading-snug text-faint">{note}</p>}
    </div>
  );
}
