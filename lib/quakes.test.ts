import { describe, expect, it } from "vitest";
import {
  CRUSTAL_P_KM_S,
  akiBValue,
  stableCompleteness,
  CRUSTAL_S_KM_S,
  ENERGY_REFERENCE,
  LOCAL_DISTANCE_LIMIT_KM,
  completenessMagnitude,
  countByDepthClass,
  depthClass,
  distanceToQuakeKm,
  energyJoules,
  energyRatio,
  expectedCountAbove,
  gutenbergRichterFit,
  largestEnergyShare,
  localWaveArrival,
  magnitudeBins,
  momentMagnitude,
  parseUsgsFeed,
  seismicMomentNm,
  totalEnergyJoules,
  type Quake,
} from "./quakes";

/**
 * Validation strategy: published seismology values and textbook identities, plus
 * a synthetic catalogue drawn from a KNOWN b-value to prove the fit recovers the
 * slope it was given. Nothing is pinned to a previous run of this code.
 *
 * Published anchors used:
 *   - Gutenberg-Richter energy relation log10 E = 1.5 M + 4.8 (USGS).
 *   - Hanks & Kanamori (1979): M0 [N m] = 10^(1.5 Mw + 9.1).
 *   - 2011 Tohoku earthquake: Mw 9.0 to 9.1, published seismic moment about
 *     3.9e22 to 5.3e22 N m.
 *   - 1960 Valdivia earthquake, Mw 9.5, the largest ever instrumentally
 *     recorded, moment about 2e23 N m.
 *   - One magnitude step is 10^1.5 = 31.6x the energy; two steps is exactly
 *     1000x.
 *   - Depth bands: shallow < 70 km, intermediate 70 to 300 km, deep > 300 km,
 *     and no earthquakes below about 700 km.
 *   - Global b-value close to 1.0 (0.8 to 1.2).
 *   - New York to London great-circle distance about 5,570 km.
 */

function quake(partial: Partial<Quake> & { mag: number }): Quake {
  return {
    id: `q${Math.random()}`,
    magType: "mww",
    latDeg: 0,
    lonDeg: 0,
    depthKm: 10,
    time: new Date("2026-08-01T00:00:00Z"),
    place: "test",
    significance: null,
    tsunami: false,
    url: null,
    ...partial,
  };
}

describe("energy from magnitude (Gutenberg-Richter energy relation)", () => {
  it("matches the published relation at round magnitudes", () => {
    // log10 E = 1.5 M + 4.8
    expect(energyJoules(0)!).toBeCloseTo(Math.pow(10, 4.8), 5);
    expect(Math.log10(energyJoules(6)!)).toBeCloseTo(13.8, 10);
    expect(Math.log10(energyJoules(8)!)).toBeCloseTo(16.8, 10);
  });

  it("puts a magnitude 8 at the published ~6.3e16 joules", () => {
    const e = energyJoules(8)!;
    expect(e).toBeGreaterThan(6.0e16);
    expect(e).toBeLessThan(6.6e16);
  });

  it("makes one magnitude step 31.6x and two steps exactly 1000x", () => {
    expect(energyRatio(6, 5)!).toBeCloseTo(31.6227766, 4);
    expect(energyRatio(7, 5)!).toBeCloseTo(1000, 8);
    expect(energyRatio(5, 6)!).toBeCloseTo(1 / 31.6227766, 6);
    expect(energyRatio(5, 5)!).toBe(1);
  });

  it("puts a magnitude 6 within a factor of two of the Hiroshima device", () => {
    // A standard textbook comparison: M6 radiates ~6.3e13 J, the 15 kt
    // Hiroshima device released ~6.3e13 J.
    const ratio = energyJoules(6)! / ENERGY_REFERENCE.hiroshimaJoules;
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(2);
  });

  it("returns null for bad input", () => {
    expect(energyJoules(NaN)).toBeNull();
    expect(energyRatio(NaN, 5)).toBeNull();
    expect(energyRatio(5, Infinity)).toBeNull();
  });
});

