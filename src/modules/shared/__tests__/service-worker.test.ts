import { runInNewContext } from "node:vm";

import { describe, expect, it, vi } from "vitest";

import {
  cachePolicy,
  SW_CACHE_PREFIX,
  SW_OFFLINE_CACHE,
  SW_OFFLINE_URL,
  SW_STATIC_CACHE,
} from "../lib/sw-policy";
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

  it.each(["/", "/order", "/i/8fK2abcdef", "/admin", "/checkin?gate=1"])(
    "page navigations try the network and fall back to the offline page: %s (TICKET-106)",
    (path) => {
      expect(cachePolicy({ ...req(path), mode: "navigate" })).toBe("network-offline-fallback");
    },
  );

  it("never gives the offline fallback to fetches, mutations or other origins", () => {
    expect(cachePolicy({ ...req("/admin"), mode: "cors" })).toBe("network-only");
    expect(cachePolicy({ ...req("/order", { method: "POST" }), mode: "navigate" })).toBe(
      "network-only",
    );
    expect(cachePolicy({ ...req("https://elsewhere.example/"), mode: "navigate" })).toBe(
      "network-only",
    );
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
  /** Response bodies by path; anything else answers "asset". */
  bodies?: Record<string, string>;
}

const keyOf = (r: Request | string) => (typeof r === "string" ? new URL(r, ORIGIN).href : r.url);

function loadWorker(options: WorkerOptions = {}) {
  const listeners = new Map<string, (event: unknown) => void>();
  const store = new Map<string, Map<string, Response>>();
  const caches = {
    open: vi.fn(async (name: string) => {
      if (options.openRejects) throw new Error("SecurityError: storage unavailable");
      const entries = store.get(name) ?? new Map<string, Response>();
      store.set(name, entries);
      return {
        match: async (r: Request | string) => entries.get(keyOf(r))?.clone(),
        put: async (r: Request | string, res: Response) => {
          if (options.putRejects) throw new Error("QuotaExceededError");
          entries.set(keyOf(r), res);
        },
      };
    }),
    keys: async () => [...store.keys()],
    delete: vi.fn(async (name: string) => store.delete(name)),
  };
  // A same-origin browser response has type "basic" (Node's constructed Response is "default").
  let online = true;
  const fetchMock = vi.fn(async (input: Request | string) => {
    if (!online) throw new TypeError("Failed to fetch");
    const body = options.bodies?.[new URL(keyOf(input)).pathname] ?? "asset";
    return Object.defineProperty(new Response(body, { status: options.status ?? 200 }), "type", {
      value: "basic",
    });
  });
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
  const setOnline = (value: boolean) => void (online = value);
  async function install() {
    let done: Promise<unknown> | undefined;
    listeners.get("install")?.({ waitUntil: (p: Promise<unknown>) => (done = p) });
    await done;
  }
  return { listeners, store, caches, fetchMock, self, setOnline, install };
}

function fetchEvent(
  path: string,
  init: { method?: string; headers?: Record<string, string>; mode?: string } = {},
) {
  const respondWith = vi.fn();
  const background: Promise<unknown>[] = [];
  const waitUntil = vi.fn((p: Promise<unknown>) => void background.push(p));
  const request = new Request(`${ORIGIN}${path}`, {
    method: init.method ?? "GET",
    headers: init.headers,
  });
  // Node's Request cannot be constructed with mode "navigate"; a browser navigation has it.
  if (init.mode) Object.defineProperty(request, "mode", { value: init.mode });
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
    const { listeners, store, caches, self, install } = loadWorker();
    store.set(`${SW_CACHE_PREFIX}static-v0`, new Map());
    store.set(`${SW_CACHE_PREFIX}offline-v0`, new Map());
    store.set(SW_STATIC_CACHE, new Map());
    store.set("someone-elses-cache", new Map());

    await install();
    expect(self.skipWaiting).not.toHaveBeenCalled();

    let activateDone: Promise<unknown> | undefined;
    listeners.get("activate")?.({ waitUntil: (p: Promise<unknown>) => (activateDone = p) });
    await activateDone;
    expect(caches.delete).toHaveBeenCalledWith(`${SW_CACHE_PREFIX}static-v0`);
    expect(caches.delete).toHaveBeenCalledWith(`${SW_CACHE_PREFIX}offline-v0`);
    expect([...store.keys()].sort()).toEqual(
      [SW_STATIC_CACHE, SW_OFFLINE_CACHE, "someone-elses-cache"].sort(),
    );
  });

  describe("offline fallback page (TICKET-106)", () => {
    const offlineHtml = `<!doctype html><link rel="stylesheet" href="/_next/static/css/app.css">
      <script src="/_next/static/chunks/main.js"></script>
      <script src="/_next/static/chunks/tracked.js?v=1"></script>`;
    const css = `@font-face{src:url(../media/serif.woff2) format("woff2")}`;
    const bodies = { [SW_OFFLINE_URL]: offlineHtml, "/_next/static/css/app.css": css };

    it("precaches the offline page and the build assets it needs on install", async () => {
      const { store, install } = loadWorker({ bodies });
      await install();
      expect([...(store.get(SW_OFFLINE_CACHE)?.keys() ?? [])]).toEqual([
        `${ORIGIN}${SW_OFFLINE_URL}`,
      ]);
      expect([...(store.get(SW_STATIC_CACHE)?.keys() ?? [])].sort()).toEqual(
        [
          `${ORIGIN}/_next/static/chunks/main.js`,
          `${ORIGIN}/_next/static/css/app.css`,
          `${ORIGIN}/_next/static/media/serif.woff2`,
        ].sort(),
      );
    });

    it("an asset that fails to precache does not fail the install", async () => {
      const { install, fetchMock } = loadWorker({ bodies });
      fetchMock.mockImplementation(async (input: Request | string) => {
        const path = new URL(keyOf(input)).pathname;
        if (path !== SW_OFFLINE_URL) throw new TypeError("Failed to fetch");
        return Object.defineProperty(new Response(offlineHtml), "type", { value: "basic" });
      });
      await expect(install()).resolves.toBeUndefined();
    });

    it("serves the network page while online and the offline page when the network fails", async () => {
      const { listeners, install, setOnline, store } = loadWorker({ bodies });
      await install();
      const onFetch = listeners.get("fetch");

      const online = fetchEvent("/order", { mode: "navigate" });
      onFetch?.(online.event);
      expect(await (await online.settle()).text()).toBe("asset");

      setOnline(false);
      const offline = fetchEvent("/i/never-visited", { mode: "navigate" });
      onFetch?.(offline.event);
      expect(await (await offline.settle()).text()).toBe(offlineHtml);
      // Nothing about the visited pages is stored.
      expect([...(store.get(SW_OFFLINE_CACHE)?.keys() ?? [])]).toEqual([
        `${ORIGIN}${SW_OFFLINE_URL}`,
      ]);
    });

    it("offline fetches (not navigations) still fail instead of getting the offline page", () => {
      const { listeners } = loadWorker({ bodies });
      const event = fetchEvent("/admin", { mode: "cors" });
      listeners.get("fetch")?.(event.event);
      expect(event.respondWith).not.toHaveBeenCalled();
    });
  });
});
