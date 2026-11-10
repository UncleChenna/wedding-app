import { createServer, type Server } from "node:http";
import { resolve } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";
import { expect, test, chromium, webkit, type Page } from "@playwright/test";

let server: Server;
let origin: string;
let worker: string;
let signOutBundle: string;
let legacyWorker = false;
let session: string;
let expiresAt: number;
let snapshotDeadline: number | null = null;
let holdRefresh = false;
let releaseRefresh: (() => void) | undefined;
const buildId = "b".repeat(64);
const asset = `/scanner-assets/scanner-${buildId}.js`;
const snapshot = () => ({
  version: 1,
  session,
  generatedAt: Date.now(),
  expiresAt: snapshotDeadline ?? expiresAt,
  keys: [{ kid: "test", alg: "Ed25519", spki: "MCowBQYDK2VwAyEA" + "A".repeat(43) }],
  invitations: [
    {
      invitationId: "11111111-1111-4111-8111-111111111111",
      tokenVersion: 1,
      status: "rsvp_yes",
      attending: true,
      partySize: 2,
      admittedSoFar: 1,
      name: "Synthetic worker household",
      names: ["Synthetic worker guest"],
      tableNumber: 3,
    },
  ],
});
test.beforeAll(async () => {
  const signOut = await build({
    entryPoints: ["src/modules/checkin/browser/scanner-sign-out.ts"],
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "SyntheticSignOut",
    write: false,
  });
  signOutBundle = signOut.outputFiles[0]?.text ?? "";
  const compiled = await build({
    entryPoints: ["src/modules/shared/server/service-worker.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    alias: { "server-only": resolve("vitest.server-only-stub.ts") },
  });
  const output = compiled.outputFiles[0];
  if (!output) throw new Error("Worker source missing");
  const exports: { serviceWorkerSource?: (assets: { build: string; assets: string[] }) => string } =
    {};
  const compiledModule = { exports };
  runInNewContext(output.text, { module: compiledModule, exports });
  if (!compiledModule.exports.serviceWorkerSource) throw new Error("Worker export missing");
  worker =
    `
    let fixtureFailPrivate = false;
    const fixtureTransaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function(...args) {
      if (fixtureFailPrivate && this.name === "wedding-scanner-guests-v1") throw new DOMException("Synthetic private failure", "UnknownError");
      return fixtureTransaction.apply(this,args);
    };
    self.addEventListener("message", event => {
      if (event.data?.type === "FIXTURE_FAIL_PRIVATE") {
        fixtureFailPrivate = true;
        event.ports[0]?.postMessage({state:"fault-injected"});
      }
    });
  ` + compiledModule.exports.serviceWorkerSource({ build: buildId, assets: [asset] });
  server = createServer((request, response) => {
    void (async () => {
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      response.setHeader("Cache-Control", "no-store");
      if (path === "/sw.js") {
        response.setHeader("Content-Type", "application/javascript");
        response.end(
          legacyWorker
            ? `self.addEventListener('install',()=>self.skipWaiting()); self.addEventListener('activate',event=>event.waitUntil(self.clients.claim())); self.addEventListener('message',event=>{if(event.data?.type==='INVALIDATE_SCANNER')event.ports[0]?.postMessage({state:'removed'});});`
            : worker,
        );
      } else if (path === asset) {
        response.setHeader("Content-Type", "application/javascript");
        response.end("/* immutable public fixture */");
      } else if (path === "/checkin/offline-shell") {
        response.setHeader("Content-Type", "application/json");
        response.setHeader("X-Wedding-Scanner-Shell", "1");
        response.end(
          JSON.stringify({
            version: 1,
            session,
            build: buildId,
            expiresAt,
            preparedAt: Date.now(),
            html: "<!doctype html><title>Scanner</title><h1>Offline scanner</h1>",
            headers: [["Content-Type", "text/html"]],
            assets: [asset],
          }),
        );
      } else if (path === "/api/checkin/guest-snapshot") {
        if (holdRefresh)
          await new Promise<void>((resolve) => {
            releaseRefresh = resolve;
          });
        response.setHeader("Content-Type", "application/json");
        response.setHeader("X-Wedding-Guest-Snapshot", "1");
        response.end(JSON.stringify(snapshot()));
      } else {
        response.setHeader("Content-Type", "text/html");
        response.end("<!doctype html><title>Scanner fixture</title><h1>Scanner fixture</h1>");
      }
    })().catch(() => {
      response.writeHead(500);
      response.end("Fixture failure");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Server address missing");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  releaseRefresh?.();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
test.beforeEach(() => {
  legacyWorker = false;
  session = "a".repeat(64);
  expiresAt = Date.now() + 120_000;
  snapshotDeadline = null;
  holdRefresh = false;
  releaseRefresh = undefined;
});
async function setup(page: Page) {
  await page.goto(origin + "/checkin");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
          once: true,
        }),
      );
  });
  expect(await message(page, "SAVE_SCANNER")).toMatchObject({ state: "ready" });
}
async function message(page: Page, type: string, expectedSession = session) {
  return page.evaluate(
    ({ type, session }) =>
      new Promise<unknown>((resolve, reject) => {
        const channel = new MessageChannel();
        const timer = setTimeout(() => reject(new Error("Worker fixture reply timed out")), 15_000);
        channel.port1.onmessage = (event) => {
          clearTimeout(timer);
          channel.port1.close();
          resolve(event.data);
        };
        navigator.serviceWorker.controller?.postMessage({ type, session }, [channel.port2]);
      }),
    { type, session: expectedSession },
  );
}
async function privateState(page: Page) {
  return page.evaluate(
    () =>
      new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open("wedding-scanner-guests-v1", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const tx = database.transaction("snapshot", "readonly");
          const read = tx.objectStore("snapshot").get("current");
          tx.oncomplete = () => {
            database.close();
            resolve(read.result?.snapshot ?? null);
          };
          tx.onerror = () => {
            database.close();
            reject(tx.error);
          };
        };
      }),
  );
}
test("exact emitted worker reads private snapshot offline and erases it on logout", async ({
  page,
  context,
}) => {
  await setup(page);
  expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "ready" });
  await context.setOffline(true);
  expect(await message(page, "READ_GUEST_SNAPSHOT")).toMatchObject({
    state: "ready",
    snapshot: { invitations: [{ name: "Synthetic worker household", admittedSoFar: 1 }] },
  });
  expect(await message(page, "INVALIDATE_SCANNER")).toEqual({
    state: "removed",
    privateSnapshotRemoved: true,
  });
  expect(await message(page, "READ_GUEST_SNAPSHOT")).toEqual({ state: "unavailable" });
  expect(await privateState(page)).toBeNull();
});
test("known guest changes clear only private data even when the next refresh fails", async ({
  page,
  context,
}) => {
  await setup(page);
  expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "ready" });
  await context.setOffline(true);
  expect(await message(page, "INVALIDATE_GUEST_SNAPSHOT")).toEqual({
    state: "removed",
    privateSnapshotRemoved: true,
  });
  expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "unavailable" });
  expect(await message(page, "READ_GUEST_SNAPSHOT")).toEqual({ state: "unavailable" });
  expect(await privateState(page)).toBeNull();
  expect(await message(page, "SCANNER_STATUS")).toMatchObject({ state: "ready" });
});
test("an old worker's generic sign-out acknowledgement still triggers physical private cleanup", async ({
  page,
}) => {
  await setup(page);
  expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "ready" });
  expect(await privateState(page)).not.toBeNull();
  legacyWorker = true;
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) throw new Error("Missing fixture registration");
    const changed = new Promise<void>((resolve) =>
      navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }),
    );
    await registration.update();
    await changed;
  });
  expect(await message(page, "INVALIDATE_SCANNER")).toEqual({ state: "removed" });
  expect(await privateState(page)).not.toBeNull();
  await page.addScriptTag({ content: signOutBundle });
  expect(
    await page.evaluate(() =>
      (
        window as unknown as {
          SyntheticSignOut: { clearScannerForSignOut: () => Promise<boolean> };
        }
      ).SyntheticSignOut.clearScannerForSignOut(),
    ),
  ).toBe(true);
  expect(await privateState(page)).toBeNull();
});
test("another tab's logout waits for refresh then prevents stale resurrection", async ({
  page,
  context,
}) => {
  await setup(page);
  const other = await context.newPage();
  await other.goto(origin + "/checkin");
  holdRefresh = true;
  const refreshing = message(page, "REFRESH_GUEST_SNAPSHOT");
  await expect.poll(() => typeof releaseRefresh).toBe("function");
  const logout = message(other, "INVALIDATE_SCANNER");
  releaseRefresh?.();
  expect(await refreshing).toEqual({ state: "ready" });
  expect(await logout).toEqual({ state: "removed", privateSnapshotRemoved: true });
  expect(await message(page, "READ_GUEST_SNAPSHOT")).toEqual({ state: "unavailable" });
  expect(await privateState(page)).toBeNull();
});
test("session replacement erases old private data before a new refresh", async ({ page }) => {
  await setup(page);
  expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "ready" });
  const previous = session;
  session = "c".repeat(64);
  expect(await message(page, "SAVE_SCANNER")).toMatchObject({ state: "ready" });
  expect(await privateState(page)).toBeNull();
  expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "ready" });
  expect(await message(page, "READ_GUEST_SNAPSHOT", previous)).toEqual({ state: "unavailable" });
  expect(await message(page, "READ_GUEST_SNAPSHOT")).toMatchObject({
    state: "ready",
    snapshot: { session },
  });
});

