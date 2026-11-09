// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Scanner } from "../components/scanner";
import { startQrCamera } from "../lib/camera-reader";
vi.mock("../lib/camera-reader", () => ({ startQrCamera: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("starts only on a user action and aborts on pause and unmount", async () => {
  const stop = vi.fn();
  vi.mocked(startQrCamera).mockResolvedValue({ stop, setTorch: async () => true });
  const view = render(<Scanner />);
  expect(startQrCamera).not.toHaveBeenCalled();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open camera" })));
  const options = vi.mocked(startQrCamera).mock.calls[0]?.[0];
  expect(options?.signal.aborted).toBe(false);
  act(() => options?.onTorchAvailable(true));
  expect(screen.getByRole("button", { name: "Light on" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Pause camera" }));
  expect(options?.signal.aborted).toBe(true);
  expect(stop).toHaveBeenCalled();
  view.unmount();
});
it("offers safe permission recovery and focuses real help without exposing a QR value", async () => {
  vi.mocked(startQrCamera).mockImplementation(async (options) => {
    options.onProblem("denied");
    return { stop: vi.fn(), setTorch: async () => false };
  });
  render(<Scanner />);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open camera" })));
  expect(screen.getByText(/Allow camera access/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Retry camera" })).toBeVisible();
  fireEvent.click(screen.getByRole("link", { name: "Manual check-in help" }));
  expect(document.activeElement?.id).toBe("manual-check-in-help");
  expect(screen.getByText(/Name search is not available yet/)).toBeVisible();
});
it("shows neutral reading feedback, never the private code or a grant of admission", async () => {
  vi.mocked(startQrCamera).mockResolvedValue({ stop: vi.fn(), setTorch: async () => true });
  render(<Scanner />);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open camera" })));
  const options = vi.mocked(startQrCamera).mock.calls[0]?.[0];
  act(() => {
    options?.onTorchAvailable(false);
    options?.onCode("private-qr-marker");
  });
  expect(screen.getByText("QR read")).toBeVisible();
  expect(screen.getByText(/before admitting anyone/)).toBeVisible();
  expect(document.body.textContent).not.toContain("private-qr-marker");
  expect(screen.queryByRole("button", { name: "Light on" })).not.toBeInTheDocument();
});
it("restores torch controls when retrying after a camera failure during a light change", async () => {
  let finish: ((result: boolean) => void) | undefined;
  const pending = new Promise<boolean>((resolve) => {
    finish = resolve;
  });
  vi.mocked(startQrCamera).mockResolvedValue({ stop: vi.fn(), setTorch: () => pending });
  render(<Scanner />);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open camera" })));
  const first = vi.mocked(startQrCamera).mock.calls[0]?.[0];
  act(() => first?.onTorchAvailable(true));
  fireEvent.click(screen.getByRole("button", { name: "Light on" }));
  expect(screen.getByRole("button", { name: "Light on" })).toBeDisabled();
  act(() => first?.onProblem("missing"));
  await act(async () => {
    finish?.(false);
  });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Retry camera" })));
  const next = vi.mocked(startQrCamera).mock.calls[1]?.[0];
  act(() => next?.onTorchAvailable(true));
  expect(screen.getByRole("button", { name: "Light on" })).toBeEnabled();
});
