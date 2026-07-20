import type { Metadata } from "next";
import InterstellarShell from "@/components/interstellar/InterstellarShell";

export const metadata: Metadata = {
  title: "Interstellar · H.O.T Earth",
  description:
    "A cinematic, movie-inspired homage built from original assets (no copyrighted film material). Three sections: an Arrival intro; The Visitors, the three real interstellar objects (1I/'Oumuamua, 2I/Borisov, 3I/ATLAS) on their real hyperbolic trajectories from cited JPL SBDB / MPC elements, with a time scrubber through perihelion and a HUD of speed, Sun and Earth distance and inbound/outbound phase; and Swarm Defense, a live simulation of real swarm-robotics algorithms (Reynolds boids flocking, decentralized task allocation, leaderless local consensus) run every frame as an educational planetary-defense game, not a real defense system. Optional NASA Voyager plasma-wave audio, off by default. No API keys, no runtime fetch.",
};

export default function InterstellarPage() {
  return <InterstellarShell />;
}
