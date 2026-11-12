// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OfflineQueueStatus } from "../components/offline-queue-status";
const deps = vi.hoisted(() => ({ message: vi.fn(), status: vi.fn() }));
vi.mock("../browser/scanner-worker-message", () => ({ scannerWorkerMessage: deps.message }));
vi.mock("../browser/offline-queue-client", () => ({ readOfflineQueueStatus: deps.status }));
beforeEach(() => {
  deps.message.mockReset();
  deps.status.mockReset();
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  deps.status.mockResolvedValue({
    state: "ready",
    pending: 2,
    rejected: 0,
    otherOperator: 1,
    conflicts: 0,
    refreshRequired: false,
  });
});
afterEach(cleanup);
it("coalesces reconnect/resume events and retains pending counts after a failed upload", async () => {
  let release: (value: unknown) => void = () => {};
  deps.message.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  render(<OfflineQueueStatus session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  fireEvent(window, new Event("online"));
  fireEvent(document, new Event("visibilitychange"));
  expect(deps.message).toHaveBeenCalledTimes(1);
  await act(async () => release({ state: "unavailable" }));
  expect(await screen.findByText("2 records are waiting to sync.")).toBeInTheDocument();
  expect(screen.getByText(/belong to another operator/)).toBeInTheDocument();
  deps.message.mockResolvedValueOnce({ state: "synced" });
  deps.status.mockResolvedValueOnce({
    state: "ready",
    pending: 0,
    rejected: 0,
    otherOperator: 1,
    conflicts: 0,
    refreshRequired: false,
  });
  fireEvent.click(screen.getByRole("button", { name: "Retry sync" }));
  await waitFor(() =>
    expect(screen.getByText("No records are waiting for this operator.")).toBeInTheDocument(),
  );
  expect(deps.message).toHaveBeenCalledTimes(2);
});
it("does not start upload after the trusted session deadline", async () => {
  render(<OfflineQueueStatus session={"a".repeat(64)} expiresAt={Date.now() - 1} />);
  fireEvent(window, new Event("online"));
  fireEvent.click(screen.getByRole("button", { name: "Check saved records" }));
  expect(deps.message).not.toHaveBeenCalled();
  expect(deps.status).not.toHaveBeenCalled();
});
