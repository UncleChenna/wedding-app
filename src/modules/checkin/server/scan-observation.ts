import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { registeredDevices, scanEvents, staff } from "@/modules/shared/server/db/schema";
import type { AdmissionActor } from "../lib/online-admission";
import { observationInputSchema, type ScanObservation } from "../lib/scan-observation";

/** Server-only contract: actor comes from authenticated session, never request JSON.
 * Manual lookup callers supply a server-resolved invitation/verdict, not a raw name/token.
 * A scan observation is zero-person evidence, never an admission receipt.
 */
export function recordScanObservation(
  database: Pick<Db, "transaction">,
  actor: AdmissionActor,
  input: ScanObservation,
  reauthorize: () => Promise<boolean>,
): Promise<boolean> {
  const observation = observationInputSchema.parse(input);
  return database.transaction(async (tx) => {
    const [member] = await tx
      .select({ id: staff.id })
      .from(staff)
      .where(
        and(
          eq(staff.id, actor.staffId),
          eq(staff.role, "gate"),
          eq(staff.credentialVersion, actor.credentialVersion),
          isNull(staff.revokedAt),
        ),
      )
      .for("share");
    const [device] = await tx
      .select({ id: registeredDevices.id })
      .from(registeredDevices)
      .where(
        and(
          eq(registeredDevices.id, actor.deviceId),
          eq(registeredDevices.role, "gate"),
          isNull(registeredDevices.revokedAt),
        ),
      )
      .for("share");
    if (!member || !device || !(await reauthorize())) return false;
    await tx.insert(scanEvents).values({
      clientEventId: randomUUID(),
      invitationId: observation.invitationId,
      staffId: actor.staffId,
      deviceId: actor.deviceId,
      reportedAt: observation.reportedAt,
      reportedResult: observation.result,
      result: observation.result,
      inputMethod: observation.inputMethod,
      source: "online",
      reportedPeople: 0,
      admittedPeople: 0,
    });
    return true;
  });
}
