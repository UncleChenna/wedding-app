import { expect, it } from "vitest";
import { createScanThrottle } from "../lib/scan-throttle";

it("processes a held code once per three seconds, including the exact boundary", () => {
  const accept = createScanThrottle();
  expect(accept("first", 0)).toBe(true);
  expect(accept("first", 2999)).toBe(false);
  expect(accept("first", 3000)).toBe(true);
});
it("does not let alternating codes bypass each code's cooldown", () => {
  const accept = createScanThrottle();
  expect(accept("first", 0)).toBe(true);
  expect(accept("second", 100)).toBe(true);
  expect(accept("first", 200)).toBe(false);
  expect(accept("second", 3100)).toBe(true);
});
it("rejects empty, oversized and invalid-clock reads without poisoning later reads", () => {
  const accept = createScanThrottle();
  expect(accept("", 0)).toBe(false);
  expect(accept("x".repeat(4097), 0)).toBe(false);
  expect(accept("first", Number.NaN)).toBe(false);
  expect(accept("first", -1)).toBe(false);
  expect(accept("first", 10)).toBe(true);
  expect(accept("first", 5)).toBe(false);
  expect(accept("first", 3010)).toBe(true);
});
