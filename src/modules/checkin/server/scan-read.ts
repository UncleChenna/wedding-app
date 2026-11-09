import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import { resolveScanRead } from "../lib/resolve-scan-read";
import { observationResult } from "../lib/scan-observation";
import { scanReadResponse } from "./scan-read-response";
import { readScanGuest } from "./scan-read-repository";
import { recordScanObservation } from "./scan-observation";
import { gatePublicKeys, loadGateSigningKeys } from "./signing";

export function postScanRead(request: Request) {
  return scanReadResponse(request, {
    authorize: async () => (await currentStaffDevice("gate")) !== null,
    read: async (qr, origin, reportedAt) => {
      const current = await currentStaffDevice("gate");
      if (!current) return { state: "session_expired" };
      const actor = {
        staffId: current.identity.staffId,
        deviceId: current.device.id,
        credentialVersion: current.identity.credentialVersion,
      };
      const keys = loadGateSigningKeys();
      if (!keys.ok) return { state: "unavailable" };
      let invitationId: string | null = null;
      const result = await resolveScanRead(qr, origin, gatePublicKeys(keys.value), async (id) => {
        const row = await readScanGuest(db, id);
        if (row) invitationId = id;
        return row;
      });
      const reauthorize = async () => {
        const next = await currentStaffDevice("gate");
        return (
          next !== null &&
          next.identity.staffId === actor.staffId &&
          next.device.id === actor.deviceId &&
          next.identity.credentialVersion === actor.credentialVersion
        );
      };
      const loggedResult = observationResult(result.state);
      if (loggedResult !== null) {
        const recorded = await recordScanObservation(
          db,
          actor,
          {
            invitationId,
            result: loggedResult,
            inputMethod: "qr",
            reportedAt,
          },
          reauthorize,
        );
        if (!recorded) return { state: "session_expired" };
      }
      // Revocation or expiry during reading/logging must not reveal private guest information.
      if (!(await reauthorize())) return { state: "session_expired" };
      return result;
    },
  });
}
