# Small-Bodies Physics & Honest-Representation Methodology (Phase 9)

Companion to `docs/SMALL_BODIES_DATA_SOURCES.md`. Same non-negotiable bar as Earth, Mars, the Moon, the other-planets, dwarf-planets and exoplanets phases (`physics-env-simulation` skill): **real physics and real data, or it doesn't ship. No invented numbers.** This doc states exactly what is **MEASURED**, what is **COMPUTED**, and what is **ILLUSTRATIVE** for the comets-and-near-Earth-asteroids phase — and how the hazard facts (close approaches, PHA status) are framed **factually**.

Verification date: **2026-07-10**. Data: NASA/JPL Small-Body Database (SBDB) API v1.3 + JPL/CNEOS Close-Approach Data (CAD) API v1.5 (see the data-sources doc for endpoints, fields and units).

## The overriding honesty rule for this phase

**Most small bodies have NO surface imagery.** There is no photograph of the surface of the overwhelming majority of asteroids and comets, and none is coming for most of them. So the honest, still-remarkable substance of this phase is:

1. **MEASURED parameters** — orbital elements (a, e, q, Q, i, Ω, ω, period), physical parameters (diameter, rotation period, albedo, spectral type, absolute magnitude), Earth MOID, and real close-approach distances/velocities, all straight from JPL;
2. **CLASSIFICATION** — the NEA dynamical class (Apollo/Aten/Amor/Atira), comet family (Jupiter-family / Halley-type / Encke-type / long-period), the PHA flag, and the interstellar/hyperbolic distinction;
3. **COMPUTED context** — orbit propagation and position from the elements, perihelion/aphelion geometry, the anti-sunward direction of a comet's tail, lunar-distance conversions;
4. **ILLUSTRATIVE appearance** — any rendered look of a small body is an illustration, clearly labeled, **never** presented as an observation (even for the visited bodies, whose true shapes are complex models — see below).

We invent nothing. Where JPL has no value, `objects.json` carries `null` and the UI shows "no measured value," not a guess.

## Four structural facts that shape everything

1. **Almost no small body has a real surface map.** Of the 45 curated objects, **23 have been visited** by a spacecraft (real shape models / mosaics exist for those); the other **22 have never been resolved** — they are points of light, and any rendered globe/lump is an illustration. **Even the visited ones are irregular, non-spherical bodies** (67P's "rubber duck," Itokawa's sea-otter shape, Bennu's spinning top, Eros's peanut): a smooth sphere or generic lump is an **approximation** of a complex shape model, and must be labeled as such — not "the asteroid."
2. **Comet appearance is dominated by the coma and tail, which are NOT a surface.** The bright object you see is gas and dust flowing off a small (often km-scale) nucleus. A comet's `diameter` (when SBDB has one) is the **nucleus** estimate; the coma/tails are transient, illuminated, anti-sunward structures — physics to be *computed and labeled*, not a body surface.
3. **Orbital elements are osculating and epoch-specific.** SBDB returns the best-fit *osculating* ellipse (or hyperbola) at a solution epoch. These are genuine measurements, but they are a snapshot at time T; propagating them forward/back is standard two-body (or perturbed) mechanics, not a new measurement. For resonant or long-period bodies the osculating values differ slightly from mean values (flagged in the data).
4. **Interstellar objects (e > 1) are unbound — passing through, not orbiting.** 1I/'Oumuamua and 2I/Borisov are on genuinely hyperbolic paths (negative semi-major axis, no aphelion, no period): they came from interstellar space and are leaving, never to return. This is a different physical situation from a bound orbit and is flagged distinctly — and separately from the *near-parabolic Oort-cloud* comets whose osculating e is marginally > 1 but which are Sun-bound (§ Interstellar, below).

## MEASURED — what comes straight from JPL (per object)

Stored verbatim (rounded, never altered) in `objects.json`:

