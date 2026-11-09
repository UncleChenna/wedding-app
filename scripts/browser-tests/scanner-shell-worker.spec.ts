import { createServer, type Server } from "node:http";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";
import QRCode from "qrcode";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, chromium, webkit, type Page } from "@playwright/test";
import { generateScannerAssets, type ScannerAssetManifest } from "../scanner-assets";
import type { ScannerShellGrant } from "../../src/modules/checkin/browser/scanner-shell-store";
import { themeToCssText } from "../../src/modules/theming/lib/css-vars";
import { themeSchema } from "../../src/modules/theming/lib/schema";
let themeCss: string;

declare global {
  interface Window {
    scannerFixtureTracks: MediaStreamTrack[];
    scannerFixtureDecoded: string[];
    scannerFixturePaintQr: boolean;
    scannerFixtureBlank: boolean;
  }
}

let server: Server;
let origin: string;
let manifest: ScannerAssetManifest;
let worker: string;
let denied = false;
let expiresAt = 0;
const session = "a".repeat(64);
function grant(): ScannerShellGrant {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Gate scanner</title><link rel="stylesheet" href="${manifest.stylesheet}"><style>${themeCss}</style></head><body><div id="scanner-shell" data-expires-at="${expiresAt}" data-session="${session}" data-build="${manifest.build}"></div><script defer src="${manifest.script}"></script></body></html>`;
  return {
    version: 1,
    session,
    build: manifest.build,
    expiresAt,
    preparedAt: Date.now(),
    html,
    headers: [
      ["Content-Type", "text/html"],
      ["Cache-Control", "no-store"],
    ],
    assets: manifest.assets,
  };
}
test.beforeAll(async () => {
  themeCss = themeToCssText(
    themeSchema.parse(
      JSON.parse(await readFile("src/modules/theming/themes/ivory-gold.json", "utf8")),
    ),
  );
  manifest = await generateScannerAssets(process.cwd());
  const compiled = await build({
    entryPoints: ["src/modules/shared/server/service-worker.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    alias: { "server-only": resolve("vitest.server-only-stub.ts") },
  });
  const exports: { serviceWorkerSource?: (assets: ScannerAssetManifest) => string } = {};
  const output = compiled.outputFiles[0];
  if (!output) throw new Error("missing worker output");
  const compiledModule = { exports };
  runInNewContext(output.text, { module: compiledModule, exports });
  if (!compiledModule.exports.serviceWorkerSource) throw new Error("missing worker source");
  worker =
    `
    let fixtureFailTransactions = false;
    const fixtureTransaction = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function(...args) {
      if (fixtureFailTransactions && this.name === "wedding-scanner-shell-v1") throw new DOMException("Synthetic storage failure", "UnknownError");
      return fixtureTransaction.apply(this, args);
    };
    self.addEventListener("message", (event) => {
      if (event.data?.type === "FIXTURE_FAIL_IDB") {
        fixtureFailTransactions = true;
        event.ports[0]?.postMessage({ state: "fault-injected" });
      }
    });
  ` + compiledModule.exports.serviceWorkerSource(manifest);
  server = createServer((request, response) => {
    void (async () => {
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      response.setHeader("Cache-Control", "no-store");
      if (path === "/sw.js") {
        response.setHeader("Content-Type", "application/javascript");
        response.end(worker);
      } else if (path === "/checkin/offline-shell") {
        if (denied) {
          response.writeHead(401);
          response.end("denied");
          return;
        }
        response.setHeader("Content-Type", "application/json");
        response.setHeader("X-Wedding-Scanner-Shell", "1");
        response.end(JSON.stringify(grant()));
      } else if (manifest.assets.includes(path)) {
        response.setHeader(
          "Content-Type",
          path.endsWith(".js")
            ? "text/javascript"
            : path.endsWith(".css")
              ? "text/css"
              : "font/woff2",
        );
        response.end(await readFile(resolve("public", "." + path)));
      } else if (path === "/checkin" && request.method === "POST") {
        denied = true;
        response.writeHead(303, { Location: "/staff" });
        response.end();
      } else {
        response.setHeader("Content-Type", "text/html");
        response.end(
          `<!doctype html><title>Worker fixture</title><h1>${path === "/offline" ? "Connection needed" : path === "/staff" ? "Staff sign-in" : "Online scanner fixture"}</h1><form action="/checkin" method="post"><button>Native sign out</button></form>`,
        );
      }
    })().catch(() => {
      response.writeHead(500);
      response.end("fixture failure");
    });
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing address");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  await new Promise<void>((done) => server.close(() => done()));
});
test.beforeEach(() => {
  denied = false;
  expiresAt = Date.now() + 120_000;
});
async function message(page: Page, type: string) {
  return page.evaluate(
    (type) =>
      new Promise<unknown>((resolve, reject) => {
        const channel = new MessageChannel();
        const timer = setTimeout(() => reject(new Error("worker reply timed out")), 15_000);
        channel.port1.onmessage = (event) => {
          clearTimeout(timer);
          channel.port1.close();
          resolve(event.data);
        };
        if (!navigator.serviceWorker.controller) throw new Error("uncontrolled fixture");
        navigator.serviceWorker.controller.postMessage({ type }, [channel.port2]);
      }),
    type,
  );
}
async function prepare(page: Page) {
  await page.goto(origin + "/checkin");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  expect(await message(page, "SAVE_SCANNER")).toMatchObject({ state: "ready" });
}
test("actual worker restores the complete scanner bundle offline and decodes QR video pixels", async ({
  page,
  context,
}) => {
  expiresAt = Date.now() + 12_000;
  await prepare(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("button", { name: "Open camera" })).toBeVisible();
  const qr = await QRCode.toDataURL("synthetic-offline-scanner-qr", { width: 512, margin: 4 });
  await page.evaluate(async (src) => {
    Object.defineProperty(window, "BarcodeDetector", { configurable: true, value: undefined });
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const drawing = canvas.getContext("2d");
    if (!drawing) throw new Error("missing canvas");
    const image = new Image();
    image.src = src;
    await image.decode();
    drawing.drawImage(image, 0, 0);
    window.scannerFixturePaintQr = true;
    window.scannerFixtureBlank = false;
    window.scannerFixtureDecoded = [];
    const networkFetch = window.fetch.bind(window);
    window.fetch = (input, options) => {
      if (String(input) === "/api/checkin/read" && typeof options?.body === "string") {
        const body = JSON.parse(options.body) as { qr?: unknown };
        if (typeof body.qr === "string") window.scannerFixtureDecoded.push(body.qr);
      }
      return networkFetch(input, options);
    };
    setInterval(() => {
      if (window.scannerFixturePaintQr) drawing.drawImage(image, 0, 0);
      else {
        drawing.fillStyle = "white";
        drawing.fillRect(0, 0, 512, 512);
        window.scannerFixtureBlank = true;
      }
    }, 100);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          const stream = canvas.captureStream(15);
          window.scannerFixtureTracks = stream.getTracks();
          return stream;
        },
      },
    });
  }, qr);
  await page.getByRole("button", { name: "Open camera" }).click();
  await expect(page.getByText("Unable to check this pass", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.scannerFixtureDecoded)).toEqual([
    "synthetic-offline-scanner-qr",
  ]);
  await expect(page.getByText("Valid pass", { exact: true })).toHaveCount(0);
  // TICKET-060 stops capture after a read. Restart on blank frames to prove that
  // session expiry, rather than a completed read, shuts down an active camera.
  await page.evaluate(() => {
    window.scannerFixturePaintQr = false;
  });
  await expect.poll(() => page.evaluate(() => window.scannerFixtureBlank)).toBe(true);
  await page.getByRole("button", { name: "Scan next pass" }).click();
  await expect(page.getByRole("button", { name: "Pause camera" })).toBeVisible();
  await expect(page.getByText("Scanner locked", { exact: true })).toBeVisible({ timeout: 15_000 });
  expect(
    await page.evaluate(() =>
      window.scannerFixtureTracks.every((track) => track.readyState === "ended"),
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Connection needed" })).toBeVisible();
});
test("missing decoder assets fail closed instead of presenting an offline-ready camera", async ({
  page,
  context,
}) => {
  await prepare(page);
  await page.evaluate(async (manifest) => {
    await (
      await caches.open("wedding-scanner-assets-v1-" + manifest.build)
    ).delete(manifest.script);
  }, manifest);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Connection needed" })).toBeVisible();
  expect(await page.getByRole("button", { name: "Open camera" }).count()).toBe(0);
});
test("native POST sign-out invalidates after its redirect even without page JavaScript handling", async ({
  page,
  context,
}) => {
  await prepare(page);
  await page.getByRole("button", { name: "Native sign out" }).click();
  await expect(page.getByRole("heading", { name: "Staff sign-in" })).toBeVisible();
  await page.goto(origin + "/checkin");
  expect(await message(page, "SCANNER_STATUS")).toEqual({ state: "unavailable" });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Connection needed" })).toBeVisible();
});

for (const theme of ["ivory-gold", "emerald-night", "blush-sage", "midnight-champagne"]) {
  test(`offline shell ${theme} is accessible and fits each review width`, async ({
    page,
    context,
  }, testInfo) => {
    themeCss = themeToCssText(
      themeSchema.parse(
        JSON.parse(await readFile(`src/modules/theming/themes/${theme}.json`, "utf8")),
      ),
    );
    await prepare(page);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("button", { name: "Open camera" })).toBeVisible();
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      const target = await page.getByRole("button", { name: "Open camera" }).boundingBox();
      expect(target?.height).toBeGreaterThanOrEqual(44);
      expect(target?.width).toBeGreaterThanOrEqual(44);
      await page.screenshot({ path: testInfo.outputPath(`${theme}-${width}.png`), fullPage: true });
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("saved scanner survives a full browser restart with the network unavailable", async ({
  browserName,
}) => {
  const directory = await mkdtemp(join(tmpdir(), "TICKET-108-worker-restart-"));
  const engine = browserName === "webkit" ? webkit : chromium;
  let browserContext = await engine.launchPersistentContext(directory, { headless: true });
  try {
    const page = browserContext.pages()[0] ?? (await browserContext.newPage());
    await prepare(page);
    await browserContext.close();
    browserContext = await engine.launchPersistentContext(directory, {
      headless: true,
      offline: true,
    });
    const restored = browserContext.pages()[0] ?? (await browserContext.newPage());
    await restored.goto(origin + "/checkin");
    await expect(restored.getByRole("button", { name: "Open camera" })).toBeVisible();
    expect(await message(restored, "SCANNER_STATUS")).toMatchObject({
      state: "ready",
      session,
      build: manifest.build,
    });
  } finally {
    await browserContext.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("failed grant invalidation cannot restore old access after storage recovery and browser restart", async ({
  browserName,
}) => {
  const directory = await mkdtemp(join(tmpdir(), "TICKET-108-failed-invalidation-"));
  const engine = browserName === "webkit" ? webkit : chromium;
  let browserContext = await engine.launchPersistentContext(directory, { headless: true });
  try {
    const page = browserContext.pages()[0] ?? (await browserContext.newPage());
    await prepare(page);
    expect(await message(page, "FIXTURE_FAIL_IDB")).toEqual({ state: "fault-injected" });
    expect(await message(page, "INVALIDATE_SCANNER")).toEqual({ state: "unavailable" });
    expect(
      await page.evaluate(async () =>
        (await caches.keys()).filter((name) => name.startsWith("wedding-scanner-assets-v1-")),
      ),
    ).toEqual([]);
    await browserContext.close();
    browserContext = await engine.launchPersistentContext(directory, {
      headless: true,
      offline: true,
    });
    const restored = browserContext.pages()[0] ?? (await browserContext.newPage());
    await restored.goto(origin + "/checkin");
    await expect(restored.getByRole("heading", { name: "Connection needed" })).toBeVisible();
    expect(await restored.getByRole("button", { name: "Open camera" }).count()).toBe(0);
  } finally {
    await browserContext.close();
    await rm(directory, { recursive: true, force: true });
  }
});
