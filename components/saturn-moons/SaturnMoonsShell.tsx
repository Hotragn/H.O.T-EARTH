"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// The scene is client-only (WebGL, window, RAF, a 1 Hz clock) and dynamically
// imported with ssr:false so the r3f bundle + Saturn/ring/moon textures only load
// on this route, mirroring JupiterMoonsShell.
const SaturnMoonsApp = dynamic(() => import("./SaturnMoonsApp"), {
  ssr: false,
  loading: () => <BootScreen label="Pointing the telescope at Saturn" />,
});

export default function SaturnMoonsShell() {
  return <SaturnMoonsApp />;
}
