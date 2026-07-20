import type { Metadata } from "next";
import AsteroidMoonsShell from "@/components/asteroid-moons/AsteroidMoonsShell";

export const metadata: Metadata = {
  title: "Asteroid Moons · H.O.T Earth",
  description:
    "Real binary and multiple asteroid systems as a schematic, face-on mutual-orbit view, computed client-side from cited primary papers. A system selector swaps the primary and its moons across eight systems: the DART-altered Didymos and Dimorphos (the mutual period steps from 11.921 h to 11.372 h across the 2022-09-26 impact, the first time humanity deliberately changed a celestial body's orbit), Ida and Dactyl (the first confirmed asteroid moon, its orbit poorly constrained), the first triple 87 Sylvia, the dog-bone 216 Kleopatra, the near-equal doubles 90 Antiope and the Jupiter Trojan 617 Patroclus and Menoetius (both circling a marked barycenter), 22 Kalliope and Linus, and 45 Eugenia. Sizes, separations and periods are real and to scale; the orbit orientation and along-orbit phase are an adopted convention, since these systems are unresolvable from Earth (radar, adaptive optics or spacecraft only), so there is no plane-of-sky and no visibility claim. And comets, honestly, have no moons: 67P and Arrokoth are contact binaries (one body, not a moon), and this tab invents none. No API keys, no runtime fetch.",
};

export default function AsteroidMoonsPage() {
  return <AsteroidMoonsShell />;
}
