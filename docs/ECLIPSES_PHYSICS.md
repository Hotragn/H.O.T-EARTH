# Eclipses: Physics (Phase 42)

Verification date: **2026-07-30**. Companion to `ECLIPSES_DATA_SOURCES.md`.
Everything computed lives in `lib/eclipses.ts`, covered by **27 unit tests**
checked against famous, widely documented eclipses rather than against previous
runs of our own code.

> **Honesty rule (leads the page): we do not predict eclipses, we ship the
> published canon.** Every date, type, saros number, magnitude, duration and
> greatest-eclipse coordinate is a row from NASA's Five Millennium Canon
> (Espenak & Meeus). Predicting eclipses properly needs Besselian elements and
> per-observer local circumstances; a naive implementation yields times that look
> right and are wrong. So the catalogue is the data, and this module computes only
> what follows from it unambiguously.

## Summary table

| Quantity | Method | Honest accuracy |
| --- | --- | --- |
| Next / upcoming eclipse | Filter and sort the catalogue by tabulated time | Exact, within the TD-vs-UT caveat below. |
| Days until | `(t − now)` in days | Exact. |
| Saros series | Group by the tabulated saros number | Exact (the series number is published, not inferred). |
| Saros interval | Mean gap between consecutive members | Falls out of the data at **6585.3 days**, matching the saros. A real check on the parse. |
| Centrality | Bands on the tabulated `gamma` | The bands are a presentational convention; `gamma` itself is published. `\|gamma\| > 1` genuinely means the axis misses Earth. |
| Duration label | Format the published central duration | Exact. 2m40s for 2017, 4m28s for 2024, 6m23s for 2027; all tested. |
| Distance to greatest eclipse | Haversine on a spherical Earth (R = 6371.0088 km) | Good to a few tenths of a percent versus an ellipsoidal geodesic. **Not a visibility calculation.** |

## Times are Terrestrial Dynamical Time

The canon tabulates TD of greatest eclipse and we store exactly that, alongside
the source's ΔT column. TD is ahead of UT by roughly 75 seconds this century, so
every time shown is within a couple of minutes of civil time and not correct to
the second. We label the scale rather than convert, because a sloppy conversion
would be a false precision.

## What gamma means, and why it explains the rest of the row

`gamma` is the least distance of the shadow axis from Earth's centre, in Earth
radii. It quietly explains most of a row:

- `|gamma|` near **0**: the axis passes near the centre, the path crosses low
  latitudes, and totality tends to be long. The 2027 eclipse has gamma 0.142 and
  runs 6m23s.
- `|gamma|` near **1**: the axis grazes a pole, so the path is pushed to high
  latitude and totality is short. The 2026 eclipse has gamma 0.898, greatest
  eclipse at 65°N, and lasts 2m18s.
- `|gamma| > 1`: the axis misses Earth altogether, which is why such an eclipse
  can only ever be partial somewhere near a pole.

Those three cases are asserted in the tests, including that the high-gamma 2026
eclipse really does have its greatest point above 60°N.

## Eclipse types

**Solar.** Total (the Moon covers the Sun, corona visible), annular (the Moon is
too far to cover it, leaving a ring), hybrid (annular at some points along the
path and total at others), partial (the axis misses Earth).

**Lunar.** Total (the Moon fully inside the umbra, usually red from sunlight
refracted through Earth's atmosphere), partial (part of the Moon in the umbra),
penumbral (only the faint outer shadow, easy to miss).

Magnitudes come straight from the canon: solar magnitude above 1 means the Moon's
disc more than covers the Sun's; lunar **umbral** magnitude above 1 means the Moon
is entirely inside the umbra.

## What is deliberately not computed

- **No paths.** A canon row gives one greatest-eclipse point plus the path width,
  not the track. We plot that point and label it; we never draw a path we do not
  have.
- **No local circumstances or visibility.** `greatCircleKm` answers "how far away
  is the greatest-eclipse point", nothing more. Its doc comment, its caption and
  the exported `VISIBILITY_CAVEAT` string all say so, and a test asserts the
  caveat still says it. Real visibility needs the path and observer geometry.
- **No re-derivation of the predictions.** By design; see the honesty rule.

## Null-safety contract

Every exported function returns `null` (or `[]` for the list helpers) on
non-finite, missing or unparseable input and never throws. Tested per function,
including an invalid `Date`, an unparseable timestamp, a NaN saros number and a
series with fewer than two members.
