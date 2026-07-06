"""Evaluate persistence, climatology, and ridge models on the 2025 holdout.

Honesty guarantees:
- test = issue times in 2025 only; train/test split is strictly temporal
- the ridge is evaluated FROM the exported output/coefficients.json artifact
  (same weights, scaler, and compact climatology a browser would use), so the
  reported numbers are exactly what in-browser inference achieves
- the climatology baseline is the full hourly (doy x hour, +/-7 day window)
  table computed from TRAIN years only
- all three models are scored on the identical sample set per city/lead

Writes model/output/accuracy.json and model/output/MODEL_CARD.md.

Usage: python evaluate.py
"""
from __future__ import annotations

import json
from datetime import date

import numpy as np
import pandas as pd

from common import (CITIES, LEADS, OUTPUT_DIR, TEST_YEAR, TRAIN_YEARS,
                    build_features, eval_hourly_clim, hourly_climatology,
                    load_city, mae_rmse)

MODELS = ["persistence", "climatology", "ridge"]


def evaluate_city(slug: str, coef: dict) -> dict:
    city = coef["cities"][slug]
    lat, lon = city["lat"], city["lon"]
    clim = {
        "daily": np.asarray(city["climatology"]["daily"], dtype=np.float64),
        "diurnal": np.asarray(city["climatology"]["diurnal_month_hour"], dtype=np.float64),
    }
    df = load_city(slug)
    clim_hourly = hourly_climatology(df[df.index.year.isin(TRAIN_YEARS)])

    res = {}
    for lead in LEADS:
        X_all, y_all = build_features(df, clim, lat, lon, lead)
        ok = X_all.notna().all(axis=1) & y_all.notna()
        is_test = ok & (X_all.index.year == TEST_YEAR)
        X = X_all[is_test]
        y = y_all[is_test].to_numpy(dtype=np.float64)
        target_times = X.index + pd.Timedelta(hours=lead)

        m = city["models"][str(lead)]
        mu = np.asarray(m["feature_mean"])
        sd = np.asarray(m["feature_std"])
        w = np.asarray(m["weights"])
        Xz = (X.to_numpy(dtype=np.float64) - mu) / sd

        preds = {
            "persistence": X["t2m"].to_numpy(dtype=np.float64),
            "climatology": eval_hourly_clim(clim_hourly, target_times),
            "ridge": Xz @ w[:-1] + w[-1],
        }
        entry = {"n_test": int(is_test.sum())}
        for name, p in preds.items():
            mae, rmse = mae_rmse(p - y)
            entry[name] = {"mae": round(mae, 3), "rmse": round(rmse, 3)}
        for name in MODELS:
            entry[name]["skill_vs_persistence"] = round(
                1.0 - entry[name]["mae"] / entry["persistence"]["mae"], 3)
        entry["_err"] = {name: p - y for name, p in preds.items()}  # for aggregate
        res[str(lead)] = entry
    return res


def main() -> None:
    with open(OUTPUT_DIR / "coefficients.json") as f:
        coef = json.load(f)

    per_city: dict[str, dict] = {}
    for slug in coef["cities"]:
        print(f"evaluating {slug}", flush=True)
        per_city[slug] = evaluate_city(slug, coef)

    # pooled aggregate over all cities
    aggregate: dict[str, dict] = {}
    for lead in LEADS:
        key = str(lead)
        errs = {m: np.concatenate([per_city[s][key]["_err"][m] for s in per_city])
                for m in MODELS}
        entry = {"n_test": int(sum(per_city[s][key]["n_test"] for s in per_city))}
        for m in MODELS:
            mae, rmse = mae_rmse(errs[m])
            entry[m] = {"mae": round(mae, 3), "rmse": round(rmse, 3)}
        for m in MODELS:
            entry[m]["skill_vs_persistence"] = round(
                1.0 - entry[m]["mae"] / entry["persistence"]["mae"], 3)
        aggregate[key] = entry

    for s in per_city:  # strip working arrays
        for lead in LEADS:
            del per_city[s][str(lead)]["_err"]

    accuracy = {
        "generated": date.today().isoformat(),
        "data_source": "ERA5 reanalysis via Open-Meteo archive API",
        "train_period": f"{min(TRAIN_YEARS)}-01-01 .. {max(TRAIN_YEARS)}-12-31",
        "test_period": f"{TEST_YEAR}-01-01 .. {TEST_YEAR}-12-31 (strict temporal holdout)",
        "leads_hours": LEADS,
        "models": MODELS,
        "metric_units": "deg C",
        "note": "ridge evaluated from the exported coefficients.json artifact; "
                "skill = 1 - MAE_model / MAE_persistence",
        "aggregate": aggregate,
        "per_city": per_city,
    }
    path = OUTPUT_DIR / "accuracy.json"
    with open(path, "w") as f:
        json.dump(accuracy, f, indent=1)
    print(f"wrote {path} ({path.stat().st_size / 1024:.0f} KB)")

    write_model_card(accuracy, coef)


