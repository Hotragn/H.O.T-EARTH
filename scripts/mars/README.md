# Mars data pipeline

Builds compact, honest Mars climatology JSON artifacts for the Phase 2 globe,
from free, public-domain / clearly-licensed sources. See
[`docs/MARS_DATA_SOURCES.md`](../../docs/MARS_DATA_SOURCES.md) and
[`docs/MARS_PHYSICS.md`](../../docs/MARS_PHYSICS.md) for the full source,
license, and methodology record.

## `build_pressure_climatology.py` — seasonal CO2 pressure cycle (flagship)

Produces [`public/data/mars/seasonal_pressure.json`](../../public/data/mars/seasonal_pressure.json):
the Mars seasonal surface-pressure cycle binned by areocentric solar longitude
(Ls), derived from **real in-situ Viking Lander measurements**. This is the
flagship honest Mars-weather signal — each Martian winter ~25-30% of the
atmosphere freezes onto the winter polar cap as CO2 ice and sublimates back
later, producing a large, repeatable annual swing in surface pressure.
Measured data, not a model.

### Data source and licensing
- **Dataset:** `VL1/VL2-M-MET-4-DAILY-AVG-PRESSURE-V1.0` (Viking Meteorology
  Instrument System, Viking Landers 1 & 2, 1976-1982).
- **Provider:** NASA Planetary Data System, Atmospheres Node (NMSU).
- **Data file:** `https://atmos.nmsu.edu/PDS/data/vl_1001/data/vl_avep.dat`
  (fixed-width ASCII, 3297 rows). Detached label: `vl_avep.lbl`.
- **Landing page:** https://atmos.nmsu.edu/data_and_services/atmospheres_data/MARS/viking/sol_avg_sur_press_data.html
- **License:** public domain (NASA / US Government data, 17 U.S.C. § 105).
  No key, no registration.
- **Primary reference:** Hess, S. L., et al. (1980), *The annual cycle of
  pressure on Mars measured by Viking Landers 1 and 2*, GRL 7(3), 197-200,
  doi:10.1029/GL007i003p00197.

### Method
Download the PDS `.dat`, parse the fixed-width columns per the PDS label
(`SC_ID`, `SOL_LON`=Ls, `MARTIAN_DAY`=sol, `PRESS_MEAN`=daily mean mbar; drop
the −9.999 no-value flag), then bin the daily means into equal-width Ls bins
(default 24 → 15° per bin) separately for VL1 and VL2, reporting per-bin
mean/min/max and sample count, plus per-lander annual stats (min, max, mean,
seasonal swing %). Output is fully reproducible from the source file.

### Running
```sh
python scripts/mars/build_pressure_climatology.py \
    --out public/data/mars/seasonal_pressure.json
# offline from a local copy of the PDS file:
python scripts/mars/build_pressure_climatology.py --dat /path/to/vl_avep.dat
```
No third-party deps required (stdlib `urllib`; `requests` not needed). Exit
code is non-zero on any failure (network, too few rows). Verified output
2026-07-06: 2605 valid sols, VL1 swing **29.3%** (6.77→9.06 mbar), VL2 swing
**32.7%** (7.36→10.20 mbar); JSON ~6.8 KB.

Note: `atmos.nmsu.edu` can serve an incomplete TLS chain; the script sets a
permissive SSL context for this public-domain host and the row count is
checked against the PDS label (3297) as an integrity guard.

## Next: dust-storm season climatology
The Montabone et al. dust optical depth climatology (MY 24-36, **CC-BY-SA
3.0**) is the next honest layer — a tau-vs-Ls climatology (dust *season*, not
a storm prediction). NetCDF-4 source; requires a NetCDF-4 reader and must
carry CC-BY-SA 3.0 + Montabone 2015/2020 attribution in the derived artifact.
See `docs/MARS_DATA_SOURCES.md` §2d.
