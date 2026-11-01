import { connection } from "next/server";

import { gatePublicKeysResponse } from "@/modules/checkin/server/public-keys";

/** Public Ed25519 keys for offline gate pass verification (ADR 0021). */
export async function GET() {
  // Keys come from runtime env and rotate, so render per request rather than at build time.
  await connection();
  return gatePublicKeysResponse();
}
