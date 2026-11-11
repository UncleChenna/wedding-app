// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { clearScannerForSignOut } from "../browser/scanner-sign-out";
import { scannerWorkerMessage } from "../browser/scanner-worker-message";

const calls = vi.hoisted(() => ({ shell: vi.fn(), guests: vi.fn(), broadcast: vi.fn() }));
vi.mock("../browser/scanner-shell-store", () => ({
  createScannerShellStore: () => ({ invalidate: calls.shell }),
}));
vi.mock("../browser/guest-snapshot-store", () => ({
  createGuestSnapshotStore: () => ({ invalidate: calls.guests }),
}));
vi.mock("../browser/scanner-worker-message", () => ({ scannerWorkerMessage: vi.fn() }));
beforeEach(() => {
  calls.shell.mockResolvedValue(undefined);
  calls.guests.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: { request: async (_name: string, action: () => Promise<void>) => action() },
  });
  vi.stubGlobal(
    "BroadcastChannel",
    class {
      postMessage = calls.broadcast;
      close() {}
    },
  );
});
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
it("does not trust an older worker's shell-only removed acknowledgement", async () => {
  vi.mocked(scannerWorkerMessage).mockResolvedValue({ state: "removed" });
  expect(await clearScannerForSignOut()).toBe(true);
  expect(calls.shell).toHaveBeenCalledOnce();
  expect(calls.guests).toHaveBeenCalledOnce();
});
it("trusts only an explicit successful private snapshot erasure acknowledgement", async () => {
  vi.mocked(scannerWorkerMessage).mockResolvedValue({
    state: "removed",
    privateSnapshotRemoved: true,
  });
  expect(await clearScannerForSignOut()).toBe(true);
  expect(calls.shell).not.toHaveBeenCalled();
  expect(calls.guests).not.toHaveBeenCalled();
});
it("broadcasts lockout and refuses success when fallback private erasure fails", async () => {
  vi.mocked(scannerWorkerMessage).mockResolvedValue({ state: "removed" });
  calls.guests.mockRejectedValue(new Error("blocked"));
  expect(await clearScannerForSignOut()).toBe(false);
  expect(calls.broadcast).toHaveBeenCalledWith({ type: "SCANNER_INVALIDATED" });
});
