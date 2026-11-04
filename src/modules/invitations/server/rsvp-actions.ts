"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { invitationTokenSchema } from "../lib/token";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/modules/shared/server/db/client";
import { createLogger } from "@/modules/shared/lib/logger";
import type { RsvpState } from "../lib/rsvp-state";
import { submitRsvp } from "./submit-rsvp";
import { saveRsvp } from "./save-rsvp";
import { z } from "zod";

const submissionVersion = z.object({
  expectedRevision: z.coerce.number().int().min(0),
  requestId: z.uuid(),
});

export async function respondToInvitation(
  _previous: RsvpState,
  form: FormData,
): Promise<RsvpState> {
  try {
    const version = submissionVersion.safeParse({
      expectedRevision: form.get("revision") ?? undefined,
      requestId: form.get("requestId"),
    });
    if (!version.success)
      return { status: "error", message: "Please refresh this invitation before replying." };
    const result = await submitRsvp(
      { token: form.get("token"), attendance: form.get("attendance") },
      (token, attending) => saveRsvp(db, token, attending, version.data),
    );
    const token = invitationTokenSchema.safeParse(form.get("token"));
    if ((result.status === "yes" || result.status === "no") && token.success) {
      revalidatePath(`/i/${encodeURIComponent(token.data)}`);
    }
    return result;
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "invitations" }).warn("RSVP save unavailable");
    return { status: "error", message: "We couldn’t save your reply just now. Please try again." };
  }
}
