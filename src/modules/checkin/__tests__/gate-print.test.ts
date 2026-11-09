import { expect, it } from "vitest";
import { buildGatePrintRows, type GatePrintInvitation } from "../lib/gate-print";
const base: GatePrintInvitation = {
  id: "one",
  status: "rsvp_yes",
  householdName: "The Okafors",
  countAttending: 2,
  tableNumber: 4,
  admittedPeople: 1,
  guests: [
    { name: "Ada Okafor", isPrimary: true },
    { name: "Uchenna Nwosu", isPrimary: false },
  ],
};
it("includes every yes household and every named tag-along, sorted by surname", () => {
  const rows = buildGatePrintRows([
    base,
    { ...base, id: "two", householdName: null, guests: [{ name: "Zoe Adams", isPrimary: true }] },
    { ...base, id: "no", status: "rsvp_no" },
    { ...base, id: "revoked", status: "revoked" },
  ]);
  expect(rows.map((row) => row.id)).toEqual(["two", "one"]);
  expect(rows[1]).toMatchObject({
    names: ["Ada Okafor", "Uchenna Nwosu"],
    partySize: 2,
    tableNumber: 4,
    admittedPeople: 1,
    remaining: 1,
  });
  expect(rows[1]?.marks).toEqual([true, false]);
});
it("does not invent allowance when a yes household has no saved reply", () => {
  const [row] = buildGatePrintRows([{ ...base, countAttending: null, admittedPeople: null }]);
  expect(row).toMatchObject({ partySize: null, remaining: null, admittedPeople: 0, marks: [] });
});
it("retains unnamed households for reconciliation and does not mutate input", () => {
  const input = [{ ...base, guests: [], householdName: null }];
  const before = structuredClone(input);
  expect(buildGatePrintRows(input)[0]?.names).toEqual(["Name not recorded"]);
  expect(input).toEqual(before);
});
it("keeps unknown seating and bounds tally rendering without hiding party size", () => {
  const [row] = buildGatePrintRows([{ ...base, tableNumber: null, countAttending: 100 }]);
  expect(row?.partySize).toBe(100);
  expect(row?.tableNumber).toBeNull();
  expect(row?.marks).toEqual([]);
});
