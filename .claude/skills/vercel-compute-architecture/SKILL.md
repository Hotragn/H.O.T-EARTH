---
name: vercel-compute-architecture
description: The H.O.T compute decision — what runs on Vercel vs GitHub Actions vs the browser, and why. Read before adding any server-side compute or data pipeline.
---

# Vercel Deployment Architecture for Compute-Heavy Apps

## The decision (made 2026-07-06, Phase 1)
Vercel hosts **only the Next.js frontend and thin cache/proxy API routes**. No physics, no model training, no GRIB processing ever runs on Vercel. Rationale: hobby-tier serverless limits (short execution windows, limited memory, Node-first runtime) make heavy Python compute a dead end there, and everything we need is either precomputable or cheap enough for the browser.

Heavy lifting goes to exactly three places:

| Workload | Where it runs | Output |
|---|---|---|
| GFS wind grid processing (GRIB → JSON) | GitHub Actions cron (every 6h) | compact JSON committed to `public/data/wind/` |
| Model training + validation (Python) | Locally / Actions manual dispatch, offline | coefficients + `accuracy.json` committed to `public/data/model/` |
| Model inference, solar geometry, particle sim | Browser (trivial math) | live UI |
| Imagery | Nobody — GIBS serves tiles/snapshots directly; we optionally proxy for caching | — |
| Point forecasts | Nobody — Open-Meteo is CORS-enabled, client fetches directly | — |

## Patterns
- **Actions-cron-to-static**: workflow downloads → processes → commits small artifacts to the repo → Vercel auto-redeploys (or files are fetched from raw.githubusercontent at runtime — prefer committed+deployed for cache headers and reliability). Keep artifacts <1MB; history churn is acceptable for a few files, use `--force` single-commit amend on a `data/` path if history bloat becomes a problem (or a separate `data` branch).
- **Route-handler cache proxy** for GIBS snapshots: `export const revalidate` / `Cache-Control: s-maxage=86400` keyed by layer+date. Protects GIBS, speeds up users, stays inside limits (it's just an image passthrough).
- **No secrets needed** anywhere in v1 (all sources keyless) — keeps deploy friction zero and forks trivially deployable. Preserve this property when adding sources; a keyed source needs a documented fallback.

## Vercel config notes
- Next.js at repo root, default build. `vercel.json` only if needed for headers.
- Python `model/` dir and `scripts/` are excluded from the build implicitly (not imported by the app). Keep it that way.
- If a future feature genuinely needs live server compute (e.g., on-demand regional model runs), the answer is a separate free-tier service (Fly.io/Railway/HF Spaces) behind a tiny API contract — not stretching Vercel. Document it here first.
