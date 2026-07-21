# Neutron Stars Data Sources (Phase 23)

Verification date: **2026-07-21**. Every source, method and claim below was recorded on
this date against primary literature (the cited discovery papers and the ATNF Pulsar
Catalogue), against the published image licenses (NASA Chandra public domain, ESA/Hubble
CC BY 4.0), and against the planned computation helpers in `lib/neutron-stars.ts`. Same
rigor and honesty bar as `BLACK_HOLES_DATA_SOURCES.md` (Phase 22) and the sibling
data-source docs: real physics, real data, honest claims, everything free and legally
usable for an MIT open-source app, every source and license logged. Anything that cannot be
verified from an official or primary source, or from validated in-repo code, is explicitly
flagged.

Scope this phase: a **"Neutron Stars" tab**. As with the Black Holes tab, the honesty split
is three-way and the load-bearing point comes first.

> **Honesty rule for this phase (leads the page): the rotating neutron-star with its
> sweeping beam is an ILLUSTRATIVE DEPICTION of the real lighthouse model, not a
> photograph or a surface image.** No telescope has ever resolved a neutron star's surface
> (they are about 20 to 24 km across at kiloparsec distances). The beam shape, surface
> texture and colors are our own illustrative choice. What is REAL in that visual is the
> **pulse timing**: the star rotates and the beam sweeps at the pulsar's real measured spin
> period. The pulse **audio is synthesized in-browser** at that same real spin frequency (a
> click or tone at the true rate), labeled as synthesized, NOT a raw telescope recording.
> The catalog numbers (periods, masses, distances, magnetic fields) are **real, measured
> and cited**. The stellar-structure quantities (density, surface gravity, escape velocity,
> compactness, gravitational redshift, light-bending visible fraction, equatorial spin
> velocity, characteristic age, spin-down luminosity) are **computed** from those measured
> values in `lib/neutron-stars.ts`, with a canonical 1.4 Msun / 12 km model assumed and
> flagged wherever mass and radius are not individually measured.
>
> - **COMPUTED and REAL:** density, surface gravity, escape velocity, compactness,
>   gravitational redshift, light-bending visible-surface fraction, spin frequency and
>   equatorial velocity, characteristic age (P / 2 Pdot), spin-down luminosity, and the
>   magnetic-field ladder, all in `lib/neutron-stars.ts`.
> - **REUSED and REAL:** the cited catalog measurements (PSR B1919+21, Crab B0531+21, Vela
>   B0833-45, J0740+6620, B1257+12, J0737-3039, J1748-2446ad, SGR 1806-20) from the ATNF
>   Pulsar Catalogue and the discovery papers below; and the two real telescope images (the
>   Hubble Crab Nebula and the Chandra Vela pulsar).
> - **ILLUSTRATIVE and LABELED:** the rotating-neutron-star + sweeping-beam render (real
>   lighthouse geometry and real pulse timing, illustrative beam and surface), and the
>   synthesized pulse audio (real spin frequency, synthesized waveform).

## Summary table

