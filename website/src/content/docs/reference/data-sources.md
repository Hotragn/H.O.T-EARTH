---
title: Data sources
description: The real, public datasets behind H.O.T EARTH, with their licenses and where each is documented in the repository.
---

Every world is backed by real, public data. This page is the index; each world
also ships a `*_DATA_SOURCES.md` in the repository's `docs/` folder with the
exact URLs, credit lines, and verification dates.

## Earth and near-Earth

| Data | Source | License |
| --- | --- | --- |
| Daily satellite imagery | NASA GIBS | Public domain |
| Weather and point forecasts | Open-Meteo | Free, open (CC BY 4.0 for data) |
| Global wind field (GFS) | NOAA | Public domain |
| ISS orbital elements (TLE) | CelesTrak / public TLE | Public domain data |
| City lights (Black Marble) | NASA | Public domain |

## Solar System

| Data | Source | License |
| --- | --- | --- |
| Planetary orbits and ephemerides | JPL Horizons | Public domain |
| Planet and moon imagery | NASA / USGS | Public domain |
| Mars atmosphere (Viking CO₂ cycle) | NASA measured data | Public domain |

## Beyond

| Data | Source | License |
| --- | --- | --- |
| Exoplanet catalog | NASA Exoplanet Archive | Public domain |
| Star catalog (night sky) | Hipparcos / public catalogs | Public domain |
| Galaxy imagery | ESA/Hubble, ESA/Webb | CC BY 4.0 (credit required) |
| Cosmic web (18,000 galaxies) | SDSS DR17 (Abdurro'uf et al. 2022) | Public, cited |
| Black hole images | Event Horizon Telescope | CC BY 4.0 (credit required) |

## The licensing rule

Only clearly usable, creditable sources ship. Public-domain (NASA, USGS, NOAA)
needs no permission; CC BY 4.0 (ESA/Hubble, ESA/Webb, EHT) requires keeping the
exact credit line. Non-commercial (NC), no-derivatives (ND), and unclear licenses
are rejected. See [Add a data layer honestly](/guides/add-a-data-layer/) for the
full workflow, and [The honesty mandate](/explanation/honesty-mandate/) for why.

:::note[Where the exact credits live]
This table is an index. The verbatim credit lines and verification dates are in
the per-world `docs/*_DATA_SOURCES.md` files in the repository, which are the
authoritative record.
:::
