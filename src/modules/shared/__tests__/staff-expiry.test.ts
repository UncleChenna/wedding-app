import { describe, expect, it } from "vitest";

import { staffEventExpiry } from "../lib/staff-expiry";

describe("staff event cutoff", () => {
  it.each([
    ["2026-12-19", "Africa/Lagos", "2026-12-20T05:00:00.000Z"],
    ["2026-12-31", "Europe/London", "2027-01-01T06:00:00.000Z"],
    ["2026-03-07", "America/New_York", "2026-03-08T10:00:00.000Z"],
    ["2026-10-31", "America/New_York", "2026-11-01T11:00:00.000Z"],
  ])("expires after %s at 06:00 in %s", (date, zone, expected) => {
    expect(staffEventExpiry(date, zone)?.toISOString()).toBe(expected);
  });

  it("does not invent a cutoff without valid event settings", () => {
    expect(staffEventExpiry("2026-12-19", null)).toBeNull();
    expect(staffEventExpiry("2026-02-30", "UTC")).toBeNull();
    expect(staffEventExpiry("2026-12-19", "TBD")).toBeNull();
  });
});
