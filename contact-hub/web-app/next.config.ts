import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const gateway = (process.env.API_GATEWAY_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${gateway}/api/:path*` }];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
