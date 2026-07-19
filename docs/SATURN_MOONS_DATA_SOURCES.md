# Saturn's Moons (Transits, Shadows, Ring Geometry) Data Sources (Phase 15)

Verification date: **2026-07-19**. Every source, method, texture and license
below was recorded on this date against the cited published algorithms, the
already-shipped textures in this repo, the three new Cassini moon maps being
added this phase, and the sibling data-source docs. Same rigor and honesty bar
as `DATA_SOURCES.md` (Earth), `PLANETS_DATA_SOURCES.md`, `MOONS_DATA_SOURCES.md`,
`MOON_DATA_SOURCES.md`, `METEOR_SHOWERS_DATA_SOURCES.md` and
`JUPITER_MOONS_DATA_SOURCES.md` (Phase 14, our closest template): real physics,
real data, honest claims, everything free and legally usable for an open-source
app, every source and license logged. Anything that cannot be verified from an
official source is explicitly flagged.

Scope this phase: a **"Saturn's Moons" tab** that predicts and animates the
apparent motion of seven satellites (Mimas, Enceladus, Tethys, Dione, Rhea,
Titan, Iapetus) around Saturn, their **transits, shadow transits, occultations
and eclipses** against Saturn's oblate disk, their **interactions with the
rings** (occulted by the rings, or crossing the ring shadow), and the **ring
tilt geometry** (how far the rings are opened toward Earth and toward the Sun).

> **Honesty rule for this phase (from the project brief):** this tab is almost
> entirely **COMPUTED from published orbital theory and a published ring-geometry
> algorithm**, not fetched from any data feed. The honest story is four lines,
> and the first one is the one that matters most:
>
> 1. **Seasonality, stated up front.** Disk transits and shadow transits of
>    Saturn's moons happen **only in a season around each Saturn equinox** (the
>    ring-plane crossing, roughly every 15 years; the last was **2025-05-06**).
>    Away from equinox the moons pass above or below the disk and their shadows
>    miss it. This is the single most important honest caveat and the tab must
>    lead with it.
> 2. **Real physics, computed.** Moon positions come from **Kepler propagation of
>    real JPL mean orbital elements**, rotated by **Saturn's IAU pole** into the
>    plane of sky; ring tilt comes from a **published algorithm** (Meeus,
>    *Astronomical Algorithms*, Ch. 45), implemented in our own code. Same posture
>    as Mars24, SGP4, the Meeus lunar theory and the Meeus Ch. 44 method we used
>    for Jupiter in Phase 14.
> 3. **Real textures.** Saturn and its rings are reused CC-BY textures already in
>    the repo (attribution required); the seven moon maps are public-domain
>    Cassini imagery (four already present, three added this phase).
> 4. **Accuracy stated.** Kepler from mean elements ignores nodal and apsidal
>    precession, so positions are good for the live configuration to a fraction of
>    a Saturn radius over days to weeks, degrading over months to years. We say
>    so and point at **IMCCE PHESAT** and **JPL Horizons** for critical
>    cross-checks. We invent nothing and we fetch nothing at runtime. See
>    `docs/SATURN_MOONS_PHYSICS.md` for the computed / reused / illustrative
>    contract.

## Summary table

