# Asteroid Moons (Real Binary and Multiple Asteroid Systems) Data Sources (Phase 18)

Verification date: **2026-07-20**. Every source, method, texture and license below
was recorded on this date against the cited primary papers, the already-shipped
small-body textures in this repo, and the sibling data-source docs. Same rigor and
honesty bar as `DATA_SOURCES.md` (Earth), `PLANETS_DATA_SOURCES.md`,
`SMALL_BODIES_DATA_SOURCES.md` (Phase 9, where the asteroids and comets, including
Didymos, Ida and 67P, were first credited) and `DWARF_MOONS_DATA_SOURCES.md`
(Phase 17, our closest template): real physics, real data, honest claims,
everything free and legally usable for an MIT open-source app, every source and
license logged. Anything that cannot be verified from an official or primary source
is explicitly flagged.

Scope this phase: an **"Asteroid Moons" tab** that shows **real binary and multiple
asteroid systems** as a schematic mutual-orbit view (primary plus its moon or moons,
drawn to scale on their real-size, real-period mutual orbit), and that **explains
the comet situation honestly** rather than inventing anything. The headline honesty
point comes first and is the reason the tab is built the way it is.

> **Honesty rule for this phase (from the project brief): comets have NO moons, so
> the tab shows the REAL thing (asteroid moons) and tells the comet truth plainly.**
> There are **zero confirmed comet satellites.** Comet nuclei are too small to hold
> a moon, so the tab does not invent one. The closest real comet phenomenon is a
> **CONTACT BINARY**, which is two lobes touching as a **single body**, **not** a
> moon: comet **67P/Churyumov-Gerasimenko** (imaged by ESA Rosetta) and the
> Kuiper-belt object **Arrokoth** (imaged by NASA New Horizons) are the famous
> examples. **Fragmenting comets produce fragments, not moons**: 73P/Schwassmann-
> Wachmann 3 broke into dozens of pieces, and Shoemaker-Levy 9 (D/1993 F2) broke
> into a "string of pearls" before hitting Jupiter, but a fragment train is debris,
> not a satellite. So this tab shows the **real thing**, moons of asteroids, and it
> carries a **two-part honesty split** that must never be blurred:
>
> 1. **What is REAL and to scale:** the diameters, the mutual-orbit separations
>    (semi-major axes), the orbital periods, the size ratios, and, for Didymos, the
>    **DART-measured period change**. These are measured facts from the cited
>    primary papers and are drawn to scale.
> 2. **What is ILLUSTRATIVE:** the orbit's **orientation in space** and the moon's
>    **along-orbit phase**. There is **no full mutual-orbit ephemeris** in this tab;
>    these systems are unresolvable from Earth as separate points to the eye, and are
>    known only through **radar, adaptive optics or spacecraft**. So the tab draws
>    the real orbit geometry but adopts a stated convention for where in space the
>    orbit is tilted and where along it the moon currently sits, labeled clearly and
>    kept distinct from the real, to-scale sizes and periods.
>
> The **Didymos DART period step change is the single real highlight** of the phase:
> on **2022-09-26** the DART spacecraft hit Dimorphos and shortened its mutual orbit
> around Didymos, the **first time humanity deliberately changed a celestial body's
> orbit**. See `docs/ASTEROID_MOONS_PHYSICS.md` for the computed / reused /
> illustrative contract.

## Summary table

