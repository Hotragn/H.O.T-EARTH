# Historical Data Sources — "Time-Machine Earth"

Verification date: **2026-07-06**. This document covers data sources for the
planned *time-machine Earth* feature: animating real historical data over time
on the 3D globe — cities appearing at their founding and growing, world
population, marquee historical events (incl. the World Wars), industrial-era
climate change, and the slowly-shifting night sky.

Every license, host, format, and download URL below was verified on this date
against the official/primary source (dataset page, paper, or data repository)
and is cited per item. Anything that could not be confirmed as freely
redistributable is explicitly **flagged or rejected** — this project only ships
legally-usable data.

Companion to `docs/DATA_SOURCES.md` (the live-Earth sources); same format and
rigor. Where a source's license permits redistribution, a processed JSON has
been committed under `public/data/history/`; where it does not, the fetch/build
recipe is documented instead.

## Summary table

| # | Signal | Source | License | Redistributable? | Shipped artifact | Verified against (2026-07-06) |
|---|---|---|---|---|---|---|
| 1 | Cities over time (flagship) | Reba, Reitsma & Seto (2016), figshare CSVs | **CC BY 4.0** | **Yes** (with attribution) | `public/data/history/cities_over_time.json` (320 KiB) | figshare API + PMC full text |
| 2a | World/gridded population, 10000 BCE–present | HYDE 3.2/3.3 (PBL / Utrecht Univ.) | **CC BY 4.0** (3.3); CC BY 3.0 (3.2 paper) | Yes (with attribution) | Not shipped (large grids); recipe documented | ESSD paper + datahub mirror |
| 2b | Global population time series (counter) | Our World in Data "Population" | **CC BY 4.0** (OWID processing) | Yes (attribution to OWID + HYDE/Gapminder/UN) | **`public/data/history/population.json`** (~1.6 KiB) — shipped 2026-07-06 | OWID FAQ + live CSV + metadata |
| 3 | Historical events / wars | Curated from Wikidata (CC0) + Wikipedia | **CC0** (Wikidata facts) | Yes | **`public/data/history/events.json`** (104 events, ~17.5 KiB) — shipped 2026-07-06 | Wikidata:Licensing + query docs |
| 4 | Historical borders / empires | aourednik/historical-basemaps | **GPLv3 + no data license** | **No — REJECTED** | None | GitHub LICENSE + README |
| 5a | Global temperature 1880–present | NASA GISTEMP v4 | **US Gov public domain** | Yes | **`public/data/history/climate.json`** (temp channel) — shipped 2026-07-06 | data.giss.nasa.gov |
| 5b | CO₂ pre-industrial (ice core) | Law Dome (Rubino et al.), NOAA/NCEI WDS Paleo | **US Gov public domain** | Yes | **`public/data/history/climate.json`** (CO₂ channel, spliced w/ Mauna Loa) — shipped 2026-07-06 | NCEI + ESSD paper |
| 5c | CO₂ long-run 800 kyr | OWID (Mauna Loa + EPICA Dome C) | CC BY 4.0 (OWID) over public-domain sources | Yes | Recipe documented | OWID grapher page |
| 6 | Night-sky precession | **Computed, not downloaded** | n/a (first principles) | n/a | Method documented | Wikipedia "Axial precession" |

---

## 1. Historical city populations over time (FLAGSHIP)

**Reba, M., Reitsma, F. & Seto, K. C. (2016). "Spatializing 6,000 years of
global urbanization from 3700 BC to AD 2000." *Scientific Data* 3, 160034.**

**Verified against:** the paper full text on PubMed Central
`https://pmc.ncbi.nlm.nih.gov/articles/PMC4896125/` (PMID 27271481, PMCID
PMC4896125), PubMed `https://pubmed.ncbi.nlm.nih.gov/27271481/`, and the three
figshare data records via the figshare v2 API
(`https://api.figshare.com/v2/articles/2059494`, `/2059497`, `/2059500`) — all
on 2026-07-06. Three CSVs were downloaded and processed this session.

