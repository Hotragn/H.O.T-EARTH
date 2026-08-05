# Stars: Physics (Phase 43)

Verification date: **2026-07-30**. Companion to `STARS_DATA_SOURCES.md`.
Everything computed lives in `lib/stars.ts`, covered by **43 unit tests**: 39
against published stellar parameters, plus 4 that run against the real shipped
catalogue rather than a fixture.

> **Honesty rule (leads the page): the inputs are measured, the derived quantities
> are photometric estimates.** Magnitude, colour index, parallax distance and
> spectral type all come from Hipparcos-era measurement. Everything this module
> derives from them (temperature, luminosity, radius, mass, lifetime) is a
> textbook relation applied to broadband photometry, with no extinction or
> bolometric correction. That is fine for putting 8,787 real stars on an HR
> diagram; it is not a substitute for spectroscopy, and the tab says so where each
> number appears.

## Summary table

| Quantity | Method | Honest accuracy |
| --- | --- | --- |
| Absolute magnitude | `M = m - 5 log10(d_pc) + 5` | Exact given the measured parallax distance. Reproduces Sirius 1.45, Vega 0.58, Proxima ~15.5; all tested. |
| Temperature | Ballesteros (2012) fit on B-V | A few per cent on the unreddened main sequence. Recovers ~10,000 K for Sirius. Reads **too cool** for reddened stars. |
| Luminosity | `L/Lsun = 10^((4.83 - M)/2.5)` | Exact arithmetic, but a **V-band** ratio: no bolometric correction, so very hot and very cool stars come out low. |
| Radius | Stefan-Boltzmann from L and T | **Order of magnitude for cool supergiants.** Betelgeuse comes out a few hundred solar radii against a measured ~700, because both inputs err the same way. |
| Luminosity class | Bands around a fitted main-sequence ridge | Photometric, not spectroscopic. Correct for the archetypes (tested), deliberately wide bands. |
| Main-sequence mass | `M = L^(1/3.5)` inverted | **Main sequence only.** Returned as `null` for evolved stars rather than computed. |
| Main-sequence lifetime | `t = 10 Gyr * (M/Msun)^-2.5` | A scaling law, right to a factor of order unity. The Sun gives 10 Gyr by construction. |

## The main-sequence ridge is a fitted compromise, and the tests caught it

Classification compares a star's absolute magnitude with where the main sequence
sits at its colour:

```
msRidge = 4.83 + 20 * log10(Tsun / T)
```

The slope of 20 is a single-parameter fit through the Sun, calibrated against
standard anchors (B0V at M_V -4.0 / 30,000 K, A0V at +0.6 / 9,790 K, K5V at
+7.35 / 4,410 K). The real sequence is **not** log-linear over that range: its
local slope runs from about 12 at the hot end to about 29 at the cool end, so a
single value sits a magnitude or two off the true ridge at the extremes.

This was not obvious. A first attempt used a slope of 8.5, which classified
**Sirius as a subgiant** - it is a textbook main-sequence A-type star. The test
asserting Sirius is main sequence is what caught it. The bands (evolved if more
than 2.5 magnitudes above the ridge, subgiant if more than 1.0) are deliberately
wide precisely because the ridge is approximate.

## Mass and lifetime are withheld where they would be meaningless

The mass-luminosity relation `L ∝ M^3.5` describes hydrogen-burning main-sequence
stars. A red supergiant is fusing heavier elements in shells and is nothing like
that relation, so applying it would produce a confident, wrong number.

`derive` therefore gates mass and lifetime on the classification and returns
`null` for anything off the main sequence. There is a test asserting that
Betelgeuse yields no mass at all, because refusing to answer is the correct
behaviour there.

## What the diagram actually shows, and what it hides

Plotting the real catalogue reproduces the classic HR structure: a main-sequence
diagonal, a giant branch above and to the right, and a handful of supergiants
along the top. That is a genuine result from measured data, not a drawn diagram.

But the sample is magnitude limited, which shows up as **4,112 giants against
3,624 main-sequence stars** - roughly half the sky's naked-eye stars are evolved,
because luminous stars are visible from much further away. The real population is
dominated by red dwarfs that are almost entirely absent here. Both the counts and
that caveat are tested (`lib/stars-catalogue.test.ts`, `SELECTION_BIAS_NOTE`) so
the diagram can never quietly imply it is a fair census.

## Cross-references

- `NIGHT_SKY_PHYSICS.md`: the same catalogue used for positions rather than
  photometry.
- `NEUTRON_STARS_PHYSICS.md`, `BLACK_HOLES_PHYSICS.md`, and
  `GRAVITATIONAL_WAVES_PHYSICS.md`: where the massive end of this diagram ends up.

## Null-safety contract

Every exported function returns `null` (or `[]` for the list helpers) on
non-finite, missing, zero or negative input and never throws. Tested per function,
including a zero and a negative distance, a zero temperature, a negative
luminosity, and a catalogue payload that is not an object.
