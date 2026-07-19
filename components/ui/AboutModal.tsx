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
            ISS tracker — real orbit, propagated live
          </h3>
          <p className="mt-2">
            The ISS Tracker (the fourth Earth-group world) shows the real
            International Space Station orbiting Earth live.{" "}
            <span className="text-ice">Measured:</span> a real{" "}
            <span className="text-ice">orbital element set (TLE)</span> for
            catalog #25544 — a US Space Force / 18th Space Defense Squadron
            product redistributed by <span className="text-ice">CelesTrak</span>,
            public domain. A committed mirror is refreshed twice daily; the tab
            also attempts one optional live refresh from CelesTrak
            (CORS-enabled), falling back to the committed set on any failure.{" "}
            <span className="text-ice">Computed:</span> everything you see — the
            sub-satellite point, altitude (~420 km), inertial speed (~7.66 km/s),
            orbital period (~93 min), the ground track (split at the antimeridian),
            the footprint circle, whether the station is sunlit or in Earth&apos;s
            shadow, and the visible passes over your location — is propagated by{" "}
            <span className="text-ice">SGP4 via satellite.js</span> (MIT), the
            standard NORAD analytic model, not a reinvented one. The day/night
            terminator is the same NOAA solar geometry as the Earth tab.
          </p>
          <p className="mt-2">
            <span className="text-ice">Honesty on scale:</span> the ISS orbits at
            only ~1.07 Earth radii, so at{" "}
            <span className="text-ice">true scale</span> (the default) it hugs the
            globe — a real, striking fact, not a bug. An optional, clearly-labelled
            toggle exaggerates the altitude for visibility. The{" "}
            <span className="text-ice">TLE epoch and age</span> are shown
            prominently because SGP4 accuracy is ~1 km near the element epoch and
            degrades ~1–3 km/day; a week-old TLE can be tens of km off. A pass is
            flagged <span className="text-ice">naked-eye visible</span> only when
            the station is sunlit while the observer&apos;s sky is dark (below
            civil twilight) — the real &quot;Spot the Station&quot; criterion;
            daytime and shadow passes are labelled not visible. An optional
            independent live sub-point from{" "}
            <span className="text-ice">wheretheiss.at</span> is cross-checked
            against our own SGP4 position, and any large divergence is surfaced as
            TLE age, never hidden.
          </p>
          <p className="mt-3 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5 text-[12px] leading-relaxed">
            <span className="text-ice">Acknowledgment.</span> Orbital data: US
            Space Force (18 SDS) via CelesTrak (celestrak.org) — US-Government
            work, public domain (17 U.S.C. 105). Propagation: SGP4 via
            satellite.js (MIT). Live sub-point cross-check: wheretheiss.at. Earth
            imagery: NASA Blue Marble / Black Marble (public domain), as on the
            Earth tab.
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
            Jupiter&apos;s Moons — computed events, real geometry
          </h3>
          <p className="mt-2">
            The Jupiter&apos;s Moons tab predicts the mutual events of the four
            Galilean satellites (Io, Europa, Ganymede, Callisto) against
            Jupiter&apos;s disk. <span className="text-ice">Computed:</span> each
            moon&apos;s apparent position relative to Jupiter, and every{" "}
            <span className="text-ice">transit</span> (moon in front of the disk),{" "}
            <span className="text-ice">shadow transit</span> (its shadow on the
            cloud tops), <span className="text-ice">occultation</span> (moon behind
            the disk) and <span className="text-ice">eclipse</span> (moon in
            Jupiter&apos;s shadow), come from a published algorithm, Meeus,{" "}
            <span className="text-ice">Astronomical Algorithms</span> (2nd ed.),
            Chapter 44 (the low-accuracy method, from Lieske&apos;s E5 / Sampson
            theory), implemented in our own code with no runtime API, the same
            posture as Mars24, SGP4 and the Meeus lunar theory. A moon and its
            shadow are offset on the disk because the Sun and Earth view Jupiter
            from slightly different directions (the Sun-Jupiter-Earth phase angle):
            the gap is near zero at opposition and widest near quadrature, and that
            geometry is the point of the tab. Jupiter&apos;s sky position (whether
            it is above your horizon) is computed the same way.
          </p>
          <p className="mt-2">
            <span className="text-ice">Accuracy, stated:</span> the low-accuracy
            method places the moons to about a tenth of a Jupiter radius, so transit
            and occultation times are good to about a minute and eclipse and
            shadow-transit times can differ by a few minutes near quadrature. These
            are real, observable events (a shadow transit is a crisp black dot
            amateurs watch in small telescopes), but for critical or
            observing-grade timing the tab points to{" "}
            <span className="text-ice">JPL Horizons</span> and does not claim
            second-level precision. <span className="text-ice">Reused / real:</span>{" "}
            the Jupiter disk (NASA/JPL/SSI Cassini map, a snapshot, the belts
            drift) and the four moon maps (USGS Galileo/Voyager mosaics; Io and
            Ganymede color, Europa and Callisto grayscale) are the same
            public-domain textures from earlier phases, no new download.{" "}
            <span className="text-ice">Illustrative:</span> real Galilean moons are
            only ~1 arcsec across against Jupiter&apos;s ~40 arcsec, so the on-screen
            markers are enlarged for visibility (the positions and timings are to
            scale), and a toggle shows their true angular size.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Saturn&apos;s Moons — ring geometry and seasonal events
          </h3>
          <p className="mt-2">
            The Saturn&apos;s Moons tab is the twin of the Jupiter one, but its
            headline is <span className="text-ice">seasonality</span>. Saturn&apos;s
            seven major moons (Mimas, Enceladus, Tethys, Dione, Rhea, Titan,
            Iapetus) orbit in Saturn&apos;s equatorial plane, which is the ring
            plane, so they only cross in front of the disk (transit), pass behind it
            (occultation) or cast a shadow on the cloud tops (shadow transit) during
            the season around each <span className="text-ice">ring-plane
            crossing</span>, which recurs only about every 15 years. The last was{" "}
            <span className="text-ice">2025-05-06</span>; the rings are opening again
            toward the next, around <span className="text-ice">2038-2039</span>. That
            is why the events list is usually short right now, and the tab says so
            rather than faking events. <span className="text-ice">Computed:</span>{" "}
            each moon&apos;s apparent position is Kepler propagation of real JPL SSD
            &quot;Planetary Satellite Mean Orbital Elements&quot; (SAT441, J2000),
            rotated by Saturn&apos;s IAU pole into the plane of sky (via lib/planets
            for Saturn&apos;s geocentric direction), so the moons string along the
            same tilted ellipse as the rings. The ring opening geometry (B toward
            Earth, B&apos; toward the Sun, position angle P and the apparent ring
            axes) is the published{" "}
            <span className="text-ice">Meeus, Astronomical Algorithms</span> (2nd
            ed.), Chapter 45 method, validated against the book&apos;s 1992-12-16
            worked example. The four phenomena are tested against Saturn&apos;s{" "}
            <span className="text-ice">oblate</span> disk (Saturn is the most oblate
            planet, ~10% flattened), and the events panel is our own coarse
            client-side scan of those positions.
          </p>
          <p className="mt-2">
            <span className="text-ice">Accuracy, stated:</span> Kepler from mean
            elements ignores nodal and apsidal precession (Saturn&apos;s J2 and
            Titan), so positions are good to a fraction of a Saturn radius near
            J2000 and degrade over years; the event windows come from a coarse
            10-minute scan, so short events can be missed and timing is approximate.{" "}
            <span className="text-ice">Iapetus is the least accurate</span> (large,
            tilted, precessing Laplace-plane orbit). For observing-grade timing the
            tab points to <span className="text-ice">JPL Horizons</span> and{" "}
            <span className="text-ice">IMCCE PHESAT</span> and claims no
            second-level precision. <span className="text-ice">Reused / real:</span>{" "}
            Saturn and its rings use{" "}
            <span className="text-ice">Solar System Scope (solarsystemscope.com),
            CC BY 4.0</span> textures (an attribution obligation, credited here, in
            the ring panel and in the footer; the cloud map is artist-tuned and
            drawn as an unlit snapshot), and the seven moon disks are public-domain
            NASA/JPL/USGS/SSI Cassini global mosaics (Titan&apos;s is a near-IR,
            938 nm haze-penetrating product, not its visible orange atmosphere;
            Iapetus carries its real two-tone albedo).{" "}
            <span className="text-ice">Illustrative:</span> real Saturn moons are
            tiny against the disk and rings, so the on-screen markers are enlarged
            for visibility (positions and timings are to scale), with a toggle for
            their true angular size.
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
            Comets & asteroids — real orbits, factual hazards
          </h3>
          <p className="mt-2">
            The Comets &amp; Asteroids tab draws real comet and near-Earth-asteroid
            orbits from the <span className="text-ice">JPL Small-Body Database</span>{" "}
            around the Sun, with the planet orbits (Mercury→Jupiter) for reference.
            Every orbital element and physical parameter is a measured SBDB value;
            the classification (near-Earth group, comet family, Tisserand) is
            computed. Bound bodies trace{" "}
            <span className="text-ice">closed ellipses</span>; the hyperbolic and
            interstellar visitors —{" "}
            <span className="text-ice">1I/&apos;Oumuamua</span> and{" "}
            <span className="text-ice">2I/Borisov</span> — trace{" "}
            <span className="text-ice">open arcs</span>, labelled unbound. Radial
            distances are log-compressed (comet aphelia reach tens–thousands of AU)
            and, because the catalogue carries no epoch anchor, bodies are marked at
            perihelion rather than at a faked live position; comet tails are
            illustrative anti-sunward cues, not photometry.
          </p>
          <p className="mt-2">
            Hazard facts are stated plainly, never sensationalised. The{" "}
            <span className="text-ice">Potentially Hazardous Asteroid</span> (PHA)
            flag is the CNEOS definition — Earth MOID ≤ 0.05 AU and absolute
            magnitude H ≤ 22 — reported as the classification it is. The
            close-approach panel lists real CNEOS distances in lunar distances and
            km. <span className="text-ice">Apophis</span>&apos;s 13 April 2029 pass
            is a real close approach — about 31,600 km above Earth&apos;s surface
            (~0.099 lunar distances), bright enough to see with the naked eye — and
            its 2029 / 2036 / 2068 impact scenarios were{" "}
            <span className="text-ice">ruled out</span> after 2021 radar tracking;
            NASA removed Apophis from the Sentry risk list.
          </p>
          <p className="mt-2">
            Appearances follow the honesty rule. Most small bodies have never been
            imaged, so they are{" "}
            <span className="text-ice">illustrative procedural rocks</span>,
            labelled. A few carry real imagery: Eros, Vesta and Bennu as
            equirectangular NASA/USGS mosaics wrapped on a slightly-irregular sphere
            (public domain, shape approximated); Gaspra, Ida, Didymos and{" "}
            67P/Churyumov-Gerasimenko as flat single-view mission photos in the
            detail panel, not wrapped on a sphere. The 67P photo is{" "}
            <span className="text-ice">ESA/Rosetta/NAVCAM, CC BY-SA 3.0 IGO</span>;
            the others are NASA public domain.
          </p>
          <p className="mt-3 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5 text-[12px] leading-relaxed">
            <span className="text-ice">Acknowledgment.</span> Orbits, physical
            parameters and close approaches: NASA/JPL Small-Body Database (SBDB) and
            CNEOS Close-Approach Data — US-Government (NASA/JPL-Caltech) data, freely
            usable; courtesy credit given. Real imagery: NASA / JPL / USGS public
            domain for Eros, Vesta, Bennu, Gaspra, Ida and Didymos (NEAR, Dawn,
            OSIRIS-REx, Galileo, DART). 67P/Churyumov-Gerasimenko photo:{" "}
            ESA/Rosetta/NAVCAM, CC BY-SA 3.0 IGO.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Meteor showers — real catalog data, idealised rates
          </h3>
          <p className="mt-2">
            The Meteor Showers tab sits beside Comets &amp; Asteroids because a
            shower is the <span className="text-ice">debris of one of those bodies</span>:
            Earth ploughs through a stream shed by a comet or asteroid, and the
            particles&apos; parallel paths appear by perspective to diverge from a
            single point, the <span className="text-ice">radiant</span>.{" "}
            <span className="text-ice">Measured / catalog:</span> each shower&apos;s
            radiant RA/Dec (J2000), activity window, peak date, peak solar longitude,
            entry velocity (V∞) and parent body come from the{" "}
            <span className="text-ice">IAU Meteor Data Center</span> shower database
            (Jopek &amp; Kaňuchová 2017) and the{" "}
            <span className="text-ice">IMO Working List of Visual Meteor Showers</span>{" "}
            (2026 IMO Meteor Shower Calendar), cross-checked with the American Meteor
            Society. The radiants are plotted in the same J2000 celestial frame as the
            Night Sky.
          </p>
          <p className="mt-2">
            <span className="text-ice">ZHR is an idealised peak rate</span> — the
            zenithal hourly rate assumes the radiant at the zenith under a perfect,
            magnitude-6.5 dark sky, so real observed rates are{" "}
            <span className="text-ice">lower</span>. We say so everywhere and compute
            the honest first-order estimate — ZHR·sin(radiant altitude), scaled by an
            illustrative activity profile — for your location and time; a variable /
            outburst-driven shower carries no fixed ZHR and is labelled so, never
            invented. <span className="text-ice">Computed:</span> solar longitude
            λ☉, is-active / days-to-peak, the radiant&apos;s altitude and best
            viewing time, and the <span className="text-ice">moon phase at peak</span>{" "}
            (from the same Meeus lunar theory as the Moon tab) that tells you whether
            moonlight will wash the shower out. Peak dates{" "}
            <span className="text-ice">drift ~1 day per year</span>, so timing is
            keyed to solar longitude (stable), not the calendar. Parent bodies
            cross-link to Comets &amp; Asteroids only when that catalogue actually
            carries the object; the Geminids (asteroid 3200 Phaethon) and Quadrantids
            (asteroid 2003 EH1) are flagged as the unusual asteroid-parent cases.{" "}
            <span className="text-ice">Illustrative:</span> the drawn meteor streaks
            and the debris-stream diagram (real geometry, drawn particles).
          </p>
          <p className="mt-3 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5 text-[12px] leading-relaxed">
            <span className="text-ice">Acknowledgment.</span> Shower catalog
            (radiants, solar longitude, velocity, parent bodies): IAU Meteor Data
            Center shower database — Jopek &amp; Kaňuchová (2017), Planet. Space Sci.
            143, 3. Activity windows, peak dates, ZHR and population index: IMO
            Working List of Visual Meteor Showers (2026 IMO Meteor Shower Calendar,
            ed. J. Rendtel) — facts used and credited; the IMO Calendar itself is not
            redistributed (its terms are restrictive). Cross-checked with the American
            Meteor Society meteor-shower calendar.
          </p>

          <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Sun & space weather — real forecasts, attributed
          </h3>
          <p className="mt-2">
            The Sun tab reconnects to the project&apos;s honest-forecasting theme:
            space weather is a genuine operational forecasting domain, so we show{" "}
            <span className="text-ice">NOAA SWPC&apos;s own measurements and
            forecasts</span> and attribute them. We visualize them; we do not
            predict. The disk is real{" "}
            <span className="text-ice">NASA/SDO full-disk imagery</span> in six
            wavelengths — AIA 171 (~600,000 K corona), 193 (~1.2 MK, coronal
            holes), 211 (~2 MK active regions) and 304 Å (~50,000 K chromosphere /
            prominences), plus HMI continuum (visible photosphere, sunspots) and
            the HMI magnetogram (line-of-sight magnetic field). These are{" "}
            <span className="text-ice">square snapshots of the Sun&apos;s
            Earth-facing side</span> — not equirectangular maps, not live (the
            corona changes hour to hour), and the AIA colours are false-colour by
            wavelength — so they are rendered as the observed disk, labelled with
            each image&apos;s real observation time. A single snapshot does not
            rotate, so the disk does not spin.
          </p>
          <p className="mt-2">
            <span className="text-ice">Measured</span> signals are fetched{" "}
            <span className="text-ice">live client-side from NOAA SWPC</span>{" "}
            (public domain, CORS-enabled), with a committed snapshot as a
            defensive fallback and a live / snapshot badge either way: solar-wind
            speed and IMF Bz/Bt (DSCOVR/ACE at L1), estimated planetary Kp with the
            NOAA G-scale, GOES X-ray flux with the A/B/C/M/X flare class, and
            monthly F10.7 and sunspot number.{" "}
            <span className="text-ice">Forecast</span> signals are SWPC&apos;s own
            model output, tagged as theirs: the{" "}
            <span className="text-ice">OVATION aurora nowcast</span> and the
            predicted Solar Cycle 25 curve.{" "}
            <span className="text-ice">Computed</span> values are labelled derived
            — the flare class from the GOES flux, the G-scale from Kp, and the
            rough auroral-oval latitude from Kp (a rule of thumb, approximate). The
            solar-cycle chart plots the observed monthly count against SWPC&apos;s
            predicted curve: Cycle 25 ran hotter than the 2019 panel forecast
            (~115), peaking ~161 around late 2024, shown truthfully. The body facts
            (radius ~109 R⊕ / 695,700 km, T_eff 5772 K, Carrington rotation,
            differential rotation ~24.5→34 d) are IAU-2015 constants and lib/sun
            geometry.
          </p>
          <p className="mt-2">
            <span className="text-ice">Sunspot honesty:</span> two counts exist. We
            display NOAA&apos;s own public-domain sunspot number, not the
            International Sunspot Number from WDC-SILSO, whose CC BY-NC
            (NonCommercial) license we cannot accept for this project.
          </p>
          <p className="mt-3 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5 text-[12px] leading-relaxed">
            <span className="text-ice">Acknowledgment.</span> Imagery: NASA/SDO and
            the AIA, EVE and HMI science teams (public domain). Space-weather data
            and forecasts: NOAA Space Weather Prediction Center (public domain,
            17 U.S.C. 105). SILSO sunspot data (CC BY-NC) was not used.
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
            Night Sky — real stars, cultural figures
          </h3>
          <p className="mt-2">
            The Night Sky tab (the second &quot;Beyond&quot; world) is a real star
            map. <span className="text-ice">Measured:</span> about 9,000 stars at
            their real positions, apparent magnitudes, colours (B−V index),
            parallax distances and spectral types — the{" "}
            <span className="text-ice">HYG database v4.4</span> (compiled from
            Hipparcos, the Yale Bright Star Catalog and Gliese). Every star&apos;s
            direction on the celestial sphere is its real J2000 RA/Dec; its size
            comes from apparent magnitude and its colour is the real physical
            black-body colour of its temperature.{" "}
            <span className="text-ice">Computed:</span> the temperature from the
            B−V index (Ballesteros 2012) and the resulting colour, plus — in the{" "}
            <span className="text-ice">&quot;sky from your location&quot;</span>{" "}
            mode — the altitude/azimuth of every star for your latitude, longitude
            and time, from real local-sidereal-time astronomy (Meeus), so stars
            below your horizon are correctly hidden and the current LST is shown.{" "}
            <span className="text-ice">Cultural overlay:</span> the constellation
            stick figures. The stars are real measured objects, but the lines
            joining them into figures are a human construct (the modern IAU /
            Western set); other cultures draw the sky differently. The{" "}
            <span className="text-ice">Milky Way</span> backdrop is an ESO
            panorama in galactic coordinates, rotated into the equatorial frame
            using the standard IAU galactic pole (RA 192.859°, Dec +27.128°) and
            centre (RA 266.405°, Dec −28.936°) so its band registers with the real
            stars. <span className="text-ice">Messier</span> deep-sky objects
            (OpenNGC) are marked at their measured J2000 positions and coloured by
            type (galaxy / nebula / cluster); no deep-sky distances are shipped
            because OpenNGC has no single reliable value for every object. Epoch is
            J2000.0; proper motion and precession are ignored for present-day
            display (sub-arcminute over decades). Nulls are shown as &quot;not
            measured&quot;, never filled in.
          </p>
          <p className="mt-3 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5 text-[12px] leading-relaxed">
            <span className="text-ice">Acknowledgment.</span> Star data: HYG
            database v4.4, astronexus / David Nash, CC BY-SA 4.0 (Hipparcos / Yale
            BSC / Gliese). This subset shared under CC BY-SA 4.0. Constellation
            lines: Marc van der Sluys, &quot;ConstellationLines&quot;, CC BY 4.0
            (DOI 10.5281/zenodo.10397192). Deep-sky objects: OpenNGC, Mattia Verga,
            CC BY-SA 4.0. Star names: IAU WGSN (IAU-CSN). Milky Way: ESO/S. Brunier,
            CC BY 4.0.
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
              ["Jupiter's Galilean moon events: Meeus, Astronomical Algorithms Ch. 44", "https://en.wikipedia.org/wiki/Jean_Meeus"],
              ["Galilean event cross-check: JPL Horizons", "https://ssd.jpl.nasa.gov/horizons/"],
              ["Saturn moon positions: JPL SSD mean orbital elements (SAT441)", "https://ssd.jpl.nasa.gov/sats/elem/"],
              ["Saturn ring geometry (B/B'/P): Meeus, Astronomical Algorithms Ch. 45", "https://en.wikipedia.org/wiki/Jean_Meeus"],
              ["Saturn satellite event cross-check: IMCCE PHESAT", "https://www.imcce.fr/"],
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
              ["Small bodies: JPL Small-Body Database (SBDB)", "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html"],
              ["Close approaches: NASA/JPL CNEOS", "https://cneos.jpl.nasa.gov/"],
              ["Apophis 2029 (impact ruled out): CNEOS", "https://cneos.jpl.nasa.gov/apophis/"],
              ["Comet 67P photo: ESA/Rosetta/NAVCAM (CC BY-SA 3.0 IGO)", "https://www.esa.int/ESA_Multimedia/Sets/Rosetta_NavCam_images/(result_type)/images"],
              ["Asteroid imagery (Eros/Vesta/Bennu/Gaspra/Ida/Didymos): NASA/JPL/USGS (PD)", "https://astrogeology.usgs.gov/search"],
              ["Meteor showers: IAU Meteor Data Center (Jopek & Kaňuchová 2017)", "http://www.ta3.sk/IAUC22DB/MDC2022/Roje/roje_lista.php"],
              ["Meteor showers: IMO Working List (2026 IMO Meteor Shower Calendar)", "https://www.imo.net/files/meteor-shower/cal2026.pdf"],
              ["Meteor cross-check: American Meteor Society calendar", "https://www.amsmeteors.org/meteor-showers/meteor-shower-calendar/"],
              ["Exoplanets: NASA Exoplanet Archive (Caltech/IPAC)", "https://exoplanetarchive.ipac.caltech.edu/"],
              ["Exoplanet Archive PSCompPars: Christiansen et al. 2025", "https://exoplanetarchive.ipac.caltech.edu/docs/pscp_about.html"],
              ["Habitable zones: Kopparapu et al. 2013", "https://doi.org/10.1088/0004-637X/765/2/131"],
              ["Radius valley (composition): Fulton et al. 2017", "https://doi.org/10.3847/1538-3881/aa80eb"],
              ["WASP survey: Butters et al. 2010", "https://doi.org/10.1051/0004-6361/201015655"],
              ["Sun imagery: NASA/SDO (AIA/EVE/HMI teams)", "https://sdo.gsfc.nasa.gov/"],
              ["Space weather: NOAA SWPC", "https://www.swpc.noaa.gov/"],
              ["Aurora forecast: NOAA SWPC OVATION", "https://www.swpc.noaa.gov/products/aurora-30-minute-forecast"],
              ["Solar cycle: NOAA SWPC (observed + predicted)", "https://www.swpc.noaa.gov/products/solar-cycle-progression"],
              ["Star data: HYG database v4.4 (astronexus / David Nash, CC BY-SA 4.0)", "https://codeberg.org/astronexus/hyg"],
              ["Constellation lines: M. van der Sluys, CC BY 4.0 (DOI 10.5281/zenodo.10397192)", "https://doi.org/10.5281/zenodo.10397192"],
              ["Deep-sky objects: OpenNGC, Mattia Verga, CC BY-SA 4.0", "https://github.com/mattiaverga/OpenNGC"],
              ["Star names: IAU WGSN (IAU Catalog of Star Names)", "https://www.iau.org/public/themes/naming_stars/"],
              ["Milky Way panorama: ESO/S. Brunier, CC BY 4.0", "https://www.eso.org/public/images/eso0932a/"],
              ["ISS orbital data: US Space Force (18 SDS) via CelesTrak", "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544"],
              ["Propagation: SGP4 via satellite.js (MIT)", "https://github.com/shashwatak/satellite-js"],
              ["ISS live sub-point cross-check: wheretheiss.at", "https://wheretheiss.at/w/developer"],
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
