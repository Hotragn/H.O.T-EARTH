/**
 * Honest per-body facts, accent colours and layer notes for the Solar System
 * phase. This is a small PRESENTATION config: the dynamic orbital numbers
 * (distance, sub-solar point, season, solar-day length) are computed at runtime
 * from lib/planets.ts — nothing here is a model output. The STATIC facts below
 * (temperatures, feature descriptions, wind headlines) are transcribed verbatim
 * from public/data/planets/constants.json (NASA NSSDCA Planetary Fact Sheet,
 * D. R. Williams; JPL SSD phys_par) with brief citations, so the HUD can state
 * a source for every printed number. Invent nothing; label everything.
 *
 * Scope note: only the SIX "other planets" (Mercury, Venus, Jupiter, Saturn,
 * Uranus, Neptune) get an in-page detail globe. Earth and Mars already have
 * their own tabs and are linked out from the orrery, not rebuilt here.
 */

import type { PlanetName } from "./planets";

/** Bodies with an in-page detail globe (Earth/Mars/Moon have their own tabs). */
export const DETAIL_PLANETS = [
  "Mercury",
  "Venus",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
] as const;

export type DetailPlanetName = (typeof DETAIL_PLANETS)[number];

export function isDetailPlanet(name: string): name is DetailPlanetName {
  return (DETAIL_PLANETS as readonly string[]).includes(name);
}

/** How a body's headline temperature should be labelled honestly. */
export type TempKind =
  | "surface"
  | "surface (near-isothermal)"
  | "1-bar reference level";

export interface NamedFeature {
  /** short label, e.g. "Great Red Spot" */
  label: string;
  /** honest one-line description with location + longevity caveat */
  detail: string;
  /** true ⇒ this feature is transient and must NOT be shown as permanent */
  transient?: boolean;
}

export interface PlanetFacts {
  name: DetailPlanetName;
  /** ice/gas giant vs terrestrial, from constants.json `type` */
  type: string;
  /** per-body accent colour (dark mission-control palette) */
  accent: string;
  /** one-line honest hook shown at the top of the detail HUD */
  headline: string;
  /** mean temperature [°C] (constants.json mean_temp_C) */
  meanTempC: number;
  /** what that temperature actually represents */
  tempKind: TempKind;
  /**
   * Measured day/night surface extremes [°C], airless bodies only (Mercury).
   * Transcribed from constants.json measured_temp_extremes_C.
   */
  tempExtremesC?: { dayMax: number; nightMin: number; note: string };
  /** true ⇒ gas/ice giant with no solid surface (temperature is a 1-bar level) */
  noSolidSurface: boolean;
  /** honest bullet notes, each traceable to constants.json / the fact sheet */
  notes: string[];
  /** named, real, long-lived (or explicitly transient) features */
  features?: NamedFeature[];
  /** Saturn: render the ring system */
  hasRings?: boolean;
  /**
   * Venus: measured cloud-top super-rotation. Drives a labelled, illustrative
   * spinning cloud shell in the detail globe.
   */
  superRotation?: {
    cloudTopWindMs: number;
    cloudTopPeriodDays: number;
    /** rotation-period of the solid body (days), for contrast */
    bodyRotationDays: number;
    note: string;
  };
  /** true ⇒ a measured zonal-wind profile is expected in zonal_winds.json */
  hasZonalProfile?: boolean;
}

/**
 * Accent colours for ALL eight bodies (orrery dots + Earth/Mars link chips).
 * The six detail planets repeat their PlanetFacts.accent here for one lookup.
 */
export const PLANET_ACCENT: Record<PlanetName, string> = {
  Mercury: "#b8b2aa",
  Venus: "#e6c583",
  Earth: "#4a90d9",
  Mars: "#c1440e",
  Jupiter: "#d9a066",
  Saturn: "#e3c66b",
  Uranus: "#7fdbe6",
  Neptune: "#3b6fe0",
};

