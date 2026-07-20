"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// The scene is client-only (WebGL, window, RAF, a 1 Hz clock) and dynamically
// imported with ssr:false so the r3f bundle + the two reused mission photos only
// load on this route, mirroring DwarfMoonsShell.
const AsteroidMoonsApp = dynamic(() => import("./AsteroidMoonsApp"), {
  ssr: false,
  loading: () => <BootScreen label="Framing the binary asteroid orbits" />,
});

export default function AsteroidMoonsShell() {
  return <AsteroidMoonsApp />;
}