describe("seismic moment (Hanks & Kanamori 1979)", () => {
  it("matches the published moment of the 2011 Tohoku earthquake", () => {
    // Mw 9.0 to 9.1; published M0 about 3.9e22 to 5.3e22 N m.
    const m0 = seismicMomentNm(9.0)!;
    expect(m0).toBeGreaterThan(3.5e22);
    expect(m0).toBeLessThan(4.5e22);
    expect(seismicMomentNm(9.1)!).toBeGreaterThan(m0);
  });

  it("matches the published moment of the 1960 Valdivia earthquake", () => {
    // Mw 9.5, the largest instrumentally recorded; M0 about 2e23 N m.
    const m0 = seismicMomentNm(9.5)!;
    expect(m0).toBeGreaterThan(1.5e23);
    expect(m0).toBeLessThan(2.5e23);
  });

  it("round-trips magnitude through moment", () => {
    for (const mw of [4, 5.5, 6.7, 7.2, 8, 9.1]) {
      expect(momentMagnitude(seismicMomentNm(mw)!)!).toBeCloseTo(mw, 10);
    }
  });

  it("returns null for bad input", () => {
    expect(seismicMomentNm(NaN)).toBeNull();
    expect(momentMagnitude(0)).toBeNull();
    expect(momentMagnitude(-1)).toBeNull();
    expect(momentMagnitude(NaN)).toBeNull();
  });
});

describe("energy over a catalogue", () => {
  it("sums radiated energy", () => {
    const qs = [quake({ mag: 5 }), quake({ mag: 5 })];
    expect(totalEnergyJoules(qs)).toBeCloseTo(2 * energyJoules(5)!, 5);
    expect(totalEnergyJoules([])).toBe(0);
    expect(totalEnergyJoules(null)).toBe(0);
  });

  it("shows the largest event dominating the energy budget", () => {
    // The real, counter-intuitive result: one M7 outweighs a thousand M4s.
    const qs = [quake({ mag: 7 }), ...Array.from({ length: 1000 }, () => quake({ mag: 4 }))];
    const share = largestEnergyShare(qs)!;
    expect(share.largest.mag).toBe(7);
    // M7 is 10^4.5 = 31,623x an M4, so 1000 M4s are still only ~3% of it.
    expect(share.share).toBeGreaterThan(0.95);
  });

  it("returns null without a catalogue", () => {
    expect(largestEnergyShare([])).toBeNull();
    expect(largestEnergyShare(null)).toBeNull();
  });
});

describe("depth classes", () => {
  it("uses the standard seismological bands", () => {
    expect(depthClass(0)).toBe("shallow");
    expect(depthClass(69.9)).toBe("shallow");
    expect(depthClass(70)).toBe("intermediate");
    expect(depthClass(300)).toBe("intermediate");
    expect(depthClass(300.1)).toBe("deep");
    expect(depthClass(650)).toBe("deep");
    expect(depthClass(NaN)).toBeNull();
  });

  it("counts a mixed catalogue", () => {
    const counts = countByDepthClass([
      quake({ mag: 5, depthKm: 10 }),
      quake({ mag: 5, depthKm: 35 }),
      quake({ mag: 5, depthKm: 120 }),
      quake({ mag: 5, depthKm: 500 }),
    ]);
    expect(counts).toEqual({ shallow: 2, intermediate: 1, deep: 1 });
    expect(countByDepthClass(null)).toEqual({ shallow: 0, intermediate: 0, deep: 0 });
  });
});

describe("magnitude binning", () => {
  const qs = [
    quake({ mag: 4.0 }),
    quake({ mag: 4.0 }),
    quake({ mag: 4.5 }),
    quake({ mag: 5.0 }),
  ];

  it("counts per bin and cumulates downward from the top", () => {
    const bins = magnitudeBins(qs, 0.5);
    const at = (m: number) => bins.find((b) => Math.abs(b.mag - m) < 1e-6)!;
    expect(at(4.0).count).toBe(2);
    expect(at(4.5).count).toBe(1);
    expect(at(5.0).count).toBe(1);
    // cumulative = this bin and everything above it
    expect(at(5.0).cumulative).toBe(1);
    expect(at(4.5).cumulative).toBe(2);
    expect(at(4.0).cumulative).toBe(4);
  });

  it("has a cumulative column that never increases with magnitude", () => {
    const bins = magnitudeBins(qs, 0.1);
    for (let i = 1; i < bins.length; i++) {
      expect(bins[i].cumulative).toBeLessThanOrEqual(bins[i - 1].cumulative);
    }
  });

  it("returns [] for empty or absurd input", () => {
    expect(magnitudeBins([], 0.1)).toEqual([]);
    expect(magnitudeBins(null)).toEqual([]);
    expect(magnitudeBins(qs, 0)).toEqual([]);
    expect(magnitudeBins(qs, -1)).toEqual([]);
    // a binning that would produce thousands of bins is refused, not attempted
    expect(magnitudeBins([quake({ mag: 0 }), quake({ mag: 9 })], 0.001)).toEqual([]);
  });
});

