import type { Metadata } from "next";
import ExoSurfacesShell from "@/components/exo-surfaces/ExoSurfacesShell";

export const metadata: Metadata = {
  title: "Exoplanet Surfaces · H.O.T Earth",
  description:
    "Stand under alien skies computed from real NASA Exoplanet Archive data. This is the mirror image of the Mars and Titan Surfaces tab: no exoplanet surface has ever been imaged, so all ground here is illustrative, but the SKY is the real, computed part. The host star is drawn at its true angular size and illustrative colour (TRAPPIST-1 e: a salmon-red sun about 2.17 degrees across, roughly 4 times the width of our Sun), and the sibling planets appear as discs at their real maximum apparent size at closest approach. Facts (surface gravity, irradiance, equilibrium temperature, year length, distance) are computed or read from measured parameters and cited. Tidal locking is labeled an inference; rotation and day length are not measured, so no local clock is shown. 51 Pegasi b is the honest counterpart, a gas giant with no surface to stand on. No API keys, no runtime fetch beyond the committed catalogue.",
};

export default function ExoSurfacesPage() {
  return <ExoSurfacesShell />;
}
