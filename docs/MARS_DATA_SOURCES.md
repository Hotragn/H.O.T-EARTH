# Mars Data Sources (Phase 2)

Verification date: **2026-07-06**. All licenses, endpoints, and download URLs below were verified on this date against official pages (NASA PDS Atmospheres Node, USGS Astrogeology, NASA GISS) and/or live HTTP requests (noted per item). Anything that could not be verified from an official source is explicitly flagged. Same rigor and honesty bar as `DATA_SOURCES.md` (Earth): real data, real physics, honest claims, everything free and legally usable for an MIT open-source app.

## Summary table

| Source | Data used | License | Attribution required | Access / limits | Verified against (2026-07-06) |
|---|---|---|---|---|---|
| USGS Astrogeology — Viking MDIM2.1 colorized mosaic | Global basemap texture (equirectangular) | Public domain (USGS "Access Constraints: Public domain / Use Constraints: None") | Courtesy credit USGS/NASA-Ames | Static download, no key | astrogeology.usgs.gov map page + planetarymaps.usgs.gov file URL |
| USGS Astrogeology — MGS MOLA color shaded relief 463m | Global elevation/relief texture (equirectangular) | Public domain (same USGS terms) | Courtesy credit USGS/MOLA team | Static download, no key | astrogeology.usgs.gov map page + planetarymaps.usgs.gov file URL |
| NASA PDS — Viking Lander daily-avg pressure (`VL1/VL2-M-MET-4-DAILY-AVG-PRESSURE-V1.0`) | Seasonal CO2 surface-pressure cycle (flagship signal) | Public domain (NASA/US Gov data) | None required (cite PDS + Hess 1980) | Static ASCII, no key | atmos.nmsu.edu PDS file + label, live download |
| NASA PDS — MSL Curiosity REMS RDR (`mslrem_1001`) | Surface pressure + air/ground temperature by sol | Public domain (NASA/US Gov data) | None required (cite PDS + REMS team) | Static ASCII by sol, no key | atmos.nmsu.edu PDS volume index, live |
| NASA PDS — InSight APSS PS + TWINS (PDS4 bundles) | Surface pressure, air temp, wind (2018-2022) | Public domain (NASA/US Gov data) | None required (cite PDS + APSS team) | Static ASCII bundles, no key | atmos.nmsu.edu PDS4 bundle URLs, live page |
| Montabone et al. dust optical depth climatology (LMD) | Column dust optical depth (tau) by Ls / Mars Year | **CC-BY-SA 3.0 Unported** | **Yes** — cite Montabone 2015 + 2020, ShareAlike | NetCDF downloads, no key | www-mars.lmd.jussieu.fr dust_climatology page |
| NASA GISS Mars24 algorithm (Allison & McEwen 2000) | Ls, Mars sol, LMST/LTST, subsolar point (implement in code) | No explicit license on algorithm; published open science, freely implementable | Cite Allison & McEwen 2000 | n/a (we implement it ourselves) | giss.nasa.gov/tools/mars24 algorithm + notes pages |
| NASA NSSDC / SEDS Mars Fact Sheet | Mars orbital + physical constants | Public domain (NASA data) | None | Static | spider.seds.org mirror (NASA host 307-redirects) |
| **Mars Climate Database (MCD)** | (would provide gridded modeled atmosphere) | **Non-commercial only + registration; REJECTED** | n/a | Registration form | www-mars.lmd.jussieu.fr/mars/access + LMD MCD page |

---

## 1. Terrain / basemap textures — USGS Astrogeology (public domain)

**Verified against:** the USGS Astrogeology (Astropedia) map pages and the file URLs they point to on `planetarymaps.usgs.gov`, on 2026-07-06.

USGS Astrogeology states for both mosaics: **"Access Constraints: Public domain"** and **"Use Constraints: None."** These are the canonical, mission-derived global mosaics used across the planetary-science community. No key, no registration, freely redistributable — the equivalent of Natural Earth / Blue Marble for Earth.

