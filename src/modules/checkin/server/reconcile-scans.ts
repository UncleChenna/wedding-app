import "server-only";
import { createHash } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import {
  admissionCounters,
  invitations,
  registeredDevices,
  rsvps,
  scanEvents,
  staff,
} from "@/modules/shared/server/db/schema";
import { logger } from "@/modules/shared/lib/logger";
import { reconcileScan, type ScanEventAck, type ScanEventReport } from "../lib/scan-sync";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type GateActor = { staffId: string; deviceId: string };

/** The staff member or device lost gate access part-way through a batch. */
class ActorRevoked extends Error {}

type StoredEvent = {
  invitationId: string | null;
  deviceId: string | null;
  staffId: string | null;
  inputMethod: string | null;
  source: string;
  offlineIntentDigest: string | null;
  reportedAt: Date;
  reportedResult: ScanEventReport["reportedResult"];
  reportedPeople: number;
  result: ScanEventReport["reportedResult"];
  admittedPeople: number;
  conflict: boolean;
};

/**
 * Merges a device's offline scans into canonical admissions (TICKET-173).
 *
 * Each event commits in its own transaction, so an acknowledgement always means the scan is
 * stored, and one failing event never discards the others. Events are applied in upload order.
 * A failed or unauthorized event is answered `retry`, never acknowledged, so the device keeps it.
 */
export async function reconcileScanBatch(
  database: Pick<Db, "transaction">,
  actor: GateActor,
  events: readonly ScanEventReport[],
  reauthorize: () => Promise<boolean>,
): Promise<{ acks: ScanEventAck[]; revoked: boolean }> {
  const acks: ScanEventAck[] = [];
  let revoked = false;
  for (const event of events) {
    if (revoked) {
      acks.push({ clientEventId: event.clientEventId, status: "retry" });
      continue;
    }
    try {
      acks.push(await database.transaction((tx) => reconcileOne(tx, actor, event, reauthorize)));
    } catch (error) {
      if (error instanceof ActorRevoked) revoked = true;
      else logger.child({ module: "checkin-sync" }).warn("Offline scan could not be stored");
      acks.push({ clientEventId: event.clientEventId, status: "retry" });
    }
  }
  return { acks, revoked };
}

async function reconcileOne(
  tx: Tx,
  actor: GateActor,
  event: ScanEventReport,
  reauthorize: () => Promise<boolean>,
): Promise<ScanEventAck> {
  // Access is rechecked per event, so a revocation stops the rest of an in-flight batch.
  const [member] = await tx
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, actor.staffId), eq(staff.role, "gate"), isNull(staff.revokedAt)))
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
  if (!member || !device || !(await reauthorize())) throw new ActorRevoked();

  const replay = await findReplay(tx, actor, event);
  if (replay) return replay;

  // Lock the invitation first, the same order the admission triggers use, so concurrent
  // uploads for one party are applied one at a time against the current count.
  const [invitation] = event.invitationId
    ? await tx
        .select({
          id: invitations.id,
          status: invitations.status,
          tokenVersion: invitations.tokenVersion,
        })
        .from(invitations)
        .where(eq(invitations.id, event.invitationId))
        .for("update")
    : [];
  const [reply] = invitation
    ? await tx
        .select({ attending: rsvps.attending, countAttending: rsvps.countAttending })
        .from(rsvps)
        .where(eq(rsvps.invitationId, invitation.id))
    : [];
  const [counter] = invitation
    ? await tx
        .select({ admitted: admissionCounters.admittedPeople })
        .from(admissionCounters)
        .where(eq(admissionCounters.invitationId, invitation.id))
    : [];

  const decision = reconcileScan(event, {
    invitation: invitation
      ? {
          status: invitation.status,
          tokenVersion: invitation.tokenVersion,
          attending: reply?.attending ?? null,
          countAttending: reply?.countAttending ?? 0,
        }
      : null,
    admittedSoFar: counter?.admitted ?? 0,
  });

  // A lock wait can cross session/PIN expiry; recheck immediately before the append.
  if (!(await reauthorize())) throw new ActorRevoked();
  const inserted = await tx
    .insert(scanEvents)
    .values({
      clientEventId: event.clientEventId,
      // An unknown invitation is stored as unmatched evidence rather than refused.
      invitationId: invitation?.id ?? null,
      staffId: actor.staffId,
      deviceId: actor.deviceId,
      reportedAt: new Date(event.reportedAt),
      reportedResult: event.reportedResult,
      result: decision.result,
      reportedPeople: event.reportedPeople,
      admittedPeople: decision.admitted,
      conflict: decision.conflict,
      source: "offline",
      inputMethod: event.inputMethod ?? "qr",
      offlineIntentDigest: intentDigest(actor, event),
    })
    .onConflictDoNothing({ target: scanEvents.clientEventId })
    .returning({ id: scanEvents.id });
  if (inserted.length === 0) {
    // A concurrent upload of the same id committed first.
    return (
      (await findReplay(tx, actor, event)) ?? {
        clientEventId: event.clientEventId,
        status: "retry",
      }
    );
  }
  return {
    clientEventId: event.clientEventId,
    status: "recorded",
    result: decision.result,
    admitted: decision.admitted,
    conflict: decision.conflict,
  };
}

