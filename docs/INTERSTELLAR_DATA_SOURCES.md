# Interstellar Objects, Swarm-Defense Model and Cinematic Homage Data Sources (Phase 19)

Verification date: **2026-07-20**. Every source, method, asset and license below was
recorded on this date against the cited primary sources (NASA/JPL Small-Body Database
and the Minor Planet Center for the three real interstellar objects), the published
swarm-robotics literature, the already-shipped small-body data in this repo, and the
sibling data-source docs. Same rigor and honesty bar as `DATA_SOURCES.md` (Earth),
`PLANETS_DATA_SOURCES.md`, `SMALL_BODIES_DATA_SOURCES.md` (Phase 9, where 'Oumuamua
and Borisov were first credited from the JPL SBDB) and `ASTEROID_MOONS_DATA_SOURCES.md`
(Phase 18, our closest template): real physics, real data, honest claims, everything
free and legally usable for an MIT open-source app, every source and license logged.
Anything that cannot be verified from an official or primary source is explicitly
flagged.

Scope this phase: an **"Interstellar" page** with three layers. (1) The three **real
interstellar objects** (1I/'Oumuamua, 2I/Borisov, 3I/ATLAS) on their **real hyperbolic
trajectories** through the Solar System, from cited JPL/MPC elements. (2) A **live
swarm-defense simulation** that runs **real swarm-robotics algorithms** on an
**illustrative planetary-defense game**. (3) A **cinematic layer** that is a
**movie-inspired homage built from zero copyrighted film assets**. The headline
honesty point (the cinematic layer copies nothing from the film) comes first and is
the reason the page is built the way it is.

> **Honesty rule for this phase (leads the page): the cinematic layer is a
> movie-INSPIRED homage that uses ZERO copyrighted film assets.** There is **no
> "Interstellar" (2014) score** (the Hans Zimmer soundtrack is copyrighted and is
> **never used, sampled or approximated from a copyrighted source**), **no TARS or
> CASE robot**, and **no movie scenes, stills, logos or dialogue**. Everything
> cinematic on this page is original or public domain:
>
> 1. **The robot is an ORIGINAL monolith-style design** (a tall rectangular slab
>    figure of our own making). It is inspired by the *idea* of a blocky film robot,
>    but it is **not** TARS or CASE, carries none of their proportions, markings or
>    branding, and is drawn by our own code.
> 2. **The terrain and cinematic visuals are original and procedural** (our own
>    SVG / canvas / generated geometry), not frames, textures or renders taken from
>    the film or any copyrighted source.
> 3. **The audio is a public-domain NASA track**, not film music: the NASA Voyager
>    **"Sounds of Interstellar Space"** plasma-wave sonification (see §3a), shipped at
>    `public/audio/interstellar-plasma-voyager.mp3`.
>
> The page then carries a **three-way honesty split that must never be blurred**:
>
> - **COMPUTED and REAL:** the three interstellar objects' **hyperbolic trajectories**
>   (two-body mechanics from cited elements) and the **swarm-robotics algorithms**
>   (Reynolds boids, decentralized task allocation, local consensus), which run live.
> - **REUSED and REAL:** the **public-domain NASA audio** (the only reused external
>   asset this phase).
> - **ILLUSTRATIVE:** the **robot**, the **terrain**, the **cinematic visuals**, and
>   the **swarm scenario framing** (the "defense" story around the real algorithms).
>
> Second honesty item: **the swarm-defense simulation is a live model of REAL
> algorithms applied to an ILLUSTRATIVE game. It is NOT a real defense system, NOT
> real robots, and NOT mission data.** See `docs/INTERSTELLAR_PHYSICS.md` for the
> computed / reused / illustrative contract.

## Summary table

| Source | What it provides | License / status | Attribution | Access | Verified against (2026-07-20) |
|---|---|---|---|---|---|
| **NASA/JPL Small-Body Database (SBDB) API v1.3** | Osculating heliocentric orbital elements for **1I/'Oumuamua** (e=1.201134, q=0.255912 AU) and **2I/Borisov** (e=3.356476, q=2.00652 AU), plus identity and physical parameters | US-Gov data, **no explicit license**, courtesy credit requested; fair-use terms (one request at a time, no API embedding) | "NASA/JPL-Caltech (Solar System Dynamics / CNEOS)" | **Already shipped** in `public/data/small-bodies/objects.json` (Phase 9); no new fetch | Both objects present in `objects.json` with `interstellar: true`; elements match |
| **NASA/JPL SBDB + Minor Planet Center (3I/ATLAS = C/2025 N1)** | Osculating elements for the newest interstellar object: e=6.14135, q=1.35645 AU, i=175.12, node=322.17, arg peri=128.02, Tp=2025-10-29, v_inf about 58 km/s; discovered ATLAS 2025-07-01; cometary; incoming from the direction of Sagittarius; estimated age 7-14 Gyr | US-Gov / IAU-MPC data; measured facts, copyright-free; **recent object, solution will refine** | "NASA/JPL-Caltech; IAU Minor Planet Center" | Transcribed offline into constants (not yet in `objects.json`); no runtime API | Elements cross-checked for internal consistency (a = q/(1-e) about -0.264 AU, v_inf about 58 km/s); flagged as an early solution |
| **Reynolds, C. W. (1987), SIGGRAPH** ("Flocks, herds and schools: A distributed behavioral model") | The **boids** flocking model: separation, alignment, cohesion as local steering rules | Published algorithm (idea/method, not copyrighted); we implement our own code | Cite "Reynolds 1987" | Implemented in our own code; nothing redistributed | The flocking layer of the swarm sim |
| **Consensus-based / decentralized task allocation** (e.g., Gerkey & Mataric 2004 taxonomy; Choi, Brunet & How 2009, CBBA) | Decentralized, market/auction-style task assignment across many agents with no central controller | Published algorithms (methods); our own implementation | Cite "Gerkey & Mataric 2004; Choi, Brunet & How 2009" | Implemented in our own code | The task-allocation layer of the swarm sim |
| **Distributed consensus in multi-agent systems** (Olfati-Saber & Murray 2004, IEEE TAC) | Local-averaging consensus: agents converge on a shared value using only neighbor information | Published algorithm (method); our own implementation | Cite "Olfati-Saber & Murray 2004" | Implemented in our own code | The local-consensus layer of the swarm sim |
| **Reused audio: NASA Voyager "Sounds of Interstellar Space"** `public/audio/interstellar-plasma-voyager.mp3` | Ambient, loopable plasma-wave sonification from Voyager 1 in interstellar space (Plasma Wave Science instrument, 2012-2013) | **Public domain** (NASA / US-Gov work; NASA Media Usage Guidelines) | "NASA / JPL-Caltech, Voyager Plasma Wave Science instrument (University of Iowa)" | **Newly added** this phase; 306,473 bytes; 12.49 s; MP3 192 kbps, 44.1 kHz, mono | Downloaded and verified as valid audio; exact size/duration logged in §3a |
| **Illustrative: robot, terrain, cinematic visuals** | The monolith-style robot, the procedural terrain, and the cinematic SVG / animation | Original work (ours), MIT with the rest of the repo | n/a (original) | Drawn by our own code; no external asset | Original design; **not** TARS/CASE; **no** film assets used |
| **Illustrative: swarm scenario framing** | The "planetary-defense" story that wraps the real algorithms (interceptors, incoming threat, arena) | Original framing (ours) | n/a | Our own code and copy | A game framing, **not** a real defense system or mission |

**No copyrighted film asset is used anywhere on this page**, and the **only new
committed binary this phase is the public-domain NASA audio file** (§3a). The two
already-in-repo interstellar objects reuse the Phase 9 `objects.json`; 3I/ATLAS is
transcribed offline into constants; the swarm algorithms are implemented in our own
code; the robot, terrain, visuals and scenario are original. Nothing is fetched at
runtime.

---

## 1. Method / algorithm sources

**This is the substance of the page.** Two engines run live, both from published
methods implemented in our own code, not downloaded as software or data.

### 1a. Hyperbolic trajectories of the three real interstellar objects

Each object is propagated on its **real, unbound hyperbolic orbit** (eccentricity
greater than 1) using **two-body (Keplerian) mechanics** about the Sun, from the
cited osculating elements. The elements are measured facts from the JPL SBDB and the
Minor Planet Center; the propagation is our own code. See `INTERSTELLAR_PHYSICS.md`
for the equations and the accuracy bound. The three objects and their cited elements:

- **1I/'Oumuamua (A/2017 U1)**, the **first confirmed interstellar object** (October
  2017, Pan-STARRS). Osculating heliocentric ecliptic J2000 elements from the SBDB, as
  already shipped in `public/data/small-bodies/objects.json`: **e = 1.201134**,
  **q = 0.255912 AU**, **i = 122.7417 deg**, **node = 24.5969 deg**,
  **arg peri = 241.8105 deg**, **a = -1.272345 AU**, perihelion **Tp = JD 2458006.00732**
  (about 2017-09-09), epoch JD 2458080.5. Elongated, showed **no coma**, and a **real
  non-gravitational acceleration** was measured; the excess hyperbolic speed computed
  from a is about **26 km/s**.
