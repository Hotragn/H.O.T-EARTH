# Meteor Showers Data Sources (Phase 12)

Verification date: **2026-07-18**. Every source, endpoint, column, unit, license
and count below was verified on this date against the official pages and/or by
downloading and inspecting the real data (noted per item). Anything not
verifiable from an official source is explicitly flagged. Same rigor and honesty
bar as `DATA_SOURCES.md` (Earth), `SMALL_BODIES_DATA_SOURCES.md` and
`NIGHT_SKY_DATA_SOURCES.md`: real data, real physics, honest claims, everything
free and legally usable for an open-source app, every source + license logged.

Scope this phase: a **"Meteor Showers" tab** built from the real catalog of
annual meteor showers - each shower's radiant, activity period, peak date, peak
solar longitude, entry velocity, population index, ZHR and parent body.

> **Honesty rule for this phase (from the project brief):** radiant positions,
> activity periods, peak dates, velocities and parent bodies are **REAL catalog
> data** (IAU MDC / IMO). **ZHR (Zenithal Hourly Rate) is a standardized IDEAL
> rate** - the count a single observer would see under a perfectly clear sky
> (reference limiting magnitude +6.5) **with the radiant at the zenith**. Actual
> observed rates are almost always **lower**. A meteor shower happens when Earth
> crosses a debris stream shed by a comet (or a rock-comet asteroid) - real
> physics; the radiant is a perspective effect. See
> `docs/METEOR_SHOWERS_PHYSICS.md` for the measured/computed/illustrative
> contract.

## Summary table

| Source | Data used | License / status | Attribution | Access | Verified against (2026-07-18) |
|---|---|---|---|---|---|
| **IAU Meteor Data Center (MDC)** - Shower Database | Authoritative catalog: official 3-letter IAU code + number, radiant RA/Dec, reference solar longitude, geocentric velocity Vg, parent-body links (~113 established showers) | Public **scientific catalog**; measured facts, freely usable **with citation** (no CC/PD stamp published) | Cite Jopek & Kanuchova (2017) + DB managers | Web lists + downloadable files, no key | MDC list pages (ta3.sk) + published status-report papers |
| **IMO Working List of Visual Meteor Showers** (Table 5, 2026 IMO Meteor Shower Calendar) | The exact per-shower numbers **transcribed** into `showers.json`: activity window, peak date, peak solar longitude, radiant a/d (J2000.0), V_inf, r, ZHR | IMO Calendar/site content is **Copyright (c) IMO** - reproduction of the work needs permission. We ship only the underlying **facts**, not the Calendar | "mention the source of the data" (IMO guidance) - done | Calendar PDF (imo.net), downloaded + parsed | The 2026 Calendar PDF (INFO(3-25)) + imo.net/legal-notice/ |
| **AMS (American Meteor Society)** meteor-shower calendar | **Cross-check only** for peak dates / ZHR | Content **(c) AMS**; not copied | n/a (not shipped) | amsmeteors.org calendar page | Live page |

Committed artifact (built reproducibly by
`scripts/meteor-showers/build_showers.py`):
`public/data/meteor-showers/showers.json`. This session's run: **37 showers,
20 with a known parent (17 comets, 3 asteroids), 8 parent cross-links to the
small-bodies catalog, 20.1 KB.**

---

## 1. IAU Meteor Data Center (MDC) - the authoritative scientific catalog

**Verified against:** the MDC shower-database entry pages
`http://www.ta3.sk/IAUC22DB/MDC2022/` and the shower lists
`http://www.ta3.sk/IAUC22DB/MDC2022/Roje/roje_lista.php?corobic_roje=1&sort_roje=0`
(established showers), plus the published status-report papers, on 2026-07-18.

- **What it is:** the IAU's official meteor-shower registry, operated under IAU
  Division F / Commission F1 (Working Group on Meteor Shower Nomenclature). It is
  the body that **assigns each shower its official 3-letter IAU code** (PER, GEM,
  ORI, QUA, LEO, ...) and IAU number, and holds each solution's **radiant RA/Dec,
  reference/peak solar longitude, geocentric velocity Vg (km/s)** and
  **parent-body** association. It is the reference catalog the meteor community
  cites (the same SSD-adjacent scientific-catalog role that JPL SBDB plays for
  small bodies in `SMALL_BODIES_DATA_SOURCES.md`).
