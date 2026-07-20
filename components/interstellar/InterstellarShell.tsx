"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// The whole page is client-only (WebGL, window, rAF, audio, localStorage) and
// dynamically imported with ssr:false so the r3f bundle only loads on this route,
// mirroring the other 3D tabs' Shell pattern.
const InterstellarApp = dynamic(() => import("./InterstellarApp"), {
  ssr: false,
  loading: () => <BootScreen label="Plotting the interstellar visitors" />,
});

export default function InterstellarShell() {
  return <InterstellarApp />;
}
