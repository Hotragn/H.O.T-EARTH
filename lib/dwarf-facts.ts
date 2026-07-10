/**
 * Honest per-body presentation config for the DWARF PLANETS phase (Phase 6).
 * This is the dwarf-planet analogue of lib/planet-facts.ts and lib/moon-facts.ts:
 * a small PRESENTATION layer over the real physics in lib/dwarf-planets.ts
 * (orbital mechanics, terminator, triaxial shape) and the two source-of-truth
 * data files under public/data/dwarf-planets/.
 *
 * Division of responsibility (so every printed pixel is traceable):
 *   • DYNAMIC orbital numbers (heliocentric distance, sub-solar longitude,
 *     terminator) — computed at runtime from lib/dwarf-planets.ts. Nothing here
 *     is a model output.
 *   • CORE physical/orbital stats (radius, period, eccentricity, inclination,
 *     albedo, temp, moons) — read from lib/dwarf-planets (DWARFS / CHARON),
 *     which transcribes JPL SBDB + mission values.
 *   • MEASURED "feature" facts (each individually source-tagged, uncertain items
 *     flagged) — parsed DEFENSIVELY at runtime from
 *     public/data/dwarf-planets/phenomena.json via {@link parseDwarfPhenomena}.
 *   • Extra physical detail + honesty notes (mass, density, temp, rotation
 *     uncertainty, ring/shape/binary/resonance/atmosphere notes) — parsed
 *     defensively from public/data/dwarf-planets/constants.json via
 *     {@link parseDwarfConstants}.
 *   • The curated per-body notes, accents and texture caveats below are static
 *     presentation copy, transcribed from those same files with brief citations.
 *
 * HONESTY BAR (phase): dwarf planets have NO weather — the honest substance is
 * orbital mechanics + measured facts + real textures WHERE THEY EXIST. Only
 * Pluto, Charon (New Horizons 2015) and Ceres (Dawn 2015) have real surface
 * maps. Eris, Haumea and Makemake have NEVER been visited — they are rendered as
 * clearly-labelled ILLUSTRATIVE spheres, never implying real imagery. Haumea's
 * triaxial SHAPE and its RING, however, are real, measured geometry. Invent
 * nothing; label everything.
 */

import {
  CHARON,
  DWARFS,
  DWARF_ORDER,
  isImaged,
  type DwarfName,
  type SpinningBody,
} from "./dwarf-planets";

/** Every body with a detail globe: the five dwarf planets + Pluto's moon Charon. */
export type DwarfBodyName = SpinningBody;

/** The five dwarf planets that appear as nodes in the orrery (Charon is Pluto's moon). */
export const ORRERY_DWARFS: readonly DwarfName[] = DWARF_ORDER;

/** All six detail bodies (orrery bodies + Charon, reached from Pluto's HUD). */
export const DETAIL_DWARFS: readonly DwarfBodyName[] = [
  "Ceres",
  "Pluto",
  "Charon",
  "Haumea",
  "Makemake",
  "Eris",
] as const;

export function isDwarfBody(name: string): name is DwarfBodyName {
  return (DETAIL_DWARFS as readonly string[]).includes(name);
}

export function isOrreryDwarf(name: string): name is DwarfName {
  return (ORRERY_DWARFS as readonly string[]).includes(name);
}

/** True iff a real spacecraft surface map exists (Pluto, Charon, Ceres only). */
export function hasRealMap(name: DwarfBodyName): boolean {
  return isImaged(name);
}

// ───────────────────────────── Accents ──────────────────────────────────────

/**
 * Per-body accent colour (dark mission-control palette; per-body character):
 * Pluto tan, Charon grey-red (Mordor cap), Ceres grey, Eris pale, Haumea white,
 * Makemake red-brown.
 */
