import { describe, expect, it } from "vitest";
import { generateTheme } from "../lib/generate-theme";
import { checkQrPolarity, checkThemeContrast } from "../lib/contrast";
import { loadTheme } from "../lib/load-theme";
import { STATUS_TOKENS } from "../lib/status";
import { getTheme } from "../lib/registry";

describe("seed theme generation", () => {
  const seeds = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#777777",
    "#D6BE8D",
  ];
  let state = 22;
  for (let i = 0; i < 20; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    seeds.push("#" + (state & 0xffffff).toString(16).padStart(6, "0"));
  }
  for (const colorScheme of ["light", "dark"] as const) {
    for (const seed of seeds) {
      it(`${colorScheme} ${seed} yields a complete readable palette with fixed statuses`, () => {
        const base = getTheme(colorScheme === "light" ? "ivory-gold" : "midnight-champagne");
        const before = structuredClone(base);
        const result = generateTheme({ seed, secondarySeed: "#ABCDEF", colorScheme });
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(result.error);
        expect(loadTheme(result.theme)).toEqual(result.theme);
        expect(checkThemeContrast(result.theme)).toEqual([]);
        expect(checkQrPolarity(result.theme)).toBeNull();
        for (const token of STATUS_TOKENS)
          expect(result.theme.colors[token]).toBe(base.colors[token]);
        expect(result.theme.colors.decorative).toBe("#ABCDEF");
        expect(result.theme.pattern).toBeUndefined();
        expect(base).toEqual(before);
        expect(generateTheme({ seed, secondarySeed: "#ABCDEF", colorScheme })).toEqual(result);
      });
    }
  }
  it("supports one seed and custom identity without mutating another result", () => {
    const first = generateTheme({ seed: "#d6be8d", id: "our-wedding", name: "Our wedding" });
    const second = generateTheme({ seed: "#d6be8d", id: "our-wedding", name: "Our wedding" });
    expect(first.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error("Expected valid seeds");
    expect(first.theme.id).toBe("our-wedding");
    expect(first.theme.name).toBe("Our wedding");
    expect(first.theme.colors.decorative).toBe("#D6BE8D");
    first.theme.colors.primary = "#000000";
    expect(second.theme.colors.primary).not.toBe("#000000");
  });
  it("uses the second seed for an independently coloured accent", () => {
    const one = generateTheme({ seed: "#123456" });
    const two = generateTheme({ seed: "#123456", secondarySeed: "#654321" });
    if (!one.ok || !two.ok) throw new Error("Expected valid seeds");
    expect(two.theme.colors.primary).toBe(one.theme.colors.primary);
    expect(two.theme.colors.accent).not.toBe(one.theme.colors.accent);
  });
  it.each([
    null,
    {},
    { seed: "#fff" },
    { seed: "red" },
    { seed: "#123456", secondarySeed: "" },
    { seed: "#123456", colorScheme: "sepia" },
    { seed: "#123456", id: "../bad" },
    { seed: "#123456", name: "" },
  ])("returns an expected error for invalid input %j", (input) => {
    expect(generateTheme(input)).toEqual({ ok: false, error: expect.any(String) });
  });
});
