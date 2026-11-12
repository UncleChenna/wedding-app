import { createServer, type Server } from "node:http";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";
import { test, expect, type Page } from "@playwright/test";
import type {
  createOfflineQueuePolicy,
  OfflineAttempt,
} from "../../src/modules/checkin/lib/offline-queue";
import type { createOfflineQueueStore } from "../../src/modules/checkin/browser/offline-queue-store";
declare global {
  interface Window {
    updateStates: unknown[];
    UpgradeLibrary: {
      createOfflineQueuePolicy: typeof createOfflineQueuePolicy;
      createOfflineQueueStore: typeof createOfflineQueueStore;
    };
  }
}
let server: Server, origin: string, worker: string, library: string;
let release = 1;
const acknowledged = new Set<string>();
const actor = { staffId: "11111111-1111-4111-8111-111111111111", deviceId: "a".repeat(64) };
const attempt = (id: string): OfflineAttempt => ({
  actor,
  session: "b".repeat(64),
  rejected: false,
  event: {
    clientEventId: id,
    invitationId: "22222222-2222-4222-8222-222222222222",
    passVersion: 1,
    reportedAt: "2026-12-19T12:00:00.000Z",
    reportedResult: "valid",
    reportedPeople: 1,
    kind: "admission",
    inputMethod: "qr",
  },
});
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["src/modules/shared/server/service-worker.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    alias: { "server-only": resolve("vitest.server-only-stub.ts") },
  });
  const output = result.outputFiles[0];
  if (!output) throw new Error("Missing worker");
  const exports: { serviceWorkerSource?: () => string } = {},
    compiledModule = { exports };
  runInNewContext(output.text, { module: compiledModule, exports });
  if (!compiledModule.exports.serviceWorkerSource) throw new Error("Missing source export");
  worker = compiledModule.exports.serviceWorkerSource();
  const browser = await build({
    stdin: {
      contents:
        'export {createOfflineQueuePolicy} from "./src/modules/checkin/lib/offline-queue"; export {createOfflineQueueStore} from "./src/modules/checkin/browser/offline-queue-store";',
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "UpgradeLibrary",
    write: false,
  });
  library = browser.outputFiles[0]?.text ?? "";
  server = createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    if (request.url === "/ack") {
      void (async () => {
        let body = "";
        for await (const chunk of request) body += String(chunk);
        const ids: unknown = JSON.parse(body);
        if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string"))
          throw new Error("Invalid fixture ids");
        const acks = ids.map((clientEventId: string) => {
          const status = acknowledged.has(clientEventId) ? "duplicate" : "recorded";
          acknowledged.add(clientEventId);
          return { clientEventId, status, result: "valid", admitted: 1, conflict: false };
        });
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify(acks));
      })().catch(() => {
        response.writeHead(500);
        response.end();
      });
    } else if (request.url === "/sw.js") {
      response.setHeader("Content-Type", "application/javascript");
      response.end(`${worker}\n// release ${release}`);
    } else if (request.url === "/queue.js") {
      response.setHeader("Content-Type", "application/javascript");
      response.end(library);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end(
        '<!doctype html><title>Upgrade fixture</title><script src="/queue.js"></script>',
      );
    }
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing address");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  await new Promise<void>((done) => server.close(() => done()));
});
async function install(page: Page) {
  await page.goto(origin);
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((done) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => done(), { once: true }),
      );
  });
}
async function send(page: Page, type: string, waiting = false) {
  return page.evaluate(
    async ({ type, waiting }) => {
      const registration = await navigator.serviceWorker.getRegistration();
      const target = waiting ? registration?.waiting : navigator.serviceWorker.controller;
      if (!target) throw new Error("Missing worker target");
      return new Promise<unknown>((done, reject) => {
        const channel = new MessageChannel(),
          timer = setTimeout(() => reject(new Error("Update reply timeout")), 5000);
        channel.port1.onmessage = (event) => {
          clearTimeout(timer);
          channel.port1.close();
          done(event.data);
        };
        target.postMessage({ type, pending: 0, safeMigration: true }, [channel.port2]);
      });
    },
    { type, waiting },
  );
}
async function update(page: Page) {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
  });
  await expect
    .poll(() =>
      page.evaluate(async () =>
        Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
      ),
    )
    .toBe(true);
}
async function ids(page: Page) {
  return page.evaluate(async () =>
    (
      await window.UpgradeLibrary.createOfflineQueueStore(
        window.UpgradeLibrary.createOfflineQueuePolicy(),
      ).read()
    ).attempts.map((row) => row.event.clientEventId),
  );
}
test("N/N+1 waiting, additive schema migration, tab closure and rollback preserve exact events", async ({
  page,
  context,
}) => {
  release = 1;
  acknowledged.clear();
  await install(page);
  const events = [crypto.randomUUID(), crypto.randomUUID()];
  for (const id of events)
    expect(
      await page.evaluate(
        (value) =>
          window.UpgradeLibrary.createOfflineQueueStore(
            window.UpgradeLibrary.createOfflineQueuePolicy(),
          ).record(value, { kind: "known", remaining: 2 }),
        attempt(id),
      ),
    ).toBe("recorded");
  const other = await context.newPage();
  await other.goto(origin);
  for (const tab of [page, other])
    await tab.evaluate(() => {
      window.updateStates = [];
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "WORKER_UPDATE_STATE") window.updateStates.push(event.data);
      });
    });
  release = 2;
  await update(page);
  expect(await send(page, "ACTIVATE_WORKER_UPDATE", true)).toEqual({
    state: "deferred",
    pending: 2,
  });
  expect(await send(other, "WORKER_UPDATE_STATUS", true)).toEqual({
    state: "deferred",
    pending: 2,
  });
  for (const tab of [page, other])
    await expect
      .poll(() => tab.evaluate(() => window.updateStates))
      .toContainEqual({ type: "WORKER_UPDATE_STATE", state: "deferred", pending: 2 });
  await page.reload();
  expect(await ids(page)).toEqual(events);
  // Actual additive IDB migration, retaining the immutable version-1 journal for rollback.
  await page.evaluate(
    () =>
      new Promise<void>((done, reject) => {
        const request = indexedDB.open("wedding-scanner-attempts-v1", 2);
        request.onupgradeneeded = () => request.result.createObjectStore("upgrade-metadata");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          request.result.close();
          done();
        };
      }),
  );
  expect(await ids(page)).toEqual(events);
  // Pre-180 pinned-version code is explicitly outside the rollback window; it must fail,
  // not reset/delete the database to recover. The compatible reader still retains both IDs.
  expect(
    await page.evaluate(
      () =>
        new Promise<string>((done, reject) => {
          const request = indexedDB.open("wedding-scanner-attempts-v1", 1);
          request.onerror = () => done(request.error?.name ?? "unknown");
          request.onsuccess = () => {
            request.result.close();
            reject(new Error("Legacy reader unexpectedly opened v2"));
          };
        }),
    ),
  ).toBe("VersionError");
  expect(await ids(page)).toEqual(events);
  await other.close();
  await page.close();
  const next = await context.newPage();
  await next.goto(origin);
  await expect
    .poll(() =>
      next.evaluate(
        async () => (await navigator.serviceWorker.getRegistration())?.waiting === null,
      ),
    )
    .toBe(true);
  expect(await ids(next)).toEqual(events);
  // Reinstall older script after the schema upgrade: its versionless reader still opens v2.
  release = 1;
  await update(next);
  expect(await send(next, "ACTIVATE_WORKER_UPDATE", true)).toEqual({
    state: "deferred",
    pending: 2,
  });
  await next.evaluate(
    async ({ actor, events }) => {
      const store = window.UpgradeLibrary.createOfflineQueueStore(
        window.UpgradeLibrary.createOfflineQueuePolicy(),
      );
      for (let retry = 0; retry < 2; retry++) {
        const response = await fetch("/ack", { method: "POST", body: JSON.stringify(events) });
        const acks: unknown = await response.json();
        if (!response.ok || !Array.isArray(acks)) throw new Error("Acknowledgements unavailable");
        await store.acknowledge(actor, acks, crypto.randomUUID());
      }
    },
    { actor, events },
  );
  expect([...acknowledged]).toEqual(events);
  expect(await ids(next)).toEqual([]);
  expect(
    await next.evaluate(async () =>
      (
        await window.UpgradeLibrary.createOfflineQueueStore(
          window.UpgradeLibrary.createOfflineQueuePolicy(),
        ).read()
      ).receipts.map((row) => row.attempt.event.clientEventId),
    ),
  ).toEqual(events);
  expect(await send(next, "ACTIVATE_WORKER_UPDATE", true)).toEqual({ state: "ready", pending: 0 });
});
test("interrupted migration rolls back; incompatible journal prevents activation and cache cleanup", async ({
  page,
  context,
}) => {
  release = 1;
  acknowledged.clear();
  await install(page);
  const id = crypto.randomUUID();
  await page.evaluate(
    (value) =>
      window.UpgradeLibrary.createOfflineQueueStore(
        window.UpgradeLibrary.createOfflineQueuePolicy(),
      ).record(value, { kind: "known", remaining: 1 }),
    attempt(id),
  );
  await page.evaluate(
    () =>
      new Promise<void>((done, reject) => {
        const request = indexedDB.open("wedding-scanner-attempts-v1", 2);
        request.onupgradeneeded = () => {
          request.result.createObjectStore("interrupted");
          request.transaction?.abort();
        };
        request.onerror = () => done();
        request.onsuccess = () => {
          request.result.close();
          reject(new Error("Migration unexpectedly committed"));
        };
      }),
  );
  expect(await ids(page)).toEqual([id]);
  await page.evaluate(async () => {
    await (
      await caches.open("wedding-private-evidence-old")
    ).put("/sentinel", new Response("keep"));
    await new Promise<void>((done, reject) => {
      const request = indexedDB.open("wedding-scanner-attempts-v1");
      request.onsuccess = () => {
        const db = request.result,
          tx = db.transaction("journal", "readwrite"),
          store = tx.objectStore("journal"),
          read = store.get("current");
        read.onsuccess = () => store.put({ ...read.result, version: 99 }, "current");
        tx.oncomplete = () => {
          db.close();
          done();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
  release = 2;
  await update(page);
  expect(await send(page, "ACTIVATE_WORKER_UPDATE", true)).toEqual({ state: "unavailable" });
  expect(await page.evaluate(() => caches.has("wedding-private-evidence-old"))).toBe(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto(origin);
  await expect
    .poll(() =>
      reopened.evaluate(
        async () => (await navigator.serviceWorker.getRegistration())?.waiting === null,
      ),
    )
    .toBe(true);
  expect(await reopened.evaluate(() => caches.has("wedding-private-evidence-old"))).toBe(true);
  expect(
    await reopened.evaluate(async () => {
      try {
        await window.UpgradeLibrary.createOfflineQueueStore(
          window.UpgradeLibrary.createOfflineQueuePolicy(),
        ).read();
        return "wrong";
      } catch {
        return "preserved unsupported journal";
      }
    }),
  ).toBe("preserved unsupported journal");
});
