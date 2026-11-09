/** The minimal document is issued by the authorized server, never supplied by a window message. */
export interface ScannerShellGrant {
  version: 1;
  session: string;
  build: string;
  expiresAt: number;
  preparedAt: number;
  html: string;
  headers: [string, string][];
  assets: string[];
}
type ShellState = { generation: string; grant: ScannerShellGrant | null };

/**
 * Separate from guest snapshots and unsynced events. All read/compare/write operations
 * use one IndexedDB transaction, including across simultaneously active workers.
 * Keep the implementation self-contained so the worker can embed this exact code.
 */
export function createScannerShellStore(factory: Pick<IDBFactory, "open"> = indexedDB) {
  const fresh = (): ShellState => ({ generation: crypto.randomUUID(), grant: null });
  const asset = (value: unknown): value is string =>
    typeof value === "string" &&
    !value.includes("..") &&
    (/^\/scanner-assets\/scanner-[a-f0-9]{64}\.js$/.test(value) ||
      /^\/_next\/static\/[A-Za-z0-9_./-]+\.(css|woff2?|ttf)$/.test(value));
  function validGrant(value: unknown): value is ScannerShellGrant {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Partial<ScannerShellGrant>;
    const fields = [
      "version",
      "session",
      "build",
      "expiresAt",
      "preparedAt",
      "html",
      "headers",
      "assets",
    ];
    return (
      Object.keys(candidate).every((key) => fields.includes(key)) &&
      candidate.version === 1 &&
      typeof candidate.session === "string" &&
      /^[a-f0-9]{64}$/.test(candidate.session) &&
      typeof candidate.build === "string" &&
      /^[a-f0-9]{64}$/.test(candidate.build) &&
      Number.isSafeInteger(candidate.expiresAt) &&
      Number.isSafeInteger(candidate.preparedAt) &&
      typeof candidate.preparedAt === "number" &&
      candidate.preparedAt > 0 &&
      typeof candidate.expiresAt === "number" &&
      candidate.expiresAt > candidate.preparedAt &&
      typeof candidate.html === "string" &&
      candidate.html.length > 0 &&
      candidate.html.length <= 131_072 &&
      Array.isArray(candidate.assets) &&
      candidate.assets.length > 0 &&
      candidate.assets.length <= 200 &&
      candidate.assets.every(asset) &&
      Array.isArray(candidate.headers) &&
      candidate.headers.length <= 12 &&
      candidate.headers.every(
        (header) =>
          Array.isArray(header) &&
          header.length === 2 &&
          typeof header[0] === "string" &&
          typeof header[1] === "string" &&
          [
            "content-type",
            "content-security-policy",
            "permissions-policy",
            "cache-control",
            "referrer-policy",
          ].includes(header[0].toLowerCase()) &&
          header[1].length <= 16_384 &&
          !/[\r\n]/.test(header[1]),
      )
    );
  }
  function validState(value: unknown): value is ShellState {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Partial<ShellState>;
    return (
      typeof candidate.generation === "string" &&
      /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(candidate.generation) &&
      (candidate.grant === null || validGrant(candidate.grant))
    );
  }
  function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = factory.open("wedding-scanner-shell-v1", 1);
      let blocked = false;
      request.onupgradeneeded = () => request.result.createObjectStore("authorization");
      request.onerror = () => reject(request.error ?? new Error("Scanner storage unavailable"));
      request.onblocked = () => {
        blocked = true;
        reject(new Error("Scanner storage blocked"));
      };
      request.onsuccess = () => {
        if (blocked) request.result.close();
        else resolve(request.result);
      };
    });
  }
  async function update<T>(operation: (state: ShellState) => T, now?: number): Promise<T> {
    const db = await open();
    return new Promise<T>((resolve, reject) => {
      let transaction: IDBTransaction;
      let store: IDBObjectStore;
      try {
        transaction = db.transaction("authorization", "readwrite");
        store = transaction.objectStore("authorization");
      } catch (error) {
        db.close();
        reject(error);
        return;
      }
      const request = store.get("current");
      let result: T;
      transaction.oncomplete = () => {
        db.close();
        resolve(result);
      };
      transaction.onabort = transaction.onerror = () => {
        db.close();
        reject(transaction.error ?? new Error("Scanner storage unavailable"));
      };
      request.onsuccess = () => {
        try {
          let state = validState(request.result) ? request.result : fresh();
          const checkedAt = now ?? Date.now();
          if (!Number.isFinite(checkedAt) || (state.grant && state.grant.expiresAt <= checkedAt))
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
    accepts: validGrant,
    // A newer preparation invalidates older in-flight writes but keeps a usable old copy.
    begin: () =>
      update((state) => {
        state.generation = crypto.randomUUID();
        return state.generation;
      }),
    // Call only with the fingerprint returned by the independent authorized server request.
    // Clear a replaced session before downloading assets, but never let an older response
    // invalidate a newer preparation. A failed same-session refresh can retain its old copy.
    authorize: (generation: string, session: string, expiresAt: number) =>
      update((state) => {
        if (
          state.generation !== generation ||
          !/^[a-f0-9]{64}$/.test(session) ||
          !Number.isSafeInteger(expiresAt) ||
          expiresAt <= 0
        )
          return false;
        if (expiresAt <= Date.now()) {
          state.generation = crypto.randomUUID();
          state.grant = null;
          return false;
        }
        // Discard rather than merely clamp metadata: the old HTML may embed its later deadline.
        if (state.grant && (state.grant.session !== session || state.grant.expiresAt > expiresAt))
          state.grant = null;
        return true;
      }),
    discard: (generation: string) =>
      update((state) => {
        if (state.generation !== generation) return false;
        state.generation = crypto.randomUUID();
        state.grant = null;
        return true;
      }),
    current: async (now?: number) => {
      const grant = await update((state) => state.grant, now);
      if (grant && grant.expiresAt <= (now ?? Date.now())) {
        // A deadline may pass between the read and transaction completion.
        await update(() => undefined, now);
        return null;
      }
      return grant;
    },
    invalidate: () =>
      update((state) => {
        state.generation = crypto.randomUUID();
        state.grant = null;
      }),
    commit: async (generation: string, grant: ScannerShellGrant) => {
      if (!validGrant(grant) || grant.expiresAt <= Date.now()) return false;
      const saved = await update((state) => {
        if (state.generation !== generation || grant.expiresAt <= Date.now()) return false;
        state.grant = grant;
        // A preparation token can publish once; retries must authorize a fresh preparation.
        state.generation = crypto.randomUUID();
        return true;
      });
      if (saved && grant.expiresAt <= Date.now()) {
        await update(() => undefined);
        return false;
      }
      return saved;
    },
  };
}
