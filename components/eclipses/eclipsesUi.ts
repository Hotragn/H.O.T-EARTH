import type { LunarEclipse, SolarEclipse } from "@/lib/eclipses";

/** Presentation helpers for the Eclipses tab. Pure formatting only. */

export const SOLAR_COLOR: Record<string, string> = {
  T: "#f2a63b",
  A: "#ffd27a",
  H: "#ffb86b",
  P: "#8a7c63",
};

export const LUNAR_COLOR: Record<string, string> = {
  T: "#e06246",
  P: "#c98878",
  N: "#7d7370",
};

/** "2026 Aug 12, 17:47 TD" from the stored ISO timestamp. */
export function tdLabel(td: string): string {
  const d = new Date(td);
  if (isNaN(d.getTime())) return "unknown";
  const mon = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCFullYear()} ${mon} ${d.getUTCDate()}, ${hh}:${mm} TD`;
}

/** "in 12 days" / "in 3.2 years" / "past". */
export function countdownLabel(days: number | null): string {
  if (days == null) return "unknown";
  if (days < 0) return "past";
  if (days < 1) return "within a day";
  if (days < 60) return `in ${Math.round(days)} days`;
  if (days < 730) return `in ${Math.round(days / 30.44)} months`;
  return `in ${(days / 365.25).toFixed(1)} years`;
}

/** Signed degrees to "65°N" / "25°W". */
export function coordLabel(lat: number | null, lon: number | null): string {
  if (lat == null || lon == null) return "unknown";
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(0)}°${ns} ${Math.abs(lon).toFixed(0)}°${ew}`;
}

export function minutesLabel(v: number | null): string {
  return v == null ? "unknown" : `${v.toFixed(1)} min`;
}

export function isSolar(e: SolarEclipse | LunarEclipse): e is SolarEclipse {
  return "mag" in e;
}
