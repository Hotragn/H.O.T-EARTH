# Dwarf Planets Physics & Honest-Representation Methodology (Phase 6)

Companion to `docs/DWARF_PLANETS_DATA_SOURCES.md`. Same non-negotiable bar as Earth, Mars, the Moon, the other planets and the major moons (`physics-env-simulation` skill): **real physics and real data, or it doesn't ship. No invented numbers, no invented pictures.** This doc states, per body, exactly what is **MEASURED**, what is **COMPUTED**, and what must remain **ILLUSTRATIVE** — and it is blunt about the two facts that dominate this phase: dwarf planets have **no weather**, and **three of the six have never been photographed.**

Verification date: **2026-07-10**. Bodies: the five IAU dwarf planets **Pluto, Ceres, Eris, Haumea, Makemake** plus Pluto's large moon **Charon**.

## The overriding honesty rules for this phase

**1. Dwarf planets have NO weather.** No global weather system → no wind, clouds, rain, pressure systems or storms, and we invent none. (Pluto has a thin N2 atmosphere with haze, and Ceres/Charon have thin exospheres or none — none of this is a "weather" layer.) The honest, still-remarkable content is:

- **Orbital mechanics (COMPUTED):** highly inclined, highly eccentric heliocentric orbits (unlike the near-circular major planets); Pluto's **3:2 resonance** with Neptune and Neptune-crossing orbit; the **Pluto–Charon binary** (barycenter outside Pluto, mutual tidal lock); Haumea's **fast ~3.9 h spin** and **ring**.
- **Measured physical facts (MEASURED):** Pluto's nitrogen glaciers + hazy atmosphere + tholins; Charon's Mordor Macula + canyons; Ceres' Occator salt spots + Ahuna Mons + subsurface brine; Eris' mass/albedo; Haumea's shape/ring/moons; Makemake's methane ice.
- **Real textures (STATIC) — but only for the three that were visited.**

**2. Only three of the six have ever been imaged up close.** **Pluto and Charon** (New Horizons flyby, 2015-07-14) and **Ceres** (Dawn orbiter, 2015–2018) have **real, public-domain surface mosaics**. **Eris, Haumea and Makemake have NEVER been visited** — everything known about them comes from **stellar occultations and photometry**, not pictures. There is **no surface map** for them at any license. They must be rendered as **clearly-labeled ILLUSTRATIVE tinted spheres** (Haumea as its real triaxial + ring *geometry*), never implying real imagery. **Invent nothing.**

## Two structural facts that shape everything

1. **Distance and orbit dominate the story.** These bodies span ~2.8 au (Ceres, in the asteroid belt) to ~68 au (Eris, deep in the scattered disk). Their orbits are **eccentric (e up to 0.44) and highly inclined (i 10–44°)** — a genuine visual contrast with the flat, near-circular major-planet orbits. Pluto's orbit even **crosses Neptune's**, but the **3:2 mean-motion resonance** keeps them from ever approaching. This orbital geometry is the honest, computable "dynamic" layer for worlds with no weather.
2. **Tidal locking and binarity at Pluto.** Pluto and Charon are **mutually tidally locked** (each keeps one face to the other; rotation = 6.387 d orbit), and their **barycenter lies outside Pluto** — a true **double (binary) system**, not a simple planet-moon. Haumea, by contrast, spins in **~3.9 h** — so fast it is pulled into an elongated triaxial ellipsoid and carries a ring. These are computable, animatable facts straight from `constants.json`.

## Per-body: measured vs computed vs illustrative

### Pluto — MEASURED surface + atmosphere; COMPUTED resonant orbit; REAL map
- **MEASURED:** N2/CH4/CO ices; **nitrogen-ice glaciers** in Sputnik Planitia (left lobe of Tombaugh Regio, the "heart"); a thin **N2 atmosphere with ~20+ haze layers** (Gladstone 2016); reddish tholins; surface **~44 K** (New Horizons, Stern et al. 2015). Five moons.
- **COMPUTED:** heliocentric orbit; the **3:2 resonance** with Neptune (orbit-crossing, never approaching); rotation/tidal lock with Charon.
- **STATIC (real):** USGS New Horizons LORRI–MVIC grayscale mosaic — **encounter hemisphere hi-res, far side low-res** (flyby coverage).
- **NO weather** (the thin N2 atmosphere + haze are shown as measured features, not a forecastable weather layer).

