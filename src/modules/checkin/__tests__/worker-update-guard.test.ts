import { expect, it, vi } from "vitest";
import { installWorkerUpdateGuard } from "../browser/worker-update-guard";
import { createOfflineQueuePolicy } from "../lib/offline-queue";
type Host = Parameters<typeof installWorkerUpdateGuard>[0];
function fixture() {
  let listener: Parameters<Host["addEventListener"]>[1] = () => {};
  const journal = createOfflineQueuePolicy().empty();
  const read = vi.fn(async () => journal);
  const broadcast = vi.fn();
  const skipWaiting = vi.fn(async () => {});
  const host: Host = {
    location: { origin: "https://wedding.test" },
    navigator: { locks: { request: (_name, run) => run() } },
    clients: {
      get: async () => ({ url: "https://wedding.test/checkin" }),
      matchAll: async () => [{ postMessage: broadcast }, { postMessage: broadcast }],
    },
    skipWaiting,
    addEventListener: (_type, handler) => {
      listener = handler;
    },
  };
  const guard = installWorkerUpdateGuard(host, () => ({ read }));
  async function send(type: string) {
    let work: Promise<unknown> = Promise.resolve();
    const reply = vi.fn();
    listener({
      data: { type, pending: 0, safeMigration: true },
      source: { id: "tab" },
      ports: [{ postMessage: reply }],
      waitUntil: (promise) => {
        work = promise;
      },
    });
    await work;
    return reply.mock.calls[0]?.[0];
  }
  return { host, guard, read, journal, send, skipWaiting, broadcast };
}
it("defers every tab for pending or rejected evidence, ignoring caller overrides", async () => {
  const f = fixture();
  // Only length is consumed here; real shape validation is covered by store/browser tests.
  f.journal.attempts.length = 2;
  expect(await f.send("ACTIVATE_WORKER_UPDATE")).toEqual({ state: "deferred", pending: 2 });
  expect(f.skipWaiting).not.toHaveBeenCalled();
  expect(f.broadcast).toHaveBeenCalledTimes(2);
  f.journal.attempts.length = 0;
  expect(await f.send("ACTIVATE_WORKER_UPDATE")).toEqual({ state: "ready", pending: 0 });
  expect(f.skipWaiting).toHaveBeenCalledOnce();
});
it("fails closed on unavailable coordination or incompatible journal without cleanup", async () => {
  const f = fixture();
  f.read.mockRejectedValue(new Error("unsupported journal"));
  expect(await f.send("ACTIVATE_WORKER_UPDATE")).toEqual({ state: "unavailable" });
  expect(await f.guard.cleanUp(async () => {})).toBe(false);
  expect(f.skipWaiting).not.toHaveBeenCalled();
  f.host.navigator = undefined;
  expect(await f.guard.cleanUp(async () => {})).toBe(false);
});
it("rejects nonlocal message senders", async () => {
  const f = fixture();
  f.host.clients.get = async () => ({ url: "https://unrelated.test/" });
  expect(await f.send("ACTIVATE_WORKER_UPDATE")).toBeUndefined();
  expect(f.read).not.toHaveBeenCalled();
});

it("holds the publication lock through cleanup, not only the compatibility read", async () => {
  const f = fixture();
  let locked = false;
  f.host.navigator = {
    locks: {
      request: async (_name, run) => {
        locked = true;
        try {
          return await run();
        } finally {
          locked = false;
        }
      },
    },
  };
  const cleanup = vi.fn(async () => {
    expect(locked).toBe(true);
  });
  expect(await f.guard.cleanUp(cleanup)).toBe(true);
  expect(cleanup).toHaveBeenCalledOnce();
  f.read.mockRejectedValue(new Error("future format"));
  expect(await f.guard.cleanUp(cleanup)).toBe(false);
  expect(cleanup).toHaveBeenCalledOnce();
});
