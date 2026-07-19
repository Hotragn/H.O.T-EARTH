#!/usr/bin/env python3
"""Build the Meteor Showers (Phase 12) static catalog for the H.O.T digital twin.

Produces one compact, honest JSON file under public/data/meteor-showers/:

  showers.json   the major + notable annual meteor showers (37 rows)

HONESTY BAR (from the project brief, enforced here):
  * Radiant positions (RA/Dec), activity periods, peak dates, peak solar
    longitudes, velocities and parent-body associations are REAL CATALOG DATA
    (IAU MDC established-shower list + IMO Working List of Visual Meteor
    Showers). They are measured / cataloged scientific facts.
  * ZHR (Zenithal Hourly Rate) is a standardized IDEAL rate -- the number a
    single observer would see under a perfectly clear sky (reference limiting
    magnitude +6.5) WITH THE RADIANT AT THE ZENITH. Real observed rates are
    almost always LOWER (radiant below zenith, light pollution, Moon, clouds).
    Every ZHR here is labeled ideal. See docs/METEOR_SHOWERS_PHYSICS.md.
  * A meteor shower happens when Earth crosses a debris stream shed by a comet
    (or a rock-comet asteroid). That is real physics -- the radiant is a
    perspective effect of Earth entering a stream of near-parallel particles.

Nothing is invented. Where a parent body or value is not well established the
field is JSON null (never a guess). Dates are for the year 2026 (peaks drift
about +/-1 day between years; the STABLE quantity is the solar longitude, which
is why peak_solar_longitude is shipped alongside the calendar date).

--------------------------------------------------------------------------------
SOURCES + LICENSES (verified 2026-07-18; full detail in
docs/METEOR_SHOWERS_DATA_SOURCES.md)
--------------------------------------------------------------------------------
1. IAU Meteor Data Center (MDC), Shower Database -- the authoritative catalog of
   established meteor showers (113 established showers on 2026-07-18; the IMO
   2026 calendar cites 110 as of 2025-06-13). It assigns each shower its
   official 3-letter IAU code (PER, GEM, ORI, ...) and IAU number, and holds
   radiant RA/Dec, reference solar longitude, geocentric velocity Vg and
   parent-body links. Hosted at the Astronomical Institute of the Slovak Academy
   of Sciences (ta3.sk) and A.M. University Poznan.
   Lists: http://www.ta3.sk/IAUC22DB/MDC2022/Roje/roje_lista.php
   Requested citation (scientific catalog): Jopek T.J. & Kanuchova Z. (2017),
   "IAU Meteor Data Center - the shower database: A status report",
   Planetary and Space Science 143, 3-6; with the current database managers
   (Hajdukova, Rudawska, Neslusan et al.). MDC values are measured scientific
   facts, freely usable with citation.

2. IMO (International Meteor Organization), "Working List of Visual Meteor
   Showers", Table 5 of the 2026 IMO Meteor Shower Calendar (INFO(3-25),
   ed. J. Rendtel), https://www.imo.net/files/meteor-shower/cal2026.pdf .
   This is the single most accurate visual working list and is the source of
   the exact per-shower numbers TRANSCRIBED below: activity window, maximum
   date, maximum solar longitude (lambda_sun), radiant alpha/delta (J2000.0,
   degrees, at maximum), V_inf (km/s), r (population index), and ZHR.
   LICENSE POSTURE (honest -- see the data-sources doc): the IMO Calendar text,
   charts and website are Copyright (c) IMO ("No part of the Copyright protected
   structure of this website may be reproduced ... without prior written
   permission" -- imo.net/legal-notice/). We therefore do NOT redistribute the
   IMO Calendar itself, its prose, its charts or its software. What we ship are
   the underlying MEASURED SCIENTIFIC FACTS (radiant coordinates, velocities,
   solar longitudes, activity dates -- the same facts held by the IAU MDC and
   widely published), re-expressed in our own schema, with IMO credited as the
   source of the working-list values and the ZHR/r estimates. Individual factual
   values are not copyrightable; we take no copyrightable expression. IMO's own
   guidance is to "mention the source of the data in any publication" -- we do.

3. AMS (American Meteor Society) meteor-shower calendar -- used only as a
   CROSS-CHECK for peak dates / ZHR (e.g. AMS lists Perseids ZHR 100, Geminids
   150, Quadrantids ~120). Content is (c) American Meteor Society; not copied.
   https://www.amsmeteors.org/meteor-showers/meteor-shower-calendar/

VELOCITY NOTE (rigorous labeling): the velocity shipped is the IMO V_inf
(pre-atmospheric / apparent entry speed, km/s), which is what we verified from
the Calendar. It is close to, but NOT identical with, the IAU MDC geocentric
velocity Vg: V_inf ~= sqrt(Vg^2 + Ve^2) with Ve ~ 11.2 km/s (Earth escape
speed), so the two differ most for slow showers. We label the field as V_inf so
no one mistakes it for a bare Vg.

PARENT BODIES that ALSO exist in public/data/small-bodies/objects.json get
`parent_in_catalog: true` and a `parent_designation` for frontend cross-linking
(computed live from objects.json, not hardcoded): 1P/Halley (ETA, ORI),
2P/Encke (STA, NTA), 21P/Giacobini-Zinner (DRA), 55P/Tempel-Tuttle (LEO),
109P/Swift-Tuttle (PER), 3200 Phaethon (GEM). NOTE: 8P/Tuttle (the Ursids
parent) is NOT currently in objects.json, so URS cross-links to null -- flagged
honestly rather than faked.

Usage:
    python scripts/meteor-showers/build_showers.py
    python scripts/meteor-showers/build_showers.py --out public/data/meteor-showers/showers.json
"""

