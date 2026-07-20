# Interstellar Objects, Swarm Model and Cinematic Homage Physics and Honest-Representation Methodology (Phase 19)

Companion to `docs/INTERSTELLAR_DATA_SOURCES.md`. Same non-negotiable bar as Earth,
Mars, the Moon, the planets, the small bodies, the dwarf planets and the moon tabs
(`physics-env-simulation` skill): **real physics and real data, or it doesn't ship. No
invented numbers.** This doc states exactly what is **COMPUTED** (the substance: the
three interstellar objects' hyperbolic trajectories and the swarm-robotics algorithms),
what is **REUSED / REAL** (the public-domain NASA audio and the cited orbital elements),
and what is **ILLUSTRATIVE / APPROXIMATE** (the robot, the terrain, the cinematic
visuals, and the swarm scenario framing).

Verification date: **2026-07-20**. Objects: **1I/'Oumuamua** (2017), **2I/Borisov**
(2019), **3I/ATLAS = C/2025 N1** (2025), the three confirmed interstellar objects. The
swarm model and cinematic layer are the other two components. This phase is about
their **trajectories** (real, unbound hyperbolic orbits), the **swarm algorithms**
(real, running live), and the **honest labeling** of the game framing and the
movie-inspired visuals.

## The overriding honesty rule: the cinematic layer copies nothing from the film

The single most important honesty statement of this phase, and the one the page must
lead with, is that **the cinematic layer is a movie-INSPIRED homage that uses ZERO
copyrighted film assets.**

- **No film score.** The "Interstellar" (2014) Hans Zimmer soundtrack is copyrighted
  and is **never used, sampled or approximated from a copyrighted source**. The page's
  audio is a **public-domain NASA track** instead (the Voyager "Sounds of Interstellar
  Space" plasma-wave sonification, `public/audio/interstellar-plasma-voyager.mp3`).
- **No film robot.** The robot is an **original monolith-style design** (a tall
  rectangular slab figure of our own making). It is **not** TARS or CASE and reproduces
  none of their proportions, articulation, markings or branding.
- **No film scenes.** The terrain and cinematic visuals are **original and procedural**
  (our own generated geometry / SVG / canvas), not frames, stills, renders or textures
  from the film or any copyrighted source. No movie logo, character likeness or
  dialogue appears.

Around that headline sit two more honest lines:

- **The swarm-defense simulation is a live model of REAL algorithms on an ILLUSTRATIVE
  game.** It runs genuine swarm-robotics algorithms (Reynolds boids, decentralized task
  allocation, local consensus), but the "planetary-defense" scenario is a game. It is
  **not a real defense system, not real robots, and not mission data.** The physics of
  the swarm is real; the story around it is illustrative.
- **The interstellar objects are real, on real hyperbolic orbits, but drawn as
  two-body osculating trajectories.** The three objects and their elements are measured
  facts; the trajectories are two-body propagations with an honestly bounded accuracy,
  cross-checked against JPL Horizons, ignoring perturbations and (for the active
  comets) non-gravitational forces.

**The real content is real; the homage is honestly labeled.** The page computes genuine
hyperbolic trajectories and runs genuine swarm algorithms, and it never dresses the
game framing or the movie-inspired visuals as anything but what they are.

## Three structural facts that shape everything

1. **The cinematic layer uses zero copyrighted film assets.** The headline above. It is
   the reason the robot is an original monolith, the terrain and visuals are original /
   procedural, and the audio is public-domain NASA plasma-wave sound, not the film
   score.
2. **The swarm runs real algorithms, but the defense scenario is a game.** The steering,
   allocation and consensus math is real and live; the interceptors-versus-threat story
   is illustrative framing, not a real system, real robots or mission telemetry.
3. **The three objects are genuinely interstellar (unbound, e greater than 1).** Their
   orbits are hyperbolic: they enter the Solar System, swing past the Sun once, and
   leave forever. This is real, measured, and it is the physical fact the trajectory
   layer is built on.

## COMPUTED: the substance

### The three interstellar objects (two-body hyperbolic mechanics)

Each object is propagated on its **real hyperbolic orbit** (eccentricity e greater than
1, semi-major axis a negative) about the Sun, from the cited osculating elements, in
our own code:

- **Hyperbolic Kepler propagation.** For a given time, the mean anomaly advances as
  M = n (t - Tp), where the hyperbolic mean motion n = sqrt(mu / |a|^3) and mu is the
  Sun's gravitational parameter. Kepler's equation in its hyperbolic form,
  M = e sinh(H) - H, is solved for the hyperbolic anomaly H (Newton iteration), then
  the true anomaly and the heliocentric radius r = a (1 - e cosh(H)) follow. The
  position is rotated into the heliocentric ecliptic J2000 frame by the node,
  inclination and argument of perihelion.
- **Hyperbolic excess speed.** The speed the object keeps at infinity is
  v_inf = sqrt(mu / |a|). Computed values: **'Oumuamua about 26 km/s**, **Borisov about
  32 km/s**, **3I/ATLAS about 58 km/s** (from the cited a; for 3I/ATLAS the reported
  v_inf about 58 km/s implies a about -0.264 AU, consistent with q/(1 - e)). These are
  computed, real quantities, not invented.
- **The cited elements** (heliocentric ecliptic J2000, osculating):
  - **1I/'Oumuamua (A/2017 U1):** e = 1.201134, q = 0.255912 AU, i = 122.7417 deg,
    node = 24.5969 deg, arg peri = 241.8105 deg, a = -1.272345 AU, Tp = JD 2458006.00732
    (about 2017-09-09), epoch JD 2458080.5. First confirmed ISO (Oct 2017); elongated;
    **no coma**; a **real non-gravitational acceleration** was measured (a stated fact).
  - **2I/Borisov (C/2019 Q4):** e = 3.356476, q = 2.00652 AU, i = 44.0526 deg,
    node = 308.1477 deg, arg peri = 209.1237 deg, a = -0.8514923 AU, Tp = JD 2458826.05285
    (about 2019-12-08), epoch JD 2458853.5. First obviously cometary ISO (2019); active
    coma.
  - **3I/ATLAS (C/2025 N1):** e = 6.14135, q = 1.35645 AU, i = 175.12 deg (nearly in
    the ecliptic plane but **retrograde**), node = 322.17 deg, arg peri = 128.02 deg,
    Tp = 2025-10-29, v_inf about 58 km/s. Discovered by ATLAS on 2025-07-01; cometary;
    incoming from the direction of **Sagittarius**; estimated age **7-14 Gyr** (older
    than the Sun). **Early solution** (recent active comet), so a non-gravitational
    caveat applies.

### The swarm-robotics algorithms (real, running live)

The swarm engine runs three **published, real** algorithms in our own implementation,
live per frame:

- **Reynolds boids flocking (1987).** Each agent applies three local steering rules:
  **separation** (avoid crowding immediate neighbors), **alignment** (steer toward the
  average heading of neighbors), and **cohesion** (steer toward the average position of
  neighbors). This is the canonical distributed flocking model (Reynolds 1987, SIGGRAPH)
  and produces emergent flocking from purely local rules, with no leader.
- **Decentralized task allocation.** Agents assign themselves to tasks (targets or
  regions) with **no central controller**, via a market / auction-style, consensus-based
  scheme in the family of Gerkey & Mataric (2004) and the Consensus-Based Bundle
  Algorithm (Choi, Brunet & How 2009). It is a real multi-robot coordination method.
- **Local consensus.** Agents converge on shared quantities (for example a common
  heading or a target priority) using only **neighbor information**, the distributed
  averaging consensus of Olfati-Saber & Murray (2004). Real algorithm, our own code.

**These are real algorithms, and their output (the flocking, the allocation, the
convergence) is genuine.** What is illustrative is only the **scenario** they are placed
in (see below), not the math.

### The accuracy bound (load-bearing)

- **Trajectories (two-body, osculating).** The propagation reproduces each object's
  path near its element epoch. It **ignores planetary perturbations** and, for the
  active comets (Borisov and 3I/ATLAS, and even 'Oumuamua's measured non-gravitational
  acceleration), **ignores non-gravitational forces**, so accuracy **degrades away from
  epoch**. Good for showing the shape and direction of the hyperbolic pass, not
  observing-grade positions. **Cross-check JPL Horizons** (offline) for precise
  ephemerides. **3I/ATLAS is additionally an early solution** and its numbers must not
  be shown with false precision.
- **Swarm.** The swarm is a **real-time simulation**, not a prediction of any real
  system. Its state depends on initial conditions, agent count and step size, and it is
  **not** reproducing any real robots, hardware or mission. The UI must present it as a
  live algorithm demo, not a forecast.
- The UI must show the bound, name JPL Horizons for critical cross-checks, and **must
  not imply minute-level or second-level positional precision**, nor imply that the
  swarm is a real defense system.

## REUSED / REAL

- **The ambient audio is a real, public-domain NASA recording.** `public/audio/interstellar-plasma-voyager.mp3`
  (306,473 bytes, 12.49 s, MP3 192 kbps / 44.1 kHz / mono) is the **NASA Voyager 1
  "Sounds of Interstellar Space"** plasma-wave sonification (Plasma Wave Science
  instrument, University of Iowa, 2012-2013 data), **public domain** (NASA / US-Gov
  work), courtesy credit "NASA / JPL-Caltech, Voyager Plasma Wave Science instrument
  (University of Iowa)". It is real interstellar plasma-density data played as sound,
  not the film score. Provenance and verification: `INTERSTELLAR_DATA_SOURCES.md` §3a.
- **The orbital elements are real, measured facts.** The 'Oumuamua and Borisov elements
  come from the NASA/JPL SBDB (already committed in `public/data/small-bodies/objects.json`,
  Phase 9); the 3I/ATLAS elements come from the JPL SBDB / MPC (transcribed offline).
  The hyperbolic nature (e greater than 1), the perihelion distances, inclinations and
  the derived excess speeds are measured / computed from those, not tuned for the
  animation.
- **The swarm algorithms are real, published methods.** Reynolds boids (1987),
  decentralized / consensus-based task allocation (Gerkey & Mataric 2004; Choi, Brunet &
  How 2009), and distributed consensus (Olfati-Saber & Murray 2004) are real algorithms,
  implemented in our own code, not invented for this page.

## ILLUSTRATIVE / APPROXIMATE

Several elements are illustrative and must be labeled honestly, or the picture is
misleading:

- **The robot is illustrative and original.** It is a monolith-style slab figure of our
  own design, an homage to the *idea* of a blocky film robot, **not** TARS or CASE, and
  it carries none of their proportions, markings or branding. It is a stylized figure,
  not a model of any real robot.
- **The terrain and cinematic visuals are illustrative and original / procedural.** Our
  own generated geometry, SVG and animation, not a real planetary surface and not film
  frames, stills, renders or textures. No copyrighted film asset is used.
- **The swarm scenario framing is illustrative.** The "planetary-defense" story
  (interceptors, an incoming threat, an arena) is a game wrapper around the real
  algorithms. It is **not** a real defense system, **not** real robots or hardware, and
  **not** mission telemetry or data. The real part is the algorithms; the illustrative
  part is the scenario they act out.
- **Rendered agent and object markers may be enlarged for legibility.** The interstellar
  objects are tiny and the swarm agents are abstract; on-screen marker sizes are a
  legibility choice, not true angular sizes. The *trajectory geometry* is honest; the
  *dot size* is a display choice.
- **The trajectory epoch and non-gravitational caveats.** The paths are two-body
  osculating propagations (see the accuracy bound); positions away from epoch are
  approximate, non-gravitational forces are omitted, and 3I/ATLAS is an early solution.

Nothing else is approximated and nothing is invented. There is no fabricated orbital
element, no faked swarm result, no copyrighted film asset, and no live feed.

## Computed vs reused vs illustrative: the labeling contract

| Signal | Category | How labeled in the app |
|---|---|---|
| 1I/'Oumuamua trajectory | **Computed (real, two-body)** | "Computed - hyperbolic two-body from JPL SBDB elements (e=1.201134); cross-check Horizons" |
| 2I/Borisov trajectory | **Computed (real, two-body)** | "Computed - hyperbolic two-body from JPL SBDB elements (e=3.356476); cross-check Horizons" |
| 3I/ATLAS trajectory | **Computed (real, two-body, early solution)** | "Computed - hyperbolic two-body from JPL SBDB / MPC (e=6.14135); early solution, non-grav caveat" |
| Hyperbolic excess speeds (v_inf) | **Computed (real)** | "Computed - v_inf = sqrt(mu/|a|): about 26 / 32 / 58 km/s" |
| Swarm flocking (boids) | **Computed / real algorithm** | "Real algorithm (Reynolds 1987), running live" |
| Swarm task allocation | **Computed / real algorithm** | "Real decentralized allocation (Gerkey & Mataric 2004; Choi, Brunet & How 2009)" |
| Swarm consensus | **Computed / real algorithm** | "Real distributed consensus (Olfati-Saber & Murray 2004)" |
| Ambient audio | **Reused / real (PD, static)** | "NASA Voyager plasma-wave sound (public domain); real interstellar plasma data" |
| Orbital elements | **Reused / real (measured)** | "Measured - JPL SBDB ('Oumuamua, Borisov) / JPL SBDB + MPC (3I/ATLAS)" |
| Robot | **Illustrative (original)** | "Original monolith-style design; not TARS/CASE; not a real robot" |
| Terrain + cinematic visuals | **Illustrative (original / procedural)** | "Original / procedural; not film frames; not a real surface" |
| Swarm scenario framing | **Illustrative (game)** | "Illustrative game; not a real defense system, not real robots, not mission data" |
| On-screen marker size | **Illustrative** | "Marker enlarged for visibility (objects/agents are tiny/abstract)" |
| Predicted positions to the second | **Not claimed** | "Bounded accuracy - two-body osculating, no perturbations / non-grav; cross-check Horizons" |
| Film score / TARS / CASE / scenes | **Not used** | "Movie-inspired homage; zero copyrighted film assets" |

Rules carried over from Earth / Mars / Moon / planets / small bodies / dwarf planets /
moons, unchanged:

- Every quantity on screen names its category and source (computed, reused/real, or
  illustrative), and for the trajectories names the two-body bound and JPL Horizons for
  cross-checks.
- No invented values; computed trajectories are never presented as observing-grade
  positions, the swarm is never presented as a real system, and the cinematic layer is
  never presented as film content.
- The only "reused" external asset is the public-domain NASA audio; the "illustrative"
  liberties are the original robot, the original / procedural terrain and visuals, the
  game scenario framing, and the enlarged markers, and every one is labeled.

## What is honestly showable this phase (crisp statement)

- **COMPUTED (the substance):** the **three interstellar objects' hyperbolic
  trajectories** (two-body Keplerian propagation from cited JPL SBDB / MPC elements,
  with computed excess speeds of about 26, 32 and 58 km/s), and the **swarm-robotics
  algorithms** (Reynolds boids flocking, decentralized / consensus-based task
  allocation, distributed consensus), all running live in our own code, no runtime API.
- **REUSED / REAL:** the **public-domain NASA Voyager plasma-wave audio** (the only
  reused external asset), and the **real, measured orbital elements** of the three
  objects.
- **ILLUSTRATIVE / APPROXIMATE:** the **original monolith-style robot** (not TARS/CASE),
  the **original / procedural terrain and cinematic visuals** (no film assets), the
  **swarm scenario framing** (an illustrative game, not a real defense system or real
  robots or mission data), the enlarged on-screen markers, and the two-body trajectory
  accuracy bound (no perturbations, no non-gravitational forces, 3I/ATLAS an early
  solution).

What we deliberately do **not** do: use any copyrighted film asset (no "Interstellar"
2014 score, no TARS or CASE, no scenes, stills, logos, likenesses or dialogue), present
the swarm game as a real defense system or real robots or mission data, invent an
orbital element or a swarm result, claim observing-grade or second-level positional
precision, fetch anything at runtime, or draw markers to a false scale without labeling
it. This page shows the **real hyperbolic trajectories** of the three genuine
interstellar objects and a **live demonstration of real swarm-robotics algorithms**,
wrapped in a **movie-inspired homage that copies nothing from the film**, with the
computed / reused / illustrative split and the accuracy bound honestly stated.
