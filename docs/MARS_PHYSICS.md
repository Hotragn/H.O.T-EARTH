# Mars Physics & Honest-Representation Methodology (Phase 2)

Companion to `docs/MARS_DATA_SOURCES.md`. Same non-negotiable bar as Earth (`physics-env-simulation` skill): **real physics and real data, or it doesn't ship. No invented numbers.** This doc states exactly how we honestly represent Mars "weather," and — critically — what is **measured** vs **climatological** vs **modeled/computed**.

Verification date: 2026-07-06.

## The three honest Mars signals

Mars does not have an Earth-like live weather feed, and we will not fake one. Instead we show three things that are individually well-grounded:

### 1. Seasonal CO2 surface-pressure cycle — MEASURED (flagship)
This is the strongest honest signal and the one we lead with.

- **Physics:** Mars' atmosphere is 95% CO2 and thin (~6-10 mbar, <1% of Earth's). Each winter the polar night gets cold enough (~148 K) that CO2 *condenses directly onto the winter polar cap as dry-ice frost*, removing a large fraction of the atmosphere's mass; in spring/summer it sublimates back. Because ~25-30% of the whole atmosphere cycles in and out of the caps annually, the *surface pressure everywhere* rises and falls through the Mars year. This is a planet that literally freezes part of its sky every winter.
- **Data:** Viking Landers 1 & 2 daily-average surface pressure, 1976-1982 (PDS `VL1/VL2-M-MET-4-DAILY-AVG-PRESSURE-V1.0`). See `public/data/mars/seasonal_pressure.json`.
- **Measured amplitude (computed directly from the PDS file, not from a model):**
  - VL1 (Chryse, 22.3°N): 6.77 → 9.06 mbar, **29.3% swing**; minimum at Ls ≈ 148° (deep southern-winter minimum), maximum at Ls ≈ 253° (near perihelion).
  - VL2 (Utopia, 47.7°N): 7.36 → 10.20 mbar, **32.7% swing**; min Ls ≈ 155°, max Ls ≈ 285°.
  - The curve is bimodal (two minima) because both polar caps take turns freezing; the deeper minimum is southern winter. VL1 and VL2 differ in absolute pressure because they sit at different elevations/latitudes — but both show the same cycle. That agreement is itself the honesty check.
- **Honesty label in UI:** "Measured — Viking Landers 1 & 2, 1976-1982 (NASA PDS)." We present it as a *climatology* (binned by Ls), because it is a repeatable seasonal signal that recurs every Mars year, not a live reading.

### 2. Large diurnal temperature swings — MEASURED (per site)
- **Physics:** the thin atmosphere holds almost no heat and the surface has low thermal inertia, so day-night temperature swings are enormous — often 60-80 K between afternoon and pre-dawn at a single site (e.g. ~+0 °C day to −80 °C night at Gale crater). There is no ocean and little atmosphere to buffer it. This is the opposite of Earth's moderated diurnal cycle and is a genuinely dramatic, honest signal.
- **Data:** Curiosity REMS air/ground temperature by sol (PDS `mslrem_1001`) and/or InSight TWINS (PDS4 `twins_bundle`). These are per-site measured time series — show them as such, labeled with the site and the sol/date.
- **Honesty label:** "Measured air temperature, [mission] at [site], sol N." Never blend sites into a fake "global temperature."
- **Status:** documented and ready to ingest; not built this phase (pressure cycle was the priority).

