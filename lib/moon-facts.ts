/**
 * Honest per-moon presentation config for the MAJOR MOONS phase. This is the
 * satellite analogue of lib/planet-facts.ts: a small PRESENTATION layer over the
 * real physics in lib/moons.ts (orbital mechanics, terminator) and the two
 * source-of-truth data files under public/data/moons/.
 *
 * Division of responsibility (so every printed pixel is traceable):
 *   • DYNAMIC orbital numbers (orbit angle, sub-solar longitude, terminator) —
 *     computed at runtime from lib/moons.ts. Nothing here is a model output.
 *   • CORE physical/orbital stats (radius, period, distance, temp, albedo) —
 *     read directly from lib/moons.MOONS, which transcribes JPL SSD values.
 *   • MEASURED "feature" facts (each individually source-tagged, debated items
 *     flagged) — parsed DEFENSIVELY at runtime from
 *     public/data/moons/phenomena.json via {@link parseMoonPhenomena}.
 *   • Extra physical detail (density, mass, temp range, albedo caveats) — parsed
 *     defensively from public/data/moons/constants.json via
 *     {@link parseMoonConstants}.
 *   • The curated per-body NOTES, accents and TEXTURE CAVEATS below are static
 *     presentation copy, transcribed from those same files with brief citations.
 *
 * HONESTY BAR (phase): most of these moons have NO weather — the honest
 * substance is orbital mechanics + measured phenomena + real textures. TITAN is
 * the sole exception with a genuine methane weather cycle (weather = true). The
 * texture caveats (Titan near-IR surface map, Triton synthetic northern
 * hemisphere, Europa/Callisto grayscale) are surfaced in the UI. Invent nothing.
 */

import type { MoonName, ParentPlanet } from "./moons";
import { MOON_ORDER } from "./moons";

/** All nine major moons get an in-page detail globe (Earth's Moon has its own tab). */
export const DETAIL_MOONS: readonly MoonName[] = MOON_ORDER;

export function isDetailMoon(name: string): name is MoonName {
  return (MOON_ORDER as readonly string[]).includes(name);
}

// ───────────────────────────── Accents ──────────────────────────────────────

/** Per-moon accent colour (dark mission-control palette; per-body character). */
export const MOON_ACCENT: Record<MoonName, string> = {
  Io: "#e8d24a", // sulfur yellow
  Europa: "#bcd7e6", // ice blue
  Ganymede: "#8fb0c9", // steel (the magnetic moon)
  Callisto: "#9a8d7d", // ancient cratered grey-brown
  Titan: "#e69a3c", // orange haze
  Enceladus: "#eef3f7", // fresh-ice white
  Mimas: "#c3c9d2", // pale grey
  Iapetus: "#c2a26a", // two-tone amber
  Triton: "#d99fc7", // nitrogen-frost pink-cyan
};

/** Parent-planet accents (match lib/planet-facts PLANET_ACCENT). */
export const PARENT_ACCENT: Record<ParentPlanet, string> = {
  Jupiter: "#d9a066",
  Saturn: "#e3c66b",
  Neptune: "#3b6fe0",
};

/**
 * Relative dot radius in the mini-orrery (scene units). Bigger moons a touch
 * larger so the size ordering reads at a glance; NOT to scale (labelled).
 */
export const MOON_DOT_RADIUS: Record<MoonName, number> = {
  Io: 0.085,
  Europa: 0.08,
  Ganymede: 0.11,
  Callisto: 0.105,
  Titan: 0.11,
  Enceladus: 0.055,
  Mimas: 0.05,
  Iapetus: 0.085,
  Triton: 0.09,
};

/** Procedural fallback tint (RGB 0–1) used ONLY if a texture 404s. */
export const MOON_FALLBACK_TINT: Record<MoonName, [number, number, number]> = {
  Io: [0.9, 0.82, 0.4],
  Europa: [0.78, 0.84, 0.9],
  Ganymede: [0.6, 0.58, 0.55],
  Callisto: [0.46, 0.43, 0.4],
  Titan: [0.85, 0.6, 0.3],
  Enceladus: [0.95, 0.96, 0.98],
  Mimas: [0.72, 0.74, 0.78],
  Iapetus: [0.5, 0.45, 0.38],
  Triton: [0.86, 0.78, 0.83],
};

