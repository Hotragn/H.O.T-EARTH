/**
 * Honest presentation + defensive data layer for the NIGHT SKY phase (the second
 * "Beyond" world, beside Exoplanets). This is the star-map analogue of
 * lib/exo-facts.ts: a thin PRESENTATION layer over the pure physics in
 * lib/celestial.ts and the three shipped catalogues under
 * public/data/night-sky/.
 *
 * Division of responsibility (so every printed pixel is traceable):
 *   • MEASURED catalogue values — star position (RA/Dec, J2000), apparent
 *     magnitude, B-V colour index, parallax distance, spectral type, IAU proper
 *     name (stars.json = HYG v4.4); deep-sky position/magnitude/type
 *     (messier.json = OpenNGC). Read verbatim; `null` renders as "not measured",
 *     never a guess.
 *   • COMPUTED derivations — 3D direction on the celestial sphere, physical
 *     colour + temperature from B-V, render size from magnitude, local
 *     sidereal time and alt/az for the "sky from your location" mode. All
 *     lib/celestial.ts pure functions. Every one is labelled as computed.
 *   • CULTURAL overlay — the constellation stick figures (constellations.json).
 *     The stars are real; the lines joining them are a human convention (modern
 *     IAU/Western set). Labelled as such everywhere it shows.
 *
 * HONESTY BAR (phase): positions/brightnesses/colours/distances are real
 * measured data. Proper motion + precession are ignored for present-day display
 * (sub-arcminute over decades — see the catalogue's own `meta.honesty`). Invent
 * nothing. Five CC-BY / CC-BY-SA attributions are HARD REQUIREMENTS and live as
 * constants below (footer + About panel render them verbatim).
 */

import {
  bvToColor,
  bvToTemperatureK,
  equatorialToHorizontal,
  localSiderealTimeDeg,
  magnitudeToOpacity,
  magnitudeToSize,
  pcToLightYears,
  raDecToVector3,
  raDegToHours,
  CONSTELLATION_SPHERE_RADIUS,
} from "./celestial";

// ─────────────────────────────── Paths + accent ─────────────────────────────

export const STARS_PATH = "/data/night-sky/stars.json";
export const CONSTELLATIONS_PATH = "/data/night-sky/constellations.json";
export const MESSIER_PATH = "/data/night-sky/messier.json";
export const MILKY_WAY_TEXTURE_PATH = "/textures/night-sky/milkyway.jpg";

/** "Beyond" starlight-indigo accent — matches the worlds registry. */
export const NIGHT_SKY_ACCENT = "#8aa0ff";

/** Shown instead of any missing measured value. Never invent. */
export const NOT_MEASURED = "not measured";

// ──────────────────── Attribution (HARD REQUIREMENTS, verbatim) ──────────────
// Displayed in the NightSkyAttributionFooter and the AboutModal "Night Sky"
// section. Do not reword — these are the exact credits the licenses require.

export const STAR_DATA_ATTRIBUTION =
  "Star data: HYG database v4.4, astronexus / David Nash, CC BY-SA 4.0 " +
  "(Hipparcos / Yale BSC / Gliese). This subset shared under CC BY-SA 4.0.";

export const CONSTELLATION_LINES_ATTRIBUTION =
  "Constellation lines: Marc van der Sluys, 'ConstellationLines', CC BY 4.0 " +
  "(DOI 10.5281/zenodo.10397192).";

export const DEEP_SKY_ATTRIBUTION =
  "Deep-sky objects: OpenNGC, Mattia Verga, CC BY-SA 4.0.";

export const STAR_NAMES_ATTRIBUTION = "Star names: IAU WGSN (IAU-CSN).";

export const MILKY_WAY_ATTRIBUTION = "Milky Way: ESO/S. Brunier, CC BY 4.0.";

/** The five credits in display order, with source links for the About panel. */
export const NIGHT_SKY_ATTRIBUTIONS: readonly {
  text: string;
  href: string;
}[] = [
  { text: STAR_DATA_ATTRIBUTION, href: "https://codeberg.org/astronexus/hyg" },
  {
    text: CONSTELLATION_LINES_ATTRIBUTION,
    href: "https://doi.org/10.5281/zenodo.10397192",
  },
  { text: DEEP_SKY_ATTRIBUTION, href: "https://github.com/mattiaverga/OpenNGC" },
  {
    text: STAR_NAMES_ATTRIBUTION,
    href: "https://www.iau.org/public/themes/naming_stars/",
  },
  {
    text: MILKY_WAY_ATTRIBUTION,
    href: "https://www.eso.org/public/images/eso0932a/",
  },
];

