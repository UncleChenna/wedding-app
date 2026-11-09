// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { OfflineScannerSession } from "../components/offline-scanner-session";
import type * as WorkerMessages from "../browser/scanner-worker-message";
import { scannerWorkerMessage } from "../browser/scanner-worker-message";
vi.mock("../browser/scanner-worker-message", async (original) => ({
  ...(await original<typeof WorkerMessages>()),
  scannerWorkerMessage: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
const session = "a".repeat(64);
const build = "b".repeat(64);
const view = (expiresAt = Date.now() + 60_000) =>
  render(
    <OfflineScannerSession session={session} build={build} expiresAt={expiresAt}>
      <button>Camera</button>
    </OfflineScannerSession>,
  );
it("does not mount a camera until durable grant identity matches", async () => {
  let resolve: (value: unknown) => void = () => undefined;
  vi.mocked(scannerWorkerMessage).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  view();
  expect(screen.queryByRole("button")).toBeNull();
  await act(async () =>
    resolve({ state: "ready", session, build, expiresAt: Date.now() + 30_000 }),
  );
  expect(screen.getByRole("button", { name: "Camera" })).toBeInTheDocument();
});
it.each([
  { state: "unavailable" },
  { state: "ready", session: "c".repeat(64), build, expiresAt: Date.now() + 60_000 },
  { state: "ready", session, build: "c".repeat(64), expiresAt: Date.now() + 60_000 },
])("fails closed when initial status cannot confirm this document: %j", async (status) => {
  vi.mocked(scannerWorkerMessage).mockResolvedValue(status);
  await act(async () => {
    view();
  });
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByText("Scanner locked")).toBeInTheDocument();
});
it("does not reopen when a pending reply arrives after invalidation", async () => {
  const worker = new EventTarget();
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: worker });
  let resolve: (value: unknown) => void = () => undefined;
  vi.mocked(scannerWorkerMessage).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  view();
  act(() =>
    worker.dispatchEvent(new MessageEvent("message", { data: { type: "SCANNER_INVALIDATED" } })),
  );
  await act(async () =>
    resolve({ state: "ready", session, build, expiresAt: Date.now() + 60_000 }),
  );
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByText("Scanner locked")).toBeInTheDocument();
});
it("uses the earlier document deadline even if saved authorization lasts longer", async () => {
  vi.useFakeTimers();
  vi.mocked(scannerWorkerMessage).mockResolvedValue({
    state: "ready",
    session,
    build,
    expiresAt: Date.now() + 60_000,
  });
  await act(async () => {
    view(Date.now() + 1000);
  });
  expect(screen.getByRole("button")).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.queryByRole("button")).toBeNull();
});
