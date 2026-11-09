import { describe, expect, it, vi } from "vitest";
import { createScannerShellRuntime } from "../browser/scanner-shell-runtime";
import type { ScannerShellGrant } from "../browser/scanner-shell-store";

const origin = "https://wedding.example";
function fixture() {
  const grant: ScannerShellGrant = {
    version: 1,
    session: "a".repeat(64),
    build: "b".repeat(64),
    preparedAt: Date.now(),
    expiresAt: Date.now() + 60_000,
    html: "<!doctype html><main>Scanner</main>",
    headers: [["Content-Type", "text/html"]],
    assets: ["/scanner-assets/scanner-" + "b".repeat(64) + ".js", "/_next/static/font.woff2"],
  };
  const store = {
    accepts: (value: unknown): value is ScannerShellGrant =>
      JSON.stringify(value) === JSON.stringify(grant),
    begin: vi.fn(async () => "generation"),
    authorize: vi.fn(async () => true),
    discard: vi.fn(async () => true),
    commit: vi.fn(async () => true),
    current: vi.fn(async (): Promise<ScannerShellGrant | null> => grant),
  };
  const entries = new Map<string, Response>();
  const cache = {
    put: vi.fn(async (path: string, response: Response) => {
      entries.set(path, response);
    }),
    match: vi.fn(async (path: string) => entries.get(path)?.clone()),
  };
  const storage = { open: vi.fn(async () => cache) };
  const fetcher = vi.fn(async (input: string) => {
    if (input.endsWith("/checkin/offline-shell")) {
      const response = new Response(JSON.stringify(grant), {
        headers: { "X-Wedding-Scanner-Shell": "1" },
      });
      response.json = async () => grant;
      return response;
    }
    return new Response("public immutable asset", {
      headers: { "Content-Type": input.endsWith(".js") ? "text/javascript" : "font/woff2" },
    });
  });
  const runtime = createScannerShellRuntime({
    store,
    storage,
    fetcher,
    origin,
    build: grant.build,
  });
  return { runtime, grant, store, storage, cache, entries, fetcher };
}
describe("authorized scanner shell preparation", () => {
  it("publishes only after every server-listed asset is cached", async () => {
    const f = fixture();
    expect(await f.runtime.prepare()).toEqual({ state: "ready", expiresAt: f.grant.expiresAt });
    expect(f.fetcher.mock.calls[0]?.[0]).toBe(origin + "/checkin/offline-shell");
    expect(f.cache.put.mock.calls.map(([path]) => path)).toEqual(f.grant.assets);
    expect(f.store.authorize).toHaveBeenCalledWith(
      "generation",
      f.grant.session,
      f.grant.expiresAt,
    );
    expect(f.store.commit).toHaveBeenCalledWith("generation", f.grant);
    expect(f.cache.put.mock.invocationCallOrder.at(-1)).toBeLessThan(
      f.store.commit.mock.invocationCallOrder[0] ?? 0,
    );
  });
  it("does not publish partial or quota-failed preparation", async () => {
    const f = fixture();
    f.cache.put.mockRejectedValueOnce(new Error("QuotaExceeded"));
    expect(await f.runtime.prepare()).toEqual({ state: "unavailable" });
    expect(f.store.commit).not.toHaveBeenCalled();
  });
  it("does not publish when logout overtakes the asset downloads", async () => {
    const f = fixture();
    f.store.commit.mockResolvedValue(false);
    expect(await f.runtime.prepare()).toEqual({ state: "unavailable" });
  });
  it("rejects a sign-in document and conditionally clears only this preparation", async () => {
    const f = fixture();
    f.fetcher.mockResolvedValue(new Response("sign in", { status: 200 }));
    expect(await f.runtime.prepare()).toEqual({ state: "denied" });
    expect(f.store.discard).toHaveBeenCalledWith("generation");
    expect(f.cache.put).not.toHaveBeenCalled();
  });
  it("rejects a different build before asset requests", async () => {
    const f = fixture();
    f.grant.build = "c".repeat(64);
    expect(await f.runtime.prepare()).toEqual({ state: "unavailable" });
    expect(f.cache.put).not.toHaveBeenCalled();
    expect(f.store.commit).not.toHaveBeenCalled();
  });
  it("serves a shell only while every required asset and its authorization remain available", async () => {
    const f = fixture();
    await f.runtime.prepare();
    expect(await (await f.runtime.document())?.text()).toBe(f.grant.html);
    f.entries.delete(f.grant.assets[1] ?? "");
    expect(await f.runtime.document()).toBeNull();
  });
  it("does not return the shell if logout occurs while checking its assets", async () => {
    const f = fixture();
    await f.runtime.prepare();
    f.store.current.mockResolvedValueOnce(f.grant).mockResolvedValueOnce(null);
    expect(await f.runtime.document()).toBeNull();
  });
  it("rejects a changed document inventory even when timestamps and session match", async () => {
    const f = fixture();
    await f.runtime.prepare();
    f.store.current
      .mockResolvedValueOnce(f.grant)
      .mockResolvedValueOnce({ ...f.grant, assets: ["/_next/static/missing.css"] });
    expect(await f.runtime.document()).toBeNull();
  });
  it("does not cache a successful HTML sign-in response as a decoder", async () => {
    const f = fixture();
    f.fetcher
      .mockImplementationOnce(async () => {
        const response = new Response(JSON.stringify(f.grant), {
          headers: { "X-Wedding-Scanner-Shell": "1" },
        });
        response.json = async () => f.grant;
        return response;
      })
      .mockResolvedValueOnce(new Response("Sign in", { headers: { "Content-Type": "text/html" } }));
    expect(await f.runtime.prepare()).toEqual({ state: "unavailable" });
    expect(f.cache.put).not.toHaveBeenCalled();
    expect(f.store.commit).not.toHaveBeenCalled();
  });
  it("does not publish if a required asset is evicted before publication", async () => {
    const f = fixture();
    f.cache.match.mockResolvedValue(undefined);
    expect(await f.runtime.prepare()).toEqual({ state: "unavailable" });
    expect(f.store.commit).not.toHaveBeenCalled();
  });
  it("revalidates known authorization without downloading or publishing assets", async () => {
    const f = fixture();
    expect(await f.runtime.revalidate()).toEqual({ state: "authorized" });
    expect(f.store.authorize).toHaveBeenCalledWith(
      "generation",
      f.grant.session,
      f.grant.expiresAt,
    );
    expect(f.fetcher).toHaveBeenCalledTimes(1);
    expect(f.cache.put).not.toHaveBeenCalled();
    expect(f.store.commit).not.toHaveBeenCalled();
  });
  it("revalidation applies changed authorization even for a newer unsupported build", async () => {
    const f = fixture();
    f.grant.build = "c".repeat(64);
    expect(await f.runtime.revalidate()).toEqual({ state: "authorized" });
    expect(f.store.authorize).toHaveBeenCalledWith(
      "generation",
      f.grant.session,
      f.grant.expiresAt,
    );
  });
  it("revalidation discards known denial but retains authorization on transient server failure", async () => {
    const f = fixture();
    f.fetcher.mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
    expect(await f.runtime.revalidate()).toEqual({ state: "unavailable" });
    expect(f.store.discard).not.toHaveBeenCalled();
    f.fetcher.mockResolvedValueOnce(new Response("sign in"));
    expect(await f.runtime.revalidate()).toEqual({ state: "denied" });
    expect(f.store.discard).toHaveBeenCalledWith("generation");
  });
  it("status reveals only usable authorization identity, never the cached document", async () => {
    const f = fixture();
    expect(await f.runtime.status()).toEqual({ state: "unavailable" });
    await f.runtime.prepare();
    expect(await f.runtime.status()).toEqual({
      state: "ready",
      session: f.grant.session,
      build: f.grant.build,
      expiresAt: f.grant.expiresAt,
    });
    f.entries.delete(f.grant.assets[0] ?? "");
    expect(await f.runtime.status()).toEqual({ state: "unavailable" });
  });
  it("does not report an authoritative denial when a newer generation already won", async () => {
    const f = fixture();
    f.fetcher.mockResolvedValue(new Response("denied", { status: 401 }));
    f.store.discard.mockResolvedValue(false);
    expect(await f.runtime.revalidate()).toEqual({ state: "unavailable" });
    expect(await f.runtime.prepare()).toEqual({ state: "unavailable" });
  });
  it("preserves a known server denial when its durable tombstone write fails", async () => {
    const f = fixture();
    f.fetcher.mockResolvedValue(new Response("denied", { status: 401 }));
    f.store.discard.mockRejectedValue(new Error("storage failed"));
    expect(await f.runtime.revalidate()).toEqual({ state: "denial-storage-failed" });
    expect(await f.runtime.prepare()).toEqual({ state: "denial-storage-failed" });
  });
  it("bounds an unresponsive network request without discarding a prior valid grant", async () => {
    vi.useFakeTimers();
    try {
      const f = fixture();
      f.fetcher.mockReturnValue(new Promise(() => undefined));
      const pending = f.runtime.prepare();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await pending).toEqual({ state: "unavailable" });
      expect(f.store.discard).not.toHaveBeenCalled();
      expect(f.store.commit).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
  it("bounds a stalled response body before any cache publication", async () => {
    vi.useFakeTimers();
    try {
      const f = fixture();
      f.fetcher.mockResolvedValue(
        new Response(new ReadableStream({ start() {} }), {
          headers: { "X-Wedding-Scanner-Shell": "1" },
        }),
      );
      const pending = f.runtime.prepare();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(await pending).toEqual({ state: "unavailable" });
      expect(f.store.commit).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
