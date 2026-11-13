import { z } from "zod";

/**
 * Environment variable schemas. Every variable is documented in `.env.example`.
 * This file is runtime-agnostic so scripts (seed, drizzle config) can reuse it.
 */

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is required (Postgres connection string)" })
    .regex(/^postgres(ql)?:\/\//, "DATABASE_URL must start with postgres:// or postgresql://"),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
  ADMIN_EMAIL_ALLOWLIST: z.string().default(""),
  STAFF_SESSION_SECRET: z
    .string()
    .regex(
      /^(?:[0-9a-f]{64})?$/,
      "STAFF_SESSION_SECRET must be 32 random bytes encoded as lowercase hex",
    )
    .default(""),
  /** Signs short-lived station Realtime tokens (ADR 0024, TICKET-033). Empty turns live updates off. */
  SUPABASE_JWT_SECRET: z
    .string()
    .refine((value) => value === "" || value.length >= 32, {
      message: "SUPABASE_JWT_SECRET must be at least 32 characters",
    })
    .default(""),
  ALERT_DRAIN_SECRET: z
    .string()
    .regex(
      /^(?:[0-9a-f]{64})?$/,
      "ALERT_DRAIN_SECRET must be 32 random bytes encoded as lowercase hex",
    )
    .default(""),
  WEB_PUSH_PUBLIC_KEY: z
    .string()
    .regex(/^(?:B[A-Za-z0-9_-]{86})?$/)
    .default(""),
  WEB_PUSH_PRIVATE_KEY: z
    .string()
    .regex(/^(?:[A-Za-z0-9_-]{43})?$/)
    .default(""),
  WEB_PUSH_SUBJECT: z
    .string()
    .max(254)
    .refine(
      (value) =>
        value === "" ||
        /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
        (URL.canParse(value) && new URL(value).protocol === "https:"),
    )
    .default(""),
});

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url({ error: "NEXT_PUBLIC_SITE_URL must be a URL" }),
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    error: "NEXT_PUBLIC_SUPABASE_URL must be a URL",
  }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string({ error: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required" })
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

export class EnvError extends Error {
  override name = "EnvError";
}

function parseOrThrow<T extends z.ZodType>(schema: T, source: unknown, label: string): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new EnvError(
      `Invalid ${label} environment variables:\n${details}\nSee .env.example for documentation.`,
    );
  }
  return result.data;
}

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return parseOrThrow(serverEnvSchema, source, "server");
}

export function parseClientEnv(source: Record<string, string | undefined>): ClientEnv {
  const approved = new Set(Object.keys(clientEnvSchema.shape));
  const unexpected = Object.keys(source).filter(
    (key) => key.startsWith("NEXT_PUBLIC_") && !approved.has(key),
  );
  if (unexpected.length) {
    throw new EnvError(
      "Unapproved public environment variable names: " +
        unexpected.join(", ") +
        ". Public values are bundled for browsers; keep secrets server-only.",
    );
  }
  return parseOrThrow(clientEnvSchema, source, "client");
}
