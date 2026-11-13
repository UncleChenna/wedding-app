import { afterEach, describe, expect, it, vi } from "vitest";
import { boundedDiagnostic } from "../../e2e/support/bounded-diagnostic";

afterEach(() => vi.useRealTimers());
describe("bounded browser diagnostics", () => {
  it("preserves the exact successful result", async () => {
    expect(await boundedDiagnostic(Promise.resolve({ bytes: 183344 }), 20)).toEqual({
      available: true,
      value: { bytes: 183344 },
    });
  });
  it("records rejected diagnostics without leaking provider errors", async () => {
    expect(await boundedDiagnostic(Promise.reject(new Error("private response")), 20)).toEqual({
      available: false,
      reason: "rejected",
    });
  });
  it("settles a never-resolving diagnostic and clears its timer", async () => {
    vi.useFakeTimers();
    const result = boundedDiagnostic(new Promise<never>(() => undefined), 3000);
    await vi.advanceTimersByTimeAsync(3000);
    expect(await result).toEqual({ available: false, reason: "timeout" });
    expect(vi.getTimerCount()).toBe(0);
  });
  it("handles a rejection after timeout without an unhandled rejection", async () => {
    vi.useFakeTimers();
    let rejectLater: (reason: Error) => void = () => undefined;
    const promise = new Promise<never>((_, reject) => {
      rejectLater = reject;
    });
    const result = boundedDiagnostic(promise, 3000);
    await vi.advanceTimersByTimeAsync(3000);
    expect(await result).toEqual({ available: false, reason: "timeout" });
    rejectLater(new Error("late failure"));
    await Promise.resolve();
  });
});