test("session expiry physically clears private data before returning a status", async ({
  page,
}) => {
  expiresAt = Date.now() + 2_000;
  await setup(page);
  expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "ready" });
  await expect.poll(() => message(page, "SCANNER_STATUS")).toEqual({ state: "unavailable" });
  expect(await privateState(page)).toBeNull();
});

test("a shorter trusted server deadline invalidates the old shell and private identity", async ({
  page,
}) => {
  await setup(page);
  expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "ready" });
  await page.evaluate(() => {
    document.documentElement.dataset.scannerInvalidated = "false";
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SCANNER_INVALIDATED" && !event.data.current)
        document.documentElement.dataset.scannerInvalidated = "true";
    });
  });
  snapshotDeadline = expiresAt - 60_000;
  expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "denied" });
  expect(await message(page, "SCANNER_STATUS")).toEqual({ state: "unavailable" });
  expect(await privateState(page)).toBeNull();
  await expect(page.locator("html")).toHaveAttribute("data-scanner-invalidated", "true");
});

for (const invalidation of ["INVALIDATE_SCANNER", "INVALIDATE_GUEST_SNAPSHOT"]) {
  test(`failed ${invalidation} stays inaccessible across a full browser restart offline`, async ({
    browserName,
  }) => {
    const profile = await mkdtemp(resolve(tmpdir(), "TICKET-065-browser-"));
    const launcher = browserName === "webkit" ? webkit : chromium;
    let context = await launcher.launchPersistentContext(profile, { headless: true });
    try {
      let page = await context.newPage();
      await setup(page);
      expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "ready" });
      expect(await message(page, "FIXTURE_FAIL_PRIVATE")).toEqual({ state: "fault-injected" });
      expect(await message(page, invalidation)).toEqual({ state: "unavailable" });
      expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "unavailable" });
      expect(await message(page, "READ_GUEST_SNAPSHOT")).toEqual({ state: "unavailable" });
      await context.close();
      context = await launcher.launchPersistentContext(profile, { headless: true });
      await context.setOffline(true);
      page = await context.newPage();
      await page.goto(origin + "/checkin");
      if (invalidation === "INVALIDATE_SCANNER") {
        expect(await message(page, "DENY_SCANNER_SESSION")).toEqual({ state: "unavailable" });
      } else {
        // Private-only failure retains the shell record, but removed readiness
        // must prevent use of that record after the worker's memory latch resets.
        expect(await message(page, "READ_GUEST_SNAPSHOT")).toEqual({ state: "unavailable" });
        expect(await message(page, "DENY_SCANNER_SESSION")).toEqual({
          state: "removed",
          privateSnapshotRemoved: true,
        });
      }
      expect(await privateState(page)).toBeNull();
      expect(await message(page, "READ_GUEST_SNAPSHOT")).toEqual({ state: "unavailable" });
    } finally {
      await context.close();
      await rm(profile, { recursive: true, force: true });
    }
  });
}
