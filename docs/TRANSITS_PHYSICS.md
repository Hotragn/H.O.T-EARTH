# Transits: Physics (Phase 44)

Verification date: **2026-07-31**. Everything computed lives in `lib/transits.ts`,
covered by **35 unit tests** checked against textbook values and published
measurements rather than against previous runs of our own code.

> **Honesty rule (leads the page): a transit measures a ratio, not a planet.**
> Depth gives Rp/Rs and nothing else, so a planet's absolute size is only as well
> known as its star's radius: a 10% error in Rs is a 10% error in Rp. Depth says
> nothing at all about mass, which needs radial velocities. The tab states this
> where the numbers appear, and a test asserts the caveat still says it.

## Data: no new fetch

This world adds no data. It reads the NASA Exoplanet Archive subset already
shipped for the Exoplanets tab (`public/data/exoplanets/systems.json`), which
carries measured planet radii, host-star radii, periods and semi-major axes for
62 systems and 171 planets. **75** of those planets were discovered by transit and
have both radii known; those are the ones this tab draws.

Provenance, licensing and retrieval for that file are recorded in
`EXOPLANETS_DATA_SOURCES.md`. Nothing here re-states or overrides it.

## Summary table

| Quantity | Method | Honest accuracy |
| --- | --- | --- |
| Transit depth | `(Rp/Rs)^2` | Exact given the radii. 84 ppm for Earth across the Sun, ~1.1% for Jupiter; both tested. |
| Depth in ppm | `depth × 1e6` | Exact. |
| Planet radius from depth | `sqrt(depth) × Rs` | Exact algebra; inherits the stellar radius error one-for-one, which is tested explicitly. |
| Transit duration | `(P/π)·asin(Rs/a)`, in hours | **Central crossing of a circular orbit**, ignoring the planet's own radius. A real off-centre transit is shorter, so this is the maximum for the geometry. ~3.1 h for HD 209458 b against a published ~3.0; ~36 min for TRAPPIST-1 b. |
| Transit probability | `Rs/a` | Standard geometric estimate for a circular orbit and random orientation. ~11% for a hot Jupiter, ~1 in 215 for an Earth analogue. |
| Light curve shape | Trapezoid from depth and duration | **Schematic.** See below. |

## Units, and the one that bites

The catalogue mixes units: planet radii in **Earth** radii, star radii in
**solar** radii, orbits in **AU**. So the ratio needs a conversion, and getting it
wrong is silent:

- `R_SUN_IN_R_EARTH = 109.0762` (IAU nominal 695,700 km / 6,378.1 km)
- `R_SUN_IN_AU = 0.00465047`

A test pins the first against `695700 / 6378.1` so it cannot drift, and the Earth
84 ppm check would fail loudly if the conversion were dropped.

## Why M dwarfs are surveyed

The tab's most useful comparison falls straight out of the arithmetic, and it is
all real:

- Earth across the Sun: **84 ppm**
- Jupiter across the Sun: **~1.1%**, about 126 times deeper
- TRAPPIST-1 b, an Earth-sized planet across a 0.12 R☉ star: **~0.74%**

An Earth-sized planet is ~90 times easier to detect in front of a tiny star than
in front of the Sun. That is why small cool stars dominate small-planet
discoveries, and the tab makes the point with three computed numbers instead of
asserting it.

## The light curve is schematic, and labelled so

`lightCurve` returns a flat-bottomed trapezoid: ingress, a flat floor at the
computed depth, egress, with ingress duration set by Rp/Rs.

Real transit curves are **round-bottomed**, because a star is limb-darkened and
brighter at its centre than its edge. We do not model limb darkening, so:

- the **depth and width are computed from measured values** and are meaningful,
- the **shape is schematic** and is captioned as such in the UI.

This is the same split the Gravitational Waves tab uses for its chirp: the
quantities are real, the drawing is honest about being a drawing.

## What is deliberately not computed

- **No mass, no density, no composition.** Transits do not measure mass. Where the
  catalogue has a measured mass it comes from other work and is labelled as
  catalogue data, not derived here.
- **No impact parameter or inclination.** Not in the shipped subset, so durations
  are the central-crossing maximum rather than the actual observed duration.
- **No limb darkening, no secondary eclipse, no transit timing variations.**
- **No hypothetical transits.** Planets found by radial velocity or imaging are
  excluded rather than shown with an invented transit, because most of them do not
  transit from our line of sight at all. `transitable` enforces this and is tested.

## Null-safety contract

Every exported function returns `null` (or `[]` for the list and curve helpers) on
non-finite, zero, negative or physically impossible input, and never throws.
Tested per function, including a star larger than its planet's orbit and a
transit-discovered planet with no measured radius.
