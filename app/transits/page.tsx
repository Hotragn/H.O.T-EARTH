import type { Metadata } from "next";
import TransitsShell from "@/components/transits/TransitsShell";

export const metadata: Metadata = {
  title: "Transits · H.O.T Earth",
  description:
    "How we know most of those exoplanets are there. When a planet crosses its star the star dims by the ratio of their disc areas, and this tab shows that measurement for the 75 transit-discovered planets in the NASA Exoplanet Archive subset already shipped for the Exoplanets tab, adding no new data. lib/transits computes depth, the radius ratio, the central transit duration and the geometric transit probability in 35 unit tests against textbook and published values: 84 ppm for Earth across the Sun, about 1.1% for Jupiter, 1.4% and 3.1 hours for HD 209458 b, 0.74% and 36 minutes for TRAPPIST-1 b. The load-bearing honesty point is that a transit measures Rp/Rs and nothing else, so a planet's absolute size inherits its star's radius error one-for-one and depth says nothing about mass. The light curve's depth and width are computed from measured values while its flat-bottomed shape is schematic, because limb darkening is not modelled. Planets found by radial velocity or imaging are excluded rather than drawn with an invented transit. No API keys.",
};

export default function TransitsPage() {
  return <TransitsShell />;
}
