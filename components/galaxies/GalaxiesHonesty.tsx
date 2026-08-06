"use client";

import {
  DEEP_FIELD_COLOUR_LABEL,
  DEEP_FIELD_LEAD_HONESTY,
  DEEP_FIELD_LOOKBACK_LABEL,
  EXPLORER_LEAD_HONESTY,
  HUBBLE_TENSION_LABEL,
  LADDER_DISTANCE_LABEL,
  LADDER_LEAD_HONESTY,
  LADDER_SIZE_LABEL,
  LEAD_HONESTY,
  MILKY_WAY_VIEW_LABEL,
  REDSHIFT_SPACE_LABEL,
  RENDER_LABEL,
  WEDGE_LABEL,
  type GalaxiesSection,
} from "./galaxiesUi";

/**
 * The honesty panel (prominent), per section. This is the load-bearing point of
 * the tab, so it has to describe the view you are actually looking at: it used
 * to show the cosmic-web caveats on all four sections, which meant the Galaxy
 * Explorer told you about a point cloud that was not on screen.
 *
 * Every string is quoted from galaxiesUi, so the panels, the docs and this cannot
 * drift apart.
 */

interface Caveat {
  /** short colour-coded lead-in */
  tag: string;
  tagClass: string;
  body: string;
}

const BY_SECTION: Record<
  GalaxiesSection,
  { lead: string; items: Caveat[] }
> = {
  "cosmic-web": {
    lead: LEAD_HONESTY,
    items: [
      {
        tag: "Redshift-space:",
        tagClass: "text-amber-200/90",
        body: REDSHIFT_SPACE_LABEL,
      },
      { tag: "A thin wedge:", tagClass: "text-sky-300/90", body: WEDGE_LABEL },
      {
        tag: "Depth scale, H0:",
        tagClass: "text-fuchsia-300/90",
        body: HUBBLE_TENSION_LABEL,
      },
      {
        tag: "Positions measured:",
        tagClass: "text-emerald-300/90",
        body: RENDER_LABEL,
      },
    ],
  },
  explorer: {
    lead: EXPLORER_LEAD_HONESTY,
    items: [
      {
        tag: "Distances:",
        tagClass: "text-amber-200/90",
        body: LADDER_DISTANCE_LABEL,
      },
      {
        tag: "Our own galaxy:",
        tagClass: "text-sky-300/90",
        body: MILKY_WAY_VIEW_LABEL,
      },
      {
        tag: "Velocities computed:",
        tagClass: "text-emerald-300/90",
        body:
          "Recession velocities are computed by lib/galaxies from the published redshift (cz) or from the distance at the adopted H0, not quoted from a catalogue. Local Group members are blueshifted and approaching, and are flagged as such.",
      },
    ],
  },
  "scale-ladder": {
    lead: LADDER_LEAD_HONESTY,
    items: [
      {
        tag: "Soft edges:",
        tagClass: "text-amber-200/90",
        body: LADDER_SIZE_LABEL,
      },
      {
        tag: "Depth scale, H0:",
        tagClass: "text-fuchsia-300/90",
        body: HUBBLE_TENSION_LABEL,
      },
      {
        tag: "Distances:",
        tagClass: "text-sky-300/90",
        body: LADDER_DISTANCE_LABEL,
      },
    ],
  },
  "deep-field": {
    lead: DEEP_FIELD_LEAD_HONESTY,
    items: [
      {
        tag: "Lookback time:",
        tagClass: "text-amber-200/90",
        body: DEEP_FIELD_LOOKBACK_LABEL,
      },
      {
        tag: "Infrared colour:",
        tagClass: "text-sky-300/90",
        body: DEEP_FIELD_COLOUR_LABEL,
      },
      {
        tag: "Lensing is real:",
        tagClass: "text-emerald-300/90",
        body:
          "The arcs and multiple images are a measured effect, not a processing artefact. The cluster's mass, most of it dark matter, bends the light of galaxies behind it, which is how the field reaches further than JWST could see unaided.",
      },
    ],
  },
};

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-t border-line/60 pt-2 first:border-t-0 first:pt-0">
      {children}
    </li>
  );
}

export default function GalaxiesHonesty({
  section,
  className = "",
}: {
  section: GalaxiesSection;
  className?: string;
}) {
  const { lead, items } = BY_SECTION[section] ?? BY_SECTION["cosmic-web"];

  return (
    <div
      className={`hud-panel rounded-2xl border border-amber-400/25 p-4 ${className}`}
    >
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-amber-200/90">
        What is real, what is computed
      </h2>

      <p className="mt-2 text-[12px] font-medium leading-snug text-ice">{lead}</p>

      <ul className="mt-3 space-y-2 text-[11px] leading-snug text-dim">
        {items.map((c) => (
          <Item key={c.tag}>
            <span className={c.tagClass}>{c.tag} </span>
            {c.body}
          </Item>
        ))}
      </ul>
    </div>
  );
}
