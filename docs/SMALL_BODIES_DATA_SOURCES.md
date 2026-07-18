# Small-Bodies Data Sources (Phase 9 — comets & near-Earth asteroids)

Verification date: **2026-07-10**. Every endpoint, field name, unit, usage-policy string and count below was verified on this date against the official NASA/JPL SSD/CNEOS API documentation pages and/or **live API queries** (noted per item). Anything not verifiable from an official source is explicitly flagged. Same rigor and honesty bar as `DATA_SOURCES.md` (Earth), `PLANETS_DATA_SOURCES.md`, `EXOPLANETS_DATA_SOURCES.md` and the Mars/Moon/dwarf-planet docs: real data, real physics, honest claims, everything free and legally usable for an MIT open-source app, every source + license logged.

Scope this phase: **comets and near-Earth / notable asteroids** — real measured orbital elements, physical parameters, taxonomic/dynamical classification, PHA status, and real Earth close approaches for a curated set of scientifically notable + pedagogically great small bodies, including the two confirmed **interstellar** visitors.

> **Honesty rule for this phase (from the project brief):** most small bodies have **NO surface imagery**. The honest substance is **real MEASURED orbital elements + physical parameters + classification + close-approach facts**, all from JPL. Every un-imaged body's *appearance* is illustrative and must be labeled so. **Special care on hazard framing:** close approaches and "Potentially Hazardous Asteroid" (PHA) status are **REAL** and are stated **factually with real numbers** — never sensationalized or fear-mongering, and never downplayed. (E.g. Apophis's 2029 approach is a real ~0.099-lunar-distance pass that will be naked-eye visible; the impact risk was **RULED OUT** — we state exactly that.) See `docs/SMALL_BODIES_PHYSICS.md` for the measured/computed/illustrative contract.

## Summary table

| Source | Data used | License / status | Acknowledgment required | Access | Verified against (2026-07-10) |
|---|---|---|---|---|---|
| **JPL Small-Body Database (SBDB) API** v1.3 | Per-object identity + flags (fullname, des, kind, orbit_class, **pha**, neo, spkid), osculating **orbital elements** (e, a, q, ad, i, om, w, ma, tp, per, n) + orbit metadata (epoch, moid, t_jup), and **physical parameters** (diameter, rot_per, albedo, spectral type, H / comet M1) | US-Government (NASA/JPL/Caltech) data; measured facts, freely usable. **No explicit license and no requested acknowledgment line** on the API pages | **No formal requirement**; courtesy credit recommended | HTTP GET, one body per call, no key, no registration | SBDB API doc page + live queries |
| **JPL/CNEOS Close-Approach Data (CAD) API** v1.5 | Real Earth close approaches (des, cd date TDB, dist/dist_min/dist_max in au, v_rel/v_inf in km/s, h, fullname) | Same US-Gov status as SBDB | Same (courtesy only) | HTTP GET, no key | CAD API doc page + live queries |
| **SSD/CNEOS API fair-use policy** | The binding usage terms for both APIs | — | — | — | `https://ssd-api.jpl.nasa.gov/` (verbatim, live) |

Committed artifact: `public/data/small-bodies/objects.json`, built reproducibly by `scripts/small-bodies/build_objects.py` (queries the SBDB + CAD APIs live and writes the JSON). This session's run: **45 objects (16 comets, 29 asteroids), 11 PHAs, 23 visited, 2 interstellar, 4 hyperbolic, 18 close approaches, 37.3 KB.**

---

## 1. JPL Small-Body Database (SBDB) API — the authoritative per-object source

**Verified against:** the SBDB API documentation (`https://ssd-api.jpl.nasa.gov/doc/sbdb.html`) and the SSD/CNEOS usage-policy page (`https://ssd-api.jpl.nasa.gov/`), plus **live queries** on 2026-07-10.