| Source | What it provides | License / status | Attribution | Access | Verified against (2026-07-19) |
|---|---|---|---|---|---|
| **JPL SSD "Planetary Satellite Mean Orbital Elements"** (ssd.jpl.nasa.gov/sats/elem/) | The mean orbital elements (a, e, i, node, argument, mean longitude, epoch) for the seven moons, each referred to its **Laplace plane** | US Government data, **public domain**; transcribed into code, not redistributed as a database | Cite "JPL Solar System Dynamics, Planetary Satellite Mean Orbital Elements" | Values transcribed offline; Kepler propagation runs in code, no runtime API | Same JPL SSD elem table used in `MOONS_DATA_SOURCES.md` §3 (Laplace-plane frame flagged there) |
| **Kepler propagation + Saturn IAU pole (J2000 RA 40.589 deg, Dec 83.537 deg)** | Apparent moon positions: Kepler two-body motion from the mean elements, rotated from the Laplace plane by Saturn's pole into the plane of sky, using `lib/planets` for Saturn's geocentric direction | Published method (two-body Kepler + standard frame rotation). **Not a copyrightable dataset**; we implement it | Cite standard orbital mechanics; Saturn pole from **IAU WGCCRE** (Archinal et al.) | Computed in code, no runtime API | Pole values are the IAU-standard Saturn north-pole direction; propagation cross-checked offline (see §3) |
| **Jean Meeus, *Astronomical Algorithms*, Ch. 45** ("The Ring of Saturn") | The ring/tilt geometry: **B** (ring opening toward Earth), **B'** (opening toward the Sun), **P** (position angle of Saturn's pole) | Published algorithm. The maths is **not a copyrightable dataset**; we implement it in our own code (same posture as Mars24, SGP4, Meeus lunar theory, Meeus Ch. 44 for Jupiter). No license needed to implement | Cite Meeus, *Astronomical Algorithms* (2nd ed., Willmann-Bell 1998), Ch. 45 | Textbook / open published science; we implement, we do not redistribute software | **Validated against the book's worked example for 1992-12-16** (see §1b) |
| **Saturn geocentric RA/Dec + phase angle** | Where Saturn is in Earth's sky (observer visibility) and the small Sun-Saturn-Earth phase angle that offsets a shadow from its moon | Published algorithm (VSOP87 truncation / Meeus planetary chapters), same "we implement it" posture, via `lib/planets` | Cite Meeus, *Astronomical Algorithms* | Computed in code, no runtime API | Standard low-precision planetary theory; cross-check JPL Horizons offline |
| **Reused: Saturn cloud texture** `public/textures/planets/saturn.jpg` | The disk the events play out on | **CC-BY 4.0** (Solar System Scope), attribution required | "Solar System Scope (solarsystemscope.com), CC-BY 4.0" | Already in repo (Phase: Planets), 108,943 bytes | Present; provenance `PLANETS_DATA_SOURCES.md` §1d/§1f |
| **Reused: Saturn ring texture** `public/textures/planets/saturn-rings.png` | The ring color strip drawn to scale | **CC-BY 4.0** (Solar System Scope), attribution required | "Solar System Scope (solarsystemscope.com), CC-BY 4.0" | Already in repo (Phase: Planets), 10,436 bytes | Present; provenance `PLANETS_DATA_SOURCES.md` §1f, §3 |
| **Reused: four moon maps** `public/textures/moons/{mimas,enceladus,titan,iapetus}.jpg` | Four of the seven moon disks | **Public domain** (NASA / JPL / USGS Astrogeology; Cassini) | "NASA / JPL / USGS Astrogeology" (Titan/Enceladus/Iapetus "please cite authors") | Already in repo (Phase 5: Moons), sizes in §2 | Present (see §2); provenance `MOONS_DATA_SOURCES.md` §1e-1i |
| **New this phase: three moon maps** `public/textures/moons/{tethys,dione,rhea}.jpg` | The three remaining moon disks | **Public domain** (NASA / JPL / SSI / USGS Astrogeology; Cassini global mosaics) | "NASA / JPL / Space Science Institute / USGS Astrogeology" | Landed in repo this phase (see §2c), sizes in §2c | Present 2026-07-19; USGS Astrogeology source URLs logged in §2c; PD status per the USGS Cassini-mosaic pattern in `MOONS_DATA_SOURCES.md` §1 |
| **JPL Horizons / IMCCE PHESAT** | Authoritative cross-check of predicted positions and event times (validation only) | US-Gov / institutional ephemerides; **not shipped, never called at runtime** | n/a (not shipped) | Offline validation only | Same Horizons CORS rule as `DATA_SOURCES.md` §5; IMCCE PHESAT is the standard equinox mutual-event campaign |

**No new committed data artifact beyond the three moon textures this phase.** The
moon positions for any instant, and the transit / shadow transit / occultation /
eclipse / ring-interaction events over any window, are computed at runtime from
the Kepler propagation and the Meeus Ch. 45 ring geometry. The mean orbital
elements are transcribed into code (or a small constants file) from the JPL SSD
elem table; the reused Saturn, ring and four moon textures already exist from
earlier phases; the only new assets are the three Cassini moon maps (Tethys,
Dione, Rhea).