### Charon — MEASURED polar cap + canyons; COMPUTED binary orbit; REAL map
- **MEASURED:** **Mordor Macula** (dark reddish north polar cap of tholins from Pluto's escaping gases, Grundy 2016); giant canyons (Serenity/Argo Chasma, to ~9 km deep); ~53 K.
- **COMPUTED:** orbit around Pluto; **mutual tidal lock**; the **Pluto–Charon barycenter outside Pluto** → binary.
- **STATIC (real):** USGS New Horizons grayscale mosaic (same flyby caveat).
- **NO weather.**

### Ceres — MEASURED salts + cryovolcanism; COMPUTED orbit; REAL map
- **MEASURED:** **Occator bright spots = sodium-carbonate salts** from cryovolcanic brine (Nathues 2015 / De Sanctis 2016); **Ahuna Mons** cryovolcano (Ruesch 2016); possible **subsurface brine reservoir** (Dawn 2020); ~9.07 h rotation; ~168 K daytime max.
- **COMPUTED:** heliocentric orbit (a 2.77 au, in the asteroid belt); rotation.
- **STATIC (real):** USGS Dawn FC clear-filter **near-grayscale** mosaic (real Ceres is dark, near-neutral gray, albedo ~0.09).
- **NO weather.**

### Eris — MEASURED mass/size/albedo (occultation); COMPUTED orbit; ILLUSTRATIVE appearance
- **MEASURED (not imaged):** **most massive dwarf planet** (~27% > Pluto, from Dysnomia's orbit, Brown & Schaller 2007) yet slightly smaller in diameter; diameter **2326 km**, geometric albedo **~0.96** (Sicardy 2011, stellar occultation); moon Dysnomia.
- **COMPUTED:** very distant, eccentric orbit (a 68 au, e 0.44, perihelion 38 au), highly inclined (i 44°); currently near aphelion.
- **ILLUSTRATIVE:** never visited — **no surface map.** Render a bright near-white tinted sphere, labeled illustrative.
- **NO weather** (near aphelion, its atmosphere is frozen to the surface).

### Haumea — MEASURED shape/ring/moons (occultation); COMPUTED fast spin; ILLUSTRATIVE surface
- **MEASURED (not imaged):** extreme triaxial ellipsoid **~2100 × 1680 × 1074 km**; a **RING** (radius ~2287 km, width ~70 km) — the **first known around a TNO / dwarf planet** (Ortiz 2017); two moons (Hi'iaka, Namaka) giving mass ~3.95 × 10²¹ kg; **crystalline water-ice** surface (66–80%).
- **COMPUTED:** heliocentric orbit; **very fast ~3.9154 h rotation** (the physical cause of the elongation); the ring's 3:1 spin resonance.
- **ILLUSTRATIVE (surface only):** never visited — no surface map. But the **triaxial shape and the ring are REAL, measured geometry** — render those faithfully; leave the *surface* a plain white/ice tint, labeled illustrative.
- **NO weather.**

### Makemake — MEASURED ices/albedo/no-atmosphere (occultation); COMPUTED orbit; ILLUSTRATIVE appearance
- **MEASURED (not imaged):** ~**1430 km**, albedo **~0.82**; **methane + ethane ice** + tholins; **no substantial atmosphere** (occultation upper limit ~4–12 nbar, Ortiz 2012 — a real, informative *non-detection*); one small moon (S/2015 (136472) 1) giving mass ~2.69 × 10²¹ kg.
- **COMPUTED:** heliocentric orbit (a 45.6 au, e 0.16, i 29°); rotation **uncertain** (~22.83 h SBDB, flagged; 11.4 h / 7.77 h alternatives).
- **ILLUSTRATIVE:** never visited — no surface map. Render a bright, slightly reddish tinted sphere, labeled illustrative.
- **NO weather** (the JWST 2025 gaseous-methane hint is possible transient outgassing, not a bound atmosphere or weather — flagged, not asserted).

## Orbital mechanics: the honest "dynamic" content (COMPUTED, we own the maths)

For bodies with no weather, the real, computable dynamics are their motion:

- **Highly inclined, eccentric heliocentric orbits.** Straight from `constants.json` (a, e, i). Rendering these to scale — Ceres in the belt, Pluto crossing Neptune, Eris on a steeply-tilted 68-au ellipse — is honest and striking, and needs only Kepler's laws.
- **Pluto's 3:2 resonance with Neptune.** Pluto completes 2 orbits per Neptune's 3; the orbits cross but the resonance guarantees they never closely approach. Computable/animatable from the periods in `constants.json` (Pluto ~248 yr vs Neptune ~165 yr).
- **The Pluto–Charon binary.** Both bodies orbit a common barycenter that lies **outside Pluto**; they are mutually tidally locked (rotation = 6.387 d orbit). Animate both about the barycenter — the clearest way to show it is a true double system, not a planet with a moon. Uses the same terminator/illumination machinery as Earth (`lib/solar.ts`) and the Moon (Meeus).
- **Haumea's fast spin + ring.** ~3.9 h rotation of an elongated ellipsoid, with a ring in a 3:1 spin resonance — a real, animatable geometry (shape and ring are measured; only the surface texture is absent).
- **Phases / illumination about the Sun:** each body shows a lit/dark side driven by Sun-body geometry — computed as elsewhere. No runtime API; JPL Horizons/SBDB are offline/build-time references only, per `DATA_SOURCES.md` §5.

All of this is real, unencumbered orbital physics — the honest "dynamic" layer for worlds that have no weather.

## Measured vs computed vs illustrative — the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Pluto N2 glaciers / haze atmosphere / tholins / 44 K | **Measured** | "Measured — New Horizons 2015; [citation]" |
| Charon Mordor Macula / canyons | **Measured** | "Measured — New Horizons 2015 (Grundy et al. 2016)" |
| Ceres Occator salts / Ahuna Mons / subsurface brine | **Measured** | "Measured — Dawn 2015–18; [citation]" |
| Eris mass/size/albedo; Makemake ices/albedo/no-atmosphere; Haumea shape/ring/moons | **Measured (occultation/photometry, NOT imaging)** | "Measured — stellar occultation; [citation]" |
| Heliocentric orbits, 3:2 resonance, Pluto–Charon binary, Haumea spin/ring | **Computed** | "Computed — orbital mechanics" |
| Pluto/Charon/Ceres surface textures | **Static basemap (real)** | "[Mission] imagery (public domain)" — Pluto/Charon "encounter hemisphere hi-res, far side low-res, grayscale"; Ceres "clear-filter near-grayscale" |
| Eris/Haumea/Makemake appearance | **Illustrative (NOT an observation)** | "Illustrative — never visited; no surface map" |
| Eris/Makemake rotation; Makemake atmosphere; distant-body temperatures | **Uncertain / flagged** | "Uncertain — SBDB flag" / "estimate" |

Rules carried over from Earth/Mars/Moon/planets/moons, unchanged:
- Every number on screen names its category and source.
- No invented values; if we lack measured/published data for something, we show no number for it.
- Computed orbital geometry and measured facts are never presented as live readings or forecasts.
- **No fabricated weather anywhere** — dwarf planets have none, and we do not invent it (Pluto's haze and Ceres' brine are shown as measured features, not a weather layer).
- **No fabricated imagery anywhere.** Pluto/Charon/Ceres show real mosaics (with honesty labels for resolution/colour); **Eris/Haumea/Makemake show clearly-labeled illustrative spheres and NEVER a map that implies real imagery.**

## What is honestly showable this phase (crisp per-body statement)

- **Pluto:** MEASURED nitrogen glaciers (Sputnik Planitia) + hazy N2 atmosphere + tholins + 44 K; COMPUTED 3:2-resonant Neptune-crossing orbit + Charon lock; STATIC **real** grayscale map (encounter hemisphere hi-res, far side low-res). No weather.
- **Charon:** MEASURED Mordor Macula + giant canyons; COMPUTED binary orbit (barycenter outside Pluto) + mutual tidal lock; STATIC **real** grayscale map. No weather.
- **Ceres:** MEASURED Occator salt spots + Ahuna Mons cryovolcano + subsurface brine + 9.07 h spin; COMPUTED asteroid-belt orbit; STATIC **real** clear-filter near-grayscale map. No weather.
- **Eris:** MEASURED (occultation) most-massive dwarf + 2326 km + albedo 0.96 + Dysnomia; COMPUTED distant eccentric inclined orbit; **ILLUSTRATIVE** appearance (no map). No weather.
- **Haumea:** MEASURED (occultation) triaxial 2100×1680×1074 km + ring (first TNO ring) + 2 moons + crystalline ice; COMPUTED fast 3.9 h spin + orbit; **ILLUSTRATIVE** surface (real shape + ring geometry). No weather.
- **Makemake:** MEASURED (occultation) 1430 km + albedo 0.82 + methane ice + no substantial atmosphere + 1 moon; COMPUTED orbit + (uncertain) rotation; **ILLUSTRATIVE** appearance (no map). No weather.

What we deliberately do **not** show: a live feed or forecast for any body; invented weather, wind, clouds or storms on any dwarf planet; a **surface map for Eris, Haumea or Makemake** (none exists — they get labeled illustrative spheres); the Pluto/Charon far side presented as high-fidelity (it is low-res); or a Makemake "atmosphere" (there is no substantial one). Those would be dishonest — and for these worlds the honest, still-astonishing content is orbital mechanics + measured physical facts + real textures **where they exist.**
