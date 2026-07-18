# Sun & Space-Weather Data Sources (Phase 10)

Verification date: **2026-07-18**. All licenses, endpoints, CORS headers, download URLs and observation timestamps below were verified on this date against official pages and/or live HTTP requests (noted per item). Anything that could not be verified from an official source is explicitly flagged. Same rigor and honesty bar as `docs/DATA_SOURCES.md` (Earth), `docs/PLANETS_DATA_SOURCES.md` and the rest: real data, real physics, honest claims, everything free and legally usable for an MIT open-source app, every source + license logged.

> **Date note.** The phase brief states "Today is 2026-07-10." The live SWPC feeds and SDO images carried `2026-07-18` timestamps at fetch time (e.g. solar-wind `time_tag` `2026-07-18T21:11:00Z`, SDO `Last-Modified: Sat, 18 Jul 2026`), and the environment clock reads 2026-07-18. The honest verification date is therefore **2026-07-18** — the day these checks actually ran, matching every committed data timestamp.

> **Why this phase reconnects to the honest-forecasting theme.** Space weather is the one genuine *forecasting* domain in this project. NOAA's Space Weather Prediction Center (SWPC) issues **real operational forecasts** — geomagnetic (Kp) forecasts, the OVATION aurora nowcast, radio-blackout and solar-radiation warnings, and a predicted solar-cycle curve. This tab **visualizes SWPC's own measurements and forecasts and attributes them to SWPC**. We do **not** make our own space-weather forecasts. See `docs/SUN_PHYSICS.md` for the measured / forecast / computed contract.

## Summary table

| Source | Data used | License | Attribution required | CORS (client-fetch?) | Verified against (2026-07-18) |
|---|---|---|---|---|---|
| NASA SDO | Full-disk Sun imagery: AIA 171/193/211/304 Å, HMI continuum, HMI magnetogram | Public domain (NASA) | Credit "NASA/SDO and the AIA, EVE, HMI science teams" (requested, not a condition) | **No** — no `Access-Control-Allow-Origin` header → WebGL textures would be tainted → **commit snapshots** | `https://sdo.gsfc.nasa.gov/assets/img/latest/` live image fetch + headers |
| NOAA SWPC | Solar wind, planetary Kp, OVATION aurora, GOES X-ray/flares, solar-cycle SSN + F10.7, predicted cycle | US Gov public domain (17 U.S.C. 105) | No (courtesy credit "NOAA/SWPC") | **Yes — `Access-Control-Allow-Origin: *` on every endpoint** → app fetches LIVE client-side | `https://services.swpc.noaa.gov/` live requests with an `Origin` header |
| WDC-SILSO (Royal Obs. Belgium) | Sunspot number / solar cycle | **CC BY-NC 4.0** (NonCommercial) | Yes ("Source: WDC-SILSO, Royal Observatory of Belgium, Brussels") | n/a (static files) | `https://www.sidc.be/SILSO/datafiles` license text |
| NASA Helioviewer | (Evaluated) tiled/JPEG2000 SDO/SOHO imagery + API | NASA/mission public domain | Per-source | **No ACAO observed** on `api.helioviewer.org/v2/` in this test → not used | `https://api.helioviewer.org/v2/getDataSources/` live |

**Decision in one line:** SWPC feeds are **public domain + CORS `*`**, so the app fetches **live space weather client-side** (best case, like Open-Meteo on Earth); the committed `public/data/sun/spaceweather.json` + `solar_cycle.json` are the offline / first-paint / rate-limit fallback. SDO images have **no CORS**, so they are **committed** to `public/textures/sun/`. **SILSO is CC BY-NC → rejected** in favor of NOAA's public-domain solar-cycle JSON.

Committed artifacts: `public/textures/sun/{aia171,aia193,aia211,aia304,hmi_continuum,hmi_magnetogram}.jpg` (+ `manifest.json`); `public/data/sun/spaceweather.json`; `public/data/sun/solar_cycle.json`. Build scripts under `scripts/sun/`.

