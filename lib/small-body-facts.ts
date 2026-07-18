/**
 * Honest presentation + defensive data layer for the COMETS & ASTEROIDS phase
 * (Phase 9, the "Comets & Asteroids" world in the Solar-System group). This is
 * the small-body analogue of lib/exo-facts.ts / lib/dwarf-facts.ts: a thin
 * PRESENTATION layer over the pure physics in lib/small-bodies.ts and the single
 * source-of-truth catalogue at public/data/small-bodies/objects.json (built from
 * the JPL Small-Body Database + CNEOS Close-Approach Data).
 *
 * Division of responsibility (so every printed pixel is traceable):
 *   • MEASURED catalogue values (orbital elements a/e/q/Q/i/Ω/ω/period, MOID,
 *     Tisserand, physical diameter/rotation/albedo/spectral/H, close approaches)
 *     — read verbatim from objects.json (JPL SBDB / CNEOS). `null` means the
 *     database has no value; we render "—" / "not measured", never a guess.
 *   • COMPUTED classification (orbit regime, NEO group, comet family, bound vs
 *     unbound) — lib/small-bodies.ts pure functions, labelled as computed.
 *
 * HONESTY BAR (phase):
 *   1. HAZARD DATA IS FACTUAL, NEVER SENSATIONAL. PHA flags + close approaches
 *      are real numbers, stated plainly. Apophis's 2029 pass is a real ~31,600 km
 *      close approach with impact RULED OUT (removed from NASA Sentry in 2021).
 *   2. APPEARANCES: most small bodies are un-imaged irregular rocks → illustrative
 *      procedural lumps, labelled. A few have real imagery (Eros/Vesta/Bennu maps;
 *      Gaspra/Ida/Didymos/67P mission photos). 67P is ESA CC BY-SA 3.0 IGO and
 *      MUST carry the exact credit below wherever it appears.
 */

import {
  cometClass,
  isBound,
  isInterstellar,
  moidNote,
  neaClass,
  orbitRegime,
  type CometClassification,
  type NeaClass,
  type OrbitRegime,
  type SmallBodyElements,
} from "./small-bodies";

// ───────────────────────────── Paths + accents ──────────────────────────────

export const SMALL_BODIES_PATH = "/data/small-bodies/objects.json";

/** The "Comets & Asteroids" accent — icy cyan (matches the worlds registry). */
export const SMALL_BODY_ACCENT = "#5fd3e6";
/** Comet orbits / markers — icy cyan. */
export const COMET_COLOR = "#5fd3e6";
/** Asteroid orbits / markers — dusty tan. */
export const ASTEROID_COLOR = "#c9a36b";
/** PHA emphasis — a calm warm amber (factual, not alarm). */
export const PHA_COLOR = "#f2a63b";
/** Unbound / interstellar orbits — violet, visually distinct from bound loops. */
export const OPEN_ORBIT_COLOR = "#c8a6ff";
/** Planet reference orbits. */
export const PLANET_REF_COLOR = "#3b6fe0";
/** Earth's reference orbit (highlighted). */
export const EARTH_REF_COLOR = "#4aa3ff";

/** Shown instead of any missing measured value. Never invent. */
export const NOT_MEASURED = "not measured";

// ───────────────────────── Honesty / acknowledgment ─────────────────────────

/**
 * Courtesy credit for the JPL Small-Body Database + CNEOS. The SSD/CNEOS API
 * pages state NO explicit license and request NO specific acknowledgment; this
 * is US-Government (NASA/JPL/Caltech) data, freely usable. We credit it anyway.
 */
export const SBDB_CNEOS_ACK =
  "Orbits, physical parameters and close approaches: NASA/JPL Small-Body Database " +
  "(SBDB) and CNEOS Close-Approach Data. US-Government (NASA/JPL-Caltech) data, " +
  "freely usable; courtesy credit given.";

