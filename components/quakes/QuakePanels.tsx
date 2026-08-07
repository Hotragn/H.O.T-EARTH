"use client";

import {
  COMPLETENESS_CAVEAT,
  ENERGY_CAVEAT,
  GLOBAL_B_VALUE_NOTE,
  GLOBAL_COMPLETENESS_MAG,
  LIVE_DATA_NOTE,
  MC_METHOD_NOTE,
  MAGNITUDE_SCALE_CAVEAT,
  NO_PREDICTION_CAVEAT,
  PLATE_BOUNDARY_NOTE,
  depthClass,
  distanceToQuakeKm,
  energyJoules,
  energyRatio,
  localWaveArrival,
  seismicMomentNm,
  type DepthClass,
  type GutenbergRichterFit,
  type Quake,
  type QuakeCatalogue,
  type StableCompleteness,
} from "@/lib/quakes";
import {
  DEPTH_COLOR,
  DEPTH_LABEL,
  DOCS_BASE,
  QUAKES_ACCENT,
  USGS_CREDIT,
  USGS_FEED_PAGE,
  fmtAgo,
  fmtDepth,
  fmtDistance,
  fmtJoules,
  fmtMag,
  fmtRatio,
  fmtSeconds,
  fmtWhen,
  energyInHumanTerms,
} from "./quakesUi";

/** Moment magnitude scales, the only ones seismic moment may be quoted for. */
const MOMENT_SCALES = new Set(["mw", "mww", "mwb", "mwc", "mwr", "mi", "mwp"]);

// ────────────────────────────── the live list ───────────────────────────────

