// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Scanner } from "../components/scanner";
import { startQrCamera } from "../lib/camera-reader";
vi.mock("../lib/camera-reader", () => ({ startQrCamera: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
it("preserves a pending and uncertain admission intent across phone visibility changes", async () => {
  vi.mocked(startQrCamera).mockResolvedValue({ stop: vi.fn(), setTorch: async () => false });
  let loseResponse: (() => void) | undefined;
  const submit = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          loseResponse = () => reject(new Error("Response lost after commit"));
        }),
    )
    .mockResolvedValueOnce({
      state: "duplicate",
      people: 2,
      recordedAt: "2026-12-19T12:00:00.000Z",
    });
  render(
    <Scanner
      resolveRead={async () => ({
        state: "valid",
        guest: {
          name: "Ada",
          partySize: 4,
          admittedSoFar: 0,
          tableNumber: 7,
          admissions: [],
        },
      })}
      submitAdmission={submit}
    />,
  );
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open camera" })));
  await act(async () => vi.mocked(startQrCamera).mock.calls[0]?.[0].onCode("private pass"));
  fireEvent.change(screen.getByLabelText("How many are here?"), { target: { value: "2" } });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Admit 2 guests" })));
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  await act(async () => loseResponse?.());
  hidden.mockReturnValue(false);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(screen.getByRole("button", { name: "Scan next pass" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Retry this admission" })).toBeVisible();
  hidden.mockReturnValue(true);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  hidden.mockReturnValue(false);
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Retry this admission" })),
  );
  expect(submit.mock.calls[1]?.[0]).toEqual(submit.mock.calls[0]?.[0]);
  expect(screen.getByRole("heading", { name: "Already recorded" })).toBeVisible();
  expect(startQrCamera).toHaveBeenCalledTimes(1);
});
it("shows sign-in expiry when the request proxy rejects an expired session", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () => new Response(JSON.stringify({ error: "Sign-in required." }), { status: 403 }),
    ),
  );
  vi.mocked(startQrCamera).mockResolvedValue({ stop: vi.fn(), setTorch: async () => false });
  render(<Scanner />);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open camera" })));
  const options = vi.mocked(startQrCamera).mock.calls[0]?.[0];
  await act(async () => options?.onCode("private signed pass"));
  expect(screen.getByRole("heading", { name: "Sign in again" })).toBeVisible();
  expect(document.body.textContent).not.toContain("private signed pass");
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
it("shows a checked result without exposing the private code or granting admission", async () => {
  vi.mocked(startQrCamera).mockResolvedValue({ stop: vi.fn(), setTorch: async () => true });
  render(<Scanner resolveRead={async () => ({ state: "invalid" })} />);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open camera" })));
  const options = vi.mocked(startQrCamera).mock.calls[0]?.[0];
  await act(async () => {
    options?.onTorchAvailable(false);
    options?.onCode("private-qr-marker");
  });
  expect(screen.getByRole("heading", { name: "Invalid pass" })).toBeVisible();
  expect(screen.getByText(/not that admission was recorded/)).toBeVisible();
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
it("ignores an older lookup finishing after a newer scan and clears private results before the next scan", async () => {
  vi.mocked(startQrCamera).mockResolvedValue({ stop: vi.fn(), setTorch: async () => false });
  let finish: ((value: { state: "invalid" }) => void) | undefined;
  const resolveRead = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce({
      state: "valid",
      guest: {
        name: "Synthetic guest",
        partySize: 2,
        admittedSoFar: 0,
        tableNumber: null,
        admissions: [],
      },
    });
  render(<Scanner resolveRead={resolveRead} />);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open camera" })));
  const options = vi.mocked(startQrCamera).mock.calls[0]?.[0];
  await act(async () => {
    options?.onTorchAvailable(false);
    options?.onCode("first");
  });
  await act(async () => options?.onCode("second"));
  expect(screen.getByText("Synthetic guest")).toBeVisible();
  await act(async () => finish?.({ state: "invalid" }));
  expect(screen.getByRole("heading", { name: "Valid pass" })).toBeVisible();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Scan next pass" })));
  expect(screen.queryByText("Synthetic guest")).toBeNull();
});
it("does not restore a result after camera pause while a lookup is in flight", async () => {
  vi.mocked(startQrCamera).mockResolvedValue({ stop: vi.fn(), setTorch: async () => false });
  let finish: ((value: { state: "invalid" }) => void) | undefined;
  render(
    <Scanner
      resolveRead={() =>
        new Promise((resolve) => {
          finish = resolve;
        })
      }
    />,
  );
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open camera" })));
  const options = vi.mocked(startQrCamera).mock.calls[0]?.[0];
  act(() => {
    options?.onTorchAvailable(false);
    options?.onCode("private");
  });
  fireEvent.click(screen.getByRole("button", { name: "Pause camera" }));
  await act(async () => finish?.({ state: "invalid" }));
  expect(screen.queryByRole("heading", { name: "Invalid pass" })).toBeNull();
});
