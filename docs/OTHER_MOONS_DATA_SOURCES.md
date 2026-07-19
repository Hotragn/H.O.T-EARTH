# Other Moons (Mars, Uranus and Neptune Satellites) Data Sources (Phase 16)

Verification date: **2026-07-19**. Every source, method, texture and license
below was recorded on this date against the cited published algorithms, the
already-shipped textures in this repo, the seven new moon maps being added this
phase, and the sibling data-source docs. Same rigor and honesty bar as
`DATA_SOURCES.md` (Earth), `PLANETS_DATA_SOURCES.md`, `MOONS_DATA_SOURCES.md`,
`MOON_DATA_SOURCES.md`, `METEOR_SHOWERS_DATA_SOURCES.md`,
`JUPITER_MOONS_DATA_SOURCES.md` and `SATURN_MOONS_DATA_SOURCES.md` (Phase 15, our
closest template): real physics, real data, honest claims, everything free and
legally usable for an open-source app, every source and license logged. Anything
that cannot be verified from an official source is explicitly flagged.

Scope this phase: a combined **"Other Moons" tab** that computes and animates the
apparent motion of ten satellites around three planets, **Mars** (Phobos,
Deimos), **Uranus** (Miranda, Ariel, Umbriel, Titania, Oberon) and **Neptune**
(Triton, Proteus, Nereid), showing each moon's real live position around its
planet, the striking system geometry (Uranus tipped on its side, Triton's
retrograde orbit, Phobos racing below synchronous height), and, where the
geometry permits it at all, flags for transits, shadow transits, occultations and
eclipses against the planet's disk.

> **Honesty rule for this phase (from the project brief):** this tab is almost
> entirely **COMPUTED from published orbital theory**, not fetched from any data
> feed. The honest story is four lines, and the first one is the one that matters
> most:
>
> 1. **This is a configuration view, not an events predictor. Stated up front.**
>    Unlike Jupiter (nearly edge-on to Earth, with a crisp shadow-transit dot
>    crossing its big disk almost daily, Phase 14), these three planets show
>    **tiny disks** from Earth (Mars about 4 to 25 arcsec depending on opposition,
>    Uranus about 3.7 arcsec, Neptune about 2.3 arcsec), so a moon transiting the
>    disk or casting a shadow across it is **rare to effectively unobservable from
>    Earth**. What the tab honestly shows is each moon's **real live apparent
>    position** and the **striking true geometry**: Uranus's whole system tipped
>    about **98 degrees** (its opening toward us changing across an 84-year season,
>    last equinox **2007**, next about **2049**), Triton's **retrograde** orbit
>    around Neptune, and **Phobos** circling Mars in about **7.65 hours**, well
>    below synchronous height, so it rises in the west and is slowly spiraling in.
>    The tab leads with this, and does not sell itself as a shadow-transit clock.
> 2. **Real physics, computed.** Moon positions come from **Kepler propagation of
>    real cited JPL mean orbital elements**, oriented by **each planet's IAU pole**
>    into the plane of sky. Same posture as Earth's `lib/solar.ts`, Mars' Mars24,
>    the Moon's Meeus theory, the ISS's SGP4, the Jupiter Ch. 44 method and the
>    Saturn Kepler-plus-Ch. 45 method (Phase 15).
> 3. **Real textures.** The Mars and Triton disks and the seven new moon maps are
>    genuine public-domain spacecraft imagery; the Uranus and Neptune disks are
>    reused CC-BY artist textures (attribution required); Proteus and Nereid have
>    no map and are honest illustrative tinted spheres.
> 4. **Accuracy stated.** Kepler from mean elements is low-accuracy and degrades
>    away from the element epoch. **Triton** (its Laplace plane is tilted from
>    Neptune's equator) and **Nereid** (ecliptic frame, 2020 epoch, extreme
>    eccentricity e = 0.751) are the **least accurate**; Phobos, Deimos and the
>    five Uranian moons are solid near epoch. We say so and point at **JPL
>    Horizons** for critical cross-checks. We invent nothing and we fetch nothing
>    at runtime. See `docs/OTHER_MOONS_PHYSICS.md` for the computed / reused /
>    illustrative contract.

## Summary table

