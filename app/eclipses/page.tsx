import type { Metadata } from "next";
import EclipsesShell from "@/components/eclipses/EclipsesShell";

export const metadata: Metadata = {
  title: "Eclipses · H.O.T Earth",
  description:
    "Every solar and lunar eclipse from 2001 to 2100: 224 solar (67 of them total) and 228 lunar, from NASA's Five Millennium Canon of Solar and Lunar Eclipses by Fred Espenak and Jean Meeus. This tab ships the published catalogue rather than predicting eclipses, because doing that properly needs Besselian elements and per-observer local circumstances and a naive version would be confidently wrong. lib/eclipses computes only what follows unambiguously, in 27 unit tests against famous eclipses: which eclipse is next, saros grouping whose mean spacing recovers the 6585.3-day saros from the data itself, centrality from the tabulated gamma, and durations (2m40s for 2017, 4m28s for 2024, 6m23s for 2027). Times are Terrestrial Dynamical Time as tabulated, about 75 seconds ahead of civil time, and labelled as such. No eclipse paths and no visibility calculation: the globe marks the single published greatest-eclipse point, and the distance helper is captioned as not being a visibility answer. No API keys.",
};

export default function EclipsesPage() {
  return <EclipsesShell />;
}
