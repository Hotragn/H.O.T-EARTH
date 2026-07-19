# Dwarf Moons (Pluto, Eris, Haumea and Makemake Satellites) Data Sources (Phase 17)

Verification date: **2026-07-19**. Every source, method, texture and license
below was recorded on this date against the cited published elements, the
already-shipped dwarf-planet textures in this repo, and the sibling data-source
docs. Same rigor and honesty bar as `DATA_SOURCES.md` (Earth),
`PLANETS_DATA_SOURCES.md`, `MOONS_DATA_SOURCES.md`,
`JUPITER_MOONS_DATA_SOURCES.md`, `SATURN_MOONS_DATA_SOURCES.md`,
`DWARF_PLANETS_DATA_SOURCES.md` (Phase 6, where these five bodies were first
credited) and `OTHER_MOONS_DATA_SOURCES.md` (Phase 16, our closest template):
real physics, real data, honest claims, everything free and legally usable for
an open-source app, every source and license logged. Anything that cannot be
verified from an official source is explicitly flagged.

Scope this phase: a combined **"Dwarf Moons" tab** that computes and animates the
apparent motion of the moons of the four moon-bearing dwarf planets, **Pluto**
(Charon, Styx, Nix, Kerberos, Hydra), **Eris** (Dysnomia), **Haumea** (Hiiaka,
Namaka, plus its ring) and **Makemake** (MK2). It shows each system's real
orbital geometry: the **Pluto-Charon binary** (the barycenter sits in empty
space, outside Pluto), the small Pluto moons circling that barycenter in
near-resonances, and the single measured moon of each of the three distant TNOs.
Ceres is the fifth IAU dwarf planet but **has no moons**, so it does not appear
in this tab.

> **Honesty rule for this phase (from the project brief):** this tab is
> **COMPUTED from published orbital elements**, not fetched from any data feed,
> and it carries a **two-tier honesty split** that must never be blurred. The
> honest story is three lines, and the first two are the ones that matter most:
>
> 1. **This is an orbital-geometry view, unresolvable from Earth. Stated up
>    front.** These systems are tiny and remote: Pluto's disk is about
>    **0.1 arcsec** across from Earth, and the moons are far fainter still.
>    **Nothing here is an Earth-observable transit, shadow or occultation event.**
>    What the tab honestly shows is the **real orbital configuration** of each
>    system (relative orbit sizes, shapes, periods, inclinations and, for Pluto,
>    real along-orbit positions), viewed as a geometry model, not as anything you
>    could see through a telescope. It does not sell itself as an events clock.
> 2. **Two data tiers, never blurred.** **Pluto's system uses REAL positions:**
>    full mean orbital elements from the post-New Horizons solution
>    (Brozovic & Jacobson 2024), so Charon, Styx, Nix, Kerberos and Hydra are
>    placed where they actually are. **Eris, Haumea and Makemake use a REAL
>    ORBIT but an ILLUSTRATIVE PHASE:** the orbit size, shape, period and
>    inclination are real and cited, but the absolute along-orbit position and
>    node are an **adopted convention** (no full published ephemeris exists for
>    these three moons), clearly labeled and kept distinct from Pluto's real
>    positions. **Makemake's moon (MK2) is additionally POORLY CONSTRAINED**
>    (near edge-on, very few detections) and must be labeled as such.
> 3. **The Pluto-Charon binary is the single most striking real fact.** Charon is
>    about **12.2%** of Pluto's mass (mass ratio q = 0.1218), which puts the
>    system barycenter about **2128 km** from Pluto's center, **outside** Pluto's
>    **1188 km** radius. So Pluto and Charon both orbit a point in **empty space**,
>    a true binary. The physics doc leads with this. See
>    `docs/DWARF_MOONS_PHYSICS.md` for the computed / reused / illustrative
>    contract.

## Summary table

