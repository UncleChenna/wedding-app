import type { GuestSnapshot } from "../lib/guest-snapshot";
import type { createGuestSnapshotStore, SnapshotAuthority } from "./guest-snapshot-store";

/** Caller holds the existing shell publication Web Lock for the entire operation. */
export function createGuestSnapshotRuntime(options: {
  store: ReturnType<typeof createGuestSnapshotStore>;
  authority: () => Promise<SnapshotAuthority | null>;
  denied: () => Promise<void>;
  parse: (value: unknown) => GuestSnapshot | null;
  fetcher: (url: string, init: RequestInit) => Promise<Response>;
  origin: string;
}) {
  const active = (authority: SnapshotAuthority | null): authority is SnapshotAuthority =>
    authority !== null &&
    /^[a-f0-9]{64}$/.test(authority.session) &&
    Number.isSafeInteger(authority.expiresAt) &&
    authority.expiresAt > Date.now();
  return {
    read: async (expectedSession: string): Promise<GuestSnapshot | null> => {
      const authority = await options.authority();
      // A stale window cannot read or erase the replacement session's private cache.
      if (!active(authority) || authority.session !== expectedSession) return null;
      return options.store.current(authority);
    },
    refresh: async (): Promise<{ state: "ready" | "unavailable" | "denied" }> => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const controller = new AbortController();
      try {
        const authority = await options.authority();
        if (!active(authority)) return { state: "unavailable" };
        const generation = await options.store.begin();
        const deadline = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("Snapshot request timed out"));
          }, 10_000);
        });
        const response = await Promise.race([
          options.fetcher(options.origin + "/api/checkin/guest-snapshot", {
            credentials: "same-origin",
            cache: "no-store",
            redirect: "error",
            signal: controller.signal,
          }),
          deadline,
        ]);
        if (response.status === 401 || response.status === 403) {
          await options.denied();
          return { state: "denied" };
        }
        if (
          !response.ok ||
          response.headers.get("X-Wedding-Guest-Snapshot") !== "1" ||
          !response.headers.get("Content-Type")?.startsWith("application/json")
        )
          return { state: "unavailable" };
        // A streaming limit bounds both the lock duration and decoded response memory.
        const readBody = async () => {
          if (!response.body) throw new Error("Snapshot body missing");
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let length = 0;
          try {
            for (;;) {
              const part = await Promise.race([reader.read(), deadline]);
              if (part.done) break;
              length += part.value.byteLength;
              if (length > 2_097_152) throw new Error("Snapshot body too large");
              chunks.push(part.value);
            }
            const bytes = new Uint8Array(length);
            let offset = 0;
            for (const chunk of chunks) {
              bytes.set(chunk, offset);
              offset += chunk.byteLength;
            }
            return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
          } finally {
            void reader.cancel().catch(() => {});
          }
        };
        const snapshot = options.parse(await Promise.race([readBody(), deadline]));
        if (!snapshot || snapshot.session !== authority.session) return { state: "unavailable" };
        const current = await options.authority();
        if (!active(current) || current.session !== authority.session)
          return { state: "unavailable" };
        if (snapshot.expiresAt < authority.expiresAt) {
          // The old shell embeds its previous deadline. Never keep its camera
          // authority after the live endpoint reveals a shorter session policy.
          if (!(await options.store.discard(generation))) return { state: "unavailable" };
          await options.denied();
          return { state: "denied" };
        }
        const boundedAuthority = {
          session: current.session,
          expiresAt: Math.min(authority.expiresAt, current.expiresAt, snapshot.expiresAt),
        };
        if (!(await options.store.authorize(generation, boundedAuthority)))
          return { state: "unavailable" };
        return {
          state: (await options.store.commit(generation, snapshot, boundedAuthority))
            ? "ready"
            : "unavailable",
        };
      } catch {
        return { state: "unavailable" };
      } finally {
        if (timer !== undefined) clearTimeout(timer);
        controller.abort();
      }
    },
  };
}
