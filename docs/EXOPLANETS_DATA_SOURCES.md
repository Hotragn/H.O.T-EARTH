# Exoplanets Data Sources (Phase 8)

Verification date: **2026-07-10**. Every endpoint, table name, column unit, license/acknowledgment string and count below was verified on this date against official NASA Exoplanet Archive pages and/or **live TAP API queries** (noted per item). Anything not verifiable from an official source is explicitly flagged. Same rigor and honesty bar as `DATA_SOURCES.md` (Earth), `PLANETS_DATA_SOURCES.md` and the Mars/Moon docs: real data, real physics, honest claims, everything free and legally usable for an MIT open-source app, every source + license logged.

Scope this phase: **confirmed exoplanets and their host stars** — measured orbital, physical and stellar parameters for a curated set of scientifically notable + pedagogically great systems, plus the nearest systems to the Sun.

> **Honesty rule for this phase (from the project brief):** exoplanets have essentially **no surface imagery**. The honest substance is **real MEASURED parameters** (orbits, sizes, masses, temperatures, host stars, distances, discovery method) + system architecture + habitable zones. Every planet's *appearance* is illustrative and must be labeled so. The handful of "directly imaged" planets are **unresolved dots**, not maps. We invent nothing; we use the archive's measured values and emit `null` where the archive has none. See `docs/EXOPLANETS_PHYSICS.md` for the measured/computed/illustrative contract.

## Summary table

| Source | Data used | License / status | Acknowledgment required | Access | Verified against (2026-07-10) |
|---|---|---|---|---|---|
| **NASA Exoplanet Archive** — `pscomppars` table | Confirmed-planet composite parameters (orbit, radius/mass, eq. temp, insolation) + host-star params (distance, spectral type, Teff, radius, mass, luminosity) | US-Government-funded (NASA) product by Caltech/IPAC; measured catalog values freely usable. Archive does **not** use the words "public domain" — it **requests** a specific acknowledgment (below) | **Yes** — display the acknowledgment line verbatim | TAP API over HTTP (ADQL), no key, no registration | Archive TAP docs + acknowledge.html + column docs + live TAP queries |

Committed artifact: `public/data/exoplanets/systems.json`, built reproducibly by `scripts/exoplanets/build_systems.py` (queries the TAP API live and writes the JSON).

---

## 1. NASA Exoplanet Archive — the authoritative catalog

**Verified against:** the archive homepage / data page (`https://exoplanetarchive.ipac.caltech.edu/docs/data.html`), the TAP usage docs (`https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html`), the acknowledgment/citation policy (`https://exoplanetarchive.ipac.caltech.edu/docs/acknowledge.html`), the PS/pscomppars column definitions (`https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html`), plus **live TAP queries** on 2026-07-10.

- **What it is:** NASA's authoritative, continuously-updated catalog of confirmed exoplanets and their host stars, operated by the **California Institute of Technology / IPAC** (NASA Exoplanet Science Institute, NExScI) under contract with NASA for the Exoplanet Exploration Program. It is the reference catalog the exoplanet community cites.
- **Operator / institutional statement (verified on acknowledge.html):** "operated by the California Institute of Technology, under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program." Footer logos on the archive pages: NASA, IPAC, NExScI, Caltech.

### 1a. TAP API (how we query it)

- **Base service URL (verified):** `https://exoplanetarchive.ipac.caltech.edu/TAP`
- **Synchronous query format (verified, used by this project):**
  ```
  https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=<ADQL>&format=json
  ```
- **Query language:** ADQL (Astronomy Data Query Language, IVOA standard; SQL-compliant).
- **Output formats (quoted from the TAP docs):** "the output can be formatted in VOTable (votable), comma-separated values (csv), tab-separated values (tsv), or JavaScript Object Notation (JSON)." Default is VOTable unless `&format=` is set — **we always pass `format=json`.**
- **No API key, no registration.** Both sync and async modes exist; **sync** is recommended for the currently-supported tables (`ps`, `pscomppars`) and is what we use.
- **Rate/usage:** no published numeric rate limit for TAP. We issue a single sync query per build run (a batch `IN (...)`/`sy_dist <` query), which is negligible load. Be gentle: batch, don't hammer.