| Source | What it provides | License / status | Attribution | Access | Verified against (2026-07-20) |
|---|---|---|---|---|---|
| **Thomas et al. (2023), Nature** ("Orbital period change of Dimorphos due to the DART kinetic impact") | Didymos-Dimorphos mutual period before (11.921 h) and after (11.372 h) the DART impact, a change of 32 ± 2 minutes | Published measurement (peer-reviewed); measured fact, copyright-free, we transcribe it | Cite "Thomas et al. 2023, Nature" | Values transcribed offline into a constants file, no runtime API | The DART **period step change**, the real highlight |
| **Daly et al. (2023), Nature** ("Successful kinetic impact into an asteroid for planetary defense") | The DART impact demonstration and Didymos-system geometry (Didymos about 765 m, Dimorphos about 160 m, separation about 1.19 km) | Published measurement | Cite "Daly et al. 2023, Nature" | Transcribed offline | Didymos-system sizes and separation |
| **Belton et al. (1996), Icarus** (Galileo Ida-Dactyl) | 243 Ida and its moon Dactyl, the **first confirmed asteroid moon** (Galileo, 1993); Dactyl's orbit could only be **bounded**, not solved, from the single flyby | Published measurement | Cite "Belton et al. 1996" | Transcribed offline | Ida-Dactyl; Dactyl orbit **poorly constrained** flag |
| **Marchis et al. (2005), Nature** (87 Sylvia triple) | 87 Sylvia with Romulus and Remus, the **first known triple asteroid**, orbits from adaptive optics | Published measurement | Cite "Marchis et al. 2005" | Transcribed offline | Sylvia triple |
| **Marchis et al. (2008); Descamps et al. (2011)** (216 Kleopatra) | 216 Kleopatra (the "dog-bone") with Alexhelios and Cleoselene | Published measurements | Cite "Marchis et al. 2008; Descamps et al. 2011" | Transcribed offline | Kleopatra system; dog-bone shape |
| **Merline et al. (2000); Descamps et al. (2007)** (90 Antiope) | 90 Antiope, a **near-equal double** (two similar-size components about a common barycenter) | Published measurements | Cite "Merline 2000; Descamps et al. 2007" | Transcribed offline | Antiope near-equal double; barycenter split |
| **Merline et al. (2001); Margot & Brown (2003)** (22 Kalliope) | 22 Kalliope and its moon Linus | Published measurements | Cite "Merline et al. 2001; Margot & Brown 2003" | Transcribed offline | Kalliope-Linus |
| **Merline et al. (1999), Nature** (45 Eugenia) | 45 Eugenia and its moon Petit-Prince (**the first asteroid moon found from the ground**, adaptive optics), plus a second moon S/2004 (45) 1 | Published measurement | Cite "Merline et al. 1999" | Transcribed offline | Eugenia system; ground discovery |
| **NASA Lucy mission (617 Patroclus flyby, 2033)** | 617 Patroclus and Menoetius, a **Jupiter Trojan near-equal double**, a NASA Lucy flyby target in **2033** | US-Gov mission fact | Cite "NASA Lucy" | Transcribed offline | Patroclus-Menoetius near-equal double |
| **Johnston's Archive "Asteroids with Satellites" (johnstonsarchive.net)** | A compiled catalog of asteroid-satellite systems and their elements | Compiled reference list, itself built from the primary papers above | Cite the **primary papers** as the sources of record; Johnston's Archive is the convenience index | Consulted offline for cross-listing | Every element cross-listed to a primary paper |
| **Reused: `didymos.jpg`** `public/textures/small-bodies/didymos.jpg` | The real Didymos body (a single-view DART approach photo, shown flat) | **Public domain** (NASA / JHU-APL, DART) | "NASA / JHU-APL (DART)" | Already in repo (Phase 9), 107,330 bytes | Present; single-view photo, not a wraparound map |
| **Reused: `ida.jpg`** `public/textures/small-bodies/ida.jpg` | The real 243 Ida body (a single-view Galileo flyby photo, shown flat) | **Public domain** (NASA / JPL, Galileo) | "NASA / JPL (Galileo)" | Already in repo (Phase 9), 18,313 bytes | Present; single-view photo, not a wraparound map |
| **Reused: `churyumov-gerasimenko.jpg`** `public/textures/small-bodies/churyumov-gerasimenko.jpg` | Comet 67P, used **only** for the comet contact-binary honesty note (a single body, not a moon system) | **CC BY-SA 3.0 IGO** (ESA Rosetta NAVCAM) | **"ESA/Rosetta/NAVCAM, CC BY-SA 3.0 IGO"** (the mandatory line already used in the About panel) | Already in repo (Phase 9), 510,464 bytes | Present; used for the comet note only |
| **Illustrative: all moons and un-mapped primaries** (no resolved surface map) | Dimorphos, Dactyl, Romulus, Remus, Alexhelios, Cleoselene, Petit-Prince, S/2004 (45) 1, Linus, Menoetius; the un-mapped primaries Sylvia, Kleopatra (dog-bone), Antiope, Kalliope, Eugenia, Patroclus; and Arrokoth (comet note) | n/a (no texture; illustrative shapes / markers) | n/a | No texture shipped; rendered as clearly-labeled illustrative shapes | Same handling as the un-imaged small bodies in `SMALL_BODIES_DATA_SOURCES.md` |

