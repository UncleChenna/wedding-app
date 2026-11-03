import { z } from "zod";
import type { EventSettings } from "@/modules/shared/lib/event-settings";

const windowSettings = z.object({
  eventDate: z.iso.date(),
  timeZone: z.string().trim().min(1),
  rsvpLockAt: z.date().nullable(),
});
export type RsvpWindow = "open" | "locked" | "not-open";

/** A stored cutoff may close replies early, but cannot extend the approved wedding-day window. */
export function rsvpWindow(
  settings: Pick<EventSettings, "eventDate" | "timeZone" | "rsvpLockAt">,
  now: Date = new Date(),
): RsvpWindow {
  const parsed = windowSettings.safeParse(settings);
  if (!parsed.success || !Number.isFinite(now.getTime())) return "not-open";
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: parsed.data.timeZone,
      calendar: "iso8601",
      numberingSystem: "latn",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;
    const localDate = [value("year"), value("month"), value("day")].join("-");
    return localDate >= parsed.data.eventDate ||
      (parsed.data.rsvpLockAt !== null && now >= parsed.data.rsvpLockAt)
      ? "locked"
      : "open";
  } catch {
    return "not-open";
  }
}
