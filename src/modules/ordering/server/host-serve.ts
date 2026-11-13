import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { hostTables, orders, stationOrders } from "@/modules/shared/server/db/schema";
import type { HostServe } from "../lib/host-board";
import { canMove, type TicketMoveResult } from "../lib/ticket-status";
import { recordMove } from "./move-ticket";

export type HostActor = { staffId: string; deviceId: string };

/**
 * A table host marks one ticket served (TICKET-082). Only tickets for the host's own tables can
 * be touched; anything else looks missing. Hosts can't start preparing or cancel.
 */
export async function serveHostTicket(
  database: Pick<Db, "transaction">,
  actor: HostActor,
  serve: HostServe,
): Promise<TicketMoveResult> {
  return database.transaction(async (tx) => {
    const mine = tx
      .select({ tableId: hostTables.tableId })
      .from(hostTables)
      .where(eq(hostTables.staffId, actor.staffId));
    const [ticket] = await tx
      .select({
        id: stationOrders.id,
        orderId: stationOrders.orderId,
        station: stationOrders.station,
        status: stationOrders.status,
      })
      .from(stationOrders)
      .innerJoin(orders, eq(orders.id, stationOrders.orderId))
      .where(and(eq(stationOrders.id, serve.stationOrderId), inArray(orders.tableId, mine)))
      .for("update", { of: stationOrders });
    if (!ticket) return { status: "not_found" };
    if (ticket.status !== serve.from) return { status: "stale", current: ticket.status };
    if (!canMove(serve.from, "served")) return { status: "illegal" };
    const at = await recordMove(
      tx,
      ticket,
      { stationOrderId: ticket.id, from: serve.from, to: "served" },
      actor,
    );
    return { status: "moved", ticketStatus: "served", movedAt: at.toISOString() };
  });
}
