# Tonight: the physics behind "what can I see from here"

**Honesty rule for this tab.** Everything on the Tonight page is computed sky geometry for one
observer at one moment. It contains **no weather, no cloud cover, no seeing, no transparency and
no light pollution**, because this app ships no forecast data and uses no API keys. That limit is
stated on the page itself, next to the score, not buried here.

Implemented in `lib/tonight.ts`, validated by 56 unit tests in `lib/tonight.test.ts`.

## Summary table

| Quantity | Source | Method |
| --- | --- | --- |
| Sun altitude | `lib/solar` subsolar point | 90° minus the great-circle angle to the subsolar point |
| Sunset, sunrise, 3 twilight steps | computed | numerical crossing of a standard altitude |
| Moon RA/Dec | `lib/lunar` (Meeus Ch. 47) | ecliptic position rotated by the mean obliquity |
| Moon phase, illumination, age | `lib/lunar` (Meeus Ch. 48) | reused unchanged |
| Moonrise, moonset, culmination | computed | same crossing finder, standard altitude +0.125° |
| Planet RA/Dec | `lib/planets` (JPL approximate elements) | heliocentric difference, light-time corrected, rotated to the equator |
| Altitude and azimuth | `lib/celestial` (Meeus 13.5/13.6) | reused unchanged |
| Meteor shower rates | shipped IAU MDC / IMO catalogue | `lib/meteor-showers` observed-rate estimate |
| ISS passes | committed CelesTrak element set | SGP4 via `lib/iss` `nextPasses` |
| Planet brightness | published (Mallama & Hilton 2018) | magnitude **range**, not computed for tonight |

No new data file was added for this tab, and no network request beyond the two static files the
Meteor Showers and ISS tabs already fetch.

## 1. Sun altitude without a separate solar model

The Sun stands in the zenith at the subsolar point, so its altitude anywhere else is 90° minus the
great-circle angle to that point:

$$ \cos z = \sin\varphi \sin\varphi_s + \cos\varphi \cos\varphi_s \cos(\lambda - \lambda_s), \qquad h = 90° - z $$

with $(\varphi_s, \lambda_s)$ the subsolar latitude and longitude from `lib/solar`. This reuses the
declination and equation-of-time model the Earth globe's day/night terminator already uses, so the
terminator and the sunset time on this page cannot disagree.

Verified by the textbook noon identity: at local solar noon the altitude equals
$90° - |\varphi - \delta|$, asserted for four latitudes across both solstices and an equinox.

## 2. Rise, set and twilight, found numerically

There is **no closed-form hour-angle shortcut here**. `findCrossings` samples the body's altitude on
a grid (5 minutes by default), detects sign changes against a target altitude, and bisects each one
to the second.

Standard altitudes (Meeus Ch. 15):

| Event | Target altitude |
| --- | --- |
| Sunrise, sunset (upper limb) | −0.833° (refraction 34′ + semi-diameter 16′) |
| Civil twilight | −6° |
| Nautical twilight | −12° |
| Astronomical twilight | −18° |
| Moonrise, moonset | +0.125° (includes the mean-parallax allowance) |

The reason for doing it this way is that **the awkward cases stop being special cases**. Nothing in
the code knows what a polar circle is; the states fall out of whether the crossings exist:

- **`midnight-sun`** — no horizon crossing and the Sun is up.
- **`polar-night`** — no horizon crossing and the Sun is down. Note the interesting detail the test
  suite pins: at Longyearbyen (78.2° N) on the December solstice the Sun still climbs to about
  −11.7° around local noon, so there are roughly **15** hours of true astronomical darkness per day,
  not 24.
- **`no-astronomical-darkness`** — the Sun sets and rises but never reaches −18°. This is the
  documented mid-summer condition above roughly 48.5° latitude, which is why London gets it in June
  and Reykjavik gets it for months.

Each state carries a sentence explaining that it is a real state of the sky rather than missing data
(`STATE_NOTE`).

**One edge case worth recording**, because the first implementation got it wrong: testing only
`prev * next < 0` for a sign change silently drops a crossing that lands *exactly* on a sample
point, and then drops it again on the following step (the previous difference is now zero), so a
body sitting precisely at the target altitude at a sample instant would never rise or set at all.
`findCrossings` handles the exact zero explicitly, and a unit test with a linear ramp crossing at a
grid point guards it.