---

## 1. Method / algorithm sources

**This is the substance of the phase.** Two published methods do the work, both
implemented in our own code, neither downloaded as data:

- **Kepler propagation of real JPL mean orbital elements** for the seven moon
  positions, rotated by Saturn's IAU pole into the plane of sky.
- **Meeus, *Astronomical Algorithms*, Chapter 45** for the ring/tilt geometry
  (B, B', P).

This is the identical posture the repo already uses for:

- **Earth:** the NOAA / Spencer solar-position series in `lib/solar.ts`.
- **Mars:** the NASA GISS **Mars24** algorithm (Allison & McEwen 2000),
  implemented in code (`MARS_DATA_SOURCES.md` §4).
- **The Moon:** **Meeus / ELP2000** lunar theory (`MOON_DATA_SOURCES.md`).
- **The ISS:** **SGP4** propagation of a TLE (`ISS_DATA_SOURCES.md`).
- **Jupiter's moons:** **Meeus Ch. 44** satellite positions (Phase 14,
  `JUPITER_MOONS_DATA_SOURCES.md`).

In every one of those cases the repo's rule is the same, and it applies here
unchanged: **a published algorithm (the maths) is freely implementable. There is
no license on a formula.** The mean orbital elements themselves are US Government
public-domain data. We implement and we transcribe; we redistribute no software
and no database.

### 1a. Moon positions: Kepler from JPL mean elements, rotated by Saturn's pole

The apparent position of each moon is built in three steps, all in code:

- **Real mean orbital elements** for Mimas, Enceladus, Tethys, Dione, Rhea,
  Titan and Iapetus come from the **JPL SSD "Planetary Satellite Mean Orbital
  Elements"** table, ssd.jpl.nasa.gov/sats/elem/ (**ephemeris SAT441, epoch
  2000-01-01.5 TDB = J2000.0**; the same table used for the
  four Saturn moons already in `MOONS_DATA_SOURCES.md` §3). Each moon's full epoch
  state is used (semimajor axis, eccentricity, inclination, argument of periapsis,
  node, mean anomaly at epoch) plus the nodal and apsidal precession periods, so
  the along-orbit registration is real, not a schematic phase. **Frame note carried
  over from that doc:** JPL's mean elements are referred to **each satellite's
  local Laplace plane**, not the ecliptic, so the small inclinations are relative
  to that plane. This matters for Iapetus (see §1c).
- **Kepler two-body propagation** advances each moon along its ellipse from the
  element epoch to the requested instant (solve Kepler's equation for the
  eccentric anomaly, then true anomaly, then the position in the orbit plane).
  This is textbook two-body mechanics, implemented in our own code.
- **Rotation into the plane of sky** by **Saturn's IAU pole direction (J2000
  right ascension 40.589 deg, declination 83.537 deg)**, the IAU WGCCRE standard
  north-pole orientation for Saturn. `lib/planets` supplies Saturn's geocentric
  direction (RA/Dec and distance), so each moon's Saturn-centred vector is placed
  on the sky relative to Saturn's disk as seen from Earth. From those plane-of-sky
  offsets (and the near/far depth) every phenomenon in §1d is a clean condition.

### 1b. Ring / tilt geometry: Meeus, *Astronomical Algorithms*, Chapter 45

> **Jean Meeus, *Astronomical Algorithms*, 2nd edition, Willmann-Bell,
> Richmond VA, 1998. Chapter 45, "The Ring of Saturn."**

Chapter 45 gives a compact, directly implementable algorithm for the appearance
of Saturn's ring system at any instant, returning three quantities:

- **B**, the **saturnicentric latitude of the Earth** above the ring plane, i.e.
  how far the rings are **opened toward Earth** (B near 0 means the rings appear
  edge-on from Earth).
- **B'**, the same latitude **for the Sun**, i.e. how far the rings are opened
  **toward the Sun** (B' near 0 means the Sun is in the ring plane, which is what
  makes the rings and moons cast their shadows across, rather than away from, the
  disk).
