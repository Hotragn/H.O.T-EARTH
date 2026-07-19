# Saturn's Moons (Transits, Shadows, Ring Geometry) Physics & Honest-Representation Methodology (Phase 15)

Companion to `docs/SATURN_MOONS_DATA_SOURCES.md`. Same non-negotiable bar as
Earth, Mars, the Moon, the planets, the major moons and Jupiter's moons
(`physics-env-simulation` skill): **real physics and real data, or it doesn't
ship. No invented numbers.** This doc states exactly what is **COMPUTED** (the
substance of the tab), what is **REUSED / REAL** (spacecraft and artist textures
plus measured orbital facts), and what is **ILLUSTRATIVE / APPROXIMATE**
(rendering choices and the accuracy bound).

Verification date: **2026-07-19**. Bodies: **Mimas, Enceladus, Tethys, Dione,
Rhea, Titan, Iapetus** (seven satellites of Saturn). The moons' surfaces, oceans,
plumes and Titan's methane weather were covered in Phase 5 (`MOONS_PHYSICS.md`)
and are not redone here. This phase is about their **apparent motion around
Saturn as seen from Earth**: transits, shadow transits, occultations, eclipses,
their interactions with the rings, and the ring tilt geometry.

## The overriding honesty rule for this phase

This tab has **no external dataset to fetch and no measured-vs-modeled tension
over the data**, because the substance is a **computation**. The honest story is
four lines, and the first is the one that dominates everything:

- **Seasonality first.** Saturn's regular moons orbit in Saturn's equatorial
  plane, which is the ring plane. So a moon only transits Saturn's disk or casts
  its shadow on the cloud tops during the **season around each Saturn equinox**
  (the ring-plane crossing), which recurs only about **every 15 years**. **The
  last equinox was 2025-05-06.** Away from that season the moons pass above or
  below the disk and their shadows miss it. This is the single most important
  honest caveat, and the tab must lead with it, not bury it.
