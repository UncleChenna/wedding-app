/** Separate private store: never put invitation documents or mutation responses here. */
export const OWN_PASS_CACHE = "wedding-own-pass-v1";

/** Injected into /sw.js; uses the existing public asset precache helper. */
export function ownPassWorkerSource(): string {
  return `
const OWN_PASS_CACHE = ${JSON.stringify(OWN_PASS_CACHE)};
function ownPassPath(raw) {
  try {
    const url = new URL(raw, self.location.origin);
    return url.origin === self.location.origin && !url.search && /^\\/i\\/[A-Za-z0-9_-]{22,128}$/.test(url.pathname) ? url.pathname : null;
  } catch { return null; }
}
const invalidOwnPasses = new Set();
async function eraseOwnPass(path) {
  invalidOwnPasses.add(path);
  const cache = await caches.open(OWN_PASS_CACHE);
  try { await cache.delete(path); }
  catch {
    // If deletion alone fails, replace the private payload with an empty durable tombstone.
    await cache.put(path,new Response("",{status:410}));
  }
}
const ownPassLocks = new Map();
async function ownPassQueue(path, operation) {
  const previous = ownPassLocks.get(path) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  ownPassLocks.set(path,current);
  await previous;
  try { return await operation(); }
  finally { release(); if (ownPassLocks.get(path) === current) ownPassLocks.delete(path); }
}
function refreshOwnPass(path, appearance) {
  return ownPassQueue(path,() => refreshOwnPassLocked(path,appearance));
}
async function refreshOwnPassLocked(path, appearance) {
  const response = await fetch(path + "/offline-pass", { cache: "no-store", redirect: "error" });
  if ([401,403,404,410].includes(response.status)) {
    await eraseOwnPass(path);
    return { state: "removed" };
  }
  if (response.status !== 200 || response.headers.get("X-Wedding-Offline-Pass") !== "1")
    return { state: "unavailable" };
  const version = response.headers.get("X-Wedding-Pass-Version");
  if (!version || !/^[1-9][0-9]*$/.test(version)) return { state: "unavailable" };
  const privateCache = await caches.open(OWN_PASS_CACHE);
  const previous = await privateCache.match(path);
  if (previous && previous.headers.get("X-Wedding-Pass-Version") !== version) await eraseOwnPass(path);
  // Navigations can erase invalid copies, but only the open page supplies its public fonts.
  if (!appearance) return { state: "current" };
  const classes = typeof appearance.classes === "string" && /^[A-Za-z0-9_ -]{0,2000}$/.test(appearance.classes) ? appearance.classes : "";
  const styles = Array.isArray(appearance.styles) ? appearance.styles.filter((path) => typeof path === "string" && /^\\/_next\\/static\\/[\\w./-]+\\.css$/.test(path) && !path.includes("..")).slice(0,20) : [];
  const statics = await caches.open(SW_STATIC_CACHE);
  await Promise.all(styles.map((path) => precacheAsset(statics,path)));
  const text = (await response.text()).replace("__OFFLINE_FONT_CLASSES__",classes).replace("<!--OFFLINE_FONT_STYLES-->",styles.map((path) => '<link rel="stylesheet" href="' + path + '">').join(""));
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  const saved = new Response(text, { headers });
  await privateCache.put(path,saved);
  invalidOwnPasses.delete(path);
  return { state: "saved", refreshedAt: response.headers.get("X-Wedding-Offline-Refreshed") };
}
self.addEventListener("message",(event) => {
  if (event.data?.type !== "SAVE_OWN_PASS") return;
  event.waitUntil((async () => {
    const reply = (value) => event.ports?.[0]?.postMessage(value);
    try {
      const client = event.source?.id ? await self.clients.get(event.source.id) : null;
      const path = client ? ownPassPath(client.url) : null;
      if (!path || path !== event.data.path) { reply({ state:"denied" }); return; }
      reply(await refreshOwnPass(path,event.data.appearance));
    } catch { reply({ state:"unavailable" }); }
  })());
});
async function ownPassNavigation(request) {
  const path = ownPassPath(request.url);
  try {
    const response = await fetch(request);
    if ([401,403,404,410].includes(response.status)) {
      try { await ownPassQueue(path,() => eraseOwnPass(path)); } catch {}
    }
    else if (response.status === 200) {
      try { await refreshOwnPass(path,null); } catch {}
    }
    return response;
  } catch {
    try {
      const copy = invalidOwnPasses.has(path) ? null : await (await caches.open(OWN_PASS_CACHE)).match(path);
      if (copy?.status === 200 && copy.headers.get("X-Wedding-Offline-Pass") === "1") return copy;
    } catch {}
    try {
      const fallback = await (await caches.open(SW_OFFLINE_CACHE)).match(SW_OFFLINE_URL);
      if (fallback) return fallback;
    } catch {}
    return Response.error();
  }
}
`;
}
