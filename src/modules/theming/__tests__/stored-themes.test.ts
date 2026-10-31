import { describe, expect, it, vi } from "vitest";
import { readStoredThemes, activateStoredThemes } from "../server/stored-themes";

describe("stored theme selection", () => {
  it("resolves both persisted device schemes", async () => {
    const result = await readStoredThemes(
      async () => ({ light: "blush-sage", dark: "emerald-night" }),
      vi.fn(),
    );
    expect(result.themes.light.id).toBe("blush-sage");
    expect(result.themes.dark.id).toBe("emerald-night");
    expect(result.fallback).toBe(false);
  });
  it.each([
    null,
    { light: "unknown", dark: "emerald-night" },
    { light: "emerald-night", dark: "ivory-gold" },
  ])("uses safe defaults for missing or invalid configuration", async (value) => {
    const warn = vi.fn();
    const result = await readStoredThemes(async () => value, warn);
    expect(result.themes.light.id).toBe("ivory-gold");
    expect(result.themes.dark.id).toBe("midnight-champagne");
    expect(result.fallback).toBe(true);
    expect(warn).toHaveBeenCalledOnce();
  });
  it("does not expose database errors in warnings", async () => {
    const warn = vi.fn();
    const result = await readStoredThemes(async () => {
      throw new Error("postgres://private");
    }, warn);
    expect(result.fallback).toBe(true);
    expect(JSON.stringify(warn.mock.calls)).not.toContain("postgres");
  });
  it("writes the validated pair before invalidating", async () => {
    const events: string[] = [];
    const save = vi.fn(async () => {
      events.push("save");
    });
    await activateStoredThemes({ light: "blush-sage", dark: "emerald-night" }, save, () => {
      events.push("invalidate");
    });
    expect(save).toHaveBeenCalledWith({ light: "blush-sage", dark: "emerald-night" });
    expect(events).toEqual(["save", "invalidate"]);
  });
  it("rejects invalid input without writing or invalidating", async () => {
    const save = vi.fn();
    const invalidate = vi.fn();
    await expect(
      activateStoredThemes({ light: "emerald-night", dark: "ivory-gold" }, save, invalidate),
    ).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
  });
  it("does not invalidate after a failed write", async () => {
    const invalidate = vi.fn();
    await expect(
      activateStoredThemes(
        { light: "ivory-gold", dark: "midnight-champagne" },
        vi.fn().mockRejectedValue(new Error("unavailable")),
        invalidate,
      ),
    ).rejects.toThrow("unavailable");
    expect(invalidate).not.toHaveBeenCalled();
  });
});
