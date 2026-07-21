import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@maya-x/ui", "@maya-x/types"],
  // The Admin Panel is an internal tool — per the Design System (§10) and
  // Enterprise Architecture, it must never be indexed by search engines.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
