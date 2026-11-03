import { afterEach, describe, expect, it, vi } from "vitest";
import { readManifestCoupleNames } from "../server/manifest-names";
import { defaultEventSettings } from "../lib/event-settings";
afterEach(() => vi.useRealTimers());
describe("public manifest name loading", () => {
  it("uses validated stored names", async () => {
    const warn = vi.fn();
    expect(await readManifestCoupleNames(async () => [" Ada ", "Chenna"], warn)).toEqual([
      "Ada",
      "Chenna",
    ]);
    expect(warn).not.toHaveBeenCalled();
  });
  it("falls back without exposing database errors", async () => {
    const warn = vi.fn();
    expect(
      await readManifestCoupleNames(async () => {
        throw new Error("private database details");
      }, warn),
    ).toEqual(defaultEventSettings.coupleNames);
    expect(warn).toHaveBeenCalledExactlyOnceWith();
  });
  it("rejects invalid stored names", async () => {
    const warn = vi.fn();
    expect(await readManifestCoupleNames(async () => ["", "Ada"], warn)).toEqual(
      defaultEventSettings.coupleNames,
    );
    expect(warn).toHaveBeenCalledOnce();
  });
  it("bounds a stalled read and clears its timer", async () => {
    vi.useFakeTimers();
    const warn = vi.fn();
    const names = readManifestCoupleNames(() => new Promise(() => {}), warn);
    await vi.advanceTimersByTimeAsync(2000);
    expect(await names).toEqual(defaultEventSettings.coupleNames);
    expect(warn).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