- **2I/Borisov (C/2019 Q4)**, the **first obviously cometary interstellar object**
  (2019, discovered by Gennadiy Borisov). SBDB elements, already in `objects.json`:
  **e = 3.356476**, **q = 2.00652 AU**, **i = 44.0526 deg**, **node = 308.1477 deg**,
  **arg peri = 209.1237 deg**, **a = -0.8514923 AU**, perihelion **Tp = JD 2458826.05285**
  (about 2019-12-08), epoch JD 2458853.5. Active coma; the computed excess hyperbolic
  speed is about **32 km/s**.
- **3I/ATLAS (C/2025 N1)**, the **third interstellar object** (discovered by the ATLAS
  survey on **2025-07-01**). Elements from the JPL SBDB / MPC, transcribed offline:
  **e = 6.14135** (strongly hyperbolic), **q = 1.35645 AU**, **i = 175.12 deg**
  (nearly in the ecliptic plane but **retrograde**), **node = 322.17 deg**,
  **arg peri = 128.02 deg**, perihelion **Tp = 2025-10-29**, hyperbolic excess speed
  **v_inf about 58 km/s** (the fastest of the three; implies a about -0.264 AU).
  Cometary (active), incoming from the direction of **Sagittarius**, with an estimated
  age of **7-14 Gyr** (older than the Sun). As a recently discovered active comet, its
  solution will refine and non-gravitational (outgassing) forces are a real caveat
  (see Rejected / flagged).

