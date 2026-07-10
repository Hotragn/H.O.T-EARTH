# Dwarf Planets Data Sources (Phase 6)

Verification date: **2026-07-10**. All licenses, endpoints, download URLs and physical/orbital constants below were verified on this date against official pages (USGS Astrogeology / Astropedia, NASA Science dwarf-planet pages, NASA New Horizons & Dawn mission results, NASA JPL Solar System Dynamics Small-Body Database) and peer-reviewed stellar-occultation / photometry literature, and/or live HTTP requests (noted per item). Anything that could not be verified from an official source is explicitly flagged. Same rigor and honesty bar as `DATA_SOURCES.md` (Earth), `MARS_DATA_SOURCES.md`, `MOON_DATA_SOURCES.md`, `PLANETS_DATA_SOURCES.md` and `MOONS_DATA_SOURCES.md`: real data, real physics, honest claims, everything **free and legally usable** for an MIT open-source app, every source + license logged.

Bodies this phase: the five IAU dwarf planets **Pluto, Ceres, Eris, Haumea, Makemake**, plus Pluto's large moon **Charon**.

> **Honesty rule for this phase (from the project brief):** dwarf planets have **NO weather** — no global atmosphere driving wind/clouds/rain/storms, and we invent none. The honest substance is **orbital mechanics (COMPUTED) + measured physical facts + real textures WHERE THEY EXIST.** The single most important constraint of this phase: **only Pluto/Charon (New Horizons, 2015) and Ceres (Dawn, 2015–2018) have been imaged up close — they have real surface maps. Eris, Haumea and Makemake have NEVER been visited; there are NO surface maps.** Those three must be rendered as **clearly-labeled illustrative spheres**, never implying real imagery. We invent nothing. See `docs/DWARF_PLANETS_PHYSICS.md` for the measured/computed/illustrative contract.

## Summary table

| Body | Imaged? | Basemap texture (equirectangular) | Texture license | What's honestly showable |
|---|---|---|---|---|
| **Pluto** | ✅ New Horizons 2015 | USGS New Horizons LORRI–MVIC Global Mosaic 300m | Access: None, Use: cite authors (public domain) | Real map (encounter hemisphere hi-res, far side low-res); N2 glaciers, haze atmosphere, tholins |
| **Charon** | ✅ New Horizons 2015 | USGS New Horizons LORRI–MVIC Global Mosaic 300m | Access: None, Use: cite authors (public domain) | Real map; Mordor Macula, canyons, binary with Pluto |
| **Ceres** | ✅ Dawn 2015–18 | USGS Dawn FC Global Mosaic 140m (clear-filter, near-grayscale) | Access: None, Use: cite authors (public domain) | Real map; Occator salt spots, Ahuna Mons, subsurface brine |
| **Eris** | ❌ never visited | **NONE — no map exists** | n/a → illustrative sphere | Most massive dwarf; albedo 0.96; Dysnomia; occultation facts only |
| **Haumea** | ❌ never visited | **NONE — no map exists** | n/a → illustrative sphere | Triaxial shape + ring + 2 moons + fast spin (real geometry, no surface) |
| **Makemake** | ❌ never visited | **NONE — no map exists** | n/a → illustrative sphere | Methane ice; no atmosphere; 1 moon; occultation facts only |

Committed artifacts (both under `public/data/dwarf-planets/`): `constants.json`, `phenomena.json`. Build scripts under `scripts/dwarf-planets/`. **No texture is committed** to the repo this phase — the URLs below are the download-and-downsample provenance for the three imaged bodies (same pattern as Mars/Moon/planets/moons: never ship the multi-hundred-MB source). Eris/Haumea/Makemake ship **no** texture (there is nothing real to ship).

---

## 1. Basemap textures (equirectangular, 2:1)

### The licensing landscape (the defining fact of this phase)

There are **two** texture situations, split cleanly by whether a spacecraft has been there:

