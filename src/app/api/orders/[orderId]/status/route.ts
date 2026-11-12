import { connection } from "next/server";

import { orderStatusResponse, readOrderStatus } from "@/modules/ordering/server/order-status";
import { db } from "@/modules/shared/server/db/client";
import { requestRateLimit } from "@/modules/shared/server/request-rate-limit";
import { requestBudgetResponse } from "@/modules/shared/server/request-budget-gate";

/** A guest's own order status, by its unguessable receipt (TICKET-075). */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/orders/[orderId]/status">,
) {
  await connection();
  const budget = await requestRateLimit(request.headers, "lookup");
  if (budget.status !== "allowed") return requestBudgetResponse(budget);
  const { orderId } = await params;
  return orderStatusResponse(orderId, (id) => readOrderStatus(db, id));
}
