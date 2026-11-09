import { z } from "zod";
import type { GatePassPayload } from "./gate-token";

const credentialRowSchema = z
  .object({
    invitationId: z.uuid(),
    tokenVersion: z.number().int().min(1).max(2147483647),
    status: z.enum(["draft", "sent", "rsvp_yes", "rsvp_no", "revoked"]),
  })
  .strict();
export const credentialSnapshotSchema = z
  .object({
    generatedAt: z.iso.datetime(),
    invitations: z.array(credentialRowSchema).max(10_000),
  })
  .strict()
  .refine(
    (snapshot) =>
      new Set(snapshot.invitations.map((row) => row.invitationId)).size ===
      snapshot.invitations.length,
    "Duplicate invitation rows",
  );
export type CredentialSnapshot = z.infer<typeof credentialSnapshotSchema>;
export type SnapshotCredentialState =
  "current" | "replaced" | "revoked" | "unknown" | "invalid" | "not-attending";

/**
 * Call only after signature verification. "current" certifies the credential version,
 * not admission or remaining seats. Live session/allowance checks remain mandatory.
 * A disconnected device cannot infer a change absent from its last snapshot.
 */
export function snapshotCredentialState(
  payload: GatePassPayload,
  input: unknown,
): SnapshotCredentialState {
  const parsed = credentialSnapshotSchema.safeParse(input);
  if (!parsed.success) return "invalid";
  const row = parsed.data.invitations.find((candidate) => candidate.invitationId === payload.inv);
  if (!row) return "unknown";
  if (row.status === "draft") return "invalid";
  if (row.status === "revoked") return "revoked";
  if (payload.ver < row.tokenVersion) return "replaced";
  if (payload.ver > row.tokenVersion) return "invalid";
  if (row.status === "rsvp_no") return "not-attending";
  return "current";
}

/** ADR 0020: refresh after five minutes; warn after thirty, with no invented hard expiry. */
export function snapshotFreshness(snapshot: CredentialSnapshot, now: number) {
  const age = Math.max(0, now - Date.parse(snapshot.generatedAt));
  return {
    ageMinutes: Math.floor(age / 60_000),
    refreshDue: age >= 5 * 60_000,
    stale: age >= 30 * 60_000,
  };
}