1. **Pluto, Charon, Ceres — REAL public-domain mission mosaics on USGS Astrogeology.** New Horizons (Pluto/Charon, 2015 flyby) and Dawn (Ceres, 2015–2018 orbiter) produced canonical global mosaics that USGS hosts as **public-domain** GeoTIFFs — the dwarf-planet equivalent of the Mars/Moon/moons USGS mosaics. These are the clean, freely-shippable source. Downsample to ~2048-wide JPEG for shipping.
2. **Eris, Haumea, Makemake — NO map exists.** These three have **never been visited or imaged up close.** Everything known about their size/shape/albedo comes from **stellar occultations and photometry**, not pictures. **USGS Astrogeology hosts nothing for them** (verified 2026-07-10 — they are absent from Astropedia). The honest default is a **plain tinted sphere** (see §1e). We ship no texture.

All USGS Astrogeology (Astropedia) map pages were fetched live on **2026-07-10**; download URL, pixel dimensions, size, resolution, projection, license (Access/Use Constraints) and originator are quoted per item. Every mosaic is **Simple Cylindrical / equirectangular** and drops straight into the same texture pipeline as Earth/Mars/Moon/moons.

### 1a. Pluto — USGS New Horizons LORRI–MVIC Global Mosaic 300m ✅ (public domain)
- **Map page:** https://astrogeology.usgs.gov/search/map/pluto_new_horizons_lorri_mvic_global_mosaic_300m (verified 2026-07-10)
- **Download URL (verified on page):** `https://planetarymaps.usgs.gov/mosaic/Pluto_NewHorizons_Global_Mosaic_300m_Jul2017_8bit.tif`
- **24,888 × 12,444 px, 296 MB, 300 m/pixel, Simple Cylindrical.** → downsample to 2048×1024 JPEG.
- **License:** Access Constraints **"None,"** Use Constraints **"Please cite authors."** → public domain, courtesy citation.
- **Originator / credit:** **NASA, Johns Hopkins University Applied Physics Laboratory, Southwest Research Institute, Lunar and Planetary Institute.** Credit "NASA / JHU-APL / SwRI / LPI / USGS Astrogeology."
- **CRITICAL coverage caveat:** New Horizons was a **flyby** (closest approach 2015-07-14), and Pluto rotates once every 6.4 days, so the spacecraft imaged the **encounter hemisphere** (the Tombaugh Regio "heart" / Sputnik Planitia side, ~180°E) at high resolution, while the **opposite hemisphere** was seen only at **much lower resolution** from approach images taken days earlier. The global mosaic covers the whole surface but with **strongly varying resolution** — label it "high-res encounter hemisphere; far side low-res." Do not present the far side as high-fidelity.
- **Colour note:** this 300m global mosaic is the **panchromatic (grayscale) LORRI–MVIC merge.** Pluto's famous reddish tholin colouring lives in the separate MVIC **enhanced-colour** products (also NASA public domain, e.g. NASA Photojournal PIA19952/PIA19708). For a realistic-colour globe, use the MVIC colour hemisphere over the grayscale base; both are PD. The grayscale mosaic alone is honest (like the moons-phase grayscale Europa/Callisto).

### 1b. Charon — USGS New Horizons LORRI–MVIC Global Mosaic 300m ✅ (public domain)
- **Map page:** https://astrogeology.usgs.gov/search/map/charon_new_horizons_lorri_mvic_global_mosaic_300m (verified 2026-07-10)
- **Download URL (verified on page):** `https://planetarymaps.usgs.gov/mosaic/Charon_NewHorizons_Global_Mosaic_300m_Jul2017_8bit.tif`
- **12,693 × 6,347 px, 77 MB, 300 m/pixel, Simple Cylindrical.** → downsample to 2048×1024 JPEG.
- **License:** Access **"None,"** Use **"Please cite authors."** → public domain.
- **Originator / credit:** same as Pluto (NASA / JHU-APL / SwRI / LPI).
- **Coverage:** same flyby geometry as Pluto (encounter hemisphere best; far side lower-res). The mosaic captures the real dark reddish north polar cap (**Mordor Macula**) and the giant equatorial canyon system. Panchromatic (grayscale) merge; colour available separately (PD).

