# Other Moons (Mars, Uranus and Neptune Satellites) Physics and Honest-Representation Methodology (Phase 16)

Companion to `docs/OTHER_MOONS_DATA_SOURCES.md`. Same non-negotiable bar as Earth,
Mars, the Moon, the planets, the major moons, Jupiter's moons and Saturn's moons
(`physics-env-simulation` skill): **real physics and real data, or it doesn't ship.
No invented numbers.** This doc states exactly what is **COMPUTED** (the substance
of the tab), what is **REUSED / REAL** (spacecraft and artist textures plus measured
orbital facts), and what is **ILLUSTRATIVE / APPROXIMATE** (rendering choices and the
accuracy bound).

Verification date: **2026-07-19**. Bodies: **Phobos, Deimos** (Mars); **Miranda,
Ariel, Umbriel, Titania, Oberon** (Uranus); **Triton, Proteus, Nereid** (Neptune),
ten satellites of three planets combined into one tab. The moons' surfaces and
compositions were covered where relevant in earlier phases (Triton in Phase 5,
`MOONS_PHYSICS.md`) and are not redone here. This phase is about their **apparent
motion around their planet as seen from Earth**: the live configuration, the system
geometry, and the (rare, from Earth) transit / shadow-transit / occultation /
eclipse flags.

## The overriding honesty rule for this phase

This tab has **no external dataset to fetch and no measured-vs-modeled tension over
the data**, because the substance is a **computation**. The honest story is four
lines, and the first is the one that dominates everything:

- **Configuration view first, not an events predictor.** Unlike Jupiter (nearly
  edge-on to Earth, a crisp shadow-transit dot crossing a big disk almost nightly,
  Phase 14), Mars, Uranus and Neptune present **tiny disks** from Earth (Mars about
  4 to 25 arcsec depending on opposition, Uranus about 3.7 arcsec, Neptune about
  2.3 arcsec). Against targets that small, a moon transiting the disk or casting a
  shadow on it is **rare to effectively unobservable from Earth**. So the tab
  honestly shows each moon's **real live apparent position** and the **striking true
  geometry**: Uranus's system tipped about **98 degrees** (its opening toward us
  changing across an 84-year season, last equinox 2007, next about 2049), Triton's
  **retrograde** orbit, and **Phobos** circling Mars in about **7.65 hours**, below
  synchronous height, rising in the west and slowly spiraling in. This is the single
  most important honest caveat, and the tab must lead with it, not bury it.
- **Real physics, computed.** Moon positions come from **Kepler propagation of real
  cited JPL mean orbital elements**, oriented by **each planet's IAU pole** into the
  plane of sky, with the planet's own geocentric direction, apparent diameter and
  system tilt from `lib/planets`. Same posture as Earth's `lib/solar.ts`, Mars'
  Mars24, the Moon's Meeus theory, the ISS's SGP4, the Jupiter Ch. 44 method and the
  Saturn Kepler-plus-Ch. 45 method.
- **Real textures.** The Mars and Triton disks and the seven new moon maps are
  genuine public-domain spacecraft imagery; the Uranus and Neptune disks are reused
  CC-BY artist textures (attribution required, stylized); Proteus and Nereid have no
  map and are honest illustrative tinted spheres.
