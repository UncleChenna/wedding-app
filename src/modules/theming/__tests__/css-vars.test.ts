import { describe, expect, it } from "vitest";

import { ACTIVE_THEME_ID } from "../config";
import { themeStyle, themeToCssText, themeToCssVars } from "../lib/css-vars";
import { getActiveTheme, getTheme } from "../lib/registry";
import { COLOR_TOKENS } from "../lib/schema";

describe("themeToCssVars", () => {
  const theme = getTheme("ivory-gold");

  it("emits a variable for every colour, radius, shadow and font", () => {
    const vars = themeToCssVars(theme);
    for (const token of COLOR_TOKENS) expect(vars[`--t-color-${token}`]).toBe(theme.colors[token]);
    expect(vars["--t-radius-md"]).toBe(theme.radii.md);
    expect(vars["--t-shadow-lg"]).toBe(theme.shadows.lg);
    expect(vars["--t-font-display"]).toBe("var(--font-cormorant)");
    expect(vars["--t-font-body"]).toBe("var(--font-inter)");
  });

  it("includes the colour scheme in the inline style", () => {
    expect(themeStyle(getTheme("midnight-champagne"))).toMatchObject({
      colorScheme: "dark",
    });
  });

  it("renders a CSS rule for a selector", () => {
    expect(themeToCssText(theme, ":root")).toMatch(/^:root \{ --t-color-background: #FBF8F3;/);
  });
});

describe("registry", () => {
  it("returns the configured active theme", () => {
    expect(getActiveTheme().id).toBe(ACTIVE_THEME_ID);
  });

  it("throws a helpful error for unknown themes", () => {
    expect(() => getTheme("nope")).toThrow(/Unknown theme "nope". Available: ivory-gold/);
  });
});
