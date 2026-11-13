import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hostTablesSchema } from "../lib/staff";

describe("hostTablesSchema (TICKET-082)", () => {
  const id = randomUUID();
  it.each([
    ["3, 4, 7", [3, 4, 7]],
    ["7 3 3,4", [3, 4, 7]],
    ["", []],
    ["  ", []],
  ])("reads %j as %j", (tables, expected) => {
    expect(hostTablesSchema.parse({ id, tables })).toEqual({ id, tables: expected });
  });
  it.each(["0", "3, x", "-1", "2.5", "12345"])("refuses %j", (tables) => {
    expect(hostTablesSchema.safeParse({ id, tables }).success).toBe(false);
  });
});
