import { describe, expect, it } from "vitest";
import {
  audibleRange,
  chirpMass,
  chirpTrack,
  classifyMerger,
  countByClass,
  energyRadiated,
  frequencyAtTimeHz,
  lightTravelYears,
  massRatio,
  mergerFrequencyHz,
  parseCatalog,
  ringdownFrequencyHz,
  estimatedRemnantSpin,
  eventRingdown,
  symmetricMassRatio,
  sortEvents,
  strainAmplitude,
  timeToMergerS,
  type GwEvent,
} from "./gravitational-waves";

/**
 * The physics is checked against the published values of real detections, so a
 * regression shows up as a disagreement with the literature rather than as a
 * disagreement with a previous run of our own code.
 */

/** GW150914, the first detection, from the GWOSC catalog. */
const GW150914: GwEvent = {
  name: "GW150914",
  catalog: "GWTC-1-confident",
  gps: 1126259462.4,
  m1: 34.6, m1lo: null, m1hi: null,
  m2: 30, m2lo: null, m2hi: null,
  mchirp: 27.9, mtotal: 64.6, mfinal: 61.5, afinal: 0.69, chiEff: -0.01,
  dl: 470, dlLo: null, dlHi: null, z: 0.1, snr: 26,
};

/** GW170817, the binary neutron star with the electromagnetic counterpart. */
const GW170817: GwEvent = {
  name: "GW170817",
  catalog: "GWTC-1-confident",
  gps: 1187008882.4,
  m1: 1.46, m1lo: null, m1hi: null,
  m2: 1.27, m2lo: null, m2hi: null,
  mchirp: 1.186, mtotal: 2.73, mfinal: null, afinal: null, chiEff: 0,
  dl: 40, dlLo: null, dlHi: null, z: 0.01, snr: 33,
};

describe("chirpMass", () => {
  it("reproduces the published chirp mass of GW150914 to within the posterior slop", () => {
    // Published Mc = 27.9; recombining the published median m1/m2 gives 28.03.
    // The small gap is expected and worth knowing: the catalogue's masses are
    // medians of separate marginal posteriors, so they do not algebraically
    // reproduce the directly measured chirp mass. Nothing is wrong here.
    expect(chirpMass(34.6, 30)).toBeCloseTo(28.0, 1);
    expect(Math.abs(chirpMass(34.6, 30)! - 27.9)).toBeLessThan(0.2);
  });

  it("reproduces the published chirp mass of GW170817", () => {
    // The most precisely measured parameter of that event: 1.186 Msun.
    expect(chirpMass(1.46, 1.27)).toBeCloseTo(1.186, 2);
  });

  it("equals m / 2^(1/5) for an equal-mass binary", () => {
    // (m^2)^(3/5) / (2m)^(1/5) = m^(6/5) / (2^(1/5) m^(1/5)) = m / 2^(1/5).
    const m = 30;
    expect(chirpMass(m, m)).toBeCloseTo(m / Math.pow(2, 1 / 5), 6);
  });

  it("is symmetric in its arguments", () => {
    expect(chirpMass(35, 20)).toBeCloseTo(chirpMass(20, 35)!, 10);
  });

  it("returns null on bad input", () => {
    expect(chirpMass(0, 10)).toBeNull();
    expect(chirpMass(-5, 10)).toBeNull();
    expect(chirpMass(NaN, 10)).toBeNull();
    expect(chirpMass(Infinity, 10)).toBeNull();
  });
});

describe("massRatio", () => {
  it("is <= 1 and order independent", () => {
    expect(massRatio(30, 15)).toBeCloseTo(0.5, 10);
    expect(massRatio(15, 30)).toBeCloseTo(0.5, 10);
  });
  it("is 1 for equal masses", () => {
    expect(massRatio(20, 20)).toBeCloseTo(1, 10);
  });
  it("returns null on bad input", () => {
    expect(massRatio(0, 5)).toBeNull();
    expect(massRatio(NaN, 5)).toBeNull();
  });
});

