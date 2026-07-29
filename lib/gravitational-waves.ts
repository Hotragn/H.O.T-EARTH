import { C, G, MSUN_KG, PC_M } from "./black-holes";

/**
 * Gravitational waves: the real LIGO / Virgo / KAGRA detections.
 *
 * Every event value comes from the published GWOSC catalogs (GWTC-1 through
 * GWTC-5), shipped at public/data/gravitational-waves/gwtc.json. Nothing here
 * invents a detection or a parameter. What this module computes are the standard
 * closed-form relations of the inspiral, from those measured masses:
 *
 *  - the chirp mass, the single combination the waveform actually encodes
 *  - the merger frequency (from the Schwarzschild ISCO)
 *  - the leading-order (Newtonian / quadrupole) frequency sweep f(t)
 *  - the strain amplitude at Earth
 *  - the energy radiated as gravitational waves
 *
 * These are leading-order results. Real parameter estimation uses full numerical
 * relativity and post-Newtonian waveforms; the docs state the bounds. Same
 * null-safety contract as the other libs: bad input returns null, never throws.
 *
 * Constants (G, C, MSUN_KG, PC_M) are reused from lib/black-holes so every module
 * shares one set of values.
 */

/** One detection, as published. Masses are source-frame solar masses. */
export interface GwEvent {
  name: string;
  /** Which GWTC catalog release this entry came from. */
  catalog: string;
  /** GPS time of the event. */
  gps: number;
  /** Primary mass, with 90% credible offsets (lower is negative). */
  m1: number;
  m1lo: number | null;
  m1hi: number | null;
  /** Secondary mass. */
  m2: number;
  m2lo: number | null;
  m2hi: number | null;
  mchirp: number | null;
  mtotal: number | null;
  /** Remnant mass, where published (absent for most neutron-star mergers). */
  mfinal: number | null;
  /** Remnant dimensionless spin, where published. */
  afinal: number | null;
  chiEff: number | null;
  /** Luminosity distance in Mpc. */
  dl: number;
  dlLo: number | null;
  dlHi: number | null;
  z: number | null;
  /** Network matched-filter signal-to-noise ratio. */
  snr: number | null;
}

export interface GwCatalog {
  meta: {
    source: string;
    url: string;
    catalogs: string[];
    credit: string;
    license: string;
    retrieved: string;
    count: number;
    note: string;
  };
  events: GwEvent[];
}

/** Megaparsec in metres. */
export const MPC_M = 1e6 * PC_M;

/**
 * Merger classification thresholds, in solar masses.
 *
 * These are conventions, not laws of nature: the maximum neutron-star mass is
 * an open question (roughly 2.0-2.3 Msun from observation and equation-of-state
 * work), and the "mass gap" between the heaviest neutron stars and the lightest
 * black holes is exactly what events like GW190814 and GW230529 probe. We use a
 * documented 3 Msun dividing line and label anything ambiguous honestly.
 */
export const NS_MAX_MSUN = 3;

/**
 * The contested "lower mass gap", in solar masses. Between roughly 2 and 5 Msun
 * it is genuinely unsettled whether an object is the heaviest kind of neutron
 * star or the lightest kind of black hole, and few objects were known here at
 * all until events like GW190814 (2.6 Msun) and GW230529 (3.6 Msun). Anything
 * with a component in this range is reported as ambiguous rather than asserted.
 */
export const MASS_GAP_LO_MSUN = 2;
export const MASS_GAP_HI_MSUN = 5;

export type MergerClass = "BBH" | "BNS" | "NSBH";

/**
 * Classify a merger from its component masses using the NS_MAX_MSUN
 * convention. Returns null for non-finite or non-positive input.
 *
 * Honesty note: a component near the threshold may be either a heavy neutron
 * star or a light black hole; `ambiguous` flags that so the UI can say so
 * rather than asserting.
 */
export function classifyMerger(
  m1: number,
  m2: number,
): { type: MergerClass; ambiguous: boolean } | null {
  if (!isFinite(m1) || !isFinite(m2) || m1 <= 0 || m2 <= 0) return null;
  const heavy = Math.max(m1, m2);
  const light = Math.min(m1, m2);
  const isNs = (m: number) => m < NS_MAX_MSUN;
  const type: MergerClass = isNs(heavy)
    ? "BNS"
    : isNs(light)
      ? "NSBH"
      : "BBH";
  // Ambiguous when either component lands in the contested lower mass gap.
  const inGap = (m: number) =>
    m >= MASS_GAP_LO_MSUN && m <= MASS_GAP_HI_MSUN;
  return { type, ambiguous: inGap(heavy) || inGap(light) };
}

