import { connection } from "next/server";

import { menuAvailabilityResponse } from "@/modules/ordering/server/menu";
import { listMenuAvailability } from "@/modules/ordering/server/menu-repository";
import { getEventSettings } from "@/modules/shared/server/settings";

/** Live sold-out and open/closed state polled by the open order page (TICKET-071, TICKET-080). */
export async function GET() {
  await connection();
  return menuAvailabilityResponse(
    listMenuAvailability,
    async () => (await getEventSettings()).orderingOpen,
  );
}
