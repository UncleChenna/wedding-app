import { X509Certificate, createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createServer } from "node:https";
import { request as upstreamRequest } from "node:http";
import { chromium, expect, test, type Browser } from "@playwright/test";

test("@smoke HTTPS shell exposes installable metadata and retains offline navigation", async ({
  baseURL,
}) => {
  test.setTimeout(60000);
  const upstream = new URL(baseURL ?? "");
  if (!["localhost", "127.0.0.1"].includes(upstream.hostname) || upstream.protocol !== "http:")
    throw new Error("TLS fixture requires the loopback production server");
  const folder = mkdtempSync(join(tmpdir(), "wedding-pwa-tls-"));
  let server: ReturnType<typeof createServer> | undefined;
  let secureBrowser: Browser | undefined;
  try {
    const key = join(folder, "key.pem"),
      cert = join(folder, "cert.pem");
    const result = spawnSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        key,
        "-out",
        cert,
        "-days",
        "1",
        "-subj",
        "/CN=localhost",
        "-addext",
        "subjectAltName=DNS:localhost,IP:127.0.0.1",
      ],
      { stdio: "ignore" },
    );
    if (result.status !== 0) {
      throw new Error("Could not generate ephemeral loopback TLS certificate");
    }
    const tlsServer = createServer(
      { key: readFileSync(key), cert: readFileSync(cert) },
      (request, response) => {
        const destination = new URL(request.url ?? "/", upstream);
        if (destination.origin !== upstream.origin) {
          response.writeHead(400);
          response.end();
          return;
        }
        const proxy = upstreamRequest(
          destination,
          { method: request.method, headers: { ...request.headers, host: upstream.host } },
          (reply) => {
            response.writeHead(reply.statusCode ?? 502, reply.headers);
            reply.pipe(response);
          },
        );
        proxy.on("error", () => {
          response.writeHead(502);
          response.end();
        });
        request.pipe(proxy);
      },
    );
    server = tlsServer;
    await new Promise<void>((done, reject) => {
      tlsServer.once("error", reject);
      tlsServer.listen(0, "127.0.0.1", done);
    });
    const address = tlsServer.address();
    if (!address || typeof address === "string") throw new Error("Missing loopback TLS address");
    // Pin only this disposable fixture's public key; arbitrary invalid certificates stay rejected.
    const publicKey = new X509Certificate(readFileSync(cert)).publicKey.export({
      type: "spki",
      format: "der",
    });
    const pin = createHash("sha256").update(publicKey).digest("base64");
    secureBrowser = await chromium.launch({
      args: [`--ignore-certificate-errors-spki-list=${pin}`],
    });
    const context = await secureBrowser.newContext();
    // Exercise our installed-display branch; native OS installation remains TICKET-114.
    await context.addInitScript(() => {
      const original = window.matchMedia.bind(window);
      window.matchMedia = (query) => {
        const result = original(query);
        if (query === "(display-mode: standalone)")
          Object.defineProperty(result, "matches", { value: true });
        return result;
      };
    });
    const page = await context.newPage();
    await page.goto(`https://127.0.0.1:${address.port}/`);
    expect(new URL(page.url()).protocol).toBe("https:");
    expect(await page.evaluate(() => window.isSecureContext)).toBe(true);
    expect(await page.evaluate(() => matchMedia("(display-mode: standalone)").matches)).toBe(true);
    await expect(page.getByRole("button", { name: "Install app", exact: true })).toHaveCount(0);
    await expect
      .poll(
        () =>
          page.evaluate(async () =>
            Boolean((await navigator.serviceWorker.getRegistration())?.active),
          ),
        { timeout: 15000 },
      )
      .toBe(true);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
      .toBe(true);
    const session = await context.newCDPSession(page);
    try {
      const manifest = await session.send("Page.getAppManifest");
      expect(manifest.errors).toEqual([]);
      expect(new URL(manifest.url).protocol).toBe("https:");
      const errors = await session.send("Page.getInstallabilityErrors");
      expect(errors.installabilityErrors).toEqual([]);
    } finally {
      await session.detach();
    }
    await context.setOffline(true);
    await page.goto(`https://127.0.0.1:${address.port}/i/never-opened-tls-fixture`);
    await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  } finally {
    try {
      await secureBrowser?.close();
    } finally {
      try {
        if (server?.listening) {
          server.closeAllConnections();
          const activeServer = server;
          await new Promise<void>((done) => activeServer.close(() => done()));
        }
      } finally {
        rmSync(folder, { recursive: true, force: true });
      }
    }
  }
});