| Source | What it provides | License / status | Attribution | Access | Verified against (2026-07-19) |
|---|---|---|---|---|---|
| **JPL SSD "Planetary Satellite Mean Orbital Elements", Pluto set = Brozovic & Jacobson (2024), AJ 167:256** (ssd.jpl.nasa.gov/sats/elem/) | Full mean elements (a, e, i, node, argument, mean longitude, epoch) for **Charon, Styx, Nix, Kerberos, Hydra**, epoch J2000, referred to **Pluto's equatorial frame**, post-New Horizons solution | US Government data + published solution, **public domain**; transcribed into code, not redistributed as a database | Cite "JPL Solar System Dynamics, Planetary Satellite Mean Orbital Elements; Brozovic & Jacobson 2024, AJ 167:256" | Values transcribed offline; Kepler propagation runs in code, no runtime API | Pluto = the **real-position** tier; oriented by Pluto's IAU pole (RA 132.993 deg, Dec -6.163 deg) |
| **Dysnomia orbit, Holler et al. (2021)** | Eris's moon Dysnomia: a = 37273 km, P = 15.786 d, e = 0.006 (near-circular), i = 78.3 deg, tidally locked | Published measurement (peer-reviewed); the orbit is copyright-free fact, we implement it | Cite "Holler et al. 2021" | Transcribed into code | Eris = the **real-orbit, illustrative-phase** tier |
| **Haumea moons, Ragozzine & Brown (2009), AJ 137** | Hiiaka (a = 49880 km, P = 49.462 d, e = 0.051) and Namaka (a = 25657 km, P = 18.278 d, e = 0.249), mutually inclined about 13 deg | Published measurement | Cite "Ragozzine & Brown 2009, AJ 137" | Transcribed into code | Haumea moons = real-orbit, illustrative-phase tier |
| **Haumea ring + triaxial shape, Ortiz et al. (2017), Nature 550** | Ring at radius about 2285 km; triaxial body about 1160 x 852 x 513 km; spin about 3.9 h | Published measurement | Cite "Ortiz et al. 2017, Nature 550" | Transcribed into code | Ring + shape are **real, measured geometry**; the body surface is illustrative |
| **Makemake moon (MK2), Parker et al. (2016)** | S/2015 (136472) 1 ("MK2"): a about 22250 km, P about 18 d, e about 0, but the orbit is **poorly constrained** (near edge-on, few detections) | Published discovery + provisional orbit | Cite "Parker et al. 2016" | Transcribed into code | Makemake = real-orbit, illustrative-phase tier, **plus a poorly-constrained flag** |
| **Kepler propagation + Pluto's IAU pole** (RA 132.993 deg, Dec -6.163 deg) | Apparent Pluto-system positions: Kepler two-body motion from the mean elements, oriented by Pluto's pole from its equatorial frame into the plane of sky | Published method (two-body Kepler + standard frame rotation). Not a copyrightable dataset; we implement it | Cite standard orbital mechanics; pole from **IAU WGCCRE** (Archinal et al.) | Computed in code, no runtime API | Pole is the IAU-standard Pluto north-pole direction; propagation cross-checked offline |
| **Pluto geocentric RA/Dec** | Where Pluto is in Earth's sky (observer visibility) and its (tiny, about 0.1 arcsec) apparent disk | Published algorithm (VSOP87 truncation / Meeus), "we implement it" posture, via `lib/planets` | Cite Meeus, *Astronomical Algorithms* | Computed in code, no runtime API | Standard low-precision planetary theory; cross-check JPL Horizons offline |
| **Reused: Pluto and Charon textures** `public/textures/dwarf-planets/{pluto,charon}.jpg` | The two real dwarf-planet disks of the binary | **Public domain** (New Horizons; NASA / JHU-APL / SwRI / LPI / USGS) | "NASA / JHU-APL / SwRI / LPI / USGS Astrogeology (New Horizons)" | Already in repo (Phase 6), pluto.jpg 300,727 bytes / charon.jpg 254,426 bytes | Present; provenance `DWARF_PLANETS_DATA_SOURCES.md` §1a/§1b (encounter hemisphere hi-res, far side low-res, grayscale merge) |
| **Illustrative: small Pluto moons, TNO moons, Haumea body+ring** (no dedicated map) | Styx, Nix, Kerberos, Hydra; Dysnomia; Hiiaka, Namaka; MK2; Haumea's triaxial body and ring surface | n/a (no texture; tinted spheres / markers) | n/a | No texture shipped; rendered as labeled illustrative markers | Same handling as the never-visited dwarf planets in `DWARF_PLANETS_DATA_SOURCES.md` §1e |
| **JPL Horizons** | Authoritative cross-check of predicted moon positions (validation only) | US-Gov ephemerides; **not shipped, never called at runtime** | n/a (not shipped) | Offline validation only | Same Horizons CORS rule as `DATA_SOURCES.md` §5 |