describe("mergerFrequencyHz", () => {
  it("gives GW150914 an ISCO estimate near 68 Hz, below the true merger peak", () => {
    // This guards a real limitation rather than a nice-sounding number: the
    // Schwarzschild ISCO estimate for 64.6 Msun is ~68 Hz, while the observed
    // signal peaked nearer 150-250 Hz. Spin and the finite mass ratio are why.
    // The ringdown fit (see below) is what recovers the high end.
    const f = mergerFrequencyHz(64.6)!;
    expect(f).toBeCloseTo(68, 0);
  });

  it("puts a 2.73 Msun neutron-star binary in the kilohertz band", () => {
    const f = mergerFrequencyHz(2.73)!;
    expect(f).toBeGreaterThan(1000);
  });

  it("scales inversely with total mass", () => {
    const a = mergerFrequencyHz(50)!;
    const b = mergerFrequencyHz(100)!;
    expect(a / b).toBeCloseTo(2, 6);
  });

  it("returns null on bad input", () => {
    expect(mergerFrequencyHz(0)).toBeNull();
    expect(mergerFrequencyHz(-10)).toBeNull();
    expect(mergerFrequencyHz(NaN)).toBeNull();
  });
});

describe("ringdownFrequencyHz", () => {
  it("recovers GW150914's ~290 Hz ringdown from the remnant mass and spin", () => {
    // M_f = 61.5, a = 0.69. This is close to the published peak frequency and
    // well above the 68 Hz ISCO estimate, which is the point of having both.
    const f = ringdownFrequencyHz(61.5, 0.69)!;
    expect(f).toBeGreaterThan(250);
    expect(f).toBeLessThan(330);
    expect(f).toBeGreaterThan(mergerFrequencyHz(64.6)!);
  });

  it("rises with spin at fixed remnant mass", () => {
    expect(ringdownFrequencyHz(61.5, 0.9)!).toBeGreaterThan(
      ringdownFrequencyHz(61.5, 0.1)!,
    );
  });

  it("scales inversely with remnant mass", () => {
    const a = ringdownFrequencyHz(50, 0.7)!;
    const b = ringdownFrequencyHz(100, 0.7)!;
    expect(a / b).toBeCloseTo(2, 6);
  });

  it("returns null when the remnant is unknown or unphysical", () => {
    expect(ringdownFrequencyHz(null, 0.7)).toBeNull();
    expect(ringdownFrequencyHz(61.5, null)).toBeNull();
    expect(ringdownFrequencyHz(61.5, 1)).toBeNull();
    expect(ringdownFrequencyHz(61.5, -0.1)).toBeNull();
    expect(ringdownFrequencyHz(0, 0.7)).toBeNull();
  });
});

describe("remnant spin estimate and eventRingdown", () => {
  it("symmetricMassRatio is 0.25 for equal masses and falls for uneven ones", () => {
    expect(symmetricMassRatio(30, 30)).toBeCloseTo(0.25, 10);
    expect(symmetricMassRatio(30, 3)!).toBeLessThan(0.25);
    expect(symmetricMassRatio(0, 3)).toBeNull();
  });

  it("estimates 0.686 for an equal-mass non-spinning merger", () => {
    // The standard numerical-relativity result the Rezzolla fit reproduces.
    expect(estimatedRemnantSpin(30, 30)).toBeCloseTo(0.686, 2);
  });

  it("estimates GW150914's remnant spin close to the published 0.69", () => {
    expect(estimatedRemnantSpin(34.6, 30)).toBeCloseTo(0.68, 1);
  });

  it("returns null on bad input", () => {
    expect(estimatedRemnantSpin(0, 30)).toBeNull();
    expect(estimatedRemnantSpin(NaN, 30)).toBeNull();
  });

  it("eventRingdown falls back to the estimate and says so", () => {
    // The GWOSC summary catalogue publishes no remnant spins at all, so this
    // fallback is what makes the ringdown note available for real events.
    const r = eventRingdown({ m1: 34.6, m2: 30, mfinal: 61.5, afinal: null })!;
    expect(r.estimated).toBe(true);
    expect(r.hz).toBeGreaterThan(250);
    expect(r.hz).toBeLessThan(330);
  });

  it("eventRingdown prefers a published spin and marks it not estimated", () => {
    const r = eventRingdown({ m1: 34.6, m2: 30, mfinal: 61.5, afinal: 0.69 })!;
    expect(r.estimated).toBe(false);
    expect(r.spin).toBeCloseTo(0.69, 10);
  });

  it("eventRingdown returns null without a remnant mass", () => {
    expect(eventRingdown({ m1: 1.46, m2: 1.27, mfinal: null, afinal: null })).toBeNull();
  });
});

