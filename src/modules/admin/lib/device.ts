import { z } from "zod";

export const deviceNameSchema = z
  .string()
  .transform((value) =>
    value
      .replace(/[\p{Cc}\p{Cf}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim(),
  )
  .pipe(z.string().min(1, "Give the device a name.").max(60, "Keep the name to 60 characters."));

/** Device ids are the 64-hex values from the signed device cookie, or seeded ids in test data. */
export const deviceIdSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/);

export type DeviceFormState =
  { status: "idle" } | { status: "saved"; message: string } | { status: "error"; message: string };

export const deviceCopy = {
  heading: "Devices",
  intro:
    "Phones and tablets that have signed in with a staff PIN. Give each a name you'll recognise on the night.",
  empty: "No devices yet. They appear here after their first PIN sign-in.",
  rename: "Rename",
  renaming: "Saving…",
  renamed: "Renamed. The device shows it on its next screen.",
  missing: "That device isn't on the list any more. Refresh to see the latest.",
  failed: "We couldn't rename it just now. Please try again.",
  firstSignedIn: (who: string | null) => (who ? `First signed in by ${who}` : null),
  removed: "Signed out for good",
} as const;
