# Night Sky Physics & Honest-Representation Methodology (Phase 11)

Companion to `docs/NIGHT_SKY_DATA_SOURCES.md`. Same non-negotiable bar as every prior phase (`physics-env-simulation` skill): **real physics and real data, or it does not ship. No invented numbers.** This doc states exactly what is **MEASURED**, what is **COMPUTED**, and what is **CULTURAL / ILLUSTRATIVE** for the Night Sky tab.

Verification date: **2026-07-18**. Data: HYG v4.4 (stars), MarcvdSluys ConstellationLines (figures), OpenNGC (Messier). See the data-sources doc for catalogs, columns, units and licenses.

## The overriding honesty rule for this phase

**The stars are real; the pictures are ours.** Every star's position, brightness, colour, distance and spectral type is a **measurement** (Hipparcos / Gaia era, plus the Yale and Gliese catalogs, via HYG). Every Messier object's position, magnitude and type is a **measured catalog value** (NED / SIMBAD / LEDA via OpenNGC). What is **not** measured is the **stick figures**: the choice of which bright stars to connect into "Orion" or "the Big Dipper" is a **human cultural convention**, not a physical fact. The stars sit where the data says; the lines between them are drawn by people, and the app must say so.

We invent nothing. Where a value is missing (no reliable parallax, no colour index, no common name), the data carries `null` and the UI shows "no measured value," never a guess.

## MEASURED - straight from the catalogs

Stored verbatim (rounded, never altered) in the JSON files:

| Quantity | Field | Source | Unit | Notes |
|---|---|---|---|---|
| Right ascension | `ra` | HYG (Hipparcos/Gaia) | **degrees**, J2000 | Converted from HYG's decimal-hours RA (x 15). A measured sky position. |
| Declination | `dec` | HYG | **degrees**, J2000 | Measured sky position. |
| Apparent magnitude | `mag` | HYG | mag | How bright the star looks. Lower = brighter; Sirius = -1.44. |
| Colour index | `ci` | HYG | B-V mag | Measured colour. Blue stars ~ -0.3, the Sun ~ +0.65, red stars > +1.4. Drives the rendered star colour. |
| Distance | `dist_ly` | HYG (parallax) | light-years | From the measured **parallax** (parsecs x 3.26156). `null` where HYG has no reliable parallax (`dist >= 100000`). |
| Spectral type | `spect` | HYG (Yale/HD) | - | Morgan-Keenan class (O B A F G K M ...), shortened. `null` if absent. |
| Proper name | `name` | IAU WGSN (via HYG) | - | IAU-approved name; `null` if unnamed. A naming fact, not a measurement, but authoritative. |
| Bayer / constellation | `bayer`, `con` | HYG | - | Designation label + constellation the star lies in. |
| Deep-sky position | `ra`, `dec` | OpenNGC (NED) | degrees, J2000 | Measured position of each Messier object. |
| Deep-sky magnitude | `mag` | OpenNGC (LEDA/SIMBAD) | mag | V-Mag preferred, else B-Mag; `null` if absent. |
| Deep-sky type | `type` | OpenNGC | - | Galaxy, globular/open cluster, planetary nebula, SNR, etc. Measured classification. |

These are **measurements**, presented as such. The one derived flag on the star side is the id convention (positive = HIP, negative = -(HYG id)), which is bookkeeping, not physics.

## COMPUTED - derived in the app (labeled "computed"), not stored as data

None of these overwrite or masquerade as catalog measurements. They are transparent calculations from the measured inputs above.

### 1. Celestial-sphere projection (where to draw each star)
The star map places each star on a sphere (or a projected 2D chart) from its measured `(ra, dec)`. On a unit celestial sphere:
```
x = cos(dec) * cos(ra)
y = cos(dec) * sin(ra)
z = sin(dec)
```
(with `ra`, `dec` in radians). This is a pure coordinate transform of measured angles; it invents no position. Distance (`dist_ly`) is **not** used for placement - all stars are painted on the sphere at "infinity," which is how the sky actually looks to the eye. (Distance is available for labels / a future 3D fly-through, and is honestly measured, but the naked-eye sky is a direction-only projection.)

