import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { createLogger } from "../lib/logger";
import { isLocalSignInCode } from "../lib/local-sign-in";
import { totp } from "../lib/totp";

/**
 * Server side of the local-only shared sign-in code (TICKET-250). Each helper still completes the
 * real sign-in: Supabase issues a genuine email code or checks a genuine authenticator code, and
 * staff get a real PIN session. Nothing here is reachable unless `isLocalSignInCode` passes.
 */
const log = createLogger({ module: "local-sign-in" });

/** True only for the local code, on a fully local setup, opened from localhost. */
export async function usesLocalSignInCode(value: unknown): Promise<boolean> {
  const host = (await headers()).get("host");
  const local = isLocalSignInCode(value, process.env, host);
  if (local) log.warn("local sign-in code used");
  return local;
}

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

/** A one-minute service-role token for the local Auth admin API, signed with the local secret. */
function localServiceToken(secret: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({ role: "service_role", iss: "supabase-local", iat: now, exp: now + 60 });
  const signature = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

/** Asks local Supabase Auth for a real one-time email code for this address, without sending mail. */
export async function localEmailCode(email: string): Promise<string | null> {
  // Loaded only when the local code is used, so importing this module never reads configuration.
  const [{ serverEnv }, { clientEnv }] = await Promise.all([
    import("./env"),
    import("../lib/env/client"),
  ]);
  const secret = serverEnv.SUPABASE_JWT_SECRET;
  if (!secret) return null;
  const token = localServiceToken(secret);
  try {
    const response = await fetch(
      new URL("/auth/v1/admin/generate_link", clientEnv.NEXT_PUBLIC_SUPABASE_URL),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: "magiclink", email }),
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as {
      email_otp?: unknown;
      properties?: { email_otp?: unknown };
    };
    const code = body.properties?.email_otp ?? body.email_otp;
    return typeof code === "string" ? code : null;
  } catch {
    return null;
  }
}

/** The current code for one of the signed-in admin's own authenticator factors, read locally. */
export async function localAuthenticatorCode(factorId: string): Promise<string | null> {
  const { db } = await import("./db/client");
  const rows = await db.execute<{ secret: string | null }>(
    sql`select secret from auth.mfa_factors where id = ${factorId} and factor_type = 'totp'`,
  );
  const secret = [...rows][0]?.secret;
  return secret ? totp(secret) : null;
}
