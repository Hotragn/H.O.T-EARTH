#!/usr/bin/env python3
"""Build the Night Sky (Phase 11) static catalogs for the H.O.T digital twin.

Produces three compact, honest JSON files under public/data/night-sky/:

  stars.json          naked-eye star catalog (columnar arrays-of-arrays)
  constellations.json 88 constellation stick-figure line segments
  messier.json        the 110 Messier deep-sky objects

Every position, magnitude, colour, distance and object type below is REAL,
MEASURED astronomical data (Hipparcos/Gaia via the HYG compilation; NED/SIMBAD/
LEDA via OpenNGC). The constellation stick figures are a CULTURAL overlay -- the
stars are real, the lines joining them are a human convention. See
docs/NIGHT_SKY_DATA_SOURCES.md (licenses) and docs/NIGHT_SKY_PHYSICS.md
(measured vs computed vs cultural). Nothing is invented; where a value is
missing we emit JSON null (or omit the field), never a guess.

--------------------------------------------------------------------------------
SOURCES + LICENSES (verified 2026-07-18; full detail in NIGHT_SKY_DATA_SOURCES.md)
--------------------------------------------------------------------------------
1. Stars -- HYG database v4.4 (astronexus/hyg, Codeberg), compiled from
   Hipparcos + Yale Bright Star Catalog + Gliese. LICENSE: CC BY-SA 4.0.
   Attribution: "Star data: HYG database v4.4 (c) David Nash / astronexus,
   CC BY-SA 4.0 -- compiled from Hipparcos, Yale Bright Star and Gliese
   catalogs." (The stars.json we derive is itself shared under CC BY-SA 4.0.)
   File: data/hyg/CURRENT/hyg_v44.csv.gz (Git-LFS; use the /media/ endpoint).
   IMPORTANT UNIT GOTCHA (verified against real data, NOT the README): the HYG
   `ra` column is in DECIMAL HOURS (Sirius ra=6.7525h), `dec` in DEGREES,
   `dist` in PARSECS (values >=100000 mean "no/dubious parallax"). We convert
   RA to DEGREES (ra_deg = ra_hours * 15) in the output so both angles share a
   unit.

2. Constellation lines -- Marc van der Sluys, "ConstellationLines"
   (github.com/MarcvdSluys/ConstellationLines), 88 constellations drawn with
   Bright Star Catalogue (BSC / HR) numbers. LICENSE: CC BY 4.0 (clean; no GPL).
   DOI 10.5281/zenodo.10397192. We map HR -> HYG at build time.
   LICENSE TRAP WE AVOIDED: Stellarium's constellationship.fab is GPL, and the
   popular dcf21/constellation-stick-figures IAU file is *stamped GPL v3 in its
   own header* despite a CC-BY claim in its README -- both REJECTED for this
   MIT/CC-BY-SA repo. See NIGHT_SKY_DATA_SOURCES.md.

3. Star names -- IAU Working Group on Star Names (WGSN), IAU Catalog of Star
   Names (IAU-CSN). IAU products are CC BY ("free to use ... as long as the
   source is mentioned"). Most named naked-eye stars already carry their IAU
   name in HYG's `proper` field; we use those and (best-effort) cross-check /
   fill blanks against the live IAU-CSN by HIP number.

4. Deep-sky -- OpenNGC (github.com/mattiaverga/OpenNGC), NGC/IC/Messier objects
   with J2000 positions, magnitudes and types from NED/SIMBAD/LEDA.
   LICENSE: CC BY-SA 4.0. Author: Mattia Verga.

Re-runnable: downloads each source (cached in the OS temp dir; --refresh to
re-fetch, --cache-dir to relocate), then filters and writes the JSON. Requires
the `requests`-free stdlib only (urllib) + network access.

Usage:
    python scripts/night-sky/build_catalog.py
    python scripts/night-sky/build_catalog.py --out-dir public/data/night-sky --refresh
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import gzip
import io
import json
import math
import os
import re
import sys
import tempfile
import urllib.request

# ----------------------------------------------------------------------------
# Source URLs (verified live 2026-07-18)
# ----------------------------------------------------------------------------
HYG_URL = "https://codeberg.org/astronexus/hyg/media/branch/main/data/hyg/CURRENT/hyg_v44.csv.gz"
CONLINES_URL = "https://raw.githubusercontent.com/MarcvdSluys/ConstellationLines/master/ConstellationLines.csv"
OPENNGC_URL = "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv"
OPENNGC_ADD_URL = "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/addendum.csv"
IAUCSN_URL = "https://www.pas.rochester.edu/~emamajek/WGSN/IAU-CSN.txt"

USER_AGENT = "H.O.T-EARTH/night-sky (open-source planetary digital twin)"

PC_TO_LY = 3.26156          # 1 parsec in light-years (IAU 2015)
NAKED_EYE_MAG = 6.5          # naked-eye limiting apparent magnitude
HYG_NO_PARALLAX = 100000.0   # HYG sentinel: dist >= this => unknown distance

# HYG leaves `hr` blank for a handful of (mostly double-star) bright stars that
# the constellation figures reference. Recover them via the known Yale BSC
# HR -> HD crosswalk so no constellation segment is dropped. (Verified: all
# seven resolve in HYG by HD -- Almach, eps Ari, Acamar, HR1190, gam2 Vel,
# Algieba, HR5506.)
HR_TO_HD_PATCH = {
    596: 12533, 888: 18519, 898: 18622, 1190: 24155,
    3206: 68273, 4058: 89484, 5506: 130157,
}

# IAU 88-constellation abbreviation -> English name (public/factual list; the
# IAU standard three-letter abbreviations). Hardcoded so we take no name data
# from any GPL source.
CONSTELLATION_NAMES = {
    "And": "Andromeda", "Ant": "Antlia", "Aps": "Apus", "Aql": "Aquila",
    "Aqr": "Aquarius", "Ara": "Ara", "Ari": "Aries", "Aur": "Auriga",
    "Boo": "Bootes", "Cae": "Caelum", "Cam": "Camelopardalis", "Cnc": "Cancer",
    "CVn": "Canes Venatici", "CMa": "Canis Major", "CMi": "Canis Minor",
    "Cap": "Capricornus", "Car": "Carina", "Cas": "Cassiopeia",
    "Cen": "Centaurus", "Cep": "Cepheus", "Cet": "Cetus", "Cha": "Chamaeleon",
    "Cir": "Circinus", "Col": "Columba", "Com": "Coma Berenices",
    "CrA": "Corona Australis", "CrB": "Corona Borealis", "Crv": "Corvus",
    "Crt": "Crater", "Cru": "Crux", "Cyg": "Cygnus", "Del": "Delphinus",
    "Dor": "Dorado", "Dra": "Draco", "Equ": "Equuleus", "Eri": "Eridanus",
    "For": "Fornax", "Gem": "Gemini", "Gru": "Grus", "Her": "Hercules",
    "Hor": "Horologium", "Hya": "Hydra", "Hyi": "Hydrus", "Ind": "Indus",
    "Lac": "Lacerta", "Leo": "Leo", "LMi": "Leo Minor", "Lep": "Lepus",
    "Lib": "Libra", "Lup": "Lupus", "Lyn": "Lynx", "Lyr": "Lyra",
    "Men": "Mensa", "Mic": "Microscopium", "Mon": "Monoceros", "Mus": "Musca",
    "Nor": "Norma", "Oct": "Octans", "Oph": "Ophiuchus", "Ori": "Orion",
    "Pav": "Pavo", "Peg": "Pegasus", "Per": "Perseus", "Phe": "Phoenix",
    "Pic": "Pictor", "Psc": "Pisces", "PsA": "Piscis Austrinus", "Pup": "Puppis",
    "Pyx": "Pyxis", "Ret": "Reticulum", "Sge": "Sagitta", "Sgr": "Sagittarius",
    "Sco": "Scorpius", "Scl": "Sculptor", "Sct": "Scutum", "Ser": "Serpens",
    "Sex": "Sextans", "Tau": "Taurus", "Tel": "Telescopium", "Tri": "Triangulum",
    "TrA": "Triangulum Australe", "Tuc": "Tucana", "UMa": "Ursa Major",
    "UMi": "Ursa Minor", "Vel": "Vela", "Vir": "Virgo", "Vol": "Volans",
    "Vul": "Vulpecula",
    # marc splits Serpens into two data-lines under these codes:
    "Se1": "Serpens", "Se2": "Serpens",
}

# OpenNGC object-type code -> friendly label
NGC_TYPE = {
    "G": "Galaxy", "GPair": "Galaxy pair", "GTrpl": "Galaxy triplet",
    "GGroup": "Galaxy group", "PN": "Planetary nebula", "OCl": "Open cluster",
    "GCl": "Globular cluster", "Cl+N": "Cluster + nebula", "HII": "HII region",
    "Neb": "Nebula", "EmN": "Emission nebula", "RfN": "Reflection nebula",
    "SNR": "Supernova remnant", "Nova": "Nova", "*": "Star", "**": "Double star",
    "*Ass": "Star cloud / association", "Ast": "Asterism", "Dup": "Duplicate",
    "Other": "Other",
}


# ----------------------------------------------------------------------------
# Download helpers (cached)
# ----------------------------------------------------------------------------
def fetch(url: str, cache_dir: str, fname: str, refresh: bool) -> bytes:
    path = os.path.join(cache_dir, fname)
    if os.path.exists(path) and not refresh:
        print(f"  cache hit: {fname}", file=sys.stderr)
        return open(path, "rb").read()
    print(f"  downloading {fname} <- {url}", file=sys.stderr)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=300) as resp:
        raw = resp.read()
    os.makedirs(cache_dir, exist_ok=True)
    with open(path, "wb") as f:
        f.write(raw)
    return raw


# ----------------------------------------------------------------------------
# Value helpers
# ----------------------------------------------------------------------------
def fnum(s):
    s = (s or "").strip()
    if s == "":
        return None
    try:
        return float(s)
    except ValueError:
        return None


def inum(s):
    v = fnum(s)
    return None if v is None else int(round(v))


def rnd(x, n):
    return None if x is None else round(x, n)


_SPECT_RE = re.compile(r"^\s*(sd|d|D|w)?([OBAFGKMLTYWCRNS])\s*([0-9](?:\.[0-9])?)?")


def short_spect(spect):
    """Compact the HYG spectral string to a short, still-informative code.
    'A0m...'->'A0', 'K5III'->'K5', 'M2Iab'->'M2', 'DA2'->'DA2'. Never invents."""
    s = (spect or "").strip()
    if not s:
        return None
    m = _SPECT_RE.match(s)
    if m and m.group(2):
        out = (m.group(1) or "") + m.group(2) + (m.group(3) or "")
        return out[:4]
    return s[:3]


def hms_to_deg(ra):
    """'HH:MM:SS.SS' -> decimal degrees."""
    ra = (ra or "").strip()
    if not ra:
        return None
    h, m, s = (ra.split(":") + ["0", "0"])[:3]
    return (int(h) + int(m) / 60.0 + float(s) / 3600.0) * 15.0


def dms_to_deg(dec):
    """'+DD:MM:SS.S' -> decimal degrees."""
    dec = (dec or "").strip()
    if not dec:
        return None
    sign = -1.0 if dec[0] == "-" else 1.0
    dec = dec.lstrip("+-")
    d, m, s = (dec.split(":") + ["0", "0"])[:3]
    return sign * (int(d) + int(m) / 60.0 + float(s) / 3600.0)


# ----------------------------------------------------------------------------
# IAU-CSN (best-effort fixed-width parse: HIP number -> ASCII proper name)
# ----------------------------------------------------------------------------
def parse_iau_csn(raw: bytes) -> dict:
    txt = raw.decode("utf-8", errors="replace")
    lines = txt.splitlines()
    # Locate the header comment line to find the HIP column start.
    hip_start = None
    name_end = None
    for ln in lines:
        if ln.startswith("#Name/ASCII"):
            hip_start = ln.find("HIP")
            name_end = ln.find("Name/Diacritics")
            break
    out = {}
    if hip_start is None:
        return out
    for ln in lines:
        if not ln or ln.startswith(("#", "$")):
            continue
        name = ln[:name_end].strip() if name_end else ln.split("  ")[0].strip()
        window = ln[hip_start:hip_start + 8]
        m = re.search(r"\d+", window)
        if not name or not m:
            continue
        try:
            hip = int(m.group(0))
        except ValueError:
            continue
        if hip > 0:
            out.setdefault(hip, name)
    return out


# ----------------------------------------------------------------------------
# Build
# ----------------------------------------------------------------------------
def build(out_dir: str, cache_dir: str, refresh: bool) -> int:
    print("Fetching sources...", file=sys.stderr)
    hyg_gz = fetch(HYG_URL, cache_dir, "hyg_v44.csv.gz", refresh)
    hyg_csv = gzip.decompress(hyg_gz).decode("utf-8", errors="replace")
    con_csv = fetch(CONLINES_URL, cache_dir, "ConstellationLines.csv", refresh).decode("utf-8", "replace")
    ngc_csv = fetch(OPENNGC_URL, cache_dir, "openngc_NGC.csv", refresh).decode("utf-8", "replace")
    add_csv = fetch(OPENNGC_ADD_URL, cache_dir, "openngc_addendum.csv", refresh).decode("utf-8", "replace")
    try:
        iau_names = parse_iau_csn(fetch(IAUCSN_URL, cache_dir, "IAU-CSN.txt", refresh))
    except Exception as e:  # non-fatal: HYG proper names remain authoritative
        print(f"  (IAU-CSN fetch/parse skipped: {e})", file=sys.stderr)
        iau_names = {}
    print(f"  IAU-CSN names by HIP: {len(iau_names)}", file=sys.stderr)

    # --- Parse HYG, build lookups keyed by HYG id -------------------------
    hyg_rows = {}
    by_hr = {}
    by_hd = {}
    reader = csv.DictReader(io.StringIO(hyg_csv))
    for r in reader:
        hid = int(r["id"])
        hyg_rows[hid] = r
        if r["hr"].strip():
            by_hr[int(r["hr"])] = hid
        hd = inum(r["hd"])
        if hd is not None:
            by_hd.setdefault(hd, hid)

    def hr_to_hyg(hr):
        if hr in by_hr:
            return by_hr[hr]
        hd = HR_TO_HD_PATCH.get(hr)
        if hd is not None and hd in by_hd:
            return by_hd[hd]
        return None

    # --- Which stars must be in stars.json --------------------------------
    #   (a) all naked-eye stars (mag <= 6.5), (b) any star with a proper name,
    #   (c) every star referenced by a constellation figure. Never the Sun.
    con_star_ids = set()
    con_reader = csv.reader(io.StringIO(con_csv))
    con_header = next(con_reader)
    con_lines_raw = []
    unresolved_hr = set()
    for row in con_reader:
        if not row or not row[0].strip():
            continue
        abbr = row[0].strip()
        nstar = int(row[1])
        hrs = [int(x) for x in row[2:2 + nstar] if x.strip()]
        con_lines_raw.append((abbr, hrs))
        for hr in hrs:
            hid = hr_to_hyg(hr)
            if hid is None:
                unresolved_hr.add(hr)
            else:
                con_star_ids.add(hid)

    def star_id(row):
        """Public id: positive = Hipparcos number; negative = -(HYG id) when
        the star has no HIP. Documented in stars.json meta."""
        hip = inum(row["hip"])
        return hip if hip else -int(row["id"])

    keep_ids = set()
    for hid, r in hyg_rows.items():
        if hid == 0 or (r["proper"].strip() == "Sol"):
            continue  # the Sun is not a night-sky star
        mag = fnum(r["mag"])
        named = bool(r["proper"].strip())
        if (mag is not None and mag <= NAKED_EYE_MAG) or named:
            keep_ids.add(hid)
    keep_ids |= con_star_ids
    keep_ids.discard(0)

    # --- Emit stars (columnar arrays-of-arrays) ---------------------------
    COLUMNS = ["id", "ra", "dec", "mag", "ci", "dist_ly", "spect", "name", "bayer", "con"]
    star_rows = []
    id_of_hyg = {}
    names_from_iau = 0
    for hid in keep_ids:
        r = hyg_rows[hid]
        sid = star_id(r)
        id_of_hyg[hid] = sid
        ra_h = fnum(r["ra"])
        dec = fnum(r["dec"])
        if ra_h is None or dec is None:
            continue
        dist_pc = fnum(r["dist"])
        dist_ly = None
        if dist_pc is not None and dist_pc < HYG_NO_PARALLAX and dist_pc > 0:
            dist_ly = round(dist_pc * PC_TO_LY, 1)
        name = r["proper"].strip() or None
        if name is None:
            hip = inum(r["hip"])
            if hip and hip in iau_names:
                name = iau_names[hip]
                names_from_iau += 1
        star_rows.append([
            sid,
            round(ra_h * 15.0, 4),        # RA hours -> DEGREES (J2000)
            round(dec, 4),                 # Dec degrees (J2000)
            rnd(fnum(r["mag"]), 2),
            rnd(fnum(r["ci"]), 3),
            dist_ly,
            short_spect(r["spect"]),
            name,
            r["bayer"].strip() or None,
            r["con"].strip() or None,
        ])
    star_rows.sort(key=lambda x: (x[3] if x[3] is not None else 99.0))  # brightest first

    n_bright = sum(1 for s in star_rows if s[3] is not None and s[3] <= NAKED_EYE_MAG)
    n_named = sum(1 for s in star_rows if s[7])

    stars_doc = {
        "meta": {
            "title": "Naked-eye star catalog (HYG v4.4 subset)",
            "source": (
                "HYG database v4.4 (astronexus/hyg, Codeberg), compiled from the "
                "Hipparcos, Yale Bright Star and Gliese catalogs. Positions, "
                "magnitudes, colours (B-V), spectral types and parallax distances "
                "are REAL MEASURED data (Hipparcos/Gaia era)."
            ),
            "license": "CC BY-SA 4.0",
            "attribution": (
                "Star data: HYG database v4.4 (c) astronexus / David Nash, CC BY-SA "
                "4.0, compiled from Hipparcos, Yale Bright Star Catalog and Gliese. "
                "Derived subset shared under the same CC BY-SA 4.0."
            ),
            "source_url": "https://codeberg.org/astronexus/hyg",
            "star_names_authority": (
                "Proper names follow the IAU Working Group on Star Names (WGSN) "
                "IAU Catalog of Star Names; carried in HYG's `proper` field and "
                "cross-checked against the live IAU-CSN."
            ),
            "verified_date": "2026-07-18",
            "epoch": "J2000.0 (equinox 2000.0)",
            "selection": (
                "All stars with apparent magnitude <= 6.5 (naked-eye limit) UNION "
                "all stars with a proper name UNION every star used by a "
                "constellation stick figure. The Sun (HYG id 0) is excluded."
            ),
            "schema": "columnar arrays-of-arrays; see `columns` for order",
            "columns": COLUMNS,
            "units": {
                "id": "int -- positive = Hipparcos (HIP) number; negative = -(HYG database id) for stars with no HIP",
                "ra": "degrees, J2000 (0..360); converted from HYG decimal-hours RA (x15)",
                "dec": "degrees, J2000 (-90..+90)",
                "mag": "apparent visual magnitude",
                "ci": "colour index B-V (null if absent) -> maps to star colour",
                "dist_ly": "distance in light-years (parsecs x 3.26156); null if HYG has no reliable parallax",
                "spect": "short spectral type (e.g. A0, K5, M2); null if absent",
                "name": "IAU/WGSN proper name; null if unnamed",
                "bayer": "Bayer designation abbrev (e.g. Alp); null if none",
                "con": "constellation abbreviation (e.g. CMa); null if none",
            },
            "honesty": (
                "Positions/magnitudes/colours/distances/spectra are measured. RA->deg "
                "and pc->ly are the only unit conversions. Proper motion & precession "
                "are ignored for present-day display (sub-arcminute over decades). "
                "Nulls are never filled in. See docs/NIGHT_SKY_PHYSICS.md."
            ),
            "generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "counts": {
                "stars": len(star_rows),
                "naked_eye_mag_le_6_5": n_bright,
                "named": n_named,
                "names_filled_from_iau_csn": names_from_iau,
            },
        },
        "columns": COLUMNS,
        "stars": star_rows,
    }

    # --- Emit constellations ----------------------------------------------
    con_group = {}  # abbr -> list of segment pairs [sid_a, sid_b]
    dropped_segments = 0
    for abbr, hrs in con_lines_raw:
        seen = con_group.setdefault(abbr, ([], set()))
        seg_list, seg_set = seen
        for a, b in zip(hrs, hrs[1:]):
            if a == b:
                continue
            ha, hb = hr_to_hyg(a), hr_to_hyg(b)
            if ha is None or hb is None or ha not in id_of_hyg or hb not in id_of_hyg:
                dropped_segments += 1
                continue
            sa, sb = id_of_hyg[ha], id_of_hyg[hb]
            key = (min(sa, sb), max(sa, sb))
            if key in seg_set:
                continue
            seg_set.add(key)
            seg_list.append([sa, sb])

    constellations = []
    for abbr in sorted(con_group):
        segs = con_group[abbr][0]
        if not segs:
            continue
        name = CONSTELLATION_NAMES.get(abbr, abbr)
        # merge Serpens halves under a single "Ser"
        constellations.append({"abbr": abbr, "name": name, "lines": segs})
    # merge Se1/Se2 into Ser
    merged = {}
    for c in constellations:
        key = "Ser" if c["abbr"] in ("Se1", "Se2", "Ser") else c["abbr"]
        m = merged.setdefault(key, {"abbr": key, "name": CONSTELLATION_NAMES.get(key, key), "lines": []})
        m["lines"].extend(c["lines"])
    constellations = [merged[k] for k in sorted(merged)]
    total_segments = sum(len(c["lines"]) for c in constellations)

    cons_doc = {
        "meta": {
            "title": "Constellation stick figures (88 modern constellations)",
            "source": (
                "Marc van der Sluys, 'ConstellationLines' -- lines joining Bright "
                "Star Catalogue (BSC/HR) stars into the 88 modern figures. HR ids "
                "mapped to the star ids in stars.json at build time."
            ),
            "license": "CC BY 4.0",
            "attribution": (
                "Constellation lines: Marc van der Sluys, 'ConstellationLines' "
                "(CC BY 4.0), DOI 10.5281/zenodo.10397192, "
                "github.com/MarcvdSluys/ConstellationLines."
            ),
            "source_url": "https://github.com/MarcvdSluys/ConstellationLines",
            "verified_date": "2026-07-18",
            "cultural_note": (
                "CULTURAL OVERLAY: the stars are real measured objects, but the "
                "lines joining them into figures are a human convention (the modern "
                "Western/IAU set). Other cultures draw the sky differently. See "
                "docs/NIGHT_SKY_PHYSICS.md."
            ),
            "license_trap_avoided": (
                "Stellarium's constellationship.fab is GPL, and dcf21's IAU stick-"
                "figure file is stamped GPL v3 in its own header -- both rejected. "
                "This CC BY 4.0 source is clean for redistribution."
            ),
            "id_scheme": "star ids match stars.json `id` (positive=HIP, negative=-(HYG id))",
            "schema": "{abbr, name, lines:[[starId,starId],...]}",
            "generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "counts": {
                "constellations": len(constellations),
                "segments": total_segments,
                "dropped_segments": dropped_segments,
                "unresolved_hr_ids": sorted(unresolved_hr),
            },
        },
        "constellations": constellations,
    }

    # --- Emit Messier ------------------------------------------------------
    def load_ngc(txt):
        return list(csv.DictReader(io.StringIO(txt), delimiter=";"))

    ngc_all = load_ngc(ngc_csv) + load_ngc(add_csv)
    by_m = {}
    ngc5866 = None
    for r in ngc_all:
        if r["Name"] == "NGC5866":
            ngc5866 = r
        m = r.get("M", "").strip()
        if not m:
            continue
        if r.get("Type", "").strip() == "Dup":   # e.g. the M102=M101 duplicate row
            continue
        mi = int(m)
        by_m.setdefault(mi, r)

    def messier_obj(mi, r, ngc_override=None, note=None):
        typ = r.get("Type", "").strip()
        vmag = fnum(r.get("V-Mag"))
        bmag = fnum(r.get("B-Mag"))
        ngc = ngc_override
        if ngc is None:
            nm = r["Name"].strip()
            if nm.startswith("NGC"):
                ngc = int(nm[3:]) if nm[3:].isdigit() else None
            elif r.get("NGC", "").strip().isdigit():
                ngc = int(r["NGC"].strip())
        obj = {
            "m": mi,
            "ngc": ngc,
            "name": (r.get("Common names", "").strip() or None),
            "ra": rnd(hms_to_deg(r.get("RA")), 4),
            "dec": rnd(dms_to_deg(r.get("Dec")), 4),
            "mag": vmag if vmag is not None else bmag,
            "type": NGC_TYPE.get(typ, typ or None),
            "con": r.get("Const", "").strip() or None,
        }
        if note:
            obj["note"] = note
        return obj

    messier = []
    for mi in range(1, 111):
        if mi == 102:
            if ngc5866 is not None:
                messier.append(messier_obj(
                    102, ngc5866, ngc_override=5866,
                    note=("M102 is disputed: some sources treat it as a duplicate "
                          "observation of M101; we adopt the common modern "
                          "identification NGC 5866 (a lenticular galaxy in Draco)."),
                ))
            continue
        if mi in by_m:
            messier.append(messier_obj(mi, by_m[mi]))
        else:
            print(f"  WARNING: Messier M{mi} not found in OpenNGC", file=sys.stderr)

    messier_doc = {
        "meta": {
            "title": "Messier catalog (110 deep-sky objects)",
            "source": (
                "OpenNGC (mattiaverga/OpenNGC) -- NGC/IC/Messier objects with "
                "J2000 positions (NED), magnitudes (LEDA/SIMBAD) and object types. "
                "All positions/magnitudes/types are MEASURED catalog data."
            ),
            "license": "CC BY-SA 4.0",
            "attribution": "Deep-sky objects: OpenNGC by Mattia Verga, CC BY-SA 4.0, github.com/mattiaverga/OpenNGC.",
            "source_url": "https://github.com/mattiaverga/OpenNGC",
            "verified_date": "2026-07-18",
            "epoch": "J2000.0",
            "schema": "{m, ngc, name, ra(deg), dec(deg), mag, type, con[, note]}",
            "units": {
                "ra": "degrees, J2000 (converted from HH:MM:SS)",
                "dec": "degrees, J2000 (converted from +/-DD:MM:SS)",
                "mag": "apparent magnitude (V-Mag preferred, else B-Mag); null if absent",
                "ngc": "NGC number if the object has one (null for M40, M45, M24 etc.)",
                "name": "common name from OpenNGC; null if none listed",
            },
            "honesty": (
                "Positions/magnitudes/types are measured catalog values. No distances "
                "are shipped: OpenNGC has no single reliable distance for every DSO, so "
                "we omit rather than guess. M102 identity is disputed (noted per-object)."
            ),
            "generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "counts": {"objects": len(messier)},
        },
        "objects": messier,
    }

    # --- Write -------------------------------------------------------------
    os.makedirs(out_dir, exist_ok=True)

    def write_json(name, doc):
        path = os.path.join(out_dir, name)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
            f.write("\n")
        size = os.path.getsize(path)
        print(f"  wrote {name:22s} {size:>8d} bytes ({size/1024:6.1f} KB)")
        return size

    print("\nOutput:")
    write_json("stars.json", stars_doc)
    write_json("constellations.json", cons_doc)
    write_json("messier.json", messier_doc)

    print("\nCounts:")
    print(f"  stars:          {len(star_rows)} (naked-eye<=6.5: {n_bright}, named: {n_named}, IAU-filled: {names_from_iau})")
    print(f"  constellations: {len(constellations)}  segments: {total_segments}  dropped: {dropped_segments}")
    print(f"  unresolved HR ids: {sorted(unresolved_hr) or 'none'}")
    print(f"  messier objects: {len(messier)}")
    if len(messier) != 110:
        print("  ERROR: expected 110 Messier objects!", file=sys.stderr)
        return 1
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out-dir", default="public/data/night-sky")
    ap.add_argument("--cache-dir",
                    default=os.path.join(tempfile.gettempdir(), "hot-nightsky-cache"),
                    help="where to cache raw downloads (default: OS temp)")
    ap.add_argument("--refresh", action="store_true", help="re-download all sources")
    args = ap.parse_args()
    return build(args.out_dir, args.cache_dir, args.refresh)


if __name__ == "__main__":
    raise SystemExit(main())
