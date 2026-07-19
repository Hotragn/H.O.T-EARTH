# Meteor Showers Physics & Honest-Representation Methodology (Phase 12)

Companion to `docs/METEOR_SHOWERS_DATA_SOURCES.md`. Same non-negotiable bar as
every prior phase (`physics-env-simulation` skill): **real physics and real
data, or it does not ship. No invented numbers.** This doc states exactly what is
**MEASURED / CATALOG**, what is **COMPUTED**, and what is **ILLUSTRATIVE** for the
Meteor Showers tab.

Verification date: **2026-07-18**. Data: IAU Meteor Data Center (codes/parents)
+ IMO Working List of Visual Meteor Showers (2026 IMO Meteor Shower Calendar).
See the data-sources doc for catalogs, columns, units and the (honest) license
handling.

## The overriding honesty rule for this phase

**The catalog is real; the ZHR is an idealization; the animation is a drawing.**
Every shower's radiant position, activity period, peak date, peak solar
longitude, entry velocity and parent body is **real catalog data**. The one
number that must never be oversold is the **ZHR (Zenithal Hourly Rate)**: it is a
**standardized ideal rate** - what a single observer would see under a perfectly
clear sky (limiting magnitude +6.5) **with the radiant straight overhead**. Real
skies are never that good and the radiant is rarely at the zenith, so **actual
observed rates are lower**, always. The meteor streaks and the debris-stream
diagram are **illustrations**, not observations. We invent nothing; where a
parent body or a value is not established, the data carries `null` and the UI
says "not established," never a guess.

## The real physics (why showers happen, in one paragraph)

A comet (or a rock-comet asteroid like 3200 Phaethon) sheds dust and grit each
time it nears the Sun. That debris spreads along the parent's orbit into a
**meteoroid stream** - a tube of particles moving on nearly parallel paths. When
**Earth's orbit crosses that stream**, we plough through the particles at tens of
km/s; they burn up in the upper atmosphere (~80-120 km) as meteors. Because the
stream particles move on **near-parallel** paths, perspective makes their trails
appear to **diverge from a single point on the sky - the radiant** (the same
effect as parallel railway tracks converging to a vanishing point). Earth hits
the same part of each stream at the **same solar longitude every year**, which is
why showers recur on nearly the same date annually (and why solar longitude, not
the calendar date, is the stable anchor). This is all real, well-understood
physics - see the MEASURED and COMPUTED sections for exactly which parts are
cataloged and which the app derives.

## MEASURED / CATALOG - straight from the catalogs

Stored verbatim (rounded, never altered) in `showers.json`:

| Quantity | Field | Source | Unit | Notes |
|---|---|---|---|---|
| IAU code + number | `code`, `iau_number` | IAU MDC | - | The official designation (PER, GEM, ...). |
| Radiant right ascension | `radiant_ra` | IMO Working List / IAU MDC | **degrees**, J2000.0, at max | Perspective apex of the stream; a real measured direction. |
| Radiant declination | `radiant_dec` | IMO / IAU MDC | **degrees**, J2000.0, at max | Measured direction. |
| Activity period | `active_start`, `active_end` | IMO Working List | MM-DD (2026) | When Earth is inside the stream. |
| Peak date | `peak_date` | IMO Working List | MM-DD (2026) | Densest part of the crossing (this year). |
| Peak solar longitude | `peak_solar_longitude` | IMO / IAU MDC | **degrees** | Earth's orbital position at max - **stable** year to year. |
| Entry velocity | `velocity_kms` | IMO Working List | **km/s** (V_inf) | Pre-atmospheric apparent speed; ~= sqrt(Vg^2 + 11.2^2). |
| Population index | `r_population_index` | IMO Working List | - | Ratio of counts between magnitude classes; lower = brighter mean. |
| Parent body | `parent_body`, `parent_type` | IAU MDC / literature | - | The comet or asteroid that sheds the stream; `null` if not established. |

- **ZHR is listed here but is a special case** - it is a *cataloged* number, but
  it is an **idealized standardized rate**, not an observed count. It gets its own
  honesty treatment below and in the COMPUTED "expected observed rate" step.
- These are **catalog facts**, presented as such. Anything not firmly established
  (17 of 37 parents; the four "Var" ZHRs) is `null` - never filled in.

### Why "peak solar longitude" is the honest timing anchor

