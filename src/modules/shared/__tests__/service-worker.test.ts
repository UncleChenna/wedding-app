import { runInNewContext } from "node:vm";

import { describe, expect, it, vi } from "vitest";

import { cachePolicy, SW_CACHE_PREFIX, SW_STATIC_CACHE } from "../lib/sw-policy";
import { serviceWorkerSource } from "../server/service-worker";

const ORIGIN = "https://wedding.example";
const req = (path: string, init: { method?: string; headers?: Record<string, string> } = {}) => ({
  method: init.method ?? "GET",
  url: path.startsWith("http") ? path : `${ORIGIN}${path}`,
  origin: ORIGIN,
  headers: new Headers(init.headers),
});

describe("cachePolicy: the documented strategy table (docs/pwa.md)", () => {
  it.each([
    ["/_next/static/chunks/app-1a2b3c.js", "cache-first"],
    ["/_next/static/css/4d5e6f.css", "cache-first"],
    ["/_next/static/media/cormorant.woff2", "cache-first"],
  ])("caches immutable build assets: %s → %s", (path, policy) => {
    expect(cachePolicy(req(path))).toBe(policy);
  });

  it.each([
    "/",
    "/admin",
    "/admin/guests",
    "/checkin",
    "/kitchen",
    "/order",
    "/i/8fK2abcdef",
    "/p/signed.token.here",
    "/api/orders",
    "/api/health",
    "/sw.js",
    "/dev/theme",
  ])("never caches pages or APIs: %s → network-only", (path) => {
    expect(cachePolicy(req(path))).toBe("network-only");
  });

  it("never caches mutations, RSC or prefetch requests, queries, or other origins", () => {
    expect(cachePolicy(req("/_next/static/chunks/a.js", { method: "POST" }))).toBe("network-only");
    expect(cachePolicy(req("/_next/static/chunks/a.js", { headers: { rsc: "1" } }))).toBe(
      "network-only",
    );
    expect(
      cachePolicy(req("/_next/static/chunks/a.js", { headers: { "next-router-prefetch": "1" } })),
    ).toBe("network-only");
    expect(cachePolicy(req("/_next/static/chunks/a.js?v=2"))).toBe("network-only");
    expect(cachePolicy(req("https://cdn.example/_next/static/chunks/a.js"))).toBe("network-only");
    expect(cachePolicy(req("/_next/static/../admin"))).toBe("network-only");
  });
});

/** Run the exact script /sw.js serves inside a fake worker global. */
interface WorkerOptions {
  /** Status of the network response (206 = partial range response). */
  status?: number;
  /** cache.put rejects, as when storage quota is exhausted. */
  putRejects?: boolean;
  /** caches.open throws, as when storage is unavailable. */
  openRejects?: boolean;
}

function loadWorker(options: WorkerOptions = {}) {
  const listeners = new Map<string, (event: unknown) => void>();
  const store = new Map<string, Map<string, Response>>();
  const caches = {
    open: vi.fn(async (name: string) => {
      if (options.openRejects) throw new Error("SecurityError: storage unavailable");
      const entries = store.get(name) ?? new Map<string, Response>();
      store.set(name, entries);
      return {
        match: async (r: Request) => entries.get(r.url),
        put: async (r: Request, res: Response) => {
          if (options.putRejects) throw new Error("QuotaExceededError");
          entries.set(r.url, res);
        },
      };
    }),
    keys: async () => [...store.keys()],
    delete: vi.fn(async (name: string) => store.delete(name)),
  };
  // A same-origin browser response has type "basic" (Node's constructed Response is "default").
  const fetchMock = vi.fn(async () =>
    Object.defineProperty(new Response("asset", { status: options.status ?? 200 }), "type", {
      value: "basic",
    }),
  );
  const self = {
    location: { origin: ORIGIN },
    clients: { claim: vi.fn(async () => undefined) },
    skipWaiting: vi.fn(),
    addEventListener: (type: string, fn: (event: unknown) => void) => listeners.set(type, fn),
  };
  runInNewContext(serviceWorkerSource(), {
    self,
    caches,
    fetch: fetchMock,
    Response,
    Request,
    URL,
    console,
  });
  return { listeners, store, caches, fetchMock, self };
}

