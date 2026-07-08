#!/usr/bin/env python3
"""Build public/data/history/climate.json for the "time-machine Earth" layer.

Industrial-era climate: global mean surface temperature anomaly (deg C) and
atmospheric CO2 (ppm) over time, driving the Virtual Earth HUD's climate readout
which comes alive in the industrial era (>= 1850).

Sources (all public domain):

  Temperature — NASA GISTEMP v4, global land-ocean annual mean anomaly.
    CSV:  https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv
    Page: https://data.giss.nasa.gov/gistemp/
    Annual mean = the `J-D` (Jan-Dec) column, vs the 1951-1980 baseline,
    1880-present. US Government work -> public domain. Courtesy citation:
    "GISTEMP Team, GISS Surface Temperature Analysis (GISTEMP) v4, NASA GISS."

  CO2 (pre-1959) — Law Dome ice core, Rubino et al. (2019), NOAA/NCEI WDS Paleo.
    TXT:  https://www.ncei.noaa.gov/pub/data/paleo/icecore/antarctica/law/law2018co2-noaa.txt
    NOAA dataset DOI 10.25921/dwg2-6m61; ESSD 11:473 (2019). NOAA/WDS Paleo ->
    public domain. Gas-age (year CE) + CO2 ppm; splice with Mauna Loa.

  CO2 (1959-present) — Mauna Loa annual mean, NOAA GML.
    CSV:  https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.csv
    US Government work -> public domain.

Verified 2026-07-06; see docs/HISTORY_DATA_SOURCES.md §5.

IMPORTANT — baseline note. GISTEMP anomalies are vs 1951-1980. The loader
(lib/chrono-climate.ts) documents the anomaly baseline as "1850-1900
pre-industrial" for its built-in fallback. To ship a truthful series on the
pre-industrial baseline the app labels, we re-reference GISTEMP to 1880-1899
(the earliest available window, a documented ~0.1-0.2 deg C offset from a true
1850-1900 baseline). The offset is applied as a single documented constant so
the numbers we ship are self-consistent and faithful to GISTEMP's data.

Output (compact): the exact shape lib/chrono-climate.ts expects,
    [ [year, tempAnomalyC, co2ppm], ... ]   (year CE)
sorted ascending by year. Years without a value carry `null` (the loader
tolerates null / missing). CO2 pre-1959 is the Law Dome ice-core series
(nearest gas-age to each target decade); 1959+ is Mauna Loa annual mean.

Usage:
    python scripts/history/build_climate.py    # download all three + build

No third-party dependencies (stdlib only): urllib + csv + json.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
import sys
import urllib.request

GISTEMP_CSV = "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv"
# Mirror of the same public-domain NASA GISTEMP v4 annual global-mean series,
# packaged by DataHub's `core/global-temp` (values are identical to NASA's
# direct file: 1880 = -0.18 degC vs 1951-1980; used only if data.giss.nasa.gov
# is unreachable, which happened intermittently this session). Columns:
# Source,Year,Mean with Source == "GISTEMP".
GISTEMP_MIRROR_CSV = "https://datahub.io/core/global-temp/r/annual.csv"
LAWDOME_TXT = (
    "https://www.ncei.noaa.gov/pub/data/paleo/icecore/antarctica/law/"
    "law2018co2-noaa.txt"
)
MAUNALOA_CSV = "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.csv"

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_PATH = os.path.join(REPO_ROOT, "public", "data", "history", "climate.json")

# Raw-source cache. NASA's data.giss.nasa.gov is occasionally unreachable
# (transient timeouts). To keep the build reproducible we cache each fetched
# raw file here on first success and fall back to the cache when the live host
# is down. These caches are the exact public-domain source files, kept small.
CACHE_DIR = os.path.join(os.path.dirname(__file__), "data")

# GISTEMP anomalies are vs 1951-1980. Re-reference to the 1880-1899 window (the
# earliest GISTEMP data, a reasonable stand-in for a pre-industrial baseline the
# app labels 1850-1900). Computed from the data itself below, not hard-coded, so
# it stays exact if GISTEMP revises.

# CO2 target years pre-1959: decadal 1850-1950, denser near 1958. Each snaps to
# the nearest Law Dome gas-age observation (a real ice-core measurement).
CO2_PRE1959_TARGETS = list(range(1850, 1960, 10)) + [1955, 1958]


def fetch(url: str, cache_name: str) -> str:
    """Fetch `url`; on success cache the raw bytes under scripts/history/data/.

    If the live fetch fails (NASA's GISS host times out intermittently) and a
    cache exists, use the cached copy so the build stays reproducible. The
    cache is the exact public-domain source file.
    """
    cache_path = os.path.join(CACHE_DIR, cache_name)
    try:
        print(f"  downloading <- {url}")
        req = urllib.request.Request(
            url, headers={"User-Agent": "H.O.T-EARTH-history-builder"}
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read()
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(cache_path, "wb") as f:
            f.write(raw)
        return raw.decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001 - any network error -> try cache
        if os.path.exists(cache_path):
            print(f"    live fetch failed ({type(e).__name__}); using cache {cache_path}")
            with open(cache_path, "rb") as f:
                return f.read().decode("utf-8", "replace")
        raise SystemExit(
            f"ERROR: could not fetch {url} ({type(e).__name__}) and no cache at "
            f"{cache_path}. Re-run when the host is reachable to seed the cache."
        )


def fetch_gistemp() -> dict[int, float]:
    """Get the NASA GISTEMP v4 annual global-mean anomaly (vs 1951-1980).

    Prefers the canonical NASA file (data.giss.nasa.gov). If that host is
    unreachable and no NASA cache exists, falls back to the DataHub mirror of
    the identical public-domain series. Whichever succeeds is cached.
    """
    cache_path = os.path.join(CACHE_DIR, "GLB.Ts+dSST.csv")
    # 1) canonical NASA file (also uses on-disk cache if the host is down)
    try:
        return parse_gistemp_annual(fetch(GISTEMP_CSV, "GLB.Ts+dSST.csv"))
    except SystemExit:
        pass  # host down and no NASA cache -> try the mirror
    if os.path.exists(cache_path):
        with open(cache_path, "rb") as f:
            return parse_gistemp_annual(f.read().decode("utf-8", "replace"))
    # 2) DataHub mirror of the same GISTEMP series
    print("  NASA GISS host unreachable; using DataHub GISTEMP mirror")
    text = fetch(GISTEMP_MIRROR_CSV, "global-temp-annual.csv")
    parsed = parse_gistemp_mirror(text)
    if not parsed:
        raise SystemExit("ERROR: GISTEMP unavailable from NASA and mirror")
    return parsed


def parse_gistemp_mirror(text: str) -> dict[int, float]:
    """Parse the DataHub `core/global-temp` annual CSV (Source,Year,Mean).

    Keeps only Source == "GISTEMP" — the same NASA GISTEMP v4 annual global-mean
    anomaly (vs 1951-1980) as the direct NASA file.
    """
    out: dict[int, float] = {}
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        if (row.get("Source") or "").strip().upper() != "GISTEMP":
            continue
        try:
            out[int(row["Year"])] = float(row["Mean"])
        except (KeyError, ValueError, TypeError):
            continue
    return out


def parse_gistemp_annual(text: str) -> dict[int, float]:
    """Return {year: annual_anomaly_C_vs_1951_1980} from the J-D column."""
    lines = [l for l in text.splitlines() if l.strip()]
    reader = csv.reader(io.StringIO("\n".join(lines)))
    rows = list(reader)
    # First line is a title ("Land-Ocean: Global Means"); header is next.
    header_idx = 0
    for i, row in enumerate(rows):
        if row and row[0].strip() == "Year":
            header_idx = i
            break
    header = rows[header_idx]
    try:
        jd_idx = header.index("J-D")
    except ValueError:
        jd_idx = 13  # documented column position
    out: dict[int, float] = {}
    for row in rows[header_idx + 1 :]:
        if not row or not row[0].strip().isdigit():
            continue
        year = int(row[0])
        if jd_idx >= len(row):
            continue
        cell = row[jd_idx].strip()
        if not cell or cell.startswith("*"):
            continue  # '***' = missing (incomplete year)
        try:
            out[year] = float(cell)
        except ValueError:
            continue
    return out


def parse_lawdome_co2(text: str) -> list[tuple[int, float]]:
    """Return sorted [(year_CE, co2_ppm)] from the Law Dome table.

    Table header line is `SampleID<TAB>age_ice<TAB>age_CO2<TAB>CO2ppm<TAB>CO2err`;
    data rows follow with no leading '#'. We use age_CO2 (gas age, year CE) and
    CO2ppm.
    """
    lines = text.splitlines()
    header_idx = None
    for i, l in enumerate(lines):
        parts = l.split("\t")
        if parts and parts[0].strip() == "SampleID" and "CO2ppm" in parts:
            header_idx = i
            age_idx = parts.index("age_CO2")
            co2_idx = parts.index("CO2ppm")
            break
    if header_idx is None:
        raise SystemExit("ERROR: could not find Law Dome data header")

    out: list[tuple[int, float]] = []
    for l in lines[header_idx + 1 :]:
        if not l.strip() or l.startswith("#"):
            continue
        p = l.split("\t")
        if len(p) <= max(age_idx, co2_idx):
            continue
        try:
            year = int(round(float(p[age_idx])))
            co2 = float(p[co2_idx])
        except ValueError:
            continue
        out.append((year, co2))
    out.sort()
    return out


def parse_maunaloa_co2(text: str) -> dict[int, float]:
    """Return {year: annual_mean_co2_ppm} from the NOAA GML annual-mean CSV."""
    out: dict[int, float] = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("year"):
            continue
        parts = line.split(",")
        if len(parts) < 2:
            continue
        try:
            year = int(parts[0])
            co2 = float(parts[1])
        except ValueError:
            continue
        out[year] = co2
    return out


def nearest(pairs: list[tuple[int, float]], target: int) -> tuple[int, float]:
    return min(pairs, key=lambda yc: (abs(yc[0] - target), yc[0]))


def build() -> tuple[list[list], dict]:
    gistemp = fetch_gistemp()
    lawdome = parse_lawdome_co2(fetch(LAWDOME_TXT, "law2018co2-noaa.txt"))
    maunaloa = parse_maunaloa_co2(fetch(MAUNALOA_CSV, "co2_annmean_mlo.csv"))

    if not gistemp:
        raise SystemExit("ERROR: no GISTEMP annual values parsed")
    print(f"  GISTEMP: {len(gistemp)} annual anomalies "
          f"{min(gistemp)}..{max(gistemp)} (vs 1951-1980)")
    print(f"  Law Dome CO2: {len(lawdome)} points "
          f"{lawdome[0][0]}..{lawdome[-1][0]}")
    print(f"  Mauna Loa CO2: {len(maunaloa)} annual means "
          f"{min(maunaloa)}..{max(maunaloa)}")

    # Re-reference GISTEMP to its 1880-1899 mean (pre-industrial stand-in).
    base_years = [y for y in range(1880, 1900) if y in gistemp]
    baseline = sum(gistemp[y] for y in base_years) / len(base_years)
    print(f"  1880-1899 GISTEMP baseline offset: {baseline:+.3f} deg C "
          f"(subtracted so anomalies are vs pre-industrial)")

    # Assemble CO2 by target year: Law Dome (nearest ice-core obs) up to 1958,
    # Mauna Loa annual mean from 1959 on. Every value is a real observation.
    co2_by_year: dict[int, float] = {}
    for target in CO2_PRE1959_TARGETS:
        y, c = nearest(lawdome, target)
        co2_by_year[target] = round(c, 1)
    for year, c in maunaloa.items():
        co2_by_year[year] = round(c, 2)

    # Temperature by year: every GISTEMP year >= 1850 (data starts 1880),
    # re-referenced to the pre-industrial baseline.
    temp_by_year: dict[int, float] = {
        y: round(v - baseline, 3) for y, v in gistemp.items()
    }

    # Union of years, sorted; emit [year, temp|null, co2|null].
    all_years = sorted(set(temp_by_year) | set(co2_by_year))
    rows: list[list] = []
    for y in all_years:
        t = temp_by_year.get(y)
        c = co2_by_year.get(y)
        rows.append([y, t, c])

    meta = {
        "temp_years": (min(temp_by_year), max(temp_by_year)),
        "co2_years": (min(co2_by_year), max(co2_by_year)),
        "baseline_offset_C": round(baseline, 3),
    }
    return rows, meta


def main() -> None:
    argparse.ArgumentParser(description=__doc__).parse_args()

    print("Building climate.json (NASA GISTEMP + Law Dome + Mauna Loa, public domain)")
    rows, meta = build()

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    # The loader (lib/chrono-climate.ts) expects a bare array of
    # [year, tempAnomalyC, co2ppm] triples (null tolerated). Ship exactly that.
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(rows, f, separators=(",", ":"))

    size = os.path.getsize(OUT_PATH)
    n_temp = sum(1 for r in rows if r[1] is not None)
    n_co2 = sum(1 for r in rows if r[2] is not None)
    print(f"\nWrote {OUT_PATH}")
    print(f"  rows:  {len(rows)} ({rows[0][0]}..{rows[-1][0]})")
    print(f"  temp:  {n_temp} years {meta['temp_years']} (vs pre-industrial, "
          f"offset {meta['baseline_offset_C']:+.3f} from GISTEMP 1951-1980)")
    print(f"  co2:   {n_co2} years {meta['co2_years']} (Law Dome + Mauna Loa)")
    print(f"  size:  {size} bytes ({size/1024:.1f} KiB)")
    if size > 50_000:
        print("  WARNING: output exceeds 50 KB budget", file=sys.stderr)


if __name__ == "__main__":
    main()
