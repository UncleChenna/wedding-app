import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { orderAlerts } from "@/modules/shared/server/db/schema";
import { dueBatches, type AlertBatch } from "../lib/alerts";
import { alertRecipients } from "./alert-recipients";
import { sendWhatsAppTemplate, type WhatsAppConfig, type WhatsAppOutcome } from "./whatsapp";

type Recipient = { id: string; number: string };
export type ClaimedWhatsAppBatch = AlertBatch & { recipients: Recipient[] };
export type WhatsAppDrainStore = {
  claim: () => Promise<ClaimedWhatsAppBatch[]>;
  eligible: (batch: ClaimedWhatsAppBatch, recipient: Recipient) => Promise<boolean>;
  accepted: (ids: readonly string[]) => Promise<void>;
};

/** A committed claim precedes every external effect. Ambiguous/partial batches never replay. */
export async function dispatchWhatsAppAlerts(
  store: WhatsAppDrainStore,
  send: (
    message: Recipient & { text: string },
    eligible: () => Promise<boolean>,
  ) => Promise<WhatsAppOutcome>,
) {
  const batches = await store.claim();
  const result = { sent: 0, failed: 0 };
  for (const batch of batches) {
    let complete = batch.recipients.length > 0;
    for (const recipient of batch.recipients) {
      try {
        const outcome = await send({ ...recipient, text: batch.text }, () =>
          store.eligible(batch, recipient),
        );
        if (outcome !== "accepted") complete = false;
      } catch {
        complete = false;
      }
    }
    if (complete) {
      // Failure to record acceptance leaves the committed failure marker, never a replayable row.
      await store.accepted(batch.ids);
      result.sent += batch.ids.length;
    } else result.failed += batch.ids.length;
  }
  return result;
}

export function drainWhatsAppAlerts(database: Db, config: WhatsAppConfig, now = new Date()) {
  const deadline = Date.now() + 20_000;
  return dispatchWhatsAppAlerts(
    {
      claim: () =>
        database.transaction(async (tx) => {
          const pending = await tx
            .select({
              id: orderAlerts.id,
              station: orderAlerts.station,
              createdAt: orderAlerts.createdAt,
              text: orderAlerts.message,
            })
            .from(orderAlerts)
            .where(eq(orderAlerts.status, "pending"))
            .orderBy(asc(orderAlerts.createdAt), asc(orderAlerts.id))
            .limit(500)
            .for("update", { skipLocked: true });
          // Claim one message just-in-time, leaving later batches pending. An individual
          // oversized order is recorded failed without HTTP, never truncated.
          for (const batch of dueBatches(pending, now)) {
            const optedIn = await alertRecipients(tx, batch.station);
            const recipients = [
              ...new Map(optedIn.map((recipient) => [recipient.number, recipient])).values(),
            ];
            if (!recipients.length) continue;
            const part: AlertBatch = { station: batch.station, ids: [], text: "" };
            for (const row of pending.filter((row) => batch.ids.includes(row.id))) {
              if (part.ids.length && part.text.length + 1 + row.text.length > 1024) break;
              part.ids.push(row.id);
              part.text += (part.text ? "\n" : "") + row.text;
            }
            await tx
              .update(orderAlerts)
              .set({
                status: "failed",
                attempts: sql`${orderAlerts.attempts} + 1`,
                lastAttemptAt: now,
              })
              .where(and(inArray(orderAlerts.id, part.ids), eq(orderAlerts.status, "pending")));
            return [{ ...part, recipients }];
          }
          return [];
        }),
      eligible: async (batch, recipient) =>
        (await alertRecipients(database, batch.station)).some(
          (current) => current.number === recipient.number,
        ),
      accepted: async (ids) => {
        await database
          .update(orderAlerts)
          .set({ status: "sent", sentAt: new Date() })
          .where(and(inArray(orderAlerts.id, [...ids]), eq(orderAlerts.status, "failed")));
      },
    },
    (message, eligible) => sendWhatsAppTemplate(config, message, { eligible, deadline }),
  );
}
