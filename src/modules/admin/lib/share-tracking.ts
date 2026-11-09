import { z } from "zod";

export const shareChannelSchema = z.enum(["whatsapp", "email", "copy", "native"]);
export type ShareChannel = z.infer<typeof shareChannelSchema>;
export const shareTrackingInputSchema = z.object({
  invitationId: z.uuid(),
  expectedVersion: z.number().int().positive(),
  channel: shareChannelSchema,
  requestId: z.uuid(),
  purpose: z.enum(["invitation", "reminder"]).default("invitation"),
});
export type ShareTrackingState = {
  status: "draft" | "sent" | "rsvp_yes" | "rsvp_no" | "revoked";
  sentAt: Date | null;
  tokenVersion: number;
};

/** Shared means an attempt, never confirmed delivery. RSVP state is independent. */
export function planShare(current: ShareTrackingState, expectedVersion: number, now: Date) {
  if (current.status === "revoked" || current.tokenVersion !== expectedVersion)
    return { ok: false } as const;
  return {
    ok: true,
    status: current.status === "draft" ? "sent" : current.status,
    sentAt: current.sentAt ?? now,
  } as const;
}

/** Caller locks the invitation and proves this is its latest, owned, unexpired event. */
export function planShareUndo(
  current: ShareTrackingState,
  previous: ShareTrackingState,
  latest: boolean,
) {
  if (!latest || current.tokenVersion !== previous.tokenVersion || current.status === "revoked")
    return { ok: false } as const;
  return {
    ok: true,
    status: current.status === "sent" && previous.status === "draft" ? "draft" : current.status,
    sentAt: previous.sentAt,
  } as const;
}
