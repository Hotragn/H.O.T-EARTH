#!/usr/bin/env python3
"""Build public/data/exoplanets/systems.json -- curated REAL exoplanet systems.

Every value in the output is a MEASURED / archive-published quantity fetched
live from the **NASA Exoplanet Archive** TAP service. Nothing is invented,
interpolated or filled in: where the archive has no value we emit JSON null.

SOURCE (verified 2026-07-10)
  NASA Exoplanet Archive, operated by Caltech/IPAC under NASA contract
  (Exoplanet Exploration Program). Authoritative confirmed-planet catalog.
  TAP endpoint (synchronous):
    https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=<ADQL>&format=json
  Table queried: **pscomppars** (PS Composite Parameters) -- ONE row per
  confirmed planet, assembled from the most complete set of published
  parameters across references. Preferred over `ps` (which has one row per
  reference, i.e. many rows per planet). Verified live against the archive
  column docs (API_PS_columns.html) on 2026-07-10.

COLUMNS + UNITS (verified against the archive column definitions 2026-07-10):
  pl_name          planet name (most common in the literature)
  hostname         host-star name (most common in the literature)
  sy_snum          number of gravitationally bound stars in the system (count)
  sy_pnum          number of confirmed planets in the system (count)
  discoverymethod  method the planet was first identified by
  disc_year        discovery year
  pl_orbper        orbital period                         [days]
  pl_orbsmax       orbit semi-major axis (or projected
                   separation for imaging/microlensing)   [AU]
  pl_orbeccen      orbital eccentricity                   [dimensionless]
  pl_rade          planet radius                          [Earth radii]
  pl_bmasse        best mass estimate: true mass, M*sin i,
                   or M*sin i / sin i (see caveat below)  [Earth masses]
  pl_eqt           equilibrium temperature (black-body)   [Kelvin]
  pl_insol         insolation flux                        [Earth flux = 1]
  sy_dist          distance to the system                 [parsecs]
  st_spectype      stellar spectral type (Morgan-Keenan)
  st_teff          stellar effective temperature          [Kelvin]
  st_rad           stellar radius                         [solar radii]
  st_mass          stellar mass                           [solar masses]
  st_lum           stellar luminosity            [log10(solar luminosity)]

MEASURED vs COMPUTED here:
  - Everything pulled from the archive is MEASURED / published (radii from
    transits, masses often from radial velocity, etc.). See caveats below.
  - The ONLY computed field is `distance_ly` = distance_pc * 3.26156
    (unit conversion parsecs -> light-years), plus `directly_imaged`, a
    convenience boolean set to True when discoverymethod == 'Imaging'.
  - Habitable-zone bounds, composition guesses and appearances are NOT in
    this file; they are documented as COMPUTED / ILLUSTRATIVE in
    docs/EXOPLANETS_PHYSICS.md and produced in the app, not here.

MASS CAVEAT: pl_bmasse is the archive's "best mass" -- for radial-velocity
planets without a transit it is frequently only a MINIMUM mass (M*sin i).
Radii come from transit depth. Many values carry large uncertainties. We do
not attempt to distinguish true-mass from minimum-mass in this compact file;
docs/EXOPLANETS_PHYSICS.md states the caveat plainly.

ACKNOWLEDGMENT (required by the archive, displayed by the app & stored in the
JSON meta verbatim):
  "This research has made use of the NASA Exoplanet Archive, which is operated
   by the California Institute of Technology, under contract with the National
   Aeronautics and Space Administration under the Exoplanet Exploration
   Program."
  Primary reference: Christiansen et al. (2025), Planetary Science Journal.

CURATION: a hand-picked set of scientifically notable + pedagogically great
systems (resonant chains, first-of-kind discoveries, habitable-zone worlds,
the rare directly-imaged planets) UNION the nearest systems to the Sun
(sy_dist < NEAREST_MAX_PC). See CURATED_NOTABLE below for why each is in.

Usage:
    python scripts/exoplanets/build_systems.py \
        --out public/data/exoplanets/systems.json

Re-runnable: it re-queries the live TAP API each run, so counts/values track
the archive. Requires the `requests` package and network access.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import os
import sys
import urllib.parse
import urllib.request

TAP_SYNC = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

PC_TO_LY = 3.26156  # 1 parsec in light-years (IAU 2015 based)

# Nearest-neighbour sweep: every system closer than this many parsecs is
# included automatically (the pedagogically important "our stellar backyard").
NEAREST_MAX_PC = 5.0

# --- Curated notable systems: exact archive hostname strings (verified live
#     2026-07-10) with the reason each earns a slot. ---------------------------
CURATED_NOTABLE = {
    "TRAPPIST-1":  "7-planet resonant chain, several near the habitable zone",
    "Proxima Cen": "nearest star to the Sun; Proxima b in the habitable zone",
    "KOI-351":     "Kepler-90 -- 8 planets, the most Solar-System-like count",
    "Kepler-452":  "'Earth's cousin' -- Earth-size in a Sun-like star's HZ",
    "Kepler-186":  "first Earth-size planet in the habitable zone (Kepler-186 f)",
    "Kepler-11":   "6 compact, low-density transiting planets",
    "Kepler-16":   "first confirmed circumbinary planet ('Tatooine')",
    "Kepler-22":   "first Kepler habitable-zone planet (Kepler-22 b)",
    "Kepler-62":   "5 planets, two small HZ super-Earths (62 e/f)",
    "Kepler-442":  "one of the most Earth-like habitable-zone planets known",
    "Kepler-1649": "Kepler-1649 c -- Earth-size, habitable-zone, red dwarf",
    "Kepler-138":  "low-mass multi incl. water-world candidates",
    "Kepler-444":  "ancient 5-planet system (~11 Gyr old)",
    "51 Peg":      "first exoplanet found around a Sun-like star (51 Peg b)",
    "HD 209458":   "first transiting exoplanet ('Osiris')",
    "HD 189733":   "bright hot-Jupiter benchmark for atmosphere studies",
    "55 Cnc":      "5 planets incl. 55 Cnc e, a lava super-Earth",
    "GJ 667 C":    "multi-planet M dwarf in a triple system; HZ super-Earths",
    "LHS 1140":    "LHS 1140 b -- dense HZ super-Earth / mini-Neptune, transiting",
    "K2-18":       "K2-18 b -- sub-Neptune with atmospheric water/CH4 detections",
    "TOI-700":     "TOI-700 d/e -- Earth-size TESS planets in the HZ",
    "HR 8799":     "4 DIRECTLY IMAGED giant planets (the rare imaged case)",
    "bet Pic":     "Beta Pictoris -- directly imaged giant(s) in a debris disk",
    "51 Eri":      "51 Eri b -- directly imaged young Jupiter (GPI, 2015)",
    "WASP-12":     "ultra-hot Jupiter being tidally disrupted",
    "WASP-121":    "ultra-hot Jupiter with a glowing stratosphere",
    "WASP-39":     "JWST detected CO2 in its atmosphere (2022)",
    "WASP-96":     "JWST's first transmission spectrum (water, 2022)",
    "WASP-43":     "hot Jupiter with a JWST thermal phase-curve map",
    "GJ 1214":     "GJ 1214 b -- benchmark warm sub-Neptune / 'water world'",
    "GJ 486":      "nearby transiting rocky super-Earth (JWST target)",
    "GJ 357":      "nearby multi incl. GJ 357 d in the habitable zone",
    "GJ 3512":     "M dwarf hosting a surprisingly massive giant planet",
    "L 98-59":     "nearby TESS multi with small transiting planets",
    "LTT 1445 A":  "one of the nearest transiting rocky-planet systems",
    "LP 890-9":    "SPECULOOS red dwarf; LP 890-9 c in the HZ",
    "TOI-270":     "nearby 3-planet system spanning the radius valley",
    "HD 110067":   "6 planets in an unbroken resonant chain (2023)",
    "HD 219134":   "nearby (6.5 pc) multi with transiting super-Earths",
    "HD 40307":    "multi-super-Earth system incl. an HZ candidate",
    "HD 10180":    "rich 6-planet system, Solar-System-like architecture",
    "ups And":     "first multi-planet system around a main-sequence star",
    "47 UMa":      "early Jupiter-analog system around a Sun-like star",
}

# Archive hostname -> common display name, only where the two differ.
COMMON_NAMES = {
    "KOI-351": "Kepler-90",
    "Proxima Cen": "Proxima Centauri",
    "51 Peg": "51 Pegasi",
    "51 Eri": "51 Eridani",
    "55 Cnc": "55 Cancri",
    "bet Pic": "Beta Pictoris",
    "GJ 667 C": "Gliese 667 C",
    "ups And": "Upsilon Andromedae",
    "47 UMa": "47 Ursae Majoris",
    "eps Eri": "Epsilon Eridani",
    "eps Ind A": "Epsilon Indi A",
    "tau Cet": "Tau Ceti",
}

COLUMNS = [
    "pl_name", "hostname", "sy_snum", "sy_pnum", "discoverymethod", "disc_year",
    "pl_orbper", "pl_orbsmax", "pl_orbeccen", "pl_rade", "pl_bmasse",
    "pl_eqt", "pl_insol", "sy_dist",
    "st_spectype", "st_teff", "st_rad", "st_mass", "st_lum",
]


def adql_quote(s: str) -> str:
    """Escape a string literal for ADQL (double any single quote)."""
    return "'" + s.replace("'", "''") + "'"


def run_tap(adql: str) -> list[dict]:
    url = TAP_SYNC + "?" + urllib.parse.urlencode({"query": adql, "format": "json"})
    req = urllib.request.Request(url, headers={"User-Agent": "H.O.T-EARTH/exoplanets (open-source digital twin)"})
    with urllib.request.urlopen(req, timeout=300) as resp:
        raw = resp.read().decode("utf-8")
    data = json.loads(raw)
    if not isinstance(data, list):
        raise RuntimeError(f"Unexpected TAP response: {raw[:400]}")
    return data


def sig(x, n=5):
    """Round to n significant figures; pass through None."""
    if x is None:
        return None
    x = float(x)
    if x == 0:
        return 0.0
    d = n - 1 - math.floor(math.log10(abs(x)))
    r = round(x, d)
    # collapse -0.0 and integer-valued floats stay float for JSON compactness
    return r + 0.0


def fixed(x, ndigits):
    if x is None:
        return None
    return round(float(x), ndigits)


def rint(x):
    if x is None:
        return None
    return int(round(float(x)))


def first_present(rows, key):
    for r in rows:
        if r.get(key) is not None:
            return r.get(key)
    return None


def build(out_path: str) -> int:
    hosts = sorted(CURATED_NOTABLE.keys())
    in_list = ", ".join(adql_quote(h) for h in hosts)
    cols = ", ".join(COLUMNS)
    adql = (
        f"select {cols} from pscomppars "
        f"where hostname in ({in_list}) or sy_dist < {NEAREST_MAX_PC} "
        f"order by sy_dist, hostname, pl_orbper"
    )
    print("Querying NASA Exoplanet Archive TAP (pscomppars)...", file=sys.stderr)
    rows = run_tap(adql)
    print(f"  fetched {len(rows)} planet rows", file=sys.stderr)

    # group by hostname
    by_host: dict[str, list[dict]] = {}
    for r in rows:
        by_host.setdefault(r["hostname"], []).append(r)

    systems = []
    imaged_names = []
    for host in sorted(by_host, key=lambda h: (first_present(by_host[h], "sy_dist") or 9e9)):
        hrows = by_host[host]
        dist_pc = first_present(hrows, "sy_dist")
        star = {
            "spectype": first_present(hrows, "st_spectype"),
            "teff": rint(first_present(hrows, "st_teff")),
            "rad": fixed(first_present(hrows, "st_rad"), 4),
            "mass": fixed(first_present(hrows, "st_mass"), 4),
            "lum": fixed(first_present(hrows, "st_lum"), 4),
        }
        planets = []
        # sort planets by orbital period (nulls last), then name
        def psort(r):
            p = r.get("pl_orbper")
            return (p is None, p if p is not None else 0.0, r.get("pl_name") or "")
        for r in sorted(hrows, key=psort):
            pl = {
                "name": r.get("pl_name"),
                "method": r.get("discoverymethod"),
                "disc_year": r.get("disc_year"),
                "period_days": sig(r.get("pl_orbper"), 6),
                "sma_au": sig(r.get("pl_orbsmax"), 5),
                "ecc": fixed(r.get("pl_orbeccen"), 4),
                "radius_re": fixed(r.get("pl_rade"), 3),
                "mass_me": sig(r.get("pl_bmasse"), 5),
                "eqt_k": rint(r.get("pl_eqt")),
                "insol": sig(r.get("pl_insol"), 4),
            }
            if (r.get("discoverymethod") or "") == "Imaging":
                pl["directly_imaged"] = True
                imaged_names.append(r.get("pl_name"))
            planets.append(pl)

        sysobj = {
            "hostname": host,
            "sy_snum": rint(first_present(hrows, "sy_snum")),
            "distance_pc": fixed(dist_pc, 4),
            "distance_ly": fixed(dist_pc * PC_TO_LY, 2) if dist_pc is not None else None,
            "star": star,
            "planets": planets,
        }
        if host in COMMON_NAMES:
            sysobj["common_name"] = COMMON_NAMES[host]
        if host in CURATED_NOTABLE:
            sysobj["note"] = CURATED_NOTABLE[host]
        systems.append(sysobj)

    n_planets = sum(len(s["planets"]) for s in systems)
    doc = {
        "meta": {
            "title": "Curated real exoplanet systems (NASA Exoplanet Archive)",
            "source": (
                "NASA Exoplanet Archive, pscomppars (PS Composite Parameters) table, "
                "operated by Caltech/IPAC under contract with NASA (Exoplanet "
                "Exploration Program). Queried live via the TAP service."
            ),
            "tap_endpoint": TAP_SYNC + "?query=<ADQL>&format=json",
            "table": "pscomppars",
            "adql": adql,
            "acknowledgment": (
                "This research has made use of the NASA Exoplanet Archive, which is "
                "operated by the California Institute of Technology, under contract "
                "with the National Aeronautics and Space Administration under the "
                "Exoplanet Exploration Program."
            ),
            "primary_citation": "Christiansen et al. (2025), Planetary Science Journal.",
            "license_note": (
                "NASA Exoplanet Archive data are produced by a US-Government-funded "
                "program (NASA/Caltech-IPAC); the measured catalog values are facts, "
                "freely usable. The archive REQUESTS the acknowledgment above -- "
                "display it. See docs/EXOPLANETS_DATA_SOURCES.md."
            ),
            "units": {
                "period_days": "days",
                "sma_au": "AU",
                "ecc": "dimensionless",
                "radius_re": "Earth radii",
                "mass_me": "Earth masses (often a MINIMUM mass, M*sin i, for RV planets)",
                "eqt_k": "Kelvin (equilibrium temperature, black-body model)",
                "insol": "Earth insolation flux (Earth = 1)",
                "distance_pc": "parsecs",
                "distance_ly": "light-years (computed = parsecs * 3.26156)",
                "star.teff": "Kelvin",
                "star.rad": "solar radii",
                "star.mass": "solar masses",
                "star.lum": "log10(solar luminosity)",
            },
            "honesty": (
                "Every value is a NASA Exoplanet Archive measured/published quantity; "
                "null = the archive has no value (never filled in). The only computed "
                "fields are distance_ly (pc->ly) and directly_imaged (discoverymethod "
                "== 'Imaging'). Masses are frequently minimum masses (M*sin i); radii "
                "from transits; many parameters have large uncertainties. Appearances/"
                "habitable zones are NOT in this file -- see docs/EXOPLANETS_PHYSICS.md."
            ),
            "verified_date": "2026-07-10",
            "generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "nearest_sweep_max_pc": NEAREST_MAX_PC,
            "counts": {"systems": len(systems), "planets": n_planets},
        },
        "systems": systems,
    }

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
        f.write("\n")

    size = os.path.getsize(out_path)
    print(f"Wrote {out_path} ({size} bytes = {size/1024:.1f} KB)")
    print(f"  systems: {len(systems)}   planets: {n_planets}")
    print(f"  directly imaged planets ({len(imaged_names)}): {', '.join(sorted(imaged_names))}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="public/data/exoplanets/systems.json")
    args = ap.parse_args()
    return build(args.out)


if __name__ == "__main__":
    raise SystemExit(main())