/** An id seen before is a no-op when it is the same scan from the same device, else refused. */
async function findReplay(
  tx: Tx,
  actor: GateActor,
  event: ScanEventReport,
): Promise<ScanEventAck | null> {
  const [stored] = await tx
    .select({
      invitationId: scanEvents.invitationId,
      deviceId: scanEvents.deviceId,
      staffId: scanEvents.staffId,
      inputMethod: scanEvents.inputMethod,
      source: scanEvents.source,
      offlineIntentDigest: scanEvents.offlineIntentDigest,
      reportedAt: scanEvents.reportedAt,
      reportedResult: scanEvents.reportedResult,
      reportedPeople: scanEvents.reportedPeople,
      result: scanEvents.result,
      admittedPeople: scanEvents.admittedPeople,
      conflict: scanEvents.conflict,
    })
    .from(scanEvents)
    .where(eq(scanEvents.clientEventId, event.clientEventId));
  if (!stored) return null;
  const sameIdentity =
    stored.offlineIntentDigest !== null
      ? stored.offlineIntentDigest === intentDigest(actor, event)
      : await sameInvitation(tx, stored, event);
  if (!sameScan(stored, actor, event) || !sameIdentity) {
    return { clientEventId: event.clientEventId, status: "rejected" };
  }
  return {
    clientEventId: event.clientEventId,
    status: "duplicate",
    result: stored.result,
    admitted: stored.admittedPeople,
    conflict: stored.conflict,
  };
}

function sameScan(stored: StoredEvent, actor: GateActor, event: ScanEventReport): boolean {
  return (
    stored.source === "offline" &&
    stored.deviceId === actor.deviceId &&
    stored.staffId === actor.staffId &&
    (stored.inputMethod ?? "qr") === (event.inputMethod ?? "qr") &&
    stored.reportedAt.getTime() === new Date(event.reportedAt).getTime() &&
    stored.reportedResult === event.reportedResult &&
    stored.reportedPeople === event.reportedPeople
  );
}

/** An unknown invitation is stored as null, so a retry naming it still matches. */
async function sameInvitation(tx: Tx, stored: StoredEvent, event: ScanEventReport) {
  if (stored.invitationId === event.invitationId) return true;
  if (stored.invitationId !== null || event.invitationId === null) return false;
  const [known] = await tx
    .select({ id: invitations.id })
    .from(invitations)
    .where(eq(invitations.id, event.invitationId));
  return !known;
}

/** Canonical non-secret intent identity. Old rows stay immutable and use legacy comparison. */
function intentDigest(actor: GateActor, event: ScanEventReport): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        1,
        actor.staffId.toLowerCase(),
        actor.deviceId,
        event.invitationId?.toLowerCase() ?? null,
        event.passVersion,
        new Date(event.reportedAt).toISOString(),
        event.reportedResult,
        event.reportedPeople,
        event.kind ?? (event.reportedPeople > 0 ? "admission" : "observation"),
        event.inputMethod ?? "qr",
      ]),
    )
    .digest("hex");
}
