# Surfaces (Standing on Mars and Titan) Physics and Honest-Representation Methodology (Phase 20)

Companion to `docs/SURFACES_DATA_SOURCES.md`. Same non-negotiable bar as Earth, Mars,
the Moon, the planets, the small bodies, the moons and the interstellar tabs
(`physics-env-simulation` skill): **real physics and real data, or it doesn't ship. No
invented numbers.** This doc states exactly what is **COMPUTED** (the live sun, time,
sol and season on Mars; irradiance at both worlds; the Saturn-in-Titan's-sky geometry
and angular size; the day / twilight / night phases), what is **REUSED / REAL** (the
Mars DEM, the rover panorama, the Huygens photo, the cited measured facts), and what
is **ILLUSTRATIVE / APPROXIMATE** (the rendered sky palettes, all Titan terrain,
ambient effects, enlarged UI elements).

Verification date: **2026-07-20**. This is the app's first **ground-level view**: you
stand on the surface. That makes the honesty stakes higher, not lower, because a
first-person view reads as a photo unless the labels say otherwise.

## The overriding honesty rule: "live" means live SIMULATION

The single most important honesty statement of this phase, and the one the tab must
lead with, is that **"live" means a live SIMULATION, not a live camera. No streaming
camera exists on the surface of Mars, Titan, or any planetary body.**

What IS genuinely live is the **computed state**:

- The **real position of the sun over the real Mars site right now**, the **real Mars
  local true solar time**, the **sol count** and the **season** (areocentric solar
  longitude Ls), all from the **NASA GISS Mars24 algorithm** (Allison & McEwen 2000),
  **already implemented and validated in this repo** at `lib/mars-time` (Ls to about
  0.01 deg against the GISS worked example, per `lib/mars-time.test.ts`). Reused, not
  rewritten.
- The **surface solar irradiance** at both worlds (solar constant 1361 W/m^2 scaled by
  the live heliocentric distance via `lib/planets`).
- The **day / twilight / night phase** derived from the sun geometry.

The pixels are rendered by our code from real, labeled sources. Nothing on this tab
is, or is ever described as, a camera feed.

## Five structural honesty facts that shape everything

1. **"Live" is the computed simulation state, never a camera.** The rule above. It is
   why the tab's clock and sun can be fully real on Mars (Mars24) while the imagery
   is committed public-domain data, and why the UI must carry the
   live-simulation-not-camera label at all times.
2. **Mars is the real tier.** The terrain is a real NASA elevation model (MOLA
   MEGDR, a Gale Crater crop) with the true meter scaling recorded, the horizon is a real rover
   360 panorama (NASA/JPL-Caltech, public domain, identified by PIA number and sol),
   and the sun over it is live-computed. The sky-color story is real and cited: the
   Martian daytime sky is butterscotch from suspended dust, and sunsets and sunrises
   turn **blue near the sun**, the reverse of Earth, because fine dust
   forward-scatters blue light (observational basis: Curiosity Mastcam sunset
   imagery, sol 956). The renderer's colors are a **labeled artistic rendering of
   that real, cited phenomenon, not a measured spectrum**.
3. **Titan is the honest-cinematic tier.** The facts are real and cited (surface
   about 94 K, about 1.5 bar, gravity 1.352 m/s^2, daylight about 0.1 percent of
   Earth's, methane drizzle and polar lakes; Huygens landed 2005-01-14 and returned
   the only surface photos ever taken, a damp sand-like surface with rounded
   water-ice pebbles). The one real asset is the Huygens DISR surface photo
   (ESA/NASA/JPL/University of Arizona). **All terrain around it is illustrative and
   labeled**, because no global surface imagery of Titan exists at human scale.
4. **The Saturn-visibility geometry is told straight.** Titan is tidally locked, so
   Saturn hangs **fixed** in the sky, but **only from the Saturn-facing hemisphere**.
   The **real Huygens landing site (about 10.6 S, 192 W) is on the anti-Saturn side,
   so Saturn is below the horizon there, and the tab says so.** Any Saturn-in-the-sky
   view is from an explicitly labeled, chosen Saturn-facing viewpoint, not the
   landing site. And even where Saturn is up, the thick haze means you would not see
   it crisply from the ground (a real caveat, labeled). Its apparent size is computed
   from real geometry, not styled.
5. **Titan's rotational phase epoch is adopted, and labeled.** The solar-day RATE
   (about 15.95 Earth days) and the geometry are real; the absolute "what time is it
   right now on Titan" is an **adopted convention**, stated plainly. This is unlike
   Mars, where local time is fully real via Mars24.

## COMPUTED: the substance

### The Mars clock and sun (reused, validated Mars24)

- **Local true solar time, sol count and season (Ls)** come from `lib/mars-time`,
  the repo's implementation of the NASA GISS **Mars24** algorithm (Allison & McEwen
  2000): UTC to Terrestrial Time, mean and true anomaly with the ten-term perturber
  series, equation of time, and local true solar time at the site longitude. Already
  validated against the GISS worked example (Ls to about 0.01 deg) in
  `lib/mars-time.test.ts`. This phase adds no new time code.
