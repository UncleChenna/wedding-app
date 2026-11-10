import { afterEach, describe, expect, it, vi } from "vitest";
import { startScannerUpdates } from "../lib/scanner-updates";
import type { subscribeStation } from "@/modules/shared/lib/station-channel";

type Subscription = Parameters<typeof subscribeStation>[0];
function setup() {
  let callbacks: Subscription | undefined;
  const unsubscribe = vi.fn();
  const refresh = vi.fn(async () => {});
  const invalidate = vi.fn(async () => {});
  const signedOut = vi.fn();
  const subscribe = vi.fn((options: Subscription) => {
    callbacks = options;
    return unsubscribe;
  });
  const stop = startScannerUpdates({
    client: {} as Subscription["client"],
    refresh,
    invalidate,
    signedOut,
    subscribe,
  });
  if (!callbacks) throw new Error("Missing station subscription");
  return { callbacks, unsubscribe, refresh, invalidate, signedOut, stop };
}
afterEach(() => {
  vi.useRealTimers();
});

describe("scanner live updates", () => {
  it("joins only gate and invalidates canonical data on admission notifications without trusting counts", async () => {
    vi.useFakeTimers();
    const state = setup();
    expect(state.callbacks.station).toBe("gate");
    state.callbacks.onEvent("checkin.recorded", { admitted: 900 });
    await vi.advanceTimersByTimeAsync(0);
    expect(state.invalidate).toHaveBeenCalledOnce();
    expect(state.refresh).toHaveBeenCalledOnce();
    expect(state.refresh).toHaveBeenCalledWith();
    state.stop();
  });
  it("refetches on joins and keeps polling below15s even if token acquisition never resolves", async () => {
    vi.useFakeTimers();
    const state = setup();
    state.callbacks.onResync();
    await vi.advanceTimersByTimeAsync(0);
    expect(state.refresh).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(state.refresh.mock.calls.length).toBeGreaterThanOrEqual(2);
    state.stop();
  });
  it("stops subscription, timers and late callbacks after expiry or unmount", async () => {
    vi.useFakeTimers();
    const state = setup();
    state.stop();
    state.callbacks.onEvent("checkin.recorded", {});
    state.callbacks.onResync();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(state.unsubscribe).toHaveBeenCalledOnce();
    expect(state.refresh).not.toHaveBeenCalled();
    expect(state.invalidate).not.toHaveBeenCalled();
  });
  it("denies the session and stops when live authorization is refused", async () => {
    vi.useFakeTimers();
    const state = setup();
    state.callbacks.onStatus?.("signed-out");
    await vi.advanceTimersByTimeAsync(30_000);
    expect(state.signedOut).toHaveBeenCalledOnce();
    expect(state.unsubscribe).toHaveBeenCalledOnce();
    expect(state.refresh).not.toHaveBeenCalled();
  });
  it("does not refresh after a pending invalidation completes following stop", async () => {
    vi.useFakeTimers();
    const state = setup();
    let finish: (() => void) | undefined;
    state.invalidate.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    state.callbacks.onEvent("checkin.recorded", {});
    state.stop();
    finish?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(state.refresh).not.toHaveBeenCalled();
  });
  it("isolates failed refreshes and resumes polling without an unhandled rejection", async () => {
    vi.useFakeTimers();
    const state = setup();
    state.refresh.mockRejectedValueOnce(new Error("offline"));
    state.callbacks.onResync();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(state.refresh.mock.calls.length).toBeGreaterThanOrEqual(2);
    state.stop();
  });
});
