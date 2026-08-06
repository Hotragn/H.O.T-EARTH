"use client";

import { useMemo } from "react";
import type { IssPass } from "@/lib/iss";
import {
  ASTRONOMICAL_TWILIGHT_DEG,
  CIVIL_TWILIGHT_DEG,
  NAUTICAL_TWILIGHT_DEG,
  SUN_STANDARD_ALT_DEG,
  moonAltitudeDeg,
  sunAltitudeDeg,
  type MoonTonight,
  type NightWindow,
  type Observer,
  type PlanetTonight,
} from "@/lib/tonight";
import { PLANET_COLOR, compass, fmtTime } from "./tonightUi";

/**
 * The night, drawn to scale: sunset on the left, sunrise on the right, and the
 * real computed shape of the darkness in between.
 *
 * Nothing here is decorative. The twilight bands are the actual times the Sun
 * crosses -6, -12 and -18 degrees for this observer; the darkness block is the
 * astronomical night; the Moon bar covers exactly the hours the Moon is above
 * the horizon, which is the single biggest factor in whether the faint half of
 * the sky is available; the planet ticks sit at each planet's highest moment;
 * and the ISS marks are real SGP4 passes.
 *
 * The Sun's altitude curve along the bottom is sampled from the same function
 * the times come from, so the picture and the numbers cannot disagree: if the
 * curve never dips into the astronomical band, the tab says there is no
 * astronomical darkness, and you can see why.
 */

const VB_W = 1000;
const VB_H = 326;
const PAD_L = 54;
const PAD_R = 24;
const BAND_TOP = 34;
const BAND_H = 46;
/**
 * Row geometry. The gaps are deliberate: the dusk and dawn labels hang BELOW the
 * twilight band, so the Moon bar has to start clear of them or a Moon that rises
 * near dawn prints straight through the word "dawn".
 */
const MOON_Y = 112;
const MOON_H = 16;
const PLANET_Y = 152;
/** Label rows for the planet ticks: one above the dots, three below. */
const PLANET_LABEL_DY = [-9, 15, 27, 39];
/** Labels closer together than this on the x axis must move to another row. */
const PLANET_LABEL_GAP = 72;
const CURVE_TOP = 212;
const CURVE_BOTTOM = 288;

/** Sun altitudes mapped onto the curve area: +20 at the top, -40 at the base. */
const ALT_MAX = 20;
const ALT_MIN = -40;

