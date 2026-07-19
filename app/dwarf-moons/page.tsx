import type { Metadata } from "next";
import DwarfMoonsShell from "@/components/dwarf-moons/DwarfMoonsShell";

export const metadata: Metadata = {
  title: "Dwarf Moons · H.O.T Earth",
  description:
    "The moon systems of the dwarf planets Pluto, Eris, Haumea and Makemake, computed client-side from published mean orbital elements. A system selector swaps the central body, the moon set and every readout. Pluto is drawn as the true binary it is: the Pluto-Charon barycenter sits in empty space outside Pluto (~2128 km out, past the 1188 km radius), with Pluto and Charon (real New Horizons maps) both circling it and the four small moons Styx, Nix, Kerberos and Hydra in near-resonance around the same point. Two honesty tiers are never blurred: Pluto carries real along-orbit positions (Brozovic & Jacobson 2024), while Eris (Dysnomia), Haumea (Hiiaka, Namaka, plus its triaxial shape and ring) and Makemake (MK2) show a real orbit with an illustrative along-orbit phase, and MK2 is additionally flagged orbit poorly constrained. These systems are unresolvable from Earth (Pluto's disk is about 0.1 arcsec), so this is an honest configuration view of the real orbits, not an events tab; the parent sky positions are real for all four. No API keys, no runtime fetch.",
};

export default function DwarfMoonsPage() {
  return <DwarfMoonsShell />;
}
