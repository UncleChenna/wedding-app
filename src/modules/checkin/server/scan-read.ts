import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { currentStaff } from "@/modules/shared/server/staff-cookies";
import { resolveScanRead } from "../lib/resolve-scan-read";
import { scanReadResponse } from "./scan-read-response";
import { readScanGuest } from "./scan-read-repository";
import { gatePublicKeys, loadGateSigningKeys } from "./signing";

export function postScanRead(request: Request) {
  return scanReadResponse(request, {
    authorize: async () => (await currentStaff("gate")) !== null,
    read: async (qr, origin) => {
      const keys = loadGateSigningKeys();
      if (!keys.ok) return { state: "unavailable" };
      const result = await resolveScanRead(qr, origin, gatePublicKeys(keys.value), (id) =>
        readScanGuest(db, id),
      );
      // Revocation or expiry during the read must not return private guest information.
      if (!(await currentStaff("gate"))) return { state: "session_expired" };
      return result;
    },
  });
}
