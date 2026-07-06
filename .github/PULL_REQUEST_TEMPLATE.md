<!--
Thanks for contributing to H.O.T Earth. Keep the description tight: what changed and why.
The checklist below is the same one maintainers use to review. Ticking it honestly makes review fast.
-->

## What & why

<!-- One or two sentences. What does this PR do, and what problem does it solve? Link any related issue with "Closes #123". -->

## How to test

<!-- Steps a reviewer can follow to see it working. -->

## Checklist

- [ ] `npm run build` passes locally.
- [ ] `npx vitest run` passes (added or updated tests for new logic where it makes sense).
- [ ] **No fake data.** Every number this PR puts on screen traces to a data source or a documented calculation.
- [ ] **Anything simulated is labeled as simulated** in the UI, right where it appears.
- [ ] If this adds or changes a data source, its license and endpoint are logged in [`docs/DATA_SOURCES.md`](../docs/DATA_SOURCES.md) in this same PR.
- [ ] The project stays **keyless** — no new required API keys or `.env` config (a new source needing a key ships with a keyless fallback).
- [ ] Positioning still goes through `lib/geo.ts`; the globe mesh is not rotated (coordinate convention is locked).
- [ ] No new per-frame allocations in `useFrame` loops; heavy scenes stay dynamically imported (60fps budget on integrated graphics).

## The honesty rule

This project's credibility rests on one rule: **every number on screen traces to a real data source or a documented calculation, and anything simulated is labeled as simulated.** By opening this PR you confirm your change respects it.

## Screenshots / recording

<!-- For any visual change, a before/after screenshot or short clip. -->
