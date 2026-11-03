// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Envelope } from "../components/envelope";
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(0), 0),
  );
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("opens once under StrictMode and preserves focus through skip and replay", () => {
  const view = render(
    <StrictMode>
      <Envelope initials={["U", "A"]} />
    </StrictMode>,
  );
  act(() => vi.advanceTimersByTime(1));
  const control = screen.getByRole("button", { name: "Skip opening" });
  control.focus();
  fireEvent.click(control);
  expect(screen.getByRole("button", { name: "Replay opening" })).toBe(control);
  expect(control).toHaveFocus();
  view.unmount();
  render(<Envelope initials={["U", "A"]} />);
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByRole("button", { name: "Skip opening" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Replay opening" }));
  expect(screen.getByRole("button", { name: "Skip opening" })).toBeVisible();
  act(() => vi.advanceTimersByTime(600));
  expect(screen.getByRole("button", { name: "Replay opening" })).toBeVisible();
});
it("bypasses automatic motion for an issued pass", () => {
  render(<Envelope initials={["U", "A"]} returning />);
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByRole("button", { name: "Skip opening" })).toBeNull();
});
it("stays open without movement under reduced motion", () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const { container } = render(<Envelope initials={["U", "A"]} />);
  act(() => vi.advanceTimersByTime(1));
  expect(container.querySelector('[data-opening="true"]')).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
});
it("continues when storage is denied", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Denied");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Denied");
  });
  render(<Envelope initials={["U", "A"]} />);
  act(() => vi.advanceTimersByTime(1));
  fireEvent.click(screen.getByRole("button", { name: "Skip opening" }));
  expect(screen.getByRole("button", { name: "Replay opening" })).toBeVisible();
});
