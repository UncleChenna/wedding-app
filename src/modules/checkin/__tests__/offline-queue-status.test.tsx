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

it("waits for preparation and refreshes automatically after it completes", async () => {
  deps.status.mockResolvedValueOnce(null);
  render(<OfflineQueueStatus session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  await waitFor(() => expect(deps.status).toHaveBeenCalledOnce());
  expect(screen.getByText(/Preparing saved records/)).toBeInTheDocument();
  expect(screen.queryByText(/could not be checked/)).toBeNull();
  fireEvent(window, new Event("scanner-preparation-complete"));
  expect(await screen.findByText("2 records are waiting to sync.")).toBeInTheDocument();
});
it("keeps a real unavailable queue unavailable after preparation", async () => {
  deps.status.mockResolvedValue(null);
  render(<OfflineQueueStatus session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  await waitFor(() => expect(deps.status).toHaveBeenCalledOnce());
  fireEvent(window, new Event("scanner-preparation-complete"));
  expect(await screen.findByText(/could not be checked/)).toBeInTheDocument();
  expect(screen.queryByText(/No records are waiting/)).toBeNull();
});
it("does not lose preparation completion during an earlier probe", async () => {
  let release: (value: null) => void = () => {};
  deps.status.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  render(<OfflineQueueStatus session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  await waitFor(() => expect(deps.status).toHaveBeenCalledOnce());
  fireEvent(window, new Event("scanner-preparation-complete"));
  await act(async () => release(null));
  expect(await screen.findByText("2 records are waiting to sync.")).toBeInTheDocument();
  expect(deps.status).toHaveBeenCalledTimes(2);
});
it("does not recheck after unmount while preparation is completing", async () => {
  let release: (value: null) => void = () => {};
  deps.status.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const view = render(
    <OfflineQueueStatus session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />,
  );
  await waitFor(() => expect(deps.status).toHaveBeenCalledOnce());
  fireEvent(window, new Event("scanner-preparation-complete"));
  view.unmount();
  await act(async () => release(null));
  expect(deps.status).toHaveBeenCalledOnce();
});