- **Sun altitude and azimuth over the site** follow from Ls, the site latitude and
  the local hour angle (standard solar-position geometry, the same approach as the
  Earth and Mars tabs).
- **Day / twilight / night phases** are thresholds on the computed solar altitude, a
  real derivation, not a styling timer.

### Irradiance at both worlds

Top-of-atmosphere irradiance is the **solar constant 1361 W/m^2 scaled by 1/r^2**
with the live heliocentric distance from `lib/planets`: about 590 W/m^2 at Mars'
mean distance (1.52 AU) and about 15 W/m^2 at Saturn/Titan (9.5 AU). At Titan's
**surface** the haze cuts that to about **0.1 percent of Earth's surface daylight**
(a cited Cassini-Huygens result, reused as a fact, not computed by us; the split is
labeled).

### Saturn in Titan's sky (real geometry)

- **Apparent angular diameter:** 2 arctan(R / d) with Saturn's equatorial radius
  R = 60268 km and Titan's orbital distance d about 1,221,870 km gives about
  **0.0987 rad, about 5.7 degrees, roughly 11 times the Moon's apparent diameter
  from Earth** (the Moon is about 0.5 deg). Computed, not styled.
- **Fixed position:** Titan is tidally locked, so Saturn's sky position is fixed for
  a given surface location, computed from the site's longitude/latitude relative to
  the sub-Saturn point. At the real Huygens site (about 10.6 S, 192 W, anti-Saturn
  hemisphere) this computation puts **Saturn below the horizon**, and the tab shows
  that result honestly rather than moving Saturn.

### The Titan clock (real rate, adopted epoch)

Titan's solar day is about **15.95 Earth days** (tidally locked, so the solar day
tracks its orbital period around Saturn); the day/night cycle rate rendered from it
is real. The **absolute phase** (the "now" of the cycle) uses an **adopted epoch
convention**, labeled in the UI, because unlike Mars there is no validated in-repo
clock tying Titan's local solar time to UTC.

### The accuracy bound (load-bearing)

- **Mars time and sun:** the Mars24 recipe is good to about 0.01 deg in Ls and
  seconds-level in local time for the modern era, per the in-repo validation. That
  is real precision and may be shown.
- **Titan phase:** rate real, epoch adopted; the UI must not display Titan local
  time with false absolute authority.
- **Irradiance:** top-of-atmosphere values are real 1/r^2 scalings; surface values
  fold in cited atmospheric attenuation facts, not our own radiative transfer.
- **Sky color:** no spectral claim at all; the palettes are labeled artistic
  renderings of cited phenomena.

## REUSED / REAL

- **The Mars terrain is a real elevation model.** NASA MOLA MEGDR gridded topography
  (128 px/deg, PDS Geosciences Node), a 512x512 native-resolution crop of **Gale
  Crater and Mount Sharp**, public domain, committed at
  `public/data/surfaces/mars-gale-heightmap.png` with the **true meter scaling
  recorded** in the sidecar JSON (463 m/px; elevation -4648 to +1412 m vs the
  areoid). It is real regional topography; surface detail finer than the 463 m grid
  is a rendering choice and must not be presented as measured. Full provenance in
  `SURFACES_DATA_SOURCES.md`.
- **The Mars horizon is a real rover 360 panorama.** NASA/JPL-Caltech, public
  domain, identified by **PIA number and sol** (stubbed pending the asset agent).
- **The Huygens DISR surface photo is real**, the only photograph ever taken from
  Titan's surface (2005-01-14), credit **ESA/NASA/JPL/University of Arizona** per
  the asset agent's verified terms, shown in the UI.
- **The measured facts are real and cited:** Mars gravity 3.71 m/s^2, pressure about
  6-7 mbar, sol 24 h 39 m 35 s (NASA Mars fact sheet); Titan 94 K, 1.5 bar,
  1.352 m/s^2, 0.1 percent daylight, methane drizzle, polar lakes, damp surface with
  water-ice pebbles (NASA/ESA Cassini-Huygens); Saturn radius 60268 km at about
  1,221,870 km from Titan.
- **A Mars sunset reference photo (Curiosity sol 956) may be reused** as the labeled
  observational basis for the blue-sunset story (public domain,
  NASA/JPL-Caltech/MSSS).

## ILLUSTRATIVE / APPROXIMATE

Several elements are illustrative and must be labeled honestly, or the first-person
view becomes a lie:

- **The rendered sky palettes (both worlds).** The Mars butterscotch day and blue
  sunset, and Titan's dim orange gloom, are **artistic renderings of real, cited
  phenomena**, not measured spectra or radiative-transfer output. The label goes on
  the sky itself.
- **All Titan terrain.** No global human-scale surface imagery of Titan exists, so
  every piece of ground beyond the one real Huygens photo is our own original
  geometry, consistent with the cited facts but illustrative, and labeled.
- **The crisp Saturn.** Where a Saturn-facing viewpoint is chosen, the rendered
  Saturn is drawn at its real computed angular size and fixed position, but crisper
  than the haze would ever allow from the ground; the haze caveat is labeled.
