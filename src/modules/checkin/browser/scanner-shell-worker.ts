import type { createScannerShellRuntime } from "./scanner-shell-runtime";
import type { createScannerShellStore } from "./scanner-shell-store";
import type { createGuestSnapshotStore, SnapshotAuthority } from "./guest-snapshot-store";
import type { createGuestSnapshotRuntime } from "./guest-snapshot-runtime";

import type { createOfflineQueueStore } from "./offline-queue-store";
import type { createOfflineQueueRuntime } from "./offline-queue-runtime";
import type { GuestSnapshot } from "../lib/guest-snapshot";

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
  queue?: {
    store: () => ReturnType<typeof createOfflineQueueStore>;
    runtime: (
      snapshot: (session: string) => Promise<GuestSnapshot | null>,
    ) => ReturnType<typeof createOfflineQueueRuntime>;
  };
  guests?: {
    store: () => ReturnType<typeof createGuestSnapshotStore>;
    runtime: (
      authority: () => Promise<SnapshotAuthority | null>,
      denied: () => Promise<void>,
    ) => ReturnType<typeof createGuestSnapshotRuntime>;
  };
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
  guests,
  queue,
}: Options) {
  // Origin-wide lock also covers an old worker finishing work during activation.
  // Without it, failed IDB invalidation cannot safely race a pending publication.
  function serialized<T>(operation: () => Promise<T>): Promise<T> {
    if (!host.navigator?.locks)
      return Promise.reject(new Error("Scanner storage coordination unavailable"));
    return host.navigator.locks.request("wedding-scanner-shell-publication-v1", operation);
  }
  let storageInvalidationFailed = false;
  async function settleInvalidations(operations: Promise<unknown>[]) {
    const results = await Promise.allSettled(operations);
    if (results.some((result) => result.status === "rejected"))
      throw new Error("Scanner invalidation incomplete");
  }
  const cacheName = "wedding-scanner-assets-v1-" + build;
  function scannerUrl(raw: string) {
    const url = new URL(raw, host.location.origin);
    return url.origin === host.location.origin && url.pathname === "/checkin" && !url.search;
  }
  async function notify(current?: { session: string; build: string; expiresAt: number }) {
    const clients = await host.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients)
      if (scannerUrl(client.url))
        client.postMessage({
          type: "SCANNER_INVALIDATED",
          ...(current
            ? {
                current: {
                  session: current.session,
                  build: current.build,
                  expiresAt: current.expiresAt,
                },
              }
            : {}),
        });
  }
  async function failedInvalidation() {
    storageInvalidationFailed = true;
    try {
      await guests?.store().invalidate();
    } catch {
      /* Keep the latch closed; missing public readiness prevents restart access. */
    }
    try {
      const names = await storage.keys();
      await settleInvalidations(
        names
          .filter((name) => name.startsWith("wedding-scanner-assets-v1-"))
          .map(async (name) => storage.delete(name)),
      );
    } finally {
      await notify();
    }
  }
  async function invalidate() {
    try {
      await settleInvalidations([
        Promise.resolve().then(() => store().invalidate()),
        Promise.resolve().then(() => guests?.store().invalidate()),
        Promise.resolve().then(() => queue?.store().purgeAcknowledged()),
      ]);
      storageInvalidationFailed = false;
    } catch (error) {
      await failedInvalidation();
      throw error;
    } finally {
      await notify();
    }
  }
  async function snapshotAuthority(): Promise<SnapshotAuthority | null> {
    if (storageInvalidationFailed) return null;
    const status = await runtime().status();
    if (status.state === "ready") {
      const authority = { session: status.session, expiresAt: status.expiresAt };
      await syncSnapshotAuthority(authority);
      return authority;
    }
    try {
      await guests?.store().invalidate();
      await queue?.store().purgeAcknowledged();
    } catch (error) {
      await failedInvalidation();
      throw error;
    }
    return null;
  }
  async function syncSnapshotAuthority(authority?: SnapshotAuthority) {
    if (!guests) return;
    try {
      if (!authority || storageInvalidationFailed) await guests.store().invalidate();
      if (authority) await guests.store().current(authority);
    } catch (error) {
      await failedInvalidation();
      throw error;
    }
  }
  async function nativeSignOut(request: Request) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        fetcher(request, { signal: controller.signal }),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("Sign-out timed out"));
          }, 10_000);
        }),
      ]);
    } finally {
      clearTimeout(timer);
      // Even a failed/timed-out sign-out relinquishes this saved scanner access.
      await invalidate();
    }
  }
  async function reconcile() {
    let authorized: { session: string; build: string; expiresAt: number } | undefined;
    const result = await runtime().revalidate((identity) => {
      authorized = identity;
    });
    if (result.state === "denial-storage-failed") await failedInvalidation();
    else if (result.state === "denied") {
      await syncSnapshotAuthority();
      await notify();
    } else if (authorized) {
      await syncSnapshotAuthority(authorized);
      await notify(authorized);
    }
  }
  host.addEventListener("message", (event) => {
    const data = event.data;
    if (
      typeof data !== "object" ||
      data === null ||
      !("type" in data) ||
      ![
        "SAVE_SCANNER",
        "SCANNER_STATUS",
        "INVALIDATE_SCANNER",
        "READ_GUEST_SNAPSHOT",
        "REFRESH_GUEST_SNAPSHOT",
        "DENY_SCANNER_SESSION",
        "INVALIDATE_GUEST_SNAPSHOT",
        "OFFLINE_QUEUE_STATUS",
        "RECORD_OFFLINE_ATTEMPT",
        "SYNC_OFFLINE_QUEUE",
      ].includes(String(data.type))
    )
      return;
    event.waitUntil(
      serialized(async () => {
        try {
          const client = event.source?.id ? await host.clients.get(event.source.id) : undefined;
          // Resolve the real client, never trust a URL supplied in the message.
          if (!client || !scannerUrl(client.url)) return;
          let result: unknown;
          if (
            ["OFFLINE_QUEUE_STATUS", "RECORD_OFFLINE_ATTEMPT", "SYNC_OFFLINE_QUEUE"].includes(
              String(data.type),
            )
          ) {
            if (!queue || !guests) result = { state: "unavailable" };
            else {
              const guestRuntime = guests.runtime(snapshotAuthority, invalidate);
              const queueRuntime = queue.runtime((session) => guestRuntime.read(session));
              if (data.type === "RECORD_OFFLINE_ATTEMPT")
                result = await queueRuntime.record("input" in data ? data.input : null);
              else if (!("session" in data) || typeof data.session !== "string")
                result = { state: "unavailable" };
              else if (data.type === "OFFLINE_QUEUE_STATUS")
                result = await queueRuntime.status(data.session);
              else {
                const synced = await queueRuntime.sync(data.session);
                result = synced;
                if (synced.state === "denied") await invalidate();
                else if (
                  (synced.state === "synced" && synced.committed > 0) ||
                  synced.state === "idle"
                ) {
                  const captured = (await queue.store().read()).barriers;
                  if (captured.length > 0) {
                    const refreshed = await guestRuntime.refresh();
                    if (refreshed.state === "ready")
                      await queue.store().clearCapturedBarriers(captured);
                  }
                }
              }
            }
          } else if (data.type === "INVALIDATE_GUEST_SNAPSHOT") {
            const current = await store().current();
            if (guests && (!current || ("session" in data && current.session === data.session))) {
              try {
                await guests.store().invalidate();
              } catch (error) {
                await failedInvalidation();
                throw error;
              }
              result = { state: "removed", privateSnapshotRemoved: true };
            } else result = { state: "unavailable" };
          } else if (data.type === "DENY_SCANNER_SESSION") {
            const current = await store().current();
            if (current && "session" in data && current.session === data.session) {
              await invalidate();
              result = { state: "removed", ...(guests ? { privateSnapshotRemoved: true } : {}) };
            } else {
              // Absent authority cannot own a private snapshot. A different live
              // session, however, must remain untouched by a stale tab's denial.
              if (!current) await syncSnapshotAuthority();
              result = { state: "unavailable" };
            }
          } else if (
            data.type === "READ_GUEST_SNAPSHOT" ||
            data.type === "REFRESH_GUEST_SNAPSHOT"
          ) {
            if (
              !guests ||
              !("session" in data) ||
              typeof data.session !== "string" ||
              !/^[a-f0-9]{64}$/.test(data.session)
            ) {
              result = { state: "unavailable" };
            } else {
              const guestRuntime = guests.runtime(snapshotAuthority, invalidate);
              if (data.type === "READ_GUEST_SNAPSHOT") {
                const snapshot = await guestRuntime.read(data.session);
                if (snapshot && queue) {
                  const journal = await queue.store().read();
                  // Canonical storage stays unchanged; all retained local operators share allowance.
                  const invitations = snapshot.invitations.map((row) => ({
                    ...row,
                    admittedSoFar: Math.min(
                      row.partySize,
                      row.admittedSoFar +
                        journal.attempts
                          .filter(
                            (attempt) =>
                              attempt.event.invitationId === row.invitationId &&
                              attempt.event.kind === "admission",
                          )
                          .reduce((sum, attempt) => sum + attempt.event.reportedPeople, 0),
                    ),
                  }));
                  result = { state: "ready", snapshot: { ...snapshot, invitations } };
                } else result = snapshot ? { state: "ready", snapshot } : { state: "unavailable" };
              } else {
                const authority = await snapshotAuthority();
                const captured = queue ? (await queue.store().read()).barriers : [];
                const refreshed =
                  authority?.session === data.session
                    ? await guestRuntime.refresh()
                    : { state: "unavailable" };
                if (refreshed.state === "ready" && queue)
                  await queue.store().clearCapturedBarriers(captured);
                result = refreshed;
              }
            }
          } else if (data.type === "INVALIDATE_SCANNER") {
            await invalidate();
            result = { state: "removed", ...(guests ? { privateSnapshotRemoved: true } : {}) };
          } else if (data.type === "SCANNER_STATUS") {
            const status = storageInvalidationFailed
              ? { state: "unavailable" }
              : await runtime().status();
            if (!storageInvalidationFailed && guests) await snapshotAuthority();
            if (status.state === "ready" && queue) await queue.store().read();
            result = status;
          } else {
            let authorized: { session: string; build: string; expiresAt: number } | undefined;
            const prepared = await runtime().prepare((identity) => {
              authorized = identity;
            });
            result = prepared;
            if (prepared.state === "ready") {
              if (queue) await queue.store().read();
              await syncSnapshotAuthority(authorized);
              storageInvalidationFailed = false;
            }
            if (prepared.state === "denial-storage-failed") await failedInvalidation();
            else if (prepared.state === "denied") {
              await syncSnapshotAuthority();
              await notify();
            } else if (authorized) {
              await syncSnapshotAuthority(authorized);
              await notify(authorized);
            }
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
          else if (guests) await snapshotAuthority();
        } catch {
          // Storage unavailable: document/status remain fail-closed.
          await notify();
        }
      }).catch(() => notify());
    },
    handleFetch(event: FetchEvent) {
      const request = event.request;
      const url = new URL(request.url);
      // Native sign-out submits a navigation POST. Hold publication until its
      // cookie-changing response finishes, then clear access even if redirect
      // following does not dispatch another fetch event. Never cache the response.
      if (request.method === "POST" && request.mode === "navigate" && scannerUrl(request.url)) {
        event.respondWith(serialized(() => nativeSignOut(request)).catch(() => Response.error()));
        return true;
      }
      if (
        request.method !== "GET" ||
        request.headers.has("rsc") ||
        request.headers.has("next-router-prefetch")
      )
        return false;
      // A native/no-JavaScript sign-out redirects here. Choosing a staff role also
      // relinquishes saved gate access and private snapshots, without touching queues.
      if (
        request.mode === "navigate" &&
        url.origin === host.location.origin &&
        url.pathname === "/staff" &&
        !url.search
      ) {
        event.respondWith(
          (async () => {
            try {
              await serialized(invalidate);
            } catch {
              /* Online sign-out remains available. */
            }
            try {
              return await fetcher(request);
            } catch {
              return fallback();
            }
          })(),
        );
        return true;
      }
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