---

## 1. NASA SDO (Solar Dynamics Observatory) imagery

**Verified against:** the SDO "latest images" service `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_{RES}_{CHANNEL}.jpg` and NASA media-usage guidelines (`https://www.nasa.gov/nasa-brand-center/images-and-media/`), plus live image fetches + header inspection on 2026-07-18.

**Service / URL pattern (verified by real downloads):**
- `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_{RES}_{CHANNEL}.jpg`
  - `RES` ∈ {512, 1024, 2048, 4096} (verified 1024 for all six channels, 2048 spot-checked for AIA 171).
  - `CHANNEL` tokens verified live: `0171`, `0193`, `0211`, `0304` (AIA, in Ångström); `HMIIC` (HMI continuum / visible photosphere, sunspots); `HMIB` (HMI line-of-sight magnetogram). Other public tokens exist (`0094`, `0131`, `0335`, `1600`, `1700`, `HMID`, `HMIBC`, composites) — not shipped.
- Each response: `HTTP/1.1 200`, `Content-Type: image/jpeg`, with a `Last-Modified` header giving the real observation time.

**Images fetched and committed (1024×1024, verified real JPEGs — magic bytes `FF D8 FF` + Pillow decode + non-degenerate pixels):**

| File | Channel | What it shows | Bytes | Observation (Last-Modified, 2026-07-18) |
|---|---|---|---|---|
| `aia171.jpg` | AIA 171 Å (Fe IX, ~600,000 K) | Quiet corona / coronal loops | 160,557 | 21:12:06 GMT |
| `aia193.jpg` | AIA 193 Å (Fe XII, ~1.2 MK) | Corona + hot flare plasma; coronal holes | 123,233 | 21:13:06 GMT |
| `aia211.jpg` | AIA 211 Å (Fe XIV, ~2 MK) | Active-region corona | 116,644 | 21:05:07 GMT |
| `aia304.jpg` | AIA 304 Å (He II, ~50,000 K) | Chromosphere / transition region; prominences | 155,644 | 21:14:06 GMT |
| `hmi_continuum.jpg` | HMI continuum (`HMIIC`) | Visible photosphere — **sunspots** | 82,336 | 21:10:05 GMT |
| `hmi_magnetogram.jpg` | HMI magnetogram (`HMIB`) | Line-of-sight photospheric magnetic field | 231,313 | 21:10:19 GMT |

All six are < 1 MB. The 1024 px source is already ~80–230 KB, so **no downsampling was needed** (the script re-samples only if a larger source is chosen). Provenance recorded in `public/textures/sun/manifest.json` by `scripts/sun/fetch_imagery.py`.

**License:** NASA public domain. NASA media-usage guidelines: NASA content "generally are not subject to copyright in the United States." Restrictions carried over from the Earth doc: don't imply NASA endorsement, don't use the NASA insignia/logo. **Requested credit:** "NASA/SDO and the AIA, EVE, and HMI science teams." (Verified public-domain status on the NASA brand-center page; the SDO project is a NASA mission.)

**CORS: verified — SDO images send NO `Access-Control-Allow-Origin` header.** A GET with `Origin: https://example.vercel.app` returned only `Server: Apache` + `Content-Type: image/jpeg` (HTTP 200), no ACAO. Consequence: a cross-origin `<img>` can be *displayed*, but sampling it into a **WebGL texture taints the canvas** — so live client-side use as a sphere/disk texture is blocked. **We therefore commit the snapshots** (public-domain status permits vendoring them), exactly as Earth ships the Blue Marble base texture.

**Honesty note (critical, carried into the app):** SDO images are full-disk **square** images of the Sun's Earth-facing hemisphere — **the real solar disk, NOT an equirectangular 2:1 surface map** like the planet basemaps. AIA channels are **false-color by wavelength** (the Sun is not green/teal/gold; those are per-channel palettes). The frontend must render them as the observed disk, or map onto a sphere **only** with an explicit "approximate — disk image, not a surface map" label. They are a **snapshot** (the corona changes hour to hour), labeled as such, not "live" once committed.

