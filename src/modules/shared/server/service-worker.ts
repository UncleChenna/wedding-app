import "server-only";
import { installWorkerUpdateGuard } from "@/modules/checkin/browser/worker-update-guard";
import { createScannerShellStore } from "@/modules/checkin/browser/scanner-shell-store";
import { createScannerShellRuntime } from "@/modules/checkin/browser/scanner-shell-runtime";
import { installScannerShellWorker } from "@/modules/checkin/browser/scanner-shell-worker";
import { createGuestSnapshotStore } from "@/modules/checkin/browser/guest-snapshot-store";
import { createGuestSnapshotRuntime } from "@/modules/checkin/browser/guest-snapshot-runtime";
import { createOfflineQueuePolicy } from "@/modules/checkin/lib/offline-queue";
import { createOfflineQueueStore } from "@/modules/checkin/browser/offline-queue-store";
import { createOfflineQueueRuntime } from "@/modules/checkin/browser/offline-queue-runtime";
import { parseGuestSnapshot } from "@/modules/checkin/lib/guest-snapshot";

import { ownPassWorkerSource } from "@/modules/invitations/lib/offline-worker";

import {
  cachePolicy,
  SW_CACHE_PREFIX,
  SW_OFFLINE_CACHE,
  SW_OFFLINE_URL,
  SW_STATIC_CACHE,
} from "../lib/sw-policy";

/**
 * Source of /sw.js. Embeds the unit-tested `cachePolicy` verbatim so the browser runs the
 * exact rules in docs/pwa.md. No automatic skipWaiting: a new worker waits until every tab
 * using the old one closes (TICKET-111 adds the update prompt).
 */
