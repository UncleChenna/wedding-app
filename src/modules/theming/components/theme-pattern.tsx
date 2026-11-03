import type { ActiveThemes } from "../lib/schema";

/**
 * The paper texture behind guest pages. Rendered when either active theme has a pattern; a
 * plain theme resets `--t-pattern-*`, so the layer is invisible in that scheme. Purely decorative.
 */
export function ThemePattern({ themes }: { themes: ActiveThemes }) {
  if (!themes.light.pattern && !themes.dark.pattern) return null;
  return <div aria-hidden="true" data-theme-pattern="" className="theme-pattern" />;
}
