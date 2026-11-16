import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import {
  developmentWorkerBootstrap,
  developmentWorkerResponse,
} from "../server/development-worker";

const origin = "http://localhost:3000";
const own = { scriptURL: origin + "/sw.js" };
async function run({
  worker = own,
  controller = own,
  scope = origin + "/",
  removed = true,
  registration = true,
  attempted = false,
} = {}) {
  const unregister = vi.fn().mockResolvedValue(removed);
  const reload = vi.fn();
  const caches = { delete: vi.fn() };
  const indexedDB = { deleteDatabase: vi.fn() };
  runInNewContext(developmentWorkerBootstrap, {
    URL,
    location: { origin, reload },
    navigator: {
      serviceWorker: {
        controller,
        getRegistration: vi
          .fn()
          .mockResolvedValue(registration ? { scope, active: worker, unregister } : undefined),
      },
    },
    sessionStorage: {
      getItem: () => (attempted ? "1" : null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    },
    caches,
    indexedDB,
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { unregister, reload, caches, indexedDB };
}
describe("development worker retirement", () => {
  it("retires the owned worker and reloads without deleting offline storage", async () => {
    const result = await run();
    expect(result.unregister).toHaveBeenCalledOnce();
    expect(result.reload).toHaveBeenCalledOnce();
    expect(result.caches.delete).not.toHaveBeenCalled();
    expect(result.indexedDB.deleteDatabase).not.toHaveBeenCalled();
  });
  it("bounds recovery to one reload even if a stale tab registers again", async () => {
    const result = await run({ attempted: true });
    expect(result.unregister).toHaveBeenCalledOnce();
    expect(result.reload).not.toHaveBeenCalled();
  });
  it("does not touch an unrelated worker", async () => {
    const result = await run({ worker: { scriptURL: origin + "/other-worker.js" } });
    expect(result.unregister).not.toHaveBeenCalled();
    expect(result.reload).not.toHaveBeenCalled();
  });
  it("does not touch a nested scope", async () => {
    const result = await run({ scope: origin + "/another-app/" });
    expect(result.unregister).not.toHaveBeenCalled();
  });
  it("does not reload when unregister fails", async () => {
    const result = await run({ removed: false });
    expect(result.reload).not.toHaveBeenCalled();
  });
  it("reloads a tab whose own controller was already unregistered by another tab", async () => {
    const result = await run({ registration: false });
    expect(result.reload).toHaveBeenCalledOnce();
  });
  it("serves a network-only development worker without a manifest or storage operations", async () => {
    const response = developmentWorkerResponse();
    const handlers = vi.fn();
    runInNewContext(await response.text(), { self: { addEventListener: handlers } });
    expect(handlers).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("Content-Type")).toContain("application/javascript");
  });
});
