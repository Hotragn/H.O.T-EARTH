import type { Metadata } from "next";
import GravitationalWavesShell from "@/components/gravitational-waves/GravitationalWavesShell";

export const metadata: Metadata = {
  title: "Gravitational Waves · H.O.T Earth",
  description:
    "The 282 real gravitational-wave detections of LIGO, Virgo and KAGRA, from GW150914 to the 2025 catalogue, with published source-frame masses, distances, redshifts, remnant spins and network SNR from the GWOSC event portal (GWTC-1 through GWTC-5). The frequency sweep, ringdown note, strain scale and radiated energy are computed from those masses by lib/gravitational-waves, checked in 43 unit tests against published values: GW150914's ~3.1 solar masses of radiated energy, its ~1e-21 strain, its 68 Hz ISCO estimate and its ~290 Hz ringdown. The waveform and the opt-in sound are synthesized from the computed sweep at the real frequency, never LIGO strain data or audio releases, and mergers with a component in the contested 2-5 solar mass range are labeled ambiguous rather than classified. No API keys, no runtime network beyond one committed data file.",
};

export default function GravitationalWavesPage() {
  return <GravitationalWavesShell />;
}