/** The honest one-liner for the constellation overlay, used wherever it toggles. */
export const CONSTELLATION_CULTURAL_NOTE =
  "Constellation figures — modern IAU, a cultural overlay. The stars are real; " +
  "the lines are a human construct.";

// ─────────────────────────────── Catalogue types ────────────────────────────

/** One measured catalogue star. RA/Dec in DEGREES, J2000. */
export interface Star {
  /** positive = Hipparcos (HIP) number; negative = -(HYG database id) */
  id: number;
  /** right ascension, degrees J2000 [0,360) */
  ra: number;
  /** declination, degrees J2000 [-90,90] */
  dec: number;
  /** apparent visual magnitude (smaller = brighter) */
  mag: number;
  /** colour index B-V, or null if the catalogue has none */
  ci: number | null;
  /** distance in light-years, or null if there is no reliable parallax */
  distLy: number | null;
  /** short spectral type (e.g. "A0"), or null */
  spect: string | null;
  /** IAU/WGSN proper name, or null if unnamed */
  name: string | null;
  /** Bayer designation abbrev (e.g. "Alp", "Alp-1"), or null */
  bayer: string | null;
  /** constellation abbreviation (e.g. "CMa"), or null */
  con: string | null;
}

export interface StarMeta {
  title: string;
  attribution: string;
  license: string;
  epoch: string;
  counts: { stars: number; named: number };
}

export interface StarCatalog {
  meta: StarMeta;
  stars: Star[];
  /** id → Star, for constellation-line lookup. */
  byId: Map<number, Star>;
}

export interface Constellation {
  abbr: string;
  name: string;
  /** star-id pairs to join; ids match stars.json `id` */
  lines: [number, number][];
}

export interface ConstellationCatalog {
  meta: { attribution: string; culturalNote: string };
  constellations: Constellation[];
}

export interface MessierObject {
  m: number;
  ngc: number | null;
  name: string | null;
  ra: number;
  dec: number;
  mag: number | null;
  type: string;
  con: string | null;
  note?: string | null;
}

export interface MessierCatalog {
  meta: { attribution: string };
  objects: MessierObject[];
}

// ─────────────────────────────── null guards ────────────────────────────────

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

// ───────────────────────── Defensive catalogue parsers ──────────────────────
// Each tolerates missing keys, nulls and odd shapes and returns null (→ a
// graceful empty state) when there is nothing usable. NEVER throws.

/**
 * Parse the COLUMNAR stars.json. Rows are arrays ordered by `meta.columns`; we
 * read the canonical order (id, ra, dec, mag, ci, dist_ly, spect, name, bayer,
 * con) but map through the file's `columns` when present so a reordering upstream
 * cannot silently corrupt the data.
 */
export function parseStarCatalog(raw: unknown): StarCatalog | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const rows = root.stars;
  if (!Array.isArray(rows)) return null;

  const metaRaw = (root.meta ?? {}) as Record<string, unknown>;
  const columns: string[] = Array.isArray(metaRaw.columns)
    ? (metaRaw.columns as unknown[]).map((c) => String(c))
    : ["id", "ra", "dec", "mag", "ci", "dist_ly", "spect", "name", "bayer", "con"];
  const col = (name: string) => columns.indexOf(name);
  const iId = col("id");
  const iRa = col("ra");
  const iDec = col("dec");
  const iMag = col("mag");
  const iCi = col("ci");
  const iDist = col("dist_ly");
  const iSpect = col("spect");
  const iName = col("name");
  const iBayer = col("bayer");
  const iCon = col("con");

  const stars: Star[] = [];
  const byId = new Map<number, Star>();
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const id = num(row[iId]);
    const ra = num(row[iRa]);
    const dec = num(row[iDec]);
    const mag = num(row[iMag]);
    // a star with no direction or brightness cannot be rendered
    if (id === null || ra === null || dec === null || mag === null) continue;
    const star: Star = {
      id,
      ra,
      dec,
      mag,
      ci: iCi >= 0 ? num(row[iCi]) : null,
      distLy: iDist >= 0 ? num(row[iDist]) : null,
      spect: iSpect >= 0 ? str(row[iSpect]) : null,
      name: iName >= 0 ? str(row[iName]) : null,
      bayer: iBayer >= 0 ? str(row[iBayer]) : null,
      con: iCon >= 0 ? str(row[iCon]) : null,
    };
    stars.push(star);
    byId.set(id, star);
  }
  if (stars.length === 0) return null;

  const countsRaw = (metaRaw.counts ?? {}) as Record<string, unknown>;
  return {
    meta: {
      title: str(metaRaw.title) ?? "Star catalogue (HYG)",
      attribution: str(metaRaw.attribution) ?? STAR_DATA_ATTRIBUTION,
      license: str(metaRaw.license) ?? "CC BY-SA 4.0",
      epoch: str(metaRaw.epoch) ?? "J2000.0",
      counts: {
        stars: num(countsRaw.stars) ?? stars.length,
        named: num(countsRaw.named) ?? stars.filter((s) => s.name).length,
      },
    },
    stars,
    byId,
  };
}

