import { connection } from "next/server";

import { menuAvailabilityResponse } from "@/modules/ordering/server/menu";
import { listMenuAvailability } from "@/modules/ordering/server/menu-repository";

/** Live sold-out state polled by the open order page (TICKET-071). */
export async function GET() {
  await connection();
  return menuAvailabilityResponse(listMenuAvailability);
}
