import { describe, expect, it } from "vitest";

import { ACTIVE_THEME_IDS, DEFAULT_COLOR_SCHEME } from "../config";
import { activeThemesToCssText, themeStyle, themeToCssText, themeToCssVars } from "../lib/css-vars";
import { getActiveTheme, getActiveThemes, getTheme, resolveActiveThemes } from "../lib/registry";
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

describe("activeThemesToCssText", () => {
  const themes = getActiveThemes();
  const css = activeThemesToCssText(themes);

  it("puts the light theme on :root and the dark theme behind prefers-color-scheme: dark", () => {
    const [light, dark] = css.split("@media (prefers-color-scheme: dark)");
    expect(light).toContain(`--t-color-background: ${themes.light.colors.background};`);
    expect(light).toContain("color-scheme: light;");
    expect(dark).toMatch(/^ \{ :root \{ /);
    expect(dark).toContain(`--t-color-background: ${themes.dark.colors.background};`);
    expect(dark).toContain("color-scheme: dark;");
  });

  it("resets the paper texture in a plain dark theme", () => {
    const dark = css.split("@media")[1];
    expect(dark).toContain("--t-pattern-image: none;");
    expect(dark).toContain("--t-pattern-opacity: 0;");
  });

  it("refuses values that could close the <style> element", () => {
    const evil = {
      ...themes.dark,
      shadows: { ...themes.dark.shadows, sm: "0 0 0 red</style><script>" },
    };
    expect(() => activeThemesToCssText({ light: themes.light, dark: evil })).toThrow(/"<"/);
  });
});

describe("registry", () => {
  it("returns the configured theme for each device colour scheme", () => {
    const themes = getActiveThemes();
    expect(themes.light.id).toBe(ACTIVE_THEME_IDS.light);
    expect(themes.dark.id).toBe(ACTIVE_THEME_IDS.dark);
    expect(themes.light.colorScheme).toBe("light");
    expect(themes.dark.colorScheme).toBe("dark");
  });

  it("uses the default scheme where no viewer is known", () => {
    expect(getActiveTheme().id).toBe(ACTIVE_THEME_IDS[DEFAULT_COLOR_SCHEME]);
    expect(getActiveTheme("dark").id).toBe(ACTIVE_THEME_IDS.dark);
  });

  it("rejects a theme placed in the other scheme's slot", () => {
    expect(() =>
      resolveActiveThemes({ light: "midnight-champagne", dark: "midnight-champagne" }),
    ).toThrow(/"midnight-champagne" is a dark theme and cannot be the light-mode theme/);
  });

  it("throws a helpful error for unknown themes", () => {
    expect(() => getTheme("nope")).toThrow(/Unknown theme "nope". Available: ivory-gold/);
  });
});