describe("timeToMergerS and frequencyAtTimeHz", () => {
  it("round-trips: f -> t -> f", () => {
    const mc = 27.9;
    const f0 = 35;
    const t = timeToMergerS(mc, f0)!;
    expect(frequencyAtTimeHz(mc, t)).toBeCloseTo(f0, 6);
  });

  it("GW150914 spends well under a second from 30 Hz to merger", () => {
    // The published signal lasted ~0.2 s in the detectors' sensitive band.
    const t = timeToMergerS(27.9, 30)!;
    expect(t).toBeGreaterThan(0.05);
    expect(t).toBeLessThan(1.5);
  });

  it("a neutron-star binary lingers far longer in band than a heavy BBH", () => {
    // GW170817 was in band for ~100 s, GW150914 for a fraction of a second.
    const bns = timeToMergerS(1.186, 30)!;
    const bbh = timeToMergerS(27.9, 30)!;
    expect(bns).toBeGreaterThan(bbh * 50);
  });

  it("frequency rises as time-to-merger shrinks", () => {
    const early = frequencyAtTimeHz(27.9, 1)!;
    const late = frequencyAtTimeHz(27.9, 0.01)!;
    expect(late).toBeGreaterThan(early);
  });

  it("returns null on bad input", () => {
    expect(timeToMergerS(27.9, 0)).toBeNull();
    expect(timeToMergerS(0, 30)).toBeNull();
    expect(frequencyAtTimeHz(27.9, 0)).toBeNull();
    expect(frequencyAtTimeHz(NaN, 1)).toBeNull();
  });
});

describe("strainAmplitude", () => {
  it("gives GW150914 a strain of order 1e-21", () => {
    // The famous number: ~1e-21, a fraction of a proton width over 4 km.
    const h = strainAmplitude(27.9, 470, 150)!;
    expect(h).toBeGreaterThan(1e-22);
    expect(h).toBeLessThan(1e-20);
  });

  it("falls off as 1/distance", () => {
    const near = strainAmplitude(27.9, 100, 150)!;
    const far = strainAmplitude(27.9, 200, 150)!;
    expect(near / far).toBeCloseTo(2, 6);
  });

  it("returns null on bad input", () => {
    expect(strainAmplitude(27.9, 0, 150)).toBeNull();
    expect(strainAmplitude(27.9, 470, 0)).toBeNull();
    expect(strainAmplitude(NaN, 470, 150)).toBeNull();
  });
});

describe("energyRadiated", () => {
  it("matches the ~3 solar masses GW150914 radiated", () => {
    const e = energyRadiated(64.6, 61.5)!;
    expect(e.msun).toBeCloseTo(3.1, 1);
    // ~5.5e47 J, more power than all the stars in the observable universe combined.
    expect(e.joules).toBeGreaterThan(1e47);
    expect(e.joules).toBeLessThan(1e48);
  });

  it("returns null when the catalog has no remnant mass", () => {
    expect(energyRadiated(2.73, null)).toBeNull();
    expect(energyRadiated(null, 61.5)).toBeNull();
  });

  it("returns null for a non-physical (negative) radiated mass", () => {
    expect(energyRadiated(60, 65)).toBeNull();
  });
});

describe("classifyMerger", () => {
  it("classifies the archetypes", () => {
    expect(classifyMerger(34.6, 30)?.type).toBe("BBH");
    expect(classifyMerger(1.46, 1.27)?.type).toBe("BNS");
    expect(classifyMerger(23.3, 2.6)?.type).toBe("NSBH");
  });

  it("flags a mass-gap component as ambiguous rather than asserting", () => {
    // GW190814's secondary (2.6 Msun) sits in the contested gap.
    expect(classifyMerger(23.3, 2.6)?.ambiguous).toBe(true);
    // GW230529's primary (3.66) is also near the line.
    expect(classifyMerger(3.66, 1.42)?.ambiguous).toBe(true);
    // A clean stellar BBH is not ambiguous.
    expect(classifyMerger(34.6, 30)?.ambiguous).toBe(false);
  });

  it("returns null on bad input", () => {
    expect(classifyMerger(0, 5)).toBeNull();
    expect(classifyMerger(NaN, 5)).toBeNull();
  });
});