**No new committed data artifact and no new texture this phase.** The per-system
diameters, mutual-orbit separations, periods and size ratios are transcribed offline
into a small constants file from the cited primary papers (cross-listed against
Johnston's Archive); the reused Didymos, Ida and 67P textures already exist from
Phase 9; nothing new is fetched and nothing is downloaded.

---

## 1. Method / algorithm sources

**This is the substance of the phase.** The tab is a **schematic mutual-orbit
view**: for each system it draws the primary and its moon or moons **to scale** on
their **real-size, real-period mutual orbit**. What the geometry rests on is measured
facts (diameters, separations, periods, size ratios) from the cited primary papers,
implemented in our own code, not downloaded as a database.

- **Draw the real mutual orbit to scale.** Each system's primary and moon are placed
  on a mutual orbit whose **semi-major axis (separation), period and the two body
  diameters are the real, cited values**, so the relative sizes and the orbit scale
  are honest. For a **near-equal double** (90 Antiope, 617 Patroclus + Menoetius) the
  two bodies are drawn about a **common barycenter** placed by the real size (mass)
  ratio, not one tiny moon around a big primary.
- **Adopt a stated convention for orientation and phase.** There is **no full
  mutual-orbit ephemeris** in this tab, and these systems are **unresolvable from
  Earth to the eye** (they were resolved only by radar, adaptive optics or a
  spacecraft flyby). So the orbit's **orientation in space** (how the mutual-orbit
  plane is tilted toward us) and the moon's **along-orbit phase** (where on the orbit
  it sits right now) are an **adopted convention, labeled illustrative**, kept
  strictly separate from the real, to-scale sizes and periods.

This is the same posture the repo uses elsewhere: a published fact or method is
freely implementable, the measured elements are copyright-free facts, and we
transcribe and implement rather than redistribute a database. It is deliberately a
**weaker positional claim** than the Dwarf Moons tab (Phase 17), where Pluto's system
had a real-position ephemeris; here **no system carries a real along-orbit position**,
only a real orbit size and period, so the phase and orientation are honestly labeled
as a convention for every system.

### 1a. Didymos + Dimorphos: the DART showcase (the real highlight)

**65803 Didymos + Dimorphos** is a near-Earth binary and the centerpiece of the tab.

- **Didymos** is the primary, about **765 m** across, rotating in **2.2593 h**.
- **Dimorphos** is the moon, about **160 m** across.
- Their **mutual separation** is about **1.19 km**, and the mutual orbital period was
  **11.921 h before** the DART impact.
- On **2022-09-26** NASA's **DART** spacecraft deliberately struck Dimorphos. The
  mutual period afterward was **11.372 h**, a shortening of **32 ± 2 minutes**
  (Thomas et al. 2023, Nature; the impact demonstration in Daly et al. 2023, Nature).
- This is the **first time humanity deliberately changed the orbit of a celestial
  body**, and the tab renders it as a **real, measured step change** in Dimorphos's
  period (before vs after), the one genuinely historic fact of the phase.

The Didymos body carries a **reused, real, public-domain DART photo** (§2a); the
Dimorphos moon is **illustrative** (no resolved surface map).

