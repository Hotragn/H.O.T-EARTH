/**
 * lib/worlds.ts — single source of truth for every navigable world/view.
 *
 * The nav, command palette, mobile menu and worlds overview all read from this
 * registry. Add a world here and it appears everywhere; nothing else needs to
 * know the list.
 *
 * Honesty rule (project-wide): every label + blurb describes what the view
 * actually renders. No invented capabilities.
 */

/**
 * Stable ids for each world. This union is the app-wide `active` tab contract:
 * every `*App.tsx` passes one of these string literals to <NavShell active=…>.
 * Keep these ids stable — changing one is a breaking change for those files.
 * (Re-exported from components/ui/NavShell.tsx for backwards compatibility.)
 */
export type WorldTab =
  | "earth"
  | "living"
  | "mars"
  | "virtual"
  | "moon"
  | "solar"
  | "moons"
  | "dwarfs"
  | "small-bodies"
  | "meteor-showers"
  | "sun"
  | "exoplanets"
  | "night-sky";

/**
 * World groups. Designed so a third group can be added by extending this union +
 * WORLD_GROUPS and tagging new worlds with it — no consumer code changes
 * required. "beyond" is that third group: worlds outside our Solar System.
 */
export type WorldGroupId = "earth" | "solar-system" | "beyond";

export interface WorldGroup {
  id: WorldGroupId;
  /** Short trigger label shown in the nav. */
  label: string;
  /** One-line description of the group, for the overview / menus. */
  blurb: string;
}

export interface World {
  id: WorldTab;
  label: string;
  href: string;
  group: WorldGroupId;
  /** One honest line describing what the view renders. */
  blurb: string;
  /** Per-world accent (hex) for dots, tiles and fallbacks. */
  accent: string;
  /** Extra search terms (aliases, body names) for the command palette. */
  keywords: string[];
  /**
   * Optional shipped texture used as a small thumbnail in the overview.
   * Loaded defensively — cards fall back to an accent tile if it is missing.
   */
  thumb?: string;
  /**
   * For group views whose thumbnail is one representative body (e.g. Planets →
   * Jupiter), the name of that body, so the overview can stay honest about what
   * the image shows. Omitted when the thumbnail is the world itself.
   */
  thumbBody?: string;
}

/** Group order drives section order in the nav, palette and overview. */
export const WORLD_GROUPS: readonly WorldGroup[] = [
  {
    id: "earth",
    label: "Earth",
    blurb: "Our home planet, live and through time.",
  },
  {
    id: "solar-system",
    label: "Solar System",
    blurb: "The other worlds, on real orbits.",
  },
  {
    id: "beyond",
    label: "Beyond",
    blurb: "Real planetary systems around other stars.",
  },
] as const;

/**
 * Every world, in canonical order (grouped). This order is used for the empty
 * command palette, the mobile menu and the overview grid.
 */