**No new committed data artifact and no new texture this phase.** The Pluto-system
positions and the illustrative TNO-moon orbits for any instant are computed at
runtime from the Kepler propagation of the cited mean elements (Pluto, real
positions) and the cited orbit shapes with an adopted phase (Eris, Haumea,
Makemake, illustrative). The mean orbital elements and orbit parameters are
transcribed into code (or a small constants file) from the cited sources; the
reused Pluto and Charon textures already exist from Phase 6; nothing new is
fetched.

---

## 1. Method / algorithm sources

**This is the substance of the phase.** One published method does the work,
implemented in our own code, not downloaded as data:

- **Kepler propagation of real cited orbital elements**, oriented by **Pluto's
  IAU pole** into the plane of sky, with Pluto's own geocentric direction from
  `lib/planets`. For Pluto the elements carry a **real epoch phase** (real
  positions); for Eris, Haumea and Makemake the orbit shape is real but the phase
  is an **adopted convention** (illustrative phase). The two tiers use the same
  maths and are kept explicitly separate.

This is the identical posture the repo already uses for the Moon (Meeus theory),
the ISS (SGP4), Jupiter's moons (Meeus Ch. 44), Saturn's moons (Kepler from JPL
mean elements + Meeus Ch. 45) and the Other Moons tab (Kepler from JPL mean
elements + planet pole, Phase 16). The rule is unchanged: **a published algorithm
(the maths) is freely implementable; there is no license on a formula.** The mean
elements themselves are US-Government / published-solution public-domain data. We
implement and we transcribe; we redistribute no software and no database.

### 1a. Pluto system: REAL positions (Brozovic & Jacobson 2024)

The Pluto system is the **real-position tier**. Its full mean orbital elements
come from the **JPL SSD "Planetary Satellite Mean Orbital Elements"** table, whose
Pluto set is the **post-New Horizons solution of Brozovic & Jacobson (2024),
AJ 167:256**. Each of the five moons (Charon, Styx, Nix, Kerberos, Hydra) has a
full epoch state (semimajor axis, eccentricity, inclination, argument of
periapsis, node, mean longitude at epoch), at **epoch J2000**, referred to
**Pluto's equatorial frame**, oriented onto the sky by **Pluto's IAU pole**
(RA 132.993 deg, Dec -6.163 deg, the IAU WGCCRE north-pole direction). Because the
along-orbit registration is real, these are genuine positions, not a schematic
phase, exactly as Pluto/Charon/Ceres were the imaged, real bodies of Phase 6.

- **Charon** is the massive companion (see §1b, the binary).
- **Styx, Nix, Kerberos, Hydra** are the four small outer moons. They orbit the
  **system barycenter**, not Pluto's center, in a chain of **near mean-motion
  resonances** with Charon's 6.39 d period (approximate periods from the same
  Brozovic & Jacobson elements: Styx about 20.2 d, Nix about 24.9 d, Kerberos
  about 32.2 d, Hydra about 38.2 d). Their orbits are near-circular and nearly
  coplanar with Charon's.
- **Nix and Hydra are chaotic rotators.** Their spin is genuinely chaotic
  (measured, Showalter & Hamilton 2015; Weaver et al. 2016), driven by the
  time-varying binary torque and their elongated shapes. **This is stated as a
  measured fact, not simulated:** the tab does not animate a fake tumble, it
  labels the fact.

### 1b. The Pluto-Charon binary (the headline geometry)

