import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { type StaffRole } from "./staff-auth";
import { readStaffDeviceCookie } from "./staff-device-cookie";
import { readStaffSession } from "./staff-session";
import { STAFF_DEVICE_COOKIE, STAFF_SESSION_COOKIE, staffSigningKey } from "./staff-cookies";

/** Applied to success and denial: private credentials must not leak through caches or referrers. */
export function privateResponse(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export function deniedRequest(request: NextRequest, signInPath: string): NextResponse {
  // A worker must distinguish revoked/missing access from a temporary network failure.
  // Redirect:error intentionally refuses sign-in HTML, so give this data endpoint a denial.
  if (request.nextUrl.pathname === "/checkin/offline-shell") {
    return privateResponse(NextResponse.json({ state: "denied" }, { status: 401 }));
  }
  // Never redirect/replay mutation bodies or API requests onto authentication pages.
  if (!["GET", "HEAD"].includes(request.method) || request.nextUrl.pathname.startsWith("/api/")) {
    return privateResponse(NextResponse.json({ error: "Sign-in required." }, { status: 403 }));
  }
  return privateResponse(NextResponse.redirect(new URL(signInPath, request.url)));
}

const stations = { gate: "/checkin", kitchen: "/kitchen", bar: "/bar" } as const;
export function staffRequestRole(pathname: string): StaffRole | null {
  for (const [role, path] of Object.entries(stations)) {
    // Exact roots host the PIN bootstrap UI. Their content checks live access itself.
    if (
      pathname.startsWith(`${path}/`) ||
      pathname === `/api${path}` ||
      pathname.startsWith(`/api${path}/`)
    ) {
      return role as StaffRole;
    }
  }
  return null;
}

/** Optimistic filter only. Every privileged operation still checks live revocation/version. */
export function authorizeStaffRequest(request: NextRequest, role: StaffRole): NextResponse {
  const key = staffSigningKey();
  const device =
    key && readStaffDeviceCookie(request.cookies.get(STAFF_DEVICE_COOKIE)?.value ?? "", key);
  const token = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
  const identity = key && device && token ? readStaffSession(token, device, key) : null;
  return identity && identity.role === role
    ? privateResponse(NextResponse.next())
    : deniedRequest(request, stations[role]);
}
