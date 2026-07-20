/**
 * Shared UI constants + honesty strings for the Interstellar page. No physics
 * here (that lives in lib/interstellar and lib/swarm); just presentation tokens
 * and the labels the honesty rules require. No em-dashes anywhere (commas /
 * parentheses only), matching the project-wide copy rule.
 */

import type { InterstellarId } from "@/lib/interstellar";

/** The tab accent (matches lib/worlds "interstellar"): a luminous cyan. */
export const INTERSTELLAR_ACCENT = "#7ad7ff";

/** The three internal sub-sections of this page (NOT the global nav). */
export type Section = "arrival" | "visitors" | "swarm";

export interface SectionDef {
  id: Section;
  label: string;
  /** one-line honest description for tooltips / aria. */
  hint: string;
}

export const SECTIONS: readonly SectionDef[] = [
  {
    id: "arrival",
    label: "Arrival",
    hint: "A skippable cinematic intro (original assets, no film material).",
  },
  {
    id: "visitors",
    label: "The Visitors",
    hint: "The three real interstellar objects on their real hyperbolic paths.",
  },
  {
    id: "swarm",
    label: "Swarm Defense",
    hint: "A live simulation of real swarm-robotics algorithms (an educational game).",
  },
] as const;

/** localStorage key remembering the user finished / skipped Arrival. */
export const ARRIVAL_SEEN_KEY = "hot-interstellar-arrival-seen";

// ─────────────────────────── per-object colours ─────────────────────────────

/** A distinct colour per interstellar object (for paths, markers, selectors). */
export const OBJECT_COLOR: Record<InterstellarId, string> = {
  "1I": "#9be7ff", // 'Oumuamua, pale cyan
  "2I": "#7effc4", // Borisov, comet green
  "3I": "#ffb27a", // ATLAS, warm amber (came from the galactic center)
};

// ─────────────────────────── honesty strings ────────────────────────────────

/**
 * The single most important label on the whole page: this is a movie-INSPIRED
 * homage built from original assets, with zero copyrighted film material.
 */
export const HOMAGE_NOTE =
  "A movie-inspired homage built from original assets. No film score or sound, " +
  "no scenes, stills, logos or dialogue, and no film robot. The guide is an " +
  "original monolith-style design; the visuals are original and procedural.";

/** Label pinned to the robot guide wherever it appears. */
export const ROBOT_NOTE = "Original design, not from any film.";

/** Accuracy caveat for the Visitors section (osculating two-body). */
export const VISITORS_ACCURACY_NOTE =
  "Real osculating two-body hyperbolae from cited JPL SBDB / MPC elements. No " +
  "planetary perturbations and no non-gravitational (outgassing) forces are " +
  "modeled; 1I/'Oumuamua's measured non-gravitational acceleration is real but " +
  "not modeled here. For a precise ephemeris, cross-check JPL Horizons.";

/** The NASA public-domain audio credit (shown wherever audio is exposed). */
export const AUDIO_CREDIT =
  "NASA / JPL-Caltech, Voyager Plasma Wave Science instrument (University of Iowa)";

/** The public-domain audio file (committed in this repo). */
export const AUDIO_SRC = "/audio/interstellar-plasma-voyager.mp3";

/** Docs base for the two shipped source docs. */
export const DOCS_BASE = "https://github.com/Hotragn/H.O.T-EARTH/blob/main/docs";
