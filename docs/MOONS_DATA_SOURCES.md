# Major Moons Data Sources (Phase 5)

Verification date: **2026-07-08**. All licenses, endpoints, download URLs and physical/orbital constants below were verified on this date against official pages (USGS Astrogeology / Astropedia, NASA JPL Solar System Dynamics, NASA Science, NASA NSSDCA) and/or live HTTP requests (noted per item). Anything that could not be verified from an official source is explicitly flagged. Same rigor and honesty bar as `DATA_SOURCES.md` (Earth), `MARS_DATA_SOURCES.md`, `MOON_DATA_SOURCES.md` and `PLANETS_DATA_SOURCES.md`: real data, real physics, honest claims, everything **free and legally usable** for an MIT open-source app, every source + license logged.

Bodies this phase: **Io, Europa, Ganymede, Callisto** (Jupiter); **Titan, Enceladus, Mimas, Iapetus** (Saturn); **Triton** (Neptune). Earth's Moon has its own tab (Phase 3, `MOON_DATA_SOURCES.md`) and is **not** redone here.

> **Honesty rule for this phase (from the project brief):** most moons have **NO weather**. The honest substance is **orbital mechanics** (they are tidally locked; Io:Europa:Ganymede are in a 1:2:4 orbital resonance; Triton is retrograde) **+ measured phenomena** (volcanism, plumes, oceans, cratering) **+ real textures.** The ONE exception with genuine weather is **Titan** (methane cycle: seas, lakes, rain, rivers) — presented as real. **We invent nothing.** See `docs/MOONS_PHYSICS.md` for the measured/computed/static contract.

## Summary table

| Moon | Parent | Basemap texture (equirectangular) — USGS Astrogeology | Texture license | Coverage caveat | Honest measured signal |
|---|---|---|---|---|---|
| Io | Jupiter | Galileo SSI/Voyager **Color Merge** Mosaic 1km | Public domain, Use: None | ~5° polar gaps interpolated | Most volcanically active body; tidal heating; plumes |
| Europa | Jupiter | Voyager–Galileo SSI Mosaic 500m (**grayscale**) | Access: None, Use: None | Grayscale (no PD global color mosaic) | Subsurface ocean; young/chaos ice; plumes **debated** |
| Ganymede | Jupiter | Voyager–Galileo SSI **Color** Mosaic 1.4km | Public domain, Use: None | — | Largest moon; only moon with intrinsic B-field; ocean |
| Callisto | Jupiter | Voyager–Galileo SSI Mosaic 1km (**grayscale**) | Public domain, Use: None | Grayscale | Most heavily cratered surface; possible deep ocean |
| Titan | Saturn | Cassini **ISS** Global Mosaic 4005m (near-IR 938 nm) | Access: None, Use: cite authors | Haze-obscured surface (near-IR, not visible); 3–5% N-mid-lat gap | **Weather** — N2 atmosphere + methane seas/rain/rivers |
| Enceladus | Saturn | Cassini Global Mosaic 110m | Public domain, Use: cite authors | — | South-polar water plumes → E ring; ocean; brightest body |
| Mimas | Saturn | **none shipped** (USGS has control network only) | n/a | **No turnkey PD global mosaic** | Herschel crater ("Death Star"); possible young ocean (2024) |
| Iapetus | Saturn | Cassini–Voyager Global Mosaic 803m | Public domain, Use: cite authors | Voyager fills poles | Two-tone albedo dichotomy; equatorial ridge |
| Triton | Neptune | Voyager 2 **Color** Mosaic 600m (GlobalFill) | Public domain, Use: cite authors | **Voyager 2 saw one hemisphere only (1989); N-pole gap filled** | Retrograde capture; N2 geysers; ~38 K; cantaloupe terrain |

Committed artifacts (all under `public/data/moons/`): `constants.json`, `phenomena.json`. Build scripts under `scripts/moons/`. No texture is committed to the repo this phase — the URLs below are the download-and-downsample provenance (same pattern as Mars/Moon/planets: never ship the multi-hundred-MB source).

---

## 1. Basemap textures (equirectangular, 2:1) — USGS Astrogeology (public domain)

