#!/usr/bin/env python3
"""Build a compact Mars seasonal surface-pressure climatology JSON from the
real Viking Lander daily-average pressure record.

Flagship honest Mars signal: the seasonal CO2 condensation/sublimation cycle.
Each Martian winter, ~25-30% of the atmosphere freezes onto the winter polar
cap as CO2 ice, then sublimates back in spring/summer. The two Viking Landers
measured this directly in 1976-1982 as a large, repeatable annual swing in
surface pressure. This is measured in-situ data, not a model.

Data source (public domain, NASA Planetary Data System):
    Dataset:  VL1/VL2-M-MET-4-DAILY-AVG-PRESSURE-V1.0
    Node:     PDS Atmospheres Node (NMSU)
    File:     https://atmos.nmsu.edu/PDS/data/vl_1001/data/vl_avep.dat
    Label:    https://atmos.nmsu.edu/PDS/data/vl_1001/data/vl_avep.lbl
    Landing page:
      https://atmos.nmsu.edu/data_and_services/atmospheres_data/MARS/viking/sol_avg_sur_press_data.html

The .dat file is a fixed-width ASCII table (RECORD_BYTES=87, 3297 rows,
17 columns) produced by the PDS Atmospheres node. Columns used here (1-based
byte offsets from vl_avep.lbl):
    SC_ID        bytes  1-5    "VL1" | "VL2"
    VIKING_YEAR  bytes  6-7    Viking mission year 1-4
    SOL_LON      bytes  8-15   areocentric solar longitude Ls (degrees)
    MARTIAN_DAY  bytes 16-20   sol since landing
    PRESS_MEAN   bytes 21-27   daily mean surface pressure (mbar); flag -9.999
    PRESS_MIN    bytes 28-34   daily minimum pressure (mbar);       flag -9.999
No-value flag for pressure is -9.999 and is dropped.

Method: parse the file, drop no-value rows, then bin PRESS_MEAN by Ls into
`--bins` equal-width bins over 0-360 deg (default 24 => 15 deg per bin, one
per "half Mars-month"). We report the per-bin mean, min, and max of the daily
means, and the sample count, separately for VL1 and VL2. This is a genuine
observational climatology of the seasonal pressure cycle.

Usage:
    pip install requests   # optional; falls back to urllib if absent
    python scripts/mars/build_pressure_climatology.py \
        --out public/data/mars/seasonal_pressure.json

Exit code 0 on success (valid JSON written), non-zero on any failure.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import ssl
import sys
import urllib.request

SRC_DAT = "https://atmos.nmsu.edu/PDS/data/vl_1001/data/vl_avep.dat"
SRC_LBL = "https://atmos.nmsu.edu/PDS/data/vl_1001/data/vl_avep.lbl"
LANDING = (
    "https://atmos.nmsu.edu/data_and_services/atmospheres_data/"
    "MARS/viking/sol_avg_sur_press_data.html"
)
DATASET_ID = "VL1/VL2-M-MET-4-DAILY-AVG-PRESSURE-V1.0"
USER_AGENT = "hot-mars-pressure-pipeline/1.0 (open-source Mars digital twin)"
NOVAL = -9.0  # anything <= this in PRESS_MEAN is the -9.999 no-value flag


def fetch(url: str) -> bytes:
    """GET a URL, tolerating the atmos.nmsu.edu certificate chain."""
    # The atmos.nmsu.edu host sometimes serves an incomplete cert chain;
    # this is NASA PDS public-domain data over a NMSU host, so we proceed
    # without strict verification. (Data integrity is separately checkable
    # against the PDS label row count.)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, context=ctx, timeout=90) as r:
        return r.read()


def parse_rows(text: str):
    """Yield (sc_id, ls, sol, press_mean) for parseable rows with valid mean."""
    for line in text.splitlines():
        if len(line) < 27:
            continue
        sc = line[0:5].strip()
        if sc not in ("VL1", "VL2"):
            continue
        try:
            ls = float(line[7:15])
            sol = int(line[15:20])
            pmean = float(line[20:27])
        except ValueError:
            continue
        if pmean <= NOVAL:
            continue
        if not (0.0 <= ls <= 360.0):
            continue
        yield sc, ls, sol, pmean


def build_climatology(rows, nbins: int):
    """Bin daily-mean pressures by Ls for each lander. Returns dict per lander."""
    width = 360.0 / nbins
    out = {}
    for sc in ("VL1", "VL2"):
        out[sc] = [
            {"ls_min": round(i * width, 3),
             "ls_max": round((i + 1) * width, 3),
             "_vals": []}
            for i in range(nbins)
        ]
    for sc, ls, sol, pmean in rows:
        b = min(int(ls // width), nbins - 1)
        out[sc][b]["_vals"].append(pmean)
    result = {}
    for sc, bins in out.items():
        clean = []
        for b in bins:
            vals = b.pop("_vals")
            if vals:
                b["n"] = len(vals)
                b["p_mean_mbar"] = round(sum(vals) / len(vals), 3)
                b["p_min_mbar"] = round(min(vals), 3)
                b["p_max_mbar"] = round(max(vals), 3)
            else:
                b["n"] = 0
                b["p_mean_mbar"] = None
                b["p_min_mbar"] = None
                b["p_max_mbar"] = None
            clean.append(b)
        result[sc] = clean
    return result


def lander_stats(rows_list, sc):
    vals = [(ls, p) for (s, ls, sol, p) in rows_list if s == sc]
    if not vals:
        return None
    ps = [p for _, p in vals]
    pmin = min(ps)
    pmax = max(ps)
    mean = sum(ps) / len(ps)
    ls_at_min = next(ls for ls, p in vals if p == pmin)
    ls_at_max = next(ls for ls, p in vals if p == pmax)
    return {
        "n_sols": len(vals),
        "p_annual_mean_mbar": round(mean, 3),
        "p_min_mbar": round(pmin, 3),
        "ls_at_min_deg": round(ls_at_min, 1),
        "p_max_mbar": round(pmax, 3),
        "ls_at_max_deg": round(ls_at_max, 1),
        "seasonal_swing_pct": round((pmax - pmin) / mean * 100.0, 1),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default="public/data/mars/seasonal_pressure.json")
    ap.add_argument("--bins", type=int, default=24,
                    help="number of equal-width Ls bins over 0-360 deg")
    ap.add_argument("--dat", default=None,
                    help="path to a local vl_avep.dat instead of downloading")
    args = ap.parse_args()

    if args.dat:
        with open(args.dat, "r", errors="replace") as f:
            text = f.read()
    else:
        try:
            text = fetch(SRC_DAT).decode("ascii", errors="replace")
        except Exception as e:  # noqa: BLE001
            print(f"ERROR fetching {SRC_DAT}: {e}", file=sys.stderr)
            return 2

    rows = list(parse_rows(text))
    if len(rows) < 1000:
        print(f"ERROR: only {len(rows)} valid rows parsed; expected ~2600",
              file=sys.stderr)
        return 3

    climo = build_climatology(rows, args.bins)
    vl1 = lander_stats(rows, "VL1")
    vl2 = lander_stats(rows, "VL2")

    doc = {
        "_comment": (
            "Mars seasonal surface-pressure climatology binned by areocentric "
            "solar longitude (Ls), derived from real in-situ Viking Lander "
            "daily-average pressure measurements. This is the flagship honest "
            "Mars 'weather' signal: the seasonal CO2 condensation/sublimation "
            "cycle. Each Martian winter ~25-30% of the atmosphere freezes onto "
            "the winter polar cap and sublimates back later, producing the large "
            "repeatable annual pressure swing seen below. MEASURED DATA, not a "
            "model. VL1 (Chryse Planitia, 22.3N) and VL2 (Utopia Planitia, "
            "47.7N) sit at different elevations and latitudes, so their absolute "
            "pressures differ; both show the same seasonal cycle."
        ),
        "source": {
            "dataset_id": DATASET_ID,
            "provider": "NASA Planetary Data System, Atmospheres Node (NMSU)",
            "instrument": "Viking Meteorology Instrument System (VMIS), Viking Landers 1 & 2",
            "data_file": SRC_DAT,
            "label_file": SRC_LBL,
            "landing_page": LANDING,
            "license": "Public domain (NASA / US Government data, 17 U.S.C. 105)",
            "column_used": "PRESS_MEAN (daily mean surface pressure, mbar)",
            "acquired_utc": dt.datetime.now(dt.timezone.utc).strftime(
                "%Y-%m-%dT%H:%M:%SZ"),
            "verified_date": "2026-07-06",
            "primary_reference": (
                "Hess, S. L., et al. (1980), The annual cycle of pressure on "
                "Mars measured by Viking Landers 1 and 2, Geophys. Res. Lett., "
                "7(3), 197-200, doi:10.1029/GL007i003p00197."
            ),
        },
        "units": {"pressure": "mbar (hPa)", "ls": "degrees"},
        "ls_reference": {
            "0": "northern spring equinox",
            "90": "northern summer solstice (aphelion season)",
            "180": "northern autumn equinox",
            "251": "Mars perihelion (Ls_p ~ 251 deg)",
            "270": "northern winter solstice = southern summer (dust storm season)",
        },
        "stats": {"VL1": vl1, "VL2": vl2},
        "n_bins": args.bins,
        "bin_width_deg": round(360.0 / args.bins, 3),
        "climatology_by_ls": climo,
    }

    out_path = args.out
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
        f.write("\n")

    size = os.path.getsize(out_path)
    print(f"Wrote {out_path} ({size} bytes)")
    print(f"  parsed {len(rows)} valid sols "
          f"(VL1={vl1['n_sols']}, VL2={vl2['n_sols']})")
    print(f"  VL1 swing {vl1['seasonal_swing_pct']}% "
          f"({vl1['p_min_mbar']}->{vl1['p_max_mbar']} mbar)")
    print(f"  VL2 swing {vl2['seasonal_swing_pct']}% "
          f"({vl2['p_min_mbar']}->{vl2['p_max_mbar']} mbar)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
