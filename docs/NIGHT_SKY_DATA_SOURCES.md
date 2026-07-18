# Night Sky Data Sources (Phase 11)

Verification date: **2026-07-18**. Every catalog, file path, column unit, license and count below was verified on this date against the official project pages and/or by downloading and inspecting the real data files (noted per item). Anything not verifiable from an official source is explicitly flagged. Same rigor and honesty bar as `DATA_SOURCES.md` (Earth) and `EXOPLANETS_DATA_SOURCES.md`: real data, real physics, honest claims, everything free and legally usable for an open-source app, every source + license logged.

Scope this phase: a **star map** ("Night Sky" tab) built from real measured stars, deep-sky objects, and a labeled cultural overlay of constellation figures.

> **Honesty rule for this phase (from the project brief):** star positions, magnitudes, colours, distances and spectral types are **REAL MEASURED data** (Hipparcos / Gaia era, via the HYG compilation; Messier positions from NED/SIMBAD via OpenNGC). **Constellation lines are a CULTURAL overlay** and must be labeled so: the stars are real, but the stick figures joining them are a human construct (the modern Western / IAU set). See `docs/NIGHT_SKY_PHYSICS.md` for the measured / computed / cultural contract.

## Summary table

| Source | Data used | License | Attribution required | Access | Verified against (2026-07-18) |
|---|---|---|---|---|---|
| **HYG database v4.4** (astronexus/hyg, Codeberg) | ~119,614 stars: RA, Dec (J2000), parallax distance (pc), apparent magnitude, colour index B-V, spectral type, proper names, Bayer/Flamsteed, constellation | **CC BY-SA 4.0** | **Yes** - attribution + share-alike (it is data, credited; see string below) | HTTPS download of a Git-LFS CSV, no key | Repo README, `data/hyg/README.md`, LICENSE, and a live download + inspection of `hyg_v44.csv.gz` |
| **ConstellationLines** (MarcvdSluys) | 88 constellation stick figures as line segments between Bright Star Catalogue (BSC/HR) stars | **CC BY 4.0** (clean, no GPL) | **Yes** - attribution (string below) | HTTPS download of a CSV, no key | Repo `readme.org`, `CITATION.cff` (`license: CC-BY-4.0`), `LICENSE`, live download of `ConstellationLines.csv` |
| **IAU Catalog of Star Names (IAU-CSN)**, IAU WGSN | IAU-approved proper names (to label / cross-check named stars) | IAU products: **CC BY** ("free to use ... as long as the source is mentioned") | **Yes** - mention the source | HTTPS download of a text file, no key | File header of `IAU-CSN.txt` + IAU WGSN pages; live download |
| **OpenNGC** (mattiaverga/OpenNGC) | 110 Messier objects: J2000 positions, magnitudes, types, common names, NGC/IC cross-refs | **CC BY-SA 4.0** | **Yes** - attribution + share-alike | HTTPS download of `;`-delimited CSVs, no key | Repo README, `NGC_guide.txt`, live download of `NGC.csv` + `addendum.csv` |

Committed artifacts (all built reproducibly by `scripts/night-sky/build_catalog.py`):
`public/data/night-sky/stars.json`, `constellations.json`, `messier.json`.

---

## 1. Stars - HYG database v4.4 (the practical naked-eye catalog)

**Verified against:** the project page `https://www.astronexus.com/projects/hyg`, the live repository `https://codeberg.org/astronexus/hyg`, the field docs at `data/hyg/README.md`, the repo `LICENSE`, plus a **live download and inspection** of `hyg_v44.csv.gz` on 2026-07-18.

- **What it is:** the HYG (Hipparcos, Yale, Gliese) database, a compiled star catalog merging the **Hipparcos** astrometric catalog (positions, parallaxes), the **Yale Bright Star Catalog** (bright-star data, HR numbers) and the **Gliese** catalog of nearby stars. Version **4.4**, released **2026-07-12**, contains **119,614 stars**. This is the practical, single-file source for a naked-eye star map (RA, Dec, distance, magnitude, colour, spectral type, names and designations in one CSV).
- **Repository moved:** the old GitHub repo (`astronexus/HYG-Database`) was **archived 2025-02-14**; all current versions (v4.x) live on **Codeberg** at `astronexus/hyg`. The GitHub repo is stale (do not use for v4.x).
- **Access (Git-LFS gotcha, verified):** the CSV is stored via **Git LFS**. The plain `raw` URL returns a ~130-byte LFS *pointer* file (starts with `version https://git-lfs...`), not the data. Use the LFS-resolving **media** endpoint:
  ```
  https://codeberg.org/astronexus/hyg/media/branch/main/data/hyg/CURRENT/hyg_v44.csv.gz
  ```
  This returned a valid 13.6 MB gzip on 2026-07-18 (decompresses to ~34 MB CSV, 119,614 rows).