### 2. B-V colour -> star colour (how each star is tinted)
The rendered colour of a star is **computed** from its measured colour index `ci` (B-V), which is a proxy for surface temperature (the same physics as the black-body colour used for stars elsewhere in the twin). Bluer (negative B-V) = hotter; redder (positive B-V) = cooler. This is a computed, physically-grounded mapping (B-V -> approximate colour temperature -> RGB), labeled "colour computed from measured B-V," not an arbitrary palette. Where `ci` is `null`, fall back to the spectral class letter, or a neutral tint - never a fabricated colour presented as measured.

### 3. Apparent magnitude -> on-screen brightness / size
A star's rendered brightness (and/or point size) is **computed** from its measured `mag`. Magnitude is a logarithmic scale: each 5 magnitudes is a factor of 100 in flux, so relative flux `~ 10^(-0.4 * mag)`. The app maps this to a display brightness / radius with a documented scaling (and a floor so the faintest naked-eye stars remain visible). This is a display transform of a measured quantity, labeled as such; the underlying `mag` is never altered.

### 4. Horizontal coordinates - "the sky from a place and time" (alt/az)
To show the sky as seen from a given **observer location + date/time**, the app computes the **horizontal (altitude / azimuth)** coordinates from the measured `(ra, dec)`. This is standard spherical astronomy, all computed, no data invented:

1. **Local sidereal time (LST)** from the date/time and the observer's **longitude**: compute Greenwich Mean Sidereal Time from the Julian date (GMST advances ~360.9856deg per day relative to the Sun), then `LST = GMST + longitude_east`.
2. **Hour angle** of each star: `H = LST - ra`.
3. **Alt/az** from `H`, `dec` and the observer **latitude** `phi`:
   ```
   sin(alt) = sin(phi) sin(dec) + cos(phi) cos(dec) cos(H)
   az       = atan2( -sin(H) cos(dec),
                     cos(phi) sin(dec) - sin(phi) cos(dec) cos(H) )   (measured from North, through East)
   ```
Stars with `alt < 0` are below the horizon. This is the same solar-geometry machinery used elsewhere in the twin (`lib/solar.ts` for the Sun), applied to fixed stars. It is **computed** and labeled: "sky computed for `<lat, lon>` at `<time>`."

### 5. Unit conversions (the only ones baked into the data)
`ra_deg = ra_hours x 15` (HYG hours -> degrees) and `dist_ly = dist_pc x 3.26156` (parsecs -> light-years). RA/Dec sexagesimal -> degrees for the Messier objects. These are the only conversions applied to the shipped data; everything else computed above happens in the app and is labeled computed.

## CULTURAL / ILLUSTRATIVE - the human overlay

- **Constellation stick figures are a CULTURAL construct, and the app must label them so.** The stars are real and measured; the *lines* joining them into "Orion," "Leo," or "the Southern Cross" are a **human convention** - specifically the modern **Western / IAU** figure set (from MarcvdSluys/ConstellationLines). Other cultures partition and draw the same stars completely differently. The honest caption is: "Constellation lines are a cultural overlay - the stars are real measured objects; the figures are a human way of connecting them." `constellations.json -> meta.cultural_note` carries this statement.
- **Constellation names** (Orion, Andromeda, ...) and the 88-constellation scheme are likewise a human naming convention (standardised by the IAU in 1922-1930). Real and useful, but a label, not a physical property of the stars.
- **Constellation boundaries** (the IAU 1930 Delporte boundaries), if ever added, are also a human convention - lines drawn on the sky by committee, not physical edges. Not shipped this phase.
- **Milky Way band**, if a texture is used for it, is **illustrative**: it depicts the real direction of the galactic disc, but any painted band is an artist/texture rendering, not a per-pixel photometric measurement, and must be labeled "illustrative" (the same rule that governed painted textures in earlier phases). The star field itself, by contrast, is genuine per-star measured data.
- **Proper names** are authoritative (IAU WGSN) but are cultural labels attached to measured stars, not measurements.

## Epoch, proper motion and precession (why present-day display can ignore them)

