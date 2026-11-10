// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LiveDashboard } from "../components/live-dashboard";

const counts = { invited: 12, attending: 24, arrived: 7, ordersOpen: 3, ordersServed: 9 };
const request = vi.fn<typeof fetch>();
const flush = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
};
beforeEach(() => {
  vi.useFakeTimers();
  request.mockReset().mockResolvedValue(Response.json(counts));
  vi.stubGlobal("fetch", request);
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("renders labelled counts and updates arrivals automatically", async () => {
  const { container } = render(<LiveDashboard />);
  await flush();
  expect(screen.getByText("Invitations sent")).toBeVisible();
  expect(container.querySelector('[data-counter="arrived"]')).toHaveTextContent("7");
  request.mockResolvedValue(Response.json({ ...counts, arrived: 9 }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(container.querySelector('[data-counter="arrived"]')).toHaveTextContent("9");
});

it("keeps last known counts visibly stale on failure, and recovers", async () => {
  const { container } = render(<LiveDashboard />);
  await flush();
  request.mockRejectedValue(new Error("network"));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(screen.getByRole("status")).toHaveTextContent("Showing the last received counts");
  expect(container.querySelector('[data-counter="arrived"]')).toHaveTextContent("7");
  request.mockResolvedValue(Response.json({ ...counts, arrived: 8 }));
  fireEvent.click(screen.getByRole("button", { name: "Refresh counts" }));
  await flush();
  expect(container.querySelector('[data-counter="arrived"]')).toHaveTextContent("8");
});

it("clears counts and stops polling when authorization expires", async () => {
  const { container } = render(<LiveDashboard />);
  await flush();
  request.mockResolvedValue(new Response(null, { status: 403 }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(screen.getByRole("link", { name: "Sign in" })).toBeVisible();
  expect(container.querySelector('[data-counter="arrived"]')).toHaveTextContent("—");
  const calls = request.mock.calls.length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10_000);
  });
  expect(request).toHaveBeenCalledTimes(calls);
  fireEvent(window, new Event("offline"));
  expect(screen.getByRole("link", { name: "Sign in" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Refresh counts" })).toBeNull();
});

it("pauses hidden tabs and ignores their late response after a newer denial", async () => {
  let complete: (response: Response) => void = () => {};
  request.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const { container } = render(<LiveDashboard />);
  Object.defineProperty(document, "hidden", { configurable: true, value: true });
  fireEvent(document, new Event("visibilitychange"));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10_000);
  });
  expect(request).toHaveBeenCalledTimes(1);
  request.mockResolvedValue(new Response(null, { status: 401 }));
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  fireEvent(document, new Event("visibilitychange"));
  await flush();
  complete(Response.json(counts));
  await flush();
  expect(screen.getByRole("link", { name: "Sign in" })).toBeVisible();
  expect(container.querySelector('[data-counter="arrived"]')).toHaveTextContent("—");
});

it("bounds stalled response bodies and permits retry without fabricating zeroes", async () => {
  request.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => new Promise(() => {}),
  } as Response);
  const { container } = render(<LiveDashboard />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(8000);
  });
  expect(screen.getByRole("status")).toHaveTextContent("couldn’t load");
  expect(container.querySelector('[data-counter="arrived"]')).toHaveTextContent("—");
  request.mockResolvedValue(Response.json(counts));
  fireEvent.click(screen.getByRole("button", { name: "Refresh counts" }));
  await flush();
  expect(container.querySelector('[data-counter="arrived"]')).toHaveTextContent("7");
});
