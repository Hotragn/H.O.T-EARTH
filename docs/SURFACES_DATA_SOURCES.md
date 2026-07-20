# Surfaces (Standing on Mars and Titan) Data Sources (Phase 20)

Verification date: **2026-07-20**. Every source, method, asset and license below was
recorded on this date against the cited primary sources (NASA/USGS elevation models,
NASA/JPL Photojournal, NASA Mars fact sheet, NASA/ESA Cassini-Huygens results), the
already-shipped and validated code in this repo (`lib/mars-time`, `lib/planets`), and
the sibling data-source docs. Same rigor and honesty bar as `DATA_SOURCES.md` (Earth),
`PLANETS_DATA_SOURCES.md`, `MOONS_DATA_SOURCES.md` and `INTERSTELLAR_DATA_SOURCES.md`
(Phase 19, our closest template): real physics, real data, honest claims, everything
free and legally usable for an MIT open-source app, every source and license logged.
Anything that cannot be verified from an official or primary source is explicitly
flagged.

Scope this phase: a **"Surfaces" tab**, the app's first **ground-level view**. You
stand on two worlds. (1) **Mars, the real tier**: real elevation-model terrain, a real
rover panorama, and a live computed sun (real local time, sol and season via the
already-validated Mars24 machinery). (2) **Titan, the honest-cinematic tier**: real
cited measured facts and the one real Huygens surface photo, surrounded by terrain
that is **illustrative and labeled as such**. The headline honesty point comes first.

> **Honesty rule for this phase (leads the page): "live" means live SIMULATION, not a
> live camera.** There is **no streaming camera on the surface of Mars, Titan, or any
> planetary surface**. What is live is the **computed state**: the real position of
> the sun over the real site right now, the real Mars local time, sol and season
> (NASA GISS Mars24 algorithm, already implemented and validated in this repo at
> `lib/mars-time`), and the day / twilight / night phase derived from it. The pixels
> you see are rendered by our code from real data and labeled sources; nothing on
> screen is a camera feed.
>
> The page then carries a **two-tier, three-way honesty split that must never be
> blurred**:
>
> - **COMPUTED and REAL:** the Mars sun position, local true solar time, sol count and
>   season (Mars24, validated in-repo); solar irradiance at both worlds (solar constant
>   1361 W/m^2 scaled by real heliocentric distance via `lib/planets`); the
>   Saturn-in-Titan's-sky geometry and Saturn's apparent angular size; the day /
>   twilight / night phases.
> - **REUSED and REAL:** the Mars DEM heightmap (NASA/USGS, public domain), the real
>   rover 360 panorama (NASA/JPL-Caltech, public domain), the one real Huygens surface
>   photo (ESA/NASA/JPL/University of Arizona), and possibly a Mars sunset reference
>   photo.
> - **ILLUSTRATIVE and LABELED:** the rendered sky palettes (an artistic rendering of
>   real, cited phenomena, not measured spectra), **all Titan terrain** (no global
>   surface imagery exists at human scale), ambient / atmosphere effects, and any
>   enlarged UI elements.
>
> Second honesty item: **Mars and Titan are different honesty tiers and the UI must
> say which one you are standing on.** Mars is the real tier (real terrain, real
> panorama, real live-computed sun). Titan is real facts plus one real photo inside
> labeled-illustrative terrain, and its clock uses an **adopted rotational phase
> epoch** (the rate is real; the "what time is it right now" convention is adopted,
> unlike Mars where local time is fully real via Mars24).

## Summary table

