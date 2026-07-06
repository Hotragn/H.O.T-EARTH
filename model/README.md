# H.O.T-EARTH forecast model layer

Honest baseline temperature forecasts (t+24/48/72 h) for 20 cities, trained on
ERA5 reanalysis (via the Open-Meteo archive API) and validated on a strict
temporal holdout. Produces browser-usable JSON artifacts.

Read `output/MODEL_CARD.md` before using any numbers. These are transparent
educational baselines, not a competitor to national weather services.

## Reproduce

```bash
pip install -r requirements.txt
python download_data.py   # ~120 polite API calls, cached to data_cache/ (rerun-safe)
python train.py           # fits climatology + per-city ridge -> output/coefficients.json
python evaluate.py        # 2025 holdout metrics -> output/accuracy.json + MODEL_CARD.md
```

Everything is deterministic (closed-form ridge, no stochastic steps).
`data_cache/` is gitignored; a full re-download takes a few minutes.

## Layout

- `common.py` — cities, feature engineering, climatology, closed-form numpy ridge
- `download_data.py` — one request per city-year, retry/backoff, parquet cache
- `train.py` — lambda selection on a 2024 validation split, refit on 2020-2024
- `evaluate.py` — scores persistence / climatology / ridge on 2025 only;
  the ridge is scored **from the exported `coefficients.json`**, so reported
  accuracy is exactly what in-browser inference reproduces
- `output/coefficients.json` — per-city weights, scaler stats, compact
  climatology (daily + month-by-hour diurnal), feature names, lat/lon
- `output/accuracy.json` — MAE/RMSE/skill per city and aggregate, sample counts
- `output/MODEL_CARD.md` — full results and limitations

## Honest-forecasting rules honored here

- Train ≤ 2024, test = 2025 only; climatology and scalers from train only.
- Persistence is always reported; skill = 1 − MAE_model / MAE_persistence.
- MAE and RMSE per lead time, per city, and pooled, with sample sizes.
- Any UI showing these forecasts must label them "H.O.T baseline model".

## Browser inference

For a city and lead L ∈ {24, 48, 72}:

```
clim(t)   = daily[doy(t)-1] + diurnal_month_hour[month(t)-1][utc_hour(t)]
x         = 19 features (see meta.feature_names; built from current obs, time, lat/lon, clim)
z         = (x - feature_mean) / feature_std
T(t+L)    = dot(weights[:19], z) + weights[19]     # intercept last
```

Wind components use the meteorological convention
(`u = -speed·sin(dir)`, `v = -speed·cos(dir)`; dir = direction wind comes from).
The solar-elevation proxy is documented in `common.py:solar_elevation_sin`.
