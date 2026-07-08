# Major Moons Physics & Honest-Representation Methodology (Phase 5)

Companion to `docs/MOONS_DATA_SOURCES.md`. Same non-negotiable bar as Earth, Mars, the Moon and the other planets (`physics-env-simulation` skill): **real physics and real data, or it doesn't ship. No invented numbers.** This doc states, per moon, exactly what is **MEASURED**, what is **COMPUTED**, and what must remain **STATIC / partial** — and it is blunt about the fact that, for all of these bodies except **Titan**, there is **no weather**.

Verification date: **2026-07-08**. Bodies: **Io, Europa, Ganymede, Callisto** (Jupiter); **Titan, Enceladus, Mimas, Iapetus** (Saturn); **Triton** (Neptune). Earth's Moon is Phase 3 (`MOON_PHYSICS.md`) and is not redone.

## The overriding honesty rule for this phase

**Most moons have NO weather.** No global atmosphere → no wind, clouds, rain, pressure systems, or storms — and we invent none. The honest, still-remarkable content is:

- **Orbital mechanics (COMPUTED):** every one of these moons is **tidally locked** (synchronous rotation → one face to its parent); Io:Europa:Ganymede are in the **1:2:4 Laplace resonance**; Triton is on a **retrograde** orbit (a captured object).
- **Measured phenomena (MEASURED):** Io's volcanism, Europa's/Ganymede's/Enceladus'/Callisto's subsurface oceans, Ganymede's magnetic field, Callisto's cratering, Enceladus' plumes, Triton's nitrogen geysers, Iapetus' albedo dichotomy, Mimas' giant crater.
- **Real textures (STATIC):** public-domain USGS mission mosaics.

**The single genuine exception is Titan**, which has a thick N2 atmosphere and an **active methane cycle** (seas, lakes, rain, rivers). Titan's weather is **real and measured** (Cassini/Huygens) and is presented as such — it is the only place in this phase where a "weather" framing is honest.

## Two structural facts that shape everything

1. **Tidal locking is the norm.** Each moon's rotation period equals its orbital period (`constants.json`: `tidally_locked:true`, `rotation_period_days == orbital_period_days`). So there is no independent "length of day," and the sub-parent point stays fixed (wandering only slightly by orbital libration). The "day/night" that matters is the moon's slow revolution around its parent, not a fast spin.
2. **Tidal heating is the engine of activity.** For Io, Europa and Enceladus, the observable activity (volcanoes, young ice, plumes) is powered by **tidal flexing**, not sunlight or radiogenic heat alone. At Io/Europa/Ganymede this is sustained by the **1:2:4 Laplace resonance**, which locks in the orbital eccentricity that keeps the tides from circularizing away. This is the honest physical story that ties the constants to the phenomena.

## Per-moon: measured vs computed vs static

