import "server-only";
import { and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import {
  guests,
  invitations,
  menuItems,
  orderItems,
  orders,
  stationOrders,
  tables,
} from "@/modules/shared/server/db/schema";
import { OPEN_TICKET_STATUSES, type KitchenBoard } from "../lib/station-board";

type Reader = Pick<Db, "select">;

/**
 * The kitchen board's open tickets, oldest first (ORD-4). Each ticket lists its items, the
 * guest's note and, for the kitchen only, the dietary notes of guests seated at that table.
 */
export async function readKitchenBoard(database: Reader, now = new Date()): Promise<KitchenBoard> {
  const tickets = await database
    .select({
      id: stationOrders.id,
      orderId: stationOrders.orderId,
      status: stationOrders.status,
      createdAt: stationOrders.createdAt,
      tableId: orders.tableId,
      tableNumber: tables.number,
      tableName: tables.name,
      note: orders.notes,
      guestName: orders.guestName,
    })
    .from(stationOrders)
    .innerJoin(orders, eq(orders.id, stationOrders.orderId))
    .innerJoin(tables, eq(tables.id, orders.tableId))
    .where(
      and(
        eq(stationOrders.station, "kitchen"),
        inArray(stationOrders.status, [...OPEN_TICKET_STATUSES]),
      ),
    )
    .orderBy(asc(stationOrders.createdAt), asc(stationOrders.id));
  if (tickets.length === 0) return { generatedAt: now.toISOString(), tickets: [] };

  const items = await database
    .select({
      stationOrderId: orderItems.stationOrderId,
      name: menuItems.name,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(menuItems.id, orderItems.menuItemId))
    .where(
      inArray(
        orderItems.stationOrderId,
        tickets.map((ticket) => ticket.id),
      ),
    )
    .orderBy(asc(orderItems.createdAt), asc(orderItems.id));

  // A guest's own table wins; otherwise their household's table.
  const tableIds = [...new Set(tickets.map((ticket) => ticket.tableId))];
  const seatedAt = sql<string>`coalesce(${guests.tableId}, ${invitations.tableId})`;
  const dietary = await database
    .select({ tableId: seatedAt, guest: guests.name, note: guests.dietaryNotes })
    .from(guests)
    .innerJoin(invitations, eq(invitations.id, guests.invitationId))
    .where(
      and(
        sql`nullif(trim(${guests.dietaryNotes}), '') is not null`,
        or(
          inArray(guests.tableId, tableIds),
          and(isNull(guests.tableId), inArray(invitations.tableId, tableIds)),
        ),
      ),
    )
    .orderBy(asc(guests.name));

  const itemsByTicket = Map.groupBy(items, (item) => item.stationOrderId);
  const dietaryByTable = Map.groupBy(dietary, (row) => row.tableId);
  return {
    generatedAt: now.toISOString(),
    tickets: tickets.flatMap((ticket) => {
      const lines = itemsByTicket.get(ticket.id) ?? [];
      if (lines.length === 0) return [];
      return [
        {
          id: ticket.id,
          orderId: ticket.orderId,
          status: ticket.status as (typeof OPEN_TICKET_STATUSES)[number],
          createdAt: ticket.createdAt.toISOString(),
          table: { number: ticket.tableNumber, name: ticket.tableName },
          items: lines.map(({ name, quantity }) => ({ name, quantity })),
          note: ticket.note?.trim() || null,
          guestName: ticket.guestName?.trim() || null,
          dietary: (dietaryByTable.get(ticket.tableId) ?? []).map((row) => ({
            guest: row.guest,
            note: (row.note ?? "").trim(),
          })),
        },
      ];
    }),
  };
}
