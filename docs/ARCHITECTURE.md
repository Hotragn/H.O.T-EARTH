# Architecture

H.O.T Earth is built around one constraint, decided on day one: **Vercel hosts only the frontend and thin caching proxies. All heavy computation happens elsewhere, ahead of time.**

```
                ┌────────────────────────────────────────────────┐
                │                   BROWSER                      │
                │  three.js globe · solar geometry · particle    │
                │  sim · model inference (all trivial math)      │
                └───────┬───────────────┬────────────────┬───────┘
                        │               │                │
             static JSON│      /api/gibs│proxy           │direct fetch
                        │               │                │(CORS, keyless)
┌───────────────┐   ┌───▼───────────────▼───┐    ┌───────▼────────┐
│ GitHub Actions│   │        VERCEL          │    │  Open-Meteo    │
│  cron (6h)    ├──►│  Next.js app + cached  │    │  forecast API  │
│ GFS wind →JSON│   │  GIBS snapshot proxy   │    └────────────────┘
└───────┬───────┘   └───────────▲────────────┘
        │                       │ WMS snapshots
┌───────▼────────┐    ┌─────────┴──────────┐
│ NOAA NODD S3   │    │     NASA GIBS      │
│ (GFS GRIB2)    │    │ (satellite imagery)│
└────────────────┘    └────────────────────┘
```

## Why not compute on Vercel?

Serverless functions on the hobby tier have short execution windows, limited memory, and a Node-first runtime. Weather-grade computation (GRIB decoding, model training over millions of rows) does not belong there, and forcing it would make the app fragile and unforkable. Instead:

| Workload | Where it runs | Output |
|---|---|---|
| GFS wind processing (GRIB2 → JSON) | GitHub Actions cron, every 6h ([wind-data.yml](../.github/workflows/wind-data.yml)) | `public/data/wind/current.json` (~550KB raw, ~142KB gzipped) |
| Forecast model training + validation | Offline Python ([model/](../model/)), reproducible | coefficients + accuracy JSON + [model card](../model/output/MODEL_CARD.md) |
| Model inference, solar position, particle advection, activity sim | Browser | live UI at 60fps |
| Satellite imagery | NASA GIBS serves it; we proxy + cache snapshots for a day | `/api/gibs/[layer]` |
| Point forecasts | Open-Meteo, fetched directly from the browser (CORS, keyless) | forecast panel |

Consequences we accept: wind data is analysis-time (updated 4×/day), not streaming; imagery is daily, not live; our "forecast model" is an honest offline-validated baseline, not an on-demand numerical model. Each of those is stated in the UI where the data appears.

## Key implementation decisions

- **GIBS as full-globe WMS snapshots, not tile pyramids.** One 4096×2048 equirectangular image per layer per day maps directly onto the sphere's UVs. A WMTS tile-LOD system would only pay off at street-level zoom, which a whole-planet view never reaches. The proxy route adds `s-maxage=86400` because GIBS itself sends `no-store`.
- **Real solar geometry, no ephemeris API.** `lib/solar.ts` implements the NOAA solar position algorithm (declination, equation of time → subsolar point), unit-tested against solstice/equinox values. JPL Horizons is not called at runtime — its policy forbids browser embedding (verified; see [DATA_SOURCES.md](DATA_SOURCES.md)).
- **Pure-Python GRIB2 decoder** in `scripts/wind/fetch_wind.py` (complex packing, templates 5.0/5.2/5.3) — zero binary dependencies, so the same script runs on a contributor's Windows laptop and ubuntu CI. It byte-range-reads only the two wind records (~53KB each) from NOAA's open S3 bucket instead of downloading 34MB GRIB files.
- **No API keys anywhere.** Every data source is keyless (GIBS, Open-Meteo, NOAA S3, Natural Earth). Fork it, `npm install`, `npm run dev` — it works. This is a deliberate property; a new data source that needs a key must come with a keyless fallback.
- **Zero-config deploy.** Next.js at repo root, no environment variables, no build flags. The GitHub Action commits fresh wind data, which triggers a Vercel redeploy — data refresh and deploy are the same mechanism.

## If we ever need live server compute

The answer is a separate lightweight service (Fly.io / Railway / HF Spaces) behind a small API contract — not stretching Vercel functions. Documented here first, per the project's `vercel-compute-architecture` skill.
