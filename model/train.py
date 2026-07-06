"""Train per-city physics-informed ridge regressions for t+24/48/72h temperature.

Strict temporal discipline:
- climatology and feature scalers computed from TRAIN years (2020-2024) only
- ridge lambda picked on a 2024 validation split (train 2020-2023), then refit
  on the full 2020-2024 train period
- 2025 is never touched here

Writes model/output/coefficients.json — everything a browser needs for inference
(feature names, per-city scaler, weights, compact climatology, lat/lon).

Usage: python train.py
"""
from __future__ import annotations

import json
import time

import numpy as np
import pandas as pd

from common import (CITIES, FEATURE_NAMES, LEADS, OUTPUT_DIR, RIDGE_LAMBDAS, SEED,
                    TRAIN_YEARS, VAL_YEAR, build_features, compact_climatology,
                    load_city, mae_rmse, ridge_fit, ridge_predict)

np.random.seed(SEED)


def train_city(slug: str) -> dict:
    name, lat, lon = CITIES[slug]
    df = load_city(slug)
    train_mask_years = df.index.year.isin(TRAIN_YEARS)
    train_df = df[train_mask_years]
    clim = compact_climatology(train_df)

    city_out = {
        "name": name, "lat": lat, "lon": lon,
        "climatology": {
            "daily": [round(float(v), 2) for v in clim["daily"]],
            "diurnal_month_hour": [[round(float(v), 2) for v in row]
                                   for row in clim["diurnal"]],
        },
        "models": {},
    }

    for lead in LEADS:
        X_all, y_all = build_features(df, clim, lat, lon, lead)
        target_times = X_all.index + pd.Timedelta(hours=lead)
        ok = X_all.notna().all(axis=1) & y_all.notna()
        # train samples: issue time AND target time inside train years (no leakage)
        is_train = ok & X_all.index.year.isin(TRAIN_YEARS) & (target_times.year <= max(TRAIN_YEARS))
        is_val = is_train & (X_all.index.year == VAL_YEAR)
        is_fit = is_train & (X_all.index.year != VAL_YEAR)

        mu = X_all[is_fit].mean().to_numpy()
        sd = X_all[is_fit].std(ddof=0).to_numpy()
        sd[sd == 0] = 1.0

        def z(mask, mu=mu, sd=sd):
            return (X_all[mask].to_numpy(dtype=np.float64) - mu) / sd

        Xf, yf = z(is_fit), y_all[is_fit].to_numpy(dtype=np.float64)
        Xv, yv = z(is_val), y_all[is_val].to_numpy(dtype=np.float64)

        best_lam, best_mae = None, np.inf
        for lam in RIDGE_LAMBDAS:
            w = ridge_fit(Xf, yf, lam)
            mae, _ = mae_rmse(ridge_predict(Xv, w) - yv)
            if mae < best_mae:
                best_lam, best_mae = lam, mae

        # refit on the full train period with the chosen lambda; rescale with full-train stats
        mu = X_all[is_train].mean().to_numpy()
        sd = X_all[is_train].std(ddof=0).to_numpy()
        sd[sd == 0] = 1.0
        Xt = (X_all[is_train].to_numpy(dtype=np.float64) - mu) / sd
        yt = y_all[is_train].to_numpy(dtype=np.float64)
        w = ridge_fit(Xt, yt, best_lam)

        city_out["models"][str(lead)] = {
            "lambda": best_lam,
            "n_train": int(is_train.sum()),
            "feature_mean": [round(float(v), 5) for v in mu],
            "feature_std": [round(float(v), 5) for v in sd],
            "weights": [round(float(v), 6) for v in w],  # intercept LAST
        }
        print(f"  {slug} t+{lead}h: lambda={best_lam}, n_train={int(is_train.sum())}, "
              f"val_MAE={best_mae:.3f} C", flush=True)
    return city_out


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    out = {
        "meta": {
            "description": "H.O.T-EARTH baseline temperature forecast: per-city ridge "
                           "regression on standardized physics-informed features. "
                           "prediction = dot(weights[:-1], (x - feature_mean)/feature_std) + weights[-1]. "
                           "Climatology: clim(t) = daily[doy-1] + diurnal_month_hour[month-1][utc_hour].",
            "target": "temperature_2m (deg C) at t + lead hours",
            "leads_hours": LEADS,
            "feature_names": FEATURE_NAMES,
            "train_period": f"{min(TRAIN_YEARS)}-01-01 .. {max(TRAIN_YEARS)}-12-31",
            "data_source": "ERA5 reanalysis via Open-Meteo archive API",
            "wind_convention": "u10=-speed*sin(dir), v10=-speed*cos(dir); dir = direction wind comes FROM",
        },
        "cities": {},
    }
    for slug in CITIES:
        print(f"training {slug}", flush=True)
        out["cities"][slug] = train_city(slug)

    path = OUTPUT_DIR / "coefficients.json"
    with open(path, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"\nwrote {path} ({path.stat().st_size / 1024:.0f} KB) in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
