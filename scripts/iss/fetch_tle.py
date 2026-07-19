#!/usr/bin/env python3
"""Mirror the current ISS (and a couple of notable stations') TLE from CelesTrak.

The "ISS Tracker" tab shows where the ISS is *right now* by propagating real
orbital elements (a Two-Line Element set / TLE) with SGP4 in the browser (the
SGP4 library lives in lib/, handled by another agent). This script fetches the
freshest TLE for the ISS from CelesTrak and writes it as a small committed JSON
file that the app reads. It is the polite, cached, first-paint source: one
machine (a GitHub Actions cron) hits CelesTrak, and every app user reads the
committed file from the CDN instead of hammering CelesTrak.

Source: CelesTrak GP (General Perturbations) data, the canonical free TLE
service maintained by Dr. T.S. Kelso. The orbital elements originate from the
US Space Force / 18th Space Defense Squadron (18 SDS) via Space-Track, and are
US Government work (public domain). CelesTrak imposes no license fee or
attribution condition; its binding rule is the Usage Policy
(https://celestrak.org/usage-policy.php): GP data updates once every ~2 hours,
so fetch at most once per update, cache, and never poll in a tight loop. A
mirror refreshed once or twice a day is well within that etiquette.

  ISS is NORAD catalog number 25544, object name "ISS (ZARYA)".
  Endpoint: https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE

CORS note: as of 2026-07-18/19 CelesTrak's gp.php DOES send
`Access-Control-Allow-Origin: *` (verified live; see docs/ISS_DATA_SOURCES.md),
so the app *could* fetch it directly from the browser. We still commit a mirror
because (a) CelesTrak explicitly asks large user bases to cache/proxy rather
than have every client query it, and (b) it gives offline / first-paint /
rate-limit resilience. The app may additionally live-refresh from CelesTrak.

TLE-age accuracy: SGP4 on a fresh TLE is good to ~1 km near epoch and degrades
by roughly 1-3 km/day; a week-old TLE can be off by tens of km. The frontend
must therefore surface the TLE epoch/age. This script records the epoch so the
UI can compute and display the age.

Standard library only (urllib) -- no third-party deps, runs identically on
Windows and Linux. Re-runnable; writes atomically via a temp file.

Usage:
    python scripts/iss/fetch_tle.py [--out public/data/iss/tle.json]
                                    [--no-others]

Exit code 0 on success (valid JSON written), non-zero on any failure.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.request

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

GP_URL = "https://celestrak.org/NORAD/elements/gp.php"  # ?CATNR=..&FORMAT=TLE
USAGE_POLICY_URL = "https://celestrak.org/usage-policy.php"

ISS_CATNR = 25544  # ISS (ZARYA) -- the focus of the tab

# Optional extra stations/telescopes, fetched into meta["others"] if available.
# ISS is the focus; these are a nice cross-check for the ground-track view.
OTHERS = [
    (20580, "Hubble Space Telescope"),   # HST
    (48274, "CSS / Tiangong (Tianhe)"),  # Chinese Space Station core module
]

USER_AGENT = (
    "hot-earth-iss-tle-pipeline/1.0 "
    "(open-source Earth digital twin; GitHub Actions cron; contact via repo)"
)

# CelesTrak asks callers to be gentle. We make at most a handful of requests
# once or twice a day; a small pause between them is courteous.
INTER_REQUEST_PAUSE = 2.0  # seconds
HTTP_TIMEOUT = 60          # seconds
HTTP_RETRIES = 3
HTTP_BACKOFF = 4.0         # seconds, exponential

ATTRIBUTION = "Orbital data: US Space Force (18 SDS) via CelesTrak (celestrak.org)"


class TLEFetchError(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

def http_get_text(url: str) -> str:
    """GET text with retries + exponential backoff.

    CelesTrak's usage policy says machine-to-machine software should STOP on any
    non-200 response (301/403/404/50x are signals of a bad URL or rate limiting
    and can get an IP firewalled). So we do NOT retry 4xx here -- we fail loudly.
    Only transient network errors and 5xx get a couple of polite retries.
    """
    last_err: Exception | None = None
    for attempt in range(HTTP_RETRIES):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
                if resp.status == 200:
                    return resp.read().decode("utf-8", errors="replace")
                # Non-200 with a body (rare via urlopen): treat as fatal.
                raise TLEFetchError(f"HTTP {resp.status} for {url}")
        except urllib.error.HTTPError as exc:
            # Per CelesTrak policy: do not hammer on 3xx/4xx. Retry only on 5xx.
            if 500 <= exc.code < 600 and attempt < HTTP_RETRIES - 1:
                last_err = exc
            else:
                raise TLEFetchError(
                    f"HTTP {exc.code} for {url} "
                    f"(CelesTrak usage policy: stop on non-200 -- check the URL "
                    f"and back off; see {USAGE_POLICY_URL})"
                ) from exc
        except (urllib.error.URLError, TimeoutError) as exc:
            last_err = exc
        if attempt < HTTP_RETRIES - 1:
            delay = HTTP_BACKOFF * (2 ** attempt)
            print(f"  retry in {delay:.0f}s ({last_err})", file=sys.stderr)
            time.sleep(delay)
    raise TLEFetchError(f"GET failed after {HTTP_RETRIES} attempts: {url} ({last_err})")


# ---------------------------------------------------------------------------
# TLE parsing + validation
# ---------------------------------------------------------------------------

def tle_checksum(line: str) -> int:
    """Standard TLE mod-10 checksum: sum of digits, each '-' counts as 1,
    everything else 0; result mod 10. The final char of lines 1 and 2 is this
    checksum, so we can verify the lines were not corrupted in transit."""
    total = 0
    for ch in line[:68]:
        if ch.isdigit():
            total += int(ch)
        elif ch == "-":
            total += 1
    return total % 10


def parse_tle_epoch(line1: str) -> str:
    """Extract the epoch from TLE line 1 (columns 19-32: YYDDD.DDDDDDDD) and
    return an ISO-8601 UTC string. YY 57-99 -> 19xx, 00-56 -> 20xx (the standard
    TLE two-digit-year convention)."""
    yy = int(line1[18:20])
    doy = float(line1[20:32])
    year = 1900 + yy if yy >= 57 else 2000 + yy
    # Day-of-year is 1-based; the fractional part is the fraction of a day.
    epoch = dt.datetime(year, 1, 1, tzinfo=dt.timezone.utc) + dt.timedelta(days=doy - 1.0)
    # Round to whole seconds for a clean display value.
    epoch = epoch.replace(microsecond=0) + dt.timedelta(
        seconds=round(epoch.microsecond / 1e6)
    )
    return epoch.strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_and_validate(raw: str, expected_catnr: int) -> dict:
    """Parse a 3-line TLE response from CelesTrak and validate it hard.

    Returns {name, line1, line2, epoch}. Raises TLEFetchError on anything that
    does not look like a genuine TLE for the requested catalog number -- SGP4 is
    only as trustworthy as its input, so we refuse to write garbage."""
    # CelesTrak occasionally returns an error string ("No GP data found", an
    # HTML error page, etc.) with HTTP 200. Guard against that.
    lines = [ln.rstrip() for ln in raw.strip().splitlines() if ln.strip()]
    if len(lines) < 3:
        raise TLEFetchError(
            f"Expected a 3-line TLE, got {len(lines)} line(s): {raw[:120]!r}"
        )
    name, line1, line2 = lines[0].strip(), lines[1], lines[2]

    if not (line1.startswith("1 ") and line2.startswith("2 ")):
        raise TLEFetchError(f"Lines are not TLE line 1/2: {line1[:20]!r} / {line2[:20]!r}")

    catnr1 = line1[2:7].strip()
    catnr2 = line2[2:7].strip()
    if catnr1 != str(expected_catnr) or catnr2 != str(expected_catnr):
        raise TLEFetchError(
            f"Catalog number mismatch: line1={catnr1} line2={catnr2}, "
            f"expected {expected_catnr}"
        )

    for n, line in ((1, line1), (2, line2)):
        if len(line) < 69:
            raise TLEFetchError(f"TLE line {n} too short ({len(line)} chars): {line!r}")
        want = tle_checksum(line)
        got = int(line[68])
        if want != got:
            raise TLEFetchError(
                f"TLE line {n} checksum mismatch (computed {want}, line says {got}) "
                f"-- data may be corrupted: {line!r}"
            )

    epoch = parse_tle_epoch(line1)
    return {"name": name, "line1": line1, "line2": line2, "epoch": epoch}


def fetch_tle(catnr: int) -> dict:
    """Fetch one satellite's TLE from CelesTrak GP by catalog number."""
    url = f"{GP_URL}?CATNR={catnr}&FORMAT=TLE"
    raw = http_get_text(url)
    parsed = parse_and_validate(raw, catnr)
    parsed["source_url"] = url
    return parsed


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def now_utc() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def build_doc(iss: dict, others: list[dict]) -> dict:
    doc = {
        "meta": {
            "source": "CelesTrak GP (General Perturbations orbital element sets)",
            "source_url": iss["source_url"],
            "catalog_number": ISS_CATNR,
            "name": iss["name"],
            "fetched_at": now_utc(),
            "epoch": iss["epoch"],
            "tle_line0": iss["name"],
            "underlying_data": (
                "US Space Force / 18th Space Defense Squadron (18 SDS), obtained "
                "via Space-Track and redistributed by CelesTrak"
            ),
            "license": (
                "Underlying orbital data is US Government work, public domain "
                "(17 U.S.C. 105). CelesTrak imposes no license fee or attribution "
                "requirement; the binding condition is its Usage Policy (rate "
                "limits + caching)."
            ),
            "attribution": ATTRIBUTION,
            "usage_policy": USAGE_POLICY_URL,
            "usage_policy_note": (
                "CelesTrak checks for new GP data once every ~2 hours; fetch at "
                "most once per update. This file is a cron mirror so all app "
                "users read one cached copy instead of querying CelesTrak."
            ),
            "cors": "Access-Control-Allow-Origin: * (verified live 2026-07-18/19)",
            "is_snapshot": True,
            "note": (
                "Committed TLE mirror refreshed twice daily by a GitHub Action. "
                "SGP4 (client-side) propagates tle.line1/line2 verbatim to a live "
                "position + ground track. Accuracy is ~1 km near epoch and "
                "degrades ~1-3 km/day; a week-old TLE can be tens of km off, so "
                "the tab must display the TLE epoch/age."
            ),
        },
        "tle": {
            "name": iss["name"],
            "line1": iss["line1"],
            "line2": iss["line2"],
        },
    }
    if others:
        doc["others"] = [
            {
                "catalog_number": o["catalog_number"],
                "name": o["name"],
                "epoch": o["epoch"],
                "source_url": o["source_url"],
                "tle": {"name": o["name"], "line1": o["line1"], "line2": o["line2"]},
            }
            for o in others
        ]
    return doc


