# Black Holes Physics and Honest-Representation Methodology (Phase 22)

Companion to `docs/BLACK_HOLES_DATA_SOURCES.md`. Same non-negotiable bar as Earth, Mars,
the Moon, the planets, the small bodies, the moons, the interstellar tabs, the Surfaces tab
and the Exoplanet Surfaces tab (`physics-env-simulation` skill): **real physics and real
data, or it doesn't ship. No invented numbers.** This doc states exactly what is
**COMPUTED** (the Schwarzschild radius, photon sphere, ISCO, shadow angular size, time
dilation, tidal stress, Hawking temperature and evaporation, Einstein radius and light
deflection), what is **REUSED / REAL** (the cited catalog measurements and the ESO Milky Way
panorama), and what is **ILLUSTRATIVE** (the gravitational-lensing render and its accretion
disk, plus the EHT images labeled as reconstructions rather than photos).

Verification date: **2026-07-21**. A first-person lensing view reads as a photograph unless
the labels say otherwise, so the honesty stakes are high, not low.

## The overriding honesty rule: the render is physics-based, not a photograph

The single most important honesty statement of this phase, and the one the tab must lead
with, is that **the main visual is a PHYSICALLY-BASED gravitational-lensing render, not a
photograph.** It uses real light-bending physics (the deflection of background light by a
black hole's gravity) but every pixel is drawn by our own code. It is inspired by the same
real physics Kip Thorne's team used to render Interstellar's Gargantua, but it is our own
original render, not a copy of any film frame and not an observation.

There ARE two real black-hole images in the world, and they ship on this tab, but they are
**not photographs either**: the EHT M87* image (2019) and Sgr A* image (2022) are
**radio-interferometric reconstructions from 2017 observing data**. Where they appear they
are labeled as reconstructions and credited to the EHT Collaboration under CC BY 4.0. The
render is not them, and they are not the render.

What IS genuinely real and computed is the **general-relativity physics**, from the measured
masses and distances in the cited catalog (`docs/BLACK_HOLES_DATA_SOURCES.md`, section 1):

- The **Schwarzschild radius, photon sphere and ISCO** (from the mass).
- The **shadow angular size** (from mass and distance), validated against the EHT.
- **Gravitational time dilation** near the horizon.
- **Tidal / spaghettification stress** and the real supermassive-gentle / stellar-lethal
  contrast.
- **Hawking temperature and evaporation time** (real theory, unobserved).
- The **Einstein radius and light-deflection angle**, validated against the 1.75 arcsec
  solar-limb GR test.

## Five structural honesty facts that shape everything

1. **The render is physics-based, not a photo.** Real deflection physics, our own original
   code, labeled a render. This is the rule above.
2. **The EHT images are reconstructions, not photos.** Radio interferometry from 2017 data,
   not optical photography; labeled as reconstructions, credited EHT Collaboration, CC BY 4.0.
3. **The accretion disk is illustrative.** The light-bending geometry is real; the disk's
   brightness, color and texture are our artistic choice, and the geometry is the simpler
   non-spinning Schwarzschild case, not a full Kerr ray-trace.
4. **The GR quantities are computed from real measured masses and distances.** They are real
   physics from cited numbers, not art direction, and the shadow formula and the deflection
   formula are validated against real measurements.
5. **Hawking radiation is real theory, unobserved.** For every astrophysical black hole the
   Hawking temperature is far below the cosmic microwave background, so these black holes are
   not evaporating now; the effect is never presented as measured.

## COMPUTED: the substance

All quantities computed by `lib/black-holes.ts`. Constants: G = 6.674e-11 m^3 kg^-1 s^-2,
c = 2.998e8 m/s, Msun = 1.989e30 kg, hbar = 1.055e-34 J s, k_B = 1.381e-23 J/K.

### Schwarzschild radius, photon sphere, ISCO

The event-horizon radius of a non-spinning black hole is **r_s = 2 G M / c^2**. The
**photon sphere** (where light can orbit) is **r_ph = 1.5 r_s**, and the **innermost stable
circular orbit** for the Schwarzschild case is **r_isco = 3 r_s** (the inner edge of a thin
accretion disk). For Sgr A* (4.297e6 Msun) r_s is about 1.27e10 m, about 0.085 AU. For a
stellar-mass black hole (a few tens of Msun) r_s is a few tens of km.

### Shadow angular size (validated)

The shadow of a Schwarzschild black hole has angular diameter
**2 * sqrt(27) * G M / (c^2 D)**, where D is the distance. This is validated against the EHT:

- **Sgr A* (4.297e6 Msun at 8277 pc):** the formula gives about **53 uas**, against the
  EHT-measured **51.8 uas**.
- **M87* (6.5e9 Msun at 16.4 Mpc):** the formula gives about **41 uas**, against the
  EHT-measured **42 uas** ring.

The small differences are the expected spin and emission-geometry effects the non-spinning
formula omits. They are noted, not hidden, and they are why the shadow size is labeled
"computed (Schwarzschild), validated against EHT" rather than "measured".

### Gravitational time dilation

For a static observer at radius r outside the horizon, the time-dilation factor is
**sqrt(1 - r_s / r)**: clocks there run slow as seen from far away, and the factor goes to
zero at the horizon (a distant observer sees infalling clocks freeze and redshift away). Real
Schwarzschild GR from the measured mass.

### Tidal stress and spaghettification (the counterintuitive real fact)

The tidal (differential) acceleration across a body of length L at radius r is about
**2 G M L / r^3**. Evaluated at the horizon (r = r_s = 2 G M / c^2) this scales as
**1 / M^2**: the tide at the horizon FALLS as the black hole gets more massive. The real,
counterintuitive consequence the tab surfaces:

- At the horizon of a **supermassive** black hole (Sgr A*, M87*, TON 618) the tides are
  **gentle**; an infalling person would not be torn apart at the horizon.
- At the horizon of a **stellar-mass** black hole (Cygnus X-1) the tides are **lethal**;
  spaghettification happens well outside the horizon.

Bigger black hole, gentler horizon tides. This is computed, not stated as folklore.

### Hawking temperature and evaporation (real theory, unobserved)

The Hawking temperature is **T_H = hbar c^3 / (8 pi G M k_B)** and the evaporation timescale
scales as **M^3**. This is correct theory and **entirely unobserved for astrophysical black
holes**: for any real black hole here T_H is a tiny fraction of a Kelvin, far below the 2.7 K
cosmic microwave background, so these black holes absorb more than they radiate and are not
evaporating now. Labeled real-theory, unobserved, everywhere it appears. Never presented as
a measured effect.

### Einstein radius and light deflection (validated)

The general-relativity light-deflection angle for impact parameter b is
**4 G M / (c^2 b)**, and the Einstein radius follows from the lensing geometry (source,
lens and observer distances). At the **solar limb** this deflection is the classic
**1.75 arcsec** prediction confirmed at the 1919 eclipse, and `lib/black-holes.ts`
reproduces that number as a validation check. The same physics is what the lensing render
applies to the background Milky Way panorama.

### The accuracy bound (load-bearing)

- **Radii, photon sphere, ISCO, time dilation:** exact Schwarzschild (non-spinning) GR from
  the measured mass; as precise as the cited mass, and no more.
- **Shadow angular size:** the Schwarzschild formula, validated to reproduce the EHT
  microarcsecond measurements within the spin/emission differences noted above.
- **Tidal stress:** exact Newtonian tidal scaling, enough to make the supermassive-gentle /
  stellar-lethal contrast honestly.
- **Hawking temperature / evaporation:** correct theory, unobserved for astrophysical black
  holes; never presented as a measured effect.
- **Light deflection:** exact weak-field GR, validated against the 1.75 arcsec solar-limb
  test.

## REUSED / REAL

- **The cited catalog measurements** (`docs/BLACK_HOLES_DATA_SOURCES.md`, section 1): Sgr A*
  (GRAVITY 2023: 4.297e6 Msun, 8277 pc; EHT 2022 shadow 51.8 uas), M87* (EHT 2019: 6.5e9
  Msun, 16.4 Mpc, 42 uas ring, spin about 0.9), Cygnus X-1 (about 21 Msun), Gaia BH1 (about
  9.6 Msun, about 1560 ly), GW150914 (36 + 29 to 62 Msun, about 3 Msun radiated), TON 618
  (about 4e10 Msun). Reused as measured facts from the primary literature, each cited.
- **The ESO Milky Way panorama** (`public/textures/night-sky/milkyway.jpg`, credited per the
  NIGHT_SKY docs), reused as the real background the lensing render bends.
- **The two EHT images** (`public/textures/black-holes/m87-eht.jpg`, `sgr-a-eht.jpg`), real
  radio-interferometric reconstructions from 2017 data, credited "EHT Collaboration" under
  CC BY 4.0 (license verified clean 2026-07-21, see the data-sources doc).

## ILLUSTRATIVE

Several elements are illustrative and must be labeled honestly, or the first-person view
becomes a lie:

- **The gravitational-lensing render.** The light-bending geometry is real deflection physics
  applied to the real Milky Way panorama, but every pixel is drawn by our own code; it is a
  render, not a photograph, and it uses the simpler non-spinning Schwarzschild geometry, not
  a full Kerr ray-trace.
- **The accretion disk in the render.** Its brightness, color and texture are our own
  artistic choice; only the light-bending geometry around it is real physics. It is inspired
  by the real physics behind Interstellar's Gargantua but is our own original render, not a
  film frame.
- **The EHT images, as objects.** They are real reconstructions, but they are labeled as
  radio interferometric reconstructions from 2017 data, NOT optical photographs, so no one
  mistakes them for a camera image.

Nothing else is approximated and nothing is invented. There is no fabricated measured value,
no render presented as a photo, no EHT image presented as an optical photograph, and no
Hawking radiation presented as observed.

## Computed vs reused vs illustrative: the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Schwarzschild radius / photon sphere / ISCO | **Computed (real)** | "Computed - Schwarzschild GR from measured mass (r_s = 2GM/c^2)" |
| Shadow angular size | **Computed (real), validated** | "Computed (Schwarzschild), validated against EHT - about 53 uas Sgr A*, about 41 uas M87*, vs measured 51.8 and 42 uas" |
| Gravitational time dilation | **Computed (real)** | "Computed - sqrt(1 - r_s/r); clocks freeze at the horizon" |
| Tidal / spaghettification | **Computed (real)** | "Computed - horizon tides gentle for supermassive, lethal for stellar-mass" |
| Hawking temperature / evaporation | **Computed (real theory, unobserved)** | "Real theory, UNOBSERVED - T_H far below the CMB; not evaporating now" |
| Einstein radius / light deflection | **Computed (real), validated** | "Computed - 4GM/(c^2 b); validated against the 1.75 arcsec solar-limb GR test" |
| Catalog masses / distances / shadow sizes | **Reused / real** | "Measured - cited primary literature (GRAVITY, EHT, LIGO, Gaia)" |
| ESO Milky Way panorama background | **Reused / real** | "Real ESO Milky Way panorama; credit per NIGHT_SKY docs" |
| EHT M87* / Sgr A* images | **Reused / real (reconstruction)** | "Radio interferometric reconstruction from 2017 data, NOT a photo - EHT Collaboration, CC BY 4.0" |
| Gravitational-lensing render | **Illustrative (physically-based)** | "Physically-based render, NOT a photo - real deflection physics, Schwarzschild geometry, our own original render" |
| Accretion disk appearance | **Illustrative** | "Illustrative - disk brightness/color/texture are our own; only the light-bending geometry is real" |

Rules carried over from Earth / Mars / Moon / planets / small bodies / moons / interstellar /
Surfaces / Exoplanet Surfaces, unchanged:

- Every quantity on screen names its category and source (computed, reused/real, or
  illustrative).
- No invented values; the render is labeled a physics-based render not a photo; the EHT
  images are labeled reconstructions not photos; Hawking radiation is labeled real theory,
  unobserved.
- The reused facts are the cited catalog measurements, the ESO Milky Way panorama and the
  two EHT reconstructions; the illustrative liberties are the lensing render and its
  accretion disk, and every one is labeled.

## What is honestly showable this phase (crisp statement)

- **COMPUTED (real):** Schwarzschild radius, photon sphere, ISCO, shadow angular size
  (validated against the EHT), gravitational time dilation, tidal / spaghettification stress
  (with the supermassive-gentle, stellar-lethal contrast), Hawking temperature and
  evaporation time (real theory, unobserved), Einstein radius and light deflection (validated
  against the 1.75 arcsec solar-limb test).
- **REUSED (real):** the cited catalog measurements (Sgr A*, M87*, Cygnus X-1, Gaia BH1,
  GW150914, TON 618), the ESO Milky Way panorama, and the two EHT reconstructions (CC BY 4.0,
  credit EHT Collaboration).
- **ILLUSTRATIVE (labeled):** the gravitational-lensing render and its accretion disk (real
  deflection physics, Schwarzschild geometry, our own original render).

What we deliberately do **not** do: present the lensing render as a photograph (it is a
physics-based render), present the EHT images as optical photographs (they are radio
reconstructions), present Hawking radiation as observed (it is unobserved theory), claim a
full Kerr spinning ray-trace (the render is non-spinning Schwarzschild), present the
accretion disk as an observation (it is illustrative), or invent any catalog number (every
mass, distance and shadow size is cited). This tab shows a **genuinely computed** set of
general-relativity quantities from real measured black holes, a **physics-based lensing
render** of light bending the real Milky Way panorama, and the two **real EHT
reconstructions** labeled and credited, with the computed / reused / illustrative split
stated on screen.
