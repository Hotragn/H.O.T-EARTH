"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// The lensing render is client-only (WebGL, window, RAF) and dynamically
// imported with ssr:false so the r3f + shader bundle only loads on this route,
// mirroring the sibling Beyond tabs.
const BlackHolesApp = dynamic(() => import("./BlackHolesApp"), {
  ssr: false,
  loading: () => <BootScreen label="Bending starlight around a black hole" />,
});

export default function BlackHolesShell() {
  return <BlackHolesApp />;
}
