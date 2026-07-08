#!/usr/bin/env python3
"""Build public/data/planets/saturn_rings.json -- real Saturn ring geometry.

Ring/gap boundary radii (distance from Saturn's center, km) for rendering the
ring system TO SCALE. Every boundary is a real, published value; nothing is
invented. Also emits each radius in units of Saturn's equatorial radius
(R_Saturn = 60,268 km, JPL) so the renderer can place the rings relative to the
planet sphere.

SOURCES (verified 2026-07-06):
  * Canonical: NASA NSSDCA "Saturnian Rings Fact Sheet" (D. R. Williams),
    https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html
    (host 307-redirects to nasa.gov/nssdc as of 2026-07-06 -- same issue as the
    planet fact sheets; see build_constants.py).
  * Transcribed cross-check (the actual numbers below were read verbatim from
    the compiled boundary table on): Wikipedia "Rings of Saturn"
    https://en.wikipedia.org/wiki/Rings_of_Saturn (Overall-structure table),
    fetched 2026-07-06. These match the NSSDC fact sheet and the standard
    planetary-science tabulation to rounding.
  * Primary literature for the boundary radii: Cuzzi, J. N., Filacchione, G.,
    Marouf, E. A. (2018), "The Rings of Saturn", review chapter (hosted at
    nasa.gov); ultimately from French & Nicholson stellar/radio occultation
    radii. The Encke and Keeler gap radii and the Cassini Division are the
    standard occultation-derived values.
  * Saturn equatorial radius R_Saturn = 60,268 km: JPL SSD phys_par (as in
    constants.json).

License: NASA data public domain; the compiled boundary values are standard
published planetary-science constants. Attribution: NASA/NSSDCA + the ring
occultation literature.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os

R_SATURN_KM = 60268.0  # equatorial radius, JPL SSD (1-bar)

# (name, kind, inner_km, outer_km, width_km_or_None, note)
# Transcribed verbatim from the Wikipedia "Rings of Saturn" overall-structure
# table (2026-07-06), which reproduces the NSSDC/occultation values.
# kind: "ring" (a broad ring) | "division" (a real depleted gap between rings)
#       | "gap" (a narrow gap inside a ring)
FEATURES = [
    ("D Ring",           "ring",      66900,  74510,   7500,
        "Innermost, very faint; inner edge ~1.11 R_Saturn."),
    ("C Ring",           "ring",      74658,  92000,  17500,
        "Faint 'crepe' ring. Contains the Colombo Gap (~77,870 km, 150 km) and Maxwell Gap (~87,491 km, 270 km)."),
    ("B Ring",           "ring",      92000, 117580,  25500,
        "Brightest, most massive, opaque ring."),
    ("Cassini Division", "division", 117580, 122170,   4700,
        "The largest, telescope-visible gap between the B and A rings; not empty (has C-ring-like material)."),
    ("A Ring",           "ring",     122170, 136775,  14600,
        "Outer bright ring; contains the Encke and Keeler gaps."),
    ("Roche Division",   "division", 136775, 139380,   2600,
        "Between the A ring and the F ring."),
    ("F Ring",           "ring",     140180, 140680,    500,
        "Narrow, shepherded (Prometheus/Pandora); width variable ~30-500 km. Outer value approximate."),
    ("G Ring",           "ring",     166000, 175000,   9000,
        "Faint, dusty."),
    ("E Ring",           "ring",     180000, 480000, 300000,
        "Very broad, diffuse; fed by Enceladus' plumes."),
]

# Narrow gaps inside rings, given as center radius + width (occultation values).
GAPS = [
    ("Colombo Gap", 77870,  150, "In the C ring (Titan ringlet gap)."),
    ("Maxwell Gap", 87491,  270, "In the C ring."),
    ("Encke Gap",  133589,  325, "In the outer A ring; opened by moon Pan. Center radius 133,589 km."),
    ("Keeler Gap", 136505,   35, "Near the A ring's outer edge; opened by moon Daphnis."),
]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="public/data/planets/saturn_rings.json")
    args = ap.parse_args()

    def r_units(km):
        return round(km / R_SATURN_KM, 4)

    features = []
    for name, kind, inner, outer, width, note in FEATURES:
        features.append({
            "name": name, "kind": kind,
            "inner_radius_km": inner, "outer_radius_km": outer,
            "width_km": width,
            "inner_radius_Rsaturn": r_units(inner),
            "outer_radius_Rsaturn": r_units(outer),
            "note": note,
        })
    gaps = []
    for name, center, width, note in GAPS:
        gaps.append({
            "name": name, "kind": "gap",
            "center_radius_km": center, "width_km": width,
            "center_radius_Rsaturn": r_units(center),
            "note": note,
        })

    doc = {
        "_comment": (
            "Real Saturn ring-system geometry for rendering the rings TO SCALE. "
            "Boundary radii are distance from Saturn's CENTER in km, plus the "
            "same values in units of Saturn's equatorial radius R_Saturn = "
            "60,268 km. These are published occultation-derived values (NASA "
            "NSSDCA Saturnian Rings Fact Sheet; standard planetary-science "
            "tabulation), NOT invented. The main rings from inside out are D, C, "
            "B, [Cassini Division], A, then the fainter F, G, E. The Cassini "
            "Division and Encke Gap are the real, named depleted regions. See "
            "docs/PLANETS_DATA_SOURCES.md."
        ),
        "planet": "Saturn",
        "R_saturn_equatorial_km": R_SATURN_KM,
        "units": {
            "radius_km": "km from Saturn's center",
            "radius_Rsaturn": "multiples of Saturn's equatorial radius (60,268 km)",
            "width_km": "radial width in km",
        },
        "source": {
            "canonical": "NASA NSSDCA Saturnian Rings Fact Sheet (D. R. Williams)",
            "canonical_url": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html",
            "canonical_note": "host 307-redirects to nasa.gov/nssdc as of 2026-07-06",
            "transcribed_from": "Wikipedia 'Rings of Saturn' overall-structure table (matches NSSDC), fetched 2026-07-06",
            "primary_literature": "Cuzzi, Filacchione & Marouf (2018), 'The Rings of Saturn' (review); French & Nicholson occultation radii",
            "R_saturn_source": "JPL SSD phys_par (equatorial radius 60,268 km)",
            "license": "NASA data public domain; standard published constants",
            "verified_date": "2026-07-06",
        },
        "rendering_hint": {
            "visible_span_km": [66900, 140680],
            "visible_span_Rsaturn": [r_units(66900), r_units(140680)],
            "note": "For a to-scale view, draw D through F (66,900-140,680 km = ~1.11-2.33 R_Saturn). The G and especially E rings are extremely faint/diffuse and are usually omitted or drawn as a faint haze.",
        },
        "features": features,
        "gaps_inside_rings": gaps,
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
        f.write("\n")

    size = os.path.getsize(args.out)
    print(f"Wrote {args.out} ({size} bytes)")
    for feat in features:
        print(f"  {feat['name']:16s} {feat['inner_radius_km']:>7}-{feat['outer_radius_km']:>7} km "
              f"({feat['inner_radius_Rsaturn']:.3f}-{feat['outer_radius_Rsaturn']:.3f} R_Sat)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