| Source | What it provides | License / status | Attribution | Access | Verified against (2026-07-19) |
|---|---|---|---|---|---|
| **JPL SSD "Planetary Satellite Mean Orbital Elements"** (ssd.jpl.nasa.gov/sats/elem/) | The mean orbital elements (a, e, i, node, argument, mean longitude, epoch) for all ten moons: **Mars set MAR099** (J2000, Laplace plane), the **Uranus set** (J2000, Uranus **equatorial** frame), the **Neptune set** (Triton and Proteus J2000 Laplace plane; **Nereid** ecliptic frame, **2020 epoch, e = 0.751**) | US Government data, **public domain**; transcribed into code, not redistributed as a database | Cite "JPL Solar System Dynamics, Planetary Satellite Mean Orbital Elements" | Values transcribed offline; Kepler propagation runs in code, no runtime API | Same JPL SSD elem table used in `MOONS_DATA_SOURCES.md` §3 (Laplace / equatorial / ecliptic frames flagged per set below) |
| **Kepler propagation + each planet's IAU pole** (Mars RA 317.681 deg, Dec 52.887 deg; Uranus RA 257.311 deg, Dec -15.175 deg; Neptune RA 299.36 deg, Dec 43.46 deg) | Apparent moon positions: Kepler two-body motion from the mean elements, oriented by the planet's pole from the element frame into the plane of sky, using `lib/planets` for the planet's geocentric direction | Published method (two-body Kepler + standard frame rotation). **Not a copyrightable dataset**; we implement it | Cite standard orbital mechanics; poles from **IAU WGCCRE** (Archinal et al.) | Computed in code, no runtime API | Poles are the IAU-standard north-pole directions for Mars, Uranus and Neptune; propagation cross-checked offline (see §1c) |
| **Planet geocentric RA/Dec + apparent diameter + system tilt** | Where each planet is in Earth's sky (observer visibility), its apparent disk size (the tiny target the events would play out on), and the opening of its equatorial/moon plane toward Earth | Published algorithm (VSOP87 truncation / Meeus planetary chapters), "we implement it" posture, via `lib/planets` | Cite Meeus, *Astronomical Algorithms* | Computed in code, no runtime API | Standard low-precision planetary theory; cross-check JPL Horizons offline |
| **Reused: Mars surface texture** `public/textures/mars-mola-colorized.jpg` | The Mars disk the moons circle | **Public domain** (NASA / USGS, MGS MOLA colorized shaded relief) | "NASA / USGS / MOLA Science Team" | Already in repo (Phase: Mars), 2,256,339 bytes | Present; provenance `MARS_DATA_SOURCES.md` §1b (color = elevation, not visible photo) |
| **Reused: Uranus and Neptune textures** `public/textures/planets/{uranus,neptune}.jpg` | The two ice-giant disks | **CC-BY 4.0** (Solar System Scope), attribution required | "Solar System Scope (solarsystemscope.com), CC-BY 4.0" | Already in repo (Phase: Planets), uranus.jpg 25,679 bytes / neptune.jpg 54,181 bytes | Present; provenance `PLANETS_DATA_SOURCES.md` §1e/§1f (artist-tuned, stylized, no PD map exists) |
| **Reused: Triton map** `public/textures/moons/triton.jpg` | The Triton disk | **Public domain** (NASA / JPL / Dr. Paul Schenk; Voyager 2 1989) | "NASA / JPL / USGS Astrogeology (Voyager 2)" | Already in repo (Phase 5: Moons), 218,316 bytes | Present; provenance `MOONS_DATA_SOURCES.md` §1h (one hemisphere, 1989; north-pole gap is a synthetic fill, label it) |
| **New this phase: Phobos and Deimos maps** `public/textures/moons/{phobos,deimos}.jpg` | The two Martian-moon disks | **Public domain** (NASA / JPL / USGS Astrogeology; Viking) | "NASA / JPL-Caltech / USGS" | Present, verified on disk 2026-07-19 (2048x1024; provenance in §2c) | Phobos and Deimos are **irregular** bodies, so a sphere map is an approximation, label it |
| **New this phase: five Uranian moon maps** `public/textures/moons/{miranda,ariel,umbriel,titania,oberon}.jpg` | The five major Uranian-moon disks | **Public domain** (NASA / JPL / USGS Astrogeology; Voyager 2 1986 mosaics) | "NASA / JPL-Caltech / USGS" | Present, verified on disk 2026-07-19 (2048x1024; provenance in §2c) | Voyager 2 imaged mainly the **southern** hemispheres in 1986, so large northern coverage gaps, label it |
| **Illustrative: Proteus and Nereid** (no dedicated map) | The two remaining Neptunian-moon markers | n/a (no texture; tinted sphere) | n/a | No texture shipped; rendered as labeled tinted spheres | Same handling as the never-visited dwarf planets in `DWARF_PLANETS_DATA_SOURCES.md` §1e (illustrative, clearly labeled) |
| **JPL Horizons** | Authoritative cross-check of predicted moon positions (validation only) | US-Gov ephemerides; **not shipped, never called at runtime** | n/a (not shipped) | Offline validation only | Same Horizons CORS rule as `DATA_SOURCES.md` §5 |

**No new committed data artifact beyond the moon textures this phase.** The moon
positions for any instant, and any transit / shadow transit / occultation /
eclipse flags over any window, are computed at runtime from the Kepler
propagation of the JPL mean elements oriented by each planet's IAU pole. The
mean orbital elements are transcribed into code (or a small constants file) from
the JPL SSD elem table; the reused Mars, Uranus, Neptune and Triton textures
already exist from earlier phases; the only new assets are the seven public-domain
moon maps (Phobos, Deimos and the five major Uranian moons), and Proteus and
Nereid are illustrative tinted spheres with no shipped texture.