- **Real physics, computed.** Moon positions come from **Kepler propagation of
  real JPL mean orbital elements**, rotated by **Saturn's IAU pole** into the
  plane of sky; the ring tilt (B, B', P) comes from a **published algorithm**
  (Meeus, *Astronomical Algorithms*, Ch. 45), implemented in our own code. Same
  posture as Earth's `lib/solar.ts`, Mars' Mars24, the Moon's Meeus theory, the
  ISS's SGP4 and the Jupiter Ch. 44 method.
- **Real textures.** Saturn and its rings are reused CC-BY textures (attribution
  required); the seven moon disks are genuine public-domain Cassini imagery (four
  already in the repo, three added this phase, all real, none illustrative).
- **Accuracy stated.** Kepler from mean elements ignores nodal and apsidal
  precession, so positions are good for the live configuration to a fraction of a
  Saturn radius over days to weeks, degrading over months to years; we say so and
  point at IMCCE PHESAT / JPL Horizons for critical cross-checks.

**These are real, observable events.** Saturnian satellite mutual events and
eclipses around each equinox are watched and timed by observers, and the IMCCE
runs its **PHESAT** campaigns precisely to predict them. The tab predicts genuine
phenomena from published methods, with the accuracy honestly bounded and the
seasonality honestly stated. It does not fake, and it does not overclaim.

## Two structural facts that shape everything

1. **The rings gate the events.** Because the regular moons orbit in the ring
   plane, the geometry of the rings and the geometry of the moon events are the
   **same geometry**. When the ring plane is edge-on to Earth (B near 0) and to
   the Sun (B' near 0), which is the equinox season, the moons cross the disk and
   their shadows land on it. When the rings are wide open (B and B' far from 0),
   the moons ride clear of the disk and the events stop. The Meeus Ch. 45 B and
   B' are therefore not just a ring-drawing detail; they are the **switch** that
   tells you whether events are possible at all. This is the single most
   instructive thing the tab teaches, and it is honest, computable geometry.
2. **The Sun's direction and Earth's direction are not the same.** A moon in
   front of Saturn (transit) is a fact about the **Earth-moon-Saturn** line; the
   moon's shadow on the clouds (shadow transit) is a fact about the
   **Sun-moon-Saturn** line. These differ by the **Sun-Saturn-Earth phase angle**,
   which for Saturn is small (at most about 6 degrees, less than Jupiter's,
   because Saturn is farther), so a moon and its shadow are only slightly offset
   on the disk. The same split governs occultation (Earth-line, behind the disk)
   versus eclipse (Sun-line, in Saturn's shadow).

## COMPUTED: the substance

### Apparent moon positions (Kepler + JPL mean elements + Saturn's pole)

For any instant, each moon's apparent position relative to Saturn is built in
code, in three steps:

- **Kepler two-body propagation** of the moon's **real JPL mean orbital elements**
  (from the JPL SSD "Planetary Satellite Mean Orbital Elements" table, referred to
  each moon's Laplace plane) advances it along its ellipse to the requested time.
- **Rotation by Saturn's IAU pole** (J2000 RA 40.589 deg, Dec 83.537 deg) carries
  the Saturn-centred vector from the Laplace plane onto the sky.
- **`lib/planets`** supplies Saturn's geocentric direction and distance, placing
  the moon on the plane of sky relative to Saturn's disk as seen from Earth.

This yields the **apparent layout of the seven moons strung around Saturn** and
the inputs to every event test below. The orbital periods that drive the motion
(approximately Mimas 0.94 d, Enceladus 1.37 d, Tethys 1.89 d, Dione 2.74 d, Rhea
4.52 d, Titan 15.95 d, Iapetus 79.3 d) are the real values from JPL SSD.

### The four phenomenon types and their geometry

Each is a clean condition on the computed coordinates, tested against Saturn's
**oblate** disk. Saturn is the most oblate planet, flattened by about 10 percent,
so the limb is a flattened ellipse, and the transit/occultation test uses that
ellipse, not a circle:

- **Transit** (moon across Saturn's disk): the moon passes **in front of**
  Saturn's disk as seen from Earth. Condition: the plane-of-sky offset is inside
  the oblate limb **and** the moon is on the near side (toward the observer).
- **Shadow transit** (moon's shadow on the clouds): the moon's **shadow**, cast by
  the Sun, falls on Saturn's cloud tops. Condition: the shadow, obtained by
  projecting the moon along the Sun-to-moon direction onto Saturn, lands inside
  the disk.
- **Occultation** (moon behind Saturn's disk): the moon passes **behind** Saturn's
  disk as seen from Earth and is hidden. Condition: projected onto the disk **and**
  on the far side (away from the observer).
- **Eclipse** (moon in Saturn's shadow): the moon passes into **Saturn's own
  shadow** and is no longer sunlit, so it darkens or vanishes even when it is not
  behind the disk. Condition: the moon lies within Saturn's shadow cone (a
  Sun-direction test, not an Earth-direction one).

The pairing is the physical heart of the tab: transit and occultation are
**Earth-line** events (who is in front of or behind the disk for the observer);
shadow transit and eclipse are **Sun-line** events (where the shadows fall). They
do not coincide in general, though for Saturn the small phase angle keeps a moon
and its shadow close together.

### Ring interactions

Because the rings sit between the moons and the observer (or the Sun) for part of
each orbit, two further flags are computed and shown honestly:

- **Occulted by the rings:** a moon can pass **behind the opened rings** as seen
  from Earth and be hidden or dimmed by them.
- **Ring shadow / eclipsed by the rings:** a moon can cross the **shadow the rings
  cast**, so it dims even when it is clear of Saturn's own shadow.

These are real geometric interactions, bounded to the same accuracy as the rest,
and they are strongest away from exact equinox (when the rings are opened enough
to cast a broad shadow band and to cover a swath of sky), which complements the
disk-transit season nicely.

### Why the events cluster at equinox (the seasonality, computed)

The ring tilt from **Meeus Ch. 45** makes the seasonality quantitative:

- **B** is how far the rings (and the moons' orbit plane) are opened **toward
  Earth**; **B'** is how far they are opened **toward the Sun**.
- Near **equinox**, both B and B' pass through **zero**: the ring plane is edge-on
  to Earth and to the Sun, so the moons cross the disk (transit, occultation) and
  their shadows land on it (shadow transit, eclipse). This is the mutual-event
  season the IMCCE PHESAT campaigns target.
- **Away from equinox**, B and B' grow (up to about 26 to 27 degrees at solstice,
  set by Saturn's obliquity), the moons ride above or below the disk, and disk
  transits and shadow transits do not occur.

So the same computed B and B' that orient the rings for rendering also tell the
user, honestly and visibly, whether a chosen date is inside or outside the event
season. Equinox recurs about every 15 years; the last was 2025-05-06.

### Saturn's sky position (observer visibility)

To tell a user whether an event is actually **watchable**, the tab computes
**Saturn's geocentric RA/Dec** (is Saturn above the horizon at their location and
time?) and its **small phase angle** (how far is a shadow offset from its moon?),
both via `lib/planets` (low-precision planetary theory, VSOP87 truncation / Meeus
planetary chapters), computed in code, no runtime API, cross-checked offline
against JPL Horizons. An event that occurs while Saturn is below the horizon or
lost in twilight is flagged as not observable from that location.

### The accuracy bound (load-bearing)

Kepler propagation from **mean** elements reproduces the live configuration but
**ignores nodal and apsidal precession** driven by Saturn's oblateness (its large
J2) and by Titan. So positions are good to **a fraction of a Saturn radius over
days to weeks**, degrading over **months to years**. This is not observing-grade
timing. **Iapetus is the least accurate** (large orbit, significantly tilted and
precessing Laplace plane). For critical timing, cross-check **IMCCE PHESAT** and
**JPL Horizons** (offline; never called at runtime). The UI must show the bound
and point there, and must not imply minute-level or second-level precision.

## REUSED / REAL

- **The moon textures are real spacecraft imagery.** All seven moon disks are
  genuine public-domain Cassini global mosaics: Mimas, Enceladus, Titan and
  Iapetus are already in the repo; Tethys, Dione and Rhea are added this phase.
  **These three are real Cassini imagery, not illustrative tinted spheres.**
  Titan's disk is a **near-IR (938 nm), haze-penetrating** product (its
  visible-light surface is hidden by haze), and must be labeled as such. Iapetus
  carries its real **two-tone** albedo (dark leading, bright trailing).
  Provenance and licenses: `SATURN_MOONS_DATA_SOURCES.md` §2, ultimately
  `MOONS_DATA_SOURCES.md` §1e-1i.
- **The Saturn and ring textures are real, but CC-BY and artist-tuned.** The
  Saturn cloud disk (`saturn.jpg`) and ring color strip (`saturn-rings.png`) are
  Solar System Scope **CC-BY 4.0** textures already in the repo. They carry a real
  **attribution obligation** ("Solar System Scope (solarsystemscope.com),
  CC-BY 4.0"), in-app and in the repo CREDITS/ASSETS file. The Saturn cloud
  texture is artist-tuned, not a raw observation, and is drawn as an unlit
  snapshot. Provenance: `PLANETS_DATA_SOURCES.md` §1d, §1f.
- **The ring radii are real, measured facts.** The rings are drawn **to scale**
  from occultation-derived boundary radii already sourced in the Planets phase
  (`saturn_rings.json`, `PLANETS_DATA_SOURCES.md` §3). The ring opening across the
  year (the B seasonality) is likewise a real, measured, computable geometry, not
  a rendering convenience.
- **The orbital periods and radii are real, measured facts** from JPL SSD (mean
  elements + physical parameters), not tuned for the animation.

## ILLUSTRATIVE / APPROXIMATE

Three rendering realities must be labeled honestly, or the picture is misleading:

- **Rendered moon sizes are almost certainly exaggerated for legibility.** Saturn
  is huge and the rings dominate the view, while the moons are tiny by comparison
  (even Titan is a small disk against Saturn, and Mimas or Enceladus is a speck).
  Drawn strictly to scale, a transiting moon would be a barely-visible dot and a
  shadow a pinprick. So the app renders the **positions and event timings to
  scale** (those are the physics), but the **moon and shadow markers are enlarged
  for visibility**. This must be stated: the *where* and *when* are honest; the
  on-screen *dot size* is a legibility choice, not the true angular size.
- **Event timing is bounded, not exact.** Times from the Kepler-from-mean-elements
  method are good for the live configuration to a fraction of a Saturn radius over
  days to weeks, degrading over months to years (Iapetus worst). For grazing
  events or photometry-grade timing, cross-check IMCCE PHESAT / JPL Horizons
  (offline). The UI must show the bound and must not imply second-level precision.
- **Saturn is drawn as an unlit snapshot from an artist-tuned texture.** The
  Saturn cloud map is a Solar System Scope CC-BY representation, not a raw
  observation, and it is rendered as a static, unlit disk. Label it
  illustrative-of-appearance, not "live." (Saturn's real zonal winds and north
  polar hexagon belong to the Planets phase, `PLANETS_PHYSICS.md`, and are not
  re-litigated here.)

Nothing else is approximated and nothing is invented. There is no fabricated
Saturn weather, no faked storm motion, and no live feed.

## Computed vs reused vs illustrative: the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Moon apparent positions (7 moons) | **Computed** | "Computed - Kepler from JPL mean elements + Saturn pole" |
| Ring tilt B / B' / P | **Computed** | "Computed - Meeus *Astronomical Algorithms* Ch. 45" |
| Transit / shadow transit / occultation / eclipse | **Computed** | "Computed event - only near Saturn equinox; times bounded" |
| Ring interactions (occulted by / shadowed by rings) | **Computed** | "Computed - moon vs ring geometry" |
| Event season (equinox gating) | **Computed** | "Computed - from ring opening B/B' (last equinox 2025-05-06)" |
| Saturn sky position + observer visibility | **Computed** | "Computed - planetary theory; cross-checked offline" |
| Saturn + ring disk textures | **Reused / real (CC-BY, static)** | "Solar System Scope, CC-BY 4.0 - artist-tuned, unlit snapshot" |
| Seven moon disk textures | **Reused / real (PD, static)** | "Cassini imagery (public domain); Titan = near-IR/haze" |
| Orbital periods, radii, ring radii | **Real (measured)** | "Measured - JPL SSD / ring occultation radii" |
| On-screen moon / shadow marker size | **Illustrative** | "Marker enlarged for visibility (real moons are tiny vs Saturn)" |
| Predicted times to the second | **Not claimed** | "Bounded accuracy - cross-check IMCCE PHESAT / JPL Horizons" |

Rules carried over from Earth / Mars / Moon / planets / moons / Jupiter's moons,
unchanged:

- Every quantity on screen names its category and source.
- No invented values; computed geometry is never presented as a live reading it is
  not, and the accuracy bound and the equinox seasonality are always shown.
- The only "static" content is the reused imagery; the only "illustrative" liberty
  is enlarging the moon/shadow markers, and that is labeled.

## What is honestly showable this phase (crisp statement)

- **COMPUTED (the substance):** the seven moons' apparent positions (Kepler from
  JPL mean elements, rotated by Saturn's pole, via `lib/planets`), the ring tilt
  B/B'/P (Meeus Ch. 45), the four phenomena (transit, shadow transit, occultation,
  eclipse) against Saturn's oblate disk, the ring interactions (occulted by or
  shadowed by the rings), the equinox gating of the events, and Saturn's sky
  position for observer visibility. All from published methods, no runtime API.
- **REUSED / REAL:** the Saturn cloud and ring textures (Solar System Scope,
  CC-BY 4.0, attributed) and the seven moon maps (public-domain Cassini, four
  present plus Tethys/Dione/Rhea added this phase, all real imagery); the real
  orbital periods and radii; the real occultation-derived ring radii; and the
  measured ring-opening seasonality.
- **ILLUSTRATIVE / APPROXIMATE:** on-screen moon and shadow markers are enlarged
  for legibility (real Saturn moons are tiny against the disk and rings); event
  timing is bounded (a fraction of a Saturn radius over days to weeks, degrading
  over months to years, Iapetus worst), with IMCCE PHESAT / JPL Horizons named for
  critical cross-checks; and Saturn is drawn as an unlit, artist-tuned snapshot.

What we deliberately do **not** do: fetch anything at runtime, invent Saturn
weather, claim events are available year-round (they are not, they cluster at
equinox), claim second-level timing, or draw the moons to a false angular size
without labeling it. This tab predicts **real, observable events** (the Saturnian
satellite mutual events and eclipses that the IMCCE PHESAT campaigns target),
computed from published methods, with the seasonality and the accuracy honestly
stated.
