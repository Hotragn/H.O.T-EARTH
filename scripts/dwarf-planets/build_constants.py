#!/usr/bin/env python3
"""Build public/data/dwarf-planets/constants.json -- physical + orbital
constants for the dwarf-planets phase (Phase 6): the five IAU dwarf planets
Pluto, Ceres, Eris, Haumea, Makemake, plus Pluto's large moon Charon.

This is a TRANSCRIPTION-with-provenance script, not a computation from a raw
data file: every value is copied from a canonical, cited source and each field
group carries its source in the output. The ONLY things computed here are
reproducible conversions/derivations:
  * mass_kg (Ceres, Pluto)  = GM * 1e9 / G   (GM in km^3/s^2; G is CODATA 2018)
  * orbital_period_years    = orbital_period_days / 365.25
  * semimajor_axis_km       = semimajor_axis_au * AU_KM

SOURCES (verified live 2026-07-10):
  * ORBITAL ELEMENTS + ROTATION + H (all six bodies) -- NASA JPL Solar System
    Dynamics, Small-Body Database (SBDB) API v1.3,
    https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=<name>&phys-par=1&full-prec=1
    (queried live 2026-07-10; SBDB solution date 2026-06-06, epoch 2461200.5
    TDB). -> semi-major axis a (au), eccentricity e, inclination i (deg),
    orbital period (days), rotation period (h), absolute magnitude H, and for
    Ceres the full physical set (diameter, GM, bulk density, geometric albedo).
    HELIOCENTRIC osculating elements. NOTE: for Pluto the osculating a
    (39.589 au, P=249.1 yr) differs slightly from the commonly quoted mean
    (a~39.48 au, P~248 yr) because Pluto is deep in the 3:2 mean-motion
    resonance with Neptune and its osculating elements oscillate -- flagged.
    Charon is a SATELLITE: its heliocentric orbit is Pluto's, so we store its
    orbit AROUND PLUTO instead (a_from_Pluto, period), and flag it.
  * PHYSICAL SIZE / MASS / ALBEDO for the bodies NOT in SBDB phys-par
    (Pluto, Charon, Eris, Haumea, Makemake) come from spacecraft (New Horizons,
    Dawn) and peer-reviewed stellar-occultation / photometry papers, NOT from
    imaging for the never-visited three:
      - Pluto radius 1188.3 km: Nimmo et al. 2017, Icarus 287, 12 (New Horizons).
        Mass 1.303e22 kg (GM 869.6 km^3/s^2): Brozovic et al. 2015, Icarus 246, 317
        (Pluto-Charon system) / Stern et al. 2015, Science 350, aad1815.
      - Charon radius 606.0 km, mass 1.586e21 kg, a_from_Pluto 19591 km:
        Nimmo et al. 2017 / Brozovic et al. 2015.
      - Ceres diameter 939.4 km, GM 62.6284, density 2.162, albedo 0.090:
        JPL SBDB phys-par (Dawn-derived; Park et al. 2016/2019).
      - Eris diameter 2326 +/- 12 km, geometric albedo 0.96 +/- 0.09:
        Sicardy et al. 2011, Nature 478, 493 (2010 stellar occultation).
        Mass 1.66e22 kg (~27% more massive than Pluto -> the MOST MASSIVE dwarf
        planet): Brown & Schaller 2007, Science 316, 1585 (from Dysnomia's orbit).
      - Haumea triaxial 2100 x 1680 x 1074 km + ring: Ortiz et al. 2017,
        Nature 550, 219 (multi-chord occultation); triaxial shape from the 2019
        modelling of that occultation. Mass 3.95e21 kg: Ragozzine & Brown 2009,
        AJ 137, 4766 (from Hi'iaka/Namaka). Crystalline water ice surface
        (Trujillo et al. 2007; Merlin et al. 2007).
      - Makemake diameter ~1430 km (equatorial ~1434, polar ~1420), geometric
        albedo 0.82: Ortiz et al. 2012, Nature 491, 566 (2011 occultation; also
        set the no-substantial-atmosphere upper limit). Mass 2.69e21 kg (2025,
        from the moon S/2015 (136472) 1).
  * TEMPERATURES: NASA dwarf-planet fact pages + mission results (Pluto ~40-44 K,
    New Horizons/Stern 2015; Charon ~53 K; Ceres ~168 K max, Dawn; the outer
    three ~30-50 K, radiative estimates -- flagged as estimates).

HONESTY NOTES baked into the JSON (per the phase brief):
  * imaged=True ONLY for Pluto, Charon (New Horizons flyby, 2015) and Ceres
    (Dawn orbiter, 2015-2018). Eris, Haumea and Makemake have NEVER been visited
    -> imaged=False, appearance is ILLUSTRATIVE (there is no surface map).
  * Eris is the MOST MASSIVE dwarf planet (~27% > Pluto) yet slightly SMALLER in
    diameter (2326 vs 2377 km) -- both stored/flagged.
  * Haumea is an extreme triaxial ellipsoid from its ~3.9 h rotation and has a
    RING (2017, first known for a TNO) -- triaxial_axes_km + has_ring stored.
  * Pluto-Charon is a true BINARY: the system barycenter lies OUTSIDE Pluto
    (~2110 km from Pluto's centre > Pluto's 1188 km radius) -- flagged.
  * Eris and Makemake rotation periods are UNCERTAIN (SBDB flags "may be wrong by
    30%"; Makemake's light-curve admits 11.4 h or 22.83 h, older single-peak
    7.77 h) -- stored with rotation_note.
  * Pluto's orbit is in a 3:2 resonance with Neptune and CROSSES Neptune's orbit
    (perihelion 29.7 au < Neptune's 30.1 au) yet they never approach -- flagged.

Usage:
    python scripts/dwarf-planets/build_constants.py \
        --out public/data/dwarf-planets/constants.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os

AU_KM = 149_597_870.7  # 1 astronomical unit in km (IAU 2012 definition)
G = 6.67430e-11        # CODATA 2018 gravitational constant, m^3 kg^-1 s^-2


def gm_to_mass_kg(gm_km3_s2: float) -> float:
    """Mass from GM. GM is km^3/s^2; convert km^3 -> m^3 (x1e9) then divide by G."""
    return gm_km3_s2 * 1.0e9 / G


# Per-body verified constants.
#   JPL SBDB : semimajor_axis_au, eccentricity, inclination_deg,
#              orbital_period_days, rotation_period_hours, abs_magnitude_H
#   physical : radius_mean_km, mass_kg (or gm_km3_s2 -> derived), density_g_cm3,
#              geometric_albedo   (spacecraft / occultation / photometry sources)
BODIES = [
    # ------------------------------ Pluto ------------------------------
    {
        "name": "Pluto", "designation": "134340 Pluto", "type": "dwarf planet",
        "imaged": True, "imaging_mission": "New Horizons flyby, 2015-07-14",
        "radius_mean_km": 1188.3,
        "mass_kg": 1.303e22, "density_g_cm3": 1.854,
        "semimajor_axis_au": 39.58862938517124, "eccentricity": 0.2518378778576892,
        "inclination_deg": 17.14771140999114, "orbital_period_days": 90981.71647718345,
        "rotation_period_hours": 153.2935, "abs_magnitude_H": -0.55,
        "geometric_albedo": 0.52, "mean_temp_K": 44,
        "known_moons": {"count": 5, "names": ["Charon", "Nix", "Hydra", "Kerberos", "Styx"]},
        "neptune_resonance": "3:2 mean-motion resonance with Neptune; orbit crosses Neptune's "
                             "(perihelion ~29.7 au < Neptune's ~30.1 au) but they never approach.",
        "orbit_note": "SBDB osculating a=39.589 au (P=249.1 yr). Deep in the 3:2 resonance with "
                      "Neptune, so osculating elements oscillate; the commonly quoted mean is "
                      "a~39.48 au, P~248 yr.",
        "notes": "Largest and most famous dwarf planet. N2/CH4/CO ices; nitrogen-ice glaciers fill "
                 "Sputnik Planitia (the left lobe of the 'heart', Tombaugh Regio); thin N2 "
                 "atmosphere with stacked haze layers; reddish tholins; ~44 K surface (New Horizons "
                 "2015). Rotation 153.29 h = 6.387 d, mutually tidally locked with Charon. Real "
                 "global mosaic exists (New Horizons); far side lower-res. See phenomena.json.",
    },
    # ------------------------------ Charon -----------------------------
    {
        "name": "Charon", "designation": "Pluto I", "type": "moon (of Pluto)",
        "imaged": True, "imaging_mission": "New Horizons flyby, 2015-07-14",
        "radius_mean_km": 606.0,
        "mass_kg": 1.586e21, "density_g_cm3": 1.702,
        "semimajor_axis_au": None,
        "semimajor_axis_km_from_Pluto": 19591,
        "eccentricity": 0.0, "inclination_deg": 0.0,
        "orbital_period_days": 6.3872, "rotation_period_hours": 153.2935,
        "geometric_albedo": 0.38, "mean_temp_K": 53,
        "known_moons": {"count": 0, "names": []},
        "barycenter_note": "The Pluto-Charon barycenter lies OUTSIDE Pluto (~2110 km from Pluto's "
                           "centre, beyond Pluto's 1188 km radius) -> a true BINARY system, not a "
                           "simple moon. Charon has ~12.2% of Pluto's mass.",
        "orbit_note": "Charon is a satellite: its heliocentric orbit is Pluto's. Values here are "
                      "its orbit AROUND PLUTO (a from Pluto 19591 km; period 6.3872 d). Mutually "
                      "tidally locked with Pluto (rotation == orbital period).",
        "notes": "Pluto's large moon; imaged by New Horizons. Dark reddish north polar cap "
                 "(Mordor Macula, reddish tholins); giant canyons (Serenity/Argo Chasma, to ~9 km "
                 "deep). Mutually tidally locked with Pluto. See phenomena.json.",
    },
    # ------------------------------ Ceres ------------------------------
    {
        "name": "Ceres", "designation": "1 Ceres", "type": "dwarf planet",
        "imaged": True, "imaging_mission": "Dawn orbiter, 2015-2018",
        "radius_mean_km": 469.7,
        "triaxial_axes_km": [964.4, 964.2, 891.8],
        "gm_km3_s2": 62.6284, "density_g_cm3": 2.162,
        "semimajor_axis_au": 2.765552595, "eccentricity": 0.07969230,
        "inclination_deg": 10.588028, "orbital_period_days": 1679.85,
        "rotation_period_hours": 9.074170, "abs_magnitude_H": 3.34,
        "geometric_albedo": 0.090, "mean_temp_K": 168,
        "temp_note": "~168 K (-105 C) daytime maximum measured by Dawn; much colder near the poles.",
        "known_moons": {"count": 0, "names": []},
        "notes": "Only dwarf planet in the inner solar system (asteroid belt); largest belt object "
                 "(~25% of the belt's mass). Bright sodium-carbonate salt deposits in Occator "
                 "crater (cryovolcanic brine); the cryovolcano Ahuna Mons; ~9.07 h rotation; "
                 "evidence for a subsurface brine reservoir (Dawn). Real global mosaic exists "
                 "(Dawn FC, clear-filter/near-grayscale). See phenomena.json.",
    },
    # ------------------------------- Eris ------------------------------
    {
        "name": "Eris", "designation": "136199 Eris", "type": "dwarf planet",
        "imaged": False,
        "radius_mean_km": 1163.0,
        "mass_kg": 1.66e22, "density_g_cm3": 2.43,
        "semimajor_axis_au": 67.93394687853566, "eccentricity": 0.4382385347971672,
        "inclination_deg": 43.9258279471791, "perihelion_au": 38.16267353549761,
        "orbital_period_days": 204516.6629430732,
        "rotation_period_hours": 25.9,
        "rotation_note": "SBDB 25.9 h, flagged 'may be wrong by 30%'. Poorly determined; some work "
                         "suggests Eris may be tidally locked to Dysnomia (~15.8 d). Uncertain.",
        "abs_magnitude_H": -1.26, "geometric_albedo": 0.96, "mean_temp_K": 30,
        "known_moons": {"count": 1, "names": ["Dysnomia"]},
        "notes": "MOST MASSIVE dwarf planet (~27% more massive than Pluto; Brown & Schaller 2007 "
                 "from Dysnomia's orbit) yet slightly SMALLER in diameter (2326 vs Pluto's 2377 km). "
                 "Very distant (a~68 au, perihelion ~38 au, currently near aphelion). Extremely "
                 "reflective methane-ice surface (albedo ~0.96). Mass/radius from the 2010 stellar "
                 "occultation (Sicardy et al. 2011). NEVER VISITED -> no surface map; appearance is "
                 "ILLUSTRATIVE. See phenomena.json.",
    },
    # ------------------------------ Haumea -----------------------------
    {
        "name": "Haumea", "designation": "136108 Haumea", "type": "dwarf planet",
        "imaged": False,
        "radius_mean_km": 772.0,
        "triaxial_axes_km": [2100, 1680, 1074],
        "mass_kg": 3.95e21, "density_g_cm3": 1.9,
        "semimajor_axis_au": 43.06029023650952, "eccentricity": 0.1944430148898797,
        "inclination_deg": 28.20847393040364, "orbital_period_days": 103208.1173403618,
        "rotation_period_hours": 3.915341, "abs_magnitude_H": 0.14,
        "geometric_albedo": 0.51, "mean_temp_K": 32,
        "known_moons": {"count": 2, "names": ["Hi'iaka", "Namaka"]},
        "has_ring": True,
        "ring_note": "A RING at radius ~2287 km, width ~70 km (Ortiz et al. 2017) -- the FIRST ring "
                     "system discovered around a trans-Neptunian object / dwarf planet, in a 3:1 "
                     "resonance with Haumea's spin.",
        "shape_note": "Extreme triaxial (Jacobi) ellipsoid ~2100 x 1680 x 1074 km, forced by its "
                      "very fast ~3.9155 h rotation (one of the fastest of any large body). "
                      "triaxial_axes_km are full axis lengths; radius_mean_km is the volume-"
                      "equivalent mean (~1544 km diameter).",
        "notes": "Fast-spinning (~3.9 h), elongated dwarf planet with a ring and two moons "
                 "(Hi'iaka, Namaka). Surface is 66-80% crystalline water ice. Mass 3.95e21 kg from "
                 "the moons' orbits (Ragozzine & Brown 2009). NEVER VISITED -> no surface map; "
                 "appearance is ILLUSTRATIVE. See phenomena.json.",
    },
    # ----------------------------- Makemake ----------------------------
    {
        "name": "Makemake", "designation": "136472 Makemake", "type": "dwarf planet",
        "imaged": False,
        "radius_mean_km": 715.0,
        "triaxial_axes_km": [1434, 1434, 1420],
        "mass_kg": 2.69e21, "density_g_cm3": 1.7,
        "semimajor_axis_au": 45.57093317300052, "eccentricity": 0.1588889953992523,
        "inclination_deg": 29.02785603743067, "orbital_period_days": 112364.8068762869,
        "rotation_period_hours": 22.8266,
        "rotation_note": "SBDB 22.8266 h, flagged 'may be wrong by 30%'. The light-curve admits "
                         "~11.4 h or ~22.83 h; the older single-peak value was ~7.77 h "
                         "(Heinze & de Lahunta 2009). Uncertain.",
        "abs_magnitude_H": -0.25, "geometric_albedo": 0.82, "mean_temp_K": 32,
        "known_moons": {"count": 1, "names": ["S/2015 (136472) 1 (\"MK 2\")"]},
        "atmosphere_note": "NO substantial global atmosphere: the 2011 occultation set an upper "
                           "limit of ~4-12 nbar (Ortiz et al. 2012). JWST (2025) detected gaseous "
                           "methane that may be transient outgassing, not a bound atmosphere -- "
                           "flagged, recent.",
        "notes": "Bright methane/ethane-ice dwarf planet with reddish tholins; ~1430 km across; one "
                 "small moon (S/2015 (136472) 1, found 2016). Mass 2.69e21 kg (2025, from the "
                 "moon). Diameter/albedo from the 2011 stellar occultation (Ortiz et al. 2012). "
                 "NEVER VISITED -> no surface map; appearance is ILLUSTRATIVE. See phenomena.json.",
    },
]


def enrich(b: dict) -> dict:
    """Add derived/converted fields with clear units. Reproducible only."""
    out = dict(b)
    # Ceres: derive mass from GM (SBDB gives GM, not mass).
    if "mass_kg" not in out and "gm_km3_s2" in b:
        out["mass_kg"] = float(f"{gm_to_mass_kg(b['gm_km3_s2']):.6e}")
    out["orbital_period_years"] = round(b["orbital_period_days"] / 365.25, 4)
    if b.get("semimajor_axis_au") is not None:
        out["semimajor_axis_km"] = round(b["semimajor_axis_au"] * AU_KM)
    out.setdefault("imaged", False)
    out.setdefault("has_ring", False)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="public/data/dwarf-planets/constants.json")
    args = ap.parse_args()

    bodies = {b["name"]: enrich(b) for b in BODIES}

    doc = {
        "_comment": (
            "Physical + orbital constants for the dwarf-planets phase (Phase 6): the five "
            "IAU dwarf planets Pluto, Ceres, Eris, Haumea and Makemake, plus Pluto's large "
            "moon Charon. TRANSCRIBED from canonical sources, not modelled: orbital "
            "elements (a, e, i, orbital period), rotation period and H from the NASA JPL "
            "Small-Body Database (SBDB) API; physical size/mass/albedo/density from JPL "
            "SBDB phys-par (Ceres) and, for the others, from spacecraft (New Horizons for "
            "Pluto/Charon) and peer-reviewed stellar-occultation / photometry papers "
            "(Sicardy 2011 Eris; Ortiz 2017 Haumea + ring; Ortiz 2012 Makemake). mass_kg "
            "for Ceres is DERIVED from GM (mass = GM*1e9/G). imaged=True ONLY for Pluto, "
            "Charon and Ceres -- Eris/Haumea/Makemake have NEVER been visited, so their "
            "appearance is ILLUSTRATIVE (no surface map exists). Haumea is an extreme "
            "triaxial ellipsoid with a ring; Pluto-Charon is a binary (barycenter outside "
            "Pluto); Pluto is in a 3:2 resonance with Neptune. See "
            "docs/DWARF_PLANETS_DATA_SOURCES.md and docs/DWARF_PLANETS_PHYSICS.md."
        ),
        "sources": {
            "orbital_elements_rotation": {
                "provider": "NASA JPL Solar System Dynamics -- Small-Body Database (SBDB) API v1.3",
                "url": "https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=<name>&phys-par=1&full-prec=1",
                "fields": ["semimajor_axis_au", "eccentricity", "inclination_deg",
                           "perihelion_au", "orbital_period_days", "rotation_period_hours",
                           "abs_magnitude_H",
                           "Ceres: gm_km3_s2 / density_g_cm3 / geometric_albedo / triaxial_axes_km"],
                "epoch": "2461200.5 (TDB); SBDB solution date 2026-06-06",
                "frame": "Heliocentric osculating elements. For Charon (a satellite) we store its "
                         "orbit AROUND PLUTO instead; Charon's heliocentric orbit is Pluto's.",
                "verified_date": "2026-07-10 (queried live)",
                "license": "US Government (NASA/JPL/Caltech) public data; no explicit license stated",
                "note": "Eris and Makemake rotation periods carry SBDB's own 'may be wrong by 30%' "
                        "flag (see per-body rotation_note). Pluto's osculating a differs slightly "
                        "from the mean (3:2 resonance oscillation) -- see Pluto orbit_note.",
            },
            "physical_pluto_charon": {
                "provider": "NASA New Horizons (2015 flyby) -- peer-reviewed",
                "refs": ["Nimmo et al. 2017, Icarus 287, 12 (radii)",
                         "Brozovic et al. 2015, Icarus 246, 317 (system masses/GM)",
                         "Stern et al. 2015, Science 350, aad1815 (encounter overview)"],
                "fields": ["radius_mean_km", "mass_kg", "density_g_cm3", "geometric_albedo",
                           "Charon semimajor_axis_km_from_Pluto"],
                "verified_date": "2026-07-10 (cross-checked vs NASA + Wikipedia infoboxes)",
                "license": "NASA/peer-reviewed published constants; public domain data",
            },
            "physical_ceres": {
                "provider": "NASA JPL SBDB phys-par (Dawn-derived)",
                "url": "https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=Ceres&phys-par=1&full-prec=1",
                "fields": ["radius_mean_km (from diameter 939.4 km)", "triaxial_axes_km",
                           "gm_km3_s2", "density_g_cm3", "geometric_albedo", "rotation_period_hours"],
                "verified_date": "2026-07-10 (queried live)",
                "license": "US Government (NASA/JPL/Caltech) public data",
            },
            "physical_occultation": {
                "provider": "Peer-reviewed stellar-occultation / photometry (never-visited dwarfs)",
                "refs": ["Eris: Sicardy et al. 2011, Nature 478, 493 (diameter 2326 km, albedo 0.96); "
                         "mass ~1.66e22 kg from Brown & Schaller 2007, Science 316, 1585 (Dysnomia)",
                         "Haumea: Ortiz et al. 2017, Nature 550, 219 (occultation, ring; triaxial "
                         "2100x1680x1074 km); mass 3.95e21 kg from Ragozzine & Brown 2009, AJ 137, 4766",
                         "Makemake: Ortiz et al. 2012, Nature 491, 566 (diameter ~1430 km, albedo "
                         "0.82, no substantial atmosphere); mass 2.69e21 kg (2025, from the moon)"],
                "fields": ["radius_mean_km", "triaxial_axes_km", "mass_kg", "density_g_cm3",
                           "geometric_albedo", "has_ring/ring_note", "atmosphere_note"],
                "verified_date": "2026-07-10 (cross-checked vs NASA + Wikipedia infoboxes citing the papers)",
                "license": "Peer-reviewed published constants (small numeric values, freely citable)",
            },
            "temperatures": {
                "provider": "NASA dwarf-planet fact pages + mission results",
                "url": "https://science.nasa.gov/dwarf-planets/",
                "fields": ["mean_temp_K"],
                "verified_date": "2026-07-10",
                "note": "Pluto ~40-44 K (New Horizons/Stern 2015; NASA average -232 C); Charon ~53 K; "
                        "Ceres ~168 K daytime max (Dawn). Eris/Haumea/Makemake ~30-32 K are radiative "
                        "estimates for these very distant bodies -- flagged as estimates, not "
                        "in-situ measurements.",
                "license": "NASA data, public domain",
            },
        },
        "units": {
            "radius_mean_km": "km (volume-equivalent mean radius)",
            "triaxial_axes_km": "km [a, b, c] full axis lengths (Haumea/Ceres/Makemake shape)",
            "mass_kg": "kilograms (Ceres derived from GM)",
            "gm_km3_s2": "km^3/s^2", "density_g_cm3": "g/cm^3",
            "semimajor_axis_au": "astronomical units (heliocentric; null for Charon)",
            "semimajor_axis_km": "km", "semimajor_axis_km_from_Pluto": "km (Charon's orbit about Pluto)",
            "eccentricity": "dimensionless", "perihelion_au": "astronomical units",
            "inclination_deg": "degrees (to the ecliptic/J2000; highly inclined for these bodies)",
            "orbital_period_days": "days", "orbital_period_years": "Julian years (365.25 d)",
            "rotation_period_hours": "hours (sidereal; uncertain for Eris/Makemake -- see notes)",
            "abs_magnitude_H": "mag", "geometric_albedo": "dimensionless (visible)",
            "mean_temp_K": "kelvin", "imaged": "true only if visited/imaged up close",
        },
        "generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "verified_date": "2026-07-10",
        "bodies": bodies,
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
        f.write("\n")

    size = os.path.getsize(args.out)
    print(f"Wrote {args.out} ({size} bytes) with {len(bodies)} bodies")
    for name, b in bodies.items():
        img = "IMAGED" if b["imaged"] else "illustrative"
        a = b.get("semimajor_axis_au")
        a_str = f"{a:8.3f} au" if a is not None else "  (orbits Pluto)"
        print(f"  {name:9s} [{img:12s}] r={b['radius_mean_km']:>7} km  "
              f"m={b['mass_kg']:.3e} kg  a={a_str}  e={b['eccentricity']:.3f}  "
              f"i={b['inclination_deg']:>6}  P={b['orbital_period_years']:>8.2f} yr  "
              f"Trot={b['rotation_period_hours']:>8} h  moons={b['known_moons']['count']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