### 1a. Viking colorized global mosaic (recommended "true-ish color" base)
- **Map page:** https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m
- **Download URL (verified on page):** `https://planetarymaps.usgs.gov/mosaic/Mars_Viking_MDIM21_ClrMosaic_global_232m.tif`
- **Resolution:** 231.54 m/pixel (256 px/degree) → full raster is 92160 × 46080.
- **Projection:** Simple Cylindrical (equirectangular), planetocentric latitude, 0-360 lon. Directly usable as a sphere texture.
- **File size:** ~12 GB (full res). **Do not ship full res** — downsample to a 4096×2048 (or 8192×4096) JPEG for the globe, exactly as Phase 1 did with Blue Marble. Ship the derived texture in `public/textures/`; keep provenance in this doc.
- Basis: Viking Orbiter MDIM 2.1, USGS Astrogeology + NASA Ames.

### 1b. MGS MOLA colorized shaded relief (recommended elevation/relief base)
- **Map page:** https://astrogeology.usgs.gov/search/map/mars_mgs_mola_global_color_shaded_relief_463m
- **Download URL (verified on page):** `https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_ClrShade_merge_global_463m.tif`
- **Resolution:** 463 m/pixel.
- **Projection:** Simple Cylindrical (equirectangular).
- **File size:** ~1 GB. Downsample to 4096×2048 for shipping.
- Basis: Mars Global Surveyor MOLA, >600M laser altimetry measurements 1999-2001 (Smith et al. 2001). Color = elevation, shading = relief. This is the classic "Mars topography" look (blue lowlands / red-white highlands) and is honest elevation data.

### 1c. MOLA shaded relief / DEM (grayscale + raw elevation, optional)
- **Grayscale shaded relief / DEM v2 map page:** https://astrogeology.usgs.gov/search/map/Mars/GlobalSurveyor/MOLA/Mars_MGS_MOLA_DEM_mosaic_global_463m — the 463 m DEM (raw elevation in meters) is useful if we ever want to drive real vertical displacement / bump mapping on the globe rather than a baked relief image. Same public-domain USGS terms.

**Recommendation for the globe:** use **1b (MOLA color shaded relief)** as the default day texture (it is the most information-dense honest surface) or **1a (Viking colorized)** for a more "photographic" look; optionally offer both as a toggle. Both are equirectangular and drop straight into the same texture pipeline as Earth's Blue Marble. There is no separate live-imagery tile service for Mars equivalent to GIBS that we need for a base layer — these static mosaics are the standard.

---

## 2. Real Mars weather data (in-situ, NASA PDS — public domain)

All three landed-mission datasets below are archived at the **NASA Planetary Data System (PDS) Atmospheres Node** (hosted at NMSU, `atmos.nmsu.edu`). PDS data are NASA / US-Government works: public domain. No key, no registration. Cite the PDS dataset ID and the mission/instrument team as courtesy.

### 2a. Viking Landers 1 & 2 — seasonal CO2 pressure cycle (FLAGSHIP, used this phase)
- **Dataset ID:** `VL1/VL2-M-MET-4-DAILY-AVG-PRESSURE-V1.0`
- **Landing page:** https://atmos.nmsu.edu/data_and_services/atmospheres_data/MARS/viking/sol_avg_sur_press_data.html
- **Data file (verified live download, 2026-07-06):** `https://atmos.nmsu.edu/PDS/data/vl_1001/data/vl_avep.dat` (293,433 bytes, fixed-width ASCII, 3297 rows)
- **Label:** `https://atmos.nmsu.edu/PDS/data/vl_1001/data/vl_avep.lbl` (PDS3 detached label; columns documented there)
- **Instrument:** Viking Meteorology Instrument System (VMIS), 1976-1982.
- **Columns used:** `SOL_LON` (areocentric Ls, deg), `MARTIAN_DAY` (sol), `PRESS_MEAN` (daily mean surface pressure, mbar; no-value flag -9.999), plus `PRESS_MIN`.
- **Coverage:** VL1 sols 0-2245 (Chryse Planitia, 22.3°N), VL2 sols 0-1204 (Utopia Planitia, 47.7°N). We parsed 2605 valid daily means.
- **What it shows (the honest flagship signal):** the seasonal surface-pressure cycle driven by CO2 freezing onto / sublimating off the winter polar cap. Measured amplitude, computed directly from this file (see `scripts/mars/build_pressure_climatology.py` output committed to `public/data/mars/seasonal_pressure.json`):
  - **VL1:** annual mean 7.80 mbar; minimum **6.77 mbar at Ls ≈ 148°** (deep southern-winter minimum), maximum **9.06 mbar at Ls ≈ 253°** (near perihelion / southern summer) → **29.3% swing.**
  - **VL2:** annual mean 8.69 mbar; minimum 7.36 mbar at Ls ≈ 155°, maximum 10.20 mbar at Ls ≈ 285° → **32.7% swing.**
  - This matches the textbook "~25-30% annual pressure swing" and is *measured*, not modeled. It is the single most defensible "Mars weather" thing we can show.
