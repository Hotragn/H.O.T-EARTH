#!/usr/bin/env python3
"""Build public/data/small-bodies/objects.json -- curated REAL comets and
near-Earth / notable asteroids for the small-bodies phase (Phase 9).

Every orbital / physical value in the output is a MEASURED, published quantity
fetched live from NASA/JPL's Small-Body Database (SBDB) API, and every
close-approach fact is fetched live from JPL/CNEOS's Close-Approach Data (CAD)
API. Nothing orbital/physical is invented or interpolated: where SBDB has no
value we emit JSON null.

The ONLY curated (hand-transcribed, not-from-SBDB) per-object fields are:
  * visited (bool) + mission (str)   -- historical spacecraft record
  * interstellar (bool)              -- physics fact, TRUE only for 1I and 2I
  * note (str)                       -- short honest human summary
These are well-established public facts, flagged as curated in meta.honesty.
Everything else -- name, designation, kind, class, pha, neo, the orbital
elements, and the physical parameters -- comes straight from SBDB.

SOURCES (verified live 2026-07-10)
  * JPL Small-Body Database (SBDB) API, version 1.3 (2021 Sep):
      https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=<desig>&phys-par=true&full-prec=true
    Returns object identity + flags (fullname, des, kind, orbit_class, pha,
    neo, spkid), osculating orbital ELEMENTS and orbit metadata, and PHYSICAL
    parameters. One body per call.
  * JPL/CNEOS Close-Approach Data (CAD) API, version 1.5 (2023 Mar):
      https://ssd-api.jpl.nasa.gov/cad.api?date-min=..&date-max=..&dist-max=..&fullname=true&sort=dist
    Returns real close approaches to Earth (des, cd calendar date TDB, dist in
    au, v_rel/v_inf in km/s, h magnitude, fullname).

SBDB ORBITAL ELEMENTS returned (name / units, verified live 2026-07-10):
    e   eccentricity                         [dimensionless]
    a   semi-major axis                      [au]   (NEGATIVE for hyperbolic)
    q   perihelion distance                  [au]
    ad  aphelion distance                    [au]   (null for e >= 1)
    i   inclination to ecliptic              [deg]
    om  longitude of ascending node          [deg]
    w   argument of perihelion               [deg]
    ma  mean anomaly                         [deg]
    tp  time of perihelion passage           [JD, TDB]
    per sidereal orbital period              [days] (null for e >= 1)
    n   mean motion                          [deg/day]
  orbit metadata also used: epoch [JD TDB], soln_date, moid [au, Earth MOID],
    t_jup [Tisserand parameter wrt Jupiter], orbit_class {code,name}.

SBDB PHYSICAL parameters returned (name / units, verified live 2026-07-10):
    H         absolute magnitude             [mag]  (asteroids; comets use M1)
    diameter  diameter                       [km]
    rot_per   sidereal rotation period       [h]
    albedo    geometric albedo               [dimensionless]
    spec_T    Tholen spectral type           / spec_B  SMASSII spectral type
    M1        comet total absolute magnitude [mag]  (comets)
  Nulls are emitted wherever SBDB has no value for a body (never filled in).

CLASSIFICATION comes from SBDB's own orbit_class -- authoritative, not guessed:
    Asteroids: APO Apollo / ATE Aten / AMO Amor / IEO Atira (Interior-Earth) /
               MBA Main-belt / MCA Mars-crossing / etc.
    Comets:    JFc Jupiter-family / HTC Halley-type / ETc Encke-type /
               COM long-period / HYP hyperbolic comet / HYA hyperbolic asteroid.
    pha (Potentially Hazardous Asteroid) is SBDB's boolean flag
    (defined: Earth MOID < 0.05 au AND H <= 22.0). We do NOT recompute it.

HAZARD HONESTY (per the phase brief): close approaches and PHA status are REAL
and stated with real numbers, neither sensationalized nor downplayed. Apophis's
2029-04-13 pass is a real ~0.099-lunar-distance (geocentric ~38,000 km / ~31,600
km above the surface) close approach, naked-eye visible; the impact risk for
2029/2036/2068 was RULED OUT (NASA removed Apophis from the risk list in 2021).

INTERSTELLAR vs merely-HYPERBOLIC (a real distinction, not a shortcut): SBDB's
HYP/HYA classes contain BOTH the two genuinely interstellar visitors (1I, 2I)
AND ordinary near-parabolic Oort-cloud comets whose osculating eccentricity is
marginally > 1 (e.g. C/2023 A3 with e~1.0001, C/2012 S1 ISON). e > 1 alone does
NOT mean interstellar. We therefore set interstellar=True ONLY for 1I/'Oumuamua
and 2I/Borisov (unbound origin, large hyperbolic excess velocity), and add a
hyperbolic flag (from e >= 1 / null period) to every unbound osculating orbit.

USAGE / LICENSE (verified verbatim 2026-07-10 at https://ssd-api.jpl.nasa.gov/):
  SSD/CNEOS API "fair use" policy -- "You agree to submit only one API request
  at a time (no simultaneous requests)."; "You may not embed these APIs in your
  website (per NASA CORS policy)."; "You understand that API data formats can
  change without notice."; "... this service is made available on a best effort
  basis." NO explicit license and NO required acknowledgment line are stated:
  these are US-Government (NASA/JPL/Caltech) data, freely usable; a courtesy
  credit "NASA/JPL-Caltech (SSD/CNEOS)" is recommended. Because the browser may
  NOT call these APIs (CORS policy), this build runs OFFLINE and commits a
  static JSON -- the app never calls SBDB/CAD at runtime (same pattern as the
  wind and exoplanet pipelines). See docs/SMALL_BODIES_DATA_SOURCES.md.

Usage:
    python scripts/small-bodies/build_objects.py \
        --out public/data/small-bodies/objects.json

Re-runnable: it re-queries the live SBDB + CAD APIs each run (one request at a
time, per the fair-use policy), so values track JPL. Needs network access.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import os
import sys
import time
import urllib.parse
import urllib.request

SBDB = "https://ssd-api.jpl.nasa.gov/sbdb.api"
CAD = "https://ssd-api.jpl.nasa.gov/cad.api"

AU_KM = 149_597_870.7      # 1 au in km (IAU 2012)
LD_KM = 384_400.0          # 1 lunar distance (mean Earth-Moon distance) in km
DAYS_PER_YEAR = 365.25     # Julian year

UA = {"User-Agent": "H.O.T-EARTH/small-bodies (open-source planetary digital twin)"}

# Close-approach selection window + thresholds.
CA_DATE_MIN = "2026-07-10"   # today (build date) -- only UPCOMING approaches
CA_DATE_MAX = "2030-01-01"   # far enough to capture the Apophis 2029-04-13 pass
CA_DIST_MAX_AU = 0.05        # per the brief (~0.05 au); PHA MOID threshold too
CA_H_MAX = 24.0              # keep sizeable objects (~>40-60 m); drops meter-scale noise
CA_KEEP = 18                 # curated count of close approaches to ship

# ---------------------------------------------------------------------------
# Curated object set. key = SBDB sstr query string (number or comet designation
# -- all verified to resolve live 2026-07-10). Per object we hand-transcribe
# ONLY: visited/mission (spacecraft record), interstellar (physics), note.
# Everything else is pulled from SBDB at build time.
# ---------------------------------------------------------------------------
CURATED: list[dict] = [
    # ============================== COMETS ==============================
    {"q": "1P", "visited": True, "mission": "Giotto flyby (ESA) 1986; + Vega 1/2, Suisei, Sakigake ('Halley Armada')",
     "note": "Most famous comet; ~76-yr Halley-type orbit; nucleus imaged by the 1986 'Halley Armada'. "
             "Parent of the Eta Aquariid and Orionid meteor showers. Next perihelion 2061."},
    {"q": "2P", "visited": False,
     "note": "Shortest known cometary period (~3.3 yr) and the Encke-type prototype. Linked to the Taurid meteor complex."},
    {"q": "9P", "visited": True, "mission": "Deep Impact impactor (NASA) 2005; Stardust-NExT flyby 2011",
     "note": "First look inside a comet: NASA's Deep Impact fired a projectile into it (2005); Stardust-NExT re-imaged the crater (2011). Jupiter-family comet."},
    {"q": "67P", "visited": True, "mission": "Rosetta orbiter + Philae lander (ESA) 2014-2016",
     "note": "First comet orbited and landed on (ESA Rosetta/Philae, 2014-2016). Bilobed 'rubber-duck' nucleus, ~4.3 km, with active jets."},
    {"q": "103P", "visited": True, "mission": "EPOXI / Deep Impact extended flyby (NASA) 2010",
     "note": "Small hyperactive Jupiter-family comet flown by NASA's EPOXI (2010); peanut-shaped nucleus with CO2-driven jets."},
    {"q": "C/1995 O1", "visited": False,
     "note": "The 'Great Comet of 1997' (Hale-Bopp); naked-eye visible for a record ~18 months; unusually large nucleus. Long-period Oort-cloud comet (bound), next return ~4380."},
    {"q": "C/2020 F3", "visited": False,
     "note": "Comet NEOWISE, brightest northern-hemisphere comet since 1997; found by the NEOWISE space telescope in 2020. Long-period (~6800-yr) orbit."},
    {"q": "C/2023 A3", "visited": False,
     "note": "Tsuchinshan-ATLAS, a bright naked-eye comet of Oct 2024. Near-parabolic Oort-cloud comet with a marginally-hyperbolic osculating orbit (e~1.0001) - NOT interstellar; Sun-bound in origin."},
    {"q": "1I", "visited": False, "interstellar": True,
     "note": "First confirmed INTERSTELLAR object (Oct 2017). Genuinely unbound hyperbolic orbit (e~1.2); elongated, showed no coma. Passing through the solar system, not orbiting the Sun."},
    {"q": "2I", "visited": False, "interstellar": True,
     "note": "Second confirmed INTERSTELLAR object (2019) and the first obviously cometary one (active coma). Strongly hyperbolic (e~3.4), unbound - a comet from another star passing through."},
    {"q": "81P", "visited": True, "mission": "Stardust sample return (NASA) 2004 flyby, 2006 return",
     "note": "NASA's Stardust flew through its coma and returned cometary dust to Earth (2006) - the first cometary sample return. Jupiter-family comet."},
    {"q": "19P", "visited": True, "mission": "Deep Space 1 flyby (NASA) 2001",
     "note": "Flown by NASA Deep Space 1 (2001); elongated bowling-pin nucleus with active jets. Jupiter-family comet."},
    {"q": "21P", "visited": True, "mission": "ICE flyby (NASA) 1985",
     "note": "First comet ever encountered by a spacecraft (ICE, 1985). Parent of the Draconid meteor shower."},
    {"q": "55P", "visited": False,
     "note": "Tempel-Tuttle, parent comet of the Leonid meteor shower; ~33-yr Halley-type orbit that produces periodic Leonid storms."},
    {"q": "109P", "visited": False,
     "note": "Swift-Tuttle, parent comet of the Perseid meteor shower; large nucleus (~26 km), ~133-yr orbit."},
    {"q": "C/1996 B2", "visited": False,
     "note": "The 'Great Comet of 1996' (Hyakutake); passed very close to Earth (~0.10 au) showing an exceptionally long tail. Long-period comet."},
    {"q": "C/2012 S1", "visited": False,
     "note": "Comet ISON, a sungrazer that disintegrated at perihelion in Nov 2013 rather than becoming the hoped 'comet of the century'. Near-parabolic, not interstellar."},

    # ============================ ASTEROIDS =============================
    {"q": "99942", "visited": False, "mission": "OSIRIS-APEX (NASA) - arrives after the 2029 flyby",
     "note": "Potentially Hazardous Asteroid (~340 m). On 2029-04-13 it passes ~0.099 lunar distances from Earth "
             "(geocentric ~38,000 km; ~31,600 km above the surface), naked-eye visible. Impact for 2029/2036/2068 was "
             "RULED OUT after 2021 radar; NASA removed it from the risk list. OSIRIS-APEX will study it post-flyby."},
    {"q": "101955", "visited": True, "mission": "OSIRIS-REx (NASA) - sample returned 2023-09-24",
     "note": "PHA and carbonaceous rubble pile visited by NASA OSIRIS-REx; sample delivered to Earth Sep 2023. "
             "Carries a very small but non-zero cumulative impact probability in the 2100s-2300s (studied, not imminent)."},
    {"q": "162173", "visited": True, "mission": "Hayabusa2 (JAXA) - sample returned 2020",
     "note": "PHA visited by JAXA Hayabusa2; sample returned 2020. Carbonaceous 'spinning-top' rubble pile with hydrated minerals."},
    {"q": "433", "visited": True, "mission": "NEAR Shoemaker (NASA) - orbited 2000, landed 2001",
     "note": "First near-Earth asteroid discovered (1898) and first asteroid orbited and landed on (NEAR Shoemaker). Large S-type Amor (~17 km)."},
    {"q": "25143", "visited": True, "mission": "Hayabusa (JAXA) - sample returned 2010",
     "note": "First asteroid sampled and returned to Earth (JAXA Hayabusa, 2010). Small S-type rubble-pile PHA (~0.33 km)."},
    {"q": "65803", "visited": True, "mission": "DART impact on moon Dimorphos (NASA) 2022; Hera (ESA) en route",
     "note": "Binary asteroid: NASA's DART struck its moon Dimorphos on 2022-09-26 - the first planetary-defense kinetic-impact test - "
             "shortening Dimorphos's ~11.9 h orbit by ~33 minutes. ESA Hera is en route to survey the aftermath."},
    {"q": "3200", "visited": False, "mission": "DESTINY+ flyby (JAXA) planned",
     "note": "PHA and parent body of the Geminid meteor shower; blue B/F-type. Approaches the Sun inside Mercury's orbit (perihelion ~0.14 au). JAXA DESTINY+ flyby planned."},
    {"q": "4179", "visited": True, "mission": "Chang'e 2 flyby (CNSA) 2012",
     "note": "Elongated, chaotically tumbling PHA flown by China's Chang'e 2 (2012); a frequent radar target."},
    {"q": "1862", "visited": False,
     "note": "Prototype of the Apollo class (Earth-crossing NEAs with semi-major axis > 1 au). PHA; first of its class found (1932)."},
    {"q": "2062", "visited": False,
     "note": "Prototype of the Aten class (Earth-crossing NEAs with semi-major axis < 1 au). Discovered 1976."},
    {"q": "1221", "visited": False,
     "note": "Prototype of the Amor class (NEAs that approach but do not cross Earth's orbit; perihelion 1.017-1.3 au). Discovered 1932."},
    {"q": "4", "visited": True, "mission": "Dawn orbiter (NASA) 2011-2012",
     "note": "Second-largest asteroid (~525 km), orbited by NASA Dawn. Differentiated protoplanet; source of the HED meteorites and the V-type spectral class."},
    {"q": "951", "visited": True, "mission": "Galileo flyby (NASA) 1991",
     "note": "First asteroid ever imaged close-up (NASA Galileo, 1991). S-type main-belt asteroid (~12 km)."},
    {"q": "243", "visited": True, "mission": "Galileo flyby (NASA) 1993 - discovered moon Dactyl",
     "note": "Galileo's 1993 flyby discovered Dactyl, the first confirmed moon of an asteroid. S-type main-belt asteroid (~31 km)."},
    {"q": "16", "visited": False, "mission": "Psyche orbiter (NASA) - launched 2023, arrival 2029",
     "note": "Largest M-type (metal-rich) asteroid (~220 km); target of NASA's Psyche mission (launched 2023, arrival 2029). Possibly an exposed protoplanetary core. Not yet visited."},
    {"q": "253", "visited": True, "mission": "NEAR Shoemaker flyby (NASA) 1997",
     "note": "Dark C-type main-belt asteroid flown by NASA NEAR Shoemaker (1997); very porous (low density) and very slow rotation."},
    {"q": "21", "visited": True, "mission": "Rosetta flyby (ESA) 2010",
     "note": "Large main-belt asteroid (~100 km) flown by ESA Rosetta (2010); high density, ancient heavily-cratered surface."},
    {"q": "2867", "visited": True, "mission": "Rosetta flyby (ESA) 2008",
     "note": "Small E-type main-belt asteroid flown by ESA Rosetta (2008); diamond-shaped with a conspicuous crater chain."},
    {"q": "5535", "visited": True, "mission": "Stardust flyby (NASA) 2002",
     "note": "Small S-type main-belt asteroid flown by NASA Stardust (2002) as an engineering rehearsal en route to comet Wild 2."},
    {"q": "9969", "visited": True, "mission": "Deep Space 1 flyby (NASA) 1999",
     "note": "Mars-crossing asteroid flown by NASA Deep Space 1 (1999)."},
    {"q": "152830", "visited": True, "mission": "Lucy flyby (NASA) 2023 - discovered moon Selam",
     "note": "Small main-belt asteroid flown by NASA Lucy (2023); the flyby discovered Selam, a contact-binary satellite - a first."},
    {"q": "52246", "visited": True, "mission": "Lucy flyby (NASA) 2025",
     "note": "Main-belt asteroid flown by NASA Lucy (2025) en route to the Jupiter Trojans; elongated contact-binary shape."},
    {"q": "3122", "visited": False,
     "note": "Large PHA (~4.5 km) with two small moons; passed ~7 million km from Earth in 2017 and was radar-imaged."},
    {"q": "3753", "visited": False,
     "note": "Earth co-orbital asteroid on a horseshoe path - sometimes loosely called a 'second moon', but it orbits the Sun, not Earth. Aten class; not a PHA."},
    {"q": "469219", "visited": False, "mission": "Tianwen-2 sample return (CNSA) - launched 2025",
     "note": "Kamo'oalewa, an Earth quasi-satellite (stable co-orbital companion); possibly a lunar fragment. Target of China's Tianwen-2 sample-return mission (launched 2025)."},
    {"q": "1566", "visited": False,
     "note": "Apollo-class PHA on an extreme orbit reaching inside Mercury's (perihelion ~0.19 au); a classic radar-studied NEA."},
    {"q": "1620", "visited": False,
     "note": "One of the most elongated known asteroids (~2.5:1); PHA; extensively radar-imaged during its 1994 close approach."},
    {"q": "1036", "visited": False,
     "note": "Largest near-Earth asteroid (~35 km); an Amor that never crosses Earth's orbit - large, but not a PHA."},
]


# ---------------------------------------------------------------------------
# HTTP helpers (one request at a time, per the SSD/CNEOS fair-use policy)
# ---------------------------------------------------------------------------
def _get(url: str) -> dict:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def sbdb(sstr: str) -> dict:
    url = SBDB + "?" + urllib.parse.urlencode(
        {"sstr": sstr, "phys-par": "true", "full-prec": "true"})
    return _get(url)


def cad(date_min: str, date_max: str, dist_max_au: float) -> dict:
    url = CAD + "?" + urllib.parse.urlencode({
        "date-min": date_min, "date-max": date_max,
        "dist-max": str(dist_max_au), "sort": "dist", "fullname": "true"})
    return _get(url)


# ---------------------------------------------------------------------------
# numeric helpers
# ---------------------------------------------------------------------------
def fnum(x):
    """Parse an SBDB string value to float; None/'' -> None; unparsable -> None."""
    if x is None:
        return None
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def sig(x, n=6):
    """Round to n significant figures; pass through None."""
    if x is None:
        return None
    x = float(x)
    if x == 0:
        return 0.0
    d = n - 1 - math.floor(math.log10(abs(x)))
    return round(x, d) + 0.0


def fixed(x, nd):
    if x is None:
        return None
    return round(float(x), nd)


# ---------------------------------------------------------------------------
# per-object build
# ---------------------------------------------------------------------------
def build_object(spec: dict) -> dict:
    d = sbdb(spec["q"])
    if "object" not in d:
        raise RuntimeError(f"SBDB returned no object for {spec['q']!r}: {str(d)[:200]}")
    obj = d["object"]
    orb = d.get("orbit", {}) or {}
    els = {e["name"]: e.get("value") for e in orb.get("elements", [])}
    phys = {p["name"]: p.get("value") for p in d.get("phys_par", [])}

    e = fnum(els.get("e"))
    per_days = fnum(els.get("per"))
    ad = fnum(els.get("ad"))
    hyperbolic = (e is not None and e >= 1.0) or (per_days is None) or (ad is None)

    kind = obj.get("kind")  # an/au = asteroid numbered/unnumbered; cn/cu = comet
    is_comet = bool(kind) and kind.startswith("c")

    oc = obj.get("orbit_class", {}) or {}

    elements = {
        "a": sig(fnum(els.get("a")), 7),
        "e": fixed(e, 6),
        "q": sig(fnum(els.get("q")), 6),
        "Q": None if hyperbolic else sig(ad, 6),
        "i": fixed(fnum(els.get("i")), 4),
        "om": fixed(fnum(els.get("om")), 4),
        "w": fixed(fnum(els.get("w")), 4),
        "period_yr": None if (hyperbolic or per_days is None) else sig(per_days / DAYS_PER_YEAR, 6),
        "hyperbolic": hyperbolic,
        "moid_au": sig(fnum(orb.get("moid")), 5),      # Earth MOID (measured; PHA input)
        "t_jup": fixed(fnum(orb.get("t_jup")), 3),      # Tisserand param wrt Jupiter
        "epoch_jd": fnum(orb.get("epoch")),
    }

    physical = {
        "diameter_km": sig(fnum(phys.get("diameter")), 5),
        "rotation_h": sig(fnum(phys.get("rot_per")), 5),
        "albedo": fixed(fnum(phys.get("albedo")), 4),
        "spectral": phys.get("spec_T") or phys.get("spec_B"),   # Tholen preferred, else SMASSII
        "H": fnum(phys.get("H")),                                # asteroids (comets often null)
    }
    # Comets report a total absolute magnitude M1 instead of H -- keep it when present.
    m1 = fnum(phys.get("M1"))
    if m1 is not None:
        physical["comet_total_mag_M1"] = m1

    out = {
        "name": obj.get("shortname") or obj.get("fullname"),
        "fullname": obj.get("fullname"),
        "designation": obj.get("des"),
        "spkid": obj.get("spkid"),
        "kind": "comet" if is_comet else "asteroid",
        "class": {"code": oc.get("code"), "name": oc.get("name")},
        "pha": obj.get("pha"),          # SBDB boolean (MOID < 0.05 au AND H <= 22.0)
        "neo": obj.get("neo"),
        "interstellar": bool(spec.get("interstellar", False)),
        "visited": bool(spec.get("visited", False)),
        "elements": elements,
        "physical": physical,
        "note": spec.get("note"),
    }
    if spec.get("mission"):
        out["mission"] = spec["mission"]
    return out


# ---------------------------------------------------------------------------
# close approaches
# ---------------------------------------------------------------------------
def build_close_approaches() -> list[dict]:
    d = cad(CA_DATE_MIN, CA_DATE_MAX, CA_DIST_MAX_AU)
    fi = {n: i for i, n in enumerate(d["fields"])}
    rows = d.get("data", []) or []

    # keep sizeable objects (h <= CA_H_MAX) so the list isn't drowned in
    # meter-scale newly-found rocks; sort by nominal distance (closest first).
    sizeable = []
    for r in rows:
        h = fnum(r[fi["h"]])
        if h is None or h > CA_H_MAX:
            continue
        sizeable.append(r)
    sizeable.sort(key=lambda r: fnum(r[fi["dist"]]))
    chosen = sizeable[:CA_KEEP]

    # guarantee Apophis's 2029 pass is present (it is the closest anyway, but be safe)
    if not any(r[fi["des"]] == "99942" for r in chosen):
        apo = [r for r in rows if r[fi["des"]] == "99942"]
        if apo:
            chosen = (chosen[:CA_KEEP - 1]) + [apo[0]]

    # present in chronological order (sort by JD, since the "cd" string sorts
    # month names alphabetically, not chronologically)
    chosen.sort(key=lambda r: fnum(r[fi["jd"]]))

    out = []
    for r in chosen:
        dist_au = fnum(r[fi["dist"]])
        out.append({
            "object": (r[fi["fullname"]] or r[fi["des"]]).strip(),
            "designation": r[fi["des"]],
            "date": r[fi["cd"]],                                  # calendar date/time (TDB)
            "dist_au": sig(dist_au, 5),
            "dist_ld": fixed(dist_au * AU_KM / LD_KM, 3),         # computed = au * AU_KM / LD_KM
            "v_rel_kms": fixed(fnum(r[fi["v_rel"]]), 3),
            "h": fnum(r[fi["h"]]),
        })
    return out


# ---------------------------------------------------------------------------
def build(out_path: str) -> int:
    print("Querying JPL SBDB for curated small bodies (one request at a time)...",
          file=sys.stderr)
    objects = []
    for spec in CURATED:
        o = build_object(spec)
        objects.append(o)
        flag = []
        if o["pha"]:
            flag.append("PHA")
        if o["interstellar"]:
            flag.append("INTERSTELLAR")
        if o["elements"]["hyperbolic"]:
            flag.append("hyperbolic")
        if o["visited"]:
            flag.append("visited")
        print(f"  {o['name']:34} {o['kind']:8} {o['class']['code'] or '-':4} "
              f"[{','.join(flag)}]", file=sys.stderr)
        time.sleep(0.2)  # be gentle; sequential per fair-use policy

    print("Querying JPL/CNEOS CAD for upcoming close approaches...", file=sys.stderr)
    cas = build_close_approaches()
    print(f"  selected {len(cas)} close approaches", file=sys.stderr)

    n_comets = sum(1 for o in objects if o["kind"] == "comet")
    n_asteroids = sum(1 for o in objects if o["kind"] == "asteroid")
    n_pha = sum(1 for o in objects if o["pha"])
    n_visited = sum(1 for o in objects if o["visited"])
    n_interstellar = sum(1 for o in objects if o["interstellar"])
    n_hyperbolic = sum(1 for o in objects if o["elements"]["hyperbolic"])

    doc = {
        "meta": {
            "title": "Curated real comets and near-Earth / notable asteroids (JPL SBDB + CNEOS CAD)",
            "source": (
                "NASA/JPL Small-Body Database (SBDB) API v1.3 for object identity, "
                "orbital elements and physical parameters; NASA/JPL-CNEOS "
                "Close-Approach Data (CAD) API v1.5 for Earth close approaches. "
                "Queried live per the SSD/CNEOS fair-use policy (one request at a time)."
            ),
            "api_endpoints": {
                "sbdb": SBDB + "?sstr=<desig>&phys-par=true&full-prec=true",
                "cad": CAD + "?date-min=..&date-max=..&dist-max=..&fullname=true&sort=dist",
            },
            "acknowledgment": (
                "US-Government (NASA/JPL/Caltech) data. The SSD/CNEOS API pages state NO "
                "explicit license and request NO specific acknowledgment line; a courtesy "
                "credit 'NASA/JPL-Caltech (Solar System Dynamics / CNEOS)' is recommended. "
                "Fair-use terms verbatim: 'You agree to submit only one API request at a time "
                "(no simultaneous requests).' | 'You may not embed these APIs in your website "
                "(per NASA CORS policy).' | 'You understand that API data formats can change "
                "without notice.' | '... this service is made available on a best effort basis.'"
            ),
            "units": {
                "elements.a": "au (semi-major axis; NEGATIVE for hyperbolic orbits)",
                "elements.e": "dimensionless eccentricity (>= 1 = unbound/hyperbolic)",
                "elements.q": "au (perihelion distance)",
                "elements.Q": "au (aphelion distance; null for hyperbolic)",
                "elements.i": "deg (inclination to the ecliptic, J2000)",
                "elements.om": "deg (longitude of ascending node)",
                "elements.w": "deg (argument of perihelion)",
                "elements.period_yr": "Julian years (= SBDB period_days / 365.25; null for hyperbolic)",
                "elements.hyperbolic": "true when e >= 1 (unbound osculating orbit)",
                "elements.moid_au": "au (Earth Minimum Orbit Intersection Distance; measured)",
                "elements.t_jup": "Tisserand parameter with respect to Jupiter (dimensionless)",
                "elements.epoch_jd": "Julian Date (TDB) of the osculating elements",
                "physical.diameter_km": "km",
                "physical.rotation_h": "hours (sidereal rotation period)",
                "physical.albedo": "dimensionless (geometric albedo)",
                "physical.spectral": "spectral/taxonomic type (Tholen if present, else SMASSII)",
                "physical.H": "mag (absolute magnitude; asteroids)",
                "physical.comet_total_mag_M1": "mag (comet total absolute magnitude; comets only)",
                "close_approaches.dist_au": "au (nominal geocentric approach distance, Earth center)",
                "close_approaches.dist_ld": "lunar distances (computed = dist_au * 149597870.7 / 384400)",
                "close_approaches.v_rel_kms": "km/s (velocity relative to Earth at the approach)",
                "close_approaches.h": "mag (absolute magnitude)",
                "close_approaches.date": "calendar date/time, TDB",
            },
            "classification": {
                "pha": "SBDB boolean Potentially-Hazardous-Asteroid flag (Earth MOID < 0.05 au AND H <= 22.0). Taken from SBDB, not recomputed.",
                "class": "SBDB orbit_class {code,name}: asteroids APO Apollo / ATE Aten / AMO Amor / IEO Atira / MBA main-belt / MCA Mars-crossing; comets JFc Jupiter-family / HTC Halley-type / ETc Encke-type / COM long-period / HYP hyperbolic comet / HYA hyperbolic asteroid.",
                "interstellar": "TRUE only for 1I/'Oumuamua and 2I/Borisov (unbound origin). NOTE: SBDB's HYP/HYA classes also contain ordinary near-parabolic Oort-cloud comets with osculating e slightly > 1 (C/2023 A3, C/2012 S1) - those are hyperbolic but NOT interstellar.",
                "visited": "Hand-curated spacecraft record (mission field). One of the few non-SBDB fields; see honesty.",
            },
            "honesty": (
                "Every orbital element and physical parameter is a MEASURED/published SBDB "
                "value; every close approach is a MEASURED/predicted CNEOS value. null = the "
                "database has no value (never filled in). The ONLY hand-curated per-object "
                "fields are visited/mission (historical spacecraft record), interstellar "
                "(physics fact, true only for 1I/2I) and note (human summary). Most of these "
                "bodies have NO surface imagery; appearance is ILLUSTRATIVE (see "
                "docs/SMALL_BODIES_PHYSICS.md). Hazard framing is factual: PHA status and "
                "close-approach distances are real numbers, neither sensationalized nor "
                "downplayed. Apophis's 2029-04-13 pass is a real ~0.099-lunar-distance close "
                "approach (naked-eye visible); its 2029/2036/2068 impact risk was RULED OUT "
                "(NASA removed it from the risk list in 2021)."
            ),
            "close_approach_window": {
                "date_min": CA_DATE_MIN, "date_max": CA_DATE_MAX,
                "dist_max_au": CA_DIST_MAX_AU, "h_max": CA_H_MAX,
                "selection": "the closest sizeable (H <= 24) Earth approaches in the window, chronological; Apophis 2029 guaranteed.",
            },
            "verified_date": "2026-07-10",
            "generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "counts": {
                "objects": len(objects),
                "comets": n_comets,
                "asteroids": n_asteroids,
                "pha": n_pha,
                "visited": n_visited,
                "interstellar": n_interstellar,
                "hyperbolic": n_hyperbolic,
                "close_approaches": len(cas),
            },
        },
        "objects": objects,
        "close_approaches": cas,
    }

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
        f.write("\n")

    size = os.path.getsize(out_path)
    print(f"\nWrote {out_path} ({size} bytes = {size/1024:.1f} KB)")
    print(f"  objects: {len(objects)}  (comets {n_comets}, asteroids {n_asteroids})")
    print(f"  PHAs: {n_pha}   visited: {n_visited}   interstellar: {n_interstellar}   hyperbolic: {n_hyperbolic}")
    print(f"  close approaches: {len(cas)}")
    print("  visited bodies: " + ", ".join(o["name"] for o in objects if o["visited"]))
    print("  interstellar: " + ", ".join(o["name"] for o in objects if o["interstellar"]))
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="public/data/small-bodies/objects.json")
    args = ap.parse_args()
    return build(args.out)


if __name__ == "__main__":
    raise SystemExit(main())
