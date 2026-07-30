# Satellites and Space Debris: Data Sources (Phase 41)

Verification date: **2026-07-30**. Companion to `SATELLITES_PHYSICS.md`. Records
exactly what the "Satellites" tab ships, where it came from, and what it leaves out.

## The catalogue

| Field | Value |
| --- | --- |
| Source | CelesTrak GP (General Perturbations) element sets, OMM JSON format |
| Endpoint | `https://celestrak.org/NORAD/elements/gp.php?GROUP=<group>&FORMAT=json` |
| Retrieved | 2026-07-30 |
| Shipped file | `public/data/satellites/catalog.json` (about 0.87 MB) |
| Objects tracked | **14,186** across the groups below |
| Objects shipped | **4,813** |
| Credit | Orbital data: US Space Force (18th Space Defense Squadron) via CelesTrak (celestrak.org) |
| Licence | The element sets originate as US Government work (public domain). CelesTrak charges no fee and imposes no attribution condition; its binding rule is its [usage policy](https://celestrak.org/usage-policy.php). |

### Groups

| Group | Tracked | Shipped | Sampled? |
| --- | --- | --- | --- |
| Crewed stations (`stations`) | 23 | 23 | no |
| Starlink (`starlink`) | 10,873 | 1,500 | **yes** |
| OneWeb (`oneweb`) | 651 | 651 | no |
| GPS (`gps`) | 32 | 32 | no |
| Geostationary belt (`geo`) | 570 | 570 | no |
| Iridium 33 collision debris | 110 | 110 | no |
| Cosmos 1408 ASAT debris | 3 | 3 | no |
| Fengyun-1C ASAT debris | 1,924 | 1,924 | no |

### The one place we sample, and why we say so

Starlink alone is **10,873** tracked objects. Propagating and drawing all of them
with SGP4 in a browser tab, alongside everything else, is not realistic, so we
ship **1,500 evenly sampled** (every *n*th record, not the first 1,500, so the
shell stays representative rather than clustered by catalogue order).

This is the tab's one deliberate incompleteness, so it is handled the honest way:
the **true tracked count is stored per group** in the file's `meta.groups` and is
displayed next to the drawn count in the interface. The tab says "1,500 of 10,873
drawn", never "10,873 satellites" over a picture of 1,500. Every other group is
complete, so the debris counts in particular are exact and citable.

## CelesTrak usage policy compliance

CelesTrak asks that machine consumers fetch at most once per update (GP data
refreshes roughly every two hours), cache rather than poll, and stop on non-200
responses. This tab is a **committed mirror**: one machine fetched the groups once,
the result is a static file, and every visitor reads that file from the CDN
instead of querying CelesTrak. That is the same pattern the ISS tab already uses
(`docs/ISS_DATA_SOURCES.md`), and it is what the policy asks for.

## Element-set staleness is surfaced, not hidden

An element set is only good near its epoch: SGP4 along-track error grows by
roughly 1-3 km per day, so a week-old set can be tens of kilometres off. The file
stores each object's `EPOCH`, `lib/satellites.ts` computes the age, and
`accuracyNote()` turns that age into a plain sentence shown in the interface
("Element set 3.2 days old: expect roughly 6 km of along-track error"). The tab
never presents a position as more precise than the data supports.

## What this tab does NOT contain

- **No conjunction or collision predictions.** Screening for close approaches
  needs covariance data that public GP element sets do not carry. We show where
  objects are and where they cluster; we do not tell you what might hit what.
- **No untracked debris.** Estimates put the number of sub-10 cm fragments in the
  hundreds of thousands to millions, but they are not in any public catalogue.
  The tab says so rather than implying the tracked set is all of it.
- **No object sizes, masses or radar cross-sections.** Not in GP data, so not
  shown. The dots are drawn at a fixed marker size, which is labelled as a marker
  and not a physical scale (a Starlink satellite drawn to scale on a globe this
  size would be far smaller than one pixel).
- **No live feed.** See the mirror note above.

## Cross-references

- `ISS_DATA_SOURCES.md` covers the ISS element-set mirror and the same CelesTrak
  policy reasoning. The ISS appears in both tabs, from the same source.
- Propagation uses `satellite.js` (SGP4), already used and verified by the ISS
  tab; `lib/satellites.ts` deliberately does not reimplement it.

## Reproducing the data file

```sh
for g in stations starlink oneweb gps-ops geo \
         iridium-33-debris cosmos-1408-debris fengyun-1c-debris; do
  curl -s "https://celestrak.org/NORAD/elements/gp.php?GROUP=$g&FORMAT=json" -o "$g.json"
  sleep 2   # be polite
done
```

Then trim each record to the SGP4 elements (`MEAN_MOTION`, `ECCENTRICITY`,
`INCLINATION`, `RA_OF_ASC_NODE`, `ARG_OF_PERICENTER`, `MEAN_ANOMALY`, `BSTAR`)
plus name, NORAD id and epoch, sample Starlink as described, and record the true
counts in `meta.groups`.
