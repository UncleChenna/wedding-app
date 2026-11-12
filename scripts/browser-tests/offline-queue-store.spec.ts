import { test, expect, type Page } from "@playwright/test";
import { build } from "esbuild";
import type {
  createOfflineQueuePolicy,
  OfflineAttempt,
} from "../../src/modules/checkin/lib/offline-queue";
import type { createOfflineQueueStore } from "../../src/modules/checkin/browser/offline-queue-store";

declare global {
  interface Window {
    QueueLibrary: {
      createOfflineQueuePolicy: typeof createOfflineQueuePolicy;
      createOfflineQueueStore: typeof createOfflineQueueStore;
    };
    queueStore: ReturnType<typeof createOfflineQueueStore>;
  }
}
let source = "";
const origin = "http://localhost:32926";
const actor = { staffId: "11111111-1111-4111-8111-111111111111", deviceId: "a".repeat(64) };
const invitationId = "22222222-2222-4222-8222-222222222222";
const attempt = (id: string): OfflineAttempt => ({
  actor,
  session: "b".repeat(64),
  rejected: false,
  event: {
    clientEventId: id,
    invitationId,
    passVersion: 1,
    reportedAt: "2026-12-19T12:00:00.000Z",
    reportedResult: "valid",
    reportedPeople: 1,
    kind: "admission",
    inputMethod: "qr",
  },
});
test.beforeAll(async () => {
  const bundle = await build({
    stdin: {
      contents:
        'export {createOfflineQueuePolicy} from "./src/modules/checkin/lib/offline-queue"; export {createOfflineQueueStore} from "./src/modules/checkin/browser/offline-queue-store";',
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "browser",
    format: "iife",
    globalName: "QueueLibrary",
    write: false,
  });
  const file = bundle.outputFiles[0];
  if (!file) throw new Error("Missing queue bundle");
  source = file.text;
});
async function load(page: Page) {
  await page.addScriptTag({ content: source });
  await page.evaluate(() => {
    window.queueStore = window.QueueLibrary.createOfflineQueueStore(
      window.QueueLibrary.createOfflineQueuePolicy(),
    );
  });
}
test.beforeEach(async ({ page }) => {
  await page.route(`${origin}/**`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Offline queue storage</title>",
    }),
  );
  await page.goto(origin);
  await load(page);
});
test("ten durable admissions survive reload and repeated committed acknowledgements", async ({
  page,
}) => {
  const ids = Array.from({ length: 10 }, () => crypto.randomUUID());
  for (const id of ids)
    expect(
      await page.evaluate(
        (value) => window.queueStore.record(value, { kind: "known", remaining: 10 }),
        attempt(id),
      ),
    ).toBe("recorded");
  await page.reload();
  await load(page);
  const saved = await page.evaluate(() => window.queueStore.read());
  expect(saved.attempts.map((row) => row.event.clientEventId)).toEqual(ids);
  const generation = crypto.randomUUID();
  const acks = ids.map((clientEventId) => ({
    clientEventId,
    status: "duplicate",
    result: "valid",
    admitted: 1,
    conflict: false,
  }));
  expect(
    await page.evaluate(
      ({ actor, acks, generation }) => window.queueStore.acknowledge(actor, acks, generation),
      { actor, acks, generation },
    ),
  ).toBe(true);
  await page.reload();
  await load(page);
  const synced = await page.evaluate(() => window.queueStore.read());
  expect(synced.attempts).toEqual([]);
  expect(synced.receipts).toHaveLength(10);
  expect(synced.barriers).toEqual([{ actor, generation }]);
  expect(
    await page.evaluate(({ actor }) => window.queueStore.clearBarrier(actor, crypto.randomUUID()), {
      actor,
    }),
  ).toBe(false);
  expect(
    await page.evaluate(
      ({ actor, generation }) => window.queueStore.clearBarrier(actor, generation),
      { actor, generation },
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      (value) => window.queueStore.record(value, { kind: "known", remaining: 10 }),
      attempt(ids[0] ?? ""),
    ),
  ).toBe("duplicate");
  expect((await page.evaluate(() => window.queueStore.read())).attempts).toEqual([]);
});
test("concurrent local admission writes cannot overspend the same remaining place", async ({
  page,
}) => {
  const values = [attempt(crypto.randomUUID()), attempt(crypto.randomUUID())];
  const results = await page.evaluate(
    (values) =>
      Promise.all(
        values.map((value) => window.queueStore.record(value, { kind: "known", remaining: 1 })),
      ),
    values,
  );
  expect(results.sort()).toEqual(["recorded", "too_many"]);
  expect((await page.evaluate(() => window.queueStore.read())).attempts).toHaveLength(1);
});
test("quota failure rejects completion and preserves earlier durable evidence", async ({
  page,
}) => {
  const first = attempt(crypto.randomUUID());
  expect(
    await page.evaluate(
      (value) => window.queueStore.record(value, { kind: "known", remaining: 2 }),
      first,
    ),
  ).toBe("recorded");
  const result = await page.evaluate(async (value) => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "journal")
        throw new DOMException("Synthetic quota failure", "QuotaExceededError");
      return put.apply(this, args);
    };
    try {
      await window.queueStore.record(value, { kind: "known", remaining: 2 });
      return "incorrect success";
    } catch {
      return "write failed";
    } finally {
      IDBObjectStore.prototype.put = put;
    }
  }, attempt(crypto.randomUUID()));
  expect(result).toBe("write failed");
  expect((await page.evaluate(() => window.queueStore.read())).attempts).toEqual([first]);
});
test("malformed stored evidence fails closed without replacing it with an empty queue", async ({
  page,
}) => {
  const original = attempt(crypto.randomUUID());
  await page.evaluate(
    (value) => window.queueStore.record(value, { kind: "known", remaining: 2 }),
    original,
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("wedding-scanner-attempts-v1", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("journal", "readwrite");
          tx.objectStore("journal").put({ unexpected: "retained synthetic evidence" }, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
  );
  expect(
    await page.evaluate(async () => {
      try {
        await window.queueStore.read();
        return "incorrect success";
      } catch {
        return "recovery required";
      }
    }),
  ).toBe("recovery required");
  expect(
    await page.evaluate(
      () =>
        new Promise<unknown>((resolve, reject) => {
          const request = indexedDB.open("wedding-scanner-attempts-v1", 1);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction("journal", "readonly");
            const read = tx.objectStore("journal").get("current");
            read.onsuccess = () => resolve(read.result as unknown);
            tx.oncomplete = () => db.close();
          };
        }),
    ),
  ).toEqual({ unexpected: "retained synthetic evidence" });
});

test("a new operator's fresh canonical snapshot retires old barriers but preserves pending admissions", async ({
  page,
}) => {
  const first = attempt(crypto.randomUUID());
  const second = attempt(crypto.randomUUID());
  second.actor = { ...actor, staffId: "44444444-4444-4444-8444-444444444444" };
  await page.evaluate(
    (value) => window.queueStore.record(value, { kind: "known", remaining: 2 }),
    first,
  );
  await page.evaluate(
    (value) => window.queueStore.record(value, { kind: "known", remaining: 2 }),
    second,
  );
  await page.evaluate(
    ({ actor, id }) =>
      window.queueStore.acknowledge(
        actor,
        [{ clientEventId: id, status: "recorded", result: "valid", admitted: 1, conflict: false }],
        crypto.randomUUID(),
      ),
    { actor, id: first.event.clientEventId },
  );
  await page.reload();
  await load(page);
  const checkpoint = await page.evaluate(() => window.queueStore.read());
  expect(checkpoint.attempts).toEqual([second]);
  expect(
    await page.evaluate(
      (captured) => window.queueStore.clearCapturedBarriers(captured),
      checkpoint.barriers,
    ),
  ).toBe(1);
  const third = { ...second, event: { ...second.event, clientEventId: crypto.randomUUID() } };
  expect(
    await page.evaluate(
      (value) => window.queueStore.record(value, { kind: "known", remaining: 1 }),
      third,
    ),
  ).toBe("too_many");
  const recovered = await page.evaluate(() => window.queueStore.read());
  expect(recovered.barriers).toEqual([]);
  expect(recovered.attempts).toEqual([second]);
  expect(recovered.receipts).toHaveLength(1);
});