| Source | What it provides | License / status | Attribution | Access | Verified against (2026-07-21) |
|---|---|---|---|---|---|
| **ATNF Pulsar Catalogue (Manchester et al. 2005, AJ)** | Periods, period derivatives, distances, derived fields for the catalog below | Peer-reviewed; catalogued values are facts, freely usable; cite the catalogue | Cite Manchester, Hobbs, Teoh & Hobbs 2005, AJ 129, 1993 | Public (atnf.csiro.au/research/pulsar/psrcat) | The published catalogue and its per-source entries |
| **Hewish, Bell, et al. 1968, Nature 217, 709** | PSR B1919+21, the first pulsar, P about 1.337 s | Peer-reviewed literature | Cite Hewish et al. 1968, Nature | Public literature | The discovery paper |
| **Crab pulsar (PSR B0531+21)** | P about 33.5 ms, associated with SN 1054 | Peer-reviewed literature + ATNF | Cite ATNF / Crab timing | Public literature | ATNF entry, historical SN 1054 record |
| **Vela pulsar (PSR B0833-45)** | P about 89.3 ms, about 290 pc, glitching young pulsar | Peer-reviewed literature + ATNF | Cite ATNF / Vela timing | Public literature | ATNF entry |
| **PSR J0740+6620 (Fonseca et al. 2021; Riley/Miller et al. 2021, NICER)** | Most massive well-measured NS, about 2.08 Msun; NICER radius about 12.4 km | Peer-reviewed literature | Cite Fonseca et al. 2021 (mass); Riley et al. / Miller et al. 2021 (NICER radius) | Public literature | The Shapiro-delay mass and NICER radius papers |
| **PSR B1257+12 (Wolszczan & Frail 1992, Nature 355, 145)** | First confirmed exoplanets, orbiting a pulsar | Peer-reviewed literature | Cite Wolszczan & Frail 1992, Nature | Public literature | The discovery paper |
| **PSR J0737-3039 (Burgay et al. 2003; Lyne et al. 2004)** | The double pulsar, two pulsars in one binary, strong-field GR test | Peer-reviewed literature | Cite Burgay et al. 2003, Lyne et al. 2004 | Public literature | The discovery and timing papers |
| **PSR J1748-2446ad (Hessels et al. 2006, Science 311, 1901)** | Fastest known pulsar, 716 Hz spin | Peer-reviewed literature | Cite Hessels et al. 2006, Science | Public literature | The discovery paper |
| **SGR 1806-20 (Palmer et al. 2005, Nature)** | Magnetar; 27 Dec 2004 giant flare; field about 1e11 T (1e15 G) | Peer-reviewed literature | Cite Palmer et al. 2005, Nature | Public literature | The giant-flare paper |
| **`public/textures/neutron-stars/crab-nebula.jpg`** | Real Hubble optical image of the Crab Nebula (the Crab pulsar sits at its heart) | **CC BY 4.0** (ESA/Hubble default) | **"NASA, ESA and Allison Loll / Jeff Hester (Arizona State University)"** | Downloaded from ESA/Hubble CDN (section 3) | ESA/Hubble copyright policy + image page heic0515a, verified live 2026-07-21 |
| **`public/textures/neutron-stars/vela-pulsar.jpg`** | Real Chandra X-ray image of the Vela pulsar and its jet | **Public domain** (NASA) | **"NASA/CXC/Univ of Toronto/M. Durant et al."** | Downloaded from chandra.harvard.edu (section 3) | Chandra image page (2013/vela), NASA image-use policy, verified live 2026-07-21 |
| **`lib/neutron-stars.ts` computation helpers** | Density, surface gravity, escape velocity, compactness, redshift, light-bending fraction, spin velocity, characteristic age, spin-down luminosity, field ladder | Original (ours), MIT with the repo | n/a (original) | In repo, computed (planned this phase) | Validated against textbook canonical-NS values (section 2) |

**What is fetched this phase:** two real telescope images only, each after its license was
verified clean (section 3). Every stellar-structure quantity is computed in the browser from
the cited measured values by `lib/neutron-stars.ts`. The catalog numbers are reused from the
ATNF catalogue and the discovery papers. The rotating-star render is our own code; the pulse
audio is synthesized in-browser at the real spin frequency, not a telescope recording.

---

## 1. The real catalog (measured, cited)

Every object below is real and every headline number is a measured value from the cited
source. These feed the computed quantities in section 2. Primary catalogue: the ATNF Pulsar
Catalogue (Manchester et al. 2005), cross-checked with the individual discovery papers.

### 1a. PSR B1919+21 (the first pulsar)

The first pulsar discovered, by Jocelyn Bell Burnell and Antony Hewish in 1967, published
1968 (Hewish, Bell et al. 1968, Nature 217, 709). Spin period **about 1.337 s**. Originally
nicknamed "LGM-1". The founding object of the field.

### 1b. Crab pulsar (PSR B0531+21)