export const DWARF_ACCENT: Record<DwarfBodyName, string> = {
  Pluto: "#d2a679", // tan / the reddish "heart"
  Charon: "#b58f80", // grey with a reddish north-polar cap (Mordor Macula)
  Ceres: "#9a948c", // neutral carbonaceous grey
  Eris: "#d7dee4", // dazzlingly pale methane frost (albedo ~0.96)
  Haumea: "#eef1f4", // bright crystalline water ice
  Makemake: "#c56b4a", // reddish methane-ice + tholins
};

/** Procedural fallback / illustrative tint (RGB 0–1). */
export const DWARF_TINT: Record<DwarfBodyName, [number, number, number]> = {
  Pluto: [0.82, 0.66, 0.5],
  Charon: [0.62, 0.58, 0.56],
  Ceres: [0.5, 0.48, 0.45],
  Eris: [0.85, 0.88, 0.9],
  Haumea: [0.9, 0.92, 0.95],
  Makemake: [0.72, 0.45, 0.32],
};

/**
 * Relative orrery dot radius (scene units). NOT to scale (labelled): Ceres is a
 * touch smaller, the big TNOs a touch larger, so the size ordering reads at a
 * glance without pretending these are true diameters.
 */
export const DWARF_DOT_RADIUS: Record<DwarfName, number> = {
  Ceres: 0.12,
  Pluto: 0.17,
  Haumea: 0.15,
  Makemake: 0.15,
  Eris: 0.16,
};

// ───────────────────────── Haumea ring (real geometry) ──────────────────────

/**
 * Haumea's ring — the FIRST ring discovered around a trans-Neptunian object
 * (Ortiz et al. 2017, Nature 550): radius ~2287 km, width ~70 km, in a 3:1
 * resonance with the ~3.9 h spin. Hard-coded (like the triaxial axes in
 * lib/dwarf-planets) because it is a measured constant, not a model output; the
 * defensive JSON parse can override it if constants.json carries a value.
 */
export const HAUMEA_RING = {
  radiusKm: 2287,
  widthKm: 70,
  source: "Ortiz et al. 2017, Nature 550",
} as const;

// ───────────────────────────── Texture caveats ──────────────────────────────

export interface TextureCaveat {
  label: string;
  detail: string;
}

/**
 * Honesty caveats for the three REAL maps. All are grayscale albedo mosaics
 * (real data, not colourised); Pluto and Charon are single-flyby, so their far
 * sides are markedly lower-resolution.
 */
export const TEXTURE_CAVEAT: Partial<Record<DwarfBodyName, TextureCaveat>> = {
  Pluto: {
    label: "New Horizons flyby mosaic · far side lower-res",
    detail:
      "Real New Horizons imagery (2015), shown as a grayscale albedo map (not colourised). One flyby only, so the encounter hemisphere is sharp while the far side is markedly lower-resolution.",
  },
  Charon: {
    label: "New Horizons flyby mosaic · far side lower-res",
    detail:
      "Real New Horizons imagery (2015), shown as a grayscale albedo map. As with Pluto, only the encounter hemisphere was resolved; the far side is low-resolution.",
  },
  Ceres: {
    label: "Dawn global mosaic · grayscale albedo",
    detail:
      "Real Dawn Framing Camera mosaic (2015–2018), shown as a grayscale albedo map (clear filter), not colourised. Global coverage, so no far-side gap.",
  },
};

/** The prominent badge shown on every un-imaged body's globe + HUD. */
export const ILLUSTRATIVE_BADGE =
  "Illustrative — never visited by a spacecraft; no surface map exists.";

// ───────────────────────────── Static facts ─────────────────────────────────

export interface DwarfFacts {
  name: DwarfBodyName;
  accent: string;
  /** one-line honest hook (mirrors phenomena.json headline; used as fallback) */
  headline: string;
  /** short type label for the HUD */
  type: string;
  /** curated, cited body-specific bullet notes (transcribed w/ brief sources) */
  notes: string[];
}

