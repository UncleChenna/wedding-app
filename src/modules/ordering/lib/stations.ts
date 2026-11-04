export const STATIONS = [
  { value: "kitchen", label: "From the kitchen" },
  { value: "bar", label: "From the bar" },
] as const;
export type Station = (typeof STATIONS)[number]["value"];

/**
 * One guest submission becomes one ticket per station it touches (current-state assumption 8):
 * kitchen and bar each see only their items. Groups follow the fixed station order and keep
 * the items' own order; a station with nothing in the submission gets no ticket.
 */
export function splitByStation<T extends { station: Station }>(
  items: readonly T[],
): { station: Station; label: string; items: T[] }[] {
  return STATIONS.map(({ value, label }) => ({
    station: value,
    label,
    items: items.filter((item) => item.station === value),
  })).filter((group) => group.items.length > 0);
}
