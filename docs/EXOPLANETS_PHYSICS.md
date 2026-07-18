# Exoplanets Physics & Honest-Representation Methodology (Phase 8)

Companion to `docs/EXOPLANETS_DATA_SOURCES.md`. Same non-negotiable bar as Earth, Mars, the Moon and the other-planets phases (`physics-env-simulation` skill): **real physics and real data, or it doesn't ship. No invented numbers.** This doc states exactly what is **MEASURED**, what is **COMPUTED**, and what is **ILLUSTRATIVE** for the exoplanets phase.

Verification date: **2026-07-10**. Data: NASA Exoplanet Archive `pscomppars` (see the data-sources doc for the TAP query, columns and units).

## The overriding honesty rule for this phase

**Exoplanets have essentially NO surface imagery.** Nobody has a photograph of an exoplanet's surface; none exists and none is coming soon. So the honest, still-remarkable substance of this phase is:

1. **MEASURED parameters** — orbital period, radius and/or mass, distance, host-star properties, equilibrium temperature and insolation where the archive provides them;
2. **System architecture** — how many planets, their spacing, resonances, where the star's habitable zone falls;
3. **COMPUTED context** — the habitable zone from stellar luminosity, an equilibrium temperature when the archive lacks one, a coarse composition guess from mass+radius;
4. **ILLUSTRATIVE appearance** — any rendered look of a planet is an artist/procedural illustration, clearly labeled, **never** presented as an observation.

We invent nothing. Where the archive has no value, `systems.json` carries `null` and the UI shows "no measured value," not a guess.

## Three structural facts that shape everything

1. **No surface maps exist for any exoplanet.** Not one. Every "planet" texture/appearance is illustrative. The only planets ever *detected in an image* — HR 8799 b/c/d/e, Beta Pictoris b/d, 51 Eridani b in our set — are **unresolved point sources** (a few pixels of reflected/thermal light next to a masked star), **not resolved disks or maps**. "Directly imaged" means "we saw a dot," not "we mapped it."
2. **Masses are often minimum masses.** The archive's `pl_bmasse` ("best mass") is, for radial-velocity planets without a transit, frequently only **M·sin i** — a *minimum* mass, because the orbital inclination is unknown. Radii (`pl_rade`) come from transit depth and require the planet to transit. So for many planets we have a radius **or** a (minimum) mass, not both, and density/composition is uncertain.
3. **Many parameters carry large uncertainties**, and `pscomppars` is a *composite* (values can come from different papers). Equilibrium temperatures depend on an assumed albedo; imaged-giant masses depend on evolutionary models; semi-major axis for imaged/microlensing planets is a **projected separation**, not a true orbit size. We present these as measured-but-uncertain, never as exact.

## MEASURED — what comes straight from the archive (per planet / per star)

Stored verbatim (rounded, never altered) in `systems.json`:

| Quantity | Field | Archive column | Unit | Notes / caveat |
|---|---|---|---|---|
| Orbital period | `period_days` | `pl_orbper` | days | Usually very precisely measured (transits/RV). |
| Semi-major axis | `sma_au` | `pl_orbsmax` | AU | **Projected separation** for imaged/microlensing planets. |
| Eccentricity | `ecc` | `pl_orbeccen` | — | Often `null` (assumed 0 when unconstrained → we leave it `null`, not 0, unless the archive gives 0). |
| Planet radius | `radius_re` | `pl_rade` | Earth radii | From transit depth; requires a transit. |
| Planet mass | `mass_me` | `pl_bmasse` | Earth masses | **Often a MINIMUM mass (M·sin i)** for RV-only planets. |
| Equilibrium temp | `eqt_k` | `pl_eqt` | Kelvin | Black-body model; **assumes an albedo**, ignores greenhouse — not a surface temperature. |
| Insolation | `insol` | `pl_insol` | Earth flux (Earth = 1) | Stellar flux received vs Earth. |
| Discovery method / year | `method`, `disc_year` | `discoverymethod`, `disc_year` | — | Transit, Radial Velocity, Imaging, Microlensing, etc. |
| Distance | `distance_pc` | `sy_dist` | parsecs | Mostly from Gaia parallax; very reliable for nearby stars. |
| Spectral type | `star.spectype` | `st_spectype` | — | Morgan–Keenan; sometimes `null`. |
| Stellar Teff / radius / mass | `star.teff/rad/mass` | `st_teff/st_rad/st_mass` | K / R⊙ / M⊙ | Host-star fundamentals. |
| Stellar luminosity | `star.lum` | `st_lum` | **log₁₀(L⊙)** | It's a **base-10 log** — exponentiate before using it (see below). |

