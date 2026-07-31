# Eclipses: Data Sources (Phase 42)

Verification date: **2026-07-30**. Companion to `ECLIPSES_PHYSICS.md`.

## The catalogue

| Field | Value |
| --- | --- |
| Source | NASA **Five Millennium Canon of Solar and Lunar Eclipses** (Espenak & Meeus) |
| Solar table | `https://eclipse.gsfc.nasa.gov/SEcat5/SE2001-2100.html` |
| Lunar table | `https://eclipse.gsfc.nasa.gov/LEcat5/LE2001-2100.html` |
| Span shipped | **2001-2100** |
| Retrieved | 2026-07-30 |
| Shipped file | `public/data/eclipses/canon.json` (about 82 KB) |
| Solar eclipses | **224** (67 of them total) |
| Lunar eclipses | **228** |
| Credit | Eclipse predictions by Fred Espenak and Jean Meeus, NASA's Goddard Space Flight Center |
| Licence | NASA GSFC eclipse predictions are US Government work in the public domain. The site asks that the authors be credited, which is done in the UI and here. |

### Fields kept

**Solar**: catalogue id, TD of greatest eclipse, ΔT, saros series, type
(T/A/H/P) and its qualifier, gamma, eclipse magnitude, latitude and longitude of
greatest eclipse, Sun altitude there, path width in km, central duration.

**Lunar**: catalogue id, TD of greatest eclipse, ΔT, saros series, type
(T/P/N) and qualifier, gamma, penumbral and umbral magnitudes, penumbral /
partial / total durations in minutes, and the latitude and longitude of greatest
eclipse.

Missing values in the source (a dash, e.g. no central duration for a partial
eclipse) are stored as `null` and rendered as unknown. Nothing is interpolated.

## Times are TD, and we say so

The canon tabulates the **Terrestrial Dynamical Time** of greatest eclipse, and
that is exactly what we store, together with the source's own ΔT column. TD runs
ahead of UT by about 75 seconds this century, so these times are within a couple
of minutes of civil time, not correct to the second. The file records this in
`meta.timeScale` and the tab repeats it. We deliberately do not silently convert:
doing the conversion badly is worse than labelling the scale honestly.

## Why we ship a catalogue instead of predicting

Computing eclipses properly means Besselian elements, the Moon's and Sun's
apparent positions to arcsecond accuracy, and local circumstances per observer.
A naive implementation produces times that look plausible and are wrong, which is
exactly the failure mode this project exists to avoid. So the authoritative
published canon is the data, and `lib/eclipses.ts` computes only what follows
from it unambiguously (which eclipse is next, saros grouping, centrality from the
tabulated gamma, distances).

## What this tab does NOT contain

- **No eclipse paths.** The canon row gives the single greatest-eclipse point and
  the path width, not the path polygon. We plot that one point and say so; we do
  not draw or imply a track across the map.
- **No local circumstances or visibility.** Whether an eclipse is visible from
  your location, and at what time and magnitude, needs the path and observer
  geometry. `greatCircleKm` gives the distance to the greatest-eclipse point and
  is documented, named and captioned as **not** a visibility calculation, with a
  link out to NASA's page for that eclipse.
- **No weather or observing forecast.**
- **No eclipse imagery.** Nothing here is presented as a photograph of a
  specific eclipse.

## Cross-references

- `MOON_PHYSICS.md` covers the lunar phase and libration computed elsewhere in
  the app. Eclipses are syzygies near a node, so the Moon tab and this one are
  describing the same geometry from different angles.
- `NIGHT_SKY_PHYSICS.md` and `lib/solar.ts` cover the solar-position work the app
  does compute from first principles.

## Reproducing the data file

```sh
curl -s "https://eclipse.gsfc.nasa.gov/SEcat5/SE2001-2100.html" -o se.html
curl -s "https://eclipse.gsfc.nasa.gov/LEcat5/LE2001-2100.html" -o le.html
```

Then strip the HTML tags from the `<pre>` tables, split each row on whitespace,
and map the columns as listed above. Coordinates arrive as `65S` / `87E` and
durations as `02m20s`; both are normalised to signed degrees and seconds.

### A sanity check worth repeating

After parsing, the mean interval between consecutive members of a saros series
should come out at **6585.3 days** (18 years 11 days 8 hours). It does, to within
a fraction of a day, which is a genuine check that both the parse and the data
are sound rather than a check of our code against itself. This is asserted in
`lib/eclipses.test.ts`.
