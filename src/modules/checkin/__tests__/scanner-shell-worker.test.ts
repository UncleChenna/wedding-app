import { describe, expect, it, vi } from "vitest";
import { installScannerShellWorker } from "../browser/scanner-shell-worker";
import { createScannerShellStore } from "../browser/scanner-shell-store";
import { createScannerShellRuntime } from "../browser/scanner-shell-runtime";

type Host = Parameters<typeof installScannerShellWorker>[0]["host"];
function fixture() {
  const store = createScannerShellStore({
    open: () => {
      throw new Error("unused");
    },
  });
  vi.spyOn(store, "current").mockResolvedValue(null);
  vi.spyOn(store, "invalidate").mockResolvedValue(undefined);
  const cache = { match: vi.fn(async () => undefined), put: vi.fn() };
  const storage = {
    delete: vi.fn(async () => true),
    open: vi.fn(async () => cache as unknown as Cache),
  };
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("online"));
  const runtime = createScannerShellRuntime({
    store,
    storage,
    fetcher,
    origin: "https://wedding.example",
    build: "b".repeat(64),
  });
  vi.spyOn(runtime, "revalidate").mockResolvedValue({ state: "authorized" });
  vi.spyOn(runtime, "status").mockResolvedValue({ state: "unavailable" });
  vi.spyOn(runtime, "prepare").mockResolvedValue({ state: "ready", expiresAt: 123 });
  vi.spyOn(runtime, "document").mockResolvedValue(null);
  let message: Parameters<Host["addEventListener"]>[1] = () => undefined;
  const client = { id: "scanner", url: "https://wedding.example/checkin", postMessage: vi.fn() };
  let tail: Promise<unknown> = Promise.resolve();
  const host: Host = {
    navigator: {
      locks: {
        request: (_name, operation) => {
          const result = tail.then(operation);
          tail = result.catch(() => undefined);
          return result;
        },
      },
    },
    location: { origin: "https://wedding.example" },
    clients: { get: vi.fn(async () => client), matchAll: vi.fn(async () => [client]) },
    addEventListener: (_type, callback) => {
      message = callback;
    },
  };
  const fallback = vi.fn(async () => new Response("offline fallback"));
  const worker = installScannerShellWorker({
    host,
    store: () => store,
    runtime: () => runtime,
    storage,
    fetcher,
    build: "b".repeat(64),
    assets: ["/scanner-assets/scanner-" + "b".repeat(64) + ".js"],
    fallback,
  });
  async function send(type: string, source: { id: string } | null = { id: "scanner" }) {
    const reply = vi.fn();
    let completion = Promise.resolve<unknown>(undefined);
    message({
      data: { type, expiresAt: 9999999999999, html: "untrusted" },
      source,
      ports: [{ postMessage: reply }],
      waitUntil: (promise) => {
        completion = promise;
      },
    });
    await completion;
    return reply;
  }
  async function navigate(path = "/checkin", options: RequestInit = {}) {
    const request = new Request("https://wedding.example" + path, options);
    Object.defineProperty(request, "mode", { value: "navigate" });
    let response: Promise<Response> | undefined;
    const handled = worker.handleFetch({
      request,
      respondWith: (value) => {
        response = value;
      },
    });
    return { handled, response: await response };
  }
  return { store, runtime, fetcher, fallback, worker, client, host, send, navigate, storage };
}
describe("scanner worker boundaries", () => {
  it("fetches authorization independently of message-supplied grant fields", async () => {
    const f = fixture();
    expect(await f.send("SAVE_SCANNER")).toHaveBeenCalledWith({ state: "ready", expiresAt: 123 });
    expect(f.runtime.prepare).toHaveBeenCalledWith();
  });
  it("rejects messages without a real canonical same-origin scanner client", async () => {
    const f = fixture();
    await f.send("SAVE_SCANNER", null);
    for (const url of [
      "https://evil.example/checkin",
      "https://wedding.example/admin",
      "https://wedding.example/checkin?next=1",
    ]) {
      f.client.url = url;
      await f.send("SAVE_SCANNER");
    }
    expect(f.runtime.prepare).not.toHaveBeenCalled();
  });
  it("invalidates durable authorization before acknowledging logout and notifying tabs", async () => {
    const f = fixture();
    expect(await f.send("INVALIDATE_SCANNER")).toHaveBeenCalledWith({ state: "removed" });
    expect(f.store.invalidate).toHaveBeenCalledOnce();
    expect(f.client.postMessage).toHaveBeenCalledWith({ type: "SCANNER_INVALIDATED" });
  });
  it("revalidates successful online navigation instead of trusting a 200 sign-in page", async () => {
    const f = fixture();
    expect(await (await f.navigate()).response?.text()).toBe("online");
    expect(f.runtime.revalidate).toHaveBeenCalledOnce();
  });
  it("serves only the runtime-approved offline document and otherwise generic fallback", async () => {
    const f = fixture();
    f.fetcher.mockRejectedValue(new TypeError("offline"));
    vi.mocked(f.runtime.document).mockResolvedValueOnce(new Response("authorized shell"));
    expect(await (await f.navigate()).response?.text()).toBe("authorized shell");
    expect(await (await f.navigate()).response?.text()).toBe("offline fallback");
  });
  it("never handles RSC, prefetch, mutations or other scanner routes as documents", async () => {
    const f = fixture();
    for (const [path, options] of [
      ["/checkin?x=1", {}],
      ["/checkin/offline-shell", {}],
      ["/checkin", { method: "POST" }],
      ["/checkin", { headers: { rsc: "1" } }],
      ["/checkin", { headers: { "next-router-prefetch": "1" } }],
    ] as const)
      expect((await f.navigate(path, options)).handled).toBe(false);
    expect(f.fetcher).not.toHaveBeenCalled();
  });
  it("clears authorization on known denial while preserving the online response", async () => {
    const f = fixture();
    f.fetcher.mockResolvedValue(new Response("denied", { status: 403 }));
    expect((await f.navigate()).response?.status).toBe(403);
    expect(f.store.invalidate).toHaveBeenCalledOnce();
  });
  it("notifies live scanners of authoritative denial even after durable state was evicted", async () => {
    const f = fixture();
    vi.mocked(f.runtime.revalidate).mockResolvedValue({ state: "denied" });
    await f.navigate();
    expect(f.client.postMessage).toHaveBeenCalledWith({ type: "SCANNER_INVALIDATED" });
    f.client.postMessage.mockClear();
    vi.mocked(f.runtime.prepare).mockResolvedValue({ state: "denied" });
    await f.send("SAVE_SCANNER");
    expect(f.client.postMessage).toHaveBeenCalledWith({ type: "SCANNER_INVALIDATED" });
  });
  it("still locks open scanners if durable invalidation fails", async () => {
    const f = fixture();
    vi.mocked(f.store.invalidate).mockRejectedValue(new Error("storage failed"));
    expect(await f.send("INVALIDATE_SCANNER")).toHaveBeenCalledWith({ state: "unavailable" });
    expect(f.client.postMessage).toHaveBeenCalledWith({ type: "SCANNER_INVALIDATED" });
    vi.mocked(f.runtime.status).mockResolvedValue({
      state: "ready",
      session: "a".repeat(64),
      build: "b".repeat(64),
      expiresAt: Date.now() + 60_000,
    });
    expect(await f.send("SCANNER_STATUS")).toHaveBeenCalledWith({ state: "unavailable" });
    f.fetcher.mockRejectedValue(new TypeError("offline"));
    vi.mocked(f.runtime.document).mockResolvedValue(new Response("old authorized document"));
    expect(await (await f.navigate()).response?.text()).toBe("offline fallback");
    expect(f.runtime.document).not.toHaveBeenCalled();
    expect(f.storage.delete).toHaveBeenCalledWith(f.worker.cacheName);
  });
  it("removes offline readiness and notifies when known server denial cannot be persisted", async () => {
    const f = fixture();
    vi.mocked(f.runtime.revalidate).mockResolvedValue({ state: "denial-storage-failed" });
    await f.navigate();
    expect(f.storage.delete).toHaveBeenCalledWith(f.worker.cacheName);
    expect(f.client.postMessage).toHaveBeenCalledWith({ type: "SCANNER_INVALIDATED" });
    expect(await f.send("SCANNER_STATUS")).toHaveBeenCalledWith({ state: "unavailable" });
  });
  it("finishes pending publication before failed logout removes its readiness cache", async () => {
    const f = fixture();
    let complete: (value: { state: "ready"; expiresAt: number }) => void = () => undefined;
    vi.mocked(f.runtime.prepare).mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    const saving = f.send("SAVE_SCANNER");
    await vi.waitFor(() => expect(f.runtime.prepare).toHaveBeenCalledOnce());
    vi.mocked(f.store.invalidate).mockRejectedValue(new Error("IDB failure"));
    const logout = f.send("INVALIDATE_SCANNER");
    await Promise.resolve();
    expect(f.store.invalidate).not.toHaveBeenCalled();
    complete({ state: "ready", expiresAt: Date.now() + 60_000 });
    await saving;
    expect(await logout).toHaveBeenCalledWith({ state: "unavailable" });
    expect(f.storage.delete).toHaveBeenCalledWith(f.worker.cacheName);
    expect(await f.send("SCANNER_STATUS")).toHaveBeenCalledWith({ state: "unavailable" });
  });
});
