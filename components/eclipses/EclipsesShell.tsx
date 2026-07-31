"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// Client-only: WebGL globe and the canon fetch.
const EclipsesApp = dynamic(() => import("./EclipsesApp"), {
  ssr: false,
  loading: () => <BootScreen label="Opening the eclipse canon" />,
});

export default function EclipsesShell() {
  return <EclipsesApp />;
}
