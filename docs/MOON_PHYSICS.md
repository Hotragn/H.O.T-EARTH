# Moon Physics & Honest-Representation Methodology (Phase 3)

Companion to `docs/MOON_DATA_SOURCES.md`. Same non-negotiable bar as Earth and Mars (`physics-env-simulation` skill): **real physics and real data, or it doesn't ship. No invented numbers.** This doc states exactly how we honestly represent the Moon and — critically — what is **measured** vs **computed** vs **modeled**.

Verification date: 2026-07-06.

## The Moon has no atmosphere — so there is no weather

The single most important honesty rule for Phase 3: **the Moon has essentially no atmosphere (surface pressure ~3×10⁻¹⁵ bar), so there is NO weather** — no wind, no clouds, no precipitation, no pressure systems, no storms. We do **not** invent any of these, and we do **not** reuse Earth/Mars weather framing anywhere in the Moon experience. Per the project brief, the "predictive/dynamic" angle is redirected to what is **physically real** on the Moon: **surface-temperature swings, illumination / day-night, libration, and phase.**

These are genuinely dynamic and dramatic — a ~300 K surface-temperature swing between lunar noon and pre-dawn, a surface that takes ~29.5 Earth days to complete one day-night cycle, and a face that "nods" toward and away from Earth through libration. All of it is real, and none of it is weather.

## The honest Moon signals

### 1. Day-night surface-temperature swing — MEASURED + MODELED (flagship)
This is the strongest honest "dynamic" signal and the one we lead with.

- **Physics:** with no atmosphere to redistribute or trap heat, and a slowly-rotating surface (a lunar day is ~29.53 Earth days), the sunlit surface reaches near radiative equilibrium with direct sunlight while the night side radiates its heat away with only low-thermal-inertia regolith to hold it up. The result is an enormous surface-temperature swing with nothing to buffer it.
- **Measured (LRO Diviner):** equatorial daytime maximum **387–397 K** (avg **392.3 K**), pre-dawn minimum **~95 K** (avg **94.3 K**), mean **215.5 K** → **~300 K diurnal change** (Williams et al. 2017). Permanently-shadowed polar craters reach **~25–40 K** (Cabeus ~37–38 K annual avg; coldest PSRs < 30 K — Paige et al. 2010), **among the coldest measured places in the solar system.** These are measured facts from the Diviner archive (PDS `LRO-L-DLRE-5-GDR-V1.0`, public domain).
- **Modeled (illustrative-but-grounded):** we compute a diurnal curve using the Diviner team's own daytime radiative-equilibrium formula (Williams 2017, Eq. 1):

  **T(i) = [ S (1 − A) cos(i) / (ε σ) ]^(1/4)**

  with **S = 1370 W/m²**, **ε = 0.95**, **σ = 5.670374419×10⁻⁸**, and the Diviner-published albedo law **A(lat) = 0.08 + 0.045·(lat/45)³ + 0.14·(lat/90)⁸** (albedo rises toward the poles); incidence **cos(i) = cos(lat)·cos(h)**, **h = (LST − 12)·15°**. The **nightside** is not the equilibrium formula (which has no thermal inertia and gives an unphysical 0 K); it is a **cooling curve anchored to Diviner's measured** post-sunset (~120 K, equator) and pre-dawn (~95 K, equator) values, scaled by latitude. Near the terminator we take `max(equilibrium, night_floor)` so retained regolith heat holds the surface up at sunrise/sunset.
- **The artifact:** `public/data/moon/diurnal_temperature.json` (built by `scripts/moon/build_diurnal_temperature.py`). Equator **391.1 K / 95.5 K → 295.6 K swing**, matching the measured ~392 K / ~95 K / ~300 K. Swing shrinks with latitude (30°: 283.7 K; 60°: 238.1 K; 85°: 133.1 K).
- **Honesty label in UI:** "Surface temperature — model anchored to LRO Diviner measurements (day: radiative equilibrium; night: Diviner-anchored). Not a live sensor feed." Daytime peak (~392 K) and pre-dawn minimum (~95 K) are the measured Diviner extremes.

### 2. Illumination / day-night and phase — COMPUTED (we own the maths)
- **Physics:** the Moon's day-night terminator sweeps the surface once per **synodic month (~29.53 days)**. From Earth we see the fraction of the near side that is sunlit — the **phase** (new → first quarter → full → last quarter). Illuminated fraction and phase follow directly from the Sun–Moon–Earth geometry, exactly the way Earth's terminator follows from the Sun–Earth geometry.
- **Computed:** implement Meeus / ELP2000 low-precision lunar theory client-side (no runtime API), the Moon analogue of Earth's `lib/solar.ts` and Mars' Mars24 clock:
  - **Illuminated fraction k = (1 + cos i)/2** from the phase angle i (Meeus Ch. 48); phase name from the Sun–Moon ecliptic-longitude difference.
  - **Sub-solar point** (Sun at lunar zenith) and **sub-Earth point** (Earth at lunar zenith) in selenographic coordinates — the sub-Earth point stays near the mean center, wandering only by libration.
  - **Terminator** = great circle 90° from the sub-solar point (same construction as Earth).
- **Honesty label:** "Phase / illumination — computed (Meeus lunar theory)." Cross-checked against JPL Horizons (target 301) offline, never called from the browser.

