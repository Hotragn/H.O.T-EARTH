import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No secrets, no rewrites, no experiments. The app is a static-ish shell +
  // one cache/proxy route handler (/api/gibs/[layer]) — see
  // .claude/skills/vercel-compute-architecture for the compute decision.
  reactStrictMode: true,
};

export default nextConfig;