export default function NightTimeline({
  night,
  moon,
  planets,
  passes,
  observer,
}: {
  night: NightWindow;
  moon: MoonTonight | null;
  planets: PlanetTonight[];
  passes: IssPass[];
  observer: Observer;
}) {
  // The drawn window: sunset to sunrise, or the whole 24 h when the Sun does not
  // cross the horizon at all (midnight sun / polar night).
  const { startMs, endMs } = useMemo(() => {
    if (night.sunset && night.sunrise) {
      const pad = (night.sunrise.getTime() - night.sunset.getTime()) * 0.06;
      return {
        startMs: night.sunset.getTime() - pad,
        endMs: night.sunrise.getTime() + pad,
      };
    }
    const anchor = night.darkStart ?? new Date();
    return { startMs: anchor.getTime(), endMs: anchor.getTime() + 86_400_000 };
  }, [night]);

  const span = Math.max(1, endMs - startMs);
  const x = (ms: number) =>
    PAD_L + ((ms - startMs) / span) * (VB_W - PAD_L - PAD_R);
  const inWindow = (d: Date | null): boolean =>
    !!d && d.getTime() >= startMs && d.getTime() <= endMs;

  /** The Sun's altitude curve, sampled every four minutes. */
  const sunPath = useMemo(() => {
    const steps = 240;
    const y = (alt: number) => {
      const t = (alt - ALT_MIN) / (ALT_MAX - ALT_MIN);
      return CURVE_BOTTOM - Math.max(0, Math.min(1, t)) * (CURVE_BOTTOM - CURVE_TOP);
    };
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const ms = startMs + (span * i) / steps;
      const alt = sunAltitudeDeg(new Date(ms), observer.latDeg, observer.lonDeg);
      if (alt === null) continue;
      pts.push(`${x(ms).toFixed(1)},${y(alt).toFixed(1)}`);
    }
    return pts.join(" ");
  }, [startMs, span, observer.latDeg, observer.lonDeg]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Contiguous stretches with the Moon above the horizon. */
  const moonBars = useMemo(() => {
    const bars: Array<[number, number]> = [];
    const step = 5 * 60_000;
    let runStart: number | null = null;
    for (let ms = startMs; ms <= endMs; ms += step) {
      const alt = moonAltitudeDeg(new Date(ms), observer.latDeg, observer.lonDeg);
      const up = alt !== null && alt > 0;
      if (up && runStart === null) runStart = ms;
      if (!up && runStart !== null) {
        bars.push([runStart, ms]);
        runStart = null;
      }
    }
    if (runStart !== null) bars.push([runStart, endMs]);
    return bars;
  }, [startMs, endMs, observer.latDeg, observer.lonDeg]);

  const yForAlt = (alt: number) => {
    const t = (alt - ALT_MIN) / (ALT_MAX - ALT_MIN);
    return CURVE_BOTTOM - Math.max(0, Math.min(1, t)) * (CURVE_BOTTOM - CURVE_TOP);
  };

  // Twilight band edges. Each pair is [from, to] in ms, or null when that band
  // never happens here tonight.
  const bands: Array<{
    label: string;
    from: Date | null;
    to: Date | null;
    fill: string;
  }> = [
    { label: "civil twilight", from: night.sunset, to: night.civilDusk, fill: "rgba(124,156,255,0.16)" },
    { label: "nautical twilight", from: night.civilDusk, to: night.nauticalDusk, fill: "rgba(124,156,255,0.26)" },
    { label: "astronomical twilight", from: night.nauticalDusk, to: night.astronomicalDusk, fill: "rgba(124,156,255,0.36)" },
    { label: "astronomical night", from: night.astronomicalDusk, to: night.astronomicalDawn, fill: "rgba(8,10,24,0.92)" },
    { label: "astronomical twilight", from: night.astronomicalDawn, to: night.nauticalDawn, fill: "rgba(124,156,255,0.36)" },
    { label: "nautical twilight", from: night.nauticalDawn, to: night.civilDawn, fill: "rgba(124,156,255,0.26)" },
    { label: "civil twilight", from: night.civilDawn, to: night.sunrise, fill: "rgba(124,156,255,0.16)" },
  ];

  /** Hour ticks on the real clock. */
  const hourTicks = useMemo(() => {
    const ticks: Array<{ ms: number; label: string }> = [];
    const first = new Date(startMs);
    first.setMinutes(0, 0, 0);
    first.setHours(first.getHours() + 1);
    const stepHours = span > 14 * 3_600_000 ? 2 : 1;
    for (let ms = first.getTime(); ms <= endMs; ms += stepHours * 3_600_000) {
      ticks.push({
        ms,
        label: new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }
    return ticks;
  }, [startMs, endMs, span]);

  /**
   * Planet labels, packed into rows so they never overprint each other.
   *
   * Several planets genuinely share one x here: a planet that is still climbing
   * when astronomical darkness ends peaks at the WINDOW EDGE, so in August from
   * a northern site Saturn, Neptune, Uranus and Mars can all report the same
   * best moment. That is the honest answer (it is the highest each gets while it
   * is dark), but four labels on one tick is unreadable, so each label drops to
   * the next free row and keeps a leader line back to its dot.
   */
  const placedPlanets = useMemo(() => {
    const visible = planets
      .filter((p) => p.worthLooking && p.best && inWindow(p.best.at))
      .map((p) => ({ body: p.body, px: x(p.best!.at.getTime()) }))
      .sort((a, b) => a.px - b.px);

    const lastXInRow: number[] = new Array(PLANET_LABEL_DY.length).fill(-Infinity);
    return visible.map((p) => {
      let row = lastXInRow.findIndex((lx) => p.px - lx >= PLANET_LABEL_GAP);
      if (row === -1) {
        // Every row is crowded: use the one whose last label is furthest left.
        row = lastXInRow.indexOf(Math.min(...lastXInRow));
      }
      lastXInRow[row] = p.px;
      return { ...p, row };
    });
  }, [planets, startMs, span]); // eslint-disable-line react-hooks/exhaustive-deps

  const label = (d: Date | null, text: string, above: boolean) =>
    inWindow(d) ? (
      <g key={`${text}-${d!.getTime()}`}>
        <line
          x1={x(d!.getTime())}
          y1={above ? BAND_TOP - 12 : BAND_TOP + BAND_H}
          x2={x(d!.getTime())}
          y2={above ? BAND_TOP : BAND_TOP + BAND_H + 8}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={1}
        />
        <text
          x={x(d!.getTime())}
          y={above ? BAND_TOP - 16 : BAND_TOP + BAND_H + 20}
          textAnchor="middle"
          fill="rgba(255,255,255,0.6)"
          fontSize={10.5}
          fontFamily="ui-monospace, monospace"
        >
          {text} {fmtTime(d)}
        </text>
      </g>
    ) : null;

  return (
    <figure className="hud-panel rounded-2xl p-4">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-medium tracking-tight text-ice">
          The shape of tonight
        </h2>
        <p className="font-mono text-[10px] text-faint">
          drawn to scale from the computed Sun and Moon altitudes
        </p>
      </figcaption>

      {/*
        On a phone this 1000-unit drawing scales down to about 350px, at which
        point every label is unreadable. Rather than shrink it into decoration,
        keep it at a legible width and let the visitor swipe it.
      */}
      <div className="hud-scroll -mx-1 overflow-x-auto px-1">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="block h-auto w-full min-w-[700px] sm:min-w-0"
        role="img"
        aria-label={
          night.sunset && night.sunrise
            ? `Timeline of tonight from sunset at ${fmtTime(night.sunset)} to sunrise at ${fmtTime(night.sunrise)}, with ${night.darkHours.toFixed(1)} hours of astronomical darkness of which ${night.moonlessDarkHours.toFixed(1)} are Moon-free.`
            : `Timeline of a 24 hour period with no sunrise or sunset: the Sun does not cross the horizon at this latitude right now.`
        }
      >
        {/* twilight bands */}
        {bands.map((b, i) =>
          b.from && b.to && b.to.getTime() > b.from.getTime() ? (
            <rect
              key={`${b.label}-${i}`}
              x={x(b.from.getTime())}
              y={BAND_TOP}
              width={Math.max(0, x(b.to.getTime()) - x(b.from.getTime()))}
              height={BAND_H}
              fill={b.fill}
            />
          ) : null
        )}
        {/* daylight shoulders, so the band block reads as "the night" */}
        {night.sunset && (
          <rect
            x={PAD_L}
            y={BAND_TOP}
            width={Math.max(0, x(night.sunset.getTime()) - PAD_L)}
            height={BAND_H}
            fill="rgba(242,166,59,0.12)"
          />
        )}
        {night.sunrise && (
          <rect
            x={x(night.sunrise.getTime())}
            y={BAND_TOP}
            width={Math.max(0, VB_W - PAD_R - x(night.sunrise.getTime()))}
            height={BAND_H}
            fill="rgba(242,166,59,0.12)"
          />
        )}
        <rect
          x={PAD_L}
          y={BAND_TOP}
          width={VB_W - PAD_L - PAD_R}
          height={BAND_H}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
        />

        {/* the dark block, called out */}
        {night.darkStart && night.darkEnd && (
          <text
            x={(x(night.darkStart.getTime()) + x(night.darkEnd.getTime())) / 2}
            y={BAND_TOP + 28}
            textAnchor="middle"
            fill="rgba(255,255,255,0.72)"
            fontSize={11}
            fontFamily="ui-monospace, monospace"
          >
            astronomical night
          </text>
        )}
        {night.state === "no-astronomical-darkness" && (
          <text
            x={(PAD_L + VB_W - PAD_R) / 2}
            y={BAND_TOP + 28}
            textAnchor="middle"
            fill="rgba(255,210,122,0.9)"
            fontSize={11}
            fontFamily="ui-monospace, monospace"
          >
            never fully dark tonight
          </text>
        )}

        {label(night.sunset, "sunset", true)}
        {label(night.sunrise, "sunrise", true)}
        {label(night.astronomicalDusk, "dark", false)}
        {label(night.astronomicalDawn, "dawn", false)}

        {/* Moon-up bar */}
        <text
          x={PAD_L - 8}
          y={MOON_Y + 12}
          textAnchor="end"
          fill="rgba(255,255,255,0.45)"
          fontSize={10}
          fontFamily="ui-monospace, monospace"
        >
          Moon
        </text>
        <line
          x1={PAD_L}
          y1={MOON_Y + MOON_H / 2}
          x2={VB_W - PAD_R}
          y2={MOON_Y + MOON_H / 2}
          stroke="rgba(255,255,255,0.08)"
        />
        {moonBars.map(([a, b]) => (
          <rect
            key={a}
            x={x(a)}
            y={MOON_Y}
            width={Math.max(1.5, x(b) - x(a))}
            height={MOON_H}
            rx={3}
            fill={`rgba(255,232,180,${0.22 + 0.6 * (moon?.illuminatedFraction ?? 0.5)})`}
          />
        ))}
        {moonBars.length === 0 && (
          <text
            x={PAD_L + 6}
            y={MOON_Y + 12}
            fill="rgba(255,255,255,0.4)"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
          >
            below the horizon all night
          </text>
        )}

        {/* planet culmination ticks */}
        <text
          x={PAD_L - 8}
          y={PLANET_Y + 4}
          textAnchor="end"
          fill="rgba(255,255,255,0.45)"
          fontSize={10}
          fontFamily="ui-monospace, monospace"
        >
          planets
        </text>
        {placedPlanets.map((p) => (
          <g key={p.body}>
            <circle cx={p.px} cy={PLANET_Y} r={4} fill={PLANET_COLOR[p.body]} />
            {p.row > 0 && (
              <line
                x1={p.px}
                y1={PLANET_Y + 4}
                x2={p.px}
                y2={PLANET_Y + PLANET_LABEL_DY[p.row] - 8}
                stroke={PLANET_COLOR[p.body]}
                strokeOpacity={0.4}
                strokeWidth={1}
              />
            )}
            <text
              x={p.px}
              y={PLANET_Y + PLANET_LABEL_DY[p.row]}
              textAnchor="middle"
              fill={PLANET_COLOR[p.body]}
              fontSize={9.5}
              fontFamily="ui-monospace, monospace"
            >
              {p.body}
            </text>
          </g>
        ))}

        {/* ISS passes */}
        {passes
          .filter((p) => inWindow(p.maxElevationTime))
          .map((p) => (
            <g key={p.maxElevationTime.getTime()}>
              <line
                x1={x(p.maxElevationTime.getTime())}
                y1={MOON_Y - 10}
                x2={x(p.maxElevationTime.getTime())}
                y2={MOON_Y - 2}
                stroke="#7dffc0"
                strokeWidth={2}
              />
              <text
                x={x(p.maxElevationTime.getTime())}
                y={MOON_Y - 14}
                textAnchor="middle"
                fill="#7dffc0"
                fontSize={9}
                fontFamily="ui-monospace, monospace"
              >
                ISS {Math.round(p.maxElevationDeg)}° {compass(p.maxAzimuth)}
              </text>
            </g>
          ))}

        {/* Sun altitude curve with the twilight thresholds marked */}
        {[
          { deg: SUN_STANDARD_ALT_DEG, text: "horizon" },
          { deg: CIVIL_TWILIGHT_DEG, text: "-6" },
          { deg: NAUTICAL_TWILIGHT_DEG, text: "-12" },
          { deg: ASTRONOMICAL_TWILIGHT_DEG, text: "-18" },
        ].map((t) => (
          <g key={t.text}>
            <line
              x1={PAD_L}
              y1={yForAlt(t.deg)}
              x2={VB_W - PAD_R}
              y2={yForAlt(t.deg)}
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="3 4"
            />
            <text
              x={PAD_L - 8}
              y={yForAlt(t.deg) + 3}
              textAnchor="end"
              fill="rgba(255,255,255,0.4)"
              fontSize={9.5}
              fontFamily="ui-monospace, monospace"
            >
              {t.text}
            </text>
          </g>
        ))}
        <polyline points={sunPath} fill="none" stroke="#f2a63b" strokeWidth={1.8} />
        <text
          x={VB_W - PAD_R}
          y={CURVE_TOP - 4}
          textAnchor="end"
          fill="rgba(242,166,59,0.75)"
          fontSize={9.5}
          fontFamily="ui-monospace, monospace"
        >
          Sun altitude
        </text>

        {/* clock ticks */}
        {hourTicks.map((t) => (
          <g key={t.ms}>
            <line
              x1={x(t.ms)}
              y1={CURVE_BOTTOM}
              x2={x(t.ms)}
              y2={CURVE_BOTTOM + 5}
              stroke="rgba(255,255,255,0.2)"
            />
            <text
              x={x(t.ms)}
              y={CURVE_BOTTOM + 17}
              textAnchor="middle"
              fill="rgba(255,255,255,0.35)"
              fontSize={9.5}
              fontFamily="ui-monospace, monospace"
            >
              {t.label}
            </text>
          </g>
        ))}
      </svg>
      </div>
      <p className="mt-1 font-mono text-[10px] text-faint sm:hidden">
        swipe the timeline sideways
      </p>
    </figure>
  );
}
