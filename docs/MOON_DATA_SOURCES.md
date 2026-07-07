# Moon Data Sources (Phase 3)

Verification date: **2026-07-06**. All licenses, endpoints, and download URLs below were verified on this date against official pages (USGS Astrogeology, NASA Scientific Visualization Studio, NASA PDS Geosciences Node, LRO mission / Diviner team) and/or live HTTP requests (noted per item). Anything that could not be verified from an official source is explicitly flagged. Same rigor and honesty bar as `DATA_SOURCES.md` (Earth) and `MARS_DATA_SOURCES.md`: real data, real physics, honest claims, everything free and legally usable for an MIT open-source app.

**The Moon has no atmosphere, so there is NO weather in the Earth/Mars sense — and we do not invent one.** Per the project brief, the "predictive/dynamic" angle is redirected to what is physically real on the Moon: **surface-temperature swings, illumination / day-night, libration, and phase.** See `MOON_PHYSICS.md` for the honest-representation methodology.

## Summary table

| Source | Data used | License | Attribution required | Access / limits | Verified against (2026-07-06) |
|---|---|---|---|---|---|
| NASA SVS — CGI Moon Kit (LROC WAC color) | Global basemap texture (equirectangular, web-friendly 4096×2048) | Public domain (NASA imagery) | Credit "NASA's Scientific Visualization Studio" + LROC/ASU | Static download, no key | svs.gsfc.nasa.gov/4720 + live HEAD (HTTP 200, 61.9 MB) |
| USGS Astrogeology — LROC WAC global mosaic 100m | Full-res morphology basemap (source; **not shipped**) | Public domain ("Please cite authors") | Cite authors (LROC/ASU/USGS) | Static, 5.5 GB — do NOT ship | astrogeology.usgs.gov map page + planetarymaps.usgs.gov URL + live HEAD |
| USGS Astrogeology — LROC WAC GLD100 color shaded relief | Colorized/hillshade elevation basemap option (source) | Public domain (Access: None) | Cite authors | Static, 11 GB — downsample only | astrogeology.usgs.gov map page + planetarymaps.usgs.gov URL + live HEAD |
| NASA SVS — CGI Moon Kit (LOLA displacement `ldem_4`) | Global terrain/relief (web-friendly 1440×720) | Public domain (NASA imagery) | Credit SVS + LOLA team | Static download, no key | svs.gsfc.nasa.gov/4720 + live HEAD (HTTP 200, 4.2 MB) |
| USGS Astrogeology — LOLA global DEM 118m | Full-res raw elevation (source; optional) | Public domain ("Please cite authors") | Cite authors (LOLA team) | Static, 8 GB — do NOT ship | astrogeology.usgs.gov map page + planetarymaps.usgs.gov URL + live HEAD |
| **NASA PDS — LRO Diviner GDR** (`LRO-L-DLRE-5-GDR-V1.0`) | Surface-temperature climatology (flagship honest signal) | Public domain (NASA / US Gov data) | None required (cite Williams 2017 / Vasavada 2012 / PDS) | Static, no key | pds-geosciences.wustl.edu Diviner page + open-access papers |
| Meeus / ELP2000 lunar theory (phase, libration, sub-solar/sub-Earth) | Client-side ephemeris (implement in code) | Algorithm — freely implementable (no license on maths) | Cite Meeus, *Astronomical Algorithms* | n/a (we implement it) | Meeus low-precision formulae; cross-check vs JPL Horizons offline |
| JPL Horizons | Offline libration/phase cross-check only | US Gov data; **NEVER call from browser** | None stated | One request at a time; server-side/offline only | Rule inherited from `DATA_SOURCES.md` §5 (CORS-forbidden, verified 2026-07-06) |

---

## 1. Lunar basemap texture (equirectangular, 2:1, public domain)

