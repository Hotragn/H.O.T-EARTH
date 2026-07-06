/**
 * NASA GIBS layer catalog + WMS snapshot URL builder.
 *
 * Strategy (see .claude/skills/globe-3d-visualization): one full-globe
 * equirectangular WMS snapshot (EPSG:4326) per layer per date, mapped
 * straight onto the sphere. No tile pyramid in v1.
 *
 * Layer IDs below were verified against the live GIBS WMS GetCapabilities
 * (https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi) on 2026-07-06,
 * including test GetMap renders for 2026-07-05 / 2026-07-04.
 *
 * Note: MODIS/AIRS cloud-fraction layers were evaluated and deliberately
 * dropped — MODIS_Terra_Cloud_Fraction_Day renders as a near-opaque
 * statistical field that hides the planet, and AIRS_L2_Total_Cloud_Fraction
 * has large orbit-swath gaps. Real cloud imagery is already visible in the
 * VIIRS true-color layer, so we show that instead of faking a cloud layer.
 */

export const GIBS_WMS_ENDPOINT =
  "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi";

export type LayerKind = "base" | "overlay";

export interface GibsLayerDef {
  /** short slug used in our /api/gibs/[layer] route */
  slug: string;
  /** exact GIBS layer identifier (verified 2026-07-06) */
  gibsId: string;
  /** base = replaces the day texture; overlay = alpha-composited on top */
  kind: LayerKind;
  format: "image/jpeg" | "image/png";
  width: number;
  height: number;
  /** UI strings */
  title: string;
  description: string;
  /** How many days GIBS typically lags real time for this product. */
  typicalLagDays: number;
}

export const GIBS_LAYERS: readonly GibsLayerDef[] = [
  {
    slug: "true-color",
    gibsId: "VIIRS_SNPP_CorrectedReflectance_TrueColor",
    kind: "base",
    format: "image/jpeg",
    width: 4096,
    height: 2048,
    title: "Live satellite",
    description:
      "VIIRS (Suomi NPP) corrected-reflectance true color. Real clouds, storms and snow as the satellite saw them, one Earth-day ago.",
    typicalLagDays: 1,
  },
  {
    slug: "surface-temp",
    gibsId: "VIIRS_NOAA20_Land_Surface_Temp_Day",
    kind: "overlay",
    format: "image/png",
    width: 2048,
    height: 1024,
    title: "Surface temp",
    description:
      "VIIRS (NOAA-20) daytime land surface temperature. Color ramp from cold (blue/purple) to hot (red).",
    typicalLagDays: 1,
  },
  {
    slug: "precipitation",
    gibsId: "IMERG_Precipitation_Rate",
    kind: "overlay",
    format: "image/png",
    width: 2048,
    height: 1024,
    title: "Precipitation",
    description:
      "GPM IMERG precipitation rate. Where it is raining and snowing, globally. Product lags ~2 days.",
    typicalLagDays: 2,
  },
] as const;

export type GibsLayerSlug = (typeof GIBS_LAYERS)[number]["slug"];

export function getLayerBySlug(slug: string): GibsLayerDef | undefined {
  return GIBS_LAYERS.find((l) => l.slug === slug);
}

/** YYYY-MM-DD (UTC) for `daysAgo` days before now. */
export function utcDateString(daysAgo = 0, from: Date = new Date()): string {
  const d = new Date(from.getTime() - daysAgo * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/**
 * Default imagery date: yesterday UTC — GIBS daily layers lag real time by
 * ~1 day (see globe-3d-visualization skill, "gotchas").
 */
export function defaultImageryDate(): string {
  return utcDateString(1);
}

/**
 * Full-globe WMS GetMap snapshot URL. WMS 1.1.1 keeps BBOX in lon/lat
 * order (-180,-90,180,90), avoiding the 1.3.0 axis-order trap.
 */
export function buildWmsSnapshotUrl(layer: GibsLayerDef, date: string): string {
  const params = new URLSearchParams({
    SERVICE: "WMS",
    VERSION: "1.1.1",
    REQUEST: "GetMap",
    LAYERS: layer.gibsId,
    STYLES: "",
    SRS: "EPSG:4326",
    BBOX: "-180,-90,180,90",
    WIDTH: String(layer.width),
    HEIGHT: String(layer.height),
    FORMAT: layer.format,
    TIME: date,
  });
  if (layer.format === "image/png") params.set("TRANSPARENT", "TRUE");
  return `${GIBS_WMS_ENDPOINT}?${params.toString()}`;
}

/** URL of our caching proxy for the client to load textures from. */
export function gibsProxyUrl(slug: GibsLayerSlug, date: string): string {
  return `/api/gibs/${slug}?date=${date}`;
}
