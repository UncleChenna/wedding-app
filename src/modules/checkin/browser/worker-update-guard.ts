import type { createOfflineQueueStore } from "./offline-queue-store";

type Store = Pick<ReturnType<typeof createOfflineQueueStore>, "read">;
interface Host {
  location: { origin: string };
  navigator?: { locks?: { request<T>(name: string, operation: () => Promise<T>): Promise<T> } };
  clients: {
    get(id: string): Promise<{ url: string } | undefined>;
    matchAll(options: {
      type: "window";
      includeUncontrolled: boolean;
    }): Promise<readonly { postMessage(value: unknown): void }[]>;
  };
  skipWaiting(): Promise<void>;
  addEventListener(
    type: "message",
    listener: (event: {
      data: unknown;
      source: { id?: string } | null;
      ports: readonly { postMessage(value: unknown): void }[];
      waitUntil(promise: Promise<unknown>): void;
    }) => void,
  ): void;
}

/** Embedded verbatim in every worker. No credentials or event identities leave the journal. */
export function installWorkerUpdateGuard(host: Host, store: () => Store) {
  function serialized<T>(operation: () => Promise<T>): Promise<T> {
    if (!host.navigator?.locks) return Promise.reject(new Error("Update coordination unavailable"));
    return host.navigator.locks.request("wedding-scanner-shell-publication-v1", operation);
  }
  async function status() {
    const journal = await store().read();
    return journal.attempts.length
      ? { state: "deferred" as const, pending: journal.attempts.length }
      : { state: "ready" as const, pending: 0 };
  }
  host.addEventListener("message", (event) => {
    const data = event.data;
    if (
      !data ||
      typeof data !== "object" ||
      !("type" in data) ||
      (data.type !== "WORKER_UPDATE_STATUS" && data.type !== "ACTIVATE_WORKER_UPDATE")
    )
      return;
    event.waitUntil(
      (async () => {
        const client = event.source?.id ? await host.clients.get(event.source.id) : undefined;
        if (!client || new URL(client.url).origin !== host.location.origin) return;
        let activation: Promise<void> | undefined;
        const result = await serialized(async () => {
          const current = await status();
          // Never trust a caller's claimed pending count or compatibility override.
          if (data.type === "ACTIVATE_WORKER_UPDATE" && current.state === "ready")
            activation = host.skipWaiting();
          return current;
        });
        event.ports[0]?.postMessage(result);
        const clients = await host.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const tab of clients) tab.postMessage({ type: "WORKER_UPDATE_STATE", ...result });
        // Activation itself takes the same lock. Awaiting it inside serialized() deadlocks.
        await activation;
      })().catch(() => event.ports[0]?.postMessage({ state: "unavailable" })),
    );
  });
  return {
    /** Natural activation after all tabs close is allowed only to inspect compatible evidence.
     * A future/invalid journal must not trigger cache deletion or private-store invalidation.
     */
    async cleanUp(operation: () => Promise<void>) {
      try {
        await serialized(async () => {
          await store().read();
          await operation();
        });
        return true;
      } catch {
        return false;
      }
    },
  };
}
