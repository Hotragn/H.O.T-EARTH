/**
 * Honest presentation + defensive data layer for the EXOPLANETS phase (Phase 8,
 * the "Beyond" group). This is the exoplanet analogue of lib/dwarf-facts.ts: a
 * thin PRESENTATION layer over the pure physics in lib/exoplanets.ts and the
 * single source-of-truth catalogue at public/data/exoplanets/systems.json.
 *
 * Division of responsibility (so every printed pixel is traceable):
 *   • MEASURED catalogue values (period, sma, radius, mass, eqt, insolation,
 *     discovery method/year, star teff/rad/mass/lum, distance) — read verbatim
 *     from systems.json, which is NASA Exoplanet Archive (pscomppars) data.
 *     `null` means the archive has no value; we render "not measured", never a
 *     guess.
 *   • COMPUTED derivations (habitable zone, equilibrium temperature when the
 *     archive has none, composition class, illustrative tint, orbit layout) —
 *     lib/exoplanets.ts pure functions. Every one is labelled as computed.
 *
 * ⚠️ CRITICAL: the archive's `star.lum` is log10(L/Lsun). Callers MUST convert
 * with {@link systemLumLinear} (i.e. lsunFromLogLum) BEFORE passing luminosity
 * to habitableZone / equilibriumTempK / isInHabitableZone. Every helper here
 * that touches luminosity does that conversion for you.
 *
 * HONESTY BAR (phase): NO exoplanet has real surface imagery. The honest
 * substance is MEASURED parameters + system architecture (orbits to relative
 * scale) + COMPUTED habitable zones. Every planet's APPEARANCE is illustrative
 * and labelled as such; the 7 directly-imaged planets are unresolved points of
 * light, not surface maps. Invent nothing. Display the NASA Exoplanet Archive
 * acknowledgment.
 */

import {
  conservativeHZ,
  equilibriumTempK,
  exoPlanetDerived,
  habitableZone,
  isInHabitableZone,
  lsunFromLogLum,
  optimisticHZ,
  pcToLightYears,
  type ExoPlanet,
  type ExoStar,
  type HabitableZone,
} from "./exoplanets";

// ───────────────────────────── Paths + accents ──────────────────────────────

export const EXO_SYSTEMS_PATH = "/data/exoplanets/systems.json";

/** "Beyond" deep-space accent — matches the worlds registry (indigo/violet). */
export const EXO_ACCENT = "#8f7dff";
/** Habitable-zone shading tint (conservative band). */
export const HZ_GREEN = "#3ecf8e";
/** Solar-System comparison accent (Earth-blue). */
export const COMPARE_BLUE = "#5aa9ff";

/** Shown instead of any missing measured value. Never invent. */
export const NOT_MEASURED = "not measured";

// ───────────────────────── Honesty / acknowledgment ─────────────────────────

/**
 * The NASA Exoplanet Archive acknowledgment. This is a HARD REQUIREMENT of using
 * the archive — it must be displayed. We read meta.acknowledgment from the data
 * at runtime (see {@link ExoMeta}); this constant is the exact fallback string so
 * the footer / About panel can render it even if the file is missing.
 */
export const NASA_EXOPLANET_ARCHIVE_ACK =
  "This research has made use of the NASA Exoplanet Archive, which is operated by " +
  "the California Institute of Technology, under contract with the National " +
  "Aeronautics and Space Administration under the Exoplanet Exploration Program.";

/** Primary citation for the archive's Planetary Systems Composite table. */
export const EXO_PRIMARY_CITATION =
  "Christiansen et al. (2025), Planetary Science Journal.";

/**
 * The WASP planets in this catalogue (WASP-12/39/43/96/121) come from the
 * SuperWASP transiting-planet survey, which requests this acknowledgment.
 */
export const WASP_ACK =
  "This catalogue includes planets from the WASP (Wide Angle Search for Planets) " +
  "survey — Butters et al. (2010), A&A 520, L10.";

/** Model citations behind the computed layers (Kopparapu HZ, radius valley). */
export const EXO_MODEL_CITATIONS: readonly { label: string; href: string }[] = [
  {
    label: "Habitable zones: Kopparapu et al. (2013)",
    href: "https://doi.org/10.1088/0004-637X/765/2/131",
  },
  {
    label: "Radius valley (composition): Fulton et al. (2017)",
    href: "https://doi.org/10.3847/1538-3881/aa80eb",
  },
  {
    label: "NASA Exoplanet Archive",
    href: "https://exoplanetarchive.ipac.caltech.edu/",
  },
];

