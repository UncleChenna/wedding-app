import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import type { BoardStation } from "../lib/station-board";
import { createOrder } from "./create-order";
import { orderResponse } from "./order-response";

const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

/**
 * POST /api/<station>/orders: a waiter enters a guest's order from the board (TICKET-079). The
 * live station session is checked first; the order is recorded as staff-entered, skips the table
 * cooldown, and keeps the open-order limit and item caps.
 */
export async function postStaffOrder(station: BoardStation, request: Request) {
  const current = await currentStaffDevice(station).catch(() => null);
  if (!current) return Response.json({ error: "Sign-in required." }, { status: 403, headers });
  return orderResponse(request, (order) =>
    createOrder(db, order, { staffEntered: true, staffId: current.identity.staffId }),
  );
}
