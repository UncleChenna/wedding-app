import { afterEach, expect, it, vi } from "vitest";
import { createHealthProbe } from "../lib/health-probe";
import { adminHealthResponse, publicHealthResponse } from "../server/health-response";
import { healthSnapshot } from "../lib/health";

afterEach(() => vi.useRealTimers());
it("bounds a stuck dependency and shares its unfinished work across repeated probes", async () => {
  vi.useFakeTimers();
  const query = vi.fn(() => new Promise<boolean>(() => {}));
  const probe = createHealthProbe(query, 2000, 5000);
  const first = probe();
  await vi.advanceTimersByTimeAsync(2000);
  expect(await first).toBeNull();
  await vi.advanceTimersByTimeAsync(20_000);
  expect(await probe()).toBeNull();
  expect(query).toHaveBeenCalledOnce();
});
it("caches and then refreshes actual dependency results", async () => {
  vi.useFakeTimers();
  const query = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  const probe = createHealthProbe(query, 2000, 5000);
  expect(await probe()).toBe(true);
  expect(await probe()).toBe(true);
  await vi.advanceTimersByTimeAsync(5001);
  expect(await probe()).toBe(false);
  expect(query).toHaveBeenCalledTimes(2);
});
it.each([true, false, null])(
  "public readiness returns only a generic result for %s",
  async (ready) => {
    const response = await publicHealthResponse(async () => ready);
    expect(response.status).toBe(ready ? 200 : 503);
    expect(await response.json()).toEqual({ status: ready ? "ok" : "unavailable" });
    expect(response.headers.get("cache-control")).toContain("no-store");
  },
);
it("does not leak thrown dependency details publicly", async () => {
  const response = await publicHealthResponse(async () => {
    throw new Error("postgres://secret");
  });
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("secret");
});
it.each(["signed-out", "denied", "enroll", "challenge"] as const)(
  "does not read private health for %s",
  async (status) => {
    const read = vi.fn();
    const response = await adminHealthResponse(
      async () => ({ status, userId: "test", factors: [] }),
      read,
    );
    expect(response.status).toBe(403);
    expect(read).not.toHaveBeenCalled();
  },
);
it("shows unavailable dependencies without fabricated zeroes and keeps version text bounded", () => {
  const snapshot = healthSnapshot(
    null,
    "not a commit with private details",
    new Date("2026-11-12T12:00:00Z"),
  );
  expect(snapshot.database).toBe("unavailable");
  expect(snapshot.outbox).toBeNull();
  expect(snapshot.realtime).toBe("unknown");
  expect(snapshot.version).toBe("Local or unlabelled build");
});
it("reports configuration separately from live transport and exposes aggregate health only", () => {
  const snapshot = healthSnapshot(
    { realtime: true, pending: 2, failed: 1, lastSync: null },
    "a".repeat(40),
  );
  expect(snapshot.realtime).toBe("configured");
  expect(snapshot.outbox).toEqual({ pending: 2, failed: 1 });
  expect(snapshot.version).toBe("a".repeat(12));
});

it("returns only validated aggregates to an authenticated admin", async () => {
  const snapshot = healthSnapshot(
    { realtime: true, pending: 1, failed: 0, lastSync: null },
    "a".repeat(40),
  );
  const result = await adminHealthResponse(
    async () => ({ status: "ready", userId: "test", factors: [] }),
    async () => ({ ...snapshot, privateEmail: "hidden@example.test" }),
  );
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual(snapshot);
});
