# Global wind data pipeline

Produces a compact global 10 m wind field JSON every 6 hours for the browser
wind-particle animation. A GitHub Actions cron job
([`.github/workflows/wind-data.yml`](../../.github/workflows/wind-data.yml))
runs [`fetch_wind.py`](fetch_wind.py) and commits the result to
`public/data/wind/current.json`, which the app fetches as a static asset.

## Data source and licensing

- **Dataset:** NOAA/NCEP GFS (Global Forecast System), 1.0 degree grid,
  10 m above ground u/v wind components, analysis field (forecast hour 0)
  of the latest available cycle (00/06/12/18 UTC).
- **Primary access path:** NOAA Open Data Dissemination S3 bucket
  `https://noaa-gfs-bdp-pds.s3.amazonaws.com` — the `.idx` sidecar file is
  used to issue HTTP byte-range requests for just the two wind records
  (~53 KB each) instead of the full ~34 MB GRIB2 file.
- **Fallback access path:** NOMADS grib filter
  (`https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl`), which subsets
  the same records server-side. Tried automatically if S3 fails.
  (The NOMADS OPeNDAP/DODS service was retired per NWS Service Change
  Notice 25-81, so GRIB2 is the only lightweight option left.)
- **License:** NOAA/NWS data is a work of the US Government — public domain
  (17 U.S.C. § 105). No key, no auth. Log/verify in `docs/DATA_SOURCES.md`
  per the project data-ingestion rules.
- **Decoding:** a minimal pure-Python/numpy GRIB2 decoder inside
  `fetch_wind.py` (supports data representation templates 5.0, 5.2, 5.3 —
  the ones GFS uses). No GRIB binaries, no compiled deps; works the same on
  Windows and Linux.

## Running locally

```sh
pip install requests numpy
python scripts/wind/fetch_wind.py            # writes scripts/wind/output/current.json
python scripts/wind/fetch_wind.py --out x.json
```

Exit code is non-zero on any failure (network, decode, or validation), and
the output file is only written after the field passes validation (correct
size, finite values, |component| < 120 m/s, plausible global mean speed).
`scripts/wind/output/` is gitignored; CI copies the file into
`public/data/wind/` instead.

The script tries cycles newest-first (today 18z, 12z, 06z, 00z, then
yesterday, then the day before), skipping cycles younger than ~3h20m
(GFS publishes ~3.5–5 h after cycle time), and uses the first cycle that
responds with both wind records.

## Output JSON schema

```jsonc
{
  "meta": {
    "source": "NOAA/NCEP GFS 1.0 deg analysis (aws-s3-nodd)", // or nomads-grib-filter
    "cycle": "2026-07-06T06:00:00Z",     // GFS cycle time (ISO 8601, UTC)
    "forecast_hour": 0,                  // always 0 = analysis
    "generated": "2026-07-06T13:11:53Z", // when this file was produced
    "resolution": 1.0,                   // degrees
    "units": "m/s"
  },
  "nx": 360,      // number of columns (longitudes)
  "ny": 181,      // number of rows (latitudes)
  "lo1": 0,       // longitude of column 0 (degrees east)
  "la1": 90,      // latitude of row 0 (degrees north)
  "dx": 1,        // degrees per column step (eastward)
  "dy": 1,        // degrees per row step (southward)
  "u": [ /* 65160 numbers */ ],  // eastward wind component, m/s
  "v": [ /* 65160 numbers */ ]   // northward wind component, m/s
}
```

- `u` and `v` are flat, row-major arrays of `nx * ny = 65160` numbers,
  rounded to 1 decimal (integral values are serialized without the `.0`).
- `u` > 0 means wind blowing **toward the east**; `v` > 0 means wind blowing
  **toward the north** (standard meteorological earth-relative components).
- File size is ~550 KB raw, ~140 KB gzipped on the wire (GitHub Pages /
  Vercel serve it compressed).

## Coordinate convention (CRITICAL for consumers)

The grid is the GFS native 1.0 degree lat/lon grid, **north to south** and
**west to east starting at 0°E** (not −180). For flat array index `k`:

```js
const row = Math.floor(k / nx);   // 0 .. ny-1  (0 .. 180)
const col = k % nx;               // 0 .. nx-1  (0 .. 359)
const lat = la1 - row * dy;      //  90, 89, ... , -90   (row 0 = North Pole)
const lon = lo1 + col * dx;      //   0,  1, ... , 359   (degrees east)
```

and the inverse, mapping a lat/lon to the nearest grid index:

```js
const row = Math.round(90 - lat);              // lat in [-90, 90]
const col = ((Math.round(lon) % 360) + 360) % 360; // any lon convention -> 0..359
const k = row * nx + col;
```

Notes for the particle animation:

- **Longitude wrap:** columns cover 0…359°E; there is **no duplicate column
  at 360°**. When interpolating between col 359 and col 0, wrap manually.
  For display longitudes in −180…180, convert with `lon > 180 ? lon - 360 : lon`.
- **Poles:** row 0 (90°N) and row 180 (90°S) each contain 360 values whose
  u/v vary with longitude (vector components at the pole rotate with the
  meridian) — treat pole rows with care when interpolating.
- This layout (la1=90, lo1=0, row-major, north-to-south) matches the
  convention used by the classic `earth`/`leaflet-velocity` wind-JSON
  ecosystem, so existing particle-animation code ports directly.

## Update cadence

GFS cycles at 00/06/12/18 UTC publish ~3.5–5 h later. The workflow cron
`25 4,10,16,22 * * *` runs ~4h25m after each cycle (the `:25` offset avoids
GitHub's congested top-of-hour scheduling). If the newest cycle isn't out
yet, the script falls back to the previous one, so the committed file is
always the freshest available analysis, at most ~10 h old.