import argparse
import json
import os

VERIFIED_DATE = "2026-07-18"

# Path to the small-bodies catalog, for parent-body cross-linking.
SMALL_BODIES = os.path.join(
    os.path.dirname(__file__), "..", "..",
    "public", "data", "small-bodies", "objects.json",
)

# ---------------------------------------------------------------------------
# The catalog. Every numeric field is TRANSCRIBED from the IMO 2026 Working
# List of Visual Meteor Showers (Table 5, INFO(3-25)); the IAU code + number
# are the official IAU MDC designations; parent bodies are from the cited
# literature (see docs/METEOR_SHOWERS_DATA_SOURCES.md). Radiant RA/Dec are the
# MAXIMUM-date radiant, epoch J2000.0, in degrees. lambda_sun (peak solar
# longitude), also degrees. vinf in km/s. r = population index. zhr = ideal
# peak ZHR. Dates are MM-DD for 2026. `zhr: None` means the IMO list marks it
# "Var" (variable / outburst-driven) -- no stable annual peak rate.
#
# Field order per tuple:
#  code, iau_no, name, ra, dec, peak MMDD, lambda_sun, start MMDD, end MMDD,
#  zhr, vinf, r, parent_designation_or_None, parent_body_or_None, parent_type,
#  note
# parent_designation is the small-body designation to try to match in
# objects.json (e.g. "1P", "2P", "3200"); None if no cross-linkable designation.
# ---------------------------------------------------------------------------
SHOWERS = [
    ("QUA", 10, "Quadrantids",
     230.0, 49.0, "01-03", 283.15, "12-28", "01-12",
     80, 41, 2.1, "196256", "(196256) 2003 EH1", "asteroid",
     "Very sharp peak (hours). Parent is asteroid (196256) 2003 EH1, an "
     "extinct-comet candidate (possibly linked to comet C/1490 Y1). ZHR is "
     "variable; IMO 2026 lists 80, historically quoted up to ~110-120."),
    ("GUM", 404, "gamma-Ursae Minorids",
     228.0, 67.0, "01-18", 298.0, "01-10", "01-22",
     3, 31, 3.0, None, None, None,
     "Minor far-northern shower; parameters tentative. Parent not established."),
    ("ACE", 102, "alpha-Centaurids",
     211.0, -58.0, "02-08", 319.4, "01-31", "02-20",
     6, 58, 2.0, None, None, None,
     "Southern-hemisphere shower; occasional bright fireballs. Parent not "
     "firmly established."),
    ("LYR", 6, "April Lyrids",
     271.0, 34.0, "04-22", 32.32, "04-14", "04-30",
     18, 49, 2.1, None, "C/1861 G1 (Thatcher)", "comet",
     "Parent is long-period comet C/1861 G1 (Thatcher), ~415 yr orbit. ZHR "
     "usually ~18 but has briefly spiked (ZHR 90 in 1982)."),
    ("PPU", 137, "pi-Puppids",
     110.0, -45.0, "04-24", 33.5, "04-15", "04-28",
     None, 18, 2.0, None, "26P/Grigg-Skjellerup", "comet",
     "Periodic/variable; rates tied to 26P/Grigg-Skjellerup returns. "
     "Southern shower."),
    ("ETA", 31, "eta-Aquariids",
     338.0, -1.0, "05-06", 45.5, "04-19", "05-28",
     50, 66, 2.4, "1P", "1P/Halley", "comet",
     "One of two showers from comet 1P/Halley (the other is the Orionids). "
     "Fast meteors; best from the tropics/southern hemisphere. Broad peak."),
    ("ELY", 145, "eta-Lyrids",
     291.0, 43.0, "05-11", 50.0, "05-03", "05-14",
     3, 43, 3.0, None, "C/1983 H1 (IRAS-Araki-Alcock)", "comet",
     "Parent is comet C/1983 H1 (IRAS-Araki-Alcock), ~960 yr orbit."),
    ("ARI", 171, "Daytime Arietids",
     43.0, 24.0, "06-07", 76.7, "05-14", "06-24",
     30, 38, 2.8, None, None, None,
     "Strongest DAYTIME shower (radio/forward-scatter; radiant near the Sun). "
     "Parent debated (96P/Machholz complex / asteroid 1566 Icarus proposed)."),
    ("JBO", 170, "June Bootids",
     221.0, 48.0, "06-22", 90.3, "06-22", "07-02",
     None, 18, 2.2, None, "7P/Pons-Winnecke", "comet",
     "Variable; near-silent most years but strong outbursts (1998, 2004) from "
     "comet 7P/Pons-Winnecke. Very slow meteors."),
    ("JPE", 175, "July Pegasids",
     347.0, 11.0, "07-10", 108.0, "07-01", "07-20",
     3, 63, 3.0, None, None, None,
     "Minor summer shower; parent not firmly established."),
    ("GDR", 184, "July gamma-Draconids",
     280.0, 51.0, "07-28", 125.13, "07-25", "07-31",
     5, 27, 3.0, None, None, None,
     "Sharp variable maximum (2016 outburst); slow meteors. Parent uncertain."),
    ("SDA", 5, "Southern delta-Aquariids",
     340.0, -16.0, "07-31", 128.0, "07-12", "08-23",
     25, 41, 2.5, None, "96P/Machholz", "comet",
     "Parent is comet 96P/Machholz. Steady late-July stream; best from the "
     "southern hemisphere and low northern latitudes."),
    ("CAP", 1, "alpha-Capricornids",
     307.0, -10.0, "07-31", 128.0, "07-03", "08-15",
     5, 23, 2.5, None, "169P/NEAT", "comet",
     "Parent is comet 169P/NEAT (= 2002 EX12). Slow, bright, yellow fireballs; "
     "low count but memorable meteors."),
    ("ERI", 191, "eta-Eridanids",
     41.0, -11.0, "08-07", 135.0, "07-31", "08-19",
     3, 64, 3.0, None, None, None,
     "Minor fast shower; parent not firmly established."),
    ("PER", 7, "Perseids",
     48.0, 58.0, "08-13", 140.0, "07-17", "08-24",
     100, 59, 2.2, "109P", "109P/Swift-Tuttle", "comet",
     "The classic summer shower; parent comet 109P/Swift-Tuttle (~133 yr). "
     "Rich, fast, many trains. Best from mid-northern latitudes."),
    ("KCG", 12, "kappa-Cygnids",
     286.0, 59.0, "08-17", 144.0, "08-03", "08-28",
     3, 23, 3.0, "2008 ED69", "(153311) 2008 ED69", "asteroid",
     "Slow shower with occasional fireballs; ~7 yr enhancement cycle. Asteroid "
     "2008 ED69 proposed as parent (tentative)."),
    ("AUR", 206, "Aurigids",
     91.0, 39.0, "09-01", 158.6, "08-28", "09-05",
     6, 66, 2.5, None, "C/1911 N1 (Kiess)", "comet",
     "Parent is long-period comet C/1911 N1 (Kiess), ~2000 yr orbit; produced "
     "outbursts in 1935, 1986, 1994, 2007. Fast meteors."),
    ("SPE", 208, "September epsilon-Perseids",
     48.0, 40.0, "09-09", 166.7, "09-05", "09-21",
     8, 64, 2.5, None, None, None,
     "Rich in bright meteors; 2013 outburst. Parent long-period, not "
     "identified."),
    ("SLY", 81, "September Lyncids",
     113.0, 56.0, "09-13", 170.0, "09-10", "10-08",
     3, 60, 3.0, None, None, None,
     "Minor shower; parent not established."),
    ("DSX", 221, "Daytime Sextantids",
     156.0, -2.0, "10-01", 188.0, "09-20", "10-06",
     5, 32, 2.5, None, None, None,
     "Daytime (radio) shower; likely part of the Phaethon/Geminid complex "
     "(asteroid 2005 UD proposed) -- association tentative, shipped as null."),
    ("OCT", 281, "October Camelopardalids",
     164.0, 79.0, "10-06", 192.58, "10-05", "10-06",
     5, 47, 2.5, None, None, None,
     "Brief north-circumpolar shower with a very sharp peak; long-period "
     "parent, not identified."),
    ("DRA", 9, "Draconids",
     262.0, 54.0, "10-09", 195.4, "10-06", "10-10",
     5, 20, 2.6, "21P", "21P/Giacobini-Zinner", "comet",
     "Parent comet 21P/Giacobini-Zinner. Normally weak (ZHR ~5) but famous for "
     "storms (1933, 1946) and outbursts (2011, 2018). Very slow meteors."),
    ("EGE", 23, "epsilon-Geminids",
     102.0, 27.0, "10-18", 205.0, "10-14", "10-27",
     3, 70, 3.0, None, None, None,
     "Weak, fast; overlaps the Orionids so care is needed to separate them. "
     "Parent not established."),
    ("ORI", 8, "Orionids",
     95.0, 16.0, "10-21", 208.0, "10-02", "11-07",
     20, 66, 2.5, "1P", "1P/Halley", "comet",
     "The second shower from comet 1P/Halley (with the eta-Aquariids). Fast "
     "meteors, broad plateau; some years reach ZHR 40-70."),
    ("LMI", 22, "Leonis Minorids",
     162.0, 37.0, "10-24", 211.0, "10-19", "10-27",
     2, 62, 3.0, None, None, None,
     "Minor fast shower; long-period comet parent (C/1739 K1 proposed), "
     "tentative -- shipped as null."),
    ("STA", 2, "Southern Taurids",
     52.0, 15.0, "11-05", 223.0, "09-20", "11-20",
     7, 27, 2.3, "2P", "2P/Encke", "comet",
     "Part of the Taurid complex from comet 2P/Encke. Slow, bright fireballs "
     "over a long, low-rate activity window (the 'Halloween fireballs')."),
    ("NTA", 17, "Northern Taurids",
     58.0, 22.0, "11-12", 230.0, "10-20", "12-10",
     5, 29, 2.3, "2P", "2P/Encke", "comet",
     "Northern branch of the Taurid complex (comet 2P/Encke; asteroid "
     "2004 TG10 also associated). Slow fireballs; enhanced 'swarm' years."),
    ("LEO", 13, "Leonids",
     152.0, 22.0, "11-17", 235.27, "11-06", "11-30",
     15, 71, 2.5, "55P", "55P/Tempel-Tuttle", "comet",
     "Parent comet 55P/Tempel-Tuttle (~33 yr). Very fast; famous for ~33-yr "
     "storms (e.g. 1833, 1966, 1999-2002). Modest ZHR ~15 in non-storm years."),
    ("AMO", 246, "alpha-Monocerotids",
     117.0, 1.0, "11-22", 239.32, "11-15", "11-25",
     None, 65, 2.4, None, None, None,
     "Variable; rare brief outbursts (ZHR ~400 in 1925, 1935, 1985, 1995) from "
     "a long-period parent, not firmly identified."),
    ("NOO", 250, "November Orionids",
     91.0, 16.0, "11-28", 246.0, "11-13", "12-06",
     3, 44, 3.0, None, None, None,
     "Minor shower near the Orionid radiant region; parent not established."),
    ("PHO", 254, "Phoenicids",
     8.0, -27.0, "12-02", 249.5, "12-01", "12-05",
     None, 15, 2.8, None, "289P/Blanpain", "comet",
     "Variable/periodic; parent comet 289P/Blanpain (= 2003 WY25). Slow "
     "meteors; 1956 outburst. Southern shower."),
    ("PUP", 301, "Puppid-Velids",
     123.0, -45.0, "12-07", 255.0, "12-01", "12-15",
     10, 44, 2.9, None, None, None,
     "A complex of poorly-separated southern radiants; the listed position is "
     "a reference, not a single true maximum. Parent(s) not established."),
    ("MON", 19, "December Monocerotids",
     100.0, 8.0, "12-09", 257.0, "12-01", "12-19",
     3, 41, 3.0, None, "C/1917 F1 (Mellish)", "comet",
     "Parent proposed as comet C/1917 F1 (Mellish) (tentative). Weak; care "
     "needed to separate from Geminids and sigma-Hydrids."),
    ("HYD", 16, "sigma-Hydrids",
     125.0, 2.0, "12-09", 257.0, "12-03", "12-20",
     7, 58, 3.0, None, None, None,
     "Fast; reliably reaches ZHR 5-8 with some bright meteors. Parent "
     "(long-period comet) not firmly established."),
    ("GEM", 4, "Geminids",
     112.0, 33.0, "12-14", 262.2, "12-04", "12-20",
     150, 35, 2.6, "3200", "(3200) Phaethon", "asteroid",
     "Parent is ASTEROID (3200) Phaethon, a 'rock comet' -- unusual: most "
     "streams come from comets. The best and most reliable annual shower; "
     "medium speed, many bright meteors and fireballs."),
    ("COM", 20, "Comae Berenicids",
     164.0, 29.0, "12-23", 271.0, "12-04", "01-30",
     3, 65, 3.0, None, None, None,
     "Long, low-rate stream (merged with the December Leonis Minorids in the "
     "IMO list). Fast meteors. Parent not firmly established."),
    ("URS", 15, "Ursids",
     217.0, 76.0, "12-22", 270.7, "12-17", "12-26",
     10, 33, 2.8, "8P", "8P/Tuttle", "comet",
     "Parent comet 8P/Tuttle. North-circumpolar; often overlooked (peaks just "
     "after the Geminids). NOTE: 8P is not (yet) in the small-bodies catalog, "
     "so this parent does not cross-link."),
]


