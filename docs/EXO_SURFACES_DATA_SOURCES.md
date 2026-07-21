# Exoplanet Surfaces (Standing on Real Exoplanets) Data Sources (Phase 21)

Verification date: **2026-07-20**. Every source, method and claim below was recorded on
this date against the already-shipped and validated data in this repo (the NASA Exoplanet
Archive catalog at `public/data/exoplanets/systems.json`, verified live 2026-07-10 in
Phase 8) and the already-shipped, validated computation helpers in `lib/exoplanets`
(`starColor`, `habitableZone`, `equilibriumTempK`, `compositionClass`, and the stellar and
orbital math beside them). Same rigor and honesty bar as `SURFACES_DATA_SOURCES.md`
(Mars and Titan, Phase 20, our closest template), `EXOPLANETS_DATA_SOURCES.md` (Phase 8)
and the sibling data-source docs: real physics, real data, honest claims, everything free
and legally usable for an MIT open-source app, every source and license logged. Anything
that cannot be verified from an official or primary source, or from already-validated
in-repo code, is explicitly flagged.

Scope this phase: an **"Exoplanet Surfaces" tab**, standing on the ground of real,
confirmed exoplanets and looking up. This is the **mirror image** of the Mars and Titan
Surfaces tab. There, the **ground** was the real part (a real elevation model, a real
rover panorama) and the sky palette was the illustrative part. Here it is reversed: the
**sky is the real part** (computed from measured parameters) and **the ground is the
imagined part**. The headline honesty point comes first.

> **Honesty rule for this phase (leads the page): no exoplanet surface has ever been
> imaged, not one pixel, so on this tab ALL ground and terrain and appearance is
> ILLUSTRATIVE and labeled; the SKY is the real, computed part.** There are no ground
> photographs of any exoplanet and there is no terrain data for any exoplanet. Not one
> confirmed exoplanet surface has ever been resolved; the handful of "directly imaged"
> planets are unresolved dots, not maps (see `EXOPLANETS_DATA_SOURCES.md`). So every piece
> of ground, terrain, rock and surface texture on this tab is our own original geometry,
> illustrative, labeled illustrative everywhere it appears.
>
> What IS real and cited is the **SKY and the physical conditions**, computed from the
> measured parameters already in the repo (`public/data/exoplanets/systems.json`, NASA
> Exoplanet Archive, used by `lib/exoplanets`):
>
> - **COMPUTED and REAL:** the host star's **apparent angular size** (from the stellar
>   radius and the planet's orbital distance) and its **color** (from the stellar
>   temperature via `starColor`); the **sibling planets seen as discs** (from their
>   measured radii and orbital separations); **surface gravity** (from measured mass and
>   radius, for rocky worlds only); **irradiance** and **equilibrium temperature** (from
>   luminosity, distance and `equilibriumTempK`); and the **year length** (the measured
>   orbital period).
> - **REUSED and REAL:** the NASA Exoplanet Archive parameters in
>   `public/data/exoplanets/systems.json` and the `lib/exoplanets` helpers (`starColor`,
>   `habitableZone`, `equilibriumTempK`, `compositionClass` and their supporting math).
> - **ILLUSTRATIVE and LABELED:** ALL terrain and ground, any surface features, the sky's
>   fine texture and atmosphere rendering, and the **tidal-lock day/night framing** (which
>   rests on an inference, not a measurement, see below).
>
> Second honesty item, load-bearing: **tidal locking is an INFERENCE, not a measurement,
> and rotation / local time-of-day is NOT measured.** For close-in habitable-zone planets
> around low-mass stars, tidal locking is expected on theoretical grounds and must be
> labeled an inference. A locked world has permanent day and night sides (a real
> consequence of the inference, still labeled as resting on it). Unlike Mars, where local
> true solar time is fully real via Mars24, **no local clock is shown here**: the day
> length of these planets has not been measured. Only the **year** (the orbital period) is
> a real, measured quantity.

## Summary table

