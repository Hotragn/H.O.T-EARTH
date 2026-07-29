import type { NextConfig } from "next";

/**
 * satellite.js v7 (used by lib/iss for SGP4 on the ISS tab) re-exports an
 * emscripten WASM runtime whose Node execution path statically imports
 * `node:module` / `node:worker_threads`. The browser only uses satellite.js's
 * pure-JS SGP4 (propagate / gstime / transforms); those WASM runtimes are
 * re-exported but reached only through a dynamic import that never runs in the
 * browser. Bundlers still try to resolve them and fail on the `node:` scheme, so
 * for the CLIENT bundle only we stub them out.
 *
 * Both bundlers need telling, because Next 16 uses Turbopack for `next dev` and
 * webpack only when `next build --webpack` is passed (see package.json).
 */
const nextConfig: NextConfig = {
  // No secrets, no rewrites, no experiments. The app is a static-ish shell +
  // one cache/proxy route handler (/api/gibs/[layer]) — see
  // .claude/skills/vercel-compute-architecture for the compute decision.
  reactStrictMode: true,

  // Turbopack (default for `next dev` on Next 16): alias the Node builtins to an
  // empty module for the browser. This is Turbopack's equivalent of webpack's
  // `resolve.fallback: false`.
  turbopack: {
    resolveAlias: {
      "node:module": { browser: "./lib/empty-module.ts" },
      "node:worker_threads": { browser: "./lib/empty-module.ts" },
      module: { browser: "./lib/empty-module.ts" },
      worker_threads: { browser: "./lib/empty-module.ts" },
    },
  },

  // Webpack (used for production builds via `next build --webpack`). Keeping the
  // original, proven workaround: rewrite the `node:` scheme away and stub the
  // bare builtins, then silence the top-level-await warnings from those same
  // never-executed emscripten runtimes.
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:(module|worker_threads)$/,
          (resource: { request: string }) => {
            resource.request = resource.request.replace(/^node:/, "");
          }
        )
      );
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        module: false,
        worker_threads: false,
      };
    }
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /satellite\.js[\\/]wasm-build/ },
    ];
    return config;
  },
};

export default nextConfig;
