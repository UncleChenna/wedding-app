import { describe, expect, it } from "vitest";
import { effectiveItemLimit, overLimitItemIds, rejectTableUsage } from "../lib/order-limits";

const limits = { orderCooldownSeconds: 60, maxOpenOrdersPerTable: 3 };
describe("table limits measured after the transaction lock", () => {
  it("allows the first order, including an absent aggregate row", () => {
    expect(rejectTableUsage(undefined, limits)).toBeNull();
    expect(rejectTableUsage({ open: 0, sinceLast: null }, limits)).toBeNull();
  });
  it("allows exactly the cooldown boundary, but rounds a remaining fractional wait upward", () => {
    expect(rejectTableUsage({ open: 2, sinceLast: 60 }, limits)).toBeNull();
    expect(rejectTableUsage({ open: 2, sinceLast: 59.9 }, limits)).toEqual({
      status: "rejected",
      reason: "cooldown",
      retryAfterSeconds: 1,
    });
    expect(rejectTableUsage({ open: 2, sinceLast: 45.1 }, limits)).toEqual({
      status: "rejected",
      reason: "cooldown",
      retryAfterSeconds: 15,
    });
  });
  it("gives cooldown precedence over the open-order cap, preserving existing behavior", () => {
    expect(rejectTableUsage({ open: 3, sinceLast: 0 }, limits)).toEqual({
      status: "rejected",
      reason: "cooldown",
      retryAfterSeconds: 60,
    });
  });
  it("rejects at and above the open cap after cooldown", () => {
    for (const open of [3, 4])
      expect(rejectTableUsage({ open, sinceLast: 61 }, limits)).toEqual({
        status: "rejected",
        reason: "too-many-open",
      });
  });
  it("honors a zero cooldown and reports a future timestamp conservatively", () => {
    expect(
      rejectTableUsage({ open: 0, sinceLast: 0 }, { ...limits, orderCooldownSeconds: 0 }),
    ).toBeNull();
    expect(rejectTableUsage({ open: 0, sinceLast: -1 }, limits)).toEqual({
      status: "rejected",
      reason: "cooldown",
      retryAfterSeconds: 61,
    });
  });
});
it("uses the smaller item/event limit, including equal limits", () => {
  expect(effectiveItemLimit(2, 10)).toBe(2);
  expect(effectiveItemLimit(10, 2)).toBe(2);
  expect(effectiveItemLimit(2, 2)).toBe(2);
});
it("accepts exactly the item cap, rejects excess and missing items without silently dropping them", () => {
  const menu = new Map([
    ["rice", { maxPerOrder: 2 }],
    ["water", { maxPerOrder: 3 }],
  ]);
  expect(overLimitItemIds([{ menuItemId: "rice", quantity: 2 }], menu)).toEqual([]);
  expect(
    overLimitItemIds(
      [
        { menuItemId: "rice", quantity: 3 },
        { menuItemId: "water", quantity: 3 },
        { menuItemId: "unknown", quantity: 1 },
      ],
      menu,
    ),
  ).toEqual(["rice", "unknown"]);
});

describe("staff-entered orders (TICKET-079)", () => {
  it("skip the table cooldown", () => {
    expect(rejectTableUsage({ open: 0, sinceLast: 1 }, limits)).toMatchObject({
      reason: "cooldown",
    });
    expect(rejectTableUsage({ open: 0, sinceLast: 1 }, limits, { staffEntered: true })).toBeNull();
  });

  it("still respect the open-order limit and item caps", () => {
    expect(rejectTableUsage({ open: 3, sinceLast: 1 }, limits, { staffEntered: true })).toEqual({
      status: "rejected",
      reason: "too-many-open",
    });
    expect(
      overLimitItemIds(
        [{ menuItemId: "soup", quantity: 4 }],
        new Map([["soup", { maxPerOrder: 3 }]]),
      ),
    ).toEqual(["soup"]);
  });
});
