# Launch playbook

This is a practical, honest launch checklist **for you (the owner)** to execute.
Everything here needs your GitHub account or a human click, so nothing below is
automated. Do the prerequisites first, in order, or the launch posts will point
at a broken demo and burn your one good shot.

> **The honesty rule applies to launch too.** The whole project's credibility is
> built on real data and validated, honest forecasts. Do not inflate anything in
> a post. "Beats persistence by 9.6/15.2/17.8% MAE on a 2025 holdout, here's the
> model card" is far stronger on Hacker News and technical Reddit than any
> superlative. Never claim the demo is live before it is.

---

## 0. Prerequisites (do these before posting anything)

Launch does not work without a visitor being able to *see the thing move* in the
first 10 seconds. That means:

- [ ] **Deploy the app** (Vercel, zero config: import the repo, deploy). Verify it
      loads with no console errors from a clean browser and a phone.
- [ ] **Capture the real hero screenshot** and (critically) **a GIF** — follow
      [docs/media/README.md](media/README.md). The GIF is the single highest-leverage
      asset for r/dataisbeautiful and Twitter. 10-15 s: rotate the globe, switch a
      layer, scrub the terminator, click a city for a forecast, open Living Earth.
      Compress under ~10 MB (`gifsicle -O3 --lossy=80`) and swap it into the README
      hero slot.
- [ ] **Swap the demo link.** In README.md replace the `**▶ Live demo — _deploying_**`
      line with `[**▶ Live demo**](https://YOUR-URL.vercel.app)`, and set the same
      URL as the repo website (see About settings below).
- [ ] **Green CI.** Confirm the CI badge is green (push once so the workflow runs).
      A red badge on launch day reads as "abandoned."
- [ ] **File the good-first-issues** (list at the bottom) so the first curious
      visitor has an on-ramp.

Only when all five boxes are ticked do you post.

---

## 1. Repo "About" settings (Settings sidebar → gear icon next to "About")

