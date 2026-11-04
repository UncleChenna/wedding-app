import "server-only";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { serverEnv } from "@/modules/shared/server/env";
import { deniedRequest, privateResponse } from "@/modules/shared/server/request-access";
import { isAdminEmail, parseAdminEmails } from "../lib/admin-emails";

/** Verified claims prefilter; live identity and factor checks remain in currentAdminAccess. */
export async function authorizeAdminRequest(request: NextRequest): Promise<NextResponse> {
  let refreshed = NextResponse.next({ request });
  let destination: "/admin/sign-in" | "/admin/mfa" | null = "/admin/sign-in";
  try {
    const client = createServerClient(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookieOptions: {
          httpOnly: true,
          sameSite: "lax",
          secure: request.nextUrl.protocol === "https:",
          path: "/",
        },
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (values) => {
            for (const { name, value } of values) request.cookies.set(name, value);
            refreshed = NextResponse.next({ request });
            for (const { name, value, options } of values)
              refreshed.cookies.set(name, value, options);
          },
        },
      },
    );
    const { data, error } = await client.auth.getClaims();
    if (
      !error &&
      data?.claims.sub &&
      isAdminEmail(data.claims.email, parseAdminEmails(serverEnv.ADMIN_EMAIL_ALLOWLIST))
    ) {
      destination = data.claims.aal === "aal2" ? null : "/admin/mfa";
    }
  } catch {
    createLogger({ module: "admin-access" }).warn("admin request identity unavailable");
  }
  const response = destination ? deniedRequest(request, destination) : privateResponse(refreshed);
  if (response !== refreshed) {
    for (const cookie of refreshed.cookies.getAll()) response.cookies.set(cookie);
  }
  return response;
}
