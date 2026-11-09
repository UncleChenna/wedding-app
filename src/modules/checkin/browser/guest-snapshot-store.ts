import type { GuestSnapshot } from "../lib/guest-snapshot";

export interface SnapshotAuthority {
  session: string;
  expiresAt: number;
}
type SnapshotState = { generation: string; snapshot: GuestSnapshot | null };

/**
 * Worker-owned private data, separate from admission queues. Callers must first
 * validate the live shell authority under its origin-wide publication lock.
 * Self-contained for embedding the exact implementation in the service worker.
 */
export function createGuestSnapshotStore(
  parse: (value: unknown) => GuestSnapshot | null,
  factory: Pick<IDBFactory, "open"> = indexedDB,
) {
  const fresh = (): SnapshotState => ({ generation: crypto.randomUUID(), snapshot: null });
  const validAuthority = (authority: SnapshotAuthority, now: number) =>
    /^[a-f0-9]{64}$/.test(authority.session) &&
    Number.isSafeInteger(authority.expiresAt) &&
    Number.isFinite(now) &&
    authority.expiresAt > now;
  function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = factory.open("wedding-scanner-guests-v1", 1);
      let blocked = false;
      request.onupgradeneeded = () => request.result.createObjectStore("snapshot");
      request.onerror = () => reject(request.error ?? new Error("Guest storage unavailable"));
      request.onblocked = () => {
        blocked = true;
        reject(new Error("Guest storage blocked"));
      };
      request.onsuccess = () => {
        if (blocked) request.result.close();
        else resolve(request.result);
      };
    });
  }
  async function update<T>(operation: (state: SnapshotState) => T, now?: number): Promise<T> {
    const db = await open();
    return new Promise((resolve, reject) => {
      let transaction: IDBTransaction;
      let store: IDBObjectStore;
      try {
        transaction = db.transaction("snapshot", "readwrite");
        store = transaction.objectStore("snapshot");
      } catch (error) {
        db.close();
        reject(error);
        return;
      }
      let result: T;
      transaction.oncomplete = () => {
        db.close();
        resolve(result);
      };
      transaction.onabort = transaction.onerror = () => {
        db.close();
        reject(transaction.error ?? new Error("Guest storage unavailable"));
      };
      const request = store.get("current");
      request.onsuccess = () => {
        try {
          const raw: unknown = request.result;
          let state = fresh();
          if (
            typeof raw === "object" &&
            raw !== null &&
            "generation" in raw &&
            typeof raw.generation === "string" &&
            /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(raw.generation) &&
            "snapshot" in raw
          ) {
            const snapshot = raw.snapshot === null ? null : parse(raw.snapshot);
            if (raw.snapshot === null || snapshot) state = { generation: raw.generation, snapshot };
          }
          const checkedAt = now ?? Date.now();
          if (
            !Number.isFinite(checkedAt) ||
            (state.snapshot && state.snapshot.expiresAt <= checkedAt)
          )
            state = fresh();
          result = operation(state);
          store.put(state, "current");
        } catch (error) {
          transaction.abort();
          reject(error);
        }
      };
    });
  }
  return {
    authorize: (generation: string, authority: SnapshotAuthority) =>
      update((state) => {
        if (
          state.generation !== generation ||
          !/^[a-f0-9]{64}$/.test(authority.session) ||
          !Number.isSafeInteger(authority.expiresAt)
        )
          return false;
        if (!validAuthority(authority, Date.now())) {
          state.generation = crypto.randomUUID();
          state.snapshot = null;
          return false;
        }
        if (state.snapshot && state.snapshot.session !== authority.session) state.snapshot = null;
        if (state.snapshot && state.snapshot.expiresAt > authority.expiresAt)
          state.snapshot = { ...state.snapshot, expiresAt: authority.expiresAt };
        return true;
      }),
    begin: () =>
      update((state) => {
        state.generation = crypto.randomUUID();
        return state.generation;
      }),
    invalidate: () =>
      update((state) => {
        state.generation = crypto.randomUUID();
        state.snapshot = null;
      }),
    current: async (authority: SnapshotAuthority, now?: number) => {
      const snapshot = await update((state) => {
        if (
          !validAuthority(authority, now ?? Date.now()) ||
          (state.snapshot && state.snapshot.session !== authority.session)
        ) {
          state.generation = crypto.randomUUID();
          state.snapshot = null;
          return null;
        }
        if (state.snapshot && state.snapshot.expiresAt > authority.expiresAt) {
          state.snapshot = { ...state.snapshot, expiresAt: authority.expiresAt };
        }
        return state.snapshot;
      }, now);
      if (snapshot && snapshot.expiresAt <= (now ?? Date.now())) {
        await update(() => undefined, now);
        return null;
      }
      return snapshot;
    },
    commit: async (generation: string, input: GuestSnapshot, authority: SnapshotAuthority) => {
      const snapshot = parse(input);
      if (
        !snapshot ||
        !validAuthority(authority, Date.now()) ||
        snapshot.session !== authority.session ||
        snapshot.generatedAt > Date.now() + 600_000
      )
        return false;
      const bounded = { ...snapshot, expiresAt: Math.min(snapshot.expiresAt, authority.expiresAt) };
      if (bounded.expiresAt <= Date.now() || bounded.expiresAt <= bounded.generatedAt) return false;
      const saved = await update((state) => {
        if (state.generation !== generation || bounded.expiresAt <= Date.now()) return false;
        state.snapshot = bounded;
        state.generation = crypto.randomUUID();
        return true;
      });
      if (saved && bounded.expiresAt <= Date.now()) {
        await update(() => undefined);
        return false;
      }
      return saved;
    },
  };
}
