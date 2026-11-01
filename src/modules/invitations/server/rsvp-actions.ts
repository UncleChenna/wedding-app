"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { invitationHref } from "@/modules/shared/lib/routes";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/modules/shared/server/db/client";
import { createLogger } from "@/modules/shared/lib/logger";
import type { RsvpState } from "../lib/rsvp-state";
import { submitRsvp } from "./submit-rsvp";
import { saveRsvp } from "./save-rsvp";

export async function respondToInvitation(
  _previous: RsvpState,
  form: FormData,
): Promise<RsvpState> {
  try {
    const token = form.get("token");
    const result = await submitRsvp(
      { token, attendance: form.get("attendance") },
      (token, attending) => saveRsvp(db, token, attending),
    );
    if ((result.status === "yes" || result.status === "no") && typeof token === "string") {
      revalidatePath(invitationHref(token));
    }
    return result;
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "invitations" }).warn("RSVP save unavailable");
    return { status: "error", message: "We couldn’t save your reply just now. Please try again." };
  }
}