/** HARD REQUIREMENT: the exact 67P imagery credit, used everywhere 67P appears. */
export const CG_67P_CREDIT = "ESA/Rosetta/NAVCAM, CC BY-SA 3.0 IGO";

/** The public-domain NASA/USGS imagery credit for the map/photo bodies. */
export const NASA_USGS_IMAGERY_CREDIT =
  "Eros / Vesta / Bennu / Gaspra / Ida / Didymos imagery: NASA / JPL / USGS " +
  "(NEAR, Dawn, OSIRIS-REx, Galileo, DART), public domain.";

/** The phase honesty banner shown on the object detail HUD. */
export const SMALL_BODY_HONESTY =
  "Orbits and physical parameters are real, measured JPL Small-Body Database " +
  "values. Most of these bodies have never been imaged in detail — those " +
  "appearances are illustrative procedural rocks, labelled. Hazard facts are " +
  "stated plainly, neither sensationalised nor downplayed.";

/** The illustrative-appearance disclaimer for un-imaged bodies. */
export const ILLUSTRATIVE_APPEARANCE =
  "Illustrative — no detailed surface imagery of this body exists. Shown as a " +
  "procedural irregular rock; the shape and markings are not observed.";

/**
 * The exact, factual Apophis 2029 framing (hard requirement). Real numbers, no
 * fear language, impact ruled out.
 */
export const APOPHIS_2029_NOTE =
  "On 13 April 2029, Apophis passes about 31,600 km above Earth's surface " +
  "(≈ 0.099 lunar distances; ~38,000 km from Earth's centre) — close enough to " +
  "be visible to the naked eye. Its 2029, 2036 and 2068 impact scenarios were " +
  "ruled out after 2021 radar tracking; NASA removed Apophis from the Sentry " +
  "risk list. This is a well-observed, non-hazardous close approach.";

/** Apophis's SBDB designation, used to highlight its close approach. */
export const APOPHIS_DESIGNATION = "99942";

// ─────────────────────────── Catalogue types ────────────────────────────────

export interface SmallBodyClassInfo {
  code: string | null;
  name: string | null;
}

/**
 * Orbital elements as carried in objects.json. A SUPERSET of the lib
 * SmallBodyElements shape (adds the measured hyperbolic / moid / Tisserand /
 * epoch fields), so an object's `elements` can be passed straight to the physics
 * functions. NOTE: the catalogue provides NO mean anomaly (`ma`) or time of
 * perihelion (`tp`), so a live heliocentric POSITION cannot be computed — only
 * the orbit SHAPE (which needs no time anchor). We degrade gracefully.
 */
export interface SmallBodyElementsData extends SmallBodyElements {
  a: number | null;
  e: number | null;
  q: number | null;
  Q: number | null;
  i: number | null;
  om: number | null;
  w: number | null;
  period_yr: number | null;
  hyperbolic: boolean;
  moid_au: number | null;
  t_jup: number | null;
  epoch_jd: number | null;
}

export interface SmallBodyPhysical {
  diameter_km: number | null;
  rotation_h: number | null;
  albedo: number | null;
  spectral: string | null;
  H: number | null;
  comet_total_mag_M1: number | null;
}

export type SmallBodyKind = "comet" | "asteroid";

export interface SmallBodyObject {
  name: string;
  fullname: string | null;
  designation: string | null;
  kind: SmallBodyKind;
  class: SmallBodyClassInfo;
  pha: boolean;
  neo: boolean;
  interstellar: boolean;
  visited: boolean;
  mission: string | null;
  elements: SmallBodyElementsData;
  physical: SmallBodyPhysical;
  note: string | null;
}

export interface CloseApproachData {
  object: string;
  designation: string | null;
  date: string;
  dist_au: number | null;
  dist_ld: number | null;
  v_rel_kms: number | null;
  h: number | null;
}

export interface SmallBodyMeta {
  title: string;
  source: string;
  acknowledgment: string;
  honesty: string;
  counts: {
    objects: number;
    comets: number;
    asteroids: number;
    pha: number;
    visited: number;
    interstellar: number;
    close_approaches: number;
  };
}