| Quantity | Field | SBDB source | Unit | Notes / caveat |
|---|---|---|---|---|
| Semi-major axis | `elements.a` | `a` | au | **Negative for hyperbolic orbits.** |
| Eccentricity | `elements.e` | `e` | — | **≥ 1 ⇒ unbound / hyperbolic.** |
| Perihelion distance | `elements.q` | `q` | au | Closest approach to the Sun. |
| Aphelion distance | `elements.Q` | `ad` | au | `null` for hyperbolic (no aphelion). |
| Inclination | `elements.i` | `i` | deg | To the ecliptic (J2000). |
| Long. of ascending node | `elements.om` | `om` | deg | |
| Argument of perihelion | `elements.w` | `w` | deg | |
| Orbital period | `elements.period_yr` | `per`/365.25 | years | `null` for hyperbolic. |
| Earth MOID | `elements.moid_au` | `moid` | au | Minimum orbit-intersection distance — a *measured* PHA input. |
| Tisserand param (Jupiter) | `elements.t_jup` | `t_jup` | — | Dynamical discriminator (asteroid vs comet-like). |
| Diameter | `physical.diameter_km` | `diameter` | km | Often `null`; nucleus size for comets. |
| Rotation period | `physical.rotation_h` | `rot_per` | h | Often `null`. |
| Albedo | `physical.albedo` | `albedo` | — | Geometric albedo; often `null`. |
| Spectral type | `physical.spectral` | `spec_T`/`spec_B` | — | Tholen preferred, else SMASSII; often `null`. |
| Absolute magnitude | `physical.H` | `H` | mag | Asteroids; comets usually `null`. |
| Comet total magnitude | `physical.comet_total_mag_M1` | `M1` | mag | Comets only. |

Plus the **classification** flags, all from SBDB and **not recomputed**: `kind` (comet/asteroid), `class` {code, name} (Apollo/Aten/Amor/… or JFc/HTC/ETc/COM/HYP/HYA), `pha` (boolean), `neo` (boolean). These are **measurements / authoritative catalog facts**, presented as such.

## COMPUTED — derived in the app (labeled "computed"), not stored as measurement

None of these overwrite or masquerade as JPL measurements. They are transparent calculations from measured inputs.

### 1. Orbit propagation & position
An object's position at a given time is computed from its osculating elements with standard **Keplerian two-body mechanics** (solve Kepler's equation for the eccentric/hyperbolic anomaly, then true anomaly and radius), the same machinery as the Solar-System orrery. Label "**computed orbit** (osculating elements at epoch <JD>)." For hyperbolic orbits (`e ≥ 1`) the hyperbolic-anomaly form is used (no period; the body traverses the branch once).

### 2. Perihelion / aphelion geometry
`q` and `Q` are provided by SBDB, but the geometric relations `q = a(1−e)` and `Q = a(1+e)` (bound orbits only) let the app draw the orbit's extremes and check consistency. Label "computed from a, e." For hyperbolic orbits there is **no aphelion** — do not draw one.

### 3. Comet tail direction (anti-sunward)
A comet's ion and dust tails point **away from the Sun** (radiation pressure + solar wind), *not* trailing the direction of motion. If the app renders a tail, its direction is **computed** as the anti-sunward vector at the comet's current position, and labeled "**computed: tails point anti-sunward**." Tail length/brightness are **illustrative** (they depend on unpredictable activity) — never a measured quantity.

### 4. Unit conversions
- `dist_ld = dist_au × 149,597,870.7 / 384,400` (au → lunar distances) — the close-approach conversion stored in the JSON.
- `period_yr = period_days / 365.25` (the only element conversion stored).
- Apophis 2029 altitude context: geocentric-center distance − Earth radius (~6,378 km) ≈ ~31,600 km above the surface — a **computed** framing of the measured `dist`.

### 5. Size from H (only if shown, and clearly a range)
Where SBDB gives `H` but no `diameter`, an approximate diameter can be **estimated** from H and an assumed albedo (`D ≈ 1329 / √p_V × 10^(−H/5)` km). This is a **model estimate with a wide range** (albedo is the big unknown), must be labeled "**estimated diameter (assumes albedo = …)**," and must **never** overwrite or masquerade as SBDB's measured `diameter`. We do **not** store it in `objects.json`; the JSON keeps `null`.

## The PHA definition — stated factually

A **Potentially Hazardous Asteroid (PHA)** is defined by two measured thresholds:

> **Earth MOID < 0.05 au (~19.5 lunar distances) AND absolute magnitude H ≤ 22.0** (roughly ≳ 140 m across).