function fetchEvent(
  path: string,
  init: { method?: string; headers?: Record<string, string> } = {},
) {
  const respondWith = vi.fn();
  const background: Promise<unknown>[] = [];
  const waitUntil = vi.fn((p: Promise<unknown>) => void background.push(p));
  const request = new Request(`${ORIGIN}${path}`, {
    method: init.method ?? "GET",
    headers: init.headers,
  });
  return {
    event: { request, respondWith, waitUntil },
    respondWith,
    /** Resolve the page's response, then any background cache writes. */
    async settle(): Promise<Response> {
      const response = (await respondWith.mock.calls[0]?.[0]) as Response;
      await Promise.allSettled(background);
      return response;
    },
  };
}

describe("served worker script", () => {
  it("is valid JavaScript that registers install, activate and fetch handlers", () => {
    const { listeners } = loadWorker();
    expect([...listeners.keys()].sort()).toEqual(["activate", "fetch", "install"]);
  });

  it("answers immutable assets from cache-first and leaves every page and API to the network", async () => {
    const { listeners, store } = loadWorker();
    const onFetch = listeners.get("fetch");
    if (!onFetch) throw new Error("no fetch handler");

    const asset = fetchEvent("/_next/static/chunks/app.js");
    onFetch(asset.event);
    expect(asset.respondWith).toHaveBeenCalledOnce();
    await asset.settle();
    expect(store.get(SW_STATIC_CACHE)?.has(`${ORIGIN}/_next/static/chunks/app.js`)).toBe(true);

    for (const path of ["/admin", "/i/abc", "/api/orders", "/"]) {
      const page = fetchEvent(path);
      onFetch(page.event);
      expect(page.respondWith, path).not.toHaveBeenCalled();
    }
    expect([...(store.get(SW_STATIC_CACHE)?.keys() ?? [])]).toEqual([
      `${ORIGIN}/_next/static/chunks/app.js`,
    ]);
  });

  describe("caching is best-effort and never breaks the page (TICKET-193)", () => {
    const asset = "/_next/static/media/clip.mp4";

    it("returns a partial 206 response to the page without storing it", async () => {
      const { listeners, store } = loadWorker({ status: 206 });
      const event = fetchEvent(asset);
      listeners.get("fetch")?.(event.event);
      const response = await event.settle();
      expect(response.status).toBe(206);
      expect(store.get(SW_STATIC_CACHE)?.has(`${ORIGIN}${asset}`) ?? false).toBe(false);
    });

    it("still returns the asset when storing it fails (quota exhausted)", async () => {
      const { listeners } = loadWorker({ putRejects: true });
      const event = fetchEvent(asset);
      listeners.get("fetch")?.(event.event);
      const response = await event.settle();
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("asset");
    });

    it("falls through to the network when Cache Storage itself throws", async () => {
      const { listeners, fetchMock } = loadWorker({ openRejects: true });
      const event = fetchEvent(asset);
      listeners.get("fetch")?.(event.event);
      const response = await event.settle();
      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledOnce();
    });
  });

  it("never skips waiting, and on activate deletes only obsolete app-owned caches", async () => {
    const { listeners, store, caches, self } = loadWorker();
    store.set(`${SW_CACHE_PREFIX}static-v0`, new Map());
    store.set(SW_STATIC_CACHE, new Map());
    store.set("someone-elses-cache", new Map());

    let installDone: Promise<unknown> | undefined;
    listeners.get("install")?.({ waitUntil: (p: Promise<unknown>) => (installDone = p) });
    await installDone;
    expect(self.skipWaiting).not.toHaveBeenCalled();

    let activateDone: Promise<unknown> | undefined;
    listeners.get("activate")?.({ waitUntil: (p: Promise<unknown>) => (activateDone = p) });
    await activateDone;
    expect(caches.delete).toHaveBeenCalledWith(`${SW_CACHE_PREFIX}static-v0`);
    expect([...store.keys()].sort()).toEqual([SW_STATIC_CACHE, "someone-elses-cache"].sort());
  });
});
