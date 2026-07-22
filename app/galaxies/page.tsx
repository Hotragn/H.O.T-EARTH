import type { Metadata } from "next";
import GalaxiesShell from "@/components/galaxies/GalaxiesShell";

export const metadata: Metadata = {
  title: "Galaxies & Cosmic Web · H.O.T Earth",
  description:
    "The real cosmic web: 18,000 galaxies from the Sloan Digital Sky Survey (SDSS DR17, Abdurro'uf et al. 2022), each a measured RA/Dec/redshift, mapped to 3D by lib/galaxies and drawn as one GPU point cloud, so the actual filaments, walls and voids emerge. The radial axis is redshift-space (cz/H0), so clusters stretch into the real fingers-of-God distortion and the depth scale shifts with the unresolved Hubble tension (H0 = 70 adopted; Planck 67.4 vs SH0ES 73). A galaxy explorer covers ten real, cited galaxies (Andromeda, Whirlpool, Sombrero, M87 and more) with real ESA/Hubble images (CC BY 4.0), the Hubble tuning-fork class, distance, redshift and recession velocity. A scale ladder zooms from Earth to the observable universe, and a deep-field panel shows the real JWST SMACS 0723 first deep field. No API keys, no runtime network beyond committed static data.",
};

export default function GalaxiesPage() {
  return <GalaxiesShell />;
}
