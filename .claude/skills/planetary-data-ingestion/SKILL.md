---
name: planetary-data-ingestion
description: How to ingest free, legally-usable planetary/climate data (NASA GIBS, Open-Meteo, NOAA GFS, JPL Horizons, Natural Earth, PDS) for the H.O.T digital twin project. Endpoints, licensing rules, attribution workflow.
---

# Planetary & Climate Data Ingestion

Applies to all phases (Earth, Mars, Moon). The non-negotiable rule: **every dataset gets logged in `docs/DATA_SOURCES.md` (source, license, how used, verification date) at integration time, not retroactively.** If terms are unclear or restrictive, do not use the source — find an alternative or flag to the owner.

## Earth sources (verified working set)

| Source | Use | Access pattern |
|---|---|---|
| NASA GIBS | Satellite imagery layers (true color, clouds, LST, precipitation) | WMTS/WMS, no key. For full-globe sphere textures use WMS EPSG:4326 snapshot requests; for zoom detail use WMTS tile pyramid. `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&LAYERS={layer}&TIME={YYYY-MM-DD}&...` |
| Open-Meteo | Point forecasts (client-side), historical ERA5 archive (model training/validation) | REST, no key, CORS-enabled. Forecast: `api.open-meteo.com/v1/forecast`. Archive: `archive-api.open-meteo.com/v1/archive`. Free tier is non-commercial, ~10k req/day |
| NOAA NOMADS | GFS gridded wind (u/v 10m) for global wind field | grib filter endpoint to subset variables/levels server-side, keeps downloads small. US Gov public domain. Scheduled pulls: max every 6h (GFS cycle cadence), be gentle |
| JPL Horizons | Ephemerides (sun position cross-check, Mars/Moon phases later) | `ssd.jpl.nasa.gov/api/horizons.api`, no key. **NEVER call from the browser** — policy forbids embedding + no CORS headers (verified 2026-07-06). Offline/server-side only, one request at a time |
| Natural Earth | City/populated-places data, coastlines | Public domain, bulk download once, commit derived compact JSON to repo |
| NASA Blue Marble / Visible Earth | Static base textures | NASA imagery generally free with attribution; verify per-image page |

## Verified facts (2026-07-06, see docs/DATA_SOURCES.md for full detail)
- GIBS: CC0, CORS `*` verified live, no published rate limits, but NRT tiles ship `Cache-Control: no-store` — cache on our side. Verified layer IDs: `VIIRS_SNPP_CorrectedReflectance_TrueColor`, `MODIS_Terra_Cloud_Fraction_Day`, `MODIS_Terra_Land_Surface_Temp_Day`, `GHRSST_L4_MUR_Sea_Surface_Temperature`, `IMERG_Precipitation_Rate`, `BlueMarble_NextGeneration`, `Coastlines`, `Reference_Labels_15m`.
- Open-Meteo: CC-BY 4.0, free tier 10k/day, 5k/hr, 600/min, non-commercial; CORS `*` on forecast, archive, and air-quality hosts. UI attribution "Weather data by Open-Meteo.com" is mandatory.
- NOMADS: public domain; official rule = ≥10s between scripted fetches. Measured GRIB2 sizes for global 10m u+v: 0.25°≈1.13MB, 0.5°≈354KB, 1.0°≈103KB.
- **NOMADS OPeNDAP is RETIRED** (NWS SCN 25-81, verified 2026-07-06). Preferred GFS access: NODD S3 bucket `noaa-gfs-bdp-pds.s3.amazonaws.com`, parse `.idx` sidecar + byte-range GET individual GRIB2 records (~53KB/field). `scripts/wind/fetch_wind.py` has a pure-Python/numpy GRIB2 decoder (complex packing templates 5.0/5.2/5.3) — reuse it, don't reach for cfgrib/eccodes.
- Wind JSON convention (documented in scripts/wind/README.md): lo1=0 GFS-native, row-major north→south, `lat = 90 − floor(k/360)`, `lon = k % 360`; consumers wrap at the antimeridian.
- ERA5 via Open-Meteo archive is a legal CC-BY redistribution — no CDS registration needed; credit C3S/ECMWF (DOI 10.24381/cds.adbb2d47) alongside Open-Meteo.
- `visibleearth.nasa.gov` is deprecated (301) — Blue Marble now at science.nasa.gov Earth Observatory collections, or use the GIBS `BlueMarble_NextGeneration` layer.

## Rules
- Prefer client-direct fetch for CORS-enabled free APIs (Open-Meteo). Proxy through Next.js API routes only to add caching or hide complexity, never to launder terms.
- Bulk/gridded data (GRIB) never touches Vercel: processed by GitHub Actions cron or locally, committed as compact JSON/binary to the repo. See [vercel-compute-architecture].
- Keep per-timestep derived files under ~500KB. Downsample (1° grid for wind) before committing.
- Attribution appears in three places: `docs/DATA_SOURCES.md`, the app footer/about panel, and the README.
- Rate-limit hygiene: cache aggressively (GIBS imagery is daily — cache by date key), batch archive pulls, exponential backoff on 429/5xx.

## Mars/Moon (phase 2/3 pointers, expand when started)
- Mars weather: NASA InSight/MSL REMS archives (PDS), Mars Climate Database (check license — historically research-use), MRO/MARCI global maps for dust storms.
- Moon: LRO Diviner (surface temperature), LOLA (terrain) via PDS Geosciences Node; all NASA/PDS data is public domain-ish but verify per-dataset.
