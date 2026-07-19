import type { Metadata } from "next";
import OtherMoonsShell from "@/components/other-moons/OtherMoonsShell";

export const metadata: Metadata = {
  title: "Other Moons · H.O.T Earth",
  description:
    "The major moons of Mars, Uranus and Neptune at real live apparent positions, computed client-side from Kepler propagation of JPL SSD mean orbital elements (Mars MAR099, the Uranus equatorial set, and the Neptune set with Nereid's eccentric ecliptic-frame orbit) oriented by each planet's IAU WGCCRE pole. A planet selector swaps the disk, the moon set and every readout. The telescope plane-of-sky view shows each planet's oblate disk tipped to its true pole with the moons strung along the tilted equatorial ellipse: Uranus tipped ~98 degrees with its opening swinging across the 84-year season (edge-on 2007, next ~2049), Triton orbiting Neptune retrograde, Nereid on a wildly eccentric orbit, and Phobos racing around Mars in ~7.65 hours below synchronous height. Because these disks are tiny from Earth (Mars ~4-25 arcsec, Uranus ~3.7, Neptune ~2.3), transits, shadow transits, occultations and eclipses are rare to effectively unobservable, so this is an honest live configuration view, not an events clock; Triton and Nereid are flagged least accurate, cross-check JPL Horizons. Textures: Uranus and Neptune by Solar System Scope (CC BY 4.0, credited, stylized); Mars MOLA, Triton and the seven Viking/Voyager moon maps are public domain; Proteus and Nereid are illustrative tinted spheres. No API keys, no runtime fetch.",
};

export default function OtherMoonsPage() {
  return <OtherMoonsShell />;
}
