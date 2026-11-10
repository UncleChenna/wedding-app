import { gateGuestProjectionSchema } from "@/modules/shared/lib/dietary-privacy";

export interface GatePrintInvitation {
  id: string;
  status: string;
  householdName: string | null;
  countAttending: number | null;
  tableNumber: number | null;
  admittedPeople: number | null;
  guests: { name: string; isPrimary: boolean }[];
}
const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });
/** Names are currently free text; use the last word as the surname sorting key. */
const surname = (name: string) => name.trim().split(/\s+/).at(-1) ?? "";
export function buildGatePrintRows(invitations: readonly GatePrintInvitation[]) {
  return invitations
    .filter((invitation) => invitation.status === "rsvp_yes")
    .map((invitation) => {
      const members = invitation.guests.map((guest) => gateGuestProjectionSchema.parse(guest));
      const primary =
        members.find((guest) => guest.isPrimary)?.name ??
        members[0]?.name ??
        invitation.householdName ??
        "Name not recorded";
      const names = members.length
        ? members.map((guest) => guest.name.trim() || "Name not recorded")
        : [invitation.householdName?.trim() || "Name not recorded"];
      const admittedPeople = invitation.admittedPeople ?? 0;
      const partySize = invitation.countAttending;
      return {
        id: invitation.id,
        householdName: invitation.householdName,
        names,
        primary,
        partySize,
        tableNumber: invitation.tableNumber,
        admittedPeople,
        remaining: partySize === null ? null : Math.max(0, partySize - admittedPeople),
        // Unusually large groups get a write-in total instead of an unbounded box array.
        marks:
          partySize !== null && partySize >= 0 && partySize <= 24
            ? Array.from({ length: partySize }, (_, index) => index < admittedPeople)
            : [],
      };
    })
    .sort(
      (a, b) =>
        collator.compare(surname(a.primary), surname(b.primary)) ||
        collator.compare(a.primary, b.primary) ||
        a.id.localeCompare(b.id),
    );
}
export type GatePrintRow = ReturnType<typeof buildGatePrintRows>[number];
