# H.O.T-EARTH Baseline Temperature Forecast — Model Card

## What this is
A set of deliberately simple, transparent baseline models that predict 2 m air
temperature 24/48/72 hours ahead for 20 cities, validated on a strict temporal
holdout. It exists to give the H.O.T digital twin an honest, reproducible,
browser-runnable forecast layer — **it is a baseline for transparency and
education, NOT a competitor to national weather services or to Open-Meteo/GFS
forecasts.** Real NWP models are far more accurate; any forecast shown from
this model must be labeled "H.O.T baseline model".

## Models
1. **Persistence** — T(t+L) = T(t). The reference baseline for skill scores.
2. **Climatology** — mean temperature for that hour-of-day and day-of-year
   (±7-day window), computed from training years only.
3. **Ridge regression** (per city, per lead) — closed-form ridge on 19
   standardized physics-informed features: current/lagged temperature,
   climatology anomaly, pressure + 3 h pressure tendency, humidity, cloud
   cover, wind components, advection proxies (wind × anomaly), hour/season
   sin-cos encodings, and a solar-elevation proxy at issue and target time.
   Lambda chosen per city/lead on a 2024 validation split, refit on 2020-2024.

## Data
- Source: ERA5 reanalysis via the Open-Meteo archive API (hourly).
- Cities: 20 across tropical/arid/temperate/continental/polar zones,
  both hemispheres.
- Train: 2020-01-01 .. 2024-12-31. Test: 2025-01-01 .. 2025-12-31 (strict temporal holdout).
- Climatology and feature scalers computed from the train period only;
  no test-period information enters any model (no leakage).
- Ridge numbers below are computed FROM the exported `coefficients.json`,
  i.e. they are exactly what in-browser inference reproduces.

## Results (2025 holdout, pooled over all cities)

| Lead | n | Model | MAE (°C) | RMSE (°C) | Skill vs persistence |
|---|---|---|---|---|---|
| t+24h | 174720 | persistence | 1.87 | 2.70 | 0.000 |
| t+24h | 174720 | climatology | 2.47 | 3.37 | -0.321 |
| t+24h | 174720 | ridge | 1.69 | 2.35 | 0.096 |
| t+48h | 174240 | persistence | 2.46 | 3.48 | 0.000 |
| t+48h | 174240 | climatology | 2.47 | 3.37 | -0.002 |
| t+48h | 174240 | ridge | 2.09 | 2.88 | 0.152 |
| t+72h | 173760 | persistence | 2.73 | 3.82 | 0.000 |
| t+72h | 173760 | climatology | 2.47 | 3.37 | 0.098 |
| t+72h | 173760 | ridge | 2.25 | 3.10 | 0.178 |

## Per-city MAE at t+24 h (°C, 2025 holdout)

| City | n | Persistence | Climatology | Ridge | Ridge skill |
|---|---|---|---|---|---|
| Lagos | 8736 | 0.69 | 0.68 | 0.59 | 0.148 |
| Mumbai | 8736 | 0.77 | 1.33 | 0.77 | 0.003 |
| Nairobi | 8736 | 0.91 | 1.23 | 0.85 | 0.055 |
| Singapore | 8736 | 1.05 | 1.17 | 0.94 | 0.097 |
| Cairo | 8736 | 1.33 | 1.97 | 1.22 | 0.089 |
| Auckland | 8736 | 1.37 | 1.61 | 1.24 | 0.097 |
| Punta Arenas | 8736 | 1.66 | 1.76 | 1.40 | 0.156 |
| Phoenix | 8736 | 1.80 | 2.96 | 1.61 | 0.104 |
| Sao Paulo | 8736 | 1.93 | 2.54 | 1.70 | 0.120 |
| Sydney | 8736 | 2.09 | 2.24 | 1.79 | 0.144 |
| Reykjavik | 8736 | 1.99 | 2.77 | 1.87 | 0.061 |
| Anchorage | 8736 | 1.98 | 3.13 | 1.87 | 0.052 |
| Tokyo | 8736 | 2.06 | 2.51 | 1.89 | 0.085 |
| London | 8736 | 2.09 | 2.78 | 1.96 | 0.065 |
| Buenos Aires | 8736 | 2.26 | 2.79 | 2.01 | 0.111 |
| Berlin | 8736 | 2.20 | 2.93 | 2.04 | 0.072 |
| Beijing | 8736 | 2.33 | 2.96 | 2.12 | 0.089 |
| Moscow | 8736 | 2.10 | 4.08 | 2.13 | -0.015 |
| Boston | 8736 | 3.35 | 3.67 | 2.79 | 0.168 |
| Denver | 8736 | 3.38 | 4.22 | 2.96 | 0.122 |

Full per-city metrics for all leads and models: `accuracy.json`.

## Limitations (read before using)
- **Not an operational forecast.** No atmospheric dynamics, no spatial fields,
  no ensemble. A single-point statistical model cannot see approaching weather
  systems; its skill over climatology comes mostly from local persistence and
  the seasonal/diurnal cycle.
- Verified against ERA5 reanalysis, not station observations; ERA5 itself has
  errors, especially in complex terrain (e.g. Denver) and data-sparse regions.
- One grid point per city; coastal/urban microclimates are not resolved.
- Trained on 2020-2024; performance may degrade under climate drift or
  conditions outside the training distribution.
- Skill decays with lead time; at t+72 h the ridge is only modestly better
  than climatology in many cities.
- Error bars for display should come from the validation residuals in
  `accuracy.json` (per city, per lead), not be invented.

*Generated 2026-07-06 by `evaluate.py`. Reproduce with:*
*`python download_data.py && python train.py && python evaluate.py`*
