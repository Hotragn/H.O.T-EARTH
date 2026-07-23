---
title: Architecture
description: How H.O.T EARTH is layered, from the registry to pure physics libraries to react-three-fiber scenes.
---

H.O.T EARTH is a Next.js 15 App Router project with a deliberate, repeatable
shape. Understanding four layers explains the whole codebase.

## The four layers

1. **The registry (`lib/worlds.ts`).** One typed array of worlds is the single
   source of truth. The navigation, command palette, search, and mobile menu all
   derive from it. Adding a world is mostly a new row.

2. **Pure logic (`lib/`).** Physics, catalogs, and data transforms are
   dependency-free TypeScript modules with Vitest tests. They follow a
   null-safety contract: bad input returns `null` or `[]`, never throws. Numbers
   live here, where they can be tested, not in components.

3. **Scenes (`components/`).** Each world is a react-three-fiber scene plus a HUD
   and panels, following a repeatable `{World}Shell` to `{World}App` to
   `{World}Scene` pattern. Scenes read from the pure libraries and render; they
   do not do physics inline.

4. **Routes (`app/`).** One App Router folder per world. The only server code is
   a single caching image proxy (see [the compute decision](/explanation/compute-decision/)).

## Why this shape

- **One source of truth** means the nav can never drift from the routes.
- **Pure, tested logic** means every number is verifiable, which is what makes
  the [honesty mandate](/explanation/honesty-mandate/) enforceable rather than
  aspirational.
- **Thin scenes** keep the interesting logic in files you can read and test in
  isolation.

## Data freshness

Time-varying inputs (wind fields, ISS elements) are refreshed by scheduled
GitHub Actions and committed as static files, rather than fetched per request.
The runtime stays keyless and cheap; the pipeline does the work on a schedule.

## The companion

`components/companion/` and `lib/companion/` add Sprocket, an opt-in in-browser
model grounded in a knowledge base generated from the registry. It follows the
same discipline: grounding logic is pure and tested; the model is optional and
labelled. See [Add the companion to a page](/guides/add-the-companion/).

## Further reading

The repository's `docs/ARCHITECTURE.md` goes deeper on specific worlds. This page
is the mental model; that file is the detail.