/** The prominent illustrative-appearance disclaimer for every rendered world. */
export const ILLUSTRATIVE_APPEARANCE =
  "Illustrative — no exoplanet has been imaged in surface detail. Colour and " +
  "texture are a temperature/composition cue only, not observed.";

/** Extra line for the 7 directly-imaged planets. */
export const DIRECTLY_IMAGED_NOTE =
  "Directly imaged as an unresolved point of light (not a surface map).";

// ─────────────────────────── Catalogue types ────────────────────────────────

export interface ExoMeta {
  title: string;
  source: string;
  acknowledgment: string;
  primary_citation: string;
  license_note?: string;
  verified_date?: string;
  counts: { systems: number; planets: number };
}

/** One catalogue system — the physics ExoSystem plus the display-only fields. */
export interface ExoSystemData {
  hostname: string;
  common_name?: string | null;
  note?: string | null;
  sy_snum?: number | null;
  distance_pc?: number | null;
  distance_ly?: number | null;
  star: ExoStar;
  planets: (ExoPlanet & { name: string })[];
}

export interface ExoCatalog {
  meta: ExoMeta;
  systems: ExoSystemData[];
}

// ─────────────────────────── Defensive parsing ──────────────────────────────

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
function boolOrNull(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

function parseStar(raw: unknown): ExoStar {
  if (!raw || typeof raw !== "object") return {};
  const s = raw as Record<string, unknown>;
  return {
    spectype: str(s.spectype),
    teff: num(s.teff),
    rad: num(s.rad),
    mass: num(s.mass),
    lum: num(s.lum), // NOTE: log10(L/Lsun) — convert before physics use
  };
}

function parsePlanet(raw: unknown): (ExoPlanet & { name: string }) | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const name = str(p.name);
  if (!name) return null; // a planet with no name is not renderable
  return {
    name,
    method: str(p.method),
    disc_year: num(p.disc_year),
    period_days: num(p.period_days),
    sma_au: num(p.sma_au),
    ecc: num(p.ecc),
    radius_re: num(p.radius_re),
    mass_me: num(p.mass_me),
    eqt_k: num(p.eqt_k),
    insol: num(p.insol),
    directly_imaged: boolOrNull(p.directly_imaged) ?? false,
  };
}

function parseSystem(raw: unknown): ExoSystemData | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const hostname = str(s.hostname);
  if (!hostname) return null;
  const planets = Array.isArray(s.planets)
    ? s.planets.map(parsePlanet).filter((p): p is ExoPlanet & { name: string } => p !== null)
    : [];
  if (planets.length === 0) return null; // an empty system has nothing to show
  return {
    hostname,
    common_name: str(s.common_name),
    note: str(s.note),
    sy_snum: num(s.sy_snum),
    distance_pc: num(s.distance_pc),
    distance_ly: num(s.distance_ly),
    star: parseStar(s.star),
    planets,
  };
}

/**
 * Defensive parser for public/data/exoplanets/systems.json. Tolerates missing
 * keys, nulls and odd shapes; returns null (→ graceful empty state) when there
 * is nothing usable. NEVER throws.
 */
export function parseExoCatalog(raw: unknown): ExoCatalog | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const metaRaw = (root.meta ?? {}) as Record<string, unknown>;
  const systems = Array.isArray(root.systems)
    ? root.systems.map(parseSystem).filter((s): s is ExoSystemData => s !== null)
    : [];
  if (systems.length === 0) return null;

  const countsRaw = (metaRaw.counts ?? {}) as Record<string, unknown>;
  const meta: ExoMeta = {
    title: str(metaRaw.title) ?? "Exoplanet systems",
    source: str(metaRaw.source) ?? "NASA Exoplanet Archive",
    acknowledgment: str(metaRaw.acknowledgment) ?? NASA_EXOPLANET_ARCHIVE_ACK,
    primary_citation: str(metaRaw.primary_citation) ?? EXO_PRIMARY_CITATION,
    license_note: str(metaRaw.license_note) ?? undefined,
    verified_date: str(metaRaw.verified_date) ?? undefined,
    counts: {
      systems: num(countsRaw.systems) ?? systems.length,
      planets:
        num(countsRaw.planets) ??
        systems.reduce((n, s) => n + s.planets.length, 0),
    },
  };
  return { meta, systems };
}

// ─────────────────────────── Derived per-system ─────────────────────────────

