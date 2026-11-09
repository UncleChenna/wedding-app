import { connection } from "next/server";

import { createOrder } from "@/modules/ordering/server/create-order";
import { orderResponse } from "@/modules/ordering/server/order-response";
import { db } from "@/modules/shared/server/db/client";
import { requestRateLimit } from "@/modules/shared/server/request-rate-limit";
import { requestBudgetResponse } from "@/modules/shared/server/request-budget-gate";

/** Guest table orders (TICKET-072). Retries reuse the client request id. */
export async function POST(request: Request) {
  await connection();
  const budget = await requestRateLimit(request.headers, "ordering");
  if (budget.status !== "allowed") return requestBudgetResponse(budget);
  return orderResponse(request, (order) => createOrder(db, order));
}
