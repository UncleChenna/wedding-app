import "server-only";

/** Run before app chunks: a stale worker can prevent React itself from starting.
 * Retire only this app's root worker. Do not clear Cache Storage or IndexedDB;
 * they may contain an offline pass or unsynced check-in evidence.
 */
export const developmentWorkerBootstrap = `(() => {
  if (!("serviceWorker" in navigator)) return;
  const workers = navigator.serviceWorker;
  const owned = (worker) => {
    if (!worker) return false;
    try {
      const url = new URL(worker.scriptURL);
      return url.origin === location.origin && url.pathname === "/sw.js";
    } catch { return false; }
  };
  const reloadKey = "wedding-development-worker-reload";
  const reloadOnce = () => {
    try {
      if (sessionStorage.getItem(reloadKey)) return;
      sessionStorage.setItem(reloadKey, "1");
      location.reload();
    } catch { /* Storage denied: unregister still works; the next manual reload recovers. */ }
  };
  if (!owned(workers.controller)) {
    try { sessionStorage.removeItem(reloadKey); } catch {}
  }
  workers.getRegistration("/").then(async (registration) => {
    if (!registration) {
      if (owned(workers.controller)) reloadOnce();
      return;
    }
    if (registration.scope !== location.origin + "/") return;
    const current = [registration.active, registration.waiting, registration.installing].filter(Boolean);
    if (!current.length || !current.every(owned)) return;
    if (await registration.unregister()) {
      if (owned(workers.controller)) reloadOnce();
    }
  }).catch(() => {});
})();`;

/** Never install the production cache-first worker from a development server. */
export function developmentWorkerResponse(): Response {
  return new Response('"use strict";\n// Development: all requests use the network.\n', {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
