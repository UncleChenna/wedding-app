import { describe, expect, it } from "vitest";
import { drainAuthorized } from "../lib/drain-auth";

const secret = "a".repeat(64);

describe("drainAuthorized", () => {
  it("accepts only the exact bearer secret", () => {
    expect(drainAuthorized(`Bearer ${secret}`, secret)).toBe(true);
    expect(drainAuthorized(`Bearer ${"b".repeat(64)}`, secret)).toBe(false);
    expect(drainAuthorized(secret, secret)).toBe(false);
    expect(drainAuthorized(null, secret)).toBe(false);
  });
  it("is disabled without a configured secret", () => {
    expect(drainAuthorized("Bearer ", "")).toBe(false);
  });
});
