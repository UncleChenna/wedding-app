import type { OrderResult } from "./order";

type Usage = { open: number; sinceLast: number | null };
type TableLimits = { orderCooldownSeconds: number; maxOpenOrdersPerTable: number };

/** Pure policy only. The server must read database time and usage after locking the table. */
/**
 * A table's limits for one new order. Staff entering an order for a table (TICKET-079) skip the
 * cooldown, which only slows repeat taps from a guest's phone, but not the open-order limit.
 */
export function rejectTableUsage(
  usage: Usage | undefined,
  limits: TableLimits,
  { staffEntered = false }: { staffEntered?: boolean } = {},
): Extract<OrderResult, { status: "rejected" }> | null {
  const sinceLast = usage?.sinceLast ?? null;
  if (!staffEntered && sinceLast !== null && sinceLast < limits.orderCooldownSeconds)
    return {
      status: "rejected",
      reason: "cooldown",
      retryAfterSeconds: Math.max(1, Math.ceil(limits.orderCooldownSeconds - sinceLast)),
    };
  if ((usage?.open ?? 0) >= limits.maxOpenOrdersPerTable)
    return { status: "rejected", reason: "too-many-open" };
  return null;
}

export function effectiveItemLimit(itemLimit: number, eventLimit: number): number {
  return Math.min(itemLimit, eventLimit);
}

export function overLimitItemIds(
  items: readonly { menuItemId: string; quantity: number }[],
  menu: ReadonlyMap<string, { maxPerOrder: number }>,
): string[] {
  return items
    .filter((item) => item.quantity > (menu.get(item.menuItemId)?.maxPerOrder ?? 0))
    .map((item) => item.menuItemId);
}
