/** Navigation only: ordering still enforces its own availability at the destination. */
export function invitationNextStep(
  attendance: "yes" | "no" | null,
  eventDate: string,
  timeZone: string | null,
  now: Date,
) {
  const step = attendance === "yes" ? "pass" : attendance === "no" ? "closing" : "reply";
  // An undecided venue zone cannot safely establish the wedding-day boundary.
  if (!timeZone) return { step, showOrdering: false };
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === name)?.value;
  const localDate = `${part("year")}-${part("month")}-${part("day")}`;
  return { step, showOrdering: localDate >= eventDate };
}
