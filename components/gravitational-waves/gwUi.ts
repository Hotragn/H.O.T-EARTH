import type { GwEvent, MergerClass } from "@/lib/gravitational-waves";

/** Presentation helpers for the Gravitational Waves tab. Pure formatting only. */

export const GW_ACCENT = "#8fd3ff";

export const CLASS_LABEL: Record<MergerClass, string> = {
  BBH: "Two black holes",
  BNS: "Two neutron stars",
  NSBH: "Neutron star + black hole",
};

export const CLASS_SHORT: Record<MergerClass, string> = {
  BBH: "BBH",
  BNS: "BNS",
  NSBH: "NSBH",
};

export const CLASS_COLOR: Record<MergerClass, string> = {
  BBH: "#8fd3ff",
  BNS: "#ffd27a",
  NSBH: "#c9a6ff",
};

/** A mass with its published 90% credible interval, e.g. "34.6 +3.4 -3.1". */
export function massWithBounds(
  value: number,
  lower: number | null,
  upper: number | null,
): string {
  const base = value.toFixed(value < 10 ? 2 : 1);
  if (lower == null || upper == null) return `${base} M☉`;
  // GWOSC publishes `lower` as a negative offset already.
  const lo = Math.abs(lower).toFixed(2);
  const hi = Math.abs(upper).toFixed(2);
  return `${base} +${hi} −${lo} M☉`;
}

/** Distance in Mpc plus the rounded light-travel reading. */
export function distanceLabel(mpc: number, lightYears: number | null): string {
  const d = mpc >= 1000 ? `${(mpc / 1000).toFixed(2)} Gpc` : `${Math.round(mpc)} Mpc`;
  if (lightYears == null) return d;
  const mly = lightYears / 1e6;
  const ly = mly >= 1000 ? `${(mly / 1000).toFixed(2)} Gly` : `${mly.toFixed(0)} Mly`;
  return `${d} (~${ly})`;
}

/** Frequencies: whole hertz below 1 kHz, one decimal in kilohertz above. */
export function freqLabel(hz: number): string {
  return hz >= 1000 ? `${(hz / 1000).toFixed(2)} kHz` : `${hz.toFixed(0)} Hz`;
}

/** Strain, always in scientific notation because it is always tiny. */
export function strainLabel(h: number): string {
  if (!isFinite(h) || h <= 0) return "unknown";
  const exp = Math.floor(Math.log10(h));
  const mant = h / Math.pow(10, exp);
  return `${mant.toFixed(1)}×10${superscript(exp)}`;
}

function superscript(n: number): string {
  const map: Record<string, string> = {
    "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  };
  return String(n)
    .split("")
    .map((c) => map[c] ?? c)
    .join("");
}

/** Energy in solar masses and in joules. */
export function energyLabel(msun: number, joules: number): string {
  const exp = Math.floor(Math.log10(joules));
  const mant = joules / Math.pow(10, exp);
  return `${msun.toFixed(2)} M☉ (${mant.toFixed(1)}×10${superscript(exp)} J)`;
}

/**
 * A detection's calendar date from its GPS time.
 *
 * GPS epoch is 1980-01-06 UTC and GPS time ignores leap seconds, so it runs
 * ahead of UTC by the accumulated count (18 s for every event in this catalogue,
 * all of which postdate the 2017 leap second). We subtract that offset, which is
 * why the dates match the published event names to the day.
 */
const GPS_EPOCH_MS = Date.UTC(1980, 0, 6);
const GPS_UTC_LEAP_S = 18;

export function gpsToDate(gps: number): Date {
  return new Date(GPS_EPOCH_MS + (gps - GPS_UTC_LEAP_S) * 1000);
}

export function gpsDateLabel(gps: number): string {
  return gpsToDate(gps).toISOString().slice(0, 10);
}

/** Short observing-run label from the catalogue release name. */
export function runLabel(catalog: string): string {
  if (catalog.startsWith("GWTC-1")) return "O1/O2";
  if (catalog.startsWith("GWTC-2")) return "O3a";
  if (catalog.startsWith("GWTC-3")) return "O3b";
  if (catalog.startsWith("GWTC-4")) return "O4a";
  if (catalog.startsWith("GWTC-5")) return "O4b+";
  return catalog;
}

/** One-line summary used in the list rows. */
export function eventSummary(e: GwEvent): string {
  return `${e.m1.toFixed(1)} + ${e.m2.toFixed(1)} M☉`;
}
