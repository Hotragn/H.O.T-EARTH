# Moon data pipeline

Builds compact, honest Moon artifacts for the Phase 3 globe, from free,
public-domain sources. See
[`docs/MOON_DATA_SOURCES.md`](../../docs/MOON_DATA_SOURCES.md) and
[`docs/MOON_PHYSICS.md`](../../docs/MOON_PHYSICS.md) for the full source,
license, and methodology record.

**The Moon has no atmosphere, so there is no weather.** The honest,
physically-real "predictive/dynamic" signals are surface-temperature swings,
illumination / day-night, libration, and phase — never a fabricated weather
feed.

## `build_diurnal_temperature.py` — lunar day-night temperature swing (flagship)

Produces
[`public/data/moon/diurnal_temperature.json`](../../public/data/moon/diurnal_temperature.json):
the lunar diurnal surface-temperature curve (surface temperature vs local solar
time) at several latitudes. The Moon's day-night swing is ~300 K with no
atmosphere to buffer it — the strongest honest "dynamic" Moon signal.

### What it is (and is not)
- **It is** a documented physical model, anchored to LRO Diviner's **measured**
  day/night temperature extremes.
- **It is not** a live sensor feed and **not** the raw Diviner archive. Labeled
  as such in the JSON `_comment` and in `MOON_PHYSICS.md`.

### Model
- **Daytime** (sunlit side): radiative equilibrium, exactly Eq. 1 of Williams
  et al. 2017 —
  `T(i) = [ S (1 − A) cos(i) / (ε σ) ]^(1/4)` —
  with the Diviner team's published latitude-dependent albedo
  `A(lat) = 0.08 + 0.045·(lat/45)³ + 0.14·(lat/90)⁸`, emissivity `ε = 0.95`,
  solar constant `S = 1370 W/m²`, Stefan-Boltzmann `σ = 5.670374419e-8`.
  Incidence `cos(i) = cos(lat)·cos(h)`, hour angle `h = (LST−12)·15°`
  (sub-solar point on the equator; the Moon's ~1.54° obliquity to the ecliptic
  makes this near-exact).
- **Nightside**: instantaneous equilibrium has no thermal inertia and collapses
  to 0 K, which is unphysical. Instead the nightside is a **Diviner-anchored**
  cooling curve from the measured post-sunset value (~120 K, equator) toward the
  measured pre-dawn minimum (~95 K, equator), scaled by latitude. The surface
  never drops below this floor, so near the terminator we take
  `max(equilibrium, night_floor)` — retained regolith heat holds the surface up
  at sunrise/sunset.

### Data source and licensing
- **Data archive (anchors):** LRO Diviner Global Data Record,
  `LRO-L-DLRE-5-GDR-V1.0`, NASA PDS **Geosciences** Node (Washington University,
  St. Louis): https://pds-geosciences.wustl.edu/missions/lro/diviner.htm
- **License:** public domain (NASA / US Government work, 17 U.S.C. § 105).
- **Primary references:**
  - Williams, J.-P., et al. (2017), *The global surface temperatures of the Moon
    as measured by the Diviner Lunar Radiometer Experiment*, Icarus 283,
    300-325, doi:10.1016/j.icarus.2016.08.012 (**open access**).
  - Vasavada, A.R., et al. (2012), *Lunar equatorial surface temperatures and
    regolith properties from the Diviner Lunar Radiometer Experiment*, JGR 117,
    E00H18, doi:10.1029/2011JE003987.
  - Paige, D.A., et al. (2010), *Diviner Lunar Radiometer Observations of Cold
    Traps in the Moon's South Polar Region*, Science 330, 479-482,
    doi:10.1126/science.1187726.

### Running
```sh
python scripts/moon/build_diurnal_temperature.py \
    --out public/data/moon/diurnal_temperature.json
# custom latitudes / time step:
python scripts/moon/build_diurnal_temperature.py --lats 0,15,45,75,85 --step 0.25
```
No third-party deps (stdlib only). The script fails loudly if the equatorial
daytime peak drifts outside Diviner's measured 387-397 K band. Verified output
2026-07-06: equator max **391.1 K** / min **95.5 K** (swing **295.6 K**),
matching Diviner's measured ~392 K / ~95 K / ~300 K; JSON ~8.9 KB.

## Optional / next layers
- **Terrain relief (LOLA):** the `ldem_4.tif` (1440×720) LOLA displacement map
  in the NASA SVS CGI Moon Kit is a public-domain, web-friendly source for
  vertical relief / bump mapping later. See `MOON_DATA_SOURCES.md` §3.
- **Libration / phase / sub-solar + sub-Earth points:** computed client-side
  (owned by another agent's `lib/`), no data file needed. Method and constants
  in `MOON_DATA_SOURCES.md` §4 and `MOON_PHYSICS.md`.
