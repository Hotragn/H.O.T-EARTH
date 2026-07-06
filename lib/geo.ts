/**
 * Geographic <-> 3D coordinate conventions for the H.O.T Earth globe.
 *
 * The globe is an unrotated three.js SphereGeometry. Three.js generates
 * sphere vertices as:
 *
 *   x = -r * cos(phi) * sin(theta)
 *   y =  r * cos(theta)
 *   z =  r * sin(phi) * sin(theta)
 *
 * with texture u = phi / 2PI and v running north -> south. For a standard
 * equirectangular Earth texture (u = (lon + 180) / 360, v = (90 - lat) / 180)
 * this works out to the following Earth-fixed frame:
 *
 *   lon   0  (Greenwich)  -> +X
 *   lon +90 (East)        -> -Z
 *   lon -90 (West)        -> +Z
 *   lat +90 (North pole)  -> +Y
 *
 * Everything that converts between lat/lon and 3D (picking, sun direction,
 * markers) MUST go through these two functions so the convention lives in
 * exactly one place. Verified against known cities in lib/geo.test.ts.
 */

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export interface LatLon {
  /** degrees, +N */
  lat: number;
  /** degrees, +E, normalized to [-180, 180] */
  lon: number;
}

/** lat/lon in degrees -> position on a sphere of `radius`, as [x, y, z]. */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius = 1
): [number, number, number] {
  const out: [number, number, number] = [0, 0, 0];
  latLonToVector3Into(lat, lon, radius, out, 0);
  return out;
}

/**
 * Allocation-free variant of {@link latLonToVector3} for hot loops (wind
 * particles, city points): writes x,y,z into `out` at `offset`. Same
 * convention, same math — latLonToVector3 delegates here so the convention
 * still lives in exactly one place.
 */
export function latLonToVector3Into(
  lat: number,
  lon: number,
  radius: number,
  out: { [i: number]: number },
  offset: number
): void {
  const latR = lat * DEG2RAD;
  const lonR = lon * DEG2RAD;
  const cosLat = Math.cos(latR);
  out[offset] = radius * cosLat * Math.cos(lonR);
  out[offset + 1] = radius * Math.sin(latR);
  out[offset + 2] = -radius * cosLat * Math.sin(lonR);
}

/** Position in globe-local space -> lat/lon in degrees. */
export function vector3ToLatLon(x: number, y: number, z: number): LatLon {
  const r = Math.sqrt(x * x + y * y + z * z) || 1;
  const lat = Math.asin(Math.min(1, Math.max(-1, y / r))) * RAD2DEG;
  const lon = Math.atan2(-z, x) * RAD2DEG;
  return { lat, lon: normalizeLon(lon) };
}

/** Normalize a longitude to [-180, 180). */
export function normalizeLon(lon: number): number {
  let l = ((lon + 180) % 360 + 360) % 360 - 180;
  // avoid -0
  if (Object.is(l, -0)) l = 0;
  return l;
}

/** "41.90° N · 12.48° E" style label for the HUD. */
export function formatLatLon({ lat, lon }: LatLon): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}° ${ns} · ${Math.abs(lon).toFixed(2)}° ${ew}`;
}
