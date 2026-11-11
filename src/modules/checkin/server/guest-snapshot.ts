import "server-only";
import { db } from "@/modules/shared/server/db/client";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import { scannerSessionFingerprint } from "./scanner-session-fingerprint";
import { gatePublicKeys, loadGateSigningKeys } from "./signing";
import { guestSnapshotResponse } from "./guest-snapshot-response";
import { readGuestSnapshotRows } from "./guest-snapshot-repository";

export function getGuestSnapshotResponse() {
  return guestSnapshotResponse({
    authorize: async () => {
      const device = await currentStaffDevice("gate");
      if (!device) return null;
      const session = await scannerSessionFingerprint();
      return session ? { session, expiresAt: device.expiresAt.getTime() } : null;
    },
    load: async () => {
      const keys = loadGateSigningKeys();
      if (!keys.ok) throw new Error("Scanner verification keys unavailable");
      const invitations = await db.transaction(readGuestSnapshotRows, {
        isolationLevel: "repeatable read",
        accessMode: "read only",
      });
      return { keys: gatePublicKeys(keys.value), invitations };
    },
  });
}