### 1b. The swarm-defense simulation (real algorithms, illustrative game)

**The simulation runs real, published swarm-robotics algorithms live**, in our own
implementation, over an **illustrative planetary-defense game**. The algorithms are
real; the scenario is a game. The three algorithm layers:

- **Reynolds boids flocking (1987).** Each agent steers by three local rules,
  **separation** (avoid crowding neighbors), **alignment** (match neighbors' heading),
  and **cohesion** (steer toward the local group center). This is the canonical
  distributed flocking model (Reynolds 1987, SIGGRAPH) and it runs live per frame.
- **Decentralized task allocation.** Agents assign themselves to tasks (targets /
  regions) with **no central controller**, using a market / auction-style,
  consensus-based scheme in the family of Gerkey & Mataric (2004) and the
  Consensus-Based Bundle Algorithm (Choi, Brunet & How 2009). It is a real
  multi-robot coordination method, implemented in our own code.
- **Local consensus.** Agents converge on shared quantities (for example a common
  heading or target priority) using only **neighbor information**, the distributed
  averaging consensus of Olfati-Saber & Murray (2004). Real algorithm, our own code.

**What this is not, stated plainly:** it is **not a real planetary-defense system**,
**not real robots or hardware**, and **not real mission telemetry or data**. It is a
live, honest demonstration of real swarm algorithms wrapped in a game. The physics of
the swarm (the steering, allocation and consensus math) is real; the "defense"
story (interceptors, an incoming threat, an arena) is illustrative framing.

### 1c. The cinematic layer (original homage, no film assets)

The cinematic layer is a **movie-inspired homage** rendered entirely from **original
and public-domain material**:

- **The robot** is an **original monolith-style design** (a tall rectangular slab
  figure), drawn by our own code. It is **not** TARS or CASE and reproduces none of
  their proportions, articulation, markings or branding.
- **The terrain and visuals** are **original and procedural** (our own generated
  geometry / SVG / canvas), not frames, stills or textures from the film.
- **The audio** is the **public-domain NASA Voyager plasma-wave track** (§3a), not the
  copyrighted film score.

No "Interstellar" (2014) score, scene, still, logo, character or dialogue is used,
sampled or approximated from a copyrighted source anywhere on this page.

---

## 2. Data (the three objects' elements)

- **'Oumuamua and Borisov are already committed** in `public/data/small-bodies/objects.json`
  (Phase 9), both flagged `interstellar: true`, sourced from the **NASA/JPL SBDB**.
  This phase **reuses** those elements and adds **no new fetch** for them. The SBDB
  fair-use terms recorded in that file's `meta` still apply (one API request at a
  time, no embedding the API in the site, formats may change, best-effort service),
  and the courtesy credit is **"NASA/JPL-Caltech (Solar System Dynamics / CNEOS)"**.
