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
  return {
    async prepare() {
      try {
        const generation = await store.begin();
        const response = await fetcher(new URL("/checkin/offline-shell", origin).href, {
          credentials: "same-origin",
          cache: "no-store",
          redirect: "error",
        });
        if (
          [401, 403, 404, 410].includes(response.status) ||
          (response.status === 200 && response.headers.get("X-Wedding-Scanner-Shell") !== "1")
        ) {
          await store.discard(generation);
          return { state: "denied" as const };
        }
        if (!complete(response)) return { state: "unavailable" as const };
        const grant: unknown = await response.json();
        if (!store.accepts(grant) || grant.build !== build || grant.expiresAt <= Date.now())
          return { state: "unavailable" as const };
        if (!(await store.authorize(generation, grant.session)))
          return { state: "unavailable" as const };
        const cache = await storage.open(cacheName);
        for (const path of grant.assets) {
          const asset = await fetcher(new URL(path, origin).href, {
            credentials: "same-origin",
            cache: "reload",
            redirect: "error",
          });
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
        const grant = await store.current();
        if (!grant || grant.build !== build || grant.expiresAt <= Date.now()) return null;
        const cache = await storage.open(cacheName);
        for (const path of grant.assets) if (!(await cache.match(path))) return null;
        const latest = await store.current();
        if (
          !latest ||
          latest.session !== grant.session ||
          latest.build !== grant.build ||
          JSON.stringify(latest) !== JSON.stringify(grant) ||
          latest.expiresAt <= Date.now()
        )
          return null;
        return new Response(latest.html, { headers: latest.headers });
      } catch {
        return null;
      }
    },
  };
}