| Source | What it provides | License / status | Attribution | Access | Verified against (2026-07-20) |
|---|---|---|---|---|---|
| **`public/data/exoplanets/systems.json` (NASA Exoplanet Archive `pscomppars`)** | The measured parameters every real quantity on this tab is computed from: stellar radius, temperature, luminosity, spectral type; planet radius, mass, orbital semi-major axis, orbital period, equilibrium temperature, insolation | US-Government-funded (NASA) product by Caltech/IPAC; measured catalog values freely usable; the archive **requests** a specific acknowledgment (must display, see below) | Display the archive acknowledgment line verbatim (stored in `meta.acknowledgment`) | **Already in repo**, reused, no new fetch (built live 2026-07-10 by `scripts/exoplanets/build_systems.py`) | The already-committed `systems.json` (62 systems, 171 planets) and its `meta` block; full provenance in `EXOPLANETS_DATA_SOURCES.md` |
| **`lib/exoplanets` computation helpers** | `starColor(teffK)` (blackbody star color), `habitableZone(...)` / `conservativeHZ` / `optimisticHZ`, `equilibriumTempK(...)`, `compositionClass(...)` (rocky vs volatile-rich), plus the stellar and orbital math beside them | Our own shipped code, already validated (`lib/exoplanets.test.ts`) | n/a (original) | **Already in repo**, reused | Header docs and tests in `lib/exoplanets.ts` / `lib/exoplanets.test.ts` |
| **Stefan-Boltzmann fallback for stellar radius** | Where `st_rad` is null in the archive, R/Rsun = sqrt(L/Lsun) * (5772/Teff)^2 derived from luminosity and temperature | Standard physics (Stefan-Boltzmann law); our own code | n/a | Computed in browser (documented in `EXO_SURFACES_PHYSICS.md`) | Hand-checked against the tabulated `st_rad` for stars that have both (see physics doc) |
| **Illustrative: all terrain, surface features, sky texture, tidal-lock day/night framing** | Every piece of ground you stand on, all surface geometry, the fine sky and atmosphere rendering, and the permanent day/night side framing | Original work (ours), MIT with the rest of the repo | n/a (original) | Drawn by our own code | Labeled illustrative in the UI; **no imagery of any exoplanet surface exists, so none is fetched** |

**Nothing is fetched, at build time or at runtime.** There is **no real exoplanet surface
imagery to fetch, because none exists**, so this phase adds no new external asset, no API
key, no external feed and no GitHub Action. Every real quantity is computed in the browser
from the already-committed `systems.json` and the already-validated `lib/exoplanets` code;
every unreal quantity (terrain, ground) is our own labeled illustration. This is stated
explicitly because it is the whole point of the tab: the sky is computed from real data,
the ground is imagined and labeled.

---

## 1. The vantages (where you can stand)

Four vantages ship, defined in `lib/exo-surfaces.ts` (`EXO_VANTAGES`, resolved against
`systems.json` by `resolveVantage(id, systems)`; the full per-vantage state is assembled by
`exoSurfaceState(vantageId, systems)`). The ids below are the exact ids from that file. Every
planet named is already present in `systems.json`; the per-vantage numbers are computed from
its committed archive values by the helpers noted in section 2.

### 1a. TRAPPIST-1 e (the showcase, id `trappist-1e`)

The showcase vantage. TRAPPIST-1 is an **M8.0 V star, effective temperature 2566 K**
(committed in `systems.json`), so `starColor(2566)` returns a **deep salmon-red**. From
TRAPPIST-1 e (orbital semi-major axis 0.02925 AU, committed) the star's stellar radius
0.1192 Rsun gives an apparent angular diameter of **about 2.17 degrees, roughly 4 times
the width of our Sun from Earth** (our Sun is about 0.53 deg). Computed by hand for this
doc from the committed values (2 * atan(R_star / orbital_distance); see
`EXO_SURFACES_PHYSICS.md`), it matches the brief's "about 2 deg across, about 4x our Sun."