export const WORLDS: readonly World[] = [
  // --- Earth ---------------------------------------------------------------
  {
    id: "earth",
    label: "Earth",
    href: "/",
    group: "earth",
    blurb: "Live NASA imagery with a physically computed day and night terminator.",
    accent: "#4aa3ff",
    keywords: ["earth", "home", "blue marble", "terminator", "satellite", "gibs", "clouds", "weather", "forecast"],
    thumb: "/textures/earth-day-blue-marble.jpg",
  },
  {
    id: "living",
    label: "Living Earth",
    href: "/living-earth",
    group: "earth",
    blurb: "City lights and simulated human activity across the night side.",
    accent: "#3ecf8e",
    keywords: ["living earth", "city", "cities", "lights", "night", "black marble", "population", "activity"],
    thumb: "/textures/earth-night-black-marble.jpg",
  },
  {
    id: "virtual",
    label: "Virtual Earth",
    href: "/virtual-earth",
    group: "earth",
    blurb: "Earth replayed through deep time, under a slowly precessing night sky.",
    accent: "#b98bff",
    keywords: ["virtual earth", "time machine", "chrono", "history", "precession", "deep time", "paleo", "past", "era"],
    thumb: "/textures/earth-day-blue-marble.jpg",
  },
  // --- Solar System --------------------------------------------------------
  {
    id: "mars",
    label: "Mars",
    href: "/mars",
    group: "solar-system",
    blurb: "Real Mars orbital time from Mars24, plus seasonal climatology.",
    accent: "#e06246",
    keywords: ["mars", "red planet", "mars24", "sol", "ls", "climatology", "dust", "viking"],
    thumb: "/textures/mars-mola-colorized.jpg",
  },
  {
    id: "moon",
    label: "Moon",
    href: "/moon",
    group: "solar-system",
    blurb: "Computed lunar phase and libration over measured surface temperatures.",
    accent: "#c7ccd6",
    keywords: ["moon", "luna", "lunar", "phase", "libration", "diviner", "temperature", "lroc"],
    thumb: "/textures/moon-lroc.jpg",
  },
  {
    id: "solar",
    label: "Planets",
    href: "/solar-system",
    group: "solar-system",
    blurb: "An orrery of all eight planets at their real heliocentric longitudes.",
    accent: "#f2a63b",
    keywords: ["solar system", "planets", "orrery", "orbits", "mercury", "venus", "jupiter", "saturn", "uranus", "neptune", "heliocentric"],
    thumb: "/textures/planets/jupiter.jpg",
    thumbBody: "Jupiter",
  },
  {
    id: "moons",
    label: "Moons",
    href: "/moons",
    group: "solar-system",
    blurb: "Mini-orreries of the giant planets' major moons.",
    accent: "#6fd6c9",
    keywords: ["moons", "satellites", "europa", "io", "ganymede", "callisto", "titan", "enceladus", "triton", "mimas", "iapetus"],
    thumb: "/textures/moons/europa.jpg",
    thumbBody: "Europa",
  },
  {
    id: "dwarfs",
    label: "Dwarf Planets",
    href: "/dwarf-planets",
    group: "solar-system",
    blurb: "The IAU dwarf planets on their real, eccentric orbits.",
    accent: "#d59adf",
    keywords: ["dwarf planets", "dwarfs", "pluto", "ceres", "charon", "haumea", "makemake", "eris", "kuiper", "tno"],
    thumb: "/textures/dwarf-planets/pluto.jpg",
    thumbBody: "Pluto",
  },
  {
    id: "small-bodies",
    label: "Comets & Asteroids",
    href: "/small-bodies",
    group: "solar-system",
    blurb:
      "Real comet and near-Earth-asteroid orbits from JPL, with factual close approaches — hazards stated plainly.",
    accent: "#5fd3e6",
    keywords: [
      "comet",
      "asteroid",
      "near-earth",
      "neo",
      "pha",
      "potentially hazardous",
      "small bodies",
      "halley",
      "apophis",
      "bennu",
      "eros",
      "vesta",
      "oumuamua",
      "borisov",
      "interstellar",
      "close approach",
    ],
    thumb: "/textures/small-bodies/eros.jpg",
    thumbBody: "Eros",
  },
  {
    id: "meteor-showers",
    label: "Meteor Showers",
    href: "/meteor-showers",
    group: "solar-system",
    blurb:
      "Annual meteor showers at their real radiants, activity windows and parent bodies — ZHR is an idealized peak rate; observed rates run lower.",
    accent: "#4fe3b0",
    keywords: [
      "meteor",
      "meteor shower",
      "meteor showers",
      "shooting star",
      "radiant",
      "zhr",
      "fireball",
      "meteoroid",
      "debris stream",
      "perseids",
      "geminids",
      "leonids",
      "quadrantids",
      "orionids",
      "eta aquariids",
      "lyrids",
      "taurids",
      "draconids",
      "ursids",
      "solar longitude",
    ],
  },
  {
    id: "sun",
    label: "Sun",
    href: "/sun",
    group: "solar-system",
    blurb: "The Sun in six wavelengths, with live NOAA space weather.",
    accent: "#ffa41b",
    keywords: [
      "sun",
      "solar",
      "space weather",
      "aurora",
      "solar wind",
      "sunspot",
      "flare",
      "kp",
      "corona",
      "solar cycle",
      "sdo",
      "swpc",
      "geomagnetic storm",
      "coronal hole",
      "photosphere",
      "magnetogram",
    ],
    thumb: "/textures/sun/aia171.jpg",
  },
  // --- Beyond ---------------------------------------------------------------
  {
    id: "exoplanets",
    label: "Exoplanets",
    href: "/exoplanets",
    group: "beyond",
    blurb:
      "Real exoplanet systems from the NASA Exoplanet Archive — orbits to scale, computed habitable zones, illustrative worlds.",
    accent: "#8f7dff",
    keywords: [
      "exoplanets",
      "exoplanet",
      "systems",
      "other stars",
      "habitable zone",
      "trappist-1",
      "proxima centauri",
      "kepler",
      "hot jupiter",
      "51 pegasi",
      "hr 8799",
      "nasa exoplanet archive",
      "beyond",
    ],
  },
  {
    id: "night-sky",
    label: "Night Sky",
    href: "/night-sky",
    group: "beyond",
    blurb:
      "A star map of ~9,000 real measured stars on the celestial sphere, with constellation figures marked as a cultural overlay and a sky-from-your-location mode.",
    accent: "#8aa0ff",
    keywords: [
      "star",
      "stars",
      "star map",
      "starmap",
      "night sky",
      "planetarium",
      "constellation",
      "constellations",
      "milky way",
      "messier",
      "deep sky",
      "celestial sphere",
      "sidereal",
      "sirius",
      "vega",
      "orion",
      "big dipper",
      "hipparcos",
      "hyg",
      "hygdb",
      "nebula",
      "galaxy",
      "cluster",
      "beyond",
    ],
  },
] as const;

