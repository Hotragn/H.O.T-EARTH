# Sun & space-weather data pipeline

Builds the honest Sun-tab artifacts for Phase 10 from **free, public-domain**
sources. See [`docs/SUN_DATA_SOURCES.md`](../../docs/SUN_DATA_SOURCES.md) and
[`docs/SUN_PHYSICS.md`](../../docs/SUN_PHYSICS.md) for the full source, license,
CORS, and methodology record.

Space weather is the project's one genuine *forecasting* domain: NOAA's Space
Weather Prediction Center (SWPC) issues **real operational forecasts**. This
pipeline **visualizes SWPC's measurements and forecasts and attributes them to
SWPC** — it never makes its own space-weather forecast.

## `fetch_spaceweather.py` — live space-weather snapshot + solar-cycle history

Produces two committed **fallback** files:
- [`public/data/sun/spaceweather.json`](../../public/data/sun/spaceweather.json)
  — current-ish solar wind, planetary Kp series, OVATION aurora summary
  (FORECAST), GOES X-ray + latest flare, F10.7, sunspot number, and Cycle-25
  context.
- [`public/data/sun/solar_cycle.json`](../../public/data/sun/solar_cycle.json)
  — monthly sunspot / F10.7 history + SWPC's predicted Cycle-25 curve.

These are a **SNAPSHOT**. Every SWPC endpoint returns
`Access-Control-Allow-Origin: *` (verified), so the **frontend fetches SWPC
live, client-side** (like Open-Meteo on Earth); the committed JSON is the
offline / first-paint / rate-limit fallback (`is_snapshot: true`,
`live_fetch_recommended: true`).

### Sources and licensing
- **Provider:** NOAA SWPC, `https://services.swpc.noaa.gov/`.
- **License:** U.S. Government work, **public domain** (17 U.S.C. § 105). No key.
- **SILSO note:** the International Sunspot Number in SWPC's solar-cycle file
  originates from WDC-SILSO (Royal Observatory of Belgium), whose own files are
  **CC BY-NC 4.0** (rejected). We ship NOAA's own count (`observed_swpc_ssn`,
  public domain) as the primary series and carry ISN only as a flagged
  reference from NOAA's public-domain redistribution.

### Categories (honesty contract)
- **MEASURED:** solar wind (DSCOVR/ACE), Kp, GOES X-ray/flares, SSN, F10.7.
- **FORECAST (SWPC's):** OVATION aurora, predicted solar cycle.
- **COMPUTED (ours):** aurora activity word + oval latitude from measured Kp
  (coarse, labeled), solar-cycle phase.

### Running
```sh
python scripts/sun/fetch_spaceweather.py --outdir public/data/sun
#   --kp-hours 72              hours of 3-hourly Kp series to keep
#   --cycle-context-since 1976-01   historical SSN backdrop start (YYYY-MM)
```
Stdlib `urllib` only (`requests` optional). Non-zero exit on failure. Verified
output 2026-07-18: solar wind ~323 km/s / Bz +3.4 nT, Kp 1.33 (quiet), X-ray
B6.8 (max flare C2.3), SSN 104 (NOAA) / F10.7 138 sfu (Jun 2026); Cycle 25
smoothed peak ~160.9 @ 2024-10 (declining). Files ~7 KB + ~47 KB.

## `fetch_imagery.py` — NASA SDO full-disk Sun images

Downloads six representative full-disk channels to
[`public/textures/sun/`](../../public/textures/sun/) and writes a provenance
`manifest.json`:

| File | Channel | Shows |
|---|---|---|
| `aia171.jpg` | AIA 171 Å | quiet corona / loops |
| `aia193.jpg` | AIA 193 Å | corona + coronal holes |
| `aia211.jpg` | AIA 211 Å | active-region corona |
| `aia304.jpg` | AIA 304 Å | chromosphere / prominences |
| `hmi_continuum.jpg` | HMI continuum | photosphere (sunspots) |
| `hmi_magnetogram.jpg` | HMI magnetogram | photospheric B-field |

### Source and licensing
- **Service:** `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_{RES}_{CHANNEL}.jpg`.
- **License:** NASA **public domain**. Credit "NASA/SDO and the AIA, EVE, and
  HMI science teams."
- **CORS:** SDO images send **no** `Access-Control-Allow-Origin` header
  (verified) → WebGL textures would be tainted → **committed**, not fetched live.

### Honesty note
These are full-disk **square** disk images of the Sun's Earth-facing side —
**NOT** equirectangular maps. AIA channels are **false-color by wavelength**.
The app must show them as the observed disk (or on a sphere only with an
"approximate — disk image, not a map" label), as a **snapshot**, not "live."

### Running
```sh
python scripts/sun/fetch_imagery.py --outdir public/textures/sun
#   --res 2048     higher-res SDO source (512/1024/2048/4096)
#   --max-px 1024  downsample longest side if larger
```
Needs Pillow. Each image is verified: JPEG magic bytes (`FF D8 FF`) + Pillow
decode + non-degenerate pixels. Verified output 2026-07-18: 6× 1024×1024 JPEG,
82–231 KB each (all < 1 MB), real observation timestamps recorded from
`Last-Modified`.