def build(objects_path):
    # Load small-body designations for parent cross-linking.
    catalog_designations = set()
    try:
        with open(objects_path, "r", encoding="utf-8") as f:
            sb = json.load(f)
        for o in sb.get("objects", []):
            if o.get("designation"):
                catalog_designations.add(str(o["designation"]))
    except (OSError, ValueError) as e:
        print("WARNING: could not read small-bodies catalog for cross-linking:", e)

    showers = []
    n_comet = n_asteroid = n_parent_known = n_xlink = 0
    for (code, iau_no, name, ra, dec, peak, lam, start, end, zhr, vinf, r,
         pdes, pbody, ptype, note) in SHOWERS:
        in_catalog = bool(pdes) and pdes in catalog_designations
        if in_catalog:
            n_xlink += 1
        if pbody:
            n_parent_known += 1
        if ptype == "comet":
            n_comet += 1
        elif ptype == "asteroid":
            n_asteroid += 1
        showers.append({
            "code": code,
            "iau_number": iau_no,
            "name": name,
            "radiant_ra": ra,
            "radiant_dec": dec,
            "peak_date": peak,
            "peak_solar_longitude": lam,
            "active_start": start,
            "active_end": end,
            "zhr": zhr,
            "velocity_kms": vinf,
            "r_population_index": r,
            "parent_body": pbody,
            "parent_type": ptype,
            "parent_designation": pdes if in_catalog else None,
            "parent_in_catalog": in_catalog,
            "note": note,
        })

    doc = {
        "meta": {
            "phase": 12,
            "title": "Meteor Showers - major + notable annual showers",
            "verified_date": VERIFIED_DATE,
            "year": 2026,
            "sources": {
                "iau_mdc": {
                    "name": "IAU Meteor Data Center (MDC) Shower Database",
                    "role": "Authoritative catalog: official IAU 3-letter codes "
                            "+ numbers, radiant RA/Dec, reference solar "
                            "longitude, geocentric velocity Vg, parent bodies.",
                    "url": "http://www.ta3.sk/IAUC22DB/MDC2022/Roje/roje_lista.php",
                    "citation": "Jopek T.J. & Kanuchova Z. (2017), IAU Meteor "
                                "Data Center - the shower database: A status "
                                "report, Planetary and Space Science 143, 3-6.",
                    "status": "Public scientific catalog; measured facts, "
                              "freely usable with citation.",
                },
                "imo": {
                    "name": "IMO Working List of Visual Meteor Showers "
                            "(Table 5, 2026 IMO Meteor Shower Calendar)",
                    "role": "Source of the transcribed per-shower values: "
                            "activity window, peak date, peak solar longitude, "
                            "radiant alpha/delta (J2000.0), V_inf, r, ZHR.",
                    "url": "https://www.imo.net/files/meteor-shower/cal2026.pdf",
                    "editor": "J. Rendtel (ed.), INFO(3-25).",
                    "license": "IMO Calendar/website content is Copyright (c) "
                               "IMO (imo.net/legal-notice/). We do NOT "
                               "redistribute the Calendar, its prose, charts or "
                               "software. We ship only the underlying measured "
                               "scientific facts (radiant, velocity, solar "
                               "longitude, dates -- also in the IAU MDC and "
                               "widely published) plus IMO's ZHR/r estimates, "
                               "re-expressed in our own schema, crediting IMO. "
                               "Per IMO guidance we mention the source.",
                },
                "ams": {
                    "name": "American Meteor Society meteor-shower calendar",
                    "role": "Cross-check only for peak dates / ZHR.",
                    "url": "https://www.amsmeteors.org/meteor-showers/meteor-shower-calendar/",
                    "license": "Content (c) American Meteor Society; not copied.",
                },
            },
            "units": {
                "radiant_ra": "degrees (J2000.0), at maximum",
                "radiant_dec": "degrees (J2000.0), at maximum",
                "peak_date": "MM-DD, for the year 2026 (peaks drift ~+/-1 day "
                             "between years; solar longitude is the stable "
                             "quantity)",
                "peak_solar_longitude": "degrees (solar longitude at maximum; "
                                        "stable year to year)",
                "active_start": "MM-DD (2026)",
                "active_end": "MM-DD (2026)",
                "zhr": "IDEAL peak Zenithal Hourly Rate -- perfectly clear sky "
                       "(limiting magnitude +6.5) WITH RADIANT AT ZENITH. Real "
                       "observed rates are lower. null = IMO marks it 'Var' "
                       "(variable / outburst-driven).",
                "velocity_kms": "V_inf, pre-atmospheric (apparent) entry speed "
                                "in km/s from the IMO list. Close to but not "
                                "identical with the IAU MDC geocentric velocity "
                                "Vg (V_inf ~= sqrt(Vg^2 + 11.2^2)).",
                "r_population_index": "population index (dimensionless); lower "
                                      "= brighter mean magnitude. Typically "
                                      "2.0-3.5.",
            },
            "honesty": "Radiant, activity dates, peak dates, peak solar "
                       "longitude, velocity and parent bodies are REAL catalog "
                       "data (IAU MDC + IMO Working List). ZHR is an IDEALIZED "
                       "rate (radiant at zenith, perfect sky) -- actual observed "
                       "rates are lower. Showers occur when Earth crosses a "
                       "comet/asteroid debris stream; the radiant is a "
                       "perspective effect. null = not well established; never "
                       "invented.",
            "parent_cross_link": "parent_in_catalog=true means parent_body's "
                                 "designation exists in "
                                 "public/data/small-bodies/objects.json "
                                 "(1P/Halley->ETA,ORI; 2P/Encke->STA,NTA; "
                                 "21P/Giacobini-Zinner->DRA; "
                                 "55P/Tempel-Tuttle->LEO; "
                                 "109P/Swift-Tuttle->PER; 3200 Phaethon->GEM). "
                                 "8P/Tuttle (URS) is NOT in that catalog, so "
                                 "URS does not cross-link.",
            "attribution": "Meteor shower data: IAU Meteor Data Center (Jopek & "
                           "Kanuchova 2017) and the IMO Working List of Visual "
                           "Meteor Showers (2026 IMO Meteor Shower Calendar, ed. "
                           "J. Rendtel); cross-checked with the American Meteor "
                           "Society calendar.",
            "counts": {},
        },
        "showers": showers,
    }
    doc["meta"]["counts"] = {
        "showers": len(showers),
        "parent_known": n_parent_known,
        "parent_comet": n_comet,
        "parent_asteroid": n_asteroid,
        "parent_cross_linked": n_xlink,
    }
    return doc


def main():
    ap = argparse.ArgumentParser(description="Build meteor-showers/showers.json")
    default_out = os.path.join(
        os.path.dirname(__file__), "..", "..",
        "public", "data", "meteor-showers", "showers.json",
    )
    ap.add_argument("--out", default=default_out)
    ap.add_argument("--objects", default=SMALL_BODIES,
                    help="path to small-bodies objects.json for cross-linking")
    args = ap.parse_args()

    doc = build(args.objects)
    out = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=True, separators=(",", ":"))

    c = doc["meta"]["counts"]
    size = os.path.getsize(out)
    print("Wrote", out)
    print("  showers:            ", c["showers"])
    print("  parent known:       ", c["parent_known"],
          "(comets %d, asteroids %d)" % (c["parent_comet"], c["parent_asteroid"]))
    print("  parent cross-linked:", c["parent_cross_linked"], "to small-bodies")
    print("  file size:          ", size, "bytes (%.1f KB)" % (size / 1024.0))


if __name__ == "__main__":
    main()
