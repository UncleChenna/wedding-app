"use server";
import "server-only";
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
    return await submitRsvp(
      { token: form.get("token"), attendance: form.get("attendance") },
      (token, attending) => saveRsvp(db, token, attending),
    );
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "invitations" }).warn("RSVP save unavailable");
    return { status: "error", message: "We couldn’t save your reply just now. Please try again." };
  }
}
