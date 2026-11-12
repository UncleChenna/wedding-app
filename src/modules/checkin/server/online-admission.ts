import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import {
  admissionCounters,
  invitations,
  registeredDevices,
  scanEvents,
  staff,
} from "@/modules/shared/server/db/schema";
import { decideAdmission } from "../lib/admission";
import {
  sameOnlineAdmission,
  type AdmissionActor,
  type AdmissionResponse,
} from "../lib/online-admission";
import { findStoredPass } from "./pass-repository";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type VerifiedAdmissionIntent = {
  clientEventId: string;
  invitationId: string;
  passVersion: number;
  people: number;
  inputMethod?: "qr" | "manual";
};

async function replay(
  tx: Tx,
  actor: AdmissionActor,
  intent: VerifiedAdmissionIntent,
): Promise<AdmissionResponse | null> {
  const [stored] = await tx
    .select({
      staffId: scanEvents.staffId,
      deviceId: scanEvents.deviceId,
      invitationId: scanEvents.invitationId,
      source: scanEvents.source,
      result: scanEvents.result,
      reportedPeople: scanEvents.reportedPeople,
      admittedPeople: scanEvents.admittedPeople,
      conflict: scanEvents.conflict,
      receivedAt: scanEvents.receivedAt,
      inputMethod: scanEvents.inputMethod,
    })
    .from(scanEvents)
    .where(eq(scanEvents.clientEventId, intent.clientEventId));
  if (!stored) return null;
  return sameOnlineAdmission(stored, actor, intent)
    ? {
        state: "duplicate",
        people: stored.admittedPeople,
        recordedAt: stored.receivedAt.toISOString(),
      }
    : { state: "conflict" };
}

/** Commit one online admission, never a provisional success or a second counter increment. */
export function admitVerifiedPass(
  database: Pick<Db, "transaction">,
  actor: AdmissionActor,
  intent: VerifiedAdmissionIntent,
  reauthorize: () => Promise<boolean>,
): Promise<AdmissionResponse> {
  return database.transaction(async (tx): Promise<AdmissionResponse> => {
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
    if (!member || !device) return { state: "session_expired" };
    // Match existing admission/reconciliation lock order. RSVP and reissue serialize here.
    const [invitation] = await tx
      .select({ id: invitations.id })
      .from(invitations)
      .where(eq(invitations.id, intent.invitationId))
      .for("update");
    if (!(await reauthorize())) return { state: "session_expired" };
    const previous = await replay(tx, actor, intent);
    if (previous) return previous;
    if (!invitation) return { state: "invalid" };
    const pass = await findStoredPass(tx, invitation.id);
    if (!pass) return { state: "invalid" };
    const [counter] = await tx
      .select({ admitted: admissionCounters.admittedPeople })
      .from(admissionCounters)
      .where(eq(admissionCounters.invitationId, invitation.id));
    const decision = decideAdmission({
      invitation: pass,
      passVersion: intent.passVersion,
      admittedSoFar: counter?.admitted ?? 0,
      requested: intent.people,
    });
    if (decision.result === "too_many") return { state: "too_many", remaining: decision.remaining };
    if (decision.result === "bad_count") return { state: "invalid" };
    if (decision.result !== "valid") return { state: decision.result };
    // Recheck after all reads too: a session deadline can pass while waiting on I/O.
    if (!(await reauthorize())) return { state: "session_expired" };
    const [inserted] = await tx
      .insert(scanEvents)
      .values({
        clientEventId: intent.clientEventId,
        invitationId: invitation.id,
        staffId: actor.staffId,
        deviceId: actor.deviceId,
        reportedAt: new Date(),
        reportedResult: "valid",
        result: "valid",
        reportedPeople: intent.people,
        admittedPeople: decision.admit,
        source: "online",
        inputMethod: intent.inputMethod ?? "qr",
      })
      .onConflictDoNothing({ target: scanEvents.clientEventId })
      .returning({ receivedAt: scanEvents.receivedAt });
    if (!inserted) return (await replay(tx, actor, intent)) ?? { state: "conflict" };
    return {
      state: "recorded",
      people: decision.admit,
      admittedSoFar: decision.admittedAfter,
      remaining: decision.remaining,
      name: pass.primaryNames.join(" & ") || pass.householdName?.trim() || "Guest",
      tableNumber: pass.tableNumber,
      recordedAt: inserted.receivedAt.toISOString(),
    };
  });
}
