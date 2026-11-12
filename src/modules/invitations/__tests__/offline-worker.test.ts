import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";
import { serviceWorkerSource } from "@/modules/shared/server/service-worker";
import { OWN_PASS_CACHE } from "../lib/offline-worker";
import { SW_OFFLINE_CACHE, SW_OFFLINE_URL } from "@/modules/shared/lib/sw-policy";

const origin = "https://example.com";
const a = "/i/" + "A".repeat(43);
const b = "/i/" + "B".repeat(43);
function worker() {
  const listeners = new Map<string, (event: unknown) => void>();
  const store = new Map<string, Map<string, Response>>();
  let online = true;
  let status = 200;
  let quota = false;
  let version = 1;
  let deleteFailure = false;
  const key = (value: string | Request) =>
    new URL(typeof value === "string" ? value : value.url, origin).href;
  const caches = {
    open: async (name: string) => {
      const items = store.get(name) ?? new Map<string, Response>();
      store.set(name, items);
      return {
        put: async (url: string | Request, response: Response) => {
          if (quota) throw new Error("quota");
          items.set(key(url), response.clone());
        },
        match: async (url: string | Request) => items.get(key(url))?.clone(),
        keys: async () => [...items.keys()].map((url) => new Request(url)),
        delete: async (url: string | Request) => {
          if (deleteFailure) throw new Error("delete unavailable");
          return items.delete(key(url));
        },
      };
    },
    keys: async () => [...store.keys()],
    delete: async (name: string) => store.delete(name),
  };
  const fetch = vi.fn(async (url: string | Request) => {
    if (!online) throw new Error("offline");
    const path = new URL(key(url)).pathname;
    return new Response(path.endsWith("/offline-pass") ? "SAVED:" + path : "ONLINE", {
      status,
      headers: {
        "X-Wedding-Offline-Pass": "1",
        "X-Wedding-Pass-Version": String(version),
        "X-Wedding-Offline-Expires": "2099-12-20T06:00:00.000Z",
        "X-Wedding-Offline-Refreshed": "2026-11-02T20:00:00Z",
      },
    });
  });
  const clients = {
    get: vi.fn(async (id: string) =>
      id === "a" ? { url: origin + a } : id === "b" ? { url: origin + b } : null,
    ),
    claim: async () => undefined,
  };
  runInNewContext(serviceWorkerSource(), {
    self: {
      location: { origin },
      clients,
      addEventListener: (name: string, fn: (event: unknown) => void) => listeners.set(name, fn),
    },
    caches,
    fetch,
    Response,
    Headers,
    Request,
    URL,
    console,
  });
  async function save(path: string, client = "a") {
    const reply = vi.fn();
    let done: Promise<unknown> | undefined;
    listeners.get("message")?.({
      data: { type: "SAVE_OWN_PASS", path, appearance: { classes: "", styles: [] } },
      source: { id: client },
      ports: [{ postMessage: reply }],
      waitUntil: (value: Promise<unknown>) => {
        done = value;
      },
    });
    await done;
    return reply.mock.calls[0]?.[0] as { state: string };
  }
  async function navigate(path: string) {
    const request = new Request(origin + path);
    Object.defineProperty(request, "mode", { value: "navigate" });
    let response: Promise<Response> | undefined;
    listeners.get("fetch")?.({
      request,
      respondWith: (value: Promise<Response>) => {
        response = value;
      },
      waitUntil: () => undefined,
    });
    return await response;
  }
  return {
    store,
    caches,
    fetch,
    clients,
    save,
    navigate,
    setOnline: (value: boolean) => {
      online = value;
    },
    setStatus: (value: number) => {
      status = value;
    },
    setVersion: (value: number) => {
      version = value;
    },
    setDeleteFailure: (value: boolean) => {
      deleteFailure = value;
    },
    setQuota: (value: boolean) => {
      quota = value;
    },
  };
}
it("saves only the requesting client's own pass and never exposes A through B", async () => {
  const w = worker();
  expect(await w.save(b)).toEqual({ state: "denied" });
  expect(w.fetch).not.toHaveBeenCalled();
  expect((await w.save(a)).state).toBe("saved");
  await (await w.caches.open(SW_OFFLINE_CACHE)).put(SW_OFFLINE_URL, new Response("GENERIC"));
  w.setOnline(false);
  expect(await (await w.navigate(a))?.text()).toBe("SAVED:" + a + "/offline-pass");
  expect(await (await w.navigate(b))?.text()).toBe("GENERIC");
});
it("removes a known revoked copy on reconnect", async () => {
  const w = worker();
  await w.save(a);
  w.setStatus(404);
  expect((await w.save(a)).state).toBe("removed");
  expect(w.store.get(OWN_PASS_CACHE)?.size).toBe(0);
});
it("removes stale data on a revoked online navigation", async () => {
  const w = worker();
  await w.save(a);
  w.setStatus(404);
  expect((await w.navigate(a))?.status).toBe(404);
  expect(w.store.get(OWN_PASS_CACHE)?.size).toBe(0);
});
it("does not claim saved when quota is exhausted, and preserves a copy through transient failures", async () => {
  const w = worker();
  w.setQuota(true);
  expect((await w.save(a)).state).toBe("unavailable");
  w.setQuota(false);
  await w.save(a);
  w.setStatus(503);
  expect((await w.save(a)).state).toBe("unavailable");
  expect(w.store.get(OWN_PASS_CACHE)?.size).toBe(1);
});
it("rejects foreign and malformed paths even when sent by an existing client", async () => {
  const w = worker();
  for (const path of ["https://other.example" + a, a + "?x=1", "/admin", "/i/bad"])
    expect((await w.save(path)).state).toBe("denied");
  expect((await w.save(a, "unknown")).state).toBe("denied");
  expect(w.fetch).not.toHaveBeenCalled();
});

