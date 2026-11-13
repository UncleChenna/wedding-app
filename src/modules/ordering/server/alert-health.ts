import "server-only";
import { eq, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { orderAlerts } from "@/modules/shared/server/db/schema";
import type { Station } from "../lib/stations";
import type { AlertHealth } from "../lib/alert-health";
import { whatsAppConfig } from "./whatsapp-config";

/** Aggregate only: never exposes message text, staff numbers or guest instructions. */
export async function readAlertHealth(
  database: Pick<Db, "select">,
  station: Station,
): Promise<AlertHealth> {
  if (!whatsAppConfig()) return { state: "disabled", lastAcceptedAt: null, failures: 0 };
  try {
    const [row] = await database
      .select({
        failures: sql<number>`count(*) filter (where ${orderAlerts.status} = 'failed')::integer`,
        lastAcceptedAt: sql<string | null>`max(${orderAlerts.sentAt})::text`,
      })
      .from(orderAlerts)
      .where(eq(orderAlerts.station, station));
    const failures = row?.failures ?? 0;
    return {
      state: failures ? "warning" : "ready",
      failures,
      lastAcceptedAt: row?.lastAcceptedAt ? new Date(row.lastAcceptedAt).toISOString() : null,
    };
  } catch {
    // An alert-provider/status failure must never take the working order board down.
    return { state: "unavailable", lastAcceptedAt: null, failures: 0 };
  }
}
