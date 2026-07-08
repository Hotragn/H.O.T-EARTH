#!/usr/bin/env python3
"""Curate + validate public/data/history/events.json for the "time-machine Earth" layer.

Marquee historical events with real coordinates, dates and a per-event source
URL, driving the Virtual Earth timeline (a marker pulses at the coordinates
while the simulated year is within the event's span).

This is a CURATED dataset, not a bulk scrape. Facts (dates, coordinates) are
free — structured data on Wikidata is CC0 (public domain), and the same facts
appear on Wikipedia. Every row here was hand-selected and hand-checked; each
carries a Wikipedia/Wikidata `source` URL. No invented events. See
docs/HISTORY_DATA_SOURCES.md §3 for the licensing rationale (Wikidata CC0).

Schema (exactly what lib/chrono-events.ts expects):
    [
      { "name": str, "startYear": int, "endYear": int (optional; defaults to
        startYear), "lat": float, "lon": float,
        "category": one of conflict|science|exploration|culture|disaster|founding,
        "source": "https://..." },
      ...
    ]
Years are signed integers (negative = BCE; there is no year 0). Coordinates are
degrees, +N / +E.

Running this script:
    python scripts/history/build_events.py            # validate + (re)write events.json
    python scripts/history/build_events.py --check     # validate only, do not write

Validation checks (fail the build): required fields present and typed; category
in the allowed set; -90 <= lat <= 90; -180 <= lon <= 180; startYear <= endYear;
non-empty name and source URL. Reports counts by category/era and confirms both
World Wars are present.

No third-party dependencies (stdlib only): json.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_PATH = os.path.join(REPO_ROOT, "public", "data", "history", "events.json")

VALID_CATEGORIES = {
    "conflict",
    "science",
    "exploration",
    "culture",
    "disaster",
    "founding",
}

# --- Curated marquee events -------------------------------------------------
# (name, startYear, endYear|None, lat, lon, category, wikipedia/wikidata URL)
# Hand-checked dates + coordinates. endYear=None => single-year event.
EVENTS: list[tuple] = [
    # --- Deep antiquity: first cities, writing, monuments ------------------
    ("Founding of Jericho (early settlement)", -9000, None, 31.8700, 35.4440, "founding", "https://en.wikipedia.org/wiki/Jericho"),
    ("Catalhoyuk Neolithic town", -7100, -5700, 37.6664, 32.8283, "founding", "https://en.wikipedia.org/wiki/%C3%87atalh%C3%B6y%C3%BCk"),
    ("Founding of Uruk", -4500, None, 31.3220, 45.6360, "founding", "https://en.wikipedia.org/wiki/Uruk"),
    ("Invention of cuneiform writing, Sumer", -3200, None, 31.3220, 45.6360, "culture", "https://en.wikipedia.org/wiki/Cuneiform"),
    ("Unification of Upper and Lower Egypt", -3100, None, 25.7000, 32.6400, "founding", "https://en.wikipedia.org/wiki/Early_Dynastic_Period_(Egypt)"),
    ("Stonehenge sarsen circle raised", -2500, None, 51.1789, -1.8262, "culture", "https://en.wikipedia.org/wiki/Stonehenge"),
    ("Great Pyramid of Giza built", -2560, None, 29.9792, 31.1342, "culture", "https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza"),
    ("Indus Valley Civilization peak (Mohenjo-daro)", -2500, -1900, 27.3294, 68.1386, "culture", "https://en.wikipedia.org/wiki/Mohenjo-daro"),
    ("Code of Hammurabi", -1754, None, 32.5364, 44.4208, "culture", "https://en.wikipedia.org/wiki/Code_of_Hammurabi"),
    ("Eruption of Thera (Minoan eruption)", -1600, None, 36.4040, 25.3960, "disaster", "https://en.wikipedia.org/wiki/Minoan_eruption"),
    ("Reign of Ramesses II", -1279, -1213, 25.7188, 32.6104, "culture", "https://en.wikipedia.org/wiki/Ramesses_II"),
    ("Trojan War (traditional)", -1194, -1184, 39.9576, 26.2390, "conflict", "https://en.wikipedia.org/wiki/Trojan_War"),
    ("First Olympic Games, Olympia", -776, None, 37.6383, 21.6300, "culture", "https://en.wikipedia.org/wiki/Ancient_Olympic_Games"),
    ("Founding of Rome (traditional)", -753, None, 41.9000, 12.5000, "founding", "https://en.wikipedia.org/wiki/Founding_of_Rome"),
    ("Founding of Carthage (traditional)", -814, None, 36.8528, 10.3233, "founding", "https://en.wikipedia.org/wiki/Carthage"),
    ("Life of the Buddha (Bodh Gaya enlightenment)", -528, None, 24.6959, 84.9911, "culture", "https://en.wikipedia.org/wiki/Gautama_Buddha"),
    ("Life of Confucius", -551, -479, 35.5967, 116.9917, "culture", "https://en.wikipedia.org/wiki/Confucius"),
    ("Battle of Marathon", -490, None, 38.1500, 23.9667, "conflict", "https://en.wikipedia.org/wiki/Battle_of_Marathon"),
    ("Parthenon completed, Athens", -432, None, 37.9715, 23.7267, "culture", "https://en.wikipedia.org/wiki/Parthenon"),
    ("Alexander the Great's conquests", -334, -323, 33.3152, 44.3661, "conflict", "https://en.wikipedia.org/wiki/Wars_of_Alexander_the_Great"),
    ("Founding of Alexandria, Egypt", -331, None, 31.2000, 29.9187, "founding", "https://en.wikipedia.org/wiki/Alexandria"),
    ("Great Library of Alexandria founded", -283, None, 31.2000, 29.9000, "culture", "https://en.wikipedia.org/wiki/Library_of_Alexandria"),
    ("Qin unification of China", -221, None, 34.3841, 109.2785, "founding", "https://en.wikipedia.org/wiki/Qin%27s_wars_of_unification"),
    ("Battle of Cannae (Second Punic War)", -216, None, 41.3060, 16.1320, "conflict", "https://en.wikipedia.org/wiki/Battle_of_Cannae"),
    ("Assassination of Julius Caesar", -44, None, 41.8955, 12.4823, "conflict", "https://en.wikipedia.org/wiki/Assassination_of_Julius_Caesar"),

    # --- Common era: empires, religions, science --------------------------
    ("Eruption of Vesuvius destroys Pompeii", 79, None, 40.8210, 14.4260, "disaster", "https://en.wikipedia.org/wiki/Eruption_of_Mount_Vesuvius_in_79_AD"),
    ("Colosseum completed, Rome", 80, None, 41.8902, 12.4922, "culture", "https://en.wikipedia.org/wiki/Colosseum"),
    ("Antonine Plague", 165, 180, 41.9000, 12.5000, "disaster", "https://en.wikipedia.org/wiki/Antonine_Plague"),
    ("Fall of the Western Roman Empire", 476, None, 41.9000, 12.5000, "conflict", "https://en.wikipedia.org/wiki/Fall_of_the_Western_Roman_Empire"),
    ("Hagia Sophia completed, Constantinople", 537, None, 41.0086, 28.9800, "culture", "https://en.wikipedia.org/wiki/Hagia_Sophia"),
    ("Plague of Justinian", 541, 549, 41.0086, 28.9800, "disaster", "https://en.wikipedia.org/wiki/Plague_of_Justinian"),
    ("Hijra: Muhammad migrates to Medina", 622, None, 24.4686, 39.6142, "culture", "https://en.wikipedia.org/wiki/Hijrah"),
    ("House of Wisdom, Baghdad (Islamic Golden Age)", 762, None, 33.3152, 44.3661, "science", "https://en.wikipedia.org/wiki/House_of_Wisdom"),
    ("Coronation of Charlemagne", 800, None, 41.9022, 12.4539, "founding", "https://en.wikipedia.org/wiki/Charlemagne"),
    ("Leif Erikson reaches Vinland (North America)", 1000, None, 51.5959, -55.5316, "exploration", "https://en.wikipedia.org/wiki/Norse_colonization_of_North_America"),
    ("Angkor Wat built", 1113, 1150, 13.4125, 103.8670, "culture", "https://en.wikipedia.org/wiki/Angkor_Wat"),
    ("Norman conquest: Battle of Hastings", 1066, None, 50.9110, 0.4870, "conflict", "https://en.wikipedia.org/wiki/Battle_of_Hastings"),
    ("First Crusade captures Jerusalem", 1096, 1099, 31.7683, 35.2137, "conflict", "https://en.wikipedia.org/wiki/First_Crusade"),
    ("Magna Carta sealed", 1215, None, 51.4440, -0.5620, "culture", "https://en.wikipedia.org/wiki/Magna_Carta"),
    ("Mongol conquests under Genghis Khan", 1206, 1227, 47.9200, 106.9200, "conflict", "https://en.wikipedia.org/wiki/Mongol_conquests"),
    ("Marco Polo's travels to the East", 1271, 1295, 39.9042, 116.4074, "exploration", "https://en.wikipedia.org/wiki/Marco_Polo"),
    ("The Black Death in Europe", 1347, 1351, 43.7696, 11.2558, "disaster", "https://en.wikipedia.org/wiki/Black_Death"),
    ("Founding of Tenochtitlan (Aztec capital)", 1325, None, 19.4326, -99.1332, "founding", "https://en.wikipedia.org/wiki/Tenochtitlan"),
    ("Zheng He's treasure voyages", 1405, 1433, 32.0603, 118.7969, "exploration", "https://en.wikipedia.org/wiki/Ming_treasure_voyages"),
    ("Gutenberg's printing press, Mainz", 1440, None, 49.9987, 8.2734, "science", "https://en.wikipedia.org/wiki/Printing_press"),
    ("Fall of Constantinople", 1453, None, 41.0086, 28.9800, "conflict", "https://en.wikipedia.org/wiki/Fall_of_Constantinople"),
    ("Columbus reaches the Americas", 1492, None, 24.0000, -74.5000, "exploration", "https://en.wikipedia.org/wiki/Voyages_of_Christopher_Columbus"),
    ("Vasco da Gama reaches India by sea", 1498, None, 11.2588, 75.7804, "exploration", "https://en.wikipedia.org/wiki/Vasco_da_Gama"),
    ("Michelangelo paints the Sistine Chapel ceiling", 1508, 1512, 41.9029, 12.4545, "culture", "https://en.wikipedia.org/wiki/Sistine_Chapel_ceiling"),
    ("Luther's Ninety-five Theses (Reformation)", 1517, None, 51.8670, 12.6500, "culture", "https://en.wikipedia.org/wiki/Ninety-five_Theses"),
    ("Magellan-Elcano first circumnavigation", 1519, 1522, 40.3960, -6.0790, "exploration", "https://en.wikipedia.org/wiki/Magellan_expedition"),
    ("Spanish conquest of the Aztec Empire", 1519, 1521, 19.4326, -99.1332, "conflict", "https://en.wikipedia.org/wiki/Spanish_conquest_of_the_Aztec_Empire"),
    ("Copernicus publishes heliocentric model", 1543, None, 54.3667, 18.6167, "science", "https://en.wikipedia.org/wiki/De_revolutionibus_orbium_coelestium"),
    ("Defeat of the Spanish Armada", 1588, None, 50.0000, -1.0000, "conflict", "https://en.wikipedia.org/wiki/Spanish_Armada"),

    # --- Early modern: science, revolutions -------------------------------
    ("Galileo's telescopic astronomy", 1609, None, 45.4064, 11.8768, "science", "https://en.wikipedia.org/wiki/Galileo_Galilei"),
    ("Mayflower lands at Plymouth", 1620, None, 41.9584, -70.6673, "exploration", "https://en.wikipedia.org/wiki/Mayflower"),
    ("Taj Mahal built, Agra", 1632, 1653, 27.1751, 78.0421, "culture", "https://en.wikipedia.org/wiki/Taj_Mahal"),
    ("Newton's Principia Mathematica", 1687, None, 51.5099, -0.1279, "science", "https://en.wikipedia.org/wiki/Philosophi%C3%A6_Naturalis_Principia_Mathematica"),
    ("Industrial Revolution begins", 1760, 1840, 53.4808, -2.2426, "science", "https://en.wikipedia.org/wiki/Industrial_Revolution"),
    ("American Declaration of Independence", 1776, None, 39.9489, -75.1500, "founding", "https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence"),
    ("Watt's improved steam engine patent", 1769, None, 52.4862, -1.8904, "science", "https://en.wikipedia.org/wiki/Watt_steam_engine"),
    ("French Revolution: Storming of the Bastille", 1789, None, 48.8532, 2.3692, "conflict", "https://en.wikipedia.org/wiki/Storming_of_the_Bastille"),
    ("Haitian Revolution", 1791, 1804, 18.5944, -72.3074, "conflict", "https://en.wikipedia.org/wiki/Haitian_Revolution"),
    ("Napoleonic Wars", 1803, 1815, 48.8566, 2.3522, "conflict", "https://en.wikipedia.org/wiki/Napoleonic_Wars"),
    ("Battle of Waterloo", 1815, None, 50.6803, 4.4120, "conflict", "https://en.wikipedia.org/wiki/Battle_of_Waterloo"),
    ("Tambora eruption ('Year Without a Summer')", 1815, None, -8.2500, 118.0000, "disaster", "https://en.wikipedia.org/wiki/1815_eruption_of_Mount_Tambora"),

    # --- 19th century -----------------------------------------------------
    ("First transcontinental railroad completed (US)", 1869, None, 41.6180, -112.5510, "science", "https://en.wikipedia.org/wiki/First_transcontinental_railroad"),
    ("Suez Canal opens", 1869, None, 30.5852, 32.2681, "science", "https://en.wikipedia.org/wiki/Suez_Canal"),
    ("Darwin's On the Origin of Species", 1859, None, 51.5099, -0.1279, "science", "https://en.wikipedia.org/wiki/On_the_Origin_of_Species"),
    ("American Civil War", 1861, 1865, 38.9072, -77.0369, "conflict", "https://en.wikipedia.org/wiki/American_Civil_War"),
    ("Krakatoa eruption", 1883, None, -6.1020, 105.4230, "disaster", "https://en.wikipedia.org/wiki/1883_eruption_of_Krakatoa"),
    ("Statue of Liberty dedicated", 1886, None, 40.6892, -74.0445, "culture", "https://en.wikipedia.org/wiki/Statue_of_Liberty"),
    ("Wright brothers' first powered flight", 1903, None, 36.0186, -75.6674, "science", "https://en.wikipedia.org/wiki/Wright_Flyer"),

    # --- 20th century -----------------------------------------------------
    ("Einstein's theory of general relativity", 1915, None, 52.5200, 13.4050, "science", "https://en.wikipedia.org/wiki/General_relativity"),
    ("RMS Titanic sinks", 1912, None, 41.7260, -49.9480, "disaster", "https://en.wikipedia.org/wiki/Titanic"),
    ("World War I", 1914, 1918, 49.2000, 6.0000, "conflict", "https://en.wikipedia.org/wiki/World_War_I"),
    ("1918 influenza pandemic", 1918, 1920, 39.0000, -98.0000, "disaster", "https://en.wikipedia.org/wiki/Spanish_flu"),
    ("Russian Revolution", 1917, None, 59.9375, 30.3086, "conflict", "https://en.wikipedia.org/wiki/Russian_Revolution"),
    ("Penicillin discovered by Fleming", 1928, None, 51.5170, -0.1730, "science", "https://en.wikipedia.org/wiki/History_of_penicillin"),
    ("Wall Street Crash / Great Depression begins", 1929, None, 40.7069, -74.0113, "disaster", "https://en.wikipedia.org/wiki/Wall_Street_Crash_of_1929"),
    ("World War II", 1939, 1945, 52.2297, 21.0122, "conflict", "https://en.wikipedia.org/wiki/World_War_II"),
    ("Attack on Pearl Harbor", 1941, None, 21.3649, -157.9500, "conflict", "https://en.wikipedia.org/wiki/Attack_on_Pearl_Harbor"),
    ("Battle of Stalingrad", 1942, 1943, 48.7080, 44.5133, "conflict", "https://en.wikipedia.org/wiki/Battle_of_Stalingrad"),
    ("D-Day: Normandy landings", 1944, None, 49.3417, -0.6167, "conflict", "https://en.wikipedia.org/wiki/Normandy_landings"),
    ("Trinity: first nuclear detonation", 1945, None, 33.6773, -106.4754, "science", "https://en.wikipedia.org/wiki/Trinity_(nuclear_test)"),
    ("Atomic bombing of Hiroshima", 1945, None, 34.3853, 132.4553, "conflict", "https://en.wikipedia.org/wiki/Atomic_bombings_of_Hiroshima_and_Nagasaki"),
    ("United Nations founded", 1945, None, 37.7793, -122.4193, "founding", "https://en.wikipedia.org/wiki/United_Nations"),
    ("Indian independence and Partition", 1947, None, 28.6139, 77.2090, "founding", "https://en.wikipedia.org/wiki/Partition_of_India"),
    ("Founding of the People's Republic of China", 1949, None, 39.9055, 116.3976, "founding", "https://en.wikipedia.org/wiki/Proclamation_of_the_People%27s_Republic_of_China"),
    ("Structure of DNA discovered", 1953, None, 52.2043, 0.1218, "science", "https://en.wikipedia.org/wiki/Molecular_structure_of_Nucleic_Acids:_A_Structure_for_Deoxyribose_Nucleic_Acid"),
    ("Sputnik 1: first artificial satellite", 1957, None, 45.9200, 63.3420, "exploration", "https://en.wikipedia.org/wiki/Sputnik_1"),
    ("Yuri Gagarin: first human in space", 1961, None, 45.9200, 63.3420, "exploration", "https://en.wikipedia.org/wiki/Vostok_1"),
    ("Cuban Missile Crisis", 1962, None, 23.0000, -82.0000, "conflict", "https://en.wikipedia.org/wiki/Cuban_Missile_Crisis"),
    ("Apollo 11 Moon landing", 1969, None, 28.5729, -80.6490, "exploration", "https://en.wikipedia.org/wiki/Apollo_11"),
    ("Fall of the Berlin Wall", 1989, None, 52.5163, 13.3777, "culture", "https://en.wikipedia.org/wiki/Fall_of_the_Berlin_Wall"),
    ("World Wide Web invented at CERN", 1989, None, 46.2333, 6.0500, "science", "https://en.wikipedia.org/wiki/World_Wide_Web"),
    ("Dissolution of the Soviet Union", 1991, None, 55.7520, 37.6175, "founding", "https://en.wikipedia.org/wiki/Dissolution_of_the_Soviet_Union"),
    ("End of apartheid; Mandela elected", 1994, None, -25.7461, 28.1881, "culture", "https://en.wikipedia.org/wiki/1994_South_African_general_election"),

    # --- 21st century -----------------------------------------------------
    ("September 11 attacks", 2001, None, 40.7115, -74.0134, "conflict", "https://en.wikipedia.org/wiki/September_11_attacks"),
    ("Human Genome Project completed", 2003, None, 39.0000, -77.1000, "science", "https://en.wikipedia.org/wiki/Human_Genome_Project"),
    ("Indian Ocean earthquake and tsunami", 2004, None, 3.3160, 95.8540, "disaster", "https://en.wikipedia.org/wiki/2004_Indian_Ocean_earthquake_and_tsunami"),
    ("Tohoku earthquake and Fukushima disaster", 2011, None, 38.3220, 142.3690, "disaster", "https://en.wikipedia.org/wiki/2011_T%C5%8Dhoku_earthquake_and_tsunami"),
    ("First image of a black hole (Event Horizon Telescope)", 2019, None, 19.8228, -155.4700, "science", "https://en.wikipedia.org/wiki/Messier_87"),
    ("COVID-19 pandemic", 2020, 2023, 30.5928, 114.3055, "disaster", "https://en.wikipedia.org/wiki/COVID-19_pandemic"),
]


def to_records(rows: list[tuple]) -> list[dict]:
    out = []
    for name, start, end, lat, lon, cat, src in rows:
        rec = {
            "name": name,
            "startYear": start,
            "lat": round(lat, 4),
            "lon": round(lon, 4),
            "category": cat,
            "source": src,
        }
        if end is not None and end != start:
            rec["endYear"] = end
        out.append(rec)
    return out


def validate(records: list[dict]) -> list[str]:
    errors: list[str] = []
    seen = set()
    for i, r in enumerate(records):
        tag = f"[{i}] {r.get('name', '?')!r}"
        name = r.get("name")
        if not isinstance(name, str) or not name.strip():
            errors.append(f"{tag}: missing/empty name")
        start = r.get("startYear")
        if not isinstance(start, int):
            errors.append(f"{tag}: startYear must be int")
            continue
        end = r.get("endYear", start)
        if not isinstance(end, int):
            errors.append(f"{tag}: endYear must be int")
        elif end < start:
            errors.append(f"{tag}: endYear {end} < startYear {start}")
        if start == 0 or end == 0:
            errors.append(f"{tag}: year 0 is invalid (no year zero)")
        lat = r.get("lat")
        lon = r.get("lon")
        if not isinstance(lat, (int, float)) or not (-90 <= lat <= 90):
            errors.append(f"{tag}: lat {lat} out of range [-90, 90]")
        if not isinstance(lon, (int, float)) or not (-180 <= lon <= 180):
            errors.append(f"{tag}: lon {lon} out of range [-180, 180]")
        cat = r.get("category")
        if cat not in VALID_CATEGORIES:
            errors.append(f"{tag}: category {cat!r} not in {sorted(VALID_CATEGORIES)}")
        src = r.get("source")
        if not isinstance(src, str) or not src.startswith("http"):
            errors.append(f"{tag}: source must be an http(s) URL")
        if name in seen:
            errors.append(f"{tag}: duplicate name")
        seen.add(name)
    return errors


def report(records: list[dict]) -> None:
    from collections import Counter

    by_cat = Counter(r["category"] for r in records)
    print(f"  total events: {len(records)}")
    print("  by category: " + ", ".join(f"{k}={v}" for k, v in sorted(by_cat.items())))

    eras = {"BCE": 0, "0-1000": 0, "1000-1800": 0, "1800-1900": 0, "1900-2000": 0, "2000+": 0}
    for r in records:
        y = r["startYear"]
        if y < 0:
            eras["BCE"] += 1
        elif y < 1000:
            eras["0-1000"] += 1
        elif y < 1800:
            eras["1000-1800"] += 1
        elif y < 1900:
            eras["1800-1900"] += 1
        elif y < 2000:
            eras["1900-2000"] += 1
        else:
            eras["2000+"] += 1
    print("  by era: " + ", ".join(f"{k}={v}" for k, v in eras.items()))

    # Confirm both World Wars.
    names = {r["name"] for r in records}
    ww1 = any("World War I" == r["name"] and r["startYear"] == 1914 for r in records)
    ww2 = any("World War II" == r["name"] and r["startYear"] == 1939 for r in records)
    print(f"  World War I (1914-1918) present: {ww1}")
    print(f"  World War II (1939-1945) present: {ww2}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="validate only; do not write")
    args = ap.parse_args()

    records = to_records(EVENTS)
    errors = validate(records)
    if errors:
        print("VALIDATION FAILED:", file=sys.stderr)
        for e in errors:
            print("  " + e, file=sys.stderr)
        sys.exit(1)

    print("Curated events (Wikidata facts CC0; hand-verified):")
    report(records)

    # A couple of hard invariants for the report to be meaningful.
    ww1 = any(r["name"] == "World War I" for r in records)
    ww2 = any(r["name"] == "World War II" for r in records)
    if not (ww1 and ww2):
        print("ERROR: both World Wars are required", file=sys.stderr)
        sys.exit(1)

    if args.check:
        print("  --check: validation passed; not writing.")
        return

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, separators=(",", ":"))
    size = os.path.getsize(OUT_PATH)
    print(f"\nWrote {OUT_PATH}")
    print(f"  events: {len(records)}")
    print(f"  size:   {size} bytes ({size/1024:.1f} KiB)")
    if size > 50_000:
        print("  WARNING: output exceeds 50 KB budget", file=sys.stderr)


if __name__ == "__main__":
    main()
