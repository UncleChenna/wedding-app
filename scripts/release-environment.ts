import { isIP } from "node:net";
import { z } from "zod";

import { loadGateSigningKeys } from "../src/modules/checkin/server/signing";
import { clientEnvSchema, serverEnvSchema } from "../src/modules/shared/lib/env/schema";

export type ReleaseProfile = "preview" | "production";
export type ReleaseEnvironmentIssue = { field: string; reason: string };

export const applicationEnvironmentNames = [
  ...Object.keys(serverEnvSchema.shape),
  ...Object.keys(clientEnvSchema.shape),
  "GATE_SIGNING_KEY_ID",
  "GATE_SIGNING_PRIVATE_KEY",
  "GATE_RETIRED_PUBLIC_KEYS",
] as const;

function remoteHost(hostname: string): boolean {
  let host: string;
  try {
    // Canonicalize non-special Postgres URL hosts too (integer/hex IPv4 aliases).
    host = new URL(`http://${hostname}`).hostname
      .toLowerCase()
      .replace(/^\[|\]$/g, "")
      .replace(/\.$/, "");
  } catch {
    return false;
  }
  if (!host || host === "localhost" || /\.(localhost|local|internal)$/.test(host)) return false;
  if (isIP(host) === 4) {
    const [a = 0, b = 0] = host.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  if (isIP(host) === 6)
    return !(
      host === "::" ||
      host === "::1" ||
      /^(fc|fd|fe[89ab]|ff)/.test(host) ||
      host.startsWith("::ffff:")
    );
  return host.includes(".") && /^[a-z0-9.-]+$/.test(host);
}

function releaseOrigin(value: string | undefined): boolean {
  try {
    const url = new URL(value ?? "");
    return (
      url.protocol === "https:" &&
      remoteHost(url.hostname) &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function releaseDatabase(value: string | undefined): boolean {
  try {
    const url = new URL(value ?? "");
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      remoteHost(url.hostname) &&
      Boolean(url.username && url.password) &&
      url.searchParams.getAll("sslmode").length === 1 &&
      !url.searchParams.has("ssl") &&
      ["require", "verify-ca", "verify-full"].includes(url.searchParams.get("sslmode") ?? "") &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function publicProjectKey(value: string | undefined): boolean {
  if (!value) return false;
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return true;
  const segments = value.split(".");
  if (segments.length !== 3 || !segments.every((segment) => /^[A-Za-z0-9_-]+$/.test(segment)))
    return false;
  try {
    return z
      .object({ role: z.literal("anon") })
      .safeParse(JSON.parse(Buffer.from(segments[1] ?? "", "base64url").toString("utf8"))).success;
  } catch {
    return false;
  }
}

/** Offline shape checks only. Never returns supplied values or raw validator messages. */
export function validateReleaseEnvironment(
  source: Record<string, string | undefined>,
  profile: ReleaseProfile,
): ReleaseEnvironmentIssue[] {
  const issues = new Map<string, ReleaseEnvironmentIssue>();
  const fail = (field: string, reason: string) => issues.set(field, { field, reason });
  for (const schema of [serverEnvSchema, clientEnvSchema]) {
    const parsed = schema.safeParse(source);
    if (!parsed.success)
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") fail(field, "Missing or invalid application configuration.");
      }
  }
  if (source.NODE_ENV !== "production") fail("NODE_ENV", "Release builds require production mode.");
  if (source.VERCEL_ENV && source.VERCEL_ENV !== profile)
    fail("VERCEL_ENV", "Provider scope does not match the explicit release profile.");
  for (const field of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SUPABASE_URL"])
    if (!releaseOrigin(source[field]))
      fail(field, "Use a remote HTTPS origin without credentials, path, query or fragment.");
  if (!releaseDatabase(source.DATABASE_URL))
    fail("DATABASE_URL", "Use a remote Postgres URL with credentials and an explicit TLS sslmode.");
  if (!publicProjectKey(source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY))
    fail(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "Use a publishable project key or legacy anon JWT, never a secret/service-role key.",
    );
  const publicNames = new Set(Object.keys(clientEnvSchema.shape));
  for (const name of Object.keys(source))
    if (name.startsWith("NEXT_PUBLIC_") && !publicNames.has(name))
      fail(
        /^[A-Z][A-Z0-9_]*$/.test(name) ? name : "NEXT_PUBLIC_*",
        "Unapproved public variable; keep private values server-side.",
      );
  const admins = (source.ADMIN_EMAIL_ALLOWLIST ?? "").split(",").map((email) => email.trim());
  if (
    !admins.length ||
    admins.some((email) => email.includes("*") || !z.email().safeParse(email).success)
  )
    fail(
      "ADMIN_EMAIL_ALLOWLIST",
      "Configure at least one exact valid admin email without wildcards.",
    );
  const secrets = ["STAFF_SESSION_SECRET", "SUPABASE_JWT_SECRET", "ALERT_DRAIN_SECRET"];
  for (const field of secrets) {
    if (!source[field]) fail(field, "Required for the complete release profile.");
    else if (secrets.some((other) => other !== field && source[field] === source[other]))
      fail(field, "Use independent secrets for distinct capabilities.");
  }
  if (!loadGateSigningKeys(source).ok) {
    fail(
      "GATE_SIGNING_KEY_ID",
      "Configure a valid current Ed25519 signing key identifier and pair.",
    );
    fail(
      "GATE_SIGNING_PRIVATE_KEY",
      "Configure a valid current Ed25519 signing key identifier and pair.",
    );
    if (source.GATE_RETIRED_PUBLIC_KEYS)
      fail(
        "GATE_RETIRED_PUBLIC_KEYS",
        "Check retired public keys and unique identifiers with the current signing pair.",
      );
  }
  return [...issues.values()].sort((a, b) => a.field.localeCompare(b.field));
}
