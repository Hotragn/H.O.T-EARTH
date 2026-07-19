import type { Metadata } from "next";
import SaturnMoonsShell from "@/components/saturn-moons/SaturnMoonsShell";

export const metadata: Metadata = {
  title: "Saturn's Moons · H.O.T Earth",
  description:
    "Saturn's seven major moons (Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus) strung along the tilted rings, in live apparent positions computed client-side from Kepler propagation of JPL SSD SAT441 mean elements and Saturn's IAU pole, with the ring-opening geometry (B, B', P) from Meeus, Astronomical Algorithms Ch. 45. A telescope plane-of-sky view shows Saturn's oblate disk and the real ring annulus tilted to the true opening, with the moons at their apparent (x, y). Transits, shadow transits, occultations and eclipses cluster only in the season around each ring-plane crossing (the last was 2025-05-06, the next about 2038-2039), which the tab states plainly. Event windows come from a coarse client-side scan, labeled approximate (mean-element accuracy, Iapetus least accurate); cross-check JPL Horizons or IMCCE PHESAT. Textures: Saturn and rings by Solar System Scope (CC BY 4.0, credited); the seven moon maps are public-domain NASA/JPL/USGS Cassini imagery (Titan is near-IR/haze). No API keys, no runtime fetch.",
};

export default function SaturnMoonsPage() {
  return <SaturnMoonsShell />;
}
