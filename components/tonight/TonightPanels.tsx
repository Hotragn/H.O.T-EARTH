"use client";

import type { IssPass } from "@/lib/iss";
import type { ShowerState } from "@/lib/meteor-facts";
import {
  FULL_DARK_HOURS,
  STATE_NOTE,
  type DarknessScore,
  type MoonTonight,
  type NightWindow,
  type PlanetTonight,
} from "@/lib/tonight";
import {
  MOON_INTERFERENCE_COLOR,
  MOON_INTERFERENCE_LABEL,
  PLANET_COLOR,
  TONIGHT_ACCENT,
  VISIBILITY_LABEL,
  compass,
  fmtDeg,
  fmtHours,
  fmtIllumination,
  fmtTime,
} from "./tonightUi";

/**
 * The reading panels for the Tonight tab. Each one answers a sub-question and
 * states its own limit where it has one, so no panel can be quoted out of
 * context: the darkness score says it is not a weather forecast, the planet
 * table says its magnitudes are published ranges rather than tonight's computed
 * values, and the shower rates say they are ideal-condition estimates.
 */

// ─────────────────────────────── the headline ───────────────────────────────

export function VerdictCard({
  night,
  score,
  moon,
}: {
  night: NightWindow;
  score: DarknessScore | null;
  moon: MoonTonight | null;
}) {
  return (
    <section className="hud-panel rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
            Sky darkness tonight
          </h2>
          <div className="mt-1 flex items-baseline gap-2.5">
            <span
              className="font-display text-4xl font-medium tracking-tight"
              style={{ color: TONIGHT_ACCENT }}
            >
              {score ? score.score : "--"}
            </span>
            <span className="font-mono text-[12px] text-dim">/ 100</span>
            <span className="font-mono text-[11px] text-faint">
              {score?.label}
            </span>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          <Stat label="Astronomical dark" value={fmtHours(night.darkHours)} />
          <Stat label="Of that, Moon-free" value={fmtHours(night.moonlessDarkHours)} />
          <Stat
            label="Moon"
            value={moon ? fmtIllumination(moon.illuminatedFraction) : "unknown"}
            color={moon ? MOON_INTERFERENCE_COLOR[moon.interference] : undefined}
          />
        </dl>
      </div>

      {/* the formula, on screen, because a bare score is not auditable */}
      {score && (
        <p className="mt-3 border-t border-line/60 pt-2.5 font-mono text-[10px] leading-relaxed text-faint">
          score = 100 x darkHours/{FULL_DARK_HOURS} (capped at 1, here{" "}
          {score.darkHoursFactor.toFixed(2)}) x (0.35 + 0.65 x moonFreeFraction,
          here {score.moonlessFactor.toFixed(2)}). Only two inputs, both computed
          above. A bright Moon floors the score at 35 rather than zeroing it,
          because the Moon, the planets and the bright stars are all still there.
        </p>
      )}

      <p className="mt-2 text-[11px] leading-snug text-dim">
        {STATE_NOTE[night.state]}
      </p>
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
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </dt>
      <dd
        className="mt-0.5 font-mono text-[13px] text-ice"
        style={color ? { color } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

// ────────────────────────────────── the Moon ────────────────────────────────

export function MoonCard({ moon }: { moon: MoonTonight | null }) {
  if (!moon) {
    return (
      <section className="hud-panel rounded-2xl p-4">
        <p className="font-mono text-[11px] text-dim">
          The Moon could not be computed for this place and time.
        </p>
      </section>
    );
  }
  return (
    <section className="hud-panel rounded-2xl p-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        The Moon
      </h2>
      <p className="mt-1 font-display text-lg font-medium tracking-tight text-ice">
        {moon.phase}
      </p>
      <p
        className="mt-0.5 font-mono text-[11px]"
        style={{ color: MOON_INTERFERENCE_COLOR[moon.interference] }}
      >
        {fmtIllumination(moon.illuminatedFraction)} ·{" "}
        {MOON_INTERFERENCE_LABEL[moon.interference]}
      </p>

      <dl className="mt-3 space-y-1.5">
        <Row label="Rises" value={fmtTime(moon.rise)} />
        <Row label="Sets" value={fmtTime(moon.set)} />
        <Row
          label="Highest"
          value={
            moon.culmination
              ? `${fmtDeg(moon.culmination.maxAltitudeDeg)} at ${fmtTime(moon.culmination.at)}`
              : "not up tonight"
          }
        />
        <Row label="Age" value={`${moon.ageDays.toFixed(1)} days into the cycle`} />
      </dl>

      <p className="mt-3 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
        Phase and position from lib/lunar (Meeus Ch. 47 and 48). Rise and set are
        found by sampling the real altitude and bisecting the crossing, with the
        standard mean-parallax allowance rather than full topocentric parallax, so
        treat them as good to a few minutes.
      </p>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-line/60 pt-1.5 first:border-t-0 first:pt-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
        {label}
      </dt>
      <dd className="font-mono text-[12px] text-ice">{value}</dd>
    </div>
  );
}

// ───────────────────────────────── planets ──────────────────────────────────

export function PlanetsPanel({ planets }: { planets: PlanetTonight[] }) {
  const up = planets.filter((p) => p.worthLooking);
  const down = planets.filter((p) => !p.worthLooking);

  return (
    <section className="hud-panel rounded-2xl p-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        Planets tonight
      </h2>

      {up.length === 0 ? (
        <p className="mt-2 text-[11px] leading-snug text-dim">
          No planet clears 10 degrees while it is dark here tonight. That happens,
          and saying so is more useful than listing something you cannot see.
        </p>
      ) : (
        <ul className="mt-2">
          {up.map((p) => (
            <li
              key={p.body}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-t border-line/60 py-2 first:border-t-0"
            >
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: PLANET_COLOR[p.body] }}
              />
              <span className="min-w-[4.5rem] text-[13px] text-ice">{p.body}</span>
              <span className="font-mono text-[11px] text-dim">
                {fmtDeg(p.best!.maxAltitudeDeg)} high at {fmtTime(p.best!.at)}
              </span>
              <span className="font-mono text-[11px] text-faint">
                {compass(p.azimuthDeg)} · {VISIBILITY_LABEL[p.brightness.visibility]}
              </span>
              <span className="basis-full pl-5 text-[10px] leading-snug text-faint">
                {p.brightness.note}
              </span>
            </li>
          ))}
        </ul>
      )}

      {down.length > 0 && (
        <p className="mt-2.5 border-t border-line/60 pt-2 font-mono text-[10px] leading-snug text-faint">
          Below a useful altitude tonight: {down.map((p) => p.body).join(", ")}.
        </p>
      )}

      <p className="mt-2 text-[10px] leading-snug text-faint">
        The altitude given is the highest each planet reaches INSIDE tonight&apos;s
        dark window, so a planet still climbing when the sky brightens peaks at
        the edge of that window and several can share the same best moment.
        Positions from lib/planets (JPL approximate elements), light-time
        corrected: accurate enough to point at, not for occultation timing.
        Brightness is each planet&apos;s published magnitude range, NOT a
        magnitude computed for tonight, which would need a per-planet
        phase-angle model we have not built.
      </p>
    </section>
  );
}

// ────────────────────────────── meteor showers ──────────────────────────────

export function ShowersPanel({
  showers,
  loaded,
}: {
  showers: ShowerState[];
  loaded: boolean;
}) {
  const active = showers.filter((s) => s.active);
  return (
    <section className="hud-panel rounded-2xl p-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        Meteor showers
      </h2>

      {!loaded ? (
        <p className="mt-2 font-mono text-[11px] text-faint">loading the catalogue</p>
      ) : active.length === 0 ? (
        <p className="mt-2 text-[11px] leading-snug text-dim">
          No catalogued shower is active tonight. Sporadic meteors still appear at
          a handful per hour from a dark site.
        </p>
      ) : (
        <ul className="mt-2">
          {active.map((s) => (
            <li
              key={s.code}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-t border-line/60 py-2 first:border-t-0"
            >
              <span className="min-w-[7rem] text-[13px] text-ice">{s.name}</span>
              <span className="font-mono text-[11px] text-dim">
                {s.radiantUp === false
                  ? "nothing from it yet"
                  : s.estimatedRate !== null
                    ? `~${Math.round(s.estimatedRate)}/h`
                    : "rate not published"}
              </span>
              <span className="font-mono text-[11px] text-faint">
                radiant {s.radiant ? fmtDeg(s.radiant.altitude) : "unknown"}
                {s.radiantUp === false ? ", still below the horizon" : ""}
              </span>
              {s.nearPeak && (
                <span className="font-mono text-[10px] text-solar">near peak</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
        Rates are first-order estimates: the catalogued ZHR scaled by activity and
        by the radiant&apos;s altitude, for an ideal dark sky and a perfect
        observer. Real counts run lower, often much lower. Showers also vary
        year to year in ways no formula predicts. A shower whose radiant has not
        risen yet produces nothing from here for now, which is different from a
        shower the IMO marks variable and publishes no ZHR for.
      </p>
    </section>
  );
}

// ──────────────────────────────── ISS passes ────────────────────────────────

export function IssPanel({
  passes,
  tleAgeDays,
  loaded,
}: {
  passes: IssPass[];
  tleAgeDays: number | null;
  loaded: boolean;
}) {
  const visible = passes.filter((p) => p.visible);
  return (
    <section className="hud-panel rounded-2xl p-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
        Space station passes
      </h2>

      {!loaded ? (
        <p className="mt-2 font-mono text-[11px] text-faint">loading the element set</p>
      ) : visible.length === 0 ? (
        <p className="mt-2 text-[11px] leading-snug text-dim">
          No naked-eye ISS pass over this place tonight. A pass only counts as
          visible when the station is still in sunlight while your sky is already
          dark, which is why they cluster after dusk and before dawn.
        </p>
      ) : (
        <ul className="mt-2">
          {visible.map((p) => (
            <li
              key={p.maxElevationTime.getTime()}
              className="flex flex-wrap items-baseline gap-x-3 border-t border-line/60 py-2 first:border-t-0"
            >
              <span className="min-w-[4.5rem] font-mono text-[12px] text-ice">
                {fmtTime(p.start)}
              </span>
              <span className="font-mono text-[11px] text-dim">
                peaks {fmtDeg(p.maxElevationDeg)} at {fmtTime(p.maxElevationTime)}
              </span>
              <span className="font-mono text-[11px] text-faint">
                {compass(p.startAzimuth)} to {compass(p.endAzimuth)} ·{" "}
                {Math.round(p.durationSeconds / 60)} min
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 border-t border-line/60 pt-2 text-[10px] leading-snug text-faint">
        Propagated with SGP4 from the committed element set
        {tleAgeDays !== null ? `, ${tleAgeDays.toFixed(1)} days old` : ""}. SGP4
        drifts along the track as the elements age, so an older set moves the
        timing by seconds to a minute or two, not the direction.
      </p>
    </section>
  );
}