### 3. Dust-storm SEASON — CLIMATOLOGY, explicitly NOT a prediction
- **Physics:** dust lifting is strongest when insolation is highest. Perihelion is at Ls ≈ 251° (southern summer), so the **dusty season is Ls ≈ 180-360** (northern autumn/winter); Ls 0-180 is relatively clear. Some Mars years produce global, planet-encircling dust storms (1971, 1977 ×2, 2001, 2018); most do not. Timing is seasonal-probabilistic, magnitude is not predictable years ahead.
- **Data:** Montabone et al. column dust optical depth (tau) climatology, MY 24-36, CC-BY-SA 3.0 (see `MARS_DATA_SOURCES.md` §2d). Backed by TES/THEMIS/MCS retrievals; storm occurrence corroborated by MRO/MARCI daily global maps.
- **What we show:** dust optical depth *climatology by Ls* — i.e. "this is the season when dust is typically high, and here's the historical spread across Mars years." We can show interannual variability (which years had global storms) as *history*.
- **What we DO NOT claim:** we do **not** predict a specific storm on a specific future date. Framing is "dust-storm season / historical dust climatology," never "storm forecast." This is the Mars analogue of the Earth rule: our models are baselines/climatology, never dressed up as operational forecasts.
- **Status:** next artifact to build (see `MARS_DATA_SOURCES.md`).

## Orbital geometry — COMPUTED (we own the maths)
Driven by the NASA GISS Mars24 / Allison & McEwen (2000) algorithm, implemented in code (no runtime API), the Mars analogue of Earth's `lib/solar.ts`:
- **Ls (areocentric solar longitude)** → the Mars "date"/season. Ls 0/90/180/270 = N spring/summer/autumn/winter.
- **Sol + Mars Coordinated Time + local mean/true solar time** → a Mars clock.
- **Subsolar point (lon = f(MST, EOT); lat = δ = arcsin(0.42565 sin Ls)+0.25° sin Ls)** → Mars terminator and seasons on the globe.
- **Cross-check** the implementation against the worked examples on the GISS algorithm page and/or JPL Horizons (server-side only) before trusting, exactly as Earth's terminator was cross-checked against Horizons.

Constants (locked in `MARS_DATA_SOURCES.md` §4): obliquity 25.19°, eccentricity 0.0934, sol 24h39m35.244s, year 668.59 sols / 686.97 days, perihelion Ls ≈ 251°. The high eccentricity (~5.5× Earth's) with perihelion in southern summer is *why* the pressure cycle and dust season are asymmetric — the geometry, the pressure data, and the dust climatology tell one consistent physical story.

## Measured vs climatological vs computed — the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Viking seasonal pressure cycle | **Measured** (shown as recurring climatology by Ls) | "Measured — Viking Landers, 1976-1982 (NASA PDS)" |
| REMS / InSight diurnal temperature & pressure | **Measured** (per-site time series) | "Measured — [mission] at [site], sol N" |
| Dust optical depth by Ls | **Climatology** (historical, MY 24-36) | "Dust-storm season (climatology, not a forecast) — Montabone et al., CC-BY-SA" |
| Ls / sol / season / terminator | **Computed** (published algorithm) | "Computed — Mars24 algorithm (Allison & McEwen 2000)" |

Rules carried over from Earth, unchanged:
- Every number on screen names its category and source.
- No invented values; if we don't have measured or published data for something, we don't show a number for it.
- Climatology and computed geometry are never presented as live readings or forecasts.
- Any model we might add later (e.g. a pressure-vs-Ls fit) is a **baseline validated on held-out data** and labeled as such — never presented as beating a mission or a GCM.

## What is honestly showable in Phase 2 (crisp statement)
1. **The seasonal CO2 pressure cycle** — measured, ~25-30% annual swing (VL1 29.3%, VL2 32.7%), the flagship. Committed now.
2. **A real Mars season/clock** — Ls, sol, subsolar point, terminator — computed from a peer-reviewed algorithm.
3. **Large diurnal temperature swings** — measured per-site (REMS/InSight), ready to ingest.
4. **Dust-storm season as climatology** — historical tau by Ls with interannual spread, explicitly not a storm prediction. Next to build.
5. **Honest topography/basemap** — MOLA/Viking public-domain equirectangular mosaics.

What we deliberately do **not** show: a live global Mars weather feed, a specific future dust-storm forecast, or any blended "global Mars temperature" number. Those would be dishonest, and we don't have the data for them.
