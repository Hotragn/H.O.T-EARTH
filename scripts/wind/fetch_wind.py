#!/usr/bin/env python3
"""Fetch the latest GFS 10 m u/v wind field (1.0 deg global) and write compact JSON.

Data source: NOAA/NCEP GFS via the NOAA Open Data Dissemination S3 bucket
(https://noaa-gfs-bdp-pds.s3.amazonaws.com), with the NOMADS grib filter as a
fallback. Both serve GRIB2; a small pure-Python/numpy GRIB2 decoder below
handles the packing templates GFS actually uses (simple packing 5.0, complex
packing 5.2, complex packing with spatial differencing 5.3). No GRIB binaries
or compiled decoders required, so the script runs identically on Windows and
Linux with only `requests` and `numpy`.

NOTE: the NOMADS OPeNDAP/DODS service (https://nomads.ncep.noaa.gov/dods/...)
was retired per NWS Service Change Notice 25-81, which is why this script uses
the GRIB2 byte-range approach instead.

Output schema and coordinate convention: see scripts/wind/README.md.

Usage:
    python fetch_wind.py [--out PATH]

Exit code 0 on success (valid JSON written), non-zero on any failure.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import os
import struct
import sys
import time

import numpy as np
import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

S3_BASE = "https://noaa-gfs-bdp-pds.s3.amazonaws.com"
NOMADS_FILTER = "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl"

USER_AGENT = "hot-earth-wind-pipeline/1.0 (open-source Earth digital twin; GitHub Actions cron)"

# GFS cycles publish roughly 3.5-5 h after cycle time; don't bother trying
# cycles younger than this.
MIN_CYCLE_LAG = dt.timedelta(hours=3, minutes=20)
CYCLE_HOURS = (18, 12, 6, 0)  # newest-first within a day
MAX_LOOKBACK_DAYS = 2

HTTP_TIMEOUT = 60  # seconds per request
HTTP_RETRIES = 3
HTTP_BACKOFF = 3.0  # seconds, exponential

# Expected grid (GFS 1.0 deg native)
NX, NY = 360, 181
EXPECTED_NPTS = NX * NY

# Physical sanity limits
MAX_ABS_COMPONENT = 120.0  # m/s; anything beyond this is garbage
MEAN_SPEED_MIN, MEAN_SPEED_MAX = 1.0, 20.0  # m/s, generous global bounds


class WindFetchError(RuntimeError):
    pass


class NotAvailable(WindFetchError):
    """Requested cycle/object does not exist (yet)."""


# ---------------------------------------------------------------------------
# HTTP with retries
# ---------------------------------------------------------------------------

def http_get(url: str, *, headers: dict | None = None, params: dict | None = None) -> requests.Response:
    """GET with retries + exponential backoff. Raises NotAvailable on 403/404,
    WindFetchError after exhausting retries on other failures."""
    hdrs = {"User-Agent": USER_AGENT}
    if headers:
        hdrs.update(headers)
    last_err: Exception | None = None
    for attempt in range(HTTP_RETRIES):
        try:
            resp = requests.get(url, headers=hdrs, params=params, timeout=HTTP_TIMEOUT)
            if resp.status_code in (403, 404):
                raise NotAvailable(f"HTTP {resp.status_code} for {resp.url}")
            if resp.status_code in (200, 206):
                return resp
            # 429/5xx and anything else unexpected: retry
            last_err = WindFetchError(f"HTTP {resp.status_code} for {resp.url}")
        except NotAvailable:
            raise
        except requests.RequestException as exc:
            last_err = exc
        if attempt < HTTP_RETRIES - 1:
            delay = HTTP_BACKOFF * (2 ** attempt)
            print(f"  retry in {delay:.0f}s ({last_err})", file=sys.stderr)
            time.sleep(delay)
    raise WindFetchError(f"GET failed after {HTTP_RETRIES} attempts: {url} ({last_err})")


# ---------------------------------------------------------------------------
# Minimal GRIB2 decoder (regular lat/lon grid; DRS templates 5.0, 5.2, 5.3)
# ---------------------------------------------------------------------------

def _sign_magnitude(raw: int, nbits: int) -> int:
    """GRIB2 stores negative integers as sign-and-magnitude."""
    sign_bit = 1 << (nbits - 1)
    if raw & sign_bit:
        return -(raw & (sign_bit - 1))
    return raw


def _read_uints(bits: np.ndarray, offset: int, width: int, count: int) -> tuple[np.ndarray, int]:
    """Read `count` unsigned big-endian ints of `width` bits from a 0/1 bit
    array starting at bit `offset`. Returns (values int64, new offset)."""
    if width == 0:
        return np.zeros(count, dtype=np.int64), offset
    end = offset + width * count
    if end > bits.size:
        raise WindFetchError("GRIB2 bitstream overrun (corrupt message?)")
    sl = bits[offset:end].reshape(count, width).astype(np.int64)
    weights = (np.int64(1) << np.arange(width - 1, -1, -1, dtype=np.int64))
    return sl @ weights, end


def _pad_to_byte(offset: int) -> int:
    return (offset + 7) & ~7


def split_grib_messages(blob: bytes) -> list[bytes]:
    """Split a byte blob into individual GRIB2 messages."""
    messages = []
    pos = 0
    while True:
        idx = blob.find(b"GRIB", pos)
        if idx < 0:
            break
        if idx + 16 > len(blob):
            break
        edition = blob[idx + 7]
        if edition != 2:
            raise WindFetchError(f"Unsupported GRIB edition {edition}")
        msg_len = struct.unpack(">Q", blob[idx + 8:idx + 16])[0]
        if idx + msg_len > len(blob):
            raise WindFetchError("Truncated GRIB2 message")
        messages.append(blob[idx:idx + msg_len])
        pos = idx + msg_len
    if not messages:
        raise WindFetchError("No GRIB2 messages found in response")
    return messages


def parse_sections(msg: bytes) -> dict[int, bytes]:
    """Return {section_number: section_bytes} for one GRIB2 message."""
    sections: dict[int, bytes] = {}
    total_len = struct.unpack(">Q", msg[8:16])[0]
    pos = 16
    while pos < total_len - 4:
        if msg[pos:pos + 4] == b"7777":
            break
        sec_len = struct.unpack(">I", msg[pos:pos + 4])[0]
        sec_num = msg[pos + 4]
        sections[sec_num] = msg[pos:pos + sec_len]
        pos += sec_len
    for required in (3, 4, 5, 7):
        if required not in sections:
            raise WindFetchError(f"GRIB2 message missing section {required}")
    return sections


def identify_variable(sec4: bytes) -> tuple[int, int, int, int]:
    """Return (param_category, param_number, level_type, level_value) from
    Product Definition Section (template 4.0 layout for the leading fields)."""
    category = sec4[9]
    number = sec4[10]
    level_type = sec4[22]
    level_scale = _sign_magnitude(sec4[23], 8)
    level_raw = struct.unpack(">I", sec4[24:28])[0]
    level_value = int(level_raw / (10 ** level_scale)) if level_scale >= 0 else int(level_raw * 10 ** (-level_scale))
    return category, number, level_type, level_value


def check_grid(sec3: bytes) -> None:
    """Assert the exact grid layout we document for consumers. Fails loudly on
    anything unexpected rather than silently mis-orienting the field."""
    gdt = struct.unpack(">H", sec3[12:14])[0]
    if gdt != 0:
        raise WindFetchError(f"Unexpected grid definition template {gdt} (want 0 = regular lat/lon)")
    ni = struct.unpack(">I", sec3[30:34])[0]
    nj = struct.unpack(">I", sec3[34:38])[0]
    la1 = _sign_magnitude(struct.unpack(">I", sec3[46:50])[0], 32)
    lo1 = _sign_magnitude(struct.unpack(">I", sec3[50:54])[0], 32)
    di = struct.unpack(">I", sec3[63:67])[0]
    dj = struct.unpack(">I", sec3[67:71])[0]
    scan = sec3[71]
    ok = (
        ni == NX and nj == NY
        and la1 == 90_000_000 and lo1 == 0
        and di == 1_000_000 and dj == 1_000_000
        and scan == 0  # +i (west->east), -j (north->south), i consecutive
    )
    if not ok:
        raise WindFetchError(
            f"Grid mismatch: ni={ni} nj={nj} la1={la1} lo1={lo1} di={di} dj={dj} scan={scan:#04x}; "
            "expected GFS 1.0 deg native (360x181, 90N/0E origin, scan 0). "
            "Update decoder + README together if NCEP changes the grid."
        )


def decode_data(sec5: bytes, sec7: bytes) -> np.ndarray:
    """Decode GRIB2 data section. Supports DRS templates 5.0, 5.2, 5.3 with no
    missing-value management (GFS analysis fields are fully populated)."""
    ndpts = struct.unpack(">I", sec5[5:9])[0]
    drtn = struct.unpack(">H", sec5[9:11])[0]
    if drtn not in (0, 2, 3):
        raise WindFetchError(f"Unsupported data representation template 5.{drtn}")

    ref_value = struct.unpack(">f", sec5[11:15])[0]
    bin_scale = _sign_magnitude(struct.unpack(">H", sec5[15:17])[0], 16)
    dec_scale = _sign_magnitude(struct.unpack(">H", sec5[17:19])[0], 16)
    nbits = sec5[19]

    bits = np.unpackbits(np.frombuffer(sec7[5:], dtype=np.uint8))

    if drtn == 0:
        # Simple packing
        if nbits == 0:
            packed = np.zeros(ndpts, dtype=np.int64)
        else:
            packed, _ = _read_uints(bits, 0, nbits, ndpts)
        field_ints = packed
    else:
        # Complex packing (5.2) / with spatial differencing (5.3)
        missing_mgmt = sec5[22]
        if missing_mgmt != 0:
            raise WindFetchError(f"Missing-value management {missing_mgmt} not supported")
        ngroups = struct.unpack(">I", sec5[31:35])[0]
        width_ref = sec5[35]
        width_bits = sec5[36]
        len_ref = struct.unpack(">I", sec5[37:41])[0]
        len_inc = sec5[41]
        last_len = struct.unpack(">I", sec5[42:46])[0]
        len_bits = sec5[46]

        offset = 0
        spatial_order = 0
        ival1 = ival2 = gmin = 0
        if drtn == 3:
            spatial_order = sec5[47]
            octets = sec5[48]
            if spatial_order not in (1, 2) or octets == 0:
                raise WindFetchError(f"Unsupported spatial differencing (order={spatial_order}, octets={octets})")
            nb = octets * 8
            raws, offset = _read_uints(bits, offset, nb, spatial_order + 1)
            if spatial_order == 1:
                ival1 = _sign_magnitude(int(raws[0]), nb)
                gmin = _sign_magnitude(int(raws[1]), nb)
            else:
                ival1 = _sign_magnitude(int(raws[0]), nb)
                ival2 = _sign_magnitude(int(raws[1]), nb)
                gmin = _sign_magnitude(int(raws[2]), nb)

        grefs, offset = _read_uints(bits, offset, nbits, ngroups)
        offset = _pad_to_byte(offset)
        gwidths, offset = _read_uints(bits, offset, width_bits, ngroups)
        gwidths = gwidths + width_ref
        offset = _pad_to_byte(offset)
        glens, offset = _read_uints(bits, offset, len_bits, ngroups)
        glens = len_ref + glens * len_inc
        glens[-1] = last_len
        offset = _pad_to_byte(offset)

        total = int(glens.sum())
        if total != ndpts:
            raise WindFetchError(f"Group lengths sum {total} != ndpts {ndpts}")

        field_ints = np.empty(ndpts, dtype=np.int64)
        pos = 0
        for g in range(ngroups):
            glen = int(glens[g])
            gwidth = int(gwidths[g])
            if gwidth == 0:
                field_ints[pos:pos + glen] = grefs[g]
            else:
                vals, offset = _read_uints(bits, offset, gwidth, glen)
                field_ints[pos:pos + glen] = vals + grefs[g]
            pos += glen

        if drtn == 3:
            # Undo spatial differencing (integer-exact via cumsum).
            d = field_ints
            if spatial_order == 1:
                inc = d[1:] + gmin
                field_ints = np.concatenate(([ival1], ival1 + np.cumsum(inc)))
            else:
                dd = d[2:] + gmin
                # g[k] = f[k+1] - f[k]; g[0] = ival2 - ival1; g[k] = g[k-1] + dd[k-1]
                gseq = np.concatenate(([ival2 - ival1], dd))
                gcum = np.cumsum(gseq)
                field_ints = np.concatenate(([ival1], ival1 + np.cumsum(gcum)))

    if field_ints.size != ndpts:
        raise WindFetchError(f"Decoded {field_ints.size} values, expected {ndpts}")

    return (ref_value + field_ints.astype(np.float64) * (2.0 ** bin_scale)) / (10.0 ** dec_scale)


def decode_wind_messages(blob: bytes) -> tuple[np.ndarray, np.ndarray]:
    """Extract 10 m UGRD/VGRD fields from a blob of GRIB2 messages."""
    u = v = None
    for msg in split_grib_messages(blob):
        sections = parse_sections(msg)
        category, number, level_type, level_value = identify_variable(sections[4])
        if not (category == 2 and level_type == 103 and level_value == 10):
            continue
        check_grid(sections[3])
        field = decode_data(sections[5], sections[7])
        if number == 2:
            u = field
        elif number == 3:
            v = field
    if u is None or v is None:
        raise WindFetchError("Response did not contain both 10 m UGRD and VGRD records")
    return u, v


# ---------------------------------------------------------------------------
# Data sources
# ---------------------------------------------------------------------------

def candidate_cycles(now: dt.datetime) -> list[dt.datetime]:
    cycles = []
    for day_offset in range(MAX_LOOKBACK_DAYS + 1):
        day = (now - dt.timedelta(days=day_offset)).date()
        for hour in CYCLE_HOURS:
            cyc = dt.datetime(day.year, day.month, day.day, hour, tzinfo=dt.timezone.utc)
            if cyc + MIN_CYCLE_LAG <= now:
                cycles.append(cyc)
    return cycles


def fetch_from_s3(cycle: dt.datetime) -> tuple[np.ndarray, np.ndarray]:
    """Primary path: NOAA Open Data S3 bucket, .idx-guided byte-range requests.
    Downloads only the two ~53 KB wind records, not the full ~34 MB file."""
    ymd = cycle.strftime("%Y%m%d")
    hh = f"{cycle.hour:02d}"
    base = f"{S3_BASE}/gfs.{ymd}/{hh}/atmos/gfs.t{hh}z.pgrb2.1p00.f000"
    idx_text = http_get(base + ".idx").text

    lines = idx_text.splitlines()
    ranges: dict[str, tuple[int, int | None]] = {}
    for i, line in enumerate(lines):
        parts = line.split(":")
        if len(parts) < 6:
            continue
        var, level, fcst = parts[3], parts[4], parts[5]
        if level == "10 m above ground" and fcst == "anl" and var in ("UGRD", "VGRD"):
            start = int(parts[1])
            end: int | None = None
            if i + 1 < len(lines):
                end = int(lines[i + 1].split(":")[1]) - 1
            ranges[var] = (start, end)
    if set(ranges) != {"UGRD", "VGRD"}:
        raise NotAvailable(f"idx for {base} lacks 10 m UGRD/VGRD anl records")

    blob = b""
    for var in ("UGRD", "VGRD"):
        start, end = ranges[var]
        byte_range = f"bytes={start}-" if end is None else f"bytes={start}-{end}"
        blob += http_get(base, headers={"Range": byte_range}).content
    return decode_wind_messages(blob)


def fetch_from_nomads(cycle: dt.datetime) -> tuple[np.ndarray, np.ndarray]:
    """Fallback path: NOMADS grib filter (server-side variable subsetting)."""
    ymd = cycle.strftime("%Y%m%d")
    hh = f"{cycle.hour:02d}"
    params = {
        "dir": f"/gfs.{ymd}/{hh}/atmos",
        "file": f"gfs.t{hh}z.pgrb2.1p00.f000",
        "var_UGRD": "on",
        "var_VGRD": "on",
        "lev_10_m_above_ground": "on",
    }
    resp = http_get(NOMADS_FILTER, params=params)
    content = resp.content
    if b"GRIB" not in content[:1024]:
        raise NotAvailable(f"NOMADS filter returned non-GRIB response for cycle {cycle:%Y-%m-%d %Hz}")
    return decode_wind_messages(content)


def fetch_latest_wind() -> tuple[dt.datetime, str, np.ndarray, np.ndarray]:
    """Try cycles newest-first, S3 then NOMADS for each. Returns
    (cycle, source_name, u, v)."""
    now = dt.datetime.now(dt.timezone.utc)
    errors: list[str] = []
    for cycle in candidate_cycles(now):
        for name, fetcher in (("aws-s3-nodd", fetch_from_s3), ("nomads-grib-filter", fetch_from_nomads)):
            try:
                print(f"Trying GFS cycle {cycle:%Y-%m-%d %H}z via {name} ...")
                u, v = fetcher(cycle)
                print(f"  OK: got {u.size} + {v.size} points")
                return cycle, name, u, v
            except NotAvailable as exc:
                print(f"  not available: {exc}")
                errors.append(f"{cycle:%Y%m%d %Hz} {name}: {exc}")
            except WindFetchError as exc:
                print(f"  failed: {exc}", file=sys.stderr)
                errors.append(f"{cycle:%Y%m%d %Hz} {name}: {exc}")
    raise WindFetchError("No GFS cycle could be fetched. Attempts:\n  " + "\n  ".join(errors))


# ---------------------------------------------------------------------------
# Validation + output
# ---------------------------------------------------------------------------

def validate(u: np.ndarray, v: np.ndarray) -> dict[str, float]:
    if u.size != EXPECTED_NPTS or v.size != EXPECTED_NPTS:
        raise WindFetchError(f"Bad array sizes: u={u.size} v={v.size}, expected {EXPECTED_NPTS}")
    if not (np.all(np.isfinite(u)) and np.all(np.isfinite(v))):
        raise WindFetchError("Non-finite values in decoded wind field")
    max_abs = float(max(np.abs(u).max(), np.abs(v).max()))
    if max_abs >= MAX_ABS_COMPONENT:
        raise WindFetchError(f"Implausible wind component magnitude {max_abs:.1f} m/s (limit {MAX_ABS_COMPONENT})")
    speed = np.sqrt(u * u + v * v)
    mean_speed = float(speed.mean())
    if not (MEAN_SPEED_MIN <= mean_speed <= MEAN_SPEED_MAX):
        raise WindFetchError(f"Implausible global mean wind speed {mean_speed:.2f} m/s")
    # Sanity feature check: Southern Ocean band (65S-45S) should be windier
    # than the global mean. Report only; not a hard failure.
    grid_speed = speed.reshape(NY, NX)
    south_band = grid_speed[135:156, :]  # rows for lat -45 .. -65 (lat = 90 - row)
    stats = {
        "mean_speed": mean_speed,
        "max_speed": float(speed.max()),
        "max_abs_component": max_abs,
        "southern_ocean_mean": float(south_band.mean()),
    }
    return stats


def _fmt(x: float) -> str:
    """Compact 1-decimal JSON number: 3.4, -12.7, 5 (not 5.0), 0 (not -0.0)."""
    s = f"{x:.1f}"
    if s in ("-0.0", "0.0"):
        return "0"
    if s.endswith(".0"):
        s = s[:-2]
    return s


def write_output(path: str, cycle: dt.datetime, source: str, u: np.ndarray, v: np.ndarray) -> int:
    meta = {
        "source": f"NOAA/NCEP GFS 1.0 deg analysis ({source})",
        "cycle": cycle.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "forecast_hour": 0,
        "generated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "resolution": 1.0,
        "units": "m/s",
    }
    header = {
        "meta": meta,
        "nx": NX,
        "ny": NY,
        "lo1": 0,
        "la1": 90,
        "dx": 1,
        "dy": 1,
    }
    head_json = json.dumps(header, separators=(",", ":"))
    u_json = ",".join(_fmt(x) for x in u.tolist())
    v_json = ",".join(_fmt(x) for x in v.tolist())
    doc = f'{head_json[:-1]},"u":[{u_json}],"v":[{v_json}]}}'

    # Fail before writing if the assembly is somehow not valid JSON.
    parsed = json.loads(doc)
    if len(parsed["u"]) != EXPECTED_NPTS or len(parsed["v"]) != EXPECTED_NPTS:
        raise WindFetchError("Serialized JSON has wrong array lengths")

    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="ascii", newline="\n") as fh:
        fh.write(doc)
    os.replace(tmp, path)
    return os.path.getsize(path)


def main(argv: list[str] | None = None) -> int:
    default_out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output", "current.json")
    ap = argparse.ArgumentParser(description="Fetch latest GFS 10m wind field to compact JSON")
    ap.add_argument("--out", default=default_out, help="output JSON path (default: scripts/wind/output/current.json)")
    args = ap.parse_args(argv)

    try:
        cycle, source, u, v = fetch_latest_wind()
        stats = validate(u, v)
        size = write_output(args.out, cycle, source, u, v)
    except WindFetchError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(f"Wrote {args.out} ({size} bytes, {size / 1024:.0f} KB)")
    print(f"  cycle: {cycle:%Y-%m-%d %H}z (analysis, f000) via {source}")
    print(f"  global mean speed: {stats['mean_speed']:.2f} m/s")
    print(f"  max speed: {stats['max_speed']:.1f} m/s, max |component|: {stats['max_abs_component']:.1f} m/s")
    print(f"  Southern Ocean band (45S-65S) mean: {stats['southern_ocean_mean']:.2f} m/s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