The **sibling planets pass as discs larger than our Moon**: the seven TRAPPIST-1 planets
are packed into a resonant chain, so at closest approach the neighboring worlds subtend
more than the Moon's 0.5 deg from Earth (for example TRAPPIST-1 d, radius 0.788 Earth
radii at a minimum separation of about 0.007 AU from e, works out to roughly 0.55 deg;
computed from committed radii and separations). These are **real, computed apparent
sizes**, not styled.

Real per vantage: the salmon-red host star and its ~2.17 deg apparent size, the
sibling-planet discs, the irradiance and equilibrium temperature (eqt 250 K committed),
surface gravity (if the committed mass and radius are both non-null), and the year length
(orbital period 6.1 days). Illustrative: all ground and terrain, the sky texture, and the
tidal-lock day/night framing.

### 1b. Proxima Centauri b (the nearest exoplanet, id `proxima-cen-b`)

The nearest exoplanet to the Solar System (host Proxima Cen, 1.30 pc). Host is an M5.5 V
red dwarf, effective temperature 2900 K (committed), so a red-dwarf sky, redder and
smaller in tone than a Sun-like star. Proxima b sits in the habitable zone (the committed
`note` says so; confirmable with `habitableZone`).

Two honesty caveats are mandatory on this vantage:

- **Tidal locking is an INFERENCE, not a measurement**, for a close-in habitable-zone
  planet around a low-mass star. The tab must label it an inference. If locked, Proxima b
  has a permanent day side and a permanent night side (a real consequence of the
  inference, still labeled as resting on it).
- **Flare-star caveat.** Proxima Centauri is an active flare star; the real sky there is
  periodically lit by stellar flares. This is a real, cited characteristic of the host and
  should be noted, not hidden.

Real per vantage: the red-dwarf host color and computed apparent size, irradiance and
equilibrium temperature, surface gravity (mass and radius are committed for Proxima b),
and the year length (orbital period about 11.2 days). Illustrative: all ground, sky
texture, and the day/night framing (which rests on the tidal-lock inference).

### 1c. TOI-700 d (a temperate rocky world, id `toi-700-d`)

A temperate, roughly Earth-size world in the habitable zone of a quiet M dwarf, chosen to
show a less extreme sky than the two ultra-cool M-dwarf hosts. `compositionClass` confirms
the world is rocky before surface gravity is shown. Real per vantage: the same computed set
(host color and apparent size, sibling discs where present, irradiance, equilibrium
temperature, rocky surface gravity, year length). Illustrative: all ground, sky texture,
day/night framing.

### 1d. 51 Pegasi b (a gas giant, id `51-peg-b`, the honest "NO SURFACE" counterpart)

The honest counterpart: **a gas giant you cannot stand on.** 51 Pegasi b, the first planet
found around a Sun-like star, is a hot Jupiter. This vantage exists to say plainly that
**there is no surface to stand on**: `hasSurface(planet)` returns false, so the tab shows a
cloud-deck viewpoint labeled "no solid surface" rather than a ground. Real per vantage: the
host star's computed color and apparent size, irradiance and equilibrium temperature, and
the year length. There is **no surface gravity figure presented as a standing-on value**
(there is no surface). All cloud and sky texture is illustrative.

---

## 2. What is real, and how it is computed

Every real quantity on this tab is computed in the browser from the committed
`systems.json` values via `lib/exoplanets` and the Phase 21 wrappers in `lib/exo-surfaces.ts`
(`hostStarSky`, `siblingDiscs`, `surfaceGravityG`, `hasSurface`, `irradianceEarths`,
`tidalLockInference`, `yearInfo`, all assembled by `exoSurfaceState`). Nothing is invented;
where the archive has a `null`, the quantity is not shown.

- **Host star apparent angular size:** 2 * atan(R_star / orbital_distance), from the
  committed stellar radius `st_rad` and the planet's `sma_au`. Where `st_rad` is null, the
  radius is **derived from luminosity and temperature** via Stefan-Boltzmann,
  R/Rsun = sqrt(L/Lsun) * (5772/Teff)^2 (with L from `lsunFromLogLum`, since the archive
  stores luminosity as log10 L/Lsun), and the derivation is labeled. See
  `EXO_SURFACES_PHYSICS.md`.