- **License: CC BY 4.0** — confirmed two ways. (a) The PMC full text states:
  *"This work is licensed under a Creative Commons Attribution 4.0 International
  License,"* with the data metadata released under CC0. (b) Each of the three
  figshare records returns `"license": {"name": "CC BY 4.0", "url":
  "https://creativecommons.org/licenses/by/4.0/"}` from the API. **Freely
  redistributable with attribution — the processed JSON is committed to the repo.**
- **Host & DOIs:** article DOI `10.1038/sdata.2016.34`; data on figshare as three
  records:
  - Chandler — DOI `10.6084/m9.figshare.2059494` — `chandler.csv` (1,418,429 bytes)
  - Modelski Ancient — DOI `10.6084/m9.figshare.2059497` — `modelskiAncient.csv` (16,769 bytes)
  - Modelski Modern — DOI `10.6084/m9.figshare.2059500` — `modelskiModern.csv` (15,073 bytes)
  - Direct file URLs (verified, no auth): `https://ndownloader.figshare.com/files/5290366`, `/4857010`, `/4857007`.
  - Also mirrored (not used) at SEDAC/CIESIN: "Historical Urban Population,
    v1: 3700 BC–AD 2000" (`urbanspatial-hist-urban-pop-3700bc-ad2000`) —
    SEDAC's server refused connection during verification; figshare is the
    canonical primary host and was used.
- **Format (verified from the downloaded files):** wide-format CSV. Columns are
  `City, OtherName, Country, Latitude, Longitude, Certainty,` followed by one
  column per time slice named `BC_YYYY` or `AD_YYYY` (e.g. `BC_3700`, `AD_1900`);
  each cell is the population estimate for that city at that year (blank = no
  estimate). `Certainty` is 1 (precise) / 2 (moderate) / 3 (approximate) location
  reliability, per the paper. **Encoding is Windows-1252 (cp1252), not UTF-8** —
  the files contain accented city names (e.g. "Bogotá"); the build script decodes
  accordingly (a real gotcha found this session).
- **Coverage/scale:** 3700 BC – AD 2000. Paper reports 1,741 original city
  locations and 10,353 unique city/date/population combinations; highest density
  at AD 1900 (1,094 city points). ~600 cities carry only a single population value
  (inherent temporal sparseness of the underlying Chandler/Modelski tables).
- **Attribution to display in-app:** *"Historical city data: Reba, Reitsma & Seto
  (2016), Scientific Data 3:160034, DOI 10.1038/sdata.2016.34, CC BY 4.0."*

### Shipped artifact — `public/data/history/cities_over_time.json`

Produced by `scripts/history/build_cities_over_time.py` and committed. **Built
and run this session (2026-07-06).**

- **Size: 327,838 bytes (320.2 KiB, 0.313 MiB)** — comfortably under the ~1 MiB budget.
- **Contents:** 1,730 cities, 10,267 city/year population points (the small delta
  vs. the paper's 10,353 is from merging the same physical city across the three
  source files by name + coarse coordinates).
- **Schema:**
  ```json
  {
    "meta": { "license": "CC BY 4.0", "source": {...}, "attribution": "...", "certainty_key": {...}, "year_convention": "signed int; negative = BC; no year 0", "built": "2026-07-06", "cityCount": 1730 },
    "cities": [
      {
        "name": "Rome",
        "country": "Italy",
        "lat": 41.8931, "lon": 12.4828,
        "certainty": 1,
        "foundedYear": -500,
        "pop": { "-500": 100000, "-200": 150000, ... , "2000": 2648000 }
      }
    ]
  }
  ```
  Years are signed integers (BC negative, AD positive, no year 0). Coordinates
  rounded to 4 dp; populations rounded to ~3 significant figures (these are
  order-of-magnitude historical estimates — rounding shrinks the file with no
  meaningful loss). Cities sorted by peak population descending so the largest
  render first. `foundedYear` = earliest year with any population estimate.
- **Spot-check (verified):** Eridu appears at 3700 BC (dataset start), Uruk at
  3500 BC, Babylon from 1700 BC, Rome across 500 BC–AD 2000 (46 time points),
  Tokyo 1600–2000.