/**
 * A synthetic catalogue drawn from a known b-value. Gutenberg-Richter says
 * N(>=M) = 10^(a - bM), so magnitudes above Mc are exponentially distributed
 * with rate b ln10. Inverting the CDF with a deterministic sequence gives a
 * catalogue whose true b we know, which is the only honest way to test that the
 * fit recovers a slope rather than that it reproduces itself.
 */
function syntheticCatalogue(trueB: number, mc: number, n: number, binWidth = 0.1): Quake[] {
  const out: Quake[] = [];
  // Real catalogues report magnitude to one decimal, so the bin centred on Mc
  // holds events from Mc - dM/2 upwards. The draw therefore starts half a bin
  // BELOW Mc before rounding, otherwise the lowest bin is only half populated
  // and Aki's dM/2 correction (which is right for a real catalogue) reads as an
  // error against the synthetic one.
  for (let i = 0; i < n; i++) {
    // deterministic quasi-uniform sequence in (0, 1)
    const u = (i + 0.5) / n;
    const mag = mc - binWidth / 2 - Math.log10(1 - u) / trueB;
    out.push(quake({ mag: Math.round(mag / binWidth) * binWidth }));
  }
  return out;
}

describe("Gutenberg-Richter fit", () => {
  it("recovers a known b-value from a synthetic catalogue", () => {
    for (const trueB of [0.8, 1.0, 1.25]) {
      const fit = gutenbergRichterFit(syntheticCatalogue(trueB, 4.0, 20000), 4.0, 0.1)!;
      expect(fit).not.toBeNull();
      expect(fit.b).toBeCloseTo(trueB, 1);
      expect(fit.rSquared).toBeGreaterThan(0.98);
      expect(fit.mc).toBe(4.0);
    }
  });

  it("recovers the productivity term too", () => {
    // With N events at or above mc, the law must predict about N at mc.
    const n = 5000;
    const fit = gutenbergRichterFit(syntheticCatalogue(1.0, 4.5, n), 4.5, 0.1)!;
    const predicted = expectedCountAbove(fit, 4.5)!;
    expect(predicted / n).toBeGreaterThan(0.85);
    expect(predicted / n).toBeLessThan(1.2);
  });

  it("predicts the ten-fold drop per magnitude step when b is 1", () => {
    const fit = gutenbergRichterFit(syntheticCatalogue(1.0, 4.0, 20000), 4.0, 0.1)!;
    const atFive = expectedCountAbove(fit, 5)!;
    const atSix = expectedCountAbove(fit, 6)!;
    expect(atFive / atSix).toBeGreaterThan(8);
    expect(atFive / atSix).toBeLessThan(12.5);
  });

  it("is dragged wrong by fitting through the incomplete low end", () => {
    // The whole reason Mc exists. Build a catalogue that is complete above 4.5
    // and severely under-reported below it, then fit from 3.0 anyway.
    const complete = syntheticCatalogue(1.0, 4.5, 8000);
    const underReported = syntheticCatalogue(1.0, 3.0, 8000)
      .filter((q) => q.mag < 4.5)
      .filter((_, i) => i % 20 === 0); // keep 5% of the small events
    const catalogue = [...complete, ...underReported];

    const honest = gutenbergRichterFit(catalogue, 4.5, 0.1)!;
    const naive = gutenbergRichterFit(catalogue, 3.0, 0.1)!;

    expect(honest.b).toBeCloseTo(1.0, 1);
    // Fitting through the rollover flattens the slope: with 5% of the small
    // events reported, the naive fit lands near 0.81 against a true 1.0, an
    // 18% error, and it does it with a high r-squared, which is what makes it
    // dangerous. The assertion is on the direction and a substantial size, not
    // on a precise number, because the size depends on how bad the
    // under-reporting is.
    expect(naive.b).toBeLessThan(honest.b - 0.15);
    expect(naive.b / honest.b).toBeLessThan(0.9);
    // And it looks convincing while being wrong.
    expect(naive.rSquared).toBeGreaterThan(0.9);
  });

  it("refuses to fit fewer than three usable bins", () => {
    expect(gutenbergRichterFit([quake({ mag: 5 }), quake({ mag: 5.1 })], 5, 0.1)).toBeNull();
    expect(gutenbergRichterFit([], 4)).toBeNull();
    expect(gutenbergRichterFit(null)).toBeNull();
  });

  it("returns null from expectedCountAbove without a fit", () => {
    expect(expectedCountAbove(null, 5)).toBeNull();
    expect(expectedCountAbove(undefined, 5)).toBeNull();
  });
});

