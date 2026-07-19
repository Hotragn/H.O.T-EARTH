# Dwarf Moons (Pluto, Eris, Haumea and Makemake Satellites) Physics and Honest-Representation Methodology (Phase 17)

Companion to `docs/DWARF_MOONS_DATA_SOURCES.md`. Same non-negotiable bar as Earth,
Mars, the Moon, the planets, the major moons, Jupiter's moons, Saturn's moons, the
dwarf planets and the Other Moons tab (`physics-env-simulation` skill): **real
physics and real data, or it doesn't ship. No invented numbers.** This doc states
exactly what is **COMPUTED** (the substance of the tab), what is **REUSED / REAL**
(the two New Horizons textures plus measured orbital facts), and what is
**ILLUSTRATIVE / APPROXIMATE** (rendering choices, the illustrative-phase tier, and
the accuracy bound).

Verification date: **2026-07-19**. Bodies: **Charon, Styx, Nix, Kerberos, Hydra**
(Pluto); **Dysnomia** (Eris); **Hiiaka, Namaka** and the **ring** (Haumea); **MK2**
(Makemake). Ceres, the fifth IAU dwarf planet, **has no moons** and does not appear.
The bodies' surfaces and physical facts were covered in Phase 6
(`DWARF_PLANETS_PHYSICS.md`) and are not redone here. This phase is about their
**orbital geometry**: the binary, the resonant small-moon chain, and the single
measured moon of each of the three distant TNOs.

## The overriding honesty rule: lead with the Pluto-Charon binary

The single most striking real fact of this phase, and the one the tab must lead
with, is that **Pluto and Charon are a true binary whose barycenter sits in empty
space, outside Pluto.**

- Charon's mass is about **12.2%** of Pluto's (mass ratio q = 0.1218).
- The barycenter lies at about **q / (1 + q)** of the Pluto-Charon separation
  (about 19591 km) from Pluto's center, which is about **2128 km**.
- Pluto's radius is only **1188 km**.
- So the barycenter is **outside Pluto's body**, and **both Pluto and Charon orbit
  a point in empty space**. This is not a moon going around a planet; it is a
  binary. The tab renders it as one: Pluto tracing a small loop about the
  barycenter, Charon a larger loop, and the four small moons circling the same
  barycenter farther out. This fact leads the tab, exactly as the brief requires.

Around that headline sit two more honest lines:

- **This is an orbital-geometry view, unresolvable from Earth.** These systems are
  tiny and remote (Pluto's disk is about **0.1 arcsec** from Earth, the moons far
  fainter), so **nothing here is an Earth-observable transit, shadow, occultation
  or eclipse.** The tab shows real orbital geometry (relative sizes, shapes,
  periods, inclinations, the binary), not telescope-visible events, and never
  claims otherwise.
- **Two data tiers, never blurred.** **Pluto's system uses REAL positions**
  (Brozovic & Jacobson 2024 mean elements). **Eris, Haumea and Makemake use a REAL
  ORBIT but an ILLUSTRATIVE, adopted PHASE** (no full ephemeris exists), and
  **Makemake's MK2 is additionally poorly constrained**. The tab labels which is
  which, prominently.

**These are real orbits of real moons.** The tab computes genuine geometry from
published elements, with the accuracy honestly bounded, the two tiers honestly
separated, and the tiny-disk reality honestly stated. It does not fake, and it does
not overclaim.

## Three structural facts that shape everything

1. **Pluto-Charon is a binary (barycenter outside Pluto).** The headline above. It
   is the reason the Pluto view is drawn as two bodies about an empty point, not one
   about the other. Real, measured (Brozovic et al. 2015; Brozovic & Jacobson 2024).
2. **The systems are unresolvable from Earth, so this is an orbital-geometry view.**
   Pluto's roughly 0.1 arcsec disk, and far fainter moons, mean there is no
   Earth-observable event to predict. The honest headline is **what each orbit looks
   like**, not **when the next event is**. This is a stronger version of the same
   caveat the Other Moons tab carries (Phase 16), because here even the geometric
   event conditions are not meaningfully observable.
