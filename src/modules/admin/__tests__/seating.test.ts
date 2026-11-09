import { expect, it } from "vitest";
import { seatingOccupancy } from "../lib/seating";
import { tableInputSchema } from "../lib/seating-input";

it("warns about capacity without rejecting a valid assignment or smaller table", () => {
  const parties = [
    { status: "rsvp_yes" as const, countAttending: 3, namedGuests: 4 },
    { status: "sent" as const, countAttending: null, namedGuests: 2 },
    { status: "rsvp_no" as const, countAttending: 0, namedGuests: 2 },
    { status: "rsvp_no" as const, countAttending: null, namedGuests: 2 },
    { status: "revoked" as const, countAttending: 6, namedGuests: 6 },
  ];
  expect(seatingOccupancy(parties, 4)).toEqual({ confirmed: 3, pending: 2, total: 5, overBy: 1 });
  expect(seatingOccupancy(parties, 2).overBy).toBe(3);
  expect(tableInputSchema.safeParse({ number: 1, name: "Family", capacity: 2 }).success).toBe(true);
});
it("allows an empty table and never counts the named roster twice", () => {
  expect(seatingOccupancy([], 8)).toEqual({ confirmed: 0, pending: 0, total: 0, overBy: 0 });
  expect(
    seatingOccupancy([{ status: "rsvp_yes", countAttending: 2, namedGuests: 5 }], 2).overBy,
  ).toBe(0);
});
it("validates table identifiers and capacity before database writes", () => {
  for (const number of [0, -1, 1.5, 2147483648])
    expect(tableInputSchema.safeParse({ number, name: "", capacity: 8 }).success).toBe(false);
  for (const capacity of [0, -1, 1.5, 2147483648])
    expect(tableInputSchema.safeParse({ number: 1, name: "", capacity }).success).toBe(false);
  expect(tableInputSchema.parse({ number: 3, name: "  Ndị ezinụlọ  ", capacity: 8 })).toEqual({
    number: 3,
    name: "Ndị ezinụlọ",
    capacity: 8,
  });
});
