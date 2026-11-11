// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Scanner, type ScanResolver } from "../components/scanner";
import { startQrCamera } from "../lib/camera-reader";
import type { ScanReadResult } from "../lib/scan-read-result";
vi.mock("../lib/camera-reader", () => ({ startQrCamera: vi.fn() }));
const guest = { name: "Ada", partySize: 2, admittedSoFar: 0, tableNumber: 7, admissions: [] };
const initial: ScanResolver = async () => ({ state: "valid", guest });
const used: ScanReadResult = { state: "already_used", guest: { ...guest, admittedSoFar: 2 } };
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
async function scan(qr = "private pass") {
  vi.mocked(startQrCamera).mockResolvedValue({ stop: vi.fn(), setTorch: async () => false });
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: /Open camera|Scan next pass/ })),
  );
  await act(async () => vi.mocked(startQrCamera).mock.calls.at(-1)?.[0].onCode(qr));
}
it("updates an already displayed pass without rescanning or authorizing admission", async () => {
  const refresh: ScanResolver = async () => used;
  const view = render(<Scanner resolveRead={initial} refreshRead={refresh} readRevision={0} />);
  await scan();
  expect(screen.getByRole("heading", { name: "Valid pass" })).toBeVisible();
  await act(async () =>
    view.rerender(<Scanner resolveRead={initial} refreshRead={refresh} readRevision={1} />),
  );
  expect(screen.getByRole("heading", { name: "Already used" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Admit 2 guests" })).toBeNull();
  expect(startQrCamera).toHaveBeenCalledOnce();
});
it("preserves pending and uncertain intent during a canonical allowance change", async () => {
  const lost = Promise.withResolvers<never>();
  const submit = vi
    .fn()
    .mockImplementationOnce(() => lost.promise)
    .mockResolvedValueOnce({
      state: "duplicate",
      people: 2,
      recordedAt: "2026-12-19T12:00:00.000Z",
    });
  const refresh: ScanResolver = async () => used;
  const props = { resolveRead: initial, refreshRead: refresh, submitAdmission: submit };
  const view = render(<Scanner {...props} readRevision={0} />);
  await scan();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Admit 2 guests" })));
  await act(async () => view.rerender(<Scanner {...props} readRevision={1} />));
  expect(screen.getByText(/updated since this check/i)).toBeVisible();
  await act(async () => lost.reject(new Error("committed receipt lost")));
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Retry this admission" })),
  );
  expect(submit.mock.calls[1]?.[0]).toEqual(submit.mock.calls[0]?.[0]);
  expect(screen.getByRole("heading", { name: "Already recorded" })).toBeVisible();
});
it("fences a slow refresh when a different QR is scanned", async () => {
  const pending = Promise.withResolvers<ScanReadResult>();
  const refresh = vi.fn(() => pending.promise);
  const resolve: ScanResolver = async (qr) => ({
    state: "valid",
    guest: { ...guest, name: qr === "first" ? "Ada" : "Uchenna" },
  });
  const props = { resolveRead: resolve, refreshRead: refresh };
  const view = render(<Scanner {...props} readRevision={0} />);
  await scan("first");
  await act(async () => view.rerender(<Scanner {...props} readRevision={1} />));
  await scan("second");
  await act(async () => pending.resolve(used));
  expect(screen.getByText("Uchenna")).toBeVisible();
  expect(screen.queryByText("Ada")).toBeNull();
  expect(screen.getByRole("heading", { name: "Valid pass" })).toBeVisible();
});
it("fences an older response after a newer revision denies the pass", async () => {
  const pending = Promise.withResolvers<ScanReadResult>();
  const refresh = vi
    .fn<ScanResolver>()
    .mockImplementationOnce(() => pending.promise)
    .mockResolvedValueOnce({ state: "revoked" });
  const props = { resolveRead: initial, refreshRead: refresh };
  const view = render(<Scanner {...props} readRevision={0} />);
  await scan();
  await act(async () => view.rerender(<Scanner {...props} readRevision={1} />));
  await act(async () => view.rerender(<Scanner {...props} readRevision={2} />));
  expect(screen.getByRole("heading", { name: "Revoked pass" })).toBeVisible();
  await act(async () => pending.resolve({ state: "valid", guest }));
  expect(screen.getByRole("heading", { name: "Revoked pass" })).toBeVisible();
});
it("clears an obsolete deferred change when the newest canonical state matches the displayed check", async () => {
  const submit = vi.fn().mockResolvedValue({ state: "unavailable" });
  const refresh = vi
    .fn<ScanResolver>()
    .mockResolvedValueOnce(used)
    .mockResolvedValueOnce({ state: "valid", guest });
  const props = { resolveRead: initial, refreshRead: refresh, submitAdmission: submit };
  const view = render(<Scanner {...props} readRevision={0} />);
  await scan();
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Admit 2 guests" })));
  await act(async () => view.rerender(<Scanner {...props} readRevision={1} />));
  expect(screen.getByText(/updated since this check/i)).toBeVisible();
  await act(async () => view.rerender(<Scanner {...props} readRevision={2} />));
  expect(screen.queryByText(/updated since this check/i)).toBeNull();
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Retry this admission" })),
  );
  expect(submit.mock.calls[1]?.[0]).toEqual(submit.mock.calls[0]?.[0]);
});
