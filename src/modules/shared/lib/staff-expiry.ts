import { z } from "zod";

/** Resolve the approved 06:00 venue-local cutoff; unknown settings fail closed. */
export function staffEventExpiry(eventDate: string, timeZone: string | null): Date | null {
  if (!timeZone || !z.iso.date().safeParse(eventDate).success) return null;
  try {
    const target = new Date(`${eventDate}T06:00:00Z`);
    target.setUTCDate(target.getUTCDate() + 1);
    const formatter = new Intl.DateTimeFormat("en-US", {
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
      const parts = formatter.formatToParts(new Date(candidate));
      const part = (name: Intl.DateTimeFormatPartTypes) =>
        parts.find((p) => p.type === name)?.value;
      const local = Date.parse(
        `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}Z`,
      );
      if (!Number.isFinite(local)) return null;
      const correction = target.getTime() - local;
      if (correction === 0) return new Date(candidate);
      candidate += correction;
    }
    return null;
  } catch {
    return null;
  }
}