export interface SmallBodyCatalog {
  meta: SmallBodyMeta;
  objects: SmallBodyObject[];
  close_approaches: CloseApproachData[];
}

// ─────────────────────────── Defensive parsing ──────────────────────────────

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}
function bool(v: unknown): boolean {
  return v === true;
}

function parseClass(raw: unknown): SmallBodyClassInfo {
  if (!raw || typeof raw !== "object") return { code: null, name: null };
  const c = raw as Record<string, unknown>;
  return { code: str(c.code), name: str(c.name) };
}

function parseElements(raw: unknown): SmallBodyElementsData {
  const e = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    a: num(e.a),
    e: num(e.e),
    q: num(e.q),
    Q: num(e.Q),
    i: num(e.i),
    om: num(e.om),
    w: num(e.w),
    period_yr: num(e.period_yr),
    hyperbolic: bool(e.hyperbolic),
    moid_au: num(e.moid_au),
    t_jup: num(e.t_jup),
    epoch_jd: num(e.epoch_jd),
  };
}

function parsePhysical(raw: unknown): SmallBodyPhysical {
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    diameter_km: num(p.diameter_km),
    rotation_h: num(p.rotation_h),
    albedo: num(p.albedo),
    spectral: str(p.spectral),
    H: num(p.H),
    comet_total_mag_M1: num(p.comet_total_mag_M1),
  };
}

function parseObject(raw: unknown): SmallBodyObject | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = str(o.name);
  if (!name) return null; // a nameless body is not renderable
  const kind: SmallBodyKind = o.kind === "comet" ? "comet" : "asteroid";
  return {
    name,
    fullname: str(o.fullname),
    designation: str(o.designation),
    kind,
    class: parseClass(o.class),
    pha: bool(o.pha),
    neo: bool(o.neo),
    interstellar: bool(o.interstellar),
    visited: bool(o.visited),
    mission: str(o.mission),
    elements: parseElements(o.elements),
    physical: parsePhysical(o.physical),
    note: str(o.note),
  };
}

function parseCloseApproach(raw: unknown): CloseApproachData | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const object = str(c.object);
  const date = str(c.date);
  if (!object || !date) return null;
  return {
    object,
    designation: str(c.designation),
    date,
    dist_au: num(c.dist_au),
    dist_ld: num(c.dist_ld),
    v_rel_kms: num(c.v_rel_kms),
    h: num(c.h),
  };
}

/**
 * Defensive parser for public/data/small-bodies/objects.json. Tolerates missing
 * keys, nulls and odd shapes; returns null (→ graceful empty state) when there
 * is nothing usable. NEVER throws.
 */
export function parseSmallBodyCatalog(raw: unknown): SmallBodyCatalog | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const objects = Array.isArray(root.objects)
    ? root.objects.map(parseObject).filter((o): o is SmallBodyObject => o !== null)
    : [];
  if (objects.length === 0) return null;

  const close = Array.isArray(root.close_approaches)
    ? root.close_approaches
        .map(parseCloseApproach)
        .filter((c): c is CloseApproachData => c !== null)
    : [];

  const metaRaw = (root.meta ?? {}) as Record<string, unknown>;
  const countsRaw = (metaRaw.counts ?? {}) as Record<string, unknown>;
  const derived = deriveCounts(objects, close);
  const meta: SmallBodyMeta = {
    title: str(metaRaw.title) ?? "Comets & near-Earth asteroids",
    source: str(metaRaw.source) ?? "NASA/JPL Small-Body Database + CNEOS",
    acknowledgment: str(metaRaw.acknowledgment) ?? SBDB_CNEOS_ACK,
    honesty: str(metaRaw.honesty) ?? SMALL_BODY_HONESTY,
    counts: {
      objects: num(countsRaw.objects) ?? derived.objects,
      comets: num(countsRaw.comets) ?? derived.comets,
      asteroids: num(countsRaw.asteroids) ?? derived.asteroids,
      pha: num(countsRaw.pha) ?? derived.pha,
      visited: num(countsRaw.visited) ?? derived.visited,
      interstellar: num(countsRaw.interstellar) ?? derived.interstellar,
      close_approaches: num(countsRaw.close_approaches) ?? close.length,
    },
  };

  return { meta, objects, close_approaches: close };
}

