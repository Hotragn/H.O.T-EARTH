"""One-off builder for public/data/cities.json (Living Earth city layer).

Source: Natural Earth 1:10m Populated Places (simple attribute set)
    https://naciscdn.org/naturalearth/10m/cultural/ne_10m_populated_places_simple.zip

License: Natural Earth is PUBLIC DOMAIN. From the official terms of use
(https://www.naturalearthdata.com/about/terms-of-use/, verified 2026-07-06
in docs/DATA_SOURCES.md): "All versions of Natural Earth raster + vector map
data found on this website are in the public domain." No permission or credit
required; the derived JSON may be committed to this repo.

Output: the ~1,200 most populous places by POP_MAX, as compact arrays
    { meta: {...}, cities: [[name, country, lat, lon, pop], ...] }
with coordinates rounded to 2 decimals to keep the file well under 150 KB.
Country comes from ADM0NAME, falling back to SOV0NAME.

Usage (run once, commit the output):
    pip install pyshp
    python tools/build_cities.py
"""

from __future__ import annotations

import io
import json
import urllib.request
import zipfile
from datetime import date, datetime
from pathlib import Path

import shapefile  # pyshp

URL = (
    "https://naciscdn.org/naturalearth/10m/cultural/"
    "ne_10m_populated_places_simple.zip"
)
CITY_COUNT = 1200
OUT = Path(__file__).resolve().parents[1] / "public" / "data" / "cities.json"


def main() -> None:
    print(f"downloading {URL} ...")
    req = urllib.request.Request(URL, headers={"User-Agent": "hot-earth-tools"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        blob = resp.read()
    print(f"  {len(blob):,} bytes")

    zf = zipfile.ZipFile(io.BytesIO(blob))
    names = zf.namelist()
    shp = next(n for n in names if n.endswith(".shp"))
    dbf = next(n for n in names if n.endswith(".dbf"))
    shx = next(n for n in names if n.endswith(".shx"))

    reader = shapefile.Reader(
        shp=io.BytesIO(zf.read(shp)),
        dbf=io.BytesIO(zf.read(dbf)),
        shx=io.BytesIO(zf.read(shx)),
    )
    fields = [f[0] for f in reader.fields[1:]]  # skip DeletionFlag
    idx = {name.lower(): i for i, name in enumerate(fields)}
    print(f"  {reader.numRecords} records, fields include: "
          f"{[f for f in fields if f.lower() in ('name', 'adm0name', 'sov0name', 'pop_max', 'latitude', 'longitude')]}")

    rows = []
    for sr in reader.iterShapeRecords():
        rec = sr.record
        pop = rec[idx["pop_max"]]
        if not isinstance(pop, (int, float)) or pop <= 0:
            continue
        name = str(rec[idx["name"]]).strip()
        country = str(rec[idx.get("adm0name", idx["sov0name"])]).strip() or str(
            rec[idx["sov0name"]]
        ).strip()
        # Prefer the attribute lat/lon (matches the label point); fall back to
        # the shape geometry.
        if "latitude" in idx and "longitude" in idx:
            lat, lon = rec[idx["latitude"]], rec[idx["longitude"]]
        else:
            lon, lat = sr.shape.points[0]
        rows.append((name, country, round(float(lat), 2), round(float(lon), 2), int(pop)))

    rows.sort(key=lambda r: r[4], reverse=True)
    rows = rows[:CITY_COUNT]
    print(f"  kept {len(rows)} cities; smallest pop {rows[-1][4]:,}, largest {rows[0][4]:,}")

    payload = {
        "meta": {
            "source": "Natural Earth 1:10m Populated Places Simple (public domain)",
            "url": URL,
            "license": "Public domain (naturalearthdata.com/about/terms-of-use)",
            "generated": date.today().isoformat(),
            "count": len(rows),
            "fields": ["name", "country", "lat", "lon", "pop_max"],
        },
        "cities": [list(r) for r in rows],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(text, encoding="utf-8", newline="\n")
    print(f"wrote {OUT} ({len(text.encode('utf-8')):,} bytes)")


if __name__ == "__main__":
    start = datetime.now()
    main()
    print(f"done in {(datetime.now() - start).total_seconds():.1f}s")
