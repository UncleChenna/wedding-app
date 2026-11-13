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
      const request = factory.open("wedding-scanner-attempts-v1");
      let blocked = false;
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("journal"))
          request.result.createObjectStore("journal");
      };
      request.onerror = () => reject(request.error ?? new Error("Offline evidence unavailable"));
      request.onblocked = () => {
        blocked = true;
        reject(new Error("Offline evidence blocked"));
      };
      request.onsuccess = () => {
        if (blocked) request.result.close();
        else {
          request.result.onversionchange = () => request.result.close();
          resolve(request.result);
        }
      };
    });
  }
  async function transaction<T>(
    write: boolean,
    operation: (state: OfflineQueueState) => T,
  ): Promise<T> {
    const db = await open();
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
          const state = raw === undefined ? policy.empty() : policy.parse(raw);
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
