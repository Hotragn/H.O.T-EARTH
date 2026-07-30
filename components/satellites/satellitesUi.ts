import type { OrbitRegime } from "@/lib/satellites";

/** Presentation helpers for the Satellites tab. Pure formatting only. */

export const GROUP_COLOR: Record<string, string> = {
  stations: "#7dffc0",
  starlink: "#4aa3ff",
  oneweb: "#9ad0ff",
  gps: "#ffd27a",
  geo: "#f2a63b",
  "debris-iridium33": "#ff8b6b",
  "debris-cosmos1408": "#ff6b6b",
  "debris-fengyun1c": "#ff5f5f",
};

export const REGIME_LABEL: Record<OrbitRegime, string> = {
  LEO: "Low Earth orbit",
  MEO: "Medium Earth orbit",
  GEO: "Geostationary",
  HEO: "Highly elliptical",
};

/** Groups that are fragmentation debris rather than working spacecraft. */
export const DEBRIS_GROUPS = new Set([
  "debris-iridium33",
  "debris-cosmos1408",
  "debris-fengyun1c",
]);

/** The real story behind each debris cloud, for the panel. */
export const DEBRIS_STORY: Record<string, string> = {
  "debris-iridium33":
    "The 2009 accidental collision between Iridium 33 and the derelict Cosmos 2251, at about 790 km. The first major satellite-on-satellite crash.",
  "debris-cosmos1408":
    "A 2021 anti-satellite missile test. It happened low enough that atmospheric drag has already removed almost all of the tracked fragments.",
  "debris-fengyun1c":
    "A 2007 anti-satellite test at about 860 km, high enough that drag is slow. It is still the largest tracked debris cloud from a single event.",
};

export function km(v: number): string {
  return v >= 10000
    ? `${Math.round(v).toLocaleString()} km`
    : `${v.toFixed(0)} km`;
}

export function minutes(v: number): string {
  if (v < 120) return `${v.toFixed(1)} min`;
  const h = Math.floor(v / 60);
  const m = Math.round(v % 60);
  return `${h} h ${m} min`;
}

export function speed(v: number): string {
  return `${v.toFixed(2)} km/s`;
}

/** "1,500 of 10,873 drawn" when sampled, else just the count. */
export function countLabel(shipped: number, tracked: number): string {
  return shipped < tracked
    ? `${shipped.toLocaleString()} of ${tracked.toLocaleString()} drawn`
    : `${shipped.toLocaleString()} tracked`;
}
