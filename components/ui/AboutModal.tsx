"use client";

import { useEffect } from "react";
import { ArrowUpRight, X } from "@phosphor-icons/react";
import { GIBS_LAYERS } from "@/lib/gibs";

/**
 * The honesty panel. Every number and pixel in the app traces to a source
 * listed here (physics-env-simulation skill: real physics and real data, or
 * it doesn't ship).
 */
export default function AboutModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-abyss/70 p-4 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
        className="hud-panel flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl animate-hud-in"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
          <div>
            <h2
              id="about-title"
              className="font-display text-xl font-medium tracking-tight text-ice"
            >
              What you are looking at
            </h2>
            <p className="mt-1 text-sm text-dim">
              Real data or documented physics. Nothing invented.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close about panel"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-dim transition-colors duration-200 hover:bg-white/5 hover:text-ice focus-visible:outline focus-visible:outline-2 focus-visible:outline-solar/70"
          >
            <X size={17} weight="light" aria-hidden />
          </button>
        </div>

        <div className="hud-scroll overflow-y-auto p-5 text-sm leading-relaxed text-dim sm:p-6">
          <p>
            H.O.T Earth is an open digital twin of the planet. Phase 1 is this
            globe: real satellite imagery, a physically computed day/night
            terminator, and live point forecasts anywhere you click.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Imagery — NASA GIBS / Worldview
          </h3>
          <ul className="mt-2 space-y-2">
            {GIBS_LAYERS.map((l) => (
              <li key={l.slug}>
                <span className="text-ice">{l.title}</span> —{" "}
                <span className="font-mono text-xs text-dim">{l.gibsId}</span>
                <span className="text-faint">
                  {" "}
                  · daily, lags ~{l.typicalLagDays} day
                  {l.typicalLagDays > 1 ? "s" : ""}
                </span>
              </li>
            ))}
            <li>
              <span className="text-ice">Base day map</span> —{" "}
              <span className="font-mono text-xs text-dim">
                BlueMarble_ShadedRelief_Bathymetry
              </span>
              <span className="text-faint"> · static composite</span>
            </li>
            <li>
              <span className="text-ice">Night lights</span> —{" "}
              <span className="font-mono text-xs text-dim">
                VIIRS_Black_Marble
              </span>
              <span className="text-faint">
                {" "}
                · 2016 composite, not live
              </span>
            </li>
          </ul>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Day / night terminator
          </h3>
          <p className="mt-2">
            Computed, not imagery: NOAA solar position algorithm (solar
            declination + equation of time) gives the subsolar point for the
            displayed time; the shader blends day to night through a real
            twilight band down to -12° solar elevation. Unit-tested against
            solstice and equinox values.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Forecasts
          </h3>
          <p className="mt-2">
            Point forecasts come from the Open-Meteo API (CC-BY 4.0) and are
            labeled as such. They are Open-Meteo&apos;s weather models — we make
            no forecast claims of our own in this phase.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Wind particles
          </h3>
          <p className="mt-2">
            Real measured-model wind: the latest NOAA/NCEP GFS 1° analysis of
            10 m u/v components (public domain), refreshed every 6 h by a
            pipeline in this repo. Particles are advected by bilinear
            interpolation of that grid; only the animation speed is
            exaggerated (~15 h of wind per second) so motion is visible at
            globe scale. Brightness maps to real wind speed.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Living Earth cities
          </h3>
          <p className="mt-2">
            The 1,200 most populous places from Natural Earth (public
            domain), lit by the same computed solar terminator. The pulsing
            &quot;activity&quot; of each city is a simulation driven by real
            local solar time, day of week and population — clearly labeled,
            never presented as measured data. City weather is live
            Open-Meteo.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Mars — real orbital mechanics
          </h3>
          <p className="mt-2">
            The Mars tab runs the NASA GISS <span className="text-ice">Mars24</span>{" "}
            algorithm (Allison &amp; McEwen 2000): areocentric solar longitude
            (Ls) and season, Mars Sol Date, Coordinated Mars Time, and a
            physically computed day/night terminator from the Mars subsolar
            point — unit-tested against the Mars24 worked example and known
            landing dates. The dust-storm indicator is a{" "}
            <span className="text-ice">climatological season</span> (Ls
            180–360, peak ~240–300), not a prediction of any specific storm. If
            a seasonal climatology dataset is present it is plotted as seasonal
            averages, clearly labeled — never as a live forecast. The seasonal
            surface-pressure plot is real measured Viking Lander data (the ~30%
            annual CO₂ condensation cycle), shown as a seasonal climatology by
            Ls. Terrain is the NASA/JPL/USGS Viking MDIM 2.1 colorized global
            mosaic (public domain).
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Moon — no weather, real geometry
          </h3>
          <p className="mt-2">
            The Moon has essentially no atmosphere, so there is{" "}
            <span className="text-ice">no weather</span> — no wind, clouds,
            precipitation, pressure or storms, and we invent none. What is real
            and dynamic is geometry. Lunar{" "}
            <span className="text-ice">phase, illuminated fraction and the
            day/night terminator</span>{" "}
            are computed client-side from Meeus lunar theory (the Moon analogue
            of Earth&apos;s NOAA terminator and Mars&apos; Mars24 clock), no
            runtime API. <span className="text-ice">Optical libration</span> —
            the Moon&apos;s monthly nod, up to ±~7.9° in longitude and ±~6.9° in
            latitude — is computed the same way; it is why an Earth observer sees
            ~59% of the surface over time, not just 50%. Surface temperature is
            the flagship measured signal: the ~300 K day-night swing (equatorial
            ~392 K at noon, ~95 K before dawn; polar cold traps 25–40 K) from
            NASA&apos;s <span className="text-ice">LRO Diviner</span> radiometer
            (Williams et al. 2017) — shown as a model anchored to those
            measurements (day = radiative equilibrium, night = Diviner-anchored),
            never as a live sensor feed. The basemap is the public-domain LROC
            WAC mosaic (NASA SVS / LROC / ASU); no science is claimed from it.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Virtual Earth — the time machine
          </h3>
          <p className="mt-2">
            A deep-zoomable Earth played through history. The city layer is{" "}
            <span className="text-ice">real data</span>: 1,730 settlements from
            Reba, Reitsma &amp; Seto (2016), &quot;6,000 years of global
            urbanization&quot; (CC-BY 4.0) — cities appear at their founding and
            grow with recorded population. The shifting night sky is{" "}
            <span className="text-ice">computed</span> axial precession (IAU
            2006 constants, uniform single-term model; ~25,772-year cycle). World population, dated events (incl. the
            World Wars, at real coordinates) and industrial-era climate are
            built-in historical estimates, labeled as such. The optional{" "}
            <span className="text-ice">Era Scenes</span> overlay is explicitly
            marked artistic — procedurally generated, not data.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Attribution
          </h3>
          <ul className="mt-2 space-y-1.5">
            {[
              ["NASA GIBS / Worldview", "https://worldview.earthdata.nasa.gov/"],
              ["NASA Blue Marble / Black Marble", "https://science.nasa.gov/earth/earth-observatory/collections/blue-marble/"],
              ["Open-Meteo", "https://open-meteo.com/"],
              ["NOAA/NCEP GFS (wind)", "https://www.nco.ncep.noaa.gov/pmb/products/gfs/"],
              ["Natural Earth (cities)", "https://www.naturalearthdata.com/"],
              ["Mars terrain: NASA/USGS Astrogeology", "https://astrogeology.usgs.gov/search/results?pmi-target=mars"],
              ["Mars24 time: NASA GISS", "https://www.giss.nasa.gov/tools/mars24/"],
              ["Mars climatology: NASA PDS (Viking)", "https://pds.nasa.gov/"],
              ["Cities over time: Reba et al. 2016 (CC-BY)", "https://doi.org/10.1038/sdata.2016.34"],
              ["Moon temperature: LRO Diviner (NASA PDS)", "https://pds-geosciences.wustl.edu/missions/lro/diviner.htm"],
              ["Moon basemap: NASA SVS / LROC / ASU", "https://svs.gsfc.nasa.gov/4720"],
              ["Moon phase & libration: computed (Meeus)", "https://en.wikipedia.org/wiki/Jean_Meeus"],
            ].map(([label, href]) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1 text-dim transition-colors duration-200 hover:text-ice"
                >
                  {label}
                  <ArrowUpRight
                    size={12}
                    weight="light"
                    aria-hidden
                    className="opacity-60 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px"
                  />
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 border-t border-line pt-4 font-mono text-[10px] leading-relaxed text-faint">
            We are not affiliated with or endorsed by NASA. Imagery courtesy of
            NASA EOSDIS GIBS. Weather data by Open-Meteo.com, CC-BY 4.0.
          </p>
        </div>
      </div>
    </div>
  );
}
