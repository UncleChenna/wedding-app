import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";

export const memberRsvpInputSchema = z
  .strictObject({
    expectedRevision: z.number().int().min(0).max(2_147_483_646),
    requestId: z.uuid(),
    members: z
      .array(
        z.strictObject({
          guestId: z.uuid(),
          attendance: z.enum(["yes", "no"]),
          dietaryNotes: z.string().trim().max(2000),
        }),
      )
      .min(1)
      .max(350),
  })
  .refine(
    (input) => new Set(input.members.map((member) => member.guestId)).size === input.members.length,
    { message: "Choose each invited person only once", path: ["members"] },
  );

export type MemberRsvpInput = z.infer<typeof memberRsvpInputSchema>;

export function rsvpFingerprint(input: MemberRsvpInput): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        revision: input.expectedRevision,
        members: [...input.members].sort((a, b) => a.guestId.localeCompare(b.guestId)),
      }),
    )
    .digest("hex");
}

/** Cutoffs are stored as instants after validation of the configured venue time zone. */
export function repliesAllowed(cutoff: Date | null, reopenUntil: Date | null, now: Date): boolean {
  return (reopenUntil !== null && reopenUntil > now) || cutoff === null || now < cutoff;
}
