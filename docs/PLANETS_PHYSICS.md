# Other-Planets Physics & Honest-Representation Methodology (Stretch Phase)

Companion to `docs/PLANETS_DATA_SOURCES.md`. Same non-negotiable bar as Earth, Mars and the Moon (`physics-env-simulation` skill): **real physics and real data, or it doesn't ship. No invented numbers.** This doc states, per body, exactly what is **MEASURED**, what is **COMPUTED**, and what is a **documented MODEL** — and, critically, what must remain **static / illustrative** because no honest dynamic signal exists.

Verification date: **2026-07-06**. Bodies: **Mercury, Venus, Jupiter, Saturn, Uranus, Neptune** (Earth/Mars/Moon done in Phases 1-3).

## The overriding honesty rule for this phase

**Most of these planets do NOT support a real weather / predictive layer.** The honest bar is: **orbital mechanics + measured physical facts + real textures.** We do **NOT** invent weather. We only show a dynamic quantity when it is genuinely **measured**:

- gas-giant **zonal wind profiles** (cloud-tracked jet speeds vs latitude — Voyager/Cassini/Hubble),
- **Mercury** surface-temperature extremes (no atmosphere),
- **Venus** cloud-top super-rotation,
- **Neptune** wind speeds.

There is **no live weather feed** for any of these bodies, and we never present one. The zonal wind profiles are **climatological/measured averages, not forecasts**. The Great Red Spot, the polar hexagon, and Neptune's dark spots are described from observation, never simulated as a forecast.

## Two structural facts that shape everything

1. **The gas/ice giants (Jupiter, Saturn, Uranus, Neptune) have NO solid surface.** There is no "ground," no surface pressure, no surface temperature. Depth is referenced to a **pressure level** (conventionally the **1-bar level**), and the quoted "temperature" is the temperature at that reference level — not a surface reading. Any UI that says "surface temperature" for a giant is wrong.
2. **Uranus' and Neptune's interiors are INFERRED, not measured.** We have one flyby each (Voyager 2, 1986/1989) plus remote sensing. Interior composition/structure is a model; we do not present interior numbers as measured facts.

## Per-body: measured vs computed vs model vs static

### Mercury — MEASURED temperature extremes; COMPUTED orbit
- **Honest dynamic signal (MEASURED):** the largest day/night surface-temperature range of any planet — subsolar surface ~**700 K (~430 °C)** dropping to ~**100 K (-173 °C)** on the night side, because there is **no atmosphere** to redistribute heat (only a tenuous exosphere). Source: NSSDC Mercury fact sheet (max 427 °C / min -173 °C); MESSENGER-era measurements.
- **COMPUTED:** orbital position, the 3:2 spin-orbit resonance (58.65-day sidereal rotation vs 88-day year → a solar day lasts ~176 Earth days), day/night terminator, and the strong perihelion/aphelion insolation contrast (eccentricity 0.206, the highest of the eight planets). Computable from the constants, same machinery as Earth's terminator.
- **STATIC:** the MESSENGER MDIS color basemap (real imagery).
- **NOT shown:** weather. There is none.

