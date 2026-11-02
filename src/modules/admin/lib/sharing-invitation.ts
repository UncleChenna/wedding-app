import { renderInvitationMessages } from "@/modules/invitations/lib/messages";
import type { ShareInput } from "@/modules/invitations/lib/share";
import type { EventSettings } from "@/modules/shared/lib/event-settings";
import { invitationHref } from "@/modules/shared/lib/routes";

export interface SharingInvitation {
  id: string;
  name: string;
  status: string;
  share?: ShareInput;
  guidance?: string;
}
export function prepareSharingInvitation(
  row: { id: string; token: string; status: string; name: string },
  settings: Pick<EventSettings, "coupleNames" | "invitationVoice">,
  siteUrl: string,
): SharingInvitation {
  const base = { id: row.id, name: row.name, status: row.status };
  if (!["sent", "rsvp_yes", "rsvp_no"].includes(row.status)) {
    return {
      ...base,
      guidance:
        row.status === "revoked"
          ? "This invitation has been withdrawn."
          : "Publish this invitation before sharing it.",
    };
  }
  const url = new URL(invitationHref(row.token), siteUrl).href;
  const result = renderInvitationMessages({ guestName: row.name, link: url }, settings);
  if (!result.ok) return { ...base, guidance: result.message };
  return {
    ...base,
    share: { url, subject: result.messages.email.subject, message: result.messages.whatsapp },
  };
}