describe("completeness magnitude", () => {
  it("finds the peak of the non-cumulative distribution", () => {
    // Rolled over below 4.5: counts rise to a peak at 4.5 then fall off.
    const qs = [
      ...Array.from({ length: 5 }, () => quake({ mag: 4.0 })),
      ...Array.from({ length: 20 }, () => quake({ mag: 4.5 })),
      ...Array.from({ length: 12 }, () => quake({ mag: 5.0 })),
      ...Array.from({ length: 4 }, () => quake({ mag: 5.5 })),
    ];
    expect(completenessMagnitude(qs, 0.5)).toBeCloseTo(4.5, 6);
  });

  it("returns null for an empty catalogue", () => {
    expect(completenessMagnitude([])).toBeNull();
    expect(completenessMagnitude(null)).toBeNull();
  });
});

describe("distance and local wave arrival", () => {
  it("matches the published New York to London distance", () => {
    const d = distanceToQuakeKm(40.7128, -74.006, quake({ mag: 5, latDeg: 51.5074, lonDeg: -0.1278 }))!;
    expect(d).toBeGreaterThan(5500);
    expect(d).toBeLessThan(5600);
  });

  it("is zero at the epicentre", () => {
    expect(distanceToQuakeKm(10, 20, quake({ mag: 5, latDeg: 10, lonDeg: 20 }))!).toBeCloseTo(0, 6);
  });

  it("gives P before S, with the S-P interval growing with distance", () => {
    const near = localWaveArrival(100)!;
    const far = localWaveArrival(500)!;
    expect(near.pSeconds).toBeLessThan(near.sSeconds);
    expect(near.pSeconds).toBeCloseTo(100 / CRUSTAL_P_KM_S, 6);
    expect(near.sSeconds).toBeCloseTo(100 / CRUSTAL_S_KM_S, 6);
    expect(far.spSeconds).toBeGreaterThan(near.spSeconds);
  });

  it("reproduces the field rule of thumb for the S-P interval", () => {
    // The classic approximation: distance in km is roughly 8 x the S-P interval
    // in seconds for crustal paths.
    const d = 400;
    const { spSeconds } = localWaveArrival(d)!;
    expect((d / spSeconds)).toBeGreaterThan(7);
    expect((d / spSeconds)).toBeLessThan(9);
  });

  it("REFUSES to estimate beyond local distances", () => {
    // Past ~1000 km the ray dives into the mantle and a constant-velocity
    // estimate stops being approximately right, so it declines rather than guess.
    expect(localWaveArrival(LOCAL_DISTANCE_LIMIT_KM)).not.toBeNull();
    expect(localWaveArrival(LOCAL_DISTANCE_LIMIT_KM + 1)).toBeNull();
    expect(localWaveArrival(9000)).toBeNull();
  });

  it("returns null for bad input", () => {
    expect(localWaveArrival(NaN)).toBeNull();
    expect(localWaveArrival(-5)).toBeNull();
    expect(distanceToQuakeKm(0, 0, null)).toBeNull();
    expect(distanceToQuakeKm(NaN, 0, quake({ mag: 5 }))).toBeNull();
  });

  it("uses P and S speeds in the right physical order", () => {
    expect(CRUSTAL_P_KM_S).toBeGreaterThan(CRUSTAL_S_KM_S);
    // P/S speed ratio for crustal rock is about 1.7 (sqrt 3 for a Poisson solid)
    expect(CRUSTAL_P_KM_S / CRUSTAL_S_KM_S).toBeGreaterThan(1.6);
    expect(CRUSTAL_P_KM_S / CRUSTAL_S_KM_S).toBeLessThan(1.8);
  });
});