3. **Two tiers of truth.** Pluto's five moons are placed at their **real positions**
   from a post-New Horizons solution. The three TNO moons are placed on their **real
   orbits at an adopted (illustrative) phase**, because no full ephemeris is
   published for them. Keeping these apart, in the rendering and in the labels, is
   the central integrity requirement of the phase.

## COMPUTED: the substance

### Tier 1: Pluto system, REAL positions (Kepler + Brozovic & Jacobson 2024 + Pluto pole)

For any instant, each Pluto-system moon's position is built in code, in three steps:

- **Kepler two-body propagation** of the moon's **real cited mean orbital elements**
  from the JPL SSD "Planetary Satellite Mean Orbital Elements" Pluto set, the
  **post-New Horizons solution of Brozovic & Jacobson (2024), AJ 167:256**, epoch
  **J2000**, referred to **Pluto's equatorial frame**, advances Charon, Styx, Nix,
  Kerberos and Hydra along their ellipses to the requested time. The along-orbit
  registration is **real**, so these are genuine positions.
- **Rotation by Pluto's IAU pole** (RA 132.993 deg, Dec -6.163 deg, the IAU WGCCRE
  north-pole direction) carries each Pluto-centered vector from the equatorial frame
  onto the sky.
- **`lib/planets`** supplies Pluto's geocentric direction and distance, placing the
  system on the plane of sky as seen from Earth.

The **binary** falls straight out of the same elements: with q = 0.1218, the
barycenter is about 2128 km from Pluto's center (outside the 1188 km radius), so
Pluto and Charon are drawn orbiting that empty point. The four small moons
(**Styx, Nix, Kerberos, Hydra**) orbit the **barycenter**, not Pluto, in a chain of
**near mean-motion resonances** with Charon's 6.39 d period (approximate periods
from the same elements: Styx about 20.2 d, Nix about 24.9 d, Kerberos about 32.2 d,
Hydra about 38.2 d), on near-circular, nearly-coplanar orbits.

**Nix and Hydra are chaotic rotators.** Their spin is genuinely chaotic (measured,
Showalter & Hamilton 2015; Weaver et al. 2016), because the time-varying torque of
the binary acting on their elongated shapes prevents a settled spin state. **This is
shown as a stated measured fact, not a simulation:** the tab labels it and does not
animate a fabricated tumble.

### Tier 2: Eris, Haumea and Makemake moons, REAL ORBIT, ILLUSTRATIVE PHASE

For these three the orbit **size, shape, period and inclination are real and cited**,
so the relative geometry is honest, but **no full published ephemeris** gives the
moon's absolute position on a given date. So the tab animates each moon on its real
ellipse at its real period, with an **adopted convention for the phase and node**,
and **labels this as an illustrative phase, distinct from Pluto's real positions.**

- **Eris: Dysnomia (Holler et al. 2021).** a = 37273 km, P = 15.786 d, e = 0.006
  (essentially circular), i = 78.3 deg, tidally locked to Eris. Well-measured orbit;
  only the absolute phase/node is adopted.
- **Haumea: Hiiaka and Namaka (Ragozzine & Brown 2009, AJ 137).** Hiiaka (outer):
  a = 49880 km, P = 49.462 d, e = 0.051. Namaka (inner): a = 25657 km, P = 18.278 d,
  e = 0.249. The two orbits are **mutually inclined about 13 deg**, a real, unusual
  feature the tab shows. Phase/node adopted, orbit real.
- **Makemake: MK2 (Parker et al. 2016).** a about 22250 km, P about 18 d, e about 0.
  Same tier, **plus a poorly-constrained flag** (see below).

### The poorly-constrained MK2 orbit (its own caveat)

