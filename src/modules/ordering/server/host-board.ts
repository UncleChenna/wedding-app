import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import {
  hostTables,
  menuItems,
  orderItems,
  orders,
  stationOrders,
  tables,
} from "@/modules/shared/server/db/schema";
import type { HostBoard } from "../lib/host-board";
import { OPEN_TICKET_STATUSES } from "../lib/station-board";

type Reader = Pick<Db, "select">;

/** A host's open tickets from both stations, oldest first, for their assigned tables only. */
export async function readHostBoard(
  database: Reader,
  staffId: string,
  now = new Date(),
): Promise<HostBoard> {
  const assigned = await database
    .select({ id: tables.id, number: tables.number, name: tables.name })
    .from(hostTables)
    .innerJoin(tables, eq(tables.id, hostTables.tableId))
    .where(eq(hostTables.staffId, staffId))
    .orderBy(asc(tables.number));
  const board: HostBoard = {
    generatedAt: now.toISOString(),
    tables: assigned.map(({ number, name }) => ({ number, name })),
    tickets: [],
  };
  if (assigned.length === 0) return board;

  const tickets = await database
    .select({
      id: stationOrders.id,
      station: stationOrders.station,
      status: stationOrders.status,
      createdAt: stationOrders.createdAt,
      tableNumber: tables.number,
      tableName: tables.name,
      note: orders.notes,
    })
    .from(stationOrders)
    .innerJoin(orders, eq(orders.id, stationOrders.orderId))
    .innerJoin(tables, eq(tables.id, orders.tableId))
    .where(
      and(
        inArray(
          orders.tableId,
          assigned.map((table) => table.id),
        ),
        inArray(stationOrders.status, [...OPEN_TICKET_STATUSES]),
      ),
    )
    .orderBy(asc(stationOrders.createdAt), asc(stationOrders.id));
  if (tickets.length === 0) return board;

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

  board.tickets = tickets.flatMap((ticket) => {
    const lines = itemsByTicket.get(ticket.id) ?? [];
    if (lines.length === 0) return [];
    return [
      {
        id: ticket.id,
        station: ticket.station,
        status: ticket.status as (typeof OPEN_TICKET_STATUSES)[number],
        createdAt: ticket.createdAt.toISOString(),
        table: { number: ticket.tableNumber, name: ticket.tableName },
        items: lines.map(({ name, quantity }) => ({ name, quantity })),
        note: ticket.note?.trim() || null,
      },
    ];
  });
  return board;
}
