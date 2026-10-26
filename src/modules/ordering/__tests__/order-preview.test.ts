import { expect, it } from "vitest";
import { orderPreviewSchema, sampleTableSchema } from "../lib/order-preview";

it("normalises sample table numbers and rejects unknown tables", () => {
  expect(sampleTableSchema.parse(" 01 ")).toBe(1);
  expect(sampleTableSchema.parse("30")).toBe(30);
  for (const value of ["", "0", "31", "1.5", "-1", "1e1", "hello"])
    expect(sampleTableSchema.safeParse(value).success).toBe(false);
});
it("accepts known selections and trims notes", () => {
  const order = orderPreviewSchema.parse({
    table: 12,
    quantities: { rice: 2, water: 1 },
    note: " No ice ",
  });
  expect(order.note).toBe("No ice");
});
it("rejects empty, unavailable, unknown and invalid quantity selections", () => {
  for (const quantities of [
    {},
    { rice: 0 },
    { rice: 1.5 },
    { rice: -1 },
    { rice: 11 },
    { plantain: 1 },
    { unknown: 1 },
  ])
    expect(orderPreviewSchema.safeParse({ table: 12, quantities, note: "" }).success).toBe(false);
  expect(
    orderPreviewSchema.safeParse({ table: 31, quantities: { rice: 1 }, note: "" }).success,
  ).toBe(false);
  expect(
    orderPreviewSchema.safeParse({ table: 12, quantities: { rice: 1 }, note: "A".repeat(201) })
      .success,
  ).toBe(false);
});
