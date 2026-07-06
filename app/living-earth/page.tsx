import type { Metadata } from "next";
import LivingEarthShell from "@/components/living/LivingEarthShell";

export const metadata: Metadata = {
  title: "Living Earth · H.O.T Earth",
  description:
    "The human layer of the H.O.T Earth digital twin: 1,200 real cities glowing along the actual day/night terminator, with live weather and a clearly-labeled activity simulation.",
};

export default function LivingEarthPage() {
  return <LivingEarthShell />;
}
