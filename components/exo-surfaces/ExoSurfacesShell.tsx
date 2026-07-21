"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// The scene is client-only (WebGL, window, RAF) and dynamically imported with
// ssr:false so the r3f bundle only loads on this route, mirroring SurfacesShell.
const ExoSurfacesApp = dynamic(() => import("./ExoSurfacesApp"), {
  ssr: false,
  loading: () => <BootScreen label="Computing an alien sky from real data" />,
});

export default function ExoSurfacesShell() {
  return <ExoSurfacesApp />;
}