/** Only Titan gets an atmosphere shell (a faint orange haze rim). */
export const HAS_HAZE: Record<MoonName, boolean> = {
  Io: false,
  Europa: false,
  Ganymede: false,
  Callisto: false,
  Titan: true,
  Enceladus: false,
  Mimas: false,
  Iapetus: false,
  Triton: false,
};

// ───────────────────────────── Texture caveats ──────────────────────────────

export interface TextureCaveat {
  /** short label shown on the caveat chip */
  label: string;
  /** one honest sentence explaining what the map really is */
  detail: string;
}

/**
 * The texture honesty caveats the phase MUST surface. Present-tense, plain.
 *   • Titan  — Cassini near-IR map that sees THROUGH the haze (not the visible
 *     orange atmosphere).
 *   • Triton — Voyager 2 imaged one hemisphere in 1989; the north is USGS
 *     synthetic "GlobalFill" interpolation, not real imagery.
 *   • Europa & Callisto — grayscale mosaics; no public-domain global colour, so
 *     colour is not implied.
 */
export const TEXTURE_CAVEAT: Partial<Record<MoonName, TextureCaveat>> = {
  Titan: {
    label: "Cassini near-IR surface map (haze-penetrating)",
    detail:
      "This is a Cassini near-infrared surface map that sees through the haze. It is NOT Titan's orange visible atmosphere.",
  },
  Triton: {
    label: "Voyager 2 imaged one hemisphere (1989)",
    detail:
      "Voyager 2 saw only one hemisphere in 1989. The northern hemisphere here is USGS synthetic 'GlobalFill' interpolation, not real imagery.",
  },
  Europa: {
    label: "Grayscale mosaic — no PD global colour",
    detail:
      "Shown in grayscale: there is no public-domain global colour mosaic, so colour is not implied.",
  },
  Callisto: {
    label: "Grayscale mosaic — no PD global colour",
    detail:
      "Shown in grayscale: there is no public-domain global colour mosaic, so colour is not implied.",
  },
};

// ───────────────────────────── Static facts ─────────────────────────────────

export interface MoonFacts {
  name: MoonName;
  parent: ParentPlanet;
  accent: string;
  /** one-line honest hook (mirrors phenomena.json headline; used as fallback) */
  headline: string;
  /** TITAN only: genuine (methane) weather. Every other moon: false. */
  weather: boolean;
  /** curated, cited body-specific bullet notes (transcribed w/ brief sources) */
  notes: string[];
}

/**
 * Curated per-moon copy. Headlines mirror phenomena.json; notes summarise the
 * measured facts + primary sources named there (Veeder 2012, Kivelson 2000/1996,
 * Porco 2005/2006, Huygens 2005, Smith 1989, Lainey 2024, Verbiscer 2007).
 */
