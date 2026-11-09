import { describe, expect, it } from "vitest";
import { alertContactSchema, normalizeWhatsAppNumber } from "../lib/staff-alerts";

const id = "6f9e0c2a-1b7d-4c3e-9a8f-2d1e5b4c3a21";

describe("normalizeWhatsAppNumber", () => {
  it.each([
    ["0803 123 4567", "+2348031234567"],
    ["(0803) 123-4567", "+2348031234567"],
    ["+234 803 123 4567", "+2348031234567"],
    ["002348031234567", "+2348031234567"],
    ["+44 7700 900123", "+447700900123"],
    ["2348031234567", "+2348031234567"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeWhatsAppNumber(input)).toBe(expected);
  });
  it.each(["", "abc", "123", "+0123456789", "0803 123 4567 ext 2", "+1234567890123456"])(
    "refuses %j",
    (input) => {
      expect(normalizeWhatsAppNumber(input)).toBeNull();
    },
  );
});

describe("alertContactSchema", () => {
  it("normalises the number and keeps the choice", () => {
    expect(alertContactSchema.parse({ id, number: "0803 123 4567", optIn: true })).toEqual({
      id,
      number: "+2348031234567",
      optIn: true,
    });
  });
  it("allows clearing the number when alerts are off", () => {
    expect(alertContactSchema.parse({ id, number: "  ", optIn: false })).toEqual({
      id,
      number: null,
      optIn: false,
    });
  });
  it("needs a number to opt in, and a real one when given", () => {
    const missing = alertContactSchema.safeParse({ id, number: "", optIn: true });
    expect(missing.success).toBe(false);
    expect(missing.error?.issues[0]?.message).toContain("Add their WhatsApp number");
    const bad = alertContactSchema.safeParse({ id, number: "12", optIn: false });
    expect(bad.error?.issues[0]?.path).toEqual(["number"]);
  });
});
