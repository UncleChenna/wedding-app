// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { ScannerSession } from "../components/scanner-session";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
function Camera({ stop, start }: { stop: () => void; start: () => void }) {
  useEffect(() => stop, [stop]);
  return <button onClick={start}>Open camera</button>;
}
it("unmounts camera cleanup at the exact deadline without waiting for interaction", () => {
  vi.useFakeTimers();
  const expiry = Date.now() + 1000;
  const stop = vi.fn();
  const start = vi.fn();
  render(
    <ScannerSession expiresAt={expiry}>
      <Camera stop={stop} start={start} />
    </ScannerSession>,
  );
  fireEvent.click(screen.getByRole("button"));
  expect(start).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(1000));
  expect(stop).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Scanner locked")).toBeInTheDocument();
  expect(screen.queryByRole("button")).toBeNull();
});
it("blocks an expired click even when the timer has not had a chance to run", () => {
  vi.useFakeTimers();
  const expiry = Date.now() + 1000;
  const start = vi.fn();
  const stop = vi.fn();
  render(
    <ScannerSession expiresAt={expiry}>
      <Camera stop={stop} start={start} />
    </ScannerSession>,
  );
  vi.setSystemTime(expiry);
  fireEvent.click(screen.getByRole("button"));
  expect(start).not.toHaveBeenCalled();
  expect(stop).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Scanner locked")).toBeInTheDocument();
});
it("fails closed for missing or invalid expiry", () => {
  for (const expiresAt of [Number.NaN, 0, -1, Number.POSITIVE_INFINITY]) {
    const view = render(
      <ScannerSession expiresAt={expiresAt}>
        <button>Open camera</button>
      </ScannerSession>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    view.unmount();
  }
});
it("does not revive an expired scanner when the clock moves backwards", () => {
  vi.useFakeTimers();
  const initial = Date.now();
  render(
    <ScannerSession expiresAt={initial + 1000}>
      <button>Open camera</button>
    </ScannerSession>,
  );
  act(() => vi.advanceTimersByTime(1000));
  act(() => {
    vi.setSystemTime(initial);
    window.dispatchEvent(new Event("focus"));
  });
  expect(screen.queryByRole("button")).toBeNull();
});

it("stops camera tracks when the worker reports invalidation and ignores unrelated messages", () => {
  const previous = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
  const worker = new EventTarget();
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: worker });
  const stop = vi.fn();
  try {
    const view = render(
      <ScannerSession expiresAt={Date.now() + 60_000}>
        <Camera stop={stop} start={() => undefined} />
      </ScannerSession>,
    );
    act(() => worker.dispatchEvent(new MessageEvent("message", { data: { type: "UNRELATED" } })));
    expect(screen.getByRole("button")).toBeInTheDocument();
    act(() =>
      worker.dispatchEvent(new MessageEvent("message", { data: { type: "SCANNER_INVALIDATED" } })),
    );
    expect(stop).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button")).toBeNull();
    view.unmount();
    act(() =>
      worker.dispatchEvent(new MessageEvent("message", { data: { type: "SCANNER_INVALIDATED" } })),
    );
    expect(stop).toHaveBeenCalledTimes(1);
  } finally {
    cleanup();
    if (previous) Object.defineProperty(navigator, "serviceWorker", previous);
    else Reflect.deleteProperty(navigator, "serviceWorker");
  }
});
