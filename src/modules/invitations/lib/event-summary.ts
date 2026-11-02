import type { EventSettings } from "@/modules/shared/lib/event-settings";
export type PublicEventDetails = Readonly<
  Pick<EventSettings, "eventDate" | "ceremonyTime" | "timeZone" | "venue">
> & { readonly coupleNames: readonly [string, string] };
/** Format a date-only value without shifting it into a visitor's previous day. */
export function eventDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "T12:00:00Z"));
}
export function ceremonyLabel(value: string | null, timeZone: string | null) {
  if (!value) return "Time to follow";
  const hour = Number(value.slice(0, 2));
  const time = `${hour % 12 || 12}:${value.slice(3, 5)} ${hour < 12 ? "am" : "pm"}`;
  return timeZone ? `${time} · ${timeZone}` : `${time} · time zone to follow`;
}
export function eventSummary(settings: PublicEventDetails) {
  const date = eventDateLabel(settings.eventDate);
  return {
    title: settings.coupleNames.join(" & "),
    date,
    description: `Celebrate with ${settings.coupleNames.join(" and ")} on ${date}${settings.venue ? ` at ${settings.venue}` : ""}.`,
  };
}
