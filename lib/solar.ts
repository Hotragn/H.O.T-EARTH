/**
 * Solar geometry — NOAA solar position algorithm (Spencer series form, as
 * published in the NOAA Global Monitoring Division "Solar Calculation
 * Details" / General Solar Position Calculations sheet).
 *
 * Accuracy: declination to ~0.01 rad series truncation is ~0.05-0.2 deg,
 * equation of time to well under a minute — more than enough to place the
 * day/night terminator to sub-degree accuracy on a globe.
 *
 * This drives the day/night shader and the subsolar HUD readout.
 * See .claude/skills/physics-env-simulation for the methodology contract:
 * real physics or it doesn't ship. No arbitrary numbers.
 */

import { latLonToVector3, normalizeLon, type LatLon } from "./geo";

const DAY_MS = 86_400_000;
const RAD2DEG = 180 / Math.PI;

/** Day of year (1-366) for a UTC date. */
export function dayOfYearUTC(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  return Math.floor((date.getTime() - start) / DAY_MS) + 1;
}

function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

/**
 * NOAA fractional year gamma in radians for a UTC instant.
 * gamma = 2*pi/365 * (doy - 1 + (hour - 12) / 24)
 */
export function fractionalYear(date: Date): number {
  const doy = dayOfYearUTC(date);
  const hours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;
  return (
    ((2 * Math.PI) / daysInYear(date.getUTCFullYear())) *
    (doy - 1 + (hours - 12) / 24)
  );
}

/**
 * Solar declination in DEGREES (NOAA / Spencer 1971 series).
 * Encodes seasons: +23.44 at June solstice, -23.44 at December solstice.
 */
export function solarDeclination(gamma: number): number {
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  return decl * RAD2DEG;
}

/**
 * Equation of time in MINUTES (NOAA / Spencer 1971 series).
 * Apparent solar time = mean solar time + E. Ranges roughly -14..+16 min
 * over the year (orbital eccentricity + axial obliquity).
 */
export function equationOfTime(gamma: number): number {
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma))
  );
}

/**
 * Subsolar point (the lat/lon where the sun is at zenith) for a UTC instant.
 *
 *   lat = solar declination
 *   lon = -15 deg/hour * (UTC hours + E/60 - 12)
 *
 * (The sun is over the Greenwich meridian at 12:00 UTC minus the equation
 * of time, and marches west at 15 deg per hour.)
 */
export function subsolarPoint(date: Date): LatLon {
  const gamma = fractionalYear(date);
  const declination = solarDeclination(gamma);
  const eqTimeMin = equationOfTime(gamma);
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3_600_000;
  const lon = -15 * (utcHours + eqTimeMin / 60 - 12);
  return { lat: declination, lon: normalizeLon(lon) };
}

/**
 * Unit vector pointing from Earth's center toward the sun, in the globe's
 * Earth-fixed frame (see lib/geo.ts for the axis convention). Feed this
 * directly to the day/night shader as the `sunDirection` uniform: a surface
 * point P is in daylight iff dot(P_hat, sunDirection) > 0.
 */
export function sunDirection(date: Date): [number, number, number] {
  const { lat, lon } = subsolarPoint(date);
  return latLonToVector3(lat, lon, 1);
}

/** UTC solar noon (subsolar lon = 0) for the given UTC calendar day. */
export function solarNoonUTC(date: Date): Date {
  const noon = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12)
  );
  const eqTimeMin = equationOfTime(fractionalYear(noon));
  return new Date(noon.getTime() - eqTimeMin * 60_000);
}