- **Lists available (verified live):** "List of all showers"
  (`corobic_roje=0`), **"List of established showers"** (`corobic_roje=1`),
  "Working list of showers" (`corobic_roje=2`), and "List of removed showers"
  (`corobic_roje=4`). Each list is also downloadable. The **List of established
  showers** contained **113** showers on 2026-07-18 (the IMO 2026 Calendar cites
  **110** "established showers" as of 2025-06-13 - the number grows as the WGSN
  ratifies names, so a small discrepancy by date is expected, not an error).
- **Units:** the MDC solutions carry radiant RA/Dec in **degrees**, solar
  longitude in **degrees**, and **Vg (geocentric velocity)** in **km/s**. (The
  per-solution detail pages hold these; the top-level list view shows code/name.)
- **License / usage (honest):** the MDC pages publish **no CC or public-domain
  stamp and no single "how to cite" box** on the front page (verified - the
  homepage lists managers and contacts, no license text). It is nonetheless a
  **public scientific catalog of measured facts** (radiant, velocity, solar
  longitude, parent) - not copyrightable data - and the community's standard is
  to **cite the status-report papers**. We adopt that:
  > **Requested citation:** Jopek T.J. & Kanuchova Z. (2017), "IAU Meteor Data
  > Center - the shower database: A status report", *Planetary and Space
  > Science* **143**, 3-6 (with earlier Jopek & Jenniskens 2011 / Jopek &
  > Kanuchova 2014, and current DB managers Hajdukova, Rudawska, Neslusan et
  > al.).
  This is the same "US-gov / scientific-catalog facts, freely usable, credit
  requested" posture as JPL SBDB - we credit rather than claim a false license.
- **How we used it:** as the source of each shower's **official IAU code +
  number** and the authority for radiant/velocity/solar-longitude/parent being
  real cataloged quantities. The **exact numeric values** shipped were
  transcribed from the IMO Working List (below), which is the same underlying
  science in a single, clean, verified table; the MDC is the catalog that
  legitimizes those quantities as established facts.

## 2. IMO Working List of Visual Meteor Showers - the values we shipped, and the honest license handling