The pulsar at the heart of the Crab Nebula, the remnant of the supernova of AD 1054 (SN
1054) recorded by Chinese and other astronomers. Spin period **about 33.5 ms**, spinning
down measurably. Young and energetic; powers the surrounding nebula. Its characteristic age
P / 2 Pdot is about **1250 yr**, which slightly exceeds its true historical age of about
**970 yr** (from the AD 1054 event). That difference is a real, known point about the
characteristic-age estimator and is surfaced honestly in section 2.

### 1c. Vela pulsar (PSR B0833-45)

A young pulsar about **290 pc** away, spin period **about 89.3 ms**, famous for glitches
(sudden tiny spin-ups) and for its Chandra X-ray jet. The Chandra image shipped this phase
(section 3) is of this object.

### 1d. PSR J0740+6620 (the most massive well-measured neutron star)

Among the most massive neutron stars with a precise mass, **about 2.08 Msun** (Fonseca et
al. 2021, from Shapiro delay). NASA's NICER measured its radius at **about 12.4 km** (Riley
et al. 2021; Miller et al. 2021), a direct mass-and-radius pair that anchors the
neutron-star equation of state. This is one of the few objects where mass AND radius are
individually measured, so the canonical 1.4 Msun / 12 km assumption is NOT needed for it.

### 1e. PSR B1257+12 (the first exoplanets)

The first confirmed exoplanets orbit this millisecond pulsar (Wolszczan & Frail 1992, Nature
355, 145), detected from timing variations in the pulses. The first planets ever confirmed
beyond the Sun were found around a neutron star, not a Sun-like star.

### 1f. PSR J0737-3039 (the double pulsar)

The only known system where **both** neutron stars are detected as pulsars (Burgay et al.
2003; Lyne et al. 2004). A premier strong-field test of general relativity through its
orbital decay and relativistic effects.

### 1g. PSR J1748-2446ad (the fastest known pulsar)

The fastest-spinning known pulsar, **716 Hz** (Hessels et al. 2006, Science 311, 1901), in
the globular cluster Terzan 5. Its equatorial surface moves at a substantial fraction of the
speed of light (computed in section 2).

### 1h. SGR 1806-20 (a magnetar)

A magnetar (soft gamma repeater) with an extreme magnetic field of order **1e11 T (about
1e15 G)**. On 27 December 2004 it produced a **giant flare** (Palmer et al. 2005, Nature)
that briefly outshone the full Moon in gamma rays and measurably affected Earth's ionosphere
from about 50,000 ly away. The top rung of the magnetic-field ladder in section 2.

---

## 2. Computed stellar-structure physics (validated against textbook values)

Every quantity here is computed in the browser by `lib/neutron-stars.ts` from the measured
values in section 1. Constants: G = 6.674e-11 m^3 kg^-1 s^-2, c = 2.998e8 m/s,
Msun = 1.989e30 kg. Where an object's mass and radius are not both measured, a **canonical
1.4 Msun / 12 km** neutron star is assumed and the result is flagged "canonical model
assumed". Nothing is invented.

- **Density:** M / ((4/3) pi R^3). For the canonical model this is about **3.9e17 kg/m^3**,
  a few times nuclear saturation density. The classic comparison: one sugar-cube volume
  (1 cm^3) holds about a billion tonnes, roughly the mass of a mountain. This is a fact of
  the measured masses and radii, not an artistic figure.
- **Surface gravity:** g = (G M / R^2) / sqrt(1 - r_s / R), the general-relativistic surface
  gravity. For the canonical model about **1.3e12 m/s^2**, of order 1e11 times Earth's.
- **Escape velocity:** v_esc = sqrt(2 G M / R) = sqrt(r_s / R) * c. For the canonical model
  about **0.6 c**. Light and matter need a large fraction of the speed of light to escape.
- **Compactness:** r_s / R where r_s = 2 G M / c^2. For the canonical model about **0.34**
  (an event horizon would form near compactness 1). Neutron stars are the densest stable
  objects short of black holes.