/** Linear L/Lsun for a system (converts the log10 archive value). Null-safe. */
export function systemLumLinear(system: ExoSystemData): number | null {
  return lsunFromLogLum(system.star.lum);
}

export interface SystemDerived {
  /** display name (common name preferred) */
  name: string;
  /** linear L/Lsun (converted from the log10 archive value) */
  lumLinear: number | null;
  /** conservative + optimistic HZ (AU), or null if luminosity is unknown */
  hz: HabitableZone | null;
  planetCount: number;
  /** planets whose sma falls in the CONSERVATIVE habitable zone */
  hzCount: number;
  /** distance in light-years (from the file, else computed from parsecs) */
  distanceLy: number | null;
  /** a short star-type label */
  starType: string;
  /** true if any planet was directly imaged */
  hasImaged: boolean;
  /** true if this is a WASP survey host */
  isWasp: boolean;
}

/**
 * Everything the system browser + architecture HUD need in one pure call. The
 * habitable-zone membership and boundaries use the LINEAR luminosity (converted
 * here from the archive's log10 value) — the classic exoplanet pitfall, handled
 * once, correctly.
 */
export function systemDerived(system: ExoSystemData): SystemDerived {
  const lumLinear = systemLumLinear(system);
  const teff = system.star.teff;
  const hz = habitableZone(lumLinear, teff);
  let hzCount = 0;
  for (const p of system.planets) {
    if (isInHabitableZone(p.sma_au, lumLinear, teff, { conservative: true }) === true) {
      hzCount++;
    }
  }
  return {
    name: displayName(system),
    lumLinear,
    hz,
    planetCount: system.planets.length,
    hzCount,
    distanceLy: system.distance_ly ?? pcToLightYears(system.distance_pc),
    starType: starTypeLabel(system.star),
    hasImaged: system.planets.some((p) => p.directly_imaged === true),
    isWasp: /^WASP-/i.test(system.hostname),
  };
}

/** Roll the whole catalogue up into the headline stat row. */
export function catalogTotals(systems: ExoSystemData[]): {
  systems: number;
  planets: number;
  inHZ: number;
} {
  let planets = 0;
  let inHZ = 0;
  for (const s of systems) {
    planets += s.planets.length;
    inHZ += systemDerived(s).hzCount;
  }
  return { systems: systems.length, planets, inHZ };
}

// ─────────────────────────── Display helpers ────────────────────────────────

export function displayName(system: ExoSystemData): string {
  return system.common_name || system.hostname;
}

/** A short star-type label from the spectral type, falling back to Teff. */
export function starTypeLabel(star: ExoStar): string {
  if (star.spectype) return star.spectype;
  if (typeof star.teff === "number" && Number.isFinite(star.teff)) {
    return `~${Math.round(star.teff).toLocaleString()} K star`;
  }
  return "star (type not measured)";
}

/** The Morgan–Keenan class letter (O/B/A/F/G/K/M) if the spectype carries one. */
export function spectralClass(star: ExoStar): string | null {
  const m = star.spectype?.trim().match(/[OBAFGKM]/i);
  return m ? m[0].toUpperCase() : null;
}

/** Jupiter's radius in Earth radii (equatorial). */
export const JUPITER_RADIUS_RE = 11.21;
/** Jupiter's mass in Earth masses. */
export const JUPITER_MASS_ME = 317.8;

export function fmtLy(ly: number | null): string {
  if (ly === null) return NOT_MEASURED;
  if (ly < 100) return `${ly.toFixed(1)} ly`;
  return `${Math.round(ly).toLocaleString()} ly`;
}

export function fmtAU(au: number | null | undefined): string {
  if (typeof au !== "number" || !Number.isFinite(au)) return NOT_MEASURED;
  if (au < 0.1) return `${au.toFixed(4)} AU`;
  if (au < 1) return `${au.toFixed(3)} AU`;
  return `${au.toFixed(2)} AU`;
}

export function fmtDays(d: number | null | undefined): string {
  if (typeof d !== "number" || !Number.isFinite(d)) return NOT_MEASURED;
  if (d < 1) return `${(d * 24).toFixed(1)} h`;
  if (d < 1000) return `${d.toFixed(d < 10 ? 3 : 1)} d`;
  return `${(d / 365.25).toFixed(2)} yr`;
}

/** Radius label in Earth radii, adding Jupiter radii for large planets. */
export function fmtRadius(re: number | null | undefined): string {
  if (typeof re !== "number" || !Number.isFinite(re)) return NOT_MEASURED;
  const base = `${re.toFixed(2)} R⊕`;
  if (re >= 6) return `${base} · ${(re / JUPITER_RADIUS_RE).toFixed(2)} R♃`;
  return base;
}

