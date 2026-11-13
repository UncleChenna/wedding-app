import { connection } from "next/server";

import { alertDrainResponse } from "@/modules/ordering/server/alert-drain-request";

export const maxDuration = 30;

/** Scheduled order alert drain (ADR 0022). Called by the database every 10 seconds. */
export async function POST(request: Request) {
  await connection();
  return alertDrainResponse(request);
}
