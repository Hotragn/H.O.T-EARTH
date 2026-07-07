#!/usr/bin/env python3
"""Build a compact lunar diurnal surface-temperature curve JSON.

The honest flagship Moon signal. The Moon has NO atmosphere, so there is no
weather in the Earth/Mars sense. What IS real and dramatic is the enormous
day-night surface-temperature swing: the daytime equatorial surface reaches
~390-400 K at local noon and falls to ~95 K just before dawn -- a swing of
~300 K with nothing to buffer it. The LRO Diviner Lunar Radiometer Experiment
measured this globally.

This script produces a diurnal temperature curve (surface temperature vs local
solar time) for a few latitudes, using the ILLUSTRATIVE-BUT-GROUNDED radiative
model published by the Diviner team, anchored to Diviner's MEASURED day/night
extremes. It is a documented physical model, NOT a live sensor feed and NOT the
raw Diviner archive. It is clearly labeled as such in the output.

Grounding (published Diviner science, public domain data + open-access papers):
  Williams, J.-P., Paige, D.A., Greenhagen, B.T., Sefton-Nash, E. (2017),
    "The global surface temperatures of the Moon as measured by the Diviner
    Lunar Radiometer Experiment", Icarus 283, 300-325,
    doi:10.1016/j.icarus.2016.08.012 (open access).
  Vasavada, A.R., et al. (2012), "Lunar equatorial surface temperatures and
    regolith properties from the Diviner Lunar Radiometer Experiment",
    J. Geophys. Res. 117, E00H18, doi:10.1029/2011JE003987.
  Paige, D.A., et al. (2010), "Diviner Lunar Radiometer Observations of Cold
    Traps in the Moon's South Polar Region", Science 330, 479-482,
    doi:10.1126/science.1187726.
Data archive (public domain, NASA / US Government work, 17 U.S.C. 105):
  LRO Diviner GDR, dataset LRO-L-DLRE-5-GDR-V1.0, NASA PDS Geosciences Node
  (Washington University, St. Louis):
    https://pds-geosciences.wustl.edu/missions/lro/diviner.htm

MODEL (exactly the daytime balance in Williams et al. 2017, Eq. 1):

    T_day(theta_incidence) = [ S (1 - A) cos(i) / (eps * sigma) ] ^ (1/4)

  with, from Williams et al. 2017 / Vasavada et al. 2012:
    S    = 1370 W/m^2   (solar constant at 1 AU; Moon ~= 1 AU)
    eps  = 0.95         (regolith broadband emissivity)
    sigma= 5.670374419e-8 W/m^2/K^4  (Stefan-Boltzmann)
    A(lat) = A0 + a*(lat/45)^3 + b*(lat/90)^8   (albedo rises toward poles)
           A0 = 0.08, a = 0.045, b = 0.14
  and the local solar incidence angle for latitude phi and hour-angle h
  (sub-solar point on the equator, the mean case) is:
    cos(i) = cos(phi) * cos(h),   h = (LST - 12) * 15 deg   (0 at local noon)
  Instantaneous radiative equilibrium has no thermal inertia, so it collapses
  to 0 K at sunset. That is unphysical for the real regolith, which stores heat
  and radiates it through the night. We therefore apply a NIGHT FLOOR taken
  from the Diviner MEASURED nighttime temperatures (a slow pre-dawn cooling from
  the measured post-sunset value to the measured pre-dawn minimum), rather than
  pretending the instantaneous-equilibrium model is valid at night. This makes
  explicit which part is the equilibrium formula (day) and which part is
  anchored to measurements (night). See MOON_PHYSICS.md.

DIVINER MEASURED ANCHORS (Williams et al. 2017), used to sanity-check / bound:
    equatorial noon max   ~= 387-397 K  (average max 392.3 K)
    equatorial pre-dawn   ~= 95 K       (average min 94.3 K)
    equatorial mean       ~= 215.5 K    (~300 K diurnal change)
    polar PSR cold traps  ~= 25-40 K    (Paige 2010; <30 K measured)

Usage:
    python scripts/moon/build_diurnal_temperature.py \
        --out public/data/moon/diurnal_temperature.json

Exit code 0 on success (valid JSON written), non-zero on failure.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import os
import sys

# --- Physical constants (Williams et al. 2017, Eq. 1 and text) --------------
S_SOLAR = 1370.0          # W/m^2, solar constant used by Williams et al. 2017
EPS = 0.95                # regolith broadband emissivity
SIGMA = 5.670374419e-8    # Stefan-Boltzmann constant, W/m^2/K^4
A0, A_A, A_B = 0.08, 0.045, 0.14   # albedo(lat) coefficients (Vasavada 2012)

# --- Diviner MEASURED anchors (Williams et al. 2017) ------------------------
# Used to place the night floor and to validate the model's daytime peak.
EQ_NOON_MAX_K = 392.3     # average equatorial maximum (measured)
EQ_PREDAWN_MIN_K = 95.0   # equatorial pre-dawn minimum (measured, ~94.3)
# Post-sunset starting temperature for the nightside cooling anchor. Diviner
# equatorial night temps fall from ~120 K just after sunset toward ~95 K before
# dawn (Williams 2017 Fig. 18/19; Vasavada 2012). We anchor the dusk value and
# the pre-dawn value from the measured curve and cool between them.
EQ_POSTSUNSET_K = 120.0   # ~just after sunset (measured, equator)


def albedo(lat_deg: float) -> float:
    """Diviner-team latitude-dependent Bond albedo (Vasavada et al. 2012).

    A(lat) = A0 + a*(lat/45)^3 + b*(lat/90)^8, using |lat|.
    """
    x = abs(lat_deg)
    return A0 + A_A * (x / 45.0) ** 3 + A_B * (x / 90.0) ** 8


def day_equilibrium_T(lat_deg: float, lst_hours: float) -> float:
    """Radiative-equilibrium surface temperature for the sunlit side.

    T = [ S (1-A) cos(i) / (eps sigma) ]^(1/4), sub-solar point on the equator.
    Returns None when the Sun is below the local horizon (cos(i) <= 0).
    """
    phi = math.radians(lat_deg)
    h = math.radians((lst_hours - 12.0) * 15.0)   # hour angle, 0 at local noon
    cos_i = math.cos(phi) * math.cos(h)
    if cos_i <= 0.0:
        return None
    A = albedo(lat_deg)
    flux = S_SOLAR * (1.0 - A) * cos_i / (EPS * SIGMA)
    return flux ** 0.25


def night_floor_T(lat_deg: float, lst_hours: float) -> float:
    """Measurement-anchored nightside temperature.

    Instantaneous equilibrium is 0 K at night (no thermal inertia), which is
    unphysical. Instead we interpolate along the MEASURED Diviner nightside:
    a slow radiative cooling from the post-sunset value toward the pre-dawn
    minimum. Nightside runs LST 18->24->06 (sunset to sunrise for a sub-solar
    equator geometry). The pre-dawn minimum and the dusk value both scale with
    latitude toward the polar cold-trap regime.

    This is explicitly the "anchored to Diviner measurements" part of the model
    (see the module docstring and MOON_PHYSICS.md); it is not the equilibrium
    formula.
    """
    # Latitude scaling: nights get colder toward the poles; at high latitude the
    # surface trends to the tens-of-K cold-trap regime. Use the albedo/geometry
    # trend as a mild cooling factor (kept simple and documented, not fit).
    lat_factor = math.cos(math.radians(min(abs(lat_deg), 89.0))) ** 0.25
    dusk = EQ_POSTSUNSET_K * lat_factor
    dawn = EQ_PREDAWN_MIN_K * lat_factor
    # Hours since sunset (18:00). Wrap across midnight so 06:00 == 12 h of night.
    t = lst_hours
    if t < 6.0:            # early morning, still night
        hours_since_sunset = t + 6.0     # 18->24 is 6h, then +t
    else:                  # evening
        hours_since_sunset = t - 18.0
    frac = max(0.0, min(1.0, hours_since_sunset / 12.0))  # 0 at dusk, 1 at dawn
    # Radiative cooling is fast then slow; use a gentle power curve toward dawn.
    return dusk + (dawn - dusk) * (frac ** 0.5)


def surface_T(lat_deg: float, lst_hours: float) -> float:
    """Full diurnal surface temperature: equilibrium by day, anchored floor by night.

    The surface never drops below its heat-retention (night-floor) temperature,
    so near the terminator -- where the instantaneous-equilibrium formula
    collapses toward 0 K -- we take the warmer of (equilibrium, night floor).
    Physically: retained regolith heat holds the surface up as the Sun sets and
    before it rises. This also removes the unphysical 0 K spike exactly at
    sunrise/sunset (hour angle 90 deg).
    """
    floor = night_floor_T(lat_deg, lst_hours)
    day = day_equilibrium_T(lat_deg, lst_hours)
    if day is None:
        return floor
    return max(day, floor)


def build_curve(lat_deg: float, step_hours: float):
    """Sample the diurnal curve at fixed local-solar-time steps (0..24)."""
    n = int(round(24.0 / step_hours))
    curve = []
    for k in range(n + 1):
        lst = round(k * step_hours, 3)
        if lst > 24.0:
            break
        t = surface_T(lat_deg, lst % 24.0)
        curve.append({"lst_h": lst, "T_K": round(t, 1)})
    return curve


def curve_stats(curve):
    temps = [p["T_K"] for p in curve]
    tmax = max(temps)
    tmin = min(temps)
    return {
        "T_max_K": round(tmax, 1),
        "T_min_K": round(tmin, 1),
        "diurnal_swing_K": round(tmax - tmin, 1),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="public/data/moon/diurnal_temperature.json")
    ap.add_argument("--step", type=float, default=0.5,
                    help="local-solar-time step in hours (default 0.5 h)")
    ap.add_argument("--lats", default="0,30,60,85",
                    help="comma-separated latitudes (deg) to sample")
    args = ap.parse_args()

    lats = [float(x) for x in args.lats.split(",")]
    curves = {f"{lat:g}": build_curve(lat, args.step) for lat in lats}
    stats = {f"{lat:g}": curve_stats(curves[f"{lat:g}"]) for lat in lats}

    # Validate the equatorial daytime peak against the Diviner measured anchor
    # (within a few K of ~392 K). Fail loudly if the model has drifted.
    eq_peak = stats["0"]["T_max_K"]
    if not (380.0 <= eq_peak <= 400.0):
        print(f"ERROR: equatorial peak {eq_peak} K outside Diviner-measured "
              f"387-397 K range; model or constants are wrong", file=sys.stderr)
        return 3

    doc = {
        "_comment": (
            "Lunar diurnal surface-temperature curves (surface temperature vs "
            "local solar time) at several latitudes. The Moon has NO atmosphere "
            "and therefore NO weather; the honest, dramatic signal is the day-"
            "night surface-temperature swing of ~300 K. DAYTIME values are the "
            "radiative-equilibrium formula T=[S(1-A)cos(i)/(eps*sigma)]^(1/4) "
            "from Williams et al. 2017 (Diviner), using their published albedo "
            "A(lat)=0.08+0.045*(lat/45)^3+0.14*(lat/90)^8, eps=0.95, S=1370. "
            "NIGHTSIDE values are anchored to Diviner MEASURED equatorial night "
            "temperatures (dusk ~120 K -> pre-dawn ~95 K), scaled by latitude, "
            "because instantaneous equilibrium (no thermal inertia) is 0 K at "
            "night and unphysical. This is an ILLUSTRATIVE-BUT-GROUNDED model, "
            "NOT a live sensor feed and NOT the raw Diviner archive. The "
            "equatorial daytime peak (~392 K) and pre-dawn minimum (~95 K) match "
            "Diviner's measured extremes. See docs/MOON_PHYSICS.md."
        ),
        "model": {
            "type": "radiative-equilibrium (day) + Diviner-anchored night floor",
            "equation_day": "T = [ S (1 - A) cos(i) / (eps * sigma) ]^(1/4)",
            "incidence": "cos(i) = cos(lat) * cos(h), h = (LST - 12) * 15 deg (sub-solar point on equator)",
            "albedo_law": "A(lat) = 0.08 + 0.045*(lat/45)^3 + 0.14*(lat/90)^8",
            "constants": {
                "S_solar_W_m2": S_SOLAR,
                "emissivity": EPS,
                "stefan_boltzmann_W_m2_K4": SIGMA,
                "A0": A0, "a": A_A, "b": A_B,
            },
            "night_anchor": {
                "equator_post_sunset_K": EQ_POSTSUNSET_K,
                "equator_pre_dawn_min_K": EQ_PREDAWN_MIN_K,
                "note": "nightside is anchored to Diviner measurements, not the equilibrium formula",
            },
        },
        "measured_anchors_diviner": {
            "equator_noon_max_K": EQ_NOON_MAX_K,
            "equator_pre_dawn_min_K": EQ_PREDAWN_MIN_K,
            "equator_mean_K": 215.5,
            "equator_diurnal_change_K": 300,
            "polar_psr_cold_trap_K": "25-40 (Paige et al. 2010; <30 K measured)",
        },
        "source": {
            "kind": "physical model anchored to LRO Diviner measurements (not raw archive, not a live feed)",
            "data_archive": {
                "dataset_id": "LRO-L-DLRE-5-GDR-V1.0",
                "name": "LRO Diviner Global Data Record (bolometric temperature, 0.5 deg / 0.25 h local time bins)",
                "provider": "NASA Planetary Data System, Geosciences Node (Washington University, St. Louis)",
                "landing_page": "https://pds-geosciences.wustl.edu/missions/lro/diviner.htm",
                "license": "Public domain (NASA / US Government work, 17 U.S.C. 105)",
            },
            "primary_references": [
                "Williams, J.-P., et al. (2017), The global surface temperatures of the Moon as measured by the Diviner Lunar Radiometer Experiment, Icarus 283, 300-325, doi:10.1016/j.icarus.2016.08.012 (open access).",
                "Vasavada, A.R., et al. (2012), Lunar equatorial surface temperatures and regolith properties from the Diviner Lunar Radiometer Experiment, JGR 117, E00H18, doi:10.1029/2011JE003987.",
                "Paige, D.A., et al. (2010), Diviner Lunar Radiometer Observations of Cold Traps in the Moon's South Polar Region, Science 330, 479-482, doi:10.1126/science.1187726.",
            ],
            "generated_utc": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "verified_date": "2026-07-06",
        },
        "units": {"temperature": "K", "local_solar_time": "hours (0-24, 12 = local noon)", "latitude": "degrees"},
        "assumptions": [
            "Sub-solar point on the equator (mean case; the Moon's obliquity to the ecliptic is only ~1.54 deg, so this is close to always true).",
            "Flat surface, no topographic shadowing; real craters and slopes shift these curves (esp. at the poles).",
            "Nightside is a Diviner-anchored cooling curve, not the equilibrium formula.",
            "One lunar day (sunlit + dark) spans ~29.53 Earth days (a synodic month); LST here is a fraction of that cycle, not Earth hours.",
        ],
        "stats_by_latitude": stats,
        "step_hours": args.step,
        "curves_by_latitude": curves,
    }

    out_path = args.out
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(doc, f, separators=(",", ":"), ensure_ascii=True)
        f.write("\n")

    size = os.path.getsize(out_path)
    print(f"Wrote {out_path} ({size} bytes)")
    for lat in lats:
        s = stats[f"{lat:g}"]
        print(f"  lat {lat:>4g} deg: max {s['T_max_K']:>5} K, "
              f"min {s['T_min_K']:>5} K, swing {s['diurnal_swing_K']:>5} K")
    print(f"  equatorial peak {eq_peak} K vs Diviner-measured ~392 K (OK)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
