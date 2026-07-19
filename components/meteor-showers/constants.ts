/**
 * Shared render constants + view-state types for the Meteor Showers scene.
 *
 * Like the Night Sky, the observer sits at the ORIGIN looking OUT at the inside
 * of a celestial sphere; each shower's RADIANT is placed on that sphere by its
 * real J2000 RA/Dec (lib/meteor-showers.radiantVector3 → lib/celestial), so the
 * radiant geometry shares exactly one coordinate convention with the star map.
 * The camera orbits the origin at a tiny radius (rotate-in-place), and zoom is by
 * field-of-view, not dolly (dolly is meaningless against a far shell).
 */

import { METEOR_ACCENT } from "@/lib/meteor-facts";

export { METEOR_ACCENT };

/** Radiant shell radius (world units). Large, so parallax is negligible. */
export const RADIANT_SPHERE_RADIUS = 300;
/** Faint star backdrop, just outside the radiants for depth/context. */
export const BACKDROP_SPHERE_RADIUS = 305;

/** Field-of-view zoom bounds (degrees). */
export const DEFAULT_FOV = 60;
export const MIN_FOV = 20;
export const MAX_FOV = 82;

/** Observer position for radiant altitude / observed-rate / best-time. */
export interface Observer {
  label: string;
  lat: number;
  lon: number;
}

/** Preset observing sites, spread across latitude + longitude. */
export const PRESET_CITIES: readonly Observer[] = [
  { label: "Boston, USA", lat: 42.3601, lon: -71.0589 },
  { label: "New York, USA", lat: 40.7128, lon: -74.006 },
  { label: "London, UK", lat: 51.5074, lon: -0.1278 },
  { label: "Reykjavík, Iceland", lat: 64.1466, lon: -21.9426 },
  { label: "Nairobi, Kenya", lat: -1.2921, lon: 36.8219 },
  { label: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
  { label: "Sydney, Australia", lat: -33.8688, lon: 151.2093 },
  { label: "Santiago, Chile", lat: -33.4489, lon: -70.6693 },
];

export const DEFAULT_OBSERVER: Observer = PRESET_CITIES[0];
