import { z } from "zod";

import { normalisePhone } from "./phone";

const shareInputSchema = z.object({
  url: z.url({ protocol: /^https?$/ }).refine((value) => {
    try {
      const url = new URL(value);
      return !url.username && !url.password;
    } catch {
      return false;
    }
  }),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(4000),
  phone: z.string().trim().optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
});

export type ShareInput = z.input<typeof shareInputSchema>;
export type ShareLinksResult =
  | {
      ok: true;
      links: { whatsapp: string; email: string; url: string; subject: string; text: string };
    }
  | { ok: false; message: string };

const encode = (value: string) => encodeURIComponent(value.toWellFormed());

/** Caller supplies approved wording. No sending or sent-status writes happen here. */
export function buildShareLinks(input: unknown): ShareLinksResult {
  const parsed = shareInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Check the invitation link and contact details before sharing." };
  }
  const { url, subject, message, phone, email } = parsed.data;
  let recipient = "";
  if (phone) {
    const result = normalisePhone(phone);
    if (!result.ok) return { ok: false, message: result.error.message };
    recipient = result.phone.slice(1);
  }
  const text = (message.includes(url) ? message : message + "\n\n" + url).toWellFormed();
  return {
    ok: true,
    links: {
      whatsapp: "https://wa.me/" + recipient + "?text=" + encode(text),
      email:
        "mailto:" + encode(email ?? "") + "?subject=" + encode(subject) + "&body=" + encode(text),
      url,
      subject: subject.toWellFormed(),
      text,
    },
  };
}
