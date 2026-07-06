# Data Sources

Verification date: **2026-07-06**. All licenses, endpoints, CORS headers, and download URLs below were verified on this date against official pages and/or live HTTP requests (noted per item). Anything that could not be verified from an official source is explicitly flagged.

## Summary table

| Source | Data used | License | Attribution required | Rate limits | Verified against (2026-07-06) |
|---|---|---|---|---|---|
| NASA GIBS | Satellite imagery tiles (true color, cloud fraction, LST/SST, precipitation, Blue Marble base) | NASA Earth science data: CC0 unless marked otherwise | Requested (acknowledgment text below), not a license condition | None published | https://nasa-gibs.github.io/gibs-api-docs/ + live tile request |
| Open-Meteo | Forecast, historical (ERA5-based), air quality APIs | Data: CC-BY 4.0; server code: AGPLv3 (irrelevant for API use) | Yes — "Weather data by Open-Meteo.com" with link (CC-BY) | Free non-commercial: 10,000/day, 5,000/hour, 600/min | https://open-meteo.com/en/terms + GitHub README + live CORS test |
| NOAA NOMADS (GFS) | Gridded global wind (u/v 10 m) via grib filter | US Gov public domain (per NWS disclaimer) | No (courtesy credit "NOAA/NWS/NCEP" recommended) | No number published; official rule: ≥10 s between fetches in scripted loops | https://nomads.ncep.noaa.gov/info.php?page=gribfilter + https://www.weather.gov/disclaimer + live downloads |
| NASA POWER | Meteorological/solar point data | NASA data: CC0 per Earthdata guidance | Citation "very strongly urged", not required | "No set rate limit"; usage monitored, 429 possible | https://power.larc.nasa.gov/docs/services/api/ + NASA Earthdata forum t=4273 |
| JPL Horizons | Planetary ephemerides (sun/moon/planet positions) | No explicit license; US Gov data, no registration | None stated | One request at a time (no simultaneous requests); best-effort | https://ssd-api.jpl.nasa.gov/ + https://ssd-api.jpl.nasa.gov/doc/horizons.html + live CORS test |
| Natural Earth | Populated places, coastlines, land polygons | Public domain | No ("Made with Natural Earth" optional) | None (static downloads) | https://www.naturalearthdata.com/about/terms-of-use/ + live CDN checks |
| Copernicus CDS / ERA5 | Historical reanalysis (consumed via Open-Meteo, not direct) | CC-BY (per CDS dataset page) | Yes — cite DOI 10.24381/cds.adbb2d47 / credit C3S | CDS direct: registration + per-dataset terms acceptance required | https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels + https://cds.climate.copernicus.eu/how-to-api |
| NASA Blue Marble / Visible Earth | Static Earth base textures | NASA imagery: generally not copyrighted | Acknowledge NASA as source; no endorsement implication; no NASA insignia | n/a (static) | https://www.nasa.gov/nasa-brand-center/images-and-media/ + redirect checks |

---

## 1. NASA GIBS (Global Imagery Browse Services)

**Verified against:** https://nasa-gibs.github.io/gibs-api-docs/ and https://nasa-gibs.github.io/gibs-api-docs/access-basics/ (docs), https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance (license), plus live HTTP requests to `gibs.earthdata.nasa.gov` on 2026-07-06.

**Endpoints (verified from Access Basics docs, and exercised live):**
- REST: `https://gibs.earthdata.nasa.gov/wmts/epsg{code}/best/{Layer}/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.{ext}`
- KVP: `https://gibs.earthdata.nasa.gov/wmts/epsg{code}/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetTile&...`
- Capabilities: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml` (also `epsg3857`)
- Projections: EPSG:4326, EPSG:3857 (Web Mercator), EPSG:3413, EPSG:3031. Both 4326 and 3857 carry the layers we need (verified by grepping both live GetCapabilities documents).

**Usage policy / client-side use:** The docs explicitly present GIBS for use in web clients, mapping libraries (OpenLayers/Leaflet/Cesium etc.), GIS apps, and scripts. NASA Worldview itself is a browser client of these tiles. Direct browser tile requests from a public web app are the intended use. No published rate limits (confirmed absent from docs; contact earthdata-support@nasa.gov for bulk use).

**CORS: verified live.** A tile request with `Origin: https://example.vercel.app` returned `Access-Control-Allow-Origin: *` (plus `Access-Control-Expose-Headers` for GIBS layer/time headers). Note: NRT tile responses carried `Cache-Control: no-store, no-cache` from the server; do your own client/CDN caching thoughtfully.

