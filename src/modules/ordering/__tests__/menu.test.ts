import { expect, it } from "vitest";
import { groupMenu, menuAvailabilitySchema, type MenuItem } from "../lib/menu";
import { loadMenu, menuAvailabilityResponse } from "../server/menu";

const item = (overrides: Partial<MenuItem>): MenuItem => ({
  id: "00000000-0000-4000-8000-000000000001",
  name: "Jollof rice",
  description: null,
  category: "meal",
  maxPerOrder: 5,
  available: true,
  dietaryTags: [],
  ...overrides,
});

it("groups items in the fixed category order and drops empty categories", () => {
  const wine = item({ id: "w", name: "Red wine", category: "alcohol" });
  const rice = item({ id: "r", name: "Jollof rice", category: "meal" });
  const plantain = item({ id: "p", name: "Plantain", category: "meal" });
  expect(groupMenu([wine, rice, plantain])).toEqual([
    { category: "meal", label: "Meals", items: [rice, plantain] },
    { category: "alcohol", label: "Alcoholic drinks", items: [wine] },
  ]);
});

it("returns ready items or an unavailable state without raw errors", async () => {
  const items = [item({})];
  expect(await loadMenu(async () => items)).toEqual({ status: "ready", items });
  const failed = await loadMenu(async () => {
    throw new Error("password=private");
  });
  expect(failed).toEqual({ status: "unavailable" });
});

it("serves availability uncached and in the validated shape", async () => {
  const items = [{ id: "00000000-0000-4000-8000-000000000001", available: false }];
  const response = await menuAvailabilityResponse(async () => items);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(menuAvailabilitySchema.parse(await response.json())).toEqual({ items });
});

it("hides availability lookup failures behind a fixed 503", async () => {
  const response = await menuAvailabilityResponse(async () => {
    throw new Error("connection string secret");
  });
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.text()).not.toContain("secret");
});

it("rejects availability payloads with unexpected fields", () => {
  expect(
    menuAvailabilitySchema.safeParse({
      items: [{ id: "00000000-0000-4000-8000-000000000001", available: true, station: "bar" }],
    }).success,
  ).toBe(false);
});