These are **measurements**, presented as such. The `directly_imaged` boolean (`discoverymethod == "Imaging"`) is the one derived flag on a planet, and it is honest: it marks the planets that were *detected in an image as an unresolved point*, nothing more.

## COMPUTED — derived in the app (labeled "computed"), not stored as data

None of these overwrite or masquerade as archive measurements. They are transparent calculations from measured inputs.

### 1. Habitable zone (from stellar luminosity)
The circumstellar **habitable zone (HZ)** — where a rocky planet *could* sustain liquid surface water given the right atmosphere — is computed from the host star, not measured:
- **First, exponentiate:** `L/L☉ = 10 ** star.lum` (because `st_lum` is log₁₀). Forgetting this is the classic bug.
- **Simple first-order bound (equilibrium-flux):** inner/outer edges scale as `d = sqrt(L / S)` in AU, with `S` the insolation limits (e.g. a "conservative" HZ roughly `S_inner ≈ 1.1`, `S_outer ≈ 0.35` in Earth-flux units).
- **Better (recommended):** the **Kopparapu et al. (2013/2014)** parameterization, which makes the flux limits a function of stellar `Teff` (recentVenus/runaway-greenhouse inner edge; maximum-greenhouse/early-Mars outer edge). Cite it in the UI.
- **How to show it honestly:** label "**Computed habitable zone** (Kopparapu et al. 2013)" and note it is a **climate-model boundary about the star**, not a claim that any specific planet is habitable. A planet's `insol` (measured) can be compared against the HZ flux limits to say "receives X× Earth's flux."

### 2. Equilibrium temperature (when the archive lacks `pl_eqt`)
When `pl_eqt` is `null` but we have `star.teff`, `star.rad` and `sma_au`, the black-body equilibrium temperature is:

```
T_eq = T_eff * sqrt(R_star / (2 a)) * (1 - A)^(1/4)
```

