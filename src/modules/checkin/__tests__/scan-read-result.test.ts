import { expect, it } from "vitest";
import { scanReadResultSchema } from "../lib/scan-read-result";
const guest = {
  name: "Synthetic guest",
  partySize: 3,
  admittedSoFar: 1,
  tableNumber: null,
  admissions: [],
};
it("accepts a valid pass only while places remain and used only at the exact allowance", () => {
  expect(scanReadResultSchema.safeParse({ state: "valid", guest }).success).toBe(true);
  expect(
    scanReadResultSchema.safeParse({ state: "valid", guest: { ...guest, admittedSoFar: 3 } })
      .success,
  ).toBe(false);
  expect(scanReadResultSchema.safeParse({ state: "already_used", guest }).success).toBe(false);
  expect(
    scanReadResultSchema.safeParse({ state: "already_used", guest: { ...guest, admittedSoFar: 3 } })
      .success,
  ).toBe(true);
  expect(
    scanReadResultSchema.safeParse({ state: "already_used", guest: { ...guest, admittedSoFar: 4 } })
      .success,
  ).toBe(false);
});
it.each([-1, 0.5, NaN, Infinity, 2147483648])(
  "rejects impossible admitted count %s",
  (admittedSoFar) => {
    expect(
      scanReadResultSchema.safeParse({ state: "valid", guest: { ...guest, admittedSoFar } })
        .success,
    ).toBe(false);
  },
);
it("refused and unavailable responses cannot carry a private guest object", () => {
  for (const state of [
    "invalid",
    "revoked",
    "replaced",
    "not_rsvped",
    "unknown",
    "unavailable",
    "session_expired",
  ]) {
    expect(scanReadResultSchema.safeParse({ state }).success).toBe(true);
    expect(scanReadResultSchema.safeParse({ state, guest }).success).toBe(false);
  }
});
