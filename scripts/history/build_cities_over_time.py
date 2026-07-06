#!/usr/bin/env python3
"""Build public/data/history/cities_over_time.json for the "time-machine Earth" layer.

Source (flagship historical-cities dataset):
    Reba, M., Reitsma, F. & Seto, K. C. (2016)
    "Spatializing 6,000 years of global urbanization from 3700 BC to AD 2000."
    Scientific Data 3, 160034. DOI: 10.1038/sdata.2016.34
    Data (three CSVs) hosted on figshare, licensed CC BY 4.0:
      - Chandler          DOI 10.6084/m9.figshare.2059494  (chandler.csv)
      - Modelski Ancient  DOI 10.6084/m9.figshare.2059497  (modelskiAncient.csv)
      - Modelski Modern   DOI 10.6084/m9.figshare.2059500  (modelskiModern.csv)

License: CC BY 4.0 (verified on the figshare API and the PMC full text, 2026-07-06).
The dataset is freely redistributable with attribution, so the processed JSON produced
by this script MAY be committed to the repo. Attribution lives in the JSON "meta" block
and must also appear in the app credits.

Input format (wide): each CSV row is one city with columns
    City, OtherName, Country, Latitude, Longitude, Certainty, <year columns...>
where each year column is named like "BC_3700" or "AD_1900" and its value is the
population estimate for that city at that year (blank = no estimate).

Output (long/compact): a single JSON with an array of cities, each:
    {
      "name": str,
      "country": str,
      "lat": float,        # rounded to 4 dp
      "lon": float,        # rounded to 4 dp
      "certainty": int,    # 1 = precise, 2 = moderate, 3 = approximate (Reba et al.)
      "foundedYear": int,  # earliest year with a population estimate (BC negative)
      "pop": { "<year>": <population>, ... }  # signed year -> population
    }

Usage:
    python scripts/history/build_cities_over_time.py            # download + build
    python scripts/history/build_cities_over_time.py --local DIR  # use pre-downloaded CSVs

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

# figshare direct file download URLs (verified 2026-07-06 via api.figshare.com/v2/articles/*)
FIGSHARE_FILES = {
    "chandler.csv": "https://ndownloader.figshare.com/files/5290366",
    "modelskiAncient.csv": "https://ndownloader.figshare.com/files/4857010",
    "modelskiModern.csv": "https://ndownloader.figshare.com/files/4857007",
}

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_PATH = os.path.join(REPO_ROOT, "public", "data", "history", "cities_over_time.json")

META = {
    "layer": "cities_over_time",
    "description": (
        "Location and population of urban settlements through time, for the "
        "time-machine Earth layer. Cities appear at their earliest recorded "
        "population estimate and grow/shrink over time."
    ),
    "source": {
        "title": (
            "Spatializing 6,000 years of global urbanization from 3700 BC to AD 2000"
        ),
        "authors": "Reba, M.; Reitsma, F.; Seto, K. C.",
        "publication": "Scientific Data 3, 160034 (2016)",
        "doi": "10.1038/sdata.2016.34",
        "data_doi": [
            "10.6084/m9.figshare.2059494",  # Chandler
            "10.6084/m9.figshare.2059497",  # Modelski Ancient
            "10.6084/m9.figshare.2059500",  # Modelski Modern
        ],
    },
    "license": "CC BY 4.0",
    "license_url": "https://creativecommons.org/licenses/by/4.0/",
    "attribution": (
        "Historical city data: Reba, Reitsma & Seto (2016), "
        "Scientific Data 3:160034, DOI 10.1038/sdata.2016.34, "
        "CC BY 4.0."
    ),
    "certainty_key": {
        "1": "precise location",
        "2": "moderately certain location",
        "3": "approximate location",
    },
    "year_convention": "signed integer year; negative = BC, positive = AD. There is no year 0.",
    "processing": "scripts/history/build_cities_over_time.py",
}


def parse_year_column(col: str):
    """'BC_3700' -> -3700, 'AD_1900' -> 1900. Return None if not a year column."""
    col = col.strip()
    if col.startswith("BC_"):
        try:
            return -int(col[3:])
        except ValueError:
            return None
    if col.startswith("AD_"):
        try:
            return int(col[3:])
        except ValueError:
            return None
    return None


def decode_bytes(raw: bytes) -> str:
    # The figshare CSVs are Windows-1252 (cp1252) encoded, not UTF-8 (they contain
    # accented city names like "Bogotá", "Málaga"). Try UTF-8 first (in case a future
    # revision switches), then fall back to cp1252 which decodes the current files
    # losslessly. Strip a UTF-8 BOM if present.
    for enc in ("utf-8-sig", "cp1252"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("latin-1")


def load_csv_text(name: str, local_dir: str | None) -> str:
    if local_dir:
        path = os.path.join(local_dir, name)
        with open(path, "rb") as f:
            return decode_bytes(f.read())
    url = FIGSHARE_FILES[name]
    print(f"  downloading {name} <- {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "H.O.T-EARTH-history-builder"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read()
    return decode_bytes(raw)


def parse_file(name: str, text: str):
    """Yield (name, country, lat, lon, certainty, {year: pop}) per city row."""
    reader = csv.reader(io.StringIO(text))
    header = next(reader)
    # Map year columns by index
    year_cols = {}  # col_index -> signed year
    for i, col in enumerate(header):
        y = parse_year_column(col)
        if y is not None:
            year_cols[i] = y
    # Fixed columns are the first six: City, OtherName, Country, Latitude, Longitude, Certainty
    for row in reader:
        if not row or len(row) < 6:
            continue
        city = row[0].strip()
        if not city:
            continue
        country = row[2].strip()
        try:
            lat = float(row[3])
            lon = float(row[4])
        except (ValueError, IndexError):
            continue
        try:
            certainty = int(row[5]) if row[5].strip() else 3
        except ValueError:
            certainty = 3
        pop_by_year: dict[int, int] = {}
        for i, year in year_cols.items():
            if i >= len(row):
                continue
            val = row[i].strip()
            if not val:
                continue
            try:
                pop = int(round(float(val)))
            except ValueError:
                continue
            if pop <= 0:
                continue
            # Keep the largest estimate if a year appears twice (it shouldn't within a file)
            if year not in pop_by_year or pop > pop_by_year[year]:
                pop_by_year[year] = pop
        if pop_by_year:
            yield city, country, lat, lon, certainty, pop_by_year


def merge_key(city: str, lat: float, lon: float):
    # Merge the same physical city across the three source files.
    # Round coords to ~0.1 deg (~11 km) so minor coordinate drift between files unifies.
    return (city.casefold(), round(lat, 1), round(lon, 1))


def round_pop(pop: int) -> int:
    """Round population to keep the JSON compact without meaningful loss.

    These are order-of-magnitude historical estimates; 3 significant figures is
    plenty and shrinks the file. e.g. 1929000 -> 1930000, 12345 -> 12300.
    """
    if pop < 1000:
        return int(round(pop, -1))  # nearest 10
    if pop < 100000:
        # nearest 100
        return int(round(pop / 100.0) * 100)
    # nearest 1000
    return int(round(pop / 1000.0) * 1000)


def build(local_dir: str | None):
    merged: dict = {}
    order: list = []
    for name in ("modelskiAncient.csv", "chandler.csv", "modelskiModern.csv"):
        text = load_csv_text(name, local_dir)
        n = 0
        for city, country, lat, lon, certainty, pop_by_year in parse_file(name, text):
            key = merge_key(city, lat, lon)
            if key not in merged:
                merged[key] = {
                    "name": city,
                    "country": country,
                    "lat": lat,
                    "lon": lon,
                    "certainty": certainty,
                    "pop": {},
                }
                order.append(key)
            entry = merged[key]
            # Prefer a non-empty country and the more precise (lower) certainty
            if not entry["country"] and country:
                entry["country"] = country
            if certainty < entry["certainty"]:
                entry["certainty"] = certainty
            for year, pop in pop_by_year.items():
                # If two source files disagree for the same year, keep the larger estimate
                if year not in entry["pop"] or pop > entry["pop"][year]:
                    entry["pop"][year] = pop
            n += 1
        print(f"  parsed {n} city rows from {name}")

    cities = []
    for key in order:
        entry = merged[key]
        pop = entry["pop"]
        years = sorted(pop)
        founded = years[0]
        # Round coords and populations for compactness; stringify years for JSON keys.
        pop_out = {}
        for y in years:
            pop_out[str(y)] = round_pop(pop[y])
        cities.append(
            {
                "name": entry["name"],
                "country": entry["country"],
                "lat": round(entry["lat"], 4),
                "lon": round(entry["lon"], 4),
                "certainty": entry["certainty"],
                "foundedYear": founded,
                "pop": pop_out,
            }
        )

    # Sort by peak population descending so the biggest cities render first.
    cities.sort(key=lambda c: max(c["pop"].values()), reverse=True)

    doc = {
        "meta": {**META, "built": date.today().isoformat(), "cityCount": len(cities)},
        "cities": cities,
    }
    return doc


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--local",
        metavar="DIR",
        default=None,
        help="Use pre-downloaded chandler.csv/modelskiAncient.csv/modelskiModern.csv from DIR",
    )
    args = ap.parse_args()

    print("Building cities_over_time.json (Reba, Reitsma & Seto 2016, CC BY 4.0)")
    doc = build(args.local)

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    # Compact separators to minimize size; still valid JSON.
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, separators=(",", ":"))

    size = os.path.getsize(OUT_PATH)
    n = len(doc["cities"])
    total_points = sum(len(c["pop"]) for c in doc["cities"])
    print(f"\nWrote {OUT_PATH}")
    print(f"  cities: {n}")
    print(f"  city/year population points: {total_points}")
    print(f"  size: {size} bytes ({size/1024:.1f} KiB, {size/1_048_576:.3f} MiB)")
    if size > 1_048_576:
        print("  WARNING: output exceeds 1 MiB budget", file=sys.stderr)


if __name__ == "__main__":
    main()
