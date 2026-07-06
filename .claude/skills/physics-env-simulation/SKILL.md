---
name: physics-env-simulation
description: Physics grounding and honest-forecasting methodology for the H.O.T digital twin — solar geometry, radiative/atmospheric basics, model validation rules, and what accuracy claims are allowed.
---

# Physics-Based Environmental Simulation

Core principle: **real physics and real data, or it doesn't ship.** No arbitrary numbers driving visuals. Every displayed quantity must trace to a data source or a documented calculation.

## Solar geometry (drives day/night terminator, seasons)
Implement in TypeScript, no dependency needed. For a given UTC time:
1. Julian day → fractional year γ.
2. Solar declination δ (Spencer/NOAA series expansion, accurate to ~0.01°) — encodes seasons/axial tilt.
3. Equation of time E (minutes) — orbital eccentricity + obliquity correction.
4. Subsolar longitude = -15° × (UTC_hours + E/60 - 12). Subsolar latitude = δ.
5. Terminator = great circle 90° from subsolar point. Day-side test for point P: `dot(P̂, Ŝ) > 0`.
Cross-check subsolar point against JPL Horizons for a few timestamps before trusting. Civil/nautical twilight bands at -6°/-12° solar elevation make the terminator visually soft and physically correct.

## Honest forecasting rules (non-negotiable)
- Every forecast number on screen is labeled with its source: "Open-Meteo/GFS forecast" vs "H.O.T baseline model".
- Our own models are **baselines validated on held-out data**, presented as such. NEVER claim to beat or approach national weather services.
- Report accuracy only from a proper temporal holdout (train ≤ 2024, test 2025+), never in-sample.
- Always include persistence (tomorrow = today) as the reference baseline; report skill relative to it: `skill = 1 - MAE_model/MAE_persistence`.
- Report MAE and RMSE per lead time, per city, and aggregated; state the test period and sample size.
- Uncertainty: show forecast spread/error bars from validation residuals, not invented.

## Validation methodology (Earth v1)
- ~20 cities across climate zones (tropical, arid, temperate, continental, polar; coastal + inland; both hemispheres).
- Data: Open-Meteo archive API (ERA5). Hourly 2m temperature, wind, humidity, pressure.
- Models: (1) persistence, (2) hourly climatology (day-of-year ± window mean), (3) physics-informed ridge regression — features: recent temps, climatology anomaly, advection proxy (upwind temp × wind), pressure tendency, solar elevation. Target: t+24h temperature.
- Export: ridge coefficients as JSON for in-browser inference + `accuracy.json` (per-city/aggregate metrics) + `MODEL_CARD.md`.

## Phase 2/3 physics (expand when started)
- Mars: CO2 condensation cycle (seasonal pressure swings ~25%), dust storm season (Ls 180–360), thin-atmosphere radiative balance (large diurnal swings). Validate against REMS archives.
- Moon: no atmosphere → model surface temperature from radiative balance + regolith thermal inertia (Diviner data), illumination from ephemerides, libration from Horizons. No "weather" framing.
