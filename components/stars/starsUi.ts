import type { LuminosityClass } from "@/lib/stars";

/** Presentation helpers for the Stars tab. Pure formatting only. */

/** Harvard spectral classes, hot to cool, with an approximate visual colour. */
export const CLASS_COLOR: Record<string, string> = {
  O: "#9bb8ff",
  B: "#bcd0ff",
  A: "#eaf0ff",
  F: "#fff8e8",
  G: "#ffe9a8",
  K: "#ffc169",
  M: "#ff8d5c",
};

export const LCLASS_LABEL: Record<LuminosityClass, string> = {
  "main-sequence": "Main sequence",
  subgiant: "Subgiant",
  giant: "Giant",
  supergiant: "Supergiant",
  "white-dwarf": "White dwarf",
};

export const LCLASS_NOTE: Record<LuminosityClass, string> = {
  "main-sequence":
    "Fusing hydrogen into helium in its core, which is where a star spends most of its life.",
  subgiant:
    "Sits just above the main sequence: core hydrogen is running out and the star is beginning to swell.",
  giant:
    "Core hydrogen is exhausted. The star has expanded and cooled at the surface while growing far more luminous.",
  supergiant:
    "Among the most luminous stars known, and short-lived. These are the ones that end as supernovae.",
  "white-dwarf":
    "The exposed, Earth-sized core left behind by a dying low-mass star, hot but tiny and so very faint.",
};

/**
 * An approximate visual colour for a blackbody at this temperature.
 *
 * Illustrative, not a calibrated colour transform: it exists so the diagram reads
 * at a glance, and it is interpolated between the Harvard class colours above.
 */
export function colorForTemperature(k: number): string {
  const stops: Array<[number, string]> = [
    [30000, CLASS_COLOR.O],
    [10000, CLASS_COLOR.B],
    [7500, CLASS_COLOR.A],
    [6000, CLASS_COLOR.F],
    [5200, CLASS_COLOR.G],
    [3700, CLASS_COLOR.K],
    [2600, CLASS_COLOR.M],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [hi, cHi] = stops[i];
    const [lo, cLo] = stops[i + 1];
    if (k <= hi && k >= lo) {
      const f = (hi - k) / (hi - lo);
      return mix(cHi, cLo, f);
    }
  }
  return k > 30000 ? CLASS_COLOR.O : CLASS_COLOR.M;
}

function mix(a: string, b: string, f: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const r = Math.round(ch(pa, 16) + (ch(pb, 16) - ch(pa, 16)) * f);
  const g = Math.round(ch(pa, 8) + (ch(pb, 8) - ch(pa, 8)) * f);
  const bl = Math.round(ch(pa, 0) + (ch(pb, 0) - ch(pa, 0)) * f);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

/** "9,940 K" */
export function tempLabel(k: number | null): string {
  return k == null ? "unknown" : `${Math.round(k).toLocaleString()} K`;
}

/** Luminosity in solar units, with sane precision across a huge range. */
export function lumLabel(l: number | null): string {
  if (l == null) return "unknown";
  if (l >= 1000) return `${Math.round(l).toLocaleString()} L☉`;
  if (l >= 1) return `${l.toFixed(1)} L☉`;
  if (l >= 0.001) return `${l.toFixed(4)} L☉`;
  return `${l.toExponential(1)} L☉`;
}

export function radiusLabel(r: number | null): string {
  if (r == null) return "unknown";
  return r >= 10 ? `${Math.round(r)} R☉` : `${r.toFixed(2)} R☉`;
}

export function massLabel(m: number | null): string {
  return m == null ? "not derivable" : `${m.toFixed(2)} M☉`;
}

/** "8.4 billion years" / "12 million years". */
export function lifetimeLabel(y: number | null): string {
  if (y == null) return "not derivable";
  if (y >= 1e12) return `${(y / 1e12).toFixed(1)} trillion years`;
  if (y >= 1e9) return `${(y / 1e9).toFixed(1)} billion years`;
  if (y >= 1e6) return `${(y / 1e6).toFixed(0)} million years`;
  return `${Math.round(y).toLocaleString()} years`;
}

export function distLabel(ly: number | null): string {
  if (ly == null) return "unknown";
  return ly >= 100 ? `${Math.round(ly).toLocaleString()} ly` : `${ly.toFixed(1)} ly`;
}
