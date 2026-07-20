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
  it("has the twenty-one world views, all unique", () => {
    expect(WORLDS).toHaveLength(21);
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
      iss: "/iss",
      mars: "/mars",
      surfaces: "/surfaces",
      virtual: "/virtual-earth",
      moon: "/moon",
      solar: "/solar-system",
      moons: "/moons",
      "jupiter-moons": "/jupiter-moons",
      "saturn-moons": "/saturn-moons",
      "other-moons": "/other-moons",
      "dwarf-moons": "/dwarf-moons",
      dwarfs: "/dwarf-planets",
      "small-bodies": "/small-bodies",
      "asteroid-moons": "/asteroid-moons",
      "meteor-showers": "/meteor-showers",
      sun: "/sun",
      exoplanets: "/exoplanets",
      "night-sky": "/night-sky",
      interstellar: "/interstellar",
    });
  });

  it("assigns every world to a real group", () => {
    const groupIds = new Set(WORLD_GROUPS.map((g) => g.id));
    for (const w of WORLDS) {
      expect(groupIds.has(w.group)).toBe(true);
    }
  });

  it("splits 4 Earth, 14 Solar System and 3 Beyond worlds", () => {
    expect(getWorldsInGroup("earth").map((w) => w.id)).toEqual([
      "earth",
      "living",
      "virtual",
      "iss",
    ]);
    expect(getWorldsInGroup("solar-system").map((w) => w.id)).toEqual([
      "mars",
      "surfaces",
      "moon",
      "solar",
      "moons",
      "jupiter-moons",
      "saturn-moons",
      "other-moons",
      "dwarf-moons",
      "dwarfs",
      "small-bodies",
      "asteroid-moons",
      "meteor-showers",
      "sun",
    ]);
    expect(getWorldsInGroup("beyond").map((w) => w.id)).toEqual([
      "exoplanets",
      "night-sky",
      "interstellar",
    ]);
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
    expect(grouped[0].worlds).toHaveLength(4);
    expect(grouped[1].worlds).toHaveLength(14);
    expect(grouped[2].worlds).toHaveLength(3);
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
    expect(searchWorlds("   ")).toHaveLength(21);
  });

  it("finds a world by exact label", () => {
    expect(searchWorlds("mars")[0].id).toBe("mars");
  });

  it("finds a world by keyword / body name", () => {
    // "ceres" is unique to the Dwarf Planets (`dwarfs`) world: Ceres has no moons,
    // so it is absent from the Dwarf Moons tab. ("pluto"/"charon"/"eris"/"haumea"/
    // "makemake" are now shared between `dwarfs` and `dwarf-moons`, which ties on
    // score and resolves by canonical order, so they are guarded elsewhere by
    // terms unique to each tab.)
    expect(searchWorlds("ceres")[0].id).toBe("dwarfs");
    expect(searchWorlds("europa")[0].id).toBe("moons");
    expect(searchWorlds("time machine")[0].id).toBe("virtual");
    expect(searchWorlds("city lights")[0].id).toBe("living");
    expect(searchWorlds("orrery")[0].id).toBe("solar");
    expect(searchWorlds("trappist")[0].id).toBe("exoplanets");
    expect(searchWorlds("habitable zone")[0].id).toBe("exoplanets");
    expect(searchWorlds("constellation")[0].id).toBe("night-sky");
    expect(searchWorlds("orion")[0].id).toBe("night-sky");
    expect(searchWorlds("milky way")[0].id).toBe("night-sky");
    expect(searchWorlds("messier")[0].id).toBe("night-sky");
    expect(searchWorlds("apophis")[0].id).toBe("small-bodies");
    expect(searchWorlds("comet")[0].id).toBe("small-bodies");
    expect(searchWorlds("perseids")[0].id).toBe("meteor-showers");
    expect(searchWorlds("geminids")[0].id).toBe("meteor-showers");
    expect(searchWorlds("meteor shower")[0].id).toBe("meteor-showers");
    expect(searchWorlds("meteor")[0].id).toBe("meteor-showers");
    expect(searchWorlds("radiant")[0].id).toBe("meteor-showers");
    expect(searchWorlds("zhr")[0].id).toBe("meteor-showers");
    expect(searchWorlds("aurora")[0].id).toBe("sun");
    expect(searchWorlds("space weather")[0].id).toBe("sun");
    expect(searchWorlds("sunspot")[0].id).toBe("sun");
    expect(searchWorlds("solar wind")[0].id).toBe("sun");
    // ISS Tracker — guarded by terms unique to it. ("satellite" is intentionally
    // NOT asserted here: it is a shared keyword of the Earth world, which sorts
    // first on the tie, so the honest guard uses ISS-only phrases.)
    expect(searchWorlds("iss")[0].id).toBe("iss");
    expect(searchWorlds("space station")[0].id).toBe("iss");
    expect(searchWorlds("spot the station")[0].id).toBe("iss");
    expect(searchWorlds("sgp4")[0].id).toBe("iss");
    expect(searchWorlds("tiangong")[0].id).toBe("iss");
    // Jupiter's Moons (Galilean events) — guarded by terms unique to it. "io",
    // "europa", "ganymede" and "callisto" are shared with the Moons world (which
    // sorts first on the tie), so the honest guard uses Jupiter-events-only phrases.
    expect(searchWorlds("galilean")[0].id).toBe("jupiter-moons");
    expect(searchWorlds("shadow transit")[0].id).toBe("jupiter-moons");
    expect(searchWorlds("jovian")[0].id).toBe("jupiter-moons");
    expect(searchWorlds("meeus")[0].id).toBe("jupiter-moons");
    // Saturn's Moons (ring tilt / seasonal events) — guarded by terms unique to
    // it. "saturn" is shared with the Planets (`solar`) world and
    // "titan"/"iapetus"/"enceladus"/"mimas" are shared with the `moons` world,
    // both of which sort first on the tie, so the honest guard uses phrases unique
    // to this tab (multi-word "saturn moons", "ring tilt", "ring plane", plus
    // "phesat", "cassini", "saturnian").
    expect(searchWorlds("saturn moons")[0].id).toBe("saturn-moons");
    expect(searchWorlds("ring tilt")[0].id).toBe("saturn-moons");
    expect(searchWorlds("ring plane")[0].id).toBe("saturn-moons");
    expect(searchWorlds("ring opening")[0].id).toBe("saturn-moons");
    expect(searchWorlds("phesat")[0].id).toBe("saturn-moons");
    expect(searchWorlds("cassini")[0].id).toBe("saturn-moons");
    expect(searchWorlds("saturnian")[0].id).toBe("saturn-moons");
    // Other Moons (Mars/Uranus/Neptune satellites) — guarded by terms unique to
    // it. "uranus" and "neptune" are shared with the Planets (`solar`) world and
    // "triton" is shared with the `moons` world, all of which sort first on the
    // tie, so the honest guard uses terms only this tab carries: the multi-word
    // "other moons" plus the moon names "phobos", "miranda", "oberon", "titania"
    // and "nereid".
    expect(searchWorlds("other moons")[0].id).toBe("other-moons");
    expect(searchWorlds("phobos")[0].id).toBe("other-moons");
    expect(searchWorlds("miranda")[0].id).toBe("other-moons");
    expect(searchWorlds("oberon")[0].id).toBe("other-moons");
    expect(searchWorlds("titania")[0].id).toBe("other-moons");
    expect(searchWorlds("nereid")[0].id).toBe("other-moons");
    // Dwarf Moons (Pluto/Eris/Haumea/Makemake satellites) — guarded by terms
    // unique to it. "pluto"/"charon"/"eris"/"haumea"/"makemake" are shared with the
    // Dwarf Planets (`dwarfs`) world (they tie on score and resolve by canonical
    // order), so the honest guard uses terms only this tab carries: the multi-word
    // "dwarf moons" plus the small-moon names.
    expect(searchWorlds("dwarf moons")[0].id).toBe("dwarf-moons");
    expect(searchWorlds("styx")[0].id).toBe("dwarf-moons");
    expect(searchWorlds("nix")[0].id).toBe("dwarf-moons");
    expect(searchWorlds("hydra")[0].id).toBe("dwarf-moons");
    expect(searchWorlds("kerberos")[0].id).toBe("dwarf-moons");
    expect(searchWorlds("dysnomia")[0].id).toBe("dwarf-moons");
    expect(searchWorlds("hiiaka")[0].id).toBe("dwarf-moons");
    expect(searchWorlds("namaka")[0].id).toBe("dwarf-moons");
    // Asteroid Moons (real binary/multiple asteroid systems + the comet honesty) —
    // guarded by terms UNIQUE to it. Bare "asteroid" and "comet" are shared with the
    // Comets & Asteroids (`small-bodies`) world, which wins those on its exact
    // keyword, so the honest guard uses terms only this tab carries: the multi-word
    // "asteroid moons" plus the system / moon / mission names below.
    expect(searchWorlds("asteroid moons")[0].id).toBe("asteroid-moons");
    expect(searchWorlds("didymos")[0].id).toBe("asteroid-moons");
    expect(searchWorlds("dimorphos")[0].id).toBe("asteroid-moons");
    expect(searchWorlds("dart")[0].id).toBe("asteroid-moons");
    expect(searchWorlds("dactyl")[0].id).toBe("asteroid-moons");
    expect(searchWorlds("kleopatra")[0].id).toBe("asteroid-moons");
    expect(searchWorlds("patroclus")[0].id).toBe("asteroid-moons");
    // Interstellar (the third Beyond world) — guarded by terms UNIQUE to it. Bare
    // "oumuamua", "borisov" and "interstellar" are SHARED with the Comets & Asteroids
    // (`small-bodies`) world, which sorts first on the tie (canonical order), so the
    // honest guard uses terms only this tab carries: the swarm-defense sim vocabulary,
    // the "3i atlas" multi-word designation, "hyperbolic" and "planetary defense".
    expect(searchWorlds("swarm")[0].id).toBe("interstellar");
    expect(searchWorlds("swarm robotics")[0].id).toBe("interstellar");
    expect(searchWorlds("boids")[0].id).toBe("interstellar");
    expect(searchWorlds("3i atlas")[0].id).toBe("interstellar");
    expect(searchWorlds("hyperbolic")[0].id).toBe("interstellar");
    expect(searchWorlds("planetary defense")[0].id).toBe("interstellar");
    // Surfaces (ground-level Mars + Titan) — guarded by terms UNIQUE to it. Bare
    // "mars" is the Mars world's own label, "titan" is shared with the `moons` and
    // `saturn-moons` worlds and "curiosity"/"cassini" are shared with earlier tabs,
    // so the honest guard uses terms only this tab carries: the multi-word
    // "stand on mars", the site names "gale crater" and "jezero", "panorama",
    // "blue sunset", "mount sharp" and "huygens" (verified unclaimed elsewhere).
    expect(searchWorlds("stand on mars")[0].id).toBe("surfaces");
    expect(searchWorlds("gale crater")[0].id).toBe("surfaces");
    expect(searchWorlds("mount sharp")[0].id).toBe("surfaces");
    expect(searchWorlds("jezero")[0].id).toBe("surfaces");
    expect(searchWorlds("panorama")[0].id).toBe("surfaces");
    expect(searchWorlds("blue sunset")[0].id).toBe("surfaces");
    expect(searchWorlds("huygens")[0].id).toBe("surfaces");
    expect(searchWorlds("titan surface")[0].id).toBe("surfaces");
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
    // "ceres" is unique to the `dwarfs` world (Ceres has no moons), so it returns a
    // single solar-system match without the pluto/dwarf-moons tie.
    const grouped = groupSearchResults(searchWorlds("ceres"));
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
