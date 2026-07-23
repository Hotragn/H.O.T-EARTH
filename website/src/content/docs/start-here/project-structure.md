---
title: Project structure
description: A map of the repository, so you know where the registry, physics libraries, scenes, and docs live.
---

The app is a Next.js 15 App Router project. Here is the layout that matters.

```
H.O.T-EARTH/
├─ app/                  # routes, one folder per world (App Router)
│  ├─ page.tsx           # Earth (the root route)
│  ├─ galaxies/          # /galaxies, and so on for each world
│  └─ api/gibs/[layer]/  # the single server route: a caching image proxy
├─ components/           # React + react-three-fiber scenes, HUD, panels
│  └─ companion/         # Sprocket, the in-browser AI companion
├─ lib/                  # pure, tested logic
│  ├─ worlds.ts          # THE registry: every world, in canonical order
│  ├─ galaxies.ts        # physics + catalogs (one module per domain)
│  └─ companion/         # knowledge base + retrieval for the companion
├─ public/               # shipped textures, data, audio, video (all credited)
├─ docs/                 # per-world PHYSICS + DATA_SOURCES notes, architecture
└─ website/              # this documentation site (Astro + Starlight)
```

## The three ideas to hold onto

1. **`lib/worlds.ts` is the single source of truth.** Adding a world is mostly a
   new row here. The nav, search, command palette, and mobile menu all derive
   from it. See the [Worlds registry reference](/reference/worlds-registry/).

2. **`lib/` is pure and tested.** Physics and data logic live in dependency-free
   TypeScript modules with Vitest tests and a null-safety contract (bad input
   returns `null` or `[]`, never throws). Scenes read from these; the math never
   lives in a component.

3. **Compute is pushed to the edges.** Almost everything runs in the browser.
   The only server code is one caching proxy route for satellite imagery. Read
   [the compute decision](/explanation/compute-decision/) for why.

## Where to go next

- To add a world end to end, follow [Build your first world](/tutorials/first-world/).
- To understand the layering, read the [Architecture](/explanation/architecture/).
