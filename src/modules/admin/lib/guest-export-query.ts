import type { GuestListFilters } from "./guest-list";

/** Lightweight client serializer; validation and private CSV rendering stay on the server. */
export function guestExportSearch(filters: GuestListFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query !== undefined) params.set("q", filters.query);
  if (filters.status !== undefined) params.set("status", filters.status);
  if (filters.sent !== undefined) params.set("sent", filters.sent);
  for (const [key, value] of [
    ["side", filters.side],
    ["table", filters.tableId],
  ] as const) {
    if (value !== undefined) params.set(key, value === null ? "none" : `value:${value}`);
  }
  return params;
}