---

## 1. Method / algorithm sources

**This is the substance of the phase.** One published method does the work,
implemented in our own code, not downloaded as data:

- **Kepler propagation of real cited JPL mean orbital elements** for the ten moon
  positions, oriented by each planet's IAU pole into the plane of sky, with the
  planet's own geocentric direction, apparent diameter and system tilt from
  `lib/planets`.

This is the identical posture the repo already uses for:

- **Earth:** the NOAA / Spencer solar-position series in `lib/solar.ts`.
- **Mars:** the NASA GISS **Mars24** algorithm (Allison and McEwen 2000),
  implemented in code (`MARS_DATA_SOURCES.md` §4).
- **The Moon:** **Meeus / ELP2000** lunar theory (`MOON_DATA_SOURCES.md`).
- **The ISS:** **SGP4** propagation of a TLE (`ISS_DATA_SOURCES.md`).
- **Jupiter's moons:** **Meeus Ch. 44** satellite positions (Phase 14,
  `JUPITER_MOONS_DATA_SOURCES.md`).
- **Saturn's moons:** **Kepler from JPL mean elements + Meeus Ch. 45** ring
  geometry (Phase 15, `SATURN_MOONS_DATA_SOURCES.md`).

In every one of those cases the repo's rule is the same, and it applies here
unchanged: **a published algorithm (the maths) is freely implementable. There is
no license on a formula.** The mean orbital elements themselves are US Government
public-domain data. We implement and we transcribe; we redistribute no software
and no database.

### 1a. Moon positions: Kepler from JPL mean elements, oriented by the planet's pole

The apparent position of each moon is built in three steps, all in code:

- **Real mean orbital elements** for the ten moons come from the **JPL SSD
  "Planetary Satellite Mean Orbital Elements"** table, ssd.jpl.nasa.gov/sats/elem/.
  Each moon's full epoch state is used (semimajor axis, eccentricity, inclination,
  argument of periapsis, node, mean longitude at epoch), so the along-orbit
  registration is real, not a schematic phase. The three element sets carry
  **different reference frames**, and that is load-bearing (see §1b).
- **Kepler two-body propagation** advances each moon along its ellipse from the
  element epoch to the requested instant (solve Kepler's equation for the
  eccentric anomaly, then true anomaly, then the position in the orbit plane).
  This is textbook two-body mechanics, implemented in our own code.
- **Rotation into the plane of sky** by the **planet's IAU pole direction**, the
  IAU WGCCRE standard north-pole orientation: **Mars** (J2000 RA 317.681 deg,
  Dec 52.887 deg), **Uranus** (RA 257.311 deg, Dec -15.175 deg), **Neptune**
  (RA 299.36 deg, Dec 43.46 deg). `lib/planets` supplies each planet's geocentric
  direction (RA/Dec and distance), so each moon's planet-centered vector is placed
  on the sky relative to the planet's disk as seen from Earth. From those
  plane-of-sky offsets (and the near/far depth) each phenomenon flag in §1d is a
  clean condition.

### 1b. The three element sets and their frames (the detail that must be right)

JPL publishes each planet's satellite mean elements in whatever frame is most
natural for that system, and mixing them up would corrupt the geometry. The three
sets used here are:

- **Mars (set MAR099), epoch J2000, referred to the Laplace plane.** Phobos and
  Deimos have small inclinations to Mars's Laplace plane; the set is a clean,
  well-determined near-epoch solution. Orienting from the Laplace plane by Mars's
  pole (RA 317.681, Dec 52.887) puts them on the sky.
- **Uranus set, epoch J2000, referred to Uranus's equatorial frame.** This is the
  one to watch: the five major Uranian moons (Miranda, Ariel, Umbriel, Titania,
  Oberon) are given in **Uranus's equatorial** plane, not a Laplace plane and not
  the ecliptic. Because Uranus's pole is tipped about 98 degrees, this equatorial
  plane is nearly perpendicular to the ecliptic, which is exactly why the whole
  Uranian system appears as a set of near-circular rings around a tipped-over
  planet. Orient by Uranus's pole (RA 257.311, Dec -15.175).
- **Neptune set, mixed frames.** **Triton** and **Proteus** are given at **epoch
  J2000 in Neptune's Laplace plane**; Triton's inclination there encodes its
  **retrograde** orbit. **Nereid** is a special case: it is given in the
  **ecliptic frame at a 2020 epoch** with an **extreme eccentricity, e = 0.751**,
  because Nereid's orbit is so eccentric and so perturbed that a J2000 Laplace-plane
  mean element set is not the useful representation. Orient by Neptune's pole
  (RA 299.36, Dec 43.46). The frame and epoch differences are the main reason
  Triton and Nereid are the least accurate of the ten (see §1c).

