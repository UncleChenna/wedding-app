import { describe, expect, it } from "vitest";
import { filterGuestList, type GuestListInvitation } from "../lib/guest-list";

const household = (
  id: string,
  overrides: Partial<GuestListInvitation> = {},
): GuestListInvitation => ({
  id,
  name: "Ada Okafor household",
  status: "rsvp_yes",
  tokenVersion: 1,
  guests: [{ id: `guest-${id}`, name: "Uchenna Okafor" }],
  countAttending: 1,
  side: "Bride",
  tableId: "table-1",
  tableNumber: 1,
  sentAt: "2026-11-01T12:00:00.000Z",
  ...overrides,
});

describe("guest list filtering", () => {
  const rows = [
    household("a"),
    household("b", { status: "revoked", sentAt: null }),
    household("c", {
      name: "Bola Ade",
      guests: [],
      side: null,
      tableId: null,
      tableNumber: null,
      status: "rsvp_no",
      countAttending: 0,
    }),
  ];

  it("combines search, lifecycle status, sent, side and table as an intersection", () => {
    expect(
      filterGuestList(rows, {
        query: "  UCHENNA ada ",
        status: "rsvp_yes",
        sent: "sent",
        side: "Bride",
        tableId: "table-1",
      }).map((row) => row.id),
    ).toEqual(["a"]);
    expect(filterGuestList(rows, { status: "rsvp_yes", sent: "unsent" })).toEqual([]);
  });
  it("treats sentAt independently from RSVP and revoked status", () => {
    expect(filterGuestList(rows, { sent: "sent" }).map((row) => row.id)).toEqual(["a", "c"]);
    expect(filterGuestList(rows, { sent: "unsent" }).map((row) => row.id)).toEqual(["b"]);
    expect(filterGuestList(rows, { status: "revoked" })[0]?.countAttending).toBe(1);
  });
  it("distinguishes an unset side/table from all values and preserves stable ordering", () => {
    expect(filterGuestList(rows, { side: null, tableId: null }).map((row) => row.id)).toEqual([
      "c",
    ]);
    expect(filterGuestList(rows, {})).toEqual(rows);
    expect(filterGuestList(rows, { query: "unmatched" })).toEqual([]);
  });
  it("searches household and member names without mutating records", () => {
    const frozen = rows.map((row) => Object.freeze(row));
    expect(filterGuestList(frozen, { query: "okafor" }).map((row) => row.id)).toEqual(["a", "b"]);
    expect(filterGuestList(frozen, { query: "bola" }).map((row) => row.id)).toEqual(["c"]);
  });
});
