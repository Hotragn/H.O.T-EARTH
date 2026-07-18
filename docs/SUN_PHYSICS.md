# Sun & Space-Weather Physics & Honest-Representation Methodology (Phase 10)

Companion to `docs/SUN_DATA_SOURCES.md`. Same non-negotiable bar as every prior phase (`physics-env-simulation` skill): **real physics and real data, or it doesn't ship. No invented numbers.** This doc states exactly what is **MEASURED**, what is a **FORECAST** (and *whose*), and what is **COMPUTED** by us — for the Sun tab.

Verification date: **2026-07-18** (see the date note in `SUN_DATA_SOURCES.md`).

## Why this phase is different: space weather is a genuine forecasting domain

Every prior body forced the honest conclusion "there is no real weather / forecast to show" (the giants) or "the forecast belongs to a national service, we only consume it" (Earth via Open-Meteo/GFS). The Sun tab is the one place where a **real, operational, skillful forecasting enterprise exists and is free and public**: NOAA's **Space Weather Prediction Center (SWPC)** issues genuine forecasts of geomagnetic storms (Kp), aurora (OVATION), radio blackouts, and the solar cycle. This reconnects directly to the project's honest-forecasting theme — **with one hard rule:**

> **We VISUALIZE SWPC's forecasts and attribute them to SWPC. We do NOT make our own space-weather forecasts.** Nothing on this tab is "H.O.T's solar forecast." The predictive content is SWPC's, labeled and credited as such. Our only original outputs are **COMPUTED geometry** (rotation, solar-cycle phase) and clearly-labeled **coarse derived indicators** (an aurora activity word / oval latitude from the measured Kp).

## The three categories (the labeling contract)

| Signal | Category | Source / how derived | How labeled in the app |
|---|---|---|---|
| Full-disk SDO imagery (AIA 171/193/211/304, HMI continuum, HMI magnetogram) | **MEASURED** | NASA SDO instruments | "NASA/SDO [channel] — disk image, not a map; snapshot" |
| Solar wind speed / density / temperature / IMF Bz, Bt | **MEASURED** | DSCOVR / ACE at L1 (SWPC) | "Measured — DSCOVR/ACE, propagated to bow shock" |
| Planetary Kp index (3-hourly, 1-minute) | **MEASURED** | Global magnetometer network (SWPC estimated Kp) | "Measured geomagnetic index (Kp)" |
| GOES X-ray flux + flare class (A/B/C/M/X) | **MEASURED** | GOES-primary XRS | "Measured — GOES X-ray sensor" |
| Sunspot number (monthly), F10.7 flux | **MEASURED** | SWPC (SSN, PD) / Penticton 10.7 cm | "Measured — NOAA SWPC / F10.7" |
| **OVATION aurora nowcast** | **FORECAST (SWPC)** | SWPC OVATION-Prime model | "**SWPC OVATION aurora forecast**" |
| **Geomagnetic (Kp) 3-day forecast** | **FORECAST (SWPC)** | SWPC forecast product | "**SWPC geomagnetic forecast**" |
| **Predicted solar-cycle curve** | **FORECAST (SWPC)** | SWPC/NOAA-NASA panel prediction | "**SWPC solar-cycle prediction**" |
| Carrington / synodic solar rotation, differential rotation | **COMPUTED** | Orbital/rotational constants | "Computed — solar rotation" |
| Solar-cycle phase (which part of the ~11-yr cycle) | **COMPUTED** | From measured smoothed SSN + cycle start | "Computed — from observed sunspot number" |
| Aurora activity word (quiet…storm) + oval equatorward latitude | **COMPUTED (coarse)** | Documented rule of thumb from measured Kp | "Approximate — derived from measured Kp, not a forecast" |

Rules carried over unchanged from Earth/Mars/Moon/Planets:
- Every number on screen names its category and source.
- No invented values; if we don't have measured or published data, we show no number.
- Computed geometry and measured indices are never presented as live forecasts.
- **No fabricated space weather.** The forecast content is SWPC's, attributed to SWPC.

## MEASURED — the real instruments

- **SDO imagery.** Real full-disk observations of the photosphere (HMI continuum → sunspots), the photospheric magnetic field (HMI magnetogram), and the corona/chromosphere at specific temperatures (AIA EUV channels, false-colored by wavelength). Snapshots of the Earth-facing hemisphere — square disk images, **not** surface maps (see `SUN_DATA_SOURCES.md` §1).
- **Solar wind (DSCOVR/ACE at L1).** The stream of plasma from the Sun: bulk speed (~250–800 km/s), proton density, temperature, and the embedded interplanetary magnetic field (IMF). SWPC propagates the L1 measurement to Earth's bow shock. **Southward IMF (Bz < 0)** is the key coupling term — it lets solar-wind energy enter the magnetosphere and drive aurora/storms. (Snapshot value 2026-07-18: ~323 km/s, Bz +3.4 nT northward → quiet.)
- **Planetary Kp index.** A quasi-logarithmic 0–9 measure of global geomagnetic disturbance over 3-hour windows, from a network of magnetometer stations. Kp ≥ 5 corresponds to NOAA's G1–G5 geomagnetic-storm scale. (Snapshot: Kp 1.33 → quiet.)
- **GOES X-ray flux.** Soft X-ray irradiance (0.1–0.8 nm). Flare class is a base-10 scale on that flux: **A < 10⁻⁷, B 10⁻⁷–10⁻⁶, C 10⁻⁶–10⁻⁵, M 10⁻⁵–10⁻⁴, X ≥ 10⁻⁴ W/m².** M/X flares can cause HF radio blackouts. (Snapshot: background B6.8; largest flare today C2.3.)
- **Sunspot number & F10.7.** The classic solar-activity proxies. F10.7 (10.7 cm / 2800 MHz radio flux, in solar flux units) tracks EUV output. (Snapshot: SSN ~104 (NOAA), F10.7 ~138 sfu, June 2026.)

