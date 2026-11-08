/**
 * Schedules the order alert drain inside the database (ADR 0022): pg_cron runs every 10 seconds
 * and pg_net posts to `/api/alerts/drain` with `ALERT_DRAIN_SECRET`. The URL and secret differ
 * per environment, so this is an ops step rather than a migration.
 *
 *   pnpm alerts:schedule --url https://example.com/api/alerts/drain
 *   pnpm alerts:schedule --remove
 *
 * Reads DATABASE_URL and ALERT_DRAIN_SECRET from the environment (or .env.local). Never prints
 * either. The secret is stored in `cron.job`, readable only by database administrators.
 */
import { existsSync } from "node:fs";
import postgres from "postgres";
import { z } from "zod";
import { assertDatabaseTarget } from "./database-target";

export const ALERT_DRAIN_JOB = "order-alerts-drain";
export const ALERT_DRAIN_SCHEDULE = "10 seconds";

const options = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("schedule"),
    url: z
      .url({ protocol: /^https?$/ })
      .refine((value) => new URL(value).pathname === "/api/alerts/drain", {
        message: "The URL must end in /api/alerts/drain",
      }),
    secret: z.string().regex(/^[0-9a-f]{64}$/, "ALERT_DRAIN_SECRET must be 64 lowercase hex"),
  }),
  z.object({ action: z.literal("remove") }),
]);
export type ScheduleOptions = z.infer<typeof options>;

export function parseScheduleArgs(
  argv: readonly string[],
  env: Partial<Record<"ALERT_DRAIN_URL" | "ALERT_DRAIN_SECRET", string>>,
) {
  if (argv.includes("--remove")) return options.parse({ action: "remove" });
  const at = argv.indexOf("--url");
  return options.parse({
    action: "schedule",
    url: at >= 0 ? argv[at + 1] : env.ALERT_DRAIN_URL,
    secret: env.ALERT_DRAIN_SECRET ?? "",
  });
}

/** The statement pg_cron runs. Values are quoted by Postgres `format(%L)`, never concatenated. */
export const DRAIN_COMMAND_SQL = `format(
  'select net.http_post(url := %L, headers := %L::jsonb, body := ''{}''::jsonb, timeout_milliseconds := 8000)',
  $1::text,
  json_build_object('Authorization', 'Bearer ' || $2::text, 'Content-Type', 'application/json')::text
)`;

async function main() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const parsed = parseScheduleArgs(process.argv.slice(2), {
    ALERT_DRAIN_URL: process.env.ALERT_DRAIN_URL,
    ALERT_DRAIN_SECRET: process.env.ALERT_DRAIN_SECRET,
  });
  const url = process.env.DATABASE_URL ?? "";
  assertDatabaseTarget(url);
  const sql = postgres(url, { max: 1, connect_timeout: 10, onnotice: () => {} });
  try {
    if (parsed.action === "remove") {
      await sql`select cron.unschedule(jobid) from cron.job where jobname = ${ALERT_DRAIN_JOB}`;
      console.log("Order alert drain unscheduled.");
      return;
    }
    await sql`create extension if not exists pg_cron with schema pg_catalog`;
    await sql`create extension if not exists pg_net`;
    // Re-running replaces the job (pg_cron upserts by name), so rotating the secret is one command.
    await sql.unsafe(`select cron.schedule($3, $4, ${DRAIN_COMMAND_SQL})`, [
      parsed.url,
      parsed.secret,
      ALERT_DRAIN_JOB,
      ALERT_DRAIN_SCHEDULE,
    ]);
    console.log(
      `Order alert drain scheduled every ${ALERT_DRAIN_SCHEDULE} to ${new URL(parsed.url).origin}.`,
    );
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("alerts-schedule.ts"))
  main().catch((error: unknown) => {
    // Never echo connection strings or the secret.
    console.error(
      error instanceof z.ZodError
        ? z.prettifyError(error)
        : "Scheduling failed. Check pg_cron/pg_net availability and DATABASE_URL.",
    );
    process.exit(1);
  });
