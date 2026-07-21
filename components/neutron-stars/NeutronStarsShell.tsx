"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// The pulsar render is client-only (WebGL, window, RAF, Web Audio) and
// dynamically imported with ssr:false so the r3f bundle only loads on this
// route, mirroring the sibling Beyond tabs.
const NeutronStarsApp = dynamic(() => import("./NeutronStarsApp"), {
  ssr: false,
  loading: () => <BootScreen label="Spinning up a neutron star" />,
});

export default function NeutronStarsShell() {
  return <NeutronStarsApp />;
}