/**
 * Relative dot radius in the orrery (scene units). Gas giants a touch larger so
 * the size ordering reads at a glance; NOT to scale (labelled in the note).
 */
export const ORRERY_DOT_RADIUS: Record<PlanetName, number> = {
  Mercury: 0.1,
  Venus: 0.13,
  Earth: 0.13,
  Mars: 0.11,
  Jupiter: 0.26,
  Saturn: 0.23,
  Uranus: 0.18,
  Neptune: 0.18,
};

export const PLANET_FACTS: Record<DetailPlanetName, PlanetFacts> = {
  Mercury: {
    name: "Mercury",
    type: "terrestrial",
    accent: "#b8b2aa",
    headline:
      "Airless rock with the largest day/night temperature swing of any planet.",
    meanTempC: 167,
    tempKind: "surface",
    tempExtremesC: {
      dayMax: 427,
      nightMin: -173,
      note: "MESSENGER-era measured surface extremes; subsolar surface ~430 °C. No atmosphere buffers the swing (NASA NSSDC Fact Sheet).",
    },
    noSolidSurface: false,
    notes: [
      "No real atmosphere — only a tenuous exosphere, so there is no weather to model or invent.",
      "3:2 spin–orbit resonance: Mercury turns exactly three times for every two orbits, making one solar day (~176 Earth days) last two Mercury years.",
      "Obliquity 0.034° — effectively no seasons.",
    ],
  },
  Venus: {
    name: "Venus",
    type: "terrestrial",
    accent: "#e6c583",
    headline:
      "A near-isothermal furnace whose cloud tops super-rotate far faster than the planet turns.",
    meanTempC: 464,
    tempKind: "surface (near-isothermal)",
    noSolidSurface: false,
    notes: [
      "Surface is near-isothermal at ~465 °C under a thick CO₂ greenhouse, so the ground itself shows no dynamics.",
      "Retrograde rotation (obliquity 177.36°): the solid body turns backwards once every 243 Earth days.",
      "The honest dynamic signal is atmospheric super-rotation at the cloud tops.",
    ],
    superRotation: {
      cloudTopWindMs: 100,
      cloudTopPeriodDays: 4,
      bodyRotationDays: 243,
      note: "Cloud-top zonal winds ~100 m/s (retrograde) lap the planet in ~4 Earth days vs the 243-day solid-body rotation. Measured by Venus Express (VMC) and Akatsuki (UVI). The rotating cloud shell here is illustrative of that measured rate, not a live image.",
    },
  },
  Jupiter: {
    name: "Jupiter",
    type: "gas giant",
    accent: "#d9a066",
    headline:
      "Banded jets and a centuries-old storm — measured winds, no live feed.",
    meanTempC: -110,
    tempKind: "1-bar reference level",
    noSolidSurface: true,
    notes: [
      "No solid surface; the quoted temperature is the 1-bar reference level and rotation is System III (magnetic).",
      "The honest dynamic signal is the MEASURED zonal-wind profile — alternating east/west jets, strongest ~150 m/s near ~24°N.",
    ],
    features: [
      {
        label: "Great Red Spot",
        detail:
          "A long-lived anticyclone near ~22°S, observed for well over a century (though slowly shrinking).",
      },
    ],
    hasZonalProfile: true,
  },
  Saturn: {
    name: "Saturn",
    type: "gas giant",
    accent: "#e3c66b",
    headline:
      "The ring system is rendered to scale; the winds and polar hexagon are measured.",
    meanTempC: -140,
    tempKind: "1-bar reference level",
    noSolidSurface: true,
    hasRings: true,
    notes: [
      "No solid surface; bulk rotation is uncertain because there is no fixed surface to track.",
      "A powerful equatorial super-jet blows east at ~400+ m/s — among the fastest sustained winds on any planet.",
      "Rings drawn from occultation-measured radii (D through F, ~1.11–2.33 Saturn radii).",
    ],
    features: [
      {
        label: "North-polar hexagon",
        detail:
          "A real, persistent six-sided jet stream around ~78°N, tracked since Voyager and by Cassini.",
      },
    ],
    hasZonalProfile: true,
  },
  Uranus: {
    name: "Uranus",
    type: "ice giant",
    accent: "#7fdbe6",
    headline:
      "Tipped 98° onto its side — the most extreme axial tilt in the solar system.",
    meanTempC: -195,
    tempKind: "1-bar reference level",
    noSolidSurface: true,
    notes: [
      "Obliquity 97.77° means the planet rolls on its side: each pole faces the Sun for ~21 years, giving ~42-year-long seasons.",
      "Retrograde rotation. The globe here is tipped by the real obliquity so the sideways geometry is visible.",
      "Near-featureless in true colour — only faint bands — and its interior structure is INFERRED, not measured.",
    ],
  },
  Neptune: {
    name: "Neptune",
    type: "ice giant",
    accent: "#3b6fe0",
    headline: "The fastest winds in the solar system, measured once, in 1989.",
    meanTempC: -200,
    tempKind: "1-bar reference level",
    noSolidSurface: true,
    notes: [
      "No solid surface; the quoted temperature is the 1-bar reference level.",
      "Fastest winds in the solar system, ~2,100 km/h (~580 m/s), MEASURED by Voyager 2 in 1989 — the only close pass to date.",
    ],
    features: [
      {
        label: "Great Dark Spot (GDS-89)",
        detail:
          "TRANSIENT: the 1989 storm Voyager 2 imaged was gone by 1994. New dark spots appear and vanish; none is permanent, so none is drawn on the globe.",
        transient: true,
      },
    ],
    hasZonalProfile: true,
  },
};