---

## 2. NOAA SWPC (Space Weather Prediction Center)

**Verified against:** `https://services.swpc.noaa.gov/` (product tree) and the SWPC site, plus live requests with an `Origin: https://example.vercel.app` header to every endpoint below on 2026-07-18.

**License:** U.S. Government work, **public domain** (17 U.S.C. §105). Same posture as NOAA GFS/NWS on Earth — fully MIT-compatible, may be committed to the repo. Courtesy credit "NOAA/SWPC."

**CORS: verified `Access-Control-Allow-Origin: *` on EVERY working endpoint** (both the `products/` and `json/` trees), typically with `Access-Control-Allow-Methods: GET, ...` and `Cache-Control: max-age=60` on fast-changing products. **The frontend can and should fetch these LIVE, client-side** — this is the best case, truly live space weather, no proxy needed (the same pattern as Open-Meteo on Earth).

**Endpoints verified live (exact filenames — several differ from the guessed names, flagged):**

*MEASURED signals*
- **Solar wind (real-time, propagated to bow shock):** `products/geospace/propagated-solar-wind-1-hour.json` — header-array; columns `time_tag, speed, density, temperature, bx, by, bz, bt, vx, vy, vz, propagated_time_tag`. Also `products/geospace/propagated-solar-wind.json`. Instantaneous scalars: `products/summary/solar-wind-speed.json` (`{proton_speed, time_tag}`) and `products/summary/solar-wind-mag-field.json` (`{bt, bz_gsm, time_tag}`). **Source: DSCOVR (primary) / ACE at L1.**
  - ⚠️ **Flag:** the older names `products/solar-wind/mag-{2-hour,1-day,…}.json` and `plasma-*.json` **404** as of 2026-07-18 — use the `geospace/propagated-solar-wind*` and `summary/*` files above.
- **Planetary K-index (estimated, 3-hourly):** `products/noaa-planetary-k-index.json` — **returns a list of record dicts** (`time_tag, Kp, a_running, station_count`), not the header-array shape; the fetch script handles both. 1-minute Kp: `json/planetary_k_index_1m.json`.
  - ⚠️ **Flag:** `products/noaa-estimated-planetary-k-index-1-minute.json` **404s**; the working 1-minute file is `json/planetary_k_index_1m.json`.
- **GOES X-ray flux:** `json/goes/primary/xrays-6-hour.json` (and `xrays-1-day.json`) — records `time_tag, satellite, flux, observed_flux, energy` with two bands (`0.05-0.4nm`, `0.1-0.8nm`; flare class uses the long `0.1-0.8nm` band). **Flare events:** `json/goes/primary/xray-flares-latest.json` (`current_class, begin/max/end_class + times`). Source: GOES-primary XRS.
- **Sunspot number + F10.7 (monthly):** `json/solar-cycle/observed-solar-cycle-indices.json` — monthly records `time-tag, ssn, smoothed_ssn, observed_swpc_ssn, smoothed_swpc_ssn, f10.7, smoothed_f10.7`; **3,330 rows, 1749-01 → 2026-06**. Daily F10.7: `json/f107_cm_flux.json` (⚠️ **flag:** its latest row was `2026-06-07`, i.e. lagging ~6 weeks on the verification day — the monthly F10.7 in the solar-cycle file is fresher).

