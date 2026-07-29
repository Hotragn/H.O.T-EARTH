import type { Metadata } from "next";
import WelcomeShell from "@/components/welcome/WelcomeShell";

export const metadata: Metadata = {
  title: "Enter the universe · H.O.T Earth",
  description:
    "A guided way in to H.O.T Earth's twenty-six worlds: launch with the rocket, then travel out through Earth, the Solar System and Beyond. Each stop renders a real shipped dataset in 3D (NASA Blue Marble, USGS MOLA elevation for Mars, ESA/Hubble's Andromeda under CC BY 4.0) with the rotation set for looks and the real orbital mechanics left to the world tabs. Skippable at any point, remembered so it never repeats, and fully still for anyone who prefers reduced motion.",
};

export default function WelcomePage() {
  return <WelcomeShell />;
}
