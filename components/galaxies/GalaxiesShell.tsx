"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// The cosmic-web render is client-only (WebGL, window) and dynamically imported
// with ssr:false so the r3f bundle only loads on this route, mirroring the
// sibling Beyond tabs.
const GalaxiesApp = dynamic(() => import("./GalaxiesApp"), {
  ssr: false,
  loading: () => <BootScreen label="Mapping 18,000 real galaxies" />,
});

export default function GalaxiesShell() {
  return <GalaxiesApp />;
}