**The single most important licensing finding of this phase:** for these moons, USGS Astrogeology hosts **canonical, mission-derived, public-domain** global mosaics (Voyager/Galileo for the Galileans; Cassini for the Saturn moons; Voyager 2 for Triton) — the moon equivalent of the Mars/Moon USGS mosaics. **These are the clean, freely-shippable source.** The web-friendly community textures that circulate on Wikimedia Commons / Celestia / DeviantArt (by Askaniy, John van Vliet, **Björn Jónsson**) are derived works with **non-PD or unclear licenses** — and Björn Jónsson's maps are the exact **CC BY-NC-ND** assets we **rejected** in the planets phase. So this phase we ship **only** the USGS PD mosaics, downsampled to ~2048-wide (2048×1024) JPEG, and reject the community textures. See "Rejected / flagged."

All USGS Astrogeology (Astropedia) map pages were fetched live on **2026-07-08**; download URL, pixel dimensions, size, resolution, projection, license and originator are quoted per item. Every mosaic is **Simple Cylindrical / equirectangular**, planetocentric latitude — drops straight into the same texture pipeline as Earth/Mars/Moon.

### 1a. Io — Galileo SSI / Voyager Color Merged Global Mosaic 1km ✅
- **Map page:** https://astrogeology.usgs.gov/search/map/io_galileo_ssi_voyager_color_merged_global_mosaic_1km
- **Download:** `https://planetarymaps.usgs.gov/mosaic/Io_GalileoSSI-Voyager_Global_Mosaic_ClrMerge_1km.tif`
- **11,445 × 5,723 px, 189 MB, 1,000 m/pixel.** **License:** Access Constraints **"public domain,"** Use Constraints **"None."** Originators USGS Astrogeology Science Center / Planetary Data System (Galileo SSI + Voyager 1/2).
- **Coverage caveat:** color lacks imagery within ~5° of both poles; gaps filled by interpolation.

### 1b. Europa — Voyager / Galileo SSI Global Mosaic 500m (grayscale) ✅
- **Map page:** https://astrogeology.usgs.gov/search/map/Europa/Voyager-Galileo/Europa_Voyager_GalileoSSI_global_mosaic_500m
- **Download:** `https://planetarymaps.usgs.gov/mosaic/Europa_Voyager_GalileoSSI_global_mosaic_500m.tif`
- **19,631 × 9,816 px, 184 MB, 500 m/pixel.** **License:** Access **"None,"** Use **"None."** Primary author Tammy Becker; originators Archinal, Colvin, Davies, Gitlin, Kirk, Weller.
- **Caveat:** **grayscale.** No public-domain global **color** Europa mosaic is available turnkey on USGS (the natural/enhanced-color Galileo products exist as per-region observations, not a single 2:1 PD global file). Europa's true color is a subtle tan-white, so a grayscale base is honest; label it "grayscale mosaic."

### 1c. Ganymede — Voyager / Galileo SSI Color Global Mosaic 1.4km ✅
- **Map page:** https://astrogeology.usgs.gov/search/map/ganymede_voyager_galileo_ssi_color_global_mosaic_1_4km
- **Download:** `https://planetarymaps.usgs.gov/mosaic/Ganymede_Voyager_GalileoSSI_Global_ClrMosaic_1435m.tif`
- **11,520 × 5,760 px, 190 MB, 1,435.72 m/pixel.** **License:** Access **"Public domain,"** Use **"None."** USGS Astrogeology Science Center (Voyager 1/2 + Galileo SSI).

### 1d. Callisto — Voyager / Galileo SSI Global Mosaic 1km (grayscale) ✅
- **Map page:** https://astrogeology.usgs.gov/search/map/callisto_galileo_voyager_global_mosaic_1km
- **Download:** `https://planetarymaps.usgs.gov/mosaic/Callisto_Voyager_GalileoSSI_global_mosaic_1km.tif`
- **15,138 × 7,569 px, 110 MB, ~1,000 m/pixel, 8-bit grayscale.** **License:** Access **"public domain,"** Use **"None."** USGS Astrogeology Science Center.
- **Caveat:** grayscale (Callisto is dark and near-neutral in color anyway).

