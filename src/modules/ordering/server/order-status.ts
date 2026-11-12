import "server-only";
import { asc, eq } from "drizzle-orm";
import { unstable_rethrow } from "next/navigation";
import type { Db } from "@/modules/shared/server/db/client";
import { stationOrders } from "@/modules/shared/server/db/schema";
import { logger } from "@/modules/shared/lib/logger";
import { orderStatusSchema, receiptSchema, type OrderStatusView } from "../lib/order-status";

const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};

/** Only each station's status for one order: nothing about who, where or what. */
export async function readOrderStatus(
  database: Pick<Db, "select">,
  orderId: string,
): Promise<OrderStatusView | null> {
  const rows = await database
    .select({ station: stationOrders.station, status: stationOrders.status })
    .from(stationOrders)
    .where(eq(stationOrders.orderId, orderId))
    .orderBy(asc(stationOrders.station));
  return rows.length ? { stations: rows } : null;
}

/** GET /api/orders/<receipt>/status. An unknown or malformed receipt gets the same 404. */
export async function orderStatusResponse(
  receipt: string,
  load: (orderId: string) => Promise<OrderStatusView | null>,
): Promise<Response> {
  const notFound = () =>
    Response.json({ error: "We couldn't find that order." }, { status: 404, headers });
  try {
    const parsed = receiptSchema.safeParse(receipt);
    if (!parsed.success) return notFound();
    const view = await load(parsed.data);
    if (!view) return notFound();
    return Response.json(orderStatusSchema.parse(view), { headers });
  } catch (error) {
    unstable_rethrow(error);
  }
  logger.child({ module: "ordering" }).warn("Order status unavailable");
  return Response.json(
    { error: "We couldn't check your order just now. We'll try again." },
    { status: 503, headers },
  );
}
