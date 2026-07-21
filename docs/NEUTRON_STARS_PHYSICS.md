# Neutron Stars Physics and Honest-Representation Methodology (Phase 23)

Companion to `docs/NEUTRON_STARS_DATA_SOURCES.md`. Same non-negotiable bar as Earth, Mars,
the Moon, the planets, the small bodies, the moons, the interstellar tabs, the Surfaces
tabs and the Black Holes tab (`physics-env-simulation` skill): **real physics and real data,
or it doesn't ship. No invented numbers.** This doc states exactly what is **COMPUTED**
(density, surface gravity, escape velocity, compactness, gravitational redshift,
light-bending visible fraction, spin frequency and equatorial velocity, characteristic age,
spin-down luminosity, the magnetic-field ladder), what is **REUSED / REAL** (the cited
catalog measurements and the two real telescope images), and what is **ILLUSTRATIVE** (the
rotating-neutron-star render with its sweeping beam, and the synthesized pulse audio).

Verification date: **2026-07-21**. A rotating star with a sweeping beam reads as a
photograph and a click track reads as a recording unless the labels say otherwise, so the
honesty stakes are high, not low.

## The overriding honesty rule: the render is an illustration of the real lighthouse model

The single most important honesty statement of this phase, and the one the tab must lead
with, is that **the rotating neutron star with its sweeping beam is an ILLUSTRATIVE
DEPICTION of the real lighthouse model, not a photograph and not a resolved surface.** No
telescope has ever resolved a neutron star's surface: they are roughly 20 to 24 km across at
distances of hundreds to thousands of parsecs. The beam shape, the surface texture and the
colors are our own illustrative choice.

What IS real in that visual is the **pulse timing**. A pulsar is a rotating neutron star
with a magnetic dipole misaligned from its spin axis; the radio (and sometimes X-ray or
gamma) beams sweep like a lighthouse, and we see a pulse each time a beam crosses our line of
sight. Our render rotates the star and sweeps the beam at the pulsar's **real measured spin
period**, so the timing is genuine even though the appearance is illustrative.

The **pulse audio is synthesized in-browser** at that same real spin frequency: a click or
tone generated at the true rate (for example about 30 Hz for the Crab, 716 Hz for
J1748-2446ad). It is labeled as synthesized. It is **not** a raw telescope recording. If a
cleanly public-domain telescope recording is ever shipped (see the data-sources doc), it
would be credited separately; none ships this phase.

What is genuinely real and computed is the **stellar-structure physics**, from the measured
values in the cited catalog (`docs/NEUTRON_STARS_DATA_SOURCES.md`, section 1):

- **Density, surface gravity, escape velocity, compactness** (from mass and radius).
- **Gravitational redshift and light-bending visible-surface fraction** (from compactness).
- **Spin frequency and equatorial velocity** (from the period and radius).
- **Characteristic age and spin-down luminosity** (from the period and its derivative).
- **The magnetic-field ladder** (from the period and its derivative).

## Five structural honesty facts that shape everything

1. **The render is an illustration, not a photo or a resolved surface.** Real lighthouse
   geometry and real pulse timing; illustrative beam, texture and color. This is the rule
   above.
2. **The pulse audio is synthesized, not recorded.** Generated in-browser at the real spin
   frequency; labeled synthesized; not a telescope recording.
3. **The two telescope images are of the nebula and the jet, not the surface.** The Hubble
   Crab image and the Chandra Vela image are real, but neither resolves the neutron star as
   a surface; the star is a point within them.
4. **The structure quantities are computed from real measured values.** Real physics from
   cited numbers, not art direction; the canonical 1.4 Msun / 12 km model is assumed and
   flagged wherever mass and radius are not both measured.
5. **The Crab characteristic age is disclosed as an estimator, not a fact.** P / 2 Pdot gives
   about 1250 yr against the true about 970 yr; the gap is shown, not hidden.

## COMPUTED: the substance

All quantities computed by `lib/neutron-stars.ts`. Constants: G = 6.674e-11 m^3 kg^-1 s^-2,
c = 2.998e8 m/s, Msun = 1.989e30 kg. Canonical model where mass and radius are not both
measured: **M = 1.4 Msun, R = 12 km**, always flagged when used.

### Density (the sugar-cube fact)

Density is M / ((4/3) pi R^3). For the canonical model this is about **3.9e17 kg/m^3**, a
few times nuclear saturation density. One cubic centimeter holds about a **billion tonnes**,
roughly the mass of a mountain. This is a direct consequence of the measured masses and
radii, not a rhetorical flourish.

### Surface gravity, escape velocity, compactness

- **Surface gravity:** g = (G M / R^2) / sqrt(1 - r_s / R) with r_s = 2 G M / c^2. Canonical
  value about **1.3e12 m/s^2**, of order 1e11 times Earth's surface gravity.
- **Escape velocity:** v_esc = sqrt(2 G M / R) = sqrt(r_s / R) * c. Canonical value about
  **0.6 c**. Escaping the surface takes a large fraction of light speed.