### 1b. 243 Ida + Dactyl: the first asteroid moon (and its poorly constrained orbit)

**243 Ida + Dactyl** was the **first confirmed asteroid moon**, discovered in Galileo
flyby images in **1993** (Belton et al. 1996, Icarus). Ida is a large, elongated
main-belt asteroid (roughly 30 km mean size, more than 50 km along its long axis);
Dactyl is a small (about 1.4 km) moon. **Dactyl's orbit is poorly constrained:** the
single Galileo flyby could only **bound** the orbit, not solve it fully, so its
semi-major axis and period are genuinely uncertain and **must be labeled as such**,
not shown with false precision. Ida carries a **reused, real, public-domain Galileo
photo** (§2a); Dactyl is **illustrative**.

### 1c. The multiple systems and the triple

- **87 Sylvia + Romulus + Remus** (Marchis et al. 2005, Nature) was the **first known
  triple asteroid**: a large main-belt primary with two small outer moons, resolved
  by adaptive optics. The primary and both moons are drawn to their real relative
  sizes on their real mutual orbits; Sylvia has **no resolved surface map** and is an
  illustrative shape, as are both moons.
- **216 Kleopatra + Alexhelios + Cleoselene** (Marchis et al. 2008; Descamps et al.
  2011) is the famous **"dog-bone"** metallic asteroid with two small moons. The
  **dog-bone shape is drawn as an illustrative shape** (there is no shipped surface
  map), and the two moons are illustrative markers on their real mutual orbits.

### 1d. The near-equal doubles

- **90 Antiope** (Merline 2000; Descamps et al. 2007) is a **near-equal double**: two
  components of very similar size orbiting a **common barycenter** between them. The
  tab draws it as the near-equal binary it is, with the **barycenter split placed by
  the real size (mass) ratio**, not as a tiny moon around a big primary.
- **617 Patroclus + Menoetius** is a **Jupiter Trojan near-equal double** and a
  **NASA Lucy flyby target in 2033**. It is drawn the same way as Antiope, as a
  near-equal binary about a common barycenter. Both components are illustrative shapes
  (no resolved map yet; Lucy will change that in 2033).

### 1e. The remaining binaries

- **22 Kalliope + Linus** (Merline et al. 2001; Margot & Brown 2003): a large
  main-belt primary with the moon Linus on its real mutual orbit. Both illustrative.
- **45 Eugenia + Petit-Prince + S/2004 (45) 1** (Merline et al. 1999, Nature): Petit-
  Prince was **the first asteroid moon discovered from the ground** (adaptive optics
  at a ground observatory), later joined by a second moon, S/2004 (45) 1. Both moons
  and the primary are illustrative shapes on their real mutual orbits.

### 1f. The comet honesty note (contact binaries, not moons)

The tab includes an explicit, honest note that **comets have no moons.** It states
plainly that there are **zero confirmed comet satellites** (nuclei are too small to
hold one), and it shows the closest real phenomenon, the **contact binary**, as what
it actually is, a **single body of two touching lobes, not a moon**:

- **67P/Churyumov-Gerasimenko** (ESA Rosetta) is the textbook comet contact binary
  and is shown with its **reused real photo** (§2b), labeled as **one body**, not a
  system.
- **Arrokoth** (NASA New Horizons) is the Kuiper-belt contact binary, drawn as an
  **illustrative** two-lobe shape (no shipped map), also labeled as one body.
- **Fragmenting comets give fragments, not moons:** 73P/Schwassmann-Wachmann 3 and
  Shoemaker-Levy 9 (D/1993 F2) are named as examples of **break-up debris trains**,
  explicitly **not** satellites.

This note is the honest counterpart to the real asteroid-moon systems: the tab does
not fabricate a comet moon, it explains why there is none.

### 1g. Accuracy and the schematic-view honesty (the load-bearing part)