Two paths, both public domain. The **canonical, mission-derived global mosaics** live at USGS Astrogeology (the Moon equivalent of Natural Earth / Blue Marble for Earth and the MOLA/Viking mosaics for Mars), but their full-res files are multi-GB. The **web-friendly downsized versions** come from the NASA Scientific Visualization Studio "CGI Moon Kit," which republishes the same LROC WAC and LOLA data at ship-ready sizes. This mirrors exactly what Phase 2 did for Mars (canonical USGS source → downsampled texture in `public/textures/`), and what Phase 1 did for Earth (Blue Marble). Verified via live HEAD requests on 2026-07-06.

### 1a. NASA SVS CGI Moon Kit — LROC WAC color (recommended web-friendly base)
- **Page:** https://svs.gsfc.nasa.gov/4720 (NASA Scientific Visualization Studio, "CGI Moon Kit")
- **Recommended download (verified live HEAD, HTTP 200, `image/tiff`):**
  - `https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_16bit_srgb_4k.tif` — **4096×2048**, 61.9 MB (16-bit sRGB, 2025 version). Convert to a ~4096×2048 JPEG for the globe.
  - Lighter alternative: `https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_4k.tif` — **4096×2048**, 13.1 MB (24-bit RGB, 2019 version, poles filled).
  - Also available at 8k: `lroc_color_16bit_srgb_8k.tif` (8192×4096, 232 MB) and `lroc_color_poles_8k.tif` (8192×4096, 48.3 MB) if more detail is wanted.
- **Basis:** LROC (Lunar Reconnaissance Orbiter Camera) WAC Hapke-normalized global mosaic, LROC team / Arizona State University; color optimized for aesthetics (SVS note: *"optimized for aesthetics, not science. Scientific applications should use the source data"* — fine for a globe texture, and we do not make science claims from the texture).
- **License / credit (from the SVS page):** NASA imagery, public domain. *"Please give credit for this item to: NASA's Scientific Visualization Studio."* Also credit the LROC team / ASU as the data source. NASA insignia/logo not used.

### 1b. USGS Astrogeology — LROC WAC Global Morphology Mosaic 100m (canonical source, full-res — NOT shipped)
- **Map page:** https://astrogeology.usgs.gov/search/map/moon_lro_lroc_wac_global_morphology_mosaic_100m
- **Download URL (verified on page + live HEAD, HTTP 200):** `https://planetarymaps.usgs.gov/mosaic/Lunar_LRO_LROC-WAC_Mosaic_global_100m_June2013.tif`
- **Resolution:** 100 m/pixel (Simple Cylindrical / equirectangular). **File size: ~5.5 GB** (measured `Content-Length` 5,959,263,751 bytes). **Do NOT download or ship the full raster** — use the SVS 4k version (1a) instead. Documented here as the authoritative provenance.
- **License (verbatim from USGS map page):** **Access Constraints: "public domain."** Use: *"Please cite authors."* Basis: >15,000 WAC images, Nov 2009–Feb 2011, LROC/ASU/USGS.

### 1c. USGS Astrogeology — LROC WAC GLD100 color shaded relief (colorized/hillshade option, full-res — downsample only)
- **Map page:** https://astrogeology.usgs.gov/search/map/moon_lroc_wac_gld100_colorshade_79s79n_118m
- **Download URL (verified on page + live HEAD, HTTP 200):** `https://planetarymaps.usgs.gov/mosaic/Lunar_LROC_WAC_GLD100_ClrShade_79s79n_118m_v1_1.tif`
- **Resolution:** 118.45 m/pixel, equirectangular (planetocentric latitude, positive-east longitude), covers 79°S–79°N. **File size: ~11 GB** (measured 11,185,005,343 bytes). This is the colorized/hillshade elevation option (GLD100 = WAC-derived global DEM); it is the "topographic look" analogue of Mars' MOLA color shaded relief. **Downsample to 4096×2048 only** if used; do NOT ship the source.
- **License (verbatim):** **Access Constraints: "None." Use Constraints: public domain.**

