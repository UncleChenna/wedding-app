// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useGuestSnapshot } from "../components/use-guest-snapshot";
import { readGuestSnapshot } from "../browser/guest-snapshot-client";
import { scannerWorkerMessage } from "../browser/scanner-worker-message";
import type { GuestSnapshot } from "../lib/guest-snapshot";
vi.mock("../browser/guest-snapshot-client", () => ({ readGuestSnapshot: vi.fn() }));
vi.mock("../browser/scanner-worker-message", () => ({ scannerWorkerMessage: vi.fn() }));
const session = "a".repeat(64);
function snapshot(): GuestSnapshot {
  return {
    version: 1,
    session,
    generatedAt: Date.now(),
    expiresAt: Date.now() + 60_000,
    keys: [],
    invitations: [],
  };
}
beforeEach(() => {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: new EventTarget(),
  });
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  vi.mocked(scannerWorkerMessage).mockResolvedValue({ state: "ready" });
  vi.mocked(readGuestSnapshot).mockResolvedValue(snapshot());
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.useRealTimers();
});
it("refreshes after StrictMode replay and exposes metadata only", async () => {
  const deadline = Date.now() + 60_000;
  const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;
  const { result } = renderHook(() => useGuestSnapshot({ session, expiresAt: deadline }), {
    wrapper,
  });
  await waitFor(() => expect(result.current.summary).not.toBeNull());
  expect(Object.keys(result.current.summary ?? {}).sort()).toEqual(["expiresAt", "generatedAt"]);
  expect(result.current.refreshing).toBe(false);
});
it("drops a late refresh reply after logout notification", async () => {
  let release: ((value: GuestSnapshot) => void) | undefined;
  vi.mocked(readGuestSnapshot).mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const deadline = Date.now() + 60_000;
  const { result } = renderHook(() => useGuestSnapshot({ session, expiresAt: deadline }));
  await waitFor(() => expect(readGuestSnapshot).toHaveBeenCalled());
  act(() =>
    navigator.serviceWorker.dispatchEvent(
      new MessageEvent("message", { data: { type: "SCANNER_INVALIDATED" } }),
    ),
  );
  await act(async () => {
    release?.(snapshot());
  });
  expect(result.current.summary).toBeNull();
  expect(result.current.refreshing).toBe(false);
});
it("retains same-session cached metadata when offline without claiming a successful refresh", async () => {
  Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
  const deadline = Date.now() + 60_000;
  const { result } = renderHook(() => useGuestSnapshot({ session, expiresAt: deadline }));
  await waitFor(() => expect(result.current.summary).not.toBeNull());
  expect(scannerWorkerMessage).not.toHaveBeenCalledWith("REFRESH_GUEST_SNAPSHOT", session);
  expect(result.current.failed).toBe(true);
});
it("coalesces rapid resume events and locks exactly at expiry despite a pending reply", async () => {
  vi.useFakeTimers();
  let release: ((value: GuestSnapshot) => void) | undefined;
  vi.mocked(readGuestSnapshot).mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const deadline = Date.now() + 1000;
  const { result } = renderHook(() => useGuestSnapshot({ session, expiresAt: deadline }));
  await act(async () => {
    await Promise.resolve();
  });
  act(() => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(
    vi
      .mocked(scannerWorkerMessage)
      .mock.calls.filter(([type]) => type === "REFRESH_GUEST_SNAPSHOT"),
  ).toHaveLength(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(result.current.refreshing).toBe(false);
  expect(result.current.summary).toBeNull();
  await act(async () => {
    release?.(snapshot());
  });
  expect(result.current.summary).toBeNull();
  expect(scannerWorkerMessage).toHaveBeenCalledWith("SCANNER_STATUS");
});
