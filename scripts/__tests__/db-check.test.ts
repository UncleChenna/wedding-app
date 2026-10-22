import { describe, expect, it } from "vitest";

import { formatCounts, tablesMissingRls } from "../db-check-lib";

describe("tablesMissingRls", () => {
  it("returns nothing when every public table has RLS enabled", () => {
    expect(
      tablesMissingRls([
        { table: "guests", rlsEnabled: true },
        { table: "orders", rlsEnabled: true },
      ]),
    ).toEqual([]);
  });

  it("names every table without RLS, sorted", () => {
    expect(
      tablesMissingRls([
        { table: "orders", rlsEnabled: false },
        { table: "guests", rlsEnabled: true },
        { table: "audit", rlsEnabled: false },
      ]),
    ).toEqual(["audit", "orders"]);
  });

  it("treats an empty schema as a failure so a wrong connection cannot pass silently", () => {
    expect(() => tablesMissingRls([])).toThrow(/no public tables/i);
  });
});

describe("formatCounts", () => {
  it("prints one stable, sorted line per table so two runs can be diffed", () => {
    expect(formatCounts({ tables: { orders: 3, guests: 245 }, migrationsApplied: 1 })).toBe(
      "guests 245\norders 3\n(drizzle migrations applied) 1\n",
    );
  });
});