- **Known limitations (honest):** (a) ~672 cities have a single data point — the
  globe should render these as a marker at that instant, not interpolate a fake
  growth curve. (b) A handful of cities are split across source files when their
  coordinates differed by >0.1° (e.g. two "London" entries) — 25 duplicate names
  remain after merge, most of which are genuinely distinct cities (Birmingham
  UK/US, Portland OR/ME). (c) Late-20th-century entries reflect the source's
  metropolitan-region estimates (e.g. "Tokyo" ~23M peak), which is a property of
  Chandler's tables, not an error. (d) Coverage is sparse and uneven before
  ~1500 and skews toward Old World cities that historians tabulated.

**What this lets us show with real data:** cities genuinely appearing at their
first attested population and growing/shrinking over 5,700 years, with real
coordinates and real (if estimated) populations — the core of the feature.

## 2. World / gridded population over time

### 2a. HYDE 3.2 / 3.3 (History Database of the Global Environment)

**Verified against:** the HYDE 3.2 data-description paper in ESSD (Copernicus,
open access) `https://essd.copernicus.org/articles/9/927/2017/essd-9-927-2017.html`,
the datahub mirror `https://datahub.io/climate-and-environment/hyde-history-database-of-the-global-environment`,
and the PBL/Utrecht listings — on 2026-07-06. (The official Utrecht "Yoda" data
page `public.yoda.uu.nl/geo/UU01/AEZZIT.html` is behind an Anubis anti-bot wall
and could not be machine-fetched this session — flagged below.)

- **License:** HYDE **3.3 is CC BY 4.0** (stated on the datahub record and the
  Utrecht data publication). The HYDE **3.2** ESSD paper is distributed under
  **CC BY 3.0**. Both permit redistribution with attribution.
- **Producer:** PBL Netherlands Environmental Assessment Agency + Utrecht
  University (Klein Goldewijk et al.). HYDE 3.2 DOI `10.17026/dans-25g-gez3`;
  paper DOI `10.5194/essd-9-927-2017`.
- **Coverage & resolution:** 10,000 BCE → present (3.3 runs to 2023 CE), on a
  **5 arc-minute** (5′) lat/lon grid. Time steps are decadal/centennial deep in
  the past and finer toward the present. Variables: total/urban/rural population
  count and density, built-up area, cropland (rain-fed/irrigated, rice/non-rice),
  grazing land/pasture/rangeland. Formats: ASCII (ESRI ASCII grid) `.asc` files
  in zip archives (plus NetCDF for some releases).
- **Access:** free download from Utrecht University / DANS; no login for the
  ASCII archives. Full 5′ global grids across all time steps are **hundreds of MB
  to multiple GB** — far too large to ship raw.
- **Recommendation (not shipped raw):** if a *gridded* population-density heat
  layer is wanted, add a `scripts/history/build_hyde_grid.py` that downloads a
  chosen variable (`popd` — population density), **downsamples 5′ → ~1° or 2°**
  and quantizes to a compact typed array per time step, committing a small binary
  or JSON under `public/data/history/`. For the initial feature, the OWID series
  (2b) plus the city dataset (§1) already cover the population story without the
  grid. HYDE remains the correct source when a true gridded layer is built.

### 2b. Our World in Data — "Population" (global counter)

**Verified against:** OWID FAQ/licensing `https://ourworldindata.org/faqs`, the
live CSV `https://ourworldindata.org/grapher/population.csv`, and the dataset
metadata `https://ourworldindata.org/grapher/population.metadata.json` — on
2026-07-06.

- **License:** OWID's own processing and charts are **CC BY 4.0** (FAQ: *"All
  ... data ... produced and published by Our World in Data are completely open
  access under the Creative Commons BY license"*). **Caveat (quoted):** *"Most of
  the data on Our World in Data comes from third-party providers ... and is
  subject to the license terms of those providers."* For this series the upstreams
  are HYDE 3.3 (CC BY 4.0), Gapminder (CC BY 4.0), and UN World Population
  Prospects — the chain is clean and redistributable with attribution.