/**
 * Curated per-body copy. Headlines mirror phenomena.json; notes summarise the
 * measured facts + primary sources named there (Stern 2015, Moore 2016,
 * Gladstone 2016, Grundy 2016, Nathues 2015 / De Sanctis 2016, Sicardy 2011,
 * Ortiz 2017/2012). These are the fallback when phenomena.json is unavailable.
 */
export const DWARF_FACTS: Record<DwarfBodyName, DwarfFacts> = {
  Pluto: {
    name: "Pluto",
    accent: DWARF_ACCENT.Pluto,
    headline:
      "Nitrogen-glacier heart, hazy atmosphere and reddish tholins — imaged by New Horizons",
    type: "Dwarf planet",
    notes: [
      "Nitrogen-ice glaciers fill Sputnik Planitia — the left lobe of the bright 'heart' (Tombaugh Regio); the ice actively convects and flows (Moore et al. 2016).",
      "A thin N₂ atmosphere (~1 Pa) with 20+ stacked photochemical haze layers hundreds of km up (Gladstone et al. 2016).",
      "Reddish-brown tholins from methane/nitrogen photochemistry darken the surface; ~44 K, among the coldest known (Stern et al. 2015).",
      "3:2 mean-motion resonance with Neptune: Pluto orbits twice for every three Neptune orbits, and its path crosses Neptune's yet they never approach.",
    ],
  },
  Charon: {
    name: "Charon",
    accent: DWARF_ACCENT.Charon,
    headline:
      "Pluto's binary partner: reddish polar cap, giant canyons, mutually tidally locked",
    type: "Moon of Pluto",
    notes: [
      "Mordor Macula — a dark reddish north-polar cap of tholins cold-trapped from Pluto's escaping atmosphere (Grundy et al. 2016).",
      "A vast equatorial canyon belt (Serenity Chasma >1000 km long; Argo Chasma perhaps ~9 km deep) — far deeper than the Grand Canyon.",
      "Pluto and Charon are MUTUALLY tidally locked — each keeps one face to the other, both turning with the 6.387 d orbit.",
      "The Pluto–Charon barycenter lies OUTSIDE Pluto (~2110 km from its centre > its 1188 km radius), so the pair is a true BINARY (Brozović et al. 2015).",
    ],
  },
  Ceres: {
    name: "Ceres",
    accent: DWARF_ACCENT.Ceres,
    headline: "Salt-bright Occator crater and a cryovolcano — imaged by Dawn",
    type: "Dwarf planet",
    notes: [
      "The bright spots in Occator crater are sodium-carbonate salts left by briny water that reached the surface and sublimated (Nathues 2015; De Sanctis et al. 2016).",
      "Ahuna Mons is a young cryovolcanic dome ~4 km high built by icy/briny cryovolcanism (Ruesch et al. 2016).",
      "Dawn gravity + imaging point to a deep subsurface brine reservoir feeding Occator's recent deposits.",
      "The largest object in the asteroid belt (~25% of its mass) and the only dwarf planet in the inner solar system.",
    ],
  },
  Eris: {
    name: "Eris",
    accent: DWARF_ACCENT.Eris,
    headline:
      "The most massive dwarf planet — a distant, dazzlingly reflective methane-ice world",
    type: "Dwarf planet (trans-Neptunian)",
    notes: [
      "The MOST MASSIVE dwarf planet (~27% more massive than Pluto, from Dysnomia's orbit) yet slightly smaller in diameter (Brown & Schaller 2007).",
      "Diameter 2326 km and geometric albedo ~0.96 — one of the most reflective surfaces in the solar system (fresh methane frost) — from a 2010 stellar occultation (Sicardy et al. 2011).",
      "Very distant and eccentric (a ~68 AU, perihelion ~38 AU); currently near aphelion, so its atmosphere is frozen to the surface.",
      "Its moon Dysnomia gives Eris its mass. NEVER visited — the rendered surface is illustrative.",
    ],
  },
  Haumea: {
    name: "Haumea",
    accent: DWARF_ACCENT.Haumea,
    headline:
      "A fast-spinning, egg-shaped dwarf planet with a ring and two moons",
    type: "Dwarf planet (trans-Neptunian)",
    notes: [
      "An extreme triaxial (Jacobi) ellipsoid ~2100 × 1680 × 1074 km, elongated by its very fast spin (Ortiz et al. 2017).",
      "Rotation ~3.9 h — one of the fastest of any large body in the solar system — is what forces the elongated shape.",
      "A ring at radius ~2287 km, width ~70 km — the FIRST ring found around a trans-Neptunian object, in a 3:1 resonance with the spin (Ortiz et al. 2017).",
      "Two moons, Hiʻiaka and Namaka; surface 66–80% crystalline water ice. NEVER visited — the surface is illustrative, but the shape and ring are real, measured geometry.",
    ],
  },
  Makemake: {
    name: "Makemake",
    accent: DWARF_ACCENT.Makemake,
    headline:
      "A bright methane-ice dwarf planet with no substantial atmosphere and one small moon",
    type: "Dwarf planet (trans-Neptunian)",
    notes: [
      "~1430 km across, geometric albedo ~0.82 — brighter than Pluto — from a 2011 stellar occultation (Ortiz et al. 2012).",
      "Surface dominated by frozen methane and ethane with reddish-brown tholins (Licandro et al. 2006).",
      "NO substantial global atmosphere: the sharp occultation profile set an upper limit of ~4–12 nbar (unlike Pluto).",
      "One small, dark moon (S/2015 (136472) 1, found 2016). NEVER visited — the rendered surface is illustrative.",
    ],
  },
};