*FORECAST signals (SWPC's own model output — attributed to SWPC, not ours)*
- **Aurora (OVATION Prime nowcast):** `json/ovation_aurora_latest.json` — `{Observation Time, Forecast Time, coordinates:[[lon,lat,prob%],…], type:"MultiPoint"}`, ~**65,160** grid points. This is SWPC's **model forecast** of instantaneous aurora probability.
- **Predicted solar cycle:** `json/solar-cycle/predicted-solar-cycle.json` — monthly `predicted_ssn` + `high/low` uncertainty bands + `predicted_f10.7`; **60 rows, 2026-01 → 2030-12**. SWPC's **forecast** of the rest of Cycle 25.

**Verified real values captured in the committed snapshot (2026-07-18):**
- Solar wind: **322.8 km/s**, density **3.76 p/cm³**, **Bz +3.43 nT** (northward, quiet) @ `21:11:00Z`.
- Planetary **Kp = 1.33** @ `18:00Z` (quiet; NOAA G-scale: below G1).
- GOES X-ray **B6.8** (long-channel flux `6.82×10⁻⁷ W/m²`); today's largest flare **C2.3** @ `04:05Z`.
- Sunspot number (June 2026): **NOAA SWPC 104.5** (public domain, primary) / International 94.4.
- **F10.7 = 138.2 sfu** (June 2026 monthly).
- **Solar Cycle 25:** smoothed sunspot number peaked **~160.9 around 2024-10**; now in the **declining phase**.

---

## 3. WDC-SILSO (Royal Observatory of Belgium) — sunspot number

**Verified against:** `https://www.sidc.be/SILSO/datafiles` (and `/home`, `/dayssnplot`), 2026-07-18.

- **License:** **CC BY-NC 4.0** — the datafiles page states plainly "Licence: CC BY-NC" and links `creativecommons.org/licenses/by-nc/4.0/`. The **NonCommercial** clause is a use restriction we cannot accept for an MIT / potentially-commercial-fork project.
- **Decision: REJECTED for shipped data** — same posture as the Earth CDS/ERA5-direct rejection, the Mars MCD rejection, and the Uranus/Neptune Björn-Jónsson CC-BY-NC-ND rejection. We instead use **NOAA SWPC's public-domain solar-cycle JSON**.
- **Provenance nuance (handled honestly):** the **International Sunspot Number (ISN v2.0)** that appears as the `ssn` column inside NOAA's public-domain file is itself a **WDC-SILSO product**. To stay license-clean we ship **NOAA's own sunspot count (`observed_swpc_ssn`, public domain) as the primary series**, and carry the ISN only as a clearly-attributed reference column *taken from NOAA's public-domain redistribution* (a factual monthly number, not SILSO's dataset file). This mirrors the ERA5→Open-Meteo attribution-chain pattern on Earth. SILSO's requested credit, if the ISN is displayed: **"Source: WDC-SILSO, Royal Observatory of Belgium, Brussels."**

---

## CORS decision — which SWPC endpoints are client-fetchable

**All of them.** Verified `Access-Control-Allow-Origin: *` on 2026-07-18 for: `products/geospace/propagated-solar-wind-1-hour.json`, `products/summary/solar-wind-speed.json`, `products/summary/solar-wind-mag-field.json`, `products/noaa-planetary-k-index.json`, `json/planetary_k_index_1m.json`, `json/ovation_aurora_latest.json`, `json/goes/primary/xrays-6-hour.json`, `json/goes/primary/xrays-1-day.json`, `json/goes/primary/xray-flares-latest.json`, `json/solar-cycle/observed-solar-cycle-indices.json`, `json/solar-cycle/predicted-solar-cycle.json`, `json/solar-cycle/sunspots.json`, `json/f107_cm_flux.json`.

- **Live client-side fetch → yes** for all SWPC space-weather data. Cache by the products' own `max-age` (~60 s for fast feeds); the OVATION grid (~65k points) is fetched live only when the aurora layer is toggled.
- **Committed snapshot (fallback)** → `public/data/sun/spaceweather.json` (7.2 KB) + `solar_cycle.json` (47 KB), produced by `scripts/sun/fetch_spaceweather.py`. These are labeled `is_snapshot: true, live_fetch_recommended: true`.
- **SDO images → no CORS → commit** (see §1). This is the only Sun-tab asset that cannot be fetched live for WebGL use.