/** Parse constellations.json (stick figures). Drops malformed line segments. */
export function parseConstellationCatalog(
  raw: unknown
): ConstellationCatalog | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const list = root.constellations;
  if (!Array.isArray(list)) return null;

  const constellations: Constellation[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const abbr = str(c.abbr);
    if (!abbr) continue;
    const linesRaw = Array.isArray(c.lines) ? c.lines : [];
    const lines: [number, number][] = [];
    for (const seg of linesRaw) {
      if (!Array.isArray(seg) || seg.length < 2) continue;
      const a = num(seg[0]);
      const b = num(seg[1]);
      if (a === null || b === null) continue;
      lines.push([a, b]);
    }
    constellations.push({
      abbr,
      name: str(c.name) ?? abbr,
      lines,
    });
  }
  if (constellations.length === 0) return null;

  const metaRaw = (root.meta ?? {}) as Record<string, unknown>;
  return {
    meta: {
      attribution: str(metaRaw.attribution) ?? CONSTELLATION_LINES_ATTRIBUTION,
      culturalNote: str(metaRaw.cultural_note) ?? CONSTELLATION_CULTURAL_NOTE,
    },
    constellations,
  };
}

/** Parse messier.json (deep-sky objects). */
export function parseMessierCatalog(raw: unknown): MessierCatalog | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const list = root.objects;
  if (!Array.isArray(list)) return null;

  const objects: MessierObject[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const m = num(o.m);
    const ra = num(o.ra);
    const dec = num(o.dec);
    if (m === null || ra === null || dec === null) continue;
    objects.push({
      m,
      ngc: num(o.ngc),
      name: str(o.name),
      ra,
      dec,
      mag: num(o.mag),
      type: str(o.type) ?? "Deep-sky object",
      con: str(o.con),
      note: str(o.note),
    });
  }
  if (objects.length === 0) return null;

  const metaRaw = (root.meta ?? {}) as Record<string, unknown>;
  return {
    meta: { attribution: str(metaRaw.attribution) ?? DEEP_SKY_ATTRIBUTION },
    objects,
  };
}

// ──────────────────── Star display: names, designations ─────────────────────

const GREEK: Record<string, string> = {
  Alp: "α", Bet: "β", Gam: "γ", Del: "δ", Eps: "ε", Zet: "ζ", Eta: "η",
  The: "θ", Iot: "ι", Kap: "κ", Lam: "λ", Mu: "μ", Nu: "ν", Xi: "ξ",
  Omi: "ο", Pi: "π", Rho: "ρ", Sig: "σ", Tau: "τ", Ups: "υ", Phi: "φ",
  Chi: "χ", Psi: "ψ", Ome: "ω",
};

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};

/**
 * A Bayer designation like "Alp" → "α", "Alp-1" → "α¹". Returns null when there
 * is no Bayer letter. The constellation abbreviation is appended by
 * {@link starDesignation}.
 */
export function bayerGlyph(bayer: string | null | undefined): string | null {
  if (!bayer) return null;
  const [letter, suffix] = bayer.split("-");
  const glyph = GREEK[letter] ?? letter;
  if (!suffix) return glyph;
  const sup = suffix
    .split("")
    .map((d) => SUPERSCRIPT[d] ?? d)
    .join("");
  return `${glyph}${sup}`;
}

/** "α CMa" style Bayer designation (glyph + constellation abbr), or null. */
export function starDesignation(star: Star): string | null {
  const glyph = bayerGlyph(star.bayer);
  if (!glyph) return null;
  return star.con ? `${glyph} ${star.con}` : glyph;
}

/**
 * Best short label for a star: proper name if it has one, else its Bayer
 * designation, else a catalogue id ("HIP 32349" / "HYG 118485"). Never empty.
 */
export function starLabel(star: Star): string {
  if (star.name) return star.name;
  const desig = starDesignation(star);
  if (desig) return desig;
  return star.id >= 0 ? `HIP ${star.id}` : `HYG ${-star.id}`;
}

