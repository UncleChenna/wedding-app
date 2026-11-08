/** "Sun 20 Dec, 06:00" in venue time; the UTC fallback is labelled so it can't be misread. */
export function formatStaffExpiry(instant: Date, timeZone: string | null): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  };
  if (!timeZone)
    return (
      new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(instant) + " UTC"
    );
  try {
    return new Intl.DateTimeFormat("en-GB", { ...options, timeZone }).format(instant);
  } catch {
    return (
      new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(instant) + " UTC"
    );
  }
}
