import { z } from "zod";

export const STAFF_ROLE_OPTIONS = [
  { value: "gate", label: "Gate" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bar", label: "Bar" },
  { value: "host", label: "Table host" },
] as const;

export const newStaffSchema = z.strictObject({
  name: z
    .string()
    .transform((value) =>
      value
        .replace(/[\p{Cc}\p{Cf}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .pipe(z.string().min(1, "Enter their name.").max(80, "Keep the name to 80 characters.")),
  role: z.enum(["gate", "kitchen", "bar", "host"], {
    error: "Choose the gate, the kitchen, the bar or table host.",
  }),
});

export type StaffFormState =
  | { status: "idle" }
  | { status: "saved"; message: string }
  | {
      status: "error";
      message: string;
      field?: "name" | "role";
      /** Shown beside the field; `message` is the short summary in the status line. */
      fieldMessage?: string;
    };

/** A freshly issued PIN lives only in this state, in the admin's browser, until they leave the page. */
export type PinState =
  | { status: "idle" }
  | { status: "issued"; pin: string; name: string; until: string }
  | { status: "revoked"; message: string }
  | { status: "error"; message: string };

export const staffCopy = {
  heading: "Staff",
  intro:
    "People at the gate, kitchen and bar, and table hosts, sign in with a six-digit PIN. Each PIN works until the morning after the wedding.",
  add: "Add a person",
  adding: "Adding…",
  added: "Added. Issue them a PIN when you're ready.",
  noPin: "No PIN yet",
  revoked: "Access removed",
  activeUntil: (when: string) => `PIN works until ${when}`,
  issue: "Issue PIN",
  reset: "Reset PIN",
  revoke: "Remove access",
  issuedFor: (name: string) => `PIN for ${name}`,
  writeDown: "Share it with them now. It won't be shown again; reset it if it's lost.",
  removedNow: "Access removed. Their devices are signed out on their next screen.",
  noTimeZone: "Set the venue time zone in Settings first, so the PIN knows when to expire.",
  eventOver: "The wedding is over, so new PINs can't be issued.",
  missing: "That person isn't on the list any more. Refresh to see the latest.",
  noUniquePin: "We couldn't find a fresh PIN just now. Please try again.",
  failed: "We couldn't do that just now. Please try again.",
  empty: "No staff yet. Add the first person below.",
} as const;

/** Table numbers typed as "3, 4, 7" or "3 4 7" (TICKET-082). Blank clears the host's tables. */
export const hostTablesSchema = z.strictObject({
  id: z.uuid(),
  tables: z
    .string()
    .max(400, "Keep it to the table numbers.")
    .transform((value, context) => {
      const parts = value.split(/[\s,]+/).filter(Boolean);
      if (parts.some((part) => !/^[1-9][0-9]{0,3}$/.test(part))) {
        context.addIssue({ code: "custom", message: "Use table numbers, like 3, 4, 7." });
        return z.NEVER;
      }
      return [...new Set(parts.map(Number))].sort((a, b) => a - b);
    }),
});

export type HostTablesState =
  | { status: "idle" }
  | { status: "saved"; message: string }
  | { status: "error"; message: string; tables: string; fieldMessage?: string };

export const hostTablesCopy = {
  label: "Their tables",
  hint: "Table numbers, like 3, 4, 7. They see orders for these tables only.",
  none: "No tables yet",
  list: (numbers: readonly number[]) => `Tables ${numbers.join(", ")}`,
  save: "Save tables",
  saving: "Saving…",
  saved: "Tables saved.",
  cleared: "Tables cleared.",
  unknown: (numbers: readonly number[]) =>
    `There's no table ${numbers.join(", ")}. Check the seating plan.`,
  check: "Please check the table numbers.",
  missing: "That host isn't on the list any more. Refresh to see the latest.",
  failed: "We couldn't save that just now. Please try again.",
} as const;
