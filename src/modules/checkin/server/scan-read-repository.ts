import "server-only";
import { and, asc, eq, gt } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import {
  admissionCounters,
  scanEvents,
  staff,
  registeredDevices,
} from "@/modules/shared/server/db/schema";
import { findStoredPass } from "./pass-repository";

/** One consistent read of current eligibility, seating and canonical accepted arrivals. */
export function readScanGuest(database: Pick<Db, "transaction">, invitationId: string) {
  return database.transaction(
    async (tx) => {
      const pass = await findStoredPass(tx, invitationId);
      if (!pass) return null;
      const [counter] = await tx
        .select({ admittedSoFar: admissionCounters.admittedPeople })
        .from(admissionCounters)
        .where(eq(admissionCounters.invitationId, invitationId));
      const arrivals = await tx
        .select({
          people: scanEvents.admittedPeople,
          receivedAt: scanEvents.receivedAt,
          staffName: staff.name,
          deviceName: registeredDevices.name,
        })
        .from(scanEvents)
        .leftJoin(staff, eq(staff.id, scanEvents.staffId))
        .leftJoin(registeredDevices, eq(registeredDevices.id, scanEvents.deviceId))
        .where(
          and(
            eq(scanEvents.invitationId, invitationId),
            eq(scanEvents.result, "valid"),
            gt(scanEvents.admittedPeople, 0),
          ),
        )
        .orderBy(asc(scanEvents.receivedAt), asc(scanEvents.id));
      return {
        ...pass,
        admittedSoFar: counter?.admittedSoFar ?? 0,
        admissions: arrivals.map((arrival) => ({
          people: arrival.people,
          timeLabel: `${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(arrival.receivedAt)} UTC (server receipt)`,
          staffLabel: arrival.staffName ?? "Staff not recorded",
          deviceLabel: arrival.deviceName ?? "Device not recorded",
        })),
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}
