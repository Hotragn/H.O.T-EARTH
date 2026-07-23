---
title: Launching the H.O.T EARTH docs
description: A new home for the methods and sources behind the digital twin, built with Astro Starlight.
lastUpdated: 2026-07-23
---

_2026-07-23_

H.O.T EARTH has always shipped its homework. Every world already comes with a
physics note and a data-sources note in the repository, stating what is computed,
from which measured inputs, and how accurate each claim is. What it did not have
was a front door for all of it. This is that front door.

## Why a dedicated docs site

The app is now 25 worlds, from a live NASA-imagery globe to 18,000 real galaxies
mapped in 3D. The methodology behind them had grown into dozens of markdown files
that were easy to write and hard to browse. A documentation site turns that
material into something you can search, navigate, and link to.

It is built with **Astro Starlight**: static, fast, dark-first, with search,
keyboard navigation, and "edit this page" out of the box. It carries the same
mission-control look as the app, down to the solar-amber accent and the
terminator-and-orbit mark.

## How it is organised

The docs follow the [Diátaxis](https://diataxis.fr/) framework:

- **Tutorials** to learn by doing, starting with
  [building your first world](/tutorials/first-world/).
- **How-To Guides** for specific jobs like
  [deploying](/guides/deploy-to-vercel/).
- **Reference** for the [registry](/reference/worlds-registry/),
  [data sources](/reference/data-sources/),
  [physics methods](/reference/physics-methods/), and the
  [one HTTP route](/reference/gibs-proxy/).
- **Explanation** for the [honesty mandate](/explanation/honesty-mandate/) and
  the [architecture](/explanation/architecture/).

## The same rule, documented

The point of writing this down is not polish for its own sake. It is that a twin
you can trust has to show its work. These docs are where the work lives.

Start at the [Introduction](/start-here/introduction/), or run the whole thing
locally in about 30 seconds with the [Quickstart](/start-here/quickstart/).
