#!/usr/bin/env python3
"""Build public/data/moons/phenomena.json -- per-moon MEASURED "feature" facts
for the HUD, each fact individually source-tagged.

Every value here is a MEASURED or well-established observed fact from a cited
mission/instrument or peer-reviewed source (verified 2026-07-08). Nothing is a
forecast, and nothing is invented. Items that are genuinely debated in the
literature (e.g. Europa plumes) are marked status:"debated" and NOT presented
as settled. Values that could not be verified are omitted rather than guessed.

Per the phase honesty bar: MOST of these moons have NO weather -- the honest
substance is orbital mechanics (tidal locking, resonance) + measured phenomena
(volcanism, plumes, oceans, craters) + real textures. The ONE exception with
genuine weather is TITAN (methane cycle: seas, rain, rivers), presented as real.

SOURCES (per fact, in each `source` string; verified 2026-07-08):
  Io        NASA Io overview; Galileo/Voyager/Juno imaging; Veeder et al. 2012
            (global heat flow); Pele/Tvashtar plume heights from Galileo/New Horizons.
  Europa    Kivelson et al. 2000 (Galileo induced magnetic field -> ocean);
            NASA (ocean ~2x Earth's water); plumes Roth et al. 2014 / Sparks
            et al. 2016-2017 (HST) -- DEBATED, not confirmed.
  Ganymede  Kivelson et al. 1996 (Galileo intrinsic magnetic field); Saur et al.
            2015 (HST aurora -> subsurface ocean); NASA (largest moon).
  Callisto  NASA (most heavily cratered object in the solar system); Zimmer et
            al. 2000 (Galileo induced field -> possible ocean).
  Titan     Huygens HASI, Fulchignoni et al. 2005 (1.45 bar, 93.7 K, N2 98.4%);
            Cassini RADAR sea names (Kraken/Ligeia/Punga Mare); NASA methane cycle.
  Enceladus Porco et al. 2006 (Cassini jets); Spahn/Kempf et al. 2006 (plume
            feeds the E ring); NASA (global subsurface ocean); Verbiscer 2007
            (brightest body, geometric albedo 1.375).
  Mimas     NASA (Herschel crater 139 km); Lainey et al. 2024, Nature (evidence
            for a young subsurface ocean) -- RECENT / flagged.
  Iapetus   NASA / Cassini (two-tone albedo dichotomy); Porco et al. 2005 /
            Ip 2006 (equatorial ridge).
  Triton    Smith et al. 1989 / Soderblom et al. 1990 (Voyager 2 N2 geysers,
            <=8 km plumes); Broadfoot et al. 1989 (thin N2 atmosphere); NASA
            (retrograde capture, 38 K, cantaloupe terrain).

Usage:
    python scripts/moons/build_phenomena.py \
        --out public/data/moons/phenomena.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os

NASA = "NASA/JPL"

PHENOMENA = {
    "Io": {
        "headline": "Most volcanically active body in the solar system",
        "weather": False,
        "facts": {
            "activeVolcanoes": {
                "value": "~400 (est.); >150 observed active",
                "source": "NASA/JPL; Galileo/Voyager/Juno + ground-based monitoring. ~400 volcanic "
                          "centres estimated, of which >150 have been observed actively erupting.",
            },
            "tidalHeating": {
                "meanHeatFlowWm2": 2.0, "globalHeatOutputW": 1.0e14,
                "source": "Veeder et al. 2012, Icarus (global heat flow ~10^14 W, ~2 W/m^2 average, "
                          "~40x Earth's). Powered by tidal heating from the 1:2:4 Laplace resonance.",
            },
            "plumeHeightsKm": {
                "Pele": 390, "Tvashtar": 385,
                "source": "Galileo / New Horizons imaging: Pele plume ~390 km, Tvashtar ~385 km high "
                          "(+/- ~30 km). Fine sulfur/SO2 plumes reach hundreds of km above the surface.",
            },
            "hotspotTempsK": {
                "value": "up to ~1300-1600 K at active silicate lava vents",
                "source": "Galileo NIMS / Juno JIRAM: high-temperature silicate volcanism; vent "
                          "temperatures far above the ~110 K background surface.",
            },
        },
    },
    "Europa": {
        "headline": "Young ice shell over a subsurface salt-water ocean",
        "weather": False,
        "facts": {
            "subsurfaceOcean": {
                "value": True,
                "source": "Kivelson et al. 2000, Science (Galileo magnetometer: Jupiter-induced "
                          "magnetic field requires a near-surface conducting layer = salty liquid "
                          "ocean). NASA: the ocean may hold ~2x the water of Earth's oceans.",
            },
            "youngSurface": {
                "value": "few craters; surface age ~40-90 Myr",
                "source": "Galileo imaging (crater counts). One of the youngest, smoothest solid "
                          "surfaces in the solar system -> active resurfacing.",
            },
            "chaosTerrain": {
                "value": True,
                "source": "Galileo imaging: 'chaos' regions of broken, rotated ice blocks -- evidence "
                          "of a mobile/observably active ice shell above liquid or warm ice.",
            },
            "plumes": {
                "value": "possible", "status": "debated",
                "source": "Roth et al. 2014 and Sparks et al. 2016-2017 (HST) reported possible "
                          "water-vapour plumes; NOT confirmed/repeatable -- explicitly DEBATED. "
                          "Europa Clipper (launched 2024-10-14) is designed to settle it.",
            },
        },
    },
    "Ganymede": {
        "headline": "Largest moon in the solar system; the only one with its own magnetic field",
        "weather": False,
        "facts": {
            "largestMoon": {
                "value": True, "meanRadiusKm": 2631.2,
                "source": "NASA/JPL: Ganymede (r 2631 km) is the largest moon in the solar system -- "
                          "larger than the planet Mercury (r 2440 km) and Pluto.",
            },
            "intrinsicMagneticField": {
                "value": True,
                "source": "Kivelson et al. 1996, Nature (Galileo): Ganymede is the ONLY moon known to "
                          "generate its own intrinsic magnetic field (an internal dynamo), producing "
                          "polar auroras.",
            },
            "subsurfaceOcean": {
                "value": True,
                "source": "Saur et al. 2015, JGR (HST auroral-oscillation constraint) + Galileo data: "
                          "strong evidence for a subsurface salt-water ocean.",
            },
        },
    },
    "Callisto": {
        "headline": "Among the oldest, most heavily cratered surfaces in the solar system",
        "weather": False,
        "facts": {
            "mostHeavilyCratered": {
                "value": True,
                "source": "NASA/JPL: Callisto is the most heavily cratered object in the solar "
                          "system -- an ancient, geologically dead surface saturated with impacts.",
            },
            "possibleOcean": {
                "value": "possible", "status": "possible",
                "source": "Zimmer et al. 2000, Icarus (Galileo magnetometer): an induced magnetic "
                          "field hints at a deep briny layer. Deep and unconfirmed -- flagged as possible.",
            },
        },
    },
    "Titan": {
        "headline": "Thick N2 atmosphere with an active methane cycle -- the one moon with real weather",
        "weather": True,
        "facts": {
            "atmospherePressureBar": {
                "value": 1.45,
                "source": "Huygens HASI, Fulchignoni et al. 2005, Nature (surface pressure 146.7 kPa "
                          "= 1.45 atm -- ~50% denser than Earth's at the surface).",
            },
            "atmosphereN2Percent": {
                "value": 98.4,
                "source": "Cassini/Huygens: atmosphere ~98.4% nitrogen (N2), ~1.4% methane (CH4) + "
                          "trace hydrocarbons.",
            },
            "surfaceTempK": {
                "value": 93.7,
                "source": "Huygens HASI, Fulchignoni et al. 2005 (surface 93.7 K, -179.5 C).",
            },
            "methaneCycle": {
                "value": True,
                "source": "Cassini/Huygens: an active hydrologic cycle in methane/ethane -- clouds, "
                          "rain, rivers, lakes and seas. The only world besides Earth with standing "
                          "surface liquid and genuine weather.",
            },
            "seas": {
                "value": ["Kraken Mare", "Ligeia Mare", "Punga Mare"],
                "combinedAreaKm2": 691000,
                "source": "Cassini RADAR (north polar seas of liquid methane/ethane): Kraken Mare "
                          "(largest), Ligeia Mare (2nd), Punga Mare (3rd); together ~80% of Titan's "
                          "sea+lake area (~691,000 km^2).",
            },
        },
    },
    "Enceladus": {
        "headline": "South-polar water plumes feeding Saturn's E ring, from a global subsurface ocean",
        "weather": False,
        "facts": {
            "plumes": {
                "value": True, "jets": "100+ from 4 'tiger stripe' fractures",
                "source": "Porco et al. 2006, Science (Cassini): 100+ discrete jets of water vapour + "
                          "ice grains erupt from the four south-polar 'tiger stripe' fractures "
                          "(Alexandria, Cairo, Baghdad, Damascus sulci).",
            },
            "feedsSaturnERing": {
                "value": True,
                "source": "Spahn et al. 2006 / Kempf et al. (Cassini CDA): the plume is the dominant "
                          "source of Saturn's diffuse E ring; Enceladus orbits within it.",
            },
            "subsurfaceOcean": {
                "value": True,
                "source": "Cassini gravity + libration (Iess et al. 2014; Thomas et al. 2016): a "
                          "GLOBAL subsurface salt-water ocean; plume grains contain salts + silica "
                          "(hydrothermal chemistry).",
            },
            "geometricAlbedo": {
                "value": 1.375,
                "source": "Verbiscer et al. 2007, Science (geometric albedo 1.375 at 550 nm -- the "
                          "brightest body in the solar system; fresh-ice plume fallout).",
            },
        },
    },
    "Mimas": {
        "headline": "The 'Death Star' moon: dominated by the giant Herschel crater",
        "weather": False,
        "facts": {
            "herschelCrater": {
                "diameterKm": 139,
                "source": "NASA/JPL (Cassini/Voyager): the impact crater Herschel is 139 km across "
                          "(~1/3 of Mimas' diameter), with a ~6 km central peak -- the 'Death Star' look.",
            },
            "possibleYoungOcean": {
                "value": "possible", "status": "recent/debated",
                "source": "Lainey et al. 2024, Nature: orbital-libration analysis suggests a "
                          "geologically young subsurface ocean. RECENT result -- flagged as debated.",
            },
        },
    },
    "Iapetus": {
        "headline": "Two-tone moon: one coal-dark hemisphere, one bright, plus a giant equatorial ridge",
        "weather": False,
        "facts": {
            "twoToneAlbedo": {
                "darkLeadingCassiniRegio": [0.03, 0.05], "brightTrailing": [0.5, 0.6],
                "source": "NASA/Cassini: the leading hemisphere (Cassini Regio) is coal-dark "
                          "(geometric albedo 0.03-0.05) while the trailing hemisphere is bright "
                          "(0.5-0.6) -- a thermal-runaway ice-migration dichotomy.",
            },
            "equatorialRidge": {
                "value": "~1300 km long, up to ~20 km high",
                "source": "Porco et al. 2005 (Cassini) / Ip 2006: a narrow ridge runs along much of "
                          "Iapetus' equator, giving it a walnut shape.",
            },
        },
    },
    "Triton": {
        "headline": "Retrograde captured world with active nitrogen geysers -- among the coldest measured",
        "weather": False,
        "facts": {
            "retrogradeOrbit": {
                "value": True, "inclinationDeg": 157.3,
                "source": "JPL SSD orbital elements (i = 157.3 deg > 90 = retrograde). NASA: Triton "
                          "almost certainly a captured Kuiper-belt object.",
            },
            "geysers": {
                "value": True, "plumeHeightKm": 8, "count": ">=4 observed",
                "source": "Smith et al. 1989 / Soderblom et al. 1990 (Voyager 2, 1989): >=4 active "
                          "geysers venting nitrogen gas + dark dust ~8 km high, then drifting >100 km "
                          "downwind.",
            },
            "thinN2Atmosphere": {
                "value": True, "surfacePressurePa": 1.4,
                "source": "Broadfoot et al. 1989 (Voyager 2): thin nitrogen atmosphere, surface "
                          "pressure ~1.4 Pa (~14 microbar), ~1/70000 of Earth's.",
            },
            "surfaceTempK": {
                "value": 38,
                "source": "Voyager 2 (1989), Tyler et al. 1989 / Broadfoot et al. 1989: ~38 K "
                          "(-235 C) -- among the coldest surfaces measured in the solar system.",
            },
            "cantaloupeTerrain": {
                "value": True,
                "source": "Voyager 2 imaging (Soderblom et al. 1990): dimpled 'cantaloupe' terrain, "
                          "unique in the solar system, likely from icy diapirism.",
            },
        },
    },
}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="public/data/moons/phenomena.json")
    args = ap.parse_args()

    doc = {
        "_comment": (
            "Per-moon MEASURED 'feature' facts for the major-moons HUD, each fact "
            "individually source-tagged. Every value is a measured or well-established "
            "observed fact from a cited mission/instrument or peer-reviewed source -- "
            "nothing is a forecast and nothing is invented. Genuinely debated items "
            "(Europa/Callisto plumes/ocean specifics, Mimas' young ocean) carry "
            "status:'debated'/'possible'/'recent'. Per the phase honesty bar: MOST of "
            "these moons have NO weather; the honest substance is orbital mechanics + "
            "measured phenomena + real textures. TITAN is the sole exception with a "
            "genuine (methane) weather cycle -> weather:true. See docs/MOONS_PHYSICS.md "
            "and docs/MOONS_DATA_SOURCES.md."
        ),
        "meta": {
            "verified_date": "2026-07-08",
            "generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "honesty": "measured/observed facts only; debated items flagged; no forecasts; "
                       "no invented weather (Titan is the only weather moon).",
            "weather_moon": "Titan (methane cycle)",
        },
        "bodies": PHENOMENA,
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
        f.write("\n")

    size = os.path.getsize(args.out)
    print(f"Wrote {args.out} ({size} bytes) with {len(PHENOMENA)} moons")
    for name, p in PHENOMENA.items():
        w = "WEATHER" if p["weather"] else "no weather"
        print(f"  {name:9s} [{w:10s}] facts: {', '.join(p['facts'].keys())}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
