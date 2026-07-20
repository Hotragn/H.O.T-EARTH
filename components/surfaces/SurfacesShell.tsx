"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// The scene is client-only (WebGL, window, RAF, the DEM decoder) and
// dynamically imported with ssr:false so the r3f bundle + the real Mars assets
// only load on this route, mirroring AsteroidMoonsShell.
const SurfacesApp = dynamic(() => import("./SurfacesApp"), {
  ssr: false,
  loading: () => <BootScreen label="Raising the real Gale Crater terrain" />,
});

export default function SurfacesShell() {
  return <SurfacesApp />;
}