### 1c. Accuracy and the configuration-view honesty (the load-bearing part)

**Configuration first, because it is the most important caveat.** The three
planets present **tiny disks** to Earth: Mars swings between about **4 arcsec**
(near conjunction) and about **25 arcsec** (near a close opposition), Uranus is
about **3.7 arcsec**, and Neptune about **2.3 arcsec**. Against targets that small,
a moon crossing **in front of** the disk (a transit), passing **behind** it (an
occultation) or casting its **shadow on** the disk (a shadow transit) is
**rare to effectively unobservable from Earth**, unlike Jupiter's near-edge-on
system where a shadow dot crawls across a big disk almost nightly (Phase 14). So
the honest product is a **configuration view**: the real live apparent positions
of the moons strung around each planet, plus the genuinely striking geometry
(Uranus tipped about 98 degrees, Triton retrograde, Phobos below synchronous
height). The four event flags (§1d) are still computed and shown honestly, but the
tab leads with the configuration and never implies a nightly shadow-transit show
that these systems do not, from Earth, provide.

**Accuracy bound, stated honestly.** Kepler propagation from **mean** elements
reproduces the live layout of each system but **ignores nodal and apsidal
precession** and the higher-order perturbations. So:

- Positions are good for the **live configuration** near the element epoch, enough
  to answer "which moon is where around the planet tonight, and roughly where in
  its orbit" and to place any flag within the honest window shown.
- Accuracy **degrades away from epoch** as the un-modeled precession and
  perturbations accumulate. This is **not observing-grade timing**. For precise
  positions or event times the UI must point the user at **JPL Horizons**, the
  authoritative offline cross-check, and must not imply minute-level or
  second-level precision it does not have.
- **Triton and Nereid are the least accurate.** Triton's Laplace plane is
  significantly **tilted from Neptune's equator** and its orbit precesses, so the
  simple Kepler-from-mean-elements approximation is weakest for it; **Nereid** is
  worse still (ecliptic frame, **2020 epoch**, **e = 0.751**, so a tiny error in
  the element set swings a large position error near periapsis). Flag both.
- **Phobos, Deimos and the five Uranian moons are solid near epoch.** Their
  near-circular, well-determined orbits propagate cleanly; they are the trustworthy
  part of the tab.

