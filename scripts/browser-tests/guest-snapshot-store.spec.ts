import { build } from "esbuild";
import { expect, test } from "@playwright/test";
import type { createGuestSnapshotStore } from "../../src/modules/checkin/browser/guest-snapshot-store";
import type { parseGuestSnapshot } from "../../src/modules/checkin/lib/guest-snapshot";

declare global {
  interface Window {
    SnapshotStore: {
      createGuestSnapshotStore: typeof createGuestSnapshotStore;
      parseGuestSnapshot: typeof parseGuestSnapshot;
    };
  }
}
test.beforeEach(async ({ page }) => {
  const bundle = await build({
    stdin: {
      contents:
        'export { createGuestSnapshotStore } from "./src/modules/checkin/browser/guest-snapshot-store"; export { parseGuestSnapshot } from "./src/modules/checkin/lib/guest-snapshot";',
      resolveDir: process.cwd(),
      loader: "ts",
    },
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "SnapshotStore",
    write: false,
  });
  const script = bundle.outputFiles[0];
  if (!script) throw new Error("Snapshot fixture bundle missing");
  await page.route("http://localhost:32919/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Private snapshot fixture</title>",
    }),
  );
  await page.goto("http://localhost:32919/");
  await page.addScriptTag({ content: script.text });
});

test("durable session-bound snapshot survives reopening but logout defeats pending publication", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const store = window.SnapshotStore.createGuestSnapshotStore(
      window.SnapshotStore.parseGuestSnapshot,
    );
    const authority = { session: "a".repeat(64), expiresAt: Date.now() + 60_000 };
    const snapshot = {
      version: 1 as const,
      ...authority,
      generatedAt: Date.now(),
      keys: [{ kid: "test", alg: "Ed25519" as const, spki: "MCowBQYDK2VwAyEA" + "A".repeat(43) }],
      invitations: [],
    };
    const saved = await store.commit(await store.begin(), snapshot, authority);
    const reopened = window.SnapshotStore.createGuestSnapshotStore(
      window.SnapshotStore.parseGuestSnapshot,
    );
    const restored = await reopened.current(authority);
    const pending = await store.begin();
    await reopened.invalidate();
    return {
      saved,
      restored,
      late: await store.commit(pending, snapshot, authority),
      final: await reopened.current(authority),
      snapshot,
    };
  });
  expect(result.saved).toBe(true);
  expect(result.restored).toEqual(result.snapshot);
  expect(result.late).toBe(false);
  expect(result.final).toBeNull();
});

test("shorter authority and expiry erase only the private snapshot", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const store = window.SnapshotStore.createGuestSnapshotStore(
      window.SnapshotStore.parseGuestSnapshot,
    );
    const now = Date.now();
    const authority = { session: "a".repeat(64), expiresAt: now + 60_000 };
    const snapshot = {
      version: 1 as const,
      ...authority,
      generatedAt: now,
      keys: [{ kid: "test", alg: "Ed25519" as const, spki: "MCowBQYDK2VwAyEA" + "A".repeat(43) }],
      invitations: [],
    };
    await store.commit(await store.begin(), snapshot, authority);
    const shorter = { ...authority, expiresAt: now + 30_000 };
    const clamped = await store.current(shorter);
    const expired = await store.current(shorter, shorter.expiresAt);
    return {
      deadline: clamped?.expiresAt,
      expected: shorter.expiresAt,
      expired,
      cold: await store.current(authority),
    };
  });
  expect(result.deadline).toBe(result.expected);
  expect(result.expired).toBeNull();
  expect(result.cold).toBeNull();
});

test("a trusted expired refresh erases the older copy but stale generations cannot erase a replacement", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const store = window.SnapshotStore.createGuestSnapshotStore(
      window.SnapshotStore.parseGuestSnapshot,
    );
    const now = Date.now();
    const authority = { session: "a".repeat(64), expiresAt: now + 60_000 };
    const snapshot = {
      version: 1 as const,
      ...authority,
      generatedAt: now,
      keys: [{ kid: "test", alg: "Ed25519" as const, spki: "MCowBQYDK2VwAyEA" + "A".repeat(43) }],
      invitations: [],
    };
    await store.commit(await store.begin(), snapshot, authority);
    const stale = await store.begin();
    const replacement = await store.begin();
    const rejectedStale = await store.authorize(stale, { ...authority, expiresAt: now - 1 });
    const retained = await store.current(authority);
    const expired = await store.authorize(replacement, { ...authority, expiresAt: now - 1 });
    return {
      rejectedStale,
      retained: retained?.session,
      expired,
      final: await store.current(authority),
    };
  });
  expect(result).toEqual({
    rejectedStale: false,
    retained: "a".repeat(64),
    expired: false,
    final: null,
  });
});
