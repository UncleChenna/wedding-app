import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rows: [] as unknown[][], read: vi.fn(), afterRead: vi.fn() }));
vi.mock("../server/db/client", async () => ({
  schema: await import("../server/db/schema"),
  db: {
    select: () => ({
      from: () => ({
        where: async () => {
          const result = mocks.rows.shift() ?? [];
          mocks.afterRead();
          return result;
        },
      }),
    }),
  },
}));
vi.mock("../server/staff-session", () => ({ readStaffSession: mocks.read }));
import { authenticateStaff, authenticateStaffSession } from "../server/staff-auth";
const key = Buffer.alloc(32, 1);
const id = "550e8400-e29b-41d4-a716-446655440000";
const identity = { staffId: id, role: "gate" as const, credentialVersion: 1 };
function fixture(cookieExpiry = "2026-12-20T06:00:00Z", pinExpiry = cookieExpiry) {
  mocks.read.mockReturnValue({ ...identity, exp: Date.parse(cookieExpiry) / 1000 });
  mocks.rows = [
    [{ eventDate: "2026-12-19", timeZone: "Etc/UTC" }],
    [
      {
        id,
        role: "gate",
        credentialVersion: 1,
        pinHash: "synthetic",
        pinIssuedAt: new Date("2026-12-18"),
        pinExpiresAt: new Date(pinExpiry),
        revokedAt: null,
      },
    ],
    [{ role: "gate", revokedAt: null }],
  ];
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-12-19T12:00:00Z"));
  mocks.afterRead.mockReset();
  fixture();
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});
it.each([
  ["2026-12-20T07:00:00Z", "2026-12-20T08:00:00Z", "2026-12-20T06:00:00Z"],
  ["2026-12-19T18:00:00Z", "2026-12-20T08:00:00Z", "2026-12-19T18:00:00Z"],
  ["2026-12-20T07:00:00Z", "2026-12-19T15:00:00Z", "2026-12-19T15:00:00Z"],
])("bounds offline trust by cookie %s and PIN %s", async (cookie, pin, deadline) => {
  fixture(cookie, pin);
  expect(await authenticateStaffSession("signed", "device", "gate", key)).toEqual({
    identity,
    expiresAt: new Date(deadline),
  });
});
it("keeps the existing identity-only contract unchanged", async () => {
  expect(await authenticateStaff("signed", "device", "gate", key)).toEqual(identity);
});
it("does not expose an expiry when a device is revoked", async () => {
  mocks.rows[2] = [{ role: "gate", revokedAt: new Date() }];
  expect(await authenticateStaffSession("signed", "device", "gate", key)).toBeNull();
});
it("does not expose an expiry for a role mismatch or invalid session", async () => {
  mocks.read.mockReturnValue(null);
  expect(await authenticateStaffSession("invalid", "device", "gate", key)).toBeNull();
  mocks.read.mockReturnValue({ ...identity, role: "bar" });
  expect(await authenticateStaffSession("wrong-role", "device", "gate", key)).toBeNull();
});
it("rejects at the current event boundary even if the signed cookie lasts longer", async () => {
  fixture("2026-12-21T06:00:00Z");
  vi.setSystemTime(new Date("2026-12-20T06:00:00Z"));
  expect(await authenticateStaffSession("signed", "device", "gate", key)).toBeNull();
});

it("rejects when live database reads finish at the session deadline", async () => {
  fixture("2026-12-19T12:00:01Z", "2026-12-20T06:00:00Z");
  mocks.afterRead.mockImplementation(() => {
    if (mocks.rows.length === 0) vi.setSystemTime(new Date("2026-12-19T12:00:01Z"));
  });
  expect(await authenticateStaffSession("signed", "device", "gate", key)).toBeNull();
  expect(mocks.afterRead).toHaveBeenCalledTimes(3);
});