export function QuakeList({
  quakes,
  selectedId,
  onSelect,
  now,
}: {
  quakes: Quake[];
  selectedId: string | null;
  onSelect: (q: Quake) => void;
  now: Date;
}) {
  return (
    <section className="hud-panel rounded-2xl p-3.5">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        Last 24 hours
      </h2>
      {quakes.length === 0 ? (
        <p className="mt-2 text-[11px] leading-snug text-dim">
          No events in the feed.
        </p>
      ) : (
        <ul className="mt-1.5">
          {quakes.slice(0, 40).map((q) => {
            const cls = depthClass(q.depthKm) ?? "shallow";
            const active = q.id === selectedId;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => onSelect(q)}
                  className={`flex w-full cursor-pointer items-baseline gap-2.5 rounded-lg border-t border-line/60 px-1.5 py-1.5 text-left transition-colors duration-150 first:border-t-0 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70 ${
                    active ? "bg-white/10" : ""
                  }`}
                >
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: DEPTH_COLOR[cls] }}
                  />
                  <span className="w-8 shrink-0 font-mono text-[12px] text-ice">
                    {fmtMag(q.mag)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-dim">
                    {q.place}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-faint">
                    {fmtAgo(q.time, now)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {quakes.length > 40 && (
        <p className="mt-1.5 px-1.5 font-mono text-[10px] text-faint">
          {quakes.length - 40} more in the feed, all of them on the globe.
        </p>
      )}
    </section>
  );
}

// ──────────────────────────── the selected event ────────────────────────────

export function QuakeDetail({
  quake,
  observer,
}: {
  quake: Quake | null;
  observer: { latDeg: number; lonDeg: number } | null;
}) {
  if (!quake) {
    return (
      <section className="hud-panel rounded-2xl p-4">
        <p className="text-[11px] leading-snug text-dim">
          Pick an epicentre on the globe or in the list to see what it means in
          energy, depth and distance.
        </p>
      </section>
    );
  }

  const cls = depthClass(quake.depthKm);
  const energy = energyJoules(quake.mag);
  const humanEnergy = energyInHumanTerms(energy);
  const isMoment = quake.magType ? MOMENT_SCALES.has(quake.magType.toLowerCase()) : false;
  const moment = isMoment ? seismicMomentNm(quake.mag) : null;
  const distance = observer
    ? distanceToQuakeKm(observer.latDeg, observer.lonDeg, quake)
    : null;
  const arrival = distance !== null ? localWaveArrival(distance) : null;

  return (
    <section className="hud-panel rounded-2xl p-4">
      <div className="flex items-baseline gap-2.5">
        <span
          className="font-display text-3xl font-medium tracking-tight"
          style={{ color: QUAKES_ACCENT }}
        >
          {fmtMag(quake.mag)}
        </span>
        <span className="font-mono text-[11px] text-faint">
          {quake.magType ?? "scale not given"}
        </span>
        {quake.tsunami && (
          <span className="rounded-full border border-sky-400/40 px-2 py-0.5 font-mono text-[10px] text-sky-300">
            tsunami message issued
          </span>
        )}
      </div>
      <p className="mt-1 text-[12px] leading-snug text-ice">{quake.place}</p>
      <p className="mt-0.5 font-mono text-[10px] text-faint">
        {fmtWhen(quake.time)} · {quake.latDeg.toFixed(3)}, {quake.lonDeg.toFixed(3)}
      </p>

      <dl className="mt-3">
        <Row
          label="Depth"
          value={fmtDepth(quake.depthKm)}
          note={cls ? DEPTH_LABEL[cls] : undefined}
          color={cls ? DEPTH_COLOR[cls] : undefined}
        />
        <Row
          label="Radiated energy"
          value={fmtJoules(energy)}
          note={humanEnergy ?? undefined}
        />
        {moment !== null ? (
          <Row
            label="Seismic moment"
            value={fmtJoules(moment).replace(" J", " N m")}
            note="Rigidity x fault area x slip. Only quoted because this was measured on a moment scale."
          />
        ) : (
          <Row
            label="Seismic moment"
            value="not quoted"
            note={`Moment is only meaningful for a moment magnitude, and this event was reported as ${quake.magType ?? "an unstated scale"}.`}
          />
        )}
        {distance !== null && (
          <Row
            label="Distance from you"
            value={fmtDistance(distance)}
            note={
              arrival
                ? `P wave would reach you in about ${fmtSeconds(arrival.pSeconds)}, S wave ${fmtSeconds(arrival.sSeconds)}, an S minus P of ${fmtSeconds(arrival.spSeconds)}`
                : "Too far for a crustal travel-time estimate: past about 1,000 km the ray dives into the mantle and a fixed velocity stops being right."
            }
          />
        )}
        <Row
          label="Energy against a magnitude 5"
          value={fmtRatio(energyRatio(quake.mag, 5))}
          note="One magnitude step is about 32 times the energy, two steps is exactly 1,000."
        />
      </dl>

      {quake.url && (
        <a
          href={quake.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block font-mono text-[10px] text-amber-200/80 transition-colors duration-200 hover:text-amber-100"
        >
          this event on the USGS site
        </a>
      )}
    </section>
  );
}

function Row({
  label,
  value,
  note,
  color,
}: {
  label: string;
  value: string;
  note?: string;
  color?: string;
}) {
  return (
    <div className="border-t border-line/60 py-1.5 first:border-t-0 first:pt-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </dt>
      <dd
        className="mt-0.5 font-mono text-[12px] text-ice"
        style={color ? { color } : undefined}
      >
        {value}
      </dd>
      {note && <p className="mt-0.5 text-[10px] leading-snug text-faint">{note}</p>}
    </div>
  );
}

// ─────────────────────────────── the summary ────────────────────────────────

export function SummaryCard({
  day,
  week,
  fit,
  primary,
  stable,
  naiveMc,
  naiveB,
  depthCounts,
  energyShare,
}: {
  day: QuakeCatalogue;
  week: QuakeCatalogue;
  fit: GutenbergRichterFit | null;
  primary: { b: number; sigma: number; n: number } | null;
  stable: StableCompleteness | null;
  naiveMc: number | null;
  naiveB: number | null;
  depthCounts: Record<DepthClass, number>;
  energyShare: { largest: Quake; share: number } | null;
}) {
  const total = depthCounts.shallow + depthCounts.intermediate + depthCounts.deep;
  return (
    <section className="hud-panel rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <Stat label="Located in 24 h" value={day.quakes.length.toLocaleString()} />
        <Stat
          label="Largest today"
          value={
            day.quakes.length
              ? fmtMag(Math.max(...day.quakes.map((q) => q.mag)))
              : "none"
          }
        />
        <Stat label="Week sample" value={week.quakes.length.toLocaleString()} />
        <Stat
          label={`b above M${GLOBAL_COMPLETENESS_MAG}`}
          value={
            primary
              ? `${primary.b.toFixed(2)} ± ${primary.sigma.toFixed(2)}`
              : "not enough data"
          }
          color={QUAKES_ACCENT}
        />
      </div>

      {primary && (
        <p className="mt-3 border-t border-line/60 pt-2.5 text-[11px] leading-relaxed text-dim">
          {GLOBAL_B_VALUE_NOTE} This week&apos;s live catalogue gives{" "}
          <span className="text-ice">
            b = {primary.b.toFixed(2)} ± {primary.sigma.toFixed(2)}
          </span>{" "}
          by Aki maximum likelihood on {primary.n.toLocaleString()} events above
          magnitude {GLOBAL_COMPLETENESS_MAG.toFixed(1)}, the published
          completeness of the global network.
        </p>
      )}

      {/*
        The estimator exhibit, and the most useful thing on this panel.
        Estimating completeness from the feed is the obvious move, and it does
        not work here. Showing both wrong answers next to the published cut is
        more honest and more instructive than quietly picking whichever one
        flattered the result.
      */}
      {(naiveMc !== null || stable) && (
        <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-200/90">
            Why the cut is not estimated from the data
          </p>
          <p className="mt-1 font-mono text-[10px] leading-relaxed text-dim">
            {naiveMc !== null && naiveB !== null && (
              <>
                max curvature: Mc {naiveMc.toFixed(1)} gives b ={" "}
                <span className="text-ice">{naiveB.toFixed(2)}</span>
                <br />
              </>
            )}
            {stable && (
              <>
                b-value stability: Mc {stable.mc.toFixed(1)} gives b ={" "}
                <span className="text-ice">{stable.b.toFixed(2)}</span>
                {stable.converged ? "" : " (never stabilised)"}
                <br />
              </>
            )}
            published cut: Mc {GLOBAL_COMPLETENESS_MAG.toFixed(1)} gives b ={" "}
            <span className="text-ice">
              {primary ? primary.b.toFixed(2) : "n/a"}
            </span>
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-dim">
            {MC_METHOD_NOTE}
          </p>
        </div>
      )}

      {energyShare && (
        <p className="mt-2 text-[11px] leading-relaxed text-dim">
          The single largest event of the week, the{" "}
          <span className="text-ice">
            {fmtMag(energyShare.largest.mag)} {energyShare.largest.place}
          </span>
          , radiated{" "}
          <span className="text-ice">{(energyShare.share * 100).toFixed(1)}%</span> of
          all the seismic energy in this sample. That is the usual pattern: the
          thousands of small events are, energetically, a rounding error.
        </p>
      )}

      {total > 0 && (
        <div className="mt-3 border-t border-line/60 pt-2.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            Depth in the week sample
          </p>
          <div className="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full">
            {(["shallow", "intermediate", "deep"] as const).map((k) =>
              depthCounts[k] > 0 ? (
                <div
                  key={k}
                  style={{
                    width: `${(depthCounts[k] / total) * 100}%`,
                    backgroundColor: DEPTH_COLOR[k],
                  }}
                  title={`${k}: ${depthCounts[k]}`}
                />
              ) : null
            )}
          </div>
          <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-faint">
            shallow {depthCounts.shallow} · intermediate {depthCounts.intermediate} ·
            deep {depthCounts.deep}. Below about 70 km rock at that pressure
            should bend rather than break, so nearly every intermediate and deep
            event sits inside a cold subducting slab. Nothing on Earth breaks
            below about 700 km.
          </p>
        </div>
      )}

      {(day.droppedNonEarthquakes > 0 || week.droppedNonEarthquakes > 0) && (
        <p className="mt-2 font-mono text-[10px] leading-relaxed text-faint">
          Dropped from these numbers:{" "}
          {day.droppedNonEarthquakes + week.droppedNonEarthquakes} events the feed
          marks as something other than an earthquake (quarry blasts, explosions,
          ice quakes). Counted here rather than quietly discarded.
        </p>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </p>
      <p
        className="mt-0.5 font-display text-xl font-medium tracking-tight text-ice"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

// ────────────────────────────── honesty panel ───────────────────────────────

export function QuakesHonesty() {
  return (
    <section className="hud-panel rounded-2xl border border-amber-400/25 p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-200/90">
        What is real, what is computed
      </h2>
      <p className="mt-2 text-[12px] font-medium leading-snug text-ice">
        {LIVE_DATA_NOTE}
      </p>
      <ul className="mt-3 space-y-2 text-[11px] leading-snug text-dim">
        <Item tag="No prediction:" tagClass="text-amber-200/90" body={NO_PREDICTION_CAVEAT} />
        <Item tag="The rollover:" tagClass="text-sky-300/90" body={COMPLETENESS_CAVEAT} />
        <Item tag="Mixed scales:" tagClass="text-fuchsia-300/90" body={MAGNITUDE_SCALE_CAVEAT} />
        <Item tag="Energy, not shaking:" tagClass="text-emerald-300/90" body={ENERGY_CAVEAT} />
        <Item tag="No boundaries shipped:" tagClass="text-amber-200/90" body={PLATE_BOUNDARY_NOTE} />
      </ul>
      <p className="mt-3 border-t border-line/60 pt-2 text-[10px] leading-relaxed text-faint">
        {USGS_CREDIT} Energy, seismic moment, depth classes, the completeness
        estimate, the b-value, distances and wave arrivals are all computed here
        by lib/quakes. The feed supplies none of them.{" "}
        <a
          href={USGS_FEED_PAGE}
          target="_blank"
          rel="noreferrer"
          className="text-amber-200/80 transition-colors duration-200 hover:text-amber-100"
        >
          the feeds
        </a>
        {" · "}
        <a
          href={`${DOCS_BASE}/QUAKES_PHYSICS.md`}
          target="_blank"
          rel="noreferrer"
          className="text-amber-200/80 transition-colors duration-200 hover:text-amber-100"
        >
          the physics
        </a>
      </p>
    </section>
  );
}

function Item({
  tag,
  tagClass,
  body,
}: {
  tag: string;
  tagClass: string;
  body: string;
}) {
  return (
    <li className="border-t border-line/60 pt-2 first:border-t-0 first:pt-0">
      <span className={tagClass}>{tag} </span>
      {body}
    </li>
  );
}
