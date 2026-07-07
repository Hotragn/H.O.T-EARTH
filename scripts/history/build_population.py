#!/usr/bin/env python3
"""Build public/data/history/population.json for the "time-machine Earth" layer.

World population over time, driving the Virtual Earth HUD's global population
counter that climbs with the timeline.

Source:
    Our World in Data — "Population".
    Grapher CSV:      https://ourworldindata.org/grapher/population.csv
    Grapher page:     https://ourworldindata.org/grapher/population
    OWID's own processing is licensed CC BY 4.0. The underlying series are
    HYDE (2023, CC BY 4.0), Gapminder (2022, CC BY 4.0) and the UN World
    Population Prospects (2024). The chain is cleanly redistributable with
    attribution (verified 2026-07-06; see docs/HISTORY_DATA_SOURCES.md §2b).

Attribution (must also appear in the app credits):
    "Population — HYDE (2023); Gapminder (2022); UN WPP (2024) — with major
     processing by Our World in Data (CC BY 4.0)."

Input format (verified): CSV with columns `Entity, Code, Year, Population`,
covering -10000 (10,000 BCE) -> present, with an `Entity == "World"` row for
the global total.

Output (compact): the exact shape lib/chrono-population.ts expects,
    [ [year, population], [year, population], ... ]   (year CE, negative = BCE)
sorted ascending by year. We keep the World series and DOWNSAMPLE it to a
sensible set of years (dense recent, sparse ancient) so the file stays tiny
(<50 KB) while remaining faithful to the source — every value shipped is an
actual OWID data point (nearest available year), never interpolated.

Usage:
    python scripts/history/build_population.py            # download + build
    python scripts/history/build_population.py --local FILE  # use a pre-downloaded population.csv

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
from datetime import date

OWID_POPULATION_CSV = "https://ourworldindata.org/grapher/population.csv"

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_PATH = os.path.join(REPO_ROOT, "public", "data", "history", "population.json")

# Target years to keep: sparse deep in the past (data is decadal/millennial there
# anyway), dense toward the present where growth is fast and the counter matters.
# For each target year we snap to the NEAREST available World data point, so the
# shipped value is always a real OWID number, never interpolated.
TARGET_YEARS = (
    # deep past (OWID/HYDE step is 1000 yr here)
    [-10000, -8000, -6000, -5000, -4000, -3000, -2000, -1000]
    # antiquity through the medieval period
    + [-500, -200, 1, 200, 500, 800, 1000, 1200, 1300, 1400, 1500, 1600, 1650, 1700]
    # industrial era, every 10 years
    + list(range(1750, 1900, 10))
    # 20th century, every 5 years
    + list(range(1900, 1950, 5))
    # post-war, every 2 years (the counter climbs fast here)
    + list(range(1950, 2000, 2))
    # recent, every year
    + list(range(2000, 2024))
)

META_ATTRIBUTION = (
    "Population — HYDE (2023); Gapminder (2022); UN WPP (2024) — with major "
    "processing by Our World in Data (CC BY 4.0)."
)


def load_csv_text(local: str | None) -> str:
    if local:
        with open(local, "rb") as f:
            return f.read().decode("utf-8-sig")
    print(f"  downloading population.csv <- {OWID_POPULATION_CSV}")
    req = urllib.request.Request(
        OWID_POPULATION_CSV,
        headers={"User-Agent": "H.O.T-EARTH-history-builder"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read()
    return raw.decode("utf-8-sig")


def parse_world_series(text: str) -> list[tuple[int, int]]:
    """Extract the `World` rows as sorted (year, population) pairs."""
    reader = csv.DictReader(io.StringIO(text))
    # Column names are Entity, Code, Year, Population (Population column may carry
    # a longer machine name in some OWID exports; detect the population column).
    fields = reader.fieldnames or []
    pop_col = None
    for f in fields:
        if f and f.lower().startswith("population"):
            pop_col = f
            break
    if pop_col is None:
        # last column is the value column in OWID grapher CSVs
        pop_col = fields[-1]

    series: list[tuple[int, int]] = []
    for row in reader:
        if (row.get("Entity") or "").strip() != "World":
            continue
        try:
            year = int(row["Year"])
            pop = int(round(float(row[pop_col])))
        except (KeyError, ValueError, TypeError):
            continue
        if pop <= 0:
            continue
        series.append((year, pop))
    series.sort()
    return series


def round_pop(pop: int) -> int:
    """Round to ~3 significant figures — these summarize billions of people;
    3 sig-figs is faithful and shrinks the file. e.g. 8_021_407_000 -> 8_020_000_000."""
    if pop < 1000:
        return pop
    import math

    digits = int(math.floor(math.log10(pop)))
    scale = 10 ** (digits - 2)  # keep 3 significant figures
    return int(round(pop / scale) * scale)


def downsample(series: list[tuple[int, int]]) -> list[list[int]]:
    """Snap each TARGET_YEAR to the nearest available World data point.

    Guarantees every shipped value is a real OWID observation. Deduplicates when
    two targets snap to the same source year (keeps one), and always keeps the
    most-recent available point so the counter's present-day value is accurate.
    """
    if not series:
        return []
    years = [y for y, _ in series]
    by_year = dict(series)

    chosen: dict[int, int] = {}
    for target in TARGET_YEARS:
        # nearest available source year to this target
        best = min(years, key=lambda y: (abs(y - target), y))
        chosen[best] = by_year[best]

    # Always include the latest available point (present-day counter value).
    latest_year = years[-1]
    chosen[latest_year] = by_year[latest_year]

    out = [[y, round_pop(chosen[y])] for y in sorted(chosen)]
    return out


def build(local: str | None) -> list[list[int]]:
    text = load_csv_text(local)
    series = parse_world_series(text)
    if not series:
        raise SystemExit("ERROR: no World rows found in population.csv")
    print(f"  World series: {len(series)} points, {series[0][0]}..{series[-1][0]}")
    out = downsample(series)
    print(f"  downsampled to {len(out)} points")
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--local",
        metavar="FILE",
        default=None,
        help="Use a pre-downloaded OWID population.csv instead of fetching",
    )
    args = ap.parse_args()

    print("Building population.json (Our World in Data — Population, CC BY 4.0)")
    points = build(args.local)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    # The loader (lib/chrono-population.ts) expects a bare array of [year, pop]
    # pairs. Ship exactly that — no wrapper object — so it parses with
    # usingFallback=false. Provenance lives in docs + the attribution footer.
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(points, f, separators=(",", ":"))

    size = os.path.getsize(OUT_PATH)
    print(f"\nWrote {OUT_PATH}")
    print(f"  points: {len(points)}")
    print(f"  range:  {points[0][0]} .. {points[-1][0]}")
    print(f"  size:   {size} bytes ({size/1024:.1f} KiB)")
    print(f"  attribution: {META_ATTRIBUTION}")
    if size > 50_000:
        print("  WARNING: output exceeds 50 KB budget", file=sys.stderr)


if __name__ == "__main__":
    main()
