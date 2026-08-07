"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// Client-only: the globe needs WebGL and the two USGS feeds are read in the
// browser, so there is nothing meaningful to render on the server.
const QuakesApp = dynamic(() => import("./QuakesApp"), {
  ssr: false,
  loading: () => <BootScreen label="Reading the live USGS earthquake feeds" />,
});

export default function QuakesShell() {
  return <QuakesApp />;
}
