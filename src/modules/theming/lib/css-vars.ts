import type { CSSProperties } from "react";

import { COLOR_TOKENS, RADIUS_TOKENS, SHADOW_TOKENS, type Theme } from "./schema";

export type CssVars = Record<`--${string}`, string>;

/**
 * Turn a theme into CSS custom properties. Tailwind utilities read these via
 * the mapping in src/app/globals.css, so applying them to any element restyles
 * everything inside it.
 */
export function themeToCssVars(theme: Theme): CssVars {
  const vars: CssVars = {};
  for (const token of COLOR_TOKENS) vars[`--t-color-${token}`] = theme.colors[token];
  for (const token of RADIUS_TOKENS) vars[`--t-radius-${token}`] = theme.radii[token];
  for (const token of SHADOW_TOKENS) vars[`--t-shadow-${token}`] = theme.shadows[token];
  vars["--t-font-display"] = `var(--font-${theme.fonts.display})`;
  vars["--t-font-body"] = `var(--font-${theme.fonts.body})`;
  if (theme.fonts.script) vars["--t-font-script"] = `var(--font-${theme.fonts.script})`;
  if (theme.pattern) {
    vars["--t-pattern-image"] = `url(${JSON.stringify(theme.pattern.src)})`;
    vars["--t-pattern-opacity"] = String(theme.pattern.strength);
    vars["--t-pattern-size"] = theme.pattern.size;
  } else {
    // Reset rather than omit: a plain theme scoped inside a patterned one must not inherit it.
    vars["--t-pattern-image"] = "none";
    vars["--t-pattern-opacity"] = "0";
  }
  return vars;
}

/** Inline style for an element that should render in `theme`. */
export function themeStyle(theme: Theme): CSSProperties {
  return {
    ...themeToCssVars(theme),
    colorScheme: theme.colorScheme,
  } as CSSProperties;
}

/** The same variables as a CSS rule body, e.g. for injecting into a test page. */
export function themeToCssText(theme: Theme, selector = ":root"): string {
  const body = Object.entries(themeToCssVars(theme))
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");
  return `${selector} { ${body} color-scheme: ${theme.colorScheme}; }`;
}
