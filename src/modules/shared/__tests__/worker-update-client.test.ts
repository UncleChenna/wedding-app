import { describe, expect, it, vi } from "vitest";
import { reloadWithEmptyQueue, parseUpdateReply } from "../browser/worker-update-client";

describe("update reload safety", () => {
  it("holds the scanner publication lock through the final read and reload", async () => {
    let held = false;
    const reload = vi.fn(() => expect(held).toBe(true));
    const result = await reloadWithEmptyQueue({
      locks: {
        request: async (_name, operation) => {
          held = true;
          try {
            return await operation();
          } finally {
            held = false;
          }
        },
      },
      read: async () => {
        expect(held).toBe(true);
        return { attempts: [] };
      },
      reload,
    });
    expect(result).toEqual({ state: "ready", pending: 0 });
    expect(reload).toHaveBeenCalledOnce();
  });
  it("does not reload when any retained attempt remains, including rejected attempts", async () => {
    const reload = vi.fn();
    expect(
      await reloadWithEmptyQueue({
        locks: { request: async (_name, operation) => operation() },
        read: async () => ({ attempts: [{ rejected: true }] }),
        reload,
      }),
    ).toEqual({ state: "deferred", pending: 1 });
    expect(reload).not.toHaveBeenCalled();
  });
  it("fails closed when locking or durable evidence is unavailable", async () => {
    const reload = vi.fn();
    expect(await reloadWithEmptyQueue({ read: async () => ({ attempts: [] }), reload })).toEqual({
      state: "unavailable",
    });
    expect(
      await reloadWithEmptyQueue({
        locks: { request: async (_name, operation) => operation() },
        read: async () => {
          throw new Error("evicted");
        },
        reload,
      }),
    ).toEqual({ state: "unavailable" });
    expect(reload).not.toHaveBeenCalled();
  });
  it("rejects malformed or contradictory worker replies", () => {
    expect(parseUpdateReply({ state: "ready", pending: 2 })).toEqual({ state: "unavailable" });
    expect(parseUpdateReply({ state: "deferred", pending: 0 })).toEqual({ state: "unavailable" });
    expect(parseUpdateReply({ state: "ready", pending: 0 })).toEqual({
      state: "ready",
      pending: 0,
    });
  });
});

class UpdateWorker extends EventTarget {
  reply: unknown = { state: "ready", pending: 0 };
  calls: unknown[] = [];
  activate?: () => void;
  postMessage(value: { type: string }, ports: Transferable[]) {
    this.calls.push(value);
    const port = ports[0] as MessagePort;
    port.postMessage(this.reply);
    if (
      value.type === "ACTIVATE_WORKER_UPDATE" &&
      (this.reply as { state: string }).state === "ready"
    )
      this.activate?.();
  }
}
async function fixture() {
  const { watchWorkerUpdates } = await import("../browser/worker-update-client");
  const worker = new UpdateWorker();
  const registration = Object.assign(new EventTarget(), { waiting: worker, installing: null });
  const container = Object.assign(new EventTarget(), { controller: new UpdateWorker() });
  const publish = vi.fn(),
    reload = vi.fn(async () => ({ state: "ready" as const, pending: 0 as const }));
  worker.activate = () => {
    registration.waiting = null as unknown as UpdateWorker;
    container.controller = worker;
    container.dispatchEvent(new Event("controllerchange"));
  };
  const watcher = watchWorkerUpdates(
    registration as unknown as ServiceWorkerRegistration,
    container as unknown as ServiceWorkerContainer,
    publish,
    reload,
  );
  return { worker, container, registration, publish, reload, watcher };
}
describe("waiting-worker notifications", () => {
  it("detects an existing waiting update, allows Later, and never activates on dismissal", async () => {
    const f = await fixture();
    try {
      await vi.waitFor(() =>
        expect(f.publish).toHaveBeenLastCalledWith({ state: "ready", pending: 0 }),
      );
      f.watcher.dismiss();
      await f.watcher.refresh();
      expect(f.publish).toHaveBeenLastCalledWith({ state: "hidden" });
      expect(f.worker.calls).not.toContainEqual({ type: "ACTIVATE_WORKER_UPDATE" });
      expect(f.reload).not.toHaveBeenCalled();
    } finally {
      f.watcher.dispose();
    }
  });
  it("keeps the page when the worker refuses activation with pending evidence", async () => {
    const f = await fixture();
    try {
      f.worker.reply = { state: "deferred", pending: 3 };
      await f.watcher.accept();
      expect(f.publish).toHaveBeenLastCalledWith({ state: "deferred", pending: 3 });
      expect(f.reload).not.toHaveBeenCalled();
    } finally {
      f.watcher.dispose();
    }
  });
  it("waits for the requested worker to control the page, then checks reload safety", async () => {
    const f = await fixture();
    try {
      await f.watcher.accept();
      expect(f.container.controller).toBe(f.worker);
      expect(f.reload).toHaveBeenCalledOnce();
    } finally {
      f.watcher.dispose();
    }
  });
  it("does not automatically reload when another tab activates an update", async () => {
    const f = await fixture();
    try {
      f.worker.activate?.();
      await vi.waitFor(() =>
        expect(f.publish).toHaveBeenLastCalledWith({ state: "ready", pending: 0 }),
      );
      expect(f.reload).not.toHaveBeenCalled();
    } finally {
      f.watcher.dispose();
    }
  });
  it("ignores outstanding replies after unmount", async () => {
    const f = await fixture();
    f.watcher.dispose();
    f.publish.mockClear();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(f.publish).not.toHaveBeenCalled();
    expect(f.reload).not.toHaveBeenCalled();
  });
});
