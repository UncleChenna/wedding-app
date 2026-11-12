import { createServer, type Server } from "node:http";
import { createHash, generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { resolve } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";
import { expect, test, chromium, webkit, type Page } from "@playwright/test";
let server: Server;
let origin: string;
let worker: string;
let helper: string;
let helperPath: string;
let session: string;
let expiresAt: number;
let admitted = 0;
let failRefresh = false;
let loseResponse = false;
const receipts = new Map<
  string,
  {
    clientEventId: string;
    status: "recorded";
    result: "valid" | "invalid";
    admitted: number;
    conflict: false;
  }
>();
const buildId = "c".repeat(64);
const actor = { staffId: "11111111-1111-4111-8111-111111111111", deviceId: "b".repeat(64) };
const invitationId = "22222222-2222-4222-8222-222222222222";
const keys = generateKeyPairSync("ed25519");
const publicKey = {
  kid: "test",
  alg: "Ed25519",
  spki: keys.publicKey.export({ type: "spki", format: "der" }).toString("base64url"),
};
function qr() {
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      kid: "test",
      inv: invitationId,
      ver: 1,
      iat: Math.floor(Date.now() / 1000),
    }),
  ).toString("base64url");
  return `${origin}/p/${payload}.${sign(null, Buffer.from(payload), keys.privateKey).toString("base64url")}`;
}
test.beforeAll(async () => {
  const crypto = await build({
    entryPoints: ["src/modules/checkin/browser/offline-queue-crypto.ts"],
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "ScannerQueueCrypto",
    minify: true,
    write: false,
  });
  helper = crypto.outputFiles[0]?.text ?? "";
  helperPath = `/scanner-assets/scanner-${createHash("sha256").update(helper).digest("hex")}.js`;
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
  const exports: {
    serviceWorkerSource?: (assets: { build: string; assets: string[]; verifier: string }) => string;
  } = {};
  const compiledModule = { exports };
  runInNewContext(output.text, { module: compiledModule, exports });
  if (!compiledModule.exports.serviceWorkerSource) throw new Error("Worker export missing");
  worker = compiledModule.exports.serviceWorkerSource({
    build: buildId,
    assets: [helperPath],
    verifier: helperPath,
  });
  server = createServer((request, response) => {
    void (async () => {
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      response.setHeader("Cache-Control", "no-store");
      if (path === "/sw.js" || path === helperPath) {
        response.setHeader("Content-Type", "application/javascript");
        response.end(path === "/sw.js" ? worker : helper);
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
            html: "<!doctype html><title>Queue fixture</title><h1>Offline scanner</h1>",
            headers: [["Content-Type", "text/html"]],
            assets: [helperPath],
          }),
        );
      } else if (path === "/api/checkin/guest-snapshot") {
        if (failRefresh) {
          response.writeHead(503);
          response.end();
          return;
        }
        response.setHeader("Content-Type", "application/json");
        response.setHeader("X-Wedding-Guest-Snapshot", "1");
        response.end(
          JSON.stringify({
            version: 2,
            actor,
            session,
            generatedAt: Date.now(),
            expiresAt,
            keys: [publicKey],
            invitations: [
              {
                invitationId,
                tokenVersion: 1,
                status: "rsvp_yes",
                attending: true,
                partySize: 20,
                admittedSoFar: admitted,
                name: "Synthetic household",
                names: ["Synthetic guest"],
                tableNumber: 3,
              },
            ],
          }),
        );
      } else if (path === "/api/checkin/sync") {
        let text = "";
        for await (const chunk of request) text += String(chunk);
        const body = JSON.parse(text) as {
          expectedActor: typeof actor;
          events: {
            clientEventId: string;
            reportedPeople: number;
            reportedResult: "valid" | "invalid";
          }[];
        };
        if (JSON.stringify(body.expectedActor) !== JSON.stringify(actor)) {
          response.writeHead(403);
          response.end();
          return;
        }
        const acks = body.events.map((event) => {
          const prior = receipts.get(event.clientEventId);
          if (prior) return { ...prior, status: "duplicate" };
          admitted += event.reportedPeople;
          const receipt = {
            clientEventId: event.clientEventId,
            status: "recorded" as const,
            result: event.reportedResult,
            admitted: event.reportedPeople,
            conflict: false as const,
          };
          receipts.set(event.clientEventId, receipt);
          return receipt;
        });
        if (loseResponse) {
          response.destroy();
          return;
        }
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ acks, signedOut: false }));
      } else {
        response.setHeader("Content-Type", "text/html");
        response.end("<!doctype html><title>Queue fixture</title><h1>Scanner</h1>");
      }
    })().catch(() => {
      response.writeHead(500);
      response.end("Fixture failure");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No server");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
test.beforeEach(() => {
  session = "a".repeat(64);
  expiresAt = Date.now() + 120_000;
  admitted = 0;
  receipts.clear();
  failRefresh = false;
  loseResponse = false;
});
async function message(page: Page, type: string, extra: Record<string, unknown> = {}) {
  return page.evaluate(
    ({ type, session, extra }) =>
      new Promise<unknown>((resolve, reject) => {
        const channel = new MessageChannel();
        const timer = setTimeout(() => reject(new Error("Queue reply timeout")), 15_000);
        channel.port1.onmessage = (event) => {
          clearTimeout(timer);
          channel.port1.close();
          resolve(event.data);
        };
        navigator.serviceWorker.controller?.postMessage({ type, session, ...extra }, [
          channel.port2,
        ]);
      }),
    { type, session, extra },
  );
}
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
  expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "ready" });
}
function input(id = randomUUID()) {
  return {
    session,
    clientEventId: id,
    qr: qr(),
    inputMethod: "qr",
    kind: "admission",
    people: 1,
    nameChecked: false,
  };
}
test("ten actual worker admissions survive offline reload and repeated reconnect exactly once", async ({
  page,
  context,
}) => {
  await setup(page);
  await context.setOffline(true);
  for (let index = 0; index < 10; index++)
    expect(await message(page, "RECORD_OFFLINE_ATTEMPT", { input: input() })).toMatchObject({
      state: "recorded",
    });
  await page.reload();
  expect(await message(page, "OFFLINE_QUEUE_STATUS")).toMatchObject({
    state: "ready",
    pending: 10,
  });
  expect(await message(page, "READ_GUEST_SNAPSHOT")).toMatchObject({
    snapshot: { invitations: [{ admittedSoFar: 10 }] },
  });
  await context.setOffline(false);
  expect(await message(page, "SYNC_OFFLINE_QUEUE")).toMatchObject({
    state: "synced",
    committed: 10,
  });
  expect(await message(page, "SYNC_OFFLINE_QUEUE")).toEqual({ state: "idle" });
  expect(admitted).toBe(10);
  expect(receipts.size).toBe(10);
  expect(await message(page, "OFFLINE_QUEUE_STATUS")).toMatchObject({
    pending: 0,
    refreshRequired: false,
  });
});
test("lost response retries original IDs and a failed refresh keeps the durable barrier", async ({
  page,
}) => {
  await setup(page);
  const intent = input();
  expect(await message(page, "RECORD_OFFLINE_ATTEMPT", { input: intent })).toMatchObject({
    state: "recorded",
  });
  loseResponse = true;
  expect(await message(page, "SYNC_OFFLINE_QUEUE")).toEqual({ state: "unavailable" });
  expect(admitted).toBe(1);
  loseResponse = false;
  failRefresh = true;
  expect(await message(page, "SYNC_OFFLINE_QUEUE")).toMatchObject({
    state: "synced",
    committed: 1,
  });
  expect(admitted).toBe(1);
  await page.reload();
  expect(await message(page, "RECORD_OFFLINE_ATTEMPT", { input: input() })).toMatchObject({
    state: "refresh_required",
  });
  failRefresh = false;
  expect(await message(page, "REFRESH_GUEST_SNAPSHOT")).toEqual({ state: "ready" });
  expect(await message(page, "RECORD_OFFLINE_ATTEMPT", { input: input() })).toMatchObject({
    state: "recorded",
  });
});
test("worker rejects forged QR admission and logout retains pending evidence", async ({ page }) => {
  await setup(page);
  expect(
    await message(page, "RECORD_OFFLINE_ATTEMPT", {
      input: { ...input(), qr: origin + "/p/forged" },
    }),
  ).toMatchObject({ state: "refused", result: "invalid" });
  expect(await message(page, "RECORD_OFFLINE_ATTEMPT", { input: input() })).toMatchObject({
    state: "recorded",
  });
  expect(await message(page, "INVALIDATE_SCANNER")).toMatchObject({ state: "removed" });
  expect(await message(page, "OFFLINE_QUEUE_STATUS")).toEqual({ state: "unavailable" });
  await setup(page);
  expect(await message(page, "OFFLINE_QUEUE_STATUS")).toMatchObject({ state: "ready", pending: 1 });
});

test("cold browser restart verifies a new signed pass offline with the installed helper", async ({
  browserName,
}) => {
  const profile = await mkdtemp(resolve(tmpdir(), "TICKET-066-browser-"));
  const launcher = browserName === "webkit" ? webkit : chromium;
  let context = await launcher.launchPersistentContext(profile, { headless: true });
  try {
    let page = await context.newPage();
    await setup(page);
    expect(await message(page, "RECORD_OFFLINE_ATTEMPT", { input: input() })).toMatchObject({
      state: "recorded",
    });
    await context.close();
    context = await launcher.launchPersistentContext(profile, { headless: true });
    await context.setOffline(true);
    page = await context.newPage();
    await page.goto(origin + "/checkin");
    expect(await message(page, "RECORD_OFFLINE_ATTEMPT", { input: input() })).toMatchObject({
      state: "recorded",
    });
    expect(await message(page, "OFFLINE_QUEUE_STATUS")).toMatchObject({ pending: 2 });
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
