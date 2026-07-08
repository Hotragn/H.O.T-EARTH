---
name: globe-3d-visualization
description: Patterns for the H.O.T 3D planet renderer — react-three-fiber globe, data-layer textures from WMS, day/night shader, wind particles, lat/lon picking, performance budgets.
---

# 3D Globe & Geospatial Visualization

Stack: Next.js (App Router) + react-three-fiber + drei + three.js. All globe components are client components (`"use client"`) and dynamically imported with `ssr: false`.

## Sphere + data layers
- Base: `SphereGeometry(radius, 128, 96)` (or higher for terrain later). Equirectangular textures map directly: `u = (lon+180)/360`, `v = (90-lat)/180` — three.js sphere UVs already match if rotated so lon 0 faces +Z correctly; verify with a known landmark before trusting picking math.
- Data layers as **full-globe equirect snapshots from GIBS WMS** (EPSG:4326, e.g. 4096×2048), one request per layer per date — far simpler than a WMTS tile pyramid on a sphere and good to ~zoom level of whole-earth viewing. Cache by `{layer}/{date}` via a Next.js route handler with long s-maxage. Tile-pyramid LOD is a later optimization; don't build it for v1.
- Layer blending: shader material with base color texture + optional overlay texture + uniforms for opacity. Avoid re-creating materials on layer switch; swap texture uniforms.

## Day/night
- Compute subsolar point per frame (cheap) from [physics-env-simulation] solar math; pass sun direction as uniform.
- Fragment shader: `light = dot(normal, sunDir)`; blend day texture → night-lights texture through a smoothstep band (~ -12° to +0° solar elevation) for twilight. NASA Black Marble night lights as night texture.

## Wind particles
- CPU-simulated particle set (5–15k) advected by bilinear interpolation of the 1° u/v grid; positions on unit sphere; step in spherical coords with cos(lat) correction for du.
- Render as `THREE.Points` or fading line-trail (two-pass with additive blending). Reset particles at random when age or poles exceeded.
- Data format: flat `Float32Array`-friendly JSON `{nx, ny, lo1, la1, dx, dy, u:[], v:[]}` (same shape earth.nullschool uses), one file per timestep, ~<500KB.

## Picking (click → lat/lon)
- Raycast to sphere, take hit point in globe local space: `lat = asin(p.y/r)`, `lon = atan2(...)` matched to the same rotation convention as the textures. Test with known cities before wiring to forecasts.

## Performance budget
- 60fps target on integrated GPU: cap `dpr` at [1, 2], `powerPreference: "high-performance"`, no per-frame allocations in hot loops, texture max 4096, lazy-load non-default layers, pause RAF when tab hidden.
- Cities layer: single instanced/points geometry for thousands of city markers, never one mesh per city.

## Gotchas learned
- three.js `SphereGeometry` UV seam at ±180° lon: ensure textures wrap (`RepeatWrapping`) to avoid a visible seam line.
- GIBS daily layers lag real time by ~1 day (IMERG ~2 days); request `TIME = yesterday (UTC)` and walk back up to 3 days on missing/blank imagery (blank detectable via byte-size threshold).
- **Coordinate convention (locked, unit-tested in lib/geo.ts):** lon 0→+X, 90E→−Z, N→+Y; globe mesh unrotated. All positioning goes through `latLonToVector3`/`vector3ToLatLon` — never rotate the globe mesh or sun uniform + picking break.
- **typescript 6.0 breaks Next 15.5** (CSS side-effect imports) — pin `typescript@^5.9`.
- **r3f does not paint in occluded tabs** (RAF frozen) — browser verification of the canvas needs a visible tab; the preview harness may screenshot a black canvas. Route/API/console checks still work headless.
- Layer choices that won (side-by-side renders 2026-07-06): `VIIRS_NOAA20_Land_Surface_Temp_Day` over MODIS Terra (denser coverage); cloud-fraction layers rejected (near-opaque statistical field — true color already shows real clouds; don't fake it).
- Earth shader has one overlay slot (`overlayMap`/`overlayStrength` uniforms, swap textures in place); particle layers are separate passes (`THREE.Points`), not texture layers. `GLOBE_RADIUS = 1` exported from EarthGlobe.tsx.
- Time scrubbing via ref (`timeOffsetHoursRef`) so the globe reads per-frame without React re-renders.
- **Multi-world pattern (Earth/Living/Mars/Virtual Earth):** each world = its own `{World}App`/`{World}Canvas`/`{World}Shell`/`{World}Hud` under `components/{world}/`, dynamic-imported (`ssr:false`) from `app/{route}/page.tsx`; the shared `WorldTab` union in `NavShell.tsx` gates the tabs. Every world reuses `lib/geo.ts` and mirrors `lib/solar.ts` for its own body's orbital math (`lib/mars-time.ts` = Mars24; `lib/precession.ts` = axial precession for the time-machine sky). Keeps each `/route` at ~104kB First Load.
- **Defensive data loaders:** every data-fed layer fetches its JSON and falls back to a baked-in sample so the scene never breaks before/without data (Mars climatology, chrono cities/population/events/climate). Make loaders tolerant of field-name variants (e.g. accept both `pop` and `popByYear`) — the shipped Reba dataset uses `pop`.
- **OneDrive + Next.js `next dev` is broken on this repo path:** `next dev` crashes with `EINVAL: readlink ...\.next\...` (OneDrive intercepts Next's symlinks), so the preview browser tools can't attach. Verify with `next build` + `next start` instead. If `next build` itself throws the readlink EINVAL, `rm -rf .next` and rebuild — it's a stale/synced `.next`, not a code error.