- **P**, the **position angle of Saturn's north pole** (equivalently the tilt of
  the ring's minor axis) on the sky, which orients the whole disk-plus-ring
  silhouette for rendering.

This is a **published algorithm we implement in our own code** (a formula is not
a copyrightable dataset, the same posture the repo already uses for Mars24, SGP4,
the Meeus lunar theory and the Meeus Ch. 44 Jupiter method). **We validated our
implementation against the book's own worked example for 1992-12-16**, reproducing
its B, B' and P to the precision the printed example carries. B and B' are also
the quantities that make the equinox seasonality (§1c) computable: they tell you,
for any date, whether you are in the mutual-event and disk-transit season or not.

### 1c. Accuracy and the equinox seasonality (the load-bearing honesty)

**Seasonality first, because it is the most important caveat.** Saturn's regular
moons orbit close to Saturn's equatorial plane, which is also the ring plane. So
a moon only crosses **in front of** Saturn's disk (a transit), passes **behind**
it (an occultation), or casts its **shadow on** the cloud tops (a shadow transit)
during the **season around each Saturn equinox**, when that plane is nearly
edge-on to Earth (B near 0) and to the Sun (B' near 0). Equinox is a **ring-plane
crossing**, and it recurs only about **every 15 years** (half of Saturn's roughly
29.5-year orbit). **The last Saturn equinox was 2025-05-06.** Away from that
season the moons ride visibly above or below the disk and their shadows fall off
into space, so disk transits and shadow transits simply do not occur. The tab
must state this plainly and, ideally, show B and B' so the user can see why a
given date does or does not have events. The **IMCCE "PHESAT" campaigns** are the
authoritative predictions of these Saturnian satellite mutual events and eclipses
around each equinox, and are named here as the cross-check (see §3).

**Accuracy bound, stated honestly.** Kepler propagation from **mean** elements
reproduces the live geometry of the system but **ignores nodal and apsidal
precession** driven by Saturn's oblateness (its large **J2**) and by **Titan**.
So:

- Positions are good for the **live configuration** to **a fraction of a Saturn
  radius over days to weeks**, which is plenty to answer "which moon is where
  tonight, and is it in front of or behind Saturn" and to place events to within
  the honest window shown.
- Accuracy **degrades over months to years** as the un-modeled precession
  accumulates. This is **not observing-grade timing**. For precise event times
  (a mutual-event photometry campaign, a grazing occultation), the UI must point
  the user at **IMCCE PHESAT** and **JPL Horizons**, the authoritative offline
  cross-checks, and must not imply minute-level or second-level precision it does
  not have.
- **Iapetus is the least accurate.** Its orbit is **large and its Laplace plane
  is significantly tilted** (between Saturn's equatorial plane and its orbital
  plane), so both its long period and its tilted, precessing orbit make the
  simple Kepler-from-mean-elements approximation weakest for Iapetus. Flag it.

This is the same honesty discipline the repo applies to SGP4 ("good near epoch,
degrades with TLE age") and to the Mars24 clock ("cross-check against JPL
Horizons offline"): state the method, state its error bound, name the
authoritative source for cross-checks.

### 1d. The four phenomena, ring interactions, and Saturn's sky position

From the plane-of-sky offsets and the near/far depth, each phenomenon is a clean
condition tested against Saturn's **oblate** disk (Saturn is the most oblate
planet, flattened by about 10 percent, so the limb is a flattened ellipse, not a
circle):

- **Transit** (moon in front of the disk), **occultation** (moon behind the
  disk): Earth-line tests (near side vs far side).
- **Shadow transit** (moon's shadow on the cloud tops), **eclipse** (moon in
  Saturn's shadow): Sun-line tests.
- **Ring interactions:** a moon can be **occulted by the rings** (pass behind the
  opened ring as seen from Earth) or **cross the ring shadow / be eclipsed by the
  rings**. These are flagged, bounded to the same accuracy as everything else.

Two more computed quantities, from the same "we implement published theory"
bucket, make the tab useful to a real observer:

- **Saturn's geocentric RA/Dec** tells you whether Saturn is above the horizon at
  the observer's location and time (is the event watchable, not merely
  occurring). Computed via `lib/planets`, no API.
- **Saturn's small Sun-Saturn-Earth phase angle** (only about 6 degrees at most,
  smaller than Jupiter's because Saturn is farther) sets the tiny offset between a
  moon and its shadow on the disk. Also computed, no API. See
  `SATURN_MOONS_PHYSICS.md` for the geometry.

Both are cross-checked offline against JPL Horizons, never called from the
browser.

---

## 2. Textures (reused CC-BY + reused PD + three new PD this phase)

Unlike the Jupiter's Moons phase (which added no texture), this phase adds
**three** new moon maps but reuses everything else. There are three licensing
situations, and they differ:

### 2a. Reused Saturn and ring textures (CC-BY 4.0, attribution required)

| Texture (in repo) | Size (2026-07-19) | Source | License | Required credit | Provenance doc |
|---|---|---|---|---|---|
| `public/textures/planets/saturn.jpg` | 108,943 bytes | Solar System Scope, artist-tuned equirectangular cloud texture | **CC-BY 4.0** (not public domain) | "Solar System Scope (solarsystemscope.com), CC-BY 4.0" | `PLANETS_DATA_SOURCES.md` §1d, §1f |
| `public/textures/planets/saturn-rings.png` | 10,436 bytes | Solar System Scope, ring color strip | **CC-BY 4.0** (not public domain) | "Solar System Scope (solarsystemscope.com), CC-BY 4.0" | `PLANETS_DATA_SOURCES.md` §1f, §3 |

These two carry a **real attribution obligation** (CC-BY is a license condition,
not a courtesy): the credit string must appear in the app credits/about panel and
in the repo `CREDITS`/`ASSETS` file, exactly as the Planets phase already handles
the Solar System Scope textures (the Planets doc records the required string as
"Textures by Solar System Scope, CC BY 4.0"; either wording satisfies CC-BY as
long as the creator and license are named and the license is linked). Note also,
carried over from `PLANETS_PHYSICS.md`: the Saturn cloud texture is
**artist-tuned, not a raw observation**, and Saturn is drawn as an **unlit
snapshot**, so it must be labeled illustrative-of-appearance, not "live."

### 2b. Reused public-domain moon maps (already in repo, no new download)

| Texture (in repo) | Size (2026-07-19) | Source / mission | License | Credit | Provenance doc |
|---|---|---|---|---|---|
| `public/textures/moons/mimas.jpg` | 475,371 bytes | Cassini / Voyager global mosaic (added since Phase 5) | **Public domain** | NASA / JPL / USGS Astrogeology | `MOONS_DATA_SOURCES.md` §1i (was flagged un-shipped there; a PD mosaic is now present) |
| `public/textures/moons/enceladus.jpg` | 711,031 bytes | Cassini global mosaic 110m | **Public domain** (Use: please cite authors) | NASA / JPL / Space Science Institute | `MOONS_DATA_SOURCES.md` §1f |
| `public/textures/moons/titan.jpg` | 314,482 bytes | Cassini ISS global mosaic 4005m (**near-IR 938 nm**) | **Public domain** (Use: please cite authors) | NASA / JPL-Caltech / SSI | `MOONS_DATA_SOURCES.md` §1e |
| `public/textures/moons/iapetus.jpg` | 560,665 bytes | Cassini / Voyager global mosaic 803m (**two-tone**) | **Public domain** (Use: please cite authors) | NASA / JPL / Space Science Institute | `MOONS_DATA_SOURCES.md` §1g |

**Titan caveat, carried over and mandatory:** Titan's visible-light surface is
permanently hidden by orange haze, so `titan.jpg` is a **near-IR (938 nm),
haze-penetrating, processed albedo product**, not a visible-light photo. It must
be labeled as such (same posture as Venus' radar map), exactly as
`MOONS_DATA_SOURCES.md` §1e requires.

### 2c. New this phase: Tethys, Dione, Rhea (public-domain Cassini mosaics)

These three complete the seven-moon set and were fetched by another agent during
this phase. They **landed in the repo and were confirmed present on 2026-07-19**
(file sizes below).

| Texture (path) | Size (2026-07-19) | Source / mission | License | Credit |
|---|---|---|---|---|
| `public/textures/moons/tethys.jpg` | 628,419 bytes | NASA / JPL / SSI / USGS Cassini global mosaic | **Public domain** | NASA / JPL / Space Science Institute / USGS Astrogeology |
| `public/textures/moons/dione.jpg` | 714,576 bytes | NASA / JPL / SSI / USGS Cassini global mosaic | **Public domain** | NASA / JPL / Space Science Institute / USGS Astrogeology |
| `public/textures/moons/rhea.jpg` | 466,538 bytes | NASA / JPL / SSI / USGS Cassini global mosaic | **Public domain** | NASA / JPL / Space Science Institute / USGS Astrogeology |

State this clearly: **these three are real Cassini imagery, not illustrative
tinted spheres.** They are the USGS Astrogeology public-domain Cassini global
mosaics for the three moons, the same class of source and license as the Titan,
Enceladus and Iapetus maps already in the repo (see the USGS Cassini-mosaic
pattern in `MOONS_DATA_SOURCES.md` §1). Exact provenance (logged 2026-07-19):

- **Tethys** `tethys.jpg` (final 2048x1024 RGB, 628,419 bytes): USGS Astrogeology
  "Tethys Cassini Global Mosaic 293m",
  https://astrogeology.usgs.gov/search/map/tethys_cassini_global_mosaic_293m
  (direct: https://planetarymaps.usgs.gov/mosaic/Tethys_Cassini_mosaic_global_293m.tif,
  native 11520x5760 grayscale, 293 m/px). NASA / JPL / Space Science Institute, Cassini ISS.
- **Dione** `dione.jpg` (final 2048x1024 RGB, 714,576 bytes): USGS Astrogeology
  "Dione Cassini - Voyager Global Mosaic 154m",
  https://astrogeology.usgs.gov/search/map/dione_cassini_voyager_global_mosaic_154m
  (direct: https://planetarymaps.usgs.gov/mosaic/Dione_Cassini_Voyager_mosaic_global_154m.tif,
  native 23040x11520 grayscale, 154 m/px; Cassini ISS with Voyager gap-fill; Roatsch et al. 2016).
- **Rhea** `rhea.jpg` (final 2048x1024 RGB, 466,538 bytes): USGS Astrogeology
  "Rhea Cassini - Voyager Global Mosaic 417m",
  https://astrogeology.usgs.gov/search/map/rhea_cassini_voyager_global_mosaic_417m
  (direct: https://planetarymaps.usgs.gov/mosaic/Rhea_Cassini_Voyager_mosaic_global_417m.tif,
  native 11520x5760 grayscale, 417 m/px; mostly Cassini ISS, six Voyager images fill the
  north-polar gap; Photojournal PIA12821; Roatsch et al. 2016).

Each Astropedia page states "Public domain / Please cite authors" with originators
NASA / JPL / Space Science Institute. Processing was resize (Lanczos) to 2048x1024,
grayscale to RGB, saved as progressive JPEG quality 85; no color, crop or content
alteration. Public-domain status is the standard USGS/NASA policy for these mission
mosaics; the "please cite authors" courtesy applies as it does for the other Cassini maps.

---

## 3. No external data feed, no API, no runtime license

Stated plainly, because it is the defining property of this phase:

- **The positions, events and ring geometry are computed at runtime, not
  fetched.** There is no live feed, no polling endpoint, no API key, and no
  GitHub Action for this tab. Moon positions fall out of the Kepler propagation of
  the JPL mean elements rotated by Saturn's pole; the ring tilt (B, B', P) falls
  out of the Meeus Ch. 45 formulae; the phenomena and ring interactions are
  conditions on those.
- **The only licensing surface is the reused textures plus the freely-implementable
  published algorithms.** The Saturn and ring textures are **CC-BY 4.0**
  (attribution required, §2a); the seven moon maps are **public domain**; the
  algorithms are maths (not copyrightable); the JPL mean elements are US-Government
  public-domain data.
- **JPL Horizons and the IMCCE are cross-check sources only.** They are the
  authoritative ephemerides and event predictions against which we validate the
  implemented method offline. They are **not shipped and never called from the
  browser** at runtime. This inherits the established rule from `DATA_SOURCES.md`
  §5: JPL Horizons forbids browser embedding and sends no CORS header, so it is
  offline validation only. The **IMCCE PHESAT** ("phenomenes des satellites")
  campaigns are the standard predictions of Saturnian satellite mutual events and
  eclipses around each equinox and are the natural cross-check for this tab's
  event tables; also offline-only here.

This is the same shape as the Moon phase (Meeus lunar theory computed
client-side, Horizons offline), the Mars clock (Mars24 computed, Horizons
offline) and the Jupiter's Moons phase (Meeus Ch. 44 computed, Horizons/IMCCE
offline), applied to Saturn's satellites and rings.