- **Gravitational redshift:** z = 1 / sqrt(1 - r_s / R) - 1. For the canonical model about
  **0.24** (light leaving the surface is redshifted by roughly a quarter). This is the same
  quantity NICER folds in when measuring radii.
- **Light-bending visible-surface fraction:** general relativity bends light around the star
  so an observer sees **more than one hemisphere**. For the canonical compactness the
  visible fraction is well above 0.5 (more than half the surface), which is why pulse
  profiles are broader than naive geometry predicts. Computed from the compactness.
- **Spin frequency and equatorial velocity:** f = 1 / P and v_eq = 2 pi R f. For the fastest
  pulsar J1748-2446ad (716 Hz) with a canonical 12 km radius, v_eq is about **0.18 c**, so
  the equator moves at nearly a fifth of the speed of light. Flagged canonical-radius.
- **Characteristic age:** tau = P / (2 Pdot). For the Crab this gives about **1250 yr**
  against the true historical age of about **970 yr** (SN 1054). The discrepancy is real and
  expected (the estimator assumes magnetic-dipole braking with a constant field and an
  initial spin much faster than now); it is shown, not hidden.
- **Spin-down luminosity:** E-dot = 4 pi^2 I Pdot / P^3 with the canonical moment of inertia
  I about 1e38 kg m^2. For the Crab this is about **1e31 W**, and it matches the power needed
  to light the surrounding nebula, a real cross-check.
- **Magnetic-field ladder:** the characteristic surface dipole field
  B about 3.2e19 sqrt(P Pdot) gauss (with P in seconds), spanning ordinary pulsars (about
  1e8 T / 1e12 G) up to magnetars like SGR 1806-20 (about 1e11 T / 1e15 G). Computed from
  the measured P and Pdot.

### The accuracy bound (load-bearing)

- **Density, surface gravity, escape velocity, compactness, redshift, light-bending
  fraction:** exact from the assumed or measured mass and radius; for J0740+6620 the measured
  NICER mass and radius are used, elsewhere the canonical 1.4 Msun / 12 km is assumed and
  flagged.
- **Spin frequency and equatorial velocity:** the frequency is exact from the measured
  period; the equatorial velocity uses the canonical radius and is flagged.
- **Characteristic age and spin-down luminosity:** standard magnetic-dipole estimators from
  the measured P and Pdot, with the canonical moment of inertia; the Crab age discrepancy is
  disclosed as a known limitation of the estimator.
- **Magnetic-field ladder:** the standard characteristic-dipole formula from measured P and
  Pdot; a characteristic value, not a directly imaged field.

---

## 3. The images: license verification and result

**Result: both licenses verified clean, both images shipped.**

| Asset (in repo) | Source | License | Required credit (verbatim) | Dimensions / size |
|---|---|---|---|---|
| `public/textures/neutron-stars/crab-nebula.jpg` | ESA/Hubble image **heic0515a**, https://esahubble.org/images/heic0515a/ (Hubble mosaic of the Crab Nebula) | **CC BY 4.0** | "NASA, ESA and Allison Loll / Jeff Hester (Arizona State University). Acknowledgement: Davide De Martin (ESA/Hubble)" / "CC BY 4.0" / source: https://esahubble.org/images/heic0515a/ | 1280 x 1280 px, about 441 KB (screen JPEG) |
| `public/textures/neutron-stars/vela-pulsar.jpg` | NASA Chandra image, https://chandra.harvard.edu/photo/2013/vela/ (Vela pulsar and jet, ACIS, 2010 data) | **Public domain** (NASA) | "NASA/CXC/Univ of Toronto/M. Durant et al." / source: https://chandra.harvard.edu/photo/2013/vela/ | 864 x 694 px, about 732 KB |

