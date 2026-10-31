import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/modules/shared/server/db/client";
import { hasPublishedInvitation } from "@/modules/invitations/server/repository";

export async function proxy(request: NextRequest) {
  // Cached public theme data must never make private route responses browser-cacheable.
  if (!request.nextUrl.pathname.startsWith("/i/")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const token = request.nextUrl.pathname.split("/")[2];
  // Actions validate the submitted token themselves. Rewriting POST loses its action module.
  const available = request.method === "POST" || (await hasPublishedInvitation(db, token));
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
  matcher: ["/i/:token", "/admin/:path*", "/checkin/:path*", "/kitchen/:path*", "/order/:path*"],
};