### 1c. Ceres — USGS Dawn FC Global Mosaic 140m ✅ (public domain)
- **Map page:** https://astrogeology.usgs.gov/search/map/ceres_dawn_fc_global_mosaic_140m (verified 2026-07-10)
- **Product name / download:** `Ceres_Dawn_FC_DLR_global_59ppd_Feb2016`. **21,093 × 10,546 px, 214 MB, 140 m/pixel, Simple Cylindrical.** → downsample to 2048×1024 JPEG.
- **License:** Access **"None,"** Use **"Please cite authors."** → public domain.
- **Originator / credit:** **NASA/JPL-Caltech/UCLA/MPS/DLR/IDA** (Dawn Framing Camera; DLR-produced mosaic).
- **Colour note:** the FC global mosaic is the **clear-filter (panchromatic, near-grayscale)** photometrically-corrected product. That is honest: real Ceres is a **dark, near-neutral gray** world (geometric albedo ~0.09), so a grayscale base looks correct. A **400m** version (`ceres_dawn_fc_global_mosaic_400m`) exists (smaller); colourised shaded-relief and enhanced-colour HAMO products are also on Astropedia (same PD terms) if a tinted look is wanted — but the bright Occator spots are the only strongly non-gray feature.
- **Download-URL flag:** unlike Pluto/Charon (whose `planetarymaps.usgs.gov/mosaic/…8bit.tif` links were read directly off the page), the Ceres page surfaced its GeoTIFF through the **Astropedia CKAN download** rather than an obvious `planetarymaps.usgs.gov` path. Take the exact GeoTIFF link from the map page's Download section at integration time (browse/sample JPGs are served from `astrogeology.usgs.gov/ckan/dataset/…`). Higher-res LAMO mosaics (35 m/px, v2) are at the PDS Small Bodies Node: https://sbn.psi.edu/pds/resource/dawn/dwncfcmosaics.html.

### 1d. Eris, Haumea, Makemake — NO real global map exists ❌ (confirmed)
- **Confirmed 2026-07-10:** none of the three has ever been visited or imaged up close by a spacecraft. **USGS Astrogeology / Astropedia hosts no mosaic for any of them** (they are absent from the catalog — only bodies that have been imaged appear). Their size, shape and albedo come entirely from **stellar occultations** (Sicardy et al. 2011 for Eris; Ortiz et al. 2017 for Haumea; Ortiz et al. 2012 for Makemake) and **rotational photometry**. There is **no surface map to obtain, at any license.**
- **State this explicitly in the UI.** Any rendered surface for these three is **not an observation.**

### 1e. Illustrative rendering for the un-imaged three (recommendation)
- **Honest default (recommended): a plain tinted sphere** using each body's *measured* colour/albedo — no fake surface detail:
  - **Eris** — bright, nearly white/neutral (geometric albedo ~0.96, fresh methane frost).
  - **Haumea** — bright white (crystalline water ice, albedo ~0.51), rendered as the **real triaxial ellipsoid** (~2100 × 1680 × 1074 km) with its **ring** — the *shape and ring are real, measured geometry*; only the surface texture is absent.
  - **Makemake** — bright with a reddish tinge (methane ice + tholins, albedo ~0.82).
- **If a decorative/illustrative texture is desired anyway:** it must be **CC-compatible for an MIT / potentially-commercial-fork project — i.e. NOT NonCommercial (NC) and NOT NoDerivatives (ND).** Reject any NC/ND artist map exactly as we rejected the Björn Jónsson Voyager maps for Uranus/Neptune (planets phase) and the community moon textures (moons phase). Solar System Scope (**CC-BY-4.0**) publishes artist textures for some dwarf planets; if one is used it is legal **only with the required attribution** (`Textures by Solar System Scope, CC BY 4.0`, linked) **and** a mandatory **"illustrative / not an observation"** label. **The honest default remains the plain tinted sphere** — prefer it.

**Recommendation for the globe:** ship the three USGS public-domain mosaics (Pluto, Charon, Ceres) downsampled to 2048×1024 JPEG into `public/textures/` at integration time, with the honesty labels above (Pluto/Charon = "encounter hemisphere hi-res, far side low-res, grayscale merge"; Ceres = "clear-filter near-grayscale"). Credit "NASA / JHU-APL / SwRI / LPI / USGS Astrogeology" (Pluto/Charon) and "NASA/JPL-Caltech/UCLA/MPS/DLR/IDA" (Ceres). Render **Eris, Haumea, Makemake as clearly-labeled illustrative tinted spheres** (Haumea as its real triaxial+ring geometry) — **no texture shipped.** No live tile service exists or is needed; these surfaces do not change on human timescales.