---

## Rejected / flagged items

- **WDC-SILSO sunspot data — REJECTED (CC BY-NC 4.0).** NonCommercial restriction incompatible with the project. Use NOAA SWPC public-domain solar-cycle JSON; ship NOAA's own SSN as primary, ISN as a flagged reference from NOAA's PD redistribution.
- **SDO images have no CORS header** (verified). Fine to *display* cross-origin, but WebGL texture sampling taints the canvas — so they are committed, not fetched live.
- **NASA Helioviewer not used.** `api.helioviewer.org/v2/getDataSources/` returned HTTP 200 but **no `Access-Control-Allow-Origin`** in this test, so it is no better than SDO for live WebGL and adds a dependency. SDO direct + committed snapshots cover the need. (Helioviewer image data is NASA/mission public domain; revisit if tiled zoom is wanted, verifying CORS per endpoint.)
- **SWPC endpoint-name drift:** `products/solar-wind/mag-*.json` / `plasma-*.json` and `products/noaa-estimated-planetary-k-index-1-minute.json` **404** — superseded by `products/geospace/propagated-solar-wind*`, `products/summary/*`, and `json/planetary_k_index_1m.json`. Names verified live 2026-07-18.
- **`json/f107_cm_flux.json` lags** (latest row ~6 weeks old on the verification day). Prefer the monthly F10.7 in `observed-solar-cycle-indices.json` for a current value; treat the daily file as best-effort.
- **`smoothed_ssn` is −1.0 for recent months** — the 13-month centered smoothing needs ±6 months of future data, so the last ~6 months are not yet smoothable. The Cycle-25 smoothed peak (~160.9 @ 2024-10) is a best estimate, flagged as such in the data + physics docs.
- **OVATION is a FORECAST, not a measurement** — it is SWPC's OVATION-Prime model output. Labeled and attributed to SWPC everywhere it appears; we do not present it as our own or as an observation.

---

**Verification methodology note:** CORS claims come from live requests with a synthetic `Origin: https://example.vercel.app` header, inspecting `Access-Control-Allow-Origin`. SWPC endpoint shapes were confirmed by parsing the live JSON. SDO images were downloaded, checked for JPEG magic bytes (`FF D8 FF`) + Pillow decode + non-degenerate pixels, and their `Last-Modified` observation times recorded. SILSO's CC BY-NC license text was read from `sidc.be/SILSO/datafiles`. All on 2026-07-18.

---

## Integration log (Phase 10)

Populate at integration time (per the planetary-data-ingestion rule) as the app wires these in. Frontend work (lib/, app/, components/) is out of scope for this phase.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Sun disk textures (6 channels) | NASA SDO latest images (PD) | `public/textures/sun/{aia171,aia193,aia211,aia304,hmi_continuum,hmi_magnetogram}.jpg`, built by `scripts/sun/fetch_imagery.py` | Square disk images, false-color AIA; label "disk image, not a map / snapshot". Credit NASA/SDO + AIA/EVE/HMI teams. |
| Live space weather | NOAA SWPC feeds (PD, CORS `*`) | Browser-direct fetch from `services.swpc.noaa.gov`; `public/data/sun/spaceweather.json` as fallback, built by `scripts/sun/fetch_spaceweather.py` | Solar wind, Kp, GOES X-ray, F10.7, SSN. Live client-side like Open-Meteo. |
| Aurora layer | SWPC OVATION nowcast (FORECAST, PD) | `json/ovation_aurora_latest.json`, fetched live when toggled | Attribute "SWPC OVATION forecast"; ~65k-point grid; not fetched into the committed snapshot (summary only). |
| Solar-cycle chart | SWPC observed + predicted cycle (PD) | `public/data/sun/solar_cycle.json` | Primary SSN = NOAA `observed_swpc_ssn` (PD); ISN flagged SILSO-origin; predicted curve = SWPC forecast. |