### 1b. Which table — `pscomppars` (Planetary Systems Composite Parameters)

Two planetary tables exist (both verified in the TAP docs):

| Table | Rows | Use |
|---|---|---|
| `ps` (Planetary Systems) | **one row per published reference** per planet (many rows per planet) | full provenance, per-reference values |
| **`pscomppars`** (PS Composite Parameters) | **one row per confirmed planet** — the most complete composite set of parameters | **best for a compact "one value per planet" export** ✅ used here |

We query **`pscomppars`** because it gives exactly one, most-complete row per planet — ideal for a compact digital-twin dataset. Trade-off (stated honestly): a composite row can blend parameters from **different references**, so an individual planet's values are not guaranteed self-consistent to the last decimal. For per-reference rigor use `ps`. For a pedagogical twin, `pscomppars` is the right call.

### 1c. Columns + units (verified against the archive column definitions 2026-07-10)

All units below were confirmed from `API_PS_columns.html`. These are the exact columns `build_systems.py` selects:

| Column | Unit | Definition (from the archive column docs) |
|---|---|---|
| `pl_name` | — | Planet name most commonly used in the literature |
| `hostname` | — | Stellar name most commonly used in the literature |
| `sy_snum` | count | Number of gravitationally bound **stars** in the system |
| `sy_pnum` | count | Number of confirmed **planets** in the system |
| `discoverymethod` | — | Method by which the planet was first identified |
| `disc_year` | year | Year the planet was discovered |
| `pl_orbper` | **days** | Orbital period |
| `pl_orbsmax` | **AU** | Orbit semi-major axis (for imaging/microlensing: projected separation) |
| `pl_orbeccen` | dimensionless | Orbital eccentricity |
| `pl_rade` | **Earth radii** | Planet radius |
| `pl_bmasse` | **Earth masses** | Best mass estimate: mass, `M·sin i / sin i`, or `M·sin i` (see caveat) |
| `pl_eqt` | **Kelvin** | Equilibrium temperature, modeled as a black body heated by the host star |
| `pl_insol` | **Earth flux (Earth = 1)** | Insolation flux relative to Earth's from the Sun |
| `sy_dist` | **parsecs** | Distance to the system |
| `st_spectype` | — | Stellar spectral type (Morgan–Keenan system) |
| `st_teff` | **Kelvin** | Stellar effective temperature |
| `st_rad` | **solar radii** | Stellar radius |
| `st_mass` | **solar masses** | Stellar mass |
| `st_lum` | **log₁₀(solar luminosity)** | Stellar luminosity (note: this is a base-10 log, not linear L⊙) |

**Unit gotchas baked into the pipeline / docs:**
- `st_lum` is **log₁₀(L⊙)** — e.g. the Sun ≈ 0.0; a value of −3.26 (TRAPPIST-1) means ~10⁻³·²⁶ ≈ 0.00055 L⊙. Any habitable-zone computation in the app must exponentiate first (`L = 10**st_lum`). Flagged in `EXOPLANETS_PHYSICS.md`.
- `pl_bmasse` is a **best mass** — for radial-velocity planets without a transit it is frequently only a **minimum mass** (`M·sin i`). Do not present it as a true mass without that caveat.
- `sy_dist` is **parsecs**; we also store `distance_ly = parsecs × 3.26156` (the only unit conversion we compute).
- For **directly imaged** and microlensing planets, `pl_orbsmax` is a **projected separation**, not a true semi-major axis (flagged in the physics doc).

### 1d. License / acknowledgment status (READ CAREFULLY — verbatim)

**The archive does NOT publish the words "public domain."** What it publishes (verified verbatim on `acknowledge.html`, 2026-07-10) is a **requested acknowledgment**. Record and display it exactly:

> **"This research has made use of the NASA Exoplanet Archive, which is operated by the California Institute of Technology, under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program."**

- **Primary citation the archive asks you to cite:** **Christiansen et al. (2025), *Planetary Science Journal*** (the archive overview paper).
- **Dataset-specific acknowledgments** the same page lists (only relevant if you ship those sub-datasets): **WASP** → cite Butters et al. (2010); **KELT** → "These data are made available to the community through the Exoplanet Archive on behalf of the KELT project team."; plus CUTE, FDL/INARA, and ROME/REA strings. This project ships composite `pscomppars` parameters (which *include* some WASP planets — WASP-12, WASP-39, WASP-43, WASP-96, WASP-121 are in our curated set), so **the WASP acknowledgment (Butters et al. 2010) should also appear** in the app credits alongside the main line.
- **Legal reading (honest):** the archive is a **US-Government-funded** (NASA) product produced by Caltech/IPAC under NASA contract, and the numbers it serves are **measured astronomical facts** (orbital periods, radii, temperatures), which are not themselves copyrightable. So the data are **freely usable** for an MIT open-source app. But — to be precise and not overclaim — **the archive itself frames the requirement as a requested acknowledgment, not a "public domain dedication."** Treat the acknowledgment line as a **must-display** obligation (same posture as Open-Meteo's CC-BY credit on Earth), and characterize the data as "US-Government-funded, freely usable, cite as requested" rather than literally stamping it "public domain."
- **Where the acknowledgment must appear (three places, per the ingestion rule):** this doc, the app about/credits panel, and the README. It is also stored **verbatim in `systems.json` → `meta.acknowledgment`** so the UI can render it directly.

---

## 2. What we fetched — `public/data/exoplanets/systems.json`

**Built live 2026-07-10** by `scripts/exoplanets/build_systems.py` (a single TAP `pscomppars` query: curated hostnames `IN (...)` **UNION** everything with `sy_dist < 5` pc). Real counts from this session's run:

- **62 systems, 171 planets.** File size **44.2 KB** (well under the 250 KB budget), minified JSON, ASCII-safe.
- **7 directly-imaged planets flagged** `directly_imaged: true` (from `discoverymethod == "Imaging"`): **51 Eri b; HR 8799 b, c, d, e; Beta Pic (`bet Pic`) b and d.**
  - Honest note: **Beta Pic c** is in the file but is **not** flagged imaged — the archive lists its discovery method as **Radial Velocity**, so we do not claim it as imaged. This is exactly the "use the archive's truth, don't embellish" rule.

### 2a. Schema (grouped by system)

```json
{
  "meta": {
    "source": "NASA Exoplanet Archive pscomppars ...",
    "tap_endpoint": "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=<ADQL>&format=json",
    "table": "pscomppars",
    "adql": "select ... from pscomppars where hostname in (...) or sy_dist < 5.0 ...",
    "acknowledgment": "This research has made use of the NASA Exoplanet Archive, ...",
    "primary_citation": "Christiansen et al. (2025), Planetary Science Journal.",
    "units": { "...": "..." },
    "honesty": "Every value is a measured/published archive quantity; null = archive has no value ...",
    "verified_date": "2026-07-10",
    "counts": { "systems": 62, "planets": 171 }
  },
  "systems": [
    {
      "hostname": "TRAPPIST-1",
      "common_name": "Kepler-90",          // only present where the archive hostname differs from the famous name
      "sy_snum": 1,                          // bound stars in system
      "distance_pc": 12.4299,
      "distance_ly": 40.54,                  // computed = pc × 3.26156
      "star": { "spectype": "M8.0 V", "teff": 2566, "rad": 0.1192, "mass": 0.0898, "lum": -3.2573 },
      "note": "7-planet resonant chain, several near the habitable zone",
      "planets": [
        {
          "name": "TRAPPIST-1 b", "method": "Transit", "disc_year": 2016,
          "period_days": 1.51083, "sma_au": 0.01154, "ecc": 0.0062,
          "radius_re": 1.116, "mass_me": 1.374, "eqt_k": 398, "insol": 4.153
          // "directly_imaged": true   // present ONLY when discoverymethod == "Imaging"
        }
      ]
    }
  ]
}
```

- **`null` everywhere the archive has no value** — never filled in. (Examples in the live file: `KOI-351` has `st_spectype: null`; `HR 8799 b` has `ecc: null`.)
- **Rounding:** significant-figure rounding for values spanning orders of magnitude (period, sma, mass, insol); fixed decimals for eccentricity/radius/stellar params; integers for temperatures. No precision is invented — rounding only ever discards digits.

### 2b. Curated set (why each system is in) — 62 systems

**Notable / pedagogical (43 hand-picked, each with a one-line reason stored in `note`):**
TRAPPIST-1 (7-planet resonant chain), Proxima Cen (nearest star), KOI-351 = **Kepler-90** (8 planets — most Solar-System-like count), Kepler-452 ("Earth's cousin"), Kepler-186 (first Earth-size in HZ), Kepler-11 (6 compact), Kepler-16 (first circumbinary, "Tatooine"), Kepler-22, Kepler-62, Kepler-442, Kepler-1649, Kepler-138, Kepler-444 (ancient), 51 Peg (**first around a Sun-like star**), HD 209458 (**first transit**), HD 189733, 55 Cnc (incl. 55 Cnc e lava world), GJ 667 C, LHS 1140, K2-18, TOI-700, **HR 8799** (4 imaged), **Beta Pic** (imaged), **51 Eri** (imaged), WASP-12 & WASP-121 (ultra-hot Jupiters), WASP-39/WASP-96/WASP-43 (JWST atmospheres), GJ 1214 (warm sub-Neptune), GJ 486, GJ 357, GJ 3512, L 98-59, LTT 1445 A, LP 890-9, TOI-270, HD 110067 (6 resonant, 2023), HD 219134, HD 40307, HD 10180, ups And (first multi around a main-sequence star), 47 UMa.

**Nearest systems (auto-swept, `sy_dist < 5` pc):** Proxima Cen (1.30 pc), Barnard's star, eps Eri, GJ 887, Ross 128, Gl 725 A, GJ 15 A, tau Cet, eps Ind A, GJ 1061, YZ Cet, Teegarden's Star, Kapteyn, Wolf 1061, GJ 9066, GJ 674, GJ 687, GJ 876, GJ 1002, GJ 832.

**Naming quirks resolved (verified live, honest aliases stored in `common_name`):** the archive stores **Kepler-90 under hostname `KOI-351`** (only the 8th planet, found by ML in 2017, carries the "Kepler-90 i" planet name). Other archive/common aliases mapped: `Proxima Cen`→Proxima Centauri, `51 Peg`→51 Pegasi, `51 Eri`→51 Eridani, `55 Cnc`→55 Cancri, `bet Pic`→Beta Pictoris, `GJ 667 C`→Gliese 667 C, `ups And`→Upsilon Andromedae, `47 UMa`→47 Ursae Majoris, `eps Eri`→Epsilon Eridani, `eps Ind A`→Epsilon Indi A, `tau Cet`→Tau Ceti.

### 2c. Honest limitations of the fetched set (not shortcuts — real findings)

- **Proxima Centauri returns 2 confirmed planets (b, d)** in `pscomppars`, **not** the b/c/d trio the brief mentioned. The archive does **not** list Proxima c as a confirmed planet, so we ship 2. The authoritative catalog is the arbiter; we do not add c. (Proxima b in the HZ; d is a 2025 sub-Earth RV detection.)
- **Directly-imaged giants have large, model-dependent parameters** — e.g. HR 8799 masses (~2000–3200 M⊕) and multi-thousand-day periods come from imaging + evolutionary models, with big uncertainties; `pl_orbsmax` for them is a **projected separation**. Flagged in `EXOPLANETS_PHYSICS.md`.
- **Composite-row caveat** (see §1b): a `pscomppars` row can mix references; not guaranteed internally self-consistent.
- **The set is a snapshot** of a live, growing catalog. Re-running `build_systems.py` re-queries the archive, so counts/values will drift as the archive updates (the confirmed-planet total was ~5,900+ archive-wide in mid-2026; we ship a curated 62-system slice, not the whole catalog).

---

## Rejected / flagged items

- **"Public domain" wording — not asserted by the archive.** The acknowledge.html page frames usage as a **requested acknowledgment**, and does not dedicate the data to the public domain in those words. We therefore display the acknowledgment as a must-do and describe the data as "US-Government-funded, freely usable, cite as requested" rather than stamping it PD. (Contrast: USGS Astrogeology maps *do* say "public domain" verbatim — see `PLANETS_DATA_SOURCES.md`.)
- **`ps` table rejected for this file** — one row per reference means many rows per planet; wrong shape for a compact per-planet twin. Use `pscomppars`. (`ps` remains the source of truth for per-reference provenance if ever needed.)
- **Default TAP format is VOTable** — must pass `&format=json` explicitly or you get XML. Flagged; the script always sets it.
- **Kepler-90 hostname is `KOI-351`** in the archive (verified live) — querying `hostname='Kepler-90'` returns **nothing**. Anyone extending this set must resolve aliases against the live archive, not assume common names.
- **Surface imagery does not exist for exoplanets** — no map, no texture, is a real observation of any exoplanet surface. The "imaged" planets (HR 8799, Beta Pic, 51 Eri) are **unresolved point sources**, not resolved disks. Any rendered appearance in the app is **illustrative** and must be labeled so (see `EXOPLANETS_PHYSICS.md`). This is the phase's central honesty constraint.
- **No CORS test performed / needed for browser use here:** the build runs offline (server/local), committing a static JSON to the repo — the browser never calls the TAP API directly (same pattern as GFS wind and the planetary constants). If a future feature calls TAP from the browser, CORS must be verified first.

---

**Verification methodology note:** the TAP base URL, sync format, table list, ADQL/format support, and every column unit were read from the archive's official TAP and column-definition pages on 2026-07-10; the acknowledgment string and primary citation were read verbatim from `acknowledge.html` the same day. All planet/star values, the 62-system / 171-planet counts, the 7 directly-imaged flags, and the naming quirks (KOI-351, Proxima 2-planet) come from **live `pscomppars` TAP queries executed this session** by `scripts/exoplanets/build_systems.py`. See `docs/EXOPLANETS_PHYSICS.md` for the measured-vs-computed-vs-illustrative contract.

---

## Integration log (Phase 8)

Populate at integration time (per the planetary-data-ingestion rule) as the app wires these in.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Exoplanet systems catalog | `systems.json` (NASA Exoplanet Archive `pscomppars`, TAP) | `public/data/exoplanets/systems.json`, built by `scripts/exoplanets/build_systems.py` | 62 systems / 171 planets; acknowledgment string in `meta.acknowledgment`; nulls preserved. |
| Directly-imaged flag | `discoverymethod == "Imaging"` | `planets[].directly_imaged` | 7 planets (HR 8799 bcde, Beta Pic b/d, 51 Eri b); label as unresolved dots, not maps. |
| Habitable zone (per system) | COMPUTED from `star.lum` (10^st_lum) + Teff | app-side, see `EXOPLANETS_PHYSICS.md` | Not stored in JSON; computed and labeled "computed". |
| Planet appearance | ILLUSTRATIVE (no surface imagery exists) | app-side render | Must be labeled "illustration, not an observation". |
| Required acknowledgment | archive acknowledge.html (verbatim) | app about/credits + README + this doc | Plus WASP (Butters et al. 2010) since WASP planets are in the set. |