Earth returns to the same point in its orbit - the same **solar longitude
`lambda_sun`** - at the same moment each year, but the **calendar date** of that
moment drifts by up to ~1 day because the tropical year is not a whole number of
days (and leap years jog it back). So a shower's peak is **fixed in solar
longitude** but **wanders ~+/-1 day in date**. `showers.json` ships **both**: the
2026 `peak_date` for display convenience, and the stable `peak_solar_longitude`
that the app should actually key timing off. (E.g. the Geminids peak at
`lambda_sun = 262.2 deg` every year; that lands on Dec 14 in 2026 but can be Dec
13 or 14 in other years.)

## COMPUTED - derived in the app (labeled "computed"), not stored as data

None of these overwrite or masquerade as catalog measurements. They are
transparent calculations from the measured inputs above (and reuse existing
`lib/` machinery from the Sun and Night Sky phases).

### 1. Date -> solar longitude -> which showers are active / at peak now
From a given date, compute the **solar longitude** (the same solar-geometry
already in `lib/solar.ts` for the Earth terminator / subsolar point). Then:
- a shower is **active** when today's `lambda_sun` lies between its
  `active_start` and `active_end` (converted to solar longitude, or compared by
  date within the year);
- a shower is **at/near peak** when today's `lambda_sun` is within a small
  tolerance of its `peak_solar_longitude`.
This is a pure computation from the measured activity window / peak solar
longitude; it invents nothing and is labeled "computed from date (solar
longitude)." It is also **why we key off solar longitude, not the hardcoded 2026
date** (which drifts).

### 2. Radiant altitude / azimuth for an observer + time (alt/az)
To show whether a shower's radiant is **up** for a given observer and moment -
and how high - the app computes **horizontal (altitude/azimuth)** coordinates
from the measured radiant `(ra, dec)`, exactly the standard spherical astronomy
already used for stars in `docs/NIGHT_SKY_PHYSICS.md` (reuse `lib/celestial`):
1. **Local sidereal time** from the date/time and observer **longitude**.
2. **Hour angle** of the radiant: `H = LST - ra`.
3. **Alt/az** from `H`, `dec` and observer latitude `phi`:
   ```
   sin(alt) = sin(phi) sin(dec) + cos(phi) cos(dec) cos(H)
   az       = atan2( -sin(H) cos(dec),
                     cos(phi) sin(dec) - sin(phi) cos(dec) cos(H) )
   ```
When `alt < 0` the radiant is below the horizon and **no shower meteors are
visible** from that site at that time - an honest, computed statement.

### 3. Approximate observed rate from ZHR (the key honesty computation)
**ZHR is an idealized rate** (radiant at the zenith, perfect +6.5 sky). The
number an observer actually sees is **lower**, and the app must compute and label
it as **approximate**. The standard first-order correction scales ZHR by the
**sine of the radiant altitude**:
```
observed_rate ~= ZHR * sin(alt_radiant)          [approximate]
```
So a radiant 30 deg up yields ~half the ZHR at best; at the horizon (`alt = 0`)
the rate goes to ~zero. (The full IMO reduction also divides by the population-
index sky-brightness factor `r^(6.5 - lm)` for a real limiting magnitude `lm`,
and by a cloud/obstruction factor - the app may add these, but even the bare
`ZHR * sin(alt)` already makes the essential honest point: **you will see fewer
than the ZHR.**) This quantity is **always labeled "approximate expected rate,"
never "ZHR" and never a guaranteed count.** `r_population_index` is shipped so the
app can apply the sky-brightness term if it wants a better estimate.

