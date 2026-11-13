import { createServer, type Server } from "node:http";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";
import { expect, test, type Page } from "@playwright/test";
let server: Server, origin: string, source: string;
let expiresAt: string, revoked: boolean;
const a = "/i/" + "A".repeat(43),
  b = "/i/" + "B".repeat(43),
  missing = "/i/" + "C".repeat(43);
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
  if (!output) throw new Error("Worker missing");
  const exports: { serviceWorkerSource?: () => string } = {},
    compiledModule = { exports };
  runInNewContext(output.text, { module: compiledModule, exports });
  if (!compiledModule.exports.serviceWorkerSource) throw new Error("Source missing");
  source = compiledModule.exports.serviceWorkerSource();
  server = createServer((request, response) => {
    const path = request.url ?? "/";
    response.setHeader("Cache-Control", "no-store");
    if (path === "/sw.js") {
      response.setHeader("Content-Type", "application/javascript");
      response.end(source);
      return;
    }
    response.setHeader("Content-Type", "text/html");
    if (path.endsWith("/offline-pass")) {
      if (revoked && path.startsWith(a)) {
        response.writeHead(410);
        response.end("Removed");
        return;
      }
      response.setHeader("X-Wedding-Offline-Pass", "1");
      response.setHeader("X-Wedding-Pass-Version", "1");
      response.setHeader("X-Wedding-Offline-Refreshed", new Date().toISOString());
      response.setHeader("X-Wedding-Offline-Expires", expiresAt);
      response.end(`<h1>Saved ${path.startsWith(a) ? "A" : "B"}</h1>`);
    } else
      response.end(
        path === "/offline"
          ? "<h1>Reconnect to open your invitation</h1>"
          : "<h1>Online invitation</h1>",
      );
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing address");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  await new Promise<void>((done) => server.close(() => done()));
});
test.beforeEach(() => {
  expiresAt = new Date(Date.now() + 600_000).toISOString();
  revoked = false;
});
async function save(page: Page, path: string) {
  await page.goto(origin + path);
  return page.evaluate(async (path) => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((done) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => done(), { once: true }),
      );
    return new Promise<unknown>((done, reject) => {
      const channel = new MessageChannel(),
        timer = setTimeout(() => reject(new Error("Save timed out")), 5000);
      channel.port1.onmessage = (event) => {
        clearTimeout(timer);
        channel.port1.close();
        done(event.data);
      };
      navigator.serviceWorker.controller?.postMessage(
        { type: "SAVE_OWN_PASS", path, appearance: { classes: "", styles: [] } },
        [channel.port2],
      );
    });
  }, path);
}
test("capability isolation, known revocation and cache eviction never reveal another household", async ({
  page,
  context,
}) => {
  expect(await save(page, a)).toMatchObject({ state: "saved" });
  expect(await save(page, b)).toMatchObject({ state: "saved" });
  await context.setOffline(true);
  await page.goto(origin + a);
  await expect(page.getByRole("heading", { name: "Saved A", exact: true })).toBeVisible();
  await page.goto(origin + missing);
  await expect(
    page.getByRole("heading", { name: "Reconnect to open your invitation" }),
  ).toBeVisible();
  await context.setOffline(false);
  revoked = true;
  expect(await save(page, a)).toMatchObject({ state: "removed" });
  await context.setOffline(true);
  await page.goto(origin + a);
  await expect(
    page.getByRole("heading", { name: "Reconnect to open your invitation" }),
  ).toBeVisible();
  await page.goto(origin + b);
  await expect(page.getByRole("heading", { name: "Saved B", exact: true })).toBeVisible();
  await page.evaluate(() => caches.delete("wedding-own-pass-v1"));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Reconnect to open your invitation" }),
  ).toBeVisible();
});
test("expired private copies are removed before any offline document is shown", async ({
  page,
  context,
}) => {
  expect(await save(page, a)).toMatchObject({ state: "saved" });
  await page.evaluate(async (path) => {
    const cache = await caches.open("wedding-own-pass-v1"),
      copy = await cache.match(path);
    if (!copy) throw new Error("Missing copy");
    const headers = new Headers(copy.headers);
    headers.set("X-Wedding-Offline-Expires", "2000-01-01T00:00:00.000Z");
    await cache.put(path, new Response(await copy.text(), { headers }));
  }, a);
  await context.setOffline(true);
  await page.goto(origin + a);
  await expect(
    page.getByRole("heading", { name: "Reconnect to open your invitation" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      async (path) => Boolean(await (await caches.open("wedding-own-pass-v1")).match(path)),
      a,
    ),
  ).toBe(false);
});