with `R_star` and `a` in the same units and `A` an assumed **Bond albedo** (state the assumed value, e.g. A = 0 or 0.3). This is standard, but **it is a model**: it ignores atmospheres/greenhouse entirely (Earth's real surface is ~288 K vs a ~255 K equilibrium value). Label it "**computed equilibrium temp, assumes albedo A = …, no greenhouse**," and prefer the archive's `pl_eqt` when present.

### 3. Composition guess (from mass + radius)
When **both** a radius and a *true* mass exist, mean density `ρ = M / (4/3 π R³)` places the planet on a **mass–radius diagram** against theoretical curves (iron, rock/silicate, water, H/He envelope). This gives a **coarse category** — "consistent with a rocky composition," "requires a volatile/gas envelope" — never an exact interior.
- Honesty guards: **do not** run this when the mass is a **minimum mass** (M·sin i) or when only one of mass/radius exists — the density would be meaningless. Label output "**composition guess from mass–radius**," a category, with the model curves cited (e.g. Zeng et al. 2016). Interiors of exoplanets are **inferred**, never measured.

### 4. Unit conversions
`distance_ly = distance_pc × 3.26156` (parsecs → light-years) — the only conversion stored in the JSON. Orbit geometry for an orrery view (angular position vs time) is computed from `period_days`/`sma_au`/`ecc` with standard Keplerian mechanics, same machinery as the Solar-System orrery — labeled "computed orbit."

## ILLUSTRATIVE — every planet's appearance

**There is no exoplanet surface imagery. Full stop.** So:

- Any globe/texture/color for an exoplanet in the app is an **illustration** — procedural or artist-made — chosen to be *consistent with* measured parameters (a hot ultra-short-period giant rendered glowing; an ice-giant-mass planet rendered blue-ish), and it must be **labeled "illustration — not an observation,"** always.
- The **directly-imaged** planets (HR 8799 b/c/d/e, Beta Pic b/d, 51 Eri b) may be shown with a note that they have been *detected in an image*, but the "image" is an **unresolved dot**; we must **not** render a fake surface for them and call it the image. If we show the actual discovery imagery, credit the observatory (e.g. Keck/Gemini/VLT) and label it "unresolved point source."
- **No fabricated weather, clouds, storms, city lights, or maps** for any exoplanet. None of that is measured. (Same rule that governed the gas giants in Phase 4, taken to its limit here.)
- Star colors may be derived from measured `st_teff` (black-body color temperature) — that is a legitimate computed illustration, labeled as color-from-temperature.

## Measured vs computed vs illustrative — the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Orbital period, semi-major axis, eccentricity | **Measured** | "Measured — NASA Exoplanet Archive" |
| Planet radius (transit) | **Measured** | "Measured radius (transit)" |
| Planet mass | **Measured** (often **minimum**) | "Measured mass" or "Minimum mass (M·sin i)" when RV-only |
| Equilibrium temp `pl_eqt` | **Measured/modeled** (archive value) | "Equilibrium temp (black-body model)" |
| Insolation, distance, host-star Teff/R/M/L/spectype | **Measured** | "Measured — archive / Gaia" |
| `directly_imaged` flag | **Measured** (detection fact) | "Directly imaged — unresolved point source, not a map" |
| Habitable zone | **Computed** | "Computed HZ (Kopparapu et al. 2013) — about the star" |
| Equilibrium temp when archive lacks it | **Computed** | "Computed T_eq, assumes albedo A=…, no greenhouse" |
| Composition category | **Computed** (guess) | "Composition guess from mass–radius (category only)" |
| Orbit animation, distance in ly, star color | **Computed** | "Computed — orbital mechanics / unit conversion" |
| Planet appearance / texture / color map | **Illustrative** | "Illustration — no exoplanet surface imagery exists" |
| Interior structure | **Model / inferred** | "Inferred — not directly measured" |

Rules carried over from every prior phase, unchanged:
- Every number on screen names its category and source.
- No invented values; if the archive has no value, the UI shows "no measured value," never a filled-in guess. (`systems.json` stores `null`.)
- Computed quantities (HZ, T_eq, composition) are always labeled computed and cite their model.
- **No fabricated imagery or weather.** Appearances are illustrations, labeled as such, forever.

## What is honestly showable this phase (crisp statement)

- **MEASURED:** for 62 curated systems / 171 planets — orbital period, semi-major axis, eccentricity (where known), radius and/or mass (mass often a minimum), equilibrium temperature and insolation (where the archive gives them), discovery method + year, system distance, and full host-star parameters (spectral type, Teff, radius, mass, luminosity). Plus the architecture: planet counts, spacings, resonant chains (TRAPPIST-1, HD 110067), the most Solar-System-like count (Kepler-90 = 8), and the nearest systems to the Sun.
- **COMPUTED (labeled, model cited):** each star's habitable zone (from `10^st_lum` + Teff, Kopparapu 2013); equilibrium temperature where the archive lacks it (assumed albedo, no greenhouse); a coarse composition category from mass–radius (only when a *true* mass and radius both exist); orbit animation and pc→ly.
- **ILLUSTRATIVE (labeled):** every planet's appearance — no surface imagery exists. The 7 directly-imaged planets are unresolved dots, not maps.

What we deliberately do **not** show for any exoplanet: a surface map, live weather, invented storms/clouds, a fabricated "photo," a true mass presented as certain when only a minimum is known, or a habitability claim about a specific planet. The honest, still-astonishing content is measured parameters + system architecture + computed context — which is exactly what makes 171 real worlds worth exploring.