- "Potentially hazardous" is a **classification about orbit geometry and size**, *not* a prediction that the object will hit Earth. It means the object is **big enough and its orbit passes close enough to Earth's** to warrant tracking. The vast majority of PHAs have **no** meaningful impact probability in any relevant timeframe.
- We take the `pha` boolean **directly from SBDB** (which maintains the MOID and H) rather than recomputing it. In our set, **11 of 45** objects are PHAs.
- MOID (`elements.moid_au`) is shipped as a measured number so the UI can show *why* an object is or isn't a PHA (e.g. Apophis MOID ≈ 0.0001 au — extremely small).

## Hazard framing — the factual contract (neither sensationalized nor downplayed)

Close approaches and PHA status are **real** and must be shown with **real numbers and honest context**:

- **State the real number.** Distance in both au and lunar distances (and km / surface-altitude where it aids understanding), plus relative velocity in km/s, plus the date. These are measured/predicted CNEOS values.
- **Distinguish "close approach" from "impact."** A 0.5–5 lunar-distance pass by a tracked object is a routine, predictable flyby, not a threat. Say so plainly.
- **Apophis 2029 — the worked example (all real):** on **2029-04-13** (≈21:46 TDB) 99942 Apophis passes **~0.099 lunar distances** from Earth — geocentric **~38,000 km from Earth's center**, i.e. **~31,600 km above the surface** — at **~7.4 km/s**, and will be **naked-eye visible** from parts of Europe/Africa/Asia. Its **impact risk for 2029, 2036 and 2068 was RULED OUT** after March-2021 radar refined the orbit; **NASA removed Apophis from its impact-risk (Sentry) list.** State exactly that: a real, remarkable close pass, with the impact hazard **eliminated** — not a doomsday, not a non-event.
- **Bennu, honestly:** OSIRIS-REx-studied Bennu carries a **very small but non-zero cumulative impact probability** (order ~1-in-1,700 through ~2300, per JPL/OSIRIS-REx radio science) — *studied and low, spread over centuries, not imminent*. Report it as measured, with the timeframe, without alarm.
- **1997 XF11, historically:** in our close-approach list (2.42 LD, 2028). It caused a **1998 media impact scare that was quickly ruled out** once more observations refined the orbit — a good, factual illustration that early orbit uncertainty ≠ danger.
- **Do not** invent impact scenarios, "planet-killer" language, countdowns, or probabilities; and do **not** hide or soften a real close-approach distance. The measured numbers, in context, are the message.

## Interstellar & hyperbolic — the honest distinction

