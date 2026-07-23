---
title: Contributing
description: How to contribute to H.O.T EARTH. PR flow, code style, running tests, and the one rule that governs everything.
---

Contributions are welcome. The project is MIT licensed and built to be forked,
learned from, and extended. This page is the short version; the repository's
`CONTRIBUTING.md` is the authoritative record.

## The one rule

Before anything else: contributions must honour the
[honesty mandate](/explanation/honesty-mandate/). Real physics, real data, no
fake numbers; label the illustrative; license and credit every asset. A visually
impressive PR that fabricates a value will not be merged.

## Development setup

```sh
git clone https://github.com/Hotragn/H.O.T-EARTH.git
cd H.O.T-EARTH
npm install
npm run dev
```

## Before you open a PR

Run the checks locally. All three should pass.

```sh
npm run test        # Vitest: pure logic in lib/ is fully covered
npx tsc --noEmit    # types must be clean
npm run build       # a production build must succeed
```

## Code style

- **Physics and data logic goes in `lib/`**, as pure functions with tests and the
  null-safety contract (bad input returns `null` or `[]`, never throws). Do not
  put math in components.
- **New worlds start in `lib/worlds.ts`** and follow the existing per-world
  pattern. See [Build your first world](/tutorials/first-world/).
- **Match the surrounding code:** naming, comment density, and idioms. Keep the
  mission-control aesthetic and the existing design tokens.
- **Write the notes.** A new world or data layer ships with its `*_PHYSICS.md`
  and `*_DATA_SOURCES.md`, stating accuracy bounds and credits.

## PR flow

1. Branch from `main` (for example `feature/your-world`).
2. Make focused changes with tests.
3. Ensure tests, types, and build are green.
4. Open a PR describing what is real, what is illustrative, and your sources.

## Where to ask

- [GitHub Discussions](https://github.com/Hotragn/H.O.T-EARTH/discussions) for
  questions and ideas.
- [Issues](https://github.com/Hotragn/H.O.T-EARTH/issues) for bugs and data
  problems. The "Was this page helpful?" widget on each doc page opens a
  prefilled issue for docs feedback.
