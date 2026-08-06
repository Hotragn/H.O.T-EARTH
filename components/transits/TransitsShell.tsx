"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// Client-only: the catalogue fetch and the computed curve.
const TransitsApp = dynamic(() => import("./TransitsApp"), {
  ssr: false,
  loading: () => <BootScreen label="Watching for a dip" />,
});

export default function TransitsShell() {
  return <TransitsApp />;
}
