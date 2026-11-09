import { renderInvitationMessages } from "@/modules/invitations/lib/messages";
import type { EventSettings } from "@/modules/shared/lib/event-settings";
import { invitationHref } from "@/modules/shared/lib/routes";
import type { SharingInvitation } from "./sharing-invitation";

export function reminderEligible(status: string, hasRsvp: boolean) {
  return status === "sent" && !hasRsvp;
}

export function prepareReminder(
  row: { id: string; name: string; token: string; tokenVersion: number },
  settings: Pick<EventSettings, "coupleNames" | "invitationVoice">,
  siteUrl: string,
): SharingInvitation {
  const base = { id: row.id, name: row.name, status: "sent" };
  const url = new URL(invitationHref(row.token), siteUrl).href;
  const rendered = renderInvitationMessages({ guestName: row.name, link: url }, settings);
  if (!rendered.ok) return { ...base, guidance: rendered.message };
  return {
    ...base,
    tracking: { invitationId: row.id, expectedVersion: row.tokenVersion },
    share: { url, subject: rendered.messages.email.subject, message: rendered.messages.rsvp },
  };
}
