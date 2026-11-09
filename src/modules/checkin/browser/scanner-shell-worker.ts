import type { createScannerShellRuntime } from "./scanner-shell-runtime";
import type { createScannerShellStore } from "./scanner-shell-store";

type Store = ReturnType<typeof createScannerShellStore>;
type Runtime = ReturnType<typeof createScannerShellRuntime>;
interface Client {
  id: string;
  url: string;
  postMessage(message: unknown): void;
}
interface Host {
  navigator?: { locks?: { request<T>(name: string, callback: () => Promise<T>): Promise<T> } };
  location: { origin: string };
  clients: {
    get(id: string): Promise<Client | undefined>;
    matchAll(options: { type: "window"; includeUncontrolled: boolean }): Promise<readonly Client[]>;
  };
  addEventListener(
    type: "message",
    callback: (event: {
      data: unknown;
      source: { id?: string } | null;
      ports: readonly { postMessage(message: unknown): void }[];
      waitUntil(promise: Promise<unknown>): void;
    }) => void,
  ): void;
}
interface FetchEvent {
  request: Request;
  respondWith(response: Promise<Response>): void;
}
interface Options {
  host: Host;
  store: () => Store;
  runtime: () => Runtime;
  storage: Pick<CacheStorage, "open" | "delete" | "keys">;
  fetcher: typeof fetch;
  build: string;
  assets: readonly string[];
  fallback: () => Promise<Response>;
}

/** Self-contained worker wiring. Only the server-issued grant may authorize offline use. */
export function installScannerShellWorker({
  host,
  store,
  runtime,
  storage,
  fetcher,
  build,
  assets,
  fallback,
}: Options) {
  // Origin-wide lock also covers an old worker finishing work during activation.
  // Without it, failed IDB invalidation cannot safely race a pending publication.
  function serialized<T>(operation: () => Promise<T>): Promise<T> {
    if (!host.navigator?.locks)
      return Promise.reject(new Error("Scanner storage coordination unavailable"));
    return host.navigator.locks.request("wedding-scanner-shell-publication-v1", operation);
  }
  let storageInvalidationFailed = false;
  const cacheName = "wedding-scanner-assets-v1-" + build;
  function scannerUrl(raw: string) {
    const url = new URL(raw, host.location.origin);
    return url.origin === host.location.origin && url.pathname === "/checkin" && !url.search;
  }
  async function notify() {
    const clients = await host.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients)
      if (scannerUrl(client.url)) client.postMessage({ type: "SCANNER_INVALIDATED" });
  }
  async function failedInvalidation() {
    storageInvalidationFailed = true;
    try {
      const names = await storage.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("wedding-scanner-assets-v1-"))
          .map((name) => storage.delete(name)),
      );
    } finally {
      await notify();
    }
  }
  async function invalidate() {
    try {
      await store().invalidate();
      storageInvalidationFailed = false;
    } catch (error) {
      await failedInvalidation();
      throw error;
    } finally {
      await notify();
    }
  }
  async function reconcile() {
    const before = await store().current();
    const result = await runtime().revalidate();
    if (result.state === "denial-storage-failed") {
      await failedInvalidation();
      return;
    }
    const after = await store().current();
    if (
      result.state === "denied" ||
      (before && (!after || before.session !== after.session || after.expiresAt < before.expiresAt))
    )
      await notify();
  }
  host.addEventListener("message", (event) => {
    const data = event.data;
    if (
      typeof data !== "object" ||
      data === null ||
      !("type" in data) ||
      !["SAVE_SCANNER", "SCANNER_STATUS", "INVALIDATE_SCANNER"].includes(String(data.type))
    )
      return;
    event.waitUntil(
      serialized(async () => {
        try {
          const client = event.source?.id ? await host.clients.get(event.source.id) : undefined;
          // Resolve the real client, never trust a URL supplied in the message.
          if (!client || !scannerUrl(client.url)) return;
          let result: unknown;
          if (data.type === "INVALIDATE_SCANNER") {
            await invalidate();
            result = { state: "removed" };
          } else if (data.type === "SCANNER_STATUS") {
            result = storageInvalidationFailed
              ? { state: "unavailable" }
              : await runtime().status();
          } else {
            const before = await store().current();
            const prepared = await runtime().prepare();
            result = prepared;
            if (prepared.state === "denial-storage-failed") await failedInvalidation();
            if (prepared.state === "ready") storageInvalidationFailed = false;
            const after = await store().current();
            if (
              prepared.state === "denied" ||
              (before &&
                (!after || before.session !== after.session || after.expiresAt < before.expiresAt))
            )
              await notify();
          }
          event.ports[0]?.postMessage(result);
        } catch {
          event.ports[0]?.postMessage({ state: "unavailable" });
        }
      }).catch(() => event.ports[0]?.postMessage({ state: "unavailable" })),
    );
  });
  return {
    cacheName,
    async activate() {
      await serialized(async () => {
        try {
          const current = await store().current();
          if (current && current.build !== build) await invalidate();
        } catch {
          // Storage unavailable: document/status remain fail-closed.
          await notify();
        }
      }).catch(() => notify());
    },
    handleFetch(event: FetchEvent) {
      const request = event.request;
      const url = new URL(request.url);
      if (
        request.method !== "GET" ||
        request.headers.has("rsc") ||
        request.headers.has("next-router-prefetch")
      )
        return false;
      if (request.mode === "navigate" && scannerUrl(request.url)) {
        event.respondWith(
          (async () => {
            let response: Response;
            try {
              response = await fetcher(request);
            } catch {
              try {
                return await serialized(async () =>
                  storageInvalidationFailed
                    ? await fallback()
                    : ((await runtime().document()) ?? (await fallback())),
                );
              } catch {
                return fallback();
              }
            }
            try {
              await serialized(async () => {
                if (response.redirected || [401, 403, 404, 410].includes(response.status))
                  await invalidate();
                else if (response.status === 200) await reconcile();
              });
            } catch {
              // A healthy online page must not depend on offline storage being available.
            }
            return response;
          })(),
        );
        return true;
      }
      if (url.origin !== host.location.origin || url.search || !assets.includes(url.pathname))
        return false;
      event.respondWith(
        (async () => {
          try {
            const cached = await (await storage.open(cacheName)).match(url.pathname);
            if (cached) return cached;
          } catch {
            /* Public asset remains available from the network. */
          }
          // Preparation alone stores verified complete assets. Ordinary fetches cannot publish a grant.
          return fetcher(request);
        })(),
      );
      return true;
    },
  };
}