- **What it is:** NASA/JPL Solar System Dynamics' authoritative database of every known asteroid and comet — orbits, physical parameters, discovery circumstances, close approaches, and identity/classification flags. It is the reference catalog the small-body community cites (and is the same SSD service family used for the Horizons ephemerides in `DATA_SOURCES.md` §5).
- **Endpoint (verified):** `https://ssd-api.jpl.nasa.gov/sbdb.api`
- **API version:** **1.3** (documented "2021 September"; the live JSON `signature.version` returned `1.3`). Per the fair-use policy, always check the `version` field for format changes.
- **Query we use (one body per call):**
  ```
  https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=<designation>&phys-par=true&full-prec=true
  ```
  - `sstr` — object search string (a number like `99942`, a comet designation like `1P` / `C/2023 A3`, or a name). All 45 curated designations were verified to resolve unambiguously.
  - `phys-par=true` — include the physical-parameters block. (Docs: "output physical parameters (e.g., absolute magnitude: H)".)
  - `full-prec=true` — full-precision numeric values. (Docs: "output data in full precision (normally, data are returned in reduced precision for display purposes)".)
- **No API key, no registration.**

### 1a. Orbital elements returned (field / unit — verified live 2026-07-10)

Each element in `orbit.elements[]` carries `name`, `value`, `units`, `title`:

| Field | Unit | Meaning | Notes |
|---|---|---|---|
| `e` | dimensionless | eccentricity | **≥ 1 ⇒ unbound / hyperbolic** |
| `a` | au | semi-major axis | **NEGATIVE for hyperbolic orbits** (e.g. 'Oumuamua a = −1.27 au) |
| `q` | au | perihelion distance | always positive |
| `ad` | au | aphelion distance | **null when e ≥ 1** (no aphelion) |
| `i` | deg | inclination to the ecliptic (J2000) | |
| `om` | deg | longitude of the ascending node | |
| `w` | deg | argument of perihelion | |
| `ma` | deg | mean anomaly | (not shipped) |
| `tp` | JD (TDB) | time of perihelion passage | (not shipped) |
| `per` | days | sidereal orbital period | **null when e ≥ 1**; we convert to years (÷365.25) |
| `n` | deg/day | mean motion | (not shipped) |

Orbit **metadata** (in `orbit`) we also use: `epoch` [JD TDB], `soln_date`, **`moid`** [au — Earth Minimum Orbit Intersection Distance, a *measured* PHA input], `t_jup` [Tisserand parameter wrt Jupiter], and **`orbit_class` {code, name}**.

### 1b. Physical parameters returned (field / unit — verified live 2026-07-10)

Each entry in `phys_par[]` carries `name`, `value`, `units`, `title`. **Asteroids and comets expose different magnitude fields** (a real, important difference):

| Field | Unit | Meaning | Present for |
|---|---|---|---|
| `H` | mag | absolute magnitude | asteroids (and a few asteroidal objects like 'Oumuamua) |
| `M1` | mag | comet **total** absolute magnitude | comets (comets usually have **no** `H`) |
| `diameter` | km | diameter | many, not all |
| `rot_per` | h | sidereal rotation period | many, not all |
| `albedo` | dimensionless | geometric albedo | many, not all |
| `spec_T` / `spec_B` | — | Tholen / SMASSII taxonomic type | some (we prefer Tholen, else SMASSII) |
| `extent`, `GM`, `density`, `G`, `I`, ... | various | shape extent, mass param, bulk density, slope, thermal inertia | occasional |

We emit **`null` wherever SBDB has no value** — never filled in. Comets therefore usually carry `H: null` and instead a `comet_total_mag_M1` field. (Halley: `diameter 11.0 km`, `albedo 0.04`, `H null`, `M1 5.5`.)

### 1c. Classification comes straight from SBDB — not guessed

- **`pha`** — SBDB's own boolean **Potentially Hazardous Asteroid** flag. **We take it verbatim and do NOT recompute it.** (Definition, stated in `SMALL_BODIES_PHYSICS.md`: Earth MOID < 0.05 au **AND** H ≤ 22.0.) In our set, **11 objects are flagged PHA**: Apophis, Bennu, Ryugu, Itokawa, Didymos, Phaethon, Toutatis, Apollo, Florence, Icarus, Geographos.
- **`neo`** — SBDB's near-Earth-object boolean.
- **`orbit_class` {code, name}** — SBDB's dynamical class, which covers **both** the NEA classes and the comet families the brief asks for:
  - **Asteroids:** `APO` Apollo, `ATE` Aten, `AMO` Amor, `IEO` Atira/Interior-Earth, `MBA` Main-belt, `MCA` Mars-crossing.
  - **Comets:** `JFc` Jupiter-family, `HTC` Halley-type, `ETc` Encke-type, `COM` long-period, `HYP` hyperbolic comet, `HYA` hyperbolic asteroid.
- **`kind`** — `an`/`au` = asteroid numbered/unnumbered, `cn`/`cu` = comet numbered/unnumbered. We map this to `kind: "comet" | "asteroid"`. (Note 'Oumuamua's `kind` is `au`/class `HYA` — SBDB classes it as a *hyperbolic asteroid* because it showed no coma; it is still an interstellar object — see §3.)

---

## 2. JPL/CNEOS Close-Approach Data (CAD) API

**Verified against:** the CAD API documentation (`https://ssd-api.jpl.nasa.gov/doc/cad.html`) plus **live queries** on 2026-07-10.

- **Endpoint (verified):** `https://ssd-api.jpl.nasa.gov/cad.api`
- **API version:** **1.5** (documented "2023 March"; live `signature.version` = `1.5`).
- **Query we use:**
  ```
  https://ssd-api.jpl.nasa.gov/cad.api?date-min=2026-07-10&date-max=2030-01-01&dist-max=0.05&fullname=true&sort=dist
  ```
  Default close-approach body is **Earth**. (`body=ALL` and other bodies are available but we only want Earth here.)
- **Output fields (verified live, in order):** `des, orbit_id, jd, cd, dist, dist_min, dist_max, v_rel, v_inf, t_sigma_f, h, fullname` (the docs also list optional `body, diameter, diameter_sigma`).

| Field | Unit | Meaning |
|---|---|---|
| `cd` | calendar date/time, **TDB** | nominal close-approach time |
| `jd` | JD, **TDB** | same, as Julian Date (we sort on this — see gotcha below) |
| `dist` | **au** | nominal **geocentric** approach distance (Earth **center**) |
| `dist_min` / `dist_max` | au | 3-σ minimum / maximum approach distance |
| `v_rel` | **km/s** | velocity relative to Earth at the approach |
| `v_inf` | km/s | velocity relative to Earth "at infinity" |
| `h` | mag | absolute magnitude (size proxy) |
| `fullname` | — | full object name (with `fullname=true`) |

- **Distance units:** `dist` is in **au**. We also ship **lunar distances**, computed transparently as `dist_ld = dist_au × 149,597,870.7 / 384,400`. (The API can also accept `NLD` suffixes on `dist-min/-max`; we keep au and convert.) The CAD API does **not** return lunar distances as a field.
- **"Geocentric" note:** `dist` is measured to Earth's **center**. So Apophis's nominal 2029 `dist` of 0.000254 au ≈ **38,000 km from Earth's center** ≈ **~31,600 km above the surface** (subtracting Earth's ~6,378 km equatorial radius). Both figures are correct depending on the reference point; we state the geocentric-center value and note the altitude. This is exactly the kind of precision the hazard-honesty rule demands.

### 2a. Close-approach selection (documented, reproducible)

The window 2026-07-10 → 2030-01-01 at ≤ 0.05 au returns **hundreds** of approaches, most by newly-found meter-scale rocks. To ship an honest, useful ~18-item list, `build_objects.py`:
1. keeps only **sizeable** objects (`h ≤ 24`, roughly ≳ 40–60 m), so the list isn't drowned in noise;
2. takes the **18 closest** of those;
3. **guarantees Apophis's 2029-04-13 pass** is included (it is the closest sizeable approach anyway);
4. sorts the result **chronologically by `jd`** (a real gotcha: the `cd` string sorts month *names* alphabetically — "Aug" < "Jul" — so we must sort on `jd`, not `cd`).

The shipped list spans **0.099 → 4.64 lunar distances** and includes named/notable objects: **99942 Apophis** (0.099 LD, 2029), **153814 (2001 WN5)** (0.65 LD, 2028), **2024 QP2** (0.57 LD, 2028), **137108 (1999 AN10)** (1.01 LD, 2027, v_rel 26 km/s), and **35396 (1997 XF11)** (2.42 LD, 2028 — the object of a 1998 media impact scare that was quickly **ruled out**). Every value is a real CNEOS prediction.

---

## 3. Interstellar vs merely-hyperbolic — a real distinction (not a shortcut)

**`e > 1` alone does NOT mean interstellar.** SBDB's `HYP`/`HYA` classes contain **both**:
- the **two genuinely interstellar visitors** — **1I/'Oumuamua** (e ≈ 1.20, class `HYA`) and **2I/Borisov** (e ≈ 3.36, class `HYP`) — which are unbound *by origin*, arriving with large hyperbolic excess velocity from outside the solar system; **and**
- ordinary **near-parabolic Oort-cloud comets** whose *osculating* eccentricity is marginally > 1 at a given epoch — e.g. **C/2023 A3 (Tsuchinshan-ATLAS)** (e ≈ 1.0001, a ≈ −4107 au) and **C/2012 S1 (ISON)**. These originated in our own Oort cloud and are essentially Sun-bound; a tiny planetary perturbation tips the osculating e just over 1.

So the JSON sets **`interstellar: true` ONLY for 1I and 2I** (a physics fact, hard-coded and flagged as curated), while a separate **`hyperbolic`** flag (derived from `e ≥ 1` / null period) marks **all 4** unbound osculating orbits. This mirrors the exoplanet phase's care with the imaged/non-imaged distinction: use the database's truth, and don't let a class code overstate the claim.

---

## 4. License / usage status (READ CAREFULLY — verbatim)

The SSD/CNEOS API pages publish **no explicit license** and **no requested acknowledgment line** (contrast the NASA Exoplanet Archive, which *does* request a specific acknowledgment — see `EXOPLANETS_DATA_SOURCES.md` §1d; and contrast USGS Astrogeology, which stamps its maps "public domain" verbatim — see `PLANETS_DATA_SOURCES.md`). What the pages **do** publish is a binding **fair-use policy**, recorded here verbatim (from `https://ssd-api.jpl.nasa.gov/`, 2026-07-10):

> - "You agree to submit only one API request at a time (no simultaneous requests)."
> - "You may not embed these APIs in your website (per NASA CORS policy)."
> - "You understand that API data formats can change without notice."
> - "You should always check the `version` field in the API output to detect any change..."
> - "You understand that there is no guarantee any particular API will be available indefinitely."
> - "You understand that this service is made available on a best effort basis."

**Legal reading (honest):** these are **US-Government (NASA / JPL / Caltech) data**, and the values served — orbital elements, physical parameters, close-approach distances — are **measured astronomical facts**, not copyrightable. So the data are **freely usable** in an MIT open-source app. Because the pages request **no** specific acknowledgment, there is **no must-display credit string** here (unlike Open-Meteo CC-BY or the Exoplanet Archive line). We nonetheless recommend the courtesy credit **"NASA/JPL-Caltech (Solar System Dynamics / CNEOS)"** in the app about/credits panel and README — the same courtesy posture as JPL Horizons in `DATA_SOURCES.md` §5.

**The two binding constraints we actually honor:**
1. **"You may not embed these APIs in your website (per NASA CORS policy)."** → This build runs **offline** and commits a **static JSON**; the browser never calls SBDB/CAD at runtime. Same pattern as the GFS wind pipeline and the exoplanet TAP pipeline. (Consistent with the Horizons "server-side / precompute only" ruling in `DATA_SOURCES.md`.)
2. **"one API request at a time (no simultaneous requests)."** → `build_objects.py` queries **sequentially** (one SBDB call per body, then one CAD call), with a small delay — never in parallel.

The `acknowledgment` string in `objects.json → meta` records this status (US-Gov, no required credit, courtesy line + the fair-use terms verbatim) so the UI can render it directly.

---

## 5. What we fetched — `public/data/small-bodies/objects.json`

**Built live 2026-07-10** by `scripts/small-bodies/build_objects.py`. Real counts from this session's run:

- **45 objects** — **16 comets, 29 asteroids**. File size **37.3 KB** (well under the 200 KB budget), minified JSON, ASCII-safe.
- **11 PHAs** (SBDB flag): Apophis, Bennu, Ryugu, Itokawa, Didymos, Phaethon, Toutatis, Apollo, Florence, Icarus, Geographos.
- **2 interstellar** (`interstellar: true`): **1I/'Oumuamua, 2I/Borisov**. **4 hyperbolic** (`e ≥ 1`): those two **plus** C/2023 A3 and C/2012 S1 (ISON) — near-parabolic, **not** interstellar.
- **23 visited** (`visited: true`, with `mission`): 1P/Halley (Giotto+armada), 9P/Tempel 1 (Deep Impact/Stardust-NExT), 67P (Rosetta/Philae), 103P (EPOXI), 81P/Wild 2 (Stardust), 19P/Borrelly (Deep Space 1), 21P/Giacobini-Zinner (ICE), 101955 Bennu (OSIRIS-REx), 162173 Ryugu (Hayabusa2), 433 Eros (NEAR), 25143 Itokawa (Hayabusa), 65803 Didymos/Dimorphos (DART), 4179 Toutatis (Chang'e 2), 4 Vesta (Dawn), 951 Gaspra (Galileo), 243 Ida (Galileo — found moon Dactyl), 253 Mathilde (NEAR), 21 Lutetia (Rosetta), 2867 Šteins (Rosetta), 5535 Annefrank (Stardust), 9969 Braille (Deep Space 1), 152830 Dinkinesh (Lucy — found moon Selam), 52246 Donaldjohanson (Lucy). *(These 23 are the textures agent's "real shape/mosaic exists" set.)*
- **18 close approaches** — real upcoming Earth approaches (see §2a).

### 5a. Schema

```json
{
  "meta": {
    "source": "...", "api_endpoints": {"sbdb": "...", "cad": "..."},
    "acknowledgment": "US-Gov (NASA/JPL/Caltech); no required credit; fair-use terms verbatim ...",
    "units": { "...": "..." }, "classification": { "...": "..." },
    "honesty": "...", "close_approach_window": { "...": "..." },
    "verified_date": "2026-07-10", "counts": { "objects": 45, "comets": 16, "asteroids": 29,
      "pha": 11, "visited": 23, "interstellar": 2, "hyperbolic": 4, "close_approaches": 18 }
  },
  "objects": [
    {
      "name": "99942 Apophis", "fullname": "99942 Apophis (2004 MN4)",
      "designation": "99942", "spkid": "20099942",
      "kind": "asteroid", "class": { "code": "ATE", "name": "Aten" },
      "pha": true, "neo": true, "interstellar": false, "visited": false,
      "mission": "OSIRIS-APEX (NASA) - arrives after the 2029 flyby",
      "elements": { "a": 0.9223592, "e": 0.191149, "q": 0.746051, "Q": 1.09867,
        "i": 3.341, "om": 203.8937, "w": 126.6796, "period_yr": 0.885846,
        "hyperbolic": false, "moid_au": 0.00010792, "t_jup": 6.466, "epoch_jd": 2461200.5 },
      "physical": { "diameter_km": 0.34, "rotation_h": 30.56, "albedo": 0.35,
        "spectral": "Sq", "H": 19.09 },
      "note": "Potentially Hazardous Asteroid (~340 m). On 2029-04-13 it passes ~0.099 lunar distances ..."
    }
  ],
  "close_approaches": [
    { "object": "99942 Apophis (2004 MN4)", "designation": "99942",
      "date": "2029-Apr-13 21:46", "dist_au": 0.00025409, "dist_ld": 0.099,
      "v_rel_kms": 7.423, "h": 19.09 }
  ]
}
```

- Hyperbolic objects carry `a < 0`, `Q: null`, `period_yr: null`, `hyperbolic: true`.
- Comets carry `H: null` and `comet_total_mag_M1` instead.
- `null` everywhere SBDB has no value — never filled in.

### 5b. Curated set (why each is in) — 45 objects

**Comets (16):** the 8 brief-mandated comets **1P/Halley, 2P/Encke, 9P/Tempel 1, 67P/Churyumov-Gerasimenko, 103P/Hartley 2, C/1995 O1 (Hale-Bopp), C/2020 F3 (NEOWISE), C/2023 A3 (Tsuchinshan-ATLAS)** + the two **interstellar** visitors **1I/'Oumuamua, 2I/Borisov**; plus spacecraft-visited comets **81P/Wild 2** (Stardust sample return), **19P/Borrelly** (Deep Space 1), **21P/Giacobini-Zinner** (ICE — first comet flyby), and meteor-shower parents **55P/Tempel-Tuttle** (Leonids), **109P/Swift-Tuttle** (Perseids); plus great comets **C/1996 B2 (Hyakutake)** and **C/2012 S1 (ISON)** (disintegrated sungrazer).

**Asteroids (29):** the brief-mandated **99942 Apophis, 101955 Bennu, 162173 Ryugu, 433 Eros, 25143 Itokawa, 65803 Didymos** (+ Dimorphos / DART note), **3200 Phaethon** (Geminids parent), **4179 Toutatis**, the three NEA-class prototypes **1862 Apollo / 2062 Aten / 1221 Amor**, **4 Vesta** (Dawn), **951 Gaspra** + **243 Ida** (+ moon Dactyl, Galileo); plus spacecraft-visited asteroids **16 Psyche** (en route), **253 Mathilde** (NEAR), **21 Lutetia** + **2867 Šteins** (Rosetta), **5535 Annefrank** (Stardust), **9969 Braille** (Deep Space 1), **152830 Dinkinesh** (+ moon Selam) + **52246 Donaldjohanson** (Lucy); plus dynamically notable NEAs **3122 Florence** (large PHA, 2 moons), **3753 Cruithne** (Earth co-orbital), **469219 Kamoʻoalewa** (Earth quasi-satellite, Tianwen-2 target), **1566 Icarus** (extreme perihelion), **1620 Geographos** (most elongated), **1036 Ganymed** (largest NEA).

### 5c. Honest limitations of the fetched set (real findings, not shortcuts)

- **Osculating elements are epoch-specific.** SBDB returns *osculating* elements at a solution epoch (`epoch_jd`). For resonant/long-period bodies these differ slightly from the commonly quoted mean elements, and comet elements especially drift between apparitions (Halley's are at a 1986-era epoch). Not an error — it's what "measured orbit at epoch T" means. Flagged in `objects.json`.
- **Physical coverage is uneven.** SBDB has diameter/rotation/albedo/spectral for well-studied (mostly visited or radar-observed) bodies, but **null** for many small NEAs and most long-period comets. We ship the nulls honestly rather than inventing values.
- **Comet nucleus sizes are hard.** A comet's `diameter` (when present) is the nucleus estimate; the coma/tail we see is far larger and is **not** a solid body. Halley's 11 km is the nucleus.
- **`visited`/`mission`/`interstellar`/`note` are the only non-SBDB fields** — hand-curated historical/physics facts (see `meta.honesty`). Everything numeric is from JPL.
- **The set is a snapshot** of a live database. Re-running `build_objects.py` re-queries SBDB + CAD, so values (and especially the close-approach list, which is time-windowed from the build date) will drift.

---

## Rejected / flagged items

- **No "public domain" wording, no requested acknowledgment** on the SSD/CNEOS API pages — unlike USGS ("public domain" verbatim) or the Exoplanet Archive (a requested acknowledgment). We therefore describe the data as "US-Government, freely usable, courtesy credit recommended" and do **not** stamp it with a false required-credit string. (Honest handling of the "requested-credit vs public-domain vs neither" spectrum, per the brief.)
- **Browser calls to SBDB/CAD are forbidden** — "You may not embed these APIs in your website (per NASA CORS policy)." No CORS test is even relevant: we build offline and ship static JSON. Any future browser feature must proxy server-side.
- **`e > 1` ≠ interstellar** — C/2023 A3 and C/2012 S1 (ISON) are hyperbolic-by-osculation but Sun-bound Oort-cloud comets, not interstellar. Only 1I and 2I are flagged interstellar (§3).
- **PHA is not recomputed** — we take SBDB's `pha` boolean as authoritative rather than re-deriving MOID < 0.05 au ∧ H ≤ 22.0 ourselves (avoids drift from a stale local MOID).
- **`cd` string must not be used for chronological sorting** — its month names sort alphabetically ("Aug" < "Jul"); sort on `jd`. (Bug caught and fixed this session.)
- **CAD list is a moving target** — it is windowed from the build date (2026-07-10) and filtered to sizeable objects; it is a representative honest sample of upcoming approaches, not an exhaustive catalog.

---

**Verification methodology note:** the SBDB and CAD endpoint URLs, API versions (1.3 / 1.5), every field name and unit, and the fair-use policy text were read from the official SSD/CNEOS API documentation pages and the usage-policy page on 2026-07-10, and cross-checked against **live API responses**. All 45 object designations were verified to resolve on SBDB; all orbital elements, physical parameters, class/PHA/neo flags, the 45-object / 16-comet / 29-asteroid / 11-PHA / 23-visited / 2-interstellar counts, and the 18 close approaches (incl. Apophis 2029-04-13 at 0.099 LD) come from **live SBDB + CAD queries executed this session** by `scripts/small-bodies/build_objects.py`. See `docs/SMALL_BODIES_PHYSICS.md` for the measured-vs-computed-vs-illustrative contract and the factual hazard framing.

---

## Integration log (Phase 9)

Populate at integration time (per the planetary-data-ingestion rule) as the app wires these in.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Small-body catalog | `objects.json` (JPL SBDB v1.3) | `public/data/small-bodies/objects.json`, built by `scripts/small-bodies/build_objects.py` | 45 objects; elements + physical + class/PHA; nulls preserved. |
| Close approaches | `objects.json → close_approaches` (JPL/CNEOS CAD v1.5) | same file | 18 real upcoming Earth approaches; Apophis 2029 explicit; dist in au + lunar distances. |
| PHA / hazard badge | SBDB `pha` + real close-approach numbers | `objects[].pha`, `close_approaches[]` | Factual framing only; Apophis 2029 impact RULED OUT (see physics doc). |
| Interstellar flag | curated (physics) | `objects[].interstellar` (1I, 2I) | Label "interstellar — unbound, passing through". |
| Visited shape/mosaic | curated `visited`/`mission` | `objects[].visited` (23 bodies) | For the textures agent: real close-up shape models exist for these; others illustrative. |
| Appearance (un-imaged) | ILLUSTRATIVE | app-side render | No surface imagery; label "illustration, not an observation" (see physics doc). |
| Courtesy credit | this doc / API pages | app about/credits + README | "NASA/JPL-Caltech (Solar System Dynamics / CNEOS)"; no required string. |
