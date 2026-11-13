import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/modules/shared/server/db/client";
import {
  invitations,
  registeredDevices,
  scanEvents,
  scanResolutionNotes,
  staff,
} from "@/modules/shared/server/db/schema";
import { currentStaffDevice } from "@/modules/shared/server/staff-cookies";
import { scannerSessionFingerprint } from "./scanner-session-fingerprint";
import { gateConflictsResponse } from "./gate-conflicts-response";
import type { GateConflict } from "../lib/gate-conflicts";
import type { Db } from "@/modules/shared/server/db/client";
/** Gate-authorized caller only. No pass, device credential, contact or dietary fields. */
export async function readGateConflicts(database: Pick<Db, "select">) {
  const rows = await database
    .select({
      id: scanEvents.id,
      household: invitations.householdName,
      staff: staff.name,
      device: registeredDevices.name,
      reportedAt: scanEvents.reportedAt,
      receivedAt: scanEvents.receivedAt,
      reportedPeople: scanEvents.reportedPeople,
      admittedPeople: scanEvents.admittedPeople,
      resolution: sql<
        GateConflict["resolution"]
      >`(select ${scanResolutionNotes.resolution} from ${scanResolutionNotes} where ${scanResolutionNotes.eventId} = ${scanEvents.id} order by ${scanResolutionNotes.recordedAt} desc, ${scanResolutionNotes.id} desc limit 1)`,
    })
    .from(scanEvents)
    .leftJoin(invitations, eq(invitations.id, scanEvents.invitationId))
    .leftJoin(staff, eq(staff.id, scanEvents.staffId))
    .leftJoin(registeredDevices, eq(registeredDevices.id, scanEvents.deviceId))
    .where(eq(scanEvents.conflict, true))
    .orderBy(desc(scanEvents.receivedAt), desc(scanEvents.id))
    .limit(25);
  return rows.map((row) => ({
    ...row,
    reportedAt: row.reportedAt.toISOString(),
    receivedAt: row.receivedAt.toISOString(),
  }));
}
export function getGateConflictsResponse() {
  return gateConflictsResponse({
    authorize: async () => {
      const device = await currentStaffDevice("gate");
      if (!device) return null;
      const session = await scannerSessionFingerprint();
      return session ? { session, expiresAt: device.expiresAt.getTime() } : null;
    },
    load: () => readGateConflicts(db),
  });
}
