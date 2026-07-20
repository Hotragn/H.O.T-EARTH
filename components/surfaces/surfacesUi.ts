import { marsSunPosition, type SurfaceSite, type SurfaceWorld } from "@/lib/surfaces";

/**
 * Shared UI constants + small pure helpers for the Surfaces tab. All honesty
 * copy lives here so every panel quotes the same labels (contract:
 * docs/SURFACES_DATA_SOURCES.md). No em-dashes in any user-facing string.
 */

/** World selector order + labels (Mars leads: it is the real tier). */
export const SURFACE_WORLD_ORDER: readonly SurfaceWorld[] = ["mars", "titan"];

export const WORLD_LABEL: Record<SurfaceWorld, string> = {
  mars: "Mars",
  titan: "Titan",
};

/** Per-world accent for selector dots (Mars warm dusk, Titan hazy orange). */
export const WORLD_ACCENT: Record<SurfaceWorld, string> = {
  mars: "#e8a87c",
  titan: "#d98e3a",
};

/** Honesty tier, shown beside the world selector, never blurred. */
export const WORLD_TIER: Record<SurfaceWorld, string> = {
  mars: "real tier: real NASA terrain, real photos, live computed sun",
  titan: "honest-cinematic tier: real facts and one real photo, illustrative terrain",
};

/** THE top honesty label: live means live simulation, not a camera. */
export const LIVE_SIMULATION_LABEL =
  "LIVE means live simulation (real computed sun and clock), not a camera. No streaming camera exists on any planetary surface.";

/** Mars DEM honesty: real regional topography, sub-grid detail is a choice. */
export const DEM_RESOLUTION_LABEL =
  "Real MOLA regional topography at 463 m per pixel; fine close-up detail is illustrative (below the measured grid).";

/** Shown when Jezero is selected: the committed DEM covers Gale only. */
export const JEZERO_TERRAIN_LABEL =
  "Sky, sun and clock are computed for Jezero Crater (Perseverance site); the terrain shown remains the real Gale Crater DEM (the only elevation tile shipped).";

/** Mars panorama labels (PIA25407 contract). */
export const PANORAMA_CREDIT = "NASA/JPL-Caltech/MSSS, PIA25407, sol 3509";
export const PANORAMA_LABEL =
  "Real photograph: Curiosity Mastcam 360 degree panorama, sol 3509 (Avanavero drill site, Mount Sharp). Colors are white-balanced by NASA to Earth-like lighting.";

/** Mars sky palette honesty (regimes are cited; the ramp is artistic). */
export const SKY_PALETTE_LABEL =
  "Sky colors are an artistic rendering of a real, cited phenomenon (butterscotch day, blue sunset), not a measured spectrum.";

/** Titan terrain honesty. */
export const TITAN_TERRAIN_LABEL =
  "Illustrative terrain; no human-scale Titan surface imagery exists. Facts and geometry shown are real (Cassini-Huygens).";

/** Saturn-from-Titan rendering caveat. */
export const SATURN_HAZE_LABEL =
  "Saturn drawn at its real fixed position and real apparent size; in reality Titan's haze would blur it to a diffuse glow.";

/** Rings-from-Titan note: Titan orbits in Saturn's ring plane. */
export const SATURN_RINGS_EDGE_LABEL =
  "Rings drawn nearly edge-on: Titan orbits in Saturn's equatorial (ring) plane, so from Titan the rings are seen as a thin line.";

/** Mandatory verbatim Huygens photo credit (NASA Photojournal source page). */
export const HUYGENS_CREDIT = "NASA/JPL/ESA/University of Arizona";

/** Mars sunset reference photo credit (PIA19400). */
export const SUNSET_PHOTO_CREDIT = "NASA/JPL-Caltech/MSSS/Texas A&M Univ.";

/** DEM asset paths (committed, verified in docs/SURFACES_DATA_SOURCES.md). */
export const DEM_PNG_PATH = "/data/surfaces/mars-gale-heightmap.png";
export const DEM_META_PATH = "/data/surfaces/mars-gale-heightmap.json";
export const PANORAMA_TEXTURE = "/textures/surfaces/mars-panorama.jpg";
export const SATURN_TEXTURE = "/textures/planets/saturn.jpg";
export const SATURN_RINGS_TEXTURE = "/textures/planets/saturn-rings.png";
export const HUYGENS_PHOTO = "/textures/surfaces/titan-huygens-surface.jpg";
export const MARS_SUNSET_PHOTO = "/textures/surfaces/mars-sunset.jpg";

/** Cylindrical panorama geometry: 360 deg by ~98.8 deg vertical (PIA25407). */
export const PANORAMA_VERTICAL_FOV_DEG = 98.8;

/**
 * Sky-direction unit vector from altitude/azimuth (azimuth from North,
 * clockwise, matching lib/surfaces). Scene convention: +X east, +Y up,
 * -Z north. Returns null on non-finite input (guarded like the lib).
 */
export function skyDirection(
  altitudeDeg: number,
  azimuthDeg: number
): [number, number, number] | null {
  if (!Number.isFinite(altitudeDeg) || !Number.isFinite(azimuthDeg)) return null;
  const alt = (altitudeDeg * Math.PI) / 180;
  const az = (azimuthDeg * Math.PI) / 180;
  const c = Math.cos(alt);
  return [Math.sin(az) * c, Math.sin(alt), -Math.cos(az) * c];
}

/**
 * Find the next Mars sunset (sun altitude crossing 0 downward) at a site,
 * scanning forward from `fromMs` in 2 minute steps across up to 26 hours (one
 * sol plus margin), then bisecting to ~1 s. Real Mars24 geometry via
 * lib/surfaces marsSunPosition; null if no crossing found (polar day/night at
 * high-latitude seasons) or on bad input.
 */
export function findNextMarsSunset(
  site: SurfaceSite,
  fromMs: number
): number | null {
  if (!Number.isFinite(fromMs)) return null;
  const stepMs = 120_000;
  const horizonMs = 26 * 3_600_000;
  let prev = marsSunPosition(site, new Date(fromMs));
  if (prev === null) return null;
  for (let t = fromMs + stepMs; t <= fromMs + horizonMs; t += stepMs) {
    const cur = marsSunPosition(site, new Date(t));
    if (cur === null) return null;
    if (prev.altitudeDeg > 0 && cur.altitudeDeg <= 0) {
      // bisect [t - step, t] to about a second
      let lo = t - stepMs;
      let hi = t;
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        const p = marsSunPosition(site, new Date(mid));
        if (p === null) return null;
        if (p.altitudeDeg > 0) lo = mid;
        else hi = mid;
      }
      return Math.round(hi);
    }
    prev = cur;
  }
  return null;
}

/** Format decimal hours as an HH:MM:SS clock string (for Mars LMST). */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours)) return "--:--:--";
  const h = ((hours % 24) + 24) % 24;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = Math.floor(((h - hh) * 60 - mm) * 60);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(hh)}:${p(mm)}:${p(ss)}`;
}
