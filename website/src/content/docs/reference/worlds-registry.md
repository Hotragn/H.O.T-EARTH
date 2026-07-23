---
title: Worlds registry API
description: The types, data, and helper functions in lib/worlds.ts, the single source of truth for every world.
---

`lib/worlds.ts` is the single source of truth. The navigation, command palette,
search, mobile menu, and routes all derive from it. Adding a world is mostly a
new row in `WORLDS`.

## Types

### `WorldTab`

A string-literal union of every world id. Adding a world starts by extending
this union, so the id is type-checked everywhere it is used.

### `World`

```ts
interface World {
  id: WorldTab;
  label: string;
  href: string;
  group: WorldGroupId;      // "earth" | "solar-system" | "beyond"
  blurb: string;            // one honest line describing what the view renders
  accent: string;           // hex, per-world accent for dots and fallbacks
  keywords: string[];       // extra search terms (aliases, body names)
  thumb?: string;           // optional overview thumbnail
  thumbBody?: string;       // names the body shown, when the thumb is illustrative
}
```

### `WorldGroup`

```ts
interface WorldGroup {
  id: WorldGroupId;
  label: string;
  blurb: string;
}
```

## Data

| Export | Type | Description |
| --- | --- | --- |
| `WORLDS` | `readonly World[]` | Every world, in canonical (grouped) order. |
| `WORLD_GROUPS` | `readonly WorldGroup[]` | The three groups; drives section order. |

## Helper functions

All helpers are pure. Lookups return `undefined` for an unknown id; list helpers
return `[]`.

| Function | Returns | Description |
| --- | --- | --- |
| `getWorld(id)` | `World \| undefined` | The world with this id. |
| `getGroup(groupId)` | `WorldGroup \| undefined` | The group by id. |
| `getWorldsInGroup(groupId)` | `World[]` | Worlds in a group, in order. |
| `getGroupForWorld(id)` | `WorldGroupId \| undefined` | The group a world belongs to. |
| `groupedWorlds()` | `{ group, worlds }[]` | All groups paired with their worlds. |
| `adjacentWorlds(id)` | `{ prev, next } \| null` | Neighbours in canonical order, wrapping around. Powers the `[` and `]` shortcuts. |
| `searchWorlds(query)` | `World[]` | Fuzzy search over labels and keywords. |
| `groupSearchResults(results)` | `{ group, worlds }[]` | Groups a search result set. |

## Invariants

These are enforced by `lib/worlds.test.ts`:

- Every `id` is unique, and every `href` is unique.
- Every `id` in `WORLDS` is a member of the `WorldTab` union.
- `groupedWorlds()` returns the three groups in canonical order.
- `adjacentWorlds` wraps at both ends and steps by exactly one in the interior.

## Example

```ts
import { adjacentWorlds, getWorldsInGroup } from "@/lib/worlds";

// The Beyond group, in order.
const beyond = getWorldsInGroup("beyond");

// The world after Earth (wraps to the first world at the end).
const next = adjacentWorlds("earth")?.next;
```

To add a world, see [Build your first world](/tutorials/first-world/).