- **Host star color:** `starColor(teffK)`, a blackbody-based color from the committed
  effective temperature. For TRAPPIST-1 (2566 K) this is a deep salmon-red.
- **Sibling planets as discs:** 2 * atan(R_planet / separation), from committed sibling
  radii (`radius_re`) and the difference in orbital semi-major axes. Only shown for
  siblings with non-null radii.
- **Surface gravity (rocky worlds only):** g = g_Earth * (M/M_Earth) / (R/R_Earth)^2, from
  the committed `mass_me` and `radius_re`, and only when `compositionClass` reports a rocky
  world and both values are non-null. Shown with the archive's mass caveat (an RV-only mass
  may be a minimum mass; see `EXOPLANETS_DATA_SOURCES.md`).
- **Irradiance and equilibrium temperature:** the committed insolation (`insol`, Earth
  flux) and equilibrium temperature (`eqt_k`) are reused directly; `equilibriumTempK` is
  available to recompute from luminosity and distance where useful. Labeled computed/reused.
- **Year length:** the committed orbital period (`period_days`), the **only** real
  time-of-cycle quantity on this tab. There is no measured day length and no local clock.

---

## 3. Assets and licensing

| Asset (in repo) | Source | License | Required credit |
|---|---|---|---|
| `public/data/exoplanets/systems.json` (already committed, 62 systems / 171 planets) | NASA Exoplanet Archive `pscomppars` (TAP), built by `scripts/exoplanets/build_systems.py` | US-Government-funded, freely usable, **cite as requested** (not stamped "public domain" by the archive) | The archive acknowledgment line, verbatim, stored in `meta.acknowledgment` (plus WASP / Butters et al. 2010 where WASP planets appear) |
| `lib/exoplanets` helpers | Original (ours) | MIT with the repo | n/a |
| All terrain, ground, surface features, sky texture, tidal-lock day/night framing | Original (ours) | MIT with the repo | n/a (labeled illustrative) |

**No new external asset is added this phase.** There is no real exoplanet surface imagery
to fetch, so nothing is fetched. The archive acknowledgment already shipped in Phase 8 is
honored here unchanged, verbatim:

> "This research has made use of the NASA Exoplanet Archive, which is operated by the
> California Institute of Technology, under contract with the National Aeronautics and
> Space Administration under the Exoplanet Exploration Program."

Primary citation the archive requests: **Christiansen et al. (2025), *Planetary Science
Journal*.**

---

## Rejected / flagged items

- **Any claim of a real exoplanet surface image is rejected outright.** No exoplanet
  surface has ever been imaged, not one pixel. All ground on this tab is illustrative and
  labeled illustrative, always. This is the top honesty item.
- **Presenting tidal locking as a measurement is rejected.** For close-in HZ planets around
  low-mass stars it is an **inference** from theory, and it must be labeled an inference.
  The permanent day/night sides follow from that inference and carry the same label.
- **A local clock / time-of-day is rejected.** The rotation and day length of these planets
  are not measured. Unlike Mars, no local time is shown. Only the year (orbital period) is
  real. Flagged.
- **Surface gravity on a gas giant is rejected.** There is no surface to stand on; the
  gas-giant vantage says so, and shows no standing-on gravity value.
- **Inventing stellar radius where the archive is null is rejected.** The Stefan-Boltzmann
  fallback (R/Rsun = sqrt(L/Lsun) * (5772/Teff)^2) is a documented derivation from other
  measured values, labeled as derived, not a made-up number. Where luminosity or
  temperature is also null, the apparent-size figure is simply not shown.
- **Filling archive nulls is rejected**, per the Phase 8 rule: `null` stays null and the
  dependent quantity is not shown.
- **Fabricated sibling discs are rejected.** A sibling disc is only drawn from committed
  radius and separation values; where the radius is null it is not drawn to scale.

---

