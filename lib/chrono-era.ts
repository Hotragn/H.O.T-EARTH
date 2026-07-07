/**
 * Procedural "Era Scene" generator — the clearly-labeled ARTISTIC layer of the
 * Virtual Earth tab. Given a simulated year (and optionally a focused region),
 * it produces a stylized, deterministic palette + abstract silhouette
 * descriptor that a canvas overlay renders: an era-appropriate sky, and
 * skyline structures that grow from huts → temples → industrial → modern
 * towers as the year advances, plus abstract figure silhouettes.
 *
 * NOT DATA. This is procedural art parameterized only by the year and a region
 * seed. No external API, no photorealism, no historical claim about a specific
 * place. The UI labels it "Artistic interpretation — procedurally generated,
 * not data." Kept here (pure, deterministic) so it's testable and the renderer
 * stays a thin drawing layer.
 */

/** Broad era bands used to pick palette + architecture vocabulary. */
export type EraBand =
  | "prehistoric"
  | "ancient"
  | "classical"
  | "medieval"
  | "industrial"
  | "modern";

export function eraBand(year: number): EraBand {
  if (year < -3000) return "prehistoric";
  if (year < -500) return "ancient";
  if (year < 500) return "classical";
  if (year < 1750) return "medieval";
  if (year < 1950) return "industrial";
  return "modern";
}

/** A short, honest era caption for the vignette header. */
export function eraLabel(year: number): string {
  switch (eraBand(year)) {
    case "prehistoric":
      return "Prehistoric";
    case "ancient":
      return "Ancient";
    case "classical":
      return "Classical antiquity";
    case "medieval":
      return "Medieval";
    case "industrial":
      return "Industrial age";
    case "modern":
      return "Modern era";
  }
}

export interface EraPalette {
  /** sky gradient top → bottom (CSS color strings) */
  skyTop: string;
  skyBottom: string;
  /** silhouette / structure fill */
  structure: string;
  /** accent (windows, fires, glow) */
  accent: string;
  /** ground band */
  ground: string;
}

/**
 * Deterministic palette per era. Dark, restrained, on-brand (abyss-adjacent
 * with a temporal violet/teal accent family). Warmer, dimmer skies deep in the
 * past; cooler, brighter, more saturated toward the modern city night.
 */
export function eraPalette(year: number): EraPalette {
  switch (eraBand(year)) {
    case "prehistoric":
      return { skyTop: "#1a1410", skyBottom: "#3a2a1c", structure: "#0b0806", accent: "#e07b3a", ground: "#120d09" };
    case "ancient":
      return { skyTop: "#161426", skyBottom: "#3a2c3a", structure: "#0a0910", accent: "#e0a24a", ground: "#100d16" };
    case "classical":
      return { skyTop: "#141826", skyBottom: "#2c3550", structure: "#0a0c14", accent: "#d8c17a", ground: "#0d1018" };
    case "medieval":
      return { skyTop: "#0f1420", skyBottom: "#26314a", structure: "#080b12", accent: "#c98a3a", ground: "#0b0f18" };
    case "industrial":
      return { skyTop: "#12131c", skyBottom: "#3a2f36", structure: "#070810", accent: "#d97a5a", ground: "#0a0b12" };
    case "modern":
      return { skyTop: "#080a16", skyBottom: "#141d3a", structure: "#05070f", accent: "#5ad0c0", ground: "#070912" };
  }
}

export interface EraStructure {
  /** 0..1 horizontal position across the skyline band */
  x: number;
  /** 0..1 relative height */
  height: number;
  /** 0..1 relative width */
  width: number;
  /** shape family for the renderer to draw */
  kind: "hut" | "temple" | "tower" | "factory" | "skyscraper";
  /** 0..1 chance/strength of a lit accent (windows, fire) */
  lit: number;
}

export interface EraScene {
  year: number;
  band: EraBand;
  label: string;
  palette: EraPalette;
  /** left→right skyline silhouettes */
  structures: EraStructure[];
  /** abstract standing figures, 0..1 x positions with 0..1 scale */
  figures: Array<{ x: number; scale: number }>;
  /** 0..1 overall "development" — grows with the era, drives density/height */
  development: number;
}

