// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { ScannerOfflineControls } from "../components/scanner-offline-controls";
import { scannerWorkerMessage } from "../browser/scanner-worker-message";
import type * as WorkerMessages from "../browser/scanner-worker-message";
import { clearScannerForSignOut } from "../browser/scanner-sign-out";
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("../browser/scanner-sign-out", () => ({ clearScannerForSignOut: vi.fn() }));
vi.mock("../browser/scanner-worker-message", async (original) => ({
  ...(await original<typeof WorkerMessages>()),
  scannerWorkerMessage: vi.fn(),
}));
beforeEach(() => {
  const worker = Object.assign(new EventTarget(), { controller: {} });
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: worker });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
const expiresAt = () => Date.now() + 60_000;
function view(deadline = expiresAt(), clearSession = vi.fn()) {
  return render(
    <ScannerOfflineControls
      session={"a".repeat(64)}
      expiresAt={deadline}
      signOut={vi.fn()}
      clearSession={clearSession}
    >
      <button>Open camera</button>
    </ScannerOfflineControls>,
  );
}
it("reports offline readiness only after save and a complete usable status", async () => {
  const prepared = vi.fn();
  window.addEventListener("scanner-preparation-complete", prepared, { once: true });
  const deadline = expiresAt();
  vi.mocked(scannerWorkerMessage)
    .mockResolvedValueOnce({ state: "ready" })
    .mockResolvedValueOnce({
      state: "ready",
      session: "a".repeat(64),
      build: "b".repeat(64),
      expiresAt: deadline,
    });
  view(deadline);
  expect(await screen.findByText(/Camera ready for an offline reload/)).toBeInTheDocument();
  expect(scannerWorkerMessage).toHaveBeenNthCalledWith(1, "SAVE_SCANNER");
  expect(scannerWorkerMessage).toHaveBeenNthCalledWith(2, "SCANNER_STATUS");
  expect(prepared).toHaveBeenCalledOnce();
});
it("allows online camera use when offline preparation fails and provides retry", async () => {
  vi.mocked(scannerWorkerMessage).mockResolvedValue({ state: "unavailable" });
  view();
  expect(await screen.findByText(/Offline camera not ready/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Open camera" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Prepare offline camera" }));
  await waitFor(() => expect(scannerWorkerMessage).toHaveBeenCalledTimes(2));
});
it("clears saved access both before and after the server removes the session cookie", async () => {
  vi.mocked(scannerWorkerMessage).mockResolvedValue({ state: "unavailable" });
  let resolve: (value: boolean) => void = () => undefined;
  vi.mocked(clearScannerForSignOut)
    .mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    )
    .mockResolvedValueOnce(false);
  const clearSession = vi.fn(async () => undefined);
  view(expiresAt(), clearSession);
  await screen.findByText(/Offline camera not ready/);
  const form = screen.getByRole("button", { name: "Sign out" }).closest("form");
  if (!form) throw new Error("missing form");
  fireEvent.submit(form);
  expect(screen.queryByRole("button", { name: "Open camera" })).toBeNull();
  expect(clearSession).not.toHaveBeenCalled();
  await act(async () => resolve(true));
  expect(clearSession).toHaveBeenCalledOnce();
  expect(clearScannerForSignOut).toHaveBeenCalledTimes(2);
  expect(clearSession.mock.invocationCallOrder[0]).toBeGreaterThan(
    vi.mocked(clearScannerForSignOut).mock.invocationCallOrder[0] ?? 0,
  );
  expect(clearSession.mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(clearScannerForSignOut).mock.invocationCallOrder[1] ?? 0,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(/clear saved access/);
});

it("does not claim sign-out when saved access could not be cleared", async () => {
  vi.mocked(scannerWorkerMessage).mockResolvedValue({ state: "unavailable" });
  vi.mocked(clearScannerForSignOut).mockResolvedValue(false);
  view();
  await screen.findByText(/Offline camera not ready/);
  const form = screen.getByRole("button", { name: "Sign out" }).closest("form");
  if (!form) throw new Error("missing form");
  const submit = vi.spyOn(form, "requestSubmit").mockImplementation(() => undefined);
  fireEvent.submit(form);
  expect(await screen.findByRole("alert")).toHaveTextContent(/clear saved access/);
  expect(submit).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Open camera" })).toBeNull();
});

it("does not strand preparation when StrictMode replaces the first effect", async () => {
  const deadline = expiresAt();
  let resolve: (value: unknown) => void = () => undefined;
  vi.mocked(scannerWorkerMessage)
    .mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    )
    .mockResolvedValueOnce({ state: "ready" })
    .mockResolvedValueOnce({
      state: "ready",
      session: "a".repeat(64),
      build: "b".repeat(64),
      expiresAt: deadline,
    });
  render(
    <StrictMode>
      <ScannerOfflineControls
        session={"a".repeat(64)}
        expiresAt={deadline}
        signOut={vi.fn()}
        clearSession={vi.fn()}
      >
        <button>Open camera</button>
      </ScannerOfflineControls>
    </StrictMode>,
  );
  await act(async () => resolve({ state: "unavailable" }));
  expect(await screen.findByText(/Camera ready for an offline reload/)).toBeInTheDocument();
});