/**
 * The honesty banner shown on every detail view. Un-imaged bodies additionally
 * carry the illustrative-appearance disclaimer (returned separately so the UI
 * can style it prominently).
 */
export function honestBanner(): string {
  return "No weather — a distant icy/rocky world. Its orbit and rotation are computed; surface features are measured by spacecraft where one has visited.";
}

// ───────────────────── phenomena.json (defensive parse) ──────────────────────

export const DWARF_PHENOMENA_PATH = "/data/dwarf-planets/phenomena.json";

export interface DwarfMeasuredFact {
  key: string;
  label: string;
  value: string;
  source: string;
  status?: string;
}

export interface DwarfPhenomena {
  headline?: string;
  weather?: boolean;
  imaged?: boolean;
  appearance?: string;
  facts: DwarfMeasuredFact[];
  /** the extracted appearanceNote (un-imaged bodies), surfaced prominently */
  appearanceNote?: { value: string; source: string };
}

export type DwarfPhenomenaMap = Partial<Record<DwarfBodyName, DwarfPhenomena>>;

const FACT_LABELS: Record<string, string> = {
  surfaceIces: "Surface ices",
  sputnikPlanitia: "Sputnik Planitia",
  atmosphere: "Atmosphere",
  tholins: "Tholins",
  surfaceTempK: "Surface temperature",
  moons: "Moons",
  neptuneResonance: "Neptune resonance",
  mordorMacula: "Mordor Macula",
  canyons: "Canyons",
  mutualTidalLock: "Mutual tidal lock",
  binaryBarycenter: "Binary barycenter",
  occatorBrightSpots: "Occator bright spots",
  ahunaMons: "Ahuna Mons",
  subsurfaceBrine: "Subsurface brine",
  rotationHours: "Rotation period",
  largestBeltObject: "Largest belt object",
  mostMassive: "Most massive dwarf",
  sizeAlbedo: "Size & albedo",
  distance: "Distance",
  moon: "Moon",
  triaxialShape: "Triaxial shape",
  fastRotation: "Fast rotation",
  ring: "Ring",
  crystallineIce: "Crystalline ice",
  methaneEthaneIce: "Methane / ethane ice",
  noAtmosphere: "Atmosphere",
  rotation: "Rotation period",
};

