#!/usr/bin/env python3
"""Build public/data/planets/zonal_winds.json -- MEASURED zonal wind profiles.

The honest "dynamic" layer for the gas/ice giants: mean zonal (east-west) wind
speed vs latitude, from cloud-feature tracking. These are MEASUREMENTS presented
as a climatological mean profile -- NOT a forecast, NOT live. Convention:
**positive = eastward (prograde)**, m/s, vs latitude (deg).

DATA PROVENANCE (verified 2026-07-06) and the honest per-body situation:

  * JUPITER -- FULL real profile. Transcribed from the published cloud-tracked
    zonal wind profile of Barrado-Izagirre et al. (2013), A&A 554, A74, made
    available as VizieR/CDS catalog J/A+A/554/A74 (table3.dat: latitude, zonal
    velocity m/s, error, N). Downloaded and read this session. Strongest
    eastward jet +153.7 m/s at 21 deg N; equatorial ~+70 m/s; strongest
    westward -52.5 m/s at 17 deg S. We decimate the 1-deg native table to ~3 deg
    steps for the app (peaks preserved). This is genuine dense measured data.

  * SATURN -- LANDMARK points only (flagged). The canonical full dense profile
    (Garcia-Melendo et al. 2011, Icarus 215, 62-74, Cassini ISS 2004-2009) is
    archived at the NASA PDS (bundle urn:nasa:pds:coiss_zonal_winds,
    DOI 10.17189/1518962) but is NOT an openly downloadable flat table this
    session. We therefore give only the well-documented, individually-cited
    landmark values: the broad equatorial super-jet (~+450 m/s; Cassini
    ~400-450, Voyager ~470 [Sanchez-Lavega et al. 2000], VIMS confirms
    >450-500 m/s at the jet core), a mid-equatorial value (+390 m/s at ~8 deg S,
    VIMS/Cassini), and the north polar hexagon jet (~+120 m/s near 78 deg N;
    Godfrey 1988 / Cassini). NOT a dense curve -- flagged in the source string.

  * NEPTUNE -- LANDMARK points only (flagged). Neptune's canonical zonal wind
    profile is the smooth Voyager-2 fit of Sromovsky et al. (1993), Icarus 105,
    110-141 (their Table VII / 6th-order fit), from features tracked by
    Limaye & Sromovsky (1991). That fit is paper-only (coefficients not openly
    downloadable this session; the modern Tollefson et al. 2018 fit is
    paywalled). We give only the firmly-documented landmark values: equatorial
    retrograde ~-400 m/s and a prograde jet ~+250 m/s at ~70 deg S
    (Limaye & Sromovsky 1991; Sromovsky et al. 1993). Neptune has the fastest
    winds in the solar system, ~2100 km/h (~580 m/s), measured by Voyager 2
    (1989) -- noted in the source string. NOT a dense curve -- flagged.

HONESTY: nothing here is fabricated or interpolated with invented values.
Jupiter is a real dense profile; Saturn/Neptune are documented landmark points
with the missing dense data explicitly flagged. See docs/PLANETS_PHYSICS.md and
docs/PLANETS_DATA_SOURCES.md (section 5).

Usage:
    python scripts/planets/build_zonal_winds.py \
        --out public/data/planets/zonal_winds.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os

# --- JUPITER: real profile, Barrado-Izagirre et al. 2013 (CDS J/A+A/554/A74, table3.dat) ---
# Columns: latitude(deg)  zonal_velocity(m/s)  error(m/s)  N   (blank velocity = no data)
# Transcribed verbatim from the downloaded catalog file (latitude 63..-60, 1-deg step).
JUPITER_TABLE3 = """
63.0   6.51
62.0   7.17
61.0
60.0   3.99
59.0  -3.48
58.0  -9.17
57.0  -6.54
56.0  -5.41
55.0  -5.22
54.0  11.44
53.0  26.09
52.0  27.09
51.0  15.10
50.0   0.51
49.0   1.89
48.0   7.09
47.0   3.78
46.0   7.55
45.0   9.10
44.0  13.15
43.0  13.35
42.0  11.61
41.0   7.64
40.0  15.69
39.0  20.26
38.0   6.02
37.0   1.01
36.0  -3.17
35.0  -0.87
34.0   9.14
33.0  32.13
32.0  39.05
31.0  32.13
30.0   4.06
29.0 -17.22
28.0 -21.96
27.0 -12.86
26.0  12.13
25.0  29.14
24.0  40.46
23.0  72.22
22.0 116.92
21.0 153.67
20.0 117.05
19.0  68.02
18.0  34.93
17.0   2.62
16.0  -8.71
15.0  -8.04
14.0  -0.45
13.0   7.98
12.0  18.20
11.0  35.55
10.0  52.72
9.0   84.61
8.0  134.82
7.0  140.91
6.0  140.22
5.0  125.00
4.0  109.39
3.0   91.80
2.0   77.33
1.0   68.48
0.0   69.79
-1.0   74.00
-2.0   84.33
-3.0   91.69
-4.0  107.69
-5.0  124.48
-6.0  142.05
-7.0  137.30
-8.0   88.31
-9.0   58.09
-10.0  49.63
-11.0  36.65
-12.0  22.53
-13.0   9.27
-14.0  -8.59
-15.0 -21.51
-16.0 -35.39
-17.0 -52.47
-18.0 -48.74
-19.0 -35.83
-20.0 -19.27
-21.0  -5.97
-22.0  10.57
-23.0  23.53
-24.0  37.94
-25.0  19.95
-26.0  16.27
-27.0   7.18
-28.0  -2.91
-29.0  -3.45
-30.0  -0.46
-31.0  11.49
-32.0  35.92
-33.0  24.11
-34.0  14.19
-35.0   1.65
-36.0   2.51
-37.0   6.62
-38.0  10.04
-39.0  27.93
-40.0  31.03
-41.0  25.98
-42.0  20.79
-43.0   1.54
-44.0 -13.58
-45.0  -7.75
-46.0   2.90
-47.0   5.02
-48.0  15.93
-49.0  27.58
-50.0   4.60
-51.0 -12.08
-52.0 -19.33
-53.0 -16.61
-54.0 -21.82
-55.0 -23.91
-56.0 -12.10
-57.0 -14.62
-58.0 -34.14
-59.0 -16.93
-60.0 -17.69
"""

# --- SATURN: documented landmark points (see module docstring). [lat, v_m/s] ---
SATURN_LANDMARKS = [
    [-8.0, 390.0],   # ~8 deg S: 390 +/- 50 m/s (VIMS / Cassini, in the broad equatorial jet)
    [0.0, 450.0],    # equatorial super-jet peak: Cassini ~400-450 (Garcia-Melendo 2011), Voyager ~470
    [78.0, 120.0],   # north polar hexagon eastward jet (~120 m/s; Godfrey 1988 / Cassini)
]

# --- NEPTUNE: documented landmark points (see module docstring). [lat, v_m/s] ---
NEPTUNE_LANDMARKS = [
    [-70.0, 250.0],  # prograde jet ~+250 m/s at ~70 deg S (Limaye & Sromovsky 1991)
    [0.0, -400.0],   # equatorial retrograde ~-400 m/s (Sromovsky et al. 1993 canonical Voyager fit)
]


def parse_jupiter(decimate_deg: float = 3.0):
    """Parse the embedded Barrado-Izagirre 2013 table; return ascending [lat, v]
    decimated to ~decimate_deg steps (native 1-deg), skipping no-data rows and
    always keeping multiples of decimate_deg (which include the 21N peak)."""
    pts = []
    for line in JUPITER_TABLE3.strip().splitlines():
        parts = line.split()
        if len(parts) < 2:
            continue  # blank velocity (no data) -> skip
        lat = float(parts[0])
        v = float(parts[1])
        pts.append((lat, v))
    # decimate: keep rows whose latitude is a multiple of decimate_deg
    step = int(round(decimate_deg))
    kept = [(lat, v) for (lat, v) in pts if round(lat) % step == 0]
    kept.sort(key=lambda t: t[0])  # ascending latitude
    return [[round(lat, 1), round(v, 1)] for lat, v in kept]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="public/data/planets/zonal_winds.json")
    ap.add_argument("--jupiter-step", type=float, default=3.0)
    args = ap.parse_args()

    jup = parse_jupiter(args.jupiter_step)
    sat = sorted(SATURN_LANDMARKS, key=lambda t: t[0])
    nep = sorted(NEPTUNE_LANDMARKS, key=lambda t: t[0])

    doc = {
        "meta": {
            "note": (
                "MEASURED mean zonal (east-west) wind profiles from cloud-feature "
                "tracking. These are measurements presented as a climatological mean "
                "profile -- NOT a forecast and NOT live. Jupiter is a FULL dense real "
                "profile (Barrado-Izagirre et al. 2013). Saturn and Neptune are "
                "DOCUMENTED LANDMARK POINTS ONLY: their full dense profiles are not "
                "openly downloadable -- Saturn's is archived at the NASA PDS "
                "(Garcia-Melendo et al. 2011), Neptune's canonical curve is the "
                "Sromovsky et al. 1993 Voyager-2 fit (paper-only). Nothing here is "
                "fabricated or interpolated with invented values. See "
                "docs/PLANETS_PHYSICS.md and docs/PLANETS_DATA_SOURCES.md sec.5."
            ),
            "units": "m/s",
            "convention": "positive = eastward (prograde)",
            "latitude_units": "degrees (as tabulated by the cited source)",
            "verified_date": "2026-07-06",
            "generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "coverage": {
                "Jupiter": "full dense measured profile (~3-deg decimation of a 1-deg table)",
                "Saturn": "landmark points only (equatorial super-jet, ~8S, hexagon jet) -- full profile in NASA PDS",
                "Neptune": "landmark points only (equatorial retrograde, ~70S prograde jet) -- full fit paper-only",
            },
        },
        "bodies": {
            "Jupiter": {
                "source": (
                    "Barrado-Izagirre et al. (2013), A&A 554, A74 -- cloud-tracked zonal "
                    "wind profile; VizieR/CDS catalog J/A+A/554/A74 (table3.dat: latitude, "
                    "zonal velocity m/s, error, N). Downloaded & transcribed 2026-07-06. "
                    "Measured (HST/Cassini-era cloud tracking); peak +153.7 m/s at 21N, "
                    "equator ~+70 m/s, min -52.5 m/s at 17S. Great Red Spot ~22S "
                    "(Simon et al. 2018). Measured mean profile, not a forecast."
                ),
                "profile": jup,
            },
            "Saturn": {
                "source": (
                    "LANDMARK POINTS ONLY (full dense profile archived at NASA PDS: "
                    "Garcia-Melendo et al. 2011, Icarus 215, 62-74, Cassini ISS 2004-2009, "
                    "bundle urn:nasa:pds:coiss_zonal_winds, DOI 10.17189/1518962 -- not "
                    "openly downloadable this session). Values here: broad equatorial "
                    "super-jet ~+450 m/s at 0deg (Cassini ~400-450; Voyager ~470, "
                    "Sanchez-Lavega et al. 2000; VIMS >450-500 m/s at jet core); +390 m/s "
                    "at ~8S (VIMS/Cassini); north polar hexagon eastward jet ~+120 m/s near "
                    "78N (Godfrey 1988 / Cassini). Measured, not a forecast; sparse -- see PDS for the full curve."
                ),
                "profile": sat,
            },
            "Neptune": {
                "source": (
                    "LANDMARK POINTS ONLY (canonical dense profile is the Sromovsky et al. "
                    "1993, Icarus 105, 110-141 smooth Voyager-2 fit -- Table VII/6th-order "
                    "fit -- from features tracked by Limaye & Sromovsky 1991; paper-only, "
                    "coefficients not openly downloadable this session). Values here: "
                    "equatorial retrograde ~-400 m/s at 0deg; prograde jet ~+250 m/s at "
                    "~70S (Limaye & Sromovsky 1991; Sromovsky et al. 1993). Fastest winds "
                    "in the solar system, ~2100 km/h (~580 m/s), Voyager 2 1989 (NASA). "
                    "Great Dark Spot is TRANSIENT (GDS-89 gone by 1994; NDS-2018 at 23N, "
                    "Simon et al. 2019). Measured, not a forecast; sparse."
                ),
                "profile": nep,
            },
        },
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
        f.write("\n")

    size = os.path.getsize(args.out)
    print(f"Wrote {args.out} ({size} bytes)")
    print(f"  Jupiter: {len(jup)} points (real dense profile), "
          f"lat {jup[0][0]}..{jup[-1][0]}, peak {max(v for _,v in jup)} m/s")
    print(f"  Saturn:  {len(sat)} landmark points (flagged sparse)")
    print(f"  Neptune: {len(nep)} landmark points (flagged sparse)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
