/**
 * Shared UI constants and small pure helpers for the Asteroid Moons tab (real
 * binary and multiple asteroid systems: Didymos, Ida, Sylvia, Kleopatra, Antiope,
 * Kalliope, Eugenia, Patroclus). Kept in one place so the scene, HUD, system panel
 * and comet panel agree on the body colors, tier badges, headline facts and
 * formatting (no per-file drift). Mirrors dwarf-moons/dwarfMoonsUi.ts, minus every
 * plane-of-sky / observer helper: this tab has NO sky position (the mutual-orbit
 * poles are unknown), so it draws a schematic face-on orrery, not a sky projection.
 *
 * Nothing here is new physics. The body positions, sizes, separations, periods and
 * the DART period step all come from lib/asteroid-moons.ts. The colors below are
 * presentation only (illustrative rocky tints, never a real surface); the per-system
 * FACTS are the documented, cited ones (see docs/ASTEROID_MOONS_DATA_SOURCES.md).
 */

import {
  MOONS_BY_SYSTEM,
  type AsteroidMoon,
  type AsteroidSystem,
} from "@/lib/asteroid-moons";

// ─────────────────────────────── body presentation ─────────────────────────

/**
 * Per-primary tint. Didymos and Ida carry a REAL single-view mission photo (this
 * tint is only a defensive fallback); the other six primaries have NO map and are
 * labeled illustrative shapes, the tint approximating their rocky/metallic type,
 * never a real surface.
 */
export const SYSTEM_FALLBACK_COLOR: Record<AsteroidSystem, string> = {
  Didymos: "#8f8579", // NEO rubble pile (fallback; the real DART photo is used)
  Ida: "#9a8f7d", // S-type (fallback; the real Galileo photo is used)
  Sylvia: "#6f6a63", // dark P-type, illustrative
  Kleopatra: "#b8b2a6", // metallic M-type "dog-bone", illustrative
  Antiope: "#7d766c", // dark C-type (Themis family), illustrative
  Kalliope: "#a9a096", // M-type, illustrative
  Eugenia: "#5f5a54", // dark F-type rubble pile, illustrative
  Patroclus: "#736d64", // dark D/P-type Trojan, illustrative
};

/**
 * Per-moon marker color. Presentation only: every moon here is a labeled
 * illustrative marker (none has a shipped surface map). Near-equal-double
 * secondaries (Antiope B, Menoetius) share their primary's tint, since they are
 * co-equal bodies, not tiny satellites.
 */
export const MOON_COLORS: Record<AsteroidMoon, string> = {
  Dimorphos: "#a89e90",
  Dactyl: "#b0a595",
  Romulus: "#9aa0a8",
  Remus: "#8f959d",
  Alexhelios: "#b5afa4",
  Cleoselene: "#a8a29a",
  AntiopeB: "#867f75",
  Linus: "#9a9188",
  PetitPrince: "#9fa6ad",
  S2004_45_1: "#8f969d",
  Menoetius: "#7d776e",
};

/** The one accent used for this tab's chrome (matches the worlds registry entry). */
export const TAB_ACCENT = "#9ba1a6";

/** The system selector order (also the segmented-control order). Didymos leads. */
export const ASTEROID_SYSTEM_ORDER: readonly AsteroidSystem[] = [
  "Didymos",
  "Ida",
  "Sylvia",
  "Kleopatra",
  "Antiope",
  "Kalliope",
  "Eugenia",
  "Patroclus",
];

/** The moon keys of a system, in orbital order (matches asteroidMoonPositions). */
export function moonKeys(system: AsteroidSystem): readonly AsteroidMoon[] {
  return MOONS_BY_SYSTEM[system];
}

/** true ⇒ the primary carries a real, reused mission photo (Didymos, Ida). */
export function primaryHasPhoto(system: AsteroidSystem): boolean {
  return system === "Didymos" || system === "Ida";
}

// ─────────────────────────────── data-tier badges ──────────────────────────

/**
 * The honesty tiers. EVERY system is "schematic" (orbit size/separation/period
 * real and to scale; orientation in space and along-orbit phase are an adopted
 * illustrative convention). Dactyl is additionally "uncertain" (its orbit is
 * bounded, not solved, from a single flyby).
 */
export type Tier = "schematic" | "uncertain";

export interface TierBadge {
  label: string;
  title: string;
  /** tailwind classes for the badge chrome (border + text + subtle bg). */
  className: string;
}

