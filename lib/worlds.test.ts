import { describe, expect, it } from "vitest";
import {
  WORLDS,
  WORLD_GROUPS,
  fuzzyScore,
  getGroup,
  getGroupForWorld,
  getWorld,
  getWorldsInGroup,
  groupSearchResults,
  groupedWorlds,
  searchWorlds,
  worldScore,
  type WorldTab,
} from "./worlds";

/**
 * The worlds registry is the single source of truth for the nav, command
 * palette, mobile menu and overview. These guard the invariants those UIs
 * depend on, plus the fuzzy-search ranking.
 */
describe("worlds registry", () => {
  it("has the eleven world views, all unique", () => {
    expect(WORLDS).toHaveLength(11);
    const ids = WORLDS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    const hrefs = WORLDS.map((w) => w.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("matches the current route map exactly", () => {
    const map = Object.fromEntries(WORLDS.map((w) => [w.id, w.href]));
    expect(map).toEqual({
      earth: "/",
      living: "/living-earth",
      mars: "/mars",
      virtual: "/virtual-earth",
      moon: "/moon",
      solar: "/solar-system",
      moons: "/moons",
      dwarfs: "/dwarf-planets",
      "small-bodies": "/small-bodies",
      sun: "/sun",
      exoplanets: "/exoplanets",
    });
  });

  it("assigns every world to a real group", () => {
    const groupIds = new Set(WORLD_GROUPS.map((g) => g.id));
    for (const w of WORLDS) {
      expect(groupIds.has(w.group)).toBe(true);
    }
  });

  it("splits 3 Earth, 7 Solar System and 1 Beyond world", () => {
    expect(getWorldsInGroup("earth").map((w) => w.id)).toEqual([
      "earth",
      "living",
      "virtual",
    ]);
    expect(getWorldsInGroup("solar-system").map((w) => w.id)).toEqual([
      "mars",
      "moon",
      "solar",
      "moons",
      "dwarfs",
      "small-bodies",
      "sun",
    ]);
    expect(getWorldsInGroup("beyond").map((w) => w.id)).toEqual(["exoplanets"]);
  });

  it("gives every world a non-empty label, blurb and hex accent", () => {
    for (const w of WORLDS) {
      expect(w.label.length).toBeGreaterThan(0);
      expect(w.blurb.length).toBeGreaterThan(0);
      expect(w.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(w.keywords.length).toBeGreaterThan(0);
    }
  });

  it("looks worlds and groups up by id", () => {
    expect(getWorld("mars")?.label).toBe("Mars");
    expect(getWorld("solar")?.href).toBe("/solar-system");
    expect(getWorld("nope" as WorldTab)).toBeUndefined();
    expect(getGroup("earth")?.label).toBe("Earth");
    expect(getGroupForWorld("dwarfs")).toBe("solar-system");
    expect(getGroupForWorld("living")).toBe("earth");
  });

  it("groups worlds in canonical order", () => {
    const grouped = groupedWorlds();
    expect(grouped.map((g) => g.group.id)).toEqual([
      "earth",
      "solar-system",
      "beyond",
    ]);
    expect(grouped[0].worlds).toHaveLength(3);
    expect(grouped[1].worlds).toHaveLength(7);
    expect(grouped[2].worlds).toHaveLength(1);
  });
});

describe("fuzzyScore", () => {
  it("returns 0 for an empty query", () => {
    expect(fuzzyScore("", "mars")).toBe(0);
    expect(fuzzyScore("   ", "mars")).toBe(0);
  });

  it("ranks exact > prefix > substring > subsequence > no-match", () => {
    const exact = fuzzyScore("mars", "mars");
    const prefix = fuzzyScore("mar", "mars");
    const substring = fuzzyScore("ars", "mars");
    const subseq = fuzzyScore("mrs", "mars");
    const none = fuzzyScore("xyz", "mars");
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(subseq);
    expect(subseq).toBeGreaterThan(none);
    expect(none).toBe(0);
  });

  it("is case-insensitive and trims", () => {
    expect(fuzzyScore("  MARS ", "Mars")).toBe(fuzzyScore("mars", "mars"));
  });
});

describe("searchWorlds", () => {
  it("returns every world in canonical order for an empty query", () => {
    expect(searchWorlds("").map((w) => w.id)).toEqual(WORLDS.map((w) => w.id));
    expect(searchWorlds("   ")).toHaveLength(11);
  });

  it("finds a world by exact label", () => {
    expect(searchWorlds("mars")[0].id).toBe("mars");
  });

  it("finds a world by keyword / body name", () => {
    expect(searchWorlds("pluto")[0].id).toBe("dwarfs");
    expect(searchWorlds("europa")[0].id).toBe("moons");
    expect(searchWorlds("time machine")[0].id).toBe("virtual");
    expect(searchWorlds("city lights")[0].id).toBe("living");
    expect(searchWorlds("orrery")[0].id).toBe("solar");
    expect(searchWorlds("trappist")[0].id).toBe("exoplanets");
    expect(searchWorlds("habitable zone")[0].id).toBe("exoplanets");
    expect(searchWorlds("apophis")[0].id).toBe("small-bodies");
    expect(searchWorlds("comet")[0].id).toBe("small-bodies");
    expect(searchWorlds("aurora")[0].id).toBe("sun");
    expect(searchWorlds("space weather")[0].id).toBe("sun");
    expect(searchWorlds("sunspot")[0].id).toBe("sun");
    expect(searchWorlds("solar wind")[0].id).toBe("sun");
  });

  it("returns nothing for gibberish", () => {
    expect(searchWorlds("qzxwvk")).toEqual([]);
  });

  it("only returns matches (never the whole list) for a real query", () => {
    const results = searchWorlds("mars");
    expect(results.length).toBeLessThan(WORLDS.length);
    expect(results.length).toBeGreaterThan(0);
  });
});

describe("worldScore", () => {
  it("scores 0 for an empty query", () => {
    expect(worldScore("", WORLDS[0])).toBe(0);
  });

  it("scores a matching world above a non-matching one", () => {
    const mars = getWorld("mars")!;
    const moon = getWorld("moon")!;
    expect(worldScore("mars", mars)).toBeGreaterThan(worldScore("mars", moon));
  });
});

describe("groupSearchResults", () => {
  it("groups results and drops empty groups", () => {
    const grouped = groupSearchResults(searchWorlds("pluto"));
    expect(grouped).toHaveLength(1);
    expect(grouped[0].group.id).toBe("solar-system");
    expect(grouped[0].worlds[0].id).toBe("dwarfs");
  });

  it("keeps all groups for the full list", () => {
    const grouped = groupSearchResults(searchWorlds(""));
    expect(grouped.map((g) => g.group.id)).toEqual([
      "earth",
      "solar-system",
      "beyond",
    ]);
  });
});
