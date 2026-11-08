import { z } from "zod";

export const STAFF_ROLE_OPTIONS = [
  { value: "gate", label: "Gate" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bar", label: "Bar" },
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
  role: z.enum(["gate", "kitchen", "bar"], { error: "Choose the gate, the kitchen or the bar." }),
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
    "People at the gate, kitchen and bar sign in with a six-digit PIN. Each PIN works until the morning after the wedding.",
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
