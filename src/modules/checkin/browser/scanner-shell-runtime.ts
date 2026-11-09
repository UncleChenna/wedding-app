import type { createScannerShellStore } from "./scanner-shell-store";

type Store = Pick<
  ReturnType<typeof createScannerShellStore>,
  "accepts" | "begin" | "authorize" | "discard" | "commit" | "current"
>;
interface AssetCache {
  put(path: string, response: Response): Promise<void>;
  match(path: string): Promise<Response | undefined>;
}
interface Options {
  store: Store;
  storage: { open(name: string): Promise<AssetCache> };
  fetcher: (url: string, options?: RequestInit) => Promise<Response>;
  origin: string;
  build: string;
}

/** Self-contained so the generated worker embeds exactly the tested implementation. */
export function createScannerShellRuntime({ store, storage, fetcher, origin, build }: Options) {
  const cacheName = "wedding-scanner-assets-v1-" + build;
  const complete = (response: Response) =>
    response.status === 200 &&
    !response.redirected &&
    response.type !== "opaque" &&
    response.type !== "opaqueredirect";
  async function boundedFetch(url: string, options: RequestInit, deadline: number) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await fetcher(url, { ...options, signal: controller.signal });
          if (!complete(response)) return response;
          // Consume the network body while the abort deadline is still active, so later
          // JSON parsing/cache.put cannot hold the publication lock on a stalled stream.
          const body = await response.arrayBuffer();
          return new Response(body, { status: response.status, headers: response.headers });
        })(),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(
            () => {
              controller.abort();
              reject(new Error("Scanner preparation timed out"));
            },
            Math.max(0, deadline - Date.now()),
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  async function deny(generation: string) {
    try {
      return (await store.discard(generation))
        ? { state: "denied" as const }
        : { state: "unavailable" as const };
    } catch {
      return { state: "denial-storage-failed" as const };
    }
  }
  async function authorization(deadline: number) {
    const generation = await store.begin();
    const response = await boundedFetch(
      new URL("/checkin/offline-shell", origin).href,
      {
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
      },
      deadline,
    );
    if (
      [401, 403, 404, 410].includes(response.status) ||
      (response.status === 200 && response.headers.get("X-Wedding-Scanner-Shell") !== "1")
    ) {
      return deny(generation);
    }
    if (!complete(response)) return { state: "unavailable" as const };
    const grant: unknown = await response.json();
    if (!store.accepts(grant)) return { state: "unavailable" as const };
    if (grant.expiresAt <= Date.now()) return deny(generation);
    // New authorization must replace older state even if this worker cannot use the build.
    if (!(await store.authorize(generation, grant.session, grant.expiresAt)))
      return { state: "unavailable" as const };
    return { state: "authorized" as const, generation, grant };
  }
  async function usableGrant() {
    const grant = await store.current();
    if (!grant || grant.build !== build || grant.expiresAt <= Date.now()) return null;
    const cache = await storage.open(cacheName);
    for (const path of grant.assets) if (!(await cache.match(path))) return null;
    const latest = await store.current();
    if (
      !latest ||
      JSON.stringify(latest) !== JSON.stringify(grant) ||
      latest.expiresAt <= Date.now()
    )
      return null;
    return latest;
  }
  return {
    async revalidate() {
      try {
        const result = await authorization(Date.now() + 10_000);
        return { state: result.state };
      } catch {
        return { state: "unavailable" as const };
      }
    },
    async status() {
      try {
        const grant = await usableGrant();
        return grant
          ? {
              state: "ready" as const,
              session: grant.session,
              build: grant.build,
              expiresAt: grant.expiresAt,
            }
          : { state: "unavailable" as const };
      } catch {
        return { state: "unavailable" as const };
      }
    },
    async prepare() {
      try {
        const deadline = Date.now() + 10_000;
        const authorizationResult = await authorization(deadline);
        if (authorizationResult.state !== "authorized") return authorizationResult;
        const { generation, grant } = authorizationResult;
        if (grant.build !== build) return { state: "unavailable" as const };
        const cache = await storage.open(cacheName);
        for (const path of grant.assets) {
          const asset = await boundedFetch(
            new URL(path, origin).href,
            {
              credentials: "same-origin",
              cache: "reload",
              redirect: "error",
            },
            deadline,
          );
          if (!complete(asset)) return { state: "unavailable" as const };
          const mime = asset.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase() ?? "";
          const expected = path.endsWith(".js")
            ? /^(text|application)\/javascript$/
            : path.endsWith(".css")
              ? /^text\/css$/
              : /^(font\/|application\/(font-|x-font-|octet-stream))/;
          if (!expected.test(mime)) return { state: "unavailable" as const };
          await cache.put(path, asset);
        }
        // Cache writes can be evicted even before publication. Read back every required asset.
        for (const path of grant.assets)
          if (!(await cache.match(path))) return { state: "unavailable" as const };
        if (!(await store.commit(generation, grant))) return { state: "unavailable" as const };
        return { state: "ready" as const, expiresAt: grant.expiresAt };
      } catch {
        return { state: "unavailable" as const };
      }
    },
    async document(): Promise<Response | null> {
      try {
        const latest = await usableGrant();
        if (!latest) return null;
        return new Response(latest.html, { headers: latest.headers });
      } catch {
        return null;
      }
    },
  };
}
