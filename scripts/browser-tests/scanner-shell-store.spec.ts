import { build } from "esbuild";
import { expect, test } from "@playwright/test";
import type { createScannerShellRuntime } from "../../src/modules/checkin/browser/scanner-shell-runtime";
import type { createScannerShellStore } from "../../src/modules/checkin/browser/scanner-shell-store";

declare global {
  interface Window {
    ScannerStore: {
      createScannerShellStore: typeof createScannerShellStore;
      createScannerShellRuntime: typeof createScannerShellRuntime;
    };
  }
}
test.beforeEach(async ({ page }) => {
  const bundle = await build({
    stdin: {
      contents:
        'export { createScannerShellStore } from "./src/modules/checkin/browser/scanner-shell-store"; export { createScannerShellRuntime } from "./src/modules/checkin/browser/scanner-shell-runtime";',
      resolveDir: process.cwd(),
      loader: "ts",
    },
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "ScannerStore",
    write: false,
  });
  const script = bundle.outputFiles[0];
  if (!script) throw new Error("Store bundle missing");
  await page.route("http://localhost:32919/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Scanner store fixture</title>",
    }),
  );
  await page.goto("http://localhost:32919/");
  await page.addScriptTag({ content: script.text });
});
test("persists a grant across store instances and rejects a save overtaken by logout", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const first = window.ScannerStore.createScannerShellStore();
    const second = window.ScannerStore.createScannerShellStore();
    const generation = await first.begin();
    const grant = {
      version: 1 as const,
      session: "a".repeat(64),
      build: "b".repeat(64),
      expiresAt: Date.now() + 60_000,
      preparedAt: Date.now(),
      html: "<!doctype html><main>Scanner only</main>",
      headers: [["Content-Type", "text/html"]] as [string, string][],
      assets: ["/scanner-assets/scanner-" + "b".repeat(64) + ".js"],
    };
    const saved = await first.commit(generation, grant);
    const restored = await second.current();
    await second.invalidate();
    const staleSave = await first.commit(generation, grant);
    const cold = await window.ScannerStore.createScannerShellStore().current();
    return { saved, restored, staleSave, cold, grant };
  });
  expect(result.saved).toBe(true);
  expect(result.restored).toEqual(result.grant);
  expect(result.staleSave).toBe(false);
  expect(result.cold).toBeNull();
});
test("expires at the boundary and cannot revive an expired generation", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const store = window.ScannerStore.createScannerShellStore();
    const generation = await store.begin();
    const now = Date.now();
    const grant = {
      version: 1 as const,
      session: "a".repeat(64),
      build: "b".repeat(64),
      expiresAt: now + 60_000,
      preparedAt: now,
      html: "<main>Scanner</main>",
      headers: [] as [string, string][],
      assets: ["/scanner-assets/scanner-" + "b".repeat(64) + ".js"],
    };
    await store.commit(generation, grant);
    const before = await store.current(grant.expiresAt - 1);
    const boundary = await store.current(grant.expiresAt);
    const revived = await store.commit(generation, grant);
    const cold = await window.ScannerStore.createScannerShellStore().current();
    return { before: before?.session, boundary, revived, cold };
  });
  expect(result).toEqual({ before: "a".repeat(64), boundary: null, revived: false, cold: null });
});
test("rejects malformed or already expired documents without publishing a copy", async ({
  page,
}) => {
  const results = await page.evaluate(async () => {
    const store = window.ScannerStore.createScannerShellStore();
    const generation = await store.begin();
    const now = Date.now();
    const base = {
      version: 1 as const,
      session: "a".repeat(64),
      build: "b".repeat(64),
      expiresAt: now + 60_000,
      preparedAt: now,
      html: "<main>Scanner</main>",
      headers: [] as [string, string][],
      assets: ["/scanner-assets/scanner-" + "b".repeat(64) + ".js"],
    };
    const outcomes = [];
    for (const patch of [
      { expiresAt: now },
      { expiresAt: Number.NaN },
      { session: "bad" },
      { html: "" },
      { assets: ["https://elsewhere.example/private"] },
      { assets: ["/_next/static/../admin"] },
    ]) {
      outcomes.push(await store.commit(generation, { ...base, ...patch }));
    }
    return { outcomes, current: await store.current() };
  });
  expect(results).toEqual({ outcomes: [false, false, false, false, false, false], current: null });
});
test("does not return a grant that expires while IndexedDB opens", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const ordinary = window.ScannerStore.createScannerShellStore();
    const grant = {
      version: 1 as const,
      session: "a".repeat(64),
      build: "b".repeat(64),
      expiresAt: Date.now() + 60_000,
      preparedAt: Date.now(),
      html: "<main>Scanner</main>",
      headers: [] as [string, string][],
      assets: ["/scanner-assets/scanner-" + "b".repeat(64) + ".js"],
    };
    await ordinary.commit(await ordinary.begin(), grant);
    const original = Date.now;
    let clock = original();
    Date.now = () => clock;
    try {
      const factory = {
        open(name: string, version?: number) {
          const request = indexedDB.open(name, version);
          request.addEventListener("success", () => {
            clock = grant.expiresAt;
          });
          return request;
        },
      };
      const expired = await window.ScannerStore.createScannerShellStore(factory).current();
      return { expired, persisted: await ordinary.current() };
    } finally {
      Date.now = original;
    }
  });
  expect(result).toEqual({ expired: null, persisted: null });
});
test("a newer preparation wins and its token cannot be reused", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const store = window.ScannerStore.createScannerShellStore();
    const older = await store.begin();
    const newer = await store.begin();
    const grant = {
      version: 1 as const,
      session: "a".repeat(64),
      build: "b".repeat(64),
      expiresAt: Date.now() + 60_000,
      preparedAt: Date.now(),
      html: "<main>Scanner</main>",
      headers: [] as [string, string][],
      assets: ["/scanner-assets/scanner-" + "b".repeat(64) + ".js"],
    };
    return {
      older: await store.commit(older, grant),
      newer: await store.commit(newer, grant),
      reuse: await store.commit(newer, { ...grant, session: "c".repeat(64) }),
      stored: (await store.current())?.session,
    };
  });
  expect(result).toEqual({ older: false, newer: true, reuse: false, stored: "a".repeat(64) });
});
test("corrupt persisted metadata fails closed and is replaced", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const store = window.ScannerStore.createScannerShellStore();
    await store.begin();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("wedding-scanner-shell-v1", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("authorization", "readwrite");
        tx.objectStore("authorization").put(
          { generation: "corrupt", grant: { html: "private" } },
          "current",
        );
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };
    });
    return { current: await store.current(), generation: await store.begin() };
  });
  expect(result.current).toBeNull();
  expect(result.generation).toMatch(/^[a-f0-9-]{36}$/);
});
test("closes a malformed database connection so it can be repaired", async ({ page }) => {
  const result = await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("wedding-scanner-shell-v1", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
    });
    let rejected = false;
    try {
      await window.ScannerStore.createScannerShellStore().current();
    } catch {
      rejected = true;
    }
    const deleted = await new Promise<boolean>((resolve) => {
      const request = indexedDB.deleteDatabase("wedding-scanner-shell-v1");
      request.onsuccess = () => resolve(true);
      request.onblocked = request.onerror = () => resolve(false);
    });
    return { rejected, deleted };
  });
  expect(result).toEqual({ rejected: true, deleted: true });
});