### 1e. Titan — Cassini ISS Global Mosaic 4005m (near-IR, haze-penetrating) ✅ + caveats
- **Map page:** https://astrogeology.usgs.gov/search/map/titan_cassini_iss_global_mosaic_4005m
- **Download:** `https://planetarymaps.usgs.gov/mosaic/Titan_ISS_P19658_Mosaic_Global_4km.tif`
- **4,040 × 2,020 px, 7.8 MB, 4,004.75 m/pixel, Equirectangular.** **License:** Access **"None,"** Use **"Please cite authors."** Originator **NASA/JPL-Caltech/SSI.**
- **Honesty caveats (important):** this is **surface albedo through a 938 nm near-IR haze-penetrating filter**, NOT a visible-light image — Titan's surface is permanently hidden by orange haze in visible light (state this plainly, same posture as Venus' radar map in the planets phase). **Coverage:** "a data gap of about 3 to 5 percent of Titan's surface still remains, located in the northern mid-latitudes on the sub-Saturn hemisphere." Already essentially **2:1 web-friendly (4040×2020, 7.8 MB)** — ships almost as-is (or downsample to 2048×1024).
- **Alternatives (both PD, larger):** Cassini SAR/HiSAR radar mosaic 351m (`Titan_SAR_HiSAR_...`) for a radar look; ISS near-global 450m (`Titan_ISS_Globe_65Sto45N_450M_AvgMos.tif`, 1.5 GB) for detail.

### 1f. Enceladus — Cassini Global Mosaic 110m ✅
- **Map page:** https://astrogeology.usgs.gov/search/map/enceladus_cassini_global_mosaic_110m
- **Download:** `https://planetarymaps.usgs.gov/mosaic/Enceladus_Cassini_mosaic_global_110m.tif`
- **14,401 × 7,201 px, 99 MB, 109.96 m/pixel, Simple Cylindrical.** **License:** Access **"Public domain,"** Use **"Please cite authors."** Originator Cassini Team / JPL / Space Science Institute.
- **Note:** prefer this clean photomosaic over the high-pass-filtered variant `Enceladus_Cassini_ISS_Global_Mosaic_100m_HPF.tif` (15,840 × 7,920, 120 MB) — the HPF version enhances tectonic features but looks unnatural as a globe texture, **and its map page did not print an explicit license line** (flagged below; the clean 110m page does state public domain). A newer Schenk & McKinnon (2024) 100m mosaic exists at `https://asc-astropedia.s3.us-west-2.amazonaws.com/Enceladus/Cassini/Enceladus_Cassini_mosaic_global_100m_schenk2024.tif` (verify its license on the Astropedia page before use).

### 1g. Iapetus — Cassini / Voyager Global Mosaic 803m ✅
- **Map page:** https://astrogeology.usgs.gov/search/map/iapetus_cassini_voyager_global_mosaic_803m
- **Download:** `https://planetarymaps.usgs.gov/mosaic/Iapetus_Cassini_Voyager_mosaic_global_783m.tif`
- **5,760 × 2,880 px, 16 MB, 802.85 m/pixel, Simple Cylindrical.** **License:** Access **"Public domain,"** Use **"Please cite authors."** Originators Space Science Institute / Cassini Team / JPL.
- **Note:** Cassini imagery with **Voyager filling the poles**; the mosaic captures the real **two-tone** (dark leading / bright trailing) coloration — a genuine measured feature. At 5760×2880 / 16 MB it is close to web-friendly.

### 1h. Triton — Voyager 2 Global Color Mosaic 600m (GlobalFill) ✅ + hard coverage caveat
- **Map page:** https://astrogeology.usgs.gov/search/map/triton_voyager_2_global_color_mosaic_600m
- **Download:** `https://planetarymaps.usgs.gov/mosaic/Triton_Voyager2_ClrMosaic_GlobalFill_600m.tif`
- **14,138 × 7,069 px, 287 MB, 600 m/pixel, Equirectangular.** **License:** Access **"public domain,"** Use **"Please cite authors."** Originator NASA / JPL / **Dr. Paul Schenk.**
- **CRITICAL coverage caveat:** Triton was imaged by **Voyager 2 on a single flyby (August 1989)**, which saw **only one hemisphere** at usable resolution; there is a **"Large gap at the north pole,"** and the "GlobalFill" version fills gaps with neighboring pixels. **This is a genuinely partial map** — label it "Voyager 2, one hemisphere (1989); polar/far-side coverage interpolated." Do not present it as a complete global observation.