---

## Rejected / flagged items

- **No runtime API for satellite positions.** JPL Horizons can return Saturnian
  satellite positions and event tables, but browser calls are policy-forbidden
  and CORS-blocked (`DATA_SOURCES.md` §5), and depending on a network call for
  something fully computable is the wrong design. **Rejected for runtime; retained
  for offline cross-check only** alongside IMCCE PHESAT.
- **Seasonality must be shown, not buried.** Disk transits and shadow transits
  occur only in the season around each Saturn equinox (ring-plane crossing, about
  every 15 years; last 2025-05-06). The UI must lead with this so it never implies
  events are available year-round. Flagged as the top honesty item.
- **Minute-level and second-level precision are not claimed.** Kepler from mean
  elements ignores nodal/apsidal precession (Saturn J2 + Titan): good for the live
  configuration to a fraction of a Saturn radius over days to weeks, degrading
  over months to years. Do not present event times to the second. For critical
  timing the UI must point to IMCCE PHESAT / JPL Horizons. Flagged.
- **Iapetus is the least accurate moon.** Large orbit, significantly tilted and
  precessing Laplace plane; the simple Kepler-from-mean-elements approximation is
  weakest here. Flag it specifically in the UI.
- **Saturn and ring textures are CC-BY 4.0, not public domain.** Attribution
  ("Solar System Scope (solarsystemscope.com), CC-BY 4.0") is a **license
  condition**, not a courtesy: it must appear in-app and in the repo
  `CREDITS`/`ASSETS` file, exactly as the Planets phase already does. This is the
  only attribution obligation this phase creates.