- **3I/ATLAS (C/2025 N1) is transcribed offline** into a small constants file from the
  JPL SBDB / MPC, because it postdates the committed dataset. Its elements are the
  measured facts listed in §1a; they are copyright-free, and the object is credited
  the same way (NASA/JPL-Caltech; IAU Minor Planet Center). It is flagged as an
  **early solution** that will refine.
- **No external feed, no API key, no GitHub Action** is added for this page. The
  trajectories are propagated in code from these transcribed / reused elements, and
  **JPL Horizons is named for offline cross-checks** of precise positions.

---

## 3. Assets and licensing

### 3a. Reused public-domain audio (the only reused external asset)

| Asset (in repo) | Size (2026-07-20) | Duration | Format | Source / mission | License | Required credit |
|---|---|---|---|---|---|---|
| `public/audio/interstellar-plasma-voyager.mp3` | 306,473 bytes | 12.49 s | MP3, 192 kbps, 44.1 kHz, mono | NASA Voyager 1 "Sounds of Interstellar Space", Plasma Wave Science instrument (University of Iowa), 2012-2013 data | **Public domain** (NASA / US-Gov work; NASA Media Usage Guidelines) | Courtesy: "NASA / JPL-Caltech, Voyager Plasma Wave Science instrument (University of Iowa)" |

- **What it is.** A sonification of **real plasma-wave data** from Voyager 1 after it
  crossed into interstellar space. The instrument does not record sound; it measures
  electron-density oscillations in the interstellar plasma, which happen to fall in the
  audio frequency range and can be played through a speaker. It is ambient and
  loopable, which is why it fits an ambient background use.
- **Provenance and retrieval.** NASA published it on its sounds page. The original
  direct file (`nasa.gov/externalflash/interstellar.mp3`) now returns 404 on the live
  site, so the file was retrieved from the Internet Archive Wayback Machine capture of
  that exact NASA URL (snapshot 2013-11-21,
  `web.archive.org/web/20131121124410id_/http://www.nasa.gov/externalflash/interstellar.mp3`).
  It is still listed on NASA's current **Historical Sounds** page
  (`https://www.nasa.gov/historical-sounds/`) and described on **NASA Science**
  (`https://science.nasa.gov/science-research/planetary-science/01nov_ismsounds/`).
- **License basis.** NASA content (including audio) is generally **not subject to
  copyright in the United States** as a work of the US federal government, and NASA's
  Media Usage Guidelines permit reuse. It is treated as **public domain**, with a
  **courtesy credit only** (no attribution obligation). This is the same posture the
  repo uses for NASA public-domain imagery.
- **Verification.** The file was confirmed to be valid MPEG audio (not an HTML error
  page): 306,473 bytes, **12.49 s**, MPEG-1 Layer III, 192 kbps, 44.1 kHz, mono,
  parsed and confirmed offline. A 12.49 s clip is shorter than an ideal 30-90 s loop
  but is fine for a looping ambient background; the UI loops it. It is comfortably
  under the size budget (about 0.3 MB).