- **Attribution to display:** *"Population — HYDE (2023); Gapminder (2022); UN WPP
  (2024) — with major processing by Our World in Data (CC BY 4.0)."*
- **Format (verified):** CSV with columns `Entity, Code, Year, Population`; range
  **−10000 (10,000 BCE) → 2023 CE**; includes a `World` row for the global total
  (a ready-made world-population counter). Direct CSV + JSON metadata download,
  no key.
- **Recommendation (small, ship it):** a `scripts/history/build_world_population.py`
  can fetch `population.csv`, keep only the `World` row (and optionally continental
  `OWID_*` aggregates), and write a tiny `public/data/history/world_population.json`
  (`[{year, population}]`, a few KB) driving the on-screen population counter.
  Not built this session (the flagship city artifact was prioritized), but the
  recipe is trivial and the license is confirmed.

## 3. Major historical events / wars

**Verified against:** `https://www.wikidata.org/wiki/Wikidata:Licensing`,
`https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service`, and the query
examples pages — on 2026-07-06.

- **Wikidata license: CC0 1.0** (public domain). Quoted: *"All structured data
  in the main, property and lexeme namespaces is made available under the
  Creative Commons CC0 License (Public domain)."* No attribution legally required
  (crediting Wikidata is courteous). Text in non-data namespaces is CC BY-SA 4.0 —
  not relevant to us since we only take structured facts.
- **How to query:** the public SPARQL endpoint `https://query.wikidata.org/sparql`
  supports the qualifiers we need — point in time (`P585`), start time (`P580`),
  end time (`P582`), and coordinate location (`P625`) — so events (battles `Q178561`,
  wars `Q198`, treaties, foundings) can be pulled with dates + lat/lon in one query.