**Description** (paste as-is, 232 chars, within GitHub's ~350 limit):

```
An open-source, interactive 3D digital twin of Earth: daily NASA satellite imagery, a physically computed day/night terminator, live NOAA wind, click-anywhere forecasts, and an honest, held-out-validated forecast model. No API keys.
```

**Website:** set to your live Vercel URL once deployed (until then, leave blank
rather than pointing at a dead link).

**Topics** (paste these — GitHub's cap is 20; these are the 15 that matter most
for discoverability, ordered by how people actually search):

```
digital-twin
data-visualization
threejs
react-three-fiber
webgl
nextjs
typescript
nasa
noaa
open-meteo
weather
climate-data
geospatial
earth
mars
```

Check the boxes for **Releases**, **Packages** off, and **Deployments** on
(Vercel populates it) as you prefer. Enable **Discussions** here too.

---

## 2. Social preview image (so shared links show the globe)

Settings → General → scroll to **Social preview** → upload an image. Use a
1280×640 (2:1) screenshot of the globe. `docs/media/hero.png` is sized for this
once you've replaced the placeholder with the real screenshot. This is what
renders as the card on Hacker News, Reddit, X, LinkedIn, and Slack — a good one
measurably increases click-through.

---

## 3. Discussions + profile pin

- [ ] **Enable Discussions:** Settings → General → Features → check **Discussions**.
      The issue-template `config.yml` already links to it. Create a "Show and tell"
      category and a pinned welcome post.
- [ ] **Pin the repo on your profile:** your profile page → "Customize your pins"
      → select H.O.T-EARTH. This is the flagship; make it the first thing a
      recruiter or visitor sees.

---

## 4. Launch posts (drafts ready to paste)

Timing note that applies to all of them: **the demo must be live and the GIF
captured before you post.** Best windows (US audience): Hacker News and Reddit
do well Tuesday-Thursday, ~8-10am US Eastern. Post to **one** primary channel
first (Show HN or r/dataisbeautiful), watch it for the first hour to answer
comments quickly, then stagger the others over the following day or two. Do not
blast every platform in the same 10 minutes.

### Show HN (Hacker News)

Post as `Show HN`. Lead with the honesty angle; HN rewards it and punishes hype.

**Title:**

```
Show HN: H.O.T Earth – a 3D digital twin with real data, real physics, honest forecasts
```

**Body (the first comment you post right after submitting):**

```
I built an interactive 3D globe that's wired to real data and real physics end
to end, and is honest about the line between the two.

- The day/night terminator is computed, not drawn: lib/solar.ts implements the
  NOAA solar-position algorithm and is unit-tested against known solstice/equinox
  values. Scrub time and it moves exactly as the real sun does.
- The wind is the latest NOAA/NCEP GFS 10m analysis, refreshed 4x/day, advected
  by bilinear interpolation of the actual grid (antimeridian wrap included, also
  unit-tested). Only playback speed is exaggerated; the vectors are real.
- Imagery is today's NASA GIBS satellite layers (true color, land-surface temp,
  precipitation), proxied and cached.
- The forecast layer is a deliberately simple ridge baseline, validated on a
  strict 2025 temporal holdout across 20 cities with persistence as the
  reference. It beats persistence by 9.6/15.2/17.8% of MAE at 24/48/72h. The
  model card states plainly that it's an educational baseline, not a rival to
  national weather services.
- No API keys anywhere. Clone, npm install, npm run dev.

Architecture constraint: Vercel hosts only the frontend and thin caching
proxies; all heavy compute (GRIB2 decoding, model training) happens ahead of
time. A GitHub Action decodes GFS GRIB2 to compact JSON every 6h with a
pure-Python decoder (no binary deps).

Anything simulated is labeled as simulated, in the UI, where it appears. That
honesty rule is the point of the project.

Stack: Next.js 15, TypeScript, react-three-fiber, three.js. MIT licensed.
Phase 2 (Mars, real dust-storm and CO2 seasonal cycle from mission data) is in
progress.

Demo: <LIVE URL>
Code: https://github.com/Hotragn/H.O.T-EARTH
Model card: https://github.com/Hotragn/H.O.T-EARTH/blob/main/model/output/MODEL_CARD.md

Happy to answer questions about the GRIB decoder, the solar math, or the
validation methodology.
```

### r/dataisbeautiful

Visual-first. This subreddit **requires** the visual to lead and the data source
in a top comment. Post the GIF (or a short video). Follow their `[OC]` rule.

**Title:**

```
[OC] A 3D digital twin of Earth with a physically-computed day/night line and live NOAA wind
```

**Top comment (source + tools, which the sub requires):**

```
Tools: Next.js, three.js / react-three-fiber, TypeScript.
Data: NASA GIBS satellite imagery, NOAA/NCEP GFS 10m wind (refreshed 4x/day),
Open-Meteo forecasts, Natural Earth city data. All free, all keyless.

The day/night terminator is computed from the NOAA solar-position algorithm,
not drawn on. The wind is the real GFS analysis grid; only the animation speed
is exaggerated so it's visible at globe scale. Everything simulated is labeled
as such. It's open source (MIT): https://github.com/Hotragn/H.O.T-EARTH
```

### r/webdev

Engineering angle: the zero-key, precompute-everything architecture.

**Title:**

```
I built a real-data 3D Earth with zero API keys — all heavy compute runs ahead of time, Vercel only serves the frontend
```

**Body:**

```
Spent a while on an interactive digital twin of Earth and the interesting part
turned out to be the architecture constraint I set on day one: Vercel hosts only
the frontend and thin caching proxies, and every heavy workload runs elsewhere,
ahead of time.

- A GitHub Actions cron decodes NOAA GFS GRIB2 wind into compact JSON every 6h,
  using a pure-Python GRIB2 decoder with no binary dependencies (so the same
  script runs on a contributor's laptop and in CI). It byte-range-reads only the
  two wind records it needs (~53KB) instead of the 34MB full file.
- The forecast model is trained and validated offline; the browser just runs the
  exported coefficients.
- Solar geometry, particle advection, and inference all run client-side because
  they're cheap.
- NASA GIBS imagery is proxied through one Next.js route (GIBS sends no-store, so
  we add our own s-maxage); Open-Meteo is called directly (CORS, keyless).

Result: no .env, no keys, no accounts. Clone, npm install, npm run dev. Fully
forkable.

Next.js 15, TypeScript, react-three-fiber. MIT. Code and architecture writeup:
https://github.com/Hotragn/H.O.T-EARTH (see docs/ARCHITECTURE.md)
```

### r/threejs

**Title:**

```
Real-data Earth in react-three-fiber: computed terminator, GPU wind particles from GFS analysis
```

**Body:**

```
Sharing a react-three-fiber project — a digital twin of Earth driven by real
data. A few three.js-relevant bits:

- Full-globe equirectangular WMS snapshots (one 4096x2048 image per NASA GIBS
  layer per day) mapped straight onto the sphere UVs, instead of a WMTS tile
  pyramid — a whole-planet view never zooms to street level, so the LOD system
  wouldn't pay off.
- The day/night terminator is a real subsolar point from the NOAA solar-position
  algorithm, driving a twilight band shader down to -12 degrees.
- Wind is a GPU-friendly particle flow sampling the real GFS 10m grid (bilinear,
  with antimeridian wrap).
- Performance budget is 60fps on integrated graphics: no per-frame allocations
  in useFrame, heavy scenes dynamically imported.

MIT, open source, contributions welcome:
https://github.com/Hotragn/H.O.T-EARTH
```

### LinkedIn (portfolio flagship framing)

Frame as a new-grad SWE's flagship. Professional, first-person, honest.

**Body:**

```
I've been building H.O.T Earth: an open-source, interactive 3D digital twin of
our planet — and I wanted to share it.

The goal was one thing: real data and real physics, end to end, with zero fake
numbers. A few things I'm proud of:

• The day/night line is computed from the NOAA solar-position algorithm, not
  drawn on — and it's unit-tested against known solstice and equinox values.
• The wind is the actual NOAA/NCEP GFS analysis, refreshed four times a day.
• The forecast layer is a transparent baseline I validated on a strict 2025
  held-out year across 20 cities. It beats a persistence baseline by 9.6-17.8%
  of mean absolute error at 24-72 hours — and the model card says plainly that
  it's an educational baseline, not a rival to national weather services.

The engineering constraint that shaped it: all heavy compute (GRIB decoding,
model training) runs ahead of time via GitHub Actions and offline Python, so the
hosted app is a lightweight frontend with no API keys and no server compute.
Clone it and it just runs.

It's MIT licensed, and Mars is next (real dust-storm season and CO2 cycle from
mission data).

Live demo: <LIVE URL>
Code: https://github.com/Hotragn/H.O.T-EARTH

Feedback and stars very welcome. #opensource #webgl #threejs #dataviz #nextjs
```

### X / Twitter thread

```
1/ I built H.O.T Earth: an open-source 3D digital twin of the planet.

Real NASA + NOAA data. Real physics. Honest, validated forecasts. No fake
numbers, no API keys.

Demo + code below. 🧵

2/ The day/night terminator isn't drawn — it's computed from the NOAA
solar-position algorithm and unit-tested against solstice/equinox values.

Scrub time and it moves exactly like the real sun.

3/ The wind is the actual NOAA GFS 10m analysis, refreshed 4x/day and advected
across the real grid (antimeridian wrap and all).

Only the playback speed is sped up so you can see it. The vectors are real.

4/ The forecast layer is a deliberately simple baseline, validated on a strict
2025 held-out year across 20 cities.

It beats persistence by 9.6–17.8% MAE at 24–72h — and the model card says
outright it's educational, not a rival to NWS. Honesty > hype.

5/ Architecture: Vercel serves only the frontend. All heavy compute (GRIB2
decoding, model training) runs ahead of time via GitHub Actions + offline
Python.

No keys. No .env. Clone → npm install → npm run dev.

6/ Built with Next.js 15, TypeScript, three.js / react-three-fiber. MIT
licensed. Mars is next.

⭐ Code: https://github.com/Hotragn/H.O.T-EARTH
Demo: <LIVE URL>

Would love feedback from the graphics + data folks.
```

---

## 5. Good-first-issues to file (on-ramp for early visitors)

File these as issues and add the `good first issue` label. Each is real, small,
and useful. Copy the title and body.

**1. Add a GIBS aerosol layer**
```
Add an aerosol optical depth layer from NASA GIBS (e.g. MODIS_Combined_Value_Added_AOD)
as a selectable imagery layer alongside true color and precipitation.

Verify the exact layer identifier against the live EPSG:4326 `best` GetCapabilities
first, add it to the /api/gibs proxy layer map, and log the source + license in
docs/DATA_SOURCES.md in the same PR. Good intro to the imagery pipeline.
```

**2. Keyboard controls for the time scrubber**
```
The ±24h time control is mouse/touch only. Add keyboard support: left/right
arrows to step the terminator by an hour, Home to reset to "now", and a visible
focus state.

Scoped, self-contained, and an accessibility win. No new data involved.
```

**3. Unit-test the WMO weather-code map**
```
The forecast panel maps Open-Meteo WMO weather codes to labels/icons. Add a
vitest suite that asserts the mapping covers every documented WMO code and has
no gaps or duplicates.

Great first PR for someone learning the test setup (see lib/*.test.ts for the
pattern).
```

**4. Add a city to the Living Earth sample set**
```
The Living Earth view lights up 1,200 cities from Natural Earth. Add a
well-known city that's currently missing (check public/data/cities.json), keeping
the source + license note intact.

Tiny data PR; good for a first contribution. Note the city must exist in the
Natural Earth populated-places dataset, since that's the honest source.
```

**5. Show the GFS cycle timestamp in a tooltip**
```
When the Wind layer is active, the HUD shows the GFS cycle. Add a tooltip
explaining what "cycle" means and how fresh the data is (refreshed 4x/day,
analysis-time not streaming), linking to the About panel note.

Small UX clarity task that reinforces the honesty about data freshness.
```

**6. Add per-city error bars to the forecast display**
```
The model card notes error bars should come from validation residuals in
accuracy.json (per city, per lead), not be invented. Surface those residuals as
a ± band on the H.O.T baseline forecast in the UI.

Good for someone who wants to touch the honest-forecasting core. Read the model
card's Limitations section first.
```

**7. Document a one-command dev bootstrap in CONTRIBUTING**
```
Add a short troubleshooting section to CONTRIBUTING.md: common first-run issues
(Node version, WebGL not available in some headless/VM setups) and how to check
the app is rendering. Docs-only, no code.
```

**8. Add an "Are you seeing this correctly?" WebGL fallback message**
```
On machines without WebGL, the globe silently fails. Detect missing WebGL
support and render a clear, friendly message with a link to enable it, instead
of a blank canvas.

Self-contained frontend task; improves the first-run experience for the launch.
```

---

## 6. An honest note on "trending"

There's no shortcut. GitHub's trending page keys off a **burst of genuine stars
in a short window**, which you can't manufacture. The only real levers are:

1. **A live demo + a good GIF.** People star what they can see working in 10
   seconds. This is the biggest one.
2. **A strong, honest Show HN or Reddit post at a good time** (see timing above),
   where you're present to answer questions in the first hour.
3. **This polish** — green CI, community health files, clean README, on-ramp
   issues — which converts the visitors those posts send.

No bought stars, no vote rings, no reposting the same link across ten subs in an
hour. Those get flagged and torch the credibility this whole project is built on.
Do the three things above well and let the work speak.
