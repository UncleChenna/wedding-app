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

export function localSignInCode(
  env: Record<string, string | undefined>,
  requestHost: string | null | undefined,
): string | null {
  if (env.VERCEL || env.VERCEL_ENV) return null;
  const configured = env.LOCAL_SIGN_IN_CODE?.trim();
  if (configured === "off") return null;
  if (!loopback(env.DATABASE_URL) || !loopback(env.NEXT_PUBLIC_SUPABASE_URL)) return null;
  if (!requestHost || !loopback(`http://${requestHost}`)) return null;
  const code = configured || DEFAULT_LOCAL_SIGN_IN_CODE;
  return /^\d{6}$/.test(code) ? code : null;
}

export function isLocalSignInCode(
  value: unknown,
  env: Record<string, string | undefined>,
  requestHost: string | null | undefined,
): boolean {
  const code = localSignInCode(env, requestHost);
  return code !== null && typeof value === "string" && value.trim() === code;
}
