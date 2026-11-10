import type { NextConfig } from "next";

import { noindexHeaderRules } from "./src/modules/shared/lib/search-privacy";
import { securityHeaders } from "./src/modules/shared/lib/security-headers";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  cacheComponents: true,
  outputFileTracingIncludes: {
    "/checkin/offline-shell": ["./public/scanner-assets/manifest.json"],
    "/sw.js": ["./public/scanner-assets/manifest.json"],
    "/i/*/invitation.pdf": ["./src/modules/invitations/fonts/*.ttf"],
  },
  experimental: {
    // Verification-only cold runs; normal builds retain the framework default.
    turbopackFileSystemCacheForBuild: process.env.FONT_COLD_BUILD !== "1",
  },
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
      {
        source: "/admin/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
      ...noindexHeaderRules(),
    ];
  },
};

export default nextConfig;