def write_json(path: str, doc: dict) -> int:
    # Round-trip through the parser before touching disk: never write a file we
    # cannot read back.
    text = json.dumps(doc, indent=2, ensure_ascii=True)
    json.loads(text)
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)
        fh.write("\n")
    os.replace(tmp, path)
    return os.path.getsize(path)


def main(argv: list[str] | None = None) -> int:
    default_out = os.path.join("public", "data", "iss", "tle.json")
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--out", default=default_out,
                    help="output JSON path (default: public/data/iss/tle.json)")
    ap.add_argument("--no-others", action="store_true",
                    help="fetch only the ISS, skip Hubble/CSS")
    args = ap.parse_args(argv)

    try:
        print(f"Fetching ISS ({ISS_CATNR}) TLE from CelesTrak ...")
        iss = fetch_tle(ISS_CATNR)
        print(f"  OK: {iss['name']} epoch {iss['epoch']}")

        others: list[dict] = []
        if not args.no_others:
            for catnr, label in OTHERS:
                time.sleep(INTER_REQUEST_PAUSE)  # be polite to CelesTrak
                try:
                    print(f"Fetching {label} ({catnr}) TLE ...")
                    o = fetch_tle(catnr)
                    o["catalog_number"] = catnr
                    # Prefer the requested label but keep CelesTrak's real name too.
                    o["name"] = o["name"] or label
                    others.append(o)
                    print(f"  OK: {o['name']} epoch {o['epoch']}")
                except TLEFetchError as exc:
                    # Others are optional -- a failure here must not sink the ISS.
                    print(f"  skipped {label} ({catnr}): {exc}", file=sys.stderr)

        doc = build_doc(iss, others)
        size = write_json(args.out, doc)
    except TLEFetchError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(f"Wrote {args.out} ({size} bytes, {size / 1024:.1f} KB)")
    print(f"  ISS epoch: {iss['epoch']}  (line1: {iss['line1']})")
    if others:
        print(f"  others: {', '.join(f'{o['name']} @ {o['epoch']}' for o in others)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
