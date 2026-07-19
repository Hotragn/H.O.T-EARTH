<div align="center">

# H.O.T Earth

[![CI](https://github.com/Hotragn/H.O.T-EARTH/actions/workflows/ci.yml/badge.svg)](https://github.com/Hotragn/H.O.T-EARTH/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Built with Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Built with three.js](https://img.shields.io/badge/three.js-r185-000?logo=three.js&logoColor=white)](https://threejs.org/)
[![Stars](https://img.shields.io/github/stars/Hotragn/H.O.T-EARTH?style=social)](https://github.com/Hotragn/H.O.T-EARTH/stargazers)

### A living digital twin of Earth — real physics, real data, no fake numbers.

An interactive 3D globe with daily NASA satellite imagery, a physically-computed day/night terminator you can scrub through time, animated global wind from the latest GFS analysis, click-anywhere forecasts, and a "Living Earth" layer where 1,200 real cities light up along the actual terminator. Plus a **Mars** twin with real orbital mechanics and the measured Viking CO₂ cycle, and a **Virtual Earth** time machine that plays 6,000 years of real city growth across the planet.

[**▶ Live demo**](https://h-o-t-earth.vercel.app) &nbsp;·&nbsp; [Data sources](docs/DATA_SOURCES.md) &nbsp;·&nbsp; [Architecture](docs/ARCHITECTURE.md) &nbsp;·&nbsp; [Model card](model/output/MODEL_CARD.md) &nbsp;·&nbsp; [Contributing](CONTRIBUTING.md)

> **Run it locally in 30 seconds:** `git clone` → `npm install` → `npm run dev`. No keys, no config. See [Quickstart](#quickstart).

![H.O.T Earth — interactive digital twin](docs/media/hero.png)

<sub>Earth · Mars · Moon · Virtual Earth time machine — MIT licensed, no API keys required</sub>

<sub>⚠️ The image above is a placeholder title card — grab the real globe screenshot in 2 minutes via [docs/media/README.md](docs/media/README.md).</sub>

</div>

---

## What makes this different

Most "3D earth" projects are a spinning texture with decorative numbers. This one is wired to real data and real physics end to end, and it is honest about the line between the two:

- **The terminator is computed, not drawn.** `lib/solar.ts` implements the NOAA solar-position algorithm (solar declination + equation of time → subsolar point), unit-tested against known solstice/equinox values. Scrub the time control and day/night moves exactly as the real sun does.
- **The wind is real.** The animated flow is the latest NOAA/NCEP GFS 10 m analysis, refreshed 4×/day, advected by bilinear interpolation of the actual grid (antimeridian wrap included, unit-tested). Only the playback speed is exaggerated so motion is visible at globe scale — the vectors are real.
- **The imagery is today's.** Daily NASA GIBS/Worldview satellite layers — true color, land-surface temperature, precipitation — proxied and cached, walking back a day when a layer hasn't published yet.
- **The forecast model reports honest, held-out accuracy.** A transparent baseline validated on a strict 2025 temporal holdout across 20 cities, with persistence as the reference. It **beats persistence by 9.6% / 15.2% / 17.8%** of MAE at 24/48/72 h — and the [model card](model/output/MODEL_CARD.md) states plainly that it is an educational baseline, **not** a rival to national weather services.
- **Anything simulated is labeled as simulated,** in the UI, right where it appears.
- **No API keys, anywhere.** Every data source is free and keyless. Clone, install, run.

## Features

| | |
|---|---|
| 🌍 **Interactive globe** | react-three-fiber sphere, orbit/zoom, starfield, sun-modulated atmosphere rim |
| 🛰️ **Live NASA layers** | true color · land-surface temp · precipitation · Blue Marble / Black Marble base |
| 🌗 **Physical day/night** | real subsolar point, twilight band to −12°, ±24 h time scrubber |
| 🌬️ **Global wind** | GFS 10 m analysis as GPU-friendly particle flow, refreshed every 6 h |
| 📍 **Click-anywhere forecast** | tap the globe → live 7-day Open-Meteo forecast for that exact point |
| 🏙️ **Living Earth tab** | 1,200 real cities glowing along the terminator; live per-city weather; a clearly-labeled activity simulation from local solar time + population |
| 📊 **Honest forecast baseline** | 20-city ridge model, validated on held-out 2025 data; coefficients exported and fully reproducible |
| 🔴 **Mars tab** | real Mars24 orbital mechanics (Ls, season, Mars clock), computed Mars terminator, measured Viking CO₂ pressure cycle, dust-storm-season climatology, public-domain USGS mosaic |
| ⏳ **Virtual Earth tab** | deep-zoom time machine: 1,730 real cities grow over 6,000 years (Reba et al.), precession-shifted night sky, world population, dated events incl. the World Wars |
| 🌑 **Moon tab** | Meeus-computed phase, illumination, and optical libration; real terminator; LRO Diviner surface-temperature swing (~392 K → ~95 K). No atmosphere, no faked weather |
| 🪐 **Solar System tab** | Keplerian orrery (real orbits) + focus globes for Mercury→Neptune: true axial tilts, Saturn's rings to scale, measured gas-giant zonal winds, Neptune's record gales |
| 🌙 **Moons tab** | major moons by parent with mini-orreries + the live 1:2:4 Laplace resonance; Io volcanism, ocean worlds, Titan's real methane weather, retrograde Triton — measured phenomena only |
| ❄️ **Dwarf planets tab** | trans-Neptunian orrery + Pluto/Charon/Ceres real maps and the three never-visited worlds shown as honest illustrative spheres; Haumea's real triaxial shape + ring |
| ✨ **Exoplanets tab** | 62 real systems from the NASA Exoplanet Archive with to-scale architectures, computed habitable zones, and a Solar-System size comparison; measured parameters, honestly illustrative appearances |
| ☄️ **Comets & asteroids tab** | 45 real JPL small bodies on live animated orbits — interstellar hyperbolic passes, anti-sunward comet tails, factual CNEOS close approaches; real maps for visited bodies, illustrative elsewhere |
| 🔆 **Sun & space-weather tab** | the Sun in six SDO wavelengths + live NOAA SWPC space weather (solar wind, Kp, flares, aurora forecast) + the Solar Cycle 25 chart; measured data and attributed SWPC forecasts, never our own |
| 🌌 **Night-sky tab** | 9,029 real stars (sized by magnitude, colored from measured B–V), 88 constellations + 110 Messier objects + the aligned Milky Way, and a real "sky from your location right now" planetarium mode |
| 💫 **Meteor-showers tab** | 37 real showers (IAU/IMO) — radiants on the sky, a year calendar, "tonight/next up", parent-body links to the comets tab, moon-phase-at-peak; honest ZHR vs observed rate |
| 🛰️ **ISS tracker tab** | the live ISS over the globe via real TLE + SGP4 (true altitude), ground track, sunlit/shadow, and visible passes over your location; element-set age shown, refreshed twice daily |
| 🔭 **Jupiter's moons tab** | the four Galilean moons in a telescope plane-of-sky view at real Meeus positions — live shadow transits (the black dots), eclipses and occultations, a scrub to watch a shadow cross the disk, a predicted-events table, and whether Jupiter is up from your location; times honest to minutes, marker sizes labeled as exaggerated |
| 🪐 **Saturn's moons tab** | the seven major moons strung along Saturn's real tilted rings at cited JPL positions, with the honest headline that shadow transits only cluster near each ~15-year ring-plane crossing (last May 2025); a ring-tilt panel, a coarse events scan, a scrubber spanning both the moons' days and the rings' years, and whether Saturn is up from your location |

## Quickstart

```bash
git clone https://github.com/Hotragn/H.O.T-EARTH.git
cd H.O.T-EARTH
npm install
npm run dev      # → http://localhost:3000
```

That's it — no `.env`, no keys, no accounts. Other commands:

```bash
npm run build                     # production build (deploys to Vercel with zero config)
npx vitest run                    # 86 unit tests: solar, geo, wind, activity, Mars24, precession, chrono
python scripts/wind/fetch_wind.py # regenerate the wind field locally (needs requests + numpy)
```

## Forecast model — real numbers

Pooled over 20 cities, 2025 holdout, ~175k samples per lead. Skill = `1 − MAE_model / MAE_persistence`.

| Lead | Persistence MAE | Climatology MAE | **Ridge MAE** | Ridge skill |
|---|---|---|---|---|
| t+24 h | 1.87 °C | 2.47 °C | **1.69 °C** | **+9.6%** |
| t+48 h | 2.46 °C | 2.47 °C | **2.09 °C** | **+15.2%** |
| t+72 h | 2.73 °C | 2.47 °C | **2.25 °C** | **+17.8%** |

Easy climates score well (Lagos 0.59 °C at 24 h); hard continental ones don't (Denver 2.96 °C) — exactly as physics predicts. Full per-city results, limitations, and reproduction steps: [model card](model/output/MODEL_CARD.md).

## Architecture

The whole thing is built around one constraint: **Vercel hosts only the frontend and thin caching proxies — all heavy compute happens ahead of time, elsewhere.**

- **GitHub Actions cron** decodes GFS GRIB2 → compact JSON every 6 h (pure-Python decoder, no binary deps).
- **Offline Python** trains and validates the forecast model; the browser just runs the exported coefficients.
- **The browser** does solar geometry, particle advection, and model inference — all cheap.
- **Open-Meteo & NASA GIBS** are called directly (CORS, keyless); GIBS snapshots are cached through one Next.js route.

Full reasoning, including why not to run physics on Vercel and what we'd do if we ever needed live server compute: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind v4 · react-three-fiber + drei · three.js · Vitest.

## Data & licensing

Every dataset, its license, and how it's used is logged in [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) (verified against official sources). Summary: NASA GIBS (CC0), NOAA GFS & Natural Earth (US Gov public domain), Open-Meteo (CC-BY 4.0, attribution shown in-app). No source with unclear or restrictive terms is used.

## Roadmap

- [x] **Phase 1 — Earth.** Live globe, real data layers, physical terminator, wind, forecasts, Living Earth cities.
- [x] **Phase 2 — Mars.** Real Mars24 orbital mechanics (Ls, seasons, Mars clock), a physically computed Mars terminator, the measured Viking seasonal CO₂ pressure cycle, and dust-storm-*season* climatology — on a public-domain USGS Viking mosaic.
- [x] **Virtual Earth — time machine.** A deep-zoomable Earth played through history: 1,730 real cities appearing and growing over 6,000 years (Reba et al. 2016), a precession-shifted night sky, world population, and dated events including the World Wars.
- [x] **Phase 3 — Moon.** No atmosphere, so no fake weather — Meeus-computed phase/illumination, optical libration, a real terminator, and LRO Diviner surface-temperature swings (~392 K day → ~95 K night).
- [x] **Solar System — the other planets.** A Keplerian orrery (real orbits, honestly compressed for visibility) plus click-to-focus globes for Mercury → Neptune: real axial tilts (Uranus on its side), Saturn's rings to scale, measured zonal-wind profiles for the giants, and Neptune's record winds. Orbital mechanics for all; measured data only where it exists; no invented weather.
- [x] **Major moons.** Per-planet mini-orreries (Io whipping around, Triton retrograde) with the live Io–Europa–Ganymede 1:2:4 Laplace-resonance readout, plus focus globes for the nine major moons: Io's volcanism, Europa/Enceladus's subsurface oceans, **Titan's real methane weather** (the one moon that has weather), Triton's nitrogen geysers. Tidal locking and measured phenomena only — texture caveats (Titan's near-IR surface, Triton's synthetic northern hemisphere) surfaced in-app.
- [x] **Dwarf planets.** A trans-Neptunian orrery (real eccentric orbits against a Neptune reference ring; Pluto's 3:2 resonance called out) plus detail views for Pluto, Charon, Ceres, Eris, Haumea, Makemake. Real New Horizons/Dawn maps for the three visited worlds (Pluto's glaciers, Ceres's Occator spots, the Pluto–Charon binary); the three never-visited worlds are **clearly-labeled illustrative spheres — no faked imagery**. Haumea rendered as its real self: a triaxial ellipsoid with a ring.
- [x] **Exoplanets (Beyond).** A system explorer for 62 real systems / 171 planets from the NASA Exoplanet Archive: each system's architecture drawn to scale with its **habitable zone** shaded (computed from the star's luminosity) and our Solar System overlaid for comparison. Per-planet measured parameters (size, mass, period, temperature, distance in light-years, discovery method); appearances are **illustrative — no exoplanet has surface imagery**, and the 7 directly-imaged planets are labeled as unresolved points of light, not maps.
- [x] **Comets & asteroids.** 45 real objects from JPL's Small-Body Database threaded through the inner Solar System on **live animated orbits** (propagated from real elements): closed loops for bound bodies, single hyperbolic passes for the interstellar visitors ('Oumuamua, Borisov), anti-sunward comet tails that flare near the Sun, and a factual close-approaches panel from CNEOS (Apophis's 2029 pass stated straight — naked-eye visible, impact ruled out). Real NASA maps for visited bodies (Eros, Vesta, Bennu), illustrative lumps for the rest; hazard data is factual, never sensational.
- [x] **Sun & space weather.** The Sun in six NASA SDO wavelengths behind a layer switcher (corona to sunspots to magnetic field), with **live space weather fetched in-browser from NOAA SWPC** — solar wind, planetary Kp and storm scale, X-ray flare class, and the aurora forecast — plus the Solar Cycle 25 sunspot chart (shown honestly running hotter than its 2019 forecast). Space weather is a real forecast domain, so we visualize SWPC's own forecasts and attribute them; we don't invent our own.
- [x] **Night sky (Beyond).** A real celestial sphere: 9,029 stars from the HYG catalog (Hipparcos/Gaia), sized by measured magnitude and colored from their measured B–V index, with the 88 constellation figures (a labeled cultural overlay — the stars are real, the lines are ours), 110 Messier deep-sky objects, and the ESO Milky Way panorama rotated into equatorial coordinates so the band lines up with the real star density. A **"sky from your location, right now"** planetarium mode uses the same real observer geometry (local sidereal time) that drives every terminator in the app.
- [x] **Meteor showers.** 37 real showers (IAU Meteor Data Center / IMO) with radiants plotted on the celestial sphere, a year calendar, and a "tonight / next up" panel — knitting three tabs together: each parent body links to the Comets & Asteroids tab (Perseids → Swift-Tuttle, Geminids → asteroid Phaethon, Orionids → Halley), and the moon phase at each peak comes from the Moon tab so you know if moonlight will wash it out. ZHR is labeled as the idealized rate; a real altitude-corrected estimate sits beside it.
- [x] **ISS tracker.** The International Space Station, live: a real orbital element set (public-domain US Space Force TLE via CelesTrak, refreshed twice daily by a GitHub Action) propagated in-browser by **SGP4** to show the station over the Blue Marble globe at its true altitude — which honestly *hugs* the Earth — with its ground track, sunlit/shadow state, and the headline **"visible passes over your location"** (rise/set/max-elevation, computed as the ISS sunlit while you're in darkness). The element-set epoch and age are shown, since SGP4 accuracy degrades with TLE age.
- [x] **Jupiter's moons.** The four Galilean moons (Io, Europa, Ganymede, Callisto) in a telescope plane-of-sky view at their real apparent positions computed from **Meeus's Chapter 44** — with the classic black **shadow transits** falling on the sunlit disk, plus eclipses, transits and occultations detected against Jupiter's oblate disk and umbra. A time scrubber lets you watch a shadow cross; an events table predicts the next transits/eclipses (times honest to ~a minute, a few minutes near quadrature, with a JPL Horizons pointer for observing-grade timing); and observer visibility (via the same celestial geometry that drives the star map) tells you whether Jupiter is above your horizon right now. Moon markers are enlarged for legibility with a true-angular-size toggle, clearly labeled; the method is validated against Meeus's 1992 worked example.
- [x] **Saturn's moons.** Saturn's seven major moons (Mimas, Enceladus, Tethys, Dione, Rhea, Titan, Iapetus) in a telescope plane-of-sky view, at their real positions from the cited **JPL SSD mean elements** (SAT441), oriented by Saturn's real pole and strung along the **tilted rings** (ring geometry from **Meeus's Chapter 45**, validated against the book's 1992 example). The honest headline is *seasonality*: unlike Jupiter, Saturn's moon disk-transits and shadow-transits happen only in a season around each ~15-year ring-plane crossing (the last was 2025-05-06, the next is ~2038), so the tab reads the live ring opening and tells you why the events list is short right now rather than faking events. A coarse events scan (labeled approximate, with a JPL Horizons / IMCCE PHESAT pointer, Iapetus flagged least accurate), a scrubber that spans both the moons' days and the rings' years, and observer visibility. Saturn and ring textures are Solar System Scope (CC-BY 4.0); the moon maps are public-domain Cassini. *(this release)*

Next up (optional): richer per-body measured layers as open data allows.

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). The honesty rule is non-negotiable: every number on screen traces to a data source or a documented calculation.

## Cite this project

If H.O.T Earth is useful in your research, teaching, or writing, please cite it. A machine-readable [`CITATION.cff`](CITATION.cff) is included, so GitHub's "Cite this repository" button generates APA/BibTeX for you.

## License & attribution

Code: [MIT](LICENSE). Imagery courtesy NASA EOSDIS GIBS / Worldview and NASA Earth Observatory. Weather data by [Open-Meteo.com](https://open-meteo.com/) (CC-BY 4.0). Wind from NOAA/NCEP GFS (public domain). Cities from [Natural Earth](https://www.naturalearthdata.com/) (public domain) and Reba, Reitsma & Seto 2016 (CC-BY 4.0). ERA5 via Open-Meteo — Copernicus Climate Change Service / ECMWF (DOI 10.24381/cds.adbb2d47). Planetary/lunar maps from NASA/JPL/USGS (public domain); Saturn, Uranus, Neptune and Saturn-ring textures by [Solar System Scope](https://www.solarsystemscope.com/) (CC-BY 4.0). Zonal winds: Barrado-Izagirre et al. 2013 (Jupiter), García-Melendo et al. 2011 (Saturn), Sromovsky et al. 1993 (Neptune). Full per-source detail in [docs/](docs/). Not affiliated with or endorsed by NASA, NOAA, or JPL.

## Star history

If this project is useful to you, a star helps others find it.

[![Star History Chart](https://api.star-history.com/svg?repos=Hotragn/H.O.T-EARTH&type=Date)](https://star-history.com/#Hotragn/H.O.T-EARTH&Date)