### 1i. Mimas — no turnkey public-domain global mosaic ⚠️ (flagged)
- USGS Astrogeology has a **Mimas Voyager Image Control Network** (https://astrogeology.usgs.gov/search/map/mimas_voyager_image_control_network) but **no ready 2:1 global photomosaic** was found on Astropedia (2026-07-08). The clean community Mimas maps (e.g. Paul Schenk enhanced-color via Wikimedia/Celestia) are **derived works whose reuse license is not cleanly public domain** — rejected on the same grounds as the other community textures.
- **Decision:** Mimas is **included in `constants.json` + `phenomena.json`** (its JPL/NSSDCA data are solid, and the Herschel crater is a great showable fact) but is **NOT a shipped-texture body** this phase. Flagged for a future phase if a PD Mimas global mosaic is published.

**Recommendation for the globe:** ship the eight verified USGS PD mosaics (Io color, Europa grayscale, Ganymede color, Callisto grayscale, Titan near-IR, Enceladus, Iapetus, Triton), each **downsampled to 2048×1024 JPEG** into `public/textures/` at integration time, with the honesty labels above (Titan = near-IR/haze; Triton = one hemisphere/1989; Europa & Callisto = grayscale). Credit "NASA / JPL / USGS Astrogeology" (+ SSI for Cassini, + P. Schenk for Triton), and "cite authors" where required. No live tile service exists or is needed — these surfaces do not change on human timescales.

---

## 2. Measured phenomena (honestly showable) — per moon, with instrument/mission

Only genuinely **measured / observed** signals are listed; each is source-tagged in `public/data/moons/phenomena.json`. Debated items are flagged. Verified 2026-07-08 against NASA Science, JPL, and the peer-reviewed literature.

### 2a. Io — most volcanically active body in the solar system (MEASURED)
- **~400 volcanic centres estimated, >150 observed actively erupting** (NASA/JPL; Galileo/Voyager/Juno + ground-based).
- **Tidal heating:** global heat output **~10¹⁴ W (~2 W/m² average, ~40× Earth's)** — Veeder et al. 2012, Icarus. Powered by the 1:2:4 Laplace resonance forcing.
- **Plume heights:** Pele **~390 km**, Tvashtar **~385 km** (Galileo / New Horizons imaging, ±~30 km).
- **Hotspot temps:** up to **~1300–1600 K** at active silicate lava vents (Galileo NIMS / Juno JIRAM) vs ~110 K background.

### 2b. Europa — subsurface ocean under young ice (MEASURED; plumes DEBATED)
- **Subsurface salt-water ocean:** Kivelson et al. 2000, Science — the **Galileo-measured Jupiter-induced magnetic field** requires a near-surface conductor (salty liquid). NASA: may hold **~2× Earth's ocean water.**
- **Young surface, few craters** (age ~40–90 Myr; Galileo crater counts) and **chaos terrain** (broken/rotated ice blocks) → an active ice shell.
- **Plumes: DEBATED** — Roth et al. 2014 and Sparks et al. 2016–2017 (HST) reported possible water-vapour plumes, **not confirmed/repeatable.** Flagged `status:"debated"`; Europa Clipper (launched 2024-10-14) is designed to settle it.

### 2c. Ganymede — largest moon; only moon with an intrinsic magnetic field (MEASURED)
- **Largest moon in the solar system** (mean radius **2631 km > Mercury**) — NASA/JPL.
- **Only moon with an intrinsic (internal-dynamo) magnetic field** — Kivelson et al. 1996, Nature (Galileo); produces polar auroras.
- **Subsurface salt-water ocean** — Saur et al. 2015, JGR (HST auroral-oscillation constraint) + Galileo.

### 2d. Callisto — among the oldest, most heavily cratered surfaces (MEASURED)
- **Most heavily cratered object in the solar system** (NASA/JPL) — an ancient, saturated, geologically dead surface.
- **Possible deep briny layer** — Zimmer et al. 2000, Icarus (Galileo induced field); deep and unconfirmed → `status:"possible"`.

### 2e. Titan — the one moon with real weather (MEASURED)
- **Thick N2 atmosphere:** surface pressure **1.45 atm (146.7 kPa)**, ~50% denser than Earth's; **~98.4% N2**, ~1.4% CH4 — Huygens HASI, Fulchignoni et al. 2005, Nature 438, 785.
- **Surface temperature 93.7 K (−179.5 °C)** — Huygens.
- **Active methane cycle:** clouds, **rain, rivers, lakes and seas** of liquid methane/ethane — the only world besides Earth with standing surface liquid and genuine weather (Cassini/Huygens).
- **Seas (Cassini RADAR):** **Kraken Mare** (largest), **Ligeia Mare** (2nd), **Punga Mare** (3rd) — together ~80% of Titan's sea+lake area (~691,000 km²).

### 2f. Enceladus — south-polar plumes feeding Saturn's E ring (MEASURED)
- **100+ water-vapour/ice jets** from the four south-polar **"tiger stripe" fractures** (Alexandria, Cairo, Baghdad, Damascus) — Porco et al. 2006, Science (Cassini).
- **Plume feeds Saturn's E ring** (Enceladus orbits within it) — Spahn et al. 2006 / Kempf et al. (Cassini CDA).
- **Global subsurface salt-water ocean** — Cassini gravity + libration (Iess et al. 2014; Thomas et al. 2016); grains carry salts + silica (hydrothermal chemistry).
- **Brightest body in the solar system:** geometric albedo **1.375** at 550 nm (Verbiscer et al. 2007, Science); Bond albedo ~0.81.

### 2g. Mimas — the "Death Star" moon (MEASURED)
- **Herschel crater 139 km** across (~1/3 of Mimas' diameter), ~6 km central peak — NASA/JPL (Cassini/Voyager).
- **Possible young subsurface ocean** — Lainey et al. 2024, Nature (orbital-libration analysis); **recent** result → `status:"recent/debated"`.

### 2h. Iapetus — two-tone albedo dichotomy + equatorial ridge (MEASURED)
- **Two-tone albedo:** dark leading hemisphere ("Cassini Regio," geometric albedo **0.03–0.05**) vs bright trailing hemisphere (**0.5–0.6**) — a thermal-runaway ice-migration dichotomy (NASA/Cassini). Daytime: dark side ~129 K, bright ~113 K.
- **Equatorial ridge** ~1,300 km long, up to ~20 km high (Porco et al. 2005 / Ip 2006) — the "walnut" shape.

### 2i. Triton — retrograde captured world with N2 geysers (MEASURED)
- **Retrograde orbit** (i = **157.3°** > 90°) → almost certainly a **captured Kuiper-belt object** (JPL SSD; NASA).
- **Active nitrogen geysers:** ≥4 seen by **Voyager 2 (1989)** venting N2 + dark dust **~8 km high**, drifting >100 km downwind — Smith et al. 1989 / Soderblom et al. 1990.
- **Thin N2 atmosphere:** surface pressure **~1.4 Pa (~14 µbar)**, ~1/70,000 of Earth's — Broadfoot et al. 1989.
- **Surface ~38 K (−235 °C)** — among the coldest measured in the solar system (Voyager 2; Tyler/Broadfoot 1989).
- **Cantaloupe terrain** — unique dimpled terrain, likely icy diapirism (Soderblom et al. 1990).

---

## 3. Physical + orbital constants — `constants.json`

**Verified live 2026-07-08.** Built reproducibly by `scripts/moons/build_constants.py`; committed as `public/data/moons/constants.json`.

**Field provenance (each group tagged in the JSON):**
- **GM (km³/s²), mean radius (km), mean density (g/cm³)** → **JPL SSD — Planetary Satellite Physical Parameters**, https://ssd.jpl.nasa.gov/sats/phys_par/ (fetched live 2026-07-08). Per-system ephemeris solutions cited on the page (JUP365, SAT441, NEP097, …). **`mass_kg` is DERIVED** from GM: `mass = GM·1e9 / G`, `G = 6.67430e-11` (CODATA 2018). (All derived masses match the standard published masses to ≤0.1%: Io 8.93×10²², Titan 1.345×10²³, Enceladus 1.08×10²⁰, Triton 2.14×10²² kg, etc.)
- **Semi-major axis a (km, from the PARENT planet), orbital period P (days), eccentricity e, inclination i (deg)** → **JPL SSD — Planetary Satellite Mean Orbital Parameters**, https://ssd.jpl.nasa.gov/sats/elem/ (fetched live 2026-07-08), **epoch 2000-01-01.5 (J2000).** **IMPORTANT frame note:** JPL's mean elements are referred to each satellite's **local Laplace plane**, NOT the ecliptic — hence the small inclinations for the regular moons and **i = 157.3°** (retrograde) for Triton. Stored as given, with the frame flagged in the JSON.
- **Geometric albedo, Bond albedo, mean surface temperature (K), temp range** → **NASA NSSDCA satellite fact sheets** (D. R. Williams), https://nssdc.gsfc.nasa.gov/planetary/factsheet/ (jovian/saturnian/neptunian sat fact). **Flag:** the `nssdc.gsfc.nasa.gov` host **307-redirects to nasa.gov/nssdc** (verified 2026-07-08 — identical to the Mars and planets phases), so values were **cross-checked against the Wikipedia infoboxes** (which cite the same primary sources) on 2026-07-08. **Primary-literature values:** Enceladus geometric albedo **1.375** and Mimas **0.962** from **Verbiscer et al. 2007, Science 315, 815**; Titan **93.7 K / 1.45 bar** from **Huygens HASI (Fulchignoni et al. 2005)**; Triton **38 K** from **Voyager 2 (1989)**; Iapetus two-tone albedo and Callisto temps from NSSDCA/Cassini.

**Tidal locking & resonance (baked into the JSON):**
- **All nine moons are in synchronous rotation (tidally locked):** `tidally_locked: true`, `rotation_period_days == orbital_period_days`. Same face to the parent (Wikipedia/NSSDCA confirm "synchronous" for each; cross-checked 2026-07-08).
- **Io:Europa:Ganymede are in the 1:2:4 Laplace mean-motion resonance** (periods ~1.769 : 3.551 : 7.155 d). Tagged per body + in a top-level `resonances` block. This forced eccentricity is the **energy source** for Io's volcanism and Europa's/Ganymede's oceans (see `MOONS_PHYSICS.md`).
- **Triton:** `retrograde_orbit: true` (i = 157.3°).

**Verified constants (transcribed from the two JPL SSD pages, 2026-07-08):**

| Moon | Parent | Mean R (km) | GM (km³/s²) | a from parent (km) | Period (d) | e | i (deg) | Geom. albedo | Mean T (K) |
|---|---|---|---|---|---|---|---|---|---|
| Io | Jupiter | 1821.49 | 5959.915 | 421,800 | 1.762732 | 0.004 | 0.0 | 0.63 | 110 |
| Europa | Jupiter | 1560.80 | 3202.712 | 671,100 | 3.525463 | 0.009 | 0.5 | 0.67 | 102 |
| Ganymede | Jupiter | 2631.20 | 9887.833 | 1,070,400 | 7.155588 | 0.001 | 0.2 | 0.43 | 110 |
| Callisto | Jupiter | 2410.30 | 7179.283 | 1,882,700 | 16.690440 | 0.007 | 0.3 | 0.22 | 134 |
| Titan | Saturn | 2574.76 | 8978.137 | 1,221,900 | 15.945448 | 0.029 | 0.3 | 0.22¹ | 93.7 |
| Enceladus | Saturn | 252.10 | 7.21037 | 238,400 | 1.370218 | 0.005 | 0.0 | 1.375² | 75 |
| Mimas | Saturn | 198.20 | 2.50349 | 186,000 | 0.942422 | 0.020 | 1.6 | 0.962² | 64 |
| Iapetus | Saturn | 734.30 | 120.5151 | 3,561,700 | 79.331002 | 0.028 | 7.6 | 0.03–0.05 / 0.5–0.6³ | ~115 |
| Triton | Neptune | 1352.60 | 1428.495 | 354,800 | 5.876994 | 0.000 | 157.3⁴ | 0.7 | 38 |

¹ Titan albedo is disk-integrated (visible surface haze-obscured). ² Verbiscer et al. 2007 (Enceladus 1.375 exceeds 1 — physical for strong backscatter; Bond ~0.81). ³ Iapetus: dark leading / bright trailing (two-value dichotomy, the honest showable feature). ⁴ i > 90° = retrograde (captured object).

---

## Technical answers

### Best moon base textures, and what ships
Ship the **USGS Astrogeology public-domain global mosaics** listed in §1, each downsampled to **2048×1024 JPEG**. They are equirectangular 2:1 and drop into the same pipeline as Earth/Mars/Moon. Titan (near-IR 938 nm) and Triton (Voyager-2, one hemisphere, 1989) carry mandatory honesty labels; Europa and Callisto are grayscale. Mimas has no turnkey PD global mosaic → not shipped. **Never ship the multi-hundred-MB source** (Io 189 MB, Ganymede 190 MB, Callisto 110 MB, Triton 287 MB, Enceladus 99 MB, Europa 184 MB) — downsample first. Titan (7.8 MB) and Iapetus (16 MB) are close to web-friendly already.

### Is there a "live imagery" service (a GIBS for moons)?
No, and none is needed. These surfaces do not change on human timescales, so static mosaics are correct. The honest "dynamic" content is: **measured phenomena** (§2), **computed orbital mechanics** (tidal locking, the 1:2:4 resonance, Triton's retrograde orbit — see `MOONS_PHYSICS.md`), and, uniquely, **Titan's measured methane weather.**

### Anything problematic for an MIT-licensed open-source repo?
One thing to actively avoid, otherwise clean:
1. **Reject the community-derived Wikimedia/Celestia moon textures** (Askaniy, John van Vliet, **Björn Jónsson**). Björn Jónsson's maps are **CC BY-NC-ND** — the exact assets rejected in the planets phase (NonCommercial + NoDerivatives, incompatible with a forkable/commercial MIT app). Ship only the USGS PD mosaics (§1).
2. **USGS "Please cite authors"** (Titan, Enceladus, Iapetus, Triton) is a courtesy citation, not a redistribution restriction — public domain. Credit "NASA / JPL / USGS Astrogeology" (+ SSI, + P. Schenk for Triton). No CC-BY-SA-style obligation anywhere this phase (unlike Mars' Montabone dust or the planets' Solar System Scope textures).

Everything else — JPL SSD constants (US-Gov public data), NSSDCA (public domain), and all USGS mosaics (public domain) — is maximally permissive.

---

## Rejected / flagged items

- **Community moon textures (Wikimedia Commons / Celestia / DeviantArt) — REJECTED.** The circulating web-friendly maps for these moons are derived works by Askaniy, John van Vliet and **Björn Jónsson**; licenses are non-PD or unclear, and **Björn Jónsson's are CC BY-NC-ND** (already rejected for Uranus/Neptune in the planets phase). Use the USGS PD mosaics instead.
- **Mimas — no turnkey public-domain global mosaic on USGS** (control network only, verified 2026-07-08). Included in constants/phenomena (data solid) but **not shipped as a texture.** Re-check Astropedia in a future phase.
- **Titan basemap is near-IR (938 nm), not visible light** — the surface is permanently haze-obscured in visible light. The shipped texture is a haze-penetrating IR albedo map (+ a SAR radar alternative). Must be labeled as such (same posture as Venus' radar map). Plus a **3–5% coverage gap** in the northern mid-latitude sub-Saturn hemisphere.
- **Triton is a partial map** — Voyager 2 imaged **one hemisphere** on a single 1989 flyby; the "GlobalFill" mosaic interpolates a **large north-pole gap.** Label "one hemisphere, 1989; polar/far-side interpolated." Do not present as complete.
- **Europa & Callisto USGS global mosaics are grayscale** — no turnkey PD global **color** mosaic exists. Ship grayscale, labeled (honest — both moons are near-neutral in color).
- **Enceladus HPF mosaic page prints no explicit license line** (verified 2026-07-08). Use the **clean 110m mosaic** page instead, which states "Public domain / Please cite authors." Public-domain status is the standard USGS/NASA policy regardless.
- **NSSDCA fact-sheet host (`nssdc.gsfc.nasa.gov`) 307-redirects to nasa.gov/nssdc** (verified 2026-07-08) — same as Mars/planets. Albedo/temperature values were cross-checked against Wikipedia infoboxes (which cite the same primaries) and, for Enceladus/Mimas albedo and Titan/Triton temps, against the primary literature.
- **JPL orbital inclinations are Laplace-plane, not ecliptic** — do not mix frames. Small i for regular moons; Triton 157.3° = retrograde. Flagged in `constants.json`.
- **Enceladus geometric albedo 1.375 exceeds 1** — physical for strong ice backscatter; do not "correct" it to ≤1. Bond albedo (~0.81) is the ≤1 quantity. Both stored.

---

## Produced artifacts (this phase)

**`public/data/moons/constants.json`** (~10.1 KB) — built by `scripts/moons/build_constants.py`. Physical (GM/radius/density/derived-mass) + orbital (a/P/e/i, J2000, Laplace-plane) constants for all 9 moons, each field group source-tagged; `tidally_locked`, `rotation_period_days`, `geometric_albedo`(+`bond_albedo`), `mean_temp_K`(+`temp_range_K`), `retrograde_orbit`, and a `resonances` block for the 1:2:4 Laplace resonance.

**`public/data/moons/phenomena.json`** (~8.4 KB) — built by `scripts/moons/build_phenomena.py`. Per-moon `headline`, a `weather` boolean (**true only for Titan**), and a `facts` map where **every fact carries its own `source`** (instrument/mission + citation). Debated items carry `status:"debated"/"possible"/"recent"`.

Total committed **~18.5 KB** (< the ~150 KB budget). No texture committed (download-and-downsample provenance only). Both scripts are pure-stdlib Python, deterministic, and print a per-moon verification summary on run.

---

**Verification methodology note:** All USGS Astrogeology map pages (§1) were fetched live on 2026-07-08; download URL, pixel dimensions, file size, resolution, projection, license (Access/Use Constraints) and originator were read directly from each page. Physical constants (GM, mean radius, density) were read from the live JPL SSD Planetary Satellite Physical Parameters table, and orbital elements (a, P, e, i, epoch J2000, Laplace-plane frame) from the live JPL SSD Planetary Satellite Mean Orbital Parameters table (both 2026-07-08). Geometric albedo and surface temperatures were taken from NASA NSSDCA satellite fact sheets (host-redirect flagged) and cross-checked against Wikipedia infoboxes + primary literature (Verbiscer 2007; Huygens/Fulchignoni 2005; Voyager 2/Broadfoot 1989). Phenomena numbers were verified against NASA Science pages and the cited peer-reviewed sources. See `docs/MOONS_PHYSICS.md` for the honest-representation methodology.

---

## Phase 5 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app wires these in.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Physical + orbital constants / orrery | `constants.json` (JPL SSD phys_par + elem; NSSDCA/lit albedo+temp) | `public/data/moons/constants.json`, built by `scripts/moons/build_constants.py` | 9 moons; all tidally locked; Io:Europa:Ganymede 1:2:4; Triton retrograde. |
| Measured-phenomena HUD | `phenomena.json` (per-fact cited) | `public/data/moons/phenomena.json`, built by `scripts/moons/build_phenomena.py` | `weather:true` only for Titan; debated items flagged. |
| Io basemap | USGS Galileo/Voyager Color Merge 1km (PD) | download → downsample 2048×1024 JPEG → `public/textures/` | Credit NASA/JPL/USGS. ~5° polar gaps interpolated. |
| Europa basemap | USGS Voyager–Galileo 500m (PD, grayscale) | download → downsample → `public/textures/` | Label "grayscale". |
| Ganymede basemap | USGS Voyager–Galileo Color 1.4km (PD) | download → downsample → `public/textures/` | Credit NASA/JPL/USGS. |
| Callisto basemap | USGS Voyager–Galileo 1km (PD, grayscale) | download → downsample → `public/textures/` | Label "grayscale". |
| Titan basemap | USGS Cassini ISS 4005m near-IR (PD, cite authors) | download → (7.8 MB, ~2:1) → `public/textures/` | Label "near-IR, haze-penetrating; surface not visible-light; 3–5% N-mid-lat gap". |
| Enceladus basemap | USGS Cassini 110m (PD, cite authors) | download → downsample → `public/textures/` | Prefer clean over HPF. |
| Iapetus basemap | USGS Cassini–Voyager 803m (PD, cite authors) | download → downsample → `public/textures/` | Two-tone; Voyager poles. |
| Triton basemap | USGS Voyager 2 Color 600m GlobalFill (PD, cite authors + P. Schenk) | download → downsample → `public/textures/` | Label "one hemisphere, 1989; N-pole interpolated". |
| Mimas basemap | none | — | No turnkey PD global mosaic; constants/phenomena only. |
| Orbital mechanics (tidal locking, 1:2:4 resonance, Triton retrograde, phases about parent) | Kepler + `constants.json` | computed client-side (owned by another agent) | See `MOONS_PHYSICS.md`; no runtime API. |
