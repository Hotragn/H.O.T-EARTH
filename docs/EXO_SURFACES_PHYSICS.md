# Exoplanet Surfaces (Standing on Real Exoplanets) Physics and Honest-Representation Methodology (Phase 21)

Companion to `docs/EXO_SURFACES_DATA_SOURCES.md`. Same non-negotiable bar as Earth, Mars,
the Moon, the planets, the small bodies, the moons, the interstellar tabs and the Mars and
Titan Surfaces tab (`physics-env-simulation` skill): **real physics and real data, or it
doesn't ship. No invented numbers.** This doc states exactly what is **COMPUTED** (the host
star's apparent size and color, the sibling-planet discs, surface gravity for rocky worlds,
irradiance and equilibrium temperature, and the year length), what is **REUSED / REAL** (the
NASA Exoplanet Archive parameters in `systems.json` and the `lib/exoplanets` helpers), and
what is **ILLUSTRATIVE / INFERRED** (all terrain and ground, the sky's fine texture and
atmosphere rendering, and the tidal-lock day/night framing).

Verification date: **2026-07-20**. This is a **ground-level view**: you stand on the surface
and look up. That makes the honesty stakes higher, not lower, because a first-person view
reads as a photo unless the labels say otherwise.

## The overriding honesty rule: the SKY is real, the GROUND is imagined

The single most important honesty statement of this phase, and the one the tab must lead
with, is that **no exoplanet surface has ever been imaged, not one pixel; there is no
terrain data for any exoplanet.** So **all ground, terrain and surface appearance on this
tab is ILLUSTRATIVE and labeled.** This is the exact **mirror image** of the Mars and Titan
Surfaces tab: there the **ground** was the real part (a real elevation model, a real rover
panorama) and the sky palette was the illustrative part; **here the SKY is the real part and
the ground is the imagined part.**

What IS genuinely real is the **sky and the physical conditions**, computed from measured
parameters in the NASA Exoplanet Archive already in the repo
(`public/data/exoplanets/systems.json`, used by `lib/exoplanets`):

- The host star's **apparent angular size** (from stellar radius and orbital distance) and
  its **color** (from stellar temperature).
- The **sibling planets seen as discs** (from their radii and orbital separations).
- **Surface gravity** for rocky worlds (from measured mass and radius).
- **Irradiance** and **equilibrium temperature** (from luminosity and distance).
- The **year length** (the measured orbital period).

The pixels are rendered by our code. The star, the discs, the sizes, the colors and the
conditions are computed from real data; the ground under your feet is our own labeled
illustration.

## Five structural honesty facts that shape everything

1. **The sky is real, the ground is imagined.** The rule above. No exoplanet surface image
   exists, so all terrain is illustrative and labeled; the star, sibling discs, sizes,
   colors and conditions are computed from the archive.
2. **Tidal locking is an INFERENCE, not a measurement.** For close-in habitable-zone planets
   around low-mass stars (TRAPPIST-1 e, Proxima Centauri b), tidal locking is expected on
   theoretical grounds but has not been measured. It must be labeled an inference. A locked
   world has a **permanent day side and a permanent night side**, a real consequence of the
   inference, which carries the same "inference" label.
3. **Rotation and day length are not measured; there is no local clock.** Unlike Mars, where
   local true solar time is fully real via the validated Mars24 code, the rotation period and
   day length of these planets have not been measured. The tab must **not** present a local
   time-of-day as real. Only the **year** (the orbital period) is a real, measured time
   quantity.
4. **The apparent sizes and conditions are computed from real numbers, not styled.** The
   host star's angular size, the sibling discs, the surface gravity, the irradiance and the
   equilibrium temperature all come from committed archive values through
   `lib/exoplanets`. They are real physics, not art direction.
5. **A gas giant has no surface, and the tab says so.** The gas-giant vantage is the honest
   counterpart: `hasSurface(planet)` returns false for a gas-giant / volatile-rich world (via
   `compositionClass`), there is no
   ground to stand on, and no standing-on surface gravity is shown.

## COMPUTED: the substance

### Host star apparent angular size

The star's apparent angular diameter is **2 * atan(R_star / orbital_distance)**, from the
committed stellar radius (`st_rad`, solar radii) and the planet's orbital semi-major axis
(`sma_au`, AU), in consistent units.

Worked showcase (TRAPPIST-1 e, computed from committed values): stellar radius
0.1192 Rsun = about 82,963 km, orbital distance 0.02925 AU = about 4.376e6 km, so the
angular diameter is 2 * atan(82,963 / 4.376e6) = about **0.0379 rad = about 2.17 degrees,
roughly 4 times our Sun's apparent width from Earth** (our Sun is about 0.53 deg). Computed,
not styled.