---

## 2. Measured / standout phenomena (honestly showable) — per body, with instrument/mission

Only genuinely **measured / observed** facts are listed; each is source-tagged in `public/data/dwarf-planets/phenomena.json`. **No weather anywhere** (dwarf planets have none). Facts for the un-imaged three come from occultations/photometry, not imaging. Verified 2026-07-10 against NASA Science, mission results and the peer-reviewed literature.

### 2a. Pluto — nitrogen glaciers, hazy atmosphere, tholins (MEASURED, New Horizons 2015)
- **Surface ices:** N2 (dominant) + CH4 + CO ices — Stern et al. 2015, Science 350.
- **Sputnik Planitia:** convecting, actively flowing **nitrogen-ice glaciers** filling a ~1000 km basin — the **left lobe of Tombaugh Regio** (the bright "heart") — Moore et al. 2016 / McKinnon et al. 2016.
- **Atmosphere:** thin **N2 atmosphere** (surface ~1 Pa / ~10 µbar) with **~20+ stacked photochemical haze layers** — Gladstone et al. 2016, Science.
- **Reddish tholins** colouring the surface (darkest in Cthulhu Macula) — New Horizons.
- **Surface ~44 K** (NASA average −232 °C) — New Horizons / Stern et al. 2015.
- **5 moons** (Charon, Nix, Hydra, Kerberos, Styx); **3:2 resonance** with Neptune (orbit crosses Neptune's, never approaches) — NASA/JPL.

### 2b. Charon — Mordor Macula, canyons, binary partner (MEASURED, New Horizons 2015)
- **Mordor Macula:** dark **reddish north polar cap** of tholins formed from Pluto's escaping atmospheric gases cold-trapped at Charon's pole — Grundy et al. 2016, Nature 539.
- **Giant canyons:** Serenity Chasma (equatorial belt >1000 km) and Argo Chasma (potentially ~9 km deep) — New Horizons/NASA.
- **Mutually tidally locked** with Pluto (each keeps one face to the other) — NASA.
- **Binary system:** the **Pluto–Charon barycenter lies OUTSIDE Pluto** (~2110 km from Pluto's centre > Pluto's 1188 km radius) — Brozović et al. 2015 / New Horizons. Charon is ~12.2% of Pluto's mass.

### 2c. Ceres — Occator salt spots, Ahuna Mons, subsurface brine (MEASURED, Dawn 2015–18)
- **Occator bright spots:** **sodium-carbonate salt deposits** left by briny water that reached the surface and sublimated — Nathues et al. 2015 (discovery), De Sanctis et al. 2016, Nature (composition).
- **Ahuna Mons:** a young **cryovolcano** (~4 km high, ~17 km wide) — Ruesch et al. 2016, Science.
- **Possible subsurface brine reservoir** feeding the recent salts — Dawn extended mission (2020, Nature Astronomy).
- **~9.07 h rotation**; largest asteroid-belt object (~25% of the belt's mass); only dwarf planet in the inner solar system — JPL SBDB / NASA.

### 2d. Eris — most massive dwarf, dazzling methane ice (MEASURED via occultation/photometry; NEVER imaged)
- **Most massive dwarf planet:** ~**1.66 × 10²² kg**, ~**27% more massive than Pluto** (from Dysnomia's orbit) — Brown & Schaller 2007, Science 316 — yet **slightly smaller in diameter** (2326 vs Pluto's 2377 km).
- **Size + albedo:** diameter **2326 ± 12 km**, geometric albedo **~0.96** (fresh methane frost, one of the most reflective surfaces known) — Sicardy et al. 2011, Nature 478 (2010 stellar occultation).
- **Very distant / eccentric:** a ~68 au, e 0.44, perihelion ~38 au; currently **near aphelion**, so the atmosphere is frozen to the surface — JPL SBDB.
- **Moon Dysnomia** (Brown et al. 2006) gives the mass.
- **Appearance is ILLUSTRATIVE** — never visited; no surface map.

### 2e. Haumea — triaxial shape, a ring, two moons (MEASURED via occultation/photometry; NEVER imaged)
- **Extreme triaxial (Jacobi) ellipsoid ~2100 × 1680 × 1074 km**, elongated by its very fast spin — Ortiz et al. 2017, Nature 550 (occultation) + 2019 shape modelling.
- **Fast rotation ~3.9154 h** — one of the fastest of any large body — JPL SBDB / Rabinowitz et al. 2006.
- **RING** at radius ~2287 km, width ~70 km — the **FIRST ring system discovered around a trans-Neptunian object / dwarf planet** (2017), in a 3:1 resonance with the spin — Ortiz et al. 2017.
- **Two moons** (Hi'iaka, Namaka); their orbits give the mass ~3.95 × 10²¹ kg — Ragozzine & Brown 2009, AJ 137.
- **Surface 66–80% crystalline water ice** — Trujillo et al. 2007 / Merlin et al. 2007.
- **Appearance is ILLUSTRATIVE** — but the **triaxial shape and the ring are real, measured geometry** (render those; leave the surface plain-tinted).

### 2f. Makemake — bright methane ice, no atmosphere, one moon (MEASURED via occultation/photometry; NEVER imaged)
- **Size + albedo:** ~**1430 km** across (slightly flattened), geometric albedo **~0.82** (brighter than Pluto) — Ortiz et al. 2012, Nature 491 (2011 stellar occultation).
- **Surface:** frozen **methane** + ethane + reddish tholins — Licandro et al. 2006.
- **No substantial global atmosphere:** the sharp occultation profile set an upper limit **~4–12 nbar** (unlike Pluto) — Ortiz et al. 2012. JWST (2025) detected gaseous methane that may be **transient outgassing**, not a bound atmosphere — flagged, recent.
- **Moon** S/2015 (136472) 1 ("MK 2"), discovered 2015 — Parker et al. 2016; its orbit now yields a mass (~2.69 × 10²¹ kg, 2025).
- **Rotation uncertain** (~22.83 h SBDB, flagged; light-curve admits ~11.4 h; older single-peak ~7.77 h).
- **Appearance is ILLUSTRATIVE** — never visited; no surface map.

---

## 3. Physical + orbital constants — `constants.json`

**Verified live 2026-07-10.** Built reproducibly by `scripts/dwarf-planets/build_constants.py`; committed as `public/data/dwarf-planets/constants.json`.

**Field provenance (each group tagged in the JSON):**
- **Orbital elements (semi-major axis a in au, eccentricity e, inclination i in deg, perihelion q, orbital period), rotation period, absolute magnitude H, and for Ceres the full physical set (diameter, GM, bulk density, geometric albedo)** → **NASA JPL Solar System Dynamics — Small-Body Database (SBDB) API v1.3**, `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=<name>&phys-par=1&full-prec=1` (queried live 2026-07-10; SBDB solution date 2026-06-06, epoch 2461200.5 TDB). Heliocentric osculating elements. **Frame flag:** for **Charon** (a satellite) the stored orbit is **around Pluto** (a_from_Pluto 19,591 km; period 6.3872 d), because its heliocentric orbit is Pluto's. **Pluto flag:** SBDB's osculating a = 39.589 au (P = 249.1 yr) oscillates because Pluto is deep in the **3:2 resonance** with Neptune; the commonly quoted mean is a ≈ 39.48 au, P ≈ 248 yr.
- **Physical size / mass / albedo for the bodies NOT in SBDB phys-par (Pluto, Charon, Eris, Haumea, Makemake)** → spacecraft + peer-reviewed occultation/photometry (each cited in the JSON):
  - **Pluto:** radius 1188.3 km (Nimmo et al. 2017, Icarus 287); mass 1.303 × 10²² kg / GM 869.6 (Brozović et al. 2015, Icarus 246; Stern et al. 2015, Science 350).
  - **Charon:** radius 606.0 km, mass 1.586 × 10²¹ kg, a_from_Pluto 19,591 km (Nimmo et al. 2017 / Brozović et al. 2015).
  - **Eris:** diameter 2326 km, albedo 0.96 (Sicardy et al. 2011, Nature 478); mass 1.66 × 10²² kg (Brown & Schaller 2007, Science 316).
  - **Haumea:** triaxial 2100 × 1680 × 1074 km + ring (Ortiz et al. 2017, Nature 550); mass 3.95 × 10²¹ kg (Ragozzine & Brown 2009, AJ 137).
  - **Makemake:** diameter ~1430 km, albedo 0.82 (Ortiz et al. 2012, Nature 491); mass 2.69 × 10²¹ kg (2025, from the moon).
- **Temperatures** → NASA dwarf-planet fact pages + mission results. Pluto ~44 K / Charon ~53 K / Ceres ~168 K (daytime max) are measured; **Eris/Haumea/Makemake ~30–32 K are radiative estimates** for these very distant bodies, flagged as such (not in-situ measurements).

**Verified constants (transcribed 2026-07-10):**

| Body | Imaged | Mean R (km) | Mass (kg) | a (au) | e | i (deg) | Period (yr) | Rotation (h) | Albedo | Moons |
|---|---|---|---|---|---|---|---|---|---|---|
| Pluto | ✅ | 1188.3 | 1.303×10²² | 39.589¹ | 0.252 | 17.15 | 249.1¹ | 153.29 (6.39 d) | 0.52 | 5 |
| Charon | ✅ | 606.0 | 1.586×10²¹ | (orbits Pluto)² | 0.0 | 0.0 | 6.39 d² | 153.29 | 0.38 | — |
| Ceres | ✅ | 469.7 | 9.38×10²⁰³ | 2.766 | 0.080 | 10.59 | 4.60 | 9.074 | 0.090 | 0 |
| Eris | ❌ | 1163.0 | 1.66×10²²⁴ | 67.934 | 0.438 | 43.93 | 559.9 | 25.9⁵ | 0.96 | 1 |
| Haumea | ❌ | 772.0⁶ | 3.95×10²¹ | 43.060 | 0.194 | 28.21 | 282.6 | 3.9154 | 0.51 | 2 + ring |
| Makemake | ❌ | 715.0 | 2.69×10²¹ | 45.571 | 0.159 | 29.03 | 307.6 | 22.83⁵ | 0.82 | 1 |

¹ Pluto: SBDB osculating a/P; mean is ~39.48 au / ~248 yr (3:2-resonance oscillation). ² Charon: orbit is **around Pluto** (a 19,591 km, P 6.3872 d), mutually tidally locked; heliocentric orbit = Pluto's. ³ Ceres mass DERIVED from SBDB GM 62.6284 (mass = GM·1e9/G). ⁴ Eris ~27% more massive than Pluto (most massive dwarf) but smaller in diameter. ⁵ Eris & Makemake rotation **uncertain** (SBDB "may be wrong by 30%"; see per-body notes). ⁶ Haumea radius_mean is volume-equivalent (~1544 km diameter); its real shape is the triaxial ellipsoid above.

**Honesty flags baked into the JSON:**
- `imaged` boolean — **true only for Pluto, Charon, Ceres.** Eris/Haumea/Makemake `imaged:false` → appearance ILLUSTRATIVE.
- These orbits are **highly inclined and eccentric** (i 10–44°, e up to 0.44), unlike the near-circular, near-coplanar major planets — a genuine visual contrast.
- Pluto's `neptune_resonance` + `orbit_note` (3:2 resonance, orbit crosses Neptune's).
- Charon's `barycenter_note` (binary; barycenter outside Pluto) + `orbit_note` (mutual tidal lock).
- Haumea's `triaxial_axes_km` + `has_ring` + `ring_note` + `shape_note`.
- Eris/Makemake `rotation_note` (uncertain periods).
- Makemake `atmosphere_note` (no substantial atmosphere; JWST transient methane flagged).

---

## Technical answers

### Best dwarf-planet base textures, and what ships
Ship the **three USGS Astrogeology public-domain global mosaics** — Pluto (New Horizons LORRI–MVIC 300m), Charon (New Horizons 300m), Ceres (Dawn FC 140m) — each downsampled to **2048×1024 JPEG**. They are equirectangular/Simple-Cylindrical and drop into the same pipeline as Earth/Mars/Moon/moons. **Never ship the multi-hundred-MB source** (Pluto 296 MB, Charon 77 MB, Ceres 214 MB). Pluto/Charon carry a mandatory "encounter hemisphere hi-res / far side low-res, grayscale merge" label; Ceres is clear-filter near-grayscale (honest — real Ceres is dark gray). **Eris, Haumea and Makemake ship NO texture** — render clearly-labeled illustrative tinted spheres (Haumea as its real triaxial+ring geometry).

### Is there a "live imagery" service (a GIBS for dwarf planets)?
No, and none is needed. These surfaces do not change on human timescales; static mosaics are correct where they exist. The honest "dynamic" content is **computed orbital mechanics** (highly inclined/eccentric heliocentric orbits; Pluto's 3:2 Neptune resonance; the Pluto–Charon binary mutual lock; Haumea's fast spin) + **measured physical facts** — see `DWARF_PLANETS_PHYSICS.md`.

### Anything problematic for an MIT-licensed open-source repo?
Clean, with one active guardrail:
1. **Do not fabricate a surface for Eris/Haumea/Makemake, and do not use any NC/ND artist map.** If an illustrative texture is ever added, it must be **CC-BY (or freer) and clearly labeled illustrative** — the same posture that rejected the Björn Jónsson maps (planets/moons phases). The honest default is a plain tinted sphere; prefer it.
2. **USGS "Please cite authors"** (Pluto, Charon, Ceres) is a courtesy citation, not a redistribution restriction — public domain. Credit "NASA / JHU-APL / SwRI / LPI / USGS Astrogeology" (Pluto/Charon) and "NASA/JPL-Caltech/UCLA/MPS/DLR/IDA" (Ceres). **No CC-BY-SA-style obligation anywhere this phase** (unlike Mars' Montabone dust or the planets' Solar System Scope textures).

Everything shipped — JPL SBDB constants (US-Gov public data), NASA mission/fact values (public domain), and the three USGS mosaics (public domain) — is maximally permissive.

---

## Rejected / flagged items

- **Eris, Haumea, Makemake surface maps — DO NOT EXIST (not "rejected," simply absent).** Never visited; USGS Astrogeology has nothing for them (verified 2026-07-10). Facts come from stellar occultations + photometry. Render illustrative tinted spheres, clearly labeled; ship no texture.
- **NC/ND artist dwarf-planet maps — REJECTED in advance** (same posture as the Björn Jónsson Voyager Uranus/Neptune maps and the community moon textures). Any illustrative texture must be CC-BY or freer **and** labeled "illustrative / not an observation." Honest default = plain tinted sphere.
- **Pluto/Charon global mosaics are grayscale (panchromatic LORRI–MVIC merge) with a strong resolution gradient** — the encounter hemisphere is high-res, the far side low-res. Colour is a separate PD MVIC product. Label both facts; do not present the far side as high-fidelity.
- **Ceres direct GeoTIFF link not surfaced as a `planetarymaps.usgs.gov` path** (unlike Pluto/Charon). Take the exact download link from the Astropedia map page's Download section at integration time; the clear-filter mosaic is near-grayscale (honest for a dark, near-neutral body).
- **Pluto osculating a differs from the mean** (39.589 vs ~39.48 au) because of the 3:2-resonance oscillation — flagged in `constants.json`. Charon's stored orbit is **around Pluto**, not heliocentric.
- **Eris & Makemake rotation periods are genuinely uncertain** (SBDB "may be wrong by 30%"; Makemake also has 11.4 h / 7.77 h alternatives) — stored with `rotation_note`, not presented as precise.
- **Makemake "atmosphere":** none substantial (occultation upper limit ~4–12 nbar). The 2025 JWST gaseous-methane detection is likely **transient outgassing**, not a bound atmosphere — flagged, not asserted as an atmosphere.
- **Eris/Haumea/Makemake temperatures (~30–32 K) are radiative estimates, not in-situ measurements** — flagged in `constants.json`.

---

**Verification methodology note:** The three USGS Astrogeology map pages (Pluto, Charon, Ceres) were fetched live on 2026-07-10; download URL, pixel dimensions, file size, resolution, projection, license (Access/Use Constraints) and originator were read directly from each page. Orbital elements, rotation periods and absolute magnitudes (all six bodies), plus Ceres' full physical set, were queried live from the NASA JPL Small-Body Database API on 2026-07-10 (SBDB solution 2026-06-06, epoch J2461200.5 TDB). Physical size/mass/albedo for Pluto/Charon (New Horizons) and Eris/Haumea/Makemake (stellar occultations + photometry) were taken from the cited peer-reviewed papers (Nimmo 2017; Brozović 2015; Stern 2015; Sicardy 2011; Brown & Schaller 2007; Ortiz 2017; Ortiz 2012; Ragozzine & Brown 2009) and cross-checked against NASA dwarf-planet pages and Wikipedia infoboxes (which cite the same primaries). The absence of any USGS/PD map for Eris/Haumea/Makemake was confirmed against the Astropedia catalog. See `docs/DWARF_PLANETS_PHYSICS.md` for the honest-representation methodology.

---

## Produced artifacts (this phase)

**`public/data/dwarf-planets/constants.json`** (~12.6 KB) — built by `scripts/dwarf-planets/build_constants.py`. Physical (radius / mass / density / albedo, Haumea triaxial axes + ring) + orbital (a/e/i/period, heliocentric; Charon around Pluto) constants for all 6 bodies, each field group source-tagged; per-body `imaged` boolean (true only Pluto/Charon/Ceres), Pluto `neptune_resonance`, Charon `barycenter_note` (binary), Haumea `has_ring`, Eris/Makemake `rotation_note`, Makemake `atmosphere_note`. Ceres mass DERIVED from GM.

**`public/data/dwarf-planets/phenomena.json`** (~10.0 KB) — built by `scripts/dwarf-planets/build_phenomena.py`. Per-body `headline`, `weather:false` (all — no dwarf-planet weather), `imaged` boolean, an `appearance` string ("real imagery" vs "ILLUSTRATIVE"), and a `facts` map where **every fact carries its own `source`** (instrument/mission + citation). Un-imaged bodies carry an explicit `appearanceNote` fact stating no surface map exists.

Total committed **~22.6 KB** (< the ~120 KB budget). No texture committed (download-and-downsample provenance only for the three imaged bodies; nothing to ship for the three un-imaged bodies). Both scripts are pure-stdlib Python, deterministic, and print a per-body verification summary on run.

---

## Phase 6 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app wires these in.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Physical + orbital constants / orrery | `constants.json` (JPL SBDB + New Horizons/Dawn/occultation lit.) | `public/data/dwarf-planets/constants.json`, built by `scripts/dwarf-planets/build_constants.py` | 6 bodies; highly inclined/eccentric orbits; Pluto 3:2 resonance; Pluto–Charon binary; Haumea triaxial+ring. |
| Measured-phenomena HUD | `phenomena.json` (per-fact cited) | `public/data/dwarf-planets/phenomena.json`, built by `scripts/dwarf-planets/build_phenomena.py` | `weather:false` for all; `imaged`/`appearance` per body. |
| Pluto basemap | USGS New Horizons LORRI–MVIC 300m (PD, cite authors) | download → downsample 2048×1024 JPEG → `public/textures/` | Grayscale merge; encounter hemisphere hi-res, far side low-res. Colour MVIC available (PD). |
| Charon basemap | USGS New Horizons LORRI–MVIC 300m (PD, cite authors) | download → downsample → `public/textures/` | Mordor Macula + canyons; same flyby coverage caveat. |
| Ceres basemap | USGS Dawn FC 140m (PD, cite authors) | download → downsample → `public/textures/` | Clear-filter near-grayscale (real Ceres is dark gray). |
| Eris / Haumea / Makemake | **none** | — | NO map exists; render clearly-labeled ILLUSTRATIVE tinted spheres (Haumea = real triaxial + ring geometry). |
| Orbital mechanics (heliocentric orbits, 3:2 resonance, Pluto–Charon binary, Haumea spin/ring) | Kepler + `constants.json` | computed client-side (owned by another agent) | See `DWARF_PLANETS_PHYSICS.md`; no runtime API. |
