# Satellites and Space Debris: Physics (Phase 41)

Verification date: **2026-07-30**. Companion to `SATELLITES_DATA_SOURCES.md`.
Everything computed lives in `lib/satellites.ts`, covered by **30 unit tests**
checked against the published characteristics of real objects (the ISS, a GPS
satellite, a geostationary satellite, a Molniya orbit) rather than against
previous runs of our own code.

> **Honesty rule (leads the page): the orbits are real, the positions are only as
> fresh as the element sets.** Every element set is a published CelesTrak GP
> record. Positions come from SGP4, the model those sets are defined for. But an
> element set decays in usefulness: SGP4 along-track error grows by roughly
> 1-3 km per day from epoch, so the tab shows each set's age and states the
> expected error in plain words instead of implying a precise position.

## Summary table

| Quantity | Method | Honest accuracy |
| --- | --- | --- |
| Semi-major axis | Kepler's third law, `a = (mu / n^2)^(1/3)` | Exact for the mean elements given. Reproduces 42,164 km for a geostationary satellite and ~6,795 km for the ISS; tested. |
| Orbital period | `86400 / n` seconds | Exact for mean elements. 92.9 min for the ISS, 1,436 min (a sidereal day) for GEO. |
| Perigee / apogee altitude | `a(1 ± e) − R_earth` | Uses the WGS-84 **equatorial** radius and a spherical Earth, the usual catalogue convention. Not a geoid height, so a low near-circular orbit can read a few km from a more careful figure. |
| Speed | Vis-viva, `v = sqrt(mu (2/r − 1/a))` | Exact two-body. 7.66 km/s for the ISS, 3.07 km/s for GEO; tested. Ignores drag and perturbations, which matter over time, not instantaneously. |
| Orbit regime | Conventional altitude/eccentricity/inclination bands | **A convention, not physics.** See below. |
| Altitude shells | Histogram of mean altitude | Exact count of the *shipped* objects; read with the sampling note in mind. |
| Position | SGP4 via `satellite.js` | The right model for these elements. Accuracy degrades with element-set age; surfaced per object. |

## Mean motion is per solar day, and that bites

Mean motion in these element sets is **revolutions per solar day** (86,400 s),
not per sidereal day. This is exactly why a geostationary satellite's mean motion
is about **1.0027** rather than 1.0000: its physical period is one *sidereal* day
(86,164 s), but the count is expressed per solar day.

Getting this wrong is a quiet, plausible-looking error, so it is pinned by tests.
Using the sidereal day instead would put a geostationary orbit **76 km too low**
(42,088 km instead of 42,164 km) and shorten the ISS period by about a quarter of
a minute. Both cases are asserted against their published values, which is how the
bug was caught during development in the first place.

## Regime classification is a convention

`classifyRegime` reports LEO / MEO / GEO / HEO using the conventional bands:

- **LEO**: apogee below 2,000 km
- **GEO**: mean altitude within 1,500 km of 35,786 km **and** near-circular
  (e < 0.01) **and** near-equatorial (|i| < 15°)
- **HEO**: eccentricity ≥ 0.25, which is what Molniya and GTO transfer orbits
  look like
- **MEO**: everything in between

These boundaries are choices, not laws, and the GEO test is deliberately strict
about plane and circularity: an object at geostationary *altitude* but inclined
55° is geosynchronous, not geostationary, and is reported as MEO. That case is
tested.

## What is deliberately not computed

- **No conjunction screening.** Public GP element sets carry no covariance, so a
  responsible close-approach probability cannot be computed from them. The tab
  shows congestion by altitude shell, which the data *can* support, and says
  plainly that it is not predicting collisions.
- **No decay predictions.** The BSTAR drag term is shipped and used by SGP4, but
  we do not turn it into a re-entry date; that needs atmospheric density
  modelling and solar-activity forecasts well beyond what this tab claims.
- **No Keplerian shortcut for position.** `lib/satellites.ts` computes geometry
  only. Propagating these elements with plain two-body motion would visibly
  disagree with the model they were fitted to, so SGP4 does the propagating.

## The debris story the data actually tells

Three real fragmentation events are shipped complete, and the contrast between
them is the honest headline rather than a scare statistic:

- **Fengyun-1C** (2007 anti-satellite test): **1,924** fragments still tracked.
- **Iridium 33** (2009 accidental collision with Cosmos 2251): **110** still tracked.
- **Cosmos 1408** (2021 anti-satellite test): only **3** still tracked, because it
  happened at a low enough altitude that atmospheric drag has removed most of it.

That is a real, checkable point about altitude and orbital lifetime: debris low
enough re-enters, debris high enough does not. The tab makes that comparison
instead of asserting a total debris population it cannot see (see the
data-sources note on untracked fragments).

## Null-safety contract

Every exported function returns `null` (or `[]` for the list helpers) on
non-finite, zero, negative or physically impossible input, and never throws. This
is unit tested per function, including eccentricity ≥ 1, a radius outside the
orbit, and an unparseable epoch.