**License:** Per NASA Earthdata Data Use Guidance: "Unless the content is marked with a use restriction or license, data provided from a NASA-led mission are licensed as Creative Commons Zero (CC0)."

**Attribution (requested, include in the app's about/credits):**
> "We acknowledge the use of imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS)."

**Layer identifiers verified present in live EPSG:4326 `best` GetCapabilities (2026-07-06):**
- True color: `MODIS_Terra_CorrectedReflectance_TrueColor`, `MODIS_Aqua_CorrectedReflectance_TrueColor`, `VIIRS_SNPP_CorrectedReflectance_TrueColor`, `VIIRS_NOAA20_CorrectedReflectance_TrueColor`, `VIIRS_NOAA21_CorrectedReflectance_TrueColor`
- Cloud cover: `MODIS_Terra_Cloud_Fraction_Day` / `_Night`, `MODIS_Aqua_Cloud_Fraction_Day` / `_Night`
- Land surface temperature: `MODIS_Terra_Land_Surface_Temp_Day` / `_Night`, `VIIRS_SNPP_Land_Surface_Temp_Day` / `_Night` (plus L3 daily/8-day/monthly variants)
- Sea surface temperature: `GHRSST_L4_MUR_Sea_Surface_Temperature` (0.01° foundation SST; best-looking global SST), `GHRSST_L4_MUR25_Sea_Surface_Temperature`, `GHRSST_L4_AVHRR-OI_Sea_Surface_Temperature`
- Precipitation: `IMERG_Precipitation_Rate`, `IMERG_Precipitation_Rate_30min`
- Base/static: `BlueMarble_NextGeneration`, `BlueMarble_ShadedRelief_Bathymetry`, `Coastlines`, `Reference_Labels_15m`
- The Terra/VIIRS true color, cloud fraction, LST, GHRSST SST, and IMERG layers were all also confirmed in the EPSG:3857 capabilities.

## 2. Open-Meteo

**Verified against:** https://open-meteo.com/en/terms, https://github.com/open-meteo/open-meteo (README license sections), https://open-meteo.com/en/docs/historical-weather-api, plus live CORS tests on 2026-07-06.

- **License:** API data is **CC-BY 4.0** (confirmed on terms page and README). Server source code is AGPLv3 — this does not affect API consumers, only people redistributing/modifying the Open-Meteo server code.
- **Free tier (non-commercial):** "10'000 API calls per day, 5'000 per hour and 600 per minute" (terms page). README: "free for open-source developer and non-commercial use... If your application exceeds 10'000 requests per day, please contact us." Non-commercial = no subscriptions, no ads. An MIT-licensed, ad-free, non-commercial project by an individual squarely qualifies.
- **Attribution (required by CC-BY):** display `Weather data by Open-Meteo.com` linked to https://open-meteo.com/ wherever the data appears.
- **CORS: verified live** with an `Origin` header on all three hosts — `api.open-meteo.com` (forecast), `archive-api.open-meteo.com` (historical), `air-quality-api.open-meteo.com` — all return `access-control-allow-origin: *`. Direct browser calls work.
- **Historical/archive API:** confirmed from the official docs page to be built on **ERA5 (0.25°, from 1940), ERA5-Land (0.1°, from 1950), and ECMWF IFS (9 km, from 2017)**; the page itself cites the CDS datasets ("ERA5 hourly data on single levels from 1940 to present", Hersbach et al.).
- No API key or registration required for the free tier.

## 3. NOAA NOMADS / GFS

**Verified against:** https://nomads.ncep.noaa.gov/, https://nomads.ncep.noaa.gov/info.php?page=gribfilter, https://www.weather.gov/disclaimer, plus three live grib-filter downloads on 2026-07-06.

- **License:** NWS disclaimer (linked from NOMADS as "Terms of Data Usage"): "The information on National Weather Service (NWS) Web pages are in the public domain... and may be used without charge for any lawful purpose" (conditions: don't claim it as your own/copyright it, don't imply NOAA/NWS endorsement, don't modify content and present it as official). US Government public domain — fully MIT-compatible.
- **Grib filter URL pattern (verified by real downloads):**
  ```
  https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?dir=%2Fgfs.YYYYMMDD%2FHH%2Fatmos&file=gfs.tHHz.pgrb2.0p25.fFFF&var_UGRD=on&var_VGRD=on&lev_10_m_above_ground=on
  ```
  Variants: `filter_gfs_0p50.pl` with `file=gfs.tHHz.pgrb2full.0p50.fFFF`, and `filter_gfs_1p00.pl` with `file=gfs.tHHz.pgrb2.1p00.fFFF`. Pressure levels via e.g. `lev_850_mb=on`; subregion via `subregion=&leftlon=&rightlon=&toplat=&bottomlat=`. A newer HTML UI exists at `https://nomads.ncep.noaa.gov/gribfilter.php?ds=gfs_0p25` (both old `.pl` CGI and new UI returned 200 on 2026-07-06); the docs recommend using its "Show URL" button and note the URL "can then be edited and used in a script to automate downloading."
- **Automated downloads:** explicitly acceptable — the official grib filter help page documents scripting, with this rule: "If your script contains loops, then be sure to include a 10 second wait between fetches... Without waits between fetches, the server may mistake excessive requests as denial-of-service attack and block the user." A GitHub Action fetching once per model cycle (4×/day) is far below any realistic threshold.
- **Rate limits:** No numeric limit is published on an official page (the commonly quoted "120 hits/minute" figure could not be verified officially — flagged below). Follow the 10-second-wait rule and set a descriptive User-Agent.
- **OPeNDAP/DODS retired:** the NOMADS OPeNDAP endpoint (`nomads.ncep.noaa.gov/dods/...`) was retired per NWS Service Change Notice 25-81 (verified 2026-07-06 — returns a retirement notice). Do not use it.
- **Actual access path used by this project (verified working 2026-07-06):** NOAA Open Data Dissemination (NODD) S3 bucket `noaa-gfs-bdp-pds.s3.amazonaws.com` — anonymous HTTP, parse the `.idx` sidecar file and byte-range GET only the needed GRIB2 records (~53 KB per field instead of ~34 MB full files). Same US Gov public-domain status. NOMADS grib filter retained as fallback in `scripts/wind/fetch_wind.py`.

## 4. NASA POWER API

**Verified against:** https://power.larc.nasa.gov/docs/services/api/ and https://power.larc.nasa.gov/docs/services/api/temporal/hourly/ (endpoint format), NASA Earthdata Forum thread https://forum.earthdata.nasa.gov/viewtopic.php?t=4273 (official POWER Team answer on limits), NASA Earthdata data-use guidance (license), plus a live API call on 2026-07-06.

- **Endpoint:** `https://power.larc.nasa.gov/api/temporal/{hourly|daily|monthly|climatology}/point?parameters=...&community=...&longitude=..&latitude=..&start=YYYYMMDD&end=YYYYMMDD&format=JSON` (up to 15 parameters per request). No API key or registration.
- **Rate limits:** POWER Team's official forum answer: "there is no set rate limit. However, the NASA POWER Team monitors the usage and will limit usage to support equitable access." The API can return `429 Too Many Requests`. No numeric limit is published in the current docs.
- **License:** NASA data, CC0 per Earthdata guidance; citation "very strongly urged" but not legally required.
- **CORS: verified live** — `access-control-allow-origin: *` returned on a real request with an Origin header. Direct browser calls work.

## 5. NASA JPL Horizons API

**Verified against:** https://ssd-api.jpl.nasa.gov/doc/horizons.html (API doc v1.3, June 2025), https://ssd-api.jpl.nasa.gov/ (usage policy), plus live requests on 2026-07-06.

- **Endpoint:** `https://ssd.jpl.nasa.gov/api/horizons.api` — GET with params like `format=json&COMMAND='499'&EPHEM_TYPE=VECTORS&CENTER='500@10'&START_TIME=...&STOP_TIME=...&STEP_SIZE=...`. No key, no registration.
- **Usage policy (quoted from ssd-api.jpl.nasa.gov):** "You agree to submit only one API request at a time (no simultaneous requests)"; service is "on a best effort basis"; "API data formats can change without notice"; and critically: **"You may not embed these APIs in your website (per NASA CORS policy)."**
- **CORS: verified live** — a successful GET (HTTP 200) returned **no** `Access-Control-Allow-Origin` header. Browser calls will be blocked, and the policy forbids it anyway. **Use server-side only** (Vercel serverless/edge function, or precompute ephemerides at build time — sun/moon positions can also be computed client-side with a library like `astronomy-engine`, avoiding the API entirely at runtime). H.O.T Earth computes solar position client-side (lib/solar.ts) and uses Horizons only for offline cross-checks — compliant.
- **License:** No explicit license stated in the API docs (verified absent). It is publicly available US government (NASA/JPL/Caltech) data; no restrictions stated beyond the usage policy above.

## 6. Natural Earth

**Verified against:** https://www.naturalearthdata.com/about/terms-of-use/ plus live HEAD checks of download URLs on 2026-07-06.

- **License:** "All versions of Natural Earth raster + vector map data found on this website are in the public domain." No permission or credit required; optional credit "Made with Natural Earth." Zero friction for an MIT repo — the data can even be committed to the repo.
- **Download URLs (all verified HTTP 200 on the official NACIS CDN, which naturalearthdata.com download links point to):**
  - `https://naciscdn.org/naturalearth/10m/cultural/ne_10m_populated_places.zip` (full attributes)
  - `https://naciscdn.org/naturalearth/10m/cultural/ne_10m_populated_places_simple.zip` (652 KB; includes `POP_MAX` population — enough for a city layer)
  - `https://naciscdn.org/naturalearth/50m/cultural/ne_50m_populated_places_simple.zip` (134 KB)
  - `https://naciscdn.org/naturalearth/110m/physical/ne_110m_coastline.zip`, `ne_110m_land.zip`, and `https://naciscdn.org/naturalearth/50m/physical/ne_50m_coastline.zip`
  - Pattern: `https://naciscdn.org/naturalearth/{110m|50m|10m}/{physical|cultural}/ne_{scale}_{name}.zip`

## 7. Copernicus CDS / ERA5

**Verified against:** https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels (overview tab) and https://cds.climate.copernicus.eu/how-to-api on 2026-07-06.

- **License:** The CDS dataset page states ERA5 is provided under a **CC-BY licence**, DOI `10.24381/cds.adbb2d47`. CC-BY permits redistribution and reuse (including commercial) with attribution.
- **Direct CDS access requires:** an ECMWF/CDS account, a personal API token, and manual acceptance of the dataset's Terms of Use before any download. Queued retrievals; not suitable for interactive client-side use.
- **Is Open-Meteo a sufficient/legal proxy? Yes.** ERA5's CC-BY licence permits redistribution, and Open-Meteo lawfully redistributes ERA5/ERA5-Land through its archive API under CC-BY 4.0, citing the CDS datasets on its official docs page (verified). Using `archive-api.open-meteo.com` means **no CDS registration is needed** for this project. Attribution chain to include in the app credits: "Weather data by Open-Meteo.com" + credit to the Copernicus Climate Change Service (C3S)/ECMWF for ERA5 (cite DOI 10.24381/cds.adbb2d47). Note: the exact canonical Copernicus attribution sentence ("Contains modified Copernicus Climate Change Service information...") comes from the Copernicus licence text, which was not re-verified verbatim this session — flagged below.

## 8. NASA Blue Marble / Visible Earth

**Verified against:** https://www.nasa.gov/nasa-brand-center/images-and-media/ (media usage guidelines) and live redirect checks on 2026-07-06.

- **Important:** `visibleearth.nasa.gov` now returns **301 redirects** — the site has been folded into NASA Science / Earth Observatory. The Blue Marble collection now lives at `https://science.nasa.gov/earth/earth-observatory/collections/blue-marble/` (verified 200). Do not hardcode visibleearth.nasa.gov URLs.
- **Usage terms (NASA Media Usage Guidelines):** "NASA content – images, audio, video, and media files... generally are not subject to copyright in the United States"; usable for "educational or informational purposes, including... computer graphical simulations and Internet Web pages." Restrictions: must not imply NASA endorsement; the NASA Insignia/Logotype/seal are protected and may not be used; acknowledge NASA as the source. All compatible with an MIT open-source app (credit "NASA Earth Observatory / Blue Marble" and don't use the NASA logo).
- **Practical alternative (recommended):** GIBS serves Blue Marble as WMTS layers — `BlueMarble_NextGeneration` and `BlueMarble_ShadedRelief_Bathymetry` (verified in EPSG:4326 capabilities) — so the globe base layer can come from the same tile service as everything else. For a single static texture file, download once from the Earth Observatory collection page and ship it in the repo/public folder (public domain status permits this).

---

## Technical answers

### 1. Best free source of gridded global wind, and what resolution stays under ~500 KB/timestep

**GFS via NOMADS is the right choice.** Open-Meteo is a point/location API (no full-grid global export), and CDS/ERA5 is registration-gated with queued retrievals. GFS is public domain, updated 4×/day.

**Empirically measured on 2026-07-06** (real downloads of `UGRD`+`VGRD` at `10_m_above_ground`, analysis hour f000, GRIB2):

| Resolution | Grid points | Measured size |
|---|---|---|
| 0.25° | 1440×721 | 1,155,764 bytes (~1.13 MB) — over budget |
| **0.5°** | 720×361 | **362,483 bytes (~354 KB)** — fits |
| 1.0° | 360×181 | 105,334 bytes (~103 KB) — comfortable |

**Recommendation:** GitHub Action every 6 h (cron at ~+4h after each cycle: GFS data lags the nominal cycle time), fetch 1.0° (or 0.5° if budget allows), convert to compact JSON, commit as a static asset served from Vercel's CDN. This sidesteps NOMADS CORS entirely (the browser never touches NOMADS), respects the official 10-second-wait scripting rule, and costs 4 requests/day.

### 2. Does GIBS serve tiles with CORS headers usable from a Vercel-hosted app?

**Yes — verified live on 2026-07-06.** A WMTS tile request with `Origin: https://example.vercel.app` returned `Access-Control-Allow-Origin: *`. Tiles are served via CloudFront and can be requested directly from browser JS with `crossOrigin` set, from any origin, with no key.

### 3. Anything problematic for an MIT-licensed open-source repo?

No blockers, four things to handle:

1. **Open-Meteo (CC-BY 4.0 + non-commercial free tier):** The data license (CC-BY) is separate from the MIT code license — that's fine, but the app UI must display "Weather data by Open-Meteo.com" (linked). The free tier is *non-commercial*; this project qualifies, but forks used commercially (ads/subscriptions) need an Open-Meteo paid plan — noted in README.
2. **JPL Horizons:** may not be called from the browser ("You may not embed these APIs in your website (per NASA CORS policy)", and no CORS header is sent — both verified). Compute sun/moon/planet positions client-side and skip the API at runtime; use Horizons only for offline validation.
3. **ERA5 attribution chain:** when showing Open-Meteo historical data, also credit Copernicus/ECMWF (CC-BY upstream).
4. **NASA branding:** NASA imagery is fine to use; the NASA insignia/logo/seal is not. Credit NASA in text only.

Everything else — GIBS (CC0), GFS/NOMADS (public domain), NASA POWER (CC0), Natural Earth (public domain, can be vendored into the repo) — is maximally permissive.

---

## Rejected / flagged items

- **`visibleearth.nasa.gov` URLs are deprecated** (301 to science.nasa.gov, verified 2026-07-06). Use `https://science.nasa.gov/earth/earth-observatory/collections/blue-marble/` or the GIBS `BlueMarble_NextGeneration` WMTS layer instead.
- **NOMADS numeric rate limit unverified:** the widely-cited "120 hits/minute → IP block" figure does not appear on any official NOMADS page. The only official guidance is the 10-second-wait rule on the grib filter help page. Treat the 10 s rule as the contract.
- **NASA POWER publishes no numeric rate limit** — only "no set rate limit... monitored for equitable access" (official forum answer) and the possibility of HTTP 429. Not a problem at this project's volume.
- **GIBS publishes no rate limits at all** (confirmed absent from docs); heavy bulk use should be coordinated via earthdata-support@nasa.gov. Also note GIBS NRT tiles returned `Cache-Control: no-store` — rely on our own caching strategy deliberately (the app proxies + caches snapshots).
- **Exact Copernicus attribution sentence unverified this session:** the CDS dataset page confirms "CC-BY licence" and the DOI, but the verbatim wording of the "Licence to use Copernicus Products" attribution clause was not re-verified (dynamically generated URL). Before shipping the credits page, pull the exact sentence from the licence linked on the ERA5 dataset page's download tab. Non-blocking: crediting "Copernicus Climate Change Service (C3S) / ECMWF, ERA5, DOI 10.24381/cds.adbb2d47" satisfies CC-BY in the interim.
- **Direct CDS/ERA5 access: rejected for this project** — requires ECMWF account, API token, and manual per-dataset terms acceptance, with queued (non-interactive) retrievals. Open-Meteo's archive API is a legal and practical substitute (see section 7).
- **JPL Horizons for client-side use: rejected** — policy and missing CORS headers both forbid it (verified). Server-side proxy or client-side ephemeris computation only.

---

**Verification methodology note:** CORS claims come from live requests with a synthetic `Origin: https://example.vercel.app` header; GIBS layer names were grepped from the live EPSG:4326 and EPSG:3857 GetCapabilities XML; GFS file sizes are from real grib-filter downloads (2026-07-05 00z cycle, f000); download URLs were HEAD-checked. All on 2026-07-06.

---

## Phase 1 integration log (2026-07-06)

What the shipped app actually uses, added at integration time per the
planetary-data-ingestion rule. All layer IDs below were re-verified against
the live GIBS WMS `epsg4326/best` GetCapabilities on 2026-07-06, including
test GetMap renders.

| In-app layer | Exact identifier | Fetch path | Notes |
|---|---|---|---|
| Live satellite (true color) | `VIIRS_SNPP_CorrectedReflectance_TrueColor` | `/api/gibs/true-color` -> WMS snapshot 4096x2048 JPEG | Daily, ~1 day lag; time extent verified through 2026-07-06 |
| Surface temp (day) | `VIIRS_NOAA20_Land_Surface_Temp_Day` | `/api/gibs/surface-temp` -> WMS snapshot 2048x1024 PNG | Chosen over `MODIS_Terra_Land_Surface_Temp_Day` (denser coverage in test render) |
| Precipitation | `IMERG_Precipitation_Rate` | `/api/gibs/precipitation` -> WMS snapshot 2048x1024 PNG | Lags ~2 days (extent ended 2026-07-04 on verification day); proxy walks back up to 3 days |
| Base day texture | `BlueMarble_ShadedRelief_Bathymetry` | Downloaded once to `public/textures/earth-day-blue-marble.jpg` (4096x2048) | Blue Marble Next Generation w/ shaded relief + bathymetry |
| Night lights | `VIIRS_Black_Marble` (TIME=2016-01-01) | Downloaded once to `public/textures/earth-night-black-marble.jpg` (4096x2048) | 2016 composite — labeled "not live" in the About panel |
| Point forecast | Open-Meteo `/v1/forecast` (current + 7-day daily) | Browser-direct fetch on globe click | UI label: "Forecast: Open-Meteo (CC-BY 4.0)" |
| Terminator / subsolar point | NOAA solar position algorithm (Spencer series) | `lib/solar.ts`, computed client-side | Unit tests assert solstice/equinox declination + solar-noon longitude |
| Wind particles | NOAA/NCEP GFS 1.0° 10 m u/v analysis (public domain) | `public/data/wind/current.json`, produced by `scripts/wind/fetch_wind.py` (GH Actions, 4x/day), fetched once when the layer is toggled | Bilinear sampling unit-tested (`lib/wind.test.ts`, incl. antimeridian wrap); HUD shows the GFS cycle; footer credit "Wind: NOAA GFS" while active. Animation speed exaggerated ~55,000x (disclosed in About) |
| Living Earth cities | Natural Earth 1:10m Populated Places Simple (public domain) | `public/data/cities.json` (~53 KB, 1,200 largest by POP_MAX) built offline by `tools/build_cities.py`, committed to the repo | Source + license in the JSON meta block. Night glow driven by the real terminator; per-city "activity" is a SIMULATION from local solar time + day of week (`lib/activity.ts`, unit-tested), labeled as such in the UI |
| City weather + world-temp sample | Open-Meteo `/v1/forecast` | Browser-direct: per-city fetch on click; one batched 10-city request per session for the warmest/coldest stat | Same CC-BY 4.0 labeling as point forecasts |

### Evaluated and dropped (render quality, not availability)

| Candidate | Why dropped |
|---|---|
| `MODIS_Terra_Cloud_Fraction_Day` | Near-opaque red/purple statistical palette covers the whole globe — hides the planet rather than showing clouds. |
| `AIRS_L2_Total_Cloud_Fraction_Day` | Large missing orbit swaths read as broken imagery on a sphere. |

Cloud imagery is instead served honestly by the VIIRS true-color layer,
where actual clouds are visible.

### Static texture provenance (exact download URLs, fetched 2026-07-06)

```
https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=BlueMarble_ShadedRelief_Bathymetry&SRS=EPSG:4326&BBOX=-180,-90,180,90&WIDTH=4096&HEIGHT=2048&FORMAT=image/jpeg&STYLES=
https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=VIIRS_Black_Marble&TIME=2016-01-01&SRS=EPSG:4326&BBOX=-180,-90,180,90&WIDTH=4096&HEIGHT=2048&FORMAT=image/jpeg&STYLES=
```
