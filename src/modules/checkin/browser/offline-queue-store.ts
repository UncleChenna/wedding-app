import type {
  createOfflineQueuePolicy,
  OfflineActor,
  OfflineAllowance,
  OfflineAttempt,
  OfflineQueueState,
} from "../lib/offline-queue";

type Policy = ReturnType<typeof createOfflineQueuePolicy>;

/** Self-contained worker store. Call under the shared scanner lock; never erase pending evidence. */
export function createOfflineQueueStore(
  policy: Policy,
  factory: Pick<IDBFactory, "open"> = indexedDB,
) {
  function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = factory.open("wedding-scanner-attempts-v1", 1);
      let blocked = false;
      request.onupgradeneeded = () => request.result.createObjectStore("journal");
      request.onerror = () => reject(request.error ?? new Error("Offline evidence unavailable"));
      request.onblocked = () => {
        blocked = true;
        reject(new Error("Offline evidence blocked"));
      };
      request.onsuccess = () => {
        if (blocked) request.result.close();
        else resolve(request.result);
      };
    });
  }
  async function checkedOpen(): Promise<IDBDatabase> {
    // Independent storage namespaces let us detect partial eviction instead of
    // treating lost local admissions as a fresh, empty allowance.
    if (!navigator.locks) throw new Error("Offline evidence coordination unavailable");
    return navigator.locks.request("wedding-scanner-queue-identity-v1", async () => {
      const db = await open();
      try {
        const identity = await new Promise<{ id: unknown; current: unknown }>((resolve, reject) => {
          const tx = db.transaction("journal", "readonly"),
            store = tx.objectStore("journal");
          const id = store.get("identity"),
            current = store.get("current");
          tx.oncomplete = () => resolve({ id: id.result, current: current.result });
          tx.onabort = tx.onerror = () =>
            reject(tx.error ?? new Error("Offline evidence unavailable"));
        });
        const cache = await caches.open("wedding-scanner-queue-identity-v1");
        const key = new URL("/offline-queue-identity", location.origin).href;
        const marker = await cache.match(key);
        const saved = marker ? await marker.text() : null;
        const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
        if (identity.id !== undefined) {
          if (
            typeof identity.id !== "string" ||
            !uuid.test(identity.id) ||
            !policy.parse(identity.current) ||
            (saved !== null && saved !== identity.id)
          )
            throw new Error("Offline evidence needs recovery");
          if (saved === null) await cache.put(key, new Response(identity.id));
        } else {
          if (saved !== null || (identity.current !== undefined && !policy.parse(identity.current)))
            throw new Error("Offline evidence needs recovery");
          const id = crypto.randomUUID();
          // Publish the marker first. An interrupted initialization fails closed
          // rather than claiming an erased journal had no pending admissions.
          await cache.put(key, new Response(id));
          await new Promise<void>((resolve, reject) => {
            const tx = db.transaction("journal", "readwrite", { durability: "strict" });
            const store = tx.objectStore("journal");
            try {
              store.put(id, "identity");
              store.put(identity.current ?? policy.empty(), "current");
            } catch (error) {
              tx.abort();
              reject(error);
              return;
            }
            tx.oncomplete = () => resolve();
            tx.onabort = tx.onerror = () =>
              reject(tx.error ?? new Error("Offline evidence unavailable"));
          });
        }
        return db;
      } catch (error) {
        db.close();
        throw error;
      }
    });
  }
  async function transaction<T>(
    write: boolean,
    operation: (state: OfflineQueueState) => T,
  ): Promise<T> {
    const db = await checkedOpen();
    return new Promise((resolve, reject) => {
      let tx: IDBTransaction;
      try {
        tx = db.transaction("journal", write ? "readwrite" : "readonly", { durability: "strict" });
      } catch (error) {
        db.close();
        reject(error);
        return;
      }
      let result: T;
      tx.oncomplete = () => {
        db.close();
        resolve(result);
      };
      tx.onabort = tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error("Offline evidence could not be saved"));
      };
      const store = tx.objectStore("journal");
      const request = store.get("current");
      request.onsuccess = () => {
        try {
          const raw: unknown = request.result;
          const state = policy.parse(raw);
          // Corruption must never be "recovered" by replacing unsynced evidence with an empty list.
          if (!state) throw new Error("Offline evidence needs recovery");
          result = operation(state);
          if (write) store.put(state, "current");
        } catch (error) {
          tx.abort();
          reject(error);
        }
      };
    });
  }
  return {
    read: () => transaction(false, (state) => state),
    // Expiry/logout can remove only receipts already acknowledged by the server.
    // Pending/rejected attempts and conservative refresh barriers are never discarded here.
    purgeAcknowledged: () =>
      transaction(true, (state) => {
        const count = state.receipts.length;
        state.receipts = [];
        return count;
      }),
    record: (attempt: OfflineAttempt, allowance: OfflineAllowance) =>
      transaction(true, (state) => policy.record(state, attempt, allowance)),
    acknowledge: (actor: OfflineActor, acks: readonly unknown[], generation: string) =>
      transaction(true, (state) => policy.acknowledge(state, actor, acks, generation)),
    clearCapturedBarriers: (captured: OfflineQueueState["barriers"]) =>
      transaction(true, (state) => policy.clearCapturedBarriers(state, captured)),
    clearBarrier: (actor: OfflineActor, generation: string) =>
      transaction(true, (state) => policy.clearBarrier(state, actor, generation)),
  };
}
