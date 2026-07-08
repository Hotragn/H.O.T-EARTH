#!/usr/bin/env python3
"""Build public/data/planets/constants.json -- the physical-constants table.

Covers the six "other planets" of the stretch phase (Mercury, Venus, Jupiter,
Saturn, Uranus, Neptune) plus Earth, Mars and the Moon for orrery completeness.
This is a TRANSCRIPTION-with-provenance script, not a computation from a raw
data file: every value is copied from a canonical, cited source and each field
carries its source in the output. Unit conversions (days->hours, C->K, AU->km)
and derived fields (orbital period in years) are computed here so they are
reproducible.

SOURCES (verified 2026-07-06):
  * JPL Solar System Dynamics -- Planetary Physical Parameters
    https://ssd.jpl.nasa.gov/planets/phys_par.html  (fetched live 2026-07-06)
    -> equatorial radius, mean radius, mass, sidereal rotation period, density.
  * JPL Solar System Dynamics -- Approximate Positions of the Planets
    https://ssd.jpl.nasa.gov/planets/approx_pos.html (Table 1, 1800-2050 AD;
    fetched live 2026-07-06)
    -> semi-major axis (au), orbital eccentricity.
  * NASA NSSDCA Planetary Fact Sheet (D. R. Williams, NASA GSFC)
    https://nssdc.gsfc.nasa.gov/planetary/factsheet/  and the per-body sheets
    (e.g. .../mercuryfact.html). NOTE: the nssdc.gsfc.nasa.gov host 307-redirects
    to nasa.gov/nssdc as of 2026-07-06 (same issue documented for Mars in
    docs/MARS_DATA_SOURCES.md). Obliquity, mean temperature and orbital period
    (days) below were taken from the NSSDC Planetary Fact Sheet values (cross-
    checked against a faithful reproduction and web sources on 2026-07-06); the
    JPL-sourced fields (radius, mass, rotation, a, e) are the live-verified gold
    standard and agree with NSSDC to rounding.
  * Mercury obliquity 0.034 deg == 2.042 arcmin: Margot et al. (2012), the
    measured value the NSSDC sheet reports (a few reproductions round to 0.01).

HONESTY NOTES baked into the JSON:
  * Gas/ice giants (Jupiter, Saturn, Uranus, Neptune) have NO solid surface.
    Their quoted temperature is a REFERENCE 1-bar-level value, not a surface
    temperature -- flagged per body. NSSDC 1-bar temps carry ~1-2 K rounding
    spread across reproductions (e.g. Uranus appears as both 76 K and 78 K);
    we store the value we verified and flag the spread.
  * Mercury's "mean" temperature (440 K) is nearly meaningless given the ~600 K
    day/night range; the measured extremes (~700 K day / ~100 K night, no
    atmosphere) are stored separately as the honest dynamic signal.
  * Venus' 737 K surface is near-isothermal (thick CO2 greenhouse); the dynamic
    signal is cloud-top super-rotation, stored separately.
  * Negative sidereal rotation period = retrograde rotation (Venus, Uranus).

Usage:
    python scripts/planets/build_constants.py \
        --out public/data/planets/constants.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os

AU_KM = 149_597_870.7  # 1 astronomical unit in km (IAU 2012 definition)


def c_to_k(celsius: float) -> float:
    return round(celsius + 273.15)


# Per-body verified constants. Keys:
#   name, type
#   radius_equatorial_km, radius_mean_km, mass_kg           -> JPL phys_par
#   sidereal_rotation_days (negative = retrograde)          -> JPL phys_par
#   semimajor_axis_au, eccentricity                         -> JPL approx_pos
#   obliquity_deg, mean_temp_C, orbital_period_days         -> NSSDC fact sheet
#   temp_kind: "surface" | "1-bar reference level (no solid surface)" | ...
#   notes: honesty/context string
BODIES = [
    {
        "name": "Mercury", "type": "terrestrial",
        "radius_equatorial_km": 2440.53, "radius_mean_km": 2439.4,
        "mass_kg": 0.330103e24,
        "sidereal_rotation_days": 58.6462,
        "semimajor_axis_au": 0.38709927, "eccentricity": 0.20563593,
        "obliquity_deg": 0.034,
        "mean_temp_C": 167, "orbital_period_days": 88.0,
        "temp_kind": "surface (mean; near-meaningless given the ~600 K range)",
        "measured_temp_extremes_C": {"day_max": 427, "night_min": -173,
            "note": "MESSENGER-era measured surface extremes; no atmosphere to buffer. NSSDC max 427 C / min -173 C; subsolar surface ~430 C."},
        "notes": "No real atmosphere (tenuous exosphere). Honest dynamic signal = day/night surface-temperature extremes, the largest of any planet.",
    },
    {
        "name": "Venus", "type": "terrestrial",
        "radius_equatorial_km": 6051.8, "radius_mean_km": 6051.8,
        "mass_kg": 4.86731e24,
        "sidereal_rotation_days": -243.018,  # retrograde
        "semimajor_axis_au": 0.72333566, "eccentricity": 0.00677672,
        "obliquity_deg": 177.36,
        "mean_temp_C": 464, "orbital_period_days": 224.7,
        "temp_kind": "surface (near-isothermal, thick CO2 greenhouse)",
        "super_rotation": {"cloud_top_wind_m_s": 100, "cloud_top_period_days": 4,
            "note": "Cloud-top zonal winds ~100 m/s (retrograde) circle the planet in ~4 Earth days vs the 243-day solid-body rotation. Measured by Venus Express (VMC) and Akatsuki (UVI)."},
        "notes": "Retrograde rotation (obliquity 177.36 deg). Honest dynamic signal = atmospheric super-rotation at the cloud tops; the surface is near-isothermal so shows no dynamics.",
    },
    {
        "name": "Jupiter", "type": "gas giant",
        "radius_equatorial_km": 71492, "radius_mean_km": 69911,
        "mass_kg": 1898.125e24,
        "sidereal_rotation_days": 0.41354,  # System III ~9h55m
        "semimajor_axis_au": 5.20288700, "eccentricity": 0.04838624,
        "obliquity_deg": 3.13,
        "mean_temp_C": -110, "orbital_period_days": 4331,
        "temp_kind": "1-bar reference level (no solid surface)",
        "notes": "No solid surface; rotation is System III (magnetic). Honest dynamic signal = MEASURED zonal wind profile (jets, peak ~150 m/s) + the long-lived Great Red Spot (~22 S). See zonal_winds.json.",
    },
    {
        "name": "Saturn", "type": "gas giant",
        "radius_equatorial_km": 60268, "radius_mean_km": 58232,
        "mass_kg": 568.317e24,
        "sidereal_rotation_days": 0.44401,  # ~10h39m, uncertain
        "semimajor_axis_au": 9.53667594, "eccentricity": 0.05386179,
        "obliquity_deg": 26.73,
        "mean_temp_C": -140, "orbital_period_days": 10747,
        "temp_kind": "1-bar reference level (no solid surface)",
        "rings": {"has_rings": True, "see": "saturn_rings.json"},
        "notes": "No solid surface; bulk rotation period is uncertain (no fixed surface to track). Honest dynamic signals = MEASURED zonal winds (equatorial super-jet ~400+ m/s), the real north polar hexagon (~78 N), and the rings. See zonal_winds.json and saturn_rings.json.",
    },
    {
        "name": "Uranus", "type": "ice giant",
        "radius_equatorial_km": 25559, "radius_mean_km": 25362,
        "mass_kg": 86.8099e24,
        "sidereal_rotation_days": -0.71833,  # retrograde
        "semimajor_axis_au": 19.18916464, "eccentricity": 0.04725744,
        "obliquity_deg": 97.77,
        "mean_temp_C": -195, "orbital_period_days": 30589,
        "temp_kind": "1-bar reference level (no solid surface); NSSDC value carries ~2 K spread across reproductions (76-78 K)",
        "notes": "The standout honest feature: obliquity 97.77 deg -> the planet is tipped on its side, giving ~42-year-long seasons where each pole faces the Sun for ~21 years. Retrograde rotation. Near-featureless in true color (faint bands only). Interior structure is INFERRED, not measured.",
    },
    {
        "name": "Neptune", "type": "ice giant",
        "radius_equatorial_km": 24764, "radius_mean_km": 24622,
        "mass_kg": 102.4092e24,
        "sidereal_rotation_days": 0.67125,
        "semimajor_axis_au": 30.06992276, "eccentricity": 0.00859048,
        "obliquity_deg": 28.32,
        "mean_temp_C": -200, "orbital_period_days": 59800,
        "temp_kind": "1-bar reference level (no solid surface)",
        "notes": "Fastest winds in the solar system (~2100 km/h ~= 580 m/s), MEASURED by Voyager 2 (1989). The Great Dark Spot is TRANSIENT (the 1989 spot was gone by 1994; new ones appear/disappear) -- must be labeled transient, not permanent. See zonal_winds.json.",
    },
    # ---- Earth / Mars / Moon: for orrery completeness (already done in earlier phases) ----
    {
        "name": "Earth", "type": "terrestrial",
        "radius_equatorial_km": 6378.1366, "radius_mean_km": 6371.0084,
        "mass_kg": 5.97217e24,
        "sidereal_rotation_days": 0.99726968,
        "semimajor_axis_au": 1.00000261, "eccentricity": 0.01671123,
        "obliquity_deg": 23.44,
        "mean_temp_C": 15, "orbital_period_days": 365.2,
        "temp_kind": "surface (global mean near-surface air)",
        "notes": "Reference body; Phase 1. a is the Earth-Moon barycenter value from JPL Table 1.",
    },
    {
        "name": "Mars", "type": "terrestrial",
        "radius_equatorial_km": 3396.19, "radius_mean_km": 3389.50,
        "mass_kg": 0.641691e24,
        "sidereal_rotation_days": 1.02595676,
        "semimajor_axis_au": 1.52371034, "eccentricity": 0.09339410,
        "obliquity_deg": 25.19,
        "mean_temp_C": -65, "orbital_period_days": 687.0,
        "temp_kind": "surface (mean)",
        "notes": "Phase 2. Eccentricity ~5.5x Earth's drives the seasonal asymmetry (see docs/MARS_PHYSICS.md).",
    },
    {
        "name": "Moon", "type": "moon (of Earth)",
        # Moon values: NSSDC Moon Fact Sheet (radius 1738.1 eq / 1737.4 mean km,
        # mass 0.07346e24 kg, sidereal rotation 655.72 h = 27.3217 d,
        # obliquity to orbit 6.68 deg, mean temp -20 C, orbital period 27.3 d).
        # a expressed as mean Earth-Moon distance / AU.
        "radius_equatorial_km": 1738.1, "radius_mean_km": 1737.4,
        "mass_kg": 0.07346e24,
        "sidereal_rotation_days": 27.3217,  # synchronous
        "semimajor_axis_au": 384400.0 / AU_KM, "eccentricity": 0.0549,
        "obliquity_deg": 6.68,
        "mean_temp_C": -20, "orbital_period_days": 27.3,
        "temp_kind": "surface (mean; ~300 K day/night swing, see docs/MOON_PHYSICS.md)",
        "orbit_note": "Orbits Earth. semimajor_axis_au here is the mean Earth-Moon distance (384,400 km) expressed in AU, NOT a heliocentric orbit; eccentricity 0.0549 is the lunar orbit's.",
        "notes": "Phase 3. No atmosphere -> no weather; dynamic signal is the ~300 K diurnal surface-temperature swing (Diviner).",
    },
]


def enrich(b: dict) -> dict:
    """Add derived/converted fields with clear units."""
    out = dict(b)
    out["radius_equatorial_km"] = b["radius_equatorial_km"]
    out["mass_1e24_kg"] = round(b["mass_kg"] / 1e24, 6)
    out["sidereal_rotation_hours"] = round(b["sidereal_rotation_days"] * 24.0, 4)
    out["semimajor_axis_km"] = round(b["semimajor_axis_au"] * AU_KM)
    out["orbital_period_years"] = round(b["orbital_period_days"] / 365.25, 4)
    out["mean_temp_K"] = c_to_k(b["mean_temp_C"])
    out["retrograde_rotation"] = b["sidereal_rotation_days"] < 0
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="public/data/planets/constants.json")
    args = ap.parse_args()

    bodies = {b["name"]: enrich(b) for b in BODIES}

    doc = {
        "_comment": (
            "Physical constants for the six 'other planets' (Mercury, Venus, "
            "Jupiter, Saturn, Uranus, Neptune) plus Earth, Mars and the Moon "
            "for orrery completeness. TRANSCRIBED from canonical sources, not a "
            "model: radius/mass/sidereal-rotation are from JPL SSD phys_par; "
            "semi-major axis + eccentricity from JPL SSD approx_pos (Table 1, "
            "1800-2050); obliquity/mean-temperature/orbital-period from the NASA "
            "NSSDC Planetary Fact Sheet. Gas/ice giants have NO solid surface; "
            "their temperature is a 1-bar REFERENCE level (flagged per body). "
            "Negative sidereal_rotation = retrograde. See docs/PLANETS_DATA_"
            "SOURCES.md and docs/PLANETS_PHYSICS.md."
        ),
        "sources": {
            "physical_parameters": {
                "provider": "NASA JPL Solar System Dynamics -- Planetary Physical Parameters",
                "url": "https://ssd.jpl.nasa.gov/planets/phys_par.html",
                "fields": ["radius_equatorial_km", "radius_mean_km", "mass_kg", "sidereal_rotation_days"],
                "verified_date": "2026-07-06 (fetched live)",
                "license": "US Government (NASA/JPL/Caltech) public data; no explicit license stated",
            },
            "orbital_elements": {
                "provider": "NASA JPL Solar System Dynamics -- Approximate Positions of the Planets (Table 1)",
                "url": "https://ssd.jpl.nasa.gov/planets/approx_pos.html",
                "fields": ["semimajor_axis_au", "eccentricity"],
                "verified_date": "2026-07-06 (fetched live)",
                "license": "US Government (NASA/JPL/Caltech) public data",
            },
            "fact_sheet": {
                "provider": "NASA NSSDCA Planetary Fact Sheet (D. R. Williams, NASA GSFC)",
                "url": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
                "fields": ["obliquity_deg", "mean_temp_C", "orbital_period_days",
                           "measured_temp_extremes_C (Mercury)"],
                "verified_date": "2026-07-06",
                "note": "nssdc.gsfc.nasa.gov host 307-redirects to nasa.gov/nssdc as of 2026-07-06 "
                        "(same as the Mars fact sheet, docs/MARS_DATA_SOURCES.md). Values cross-checked "
                        "against a faithful reproduction and multiple web sources; JPL fields above are "
                        "the live-verified primary values and agree with NSSDC to rounding.",
                "license": "NASA data, public domain",
            },
            "mercury_obliquity": "Margot et al. (2012): 2.042 arcmin = 0.034 deg (the NSSDC value).",
        },
        "units": {
            "radius": "km", "mass_kg": "kilograms", "mass_1e24_kg": "10^24 kg",
            "sidereal_rotation_days": "days (negative = retrograde)",
            "sidereal_rotation_hours": "hours (negative = retrograde)",
            "semimajor_axis_au": "astronomical units", "semimajor_axis_km": "km",
            "orbital_period_days": "days", "orbital_period_years": "Julian years (365.25 d)",
            "obliquity_deg": "degrees (axial tilt / obliquity to orbit)",
            "eccentricity": "dimensionless",
            "mean_temp_C": "degrees Celsius", "mean_temp_K": "kelvin",
        },
        "generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "verified_date": "2026-07-06",
        "bodies": bodies,
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
        f.write("\n")

    size = os.path.getsize(args.out)
    print(f"Wrote {args.out} ({size} bytes) with {len(bodies)} bodies")
    for name, b in bodies.items():
        print(f"  {name:8s} r_eq={b['radius_equatorial_km']:>8} km  "
              f"tilt={b['obliquity_deg']:>6}°  Trot={b['sidereal_rotation_hours']:>9} h  "
              f"a={b['semimajor_axis_au']:.4f} au  e={b['eccentricity']:.4f}  "
              f"Tmean={b['mean_temp_K']} K")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