| Source | What it provides | License / status | Attribution | Access | Verified against (2026-07-20) |
|---|---|---|---|---|---|
| **`lib/mars-time` (NASA GISS Mars24 algorithm; Allison & McEwen 2000)** | Live Mars local true solar time, sol count, areocentric solar longitude Ls (season), sun position over the site | Published algorithm; our own implementation, already shipped and validated (Ls to about 0.01 deg vs the GISS worked example; see `lib/mars-time.test.ts`) | Cite "NASA GISS Mars24; Allison & McEwen 2000" | **Already in repo**, reused, no new fetch | Header docs and tests in `lib/mars-time.ts` / `lib/mars-time.test.ts` |
| **NASA MOLA MEGDR gridded topography (MGS, 128 px/deg), PDS Geosciences Node** | The real Mars terrain heightmap: a 512x512 native-resolution crop centered on **Gale Crater and Mount Sharp (Aeolis Mons)** (center 5.37 S, 137.85 E; 236.1 x 237.1 km; elevation -4648 to +1412 m vs the areoid; 463 m/px; 16-bit PNG, linear mapping value/65535 * range + min, no resampling) | **Public domain** (US-Gov work; NASA PDS data policy) | "NASA/JPL/GSFC (MOLA Science Team); PDS Geosciences Node" | Downloaded offline from `pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/megt00n090hb.img`; committed at `public/data/surfaces/mars-gale-heightmap.png` (341,664 bytes) + `mars-gale-heightmap.json` metadata (857 bytes) | Files and metadata verified on disk 2026-07-20; scaling recorded in the sidecar JSON |
| **NASA/JPL Photojournal rover 360 panorama** | A real rover surface panorama of the Mars site: **PIA25407**, "Curiosity's 360-Degree Panorama of Avanavero Drill Site", Mastcam, **sol 3509** (2022-06-20), Mount Sharp, Gale Crater | **Public domain** (NASA / US-Gov work; NASA Media Usage Guidelines) | "NASA/JPL-Caltech/MSSS" | Downloaded offline (2026-07-20), committed as `public/textures/surfaces/mars-panorama.jpg` | Verified on disk: 4096x1124 (downsampled from native 29163x8000), 864,934 B. **Cylindrical projection, 360 deg by ~98.8 deg vertical, NOT equirectangular**; colors white-balanced by NASA |
| **NASA Mars fact sheet (NSSDCA)** | Mars surface gravity 3.71 m/s^2, mean surface pressure about 6-7 mbar, sol length 24 h 39 m 35 s, orbit parameters | US-Gov data, copyright-free measured facts | "NASA NSSDCA Mars Fact Sheet" | Transcribed offline into constants | Cross-checked against the fact sheet values already used by earlier phases |
| **NASA/ESA Cassini-Huygens (Titan measured facts)** | Titan surface temperature about 94 K, surface pressure about 1.5 bar, gravity 1.352 m/s^2, surface daylight about 0.1 percent of Earth's, methane drizzle and polar hydrocarbon lakes, Huygens landing 2005-01-14 (only surface photos ever taken; damp sand-like surface with rounded water-ice pebbles), landing site about 10.6 S, 192 W | Measured mission facts, copyright-free; imagery credit per line below | "NASA/JPL-Caltech; ESA" | Transcribed offline into constants and copy | Values consistent with the Cassini-Huygens published results and the moons-phase docs |
| **Huygens DISR surface photo** | The one real photograph from Titan's surface: **PIA07232**, "First Color View of Titan's Surface" (Huygens DISR, 2005-01-14) | NASA Photojournal standard free-use policy (joint-mission imagery; no NC/ND terms found); the joint credit line is mandatory | **"NASA/JPL/ESA/University of Arizona"** (verbatim from the NASA Photojournal source page; ESA's own pages order it "ESA/NASA/JPL/University of Arizona") | Downloaded offline (2026-07-20), committed as `public/textures/surfaces/titan-huygens-surface.jpg` | Verified on disk: 546x693 (native resolution, re-encoded q90), 19,233 B |
| **Saturn geometry (for the Titan sky)** | Saturn equatorial radius 60268 km; Titan orbital distance about 1,221,870 km; Titan tidally locked; rotation / solar day about 15.95 Earth days | Measured facts, copyright-free (NASA fact sheets / Cassini results) | "NASA NSSDCA; Cassini-Huygens" | Transcribed offline into constants | Computed apparent size checked by hand (see `SURFACES_PHYSICS.md`) |
| **Solar irradiance via `lib/planets`** | Solar constant 1361 W/m^2 scaled by 1/r^2 with the real live heliocentric distance of Mars and Saturn/Titan | Established value (SORCE/TIM era); our own shipped code | n/a | **Already in repo**, reused | Same machinery as the planets and moons phases |
| **Mars sky-color observational basis (Curiosity sol 956 sunset)** | The real, cited phenomenon the sky renderer illustrates: butterscotch daytime sky from suspended dust, and blue sunsets/sunrises near the sun (fine dust forward-scatters blue light, the reverse of Earth) | NASA imagery public domain; the phenomenon is a published observation | "NASA/JPL-Caltech/MSSS (Curiosity Mastcam, sol 956)" | Committed (2026-07-20): `public/textures/surfaces/mars-sunset.jpg` (PIA19400, 34,774 B, 1024x823) | The renderer's palette is labeled an artistic rendering of this cited phenomenon, not a measured spectrum |
| **Illustrative: Titan terrain, sky palettes, ambient effects** | All Titan ground geometry, both worlds' rendered sky color ramps, atmosphere / ambient effects | Original work (ours), MIT with the rest of the repo | n/a (original) | Drawn by our own code | Labeled illustrative in the UI; no real global human-scale Titan surface imagery exists |

