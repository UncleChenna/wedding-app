import { afterEach, expect, it, vi } from "vitest";
import { readLiveManual } from "../browser/manual-client";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it("maps an authorization denial before reading private output and rejects a mismatched selection", async () => {
  const json = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ status: 403, json })),
  );
  expect(
    await readLiveManual({ operation: "search", query: "Ada" }, new AbortController().signal),
  ).toEqual({ state: "session_expired" });
  expect(json).not.toHaveBeenCalled();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        state: "selection",
        invitationId: "550e8400-e29b-41d4-a716-446655440000",
        version: 1,
        result: { state: "not_rsvped" },
      }),
    ),
  );
  expect(
    await readLiveManual({ operation: "search", query: "Ada" }, new AbortController().signal),
  ).toEqual({ state: "unavailable" });
});
it("aborts a stalled response body within the read budget", async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => ({
      status: 200,
      json: () =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), {
            once: true,
          }),
        ),
    })),
  );
  const pending = readLiveManual(
    { operation: "search", query: "Ada" },
    new AbortController().signal,
  );
  const rejected = expect(pending).rejects.toThrow("aborted");
  await vi.advanceTimersByTimeAsync(5000);
  await rejected;
});
