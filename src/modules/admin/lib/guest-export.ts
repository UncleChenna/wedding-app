import { z } from "zod";
import {
  filterGuestList,
  guestListStatuses,
  type GuestListFilters,
  type GuestListInvitation,
} from "./guest-list";

export interface ExportInvitation extends GuestListInvitation {
  guests: { id: string; name: string; isPrimary: boolean; meal: string; dietaryNotes: string }[];
}

const filtersSchema = z.strictObject({
  q: z.string().optional(),
  status: z.enum(guestListStatuses).optional(),
  sent: z.enum(["sent", "unsent"]).optional(),
  side: z.union([z.literal("none"), z.string().startsWith("value:")]).optional(),
  table: z
    .union([
      z.literal("none"),
      z
        .string()
        .regex(/^value:/)
        .transform((value) => value.slice(6))
        .pipe(z.uuid()),
    ])
    .optional(),
});

export function parseGuestExportFilters(
  params: URLSearchParams,
): { success: true; data: GuestListFilters } | { success: false } {
  if ([...params.keys()].some((key) => params.getAll(key).length !== 1)) return { success: false };
  const parsed = filtersSchema.safeParse(Object.fromEntries(params));
  if (!parsed.success) return { success: false };
  const { q, status, sent, side, table } = parsed.data;
  return {
    success: true,
    data: {
      query: q,
      status,
      sent,
      side: side === undefined ? undefined : side === "none" ? null : side.slice(6),
      tableId: table === undefined ? undefined : table === "none" ? null : table,
    },
  };
}

function cell(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)))
    text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

/** Each selected household expands to all its members; household counts repeat per member. */
export function guestExportCsv(invitations: ExportInvitation[], filters: GuestListFilters): string {
  const ids = new Set(filterGuestList(invitations, filters).map((row) => row.id));
  const rows: (string | number)[][] = [
    [
      "Household",
      "Invitation status",
      "Sent at",
      "RSVP",
      "Household attending count",
      "Side",
      "Household table",
      "Guest name",
      "Primary guest",
      "Meal",
      "Dietary notes",
    ],
  ];
  for (const invitation of invitations.filter((row) => ids.has(row.id))) {
    const members = invitation.guests.length ? invitation.guests : [null];
    for (const guest of members)
      rows.push([
        invitation.name,
        invitation.status,
        invitation.sentAt ?? "",
        invitation.countAttending === null
          ? "Pending"
          : invitation.countAttending > 0
            ? "Yes"
            : "No",
        invitation.countAttending ?? "",
        invitation.side ?? "",
        invitation.tableNumber ?? "",
        guest?.name ?? "",
        guest ? (guest.isPrimary ? "Yes" : "No") : "",
        guest?.meal ?? "",
        guest?.dietaryNotes ?? "",
      ]);
  }
  return rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
