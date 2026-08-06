"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// Client-only: the whole page is computed for the visitor's own location, clock
// and time zone, none of which exist on the server.
const TonightApp = dynamic(() => import("./TonightApp"), {
  ssr: false,
  loading: () => <BootScreen label="Working out when it gets dark where you are" />,
});

export default function TonightShell() {
  return <TonightApp />;
}