**Nothing is fetched at runtime.** The DEM, panorama, Huygens photo and sunset
reference are static committed assets, fully logged in the provenance rows above
(verified on disk 2026-07-20); the Mars clock and sun, the
irradiance and the Saturn geometry are computed in the browser from already-shipped,
already-validated code and transcribed constants. No API key, no external feed, no
GitHub Action is added for this tab.

---

## 1. Mars: the real tier

### 1a. Terrain (real elevation model)

The ground you stand on is built from a **real NASA digital elevation model**, not
procedural noise: the **Mars Global Surveyor MOLA MEGDR gridded topography**
(128 px/deg, PDS Geosciences Node product `megt00n090hb.img`), cropped at native
resolution to a 512x512 tile centered on **Gale Crater and Mount Sharp (Aeolis
Mons)**, center 5.37 S, 137.85 E, covering 236.1 x 237.1 km. The **true meter
scaling is recorded and used** in the committed sidecar metadata
(`public/data/surfaces/mars-gale-heightmap.json`): 463 m/px horizontally, elevation
-4648 m to +1412 m relative to the areoid (MOLA topography), 16-bit PNG with the
linear mapping value/65535 * (max - min) + min, no resampling. The PNG is
`public/data/surfaces/mars-gale-heightmap.png` (341,664 bytes). Credit
"NASA/JPL/GSFC (MOLA Science Team); PDS Geosciences Node", public domain. A hill on
screen is the real hill at real proportions; vertical exaggeration, if any, is a
labeled display choice.

### 1b. Panorama (real rover photograph)

The horizon imagery is a **real rover 360 panorama** from the NASA/JPL Photojournal,
**public domain** (NASA / US-Gov work), credited "NASA/JPL-Caltech" (plus MSSS where
applicable) and identified by its **PIA number and the sol it was taken**, so anyone
can pull up the original.

Provenance (logged 2026-07-20): **PIA25407**, "Curiosity's 360-Degree Panorama of
Avanavero Drill Site", Mastcam, **sol 3509** (2022-06-20), Mount Sharp, Gale Crater.
Source: assets.science.nasa.gov (Photojournal PIA25407, native 29163x8000). Committed
as `public/textures/surfaces/mars-panorama.jpg`, 4096x1124 (Lanczos downsample, JPEG
q82), 864,934 bytes. Credit "NASA/JPL-Caltech/MSSS", public domain. Two honest
renderer notes carried from the source: it is a **cylindrical** panorama (360 deg
horizontal, ~98.8 deg vertical field), not 2:1 equirectangular, so it must be mapped
to a cylinder band centered near the horizon; and NASA states the colors are
white-balanced to Earth-like lighting (the UI labels this).

### 1c. The live computed sun (the "live" part, honestly defined)

What is live on Mars is **computed state, not a camera**: the sun's real position
over the real site right now, the real Mars local true solar time, the sol count and
the season (areocentric solar longitude Ls). All of it comes from the **NASA GISS
Mars24 algorithm (Allison & McEwen 2000), already implemented and validated in this
repo at `lib/mars-time`** (Ls verified to about 0.01 deg against the GISS worked
example; see `lib/mars-time.test.ts`). This phase **reuses** that machinery and adds
no new time code. Surface irradiance is the solar constant 1361 W/m^2 scaled by the
live heliocentric distance via `lib/planets`.

### 1d. The Mars sky story (real phenomenon, artistic rendering)