- **Compactness:** r_s / R, canonical value about **0.34**. Neutron stars are the densest
  stable objects short of black holes (an event horizon forms near compactness 1).

### Gravitational redshift and light bending

- **Gravitational redshift:** z = 1 / sqrt(1 - r_s / R) - 1, canonical value about **0.24**.
  Light leaving the surface loses roughly a quarter of its energy climbing out. This is the
  same relativistic term NICER folds into its mass-and-radius fits.
- **Light-bending visible-surface fraction:** strong-field gravity bends surface light so a
  distant observer sees **more than one hemisphere**. For the canonical compactness the
  visible fraction is well above 0.5. This is why observed pulse profiles are broader and
  smoother than flat-space geometry would predict. Computed from the compactness.

### Spin frequency and equatorial velocity

Spin frequency is f = 1 / P (exact from the measured period). Equatorial velocity is
v_eq = 2 pi R f. For the fastest known pulsar J1748-2446ad (716 Hz) at the canonical 12 km
radius, v_eq is about **0.18 c**, so the equator moves at nearly a fifth of light speed. The
velocity uses the canonical radius and is flagged; the frequency does not.

### Characteristic age (with its honest caveat)

The characteristic age is tau = P / (2 Pdot). For the Crab this yields about **1250 yr**,
which slightly exceeds the true historical age of about **970 yr** set by the AD 1054
supernova. The discrepancy is real and expected: the estimator assumes pure magnetic-dipole
braking with a constant field and an initial spin far faster than the present one. The tab
shows both numbers and names the assumption, rather than presenting 1250 yr as the age.

### Spin-down luminosity

The rotational energy loss is E-dot = 4 pi^2 I Pdot / P^3 with the canonical moment of
inertia I about 1e38 kg m^2. For the Crab this is about **1e31 W**, and it matches the power
needed to keep the surrounding Crab Nebula glowing, a real physical cross-check.

### Magnetic-field ladder

The characteristic surface dipole field is B about **3.2e19 sqrt(P Pdot) gauss** (P in
seconds). This ladder spans ordinary pulsars (about 1e8 T / 1e12 G) up to magnetars such as
SGR 1806-20 (about 1e11 T / 1e15 G), whose 2004 giant flare briefly affected Earth's
ionosphere from about 50,000 ly away. Computed from the measured P and Pdot; a characteristic
value, not a directly imaged field.

### The accuracy bound (load-bearing)

- **Density, surface gravity, escape velocity, compactness, redshift, light-bending
  fraction:** exact from mass and radius; measured NICER values for J0740+6620, canonical
  1.4 Msun / 12 km assumed and flagged elsewhere.
- **Spin frequency:** exact from the measured period. **Equatorial velocity:** uses the
  canonical radius, flagged.
- **Characteristic age and spin-down luminosity:** standard magnetic-dipole estimators from
  measured P and Pdot with the canonical moment of inertia; the Crab age gap is disclosed.
- **Magnetic-field ladder:** the standard characteristic-dipole formula; a characteristic,
  not imaged, field.

## REUSED / REAL

- **The cited catalog measurements** (`docs/NEUTRON_STARS_DATA_SOURCES.md`, section 1):
  PSR B1919+21 (first pulsar, about 1.337 s), Crab B0531+21 (about 33.5 ms, SN 1054), Vela
  B0833-45 (about 89.3 ms, about 290 pc), J0740+6620 (about 2.08 Msun, NICER radius about
  12.4 km), B1257+12 (first exoplanets), J0737-3039 (double pulsar), J1748-2446ad (716 Hz),
  SGR 1806-20 (magnetar, about 1e15 G). Reused as measured facts from the ATNF Pulsar
  Catalogue and the discovery papers, each cited.
- **The Hubble Crab Nebula image** (`public/textures/neutron-stars/crab-nebula.jpg`), a real
  optical telescope image, ESA/Hubble heic0515a, credited "NASA, ESA and Allison Loll /
  Jeff Hester (Arizona State University)" under CC BY 4.0.
- **The Chandra Vela pulsar image** (`public/textures/neutron-stars/vela-pulsar.jpg`), a real
  X-ray telescope image of the pulsar and its jet, NASA public domain, credited
  "NASA/CXC/Univ of Toronto/M. Durant et al."

## ILLUSTRATIVE

Several elements are illustrative and must be labeled honestly, or the visual becomes a lie:

- **The rotating neutron-star render with its sweeping beam.** The lighthouse geometry (a
  spin axis with a misaligned magnetic dipole whose beams sweep past the line of sight) and
  the **pulse timing** (the star rotates at the real measured period) are real. The beam
  shape, surface texture and colors are our own illustrative choice. It is a render, not a
  photograph, and not a resolved surface (no telescope can resolve one).
- **The synthesized pulse audio.** A click or tone generated in-browser at the pulsar's real
  spin frequency. The rate is real; the waveform is synthesized. It is labeled synthesized
  and is not a telescope recording.
