# Jupiter's Moons (Galilean Transits) Data Sources (Phase 14)

Verification date: **2026-07-18**. Every source, method, texture and license
below was recorded on this date against the cited published algorithm, the
already-shipped textures in this repo, and the sibling data-source docs. Same
rigor and honesty bar as `DATA_SOURCES.md` (Earth), `PLANETS_DATA_SOURCES.md`,
`MOONS_DATA_SOURCES.md`, `MOON_DATA_SOURCES.md` and
`METEOR_SHOWERS_DATA_SOURCES.md`: real physics, real data, honest claims,
everything free and legally usable for an open-source app, every source and
license logged. Anything that cannot be verified from an official source is
explicitly flagged.

Scope this phase: a **"Jupiter's Moons" tab** that predicts and animates the
mutual events of the four Galilean satellites (Io, Europa, Ganymede, Callisto)
against Jupiter's disk: **transits, shadow transits, occultations and eclipses**,
plus the moons' apparent positions strung out along Jupiter's equatorial plane.

> **Honesty rule for this phase (from the project brief):** this tab is almost
> entirely **COMPUTED from published orbital theory**, not fetched from any data
> feed. The honest story is exactly three lines: **real physics, computed** (a
> published, peer-reviewed satellite-position algorithm that we implement in our
> own code); **real textures, reused** (the Jupiter and Galilean-moon spacecraft
> maps already shipped in earlier phases, no new download); **accuracy stated**
> (the implemented method is good to about a tenth of a Jupiter radius and event
> times to a few minutes, and we say so, pointing at JPL Horizons / IMCCE for
> critical cross-checks). We invent nothing and we fetch nothing at runtime. See
> `docs/JUPITER_MOONS_PHYSICS.md` for the computed / reused / illustrative
> contract.

## Summary table

| Source | What it provides | License / status | Attribution | Access | Verified against (2026-07-18) |
|---|---|---|---|---|---|
| **Jean Meeus, *Astronomical Algorithms*, Ch. 44** ("Positions of the Satellites of Jupiter") | The method: apparent X/Y/Z of each Galilean satellite relative to Jupiter, from which transit / shadow / occultation / eclipse are derived | Published algorithm. The maths is **not a copyrightable dataset**; we implement it in our own code (same posture as Mars24, SGP4, Meeus lunar theory). No license needed to implement | Cite Meeus, *Astronomical Algorithms* (2nd ed., Willmann-Bell 1998), Ch. 44; underlying E5 theory Lieske (1977) / Sampson (1921) | Textbook / open published science; we implement, we do not redistribute software | Meeus Ch. 44 (low- and high-accuracy methods); accuracy stated below |
| **Jupiter geocentric RA/Dec + elongation** | Where Jupiter is in Earth's sky (observer visibility) and the Sun-Jupiter-Earth phase angle that separates shadow from moon | Published algorithm (VSOP87 truncation / Meeus planetary chapters), same "we implement it" posture | Cite Meeus, *Astronomical Algorithms* | Computed in code, no runtime API | Standard low-precision planetary theory; cross-check JPL Horizons offline |
| **Reused: Jupiter cloud map** `public/textures/planets/jupiter.jpg` | The disk the events play out on | Public domain (NASA/JPL/Space Science Institute, Cassini) | "NASA / JPL / Space Science Institute" | Already in repo (Phase: Planets) | Present, 256,872 bytes; provenance `PLANETS_DATA_SOURCES.md` §1c |
| **Reused: Galilean moon maps** `public/textures/moons/{io,europa,ganymede,callisto}.jpg` | The moon disks | Public domain (NASA / JPL / USGS Astrogeology; Galileo/Voyager) | "NASA / JPL / USGS Astrogeology" | Already in repo (Phase 5: Moons) | Present (see §2); provenance `MOONS_DATA_SOURCES.md` §1a-1d |
| **JPL Horizons / IMCCE** | Authoritative cross-check of predicted event times (validation only) | US-Gov / institutional ephemerides; **not shipped, never called at runtime** | n/a (not shipped) | Offline validation only | Same Horizons CORS rule as `DATA_SOURCES.md` §5 |

**No committed data artifact and no new texture this phase.** Unlike the moons
phase (`constants.json`, `phenomena.json`) or meteor showers (`showers.json`),
there is no dataset to build or ship here. The positions and events are computed
at runtime from the published algorithm; the only committed assets involved are
the five textures that already exist in the repo from earlier phases. The moons'
orbital periods and the 1:2:4 Laplace resonance used by the algorithm come from
`public/data/moons/constants.json` (Phase 5), already sourced and cited there.

