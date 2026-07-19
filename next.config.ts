import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No secrets, no rewrites, no experiments. The app is a static-ish shell +
  // one cache/proxy route handler (/api/gibs/[layer]) — see
  // .claude/skills/vercel-compute-architecture for the compute decision.
  reactStrictMode: true,

  // satellite.js v7 (used by lib/iss for SGP4 on the ISS tab) re-exports an
  // emscripten WASM runtime whose Node execution path statically imports
  // `node:module` / `node:worker_threads`. The browser only uses satellite.js's
  // pure-JS SGP4 (propagate / gstime / transforms); those WASM runtimes are
  // re-exported but reached only through a dynamic import that never runs in the
  // browser. Webpack still tries to build those lazy chunks and errors on the
  // `node:` scheme, so — for the CLIENT bundle only — rewrite those two builtins
  // to bare names and stub them. No effect on the JS we call, the server build,
  // or any other route. (next dev is broken in this environment; verify by build.)
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
    // The same never-executed emscripten runtimes also use top-level await;
    // silence those third-party warnings (the code path is dead in the browser).
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /satellite\.js[\\/]wasm-build/ },
    ];
    return config;
  },
};

export default nextConfig;
