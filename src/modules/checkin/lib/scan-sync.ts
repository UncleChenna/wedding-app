import { z } from "zod";
import { decideAdmission, type AdmissionInvitation } from "./admission";

/**
 * The batch a gate device uploads when it reconnects (TICKET-173). Each event is one scan the
 * device already showed a result for; `clientEventId` makes a retried upload safe.
 */
export const SCAN_RESULTS = ["valid", "already_used", "invalid", "revoked", "not_rsvped"] as const;
export const MAX_SYNC_EVENTS = 200;

export const scanEventSchema = z
  .strictObject({
    clientEventId: z.uuid(),
    /** Null when the device could not match the pass to an invitation. */
    invitationId: z.uuid().nullable(),
    passVersion: z.int().min(1).max(1_000_000),
    reportedAt: z.iso.datetime({ offset: true }),
    reportedResult: z.enum(SCAN_RESULTS),
    /** People the device let in. Only a valid scan admits anyone. */
    reportedPeople: z.int().min(0).max(50),
    kind: z.enum(["admission", "observation"]).optional(),
    inputMethod: z.enum(["qr", "manual"]).optional(),
  })
  .refine(
    (event) =>
      event.kind === "observation"
        ? event.reportedPeople === 0
        : (event.reportedResult === "valid") === event.reportedPeople > 0,
    {
      message: "A valid scan admits at least one person; any other result admits nobody.",
      path: ["reportedPeople"],
    },
  );
export type ScanEventReport = z.infer<typeof scanEventSchema>;

export const scanSyncBatchSchema = z.strictObject({
  events: z.array(scanEventSchema).min(1).max(MAX_SYNC_EVENTS),
});

/** Original identity must be checked by the server, not merely by the uploading tab. */
export const scanSyncUploadSchema = scanSyncBatchSchema.extend({
  expectedActor: z.strictObject({
    staffId: z.uuid(),
    deviceId: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/),
  }),
});

export type ScanResult = (typeof SCAN_RESULTS)[number];

/**
 * One acknowledgement per uploaded event.
 * - `recorded`: stored now. `duplicate`: an identical upload was already stored.
 * - `rejected`: the id was already used for a different scan; nothing was stored.
 * - `retry`: not stored (the server could not commit it); the device must keep and resend it.
 */
export type ScanEventAck =
  | {
      clientEventId: string;
      status: "recorded" | "duplicate";
      result: ScanResult;
      admitted: number;
      conflict: boolean;
    }
  | { clientEventId: string; status: "rejected" | "retry" };

/** What the server knows about the invitation when it reconciles one report. */
export type ReconcileState = { invitation: AdmissionInvitation | null; admittedSoFar: number };

export type ReconciledScan = { result: ScanResult; admitted: number; conflict: boolean };

/**
 * Decides what an uploaded scan counts for. Guests the device let in are already inside, so the
 * report is always kept as evidence; only the canonical count is bounded by the allowance.
 * - A valid report within the remaining allowance counts in full.
 * - A valid report over the allowance counts only what remains, and is flagged as a conflict
 *   (for example two offline devices each admitting the same party of four).
 * - A valid report the server would have refused (revoked, unknown, not RSVP'd, already used)
 *   counts nobody and is flagged.
 * - A refusal the device showed admits nobody and needs no review.
 */
export function reconcileScan(report: ScanEventReport, state: ReconcileState): ReconciledScan {
  if (report.kind === "observation") {
    return report.reportedPeople === 0
      ? { result: report.reportedResult, admitted: 0, conflict: false }
      : { result: "invalid", admitted: 0, conflict: true };
  }
  if (report.reportedResult !== "valid") {
    return { result: report.reportedResult, admitted: 0, conflict: false };
  }
  const decision = decideAdmission({
    invitation: state.invitation,
    passVersion: report.passVersion,
    admittedSoFar: state.admittedSoFar,
    requested: report.reportedPeople,
  });
  switch (decision.result) {
    case "valid":
      return { result: "valid", admitted: decision.admit, conflict: false };
    case "too_many":
      return { result: "valid", admitted: decision.remaining, conflict: true };
    case "bad_count":
      // Unreachable for a schema-checked report; count nobody rather than guess.
      return { result: "invalid", admitted: 0, conflict: true };
    default:
      return { result: decision.result, admitted: 0, conflict: true };
  }
}