- **Epoch: J2000.0.** All positions (stars and Messier objects) are in the **J2000** equinox/equator frame. This is stated in every file's `meta.epoch`.
- **Proper motion ignored for display.** Stars drift across the sky at their measured proper motions (`pmra`, `pmdec` exist in HYG), but even the fastest naked-eye stars move only of order an **arcsecond per year** - well under an arcminute over several decades, invisible at star-map zoom. So present-day display uses the J2000 positions directly. (The measured proper motions remain in HYG if a "watch the sky drift over millennia" feature is ever built; that would be a labeled computed animation.)
- **Precession ignored for present-day display, but modeled separately for the millennial story.** Axial precession slowly rotates the whole star field about the ecliptic pole (~50.29 arcsec/yr, a full turn in ~25,772 years). Over a human lifetime this is a fraction of a degree - negligible for "what's up tonight." The twin already models the leading precession term honestly in **`lib/precession.ts`** (the "even the sky changes" touch: Polaris -> Thuban -> Vega as the pole star over millennia), as a **computed** rotation of the star-field group about the ecliptic-pole axis, with the pole-star epochs labeled as factual mileposts. The Night Sky tab can reuse that module for a "wind the year" mode; for the default present-day view it is off (identity rotation at year 2000, sub-degree for nearby years).

## Measured vs computed vs cultural - the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Star RA / Dec (J2000) | **Measured** | "Measured position - Hipparcos/Gaia (HYG)" |
| Star apparent magnitude | **Measured** | "Measured brightness (apparent magnitude)" |
| Star colour index B-V | **Measured** | "Measured colour (B-V)" |
| Star distance (parallax) | **Measured** | "Measured distance (parallax), light-years" (or "unknown" when `null`) |
| Star spectral type | **Measured** | "Measured spectral type" |
| Messier position / magnitude / type | **Measured** | "Measured - OpenNGC (NED/SIMBAD/LEDA)" |
| Celestial-sphere placement | **Computed** | "Computed projection of measured RA/Dec" |
| Rendered star colour (from B-V) | **Computed** | "Colour computed from measured B-V" |
| On-screen brightness / size (from mag) | **Computed** | "Brightness computed from measured magnitude" |
| Alt/az for a location + time | **Computed** | "Sky computed for <lat, lon> at <time> (local sidereal time)" |
| Precession / proper-motion animation | **Computed** | "Computed - precession model (lib/precession), off for present-day" |
| Constellation stick figures | **Cultural** | "Cultural overlay - stars are real; lines are a human construct (modern IAU set)" |
| Constellation / star names | **Cultural** (authoritative label) | "IAU name / IAU constellation" |
| Milky Way band texture (if used) | **Illustrative** | "Illustrative - real direction, painted band" |

Rules carried over from every prior phase, unchanged:
- Every number on screen names its category and source.
- No invented values; if a catalog has no value, the UI shows "no measured value" and the JSON stores `null`.
- Computed quantities (projection, colour-from-B-V, brightness-from-mag, alt/az) are always labeled computed.
- The cultural overlay (constellation figures + names, any Milky Way band) is always labeled as a human construct - the stars underneath are real.

## What is honestly showable this phase (crisp statement)

- **MEASURED:** 9,029 stars with real J2000 positions, apparent magnitudes, B-V colours, spectral types and (where parallax exists) distances in light-years, from the Hipparcos/Gaia-era HYG compilation; plus the 110 Messier deep-sky objects with measured positions, magnitudes and types from OpenNGC.
- **COMPUTED (labeled):** the celestial-sphere projection of those measured positions; star colour from measured B-V; on-screen brightness/size from measured magnitude; and the horizontal alt/az transform that turns "a location + a time" into a rendered local sky (via local sidereal time from the observer's longitude and date). Optionally, a labeled precession/proper-motion animation reusing `lib/precession.ts`.
- **CULTURAL / ILLUSTRATIVE (labeled):** the constellation stick figures and names (a human overlay on real stars, the modern IAU set), and any Milky Way band texture.

What we deliberately do **not** do: present the constellation lines as anything but a human convention, invent star colours or distances where the catalog is silent, or rotate the sky by proper motion/precession in the default present-day view (negligible, and modeled separately when wound over millennia). The honest, still-beautiful content is a sky full of genuinely measured stars, with the human stories drawn on top and clearly marked as such.
