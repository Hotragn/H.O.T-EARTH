# Seismic Earth: what is measured, what is computed

**Honesty rule for this tab.** The USGS feed supplies four things per event: where, how deep, how
big, and when. **Everything else on the page is computed here**, and every computed quantity is
either validated against a published value or refused where the model would stop being right.

**Nothing on this page predicts earthquakes.** Gutenberg-Richter is a statistical description of a
catalogue, not a forecast. Nobody can currently predict individual earthquakes.

Implemented in `lib/quakes.ts`, validated by 47 unit tests in `lib/quakes.test.ts`.

## Data

| | |
| --- | --- |
| Source | USGS Earthquake Hazards Program GeoJSON feeds |
| Licence | public domain (US Government work) |
| Key required | none |
| Feeds read | `all_day` (last 24 h) and `all_week` (last 7 days, all magnitudes, ~1.4 MB) |
| Committed mirror | **none, deliberately** |

The missing mirror is a decision, not an oversight. The ISS tab commits a TLE because an orbital
element set is a *state* that stays propagable as it ages. A list of earthquakes is a list of
*events*: showing yesterday's as today's would be a lie, so when USGS is unreachable this tab says
so and renders nothing.

`all_week` is used rather than the smaller `2.5_week` deliberately. The 2.5+ feed is
**pre-truncated** at magnitude 2.5, which destroys the thing this tab is about: with the small end
cut off there is no rollover to see, and any completeness estimator simply returns the feed's own
threshold.

Non-earthquake rows (quarry blasts, explosions, ice quakes) are dropped **and counted on screen**.
Silently folding a quarry blast into an earthquake statistic is wrong in a way the reader cannot
see.

## 1. Energy from magnitude

$$ \log_{10} E \,[\mathrm{J}] = 1.5M + 4.8 $$

This is the relation that makes magnitude scales finally make sense:

| Step | Energy ratio |
| --- | --- |
| 1 magnitude | $10^{1.5} \approx 31.6\times$ |
| 2 magnitudes | exactly $1000\times$ |
| M8 | $\approx 6.3\times10^{16}$ J |
| M6 | $\approx 6.3\times10^{13}$ J, about one Hiroshima device |

It is **radiated seismic** energy: not the total energy released (much goes into fracturing rock and
heat), and not shaking at any particular place. A deep M6 under the ocean and a shallow M6 under a
city radiate the same energy and are not the same event.

A consequence the tab shows because it is counter-intuitive and real: **in almost any window the
single largest earthquake radiates more energy than every other earthquake combined.** A test builds
one M7 against a thousand M4s and asserts the M7 holds more than 95% of the budget.

## 2. Seismic moment

$$ M_0\,[\mathrm{N\,m}] = 10^{1.5M_w + 9.1} \quad \text{(Hanks \& Kanamori 1979)} $$

Validated against published moments:

| Earthquake | Published $M_w$ | Published $M_0$ | Computed |
| --- | --- | --- | --- |
| Tohoku 2011 | 9.0–9.1 | ~3.9–5.3 ×10²² N m | 4.0×10²² at 9.0 |
| Valdivia 1960 | 9.5 | ~2×10²³ N m | 2.0×10²³ |

Moment is only quoted for events actually reported on a **moment scale** (`mww`, `mw`, …). Applying
it to an `mb` or `ml` reading is a category error, so the UI names the scale and declines rather
than converting.

## 3. Depth classes

Shallow < 70 km, intermediate 70–300 km, deep > 300 km. The bands are not arbitrary: below about
70 km, rock at that pressure should deform ductilely rather than fracture, so intermediate and deep
events occur almost exclusively inside cold subducting slabs. Nothing on Earth produces earthquakes
below about 700 km.

## 4. Gutenberg-Richter, the rollover, and a method that did not work

$$ \log_{10} N(\geq M) = a - bM $$

The headline b-value is Aki's (1965) maximum-likelihood estimator with the Shi & Bolt (1982)
uncertainty:

$$ b = \frac{1}{\ln 10 \,(\bar{M} - (M_c - \Delta M/2))}, \qquad
\sigma_b = 2.30\, b^2 \sqrt{\frac{\sum (M - \bar{M})^2}{n(n-1)}} $$

MLE rather than least squares on the cumulative curve, because cumulative counts are not
independent observations (every event appears in every bin below it), so least squares understates
the uncertainty. The straight line on the chart is still drawn by least squares, because that is
what a line through those points *is*.

### The rollover

A frequency-magnitude plot of any real catalogue rolls over at the small end. That rollover is **not
physics and not a shortage of small earthquakes**: those events happened, and the network did not
detect or report them. Fitting through it is the classic error, and the cost is measured rather than
asserted. A test builds a catalogue complete above M4.5 that keeps only 5% of smaller events:

| Fit | Result |
| --- | --- |
| From $M_c$ = 4.5 (honest) | b ≈ 0.99 against a true 1.0 |
| From M3.0 (through the rollover) | b ≈ 0.81, an **18% error** |
| r² of the wrong fit | > 0.9 |

The wrong answer looks convincing. That is what makes it worth a test.

### Why $M_c$ is published here, not estimated

The obvious move is to estimate $M_c$ from the feed. **It does not work on this data, and the tab
says so on screen instead of hiding it.** Two standard estimators are implemented and run live:

| Method | $M_c$ it returns | b that follows |
| --- | --- | --- |
| Maximum curvature | ~1.1 | ~0.36 |
| b-value stability (Cao & Gao 2002) | ~2.0 | ~0.34 |
| **Published global cut, 4.5** | 4.5 | **0.96 ± 0.07** |

Only the last is inside the published global range of 0.8–1.2. Neither estimator is buggy: both are
correctly finding a feature of the data. The problem is the data. **A global feed is not one
catalogue**, it is dozens of regional networks with different detection thresholds glued together.
California, Alaska and Hawaii report magnitude 1 events over a small area; most of the planet
reports nothing below about 4.5. No single completeness magnitude makes that mixture complete, so
every data-driven estimator describes the mixture instead of a detection limit and returns a
confident number in the wrong place.

Both estimators are kept, tested, and **displayed next to the published cut**, because a confident
estimator being this wrong is a more useful thing to show than a tidy number.

The estimators themselves are verified against synthetic catalogues drawn from a *known* b by
inverting the Gutenberg-Richter CDF (testing a fit against its own output would prove nothing):

- Aki MLE recovers b = 0.8, 1.0 and 1.25 to within 0.05.
- Its uncertainty shrinks as $1/\sqrt{n}$: 100× the events cuts σ by 6–15×.
- b-stability, on a *synthetic* mixed-network catalogue (2% of events below 4.5 survive), climbs
  past the max-curvature answer and recovers Mc > 4.0 with b in 0.8–1.3. It works when the mixture
  has one clean step; the real feed does not.
- Max curvature is asserted to find the peak of a non-cumulative distribution, which is all it
  claims to do.

Published expectation for comparison: the global b-value is close to **1.0**, usually between 0.8
and 1.2. b near 1 means each magnitude step up makes earthquakes about ten times rarer while each
one radiates about 32 times the energy.

## 5. Distance and wave arrival

Great-circle distance delegates to `lib/eclipses`' `greatCircleKm` rather than carrying a second
haversine, so the two tabs cannot disagree about how far apart two points on Earth are. Verified
against the published New York–London distance (~5,570 km).

P and S arrivals use fixed crustal velocities (6.1 and 3.55 km/s, a P/S ratio of ~1.72, close to the
$\sqrt{3}$ of a Poisson solid) and are **refused beyond 1,000 km**. Past regional distances the ray
dives into the mantle, where velocity climbs with depth and bends the path, so a constant-velocity
estimate stops being approximately right and starts being wrong. Doing it properly needs a real
velocity model (IASP91 or AK135), which this app does not ship, so it declines to guess. A test
asserts the refusal.

The S−P interval reproduces the classic field rule of thumb: distance in km ≈ 8 × the S−P interval
in seconds, for crustal paths.

## 6. What is deliberately not done

- **No prediction.** See the top of this document.
- **No plate-boundary overlay.** Not shipped, not needed: the epicentres draw the boundaries.
- **No intensity or shaking model.** Converting magnitude and distance to felt intensity needs
  empirical ground-motion prediction equations that are region-specific. We show energy and say
  plainly that it is not shaking.
- **No aftershock forecasting**, no ETAS, no probability of a larger event to follow.
- **No energy-proportional marker sizes.** Energy goes as $10^{1.5M}$, so an energy-true marker for
  a magnitude 7 would be thirty thousand times the area of a magnitude 3 and would cover a
  continent. Radius scales as $m^{1.35}$, which is a legibility choice and is stated as one.
- **No tsunami assessment.** The feed's tsunami flag is passed through as "USGS issued a message",
  which is what it means, and nothing is inferred from it.

## Verification methodology note

Every expectation in `lib/quakes.test.ts` is a published seismology value, a textbook identity, or a
recovery test against a synthetic catalogue with a known parameter. Nothing is pinned to a previous
run of this code. Parsing is fuzzed against garbage input (`null`, numbers, strings, malformed
features) and asserted never to throw, with dropped rows counted in two separate buckets so the UI
can report what it discarded and why.