**Makemake's moon MK2 is the least trustworthy body in the tab.** It was seen in only
a few detections and is likely **near edge-on** to us, so its semimajor axis and
period are genuinely uncertain (an edge-on and a more face-on solution can both fit
the sparse data). MK2's orbit therefore carries **its own label, "poorly
constrained"**, distinct even from the other two illustrative-phase systems, and its
numbers must never be shown with false precision.

### Haumea's body and ring (real geometry, illustrative surface)

Haumea is drawn as its **real triaxial body** (about **1160 x 852 x 513 km**),
spinning in about **3.9 h**, encircled by its **real ring** at radius about
**2285 km** (Ortiz et al. 2017, Nature 550, the first ring found around a
trans-Neptunian object). The **shape and the ring are real, measured geometry** and
are rendered as such. Only the **body surface** is illustrative (Haumea has never
been imaged up close), tinted with no fabricated detail, exactly the split used in
Phase 6.

### Pluto's sky position and tiny apparent disk

To ground the tab, Pluto's **geocentric RA/Dec** and its **tiny apparent disk**
(about 0.1 arcsec) are computed via `lib/planets` (low-precision planetary theory,
VSOP87 truncation / Meeus), in code, no runtime API, cross-checked offline against
JPL Horizons. The tiny disk is the reason **nothing here is an Earth-observable
event**: there is no meaningful transit, shadow, occultation or eclipse to flag, so
the tab does not pretend to one.

### The accuracy bound (load-bearing), split by tier

- **Pluto tier (real positions):** Kepler propagation from the Brozovic & Jacobson
  (2024) mean elements reproduces the live configuration near the J2000 epoch. It
  **ignores nodal and apsidal precession** and higher-order perturbations, so
  accuracy **degrades away from epoch**. Good near epoch, not observing-grade
  timing; cross-check **JPL Horizons** (offline) for precise positions.
- **Eris / Haumea / Makemake tier (real orbit, illustrative phase):** the relative
  geometry is real; the **absolute phase and node are an adopted convention, not a
  measurement**, so a moon's position along its orbit is **illustrative and must not
  be read as where the moon really is** on a given date. **MK2 is additionally
  poorly constrained.**
- The UI must show the bound, name JPL Horizons for critical cross-checks, and **must
  not imply minute-level or second-level precision**, nor imply that the
  illustrative-phase moons are at real positions.

## REUSED / REAL