// ──────────────────── Constellation names (with Serpens split) ───────────────
// Star `con` abbrevs are the standard IAU 3-letter codes and are all present in
// constellations.json; a handful of Messier `con` codes (Se1/Se2 for the two
// halves of Serpens) are not, so we override those. Everything else falls back
// to the abbreviation itself.

const CON_NAME_OVERRIDES: Record<string, string> = {
  Se1: "Serpens Caput",
  Se2: "Serpens Cauda",
  Ser: "Serpens",
};

/** Build abbr → full-name lookup from the constellation catalogue (+ overrides). */
export function constellationNameMap(
  cat: ConstellationCatalog | null
): Map<string, string> {
  const map = new Map<string, string>();
  for (const [abbr, name] of Object.entries(CON_NAME_OVERRIDES)) {
    map.set(abbr, name);
  }
  if (cat) {
    for (const c of cat.constellations) map.set(c.abbr, c.name);
  }
  return map;
}

// ──────────────────── Deep-sky (Messier) type categorisation ─────────────────

export type MessierCategory = "galaxy" | "nebula" | "cluster" | "other";

export interface MessierStyle {
  category: MessierCategory;
  label: string;
  color: string;
}

const MESSIER_STYLES: Record<MessierCategory, { label: string; color: string }> = {
  galaxy: { label: "Galaxy", color: "#f0a878" },
  nebula: { label: "Nebula", color: "#6fd6c9" },
  cluster: { label: "Star cluster", color: "#ffd479" },
  other: { label: "Deep-sky object", color: "#b9c0cf" },
};

/** Bucket an OpenNGC object type string into a glyph category + colour. */
export function messierCategory(type: string): MessierCategory {
  const t = type.toLowerCase();
  if (t.includes("galaxy")) return "galaxy";
  if (t.includes("cluster") || t.includes("association") || t.includes("star cloud"))
    return "cluster";
  if (
    t.includes("nebula") ||
    t.includes("hii") ||
    t.includes("remnant") ||
    t.includes("reflection")
  )
    return "nebula";
  return "other";
}

export function messierStyle(obj: MessierObject): MessierStyle {
  const category = messierCategory(obj.type);
  const s = MESSIER_STYLES[category];
  return { category, label: s.label, color: s.color };
}

/** "M31 · Andromeda Galaxy" style label. Common name appended when present. */
export function messierLabel(obj: MessierObject): string {
  const base = `M${obj.m}`;
  const common = obj.name ? obj.name.split(",")[0] : null;
  return common ? `${base} · ${common}` : base;
}

// ─────────────────────────── Local-sky geometry ─────────────────────────────

const DEG2RAD = Math.PI / 180;

/**
 * A horizontal (alt/az) direction → a 3D point in the LOCAL sky frame used by
 * the "sky from your location" mode. Y is up (zenith), and the horizon is the
 * XZ plane. Azimuth is measured from due North, clockwise (Meeus/celestial.ts
 * convention): N=0, E=90, S=180, W=270. Cardinal mapping:
 *
 *   North → −Z,  East → +X,  South → +Z,  West → −X,  Zenith → +Y
 *
 * so the default camera (looking toward −Z) faces due North. Pure + allocation
 * -free-friendly (returns a fresh tuple only when asked).
 */
export function horizontalToVector3(
  altitudeDeg: number,
  azimuthDeg: number,
  radius = CONSTELLATION_SPHERE_RADIUS
): [number, number, number] {
  const alt = altitudeDeg * DEG2RAD;
  const az = azimuthDeg * DEG2RAD;
  const cosAlt = Math.cos(alt);
  const east = cosAlt * Math.sin(az);
  const north = cosAlt * Math.cos(az);
  const up = Math.sin(alt);
  return [radius * east, radius * up, -radius * north];
}

/** Cardinal-direction markers on the local horizon (unit vectors, Y-up). */
export const CARDINALS: readonly { label: string; vec: [number, number, number] }[] =
  [
    { label: "N", vec: [0, 0, -1] },
    { label: "E", vec: [1, 0, 0] },
    { label: "S", vec: [0, 0, 1] },
    { label: "W", vec: [-1, 0, 0] },
  ];

/**
 * Local sidereal time as a formatted "HHh MMm" string for the observer HUD, from
 * the real GMST + longitude computation in lib/celestial.ts. Returns null on bad
 * input so the caller can hide the readout.
 */