## FORECAST — SWPC's, not ours

- **OVATION aurora nowcast.** SWPC's OVATION-Prime model maps the *instantaneous probability of visible aurora* onto a ~65k-point lon/lat grid, with an `Observation Time` and a short-lead `Forecast Time`. It is a **model forecast**. We render the grid and label it "SWPC OVATION aurora forecast." We never call it an observation or "our" aurora.
- **Geomagnetic / Kp forecast.** SWPC publishes a 3-day Kp forecast. If shown, it is the *forecast* product, distinct from the *measured* Kp series, and attributed to SWPC.
- **Predicted solar cycle.** The SWPC/NOAA-NASA prediction panel's monthly `predicted_ssn`/`predicted_f10.7` with uncertainty bands (`public/data/sun/solar_cycle.json → cycle25_predicted`). Shown as the forward dashed curve on the cycle chart, credited to SWPC. **Honest aside:** Cycle 25 has run *stronger* than the panel's 2019 consensus (~115 smoothed SSN) — the observed smoothed peak reached ~160 — a good illustration that even the experts' forecast carried real uncertainty. We show the prediction *and* the observation so the reader sees the miss.

## COMPUTED — our only original math (geometry + coarse indicators)

### Solar rotation (differential + Carrington)
The Sun is not a solid body; it rotates **differentially** — faster at the equator, slower toward the poles:
- **Equator ≈ 24.5 days** (sidereal), **poles ≈ 34 days**.
- **Carrington rotation** is the standard bookkeeping rate for the mean (≈26°) latitude: **sidereal 25.38 days**; because Earth orbits in the same direction, the **synodic** period seen from Earth is **≈27.28 days** (~27.2753 d). Carrington rotation numbers increment once per synodic rotation.
This is **computed** from the constants — the analogue of Earth's terminator/rotation clock — and used only for orientation/annotation (e.g. "central meridian longitude," approximate feature return time). We do not claim to track specific features' motion beyond this mean geometry.

### The ~11-year solar cycle (Cycle 25)
Solar activity waxes and wanes on a **~11-year cycle** (the magnetic Hale cycle is ~22 years). We are in **Solar Cycle 25**, which began at the **December 2019** minimum. Its **maximum occurred around late 2024**: the observed **13-month smoothed sunspot number peaked near ~160.9 around 2024-10** (best current estimate; smoothing lags real time by ~6 months, so the most recent months aren't yet smoothable). Cycle 25 is now in its **declining phase**. The **cycle phase is COMPUTED** from the measured smoothed sunspot-number series and the cycle-start date — not asserted, derived from the data in `solar_cycle.json`.

### Aurora activity level & oval latitude from Kp (coarse, labeled)
Two small **derived** indicators, computed from the **measured** Kp so a reader gets an intuitive read without us forecasting anything:
- **Activity word / storm level:** Kp ≤ 2 quiet, 3 unsettled, 4 active, **5 = G1 minor, 6 = G2 moderate, 7 = G3 strong, 8 = G4 severe, 9 = G5 extreme** (NOAA SWPC G-scale).
- **Auroral-oval equatorward edge:** a deliberately **coarse** rule of thumb, magnetic latitude ≈ **66.5° − 2.0·Kp**. This is a rough approximation only — the true oval boundary depends on magnetic local time, IMF Bz, and storm history — and is labeled "approximate, derived from measured Kp, **not a forecast**." For an actual aurora *forecast*, the app shows SWPC's OVATION grid, not this scalar.

Both live in `spaceweather.json → aurora.kp_derived_activity`, tagged with an `_oval_note` caveat, and are computed from the measured Kp, never from OVATION.

## What we deliberately do NOT do

- We do **not** issue a space-weather forecast of any kind under the H.O.T name. All predictive content (aurora, geomagnetic, solar cycle) is **SWPC's**, labeled and credited.
- We do **not** present SDO disk images as equirectangular surface maps, and we do **not** present AIA false-color as the Sun's true color.
- We do **not** fabricate solar-wind, Kp, flux, or sunspot values, or interpolate invented points into the cycle chart. The committed files are a timestamped **snapshot**; the app fetches SWPC **live** (CORS `*`) for current conditions.
- We do **not** claim our coarse Kp-derived aurora latitude competes with OVATION — it is an intuition aid, explicitly approximate.

## Crisp measured / forecast / computed statement (for the About panel)

**Measured:** SDO full-disk imagery; solar wind (DSCOVR/ACE); planetary Kp; GOES X-ray flux & flares; sunspot number; F10.7. **Forecast (NOAA SWPC's, shown and attributed to SWPC — not ours):** OVATION aurora nowcast; 3-day geomagnetic/Kp forecast; predicted solar-cycle curve. **Computed (ours):** solar rotation geometry (differential; Carrington sidereal 25.38 d / synodic 27.28 d; equator ~24.5 d, poles ~34 d); solar-cycle phase from the observed smoothed sunspot number (Cycle 25, began Dec 2019, smoothed peak ~160 near late 2024, now declining); and a coarse aurora activity level / oval latitude derived from the measured Kp. We visualize SWPC's forecasts; we do not make our own.