The real, cited facts: the Martian **daytime sky is butterscotch** colored by
suspended dust, and **sunsets and sunrises turn blue near the sun**, the reverse of
Earth, because the fine dust **forward-scatters blue light**. Observational basis:
**Curiosity's Mastcam sunset imagery from sol 956** (NASA/JPL-Caltech/MSSS, public
domain). The renderer's actual color ramp is a **labeled artistic rendering of that
real, cited phenomenon, not a measured spectrum**; the UI says so on the sky itself.

---

## 2. Titan: the honest-cinematic tier

### 2a. Real measured facts (cited, transcribed)

From NASA/ESA Cassini-Huygens results and NASA fact sheets, transcribed offline:
surface temperature about **94 K**, surface pressure about **1.5 bar** (higher than
Earth's), gravity **1.352 m/s^2**, surface daylight about **0.1 percent of Earth's**
(a thick orange haze), **methane drizzle** and **polar hydrocarbon lakes**. The
**Huygens probe landed 2005-01-14** and returned the **only photographs ever taken
from Titan's surface**, showing a damp, sand-like surface strewn with rounded
**water-ice pebbles**. Landing site about **10.6 S, 192 W**.

### 2b. The one real photo

The Huygens **DISR surface image** is committed as a static asset with the mandatory
credit **"ESA/NASA/JPL/University of Arizona"**, per the asset agent's verified
terms, shown in the UI next to the image.

Provenance (logged 2026-07-20): **PIA07232**, "First Color View of Titan's Surface"
(Huygens DISR, 2005-01-14). Source: assets.science.nasa.gov (Photojournal PIA07232,
native 546x693, used at native resolution, re-encoded JPEG q90). Committed as
`public/textures/surfaces/titan-huygens-surface.jpg`, 19,233 bytes. Hosted under the
NASA Photojournal standard free-use policy (no NC/ND terms found); the source page's
verbatim credit is **"NASA/JPL/ESA/University of Arizona"** (ESA's own pages order it
"ESA/NASA/JPL/University of Arizona"); the joint credit is shown in the UI beside the
image.

### 2c. Everything else on the Titan ground is illustrative, and labeled

**No global imagery of Titan's surface exists at human scale.** One probe took a
handful of photos at one spot in 2005; radar and infrared mapping from orbit resolve
kilometers, not meters. So **all Titan terrain around the real photo is illustrative**
(our own original geometry, consistent with the cited facts: dim orange light, damp
plain, pebbles) and the UI labels it illustrative, always.

### 2d. Saturn in Titan's sky (real geometry, honest visibility)

- **Titan is tidally locked**, so from the surface **Saturn hangs fixed in the sky**,
  never rising or setting, but **only from the Saturn-facing hemisphere**.
- **The real Huygens landing site (about 10.6 S, 192 W) is on the anti-Saturn side**,
  so **Saturn is below the horizon there, and the tab says so**. Any Saturn-in-the-sky
  view is rendered from an **explicitly labeled, chosen Saturn-facing viewpoint**, not
  from the landing site.
- **The haze caveat is real too:** even where Saturn is up, Titan's thick haze means
  you would **not see it crisply from the ground**. The crisp rendered Saturn is a
  labeled illustrative choice on top of real geometry.
- **The apparent size is computed from real numbers**, not styled: Saturn's radius
  60268 km at Titan's orbital distance of about 1,221,870 km gives an apparent
  angular diameter of about **5.7 degrees, roughly 11 times the Moon's apparent
  diameter from Earth** (the Moon is about 0.5 deg). See `SURFACES_PHYSICS.md`.

### 2e. The Titan clock (adopted epoch, labeled)

Titan's **solar-day rate is real** (about 15.95 Earth days, tied to its tidally
locked orbit) and the geometry is real, but the **absolute rotational phase**, "what
time is it right now on Titan," is an **adopted convention** and is labeled as such.
This is unlike Mars, where local time is fully real via Mars24.

---

## 3. Assets and licensing

