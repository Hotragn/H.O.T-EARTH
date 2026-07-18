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
            Solar System — other planets
          </h3>
          <p className="mt-2">
            The orrery places all eight planets at their{" "}
            <span className="text-ice">real heliocentric longitudes</span>,
            computed from JPL&apos;s approximate-positions Keplerian elements
            (Standish, 1800–2050). Angular positions and relative orbital speeds
            are physical; only the radial distances are log-compressed so every
            orbit fits on screen — the app says so on the control. The six
            detail globes (Mercury, Venus, Jupiter, Saturn, Uranus, Neptune) use
            real textures, a computed day/night terminator, and each body&apos;s{" "}
            <span className="text-ice">real axial tilt</span> — Uranus is drawn
            tipped 98° onto its side, Venus and Uranus spin retrograde. Most of
            these worlds have{" "}
            <span className="text-ice">no measurable weather</span>, so we invent
            none: the honest dynamic signals are Mercury&apos;s measured
            day/night temperature extremes, Venus&apos; cloud-top{" "}
            <span className="text-ice">super-rotation</span> (~100 m/s,
            illustrated), the MEASURED gas/ice-giant{" "}
            <span className="text-ice">zonal-wind profiles</span> (Jupiter —
            Barrado-Izagirre et al. 2013; Saturn — García-Melendo et al. 2011;
            Neptune — Sromovsky et al. 1993), Saturn&apos;s rings (drawn from
            occultation-measured radii) and north-polar hexagon, and
            Neptune&apos;s record winds. Neptune&apos;s Great Dark Spot is
            labelled <span className="text-ice">transient</span> (GDS-89 was gone
            by 1994) and is not drawn. Textures for Saturn, Uranus, Neptune and
            Saturn&apos;s rings are by{" "}
            <span className="text-ice">Solar System Scope (solarsystemscope.com),
            CC BY 4.0</span>; Mercury, Venus and Jupiter use public-domain
            NASA/JPL/USGS imagery.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Major moons — orbital mechanics, not weather
          </h3>
          <p className="mt-2">
            The Moons tab covers the major satellites of the giant planets. Each
            parent has a{" "}
            <span className="text-ice">mini-orrery</span>: the moons sit at their
            real orbital angles (from their JPL sidereal periods), so inner moons
            whip around while outer ones amble and{" "}
            <span className="text-ice">Triton visibly orbits retrograde</span> —
            only the radial distances are log-compressed so each system fits on
            screen (the app says so). Jupiter&apos;s Galileans carry a live{" "}
            <span className="text-ice">Laplace-resonance</span> callout: Io :
            Europa : Ganymede orbital periods lock to ≈ 1 : 2 : 4, computed from
            the period table, not asserted. Every major moon here is{" "}
            <span className="text-ice">tidally locked</span>, so its detail globe
            keeps one face to the parent and the day/night terminator is a real
            computed sub-solar sweep (lib/moons), not imagery. The core numbers
            (radius, period, distance, temperature, albedo) are JPL SSD satellite
            parameters; the per-moon feature facts are{" "}
            <span className="text-ice">measured by spacecraft</span> and cited
            individually, with genuinely debated items (Europa/Callisto/Mimas
            oceans, Europa plumes) flagged as such. Most of these worlds have{" "}
            <span className="text-ice">no weather</span>, so we invent none. The
            single exception is <span className="text-ice">Titan</span>, whose
            real methane cycle (clouds, rain, rivers, north-polar seas — Cassini/
            Huygens) is presented as the weather it is. Texture honesty is
            surfaced per moon: Titan&apos;s map is a Cassini{" "}
            <span className="text-ice">near-IR surface map that sees through the
            haze</span> (not the orange visible atmosphere); Triton&apos;s{" "}
            <span className="text-ice">northern hemisphere is USGS synthetic
            interpolation</span> (Voyager 2 imaged only one hemisphere in 1989);
            Europa and Callisto are grayscale mosaics (no colour implied). All
            moon maps this phase are public domain (NASA / JPL / USGS).
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Dwarf planets — orbital mechanics, not weather
          </h3>
          <p className="mt-2">
            The Dwarfs tab covers the five IAU dwarf planets (Ceres, Pluto,
            Haumea, Makemake, Eris) plus Pluto&apos;s moon Charon. The{" "}
            <span className="text-ice">mini-orrery</span> places each on its real,
            eccentric orbit (from JPL Small-Body Database elements), at its real
            heliocentric longitude, so relative speeds are physical — only the
            radial distance is log-compressed so Ceres (~2.8 AU) and Eris (~68 AU)
            fit together (the control says so). Neptune&apos;s orbit is drawn as
            the trans-Neptunian reference ring, and Pluto&apos;s traced orbit
            visibly crosses it: Pluto&apos;s{" "}
            <span className="text-ice">3:2 mean-motion resonance</span> with
            Neptune is computed from the period table, not asserted. Each detail
            globe carries a real, computed day/night terminator that sweeps at the
            body&apos;s real rotation rate. Dwarf planets have{" "}
            <span className="text-ice">no weather</span>, so we invent none. Only
            three have ever been imaged up close, so only three have real maps:
            Pluto and Charon (New Horizons, 2015) and Ceres (Dawn, 2015–2018),
            shown as grayscale albedo mosaics (real data, not colourised; the
            single-flyby Pluto/Charon far sides are lower-resolution).{" "}
            <span className="text-ice">Eris, Haumea and Makemake have never been
            visited</span> — there is no surface map, so they are rendered as
            clearly-labelled illustrative spheres, never implying real imagery.
            Haumea is the exception worth the caveat: its{" "}
            <span className="text-ice">triaxial ellipsoid shape</span>{" "}
            (~2100×1680×1074 km, forced by a ~3.9 h spin) and its{" "}
            <span className="text-ice">ring</span> (the first found around a
            trans-Neptunian object, Ortiz et al. 2017) are real, measured geometry
            even though its surface colour is illustrative. Charon shows the
            Pluto–Charon <span className="text-ice">binary</span> (the barycenter
            lies outside Pluto). Core numbers are JPL SBDB / mission values; the
            per-body measured facts are cited individually (Stern et al. 2015,
            Moore et al. 2016, Gladstone et al. 2016, Grundy et al. 2016, Nathues
            2015 / De Sanctis et al. 2016, Sicardy et al. 2011, Ortiz et al.
            2017/2012), with genuinely uncertain items (Eris and Makemake rotation
            periods) flagged. All dwarf maps this phase are public domain.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Exoplanets — measured data, illustrative worlds
          </h3>
          <p className="mt-2">
            The Exoplanets tab (the &quot;Beyond&quot; group) is a system explorer
            for real planetary systems around other stars. Every measured
            number — orbital period, semi-major axis, radius, mass, equilibrium
            temperature, insolation, discovery method/year and the host-star
            properties — is a{" "}
            <span className="text-ice">NASA Exoplanet Archive</span> value
            (Planetary Systems Composite Parameters table); a missing value is
            shown as &quot;not measured&quot;, never filled in. Masses from radial
            velocity are <span className="text-ice">minimum masses</span> (M·sin
            i) and labelled as such. The system architecture places planets on
            their real relative orbits — the order and relative speeds are
            physical, but the radial distances are log-compressed and the absolute
            orbital phase is unknown, so it is seeded illustratively (the app says
            so). The green{" "}
            <span className="text-ice">habitable zone</span> is computed, not
            measured: the Kopparapu et al. (2013) parametrization from the star&apos;s
            luminosity and temperature; composition classes come from the radius
            valley (Fulton et al. 2017). Crucially,{" "}
            <span className="text-ice">no exoplanet has been imaged in surface
            detail</span> — every planet&apos;s appearance here is an illustrative
            temperature/composition cue, not an observation. Even the seven{" "}
            <span className="text-ice">directly-imaged</span> planets (HR 8799 b/c/d/e,
            β Pic b/d, 51 Eri b) were captured only as unresolved points of light,
            not surface maps, and are labelled so. The honest substance is the
            measured parameters, the system architecture and the computed
            habitable zones.
          </p>
          <p className="mt-3 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5 text-[12px] leading-relaxed">
            <span className="text-ice">Acknowledgment.</span> This research has
            made use of the NASA Exoplanet Archive, which is operated by the
            California Institute of Technology, under contract with the National
            Aeronautics and Space Administration under the Exoplanet Exploration
            Program. Primary citation: Christiansen et al. (2025), Planetary
            Science Journal. This catalogue also includes planets from the WASP
            (Wide Angle Search for Planets) survey — Butters et al. (2010).
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
              ["Planet orbits: JPL approximate positions", "https://ssd.jpl.nasa.gov/planets/approx_pos.html"],
              ["Planet facts: NASA NSSDC Fact Sheet", "https://nssdc.gsfc.nasa.gov/planetary/factsheet/"],
              ["Planet & ring textures: Solar System Scope (CC BY 4.0)", "https://www.solarsystemscope.com/textures/"],
              ["Moon orbits & constants: JPL SSD satellite parameters", "https://ssd.jpl.nasa.gov/sats/elem/"],
              ["Moon maps: NASA / JPL / USGS (public domain)", "https://astrogeology.usgs.gov/search"],
              ["Enceladus plumes: Porco et al. 2006", "https://doi.org/10.1126/science.1123013"],
              ["Titan surface & methane cycle: Huygens (Fulchignoni et al. 2005)", "https://doi.org/10.1038/nature04314"],
              ["Triton geysers & atmosphere: Voyager 2 (Smith et al. 1989)", "https://doi.org/10.1126/science.246.4936.1422"],
              ["Io heat flow: Veeder et al. 2012", "https://doi.org/10.1016/j.icarus.2012.03.031"],
              ["Dwarf-planet orbits & constants: JPL SBDB", "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html"],
              ["Pluto & Charon maps: NASA/JHU-APL/SwRI (New Horizons, PD)", "https://www.nasa.gov/mission/new-horizons/"],
              ["Ceres map: NASA/JPL-Caltech/UCLA/MPS/DLR/IDA (Dawn, PD)", "https://www.nasa.gov/mission/dawn/"],
              ["Pluto surface: Stern et al. 2015", "https://doi.org/10.1126/science.aad1815"],
              ["Sputnik Planitia: Moore et al. 2016", "https://doi.org/10.1126/science.aad7055"],
              ["Pluto atmosphere/haze: Gladstone et al. 2016", "https://doi.org/10.1126/science.aad8866"],
              ["Charon Mordor Macula: Grundy et al. 2016", "https://doi.org/10.1038/nature19340"],
              ["Ceres Occator salts: De Sanctis et al. 2016", "https://doi.org/10.1038/nature18290"],
              ["Eris size & albedo: Sicardy et al. 2011", "https://doi.org/10.1038/nature10550"],
              ["Haumea ring & shape: Ortiz et al. 2017", "https://doi.org/10.1038/nature24051"],
              ["Makemake occultation: Ortiz et al. 2012", "https://doi.org/10.1038/nature11597"],
              ["Exoplanets: NASA Exoplanet Archive (Caltech/IPAC)", "https://exoplanetarchive.ipac.caltech.edu/"],
              ["Exoplanet Archive PSCompPars: Christiansen et al. 2025", "https://exoplanetarchive.ipac.caltech.edu/docs/pscp_about.html"],
              ["Habitable zones: Kopparapu et al. 2013", "https://doi.org/10.1088/0004-637X/765/2/131"],
              ["Radius valley (composition): Fulton et al. 2017", "https://doi.org/10.3847/1538-3881/aa80eb"],
              ["WASP survey: Butters et al. 2010", "https://doi.org/10.1051/0004-6361/201015655"],
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