/**
 * Cheap deterministic hash → [0,1). Seeded by an integer so a given (region,
 * year, index) always yields the same skyline (no per-frame churn / flicker).
 */
function hash01(seed: number): number {
  let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  x = x - Math.floor(x);
  return x;
}

/**
 * 0..1 development level for a year: near 0 in prehistory, rising through the
 * eras, near 1 in the modern present. Smooth so the skyline "grows" as the
 * clock plays rather than snapping between bands.
 */
export function developmentLevel(year: number): number {
  // anchor points (year, level) then linear interpolate
  const anchors: Array<[number, number]> = [
    [-10000, 0.02],
    [-3000, 0.12],
    [-500, 0.28],
    [500, 0.4],
    [1500, 0.52],
    [1800, 0.66],
    [1900, 0.78],
    [1970, 0.9],
    [2026, 1.0],
  ];
  if (year <= anchors[0][0]) return anchors[0][1];
  if (year >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];
  for (let i = 1; i < anchors.length; i++) {
    if (year <= anchors[i][0]) {
      const [y0, l0] = anchors[i - 1];
      const [y1, l1] = anchors[i];
      const t = (year - y0) / (y1 - y0);
      return l0 + t * (l1 - l0);
    }
  }
  return 1;
}

function structureKind(band: EraBand): EraStructure["kind"] {
  switch (band) {
    case "prehistoric":
    case "ancient":
      return "hut";
    case "classical":
      return "temple";
    case "medieval":
      return "tower";
    case "industrial":
      return "factory";
    case "modern":
      return "skyscraper";
  }
}

/**
 * Build a full era scene descriptor. Deterministic in (year, regionSeed): the
 * same inputs always produce the same skyline, so the vignette is stable while
 * the clock ticks and only re-forms as the year meaningfully advances.
 *
 * `regionSeed` is any stable integer for the focused region (e.g. rounded
 * lat*1000+lon) — it just decorrelates skylines between regions.
 */
export function buildEraScene(year: number, regionSeed = 0): EraScene {
  const band = eraBand(year);
  const dev = developmentLevel(year);
  const kind = structureKind(band);

  // more, taller structures as development rises (3 huts → dense skyline)
  const count = Math.max(3, Math.round(3 + dev * 14));
  const structures: EraStructure[] = [];
  const seedBase = Math.floor(regionSeed) * 1000 + Math.floor(band.length) * 7;
  for (let i = 0; i < count; i++) {
    const s = seedBase + i * 13;
    const x = (i + 0.5) / count + (hash01(s) - 0.5) * (0.7 / count);
    const baseH = 0.18 + dev * 0.6;
    const height = Math.min(0.98, baseH * (0.45 + hash01(s + 1) * 0.9));
    const width = (0.4 + hash01(s + 2) * 0.6) * (0.9 - dev * 0.35) * 0.9;
    // one or two landmark structures per scene get extra height
    const landmark = hash01(s + 3) > 0.86 ? 1.35 : 1;
    structures.push({
      x: Math.min(0.98, Math.max(0.02, x)),
      height: Math.min(0.99, height * landmark),
      width: Math.max(0.03, width / count),
      kind,
      lit: band === "modern" ? 0.85 : band === "industrial" ? 0.5 : 0.25,
    });
  }

  // a few abstract figures in the foreground, more in busier eras
  const figCount = Math.max(2, Math.round(2 + dev * 5));
  const figures: Array<{ x: number; scale: number }> = [];
  for (let i = 0; i < figCount; i++) {
    const s = seedBase + 500 + i * 17;
    figures.push({
      x: (i + 0.5) / figCount + (hash01(s) - 0.5) * 0.15,
      scale: 0.7 + hash01(s + 1) * 0.6,
    });
  }

  return { year, band, label: eraLabel(year), palette: eraPalette(year), structures, figures, development: dev };
}

/** A stable integer region seed from a lat/lon (decorrelates skylines). */
export function regionSeedFromLatLon(lat: number, lon: number): number {
  return Math.round(lat * 100) * 100000 + Math.round(lon * 100);
}