export function serviceWorkerSource(
  scanner: { build: string; assets: readonly string[]; verifier?: string } | null = null,
): string {
  return `"use strict";
const SW_CACHE_PREFIX = ${JSON.stringify(SW_CACHE_PREFIX)};
const SW_STATIC_CACHE = ${JSON.stringify(SW_STATIC_CACHE)};
const SW_OFFLINE_CACHE = ${JSON.stringify(SW_OFFLINE_CACHE)};
const SW_OFFLINE_URL = ${JSON.stringify(SW_OFFLINE_URL)};
const cachePolicy = ${cachePolicy.toString()};

/** Same-origin, query-free build asset paths referenced by a page or stylesheet. */
const STATIC_ASSET = /^\\/_next\\/static\\/[\\w./-]+$/;
const OFFLINE_FONT = /^\\/offline-assets\\/(?:cormorant|inter|playfair|jost)-[a-f0-9]{16}\\.woff2$/;
function assetUrls(text, base) {
  const urls = new Set();
  for (const match of text.matchAll(/(?:src|href)="([^"]+)"|url\\(\\s*["']?([^"')\\s]+)/g)) {
    try {
      const url = new URL(match[1] || match[2], base);
      if (url.origin === self.location.origin && !url.search && (STATIC_ASSET.test(url.pathname) || OFFLINE_FONT.test(url.pathname))) {
        urls.add(url.pathname);
      }
    } catch {
      // Not a URL.
    }
  }
  return [...urls];
}

/** Best-effort: a missing asset leaves the offline page plainer, never uninstallable. */
async function precacheAsset(cache, path) {
  try {
    const response = await fetch(path);
    if (response.status !== 200) return;
    if (path.endsWith(".css")) {
      const css = await response.clone().text();
      const base = new URL(path, self.location.origin).href;
      await Promise.all(assetUrls(css, base).map((font) => precacheAsset(cache, font)));
    }
    await cache.put(path, response);
  } catch {
    // Offline or storage full: the asset is fetched normally next time.
  }
}

${ownPassWorkerSource()}

const createQueuePolicy = ${createOfflineQueuePolicy.toString()};
const createQueueStore = ${createOfflineQueueStore.toString()};
const installUpdateGuard = ${installWorkerUpdateGuard.toString()};
const updateGuard = installUpdateGuard(self, () => createQueueStore(createQueuePolicy()));

const scannerWorker = ${
    scanner
      ? `(() => {
  ${scanner.verifier ? `importScripts(${JSON.stringify(scanner.verifier)});` : ""}
  const createQueueRuntime = ${createOfflineQueueRuntime.toString()};
  const queuePolicy = createQueuePolicy();
  let queueStore;
  const getQueueStore = () => queueStore || (queueStore = createQueueStore(queuePolicy));
  const createStore = ${createScannerShellStore.toString()};
  const createRuntime = ${createScannerShellRuntime.toString()};
  const install = ${installScannerShellWorker.toString()};
  const parseGuestSnapshot = ${parseGuestSnapshot.toString()};
  const createGuestStore = ${createGuestSnapshotStore.toString()};
  const createGuestRuntime = ${createGuestSnapshotRuntime.toString()};
  let store;
  let runtime;
  let guestStore;
  const getGuestStore = () => guestStore || (guestStore = createGuestStore(parseGuestSnapshot));
  const getStore = () => store || (store = createStore());
  const getRuntime = () => runtime || (runtime = createRuntime({
    store: getStore(), storage: caches, fetcher: fetch.bind(self),
    origin: self.location.origin, build: ${JSON.stringify(scanner.build)}
  }));
  return install({ host: self, store: getStore, runtime: getRuntime,
    ${
      scanner.verifier
        ? `queue: { store: getQueueStore, runtime: (snapshot) => createQueueRuntime({
      policy: queuePolicy, store: getQueueStore(), snapshot,
      verify: async (qr, keys) => {
        const token = ScannerQueueCrypto.signedPassToken(qr, self.location.origin);
        return token ? ScannerQueueCrypto.verifyGatePass(token, keys, { now: Date.now() }) : { ok: false, reason: "malformed" };
      },
      decide: ScannerQueueCrypto.decideAdmission, fetcher: fetch.bind(self), origin: self.location.origin
    }) },`
        : ""
    }
    guests: { store: getGuestStore, runtime: (authority, denied) => createGuestRuntime({
      store: getGuestStore(), authority, denied, parse: parseGuestSnapshot,
      fetcher: fetch.bind(self), origin: self.location.origin
    }) },
    storage: caches, fetcher: fetch.bind(self), build: ${JSON.stringify(scanner.build)},
    assets: ${JSON.stringify(scanner.assets)},
    fallback: async () => {
      try { return await (await caches.open(SW_OFFLINE_CACHE)).match(SW_OFFLINE_URL) || Response.error(); }
      catch { return Response.error(); }
    }
  });
})()`
      : "null"
  };

self.addEventListener("install", (event) => {
  // The offline page itself is required; its build assets are best-effort.
  // (Scanner shell: TICKET-108.)
  event.waitUntil(
    (async () => {
      const response = await fetch(SW_OFFLINE_URL, { cache: "reload" });
      if (response.status !== 200) throw new Error("offline page unavailable");
      const html = await response.clone().text();
      await (await caches.open(SW_OFFLINE_CACHE)).put(SW_OFFLINE_URL, response);
      const statics = await caches.open(SW_STATIC_CACHE);
      await Promise.all(
        assetUrls(html, self.location.origin).map((path) => precacheAsset(statics, path)),
      );
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    updateGuard.cleanUp(async () => {
      if (scannerWorker) await scannerWorker.activateUnderLock();
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) =>
              name.startsWith(SW_CACHE_PREFIX) &&
              name !== SW_STATIC_CACHE &&
              name !== SW_OFFLINE_CACHE &&
              name !== OWN_PASS_CACHE &&
              name !== "wedding-scanner-queue-identity-v1" &&
              name !== scannerWorker?.cacheName,
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (scannerWorker?.handleFetch(event)) return;
  const request = event.request;
  if (request.method === "GET" && request.mode === "navigate" && ownPassPath(request.url) && !request.headers.has("rsc") && !request.headers.has("next-router-prefetch")) {
    event.respondWith(ownPassNavigation(request));
    return;
  }
  const policy = cachePolicy({
    method: request.method,
    url: request.url,
    origin: self.location.origin,
    headers: request.headers,
    mode: request.mode,
  });
  if (policy === "network-offline-fallback") {
    event.respondWith(
      fetch(request).catch(async () => {
        try {
          const page = await (await caches.open(SW_OFFLINE_CACHE)).match(SW_OFFLINE_URL);
          if (page) return page;
        } catch {
          // Cache Storage unavailable: fall through to the browser's own error.
        }
        return Response.error();
      }),
    );
    return;
  }
  if (policy !== "cache-first") return; // network-only: the browser handles it untouched
  event.respondWith(
    (async () => {
      // Caching is best-effort: storage errors must never fail the page's request.
      try {
        const cached = await (await caches.open(SW_STATIC_CACHE)).match(request);
        if (cached) return cached;
      } catch {
        // Cache Storage unavailable (private mode, quota, eviction): use the network.
      }
      const response = await fetch(request);
      // Only complete responses: 206 partial (range) responses cannot be stored.
      if (response.status === 200 && response.type === "basic" && !response.redirected) {
        const copy = response.clone();
        event.waitUntil(
          caches
            .open(SW_STATIC_CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => undefined),
        );
      }
      return response;
    })(),
  );
});
`;
}