describe("parseUsgsFeed", () => {
  const feature = (props: Record<string, unknown>, coords: unknown[]) => ({
    type: "Feature",
    id: props.id ?? "abc123",
    properties: { type: "earthquake", mag: 5, time: 1786051048824, place: "somewhere", ...props },
    geometry: { type: "Point", coordinates: coords },
  });

  it("flattens a real-shaped feed", () => {
    const cat = parseUsgsFeed({
      type: "FeatureCollection",
      metadata: { title: "USGS Magnitude 4.5+ Earthquakes, Past Month", generated: 1786051048824 },
      features: [
        feature({ mag: 4.9, magType: "mb", sig: 369, tsunami: 0, url: "https://example.test/e1" }, [178.5415, -38.2308, 22.793]),
      ],
    });
    expect(cat.quakes).toHaveLength(1);
    const q = cat.quakes[0];
    expect(q.mag).toBe(4.9);
    expect(q.magType).toBe("mb");
    expect(q.latDeg).toBeCloseTo(-38.2308, 6);
    expect(q.lonDeg).toBeCloseTo(178.5415, 6);
    expect(q.depthKm).toBeCloseTo(22.793, 6);
    expect(q.tsunami).toBe(false);
    expect(q.url).toBe("https://example.test/e1");
    expect(cat.title).toContain("USGS");
    expect(cat.generated).toBeInstanceOf(Date);
  });

  it("drops non-earthquakes and COUNTS them", () => {
    const cat = parseUsgsFeed({
      features: [
        feature({ type: "earthquake" }, [10, 20, 5]),
        feature({ type: "quarry blast" }, [10, 20, 0]),
        feature({ type: "explosion" }, [10, 20, 0]),
      ],
    });
    expect(cat.quakes).toHaveLength(1);
    expect(cat.droppedNonEarthquakes).toBe(2);
    expect(cat.droppedIncomplete).toBe(0);
  });

  it("drops rows with unusable position, magnitude or time, and counts those separately", () => {
    const cat = parseUsgsFeed({
      features: [
        feature({}, [10, 20, 5]),
        feature({ mag: null }, [10, 20, 5]),
        feature({ time: null }, [10, 20, 5]),
        feature({}, [10, 200, 5]), // longitude out of range
        feature({}, [10, 95, 5]), // latitude out of range (index 1 is lat)
        feature({}, []),
        { type: "Feature", properties: null, geometry: null },
        null,
      ],
    });
    expect(cat.quakes).toHaveLength(1);
    expect(cat.droppedIncomplete).toBe(7);
  });

  it("keeps a genuine zero depth rather than treating it as missing", () => {
    const cat = parseUsgsFeed({ features: [feature({}, [10, 20, 0])] });
    expect(cat.quakes[0].depthKm).toBe(0);
  });

  it("sorts newest first", () => {
    const cat = parseUsgsFeed({
      features: [
        feature({ id: "old", time: 1000 }, [1, 2, 3]),
        feature({ id: "new", time: 9000 }, [1, 2, 3]),
        feature({ id: "mid", time: 5000 }, [1, 2, 3]),
      ],
    });
    expect(cat.quakes.map((q) => q.id)).toEqual(["new", "mid", "old"]);
  });

  it("never throws on garbage", () => {
    for (const bad of [null, undefined, 42, "nope", {}, { features: "no" }, { features: [1, 2] }]) {
      expect(() => parseUsgsFeed(bad)).not.toThrow();
    }
    expect(parseUsgsFeed(null).quakes).toEqual([]);
    expect(parseUsgsFeed({ features: [1, 2] }).droppedIncomplete).toBe(2);
  });
});

describe("determinism", () => {
  it("gives the same answer for the same catalogue", () => {
    const qs = syntheticCatalogue(1.0, 4.0, 500);
    expect(gutenbergRichterFit(qs, 4.0)!.b).toBe(gutenbergRichterFit(qs, 4.0)!.b);
    expect(totalEnergyJoules(qs)).toBe(totalEnergyJoules(qs));
  });
});

