#!/usr/bin/env python3
"""Fetch a committed SNAPSHOT of live space-weather data from NOAA SWPC.

Space weather is the H.O.T project's one genuine forecasting domain: NOAA's
Space Weather Prediction Center (SWPC) issues REAL operational forecasts of
geomagnetic activity and aurora. This pipeline pulls SWPC's public-domain JSON
feeds and writes two committed fallback files:

    public/data/sun/spaceweather.json   -- current-ish conditions snapshot
    public/data/sun/solar_cycle.json    -- monthly sunspot / F10.7 history +
                                           SWPC's predicted Cycle-25 curve

These are a SNAPSHOT. Every SWPC endpoint used here returns
`Access-Control-Allow-Origin: *` (verified live -- see docs/SUN_DATA_SOURCES.md),
so the FRONTEND can and should fetch these feeds LIVE, client-side, directly
from services.swpc.noaa.gov (exactly like Open-Meteo on Earth). The committed
JSON is the offline / first-paint / rate-limit fallback, not the primary path.

Honesty contract (see docs/SUN_PHYSICS.md):
  * MEASURED  -- solar wind (DSCOVR/ACE), planetary Kp, GOES X-ray flux/flares,
                 sunspot number, F10.7 flux. Real instruments.
  * FORECAST  -- OVATION aurora, geomagnetic activity, predicted solar cycle.
                 These are SWPC's OWN forecasts. We VISUALIZE them and attribute
                 them to SWPC. We do NOT make our own space-weather forecasts.
  * COMPUTED  -- aurora activity level and auroral-oval equatorward latitude
                 derived from Kp via documented coarse relations (labeled).

License: all SWPC feeds are U.S. Government work, public domain (17 U.S.C. 105).
The International Sunspot Number (`ssn`) inside SWPC's solar-cycle file
originates from WDC-SILSO (Royal Observatory of Belgium), whose own data FILES
are CC BY-NC 4.0. We therefore use NOAA's OWN sunspot count
(`observed_swpc_ssn`, public domain) as the primary shipped series and only
carry the SILSO-origin ISN as a clearly-attributed reference column taken from
NOAA's public-domain redistribution. See docs/SUN_DATA_SOURCES.md.

Usage:
    pip install requests            # optional; falls back to urllib
    python scripts/sun/fetch_spaceweather.py

    # options
    --outdir public/data/sun        # output directory
    --kp-hours 72                   # how many hours of Kp series to keep
    --cycle-context-since 1976-01   # start month for the historical backdrop

Exit code 0 on success (both JSON files written), non-zero on failure.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import urllib.request

# ---------------------------------------------------------------------------
# SWPC endpoints (all verified HTTP 200 + Access-Control-Allow-Origin: * on
# 2026-07-18 -- see docs/SUN_DATA_SOURCES.md for the CORS verification table).
# ---------------------------------------------------------------------------
BASE = "https://services.swpc.noaa.gov"
EP = {
    # MEASURED
    "solar_wind":  f"{BASE}/products/geospace/propagated-solar-wind-1-hour.json",
    "sw_speed":    f"{BASE}/products/summary/solar-wind-speed.json",
    "sw_mag":      f"{BASE}/products/summary/solar-wind-mag-field.json",
    "kp":          f"{BASE}/products/noaa-planetary-k-index.json",
    "xray":        f"{BASE}/json/goes/primary/xrays-6-hour.json",
    "flares":      f"{BASE}/json/goes/primary/xray-flares-latest.json",
    "cycle_obs":   f"{BASE}/json/solar-cycle/observed-solar-cycle-indices.json",
    # FORECAST (SWPC's own model output)
    "aurora":      f"{BASE}/json/ovation_aurora_latest.json",
    "cycle_pred":  f"{BASE}/json/solar-cycle/predicted-solar-cycle.json",
}

USER_AGENT = "hot-sun-spaceweather-pipeline/1.0 (open-source solar digital twin)"
VERIFIED_DATE = "2026-07-18"


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8", errors="replace"))


def now_utc() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# Derived quantities (COMPUTED -- clearly labeled, documented relations)
# ---------------------------------------------------------------------------
def flux_to_class(flux_wm2: float) -> str:
    """GOES 0.1-0.8 nm long-channel flux (W/m^2) -> NOAA flare class letter.
    A<1e-7, B 1e-7..1e-6, C 1e-6..1e-5, M 1e-5..1e-4, X >=1e-4."""
    if flux_wm2 is None or flux_wm2 <= 0:
        return "A0.0"
    for letter, lo in (("X", 1e-4), ("M", 1e-5), ("C", 1e-6), ("B", 1e-7)):
        if flux_wm2 >= lo:
            return f"{letter}{flux_wm2 / lo:.1f}"
    return f"A{flux_wm2 / 1e-8:.1f}"


def kp_to_aurora_level(kp: float) -> dict:
    """Map planetary Kp to NOAA G-scale storm level + a plain-language activity
    word + a COARSE auroral-oval equatorward geomagnetic latitude.

    G-scale: Kp5=G1 minor, 6=G2 moderate, 7=G3 strong, 8=G4 severe, 9=G5 extreme
    (NOAA SWPC scales, https://www.swpc.noaa.gov/noaa-scales-explanation).

    Oval latitude: a deliberately COARSE linear approximation of the auroral
    oval's equatorward edge, lat ~= 66.5 - 2.0*Kp deg (magnetic). It is a
    rough rule of thumb only -- the real oval boundary depends on MLT, IMF Bz
    and history. Labeled COMPUTED/approximate wherever shown; NOT a forecast."""
    kp = max(0.0, min(9.0, float(kp)))
    g = {5: "G1 (minor storm)", 6: "G2 (moderate storm)", 7: "G3 (strong storm)",
         8: "G4 (severe storm)", 9: "G5 (extreme storm)"}
    kpr = int(round(kp))
    if kpr <= 2:
        word = "quiet"
    elif kpr == 3:
        word = "unsettled"
    elif kpr == 4:
        word = "active"
    else:
        word = g.get(kpr, "storm")
    g_scale = g.get(kpr) if kpr >= 5 else None
    oval_lat = round(66.5 - 2.0 * kp, 1)
    return {
        "kp": round(kp, 2),
        "activity": word,
        "noaa_g_scale": g_scale,
        "computed_oval_equatorward_geomag_lat_deg": oval_lat,
        "_oval_note": ("COMPUTED coarse approximation lat=66.5-2.0*Kp; "
                       "rule-of-thumb only, not a forecast"),
    }


# ---------------------------------------------------------------------------
def build_snapshot(args) -> dict:
    src_used = []

    # --- Solar wind (MEASURED, DSCOVR/ACE propagated to bow shock) -----------
    sw = fetch_json(EP["solar_wind"])
    cols, rows = sw[0], sw[1:]
    last = dict(zip(cols, rows[-1]))
    speed_now = fetch_json(EP["sw_speed"])[0]
    mag_now = fetch_json(EP["sw_mag"])[0]
    src_used += ["solar_wind", "sw_speed", "sw_mag"]
    solar_wind = {
        "category": "MEASURED",
        "instrument": "DSCOVR (primary) / ACE, propagated to Earth's bow shock",
        "source_endpoints": [EP["solar_wind"], EP["sw_speed"], EP["sw_mag"]],
        "time_tag": last["time_tag"],
        "speed_km_s": round(float(last["speed"]), 1),
        "density_p_cm3": round(float(last["density"]), 2),
        "temperature_k": round(float(last["temperature"]), 0),
        "bt_nt": round(float(last["bt"]), 2),
        "bz_gsm_nt": round(float(last["bz"]), 2),
        "summary_proton_speed_km_s": speed_now.get("proton_speed"),
        "summary_bz_gsm_nt": mag_now.get("bz_gsm"),
        "summary_time_tag": speed_now.get("time_tag"),
        "note": ("Real-time solar wind measured at L1 and propagated to the "
                 "bow shock. Southward Bz (negative) couples energy into the "
                 "magnetosphere and drives aurora."),
    }

    # --- Planetary K-index (MEASURED, SWPC estimated 3-hourly) ---------------
    # This endpoint returns a list of record dicts (not the header-array form
    # used by e.g. the solar-wind products), so handle both shapes robustly.
    kp = fetch_json(EP["kp"])
    if kp and isinstance(kp[0], dict):
        krecs = kp
    else:  # header-array fallback: first row is column names
        kcols = kp[0]
        krecs = [dict(zip(kcols, r)) for r in kp[1:]]
    kseries = [{"time_tag": r["time_tag"], "kp": round(float(r["Kp"]), 2)}
               for r in krecs]
    n_keep = max(1, args.kp_hours // 3)
    kseries = kseries[-n_keep:]
    kp_latest = kseries[-1]
    src_used.append("kp")
    planetary_k = {
        "category": "MEASURED",
        "cadence": "3-hourly (SWPC estimated planetary Kp)",
        "source_endpoint": EP["kp"],
        "unit": "Kp (0-9 quasi-logarithmic geomagnetic index)",
        "latest": kp_latest,
        "series": kseries,
        "note": ("Kp is a measured global geomagnetic-activity index. The "
                 "3-day-ahead Kp FORECAST is a separate SWPC product, "
                 "attributed to SWPC when shown."),
    }

    # --- Aurora (FORECAST -- SWPC OVATION Prime model) -----------------------
    aur = fetch_json(EP["aurora"])
    coords = aur.get("coordinates", [])
    max_prob = max((c[2] for c in coords), default=0)
    aurora_level = kp_to_aurora_level(kp_latest["kp"])
    src_used.append("aurora")
    aurora = {
        "category": "FORECAST",
        "attribution": "NOAA SWPC OVATION Prime aurora model (SWPC's forecast)",
        "source_endpoint": EP["aurora"],
        "observation_time": aur.get("Observation Time"),
        "forecast_time": aur.get("Forecast Time"),
        "grid_points": len(coords),
        "max_probability_pct": max_prob,
        "kp_derived_activity": aurora_level,
        "note": ("The OVATION aurora nowcast is SWPC's OWN model output "
                 "(instantaneous probability of visible aurora per grid cell). "
                 "We VISUALIZE it and attribute it to SWPC; we do not forecast "
                 "aurora ourselves. The full ~65k-point grid is fetched LIVE by "
                 "the app; only a summary is committed here. kp_derived_activity "
                 "is COMPUTED from the measured Kp, not from OVATION."),
    }

    # --- GOES X-ray flux + flares (MEASURED) ---------------------------------
    xr = fetch_json(EP["xray"])
    long_rows = [r for r in xr if r.get("energy") == "0.1-0.8nm"]
    xlast = long_rows[-1]
    flares = fetch_json(EP["flares"])
    fl = flares[0] if flares else {}
    src_used += ["xray", "flares"]
    xray = {
        "category": "MEASURED",
        "instrument": "GOES-primary X-Ray Sensor (XRS), 0.1-0.8 nm long channel",
        "source_endpoints": [EP["xray"], EP["flares"]],
        "time_tag": xlast["time_tag"],
        "long_flux_wm2": xlast["flux"],
        "current_class": flux_to_class(xlast["flux"]),
        "reported_current_class": fl.get("current_class"),
        "todays_max_flare_class": fl.get("max_class"),
        "todays_max_flare_time": fl.get("max_time"),
        "note": ("Solar soft X-ray flux; flare class (A/B/C/M/X) is a base-10 "
                 "scale on the 0.1-0.8 nm flux. M/X flares can trigger radio "
                 "blackouts. Real GOES measurement."),
    }

    # --- Sunspot number + F10.7 + solar-cycle context -----------------------
    obs = fetch_json(EP["cycle_obs"])
    latest_month = obs[-1]
    # Primary = NOAA's own count (public domain); ISN = SILSO-origin reference.
    swpc_ssn = latest_month.get("observed_swpc_ssn")
    isn = latest_month.get("ssn")
    f107_month = latest_month.get("f10.7")
    # Best-estimate Cycle-25 smoothed peak so far (smoothing lags ~6 months).
    c25 = [r for r in obs if r["time-tag"] >= "2019-12"]
    smoothed = [(r["time-tag"], r["smoothed_ssn"]) for r in c25
                if isinstance(r.get("smoothed_ssn"), (int, float))
                and r["smoothed_ssn"] > 0]
    peak_month, peak_val = max(smoothed, key=lambda x: x[1]) if smoothed else (None, None)
    src_used.append("cycle_obs")
    sunspot = {
        "category": "MEASURED",
        "month": latest_month["time-tag"],
        "value_swpc": swpc_ssn,
        "value_swpc_source": ("NOAA SWPC monthly sunspot number "
                              "(observed_swpc_ssn) -- U.S. Gov public domain"),
        "value_international_isn": isn,
        "value_isn_source": ("International Sunspot Number v2.0, WDC-SILSO, "
                             "Royal Observatory of Belgium (CC BY-NC 4.0), "
                             "taken here from NOAA's public-domain redistribution"),
        "primary_display_field": "value_swpc",
        "source_endpoint": EP["cycle_obs"],
        "note": ("Two sunspot counts exist: NOAA's own (public domain, used as "
                 "primary) and the international ISN from WDC-SILSO (CC BY-NC). "
                 "We display the public-domain NOAA number."),
    }
    f107 = {
        "category": "MEASURED",
        "month": latest_month["time-tag"],
        "value_sfu": f107_month,
        "unit": "solar flux units (10^-22 W m^-2 Hz^-1) at 10.7 cm / 2800 MHz",
        "source_endpoint": EP["cycle_obs"],
        "note": ("F10.7 (Penticton 10.7 cm radio flux) is a standard proxy for "
                 "solar activity / EUV output. Monthly value shown."),
    }
    solar_cycle_ctx = {
        "category": "MEASURED (observed) + FORECAST (SWPC prediction)",
        "cycle": 25,
        "began": "2019-12 (minimum between Cycle 24 and 25)",
        "observed_smoothed_max_ssn": peak_val,
        "observed_smoothed_max_month": peak_month,
        "phase": ("Declining phase -- near / just after the Cycle-25 maximum "
                  "(~late 2024). Smoothed sunspot number has passed its peak "
                  "and is trending down."),
        "note": ("Cycle-25 amplitude (smoothed SSN peak ~160) ran notably "
                 "higher than the official 2019 SWPC/NOAA-NASA panel consensus "
                 "prediction (~115). Peak month is a best estimate: the "
                 "13-month smoothing lags real time by ~6 months, so the most "
                 "recent months are not yet smoothable."),
    }

    doc = {
        "meta": {
            "_comment": ("SNAPSHOT of NOAA SWPC space-weather data. Space "
                         "weather is a genuine operational forecasting domain "
                         "(SWPC issues real forecasts); this project VISUALIZES "
                         "SWPC's measurements and forecasts and never invents "
                         "its own. All SWPC feeds are U.S. Gov public domain and "
                         "CORS-enabled (Access-Control-Allow-Origin: *), so the "
                         "app fetches them LIVE client-side; this committed file "
                         "is the offline / first-paint / rate-limit fallback."),
            "generated_utc": now_utc(),
            "verification_date": VERIFIED_DATE,
            "provider": "NOAA Space Weather Prediction Center (SWPC)",
            "license": "U.S. Government work, public domain (17 U.S.C. 105)",
            "cors": "Access-Control-Allow-Origin: * on all endpoints (verified)",
            "is_snapshot": True,
            "live_fetch_recommended": True,
            "endpoints": EP,
            "categories": {
                "MEASURED": ["solar_wind", "planetary_k_index", "xray",
                             "sunspot_number", "f10_7"],
                "FORECAST_swpc": ["aurora (OVATION)", "solar_cycle prediction"],
                "COMPUTED": ["aurora activity level + oval latitude from Kp"],
            },
        },
        "solar_wind": solar_wind,
        "planetary_k_index": planetary_k,
        "aurora": aurora,
        "xray": xray,
        "sunspot_number": sunspot,
        "f10_7": f107,
        "solar_cycle": solar_cycle_ctx,
    }
    return doc


def build_solar_cycle(args) -> dict:
    obs = fetch_json(EP["cycle_obs"])
    pred = fetch_json(EP["cycle_pred"])

    def month_ge(tag, lo):
        return tag >= lo

    # Cycle 25 observed monthly (2019-12 onward): primary PD SWPC count.
    c25 = []
    for r in obs:
        if r["time-tag"] >= "2019-12":
            c25.append({
                "month": r["time-tag"],
                "ssn_swpc": r.get("observed_swpc_ssn"),      # PD primary
                "ssn_isn": r.get("ssn"),                     # SILSO-origin ref
                "smoothed_ssn": r.get("smoothed_ssn"),
                "f107": r.get("f10.7"),
            })

    # Historical backdrop (past cycles) -- ISN only exists this far back, so it
    # is flagged SILSO-origin (via NOAA public-domain redistribution).
    context = []
    for r in obs:
        if r["time-tag"] >= args.cycle_context_since:
            context.append({
                "month": r["time-tag"],
                "ssn_isn": r.get("ssn"),
                "smoothed_ssn": r.get("smoothed_ssn"),
            })

    predicted = []
    for r in pred:
        predicted.append({
            "month": r["time-tag"],
            "predicted_ssn": r.get("predicted_ssn"),
            "high_ssn": r.get("high_ssn"),
            "low_ssn": r.get("low_ssn"),
            "predicted_f107": r.get("predicted_f10.7"),
        })

    return {
        "meta": {
            "_comment": ("Monthly sunspot-number and F10.7 history for the "
                         "solar-cycle chart, plus SWPC's predicted Cycle-25 "
                         "curve. Cycle-25 observed series uses NOAA's OWN "
                         "sunspot count (ssn_swpc, public domain) as primary; "
                         "ssn_isn is the International Sunspot Number (WDC-SILSO, "
                         "CC BY-NC 4.0) carried from NOAA's public-domain "
                         "redistribution as a reference column. Historical "
                         "backdrop before ~2008 has ISN only (SILSO-origin, "
                         "flagged). The predicted curve is SWPC's FORECAST."),
            "generated_utc": now_utc(),
            "verification_date": VERIFIED_DATE,
            "provider": "NOAA SWPC (public domain); ISN column via WDC-SILSO",
            "observed_endpoint": EP["cycle_obs"],
            "predicted_endpoint": EP["cycle_pred"],
            "primary_observed_field": "ssn_swpc",
            "unit_ssn": "monthly mean sunspot number",
            "unit_f107": "solar flux units (sfu)",
        },
        "cycle25_observed": c25,
        "cycle25_predicted": predicted,
        "context_monthly_isn": context,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--outdir", default="public/data/sun")
    ap.add_argument("--kp-hours", type=int, default=72,
                    help="hours of 3-hourly Kp series to keep in the snapshot")
    ap.add_argument("--cycle-context-since", default="1976-01",
                    help="start month (YYYY-MM) for the historical SSN backdrop")
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    try:
        snap = build_snapshot(args)
    except Exception as e:  # noqa: BLE001
        print(f"ERROR building spaceweather snapshot: {e}", file=sys.stderr)
        return 2
    try:
        cyc = build_solar_cycle(args)
    except Exception as e:  # noqa: BLE001
        print(f"ERROR building solar cycle file: {e}", file=sys.stderr)
        return 3

    sw_path = os.path.join(args.outdir, "spaceweather.json")
    cy_path = os.path.join(args.outdir, "solar_cycle.json")
    for path, doc in ((sw_path, snap), (cy_path, cyc)):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
            f.write("\n")
        print(f"Wrote {path} ({os.path.getsize(path)} bytes)")

    sw = snap["solar_wind"]; kp = snap["planetary_k_index"]["latest"]
    xr = snap["xray"]; ss = snap["sunspot_number"]
    print(f"  solar wind : {sw['speed_km_s']} km/s, "
          f"{sw['density_p_cm3']} p/cm3, Bz {sw['bz_gsm_nt']} nT "
          f"@ {sw['time_tag']}")
    print(f"  Kp latest  : {kp['kp']} @ {kp['time_tag']}")
    print(f"  X-ray      : {xr['current_class']} (long flux "
          f"{xr['long_flux_wm2']:.2e} W/m2); today's max flare "
          f"{xr['todays_max_flare_class']}")
    print(f"  sunspot    : SWPC {ss['value_swpc']} / ISN "
          f"{ss['value_international_isn']} ({ss['month']})")
    print(f"  F10.7      : {snap['f10_7']['value_sfu']} sfu "
          f"({snap['f10_7']['month']})")
    print(f"  cycle 25   : smoothed peak ~{snap['solar_cycle']['observed_smoothed_max_ssn']} "
          f"@ {snap['solar_cycle']['observed_smoothed_max_month']} (declining)")
    print(f"  cycle file : {len(cyc['cycle25_observed'])} obs months, "
          f"{len(cyc['cycle25_predicted'])} predicted, "
          f"{len(cyc['context_monthly_isn'])} context months")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