| Asset (in repo) | Source | License | Required credit |
|---|---|---|---|
| `public/data/surfaces/mars-gale-heightmap.png` + `.json` (341,664 B + 857 B) | NASA MOLA MEGDR 128 px/deg (PDS Geosciences Node, `megt00n090hb.img`), Gale Crater crop | **Public domain** (US-Gov) | "NASA/JPL/GSFC (MOLA Science Team); PDS Geosciences Node" |
| `public/textures/surfaces/mars-panorama.jpg` (864,934 B, 4096x1124) | NASA/JPL Photojournal **PIA25407**, Curiosity Mastcam sol 3509 (Avanavero drill site, Mount Sharp); native 29163x8000, cylindrical 360 x ~98.8 deg | **Public domain** (NASA Media Usage Guidelines) | "NASA/JPL-Caltech/MSSS" |
| `public/textures/surfaces/titan-huygens-surface.jpg` (19,233 B, 546x693) | NASA/JPL Photojournal **PIA07232**, Huygens DISR, 2005-01-14 (native resolution) | NASA Photojournal free-use; joint credit mandatory | **"NASA/JPL/ESA/University of Arizona"** (verbatim from source page) |
| `public/textures/surfaces/mars-sunset.jpg` (34,774 B, 1024x823) | NASA/JPL Photojournal **PIA19400**, "Sunset in Mars' Gale Crater", Curiosity Mastcam sol 956 (2015-04-15); native 1344x1080 | **Public domain** | "NASA/JPL-Caltech/MSSS/Texas A&M Univ." |
| Titan terrain, sky palettes, ambient effects | Original (ours) | MIT with the repo | n/a (labeled illustrative) |

All four asset rows above are verified on disk (2026-07-20) with exact paths, sizes
and dimensions; nothing ships uncredited.

---

## Rejected / flagged items

- **"Live camera" framing is rejected outright.** No streaming camera exists on any
  planetary surface. The word "live" on this tab may only ever mean the live
  computed simulation state (sun, time, sol, season, phases). Top honesty item; the
  UI must carry the live-simulation-not-camera label.
- **Procedural Mars terrain was rejected.** Mars is the real tier; the ground must
  come from the real public-domain DEM with true meter scaling, or it does not ship.
  Shipped: the MOLA MEGDR Gale Crater crop with its scaling in the sidecar JSON.
- **MOLA resolution honesty.** The committed DEM is 463 m/px (MOLA MEGDR); it is the
  real regional topography (Gale Crater, Mount Sharp), not meter-scale ground
  detail. Close-up surface relief finer than the DEM grid is a rendering choice and
  must not be presented as measured. Flagged.
- **Unlabeled Titan terrain is rejected.** No human-scale global Titan surface
  imagery exists, so all Titan ground beyond the one real Huygens photo is
  illustrative and must be labeled illustrative everywhere it appears.
- **Saturn in the sky at the Huygens landing site is rejected as false.** The real
  site (about 10.6 S, 192 W) is on the anti-Saturn hemisphere; Saturn is below the
  horizon there and the tab says so. Saturn views use an explicitly labeled chosen
  Saturn-facing viewpoint. Flagged: the haze would blur Saturn even where it is up.
- **A "real" Titan clock is rejected.** The solar-day rate (about 15.95 Earth days)
  is real; the absolute phase epoch is adopted and labeled. Mars, by contrast, has a
  fully real clock via the validated Mars24 code.
- **Presenting the sky colors as measured spectra is rejected.** The butterscotch
  day and blue sunset are real, cited phenomena (Curiosity sol 956 observational
  basis), but the rendered palette is a labeled artistic rendering of them.
- **All asset provenance rows are now verified on disk (2026-07-20).** The DEM,
  the rover panorama (PIA25407), the Huygens photo (PIA07232) and the sunset
  reference (PIA19400) are logged above with exact IDs, URLs, paths, sizes and
  dimensions; nothing ships uncredited.

---

