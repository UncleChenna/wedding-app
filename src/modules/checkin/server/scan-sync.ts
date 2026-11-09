import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import { reconcileScanBatch } from "./reconcile-scans";
import { scanSyncResponse } from "./scan-sync-response";

/** Live staff, device, credential and event-expiry checks run before any scan is stored. */
export function postScanSync(request: Request) {
  return scanSyncResponse(request, {
    authorize: async () => {
      const current = await currentStaffDevice("gate");
      return current ? { staffId: current.identity.staffId, deviceId: current.device.id } : null;
    },
    reconcile: (actor, events) => reconcileScanBatch(db, actor, events),
  });
}
