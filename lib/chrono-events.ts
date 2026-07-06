/**
 * Dated historical events — defensive loader for the Virtual Earth timeline.
 * When the simulated year falls within an event's span, the scene pulses a
 * marker at its coordinates and the HUD shows a card with the name and years.
 *
 * EXPECTED asset (dropped separately by the coordinator / research agent):
 *   public/data/history/events.json
 *   [
 *     {
 *       "name": "World War II",
 *       "startYear": 1939, "endYear": 1945,
 *       "lat": 52.23, "lon": 21.01,
 *       "category": "conflict",
 *       "source": "https://..."
 *     },
 *     ...
 *   ]
 *
 * If the fetch fails we fall back to ~15 marquee, real, well-known dated events
 * with real coordinates (below). Never throws, never blocks the scene. Kept
 * factual and sourced; the HUD labels the source when present.
 */

export type EventCategory =
  | "conflict"
  | "science"
  | "exploration"
  | "culture"
  | "disaster"
  | "founding";

export interface HistoricalEvent {
  name: string;
  startYear: number;
  /** inclusive end year; omitted → single-year (endYear = startYear) */
  endYear: number;
  /** degrees, +N */
  lat: number;
  /** degrees, +E */
  lon: number;
  category: EventCategory;
  source?: string;
}

export interface EventCatalog {
  source: string;
  usingFallback: boolean;
  events: HistoricalEvent[];
}

export const EVENTS_URL = "/data/history/events.json";

const VALID_CATEGORIES: ReadonlySet<string> = new Set<EventCategory>([
  "conflict",
  "science",
  "exploration",
  "culture",
  "disaster",
  "founding",
]);

interface RawEvent {
  name?: unknown;
  startYear?: unknown;
  year?: unknown;
  endYear?: unknown;
  lat?: unknown;
  lon?: unknown;
  category?: unknown;
  source?: unknown;
}

function normalizeEvent(raw: RawEvent): HistoricalEvent | null {
  const name = typeof raw.name === "string" ? raw.name : null;
  const start = Number(raw.startYear ?? raw.year);
  const lat = Number(raw.lat);
  const lon = Number(raw.lon);
  if (!name || !Number.isFinite(start) || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }
  let end = Number(raw.endYear);
  if (!Number.isFinite(end)) end = start;
  const category =
    typeof raw.category === "string" && VALID_CATEGORIES.has(raw.category)
      ? (raw.category as EventCategory)
      : "culture";
  const source = typeof raw.source === "string" ? raw.source : undefined;
  return { name, startYear: start, endYear: Math.max(end, start), lat, lon, category, source };
}

/** True if `year` falls within [startYear, endYear] inclusive. */
export function isEventActive(event: HistoricalEvent, year: number): boolean {
  return year >= event.startYear && year <= event.endYear;
}

/**
 * All events active at `year`, most-recently-started first (so a fresh event
 * cards above an ongoing one). Pure; small catalogs, linear scan is fine.
 */
export function activeEvents(
  events: HistoricalEvent[],
  year: number
): HistoricalEvent[] {
  return events
    .filter((e) => isEventActive(e, year))
    .sort((a, b) => b.startYear - a.startYear);
}

/**
 * A 0..1 pulse envelope for an event at `year`: rises at the start, holds
 * during the span, fades near the end — so markers "appear and fade" as asked.
 * For single-year events the whole thing is a short bump. Pure.
 */
export function eventIntensity(event: HistoricalEvent, year: number): number {
  if (!isEventActive(event, year)) return 0;
  const span = event.endYear - event.startYear;
  if (span <= 0) return 1; // single-year: full pulse while active
  const ramp = Math.min(span * 0.25, 2); // years to ramp in/out (cap 2 yr)
  const sinceStart = year - event.startYear;
  const untilEnd = event.endYear - year;
  const inEnv = ramp <= 0 ? 1 : Math.min(sinceStart / ramp, 1);
  const outEnv = ramp <= 0 ? 1 : Math.min(untilEnd / ramp, 1);
  return Math.max(0, Math.min(inEnv, outEnv));
}

/**
 * Built-in fallback: ~16 marquee real dated events with real coordinates.
 * Single-year events use start = end. Sources are the plain well-known record.
 */
export const FALLBACK_EVENTS: HistoricalEvent[] = [
  { name: "First cuneiform writing, Uruk", startYear: -3200, endYear: -3200, lat: 31.32, lon: 45.64, category: "culture" },
  { name: "Great Pyramid of Giza built", startYear: -2560, endYear: -2560, lat: 29.98, lon: 31.13, category: "culture" },
  { name: "Founding of Rome (traditional)", startYear: -753, endYear: -753, lat: 41.9, lon: 12.5, category: "founding" },
  { name: "Library of Alexandria founded", startYear: -283, endYear: -283, lat: 31.2, lon: 29.9, category: "culture" },
  { name: "Fall of the Western Roman Empire", startYear: 476, endYear: 476, lat: 41.9, lon: 12.5, category: "conflict" },
  { name: "Gutenberg printing press, Mainz", startYear: 1440, endYear: 1440, lat: 50.0, lon: 8.27, category: "science" },
  { name: "Columbus reaches the Americas", startYear: 1492, endYear: 1492, lat: 24.0, lon: -74.5, category: "exploration" },
  { name: "Newton's Principia published", startYear: 1687, endYear: 1687, lat: 51.51, lon: -0.13, category: "science" },
  { name: "Industrial Revolution begins", startYear: 1760, endYear: 1840, lat: 53.48, lon: -2.24, category: "science" },
  { name: "Darwin's On the Origin of Species", startYear: 1859, endYear: 1859, lat: 51.51, lon: -0.13, category: "science" },
  { name: "World War I", startYear: 1914, endYear: 1918, lat: 49.2, lon: 6.0, category: "conflict" },
  { name: "World War II (Europe)", startYear: 1939, endYear: 1945, lat: 52.23, lon: 21.01, category: "conflict" },
  { name: "World War II (Pacific)", startYear: 1941, endYear: 1945, lat: 21.36, lon: -157.94, category: "conflict" },
  { name: "First atomic bomb, Trinity test", startYear: 1945, endYear: 1945, lat: 33.68, lon: -106.48, category: "science" },
  { name: "Apollo 11 launch, Moon landing", startYear: 1969, endYear: 1969, lat: 28.57, lon: -80.65, category: "exploration" },
  { name: "World Wide Web invented, CERN", startYear: 1989, endYear: 1989, lat: 46.23, lon: 6.05, category: "science" },
];

export async function fetchEvents(signal?: AbortSignal): Promise<EventCatalog> {
  try {
    const res = await fetch(EVENTS_URL, { signal });
    if (!res.ok) throw new Error(`events.json responded ${res.status}`);
    const json = (await res.json()) as unknown;
    if (!Array.isArray(json) || json.length === 0) {
      throw new Error("events.json empty or malformed");
    }
    const events = json
      .map((e) => normalizeEvent(e as RawEvent))
      .filter((e): e is HistoricalEvent => e !== null);
    if (events.length === 0) throw new Error("no valid event records");
    return { source: "public/data/history/events.json", usingFallback: false, events };
  } catch {
    return { source: "built-in sample (16 events)", usingFallback: true, events: FALLBACK_EVENTS };
  }
}
