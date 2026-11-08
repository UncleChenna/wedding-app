import "server-only";
import { logger } from "@/modules/shared/lib/logger";
import { ALERT_MAX_ATTEMPTS, dueBatches, type PendingAlert } from "../lib/alerts";
import type { Station } from "../lib/stations";

/**
 * Storage for queued alerts. The durable implementation is a database outbox written in the same
 * transaction as the order (pending migration approval, ADR 0022); tests use `memoryAlertOutbox`.
 */
export interface AlertOutbox {
  /** Pending alerts, claimed so that two drains running at once never send the same alert. */
  claimPending(now: Date): Promise<PendingAlert[]>;
  markSent(ids: readonly string[], now: Date): Promise<void>;
  /** Returns alerts to pending for a later drain, or gives up after `ALERT_MAX_ATTEMPTS`. */
  markFailed(ids: readonly string[], now: Date): Promise<void>;
  release(ids: readonly string[]): Promise<void>;
}

/** Sends one message to a station's opted-in recipients. TICKET-085 adds the WhatsApp provider. */
export type AlertSender = (message: { station: Station; text: string }) => Promise<void>;

export type DrainResult = { sent: number; failed: number; waiting: number };

/**
 * One drain tick: send every batch that is due, leave the rest for the next tick. A failed send
 * is retried later and never reaches the order path; the kitchen and bar boards stay the source
 * of truth.
 */
export async function drainAlerts(
  outbox: AlertOutbox,
  send: AlertSender,
  now: Date,
): Promise<DrainResult> {
  const claimed = await outbox.claimPending(now);
  const batches = dueBatches(claimed, now);
  const due = new Set(batches.flatMap((batch) => batch.ids));
  const waiting = claimed.filter((alert) => !due.has(alert.id)).map((alert) => alert.id);
  if (waiting.length) await outbox.release(waiting);
  const result: DrainResult = { sent: 0, failed: 0, waiting: waiting.length };
  for (const batch of batches) {
    try {
      await send({ station: batch.station, text: batch.text });
      await outbox.markSent(batch.ids, now);
      result.sent += batch.ids.length;
    } catch {
      // Never log the message: it can contain a guest's note.
      logger
        .child({ module: "order-alerts" })
        .warn("Order alert send failed", { station: batch.station, alerts: batch.ids.length });
      await outbox.markFailed(batch.ids, now);
      result.failed += batch.ids.length;
    }
  }
  return result;
}

/**
 * Used until the WhatsApp provider exists (TICKET-085): records that a batch was due without
 * contacting anyone. It logs counts only, never the message.
 */
export const loggingSender: AlertSender = async ({ station, text }) => {
  logger
    .child({ module: "order-alerts" })
    .info("Order alert ready (no provider yet)", { station, lines: text.split("\n").length });
};

/** Development and test sender: records messages instead of contacting anyone. */
export function dryRunSender(): AlertSender & { sent: { station: Station; text: string }[] } {
  const sent: { station: Station; text: string }[] = [];
  const send = (async (message: { station: Station; text: string }) => {
    sent.push(message);
  }) as AlertSender & { sent: typeof sent };
  send.sent = sent;
  return send;
}

type MemoryRow = PendingAlert & {
  status: "pending" | "claimed" | "sent" | "failed";
  attempts: number;
};

/** In-memory outbox with the same claim/retry semantics the database outbox must provide. */
export function memoryAlertOutbox() {
  const rows: MemoryRow[] = [];
  const find = (ids: readonly string[]) => rows.filter((row) => ids.includes(row.id));
  const outbox: AlertOutbox & { rows: MemoryRow[]; enqueue(alert: PendingAlert): void } = {
    rows,
    enqueue(alert) {
      rows.push({ ...alert, status: "pending", attempts: 0 });
    },
    async claimPending() {
      const pending = rows.filter((row) => row.status === "pending");
      for (const row of pending) row.status = "claimed";
      return pending.map(({ id, station, createdAt, text }) => ({ id, station, createdAt, text }));
    },
    async markSent(ids) {
      for (const row of find(ids)) row.status = "sent";
    },
    async markFailed(ids) {
      for (const row of find(ids)) {
        row.attempts++;
        row.status = row.attempts >= ALERT_MAX_ATTEMPTS ? "failed" : "pending";
      }
    },
    async release(ids) {
      for (const row of find(ids)) row.status = "pending";
    },
  };
  return outbox;
}
