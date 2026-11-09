import { z } from "zod";
import { normalisePhone } from "./phone";

const singleLine = (maximum: number) =>
  z
    .string()
    .max(maximum)
    .refine((value) => !/[\u0000-\u001f\u007f]/u.test(value));

export const lostLinkRequestSchema = z
  .object({
    name: singleLine(200)
      .transform((value) => value.trim().replace(/\s+/gu, " "))
      .pipe(z.string().min(1)),
    contact: singleLine(254).transform((value) => value.trim()),
  })
  .transform((value, context) => {
    const email = z.email().safeParse(value.contact);
    if (email.success) {
      return { name: value.name, contact: email.data.toLowerCase(), contactKind: "email" as const };
    }
    const phone = normalisePhone(value.contact);
    if (phone.ok) {
      return { name: value.name, contact: phone.phone, contactKind: "phone" as const };
    }
    context.addIssue({
      code: "custom",
      path: ["contact"],
      message: "Enter your email or full phone number.",
    });
    return z.NEVER;
  });

export type LostLinkRequest = z.output<typeof lostLinkRequestSchema>;
export type LostLinkCandidate = {
  invitationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
};

const normalizedName = (name: string) => name.trim().replace(/\s+/gu, " ").toLowerCase();
const shareableStatuses = new Set(["draft", "sent", "rsvp_yes", "rsvp_no"]);

/** Admin-only suggestion, never proof of identity or permission to send automatically. */
export function matchLostLinkRequest(
  request: LostLinkRequest,
  candidates: readonly LostLinkCandidate[],
): string | null {
  const matches = new Set<string>();
  for (const candidate of candidates) {
    if (!shareableStatuses.has(candidate.status)) continue;
    if (normalizedName(candidate.name) !== normalizedName(request.name)) continue;
    const contact =
      request.contactKind === "email" ? candidate.email?.trim().toLowerCase() : candidate.phone;
    if (contact === request.contact) matches.add(candidate.invitationId);
  }
  // Never guess which household to disclose when the same name/contact occurs twice.
  return matches.size === 1 ? (matches.values().next().value ?? null) : null;
}
