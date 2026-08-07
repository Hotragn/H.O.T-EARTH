import type { Metadata } from "next";
import QuakesShell from "@/components/quakes/QuakesShell";

export const metadata: Metadata = {
  title: "Seismic Earth · H.O.T Earth",
  description:
    "The solid planet, live: every earthquake the USGS has located in the last week, plotted on the globe by magnitude and hypocentre depth. No plate-boundary map is shipped and none is needed, because a week of real epicentres draws the boundaries by itself. The feed carries only position, depth, magnitude and time; lib/quakes computes everything else in 47 unit tests validated against published seismology: radiated energy from log10 E = 1.5M + 4.8 (a magnitude 8 at 6.3e16 J, one step 32x, two steps exactly 1000x), seismic moment by Hanks and Kanamori 1979 checked against the published moments of Tohoku 2011 and Valdivia 1960, the standard shallow / intermediate / deep bands, great-circle distance from your location, and P and S arrival times for local paths only (refused past 1,000 km, where the ray leaves the crust and a fixed velocity stops being right). The centrepiece is a live Gutenberg-Richter fit, log10 N = a - bM, over the week's catalogue, drawn with the completeness magnitude marked: the rollover at the small end is the seismometer network's detection limit, not a shortage of small earthquakes, and a test proves that fitting through it understates b by about 18% while still looking convincing. Nothing here predicts earthquakes. USGS data, public domain, no API key.",
};

export default function EarthquakesPage() {
  return <QuakesShell />;
}