This is the same honesty discipline the repo applies to SGP4 ("good near epoch,
degrades with TLE age"), to the Mars24 clock ("cross-check against JPL Horizons
offline") and to the Saturn Kepler propagation ("good to a fraction of a Saturn
radius over days to weeks, degrading over months to years"): state the method,
state its error bound, name the authoritative source for cross-checks.

### 1d. The four phenomenon flags and each planet's sky position

From the plane-of-sky offsets and the near/far depth, each phenomenon is a clean
condition tested against the planet's disk, and each is **shown honestly as
rare-to-unobservable given the tiny disks** (§1c):

- **Transit** (moon in front of the disk) and **occultation** (moon behind the
  disk): Earth-line tests (near side vs far side).
- **Shadow transit** (moon's shadow on the planet) and **eclipse** (moon in the
  planet's shadow): Sun-line tests.

Three more computed quantities, from the same "we implement published theory"
bucket, make the tab honest and useful:

- **Each planet's geocentric RA/Dec** tells you whether the planet is above the
  horizon at the observer's location and time, and where to find it. Computed via
  `lib/planets`, no API.
- **Each planet's apparent diameter** (Mars about 4 to 25 arcsec, Uranus about
  3.7, Neptune about 2.3) is the actual target size, and is why the event flags
  are rare. Also computed, no API.
- **Each planet's system tilt**, the opening of its equatorial/moon plane toward
  Earth, especially Uranus's roughly 98-degree tip whose opening changes across
  its 84-year season (equinox 2007, next about 2049). Computed from the pole and
  the planet's geocentric direction. See `OTHER_MOONS_PHYSICS.md` for the geometry.

All are cross-checked offline against JPL Horizons, never called from the browser.

---

## 2. Textures (reused PD + reused CC-BY + reused PD moon + new PD + illustrative)

This phase reuses four textures already in the repo, adds seven new public-domain
moon maps (fetched by another agent), and renders two moons (Proteus, Nereid) as
illustrative tinted spheres with no texture. The licensing situations differ and
are kept separate below.

### 2a. Reused Mars, Uranus and Neptune disk textures

| Texture (in repo) | Size (2026-07-19) | Source | License | Required credit | Provenance doc |
|---|---|---|---|---|---|
| `public/textures/mars-mola-colorized.jpg` | 2,256,339 bytes | NASA / USGS MGS MOLA color shaded relief (colorized topography) | **Public domain** (USGS "Use: None") | "NASA / USGS / MOLA Science Team" | `MARS_DATA_SOURCES.md` §1b |
| `public/textures/planets/uranus.jpg` | 25,679 bytes | Solar System Scope, artist-tuned equirectangular texture (2k; no PD Uranus map exists) | **CC-BY 4.0** (not public domain) | "Solar System Scope (solarsystemscope.com), CC-BY 4.0" | `PLANETS_DATA_SOURCES.md` §1e, §1f |
| `public/textures/planets/neptune.jpg` | 54,181 bytes | Solar System Scope, artist-tuned equirectangular texture (2k; no PD Neptune map exists) | **CC-BY 4.0** (not public domain) | "Solar System Scope (solarsystemscope.com), CC-BY 4.0" | `PLANETS_DATA_SOURCES.md` §1e, §1f |

Two honesty notes carried over and mandatory:

- **Mars MOLA texture:** `mars-mola-colorized.jpg` is a **colorized MOLA
  elevation/relief** map (blue lowlands, red-white highlands), so its color
  encodes **elevation**, not a true-color photograph. It is honest topography data,
  labeled as such per `MARS_DATA_SOURCES.md` §1b.
- **Uranus and Neptune textures carry a real attribution obligation and are
  stylized.** CC-BY 4.0 is a **license condition**, not a courtesy: the credit
  string must appear in the app credits/about panel and in the repo
  `CREDITS`/`ASSETS` file, exactly as the Planets phase already handles the Solar
  System Scope textures. They are also **artist-tuned representations, not raw
  observations** (no public-domain equirectangular map exists for either ice giant,
  only one Voyager 2 flyby each), so they must be labeled **stylized/illustrative**
  and are drawn as **unlit snapshots**, per `PLANETS_DATA_SOURCES.md` §1e/§1f and
  `PLANETS_PHYSICS.md`.

### 2b. Reused public-domain Triton map (already in repo, no new download)

| Texture (in repo) | Size (2026-07-19) | Source / mission | License | Credit | Provenance doc |
|---|---|---|---|---|---|
| `public/textures/moons/triton.jpg` | 218,316 bytes | Voyager 2 Global Color Mosaic 600m (GlobalFill) | **Public domain** (Use: please cite authors) | NASA / JPL / USGS Astrogeology (Voyager 2; Dr. Paul Schenk) | `MOONS_DATA_SOURCES.md` §1h |

**Triton caveat, carried over and mandatory:** Triton was imaged by **Voyager 2 on
a single flyby (August 1989)**, which saw only **one hemisphere** at usable
resolution. The "GlobalFill" map fills the large **north-polar gap** with a
**synthetic fill** (neighboring-pixel interpolation), so the northern hemisphere is
**not a real observation**. It must be labeled honestly ("Voyager 2, one hemisphere,
1989; northern hemisphere synthetic fill"), exactly as `MOONS_DATA_SOURCES.md` §1h
already does.

### 2c. New this phase: Phobos, Deimos and the five major Uranian moons (public-domain)

These seven complete the imaged-moon set and **were fetched, verified and confirmed
present on disk 2026-07-19** (all standardized to 2048x1024, 2:1 equirectangular RGB
JPEG to match the existing moon textures). They all trace to the same
Caltech/JPL/USGS Voyager/Viking map lineage (US Government / USGS products, public
domain); credit "NASA / JPL-Caltech / USGS". CC-BY-SA alternatives for Deimos were
found and rejected per the public-domain-only rule. Logged provenance:

| Texture (path) | Size | Native / source | Source URL | License / mandatory label |
|---|---|---|---|---|
| `public/textures/moons/phobos.jpg` | 480,908 B | 7200x3600 grayscale, downsized to 2048x1024 (RGB, q88) | USGS "Phobos Viking Mosaic 40ppd DLRcontrol", astrogeology.usgs.gov/search/map/Phobos/Viking/Phobos_Viking_Mosaic_40ppd_DLRcontrol (fetched via Wikimedia `File:Phobos Viking Mosaic DLRcontrol 7200.jpg`) | **Public domain** (USGS/PDS controlled Viking mosaic). **Irregular body**: sphere map is an approximation, label it. |
| `public/textures/moons/deimos.jpg` | 193,463 B | 1440x720 grayscale, upscaled to 2048x1024 (RGB, q88) | NASA/JPL Solar System Simulator, maps.jpl.nasa.gov/tmaps/pix/mar2kuu2.jpg (Viking, Caltech/JPL/USGS) | **Public domain**. **Irregular body**: same approximation caveat as Phobos, label it. |
| `public/textures/moons/miranda.jpg` | 174,440 B | 1440x720, upscaled to 2048x1024 (q88) | Caltech/JPL/USGS Voyager 2, Wikimedia `File:Miranda map JPL USGS.jpg` (orig maps.jpl.nasa.gov/tmaps/uranus.html) | **Public domain**. **Southern-hemisphere coverage**: Voyager 2 imaged mainly the southern hemispheres in 1986, northern hemisphere is a large gap, label it. |
| `public/textures/moons/ariel.jpg` | 121,189 B | 1440x720, upscaled to 2048x1024 (q88) | Caltech/JPL/USGS Voyager 2, Wikimedia `File:Ariel map JPL USGS.jpg` | **Public domain**. Same southern-hemisphere coverage gap, label it. |
| `public/textures/moons/umbriel.jpg` | 88,748 B | 1440x720, upscaled to 2048x1024 (q88) | Caltech/JPL/USGS Voyager 2, Wikimedia `File:Umbriel map JPL USGS.jpg` | **Public domain**. Same southern-hemisphere coverage gap, label it. |
| `public/textures/moons/titania.jpg` | 146,833 B | 1440x720, upscaled to 2048x1024 (q88) | Caltech/JPL/USGS Voyager 2, Wikimedia `File:Titania map JPL USGS.jpg` | **Public domain**. Same southern-hemisphere coverage gap, label it. |
| `public/textures/moons/oberon.jpg` | 114,599 B | 1440x720 grayscale, upscaled to 2048x1024 (RGB, q88) | Caltech/JPL/USGS Voyager 2, Wikimedia `File:Oberon map JPL USGS.jpg` | **Public domain**. Same southern-hemisphere coverage gap, label it. |

State this clearly: **these seven are real spacecraft imagery, not illustrative
tinted spheres**, the same class of source and license as the Cassini and Voyager
moon maps already in the repo (see the USGS mission-mosaic pattern in
`MOONS_DATA_SOURCES.md` §1). Two coverage realities are mandatory to label, both
honest features of the data, not defects to hide:

- **Phobos and Deimos are irregular (non-spherical) bodies.** Wrapping a Viking/MRO
  map onto a sphere is a rendering approximation. Either render the map on a sphere
  and label it "approximate shape", or use a real shape model where one is
  available; either way the sphere case must be labeled.
- **The five Uranian moons were imaged mainly in their southern hemispheres by
  Voyager 2 in January 1986** (Uranus was near southern-summer solstice, so the
  northern hemispheres were in darkness during the flyby). These maps therefore have
  **large northern coverage gaps**, exactly the honest posture already applied to
  Triton (one hemisphere, 1989). Label them.

If the fetch agent leaves per-file details (native resolution, USGS map-page URL,
direct download URL, processing pipeline, final dimensions and byte size), reflect
them here in the same format the Saturn doc used for Tethys/Dione/Rhea.

### 2d. Proteus and Nereid: no map, illustrative tinted spheres

Proteus and Nereid have **no dedicated surface map** (both are small and poorly
imaged: Proteus is a dark, irregular inner Neptunian moon caught only in low
resolution by Voyager 2, and Nereid was never resolved), so they are rendered as
**clearly-labeled illustrative tinted spheres**, exactly as the never-visited
dwarf planets (Eris, Haumea, Makemake) are handled in
`DWARF_PLANETS_DATA_SOURCES.md` §1e. **No texture is shipped for them**; the tinted
sphere uses each moon's measured color/albedo with no fake surface detail, and must
carry an "illustration, not an observation" label. Their **positions are still
fully computed** from the JPL elements (Proteus J2000 Laplace plane; Nereid ecliptic
frame, 2020 epoch, e = 0.751); only their **appearance** is illustrative.

---

## 3. No external data feed, no API, no runtime license

Stated plainly, because it is the defining property of this phase:

- **The positions and event flags are computed at runtime, not fetched.** There is
  no live feed, no polling endpoint, no API key, and no GitHub Action for this tab.
  Moon positions fall out of the Kepler propagation of the JPL mean elements
  oriented by each planet's pole; the four phenomenon flags, the planet sky
  positions, apparent diameters and system tilts are conditions on those.
- **The only licensing surface is the reused and new textures plus the
  freely-implementable published method.** The Mars MOLA and Triton textures and
  the seven new moon maps are **public domain**; the Uranus and Neptune textures
  are **CC-BY 4.0** (attribution required, §2a); the Kepler method is maths (not
  copyrightable); the JPL mean elements are US-Government public-domain data.
- **JPL Horizons is a cross-check source only.** It is the authoritative ephemeris
  against which we validate the implemented method offline. It is **not shipped and
  never called from the browser** at runtime. This inherits the established rule
  from `DATA_SOURCES.md` §5: JPL Horizons forbids browser embedding and sends no
  CORS header, so it is offline validation only.

This is the same shape as the Moon phase (Meeus lunar theory computed client-side,
Horizons offline), the Mars clock (Mars24 computed, Horizons offline) and the
Saturn's Moons phase (Kepler + Meeus Ch. 45 computed, Horizons offline), applied to
the Martian, Uranian and Neptunian satellites.

---

## Rejected / flagged items

- **This is a configuration view, not an events predictor. Shown, not buried.**
  The planet disks are tiny from Earth (Mars about 4 to 25 arcsec, Uranus about
  3.7, Neptune about 2.3), so moon transits, shadow transits, occultations and
  eclipses across them are **rare to effectively unobservable**, unlike Jupiter's
  near-edge-on, near-nightly shadow transits. The UI must lead with the live
  configuration and the geometry (Uranus tipped about 98 degrees, Triton
  retrograde, Phobos below synchronous height) and must not sell a shadow-transit
  clock these systems do not provide from Earth. Flagged as the top honesty item.
- **No runtime API for satellite positions.** JPL Horizons can return these
  satellite positions, but browser calls are policy-forbidden and CORS-blocked
  (`DATA_SOURCES.md` §5), and depending on a network call for something fully
  computable is the wrong design. **Rejected for runtime; retained for offline
  cross-check only.**
- **Minute-level and second-level precision are not claimed.** Kepler from mean
  elements ignores nodal/apsidal precession and higher-order perturbations: good
  for the live configuration near epoch, degrading away from it. Do not present
  positions or event times to the second. For critical work the UI must point to
  JPL Horizons. Flagged.
- **Triton and Nereid are the least accurate moons.** Triton's Laplace plane is
  tilted from Neptune's equator and precesses; Nereid is in the ecliptic frame at a
  2020 epoch with extreme eccentricity (e = 0.751), so small element errors swing
  large position errors near periapsis. Flag both specifically in the UI. Phobos,
  Deimos and the five Uranian moons are solid near epoch.
- **Element frames must not be mixed.** Mars (MAR099) is J2000 Laplace plane; the
  Uranus set is J2000 in Uranus's **equatorial** frame; Triton and Proteus are
  J2000 Laplace plane; Nereid is the **ecliptic** frame at a **2020 epoch**. Each
  set must be oriented from its own frame by the planet's pole. Flagged.
- **Uranus and Neptune textures are CC-BY 4.0 and stylized, not public domain.**
  Attribution ("Solar System Scope (solarsystemscope.com), CC-BY 4.0") is a
  **license condition**: it must appear in-app and in the repo `CREDITS`/`ASSETS`
  file. They are also artist-tuned (no PD ice-giant map exists) and drawn as unlit
  snapshots, so label them stylized/illustrative. This is the only attribution
  obligation this phase creates.
- **Triton map has a synthetic northern hemisphere.** The shipped `triton.jpg` is
  Voyager 2, one hemisphere (1989); the north-polar gap is a synthetic fill, not an
  observation. Must be labeled as such (`MOONS_DATA_SOURCES.md` §1h).
- **Phobos and Deimos are irregular bodies.** A texture on a sphere is an
  approximation of their real lumpy shape; label the sphere case (§2c).
- **The five Uranian moon maps are southern-hemisphere-heavy.** Voyager 2 imaged
  mainly the southern hemispheres in 1986; the northern hemispheres are large
  coverage gaps. Label them, same posture as Triton (§2c).
- **Proteus and Nereid have no map.** They are small and poorly imaged, so they are
  clearly-labeled illustrative tinted spheres (no texture shipped), exactly as the
  never-visited dwarf planets are handled (`DWARF_PLANETS_DATA_SOURCES.md` §1e).
  Their positions are still fully computed.
- **Seven new textures present and logged (2026-07-19).** `phobos.jpg`, `deimos.jpg`,
  `miranda.jpg`, `ariel.jpg`, `umbriel.jpg`, `titania.jpg`, `oberon.jpg` were fetched,
  verified (2048x1024 RGB JPEG) and their sizes, native resolutions, source URLs and
  processing are logged in §2c. They are real public-domain mission mosaics, not
  illustrative.
- **Provenance of record for reused textures lives in the sibling docs.** This doc
  restates the licenses for a self-contained record, but if there is ever a
  discrepancy, `MARS_DATA_SOURCES.md` (Mars), `PLANETS_DATA_SOURCES.md` (Uranus,
  Neptune) and `MOONS_DATA_SOURCES.md` (Triton) are authoritative.

---

**Verification methodology note:** The method source was recorded from the
published algorithm and implemented in our own code, redistributing no software or
dataset: Kepler two-body propagation of the JPL SSD "Planetary Satellite Mean
Orbital Elements" (ssd.jpl.nasa.gov/sats/elem/, US-Gov public domain), using the
**Mars set MAR099** (J2000, Laplace plane), the **Uranus set** (J2000, Uranus
equatorial frame) and the **Neptune set** (Triton and Proteus J2000 Laplace plane;
Nereid ecliptic frame, 2020 epoch, e = 0.751), oriented by each planet's IAU WGCCRE
pole (Mars RA 317.681 deg, Dec 52.887 deg; Uranus RA 257.311 deg, Dec -15.175 deg;
Neptune RA 299.36 deg, Dec 43.46 deg) using `lib/planets` for each planet's
geocentric direction, apparent diameter and system tilt. The reused Mars texture
(public domain, NASA/USGS MOLA) and Triton texture (public domain, Voyager 2, with
a synthetic northern-hemisphere fill) and the reused Uranus and Neptune textures
(CC-BY 4.0, Solar System Scope, artist-tuned/stylized) were confirmed present in the
repo on 2026-07-19 with the file sizes listed in §2 (mars-mola-colorized.jpg
2,256,339 bytes; planets/uranus.jpg 25,679 bytes; planets/neptune.jpg 54,181 bytes;
moons/triton.jpg 218,316 bytes). The seven new moon textures (Phobos, Deimos,
Miranda, Ariel, Umbriel, Titania, Oberon) were fetched, verified and **confirmed
present on disk on 2026-07-19** (all 2048x1024 RGB JPEG); their sizes, native
resolutions, source URLs and processing are logged in §2c. Proteus and Nereid ship
no texture and are illustrative tinted spheres. No
external feed, API, or new committed dataset is used at runtime. JPL Horizons is an
offline cross-check source only, never called at runtime (Horizons CORS rule per
`DATA_SOURCES.md` §5). See `docs/OTHER_MOONS_PHYSICS.md` for the honest-representation
methodology.

---

## Phase 16 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app
wires this in. Frontend / physics implementation (`lib/`, `app/`, `components/`) is
out of scope for this doc; another agent owns it.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Moon apparent positions (10 moons) | Kepler propagation of JPL SSD mean elements (Mars MAR099 Laplace; Uranus equatorial; Neptune Triton/Proteus Laplace + Nereid ecliptic 2020 epoch e=0.751) + planet IAU pole + `lib/planets` | Computed in `lib/` (owned by another agent), no runtime API | Cross-check vs JPL Horizons offline. Good near epoch; degrades away from it; Triton and Nereid least accurate; Phobos/Deimos and the Uranian five solid. |
| Transit / shadow transit / occultation / eclipse flags | Derived from the plane-of-sky positions vs the planet disk and the Sun-line | Computed in-browser over the requested window | Rare to unobservable given tiny disks (Mars 4 to 25 arcsec, Uranus 3.7, Neptune 2.3). Configuration view, not an events clock. Label the accuracy bound; point to Horizons for critical work. |
| Planet sky position + apparent diameter + system tilt | Low-precision planetary theory via `lib/planets` (Meeus / VSOP87 truncation) + IAU pole | Computed in `lib/`, no API | Uranus tip about 98 deg, opening changing across its 84-yr season (equinox 2007, next about 2049); Triton retrograde; Phobos below synchronous height. |
| Mars disk texture | Reused `public/textures/mars-mola-colorized.jpg` (NASA/USGS MOLA, **public domain**) | Already in repo | Credit "NASA / USGS / MOLA Science Team"; color = elevation, not a visible photo. |
| Uranus / Neptune disk textures | Reused `public/textures/planets/{uranus,neptune}.jpg` (Solar System Scope, **CC-BY 4.0**) | Already in repo | Credit "Solar System Scope (solarsystemscope.com), CC-BY 4.0"; label stylized/illustrative, unlit snapshot. Attribution required in-app + CREDITS. |
| Triton disk texture | Reused `public/textures/moons/triton.jpg` (Voyager 2, **PD**) | Already in repo | One hemisphere, 1989; northern hemisphere is a synthetic fill, label it. |
| Phobos / Deimos disks | New `public/textures/moons/{phobos,deimos}.jpg` (Viking, **PD**) | Present in repo (2026-07-19) | Irregular bodies: a sphere map is an approximation, label it. Source URLs/dimensions in §2c. |
| Miranda / Ariel / Umbriel / Titania / Oberon disks | New `public/textures/moons/{miranda,ariel,umbriel,titania,oberon}.jpg` (Voyager 2 1986, **PD**) | Present in repo (2026-07-19) | Southern hemispheres imaged in 1986; large northern coverage gaps, label them. Source URLs/dimensions in §2c. |
| Proteus / Nereid appearance | none (no map) | app-side render | Illustrative tinted spheres, clearly labeled; positions still computed. Same handling as un-imaged dwarf planets. |
| Real orbital periods / radii | JPL SSD (mean elements + physical parameters) | Transcribed into code/constants | Periods approx: Phobos 0.319 d (about 7.65 h), Deimos 1.26 d; Miranda 1.41 d, Ariel 2.52 d, Umbriel 4.14 d, Titania 8.71 d, Oberon 13.46 d; Triton 5.88 d (retrograde), Proteus 1.12 d, Nereid about 360 d (e=0.751). |