export const MOON_FACTS: Record<MoonName, MoonFacts> = {
  Io: {
    name: "Io",
    parent: "Jupiter",
    accent: MOON_ACCENT.Io,
    headline: "Most volcanically active body in the Solar System",
    weather: false,
    notes: [
      "~400 volcanic centres, of which >150 have been seen erupting (Galileo / Voyager / Juno + ground-based).",
      "Tidal heating from the 1:2:4 Laplace resonance drives ~10¹⁴ W of heat — ~40× Earth's (Veeder et al. 2012).",
      "Fine sulfur/SO₂ plumes reach hundreds of km up: the Pele plume ~390 km high (Galileo / New Horizons).",
    ],
  },
  Europa: {
    name: "Europa",
    parent: "Jupiter",
    accent: MOON_ACCENT.Europa,
    headline: "Young ice shell over a subsurface salt-water ocean",
    weather: false,
    notes: [
      "One of the youngest, smoothest solid surfaces known (age ~40–90 Myr) — active resurfacing (Galileo).",
      "Galileo's Jupiter-induced magnetic field implies a salty subsurface ocean, perhaps ~2× Earth's water (Kivelson et al. 2000).",
      "'Chaos' terrain of broken, rotated ice blocks points to a mobile ice shell over liquid or warm ice.",
    ],
  },
  Ganymede: {
    name: "Ganymede",
    parent: "Jupiter",
    accent: MOON_ACCENT.Ganymede,
    headline: "Largest moon in the Solar System; the only one with its own magnetic field",
    weather: false,
    notes: [
      "Radius 2,634 km — the largest moon in the Solar System, bigger than the planet Mercury.",
      "The ONLY moon known to generate its own intrinsic magnetic field (an internal dynamo), driving polar auroras (Kivelson et al. 1996).",
      "Auroral-oscillation data indicate a subsurface salt-water ocean (Saur et al. 2015).",
    ],
  },
  Callisto: {
    name: "Callisto",
    parent: "Jupiter",
    accent: MOON_ACCENT.Callisto,
    headline: "Among the oldest, most heavily cratered surfaces in the Solar System",
    weather: false,
    notes: [
      "The most heavily cratered object in the Solar System — an ancient, geologically dead surface saturated with impacts.",
      "An induced magnetic field hints at a deep briny layer — possible and unconfirmed (Zimmer et al. 2000).",
      "Sits OUTSIDE the Laplace resonance, so it feels little tidal heating.",
    ],
  },
  Titan: {
    name: "Titan",
    parent: "Saturn",
    accent: MOON_ACCENT.Titan,
    headline: "Thick N₂ atmosphere with an active methane cycle — the one moon with real weather",
    weather: true,
    notes: [
      "Thick N₂ atmosphere ~1.45 bar at the surface — ~50% denser than Earth's (Huygens HASI, Fulchignoni et al. 2005).",
      "An active hydrologic cycle in methane/ethane: clouds, rain, rivers, lakes and seas — the only other world with standing surface liquid.",
      "North-polar seas of liquid methane/ethane — Kraken, Ligeia and Punga Mare (Cassini RADAR).",
      "Surface 93.7 K (−179.5 °C), measured in situ by Huygens.",
    ],
  },
  Enceladus: {
    name: "Enceladus",
    parent: "Saturn",
    accent: MOON_ACCENT.Enceladus,
    headline: "South-polar water plumes feeding Saturn's E ring, from a global subsurface ocean",
    weather: false,
    notes: [
      "100+ jets of water vapour + ice grains erupt from the four south-polar 'tiger stripe' fractures (Porco et al. 2006).",
      "The plume is the dominant source of Saturn's diffuse E ring — Enceladus orbits within it (Spahn et al. 2006).",
      "A GLOBAL subsurface salt-water ocean; grains carry salts + silica → hydrothermal chemistry (Iess et al. 2014).",
      "Brightest body in the Solar System, geometric albedo ~1.375 — fresh-ice plume fallout (Verbiscer et al. 2007).",
    ],
  },
  Mimas: {
    name: "Mimas",
    parent: "Saturn",
    accent: MOON_ACCENT.Mimas,
    headline: "The 'Death Star' moon: dominated by the giant Herschel crater",
    weather: false,
    notes: [
      "The 139-km impact crater Herschel — about ⅓ of Mimas' diameter, with a ~6 km central peak — gives the 'Death Star' look (Cassini / Voyager).",
      "A geologically young subsurface ocean is a RECENT, debated result from orbital-libration analysis (Lainey et al. 2024).",
    ],
  },
  Iapetus: {
    name: "Iapetus",
    parent: "Saturn",
    accent: MOON_ACCENT.Iapetus,
    headline: "Two-tone moon: one coal-dark hemisphere, one bright, plus a giant equatorial ridge",
    weather: false,
    notes: [
      "Two-tone albedo: the leading hemisphere (Cassini Regio) is coal-dark (~0.03–0.05); the trailing hemisphere is bright (~0.5–0.6) — a thermal-runaway ice-migration dichotomy.",
      "A narrow equatorial ridge ~1,300 km long and up to ~20 km high gives it a walnut shape (Porco et al. 2005 / Ip 2006).",
    ],
  },
  Triton: {
    name: "Triton",
    parent: "Neptune",
    accent: MOON_ACCENT.Triton,
    headline: "Retrograde captured world with active nitrogen geysers — among the coldest measured",
    weather: false,
    notes: [
      "Retrograde orbit (inclination 157°) — almost certainly a captured Kuiper-belt object.",
      "Active nitrogen geysers vent gas + dark dust ~8 km high, drifting >100 km downwind (Voyager 2, 1989; Smith et al. 1989).",
      "A thin N₂ atmosphere, surface pressure ~1.4 Pa (~1/70,000 of Earth's) (Broadfoot et al. 1989).",
      "~38 K (−235 °C) — among the coldest surfaces measured in the Solar System (Voyager 2).",
      "Unique dimpled 'cantaloupe' terrain, likely from icy diapirism (Voyager 2).",
    ],
  },
};

