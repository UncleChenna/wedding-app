import "server-only";

import { invitationTokenSchema } from "../lib/token";

export interface GuestInvitation {
  householdName: string | null;
  primaryNames: string[];
  attendance: "yes" | "no" | null;
}

interface StoredInvitation extends Omit<GuestInvitation, "attendance"> {
  status: "draft" | "sent" | "rsvp_yes" | "rsvp_no" | "revoked";
}

/** Do not return database identifiers, staff notes or contact details to guest components. */
export async function resolveInvitation(
  token: unknown,
  find: (token: string) => Promise<StoredInvitation | null>,
): Promise<GuestInvitation | null> {
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) return null;
  const invitation = await find(parsed.data);
  if (!invitation || invitation.status === "revoked" || invitation.status === "draft") return null;
  return {
    attendance:
      invitation.status === "rsvp_yes" ? "yes" : invitation.status === "rsvp_no" ? "no" : null,
    householdName: invitation.householdName,
    primaryNames: invitation.primaryNames,
  };
}
