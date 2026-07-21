import type { Metadata } from "next";
import BlackHolesShell from "@/components/black-holes/BlackHolesShell";

export const metadata: Metadata = {
  title: "Black Holes · H.O.T Earth",
  description:
    "Real black holes to scale with a physically-based gravitational-lensing render. The centrepiece bends the real ESO Milky Way panorama with the point-mass thin-lens equation (Schwarzschild weak-field deflection), with the shadow, photon ring and disk inner edge placed at the real Schwarzschild ratios of the selected object; the accretion disk is illustrative and the geometry is the non-spinning Schwarzschild approximation, not a full Kerr ray-trace, so it is a render, not a photograph. Every number is real: masses, distances and shadow sizes are cited measurements (GRAVITY, EHT, LIGO, Gaia), and the Schwarzschild radius, photon sphere, ISCO, shadow angular size (shown computed vs the observed EHT value for Sgr A* and M87*), gravitational time dilation, spaghettification verdict, Hawking temperature and light deflection are computed by lib/black-holes. The two EHT images are radio-interferometric reconstructions from 2017 data, not optical photos, credited EHT Collaboration under CC BY 4.0. Hawking radiation is real theory, unobserved. No API keys, no runtime network.",
};

export default function BlackHolesPage() {
  return <BlackHolesShell />;
}