- **The Pluto and Charon textures are real spacecraft imagery.** The Pluto disk
  (`dwarf-planets/pluto.jpg`, 300,727 B) and the Charon disk (`dwarf-planets/charon.jpg`,
  254,426 B) are **public-domain New Horizons LORRI-MVIC global mosaics** (2015
  flyby). Pluto's heart (Tombaugh Regio / Sputnik Planitia) and Charon's dark reddish
  north polar cap (Mordor Macula) are **genuine features**. Two caveats carry over
  from Phase 6 and are mandatory: the **encounter hemisphere is hi-res, the far side
  low-res** (flyby geometry), and both maps are the **grayscale (panchromatic)
  LORRI-MVIC merge** (Pluto's reddish color is a separate PD product). Provenance:
  `DWARF_PLANETS_DATA_SOURCES.md` §1a/§1b. (`ceres.jpg`, 616,695 B, is also in the
  repo but **unused here, because Ceres has no moons**.)
- **The Pluto-Charon binary, the resonant small-moon chain, the orbit sizes, shapes,
  periods and inclinations, and Haumea's shape and ring are real, measured facts.**
  The binary barycenter (q = 0.1218, about 2128 km, outside Pluto's 1188 km radius),
  the near-resonant Styx/Nix/Kerberos/Hydra chain, Dysnomia's circular tidally-locked
  orbit, Hiiaka and Namaka's about-13-deg mutual inclination, Haumea's triaxial shape
  and its ring, and every cited period and radius come from the published solutions
  (Brozovic & Jacobson 2024; Holler 2021; Ragozzine & Brown 2009; Ortiz 2017; Parker
  2016), not tuned for the animation.

## ILLUSTRATIVE / APPROXIMATE

Several rendering realities must be labeled honestly, or the picture is misleading:

- **The Eris, Haumea and Makemake moon phases are illustrative (adopted), not real
  positions.** This is the central approximation of the phase. The orbit shape is
  real; **where the moon sits on that orbit is a convention**, labeled distinct from
  Pluto's real positions. **MK2's orbit is additionally poorly constrained.** Never
  present these as real along-orbit positions.
- **Rendered moon markers are enlarged for legibility.** The moons are tiny against
  their primaries (and the whole system is unresolvable from Earth). Drawn strictly
  to scale, a moon would be a sub-pixel speck. So the app renders the **orbit
  geometry to scale** (that is the physics) but the **moon markers enlarged for
  visibility**. State it: the *geometry* is honest; the on-screen *dot size* is a
  legibility choice, not a true angular size.
- **The small Pluto moons and the TNO moons are illustrative tinted spheres / markers.**
  Styx, Nix, Kerberos, Hydra (Nix and Hydra only partially imaged as irregular,
  elongated, chaotic rotators; Styx and Kerberos barely resolved), and Dysnomia,
  Hiiaka, Namaka and MK2 (never imaged up close) have **no surface map** and are drawn
  as clearly-labeled tinted spheres with no fake detail, exactly as the never-visited
  dwarf planets are handled (`DWARF_PLANETS_DATA_SOURCES.md` §1e). Their **positions
  are still computed** (real for the Pluto set, illustrative-phase for the TNO set);
  only their appearance is illustrative. **Nix and Hydra's chaotic rotation is a
  stated fact, not a simulated tumble.**
- **Haumea's body surface is illustrative, though its shape and ring are real.** The
  triaxial body and the ring are rendered as measured geometry; the surface is tinted,
  not imaged. Do not imply a real Haumea surface picture.
- **Pluto and Charon are drawn as unlit snapshots** from the grayscale New Horizons
  merge, with the encounter hemisphere hi-res and the far side low-res. Label both.
- **There are no event flags.** Unlike the Jupiter, Saturn and Other Moons tabs, this
  tab computes **no transit / shadow / occultation / eclipse flags**, because the
  systems are unresolvable from Earth and no such event is meaningfully observable.
  The tab is an orbital-geometry view only, and must say so rather than showing an
  empty or misleading events layer.

Nothing else is approximated and nothing is invented. There is no fabricated
surface, no faked event, and no live feed.

## Computed vs reused vs illustrative: the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Pluto-system moon positions (Charon, Styx, Nix, Kerberos, Hydra) | **Computed (real positions)** | "Computed - real positions (Brozovic & Jacobson 2024) + Pluto pole" |
| Pluto-Charon binary (barycenter outside Pluto) | **Computed / real (measured)** | "Real binary - barycenter about 2128 km from Pluto's center, outside the 1188 km radius" |
| Small-moon near-resonances (Styx/Nix/Kerberos/Hydra) | **Real (measured)** | "Measured - near mean-motion resonances about the barycenter" |
| Nix and Hydra chaotic rotation | **Real (measured), stated** | "Measured fact - chaotic rotator (not simulated)" |
| Eris / Haumea / Makemake moon orbits | **Computed (real orbit, illustrative phase)** | "Real orbit, illustrative phase (adopted) - not a real position" |
| Makemake MK2 orbit | **Computed, illustrative phase + poorly constrained** | "Poorly constrained orbit (near edge-on, few detections)" |
| Haumea triaxial shape + ring | **Real (measured) geometry** | "Measured - triaxial about 1160 x 852 x 513 km, ring about 2285 km (Ortiz 2017)" |
| Pluto sky position + tiny apparent disk | **Computed** | "Computed - planetary theory; disk about 0.1 arcsec, unresolvable" |
| Pluto disk texture | **Reused / real (PD, static)** | "New Horizons (2015); encounter hemisphere hi-res, far side low-res; grayscale merge" |
| Charon disk texture | **Reused / real (PD, static)** | "New Horizons (2015); Mordor Macula real; same coverage caveat" |
| Small Pluto moons + TNO moons appearance | **Illustrative** | "Illustration, not an observation (no map exists)" |
| Haumea body surface | **Illustrative** | "Surface illustrative; shape and ring are real" |
| On-screen moon marker size | **Illustrative** | "Marker enlarged for visibility (real moons/system are tiny)" |
| Orbital periods, radii | **Real (measured)** | "Measured - Brozovic & Jacobson 2024 / Holler 2021 / Ragozzine & Brown 2009 / Ortiz 2017 / Parker 2016" |
| Predicted times / positions to the second | **Not claimed** | "Bounded accuracy - cross-check JPL Horizons (illustrative-phase moons are not real positions)" |

Rules carried over from Earth / Mars / Moon / planets / moons / Jupiter's moons /
Saturn's moons / dwarf planets / Other Moons, unchanged:

- Every quantity on screen names its category and source, **and, for the moons, its
  tier** (Pluto = real position; Eris/Haumea/Makemake = real orbit, illustrative
  phase; MK2 = poorly constrained).
- No invented values; computed geometry is never presented as a live reading it is
  not, illustrative phase is never presented as a real position, and the tiny-disk
  reality is always shown.
- The only "static" content is the two reused New Horizons maps; the "illustrative"
  liberties are the adopted TNO-moon phase, the tinted small-moon / TNO-moon markers,
  Haumea's tinted surface, and the enlarged markers, and every one is labeled.

## What is honestly showable this phase (crisp statement)

- **COMPUTED (the substance):** the Pluto system's **real positions** (Charon, Styx,
  Nix, Kerberos, Hydra, from Brozovic & Jacobson 2024 elements oriented by Pluto's
  pole via `lib/planets`), the **Pluto-Charon binary** (barycenter outside Pluto), the
  small moons' near-resonant orbits about the barycenter, and the Eris/Haumea/Makemake
  moon orbits at their **real sizes/shapes/periods/inclinations** with an
  **illustrative adopted phase**. From published elements, no runtime API.
- **REUSED / REAL:** the Pluto and Charon New Horizons textures (public domain); the
  real orbital periods, radii and inclinations; the measured facts of the binary, the
  small-moon resonances, Nix and Hydra's chaotic rotation, Dysnomia's circular
  tidally-locked orbit, Hiiaka and Namaka's about-13-deg mutual inclination, and
  Haumea's triaxial shape and ring.
- **ILLUSTRATIVE / APPROXIMATE:** the Eris/Haumea/Makemake moon **phases** (adopted,
  not real positions; MK2 additionally poorly constrained); on-screen moon markers
  enlarged for legibility; the small Pluto moons, the TNO moons and Haumea's surface
  rendered as clearly-labeled tinted spheres / markers (no map exists); Pluto and
  Charon drawn as unlit grayscale snapshots with the flyby coverage caveat.

What we deliberately do **not** do: fetch anything at runtime, invent a moon surface
or a moon position, blur the two tiers, present MK2's orbit as precise, show a
transit / shadow / occultation / eclipse layer (these systems are unresolvable from
Earth, so no such event is observable), claim second-level timing, or draw the moons
to a false angular size without labeling it. This tab shows the **real orbital
geometry** of the four moon-bearing dwarf-planet systems, led by the genuinely
striking **Pluto-Charon binary** (a barycenter in empty space), with Pluto's real
positions and the three TNOs' real orbits at an honestly-labeled illustrative phase,
computed from published elements, with the two tiers and the tiny-disk reality
honestly stated.