### 4. Radiant daily drift (optional, computed)
Radiants **drift** a fraction of a degree per day across the activity window
(Earth moves along its orbit, changing the geometry). `showers.json` ships the
**maximum-date** radiant; if the app wants the radiant on a non-peak night it can
apply a small computed drift (the IMO Calendar's Table 6 tabulates it) - a
labeled computed refinement, not stored as separate data. For a peak-night view
the shipped radiant is exact.

### 5. The only unit conventions baked into the data
Radiant RA/Dec are in **degrees, J2000.0** (as shipped); solar longitudes in
**degrees**; velocity in **km/s** (V_inf). No other transforms are applied to the
shipped values; everything else above is computed in the app and labeled
computed.

## ILLUSTRATIVE - the drawn layer

- **Meteor-streak animation is ILLUSTRATIVE.** The shooting-star streaks radiating
  from the radiant are an **artist/particle animation** - they depict the real
  radiant direction and the real relative speed ordering (fast Leonids vs slow
  Draconids), but the individual streaks are **not observed meteors**. Label:
  "illustration - streaks are drawn, not a live meteor feed." (Same rule that
  governed painted textures and the wind-particle animation in earlier phases:
  the *geometry* is real, the *particles* are decorative.)
- **Debris-stream / radiant diagram is ILLUSTRATIVE.** Any schematic of Earth
  crossing the parent's debris tube, or of parallel meteoroids appearing to
  diverge from the radiant, is a **teaching diagram** - it faithfully shows the
  real physics (parallel stream + perspective apex) but is a drawing, not a
  measured particle map. Label "illustrative diagram."
- **Animation speed / density are not to scale.** Real showers give a handful to
  a few dozen meteors per hour even at best; a lively on-screen animation is
  exaggerated for legibility (as the wind animation's ~55,000x speed-up was
  disclosed). Disclose it.

## Measured vs computed vs illustrative - the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| Radiant RA / Dec (J2000.0) | **Measured / catalog** | "Catalog radiant - IAU MDC / IMO" |
| Activity period / peak date | **Measured / catalog** | "Catalog activity dates (2026)" |
| Peak solar longitude | **Measured / catalog** | "Catalog peak solar longitude (stable)" |
| Entry velocity (V_inf) | **Measured / catalog** | "Catalog entry velocity (V_inf, km/s)" |
| Parent body + type | **Measured / catalog** | "Parent body - IAU MDC / literature" (or "not established" when null) |
| ZHR (peak) | **Measured / catalog, but IDEALIZED** | "ZHR - IDEAL rate (zenith radiant, perfect sky); real rates lower" |
| Active-now / peak-now | **Computed** | "Computed from date (solar longitude)" |
| Radiant altitude / azimuth | **Computed** | "Sky computed for <lat, lon> at <time>" |
| Approximate observed rate | **Computed** | "Approximate: ZHR x sin(altitude); real rate is lower than ZHR" |
| Radiant daily drift | **Computed** | "Computed radiant drift (off at peak)" |
| Meteor streaks animation | **Illustrative** | "Illustration - drawn, not observed meteors" |
| Debris-stream / radiant diagram | **Illustrative** | "Illustrative diagram of real physics" |

Rules carried over from every prior phase, unchanged:
- Every number on screen names its category and source.
- No invented values; a missing parent/value shows "not established" and the JSON
  stores `null`.
- Computed quantities (active-now, alt/az, approximate rate, drift) are always
  labeled computed.
- The illustrative layer (streaks, stream diagram) is always labeled a drawing;
  the catalog underneath is real.
- **ZHR is always labeled an idealized rate** - never presented as the number
  you'll see tonight without the altitude/sky correction.

## What is honestly showable this phase (crisp statement)

- **MEASURED / CATALOG:** 37 annual meteor showers with real radiant positions
  (J2000.0 degrees), activity periods, peak dates, peak solar longitudes, entry
  velocities and parent bodies, from the IAU Meteor Data Center (official codes +
  parents) and the IMO Working List of Visual Meteor Showers (2026 IMO Calendar).
  Each shower's **ZHR** is a cataloged **idealized** peak rate.
- **COMPUTED (labeled):** from a date, the solar longitude and hence which
  showers are active / at peak now; from an observer location + time, each
  radiant's altitude/azimuth (via local sidereal time, reusing the star-map
  machinery); and an **approximate** expected observed rate `~= ZHR x sin(radiant
  altitude)`, explicitly lower than the ZHR and labeled approximate; optionally a
  small computed radiant drift.
- **ILLUSTRATIVE (labeled):** the meteor-streak animation and the
  debris-stream / radiant diagram - faithful to the real geometry and the real
  physics, but drawings, not observations, and not to scale.

What we deliberately do **not** do: present the **ZHR as the count you'll see
tonight** (it is an idealized, radiant-at-zenith, perfect-sky rate - real rates
are lower, and the app computes the honest correction); invent a parent body or a
peak rate where the catalog is silent (17 parents and 4 ZHRs are `null`); or pin
timing to a hardcoded 2026 date (peaks drift ~1 day/yr - we key off the stable
solar longitude). The honest, still-beautiful content is a real catalog of when,
where and how fast each shower appears, which of its parents you can cross-link to
the small-bodies tab, and a clearly-labeled animation of the real physics on top.