- **Accuracy stated.** Kepler from mean elements is low-accuracy and degrades away
  from the element epoch. Triton (Laplace plane tilted from Neptune's equator) and
  Nereid (ecliptic frame, 2020 epoch, e = 0.751) are the least accurate; Phobos,
  Deimos and the five Uranian moons are solid near epoch. We say so and point at JPL
  Horizons for critical cross-checks.

**These are real positions of real moons.** The tab computes genuine geometry from
published methods, with the accuracy honestly bounded and the tiny-disk reality
honestly stated. It does not fake, and it does not overclaim a shadow-transit show
that these systems, seen from Earth, do not provide.

## Two structural facts that shape everything

1. **The disks are tiny, so this is a configuration view.** The whole reason the tab
   leads with live positions and geometry rather than an event calendar is angular
   size. Jupiter is a big disk seen nearly edge-on, so its moons throw shadow dots
   across it almost nightly. Mars is a small disk (and only briefly large near a
   close opposition), and Uranus and Neptune are barely-resolved points a few arcsec
   across. Transits, shadow transits, occultations and eclipses are still real
   geometric conditions and are still computed and flagged, but from Earth they are
   rare to unobservable, and the honest headline is **where each moon is right now**,
   not **when the next shadow crosses**.
2. **The system geometry is the story, and it is genuinely striking.** Three real,
   computable facts carry this tab: **Uranus is tipped about 98 degrees**, so its
   five major moons trace near-circular rings around a planet lying on its side, and
   how open those rings appear to us changes across Uranus's 84-year season (the
   rings and moon plane were edge-on to Earth at the 2007 equinox and open toward one
   pole in between, next edge-on about 2049); **Triton orbits Neptune backward**
   (retrograde), the mark of a captured Kuiper-belt object; and **Phobos orbits Mars
   faster than Mars rotates** (about 7.65 hours versus Mars's roughly 24.6-hour day),
   below synchronous height, so tides are dragging it slowly inward. None of this is
   invented; all of it falls straight out of the real elements and poles.

## COMPUTED: the substance

### Apparent moon positions (Kepler + JPL mean elements + planet pole)

For any instant, each moon's apparent position relative to its planet is built in
code, in three steps:

- **Kepler two-body propagation** of the moon's **real cited JPL mean orbital
  elements** (from the JPL SSD "Planetary Satellite Mean Orbital Elements" table)
  advances it along its ellipse to the requested time. The three element sets carry
  different frames, and each is used in its own frame: **Mars set MAR099** (J2000,
  Laplace plane), the **Uranus set** (J2000, Uranus's **equatorial** frame), and the
  **Neptune set** (Triton and Proteus J2000 Laplace plane; **Nereid** ecliptic frame,
  **2020 epoch**, **e = 0.751**).
- **Rotation by the planet's IAU pole** (Mars RA 317.681 deg, Dec 52.887 deg; Uranus
  RA 257.311 deg, Dec -15.175 deg; Neptune RA 299.36 deg, Dec 43.46 deg) carries each
  planet-centered vector from its element frame onto the sky.
- **`lib/planets`** supplies the planet's geocentric direction and distance, placing
  the moon on the plane of sky relative to the planet's disk as seen from Earth.

This yields the **apparent layout of the moons strung around each planet** and the
inputs to every event test below. The orbital periods that drive the motion
(approximately Phobos 0.319 d, that is about 7.65 h, Deimos 1.26 d; Miranda 1.41 d,
Ariel 2.52 d, Umbriel 4.14 d, Titania 8.71 d, Oberon 13.46 d; Triton 5.88 d
retrograde, Proteus 1.12 d, Nereid about 360 d with e = 0.751) are the real values
from JPL SSD.

### The four phenomenon flags and their geometry

Each is a clean condition on the computed coordinates, tested against the planet's
disk, and each is **shown honestly as rare-to-unobservable from Earth given the tiny
disks**:

- **Transit** (moon across the planet's disk): the moon passes **in front of** the
  disk as seen from Earth. Condition: the plane-of-sky offset is inside the limb
  **and** the moon is on the near side (toward the observer).
- **Shadow transit** (moon's shadow on the planet): the moon's **shadow**, cast by
  the Sun, falls on the planet. Condition: the shadow, obtained by projecting the
  moon along the Sun-to-moon direction onto the planet, lands inside the disk.
- **Occultation** (moon behind the planet's disk): the moon passes **behind** the
  disk as seen from Earth and is hidden. Condition: projected onto the disk **and**
  on the far side.
- **Eclipse** (moon in the planet's shadow): the moon passes into the planet's own
  shadow and is no longer sunlit. Condition: the moon lies within the planet's shadow
  cone (a Sun-direction test, not an Earth-direction one).

The pairing is the same physics as the Jupiter and Saturn tabs: transit and
occultation are **Earth-line** events (who is in front of or behind the disk for the
observer); shadow transit and eclipse are **Sun-line** events (where the shadows
fall). The difference here is purely one of scale: the disks are so small that these
conditions are met rarely and are hard to observe, which is why the flags are shown
as a secondary, honestly-bounded layer under the configuration view.

### Each planet's sky position, apparent diameter and system tilt

To make the tab honest and useful, three more quantities are computed via
`lib/planets` (low-precision planetary theory, VSOP87 truncation / Meeus planetary
chapters) plus the IAU pole, in code, no runtime API, cross-checked offline against
JPL Horizons:

- **Geocentric RA/Dec** of each planet: is it above the horizon at the observer's
  location and time, and where is it?
- **Apparent diameter** of each planet (Mars about 4 to 25 arcsec across its
  synodic cycle, Uranus about 3.7 arcsec, Neptune about 2.3 arcsec): the actual
  target size, and the reason the event flags are rare.
- **System tilt**, the opening of each planet's equatorial/moon plane toward Earth.
  For Uranus this is the headline: the roughly 98-degree axial tip means the moon
  plane swings from edge-on (2007 equinox, next about 2049) to wide-open across the
  84-year orbit, and the tab computes and shows the current opening. For Mars and
  Neptune the tilt is modest but is computed the same way.

### The accuracy bound (load-bearing)

Kepler propagation from **mean** elements reproduces the live configuration but
**ignores nodal and apsidal precession** and higher-order perturbations. So positions
are good for the **live configuration near the element epoch** and **degrade away from
it**. This is not observing-grade timing. **Triton and Nereid are the least
accurate**: Triton's Laplace plane is significantly tilted from Neptune's equator and
precesses, and Nereid is in the ecliptic frame at a 2020 epoch with **extreme
eccentricity (e = 0.751)**, so a small element error swings a large position error
near periapsis. **Phobos, Deimos and the five Uranian moons are solid near epoch.**
For critical positions or timing, cross-check **JPL Horizons** (offline; never called
at runtime). The UI must show the bound and point there, and must not imply
minute-level or second-level precision.

## REUSED / REAL

- **The Mars and Triton textures and the seven new moon maps are real spacecraft
  imagery.** The Mars disk (`mars-mola-colorized.jpg`) is a public-domain NASA/USGS
  MOLA colorized shaded-relief map (its **color encodes elevation**, not a visible
  photo, label it). Triton (`triton.jpg`) is a public-domain Voyager 2 mosaic from
  the single 1989 flyby, which saw **one hemisphere**; its **northern hemisphere is a
  synthetic fill**, and must be labeled as such. The seven new maps (Phobos, Deimos;
  Miranda, Ariel, Umbriel, Titania, Oberon) are public-domain Viking/MRO and Voyager 2
  mosaics, **real imagery, not illustrative tinted spheres**. Provenance and licenses:
  `OTHER_MOONS_DATA_SOURCES.md` §2, ultimately `MARS_DATA_SOURCES.md` §1b (Mars) and
  `MOONS_DATA_SOURCES.md` §1h (Triton).
- **The Uranus and Neptune textures are real reused assets, but CC-BY and
  artist-tuned.** The two ice-giant disks (`uranus.jpg`, `neptune.jpg`) are Solar
  System Scope **CC-BY 4.0** textures already in the repo. They carry a real
  **attribution obligation** ("Solar System Scope (solarsystemscope.com),
  CC-BY 4.0"), in-app and in the repo CREDITS/ASSETS file. They are **stylized, not
  raw observations** (no public-domain equirectangular map exists for either ice
  giant, only one Voyager 2 flyby each), and are drawn as unlit snapshots. Provenance:
  `PLANETS_DATA_SOURCES.md` §1e, §1f.
- **The orbital periods, radii, the retrograde Triton and the Uranus tip are real,
  measured facts.** Triton's **retrograde** orbit (inclination greater than 90
  degrees, the signature of a captured object), Uranus's **roughly 98-degree** axial
  tilt, Phobos's **below-synchronous** orbit (about 7.65 hours, faster than Mars's
  rotation, tidally decaying), and all the orbital periods and radii come from JPL SSD
  (mean elements + physical parameters), not tuned for the animation.

## ILLUSTRATIVE / APPROXIMATE

Several rendering realities must be labeled honestly, or the picture is misleading:

- **Rendered moon markers are enlarged for legibility.** The moons are tiny against
  their planets (and the planet disks are themselves tiny from Earth). Drawn strictly
  to scale, a moon would be a sub-pixel speck. So the app renders the **positions to
  scale** (that is the physics) but the **moon and shadow markers enlarged for
  visibility**. This must be stated: the *where* is honest; the on-screen *dot size*
  is a legibility choice, not the true angular size.
- **Proteus and Nereid are illustrative tinted spheres.** Neither has a dedicated
  surface map (both small and poorly imaged: Proteus was caught only at low resolution
  by Voyager 2, Nereid was never resolved), so they are rendered as clearly-labeled
  tinted spheres using measured color/albedo, no fake surface detail, exactly as the
  never-visited dwarf planets are handled (`DWARF_PLANETS_DATA_SOURCES.md` §1e). Their
  **positions are still fully computed**; only their appearance is illustrative.
- **Event timing is bounded, not exact, and events are rare from Earth.** Times from
  the Kepler-from-mean-elements method are good for the live configuration near epoch,
  degrading away from it (Triton and Nereid worst). For critical work, cross-check JPL
  Horizons (offline). Given the tiny disks, disk transits and shadow transits are rare
  to effectively unobservable and are presented as a secondary, honestly-bounded layer.
- **The planets are drawn as unlit snapshots.** Mars from an artist-free but
  elevation-colored MOLA map; Uranus and Neptune from Solar System Scope CC-BY,
  artist-tuned representations. All three are rendered as static, unlit disks. Label
  Uranus and Neptune illustrative-of-appearance (stylized), not "live"; label the Mars
  map as elevation-colored topography, not a visible photo. (Uranus's and Neptune's
  real winds belong to the Planets phase, `PLANETS_PHYSICS.md`, and are not
  re-litigated here.)
- **Phobos and Deimos on spheres are shape approximations.** Both are irregular,
  non-spherical bodies; wrapping a map onto a sphere approximates their real lumpy
  shape and must be labeled. The five Uranian moon maps are southern-hemisphere-heavy
  (Voyager 2, 1986) with large northern coverage gaps, and must be labeled, same
  posture as Triton.

Nothing else is approximated and nothing is invented. There is no fabricated planet
weather, no faked moon surface, and no live feed.

## Computed vs reused vs illustrative: the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Moon apparent positions (10 moons) | **Computed** | "Computed - Kepler from JPL mean elements + planet pole" |
| Transit / shadow transit / occultation / eclipse flags | **Computed** | "Computed flag - rare from Earth (tiny disk); times bounded" |
| Planet sky position + apparent diameter | **Computed** | "Computed - planetary theory; cross-checked offline" |
| System tilt (Uranus about 98 deg, its opening across the 84-yr season) | **Computed** | "Computed - from pole + planet direction (Uranus equinox 2007 / next ~2049)" |
| Retrograde Triton, below-synchronous Phobos | **Real (measured)** | "Measured - JPL SSD orbital elements" |
| Mars disk texture | **Reused / real (PD, static)** | "NASA/USGS MOLA - color = elevation, unlit snapshot" |
| Uranus + Neptune disk textures | **Reused / real (CC-BY, static)** | "Solar System Scope, CC-BY 4.0 - stylized, unlit snapshot" |
| Triton disk texture | **Reused / real (PD, static)** | "Voyager 2 (1989), one hemisphere; northern hemisphere synthetic fill" |
| Phobos / Deimos disk textures | **Reused / real (PD, static)** | "Viking/MRO (public domain); irregular body, sphere is approximate" |
| Miranda / Ariel / Umbriel / Titania / Oberon disk textures | **Reused / real (PD, static)** | "Voyager 2 1986 (public domain); southern hemisphere, northern gap" |
| Proteus / Nereid appearance | **Illustrative** | "Illustration, not an observation (no map exists)" |
| On-screen moon / shadow marker size | **Illustrative** | "Marker enlarged for visibility (real moons/disks are tiny)" |
| Orbital periods, radii | **Real (measured)** | "Measured - JPL SSD" |
| Predicted times to the second | **Not claimed** | "Bounded accuracy - cross-check JPL Horizons (Triton/Nereid worst)" |

Rules carried over from Earth / Mars / Moon / planets / moons / Jupiter's moons /
Saturn's moons, unchanged:

- Every quantity on screen names its category and source.
- No invented values; computed geometry is never presented as a live reading it is
  not, and the accuracy bound and the tiny-disk reality are always shown.
- The only "static" content is the reused imagery; the only "illustrative" liberties
  are enlarging the moon/shadow markers and tinting Proteus/Nereid, and both are
  labeled.

## What is honestly showable this phase (crisp statement)

- **COMPUTED (the substance):** the ten moons' apparent positions (Kepler from cited
  JPL mean elements, oriented by each planet's pole, via `lib/planets`), the four
  phenomenon flags (transit, shadow transit, occultation, eclipse) against each
  planet's disk, and each planet's geocentric RA/Dec, apparent diameter and system
  tilt (including Uranus's roughly 98-degree tip and its changing opening across the
  84-year season). All from published methods, no runtime API.
- **REUSED / REAL:** the Mars MOLA and Triton textures and the seven new Phobos,
  Deimos and Uranian-moon maps (all public-domain mission imagery), and the Uranus and
  Neptune textures (Solar System Scope, CC-BY 4.0, attributed, stylized); the real
  orbital periods and radii; and the real, measured facts of Triton's retrograde orbit,
  Uranus's 98-degree tilt and Phobos's below-synchronous, decaying orbit.
- **ILLUSTRATIVE / APPROXIMATE:** on-screen moon and shadow markers are enlarged for
  legibility (the real moons and planet disks are tiny); Proteus and Nereid are
  clearly-labeled tinted spheres (no map exists); event timing is bounded (good near
  epoch, degrading away, Triton and Nereid worst) with JPL Horizons named for critical
  cross-checks; and the planets are drawn as unlit snapshots (Mars elevation-colored,
  Uranus/Neptune stylized).

What we deliberately do **not** do: fetch anything at runtime, invent planet weather
or moon surfaces, sell this as a nightly shadow-transit clock (from Earth these events
are rare to unobservable), claim second-level timing, or draw the moons to a false
angular size without labeling it. This tab shows **real, computed positions** of ten
real moons and the genuinely striking geometry of three very different systems
(Uranus on its side, Triton going backward, Phobos racing below synchronous height),
computed from published methods, with the tiny-disk reality and the accuracy honestly
stated.