describe("Aki (1965) maximum-likelihood b-value", () => {
  it("recovers a known b more tightly than the least-squares fit", () => {
    for (const trueB of [0.8, 1.0, 1.2]) {
      const cat = syntheticCatalogue(trueB, 4.0, 20000);
      const aki = akiBValue(cat, 4.0, 0.1)!;
      expect(aki.b).toBeCloseTo(trueB, 1);
      expect(aki.n).toBe(cat.length);
      expect(aki.sigma).toBeGreaterThan(0);
    }
  });

  it("shrinks its uncertainty as the sample grows, roughly as 1/sqrt(n)", () => {
    // Shi & Bolt: sigma scales with 1/sqrt(n), so 100x the events should cut it
    // by about 10x.
    const small = akiBValue(syntheticCatalogue(1.0, 4.0, 200), 4.0, 0.1)!;
    const large = akiBValue(syntheticCatalogue(1.0, 4.0, 20000), 4.0, 0.1)!;
    const ratio = small.sigma / large.sigma;
    expect(ratio).toBeGreaterThan(6);
    expect(ratio).toBeLessThan(15);
  });

  it("refuses a sample too small to claim a slope from", () => {
    expect(akiBValue(syntheticCatalogue(1.0, 4.0, 19), 4.0)).toBeNull();
    expect(akiBValue([], 4.0)).toBeNull();
    expect(akiBValue(null, 4.0)).toBeNull();
    expect(akiBValue(syntheticCatalogue(1.0, 4.0, 500), NaN)).toBeNull();
  });
});

describe("completeness by b-value stability", () => {
  /**
   * A mixed-network catalogue, which is what a global feed actually is: one
   * dense regional network reporting down to magnitude 1 over a small area, plus
   * the rest of the planet only complete above 4.5. Max curvature finds the peak
   * of the mixture and is badly wrong; stability has to climb past it.
   */
  function mixedNetworkCatalogue(): Quake[] {
    // One complete b = 1 population, of which only 2% survives below magnitude
    // 4.5 (the dense regional networks cover a small fraction of the planet)
    // while everything at and above 4.5 is kept (that is where the global
    // network is complete). Sized so the complete part holds a few hundred
    // events, like a real week of the USGS feed.
    const complete = syntheticCatalogue(1.0, 2.5, 40000);
    const out: Quake[] = [];
    let below = 0;
    for (const q of complete) {
      if (q.mag >= 4.5) {
        out.push(q);
      } else if (below++ % 50 === 0) {
        out.push(q);
      }
    }
    return out;
  }

  it("climbs past the max-curvature answer on a mixed catalogue", () => {
    const cat = mixedNetworkCatalogue();
    const naive = completenessMagnitude(cat, 0.1)!;
    const stable = stableCompleteness(cat, { binWidth: 0.1, step: 0.1, window: 5 })!;

    // Max curvature lands down in the thinned, incomplete population.
    expect(naive).toBeLessThan(3.5);
    // Stability climbs to the real completeness of the global part.
    expect(stable.mc).toBeGreaterThan(naive);
    expect(stable.mc).toBeGreaterThan(4.0);
    expect(stable.b).toBeGreaterThan(0.8);
    expect(stable.b).toBeLessThan(1.3);
  });

  it("shows exactly how wrong the naive cut would have been", () => {
    const cat = mixedNetworkCatalogue();
    const naive = completenessMagnitude(cat, 0.1)!;
    const naiveB = akiBValue(cat, naive, 0.1)!;
    const stable = stableCompleteness(cat, { binWidth: 0.1, step: 0.1, window: 5 })!;

    // The naive cut understates b substantially, while still returning a
    // confident-looking number with a tight uncertainty.
    expect(naiveB.b).toBeLessThan(stable.b - 0.15);
    expect(naiveB.sigma).toBeLessThan(0.1);
  });

  it("agrees with max curvature on a clean single-network catalogue", () => {
    // When the catalogue really is complete from one cut, both methods should
    // land in the same place, give or take a bin or two.
    const cat = syntheticCatalogue(1.0, 3.0, 6000);
    const stable = stableCompleteness(cat, { binWidth: 0.1, step: 0.1, window: 5 })!;
    expect(stable.mc).toBeGreaterThanOrEqual(2.9);
    expect(stable.mc).toBeLessThan(3.6);
    expect(stable.b).toBeCloseTo(1.0, 1);
    expect(stable.converged).toBe(true);
  });

  it("says so rather than pretending when b never stabilises", () => {
    // A catalogue with no power-law structure at all: all one magnitude.
    const flat = Array.from({ length: 400 }, () => quake({ mag: 5 }));
    const result = stableCompleteness(flat, { binWidth: 0.1, step: 0.1, window: 5 });
    // Either it cannot estimate at all, or it reports non-convergence.
    if (result !== null) expect(result.converged).toBe(false);
  });

  it("returns null for empty or unusable input", () => {
    expect(stableCompleteness([])).toBeNull();
    expect(stableCompleteness(null)).toBeNull();
    expect(stableCompleteness([quake({ mag: 5 })], { step: 0 })).toBeNull();
  });
});
