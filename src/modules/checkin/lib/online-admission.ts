import { z } from "zod";

export const admissionRequestSchema = z.strictObject({
  clientEventId: z.uuid(),
  qr: z.string().min(1).max(4096),
  people: z.number().int().min(1).max(2147483647),
});
export type AdmissionRequest = z.infer<typeof admissionRequestSchema>;
export type AdmissionActor = { staffId: string; deviceId: string; credentialVersion: number };

type RecordedAdmission = {
  staffId: string | null;
  deviceId: string | null;
  invitationId: string | null;
  source: string;
  result: string;
  reportedPeople: number;
  admittedPeople: number;
  conflict: boolean;
};

/** An existing immutable event is a receipt, never permission to admit someone again. */
export function sameOnlineAdmission(
  stored: RecordedAdmission,
  actor: Pick<AdmissionActor, "staffId" | "deviceId">,
  intent: { invitationId: string; people: number },
): boolean {
  return (
    stored.source === "online" &&
    stored.result === "valid" &&
    !stored.conflict &&
    stored.staffId === actor.staffId &&
    stored.deviceId === actor.deviceId &&
    stored.invitationId === intent.invitationId &&
    stored.reportedPeople === intent.people &&
    stored.admittedPeople === intent.people
  );
}

const count = z.number().int().min(0).max(2147483647);
export const admissionResponseSchema = z.discriminatedUnion("state", [
  z.strictObject({
    state: z.literal("recorded"),
    people: count.min(1),
    admittedSoFar: count.min(1),
    remaining: count,
    name: z.string().min(1),
    tableNumber: count.min(1).nullable(),
    recordedAt: z.iso.datetime(),
  }),
  z.strictObject({
    state: z.literal("duplicate"),
    people: count.min(1),
    recordedAt: z.iso.datetime(),
  }),
  z.strictObject({ state: z.literal("too_many"), remaining: count }),
  z.strictObject({
    state: z.enum([
      "invalid",
      "revoked",
      "not_rsvped",
      "already_used",
      "conflict",
      "session_expired",
      "unavailable",
    ]),
  }),
]);
export type AdmissionResponse = z.infer<typeof admissionResponseSchema>;
