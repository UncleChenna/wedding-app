import "server-only";
import { z } from "zod";
import { invitationTokenSchema } from "../lib/token";
import { invitationSiteCopy } from "../lib/copy";
import type { RsvpState } from "../lib/rsvp-state";

export type SaveRsvpResult = "saved" | "unavailable" | "not-open";
const inputSchema = z
  .object({ token: invitationTokenSchema, attendance: z.enum(["yes", "no"]) })
  .strict();

export async function submitRsvp(
  input: unknown,
  save: (token: string, attending: boolean) => Promise<SaveRsvpResult>,
): Promise<RsvpState> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success)
    return { status: "error", message: "Please choose whether you’ll join us and try again." };
  const result = await save(parsed.data.token, parsed.data.attendance === "yes");
  if (result === "unavailable")
    return {
      status: "error",
      message: "This invitation is no longer available. Please contact the couple.",
    };
  if (result === "not-open")
    return { status: "error", message: "Replies aren’t open just yet. Please check back soon." };
  return {
    status: parsed.data.attendance,
    message:
      parsed.data.attendance === "yes" ? invitationSiteCopy.confirmed : invitationSiteCopy.declined,
  };
}
