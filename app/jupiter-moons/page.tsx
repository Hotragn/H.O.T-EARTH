import type { Metadata } from "next";
import JupiterMoonsShell from "@/components/jupiter-moons/JupiterMoonsShell";

export const metadata: Metadata = {
  title: "Jupiter's Moons · H.O.T Earth",
  description:
    "The four Galilean moons of Jupiter (Io, Europa, Ganymede, Callisto) in live apparent positions, with transits, shadow transits, occultations and eclipses computed client-side from Meeus, Astronomical Algorithms Ch. 44 (the low-accuracy method). A telescope plane-of-sky view shows the oblate disk with the moons at their real (x, y) offsets and a black shadow dot during a shadow transit; a time scrubber with play, pause and speed lets you watch a shadow cross the disk. An events panel lists the upcoming phenomena in local time, and Jupiter's altitude and azimuth tell you whether it is above your horizon. Positions and event times are computed (good to about a minute for transits and occultations, a few minutes for eclipses and shadow transits near quadrature); cross-check JPL Horizons for critical timing. Textures are reused public-domain NASA/JPL/SSI and USGS spacecraft maps. No API keys, no runtime fetch.",
};

export default function JupiterMoonsPage() {
  return <JupiterMoonsShell />;
}