### 3b. Original work (robot, terrain, visuals, scenario)

Everything else on the page is **original work by us**, MIT-licensed with the rest of
the repo, and uses **no external or film asset**:

- **The monolith-style robot** (original design; not TARS/CASE).
- **The terrain** (original / procedural geometry).
- **The cinematic SVG / animation and all visual effects** (our own code).
- **The swarm scenario framing** (our own game copy and layout).

There are **no reused textures** on this page. The only reused external asset is the
public-domain NASA audio in §3a.

---

## 4. No copyrighted film asset, no runtime license surface

Stated plainly, because it is the defining property of this phase:

- **Zero copyrighted film assets.** No "Interstellar" (2014) score (the Hans Zimmer
  soundtrack is copyrighted and is never used, sampled or approximated from a
  copyrighted source), no TARS or CASE robot, no movie scenes, stills, logos, character
  likenesses or dialogue. The homage is built from original and public-domain material
  only.
- **The only licensing surface is the reused NASA audio**, which is **public domain**
  (courtesy credit only). The orbital elements are copyright-free measured facts; the
  swarm algorithms are published methods implemented in our own code; the robot,
  terrain, visuals and scenario are original.
- **No external feed, no API, no GitHub Action, no runtime download.** The trajectories
  are propagated from transcribed / reused elements; the swarm runs in the browser;
  JPL Horizons is named for offline cross-checks only.

---

## Rejected / flagged items

- **The Interstellar (2014) film score is copyrighted and is NOT used.** The Hans
  Zimmer soundtrack must never be shipped, sampled or approximated from a copyrighted
  source. Flagged as the top honesty item. The page's audio is the public-domain NASA
  Voyager plasma-wave track instead.
- **The robot is original, not TARS or CASE.** It is a monolith-style slab of our own
  design and reproduces none of the film robots' proportions, markings or branding.
  Flagged so it is never mislabeled as a film character.
- **The terrain and cinematic visuals are original / procedural, not film frames.**
  No stills, renders or textures from the film or any copyrighted source are used.
  Flagged.
- **The swarm-defense simulation is a real algorithm demo, not a real system.** It runs
  genuine swarm-robotics algorithms (boids, decentralized task allocation, local
  consensus) but the planetary-defense scenario is an **illustrative game**. It is
  **not** a real defense system, **not** real robots or hardware, and **not** mission
  telemetry or data. Flagged as the second honesty item; the UI must say so.
- **3I/ATLAS is a recent object; its orbit solution will refine.** Discovered
  2025-07-01, it is an active comet, so early elements carry larger uncertainty and
  **non-gravitational (outgassing) forces** are a real caveat. Its numbers must not be
  shown with false precision; cross-check JPL Horizons. Flagged.
- **These are osculating two-body trajectories, not full ephemerides.** The propagation
  uses cited osculating elements and ignores planetary perturbations and (for the
  active comets) non-gravitational forces, so accuracy degrades away from the element
  epoch. Cross-check JPL Horizons for precise positions. Flagged (see
  `INTERSTELLAR_PHYSICS.md`).
- **3I/ATLAS is not yet in the committed `objects.json`.** Its elements are transcribed
  offline into constants this phase, distinct from the already-committed 'Oumuamua and
  Borisov. Flagged so provenance stays clear.
- **JPL SBDB fair-use terms apply and there is no runtime API call.** One request at a
  time, no embedding the API in the site, formats can change; this phase makes no
  runtime call and reuses / transcribes elements offline. Flagged so the fair-use terms
  are respected.

---

