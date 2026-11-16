/**
 * A shared sign-in code for local development only (TICKET-250). It stands in for the admin email
 * code, the admin authenticator code and any staff PIN, so a developer can open every screen
 * without a mail inbox, an authenticator app or issued PINs.
 *
 * It is refused unless every one of these holds, so a live deployment can never accept it:
 * not on Vercel, the database and Supabase both on this machine, and the browser on localhost.
 * `LOCAL_SIGN_IN_CODE=off` turns it off locally; any other six digits replace the default.
 */
export const DEFAULT_LOCAL_SIGN_IN_CODE = "000000";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1"]);

function loopback(url: string | undefined): boolean {
  if (!url) return false;
  try {
    return LOOPBACK.has(new URL(url).hostname.replace(/^\[|\]$/g, "").toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Why the local code is refused here, or null when it is allowed. Reasons name a setting, never
 * its value, so they are safe to log.
 */
export function localSignInRefusal(
  env: Record<string, string | undefined>,
  requestHost: string | null | undefined,
): string | null {
  if (env.VERCEL || env.VERCEL_ENV) return "running on Vercel";
  const configured = env.LOCAL_SIGN_IN_CODE?.trim();
  if (configured === "off") return "LOCAL_SIGN_IN_CODE is off";
  if (configured && !/^\d{6}$/.test(configured)) return "LOCAL_SIGN_IN_CODE is not six digits";
  if (!loopback(env.DATABASE_URL)) return "DATABASE_URL is not a database on this machine";
  if (!loopback(env.NEXT_PUBLIC_SUPABASE_URL))
    return "NEXT_PUBLIC_SUPABASE_URL is not Supabase on this machine";
  if (!requestHost || !loopback(`http://${requestHost}`))
    return "the page was not opened from localhost";
  return null;
}

export function localSignInCode(
  env: Record<string, string | undefined>,
  requestHost: string | null | undefined,
): string | null {
  if (localSignInRefusal(env, requestHost)) return null;
  return env.LOCAL_SIGN_IN_CODE?.trim() || DEFAULT_LOCAL_SIGN_IN_CODE;
}

export function isLocalSignInCode(
  value: unknown,
  env: Record<string, string | undefined>,
  requestHost: string | null | undefined,
): boolean {
  const code = localSignInCode(env, requestHost);
  return code !== null && typeof value === "string" && value.trim() === code;
}
