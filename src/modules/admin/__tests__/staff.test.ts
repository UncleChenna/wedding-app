import { expect, it } from "vitest";
import { newStaffSchema } from "../lib/staff";
import { formatStaffExpiry } from "../lib/staff-time";
import { newStaffPin } from "../lib/staff-pin";

it("makes six-digit PINs and keeps leading zeros", () => {
  expect(newStaffPin(() => 42)).toBe("000042");
  expect(newStaffPin(() => 999_999)).toBe("999999");
  for (let i = 0; i < 50; i++) expect(newStaffPin()).toMatch(/^\d{6}$/);
});

it("validates a new staff member's name and role", () => {
  expect(newStaffSchema.parse({ name: "  Ada\u0000 Obi ", role: "kitchen" })).toEqual({
    name: "Ada Obi",
    role: "kitchen",
  });
  expect(newStaffSchema.safeParse({ name: " ", role: "bar" }).success).toBe(false);
  // Admins sign in with email and two-step codes, never a PIN.
  expect(newStaffSchema.safeParse({ name: "Ada", role: "admin" }).success).toBe(false);
});

it("shows PIN expiry in venue time, and labels UTC when no zone is set", () => {
  const instant = new Date("2026-12-20T05:00:00Z");
  expect(formatStaffExpiry(instant, "Africa/Lagos")).toBe("Sun 20 Dec, 06:00");
  expect(formatStaffExpiry(instant, null)).toBe("Sun 20 Dec, 05:00 UTC");
});