- **Ambient / atmosphere effects** (dust motes, drizzle, wind audio, fog ramps) are
  mood, not measurement, and are labeled.
- **Enlarged or repositioned UI elements** (markers, compass, oversized labels) are
  legibility choices, labeled where they could be mistaken for scale claims.
- **Any vertical exaggeration on the Mars DEM** is a labeled display choice; the
  default is the true recorded scaling.

Nothing else is approximated and nothing is invented. There is no fabricated
terrain on Mars, no faked camera feed, no invented Titan clock authority, and no
Saturn placed where it cannot be.

## Computed vs reused vs illustrative: the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Mars sun position / local time / sol / season | **Computed (real, live)** | "Live simulation - NASA GISS Mars24 (Allison & McEwen 2000), validated in repo; not a camera" |
| Day / twilight / night phase (Mars) | **Computed (real)** | "Computed from live solar altitude" |
| Irradiance (Mars, Titan) | **Computed (real)** | "Computed - 1361 W/m^2 scaled by live distance; Titan surface daylight about 0.1 percent (Cassini-Huygens, cited)" |
| Saturn position + angular size in Titan's sky | **Computed (real geometry)** | "Computed - about 5.7 deg (about 11x the Moon from Earth); fixed (tidal lock); Saturn-facing hemisphere only" |
| Saturn at the Huygens site | **Computed truth, shown** | "Below the horizon here - the real landing site is on the anti-Saturn side" |
| Saturn-visible viewpoint | **Labeled choice** | "Chosen Saturn-facing viewpoint, not the Huygens landing site; haze would blur this view" |
| Titan day/night cycle | **Computed rate, adopted epoch** | "Rate real (about 15.95 Earth days); absolute phase is an adopted convention" |
| Mars terrain | **Reused / real (PD)** | "Real NASA MOLA topography (Gale Crater, 463 m/px); true meter scaling; exaggeration labeled if any" |
| Mars panorama | **Reused / real (PD)** | "Real rover panorama, NASA/JPL-Caltech, PIA number + sol shown" |
| Huygens photo | **Reused / real** | "The only photo from Titan's surface (2005-01-14); ESA/NASA/JPL/University of Arizona" |
| Mars/Titan facts cards | **Reused / real (measured)** | "Measured - NASA Mars fact sheet / Cassini-Huygens" |
| Sky palettes (both worlds) | **Illustrative** | "Artistic rendering of a real, cited phenomenon (butterscotch day, blue sunset: Curiosity sol 956), not a measured spectrum" |
| Titan terrain | **Illustrative (original)** | "Illustrative - no human-scale Titan surface imagery exists" |
| Ambient / atmosphere effects | **Illustrative** | "Mood effect, not measurement" |
| Enlarged UI elements | **Illustrative** | "Enlarged for legibility" |
| Any camera feed | **Not claimed, does not exist** | "Live means live simulation; no streaming camera exists on any planetary surface" |

Rules carried over from Earth / Mars / Moon / planets / small bodies / moons /
interstellar, unchanged:

- Every quantity on screen names its category and source (computed, reused/real, or
  illustrative), and the two worlds name their honesty tier (Mars real tier, Titan
  honest-cinematic tier).
- No invented values; the live label always means computed simulation state, never a
  camera; Titan's absolute clock is never presented as real; Saturn is never drawn
  in a sky it cannot occupy without the viewpoint label.
- The reused assets are the DEM, the panorama, the Huygens photo and possibly one
  sunset reference photo; the illustrative liberties are the sky palettes, all Titan
  terrain, the ambient effects and the enlarged UI elements, and every one is
  labeled.

## What is honestly showable this phase (crisp statement)

- **COMPUTED (real):** the Mars sun position, local true solar time, sol and season
  (validated Mars24 via `lib/mars-time`); irradiance at both worlds (1361 W/m^2
  scaled by live distance via `lib/planets`); the Saturn-in-Titan's-sky geometry and
  its about 5.7 deg apparent size (about 11 times the Moon from Earth); the day /
  twilight / night phases.
- **REUSED (real):** the NASA MOLA MEGDR heightmap (Gale Crater) with true meter
  scaling, the
  NASA/JPL-Caltech rover panorama (PIA number and sol), the Huygens DISR photo
  (ESA/NASA/JPL/University of Arizona), possibly a Mars sunset reference photo, and
  the cited measured facts for both worlds.
- **ILLUSTRATIVE (labeled):** the rendered sky palettes (artistic renderings of the
  real cited phenomena), all Titan terrain, ambient / atmosphere effects, and
  enlarged UI elements.

What we deliberately do **not** do: call anything a camera feed (none exists),
procedurally fake the Mars ground, show Saturn in the sky at the real Huygens
landing site (it is below the horizon there, and the tab says so), present Titan's
absolute clock as real (the rate is real, the epoch is adopted and labeled), pass
the sky colors off as measured spectra, or leave any Titan terrain unlabeled. This
tab lets you stand on **real Mars ground under a genuinely live-computed sun**, and
on **an honestly labeled Titan** built from real cited facts and the one real
photograph humanity has from its surface, with the computed / reused / illustrative
split stated on screen.
