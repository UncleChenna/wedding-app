import type { Station } from "./stations";

/**
 * Batching (current-state assumption 7, ADR 0022): a station's pending alerts are sent together once
 * the oldest has waited `ALERT_BATCH_WINDOW_MS`. A drain runs every `ALERT_DRAIN_INTERVAL_MS`, so no
 * alert waits longer than their sum (60 seconds). A quiet station still gets one message per order.
 */
export const ALERT_BATCH_WINDOW_MS = 50_000;
export const ALERT_DRAIN_INTERVAL_MS = 10_000;
/** A message that keeps failing is given up after this many attempts; the board still has the order. */
export const ALERT_MAX_ATTEMPTS = 5;

export type AlertLine = { quantity: number; name: string };

/** "Table 12: 2 x chicken, 1 x water. Note: no pepper." (PRD ORD-9). */
export function formatOrderAlert(order: {
  table: number;
  items: AlertLine[];
  note?: string | null;
}) {
  const items = order.items.map((item) => `${item.quantity} x ${item.name}`).join(", ");
  const note = order.note?.trim();
  return (
    `Table ${order.table}: ${items}.` +
    (note ? ` Note: ${note}` + (/[.!?]$/.test(note) ? "" : ".") : "")
  );
}

export type PendingAlert = { id: string; station: Station; createdAt: Date; text: string };
export type AlertBatch = { station: Station; ids: string[]; text: string };

/** Batches due at `now`, one per station whose oldest pending alert has waited the full window. */
export function dueBatches(pending: readonly PendingAlert[], now: Date): AlertBatch[] {
  const byStation = new Map<Station, PendingAlert[]>();
  for (const alert of [...pending].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()))
    byStation.set(alert.station, [...(byStation.get(alert.station) ?? []), alert]);
  const batches: AlertBatch[] = [];
  for (const [station, alerts] of byStation) {
    const oldest = alerts[0];
    if (!oldest || now.getTime() - oldest.createdAt.getTime() < ALERT_BATCH_WINDOW_MS) continue;
    batches.push({
      station,
      ids: alerts.map((alert) => alert.id),
      text: alerts.map((alert) => alert.text).join("\n"),
    });
  }
  return batches;
}