### Venus — MEASURED super-rotation; near-isothermal surface
- **Honest dynamic signal (MEASURED):** **atmospheric super-rotation.** Cloud-top zonal winds of ~**100 m/s** (retrograde) circle the planet in ~**4 Earth days**, ~60× faster than the 243-day solid-body rotation. Measured by cloud-tracking from **Venus Express (VMC)** and **Akatsuki (UVI)**. This is the honest "dynamic" layer for Venus.
- **Near-isothermal surface (MEASURED, static):** the surface is ~**737 K (464 °C)** almost everywhere, day and night, pole to equator — a runaway CO₂ greenhouse under ~92 bar. So the *surface* shows essentially no dynamics; the dynamics live at the cloud tops.
- **COMPUTED:** orbit, retrograde rotation (obliquity 177.36°), terminator.
- **STATIC:** the Magellan radar basemap (the surface is permanently cloud-covered in visible light; the shipped texture is radar-derived, which we state honestly).
- **NOT shown:** a Venus "surface weather" layer (there isn't one) or any invented cloud animation beyond the measured super-rotation rate.

### Jupiter — MEASURED zonal winds + Great Red Spot; no surface
- **Honest dynamic signal (MEASURED):** the **zonal wind profile** — alternating eastward/westward jets by latitude, cloud-tracked by Voyager, Cassini and Hubble, with peak jet speeds ~**150 m/s**. This is a **measured climatological profile** (`public/data/planets/zonal_winds.json`), shown as wind-speed-vs-latitude, **not a forecast**.
- **Great Red Spot (MEASURED, described):** a long-lived anticyclone near **~22° S**, observed for centuries. We show its location/size from observation and describe it as long-lived; we do **not** forecast its evolution.
- **COMPUTED:** orbit; System III rotation (9 h 55 m). The banded appearance is real (belts/zones) and comes from the texture.
- **STATIC:** the cloud-top basemap (Cassini/Voyager/Hubble/Juno-derived) — a real cloud map, but a **snapshot**; the belts drift, so it is labeled a snapshot, not "live."
- **No surface:** temperature is the 1-bar reference level (~163 K).

### Saturn — MEASURED zonal winds + real hexagon + rings; no surface
- **Honest dynamic signal (MEASURED):** the **zonal wind profile** with a huge **equatorial super-jet ~400+ m/s** (the fastest steady jet of the giants after Neptune's), cloud-tracked by Voyager and Cassini. Shown as measured wind-vs-latitude (`zonal_winds.json`), not a forecast.
- **North polar hexagon (MEASURED, real):** a genuine six-sided standing wave in the jet stream at **~78° N**, imaged by Voyager and Cassini. It is **real**, not an artifact — we can show it as a measured feature, clearly labeled.
- **Rings (MEASURED geometry):** the ring boundary radii are real occultation-derived values (`saturn_rings.json`) — D/C/B rings, the Cassini Division, the A ring, the Encke/Keeler gaps — rendered to scale.
- **COMPUTED:** orbit; bulk rotation period is **uncertain** (no fixed surface to track — flagged in constants).
- **STATIC:** cloud-top basemap; ring texture strip.
- **No surface:** 1-bar reference temperature (~133 K).

### Uranus — COMPUTED extreme seasons (the standout); nearly featureless
- **Standout honest feature (COMPUTED from measured constants):** **obliquity 97.77°** — Uranus is tipped past 90°, so it effectively **rolls on its side**. With an 84-year orbit this produces **~42-year seasons**: each pole points nearly at the Sun for ~21 years, then into ~21 years of darkness. This dramatic, real, *computable* geometry is Uranus' flagship signal — the analogue of Earth's terminator/season clock. Rotation is retrograde.
- **Faint bands / near-featureless (MEASURED, honestly stated):** in true color Uranus is a nearly uniform pale cyan; only faint zonal bands and occasional cloud features are seen (mostly in near-IR / with modern Hubble/JWST processing). We do **not** fake surface detail or storms. A zonal wind profile exists (broad prograde/retrograde structure) but is far less dramatic and less densely sampled than Jupiter/Saturn/Neptune — treated with caution.
- **Interior INFERRED:** ice-giant interior structure is a model, not measured.
- **STATIC:** a real (necessarily low-contrast) cloud-top basemap; we state that the near-featureless look is honest, not a missing texture.

### Neptune — MEASURED fastest winds; TRANSIENT dark spots
- **Honest dynamic signal (MEASURED):** the **fastest winds in the solar system** — up to ~**2100 km/h (~580 m/s)**, measured by **Voyager 2 (1989)** cloud tracking. The zonal profile is strongly retrograde near the equator. Shown as measured wind-vs-latitude (`zonal_winds.json`).
- **Great Dark Spot (MEASURED but TRANSIENT — must be labeled so):** the 1989 Voyager Great Dark Spot had **disappeared by 1994** (Hubble); new dark spots have since appeared and faded. Unlike Jupiter's GRS, Neptune's dark spots are **transient**. If shown at all, they must be labeled "transient / observed [date]," never a permanent fixed feature.
- **COMPUTED:** orbit (165-year period), rotation (16.11 h), obliquity 28.32° (Earth-like seasons but each lasts ~41 years).
- **Interior INFERRED.**
- **STATIC:** cloud-top basemap (Voyager/Hubble-derived), labeled a snapshot.

## Zonal wind profiles: what they are and are not

The `zonal_winds.json` artifact holds **measured** mean zonal wind speed vs latitude for Jupiter, Saturn and Neptune, transcribed from published cloud-tracking profiles (see `PLANETS_DATA_SOURCES.md` for the exact citation per body and the transcription script `scripts/planets/build_zonal_winds.py`). Rules:

- These are **measurements** (cloud-feature tracking), presented as a **climatological mean profile**, not a forecast and not live.
- Sign convention: **eastward (prograde) positive, westward (retrograde) negative**, m/s, vs **planetographic latitude**.
- Jupiter and Saturn profiles are relatively stable in the mean; Neptune's is based essentially on the single Voyager-2 epoch (1989) plus limited later Hubble data — flagged as such.
- Uranus is deliberately **not** given a dense profile artifact (its winds are less well constrained and far less dramatic); if referenced, it is described qualitatively with its source.
- We **never** interpolate invented points to pad the curve. The stored points are the published/transcribed values; the density reflects the real data.

## Measured vs computed vs model vs static — the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Mercury day/night temp extremes (~700 K / ~100 K) | **Measured** | "Measured extremes — MESSENGER-era / NSSDC; no atmosphere" |
| Venus cloud-top super-rotation (~100 m/s, ~4-day) | **Measured** | "Measured — Venus Express / Akatsuki cloud tracking" |
| Venus surface ~737 K (near-isothermal) | **Measured** (static field) | "Measured surface temperature (near-isothermal)" |
| Jupiter/Saturn/Neptune zonal wind profile | **Measured** (climatological mean) | "Measured zonal winds ([mission]) — not a forecast" |
| Jupiter Great Red Spot (~22° S, long-lived) | **Measured** (described) | "Observed feature — long-lived" |
| Saturn north polar hexagon (~78° N) | **Measured** (real) | "Measured feature — Cassini/Voyager" |
| Saturn ring geometry | **Measured** (occultation radii) | "To-scale ring radii — NASA/occultation data" |
| Neptune Great Dark Spot | **Measured but TRANSIENT** | "Transient — observed [date]; not permanent" |
| Uranus 42-year seasons (obliquity 97.77°) | **Computed** (from measured constants) | "Computed — from obliquity + orbit" |
| Orbit / terminator / rotation / seasons (all bodies) | **Computed** | "Computed — orbital mechanics" |
| Giant interior structure (Uranus/Neptune) | **Model / inferred** | "Inferred — not directly measured" |
| Surface / cloud-top textures | **Static basemap** | "[Mission] imagery (public domain) — snapshot, not live" |

Rules carried over from Earth/Mars/Moon, unchanged:
- Every number on screen names its category and source.
- No invented values; if we don't have measured or published data for something, we don't show a number for it.
- Computed geometry and measured climatologies are never presented as live readings or forecasts.
- **No fabricated weather anywhere.** For the giants, the only "dynamic" data is the measured zonal wind profile and the described long-lived/transient features. For Mercury/Venus, it is the measured temperature extremes / super-rotation. Nothing else moves.

## What is honestly showable this phase (crisp per-body statement)

- **Mercury:** MEASURED extreme day/night surface-temperature range (~700 K / ~100 K, no atmosphere); COMPUTED orbit/terminator/3:2 resonance; STATIC MESSENGER color map. No weather.
- **Venus:** MEASURED cloud-top super-rotation (~100 m/s, ~4-day circulation) and near-isothermal ~737 K surface; COMPUTED retrograde orbit/terminator; STATIC Magellan radar map (surface is cloud-hidden in visible — stated). No surface weather.
- **Jupiter:** MEASURED zonal wind profile (jets, peak ~150 m/s) + long-lived Great Red Spot (~22° S); COMPUTED orbit/rotation; STATIC cloud-top snapshot. No surface (1-bar reference).
- **Saturn:** MEASURED zonal winds (equatorial jet ~400+ m/s), real north polar hexagon (~78° N), and to-scale ring geometry; COMPUTED orbit; STATIC cloud + ring textures. No surface; bulk rotation uncertain.
- **Uranus:** COMPUTED ~42-year extreme seasons (obliquity 97.77°, the standout), retrograde rotation; MEASURED but faint/near-featureless appearance (stated honestly, not faked); interior INFERRED; STATIC low-contrast cloud map.
- **Neptune:** MEASURED fastest winds in the solar system (~580 m/s, Voyager 2 1989) as a zonal profile; TRANSIENT Great Dark Spot (labeled transient); COMPUTED orbit/seasons; interior INFERRED; STATIC cloud snapshot.

What we deliberately do **not** show for any of these bodies: a live weather feed, a forecast, an invented storm, a fabricated cloud animation, or a "surface temperature" for a body with no surface. Those would be dishonest, and for most of these worlds the honest, still-impressive content is orbital mechanics + measured physical facts + real textures.
