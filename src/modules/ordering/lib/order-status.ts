import { z } from "zod";
import { TICKET_STATUSES, type TicketStatus } from "./ticket-status";

/**
 * What a guest sees about their own order (ORD-3, TICKET-075). The receipt is the order id the
 * server generated (a random v4 UUID: 122 random bits), so it can't be guessed. The response
 * carries only each station's status: no names, notes, dietary details, table or items.
 */
export const orderStatusSchema = z.strictObject({
  stations: z
    .array(z.strictObject({ station: z.enum(["kitchen", "bar"]), status: z.enum(TICKET_STATUSES) }))
    .min(1),
});
export type OrderStatusView = z.infer<typeof orderStatusSchema>;

/** A v4 UUID: the only receipt shape the server ever issues. */
export const receiptSchema = z.uuid({ version: "v4" });

export const orderStatusCopy = {
  received: "Received",
  preparing: "Being prepared",
  served: "Served. Enjoy every bite.",
  cancelled: "Cancelled. Please ask a member of staff.",
  checking: "Checking on your order…",
  paused: "We'll keep checking. The signal is slow.",
} as const satisfies Record<TicketStatus | "checking" | "paused", string>;

/** Served and cancelled don't change again, so the page stops asking. */
export function isSettled(view: OrderStatusView): boolean {
  return view.stations.every((row) => row.status === "served" || row.status === "cancelled");
}

/** How long to wait before asking again: quick while in progress, slower after a failure. */
export function nextPollMs(failures: number, retryAfterSeconds?: number): number {
  if (retryAfterSeconds) return retryAfterSeconds * 1000;
  return Math.min(1_500 * 2 ** failures, 15_000);
}
