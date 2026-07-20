import type { Metadata } from "next";
import SurfacesShell from "@/components/surfaces/SurfacesShell";

export const metadata: Metadata = {
  title: "Surfaces · H.O.T Earth",
  description:
    "Stand on Mars and on Titan, the app's first ground-level view. Mars is the real tier: real MOLA terrain of Gale Crater and Mount Sharp at true meter scaling, a real Curiosity 360 panorama (sol 3509), and a live computed sun via the validated NASA GISS Mars24 machinery, with the real local time, sol, season, and the famous blue sunset regime (an artistic rendering of the cited Curiosity sol 956 phenomenon). Titan is the honest-cinematic tier: real Cassini-Huygens facts (94 K, 1.5 bar, about 0.1 percent of Earth's daylight), the one real Huygens surface photo, and Saturn fixed in the sky by tidal locking at its real 5.65 degree apparent size, drawn only from a labeled Sub-Saturn viewpoint because at the real Huygens site Saturn is below the horizon; the terrain around it is labeled illustrative. Live means live simulation, not a camera; no API keys, no runtime fetch beyond committed static assets.",
};

export default function SurfacesPage() {
  return <SurfacesShell />;
}