- **Columns (verified from the CSV header):** `id, hip, hd, hr, gl, bf, proper, ra, dec, dist, pmra, pmdec, rv, mag, absmag, spect, ci, x, y, z, vx, vy, vz, rarad, decrad, pmrarad, pmdecrad, bayer, flam, con, comp, comp_primary, base, lum, var, var_min, var_max`.

**UNIT GOTCHA - verified against the real data, and it contradicts the README.** The `data/hyg/README.md` says RA is in "Degrees." **The actual v4.4 data has `ra` in DECIMAL HOURS**, not degrees (Sirius: `ra = 6.752481` = 6h 45m; the maximum value in the file is 23.9986, i.e. ~24h). `dec` is in **degrees**, `dist` is in **parsecs** with a sentinel: values `>= 100000` mean "no parallax / distance unknown / dubious." Our build converts RA to **degrees** (`ra_deg = ra_hours x 15`) so both angles share a unit, and treats `dist >= 100000` as `null`. This is the kind of trap that only inspection catches; the README alone would have produced a sky rotated by a factor of 15.

- **License (verified verbatim on the repo `LICENSE` and `data/hyg/README.md`):** **Creative Commons Attribution-ShareAlike 4.0 International** (`http://creativecommons.org/licenses/by-sa/4.0/`). Note the license *upgrade* history: v3.x was CC BY-SA **2.5**; v4.0+ is CC BY-SA **4.0**.
- **Is CC BY-SA acceptable for this project? Yes, and handled honestly.** CC BY-SA has two obligations: **attribution** and **share-alike**. Both are satisfiable here:
  - *Attribution:* display the credit string below wherever the star data appears (about/credits panel + README + this doc), stored verbatim in `stars.json -> meta.attribution`.
  - *Share-alike:* the derived `stars.json` is itself a modified/adapted version of a CC BY-SA dataset, so **`stars.json` is released under CC BY-SA 4.0** (recorded in its `meta.license`). This is a *data* license and does not "infect" the app's code license (the code stays under the repo's own license); only the derived star-data file carries CC BY-SA. This is the same clean separation used for Open-Meteo's CC-BY weather data on the Earth tab (data license separate from code license).
- **Exact attribution string (store + display verbatim):**
  > "Star data: HYG database v4.4 (c) astronexus / David Nash, licensed CC BY-SA 4.0, compiled from the Hipparcos, Yale Bright Star and Gliese catalogs. This derived subset is shared under the same CC BY-SA 4.0 license."
- **Purely-public-domain alternative (considered, not chosen):** the underlying **Hipparcos** (VizieR `I/239`) and **Yale BSC** (VizieR `V/50`) catalogs are public-domain and could be assembled from scratch to avoid the share-alike obligation. HYG is the practical choice (it has already merged positions, distances, names and cross-IDs into one file); we accept CC BY-SA and attribute. Flagged in the rejected/considered section.

## 2. Constellation lines - the GPL license trap, and the clean source we chose

This is the phase's real license trap, called out explicitly in the brief. **Drawing "which bright stars to join" into a stick figure is a human convention with no single standard**, and several popular datasets are **GPL**, which conflicts with a permissive open-source repo. We investigated and rejected the GPL options and chose a clean CC BY 4.0 source.

**Verified against:** the repos and their license files, downloaded and inspected on 2026-07-18.

### 2a. What we REJECTED (and why)

- **Stellarium `constellationship.fab` - REJECTED (GPL).** Stellarium's constellation-line data is distributed under the **GNU GPL**. Bundling GPL data in a permissive-licensed repo creates a copyleft conflict. Rejected per the brief.
- **`dcf21/constellation-stick-figures` (the IAU file) - REJECTED (GPL, despite a CC-BY claim).** This is a well-known source and its *README* claims the IAU stick figures are "released under a Creative Commons Attribution 4.0 International license." **But the data file itself tells a different story.** The header of `constellation_lines_iau.dat`, verified by download, reads:
  > "Copyright 2015-2025 Dominic Ford ... This data is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License** ... version 3 of the License, or (at your option) any later version."
  The file is **stamped GPL v3 in its own header**, contradicting the README's CC-BY claim. Under the project rule ("if terms are unclear or restrictive, do not use the source"), this ambiguity is disqualifying. Rejected. (The file also documents its format usefully: each line lists Hipparcos numbers to connect, with pen-lifts between lines; the figures shown are the ones on the IAU website. We took none of the data.)
