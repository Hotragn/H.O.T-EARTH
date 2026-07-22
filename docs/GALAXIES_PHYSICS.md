# Galaxies and Cosmic Web Physics (Phase 24)

Verification date: **2026-07-21**. This companion to `GALAXIES_DATA_SOURCES.md` documents
the physics behind the "Galaxies and Cosmic Web" tab: what is computed, how, from which
measured inputs, and exactly how accurate each claim is. Same honesty bar as
`BLACK_HOLES_PHYSICS.md` (Phase 22). Everything computed here lives in `lib/galaxies.ts` and
is derived from measured redshifts and published distances, never invented.

> **Honesty rule (leads the page): the map shows a REAL galaxy distribution, computed with
> a REAL but low-redshift cosmology.** The ~18,000 cosmic-web points are measured SDSS
> redshifts. Their 3D positions are computed from RA, Dec and a Hubble distance cz/H0 using
> the adopted H0 = 70 km/s/Mpc. This is the correct low-z linear Hubble law; it is fine for
> the map's scale and NOT valid for high-redshift cosmology. The depth axis is
> redshift-space (fingers-of-God distortion present), and the whole depth scale moves if a
> different H0 is chosen. We adopt 70 as a documented round mid value between the two
> conflicting measurements, not as a claim that the tension is resolved.

## Summary table

| Quantity | Formula | Inputs | Status | Accuracy bound |
|---|---|---|---|---|
| Recession velocity | v = H0 * d | published distance | **COMPUTED, real** | Low-z linear Hubble law |
| Hubble distance | d = c*z / H0 | measured z | **COMPUTED, real** | Valid z <~ 0.1; redshift-space |
| Redshift to velocity | v ~ c*z (low z) | measured z | **COMPUTED, real** | Low-z approximation only |
| RA/Dec + z to 3D Mpc | spherical to Cartesian with r = c*z/H0 | measured RA, Dec, z | **COMPUTED, real** | Redshift-space depth |
| Named-galaxy distances | ladder measurements | NED/SIMBAD | **REUSED, real** | Method-dependent, ~5 to 15 percent |
| Hubble constant H0 | adopted 70 (Planck 67.4, SH0ES 73) | literature | **REUSED, real** | Unresolved ~5 sigma tension |
| Rendered galaxy disks | stylisation | catalog values | **ILLUSTRATIVE, labeled** | Numbers real, appearance ours |

---

## 1. Hubble's law and the adopted H0

The tab's cosmology is the Hubble-Lemaitre law in its low-redshift linear form. A galaxy's
cosmological redshift z relates to recession velocity and distance by:

- v = H0 * d (Hubble-Lemaitre law)
- v ~ c * z for z much less than 1 (low-z approximation)
- d ~ c * z / H0 (the "Hubble distance")

where c = 299792.458 km/s and H0 is the Hubble constant. In `lib/galaxies.ts` these are
`recessionVelocityKmS`, `redshiftToVelocityKmS`, `hubbleDistanceMpc` and
`redshiftToDistanceMpc`. This linear relation is valid for z <~ 0.1, which covers the entire
cosmic-web slice (max z ~ 0.15). It is deliberately NOT used for high-z cosmology, where the
full Friedmann-Lemaitre-Robertson-Walker relation with dark energy and matter density is
needed.

### The Hubble tension (load-bearing honesty item)

**H0 is not a settled number.** Two high-precision measurements disagree at about the 5 sigma
level, an unresolved problem known as the **Hubble tension**:

- **Planck Collaboration (A&A 641, A6, 2020):** the early-universe cosmic-microwave-background
  fit gives **H0 = 67.4 +/- 0.5 km/s/Mpc**.
- **Riess et al. (ApJL 934, L7, 2022, SH0ES):** the local distance ladder (Cepheids plus Type
  Ia supernovae) gives **H0 = 73.04 +/- 1.04 km/s/Mpc**.

The tab **adopts H0 = 70 km/s/Mpc as a round mid value** (`H0_KM_S_MPC`), and stores both
endpoints (`H0_PLANCK_KM_S_MPC = 67.4`, `H0_SH0ES_KM_S_MPC = 73.0`) plus a plain-language
statement (`HUBBLE_TENSION`). This choice is documented, not a claim that the tension is
resolved. A direct consequence: because distance is c*z/H0, the depth of the cosmic-web map
scales inversely with H0. Using Planck (67.4) stretches the map about 4 percent deeper than
using SH0ES (73). The structure is unchanged; only the depth scale shifts.

## 2. The cosmic web: RA/Dec + redshift to 3D positions

Each SDSS row is (RA, Dec, z). `equatorialRedshiftToCartesianMpc(ra, dec, z)` converts it to
a 3D Cartesian position in Mpc: it computes the radial distance r = c*z / H0 (the Hubble
distance) and places the point on the celestial sphere at that radius using the standard
equatorial-to-Cartesian spherical transform. `cosmicWebPointsFromRows` maps the whole
catalog. Plotting all ~18,000 points reveals the real large-scale structure: dense
filaments and walls (including the **Sloan Great Wall**) threaded around near-empty **voids**
(such as the **Bootes Void**), the defining "cosmic web" morphology.

### Redshift-space and fingers-of-God (load-bearing honesty item)

