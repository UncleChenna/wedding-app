import { expect, it } from "vitest";
import { offlinePassExpiry } from "../lib/offline-pass-expiry";
it("uses the configured post-event calendar retention in the venue zone", () => {
  expect(offlinePassExpiry("2026-12-19", "Europe/London", 90)?.toISOString()).toBe(
    "2027-03-19T00:00:00.000Z",
  );
  expect(offlinePassExpiry("2026-03-07", "America/New_York", 2)?.toISOString()).toBe(
    "2026-03-09T04:00:00.000Z",
  );
  expect(offlinePassExpiry("2026-12-19", "Africa/Lagos", 1)?.toISOString()).toBe(
    "2026-12-19T23:00:00.000Z",
  );
});
it("bounds undecided zones conservatively and refuses invalid dates or retention", () => {
  expect(offlinePassExpiry("2026-12-19", null, 90)?.toISOString()).toBe("2027-03-18T10:00:00.000Z");
  expect(offlinePassExpiry("2026-12-19", "invalid", 90)).toBeNull();
  expect(offlinePassExpiry("2026-02-30", "UTC", 90)).toBeNull();
  expect(offlinePassExpiry("2026-12-19", "UTC", 0)).toBeNull();
});
