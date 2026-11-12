// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GuestSnapshotScanner } from "../components/guest-snapshot-scanner";
import { readLivePass, type ScanResolver } from "../components/scanner";
import { readGuestSnapshot } from "../browser/guest-snapshot-client";
import { resolveSnapshotRead } from "../lib/resolve-snapshot-read";
import { scannerWorkerMessage } from "../browser/scanner-worker-message";
import type { AdmissionResponse } from "../lib/online-admission";
import { recordOfflineAttempt } from "../browser/offline-queue-client";
import { readLiveManual } from "../browser/manual-client";
vi.mock("../components/offline-queue-status", () => ({ OfflineQueueStatus: () => null }));
const refresh = vi.hoisted(() => vi.fn());
const resolvedReads = vi.hoisted(() => vi.fn());
vi.mock("../browser/offline-queue-client", () => ({ recordOfflineAttempt: vi.fn() }));
vi.mock("../components/use-guest-snapshot", () => ({
  useGuestSnapshot: () => ({
    summary: null,
    now: Date.now(),
    refreshing: false,
    failed: false,
    refresh,
  }),
}));
vi.mock("../components/scanner", () => ({
  readLivePass: vi.fn(),
  Scanner: ({
    resolveRead,
    allowAdmission,
    onAdmissionOutcome,
    onManualSearch,
  }: {
    resolveRead: ScanResolver;
    allowAdmission: boolean;
    onAdmissionOutcome?: (response: AdmissionResponse) => void;
    onManualSearch?: () => void;
  }) => (
    <>
      <button onClick={onManualSearch}>Find guest by name</button>
      <button
        data-admission={String(allowAdmission)}
        onClick={() =>
          void resolveRead("signed fixture", new AbortController().signal).then(resolvedReads)
        }
      >
        Check fixture
      </button>
      <button onClick={() => onAdmissionOutcome?.({ state: "revoked" })}>Refused admission</button>
      <button onClick={() => onAdmissionOutcome?.({ state: "session_expired" })}>
        Denied admission
      </button>
    </>
  ),
}));
vi.mock("../browser/guest-snapshot-client", () => ({ readGuestSnapshot: vi.fn() }));
vi.mock("../browser/manual-client", () => ({ readLiveManual: vi.fn() }));
vi.mock("../lib/resolve-snapshot-read", () => ({ resolveSnapshotRead: vi.fn() }));
vi.mock("../browser/scanner-worker-message", () => ({ scannerWorkerMessage: vi.fn() }));
beforeEach(() => {
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
});
it("manual search cannot bypass a known-change cache barrier after failed erasure", async () => {
  vi.mocked(scannerWorkerMessage).mockResolvedValue({ state: "unavailable" });
  render(<GuestSnapshotScanner session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  fireEvent.click(screen.getByRole("button", { name: "Refused admission" }));
  await waitFor(() => expect(refresh).toHaveBeenCalled());
  Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
  fireEvent.click(screen.getByRole("button", { name: "Find guest by name" }));
  fireEvent.change(screen.getByLabelText("Guest name"), { target: { value: "Ada" } });
  fireEvent.click(screen.getByRole("button", { name: /^Find guest$/ }));
  await screen.findByText("Guest search is unavailable. Try again or ask the gate lead for help.");
  expect(readGuestSnapshot).not.toHaveBeenCalled();
});
it("manual live authorization denial unmounts names and cannot fall back to private cache", async () => {
  vi.mocked(readLiveManual).mockResolvedValue({ state: "session_expired" });
  render(<GuestSnapshotScanner session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  fireEvent.click(screen.getByRole("button", { name: "Find guest by name" }));
  fireEvent.change(screen.getByLabelText("Guest name"), { target: { value: "Ada" } });
  fireEvent.click(screen.getByRole("button", { name: /^Find guest$/ }));
  await waitFor(() =>
    expect(scannerWorkerMessage).toHaveBeenCalledWith("DENY_SCANNER_SESSION", "a".repeat(64)),
  );
  expect(screen.queryByLabelText("Guest name")).toBeNull();
  expect(readGuestSnapshot).not.toHaveBeenCalled();
});
it("blocks cached fallback when a later admission is revoked and erasure/refresh fail", async () => {
  vi.mocked(scannerWorkerMessage).mockResolvedValue({ state: "unavailable" });
  render(<GuestSnapshotScanner session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  fireEvent.click(screen.getByRole("button", { name: "Refused admission" }));
  await waitFor(() => expect(refresh).toHaveBeenCalledWith(true));
  expect(scannerWorkerMessage).toHaveBeenCalledWith("INVALIDATE_GUEST_SNAPSHOT", "a".repeat(64));
  Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
  fireEvent.click(screen.getByRole("button", { name: "Check fixture" }));
  await waitFor(() => expect(readGuestSnapshot).not.toHaveBeenCalled());
});
it("locks the camera session when an admission returns authoritative session denial", async () => {
  render(<GuestSnapshotScanner session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  fireEvent.click(screen.getByRole("button", { name: "Denied admission" }));
  await waitFor(() =>
    expect(scannerWorkerMessage).toHaveBeenCalledWith("DENY_SCANNER_SESSION", "a".repeat(64)),
  );
  expect(screen.queryByRole("button", { name: "Check fixture" })).toBeNull();
  expect(readGuestSnapshot).not.toHaveBeenCalled();
});
it("does not let an older successful erase acknowledgement clear a newer failed invalidation", async () => {
  let releaseFirst: (value: unknown) => void = () => {};
  vi.mocked(scannerWorkerMessage)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseFirst = resolve;
        }),
    )
    .mockResolvedValueOnce({ state: "unavailable" });
  render(<GuestSnapshotScanner session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  fireEvent.click(screen.getByRole("button", { name: "Refused admission" }));
  fireEvent.click(screen.getByRole("button", { name: "Refused admission" }));
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  releaseFirst({ privateSnapshotRemoved: true });
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
  Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
  fireEvent.click(screen.getByRole("button", { name: "Check fixture" }));
  expect(readGuestSnapshot).not.toHaveBeenCalled();
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
it("falls back to cached read-only results after a live connection failure", async () => {
  vi.mocked(readLivePass).mockRejectedValue(new Error("offline"));
  vi.mocked(readGuestSnapshot).mockResolvedValue({
    version: 1,
    session: "a".repeat(64),
    expiresAt: Date.now() + 60_000,
    generatedAt: Date.now(),
    keys: [],
    invitations: [],
  });
  vi.mocked(resolveSnapshotRead).mockResolvedValue({ state: "unknown" });
  render(<GuestSnapshotScanner session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  fireEvent.click(screen.getByRole("button", { name: "Check fixture" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Check fixture" })).toHaveAttribute(
      "data-admission",
      "false",
    ),
  );
  expect(screen.getByText(/No entry is recorded by an offline check/)).toBeVisible();
});
it("never falls back to cached access after an authoritative sign-in denial", async () => {
  vi.mocked(readLivePass).mockResolvedValue({ state: "session_expired" });
  render(<GuestSnapshotScanner session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  fireEvent.click(screen.getByRole("button", { name: "Check fixture" }));
  await waitFor(() =>
    expect(scannerWorkerMessage).toHaveBeenCalledWith("DENY_SCANNER_SESSION", "a".repeat(64)),
  );
  expect(readGuestSnapshot).not.toHaveBeenCalled();
});
it("discards the matching private copy before refreshing an authoritative revoked result", async () => {
  vi.mocked(readLivePass).mockResolvedValue({ state: "revoked" });
  render(<GuestSnapshotScanner session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  fireEvent.click(screen.getByRole("button", { name: "Check fixture" }));
  await waitFor(() => expect(refresh).toHaveBeenCalledWith(true));
  expect(scannerWorkerMessage).toHaveBeenCalledWith("INVALIDATE_GUEST_SNAPSHOT", "a".repeat(64));
  expect(vi.mocked(scannerWorkerMessage).mock.invocationCallOrder[0]).toBeLessThan(
    refresh.mock.invocationCallOrder[0] ?? 0,
  );
});
it("refuses cached fallback after known-change erasure was not acknowledged", async () => {
  vi.mocked(readLivePass)
    .mockResolvedValueOnce({ state: "revoked" })
    .mockRejectedValue(new Error("offline"));
  vi.mocked(scannerWorkerMessage).mockResolvedValue({ state: "unavailable" });
  render(<GuestSnapshotScanner session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  fireEvent.click(screen.getByRole("button", { name: "Check fixture" }));
  await waitFor(() => expect(refresh).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("button", { name: "Check fixture" }));
  await waitFor(() => expect(readLivePass).toHaveBeenCalledTimes(2));
  expect(readGuestSnapshot).not.toHaveBeenCalled();
});

it("discards a stale green read when a deferred durable observation finds all places used", async () => {
  Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
  vi.mocked(readGuestSnapshot).mockResolvedValue({
    version: 2,
    actor: { staffId: "550e8400-e29b-41d4-a716-446655440000", deviceId: "b".repeat(64) },
    session: "a".repeat(64),
    generatedAt: Date.now(),
    expiresAt: Date.now() + 60_000,
    keys: [],
    invitations: [],
  });
  vi.mocked(resolveSnapshotRead).mockResolvedValue({
    state: "valid",
    guest: { name: "Synthetic", partySize: 1, admittedSoFar: 0, tableNumber: null, admissions: [] },
  });
  let release: () => void = () => {};
  vi.mocked(recordOfflineAttempt).mockImplementation(
    (input) =>
      new Promise((resolve) => {
        release = () =>
          resolve({
            state: "recorded",
            clientEventId: input.clientEventId,
            people: 0,
            result: "already_used",
          });
      }),
  );
  render(<GuestSnapshotScanner session={"a".repeat(64)} expiresAt={Date.now() + 60_000} />);
  fireEvent.click(screen.getByRole("button", { name: "Check fixture" }));
  await waitFor(() => expect(recordOfflineAttempt).toHaveBeenCalledOnce());
  expect(resolvedReads).not.toHaveBeenCalled();
  release();
  await waitFor(() => expect(resolvedReads).toHaveBeenCalledWith({ state: "unavailable" }));
});
