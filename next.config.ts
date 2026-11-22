import type { NextConfig } from "next";

const CACHED_API_ROUTES = [
  "/api/models",
  "/api/models/:slug",
  "/api/compare",
  "/api/rankings",
  "/api/labs",
  "/api/labs/:slug",
  "/api/providers",
  "/api/providers/:slug",
  "/api/search",
];

const nextConfig: NextConfig = {
  async headers() {
    return CACHED_API_ROUTES.map((source) => ({
      source,
      headers: [
        {
          key: "Cache-Control",
          value: "public, s-maxage=60, stale-while-revalidate=300",
        },
      ],
    }));
  },
};

export default nextConfig;