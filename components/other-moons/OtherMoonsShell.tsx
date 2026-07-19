"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// The scene is client-only (WebGL, window, RAF, a 1 Hz clock) and dynamically
// imported with ssr:false so the r3f bundle + Mars/Uranus/Neptune/moon textures
// only load on this route, mirroring SaturnMoonsShell.
const OtherMoonsApp = dynamic(() => import("./OtherMoonsApp"), {
  ssr: false,
  loading: () => <BootScreen label="Pointing the telescope outward" />,
});

export default function OtherMoonsShell() {
  return <OtherMoonsApp />;
}