**Stefan-Boltzmann fallback for stellar radius.** Where the archive has no tabulated
`st_rad`, the radius is **derived from luminosity and temperature**:

    R/Rsun = sqrt(L/Lsun) * (5772/Teff)^2

with L/Lsun from `lsunFromLogLum` (the archive stores luminosity as log10 L/Lsun, so it is
exponentiated first) and 5772 K the Sun's effective temperature. This is the Stefan-Boltzmann
law (L proportional to R^2 * Teff^4) solved for R. It is a documented derivation from other
measured values, labeled as derived, not an invented number. Where luminosity or temperature
is also null, the apparent-size figure is simply not shown.

### Host star color

The star's color is `starColor(teffK)` from `lib/exoplanets`, a blackbody-based color from
the committed effective temperature. TRAPPIST-1 (2566 K) yields a **deep salmon-red**;
Proxima Centauri (2900 K) a slightly less deep red. Real, computed from the measured
temperature.

### Sibling planets as discs

A sibling planet's apparent angular diameter is **2 * atan(R_planet / separation)**, from the
sibling's committed radius (`radius_re`) and the separation between the two orbits (the
difference in `sma_au`, with the closest-approach separation used for the "largest it gets"
figure). In the tightly packed TRAPPIST-1 resonant chain the neighbors pass as **discs
larger than our Moon** (0.5 deg from Earth): for example TRAPPIST-1 d, radius 0.788 Earth
radii at a minimum separation of about 0.007 AU from e, subtends roughly 0.55 deg. Only
drawn to scale where the sibling radius is non-null.

### Surface gravity (rocky worlds only)

Surface gravity is **g = g_Earth * (M/M_Earth) / (R/R_Earth)^2** (g_Earth = 9.81 m/s^2), from
the committed mass (`mass_me`) and radius (`radius_re`), and only when `compositionClass`
reports a **rocky** world and both values are non-null. The archive's mass caveat is carried:
a radial-velocity-only mass may be a minimum mass (M sin i), so the gravity is labeled with
that uncertainty (see `EXOPLANETS_DATA_SOURCES.md`). **No surface gravity is shown for the
gas-giant vantage**, because there is no surface to stand on.

### Irradiance and equilibrium temperature

The committed insolation (`insol`, in Earth flux) and equilibrium temperature (`eqt_k`,
Kelvin) are reused directly; `equilibriumTempK(...)` is available to recompute the
equilibrium temperature from luminosity, distance and an assumed albedo where useful. These
are real, cited or computed conditions, labeled as such. TRAPPIST-1 e has a committed
equilibrium temperature of 250 K.

### The year (the only real time quantity)

The **orbital period** (`period_days`) is the year length, and it is the only real
time-of-cycle quantity on this tab (TRAPPIST-1 e: about 6.1 days; Proxima Centauri b: about
11.2 days). There is **no measured day length and no local clock.**

### The accuracy bound (load-bearing)

- **Apparent sizes and gravity:** exact geometry and Newtonian gravity from committed
  measured values; as precise as the archive values, and no more. Where a value is null the
  quantity is not shown.
- **Stellar radius fallback:** the Stefan-Boltzmann derivation is standard physics; it is
  labeled as derived, and hand-checked against tabulated `st_rad` for stars that have both.
- **Equilibrium temperature:** a blackbody model heated by the host star (the archive's own
  definition of `pl_eqt`); it is not a surface temperature and is not presented as one.
- **Tidal lock and rotation:** the lock is an inference, the day length is unmeasured; the
  UI must not present either as measured, and must show no local clock.

## REUSED / REAL

- **The NASA Exoplanet Archive parameters** in `public/data/exoplanets/systems.json`
  (`pscomppars`, verified live 2026-07-10 in Phase 8): stellar radius, temperature,
  luminosity, spectral type; planet radius, mass, orbital semi-major axis, orbital period,
  equilibrium temperature, insolation. Reused as measured facts, with nulls preserved. Full
  provenance in `EXOPLANETS_DATA_SOURCES.md`; the acknowledgment line is honored verbatim.
- **The `lib/exoplanets` helpers**, already validated (`lib/exoplanets.test.ts`):
  `starColor`, `habitableZone` / `conservativeHZ` / `optimisticHZ`, `equilibriumTempK`,
  `compositionClass`, `lsunFromLogLum`, and the stellar and orbital math beside them. Reused,
  not rewritten. The Phase 21 wrappers that assemble these into per-vantage state live in
  `lib/exo-surfaces.ts` (`hostStarSky`, `siblingDiscs`, `surfaceGravityG`, `hasSurface`,
  `irradianceEarths`, `tidalLockInference`, `yearInfo`, `exoSurfaceState`).

## ILLUSTRATIVE / INFERRED

Several elements are illustrative or rest on an inference and must be labeled honestly, or
the first-person view becomes a lie:

- **All terrain and ground.** No exoplanet surface has been imaged and there is no terrain
  data, so every piece of ground you stand on is our own original geometry, illustrative,
  labeled illustrative everywhere it appears.
- **All surface features.** Rocks, plains, ridges, any texture on the ground: illustrative,
  labeled.
- **The sky's fine texture and atmosphere rendering.** The star, the sibling discs, their
  sizes and the star color are real and computed; the fine texture of the sky, the haze and
  the atmosphere rendering around them are illustrative, labeled.
- **The tidal-lock day/night framing.** Tidal locking is an inference for close-in HZ planets
  around low-mass stars, so the permanent day side and permanent night side rest on that
  inference. Real consequence of the inference, still labeled as an inference.

Nothing else is approximated and nothing is invented. There is no fabricated measured value,
no faked surface image (none exists), no local clock presented as real, and no tidal lock or
day length presented as measured.

## Computed vs reused vs illustrative: the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Host star apparent size | **Computed (real)** | "Computed - 2*atan(R_star / orbital distance); TRAPPIST-1 e about 2.17 deg (about 4x our Sun)" |
| Host star color | **Computed (real)** | "Computed from stellar temperature (starColor); TRAPPIST-1 2566 K, deep salmon-red" |
| Stellar radius fallback | **Computed (derived), labeled** | "Derived from luminosity and temperature (Stefan-Boltzmann) where the archive has no radius" |
| Sibling planet discs | **Computed (real)** | "Computed - real radii and separations; TRAPPIST-1 siblings pass larger than our Moon" |
| Surface gravity (rocky) | **Computed (real)** | "Computed from measured mass and radius (rocky world); RV mass may be a minimum mass" |
| Irradiance / equilibrium temperature | **Computed / reused (real)** | "Measured / computed - insolation and blackbody equilibrium temperature (NASA Exoplanet Archive)" |
| Year length | **Computed (real)** | "Real - orbital period (the only measured time; no local clock exists)" |
| NASA Exoplanet Archive parameters | **Reused / real** | "Measured - NASA Exoplanet Archive (cite as requested)" |
| Tidal lock day/night | **Inferred, labeled** | "Inference, not a measurement - close-in worlds around cool stars are expected to be tidally locked; permanent day and night sides follow from this" |
| Local time-of-day | **Not shown** | "Rotation and day length are not measured; no local clock (unlike Mars)" |
| All terrain / ground | **Illustrative (original)** | "Illustrative - no exoplanet surface has ever been imaged; this ground is imagined" |
| Surface features | **Illustrative** | "Illustrative, not an observation" |
| Sky fine texture / atmosphere | **Illustrative** | "The star, discs, sizes and colors are real; the fine texture is illustrative" |
| Gas-giant vantage | **Honest counterpart** | "No solid surface to stand on; cloud-deck viewpoint, no standing-on gravity" |

Rules carried over from Earth / Mars / Moon / planets / small bodies / moons / interstellar /
Surfaces, unchanged:

- Every quantity on screen names its category and source (computed, reused/real, inferred, or
  illustrative).
- No invented values; nulls stay null and the dependent quantity is not shown; the sky is the
  real part and the ground is labeled illustrative; tidal lock is labeled an inference; no
  local clock is presented as real.
- The reused facts are the archive parameters and the `lib/exoplanets` helpers; the
  illustrative liberties are all terrain, all surface features, the sky's fine texture and the
  tidal-lock day/night framing, and every one is labeled.

## What is honestly showable this phase (crisp statement)

- **COMPUTED (real):** the host star's apparent angular size and color, the sibling-planet
  discs, surface gravity for rocky worlds, irradiance and equilibrium temperature, and the
  year length (orbital period).
- **REUSED (real):** the NASA Exoplanet Archive parameters in `systems.json` and the
  `lib/exoplanets` helpers (`starColor`, `habitableZone`, `equilibriumTempK`,
  `compositionClass` and the math beside them).
- **ILLUSTRATIVE (labeled):** all terrain and ground, all surface features, the sky's fine
  texture and atmosphere rendering, and the tidal-lock day/night framing (an inference).

What we deliberately do **not** do: claim any real exoplanet surface image (none exists),
present tidal locking as a measurement (it is an inference), show a local time-of-day (the
day length is not measured; only the year is real), show standing-on surface gravity on a
gas giant (there is no surface), invent a stellar radius where the archive is null (we derive
it from luminosity and temperature and label it, or omit it), or leave any terrain unlabeled.
This tab lets you stand on the **imagined, honestly labeled ground** of real, confirmed
exoplanets under a **genuinely computed sky**, with the computed / reused / illustrative
split stated on screen. It is the mirror image of the Mars and Titan tab: there the ground
was real and the sky was drawn; here the sky is real and the ground is drawn.
