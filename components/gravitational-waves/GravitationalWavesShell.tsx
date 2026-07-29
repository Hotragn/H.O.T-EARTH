"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// Client-only: Web Audio, window and the catalogue fetch all live in the app.
const GravitationalWavesApp = dynamic(() => import("./GravitationalWavesApp"), {
  ssr: false,
  loading: () => <BootScreen label="Listening for spacetime" />,
});

export default function GravitationalWavesShell() {
  return <GravitationalWavesApp />;
}
