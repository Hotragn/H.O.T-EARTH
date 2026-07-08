# Other-Planets Data Sources (Solar System Stretch Phase)

Verification date: **2026-07-06**. All licenses, endpoints, download URLs and physical constants below were verified on this date against official pages (USGS Astrogeology, NASA/JPL, NASA Photojournal/Science, NASA PDS, NASA NSSDCA, and planetary-science literature) and/or live HTTP requests (noted per item). Anything that could not be verified from an official source is explicitly flagged. Same rigor and honesty bar as `DATA_SOURCES.md` (Earth), `MARS_DATA_SOURCES.md` and `MOON_DATA_SOURCES.md`: real data, real physics, honest claims, everything free and legally usable for an MIT open-source app, every source + license logged.

Bodies this phase: **Mercury, Venus, Jupiter, Saturn, Uranus, Neptune** (Earth/Mars/Moon done in Phases 1-3).

> **Honesty rule for this phase (from the project brief):** most of these planets do **NOT** support a real weather / predictive layer. The honest bar is **orbital mechanics + measured physical facts + real textures**. We do **not** invent weather. Dynamic data is shown only where it is genuinely **measured**: gas-giant zonal wind profiles, Mercury surface-temperature extremes, Venus super-rotation, Neptune wind speeds. See `docs/PLANETS_PHYSICS.md` for the measured/computed/model/static contract.

## Summary table

| Body | Basemap texture (equirectangular) | Texture license | Measured dynamic signal | Dynamic-data source |
|---|---|---|---|---|
| Mercury | USGS/ASU MESSENGER MDIS color mosaic 665m | Public domain ("please cite authors") | Day/night surface-temp extremes (~700 K / ~100 K) | MESSENGER-era / NSSDC fact sheet |
| Venus | USGS Magellan C3-MDIR radar mosaic 2025m | Public domain (Use: None) | Cloud-top super-rotation (~100 m/s, ~4-day) | Venus Express (VMC) + Akatsuki (UVI) |
| Jupiter | NASA Cassini "Best Map of Jupiter" (PIA07782) — **preferred, PD**; or Solar System Scope 4k (CC-BY) | PD (NASA/JPL/SSI) / CC-BY-4.0 | Zonal wind profile (peak ~150 m/s) + Great Red Spot (~22° S) | Cassini/Voyager/Hubble cloud tracking → `zonal_winds.json` |
| Saturn | NASA Cassini PDS ISS global maps (PD, FITS → RGB) or Solar System Scope 4k (CC-BY); + ring texture | PD / CC-BY-4.0 | Zonal winds (equatorial jet ~400+ m/s) + N polar hexagon (~78° N) + rings | Cassini/Voyager → `zonal_winds.json`, `saturn_rings.json` |
| Uranus | Solar System Scope 2k (CC-BY) — **stylized, no PD map exists** | CC-BY-4.0 | 42-year seasons (computed from obliquity 97.77°) | Derived from constants |
| Neptune | Solar System Scope 2k (CC-BY) — **stylized, no PD map exists** | CC-BY-4.0 | Fastest winds in the solar system (~580 m/s) | Voyager 2 (1989) → `zonal_winds.json` |

Committed artifacts (all under `public/data/planets/`): `constants.json`, `zonal_winds.json`, `saturn_rings.json`. Build scripts under `scripts/planets/`.

---

## 1. Basemap textures (equirectangular, 2:1)

### The licensing landscape (important)
There are **three** distinct texture situations for these six bodies, and the licensing differs:

1. **Terrestrial planets (Mercury, Venus):** USGS Astrogeology hosts canonical, **public-domain** mission mosaics, exactly like Mars/Moon. These are the gold standard — real observations, freely redistributable.
2. **Jupiter & Saturn (gas giants):** USGS Astrogeology does **NOT** host gas-giant cloud-top maps (verified — its "Jupiter" page is actually the Galilean *moons'* surfaces). The authentic public-domain cloud maps come from **NASA Photojournal / NASA PDS (Cassini ISS)**. Jupiter has a turnkey PD map; Saturn's PD map ships as single-filter FITS that must be combined into RGB.
3. **Uranus & Neptune (ice giants):** **No public-domain equirectangular cloud map exists** as a ready file (only one Voyager-2 flyby each; nearly featureless). The Voyager-derived cylindrical maps in circulation (Björn Jónsson via planetary.org) are **CC BY-NC-ND** → **incompatible with MIT / commercial forks → REJECTED.** For these two the only free-and-legal option is the **Solar System Scope CC-BY-4.0** artist-tuned texture, which must be labeled *stylized, not an observation map.*

**All full-res mosaics are downsampled to ~4096×2048 (or 2048×1024) JPEG for shipping**, exactly as Phases 1-3 did — never ship the multi-hundred-MB source.

### 1a. Mercury — USGS/ASU MESSENGER MDIS color (public domain) ✅ preferred
- **Map page:** https://astrogeology.usgs.gov/search/map/mercury_messenger_mdis_global_color_mosaic_665m (verified 2026-07-06)
- **Download URL (verified on page):** `https://planetarymaps.usgs.gov/mosaic/Mercury_MESSENGER_ClrMosaic_global_665m_v3.tif`
- **Dimensions / resolution:** 23,054 × 11,527 px, 665 m/pixel (64.04 px/deg). **File size ~772 MB** → downsample to 4096×2048 JPEG.
- **Projection:** Equirectangular (planetocentric latitude, +east lon, -180..180). Drops straight into the Earth/Mars/Moon texture pipeline.
- **License (verbatim):** Access Constraints **"public domain."** Use Constraints **"Please cite authors."**
- **Originators / credit:** Arizona State University (originators); MESSENGER Team (primary authors); published by USGS Astrogeology Science Center. Credit "NASA / USGS / Arizona State University / MESSENGER."
- Also available: enhanced-color and grayscale (250m) MDIS mosaics on the same catalog, and a DEM color shaded relief 2km (topography). All same public-domain USGS terms.

### 1b. Venus — USGS Magellan C3-MDIR radar mosaic (public domain) ✅ preferred
- **Map page:** https://astrogeology.usgs.gov/search/map/venus_magellan_global_c3_mdir_mosaic_2025m (verified 2026-07-06)
- **Download URL (verified on page):** `https://planetarymaps.usgs.gov/mosaic/Venus_Magellan_C3-MDIR_Global_Mosaic_2025m.tif`
- **Dimensions / resolution:** 18,775 × 9,388 px, 2025 m/pixel. **File size ~170 MB** → downsample to 4096×2048 JPEG.
- **Projection:** Equirectangular.
- **License (verbatim):** Access Constraints **"public domain."** Use Constraints **"None."**
- **Originator / credit:** PDS Geosciences Node; published by USGS Astrogeology Science Center. Basis: Magellan synthetic-aperture **radar** (F-BIDRs), 1990-1994.
- **Honesty note:** This is a **radar** map, not visible-light — Venus' surface is permanently hidden under cloud in visible light. The shipped texture shows real surface topography/roughness (radar), and we state that plainly. Color variants exist (synthetic color 4641m, colorized topographic 6600m) on the same catalog, same PD terms.

### 1c. Jupiter — NASA Cassini "Best Map of Jupiter" (public domain) ✅ preferred authentic
- **Verified page:** https://science.nasa.gov/photojournal/cassinis-best-maps-of-jupiter-cylindrical-map/ (PIA07782)
- **Download URLs (verified live 2026-07-06):**
  - JPG: `https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia07/pia07782/PIA07782.jpg` (~431 KB)
  - TIFF: `https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia07/pia07782/PIA07782.tif` (18.56 MB)
- **Dimensions:** 3601 × 1801 px (exactly 2:1). **Projection:** cylindrical / equirectangular (page: "equal increments of planetocentric latitude and longitude… 180° of latitude and 360° of longitude").
- **Mission:** Cassini ISS, Jupiter flyby Dec 2000.
- **License:** NASA public domain (JPL Image Use Policy: "…may be used for any purpose without prior permission"). Credit **"NASA/JPL/Space Science Institute."** No copyright asserted.
- **Honesty note:** genuine cloud-top color map, but reconstructed from two filters (750 nm + 451 nm), so color is approximate — real observational data, labeled a **snapshot** (belts drift over time).
- **Science-grade alternative (PD):** NASA PDS "Cassini ISS Global Maps of Jupiter and Saturn Bundle" (Li et al. 2023) at https://atmos.nmsu.edu/data_and_services/atmospheres_data/Cassini/sat_global_map.html — equirectangular single-filter FITS (3601×1801); requires combining RED/GRN/BL1 into RGB. Citation requested: *Li, West, Jiang & Knowles (2023), Cassini ISS Global Maps of Jupiter and Saturn Bundle, NASA PDS.*

### 1d. Saturn — NASA Cassini PDS global maps (PD) or Solar System Scope (CC-BY)
- **Authentic PD source:** NASA PDS "Cassini ISS Global Maps" bundle (same page/citation as Jupiter's PDS alternative). Equirectangular single-filter FITS (3601×1801), confirmed present:
  `.../data_derived/Cassini_ISS_RED_Saturn_global_map.fits`, `..._GRN_...`, `..._BL1_...` (+ MT2). RGB browse previews exist but are **1167×875 annotated figures, not a 2:1 texture** (`.../browse/Browse_Cassini_ISS_RGB_Saturn_global_color_map_original.png`). **To ship a clean 2:1 RGB texture you must combine the three filter FITS yourself.** PD; Li et al. (2023) citation requested.
- **No turnkey 2:1 PD JPG for Saturn exists** — hence Solar System Scope (§1f) is the pragmatic drop-in if FITS processing is out of scope.
- **Ring texture:** see §3 (`saturn_rings.json`) — the ring plane is rendered from real radii; a ring color strip can be sampled from Cassini ring imagery (PD) or the SSS ring texture (CC-BY).

### 1e. Uranus & Neptune — no PD map; Solar System Scope only (stylized)
- **No public-domain equirectangular cloud map exists** for either (single Voyager-2 flyby; Uranus is near-featureless pale cyan). Verified 2026-07-06.
- **REJECTED:** Björn Jónsson's Voyager-2 cylindrical maps hosted at planetary.org (Uranus `.../cylindrical-map-of-uranus-from-voyager-2-data`, 1200×600; Neptune `neptune_voyager_global_bjorn.jpg`, 768×768) — licensed **CC BY-NC-ND 3.0** (NonCommercial + NoDerivatives). **Incompatible with an MIT / potentially-commercial-fork project → do not use.** (Same posture as the Earth CDS / Mars MCD rejections: a use restriction we can't accept.)
- **Usable option:** Solar System Scope (§1f), CC-BY-4.0 — the only free-and-legal texture for Uranus/Neptune. **Must be labeled stylized/illustrative**, not an observation map.

### 1f. Solar System Scope — CC-BY-4.0 (drop-in for all four giants) ⚠️ artist-tuned
- **Source page:** https://www.solarsystemscope.com/textures/ — license verbatim: *"Distributed under Attribution 4.0 International license: You may use, adapt, and share these textures for any purpose, even commercially."*
- **Practical access:** the solarsystemscope.com download links sit behind Cloudflare (403 to scripts); use the **Wikimedia Commons mirror** (direct `upload.wikimedia.org`, verified HTTP 200, license confirmed via Commons API as `cc-by-4.0`, Artist "Solar System Scope"):

  | Planet | Verified URL | Dimensions | Size |
  |---|---|---|---|
  | Jupiter (8k label) | `https://upload.wikimedia.org/wikipedia/commons/5/5e/Solarsystemscope_texture_8k_jupiter.jpg` | 4096×2048 | 2.94 MB |
  | Saturn (8k label) | `https://upload.wikimedia.org/wikipedia/commons/1/1e/Solarsystemscope_texture_8k_saturn.jpg` | 4096×2048 | 1.05 MB |
  | Uranus | `https://upload.wikimedia.org/wikipedia/commons/9/95/Solarsystemscope_texture_2k_uranus.jpg` | 2048×1024 | 76 KB |
  | Neptune | `https://upload.wikimedia.org/wikipedia/commons/1/1e/Solarsystemscope_texture_2k_neptune.jpg` | 2048×1024 | 236 KB |

  (2k Jupiter/Saturn also exist; Uranus/Neptune have **no** higher-res version anywhere.)
- **Projection:** equirectangular 2:1 (confirmed by dimensions).
- **License / attribution (REQUIRED — this is CC-BY 4.0, not public domain):** the exact required attribution string is **`Textures by Solar System Scope, CC BY 4.0`** (link the licence: https://creativecommons.org/licenses/by/4.0/), and indicate that the texture was resized if changed. This obligation applies to **every** Solar System Scope texture actually shipped — i.e. **Saturn** (if the SSS map is used instead of the NASA PDS FITS→RGB), **Uranus**, **Neptune**, and the **ring texture** if the ring colour strip is sampled from the SSS Saturn-ring texture. Put the string in the app credits/about panel **and** in a repo `CREDITS`/`ASSETS` file (same obligation pattern as Open-Meteo CC-BY on Earth and Montabone CC-BY-SA on Mars — a data/asset licence separate from the repo's MIT code licence). Jupiter is exempt only if the NASA PD PIA07782 map is used instead of SSS.
- **Honesty note (critical):** these are **artist-tuned representations**, not raw observations ("colors tuned according to true-color photos made by Cassini… and Hubble"). Jupiter/Saturn look plausibly realistic; **Uranus and Neptune are stylized** (real Uranus is nearly featureless; the texture adds contrast and idealizes Neptune's banding). Label them **"stylized cloud-top texture (illustrative)"** in the UI, never "observation" or "live."

**Recommendation:** Mercury/Venus → USGS PD (turnkey). Jupiter → NASA Cassini PIA07782 PD (turnkey, authentic). Saturn → NASA PDS Cassini FITS→RGB (authentic, needs processing) **or** SSS CC-BY. Uranus/Neptune → SSS CC-BY (stylized, clearly labeled). This maximizes public-domain authentic imagery and confines the CC-BY-attribution obligation to the two bodies where nothing else legal exists.

---

## 2. Physical constants (per body) — `constants.json`

**Verified against JPL Solar System Dynamics (live 2026-07-06) + NASA NSSDCA Planetary Fact Sheet.** Built reproducibly by `scripts/planets/build_constants.py`; committed as `public/data/planets/constants.json`.

**Field provenance (each value tagged in the JSON):**
- **Equatorial radius, mean radius, mass, sidereal rotation period, density** → **JPL SSD Planetary Physical Parameters**, https://ssd.jpl.nasa.gov/planets/phys_par.html (fetched live 2026-07-06). This is the primary, live-verified source.
- **Semi-major axis (AU), orbital eccentricity** → **JPL SSD Approximate Positions of the Planets, Table 1 (1800-2050)**, https://ssd.jpl.nasa.gov/planets/approx_pos.html (fetched live 2026-07-06).
- **Obliquity (axial tilt), mean/1-bar temperature, orbital period (days)** → **NASA NSSDCA Planetary Fact Sheet** (D. R. Williams), https://nssdc.gsfc.nasa.gov/planetary/factsheet/. **Flag:** the `nssdc.gsfc.nasa.gov` host **307-redirects to nasa.gov/nssdc** as of 2026-07-06 (identical to the Mars fact-sheet issue in `MARS_DATA_SOURCES.md`). These three fields were cross-checked against a faithful reproduction of the fact sheet and multiple web sources; the JPL fields above are the live-verified gold standard and agree with NSSDC to rounding.
- **Mercury obliquity 0.034° (= 2.042 arcmin):** the measured value (Margot et al. 2012) that NSSDC reports; some fact-sheet reproductions round it to 0.01°.

**Verified constants (the six + Earth/Mars/Moon for orrery completeness):**

| Body | Eq. radius (km) | Mass (10²⁴ kg) | Sidereal rotation | Obliquity | a (AU) | Eccentricity | Orbital period | Mean/1-bar temp |
|---|---|---|---|---|---|---|---|---|
| Mercury | 2440.53 | 0.330103 | 58.646 d | 0.034° | 0.38710 | 0.20564 | 88.0 d | 440 K (day ~700 K / night ~100 K) |
| Venus | 6051.8 | 4.86731 | −243.018 d (retro) | 177.36° | 0.72334 | 0.00678 | 224.7 d | 737 K (surface) |
| Jupiter | 71,492 | 1898.125 | 9.925 h | 3.13° | 5.20289 | 0.04839 | 4331 d | 163 K (1-bar) |
| Saturn | 60,268 | 568.317 | 10.656 h | 26.73° | 9.53668 | 0.05386 | 10,747 d | 133 K (1-bar) |
| Uranus | 25,559 | 86.8099 | −17.24 h (retro) | 97.77° | 19.18916 | 0.04726 | 30,589 d | 78 K (1-bar) |
| Neptune | 24,764 | 102.4092 | 16.11 h | 28.32° | 30.06992 | 0.00859 | 59,800 d | 73 K (1-bar) |
| Earth | 6378.14 | 5.97217 | 23.934 h | 23.44° | 1.00000 | 0.01671 | 365.2 d | 288 K |
| Mars | 3396.19 | 0.641691 | 24.623 h | 25.19° | 1.52371 | 0.09339 | 687.0 d | 208 K |
| Moon | 1738.1 | 0.07346 | 27.322 d | 6.68° | 0.00257* | 0.0549 | 27.3 d | 253 K |

\* Moon: `semimajor_axis_au` is the mean Earth-Moon distance (384,400 km) expressed in AU — a geocentric orbit, not heliocentric (flagged in the JSON).

**Honesty flags baked into the JSON:**
- Gas/ice giants have **no solid surface** → temperature is a **1-bar reference level**, not a surface reading (per-body `temp_kind`). NSSDC 1-bar temps carry ~1-2 K spread across reproductions (e.g. Uranus appears as 76 K and 78 K) — stored value flagged.
- Mercury's "mean" 440 K is near-meaningless given the ~600 K range; the **measured extremes** (~700 K day / ~100 K night) are stored separately as the honest dynamic signal.
- Negative `sidereal_rotation` = **retrograde** (Venus, Uranus).
- Orbital periods (days) from NSSDC are consistent with Kepler's third law applied to the JPL semi-major axes (cross-check).

---

## 3. Saturn rings — `saturn_rings.json`

**Real occultation-derived ring boundary radii**, for rendering the ring system **to scale**. Built by `scripts/planets/build_saturn_rings.py`.

- **Canonical source:** NASA NSSDCA **Saturnian Rings Fact Sheet** (D. R. Williams), https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html (host 307-redirects, same flag as §2).
- **Transcribed cross-check:** the numeric boundary table was read verbatim from Wikipedia "Rings of Saturn" (overall-structure table), https://en.wikipedia.org/wiki/Rings_of_Saturn (fetched 2026-07-06), which reproduces the NSSDC/occultation values.
- **Primary literature:** Cuzzi, Filacchione & Marouf (2018), *The Rings of Saturn* (review, hosted at nasa.gov); ultimately French & Nicholson stellar/radio-occultation radii.
- **Scale reference:** Saturn equatorial radius R_Saturn = 60,268 km (JPL, §2). Each radius is stored in both km and R_Saturn.
- **License:** NASA data public domain; standard published constants. Credit "NASA/NSSDCA + ring occultation literature."

**Ring boundaries (km from Saturn's center; committed values):**

| Feature | Inner (km) | Outer (km) | Width (km) | R_Saturn |
|---|---|---|---|---|
| D Ring | 66,900 | 74,510 | 7,500 | 1.11–1.24 |
| C Ring | 74,658 | 92,000 | 17,500 | 1.24–1.53 |
| B Ring | 92,000 | 117,580 | 25,500 | 1.53–1.95 |
| **Cassini Division** | 117,580 | 122,170 | 4,700 | 1.95–2.03 |
| A Ring | 122,170 | 136,775 | 14,600 | 2.03–2.27 |
| Roche Division | 136,775 | 139,380 | 2,600 | 2.27–2.31 |
| F Ring | 140,180 | 140,680 | ~30–500 | 2.33 |
| G Ring | 166,000 | 175,000 | 9,000 | 2.75–2.90 |
| E Ring | 180,000 | 480,000 | 300,000 | 2.99–7.96 |

Narrow gaps inside rings (center radius / width): **Encke Gap** 133,589 km / 325 km (A ring, opened by Pan), **Keeler Gap** 136,505 km / 35 km (opened by Daphnis), Colombo Gap 77,870 km / 150 km, Maxwell Gap 87,491 km / 270 km (both in the C ring). To-scale rendering hint: draw D→F (≈1.11–2.33 R_Saturn); G/E are extremely faint and usually omitted or drawn as haze.

---

## 4. Measured dynamic data (honestly showable, per body)

Only signals that are genuinely **measured** are listed. See `PLANETS_PHYSICS.md` for the measured/computed/model contract.

### 4a. Mercury — surface-temperature extremes (MEASURED)
- **What:** the largest day/night temperature range of any planet. Subsolar surface ~**700 K (~427–430 °C)**; night side ~**100 K (−173 °C)**. Cause: essentially **no atmosphere** (tenuous exosphere) to redistribute heat.
- **Source:** NASA NSSDCA Mercury Fact Sheet (max 427 °C / min −173 °C); MESSENGER orbital mission (2011-2015). Verified 2026-07-06 (NSSDC redirect flagged in §2). Stored in `constants.json` → Mercury `measured_temp_extremes_C`.

### 4b. Venus — atmospheric super-rotation (MEASURED)
- **What:** cloud-top zonal winds ~**100 m/s** (retrograde) circling the planet in ~**4 Earth days**, vs the **243-day** retrograde solid-body rotation (~60× faster) — "super-rotation." The surface, by contrast, is **near-isothermal ~737 K (464 °C)** under a ~92-bar CO₂ greenhouse (no surface dynamics).
- **Source:** cloud-tracking from **ESA Venus Express (VMC)** and **JAXA Akatsuki (UVI)**, ~2006-2022 (>4M cloud-tracking vectors). Verified 2026-07-06 (JAXA Akatsuki Nature 2021 release; Venus Express super-rotation monitoring). Stored in `constants.json` → Venus `super_rotation`.

### 4c. Jupiter, Saturn, Neptune — zonal wind profiles (MEASURED) → `zonal_winds.json`
See §5. Measured mean zonal wind speed vs latitude (cloud-tracking), plus each body's famous landmark:
- **Jupiter Great Red Spot** — long-lived anticyclone near **~22° S**; observed for centuries (described, not forecast).
- **Saturn north polar hexagon** — real six-sided jet-stream standing wave at **~78° N** (Voyager + Cassini); equatorial super-jet **~400+ m/s**.
- **Neptune** — **fastest winds in the solar system, ~2100 km/h (~580 m/s)**, measured by **Voyager 2 (1989)**; **Great Dark Spot is TRANSIENT** (1989 spot gone by 1994; new ones appear/fade — must be labeled transient).

### 4d. Uranus — 42-year extreme seasons (COMPUTED, the standout)
- Not a "measured dynamic feed" but the standout honest signal: **obliquity 97.77°** (measured constant) + 84-year orbit ⇒ **~42-year seasons**, each pole in ~21 years of daylight then ~21 of darkness. Retrograde rotation. True-color appearance is near-featureless (faint bands only) — stated honestly, not faked. Computed from `constants.json`.

---

## 5. Zonal wind profiles — `zonal_winds.json`

**MEASURED** mean zonal (east-west) wind speed vs latitude, from cloud-feature tracking. Presented as a climatological mean profile — **not a forecast, not live**. Built by `scripts/planets/build_zonal_winds.py`; convention **positive = eastward (prograde)**, units m/s. Schema: `{ meta:{note,units,convention}, bodies:{ Jupiter|Saturn|Neptune: {source, profile:[[latDeg,windMs],…]} } }`.

**The honest per-body reality (a real finding, not a shortcut):**

- **Jupiter — FULL dense real profile.** Transcribed from the cloud-tracked zonal wind profile of **Barrado-Izagirre et al. (2013), A&A 554, A74**, published as **VizieR/CDS catalog `J/A+A/554/A74`** (`table3.dat`: latitude, zonal velocity m/s, error, N). The 1° native table was **downloaded and read this session** and decimated to ~3° (**42 points**, −60°→+63°, jet peaks preserved). Landmarks in the data: **peak eastward +153.7 m/s at 21°N**, equatorial jet ~**+140 m/s** at ±6°, equator +69.8 m/s, **strongest westward −52.5 m/s at 17°S**. Great Red Spot ~**22°S** (Simon et al. 2018). Genuine measured data.
- **Saturn — LANDMARK points only (flagged).** The canonical **full** dense profile is **García-Melendo et al. (2011), Icarus 215, 62–74** (Cassini ISS 2004–2009), archived at the **NASA PDS** (bundle `urn:nasa:pds:coiss_zonal_winds`, DOI `10.17189/1518962`) — **not an openly downloadable flat table this session**, so we do **not** fabricate a dense curve. Committed landmark values (each cited): broad **equatorial super-jet ~+450 m/s** at 0° (Cassini ~400–450; Voyager ~470, Sánchez-Lavega et al. 2000; VIMS >450–500 m/s at the jet core), **+390 m/s at ~8°S** (VIMS/Cassini), and the **north polar hexagon eastward jet ~+120 m/s near 78°N** (Godfrey 1988 / Cassini). 3 points — flagged sparse; use the PDS bundle for the full curve.
- **Neptune — LANDMARK points only (flagged).** Neptune's canonical profile is the **smooth Voyager-2 fit of Sromovsky et al. (1993), Icarus 105, 110–141** (Table VII / 6th-order fit) from features tracked by **Limaye & Sromovsky (1991)** — **paper-only; coefficients not openly downloadable** (the modern Tollefson et al. 2018 fit is paywalled). Committed landmark values (each cited): **equatorial retrograde ~−400 m/s** at 0° (Sromovsky et al. 1993); **prograde jet ~+250 m/s at ~70°S** (Limaye & Sromovsky 1991). Neptune has the **fastest winds in the solar system, ~2100 km/h (~580 m/s), measured by Voyager 2 (1989)** (NASA). Great Dark Spot is **TRANSIENT** (GDS-89 gone by 1994; NDS-2018 at 23°N, Simon et al. 2019). 2 points — flagged sparse.

**Licensing:** all three profiles are NASA/US-Gov or peer-reviewed-catalog measurements. The Barrado-Izagirre CDS catalog is freely available for research reuse (VizieR/CDS); NASA PDS and Voyager data are public domain. Cite the authors as above. No redistribution restriction on the small transcribed numeric values.

**Honesty summary:** Jupiter ships a real dense measured profile; Saturn and Neptune ship documented, individually-cited landmark points with the missing dense data **explicitly flagged** in the JSON `source` strings and `meta.coverage`. No value is invented or interpolated. Per the phase brief, these are measured/climatological averages, never forecasts.

---

## Rejected / flagged items

- **Björn Jónsson Voyager-2 cylindrical maps (Uranus, Neptune) via planetary.org — REJECTED:** licensed **CC BY-NC-ND 3.0** (NonCommercial + NoDerivatives), incompatible with an MIT / potentially-commercial-fork project. No public-domain equirectangular cloud map exists for Uranus or Neptune; Solar System Scope CC-BY-4.0 (stylized) is the only free-and-legal option, clearly labeled illustrative.
- **USGS Astrogeology hosts NO gas-giant cloud-top maps** (verified 2026-07-06). Its "Jupiter" catalog entry is the **Galilean moons'** surfaces. Do not cite USGS for Jupiter/Saturn/Uranus/Neptune atmospheres — use NASA Photojournal / NASA PDS (Cassini) for Jupiter/Saturn.
- **Saturn has no turnkey 2:1 public-domain RGB cloud texture** — the PD Cassini PDS product is single-filter FITS (must be combined into RGB); the ready-made RGB browse PNG is a 1167×875 annotated figure, not a 2:1 texture. Use SSS CC-BY if FITS processing is out of scope.
- **Solar System Scope textures are CC-BY-4.0, not public domain** — attribution ("Solar System Scope, CC-BY-4.0", linked) is a license condition, and they are **artist-tuned** (Uranus/Neptune stylized). Must be labeled illustrative, credited in-app + in a CREDITS/ASSETS file. solarsystemscope.com direct links are Cloudflare-gated; use the Wikimedia Commons mirror URLs.
- **NASA NSSDCA fact-sheet host (`nssdc.gsfc.nasa.gov`) 307-redirects to nasa.gov/nssdc** as of 2026-07-06 (same as Mars). Obliquity/temperature/orbital-period taken from the fact sheet were cross-checked; radius/mass/rotation/a/e are live-verified from JPL SSD and are the primary values.
- **Gas/ice-giant "temperature" is a 1-bar reference level, not a surface temperature** (no solid surface). NSSDC 1-bar temps carry ~1-2 K rounding spread across reproductions (Uranus 76 vs 78 K) — flagged in `constants.json`.
- **Saturn bulk rotation period is uncertain** (no fixed surface to track; System III magnetic period debated) — flagged in `constants.json`.
- **Uranus/Neptune interiors are inferred**, not measured (single Voyager-2 flyby each) — see `PLANETS_PHYSICS.md`; no interior numbers presented as measured.

---

**Verification methodology note:** Texture download URLs, dimensions and license text were read from the official USGS Astrogeology map pages (Mercury, Venus), NASA Science/Photojournal (Jupiter PIA07782), NASA PDS Atmospheres Node (Cassini ISS global maps), and Wikimedia Commons (Solar System Scope, license confirmed via Commons API) — all on 2026-07-06, with live HTTP checks where noted. Physical constants: radius/mass/rotation from JPL SSD phys_par and a/e from JPL SSD approx_pos, both fetched live 2026-07-06; obliquity/temperature/orbital-period from the NASA NSSDCA Planetary Fact Sheet (host redirect flagged, values cross-checked). Saturn ring radii transcribed from the Wikipedia "Rings of Saturn" table (matching the NSSDC Saturnian Rings Fact Sheet) with R_Saturn from JPL. Zonal wind profiles: see §5 for per-body citations. See `docs/PLANETS_PHYSICS.md` for the honest-representation methodology.

---

## Integration log (stretch phase)

Populate at integration time (per the planetary-data-ingestion rule) as the app wires these in.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Physical constants / orrery | `constants.json` (JPL SSD + NASA NSSDC) | `public/data/planets/constants.json`, built by `scripts/planets/build_constants.py` | 9 bodies; giants flagged no-surface / 1-bar temp. |
| Saturn rings (to scale) | `saturn_rings.json` (NASA NSSDCA ring fact sheet + occultation lit.) | `public/data/planets/saturn_rings.json`, built by `scripts/planets/build_saturn_rings.py` | Radii in km + R_Saturn; D→F visible span. |
| Zonal winds (Jupiter/Saturn/Neptune) | `zonal_winds.json` (see §5 citations) | `public/data/planets/zonal_winds.json`, built by `scripts/planets/build_zonal_winds.py` | MEASURED climatological mean, not a forecast. |
| Mercury basemap | USGS/ASU MESSENGER MDIS color 665m (PD) | download → downsample 4096×2048 JPEG → `public/textures/` | Credit NASA/USGS/ASU/MESSENGER. |
| Venus basemap | USGS Magellan C3-MDIR 2025m (PD, radar) | download → downsample → `public/textures/` | Label "radar map" (surface cloud-hidden in visible). |
| Jupiter basemap | NASA Cassini PIA07782 (PD) | download JPG → `public/textures/` | Credit NASA/JPL/SSI; label "snapshot". |
| Saturn basemap | NASA PDS Cassini FITS→RGB (PD) or SSS 4k (CC-BY) | build/download → `public/textures/` | If SSS: credit CC-BY. |
| Uranus/Neptune basemap | Solar System Scope 2k (CC-BY-4.0) | Wikimedia Commons URL → `public/textures/` | Label "stylized/illustrative"; CC-BY credit required. |
| Mercury temp extremes | NSSDC / MESSENGER | `constants.json` → `measured_temp_extremes_C` | Measured; no atmosphere. |
| Venus super-rotation | Venus Express + Akatsuki | `constants.json` → `super_rotation` | Measured cloud-top ~100 m/s, ~4-day. |
