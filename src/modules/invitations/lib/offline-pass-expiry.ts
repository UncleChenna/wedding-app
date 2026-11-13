import { z } from "zod";

/** Private guest copies expire at venue-local midnight, retentionDays after the event. */
export function offlinePassExpiry(
  eventDate: string,
  timeZone: string | null,
  retentionDays: number,
): Date | null {
  if (
    !z.iso.date().safeParse(eventDate).success ||
    !Number.isSafeInteger(retentionDays) ||
    retentionDays < 1 ||
    retentionDays > 3650
  )
    return null;
  try {
    const target = new Date(`${eventDate}T00:00:00Z`);
    target.setUTCDate(target.getUTCDate() + retentionDays);
    // Unknown venue zone: expire at the earliest possible local midnight (UTC+14).
    // This may expire early, never later than the configured calendar retention.
    // It is not a guessed zone and must not be reused for RSVP or staff authority.
    if (timeZone === null) return new Date(target.getTime() - 14 * 60 * 60 * 1000);
    const format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      calendar: "iso8601",
      numberingSystem: "latn",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    let candidate = target.getTime();
    for (let attempt = 0; attempt < 4; attempt++) {
      const parts = format.formatToParts(new Date(candidate));
      const part = (name: Intl.DateTimeFormatPartTypes) =>
        parts.find((row) => row.type === name)?.value;
      const local = Date.parse(
        `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}Z`,
      );
      if (!Number.isFinite(local)) return null;
      const correction = target.getTime() - local;
      if (correction === 0) return new Date(candidate);
      candidate += correction;
    }
  } catch {
    /* Unknown zone: online pass remains usable, offline saving is unavailable. */
  }
  return null;
}
