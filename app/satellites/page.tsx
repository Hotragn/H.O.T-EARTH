import type { Metadata } from "next";
import SatellitesShell from "@/components/satellites/SatellitesShell";

export const metadata: Metadata = {
  title: "Satellites & Debris · H.O.T Earth",
  description:
    "The real tracked catalogue in orbit: 14,186 objects across crewed stations, Starlink, OneWeb, GPS, the geostationary belt and three real fragmentation debris clouds, from CelesTrak GP element sets (US Space Force 18th SDS). 4,813 are drawn and propagated live with SGP4, the model those element sets are defined for, with Starlink evenly sampled for performance and its true tracked count shown beside the drawn count. lib/satellites derives orbit geometry with textbook two-body relations in 30 unit tests checked against real objects: the ISS at 92.9 minutes and 7.66 km/s, geostationary orbit at 42,164 km, and the solar-versus-sidereal-day subtlety that makes geostationary mean motion 1.0027. Element-set age and its expected along-track error are stated per object. No conjunction predictions, no untracked fragments, no object sizes: markers are markers, not physical scale. No API keys.",
};

export default function SatellitesPage() {
  return <SatellitesShell />;
}
