"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// Client-only: WebGL, SGP4 propagation and the catalogue fetch.
const SatellitesApp = dynamic(() => import("./SatellitesApp"), {
  ssr: false,
  loading: () => <BootScreen label="Acquiring the catalogue" />,
});

export default function SatellitesShell() {
  return <SatellitesApp />;
}
