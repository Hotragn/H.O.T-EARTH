"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// The scene is client-only (WebGL, window, RAF, a 1 Hz clock) and dynamically
// imported with ssr:false so the r3f bundle + the two New Horizons textures only
// load on this route, mirroring OtherMoonsShell.
const DwarfMoonsApp = dynamic(() => import("./DwarfMoonsApp"), {
  ssr: false,
  loading: () => <BootScreen label="Pointing the telescope at the Kuiper belt" />,
});

export default function DwarfMoonsShell() {
  return <DwarfMoonsApp />;
}