**The schematic nature comes first, because it is the most important caveat.** The
tab is honest about being a **configuration view, not an ephemeris**:

- **REAL and to scale:** body diameters, mutual-orbit separations (semi-major axes),
  orbital periods, size ratios, near-equal-double barycenter splits, and the Didymos
  DART period step change. These are measured, cited facts.
- **ILLUSTRATIVE:** the orbit's **orientation in space** and the moon's **along-orbit
  phase**, for **every** system, plus **Dactyl's poorly constrained orbit** as an
  extra flag. These are an adopted convention, not a measurement, because there is no
  full mutual-orbit ephemeris here and the systems are unresolvable from Earth to the
  eye.
- The UI must **not** imply that a moon's drawn position is where it really is on a
  given date, and must **not** claim any observable transit or event.

This is the same honesty discipline the repo applies elsewhere (state the method,
state what is real, state what is a convention, and name what is uncertain), adapted
to a set of systems for which the honest product is the **real orbit geometry to
scale** rather than a live position.

---

## 2. Textures (reused PD and CC-BY-SA + illustrative)

This phase **adds no new texture**. It reuses three textures already in the repo from
Phase 9 (Didymos, Ida and 67P) and renders every other body as a **clearly-labeled
illustrative shape or marker**. The licensing situations differ and are kept separate
below. **Note:** in the repo these three are **single-view mission photos shown flat
in a detail panel, not equirectangular maps wrapped on a sphere**, so they are real
imagery of one hemisphere, not full-surface maps, and must be labeled that way.

### 2a. Reused public-domain NASA photos (Didymos, Ida)

| Texture (in repo) | Size (2026-07-20) | Source / mission | License | Required credit |
|---|---|---|---|---|
| `public/textures/small-bodies/didymos.jpg` | 107,330 bytes | DART approach imagery (the primary Didymos) | **Public domain** (US-Gov) | "NASA / JHU-APL (DART)" |
| `public/textures/small-bodies/ida.jpg` | 18,313 bytes | Galileo flyby imagery (243 Ida) | **Public domain** (US-Gov) | "NASA / JPL (Galileo)" |

These are **real spacecraft imagery of the primary bodies**, used to give Didymos and
Ida a real face while their **moons stay illustrative**. Both are **single-view
photos** (one imaged hemisphere), shown flat, not wrapped full-surface maps, exactly
as `SMALL_BODIES_DATA_SOURCES.md` records for the Phase 9 small-body imagery. This is
the standard NASA public-domain posture (courtesy credit, no CC obligation).

### 2b. Reused 67P photo (CC BY-SA 3.0 IGO), for the comet note only

| Texture (in repo) | Size (2026-07-20) | Source / mission | License | Required credit |
|---|---|---|---|---|
| `public/textures/small-bodies/churyumov-gerasimenko.jpg` | 510,464 bytes | ESA Rosetta NAVCAM (comet 67P) | **CC BY-SA 3.0 IGO** | **"ESA/Rosetta/NAVCAM, CC BY-SA 3.0 IGO"** |

**67P is the one texture in this tab that carries a real attribution obligation.** It
is **not** public domain: it is **ESA imagery under CC BY-SA 3.0 IGO**, and the
mandatory credit line, already used verbatim in the repo's About panel, is
**"ESA/Rosetta/NAVCAM, CC BY-SA 3.0 IGO"**. It is reused **only for the comet
contact-binary honesty note** (§1f), to show that 67P is **one body**, not a moon
system. This matches how `SMALL_BODIES_DATA_SOURCES.md` and the About panel already
credit 67P; if there is ever a discrepancy, that Phase 9 record and the About panel
are authoritative.

### 2c. Illustrative: all moons and un-mapped primaries (no map)

Everything else in the tab has **no dedicated surface map** and is rendered as a
**clearly-labeled illustrative shape or marker**, no texture shipped, exactly the
posture used for the un-imaged small bodies in `SMALL_BODIES_DATA_SOURCES.md`:

- **All the moons:** Dimorphos, Dactyl, Romulus, Remus, Alexhelios, Cleoselene,
  Petit-Prince, S/2004 (45) 1, Linus and Menoetius.
- **The un-mapped primaries:** Sylvia, Kleopatra (the dog-bone shape is illustrative),
  Antiope, Kalliope, Eugenia and Patroclus.
- **Arrokoth** (the comet-note contact binary) is an illustrative two-lobe shape
  unless a map is ever added.

Their **sizes, separations and periods are real and to scale** (§1); only their
**appearance** (surface, exact shape) and their **orbit orientation and phase** are
illustrative. Kleopatra's dog-bone and every irregular shape are illustrative, not a
resolved model, and must be labeled so.

---

## 3. No external data feed, no API, no runtime license

Stated plainly, because it is the defining property of this phase:

- **The geometry is drawn from transcribed constants, not fetched.** There is no live
  feed, no polling endpoint, no API key and no GitHub Action for this tab. The
  per-system diameters, separations, periods and size ratios are transcribed offline
  from the cited primary papers (cross-listed against Johnston's Archive) into a small
  constants file, and the schematic mutual-orbit view is drawn from those.
- **The only licensing surface is the three reused textures.** Didymos and Ida are
  **NASA public domain** (courtesy credit only); **67P is ESA CC BY-SA 3.0 IGO** and
  carries the mandatory "ESA/Rosetta/NAVCAM, CC BY-SA 3.0 IGO" line (§2b). The
  measured orbital elements are copyright-free facts; the schematic drawing is our own
  code. **The one attribution obligation this phase is the 67P CC BY-SA 3.0 IGO
  credit.**
- **Johnston's Archive is a convenience index, not the source of record.** Its
  "Asteroids with Satellites" compilation is consulted for cross-listing, but every
  element is attributed to the **primary paper** it came from (Belton, Marchis,
  Descamps, Merline, Margot & Brown, Thomas, Daly), which are the sources of record.

---

## Rejected / flagged items

- **Comets have no moons. Shown, not buried, as the headline.** There are zero
  confirmed comet satellites (nuclei too small). The UI must lead with this and must
  **not** invent a comet moon. Flagged as the top honesty item.
- **A contact binary is one body, not a moon.** 67P (Rosetta) and Arrokoth (New
  Horizons) are two touching lobes forming a **single body**, and must be labeled as
  such, never as a primary-plus-moon system. Flagged.
- **Fragmenting comets give fragments, not moons.** 73P/Schwassmann-Wachmann 3 and
  Shoemaker-Levy 9 (D/1993 F2) are break-up debris trains, explicitly not satellites.
  Do not present a fragment train as a moon. Flagged.
- **This is a schematic mutual-orbit view, not an ephemeris.** The orbit orientation
  in space and the along-orbit phase are an adopted convention for **every** system,
  because there is no full mutual-orbit ephemeris here and these systems are
  unresolvable from Earth to the eye (known only from radar, adaptive optics or
  spacecraft). The UI must not present a drawn moon position as a real position on a
  date. Flagged as the second honesty item.
- **The DART period step change is the real highlight.** Dimorphos's mutual period
  went from 11.921 h to 11.372 h (32 ± 2 minutes shorter) after the 2022-09-26 DART
  impact (Thomas et al. 2023). This is the first deliberate change of a celestial
  body's orbit and must be rendered and labeled as the real, measured centerpiece.
  Flagged as the key fact.
- **Dactyl's orbit is poorly constrained.** The single 1993 Galileo flyby could only
  bound Dactyl's orbit (Belton et al. 1996), so its semi-major axis and period are
  genuinely uncertain and must carry a "poorly constrained orbit" label, distinct from
  the better-measured systems. Flagged.
- **No surface maps for the moons or the un-mapped primaries.** Dimorphos, Dactyl,
  Romulus, Remus, Alexhelios, Cleoselene, Petit-Prince, S/2004 (45) 1, Linus and
  Menoetius, and the primaries Sylvia, Kleopatra, Antiope, Kalliope, Eugenia and
  Patroclus, ship no texture and are clearly-labeled illustrative shapes. Only
  Didymos, Ida and 67P carry a real photo. Kleopatra's dog-bone and every irregular
  shape are illustrative.
- **67P is ESA CC BY-SA 3.0 IGO, not public domain.** It is the one texture with a
  real attribution obligation. It must carry "ESA/Rosetta/NAVCAM, CC BY-SA 3.0 IGO"
  and is used only for the comet note. Flagged so it is never mislabeled public domain.
- **No new texture fetched this phase.** Only the three Phase-9 photos (`didymos.jpg`
  107,330 B, `ida.jpg` 18,313 B, `churyumov-gerasimenko.jpg` 510,464 B) are reused;
  nothing new is downloaded.
- **Johnston's Archive is not cited as the source of record.** It is a compiled index;
  the primary papers are the sources. Flagged so credit lands on the primary papers.
- **Provenance of record for the reused textures lives in the sibling doc.** This doc
  restates the licenses for a self-contained record, but if there is ever a
  discrepancy, `SMALL_BODIES_DATA_SOURCES.md` (Phase 9) and the About panel are
  authoritative for Didymos, Ida and 67P.

---

**Verification methodology note:** The method sources were recorded from the cited
primary papers and implemented in our own code, redistributing no software or dataset.
The **Didymos + Dimorphos** system (Didymos about 765 m, rotation 2.2593 h; Dimorphos
about 160 m; separation about 1.19 km; mutual period **11.921 h before** and
**11.372 h after** the **2022-09-26** DART impact, a **32 ± 2 minute** shortening)
comes from **Thomas et al. 2023, Nature** (the period change) and **Daly et al. 2023,
Nature** (the impact demonstration and geometry). The other systems come from their
primary papers: **243 Ida + Dactyl** the first asteroid moon (**Belton et al. 1996**,
Galileo 1993, Dactyl orbit poorly constrained); **87 Sylvia + Romulus + Remus** the
first triple (**Marchis et al. 2005**); **216 Kleopatra + Alexhelios + Cleoselene**,
the dog-bone (**Marchis et al. 2008; Descamps et al. 2011**); **90 Antiope** a
near-equal double (**Merline 2000; Descamps et al. 2007**); **22 Kalliope + Linus**
(**Merline et al. 2001; Margot & Brown 2003**); **45 Eugenia + Petit-Prince +
S/2004 (45) 1**, the first moon found from the ground (**Merline et al. 1999**); and
**617 Patroclus + Menoetius**, a Jupiter Trojan near-equal double and NASA Lucy flyby
target in **2033**. Elements were cross-listed against Johnston's Archive "Asteroids
with Satellites" (johnstonsarchive.net), which is a convenience index compiled from
those same primary papers; the primary papers are the sources of record. The reused
textures were confirmed present in the repo on 2026-07-20 with the sizes listed in §2
(`didymos.jpg` 107,330 bytes, NASA/JHU-APL DART, public domain; `ida.jpg` 18,313
bytes, NASA/JPL Galileo, public domain; `churyumov-gerasimenko.jpg` 510,464 bytes,
**ESA/Rosetta/NAVCAM, CC BY-SA 3.0 IGO**), all three being single-view mission photos
shown flat, not wrapped maps. All moons and un-mapped primaries, and Arrokoth, are
illustrative shapes; the diameters, separations, periods, size ratios, near-equal
barycenter splits and the DART period step change are real and to scale; the orbit
orientation and along-orbit phase are an adopted illustrative convention for every
system, and Dactyl's orbit is additionally poorly constrained. No external feed, API,
or new committed dataset or texture is used at runtime. **Comets have no moons; the
tab shows the real asteroid-moon systems and explains the comet situation honestly
(contact binaries are single bodies, fragmenting comets give fragments, not moons).**
See `docs/ASTEROID_MOONS_PHYSICS.md` for the honest-representation methodology.

---

## Phase 18 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app wires
this in. Frontend / physics implementation (`lib/`, `app/`, `components/`) is out of
scope for this doc; another agent owns it.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Didymos-Dimorphos geometry + DART step change | Thomas et al. 2023 (period 11.921 h before, 11.372 h after, 32 ± 2 min); Daly et al. 2023 (Didymos about 765 m, rotation 2.2593 h; Dimorphos about 160 m; separation about 1.19 km) | Transcribed into constants (owned by another agent), no runtime API | **The real highlight.** Render the before/after period as a real, measured step change; first deliberate change of a celestial body's orbit (2022-09-26). |
| Ida-Dactyl | Belton et al. 1996 (Galileo 1993) | Transcribed into constants | First confirmed asteroid moon. **Dactyl orbit poorly constrained** (single flyby): label it. Ida carries the real Galileo photo; Dactyl illustrative. |
| Sylvia + Romulus + Remus | Marchis et al. 2005 | Transcribed into constants | First known triple asteroid. Primary and both moons illustrative shapes on real mutual orbits. |
| Kleopatra + Alexhelios + Cleoselene | Marchis et al. 2008; Descamps et al. 2011 | Transcribed into constants | Dog-bone shape (illustrative); two illustrative moons on real mutual orbits. |
| Antiope | Merline 2000; Descamps et al. 2007 | Transcribed into constants | Near-equal double; draw about a common barycenter placed by the real size ratio. |
| Kalliope + Linus | Merline et al. 2001; Margot & Brown 2003 | Transcribed into constants | Primary + moon Linus on real mutual orbit; both illustrative. |
| Eugenia + Petit-Prince + S/2004 (45) 1 | Merline et al. 1999 | Transcribed into constants | First asteroid moon found from the ground; both moons illustrative. |
| Patroclus + Menoetius | NASA Lucy (flyby target 2033) | Transcribed into constants | Jupiter Trojan near-equal double; draw about a common barycenter; both illustrative (Lucy visits in 2033). |
| Comet honesty note | project brief + primary references | app-side text + reused 67P photo | **Comets have no moons.** 67P (real photo) and Arrokoth (illustrative) are contact binaries (one body). 73P and Shoemaker-Levy 9 give fragments, not moons. |
| Didymos texture | Reused `public/textures/small-bodies/didymos.jpg` (DART, **PD**) | Already in repo (107,330 B) | Credit "NASA / JHU-APL (DART)"; single-view photo shown flat, not a wrapped map. Real body; Dimorphos moon illustrative. |
| Ida texture | Reused `public/textures/small-bodies/ida.jpg` (Galileo, **PD**) | Already in repo (18,313 B) | Credit "NASA / JPL (Galileo)"; single-view photo shown flat, not a wrapped map. Real body; Dactyl moon illustrative. |
| 67P texture (comet note only) | Reused `public/textures/small-bodies/churyumov-gerasimenko.jpg` (ESA Rosetta, **CC BY-SA 3.0 IGO**) | Already in repo (510,464 B) | **Mandatory credit "ESA/Rosetta/NAVCAM, CC BY-SA 3.0 IGO".** Used only for the comet contact-binary note; 67P is one body, not a moon. |
| Moons + un-mapped primaries appearance | none (no map) | app-side render | Illustrative shapes / markers, clearly labeled; sizes and orbits real and to scale. |
| Orbit orientation + along-orbit phase | adopted convention | app-side render | **ILLUSTRATIVE for every system**; do not present as a real position on a date. |
| Real sizes / separations / periods / ratios | cited primary papers (Thomas 2023; Daly 2023; Belton 1996; Marchis 2005/2008; Descamps 2007/2011; Merline 1999/2000/2001; Margot & Brown 2003) | Transcribed into constants | Cross-listed against Johnston's Archive; primary papers are the sources of record. Drawn to scale. |
