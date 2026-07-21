/**
 * Shared UI constants + small pure helpers for the Galaxies & Cosmic Web tab.
 * All honesty copy and verbatim image credits live here so every panel quotes
 * the same strings (contract: docs/GALAXIES_DATA_SOURCES.md and
 * docs/GALAXIES_PHYSICS.md). No em-dashes in any user-facing string.
 *
 * MISSION of this tab: real physics + REAL data. The cosmic-web point cloud is
 * ~18,000 REAL SDSS DR17 galaxy positions (measured RA/Dec/redshift), not a
 * procedural fake. What is COMPUTED is the RA/Dec + redshift to 3D-Mpc mapping,
 * done by lib/galaxies at the adopted H0 = 70. The radial axis is REDSHIFT-SPACE
 * (cz/H0), so clusters stretch radially into real "fingers of God"; the slice is
 * a thin equatorial wedge. Rendered galaxy-disk styling is illustrative/labeled.
 */

import type { GalaxyId } from "@/lib/galaxies";

// ── The four views of the tab ────────────────────────────────────────────────

export type GalaxiesSection =
  | "cosmic-web"
  | "explorer"
  | "scale-ladder"
  | "deep-field";

export const SECTIONS: readonly {
  id: GalaxiesSection;
  label: string;
}[] = [
  { id: "cosmic-web", label: "Cosmic Web" },
  { id: "explorer", label: "Galaxy Explorer" },
  { id: "scale-ladder", label: "Scale Ladder" },
  { id: "deep-field", label: "Deep Field" },
];

// ── Accent (matches the worlds registry gold-white) ──────────────────────────

export const GALAXIES_ACCENT = "#ffd27a";

// ── Cosmic-web data paths ─────────────────────────────────────────────────────

export const COSMIC_WEB_PATH = "/data/galaxies/cosmic-web.json";
export const COSMIC_WEB_META_PATH = "/data/galaxies/cosmic-web.meta.json";

/** Fallback SDSS citation + acknowledgment if the meta file is missing. */
export const SDSS_CITATION =
  "SDSS DR17: Abdurro'uf et al. (2022), ApJS 259, 35. Data via the SDSS SkyServer (skyserver.sdss.org).";
export const SDSS_ACK =
  "Funding for the Sloan Digital Sky Survey has been provided by the Alfred P. Sloan Foundation, the U.S. Department of Energy Office of Science, and the participating institutions.";

// ── Load-bearing honesty labels (quoted verbatim across the panels) ──────────

/** THE lead statement: the cosmic web is real SDSS galaxies, not a fake. */
export const LEAD_HONESTY =
  "The cosmic-web point cloud is 18,000 real galaxies from the Sloan Digital Sky Survey (SDSS DR17), not a procedural fake. Each has a measured right ascension, declination and redshift; plotted in 3D they reproduce the actual filaments, walls and voids of the universe.";

/** The redshift-space / fingers-of-god label. */
export const REDSHIFT_SPACE_LABEL =
  "The radial axis is redshift-space (distance = cz/H0), not a directly measured distance. Peculiar velocities inside clusters stretch them radially into the classic 'fingers of God', a real distortion present in every redshift survey, not a bug.";

/** The wedge / slice geometry label. */
export const WEDGE_LABEL =
  "This is a thin equatorial slice of the sky (declination -2 to +2 degrees, RA 110 to 270 degrees), so it fans out from the observer like a pie slice. The empty regions off the wedge are unsurveyed, not truly empty.";

/** The Hubble-tension label. */
export const HUBBLE_TENSION_LABEL =
  "The depth scale is set by the adopted H0 = 70 km/s/Mpc. H0 is not settled: the early-universe CMB fit (Planck 2018) gives about 67.4, the local distance ladder (SH0ES) gives about 73, and the roughly 5-sigma 'Hubble tension' is unresolved. A different H0 shifts the whole depth scale.";

/** The rendered-disk / colour styling label. */
export const RENDER_LABEL =
  "Point positions are real SDSS measurements. Colour maps to redshift and the point glow is our own stylisation for legibility, not measured brightness.";

/** Galaxy Explorer distance honesty. */
export const LADDER_DISTANCE_LABEL =
  "Extragalactic distances are real but method-dependent (Cepheids, TRGB, eclipsing binaries, surface-brightness fluctuations, redshift) and uncertain at the 5 to 15 percent level. They are best published values, not exact constants.";

// ── Verbatim image credits (CC BY 4.0, from docs/GALAXIES_DATA_SOURCES.md) ────

export interface GalaxyImage {
  src: string;
  width: number;
  height: number;
  /** verbatim required credit line */
  credit: string;
  license: string;
  sourceUrl: string;
  /** honest label of what the image shows */
  label: string;
}