- **Primary reference:** Hess, S. L., et al. (1980), *The annual cycle of pressure on Mars measured by Viking Landers 1 and 2*, Geophys. Res. Lett., 7(3), 197-200, doi:10.1029/GL007i003p00197. (Also Tillman 1993, doi:10.1029/93JE01084.)

### 2b. Curiosity REMS — surface pressure + air/ground temperature by sol
- **PDS RDR volume (reduced, in physical units):** `https://atmos.nmsu.edu/PDS/data/mslrem_1001/` (subdirs `DATA/`, `DATA_UV_CORRECTED/`, `LABEL/`, `INDEX/`, `CATALOG/`, `DOCUMENT/`; read `AAREADME.TXT`). Raw EDR: `mslrem_0001`.
- **Instrument:** Rover Environmental Monitoring Station (REMS): pressure, air temperature, ground temperature, wind, relative humidity, UV. Product levels EDR → RDR → ENVRDR → MODRDR (highest, with correction factors).
- **Coverage (verified):** Sol 1 (2012-08-07, Ls 151.0, MY 31) through Sol 04488 (2025-03-22, Ls 60.1, MY 38) and ongoing. 1 Hz cadence, 5-minute samples each hour plus extra hourly samples.
- **Format:** ASCII `.TAB` tables + `.LBL` labels, organized by sol.
- **Use:** rover-site diurnal temperature and pressure at Gale crater. Useful for the "large diurnal swing" story (see `MARS_PHYSICS.md`). Not yet ingested this phase (Viking pressure is the priority flagship); documented here so a consumer can fetch it.

### 2c. InSight APSS (PS + TWINS) — pressure, temperature, wind 2018-2022
- **Landing page:** https://atmos.nmsu.edu/data_and_services/atmospheres_data/INSIGHT/insight.html
- **PDS4 bundles (verified on page):**
  - Pressure Sensor: `https://atmos.nmsu.edu/PDS/data/PDS4/InSight/ps_bundle/`
  - TWINS (temp + wind): `https://atmos.nmsu.edu/PDS/data/PDS4/InSight/twins_bundle/`
  - Reviewed weather events: `https://atmos.nmsu.edu/PDS/data/PDS4/InSight/erp_bundle/`
- **Coverage:** Sol 1 (2018-11-30) to Sol 1188 (2022-03-29), Elysium Planitia (4.5°N). Note a data gap starting Jan 2021 (dust on solar panels; mission ended Dec 2022).
- **Format:** ASCII `.TAB`/`.CSV` (PDS4), raw/calibrated/derived levels, by sol.
- **Use:** highest-cadence modern surface-pressure record (great for daily pressure tides / diurnal cycle). Documented for a future ingest.

### 2d. Dust — column dust optical depth (tau) climatology by Ls / Mars Year (Montabone et al.)
- **Page:** https://www-mars.lmd.jussieu.fr/mars/dust_climatology/ (LMD, Montabone et al.)
- **License (verified verbatim on page):** **Creative Commons Attribution-ShareAlike 3.0 Unported** — *"you are free to copy, redistribute, and modify the material for scientific as well as commercial purposes, as long as you give appropriate credit, indicate if changes were made, and distribute your contributions with the same license."* **Freely redistributable** (with attribution + ShareAlike). This is the key licensing win for dust.
- **Data:** column dust optical depth (CDOD) at 9.3 µm, normalized to 610 Pa. NetCDF.
  - Irregularly gridded daily maps (observation-only, incomplete coverage): **MY 24-36**, 6°×3-5°. Files `dataset_v2/griddedcdod_MY{24..36}_v2-*.nc`, archive `dataset_v2/griddedcdod_v2.tar.gz`. Sub-daily (6-hourly) maps for MY 34-36.
  - Kriged daily "dust scenario" maps (complete coverage): **MY 24-36**, 3°×3°, one map/sol. Files `dataset_v2/dustscenario_MY{24..36}_v2-*.nc`, archive `dataset_v2/krigedcdod_v2.tar.gz`.
