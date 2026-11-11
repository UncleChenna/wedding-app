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
import {
  OPEN_TICKET_STATUSES,
  type BarBoard,
  type BoardStation,
  type KitchenBoard,
} from "../lib/station-board";

type Reader = Pick<Db, "select">;

/** The kitchen board, with the dietary notes of guests seated at each order's table. */
export function readKitchenBoard(database: Reader, now = new Date()): Promise<KitchenBoard> {
  return readBoard(database, "kitchen", now) as Promise<KitchenBoard>;
}

/** The bar board. It never reads guests, so dietary notes can't reach it (TICKET-128). */
export function readBarBoard(database: Reader, now = new Date()): Promise<BarBoard> {
  return readBoard(database, "bar", now) as Promise<BarBoard>;
}

export function readStationBoard(database: Reader, station: BoardStation, now = new Date()) {
  return station === "kitchen" ? readKitchenBoard(database, now) : readBarBoard(database, now);
}

/**
 * A station's open tickets, oldest first (ORD-4). Each ticket lists its items and the guest's
 * note; the kitchen's also lists the dietary notes of guests seated at that table.
 */
async function readBoard(
  database: Reader,
  station: BoardStation,
  now: Date,
): Promise<KitchenBoard | BarBoard> {
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
        eq(stationOrders.station, station),
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

  const itemsByTicket = Map.groupBy(items, (item) => item.stationOrderId);
  const base = tickets.flatMap((ticket) => {
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
        tableId: ticket.tableId,
      },
    ];
  });
  if (station === "bar")
    return {
      generatedAt: now.toISOString(),
      tickets: base.map(({ tableId: _tableId, ...ticket }) => ticket),
    };

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

  const dietaryByTable = Map.groupBy(dietary, (row) => row.tableId);
  return {
    generatedAt: now.toISOString(),
    tickets: base.map(({ tableId, ...ticket }) => ({
      ...ticket,
      dietary: (dietaryByTable.get(tableId) ?? []).map((row) => ({
        guest: row.guest,
        note: (row.note ?? "").trim(),
      })),
    })),
  };
}