- **Any neutron-star surface close-up.** Our own illustrative render, or, only if a clearly
  NASA-public-domain one is ever added, an artist concept labeled "artist's concept". The two
  shipped telescope images are of the nebula and the jet, not the surface.

Nothing else is approximated and nothing is invented. There is no fabricated measured value,
no render presented as a photo or a resolved surface, no synthesized audio presented as a
recording, and no telescope image presented as a neutron-star surface.

## Computed vs reused vs illustrative: the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Density | **Computed (real)** | "Computed - M / ((4/3) pi R^3); about 3.9e17 kg/m^3, a sugar-cube about a billion tonnes (canonical 1.4 Msun / 12 km where noted)" |
| Surface gravity / escape velocity / compactness | **Computed (real)** | "Computed from mass and radius; canonical model flagged where mass/radius not measured" |
| Gravitational redshift | **Computed (real)** | "Computed - z = 1/sqrt(1 - r_s/R) - 1; about 0.24 canonical" |
| Light-bending visible fraction | **Computed (real)** | "Computed from compactness; more than one hemisphere visible" |
| Spin frequency | **Computed (real)** | "Computed - f = 1/P; exact from the measured period" |
| Equatorial velocity | **Computed (real), canonical radius** | "Computed - 2 pi R f; about 0.18 c for J1748-2446ad (canonical 12 km radius)" |
| Characteristic age | **Computed (real), estimator** | "Computed - P / 2 Pdot; Crab about 1250 yr vs true about 970 yr (SN 1054), estimator assumption disclosed" |
| Spin-down luminosity | **Computed (real)** | "Computed - 4 pi^2 I Pdot / P^3; Crab about 1e31 W matches the nebula" |
| Magnetic-field ladder | **Computed (real)** | "Computed - 3.2e19 sqrt(P Pdot) G; ordinary pulsars to magnetars" |
| Catalog periods / masses / distances / fields | **Reused / real** | "Measured - ATNF Pulsar Catalogue and cited discovery papers" |
| Crab Nebula image | **Reused / real** | "Real Hubble optical image of the nebula, NOT a resolved NS surface - NASA, ESA, Loll / Hester (ASU), CC BY 4.0" |
| Vela pulsar image | **Reused / real** | "Real Chandra X-ray image of the pulsar and jet, NOT a resolved surface - NASA/CXC/Univ of Toronto/M. Durant et al., public domain" |
| Rotating star + beam render | **Illustrative** | "Illustrative depiction of the real lighthouse model, NOT a photo - real pulse timing, illustrative beam and surface" |
| Pulse audio | **Illustrative (synthesized)** | "Synthesized in-browser at the real spin frequency, NOT a telescope recording" |

Rules carried over from Earth / Mars / Moon / planets / small bodies / moons / interstellar /
Surfaces / Exoplanet Surfaces / Black Holes, unchanged:

- Every quantity on screen names its category and source (computed, reused/real, or
  illustrative).
- No invented values; the render is labeled an illustration of the lighthouse model not a
  photo; the audio is labeled synthesized not recorded; the telescope images are labeled as
  nebula/jet images not surfaces; the canonical model is flagged wherever it is assumed.
- The reused facts are the cited catalog measurements and the two real telescope images; the
  illustrative liberties are the rotating-star render and the synthesized audio, and every
  one is labeled.

## What is honestly showable this phase (crisp statement)

- **COMPUTED (real):** density, surface gravity, escape velocity, compactness, gravitational
  redshift, light-bending visible fraction, spin frequency and equatorial velocity,
  characteristic age (with the Crab estimator caveat), spin-down luminosity, and the
  magnetic-field ladder, all from the cited measured values, with the canonical 1.4 Msun /
  12 km model flagged wherever mass and radius are not both measured.
- **REUSED (real):** the cited catalog measurements (B1919+21, Crab, Vela, J0740+6620,
  B1257+12, J0737-3039, J1748-2446ad, SGR 1806-20), the Hubble Crab Nebula image (CC BY 4.0)
  and the Chandra Vela image (NASA public domain).
- **ILLUSTRATIVE (labeled):** the rotating-neutron-star render with its sweeping beam (real
  lighthouse geometry and real pulse timing, illustrative beam and surface) and the pulse
  audio (synthesized in-browser at the real spin frequency).

What we deliberately do **not** do: present the render as a photograph or a resolved surface
(no telescope can resolve one), present the synthesized audio as a telescope recording,
present the Crab or Vela telescope images as neutron-star surfaces, use the canonical model
without flagging it, present the Crab characteristic age as its true age, or invent any
catalog number (every period, mass, distance and field is cited). This tab shows a
**genuinely computed** set of stellar-structure quantities from real measured neutron stars,
an **illustrative render** of the real lighthouse model at the real pulse timing, **audio
synthesized** at the real spin frequency, and two **real telescope images** (the Hubble Crab
Nebula and the Chandra Vela pulsar) labeled and credited, with the computed / reused /
illustrative split stated on screen.