- **Instruments behind it:** TES (MGS), THEMIS (Mars Odyssey), MCS (MRO) retrievals gridded/kriged.
- **Required citation (verbatim from page):**
  - Montabone, L., et al. (2015), *Eight-year Climatology of Dust Optical Depth on Mars*, Icarus 251, 65-95.
  - Montabone, L., et al. (2020), *Martian Year 34 Column Dust Climatology from Mars Climate Sounder Observations*, JGR-Planets, doi:10.1029/2019JE006111.
- **Disclaimer on page:** *"we provide no warranties regarding the reliability, validity or accuracy of the data..."*
- **Seasonal pattern (from Montabone 2015):** dusty season is **Ls 180-360** (northern autumn/winter = southern spring/summer), clear season Ls 0-180; global/planet-encircling dust-storm years are the extreme deviations. See `MARS_PHYSICS.md` for how we use this as *climatology*, not prediction.
- **Storm imagery cross-reference (MARCI):** MRO/MARCI daily global weather maps and the CTX/MARCI storm records are the observational backing for "storm season." MARCI weather reports are published via Malin Space Science Systems / the PDS Imaging Node; not needed as a data feed for our climatology layer, but the citation for "we can see storms happen" if we ever add imagery.
- **Redistribution note:** because it is CC-BY-**SA**, any derived dust artifact we commit must carry the same CC-BY-SA 3.0 license in its metadata (distinct from the repo's MIT code license — same pattern as Open-Meteo's CC-BY for Earth). A small derived tau-by-Ls table is fine to vendor into the repo under that license with attribution. **Not ingested this phase** (see "produced artifact" below for why pressure came first); flagged for the coordinator as the next honest layer.

---

## 3. Mars Climate Database (MCD) — REJECTED (mirrors the CDS rejection for Earth)

**Verified against:** https://www-mars.lmd.jussieu.fr/mars/access.html and the LMD MCD page https://www.lmd.ipsl.fr/en/bases-de-donnees/mcd-en/ on 2026-07-06.

- **License:** *"The database may not be put to any commercial use without specific authorization"*, and it is *"freely available upon request via an online form"* — i.e. **registration/request-gated and non-commercial-restricted**, with no clear grant to redistribute the underlying database.
- **Decision: REJECT for this project** for the same reason we rejected direct Copernicus CDS for Earth: registration wall + a use restriction incompatible with a freely-forkable, potentially-commercial-fork MIT app, and no clean redistribution grant. It is an excellent scientific resource (MCD 6.1) but not something we can vendor or hard-depend on.
- **Honest substitute:** the *inputs* to MCD's dust scenarios — the Montabone dust climatology — are separately published under **CC-BY-SA 3.0** (section 2d) and are the redistributable path for dust. For modeled global fields we do not need MCD: we show measured in-situ signals (Viking/REMS/InSight) and published climatology, and we compute orbital geometry ourselves (section 4).

---

## 4. Orbital / ephemeris — NASA GISS Mars24 (Allison & McEwen 2000)

**Verified against:** https://www.giss.nasa.gov/tools/mars24/help/algorithm.html, https://www.giss.nasa.gov/tools/mars24/help/notes.html, https://www.giss.nasa.gov/tools/mars24/help/credits.html on 2026-07-06.