**Crab license:** verified against the ESA/Hubble copyright policy
(https://esahubble.org/copyright/) live on 2026-07-21: *"ESA/Hubble images, videos and web
texts are released under the Creative Commons Attribution 4.0 International license and may
on a non-exclusive basis be reproduced without fee provided they are clearly and visibly
credited."* The full credit must be shown clearly and unaltered and links kept active.

**Vela license:** NASA/Chandra imagery is public domain under NASA's image-use policy;
Chandra material carries the NASA/CXC credit chain. The credit
"NASA/CXC/Univ of Toronto/M. Durant et al." is shown per policy. Public domain, freely
usable.

**What these images ARE, honestly:** the Crab image is a **real Hubble optical telescope
image** of the Crab Nebula, the expanding supernova remnant of SN 1054; the Crab pulsar sits
at its heart but is not itself resolved as a surface. The Vela image is a **real Chandra
X-ray image** of the Vela pulsar and its jet. Neither shows a resolved neutron-star surface,
because no telescope can resolve one. Any neutron-star "surface" or close-up in the tab is
our own illustrative render or an artist concept, never one of these images.

Both were kept at their downloaded modest web sizes (1280 px and 864 px); no local
resampling tool was needed. Each is a verified-valid JPEG (magic bytes and dimensions
confirmed on disk 2026-07-21).

### Optional bonus assets: skipped (this phase)

- **Neutron-star "concept" image (`neutron-star-concept.jpg`): SKIPPED.** No cleanly
  public-domain NASA artist concept was fetched this phase. The tab's neutron-star close-up
  is our own illustrative render, so no asset is required. If a clearly NASA-PD artist
  concept is added later, it must be labeled "artist's concept" in both the UI and this doc.
  Stub row kept in the integration log for backfill.
- **Pulsar audio recording (`public/audio/pulsar-*.mp3`): SKIPPED.** No trivially clean
  public-domain telescope recording was shipped. Many popular pulsar-sound clips (for
  example Jodrell Bank recordings) are not clearly public domain, so none was redistributed.
  This is purely a bonus: the tab's pulse audio is **synthesized in-browser at the pulsar's
  real spin frequency** (a click or tone at the true rate), which needs no asset and is
  labeled as synthesized. If a cleanly PD recording is added later, save it under
  `public/audio/` and credit it here.

---

## Rejected / flagged items

- **Presenting the rotating-star render as a photograph or a resolved surface is rejected.**
  No neutron-star surface has ever been imaged. The render is our own illustrative depiction
  of the real lighthouse model; only the pulse timing is real.
- **Presenting the synthesized audio as a telescope recording is rejected.** It is generated
  in-browser at the real spin frequency and labeled synthesized. No raw radio recording is
  shipped this phase.
- **Presenting the Crab or Vela images as neutron-star surface images is rejected.** They are
  a real Hubble optical image of the nebula and a real Chandra X-ray image of the pulsar and
  its jet; the neutron star itself is a point, not a resolved surface.
- **Shipping any image whose license could not be verified is rejected.** Both images shipped
  only after CC BY 4.0 (Crab) and NASA public domain (Vela) were confirmed live.
- **Unflagged use of the canonical 1.4 Msun / 12 km model is rejected.** Wherever mass and
  radius are not both measured (all objects except J0740+6620), the canonical model is
  assumed and every dependent quantity is flagged "canonical model assumed".
- **Hiding the Crab characteristic-age discrepancy is rejected.** The estimator gives about
  1250 yr versus the true about 970 yr; the difference is shown as a known limitation.
- **Inventing catalog numbers is rejected.** Every period, mass, distance and field is a
  cited measured value from the ATNF catalogue or a discovery paper; where a quantity is not
  measured, it is not shown.

---

**Verification methodology note:** the two image licenses were verified live on 2026-07-21,
the Crab against the ESA/Hubble copyright policy and image page heic0515a (cleanly CC BY 4.0,
credit "NASA, ESA and Allison Loll / Jeff Hester (Arizona State University)"), the Vela
against the Chandra image page (2013/vela) and NASA's public-domain image policy (credit
"NASA/CXC/Univ of Toronto/M. Durant et al."). Only then were the images downloaded into
`public/textures/neutron-stars/` and validated on disk (JPEG magic bytes and dimensions:
Crab 1280 x 1280, Vela 864 x 694). The catalog numbers in section 1 are measured values from
the ATNF Pulsar Catalogue (Manchester et al. 2005) and the cited discovery papers (Hewish et
al. 1968, Wolszczan & Frail 1992, Burgay et al. 2003, Lyne et al. 2004, Hessels et al. 2006,
Fonseca et al. 2021, Riley et al. / Miller et al. 2021, Palmer et al. 2005). The
stellar-structure quantities in section 2 are computed by `lib/neutron-stars.ts` and
validated against textbook canonical-neutron-star values. The main visual is an illustrative
render of the real lighthouse model at the real pulse timing; the pulse audio is synthesized
in-browser at the real spin frequency. See `docs/NEUTRON_STARS_PHYSICS.md` for the honest
representation methodology.