Pluto and Charon form a **true binary**, and this is the single most striking real
fact of the phase. Charon's mass is about **12.2%** of Pluto's (mass ratio
q = 0.1218). The barycenter therefore sits at about **q / (1 + q)** of the
Pluto-Charon separation (about 19591 km) from Pluto's center, which is about
**2128 km**. Pluto's radius is only **1188 km**, so **the barycenter lies outside
Pluto's body, in empty space.** Both Pluto and Charon orbit that empty point,
which is why this is a binary rather than a moon-around-planet system. The tab
renders it as the binary it is: Pluto tracing a small loop about the barycenter,
Charon tracing a larger one, and the four small moons circling the same barycenter
farther out. This is the same measured fact recorded in
`DWARF_PLANETS_DATA_SOURCES.md` §2b (Brozovic et al. 2015), here made the visual
centerpiece.

### 1c. Eris, Haumea and Makemake: REAL ORBIT, ILLUSTRATIVE PHASE

These three are the **real-orbit, illustrative-phase tier**, and the distinction
from Pluto is load-bearing and must be shown. For each, the orbit **size, shape,
period and inclination are real and cited**, so the relative geometry is honest,
but **there is no full published ephemeris** giving the moon's absolute
along-orbit position and node at an arbitrary date. So the tab adopts a **stated
convention** for the phase and node, animates the moon on its real ellipse at its
real period, and **labels this clearly as an illustrative phase, distinct from
Pluto's real positions.**

- **Eris: Dysnomia (Holler et al. 2021).** Orbit **a = 37273 km, P = 15.786 d,
  e = 0.006** (essentially circular), **i = 78.3 deg**, tidally locked to Eris.
  The near-circular, tidally-locked orbit is well measured; only the absolute
  phase/node convention is adopted.
- **Haumea: Hiiaka and Namaka (Ragozzine & Brown 2009, AJ 137).** **Hiiaka**
  (outer): a = 49880 km, P = 49.462 d, e = 0.051. **Namaka** (inner): a = 25657 km,
  P = 18.278 d, e = 0.249. The two orbits are **mutually inclined about 13 deg**,
  a real and unusual feature worth showing. Phase/node adopted, orbit real.
- **Haumea's ring and triaxial body (Ortiz et al. 2017, Nature 550).** A **ring at
  radius about 2285 km** (the first ring found around a trans-Neptunian object) and
  a **triaxial body about 1160 x 852 x 513 km** spinning in about **3.9 h**. The
  ring geometry and the body shape are **real, measured facts** and are rendered as
  such; only the body's **surface** is illustrative (Haumea has never been imaged
  up close, exactly as in Phase 6).

### 1d. Makemake's moon MK2: real orbit, illustrative phase, AND poorly constrained

**Makemake: S/2015 (136472) 1, "MK2" (Parker et al. 2016).** Approximate orbit
**a about 22250 km, P about 18 d, e about 0**. This moon belongs to the
real-orbit, illustrative-phase tier like the others, **but it carries an extra
caveat that must be surfaced:** its orbit is **poorly constrained**. MK2 was seen
in only a few detections, and it may be **near edge-on** to us, which makes a and
the period genuinely uncertain (an edge-on or a face-on solution can both fit the
sparse data). So MK2's numbers are the **least trustworthy** of any moon in this
tab and must be labeled "poorly constrained orbit", not presented with false
precision.

### 1e. Accuracy and the orbital-geometry honesty (the load-bearing part)

**Configuration first, because it is the most important caveat.** These systems
are **tiny and remote**: Pluto's disk is about **0.1 arcsec** from Earth, and the
moons are far fainter and closer in. **Nothing in this tab is an Earth-observable
transit, shadow transit, occultation or eclipse**, unlike the Jupiter tab where a
shadow dot crosses a big disk almost nightly (Phase 14), and unlike even the Other
Moons tab where such events are at least geometrically definable against a
few-arcsec disk (Phase 16). Here the honest product is a **real orbital-geometry
view**: relative orbit sizes, shapes, periods, inclinations, the binary barycenter,
and (for Pluto) real along-orbit positions. The tab leads with this and never
implies an observable event.

**Accuracy bound, stated honestly, and split by tier.**

- **Pluto tier (real positions):** Kepler propagation from the Brozovic & Jacobson
  (2024) mean elements reproduces the live layout near the J2000 epoch. It
  **ignores nodal and apsidal precession** and higher-order perturbations, so
  accuracy **degrades away from epoch**. This is a real configuration, good near
  epoch, not observing-grade timing. For precise positions the UI must point at
  **JPL Horizons** (offline cross-check).