/**
 * Chirp mass: Mc = (m1 m2)^(3/5) / (m1 + m2)^(1/5).
 *
 * This is the combination that governs the leading-order inspiral, and it is
 * what a detection measures most precisely. Returns null on bad input.
 */
export function chirpMass(m1: number, m2: number): number | null {
  if (!isFinite(m1) || !isFinite(m2) || m1 <= 0 || m2 <= 0) return null;
  return Math.pow(m1 * m2, 3 / 5) / Math.pow(m1 + m2, 1 / 5);
}

/** Mass ratio q = m2/m1 <= 1. Returns null on bad input. */
export function massRatio(m1: number, m2: number): number | null {
  if (!isFinite(m1) || !isFinite(m2) || m1 <= 0 || m2 <= 0) return null;
  const hi = Math.max(m1, m2);
  const lo = Math.min(m1, m2);
  return lo / hi;
}

/**
 * Gravitational-wave frequency at the innermost stable circular orbit of a
 * Schwarzschild black hole of the system's total mass, in hertz.
 *
 * f_GW = 2 f_orbital = c^3 / (6^(3/2) pi G M).
 *
 * This is the standard stand-in for "merger frequency". It is an approximation:
 * it ignores spin and the finite mass ratio, and the true peak is found from
 * numerical relativity. Returns null on bad input.
 */
export function mergerFrequencyHz(totalMassMsun: number): number | null {
  if (!isFinite(totalMassMsun) || totalMassMsun <= 0) return null;
  const m = totalMassMsun * MSUN_KG;
  return Math.pow(C, 3) / (Math.pow(6, 1.5) * Math.PI * G * m);
}

/**
 * Ringdown frequency of the remnant black hole: the dominant (l = m = 2)
 * quasi-normal mode, in hertz, from the standard Echeverria / Berti fit
 *
 *   f = (c^3 / (2 pi G M_f)) * [ 1 - 0.63 (1 - a)^0.3 ]
 *
 * where `a` is the remnant's dimensionless spin. This is the note the new black
 * hole rings at as it settles, and it is the honest high end of the signal:
 * for GW150914 (M_f = 61.5, a = 0.69) it gives about 290 Hz, matching the
 * published peak, whereas the Schwarzschild ISCO estimate lands near 68 Hz.
 *
 * Returns null when the remnant parameters are unknown (as for most
 * neutron-star mergers) or unphysical.
 */
export function ringdownFrequencyHz(
  finalMassMsun: number | null,
  finalSpin: number | null,
): number | null {
  if (
    finalMassMsun == null ||
    finalSpin == null ||
    !isFinite(finalMassMsun) ||
    !isFinite(finalSpin) ||
    finalMassMsun <= 0 ||
    finalSpin < 0 ||
    finalSpin >= 1
  ) {
    return null;
  }
  const m = finalMassMsun * MSUN_KG;
  const base = Math.pow(C, 3) / (2 * Math.PI * G * m);
  return base * (1 - 0.63 * Math.pow(1 - finalSpin, 0.3));
}

/**
 * Symmetric mass ratio eta = m1 m2 / (m1 + m2)^2, which is 0.25 for equal
 * masses and tends to 0 for extreme ratios. Returns null on bad input.
 */
export function symmetricMassRatio(m1: number, m2: number): number | null {
  if (!isFinite(m1) || !isFinite(m2) || m1 <= 0 || m2 <= 0) return null;
  const t = m1 + m2;
  return (m1 * m2) / (t * t);
}

/**
 * Remnant spin estimated from the mass ratio alone, using the Rezzolla et al.
 * (2008) fit for binaries with **non-spinning** components:
 *
 *   a_f = 2 sqrt(3) eta - 3.871 eta^2 + 4.028 eta^3
 *
 * For equal masses this gives 0.686, the well-known numerical-relativity value.
 *
 * Why this exists: the GWOSC summary catalogue publishes remnant *masses* but no
 * remnant spins, so without an estimate the ringdown note could never be shown
 * for a real event. This is explicitly an approximation, and callers must label
 * it as estimated. It is most trustworthy when the measured effective spin
 * (`chi_eff`) is near zero, which is why the UI shows chi_eff alongside it.
 */
export function estimatedRemnantSpin(m1: number, m2: number): number | null {
  const eta = symmetricMassRatio(m1, m2);
  if (eta == null) return null;
  const a =
    2 * Math.sqrt(3) * eta - 3.871 * eta * eta + 4.028 * eta * eta * eta;
  if (!isFinite(a) || a <= 0 || a >= 1) return null;
  return a;
}

/**
 * The ringdown note for an event, preferring a published remnant spin and
 * falling back to the non-spinning estimate above.
 *
 * `estimated` tells the caller which happened, so the UI can say "estimated"
 * rather than presenting a derived number as a measurement. Returns null when
 * there is no remnant mass to work from.
 */
