import { describe, expect, it } from "vitest";
import {
  fmtActivityWindow,
  fmtCountdown,
  fmtDaysToPeak,
  fmtRaDec,
  fmtVelocity,
  fmtZhr,
  isAsteroidParent,
  monthDayLabel,
  moonAtPeak,
  nextMajorPeak,
  parentCrossLink,
  parentLabel,
  parseShowerCatalog,
  parseStarBackdrop,
  peakDate,
  strengthStyle,
  velocityStyle,
  type MeteorShowerRecord,
} from "./meteor-facts";

/** A Perseids-like comet-parent shower that is in the small-bodies catalogue. */
const PER: MeteorShowerRecord = {
  code: "PER",
  iau_number: 7,
  name: "Perseids",
  radiant_ra: 48,
  radiant_dec: 58,
  peak_date: "08-13",
  peak_solar_longitude: 140,
  active_start: "07-17",
  active_end: "08-24",
  zhr: 100,
  velocity_kms: 59,
  r_population_index: 2.2,
  parent_body: "109P/Swift-Tuttle",
  parent_type: "comet",
  parent_designation: "109P",
  parent_in_catalog: true,
  note: "classic summer shower",
};

/** A variable, no-parent shower (null ZHR, parent not established). */
const AMO: MeteorShowerRecord = {
  code: "AMO",
  iau_number: 246,
  name: "alpha-Monocerotids",
  radiant_ra: 117,
  radiant_dec: 1,
  peak_date: "11-22",
  peak_solar_longitude: 239.32,
  active_start: "11-15",
  active_end: "11-25",
  zhr: null,
  velocity_kms: 65,
  r_population_index: 2.4,
  parent_body: null,
  parent_type: null,
  parent_designation: null,
  parent_in_catalog: false,
  note: null,
};

/** A Geminids-like ASTEROID-parent shower in the catalogue. */
const GEM: MeteorShowerRecord = {
  ...PER,
  code: "GEM",
  name: "Geminids",
  peak_date: "12-14",
  zhr: 150,
  parent_body: "(3200) Phaethon",
  parent_type: "asteroid",
  parent_designation: "3200",
  parent_in_catalog: true,
};

/** A Ursids-like comet-parent shower whose parent is NOT in the catalogue. */
const URS: MeteorShowerRecord = {
  ...PER,
  code: "URS",
  name: "Ursids",
  zhr: 10,
  parent_body: "8P/Tuttle",
  parent_type: "comet",
  parent_designation: null,
  parent_in_catalog: false,
};

describe("parseShowerCatalog", () => {
  it("parses a valid catalogue and tolerates nulls", () => {
    const cat = parseShowerCatalog({
      meta: { title: "t", year: 2026 },
      showers: [PER, AMO],
    });
    expect(cat).not.toBeNull();
    expect(cat!.showers).toHaveLength(2);
    expect(cat!.showers[1].zhr).toBeNull();
    expect(cat!.meta.year).toBe(2026);
  });

  it("skips rows with no code or no radiant, and returns null for junk", () => {
    const cat = parseShowerCatalog({
      showers: [{ name: "x" }, { code: "OK", radiant_ra: 10, radiant_dec: 5 }],
    });
    expect(cat!.showers).toHaveLength(1);
    expect(cat!.showers[0].code).toBe("OK");
    expect(parseShowerCatalog(null)).toBeNull();
    expect(parseShowerCatalog({ nope: 1 })).toBeNull();
  });
});

describe("parseStarBackdrop", () => {
  it("reads columnar stars brighter than the limit and skips faint ones", () => {
    const raw = {
      meta: { columns: ["id", "ra", "dec", "mag"] },
      stars: [
        [1, 0, 0, 1.0], // bright, kept
        [2, 90, 45, 6.0], // faint, dropped at limit 4.8
      ],
    };
    const bd = parseStarBackdrop(raw, 300, 4.8);
    expect(bd).not.toBeNull();
    expect(bd!.count).toBe(1);
    expect(bd!.positions).toHaveLength(3);
    expect(parseStarBackdrop(null, 300)).toBeNull();
  });
});