**Verification methodology note:** The Mars clock and sun come from the repo's
already-validated `lib/mars-time` (NASA GISS Mars24, Allison & McEwen 2000; Ls
verified to about 0.01 deg against the GISS worked example in `lib/mars-time.test.ts`).
Mars physical constants (gravity 3.71 m/s^2, pressure about 6-7 mbar, sol
24 h 39 m 35 s) are from the NASA NSSDCA Mars fact sheet. Titan facts (94 K, 1.5 bar,
1.352 m/s^2, about 0.1 percent daylight, methane drizzle, polar lakes, Huygens
2005-01-14 landing at about 10.6 S, 192 W with the only surface photos, water-ice
pebbles on damp ground) are from published NASA/ESA Cassini-Huygens results. Saturn's
apparent size from Titan (about 5.7 deg, roughly 11 times the Moon from Earth) is
computed from Saturn's radius 60268 km and Titan's distance about 1,221,870 km.
Irradiance is the solar constant 1361 W/m^2 scaled by live heliocentric distance via
`lib/planets`. The DEM is on disk and verified: a MOLA MEGDR 128 px/deg native crop
of Gale Crater (`public/data/surfaces/mars-gale-heightmap.png`, 341,664 bytes, with
scaling metadata in the sidecar JSON; NASA/JPL/GSFC MOLA Science Team, PD). The rover
panorama (PIA25407, Curiosity Mastcam sol 3509, NASA/JPL-Caltech/MSSS, PD, 864,934
bytes) and the Huygens DISR photo (PIA07232, NASA/JPL/ESA/University of Arizona,
19,233 bytes) are static committed assets fully logged above, with the sunset
reference (PIA19400) alongside. No camera feed exists or is claimed; "live" means the
computed simulation state only. See `docs/SURFACES_PHYSICS.md` for the honest
representation methodology.

---

## Phase 20 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app wires
this in. Frontend implementation (`app/`, `components/`) is out of scope for this
doc; another agent owns it.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Mars sun position / local time / sol / season | `lib/mars-time` (NASA GISS Mars24; Allison & McEwen 2000) | Reused, already validated in repo | **COMPUTED, real.** The only correct meaning of "live" on this tab. |
| Mars terrain | NASA MOLA MEGDR 128 px/deg, Gale Crater crop (PD) | Committed: `public/data/surfaces/mars-gale-heightmap.png` (341,664 B) + `.json` metadata | **REUSED, real.** 463 m/px, elevation -4648 to +1412 m, scaling in sidecar JSON; sub-grid detail is a rendering choice; any vertical exaggeration labeled. |
| Mars panorama | NASA/JPL Photojournal PIA25407, Curiosity Mastcam sol 3509 (PD) | Committed: `public/textures/surfaces/mars-panorama.jpg` (864,934 B, 4096x1124, cylindrical 360 x ~98.8 deg) | **REUSED, real.** Credit NASA/JPL-Caltech/MSSS; colors white-balanced by NASA (labeled). |
| Mars sky palette | Original ramp; observational basis Curiosity sol 956 (butterscotch day, blue sunset, forward-scattering dust) | app-side render | **ILLUSTRATIVE, labeled** artistic rendering of a real cited phenomenon, not a measured spectrum. |
| Irradiance (both worlds) | Solar constant 1361 W/m^2 via `lib/planets` distance | Reused in-repo code | **COMPUTED, real.** |
| Titan facts card | NASA/ESA Cassini-Huygens (94 K, 1.5 bar, 1.352 m/s^2, 0.1 percent daylight, drizzle, lakes) | Transcribed constants | **REUSED facts, real, cited.** |
| Huygens DISR photo | NASA/JPL Photojournal PIA07232 (Huygens DISR, 2005-01-14) | Committed: `public/textures/surfaces/titan-huygens-surface.jpg` (19,233 B, 546x693) | **REUSED, real.** Mandatory joint credit "NASA/JPL/ESA/University of Arizona" shown in UI. |
| Titan terrain | Original (ours) | app-side render | **ILLUSTRATIVE, labeled.** No human-scale Titan surface imagery exists. |
| Saturn in Titan's sky | Computed geometry (60268 km at about 1,221,870 km; about 5.7 deg, about 11x Moon) | Computed in browser | **COMPUTED, real geometry.** Fixed in sky (tidal lock), Saturn-facing hemisphere only; **below horizon at the real Huygens site and the tab says so**; haze caveat labeled; Saturn view uses a labeled chosen viewpoint. |
| Titan clock | Real rate (about 15.95 Earth-day solar day) + **adopted phase epoch** | Computed in browser | Rate real, absolute phase an **adopted labeled convention** (unlike Mars). |
| Day / twilight / night phases | Computed from sun geometry (both worlds) | Computed in browser | **COMPUTED, real** (Titan phase subject to the adopted epoch label). |
| Ambient / atmosphere effects, enlarged UI elements | Original (ours) | app-side render | **ILLUSTRATIVE, labeled.** |