- **`hyperbolic: true`** (from `e ≥ 1`, null period/aphelion, negative a) marks **any unbound osculating orbit**. In our set: **4 objects** — 1I, 2I, C/2023 A3, C/2012 S1.
- **`interstellar: true`** marks **only 1I/'Oumuamua and 2I/Borisov** — objects that are unbound **by origin** (they arrived from another star with large hyperbolic excess velocity and are passing through the solar system once, never orbiting the Sun). Render/describe them as **"interstellar — unbound, passing through,"** and their appearance is illustrative ('Oumuamua's extreme elongation and Borisov's coma are the only real visual facts).
- **C/2023 A3 and C/2012 S1 (ISON) are NOT interstellar** despite `e > 1`: they are **near-parabolic Oort-cloud comets** (our own solar system's), Sun-bound in origin, with osculating e nudged just over 1 by planetary perturbations. Labeling them interstellar would be a factual error. This is the phase's version of "use the database's truth, don't let a class code overstate the claim."

## ILLUSTRATIVE — every un-imaged body's appearance (and even the visited ones' shapes)

**Most small bodies have no surface imagery. Full stop.** So:

- Any globe/texture/color for an un-imaged small body is an **illustration** — procedural or artist-made, chosen to be *consistent with* measured parameters (a dark carbonaceous body rendered near-black at ~0.04 albedo; a bright V-type rendered brighter), and it must be **labeled "illustration — not an observation,"** always.
- **Even the 23 visited bodies** are irregular, non-spherical objects known through complex **shape models**; a smooth sphere or generic lump is an **approximation** and must be labeled so ("approximate shape" / "based on the <mission> shape model"), never "the asteroid." Where a real mission mosaic/shape model is shown, credit the mission/observatory (e.g. Rosetta/OSIRIS-REx/Hayabusa2/Dawn/NEAR) and say it is real.
- **Comet comae and tails are illustrative in extent/brightness** (activity is unpredictable) though tail **direction** is computed (anti-sunward). No fabricated "surface weather" on any small body.
- **No fabricated moons, no invented craters, no fake city-light/atmosphere analogs.** Where a body genuinely has a moon (Ida→Dactyl, Didymos→Dimorphos, Dinkinesh→Selam, Florence→2 moons) or a real feature, it is stated as a fact in the `note`; otherwise nothing is added.

## Measured vs computed vs illustrative — the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Orbital elements a, e, q, Q, i, Ω, ω, period | **Measured** | "Measured — JPL SBDB (osculating, epoch <JD>)" |
| Earth MOID, Tisserand parameter | **Measured** | "Measured — JPL SBDB" |
| Diameter, rotation, albedo, spectral type, H / M1 | **Measured** | "Measured — JPL SBDB" (or "no measured value" where null) |
| Class (Apollo/Aten/Amor/JFc/HTC/…), PHA, NEO, kind | **Measured** (catalog fact) | "Classification — JPL SBDB" |
| Close-approach date / distance / velocity | **Measured / predicted** | "Predicted close approach — JPL/CNEOS CAD" |
| `interstellar` flag (1I, 2I) | **Measured** (physics fact) | "Interstellar — unbound, passing through" |
| `visited` flag + mission | **Curated** (historical record) | "Visited by <mission>" |
| Orbit position / propagation | **Computed** | "Computed orbit (osculating elements)" |
| Perihelion/aphelion geometry | **Computed** | "Computed from a, e" |
| Comet tail direction | **Computed** | "Computed — tails point anti-sunward" |
| Lunar-distance / year conversions, surface-altitude | **Computed** | "Computed — unit conversion" |
| Diameter-from-H (if ever shown) | **Computed** (estimate) | "Estimated diameter (assumes albedo = …)" |
| Un-imaged body appearance | **Illustrative** | "Illustration — no surface imagery exists" |
| Visited body rendered as sphere/lump | **Illustrative** (approx. of a shape model) | "Approximate shape — based on the <mission> shape model" |
| Comet coma/tail extent & brightness | **Illustrative** | "Illustrative — activity varies" |

Rules carried over from every prior phase, unchanged:
- Every number on screen names its category and source.
- No invented values; if JPL has no value, the UI shows "no measured value," never a filled-in guess. (`objects.json` stores `null`.)
- Computed quantities (orbit, tail direction, conversions) are always labeled computed.
- **No fabricated imagery, moons, features, or hazard scenarios.** Appearances are illustrations, labeled as such, forever.

## What is honestly showable this phase (crisp statement)

- **MEASURED:** for 45 curated bodies (16 comets, 29 asteroids) — full osculating orbital elements (a, e, q, Q, i, Ω, ω, period), Earth MOID and Tisserand parameter, and whatever physical parameters JPL has (diameter, rotation, albedo, spectral type, H / comet M1 — with `null` where it has none); the dynamical class, comet family, NEO and **PHA** flags; the interstellar flag for 1I and 2I; and **18 real upcoming Earth close approaches** (0.099–4.64 lunar distances, incl. Apophis 2029). Hazard facts are stated with real numbers.
- **COMPUTED (labeled):** orbit propagation/position from the elements; perihelion/aphelion geometry; a comet's anti-sunward tail direction; au→lunar-distance and days→years conversions; (optionally) a clearly-flagged diameter estimate from H.
- **ILLUSTRATIVE (labeled):** every un-imaged body's appearance; even visited bodies rendered as spheres/lumps are approximations of real shape models; comet coma/tail extent and brightness.

What we deliberately do **not** show for any small body: a fabricated surface map, invented craters/moons/features, a comet "surface" (the coma is not a surface), an impact countdown or "planet-killer" framing, a PHA presented as an incoming strike, or `e > 1` presented as "interstellar" when the body is a Sun-bound Oort-cloud comet. The honest, still-astonishing content is measured orbits + physical parameters + classification + real close-approach facts — which is exactly what makes 45 real worlds (and two visitors from other stars) worth exploring.
