import { z } from "zod";
import { staffEventExpiry } from "@/modules/shared/lib/staff-expiry";

const confirmationSchema = z.strictObject({
  confirmation: z.literal("CLOSE EVENT"),
  eventDate: z.iso.date(),
  evidencePreserved: z.literal(true),
});
export type EventClosureDecision =
  | { status: "allowed"; cutoff: Date }
  | {
      status: "confirmation-required" | "settings-required" | "event-changed" | "too-early";
      message: string;
    };

/** Recheck inside the closure transaction using current settings and server time. */
export function evaluateEventClosure(
  input: unknown,
  settings: { eventDate: string; timeZone: string | null },
  now: Date,
): EventClosureDecision {
  const confirmation = confirmationSchema.safeParse(input);
  if (!confirmation.success)
    return {
      status: "confirmation-required",
      message: "Type CLOSE EVENT and confirm that pending admission evidence has been preserved.",
    };
  if (confirmation.data.eventDate !== settings.eventDate)
    return {
      status: "event-changed",
      message: "The wedding date changed. Review the event details and confirm again.",
    };
  const cutoff = staffEventExpiry(settings.eventDate, settings.timeZone);
  if (!cutoff || !Number.isFinite(now.getTime()))
    return {
      status: "settings-required",
      message: "Confirm the wedding date and venue time zone before closing the event.",
    };
  if (now < cutoff)
    return {
      status: "too-early",
      message:
        "The event can be closed after 06:00 on the day after the wedding, in the venue’s time zone.",
    };
  return { status: "allowed", cutoff };
}
