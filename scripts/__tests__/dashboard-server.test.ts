import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { startDashboard } from "../tickets/dashboard-server";

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const close of cleanup.splice(0)) await close();
});

it("serves loopback GETs, rejects cross-site requests, and preserves last valid data", async () => {
  let fail = false;
  const app = await startDashboard({
    cwd: process.cwd(),
    port: 0,
    watchFiles: false,
    intervalMs: 60000,
    load: async () => {
      if (fail) throw new Error("private transport detail");
      return {
        tickets: [],
        source: "Ledger connected",
        base: "abc",
        generated: "2026-10-21T13:00:00Z",
        connected: true,
      };
    },
  });
  cleanup.push(app.close);
  await app.refresh();
  const response = await fetch(app.url + "/api/board");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect((await response.json()).lastSuccess).toBe("2026-10-21T13:00:00Z");
  expect((await fetch(app.url + "/api/board", { method: "POST" })).status).toBe(405);
  expect(
    (await fetch(app.url + "/api/board", { headers: { Origin: "https://example.com" } })).status,
  ).toBe(403);
  expect(
    (await fetch(app.url + "/api/board", { headers: { "Sec-Fetch-Site": "cross-site" } })).status,
  ).toBe(403);
  expect((await fetch(app.url + "/.env.local")).status).toBe(404);
  fail = true;
  await app.refresh();
  const stale = await (await fetch(app.url + "/api/board")).json();
  expect(stale.connected).toBe(false);
  expect(stale.lastSuccess).toBe("2026-10-21T13:00:00Z");
  expect(JSON.stringify(stale)).not.toContain("private transport detail");
  fail = false;
  await app.refresh();
  expect((await (await fetch(app.url + "/api/board")).json()).connected).toBe(true);
});

it("refreshes after file changes without modifying ticket files", async () => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "ticket-dashboard-")));
  mkdirSync(join(dir, "tickets"));
  writeFileSync(join(dir, "tickets/example.md"), "original ticket");
  let calls = 0;
  const app = await startDashboard({
    cwd: dir,
    port: 0,
    intervalMs: 60000,
    load: async () => ({
      tickets: [],
      source: `read ${++calls}`,
      base: "test",
      generated: new Date().toISOString(),
      connected: true,
    }),
  });
  cleanup.push(async () => {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });
  await app.refresh();
  // Let the OS establish its directory subscription before editing the existing file.
  await new Promise((done) => setTimeout(done, 100));
  const before = calls;
  writeFileSync(join(dir, "tickets/example.md"), "human edit");
  // macOS may coalesce filesystem notifications beyond the default poll timeout.
  await expect.poll(() => calls, { timeout: 5000 }).toBeGreaterThan(before);
  expect(readFileSync(join(dir, "tickets/example.md"), "utf8")).toBe("human edit");
});

it("keeps HTTP responsive during a refresh and polls without file changes", async () => {
  let release: (() => void) | undefined;
  let calls = 0;
  const gate = new Promise<void>((done) => {
    release = done;
  });
  const app = await startDashboard({
    cwd: process.cwd(),
    port: 0,
    intervalMs: 50,
    watchFiles: false,
    load: async () => {
      calls++;
      await gate;
      return {
        tickets: [],
        source: "Ledger",
        base: "abc",
        generated: new Date().toISOString(),
        connected: true,
      };
    },
  });
  cleanup.push(app.close);
  const loading = await (await fetch(app.url + "/api/board")).json();
  expect(loading.connected).toBe(false);
  expect(calls).toBe(1);
  release?.();
  await app.refresh();
  await expect.poll(() => calls).toBeGreaterThan(1);
  await app.close();
  cleanup.pop();
  const finalCalls = calls;
  await new Promise((done) => setTimeout(done, 100));
  expect(calls).toBe(finalCalls);
});
