import { describe, expect, it } from "vitest";
import {
  SELECTION_BIAS_NOTE,
  SUN_ABS_MAG_V,
  SUN_TEFF_K,
  absoluteMagnitude,
  classify,
  countByClass,
  derive,
  hrPoints,
  luminositySolar,
  mainSequenceLifetimeYears,
  mainSequenceMassSolar,
  parseStars,
  radiusSolar,
  spectralClass,
  temperatureFromColorIndex,
  type StarRow,
} from "./stars";

/**
 * Checked against published stellar parameters, so a regression disagrees with
 * the literature rather than with a previous run of our own code. The catalogue
 * values below are the ones actually shipped in
 * public/data/night-sky/stars.json.
 */

const row = (o: Partial<StarRow> & Pick<StarRow, "mag">): StarRow => ({
  id: 0, ra: 0, dec: 0, ci: null, distLy: null, spect: null,
  name: null, bayer: null, con: null, ...o,
});

/** Sirius A: V = -1.44, B-V = 0.009, 8.6 ly. Published M_V = 1.45, ~9,940 K. */
const SIRIUS = row({ mag: -1.44, ci: 0.009, distLy: 8.6, spect: "A0", name: "Sirius" });
/** Vega: V = 0.03, B-V = -0.001, 25 ly. Published M_V = 0.58. */
const VEGA = row({ mag: 0.03, ci: -0.001, distLy: 25, spect: "A0", name: "Vega" });
/** Proxima Centauri: V = 11.01, B-V = 1.807, 4.2 ly. Published M_V about 15.5. */
const PROXIMA = row({ mag: 11.01, ci: 1.807, distLy: 4.2, spect: "M5", name: "Proxima Centauri" });
/** Betelgeuse: V = 0.45, B-V = 1.5, 497.9 ly. A red supergiant. */
const BETELGEUSE = row({ mag: 0.45, ci: 1.5, distLy: 497.9, spect: "M2", name: "Betelgeuse" });
/** Aldebaran: V = 0.87, B-V = 1.538, 66.6 ly. An orange giant. */
const ALDEBARAN = row({ mag: 0.87, ci: 1.538, distLy: 66.6, spect: "K5", name: "Aldebaran" });

describe("absoluteMagnitude", () => {
  it("reproduces the published absolute magnitude of Sirius", () => {
    expect(absoluteMagnitude(SIRIUS.mag, SIRIUS.distLy)).toBeCloseTo(1.45, 1);
  });

  it("reproduces Vega's published 0.58", () => {
    expect(absoluteMagnitude(VEGA.mag, VEGA.distLy)).toBeCloseTo(0.58, 1);
  });

  it("reproduces Proxima Centauri's, around 15.5", () => {
    const m = absoluteMagnitude(PROXIMA.mag, PROXIMA.distLy)!;
    expect(m).toBeGreaterThan(15.2);
    expect(m).toBeLessThan(15.8);
  });

  it("equals the apparent magnitude at exactly 10 parsecs, by definition", () => {
    // 10 pc = 32.6156 ly, where the distance modulus vanishes.
    expect(absoluteMagnitude(5, 32.6156)).toBeCloseTo(5, 6);
  });

  it("returns null without a usable distance", () => {
    expect(absoluteMagnitude(5, null)).toBeNull();
    expect(absoluteMagnitude(5, 0)).toBeNull();
    expect(absoluteMagnitude(5, -3)).toBeNull();
    expect(absoluteMagnitude(NaN, 10)).toBeNull();
  });
});