- **What it gives us:** a fully-specified analytic recipe for Mars **areocentric solar longitude Ls**, **Mars Coordinated Time (MTC) and mean/true solar time**, **sol count**, and the **subsolar longitude/latitude** — everything we need to drive a Mars terminator, seasons, and a "what season is it on Mars right now" clock, computed client-side with no API (exactly as Earth's `lib/solar.ts` does with the NOAA/Spencer series). Basis: Allison, M., and M. McEwen (2000), *A post-Pathfinder evaluation of aerocentric solar coordinates...*, Planet. Space Sci., 48, 215-235 — Ls accurate to ~0.01°.
- **Key formulas confirmed present on the public algorithm page (implementable directly):**
  - Mean anomaly `M = 19.3871° + 0.52402073° · Δt_J2000`
  - Fictitious mean sun `α_FMS = 270.3871° + 0.524038496° · Δt_J2000`
  - Perturbation series + equation of center → `Ls = α_FMS + (ν − M)`
  - Solar declination `δ = arcsin(0.42565 · sin Ls) + 0.25° · sin Ls` (encodes obliquity ≈ 25.19°)
  - Mars mean solar time at prime meridian: `MST = mod24{ 24h · ([(JD_TT − 2451549.5)/1.0274912517] + 44796.0 − 0.0009626) }`
  - Subsolar longitude `Λ_s = MST·(15°/h) + EOT + 180°`; subsolar latitude = δ.
- **License:** the algorithm page carries **no explicit license**; it is published NASA/GISS open science based on a peer-reviewed paper. We are **implementing the published algorithm ourselves** (not redistributing GISS's Java app), which is standard and unencumbered — the maths in Allison & McEwen 2000 is not copyrightable. The Mars24 *desktop app* bundles Apache/MIT-licensed Java libs, but we are not shipping their app. **Cite Allison & McEwen 2000** and note "algorithm per NASA GISS Mars24." (Flagged: if we ever want the exact reference values, cross-check our implementation against the worked examples on the GISS algorithm page and/or JPL Horizons for Mars sub-solar geometry — Horizons server-side only, same rule as Earth.)

### Mars constants (locked, for the physics/geometry code)

Verified against the NASA/SEDS Mars fact-sheet mirror (`spider.seds.org/spider/Mars/marsdata.html`; the NASA NSSDC host `nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html` currently 307-redirects to `nasa.gov/nssdc` — flagged below) and the Mars24 notes page:

| Constant | Value | Source |
|---|---|---|
| Obliquity (axial tilt) | **25.19°** | SEDS/NASA fact sheet |
| Orbital eccentricity | **0.0934** (0.09341 + 0.000092·T) — ~5.5× Earth's | SEDS/NASA fact sheet |
| Sidereal rotation period | 24h 37m 22.66s (24.6229 h) | SEDS/NASA fact sheet |
| Mean solar day (sol) | **24h 39m 35.244s** | NASA GISS Mars24 notes |
| Sidereal orbital period | 686.980 days | SEDS/NASA fact sheet |
| Tropical year | **686.9725 days = 668.5921 sols** | NASA GISS Mars24 notes |
| Perihelion timing | **Ls_p ≈ 251°** (southern summer) | NASA GISS Mars24 notes |
| Ls reference | 0° = N spring equinox, 90° = N summer solstice (aphelion), 180° = N autumn, 270° = N winter solstice = S summer | NASA GISS Mars24 notes |

**Physical consequence (the honest seasonal-asymmetry story):** eccentricity 0.0934 (~5.5× Earth's) means Mars receives ~40-45% more insolation at perihelion than aphelion. Perihelion falls at **Ls ≈ 251°**, i.e. **southern summer** — so the southern hemisphere gets short, hot summers and the global **dust-storm season clusters around Ls 180-360**. This is real, well-measured orbital physics and directly ties the pressure cycle (section 2a) and dust season (section 2d) together.

---

## Technical answers

### Best Mars base texture, and the size that ships
Use the USGS Astrogeology equirectangular mosaics — **MOLA color shaded relief 463m** (`Mars_MGS_MOLA_ClrShade_merge_global_463m.tif`, ~1 GB full) as the default relief base and/or **Viking MDIM2.1 colorized 232m** (`Mars_Viking_MDIM21_ClrMosaic_global_232m.tif`, ~12 GB full) for a photographic look. Both are equirectangular simple-cylindrical and public domain. **Ship a downsampled 4096×2048 JPEG** in `public/textures/` (like Earth's Blue Marble), not the multi-GB source. No live tile service is needed for a Mars base layer.

### Is there a Mars equivalent of GIBS (live imagery with CORS) we must use?
No, and we don't need one for a base layer. Mars "current conditions" are represented honestly by (a) the computed orbital clock/season (section 4), (b) measured in-situ climatology (Viking/REMS/InSight), and (c) dust-storm *season* climatology (Montabone). There is no requirement for a browser-CORS live tile feed. All Mars artifacts are static, built offline (GitHub Action or local), and committed — same architecture as the Earth wind pipeline.

### Anything problematic for an MIT-licensed open-source repo?
Two things to handle, both benign:
1. **Montabone dust climatology is CC-BY-SA 3.0** (not CC-BY). Any *derived* dust artifact we commit must (a) attribute Montabone 2015 + 2020 and (b) carry CC-BY-SA 3.0 in its own metadata. This is a data-license obligation separate from the repo's MIT code license — same situation as Open-Meteo's CC-BY on Earth. Not a blocker; just label it.
2. **Mars Climate Database is non-commercial + registration-gated → rejected.** Do not depend on it. Use measured PDS data + Montabone climatology + our own Mars24 implementation instead.

Everything else — USGS textures (public domain), all NASA PDS in-situ data (public domain), the Mars24 algorithm (published open science, we implement it) — is maximally permissive.

---

## Rejected / flagged items

- **Mars Climate Database (MCD): rejected** — non-commercial-only + request/registration-gated, no clean redistribution grant (verified 2026-07-06). Mirrors the Earth CDS rejection. Use PDS in-situ data + Montabone (CC-BY-SA) + self-implemented Mars24 instead.
- **NASA NSSDC Mars Fact Sheet host redirects:** `https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html` returned a **307 redirect to `nasa.gov/nssdc`** on 2026-07-06 (both with and without `?embed=true`). Constants above were taken from the SEDS mirror (`spider.seds.org`) and the NASA GISS Mars24 notes page, which agree. Before shipping a credits/constants page, re-pull the canonical fact sheet if the NSSDC host is reachable, or cite Mars24 + Allison & McEwen 2000 directly.
- **Mars24 algorithm has no explicit license statement** (verified absent on the credits page). We rely on the fact that we implement the *published, peer-reviewed* Allison & McEwen 2000 algorithm ourselves rather than redistributing GISS software. Non-blocking, but cite the paper.
- **`atmos.nmsu.edu` TLS chain:** live downloads succeeded, but the host can serve an incomplete certificate chain; the build script (`scripts/mars/build_pressure_climatology.py`) documents this and the data integrity is separately checkable against the PDS label's row count (3297). Flagged so a stricter TLS environment sets a proper CA bundle rather than being surprised.
- **Wiley/ScienceDirect abstracts (Hess 1980, Tillman 1993, Guo 2009) are paywalled** for full text; the *data* (Viking pressure) is open at PDS and was used directly. Citable numbers in this doc were computed from the PDS file itself, not transcribed from a paywalled figure.
- **Montabone NetCDF not ingested this session** — the files are NetCDF-4 (HDF5-based) and multi-MB per Mars Year, and no NetCDF-4 reader was available in the session environment (only `scipy.io.netcdf`, which reads classic NetCDF-3). Documented fully so a consumer can fetch + subset it; flagged as the next honest layer. The pressure cycle (open ASCII, tiny) was the correct first artifact.

---

**Verification methodology note:** Texture URLs and licenses were read from the official USGS Astrogeology map pages and confirmed to point at `planetarymaps.usgs.gov`. The Viking pressure dataset was **downloaded live** (`vl_avep.dat`, 293,433 bytes; `vl_avep.lbl`) from the PDS Atmospheres node and parsed per its PDS label; the reported swings (VL1 29.3%, VL2 32.7%) are computed from that file. Dust license text was read verbatim from the LMD dust-climatology page. Mars orbital constants and Ls/perihelion facts were read from the NASA GISS Mars24 pages and the SEDS Mars data mirror. All on 2026-07-06. See `docs/MARS_PHYSICS.md` for the honest-representation methodology.

---

## Phase 2 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app wires these in.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Seasonal CO2 pressure cycle | PDS `VL1/VL2-M-MET-4-DAILY-AVG-PRESSURE-V1.0` | `public/data/mars/seasonal_pressure.json`, built by `scripts/mars/build_pressure_climatology.py` (run once / offline), committed | Flagship measured signal. VL1 29.3% swing, VL2 32.7%. Label as "measured (Viking, 1976-1982)". |
| Mars season / Ls / sol clock | NASA GISS Mars24 (Allison & McEwen 2000) | implement in `lib/` (owned by another agent) | Computed client-side; cross-check subsolar geometry vs GISS worked examples / JPL Horizons offline. |
| Base globe texture | USGS MOLA color shaded relief 463m (or Viking MDIM2.1) | download once → downsample → `public/textures/` | Public domain; ship 4096×2048 JPEG, not the multi-GB source. |
| Dust-storm season (climatology) | Montabone et al. dust CDOD climatology (CC-BY-SA 3.0) | derived tau-by-Ls table → `public/data/mars/` (carry CC-BY-SA) | NOT a storm prediction — climatological probability by Ls. Next layer to build. |