it("serializes a slow save before a later revocation check", async () => {
  const w = worker();
  let resolveFirst: ((response: Response) => void) | undefined;
  w.fetch.mockImplementationOnce(
    () =>
      new Promise<Response>((resolve) => {
        resolveFirst = resolve;
      }),
  );
  const first = w.save(a);
  await vi.waitFor(() => expect(w.fetch).toHaveBeenCalledOnce());
  w.setStatus(404);
  const second = w.save(a);
  resolveFirst?.(
    new Response("old copy", {
      headers: {
        "X-Wedding-Offline-Pass": "1",
        "X-Wedding-Pass-Version": "1",
        "X-Wedding-Offline-Expires": "2099-12-20T06:00:00.000Z",
      },
    }),
  );
  expect((await first).state).toBe("saved");
  expect((await second).state).toBe("removed");
  expect(w.store.get(OWN_PASS_CACHE)?.size).toBe(0);
});
it("revocation of A leaves a separately authorized B copy untouched", async () => {
  const w = worker();
  await w.save(a);
  await w.save(b, "b");
  w.setStatus(404);
  await w.save(a);
  expect(w.store.get(OWN_PASS_CACHE)?.size).toBe(1);
  expect(await (await (await w.caches.open(OWN_PASS_CACHE)).match(b))?.text()).toContain(b);
});

it("removes a replaced version before attempting a new write that can fail quota", async () => {
  const w = worker();
  await w.save(a);
  w.setVersion(2);
  w.setQuota(true);
  expect((await w.save(a)).state).toBe("unavailable");
  expect(w.store.get(OWN_PASS_CACHE)?.size).toBe(0);
});
it("never serves a known-revoked copy if cache deletion fails", async () => {
  const w = worker();
  await w.save(a);
  await (await w.caches.open(SW_OFFLINE_CACHE)).put(SW_OFFLINE_URL, new Response("GENERIC"));
  w.setDeleteFailure(true);
  w.setStatus(404);
  expect((await w.navigate(a))?.status).toBe(404);
  w.setOnline(false);
  expect(await (await w.navigate(a))?.text()).toBe("GENERIC");
});
it("does not report successful removal when both deletion and tombstone writing fail", async () => {
  const w = worker();
  await w.save(a);
  w.setDeleteFailure(true);
  w.setQuota(true);
  w.setStatus(404);
  expect((await w.save(a)).state).toBe("unavailable");
});

it("expired and legacy copies are never served even when deletion and tombstone writes fail", async () => {
  const w = worker();
  await w.save(a);
  await (await w.caches.open(SW_OFFLINE_CACHE)).put(SW_OFFLINE_URL, new Response("GENERIC"));
  const cache = await w.caches.open(OWN_PASS_CACHE);
  const copy = await cache.match(a);
  if (!copy) throw new Error("Missing saved copy");
  const headers = new Headers(copy.headers);
  headers.set("X-Wedding-Offline-Expires", "2000-01-01T00:00:00.000Z");
  await cache.put(a, new Response(await copy.text(), { headers }));
  w.setOnline(false);
  w.setDeleteFailure(true);
  w.setQuota(true);
  expect(await (await w.navigate(a))?.text()).toBe("GENERIC");
  expect(w.store.get(OWN_PASS_CACHE)?.size).toBe(1); // storage refused writes, never claim erased
});
it("a legacy saved pass without a bounded expiry is removed before offline use", async () => {
  const w = worker();
  await w.save(a);
  await (await w.caches.open(SW_OFFLINE_CACHE)).put(SW_OFFLINE_URL, new Response("GENERIC"));
  const cache = await w.caches.open(OWN_PASS_CACHE),
    copy = await cache.match(a);
  if (!copy) throw new Error("Missing saved copy");
  const headers = new Headers(copy.headers);
  headers.delete("X-Wedding-Offline-Expires");
  await cache.put(a, new Response(await copy.text(), { headers }));
  w.setOnline(false);
  expect(await (await w.navigate(a))?.text()).toBe("GENERIC");
  expect(w.store.get(OWN_PASS_CACHE)?.size).toBe(0);
});
