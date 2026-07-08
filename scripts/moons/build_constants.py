#!/usr/bin/env python3
"""Build public/data/moons/constants.json -- physical + orbital constants for
the major moons phase (Jupiter's Galileans, Saturn's Titan/Enceladus/Mimas/
Iapetus, Neptune's Triton).

This is a TRANSCRIPTION-with-provenance script, not a computation from a raw
data file: every value is copied from a canonical, cited source and each field
group carries its source in the output. The ONLY things computed here are
reproducible conversions/derivations:
  * mass_kg = GM * 1e9 / G           (GM from JPL is in km^3/s^2; G is CODATA)
  * rotation_period_days = orbital_period_days  (all these moons are in
    SYNCHRONOUS rotation -> tidally locked, one face to the parent)

SOURCES (verified live 2026-07-08):
  * JPL Solar System Dynamics -- Planetary Satellite Physical Parameters
    https://ssd.jpl.nasa.gov/sats/phys_par/  (fetched live 2026-07-08)
    -> GM (km^3/s^2), mean radius (km), mean density (g/cm^3).
       Ephemeris solutions cited on the page per system (e.g. JUP365, SAT441,
       NEP097). Mass here is derived from GM (see mass_kg).
  * JPL Solar System Dynamics -- Planetary Satellite Mean Orbital Parameters
    https://ssd.jpl.nasa.gov/sats/elem/  (fetched live 2026-07-08)
    -> semi-major axis a (km, from the PARENT planet), orbital period P (days),
       eccentricity e, inclination i (deg). Epoch 2000-01-01.5 (J2000).
       IMPORTANT: JPL states these mean elements are referred to the LOCAL
       LAPLACE PLANE of each satellite, NOT the ecliptic -- so i is small for
       the regular moons and 157.3 deg for Triton (retrograde). We store i as
       given and flag the frame.
  * Geometric albedo + mean surface temperature: NASA NSSDCA satellite fact
    sheets (D. R. Williams, NASA GSFC), https://nssdc.gsfc.nasa.gov/planetary/
    factsheet/ (joviansatfact / saturniansatfact / neptuniansatfact). NOTE: the
    nssdc.gsfc.nasa.gov host 307-redirects to nasa.gov/nssdc as of 2026-07-08
    (same issue documented for Mars and the planets phase). Values were cross-
    checked against the Wikipedia infoboxes (which cite the same primary
    sources) on 2026-07-08. Special primary sources:
      - Enceladus & Mimas geometric albedo: Verbiscer, French, Showalter &
        Helfenstein (2007), Science 315, 815 (Enceladus 1.375 +/- 0.008 at
        550 nm, the brightest body in the solar system; Mimas 0.962). Enceladus
        Bond albedo 0.81 +/- 0.04.
      - Titan surface temperature 93.7 K and pressure 1.45 atm: Huygens HASI,
        Fulchignoni et al. (2005), Nature 438, 785.
      - Triton surface temperature 38 K: Voyager 2 (1989), Tyler et al. 1989 /
        Broadfoot et al. 1989.
      - Iapetus two-tone albedo (dark leading "Cassini Regio" 0.03-0.05 vs
        bright trailing 0.5-0.6) and Callisto temps: NSSDCA / Cassini.

HONESTY NOTES baked into the JSON:
  * All nine moons are in SYNCHRONOUS rotation (tidally locked) -> the same
    face points at the parent, so rotation_period == orbital_period.
  * Io:Europa:Ganymede are in the 1:2:4 LAPLACE mean-motion resonance (periods
    ~1.769 : 3.551 : 7.155 d). Flagged on those three bodies + in resonances.
  * Triton orbits Neptune RETROGRADE (i = 157.3 deg > 90) and is almost
    certainly a captured Kuiper-belt object -- flagged.
  * Enceladus geometric albedo (1.375) exceeds 1 (strong backscatter from fresh
    ice); its Bond albedo is ~0.81. Both stored, with a note (do not confuse the
    two).
  * Iapetus albedo is stored as a two-value dichotomy (dark/bright), not a
    single number -- that dichotomy is the honest, showable feature.
  * "Mean surface temperature" for these airless bodies is a disk/diurnal
    average; day-side peaks and night minima are much wider (range stored where
    known). Titan (94 K) is a real measured surface value under a thick
    atmosphere.

Usage:
    python scripts/moons/build_constants.py \
        --out public/data/moons/constants.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os

G = 6.67430e-11  # CODATA 2018 gravitational constant, m^3 kg^-1 s^-2


def gm_to_mass_kg(gm_km3_s2: float) -> float:
    """Mass from GM. GM is km^3/s^2; convert km^3 -> m^3 (x1e9) then divide by G."""
    return gm_km3_s2 * 1.0e9 / G


# Per-body verified constants.
#   JPL phys_par : gm_km3_s2, radius_mean_km, density_g_cm3
#   JPL elem     : semimajor_axis_km (from parent), orbital_period_days,
#                  eccentricity, inclination_deg  (epoch J2000, Laplace-plane frame)
#   NSSDCA/lit   : geometric_albedo (+ bond_albedo where relevant), mean_temp_K,
#                  temp_range_K
BODIES = [
    # ---------------- Jupiter: the four Galilean moons ----------------
    {
        "name": "Io", "parent": "Jupiter", "type": "moon (Galilean)",
        "gm_km3_s2": 5959.91547, "radius_mean_km": 1821.49, "density_g_cm3": 3.5276,
        "semimajor_axis_km": 421800, "orbital_period_days": 1.762732,
        "eccentricity": 0.004, "inclination_deg": 0.0,
        "geometric_albedo": 0.63, "mean_temp_K": 110,
        "laplace_resonance": "1 (Io:Europa:Ganymede = 1:2:4)",
        "notes": "Most volcanically active body in the solar system (tidal heating). "
                 "Innermost Galilean; synchronous rotation; part of the 1:2:4 Laplace resonance. See phenomena.json.",
    },
    {
        "name": "Europa", "parent": "Jupiter", "type": "moon (Galilean)",
        "gm_km3_s2": 3202.71210, "radius_mean_km": 1560.80, "density_g_cm3": 3.0130,
        "semimajor_axis_km": 671100, "orbital_period_days": 3.525463,
        "eccentricity": 0.009, "inclination_deg": 0.5,
        "geometric_albedo": 0.67, "mean_temp_K": 102, "temp_range_K": [50, 125],
        "laplace_resonance": "2 (Io:Europa:Ganymede = 1:2:4)",
        "notes": "Young, near-crater-free water-ice crust; strong evidence for a subsurface "
                 "salt-water ocean (Galileo induced magnetic field). Synchronous rotation. See phenomena.json.",
    },
    {
        "name": "Ganymede", "parent": "Jupiter", "type": "moon (Galilean)",
        "gm_km3_s2": 9887.83275, "radius_mean_km": 2631.20, "density_g_cm3": 1.9416,
        "semimajor_axis_km": 1070400, "orbital_period_days": 7.155588,
        "eccentricity": 0.001, "inclination_deg": 0.2,
        "geometric_albedo": 0.43, "mean_temp_K": 110, "temp_range_K": [70, 152],
        "laplace_resonance": "4 (Io:Europa:Ganymede = 1:2:4)",
        "notes": "Largest moon in the solar system (r 2631 km > Mercury). Only moon with an "
                 "intrinsic magnetic field; subsurface-ocean evidence. Synchronous rotation. See phenomena.json.",
    },
    {
        "name": "Callisto", "parent": "Jupiter", "type": "moon (Galilean)",
        "gm_km3_s2": 7179.28340, "radius_mean_km": 2410.30, "density_g_cm3": 1.8340,
        "semimajor_axis_km": 1882700, "orbital_period_days": 16.690440,
        "eccentricity": 0.007, "inclination_deg": 0.3,
        "geometric_albedo": 0.22, "mean_temp_K": 134, "temp_range_K": [80, 165],
        "notes": "Among the oldest, most heavily cratered surfaces in the solar system; "
                 "possible deep subsurface ocean. Outside the Laplace resonance. Synchronous rotation.",
    },
    # ---------------- Saturn: Titan, Enceladus, (+ Mimas, Iapetus) ----------------
    {
        "name": "Titan", "parent": "Saturn", "type": "moon",
        "gm_km3_s2": 8978.13710, "radius_mean_km": 2574.76, "density_g_cm3": 1.8814,
        "semimajor_axis_km": 1221900, "orbital_period_days": 15.945448,
        "eccentricity": 0.029, "inclination_deg": 0.3,
        "geometric_albedo": 0.22, "mean_temp_K": 93.7,
        "notes": "Second-largest moon in the solar system. Thick N2 atmosphere (~1.45 bar at "
                 "the surface, denser than Earth's) with an active METHANE cycle -- the one moon "
                 "with genuine weather (seas, lakes, rain, rivers). Surface 93.7 K measured by "
                 "Huygens. geometric_albedo is disk-integrated (visible surface is haze-obscured; "
                 "maps are near-IR/radar). Synchronous rotation. See phenomena.json.",
    },
    {
        "name": "Enceladus", "parent": "Saturn", "type": "moon",
        "gm_km3_s2": 7.21037, "radius_mean_km": 252.10, "density_g_cm3": 1.6097,
        "semimajor_axis_km": 238400, "orbital_period_days": 1.370218,
        "eccentricity": 0.005, "inclination_deg": 0.0,
        "geometric_albedo": 1.375, "bond_albedo": 0.81,
        "albedo_note": "Geometric albedo 1.375 +/- 0.008 at 550 nm (Verbiscer et al. 2007) -- the "
                       "brightest body in the solar system (fresh-ice backscatter; values >1 are "
                       "physical for geometric albedo). Bond albedo ~0.81.",
        "mean_temp_K": 75, "temp_range_K": [32.9, 145],
        "notes": "South-polar water-ice/vapour PLUMES from the 'tiger stripe' fractures feed "
                 "Saturn's E ring; global subsurface ocean. Synchronous rotation. See phenomena.json.",
    },
    {
        "name": "Mimas", "parent": "Saturn", "type": "moon",
        "gm_km3_s2": 2.50349, "radius_mean_km": 198.20, "density_g_cm3": 1.1501,
        "semimajor_axis_km": 186000, "orbital_period_days": 0.942422,
        "eccentricity": 0.020, "inclination_deg": 1.6,
        "geometric_albedo": 0.962, "mean_temp_K": 64,
        "notes": "The 139-km crater Herschel (~1/3 of Mimas' diameter) gives it a 'Death Star' "
                 "look. Synchronous rotation. NOTE: no turnkey public-domain global mosaic on "
                 "USGS (control network only) -- included for constants completeness; not a "
                 "shipped-texture body this phase. See MOONS_DATA_SOURCES.md.",
    },
    {
        "name": "Iapetus", "parent": "Saturn", "type": "moon",
        "gm_km3_s2": 120.51511, "radius_mean_km": 734.30, "density_g_cm3": 1.0887,
        "semimajor_axis_km": 3561700, "orbital_period_days": 79.331002,
        "eccentricity": 0.028, "inclination_deg": 7.6,
        "geometric_albedo": {"dark_leading_CassiniRegio": [0.03, 0.05],
                              "bright_trailing": [0.5, 0.6]},
        "albedo_note": "Two-tone moon: dark leading hemisphere (Cassini Regio) geometric albedo "
                       "0.03-0.05; bright trailing hemisphere 0.5-0.6. The dichotomy is the "
                       "honest, showable feature -- no single albedo number is representative.",
        "mean_temp_K": 115, "temp_range_K": [90, 130],
        "temp_note": "Daytime: dark Cassini Regio ~129 K, bright regions ~113 K (thermal-runaway "
                     "ice migration reinforces the albedo dichotomy).",
        "notes": "Two-tone albedo dichotomy + huge equatorial ridge. Synchronous rotation.",
    },
    # ---------------- Neptune: Triton ----------------
    {
        "name": "Triton", "parent": "Neptune", "type": "moon",
        "gm_km3_s2": 1428.49546, "radius_mean_km": 1352.60, "density_g_cm3": 2.0649,
        "semimajor_axis_km": 354800, "orbital_period_days": 5.876994,
        "eccentricity": 0.000, "inclination_deg": 157.3,
        "geometric_albedo": 0.7, "bond_albedo": 0.85,
        "mean_temp_K": 38,
        "retrograde_orbit": True,
        "notes": "RETROGRADE orbit (i = 157.3 deg > 90) -> almost certainly a captured "
                 "Kuiper-belt object. Active N2 geysers (Voyager 2, 1989); thin N2 atmosphere; "
                 "38 K surface (among the coldest measured); cantaloupe terrain. Synchronous "
                 "rotation about Neptune. See phenomena.json.",
    },
]


def enrich(b: dict) -> dict:
    out = dict(b)
    out["mass_kg"] = float(f"{gm_to_mass_kg(b['gm_km3_s2']):.6e}")
    # All of these moons are tidally locked (synchronous rotation).
    out["tidally_locked"] = True
    out["rotation_period_days"] = b["orbital_period_days"]
    out.setdefault("retrograde_orbit", False)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="public/data/moons/constants.json")
    args = ap.parse_args()

    bodies = {b["name"]: enrich(b) for b in BODIES}

    doc = {
        "_comment": (
            "Physical + orbital constants for the major-moons phase: Jupiter's four "
            "Galilean moons (Io, Europa, Ganymede, Callisto), Saturn's Titan, "
            "Enceladus, Mimas and Iapetus, and Neptune's Triton. TRANSCRIBED from "
            "canonical sources, not modelled: GM / mean radius / density from JPL SSD "
            "Planetary Satellite Physical Parameters; semi-major axis (from the PARENT "
            "planet) / orbital period / eccentricity / inclination from JPL SSD "
            "Planetary Satellite Mean Orbital Parameters (epoch J2000, referred to each "
            "moon's LOCAL LAPLACE PLANE); geometric albedo + mean surface temperature "
            "from NASA NSSDCA satellite fact sheets and primary literature (Verbiscer "
            "2007 for Enceladus/Mimas albedo; Huygens for Titan 93.7 K/1.45 bar; Voyager 2 "
            "for Triton 38 K). mass_kg is DERIVED from GM (mass = GM*1e9/G). ALL nine "
            "moons are tidally locked (synchronous rotation): rotation_period == "
            "orbital_period. Io:Europa:Ganymede are in the 1:2:4 Laplace resonance. "
            "Triton's orbit is RETROGRADE (i=157.3). See docs/MOONS_DATA_SOURCES.md and "
            "docs/MOONS_PHYSICS.md."
        ),
        "sources": {
            "physical_parameters": {
                "provider": "NASA JPL Solar System Dynamics -- Planetary Satellite Physical Parameters",
                "url": "https://ssd.jpl.nasa.gov/sats/phys_par/",
                "fields": ["gm_km3_s2", "radius_mean_km", "density_g_cm3", "mass_kg (derived from GM)"],
                "verified_date": "2026-07-08 (fetched live)",
                "license": "US Government (NASA/JPL/Caltech) public data; no explicit license stated",
                "note": "mass_kg derived: mass = GM * 1e9 / G, G = 6.67430e-11 (CODATA 2018).",
            },
            "orbital_elements": {
                "provider": "NASA JPL Solar System Dynamics -- Planetary Satellite Mean Orbital Parameters",
                "url": "https://ssd.jpl.nasa.gov/sats/elem/",
                "fields": ["semimajor_axis_km", "orbital_period_days", "eccentricity", "inclination_deg"],
                "epoch": "2000-01-01.5 (J2000)",
                "frame": "Mean elements are referred to each satellite's LOCAL LAPLACE PLANE, "
                         "NOT the ecliptic. Hence small i for the regular moons and i=157.3 deg "
                         "(retrograde) for Triton. semimajor_axis_km is measured from the PARENT planet.",
                "verified_date": "2026-07-08 (fetched live)",
                "license": "US Government (NASA/JPL/Caltech) public data",
            },
            "albedo_temperature": {
                "provider": "NASA NSSDCA satellite fact sheets (D. R. Williams) + primary literature",
                "url": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
                "fields": ["geometric_albedo", "bond_albedo", "mean_temp_K", "temp_range_K"],
                "verified_date": "2026-07-08",
                "note": "nssdc.gsfc.nasa.gov host 307-redirects to nasa.gov/nssdc as of 2026-07-08 "
                        "(same as Mars/planets phases). Values cross-checked against Wikipedia "
                        "infoboxes (which cite the same primary sources) on 2026-07-08.",
                "primary_sources": {
                    "Enceladus/Mimas geometric albedo": "Verbiscer, French, Showalter & Helfenstein (2007), Science 315, 815",
                    "Titan 93.7 K / 1.45 bar": "Huygens HASI, Fulchignoni et al. (2005), Nature 438, 785",
                    "Triton 38 K": "Voyager 2 (1989), Tyler et al. 1989 / Broadfoot et al. 1989",
                },
                "license": "NASA data, public domain; cited literature values",
            },
        },
        "units": {
            "gm_km3_s2": "km^3/s^2", "radius_mean_km": "km", "density_g_cm3": "g/cm^3",
            "mass_kg": "kilograms (derived from GM)",
            "semimajor_axis_km": "km (distance from the parent planet)",
            "orbital_period_days": "days", "rotation_period_days": "days (== orbital period; synchronous)",
            "eccentricity": "dimensionless",
            "inclination_deg": "degrees (to the local Laplace plane; >90 = retrograde)",
            "geometric_albedo": "dimensionless (visible; can exceed 1 for strong backscatter)",
            "bond_albedo": "dimensionless", "mean_temp_K": "kelvin", "temp_range_K": "kelvin [min, max]",
        },
        "resonances": {
            "laplace_1_2_4": {
                "members": ["Io", "Europa", "Ganymede"],
                "note": "Io:Europa:Ganymede orbital periods ~1.769 : 3.551 : 7.155 d ~= 1:2:4 "
                        "(the Laplace mean-motion resonance). This forced eccentricity drives the "
                        "tidal heating that powers Io's volcanism and Europa's/Ganymede's oceans.",
            },
        },
        "generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "verified_date": "2026-07-08",
        "bodies": bodies,
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
        f.write("\n")

    size = os.path.getsize(args.out)
    print(f"Wrote {args.out} ({size} bytes) with {len(bodies)} moons")
    for name, b in bodies.items():
        print(f"  {name:9s} {b['parent']:8s} r={b['radius_mean_km']:>8} km  "
              f"m={b['mass_kg']:.3e} kg  a={b['semimajor_axis_km']:>8} km  "
              f"P={b['orbital_period_days']:>9.4f} d  e={b['eccentricity']:.3f}  "
              f"i={b['inclination_deg']:>5}  T={b['mean_temp_K']} K")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
