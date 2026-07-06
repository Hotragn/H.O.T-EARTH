"""Shared constants and functions for the H.O.T-EARTH baseline forecast models.

Everything here is deliberately simple and deterministic:
- climatology built from TRAIN years only
- features computable in a browser from current obs + lat/lon + time + exported JSON
- ridge regression solved in closed form with numpy
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from pathlib import Path

SEED = 42  # no stochastic steps exist, but set anyway for reproducibility
np.random.seed(SEED)

MODEL_DIR = Path(__file__).resolve().parent
CACHE_DIR = MODEL_DIR / "data_cache"
OUTPUT_DIR = MODEL_DIR / "output"

# ---------------------------------------------------------------- data spec
CITIES = {
    # slug: (display name, lat, lon)  — ~20 cities across climate zones, both hemispheres
    "singapore":    ("Singapore",     1.3521,  103.8198),
    "mumbai":       ("Mumbai",       19.0760,   72.8777),
    "cairo":        ("Cairo",        30.0444,   31.2357),
    "phoenix":      ("Phoenix",      33.4484, -112.0740),
    "london":       ("London",       51.5074,   -0.1278),
    "berlin":       ("Berlin",       52.5200,   13.4050),
    "moscow":       ("Moscow",       55.7558,   37.6173),
    "boston":       ("Boston",       42.3601,  -71.0589),
    "denver":       ("Denver",       39.7392, -104.9903),
    "reykjavik":    ("Reykjavik",    64.1466,  -21.9426),
    "nairobi":      ("Nairobi",      -1.2921,   36.8219),
    "lagos":        ("Lagos",         6.5244,    3.3792),
    "sao_paulo":    ("Sao Paulo",   -23.5505,  -46.6333),
    "buenos_aires": ("Buenos Aires",-34.6037,  -58.3816),
    "sydney":       ("Sydney",      -33.8688,  151.2093),
    "auckland":     ("Auckland",    -36.8485,  174.7633),
    "tokyo":        ("Tokyo",        35.6762,  139.6503),
    "beijing":      ("Beijing",      39.9042,  116.4074),
    "anchorage":    ("Anchorage",    61.2181, -149.9003),
    "punta_arenas": ("Punta Arenas",-53.1638,  -70.9171),
}

HOURLY_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "surface_pressure",
    "wind_speed_10m",
    "wind_direction_10m",
    "cloud_cover",
]

START_DATE = "2020-01-01"
END_DATE = "2025-12-31"
YEARS = list(range(2020, 2026))
TRAIN_YEARS = list(range(2020, 2025))   # 2020-2024
VAL_YEAR = 2024                         # used only to pick ridge lambda, then refit on all train
TEST_YEAR = 2025                        # strict temporal holdout
LEADS = [24, 48, 72]                    # forecast lead times in hours
CLIM_WINDOW_DAYS = 7                    # +/- days for climatology smoothing

FEATURE_NAMES = [
    "t2m",           # T(t)
    "t2m_m24",       # T(t-24h)
    "dt24",          # T(t) - T(t-24h)
    "anom",          # T(t) - compact_climatology(t)
    "clim_target",   # compact_climatology(t + lead)
    "rh",            # relative humidity (t)
    "cloud",         # cloud cover (t)
    "sp",            # surface pressure (t)
    "dp3",           # 3h pressure tendency: sp(t) - sp(t-3h)
    "u10",           # eastward wind component (t)
    "v10",           # northward wind component (t)
    "adv_u",         # u10 * anom (advection proxy)
    "adv_v",         # v10 * anom (advection proxy)
    "sin_hod",       # sin(2*pi*hour/24), UTC hour
    "cos_hod",
    "sin_doy",       # sin(2*pi*doy/365.25)
    "cos_doy",
    "solar_now",     # sine of solar elevation at t
    "solar_target",  # sine of solar elevation at t + lead
]

RIDGE_LAMBDAS = [0.03, 0.1, 0.3, 1.0, 3.0, 10.0, 30.0, 100.0]


# ---------------------------------------------------------------- data access
def cache_path(slug: str, year: int) -> Path:
    return CACHE_DIR / f"{slug}_{year}.parquet"


def load_city(slug: str) -> pd.DataFrame:
    """Load all cached years for a city and reindex to a complete hourly UTC range."""
    frames = []
    for year in YEARS:
        p = cache_path(slug, year)
        if p.exists():
            frames.append(pd.read_parquet(p))
    if not frames:
        raise FileNotFoundError(f"no cached data for {slug}; run download_data.py")
    df = pd.concat(frames).sort_index()
    df = df[~df.index.duplicated(keep="first")]
    full = pd.date_range(df.index.min(), df.index.max(), freq="h", tz="UTC")
    return df.reindex(full)


# ---------------------------------------------------------------- solar geometry
def solar_elevation_sin(lat: float, lon: float, times: pd.DatetimeIndex) -> np.ndarray:
    """Sine of solar elevation (proxy: no equation-of-time or refraction correction).

    sin(elev) = sin(lat)sin(decl) + cos(lat)cos(decl)cos(hour_angle)
    decl ~ -23.44 deg * cos(2*pi*(doy+10)/365.25); solar time ~ UTC + lon/15.
    Accurate to ~a degree or two — fine as a regression feature.
    """
    doy = times.dayofyear.to_numpy(dtype=np.float64)
    hour = times.hour.to_numpy(dtype=np.float64) + times.minute.to_numpy(dtype=np.float64) / 60.0
    decl = np.deg2rad(-23.44) * np.cos(2.0 * np.pi * (doy + 10.0) / 365.25)
    solar_time = (hour + lon / 15.0) % 24.0
    hour_angle = np.deg2rad(15.0 * (solar_time - 12.0))
    lat_r = np.deg2rad(lat)
    return np.sin(lat_r) * np.sin(decl) + np.cos(lat_r) * np.cos(decl) * np.cos(hour_angle)


# ---------------------------------------------------------------- climatology
def _circular_window_mean(sums: np.ndarray, cnts: np.ndarray, window: int) -> np.ndarray:
    """Mean over a circular +/-window along axis 0 (day-of-year axis)."""
    s = np.zeros_like(sums)
    c = np.zeros_like(cnts)
    for k in range(-window, window + 1):
        s += np.roll(sums, k, axis=0)
        c += np.roll(cnts, k, axis=0)
    with np.errstate(invalid="ignore", divide="ignore"):
        return s / c


def hourly_climatology(train: pd.DataFrame) -> np.ndarray:
    """Full (366, 24) hourly climatology: mean T for each (doy, hour) over a +/-7 day
    circular window, TRAIN years only. This is the 'Climatology' baseline model."""
    t = train["temperature_2m"]
    ok = t.notna().to_numpy()
    doy = train.index.dayofyear.to_numpy()[ok] - 1
    hod = train.index.hour.to_numpy()[ok]
    vals = t.to_numpy(dtype=np.float64)[ok]
    sums = np.zeros((366, 24))
    cnts = np.zeros((366, 24))
    np.add.at(sums, (doy, hod), vals)
    np.add.at(cnts, (doy, hod), 1.0)
    return _circular_window_mean(sums, cnts, CLIM_WINDOW_DAYS)


def compact_climatology(train: pd.DataFrame) -> dict:
    """Browser-compact climatology from TRAIN years only:
      clim(t) = daily[doy] + diurnal[month][hour]
    daily: 366 smoothed (+/-7d circular) daily-mean temps.
    diurnal: (12, 24) mean deviation of T from its own calendar-day mean.
    """
    t = train["temperature_2m"].dropna()
    idx = t.index
    # daily component
    daily_mean = t.groupby(idx.date).mean()
    dm_idx = pd.DatetimeIndex(daily_mean.index)
    sums = np.zeros(366)
    cnts = np.zeros(366)
    dm_doy = dm_idx.dayofyear.to_numpy() - 1
    np.add.at(sums, dm_doy, daily_mean.to_numpy(dtype=np.float64))
    np.add.at(cnts, dm_doy, 1.0)
    daily = _circular_window_mean(sums[:, None], cnts[:, None], CLIM_WINDOW_DAYS)[:, 0]
    # diurnal component: deviation from that specific day's mean, averaged by (month, hour)
    day_mean_per_row = t.groupby(idx.date).transform("mean")
    resid = (t - day_mean_per_row).to_numpy(dtype=np.float64)
    dsum = np.zeros((12, 24))
    dcnt = np.zeros((12, 24))
    mh = (idx.month.to_numpy() - 1, idx.hour.to_numpy())
    np.add.at(dsum, mh, resid)
    np.add.at(dcnt, mh, 1.0)
    with np.errstate(invalid="ignore", divide="ignore"):
        diurnal = dsum / dcnt
    return {"daily": daily, "diurnal": diurnal}


def eval_compact_clim(clim: dict, times: pd.DatetimeIndex) -> np.ndarray:
    return (clim["daily"][times.dayofyear.to_numpy() - 1]
            + clim["diurnal"][times.month.to_numpy() - 1, times.hour.to_numpy()])


def eval_hourly_clim(table: np.ndarray, times: pd.DatetimeIndex) -> np.ndarray:
    return table[times.dayofyear.to_numpy() - 1, times.hour.to_numpy()]


# ---------------------------------------------------------------- features
def build_features(df: pd.DataFrame, clim: dict, lat: float, lon: float,
                   lead: int) -> tuple[pd.DataFrame, pd.Series]:
    """Feature matrix (issue time t) and target T(t+lead).

    df must have a complete hourly UTC index. All features are computable in a
    browser from the current observation, lat/lon, timestamp and the exported
    compact climatology.
    """
    idx = df.index
    t2m = df["temperature_2m"]
    sp = df["surface_pressure"]
    wd = np.deg2rad(df["wind_direction_10m"].to_numpy(dtype=np.float64))
    ws = df["wind_speed_10m"].to_numpy(dtype=np.float64)
    # meteorological convention: direction is where wind comes FROM
    u10 = -ws * np.sin(wd)
    v10 = -ws * np.cos(wd)

    clim_now = eval_compact_clim(clim, idx)
    target_times = idx + pd.Timedelta(hours=lead)
    clim_target = eval_compact_clim(clim, target_times)
    anom = t2m.to_numpy(dtype=np.float64) - clim_now

    hod = idx.hour.to_numpy(dtype=np.float64)
    doy = idx.dayofyear.to_numpy(dtype=np.float64)

    feats = pd.DataFrame({
        "t2m": t2m,
        "t2m_m24": t2m.shift(24),
        "dt24": t2m - t2m.shift(24),
        "anom": anom,
        "clim_target": clim_target,
        "rh": df["relative_humidity_2m"],
        "cloud": df["cloud_cover"],
        "sp": sp,
        "dp3": sp - sp.shift(3),
        "u10": u10,
        "v10": v10,
        "adv_u": u10 * anom,
        "adv_v": v10 * anom,
        "sin_hod": np.sin(2 * np.pi * hod / 24.0),
        "cos_hod": np.cos(2 * np.pi * hod / 24.0),
        "sin_doy": np.sin(2 * np.pi * doy / 365.25),
        "cos_doy": np.cos(2 * np.pi * doy / 365.25),
        "solar_now": solar_elevation_sin(lat, lon, idx),
        "solar_target": solar_elevation_sin(lat, lon, target_times),
    }, index=idx)[FEATURE_NAMES]
    target = t2m.shift(-lead)
    return feats, target


# ---------------------------------------------------------------- ridge
def ridge_fit(X: np.ndarray, y: np.ndarray, lam: float) -> np.ndarray:
    """Closed-form ridge with unpenalized intercept. X standardized, no bias column.
    Returns weights of length p+1 (intercept last)."""
    n, p = X.shape
    Xb = np.hstack([X, np.ones((n, 1))])
    A = Xb.T @ Xb
    A[np.arange(p), np.arange(p)] += lam
    return np.linalg.solve(A, Xb.T @ y)


def ridge_predict(X: np.ndarray, w: np.ndarray) -> np.ndarray:
    return X @ w[:-1] + w[-1]


def mae_rmse(err: np.ndarray) -> tuple[float, float]:
    return float(np.mean(np.abs(err))), float(np.sqrt(np.mean(err ** 2)))