- **Eris / Haumea / Makemake tier (real orbit, illustrative phase):** the relative
  geometry (orbit size, shape, period, inclination) is real; the **absolute phase
  and node are an adopted convention, not a measurement**, so the moon's position
  along its orbit is **illustrative and must not be read as where the moon really
  is** on a given date. **MK2 is additionally poorly constrained** (§1d).
- Both tiers are **cross-checked offline against JPL Horizons**, never called from
  the browser.

This is the same honesty discipline the repo applies elsewhere (SGP4 "good near
epoch, degrades with TLE age"; the Saturn Kepler propagation "good over days to
weeks, degrading over months to years"): state the method, state its error bound,
name the authoritative source for cross-checks, and here also **state which tier
each system is in.**

---

## 2. Textures (reused PD + illustrative)

This phase **adds no new texture**. It reuses two textures already in the repo
(the real Pluto and Charon maps) and renders every other body as a
**clearly-labeled illustrative marker or tinted sphere**. The licensing situations
differ and are kept separate below.

### 2a. Reused public-domain Pluto and Charon maps (already in repo, no new download)

| Texture (in repo) | Size (2026-07-19) | Source / mission | License | Required credit | Provenance doc |
|---|---|---|---|---|---|
| `public/textures/dwarf-planets/pluto.jpg` | 300,727 bytes | New Horizons LORRI-MVIC Global Mosaic 300m (USGS) | **Public domain** (Access "None", Use "cite authors") | "NASA / JHU-APL / SwRI / LPI / USGS Astrogeology (New Horizons)" | `DWARF_PLANETS_DATA_SOURCES.md` §1a |
| `public/textures/dwarf-planets/charon.jpg` | 254,426 bytes | New Horizons LORRI-MVIC Global Mosaic 300m (USGS) | **Public domain** (Access "None", Use "cite authors") | "NASA / JHU-APL / SwRI / LPI / USGS Astrogeology (New Horizons)" | `DWARF_PLANETS_DATA_SOURCES.md` §1b |

These are **real spacecraft imagery**: Pluto's famous heart (Tombaugh Regio /
Sputnik Planitia) and Charon's dark reddish north polar cap (Mordor Macula) are
genuine New Horizons features. Two honesty notes carry over from Phase 6 and are
mandatory:

- **Encounter-hemisphere resolution gradient.** New Horizons was a **flyby** (2015),
  so the encounter hemisphere is high-resolution and the far side is low-resolution.
  Label it "encounter hemisphere hi-res, far side low-res".
- **Grayscale merge.** Both maps are the **panchromatic (grayscale) LORRI-MVIC
  merge**; Pluto's reddish tholin color lives in a separate PD MVIC color product.
  Label the base as a grayscale merge (per `DWARF_PLANETS_DATA_SOURCES.md`
  §1a/§1b).

**Note on `ceres.jpg`.** A real Ceres map (`public/textures/dwarf-planets/ceres.jpg`,
616,695 bytes, Dawn, public domain) also exists in the repo from Phase 6, but
**Ceres has no moons, so it is not used in this tab.** It is listed here only to
record that its presence is intentional and unrelated to Dwarf Moons.

### 2b. Illustrative: the small Pluto moons (no map)

Styx, Nix, Kerberos and Hydra have **no dedicated surface map** (Nix and Hydra were
only partially imaged by New Horizons as small, irregular, elongated bodies; Styx
and Kerberos are tiny and barely resolved), so they are rendered as
**clearly-labeled illustrative markers / tinted spheres** with no fake surface
detail, exactly as the never-visited dwarf planets are handled in
`DWARF_PLANETS_DATA_SOURCES.md` §1e. **No texture is shipped for them.** Their
**positions are real and fully computed** (Brozovic & Jacobson 2024 elements, the
Pluto tier); only their **appearance** is illustrative. **Nix and Hydra are chaotic
rotators**, a stated measured fact (§1a), not a simulated tumble, and the label
must say so rather than animating a fabricated spin.