describe("lightTravelYears", () => {
  it("puts GW170817 at roughly 130 million years", () => {
    // 40 Mpc is about 130 Mly.
    const y = lightTravelYears(40)!;
    expect(y).toBeGreaterThan(1.2e8);
    expect(y).toBeLessThan(1.4e8);
  });
  it("returns null on bad input", () => {
    expect(lightTravelYears(0)).toBeNull();
    expect(lightTravelYears(-1)).toBeNull();
  });
});

describe("chirpTrack", () => {
  it("sweeps upward in frequency and ends at the merger frequency", () => {
    const t = chirpTrack(GW150914, 20, 80);
    expect(t.length).toBeGreaterThan(50);
    expect(t[0].freqHz).toBeLessThan(t[t.length - 1].freqHz);
    const fMerge = mergerFrequencyHz(GW150914.mtotal!)!;
    expect(t[t.length - 1].freqHz).toBeLessThanOrEqual(fMerge + 1e-6);
  });

  it("time-to-merger decreases along the track", () => {
    const t = chirpTrack(GW150914, 20, 40);
    for (let i = 1; i < t.length; i++) {
      expect(t[i].tS).toBeLessThanOrEqual(t[i - 1].tS);
    }
  });

  it("returns [] rather than throwing on unusable input", () => {
    expect(chirpTrack({ m1: 0, m2: 0, mchirp: null, mtotal: null, dl: 0 })).toEqual([]);
    expect(chirpTrack(GW150914, 20, 1)).toEqual([]);
  });
});

describe("audibleRange", () => {
  it("says a stellar-mass merger is audible at its true frequency", () => {
    const r = audibleRange(GW150914)!;
    expect(r.audible).toBe(true);
    expect(r.toHz).toBeGreaterThan(40);
    expect(r.fromRingdown).toBe(true);
  });

  it("a neutron-star merger sweeps into the kilohertz range", () => {
    const r = audibleRange(GW170817)!;
    expect(r.audible).toBe(true);
    expect(r.toHz).toBeGreaterThan(1000);
  });

  it("a very heavy merger falls below the comfortable band", () => {
    // A 1000 Msun system merges at a few Hz: real, but not hearable.
    const r = audibleRange({ m1: 500, m2: 500, mchirp: null, mtotal: 1000 })!;
    expect(r.audible).toBe(false);
  });
});

describe("catalog helpers", () => {
  const events = [GW150914, GW170817];

  it("parseCatalog rejects unusable payloads", () => {
    expect(parseCatalog(null)).toBeNull();
    expect(parseCatalog({})).toBeNull();
    expect(parseCatalog({ meta: {}, events: [] })).toBeNull();
    expect(parseCatalog({ meta: {}, events: [{ name: "x" }] })).toBeNull();
  });

  it("parseCatalog keeps well-formed events", () => {
    const c = parseCatalog({ meta: { count: 2 }, events });
    expect(c?.events).toHaveLength(2);
  });

  it("sortEvents orders descending and tolerates nulls", () => {
    const byMass = sortEvents(events, "mtotal");
    expect(byMass[0].name).toBe("GW150914");
    const withNull = sortEvents([...events, { ...GW170817, name: "N", mtotal: null }], "mtotal");
    expect(withNull[withNull.length - 1].name).toBe("N");
  });

  it("sortEvents does not mutate its input", () => {
    const copy = [...events];
    sortEvents(events, "dl");
    expect(events).toEqual(copy);
  });

  it("countByClass tallies the classes", () => {
    const c = countByClass(events);
    expect(c.BBH).toBe(1);
    expect(c.BNS).toBe(1);
    expect(c.NSBH).toBe(0);
  });
});
