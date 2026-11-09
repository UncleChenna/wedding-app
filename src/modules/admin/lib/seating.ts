import type { GuestListStatus } from "./guest-list";

export interface SeatingParty {
  id: string;
  name: string;
  status: GuestListStatus;
  countAttending: number | null;
  namedGuests: number;
  tableId: string | null;
}
export interface SeatingTable {
  id: string;
  number: number;
  name: string | null;
  capacity: number;
  hasOrders: boolean;
}
export interface SeatingPlan {
  tables: SeatingTable[];
  parties: SeatingParty[];
}

/** Pending seats are named people, not confirmed replies or the maximum tag-along allowance. */
export function seatingOccupancy(
  parties: Pick<SeatingParty, "status" | "countAttending" | "namedGuests">[],
  capacity: number,
) {
  let confirmed = 0,
    pending = 0;
  for (const party of parties) {
    if (party.status === "revoked" || party.status === "rsvp_no") continue;
    if (party.countAttending === null) pending += party.namedGuests;
    else confirmed += party.countAttending;
  }
  const total = confirmed + pending;
  return { confirmed, pending, total, overBy: Math.max(0, total - capacity) };
}

/** Compare meaningful current values, avoiding timestamp precision loss in browser JSON. */
export function seatingTableVersion(
  table: Pick<SeatingTable, "number" | "name" | "capacity">,
): string {
  return JSON.stringify([table.number, table.name, table.capacity]);
}