- **`doinab/constellation-lines` - not used (CC, but harder to wire).** A carefully-referenced, Creative-Commons dataset, but stars are identified by **SIMBAD / latinised Bayer ids**, not HIP or HR, so it does not map cleanly to the HYG-based `stars.json`. A viable clean fallback; not needed.

### 2b. What we CHOSE - MarcvdSluys/ConstellationLines (CC BY 4.0, clean)

- **What it is:** "ConstellationLines" by **Marc van der Sluys** - lists of **Bright Star Catalogue (BSC / HR) numbers** to connect into the **88 modern constellations**. Originally created in 2005 for the Dutch popular-astronomy site hemel.waarnemen.com.
- **License (verified in three places):** **CC BY 4.0** - stated in `readme.org` ("The data can be used under the terms of the Creative Commons Attribution 4.0 International (CC BY 4.0) licence"), in `CITATION.cff` (`license: CC-BY-4.0`), and in the full `LICENSE` text. **No GPL anywhere in the repo** - clean for redistribution in a permissive-licensed project.
- **Format (verified from `ConstellationLines.csv`):** one row per drawn line: `abr` (3-letter constellation abbreviation), `nr` (star count), then up to 31 HR numbers forming a polyline. A line may **retrace itself** (a repeated HR number) to draw branches without lifting the pen; a few constellations that cannot be drawn as one path (e.g. Crux, Serpens) use multiple rows. We split each polyline into consecutive pairs, dedupe undirected segments, and map **HR -> the star id used in `stars.json`**.
- **HR -> star mapping (integrity, verified):** the constellation file uses **695 distinct HR numbers**. HYG's `hr` column resolves all but **7** (Almach, eps Ari, Acamar, gamma-2 Vel, Algieba and two others), which HYG leaves `hr`-blank because they are double stars. All 7 are recovered via the standard Yale **HR -> HD** crosswalk (hardcoded in the build script, and each verified to resolve in HYG by HD). **Result: 0 dropped segments, 0 unresolved HR ids** - every constellation vertex is a star present in `stars.json`.
- **Exact attribution string (store + display verbatim):**
  > "Constellation lines: Marc van der Sluys, 'ConstellationLines', licensed CC BY 4.0, DOI 10.5281/zenodo.10397192 (github.com/MarcvdSluys/ConstellationLines)."
- **Constellation names:** the abbreviation -> English-name mapping (the standard IAU 88) is **hardcoded** in the build script as public/factual data, so **no name data is taken from any GPL source**.

## 3. Star names - IAU Working Group on Star Names (WGSN)

**Verified against:** the header of the **IAU Catalog of Star Names (IAU-CSN)** text file `https://www.pas.rochester.edu/~emamajek/WGSN/IAU-CSN.txt` (WGSN Chair Susanne Hoffmann, Secretary Eric Mamajek) plus the IAU WGSN pages, downloaded 2026-07-18.

- **What it is:** the authoritative list of **IAU-approved proper star names** (e.g. Sirius, Vega, Rigil Kentaurus). The file carries columns including the **HIP** number, so names can be matched to stars by Hipparcos id.
- **License (verified verbatim from the file header):** "All IAU-produced products (Images, Videos, Texts) are released under **Creative Commons Attribution** (i.e. free to use in all perpetuity, world-wide, as long as the source is mentioned)." So: CC BY, mention the source.
- **How we use it:** most named naked-eye stars **already carry their IAU proper name in HYG's `proper` field** (HYG sources its names from the IAU). We use HYG's names directly and, as a best-effort cross-check, fill in a proper name from the **live IAU-CSN by HIP number** only where HYG left the field blank. In this build that added **21** names (e.g. stars HYG had left unnamed but WGSN has since named), on top of HYG's 548, for **569 named stars**. HYG names are never overwritten.
- **Attribution:** credit "Star names: IAU Working Group on Star Names (WGSN), IAU Catalog of Star Names."

## 4. Deep-sky objects - the Messier catalog via OpenNGC

**Verified against:** the OpenNGC repo README and `NGC_guide.txt`, plus a live download and inspection of `NGC.csv` and `addendum.csv` on 2026-07-18.