/** The honesty banner shown on every detail view (Titan gets a weather-aware line). */
export function honestBanner(name: MoonName): string {
  return MOON_FACTS[name].weather
    ? "Titan has real weather: an active methane cycle (clouds, rain, rivers, seas). Orbital mechanics are computed; the atmosphere and surface features are measured by Cassini/Huygens."
    : "No weather here — tidally locked. Orbital mechanics are computed; the surface features are measured by spacecraft.";
}

// ───────────────────── phenomena.json (defensive parse) ──────────────────────

/** Static path to the per-moon measured-phenomena file (served from /public). */
export const MOON_PHENOMENA_PATH = "/data/moons/phenomena.json";

export interface MeasuredFact {
  /** raw key from the JSON, e.g. "activeVolcanoes" */
  key: string;
  /** prettified label for the UI */
  label: string;
  /** human-readable value string (units folded in where known) */
  value: string;
  /** the individual source string for THIS fact */
  source: string;
  /** "debated" | "possible" | "recent/debated" — shown as a caution tag */
  status?: string;
}

export interface MoonPhenomena {
  headline?: string;
  weather?: boolean;
  facts: MeasuredFact[];
}

export type MoonPhenomenaMap = Partial<Record<MoonName, MoonPhenomena>>;

/** Nicer labels for known fact keys; unknown keys fall back to de-camel-casing. */
const FACT_LABELS: Record<string, string> = {
  activeVolcanoes: "Active volcanoes",
  tidalHeating: "Tidal heating",
  plumeHeightsKm: "Plume heights",
  hotspotTempsK: "Hotspot temps",
  subsurfaceOcean: "Subsurface ocean",
  youngSurface: "Surface age",
  chaosTerrain: "Chaos terrain",
  plumes: "Plumes",
  largestMoon: "Largest moon",
  intrinsicMagneticField: "Intrinsic magnetic field",
  mostHeavilyCratered: "Most cratered surface",
  possibleOcean: "Possible ocean",
  atmospherePressureBar: "Surface pressure",
  atmosphereN2Percent: "Atmosphere N₂",
  surfaceTempK: "Surface temperature",
  methaneCycle: "Methane cycle",
  seas: "Methane seas",
  feedsSaturnERing: "Feeds Saturn's E ring",
  geometricAlbedo: "Geometric albedo",
  herschelCrater: "Herschel crater",
  possibleYoungOcean: "Possible young ocean",
  twoToneAlbedo: "Two-tone albedo",
  equatorialRidge: "Equatorial ridge",
  retrogradeOrbit: "Retrograde orbit",
  geysers: "Nitrogen geysers",
  thinN2Atmosphere: "Thin N₂ atmosphere",
  cantaloupeTerrain: "Cantaloupe terrain",
};

/** Unit suffix for a scalar keyed by fact key or sub-key. */
const FACT_UNITS: Record<string, string> = {
  atmospherePressureBar: " bar",
  atmosphereN2Percent: "%",
  surfaceTempK: " K",
  meanRadiusKm: " km",
  plumeHeightKm: " km",
  plumeHeightsKm: " km",
  diameterKm: " km",
  combinedAreaKm2: " km²",
  inclinationDeg: "°",
  surfacePressurePa: " Pa",
  meanHeatFlowWm2: " W/m²",
  Pele: " km",
  Tvashtar: " km",
};

function deCamel(key: string): string {
  const s = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtNum(n: number): string {
  if (!isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs !== 0 && (abs >= 1e6 || abs < 1e-3)) return n.toExponential(1);
  return n.toLocaleString(undefined, {
    maximumFractionDigits: abs < 10 ? 3 : 0,
  });
}

function fmtScalar(v: unknown, unit = ""): string | null {
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "Confirmed" : "No";
  if (typeof v === "number") return fmtNum(v) + unit;
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    if (typeof v[0] === "number") {
      const nums = v.filter((x): x is number => typeof x === "number");
      return nums.length === 2
        ? `${fmtNum(nums[0])}–${fmtNum(nums[1])}${unit}`
        : nums.map((x) => fmtNum(x) + unit).join(", ");
    }
    return v.map((x) => String(x)).join(", ");
  }
  return null;
}

/**
 * Build one human-readable value string from a fact object. Uses `value` first
 * (units folded in when the key is known), then appends any extra scalar/array
 * detail keys (skipping source/status). Purely presentational — the individual
 * `source` and `status` are carried separately so the UI can cite each fact.
 */