/** The four named galaxies with a real shipped image. */
export const GALAXY_IMAGE: Partial<Record<GalaxyId, GalaxyImage>> = {
  andromeda: {
    src: "/textures/galaxies/andromeda.jpg",
    width: 1024,
    height: 327,
    credit:
      "NASA, ESA, J. Dalcanton (University of Washington, USA), B. F. Williams (University of Washington, USA), L. C. Johnson (University of Washington, USA), the PHAT team, and R. Gendler.",
    license: "CC BY 4.0 (ESA/Hubble)",
    sourceUrl: "https://esahubble.org/images/heic1502a/",
    label: "ESA/Hubble PHAT mosaic of part of the Andromeda disk.",
  },
  whirlpool: {
    src: "/textures/galaxies/whirlpool.jpg",
    width: 1024,
    height: 710,
    credit:
      "NASA, ESA, S. Beckwith (STScI), and The Hubble Heritage Team (STScI/AURA)",
    license: "CC BY 4.0 (ESA/Hubble)",
    sourceUrl: "https://esahubble.org/images/heic0506a/",
    label: "The classic Hubble view of the grand-design spiral and NGC 5195.",
  },
  sombrero: {
    src: "/textures/galaxies/sombrero.jpg",
    width: 1024,
    height: 574,
    credit: "NASA/ESA and The Hubble Heritage Team (STScI/AURA)",
    license: "CC BY 4.0 (ESA/Hubble)",
    sourceUrl: "https://esahubble.org/images/opo0328a/",
    label: "The Hubble Heritage mosaic showing the sharp encircling dust lane.",
  },
  m87: {
    src: "/textures/galaxies/m87-galaxy.jpg",
    width: 1024,
    height: 1014,
    credit:
      "NASA, ESA, and the Hubble Heritage Team (STScI/AURA). Acknowledgment: P. Cote (Herzberg Institute of Astrophysics) and E. Baltz (Stanford University)",
    license: "CC BY 4.0 (ESA/Hubble)",
    sourceUrl: "https://esahubble.org/images/heic0815f/",
    label: "The Virgo-Cluster giant elliptical, host of the EHT-imaged black hole.",
  },
};

/** The JWST first deep field (its own panel). */
export const DEEP_FIELD_IMAGE: GalaxyImage = {
  src: "/textures/galaxies/deep-field.jpg",
  width: 1004,
  height: 1024,
  credit: "NASA, ESA, CSA, and STScI",
  license: "CC BY 4.0 (ESA/Webb)",
  sourceUrl: "https://esawebb.org/images/weic2209a/",
  label:
    "JWST NIRCam view of galaxy cluster SMACS 0723, the first JWST deep field (12 July 2022).",
};

/** Docs base for footer links. */
export const DOCS_BASE = "https://github.com/Hotragn/H.O.T-EARTH/blob/main/docs";

// ── Selector labels for the ten catalog galaxies ─────────────────────────────

export const GALAXY_LABEL: Record<GalaxyId, string> = {
  "milky-way": "Milky Way",
  andromeda: "Andromeda",
  triangulum: "Triangulum",
  lmc: "LMC",
  smc: "SMC",
  m87: "M87",
  sombrero: "Sombrero",
  whirlpool: "Whirlpool",
  "ngc-1300": "NGC 1300",
  "centaurus-a": "Centaurus A",
};

// ── Redshift -> colour (a real gradient by distance) ─────────────────────────

/**
 * Map a redshift z in the catalog range (about 0.005 to 0.15) onto an RGB colour
 * (near = warm gold, far = cool blue), returned as three 0..1 channels for a
 * THREE.BufferAttribute. Correct-by-construction and guarded: a non-finite z
 * falls back to mid grey.
 */
export function redshiftColor(z: number): [number, number, number] {
  if (typeof z !== "number" || !Number.isFinite(z)) return [0.6, 0.6, 0.6];
  const lo = 0.005;
  const hi = 0.15;
  const t = Math.max(0, Math.min(1, (z - lo) / (hi - lo)));
  // near (t=0): warm gold #ffd27a; far (t=1): cool blue #6aa0ff
  const r = 1.0 + t * (0.416 - 1.0);
  const g = 0.823 + t * (0.627 - 0.823);
  const b = 0.478 + t * (1.0 - 0.478);
  return [r, g, b];
}

// ── Formatters (honest units) ─────────────────────────────────────────────────

/** Format a distance in Mpc as a friendly Mly string, or a note for null. */
export function fmtDistanceMly(mly: number | null): string {
  if (typeof mly !== "number" || !Number.isFinite(mly)) return "not applicable";
  if (mly < 1) return `${(mly * 1000).toFixed(0)} thousand ly`;
  return `${mly.toLocaleString(undefined, { maximumFractionDigits: 2 })} Mly`;
}

/** Format a recession velocity in km/s (negative = approaching). */
export function fmtVelocity(v: number | null): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "not applicable";
  const sign = v < 0 ? "approaching " : "receding ";
  return `${sign}${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })} km/s`;
}

/** Format a redshift z, flagging blueshift. */
export function fmtRedshift(z: number | null): string {
  if (typeof z !== "number" || !Number.isFinite(z)) return "not applicable";
  if (z < 0) return `z = ${z.toFixed(6)} (blueshifted)`;
  return `z = ${z.toFixed(6)}`;
}

/** Format the light-travel-time framing of a distance in Mly. */
export function fmtLookback(mly: number | null): string {
  if (typeof mly !== "number" || !Number.isFinite(mly) || mly <= 0) {
    return "we are inside it, so there is no light-travel distance";
  }
  return `the light we see left it about ${mly.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })} million years ago`;
}

/** Format a large size in metres onto a readable astronomical unit. */
export function fmtSizeM(sizeM: number): string {
  if (!Number.isFinite(sizeM) || sizeM <= 0) return "unknown";
  const LY_M = 9.4607304725808e15;
  const AU_M = 1.495978707e11;
  const KM = 1000;
  if (sizeM >= 1e9 * LY_M) return `${(sizeM / (1e9 * LY_M)).toFixed(0)} billion ly`;
  if (sizeM >= 1e6 * LY_M) return `${(sizeM / (1e6 * LY_M)).toFixed(0)} million ly`;
  if (sizeM >= 1e3 * LY_M) return `${(sizeM / (1e3 * LY_M)).toFixed(0)},000 ly`;
  if (sizeM >= LY_M) return `${(sizeM / LY_M).toFixed(2)} ly`;
  if (sizeM >= AU_M) return `${(sizeM / AU_M).toExponential(2)} AU`;
  return `${(sizeM / KM).toLocaleString(undefined, { maximumFractionDigits: 0 })} km`;
}
