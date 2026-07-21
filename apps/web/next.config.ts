import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Workspace packages ship raw TypeScript source (no build step — see the
  // Monorepo Layout decision notes) — transpilePackages lets Next's SWC
  // compiler transpile them directly instead of requiring a prebuilt dist.
  transpilePackages: ["@maya-x/ui", "@maya-x/types"],
};

export default nextConfig;
