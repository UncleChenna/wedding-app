import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { orderAlerts } from "@/modules/shared/server/db/schema";
import { ALERT_MAX_ATTEMPTS } from "../lib/alerts";
import { drainAlerts, type AlertOutbox, type AlertSender, type DrainResult } from "./alert-drain";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** A drain never holds more than this many alerts; anything beyond waits for the next tick. */
const CLAIM_LIMIT = 500;

/**
 * The outbox inside one drain transaction. Claimed rows stay locked (`FOR UPDATE SKIP LOCKED`)
 * until the transaction ends, so an overlapping drain skips them instead of sending them twice,
 * and a crash mid-drain rolls back to pending rather than stranding rows. Releasing is therefore
 * just ending the transaction. A send that succeeds just before the commit fails is retried:
 * delivery is at least once, never silently dropped.
 */
function transactionOutbox(tx: Tx): AlertOutbox {
  return {
    async claimPending() {
      const rows = await tx
        .select({
          id: orderAlerts.id,
          station: orderAlerts.station,
          createdAt: orderAlerts.createdAt,
          text: orderAlerts.message,
        })
        .from(orderAlerts)
        .where(eq(orderAlerts.status, "pending"))
        .orderBy(asc(orderAlerts.createdAt))
        .limit(CLAIM_LIMIT)
        .for("update", { skipLocked: true });
      return rows;
    },
    async markSent(ids, now) {
      if (!ids.length) return;
      await tx
        .update(orderAlerts)
        .set({ status: "sent", sentAt: now, lastAttemptAt: now })
        .where(and(inArray(orderAlerts.id, [...ids]), eq(orderAlerts.status, "pending")));
    },
    async markFailed(ids, now) {
      if (!ids.length) return;
      await tx
        .update(orderAlerts)
        .set({
          attempts: sql`${orderAlerts.attempts} + 1`,
          lastAttemptAt: now,
          status: sql`case when ${orderAlerts.attempts} + 1 >= ${ALERT_MAX_ATTEMPTS}
            then 'failed'::order_alert_status else 'pending'::order_alert_status end`,
        })
        .where(and(inArray(orderAlerts.id, [...ids]), eq(orderAlerts.status, "pending")));
    },
    async release() {
      // Locks are released when the drain transaction commits.
    },
  };
}

/** One scheduled drain against the database outbox (ADR 0022). */
export function drainOrderAlerts(
  database: Pick<Db, "transaction">,
  send: AlertSender,
  now: Date = new Date(),
): Promise<DrainResult> {
  return database.transaction((tx) => drainAlerts(transactionOutbox(tx), send, now));
}