**Verified against:** the **2026 IMO Meteor Shower Calendar** PDF
(`https://www.imo.net/files/meteor-shower/cal2026.pdf`, INFO(3-25), ed. J.
Rendtel), **downloaded and parsed** on 2026-07-18 (Table 5, "Working List of
Visual Meteor Showers", p. 25), and the **IMO Legal Notice**
(`https://www.imo.net/legal-notice/`).

- **What it is:** the IMO's continuously-updated **Working List of Visual Meteor
  Showers** - described in the Calendar itself as "the single most accurate
  listing available anywhere today for visual meteor observing." Table 5 gives,
  per shower: **activity window, maximum date, maximum solar longitude
  (lambda_sun), radiant alpha/delta (J2000.0, degrees), V_inf (km/s), r
  (population index), and ZHR**. These are the **exact numbers transcribed** into
  `showers.json`.
- **ZHR - the idealized-rate definition (verified verbatim from the Calendar):**
  ZHR is "a calculated maximum number of meteors an ideal observer would see in
  perfectly clear skies (reference limiting magnitude +6.5) with the shower
  radiant overhead." **This is the crucial honesty point:** ZHR is an
  **idealization** (zenith radiant, perfect transparent sky, no Moon). **Real
  observed rates are lower** - the radiant is rarely at the zenith, and light
  pollution / Moon / horizon cut it further. Every ZHR in `showers.json` is
  labeled ideal, and the physics doc gives the honest "expected observed rate"
  correction.
- **Velocity is V_inf, not bare Vg (rigorous labeling):** the IMO column is
  **V_inf**, the pre-atmospheric (apparent) entry speed. It is close to but
  **not identical** with the IAU MDC **geocentric velocity Vg**: gravitational
  focusing means `V_inf ~= sqrt(Vg^2 + Ve^2)` with Earth escape speed
  `Ve ~ 11.2 km/s`, so the two differ most for slow showers (e.g. Draconids,
  alpha-Capricornids). We ship the value we actually verified (IMO **V_inf**) and
  **label the field V_inf** so it is never mistaken for a raw Vg. This is the
  same "ship what you verified, label it precisely" discipline used for the HYG
  RA-in-hours gotcha in the Night Sky phase.
- **LICENSE POSTURE (read carefully - this is the phase's real license question,
  handled honestly).** The IMO **Legal Notice** is **restrictive**: "No part of
  the Copyright protected structure of this website may be reproduced, stored in
  a retrieval system, distributed or transmitted in any form or by any means ...
  without the prior written permission"; all "graphics, design, images, text and
  photographs are Copyright (c) IMO except where noted"; and **hotlinking IMO
  images is prohibited**. There is **no CC / open-data licence** on the IMO
  Calendar. So:
  - We do **NOT** redistribute the IMO Calendar, its prose, its charts, its
    figures, or any IMO software. We reproduce **none** of its copyrightable
    expression.
  - What we ship are the **underlying measured scientific facts** - radiant
    coordinates, velocities, solar longitudes and activity/peak dates - which
    are **not copyrightable** (individual factual data points; the same facts are
    independently held in the IAU MDC and published across the literature), plus
    IMO's **ZHR / r estimates**, all **re-expressed in our own JSON schema**,
    with **IMO explicitly credited** as the source of the working-list values.
  - IMO's own stated expectation is to "mention the source of the data in any
    publication" - we do, in `showers.json -> meta`, the About/credits panel and
    this doc.
  - This is the **same posture as the prior NC / GPL rejections**: when a source
    is restrictively licensed we do not copy the *dataset/work*; we use the
    free underlying facts and cite. We flag the IMO copyright explicitly rather
    than pretend the Calendar is openly licensed.
- **Access note:** the Calendar PDF's `raw` bytes are Flate-encoded; a naive text
  fetch returns binary. We downloaded the PDF and extracted Table 5 with `pypdf`
  (see the verification note). No API, no key.

## 3. AMS (American Meteor Society) - cross-check only

**Verified against:** `https://www.amsmeteors.org/meteor-showers/meteor-shower-calendar/`
on 2026-07-18.

- Used **only as an independent cross-check** on peak dates and ZHR (AMS lists,
  e.g., **Perseids ZHR 100, Geminids 150, Quadrantids ~120, Orionids ~20,
  Leonids ~15** for 2026-2027 - consistent with the IMO values we shipped, except
  AMS's Quadrantid ZHR ~120 vs IMO 2026's 80; see the QUA note below).
- AMS content is **Copyright (c) 2013-2026 American Meteor Society, Ltd.** We
  **did not copy** the AMS calendar; it informed no shipped value beyond
  confirming the IMO figures were in range.

---

## What we built - `public/data/meteor-showers/showers.json`

**Built live 2026-07-18** by `scripts/meteor-showers/build_showers.py`. Real
counts and size from this session's run:

- **37 showers**, minified JSON, ASCII-safe, **20.1 KB** (20,538 bytes).
- **20 with a known parent body** (17 comets, 3 asteroids); the other 17 carry
  `parent_body: null` (parent not firmly established - not guessed).
- **8 parent cross-links** to `public/data/small-bodies/objects.json`.

### Coverage

All brief-mandated showers are present with real values: **Quadrantids (QUA),
Lyrids (LYR), eta-Aquariids (ETA), eta-Lyrids (ELY), Southern delta-Aquariids
(SDA), alpha-Capricornids (CAP), Perseids (PER), kappa-Cygnids (KCG), Aurigids
(AUR), Draconids (DRA), Orionids (ORI), Southern/Northern Taurids (STA/NTA),
Leonids (LEO), Geminids (GEM), Ursids (URS)**, plus notable others: gamma-Ursae
Minorids, alpha-Centaurids, pi-Puppids, June Bootids, Daytime Arietids, July
Pegasids, July gamma-Draconids, eta-Eridanids, September epsilon-Perseids,
September Lyncids, Daytime Sextantids, October Camelopardalids, epsilon-Geminids,
Leonis Minorids, alpha-Monocerotids, November Orionids, Phoenicids, Puppid-Velids,
December Monocerotids, sigma-Hydrids, Comae Berenicids. (This is the full IMO
2026 Working List, Table 5, minus the diffuse **Antihelion Source (ANT)** - a
year-round ecliptic background with no single radiant or peak date, deliberately
excluded rather than shipped with fake fields.)

### Schema (per shower)

```json
{
  "code": "GEM",
  "iau_number": 4,
  "name": "Geminids",
  "radiant_ra": 112.0,          // degrees, J2000.0, at maximum
  "radiant_dec": 33.0,          // degrees, J2000.0, at maximum
  "peak_date": "12-14",         // MM-DD, for 2026 (peaks drift ~+/-1 day/yr)
  "peak_solar_longitude": 262.2,// degrees (STABLE year to year)
  "active_start": "12-04",      // MM-DD (2026)
  "active_end": "12-20",        // MM-DD (2026)
  "zhr": 150,                   // IDEAL peak ZHR (zenith radiant, perfect sky)
  "velocity_kms": 35,           // V_inf (pre-atmospheric), km/s
  "r_population_index": 2.6,    // dimensionless
  "parent_body": "(3200) Phaethon",
  "parent_type": "asteroid",    // "comet" | "asteroid" | null
  "parent_designation": "3200", // small-body designation if it cross-links, else null
  "parent_in_catalog": true,    // true if parent is in small-bodies/objects.json
  "note": "..."
}
```

- **RA unit is DEGREES** (J2000.0), not hours - documented in `meta.units`. The
  radiant is the **maximum-date** radiant (radiants drift a bit across the
  activity window; the app can use the daily-drift model or just the peak value).
- **Dates are MM-DD for 2026.** Peak dates drift roughly **+/-1 day** between
  years because the calendar year and Earth's orbit are not perfectly commensurate
  (and leap years shift things); the **stable** quantity is `peak_solar_longitude`
  (Earth is at the same point in its orbit each year at the same solar longitude).
  The app should compute "which shower is at peak on date X" from the solar
  longitude, not the hardcoded 2026 date - see the physics doc.
- **`zhr: null`** for showers the IMO list marks **"Var"** (variable /
  outburst-driven: pi-Puppids, June Bootids, alpha-Monocerotids, Phoenicids) -
  they have no stable annual peak rate, so we ship null rather than a fake number.
- **`null` everywhere a parent (or value) is not well established** - never
  invented.

### Parent-body cross-links to the small-bodies catalog (verified live)

`build_showers.py` loads `public/data/small-bodies/objects.json`, reads its
designations, and sets `parent_in_catalog: true` where a shower's parent
designation is present. This session's result - **8 cross-links across 6 parent
bodies**:

| Parent (in `objects.json`) | Designation | Shower(s) that cross-link |
|---|---|---|
| 1P/Halley | `1P` | **ETA** (eta-Aquariids), **ORI** (Orionids) |
| 2P/Encke | `2P` | **STA** (Southern Taurids), **NTA** (Northern Taurids) |
| 21P/Giacobini-Zinner | `21P` | **DRA** (Draconids) |
| 55P/Tempel-Tuttle | `55P` | **LEO** (Leonids) |
| 109P/Swift-Tuttle | `109P` | **PER** (Perseids) |
| (3200) Phaethon | `3200` | **GEM** (Geminids) - an **asteroid** ("rock comet") |

**Honest flag:** the brief listed **8P/Tuttle** (the **Ursids** parent) as a
cross-link, but **8P is NOT currently in `objects.json`**, so URS's
`parent_in_catalog` is **false** and it cross-links to null. We flag this rather
than fake the link. (If 8P/Tuttle is later added to the small-bodies catalog,
re-running the build will light up the URS cross-link automatically.) The other
un-linked parents - 2003 EH1 (QUA), C/1861 G1 Thatcher (LYR), 96P/Machholz (SDA),
169P/NEAT (CAP), 2008 ED69 (KCG), C/1911 N1 Kiess (AUR), C/1983 H1 (ELY),
26P/Grigg-Skjellerup (PPU), 7P/Pons-Winnecke (JBO), 289P/Blanpain (PHO),
C/1917 F1 Mellish (MON) - are simply not in the curated small-bodies set.

### Notable honest calls in the data

- **Geminids parent is an ASTEROID.** (3200) Phaethon is a rock-comet asteroid,
  not a comet - unusual, since almost all streams come from comets. Flagged in
  the GEM note and in `parent_type: "asteroid"`.
- **Quadrantids parent is an asteroid too** - (196256) 2003 EH1, an
  extinct-comet candidate. ZHR shipped as **80** (verified IMO 2026 value); the
  QUA note records that it is a very sharp, variable peak historically quoted up
  to **~110-120** (e.g. AMS ~120).
- **kappa-Cygnids parent (2008 ED69) is tentative** - noted as such.
- **Taurid complex:** STA and NTA both trace to **2P/Encke** (the Northern branch
  also involves asteroid 2004 TG10); both cross-link to 2P and are noted as the
  Taurid complex.
- **eta-Aquariids and Orionids are the two 1P/Halley showers** - both cross-link
  to 1P, both noted.

---

## Rejected / flagged items

- **IMO Calendar is copyright, not open-licensed - we did not redistribute it.**
  Only the underlying measured facts (radiant/velocity/solar-longitude/dates) +
  IMO's ZHR/r estimates were used, re-expressed in our own schema, with IMO
  credited. IMO images must not be hotlinked (Legal Notice). Same posture as the
  Night Sky GPL rejections: restrictive source -> use free underlying facts, cite,
  do not copy the work.
- **IAU MDC publishes no license stamp and no front-page "how to cite" box** - we
  therefore describe it as "public scientific catalog, freely usable, cite the
  status-report paper (Jopek & Kanuchova 2017)", not a false CC/PD claim. Same
  honest handling as JPL SSD/CNEOS ("US-gov, freely usable, courtesy credit").
- **ZHR is idealized - stated everywhere.** ZHR assumes a zenith radiant and a
  perfect +6.5 sky; real observed rates are lower. Never presented as an
  "expected count tonight" without the altitude/sky correction (physics doc).
- **Velocity shipped is V_inf, not bare Vg** - labeled so; the two differ by
  gravitational focusing (most for slow showers). Not mislabeled.
- **Peak dates are 2026-specific and drift ~+/-1 day/yr** - the stable anchor is
  the solar longitude, which is shipped alongside. The app should key "active
  now / at peak now" off solar longitude, not the hardcoded date.
- **Antihelion Source (ANT) excluded** - it is a diffuse year-round ecliptic
  source with no single radiant or peak; shipping it with fabricated fields would
  be dishonest.
- **8P/Tuttle (Ursids parent) is not in the small-bodies catalog** - URS
  cross-link is null, flagged (not faked).
- **QUA ZHR discrepancy (IMO 2026: 80 vs AMS ~120)** - we shipped the verified
  IMO 2026 value (80) and documented the historical/AMS higher figure in the
  note, rather than silently averaging or picking the flashier number.
- **No CORS test performed / needed.** The build runs **offline** and commits
  static JSON; the browser never calls the MDC / IMO / AMS at runtime (same
  pattern as the small-bodies, night-sky and wind pipelines). Any future browser
  fetch of these hosts must verify CORS and the IMO copyright first.

---

**Verification methodology note:** the MDC lists, their names/URLs and the
established-shower count (113) were read from the live ta3.sk MDC pages; the IMO
Working List values (activity/peak/solar-longitude/radiant/V_inf/r/ZHR for all
37 showers) and the ZHR "ideal observer ... radiant overhead" definition were
extracted from a **downloaded and parsed** copy of the 2026 IMO Meteor Shower
Calendar PDF (INFO(3-25)); the IMO copyright/reuse terms from
`imo.net/legal-notice/`; the AMS figures and copyright from the AMS calendar
page; parent-body associations from the cited literature (Jenniskens 2003/2006;
Jenniskens & Vaubaillon 2008/2010 for 169P/NEAT and 2008 ED69; etc.). The
37-shower / 20-parent / 8-cross-link counts and the 20.1 KB size are from this
session's run of `scripts/meteor-showers/build_showers.py`, which computes the
cross-links live from `public/data/small-bodies/objects.json`. See
`docs/METEOR_SHOWERS_PHYSICS.md` for the measured/computed/illustrative contract.

---

## Integration log (Phase 12)

Populate at integration time (per the planetary-data-ingestion rule) as the app
wires these in.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| Meteor-shower catalog | `showers.json` (IAU MDC codes + IMO Working List values) | `public/data/meteor-showers/showers.json`, built by `scripts/meteor-showers/build_showers.py` | 37 showers; RA/Dec in degrees (J2000.0); dates MM-DD for 2026; attribution in `meta`. |
| "Active now / at peak now" | COMPUTED from date -> solar longitude | app-side (reuse `lib/solar.ts` solar-longitude) | Key off `peak_solar_longitude` + `active_start/end`, not the hardcoded 2026 date (peaks drift ~1 day/yr). |
| Radiant altitude / az | COMPUTED from observer + time | app-side (reuse `lib/celestial` alt/az, as in Night Sky) | Same LST/hour-angle machinery as the star map. |
| Approximate observed rate | COMPUTED ZHR x sin(radiant altitude), labeled approximate | app-side | ZHR is IDEAL (zenith, perfect sky); the app must label the corrected rate approximate. |
| Parent-body cross-link | `parent_in_catalog` / `parent_designation` | link to `small-bodies/objects.json` | 1P->ETA,ORI; 2P->STA,NTA; 21P->DRA; 55P->LEO; 109P->PER; 3200->GEM. 8P (URS) not in catalog. |
| Meteor streaks / debris-stream diagram | ILLUSTRATIVE | app-side render | Label "illustration, not an observation" (physics doc). |
| Required attribution | this doc / `meta.attribution` | app about/credits + README | IAU MDC (Jopek & Kanuchova 2017) + IMO Working List (2026 IMO Calendar, ed. Rendtel); AMS cross-check. |