- **Saturn cloud map is artist-tuned and drawn unlit.** It is a Solar System Scope
  representation, not a raw observation, and the tab renders Saturn as an unlit
  snapshot. Label it illustrative-of-appearance, not "live" (per
  `PLANETS_PHYSICS.md`).
- **Titan map is near-IR, not visible light.** The shipped `titan.jpg` is a
  haze-penetrating 938 nm albedo product; Titan's visible surface is hidden by
  haze. Must be labeled as such (`MOONS_DATA_SOURCES.md` §1e).
- **Three new textures present, source URLs logged.**
  `tethys.jpg`, `dione.jpg`, `rhea.jpg` landed in the repo this phase (present
  2026-07-19, sizes in §2c); their USGS Astrogeology source URLs, native
  resolutions and processing are logged in §2c. They are real public-domain
  Cassini mosaics, not illustrative.
- **Provenance of record for reused textures lives in the sibling docs.** This doc
  restates the licenses for a self-contained record, but if there is ever a
  discrepancy, `PLANETS_DATA_SOURCES.md` (Saturn + rings) and
  `MOONS_DATA_SOURCES.md` (the moons) are authoritative.

---

**Verification methodology note:** The two method sources were recorded from the
published algorithms and implemented in our own code, redistributing no software
or dataset: (1) Kepler two-body propagation of the JPL SSD "Planetary Satellite
Mean Orbital Elements" (ssd.jpl.nasa.gov/sats/elem/, US-Gov public domain,
Laplace-plane frame), rotated by Saturn's IAU WGCCRE pole (J2000 RA 40.589 deg,
Dec 83.537 deg) using `lib/planets` for Saturn's geocentric direction; and (2)
Meeus, *Astronomical Algorithms*, 2nd ed., 1998, Chapter 45 ("The Ring of
Saturn") for B, B' and P, **validated against the book's worked example for
1992-12-16**. The reused Saturn and ring textures (CC-BY 4.0, Solar System Scope)
and the four reused moon textures (public domain, Cassini) were confirmed present
in the repo on 2026-07-19 with the file sizes listed in §2 (saturn.jpg 108,943
bytes; saturn-rings.png 10,436 bytes; mimas.jpg 475,371; enceladus.jpg 711,031;
titan.jpg 314,482; iapetus.jpg 560,665). The three new moon textures landed in
the repo and were confirmed present on 2026-07-19 (tethys.jpg 628,419; dione.jpg
714,576; rhea.jpg 466,538) as public-domain Cassini mosaics, with USGS Astrogeology
source URLs and native resolutions logged in §2c. No external
feed, API, or new committed dataset is used at runtime. JPL Horizons and IMCCE PHESAT are offline cross-check sources only, never
called at runtime (Horizons CORS rule per `DATA_SOURCES.md` §5). See
`docs/SATURN_MOONS_PHYSICS.md` for the honest-representation methodology.

---

## Phase 15 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app
wires this in. Frontend / physics implementation (`lib/`, `app/`, `components/`)
is out of scope for this doc; another agent owns it.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Moon apparent positions (7 moons) | Kepler propagation of JPL SSD mean elements (Laplace plane) + Saturn IAU pole (RA 40.589, Dec 83.537) + `lib/planets` | Computed in `lib/` (owned by another agent), no runtime API | Cross-check vs IMCCE PHESAT / JPL Horizons offline. Good to a fraction of R_Saturn over days to weeks; degrades months to years; Iapetus least accurate. |
| Ring tilt B / B' / P | Meeus *Astronomical Algorithms* Ch. 45 | Computed in `lib/`, no API | Validated vs the book's 1992-12-16 worked example. B/B' also gate the equinox event season. |
| Transit / shadow transit / occultation / eclipse + ring-interaction flags | Derived from the plane-of-sky positions vs Saturn's oblate disk and the Sun-line | Computed in-browser over the requested window | Disk transits/shadow transits only near equinox (last 2025-05-06). Label the accuracy bound; point to PHESAT/Horizons for critical timing. |
| Saturn sky position + phase angle (observer visibility) | Low-precision planetary theory via `lib/planets` (Meeus / VSOP87 truncation) | Computed in `lib/`, no API | Determines whether the event is above the observer's horizon; phase angle (max about 6 deg) sets the small moon-vs-shadow offset. |
| Saturn disk texture | Reused `public/textures/planets/saturn.jpg` (Solar System Scope, **CC-BY 4.0**) | Already in repo | Credit "Solar System Scope (solarsystemscope.com), CC-BY 4.0"; label artist-tuned / unlit snapshot. Attribution required in-app + CREDITS. |
| Saturn ring texture | Reused `public/textures/planets/saturn-rings.png` (Solar System Scope, **CC-BY 4.0**) | Already in repo | Same CC-BY credit + CREDITS obligation. Drawn to scale from real ring radii (`saturn_rings.json`, Planets phase). |
| Mimas / Enceladus / Titan / Iapetus disks | Reused `public/textures/moons/{mimas,enceladus,titan,iapetus}.jpg` (Cassini, PD) | Already in repo | Credit NASA/JPL/USGS(/SSI). Titan = near-IR/haze, label it. |
| Tethys / Dione / Rhea disks | New `public/textures/moons/{tethys,dione,rhea}.jpg` (Cassini, PD) | Present in repo (2026-07-19) | Real Cassini imagery, not illustrative. Source URLs/dimensions in §2c. |
| Real orbital periods / radii | JPL SSD (mean elements + physical parameters) | Transcribed into code/constants | Periods approx: Mimas 0.94 d, Enceladus 1.37 d, Tethys 1.89 d, Dione 2.74 d, Rhea 4.52 d, Titan 15.95 d, Iapetus 79.3 d. |