export function eventRingdown(
  event: Pick<GwEvent, "m1" | "m2" | "mfinal" | "afinal">,
): { hz: number; spin: number; estimated: boolean } | null {
  if (event.mfinal == null) return null;
  const published = event.afinal;
  const spin = published ?? estimatedRemnantSpin(event.m1, event.m2);
  if (spin == null) return null;
  const hz = ringdownFrequencyHz(event.mfinal, spin);
  if (hz == null) return null;
  return { hz, spin, estimated: published == null };
}

/**
 * Time remaining until merger from a given GW frequency, in seconds
 * (leading-order quadrupole result):
 *
 *   t = (5 / 256) c^5 / ( (pi f)^(8/3) (G Mc)^(5/3) )
 *
 * Returns null on bad input.
 */
export function timeToMergerS(
  chirpMassMsun: number,
  freqHz: number,
): number | null {
  if (
    !isFinite(chirpMassMsun) ||
    !isFinite(freqHz) ||
    chirpMassMsun <= 0 ||
    freqHz <= 0
  ) {
    return null;
  }
  const mc = chirpMassMsun * MSUN_KG;
  return (
    (5 / 256) *
    Math.pow(C, 5) /
    (Math.pow(Math.PI * freqHz, 8 / 3) * Math.pow(G * mc, 5 / 3))
  );
}

/**
 * The inverse: GW frequency at a time `tS` before merger, in hertz.
 *
 *   f(t) = (1 / pi) * ( (5 / 256) / t )^(3/8) * (G Mc / c^3)^(-5/8)
 *
 * This is the "chirp": frequency sweeping up as the binary tightens. Used to
 * draw the waveform and to drive the (real-frequency) sonification.
 */
export function frequencyAtTimeHz(
  chirpMassMsun: number,
  tS: number,
): number | null {
  if (!isFinite(chirpMassMsun) || !isFinite(tS) || chirpMassMsun <= 0 || tS <= 0) {
    return null;
  }
  const mc = (G * chirpMassMsun * MSUN_KG) / Math.pow(C, 3); // seconds
  return (1 / Math.PI) * Math.pow(5 / (256 * tS), 3 / 8) * Math.pow(mc, -5 / 8);
}

/**
 * Peak strain amplitude at Earth (order-of-magnitude, quadrupole):
 *
 *   h ~ (4 / D) (G Mc / c^2)^(5/3) (pi f / c)^(2/3)
 *
 * Strain is dimensionless: the fractional change in length. For real events it
 * is ~1e-21, which is why the detectors measure a fraction of a proton width
 * over kilometres. This omits the inclination and antenna-pattern factors, so
 * treat it as the scale, not the measured value. Returns null on bad input.
 */
export function strainAmplitude(
  chirpMassMsun: number,
  distanceMpc: number,
  freqHz: number,
): number | null {
  if (
    !isFinite(chirpMassMsun) ||
    !isFinite(distanceMpc) ||
    !isFinite(freqHz) ||
    chirpMassMsun <= 0 ||
    distanceMpc <= 0 ||
    freqHz <= 0
  ) {
    return null;
  }
  const mc = chirpMassMsun * MSUN_KG;
  const d = distanceMpc * MPC_M;
  const geometricMass = (G * mc) / (C * C); // metres
  return (
    (4 / d) *
    Math.pow(geometricMass, 5 / 3) *
    Math.pow((Math.PI * freqHz) / C, 2 / 3)
  );
}

/**
 * Energy radiated as gravitational waves, in solar masses and in joules:
 * the difference between the total initial mass and the remnant mass.
 *
 * Returns null when the catalog has no remnant mass (true for most neutron-star
 * mergers, where the remnant is not a simple black hole).
 */
export function energyRadiated(
  totalMassMsun: number | null,
  finalMassMsun: number | null,
): { msun: number; joules: number } | null {
  if (
    totalMassMsun == null ||
    finalMassMsun == null ||
    !isFinite(totalMassMsun) ||
    !isFinite(finalMassMsun)
  ) {
    return null;
  }
  const msun = totalMassMsun - finalMassMsun;
  if (msun <= 0) return null;
  return { msun, joules: msun * MSUN_KG * C * C };
}

/**
 * Light-travel time from the source, in years, from the luminosity distance.
 *
 * Honest caveat: at these redshifts luminosity distance and light-travel
 * distance are not the same thing. This is the naive D/c reading, which is fine
 * for the nearby events and increasingly wrong for the distant ones; the UI
 * labels it as approximate and the docs give the bound.
 */