describe("formatters", () => {
  it("labels ZHR honestly, variable = no fixed rate", () => {
    expect(fmtZhr(100)).toBe("~100/hr");
    expect(fmtZhr(null)).toBe("Variable (outburst-driven)");
  });

  it("formats radiant, velocity, window and dates", () => {
    expect(fmtRaDec(PER)).toBe("RA 48.0° · Dec +58.0°");
    expect(fmtVelocity(59)).toBe("59 km/s");
    expect(fmtActivityWindow(PER)).toBe("Jul 17 – Aug 24");
    expect(monthDayLabel("08-13")).toBe("Aug 13");
  });

  it("phrases days-to-peak with correct pluralisation", () => {
    expect(fmtDaysToPeak(0)).toBe("peaks today");
    expect(fmtDaysToPeak(1)).toBe("peaks in 1 day");
    expect(fmtDaysToPeak(4)).toBe("peaks in 4 days");
    expect(fmtDaysToPeak(-1)).toBe("peaked 1 day ago");
    expect(fmtDaysToPeak(-3)).toBe("peaked 3 days ago");
  });

  it("counts down and clamps past targets to zero", () => {
    const now = new Date("2026-07-18T00:00:00Z");
    const target = new Date("2026-07-21T04:12:00Z");
    expect(fmtCountdown(target, now)).toBe("3 d 04 h 12 m");
    expect(fmtCountdown(new Date("2026-07-17T00:00:00Z"), now)).toBe("0 d 00 h 00 m");
  });
});

describe("classification styling", () => {
  it("classifies strength by ZHR (null → no fixed strength)", () => {
    expect(strengthStyle(150)?.label).toBe("Major");
    expect(strengthStyle(10)?.label).toBe("Minor");
    expect(strengthStyle(null)).toBeNull();
  });

  it("classifies velocity", () => {
    expect(velocityStyle(59)?.label).toBe("Fast");
    expect(velocityStyle(27)?.label).toBe("Slow");
  });
});

describe("parent body + cross-link", () => {
  it("cross-links only when the parent is in the small-bodies catalogue", () => {
    expect(parentCrossLink(PER)?.href).toBe("/small-bodies");
    expect(parentCrossLink(PER)?.label).toContain("109P/Swift-Tuttle");
    expect(parentCrossLink(URS)).toBeNull(); // 8P/Tuttle not in catalogue
    expect(parentCrossLink(AMO)).toBeNull(); // no parent
  });

  it("flags asteroid parents and labels missing parents honestly", () => {
    expect(isAsteroidParent(GEM)).toBe(true);
    expect(isAsteroidParent(PER)).toBe(false);
    expect(parentLabel(AMO)).toBe("No firmly established parent");
    expect(parentLabel(PER)).toBe("109P/Swift-Tuttle");
  });
});

describe("moon at peak + next major peak", () => {
  it("returns a moon illumination fraction in [0,1] at the peak, null for bad dates", () => {
    const m = moonAtPeak(PER);
    expect(m).not.toBeNull();
    expect(m!.fraction).toBeGreaterThanOrEqual(0);
    expect(m!.fraction).toBeLessThanOrEqual(1);
    expect(["dark", "some", "bright"]).toContain(m!.severity);
    expect(moonAtPeak({ ...PER, peak_date: "" })).toBeNull();
  });

  it("builds the peak date in the data year at the right month/day", () => {
    const d = peakDate(PER)!;
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(7); // August (0-based)
    expect(d.getUTCDate()).toBe(13);
  });

  it("finds the next strong/major peak after a date", () => {
    const now = new Date("2026-07-18T00:00:00Z");
    const nm = nextMajorPeak([PER, AMO, GEM, URS], now);
    expect(nm).not.toBeNull();
    // PER (ZHR 100, peaks Aug 13) is the next strong shower after Jul 18
    expect(nm!.shower.code).toBe("PER");
    expect(nm!.untilDays).toBeGreaterThan(0);
  });
});
