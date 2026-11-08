import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { getEventSettings } from "@/modules/shared/server/settings";
import {
  menuItems,
  orderAlerts,
  orderItems,
  orders,
  stationOrders,
  tables,
} from "@/modules/shared/server/db/schema";
import { formatOrderAlert } from "../lib/alerts";
import { orderFingerprint, type OrderResult, type OrderSubmission } from "../lib/order";
import { splitByStation } from "../lib/stations";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Orders still in progress count toward the table limit; served and cancelled ones free a slot. */
const OPEN_STATUSES = ["received", "preparing", "ready"] as const;

/**
 * Creates one guest submission atomically (ORD-3). The client request id makes retries safe:
 * an identical replay returns the original order, and a reused id with a different order is
 * refused. Availability, caps and the table are checked inside the transaction, with the
 * chosen menu rows locked so a concurrent sold-out change waits for this order or wins first.
 */
export async function createOrder(
  database: Pick<Db, "transaction">,
  order: OrderSubmission,
  /** Staff entering an order for a table (TICKET-079) may do so while guest ordering is closed. */
  options: { staffEntered?: boolean } = {},
): Promise<OrderResult> {
  const fingerprint = orderFingerprint({
    tableNumber: order.table,
    note: order.note,
    items: order.items,
  });
  return database.transaction(async (tx) => {
    const replay = await findReplay(tx, order.clientRequestId, fingerprint);
    if (replay) return replay;

    // ORD-7: guests can only order while the couple has ordering open. A retry of an order made
    // before it closed is answered above, so closing never turns a sent order into a refusal.
    const settings = await getEventSettings(tx);
    if (!settings.orderingOpen && !options.staffEntered)
      return { status: "rejected", reason: "closed" };

    // Locking the table row serializes this table's submissions across every server instance,
    // so concurrent orders cannot both slip under the open-order limit or the cooldown.
    const [table] = await tx
      .select({ id: tables.id })
      .from(tables)
      .where(eq(tables.number, order.table))
      .limit(1)
      .for("update");
    if (!table) return { status: "rejected", reason: "table-missing" };
    // A duplicate tap may have committed while this one waited for the lock: answer it as a
    // replay rather than charging the table's limits twice for one guest action.
    const raced = await findReplay(tx, order.clientRequestId, fingerprint);
    if (raced) return raced;

    const [usage] = await tx
      .select({
        open: sql<number>`count(*) filter (where ${inArray(orders.status, OPEN_STATUSES)})::int`,
        // Database time after the lock, so the wait is measured the same on every instance.
        sinceLast: sql<
          number | null
        >`extract(epoch from clock_timestamp() - max(${orders.createdAt}))::float8`,
      })
      .from(orders)
      .where(eq(orders.tableId, table.id));
    const sinceLast = usage?.sinceLast ?? null;
    if (sinceLast !== null && sinceLast < settings.orderCooldownSeconds)
      return {
        status: "rejected",
        reason: "cooldown",
        retryAfterSeconds: Math.max(1, Math.ceil(settings.orderCooldownSeconds - sinceLast)),
      };
    if ((usage?.open ?? 0) >= settings.maxOpenOrdersPerTable)
      return { status: "rejected", reason: "too-many-open" };

    const ids = order.items.map((item) => item.menuItemId);
    const menu = await tx
      .select({
        id: menuItems.id,
        name: menuItems.name,
        station: menuItems.station,
        available: menuItems.isAvailable,
        maxPerOrder: menuItems.maxPerOrder,
      })
      .from(menuItems)
      .where(inArray(menuItems.id, ids))
      .for("share");
    // Each item's own cap, never above the event-wide per-item cap.
    const byId = new Map(
      menu.map((item) => [
        item.id,
        { ...item, maxPerOrder: Math.min(item.maxPerOrder, settings.maxItemQuantity) },
      ]),
    );
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

    // One ticket per station sharing this submission's id, so each board sees only its items.
    const tickets = splitByStation(
      order.items.map((item) => {
        const menuItem = byId.get(item.menuItemId);
        if (!menuItem) throw new Error("Order item lost its menu row");
        return {
          ...item,
          name: menuItem.name,
          station: menuItem.station,
          quantityLimit: menuItem.maxPerOrder,
        };
      }),
    );
    const rows = await tx
      .insert(stationOrders)
      .values(tickets.map(({ station }) => ({ orderId: created.id, station })))
      .returning({ id: stationOrders.id, station: stationOrders.station });
    const stationRow = new Map(rows.map((row) => [row.station, row.id]));
    await tx.insert(orderItems).values(
      tickets.flatMap(({ station, items }) => {
        const stationOrderId = stationRow.get(station);
        if (!stationOrderId) throw new Error("Station ticket was not created");
        return items.map((item) => ({
          orderId: created.id,
          stationOrderId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          quantityLimit: item.quantityLimit,
        }));
      }),
    );
    // ADR 0022: the alert commits or rolls back with the order. Sending happens later in the
    // drain, so a slow or failing provider can never hold up or refuse an order.
    await tx.insert(orderAlerts).values(
      tickets.map(({ station, items }) => {
        const stationOrderId = stationRow.get(station);
        if (!stationOrderId) throw new Error("Station ticket was not created");
        return {
          stationOrderId,
          station,
          message: formatOrderAlert({ table: order.table, items, note: order.note }),
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