export function lightTravelYears(distanceMpc: number): number | null {
  if (!isFinite(distanceMpc) || distanceMpc <= 0) return null;
  const seconds = (distanceMpc * MPC_M) / C;
  return seconds / (365.25 * 24 * 3600);
}

/**
 * Sample the chirp for plotting: frequency and strain from `fromHz` up to the
 * merger frequency, `steps` points, spaced evenly in time-to-merger so the
 * sweep looks like the real thing (slow, then a rush at the end).
 *
 * Returns [] on bad input (never throws).
 */
export function chirpTrack(
  event: Pick<GwEvent, "m1" | "m2" | "mchirp" | "mtotal" | "dl">,
  fromHz = 20,
  steps = 220,
): Array<{ tS: number; freqHz: number; strain: number }> {
  const mc = event.mchirp ?? chirpMass(event.m1, event.m2);
  const mt = event.mtotal ?? event.m1 + event.m2;
  if (mc == null || !isFinite(mt) || mt <= 0 || steps < 2) return [];
  const fMerge = mergerFrequencyHz(mt);
  const tStart = timeToMergerS(mc, fromHz);
  if (fMerge == null || tStart == null || fMerge <= fromHz) return [];
  const tEnd = timeToMergerS(mc, fMerge) ?? 0;

  const out: Array<{ tS: number; freqHz: number; strain: number }> = [];
  for (let i = 0; i < steps; i++) {
    const frac = i / (steps - 1);
    // Ease toward the merger so the late, fast sweep is well sampled.
    const tS = tStart - (tStart - tEnd) * Math.pow(frac, 0.6);
    const f = frequencyAtTimeHz(mc, Math.max(tS, tEnd));
    if (f == null) continue;
    const h = strainAmplitude(mc, event.dl, f) ?? 0;
    out.push({ tS: Math.max(tS, 0), freqHz: Math.min(f, fMerge), strain: h });
  }
  return out;
}

/**
 * Whether the merger's frequency sweep lands in the range of human hearing.
 *
 * This is a real and slightly astonishing fact rather than a gimmick: for
 * stellar-mass binaries the gravitational-wave frequency passes through tens to
 * hundreds of hertz in the final second, so playing it at its true frequency is
 * audible with no pitch shifting at all. Heavier systems merge below the
 * comfortable range, so the UI says when it has to shift.
 */
export function audibleRange(
  event: Pick<GwEvent, "m1" | "m2" | "mchirp" | "mtotal"> &
    Partial<Pick<GwEvent, "mfinal" | "afinal">>,
): {
  fromHz: number;
  /** Top of the signal: the ringdown note when known, else the ISCO estimate. */
  toHz: number;
  /** True when `toHz` came from the remnant's ringdown rather than ISCO. */
  fromRingdown: boolean;
  audible: boolean;
} | null {
  const mt = event.mtotal ?? event.m1 + event.m2;
  const isco = mergerFrequencyHz(mt);
  if (isco == null) return null;
  const ring = eventRingdown({
    m1: event.m1,
    m2: event.m2,
    mfinal: event.mfinal ?? null,
    afinal: event.afinal ?? null,
  });
  const toHz = ring?.hz ?? isco;
  const fromHz = 20;
  // Audible if the top of the sweep clears a comfortably hearable floor.
  return { fromHz, toHz, fromRingdown: ring != null, audible: toHz >= 40 };
}

/** Load and lightly validate a catalog payload. Returns null if unusable. */
export function parseCatalog(json: unknown): GwCatalog | null {
  const doc = json as GwCatalog | null;
  if (!doc || !doc.meta || !Array.isArray(doc.events)) return null;
  const events = doc.events.filter(
    (e) =>
      e &&
      typeof e.name === "string" &&
      isFinite(e.m1) &&
      isFinite(e.m2) &&
      isFinite(e.dl),
  );
  if (events.length === 0) return null;
  return { meta: doc.meta, events };
}

/** Events sorted by a chosen key, descending. Pure; returns a new array. */
export function sortEvents(
  events: GwEvent[],
  key: "gps" | "mtotal" | "dl" | "snr",
): GwEvent[] {
  return [...events].sort((a, b) => {
    const av = (a[key] ?? -Infinity) as number;
    const bv = (b[key] ?? -Infinity) as number;
    return bv - av;
  });
}

/** Group the catalog by merger class, for the summary panel. */
export function countByClass(
  events: GwEvent[],
): Record<MergerClass, number> {
  const out: Record<MergerClass, number> = { BBH: 0, BNS: 0, NSBH: 0 };
  for (const e of events) {
    const c = classifyMerger(e.m1, e.m2);
    if (c) out[c.type] += 1;
  }
  return out;
}