// --- lookups ---------------------------------------------------------------

export function getWorld(id: WorldTab): World | undefined {
  return WORLDS.find((w) => w.id === id);
}

export function getGroup(groupId: WorldGroupId): WorldGroup | undefined {
  return WORLD_GROUPS.find((g) => g.id === groupId);
}

export function getWorldsInGroup(groupId: WorldGroupId): World[] {
  return WORLDS.filter((w) => w.group === groupId);
}

export function getGroupForWorld(id: WorldTab): WorldGroupId | undefined {
  return getWorld(id)?.group;
}

/** All groups paired with their worlds, in canonical order. */
export function groupedWorlds(): Array<{ group: WorldGroup; worlds: World[] }> {
  return WORLD_GROUPS.map((group) => ({
    group,
    worlds: getWorldsInGroup(group.id),
  }));
}

// --- fuzzy search (command palette) ----------------------------------------

/**
 * Lightweight, dependency-free fuzzy score of `query` against a single
 * `target` string. Higher is better; 0 means no match. Deterministic and pure
 * so it can be unit-tested in isolation.
 *
 * Ranking, best to worst: exact > prefix > substring > subsequence. Shorter and
 * earlier matches rank above longer / later ones.
 */
export function fuzzyScore(query: string, target: string): number {
  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();
  if (q.length === 0) return 0;
  if (t === q) return 1000;
  if (t.startsWith(q)) return 800 - t.length;
  const idx = t.indexOf(q);
  if (idx !== -1) return 500 - idx;
  // subsequence: every query char appears in order somewhere in the target
  let ti = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const next = t.indexOf(q[qi], ti);
    if (next === -1) return 0;
    ti = next + 1;
  }
  return Math.max(1, 100 - ti);
}

/**
 * Score a world against a query. The query is split into whitespace tokens with
 * AND semantics: every token must match at least one of the world's targets
 * (label, slug or a keyword) or the whole world scores 0. This lets multi-word
 * queries like "city lights", "time machine" or "red planet" find the right
 * world even when the words live in different keywords. The label is weighted
 * slightly above keywords.
 */
export function worldScore(query: string, world: World): number {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const slug = world.href.replace(/[/-]+/g, " ").trim();
  const targets = [world.label, slug, ...world.keywords].filter(Boolean);
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const target of targets) {
      const weight = target === world.label ? 1.2 : 1;
      best = Math.max(best, fuzzyScore(token, target) * weight);
    }
    if (best === 0) return 0; // AND: an unmatched token disqualifies the world
    total += best;
  }
  return total;
}

/**
 * Search all worlds. Empty query returns every world in canonical order;
 * otherwise returns matches sorted by score (stable on ties by canonical
 * order).
 */
export function searchWorlds(query: string): World[] {
  const q = query.trim();
  if (q.length === 0) return [...WORLDS];
  return WORLDS.map((w, i) => ({ w, i, s: worldScore(q, w) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.w);
}

/** Group an already-ordered list of worlds for sectioned display. */
export function groupSearchResults(
  worlds: World[],
): Array<{ group: WorldGroup; worlds: World[] }> {
  return WORLD_GROUPS.map((group) => ({
    group,
    worlds: worlds.filter((w) => w.group === group.id),
  })).filter((g) => g.worlds.length > 0);
}
