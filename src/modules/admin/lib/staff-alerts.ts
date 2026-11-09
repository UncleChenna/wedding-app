import { z } from "zod";

/** The venue is in Nigeria (Africa/Lagos), so a local number like 0803 123 4567 means +234. */
export const DEFAULT_COUNTRY_CODE = "234";

/**
 * Normalises a typed WhatsApp number to E.164, or returns null when it can't be one. Spaces,
 * dashes, dots and brackets are ignored; `00` is read as `+`; a leading `0` is a local number.
 */
export function normalizeWhatsAppNumber(
  input: string,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): string | null {
  const compact = input.trim().replace(/[\s().-]/g, "");
  let digits: string;
  if (compact.startsWith("+")) digits = compact.slice(1);
  else if (compact.startsWith("00")) digits = compact.slice(2);
  else if (compact.startsWith("0")) digits = countryCode + compact.slice(1);
  else digits = compact;
  return /^[1-9][0-9]{7,14}$/.test(digits) ? `+${digits}` : null;
}

export const STATION_ROLES = ["kitchen", "bar"] as const;

export const alertContactSchema = z
  .strictObject({
    id: z.uuid(),
    number: z.string().max(40, "Enter a phone number."),
    optIn: z.boolean(),
  })
  .transform((value, context) => {
    const blank = value.number.trim() === "";
    const number = blank ? null : normalizeWhatsAppNumber(value.number);
    if (!blank && !number)
      context.addIssue({
        code: "custom",
        path: ["number"],
        message: "Enter a WhatsApp number, like 0803 123 4567 or +44 7700 900123.",
      });
    if (value.optIn && blank)
      context.addIssue({
        code: "custom",
        path: ["number"],
        message: "Add their WhatsApp number to send them alerts.",
      });
    return { id: value.id, number, optIn: value.optIn };
  });

export type AlertContactState =
  | { status: "idle" }
  | { status: "saved"; message: string }
  | { status: "error"; message: string; fieldMessage?: string; number: string; optIn: boolean };

export const alertCopy = {
  number: "WhatsApp number",
  numberHint: "For order alerts only.",
  optIn: "Send them order alerts",
  save: "Save",
  saving: "Saving…",
  on: (number: string) => `Order alerts on · ${number}`,
  off: "Order alerts off",
  savedOn: "Saved. They'll get order alerts on WhatsApp.",
  savedOff: "Saved. They won't get order alerts.",
  check: "Please check the number.",
  missing: "That person isn't on the list any more. Refresh to see the latest.",
  failed: "We couldn't save that just now. Please try again.",
} as const;
