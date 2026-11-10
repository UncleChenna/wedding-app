import { describe, expect, it, vi } from "vitest";
import { dashboardResponse } from "../server/dashboard-response";
import { dashboardSnapshotSchema } from "../lib/dashboard";

const snapshot = { invited: 12, attending: 24, arrived: 7, ordersOpen: 3, ordersServed: 9 };

describe("private dashboard boundary", () => {
  it.each(["signed-out", "denied", "enroll", "challenge"] as const)(
    "never queries counters for %s access",
    async (status) => {
      const read = vi.fn();
      const response = await dashboardResponse(
        async () => ({ status, userId: "test", factors: [] }),
        read,
      );
      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(read).not.toHaveBeenCalled();
    },
  );
  it("returns aggregate counts only after live two-factor authorization", async () => {
    const response = await dashboardResponse(
      async () => ({ status: "ready", userId: "test", factors: [] }),
      async () => ({ ...snapshot, email: "private@example.test" }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(snapshot);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("does not invent zeroes or expose errors when reads fail", async () => {
    const response = await dashboardResponse(
      async () => ({ status: "ready", userId: "test", factors: [] }),
      async () => {
        throw new Error("private database details");
      },
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private database details");
  });
  it("rejects invalid counts rather than rendering misleading totals", () => {
    for (const arrived of [-1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(dashboardSnapshotSchema.safeParse({ ...snapshot, arrived }).success).toBe(false);
    }
  });
});
