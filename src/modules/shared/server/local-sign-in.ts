import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { createLogger } from "../lib/logger";
import {
  DEFAULT_LOCAL_SIGN_IN_CODE,
  isLocalSignInCode,
  localSignInRefusal,
} from "../lib/local-sign-in";
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
  else if (
    typed(value) === DEFAULT_LOCAL_SIGN_IN_CODE &&
    !process.env.VERCEL &&
    !process.env.VERCEL_ENV
  )
    // Off Vercel only: say why 000000 was treated as an ordinary code instead of failing silently.
    log.warn("local sign-in code ignored", { reason: localSignInRefusal(process.env, host) });
  return local;
}

const typed = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** Logged when a local step fails, so a misconfigured machine says what to fix. */
function failed(step: string, reason: string): null {
  log.warn("local sign-in code could not complete", { step, reason });
  return null;
}

const DATABASE_HINT =
  "local database unreachable or out of date; run pnpm db:start and pnpm db:migrate";

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
  if (!secret) return failed("email code", "SUPABASE_JWT_SECRET is empty in .env.local");
  const token = localServiceToken(secret);
  let response: Response;
  try {
    response = await fetch(
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
  } catch {
    return failed("email code", "local Supabase Auth is unreachable; run pnpm db:start");
  }
  if (response.status === 401 || response.status === 403)
    return failed("email code", "SUPABASE_JWT_SECRET does not match local Supabase");
  if (!response.ok) return failed("email code", `local Supabase Auth replied ${response.status}`);
  try {
    const body = (await response.json()) as {
      email_otp?: unknown;
      properties?: { email_otp?: unknown };
    };
    const code = body.properties?.email_otp ?? body.email_otp;
    if (typeof code === "string") return code;
  } catch {
    // Fall through to the logged failure.
  }
  return failed("email code", "local Supabase Auth returned no code");
}

/** The current code for one of the signed-in admin's own authenticator factors, read locally. */
export async function localAuthenticatorCode(factorId: string): Promise<string | null> {
  let secret: string | null | undefined;
  try {
    const { db } = await import("./db/client");
    const rows = await db.execute<{ secret: string | null }>(
      sql`select secret from auth.mfa_factors where id = ${factorId} and factor_type = 'totp'`,
    );
    secret = [...rows][0]?.secret;
  } catch {
    return failed("authenticator code", DATABASE_HINT);
  }
  return secret ? totp(secret) : failed("authenticator code", "authenticator not found locally");
}

/** For callers: logs why a local step failed (by default the likely database cause), never the error. */
export function localSignInFailed(step: string, reason: string = DATABASE_HINT): void {
  failed(step, reason);
}
