import "server-only";
import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import {
  menuItems,
  orderItems,
  orders,
  stationOrders,
  tables,
} from "@/modules/shared/server/db/schema";
import { orderFingerprint, type OrderResult, type OrderSubmission } from "../lib/order";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Creates one guest submission atomically (ORD-3). The client request id makes retries safe:
 * an identical replay returns the original order, and a reused id with a different order is
 * refused. Availability, caps and the table are checked inside the transaction, with the
 * chosen menu rows locked so a concurrent sold-out change waits for this order or wins first.
 */
export async function createOrder(
  database: Pick<Db, "transaction">,
  order: OrderSubmission,
): Promise<OrderResult> {
  const fingerprint = orderFingerprint({
    tableNumber: order.table,
    note: order.note,
    items: order.items,
  });
  return database.transaction(async (tx) => {
    const replay = await findReplay(tx, order.clientRequestId, fingerprint);
    if (replay) return replay;

    const [table] = await tx
      .select({ id: tables.id })
      .from(tables)
      .where(eq(tables.number, order.table))
      .limit(1);
    if (!table) return { status: "rejected", reason: "table-missing" };

    const ids = order.items.map((item) => item.menuItemId);
    const menu = await tx
      .select({
        id: menuItems.id,
        station: menuItems.station,
        available: menuItems.isAvailable,
        maxPerOrder: menuItems.maxPerOrder,
      })
      .from(menuItems)
      .where(inArray(menuItems.id, ids))
      .for("share");
    const byId = new Map(menu.map((item) => [item.id, item]));
    if (byId.size !== ids.length) return { status: "rejected", reason: "invalid" };
    const soldOut = ids.filter((id) => !byId.get(id)?.available);
    if (soldOut.length) return { status: "rejected", reason: "sold-out", itemIds: soldOut };
    const overLimit = order.items
      .filter((item) => item.quantity > (byId.get(item.menuItemId)?.maxPerOrder ?? 0))
      .map((item) => item.menuItemId);
    if (overLimit.length) return { status: "rejected", reason: "over-limit", itemIds: overLimit };

    const [created] = await tx
      .insert(orders)
      .values({
        clientRequestId: order.clientRequestId,
        tableId: table.id,
        notes: order.note || null,
      })
      .onConflictDoNothing({ target: orders.clientRequestId })
      .returning({ id: orders.id });
    // A concurrent request with the same id committed first; answer as its replay.
    if (!created)
      return (
        (await findReplay(tx, order.clientRequestId, fingerprint)) ?? { status: "unavailable" }
      );

    // The schema stores every item under its station's submission row (TICKET-171).
    const stations = [...new Set(menu.map((item) => item.station))];
    const rows = await tx
      .insert(stationOrders)
      .values(stations.map((station) => ({ orderId: created.id, station })))
      .returning({ id: stationOrders.id, station: stationOrders.station });
    const stationRow = new Map(rows.map((row) => [row.station, row.id]));
    await tx.insert(orderItems).values(
      order.items.map((item) => {
        const menuItem = byId.get(item.menuItemId);
        const stationOrderId = menuItem && stationRow.get(menuItem.station);
        if (!menuItem || !stationOrderId) throw new Error("Order item lost its station");
        return {
          orderId: created.id,
          stationOrderId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          quantityLimit: menuItem.maxPerOrder,
        };
      }),
    );
    return { status: "created", orderId: created.id };
  });
}

async function findReplay(
  tx: Tx,
  clientRequestId: string,
  fingerprint: string,
): Promise<OrderResult | null> {
  const [existing] = await tx
    .select({ id: orders.id, notes: orders.notes, tableNumber: tables.number })
    .from(orders)
    .innerJoin(tables, eq(tables.id, orders.tableId))
    .where(eq(orders.clientRequestId, clientRequestId))
    .limit(1);
  if (!existing) return null;
  const items = await tx
    .select({ menuItemId: orderItems.menuItemId, quantity: orderItems.quantity })
    .from(orderItems)
    .where(eq(orderItems.orderId, existing.id));
  const stored = orderFingerprint({
    tableNumber: existing.tableNumber,
    note: existing.notes ?? "",
    items,
  });
  return stored === fingerprint
    ? { status: "replayed", orderId: existing.id }
    : { status: "rejected", reason: "mismatch" };
}
