import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/modules/shared/server/db/client";
import { orderAlerts, scanEvents } from "@/modules/shared/server/db/schema";
import { createHealthProbe } from "../lib/health-probe";
import { healthReadingSchema, healthSnapshot } from "../lib/health";

/** No guest columns or alert message bodies are read. Each probe is bounded and single-flight. */
export const databaseReady = createHealthProbe(async () => {
  await db.execute(sql`select 1`);
  return true;
});
const read = createHealthProbe(async () => {
  const rows = await db.execute(sql`
    select to_regprocedure('realtime.send(jsonb,text,text,boolean)') is not null as realtime,
      (select count(*)::float8 from ${orderAlerts} where ${orderAlerts.status} = 'pending') as pending,
      (select count(*)::float8 from ${orderAlerts} where ${orderAlerts.status} = 'failed') as failed,
      (select to_char(max(${scanEvents.receivedAt}) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') from ${scanEvents} where ${scanEvents.source} = 'offline') as "lastSync"
  `);
  return healthReadingSchema.parse(rows[0]);
});
export async function readHealth() {
  return healthSnapshot(await read(), process.env.VERCEL_GIT_COMMIT_SHA);
}
