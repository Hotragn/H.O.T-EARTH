# Gravitational Waves Physics (Phase 36)

Verification date: **2026-07-29**. Companion to
`GRAVITATIONAL_WAVES_DATA_SOURCES.md`. Everything computed here lives in
`lib/gravitational-waves.ts` and is covered by 50 unit tests that check the
results against *published* values for real events, not against previous runs of
our own code.

> **Honesty rule (leads the page): the detections are real, the waveform is
> computed.** Every mass, distance, redshift and SNR is a published GWOSC value.
> The wave you see and hear is **not** the recorded strain data: it is the
> leading-order inspiral computed from those published masses. We do not ship
> LIGO's strain time series or its audio files, and the page says so where the
> waveform and the sound appear.

## Summary table

| Quantity | Method | Honest accuracy |
| --- | --- | --- |
| Chirp mass `Mc` | `(m1 m2)^(3/5) / (m1+m2)^(1/5)` | Exact algebra. Recombining the catalogue's median `m1`/`m2` gives 28.03 for GW150914 where the published `Mc` is 27.9, because those medians come from separate marginal posteriors. Difference under 0.2 Msun; tested. |
| Mass ratio `q` | `min/max` | Exact. |
| Merger frequency | GW frequency at the Schwarzschild ISCO: `c^3 / (6^(3/2) pi G M)` | **Underestimate.** Gives 68 Hz for GW150914, whose signal peaked nearer 150-250 Hz. Ignores spin and the finite mass ratio. Tested to stay at 68 Hz so the limitation cannot silently drift. |
| Ringdown frequency | Echeverria/Berti l=m=2 fit: `(c^3 / 2 pi G M_f)(1 - 0.63(1-a)^0.3)` | Good to a few per cent for the dominant mode given the remnant parameters. Gives 291 Hz for GW150914, matching the published peak. `null` when no remnant mass is published (most neutron-star mergers). |
| Remnant spin | Rezzolla et al. (2008) non-spinning fit: `a_f = 2 sqrt(3) eta - 3.871 eta^2 + 4.028 eta^3` | **Estimated, not measured.** See the note below: the GWOSC summary catalogue publishes no remnant spins, so this fit supplies one. Reproduces 0.686 for equal masses and 0.68 for GW150914 (published 0.69). Degrades as the real component spins grow. |
| Time to merger `t(f)` | `(5/256) c^5 / ((pi f)^(8/3) (G Mc)^(5/3))` | Leading-order (Newtonian quadrupole). Correct scaling; a few per cent to tens of per cent near merger, where post-Newtonian terms matter. |
| Frequency sweep `f(t)` | Inverse of the above | Same bound. Valid through the **inspiral only**, which is why `chirpTrack` stops at the ISCO estimate rather than pretending to model the merger. |
| Strain amplitude `h` | `(4/D)(G Mc/c^2)^(5/3)(pi f/c)^(2/3)` | **Order of magnitude.** Omits inclination and detector antenna pattern. Gives ~1e-21 for GW150914, the right scale; not the measured value. |
| Energy radiated | `(M_total - M_f) c^2` | Exact given the published masses. ~3.1 Msun for GW150914, about 5.5e47 J. `null` when no remnant mass is published. |
| Light-travel time | `D / c` | **Naive.** Luminosity distance is not light-travel distance; fine for the nearby events, increasingly wrong with redshift. Labelled approximate in the UI. |

## The remnant spin is estimated, and the UI says so

The GWOSC summary catalogue publishes remnant **masses** (279 of our 282 events)
but **no remnant spins at all**. Without a spin the ringdown formula cannot be
evaluated, so the honest high end of the signal would never be shown.

So `estimatedRemnantSpin` supplies one from the mass ratio using the published
Rezzolla et al. (2008) fit for **non-spinning** components. `eventRingdown`
prefers a published spin when one exists and otherwise falls back to this
estimate, returning `estimated: true` so the interface can label it. The tab
prints the ringdown as "291 Hz ringdown (est.)" and shows the **measured**
effective spin `chi_eff` next to it, because the estimate is most trustworthy
when `chi_eff` is near zero (it is -0.04 for GW150914). Nothing derived is
presented as a measurement.

## Classification and the mass gap

`classifyMerger` labels each event BBH, BNS or NSBH using a documented **3 Msun**
dividing line (`NS_MAX_MSUN`). That number is a convention, not a law: the
maximum neutron-star mass is an open question, roughly 2.0-2.3 Msun from current
observation and equation-of-state work.

Between **2 and 5 Msun** (`MASS_GAP_LO_MSUN` / `MASS_GAP_HI_MSUN`) it is
genuinely unsettled whether an object is the heaviest sort of neutron star or the
lightest sort of black hole. Any event with a component in that range is returned
with `ambiguous: true`, and the UI says "ambiguous" instead of asserting a type.
GW190814 (secondary 2.6 Msun) and GW230529 (primary 3.66 Msun) are the headline
cases, and both are tested.

## The sound is real, and that is the interesting part

For stellar-mass binaries the gravitational-wave frequency passes through tens to
hundreds of hertz in the final second, which is **inside human hearing**. So the
tab synthesises the sweep at its true frequency with no pitch shifting, and
`audibleRange` reports the top of the sweep, preferring the ringdown note when the
remnant parameters are known and falling back to the ISCO estimate otherwise.

Caveats stated in the UI:

- The sound is **synthesised from the computed sweep**, not LIGO's audio release.
- Audio is **opt-in**; nothing plays without a click.
- Very heavy systems (hundreds of solar masses) merge at a few hertz. Those are
  reported as not audible rather than being quietly pitch-shifted.

## Cross-references

- Constants `G`, `C`, `MSUN_KG`, `PC_M` are imported from `lib/black-holes.ts`,
  so this module cannot drift from the Black Holes tab.
- `BLACK_HOLES_PHYSICS.md` covers Schwarzschild radii, photon spheres and ISCO
  for single objects; `NEUTRON_STARS_PHYSICS.md` covers the neutron stars whose
  mergers appear here.

## Null-safety contract

Every exported function returns `null` (or `[]` for `chirpTrack`) on non-finite,
zero, negative or physically impossible input, and never throws. This is unit
tested for each function, including an unphysical negative radiated mass and a
remnant spin of exactly 1.
