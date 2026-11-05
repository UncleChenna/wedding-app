import "server-only";

import { allowDevPreview } from "@/modules/shared/lib/preview-access";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/modules/shared/server/db/client";
import { hasPublishedInvitation } from "@/modules/invitations/server/repository";
import { requestRateLimit } from "@/modules/shared/server/request-rate-limit";
import { requestBudgetResponse } from "@/modules/shared/server/request-budget-gate";
import { requestRetryDocument } from "@/modules/shared/server/request-retry-document";

import { authorizeAdminRequest } from "@/modules/admin/server/request-admin-access";
import { authorizeStaffRequest, staffRequestRole } from "@/modules/shared/server/request-access";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const adminBootstrap = ["/admin/sign-in", "/admin/sign-out", "/admin/mfa"].includes(path);
  if (
    !adminBootstrap &&
    (path === "/admin" ||
      path.startsWith("/admin/") ||
      path === "/api/admin" ||
      path.startsWith("/api/admin/"))
  ) {
    return authorizeAdminRequest(request);
  }
  const staffRole = staffRequestRole(path);
  if (staffRole) return authorizeStaffRequest(request, staffRole);

  const privateLookup =
    request.nextUrl.pathname.startsWith("/i/") || request.nextUrl.pathname.startsWith("/p/");
  if (privateLookup && (request.method === "GET" || request.method === "HEAD")) {
    const budget = await requestRateLimit(request.headers, "lookup");
    if (budget.status !== "allowed") {
      const response = requestBudgetResponse(budget);
      if (/^\/(?:i|p)\/[^/]+\/?$/.test(request.nextUrl.pathname)) {
        // A native body preserves 429/503; Next page rewrites reset them to 200.
        // The form reloads the current URL without embedding its credential.
        const headers = new Headers(response.headers);
        headers.set("Content-Type", "text/html; charset=utf-8");
        return new Response(requestRetryDocument(), { status: response.status, headers });
      }
      return response;
    }
  }
  // Signed pass credentials must never enter caches, referrers or search indexes.
  if (request.nextUrl.pathname.startsWith("/p/")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  if (request.nextUrl.pathname === "/dev" || request.nextUrl.pathname.startsWith("/dev/")) {
    const allowed = allowDevPreview(
      process.env.NODE_ENV,
      process.env.ENABLE_LOCAL_PREVIEWS,
      request.nextUrl.hostname,
    );
    const response = allowed
      ? NextResponse.next()
      : NextResponse.rewrite(new URL("/preview-unavailable", request.url), { status: 404 });
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  // Cached public theme data must never make private route responses browser-cacheable.
  if (!request.nextUrl.pathname.startsWith("/i/")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const token = request.nextUrl.pathname.split("/")[2];
  // Actions validate the submitted token themselves. Rewriting POST loses its action module.
  const download = request.nextUrl.pathname.split("/").length > 3;
  const available =
    request.method === "POST" || download || (await hasPublishedInvitation(db, token));
  const response = available
    ? NextResponse.next()
    : NextResponse.rewrite(new URL("/invitation-unavailable", request.url), { status: 404 });
  response.headers.set("Cache-Control", "private, no-store");
  // Strip the private path/token while retaining the origin required by native form CSRF checks.
  response.headers.set("Referrer-Policy", "strict-origin");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    "/dev/:path*",
    "/i/:path*",
    "/p/:path*",
    "/admin/:path*",
    "/checkin/:path*",
    "/kitchen/:path*",
    "/bar/:path*",
    "/api/admin/:path*",
    "/api/checkin/:path*",
    "/api/kitchen/:path*",
    "/api/bar/:path*",
    "/order/:path*",
  ],
};
