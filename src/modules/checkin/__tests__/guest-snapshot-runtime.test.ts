import { describe, expect, it, vi } from "vitest";
import { createGuestSnapshotRuntime } from "../browser/guest-snapshot-runtime";
import { parseGuestSnapshot, type GuestSnapshot } from "../lib/guest-snapshot";

function fixture() {
  const snapshot: GuestSnapshot = {
    version: 1,
    session: "a".repeat(64),
    generatedAt: Date.now(),
    expiresAt: Date.now() + 60_000,
    keys: [{ kid: "test", alg: "Ed25519", spki: "MCowBQYDK2VwAyEA" + "A".repeat(43) }],
    invitations: [],
  };
  const authority = vi.fn(async () => ({
    session: snapshot.session,
    expiresAt: snapshot.expiresAt,
  }));
  const store = {
    discard: vi.fn(async () => true),
    authorize: vi.fn(async () => true),
    begin: vi.fn(async () => "generation"),
    current: vi.fn(async () => snapshot),
    commit: vi.fn(async () => true),
    invalidate: vi.fn(async () => {}),
  };
  const fetcher = vi.fn(
    async () =>
      new Response(JSON.stringify(snapshot), {
        headers: { "X-Wedding-Guest-Snapshot": "1", "Content-Type": "application/json" },
      }),
  );
  const denied = vi.fn(async () => {});
  const runtime = createGuestSnapshotRuntime({
    store,
    authority,
    fetcher,
    denied,
    parse: parseGuestSnapshot,
    origin: "https://wedding.example",
  });
  return { snapshot, authority, store, fetcher, denied, runtime };
}
describe("worker-owned snapshot refresh", () => {
  it("publishes only a matching server snapshot and rechecks trusted authority", async () => {
    const f = fixture();
    expect(await f.runtime.refresh()).toEqual({ state: "ready" });
    expect(f.authority).toHaveBeenCalledTimes(2);
    expect(f.store.commit).toHaveBeenCalledWith("generation", f.snapshot, {
      session: f.snapshot.session,
      expiresAt: f.snapshot.expiresAt,
    });
  });
  it("rejects a replaced session without returning its private contents", async () => {
    const f = fixture();
    f.authority
      .mockResolvedValueOnce({ session: f.snapshot.session, expiresAt: f.snapshot.expiresAt })
      .mockResolvedValue({ session: "b".repeat(64), expiresAt: f.snapshot.expiresAt });
    expect(await f.runtime.refresh()).toEqual({ state: "unavailable" });
    expect(f.store.commit).not.toHaveBeenCalled();
  });
  it("applies a trusted shortened deadline before attempting publication", async () => {
    const f = fixture();
    const shorter = { ...f.snapshot, generatedAt: Date.now() - 60_000, expiresAt: Date.now() - 1 };
    f.fetcher.mockResolvedValue(
      new Response(JSON.stringify(shorter), {
        headers: { "X-Wedding-Guest-Snapshot": "1", "Content-Type": "application/json" },
      }),
    );
    f.store.authorize.mockResolvedValue(false);
    expect(await f.runtime.refresh()).toEqual({ state: "denied" });
    expect(f.store.discard).toHaveBeenCalledWith("generation");
    expect(f.denied).toHaveBeenCalledOnce();
    expect(f.store.commit).not.toHaveBeenCalled();
  });
  it("treats server authentication denial as authoritative and invokes durable invalidation", async () => {
    const f = fixture();
    f.fetcher.mockResolvedValue(new Response(null, { status: 401 }));
    expect(await f.runtime.refresh()).toEqual({ state: "denied" });
    expect(f.denied).toHaveBeenCalledOnce();
    expect(f.store.commit).not.toHaveBeenCalled();
  });
  it("does not publish a login response or unbounded snapshot", async () => {
    const f = fixture();
    f.fetcher.mockResolvedValue(new Response("<html>sign in</html>"));
    expect(await f.runtime.refresh()).toEqual({ state: "unavailable" });
    expect(f.store.commit).not.toHaveBeenCalled();
  });
  it("bounds stalled network time without clearing a usable same-session copy", async () => {
    vi.useFakeTimers();
    try {
      const f = fixture();
      f.fetcher.mockImplementation(() => new Promise<Response>(() => {}));
      const result = f.runtime.refresh();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await result).toEqual({ state: "unavailable" });
      expect(f.store.invalidate).not.toHaveBeenCalled();
      expect(f.store.commit).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
  it("bounds a stalled response body under the same deadline", async () => {
    vi.useFakeTimers();
    try {
      const f = fixture();
      f.fetcher.mockResolvedValue(
        new Response(new ReadableStream(), {
          headers: { "X-Wedding-Guest-Snapshot": "1", "Content-Type": "application/json" },
        }),
      );
      const result = f.runtime.refresh();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await result).toEqual({ state: "unavailable" });
      expect(f.store.commit).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
  it("rejects oversized decoded bodies and lost publication generations", async () => {
    const f = fixture();
    f.fetcher.mockResolvedValueOnce(
      new Response("x".repeat(2_097_153), {
        headers: { "X-Wedding-Guest-Snapshot": "1", "Content-Type": "application/json" },
      }),
    );
    expect(await f.runtime.refresh()).toEqual({ state: "unavailable" });
    expect(f.store.commit).not.toHaveBeenCalled();
    f.store.commit.mockResolvedValue(false);
    expect(await f.runtime.refresh()).toEqual({ state: "unavailable" });
  });
  it("does not read or erase a replacement session for an old tab", async () => {
    const f = fixture();
    expect(await f.runtime.read("b".repeat(64))).toBeNull();
    expect(f.store.current).not.toHaveBeenCalled();
    expect(f.store.invalidate).not.toHaveBeenCalled();
    expect(await f.runtime.read(f.snapshot.session)).toEqual(f.snapshot);
  });
});
