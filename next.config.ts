import type { NextConfig } from "next";

import { securityHeaders } from "./src/modules/shared/lib/security-headers";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  typedRoutes: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          isDev,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        }),
      },
    ];
  },
};

export default nextConfig;