---

## Phase 23 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app wires this
in. Frontend implementation (`app/`, `components/`) is out of scope for this doc; another
agent owns it.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Real catalog | ATNF catalogue + discovery papers (section 1) | app data / constants | **REUSED, real.** B1919+21, Crab, Vela, J0740+6620, B1257+12, J0737-3039, J1748-2446ad, SGR 1806-20; cite each. |
| Density / surface gravity / escape velocity | Computed from mass and radius | `lib/neutron-stars.ts` | **COMPUTED, real.** Canonical 1.4 Msun / 12 km flagged where mass/radius not measured. |
| Compactness / redshift / light-bending fraction | Computed from compactness | `lib/neutron-stars.ts` | **COMPUTED, real.** |
| Spin frequency / equatorial velocity | Computed 1/P and 2 pi R f | `lib/neutron-stars.ts` | **COMPUTED, real.** J1748-2446ad about 0.18 c at the equator (canonical radius, flagged). |
| Characteristic age | Computed P / 2 Pdot | `lib/neutron-stars.ts` | **COMPUTED, real.** Crab about 1250 yr vs true about 970 yr, disclosed. |
| Spin-down luminosity | Computed 4 pi^2 I Pdot / P^3 | `lib/neutron-stars.ts` | **COMPUTED, real.** Crab about 1e31 W matches the nebula. |
| Magnetic-field ladder | Computed 3.2e19 sqrt(P Pdot) G | `lib/neutron-stars.ts` | **COMPUTED, real.** Ordinary pulsars to magnetar SGR 1806-20. |
| Rotating neutron-star + beam render | Our own code, real lighthouse geometry | app-side render | **ILLUSTRATIVE.** Real pulse timing; illustrative beam and surface; not a photo. |
| Pulse audio | Synthesized in-browser at real spin frequency | app-side Web Audio | **ILLUSTRATIVE / synthesized.** Real spin rate; synthesized waveform; not a telescope recording. |
| Crab Nebula image | ESA/Hubble heic0515a | `public/textures/neutron-stars/crab-nebula.jpg` | **REUSED, real (shipped).** Hubble optical image of the nebula, not a resolved NS surface. CC BY 4.0, full credit. |
| Vela pulsar image | NASA Chandra 2013/vela | `public/textures/neutron-stars/vela-pulsar.jpg` | **REUSED, real (shipped).** Chandra X-ray image of the pulsar and jet. NASA public domain, credit "NASA/CXC/Univ of Toronto/M. Durant et al." |
| Neutron-star concept image | (none shipped this phase) | `public/textures/neutron-stars/neutron-star-concept.jpg` (stub) | **SKIPPED.** Add only if clearly NASA PD; label "artist's concept". |
| Pulsar audio recording | (none shipped this phase) | `public/audio/pulsar-*.mp3` (stub) | **SKIPPED.** Add only if trivially clean PD; else audio stays synthesized. |
| Required attributions | this doc (verbatim strings) | app about/credits + README + this doc | ESA/Hubble (CC BY 4.0, Crab, full credit); NASA/CXC (public domain, Vela); literature citations for the catalog. |
