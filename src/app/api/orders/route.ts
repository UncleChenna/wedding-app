import { connection } from "next/server";

import { createOrder } from "@/modules/ordering/server/create-order";
import { orderResponse } from "@/modules/ordering/server/order-response";
import { db } from "@/modules/shared/server/db/client";

/** Guest table orders (TICKET-072). Retries reuse the client request id. */
export async function POST(request: Request) {
  await connection();
  return orderResponse(request, (order) => createOrder(db, order));
}
