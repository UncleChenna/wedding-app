import { z } from "zod";
import { normalisePhone } from "@/modules/invitations/lib/phone";

const memberSchema = z.strictObject({
  id: z.union([z.uuid(), z.literal("")]),
  name: z.string().trim().min(1, "Enter a guest name.").max(200),
  email: z
    .string()
    .trim()
    .max(254)
    .refine((value) => !value || z.email().safeParse(value).success, "Enter a valid email address.")
    .transform((value) => value || null),
  phone: z
    .string()
    .trim()
    .max(200)
    .transform((value, context) => {
      if (!value) return null;
      const result = normalisePhone(value);
      if (result.ok) return result.phone;
      context.addIssue({ code: "custom", message: result.error.message });
      return z.NEVER;
    }),
});
export const invitationEditorSchema = z
  .strictObject({
    householdName: z.string().trim().min(1, "Enter a household name.").max(200),
    side: z
      .string()
      .trim()
      .max(200)
      .transform((value) => value || null),
    tableId: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
    maxTagAlongs: z
      .string()
      .regex(/^\d{1,2}$/, "Enter a whole number from 0 to 10.")
      .transform(Number)
      .pipe(z.number().int().min(0).max(10)),
    members: z.array(memberSchema).min(1, "Keep at least one named guest.").max(300),
  })
  .superRefine((value, context) => {
    const seen = new Set<string>();
    value.members.forEach((member, index) => {
      if (member.id && seen.has(member.id))
        context.addIssue({
          code: "custom",
          path: ["members", index, "id"],
          message: "This guest appears twice. Refresh and try again.",
        });
      if (member.id) seen.add(member.id);
    });
  });
export type InvitationEditorInput = z.infer<typeof invitationEditorSchema>;
export type InvitationEditorValues = z.input<typeof invitationEditorSchema>;
export type InvitationEditorState =
  | { status: "idle" }
  | { status: "error"; message: string; fields?: Record<string, string> }
  | {
      status: "saved";
      message: string;
      id: string;
      snapshot: string;
      values: InvitationEditorValues;
    }
  | { status: "deleted"; message: string };
export interface InvitationEditorDetails {
  id: string;
  snapshot: string;
  status: "draft" | "sent" | "rsvp_yes" | "rsvp_no" | "revoked";
  tokenVersion: number;
  values: InvitationEditorValues;
  reply: { attending: boolean; countAttending: number } | null;
}

export function planDraftInvitation(input: InvitationEditorInput, token: () => string) {
  return {
    householdName: input.householdName,
    side: input.side,
    tableId: input.tableId,
    maxTagAlongs: input.maxTagAlongs,
    token: token(),
    status: "draft" as const,
    tokenVersion: 1,
  };
}

export function parseInvitationEditorForm(form: FormData) {
  const ids = form.getAll("memberId");
  const names = form.getAll("memberName");
  const emails = form.getAll("memberEmail");
  const phones = form.getAll("memberPhone");
  return invitationEditorSchema.safeParse({
    householdName: form.get("householdName"),
    side: form.get("side"),
    tableId: form.get("tableId"),
    maxTagAlongs: form.get("maxTagAlongs"),
    members: names.map((name, index) => ({
      id: ids[index],
      name,
      email: emails[index],
      phone: phones[index],
    })),
  });
}
