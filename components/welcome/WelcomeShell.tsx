"use client";

import dynamic from "next/dynamic";
import BootScreen from "@/components/ui/BootScreen";

// Client-only: WebGL planet stages, scroll progress and localStorage.
const WelcomeApp = dynamic(() => import("./WelcomeApp"), {
  ssr: false,
  loading: () => <BootScreen label="Preparing for launch" />,
});

export default function WelcomeShell() {
  return <WelcomeApp />;
}