**Verification methodology note:** every real quantity on this tab is computed from the
already-committed, already-verified `public/data/exoplanets/systems.json` (NASA Exoplanet
Archive `pscomppars`, verified live 2026-07-10 in Phase 8) using the already-validated
`lib/exoplanets` helpers (`starColor`, `habitableZone`, `equilibriumTempK`,
`compositionClass`, `lsunFromLogLum` and the stellar and orbital math beside them; tested
in `lib/exoplanets.test.ts`), wrapped for this tab by `lib/exo-surfaces.ts`. The TRAPPIST-1 e
showcase numbers (host 2566 K deep
salmon-red, apparent size about 2.17 deg or roughly 4x our Sun, sibling discs larger than
our Moon) were computed by hand for this doc from the committed stellar radius 0.1192 Rsun,
orbital distance 0.02925 AU and sibling radii and separations. No exoplanet surface imagery
exists, so none is fetched and no new asset ships; all terrain is our own labeled
illustration. Tidal locking is an inference, not a measurement; rotation and day length are
not measured, so no local clock is shown; only the orbital period (year) is a real time
quantity. See `docs/EXO_SURFACES_PHYSICS.md` for the honest representation methodology.

---

## Phase 21 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app wires this
in. Frontend implementation (`app/`, `components/`) is out of scope for this doc; another
agent owns it. The vantage ids and API below match `lib/exo-surfaces.ts` as shipped.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Vantage catalog | `EXO_VANTAGES` in `lib/exo-surfaces.ts`, resolved against `systems.json` (NASA Exoplanet Archive) | `public/data/exoplanets/systems.json`, reused via `resolveVantage` / `exoSurfaceState` | Four vantages: `trappist-1e`, `proxima-cen-b`, `toi-700-d`, `51-peg-b`. |
| Host star apparent size | Computed 2*atan(R_star / sma) from `st_rad` (or Stefan-Boltzmann fallback) and `sma_au` | Computed in browser | **COMPUTED, real.** TRAPPIST-1 e about 2.17 deg (about 4x our Sun). |
| Host star color | `starColor(teffK)` from committed `teff` | Reused `lib/exoplanets` | **COMPUTED, real.** TRAPPIST-1 (2566 K) deep salmon-red. |
| Sibling planet discs | Computed 2*atan(R_planet / separation) from committed radii and sma differences | Computed in browser | **COMPUTED, real.** TRAPPIST-1 siblings pass larger than our Moon; only drawn where radius is non-null. |
| Surface gravity (rocky only) | Computed from committed `mass_me`, `radius_re`; gated by `compositionClass` | Computed in browser | **COMPUTED, real.** Rocky worlds only; mass caveat carried; **not shown for the gas giant (no surface).** |
| Irradiance / equilibrium temperature | Committed `insol`, `eqt_k`; `equilibriumTempK` available | Reused / computed | **COMPUTED / REUSED, real.** |
| Year length | Committed `period_days` | Reused | **COMPUTED, real. The only real time-of-cycle quantity.** |
| Tidal-lock day/night framing | Inference for close-in HZ planets around low-mass stars | app-side render | **ILLUSTRATIVE / INFERENCE, labeled.** Permanent day/night sides rest on the inference; label it. |
| Local time-of-day | Not measured | not shown | **NOT SHOWN.** Rotation/day length unmeasured; no local clock (unlike Mars). |
| All terrain / ground / surface features | Original (ours) | app-side render | **ILLUSTRATIVE, labeled.** No exoplanet surface imagery exists. |
| Sky fine texture / atmosphere rendering | Original (ours) | app-side render | **ILLUSTRATIVE, labeled.** The star, discs, sizes and colors are real; the fine texture is not. |
| Gas-giant "no surface" vantage | `hasSurface(planet)` false (via `compositionClass`) | app-side render | **Honest counterpart (51 Pegasi b).** No standing-on surface; cloud-deck viewpoint labeled "no solid surface". |
| Required acknowledgment | archive acknowledge.html (verbatim, from `meta.acknowledgment`) | app about/credits + README + this doc | Honor the Phase 8 acknowledgment unchanged. |