describe("temperatureFromColorIndex", () => {
  it("gives Sirius about 10,000 K, matching its measured ~9,940 K", () => {
    const t = temperatureFromColorIndex(SIRIUS.ci)!;
    expect(t).toBeGreaterThan(9500);
    expect(t).toBeLessThan(10500);
  });

  it("gives a solar-colour star roughly the Sun's temperature", () => {
    // The Sun's B-V is about 0.65.
    const t = temperatureFromColorIndex(0.65)!;
    expect(t).toBeGreaterThan(5500);
    expect(t).toBeLessThan(6100);
  });

  it("gives a red supergiant colour a temperature in the 3,000s", () => {
    const t = temperatureFromColorIndex(BETELGEUSE.ci)!;
    expect(t).toBeGreaterThan(3300);
    expect(t).toBeLessThan(4100);
  });

  it("is monotonic: redder means cooler", () => {
    expect(temperatureFromColorIndex(0.0)!).toBeGreaterThan(
      temperatureFromColorIndex(1.0)!,
    );
    expect(temperatureFromColorIndex(1.0)!).toBeGreaterThan(
      temperatureFromColorIndex(1.8)!,
    );
  });

  it("returns null on bad input", () => {
    expect(temperatureFromColorIndex(null)).toBeNull();
    expect(temperatureFromColorIndex(NaN)).toBeNull();
  });
});

describe("luminositySolar", () => {
  it("is exactly 1 for the Sun's absolute magnitude", () => {
    expect(luminositySolar(SUN_ABS_MAG_V)).toBeCloseTo(1, 6);
  });

  it("puts Sirius in the low tens of solar luminosities", () => {
    // Published about 25 L_sun; V-band only, so a little low is expected.
    const l = luminositySolar(absoluteMagnitude(SIRIUS.mag, SIRIUS.distLy))!;
    expect(l).toBeGreaterThan(15);
    expect(l).toBeLessThan(30);
  });

  it("makes Proxima Centauri far fainter than the Sun", () => {
    const l = luminositySolar(absoluteMagnitude(PROXIMA.mag, PROXIMA.distLy))!;
    expect(l).toBeLessThan(0.01);
  });

  it("scales by exactly 100 per 5 magnitudes", () => {
    const a = luminositySolar(0)!;
    const b = luminositySolar(5)!;
    expect(a / b).toBeCloseTo(100, 4);
  });

  it("returns null on bad input", () => {
    expect(luminositySolar(null)).toBeNull();
    expect(luminositySolar(NaN)).toBeNull();
  });
});

describe("radiusSolar", () => {
  it("is 1 for solar luminosity and temperature", () => {
    expect(radiusSolar(1, SUN_TEFF_K)).toBeCloseTo(1, 6);
  });

  it("makes a red supergiant hundreds of times the Sun's radius", () => {
    const d = derive(BETELGEUSE);
    // Order of magnitude only: the measured radius is ~700 R_sun, and V-band
    // photometry with no extinction correction under-reads it. The point of the
    // test is the scale, which is what the UI claims.
    expect(d.radius!).toBeGreaterThan(100);
    expect(d.radius!).toBeLessThan(1200);
  });

  it("makes Proxima Centauri much smaller than the Sun", () => {
    expect(derive(PROXIMA).radius!).toBeLessThan(0.5);
  });

  it("returns null on bad input", () => {
    expect(radiusSolar(null, 5000)).toBeNull();
    expect(radiusSolar(1, 0)).toBeNull();
    expect(radiusSolar(-1, 5000)).toBeNull();
  });
});

describe("classify", () => {
  it("puts the Sun on the main sequence", () => {
    expect(classify(SUN_ABS_MAG_V, SUN_TEFF_K)).toBe("main-sequence");
  });

  it("puts Sirius and Vega on the main sequence", () => {
    expect(derive(SIRIUS).lclass).toBe("main-sequence");
    expect(derive(VEGA).lclass).toBe("main-sequence");
  });

  it("puts Proxima Centauri on the main sequence, at its faint red end", () => {
    expect(derive(PROXIMA).lclass).toBe("main-sequence");
  });

  it("calls Betelgeuse a supergiant", () => {
    expect(derive(BETELGEUSE).lclass).toBe("supergiant");
  });

  it("calls Aldebaran evolved rather than main sequence", () => {
    // A cool star that is far too bright for its colour to still be burning
    // hydrogen on the main sequence.
    const c = derive(ALDEBARAN).lclass;
    expect(c === "giant" || c === "subgiant").toBe(true);
  });

  it("recognises a hot, very faint star as a white dwarf", () => {
    // Sirius B: M_V about 11.2 at roughly 25,000 K.
    expect(classify(11.2, 25000)).toBe("white-dwarf");
  });

  it("returns null on bad input", () => {
    expect(classify(null, 5000)).toBeNull();
    expect(classify(5, null)).toBeNull();
    expect(classify(5, 0)).toBeNull();
  });
});

