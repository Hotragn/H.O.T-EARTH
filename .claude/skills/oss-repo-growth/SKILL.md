---
name: oss-repo-growth
description: How to make the H.O.T repo convert visitors into stars/forks — README structure, visual assets, repo metadata, launch checklist, and the honesty-as-credibility rule.
---

# Open-Source Repo Growth & Polish

The repo is the landing page. Optimize for a visitor deciding in <10 seconds whether this is real.

## README structure (in order, above the fold first)
1. One-line pitch: what it is + what's different ("real physics, real data" is the hook).
2. Hero visual: animated GIF or high-quality screenshot of the globe, immediately after the pitch. Link to live demo right beside it.
3. Badges: license, live-demo, data-refresh workflow status. No badge spam.
4. "What makes this different" — 3–5 bullets, each one verifiable (real data sources named, honest model card linked, no fake numbers).
5. Quickstart: clone → install → run in ≤3 commands. Must actually work on a fresh machine; no keys required is a selling point, say so.
6. Architecture diagram/overview (where compute happens — link docs/ARCHITECTURE.md).
7. Data sources + attribution table (link docs/DATA_SOURCES.md).
8. Roadmap (Earth → Mars → Moon) — ambition earns stars when phase 1 is already real.
9. Contributing + license footer.

## Honesty as credibility
The fastest way to lose technical visitors is an inflated claim. "Our baseline model scores X MAE vs Y for persistence on 2025 held-out data — here's the notebook" beats "AI-powered hyper-accurate forecasting" everywhere it matters (HN, r/programming, technical Twitter). Every claim links to the code or data that backs it.

## Repo metadata checklist
- Description + website (live demo URL) + topics: `digital-twin`, `three-js`, `nextjs`, `weather`, `climate-data`, `data-visualization`, `earth`, `nasa`, `open-meteo`, `webgl`.
- Social preview image (1280×640) — screenshot of the globe. Settings → Social preview.
- LICENSE (MIT, present), CONTRIBUTING.md with dev setup + good-first-issues, issue templates.
- Pin the repo on the profile.

## Visual assets
- GIF: 10–15s screen capture — rotate globe, switch a layer, click a city, show forecast panel. <10MB for README embed. Tools: ScreenToGif (Windows), then `gifsicle -O3` to compress.
- Screenshots: dark UI on default view, one per major feature, stored in `docs/media/`.

## Launch checklist (owner does the posting; prepare materials for them)
- Working live demo link (verified from a clean browser, no console errors).
- Draft posts: Show HN (honest technical framing), r/dataisbeautiful (visual-first), r/webdev, LinkedIn.
- README screenshot/GIF renders correctly on GitHub mobile.
- First 3 good-first-issues filed so early visitors have an entry point.