// ─────────────────────────── Filters + stats ────────────────────────────────

export type FilterId =
  | "all"
  | "comets"
  | "asteroids"
  | "near-earth"
  | "phas"
  | "visited"
  | "interstellar";

export const FILTERS: readonly { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "comets", label: "Comets" },
  { id: "asteroids", label: "Asteroids" },
  { id: "near-earth", label: "Near-Earth" },
  { id: "phas", label: "PHAs" },
  { id: "visited", label: "Visited" },
  { id: "interstellar", label: "Interstellar" },
];

export function matchesFilter(o: SmallBodyObject, filter: FilterId): boolean {
  switch (filter) {
    case "comets":
      return o.kind === "comet";
    case "asteroids":
      return o.kind === "asteroid";
    case "near-earth":
      return o.neo === true;
    case "phas":
      return o.pha === true;
    case "visited":
      return o.visited === true;
    case "interstellar":
      return o.interstellar === true;
    case "all":
    default:
      return true;
  }
}

export function filterObjects(
  objects: SmallBodyObject[],
  filter: FilterId
): SmallBodyObject[] {
  return objects.filter((o) => matchesFilter(o, filter));
}

/** Free-text filter over name, designation, class, mission and note. */
export function searchObjects(
  objects: SmallBodyObject[],
  query: string
): SmallBodyObject[] {
  const q = query.trim().toLowerCase();
  if (!q) return objects;
  return objects.filter((o) => {
    const hay = [
      o.name,
      o.fullname ?? "",
      o.designation ?? "",
      o.class.name ?? "",
      o.class.code ?? "",
      o.mission ?? "",
      o.note ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export interface CatalogStats {
  objects: number;
  comets: number;
  asteroids: number;
  pha: number;
  visited: number;
  interstellar: number;
}

function deriveCounts(
  objects: SmallBodyObject[],
  _close: CloseApproachData[]
): CatalogStats {
  let comets = 0;
  let asteroids = 0;
  let pha = 0;
  let visited = 0;
  let interstellar = 0;
  for (const o of objects) {
    if (o.kind === "comet") comets++;
    else asteroids++;
    if (o.pha) pha++;
    if (o.visited) visited++;
    if (o.interstellar) interstellar++;
  }
  return { objects: objects.length, comets, asteroids, pha, visited, interstellar };
}

export function catalogStats(objects: SmallBodyObject[]): CatalogStats {
  return deriveCounts(objects, []);
}

// ─────────────────────────── Appearance / imagery ───────────────────────────

export type AppearanceKind = "map" | "photo" | "lump";

export interface Appearance {
  kind: AppearanceKind;
  /** texture path, or null for an illustrative lump */
  texture: string | null;
  /** the exact credit/label to render wherever the imagery appears */
  credit: string;
  /** a short badge label for the imagery */
  badge: string;
}

interface TextureInfo {
  kind: "map" | "photo";
  file: string;
  credit: string;
  badge: string;
}

/**
 * The seven bodies with real imagery, keyed by SBDB designation. MAPS are
 * equirectangular mosaics safe to wrap on a (slightly displaced) sphere; PHOTOS
 * are single-view frames shown flat in the detail panel, NEVER on the sphere.
 * 67P is ESA CC BY-SA 3.0 IGO — its exact credit is a hard requirement.
 */
const TEXTURES: Record<string, TextureInfo> = {
  "433": {
    kind: "map",
    file: "eros",
    credit:
      "Real imagery: NASA / JPL / JHUAPL (NEAR Shoemaker), public domain — rendered on a sphere; shape approximated.",
    badge: "real imagery (NASA/USGS, public domain) — shape approximated",
  },
  "4": {
    kind: "map",
    file: "vesta",
    credit:
      "Real imagery: NASA / JPL-Caltech / UCLA / MPS / DLR / IDA (Dawn) / USGS, public domain — rendered on a sphere; shape approximated.",
    badge: "real imagery (NASA/USGS, public domain) — shape approximated",
  },
  "101955": {
    kind: "map",
    file: "bennu",
    credit:
      "Real imagery: NASA / Goddard / University of Arizona (OSIRIS-REx), public domain — rendered on a sphere; shape approximated.",
    badge: "real imagery (NASA/USGS, public domain) — shape approximated",
  },
  "951": {
    kind: "photo",
    file: "gaspra",
    credit: "Real mission photo: NASA / JPL (Galileo, 1991), public domain.",
    badge: "real mission photo (NASA, public domain)",
  },
  "243": {
    kind: "photo",
    file: "ida",
    credit: "Real mission photo: NASA / JPL (Galileo, 1993), public domain.",
    badge: "real mission photo (NASA, public domain)",
  },
  "65803": {
    kind: "photo",
    file: "didymos",
    credit: "Real mission photo: NASA / JHU-APL (DART, 2022), public domain.",
    badge: "real mission photo (NASA, public domain)",
  },
  "67P": {
    kind: "photo",
    file: "churyumov-gerasimenko",
    // HARD REQUIREMENT: exact ESA credit, not public domain.
    credit: `Real mission photo: ${CG_67P_CREDIT}.`,
    badge: `real mission photo — ${CG_67P_CREDIT}`,
  },
};

/** Resolve how an object should appear: map sphere, flat photo, or lump. */
export function appearanceFor(o: SmallBodyObject): Appearance {
  const info = o.designation ? TEXTURES[o.designation] : undefined;
  if (info) {
    return {
      kind: info.kind,
      texture: `/textures/small-bodies/${info.file}.jpg`,
      credit: info.credit,
      badge: info.badge,
    };
  }
  return {
    kind: "lump",
    texture: null,
    credit: ILLUSTRATIVE_APPEARANCE,
    badge: "illustrative — no imagery of this body",
  };
}

/** True when this object's imagery is the ESA CC BY-SA 3.0 IGO 67P photo. */
export function is67P(o: SmallBodyObject): boolean {
  return o.designation === "67P";
}

// ─────────────────────────── Derived classification ─────────────────────────

export interface SmallBodyDerived {
  regime: OrbitRegime | null;
  bound: boolean;
  interstellar: boolean;
  nea: NeaClass | null;
  comet: CometClassification | null;
  /** the PHA-threshold explanation, annotated with this object's MOID */
  moidNote: string;
}

/**
 * Everything the detail HUD needs beyond the measured elements — the COMPUTED
 * classification from lib/small-bodies. Pure; tolerant of the partial elements.
 */
export function smallBodyDerived(o: SmallBodyObject): SmallBodyDerived {
  const el = o.elements;
  return {
    regime: orbitRegime(el.e),
    bound: isBound(el.e),
    interstellar: o.interstellar || isInterstellar(el.e),
    nea: neaClass(el),
    comet: o.kind === "comet" ? cometClass(el) : null,
    moidNote: moidNote(el.moid_au),
  };
}

// ─────────────────────────── Close approaches ───────────────────────────────

/** True when a close approach is Apophis's (highlighted with factual framing). */
export function isApophisApproach(ca: CloseApproachData): boolean {
  return (
    ca.designation === APOPHIS_DESIGNATION ||
    ca.object.toLowerCase().includes("apophis")
  );
}

/** Close approaches for one object (matched by designation or name). */
export function approachesForObject(
  close: CloseApproachData[],
  o: SmallBodyObject
): CloseApproachData[] {
  const desig = o.designation;
  const name = o.name.toLowerCase();
  return close.filter(
    (ca) =>
      (desig !== null && ca.designation === desig) ||
      ca.object.toLowerCase().includes(name)
  );
}

// ─────────────────────────── Display helpers ────────────────────────────────

export function fmtAU(au: number | null | undefined): string {
  if (typeof au !== "number" || !Number.isFinite(au)) return NOT_MEASURED;
  if (Math.abs(au) < 0.01) return `${au.toFixed(5)} AU`;
  if (Math.abs(au) < 1) return `${au.toFixed(4)} AU`;
  if (Math.abs(au) < 100) return `${au.toFixed(3)} AU`;
  return `${au.toFixed(1)} AU`;
}

export function fmtDeg(d: number | null | undefined): string {
  if (typeof d !== "number" || !Number.isFinite(d)) return NOT_MEASURED;
  return `${d.toFixed(2)}°`;
}

export function fmtYears(y: number | null | undefined): string {
  if (typeof y !== "number" || !Number.isFinite(y)) return NOT_MEASURED;
  if (y < 100) return `${y.toFixed(2)} yr`;
  if (y < 10000) return `${Math.round(y).toLocaleString()} yr`;
  return `${(y / 1000).toFixed(1)}k yr`;
}

export function fmtEcc(e: number | null | undefined): string {
  if (typeof e !== "number" || !Number.isFinite(e)) return NOT_MEASURED;
  return e.toFixed(4);
}

/** Diameter in km, adding metres for sub-km bodies. */
export function fmtDiameter(km: number | null | undefined): string {
  if (typeof km !== "number" || !Number.isFinite(km)) return NOT_MEASURED;
  if (km < 1) return `${Math.round(km * 1000)} m (${km.toFixed(3)} km)`;
  return `${km.toFixed(km < 10 ? 2 : 0)} km`;
}

export function fmtRotation(h: number | null | undefined): string {
  if (typeof h !== "number" || !Number.isFinite(h)) return NOT_MEASURED;
  if (h < 1) return `${(h * 60).toFixed(1)} min`;
  if (h < 48) return `${h.toFixed(2)} h`;
  return `${h.toFixed(1)} h (${(h / 24).toFixed(1)} d)`;
}

export function fmtAlbedo(a: number | null | undefined): string {
  if (typeof a !== "number" || !Number.isFinite(a)) return NOT_MEASURED;
  return a.toFixed(3);
}

export function fmtMag(m: number | null | undefined): string {
  if (typeof m !== "number" || !Number.isFinite(m)) return NOT_MEASURED;
  return `${m.toFixed(2)} mag`;
}

export function fmtTisserand(t: number | null | undefined): string {
  if (typeof t !== "number" || !Number.isFinite(t)) return NOT_MEASURED;
  return t.toFixed(3);
}

/** Distance in km from an AU value. */
export function fmtKmFromAU(au: number | null | undefined): string {
  if (typeof au !== "number" || !Number.isFinite(au)) return NOT_MEASURED;
  const km = au * 149_597_870.7;
  if (km < 1_000_000) return `${Math.round(km).toLocaleString()} km`;
  return `${(km / 1_000_000).toFixed(2)} million km`;
}

export function fmtLD(ld: number | null | undefined): string {
  if (typeof ld !== "number" || !Number.isFinite(ld)) return NOT_MEASURED;
  return `${ld.toFixed(ld < 1 ? 3 : 2)} LD`;
}

export function fmtVel(v: number | null | undefined): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return NOT_MEASURED;
  return `${v.toFixed(1)} km/s`;
}

/** A short human class label, e.g. "Apollo · Apollo (Earth-crossing)". */
export function classLabel(o: SmallBodyObject): string {
  return o.class.name ?? o.class.code ?? (o.kind === "comet" ? "Comet" : "Asteroid");
}

// re-export the physics identifiers callers commonly need alongside this config
export type { NeaClass, OrbitRegime, CometClassification };
