# Gravitational Waves Data Sources (Phase 36)

Verification date: **2026-07-29**. Companion to `GRAVITATIONAL_WAVES_PHYSICS.md`.
This file records exactly where every detection value in the "Gravitational Waves"
tab comes from, under what licence, and what is *not* included.

## The catalogue

| Field | Value |
| --- | --- |
| Source | Gravitational Wave Open Science Center (GWOSC) event portal |
| Endpoint | `https://gwosc.org/eventapi/json/GWTC/` |
| Releases included | GWTC-1-confident, GWTC-2.1-confident, GWTC-3-confident, GWTC-4.1, GWTC-5.0 |
| Retrieved | 2026-07-29 |
| Shipped file | `public/data/gravitational-waves/gwtc.json` (about 71 KB) |
| Events shipped | **282** |
| Credit | LIGO Scientific Collaboration, Virgo Collaboration and KAGRA Collaboration. Data from GWOSC (gwosc.org). |
| Licence | GWOSC data are released for free public use; see <https://gwosc.org/terms/> |

The upstream API listed 391 event entries at retrieval. We ship the **282** that
carry both component masses and a luminosity distance. The other 109 are real
detections but lack published parameter estimates (many are very recent), and a
row with no masses cannot be honestly plotted or sonified, so it is omitted
rather than filled in.

### Fields kept per event

`name`, `catalog`, `gps`, `m1`/`m2` with their 90% credible lower and upper
offsets, `mchirp`, `mtotal`, `mfinal`, `afinal` (remnant spin), `chiEff`,
`dl` (luminosity distance, Mpc) with bounds, `z` (redshift), and
`snr` (network matched-filter SNR).

All masses are **source-frame** solar masses, as published. Where a value is
absent upstream it is stored as `null` and the UI shows it as unknown; nothing is
interpolated or guessed.

### Deduplication

Several events appear in more than one catalogue release as analyses improve.
We keep one row per event name, preferring the entry from the latest release, so
each detection is counted once with its most current parameters.

## What this tab does NOT contain

- **No strain time series.** We do not ship the raw or cleaned detector data
  (the HDF5/GWF frame files on GWOSC). The waveform drawn in the tab is
  *computed* from the published masses, not a recording of the measured strain.
  That distinction is stated on the page itself.
- **No sky maps.** The published localisation is a probability sky map (FITS);
  we do not ship or approximate it, so no event is drawn at a position on the sky.
- **No audio recordings.** The sound is synthesised in the browser from the
  computed frequency sweep. It is not LIGO's released audio file.

## Cross-references

- `BLACK_HOLES_DATA_SOURCES.md` and `NEUTRON_STARS_DATA_SOURCES.md` cover the
  objects that these events are mergers *of*. The physics constants (G, c, solar
  mass, parsec) are imported from `lib/black-holes.ts` so all modules agree.

## Reproducing the data file

```sh
curl -s "https://gwosc.org/eventapi/json/GWTC/" -o gwtc-raw.json
# then filter to events with masses + distance, keep the fields listed above,
# dedupe by name preferring the latest catalogue, and sort by GPS time.
```

The shipped file records its own `meta` block with the source URL, credit,
licence, retrieval date and event count, so the provenance travels with the data.