**Recommendation for the globe:** ship the **SVS LROC WAC 4k color** (1a) as the default day texture — it is web-friendly, public domain, and drops straight into the same texture pipeline as Earth's Blue Marble and Mars' MOLA mosaic. Optionally offer the GLD100 color-shaded-relief look (1c, downsampled) as a toggle for a more "topographic" appearance. There is no live-imagery tile service for the Moon (no GIBS equivalent, and none needed — the Moon's surface does not change on human timescales); these static mosaics are the standard.

---

## 2. Surface temperature — LRO Diviner (the flagship honest Moon signal)

**Verified against:** the NASA PDS Geosciences Node Diviner page https://pds-geosciences.wustl.edu/missions/lro/diviner.htm and the open-access Diviner-team papers (Williams et al. 2017, Vasavada et al. 2012), on 2026-07-06.

With no atmosphere, the Moon's honest "dynamic" signal is its **enormous surface-temperature swing** — the sunlit equatorial surface reaches ~390–400 K at local noon and falls to ~95 K just before dawn (~300 K swing), while permanently-shadowed polar craters are among the coldest measured places in the solar system (~25–40 K). This was measured globally by the **Diviner Lunar Radiometer Experiment** on LRO.

### 2a. Data archive (public domain, NASA PDS Geosciences Node)
- **Node page:** https://pds-geosciences.wustl.edu/missions/lro/diviner.htm
- **Flagship gridded product — Global Data Record (GDR):** dataset ID **`LRO-L-DLRE-5-GDR-V1.0`** (PDS profile: https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=LRO-L-DLRE-5-GDR-V1.0). Commissioning + Primary Mapping data (2009-07-05 to 2012-09-15) gridded into **global bolometric brightness-temperature maps** — the bolometric temperature is derived from the individual Diviner channels for each **0.5° spatial bin and 0.25 h of local time**, giving a **diurnal temperature curve for every 0.5° of the lunar surface**. Higher-level products on the same node: RDR (`LRODLR_1001/1002`), Global Cumulative Products (GCP), Polar Cumulative/Resource Products (PCP/PRP), Global High-Resolution Mosaics (GHRM). Data base path `https://pds-geosciences.wustl.edu/lro/`.
- **License:** NASA / US-Government work → **public domain** (17 U.S.C. § 105), consistent with all NASA PDS archives (same treatment as the Mars PDS data). No key, no registration. The PDS page itself does not print a license line (flagged below) — the public-domain status is the standard PDS/NASA policy, not a per-page statement.
- **Also mirrored** (higher-resolution/derived products, for reference): the Diviner team's UCLA archive `https://www.diviner.ucla.edu/data` and `luna1.diviner.ucla.edu`, and a UCLA Dataverse for specific replication datasets. We anchor to the **published** numbers rather than re-hosting the archive.

### 2b. Measured temperature extremes (the numbers we can honestly show)
Taken from the open-access **Williams et al. (2017)** Diviner global-temperature paper (values quoted directly from the text; the paper is open access, doi:10.1016/j.icarus.2016.08.012):
- **Equatorial daytime maximum: 387–397 K** (average maximum **392.3 K**).
- **Equatorial pre-dawn minimum: ~95 K** (average minimum **94.3 K**).
- **Equatorial mean: 215.5 K**, i.e. an **average diurnal change of ~300 K.**
- Dusk terminator ~30 K warmer than the dawn terminator (thermal-inertia asymmetry of the regolith).
- **Permanently-shadowed polar cold traps:** annual temperatures **< 30 K** in the coldest PSRs; **Cabeus** (the LCROSS impact site) ~**37–38 K** annual average; broadly **~25–40 K** (Paige et al. 2010, Science 330, 479-482). Among the coldest measured places in the solar system.

### 2c. Diurnal temperature model (the equation, from Williams et al. 2017)
For the sunlit side, the surface is very close to instantaneous radiative equilibrium (the atmosphere is absent and the daytime conducted heat flux is small vs. absorbed sunlight), so **Williams et al. 2017, Eq. 1**:

```
T(i) = [ S (1 − A) cos(i) / (ε σ) ]^(1/4)
```

with the Diviner team's published parameters (Williams 2017 / Vasavada 2012):
- Solar constant **S = 1370 W/m²** (Moon ≈ 1 AU),
- Emissivity **ε = 0.95**,
- Stefan-Boltzmann **σ = 5.670374419×10⁻⁸ W m⁻² K⁻⁴**,
- Latitude-dependent Bond albedo (albedo rises toward the poles):
  **A(lat) = A₀ + a·(lat/45)³ + b·(lat/90)⁸**, with **A₀ = 0.08, a = 0.045, b = 0.14.**
- Local incidence angle: **cos(i) = cos(lat)·cos(h)**, hour angle **h = (LST − 12)·15°** (sub-solar point on the equator; the Moon's ~1.54° obliquity to the ecliptic makes this near-exact year-round).

This is exactly the model we implement in `scripts/moon/build_diurnal_temperature.py` (day side), with a Diviner-**measurement-anchored** night floor (equilibrium has no thermal inertia and is 0 K at night, which is unphysical — see `MOON_PHYSICS.md`). See the produced artifact below.

### 2d. Primary references (all open access or public data)
- Williams, J.-P., Paige, D.A., Greenhagen, B.T., Sefton-Nash, E. (2017), *The global surface temperatures of the Moon as measured by the Diviner Lunar Radiometer Experiment*, Icarus 283, 300-325, doi:10.1016/j.icarus.2016.08.012 (open access).
- Vasavada, A.R., et al. (2012), *Lunar equatorial surface temperatures and regolith properties from the Diviner Lunar Radiometer Experiment*, J. Geophys. Res. 117, E00H18, doi:10.1029/2011JE003987.
- Paige, D.A., et al. (2010), *Diviner Lunar Radiometer Observations of Cold Traps in the Moon's South Polar Region*, Science 330, 479-482, doi:10.1126/science.1187726.
- Paige, D.A., et al. (2010), *The Lunar Reconnaissance Orbiter Diviner Lunar Radiometer Experiment*, Space Sci. Rev. 150, 125-160 (instrument paper).

---

## 3. Terrain — LOLA (Lunar Orbiter Laser Altimeter), public domain (optional)

**Verified against:** the USGS Astrogeology LOLA DEM map page and the NASA SVS CGI Moon Kit, on 2026-07-06.

Global lunar topography from the **Lunar Orbiter Laser Altimeter** on LRO — the definitive lunar terrain dataset, useful later for real vertical relief / bump mapping on the globe (optional this phase, same status as Mars' MOLA DEM).

### 3a. Web-friendly (NASA SVS CGI Moon Kit — recommended if used)
- `https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_4.tif` — **1440×720** LOLA displacement map, **4.2 MB** (verified live HEAD, HTTP 200). Larger: `ldem_16.tif` (5760×2880, 63.3 MB), `ldem_64.tif` (23040×11520, ~1 GB — do NOT ship). Public domain; credit SVS + LOLA team.

### 3b. Canonical source (USGS Astrogeology — full-res, NOT shipped)
- **Map page:** https://astrogeology.usgs.gov/search/map/moon_lro_lola_dem_118m
- **Download URL (verified live HEAD, HTTP 200):** `https://planetarymaps.usgs.gov/mosaic/Lunar_LRO_LOLA_Global_LDEM_118m_Mar2014.tif` — 118.45 m/pixel (256 ppd), Simple Cylindrical, **~8 GB** (measured 8,494,203,833 bytes). Raw elevation in meters.
- **License (verbatim):** Access Constraints **"public domain,"** Use: *"Please cite authors."*

**Status:** optional this phase (temperature is the flagship). Documented so a consumer can add real relief later. If used, ship the SVS `ldem_4`/`ldem_16` downsized version, not the 8 GB source.

---

## 4. Ephemeris / libration / phase — computed client-side (we own the maths)

**Verified against:** the JPL Horizons CORS rule already established in `DATA_SOURCES.md` §5 (browser calls forbidden + no CORS header, verified 2026-07-06) and standard published lunar theory (Meeus, *Astronomical Algorithms*).

Lunar **phase, illumination fraction, sub-solar and sub-Earth points, and libration** can all be computed **client-side from orbital elements**, exactly as Earth's terminator (`lib/solar.ts`, NOAA/Spencer series) and Mars' Ls/subsolar geometry (Mars24 / Allison & McEwen) are. **No runtime API is needed, and JPL Horizons must NOT be called from the browser** (policy-forbidden + no CORS, per `DATA_SOURCES.md` §5) — use Horizons only for an **offline** cross-check.

### 4a. Recommended client-side method
Implement **Meeus, *Astronomical Algorithms* (2nd ed.)** low-precision lunar position + libration formulae, or an ELP2000-82B truncation:
- **Lunar phase & illuminated fraction:** from the geocentric elongation of the Moon from the Sun. Phase angle *i* satisfies `cos(elongation)` from the Sun/Moon ecliptic longitudes; **illuminated fraction k = (1 + cos i)/2** (Meeus Ch. 48). Phase name (new/first-quarter/full/last-quarter) from the Sun–Moon longitude difference.
- **Sub-solar / sub-Earth points (selenographic):** the sub-Earth point is where the observer (Earth) is at the lunar zenith; the sub-solar point is where the Sun is. Both follow from the Moon's rotation (synchronous, so the sub-Earth point stays near the mean center, wandering only by libration) and the Sun's selenographic position.
- **Optical libration in longitude and latitude:** Meeus Ch. 53 gives the geocentric optical librations `l'` (longitude) and `b'` (latitude) from the Moon's mean orbital elements (mean longitude, mean elongation, ascending node, argument of latitude) and the inclination of the lunar equator. These are the standard, unencumbered formulae.
- **Cross-check** the implementation against **JPL Horizons** (target `301` = Moon; observer-sub-longitude/latitude and illuminated-fraction quantities) **offline**, exactly as Earth's terminator and Mars' subsolar point were cross-checked. Server-side/offline only — never from the browser.

### 4b. Key constants (locked, for the geometry code)

| Constant | Value | Note |
|---|---|---|
| Synodic month (new-Moon to new-Moon) | **29.530589 days** | drives phase cycle |
| Sidereal month (orbit vs. fixed stars) | **27.321662 days** | drives sub-Earth motion |
| Anomalistic month (perigee to perigee) | 27.554550 days | drives distance / apparent-size variation |
| Draconic month (node to node) | 27.212221 days | eclipse geometry |
| Optical libration in longitude | **±~7.9°** | max selenographic longitude wander (mean ±7.6°, extreme ~±7.9°) |
| Optical libration in latitude | **±~6.9°** | max selenographic latitude wander (mean ±6.7°, extreme ~±6.9°) |
| Diurnal libration | ~±1° | parallax from Earth's rotation (observer-dependent) |
| Inclination of lunar equator to ecliptic | **1.543°** | small obliquity → sub-solar point stays near equator (why §2c assumes sub-solar ≈ equator) |
| Orbit inclination to ecliptic | 5.145° | with the 1.543° equator tilt gives the ~6.7° latitude libration |
| Mean Earth–Moon distance | 384,400 km | apparent size baseline |
| Bond albedo (mean, for temperature) | ~0.12 | (equator A₀ = 0.08; global mean ~0.11–0.12) — see §2c albedo law |
| Broadband emissivity | ~0.95 | §2c |

**Physical consequence (the honest illumination story):** libration lets Earth-based observers see **~59% of the lunar surface over time** (not just 50%), because the Moon "nods" and "rocks" by up to ~±7.9° in longitude and ±~6.9° in latitude. Phase (illuminated fraction) and the terminator follow directly from the Sun–Moon–Earth geometry. All of this is real, computable orbital physics — the Moon analogue of Earth's day/night terminator and Mars' season clock, and the honest "dynamic" content for a Moon that otherwise has no weather.

---

## Technical answers

### Best Moon base texture, and the size that ships
Ship the **NASA SVS CGI Moon Kit LROC WAC 4k color** (`lroc_color_16bit_srgb_4k.tif`, 4096×2048, 61.9 MB → convert to a ~4096×2048 JPEG). It is public domain, web-friendly, and equirectangular 2:1 — drops straight into the same texture pipeline as Earth's Blue Marble and Mars' MOLA mosaic. The canonical full-res source is the USGS LROC WAC 100m mosaic (5.5 GB) — provenance only, **not shipped**. A colorized/hillshade option is the USGS GLD100 color shaded relief (downsample). No live tile service exists or is needed for the Moon.

### Is there a Moon equivalent of GIBS (live imagery with CORS) we must use?
No, and we don't need one. The lunar surface does not change on human timescales, so a static mosaic is correct. "Current conditions" on the Moon are represented honestly by (a) the **computed** phase / illumination / libration / sub-solar geometry (§4), and (b) the **measured** Diviner surface-temperature climatology (§2). There is no requirement for a browser-CORS live feed; all Moon artifacts are static, built offline, and committed — same architecture as the Earth wind pipeline and the Mars artifacts.

### Anything problematic for an MIT-licensed open-source repo?
No blockers. Everything is maximally permissive:
- **USGS LROC WAC / GLD100 / LOLA mosaics:** public domain ("Access: public domain / None"), "please cite authors."
- **NASA SVS CGI Moon Kit:** NASA imagery, public domain; credit "NASA's Scientific Visualization Studio" + LROC/ASU + LOLA team (text credit only; NASA insignia not used).
- **LRO Diviner (PDS):** public domain NASA/US-Gov data; cite the Diviner team / Williams 2017.
- **Libration/phase maths:** we implement published (Meeus/ELP2000) formulae ourselves — the maths is not copyrightable, same posture as Mars24.
- **JPL Horizons:** offline cross-check only; never called from the browser (policy-forbidden + no CORS, per Earth §5).

There is **no** CC-BY-SA-style redistribution obligation here (unlike Mars' Montabone dust climatology). All Moon data can be vendored freely with courtesy attribution.

---

## Rejected / flagged items

- **USGS full-res mosaics NOT shipped:** LROC WAC 100m (5.5 GB), GLD100 color shaded relief (11 GB), LOLA DEM 118m (8 GB). Public domain and canonical, but far too large to ship — sizes confirmed by live HEAD `Content-Length` on 2026-07-06. Use the NASA SVS 4k/1440 downsized versions and keep these URLs only as provenance. Same rule as Mars' multi-GB MOLA/Viking sources.
- **JPL Horizons for client-side libration/phase: rejected for runtime** — browser calls are policy-forbidden and no CORS header is sent (verified 2026-07-06, `DATA_SOURCES.md` §5). Compute libration/phase client-side (Meeus/ELP2000); use Horizons only for offline validation.
- **PDS Geosciences Diviner page prints no explicit license line** (verified absent on the node page, 2026-07-06). Public-domain status is the standard NASA/US-Gov + PDS policy (17 U.S.C. § 105), consistent with how the Mars PDS data was treated; not a per-page statement. Non-blocking; cite the Diviner team + Williams 2017.
- **SVS CGI Moon Kit color is "optimized for aesthetics, not science"** (stated on the SVS page). Fine as a globe texture — we make **no** scientific claim from the texture itself; all temperature numbers trace to the Diviner archive / Williams 2017, not to the color map. Do not derive quantitative albedo/temperature from the shipped JPEG.
- **UCLA Diviner Dataverse per-dataset license not individually verified** (e.g. the 2023 nighttime/rock-abundance replication set). We anchor to the **published** Diviner numbers (Williams 2017, open access) and the **PDS** public-domain archive rather than re-hosting any UCLA-hosted file, so no UCLA-specific license needs clearing. Flagged in case a future phase wants to vendor a specific UCLA gridded product — check its Dataverse license first.
- **Libration amplitude figures** (±~7.9° longitude, ±~6.9° latitude) are the standard textbook extremes; mean amplitudes are slightly smaller (~±7.6° / ±6.7°). Cross-check the client-side implementation against JPL Horizons offline before trusting exact per-date values (same posture as Earth's terminator and Mars' subsolar point).

---

## Produced artifact (this phase)

**`public/data/moon/diurnal_temperature.json`** (built by `scripts/moon/build_diurnal_temperature.py`, run 2026-07-06). Lunar diurnal surface-temperature curves (surface temperature vs local solar time) at latitudes 0°, 30°, 60°, 85°. **Daytime** = the Williams et al. 2017 radiative-equilibrium formula (§2c) with the Diviner team's published albedo law and ε = 0.95; **nightside** = a Diviner-measurement-anchored cooling floor (equilibrium is 0 K at night, unphysical). Anchored to and validated against Diviner's measured extremes:
- **Equator: 391.1 K day / 95.5 K night → 295.6 K swing** (vs Diviner-measured ~392 K max / ~95 K min / ~300 K change).
- 30°: 375.9 / 92.2 K (283.7 K swing); 60°: 318.4 / 80.3 K (238.1 K swing); 85°: 185.0 / 51.9 K (133.1 K swing).
- Size **~8.9 KB** (< 100 KB budget). The script fails loudly if the equatorial daytime peak drifts outside Diviner's measured 387–397 K band.

This is an **illustrative-but-grounded model, not a live sensor feed and not the raw Diviner archive** — labeled as such in the JSON `_comment` and in `MOON_PHYSICS.md`. It is the Moon's flagship honest "dynamic" signal (the ~300 K day-night swing), the analogue of Mars' Viking pressure cycle.

---

**Verification methodology note:** Texture and DEM download URLs were read from the official USGS Astrogeology map pages and the NASA SVS CGI Moon Kit page, and **HEAD-checked live** on 2026-07-06 (all returned HTTP 200 with the `Content-Length`/`Content-Type` quoted above: SVS 4k color 61.9 MB, SVS poles-4k 13.1 MB, SVS `ldem_4` 4.2 MB, USGS LROC WAC 100m 5.5 GB, USGS GLD100 11 GB, USGS LOLA DEM 118m 8 GB). Diviner surface-temperature numbers (392.3 K avg max, 94.3 K avg min, 215.5 K mean, ~300 K change; PSR <30–40 K) were read from the open-access Williams et al. 2017 paper (downloaded and parsed) and Paige et al. 2010. The Diviner dataset ID and GDR binning (0.5° / 0.25 h) were read from the PDS Geosciences Node page and the PDS profile. Libration/phase constants are standard lunar-theory values (Meeus). All on 2026-07-06. See `docs/MOON_PHYSICS.md` for the honest-representation methodology.

---

## Phase 3 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app wires these in.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Diurnal surface-temperature swing | LRO Diviner (Williams 2017 model + measured anchors, PDS `LRO-L-DLRE-5-GDR-V1.0`) | `public/data/moon/diurnal_temperature.json`, built by `scripts/moon/build_diurnal_temperature.py` (run once / offline), committed | Flagship honest signal: ~300 K day-night swing. Label "model anchored to Diviner measurements (LRO), not a live feed." |
| Base globe texture | NASA SVS CGI Moon Kit — LROC WAC 4k color | download once → convert to 4096×2048 JPEG → `public/textures/` | Public domain; ship the 4k, not the 5.5 GB USGS source. Credit "NASA SVS / LROC / ASU." |
| Phase / illumination / sub-solar + sub-Earth / libration | Meeus / ELP2000 lunar theory (implement in `lib/`, owned by another agent) | computed client-side, no data file | Cross-check vs JPL Horizons (target 301) offline. Constants in §4b. Libration reveals ~59% of the surface. |
| Terrain relief (optional) | NASA SVS CGI Moon Kit — LOLA `ldem_4`/`ldem_16` (or USGS LOLA DEM 118m source) | download once → `public/textures/` (displacement/bump) | Public domain; optional, for real vertical relief later. |