### 2c. Illustrative: the TNO moons and Haumea's body + ring (no map)

Dysnomia (Eris), Hiiaka and Namaka (Haumea) and MK2 (Makemake) have **no surface
map** (none has ever been imaged up close) and are rendered as
**clearly-labeled illustrative tinted spheres / markers**, no texture shipped, same
posture as Phase 6. Their orbits are the **real-orbit, illustrative-phase** tier
(§1c, §1d): the orbit shape is real and cited, the along-orbit phase is an adopted
convention, and MK2's orbit is additionally poorly constrained and must be labeled
so.

Haumea itself is drawn as its **real triaxial body (about 1160 x 852 x 513 km)**
with its **real ring (radius about 2285 km)**: the **shape and ring are real,
measured geometry** (Ortiz et al. 2017) and are rendered as such, while only the
**body surface** is illustrative (tinted, no fake detail), exactly the split used
for Haumea in `DWARF_PLANETS_DATA_SOURCES.md` §1e.

---

## 3. No external data feed, no API, no runtime license, two tiers

Stated plainly, because it is the defining property of this phase:

- **The positions are computed at runtime, not fetched.** There is no live feed,
  no polling endpoint, no API key, and no GitHub Action for this tab. The
  Pluto-system positions fall out of the Kepler propagation of the Brozovic &
  Jacobson (2024) mean elements oriented by Pluto's pole (**real positions**); the
  Eris/Haumea/Makemake moon positions fall out of their real cited orbits with an
  **adopted illustrative phase**. The two tiers use the same maths and are labeled
  distinctly.
- **The only licensing surface is the two reused textures plus the
  freely-implementable published method.** The Pluto and Charon maps are **public
  domain** (New Horizons); the Kepler method is maths (not copyrightable); the mean
  elements and orbit parameters are public-domain / published-solution data. **No
  attribution obligation of the CC-BY kind is created this phase** (unlike the
  Uranus/Neptune textures in Phase 16), only the courtesy New Horizons citation.
- **JPL Horizons is a cross-check source only.** It is the authoritative ephemeris
  against which we validate the implemented method offline. It is **not shipped and
  never called from the browser** at runtime (Horizons forbids browser embedding and
  sends no CORS header; the established rule from `DATA_SOURCES.md` §5).

This is the same shape as the Saturn's Moons and Other Moons phases (Kepler
computed client-side, Horizons offline), applied to the satellites of the four
moon-bearing dwarf planets, with the added two-tier real-vs-illustrative-phase
split.

---

## Rejected / flagged items

- **This is an orbital-geometry view, not an events predictor. Shown, not buried.**
  Pluto's disk is about 0.1 arcsec from Earth and the moons are fainter still, so
  **nothing here is an Earth-observable transit, shadow, occultation or eclipse.**
  The UI must present the tab as a real orbital-geometry model (relative sizes,
  shapes, periods, inclinations, the binary), not as an events clock, and must not
  imply telescope-visible phenomena. Flagged as the top honesty item.
- **Two data tiers must never be blurred.** Pluto (Charon, Styx, Nix, Kerberos,
  Hydra) uses **real positions** (Brozovic & Jacobson 2024). Eris (Dysnomia),
  Haumea (Hiiaka, Namaka) and Makemake (MK2) use a **real orbit with an
  illustrative, adopted phase**. The UI must label which is which prominently and
  must not present the illustrative-phase moons as if their along-orbit position
  were a real measurement. Flagged as the second honesty item.
- **Makemake's MK2 orbit is poorly constrained.** Few detections, likely near
  edge-on, so a and the period are genuinely uncertain (Parker et al. 2016). It
  must carry a "poorly constrained orbit" label, distinct even from the other two
  illustrative-phase systems. Flagged.
- **The Pluto-Charon barycenter is outside Pluto (a true binary).** q = 0.1218,
  barycenter about 2128 km from Pluto's center, outside the 1188 km radius. This is
  the headline real fact and must be rendered and labeled as a binary, not as a
  moon orbiting a planet. Flagged as the key visual.
