"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// Client-only: the catalogue fetch and the SVG diagram both need the browser.
const StarsApp = dynamic(() => import("./StarsApp"), {
  ssr: false,
  loading: () => <BootScreen label="Sorting stars by colour and brightness" />,
});

export default function StarsShell() {
  return <StarsApp />;
}
