import { z } from "zod";
import { invitationVoiceSchema } from "@/modules/shared/lib/invitation-voice";
import { invitationMessages, invitationVoice } from "./copy";

const name = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[^{}\r\n]+$/u);
const link = z
  .url({ protocol: /^https?$/ })
  .max(2048)
  .regex(/^[^{}\r\n]+$/u)
  .refine((value) => {
    try {
      const url = new URL(value);
      return !url.username && !url.password;
    } catch {
      return false;
    }
  });
const inputSchema = z.object({
  recipient: z.object({ guestName: name, link }),
  settings: z.object({
    coupleNames: z.tuple([name, name]),
    invitationVoice: invitationVoiceSchema.default(invitationVoice),
  }),
});

export interface RenderedInvitationMessages {
  whatsapp: string;
  email: { subject: string; body: string };
  rsvp: string;
  dayBefore: string;
}
export type InvitationMessagesResult =
  { ok: true; messages: RenderedInvitationMessages } | { ok: false; message: string };

/** Plain text only. Callers retain guest authorization and transport-encoding duties. */
export function renderInvitationMessages(
  recipient: unknown,
  settings: unknown,
): InvitationMessagesResult {
  const invalid = {
    ok: false as const,
    message: "Check the guest name, couple names, invitation link and message voice.",
  };
  const parsed = inputSchema.safeParse({ recipient, settings });
  if (!parsed.success) return invalid;
  const data = parsed.data;
  const replacements: Record<string, string> = {
    "{GuestName}": data.recipient.guestName,
    "{Couple}": data.settings.coupleNames.join(" & "),
    "{Link}": data.recipient.link,
  };
  // A callback inserts values literally: $&, $1 and dollar signs are not replacement syntax.
  const fill = (template: string) =>
    template.replace(/\{GuestName\}|\{Couple\}|\{Link\}/g, (token) => replacements[token] ?? token);
  const messages: RenderedInvitationMessages = {
    whatsapp: fill(invitationMessages.whatsapp[data.settings.invitationVoice]),
    email: {
      subject: fill(invitationMessages.email.subject),
      body: fill(invitationMessages.email.body),
    },
    rsvp: fill(invitationMessages.reminders.rsvp),
    dayBefore: fill(invitationMessages.reminders.dayBefore),
  };
  if (
    [
      messages.whatsapp,
      messages.email.subject,
      messages.email.body,
      messages.rsvp,
      messages.dayBefore,
    ].some((text) => /[{}]/.test(text))
  )
    return invalid;
  return { ok: true, messages };
}
