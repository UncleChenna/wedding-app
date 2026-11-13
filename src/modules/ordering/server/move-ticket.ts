import "server-only";
import { and, eq } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { orders, stationOrderEvents, stationOrders } from "@/modules/shared/server/db/schema";
import { publishToStation } from "@/modules/shared/server/realtime-publish";
import type { BoardStation } from "../lib/station-board";
import {
  canMove,
  orderStatusFrom,
  type TicketMove,
  type TicketMoveResult,
} from "../lib/ticket-status";

export type BoardActor = { station: BoardStation; staffId: string; deviceId: string };

/**
 * Moves one station ticket (ORD-5, TICKET-078). Only legal moves from the status the board
 * showed are accepted, so two tablets can't both move the same ticket. Each move is recorded
 * with who, which device and when; the order's own status follows its tickets, and the station
 * is told once the transaction commits.
 */
export async function moveTicket(
  database: Pick<Db, "transaction">,
  actor: BoardActor,
  move: TicketMove,
): Promise<TicketMoveResult> {
  return database.transaction(async (tx) => {
    const [ticket] = await tx
      .select({
        id: stationOrders.id,
        orderId: stationOrders.orderId,
        status: stationOrders.status,
      })
      .from(stationOrders)
      .where(
        and(eq(stationOrders.id, move.stationOrderId), eq(stationOrders.station, actor.station)),
      )
      .for("update");
    // Another station's ticket looks the same as a missing one.
    if (!ticket) return { status: "not_found" };
    if (ticket.status !== move.from) return { status: "stale", current: ticket.status };
    if (!canMove(move.from, move.to)) return { status: "illegal" };

    const event = await recordMove(tx, { ...ticket, station: actor.station }, move, actor);
    return {
      status: "moved",
      ticketStatus: move.to,
      movedAt: event.toISOString(),
    };
  });
}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Records one legal move on a ticket the caller has already locked and checked: the event (who,
 * which device, when), the ticket, the order status that follows its tickets, and a notice to the
 * ticket's station once the transaction commits. Returns when the move happened.
 */
export async function recordMove(
  tx: Tx,
  ticket: { id: string; orderId: string; station: BoardStation },
  move: TicketMove,
  who: { staffId: string; deviceId: string },
): Promise<Date> {
  const [event] = await tx
    .insert(stationOrderEvents)
    .values({
      stationOrderId: ticket.id,
      fromStatus: move.from,
      toStatus: move.to,
      reason: move.to === "cancelled" ? (move.reason ?? null) : null,
      staffId: who.staffId,
      deviceId: who.deviceId,
    })
    .returning({ createdAt: stationOrderEvents.createdAt });
  await tx
    .update(stationOrders)
    .set({ status: move.to, updatedAt: event?.createdAt ?? new Date() })
    .where(eq(stationOrders.id, ticket.id));

  // The guest's order follows its tickets, so the table's open-order limit frees up on serve.
  const siblings = await tx
    .select({ status: stationOrders.status })
    .from(stationOrders)
    .where(eq(stationOrders.orderId, ticket.orderId))
    .for("update");
  await tx
    .update(orders)
    .set({ status: orderStatusFrom(siblings.map((row) => row.status)) })
    .where(eq(orders.id, ticket.orderId));

  await publishToStation(tx, ticket.station, "order.changed", {
    stationOrderId: ticket.id,
    orderId: ticket.orderId,
    status: move.to,
  });
  return event?.createdAt ?? new Date();
}