### Io — MEASURED hyper-volcanism; COMPUTED resonant orbit
- **MEASURED:** most volcanically active body in the solar system — ~400 volcanic centres (>150 seen erupting), global tidal heat output ~10¹⁴ W (~2 W/m², ~40× Earth's; Veeder et al. 2012), plumes to ~390 km (Pele), silicate lava vents ~1300–1600 K. All from Voyager/Galileo/Juno + ground-based.
- **COMPUTED:** synchronous rotation; orbital position; the **1:2:4 Laplace resonance** (resonance member 1) that forces the eccentricity driving the tidal heating.
- **STATIC:** USGS Galileo/Voyager color mosaic (polar gaps interpolated).
- **NO weather.**

### Europa — MEASURED ocean + young ice; COMPUTED orbit; plumes DEBATED
- **MEASURED:** subsurface salt-water ocean (Galileo induced magnetic field, Kivelson et al. 2000; ~2× Earth's water); young, nearly crater-free ice (age ~40–90 Myr); chaos terrain.
- **DEBATED:** possible water-vapour plumes (HST; Roth 2014 / Sparks 2016–2017) — **not confirmed.** Labeled debated, never asserted.
- **COMPUTED:** synchronous rotation; orbit; Laplace resonance member 2.
- **STATIC:** USGS grayscale mosaic.
- **NO weather.**

### Ganymede — MEASURED largest-moon + magnetic field + ocean; COMPUTED orbit
- **MEASURED:** largest moon in the solar system (r 2631 km > Mercury); the **only moon with an intrinsic dynamo magnetic field** (Kivelson et al. 1996), producing auroras; subsurface ocean (Saur et al. 2015).
- **COMPUTED:** synchronous rotation; orbit; Laplace resonance member 4.
- **STATIC:** USGS color mosaic.
- **NO weather.**

### Callisto — MEASURED ancient cratering; COMPUTED orbit; ocean POSSIBLE
- **MEASURED:** most heavily cratered surface in the solar system — an ancient, saturated, geologically dead crust.
- **POSSIBLE:** deep briny layer (Galileo induced field, Zimmer et al. 2000) — deep, unconfirmed, flagged.
- **COMPUTED:** synchronous rotation; orbit (outside the Laplace resonance).
- **STATIC:** USGS grayscale mosaic.
- **NO weather.**

### Titan — MEASURED atmosphere + methane WEATHER (the exception); COMPUTED orbit
- **MEASURED (real weather):** thick N2 atmosphere (surface **1.45 bar**, ~98.4% N2; Huygens), surface **93.7 K**, and an **active methane hydrologic cycle** — clouds, **rain, rivers, lakes and seas** (Kraken/Ligeia/Punga Mare, Cassini RADAR). The only moon with standing surface liquid and genuine weather; present it as real, with instruments cited.
- **COMPUTED:** synchronous rotation; orbit about Saturn.
- **STATIC:** USGS Cassini ISS **near-IR (938 nm)** mosaic — labeled "haze-penetrating IR, not visible light" (the surface is hidden by orange haze), with a 3–5% coverage gap.
- **Weather framing is honest here, and ONLY here.**

### Enceladus — MEASURED plumes + ocean; COMPUTED orbit
- **MEASURED:** 100+ water-vapour/ice jets from the four south-polar "tiger stripe" fractures (Porco et al. 2006); the plume **feeds Saturn's E ring** (Spahn/Kempf 2006); a **global** subsurface salt-water ocean (Cassini gravity+libration, Iess 2014 / Thomas 2016); **brightest body in the solar system** (geometric albedo 1.375, Verbiscer 2007).
- **COMPUTED:** synchronous rotation; orbit (its forced eccentricity, partly from the 2:1 resonance with Dione, helps drive the plumes — noted, not modeled here).
- **STATIC:** USGS Cassini mosaic.
- **NO weather** (the plumes are cryovolcanic venting, not atmospheric weather — do not conflate).

### Mimas — MEASURED giant crater; COMPUTED orbit; young ocean RECENT/DEBATED
- **MEASURED:** the 139-km Herschel crater (~1/3 of Mimas' diameter) — the "Death Star" look.
- **RECENT/DEBATED:** evidence for a young subsurface ocean from orbital libration (Lainey et al. 2024) — flagged, not asserted.
- **COMPUTED:** synchronous rotation; orbit.
- **STATIC:** **no shippable PD texture** (USGS control network only) — Mimas is constants/phenomena only this phase.
- **NO weather.**

### Iapetus — MEASURED albedo dichotomy + ridge; COMPUTED orbit
- **MEASURED:** two-tone surface — dark leading hemisphere (Cassini Regio, albedo 0.03–0.05) vs bright trailing (0.5–0.6), a thermal-runaway ice-migration dichotomy; a ~1,300 km equatorial ridge (walnut shape).
- **COMPUTED:** synchronous rotation; distant, inclined orbit (i 7.6°).
- **STATIC:** USGS Cassini–Voyager mosaic (captures the real dichotomy; Voyager fills poles).
- **NO weather.**

### Triton — MEASURED geysers + retrograde capture; COMPUTED orbit; PARTIAL map
- **MEASURED:** retrograde orbit (i 157.3° → captured Kuiper-belt object); active N2 geysers venting ~8 km high (≥4 seen by Voyager 2, 1989); thin N2 atmosphere (~1.4 Pa); surface ~38 K (among the coldest measured); cantaloupe terrain.
- **COMPUTED:** synchronous rotation about Neptune; **retrograde** orbit (the standout orbital fact).
- **STATIC (partial):** USGS Voyager-2 color mosaic — **one hemisphere only (1989)**, north-pole gap interpolated. Labeled partial.
- **NO weather** (the geysers are seasonal cryovolcanic venting driven by sublimating N2 ice, not atmospheric weather).

## Orbital mechanics: the honest "dynamic" content (COMPUTED, we own the maths)

For a moon with no weather, the real, computable dynamics are its motion:

- **Tidal locking / synchronous rotation:** rotation period = orbital period → one hemisphere always faces the parent (the parent hangs nearly fixed in that hemisphere's sky). Directly from `constants.json` (`rotation_period_days == orbital_period_days`). This is the moon analogue of Earth's day/night and the Moon's near-side/far-side.
- **The 1:2:4 Laplace resonance (Io:Europa:Ganymede):** periods ~1.769 : 3.551 : 7.155 d. Every time Ganymede orbits once, Europa orbits twice and Io four times, so the three line up in a repeating pattern that pumps their eccentricities. Computable/animatable from the periods in `constants.json`; it is the *why* behind Io's volcanism and Europa's/Ganymede's oceans.
- **Triton's retrograde orbit (i = 157.3°):** motion opposite Neptune's spin — the clearest evidence in the data that Triton was captured. A straightforward, honest orbital visualization.
- **Phases / illumination about the parent:** each moon shows phases (as seen from the parent or Sun) driven by Sun–moon–parent geometry — computed with the same terminator machinery as Earth (`lib/solar.ts`) and the Moon (Meeus), using the orbital elements in `constants.json`. No runtime API; JPL Horizons (if used at all) is offline cross-check only, per `DATA_SOURCES.md` §5.

All of this is real, unencumbered orbital physics — the honest "predictive/dynamic" layer for bodies that (Titan aside) have no weather.

## Measured vs computed vs static — the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Io volcanism (~400 volcanoes, ~10¹⁴ W, plumes) | **Measured** | "Measured — Voyager/Galileo/Juno; Veeder et al. 2012" |
| Europa / Ganymede / Enceladus / (Callisto) subsurface ocean | **Measured** (Callisto: possible) | "Measured — Galileo/Cassini; [citation]" (Callisto: "possible") |
| Ganymede intrinsic magnetic field | **Measured** | "Measured — Galileo (Kivelson et al. 1996)" |
| Callisto heavy cratering | **Measured** | "Measured — most cratered surface (NASA)" |
| Titan N2 atmosphere + methane seas/rain/rivers | **Measured (real weather)** | "Measured — Cassini/Huygens; the one weather moon" |
| Enceladus plumes → E ring | **Measured** | "Measured — Cassini (Porco et al. 2006)" |
| Triton N2 geysers, 38 K, retrograde | **Measured / Computed (orbit)** | "Measured — Voyager 2 (1989)" / "Computed — retrograde orbit" |
| Iapetus two-tone albedo; Mimas Herschel crater | **Measured** | "Measured — Cassini/Voyager" |
| Tidal locking, 1:2:4 Laplace resonance, phases about parent | **Computed** | "Computed — orbital mechanics" |
| Europa plumes; Mimas young ocean; Callisto ocean | **Debated / possible / recent** | "Debated — not confirmed" / "possible" / "recent (2024)" |
| Surface textures (USGS mosaics) | **Static basemap** | "[Mission] imagery (public domain)" — Titan "near-IR/haze"; Triton "one hemisphere, 1989" |

Rules carried over from Earth/Mars/Moon/planets, unchanged:
- Every number on screen names its category and source.
- No invented values; if we lack measured/published data for something, we show no number for it.
- Computed orbital geometry and measured facts are never presented as live readings or forecasts.
- **No fabricated weather anywhere except Titan's real, measured methane cycle.** No wind/clouds/rain/pressure/storms on Io, Europa, Ganymede, Callisto, Enceladus, Mimas, Iapetus or Triton — those would be dishonest and (Titan aside) physically nonexistent. Enceladus' and Triton's plumes/geysers are **cryovolcanic venting**, not weather.

## What is honestly showable this phase (crisp per-moon statement)

- **Io:** MEASURED hyper-volcanism (~400 volcanoes, ~10¹⁴ W tidal heat, ~390 km plumes); COMPUTED synchronous orbit + 1:2:4 resonance; STATIC color map (polar gaps interpolated). No weather.
- **Europa:** MEASURED subsurface ocean + young/chaos ice; DEBATED plumes; COMPUTED orbit + resonance; STATIC grayscale map. No weather.
- **Ganymede:** MEASURED largest moon + only intrinsic B-field + ocean; COMPUTED orbit + resonance; STATIC color map. No weather.
- **Callisto:** MEASURED most-cratered surface; POSSIBLE deep ocean; COMPUTED orbit; STATIC grayscale map. No weather.
- **Titan:** MEASURED N2 atmosphere (1.45 bar) + methane WEATHER (seas Kraken/Ligeia/Punga, rain, rivers, 93.7 K); COMPUTED orbit; STATIC near-IR haze-penetrating map (3–5% gap). **The one weather moon.**
- **Enceladus:** MEASURED south-polar plumes → E ring + global ocean + brightest body; COMPUTED orbit; STATIC Cassini map. No weather (cryovolcanic venting, not weather).
- **Mimas:** MEASURED Herschel crater; RECENT/DEBATED young ocean; COMPUTED orbit; NO shippable texture. No weather.
- **Iapetus:** MEASURED two-tone albedo dichotomy + equatorial ridge; COMPUTED orbit; STATIC Cassini–Voyager map. No weather.
- **Triton:** MEASURED N2 geysers + 38 K + thin N2 atmosphere + cantaloupe terrain; COMPUTED **retrograde** capture orbit; STATIC **partial** (one-hemisphere, 1989) map. No weather (seasonal cryovolcanism, not weather).

What we deliberately do **not** show: a live feed or forecast for any moon; invented storms, wind, clouds, or rain on any body except Titan's real methane cycle; a complete "global" Triton map (it is one hemisphere); a visible-light Titan surface (it is haze-obscured); or a Mimas texture (none is cleanly public domain). Those would be dishonest — and for these worlds the honest, still-astonishing content is orbital mechanics + measured phenomena + real textures.