- **What it is:** **OpenNGC** by **Mattia Verga**, a deliberately license-friendly database of NGC / IC objects (and a small addendum for Messier objects lacking an NGC/IC number). Positions are from **NED**; magnitudes from **LEDA / SIMBAD**; it includes object type, constellation, common names, and a `M` (Messier number) cross-reference column. We extract the **110 Messier objects**.
- **License (verified):** **CC BY-SA 4.0** - chosen by the author specifically because "unlike other similar databases which are released with license limitations, OpenNGC is released under CC-BY-SA-4.0." Attribution + share-alike; our derived `messier.json` carries the credit and the CC BY-SA note.
- **Format (verified):** `;`-delimited CSV. RA in `HH:MM:SS.SS` (J2000), Dec in `+/-DD:MM:SS.S` (J2000) - we convert both to **decimal degrees**. Magnitude: we prefer `V-Mag`, fall back to `B-Mag`, else `null`. Type codes (`G`, `GCl`, `OCl`, `PN`, `SNR`, `Cl+N`, ...) are mapped to friendly labels.
- **Getting exactly 110 (verified, with two honest edge cases):**
  - `NGC.csv` supplies 107 Messier rows; `addendum.csv` supplies **M40** (a double star, no NGC), **M45** (the Pleiades, no NGC) and a duplicate row. **M24** is the Sagittarius Star Cloud (listed as `IC4715`). That is 109 distinct numbers.
  - **M102 is genuinely disputed.** OpenNGC treats M102 as a **duplicate of M101** (it carries a `Type=Dup` row with `M=101` at M101's coordinates), so number 102 is *missing* from a naive extract. The two historical theories are (1) M102 was a duplicate observation of M101, or (2) M102 is **NGC 5866**, a lenticular galaxy in Draco. We adopt the **common modern identification, NGC 5866**, pulling its measured row from OpenNGC, and attach a per-object `note` documenting the dispute. This yields exactly **110** objects while staying honest about the ambiguity.
- **Distances deliberately omitted.** OpenNGC does not carry a single reliable distance for every deep-sky object, so `messier.json` ships **no distance field** rather than a guessed one. (The `dist_ly?` in the brief's schema is optional; omitting is the honest choice.)
- **Attribution string:** "Deep-sky objects: OpenNGC by Mattia Verga, licensed CC BY-SA 4.0 (github.com/mattiaverga/OpenNGC)."

---

## What we built - `public/data/night-sky/*.json`

Built live 2026-07-18 by `scripts/night-sky/build_catalog.py`. Real counts and sizes from this session's run:

### `stars.json` - 9,029 stars, **562.2 KB** (under the ~700 KB budget)

- **Selection:** all stars with apparent magnitude `<= 6.5` (naked-eye limit) UNION all stars with a proper name UNION every star used by a constellation figure. The **Sun (HYG id 0) is excluded** (it is a placeholder row at RA/Dec 0,0, not a night-sky star).
- **Counts:** 9,029 stars total - **8,920** at mag `<= 6.5`, **569** named (548 from HYG + 21 filled from IAU-CSN), **57** with no Hipparcos number (given negative ids, see below), **209** with `null` distance (no reliable parallax).
- **Schema - columnar arrays-of-arrays** (to stay compact), documented in `meta.columns` and duplicated at the top level `columns`. Column order:
  ```
  ["id", "ra", "dec", "mag", "ci", "dist_ly", "spect", "name", "bayer", "con"]
  ```
  | Field | Meaning / units |
  |---|---|
  | `id` | int. **Positive = Hipparcos (HIP) number; negative = -(HYG database id)** for the 57 stars with no HIP. This lets `constellations.json` reference stars unambiguously. |
  | `ra` | **degrees**, J2000 (0..360). Converted from HYG decimal-hours RA (x 15). |
  | `dec` | **degrees**, J2000 (-90..+90). |
  | `mag` | apparent visual magnitude. |
  | `ci` | colour index **B-V** (drives star colour); `null` if absent. |
  | `dist_ly` | distance in **light-years** (parsecs x 3.26156); `null` if HYG has no reliable parallax. |
  | `spect` | short spectral type (e.g. `A0`, `K5`, `M2`); `null` if absent. |
  | `name` | IAU/WGSN proper name; `null` if unnamed. |
  | `bayer` | Bayer designation abbreviation (e.g. `Alp`); `null` if none. |
  | `con` | constellation abbreviation (e.g. `CMa`); `null` if none. |
  - Example (Sirius): `[32349, 101.2872, -16.7161, -1.44, 0.009, 8.6, "A0", "Sirius", "Alp", "CMa"]`.
  - `stars.json -> meta.license` = **CC BY-SA 4.0** (share-alike from HYG); `meta.attribution` holds the verbatim credit.

### `constellations.json` - 88 constellations, 656 segments, **14.0 KB**

- Schema: `{abbr, name, lines: [[starId, starId], ...]}` where each `starId` is an `id` present in `stars.json` (same positive-HIP / negative-HYG scheme).
- **0 dropped segments, 0 unresolved HR ids** (integrity verified: every referenced id exists in `stars.json`).
- `meta` records the CC BY 4.0 license, the attribution string, and a `cultural_note` flagging that the lines are a human overlay.

### `messier.json` - 110 objects, **13.0 KB**

- Schema: `{m, ngc, name, ra, dec, mag, type, con[, note]}`; `ra`/`dec` in **degrees** (J2000). `ngc` is `null` for objects without one (M40, M45, M24, ...). No distance field (see above). M102 carries a `note` about the NGC 5866 dispute.

---

## Rejected / flagged items

- **HYG README RA units are wrong for v4.4.** The field doc says "Degrees"; the real data is **decimal hours** (verified: Sirius `ra=6.7525`). We convert `x 15` to degrees. Trusting the README would rotate the whole sky by 15x. Flagged prominently in the build script.
- **HYG CSV is Git-LFS** - the plain `raw` URL yields a ~130-byte pointer, not data. Use the `/media/` endpoint. Flagged.
- **Stellarium `constellationship.fab`: rejected (GPL).** Copyleft conflict with a permissive repo.
- **dcf21 `constellation_lines_iau.dat`: rejected.** The README claims CC BY 4.0 for the IAU figures, but the **file header itself is stamped GPL v3** (c) Dominic Ford. The contradiction makes the terms unclear/restrictive, so it is disqualified. We chose the unambiguously CC BY 4.0 MarcvdSluys data instead.
- **HYG CC BY-SA share-alike is a real obligation, handled.** The derived `stars.json` is a modified CC BY-SA dataset, so it is released under **CC BY-SA 4.0** (recorded in its meta). This binds the *data file*, not the app's code. A purely-PD path (assemble Hipparcos + Yale BSC from VizieR) exists but was not needed.
- **M102 identity is disputed** - duplicate of M101 vs NGC 5866. We adopt NGC 5866 (the common modern convention) and note the dispute per-object. Honest, not silent.
- **No deep-sky distances shipped** - OpenNGC lacks a single reliable distance per object; we omit rather than guess.
- **No CORS test performed / needed.** The build runs offline and commits static JSON to the repo; the browser never calls these catalogs directly (same pattern as the wind and exoplanet data). If a future feature fetches any of these hosts from the browser, CORS must be verified first.
- **Proper motion & precession are ignored for present-day display** - see `docs/NIGHT_SKY_PHYSICS.md`. Sub-arcminute over decades, negligible at map zoom; the existing `lib/precession.ts` covers the millennial "pole star changes" story separately.

---

**Verification methodology note:** the HYG version, LFS media path, columns and the RA-in-hours gotcha come from a **live download and inspection** of `hyg_v44.csv.gz` (2026-07-18); the constellation license was read from `readme.org`, `CITATION.cff` and `LICENSE`, and the dcf21 GPL stamp from the header of the actual `.dat` file; the IAU-CSN license from the file header; the OpenNGC license from its README and the Messier extraction (including the M102 edge case) from a live parse of `NGC.csv` + `addendum.csv`. All star / constellation / Messier counts and file sizes are from this session's run of `scripts/night-sky/build_catalog.py`. See `docs/NIGHT_SKY_PHYSICS.md` for the measured / computed / cultural contract.

---

## Integration log (Phase 11)

Populate at integration time (per the planetary-data-ingestion rule) as the app wires these in.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Star field | `stars.json` (HYG v4.4 subset, CC BY-SA 4.0) | `public/data/night-sky/stars.json`, built by `scripts/night-sky/build_catalog.py` | 9,029 stars; columnar schema; RA in degrees; attribution in `meta.attribution`; `stars.json` itself is CC BY-SA 4.0. |
| Constellation figures | `constellations.json` (MarcvdSluys, CC BY 4.0) | `public/data/night-sky/constellations.json` | 88 figures / 656 segments; label as a cultural overlay; ids reference `stars.json`. |
| Star labels | HYG `proper` + IAU-CSN (WGSN) | `stars[].name` | 569 named; IAU WGSN is the naming authority. |
| Deep-sky markers | `messier.json` (OpenNGC, CC BY-SA 4.0) | `public/data/night-sky/messier.json` | 110 objects; M102 = NGC 5866 (noted); no distances. |
| Required attributions | this doc (verbatim strings) | app about/credits + README + this doc | HYG (CC BY-SA), MarcvdSluys (CC BY), OpenNGC (CC BY-SA), IAU WGSN (CC BY). |
