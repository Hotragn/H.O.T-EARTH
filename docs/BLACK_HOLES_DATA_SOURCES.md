# Black Holes Data Sources (Phase 22)

Verification date: **2026-07-21**. Every source, method and claim below was recorded on
this date against primary literature (the cited GRAVITY, EHT and LIGO papers), against
ESO's published copyright policy and image pages, and against the computation helpers in
`lib/black-holes.ts`. Same rigor and honesty bar as `EXO_SURFACES_DATA_SOURCES.md`
(Phase 21), `SURFACES_DATA_SOURCES.md` (Mars and Titan, Phase 20) and the sibling
data-source docs: real physics, real data, honest claims, everything free and legally
usable for an MIT open-source app, every source and license logged. Anything that cannot
be verified from an official or primary source, or from validated in-repo code, is
explicitly flagged.

Scope this phase: a **"Black Holes" tab**. Unlike the surface tabs, the honesty split here
is three-way and the load-bearing point comes first.

> **Honesty rule for this phase (leads the page): the tab's main visual is a
> PHYSICALLY-BASED gravitational-lensing RENDER, not a photograph.** It uses real
> light-bending physics but it is our own original render, not an observation. The two
> real black-hole images that exist (the EHT M87* and Sgr A* reconstructions) are
> **radio-interferometric reconstructions from 2017 data, not optical photographs**, and
> where they appear they are labeled and credited to the EHT Collaboration under CC BY 4.0.
> The catalog numbers (masses, distances, shadow sizes) are **real, measured, and cited**.
> The general-relativity quantities (Schwarzschild radius, photon sphere, ISCO, shadow
> angular size, time dilation, tidal stress, Hawking temperature, Einstein radius) are
> **computed from those measured masses and distances** in `lib/black-holes.ts` and
> validated to reproduce the EHT microarcsecond measurements.
>
> - **COMPUTED and REAL:** Schwarzschild radius, photon sphere, ISCO, shadow angular size,
>   gravitational time dilation, tidal / spaghettification stress, Hawking temperature and
>   evaporation time (real theory, unobserved), Einstein radius and light-deflection angle,
>   all from the measured masses and distances via `lib/black-holes.ts`.
> - **REUSED and REAL:** the cited catalog measurements (Sgr A*, M87*, Cygnus X-1, Gaia BH1,
>   GW150914, TON 618) from the primary literature below, and the ESO Milky Way panorama
>   already in the repo (`public/textures/night-sky/milkyway.jpg`, credited per the
>   NIGHT_SKY docs) which the lensing render bends as its background.
> - **ILLUSTRATIVE and LABELED:** the gravitational-lensing render itself (real deflection
>   physics, Schwarzschild non-spinning geometry, an illustrative accretion-disk
>   appearance), and, if shipped, the EHT images labeled as reconstructions, not photos.
>
> Second honesty item, load-bearing: **the accretion disk in the render is illustrative.**
> The light-bending geometry is real physics (the same class of physics Kip Thorne's team
> used for Interstellar's Gargantua), but the disk brightness, color and texture are our
> own artistic choice, and the geometry is the simpler non-spinning Schwarzschild case, not
> a full Kerr ray-trace. It is our own original render, inspired by the real physics, not a
> copy of any film frame and not a photograph.

## Summary table

| Source | What it provides | License / status | Attribution | Access | Verified against (2026-07-21) |
|---|---|---|---|---|---|
| **GRAVITY Collaboration (2023), Astronomy & Astrophysics** | Sgr A* mass 4.297e6 Msun and distance 8277 pc (S2 orbit) | Peer-reviewed literature; the measured values are facts, freely usable; cite the paper | Cite GRAVITY Collaboration et al. 2023, A&A | Public literature (arXiv / A&A) | The published S2-orbit determination |
| **EHT Collaboration (2022), ApJ Letters (Sgr A*)** | Sgr A* shadow angular diameter about 51.8 uas | Peer-reviewed literature | Cite EHT Collaboration 2022, ApJL | Public literature | The published Sgr A* results papers |
| **EHT Collaboration (2019), ApJ Letters (M87*)** | M87* mass 6.5e9 Msun, distance 16.4 Mpc, ring about 42 uas, spin about 0.9 | Peer-reviewed literature | Cite EHT Collaboration 2019, ApJL | Public literature | The published M87* results papers |
| **Cygnus X-1 (Miller-Jones et al. 2021, Science)** | Stellar-mass black hole about 21 Msun | Peer-reviewed literature | Cite Miller-Jones et al. 2021, Science | Public literature | The revised-distance mass determination |
| **Gaia BH1 (El-Badry et al. 2023, MNRAS)** | Nearest known black hole, about 9.6 Msun, about 1560 ly | Peer-reviewed literature | Cite El-Badry et al. 2023, MNRAS | Public literature | The Gaia astrometric binary discovery |
| **GW150914 (Abbott et al. 2016, PRL, LIGO)** | 36 + 29 Msun merging to about 62 Msun, about 3 Msun radiated as gravitational waves | Peer-reviewed literature | Cite LIGO / Virgo Abbott et al. 2016, PRL | Public literature | The first direct GW detection paper |
| **TON 618 (ultramassive quasar)** | Ultramassive black hole about 4e10 Msun (H-beta reverberation / virial estimate) | Peer-reviewed literature | Cite the reverberation-mass estimate | Public literature | The virial black-hole-mass estimate |
| **`public/textures/black-holes/m87-eht.jpg`, `sgr-a-eht.jpg`** | The two real EHT reconstructions (M87* 2019, Sgr A* 2022) | **CC BY 4.0** (ESO default) | **"EHT Collaboration", "CC BY 4.0", ESO source URL** | Downloaded from ESO CDN (see section 3) | ESO copyright policy + image pages, verified live 2026-07-21 |
| **`public/textures/night-sky/milkyway.jpg`** | The real ESO Milky Way panorama the lensing render bends as background | As documented in NIGHT_SKY docs | Credit per NIGHT_SKY docs | Already in repo, reused | NIGHT_SKY_DATA_SOURCES.md |
| **`lib/black-holes.ts` computation helpers** | Schwarzschild radius, photon sphere, ISCO, shadow angular size, time dilation, tidal stress, Hawking temperature / evaporation, Einstein radius, light deflection | Original (ours), MIT with the repo | n/a (original) | In repo, computed | Validated to reproduce the EHT shadow measurements (section 2) |

**What is fetched this phase:** only the two EHT images, and only after the license was
verified clean (section 3). Every general-relativity quantity is computed in the browser
from the cited masses and distances by `lib/black-holes.ts`. The catalog numbers are reused
from the primary literature. The lensing render is our own code bending the real Milky Way
panorama already in the repo.

---

## 1. The real catalog (measured, cited)

Every object below is real, and every headline number is a measured value from the cited
primary source. These feed the computed GR quantities in section 2.

### 1a. Sagittarius A* (the Galactic Center black hole)

The supermassive black hole at the center of the Milky Way. **Mass 4.297e6 Msun, distance
8277 pc** (GRAVITY Collaboration 2023, from the orbit of the star S2). The **EHT measured
its shadow at about 51.8 uas** (microarcseconds) in the 2022 results, from 2017 observing
data. Both the mass/distance and the shadow size are measured, cited, and used to validate
the shadow-size computation in section 2.

### 1b. M87* (the first imaged black hole)

The supermassive black hole in the giant elliptical galaxy M87. **Mass 6.5e9 Msun, distance
16.4 Mpc**, with a **bright ring about 42 uas across** and an inferred **spin of about 0.9**
(EHT Collaboration 2019, from 2017 data). This is the object in the famous first black-hole
image released in April 2019 (ESO image eso1907a).

### 1c. Cygnus X-1 (a stellar-mass black hole)

A stellar-mass black hole in an X-ray binary, **about 21 Msun** (Miller-Jones et al. 2021,
after a revised distance). Included as the contrast to the supermassive cases: this is the
regime where tidal forces at the horizon are lethal (section 2).

### 1d. Gaia BH1 (the nearest known black hole)

The nearest known black hole to the Solar System, **about 9.6 Msun at about 1560 ly**
(El-Badry et al. 2023), a dormant black hole found from the astrometric wobble it induces on
a Sun-like companion in Gaia data. It is not accreting and emits no X-rays; it is detected
purely by gravity.

### 1e. GW150914 (the first gravitational-wave detection)

The first directly detected gravitational-wave event (LIGO, 14 September 2015; Abbott et al.
2016). Two black holes of **about 36 and 29 Msun merged into about 62 Msun**, radiating
**about 3 Msun of mass-energy as gravitational waves** in a fraction of a second. This is a
real measurement of black holes via spacetime ripples rather than light.

### 1f. TON 618 (an ultramassive black hole)

An ultramassive black hole in a distant quasar, **about 4e10 Msun** (a virial /
reverberation-mapping estimate from the broad H-beta emission line). Included as the extreme
upper end of the mass scale, and as the object where horizon tides are gentlest (section 2).

---

## 2. Computed GR physics (validated)

Every quantity here is computed in the browser by `lib/black-holes.ts` from the measured
masses and distances in section 1. Constants: G = 6.674e-11 m^3 kg^-1 s^-2,
c = 2.998e8 m/s, Msun = 1.989e30 kg. Nothing is invented; where an input is unknown the
dependent quantity is not shown.

- **Schwarzschild radius:** r_s = 2 G M / c^2. For Sgr A* (4.297e6 Msun) this is about
  1.27e10 m (about 0.085 AU); for a stellar-mass black hole it is a few tens of km.
- **Photon sphere:** r_ph = 1.5 r_s = 3 G M / c^2, the radius where light can orbit.
- **ISCO (innermost stable circular orbit):** r_isco = 3 r_s = 6 G M / c^2 for a
  non-spinning (Schwarzschild) black hole; the inner edge of a thin accretion disk.
- **Shadow angular size:** the shadow angular diameter is
  2 * sqrt(27) * G M / (c^2 D) for a Schwarzschild black hole, where D is the distance.
  **This is validated:** for Sgr A* (4.297e6 Msun at 8277 pc) it gives about 53 uas, close
  to the EHT-measured 51.8 uas; for M87* (6.5e9 Msun at 16.4 Mpc) it gives about 41 uas,
  close to the EHT-measured 42 uas ring. The small differences are the expected spin and
  emission-geometry effects the Schwarzschild formula omits, and they are noted, not hidden.
- **Gravitational time dilation:** the factor sqrt(1 - r_s / r) for a static observer at
  radius r, going to zero at the horizon (clocks freeze as seen from far away).
- **Tidal stress / spaghettification:** the tidal (differential) acceleration scales as
  G M / r^3 times body length, which for a fixed radius r_s FALLS as 1/M^2. **The real,
  counterintuitive fact this surfaces:** at the horizon of a supermassive black hole
  (Sgr A*, M87*, TON 618) tides are GENTLE, an infalling person would not be torn apart at
  the horizon; at the horizon of a stellar-mass black hole (Cygnus X-1) the tides are
  LETHAL, spaghettification happens well outside the horizon. Bigger black hole, gentler
  horizon tides.
- **Hawking temperature and evaporation:** T_H = hbar c^3 / (8 pi G M k_B) and the
  evaporation timescale proportional to M^3. This is **real theory, entirely unobserved**:
  for any astrophysical black hole T_H is far below the cosmic microwave background
  temperature, so these black holes absorb more than they emit and are not evaporating now.
  Labeled real-theory-unobserved everywhere it appears.
- **Einstein radius and light deflection:** the Einstein radius for lensing geometry, and
  the classic light-deflection angle 4 G M / (c^2 b) for impact parameter b. At the solar
  limb this is the famous **1.75 arcsec** general-relativity prediction confirmed at the
  1919 eclipse, and `lib/black-holes.ts` reproduces it as a validation check.

### The accuracy bound (load-bearing)

- **Radii, photon sphere, ISCO, time dilation:** exact Schwarzschild (non-spinning) GR from
  the measured mass; as precise as the cited mass, and no more.
- **Shadow angular size:** the Schwarzschild formula, validated to reproduce the EHT
  microarcsecond measurements within the spin/emission differences noted above.
- **Tidal stress:** exact Newtonian tidal scaling, sufficient to make the
  supermassive-gentle / stellar-lethal contrast honestly.
- **Hawking temperature / evaporation:** correct theory, unobserved for astrophysical black
  holes; never presented as a measured effect.
- **Light deflection:** exact weak-field GR, validated against the 1.75 arcsec solar-limb
  test.

---

## 3. The EHT images: license verification and result

**Result: license verified clean (CC BY 4.0), images shipped.**

The two real EHT images were verified against ESO's published copyright policy
(https://www.eso.org/public/outreach/copyright/) and their image pages on 2026-07-21. ESO's
stated default is: *"images, videos, and music distributed on the public ESO website ... are
licensed under a Creative Commons Attribution 4.0 International License."* The M87* image
page (eso1907a) and the Sgr A* image page (eso2208-eht-mwa) both carry the credit line
**"EHT Collaboration"** and both link to that copyright policy. The ESO-logo exception,
identifiable-persons exception and non-image-text exceptions in the policy do not apply to
these two astronomical images. The license is therefore cleanly **CC BY 4.0**, so the images
were downloaded.

| Asset (in repo) | Source | License | Required credit (verbatim) |
|---|---|---|---|
| `public/textures/black-holes/m87-eht.jpg` (1280x746) | ESO image **eso1907a**, https://www.eso.org/public/images/eso1907a/ (EHT 2019 M87*) | **CC BY 4.0** | "EHT Collaboration" / "CC BY 4.0" / source: https://www.eso.org/public/images/eso1907a/ |
| `public/textures/black-holes/sgr-a-eht.jpg` (1280x1280) | ESO image **eso2208-eht-mwa**, https://www.eso.org/public/images/eso2208-eht-mwa/ (EHT 2022 Sgr A*) | **CC BY 4.0** | "EHT Collaboration" / "CC BY 4.0" / source: https://www.eso.org/public/images/eso2208-eht-mwa/ |

**Exact license text to honor (from the ESO copyright policy, verbatim):** *"Unless
specifically noted, images, videos, and music distributed on the public ESO website ... are
licensed under a Creative Commons Attribution 4.0 International License, and may on a
non-exclusive basis be reproduced without fee provided the credit is clear and visible."*
The full credit must be shown clearly and unaltered, and online links kept active.

**What these images ARE, honestly:** they are **radio-interferometric reconstructions from
2017 EHT observing data**, not optical photographs. The M87* image is the April 2019 result;
the Sgr A* image is the May 2022 result. They are shown labeled as reconstructions and
credited to the EHT Collaboration under CC BY 4.0. They are NOT the lensing render, and the
lensing render is NOT them.

The intended web size was about 1024px; ESO's "screen" versions are 1280px at 40 to 63 KB,
which is already a modest web size, and no local resampling tool (ImageMagick) was available
in this environment, so the 1280px screen versions were kept as-is rather than re-encoded.

---

## Rejected / flagged items

- **Presenting the lensing render as a photograph is rejected.** It is a physically-based
  render using real deflection physics, our own original work, labeled as a render, not a
  photo. This is the top honesty item.
- **Presenting the EHT images as optical photographs is rejected.** They are radio
  interferometric reconstructions from 2017 data, and are labeled as such.
- **Shipping any image whose license could not be verified is rejected.** The two EHT
  images shipped only because the CC BY 4.0 license was confirmed clean against ESO's policy
  and image pages; had it been ambiguous or more restrictive, they would have been cited and
  linked instead of redistributed.
- **Presenting Hawking radiation as observed is rejected.** It is correct theory, entirely
  unobserved for astrophysical black holes (T_H far below the CMB); labeled real-theory,
  unobserved.
- **Presenting the accretion disk as an observation is rejected.** The disk appearance
  (brightness, color, texture) in the render is illustrative; only the light-bending
  geometry is real physics, and it is the simpler non-spinning Schwarzschild case.
- **Claiming a full Kerr (spinning) ray-trace is rejected.** The render is Schwarzschild
  (non-spinning) geometry; the real spins (M87* about 0.9) are cited as catalog facts but
  the render does not model them.
- **Inventing catalog numbers is rejected.** Every mass, distance and shadow size is a cited
  measured value; where a quantity is not measured for an object, it is not shown.

---

**Verification methodology note:** the EHT-image license was verified live on 2026-07-21
against ESO's copyright policy page and the two image pages (eso1907a, eso2208-eht-mwa),
confirmed cleanly CC BY 4.0 with credit "EHT Collaboration", and only then were the images
downloaded from the ESO CDN into `public/textures/black-holes/`. The catalog numbers in
section 1 are measured values from the cited primary literature (GRAVITY 2023, EHT 2019 and
2022, Miller-Jones et al. 2021, El-Badry et al. 2023, Abbott et al. 2016). The GR quantities
in section 2 are computed by `lib/black-holes.ts` and validated: the Schwarzschild shadow
formula reproduces the EHT measurements (about 53 uas vs 51.8 uas for Sgr A*, about 41 uas
vs 42 uas for M87*), and the light-deflection formula reproduces the 1.75 arcsec solar-limb
GR test. The main visual is a physically-based lensing render, our own original code bending
the real ESO Milky Way panorama (`public/textures/night-sky/milkyway.jpg`); its accretion
disk is illustrative and its geometry is non-spinning Schwarzschild. See
`docs/BLACK_HOLES_PHYSICS.md` for the honest representation methodology.

---

## Phase 22 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app wires this
in. Frontend implementation (`app/`, `components/`) is out of scope for this doc; another
agent owns it.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Real catalog | Cited primary literature (section 1) | app data / constants | **REUSED, real.** Sgr A*, M87*, Cygnus X-1, Gaia BH1, GW150914, TON 618; cite each. |
| Schwarzschild radius / photon sphere / ISCO | Computed from measured mass | `lib/black-holes.ts` | **COMPUTED, real.** Exact Schwarzschild GR. |
| Shadow angular size | Computed 2*sqrt(27)*GM/(c^2 D) | `lib/black-holes.ts` | **COMPUTED, real, validated.** About 53 uas Sgr A*, about 41 uas M87*. |
| Time dilation | Computed sqrt(1 - r_s/r) | `lib/black-holes.ts` | **COMPUTED, real.** |
| Tidal / spaghettification | Computed GM/r^3 scaling | `lib/black-holes.ts` | **COMPUTED, real.** SMBH horizon tides gentle; stellar-BH tides lethal. |
| Hawking temperature / evaporation | Computed T_H, t proportional to M^3 | `lib/black-holes.ts` | **COMPUTED, real theory, UNOBSERVED. Labeled.** |
| Einstein radius / light deflection | Computed 4GM/(c^2 b) | `lib/black-holes.ts` | **COMPUTED, real, validated.** 1.75 arcsec solar-limb test. |
| Gravitational-lensing render | Our own code bending the ESO Milky Way panorama | app-side render | **ILLUSTRATIVE / physically-based.** Real deflection physics; Schwarzschild geometry; illustrative disk; our own render, not a photo. |
| Lensed background | `public/textures/night-sky/milkyway.jpg` | Reused in repo | **REUSED, real.** ESO Milky Way panorama; credit per NIGHT_SKY docs. |
| EHT M87* image | ESO eso1907a | `public/textures/black-holes/m87-eht.jpg` | **REUSED, real (shipped).** Radio reconstruction, not a photo. Credit "EHT Collaboration", CC BY 4.0, ESO URL. |
| EHT Sgr A* image | ESO eso2208-eht-mwa | `public/textures/black-holes/sgr-a-eht.jpg` | **REUSED, real (shipped).** Radio reconstruction, not a photo. Credit "EHT Collaboration", CC BY 4.0, ESO URL. |
| Required attributions | this doc (verbatim strings) | app about/credits + README + this doc | EHT Collaboration (CC BY 4.0, both ESO URLs); literature citations for the catalog. |
