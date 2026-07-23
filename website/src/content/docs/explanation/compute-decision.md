---
title: The compute decision
description: Why almost everything in H.O.T EARTH runs in the browser, what runs on a schedule, and why there is exactly one server route.
---

A recurring question in a data-heavy app is *where does the work happen?* H.O.T
EARTH answers it three ways, and the split is deliberate.

## Three places work can run

### 1. The browser (almost everything)

Rendering, physics, orbital mechanics, the day/night terminator, search, and the
optional AI companion all run client-side. This keeps the app keyless and cheap
to host, and it means the interesting logic is inspectable in the shipped bundle.

### 2. Scheduled GitHub Actions (time-varying data)

Data that changes over time (the global wind field, the ISS orbital element set)
is refreshed by cron-scheduled GitHub Actions and committed to the repository as
static files. The app reads those files. Nothing is fetched from a paid or
keyed service at request time.

### 3. One Vercel route (image proxy only)

The single server-side route is `app/api/gibs/[layer]`, a caching proxy for NASA
GIBS satellite imagery. It adds CDN cache headers and a small day-fallback so the
upstream is not hammered and users get edge-cached tiles. It holds no secrets.
See the [GIBS proxy reference](/reference/gibs-proxy/).

## Why not a backend

A conventional backend would mean secrets, servers to run, and numbers computed
out of sight. All three work against the project's goals:

- **Keyless** keeps the barrier to running it at zero (clone, install, dev).
- **In-browser** keeps the physics visible and therefore trustworthy.
- **Static, scheduled data** keeps hosting free and the runtime simple.

## The trade-offs, honestly

- Client-side compute is bounded by the visitor's device. The scenes are budgeted
  accordingly, and the companion model is opt-in for exactly this reason.
- Scheduled data is as fresh as its last run, not real-time. For wind and orbits
  at this scale, that is the right trade; for a true real-time feed it would not be.

This is the reasoning; the rule of thumb is simple: push work to the browser,
schedule the data, and keep the one server route as thin as possible.
