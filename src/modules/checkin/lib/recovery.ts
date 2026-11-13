import { z } from "zod";
import { scanEventSchema, MAX_SYNC_EVENTS } from "./scan-sync";

export const recoveryRecordSchema = z.strictObject({
  actor: z.strictObject({ staffId: z.uuid(), deviceId: z.string().regex(/^[a-f0-9]{64}$/) }),
  event: scanEventSchema,
});
export const recoveryExportSchema = z
  .strictObject({
    version: z.literal(1),
    records: z.array(recoveryRecordSchema).min(1).max(MAX_SYNC_EVENTS),
  })
  .refine(
    (value) =>
      new Set(value.records.map((row) => row.event.clientEventId)).size === value.records.length,
  );
export const recoveryImportSchema = z.strictObject({
  requestId: z.uuid(),
  reviewed: z.literal(true),
  evidence: recoveryExportSchema,
});
export type RecoveryRecord = z.infer<typeof recoveryRecordSchema>;
export type RecoveryExport = z.infer<typeof recoveryExportSchema>;
export const RECOVERY_BODY_LIMIT = 128 * 1024;

/** Stable intent identity; session fingerprints and other local metadata never leave the device. */
export function recoveryRecordIdentity(record: RecoveryRecord): string {
  const { actor, event } = record;
  return JSON.stringify([
    actor.staffId.toLowerCase(),
    actor.deviceId,
    event.clientEventId.toLowerCase(),
    event.invitationId?.toLowerCase() ?? null,
    event.passVersion,
    new Date(event.reportedAt).toISOString(),
    event.reportedResult,
    event.reportedPeople,
    event.kind ?? (event.reportedPeople > 0 ? "admission" : "observation"),
    event.inputMethod ?? "qr",
  ]);
}

export const recoveryAckSchema = z.strictObject({
  clientEventId: z.uuid(),
  status: z.enum(["recorded", "duplicate"]),
  result: z.enum(["valid", "already_used", "invalid", "revoked", "not_rsvped"]),
  admitted: z.int().min(0).max(50),
  conflict: z.boolean(),
});
export const recoveryReceiptSchema = z.strictObject({
  version: z.literal(1),
  expiresAt: z.int().positive(),
  entries: z
    .array(
      z.strictObject({
        actor: recoveryRecordSchema.shape.actor,
        digest: z.string().regex(/^[a-f0-9]{64}$/),
        ack: recoveryAckSchema,
      }),
    )
    .min(1)
    .max(MAX_SYNC_EVENTS),
});
export type RecoveryReceipt = z.infer<typeof recoveryReceiptSchema>;
export const recoveryResultSchema = z.strictObject({
  acks: z
    .array(
      z.union([
        recoveryAckSchema,
        z.strictObject({ clientEventId: z.uuid(), status: z.enum(["rejected", "retry"]) }),
      ]),
    )
    .max(MAX_SYNC_EVENTS),
  receipt: z
    .string()
    .max(256 * 1024)
    .nullable(),
});