// ───────────────────────── Zonal winds (defensive) ─────────────────────────

/**
 * Path to the measured zonal-wind profiles, written concurrently by the data
 * pipeline. Consumed DEFENSIVELY — the UI tolerates its absence and shows an
 * honest "awaiting data" note rather than crashing (mirrors the Mars
 * climatology panel).
 */
export const ZONAL_WINDS_PATH = "/data/planets/zonal_winds.json";

/** One measured wind profile: [latitude °, zonal wind m/s] samples + source. */
export interface ZonalProfile {
  source: string;
  /** [latDeg, windMs] pairs; positive wind = eastward (prograde) */
  profile: [number, number][];
}

export interface ZonalWindsFile {
  meta: { units: string; convention: string };
  bodies: Partial<Record<string, ZonalProfile>>;
}

/**
 * Best-effort parser for zonal_winds.json. Returns null on any shape mismatch
 * so callers can fall back to an "unavailable" state. Never throws.
 */
export function parseZonalWinds(raw: unknown): ZonalWindsFile | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const meta = obj.meta as Record<string, unknown> | undefined;
  const bodies = obj.bodies as Record<string, unknown> | undefined;
  if (!bodies || typeof bodies !== "object") return null;

  const out: ZonalWindsFile["bodies"] = {};
  for (const [name, v] of Object.entries(bodies)) {
    if (!v || typeof v !== "object") continue;
    const rec = v as Record<string, unknown>;
    const profile = rec.profile;
    if (!Array.isArray(profile)) continue;
    const pairs: [number, number][] = [];
    for (const p of profile) {
      if (
        Array.isArray(p) &&
        p.length >= 2 &&
        typeof p[0] === "number" &&
        typeof p[1] === "number"
      ) {
        pairs.push([p[0], p[1]]);
      }
    }
    if (pairs.length < 2) continue;
    out[name] = {
      source: typeof rec.source === "string" ? rec.source : "measured profile",
      profile: pairs,
    };
  }

  return {
    meta: {
      units: typeof meta?.units === "string" ? (meta.units as string) : "m/s",
      convention:
        typeof meta?.convention === "string"
          ? (meta.convention as string)
          : "positive = eastward",
    },
    bodies: out,
  };
}