function formatFactValue(key: string, obj: Record<string, unknown>): string {
  const parts: string[] = [];
  if ("value" in obj) {
    const primary = fmtScalar(obj.value, FACT_UNITS[key] ?? "");
    if (primary) parts.push(primary);
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k === "value" || k === "source" || k === "status") continue;
    const scalar = fmtScalar(v, FACT_UNITS[k] ?? "");
    if (scalar) parts.push(`${deCamel(k)} ${scalar}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "measured";
}

/**
 * Defensive parser for public/data/moons/phenomena.json. Tolerates missing keys
 * and unexpected shapes; returns null if there is nothing usable, so callers can
 * fall back to the static {@link MOON_FACTS} notes. NEVER throws.
 */
export function parseMoonPhenomena(raw: unknown): MoonPhenomenaMap | null {
  if (!raw || typeof raw !== "object") return null;
  const bodies = (raw as Record<string, unknown>).bodies;
  if (!bodies || typeof bodies !== "object") return null;

  const out: MoonPhenomenaMap = {};
  for (const [name, body] of Object.entries(bodies as Record<string, unknown>)) {
    if (!isDetailMoon(name)) continue;
    if (!body || typeof body !== "object") continue;
    const b = body as Record<string, unknown>;
    const facts: MeasuredFact[] = [];
    const rawFacts = b.facts;
    if (rawFacts && typeof rawFacts === "object") {
      for (const [key, fv] of Object.entries(rawFacts as Record<string, unknown>)) {
        if (!fv || typeof fv !== "object") continue;
        const f = fv as Record<string, unknown>;
        const source = typeof f.source === "string" ? f.source : "";
        if (!source) continue; // honesty: no unsourced facts
        facts.push({
          key,
          label: FACT_LABELS[key] ?? deCamel(key),
          value: formatFactValue(key, f),
          source,
          status: typeof f.status === "string" ? f.status : undefined,
        });
      }
    }
    out[name] = {
      headline: typeof b.headline === "string" ? b.headline : undefined,
      weather: typeof b.weather === "boolean" ? b.weather : undefined,
      facts,
    };
  }
  return Object.keys(out).length > 0 ? out : null;
}

// ───────────────────── constants.json (defensive parse) ──────────────────────

/** Static path to the per-moon physical/orbital constants (served from /public). */
export const MOON_CONSTANTS_PATH = "/data/moons/constants.json";

export interface MoonConstantsExtra {
  densityGCm3?: number;
  massKg?: number;
  /** measured surface temp range [min, max] K */
  tempRangeK?: [number, number];
  /** honest albedo caveat (e.g. Iapetus two-tone, Enceladus fresh-ice) */
  albedoNote?: string;
  /** honest temperature caveat (e.g. Iapetus dark vs bright daytime temps) */
  tempNote?: string;
}

export type MoonConstantsMap = Partial<Record<MoonName, MoonConstantsExtra>>;

/**
 * Defensive parser for public/data/moons/constants.json. Pulls only a small,
 * safe subset that ENRICHES the core stats already guaranteed by lib/moons.MOONS
 * (which itself transcribes JPL SSD values). Tolerates missing/odd shapes;
 * returns null when nothing usable is found. NEVER throws.
 */
export function parseMoonConstants(raw: unknown): MoonConstantsMap | null {
  if (!raw || typeof raw !== "object") return null;
  const bodies = (raw as Record<string, unknown>).bodies;
  if (!bodies || typeof bodies !== "object") return null;

  const out: MoonConstantsMap = {};
  for (const [name, body] of Object.entries(bodies as Record<string, unknown>)) {
    if (!isDetailMoon(name)) continue;
    if (!body || typeof body !== "object") continue;
    const b = body as Record<string, unknown>;
    const extra: MoonConstantsExtra = {};
    if (typeof b.density_g_cm3 === "number") extra.densityGCm3 = b.density_g_cm3;
    if (typeof b.mass_kg === "number") extra.massKg = b.mass_kg;
    if (
      Array.isArray(b.temp_range_K) &&
      b.temp_range_K.length >= 2 &&
      typeof b.temp_range_K[0] === "number" &&
      typeof b.temp_range_K[1] === "number"
    ) {
      extra.tempRangeK = [b.temp_range_K[0], b.temp_range_K[1]];
    }
    if (typeof b.albedo_note === "string") extra.albedoNote = b.albedo_note;
    if (typeof b.temp_note === "string") extra.tempNote = b.temp_note;
    if (Object.keys(extra).length > 0) out[name] = extra;
  }
  return Object.keys(out).length > 0 ? out : null;
}
