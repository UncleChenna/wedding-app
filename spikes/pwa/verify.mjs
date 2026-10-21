import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  readdirSync,
  statSync,
  rmSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { gzipSync } from "node:zlib";
import { setTimeout } from "node:timers/promises";
import { chromium } from "@playwright/test";

const run = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");
const target = join(root, "public/__pwa-spike");
assert(!existsSync(target), "Refusing to overwrite an existing prototype directory");
const meta = JSON.parse(readFileSync(join(root, ".harness/worktree.json"), "utf8"));
const port = meta.pwPort;
const origin = `http://localhost:${port}`;
const size = (dir) =>
  readdirSync(dir).reduce((sum, name) => {
    const path = join(dir, name);
    return sum + (statSync(path).isDirectory() ? size(path) : statSync(path).size);
  }, 0);
async function build() {
  const start = performance.now();
  await run("pnpm", ["build"], { cwd: root, maxBuffer: 10 * 1024 * 1024 });
  return {
    milliseconds: Math.round(performance.now() - start),
    staticBytes: size(join(root, ".next/static")),
  };
}
let server;
let browser;
try {
  const baseline = await build();
  mkdirSync(target, { recursive: true });
  for (const name of ["worker.js", "offline.html", "menu.json"])
    copyFileSync(join(import.meta.dirname, name), join(target, name));
  const prototype = await build();
  server = spawn("node", ["node_modules/next/dist/bin/next", "start", "--port", String(port)], {
    cwd: root,
    stdio: "ignore",
  });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* server starting */
    }
    await setTimeout(200);
  }
  assert(ready, "Production server did not start");
  browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${origin}/__pwa-spike/offline.html`);
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/__pwa-spike/worker.js", {
      scope: "/__pwa-spike/",
      updateViaCache: "none",
    });
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  assert.match(
    await page.evaluate(async () => (await fetch("/__pwa-spike/menu.json")).text()),
    /Synthetic menu item/,
  );
  await page.evaluate(async () => {
    await fetch("/admin");
    await fetch("/api/private");
    await fetch("/invite?token=synthetic");
    await fetch("/__pwa-spike/menu.json?token=synthetic");
    await fetch("/__pwa-spike/offline.html", { headers: { RSC: "1" } });
  });
  const entries = await page.evaluate(async () =>
    (await (await caches.open("ticket-102-prototype-v1")).keys())
      .map((request) => new URL(request.url).pathname)
      .sort(),
  );
  assert.deepEqual(entries, ["/__pwa-spike/menu.json", "/__pwa-spike/offline.html"]);
  await context.setOffline(true);
  assert.match(
    await page.evaluate(async () => (await fetch("/__pwa-spike/menu.json")).text()),
    /Synthetic menu item/,
  );
  await page.reload();
  assert.equal(await page.locator("h1").textContent(), "Offline prototype");
  assert.equal(
    await page.evaluate(async () =>
      fetch("/admin").then(
        () => false,
        () => true,
      ),
    ),
    true,
  );
  const worker = readFileSync(join(import.meta.dirname, "worker.js"));
  process.stdout.write(
    JSON.stringify(
      {
        baseline,
        prototype,
        workerBytes: worker.length,
        workerGzipBytes: gzipSync(worker).length,
        checks: [
          "production registration",
          "install precache",
          "runtime public fixture cache",
          "offline navigation",
          "offline runtime fallback",
          "private routes excluded",
        ],
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  if (browser) await browser.close();
  if (server) {
    server.kill("SIGTERM");
    await new Promise((done) => server.once("exit", done));
  }
  if (existsSync(target)) rmSync(target, { recursive: true });
}
