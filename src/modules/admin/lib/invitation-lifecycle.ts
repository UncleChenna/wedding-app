import { z } from "zod";

export const lifecycleStatusSchema = z.enum(["draft", "sent", "rsvp_yes", "rsvp_no", "revoked"]);
export type LifecycleStatus = z.infer<typeof lifecycleStatusSchema>;
export const invitationLifecycleCommandSchema = z
  .object({
    invitationId: z.uuid(),
    operation: z.enum(["revoke", "reissue"]),
    expectedVersion: z.number().int().min(1).max(2147483647),
    expectedStatus: lifecycleStatusSchema,
    confirmation: z.literal("confirm"),
  })
  .strict();
export type InvitationLifecycleCommand = z.infer<typeof invitationLifecycleCommandSchema>;
export type LifecycleCurrent = {
  status: LifecycleStatus;
  tokenVersion: number;
  attending: boolean | null;
};
export type LifecyclePlan =
  | { ok: true; status: LifecycleStatus; tokenVersion: number; rotateToken: boolean }
  | { ok: false; code: "conflict" | "already_revoked" | "version_exhausted" };

/** Evaluate against the locked current row, never against the form's claimed state. */
export function planInvitationLifecycle(
  current: LifecycleCurrent,
  command: InvitationLifecycleCommand,
): LifecyclePlan {
  if (current.tokenVersion !== command.expectedVersion || current.status !== command.expectedStatus)
    return { ok: false, code: "conflict" };
  if (command.operation === "revoke") {
    if (current.status === "revoked") return { ok: false, code: "already_revoked" };
    return { ok: true, status: "revoked", tokenVersion: current.tokenVersion, rotateToken: false };
  }
  if (current.tokenVersion >= 2147483647) return { ok: false, code: "version_exhausted" };
  return {
    ok: true,
    status:
      current.attending === true ? "rsvp_yes" : current.attending === false ? "rsvp_no" : "sent",
    tokenVersion: current.tokenVersion + 1,
    rotateToken: true,
  };
}

export type LifecycleFormState =
  { status: "idle" } | { status: "error" | "saved"; message: string };
