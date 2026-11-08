import { expect, it } from "vitest";
import { deviceIdSchema, deviceNameSchema } from "../lib/device";

it("tidies a device name to single-line text within 60 characters", () => {
  expect(deviceNameSchema.parse("  Kitchen\u0000 tablet\n1 ")).toBe("Kitchen tablet 1");
  expect(deviceNameSchema.safeParse("   ").success).toBe(false);
  expect(deviceNameSchema.safeParse("x".repeat(61)).success).toBe(false);
});

it("accepts device ids in the stored format only", () => {
  expect(deviceIdSchema.safeParse("a".repeat(64)).success).toBe(true);
  expect(deviceIdSchema.safeParse("seed-gate-1").success).toBe(true);
  expect(deviceIdSchema.safeParse("../etc").success).toBe(false);
  expect(deviceIdSchema.safeParse("").success).toBe(false);
});
