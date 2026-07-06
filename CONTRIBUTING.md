# Contributing to H.O.T Earth

Thanks for your interest. This project values honest engineering: real data, real physics, and claims that are backed by something you can run.

## Dev setup

```bash
git clone https://github.com/Hotragn/H.O.T-EARTH.git
cd H.O.T-EARTH
npm install
npm run dev        # http://localhost:3000
```

No API keys needed — every data source is keyless. That's a property we protect: if you add a data source that requires a key, it needs a keyless fallback or it won't be merged.

Useful commands:

```bash
npm run build      # must pass before any PR
npx vitest run     # unit tests (solar geometry, geo conversions, wind interpolation)
python scripts/wind/fetch_wind.py   # regenerate wind data locally (requests + numpy)
```

## Ground rules

1. **No fake data.** Every number rendered must trace to a source in [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) or a documented calculation. If you add a dataset, log its license there in the same PR.
2. **Honest forecasting.** Model claims are validated on held-out data with persistence as the reference baseline. Never present our baselines as competitive with national weather services. See [model/output/MODEL_CARD.md](model/output/MODEL_CARD.md) for the format.
3. **Coordinate convention is locked.** All positioning goes through `lib/geo.ts` (`latLonToVector3` / `vector3ToLatLon`). Don't rotate the globe mesh.
4. **Performance budget:** 60fps on integrated graphics, no per-frame allocations in `useFrame` loops, dynamic-import heavy scenes.
5. **Licensing:** by contributing you agree your code is MIT. Data licenses (CC-BY for Open-Meteo, etc.) are separate and documented per source.

## Good first issues

Check the issue tracker for `good first issue` labels. Typical starter work: new GIBS imagery layers (verify them against GetCapabilities first), UI polish, additional cities in the Living Earth view, docs improvements.

## Roadmap context

Phase 1 is Earth. Phase 2 is Mars (real dust storms, CO2 seasonal cycle from mission data). Phase 3 is the Moon (surface temperature, illumination, libration — no fake "weather"). If you want to contribute to a future phase, open a discussion first; the phase gates are deliberate.
