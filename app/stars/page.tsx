import type { Metadata } from "next";
import StarsShell from "@/components/stars/StarsShell";

export const metadata: Metadata = {
  title: "Stars · H.O.T Earth",
  description:
    "How stars live and die, plotted as a real Hertzsprung-Russell diagram from the naked-eye catalogue this app already ships (HYG v4.4 from Hipparcos, Yale Bright Star and Gliese, CC BY-SA 4.0). No new data is fetched: 8,787 of 9,029 stars have both a measured parallax distance and a colour index, and only those are plotted, because putting a star on a scientific diagram at a guessed temperature would fabricate a data point. lib/stars derives absolute magnitude, temperature from B-V via the Ballesteros fit, luminosity, radius from Stefan-Boltzmann, a photometric luminosity class, and main-sequence mass and lifetime, in 43 unit tests: 39 against published values (Sirius M_V 1.45 and ~10,000 K, Vega 0.58, Proxima ~15.5, the Sun at 1 solar luminosity and 10 Gyr) and 4 against the real shipped catalogue. Honest limits stated throughout: no extinction correction, no bolometric correction, classes read off HR position rather than spectra, and no mass reported for evolved stars because the mass-luminosity relation does not apply. The sample is magnitude limited, so giants outnumber main-sequence stars 4,112 to 3,624 and the real red-dwarf majority is almost absent. No API keys.",
};

export default function StarsPage() {
  return <StarsShell />;
}