/** Mass label in Earth masses, adding Jupiter masses for large planets. */
export function fmtMass(me: number | null | undefined): string {
  if (typeof me !== "number" || !Number.isFinite(me)) return NOT_MEASURED;
  if (me >= 50) {
    return `${me.toFixed(0)} M⊕ · ${(me / JUPITER_MASS_ME).toFixed(2)} M♃`;
  }
  return `${me.toFixed(me < 10 ? 2 : 1)} M⊕`;
}

/** True when the mass is a minimum mass (M·sin i), i.e. a Radial-Velocity find. */
export function isMinimumMass(planet: ExoPlanet): boolean {
  return (planet.method ?? "").toLowerCase().includes("radial velocity");
}

export function fmtTempK(k: number | null | undefined): string {
  if (typeof k !== "number" || !Number.isFinite(k)) return NOT_MEASURED;
  return `${Math.round(k)} K`;
}

export function fmtEcc(e: number | null | undefined): string {
  if (typeof e !== "number" || !Number.isFinite(e)) return NOT_MEASURED;
  return e.toFixed(3);
}

export function fmtInsol(f: number | null | undefined): string {
  if (typeof f !== "number" || !Number.isFinite(f)) return NOT_MEASURED;
  if (f >= 100) return `${Math.round(f).toLocaleString()}× Earth`;
  return `${f.toFixed(f < 10 ? 2 : 0)}× Earth`;
}

/** "0.95–1.68 AU" style band label. */
export function fmtHZBand(band: { inner: number; outer: number } | null): string {
  if (!band) return NOT_MEASURED;
  return `${band.inner.toFixed(band.inner < 0.1 ? 3 : 2)}–${band.outer.toFixed(
    band.outer < 0.1 ? 3 : 2
  )} AU`;
}

// ─────────────────────────── Sorting the browser ────────────────────────────

export type SortMode = "notable" | "nearest" | "planets" | "name";

export const SORT_MODES: readonly { id: SortMode; label: string }[] = [
  { id: "notable", label: "Notable" },
  { id: "nearest", label: "Nearest" },
  { id: "planets", label: "Most planets" },
  { id: "name", label: "Name" },
];

/** Distance in ly for sorting (missing → +Infinity so it sinks to the bottom). */
function distanceOrInf(s: ExoSystemData): number {
  return s.distance_ly ?? pcToLightYears(s.distance_pc) ?? Number.POSITIVE_INFINITY;
}

/**
 * Sort a copy of the systems for the browser. "Notable" surfaces systems that
 * carry a curated `note` first, then orders by distance; the others fall through
 * to distance order. All ties break by distance then name so the order is
 * deterministic.
 */
export function sortSystems(
  systems: ExoSystemData[],
  mode: SortMode
): ExoSystemData[] {
  const copy = [...systems];
  const byDist = (a: ExoSystemData, b: ExoSystemData) =>
    distanceOrInf(a) - distanceOrInf(b) || displayName(a).localeCompare(displayName(b));
  switch (mode) {
    case "nearest":
      return copy.sort(byDist);
    case "planets":
      return copy.sort(
        (a, b) => b.planets.length - a.planets.length || byDist(a, b)
      );
    case "name":
      return copy.sort((a, b) => displayName(a).localeCompare(displayName(b)));
    case "notable":
    default:
      return copy.sort((a, b) => {
        const an = a.note ? 0 : 1;
        const bn = b.note ? 0 : 1;
        return an - bn || byDist(a, b);
      });
  }
}

/**
 * Free-text filter over host + common name + planet names + note. Empty query
 * returns the list unchanged.
 */
export function filterSystems(
  systems: ExoSystemData[],
  query: string
): ExoSystemData[] {
  const q = query.trim().toLowerCase();
  if (!q) return systems;
  return systems.filter((s) => {
    const hay = [
      s.hostname,
      s.common_name ?? "",
      s.note ?? "",
      s.star.spectype ?? "",
      ...s.planets.map((p) => p.name),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

// re-export the physics identifiers callers commonly need alongside this config
export {
  conservativeHZ,
  optimisticHZ,
  equilibriumTempK,
  exoPlanetDerived,
  isInHabitableZone,
  lsunFromLogLum,
};
export type { ExoPlanet, ExoStar, HabitableZone };