- **Nix and Hydra are chaotic rotators, as a stated fact.** This is a measured
  property (Showalter & Hamilton 2015; Weaver et al. 2016), not something the tab
  simulates. Label the fact; do not animate a fabricated tumble.
- **No runtime API for these positions.** JPL Horizons can return them, but browser
  calls are policy-forbidden and CORS-blocked (`DATA_SOURCES.md` §5), and depending
  on a network call for something fully computable is the wrong design. **Rejected
  for runtime; retained for offline cross-check only.**
- **Minute-level and second-level precision are not claimed.** Kepler from mean
  elements ignores precession and higher-order perturbations (good near epoch,
  degrading away), and the illustrative-phase tier is not a live position at all.
  Do not present any position or time to the second. Flagged.
- **No surface maps for the small Pluto moons or the TNO moons.** Styx, Nix,
  Kerberos, Hydra, Dysnomia, Hiiaka, Namaka and MK2 have no map and ship no texture;
  they are clearly-labeled illustrative markers, exactly as the never-visited dwarf
  planets are handled (`DWARF_PLANETS_DATA_SOURCES.md` §1e). Positions are still
  computed (real for the Pluto set, illustrative-phase for the TNO set).
- **Haumea's surface is illustrative, but its shape and ring are real.** The
  triaxial body (about 1160 x 852 x 513 km) and the ring (about 2285 km) are
  measured geometry (Ortiz et al. 2017) and are rendered as such; only the surface
  is tinted-illustrative. Do not imply a real Haumea surface image.
- **No new texture fetched this phase.** Only the two Phase-6 New Horizons maps
  (`pluto.jpg` 300,727 B, `charon.jpg` 254,426 B) are reused; `ceres.jpg` exists but
  is unused (Ceres has no moons). Nothing new is downloaded.
- **Provenance of record for the reused textures lives in the sibling doc.** This
  doc restates the licenses for a self-contained record, but if there is ever a
  discrepancy, `DWARF_PLANETS_DATA_SOURCES.md` (Pluto, Charon) is authoritative.

---

**Verification methodology note:** The method sources were recorded from published
elements and implemented in our own code, redistributing no software or dataset.
The **Pluto system (real positions)** uses the JPL SSD "Planetary Satellite Mean
Orbital Elements" Pluto set, the post-New Horizons solution of **Brozovic &
Jacobson (2024), AJ 167:256** (epoch J2000, Pluto's equatorial frame), for Charon,
Styx, Nix, Kerberos and Hydra, oriented by Pluto's IAU WGCCRE pole (RA 132.993 deg,
Dec -6.163 deg) using `lib/planets` for Pluto's geocentric direction; the
Pluto-Charon binary geometry (q = 0.1218, barycenter about 2128 km from Pluto's
center, outside the 1188 km radius) is computed from the same elements. The **Eris,
Haumea and Makemake moons (real orbit, illustrative phase)** use the cited orbit
parameters (Dysnomia: **Holler et al. 2021**, a = 37273 km, P = 15.786 d, e = 0.006,
i = 78.3 deg; Hiiaka and Namaka: **Ragozzine & Brown 2009, AJ 137**, a = 49880 km /
P = 49.462 d / e = 0.051 and a = 25657 km / P = 18.278 d / e = 0.249, mutual
inclination about 13 deg; Haumea ring about 2285 km and triaxial body about
1160 x 852 x 513 km, spin about 3.9 h: **Ortiz et al. 2017, Nature 550**; MK2:
**Parker et al. 2016**, a about 22250 km, P about 18 d, e about 0, orbit poorly
constrained), with the along-orbit phase and node an adopted convention labeled
distinct from Pluto's real positions. The reused Pluto and Charon textures (public
domain, New Horizons) were confirmed present in the repo on 2026-07-19 with the file
sizes listed in §2a (pluto.jpg 300,727 bytes; charon.jpg 254,426 bytes); `ceres.jpg`
(616,695 bytes) is present but unused (Ceres has no moons). All small-moon and
TNO-moon markers, Haumea's body surface, and MK2 are illustrative; Haumea's shape
and ring are real, measured geometry. No external feed, API, or new committed
dataset or texture is used at runtime. JPL Horizons is an offline cross-check source
only, never called at runtime (Horizons CORS rule per `DATA_SOURCES.md` §5). See
`docs/DWARF_MOONS_PHYSICS.md` for the honest-representation methodology.