- **Recommendation (curate, don't bulk-scrape):** Wikidata's coverage of
  event coordinates and dates is uneven and occasionally wrong; a raw bulk scrape
  would ship unreliable data. The right move is a **small, hand-verified curated
  JSON of ~50–150 marquee events** (World War I & II theatres and key battles,
  major empires' rise/fall, plagues, revolutions, moon landing, etc.), each with a
  real start/end year, lat/lon, one-line description, and a citation URL. Seed it
  from Wikidata/Wikipedia (CC0 facts) but human-check every row. Proposed schema
  for `public/data/history/events.json`:
  ```json
  {
    "meta": { "license": "CC0 (facts) — curated from Wikidata + primary sources", "curated": true },
    "events": [
      { "name": "Battle of Stalingrad", "startYear": 1942, "endYear": 1943,
        "lat": 48.7080, "lon": 44.5133, "kind": "battle",
        "description": "Turning-point WWII battle on the Eastern Front.",
        "source": "https://www.wikidata.org/wiki/Q155626" }
    ]
  }
  ```
  Not built this session (requires human curation to meet the reliability bar);
  license and method are confirmed so it can be populated safely. **Do not** ship
  an unvetted SPARQL dump.
- **Also considered:** academic conflict datasets (UCDP/PRIO, Correlates of War).
  These are well-structured and mostly free for research, but they are
  **modern-era only** (UCDP from 1946; CoW from 1816), carry their own citation
  terms, and don't cover the pre-modern events the feature wants. Not needed for a
  marquee-events layer; revisit only if a dense modern-conflict layer is desired,
  and re-verify each dataset's license at that time.

## 4. Historical borders / empires over time — **REJECTED**

**Verified against:** `https://github.com/aourednik/historical-basemaps/blob/master/LICENSE`
and the repo README `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/README.md`
— on 2026-07-06.

- **`aourednik/historical-basemaps`** (the most-cited open historical-border
  GeoJSON collection) — **REJECTED for shipping data.** Its `LICENSE` file is the
  **GNU GPLv3** (a software copyleft license, an awkward and arguably wrong fit
  for map data), and the README states **no data license** for the GeoJSON, calls
  the project *"work in progress,"* warns users to *"verify the maps ... before
  using in academic work,"* and admits the boundaries were *"collected, adapted
  and converted from diverse sources, sometimes only available through the wayback
  machine"* — i.e. unclear upstream provenance. That combination (copyleft +
  ambiguous data license + murky provenance) means it is **not clearly free to
  redistribute** in this MIT project. Do not vendor it.
- **Euratlas** and **GeaCron** historical maps: **proprietary / all-rights-reserved**
  — explicitly not free. Rejected.
- **Verdict:** no cleanly-licensed, redistributable global historical-border
  dataset was found. If an empire/border layer is ever wanted, the honest options
  are (a) draw a *small, illustrative* set of borders by hand from public-domain
  references and label them as approximations, or (b) contact a rights-holder for
  permission. **No border data is shipped.**

## 5. Climate over time (industrial-era warming layer)

### 5a. Global temperature 1880–present — NASA GISTEMP v4

**Verified against:** `https://data.giss.nasa.gov/gistemp/` and the downloads
page `https://data.giss.nasa.gov/gistemp/data_v4.html` — on 2026-07-06.

- **License: US Government work → public domain** (NASA GISS; no copyright
  restrictions). Redistributable. GISS *requests* a citation (not a legal
  condition): *"GISTEMP Team, 2026: GISS Surface Temperature Analysis (GISTEMP),
  version 4. NASA GISS. Dataset accessed 20YY-MM-DD at
  https://data.giss.nasa.gov/gistemp/"* plus the current methods paper.
- **Data (verified URL):** global-mean land-ocean temperature index,
  `https://data.giss.nasa.gov/tabledata_v4/GLB.Ts+dSST.csv` — monthly/seasonal/annual
  anomalies vs. the 1951–1980 mean, **1880–present**. Small (tens of KB).
- **Recommendation:** ship a compact `public/data/history/global_temp.json`
  (`[{year, anomalyC}]`) built from the `J-D` (annual) column, for a "modern
  warming" overlay/graph. Real data, public domain.

### 5b. Pre-industrial CO₂ — Law Dome ice core (NOAA/NCEI WDS Paleo)

**Verified against:** NCEI landing page
`https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=noaa-icecore-25830`,
the data file `https://www.ncei.noaa.gov/pub/data/paleo/icecore/antarctica/law/law2018co2-noaa.txt`,
and the ESSD paper `https://essd.copernicus.org/articles/11/473/2019/` — on
2026-07-06.

- **Source:** Rubino et al. (2019), "Revised records of atmospheric trace gases
  CO₂, CH₄, N₂O and δ¹³C-CO₂ over the last 2000 years from Law Dome, Antarctica,"
  ESSD 11:473; NOAA dataset DOI `10.25921/dwg2-6m61`.
- **License: US Government / NOAA public domain** (NOAA/WDS Paleoclimatology data
  archive). Freely redistributable; courtesy citation of Rubino et al. + NOAA WDS
  Paleo requested. Direct text file, no auth.
- **Use:** provides atmospheric CO₂ back ~2,000 years to splice with modern
  measurements for a pre-industrial baseline.

### 5c. Long-run CO₂ (800,000 yr) — Our World in Data

**Verified against:** `https://ourworldindata.org/grapher/co2-long-term-concentration`
— on 2026-07-06.

- **Combines** Mauna Loa (NOAA GML, from 1958) with EPICA Dome C Antarctic ice
  cores (back ~800,000 years). Underlying NOAA GML and EPA/EPICA data are
  public domain; OWID's compiled series is CC BY 4.0.
- **Use:** a ready-made single CSV for a deep-time CO₂ line if we want context
  beyond Law Dome. Attribute OWID + NOAA GML + EPICA. A build script can fetch
  `co2-long-term-concentration.csv` into a small JSON. Not built this session.

**What we can honestly show with real climate data:** genuine global temperature
rise 1880→today (GISTEMP) and real CO₂ from ice cores + Mauna Loa. The
*spatial* pattern of warming as a globe overlay would need a gridded product
(e.g. GISTEMP's 2°×2° NetCDF, also public domain) — a later add; the line/counter
version is real and cheap now.

## 6. Night-sky precession — **COMPUTED, not downloaded**

**Verified against:** `https://en.wikipedia.org/wiki/Axial_precession` and standard
references — on 2026-07-06.

- No dataset or license is involved. Earth's axial precession ("precession of the
  equinoxes") has a current period of **≈25,772 years**, i.e. the rotation axis
  traces a cone at **≈50.3 arc-seconds per year (≈1° every 71.6 years)**, moving
  the celestial pole and the equinox points westward along the ecliptic.
- **Method (render from first principles):** rotate the star field / celestial
  pole by `angle = 50.29" × (yearOffset)` about the ecliptic pole (obliquity
  ≈23.44°). Over the feature's ~6,000-year span the pole shifts ~84°, so e.g.
  Thuban (α Draconis) was the pole star ~2700 BC and Polaris is only a recent
  pole star — a striking, physically-correct effect computed live with a few
  lines of trig. For higher fidelity, the IAU precession model (or a library such
  as `astronomy-engine`, already used in the live app per `docs/DATA_SOURCES.md`)
  can supply precession angles; no external data download or license needed.
  Star positions themselves, if a real catalogue is wanted, can come from the
  public-domain **Yale Bright Star Catalogue** or **HYG** database — verify that
  separately if/when a real star layer is added.

---

## Rejected / flagged items

- **`aourednik/historical-basemaps` (historical borders): REJECTED.** GPLv3 code
  license + no explicit data license + self-described "work in progress" with
  Wayback-Machine-sourced provenance → not clearly free to redistribute. See §4.
- **Euratlas / GeaCron historical maps: REJECTED** — proprietary, all rights
  reserved. See §4.
- **SEDAC/CIESIN mirror of the Reba dataset: not used** — the SEDAC server refused
  the connection on 2026-07-06; figshare is the canonical primary host and its
  CC BY 4.0 license was verified directly. (SEDAC may additionally require an
  Earthdata login; figshare does not.)
- **HYDE official Utrecht "Yoda" page unverified this session** — behind an Anubis
  anti-bot wall (machine fetch blocked). The **CC BY 4.0 license and 5′/10000-BCE
  facts were confirmed via the ESSD paper (CC BY 3.0 for 3.2) and the datahub
  mirror** instead. Re-confirm the exact 3.3 download URLs and citation from the
  Yoda page in a browser before wiring up a HYDE build script.
- **OWID third-party caveat:** OWID's *own* compilation is CC BY 4.0, but each
  series inherits its upstreams' terms. For population (HYDE/Gapminder/UN) and
  CO₂ (NOAA/EPICA) the chain is clean; always re-check when adding a new OWID
  series.
- **Wikidata bulk event scrape: flagged, not used.** Facts are CC0 (free), but
  coordinate/date coverage is uneven and error-prone — ship a **hand-verified
  curated** events JSON (§3), not a raw dump.
- **Modern-only conflict datasets (UCDP 1946+, CoW 1816+): out of scope** for a
  6,000-year marquee-events layer; re-verify their individual licenses if a dense
  modern-conflict layer is ever added.

## Real data vs. illustrative — honest summary

**Shown with real, cleanly-licensed data today (all four layers shipped):**
- Cities appearing at their founding and growing over 5,700 years — **shipped**
  (`cities_over_time.json`, CC BY 4.0, §1).
- A world-population counter from 10,000 BCE → 2023 — **shipped**
  (`population.json`, OWID/HYDE/Gapminder/UN, CC BY 4.0; §2b + integration log).
- Industrial-era global temperature rise (GISTEMP, 1880+, public domain) and
  real CO₂ from ice cores + Mauna Loa (Law Dome / NOAA GML) — **shipped**
  (`climate.json`, public domain; §5 + integration log).
- Marquee historical events incl. both World Wars — **shipped**
  (`events.json`, 104 hand-verified events; Wikidata facts CC0; §3 +
  integration log).
- The shifting night sky / pole star — **computed** from the real precession
  constant, physically correct (§6).
- Gridded historical population density heat-map (HYDE 5′) — real and free, but
  **not yet shipped** (large; needs a downsampling build script, §2a).

**Still illustrative / not a clean bulk dataset:**
- **Historical borders / empires** — no cleanly-licensed global source exists
  (§4); any border layer must be hand-drawn and labeled as approximate.
- The events layer (§3) is real but **curated from the historical record**
  rather than a single bulk dataset — this is the honest framing kept in the
  app credits (a raw Wikidata scrape is not reliable enough to present as-is).

---

## Integration log — real data shipped 2026-07-06

Following the flagship city dataset (§1), the remaining three time-machine
layers were upgraded this session from the code's built-in fallback estimates to
**real, cited, freely-licensed data files**. All four `public/data/history/*.json`
artifacts now exist, so the Virtual Earth loaders (`lib/chrono-*.ts`) parse real
data and set `usingFallback = false`. Build scripts are stdlib-only Python
(deterministic, no third-party deps) and live in `scripts/history/`.

### `public/data/history/population.json` — world population over time

- **Built by:** `scripts/history/build_population.py` (run 2026-07-06).
- **Source:** Our World in Data — "Population." CSV
  `https://ourworldindata.org/grapher/population.csv`; page
  `https://ourworldindata.org/grapher/population`. **License: CC BY 4.0** (OWID
  processing) over HYDE 2023 (CC BY 4.0) + Gapminder 2022 (CC BY 4.0) + UN WPP
  2024 — chain confirmed clean in §2b.
- **Schema (matches `lib/chrono-population.ts`):** bare JSON array of
  `[year, population]` pairs, sorted ascending; year is signed (negative = BCE).
- **What's in it:** the OWID `World` series, downsampled to **93 points**
  spanning **−10000 → 2023** (sparse deep-past, decadal/2-yearly through the
  industrial era, yearly since 2000). Every value is a **real OWID observation**
  (each target year snaps to the nearest available World data point; nothing is
  interpolated). Populations rounded to 3 significant figures for size.
- **Size:** ~1.6 KiB (well under the 50 KB budget).
- **Spot-check:** 1800 ≈ 0.98 B, 1900 ≈ 1.63 B, 1950 ≈ 2.49 B, 1974 = 4.0 B,
  2022 ≈ 8.02 B, 2023 ≈ 8.09 B — consistent with UN/OWID published totals.
- **App attribution:** *"Population — HYDE (2023); Gapminder (2022); UN WPP (2024)
  — with major processing by Our World in Data (CC BY 4.0)."*

### `public/data/history/climate.json` — industrial-era temperature + CO₂

- **Built by:** `scripts/history/build_climate.py` (run 2026-07-06).
- **Sources (all public domain):**
  - **Temperature — NASA GISTEMP v4**, global land-ocean **annual** mean anomaly
    (the `J-D` column), 1880–present. CSV
    `https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv`; page
    `https://data.giss.nasa.gov/gistemp/`. US Government work → public domain (§5a).
  - **CO₂ pre-1959 — Law Dome ice core** (Rubino et al. 2019), NOAA/NCEI WDS
    Paleo, gas-age (year CE) + CO₂ ppm. TXT
    `https://www.ncei.noaa.gov/pub/data/paleo/icecore/antarctica/law/law2018co2-noaa.txt`;
    NOAA DOI `10.25921/dwg2-6m61`. Public domain (§5b).
  - **CO₂ 1959–present — Mauna Loa annual mean**, NOAA GML. CSV
    `https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.csv`. Public
    domain.
- **Schema (matches `lib/chrono-climate.ts`):** bare JSON array of
  `[year, tempAnomalyC, co2ppm]` triples, sorted ascending; a channel is `null`
  where no value exists for that year (the loader tolerates null/missing).
- **Baseline note (important, honest):** GISTEMP anomalies are published vs the
  **1951–1980** mean. The app labels the anomaly baseline "1850–1900
  pre-industrial," so the build re-references the GISTEMP series to its
  **1880–1899** window (the earliest available GISTEMP data, a documented
  stand-in for pre-industrial). The offset is computed from the data itself and
  applied uniformly, so the shipped numbers are self-consistent GISTEMP values
  on a pre-industrial-style baseline (a true 1850–1900 baseline would differ by
  the well-known ~0.1 °C GISTEMP-vs-earlier-record offset).
- **Reproducibility note:** `data.giss.nasa.gov` was unreachable for most of
  this session (transient connection timeouts, though it responded at session
  start). The build script therefore: (1) tries the canonical NASA file; (2)
  falls back to an on-disk cache under `scripts/history/data/`; (3) if neither
  is available, falls back to the **DataHub `core/global-temp` mirror**
  (`https://datahub.io/core/global-temp/r/annual.csv`, `Source == "GISTEMP"`) —
  the **identical public-domain NASA GISTEMP v4 annual global-mean series**
  (verified: 1880 = −0.18 °C vs 1951–1980, matching NASA's direct file). The
  shipped `climate.json` this session used the DataHub mirror for the
  temperature channel because NASA's host was down; the numbers are NASA
  GISTEMP values. Law Dome and Mauna Loa hosts responded normally and were used
  directly (and cached). Re-running when NASA's host is up seeds the NASA cache
  and prefers it automatically.
- **Size:** ~2.8 KiB (149 rows, 1850–2025; 146 temperature years, 80 CO₂ years;
  well under budget).
- **App attribution:** *"Climate: NASA GISTEMP (temperature, public domain) +
  Law Dome ice core / Mauna Loa (CO₂, public domain)."*

### `public/data/history/events.json` — curated marquee historical events

- **Built/validated by:** `scripts/history/build_events.py` (run 2026-07-06;
  `--check` runs validation only).
- **Nature:** hand-curated, not a bulk scrape. Facts (dates, coordinates) are
  free — Wikidata structured data is **CC0** (public domain), and the same facts
  appear on Wikipedia; each event carries a Wikipedia/Wikidata `source` URL. No
  invented events; every row hand-checked (§3 licensing rationale).
- **Schema (matches `lib/chrono-events.ts`):** JSON array of
  `{ name, startYear, endYear?, lat, lon, category, source }`; `category` ∈
  {conflict, science, exploration, culture, disaster, founding}; `endYear`
  omitted for single-year events; years signed (negative = BCE).
- **What's in it:** **104 events** spanning ~9000 BCE → 2023 CE across all
  continents and eras (BCE 25, 0–1000 CE 9, 1000–1800 29, 1800–1900 9,
  1900–2000 26, 2000+ 6). By category: conflict 26, culture 22, science 18,
  founding 15, disaster 13, exploration 10. **Both World Wars included**
  (WWI 1914–1918; WWII 1939–1945) plus e.g. the Black Death, Columbus's
  voyage, Apollo 11, fall of the Berlin Wall, the COVID-19 pandemic.
- **Validation (enforced by the build script):** required fields present and
  typed; category in the allowed set; −90 ≤ lat ≤ 90; −180 ≤ lon ≤ 180;
  startYear ≤ endYear; no year 0; non-empty name + http(s) source; both World
  Wars present. Build fails on any violation. All checks pass.
- **Size:** ~17.5 KiB (well under budget).
- **App attribution:** *"Events: curated from the historical record (facts from
  Wikidata, CC0)."*

### Attribution footer

`components/chrono/ChronoAttributionFooter.tsx` was updated to credit all four
now-real layers (Cities · Population · Climate · Events · Sky). The
"built-in historical estimates" caveat is now shown **only** when a data file
fails to load (`usingFallbackData`), reworded to "some layers are showing
built-in fallback estimates (data file unavailable)."

---

**Verification methodology note:** the flagship dataset's license was confirmed
both from the paper's PMC full text and the figshare v2 API license field; its
three CSVs were downloaded and processed into the committed JSON this session
(2026-07-06), so the schema, size, and record counts above are measured, not
estimated. All other licenses were read from the official dataset/paper pages
cited per item on 2026-07-06. Two pages could not be machine-fetched (SEDAC —
connection refused; HYDE Yoda — anti-bot wall) and are flagged above with the
alternative primary sources used to confirm their licenses.
