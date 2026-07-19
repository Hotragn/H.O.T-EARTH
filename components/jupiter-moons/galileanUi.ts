/**
 * Shared UI constants and small pure helpers for the Jupiter's Moons tab.
 * Kept in one place so the scene, HUD and events panel agree on the moon colors,
 * Roman numerals, phenomenon labels and compass wording (no per-file drift).
 *
 * Nothing here is physics: the numbers all come from lib/jupiter-moons.ts. These
 * are only presentation choices (colors, labels), matching the honesty rule that
 * every drawn-for-legibility choice is labeled where it is used.
 */

import type {
  GalileanMoon,
  PhenomenonType,
} from "@/lib/jupiter-moons";

/**
 * Per-moon marker color. These match lib/moon-facts MOON_ACCENT exactly so the
 * dot next to "Io" here is the same amber as the Moons tab: Io sulfur yellow,
 * Europa ice blue, Ganymede steel, Callisto old cratered grey-brown.
 */
export const MOON_COLORS: Record<GalileanMoon, string> = {
  Io: "#e8d24a",
  Europa: "#bcd7e6",
  Ganymede: "#8fb0c9",
  Callisto: "#9a8d7d",
};

/** Roman-numeral designation I-IV, keyed by moon (matches GALILEAN_MOONS.index). */
export const MOON_ROMAN: Record<GalileanMoon, string> = {
  Io: "I",
  Europa: "II",
  Ganymede: "III",
  Callisto: "IV",
};

export interface PhenomenonMeta {
  /** full label for the events panel */
  label: string;
  /** one-line plain-English description of the geometry */
  blurb: string;
  /** shadow transits are the headline event, so they get emphasis in the UI */
  emphasize: boolean;
  /** accent for the row (shadow transit uses a warm tone; the rest are cool) */
  accent: string;
}

/**
 * Presentation metadata per phenomenon type. Shadow transits are emphasized
 * because they are the crisp black dot amateur observers actually chase; the
 * geometry blurbs come straight from docs/JUPITER_MOONS_PHYSICS.md.
 */
export const PHENOMENON_META: Record<PhenomenonType, PhenomenonMeta> = {
  transit: {
    label: "Transit",
    blurb: "Moon crossing in front of Jupiter's disk (Earth-line event).",
    emphasize: false,
    accent: "#cbd3e0",
  },
  shadow_transit: {
    label: "Shadow transit",
    blurb: "Moon's shadow on the cloud tops, the crisp black dot (Sun-line event).",
    emphasize: true,
    accent: "#f2a63b",
  },
  occultation: {
    label: "Occultation",
    blurb: "Moon hidden behind Jupiter's disk (Earth-line event).",
    emphasize: false,
    accent: "#8b93a4",
  },
  eclipse: {
    label: "Eclipse",
    blurb: "Moon inside Jupiter's shadow, darkened even when not behind the disk (Sun-line event).",
    emphasize: false,
    accent: "#7f93c8",
  },
};

/** Order phenomenon types are listed in the "happening now" summary. */
export const PHENOMENON_ORDER: readonly PhenomenonType[] = [
  "transit",
  "shadow_transit",
  "occultation",
  "eclipse",
];

/**
 * 16-point compass abbreviation for an azimuth measured from North, clockwise
 * (the convention lib/celestial.equatorialToHorizontal returns). Pure and total.
 */
export function compass16(azimuthDeg: number): string {
  const names = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW",
  ];
  const i = Math.round(((azimuthDeg % 360) + 360) % 360 / 22.5) % 16;
  return names[i];
}

/** Short local clock time (HH:MM) for the viewer's own timezone. */
export function hhmm(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Local day header, e.g. "Sat, Jul 19". */
export function dayLabel(d: Date): string {
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─────────────────────────────── observer ──────────────────────────────────

/** An observing site: a label plus geographic latitude / longitude (deg). */
export interface Observer {
  label: string;
  /** latitude, degrees north positive */
  lat: number;
  /** longitude, degrees east positive (matches lib/geo / lib/celestial) */
  lon: number;
}

/**
 * Labeled fallback location used until the viewer opts into geolocation. Chosen
 * as a neutral, well-known meridian reference (Greenwich, London), and clearly
 * labeled so it is never mistaken for the viewer's real position.
 */
export const DEFAULT_OBSERVER: Observer = {
  label: "Greenwich (default)",
  lat: 51.4779,
  lon: -0.0015,
};

/** A few preset sites so the visibility check is useful without geolocation. */
export const PRESET_SITES: readonly Observer[] = [
  DEFAULT_OBSERVER,
  { label: "New York", lat: 40.7128, lon: -74.006 },
  { label: "Los Angeles", lat: 34.0522, lon: -118.2437 },
  { label: "Mumbai", lat: 19.076, lon: 72.8777 },
  { label: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { label: "Sydney", lat: -33.8688, lon: 151.2093 },
];
