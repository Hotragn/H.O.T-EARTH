import type { Metadata } from "next";
import TonightShell from "@/components/tonight/TonightShell";

export const metadata: Metadata = {
  title: "Tonight · H.O.T Earth",
  description:
    "What you can actually see from your own location tonight, computed rather than looked up. lib/tonight finds sunset, the three twilight steps and sunrise numerically from the real Sun altitude, so the polar cases fall out of the same code: midnight sun, polar night, and the mid-summer latitudes where astronomical darkness never arrives are reported as named states, not missing data. It then works out how many of those dark hours are Moon-free, the Moon's phase, rise, set and how much it will spoil faint targets, which of the seven other planets clear a usable altitude while it is dark (light-time corrected, with published magnitude ranges rather than a magnitude we did not compute), which catalogued meteor showers are running, and every naked-eye ISS pass propagated with SGP4 from the committed element set. 56 unit tests validate it against published values: day length at the June solstice for London, Boston and Sydney, the documented absence of astronomical darkness above about 48.5 degrees latitude, midnight sun and polar night at Longyearbyen, the 28 and 47 degree elongation caps on Mercury and Venus, the Moon's 28.7 degree standstill limit, and the full Moon rising within an hour of sunset. Stated plainly on screen: this is sky geometry, not weather. No cloud cover, no light pollution, no API keys, and your coordinates never leave the browser.",
};

export default function TonightPage() {
  return <TonightShell />;
}