### 3. Libration — COMPUTED (we own the maths)
- **Physics:** although the Moon rotates synchronously (same face toward Earth), it appears to slowly "nod" (latitude libration) and "rock" (longitude libration) because its orbit is eccentric and inclined and its spin is uniform while its orbital speed is not. **Optical libration reaches ±~7.9° in longitude and ±~6.9° in latitude**, plus a small (~±1°) **diurnal libration** from Earth's rotation (parallax). The consequence: over time an Earth observer sees **~59% of the lunar surface**, not just 50%.
- **Computed:** Meeus Ch. 53 optical-libration formulae `l'` (longitude) and `b'` (latitude) from the Moon's mean orbital elements and the **1.543°** inclination of the lunar equator to the ecliptic. Unencumbered published maths; implemented ourselves.
- **Honesty label:** "Libration — computed (Meeus lunar theory)." This is a real, visible, dynamic effect (the Moon's apparent nodding month to month) and a good honest "predictive/dynamic" feature for a body with no weather.

## Orbital / physical constants (locked, for the geometry code)

| Constant | Value | Note |
|---|---|---|
| Synodic month | **29.530589 days** | phase cycle (new-to-new); also the length of one lunar solar day |
| Sidereal month | **27.321662 days** | orbit vs. fixed stars |
| Anomalistic month | 27.554550 days | perigee-to-perigee (apparent-size variation) |
| Optical libration, longitude | **±~7.9°** | mean ±~7.6° |
| Optical libration, latitude | **±~6.9°** | mean ±~6.7° |
| Diurnal libration | ~±1° | parallax from Earth's rotation |
| Inclination of lunar equator to ecliptic | **1.543°** | tiny obliquity → sub-solar point ≈ equator (why the temperature model assumes sub-solar on the equator) |
| Orbit inclination to ecliptic | 5.145° | with the 1.543° equator tilt → ~6.7° latitude libration |
| Mean Earth–Moon distance | 384,400 km | apparent-size baseline |
| Bond albedo (for temperature) | A₀ = 0.08 (equator), ~0.11–0.12 global mean | rises toward poles per the §1 albedo law |
| Broadband emissivity | ε = 0.95 | §1 |
| Solar constant at Moon | S = 1370 W/m² | Moon ≈ 1 AU |

**Physical consequence (the honest story that ties it together):** the Moon's ~1.5° obliquity means there are no real seasons and the sub-solar point stays near the equator — so the **latitude** temperature structure is simple and the **local-solar-time** (day-night) structure is everything. The ~29.5-day solar day plus zero atmosphere is *why* the day-night swing is ~300 K. Libration (from orbital eccentricity + inclination) is *why* we see ~59% of the surface. The geometry, the Diviner temperature data, and the libration all tell one consistent physical story — with no weather anywhere in it.

## Measured vs computed vs modeled — the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Diviner temperature extremes (392 K noon, 95 K pre-dawn, 25–40 K PSRs) | **Measured** | "Measured — LRO Diviner (Williams et al. 2017)" |
| Diurnal temperature curve (`diurnal_temperature.json`) | **Modeled**, anchored to Diviner measurements | "Model anchored to Diviner measurements (LRO) — not a live feed" |
| Phase / illuminated fraction / sub-solar & sub-Earth points / terminator | **Computed** (published algorithm) | "Computed — Meeus lunar theory" |
| Libration (longitude, latitude, diurnal) | **Computed** (published algorithm) | "Computed — Meeus lunar theory" |
| Surface texture (LROC WAC) | Static basemap | "NASA SVS / LROC / ASU (public domain)" — aesthetic, no science claimed from it |

Rules carried over from Earth/Mars, unchanged:
- Every number on screen names its category and source.
- No invented values; if we don't have measured or published data for something, we don't show a number for it.
- Computed geometry and the anchored temperature model are never presented as live readings or forecasts.
- **No weather framing anywhere** — no wind, clouds, precipitation, pressure, or storms on the Moon. If a UI element implies weather, it is wrong.
- The temperature model is **illustrative-but-grounded** (day = the Diviner team's own radiative formula; night = anchored to Diviner's measured curve). It is labeled as a model, never as a live sensor stream and never as the raw archive.

## What is honestly showable in Phase 3 (crisp statement)

**Measured:**
1. **Diviner surface-temperature extremes** — ~392 K equatorial noon, ~95 K pre-dawn, ~300 K swing; polar cold traps 25–40 K (among the coldest places in the solar system). Real Diviner measurements, public domain.

**Modeled (anchored to Diviner):**
2. **A diurnal surface-temperature curve** by latitude (`diurnal_temperature.json`) — the flagship dynamic signal, the ~300 K day-night swing. Committed now.

**Computed (we own the maths, no runtime API):**
3. **Lunar phase & illuminated fraction** and the **day-night terminator** — from Meeus lunar theory.
4. **Sub-solar and sub-Earth points** — selenographic geometry.
5. **Libration** (longitude ±~7.9°, latitude ±~6.9°, plus diurnal) — the Moon's monthly "nod," revealing ~59% of the surface over time.

**Static (public domain basemap):**
6. **Honest surface texture / relief** — LROC WAC global mosaic (and optionally LOLA relief / GLD100 color shaded relief).

What we deliberately do **not** show: any lunar "weather" (wind/clouds/precipitation/pressure/storms), a live surface-temperature sensor feed, or the raw Diviner archive dressed up as real-time. Those would be dishonest, and — in the case of weather — physically nonexistent.
