# Stars: Data Sources (Phase 43)

Verification date: **2026-07-30**. Companion to `STARS_PHYSICS.md`.

## No new data was fetched

This world adds **no data file**. It reads the star catalogue already shipped for
the Night Sky tab and derives astrophysics from it, which is why there is nothing
new to license or credit beyond what the app already carries.

| Field | Value |
| --- | --- |
| File | `public/data/night-sky/stars.json` (already in the repo) |
| Catalogue | HYG database v4.4, compiled from Hipparcos, the Yale Bright Star Catalogue and Gliese |
| Source | <https://codeberg.org/astronexus/hyg> |
| Licence | **CC BY-SA 4.0** |
| Attribution | Star data: HYG database v4.4 (c) astronexus / David Nash, CC BY-SA 4.0, compiled from Hipparcos, Yale Bright Star Catalog and Gliese. Derived subset shared under the same CC BY-SA 4.0. |
| Selection | All stars with apparent magnitude <= 6.5 (the naked-eye limit) |
| Epoch | J2000.0 |
| Rows | **9,029** |

### Columns used

The file declares its own `columns` array:
`["id","ra","dec","mag","ci","dist_ly","spect","name","bayer","con"]`.

This world uses four of them, all **measured**: apparent visual magnitude
(`mag`), B-V colour index (`ci`), parallax distance in light years (`dist_ly`),
and spectral type (`spect`). Proper names follow the IAU Working Group on Star
Names.

### How many stars can actually be plotted

8,820 rows carry a distance and 8,988 carry a colour index. Both are needed for
an HR diagram, so the intersection is what gets drawn: **8,787 of 9,029**.

The remaining 242 are **dropped, not estimated**. Putting a star on a scientific
diagram at a guessed temperature or distance would be fabricating a data point,
so `hrPoints` returns only rows where both axes are knowable, and the interface
states the plotted count against the catalogue total.

## The selection bias, stated up front

This is a **magnitude-limited** sample: every star in it is visible to the naked
eye. That makes it wildly unrepresentative of the real stellar population, and the
tab says so rather than letting the diagram imply otherwise. Classifying the
8,787 plotted stars gives:

| Class | Count |
| --- | --- |
| Giant | 4,112 |
| Main sequence | 3,624 |
| Subgiant | 962 |
| Supergiant | 87 |
| White dwarf | 2 |

Nearly half are giants, because intrinsically luminous stars are the ones that
reach us from far away. The true population is overwhelmingly faint red dwarfs,
almost none of which appear here at all: Proxima Centauri, the nearest star after
the Sun, needs a telescope. Those counts are asserted in
`lib/stars-catalogue.test.ts` against the real shipped file, so the bias is a
tested, documented property rather than a footnote.

## What this world does NOT contain

- **No spectra.** We have photometry, so the luminosity classes are read off HR
  position ("it sits where giants sit"), which is a weaker claim than a
  spectroscopic class III and is worded that way throughout.
- **No extinction correction.** Interstellar dust reddens B-V and dims V, so
  distant stars read cooler and less luminous than they are. Not corrected, and
  called out wherever a derived radius or luminosity is shown.
- **No bolometric correction.** Luminosities are V-band ratios, so very hot and
  very cool stars come out under-luminous.
- **No masses for evolved stars.** The mass-luminosity relation only holds on the
  main sequence, so mass and lifetime are returned as `null` for anything else
  rather than computed anyway.
- **No stellar models.** Lifetimes are the standard scaling law, right to a factor
  of order unity, and labelled as such.

## Cross-references

- `NIGHT_SKY_DATA_SOURCES.md` documents this same catalogue as used for positions;
  this world uses its photometry instead. One file, two tabs, no divergence.
- `NEUTRON_STARS_PHYSICS.md` and `BLACK_HOLES_PHYSICS.md` cover the endpoints of
  the evolution this world describes.
