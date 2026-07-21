import type { Metadata } from "next";
import NeutronStarsShell from "@/components/neutron-stars/NeutronStarsShell";

export const metadata: Metadata = {
  title: "Neutron Stars · H.O.T Earth",
  description:
    "Real neutron stars and pulsars, from the first pulsar B1919+21 and the Crab to the fastest 716 Hz millisecond pulsar and a magnetar. The centrepiece is an illustrative rotating-star-with-sweeping-beam depiction of the real lighthouse model: the pulse timing (flash and scrolling pulse train) is real, ticking at the object's true measured spin period, while the 3D mesh spin is visually slowed for clarity with the true frequency shown. Optional pulse audio is synthesized in-browser at the real spin frequency, not a telescope recording, off by default. Every number is real and cited: periods, masses, distances and magnetic fields from the ATNF Pulsar Catalogue and discovery papers, and the density, surface gravity, escape velocity, compactness, redshift, spin velocity, characteristic age and spin-down luminosity computed by lib/neutron-stars, with a canonical 1.4 Msun / 12 km model flagged where mass and radius are not both measured. Two real telescope images (ESA/Hubble Crab Nebula CC BY 4.0, NASA/CXC Chandra Vela) are shown labeled. No API keys, no runtime network.",
};

export default function NeutronStarsPage() {
  return <NeutronStarsShell />;
}