The radial coordinate r = c*z / H0 is a **redshift-space** distance, not a directly measured
real-space distance. The observed redshift is the sum of the cosmological (Hubble-flow)
redshift and a Doppler shift from the galaxy's **peculiar velocity**. Inside a galaxy
cluster, random orbital velocities of hundreds to over a thousand km/s add scatter along the
line of sight, so a compact cluster appears **stretched radially into a "finger of God"**
pointing back at the observer. On larger scales, coherent infall toward overdensities flattens
structures (the linear "Kaiser" effect). These distortions are real, well understood, and
present in every redshift survey. The web itself is genuine; the exact radial depth is
redshift-space and would only match true distance if peculiar velocities were zero.

## 3. The distance ladder (how the named-galaxy distances are known)

The named-galaxy distances in the catalog are **reused measurements**, not computed here, and
they carry real uncertainty. They come from the cosmic distance ladder, a chain of overlapping
methods each calibrating the next:

1. **Parallax** for nearby stars (Gaia), the geometric foundation.
2. **Eclipsing binaries**, which fix the Large Magellanic Cloud distance (~49.97 kpc), a ladder
   cornerstone.
3. **Cepheid period-luminosity relation** for nearby galaxies (M31, M33 and others).
4. **Tip of the red-giant branch** and **surface-brightness fluctuations** for elliptical and
   more distant systems (M87, M104).
5. **Tully-Fisher relation** and **Type Ia supernovae** for the far field, reaching into the
   Hubble flow.

Different rungs disagree at roughly the 5 to 15 percent level, and published distances shift as
calibrations improve. The tab therefore presents these as best measured values with honest,
method-dependent uncertainty, never as exact constants. SCALE_LADDER in `lib/galaxies.ts`
orders the full hierarchy from Earth out to the observable universe (~93 Gly comoving diameter),
and SUPERCLUSTERS records the Virgo and Laniakea superclusters, the Great Attractor, the Sloan
Great Wall and the Bootes Void as real large-scale-structure facts.

## 4. What is computed, reused, or illustrative

- **COMPUTED and REAL:** recession velocity, Hubble distance, redshift-to-velocity and
  redshift-to-distance, and the RA/Dec + redshift to 3D-Mpc mapping, all from measured
  redshifts via `lib/galaxies.ts` at the adopted H0 = 70, in the valid low-z regime.
- **REUSED and REAL:** the named-galaxy distances, Hubble types and redshifts (NED/SIMBAD and
  the published ladder literature); the H0 endpoints and the Hubble tension (Planck 2020,
  Riess et al. 2022); the large-scale-structure facts; the real SDSS redshift catalog; and the
  five verified galaxy images (see `GALAXIES_DATA_SOURCES.md` section 3).
- **ILLUSTRATIVE and LABELED:** any rendered 3D galaxy-disk geometry, particle colour or glow
  used to draw individual catalog galaxies. The catalogued numbers are real; the drawn
  appearance is our own stylisation.

### The accuracy bound (load-bearing)

- **Hubble law:** exact low-z linear relation; valid for the slice (z <~ 0.15), not for high-z
  cosmology.
- **Cosmic-web positions:** as precise as the measured redshifts, but redshift-space, with real
  fingers-of-God distortion and a depth scale that moves with H0.
- **Named-galaxy distances:** real ladder measurements with ~5 to 15 percent method-dependent
  uncertainty.
- **H0:** adopted 70, a documented mid value between the conflicting Planck 67.4 and SH0ES 73;
  the ~5 sigma tension is unresolved and stated as such.

---

**Verification methodology note:** the formulas above match the exported helpers in
`lib/galaxies.ts` (`recessionVelocityKmS`, `redshiftToVelocityKmS`, `hubbleDistanceMpc`,
`redshiftToDistanceMpc`, `equatorialRedshiftToCartesianMpc`, `cosmicWebPointsFromRows`) and its
constants (`H0_KM_S_MPC = 70`, `H0_PLANCK_KM_S_MPC = 67.4`, `H0_SH0ES_KM_S_MPC = 73.0`,
`C_KM_S = 299792.458`, `HUBBLE_TENSION`), reconciled on 2026-07-21. The cosmic-web catalog is
real SDSS DR17 data (see `GALAXIES_DATA_SOURCES.md` section 2 and `cosmic-web.meta.json`); the
named-galaxy distances are published NED/SIMBAD ladder measurements. See
`docs/GALAXIES_DATA_SOURCES.md` for every source, license and attribution.

---

## Phase 24 integration log

Populate at integration time as the app wires this in.

| In-app element | Compute source | Status | Notes |
|---|---|---|---|
| Recession velocity / Hubble distance | `lib/galaxies.ts` v = H0 d, d = cz/H0 | **COMPUTED, real** | Low-z linear law; H0 = 70 adopted. |
| Cosmic-web 3D positions | `equatorialRedshiftToCartesianMpc`, `cosmicWebPointsFromRows` | **COMPUTED, real** | Redshift-space; fingers-of-God present; depth scales with H0. |
| Hubble tension panel | `HUBBLE_TENSION` (Planck 67.4, SH0ES 73) | **REUSED, real** | Adopted 70 documented, not a claim. |
| Named-galaxy distances | `GALAXIES` (NED/SIMBAD) | **REUSED, real** | Ladder measurements; ~5 to 15 percent uncertainty. |
| Scale ladder / superclusters | `SCALE_LADDER`, `SUPERCLUSTERS` | **REUSED, real** | LSS facts; observable universe ~93 Gly comoving. |
| Rendered galaxy disks | app-side render from catalog values | **ILLUSTRATIVE, labeled** | Numbers real; 3D appearance ours. |
