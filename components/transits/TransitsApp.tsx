"use client";

import { useEffect, useMemo, useState } from "react";
import NavShell from "@/components/ui/NavShell";
import AboutModal from "@/components/ui/AboutModal";
import {
  RATIO_CAVEAT,
  countByMethod,
  derive,
  lightCurve,
  parseTransitPlanets,
  transitDepth,
  transitable,
  type TransitPlanet,
} from "@/lib/transits";

/** Reference depths that make the scale intuitive. All computed, none asserted. */
const REFERENCES = [
  { label: "Earth across the Sun", rp: 1, rs: 1 },
  { label: "Jupiter across the Sun", rp: 11.209, rs: 1 },
];

function ppmLabel(ppm: number | null): string {
  if (ppm == null) return "unknown";
  return ppm >= 10000
    ? `${(ppm / 10000).toFixed(2)}%`
    : `${Math.round(ppm).toLocaleString()} ppm`;
}

function hoursLabel(h: number | null): string {
  if (h == null) return "unknown";
  return h < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(1)} h`;
}

export default function TransitsApp() {
  const [planets, setPlanets] = useState<TransitPlanet[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/data/exoplanets/systems.json")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const rows = parseTransitPlanets(j);
        if (rows.length === 0) setFailed(true);
        else setPlanets(rows);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const drawable = useMemo(
    () => (planets ? transitable(planets) : []),
    [planets],
  );
  const methods = useMemo(
    () => (planets ? countByMethod(planets) : {}),
    [planets],
  );
  // Deepest first: the easiest detections at the top.
  const sorted = useMemo(
    () =>
      [...drawable].sort(
        (a, b) =>
          (transitDepth(b.radiusEarth, b.starRadiusSolar) ?? 0) -
          (transitDepth(a.radiusEarth, a.starRadiusSolar) ?? 0),
      ),
    [drawable],
  );
  const selected = useMemo(
    () => sorted.find((p) => p.name === selectedName) ?? sorted[0] ?? null,
    [sorted, selectedName],
  );
  const d = useMemo(() => (selected ? derive(selected) : null), [selected]);
  const curve = useMemo(
    () => (selected ? lightCurve(selected, 240) : []),
    [selected],
  );

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-abyss">
      <NavShell active="transits" onAbout={() => setAboutOpen(true)} />

      <div className="hud-scroll relative h-full overflow-y-auto px-4 pb-16 pt-28 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6">
            <h1 className="font-display text-2xl font-semibold text-ice sm:text-3xl">
              Transits
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-dim">
              How we know most of those planets are there. When a planet crosses
              its star, the star dims by the ratio of their disc areas. The
              Exoplanets tab asserts radii; this one shows the measurement they
              come from.
            </p>
            {planets && (
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] text-dim">
                <div>
                  <dt className="inline text-faint">drawable </dt>
                  <dd className="inline text-ice">{drawable.length}</dd>
                </div>
                {Object.entries(methods)
                  .sort((a, b) => b[1] - a[1])
                  .map(([m, n]) => (
                    <div key={m}>
                      <dt className="inline text-faint">{m} </dt>
                      <dd className="inline text-ice">{n}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </header>

          {failed && (
            <p className="hud-panel rounded-xl p-4 text-sm text-dim">
              The catalogue could not be loaded, so nothing is shown rather than
              showing invented planets.
            </p>
          )}
          {!planets && !failed && (
            <p className="text-sm text-faint">Loading the catalogue…</p>
          )}

          {selected && d && (
            <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
              {/* list */}
              <section aria-label="Transiting planets" className="min-w-0">
                <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                  Deepest transits first
                </h2>
                <ul className="hud-scroll hud-panel max-h-[56dvh] overflow-y-auto rounded-xl p-1.5">
                  {sorted.map((p) => {
                    const pd = derive(p);
                    const active = p.name === selected.name;
                    return (
                      <li key={p.name}>
                        <button
                          type="button"
                          onClick={() => setSelectedName(p.name)}
                          aria-current={active ? "true" : undefined}
                          className={`w-full cursor-pointer rounded-lg px-2.5 py-2 text-left transition-colors duration-150 ${
                            active ? "bg-white/10" : "hover:bg-white/5"
                          }`}
                        >
                          <span className="block truncate text-[12px] text-ice">
                            {p.name}
                          </span>
                          <span className="block truncate font-mono text-[10px] text-faint">
                            {ppmLabel(pd.ppm)} · {hoursLabel(pd.durationHours)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* detail */}
              <section aria-label="Transit detail" className="min-w-0 space-y-4">
                {/* light curve */}
                <figure className="hud-panel rounded-xl p-4">
                  <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-lg font-semibold text-ice">
                      {selected.name}
                    </span>
                    <span className="font-mono text-[11px] text-faint">
                      {selected.host} · {selected.starTeff ?? "?"} K
                      {selected.distanceLy != null &&
                        ` · ${Math.round(selected.distanceLy)} ly`}
                    </span>
                  </figcaption>
                  <LightCurve curve={curve} depth={d.depth ?? 0} />
                  <p className="mt-2 text-[10px] leading-snug text-faint">
                    Depth and width are computed from the measured radii, period
                    and orbit. The flat-bottomed shape is schematic: real curves
                    are round-bottomed because stars are limb darkened, which this
                    does not model.
                  </p>
                </figure>

                {/* numbers */}
                <div className="hud-panel rounded-xl p-4">
                  <dl className="grid gap-x-6 sm:grid-cols-2">
                    <Row label="Transit depth" value={ppmLabel(d.ppm)} note="Fraction of the star's light blocked." />
                    <Row
                      label="Radius ratio Rp/Rs"
                      value={d.depth != null ? Math.sqrt(d.depth).toFixed(4) : "unknown"}
                      note="This is what a transit actually measures."
                    />
                    <Row
                      label="Planet radius"
                      value={selected.radiusEarth != null ? `${selected.radiusEarth.toFixed(2)} R⊕` : "unknown"}
                      note="Catalogue value (measured)."
                    />
                    <Row
                      label="Star radius"
                      value={selected.starRadiusSolar != null ? `${selected.starRadiusSolar.toFixed(3)} R☉` : "unknown"}
                      note="Catalogue value (measured). The planet's size inherits its error."
                    />
                    <Row
                      label="Central duration"
                      value={hoursLabel(d.durationHours)}
                      note="Maximum for this geometry; an off-centre transit is shorter."
                    />
                    <Row
                      label="Transit probability"
                      value={d.probability != null ? `${(d.probability * 100).toFixed(1)}%` : "unknown"}
                      note="Chance a random orientation shows a transit at all."
                    />
                    <Row
                      label="Period"
                      value={selected.periodDays != null ? `${selected.periodDays.toFixed(3)} d` : "unknown"}
                    />
                    <Row
                      label="Radius round-trip"
                      value={d.radiusRoundTrip != null ? `${d.radiusRoundTrip.toFixed(2)} R⊕` : "unknown"}
                      note="Our depth run backwards through the star radius. It should match the catalogue radius exactly."
                    />
                  </dl>
                </div>

                {/* the scale comparison, all computed */}
                <div className="hud-panel rounded-xl p-4">
                  <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                    Why small cool stars are surveyed
                  </h2>
                  <ul className="mt-2 space-y-1">
                    {REFERENCES.map((r) => {
                      const rd = transitDepth(r.rp, r.rs);
                      return (
                        <li key={r.label} className="flex items-baseline justify-between gap-3">
                          <span className="text-[11px] text-dim">{r.label}</span>
                          <span className="font-mono text-[11px] text-ice">
                            {ppmLabel(rd != null ? rd * 1e6 : null)}
                          </span>
                        </li>
                      );
                    })}
                    <li className="flex items-baseline justify-between gap-3 border-t border-line pt-1">
                      <span className="text-[11px] text-dim">{selected.name}</span>
                      <span className="font-mono text-[11px] text-solar">
                        {ppmLabel(d.ppm)}
                      </span>
                    </li>
                  </ul>
                  <p className="mt-2 text-[10px] leading-snug text-faint">
                    An Earth-sized planet in front of a small star is far easier to
                    detect than the same planet in front of the Sun, because depth
                    depends on the ratio of the two discs, not on the planet alone.
                  </p>
                </div>

                <footer className="hud-panel rounded-xl p-4 text-[11px] leading-relaxed text-faint">
                  <p>
                    <span className="text-dim">A transit measures a ratio.</span>{" "}
                    {RATIO_CAVEAT}
                  </p>
                  <p className="mt-2">
                    <span className="text-dim">Not shown:</span> mass, density and
                    composition (transits do not measure them), impact parameter and
                    inclination (not in this subset, so durations are the
                    central-crossing maximum), limb darkening, and hypothetical
                    transits. Planets found by radial velocity or imaging are
                    excluded rather than drawn with an invented transit.
                  </p>
                  <p className="mt-2 border-t border-line pt-2">
                    Radii, periods and orbits from the NASA Exoplanet Archive subset
                    already shipped for the Exoplanets tab; see
                    <code className="mx-1">docs/EXOPLANETS_DATA_SOURCES.md</code>
                    and <code className="ml-1">docs/TRANSITS_PHYSICS.md</code>.
                  </p>
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
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="border-b border-line py-2 last:border-0">
      <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-ice">{value}</dd>
      {note && <p className="mt-0.5 text-[10px] leading-snug text-faint">{note}</p>}
    </div>
  );
}

/** The computed light curve as an SVG line, with the depth exaggerated to be visible. */
function LightCurve({
  curve,
  depth,
}: {
  curve: Array<{ hours: number; flux: number }>;
  depth: number;
}) {
  if (curve.length < 2) {
    return (
      <p className="text-xs text-faint">
        Not enough published parameters to compute a curve for this planet.
      </p>
    );
  }
  const W = 720;
  const H = 200;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 28;

  const t0 = curve[0].hours;
  const t1 = curve[curve.length - 1].hours;
  // Plot from just above 1 down to a little past the floor, so shallow transits
  // are still legible. The axis is labelled so the zoom is not misleading.
  const floor = 1 - depth;
  const margin = Math.max(depth * 0.35, 1e-6);
  const yTop = 1 + margin * 0.6;
  const yBot = floor - margin;

  const x = (h: number) => padL + ((h - t0) / (t1 - t0)) * (W - padL - padR);
  const y = (f: number) =>
    padT + ((yTop - f) / (yTop - yBot)) * (H - padT - padB);

  const path = curve
    .map((s, i) => `${i === 0 ? "M" : "L"}${x(s.hours).toFixed(1)},${y(s.flux).toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`Computed transit light curve: the star dims by ${(depth * 1e6).toFixed(0)} parts per million over ${(t1 - t0).toFixed(1)} hours.`}
    >
      {/* baseline and floor */}
      {[
        { f: 1, label: "1.000" },
        { f: floor, label: floor.toFixed(depth > 0.001 ? 4 : 6) },
      ].map((g) => (
        <g key={g.label}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(g.f)}
            y2={y(g.f)}
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeDasharray="3 3"
          />
          <text
            x={padL - 6}
            y={y(g.f) + 3}
            textAnchor="end"
            className="fill-current text-[9px] opacity-50"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {g.label}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#8fd3ff" strokeWidth="2" />
      <text
        x={padL}
        y={H - 8}
        className="fill-current text-[9px] opacity-50"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {t0.toFixed(1)} h
      </text>
      <text
        x={(padL + W - padR) / 2}
        y={H - 8}
        textAnchor="middle"
        className="fill-current text-[9px] opacity-50"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        mid-transit
      </text>
      <text
        x={W - padR}
        y={H - 8}
        textAnchor="end"
        className="fill-current text-[9px] opacity-50"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        +{t1.toFixed(1)} h
      </text>
      <text
        x={12}
        y={padT + 6}
        className="fill-current text-[9px] opacity-50"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        flux
      </text>
    </svg>
  );
}