const FACT_UNITS: Record<string, string> = {
  surfaceTempK: " K",
  diameterKm: " km",
  radiusKm: " km",
  widthKm: " km",
  hours: " h",
  axesKm: " km",
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
  return n.toLocaleString(undefined, { maximumFractionDigits: abs < 10 ? 3 : 0 });
}

function fmtScalar(v: unknown, unit = ""): string | null {
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "Confirmed" : "No";
  if (typeof v === "number") return fmtNum(v) + unit;
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    if (typeof v[0] === "number") {
      const nums = v.filter((x): x is number => typeof x === "number");
      return nums.map((x) => fmtNum(x)).join(" × ") + unit;
    }
    return v.map((x) => String(x)).join(", ");
  }
  return null;
}

/**
 * Build one human-readable value string from a fact object. Uses `value` first,
 * then appends any extra scalar/array detail keys (skipping source/status/names).
 * Purely presentational — `source` and `status` are carried separately.
 */
function formatFactValue(obj: Record<string, unknown>): string {
  const parts: string[] = [];
  if ("value" in obj) {
    const primary = fmtScalar(obj.value);
    if (primary) parts.push(primary);
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k === "value" || k === "source" || k === "status" || k === "names") continue;
    const scalar = fmtScalar(v, FACT_UNITS[k] ?? "");
    if (scalar) parts.push(`${deCamel(k)} ${scalar}`);
  }
  // fold moon/name lists in for readability
  if (Array.isArray(obj.names) && obj.names.length > 0) {
    parts.push(obj.names.map((x) => String(x)).join(", "));
  }
  return parts.length > 0 ? parts.join(" · ") : "measured";
}

/**
 * Defensive parser for public/data/dwarf-planets/phenomena.json. Tolerates
 * missing keys and unexpected shapes; returns null if there is nothing usable so
 * callers fall back to the static {@link DWARF_FACTS}. NEVER throws. The
 * `appearanceNote` fact is pulled out separately for prominent display and left
 * out of the general facts list.
 */
export function parseDwarfPhenomena(raw: unknown): DwarfPhenomenaMap | null {
  if (!raw || typeof raw !== "object") return null;
  const bodies = (raw as Record<string, unknown>).bodies;
  if (!bodies || typeof bodies !== "object") return null;

  const out: DwarfPhenomenaMap = {};
  for (const [name, body] of Object.entries(bodies as Record<string, unknown>)) {
    if (!isDwarfBody(name)) continue;
    if (!body || typeof body !== "object") continue;
    const b = body as Record<string, unknown>;
    const facts: DwarfMeasuredFact[] = [];
    let appearanceNote: { value: string; source: string } | undefined;

    const rawFacts = b.facts;
    if (rawFacts && typeof rawFacts === "object") {
      for (const [key, fv] of Object.entries(rawFacts as Record<string, unknown>)) {
        if (!fv || typeof fv !== "object") continue;
        const f = fv as Record<string, unknown>;
        const source = typeof f.source === "string" ? f.source : "";
        if (!source) continue; // honesty: no unsourced facts
        if (key === "appearanceNote") {
          appearanceNote = {
            value: typeof f.value === "string" ? f.value : "Illustrative — never visited.",
            source,
          };
          continue;
        }
        facts.push({
          key,
          label: FACT_LABELS[key] ?? deCamel(key),
          value: formatFactValue(f),
          source,
          status: typeof f.status === "string" ? f.status : undefined,
        });
      }
    }
    out[name] = {
      headline: typeof b.headline === "string" ? b.headline : undefined,
      weather: typeof b.weather === "boolean" ? b.weather : undefined,
      imaged: typeof b.imaged === "boolean" ? b.imaged : undefined,
      appearance: typeof b.appearance === "string" ? b.appearance : undefined,
      facts,
      appearanceNote,
    };
  }
  return Object.keys(out).length > 0 ? out : null;
}

// ───────────────────── constants.json (defensive parse) ──────────────────────

export const DWARF_CONSTANTS_PATH = "/data/dwarf-planets/constants.json";

