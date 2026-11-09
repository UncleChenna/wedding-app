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
    accepts: (value: unknown): value is ScannerShellGrant => value === grant,
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
      const response = new Response("{}", { headers: { "X-Wedding-Scanner-Shell": "1" } });
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
    expect(f.store.authorize).toHaveBeenCalledWith("generation", f.grant.session);
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
        const response = new Response("{}", { headers: { "X-Wedding-Scanner-Shell": "1" } });
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
});