test("a separate worker reads the durable grant and invalidates a pending window save", async ({
  page,
}) => {
  const bundle = await build({
    entryPoints: ["src/modules/checkin/browser/scanner-shell-store.ts"],
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "ScannerStore",
    write: false,
  });
  const source = bundle.outputFiles[0]?.text;
  if (!source) throw new Error("Worker fixture bundle missing");
  const result = await page.evaluate(async (source) => {
    const store = window.ScannerStore.createScannerShellStore();
    const grant = {
      version: 1 as const,
      session: "a".repeat(64),
      build: "b".repeat(64),
      preparedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      html: "<!doctype html><main>Scanner only</main>",
      headers: [["Content-Type", "text/html"]] as [string, string][],
      assets: ["/scanner-assets/scanner-" + "b".repeat(64) + ".js"],
    };
    await store.commit(await store.begin(), grant);
    const pending = await store.begin();
    const url = URL.createObjectURL(
      new Blob(
        [
          source,
          `
      onmessage = async () => {
        try {
          const store = ScannerStore.createScannerShellStore();
          const grant = await store.current();
          await store.invalidate();
          postMessage({ grant });
        } catch (error) { postMessage({ error: String(error) }); }
      };
    `,
        ],
        { type: "text/javascript" },
      ),
    );
    const worker = new Worker(url);
    try {
      const response = await new Promise<{ grant?: typeof grant; error?: string }>(
        (resolve, reject) => {
          worker.onmessage = (event) => resolve(event.data);
          worker.onerror = (event) => reject(new Error(event.message));
          worker.postMessage("read-and-invalidate");
        },
      );
      return {
        response,
        saved: await store.commit(pending, grant),
        current: await store.current(),
        grant,
      };
    } finally {
      worker.terminate();
      URL.revokeObjectURL(url);
    }
  }, source);
  expect(result.response.error).toBeUndefined();
  expect(result.response.grant).toEqual(result.grant);
  expect(result.saved).toBe(false);
  expect(result.current).toBeNull();
});

