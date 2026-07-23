---
title: Physics methods
description: What each world computes, from which measured inputs, and how accurate it is. An index into the per-world physics notes.
---

Each world computes real quantities and documents their accuracy. This page
summarises the methods; the authoritative detail is in the per-world
`docs/*_PHYSICS.md` files, which state the inputs, the formulas, and the bounds.

## Earth

- **Day/night terminator:** computed from the Sun's subsolar point for the chosen
  time (solar geometry), so the boundary is physically correct and scrubs
  smoothly through time.
- **Point forecasts:** read directly from Open-Meteo for the clicked coordinate.
- **Wind field:** advected from the latest NOAA GFS analysis.

## Solar System

- **Orbits:** planet and moon positions from JPL Horizons ephemerides, not
  stylised circles.
- **Mars atmosphere:** the seasonal CO₂ cycle uses Viking-measured values.

## Beyond

- **Hubble's law (galaxies):** distances from measured redshifts via `cz/H0`
  with an adopted `H0 = 70 km/s/Mpc`. This is the correct low-redshift linear
  law and is explicitly **not** valid for high-redshift cosmology. The depth
  axis is redshift-space (fingers-of-God distortion is present).
- **Black holes:** Schwarzschild radius, photon sphere, and ISCO from mass, with
  a lensing shader for illustration (labelled as illustrative).
- **Neutron stars:** real rotation frequencies drive the pulse timing; the audio
  is synthesised at the true frequency and is opt-in.

## The accuracy discipline

Every physics note leads with an honesty statement: what is real, what is
illustrative, and where the limits are. A representative example, from the
galaxies note:

> The map shows a real galaxy distribution computed with a real but low-redshift
> cosmology. The positions are correct for the map's scale and not valid for
> high-redshift cosmology. The whole depth scale moves if a different H0 is chosen.

That is the standard: state the bound, do not overclaim. See
[The honesty mandate](/explanation/honesty-mandate/) for the principle behind it.