const TIER_BADGES: Record<Tier, TierBadge> = {
  schematic: {
    label: "Orbit real, orientation & phase schematic",
    title:
      "The body sizes, mutual-orbit separation and period are real and drawn to scale. The orbit's orientation in space and the along-orbit phase are an adopted illustrative convention (no full mutual-orbit ephemeris exists), not a measurement, and are never a real position on a date.",
    className: "border-line bg-white/[0.03] text-faint",
  },
  uncertain: {
    label: "Orbit poorly constrained",
    title:
      "Dactyl's orbit could only be bounded, not solved, from the single 1993 Galileo flyby (Belton et al. 1996), so even its semi-major axis and period are genuinely uncertain. Shown without false precision.",
    className: "border-[#c98f5a]/50 bg-[#c98f5a]/[0.08] text-[#e0a877]",
  },
};

/** The system-level tier badge. Every system is schematic (Dactyl is flagged per-moon). */
export function systemTierBadge(): TierBadge {
  return TIER_BADGES.schematic;
}

/** The per-moon tier badge, from the orbitUncertain flag (Dactyl only). */
export function moonTierBadge(orbitUncertain: boolean): TierBadge {
  return orbitUncertain ? TIER_BADGES.uncertain : TIER_BADGES.schematic;
}

// ─────────────────────────────── headline facts ────────────────────────────

/** The one-line headline fact per system (shown in the HUD and the panel title). */
export const SYSTEM_HEADLINE: Record<AsteroidSystem, string> = {
  Didymos:
    "The DART target: the first time humanity deliberately changed a celestial body's orbit (2022-09-26).",
  Ida: "The first confirmed asteroid moon: Dactyl, found in Galileo flyby images in 1993.",
  Sylvia:
    "The first known triple asteroid: a large primary with two small moons, Romulus and Remus.",
  Kleopatra:
    "The metallic dog-bone asteroid, with two small moons, Alexhelios and Cleoselene.",
  Antiope:
    "A near-equal double: two components of about 88 km each orbiting a shared barycenter.",
  Kalliope: "A large M-type main-belt primary with the moon Linus.",
  Eugenia:
    "Petit-Prince: the first asteroid moon discovered from the ground (adaptive optics, 1998).",
  Patroclus:
    "A Jupiter Trojan near-equal double; both components are a NASA Lucy flyby target in 2033.",
};

/** A short panel-title phrase per system. */
export const SYSTEM_TITLE: Record<AsteroidSystem, string> = {
  Didymos: "The orbit humanity moved",
  Ida: "The first asteroid moon",
  Sylvia: "The first triple asteroid",
  Kleopatra: "The dog-bone and its moons",
  Antiope: "A near-equal double",
  Kalliope: "A main-belt primary and Linus",
  Eugenia: "Found from the ground",
  Patroclus: "A Trojan double, Lucy's 2033 target",
};

/** Human-readable population label. */
export const POPULATION_LABEL: Record<string, string> = {
  "main-belt": "Main belt",
  NEO: "Near-Earth object",
  Trojan: "Jupiter Trojan",
};

// ─────────────────────────────── formatting ────────────────────────────────

/** A diameter in km, human-scaled: sub-km bodies in metres, else km. */
export function formatDiameter(diameterKm: number): string {
  if (diameterKm < 1) return `${Math.round(diameterKm * 1000)} m`;
  if (diameterKm < 10) return `${diameterKm.toFixed(1)} km`;
  return `${Math.round(diameterKm)} km`;
}

/** A separation in km, human-scaled. */
export function formatSeparation(km: number): string {
  if (km < 10) return `${km.toFixed(2)} km`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}

/** A mutual period in hours, with a days hint for the long ones. */
export function formatPeriod(hours: number): string {
  if (hours < 48) return `${hours.toFixed(hours < 20 ? 3 : 1)} h`;
  return `${hours.toFixed(1)} h (${(hours / 24).toFixed(2)} d)`;
}

/** Local date-time label, e.g. "Sun, Jul 20 2026, 03:14". */
export function dateTimeLabel(d: Date): string {
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The whole-tab honesty line, shown in the legend, HUD and footer. No em-dashes
 * (project copy rule). This is the schematic-view caveat the brief requires.
 */
export const SCHEMATIC_CAVEAT =
  "Schematic mutual-orbit view (face-on). These systems are unresolvable from Earth " +
  "and were measured by radar, adaptive optics or spacecraft only, so there is no " +
  "plane-of-sky, no compass and no visibility claim. Sizes, separations and periods " +
  "are real and to scale; orbit orientation and along-orbit phase are an adopted convention.";
