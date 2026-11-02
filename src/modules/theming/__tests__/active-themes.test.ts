import { afterEach, describe, expect, it, vi } from "vitest";

const ports = vi.hoisted(() => ({
  load: vi.fn(),
  save: vi.fn(),
  tag: vi.fn(),
  life: vi.fn(),
  invalidate: vi.fn(),
  warn: vi.fn(),
}));
vi.mock("next/cache", () => ({
  cacheTag: ports.tag,
  cacheLife: ports.life,
  revalidateTag: ports.invalidate,
}));
vi.mock("@/modules/shared/lib/logger", () => ({ logger: { child: () => ({ warn: ports.warn }) } }));
vi.mock("../server/theme-repository", () => ({
  loadThemeSelection: ports.load,
  saveThemeSelection: ports.save,
}));

import { activateThemeSelection, getStoredActiveThemes } from "../server/active-themes";

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("theme cache boundary", () => {
  it("tags cached reads and resolves stored themes", async () => {
    ports.load.mockResolvedValue({ light: "blush-sage", dark: "emerald-night" });
    expect((await getStoredActiveThemes()).light.id).toBe("blush-sage");
    expect(ports.tag).toHaveBeenCalledWith("active-theme-pair");
    expect(ports.life).toHaveBeenCalledWith({ stale: 300, revalidate: 30, expire: 300 });
  });
  it("expires the same tag immediately after a persisted activation", async () => {
    ports.save.mockResolvedValue(undefined);
    await activateThemeSelection({ light: "ivory-gold", dark: "emerald-night" });
    expect(ports.save).toHaveBeenCalledWith({ light: "ivory-gold", dark: "emerald-night" });
    expect(ports.invalidate).toHaveBeenCalledWith("active-theme-pair", { expire: 0 });
    expect(ports.save.mock.invocationCallOrder[0]).toBeLessThan(
      ports.invalidate.mock.invocationCallOrder[0] ?? 0,
    );
  });
  it("bounds a stalled database read without exposing errors", async () => {
    vi.useFakeTimers();
    ports.load.mockImplementation(() => new Promise(() => {}));
    const result = getStoredActiveThemes();
    await vi.advanceTimersByTimeAsync(2000);
    expect((await result).dark.id).toBe("midnight-champagne");
    expect(ports.warn).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