---

## Phase 17 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app
wires this in. Frontend / physics implementation (`lib/`, `app/`, `components/`) is
out of scope for this doc; another agent owns it.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Pluto-system positions (Charon, Styx, Nix, Kerberos, Hydra) | Kepler propagation of Brozovic & Jacobson (2024) mean elements (J2000, Pluto equatorial frame) + Pluto IAU pole + `lib/planets` | Computed in `lib/` (owned by another agent), no runtime API | **REAL positions tier.** Cross-check vs JPL Horizons offline. Good near epoch; degrades away from it. Small moons orbit the barycenter in near-resonances. |
| Pluto-Charon binary geometry | Same elements + q = 0.1218 | Computed in-browser | **Barycenter about 2128 km from Pluto's center, outside the 1188 km radius: a true binary.** Render and label as the headline. |
| Eris moon (Dysnomia) orbit | Holler et al. 2021 (a = 37273 km, P = 15.786 d, e = 0.006, i = 78.3 deg, tidally locked) | Computed in `lib/`, no API | **REAL orbit, ILLUSTRATIVE phase.** Label distinct from Pluto's real positions. |
| Haumea moons (Hiiaka, Namaka) orbits | Ragozzine & Brown 2009 (Hiiaka a = 49880 km P = 49.462 d e = 0.051; Namaka a = 25657 km P = 18.278 d e = 0.249; mutual inclination about 13 deg) | Computed in `lib/`, no API | **REAL orbit, ILLUSTRATIVE phase.** Show the about-13-deg mutual inclination. |
| Haumea body + ring | Ortiz et al. 2017 (triaxial about 1160 x 852 x 513 km, spin about 3.9 h; ring radius about 2285 km) | Computed / rendered in-browser | Shape + ring **real, measured geometry**; body **surface illustrative** (no map). |
| Makemake moon (MK2) orbit | Parker et al. 2016 (a about 22250 km, P about 18 d, e about 0) | Computed in `lib/`, no API | **REAL orbit, ILLUSTRATIVE phase, AND poorly constrained** (near edge-on, few detections). Label "poorly constrained orbit". |
| Pluto sky position + tiny apparent disk | Low-precision planetary theory via `lib/planets` (Meeus / VSOP87 truncation) + IAU pole | Computed in `lib/`, no API | Pluto disk about 0.1 arcsec: nothing here is an Earth-observable event. |
| Pluto disk texture | Reused `public/textures/dwarf-planets/pluto.jpg` (New Horizons, **PD**) | Already in repo (300,727 B) | Credit "NASA / JHU-APL / SwRI / LPI / USGS Astrogeology"; encounter hemisphere hi-res, far side low-res, grayscale merge; the heart is real. |
| Charon disk texture | Reused `public/textures/dwarf-planets/charon.jpg` (New Horizons, **PD**) | Already in repo (254,426 B) | Same credit + coverage caveat; Mordor Macula is real. |
| Small Pluto moons appearance (Styx, Nix, Kerberos, Hydra) | none (no map) | app-side render | Illustrative markers, clearly labeled; **positions real (Brozovic & Jacobson 2024)**. Nix and Hydra chaotic rotators (stated fact, not simulated). |
| TNO moons appearance (Dysnomia, Hiiaka, Namaka, MK2) | none (no map) | app-side render | Illustrative tinted spheres; **orbits real, phase illustrative**; MK2 poorly constrained. |
| Ceres | not used | none | Ceres has no moons; `ceres.jpg` present but unused. |
| Real orbital periods / radii | Cited sources (Brozovic & Jacobson 2024; Holler 2021; Ragozzine & Brown 2009; Ortiz 2017; Parker 2016) | Transcribed into code/constants | Charon P 6.39 d; Styx about 20.2 d, Nix about 24.9 d, Kerberos about 32.2 d, Hydra about 38.2 d; Dysnomia 15.786 d; Hiiaka 49.462 d, Namaka 18.278 d; MK2 about 18 d. |
