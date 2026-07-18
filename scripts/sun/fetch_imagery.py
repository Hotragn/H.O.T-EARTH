#!/usr/bin/env python3
"""Fetch representative NASA SDO full-disk Sun images into public/textures/sun/.

Source: NASA Solar Dynamics Observatory (SDO) "latest images" service,
    https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_{CHANNEL}.jpg
NASA/SDO imagery is public domain (NASA media usage guidelines: NASA content
is generally not subject to copyright in the U.S.). Credit "NASA/SDO and the
AIA, EVE, and HMI science teams." See docs/SUN_DATA_SOURCES.md.

Channels fetched (the classic public set):
    aia171  -> AIA 171 A   Fe IX,  ~600,000 K  quiet corona / coronal loops
    aia193  -> AIA 193 A   Fe XII, ~1.2 MK      corona + hot flare plasma; coronal holes
    aia211  -> AIA 211 A   Fe XIV, ~2 MK        active-region corona
    aia304  -> AIA 304 A   He II,  ~50,000 K     chromosphere / transition region; prominences
    hmi_continuum   -> HMIIC  visible photosphere (sunspots)
    hmi_magnetogram -> HMIB   line-of-sight photospheric magnetic field

HONESTY NOTE (critical, carried into the app): these are full-disk SQUARE
images of the Sun's Earth-facing hemisphere -- the real solar DISK -- NOT
equirectangular 2:1 maps like the planet basemaps. The frontend must show them
as the observed disk (or map them onto a sphere ONLY with an explicit
"approximate -- disk image, not a surface map" label). AIA channels are false-
color by wavelength (the Sun does not look green/teal/gold; those are channel
palettes). Do not present them as true-color surface textures.

The 1024 px source images are already ~130-400 KB each (< 1 MB), so no
downsampling is required; --max-px re-samples only if a larger source is used.
Each file is verified: JPEG magic bytes (FF D8 FF) + Pillow decode + real
non-degenerate pixel content.

Usage:
    pip install pillow requests    # requests optional (urllib fallback)
    python scripts/sun/fetch_imagery.py --outdir public/textures/sun
    python scripts/sun/fetch_imagery.py --res 2048   # higher-res source

Exit code 0 on success (all channels written + verified), non-zero otherwise.
"""

from __future__ import annotations

import argparse
import datetime as dt
import io
import json
import os
import sys
import urllib.request

from PIL import Image

BASE = "https://sdo.gsfc.nasa.gov/assets/img/latest"
USER_AGENT = "hot-sun-imagery-pipeline/1.0 (open-source solar digital twin)"

# out-filename -> SDO channel token
CHANNELS = {
    "aia171": "0171",
    "aia193": "0193",
    "aia211": "0211",
    "aia304": "0304",
    "hmi_continuum": "HMIIC",
    "hmi_magnetogram": "HMIB",
}


def fetch(url: str):
    """Return (bytes, last_modified_header)."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read(), r.headers.get("Last-Modified")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--outdir", default="public/textures/sun")
    ap.add_argument("--res", type=int, default=1024,
                    help="SDO source resolution token (512/1024/2048/4096)")
    ap.add_argument("--max-px", type=int, default=1024,
                    help="downsample longest side to this if larger")
    ap.add_argument("--quality", type=int, default=85)
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)
    manifest = []
    ok = True

    for name, token in CHANNELS.items():
        url = f"{BASE}/latest_{args.res}_{token}.jpg"
        try:
            raw, last_mod = fetch(url)
        except Exception as e:  # noqa: BLE001
            print(f"ERROR fetching {name} <{url}>: {e}", file=sys.stderr)
            ok = False
            continue

        # Verify JPEG magic bytes.
        if raw[:3] != b"\xff\xd8\xff":
            print(f"ERROR {name}: not a JPEG (magic {raw[:3]!r})", file=sys.stderr)
            ok = False
            continue

        # Decode + sanity-check with Pillow.
        try:
            img = Image.open(io.BytesIO(raw))
            img.load()
        except Exception as e:  # noqa: BLE001
            print(f"ERROR {name}: Pillow could not decode: {e}", file=sys.stderr)
            ok = False
            continue

        w, h = img.size
        extrema = img.convert("L").getextrema()
        if extrema[0] == extrema[1]:
            print(f"ERROR {name}: degenerate (flat) image {extrema}", file=sys.stderr)
            ok = False
            continue

        # Downsample only if larger than the target.
        if max(w, h) > args.max_px:
            scale = args.max_px / max(w, h)
            img = img.convert("RGB").resize(
                (round(w * scale), round(h * scale)), Image.LANCZOS)

        out_path = os.path.join(args.outdir, f"{name}.jpg")
        img.convert("RGB").save(out_path, "JPEG", quality=args.quality,
                                optimize=True)
        size = os.path.getsize(out_path)
        rec = {
            "channel": name,
            "sdo_token": token,
            "source_url": url,
            "observation_time": last_mod,
            "dimensions": f"{img.size[0]}x{img.size[1]}",
            "bytes": size,
        }
        manifest.append(rec)
        print(f"  {name:16s} {img.size[0]}x{img.size[1]:<5d} {size:>7d} B  "
              f"obs {last_mod}")
        if size > 1_000_000:
            print(f"    WARN {name} exceeds 1 MB", file=sys.stderr)

    # Write a small provenance manifest alongside the textures.
    meta = {
        "_comment": ("NASA SDO full-disk Sun images (public domain). These are "
                     "SQUARE disk images of the Sun's Earth-facing side, NOT "
                     "equirectangular maps. AIA channels are false-color by "
                     "wavelength. Credit: NASA/SDO and the AIA/EVE/HMI science "
                     "teams. Fetched from the SDO 'latest images' service; each "
                     "image is a real observation timestamped by Last-Modified."),
        "provider": "NASA Solar Dynamics Observatory (SDO)",
        "license": "Public domain (NASA media usage guidelines)",
        "credit": "NASA/SDO and the AIA, EVE, and HMI science teams",
        "fetched_utc": dt.datetime.now(dt.timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%SZ"),
        "source_service": f"{BASE}/latest_{args.res}_{{CHANNEL}}.jpg",
        "cors": ("SDO images send NO Access-Control-Allow-Origin header "
                 "(verified) -- cross-origin WebGL textures would be tainted, "
                 "so images are COMMITTED here rather than fetched live."),
        "images": manifest,
    }
    meta_path = os.path.join(args.outdir, "manifest.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
        f.write("\n")
    print(f"Wrote {meta_path} ({len(manifest)} images)")

    return 0 if ok and len(manifest) == len(CHANNELS) else 1


if __name__ == "__main__":
    raise SystemExit(main())