---

## 1. Method / algorithm source: Meeus, *Astronomical Algorithms*, Chapter 44

**This is the substance of the phase.** The positions of the four Galilean
satellites relative to Jupiter, and every event derived from them, come from a
**published, peer-reviewed algorithm**, implemented in our own code. It is not a
dataset we download; it is maths we compute. This is the identical posture to:

- **Earth:** the NOAA / Spencer solar-position series in `lib/solar.ts`.
- **Mars:** the NASA GISS **Mars24** algorithm (Allison & McEwen 2000),
  implemented in code (`MARS_DATA_SOURCES.md` §4).
- **The Moon:** **Meeus / ELP2000** lunar theory for phase and libration
  (`MOON_DATA_SOURCES.md`).
- **The ISS:** **SGP4** propagation of a TLE (`ISS_DATA_SOURCES.md`).

In every one of those cases the repo's rule is the same, and it applies here
unchanged: **a published algorithm (the maths) is freely implementable. There is
no license on a formula.** We implement it ourselves rather than redistributing
anyone's software or dataset.

### 1a. The exact citation

> **Jean Meeus, *Astronomical Algorithms*, 2nd edition, Willmann-Bell,
> Richmond VA, 1998. Chapter 44, "Positions of the Satellites of Jupiter."**

Chapter 44 gives two methods:

- **Low-accuracy method** (first part of the chapter): a compact set of formulae
  that yield each satellite's apparent rectangular coordinates X, Y, Z relative
  to Jupiter's center, in units of Jupiter's equatorial radius, as seen from
  Earth. X and Y place the moon on the plane of the sky (X positive toward the
  west along Jupiter's equator); Z is the depth toward or away from the observer.
  This is the method derived from **Sampson's theory** in reduced form.
- **Higher-accuracy method** (second part): adds the principal periodic
  perturbations among the satellites, giving positions closer to the full theory.

Both are published, both are implementable directly from the printed formulae.
The underlying dynamical model is the **E5 theory of J. H. Lieske (1977)**, which
itself builds on **Sampson (1921)**; Meeus's chapter is the practical,
implementable reduction of that theory. Cite Meeus as the method we implement,
and Lieske / Sampson as the underlying theory.

### 1b. Accuracy, stated honestly (this is the load-bearing claim)

**The low-accuracy method reproduces the Galilean satellites' apparent positions
relative to Jupiter to roughly 0.1 Jupiter radius, which corresponds to event
times (transit, shadow transit, occultation, eclipse ingress/egress) good to a
few minutes.** The higher-accuracy method in the same chapter, and the full E5 /
Sampson-Lieske theory it derives from, do better; modern JPL and IMCCE numerical
ephemerides are better still.

What this means for the tab, said plainly:

- These are **real, observable events**. Amateur astronomers watch Galilean
  shadow transits (a crisp black dot crawling across Jupiter's cloud tops) in
  small telescopes, and eclipses/occultations of the moons with binoculars. The
  tab predicts genuine phenomena, not a cartoon.
- The predicted **times are good to a few minutes** with the implemented method,
  not to the second. For casual observing ("is there a shadow transit tonight?")
  this is entirely adequate.
- For **critical timing** (a grazing event, precise ingress/egress to the second,
  a mutual-event photometry campaign), **cross-check JPL Horizons or the IMCCE**
  (see §3). The app must state the few-minute bound and point there, never imply
  second-level precision it does not have.

This is the same honesty discipline the repo applies to SGP4 ("good to ~1 km
near epoch, degrades with TLE age") and to the Mars24 clock ("cross-check against
the GISS worked examples / JPL Horizons offline"): state the method, state its
error bound, name the authoritative source for cross-checks.

### 1c. Jupiter's position in Earth's sky (observer visibility)

Two more computed quantities, from the same "we implement published theory"
bucket, make the tab useful to a real observer:

- **Jupiter's geocentric RA/Dec** tells you whether Jupiter is above the horizon
  at the observer's location and time, and therefore whether an event is actually
  watchable rather than merely occurring. Computed from a low-precision planetary
  theory (a VSOP87 truncation, or Meeus's planetary-position chapters), no API.
- **Jupiter's elongation from the Sun / the Sun-Jupiter-Earth phase angle** sets
  the offset between a moon and its shadow on the disk (near opposition they
  nearly coincide; near quadrature they separate) and whether Jupiter is a
  morning or evening object. Also computed, no API. See
  `JUPITER_MOONS_PHYSICS.md` for the geometry.

Both are cross-checked offline against JPL Horizons, never called from the
browser, exactly as Earth's terminator and the Moon's phase are cross-checked.

---

## 2. Reused textures (already in the repo, no new download)

**No new texture is fetched or shipped this phase.** The Jupiter's Moons tab
reuses five equirectangular textures that earlier phases already downloaded,
downsampled and committed. All five were confirmed present on 2026-07-18 (file
sizes below), and their provenance and licenses are recorded in the sibling docs
cited per row. This section restates those licenses so this phase's record is
self-contained; the authoritative provenance lives in the referenced docs and
must be honored as stated there.

| Texture (in repo) | Size (2026-07-18) | Source / mission | License | Credit | Provenance doc |
|---|---|---|---|---|---|
| `public/textures/planets/jupiter.jpg` | 256,872 bytes | NASA Cassini "Best Map of Jupiter" (PIA07782), Jupiter flyby Dec 2000 | **Public domain** (NASA/JPL Image Use Policy) | NASA / JPL / Space Science Institute | `PLANETS_DATA_SOURCES.md` §1c |
| `public/textures/moons/io.jpg` | 293,303 bytes | USGS Astrogeology Galileo SSI / Voyager Color Merge global mosaic 1km | **Public domain** (Access: public domain, Use: None) | NASA / JPL / USGS Astrogeology | `MOONS_DATA_SOURCES.md` §1a |
| `public/textures/moons/europa.jpg` | 462,665 bytes | USGS Astrogeology Voyager / Galileo SSI global mosaic 500m (**grayscale**) | **Public domain** (Access: None, Use: None) | NASA / JPL / USGS Astrogeology (T. Becker et al.) | `MOONS_DATA_SOURCES.md` §1b |
| `public/textures/moons/ganymede.jpg` | 388,588 bytes | USGS Astrogeology Voyager / Galileo SSI Color global mosaic 1.4km | **Public domain** (Access: public domain, Use: None) | NASA / JPL / USGS Astrogeology | `MOONS_DATA_SOURCES.md` §1c |
| `public/textures/moons/callisto.jpg` | 374,020 bytes | USGS Astrogeology Voyager / Galileo SSI global mosaic 1km (**grayscale**) | **Public domain** (Access: public domain, Use: None) | NASA / JPL / USGS Astrogeology | `MOONS_DATA_SOURCES.md` §1d |

Notes carried over from the provenance docs (so they are not lost when the
textures are reused here):

- **Jupiter is a snapshot, not "live."** The Cassini map is a genuine cloud-top
  image, reconstructed from two filters, so color is approximate and the belts
  drift over time. Label it a snapshot, per `PLANETS_PHYSICS.md`. It is the disk
  the events are drawn on; it is not itself dynamic.
- **Europa and Callisto are grayscale** (no turnkey public-domain global color
  mosaic exists for either; both moons are near-neutral in color anyway). Io and
  Ganymede are color. Io's mosaic has ~5 deg polar gaps filled by interpolation.
  These are the honesty labels from `MOONS_DATA_SOURCES.md`; they carry over.
- Since every reused texture is **public domain**, there is **no new attribution
  obligation** created by this phase beyond the courtesy credits above. No
  CC-BY / CC-BY-SA asset is introduced (unlike the Solar System Scope textures in
  the planets phase or the Montabone dust climatology on Mars).

---

## 3. No external data feed, no API, no runtime license

Stated plainly, because it is the defining property of this phase:

- **The positions and events are computed at runtime from orbital theory, not
  fetched.** There is no live feed, no polling endpoint, no API key, no committed
  JSON dataset, and no GitHub Action for this tab. The moon positions for any
  instant, and the transit/shadow/occultation/eclipse events over any window,
  fall straight out of the Meeus Ch. 44 formulae evaluated in code.
- **There is therefore no data license to honor beyond the reused public-domain
  textures and the freely-implementable published algorithm.** The algorithm is
  maths (not copyrightable); the five textures are public domain. That is the
  entire licensing surface of this phase.
- **JPL Horizons and the IMCCE are cross-check sources only.** They are the
  authoritative ephemerides against which we validate the implemented method
  offline. They are **not shipped and never called from the browser** at runtime.
  This inherits the established rule from `DATA_SOURCES.md` §5: JPL Horizons
  forbids browser embedding and sends no CORS header (verified 2026-07-06), so it
  is used for offline validation only. The IMCCE (Institut de mecanique celeste
  et de calcul des ephemerides) publishes Galilean-satellite ephemerides and
  phenomena predictions and is the standard European cross-check; also
  offline-only here.

This is the same shape as the Moon phase (Meeus lunar theory computed
client-side, Horizons offline cross-check only) and the Mars clock (Mars24
computed, Horizons offline), applied to Jupiter's satellites.

---

## Rejected / flagged items

- **No runtime API for satellite positions.** JPL Horizons can return
  Galilean-satellite positions and even event tables, but browser calls are
  policy-forbidden and CORS-blocked (`DATA_SOURCES.md` §5, verified 2026-07-06),
  and depending on a network call for something fully computable is the wrong
  design. **Rejected for runtime; retained for offline cross-check only.**
- **Second-level precision is not claimed.** The implemented Meeus low-accuracy
  method is good to ~0.1 Jupiter radius / a few minutes in event time. Do not
  present predicted times to the second. For grazing or photometric-grade timing,
  the UI must point the user to JPL Horizons / IMCCE. Flagged so the frontend
  labels the accuracy bound honestly.
- **No new texture download.** The five textures already exist from Phases
  "Planets" and 5. Do not re-fetch or ship new imagery. If a texture is ever
  re-sourced, its license is governed by the provenance doc cited in §2, not by
  this doc.
- **Jupiter cloud map is a snapshot.** Belts drift; the shipped map is a real but
  dated Cassini image. It renders the disk; it is not a live cloud state. Labeled
  a snapshot per `PLANETS_PHYSICS.md`.
- **Provenance of record for reused textures lives in the sibling docs.** This
  doc restates the licenses for a self-contained record, but if there is ever a
  discrepancy, `PLANETS_DATA_SOURCES.md` (Jupiter) and `MOONS_DATA_SOURCES.md`
  (the four moons) are authoritative.

---

**Verification methodology note:** The method source (Meeus, *Astronomical
Algorithms*, 2nd ed., 1998, Ch. 44), its two variants (low- and high-accuracy),
its accuracy bound (~0.1 Jupiter radius / event times to a few minutes) and the
underlying E5 / Sampson-Lieske theory are recorded from the published algorithm;
we implement it in our own code and redistribute no software or dataset, the same
posture as Mars24, SGP4 and the Meeus lunar theory already in the repo. The five
reused textures were confirmed present in the repo on 2026-07-18 with the file
sizes listed in §2; their provenance and licenses are those recorded in
`PLANETS_DATA_SOURCES.md` §1c (Jupiter, Cassini PIA07782, public domain) and
`MOONS_DATA_SOURCES.md` §1a-1d (Io/Europa/Ganymede/Callisto, USGS Astrogeology,
public domain). No external feed, API, or committed dataset is used this phase.
JPL Horizons / IMCCE are offline cross-check sources only, never called at
runtime (Horizons CORS rule per `DATA_SOURCES.md` §5). See
`docs/JUPITER_MOONS_PHYSICS.md` for the honest-representation methodology.

---

## Phase 14 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app
wires this in. Frontend / physics implementation (`lib/`, `app/`, `components/`)
is out of scope for this doc; another agent owns it.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Galilean satellite apparent positions (X/Y/Z vs Jupiter) | Meeus *Astronomical Algorithms* Ch. 44 (low-accuracy; optionally high-accuracy) | Computed in `lib/` (owned by another agent), no runtime API | Cross-check vs JPL Horizons / IMCCE offline. State ~0.1 R_Jup / few-minute accuracy. |
| Transit / shadow transit / occultation / eclipse events | Derived from the X/Y/Z positions + phase angle | Computed in-browser over the requested window | Event times good to a few minutes; label the bound; point to Horizons/IMCCE for critical timing. |
| Jupiter sky position + phase angle (observer visibility) | Low-precision planetary theory (VSOP87 truncation / Meeus planetary chapters) | Computed in `lib/`, no API | Determines whether the event is above the observer's horizon and the moon-vs-shadow offset. |
| Jupiter disk texture | Reused `public/textures/planets/jupiter.jpg` (Cassini PIA07782, PD) | Already in repo | Credit NASA/JPL/SSI; label "snapshot". No new download. |
| Io / Europa / Ganymede / Callisto disks | Reused `public/textures/moons/{io,europa,ganymede,callisto}.jpg` (USGS PD) | Already in repo | Credit NASA/JPL/USGS. Europa & Callisto grayscale; Io ~5 deg polar gaps. No new download. |
| Orbital periods + 1:2:4 Laplace resonance | Reused `public/data/moons/constants.json` (Phase 5, JPL SSD) | Already in repo | Periods ~1.769 : 3.551 : 7.155 d; resonance already sourced/cited in `MOONS_DATA_SOURCES.md` §3. |