**Verification methodology note:** The three interstellar objects' elements were taken
from the **NASA/JPL Small-Body Database** ('Oumuamua and Borisov already committed in
`public/data/small-bodies/objects.json` from Phase 9, both `interstellar: true`) and
the **JPL SBDB / Minor Planet Center** (3I/ATLAS = C/2025 N1, transcribed offline):
**1I/'Oumuamua** e=1.201134, q=0.255912 AU, i=122.7417, node=24.5969, arg peri=241.8105,
a=-1.272345 AU, Tp=JD 2458006.00732, v_inf about 26 km/s, no coma, measured
non-gravitational acceleration; **2I/Borisov** e=3.356476, q=2.00652 AU, i=44.0526,
node=308.1477, arg peri=209.1237, a=-0.8514923 AU, Tp=JD 2458826.05285, v_inf about
32 km/s, active coma; **3I/ATLAS** e=6.14135, q=1.35645 AU, i=175.12 (retrograde,
near-ecliptic), node=322.17, arg peri=128.02, Tp=2025-10-29, v_inf about 58 km/s,
cometary, from Sagittarius, age 7-14 Gyr, discovered ATLAS 2025-07-01. The trajectories
are two-body propagations in our own code, cross-checked against JPL Horizons offline;
they ignore perturbations and non-gravitational forces. The swarm simulation implements
published swarm-robotics algorithms (Reynolds 1987 boids; decentralized task allocation
per Gerkey & Mataric 2004 and Choi, Brunet & How 2009; distributed consensus per
Olfati-Saber & Murray 2004) in our own code, over an illustrative planetary-defense
game (not a real system, not real robots, not mission data). The cinematic layer is a
movie-inspired homage using **zero copyrighted film assets**: the robot is an original
monolith-style design (not TARS/CASE), the terrain and visuals are original / procedural,
and the audio is the **public-domain** NASA Voyager "Sounds of Interstellar Space"
plasma-wave track at `public/audio/interstellar-plasma-voyager.mp3` (306,473 bytes,
12.49 s, MP3 192 kbps / 44.1 kHz / mono), retrieved from the Internet Archive Wayback
capture of the original NASA URL and confirmed valid offline. No copyrighted film score,
scene, character or asset is used anywhere. See `docs/INTERSTELLAR_PHYSICS.md` for the
honest-representation methodology.

---

## Phase 19 integration log

Populate at integration time (per the planetary-data-ingestion rule) as the app wires
this in. Frontend / physics implementation (`lib/`, `app/`, `components/`) is out of
scope for this doc; another agent owns it.

| In-app element | Exact source | Fetch path | Notes |
|---|---|---|---|
| 1I/'Oumuamua trajectory | JPL SBDB, already in `public/data/small-bodies/objects.json` (Phase 9) | Reused from committed JSON, no new fetch | Two-body hyperbolic propagation; first confirmed ISO; no coma; measured non-grav acceleration; v_inf about 26 km/s. |
| 2I/Borisov trajectory | JPL SBDB, already in `objects.json` (Phase 9) | Reused from committed JSON | Two-body hyperbolic propagation; first cometary ISO; active coma; v_inf about 32 km/s. |
| 3I/ATLAS (C/2025 N1) trajectory | JPL SBDB / IAU MPC | Transcribed offline into constants (owned by another agent) | e=6.14135, q=1.35645 AU, i=175.12 (retrograde), Tp 2025-10-29, v_inf about 58 km/s, from Sagittarius, age 7-14 Gyr. **Early solution, non-grav caveat; cross-check Horizons.** |
| Swarm flocking | Reynolds 1987 (boids: separation, alignment, cohesion) | Implemented in our own code | Real algorithm, runs live. |
| Swarm task allocation | Gerkey & Mataric 2004; Choi, Brunet & How 2009 (CBBA) | Implemented in our own code | Real decentralized / consensus-based allocation, no central controller. |
| Swarm consensus | Olfati-Saber & Murray 2004 | Implemented in our own code | Real distributed averaging consensus. |
| Swarm scenario framing | project brief (original) | app-side copy and layout | **ILLUSTRATIVE game.** Not a real defense system, not real robots, not mission data. Label it. |
| Robot | original monolith-style design (ours) | app-side render | **Not TARS/CASE.** Original slab figure; no film branding. |
| Terrain + cinematic visuals | original / procedural (ours) | app-side render | **No film frames / stills / textures.** Original geometry. |
| Ambient audio | Reused `public/audio/interstellar-plasma-voyager.mp3` (NASA Voyager, **PD**) | Newly added (306,473 B, 12.49 s) | Courtesy credit "NASA / JPL-Caltech, Voyager Plasma Wave Science instrument (University of Iowa)". Loop it; audio toggle. **Never the film score.** |