## 3. Moon and planet positions

The Moon's ecliptic longitude, latitude and distance come from `lib/lunar` and are rotated onto the
equator with the mean obliquity of date (Meeus 22.2):

$$ \sin\delta = \sin\beta\cos\varepsilon + \cos\beta\sin\varepsilon\sin\lambda, \qquad
\tan\alpha = \frac{\sin\lambda\cos\varepsilon - \tan\beta\sin\varepsilon}{\cos\lambda} $$

Planets are geocentric differences of heliocentric positions, iterated twice for light time (the
same correction `lib/dwarf-moons` uses), then rotated the same way.

Both are **geocentric, not topocentric**. For the Moon that matters: parallax moves it by up to
about a degree, which is why the +0.125° standard altitude (which absorbs the mean parallax) is
used, and why lunar rise and set are quoted as good to a few minutes rather than seconds.

Validation anchors, all published rather than self-generated:

- Mercury's solar elongation never exceeds ~28°, Venus's never ~47°, sampled daily over two years.
- The outer planets do reach opposition (elongation > 170°).
- Each planet's geocentric distance stays inside the range its semi-major axis allows.
- The Moon's declination stays inside the ±28.7° major-standstill limit over a full draconic cycle,
  and does exceed the ±18° minor limit.
- The Moon's distance stays between 356,000 and 407,000 km.
- The full Moon of 2024-01-25 17:54 UTC rises within 1.2 hours of sunset, and the new Moon of
  2024-01-11 11:57 UTC shares the daytime sky with the Sun. (Same syzygies as `lib/lunar.test.ts`,
  so the two files cannot drift apart.)

## 4. The darkness score

$$ \text{score} = 100 \times \min\left(1, \frac{\text{darkHours}}{6}\right) \times \left(0.35 + 0.65 \times \frac{\text{moonlessDarkHours}}{\text{darkHours}}\right) $$

Two inputs, both computed on the same page and both displayed beside the score, with the formula
printed under it so a reader can check the arithmetic instead of trusting it.

Choices worth defending:

- **Six hours** of astronomical darkness counts as a full night. Beyond that the limit is the
  observer, not the sky.
- **The 0.35 floor.** A bright Moon ruins faint targets, but the Moon itself, the planets and the
  bright stars are all still there, so a moonlit night is not a zero.
- **`moonlessDarkHours` is clamped to `darkHours`.** It is counted on a one-minute grid, which can
  round up past the exact dark interval it is a subset of. A part must never exceed its whole,
  because the ratio above depends on that.

The score is **not a forecast**. See the honesty note at the top.

## 5. What is deliberately not computed

- **Apparent planet magnitudes for tonight.** A correct value needs a per-planet phase-angle
  photometric model (Mallama & Hilton 2018). We show the published magnitude **range** and label it
  as a range, rather than rendering a precise-looking number we did not compute.
- **Cloud cover, seeing, transparency, limiting magnitude.** No data, so no claim.
- **Topocentric parallax** beyond the standard-altitude allowance.
- **Meteor rates as predictions.** They are the catalogued ZHR scaled by activity and radiant
  altitude, for an ideal sky and a perfect observer, so they run high against real counts. A shower
  whose radiant has not risen is reported as producing nothing *yet*, which is a different statement
  from a shower the IMO marks variable and publishes no ZHR for.
- **Time zones.** Times render in the visitor's device time zone. The geometry is correct for the
  chosen place, but the clock beside it belongs to the reader, which the page says.

## Verification methodology note

`lib/tonight.test.ts` holds 56 tests. Published day lengths at the June solstice (London
16 h 38 m, Boston 15 h 17 m, Sydney 9 h 54 m) are asserted to within about six minutes, which is the
honest accuracy of the low-precision solar model plus a constant refraction term. The remaining
tests are textbook identities (the noon-altitude relation, the geometric mean sitting at the
midpoint of a log axis), physical invariants that must hold for any correct implementation
(elongation caps, standstill limits, `moonlessDarkHours ≤ darkHours` at five sites across four
seasons), and null-safety and determinism checks. Nothing is pinned to a previous run of this code.