describe("mass and lifetime, main sequence only", () => {
  it("gives the Sun one solar mass and ten billion years", () => {
    expect(mainSequenceMassSolar(1)).toBeCloseTo(1, 6);
    expect(mainSequenceLifetimeYears(1)).toBeCloseTo(1e10, 0);
  });

  it("makes a massive star short-lived", () => {
    // 10 solar masses: a few tens of millions of years, not billions.
    const t = mainSequenceLifetimeYears(10)!;
    expect(t).toBeLessThan(1e9);
    expect(t).toBeGreaterThan(1e7);
  });

  it("makes a red dwarf outlive the universe many times over", () => {
    expect(mainSequenceLifetimeYears(0.2)!).toBeGreaterThan(5e11);
  });

  it("refuses to report a mass for an evolved star", () => {
    // Photometry cannot give the mass of a supergiant, so we do not pretend.
    const d = derive(BETELGEUSE);
    expect(d.lclass).toBe("supergiant");
    expect(d.massSolar).toBeNull();
    expect(d.lifetimeYears).toBeNull();
  });

  it("does report a mass for a main-sequence star", () => {
    expect(derive(SIRIUS).massSolar!).toBeGreaterThan(1.5);
  });

  it("returns null on bad input", () => {
    expect(mainSequenceMassSolar(0)).toBeNull();
    expect(mainSequenceLifetimeYears(null)).toBeNull();
  });
});

describe("parseStars and hrPoints", () => {
  const payload = {
    columns: ["id", "ra", "dec", "mag", "ci", "dist_ly", "spect", "name", "bayer", "con"],
    stars: [
      [32349, 101.2872, -16.7161, -1.44, 0.009, 8.6, "A0", "Sirius", "Alp", "CMa"],
      // no distance: cannot be placed on the diagram
      [1, 10, 10, 5.0, 0.5, null, "G0", "Nodist", null, "And"],
      // no colour index: cannot be placed either
      [2, 20, 20, 5.0, null, 100, "G0", "Nocolour", null, "And"],
      // malformed
      "not-a-row",
    ],
  };

  it("parses rows and tolerates malformed ones", () => {
    const rows = parseStars(payload);
    expect(rows).toHaveLength(3);
    expect(rows[0].name).toBe("Sirius");
    expect(rows[1].distLy).toBeNull();
  });

  it("returns [] for an unusable payload", () => {
    expect(parseStars(null)).toEqual([]);
    expect(parseStars({})).toEqual([]);
  });

  it("plots only stars where both axes are knowable", () => {
    const pts = hrPoints(parseStars(payload));
    expect(pts).toHaveLength(1);
    expect(pts[0].star.name).toBe("Sirius");
  });

  it("countByClass tallies the classes", () => {
    const pts = hrPoints([SIRIUS, BETELGEUSE, PROXIMA]);
    const c = countByClass(pts);
    expect(c["main-sequence"]).toBe(2);
    expect(c.supergiant).toBe(1);
  });
});

describe("spectralClass", () => {
  it("extracts the Harvard class letter", () => {
    expect(spectralClass("A0")).toBe("A");
    expect(spectralClass("M2Iab")).toBe("M");
    expect(spectralClass("g5")).toBe("G");
  });
  it("returns null when there is no class letter", () => {
    expect(spectralClass(null)).toBeNull();
    expect(spectralClass("")).toBeNull();
    expect(spectralClass("WR")).toBeNull();
  });
});

describe("the selection-bias note", () => {
  it("states the magnitude limit and what it hides", () => {
    expect(SELECTION_BIAS_NOTE).toMatch(/magnitude-limited/i);
    expect(SELECTION_BIAS_NOTE).toMatch(/red dwarf/i);
  });
});
