import type { ShareInput } from "@/modules/invitations/lib/share";

export const guestListStatuses = ["draft", "sent", "rsvp_yes", "rsvp_no", "revoked"] as const;
export type GuestListStatus = (typeof guestListStatuses)[number];

/** Authorized admin view only. Contact details and internal notes are not needed here. */
export interface GuestListInvitation {
  id: string;
  name: string;
  status: GuestListStatus;
  tokenVersion: number;
  guests: { id: string; name: string }[];
  countAttending: number | null;
  side: string | null;
  tableId: string | null;
  tableNumber: number | null;
  sentAt: string | null;
  share?: ShareInput;
  guidance?: string;
}

export interface GuestListFilters {
  query?: string;
  status?: GuestListStatus;
  sent?: "sent" | "unsent";
  /** Undefined selects all values; null selects unassigned invitations. */
  side?: string | null;
  tableId?: string | null;
}

/** Shared by the list and future exports; stable ordering follows the server query. */
export function filterGuestList(
  invitations: readonly GuestListInvitation[],
  filters: GuestListFilters,
): GuestListInvitation[] {
  const terms = filters.query?.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean) ?? [];
  return invitations.filter((invitation) => {
    if (filters.status !== undefined && invitation.status !== filters.status) return false;
    if (filters.sent === "sent" && invitation.sentAt === null) return false;
    if (filters.sent === "unsent" && invitation.sentAt !== null) return false;
    if (filters.side !== undefined && invitation.side !== filters.side) return false;
    if (filters.tableId !== undefined && invitation.tableId !== filters.tableId) return false;
    const names = [invitation.name, ...invitation.guests.map((guest) => guest.name)]
      .join(" ")
      .toLocaleLowerCase();
    return terms.every((term) => names.includes(term));
  });
}