export function formatLST(date: Date, lonDeg: number): string | null {
  const lstDeg = localSiderealTimeDeg(date, lonDeg);
  if (lstDeg === null) return null;
  const hours = raDegToHours(lstDeg); // [0,24)
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

// ─────────────── Galactic → equatorial rotation (Milky Way alignment) ─────────
// The shipped Milky Way panorama (ESO/S. Brunier) is an equirectangular image in
// GALACTIC coordinates. To register its band to the real (equatorial J2000) star
// field we rotate the backdrop sphere by the standard IAU galactic frame:
//   galactic north pole  → RA 192.859°, Dec +27.128°
//   galactic centre l=0  → RA 266.405°, Dec −28.936°
// We build an orthonormal galactic basis in the scene's equatorial frame and
// express it as the three columns of the rotation that carries the Milky Way
// sphere's LOCAL axes (built with the same lon=l / lat=b mapping the stars use)
// into equatorial directions. See docs and lib/celestial.ts for the frame.

export const GALACTIC_NORTH_POLE_RA = 192.859;
export const GALACTIC_NORTH_POLE_DEC = 27.128;
export const GALACTIC_CENTER_RA = 266.405;
export const GALACTIC_CENTER_DEC = -28.936;
export const GALACTIC_ASCENDING_NODE_L = 33.0;

type Vec3 = [number, number, number];

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * The three column vectors (in the scene's equatorial frame) of the rotation
 * that aligns the galactic-coordinate Milky Way sphere with the stars. Feed them
 * to THREE.Matrix4.makeBasis(c1, c2, c3) and set the backdrop's quaternion from
 * it. Derivation:
 *   Ẑ_gal = dir(NGP),  X̂_gal = dir(GC) orthonormalised against Ẑ_gal,
 *   Ŷ_gal = Ẑ_gal × X̂_gal   (right-handed; +l runs GC→l=90)
 * The Milky Way sphere's LOCAL axes map as +X↔GC(l=0,b=0), +Y↔pole(b=+90),
 * +Z↔l=270(b=0) = −Ŷ_gal, hence the columns [X̂_gal, Ẑ_gal, −Ŷ_gal].
 */
export function galacticToEquatorialColumns(): { c1: Vec3; c2: Vec3; c3: Vec3 } {
  const zGal = normalize(
    raDecToVector3(GALACTIC_NORTH_POLE_RA, GALACTIC_NORTH_POLE_DEC, 1) as Vec3
  );
  let xGal = raDecToVector3(GALACTIC_CENTER_RA, GALACTIC_CENTER_DEC, 1) as Vec3;
  // Gram–Schmidt: force GC exactly perpendicular to the pole, then normalise.
  const proj = dot(xGal, zGal);
  xGal = normalize([
    xGal[0] - proj * zGal[0],
    xGal[1] - proj * zGal[1],
    xGal[2] - proj * zGal[2],
  ]);
  const yGal = normalize(cross(zGal, xGal));
  return {
    c1: xGal, // local +X (galactic centre)
    c2: zGal, // local +Y (galactic pole)
    c3: [-yGal[0], -yGal[1], -yGal[2]], // local +Z (l=270)
  };
}

// ───────────────────────────── Display formatters ───────────────────────────

export function fmtMag(mag: number | null | undefined): string {
  if (typeof mag !== "number" || !Number.isFinite(mag)) return NOT_MEASURED;
  return mag.toFixed(2);
}

/** Distance label, or the honest "distance not measured" when parallax is null. */
export function fmtDistanceLy(ly: number | null | undefined): string {
  if (typeof ly !== "number" || !Number.isFinite(ly)) return "distance not measured";
  if (ly < 100) return `${ly.toFixed(1)} light-years`;
  if (ly < 10_000) return `${Math.round(ly).toLocaleString()} light-years`;
  return `${Math.round(ly).toLocaleString()} light-years`;
}

export function fmtTempK(k: number | null | undefined): string {
  if (typeof k !== "number" || !Number.isFinite(k)) return NOT_MEASURED;
  return `${Math.round(k).toLocaleString()} K`;
}

export function fmtSpectralType(spect: string | null | undefined): string {
  return spect && spect.length > 0 ? spect : NOT_MEASURED;
}

// re-export the physics identifiers the night-sky components consume alongside
// this config, so a component imports from one place.
export {
  bvToColor,
  bvToTemperatureK,
  equatorialToHorizontal,
  localSiderealTimeDeg,
  magnitudeToOpacity,
  magnitudeToSize,
  pcToLightYears,
  raDecToVector3,
  CONSTELLATION_SPHERE_RADIUS,
};
