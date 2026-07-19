# Jupiter's Moons (Galilean Transits) Physics & Honest-Representation Methodology (Phase 14)

Companion to `docs/JUPITER_MOONS_DATA_SOURCES.md`. Same non-negotiable bar as
Earth, Mars, the Moon, the planets and the major moons (`physics-env-simulation`
skill): **real physics and real data, or it doesn't ship. No invented numbers.**
This doc states exactly what is **COMPUTED** (the substance of the tab), what is
**REUSED / REAL** (spacecraft imagery and measured orbital facts), and what is
**ILLUSTRATIVE / APPROXIMATE** (rendering choices and the accuracy bound).

Verification date: **2026-07-18**. Bodies: **Io, Europa, Ganymede, Callisto**
(the four Galilean satellites of Jupiter). Earth's Moon is Phase 3; the Galileans'
surfaces, oceans and volcanism are Phase 5 (`MOONS_PHYSICS.md`) and are not
redone here. This phase is about their **mutual events with Jupiter as seen from
Earth**: transits, shadow transits, occultations and eclipses.

## The overriding honesty rule for this phase

Unlike most of the solar-system phases, this one has **no external dataset to
fetch and no measured-vs-modeled tension over the data**, because the substance
is a **computation**. The honest story is three lines:

- **Real physics, computed.** The moons' apparent positions relative to Jupiter,
  and every event that follows, come from a **published, peer-reviewed algorithm**
  (Meeus, *Astronomical Algorithms*, Ch. 44), implemented in our own code. Same
  posture as Earth's `lib/solar.ts`, Mars' Mars24, the Moon's Meeus theory and
  the ISS's SGP4.
- **Real textures, reused.** The Jupiter and Galilean-moon disks are genuine
  public-domain spacecraft imagery already in the repo (no new download).
- **Accuracy stated.** The implemented method is good to about a tenth of a
  Jupiter radius and event times to a few minutes; we say so and point at JPL
  Horizons / IMCCE for critical cross-checks.

**These are real, observable events.** A Galilean shadow transit is a sharp black
dot crossing Jupiter's cloud tops, watched by amateur astronomers in small
telescopes; eclipses and occultations of the moons are visible in binoculars.
The tab predicts genuine phenomena from a published algorithm, with the accuracy
honestly bounded. It does not fake, and it does not overclaim.

## Two structural facts that shape everything

1. **We compute apparent positions, not just orbits.** What matters for an event
   is where each moon appears **relative to Jupiter's disk as seen from Earth**,
   a projection that depends on Jupiter's and Earth's heliocentric positions and
   on the moon's orbit. Meeus Ch. 44 delivers exactly this: apparent rectangular
   coordinates X, Y, Z of each satellite relative to Jupiter's center, in units
   of Jupiter's equatorial radius. X and Y are the plane-of-sky offsets; Z is
   depth (toward or away from the observer). Every phenomenon is a condition on
   these coordinates.
2. **The Sun's direction and Earth's direction are not the same.** A moon in
   front of Jupiter (transit) is a fact about the **Earth-moon-Jupiter** line; the
   moon's shadow on the clouds (shadow transit) is a fact about the
   **Sun-moon-Jupiter** line. These two directions differ by the
   **Sun-Jupiter-Earth phase angle**, which is why a moon and its shadow are
   offset on the disk except near opposition. This single geometric fact is the
   most important thing the tab teaches.

## COMPUTED: the substance

### Apparent satellite positions (Meeus Ch. 44)

For any instant, the four satellites' apparent X/Y/Z relative to Jupiter are
computed from the Meeus Ch. 44 formulae (low-accuracy method; the high-accuracy
method adds perturbations). This yields:

- the **string-of-pearls** apparent layout of the four moons along Jupiter's
  equatorial plane (the classic view Galileo drew in 1610), and
- the inputs to every event test below.

The orbital periods that drive the motion (Io ~1.769 d, Europa ~3.551 d,
Ganymede ~7.155 d, Callisto ~16.69 d) are the real values already sourced in
`public/data/moons/constants.json` (Phase 5, JPL SSD).

### The four phenomenon types and their geometry

All four are standard almanac phenomena of the Galilean satellites, each a clean
condition on the computed coordinates:

- **Transit** (moon across Jupiter's disk): the moon passes **in front of**
  Jupiter's disk as seen from Earth. Condition: the moon is projected onto the
  disk (its plane-of-sky offset is inside Jupiter's apparent limb, accounting for
  Jupiter's oblateness) **and** it is on the near side (Z toward the observer).
  The moon can be hard to see against the bright cloud tops.
- **Shadow transit** (moon's shadow on the clouds): the moon's **shadow**, cast
  by the Sun, falls on Jupiter's cloud tops. Condition: the shadow, obtained by
  projecting the moon's position **along the Sun-to-moon direction** onto
  Jupiter, lands inside the disk. This is the crisp black dot amateurs watch; it
  is often more obvious than the moon itself.
- **Occultation** (moon behind Jupiter's disk): the moon passes **behind**
  Jupiter's disk as seen from Earth and is hidden by the planet. Condition:
  projected onto the disk **and** on the far side (Z away from the observer).
- **Eclipse** (moon in Jupiter's shadow): the moon passes into **Jupiter's own
  shadow** and is no longer sunlit, so it darkens or vanishes even when it is
  **not** behind the disk. Condition: the moon lies within Jupiter's shadow cone
  (again a Sun-direction test, not an Earth-direction one). Historically these
  eclipses gave the first measurement of the speed of light (Romer, 1676) and the
  first practical way to find longitude at sea.

The pairing is worth stating because it is the physical heart of the tab: transit
and occultation are **Earth-line** events (who is in front of / behind the disk
for the observer); shadow transit and eclipse are **Sun-line** events (where the
shadows fall). That is why they do not coincide in general.

### Why shadow transits and transits separate near quadrature and coincide near opposition

The offset between a moon (Earth-line) and its shadow (Sun-line) on Jupiter's
disk is set by the **Sun-Jupiter-Earth phase angle**:

- **Near opposition** (Jupiter opposite the Sun in Earth's sky), the phase angle
  is near **zero**: Earth is almost directly between the Sun and Jupiter, so the
  Sun's direction and Earth's line of sight nearly coincide. The moon and its
  shadow appear **nearly superimposed** on the disk. A transit and its shadow
  transit begin and end at almost the same times.
- **Near quadrature** (Jupiter about 90 deg from the Sun in the sky), the phase
  angle is at its **maximum, up to about 12 deg** for Jupiter. Now the Sun's
  direction and Earth's line of sight differ appreciably, so the shadow is thrown
  **off to one side** of the moon on the disk. The shadow leads or trails the
  moon (leads before opposition, trails after), and the shadow transit and the
  transit are **separated in time**, by up to a couple of hours for the inner
  moons. Whether the shadow precedes or follows the moon flips across opposition.

This is real, computable geometry, and it is the single most instructive thing
the tab shows: the same physics that gives Earth its terminator gives Jupiter a
displaced satellite shadow.

### Jupiter's sky position (observer visibility)

To tell a user whether an event is actually **watchable**, the tab computes
**Jupiter's geocentric RA/Dec** (is Jupiter above the horizon at their location
and time?) and its **elongation from the Sun / phase angle** (is Jupiter a
morning or evening object, and how far is the shadow offset?). Both come from
low-precision planetary theory (VSOP87 truncation / Meeus planetary chapters),
computed in code, no runtime API, cross-checked offline against JPL Horizons. An
event that occurs while Jupiter is below the horizon or lost in twilight is
flagged as not observable from that location.

## REUSED / REAL

- **The textures are real spacecraft imagery.** Jupiter's disk is the NASA
  Cassini "Best Map of Jupiter" (PIA07782, public domain), a genuine cloud-top
  image (labeled a snapshot; the belts drift). The four moon disks are the USGS
  Astrogeology Galileo/Voyager public-domain mosaics (Io and Ganymede color;
  Europa and Callisto grayscale). All five are already in the repo and are
  reused, not re-downloaded. Provenance and licenses:
  `JUPITER_MOONS_DATA_SOURCES.md` §2, ultimately `PLANETS_DATA_SOURCES.md` §1c
  and `MOONS_DATA_SOURCES.md` §1a-1d.
- **The orbital periods and the Laplace resonance are real, measured facts.** Io,
  Europa and Ganymede are in the **1:2:4 Laplace mean-motion resonance** (periods
  ~1.769 : 3.551 : 7.155 d): every time Ganymede orbits once, Europa orbits twice
  and Io four times. This is not a rendering convenience; it is measured
  celestial mechanics (sourced in `MOONS_DATA_SOURCES.md` §3), and it is why the
  three inner moons' events recur in a repeating pattern. Callisto sits outside
  the resonance. The resonance can be shown honestly as the real cadence behind
  the events.

## ILLUSTRATIVE / APPROXIMATE

Two rendering realities must be labeled honestly, or the picture is misleading:

- **Rendered disk and moon sizes are schematic, and the moon disks are almost
  certainly exaggerated for visibility.** At the eyepiece the geometry is
  extreme: Jupiter's disk is roughly **30 to 50 arcsec** across (about 40 arcsec
  near a good opposition), while each Galilean moon is only about **1 to 1.7
  arcsec** across, i.e. a few percent of Jupiter's diameter. Drawn strictly to
  that scale, a transiting moon is a barely-resolvable speck and a shadow is a
  pinprick. So the app renders the **positions and event timings to scale**
  (those are the physics), but the **moon and shadow markers are enlarged for
  visibility**. This must be stated: the *where* and *when* are honest; the
  on-screen *dot size* is a legibility choice, not the true angular size.
- **The accuracy bound is a few minutes, not seconds.** Event times from the
  implemented Meeus low-accuracy method are good to **a few minutes** (positions
  to ~0.1 Jupiter radius); the high-accuracy method and the full E5 /
  Sampson-Lieske theory do better. For casual observing this is plenty; for
  grazing events or photometry-grade timing, **cross-check JPL Horizons or the
  IMCCE** (offline; never called at runtime). The UI must show the few-minute
  bound and point there, and must not imply second-level precision.

Nothing else is approximated and nothing is invented. There is no fabricated
Jupiter weather, no faked storm motion, and no live feed. The Great Red Spot and
zonal winds belong to the planets phase (`PLANETS_PHYSICS.md`) and are not
re-litigated here; this tab is about the satellite events.

## Computed vs reused vs illustrative: the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Galilean apparent positions (X/Y/Z vs Jupiter) | **Computed** | "Computed - Meeus *Astronomical Algorithms* Ch. 44" |
| Transit / shadow transit / occultation / eclipse events | **Computed** | "Computed event - times good to a few minutes" |
| Moon-vs-shadow offset (phase-angle effect) | **Computed** | "Computed - from Sun-Jupiter-Earth phase angle" |
| Jupiter sky position + observer visibility | **Computed** | "Computed - planetary theory; cross-checked offline" |
| Jupiter + moon disk textures | **Reused / real (static)** | "[Mission] imagery (public domain) - snapshot" |
| Orbital periods, 1:2:4 Laplace resonance | **Real (measured)** | "Measured - JPL SSD; 1:2:4 resonance" |
| On-screen moon / shadow marker size | **Illustrative** | "Marker enlarged for visibility (real moons ~1 arcsec)" |
| Predicted times to the second | **Not claimed** | "Few-minute accuracy - cross-check JPL Horizons / IMCCE" |

Rules carried over from Earth / Mars / Moon / planets / moons, unchanged:

- Every quantity on screen names its category and source.
- No invented values; computed geometry is never presented as a live reading it
  is not, and the accuracy bound is always shown.
- The only "static" content is the reused public-domain imagery; the only
  "illustrative" liberty is enlarging the moon/shadow markers, and that is
  labeled.

## What is honestly showable this phase (crisp statement)

- **COMPUTED (the substance):** the four Galilean satellites' apparent positions
  relative to Jupiter (Meeus Ch. 44), and from them the four phenomenon types -
  **transit** (moon in front of the disk), **shadow transit** (moon's shadow on
  the cloud tops), **occultation** (moon behind the disk), **eclipse** (moon in
  Jupiter's shadow) - plus the phase-angle geometry that separates shadow from
  moon near quadrature and merges them near opposition, plus Jupiter's sky
  position for observer visibility. All from a published algorithm, no runtime
  API.
- **REUSED / REAL:** genuine public-domain spacecraft textures (Jupiter Cassini
  snapshot; Io/Ganymede color and Europa/Callisto grayscale USGS mosaics),
  already in the repo; and the real orbital periods and 1:2:4 Laplace resonance.
- **ILLUSTRATIVE / APPROXIMATE:** on-screen moon and shadow markers are enlarged
  for legibility (real Galilean moons are ~1 arcsec against Jupiter's ~40 arcsec),
  and event times are good to a few minutes, not seconds, with JPL Horizons /
  IMCCE named for critical cross-checks.

What we deliberately do **not** do: fetch anything at runtime, invent Jupiter
weather, claim second-level timing, or draw the moons to a false angular size
without labeling it. This tab predicts **real, observable events** that amateur
astronomers genuinely watch - Galilean shadow transits in a small telescope -
computed from a published algorithm, with the accuracy honestly bounded.