export interface DwarfConstantsExtra {
  designation?: string;
  type?: string;
  massKg?: number;
  densityGCm3?: number;
  meanTempK?: number;
  eccentricity?: number;
  inclinationDeg?: number;
  perihelionAu?: number;
  orbitalPeriodYears?: number;
  semiMajorAxisAu?: number;
  rotationPeriodHours?: number;
  moonNames?: string[];
  moonCount?: number;
  /** honesty notes surfaced in the HUD when present */
  rotationNote?: string;
  tempNote?: string;
  orbitNote?: string;
  ringNote?: string;
  shapeNote?: string;
  barycenterNote?: string;
  neptuneResonance?: string;
  atmosphereNote?: string;
  hasRing?: boolean;
  /** Charon: semi-major axis about Pluto [km] */
  semiMajorAxisKmFromPluto?: number;
}

export type DwarfConstantsMap = Partial<Record<DwarfBodyName, DwarfConstantsExtra>>;

function num(v: unknown): number | undefined {
  return typeof v === "number" && isFinite(v) ? v : undefined;
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/**
 * Defensive parser for public/data/dwarf-planets/constants.json. Pulls only a
 * small, safe subset that ENRICHES the core stats already guaranteed by
 * lib/dwarf-planets (which transcribes JPL SBDB + mission values). Tolerates
 * missing/odd shapes; returns null when nothing usable is found. NEVER throws.
 */
export function parseDwarfConstants(raw: unknown): DwarfConstantsMap | null {
  if (!raw || typeof raw !== "object") return null;
  const bodies = (raw as Record<string, unknown>).bodies;
  if (!bodies || typeof bodies !== "object") return null;

  const out: DwarfConstantsMap = {};
  for (const [name, body] of Object.entries(bodies as Record<string, unknown>)) {
    if (!isDwarfBody(name)) continue;
    if (!body || typeof body !== "object") continue;
    const b = body as Record<string, unknown>;
    const extra: DwarfConstantsExtra = {};

    extra.designation = str(b.designation);
    extra.type = str(b.type);
    extra.massKg = num(b.mass_kg);
    extra.densityGCm3 = num(b.density_g_cm3);
    extra.meanTempK = num(b.mean_temp_K);
    extra.eccentricity = num(b.eccentricity);
    extra.inclinationDeg = num(b.inclination_deg);
    extra.perihelionAu = num(b.perihelion_au);
    extra.orbitalPeriodYears = num(b.orbital_period_years);
    extra.semiMajorAxisAu = num(b.semimajor_axis_au);
    extra.rotationPeriodHours = num(b.rotation_period_hours);
    extra.semiMajorAxisKmFromPluto = num(b.semimajor_axis_km_from_Pluto);
    extra.rotationNote = str(b.rotation_note);
    extra.tempNote = str(b.temp_note);
    extra.orbitNote = str(b.orbit_note);
    extra.ringNote = str(b.ring_note);
    extra.shapeNote = str(b.shape_note);
    extra.barycenterNote = str(b.barycenter_note);
    extra.neptuneResonance = str(b.neptune_resonance);
    extra.atmosphereNote = str(b.atmosphere_note);
    if (typeof b.has_ring === "boolean") extra.hasRing = b.has_ring;

    const km = b.known_moons;
    if (km && typeof km === "object") {
      const kmo = km as Record<string, unknown>;
      extra.moonCount = num(kmo.count);
      if (Array.isArray(kmo.names)) {
        extra.moonNames = kmo.names.filter((x): x is string => typeof x === "string");
      }
    }

    // strip undefined so callers can cleanly test presence
    for (const k of Object.keys(extra) as (keyof DwarfConstantsExtra)[]) {
      if (extra[k] === undefined) delete extra[k];
    }
    if (Object.keys(extra).length > 0) out[name] = extra;
  }
  return Object.keys(out).length > 0 ? out : null;
}

// re-export the physics identifiers callers commonly need alongside this config
export { DWARFS, CHARON, isImaged };
export type { DwarfName };
