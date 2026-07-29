/**
 * An intentionally empty module.
 *
 * satellite.js v7 (used by lib/iss for SGP4 on the ISS tab) re-exports an
 * emscripten WASM runtime whose Node execution path statically imports
 * `node:module` and `node:worker_threads`. The browser only ever uses
 * satellite.js's pure-JS SGP4 (propagate / gstime / transforms), so those Node
 * builtins are reachable but never executed client-side. The bundler still tries
 * to resolve them, so `next.config.ts` aliases them to this file for the browser
 * (Turbopack's equivalent of webpack's `resolve.fallback: false`).
 *
 * If anything ever actually calls into this at runtime it will get an empty
 * object rather than a crash, and that would mean the WASM path is being used in
 * the browser, which it should not be.
 */
export default {};
