import { z } from "zod";

/** A station ticket's life (ORD-5): received → preparing → served, or cancelled before served. */
import { TICKET_STATUSES, type TicketStatus } from "./ticket-status-values";
export { TICKET_STATUSES, type TicketStatus } from "./ticket-status-values";

const MOVES: Record<TicketStatus, readonly TicketStatus[]> = {
  received: ["preparing", "served", "cancelled"],
  preparing: ["served", "cancelled"],
  served: [],
  cancelled: [],
};

/** Served and cancelled are final: a mistake there is a new order, not an undo. */
export function canMove(from: TicketStatus, to: TicketStatus): boolean {
  return MOVES[from].includes(to);
}

export const MAX_CANCEL_REASON = 200;

export const ticketMoveSchema = z
  .strictObject({
    stationOrderId: z.uuid(),
    /** The status the board showed: if another tablet moved it first, the move is refused. */
    from: z.enum(TICKET_STATUSES),
    to: z.enum(TICKET_STATUSES),
    reason: z.string().trim().max(MAX_CANCEL_REASON).optional(),
  })
  .refine((move) => move.to !== "cancelled" || Boolean(move.reason), {
    message: "Say why the order is cancelled.",
    path: ["reason"],
  });
export type TicketMove = z.infer<typeof ticketMoveSchema>;

export type TicketMoveResult =
  | { status: "moved"; ticketStatus: TicketStatus; movedAt: string }
  /** Another tablet moved it first; `current` is what it is now. */
  | { status: "stale"; current: TicketStatus }
  | { status: "illegal" | "not_found" };

/**
 * The guest-facing order status from its station tickets: cancelled when every ticket is,
 * served when every live ticket is served, preparing once any work has started, else received.
 */
export function orderStatusFrom(tickets: readonly TicketStatus[]): TicketStatus {
  const live = tickets.filter((status) => status !== "cancelled");
  if (live.length === 0) return "cancelled";
  if (live.every((status) => status === "served")) return "served";
  if (live.some((status) => status !== "received")) return "preparing";
  return "received";
}