def write_model_card(acc: dict, coef: dict) -> None:
    cities = coef["cities"]
    lines = [
        "# H.O.T-EARTH Baseline Temperature Forecast — Model Card",
        "",
        "## What this is",
        "A set of deliberately simple, transparent baseline models that predict 2 m air",
        "temperature 24/48/72 hours ahead for 20 cities, validated on a strict temporal",
        "holdout. It exists to give the H.O.T digital twin an honest, reproducible,",
        "browser-runnable forecast layer — **it is a baseline for transparency and",
        "education, NOT a competitor to national weather services or to Open-Meteo/GFS",
        "forecasts.** Real NWP models are far more accurate; any forecast shown from",
        "this model must be labeled \"H.O.T baseline model\".",
        "",
        "## Models",
        "1. **Persistence** — T(t+L) = T(t). The reference baseline for skill scores.",
        "2. **Climatology** — mean temperature for that hour-of-day and day-of-year",
        "   (±7-day window), computed from training years only.",
        "3. **Ridge regression** (per city, per lead) — closed-form ridge on 19",
        "   standardized physics-informed features: current/lagged temperature,",
        "   climatology anomaly, pressure + 3 h pressure tendency, humidity, cloud",
        "   cover, wind components, advection proxies (wind × anomaly), hour/season",
        "   sin-cos encodings, and a solar-elevation proxy at issue and target time.",
        "   Lambda chosen per city/lead on a 2024 validation split, refit on 2020-2024.",
        "",
        "## Data",
        f"- Source: ERA5 reanalysis via the Open-Meteo archive API (hourly).",
        f"- Cities: {len(cities)} across tropical/arid/temperate/continental/polar zones,",
        "  both hemispheres.",
        f"- Train: {acc['train_period']}. Test: {acc['test_period']}.",
        "- Climatology and feature scalers computed from the train period only;",
        "  no test-period information enters any model (no leakage).",
        "- Ridge numbers below are computed FROM the exported `coefficients.json`,",
        "  i.e. they are exactly what in-browser inference reproduces.",
        "",
        "## Results (2025 holdout, pooled over all cities)",
        "",
        "| Lead | n | Model | MAE (°C) | RMSE (°C) | Skill vs persistence |",
        "|---|---|---|---|---|---|",
    ]
    for lead in acc["leads_hours"]:
        a = acc["aggregate"][str(lead)]
        for m in MODELS:
            lines.append(f"| t+{lead}h | {a['n_test']} | {m} | {a[m]['mae']:.2f} | "
                         f"{a[m]['rmse']:.2f} | {a[m]['skill_vs_persistence']:.3f} |")
    lines += [
        "",
        "## Per-city MAE at t+24 h (°C, 2025 holdout)",
        "",
        "| City | n | Persistence | Climatology | Ridge | Ridge skill |",
        "|---|---|---|---|---|---|",
    ]
    for slug, r in sorted(acc["per_city"].items(),
                          key=lambda kv: kv[1]["24"]["ridge"]["mae"]):
        e = r["24"]
        lines.append(f"| {cities[slug]['name']} | {e['n_test']} | "
                     f"{e['persistence']['mae']:.2f} | {e['climatology']['mae']:.2f} | "
                     f"{e['ridge']['mae']:.2f} | {e['ridge']['skill_vs_persistence']:.3f} |")
    lines += [
        "",
        "Full per-city metrics for all leads and models: `accuracy.json`.",
        "",
        "## Limitations (read before using)",
        "- **Not an operational forecast.** No atmospheric dynamics, no spatial fields,",
        "  no ensemble. A single-point statistical model cannot see approaching weather",
        "  systems; its skill over climatology comes mostly from local persistence and",
        "  the seasonal/diurnal cycle.",
        "- Verified against ERA5 reanalysis, not station observations; ERA5 itself has",
        "  errors, especially in complex terrain (e.g. Denver) and data-sparse regions.",
        "- One grid point per city; coastal/urban microclimates are not resolved.",
        "- Trained on 2020-2024; performance may degrade under climate drift or",
        "  conditions outside the training distribution.",
        "- Skill decays with lead time; at t+72 h the ridge is only modestly better",
        "  than climatology in many cities.",
        "- Error bars for display should come from the validation residuals in",
        "  `accuracy.json` (per city, per lead), not be invented.",
        "",
        f"*Generated {acc['generated']} by `evaluate.py`. Reproduce with:*",
        "*`python download_data.py && python train.py && python evaluate.py`*",
        "",
    ]
    path = OUTPUT_DIR / "MODEL_CARD.md"
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {path} ({path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
