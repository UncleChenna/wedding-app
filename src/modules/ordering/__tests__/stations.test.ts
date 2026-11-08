import { expect, it } from "vitest";
import { splitByStation } from "../lib/stations";

it("splits a mixed submission into one kitchen and one bar ticket", () => {
  const rice = { id: "rice", station: "kitchen" as const };
  const wine = { id: "wine", station: "bar" as const };
  const stew = { id: "stew", station: "kitchen" as const };
  expect(splitByStation([wine, rice, stew])).toEqual([
    { station: "kitchen", label: "From the kitchen", items: [rice, stew] },
    { station: "bar", label: "From the bar", items: [wine] },
  ]);
});

it.each([
  ["kitchen", "From the kitchen"],
  ["bar", "From the bar"],
] as const)("keeps a %s-only submission as one ticket", (station, label) => {
  const items = [
    { id: "a", station },
    { id: "b", station },
  ];
  expect(splitByStation(items)).toEqual([{ station, label, items }]);
});

it("creates no ticket for an empty submission", () => {
  expect(splitByStation([])).toEqual([]);
});