test("an authorized replacement hides the old shell without letting stale preparations clear newer state", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const store = window.ScannerStore.createScannerShellStore();
    const grant = {
      version: 1 as const,
      session: "a".repeat(64),
      build: "b".repeat(64),
      preparedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      html: "<main>Scanner</main>",
      headers: [] as [string, string][],
      assets: ["/scanner-assets/scanner-" + "b".repeat(64) + ".js"],
    };
    await store.commit(await store.begin(), grant);
    const stale = await store.begin();
    const same = await store.begin();
    const retained = await store.authorize(same, grant.session, grant.expiresAt);
    const sameGrant = await store.current();
    const rejected = await store.authorize(stale, "c".repeat(64), grant.expiresAt);
    const afterStale = await store.current();
    const replacement = await store.begin();
    const changed = await store.authorize(replacement, "c".repeat(64), grant.expiresAt);
    const hidden = await store.current();
    const oldSave = await store.commit(same, grant);
    const saved = await store.commit(replacement, { ...grant, session: "c".repeat(64) });
    return {
      retained,
      sameSession: sameGrant?.session,
      rejected,
      afterStale: afterStale?.session,
      changed,
      hidden,
      oldSave,
      saved,
      finalSession: (await store.current())?.session,
    };
  });
  expect(result).toEqual({
    retained: true,
    sameSession: "a".repeat(64),
    rejected: false,
    afterStale: "a".repeat(64),
    changed: true,
    hidden: null,
    oldSave: false,
    saved: true,
    finalSession: "c".repeat(64),
  });
});

test("a delayed denial cannot erase a newer grant and a matching denial consumes its token", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const store = window.ScannerStore.createScannerShellStore();
    const grant = {
      version: 1 as const,
      session: "a".repeat(64),
      build: "b".repeat(64),
      preparedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      html: "<main>Scanner</main>",
      headers: [] as [string, string][],
      assets: ["/scanner-assets/scanner-" + "b".repeat(64) + ".js"],
    };
    const stale = await store.begin();
    await store.commit(await store.begin(), grant);
    const discardedStale = await store.discard(stale);
    const retained = await store.current();
    const current = await store.begin();
    const discardedCurrent = await store.discard(current);
    const republished = await store.commit(current, grant);
    return {
      discardedStale,
      retained: retained?.session,
      discardedCurrent,
      republished,
      final: await store.current(),
    };
  });
  expect(result).toEqual({
    discardedStale: false,
    retained: "a".repeat(64),
    discardedCurrent: true,
    republished: false,
    final: null,
  });
});

for (const scenario of ["new-session-and-build", "shorter-deadline", "expired-deadline"] as const) {
  test(`known ${scenario} invalidates an older shell even when preparation cannot finish`, async ({
    page,
  }) => {
    const result = await page.evaluate(async (scenario) => {
      const store = window.ScannerStore.createScannerShellStore();
      const now = Date.now();
      const old = {
        version: 1 as const,
        session: "a".repeat(64),
        build: "b".repeat(64),
        preparedAt: now - 120_000,
        expiresAt: now + 600_000,
        html: "<main>Old scanner</main>",
        headers: [] as [string, string][],
        assets: ["/scanner-assets/scanner-" + "b".repeat(64) + ".js"],
      };
      await store.commit(await store.begin(), old);
      const fresh = {
        ...old,
        session: scenario === "new-session-and-build" ? "c".repeat(64) : old.session,
        build: scenario === "new-session-and-build" ? "d".repeat(64) : old.build,
        expiresAt: scenario === "expired-deadline" ? now - 1 : now + 60_000,
      };
      let assetRequests = 0;
      const runtime = window.ScannerStore.createScannerShellRuntime({
        store,
        storage: caches,
        origin: location.origin,
        build: old.build,
        fetcher: async (url) => {
          if (url.endsWith("/checkin/offline-shell"))
            return new Response(JSON.stringify(fresh), {
              headers: { "X-Wedding-Scanner-Shell": "1", "Content-Type": "application/json" },
            });
          assetRequests += 1;
          throw new Error("Connection lost during asset download");
        },
      });
      const outcome = await runtime.prepare();
      return {
        outcome,
        current: await store.current(),
        document: await runtime.document(),
        assetRequests,
      };
    }, scenario);
    expect(result.outcome.state).toBe(scenario === "expired-deadline" ? "denied" : "unavailable");
    expect(result.current).toBeNull();
    expect(result.document).toBeNull();
    expect(result.assetRequests).toBe(scenario === "shorter-deadline" ? 1 : 0);
  });
}
