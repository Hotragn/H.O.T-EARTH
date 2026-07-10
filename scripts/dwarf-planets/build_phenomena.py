#!/usr/bin/env python3
"""Build public/data/dwarf-planets/phenomena.json -- per-body MEASURED /
standout facts for the dwarf-planets HUD (Phase 6), each fact source-tagged.

Every value here is a MEASURED or well-established observed fact from a cited
mission/instrument or peer-reviewed source (verified 2026-07-10). Nothing is a
forecast, and nothing is invented. Values that could not be verified are omitted
rather than guessed.

PHASE HONESTY BAR (from the brief):
  * Dwarf planets have NO weather -> weather:false for every body. The honest
    substance is orbital mechanics (COMPUTED) + measured physical facts +
    real textures WHERE THEY EXIST.
  * Only Pluto/Charon (New Horizons 2015) and Ceres (Dawn 2015-2018) have been
    imaged up close -> imaged:true, appearance:"real imagery (spacecraft mosaic)".
  * Eris, Haumea and Makemake have NEVER been visited -> imaged:false,
    appearance:"ILLUSTRATIVE" -- there is NO surface map; the frontend must show a
    clearly-labeled illustrative/tinted sphere, never implying real imagery.

SOURCES (per fact, in each `source` string; verified 2026-07-10):
  Pluto     Stern et al. 2015, Science 350 (New Horizons overview; ~44 K; ices);
            Moore et al. 2016 / McKinnon et al. 2016 (Sputnik Planitia N2 glaciers);
            Gladstone et al. 2016, Science (N2 atmosphere + haze layers);
            NASA (5 moons; reddish tholins; 3:2 Neptune resonance).
  Charon    Grundy et al. 2016, Nature 539 (Mordor Macula reddish tholins);
            NASA/New Horizons (canyons; mutual tidal lock; barycenter outside
            Pluto -> binary); Brozovic et al. 2015 (masses).
  Ceres     Nathues et al. 2015 / De Sanctis et al. 2016, Nature (Occator bright
            spots = sodium-carbonate salts, cryovolcanic brine); Ruesch et al.
            2016, Science (Ahuna Mons cryovolcano); Dawn extended mission
            (subsurface brine reservoir, 2020); JPL SBDB (9.074 h rotation).
  Eris      Sicardy et al. 2011, Nature 478 (2010 occultation: diameter 2326 km,
            albedo 0.96); Brown & Schaller 2007, Science 316 (mass via Dysnomia,
            ~27% > Pluto = most massive dwarf). NEVER imaged.
  Haumea    Ortiz et al. 2017, Nature 550 (occultation; ring; triaxial shape);
            Ragozzine & Brown 2009, AJ 137 (moons + mass); Trujillo et al. 2007
            (crystalline water ice). NEVER imaged.
  Makemake  Ortiz et al. 2012, Nature 491 (occultation: ~1430 km, albedo 0.82,
            no substantial atmosphere); Parker et al. 2016 (moon); Licandro et
            al. 2006 (methane ice). NEVER imaged.

Usage:
    python scripts/dwarf-planets/build_phenomena.py \
        --out public/data/dwarf-planets/phenomena.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os

REAL = "real imagery (spacecraft mosaic)"
ILLUS = "ILLUSTRATIVE -- never visited; no surface map exists; render a clearly-labeled tinted sphere"

PHENOMENA = {
    "Pluto": {
        "headline": "Nitrogen-glacier heart, hazy atmosphere, and reddish tholins -- imaged by New Horizons",
        "weather": False, "imaged": True, "appearance": REAL,
        "facts": {
            "surfaceIces": {
                "value": "N2, CH4, CO ices",
                "source": "Stern et al. 2015, Science 350 (New Horizons): surface dominated by "
                          "nitrogen (N2) ice with methane (CH4) and carbon monoxide (CO) ices.",
            },
            "sputnikPlanitia": {
                "value": "nitrogen-ice glaciers filling a ~1000 km basin",
                "source": "Moore et al. 2016 / McKinnon et al. 2016, Nature/Science (New Horizons): "
                          "Sputnik Planitia -- the left lobe of 'Tombaugh Regio' (the bright heart) -- "
                          "is a basin filled with convecting, actively glacially-flowing nitrogen ice.",
            },
            "atmosphere": {
                "value": "thin N2 atmosphere with stacked haze layers",
                "source": "Gladstone et al. 2016, Science (New Horizons Alice/LORRI): a thin nitrogen "
                          "atmosphere (surface pressure ~1 Pa / ~10 microbar) with ~20+ stacked "
                          "photochemical HAZE layers extending hundreds of km up.",
            },
            "tholins": {
                "value": "reddish tholins",
                "source": "New Horizons (Stern et al. 2015): reddish-brown tholins -- complex "
                          "organic molecules from methane/nitrogen photochemistry -- colour the "
                          "surface, darkest in Cthulhu Macula.",
            },
            "surfaceTempK": {
                "value": 44,
                "source": "New Horizons (Stern et al. 2015): surface ~44 K (NASA average -232 C). "
                          "Among the coldest surfaces in the solar system.",
            },
            "moons": {
                "value": 5, "names": ["Charon", "Nix", "Hydra", "Kerberos", "Styx"],
                "source": "NASA/New Horizons: five known moons; Charon is by far the largest "
                          "(Pluto-Charon is a binary -- see Charon).",
            },
            "neptuneResonance": {
                "value": "3:2 mean-motion resonance; orbit crosses Neptune's",
                "source": "NASA/JPL: Pluto completes 2 orbits for every 3 of Neptune's; its orbit "
                          "crosses Neptune's (perihelion ~29.7 au) yet the resonance ensures they "
                          "never closely approach.",
            },
        },
    },
    "Charon": {
        "headline": "Pluto's binary partner: reddish polar cap, giant canyons, mutually tidally locked",
        "weather": False, "imaged": True, "appearance": REAL,
        "facts": {
            "mordorMacula": {
                "value": "dark reddish north polar cap",
                "source": "Grundy et al. 2016, Nature 539 (New Horizons): Mordor Macula, the dark "
                          "reddish north polar cap, is reddish tholins produced from Pluto's "
                          "escaping atmospheric gases cold-trapped and processed at Charon's pole.",
            },
            "canyons": {
                "value": "Serenity Chasma / Argo Chasma, to ~9 km deep",
                "source": "New Horizons/NASA: a vast equatorial canyon system (Serenity Chasma "
                          "belt >1000 km long; Argo Chasma potentially ~9 km deep) -- far deeper "
                          "than the Grand Canyon.",
            },
            "mutualTidalLock": {
                "value": True,
                "source": "New Horizons/NASA: Pluto and Charon are MUTUALLY tidally locked -- each "
                          "keeps the same face toward the other (Charon rotation == 6.387 d orbit).",
            },
            "binaryBarycenter": {
                "value": "barycenter outside Pluto",
                "source": "Brozovic et al. 2015 / New Horizons: the Pluto-Charon barycenter lies "
                          "OUTSIDE Pluto (~2110 km from Pluto's centre > Pluto's 1188 km radius), so "
                          "the pair is a true BINARY, not a simple planet-moon. Charon ~12.2% of "
                          "Pluto's mass.",
            },
        },
    },
    "Ceres": {
        "headline": "Salt-bright Occator crater and a cryovolcano -- imaged by Dawn",
        "weather": False, "imaged": True, "appearance": REAL,
        "facts": {
            "occatorBrightSpots": {
                "value": "sodium-carbonate salt deposits (cryovolcanic brine)",
                "source": "Nathues et al. 2015, Nature (discovery) + De Sanctis et al. 2016, Nature "
                          "(composition): the bright spots in Occator crater are sodium-carbonate "
                          "salts left by briny water that reached the surface and sublimated.",
            },
            "ahunaMons": {
                "value": "~4 km-high cryovolcano",
                "source": "Ruesch et al. 2016, Science (Dawn): Ahuna Mons is a young cryovolcanic "
                          "dome (~4 km high, ~17 km wide) built by icy/briny cryovolcanism.",
            },
            "subsurfaceBrine": {
                "value": "possible subsurface brine reservoir",
                "source": "Dawn extended-mission gravity + imaging (2020, Nature Astronomy): "
                          "evidence for a deep subsurface reservoir of brine feeding Occator's "
                          "recent salt deposits.",
            },
            "rotationHours": {
                "value": 9.074,
                "source": "JPL SBDB (Dawn-derived): rotation period 9.074 h -- a short day for a "
                          "~940 km body.",
            },
            "largestBeltObject": {
                "value": "~25% of the asteroid belt's mass",
                "source": "NASA: Ceres is the largest object in the asteroid belt and the only "
                          "dwarf planet in the inner solar system.",
            },
        },
    },
    "Eris": {
        "headline": "The most massive dwarf planet -- a distant, dazzlingly reflective methane-ice world",
        "weather": False, "imaged": False, "appearance": ILLUS,
        "facts": {
            "mostMassive": {
                "value": "~27% more massive than Pluto",
                "source": "Brown & Schaller 2007, Science 316 (mass ~1.66e22 kg from the orbit of "
                          "its moon Dysnomia): Eris is the MOST MASSIVE dwarf planet, though "
                          "slightly SMALLER in diameter than Pluto (2326 vs 2377 km).",
            },
            "sizeAlbedo": {
                "diameterKm": 2326, "geometricAlbedo": 0.96,
                "source": "Sicardy et al. 2011, Nature 478 (2010 stellar occultation): diameter "
                          "2326 +/- 12 km and geometric albedo ~0.96 -- one of the most reflective "
                          "surfaces in the solar system (fresh methane frost).",
            },
            "distance": {
                "value": "a ~68 au, perihelion ~38 au (currently near aphelion)",
                "source": "JPL SBDB: very distant and eccentric (a 67.9 au, e 0.44, perihelion "
                          "38.2 au); Eris is near aphelion, so its atmosphere is frozen to the "
                          "surface.",
            },
            "moon": {
                "value": "Dysnomia",
                "source": "Brown et al. 2006 (discovery): Eris's moon Dysnomia; its orbit gives "
                          "Eris's mass.",
            },
            "appearanceNote": {
                "value": "illustrative only -- never visited",
                "source": "Eris has NEVER been visited or imaged up close (only stellar occultations "
                          "and photometry). There is NO surface map -- any rendered surface is "
                          "ILLUSTRATIVE and must be labeled as such.",
            },
        },
    },
    "Haumea": {
        "headline": "A fast-spinning, egg-shaped dwarf planet with a ring and two moons",
        "weather": False, "imaged": False, "appearance": ILLUS,
        "facts": {
            "triaxialShape": {
                "axesKm": [2100, 1680, 1074],
                "source": "Ortiz et al. 2017, Nature 550 (occultation) + 2019 shape modelling: an "
                          "extreme triaxial (Jacobi) ellipsoid ~2100 x 1680 x 1074 km, elongated by "
                          "its very fast rotation.",
            },
            "fastRotation": {
                "hours": 3.9154,
                "source": "JPL SBDB / Rabinowitz et al. 2006: rotation ~3.915 h -- one of the "
                          "fastest of any large body in the solar system, which forces the "
                          "elongated shape.",
            },
            "ring": {
                "radiusKm": 2287, "widthKm": 70, "discovered": 2017,
                "source": "Ortiz et al. 2017, Nature 550: a ring at radius ~2287 km, width ~70 km -- "
                          "the FIRST ring system discovered around a trans-Neptunian object / dwarf "
                          "planet, in a 3:1 resonance with Haumea's spin.",
            },
            "moons": {
                "value": 2, "names": ["Hi'iaka", "Namaka"],
                "source": "Ragozzine & Brown 2009, AJ 137: two moons, Hi'iaka and Namaka; their "
                          "orbits give Haumea's mass (~3.95e21 kg).",
            },
            "crystallineIce": {
                "value": "66-80% crystalline water ice",
                "source": "Trujillo et al. 2007 / Merlin et al. 2007: the surface is dominated by "
                          "crystalline water ice (a Haumea-family collisional signature).",
            },
            "appearanceNote": {
                "value": "illustrative only -- never visited",
                "source": "Haumea has NEVER been visited or imaged up close. There is NO surface "
                          "map -- any rendered surface is ILLUSTRATIVE and must be labeled as such "
                          "(the elongated shape + ring, however, are real, measured geometry).",
            },
        },
    },
    "Makemake": {
        "headline": "A bright methane-ice dwarf planet with no substantial atmosphere and one small moon",
        "weather": False, "imaged": False, "appearance": ILLUS,
        "facts": {
            "sizeAlbedo": {
                "diameterKm": 1430, "geometricAlbedo": 0.82,
                "source": "Ortiz et al. 2012, Nature 491 (2011 stellar occultation): ~1430 km "
                          "across (slightly flattened), geometric albedo ~0.82 -- brighter than "
                          "Pluto.",
            },
            "methaneEthaneIce": {
                "value": "frozen methane + ethane + tholins",
                "source": "Licandro et al. 2006: surface dominated by frozen methane (CH4) with "
                          "ethane and reddish-brown tholins.",
            },
            "noAtmosphere": {
                "value": "no substantial global atmosphere (<~4-12 nbar)",
                "source": "Ortiz et al. 2012, Nature 491: the sharp occultation profile set an "
                          "upper limit of ~4-12 nbar -- no substantial bound atmosphere (unlike "
                          "Pluto). JWST (2025) detected gaseous methane that may be transient "
                          "outgassing -- flagged, not a bound atmosphere.",
            },
            "rotation": {
                "hours": 22.8266, "status": "uncertain",
                "source": "JPL SBDB 22.83 h (flagged 'may be wrong by 30%'); the light-curve admits "
                          "~11.4 h or ~22.83 h, and the older single-peak value was ~7.77 h "
                          "(Heinze & de Lahunta 2009). Genuinely uncertain.",
            },
            "moon": {
                "value": "S/2015 (136472) 1 (\"MK 2\")",
                "source": "Parker et al. 2016 (HST): one small, dark moon discovered in 2015; its "
                          "orbit now gives a mass (~2.69e21 kg, 2025).",
            },
            "appearanceNote": {
                "value": "illustrative only -- never visited",
                "source": "Makemake has NEVER been visited or imaged up close. There is NO surface "
                          "map -- any rendered surface is ILLUSTRATIVE and must be labeled as such.",
            },
        },
    },
}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="public/data/dwarf-planets/phenomena.json")
    args = ap.parse_args()

    doc = {
        "_comment": (
            "Per-body MEASURED / standout facts for the dwarf-planets HUD (Phase 6), each "
            "fact individually source-tagged. Every value is a measured or well-established "
            "observed fact from a cited mission/instrument or peer-reviewed source -- nothing "
            "is a forecast and nothing is invented. Dwarf planets have NO weather "
            "(weather:false for all). imaged:true and appearance:'real imagery' ONLY for "
            "Pluto, Charon (New Horizons 2015) and Ceres (Dawn 2015-2018). Eris, Haumea and "
            "Makemake have NEVER been visited -> imaged:false, appearance:'ILLUSTRATIVE': "
            "there is NO surface map and the frontend must render a clearly-labeled tinted "
            "sphere, never implying real imagery. Facts for the un-imaged three come from "
            "stellar occultations + photometry, not pictures. See docs/DWARF_PLANETS_PHYSICS.md "
            "and docs/DWARF_PLANETS_DATA_SOURCES.md."
        ),
        "meta": {
            "verified_date": "2026-07-10",
            "generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "honesty": "measured/observed facts only; no forecasts; NO weather on any dwarf planet; "
                       "un-imaged bodies (Eris/Haumea/Makemake) are ILLUSTRATIVE -- no surface map.",
            "imaged_bodies": ["Pluto", "Charon", "Ceres"],
            "illustrative_bodies": ["Eris", "Haumea", "Makemake"],
        },
        "bodies": PHENOMENA,
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
        f.write("\n")

    size = os.path.getsize(args.out)
    print(f"Wrote {args.out} ({size} bytes) with {len(PHENOMENA)} bodies")
    for name, p in PHENOMENA.items():
        tag = "IMAGED (real)" if p["imaged"] else "illustrative"
        print(f"  {name:9s} [{tag:14s}] facts: {', '.join(p['facts'].keys())}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
