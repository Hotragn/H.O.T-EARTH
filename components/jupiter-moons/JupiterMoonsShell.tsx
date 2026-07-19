"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// The scene is client-only (WebGL, window, RAF, a 1 Hz clock) and dynamically
// imported with ssr:false so the r3f bundle + Jupiter/moon textures only load on
// this route, mirroring IssShell / MoonShell.
const JupiterMoonsApp = dynamic(() => import("./JupiterMoonsApp"), {
  ssr: false,
  loading: () => <BootScreen label="Pointing the telescope at Jupiter" />,
});

export default function JupiterMoonsShell() {
  return <JupiterMoonsApp />;
}
