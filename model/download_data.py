"""Download hourly ERA5 reanalysis data from the Open-Meteo archive API.

One request per city-year, cached to model/data_cache/<slug>_<year>.parquet.
Reruns skip anything already cached. Polite: ~1s sleep between requests,
exponential backoff (with extra wait on HTTP 429) on failure.

Usage: python download_data.py
"""
from __future__ import annotations

import sys
import time

import pandas as pd
import requests

from common import CACHE_DIR, CITIES, HOURLY_VARS, YEARS, cache_path

API_URL = "https://archive-api.open-meteo.com/v1/archive"
SLEEP_BETWEEN = 1.0
MAX_RETRIES = 5


def fetch_city_year(lat: float, lon: float, year: int) -> pd.DataFrame:
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": f"{year}-01-01",
        "end_date": f"{year}-12-31",
        "hourly": ",".join(HOURLY_VARS),
        "timezone": "UTC",
    }
    last_err: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            r = requests.get(API_URL, params=params, timeout=120)
            if r.status_code == 429:
                wait = 30 * (attempt + 1)
                print(f"    rate limited (429), sleeping {wait}s", flush=True)
                time.sleep(wait)
                continue
            r.raise_for_status()
            hourly = r.json()["hourly"]
            df = pd.DataFrame(
                {v: pd.array(hourly[v], dtype="Float32") for v in HOURLY_VARS},
                index=pd.to_datetime(hourly["time"], utc=True),
            )
            df.index.name = "time"
            return df
        except Exception as e:  # noqa: BLE001 — retry any transport/parse error
            last_err = e
            wait = 2 ** (attempt + 1)
            print(f"    attempt {attempt + 1} failed ({e}); retrying in {wait}s", flush=True)
            time.sleep(wait)
    raise RuntimeError(f"giving up after {MAX_RETRIES} attempts: {last_err}")


def main() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    failed: list[str] = []
    for slug, (name, lat, lon) in CITIES.items():
        for year in YEARS:
            path = cache_path(slug, year)
            if path.exists():
                continue
            print(f"{name} {year} ...", flush=True)
            try:
                df = fetch_city_year(lat, lon, year)
            except RuntimeError as e:
                print(f"  FAILED permanently: {e}", flush=True)
                failed.append(f"{slug}_{year}")
                continue
            n_missing = int(df["temperature_2m"].isna().sum())
            df.to_parquet(path)
            print(f"  saved {len(df)} rows ({n_missing} missing temps) -> {path.name}", flush=True)
            time.sleep(SLEEP_BETWEEN)
    if failed:
        print(f"\nFailed chunks (rerun to retry): {failed}")
        sys.exit(1)
    print("\nAll city-years cached.")


if __name__ == "__main__":
    main()
